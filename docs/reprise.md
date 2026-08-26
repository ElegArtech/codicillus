# Où reprendre

*État au 26 août 2026, après la campagne **« le produit ne parle plus au nom d'une autre »**. Le
harnais de vérification reste supprimé : ce document ne cite aucune batterie, il dit **ce qu'un
utilisateur peut faire**, avec ses codes HTTP relevés.*

À la clôture : `pnpm check` **= 0**, `pnpm test:unit` **= 0** — 1 743 contrôles sur 72 fichiers. Les
dix-huit bases de lot et de vérification ont été détruites — il ne reste que `codicillus`
(développement) et `codicillus_demo` —, et treize des quatorze copies de travail du pilote ont été
retirées. **La quatorzième est restée : sa branche n'est pas fusionnée**, et ce qu'elle porte est dit
plus bas.

---

## Les lots

**Fusionnés : S, P, R, C, N, A, 7.** **En quarantaine : aucun.**

La campagne précédente avait réécrit la phrase de `CLAUDE.md` qui prescrivait le défaut — propriété
optionnelle, défaut tiré de `seeds/corpus.ts` — et posé la règle ESLint qui l'interdit. **Celle-ci
consomme la consigne** et ferme les trois choses que la règle ne peut pas voir :

- un littéral n'est pas un import — « Direction technique » et quarante pluriels en dur ne passaient
  par aucun spécificateur, `no-restricted-imports` en est **structurellement aveugle** ;
- une valeur par défaut ne s'élague pas — l'arborescence du gel, la pierre tombale de V-26, les
  32 notes du corpus partaient **dans le paquet du navigateur** sans qu'aucun écran ne les rende ;
- ce qu'aucun test de rendu ne peut voir, seuls deux contrôles de bout en bout le voient — et le lot
  7 les a écrits.

**La leçon de cette campagne :**

> Une règle interdit une **forme**. Elle ne garde rien contre le même défaut écrit sous une autre
> forme. La descente du jeu par un `import` est fermée depuis la campagne précédente ; celle par un
> **littéral recopié**, par une **valeur par défaut** et par une **branche morte embarquée** ne l'était
> pas, et c'est là qu'elle vivait encore. Les deux contrôles du lot 7 ne vérifient pas la même
> propriété : l'un regarde **ce qui s'affiche**, l'autre **ce qui se livre**.

| Lot | Ce qu'il a rendu vrai |
|---|---|
| S — capacité | **Deux capacités posées, non consommées.** `nom_organisation` rejoint les sept clés de `parametres` — magasin clé/valeur, aucune migration —, défaut **chaîne vide**, descente par le gabarit racine dans la même requête que les deux autres. « Direction technique » n'est pas une donnée du jeu : c'est le **segment de marché du cadrage**, soudé dans une signature que toute autre organisation lit comme un fait sur SON instance. Le nom du logiciel, « Codicillus », reste en dur — c'est la soudure entre les deux qu'on défait. Et `accord(n, singulier, pluriel?)` rejoint `pluriel()` dans `vocabulaire.ts` : elle rend **le nom seul**, le formatage du nombre est un autre métier ; le zéro rend le singulier. À la reprise : le champ `c-organisation` existait dans la table des champs sans qu'aucun `input` le porte — « Enregistrer » **posait `nom_organisation = ''` à chaque clic**, mesuré au navigateur sur les deux versions |
| P — écrans publics | `/guides/{identifiant}` disait « Vérifié à l'instant » d'une note dont `verifie_le` est NULL, quand `/notes/{identifiant}` disait « Jamais vérifiée » de la **même** note : `fraicheur.ts` portait la branche, la vue ne lui passait pas la date de contrôle, et la propriété étant optionnelle **aucun compilateur ne rougissait**. Le même écran portait, dans une branche que la route n'emprunte jamais, l'article entier de la maquette — **17 755 → 9 091 octets** sur le paquet de la seule route publique. L'accueil public comptait « vérifiés il y a moins d'un mois » sur un niveau qui retombe sur la date de modification. À la reprise : les deux écrans d'entrée **fabriquaient une faute d'accord sur tout nom d'organisation** — « Documentation de Mairie de Sainte-Foy ». Un nom d'organisation n'apporte pas son article et rien ne permet de le deviner : il est juxtaposé, « Documentation · X », comme le pied le fait déjà |
| R — coquille et rail | `droits` était une propriété de vue et **quatre vues sur trente-quatre la passaient** : sur les trente autres, « Nouvelle note » et « Importer des fichiers » étaient émises à qui ne peut écrire nulle part, et le 404 servi était V-26, qui propose « Créer la note » vers `/notes/nouvelle` — **une boucle**. `Coquille.svelte` lit `page.data.ecriture`, le verdict du gabarit racine : une source, pas trente-quatre transmissions. L'arborescence du gel était la **valeur par défaut** de `railAbregeRendu()` et partait dans tout chunk montant une coquille. La durée de recherche était `Math.max(0.09, 0 / 1000 + 0.31)` : Meilisearch rend `processingTimeMs`, et `null` quand aucune requête n'est partie. À la reprise : la forme abrégée gardait « Gestion › Console » sur `ecriture`, donc **servie à tout rédacteur** — qui reçoit 404 — et **retirée à l'administrateur d'une instance neuve** — qui reçoit 200. La garde passe sur `admin`, et la classe suit la garde |
| C — console et bibliothèque | `/bibliotheque` montait V-41 avec trois propriétés manquantes dont le défaut était une constante importée **en valeur** : les 32 notes du jeu partaient dans un chunk de **57 Ko servi comme fichier statique**, atteignable par qui reçoit 404 sur la page. Les sept sources sont exigées ; le chunk tombe à 39 Ko, et **l'exemption ESLint de V-41 est retirée**. Avec : V-20 et ses deux identifiants d'axe, « → Infrastructure » de V-24, six exemples de saisie coïncidant mot pour mot avec le jeu, `creerUnDomaine`/`modifierUnDomaine` qui résolvaient l'univers par son **nom**, « Les — notes » sur zéro gabarit, et un registre de lacunes qui **mentait** — la migration 006 porte bien une table de consultations horodatées. À la reprise : cinq griefs, dont « barman » encore servi, et une aide qui **promettait un rendu inexistant**. Les exemples des sept consoles sont désormais confrontés aux noms des **deux** jeux de semence par un contrôle, aucun n'est recopié à la main |
| N — note et éditeur | `V-17.svelte` écrivait **au balisage** le corps repris en modification : l'extrait d'une procédure de démonstration qui n'était pas la sienne, sur **chaque** note — flash avec JavaScript, contenu **permanent sans lui**. `corps` devient requise, servie par les deux routes. Avec : le panneau « Statistiques indisponibles » de V-14, rendu **sans condition** au-dessus d'un compteur qui fonctionne, et son bouton « Réessayer » inerte — la panne n'étant pas détectable, le correctif est le **retrait**, et `mockups/V-14` a été amendée du même geste ; le panneau « Position » qui omettait `revise` ; et `CorpsReference`/`CorpsOperationnel` qui embarquaient 30 Ko de corps de démonstration **sans être rendus nulle part**. À la reprise : une note créée sans corps se rouvrait sans son invite d'amorçage — le chargeur lisait `corps.existe` (« la colonne n'est pas NULL ») là où il fallait `corps.redige` (« porte du texte »), et `creerUneNote()` n'écrit jamais NULL |
| A — accords | Le motif retiré est celui d'un accord **écrit à la main, à chaque fois, sur place** : six helpers locaux — dont **deux homonymes de signatures inverses** —, cinq tables de ternaires recopiées, quarante ternaires inline. Les trois tables `PARTS` de V-07, V-10 et V-11 étaient triplées au caractère près ; leur colonne « pluriel » n'était qu'un `+s`, elle disparaît. `V-13:497` **n'était pas un accord** — c'est un pluralisateur de nom de type, et le confondre était le contresens qui guettait. Les accords **en cascade** — article, participe, possessif, pronom, verbe — sont traités en entier : « Les 1 fichiers en échec sont listés […] ils n'ont bloqué » aurait été faux quatre fois pour un `+s`. **Un article ne s'accorde pas seul devant un chiffre**, et c'est le navigateur qui l'a dit : `/console/templates` sur une instance neuve rendait « La 0 note déjà créée ». À la reprise : `fraicheur.ts:306` rendait « Vérifié il y a **1 jours** » — le libellé long, source unique du signal de fraîcheur que quinze vues rendent, traversé par **toute note vérifiée hier** —, et `messageSeuilNonCroissant()` répétait la faute dans le même nœud après « Enregistrer » |
| 7 — garde-fous | **Deux contrôles, et ils ne vérifient pas la même propriété.** `passage-a-froid.mjs` regarde **ce qui s'affiche** : il détruit sa base, la recrée, migre, **ne sème rien**, crée le premier administrateur, crée à la console un univers, un domaine, deux notes et un signet — tous nommés hors du jeu —, puis ouvre les **trente-neuf routes** dans Chromium, en session **et** en anonyme, et lit **le HTML servi** autant que le rendu hydraté. `aiguilles-dans-le-paquet.mjs` regarde **ce qui se livre** : une branche morte ne s'affiche nulle part et part quand même chez le lecteur, et **aucun test de rendu ne la verra jamais**. La liste des aiguilles **n'est pas recopiée, elle est produite par sa source** — `aiguilles-du-corpus.mjs` lit `seeds/corpus.ts` par `ssrLoadModule` : ajouter une note au jeu ajoute son identifiant et son titre aux aiguilles sans que personne y pense. 111 aiguilles. Les exemptions nomment chacune sa vue, son lot et ce qui la retirerait, et **elles expirent seules** : une exemption qui ne trouve plus rien fait **échouer** le contrôle. Le passage mesure **le produit construit**, pas `vite dev` |

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Créer une note dont le titre est déjà pris | `POST /notes/nouvelle` → **303**, identifiant suffixé |
| Créer une note de type fiche | le type choisi fait apparaître ses champs, le type de note bascule sur « Fiche », et `type_de_fiche_id` **et** `proprietes_typees` sont posés en base |
| **Omettre une propriété obligatoire** | `POST /notes/nouvelle` → **400**, les propriétés manquantes **nommées**, le refus posé à l'endroit du champ, et le brouillon **conservé** |
| **Rouvrir une note créée sans corps** | la zone rend `data-vide="oui"` et **l'invite d'amorçage**, JavaScript coupé |
| Rouvrir une fiche en modification | le type et ses valeurs sont restitués ; vider le type met les deux colonnes à `null` dans la même mise à jour |
| **Relire une fiche** | les propriétés typées s'affichent en lecture, et la pastille dit « Fiche Serveur », plus « Fiche » seul |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée, **et le corps servi est celui de la note** |
| **Ouvrir une version antérieure** | `GET /notes/{id}?version={n}` → **200**, et le corps rendu **est celui de la version annoncée** ; « Restaurer » écrit ce que l'écran a montré |
| Dépasser le plafond de versions | plafond à 3, six enregistrements → il reste exactement les **trois dernières** |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer / modifier / supprimer un signet | `POST .../signets/…` → **303**, puis **404** sur le supprimé |
| Créer un sous-dossier | `POST .../dossiers/{chemin}?/creerSousDossier` → **303** → **200** sur l'enfant, **et l'enfant est listé** |
| Adresse nue d'un rangement | `GET …/dossiers` → **308** → `…/dossiers/{domaine}` |
| **Suivre un lien mort** | `GET /notes/inexistante-xyz` → **404** annonçant **l'adresse demandée**, et « Créer la note » propose **ce titre-là** |
| **Ouvrir la cartographie** | `GET /cartographie` → **200** sur **le corpus entier**, quel que soit le nom des univers de l'instance |
| Demander un mot de passe oublié | `GET`/`POST /mot-de-passe-oublie` → **200**, écran unique qui nomme le chemin réel, **sans révéler si le compte existe** |
| **Nommer son organisation** | `POST /console/configuration?/enregistrer` avec `c-organisation` → la valeur est écrite, relue, et les cinq pieds publics et `/connexion` la portent |
| **Lire un compte juste** | « 1 note », « 2 notes », « dans 1 domaine », « Vérifié il y a 1 jour » — dix-sept écrans parcourus **deux fois**, à un puis à deux |
| Créer un compte en console | le mot de passe initial **doit** être changé, sauf mot de passe verrouillé |
| Créer un type de fiche en console | description, icône, aide, valeur par défaut et caractère obligatoire **survivent au rechargement** |
| Importer un lot | `POST /importer?/analyser` → aperçu conforme au rapport, et le contenu atterrit dans le **domaine choisi** |
| Exporter un domaine | l'arborescence annoncée par l'écran coïncide **entrée par entrée** avec le zip produit |

L'aller-retour du corps est **idempotent** : deux réenregistrements sans frappe rendent un corps
identique, et aucune version n'est écrite pour un enregistrement sans changement. L'écriture d'un
import l'est aussi : rejouer le même dépôt met à jour, il ne duplique pas.

Le **produit construit** démarre et sert : `pnpm build` puis `node build/index.js` avec les cinq
variables de base (`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE` — jamais une
URI composée) et les deux du moteur de recherche. Sans ces dernières, **le démarrage refuse de
servir en les nommant**. La connexion fonctionne **sans JavaScript**.

**Le premier administrateur peut écrire sans `psql`.** `droits_de_dossier` vide, `RG-DRO-03`
(`src/lib/droits/resolution.ts:271`) lui rend `gestionnaire` sans lire la table : `GET
/notes/nouvelle` → 200, `POST /notes/nouvelle` → 303, `POST …?/creerSousDossier` → 303. C'est la
seule question qui compte à l'installation, et la réponse est oui — voir le défaut n° 13, qui retire
l'affirmation contraire du dépôt.

### Écran par écran — mesuré, pas déclaré

**Tout est à 200 en rédacteur**, et l'écran montre la donnée réelle :

| | |
|---|---|
| accueil | indicateurs, activité, corbeille de révisions, périmètre du compte — les indicateurs naviguent, filtrés. *L'écran d'amorçage d'une base vide, lui, est inatteignable : défaut n° 4* |
| recherche | résultats réels, facettes, compteurs, pastilles, état vide, périmètre anonyme, **et une durée mesurée** |
| lecture d'une note | titre, corps rendu, cartouche, relations, rétroliens, consultations, les propriétés typées de la fiche, et le sommaire des titres de la note écrite dans le produit |
| historique | les vraies versions **de la vraie note**, ouvert par `?version` sur **le corps de cette version**, restaurer marche et capture sa version |
| comparaison | modes Texte et Visuel sur les vraies versions, alternative textuelle |
| éditeur | ProseMirror — gras, titres, listes, tâches, tableaux, alertes — les propriétés du type choisi, leur aide, leur défaut, et le refus des manquantes |
| univers, domaine, notes, dossiers | listes, compteurs, santé, modules désactivés qui disparaissent — les pastilles naviguent, et aucune n'est rendue à qui ne peut pas la suivre |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations **dès l'ouverture**, chaque type nommé, de forme et de code distincts, périmètres réels, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent dans le domaine choisi, simulation qui n'écrit rien et qui le dit |
| console (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |
| bibliothèque | à zéro donnée : aucune des dix-sept aiguilles, aucune chronologie, un sélecteur à cinq types **du produit** |

---

## Ce qui ne marche pas — trouvé à l'intégration, sur une instance neuve

Quatorze constats, dans l'ordre où ils coûtent cher. **Les trois premiers servent encore du jeu de
démonstration** ; le quatrième et le cinquième ferment la porte à qui vient d'installer ; les trois
suivants sont des accords que le lot A a manqués ; les trois d'après voyagent dans le paquet du
navigateur ; le onzième dit pourquoi les contrôles n'ont rien vu.

### 1. `/importer` sert deux noms de dossier du jeu de démonstration

`src/vues/V-24.svelte:422`, `:424`, `:426`. L'illustration du scénario d'import rend :

```
Exploitation/                       ← chemins de dossier du corpus de démonstration
  Sauvegardes/                        (seeds/corpus.ts:527, :567, :628…)
    Restauration.docx

→ Domaine Intégration               ← cible bien câblée
   └ **Exploitation**               ← EN GRAS, côté PRODUIT de la flèche
      └ **Sauvegardes**
         └ Restauration
```

La cible de la flèche est juste. Les deux noms **en gras, du côté produit**, restent ceux du jeu :
l'écran montre à l'installateur des dossiers que son domaine ne porte pas. Mesuré **×2 chacun** dans
le HTML servi de `GET /importer` → 200, et embarqué dans
`build/client/_app/immutable/nodes/21.R7eDF20N.js`. Le commentaire de `V-24:404-412` déclare le cas
tranché par le lot C — « les deux dossiers de gauche restent ce qu'ils sont » — **mais ils ne sont
pas seulement à gauche : ils sont rendus deux fois à droite.**

### 2. Le nom de l'organisation reste soudé dans l'éditeur

`src/vues/V-17.svelte:1004` : « Consultable par les comptes de **la direction technique**. », écrit
en dur sous le sélecteur de visibilité.

```
POST /console/configuration?/enregistrer   c-organisation=Mairie de Trifouilly
GET  /notes/nouvelle    200   « Mairie de Trifouilly » au pied
                              « la direction technique » dans cette aide   ← MÊME écran
```

Servi aussi sur `/notes/{id}/modifier`, et livré dans le chunk
`build/client/_app/immutable/chunks/Dra91zX-.js`. Le lot S a câblé huit vues ; celle-ci porte la
phrase **sous une autre forme** — nom commun en casse basse — et a échappé au balayage.

### 3. Même défaut sur l'écran des signets

`src/vues/V-22.svelte:460` : « Les sites externes ne sont pas maintenus par **la direction
technique** et peuvent avoir changé depuis leur enregistrement. » Mesuré dans le HTML servi de `GET
/univers/univers-integration/domaine-integration/signets` → 200, et livré dans
`build/client/_app/immutable/nodes/36.BjSxM6px.js`.

### 4. L'écran d'amorçage de l'accueil est inatteignable, sur toute instance et pour toujours

`src/routes/+page.svelte:23` (`vecteur={null}`) et `src/vues/V-07.svelte:308`
(`etatPage = String(reglage['etat'] ?? 'nominal')`). La feuille ne connaît que deux règles
(`src/vues/V-07.css:415-416`) :

```
.app[data-etat="vide"] .si-peuple  { display: none }
.app:not([data-etat="vide"]) .si-vide { display: none }
```

`src/routes/+page.server.ts` ne pose **aucun vecteur**, donc `data-etat="nominal"` est servi
**toujours** — mesuré identique sur la base à 0 note et sur la base à 4 notes. Conséquence : le bloc
« Votre base est vide / Rien n'a encore été écrit ni repris » et ses deux boutons **« Importer votre
patrimoine existant »** (`V-07.svelte:895`) et **« Créer votre première note »** (`V-07.svelte:901`)
ne s'affichent **jamais**, pas même sur l'instance neuve pour laquelle ils sont dessinés. Deux
gestes promis par la maquette, rendus dans le HTML, masqués par la feuille.

Le voisinage prouve que le câblage est faisable : `/univers/{u}` et `/univers/{u}/{d}` servent bien
`data-etat="peuple"` dérivé de leur donnée. Le refus est écrit en commentaire à
`src/routes/+page.svelte:23-32` — « un périmètre vide n'est pas une base vide » —, argument juste
pour un lecteur restreint. Mais **l'administrateur contourne tous les droits** (`RG-DRO-03`,
`src/lib/droits/resolution.ts:271`) : pour lui, zéro note lue **est** une base vide, et le chargeur
connaît déjà le compte.

### 5. Le rail dit à l'administrateur qui vient d'installer d'aller demander à un administrateur

`src/lib/coquille/Rail.svelte:359-361`. Sur la base neuve (0 univers), `GET /` → 200 sert :

> Aucun domaine ne vous est accessible pour l'instant. Demandez à un administrateur de vous rattacher
> à un domaine — votre compte existe, il n'a simplement pas encore de périmètre.

Le seul compte de l'instance **est** l'administrateur, et le chemin réel est « créez un univers puis
un domaine dans la console ». Combiné au défaut n° 4, **la première page qu'un installateur voit ne
lui donne aucune issue** : ni panneau d'amorçage, ni instruction juste.

### 6. `/console/analytique` sert « 1 contributeurs actifs »

`src/vues/V-34.svelte:459`. Mesuré dans le HTML servi : « 4 notes au total · 1 ouverte au public ·
**1 contributeurs actifs** ». La ligne juste au-dessus (`:454-457`) emploie pourtant `accord()`
— « 1 ouverte », correct. Les deux voisines portent le même littéral figé : `:435` « consultations
sur 7 jours » et `:452` « notes au total » — **sur une instance à une note, l'écran dira « 1 notes
au total »**. Le lot A a posé `accord()` (`src/lib/vocabulaire.ts:145`) et branché les voisins ; ces
trois sites lui ont échappé.

### 7. `/univers/{univers}` sert « 0 brouillon(s) »

`src/vues/V-10.svelte:424` — `{brouillons} brouillon(s)`. Mesuré dans le HTML servi de `GET
/univers/univers-integration` → 200. **La parenthèse est le repli qu'`accord()` existe précisément
pour supprimer** ; c'est l'occurrence nommée au relevé précédent, toujours en place. Le lot A l'a
tenue comme du gel (`mockups/V-10:1864`), avec son jumeau `V-15:359` « il y a 1 an(s) »
(`mockups/V-15:2764`) — mais `CLAUDE.md` est sans ambiguïté : les maquettes sont la référence
visuelle, **pas une loi**, et deux parenthèses recopiées ne valent pas une phrase fausse à 1.

### 8. Le paquet navigateur livre deux adresses de guide du gel que le contrôle ne cherche pas

`src/vues/V-04.svelte:142` (`ADRESSES_PAR_DEFAUT = '/guides/plan-de-reprise-volet-bases'`) et `:144`
(`inexistant: '/guides/reinitialiser-le-badge-daccess'`). Elles partent dans
`build/client/_app/immutable/nodes/1.BE8BmTZe.js`, **le chunk d'erreur** — celui que **toute** page
d'erreur charge, en session comme en anonyme.

Le trou est net : `docs/traces/aiguilles-du-corpus.mjs:86-99` nomme une par une les **trois** adresses
jumelles de V-26 et les exempte ; **les deux de V-04, dans le même chunk et du même relevé §B, ne
sont dans la liste d'aiguilles ni comme aiguilles ni comme exemptions.** Le contrôle rend 0 sans les
avoir vues.

### 9. Le paquet livre trois adresses de note du jeu

`src/vues/V-26.svelte:256`, `:257`, `:261` — `/notes/restaurer-une-sauvegarde-mariadb`,
`/notes/bascule-telephonie-voip`, `/notes/comptes-a-privileges-production` — dans
`build/client/_app/immutable/nodes/1.BE8BmTZe.js`. **Branche morte** : `+error.svelte` passe
`page.url.pathname` et le HTML servi des 404 est propre, mesuré dans les deux polarités. Mais elle
voyage chez chaque lecteur. Le contrôle l'exempte nommément
(`aiguilles-du-corpus.mjs:159-186`) ; ce qui la retirerait est écrit : **rendre la propriété `adresse`
requise**, et reprendre sur une autre source les trois cas de `proprietes-coquille.test.ts:763-790`.

### 10. Le paquet livre un filtre de domaine indexé sur un nom du jeu

`src/vues/V-21.svelte:141` :

```
restreint ? domaines.filter((d) => d.nom !== 'Applications') : domaines
```

Livré dans `build/client/_app/immutable/nodes/5.DJanopmw.js` (`/carte-mentale`). Ce n'est pas
seulement du poids mort : **c'est une règle de droit écrite sur un nom de domaine de démonstration**.
Le jour où `dv=restreints` sera piloté par la donnée, l'instance qui nomme un domaine
« Applications » le verra disparaître de sa carte mentale, et aucune autre ne verra quoi que ce soit
se restreindre. Exempté par le contrôle, à raison **sur le paquet** — le défaut est dans le code, pas
dans la livraison.

### 11. Les deux contrôles du lot 7 sont aveugles aux trois premiers défauts, par construction — et rendent 0 quand même

- `docs/traces/aiguilles-du-corpus.mjs:251-253` écarte **les chemins de dossier d'un seul mot** :
  « Exploitation » et « Sauvegardes » ne deviennent donc jamais des aiguilles, et le commentaire cite
  explicitement `V-24:415-429` comme la raison de l'écart. `passage-a-froid` a ouvert `/importer` et
  l'a compté **propre**.
- `aiguillesTrouvees()` (`:281-286`) compare **à la casse**, délibérément, pour ne pas crier sur « la
  direction technique » en prose — or c'est **exactement sous cette forme** que V-17 et V-22 soudent
  le nom de l'organisation.

Une aiguille écartée pour une bonne raison reste **une aiguille qui ne garde plus rien** : les deux
contrôles se déclarent verts sur les trois fuites que cette campagne devait trouver. C'est le motif
de la campagne précédente d'un cran plus haut — la cause n'est plus dans le code, elle est dans **ce
qui prétend le surveiller**.

### 12. Mineur — `POST /console/domaines?/creer` accepte des clés de module inconnues sans un mot

Envoyé `f-modules=notes signets cartographie carte-mentale relations recherche`, l'action rend 200
« possible » et la base ne porte que `notes`, `signets`, `cartographie` : **trois clés silencieusement
jetées**. L'écran n'expose que des cases, donc rien ne le déclenche aujourd'hui ; mais le refus nommé
que `?/creer` sait rendre pour un nom vide ou pris n'existe pas pour un module inexistant.
Conséquence mesurée à l'intégration : le domaine créé n'avait pas le module `dossiers`, et `GET
…/dossiers/domaine-integration` rendait **404 sans jamais dire pourquoi**.

### 13. Correction d'un fait que le dépôt affirme et qui est faux

`docs/traces/passage-a-froid.mjs:40-46` et `docs/traces/README.md:27-28`, `:75-76` écrivent :
« `droits_de_dossier` ne porte aucune ligne sur une instance neuve, et `RG-DRO-02` est sans appel […]
Sans ce geste, le produit est en lecture seule et aucune note ne peut naître. »

**Mesuré faux pour un administrateur.** `droits_de_dossier` vidé de toute ligne : `GET
/notes/nouvelle` → 200, `POST /notes/nouvelle` → 303, `POST …?/creerSousDossier` → 303, `GET
…/dossiers/{racine}` → 200. `RG-DRO-03` (`src/lib/droits/resolution.ts:271`) rend `gestionnaire`
**sans lire la table**. Le décor que le contrôle pose et déclare est donc inutile — et il masque la
seule question qui compte à l'installation. Ce n'est pas un défaut du produit : **c'est une
affirmation du dépôt à retirer.**

### 14. Signalé, non retenu comme fuite

`GET /notes/nouvelle` et `GET /importer` rendent un **404 nu** tant qu'aucun univers n'existe
(`src/routes/notes/nouvelle/+page.server.ts:102`, `src/routes/importer/+page.server.ts:186`).
L'impasse du relevé précédent est **atténuée** : sur 0 univers, le rail et le menu « Créer »
n'offrent plus ces deux entrées (`ecriture:false` mesuré dans la charge servie), donc plus aucun
bouton ne mène au 404. Reste qu'une adresse tapée à la main rend un 404 sans issue, alors que **le
produit sait exactement ce qui manque**.

---

## Ce que le plan a délibérément laissé

**C'est la partie de ce document qui vaut le plus pour la suite.** Chacune de ces lignes est un choix
tenu, pas un oubli : le plan les a écartées en connaissance de cause. Reprendre l'une d'elles, c'est
ouvrir un lot, pas corriger un défaut.

### En tête : les accords de pluriel — le §7 les avait laissés, le lot A les a pris

Le plan de cette campagne les mettait hors périmètre, **campagne suivante** : le dépôt portait alors
une **quarantaine de pluriels écrits en dur** dans les vues — un `s` collé à un libellé, sous un
compteur qui vaut couramment 1 sur une instance neuve — et **la fonction d'accord n'existait pas**.
Le lot S l'a écrite (`accord(n, singulier, pluriel?)`, `src/lib/vocabulaire.ts:145`), le lot A l'a
consommée sur dix-sept écrans et retiré les six helpers locaux, les cinq tables recopiées et les
quarante ternaires. **La dette est levée ; les restes sont nommés, et ils sont courts :**

- `V-34:435`, `:452`, `:459` — trois littéraux figés sur le seul écran d'analytique (défaut n° 6) ;
- `V-10:424` et `V-15:359` — les deux parenthèses « (s) », tenues comme du gel par le lot A et
  contestées par l'intégration (défaut n° 7) ;
- les deux jumeaux du message de seuil diffèrent encore d'**une apostrophe** — `En l'état` dans la
  vue, `En l’état` au serveur — divergence antérieure au lot, signalée et non corrigée pour ne pas
  élargir le périmètre ;
- `V-34:532` porte son accord pour un nœud qui **ne se rend pas aujourd'hui** : `recherches` est vide
  tant qu'aucun journal de recherche n'existe.

Ce qui ne bouge **pas**, et c'est tenu : les parenthèses hors écran (journaux de commande, archive,
document), les cartes de statistique — grand chiffre plus légende, sans nombre grammatical —, et les
libellés que le gel fige au pluriel invariant : **un titre de section n'a pas de nombre.**

### Une branche non fusionnée est restée en place, et sa copie de travail avec

Le ménage de fin de campagne a retiré les treize copies de travail dont la branche est dans
`master`. **Une ne l'est pas et n'a pas été retirée** :

```
worktree-wf_65fc5159-13d-28   fe9e5fc
.claude/worktrees/wf_65fc5159-13d-28
fix(traces): le garde-fou du paquet ne regardait qu'une moitié, et il partait vert sur l'autre
```

Elle réécrit les mêmes six fichiers que le lot 7 (`docs/traces/`) depuis `631e4f3`, donc **avant**
la fusion de `b19d141` : la reprendre est une fusion à conflits, pas un `merge` en avance rapide.
Ce qu'elle porte, et qui n'est mesuré nulle part ailleurs :

- **`aiguilles-dans-le-paquet.mjs` ne balayait que `build/client/`** en annonçant mesurer « ce qui se
  livre », et cette limite n'était déclarée nulle part. `build/server/` se livre aussi — c'est ce que
  l'image porte et ce que `node build/index.js` exécute. Mesuré sur la même construction :
  **404 occurrences sur 53 fichiers**, dont le chunk de `creation.js` — **85 314 octets, `CORPUS`
  sérialisé en entier, importé par dix nœuds de routes**. La cause est celle de la ligne
  `corpsVide()` ci-dessus.
- Sur cette base, le contrôle **rend 1**, délibérément : c'est la vérité du paquet tant que les trois
  remèdes déjà écrits ne sont pas appliqués.
- `passage-a-froid.mjs:78` portait un **mot de passe en clair** dans un dépôt public ; elle le tire
  au hasard à chaque passage.

Trancher demande de décider si un garde-fou a le droit de rendre 1 sur `master`. Ce n'est pas un
correctif, et personne ne l'a arbitré : la branche est laissée intacte plutôt que perdue au ménage.

| Autre chose laissée | Raison, et ce qu'il faudrait pour le lever |
|---|---|
| **Les deux contrôles aveugles** | Défaut n° 11, et c'est la reprise la plus urgente de la liste. Les lever demande de trancher deux écarts *écrits et argumentés* : le chemin de dossier d'un seul mot, et la comparaison à la casse. Les deux écarts sont justes en général et faux ici ; les fermer sans faire crier le contrôle sur de la prose légitime est un travail de conception, pas un `sed` |
| **`corpsVide()` dans `semence.ts`** | Toujours là (`src/lib/base/semence.ts:240`), toujours nommé et borné par l'exemption ESLint (`eslint.config.js:150-162`) : quatre routes chargent la semence — donc `CORPUS` — par cette seule fonction. La sortir est une ligne de code et un déplacement de module ; c'est l'**exemption nommée** qui disparaît avec, et c'est pour ça que ça se fait exprès, pas en passant |
| **La propriété `adresse` de V-26** | Défaut n° 9. Ce qui la retire est écrit dans l'exemption elle-même : la rendre **requise**, et reprendre sur une autre source les trois cas de `proprietes-coquille.test.ts:763-790` qui rendent la vue *sans* elle pour relever ce que la planche affiche |
| **Le filtre `'Applications'` de V-21** | Défaut n° 10. Ce qui le retire : que l'axe restreint filtre sur **une donnée de droits** plutôt que sur un nom de domaine. C'est un lot de câblage de périmètre, pas un correctif |
| **Construire un expéditeur de courriel** | C'est une **fonction**, pas un correctif. Le produit n'a aucun expéditeur et aucune table de jeton ; l'écran unique de `/mot-de-passe-oublie` oriente vers le chemin qui existe. Le jour où l'on s'y met : un expéditeur, une table de jeton, et les six écrans de V-06 à remonter — ils ont été **retirés, pas masqués** |
| **La table du journal d'imports** et `/console/imports/{lot}` | Lot à mandater : migration, écran de lot (`docs/routes.md:183`), plafond d'erreurs **par lot**, la règle interdisant toute purge dans le temps. La seconde moitié de `RG-M12-09` — « ce journal alimente le flux d'activité de l'accueil » — n'est tenue nulle part non plus |
| **Les deux scénarios d'import non livrés** (`UC-M12-02`, `UC-M12-03`) | L'étape 1 cesse de les offrir et refuse explicitement qui y arriverait par un chemin résiduel. Les construire est un lot en soi |
| **La résolution des renvois en relations** | `src/lib/donnees/import.ts` : la clé de renvoi **ne nomme pas le type de relation**. Sujet de conception, pas de correctif. Le renvoi est consigné au rapport, la relation reste à créer, et l'écran le dit |
| **`adresseDeDomaine()` qui slugifie le nom** | `src/lib/rangement/adresses.ts:83` compose l'adresse sur le **nom** au lieu de lire `domaines.identifiant` — `RG-M12-11` fige l'identifiant, pas le nom. C'est le **404-après-renommage** déjà corrigé sur `/mon-profil` et qui subsiste ici. Il touche un utilitaire partagé, donc plusieurs lots |
| **Les utilisations d'un gabarit** | `Template.utilisations` n'a **aucune colonne** : le tiret des listes non vides reste, et c'est une fonction à écrire — le lot C n'a corrigé que le cas *zéro gabarit*, où la réponse est zéro et certaine |
| **`V-34`, les mesures d'analytique** | Dette **datée**, honnêtement traitée : l'écran déclare l'absence au lieu de l'inventer, et le registre de lacunes ne ment plus. Elle redeviendra dangereuse **le jour où les tables arriveront** — un état neutre explicite qui survit à sa cause devient un mensonge d'un autre genre |
| **Le filtrage de V-12 porté en SQL** | Ouvert depuis la première campagne. Lot de **performance**, pas de correction |
| **Les 15 avertissements a11y** | Préexistants, hors du périmètre des campagnes — `pnpm check` = 0, ce sont des avertissements, pas des erreurs |

---

## Ce que le gel dit et que la base ne porte pas

`instance` (version, dernière synchronisation), le résumé d'une version, les utilisations d'un
gabarit, la dernière connexion en relatif, la prose chiffrée de V-34. Tout s'affiche en **état neutre
explicite**. `arrive_le` et le refus d'un courriel indisponible n'ont **aucun nœud** au gel pour se
dire.

## Divergences avec le gel, assumées

- **`method="post"` sur le formulaire de connexion.** La maquette ne l'écrit pas, faute de serveur.
  Sans lui, une soumission avant hydratation partait en `GET` **avec le mot de passe dans
  l'adresse** — mesuré sur le HTML servi.
- **Le nom d'organisation est juxtaposé, non gouverné par une préposition** : « Documentation · X »,
  « Connexion · X ». Le gel écrit « Documentation de la direction technique » ; un nom
  d'organisation n'apporte pas son article, et rien ne permet de le deviner.
- **`fraicheur.ts:306` accorde « il y a 1 jour »**, que le gel n'accorde pas (`V-41:2183`) — son jeu
  ne descend jamais à 1. La forme **compacte** ne bouge pas : « j » est un symbole d'unité, il est
  invariable.
- **La section « Gestion › Console » du rail abrégé est gardée sur `admin`, non sur `ecriture`**, et
  sa classe suit sa garde. C'est le seul nœud où le produit s'écarte de la classe du gel : une
  maquette statique n'a pas de rôle à lire.
- **Le panneau « Statistiques indisponibles » de V-14 est retiré**, et `mockups/V-14-lecture-note.html`
  a été amendée du même geste — faute de quoi le prochain portage l'aurait fait revenir. La panne
  n'est pas détectable (le chargeur écrit `?? 0`) : le correctif est le retrait, pas la condition.
- **Le panneau des propriétés typées en lecture** (lot L) : le gel de V-14 dessine sept panneaux, le
  brief en énumère huit, et `RG-NOT-01` interdit de faire de la fiche un objet séparé de la note —
  une fiche dont les propriétés ne se lisent que dans l'éditeur **est** cet objet.
- **Six écrans de V-06 retirés** : saisie d'identifiant, jalons, écran d'envoi, saisie du nouveau
  mot de passe, confirmation, « Lien expiré ». Le gel décrit un parcours par courriel que le produit
  n'a pas ; l'écran unique qui reste ne demande rien et ne lit aucun compte.
- **L'interrupteur de notification de `/mon-profil` n'est plus émis** : coché en dur, sans
  gestionnaire ni colonne, il promettait des messages qui ne partiraient jamais.
- **L'étape 1 de l'import n'offre qu'un scénario sur trois**, et la case de simulation suit la garde
  du gel : le scénario n'étant plus offert, la case ne l'est pas non plus.
- **`/console/imports` porte un nœud que le gel de V-35 n'a pas** : l'état vide explicite du journal,
  dérivé du recensement.
- **Forme, code et teinte d'un type de fiche hors gel sont dérivés du nom** — le cahier prescrit
  « assignées de façon déterministe », *assignées*, non *stockées*. Les sept clés du gel rendent
  l'objet du gel à l'octet.
- **La section « Accès » d'un domaine sort du masquage.** Le gel masquait le bloc entier sur un
  domaine vide ; dans le produit il fermait le seul chemin vers la création d'un dossier.
- **La racine d'un rangement n'offre ni « Renommer ou déplacer » ni « Supprimer »** : les deux
  écritures refusent tout dossier sans parent, et deux boutons morts contredisent `P-03`.
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

Le geste juste est écrit et verrouillé : la donnée d'une vue vient du chargeur ; ce que toutes les
routes passent est **requis**, le compilateur garde la porte ; ce qui peut manquer reçoit un **état
vide explicite** ; et `eslint.config.js` refuse tout import de valeur venue de `seeds/` dans
`src/vues/`, `src/routes/` et `src/lib/`.

**Et la leçon propre à cette campagne : un contrôle qui rend 0 n'est pas une preuve — c'est une
question posée.** Avant de croire un vert, lis ce que le contrôle écarte : les trois fuites que cette
campagne devait trouver sont toutes tombées dans un écart *écrit, argumenté et juste en général*. Un
écart raisonnable reste un trou. Quand un contrôle est vert et qu'un écran ment, **le défaut est dans
le contrôle.**

```
pnpm dev            le serveur
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires — DOIVENT rester verts

pnpm build && node docs/traces/passage-a-froid.mjs        ce qui s'affiche, base neuve, 39 routes
pnpm build && node docs/traces/aiguilles-dans-le-paquet.mjs   ce qui se livre au navigateur
```

Les identifiants de développement vivent dans `.env`, qui est ignoré — jamais dans un fichier
versionné. Pour ouvrir une instance neuve : `pnpm base:administrateur`. Pour un jeu de démonstration
complet : `pnpm base:peupler`.

**Ne reconstruis pas le harnais.** Il pesait 52 000 lignes contre 5 000 lignes de branchement
applicatif, et pendant qu'il grossissait personne ne pouvait créer une note.
