#!/usr/bin/env bash
# Prépare sur une machine connectée un paquet installable sans registre ni gestionnaire de paquets.
set -euo pipefail
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json)
SORTIE=${1:-"$DEPOT_CODICILLUS/dist/codicillus-$VERSION"}
mkdir -p "$SORTIE"
SORTIE=$(cd "$SORTIE" && pwd)
if [[ -e "$SORTIE/images.tar" || -e "$SORTIE/.env" ]]; then
  echo "Choisir un dossier neuf : $SORTIE contient déjà un paquet ou une configuration." >&2
  exit 1
fi

# La construction ne lit aucun secret de l'installation locale.
export VERSION_CODICILLUS="$VERSION"
export MDP_POSTGRES=construction-sans-donnees
export CLE_MAITRE_RECHERCHE=construction-sans-donnees
export ADRESSE_SITE=http://localhost
COMPOSE=(docker compose --env-file .env.example -f compose.yaml)
"${COMPOSE[@]}" -f compose.construction.yaml build app gestion conversion
"${COMPOSE[@]}" pull --policy always db recherche frontal
mapfile -t IMAGES < <("${COMPOSE[@]}" --profile gestion --profile conversion config --images | sort -u)
PLATEFORME=$(docker image inspect "codicillus/app:$VERSION" --format '{{.Os}}/{{.Architecture}}')
for IMAGE in "${IMAGES[@]}"; do
  [[ $(docker image inspect "$IMAGE" --format '{{.Os}}/{{.Architecture}}') == "$PLATEFORME" ]] || {
    echo "Les images doivent viser la même plateforme ($PLATEFORME) : $IMAGE" >&2
    exit 1
  }
done

mkdir -p "$SORTIE/outils" "$SORTIE/frontal/indisponibilite" "$SORTIE/certificats" "$SORTIE/docs" "$SORTIE/static/polices" "$SORTIE/static/licences" "$SORTIE/sources-tierces"
cp compose.yaml .env.example README.md LICENSE THIRD_PARTY_NOTICES.md "$SORTIE/"
cp docs/{installation,hors-ligne,exploitation,utilisation,architecture,vivacite,routes}.md "$SORTIE/docs/"
cp frontal/Caddyfile "$SORTIE/frontal/"
cp frontal/indisponibilite/indisponibilite.html "$SORTIE/frontal/indisponibilite/"
cp outils/{charger-images,sauvegarder,restaurer,commun}.sh "$SORTIE/outils/"
cp static/polices/OFL-*.txt "$SORTIE/static/polices/"
cp static/licences/javascript.txt "$SORTIE/static/licences/"
printf 'Codicillus %s\nPlateforme : %s\n\nLire docs/hors-ligne.md pour installer ce paquet.\n' "$VERSION" "$PLATEFORME" > "$SORTIE/LISEZ-MOI.txt"

# Sources de la version de Pandoc distribuée avec le service de conversion.
PANDOC=$(docker run --rm --pull never --network none --entrypoint printenv "codicillus/conversion:$VERSION" VERSION_PANDOC)
docker run --rm --pull never --entrypoint python -e VERSION_PANDOC="$PANDOC" "codicillus/conversion:$VERSION" -c \
  'import os,sys,urllib.request; u="https://codeload.github.com/jgm/pandoc/tar.gz/refs/tags/"+os.environ["VERSION_PANDOC"]; r=urllib.request.urlopen(u,timeout=120); __import__("shutil").copyfileobj(r,sys.stdout.buffer)' \
  > "$SORTIE/sources-tierces/pandoc-$PANDOC.tar.gz"
tar -tzf "$SORTIE/sources-tierces/pandoc-$PANDOC.tar.gz" > /dev/null

docker image save --output "$SORTIE/images.tar" "${IMAGES[@]}"
docker image inspect "${IMAGES[@]}" --format '{{.Id}} {{.Os}}/{{.Architecture}} {{range .RepoTags}}{{.}} {{end}}' > "$SORTIE/IMAGES.txt"
(cd "$SORTIE" && sha256sum images.tar sources-tierces/*.tar.gz > SHA256SUMS)
printf 'Paquet prêt : %s\nPlateforme : %s\nTransférer le dossier entier sur le serveur cible.\n' "$SORTIE" "$PLATEFORME"
