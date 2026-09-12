# Codicillus

**Une base de connaissances auto-hébergée qui rend visible la vivacité de chaque note.**

Codicillus rassemble les procédures, les connaissances techniques et leurs relations dans une
application web. Les équipes peuvent retrouver une information, vérifier qu'elle reste valable
et la mettre à jour sans multiplier les fichiers et les outils.

## Fonctionnalités

- **Vivacité** : cinq états, de « À jour » à « Obsolète », calculés à partir des vérifications
  et de la durée de validité de chaque registre.
- **Deux registres de lecture** : Référence pour le contenu détaillé, Opérationnel pour les étapes à suivre.
- **Organisation** : univers, domaines, dossiers et étiquettes.
- **Graphe de connaissances** : fiches typées et relations qualifiées, cartographie et modélisation.
- **Recherche** : recherche par mots-clés, filtres et palette accessible au clavier.
- **Rédaction** : contenu structuré, tableaux, code, schémas, images et pièces jointes.
- **Historique** : versions, comparaison, restauration et vérifications.
- **Administration** : comptes, droits, types de fiches, types de relations, imports et exports.

Une installation neuve commence vide. L'administrateur crée les univers et les domaines depuis
la console, puis les utilisateurs ajoutent leurs notes.

## Installer

Docker Engine et Docker Compose v2.24 ou ultérieur doivent être installés et accessibles.
Les images fournies sont prévues pour Linux x86-64.

[![Télécharger Codicillus](docs/telecharger.svg)](https://github.com/ElegArtech/codicillus/releases/download/v1.0.0-rc.2/codicillus-1.0.0-rc.2-compose.tar.gz)

Le kit contient Compose, la configuration, les outils d'installation et les guides.
Les images de l'application et de ses services sont téléchargées automatiquement depuis les registres publics.

**Pour être guidé, une seule ligne dans un terminal :**

```sh
curl -fL https://github.com/ElegArtech/codicillus/releases/download/v1.0.0-rc.2/installer-codicillus.sh -o installer-codicillus.sh && bash installer-codicillus.sh
```

L'assistant demande l'adresse du site et les informations du premier administrateur, génère les
secrets techniques, puis démarre les services. Les migrations et la recherche sont préparées
automatiquement. L'installation est placée dans un nouveau dossier `codicillus/`.

Pour configurer le kit vous-même : extraire l'archive, copier `.env.example` en `.env`, renseigner
les valeurs indiquées, puis lancer `docker compose up -d --wait`. Aucune construction ni installation
de Node, Python ou PostgreSQL sur l'hôte n'est nécessaire.

- **[Installation et configuration](docs/installation.md)** : démarrage, HTTPS et construction depuis les sources.
- **[Installation hors ligne](docs/hors-ligne.md)** : [archive complète avec les images](https://github.com/ElegArtech/codicillus/releases/download/v1.0.0-rc.2/codicillus-1.0.0-rc.2-linux-amd64.tar.gz) pour les serveurs sans Internet.
- **[Utilisation](docs/utilisation.md)** : organiser le corpus, rédiger et vérifier les notes.
- **[Exploitation](docs/exploitation.md)** : mises à jour, sauvegardes, restauration et diagnostic.

La conversion bureautique est optionnelle. Sans elle, les imports Markdown et texte restent
accessibles. La recherche sémantique n'est pas disponible dans cette version.

## État de la version

La version `1.0.0-rc.2` est une préversion de la première version stable. Elle permet d'évaluer
l'installation et les usages avant une mise en production. La documentation décrit les
fonctionnalités présentes ; elle ne constitue pas un engagement de support ou de disponibilité.

## Technique

SvelteKit et Svelte, TypeScript, PostgreSQL avec pgvector, Meilisearch et Caddy.
Les polices et les ressources de l'interface sont servies localement.

La [référence technique](docs/architecture.md) décrit les principaux modules et le modèle de données.
Les [routes](docs/routes.md) et les [règles de vivacité](docs/vivacite.md) complètent cette référence.

## Licence

Codicillus est distribué sous [licence MIT](LICENSE). Les dépendances et les ressources tierces
conservent leurs [licences respectives](THIRD_PARTY_NOTICES.md).
