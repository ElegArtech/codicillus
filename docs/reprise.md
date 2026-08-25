# Où reprendre

*État au 25 août 2026. Le harnais de vérification a été supprimé : ce document ne cite aucune
batterie, il dit **ce qu'un utilisateur peut faire**, avec ses codes HTTP relevés.*

---

## Les lots

**Fusionnés : A, C, D, B.** **En quarantaine : aucun.**

| Lot | Ce qu'il a rendu atteignable |
|---|---|
| A — dossier | « Nouvelle note » emporte le dossier d'origine ; `?dossier=` est émis ET honoré, y compris à la racine d'un domaine |
| C — import | Un dossier déposé sur `/console/imports` garde son arborescence |
| D — compteurs | Les facettes des écrans de listage filtrent réellement ; celles des signets ne sont plus décoratives |
| B — droits | « Gérer les droits » d'un dossier ouvre un écran et écrit |

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer un signet | `POST .../signets/nouveau` → **303** → `/notes/{identifiant}` |
| Modifier un signet | `POST .../signets/{id}/modifier?/enregistrer` → **303** |
| Supprimer un signet | `POST .../signets/{id}/modifier?/supprimer` → **303**, puis **404** |
| Créer un sous-dossier | `POST .../dossiers/{chemin}?/creerSousDossier` → **303** → **200** sur l'enfant |

L'aller-retour du corps est **idempotent** : deux réenregistrements sans frappe rendent un document
identique, et aucune version n'est écrite pour un enregistrement sans changement. L'écriture d'un
import l'est aussi : rejouer le même dépôt met à jour, il ne duplique pas.

Le **produit construit** démarre et sert : `pnpm build` puis `node build/index.js` avec les cinq
variables de base (`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE` — jamais une
URI composée).

### Écran par écran — mesuré, pas déclaré

**Tout est à 200 en rédacteur**, et l'écran montre la donnée réelle :

| | |
|---|---|
| accueil | indicateurs, activité, corbeille de révisions, périmètre du compte — **les indicateurs naviguent**, filtrés |
| recherche | résultats réels, facettes, compteurs, pastilles, état vide, périmètre anonyme |
| lecture d'une note | titre, corps rendu, cartouche, sommaire, relations, rétroliens, consultations |
| historique | les vraies versions, ouvert par `?version`, restaurer marche et capture sa version |
| comparaison | modes Texte et Visuel sur les vraies versions, alternative textuelle |
| éditeur | ProseMirror — gras, titres, listes, tâches, tableaux, alertes |
| univers, domaine, notes, dossiers | listes, compteurs, santé, modules désactivés qui disparaissent — **les pastilles de module naviguent**, réduites à leur domaine |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent, simulation qui n'écrit rien |
| console (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |

### Le parcours complet, joué dans un navigateur

```
POST /connexion                                303 → /
POST /notes/nouvelle                           303 → /notes/n-bascule-du-reseau-de-secours
POST /notes/{id}/operationnel?/enregistrer     200      le second registre
POST /notes/{id}/modifier                      303      version capturée
GET  /notes/{id}?version                       200      Version 2 | Version 1
POST /notes/{id}?/deposerPiece                 200      TXT · plan · 15 o
POST /notes/{id}/relations?/ajouter            200      HÉBERGE Coffre hors site
POST …/dossiers/exploitation?/creerSousDossier 303 → …/dossiers/exploitation/bascule-reseau
GET  /recherche?q=bascule                      200      la note y est
POST /notes/{id}?/supprimer                    303 → /univers/production/infrastructure
GET  /notes/{id}                               404
```

La connexion fonctionne **sans JavaScript**.

---

## Ce qui ne marche pas — trouvé à froid, sur une base neuve

Sept défauts, dans l'ordre où ils coûtent cher. Les deux premiers ferment le chemin du produit vide,
qui est le chemin réel d'une installation.

### 1. Un domaine neuf n'offre AUCUNE entrée vers ses modules

`src/vues/V-11.svelte:523`, le bloc « si-peuple », gardes `{#if !vide}` lignes 527 et 532 ; alimenté
par `src/routes/univers/[univers]/[domaine]/+page.server.ts:353`
(`etat: aDesNotes ? 'peuple' : 'vide'`).

La section « Accès » et ses six pastilles — Notes, Dossiers, Fiches, Cartographie, Signets, Carte
mentale — ne sont rendues que si le domaine porte **au moins une note**. Mesuré sur le domaine
« Bureautique » créé vierge : **0 pastille rendue**, et aucun lien de la page ni du rail ne mène à
ses dossiers.

Or l'écran des dossiers est le **seul endroit d'où se crée le premier dossier**. Sur un produit qui
commence vide, le rangement n'est atteignable qu'en tapant l'adresse à la main.

### 2. La page du dossier racine ne liste jamais ses sous-dossiers, et n'affiche pas son nom

`src/vues/V-13.svelte:412` (`noeudDe`) et `:447` (`sousDossiers`), consommés par `:458`
(`const sous`) et `:457` (`const nom`).

Les destinations servies par la route portent des segments **affichés**, dans lesquels la racine
vaut `[]`. `noeudDe([])` sort de sa boucle sans rien trouver et rend `null`, donc `sousDossiers([])`
rend `[]` au lieu des racines de l'arbre.

Reproduit à froid, sur `/univers/production/bureautique/dossiers/bureautique` :

```
POST …?/creerSousDossier  « Suite bureautique »   303 → 200 sur l'enfant
GET  …/dossiers/bureautique                       200   « 0 sous-dossier · 0 note directe »
                                                        « Aucune note, aucun sous-dossier », h1 vide
```

Le dossier qu'on vient de créer est **invisible**, et n'a plus d'accès que par son adresse. Même
symptôme sur Infrastructure, qui annonce « 0 sous-dossier » alors qu'elle porte Serveurs et
Exploitation (vérifié en base).

### 3. Le sélecteur de domaine de destination de l'import propose le jeu de démonstration

`src/routes/importer/+page.svelte:178-187`.

La vue reçoit `vecteur`, `notes`, `lotImport`, `formatsImport`, `domaineParDefaut` — mais **ni
`domaines` ni `univers`**. `src/vues/V-24.svelte:231` retombe donc sur la constante `DOMAINES` de
`seeds/corpus.ts`, et l'option de `:932` les rend. Le chargeur
(`src/routes/importer/+page.server.ts:160-184`) ne rend pas non plus ces deux clés.

Sur une instance qui ne possède que « Production › Infrastructure », l'étape 2 offrait « Production ›
Applications », « Production › Poste de travail », « Projets › Migration 2026 ». Ce n'est pas
cosmétique :

```
POST /importer?/analyser   domaine-cible=Applications   failure 400  {issue: 'domaine-inconnu'}
```

### 4. Le sélecteur de périmètre de la cartographie propose un univers qui n'existe pas

`src/routes/cartographie/+page.svelte:98`.

La route passe `domaines={page.data.domaines}` — le commentaire juste au-dessus documente exactement
ce défaut pour les domaines — **mais pas `univers`**. `src/vues/V-19.svelte:160` retombe sur `UNIVERS`
de `seeds/corpus.ts`, et `:208` (`UNIVERS_PROPOSES`) l'offre.

Sur une base dont la table `univers` ne porte que « Production », `/cartographie` rend
`<option value="univers|Projets">Univers Projets</option>`. Le choisir mène à
`GET /cartographie?perimetre=univers%7CProjets` → **200**, graphe vide, sans jamais dire pourquoi.
`/carte-mentale`, lui, est juste (Tout le corpus, Univers Production, Domaine Infrastructure,
Domaine Réseau).

### 5. Le rapport d'une simulation est indiscernable d'un import réel, et ses liens rendent 404

`src/vues/V-24.svelte:201` (`readonly simulation: boolean`, jamais lu ailleurs dans le fichier),
`:469` (`titreDuBilan`), `:1134` (« dossiers créés dans le domaine »), `:1139`
(`<a href={n.adresse}>`).

La route rend bien `simulation: rapport.simulation`
(`src/routes/importer/+page.server.ts:345`) ; la vue le déclare et ne s'en sert nulle part.

Mesuré, simulation d'un lot inédit `Reseau/Coeur/Liens` : écran « Import terminé — 3 notes créées,
aucun échec / STRUCTURE CRÉÉE : 3 dossiers créés dans le domaine Infrastructure / NOTES CRÉÉES — 3 »,
trois liens vers `/notes/plan-adressage`, `/notes/commutateurs`, `/notes/fibres`.

```
GET /notes/plan-adressage    404      et la base est inchangée
```

Rien à l'écran ne dit que c'était une simulation.

### 6. L'aperçu de l'étape 3 annonce des créations que l'import ne fera pas

`src/vues/V-24.svelte:556` (`const creations`), `:1018` (« notes seront créées ») et `:818`
(« dossier créé »).

L'arborescence et le récapitulatif se dérivent des seuls chemins de fichiers ; `resumeLot()`
(`src/lib/donnees/import.ts:922`) compte les lignes de sort `'note'` sans consulter
`notesDeLaCible`, que `preparerLeLot()` a pourtant chargée.

Sur le rejeu du même dépôt, l'aperçu affiche « 4 notes seront créées / STRUCTURE : 3 dossiers
créés », chaque dossier marqué « dossier créé » — et le rapport qui suit dit « 0 notes créées, 4
mises à jour, 0 dossiers créés ». L'écriture est idempotente ; **c'est l'écran qui ment sur ce qu'il
va faire**.

### 7. « Cartographie de l'univers » ouvre la cartographie du corpus entier

`src/routes/univers/[univers]/cablage.ts:84`
(`ADRESSE_DE_LA_CARTOGRAPHIE = '/cartographie'`) et `:136-139`.

Le bouton de couverture de la page d'un univers navigue vers `/cartographie` **sans**
`?perimetre=univers|{nom}`, alors que son jumeau de la page d'un domaine
(`src/routes/univers/[univers]/[domaine]/cablage.ts`, `adresseAuPerimetreDuDomaine`) pose bien
`?perimetre=domaine|{nom}` — et que le commentaire de ce dernier explique justement que sans
périmètre « le libellé promet Cartographie — Infrastructure et l'écran rend tout Production ».

Mesuré : clic → `/cartographie`, périmètre au défaut, sans réduction.

---

## Un piège de déploiement, pas un défaut d'application

`node build/index.js` démarré avec les cinq seules variables de base sert **dix-huit écrans en 200**
et rend **500 sur `/recherche`** — `RechercheNonConfigureeErreur`, « ni `CLE_RECHERCHE` ni
`CLE_MAITRE_RECHERCHE` ».

L'absence de la clé n'est constatée qu'à la première requête de cet écran, alors que le produit sait
déjà dégrader gracieusement quand le moteur est joignable mais muet (« Recherche par sens
momentanément indisponible »).

Avec `URL_RECHERCHE` et `CLE_RECHERCHE` : `/recherche` → **200**, `/recherche?q=serveur` → **200**.

---

## Ce que le gel dit et que la base ne porte pas

`instance` (version, dernière synchronisation), le résumé d'une version, les utilisations d'un
gabarit, la dernière connexion en relatif, la prose chiffrée de V-34. Tout s'affiche en état neutre
explicite. `arrive_le` et le refus d'un courriel indisponible n'ont **aucun nœud** au gel pour se
dire.

## Divergences avec le gel, assumées

- **`method="post"` sur le formulaire de connexion.** La maquette ne l'écrit pas, faute de serveur.
  Sans lui, une soumission avant hydratation partait en `GET` **avec le mot de passe dans
  l'adresse** — mesuré sur le HTML servi.
- **Deux panneaux rendus atteignables** — l'historique (V-15) et le tiroir de formulaire des comptes
  (V-32) : la règle GELÉE qui les ouvre vise `.app[data-…]` et les panneaux vivent hors de `.app`.
- **Le dépôt et le retrait d'une pièce jointe** : le gel ne les dessine pas.
- **Les confirmations de suppression** sont natives, pas les dialogues de V-40 ; un refus de
  relation est annoncé par une alerte, le gel employant `window.notifier`, que le produit n'a pas.
- **`RG-M04-10` contre `V-40:3295`** : le cahier nomme trois quantités à rappeler, la maquette en
  construit quatre. Les maquettes priment.
- **`P-08`, l'origine d'une relation**, n'a de place dans aucun gel : elle est rendue sur la route
  dédiée.
- **Le repli sur deux lignes de `.droit`** quand un gestionnaire hérite son droit : le gel n'a pas
  ce cas, aucune règle ne réserve la largeur.

---

## Comment on travaille maintenant

Lire `CLAUDE.md` — il tient en une page. En deux mots : **les maquettes sont la référence visuelle,
pas une loi**, et un défaut se répare. La preuve qu'une chose marche est qu'elle marche dans un
navigateur, avec ses codes HTTP relevés — **sur une base vide**, c'est là que les défauts vivent.

```
pnpm dev            le serveur
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires — DOIVENT rester verts
```

Les identifiants de développement vivent dans `.env`, qui est ignoré — jamais dans un fichier
versionné. Pour ouvrir une instance neuve : `pnpm base:administrateur`. Pour un jeu de démonstration
complet : `pnpm base:peupler`.

**Ne reconstruis pas le harnais.** Il pesait 52 000 lignes contre 5 000 lignes de branchement
applicatif, et pendant qu'il grossissait personne ne pouvait créer une note.
