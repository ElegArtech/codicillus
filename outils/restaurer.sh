#!/usr/bin/env bash
# Usage : bash outils/restaurer.sh --eprouver|--pour-de-vrai dossier-de-sauvegarde
set -euo pipefail
MODE=${1:-}
[[ "$MODE" == --eprouver || "$MODE" == --pour-de-vrai ]] && [[ -d ${2:-} ]] || {
  echo 'Usage : restaurer.sh --eprouver|--pour-de-vrai dossier-de-sauvegarde' >&2; exit 1;
}
JEU=$(cd "$2" && pwd)
(cd "$JEU" && sha256sum --check EMPREINTES)
source "$(dirname -- "${BASH_SOURCE[0]}")/commun.sh"

if [[ "$MODE" == --eprouver ]]; then
  BASE_ESSAI="codicillus_restauration_${RANDOM}_${RANDOM}"
  DOSSIER_ESSAI=$(mktemp -d)
  BASE_CREEE=false
  nettoyer() {
    if [[ "$BASE_CREEE" == true ]]; then
      docker compose exec -T db dropdb -U "$UTILISATEUR_BASE" --force "$BASE_ESSAI"
    fi
    rm -rf -- "$DOSSIER_ESSAI"
  }
  trap nettoyer EXIT
  docker compose exec -T db createdb -U "$UTILISATEUR_BASE" "$BASE_ESSAI"
  BASE_CREEE=true
  docker compose exec -T db pg_restore --exit-on-error -U "$UTILISATEUR_BASE" -d "$BASE_ESSAI" \
    --no-owner --no-privileges < "$JEU/base.dump"
  tar -xzf "$JEU/fichiers.tar.gz" -C "$DOSSIER_ESSAI"
  docker compose exec -T db psql -X -v ON_ERROR_STOP=1 -U "$UTILISATEUR_BASE" -d "$BASE_ESSAI" \
    -c 'SELECT count(*) AS notes_restaurees FROM notes;'
  dire 'La base et les fichiers ont été restaurés dans des emplacements temporaires.'
  exit 0
fi

printf 'Cette opération remplace la base %s et ses fichiers.\n' "$BASE_CODICILLUS"
read -r -p 'Taper le nom de la base pour confirmer : ' REPONSE
[[ "$REPONSE" == "$BASE_CODICILLUS" ]] || { echo 'Restauration annulée.' >&2; exit 1; }
docker compose stop app
# En cas d'échec, le service reste arrêté pour permettre une reprise de la restauration.
docker compose exec -T db dropdb -U "$UTILISATEUR_BASE" --if-exists --force "$BASE_CODICILLUS"
docker compose exec -T db createdb -U "$UTILISATEUR_BASE" --owner "$UTILISATEUR_BASE" "$BASE_CODICILLUS"
docker compose exec -T db pg_restore --exit-on-error -U "$UTILISATEUR_BASE" -d "$BASE_CODICILLUS" \
  --no-owner --no-privileges < "$JEU/base.dump"
docker run --rm -i --pull never --network none --mount "type=volume,src=$VOLUME_FICHIERS,dst=/cible" "$IMAGE_BASE" \
  sh -c 'find /cible -mindepth 1 -delete && tar -C /cible -xzf -' < "$JEU/fichiers.tar.gz"
docker compose run --rm --no-deps gestion base:reindexer
docker compose start app
dire 'Base et fichiers restaurés, recherche réindexée, application redémarrée.'
dire 'Configuration et certificats restent ceux de cette installation ; voir docs/exploitation.md pour un nouveau serveur.'
