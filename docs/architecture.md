# Référence technique

## Composants

Codicillus est une application SvelteKit rendue côté serveur, avec hydratation Svelte côté navigateur.
L'adaptateur Node produit le serveur placé derrière Caddy. PostgreSQL est la source du contenu,
des comptes, des droits, de l'historique et des réglages. Meilisearch fournit un index reconstructible.

Le service Python de conversion reçoit les fichiers bureautiques et retourne un contenu importable.
Il est optionnel. Aucun service externe n'est requis pour servir les polices ou les ressources de
l'interface. La recherche sémantique n'est pas implémentée dans la version actuelle.

| Dossier | Rôle |
|---|---|
| `src/routes/` | Chargement des données, actions de formulaires, réponses HTTP et navigation |
| `src/vues/` | Vues Svelte et leurs feuilles de style |
| `src/lib/donnees/` | Lecture et écriture des ressources du produit |
| `src/lib/base/` | Connexion PostgreSQL, schéma Drizzle, migrations et commandes |
| `src/lib/droits/`, `src/lib/auth/` | Accès, authentification et sessions |
| `src/lib/contenu/`, `src/lib/edition/` | Format du contenu, conversion et éditeur |
| `src/lib/recherche/` | Projection, filtrage et entretien de l'index |
| `src/lib/graphe/` | Relations, cartographie et modélisation |
| `base/migrations/` | Migrations SQL de montée et de descente |
| `seeds/` | Données fictives de démonstration et données de tests |
| `services/conversion/` | Conversion des fichiers bureautiques |
| `outils/` | Préparation du paquet hors ligne et exploitation |

Les vues reçoivent leurs données des chargeurs. Les données d'exemple ne servent pas de valeur
par défaut à une route : une instance neuve reste vide.

## Modèle du corpus

Un univers contient des domaines. Chaque domaine dispose d'un rangement de dossiers, limité à
dix niveaux. Une note appartient à un domaine et à un dossier ; son identité demeure stable
lorsque le rangement change. Des domaines homonymes peuvent exister dans des univers différents.

Une note possède un type, un contenu Référence et éventuellement un contenu Opérationnel.
Une fiche ajoute un type de fiche et ses propriétés. Les étiquettes sont indépendantes du rangement.
Les relations relient deux notes avec un type de relation ; les liens dans le contenu produisent
également des chemins de navigation et des rétroliens.

Les types, les modules et les modèles de note se gèrent en console. Les dates de vérification,
durées de validité et demandes de révision sont propres aux registres. Les versions conservent
les contenus précédents. Les pièces jointes et les images ont des métadonnées en base et des octets
dans l'entrepôt de fichiers ; les deux font partie de la sauvegarde.

Le schéma dans `src/lib/base/schema.ts` et les migrations SQL détaillent les contraintes.
Les [règles de vivacité](vivacite.md) et les [routes](routes.md) complètent le modèle.

## Droits et sessions

Les rôles de compte sont administrateur, référent, contributeur et lecteur. Les droits de dossier
sont lecteur, rédacteur et gestionnaire. Le droit explicite le plus proche dans l'arborescence
prime ; les autorisations sont résolues côté serveur par `src/lib/droits/resolution.ts`.

Le périmètre anonyme est distinct des comptes authentifiés. Une note interne ou un brouillon
n'est pas rendu public par la connaissance de son adresse. Les routes de ressources appliquent
un refus qui ne révèle pas l'existence d'une ressource inaccessible.

Les mots de passe sont hachés avec Argon2id. Les sessions utilisent un jeton opaque ; seul son
condensat est stocké. Le cookie porte les attributs HttpOnly, SameSite=Lax et Secure.
Caddy est le seul intermédiaire de confiance déclaré pour l'adresse du client.

## Contenu et indexation

Le contenu structuré est stocké en JSON. Le Markdown est un format d'échange ; les formulaires
normalisent leurs fins de ligne avant l'analyse. Les conversions et le rendu conservent les
constructions prises en charge par le schéma de l'éditeur.

L'index de recherche contient une projection des notes et les informations nécessaires au
filtrage par droits. Les écritures mettent à jour cette projection après la transaction de base.
`base:reindexer` reconstruit l'index complet. Une sauvegarde de Meilisearch ne remplace pas celle
de PostgreSQL et des fichiers.

## Interface

`src/socle.css` contient les jetons partagés : typographie, couleurs, espacements et états.
Les vues portent leurs styles propres. Les feuilles sont limitées à leur route afin d'éviter
qu'une navigation ne modifie le style de l'écran précédent avant son remplacement.

Le vocabulaire utilisateur est : note, fiche, registre, univers, domaine, dossier, étiquette,
relation, signet, vivacité, vérifier et console. Référence et Opérationnel désignent les registres.

Les modules d'un domaine commandent les entrées et les écrans accessibles. Une donnée absente
produit un état vide explicite. Une action présentée à l'utilisateur doit être reliée à son
comportement, à une validation et à un résultat compréhensible.

## Configuration et gestion

La connexion PostgreSQL utilise des paramètres séparés, jamais une URI composée avec un mot de passe.
La connexion Meilisearch reçoit séparément l'adresse du moteur et sa clé. Les commandes de base
chargent `.env` ; les services Docker reçoivent les paramètres déclarés dans Compose.

Le service `gestion` contient les mêmes commandes TypeScript que l'exécution locale. Il possède
les dépendances nécessaires dès la construction. Le service `app` contient la construction du
produit et ses dépendances d'exécution. Les images peuvent être exportées puis chargées hors ligne.

Les instructions pratiques et les commandes de validation sont dans [l'installation](installation.md).
