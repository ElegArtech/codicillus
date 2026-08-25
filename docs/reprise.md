# Où reprendre

*État au 26 août 2026, après la campagne **« le jeu de démonstration ne descend plus dans le
produit »**. Le harnais de vérification a été supprimé : ce document ne cite aucune batterie, il dit
**ce qu'un utilisateur peut faire**, avec ses codes HTTP relevés.*

À la clôture : `pnpm check` **= 0**, `pnpm test:unit` **= 0** — 1 696 contrôles sur 70 fichiers. Les
copies de travail du pilote, les dix-huit bases de lot et la base d'intégration ont été retirées ; il
ne reste que `codicillus` (développement) et `codicillus_demo`.

---

## Les lots

**Fusionnés : 0, 5, 3, 4, 6, 1, 2, 7.** **En quarantaine : aucun.**

La campagne a poursuivi **un seul motif**, et cette fois jusqu'à sa cause : une propriété de vue
**optionnelle dont le défaut était une constante de `seeds/corpus.ts`**. Une route qui oubliait de
passer la donnée servait alors « Infrastructure », « Production », « Karim Belhadj » ou
« Restaurer une sauvegarde PostgreSQL » sur l'instance d'un client — et **rien ne protestait** : ni
le compilateur, ni un test, ni l'écran. Seule l'ouverture d'une page sur une base vide le révélait.

**La cause n'était pas dans le code : elle était écrite dans `CLAUDE.md`.** Le paragraphe
« Brancher une vue » prescrivait le motif, mot pour mot, et le concluait par « le rendu par défaut
ne bouge pas ». Quatre campagnes ont couru après ses symptômes en laissant la consigne intacte. Le
lot 7 la remplace et la verrouille ; la consigne dit maintenant **propriété requise, ou état vide
explicite**, et une règle ESLint interdit l'import.

**La leçon, et c'est elle qui dit où chercher la suite :**

> Un défaut de câblage ne se voit pas, par construction. L'écran est correct, la donnée est en
> base, et l'écart n'apparaît que **sur une instance dont les noms ne sont pas ceux du jeu**. Tant
> qu'un défaut de propriété peut être une donnée, aucun outil du dépôt ne peut rendre le manque
> visible — c'est pourquoi la réparation est en deux temps : rendre la porte gardée par le
> compilateur, puis interdire le retour en arrière par la règle.

| Lot | Ce qu'il a rendu vrai |
|---|---|
| 0 — vocabulaire | `vocabulaire.ts` calculait ses quatre formes **à l'import** depuis `CONFIG.motFiche`. La clé `mot_fiche` existait en base, la console l'écrivait, `lireConfiguration()` la lisait — et **rien ne branchait la lecture sur l'affichage** : renommer « Fiche » n'avait aucun effet sur les quinze vues qui portent le mot. `RG-M14-09` (« recalcul immédiat ») était faux à la lettre. Les quatre formes descendent par le contexte de coquille, déjà dérivées. Relevé : « Fiche » → « Modèle », **16 écrans sur 16** servent le mot configuré dans leur HTML, retour compris |
| 5 — registres de console | Les propriétés de V-27 à V-32 deviennent **requises** ; aucune des six vues n'importe plus une valeur du jeu. Deux lignes de démonstration partaient avec les sentinelles qui les injectaient — le domaine « Téléphonie » et le type de relation « remplace » n'étaient retenus que par une comparaison d'identité entre la propriété reçue et la constante, c'est-à-dire **exactement quand la donnée n'avait pas été passée**. Trois défauts de saisie tombent avec : renommer une clé technique repliait la ligne en cours de remplissage, retirer une propriété laissait sa clé morte dans l'état de dépli, et la pastille « mot de passe verrouillé » se décidait sur un identifiant du jeu écrit en dur |
| 3 — rangement | Les six écrans de rangement servaient le jeu dès qu'une route oubliait une donnée. Le catalogue des six modules quitte `seeds/` pour `$lib/rangement/modules.ts` — c'est un référentiel de produit —, et une clé inconnue ne met plus le rendu en erreur. Partent avec : le rail qui marquait « Infrastructure » en dur, V-13 qui retombait sur « Production › Infrastructure › Exploitation » et sur l'héritage de droit du gel, V-23 qui servait la note `n-sig-statut` **dans le formulaire de création**, et « hier » dès zéro jour |
| 4 — graphes, import, profil | Quinze propriétés de V-19 à V-21, V-24 et V-25. Trois fuites de plus : quatre arguments par défaut de `graphe/cartographie.ts` tirés du jeu ; une **table de seize positions de nœuds indexée sur les identifiants de seize notes du jeu** — le corpus de démonstration recevait la disposition du gel, celui d'un client jamais, `disposer()` place désormais tous les corpus de la même façon ; et le sélecteur de périmètre qui n'avait **pas d'option pour son propre défaut**. À la reprise : l'onglet Distinctions rendait une étiquette au-dessus d'un conteneur vide sur toute instance, et la garde de `/importer` n'éprouvait pas la même question que sa liste de cibles — un compte à qui un sous-dossier seul est ouvert recevait l'écran avec **un sélecteur sans aucune option** sous une étiquette obligatoire (200 avant, 404 après) |
| 6 — console système | `CoquilleDeConsole` portait `univers`, `domaines`, `compte` et `instance` en propriétés facultatives **et les traversait sans jamais les lire** : une route qui en oubliait une affichait le rail des maquettes, « Karim Belhadj » dans la barre et la version du jeu au pied. Les quatre partent des trois côtés ; le contexte d'identité est la seule source. Ce que le produit ne mesure pas reçoit un état vide et **se tait** : V-34 ne rend plus l'indicateur nord ni les trous documentaires — ils servaient les chiffres du jeu, masqués par la feuille mais **bien présents dans le HTML servi** |
| 1 — écrans publics | `portail` devient exigée sur V-01 à V-04 et V-06 : vide — l'état d'une instance neuve —, les **six liens d'assistance ne sont plus émis**. `notesPubliques()` quitte `seeds/` et exige son argument. V-26 n'expédie plus sa pierre tombale dans le HTML de chaque 404 : elle était émise masquée, avec « Restaurer une sauvegarde MariaDB » et « Marc Ferreira ». À la reprise : les pistes de reformulation, dérivées du jeu de **résultats**, étaient structurellement vides **dans l'état même où elles servent** (`?q=zzzintrouvable` → 0 piste) ; elles se comptent maintenant dans le chargeur, sur le périmètre lisible |
| 2 — note | `note-de-demonstration.ts` faisait `CORPUS.find('n-restaurer-pg')` et trois vues plus un chargeur l'importaient : **le jeu descendait dans le produit sans qu'une ligne de `src/vues/` soit fautive**. Le sommaire, vide sur toute note écrite dans le produit, est réparé — l'ancre est dérivée du texte **au rendu**, la persister capturerait une version au premier ré-enregistrement de chaque note. À la reprise : `/notes/nouvelle` repliait `universDuCompte` sur `'Production'` **et le passait à une propriété devenue requise** — le littéral n'était pas retiré, il était déplacé —, et V-40 annonçait six versions détruites quel que soit l'historique réel |
| 7 — la règle | `eslint.config.js` interdit d'importer une **valeur** de `seeds/` dans `src/vues/`, `src/routes/` et `src/lib/`. Les `import type` restent ouverts : c'est la valeur du jeu qui est de la démonstration, pas sa forme. `src/lib/**` est dans la portée parce que **six modules de bibliothèque** faisaient descendre le jeu jusque dans les vues. Un second motif ferme la même descente **sous un nom qui ne dit pas `seeds`** : `semence.ts` importe `CORPUS` en valeur et six de ses fonctions le prennent en argument par défaut ; deux emprunteurs d'aujourd'hui gardent une exemption **nommée et bornée à ce motif**. Déplacer `corpsVide()` hors de la semence reste à faire |

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Créer une note dont le titre est déjà pris | `POST /notes/nouvelle` → **303**, identifiant suffixé |
| Créer une note de type fiche | le type choisi fait apparaître ses champs, le type de note bascule sur « Fiche », et `type_de_fiche_id` **et** `proprietes_typees` sont posés en base |
| **Omettre une propriété obligatoire** | `POST /notes/nouvelle` → **400**, les propriétés manquantes **nommées**, le refus posé à l'endroit du champ, et le brouillon **conservé** |
| Rouvrir une fiche en modification | le type et ses valeurs sont restitués ; vider le type met les deux colonnes à `null` dans la même mise à jour |
| **Relire une fiche** | les propriétés typées s'affichent en lecture, et la pastille dit « Fiche Serveur », plus « Fiche » seul |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée |
| **Ouvrir une version antérieure** | `GET /notes/{id}?version={n}` → **200**, et le corps rendu **est celui de la version annoncée** ; « Restaurer » écrit ce que l'écran a montré |
| Dépasser le plafond de versions | plafond à 3, six enregistrements → il reste exactement les **trois dernières** |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer / modifier / supprimer un signet | `POST .../signets/…` → **303**, puis **404** sur le supprimé |
| Créer un sous-dossier | `POST .../dossiers/{chemin}?/creerSousDossier` → **303** → **200** sur l'enfant, **et l'enfant est listé** |
| Adresse nue d'un rangement | `GET …/dossiers` → **308** → `…/dossiers/{domaine}` |
| **Suivre un lien mort** | `GET /notes/inexistante-xyz` → **404** annonçant **l'adresse demandée**, et « Créer la note » propose **ce titre-là** |
| **Ouvrir la cartographie** | `GET /cartographie` → **200** sur **le corpus entier**, quel que soit le nom des univers de l'instance |
| Demander un mot de passe oublié | `GET`/`POST /mot-de-passe-oublie` → **200**, écran unique qui nomme le chemin réel, **sans révéler si le compte existe** |
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

### Écran par écran — mesuré, pas déclaré

**Tout est à 200 en rédacteur**, et l'écran montre la donnée réelle :

| | |
|---|---|
| accueil | indicateurs, activité, corbeille de révisions, périmètre du compte — les indicateurs naviguent, filtrés |
| recherche | résultats réels, facettes, compteurs, pastilles, état vide, périmètre anonyme |
| lecture d'une note | titre, corps rendu, cartouche, relations, rétroliens, consultations, les propriétés typées de la fiche, **et le sommaire des titres de la note écrite dans le produit** — *le panneau « Statistiques indisponibles » y est rendu sans condition : défaut n° 6* |
| historique | les vraies versions **de la vraie note**, ouvert par `?version` sur **le corps de cette version**, restaurer marche et capture sa version |
| comparaison | modes Texte et Visuel sur les vraies versions, alternative textuelle |
| éditeur | ProseMirror — gras, titres, listes, tâches, tableaux, alertes — les propriétés du type choisi, leur aide, leur défaut, et le refus des manquantes |
| univers, domaine, notes, dossiers | listes, compteurs, santé, modules désactivés qui disparaissent — les pastilles naviguent, et aucune n'est rendue à qui ne peut pas la suivre |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations **dès l'ouverture**, chaque type nommé, de forme et de code distincts, périmètres réels, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent dans le domaine choisi, simulation qui n'écrit rien et qui le dit |
| console (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |

---

## Ce qui ne marche pas — trouvé à l'intégration, sur une instance neuve

Quatorze défauts, dans l'ordre où ils coûtent cher. Les trois premiers servent **encore** du jeu de
démonstration, et deux d'entre eux **sur le produit construit** ; le quatrième fait mentir le
produit sur la promesse qui le définit ; le dernier bloc ferme la porte à qui vient d'installer.

### 1. `/bibliotheque` sert l'activité du jeu sur une base à ZÉRO note

`src/routes/bibliotheque/+page.svelte:30` ne passe pas la propriété `activite`, donc
`src/vues/V-41.svelte:150` (`activite = ACTIVITE`) retombe sur la constante de
`seeds/corpus.ts:1308`.

```
GET /bibliotheque   200   « Karim Belhadj — verification », « Sophie Nguyen — edition »,
                          « Karim Belhadj — revision », « Sophie Nguyen — verification »
                          base à 0 note
```

**Reproduit sur le produit construit** (`prod/02_bibliotheque.html`) et **embarqué dans le paquet
navigateur**, `build/client/_app/immutable/nodes/4.*.js`. C'est le motif exact de la campagne, sur
la seule vue que la règle ESLint exempte : V-41 est une planche, mais `/bibliotheque` la **monte**.
L'exemption est donc trop large d'une vue — ou la route ne devrait pas monter une planche.

### 2. `/bibliotheque` — quatre littéraux du jeu de plus dans la même vue

`src/vues/V-41.svelte:190`, `const DOMAINE_DEMO = 'Infrastructure'`, rendu ligne 390 dans la
pastille de domaine ; ligne 396, le fil d'Ariane spécimen « Accueil › Production › Infrastructure ›
Exploitation › Sauvegardes » ; ligne 405, le bloc de code « barman recover pg-prod-01 latest
/var/lib/postgresql » et le tableau `pg-prod-01` / `pg-prod-02`. **Production**, **Infrastructure**
et **barman** sont les noms du jeu de démonstration — « barman » est le vocabulaire même que le lot
2 devait purger. **Reproduit sur le produit construit.**

### 3. `/importer` — l'illustration du scénario nomme un domaine qui n'existe pas

`src/vues/V-24.svelte:399` écrit « → Infrastructure », un domaine que **rien ne pose sur cette
instance** — le seul domaine y est « Coeur de Réseau ». Le commentaire de
`src/vues/V-24.svelte:197` montre que le repli sur `MOI.domaine` a **déjà été réparé au-dessus** :
le littéral de l'illustration est resté. **Reproduit sur le produit construit.**

### 4. Le produit MENT sur sa fraîcheur — sur son seul écran public

C'est la promesse de tête du produit rendue fausse.

```
GET /guides/n-guide-public-de-raccordement   200   « Vérifié à l'instant »
                                                   « Ce guide a été contrôlé le — par l'équipe
                                                     qui l'a écrit »
GET /notes/n-guide-public-de-raccordement    200   « Jamais vérifiée »     ← MÊME note
                                                   verifie_le EST NULL en base
```

La chaîne : `src/lib/donnees/lecture.ts:437` replie `verifieLe ?? modifieLe`, d'où `jours = 0`, d'où
`src/lib/fraicheur.ts:288` — « Vérifié à l'instant ». `src/vues/V-03.svelte:280-282` rend
`controleLe ?? RIEN` et `:376-378` l'insère dans une **phrase affirmative**. **V-03 n'a aucune
branche « jamais vérifiée »**, contrairement à V-14 qui la porte.

### 5. Même cause, accueil public

`src/vues/V-01.svelte:257` sert « 1 guides publics · **1 vérifiés il y a moins d'un mois** » à
l'anonyme, alors qu'aucun guide de l'instance n'a **jamais** été vérifié.

### 6. Un panneau d'erreur PERMANENT et FAUX sur chaque page de note

`src/vues/V-14.svelte:685-696` rend, **sans condition et sans attribut `hidden`**, un panneau
« Consultations détaillées / Statistiques indisponibles / Le service de mesure ne répond pas. Le
reste de la note reste consultable. » avec un bouton « Réessayer » **inerte**. Le commentaire du
fichier l'annonce lui-même : « Exemple d'un panneau en erreur ». La même page affiche **au-dessus**
« 1 consultation · 1 sur les 30 derniers jours » : la mesure fonctionne, l'écran dit le contraire.

### 7. Une mesure FABRIQUÉE, présentée comme un temps mesuré

`src/vues/V-08.svelte:541` : `const duree = Math.max(0.09, 0 / 1000 + 0.31)`.

```
GET /recherche?q=…   200   « 1 résultat en 0,31 s »
GET /recherche?q=…   200   « 4 résultats en 0,31 s »   ← la même constante
```

Jumeau anonyme : `src/vues/V-02.svelte:176` (`0.18`), servi comme « 1 résultat en 0,18 s ».

### 8. Un tiret là où un zéro est dû

`src/vues/V-31.svelte:170-174` : sur une instance à zéro gabarit, `templates.every(...)` vaut
**`true` sur le tableau vide**, `totalUtilisations` vaut `null`, et `/console/templates` rend
« Les **—** notes déjà créées à partir de ces templates ne bougeront pas. »

### 9. L'organisation est CODÉE EN DUR dans huit vues

« Direction technique » est écrit dans `src/vues/V-01.svelte:199` et `:377`, `V-02.svelte:560`,
`V-03.svelte:771`, `V-04.svelte:404`, `V-05.svelte:170`, `V-17.svelte:968`, `V-22.svelte:461`.
**Toutes les vues publiques d'une instance neuve** annoncent donc « Codicillus · Direction
technique », et `/connexion` demande « les identifiants de votre compte de la direction technique ».
**Aucun réglage de `/console/configuration` ne nomme l'organisation** : ce n'est pas un câblage
oublié, c'est une clé qui n'existe pas.

### 10. Accords de pluriel

« 1 consultations » `src/vues/V-08.svelte:786` ; « 1 vues » `src/vues/V-11.svelte:613`,
`src/vues/V-34.svelte:583` et `:608` ; « 1 contributeurs » `src/vues/V-34.svelte:557` ; « Les 1
dossiers du domaine » sur `/console/exports` ; « 0 brouillon(s) » sur `/univers/{univers}`. Ce ne
sont que les occurrences **relevées** : le gisement entier est décrit plus bas — c'est la campagne
suivante.

### 11. IMPASSE À L'INSTALLATION — deux boutons offerts, deux 404

Sur la base **vraiment vide** (0 univers), `/notes/nouvelle` et `/importer` rendent un **404 nu** :
`src/routes/notes/nouvelle/+page.server.ts:102` (`if (!acces.trouve) error(404)`) et
`src/routes/importer/+page.server.ts:186`.

```
base à 0 univers, administrateur connecté
GET /notes/nouvelle   404   nu
GET /importer         404   nu
              puis un domaine créé
GET /notes/nouvelle   200
GET /importer         200
```

Or le rail et le menu « Créer » posent **« Nouvelle note » et « Importer des fichiers » dès la
première connexion**. L'administrateur qui vient d'installer clique deux boutons offerts et reçoit
deux pages introuvables. La garde est juste — on ne crée pas une note sans rangement —, c'est
l'**absence d'issue** qui est le défaut : ni message, ni chemin vers la création d'un univers.

### 12. Deux actions de console divergent sur la clé d'un univers

`src/lib/donnees/administration.ts:1961` : `creerUnDomaine` cherche l'univers d'accueil par
`univers.nom`, alors que `creerUnUnivers` rend un **`identifiant` lisible** et que **toutes les
adresses du produit** désignent un univers par cet identifiant. Passer l'identifiant à `?/creer`
rend un **404 muet** (mesuré). L'écran s'en tire parce que `src/vues/V-28.svelte:695` pose
`value={u.nom}` dans le sélecteur — le contrat de l'action reste divergent du reste du produit, et
le premier appelant qui suivra la convention générale tombera dessus.

### 13. Développement seulement — une trace de mesure servie dans le CSS

`src/vues/V-15.css:741` porte le commentaire « MESURÉ LE 21/08/2026 sur `/notes/n-restaurer-pg` »,
servi tel quel par Vite dans le CSS de **toute** page de note — la chaîne `n-restaurer-pg` se trouve
dans le HTML servi de `/notes/n-plan-de-commutation-du-coeur` et de
`/notes/n-commutateur-coeur-a1`. **Absent du produit construit**, où la minification l'efface.

### 14. Signalé, non retenu comme défaut

`/console/univers` sert `placeholder="Production"` et `/console/domaines`
`placeholder="Infrastructure"` dans les champs « Nom » de leur panneau de création (`V-27`, `V-28`,
transcription du gel). Ce sont des **exemples de saisie inertes**, pas de la donnée rendue — ils
reprennent néanmoins **mot pour mot** deux noms du jeu de démonstration. À trancher quand quelqu'un
passera par là, pas à ouvrir un lot pour ça.

---

## Ce que le plan a délibérément laissé

**C'est la partie de ce document qui vaut le plus pour la suite.** Chacune de ces lignes est un choix
tenu, pas un oubli : le plan les a écartées en connaissance de cause. Reprendre l'une d'elles, c'est
ouvrir un lot, pas corriger un défaut.

### En tête : les accords de pluriel — c'est la campagne suivante

Le lot 2 a corrigé « 1 consultations », le lot 3 « hier » dès zéro jour, l'intégration en a relevé
six autres. **Ce sont des occurrences, pas la dette.** Le dépôt porte une **quarantaine de pluriels
écrits en dur** dans les vues — un `s` collé à un libellé, sous un compteur qui vaut couramment 1 sur
une instance neuve — et **la fonction d'accord n'existe pas**.

C'est le motif exact de `motFiche`, que le lot 0 vient de lever : `src/lib/vocabulaire.ts` porte
`pluriel()`, calque du gel (`mockups/V-33-console-configuration.html:3136`), mais **il ne sert qu'au
mot renommable**. Rien dans le dépôt ne répond à « un nom, un nombre → la forme accordée », et donc
quarante sites l'écrivent chacun à sa façon, tous au pluriel, tous faux à 1 — et tous faux à 0 dans
l'autre sens, où le français veut le singulier.

Ce que lever la dette demande, et pourquoi c'est un lot et pas un correctif :

- écrire **une** fonction d'accord, à côté de `pluriel()` et dans le même module — c'est déjà la
  seule source de la dérivation, en ajouter une seconde ailleurs divergerait au premier mot
  exotique ;
- la faire prendre le **nombre**, pas seulement le mot : « 0 brouillon », « 1 brouillon »,
  « 2 brouillons », et le cas `0` n'est pas celui du pluriel ;
- recenser les quarante sites **un par un** — ils ne se trouvent pas par un motif unique : « 1 vues »
  est une interpolation, « 0 brouillon(s) » une parenthèse, « Les — dossiers » un état vide non
  gardé ;
- ne **pas** toucher aux libellés que le gel fige au pluriel invariant — un titre de section n'a pas
  de nombre.

| Autre chose laissée | Raison, et ce qu'il faudrait pour le lever |
|---|---|
| **Le nom de l'organisation** | Défaut n° 9 ci-dessus, et ce n'est **pas** un câblage oublié : aucune clé de configuration ne nomme l'organisation. Le lever demande une clé en base, un champ dans V-33, une descente par le contexte de coquille, et huit vues à brancher — migration comprise. Lot, pas correctif |
| **`corpsVide()` dans `semence.ts`** | Le lot 7 l'a nommé et borné, il ne l'a pas déplacé : quatre routes chargent la semence — donc `CORPUS` — par cette seule fonction. La sortir de la semence est une ligne de code et un déplacement de module ; c'est l'**exemption ESLint nommée** qui disparaît avec, et c'est pour ça que ça se fait exprès, pas en passant |
| **L'exemption de `V-41`** | La règle exempte les quatre planches ; `/bibliotheque` **monte** V-41. Le défaut n° 1 vit dans cet interstice. Trancher demande de choisir : la route cesse de monter une planche, ou V-41 sort de l'exemption et reçoit ses échantillons du chargeur |
| **Construire un expéditeur de courriel** | C'est une **fonction**, pas un correctif. Le produit n'a aucun expéditeur et aucune table de jeton ; l'écran unique de `/mot-de-passe-oublie` oriente vers le chemin qui existe. Le jour où l'on s'y met : un expéditeur, une table de jeton, et les six écrans de V-06 à remonter — ils ont été **retirés, pas masqués** |
| **La table du journal d'imports** et `/console/imports/{lot}` | Lot à mandater : migration, écran de lot (`docs/routes.md:183`), plafond d'erreurs **par lot**, la règle interdisant toute purge dans le temps. La seconde moitié de `RG-M12-09` — « ce journal alimente le flux d'activité de l'accueil » — n'est tenue nulle part non plus |
| **Les deux scénarios d'import non livrés** (`UC-M12-02`, `UC-M12-03`) | L'étape 1 cesse de les offrir et refuse explicitement qui y arriverait par un chemin résiduel. Les construire est un lot en soi |
| **La résolution des renvois en relations** | `src/lib/donnees/import.ts` : la clé de renvoi **ne nomme pas le type de relation**. Sujet de conception, pas de correctif. Le renvoi est consigné au rapport, la relation reste à créer, et l'écran le dit |
| **`adresseDeDomaine()` qui slugifie le nom** | `src/lib/rangement/adresses.ts:83` compose l'adresse sur le **nom** au lieu de lire `domaines.identifiant` — `RG-M12-11` fige l'identifiant, pas le nom. C'est le **404-après-renommage** déjà corrigé sur `/mon-profil` et qui subsiste ici. Il touche un utilitaire partagé, donc plusieurs lots |
| **`V-34`, les mesures d'analytique** | Dette **datée**, honnêtement traitée : l'écran déclare l'absence au lieu de l'inventer. Elle redeviendra dangereuse **le jour où les tables arriveront** — un état neutre explicite qui survit à sa cause devient un mensonge d'un autre genre |
| **Le filtrage de V-12 porté en SQL** | Ouvert depuis la première campagne. Lot de **performance**, pas de correction |
| **Les 17 avertissements a11y** | Préexistants, hors du périmètre des campagnes |

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

Et la leçon propre à cette campagne : **la cause d'un motif qui revient quatre fois n'est pas dans
le code.** Quatre campagnes ont corrigé les symptômes d'une phrase de `CLAUDE.md` sans lire la
phrase. Quand un défaut se reproduit après avoir été réparé, cherche **ce qui le prescrit** — une
consigne, un gabarit, un exemple recopié — avant de le réparer une cinquième fois.

Le geste juste est désormais écrit et verrouillé : la donnée d'une vue vient du chargeur ; ce que
toutes les routes passent est **requis**, le compilateur garde la porte ; ce qui peut manquer reçoit
un **état vide explicite** ; et `eslint.config.js` refuse tout import de valeur venue de `seeds/`
dans `src/vues/`, `src/routes/` et `src/lib/`.

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
