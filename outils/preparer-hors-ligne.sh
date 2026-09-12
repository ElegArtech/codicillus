#!/usr/bin/env bash
# Exporte les images publiées et le kit Compose pour un serveur sans Internet.
set -euo pipefail
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
CONSTRUIRE=false
if [[ ${1:-} == --construire ]]; then CONSTRUIRE=true; shift; fi
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json)
SORTIE=${1:-"$DEPOT_CODICILLUS/dist/codicillus-$VERSION"}
[[ ! -e "$SORTIE/images.tar" && ! -e "$SORTIE/.env" && ! -e "$SORTIE/compose.yaml" ]] || { echo 'Choisir un dossier neuf.' >&2; exit 1; }
export VERSION_CODICILLUS="$VERSION"
export REGISTRE_CODICILLUS=${REGISTRE_CODICILLUS:-ghcr.io/elegartech}
export MDP_POSTGRES=construction-sans-donnees
export CLE_MAITRE_RECHERCHE=construction-sans-donnees
export ADRESSE_SITE=http://localhost
COMPOSE=(docker compose --env-file .env.example -f compose.yaml)
if [[ "$CONSTRUIRE" == true ]]; then
  "${COMPOSE[@]}" -f compose.construction.yaml build app gestion conversion
  "${COMPOSE[@]}" pull --policy always db recherche frontal
else
  "${COMPOSE[@]}" --profile gestion --profile conversion pull --policy always
fi
IMAGES_TEXTE=$("${COMPOSE[@]}" --profile gestion --profile conversion config --images)
mapfile -t IMAGES < <(printf '%s\n' "$IMAGES_TEXTE" | sort -u)
PLATEFORME=$(docker image inspect "$REGISTRE_CODICILLUS/codicillus:$VERSION" --format '{{.Os}}/{{.Architecture}}')
for IMAGE in "${IMAGES[@]}"; do
  [[ $(docker image inspect "$IMAGE" --format '{{.Os}}/{{.Architecture}}') == "$PLATEFORME" ]] || { echo "Architecture incompatible : $IMAGE" >&2; exit 1; }
done
bash outils/preparer-compose.sh "$SORTIE"
SORTIE=$(cd "$SORTIE" && pwd)
printf '\n# Ce paquet fonctionne sans accès au registre.\nMODE_IMAGES=never\nRESEAU_INTERNE=true\n' >> "$SORTIE/.env.example"
mkdir -p "$SORTIE/sources-tierces"
printf 'Codicillus %s\nPlateforme : %s\n\nLire docs/hors-ligne.md.\n' "$VERSION" "$PLATEFORME" > "$SORTIE/LISEZ-MOI.txt"
PANDOC=$(docker run --rm --pull never --network none --entrypoint printenv "$REGISTRE_CODICILLUS/codicillus-conversion:$VERSION" VERSION_PANDOC)
docker run --rm --pull never --entrypoint python -e VERSION_PANDOC="$PANDOC" "$REGISTRE_CODICILLUS/codicillus-conversion:$VERSION" -c \
  'import os,sys,urllib.request,shutil; u="https://codeload.github.com/jgm/pandoc/tar.gz/refs/tags/"+os.environ["VERSION_PANDOC"]; r=urllib.request.urlopen(u,timeout=120); shutil.copyfileobj(r,sys.stdout.buffer)' \
  > "$SORTIE/sources-tierces/pandoc-$PANDOC.tar.gz"
tar -tzf "$SORTIE/sources-tierces/pandoc-$PANDOC.tar.gz" > /dev/null
docker image save --output "$SORTIE/images.tar" "${IMAGES[@]}"
docker image inspect "${IMAGES[@]}" --format '{{.Id}} {{.Os}}/{{.Architecture}} {{range .RepoTags}}{{.}} {{end}}' > "$SORTIE/IMAGES.txt"
(cd "$SORTIE" && sha256sum images.tar sources-tierces/*.tar.gz > SHA256SUMS)
printf 'Paquet prêt : %s\nPlateforme : %s\n' "$SORTIE" "$PLATEFORME"
