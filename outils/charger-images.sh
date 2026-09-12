#!/usr/bin/env bash
# Charge uniquement les images du paquet livré ; aucune connexion à un registre.
set -euo pipefail
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
sha256sum --check SHA256SUMS
docker image load --input images.tar
printf '%s\n' 'Images chargées. Continuer avec docs/hors-ligne.md.'
