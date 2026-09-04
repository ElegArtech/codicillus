#!/usr/bin/env bash
#
# LA SAUVEGARDE DE CODICILLUS — RG-NF-09.
#
# DEUX ÉLÉMENTS, PAS UN DE PLUS : la base PostgreSQL et le volume `fichiers`.
# L'index de recherche se réindexe depuis la base, Caddy réémet ses certificats,
# Ollama retire ses modèles du registre — les sauvegarder serait sauvegarder du
# dérivé, et faire croire qu'on protège plus qu'on ne protège.
#
# UNE ARCHIVE QU'ON N'A PAS RELUE N'EST PAS UNE SAUVEGARDE. Les deux archives
# sont relues juste après leur écriture, par les outils qui les restaureront :
# `pg_restore --list` pour la base, `tar -t` pour les fichiers. Le script sort
# non-zéro si l'une des deux ne se relit pas, et c'est ce code que systemd
# rapporte — une sauvegarde silencieusement vide se voit dans `systemctl status`
# au lieu de se découvrir le jour de la restauration.
#
# Un jeu = un dossier horodaté. La rotation supprime des dossiers entiers : une
# archive ne peut pas survivre à son empreinte, ni l'inverse.
#
# Usage :  sauvegarder.sh [racine]        défaut /var/sauvegardes/codicillus
# Épreuve : outils/restaurer.sh --eprouver
#
set -euo pipefail

DEPOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
RACINE=${1:-/var/sauvegardes/codicillus}

# shellcheck disable=SC1091
set -a && . "$DEPOT/.env" && set +a

PROJET=${NOM_PROJET:-codicillus}
UTILISATEUR=${UTILISATEUR_POSTGRES:-codicillus}
BASE=${BASE_POSTGRES:-codicillus}
# L'image de la base sert aussi d'outil : elle est déjà là, elle porte la même
# version majeure que le serveur, et `pg_dump` n'existe pas sur l'hôte.
IMAGE_PG=$(cd "$DEPOT" && docker compose config --images db | head -1)

horodatage=$(date +%Y%m%d-%H%M%S)
JEU="$RACINE/$horodatage"
dire() { printf '%s  %s\n' "$(date +%H:%M:%S)" "$*"; }

mkdir -p "$JEU"
chmod 700 "$RACINE"
dire "jeu $horodatage — base « $BASE », volume « ${PROJET}_fichiers »"

# ── 1. La base ────────────────────────────────────────────────────────────
# Format custom : compressé, restaurable table par table, relisible sans
# serveur. `--no-owner --no-privileges` pour qu'il se restaure dans n'importe
# quelle base cible — c'est ce qui rend l'épreuve possible sans toucher à la
# production.
(cd "$DEPOT" && docker compose exec -T db \
	pg_dump -U "$UTILISATEUR" -d "$BASE" -Fc --no-owner --no-privileges) >"$JEU/base.dump"
dire "base       $(du -h "$JEU/base.dump" | cut -f1)"

# ── 2. Les fichiers ───────────────────────────────────────────────────────
# Lu depuis le volume nommé, pas depuis le conteneur `app` : la sauvegarde ne
# doit pas dépendre de l'application, qui peut être arrêtée le jour où elle
# compte le plus.
docker run --rm -v "${PROJET}_fichiers:/source:ro" "$IMAGE_PG" \
	tar -C /source -cf - . | zstd -9 -T0 -q -o "$JEU/fichiers.tar.zst"
dire "fichiers   $(du -h "$JEU/fichiers.tar.zst" | cut -f1)"

# ── 3. La relecture ───────────────────────────────────────────────────────
docker run --rm -v "$JEU:/jeu:ro" "$IMAGE_PG" \
	pg_restore --list /jeu/base.dump >"$JEU/INVENTAIRE"
tables=$(grep -c 'TABLE DATA' "$JEU/INVENTAIRE" || true)
zstd -q -t "$JEU/fichiers.tar.zst"
zstd -q -dc "$JEU/fichiers.tar.zst" | tar -tf - >"$JEU/CONTENU"
joints=$(grep -cv '/$' "$JEU/CONTENU" || true)
dire "relu       $tables tables dans le dump, $joints fichiers dans l'archive"

(cd "$JEU" && sha256sum base.dump fichiers.tar.zst >EMPREINTES)
chmod -R go-rwx "$JEU"

# ── 4. La rotation ────────────────────────────────────────────────────────
# Quatorze jours de quotidiennes, puis seulement les jeux du 1er du mois, et
# rien au-delà de six mois. Sur cette instance un jeu pèse quelques mégaoctets :
# la rétention est bornée par le sens, pas par le disque.
maintenant=$(date +%s)
retires=0
while IFS= read -r ancien; do
	nom=$(basename "$ancien")
	jour=$(date -d "${nom:0:4}-${nom:4:2}-${nom:6:2}" +%s 2>/dev/null) || continue
	age=$(((maintenant - jour) / 86400))
	if ((age > 180)) || { ((age > 14)) && ((10#${nom:6:2} != 1)); }; then
		rm -rf "$ancien" && retires=$((retires + 1))
	fi
done < <(find "$RACINE" -mindepth 1 -maxdepth 1 -type d -name '20*' ! -name "$horodatage")

gardes=$(find "$RACINE" -mindepth 1 -maxdepth 1 -type d -name '20*' | wc -l)
dire "rotation   $retires jeu(x) retiré(s), $gardes gardé(s), $(du -sh "$RACINE" | cut -f1) au total"
dire "TERMINÉ    $JEU"
