# Installation

## Prérequis

- Un hôte Linux avec Docker Engine et Docker Compose v2.24 ou ultérieur.
- Les droits nécessaires pour exécuter Docker.
- Une machine et des images de même architecture. Le parcours fourni est vérifié sur Linux x86-64.
- Pour l'installation depuis les sources : Git et un accès aux registres Docker, npm, PyPI,
  aux dépôts Debian et à GitHub pendant la construction.

Sur un serveur sans cet accès, suivre [l'installation hors ligne](hors-ligne.md).
Aucun runtime Node ou Python n'est requis sur le serveur : ils sont embarqués dans les images.

## Installation depuis les sources

```sh
git clone https://github.com/ElegArtech/codicillus.git
cd codicillus
cp .env.example .env
```

Configurer `.env` avant de construire ou de démarrer les services. Le fichier utilise le format
Docker Compose, et n'est pas un script shell : ne pas l'exécuter avec `source`.

| Variable | Usage |
|---|---|
| `MDP_POSTGRES` | Mot de passe du compte PostgreSQL, sans valeur fournie par défaut |
| `CLE_MAITRE_RECHERCHE` | Clé Meilisearch, au moins 16 octets |
| `ADMIN_IDENTIFIANT` | Identifiant du premier administrateur |
| `ADMIN_NOM` | Nom affiché du premier administrateur |
| `ADMIN_COURRIEL` | Courriel du premier administrateur |
| `MDP_ADMINISTRATEUR` | Mot de passe du premier administrateur, au moins 12 caractères |
| `ADRESSE_SITE` | Adresse du site écoutée par Caddy |
| `ORIGINE_PUBLIQUE` | Origine exacte vue par le navigateur, avec le port s'il n'est pas standard |

Générer deux secrets distincts pour PostgreSQL et Meilisearch, par exemple avec
`openssl rand -hex 32`. Utiliser des guillemets simples autour d'une valeur contenant `$`, `#`,
un espace ou un antislash. Ne jamais versionner `.env`.

Les valeurs d'adressage fournies ouvrent `http://localhost:19080`, depuis la machine qui héberge
Docker. Cet accès HTTP local permet un premier essai. Pour un usage sur le réseau, configurer
HTTPS selon la section suivante.

Construire les trois images du projet et charger les trois images de services :

```sh
docker compose -f compose.yaml -f compose.construction.yaml build app gestion conversion
docker compose pull --policy always db recherche frontal
```

Le fichier `compose.yaml` exécute uniquement des images déjà présentes. Les téléchargements
ci-dessus sont explicites ; un démarrage ordinaire ne télécharge et ne construit aucune image.

## Initialiser une instance vide

```sh
docker compose up -d --wait db recherche
docker compose run --rm gestion base:migrer
docker compose run --rm gestion base:administrateur
docker compose run --rm gestion base:reindexer
docker compose --profile conversion up -d --wait
```

Pour démarrer sans conversion bureautique, utiliser `docker compose up -d --wait` à la dernière
étape. Le profil `gestion` sert uniquement aux commandes ponctuelles ; il ne lance pas un service
permanent.

Ouvrir l'adresse indiquée par `ORIGINE_PUBLIQUE`, se connecter avec le compte créé, puis suivre
[les premiers pas](utilisation.md). Aucun univers, domaine ou contenu de démonstration n'a été ajouté.

Retirer les quatre variables `ADMIN_*` et `MDP_ADMINISTRATEUR` de `.env` après la création du compte.
La commande de création refuse une instance qui possède déjà un compte. Les comptes suivants
se créent dans **Console → Comptes**.

## HTTPS

Caddy termine HTTPS. L'application est exposée directement uniquement sur la boucle locale.
L'adresse publique doit correspondre exactement à `ORIGINE_PUBLIQUE`, faute de quoi les envois
de formulaires peuvent être refusés.

### Certificat public automatique

Sur un serveur accessible à l'autorité de certification, configurer par exemple :

```dotenv
ADRESSE_SITE=https://notes.example.org
ORIGINE_PUBLIQUE=https://notes.example.org
PORT_HTTP=80
PORT_HTTPS=443
DIRECTIVE_TLS=
COURRIEL_ACME=administration@example.org
```

Le DNS doit pointer vers le serveur et les ports de validation doivent être accessibles.
Ce mode nécessite l'accès aux services de certification ; il ne convient pas à un serveur isolé.

### Certificat fourni par votre organisation

Déposer la chaîne de certificats et la clé privée dans `certificats/`, puis configurer :

```dotenv
ADRESSE_SITE=https://notes.example.org
ORIGINE_PUBLIQUE=https://notes.example.org
PORT_HTTP=80
PORT_HTTPS=443
DIRECTIVE_TLS='tls /etc/codicillus/certificats/site.crt /etc/codicillus/certificats/site.key'
```

Les fichiers doivent s'appeler `site.crt` et `site.key`, être lisibles par Caddy et protégés sur
l'hôte. Les navigateurs doivent faire confiance à l'autorité qui les a émis. Aucun appel à une
autorité externe n'est nécessaire pour servir ce certificat.

### Autorité interne Caddy

Une instance isolée peut également utiliser `DIRECTIVE_TLS='tls internal'` avec une adresse HTTPS.
Caddy émet alors ses certificats localement. Récupérer son certificat d'autorité après démarrage :

```sh
docker compose cp frontal:/data/caddy/pki/authorities/local/root.crt ./autorite-codicillus.crt
```

Distribuer ce certificat via le mécanisme de confiance de l'organisation. Sauvegarder le volume
`caddy_donnees` pour conserver cette autorité. Le guide d'exploitation couvre cette sauvegarde.

### Ports non standards

L'adresse Caddy et l'origine du navigateur sont distinctes lorsque le port de l'hôte change :
par exemple `ADRESSE_SITE=https://notes.example.org`, `PORT_HTTPS=19443` et
`ORIGINE_PUBLIQUE=https://notes.example.org:19443`.

## Exécution locale avec Node

Pour travailler sur les sources, utiliser Node 24.19 ou ultérieur dans la branche 24 et pnpm 11.22.0.
Les services PostgreSQL et Meilisearch restent nécessaires.

```sh
pnpm install --frozen-lockfile
docker compose up -d --wait db recherche
pnpm base:migrer
pnpm base:administrateur
pnpm base:reindexer
pnpm dev
```

Le fichier `.env` fournit aussi les paramètres du développement local. `RACINE_FICHIERS` désigne
un dossier inscriptible, distinct du volume Docker. Ouvrir l'adresse imprimée par Vite, par défaut
`http://localhost:5173`. La conversion nécessite le service `conversion` et `URL_CONVERSION`.

Les commandes de validation sont `pnpm check`, `pnpm test:unit` et `pnpm build`.
`pnpm preview` sert la construction locale ; l'image de production exécute l'adaptateur Node.

## Démonstration

Le produit n'exige aucun jeu de démonstration. `pnpm base:peupler` remplace le corpus par des données
fictives et crée des comptes de démonstration avec un mot de passe connu. L'utiliser exclusivement
sur une instance isolée destinée à la démonstration, jamais sur une installation contenant vos notes.
Les variantes `base:semer` et `base:conformite` servent également aux données d'exemple.
