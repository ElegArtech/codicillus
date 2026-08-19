# ÉCART-036 — T-003, la composition d'exploitation — 19 août 2026

**Le dernier lot de vague 0, jamais dispatché, et dont tout le back dépend.** Livré, vérifié.

## La preuve qui compte, et elle est plus forte que celle demandée

Le critère de sortie du plan était : *« `docker compose up` ; les cinq services répondent ; arrêt des
deux optionnels sans erreur »*. L'exécutant a fourni cela — et **davantage** :

> **Démarrage à froid sans jamais lancer les optionnels.** `docker compose down`, puis
> `docker compose up -d frontal` : **quatre conteneurs seulement**, produit joignable en TLS,
> code 200.

C'est une preuve d'une autre nature. Arrêter un service prouve qu'on peut s'en passer *après coup* ;
**ne jamais le démarrer prouve qu'il n'est pas dans le chemin critique**. `app` ne les déclare pas
en dépendance : la dégradation est **une propriété du fichier, pas une intention**. Et
`restart: unless-stopped` n'a ressuscité aucun des deux.

C'est `P-10`, `RG-NF-01` et `ADR-009` tenus par construction.

## `RG-NF-10` mesurée, pas décrite

Témoin posé → **503**, `retry-after: 600`, `cache-control: no-store`, page servie **application
arrêtée**. Témoin retiré, application toujours arrêtée → **502** servant la même page, **le code réel
conservé**. Jamais d'erreur brute remontée à l'utilisateur (`RG-NF-06`).

## `RG-NF-09` — deux éléments, et rien d'autre

1. `pg_dump` — contenu, versions, droits, configuration, journaux, vecteurs **et l'état des tâches**,
   la file `pg-boss` vivant dans la base ;
2. le volume des pièces jointes et images.

**Non sauvegardés, et déclarés reconstructibles** : l'index de recherche — il se réindexe depuis la
base, et cette réindexation **vaut test de cohérence** —, les modèles d'embeddings, les certificats.
Les deux commandes ont été **réellement exécutées**, pas décrites.

## La composition refuse de se configurer toute seule

Vérifié par l'orchestrateur : `docker compose config` **échoue** sans fichier d'environnement, en
nommant la variable manquante. Aucune valeur par défaut, **aucun secret au dépôt** — `.env.example`
laisse les deux secrets vides et impose `openssl rand -hex 32`.

C'est le bon comportement : une composition qui démarre sur des valeurs par défaut est une
composition qui part un jour en production avec elles.

## É-1 — Six conteneurs, pas cinq

`STACK §2` écrit « cinq conteneurs, une machine » (C-13) ; `§8` ajoute un serveur frontal. La lecture
retenue : **les cinq sont les briques fonctionnelles, le frontal est la terminaison de connexions
qu'exige le §8**. Aucune brique inventée. À confirmer, sans conséquence.

## É-2 — La page d'indisponibilité n'est décrite par aucune maquette

Ni forme, ni texte, ni canal d'information. `RG-NF-10` l'exige, aucun gel ne la montre. Page
minimale posée, **sans emprunt au système visuel**, motif écrit dans le fichier. Forme et texte
définitifs à T-058, et à arbitrage.

C'est le quatrième manque de maquette du dossier — après l'écran de désambiguïsation (résolu par
ARB-001), le tiroir de petit écran (ARB-010) et les résultats de recherche (`ECART-033`).

## É-3 à É-5 — Décisions d'exploitation, faute de spécification

- **`uvicorn 0.52.4`** : `STACK §3` nomme FastAPI sans nommer le serveur qui la sert. Licence BSD-3,
  compatible `C-11`. À valider.
- **Huit noms de variables applicatives inventés** — aucun document ne les fixe. **T-010 les
  consommera : à confirmer ou renommer avant**, sinon le schéma s'écrira contre des noms provisoires.
- **Deux points d'entrée d'exploitation créés** (`/_sante`, `/sante`), et le frontal sert la page
  d'indisponibilité pour toute défaillance amont **en conservant le code réel**.

## Cinq pièges capitalisés

Portés à `CLAUDE.md` §6 :

1. **PostgreSQL 18 se monte sur `/var/lib/postgresql`, pas `…/data`** — sinon l'image refuse de
   démarrer. Coûté un démarrage raté.
2. **`email {$VAR}` vide est une erreur de syntaxe Caddy** — poser la directive entière ou rien.
3. **Construire l'image applicative exige deux fichiers de `verif/`** : la configuration de
   construction importe le mode démo, qui lit le protocole au chargement du module. Sans eux,
   `vite build` s'arrête. Conséquence à connaître : **l'instrument est dans le chemin de
   construction**, ce que personne n'avait relevé.
4. **Le mot de passe PostgreSQL entre dans une URI** : un `/` ou un `+` issu de base64 ne se voit
   qu'à la première connexion. D'où `openssl rand -hex 32`.
5. **Filtrer `pgrep` sur le répertoire de travail** : jusqu'à onze exécutions du banc tournaient
   simultanément depuis d'autres copies.
