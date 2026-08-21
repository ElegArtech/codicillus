#!/usr/bin/env bash
# Produit dist/ : le dossier statique à déposer sur un hébergeur de pages.
# À relancer après chaque modification de Main.dc.html ou d'une capture.
#
# La source unique est Main.dc.html — la même toile que celle publiée en
# Artifact. Ce script en extrait la page pour un hébergement classique :
# l'enveloppe `<x-dc>` et le `<helmet>` de l'éditeur de conception n'ont pas de
# sens hors de la toile, le contenu, lui, est le même à l'octet.
set -euo pipefail
cd "$(dirname "$0")"

SRC="Main.dc.html"
rm -rf dist && mkdir -p dist

python3 - "$SRC" <<'PY'
import re, sys, pathlib
source = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
helmet = re.search(r'<helmet>(.*?)</helmet>', source, re.S).group(1)
corps  = re.search(r'</helmet>(.*?)</x-dc>', source, re.S).group(1)
pathlib.Path('dist/index.html').write_text(
  '<!doctype html>\n<html lang="fr">\n<head>\n'
  '<meta charset="utf-8">\n'
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
  '<meta name="robots" content="noindex, nofollow">\n'
  '<title>Codicillus — une documentation dont on sait si elle est encore vraie</title>\n'
  '<meta name="description" content="Base de connaissances documentaire auto-hébergée pour une direction technique. Chaque note affiche si elle est encore digne de confiance.">\n'
  + helmet +
  '</head>\n<body>' + corps + '</body>\n</html>\n',
  encoding='utf-8')
print('  index.html écrit')
PY

cp -f ecran-*.jpg dist/

cat > dist/robots.txt <<'ROBOTS'
User-agent: *
Disallow: /
ROBOTS

# En-tête HTTP : ceinture et bretelles, y compris pour les fichiers non-HTML.
cat > dist/_headers <<'HEADERS'
/*
  X-Robots-Tag: noindex, nofollow
HEADERS

echo "dist/ prêt :"
du -sh dist
