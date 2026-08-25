# Où reprendre

*État au 25 août 2026, après la campagne des six lots. Le harnais de vérification a été supprimé :
ce document ne cite aucune batterie, il dit **ce qu'un utilisateur peut faire**, avec ses codes HTTP
relevés.*

---

## Les lots

**Fusionnés : E, C, P, R, F, I.** **En quarantaine : aucun.**

Cette campagne-ci n'a pas porté d'écrans : elle a réparé les défauts trouvés **à froid sur une
instance neuve** — les sept que le document précédent listait — et le balayage des fuites du jeu de
semence en a ajouté trois que personne n'avait vus.

| Lot | Ce qu'il a rendu atteignable |
|---|---|
| E — cinq cents | Un titre déjà pris propose un suffixe au lieu de rendre **500** : la collision d'identifiant était cherchée à plat, alors que drizzle range l'erreur du pilote sous sa cause, et la boucle de reprise ne repartait jamais. La clé du moteur de recherche absente se dit **au démarrage**, en nommant les variables qui manquent, au lieu de tomber au dix-huitième écran |
| C — périmètre | `/cartographie` n'offre plus que les univers **qui existent en base**, et « Cartographie de l'univers » compose `?perimetre=univers\|{nom}` au lieu d'ouvrir le corpus entier sous un libellé qui promettait cet univers-là |
| P — domaine vide | La section « Accès » et ses pastilles se rendent **sur un domaine sans note** : c'était le seul chemin vers la racine du rangement, donc vers le seul geste d'interface qui crée un dossier. La pastille « Dossiers » est en outre **retirée** à qui ne lit pas la racine — elle était rendue à tout lecteur du domaine et menait en 404. L'adresse nue `…/dossiers` redirige en **308** vers la racine nommée, et n'est plus admise par les quatre actions |
| R — racine | La page de la racine d'un domaine **liste enfin ses sous-dossiers** et porte son nom ; « Renommer ou déplacer » et « Supprimer » sont omis sur la racine, où les deux écritures refusaient muettement. Chaque ligne de note annonce sa vraie ancienneté — `modifications` était servie par le jeu de démonstration, mesuré 74 jours pour une note modifiée le jour même — et une seule date de référence sert la requête |
| F — fuites | Un type de fiche que la constante de semence ne porte pas ne fait plus **lever** la cartographie au clic (500 relevé) ; le panneau « Propriétés » montre les valeurs réelles de `notes.proprietes_typees` au lieu des exemples du jeu. « Voir les notes de … » **lit** le rattachement du compte au lieu de composer son adresse sur un nom — après un renommage, l'adresse composée rendait 404. `/console/exports` n'annonce plus une archive datée du jour où le jeu est figé |
| I — import | Le sélecteur de destination — champ obligatoire — offre les domaines **où l'appelant peut écrire** : il proposait ceux du jeu, toute analyse refusait en **400**, et le refus n'était affiché nulle part. Le rapport d'une simulation dit qu'il est une simulation et n'offre plus trois liens qui rendaient **404**. L'aperçu ne compte plus tout comme neuf sur le rejeu d'un lot déjà importé |

Au passage, la série de contrôles des vues sortait rouge **au hasard** — quatre ou cinq fichiers,
jamais les mêmes — parce que soixante et un serveurs Vite lancés de front dépassaient le budget par
défaut. Aucune assertion n'a bougé, seul le budget s'est élargi.

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Créer une note dont le titre est déjà pris | `POST /notes/nouvelle` → **303**, identifiant suffixé |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer un signet | `POST .../signets/nouveau` → **303** → `/notes/{identifiant}` |
| Modifier un signet | `POST .../signets/{id}/modifier?/enregistrer` → **303** |
| Supprimer un signet | `POST .../signets/{id}/modifier?/supprimer` → **303**, puis **404** |
| Créer un sous-dossier | `POST .../dossiers/{chemin}?/creerSousDossier` → **303** → **200** sur l'enfant, **et l'enfant est listé** |
| Ouvrir le rangement d'un domaine neuf | pastille « Dossiers » → **200** sur la racine nommée |
| Adresse nue d'un rangement | `GET …/dossiers` → **308** → `…/dossiers/{domaine}` |
| Importer un lot | `POST /importer?/analyser` → aperçu conforme au rapport qui suit |
| Simuler un import | rapport annoncé comme simulation, aucun lien, base inchangée |

L'aller-retour du corps est **idempotent** : deux réenregistrements sans frappe rendent un document
identique, et aucune version n'est écrite pour un enregistrement sans changement. L'écriture d'un
import l'est aussi : rejouer le même dépôt met à jour, il ne duplique pas — **et l'aperçu le dit
maintenant avant de le faire**.

Le **produit construit** démarre et sert : `pnpm build` puis `node build/index.js` avec les cinq
variables de base (`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE` — jamais une
URI composée) et les deux du moteur de recherche. Sans ces dernières, **le démarrage refuse de
servir en les nommant**, au lieu de laisser dix-huit écrans en 200 et `/recherche` en 500.

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
| univers, domaine, notes, dossiers | listes, compteurs, santé, modules désactivés qui disparaissent — **les pastilles naviguent, y compris sur un domaine sans note**, et aucune n'est rendue à qui ne peut pas la suivre |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations, périmètres réels, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent, simulation qui n'écrit rien **et qui le dit** |
| console (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |

Relevé au navigateur sur le rangement, chaque pastille CLIQUÉE et le code de sa destination lu :
**8 comptes × 8 domaines, 27 pages ouvertes, 0 entrée morte.**

La connexion fonctionne **sans JavaScript**.

---

## Ce qui ne marche pas — trouvé à l'intégration, sur une instance neuve

Cinq défauts, dans l'ordre où ils coûtent cher. Le premier rend un lien mort, les trois suivants
ferment le chemin des fiches typées, le dernier fait mentir un écran de console.

### 1. `/mon-profil` offre « Voir les notes de {domaine} » ACTIF vers un 404

`src/routes/+layout.server.ts:59-70` (`rangementDuCompte`) et `:237`.

La fonction rend les identifiants du domaine de rattachement du compte **sans vérifier qu'il est
lisible par lui** ; `domaineLisible` est pourtant déjà importé ligne 55. Le commentaire de `:234-236`
dit l'intention — « une entrée qui ne mène nulle part est un lien mort, `P-03` » — mais la garde ne
couvre que « aucun rattachement », pas « rattachement illisible ».

Reproduit : m.durand créé depuis `/console/comptes` (Contributeur, domaine principal Réseau). La
création **n'écrit aucune ligne de droit** (`src/lib/donnees/administration.ts:1527-1556`), le rail
est vide, et `V-25:928` n'inhibe le bouton que si l'adresse est `null`.

```
GET  /mon-profil                            200   bouton rendu sans `disabled`
GET  /univers/production/reseau/notes       404
```

### 2. `/console/exports` annonce une arborescence d'archive que le fichier ne porte pas

`src/vues/V-36.svelte:313-314`.

L'écran affiche `├── rapport-de-conversion.md` et `└── domaine.json`. L'archive téléchargée contient
`rapport-de-conversion.txt` (`src/lib/export/archive.ts:273`, `NOM_DU_RAPPORT`) et **aucun**
`domaine.json`. L'arbre annoncé omet en outre la racine `Réseau/`, sous laquelle l'archive range
tout.

Relevé sur le zip réel :

```
Réseau/ · Réseau/Commutateurs/ · Réseau/Baies/ · Réseau/Baies/baie-a12.md · … · rapport-de-conversion.txt
```

C'est la même famille que le nom d'archive inventé que le lot F a refermé : le **nom** est corrigé,
le **contenu annoncé** ne l'est pas.

### 3. Le sélecteur « Type de fiche » de l'éditeur est INERTE

`src/vues/V-17.svelte:1007`, `src/lib/cablage/formulaires.ts:363-378`,
`src/lib/donnees/creation.ts:208-262` et `:542-559`.

`soumettre()` pose titre, type, domaine, dossier, visibilité, statut, étiquettes et le corps — jamais
la valeur de `#m-fiche`. `lireLaSaisie()` ne déclare aucun champ de fiche. L'insertion n'écrit jamais
`typeDeFicheId`. Vérifié par grep : `typeDeFicheId` n'est écrit que par `src/lib/base/demonstration.ts`
et `src/lib/base/commandes.ts` — la semence et le peuplement —, **par aucune route**.

Conséquence sur une instance neuve : un type de fiche créé en console **ne peut être porté par aucune
note créée dans le produit**, `notes.proprietes_typees` reste toujours vide, et les écrans qui en
vivent — cartographie par type, panneau de propriétés — n'ont jamais de matière. Mesuré : il a fallu
écrire `type_de_fiche_id` en SQL pour pouvoir exercer `/cartographie/par-type`.

### 4. Un type de fiche créé en console est étiqueté « Note » dans la cartographie

`src/lib/graphe/cartographie.ts:77-82` (`TYPE_PAR_DEFAUT`), `:85-87` (`encodageDuType`) et `:91-93`
(`typeCarto`).

`typeCarto()` rend le **nom** du type de fiche ; `encodageDuType()` ne connaît que les sept clés du
gel et retombe sur `TYPE_PAR_DEFAUT`, dont `nom` vaut « Note ».

Relevé sur l'instance neuve, une fiche de type « Commutateur » et une note simple reliées : la barre
« Type maître » de `/cartographie/par-type` rend **deux pastilles rigoureusement identiques** —
losange, code `NOT`, libellé « Note », compteur 1 — dont l'une filtre sur Commutateur et l'autre sur
Note. La vue ne lève plus, le `?? []` du lot F tient ; mais elle ne **nomme** pas le type.

### 5. Le journal des imports affirme garder ce qu'il ne garde pas

`src/routes/importer/+page.server.ts:380-385`.

`/console/imports` affiche « Journal des imports — Les rapports restent consultables indéfiniment, y
compris ceux des lots partiellement en échec », et le tableau reste **vide après trois imports réels**
sur cette instance (relevé : « — »).

L'entrée exigée par `RG-M12-09` est composée puis envoyée à `console.info('[import]', …)` ; aucune
table ne la garde. La lacune est déclarée en commentaire à cette ligne — mais l'écran, lui, affirme
le contraire au lecteur.

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
- **La section « Accès » d'un domaine sort du masquage** (lot P). Le gel masquait le bloc entier sur
  un domaine vide ; dans une maquette aucune pastille ne navigue, dans le produit elle fermait le
  seul chemin vers la création d'un dossier.
- **La racine d'un rangement n'offre ni « Renommer ou déplacer » ni « Supprimer »** (lot R) : les
  deux écritures refusent tout dossier sans parent, et deux boutons morts contredisent `P-03`.
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
