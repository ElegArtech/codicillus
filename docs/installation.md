# Installation

## Prérequis

- Un hôte Linux avec Docker Engine et Docker Compose v2.24 ou ultérieur.
- Les droits nécessaires pour exécuter Docker.
- Une machine et des images de même architecture. Le parcours fourni est vérifié sur Linux x86-64.
- Pour l'installation depuis les sources : Git et un accès aux registres Docker, npm, PyPI,
  aux dépôts Debian et à GitHub pendant la construction.

Sur un serveur sans cet accès, suivre [l'installation hors ligne](hors-ligne.md).
Aucun runtime Node ou Python n'est requis sur le serveur : ils sont embarqués dans les images.

## Installation guidée

```sh
curl -fL https://github.com/ElegArtech/codicillus/releases/download/v1.0.0-rc.2/installer-codicillus.sh -o installer-codicillus.sh && bash installer-codicillus.sh
```

Le script télécharge le kit de cette version, vérifie son empreinte et l'extrait dans un nouveau
dossier `codicillus/`. Il demande l'adresse du site, les informations du premier administrateur
et l'activation éventuelle de la conversion bureautique. Les secrets PostgreSQL et Meilisearch
sont générés localement ; le mot de passe du compte n'est pas affiché pendant la saisie.

Docker doit déjà être installé : le script ne modifie pas les paquets système ni les droits de
votre compte. Il ne remplace pas une installation existante. Un autre dossier peut être donné :
`bash installer-codicillus.sh /chemin/vers/codicillus`.

## Installation avec le kit Compose

Le [kit Compose](https://github.com/ElegArtech/codicillus/releases/download/v1.0.0-rc.2/codicillus-1.0.0-rc.2-compose.tar.gz)
contient tous les fichiers d'installation, sans les images. Il est également possible de télécharger
son fichier `.sha256` depuis la release, puis de le vérifier avec `sha256sum --check`.

```sh
tar -xzf codicillus-1.0.0-rc.2-compose.tar.gz
cd codicillus-1.0.0-rc.2-compose
bash outils/configurer.sh
```

Pour gérer la configuration manuellement, remplacer la dernière commande par :

```sh
cp .env.example .env
# Renseigner .env, puis :
docker compose up -d --wait
```

Le fichier `.env` utilise le format Docker Compose : ne pas l'exécuter avec `source`.

| Variable | Usage |
|---|---|
| `MDP_POSTGRES` | Mot de passe PostgreSQL, sans valeur par défaut |
| `CLE_MAITRE_RECHERCHE` | Clé Meilisearch, au moins 16 octets |
| `ADMIN_IDENTIFIANT` | Identifiant du premier administrateur |
| `ADMIN_NOM` | Nom affiché du premier administrateur |
| `ADMIN_COURRIEL` | Courriel du premier administrateur |
| `MDP_ADMINISTRATEUR` | Mot de passe du premier administrateur, au moins 12 caractères |
| `ADRESSE_SITE` | Adresse du site écoutée par Caddy |
| `ORIGINE_PUBLIQUE` | Origine exacte vue par le navigateur, avec le port éventuel |
| `COMPOSE_PROFILES` | `conversion` pour activer la conversion bureautique ; vide sinon |

Générer deux secrets distincts pour PostgreSQL et Meilisearch, par exemple avec `openssl rand -hex 32`.
Les valeurs d'exemple ouvrent `http://localhost:19080`. Pour un accès depuis un autre poste,
configurer le nom ou l'adresse du serveur dans `ADRESSE_SITE` et `ORIGINE_PUBLIQUE` ; pour un usage
sur le réseau, configurer HTTPS selon la section suivante. Ne jamais versionner `.env`.

Les images versionnées sont publiques sur GitHub Container Registry. Ni compte GitHub ni connexion
à un registre ne sont nécessaires pour les télécharger. `MODE_IMAGES=missing` télécharge une image
absente ; `MODE_IMAGES=never` interdit tout téléchargement pour le parcours hors ligne.

## Premier démarrage

`docker compose up -d --wait` démarre PostgreSQL et Meilisearch, puis le service ponctuel
`initialisation`. Celui-ci applique les migrations, crée le premier administrateur si aucun compte
n'existe et prépare l'index. L'application démarre seulement après son succès.

Une installation neuve ne contient aucun univers, domaine ou contenu de démonstration.
Ouvrir l'adresse publique, se connecter, puis suivre [les premiers pas](utilisation.md).

Retirer `ADMIN_IDENTIFIANT`, `ADMIN_NOM`, `ADMIN_COURRIEL` et `MDP_ADMINISTRATEUR` de `.env`
après le premier démarrage. Les démarrages suivants conservent les comptes et leurs mots de passe,
même si ces variables ont changé. Les comptes suivants se créent dans **Console → Comptes**.

Si l'initialisation échoue, lire `docker compose logs initialisation`, corriger `.env`, puis
relancer `docker compose up -d --wait`. Le service `initialisation` terminé avec un code 0 est
normal : il ne s'agit pas d'un serveur permanent.

## HTTPS

Caddy termine HTTPS. Seuls les ports du frontal sont publiés ; les autres services restent dans le réseau Docker.
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

## Construire les images depuis les sources

Ce parcours sert au développement ou à une construction personnalisée. L'installation standard
utilise directement les images publiées.

```sh
git clone https://github.com/ElegArtech/codicillus.git
cd codicillus
cp .env.example .env
# Renseigner .env, puis :
docker compose -f compose.yaml -f compose.construction.yaml build app gestion conversion
docker compose up -d --wait
```

La construction requiert Git et l'accès aux registres Docker, npm, PyPI, aux dépôts Debian et à GitHub.
`bash outils/preparer-compose.sh` produit un kit sans images ; `bash outils/preparer-hors-ligne.sh`
exporte les images publiées. Ajouter `--construire` à cette dernière commande pour construire les
images depuis les sources locales avant de les exporter.

## Exécution locale avec Node

Pour travailler sur les sources, utiliser Node 24.19 ou ultérieur dans la branche 24 et pnpm 11.22.0.
Les services PostgreSQL et Meilisearch restent nécessaires.

```sh
pnpm install --frozen-lockfile
docker compose -f compose.yaml -f compose.developpement.yaml up -d --wait db recherche
pnpm base:initialiser
pnpm dev
```

Le fichier `compose.developpement.yaml` publie les ports des services sur la boucle locale.
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
