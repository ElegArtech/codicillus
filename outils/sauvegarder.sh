#!/usr/bin/env bash
# Sauvegarde cohérente de la base et des fichiers ; suspend brièvement l'application.
# Usage : bash outils/sauvegarder.sh [racine-des-sauvegardes]
set -euo pipefail
umask 077
source "$(dirname -- "${BASH_SOURCE[0]}")/commun.sh"
RACINE_SAUVEGARDES=${1:-"$DEPOT_CODICILLUS/.local/sauvegardes"}
mkdir -p "$RACINE_SAUVEGARDES"
RACINE_SAUVEGARDES=$(cd "$RACINE_SAUVEGARDES" && pwd)
JEU=$(mktemp -d "$RACINE_SAUVEGARDES/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
APP_ACTIVE=$(docker compose ps --status running --services app)
relancer() { if [[ -n "$APP_ACTIVE" ]]; then docker compose start app; fi; }
trap relancer EXIT
if [[ -n "$APP_ACTIVE" ]]; then docker compose stop app; fi

dire "Sauvegarde de $BASE_CODICILLUS dans $JEU"
docker compose exec -T db pg_dump -U "$UTILISATEUR_BASE" -d "$BASE_CODICILLUS" \
  --format=custom --no-owner --no-privileges > "$JEU/base.dump"
docker run --rm --pull never --network none --mount "type=volume,src=$VOLUME_FICHIERS,dst=/source,readonly" "$IMAGE_BASE" \
  tar -C /source -czf - . > "$JEU/fichiers.tar.gz"
# L'autorité TLS interne doit être conservée pour garder la confiance des clients.
VOLUME_CADDY=$(volume_de caddy_donnees)
if [[ -n "$VOLUME_CADDY" ]]; then
  docker run --rm --pull never --network none --mount "type=volume,src=$VOLUME_CADDY,dst=/source,readonly" "$IMAGE_BASE" \
    tar -C /source -czf - . > "$JEU/caddy_donnees.tar.gz"
fi
CONFIGURATION=(.env compose.yaml frontal/Caddyfile)
if [[ -d certificats ]]; then CONFIGURATION+=(certificats); fi
tar -czf "$JEU/configuration.tar.gz" "${CONFIGURATION[@]}"

docker compose exec -T db pg_restore --list < "$JEU/base.dump" > /dev/null
tar -tzf "$JEU/fichiers.tar.gz" > /dev/null
(cd "$JEU" && sha256sum ./*.dump ./*.tar.gz > EMPREINTES)
dire "Sauvegarde terminée : $JEU"
