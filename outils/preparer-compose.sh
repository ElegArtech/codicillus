#!/usr/bin/env bash
# Produit le petit kit d'installation, sans sources ni images Docker.
set -euo pipefail
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json)
SORTIE=${1:-"$DEPOT_CODICILLUS/dist/codicillus-$VERSION-compose"}
[[ ! -e "$SORTIE/.env" && ! -e "$SORTIE/compose.yaml" ]] || { echo 'Choisir un dossier de sortie neuf.' >&2; exit 1; }
mkdir -p "$SORTIE/outils" "$SORTIE/frontal/indisponibilite" "$SORTIE/certificats" "$SORTIE/docs" "$SORTIE/static/polices" "$SORTIE/static/licences"
cp compose.yaml .env.example README.md LICENSE THIRD_PARTY_NOTICES.md "$SORTIE/"
cp docs/{installation,hors-ligne,exploitation,utilisation,architecture,vivacite,routes}.md "$SORTIE/docs/"
cp docs/telecharger.svg "$SORTIE/docs/"
cp frontal/Caddyfile "$SORTIE/frontal/"
cp frontal/indisponibilite/indisponibilite.html "$SORTIE/frontal/indisponibilite/"
cp outils/{configurer,charger-images,sauvegarder,restaurer,commun}.sh "$SORTIE/outils/"
cp static/polices/OFL-*.txt "$SORTIE/static/polices/"
cp static/licences/javascript.txt "$SORTIE/static/licences/"
printf 'Codicillus %s\n\nLancer bash outils/configurer.sh ou suivre docs/installation.md.\n' "$VERSION" > "$SORTIE/LISEZ-MOI.txt"
printf 'Kit Compose prêt : %s\n' "$SORTIE"
