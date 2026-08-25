# Où reprendre

*État au 25 août 2026, après la campagne des valeurs de démonstration servies faute de route. Le
harnais de vérification a été supprimé : ce document ne cite aucune batterie, il dit **ce qu'un
utilisateur peut faire**, avec ses codes HTTP relevés.*

À la clôture : `pnpm check` **= 0**, `pnpm test:unit` **= 0** — 1 699 contrôles sur 70 fichiers. Les
copies de travail du pilote, les bases de lot et la base d'intégration ont été retirées ; il ne
reste que `codicillus` (développement) et `codicillus_demo`.

---

## Les lots

**Fusionnés : C, A, D, L.** **En quarantaine : aucun.**

Cette campagne-ci n'a réparé qu'un seul motif : **une valeur du jeu de démonstration servie à
l'utilisateur, faute de route pour l'alimenter.** Un défaut d'alimentation n'a rien d'un défaut de
rendu : l'écran est correct, la donnée est en base, et c'est le chemin entre les deux qui manque.

**La leçon de la campagne, et c'est elle qui dit où chercher la suite :**

> Les campagnes précédentes ont refermé les fuites **par le haut** — gabarit racine, contexte de
> coquille, contexte de console — parce que ce sont les canaux qu'**une route unique alimente** :
> une seule correction y ferme des dizaines de vues d'un coup. Ce qui restait ouvert est exactement
> ce qui n'a **aucune route** : une page d'erreur, un composant partagé dont la propriété n'est
> jamais passée, un module hors de portée de toute propriété.

Les trois formes se sont vérifiées une par une :

- **la page d'erreur** — `+error.svelte` n'est pas une route, elle n'a pas de chargeur, et elle
  montait deux vues sans jamais leur passer le chemin demandé (lot A) ;
- **le composant partagé** — V-15 montait le bloc de lecture **sans `affichee`**, et le bloc
  retombait sur la note de démonstration (lot L) ;
- **le module hors de portée** — `outils.ts` portait le périmètre d'ouverture de la cartographie en
  constante, à côté du même littéral écrit deux fois dans la vue (lot C).

| Lot | Ce qu'il a rendu vrai |
|---|---|
| C — périmètre | `/cartographie` ouvrait sur « Univers Production », un nom que **rien ne pose sur une instance réelle** : zéro nœud, légende vide, et un voile qui annonçait « Aucune relation dans ce périmètre » — faux, puisque ce n'est pas le périmètre qui est vide, c'est qu'il n'existe pas. Le périmètre honnête était déjà écrit deux fois dans le dépôt (V-20, V-21) ; V-19 était la seule dissidente. Le littéral avait **trois** sources — le chargeur et deux endroits de la vue — et n'en corriger qu'une laissait la faute en place. Mesuré sur une instance dont l'univers s'appelle « Socle technique » : de 0 nœud, 0 arête, 0 type en légende, à **24 nœuds, 21 arêtes, 8 types**, sans voile |
| A — 404 | `+error.svelte` montait V-26 et V-04 **sans leur passer le chemin** : aucune des deux vues n'avait de propriété pour le recevoir. Toute adresse cassée annonçait « /notes/bascule-telephonie-voip », et « Créer la note » ouvrait l'éditeur pré-rempli avec ce titre — **le seul endroit du produit où une valeur du jeu pouvait atteindre la base par un geste d'utilisateur**. Seconde fuite, indépendante : V-04 retombait sur `assistance.exemple.fr`, et cette valeur l'emportait **même sur une adresse configurée en console**. La clé descend maintenant par le gabarit racine ; vide, le bouton n'est plus émis |
| D — obligation | La console écrivait `obligatoire`, `aide` et `defaut` en base, l'écran le confirmait à l'administrateur, et **rien nulle part ne les lisait** : la forme du champ au formulaire avait été recopiée à la main sur l'état d'avant la migration 008, onze minutes après elle. L'éditeur peint la marque, l'aide et le défaut ; le serveur **refuse en 400** en nommant les propriétés manquantes. La forme est désormais **dérivée** de `ChampDeFiche`, non recopiée — un verrou par assertion avait été posé d'abord, et il ne verrouillait rien : un sur-ensemble structurel est assignable au sous-ensemble. Second défaut trouvé en chemin : le défaut du schéma se pré-posait dans l'éditeur d'une **note existante** et entrait en base sans que personne l'ait saisi ; l'origine des valeurs est passée par l'appelant |
| L — lecture | `/notes/{id}?version` rendait, pour **n'importe quelle** note, le titre, le rangement, l'auteur, les 412 consultations et le corps de la note de démonstration, sous un fil d'Ariane qui nommait la vraie note — et ses deux liens internes menaient à une note qui rend **404** sur une instance réelle. La route servait déjà la donnée ; personne ne la passait à V-15. Trois défauts partent avec : `?version={n}` **servait le corps courant** sous un bandeau annonçant un état antérieur, donc « Restaurer cette version » écrasait la note avec un contenu jamais montré ; le cumul de consultations était **en retard d'une unité sur sa propre fenêtre** ; et les propriétés typées d'une fiche, qui ne se relisaient **nulle part** hors de l'éditeur, sont rendues en lecture. Levée au passage : le panneau appelait une conversion qui **lève** sur deux des six valeurs de l'énumération des types de champ — un seul champ `date` au référentiel aurait mis toute lecture de fiche en **500** |

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
| lecture d'une note | titre, corps rendu, cartouche, relations, rétroliens, consultations, **et les propriétés typées de la fiche** — *le panneau de sommaire, lui, est vide sur toute note écrite dans le produit : défaut n° 3* |
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

Huit défauts, dans l'ordre où ils coûtent cher. Le premier est sur le **premier écran d'une
installation réelle** ; le deuxième tue un contrôle à l'ouverture ; le troisième contredit un écran
avec lui-même ; les autres font mentir une date, un chiffre, et servent encore du jeu de
démonstration.

### 1. L'accueil public émet des boutons d'assistance vers une adresse VIDE

Sur une instance neuve, `portail_assistance` vaut `''` (`src/lib/base/schema.ts:464`) : le chargeur
descend bien la clé, et les vues en font `href=""`. Un tel lien **recharge la page** — c'est la
seule chose qu'il fait, sur l'écran que voit le premier visiteur d'une installation réelle.

```
GET /            (anon, instance neuve)   200   deux boutons « Ouvrir un ticket d'assistance »
                                                href="" — V-01:268, :309, :336
GET /recherche   (anon, sans résultat)    200   idem — V-02:493 et :516
GET /guides/{id} (anon)                   200   idem — V-03:742
```

**La garde existe déjà, et elle est écrite en toutes lettres à côté** : `src/vues/V-04.svelte:352`,
`{#if assistanceJoignable}`, motivée par « un lien d'assistance sans destination n'est pas une
issue ». V-06 la porte aussi (`:145`) — `/mot-de-passe-oublie`, la porte de secours d'un utilisateur
enfermé dehors, est donc **saine**. Ce sont **six liens dans trois vues publiques** qui ne l'ont pas
reçue : V-01 (×3), V-02 (×2), V-03 (×1). Même propriété, même condition, même phrase à recopier.

### 2. Le sélecteur de périmètre de `/cartographie` n'a pas d'option pour son propre défaut

Le lot C a posé le défaut de la carte à `{ type: 'global' }` (`src/lib/donnees/outils.ts:194`,
valeur `global|`), mais le `select` de `src/vues/V-19.svelte:373-379` n'énumère que **les univers et
les domaines**.

```
GET /cartographie   200   carte JUSTE, corpus entier
                          #perimetre : selectedIndex === -1, value === ""
```

Le contrôle est donc **vide au-dessus d'une carte peuplée**, et une fois un univers ou un domaine
choisi, **aucune option ne ramène au corpus entier**. Les deux cartographies sœurs la portent —
V-20 : `global|` → « Tous les domaines » ; V-21 : `tout|` → « Tout le corpus ». V-19 est la seule à
ne pas avoir reçu l'option avec son nouveau défaut : le lot a réparé la carte et laissé son contrôle
désaccordé.

### 3. Le sommaire est VIDE sur toute note écrite dans le produit

`sommaireDe()` (`src/routes/notes/[identifiant]/+page.server.ts:200`) écarte tout titre dont
`ancre === null` — et **rien n'attribue jamais d'ancre** :
`src/lib/edition/schema.ts:229` la déclare `ancre: { default: null }`, les commandes de titre de
l'éditeur posent `setBlockType(heading, { level })` **sans ancre**
(`src/lib/edition/editeur-client.ts:298-300`), et le câblage de l'opérationnel construit lui aussi
`ancre: null` (`src/routes/notes/[identifiant]/operationnel/cablage.ts:97`).

```
note portant deux titres de niveau 2 en base
GET /notes/{id}   200   #article  : « Avant de couper » et « Après le redémarrage » rendus
                        #sommaire : « Aucun titre dans cette note »
```

**Les deux se contredisent sur le même écran**, en lecture (V-14) comme en historique (V-15). Seule
exception, et elle ne sauve rien : le gabarit d'insertion « Titre de niveau 2 »
(`src/lib/edition/constructions.ts:99`) pose l'ancre **littérale** `s-nouveau` — deux sections
insérées par ce bouton partagent donc une seule ancre, et les deux entrées du sommaire mènent à la
première.

### 4. Trois versions écrites dans la même minute sont toutes datées « hier »

`relatif(jours)` (`src/vues/V-15.svelte:375-380`) rend `'hier'` dès `jours <= 1`, or
`joursEcoules()` (`src/lib/donnees/lecture.ts:120`) rend **0** en deçà de 24 h.

```
note créée et modifiée trois fois dans la minute
  panneau d'historique   « hier », « hier », « hier »  — version courante comprise
  bandeau de la MÊME page « Version 1 du 25/08/2026 »
```

### 5. Une note vérifiée à l'instant affiche « Vérifié il y a 0 jours »

Même famille, autre écran : `src/lib/fraicheur.ts:275`. Relevé sur
`/notes/n-redemarrer-un-commutateur` immédiatement après `POST ?/verifier` → **200**.

### 6. Renommer une propriété REPLIE sa ligne en pleine saisie

Dans `/console/types-de-fiches`, `deplies` est indexé par la clé de la propriété
(`src/vues/V-29.svelte:786`) et `changerLaPropriete()` (`:425-427`) **ne le remappe pas** quand la
clé change.

```
propriété dépliée, champ « Nom technique » modifié, sortie du champ
  data-ouvert : « oui » → « non »
  disparaissent de l'écran : la valeur par défaut, l'aide, la case « Propriété obligatoire »
```

`retirerLaPropriete()` (`:462`) laisse en outre des clés mortes dans `deplies`.

### 7. Les pistes de reformulation sont encore des littéraux du jeu de démonstration

`src/vues/V-26.svelte:229` et `src/vues/V-08.svelte:496` : quatre mots en dur chacun, servis sur une
instance neuve, chacun branché sur une recherche qui **ne rendra jamais rien**.

```
GET /notes/inexistante-xyz   404   « sauvegarde · restauration · astreinte · supervision »
GET /recherche?q=…           200   « restauration · sauvegarde · barman · plan de reprise »
       chaque piste → /recherche?q=…   200, aucun résultat
```

C'est le motif « description faite de littéraux » que la campagne précédente a fermé sur l'écran
d'export, resté ouvert sur deux écrans — et « barman » est le vocabulaire même que le lot L devait
purger.

### 8. Mineur — un pluriel en dur

`src/lib/lecture/NoteDeDemonstration.svelte:504` : une note ouverte une seule fois affiche
« **1 consultations** · 1 sur les 30 derniers jours ».

---

## Ce que le plan a délibérément laissé

**C'est la partie de ce document qui vaut le plus pour la suite.** Chacune de ces lignes est un choix
tenu, pas un oubli : le plan les a écartées en connaissance de cause. Reprendre l'une d'elles, c'est
ouvrir un lot, pas corriger un défaut.

### En tête : `motFiche` — c'est la campagne suivante

`M14.7` rend **un seul** des douze termes contractuels renommable, et globalement, par la console de
configuration. Le champ existe (`/console/configuration`, V-33), l'écriture existe
(`src/lib/donnees/administration.ts:548`), la lecture existe
(`src/lib/donnees/lecture.ts:974`), et la dérivation des quatre formes existe
(`src/lib/vocabulaire.ts` — singulier et pluriel, capitalisé et non). **Et le renommage ne change
rien à l'écran.**

La cause est exactement le motif de cette campagne, un cran plus haut : `vocabulaire.ts` dérive ses
quatre formes de `CONFIG.motFiche`, **c'est-à-dire de `seeds/corpus.ts`** — une constante de module,
figée au chargement, hors de portée de toute propriété et de toute route. La valeur lue en base ne
sert qu'à **remplir le champ de saisie de l'écran qui la modifie**. Les vingt-cinq modules qui
rendent le mot importent la constante ; l'administrateur qui renomme « Fiche » en « Objet » voit son
réglage enregistré, relu, et **contredit par tous les écrans**.

Ce que lever la dette demande, et pourquoi c'est un lot et pas un correctif :

- faire **descendre** les quatre formes par le contexte de coquille et le contexte de console, comme
  la campagne précédente l'a fait pour les seuils de fraîcheur — c'est-à-dire donner une route au
  mot, sur les deux canaux qui atteignent toutes les vues ;
- traiter les emplois **hors de portée d'un contexte** — un module de calcul, une constante de
  section, un texte de courriel : ce sont ceux qui resteront après, et ils se comptent un par un ;
- ne **pas** toucher aux identifiants — noms de classes, clés, types : le gel les fige, et les
  renommer casse le rendu sans rien rendre renommable ;
- garder le rendu **identique à l'octet** avec la valeur par défaut, qui vaut `Fiche`.

| Autre chose laissée | Raison, et ce qu'il faudrait pour le lever |
|---|---|
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

Et la leçon propre à cette campagne, celle qui dit où chercher : **une fuite de démonstration reste
ouverte exactement là où aucune route ne passe.** Quand une valeur d'instance est juste à un endroit
et fausse à un autre, ne cherche pas une seconde erreur de rendu — cherche **le canal qui alimente
le premier endroit, et l'écran que ce canal n'atteint pas**. Une page d'erreur n'a pas de chargeur,
un composant partagé n'a que les propriétés qu'on lui passe, et une constante de module n'en reçoit
aucune.

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
