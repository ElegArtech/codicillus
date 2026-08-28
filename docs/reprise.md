# Où reprendre

*État au 28 août 2026, après la campagne **« huit lots, zéro question »**. Le harnais de vérification
reste supprimé : ce document ne cite aucune batterie, il dit **ce qu'un utilisateur peut faire**,
avec ses codes HTTP relevés.*

À la clôture, sur `master` :

```
pnpm check      = 0        1 163 fichiers, 0 erreur, 15 avertissements a11y préexistants
pnpm test:unit  = 0        75 fichiers, 1 770 contrôles
pnpm build      = 0
passage-a-froid          = 0    39 routes, base neuve jamais semée, session ET anonyme
aiguilles-dans-le-paquet = 0    111 aiguilles, 780 fichiers, DEUX zones, 0 exemption
passage à zéro univers   = 0    la première page d'une installation, avant toute création
```

**Il ne reste aucune branche non fusionnée, et aucune copie de travail.**

---

## Les huit lots

Cette campagne est partie d'une question — *l'application est-elle enfin viable ?* — et de la mesure
qui l'a suivie. La réponse était oui, avec une liste courte. Les huit lots l'ont épuisée.

| Lot | Ce qu'il a fermé |
|---|---|
| **L1 — la fuite du paquet serveur** | `build/server/chunks/chunks/creation.js` faisait **85 314 octets** et portait **les 32 notes de `seeds/corpus.ts` sérialisées en entier** — id, titre, auteur, extrait —, importé par **dix nœuds de routes**. C'est ce que l'image Docker porte et ce que `node build/index.js` exécute. La chaîne : `donnees/creation.ts` importait `corpsVide()` de `base/semence.ts`, qui importe `CORPUS` **en valeur**. `corpsVide()` n'est pas une fonction de semence — c'est la définition, par le produit, du corps d'une note vide : elle vit désormais dans `src/lib/contenu/corps-vide.ts`. **85 314 → 65 263 octets**, et l'exemption ESLint qui nommait la dette a disparu avec elle |
| **L2 — le garde-fou, deux moitiés** | `aiguilles-dans-le-paquet.mjs` ne balayait que `build/client/` en annonçant mesurer « ce qui se livre ». **C'est cette zone aveugle qui a laissé passer les 85 Ko de L1**, en déclarant « PAQUET PROPRE ». Il lit désormais les deux moitiés — occurrence par occurrence côté client, fichier par fichier côté serveur — et distingue le code de la prose. La branche `worktree-wf_65fc5159-13d-28`, restée en plan faute d'arbitrage, est absorbée |
| **L3 — l'écran d'amorçage** | Le panneau « Votre base est vide » s'affichait enfin (`43f8ebc`) mais sa rangée d'actions était **vide** : les deux boutons sont gardés sur `ecriture`, faux à zéro univers. L'écran dessiné pour ce moment conseillait de rapatrier et n'offrait aucun geste. Un troisième bouton — « Créer votre premier univers » — vers `/console/univers`, sous `administrateur && univers.length === 0`. Un **lien**, pas un bouton : Svelte n'émet pas les `onclick` en SSR |
| **L4 — les deux 404 nus** | `/notes/nouvelle` et `/importer` rendaient un 404 muet tant qu'aucun univers n'existe. Le code reste 404 — la route n'a vraiment nulle part où écrire — mais le message nomme la console, **pour un administrateur sur une instance à zéro univers seulement**. `ADR-007` n'est pas en cause : il gouverne l'adresse non résolue, et rien n'est révélé ici que le rail et l'accueil ne disent déjà. **Trois sites d'appel, pas deux** : l'action de `notes/nouvelle` porte sa propre porte |
| **L5 — `/importer`** | `Exploitation` et `Sauvegardes`, deux chemins de `CORPUS[].dossier`, étaient rendus **en gras du côté produit de la flèche** — l'écran montrait à l'installateur des dossiers que son domaine ne porte pas. Devenus `Contrats` et `Prestataires`. Le contrôle du paquet est aveugle ici **par construction, et il le dit** : un segment d'un seul mot ne distingue pas une valeur du corpus d'un nom commun. Un test le remplace, qui **dérive** la liste interdite de `seeds/corpus.ts` |
| **L6 — les accords** | « 1 contributeurs actifs » était faux **trois fois** — nom, adjectif, et le possessif de la sous-ligne. Avec : « 1 notes au total », « consultations sur 7 jours », « recherches sur 30 jours », « 0 brouillon(s) », « il y a 1 an(s) », et les deux jumeaux du message de seuil qui divergeaient **d'une apostrophe**. La branche `worktree-wf_99b7813d-93e-17` est absorbée |
| **L7 — les branches mortes du client** | `adresse` était **optionnelle** sur V-04 et V-26, si bien que leurs tables d'adresses de planche partaient dans le **chunk d'erreur** — celui que toute page d'erreur charge, en session comme en anonyme. La propriété est **requise** : le compilateur garde la porte, et les tables ont disparu. `V-21:141` filtrait les domaines sur le **nom** `'Applications'` dans un axe de planche qu'aucune route ne pose : le filtre est supprimé, la route ne sert déjà que les domaines visibles. **Les quatre exemptions du contrôle ont expiré avec leur cause** |
| **L8 — les clés de module** | `modulesDuChamp()` transtypait chaque segment en `CleDeModule` sans consulter le catalogue : six clés envoyées, l'action rendait 200 « possible », la base en portait trois. Une clé hors catalogue rend désormais un **refus nommé**. Le chargeur portait en outre une **seconde copie du catalogue**, mot pour mot — dangereuse dès lors que la relecture le consulte |

---

## Ce qui a été tranché en cours de route, et qui n'était pas au plan

**Le garde-fou du paquet ne pouvait plus jamais être vert.** Le balayage à deux zones comptait tout,
des deux côtés. Mesuré à l'intégration : `build/client` à **zéro**, `build/server` à **355
occurrences dont zéro dans du code** — 178 cartes de source et 177 commentaires, c'est-à-dire **la
prose de ce dépôt**, que le paquet serveur garde parce qu'il n'est pas minifié. L'en-tête de
`Rail.js` énumère à lui seul les quatorze dossiers du gel pour raconter ce qu'il a réparé.

Le critère est désormais **une propriété par zone, pas un seuil** :

- **`build/client`** — tout compte, code, prose et cartes. Ces fichiers sont servis comme ressources
  statiques **avant toute autorisation** ; un commentaire y est aussi lisible qu'un littéral.
- **`build/server`** — seul le **code** compte. Un littéral en commentaire ne s'évalue pas, ne se
  sérialise pas, n'entre dans aucune réponse : il n'est pas « à une route de se rendre ».

Rien n'est tu — le relevé affiche les 355 en entier et les redit au verdict même quand le contrôle
passe. Éprouvé par falsification : `Karim Belhadj` ajouté **en code** dans un chargeur fait rendre 1 ;
le même **en commentaire** fait rendre 0.

> **Un garde-fou qui ne peut pas être vert est un garde-fou qu'on débranche au troisième passage.**
> C'est le motif que cette trace existe pour empêcher, d'un cran plus haut : non plus le produit qui
> ment, mais l'instrument devenu inutilisable.

---

## Ce qui marche, prouvé dans un navigateur

Tout ce que le relevé du 26/08 listait tient toujours — se connecter, créer / modifier / supprimer
une note, les fiches et leurs propriétés typées, les versions et leur plafond, les signets, les
dossiers, la cartographie, l'import et l'export, les douze écrans de console. Le passage à froid le
rejoue à chaque construction sur **39 routes**, base neuve jamais semée, en session **et** en anonyme.

**Ce que cette campagne ajoute, et qu'aucune trace ne mesurait :** la première page d'une
installation, **avant toute création**. Base migrée, premier administrateur, zéro univers :

| | |
|---|---|
| `GET /` | 200, `data-etat="vide"`, le panneau d'amorçage **et son bouton** vers `/console/univers` |
| `GET /notes/nouvelle` | **404 qui nomme la console** |
| `GET /importer` | **404 qui nomme la console** |
| le rail | « Aucun univers n'existe encore sur cette instance. Créez-en un dans la console, puis un domaine » |
| console, bibliothèque, recherche, cartographie, carte mentale, profil | **200**, tous |

C'est le décor que `passage-a-froid` ne joue pas — il se crée un univers avant d'ouvrir ses routes.

---

## Ce qui ne marche pas

**Rien de connu.** Les quatorze constats du relevé du 26/08 sont fermés : les huit lots ci-dessus en
couvrent douze, et deux étaient déjà tombés (`43f8ebc`, `1fefb66`).

Trois faits ont été **relevés sans être corrigés**, chacun hors du périmètre du lot qui l'a vu, et
aucun n'empêche un geste :

- **`V-28.svelte:352` ne rend visible qu'un refus `champ === 'nom'`.** Le refus de clé de module que
  L8 vient d'écrire remonte bien à la vue, mais aucun bloc ne l'affiche : l'écran ne confirmera plus
  à tort, il restera **muet sur la cause**. Rien ne déclenche ce cas par l'interface — l'écran
  n'expose que des cases, jamais du texte libre.
- **`casDeV04()` (`donnees/public.ts:510`) n'a plus de lecteur en production.** Son seul appelant
  applicatif était le vecteur de V-04, parti avec la table qu'il indexait. Toujours exportée et
  éprouvée ; `vueDeLAdresseNonResolue()`, qui décide vraiment quelle vue servir, est intacte.
- **`donnees/equivalence.ts` importe encore `base/semence` et `seeds/corpus`.** Code mort :
  `rapportDEquivalence()` n'est importé par rien, pas même par son propre fichier de test, et
  `grep -rl "instantDeReference" build/server` rend **0**. Il ne met pas un octet dans le paquet.

---

## Ce que le plan a délibérément laissé

Chacune de ces lignes est un choix tenu. Reprendre l'une d'elles, c'est ouvrir un lot, pas corriger
un défaut.

| Laissé | Raison, et ce qu'il faudrait pour le lever |
|---|---|
| **Construire un expéditeur de courriel** | C'est une **fonction**, pas un correctif. Aucun expéditeur, aucune table de jeton ; l'écran unique de `/mot-de-passe-oublie` oriente vers le chemin qui existe, sans révéler si le compte existe. Le jour où l'on s'y met : un expéditeur, une table de jeton, et les six écrans de V-06 à remonter — ils ont été **retirés, pas masqués** |
| **La table du journal d'imports** et `/console/imports/{lot}` | Migration, écran de lot (`docs/routes.md:183`), plafond d'erreurs **par lot**, et la règle interdisant toute purge dans le temps. La seconde moitié de `RG-M12-09` — « ce journal alimente le flux d'activité de l'accueil » — n'est tenue nulle part non plus |
| **Les deux scénarios d'import non livrés** (`UC-M12-02`, `UC-M12-03`) | L'étape 1 cesse de les offrir et refuse explicitement qui y arriverait par un chemin résiduel |
| **La résolution des renvois en relations** | `donnees/import.ts` : la clé de renvoi **ne nomme pas le type de relation**. Conception, pas correction. Le renvoi est consigné au rapport, la relation reste à créer, et l'écran le dit |
| **`adresseDeDomaine()` qui slugifie le nom** | `rangement/adresses.ts:83` compose l'adresse sur le **nom** au lieu de lire `domaines.identifiant` — `RG-M12-11` fige l'identifiant, pas le nom. C'est le **404-après-renommage** déjà corrigé sur `/mon-profil`. Utilitaire partagé : le corriger dans une vague de vues le casserait ailleurs |
| **Les utilisations d'un gabarit** | `Template.utilisations` n'a **aucune colonne** : fonction à écrire. Le lot C n'a corrigé que le cas *zéro gabarit*, où la réponse est zéro et certaine |
| **`V-34`, les mesures d'analytique** | Dette **datée**, honnêtement traitée : l'écran déclare l'absence au lieu de l'inventer. Elle redeviendra dangereuse **le jour où les tables arriveront** — un état neutre explicite qui survit à sa cause devient un mensonge d'un autre genre |
| **Le filtrage de V-12 porté en SQL** | Ouvert depuis la première campagne. Lot de **performance**, pas de correction |
| **Les 15 avertissements a11y** | `pnpm check` = 0 : ce sont des avertissements, pas des erreurs, et ils préexistent aux campagnes |

---

## Ce que le gel dit et que la base ne porte pas

`instance` (version, dernière synchronisation), le résumé d'une version, les utilisations d'un
gabarit, la dernière connexion en relatif, la prose chiffrée de V-34. Tout s'affiche en **état neutre
explicite**. `arrive_le` et le refus d'un courriel indisponible n'ont **aucun nœud** au gel pour se
dire.

## Divergences avec le gel, assumées

- **Le panneau d'amorçage porte un troisième geste que le gel ne dessine pas** : « Créer votre
  premier univers », vers `/console/univers`, rendu au seul administrateur d'une instance à zéro
  univers. La planche ne dessine que deux boutons — elle ne dessine pas non plus l'installation
  neuve pour laquelle ils sont faits, et à zéro univers les deux mènent à un 404.
- **`V-10:424` et `V-15:358` s'accordent, là où le gel fige « (s) »** (`mockups/V-10:1864`,
  `mockups/V-15:2764`). Deux parenthèses recopiées ne valent pas une phrase fausse à 1, et la
  parenthèse est exactement le repli qu'`accord()` existe pour supprimer.
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
