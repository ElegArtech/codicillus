# Ressources et logiciels tiers

La licence MIT de Codicillus couvre son code et sa documentation. Les dépendances et
ressources tierces conservent leurs propres licences et mentions de droits.

## Polices distribuées

Les sous-ensembles latin et latin étendu sont servis localement, sans appel à Google Fonts.

| Famille | Auteur et source | Licence livrée |
|---|---|---|
| Archivo | [The Archivo Project Authors](https://github.com/Omnibus-Type/Archivo), copyright 2020 | [OFL 1.1](static/polices/OFL-archivo.txt) |
| Literata | [The Literata Project Authors](https://github.com/googlefonts/literata), copyright 2017 | [OFL 1.1](static/polices/OFL-literata.txt) |
| JetBrains Mono | [The JetBrains Mono Project Authors](https://github.com/JetBrains/JetBrainsMono), copyright 2020 | [OFL 1.1](static/polices/OFL-jetbrains-mono.txt) |

## Dépendances JavaScript

Les versions sont fixées par `pnpm-lock.yaml`. Les mentions des dépendances de production
sont regroupées dans [les licences JavaScript](static/licences/javascript.txt), également
servies par l'application à `/licences/javascript.txt`. Les fichiers de licence originaux
restent présents dans les paquets installés dans les images Docker.

## Services et outils

PostgreSQL, pgvector, Meilisearch, Caddy, Node.js, Python et les paquets de conversion
conservent leurs licences propres. Les images incluent les notices de leurs distributions
et des paquets installés. Leurs versions sont définies dans `compose.yaml` et les Dockerfile.

Pandoc est un programme distinct, appelé par le service de conversion, sous GPL-2.0-or-later.
Ses [sources et sa licence](https://github.com/jgm/pandoc) sont publiques. Le paquet hors ligne
contient également l'archive des sources correspondant à la version de Pandoc embarquée,
dans `sources-tierces/`, pour accompagner sa redistribution.

Le service de conversion utilise FastAPI (MIT), python-pptx (MIT), pdfplumber (MIT) et
Uvicorn (BSD-3-Clause), ainsi que leurs dépendances Python. Les notices sont livrées avec
ces paquets dans l'image de conversion.
