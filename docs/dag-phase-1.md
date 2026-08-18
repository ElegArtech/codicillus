# DAG de la phase 1 — les 41 vues en squelette statique conforme

> **Lot T-006b** — artefact de planification, greffon §4.12 du guide (`règles/workflow_agentic.md`).
> Format de l'annexe E du guide — `tâche | dépend de | vague | exécutant` — enrichi des quatre
> colonnes que le pilote exige : criticité (`PLAN-DE-REALISATION.md` §6.2), ressources exclusives
> (§6.4), états à couvrir (RG-M18-03) et critère de sortie (§4.3).
>
> **Sans DAG, la parallélisation est un pari ; avec, c'est une lecture.** Ce document est ce qui
> justifie les worktrees : il dit qui peut tourner en même temps que qui, et pourquoi.

---

## 1. Ce que la phase 1 livre, et rien d'autre

**Les 41 vues en squelette statique conforme.** Chaque vue rendue avec les fixtures de
`seeds/corpus.ts`, liée selon `docs/routes.md`, **sans logique métier et sans base de données**.

C'est le **temps 2 du protocole UI** (`règles/workflow_agentic.md` §4.15, `CLAUDE.md` §7) appliqué
à l'échelle du produit :

1. *Extraction* — la lecture prouvée de la maquette, premier livrable de chaque lot, avant toute
   ligne de code ;
2. **squelette statique conforme** — `pnpm verif:maquette V-xx` vert ; **c'est la phase 1** ;
3. *logique* — **phase 2**, DAG des lots T-010 à T-059 du plan §6.3 ;
4. *preuves* — jointes à chaque lot, aux deux phases.

Le motif est celui du plan : **la conformité s'établit avant que la logique ne rende le rendu
coûteux à corriger.** Un rendu qu'on redresse après coup se redresse contre du code qui en dépend ;
avant, il ne coûte qu'un gabarit.

### 1.1 Numérotation

Les lots de phase 1 sont numérotés **T-101 à T-119**, hors de la plage T-001…T-059 que le plan §6.3
réserve à la vague 0 et à la phase 2. Un lot de phase 1 ne remplace jamais son homologue de phase 2 :
`T-101` (coquille en squelette) précède `T-016` (coquille avec logique), il ne le rend pas caduc.
La colonne *Écho phase 2* de la table rend cette correspondance lisible.

### 1.2 Le corpus n'est pas le même pour toutes les vues

Les 41 maquettes ne portent que **cinq jeux de notes strictement emboîtés** — 32, 27, 19, 14 et le
jeu vide (E-04). `seeds/corpus.ts` expose `corpusPourVue()` : chaque vue est nourrie du
sous-ensemble **exact** que sa maquette emploie. Nourrir une vue du mauvais jeu rend la comparaison
visuelle sans valeur — elle prouverait la conformité d'un rendu que la maquette n'a jamais produit.
C'est une contrainte de lot, pas une commodité.

---

## 2. Les contraintes de découpe, et ce qu'elles imposent

### 2.1 La coquille d'abord, et seule

**35 vues sur 41 portent la coquille applicative V-37** — rail, barre supérieure, arborescence, fil
d'Ariane. Les six qui ne la portent pas sont V-01 à V-06 (espace public et authentification,
BRIEF §3.3). La coquille est donc en **vague 1**, et **seule** : la paralléliser avec une vue qui en
dépend créerait exactement le conflit que le §6.4 proscrit — deux lots écrivant la même définition
de composant.

Même raisonnement pour les **catalogues transverses V-38, V-39 et V-40** : les états vides, de
chargement et d'erreur qu'ils portent sont employés par **toutes** les vues (§6 de `docs/routes.md`
les désigne comme catalogue de référence). Ils précèdent les familles, en **vague 2**, et seuls.

### 2.2 V-41 tôt, mais après ses propres sections

**V-41 est une page réelle de l'application** (`STACK-TECHNIQUE.md §4.1`, ARB-002), jamais une
maquette morte : c'est là que la divergence du système visuel devient **immédiatement visible**
— le risque R-06 y est détecté à la journée, pas à la vague. Elle vient donc juste après la
coquille, en **vague 3**.

Elle ne peut pas venir plus tôt : **ARB-002 fait de V-38, V-39 et V-40 les sections de V-41**, sans
adresse propre, servies par la même route `/bibliotheque`. Les mettre dans la même vague ferait
écrire à deux lots le même fichier de route — le cas que le §6.4 interdit nommément. La vague 2
livre les composants, la vague 3 la page qui les expose.

**L'adresse est `/bibliotheque`, au premier niveau, et non `/console/bibliotheque`.** Les quatre
maquettes de la famille rendent un fil `["Accueil", "<nom>"]`, quand les six vues de console rendent
`["Accueil", "Console", "<section>"]` : *la console y renvoie, elle ne la contient pas* (ARB-002,
précision du 18 août ; `ECART-009 b)`). Le rôle reste administrateur, et l'entrée de navigation qui
y mène vit dans la console — c'est T-103 qui la rend, pour ce seul rôle.

### 2.3 Ensuite, par familles faiblement couplées

| Famille | Vues | Lots |
|---|---|---|
| Rangement | V-10, V-11, V-12, V-13, V-22, V-23 | T-104, T-109 |
| Lecture et rédaction | V-14, V-15, V-16, V-17, V-18 | T-105, T-110, T-114 |
| Recherche | V-08, V-09 | T-106 |
| Console | V-27 à V-36 | T-107, T-108, T-112, T-113 |
| Outils | V-19, V-20, V-21, V-24 | T-111, T-115 |
| Public et authentification | V-01 à V-06 | T-116, T-117 |
| Périphérie | V-07, V-25, V-26 | T-116 *(V-26)*, T-118, T-119 |

**La périphérie est la seule famille éclatée**, et pour une raison de route : V-26 rejoint V-04
dans T-116. Voir §3.

### 2.4 Deux lots ne se parallélisent que s'ils ne partagent rien

Règle du §6.4, appliquée sans exception : **ni fichier de route, ni définition de composant.** La
colonne *Ressources exclusives* de la table maîtresse est la mise en œuvre de cette règle : ce
qu'un lot y déclare, aucun autre lot de la même vague ne l'écrit.

Deux règles de mode s'y ajoutent :

- **Deux à quatre lots simultanés au plus** (§6.4). Le parallélisme maximal de ce DAG est **4**.
- **Un lot de criticité haute s'exécute seul dans sa vague** (§7.7 : « pas de parallélisation » ;
  §6.4 : « les lots à criticité haute ne sont jamais parallélisés entre eux »). La lecture stricte
  est retenue. Deux lots sont concernés : T-116 et T-117, qui occupent chacun une vague entière.

---

## 3. Les collisions de route, et comment elles sont traitées

Relevé exhaustif à partir de `docs/routes.md`. Quatre routes servent deux vues, et deux familles
d'adresses sont servies par un chemin de code unique.

| # | Route ou chemin partagé | Vues | Traitement |
|---|---|---|---|
| **K-1** | `/` — V-01 sans session, V-07 avec session | V-01, V-07 | **Séquencées, jamais parallèles.** T-116 écrit la route et sa branche anonyme ; **T-118 en dépend** et ajoute la branche connectée. Un seul fichier de route, un seul lot à la fois |
| **K-2** | `/recherche` — V-02 sans session, V-08 avec session | V-02, V-08 | **Séquencées.** T-106 écrit la route et la branche connectée (V-08, la forme complète) ; **T-116 en dépend** et ajoute la branche anonyme — V-02 est V-08 « amputée de ce qui n'a pas de sens sans compte », donc dérivée, jamais préalable |
| **K-3** | *(toute adresse non résolue)* — V-04 en anonyme, V-26 en connecté | V-04, V-26 | **Réunies dans le même lot, T-116.** ADR-007 impose **un seul chemin de code** pour le refus et l'inexistence ; deux lots parallèles y écrivant chacun leur branche est la manière la plus sûre de faire apparaître la branche « interdit » que l'ADR interdit. C'est pour cette collision que la famille *périphérie* est éclatée |
| **K-4** | `/bibliotheque` — V-41 et ses trois sections | V-38, V-39, V-40, V-41 | **Vagues 2 puis 3**, jamais parallèles (§2.2) |
| **K-5** | `/notes/{identifiant}` — V-14 en page, V-15 en superposition sur `?version=` | V-14, V-15 | **Même lot, T-105.** V-15 n'a pas de chemin propre : son fil d'Ariane est identique à celui de V-14 |
| **K-6** | `/mot-de-passe-oublie` et `/mot-de-passe-oublie/{jeton}` | V-06 *(2 routes)* | **Même lot, T-117.** Une vue, deux adresses, quatre étapes |
| **K-7** | `/notes/nouvelle` et `/notes/{identifiant}/modifier` | V-17 *(2 routes)* | **Même lot, T-110** |
| **K-8** | `/univers/{u}/{d}/signets/nouveau` et `…/signets/{identifiant}/modifier` | V-23 *(2 routes)* | **Même lot, T-109**, avec V-22 dont elles sont la suite du fil |
| **K-9** | `/console/imports` et `/console/imports/{lot}` | V-35 *(2 routes)* | **Même lot, T-113** |
| **K-10** | Gabarit de coquille V-37 | 35 vues | **Ressource gelée après T-101.** Un seul lot est autorisé à y revenir : **T-106**, qui monte la palette V-09 sur le champ de la barre supérieure (`V-37:3714`). Aucun autre lot n'écrit dans le gabarit ; s'il croit devoir le faire, c'est un écart à déclarer, pas une retouche |
| **K-11** | Motif commun de la console — huit vues le réemploient | V-27 à V-36 | **T-107 le crée** ; T-108, T-112 et T-113 le consomment sans l'écrire, et en dépendent |
| **K-12** | Gabarit `/univers/{u}/{d}` — partagé par la page de domaine, la liste, les dossiers et les signets | V-11, V-12, V-13, V-22, V-23 | **T-104 le crée** ; **T-109 en dépend** et n'ajoute que la branche `signets` |
| **K-13** | Gabarit `/notes/{identifiant}` — partagé par la lecture, la comparaison et les éditeurs | V-14, V-16, V-17, V-18 | **T-105 le crée** ; T-110 et T-114 en dépendent et n'écrivent que leurs sous-routes |

**Aucune de ces treize situations ne laisse deux lots parallèles écrire la même ressource.** C'est
la propriété que ce DAG existe pour garantir ; elle se relit ligne à ligne dans la colonne
*Ressources exclusives*.

---

## 4. Table maîtresse

**Exécutant de production, partout : `implementeur`** (`.claude/agents/implementeur.md` —
`isolation: worktree`, `permissionMode: plan`, effort élevé). Un lot = un contexte, jamais deux
contrats dans une même session (§4.15 du guide).

**Vérificateurs, selon §7.7 — celui qui écrit ne vérifie jamais.** Trois lentilles distinctes en
criticité haute, deux en moyenne, une en basse. Les rôles sont ceux de l'inventaire
`.claude/agents/` :

| Criticité | Vérificateurs | Lentilles |
|---|---|---|
| **Haute** | `verificateur-maquette` · `verificateur-specs` · `verificateur-acces` | conformité de rendu · conformité à la spec, ni plus ni moins · accès et périmètre, en mode adversarial |
| **Moyenne** | `verificateur-maquette` · `verificateur-specs` | conformité de rendu · conformité à la spec |
| **Basse** | `verificateur-maquette` | conformité de rendu |

En phase 1, la lentille de **conformité de rendu** est portante : il n'y a pas encore de logique
dont éprouver l'honnêteté par mutation, et c'est `pnpm verif:maquette` qui fait foi.

| Lot | Vues | Dépend de | Vague | Criticité | Exécutant | Ressources exclusives | États à couvrir | Critère de sortie |
|---|---|---|---|---|---|---|---|---|
| **T-101** — Coquille applicative *(écho T-016)* | V-37 | — | **1** | moyenne | `implementeur` | Gabarit de coquille : rail, barre supérieure, arborescence, fil d'Ariane, menu « Créer », menu utilisateur. `src/routes/+layout.svelte`. **Gelé ensuite** (K-10) | 8 états de planche — Contenu : tableau de bord · lecture ; Navigation : ouverte · escamotée ; Profil : référent · administrateur ; Cas : branche en chargement · aucun domaine accessible. **+ RG-M18-03 sur l'arborescence** | `pnpm verif:maquette V-37` conforme sur **tous** les états de `verif/scenarios/V-37.json` · `pnpm check`, `pnpm verif:jetons`, `pnpm verif:gel` en 0. **Interdiction de conclure** : ce lot ne déclare **pas** P-09 tenue comme propriété de sécurité — le rail rend un état de planche, il ne résout aucun droit (§8) |
| **T-102** — Catalogues transverses *(écho T-017)* | V-38, V-39, V-40 | T-101 | **2** | moyenne | `implementeur` | Composants de notification (4 types), 10 états vides, 6 esquisses de chargement, 4 portées d'erreur, 10 boîtes de dialogue. **Aucune route** — ARB-002 | 36 états : V-38 6 · V-39 20 · V-40 10. Ce lot **produit** la référence des quatre états de RG-M18-03 employée par tous les suivants | idem, sur V-38, V-39, V-40 |
| **T-103** — Bibliothèque de composants *(écho T-018)* | V-41 | T-101, T-102 | **3** | basse | `implementeur` | Route `/bibliotheque`, premier niveau (K-4). Entrée de navigation **de la console vers la bibliothèque** — la console y renvoie sans la contenir —, **rendue pour le seul rôle administrateur** (ARB-002, P-09, ADR-011) | 11 familles présentées côte à côte, **plus** les 36 états des trois sections | idem, sur V-41. **Interdiction de conclure** : ce lot ne déclare **pas** P-09 tenue comme propriété de sécurité — l'entrée rendue au seul administrateur est un état de planche (§8) |
| **T-104** — Rangement : univers, domaine, liste, dossiers *(écho T-032, T-033)* | V-10, V-11, V-12, V-13 | T-101, T-102 | **4** | moyenne | `implementeur` | Routes `/univers/{u}`, `/univers/{u}/{d}`, `…/notes`, `…/dossiers/{chemin…}` **et le gabarit `/univers/{u}/{d}`** (K-12). Paramètres de liste filtrée de V-12 | 28 états : V-10 7 · V-11 8 · V-12 7 · V-13 6. Dont *domaine sans note*, *dossier vide*, *droit effectif* × 3 | idem, sur V-10, V-11, V-12, V-13 |
| **T-105** — Lecture d'une note et historique *(écho T-023, T-035)* | V-14, V-15 | T-101, T-102 | **4** | moyenne | `implementeur` | Route `/notes/{identifiant}` **et son gabarit** (K-13). Paramètres `?registre=`, `?version=`, `#{ancre}` | 18 états : V-14 11 · V-15 7. Dont les trois bandeaux, les deux registres, le panneau ouvert et fermé | idem, sur V-14, V-15 |
| **T-106** — Recherche et palette *(écho T-028, T-029)* | V-08, V-09 | T-101, T-102 | **4** | moyenne | `implementeur` | Route `/recherche`, **branche connectée** (K-2). Montage de la palette sur le champ de la barre supérieure — **seule dérogation admise au gel de la coquille** (K-10). Paramètres `q`, `mode`, `tri`, sept facettes répétables | 14 états : V-08 8 · V-09 6. Dont *trop de résultats*, *sens indisponible*, *un seul caractère*, petit écran 360 px | idem, sur V-08, V-09 |
| **T-107** — Console : motif commun, univers, domaines *(écho T-050)* | V-27, V-28 | T-101, T-102 | **4** | moyenne | `implementeur` | **Motif commun de la console** (K-11), routes `/console` *(redirection 308)*, `/console/univers`, `/console/domaines`. Entrée `Gestion › Console` du rail, rendue pour le seul administrateur | 11 états : V-27 6 · V-28 5. Dont les trois refus de suppression | idem, sur V-27, V-28 |
| **T-108** — Console : référentiels *(écho T-051)* | V-29, V-30, V-31 | T-107 | **5** | basse | `implementeur` | Routes `/console/types-de-fiches`, `/console/types-de-relations`, `/console/templates` | 15 états : 5 × 3. Formulaire fermé · création · édition ; suppressions refusée et possible | idem, sur V-29, V-30, V-31 |
| **T-109** — Signets *(écho T-048)* | V-22, V-23 | T-104, T-102 | **5** | basse | `implementeur` | Routes `…/signets`, `…/signets/nouveau`, `…/signets/{identifiant}/modifier` (K-8). **N'écrit pas** le gabarit de domaine (K-12) | 13 états : V-22 6 · V-23 7. Dont l'ambivalence d'enveloppe — page dédiée / boîte de dialogue —, déclarée par la planche | idem, sur V-22, V-23 |
| **T-110** — Éditeurs de note *(écho T-020, T-025)* | V-17, V-18 | T-105 | **5** | moyenne | `implementeur` | Routes `/notes/nouvelle`, `/notes/{identifiant}/modifier` (K-7), `/notes/{identifiant}/operationnel`. Paramètres de pré-remplissage. **N'écrit pas** le gabarit `/notes/{identifiant}` (K-13) | 12 états : V-17 6 · V-18 6. Dont *doublon détecté*, *enregistrement en échec*, *désynchronisé* | idem, sur V-17, V-18 |
| **T-111** — Cartographie *(écho T-038, T-040)* | V-19, V-20 | T-101, T-102 | **5** | moyenne | `implementeur` | Routes `/cartographie`, `/cartographie/par-type`. Paramètres `?perimetre=`, `?type=`, `?criticite=` et **`?noeud=`** (ARB-007) | 11 états : V-19 6 · V-20 5. Dont *trop dense*, *calcul en cours*, *nœud disparu*, *maître sans relation*. **Alternative textuelle** exigée dès le squelette (RG-M18-11, P-06) | idem, sur V-19, V-20 |
| **T-112** — Console : comptes et configuration *(écho T-052)* | V-32, V-33 | T-107 | **6** | moyenne | `implementeur` | Routes `/console/comptes`, `/console/configuration` | 10 états : V-32 6 · V-33 4. Dont *édition du dernier administrateur* et *valeurs refusées* | idem, sur V-32, V-33 |
| **T-113** — Console : analytique, imports, exports *(écho T-044, T-045, T-053)* | V-34, V-35, V-36 | T-107 | **6** | moyenne | `implementeur` | Routes `/console/analytique`, `/console/imports`, `/console/imports/{lot}` (K-9), `/console/exports`, `/console/exports/{univers}/{domaine}` | 10 états : V-34 2 · V-35 4 · V-36 4. **V-35 et V-40 n'ont pas de planche** : leurs états sont présentés côte à côte dans la page (E-03) | idem, sur V-34, V-35, V-36 |
| **T-114** — Comparaison de versions *(écho T-036)* | V-16 | T-105 | **6** | moyenne | `implementeur` | Route `/notes/{identifiant}/comparaison`, paramètre `?versions=`. **N'écrit pas** le gabarit `/notes/{identifiant}` (K-13) | 5 états. Dont *même version* et *sans différence*. **Marqueur en plus de la couleur** et alternative textuelle dès le squelette (RG-M18-11) | idem, sur V-16 |
| **T-115** — Carte mentale et import *(écho T-041, T-043)* | V-21, V-24 | T-101, T-102 | **6** | moyenne | `implementeur` | Routes `/carte-mentale`, `/importer`. Paramètre `?perimetre=` de la carte mentale | 10 états : V-21 3 · V-24 7. **L'étape 4 de V-24 porte le rapport d'import du contributeur** (ARB-003) : elle est livrée avec la vue, et aucune route de rapport n'existe hors console | idem, sur V-21, V-24 |
| **T-116** — Espace public et adresses non résolues *(écho T-046, T-049)* | V-01, V-02, V-03, V-04, **V-26** | T-102, T-106 | **7** | **haute** | `implementeur` | Route `/` **et sa branche anonyme** (K-1), branche anonyme de `/recherche` (K-2), route `/guides/{identifiant}`, **et la résolution unique des adresses non résolues** — V-04 et V-26 (K-3, ADR-007) | 20 états : V-01 7 · V-02 5 · V-03 5 · V-04 3 · V-26 5 *(décomptes de `docs/routes.md` ; `verif/scenarios/` fait foi — `ECART-009 c)`)*. **Deux exigences d'indiscernabilité sont vérifiables dès le squelette** : les cas *adresse inexistante* et *note existante non publique* de V-04 doivent rendre un pixel identique (`V-04:2219` : « la vérification la plus importante de cette vue »), de même que les cas *inexistante* et *hors de vos droits* de V-26, à la chaîne demandée près | idem, sur V-01, V-02, V-03, V-04, V-26. **Interdiction de conclure** : ce lot ne déclare **pas** `RG-ACC-04` tenue — l'indiscernabilité de corps, d'en-têtes, de code et de **temps de réponse** relève de la batterie 6 et de T-011 (§8) |
| **T-117** — Authentification *(écho T-012, T-047)* | V-05, V-06 | T-101, T-102 *(+ ordonné après T-116 : deux lots de criticité haute ne partagent pas une vague)* | **8** | **haute** | `implementeur` | Routes `/connexion`, `/mot-de-passe-oublie`, `/mot-de-passe-oublie/{jeton}` (K-6), `/deconnexion`. Paramètres `?motif=`, `?suite=` | 13 états : V-05 6 · V-06 7. **V-06 porte la même exigence de non-divulgation que V-04** : *identifiant inconnu* rend le même écran que *identifiant connu* à l'étape 2 — vérifiable au pixel dès le squelette | idem, sur V-05, V-06 |
| **T-118** — Accueil contributeur *(écho T-034)* | V-07 | T-101, T-102, T-116 | **9** | moyenne | `implementeur` | **Branche connectée de `/`** (K-1). N'écrit pas la branche anonyme | 9 états. Dont *rien en attente*, *activité en erreur*, *aucune note*, *aide de première visite*. **RG-M18-04 y est explicitement attesté** : l'activité en erreur pendant que les indicateurs s'affichent | idem, sur V-07 |
| **T-119** — Profil *(écho T-049)* | V-25 | T-101, T-102 | **9** | basse | `implementeur` | Route `/mon-profil`, paramètre `?onglet=` | 7 états. Quatre onglets, deux profils de compte, *mot de passe verrouillé* | idem, sur V-25 |

### 4.1 Critère de sortie, énoncé une fois pour toutes

Identique pour les dix-neuf lots, sans dérogation :

> Pour **chacune** des vues du lot : `pnpm verif:maquette V-xx` **conforme sur tous les états
> déclarés dans `verif/scenarios/V-xx.json`** — pas une partie, pas « les principaux », **tous** —,
> le niveau 1 (structure) vert sans tolérance, le niveau 2 conforme ou arbitré au niveau 3 et
> consigné ; **et** `pnpm check`, `pnpm verif:jetons`, `pnpm verif:gel` en **0**.

**Le décompte d'états qui fait foi est celui de `verif/scenarios/`, jamais celui de la colonne
*États à couvrir*.** Cette colonne reprend les décomptes de `docs/routes.md`, qui divergent des
scénarios sur trois vues — V-03, V-08, V-39 (`ECART-009 c)`). Les scénarios sont extraits
mécaniquement des planches et c'est eux que la commande exécute ; l'alignement des deux documents
se fera à la clôture de T-007, sur un fichier figé. En attendant, la colonne sert à dimensionner un
lot, pas à borner sa vérification.

**Une vue partiellement conforme n'est pas une vue livrée** (plan §4.3). C'est le point sur lequel
ce DAG ne transige pas : un lot qui rend 6 états sur 7 n'a pas livré 86 % de sa vue, il n'a rien
livré. L'état manquant est systématiquement le plus coûteux — vide, erreur, sans droit —, et c'est
celui que la logique de phase 2 rendra impossible à rattraper sans tout rouvrir.

S'y ajoute, à chaque lot, le protocole UI complet : la restitution d'extraction **avant** toute
ligne de code, et les preuves jointes — rapport de conformité avec code retour et écarts chiffrés,
captures côte à côte par état. « Ça correspond à la maquette » sans rapport joint est un critère
non rempli (`CLAUDE.md` §7).

---

## 5. Le graphe, en vagues

| Vague | Lots | Parallélisme | Ce que la vague ferme |
|---|---|---|---|
| **1** | T-101 | 1 *(imposé)* | La coquille, dont 35 vues dépendent |
| **2** | T-102 | 1 *(imposé)* | Les quatre états de zone, référence de toutes les vues |
| **3** | T-103 | 1 *(imposé)* | La bibliothèque de composants — le système visuel devient observable (R-06) |
| **4** | T-104, T-105, T-106, T-107 | **4** | Les quatre têtes de famille : rangement, notes, recherche, console |
| **5** | T-108, T-109, T-110, T-111 | **4** | Référentiels, signets, éditeurs, cartographie |
| **6** | T-112, T-113, T-114, T-115 | **4** | Comptes, journaux, comparaison, carte mentale et import |
| **7** | T-116 | 1 *(criticité haute)* | L'espace public et la résolution unique des adresses non résolues |
| **8** | T-117 | 1 *(criticité haute)* | L'authentification |
| **9** | T-118, T-119 | 2 | Accueil contributeur et profil |

**Dix-neuf lots, neuf vagues, parallélisme maximal 4.** Les vagues 1 à 3 sont séquentielles par
construction — elles bâtissent ce dont tout le reste dépend. Les vagues 4 à 6 portent le gros du
travail à quatre worktrees. Les vagues 7 et 8 sont mono-lot par criticité, non par dépendance.

```
T-101 ──> T-102 ──> T-103
             │
             ├──> T-104 ──> T-109
             │       └────> (gabarit domaine, K-12)
             ├──> T-105 ──> T-110
             │       └────> T-114
             ├──> T-106 ──────────────> T-116 ──> T-117
             │                            ├─────> T-118
             ├──> T-107 ──> T-108         └─────> (résolution 404, K-3)
             │        ├───> T-112
             │        └───> T-113
             ├──> T-111
             ├──> T-115
             └──> T-119
```

### 5.1 Assignation de topologie

- **Orchestrateur** — session principale. Lit ce DAG et les contrats, prépare les worktrees, lance
  les exécutants, collecte les preuves, tient `docs/journal/V1.md`. **Il ne code pas.** Une session
  principale qui produit du code de vue est le signal que la topologie a cédé (§4.15 du guide).
- **Exécutant** — `implementeur`, un contrat par contexte, dans son worktree.
- **Auxiliaires** — l'extraction (temps 1 du protocole UI) et la vérification partent en
  sous-agent : elles consomment du contexte sans en produire pour la suite. Seul le résultat
  remonte.
- **Capitalisation** — `capitalisateur` à la clôture de chaque lot et de la phase.

---

## 6. Ce que la phase 1 ne livre pas

Cette section est aussi contraignante que la table. Un lot de phase 1 qui implémenterait de la
logique métier serait **hors contrat**, même « pour préparer » — et c'est précisément la forme que
prend le débordement : jamais une décision assumée, toujours une anticipation raisonnable.

| Non livré en phase 1 | Où c'est livré | Ce qui tient lieu de comportement dans le squelette |
|---|---|---|
| **Toute persistance** — schéma, migrations, base de données | T-010, phase 2 | `seeds/corpus.ts` via `corpusPourVue()`, en lecture seule |
| **L'authentification réelle** — sessions, mots de passe, jetons, ralentissement | T-012 | Le persona est une donnée de fixture ; V-05 et V-06 rendent leurs états, ils n'authentifient personne |
| **La résolution des droits** — droit effectif, héritage, projection dans l'index | T-011, T-027 | Les états *lecture seule* / *écriture* et *sans droit* sont des états **rendus**, choisis par la fixture |
| **La recherche réelle** — index, facettes calculées, mode Sens, tolérance aux fautes | T-027, T-028, T-054 | Résultats et compteurs viennent du corpus figé ; les paramètres d'adresse sont lus et reflétés, jamais exécutés |
| **Le calcul de fraîcheur** | T-013 | Les libellés et badges viennent du corpus, à horloge gelée à la date de référence. **P-01 n'est pas contournable pour autant** : aucun lot de phase 1 n'écrit un second calcul « provisoire » |
| **Les versions, l'historique, la comparaison calculée** | T-019, T-035, T-036 | V-15 et V-16 rendent des versions de fixture ; aucun diff n'est calculé |
| **L'import, l'export, la conversion** | T-042 à T-045 | V-24, V-35 et V-36 rendent leurs étapes et leurs rapports depuis le corpus ; aucun fichier n'est lu ni écrit |
| **La cartographie calculée** — sous-graphes, criticité, communautés | T-037 à T-040 | V-19, V-20 et V-21 rendent le graphe du corpus, mis en page ; aucune analyse n'est exécutée |
| **Les budgets de performance** | T-057 | Sans objet : il n'y a rien à mesurer sur un rendu de fixture |

**Le test qui tranche.** Si un lot de phase 1 a besoin d'une donnée que `seeds/corpus.ts` ne porte
pas, la réponse n'est **jamais** de la calculer : c'est soit un état que la maquette ne déclare
pas — donc hors périmètre —, soit une donnée manquante du corpus — donc un écart à déclarer
(`règles/workflow_agentic.md` §4.15, protocole d'écart). Inventer la valeur enfreint P-02 *et* la
règle de non-comblement d'un seul geste.

**Ce que la phase 1 livre malgré tout, et qui n'est pas de la logique métier** : le routage et la
liaison inter-vue selon `docs/routes.md`, la lecture et la restitution des paramètres d'état portés
par l'adresse, la sélection du sous-corpus par vue, et les quatre états de zone de RG-M18-03. Ce
sont des propriétés de rendu, vérifiables par comparaison ; elles appartiennent au temps 2.

---

## 7. Condition de clôture de la phase 1

Reprise de **`ECART-008 c)`**, dont le report est **tracé et non facultatif**.

`pnpm verif:jetons` outille aujourd'hui P-1.1 à P-1.7 et son exception d'épaisseur de trait, P-3.1,
P-3.2, P-4.1, P-4.2, P-6.1, P-6.2 et RG-NF-08. **Cinq sous-contrôles restent non outillés :**

| Sous-contrôle | Ce qu'il vérifie | Pourquoi il n'était pas outillable à T-004 |
|---|---|---|
| **P-2** | Croisement sélecteur ↔ jeton | Demande l'inventaire fermé de `docs/DESIGN.md` extrait en liste exploitable |
| **P-4.3** | Idem, sur les jetons d'espacement et de rayon | Idem |
| **P-5** | Assigné à T-009 par ADR-002 | — |
| **P-7** | Balisage de composants | Porte sur des vues, et aucune vue n'existait |
| **P-8** | Balisage de composants | Idem |

**Ils doivent être opérants avant que la phase 1 ne se close. Aucune vague de vues ne se clôt
sans eux.**

Le motif est le même que celui qui a justifié leur report, retourné : à T-004, ils ne laissaient
passer aucun défaut parce qu'**aucune vue n'existait**. En phase 1, quarante et une vues existent —
c'est exactement le moment où ils deviennent la seule chose qui voie certains défauts.

**Ce que la comparaison de rendu ne voit pas.** Un jeton employé **hors de son rôle** produit un
rendu identique au bon. Une couleur de fraîcheur posée sur un élément qui n'a rien à voir avec la
fraîcheur, un jeton d'espacement employé comme rayon, un composant balisé avec les classes d'un
autre : `pnpm verif:maquette` sort vert, et la divergence du système visuel s'installe sans témoin.
Elle se paiera à la première évolution de jeton, quand un changement de couleur de fraîcheur
déplacera une bordure sans rapport. **Sans P-2, P-4.3, P-5, P-7 et P-8, la conformité reposerait
sur la seule comparaison de rendu**, qui est aveugle à cette classe de défaut.

**Portée exacte.** Ce n'est pas une condition de sortie des lots T-101 à T-119 — ils sortent sur le
critère du §4.1. C'est une **condition de clôture de la phase**, à la charge de l'orchestrateur, et
elle bloque le passage en phase 2. Deux jalons naturels : P-2, P-4.3 et P-5 dépendent de
`docs/DESIGN.md` et sont outillables **dès maintenant** ; P-7 et P-8 portent sur le balisage et
deviennent outillables **dès T-103**, quand la bibliothèque de composants rend l'inventaire complet
sur une page réelle. Les repousser au-delà de la vague 4 ferait porter le défaut par toutes les
familles à la fois.

Une batterie qui sort en 0 en annonçant ce qu'elle ne couvre pas est honnête ; une batterie qui
sort en 0 en silence est un faux témoin. Le script énonce ces cinq manques à chaque exécution : ils
ne disparaîtront pas de la sortie tant qu'ils n'auront pas disparu du reste à faire.

---

## 8. Ce que la phase 1 ne prouve pas, et qui ne doit pas être déclaré tenu

La règle de non-comblement s'applique aussi à un artefact de planification, et elle a une jumelle
moins visible : **ne pas déclarer prouvé ce qui ne l'est pas.** Un lot qui sort vert sur
`verif:maquette` a prouvé un rendu ; il n'a rien prouvé d'autre. Trois propriétés sont dans ce cas,
et chacune est reportée à un lot nommé, en criticité haute, avec lentille adversariale.

| Propriété | Ce que la phase 1 établit | Ce qu'elle **ne** peut **pas** établir | Où c'est prouvé |
|---|---|---|---|
| **P-09** — une action interdite n'est pas affichée | Que l'état existe et qu'il rend juste : le rail sans les dossiers interdits, la console absente des autres profils, l'entrée de bibliothèque rendue au seul administrateur (ARB-002) | Que **rien d'interdit n'est dans le DOM** — ni grisé, ni masqué par CSS. Dans un squelette statique il n'existe **aucun droit réel** : le « profil administrateur » est un état de planche, pas une frontière de sécurité | Batterie 7 (`pnpm test:droits`), lots **T-011** et **T-016** |
| **RG-ACC-04** — refus et inexistence indiscernables | Que V-04 et V-26 rendent leurs cas au pixel près par un chemin unique, et que V-06 rend le même écran pour un identifiant connu et inconnu | Que corps, en-têtes, code **et temps de réponse** sont identiques sur une résolution d'adresse réelle | Batterie 6, lot **T-011** |
| **Indiscernabilité temporelle** (ARB-005) | Rien : elle n'est pas observable sur un rendu | Aucune batterie ne la mesure à ce jour | **T-011**, assigné par ARB-005 (`ECART-009 e)`) |

**La criticité de T-101 et de T-103 n'est pas relevée pour autant** — moyenne et basse. Le motif
est celui de `ECART-009 d)` : la criticité découle de ce que le lot touche, et un squelette statique
ne touche aucune frontière de sécurité. La règle vaut dans les deux sens — elle ne se relève pas à
l'humeur, elle ne se baisse pas non plus au motif qu'un lot « a l'air simple ». Ce qui est ajouté
n'est pas un vérificateur, c'est **une interdiction de conclure** : elle figure au critère de sortie
de T-101 et de T-103 (§4.1).

### 8.1 Ce que ce document a cessé de ne pas trancher

Deux points figuraient ici à la première rédaction, et ils l'ont quitté par des voies opposées —
la distinction mérite d'être gardée, parce qu'elle dit quand s'arrêter sert et quand il faut
chercher plus loin.

- **Le fil d'Ariane de la bibliothèque.** Refuser de le décider était juste : c'eût été combler
  contre une source gelée. Mais il n'y avait rien à arbitrer — **la maquette avait déjà répondu**,
  et le constat croisé des dix fils (six de console, quatre de bibliothèque) suffisait à
  réconcilier l'arbitrage avec elle (`ECART-009 b)`). L'arrêt était le bon réflexe ; la lecture
  qui a suivi était le vrai travail.
- **La référence de l'état « sans droit ».** Signalée comme écart, elle a été **corrigée à la
  source** dans ADR-007 et ARB-005 : `RG-M18-03`, quatrième des quatre états de zone
  (`ECART-009 a)`). Un document d'exécution ne la rectifie plus localement, il cite la source juste.

---

*Fin de `docs/dag-phase-1.md` — lot T-006b. Phase 2 : DAG des lots T-010 à T-059,
`cadrage/PLAN-DE-REALISATION.md` §6.3.*
