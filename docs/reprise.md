# Où reprendre

*État au 25 août 2026, après la campagne des promesses non tenues. Le harnais de vérification a été
supprimé : ce document ne cite aucune batterie, il dit **ce qu'un utilisateur peut faire**, avec ses
codes HTTP relevés.*

À la clôture : `pnpm check` **= 0**, `pnpm test:unit` **= 0** — 1 645 contrôles sur 67 fichiers. Les
huit copies de travail du pilote et les neuf bases de lot ont été retirées ; il ne reste que
`codicillus` (développement) et `codicillus_demo`.

---

## Les lots

**Fusionnés : B, C, D, G, E, H, A, F.** **En quarantaine : aucun.**

Cette campagne-ci n'a réparé qu'un seul motif : **une promesse que l'interface fait et que le code ne
tient pas.** Les cinq défauts que le document précédent laissait ouverts en étaient tous, et le
balayage lancé sur leur motif commun en a trouvé **quinze au total, dont treize mensonges** — cinq
fois ce que l'intégration avait vu. Le produit ne se trompait pas sur des détails : il promettait des
fonctions inexistantes dans le texte même de ses écrans, à des endroits où l'utilisateur agit sur la
foi de la phrase.

La règle qui a tranché chaque cas, et qu'il faut garder :

> **Quand la capacité est là ou à portée, on branche le geste. Quand la fonction n'existe pas, on
> cesse de la promettre — dans l'interface, en toutes lettres.**

Le modèle vient du dépôt lui-même : `accueil.ts` recense cinq données sans contrepartie, le gabarit
racine passe `synchro: null`, **et la ligne n'est pas émise**. Personne n'est trompé, rien n'est
inventé.

| Lot | Ce qu'il a rendu vrai |
|---|---|
| B — rangement | Le bouton « Voir les notes de {domaine} » et les entrées « Nouveau dossier » / « Nouveau signet » du menu **Créer** — présentes sur **toute vue à coquille complète**, pas sur un écran — étaient composées sur le rattachement du compte **sans vérifier sa lisibilité** : le même chargeur sortait un rail vide et un rangement non nul. Les trois entrées sont désormais émises **par cible** — la page du domaine, ses notes, son formulaire de signet ne demandent pas le même droit ni le même module — et ce qui ne mène nulle part n'est plus émis du tout, y compris sans JavaScript |
| C — cartographie | Tout type de fiche créé en console s'affichait **« Note », losange, code NOT** : le repli du gel rendait son objet tel quel pour toute clé absente de sa table de sept. Cinq types produisaient cinq pastilles identiques dont les filtres portaient cinq types différents. La clé **est** le nom ; forme, code et teinte se dérivent maintenant du nom par calcul pur, sans colonne ajoutée. Les sept clés du gel rendent l'objet du gel à l'octet |
| D — export | Cinq des six lignes de l'arborescence annoncée par `/console/exports` étaient fausses — un rapport en `.md` là où l'archive écrit du texte nu, un `domaine.json` jamais produit, le titre mis en ardoise là où le fichier le reprend au caractère près, les pièces jointes sans le dossier par note, et pas de racine là où l'archive range tout sous le domaine. Cause unique : la description était faite de **littéraux**. Les noms viennent désormais de `src/lib/export/noms.ts`, que la fabrique et l'écran lisent tous deux. Le second mensonge du même écran est parti : « réimporter l'archive […] garantit que vous n'êtes pas prisonnier de ce produit », alors qu'**aucun chemin d'import d'archive n'existe** |
| G — courriel | Le produit n'a **aucun expéditeur de courriel** et aucune table de jeton. `/mot-de-passe-oublie` — la seule porte de secours d'un utilisateur enfermé dehors — promettait un lien par courriel et rendait **501** sans même lire la base. Les deux adresses rendent un écran unique qui déclare l'indisponibilité et nomme le chemin **qui existe** : la réinitialisation par un administrateur. Sont retirés, pas masqués : la saisie d'identifiant, les jalons, l'écran d'envoi, la saisie du nouveau mot de passe, la confirmation, et « Lien expiré » qui affirmait qu'un lien avait existé. `RG-ACC-04` devient structurelle — l'écran ne demande plus rien et ne lit aucun compte. Sur `/mon-profil`, l'interrupteur « Recevoir les demandes de révision par courriel », coché en dur sans gestionnaire ni colonne, n'est plus émis |
| E — versions | **Aucun `delete(versions)` n'existait dans tout `src/`** : trois phrases sur deux écrans annonçaient une purge, et l'administrateur agissait sur un champ inerte. La purge s'exécute dans la transaction d'enregistrement — le produit n'a aucun ordonnanceur — et retire **tout l'excédent**, V-33 engageant un rattrapage et non un plafond glissant. Second défaut trouvé en posant le plafond : `parametres` est **vide** sur une instance neuve et l'enregistrement était un `update` nu — les sept réglages de M14.7 étaient inertes sur toute installation réelle, 200 rendu, zéro ligne écrite. Le champ vidé donnait `Number('') === 0`, et V-15 rendait « les **0** dernières sont gardées » ; les trois valeurs numériques sont validées, et une valeur inutilisable retombe sur le défaut de `RG-M07-03` |
| H — console | Trois écrans prenaient une saisie, l'affichaient comme acquise, et la jetaient. `/console/types-de-fiches` demandait une description, une icône, et par propriété une aide, une valeur par défaut et un caractère obligatoire : **aucune des cinq n'avait de colonne** — `008_saisies_de_console` les pose, la console les écrit et les relit. « Il devra être changé à la première connexion » était faux : une colonne, une garde dans `hooks.server.ts`, et le compte est renvoyé vers son profil tant qu'il n'a pas changé — sauf mot de passe verrouillé, que `RG-CPT-01` empêche de changer. Un refus que le gel ne sait pas marquer — adresse déjà portée, mot de passe vide, 404 sur un gabarit disparu — ne rendait **rien** : le panneau restait ouvert et l'utilisateur croyait avoir enregistré ; les deux écrans le disent |
| A — fiche | **Le plus gros lot des trois campagnes.** Le sélecteur « Type de fiche » affichait les vrais types de l'instance et sa valeur ne quittait jamais l'écran : `notes.type_de_fiche_id` n'était posé par **aucune route** — la seule écriture atteignable était une nullification. Le conteneur des propriétés restait vide, la vue lisant les clés du référentiel sans jamais lire ses valeurs : le trou était de **deux étages**. Choisir un type fait apparaître ses champs et force le type de note à « Fiche » (`RG-NOT-01`) ; rouvrir en modification restaure le type **et** ses valeurs ; le vider retire les deux colonnes dans la même mise à jour, sans quoi le `CHECK` fait échouer l'enregistrement. Levées du même coup : la console comptait tout type comme inutilisé, le panneau de propriétés de la cartographie ne s'ouvrait jamais, la facette `typeFiche` était vide en permanence, l'aller-retour export → import amputait la note de son type. Second défaut : le gabarit des pastilles gardait sur le type de **note** — `n.type === 'Fiche'` — et non sur la présence du type de fiche ; **sept écrans rendaient littéralement « Fiche undefined »** |
| F — import | Le seul lot qui répare une **écriture au mauvais endroit**. Le scénario n'était transmis nulle part : « Importer un domaine complet » demandait un « Nom du domaine à créer * » que personne ne lisait, masquait le sélecteur de domaine, et l'action rangeait les notes dans le domaine proposé **par défaut** — un domaine que l'utilisateur n'avait pas choisi. L'étape 1 n'offre plus que le scénario livré, le choix voyage, et l'action **refuse explicitement** ce qu'elle n'exécute pas au lieu de dériver en silence. Cessent aussi de promettre : la résolution automatique des liens, le renvoi « conservé en attente » qui n'est conservé nulle part, l'archive qu'on invitait à déposer alors que le classement l'écarte, et le journal « consultable indéfiniment » que rien n'enregistre |

**Deux reprises de contre-lecture méritent d'être connues**, parce qu'elles nomment le piège du
motif :

- Le lot F avait retiré le scénario non livré de l'étape 1 et **rebranché la case de simulation sur
  le scénario restant sans relire le texte qu'elle porte** : « utile pour vérifier un corpus préparé
  avant de l'engager » redevenait visible et nommait le scénario qu'on venait de retirer. Le motif
  réparé, réintroduit à l'écran d'à côté.
- Le lot H avait replié les tables de démonstration **clé par clé** sur la donnée servie : sur toute
  instance portant un type « Serveur » sans description — l'état exact après `pnpm base:peupler` —,
  ouvrir « Modifier » puis « Enregistrer » sans rien toucher **écrivait en base** une phrase que
  personne n'avait saisie.

D'où la règle du protocole, tirée de la campagne précédente et vérifiée deux fois par celle-ci :

> **Quand un écran DÉCRIT un artefact — un fichier, une arborescence, une durée, une garantie —,
> corriger un champ de la description oblige à relire l'artefact ENTIER**, et la description ne doit
> contenir que des noms **importés de la source**, jamais des littéraux.

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Créer une note dont le titre est déjà pris | `POST /notes/nouvelle` → **303**, identifiant suffixé |
| **Créer une note de type fiche** | le type choisi fait apparaître ses champs, le type de note bascule sur « Fiche », et `type_de_fiche_id` **et** `proprietes_typees` sont posés en base |
| **Rouvrir une fiche en modification** | le type et ses valeurs sont restitués ; vider le type met les deux colonnes à `null` dans la même mise à jour |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée |
| **Dépasser le plafond de versions** | plafond à 3, six enregistrements → il reste exactement les **trois dernières** ; abaisser le plafond purge l'excédent au prochain enregistrement |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer un signet | `POST .../signets/nouveau` → **303** → `/notes/{identifiant}` |
| Modifier / supprimer un signet | `POST .../signets/{id}/modifier?/…` → **303**, puis **404** |
| Créer un sous-dossier | `POST .../dossiers/{chemin}?/creerSousDossier` → **303** → **200** sur l'enfant, **et l'enfant est listé** |
| Ouvrir le rangement d'un domaine neuf | pastille « Dossiers » → **200** sur la racine nommée |
| Adresse nue d'un rangement | `GET …/dossiers` → **308** → `…/dossiers/{domaine}` |
| **Demander un mot de passe oublié** | `GET`/`POST /mot-de-passe-oublie` → **200** — plus de **501** — écran unique qui nomme le chemin réel, **sans révéler si le compte existe** |
| **Créer un compte en console** | le mot de passe initial **doit** être changé : la garde renvoie vers le profil tant qu'il ne l'est pas, sauf mot de passe verrouillé |
| **Créer un type de fiche en console** | description, icône, aide, valeur par défaut et caractère obligatoire **survivent au rechargement** |
| Importer un lot | `POST /importer?/analyser` → aperçu conforme au rapport, et le contenu atterrit dans le **domaine choisi** |
| Simuler un import | rapport annoncé comme simulation, aucun lien, base inchangée |
| Exporter un domaine | l'arborescence annoncée par l'écran coïncide **entrée par entrée** avec le zip produit |

L'aller-retour du corps est **idempotent** : deux réenregistrements sans frappe rendent un corps
identique, et aucune version n'est écrite pour un enregistrement sans changement. L'écriture d'un
import l'est aussi : rejouer le même dépôt met à jour, il ne duplique pas — et l'aperçu le dit avant
de le faire.

Le **produit construit** démarre et sert : `pnpm build` puis `node build/index.js` avec les cinq
variables de base (`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE` — jamais une
URI composée) et les deux du moteur de recherche. Sans ces dernières, **le démarrage refuse de
servir en les nommant**.

### Écran par écran — mesuré, pas déclaré

**Tout est à 200 en rédacteur**, et l'écran montre la donnée réelle :

| | |
|---|---|
| accueil | indicateurs, activité, corbeille de révisions, périmètre du compte — les indicateurs naviguent, filtrés |
| recherche | résultats réels, facettes, compteurs, pastilles, état vide, périmètre anonyme |
| lecture d'une note | titre, corps rendu, cartouche, sommaire, relations, rétroliens, consultations |
| historique | les vraies versions, ouvert par `?version`, restaurer marche et capture sa version |
| comparaison | modes Texte et Visuel sur les vraies versions, alternative textuelle |
| éditeur | ProseMirror — gras, titres, listes, tâches, tableaux, alertes — **et les propriétés du type de fiche choisi** |
| univers, domaine, notes, dossiers | listes, compteurs, santé, modules désactivés qui disparaissent — les pastilles naviguent, y compris sur un domaine sans note, et aucune n'est rendue à qui ne peut pas la suivre |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations, **chaque type nommé, de forme et de code distincts**, périmètres réels, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent dans le domaine choisi, simulation qui n'écrit rien et qui le dit |
| console (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |

La connexion fonctionne **sans JavaScript**.

---

## Ce qui ne marche pas — trouvé à l'intégration, sur une instance neuve

Cinq défauts, dans l'ordre où ils coûtent cher. Les deux premiers touchent tout utilisateur ; le
troisième tue un outil à l'ouverture ; les deux derniers font mentir un chiffre et laissent une
donnée invisible.

### 1. La page 404 annonce une adresse de DÉMONSTRATION au lieu de celle demandée

`src/routes/+error.svelte:137` et `:147` montent V-26 et V-04 **sans jamais leur passer
`page.url.pathname`** — la vue reçoit un *cas*, jamais l'adresse. Les deux retombent alors sur leurs
constantes de gel : `src/vues/V-26.svelte:157`
(`ADRESSE_PAR_DEFAUT = '/notes/bascule-telephonie-voip'`, employée en `:196`) et
`src/vues/V-04.svelte:104` (`'/guides/plan-de-reprise-volet-bases'`, employée en `:137`).

```
GET /notes/inexistante-xyz     404 « Adresse demandée /notes/bascule-telephonie-voip »
                                   pistes « sauvegarde restauration astreinte supervision »
                                   bouton « Créer la note « bascule telephonie voip » »
GET /guides/inexistant (anon)  404 « /guides/plan-de-reprise-volet-bases »
```

Reproduit à l'identique sur le **produit construit**. Toute adresse cassée de l'instance ment donc à
l'utilisateur sur ce qu'il a demandé, et lui propose de créer une note portant un titre du jeu de
démonstration. C'est la fuite de semence la plus visible qui reste, et elle est sur l'écran que voit
n'importe qui suivant un lien mort.

### 2. Une propriété OBLIGATOIRE d'un type de fiche n'est ni montrée ni exigée

La donnée descend pourtant jusqu'au client : `src/lib/donnees/lecture.ts:653` pose `obligatoire`,
`:652` pose `aide` et `defaut`. Mais `ChampDeFicheAuFormulaire`
(`src/lib/cablage/formulaires.ts:286`) ne déclare que `cle`, `nom`, `type`, `exemple`, `valeurs`, et
`rendreLesProprietesDeFiche()` (`:320-394`) ne pose **ni marque d'obligation, ni `required`, ni le
texte d'aide sous le champ, ni la valeur par défaut**.

Côté serveur, rien ne refuse : `lireLaSaisie()` (`src/lib/donnees/creation.ts:271`) ne contrôle que
la présence d'un type de fiche, et `resoudreLeTypeDeFiche()` (`:488`) ne filtre que les **clés**.

```
type « Serveur », champ adresse_ip marqué obligatoire = t en base
POST /notes/nouvelle sans cette valeur   200 + 303, note écrite
```

**Le lot H avait posé le bon garde-fou, et le lot A l'a périmé.** H, ne pouvant pas tenir
l'obligation, avait retiré les phrases qui la garantissaient et laissé une réserve honnête sous la
case : « L'éditeur de note ne la contrôle pas encore : **il n'écrit aucune propriété typée** »
(`src/vues/V-29.svelte:942-945`), et la même sous l'aide à la saisie (`:928-931`). A, fusionné ensuite, a
rendu l'éditeur écrivant — la réserve dit maintenant une chose fausse pour justifier une lacune
vraie. Les deux moitiés à reprendre ensemble : **exiger l'obligation** et **rendre l'aide et le
défaut**, ou réécrire la réserve. C'est le prix exact de l'ordre de fusion `H → A`.

### 3. `/cartographie` s'ouvre sur un périmètre de DÉMONSTRATION, et rend une carte vide

`src/lib/donnees/outils.ts:185` :
`export const PERIMETRE_DE_V19: PerimetreDAffichage = { type: 'univers', nom: 'Production' };`,
employé comme **défaut** par `src/routes/cartographie/+page.server.ts:108`.

```
instance neuve, seul univers « Infrastructure », 7 notes, 3 relations
GET /cartographie                                200  perimetreDemande "univers|Production"
                                                      vecteur { etat: "vide" }
                                                      #legende-types VIDE, aucun nœud dans le SVG
GET /cartographie?perimetre=univers|Infrastructure 200 etat "nominal", légende et nœuds rendus
```

L'outil est **mort à l'ouverture** pour tout utilisateur qui n'a pas nommé un univers « Production ».
Le lot C a réparé le périmètre du *sélecteur* ; c'est le **défaut** du chargeur qui reste.

### 4. Le compteur de consultations est toujours en retard d'une unité sur sa propre fenêtre

La page affiche un total **inférieur** au nombre des 30 derniers jours, ce qui est arithmétiquement
impossible. `src/routes/notes/[identifiant]/+page.server.ts:482` appelle `lireLaNote()` — qui lit
`notes.compteur_de_consultations` — **avant** `journaliserUneConsultation()` (`:517`), tandis que la
mesure sur 30 jours est comptée dans la table `consultations` après coup (`:388-391`, rendue en
`consultations30j` `:437`). Rendu par `src/lib/lecture/NoteDeDemonstration.svelte:474`.

```
note neuve, trois ouvertures successives
  « 0 consultations · 1 sur les 30 derniers jours »
  « 1 consultations · 2 »
  « 2 consultations · 3 »        la base portant bien 3
```

### 5. Mineur — les propriétés typées d'une fiche ne se relisent NULLE PART hors de l'éditeur

Elles s'écrivent (`notes.proprietes_typees`), se remontrent en modification et partent dans l'archive
d'export, mais la page de lecture n'en affiche aucune :

```
GET /notes/n-serveur-srv-02   200   ni « 10.0.0.99 », ni « C03 », ni « Adresse IP », ni « Salle »
                                    seul le nom du type — « Fiche Serveur » — est rendu
```

`mockups/V-14-lecture-note.html` ne dessine **aucun** panneau de propriétés : aucun bouton n'est
rendu inerte, le vide est de conception. Il est signalé ici parce qu'il rend l'obligation du défaut
n° 2 **doublement invisible** — la valeur qu'on forcerait à saisir ne se relit jamais.

---

## Ce que le plan a délibérément laissé

**C'est la partie de ce document qui vaut le plus pour la suite.** Chacune de ces lignes est un choix
tenu, pas un oubli : le plan les a écartées en connaissance de cause, et la campagne ne les a pas
touchées. Reprendre l'une d'elles, c'est ouvrir un lot, pas corriger un défaut.

| Laissé | Raison, et ce qu'il faudrait pour le lever |
|---|---|
| **Construire un expéditeur de courriel** | C'est une **fonction**, pas un correctif. Le lot G a cessé de la promettre et oriente vers le chemin qui existe. Le jour où l'on s'y met : un expéditeur, une table de jeton de réinitialisation, et les six écrans de V-06 à remonter — ils ont été **retirés, pas masqués** |
| **La table du journal d'imports** et `/console/imports/{lot}` | Lot à mandater : migration, écran de lot (`docs/routes.md:183`), plafond d'erreurs **par lot**, la règle interdisant toute purge dans le temps. Le lot F **cesse de contredire** `RG-M12-09` sans la tenir, et le dit à l'écran. La seconde moitié de la règle — « ce journal alimente le flux d'activité de l'accueil » — n'est tenue nulle part non plus : `lireLActivite()` ne reçoit aucun import |
| **Les deux scénarios d'import non livrés** (`UC-M12-02`, `UC-M12-03`) | Le lot F cesse de les offrir et refuse explicitement qui y arriverait par un chemin résiduel. Les construire est un lot en soi |
| **La résolution des renvois en relations** | `src/lib/donnees/import.ts` : la clé de renvoi **ne nomme pas le type de relation**. C'est un sujet de conception, pas de correctif. Aujourd'hui le renvoi est consigné au rapport et la relation reste à créer — et l'écran le dit |
| **`adresseDeDomaine()` qui slugifie le nom** | `src/lib/rangement/adresses.ts:83` compose l'adresse sur le **nom** au lieu de lire `domaines.identifiant` — `RG-M12-11` fige l'identifiant, pas le nom. C'est le **404-après-renommage** que la campagne précédente a corrigé sur `/mon-profil` et qui subsiste ici. Défaut voisin du lot B, consigné et non traité : il touche un utilitaire partagé, donc plusieurs lots |
| **`V-34`, les mesures d'analytique** | Dette **datée**, honnêtement traitée par `etatDesDonnees()` : l'écran déclare l'absence au lieu de l'inventer. Elle redeviendra dangereuse **le jour où les tables arriveront** — un état neutre explicite qui survit à sa cause devient un mensonge d'un autre genre |
| **Le filtrage de V-12 porté en SQL** | Ouvert depuis la première campagne. Lot de **performance**, pas de correction |
| **Les 17 avertissements a11y** | Préexistants, hors du périmètre de la campagne |

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
- **Six écrans de V-06 retirés** (lot G) : saisie d'identifiant, jalons, écran d'envoi, saisie du
  nouveau mot de passe, confirmation, « Lien expiré ». Le gel décrit un parcours par courriel que le
  produit n'a pas ; l'écran unique qui reste ne demande rien et ne lit aucun compte.
- **L'interrupteur de notification de `/mon-profil` n'est plus émis** (lot G) : coché en dur, sans
  gestionnaire ni colonne, il promettait des messages qui ne partiraient jamais.
- **L'étape 1 de l'import n'offre qu'un scénario sur trois** (lot F), et la case de simulation suit
  la garde du gel : le scénario n'étant plus offert, la case ne l'est pas non plus.
- **`/console/imports` porte un nœud que le gel de V-35 n'a pas** (lot F) : l'état vide explicite du
  journal, dérivé du recensement, sur le patron de ce que `V-34` fait déjà.
- **Forme, code et teinte d'un type de fiche hors gel sont dérivés du nom** (lot C) — `CAHIER:951`
  prescrit « assignées de façon déterministe », *assignées*, non *stockées*. Les sept clés du gel
  rendent l'objet du gel à l'octet.
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

Et la leçon propre à cette campagne : **une phrase d'interface est une promesse.** Un écran qui
affirme ce que le code ne tient pas est un défaut au même titre qu'un bouton inerte, et il se répare
des deux mains — brancher quand la capacité est à portée, cesser de promettre quand elle n'existe
pas.

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
