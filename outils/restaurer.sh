#!/usr/bin/env bash
#
# LA RESTAURATION DE CODICILLUS — RG-NF-09, l'autre moitié.
#
# Une sauvegarde qu'on n'a jamais rejouée n'est pas une sauvegarde : c'est un
# fichier dont on espère quelque chose. Ce script est ce qui la rend vraie, et
# il a deux modes.
#
#   --eprouver        rejoue le dernier jeu dans une base JETABLE et un dossier
#                     temporaire, compte ce qui revient, puis efface tout. Ne
#                     touche ni à la base de production, ni au volume, ni à
#                     l'application. À lancer sans rien craindre, y compris en
#                     plein service.
#
#   --pour-de-vrai    la vraie : arrête l'application, remplace la base et le
#                     volume `fichiers` par le contenu du jeu, réindexe la
#                     recherche depuis la base restaurée, redémarre. DÉTRUIT
#                     l'état courant. Demande confirmation.
#
# Usage : restaurer.sh --eprouver [jeu]        [jeu] = un horodatage, défaut le dernier
#         restaurer.sh --pour-de-vrai [jeu]
#
set -euo pipefail

DEPOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
RACINE=${RACINE_SAUVEGARDES:-/var/sauvegardes/codicillus}
MODE=${1:-}

# shellcheck disable=SC1091
set -a && . "$DEPOT/.env" && set +a

PROJET=${NOM_PROJET:-codicillus}
UTILISATEUR=${UTILISATEUR_POSTGRES:-codicillus}
BASE=${BASE_POSTGRES:-codicillus}
IMAGE_PG=$(cd "$DEPOT" && docker compose config --images db | head -1)

dire() { printf '%s  %s\n' "$(date +%H:%M:%S)" "$*"; }
psql_sur() { (cd "$DEPOT" && docker compose exec -T db psql -qAtX -U "$UTILISATEUR" -d "$1"); }

if [[ -n ${2:-} ]]; then JEU="$RACINE/$2"; else
	JEU=$(find "$RACINE" -mindepth 1 -maxdepth 1 -type d -name '20*' | sort | tail -1)
fi
[[ -d ${JEU:-} ]] || {
	echo "aucun jeu de sauvegarde sous $RACINE" >&2
	exit 1
}

dire "jeu        $(basename "$JEU")  —  $(du -sh "$JEU" | cut -f1)"
(cd "$JEU" && sha256sum --quiet -c EMPREINTES) && dire "empreintes les deux archives sont intègres"

# ── L'ÉPREUVE ─────────────────────────────────────────────────────────────
if [[ $MODE == --eprouver ]]; then
	EPREUVE="${BASE}_epreuve"
	DOSSIER=$(mktemp -d)
	# La base d'épreuve et le dossier temporaire s'effacent même en cas d'échec :
	# une épreuve qui laisse des traces finit par en laisser trop.
	nettoyer() {
		psql_sur postgres <<-SQL || true
			drop database if exists "$EPREUVE" with (force);
		SQL
		rm -rf "$DOSSIER"
	}
	trap nettoyer EXIT

	psql_sur postgres <<-SQL
		drop database if exists "$EPREUVE" with (force);
		create database "$EPREUVE";
	SQL
	(cd "$DEPOT" && docker compose exec -T db \
		pg_restore -U "$UTILISATEUR" -d "$EPREUVE" --no-owner --no-privileges) <"$JEU/base.dump"

	dire "── ce qui est revenu dans « $EPREUVE » ──"
	psql_sur "$EPREUVE" <<-SQL | sed 's/|/  /' | sed 's/^/           /'
		select relname || '|' ||
		       (xpath('/row/c/text()', query_to_xml(
		         format('select count(*) as c from %I.%I', schemaname, relname),
		         false, true, '')))[1]::text
		  from pg_stat_user_tables
		 where (xpath('/row/c/text()', query_to_xml(
		         format('select count(*) as c from %I.%I', schemaname, relname),
		         false, true, '')))[1]::text::bigint > 0
		 order by 1;
	SQL
	tables=$(psql_sur "$EPREUVE" <<<"select count(*) from pg_stat_user_tables;")
	migrations=$(psql_sur "$EPREUVE" <<<"select count(*) from migrations_appliquees;")
	dire "base       $tables tables, $migrations migrations appliquées"

	zstd -q -dc "$JEU/fichiers.tar.zst" | tar -C "$DOSSIER" -xf -
	dire "fichiers   $(find "$DOSSIER" -type f | wc -l) fichier(s), $(du -sh "$DOSSIER" | cut -f1) déballés dans $DOSSIER"
	dire "ÉPROUVÉ    la base et les fichiers se rejouent ; l'épreuve est effacée"
	exit 0
fi

# ── LA VRAIE ──────────────────────────────────────────────────────────────
if [[ $MODE == --pour-de-vrai ]]; then
	echo
	echo "  Ceci REMPLACE la base « $BASE » et le volume « ${PROJET}_fichiers »"
	echo "  par le jeu $(basename "$JEU"). L'état courant est perdu."
	echo
	read -r -p "  Taper le nom de la base pour confirmer : " reponse
	[[ $reponse == "$BASE" ]] || {
		echo "abandon." >&2
		exit 1
	}

	cd "$DEPOT"
	dire "arrêt de l'application — rien ne doit écrire pendant la remise en place"
	docker compose stop app

	psql_sur postgres <<-SQL
		drop database if exists "$BASE" with (force);
		create database "$BASE" owner "$UTILISATEUR";
	SQL
	docker compose exec -T db \
		pg_restore -U "$UTILISATEUR" -d "$BASE" --no-owner --no-privileges <"$JEU/base.dump"
	dire "base       restaurée"

	# Le volume est vidé avant d'être regarni : une restauration qui laisse
	# survivre des fichiers absents du jeu ne restaure pas un état, elle en
	# invente un.
	# Par un TUBE, jamais par une chaîne : une archive est binaire, et une
	# here-string la tronque au premier octet nul sans rien dire.
	zstd -q -dc "$JEU/fichiers.tar.zst" |
		docker run --rm -i -v "${PROJET}_fichiers:/cible" "$IMAGE_PG" \
			sh -c 'find /cible -mindepth 1 -delete && tar -C /cible -xf -'
	dire "fichiers   restaurés"

	docker compose start app
	dire "réindexation de la recherche depuis la base restaurée"
	docker run --rm --network "${PROJET}_${PROJET}" \
		-v "$DEPOT":/chantier -w /chantier -e HOME=/chantier/.home_outil \
		-e HOTE_BASE=db -e PORT_BASE=5432 -e UTILISATEUR_BASE="$UTILISATEUR" \
		-e MDP_BASE="$MDP_POSTGRES" -e NOM_BASE="$BASE" \
		-e URL_RECHERCHE=http://recherche:7700 -e CLE_RECHERCHE="$CLE_MAITRE_RECHERCHE" \
		-e RACINE_FICHIERS=/tmp/fichiers \
		node:24.19.0-bookworm-slim node base/base.mjs reindexer
	chown -R 1000:1000 "$DEPOT"
	dire "RESTAURÉ   $(basename "$JEU") est en place"
	exit 0
fi

sed -n '3,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
exit 1
