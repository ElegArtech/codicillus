# Installation sans accès à Internet

L'installation se fait en deux étapes : télécharger le paquet ou construire les images sur une
machine connectée, puis transférer le paquet complet sur le serveur cible. Ce serveur n'a besoin ni d'un accès à npm ou
PyPI, ni d'un accès à Docker Hub, ni de Node ou Python installés sur l'hôte.

Docker Engine, Docker Compose v2.24 ou ultérieur, Bash, tar et les outils GNU usuels, dont
`sha256sum`, doivent déjà être installés sur la machine cible. Leur installation relève du
paquet système ou de l'image système autorisés dans votre organisation.

## 1. Obtenir le paquet sur la machine connectée

### Télécharger le paquet prêt à installer

Depuis la [préversion v1.0.0-rc.2](https://github.com/ElegArtech/codicillus/releases/tag/v1.0.0-rc.2),
télécharger ces deux fichiers dans le même dossier :

- `codicillus-1.0.0-rc.2-linux-amd64.tar.gz` : le paquet complet pour Linux x86-64 ;
- `codicillus-1.0.0-rc.2-linux-amd64.tar.gz.sha256` : son empreinte SHA-256.

Vérifier puis extraire l'archive :

```sh
sha256sum --check codicillus-1.0.0-rc.2-linux-amd64.tar.gz.sha256
tar -xzf codicillus-1.0.0-rc.2-linux-amd64.tar.gz
```

Le dossier `codicillus-1.0.0-rc.2/` est prêt à transférer. Continuer à l'étape 2 :
aucune construction d'image n'est nécessaire.

### Ou construire le paquet depuis les sources

Cloner les sources de la version voulue, puis exécuter :

```sh
bash outils/preparer-hors-ligne.sh
```

Le script récupère les images publiées de Codicillus, de gestion, de conversion, PostgreSQL,
Meilisearch et Caddy, puis exporte les six images dans
`dist/codicillus-1.0.0-rc.2/images.tar`. Il ne copie ni `.env`, ni les données de votre instance.

Le dossier contient aussi Compose, les fichiers de configuration nécessaires, les guides,
les scripts d'exploitation, les notices de licence et les sources de la version de Pandoc livrée.
`IMAGES.txt` indique les identifiants et l'architecture des images ; `SHA256SUMS` permet de
vérifier les archives après transfert.

La préparation exige une machine connectée de la même architecture que le serveur cible.
Le parcours vérifié est Linux x86-64. Prévoir de l'espace pour les images Docker et leur archive :
les deux copies coexistent sur la machine de préparation.

Un autre dossier de sortie peut être donné en argument :

```sh
bash outils/preparer-hors-ligne.sh /chemin/vers/un-nouveau-paquet
```

Ajouter `--construire` pour construire les images depuis les sources locales. Le script utilise
les paramètres d'exemple, indépendamment des secrets locaux.
Si la machine connectée utilise elle-même un proxy, configurer le proxy du daemon Docker et
celui des constructions selon la politique de l'organisation. Ne pas intégrer d'identifiants de
proxy dans les images ni dans le paquet transféré.

## 2. Transférer le dossier entier

Copier le dossier par le moyen autorisé dans l'environnement : support amovible, dépôt interne
ou transfert de fichiers. Il peut être transporté sous forme d'une archive tar.
Ne pas transférer uniquement `images.tar` : Compose et la configuration du frontal sont nécessaires.

## 3. Charger les images sur le serveur cible

Depuis le dossier transféré :

```sh
bash outils/charger-images.sh
cp .env.example .env
```

Le chargement vérifie les empreintes puis exécute `docker image load`. Il ne contacte aucun registre.
Pour une configuration guidée, exécuter `bash outils/configurer.sh` après le chargement des images,
au lieu de copier et remplir `.env` manuellement.

Pour générer les deux secrets manuellement sans installer OpenSSL ou Node sur le serveur :

```sh
docker run --rm --pull never --network none --entrypoint node   ghcr.io/elegartech/codicillus:1.0.0-rc.2   -e "const c=require('node:crypto'); console.log(c.randomBytes(32).toString('hex')); console.log(c.randomBytes(32).toString('hex'))"
```

Reporter les valeurs dans `MDP_POSTGRES` et `CLE_MAITRE_RECHERCHE`, puis remplir les paramètres du
premier administrateur et de l'adresse publique décrits dans [l'installation](installation.md).

Pour HTTPS, utiliser un certificat fourni ou `DIRECTIVE_TLS='tls internal'`. Ne pas choisir la
certification publique automatique sur un serveur sans accès Internet.

`RESEAU_INTERNE=true` isole l'application, la base, le moteur et la conversion des connexions
sortantes. Le frontal conserve un réseau d'accès pour publier HTTP et HTTPS ; ses certificats
doivent être configurés pour fonctionner sans Internet. Dans ce mode, les ports de diagnostic
des services internes ne sont pas publiés : utiliser `docker compose exec` pour y accéder.

## 4. Initialiser et démarrer

```sh
docker compose --profile conversion up -d --wait
```

La composition ne contient aucune instruction de construction et le paquet configure
`MODE_IMAGES=never`. Une image manquante provoque une erreur locale ; Compose ne tente pas de
la télécharger. Les commandes de gestion utilisent les paquets déjà inclus dans leur image.

Ouvrir le site, se connecter, puis créer le premier univers et le premier domaine dans la console.
Retirer ensuite les variables de création du premier compte de `.env`.

## Mettre à jour hors ligne

Préparer un nouveau paquet sur la machine connectée, le transférer et charger ses images.
Conserver la configuration et les volumes de l'installation existante : ne pas écraser `.env`
avec l'exemple du nouveau paquet et ne pas créer une seconde instance par changement de `NOM_PROJET`.

Sauvegarder avant toute migration, reporter la nouvelle `VERSION_CODICILLUS` dans `.env`, puis suivre
la [procédure de mise à jour](exploitation.md#mise-à-jour). Aucun téléchargement n'est nécessaire
sur le serveur cible, y compris pour migrer ou reconstruire l'index de recherche.
