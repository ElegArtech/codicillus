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

L'installation utilise Docker Engine et Docker Compose v2 sur Linux. Node.js, PostgreSQL,
Meilisearch et les outils de conversion sont inclus dans les images.

Le [paquet prêt à installer pour Linux x86-64](https://github.com/ElegArtech/codicillus/releases/tag/v1.0.0-rc.1)
contient les six images Docker et les fichiers nécessaires à une installation hors ligne.

- **[Installation](docs/installation.md)** : configuration, démarrage et premier administrateur.
- **[Installation hors ligne](docs/hors-ligne.md)** : télécharger le paquet ou préparer les images,
  les transférer et installer sans accès aux registres ni aux gestionnaires de paquets.
- **[Utilisation](docs/utilisation.md)** : organiser le corpus, rédiger et vérifier les notes.
- **[Exploitation](docs/exploitation.md)** : mises à jour, sauvegardes, restauration et diagnostic.

Le service de conversion bureautique est optionnel. Sans lui, l'import Markdown et texte reste
accessible. La recherche sémantique n'est pas disponible dans cette version.

## État de la version

La version `1.0.0-rc.1` est une préversion de la première version stable. Elle permet d'évaluer
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
