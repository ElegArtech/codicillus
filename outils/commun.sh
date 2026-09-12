#!/usr/bin/env bash
# Paramètres de l'installation lus dans les conteneurs gérés par Compose.
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
CONTENEUR_BASE=$(docker compose ps -q db)
[[ -n "$CONTENEUR_BASE" ]] || { echo 'Le service db doit être démarré.' >&2; exit 1; }
PROJET_CODICILLUS=$(docker inspect "$CONTENEUR_BASE" --format '{{index .Config.Labels "com.docker.compose.project"}}')
IMAGE_BASE=$(docker inspect "$CONTENEUR_BASE" --format '{{.Config.Image}}')
UTILISATEUR_BASE=$(docker compose exec -T db printenv POSTGRES_USER < /dev/null)
BASE_CODICILLUS=$(docker compose exec -T db printenv POSTGRES_DB < /dev/null)
volume_de() {
  docker volume ls -q --filter "label=com.docker.compose.project=$PROJET_CODICILLUS" --filter "label=com.docker.compose.volume=$1"
}
VOLUME_FICHIERS=$(volume_de fichiers)
[[ -n "$VOLUME_FICHIERS" ]] || { echo 'Le volume fichiers doit exister.' >&2; exit 1; }
dire() { printf '%s\n' "$*"; }
