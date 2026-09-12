# Routes et navigation

Les segments entre accolades désignent des identifiants ou des chemins du corpus.
Les autorisations sont contrôlées côté serveur ; l'existence d'une route n'accorde aucun droit.

## Accès et compte

| Route | Usage |
|---|---|
| `/` | Accueil public ou accueil du compte connecté |
| `/connexion` | Connexion et retour vers la destination demandée |
| `/deconnexion` | Fermeture de la session |
| `/mot-de-passe-oublie` | Indications de récupération d'accès |
| `/mon-profil` | Informations du compte et changement de mot de passe |
| `/indisponibilite` | Indisponibilité applicative |

Une session expirée renvoie vers la connexion. Les destinations de retour restent internes au site.
Les adresses non résolues et les ressources inaccessibles sont traitées selon leur périmètre ;
une note privée ne révèle pas son existence par un message différent de celui d'une note absente.

## Corpus

| Route | Usage |
|---|---|
| `/univers/{univers}` | Univers et domaines qu'il contient |
| `/univers/{univers}/{domaine}` | Vue d'ensemble du domaine |
| `/univers/{univers}/{domaine}/notes` | Liste des notes du domaine |
| `/univers/{univers}/{domaine}/dossiers/{chemin}` | Dossier et contenu accessible |
| `/notes/nouvelle` | Création d'une note |
| `/notes/{identifiant}` | Lecture d'une note |
| `/notes/{identifiant}/modifier` | Édition du contenu |
| `/notes/{identifiant}/operationnel` | Registre Opérationnel |
| `/notes/{identifiant}/historique` | Versions et événements |
| `/notes/{identifiant}/comparaison` | Comparaison de versions |
| `/notes/{identifiant}/relations` | Relations de la note |
| `/notes/{identifiant}/images` | Dépôt d'images autorisé |
| `/notes/{identifiant}/pieces-jointes/{fichier}` | Pièce jointe, avec contrôle des droits |
| `/guides/{identifiant}` | Lecture d'un guide accessible publiquement |

L'identifiant de note ne dépend pas de son rangement. La navigation des domaines inclut toujours
l'univers, ce qui permet les domaines homonymes. Les dossiers peuvent être imbriqués jusqu'à dix niveaux.

## Recherche et exploration

| Route | Usage |
|---|---|
| `/recherche` | Résultats et filtres adaptés au compte |
| `/recherche/palette` | Résultats de la palette de recherche |
| `/cartographie` | Exploration des relations |
| `/cartographie/par-type` | Cartographie par type |
| `/modelisation` | Modélisation des relations |
| `/carte-mentale` | Exploration sous forme de carte mentale |
| `/univers/{univers}/{domaine}/signets` | Signets du domaine |
| `/univers/{univers}/{domaine}/signets/nouveau` | Création d'un signet |
| `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` | Modification d'un signet |
| `/importer` | Import et choix du rangement |

Les filtres et tris des listes sont portés par l'adresse pour permettre leur partage et le retour
arrière. Un module désactivé n'est plus proposé dans le domaine. Les liens vers une note conservent
son identité même après déplacement.

## Console

L'accès à `/console` et à ses sections est réservé à l'administrateur.

| Route | Usage |
|---|---|
| `/console/univers` | Univers |
| `/console/domaines` | Domaines et modules |
| `/console/types-de-note` | Types de note |
| `/console/types-de-fiches` | Types et propriétés des fiches |
| `/console/types-de-relations` | Types de relations |
| `/console/templates` | Modèles de note |
| `/console/comptes` | Comptes et rôles |
| `/console/configuration` | Réglages de l'instance |
| `/console/analytique` | Indicateurs |
| `/console/imports` | Historique des imports |
| `/console/imports/{lot}` | Résultat d'un import |
| `/console/exports` | Exports de contenu |
| `/console/exports/{univers}/{domaine}` | Téléchargement d'un export de domaine |
| `/bibliotheque` | Composants de l'interface |
| `/bibliotheque/vivacite` | Présentation des états de vivacité |

Les détails de paramètres et d'actions sont définis par les fichiers `+page.server.ts` et
`+server.ts` correspondants dans `src/routes/`.
