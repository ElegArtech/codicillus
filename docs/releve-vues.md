# Relevé des 37 vues restantes

> **Lot T-100** — relevé unique, mécanique et clos, des trente-sept vues non livrées.
> Il est écrit pour être lu **avant** d'ouvrir un contrat de tâche, et pour que les dix-sept lots
> qui suivent ne découvrent plus leurs contraintes une par une.
>
> **Périmètre** : les 41 vues gelées, moins les quatre livrées — V-37, V-38, V-39, V-40.
> **Dépôt** : commit `538b3a8`. **Sources lues** : `mockups/` (lecture seule), `verif/scenarios/`,
> `verif/references/`, `src/lib/coquille/`, `seeds/corpus.ts`, `docs/DESIGN.md` §2.
> **Rien n'est écrit ici qui ne sorte d'une commande citée.**

---

## 0. Pourquoi ce lot existe, et ce qu'il change

Quatre vues ont été livrées en **deux lots de production** et **cinq lots correctifs**. Trois de
ces cinq étaient des amendements du gabarit de coquille — une classe sur `<main>` (ARB-015), la
cible et le libellé du lien d'évitement (ARB-019), deux divergences relevées en passant (ARB-020) —
**découverts un lot à la fois**, chacun au contact de la vue suivante. Chacun a coûté un arbitrage,
un lot dédié, une preuve de non-régression et un regel.

ARB-019 le disait déjà, sans pouvoir en tirer la conséquence :

> « Ce n'est pas le gel qui est mal posé : c'est **l'interface du gabarit qui se découvre au contact
> des vues**, et elle continuera. »

Ce lot fait, **une seule fois et sur les 37 vues d'un coup**, la lecture que les trois amendements
ont faite trois fois sur une vue chacun. Il ne code rien, ne touche ni le gabarit ni les maquettes,
et n'ouvre aucun `docs/ecarts/`.

**Ce qu'il trouve, et qui n'était écrit nulle part** : les 34 maquettes à coquille n'en portent pas
une, elles en portent **deux** — et le gabarit ne sait rendre que la première, portée par 8 vues,
dont les 4 déjà livrées. Les **26 autres** ne sont pas atteignables en l'état. §3.

---

## 1. La règle de production, et comment relire chaque chiffre

**Aucune énumération manuelle.** Quatre fois déjà un chiffre transmis d'un rapport à un arbitrage
s'est révélé faux au recomptage — `ECART-010` É-3, `ECART-016` É-1, `ECART-018` É-2, `ECART-021`.
La règle établie par `ECART-018` É-2 vaut ici comme ailleurs : **un chiffre cité n'est pas une
source.** Chaque nombre de ce document est produit par l'une des commandes ci-dessous, et la
commande est écrite à côté du nombre.

### 1.1 Les deux instruments écrits par ce lot

Ce sont des **instruments de lecture**. Ils ne rendent aucun verdict, ne sortent jamais en 1, ne
sont branchés sur aucune chaîne de vérification, et n'écrivent rien. Ils sont dans `verif/` parce
que c'est là que vit l'outillage, et parce qu'un relevé qui ne se rejoue pas est une affirmation,
pas une mesure.

| Instrument | Ce qu'il lit | Ce qu'il ne fait pas |
|---|---|---|
| `verif/releve-vues.mjs` | les 41 maquettes gelées, `verif/scenarios/`, l'inventaire de `verif/inventaire-composants.mjs`, l'ensemble de styles de `verif/styles-en-ligne.mjs` | il ne rend rien : lecture statique du balisage, des feuilles et des scripts |
| `verif/releve-etats.mjs` | les **265 états déclarés**, ouverts dans un navigateur, dans les conditions de capture du banc (`verif/banc/conditions.mjs`) | il ne compare rien à l'application — aucune vue n'existe —, ne joue pas les déclencheurs des états de zone, et ne rend aucun verdict de conformité |

**Pourquoi le second passe par un navigateur.** « Ce qui exigera un traitement particulier » —
dialogue modal, focalisation à l'ouverture, notification visible, superposition rendue — n'est pas
lisible dans le balisage : ce sont des propriétés du DOM **après** que le script de la maquette a
réglé la planche. Les trois lots qui s'en sont aperçus l'ont fait au pixel près et après coup
(`ECART-014` É-3, `ECART-017` É-3, `ECART-020` É-1). Ce script pose la question aux 265 états d'un
coup.

### 1.2 Le catalogue des commandes

```
node verif/releve-vues.mjs --restant                le tableau de bord des 37 vues
node verif/releve-vues.mjs --restant --coquille     classe/id de <main>, lien d'évitement, fil
node verif/releve-vues.mjs --restant --etats        états, nature, fenêtres, couples, doublons
node verif/releve-vues.mjs --restant --composants   transverses, propres, homonymes, orphelines
node verif/releve-vues.mjs --restant --pieges       styles, animations, dialogues, focus, href
node verif/releve-vues.mjs --restant --styles       l'ensemble clos des styles du gel (P-6.4)
node verif/releve-vues.mjs --restant --formes       les formes de coquille, et les classes sans règle
node verif/releve-vues.mjs --restant --gabarit      LA LISTE CLOSE DES AMENDEMENTS
node verif/releve-vues.mjs --restant --hors-app     les nœuds hors de div.app
node verif/releve-vues.mjs V-14                     la fiche d'une vue
node verif/releve-vues.mjs --json                   le relevé complet, exploitable

node verif/releve-etats.mjs --particuliers          les états qui sortent de l'ordinaire
node verif/releve-etats.mjs --incidence             ce que coûte, MESURÉ, chaque nœud hors gabarit
node verif/releve-etats.mjs V-27 --json             le relevé d'une vue, exploitable
```

Et les instruments préexistants, dont ce document ne fait que consommer la sortie :

```
node verif/inventaire-composants.mjs --liste=V-xx   les classes propres d'une vue (§2.F)
node verif/inventaire-composants.mjs --homonymes    les 66 définitions divergentes (§2.H)
node verif/inventaire-composants.mjs --orphelines   les 92 emplois orphelins (§2.I)
node verif/styles-en-ligne.mjs                      l'ensemble clos des styles en ligne (P-6.4)
pnpm scenarios:verifier                             que les scénarios sont bien l'extraction des planches
pnpm verif:gel                                      que les 43 empreintes n'ont pas bougé
```

### 1.3 Ce que le relevé confirme d'emblée, et qui n'était pas acquis

| Fait | Nombre | Commande |
|---|---|---|
| Vues du périmètre | **37** | `node verif/releve-vues.mjs --restant --coquille` |
| dont vues à coquille | **30** | idem, colonne *coq* |
| dont vues sans coquille | **7** — V-01 à V-06, V-09 | idem |
| États déclarés sur le périmètre | **220** | `node verif/releve-vues.mjs --restant --etats` |
| Couples de captures | **340** | idem |
| États déclarés sur les 41 vues | **265** | `node verif/releve-vues.mjs --etats` |
| Couples sur les 41 vues | **409** | idem — **le même 409 que l'étalonnage à blanc** |
| Vues contrôlées sur quatre fenêtres | **6** du périmètre — V-01, V-02, V-03, V-08, V-09, V-14 | `verif/banc/conditions.mjs`, `VUES_RG_M18_13` (ARB-009) |
| Maquettes portant deux blocs `<style>` | **41 / 41** | `pnpm vues:feuille V-xx --installer` est donc jouable partout |
| Globales de données de maquette absentes de `seeds/corpus.ts` | **0** | croisement des `window.XXX =` des 41 maquettes avec les `export` du corpus |

Le dernier point ferme une catégorie entière de risque : **aucune vue ne butera sur une donnée que
le jeu de semence ne porte pas.** Les 29 globales des maquettes ont toutes leur `export` dans
`seeds/corpus.ts`. Le « test qui tranche » du DAG §6 n'a, sur ce plan, aucun déclencheur.

*(Une exception, et elle est ailleurs : l'**arborescence du rail** de 26 vues n'est pas dérivable du
corpus. C'est l'amendement A-1e du §4, pas un manque de globale.)*

---

## 2. Ce que le gabarit sait faire aujourd'hui

Relevé sur `src/lib/coquille/Coquille.svelte`, regelé après ARB-019.

| Ce qu'il pose | Valeur |
|---|---|
| `a.saut-contenu` | `href="#{cibleEvitement ?? idContenu}"`, texte `libelleEvitement` *(défaut « Aller au contenu »)* |
| `div.app#app` | `data-rail`, `data-role`, `data-droits`, `data-contenu` — **et rien d'autre** |
| `aside.rail` | forme **complète** : `#rail-univers`, arborescence dérivée de `corpusPourVue()`, liens `Outils`/`Gestion` avec pictogramme et `data-vers`, `Gestion` en `si-admin` |
| `header.barre` | forme **complète** : `#bascule-rail`, `nav.fil#fil`, `.recherche#ouvrir-recherche`, `div.menu-barre#menu-creer` avec sa liste `role="menu"`, `div.menu-barre#menu-compte` avec la sienne |
| `main` | `class={classeContenu}` `id={idContenu}` *(défaut `contenu`)* |
| `div.notifs#notifs` | les quatre types de V-38, marque, corps, fermeture, progression, actions |

Dix-huit propriétés d'interface : `fil`, `courant`, `univers`, `domaines`, `notes`, `compte`,
`version`, `rail`, `role`, `droits`, `brancheEnChargement`, `notifications`, `enfants`, `contenu`,
`classeContenu`, `idContenu`, `cibleEvitement`, `libelleEvitement`.

---

## 3. Le fait qui commande tout : il existe **deux** formes de coquille au gel

```
node verif/releve-vues.mjs --formes
```

Les 34 maquettes à coquille se répartissent en **deux formes**, et la signature ne laisse aucune
place au doute — empreinte de `header.barre` entier, et de `aside.rail` privé de son arborescence :

| Forme | Vues | Dont livrées |
|---|---|---|
| **Complète** | **8** — V-07, V-14, V-27, **V-37, V-38, V-39, V-40**, V-41 | les quatre |
| **Abrégée** | **26** — V-08, V-10 à V-13, V-15 à V-26, V-28 à V-36 | aucune |

**Le gabarit implémente la forme complète.** C'est pourquoi les quatre vues livrées sont passées
sans rien voir : elles sont toutes du côté complet, avec V-07, V-14, V-27 et V-41 — c'est-à-dire
avec les quatre têtes de famille que le DAG place en premier. **Les 26 autres ne sont pas
atteignables en l'état**, et ce n'est pas une question de finition.

### 3.1 Les sept divergences, mesurées

| # | Ce que la forme abrégée fait | Ce que le gabarit fait | Portée |
|---|---|---|---|
| a | `header.barre` rend un `button.btn.si-ecriture[title="Créer"]` **nu** et un `button.avatar[title="…"]KB` **nu** | rend `div.menu-barre#menu-creer` et `div.menu-barre#menu-compte`, chacun avec sa liste `role="menu"` | 26 vues |
| b | les liens `Outils` (×4) et `Gestion › Console` n'ont **ni `<svg>` ni `data-vers`** | rend le pictogramme et l'attribut | 26 vues |
| c | la section `Gestion` porte **`si-ecriture`** | porte `si-admin` | 26 vues |
| d | pas de `<div id="rail-univers">` | rend le conteneur | 26 vues |
| e | l'arborescence est **écrite au balisage** : 15 nœuds, dont `Ordonnancement` et `Adressage` | la dérive de `corpusPourVue()` : **19 nœuds**, sans ces deux-là | 26 vues |
| f | l'espaceur de nœud feuille est `<span style="width:20px">`, **sans `flex`** | écrit `style="width: 20px; flex: 0 0 auto;"` — quand le gel de V-37 écrit `flex = "none"` (`V-37:3212-3213`) | 26 vues + le gabarit lui-même |
| g | `.recherche` n'a pas d'`id`, `#bascule-rail` et `#fil` restent | le gabarit pose `id="ouvrir-recherche"` | 26 vues |

**La divergence (a) n'est pas décorative, et le CSS le prouve.** `node verif/releve-vues.mjs
--restant --formes` liste, pour chaque vue, les classes que le gabarit **pose** et que les deux
feuilles de la vue **ne déclarent pas**. Les 26 vues abrégées ne déclarent **ni `.menu-barre`, ni
`.menu-barre__liste`, ni `.menu-barre__entete`, ni `.menu-barre__nom`, ni `.menu-barre__role`, ni
`.menu-barre__sep`** — six classes sur six. `.menu-barre__liste { display: none }` n'existant pas
dans leur feuille, la liste de menu que le gabarit rend **s'afficherait**, dépliée, dans la barre
supérieure de vingt-six vues.

**La divergence (e) n'est pas rattrapable par le corpus.** L'arborescence des 26 vues abrégées
porte `Infrastructure › Exploitation › Ordonnancement` et `Infrastructure › Réseau › Adressage`, que
`seeds/corpus.ts` ne connaît pas comme dossiers de notes, et **ignore** `Infrastructure ›
Applications › Serveurs`, `Fiches applicatives › Accès`, `… › Support`, `Déploiement › Comptes`,
`… › Salles`, que le corpus porte. Vérifié :
`sectionsDuRail(UNIVERS, DOMAINES, corpusPourVue(v))` rend **19 nœuds pour les 41 vues**, la variante
de corpus n'y changeant rien. Les deux arbres ne sont pas emboîtés : ils ne se déduisent pas l'un de
l'autre.

### 3.2 Une huitième divergence, qui touche 27 vues et non 26

Le gel écrit `aria-label="Replier {nom}"` sur le chevron d'un nœud **ouvert**, et
`"Déplier {nom}"` sur un nœud fermé (`V-37:3203`, et le balisage statique des 26 abrégées).
**`Rail.svelte` écrit « Déplier » sans condition.** C'est un **nom accessible**, donc le niveau 1 du
banc, qui est en échec sec et sans tolérance.

V-37 y échappe **par accident** : aucun de ses huit états ne déplie un nœud. Les 26 abrégées en
déplient deux ou trois, et **V-14 en déplie trois** — mesuré. Vingt-sept vues sont donc concernées,
dont une de forme complète.

C'est une **convergence** au sens d'ARB-020 : la ligne du gel est citée, rien n'est ajouté à
l'interface. Elle ne demande pas d'arbitrage numéroté ; elle demande la preuve de non-régression
sur les 45 états des quatre vues livrées.

---

## 4. La liste close des amendements du gabarit

```
node verif/releve-vues.mjs --restant --gabarit
```

**Cinq amendements. C'est le livrable principal de ce lot.** Ils sont à faire **en une seule fois**,
dans un lot dédié qui ne touche aucune vue — la discipline qu'ARB-019 a nommée et que trois lots
successifs ont tenue : *jamais d'écriture opportuniste dans la ressource gelée, toujours un
arbitrage numéroté, un périmètre écrit, une preuve de non-régression, un regel.*

| # | Amendement | Vues qui l'exigent | Nature | Attestation |
|---|---|---|---|---|
| **A-1** | **Rendre la forme abrégée de la coquille** — barre sans les deux menus, rail sans pictogrammes ni `data-vers`, `Gestion` en `si-ecriture`, pas de `#rail-univers`, arborescence fournie par la vue, espaceur `width:20px` | **26** — V-08, V-10…V-13, V-15…V-26, V-28…V-36 | **ajout d'interface → arbitrage numéroté** | rail `V-25:965-1074` contre `V-37:1200-1249` ; barre `V-25:1079-1094` contre `V-37:1251-1274` ; `V-25:1060` (lien sans pictogramme), `V-25:1066` (`rail__section si-ecriture`), `V-25:1089` et `:1093` (les deux boutons nus) |
| **A-2** | **Transmettre les attributs de données de la vue à `div.app`** | **27** — V-07, V-08, V-10…V-21, V-23…V-32, V-34, V-36, V-41 | **ajout d'interface → arbitrage numéroté** | 47 attributs, **26 noms distincts** : `data-activite data-affichage data-cas data-degrade data-dense data-detail data-donnees data-droit data-droits-vue data-enveloppe data-etape data-etat data-facettes data-filtres data-form data-historique data-meta data-mode data-numerote data-onglet data-reference data-registre data-trop data-verrou data-version data-vue` |
| **A-3** | **Corriger le libellé du chevron** : « Replier » quand le nœud est ouvert | **27** — les 26 abrégées **+ V-14** | **convergence (ARB-020)** — pas d'arbitrage numéroté | `V-37:3203` (`(ouvert ? "Replier " : "Déplier ") + nom`) ; `V-25:983` (`aria-label="Replier Infrastructure"`) |
| **A-4** | **Loger une superposition rendue hors de `div.app`**, entre `div.app` et `div.notifs` | **8** — V-15, V-23, V-27…V-32 | **ajout d'interface → arbitrage numéroté** | `V-15:1853` (`aside.tiroir#tiroir`), `V-23:1157` (`dialog#dlg-signet`, **ouvert à l'état par défaut**), `V-27:1261` (`aside.tiroir-form#tiroir`) |
| **A-5** | **Marquer l'entrée de rail courante** — `aria-current="page"` et son `data-vers` propre | **1** — V-07 | **ajout d'interface → arbitrage numéroté** | `V-07:1150` — `<a class="rail__lien" href="#" aria-current="page" data-vers="Vous êtes déjà sur l'accueil">` ; la règle qui le rend visible est `V-07:512` |

**A-2 n'est pas cosmétique** : sur les 47 attributs relevés, **36 sont lus par au moins un sélecteur
d'attribut de la feuille de la vue**, et les **onze** restants par le script de planche —
`V-08 data-mode`, `V-14` et `V-15 data-registre`, `V-18` et `V-26 data-cas`, `V-21
data-droits-vue`, `V-23 data-mode`, `V-24 data-etape`, `V-25 data-onglet`, `data-verrou`,
`data-activite`. **Aucun n'est décoratif.** Le gabarit ne les pose pas — y compris sur V-37
lui-même, qui porte `data-numerote="non"` (`V-37:1195`) et que le gabarit n'émet pas : la
conformité par zone d'ARB-012 le masquait.

### 4.1 Ce que le relevé retire de la liste, et pourquoi c'est aussi important

```
node verif/releve-etats.mjs --incidence
```

Les 41 maquettes placent **103 nœuds hors de `div.app`**. Une lecture de balisage en aurait fait
103 manques du gabarit, et vingt-neuf lots correctifs. La mesure dit autre chose : **neuf** de ces
nœuds portent une boîte de rendu ; **94 n'en portent aucune** — `<template>`, `<dialog>` fermé,
bloc masqué. Un nœud sans boîte de rendu ne peut ni déplacer un pixel, ni entrer dans l'instantané
ARIA.

| Nœud | Vues | Verdict |
|---|---|---|
| `template#tpl-palette` + `dialog#palette` | **30** maquettes, forme **strictement identique** | **aucune incidence** — vérifié par retrait : instantané ARIA identique, capture identique à l'octet |
| `dialog.dlg` fermé | V-13 (×3), V-15, V-17 (×2), V-18 (×2), V-22, V-27…V-32, V-35, V-40 (×10), V-41 | **aucune incidence** |
| `dialog.loupe` | V-03, V-14 | **aucune incidence** |
| `div.commandes`, `div.liens-auto` | V-17, V-18 | **aucune incidence** |
| `aside#tiroir.tiroir-form` | **V-27 à V-32** | **rendu** → A-4 |
| `aside#tiroir.tiroir` | V-15 | **rendu** → A-4 |
| `dialog#dlg-signet` **ouvert à l'état par défaut** | V-23 | **rendu** → A-4 |
| `div.planche-vue` | V-09 | **rendu**, mais V-09 n'a pas de coquille : c'est son corps |

**La palette est le cas d'école.** Trente maquettes portent le même hôte de palette au caractère
près ; le gabarit ne le rend pas ; V-37 est conforme 32/32 malgré cela. Le retrait mesuré sur V-25
et V-33 donne : instantané ARIA identique, capture identique. **C'est une divergence de balisage
mesurée nulle**, de la famille d'`ECART-013` É-3 et d'`ECART-016` É-4 : elle se déclare et ne se
rouvre pas. Le montage réel de la palette sur le champ de la barre reste ce que le DAG K-10 lui
assigne — **une dérogation admise, au lot qui portera V-09, et au temps 3.**

> **Ce que cette mesure n'emprunte pas, et il faut le dire (RA-01).** `--incidence` n'est **pas** le
> protocole du banc : il ne pose ni masque, ni pointeur au repos, ni le retrait-remise des blocs de
> `mesurer()`. Il lui arrive donc de rendre quelques pixels de plus d'un chargement à l'autre — 4
> pixels mesurés sur V-08, quand `pnpm verif:maquette V-08` sort à **0 sur 28 couples**. Le verdict
> qui fait foi n'est donc pas la colonne « pixels » mais la colonne **« rendu »**, qui est
> physique et déterministe : un nœud sans boîte de rendu ne peut pas déplacer un pixel. Les deux
> autres colonnes corroborent, elles ne tranchent pas.

---

## 5. Le relevé, vue par vue

### 5.1 Coquille, `<main>`, lien d'évitement, fil d'Ariane

```
node verif/releve-vues.mjs --restant --coquille
node verif/releve-vues.mjs V-xx
```

**Le fil d'Ariane est donné en expression, pas en littéraux.** Sept vues le calculent
(`["Accueil", courant.univers, courant.nom]`, `[…].concat(chemin)`) : n'en relever que les chaînes
rendrait « `["Accueil"]` » pour V-11 et ferait écrire un contrat faux.

| Vue | Coquille | Forme | `<main>` class / id | Lien d'évitement — cible / libellé | Fil d'Ariane rendu | Chemin courant du rail |
|---|---|---|---|---|---|---|
| **V-01** | — | — | `corps-public` / `(aucun)` | `#recherche` — « Aller à la recherche » | — | — |
| **V-02** | — | — | `corps-public` / `(aucun)` | `#resultats` — « Aller aux résultats » | — | — |
| **V-03** | — | — | `lecture-pub` / `(aucun)` | `#article` — « Aller au contenu » | — | — |
| **V-04** | — | — | `introuvable` / `(aucun)` | `#recherche` — « Aller à la recherche » | — | — |
| **V-05** | — | — | `auth` / `app` | — | — | — |
| **V-06** | — | — | `auth` / `app` | — | — | — |
| **V-07** | oui | complète | `tdb` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil"]` | — |
| **V-08** | oui | abrégée | `rech` / `contenu` | `#resultats` — « Aller aux résultats » | `["Accueil", "Recherche"]` | `[]` |
| **V-09** | — | — | — | `#etats` — « Aller aux états » | — | — |
| **V-10** | oui | abrégée | `univers` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", courant.nom]` | `[]` |
| **V-11** | oui | abrégée | `domaine` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", courant.univers, courant.nom]` | `[courant.nom]` |
| **V-12** | oui | abrégée | `liste-vue` / `contenu` | `#liste` — « Aller à la liste » | `["Accueil", courant.univers, courant.nom, "Notes"]` | `[courant.nom]` |
| **V-13** | oui | abrégée | `dossier-vue` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", "Production", DOMAINE].concat(chemin)` | `[DOMAINE].concat(chemin)` |
| **V-14** | oui | complète | `lecture` / `contenu` | `#article` — « Aller au contenu » | `["Accueil", "Production", "Infrastructure", "Exploitation", "Sauvegardes", "Restaurer une sauvegarde PostgreSQL depuis Barman"]` | `["Infrastructure", "Exploitation", "Sauvegardes"]` |
| **V-15** | oui | abrégée | `lecture` / `contenu` | `#article` — « Aller au contenu » | `["Accueil", "Production", "Infrastructure", "Exploitation", "Sauvegardes", NOTE.titre]` | `["Infrastructure", "Exploitation", "Sauvegardes"]` |
| **V-16** | oui | abrégée | `compare` / `contenu` | `#zone` — « Aller à la comparaison » | `["Accueil", "Production", "Infrastructure", "Exploitation", "Sauvegardes", NOTE.titre, "Comparaison"]` | `["Infrastructure", "Exploitation", "Sauvegardes"]` |
| **V-17** | oui | abrégée | `editeur` / `contenu` | `#redaction` — « Aller à la rédaction » | `["Accueil", "Production", window.MOI.domaine, "Nouvelle note"]` | `[window.MOI.domaine]` |
| **V-18** | oui | abrégée | `editeur` / `contenu` | `#redaction` — « Aller à la rédaction » | `["Accueil", "Production", "Infrastructure", "Exploitation", "Sauvegardes", NOTE.titre, "Opérationnel"]` | `["Infrastructure", "Exploitation", "Sauvegardes"]` |
| **V-19** | oui | abrégée | `carto` / `contenu` | `#liste-noeuds` — « Aller à la liste des nœuds » | `["Accueil", "Cartographie"]` | `[]` |
| **V-20** | oui | abrégée | `carto` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", "Cartographie", "Par type"]` | `[]` |
| **V-21** | oui | abrégée | `mentale` / `contenu` | `#liste` — « Aller à l'arborescence » | `["Accueil", "Carte mentale"]` | `[]` |
| **V-22** | oui | abrégée | `signets-vue` / `contenu` | `#liste` — « Aller à la liste » | `["Accueil", courant.univers, courant.nom, "Signets"]` | `[courant.nom]` |
| **V-23** | oui | abrégée | `(aucune)` / `contenu` | `#adresse` — « Aller au formulaire » | `["Accueil", "Production", "Infrastructure", "Signets", "Nouveau"]` | `["Infrastructure"]` |
| **V-24** | oui | abrégée | `import-vue` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", "Importer"]` | `[]` |
| **V-25** | oui | abrégée | `profil` / `contenu` | `#contenu` — « Aller au contenu » | `["Accueil", "Mon profil"]` | `[]` |
| **V-26** | oui | abrégée | `introuvable` / `contenu` | `#rech` — « Aller à la recherche » | `["Accueil", "Page introuvable"]` | `[]` |
| **V-27** | oui | complète | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Univers"]` | `[]` |
| **V-28** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Domaines"]` | `[]` |
| **V-29** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Types de fiches"]` | `[]` |
| **V-30** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Types de relations"]` | `[]` |
| **V-31** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Templates"]` | `[]` |
| **V-32** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Comptes"]` | `[]` |
| **V-33** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Configuration"]` | `[]` |
| **V-34** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Analytique"]` | `[]` |
| **V-35** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Imports"]` | `[]` |
| **V-36** | oui | abrégée | `travail` / `travail` | `#travail` — « Aller au contenu » | `["Accueil", "Console", "Exports"]` | `[]` |
| **V-41** | oui | complète | `corps-b` / `corps` | `#corps` — « Aller à la bibliothèque » | `["Accueil", "Bibliothèque de composants"]` | `[]` |

### 5.2 Routes servies, et entrée de rail

| Vue | Route(s) servie(s), telles que `verif/scenarios/` les porte | Entrée de rail qui y mène |
|---|---|---|
| **V-01** | `/` | — |
| **V-02** | `/recherche` | — |
| **V-03** | `/guides/{identifiant}` | — |
| **V-04** | *(aucune — rendue à toute adresse non résolue)* | — |
| **V-05** | `/connexion` | — |
| **V-06** | `/mot-de-passe-oublie`, `/mot-de-passe-oublie/{jeton}` | — |
| **V-07** | `/` | Accueil |
| **V-08** | `/recherche` | — |
| **V-09** | *(aucune — superposition)* | — |
| **V-10** | `/univers/{univers}` | — |
| **V-11** | `/univers/{univers}/{domaine}` | — |
| **V-12** | `/univers/{univers}/{domaine}/notes` | — |
| **V-13** | `/univers/{univers}/{domaine}/dossiers/{chemin…}` | — |
| **V-14** | `/notes/{identifiant}` | — |
| **V-15** | `/notes/{identifiant}` | — |
| **V-16** | `/notes/{identifiant}/comparaison` | — |
| **V-17** | `/notes/nouvelle`, `/notes/{identifiant}/modifier` | — |
| **V-18** | `/notes/{identifiant}/operationnel` | — |
| **V-19** | `/cartographie` | Outils › Cartographie |
| **V-20** | `/cartographie/par-type` | — |
| **V-21** | `/carte-mentale` | Outils › Carte mentale |
| **V-22** | `/univers/{univers}/{domaine}/signets` | Outils › Signets |
| **V-23** | `/univers/{univers}/{domaine}/signets/nouveau`, `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` | — |
| **V-24** | `/importer` | Outils › Import |
| **V-25** | `/mon-profil` | — |
| **V-26** | *(aucune — rendue à toute adresse non résolue)* | — |
| **V-27** | `/console/univers` | Gestion › Console |
| **V-28** | `/console/domaines` | — |
| **V-29** | `/console/types-de-fiches` | — |
| **V-30** | `/console/types-de-relations` | — |
| **V-31** | `/console/templates` | — |
| **V-32** | `/console/comptes` | — |
| **V-33** | `/console/configuration` | — |
| **V-34** | `/console/analytique` | — |
| **V-35** | `/console/imports`, `/console/imports/{lot}` | — |
| **V-36** | `/console/exports` | — |
| **V-41** | `/bibliotheque` | — |

### 5.3 États — le décompte de `verif/scenarios/` fait foi

```
node verif/releve-vues.mjs --restant --etats
```

**Nature** : *planche* = un état par position de contrôle de la planche de revue ; *zone* = un état
par zone présentée côte à côte dans la page ; *mixte* = les deux. **Doublons** : états que
l'extraction marque `identiqueA` — ils sont capturés, ils ne rendent pas un écran distinct.

| Vue | États | Nature | Fenêtres | Couples | Doublons | Zone : sélecteur | Déclencheurs |
|---|---|---|---|---|---|---|---|
| **V-01** | 7 | planche | 4 | 28 | 1 | — | — |
| **V-02** | 5 | planche | 4 | 20 | 1 | — | — |
| **V-03** | 4 | planche | 4 | 16 | 0 | — | — |
| **V-04** | 3 | planche | 1 | 3 | 0 | — | — |
| **V-05** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-06** | 7 | planche | 1 | 7 | 1 | — | — |
| **V-07** | 9 | planche | 1 | 9 | 1 | — | — |
| **V-08** | 7 | planche | 4 | 28 | 1 | — | — |
| **V-09** | 6 | zone | 4 | 24 | 0 | `#etats section.cas` | — |
| **V-10** | 7 | planche | 1 | 7 | 2 | — | — |
| **V-11** | 8 | planche | 1 | 8 | 2 | — | — |
| **V-12** | 7 | planche | 1 | 7 | 2 | — | — |
| **V-13** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-14** | 11 | planche | 4 | 44 | 2 | — | — |
| **V-15** | 7 | planche | 1 | 7 | 2 | — | — |
| **V-16** | 5 | planche | 1 | 5 | 0 | — | — |
| **V-17** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-18** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-19** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-20** | 5 | planche | 1 | 5 | 0 | — | — |
| **V-21** | 3 | planche | 1 | 3 | 0 | — | — |
| **V-22** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-23** | 7 | planche | 1 | 7 | 2 | — | — |
| **V-24** | 7 | planche | 1 | 7 | 1 | — | — |
| **V-25** | 7 | planche | 1 | 7 | 1 | — | — |
| **V-26** | 5 | planche | 1 | 5 | 1 | — | — |
| **V-27** | 6 | planche | 1 | 6 | 1 | — | — |
| **V-28** | 5 | planche | 1 | 5 | 1 | — | — |
| **V-29** | 5 | planche | 1 | 5 | 1 | — | — |
| **V-30** | 5 | planche | 1 | 5 | 1 | — | — |
| **V-31** | 5 | planche | 1 | 5 | 1 | — | — |
| **V-32** | 6 | planche | 1 | 6 | 0 | — | — |
| **V-33** | 4 | planche | 1 | 4 | 0 | — | — |
| **V-34** | 2 | planche | 1 | 2 | 0 | — | — |
| **V-35** | 4 | zone | 1 | 4 | 0 | `#depot`, `#scenarios`, `.tableau-gestion`, `#dlg-rapport` | 1 |
| **V-36** | 4 | planche | 1 | 4 | 1 | — | — |
| **V-41** | 11 | zone | 1 | 11 | 0 | `section.famille` | — |

### 5.4 Composants employés, croisés à l'inventaire fermé

```
node verif/releve-vues.mjs --restant --composants
node verif/inventaire-composants.mjs --liste=V-xx
```

**Ce document ne recopie pas les listes de classes**, et c'est la règle du §2.F : leur autorité est
la maquette gelée, dont la feuille portée est une copie à l'octet (P-6.3) ; les dupliquer ici
créerait une seconde source de vérité. Le décompte, lui, est ici, et la commande donne la liste.

| Vue | Classes employées | Transverses (§2.A–E) | Propres (§2.F) | Hors produit (§2.G) | Homonymes divergents (§2.H) | Emplois orphelins (§2.I) | Déclarations de style au gel (P-6.4) |
|---|---|---|---|---|---|---|---|
| **V-01** | 58 | 35 | 23 | 2 | 6 | 0 | 3 |
| **V-02** | 75 | 71 | 4 | 2 | 10 | 0 | 5 |
| **V-03** | 75 | 67 | 8 | 2 | 10 | 2 | 6 |
| **V-04** | 56 | 50 | 6 | 1 | 8 | 1 | 3 |
| **V-05** | 35 | 33 | 2 | 2 | 0 | 0 | 6 |
| **V-06** | 47 | 44 | 3 | 2 | 3 | 0 | 12 |
| **V-07** | 159 | 111 | 48 | 2 | 6 | 5 | 13 |
| **V-08** | 101 | 92 | 9 | 2 | 13 | 0 | 12 |
| **V-09** | 54 | 42 | 12 | 0 | 3 | 0 | 9 |
| **V-10** | 101 | 82 | 19 | 2 | 8 | 0 | 13 |
| **V-11** | 124 | 93 | 31 | 2 | 12 | 2 | 14 |
| **V-12** | 104 | 89 | 15 | 2 | 7 | 0 | 12 |
| **V-13** | 120 | 93 | 27 | 2 | 8 | 0 | 11 |
| **V-14** | 174 | 164 | 10 | 2 | 13 | 2 | 34 |
| **V-15** | 166 | 135 | 31 | 2 | 10 | 17 | 11 |
| **V-16** | 104 | 65 | 39 | 2 | 5 | 0 | 10 |
| **V-17** | 141 | 118 | 23 | 2 | 14 | 6 | 33 |
| **V-18** | 128 | 111 | 17 | 2 | 14 | 1 | 20 |
| **V-19** | 118 | 103 | 15 | 2 | 10 | 1 | 31 |
| **V-20** | 108 | 100 | 8 | 2 | 10 | 3 | 25 |
| **V-21** | 90 | 71 | 19 | 2 | 5 | 1 | 20 |
| **V-22** | 112 | 96 | 16 | 2 | 8 | 1 | 18 |
| **V-23** | 106 | 90 | 16 | 2 | 5 | 1 | 16 |
| **V-24** | 132 | 83 | 49 | 2 | 11 | 1 | 26 |
| **V-25** | 125 | 91 | 34 | 2 | 6 | 3 | 22 |
| **V-26** | 98 | 87 | 11 | 2 | 7 | 1 | 13 |
| **V-27** | 134 | 130 | 4 | 2 | 6 | 2 | 38 |
| **V-28** | 131 | 118 | 13 | 2 | 6 | 2 | 24 |
| **V-29** | 143 | 123 | 20 | 2 | 7 | 1 | 40 |
| **V-30** | 129 | 118 | 11 | 2 | 6 | 2 | 27 |
| **V-31** | 138 | 134 | 4 | 2 | 15 | 4 | 27 |
| **V-32** | 134 | 124 | 10 | 2 | 7 | 5 | 18 |
| **V-33** | 114 | 93 | 21 | 1 | 8 | 1 | 13 |
| **V-34** | 133 | 90 | 43 | 1 | 6 | 2 | 32 |
| **V-35** | 115 | 98 | 17 | 0 | 8 | 1 | 33 |
| **V-36** | 103 | 82 | 21 | 2 | 7 | 1 | 12 |
| **V-41** | 198 | 161 | 37 | 0 | 11 | 2 | 89 |

---

## 6. Ce qui exigera un traitement particulier

```
node verif/releve-etats.mjs --particuliers
```

| Vue | États à dialogue modal | Focalisation à l'ouverture | Superposition rendue hors `div.app` | `@keyframes` de la feuille | Notification visible | Rail : nœud déplié |
|---|---|---|---|---|---|---|
| **V-01** | — | — | — | — | — | — |
| **V-02** | — | — | — | — | — | — |
| **V-03** | — | — | — | tamponner remplir | — | — |
| **V-04** | — | — | — | — | — | — |
| **V-05** | — | — | — | — | — | — |
| **V-06** | — | `et-3` → `input#nouveau`<br>`et-4` → `a` | — | entre | `cpt-inconnu` | — |
| **V-07** | — | — | — | tourne-rail palette-entre clignote | — | — |
| **V-08** | — | — | — | palette-entre clignote | — | oui |
| **V-09** | — | — | `div.planche-vue` | palette-entre clignote | — | — |
| **V-10** | — | — | — | palette-entre clignote | — | oui |
| **V-11** | — | — | — | palette-entre clignote | — | oui |
| **V-12** | — | — | — | palette-entre clignote | — | oui |
| **V-13** | — | — | — | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-14** | — | — | — | tourne-rail tamponner remplir palette-entre clignote | — | oui |
| **V-15** | — | — | `aside#tiroir.tiroir` | tamponner remplir palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-16** | — | — | — | palette-entre clignote | — | oui |
| **V-17** | `cas-template` | `cas-template` → `button#tpl-vierge` | — | tamponner remplir dlg-entre dlg-entre | — | oui |
| **V-18** | — | — | — | tamponner remplir dlg-entre dlg-entre | — | oui |
| **V-19** | — | — | — | palette-entre clignote | — | oui |
| **V-20** | — | — | — | palette-entre clignote | — | oui |
| **V-21** | — | — | — | palette-entre clignote tourne | — | oui |
| **V-22** | — | — | — | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-23** | `env-dialogue` `mode-creation` `mode-edition` `recup-ok` `recup-lente` `recup-echec` | `env-dialogue` → `input#adresse`<br>`env-page` → `input#adresse`<br>`mode-creation` → `input#adresse`<br>`mode-edition` → `input#adresse`<br>`recup-ok` → `input#adresse`<br>`recup-lente` → `input#adresse`<br>`recup-echec` → `input#adresse` | `dialog#dlg-signet.dlg.dlg--large.si-dialogue` | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-24** | — | — | — | palette-entre clignote dlg-entre dlg-entre entre | — | oui |
| **V-25** | — | — | — | palette-entre clignote entre | — | oui |
| **V-26** | — | — | — | palette-entre clignote | — | oui |
| **V-27** | `sup-systeme` `sup-ok` | `form-creation` → `input#f-nom`<br>`form-edition` → `input#f-nom`<br>`sup-systeme` → `button`<br>`sup-ok` → `button` | `aside#tiroir.tiroir-form` | tourne-rail palette-entre clignote dlg-entre dlg-entre | — | — |
| **V-28** | `sup-vide` | `form-creation` → `input#f-nom`<br>`form-edition` → `input#f-nom`<br>`sup-vide` → `input#sup-saisie` | `aside#tiroir.tiroir-form` | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-29** | `sup-ok` | `form-creation` → `input#f-nom`<br>`form-edition` → `input#f-nom`<br>`sup-ok` → `button` | `aside#tiroir.tiroir-form` | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-30** | `sup-libre` | `form-creation` → `input#f-direct`<br>`form-edition` → `input#f-direct`<br>`sup-libre` → `button` | `aside#tiroir.tiroir-form` | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-31** | `sup-autre` | `form-creation` → `input#f-nom`<br>`form-edition` → `input#f-nom`<br>`sup-autre` → `button` | `aside#tiroir.tiroir-form` | palette-entre clignote tamponner remplir dlg-entre dlg-entre | — | oui |
| **V-32** | `mdp` `des` | `form-creation` → `input#f-ident`<br>`form-edition` → `input#f-nom`<br>`form-admin` → `input#f-nom`<br>`mdp` → `button#mdp-copier`<br>`des` → `button` | `aside#tiroir.tiroir-form` | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-33** | — | — | — | palette-entre clignote | — | oui |
| **V-34** | — | — | — | palette-entre clignote | — | oui |
| **V-35** | — | — | — | palette-entre clignote dlg-entre dlg-entre | — | oui |
| **V-36** | — | — | — | palette-entre clignote | — | oui |
| **V-41** | — | — | — | tourne-rail tamponner remplir battement dlg-entre dlg-entre palette-entre clignote | — | — |

### 6.1 Révélation de modalité — **la lacune d'instrument la plus coûteuse du périmètre**

**Quinze états, sur huit vues, ouvrent un `dialog` en modalité** — mesuré, pas déduit :

| Vue | États | Dialogue | Élément focalisé à l'ouverture |
|---|---|---|---|
| V-17 | `cas-template` | `dialog#dlg-template.dlg--large` | `button#tpl-vierge.btn--principal` |
| V-23 | `env-dialogue`, `mode-creation`, `mode-edition`, `recup-ok`, `recup-lente`, `recup-echec` | `dialog#dlg-signet.dlg--large.si-dialogue` | `input#adresse.saisie` |
| V-27 | `sup-systeme`, `sup-ok` | `dialog#dlg-supprimer.dlg--destructif` | `button.dlg__fermer` |
| V-28 | `sup-vide` | `dialog#dlg-supprimer.dlg--destructif` | `input#sup-saisie.saisie` |
| V-29 | `sup-ok` | `dialog#dlg-supprimer.dlg--destructif` | `button.dlg__fermer` |
| V-30 | `sup-libre` | `dialog#dlg-supprimer.dlg--destructif` | `button.dlg__fermer` |
| V-31 | `sup-autre` | `dialog#dlg-supprimer.dlg` | `button.dlg__fermer` |
| V-32 | `mdp`, `des` | `dialog#dlg-mdp.dlg`, `dialog#dlg-desactiver.dlg` | `button#mdp-copier.btn--principal`, `button.dlg__fermer` |

`verif/references/protocole-app.json`, bloc `revelations`, ne déclare **que V-40**. Le fichier est
en **écriture humaine seule**, et il dit lui-même : *« Une vue sans déclaration n'est jamais
révélée. C'est le défaut, et c'est la position la plus stricte. »* Sans les huit déclarations,
**T-107 et les lots de console buteront exactement là où T-102 a buté sur V-40** — `open` n'est pas
`showModal()`, la zone fait 1440×901 au lieu de 1440×900, le voile n'existe pas, ARB-017.

C'est un **manque d'instrument**, pas un défaut d'implémentation. Il relève de l'orchestrateur.

### 6.2 Focalisation à l'ouverture — la jurisprudence d'`ECART-020` s'applique à 31 états

Trente et un états, sur neuf vues, rendent un élément focalisé une fois la page stabilisée :
les quinze du §6.1, plus **seize hors dialogue** — les panneaux `tiroir-form` de la console
(V-27 à V-32, `form-creation` et `form-edition`, cible `input.saisie`), les étapes 3 et 4 de V-06,
et l'enveloppe `env-page` de V-23.

`ECART-020` É-1 a établi la forme : **`autofocus` sur l'élément que la maquette focalise**, qui est
la forme déclarative que l'algorithme du délégué de focalisation honore — sans script, donc sans
contradiction avec ARB-011. `ARB-018` a par ailleurs fermé la porte au « ce n'est que quelques
pixels » : trois des quatre écarts de V-40 venaient d'un anneau de focalisation, pour 4 380, 4 746
et 2 884 pixels.

**Le corollaire mesuré, à ne pas manquer** : la cible ne produit des pixels que si c'est une
`.saisie` ou un `.selecteur` — un `.btn--principal` focalisé en modalité pointeur ne déclenche pas
`:focus-visible`. Les cibles à risque du périmètre sont donc `input#adresse` (V-23, six états en dialogue plus
`env-page`), `input#sup-saisie` (V-28, `sup-vide`), et les **treize** `input.saisie` des panneaux
`tiroir-form` de console — V-27 à V-32, positions `form-creation` et `form-edition`, plus
`form-admin` pour V-32.

### 6.3 États de zone, déclencheurs, zones comparées

| Dispositif | Déclaré pour | Sur le périmètre |
|---|---|---|
| `protocole-app.json` → `etats_de_zone` | V-09, V-35, V-38, V-39, V-40, V-41 | **V-09 (6 états), V-35 (4), V-41 (11)** — les trois sont couvertes |
| `protocole-app.json` → `revelations` | V-40 | **aucune des huit vues du §6.1** — manque |
| `verif/references/zones.json` (ARB-012) | V-37 | **aucune** — les 37 sont comparées **page entière**, c'est-à-dire au régime le plus strict |
| `verif/masques.json` | V-32, `#mdp-valeur`, état `mdp` | couvert — c'est le seul `Math.random()` affiché du dépôt |
| États à déclencheur | V-40 (10) | **un seul sur le périmètre** : V-35 `rapport-de-lot` |

### 6.4 Animation

Aucune vue du périmètre n'a d'état dont le rendu dépende d'une animation en cours : le banc met
`animation-duration: 0s` des deux côtés et fige l'horloge. Ce qui reste est le **nom** de
l'animation, qui n'a pas d'effet de rendu. Les feuilles portent de 0 à 8 `@keyframes` par vue
(`--pieges`, colonne `keyfr`) ; elles sont dans le bloc porté à l'octet par P-6.3 et ne demandent
rien.

**Le seul comportement temporisé du périmètre est la notification**, et il ne concerne qu'**un
état** : V-06 `cpt-inconnu`. Les deux autres états à notification visible du dépôt — V-37
`chargement`, V-38 `empilement` — sont hors périmètre, et déjà livrés. ARB-011 tranche : le
squelette rend l'état, jamais la transition.

**Conséquence heureuse et mesurée** : les 26 vues abrégées ne déclarant **aucune** des classes
`.notif__*`, on aurait pu craindre qu'une notification typée y rende sans style. Aucun de leurs
états n'en affiche. Le manque existe, il ne mord pas.

---

## 7. Les pièges connus applicables, vue par vue

```
node verif/releve-vues.mjs --restant --pieges
node verif/releve-vues.mjs --restant --styles
```

### 7.1 Styles en ligne posés par script — ARB-016 et P-6.4

L'ensemble clos des déclarations de style du gel va de **3** (V-01, V-04) à **89** (V-41). Le piège
n'est pas leur nombre, c'est leur **origine** : `--styles` distingue le balisage, le `cssText`, la
propriété affectée une à une, et l'attribut.

**Trente-trois vues sur quarante et une portent au moins une valeur `‹calculé›`** — une déclaration
que le gel produit par une fabrique, et que l'analyseur réduit à un marqueur. `ECART-017` É-1 le
dit sans détour : **ce marqueur n'est pas un joker**. Un gel qui pose `width:‹calculé›` n'admet pas
`width:64%`. La sortie d'`ECART-020` É-3 est la seule qui tienne : **porter le calque exact de la
fabrique du gel**, et l'appeler avec les mêmes valeurs. Les vues les plus exposées du périmètre :
V-41 (4 calculées, 91 `cssText`), V-34 (4), V-07 (5), V-11 (5), V-10 (4).

### 7.2 Largeurs calculées par fabrique

`--pieges`, colonne `width=`. **Douze vues du périmètre** écrivent une largeur par
`element.style.width = …` : **V-41 (9), V-07 (3), V-27 (3), V-11 (2), V-14 (2), V-24 (2), V-34 (2),
V-17 (1), V-19 (1), V-25 (1), V-29 (1), V-36 (1)**. C'est le motif exact d'`ECART-020` É-3, qui a
coûté cinq déclarations hors du gel à V-39.

### 7.3 Classes homonymes à définitions divergentes — les 66 de §2.H

`--composants`, colonne *homonymes*. **Toutes les vues du périmètre sauf V-05 en emploient au moins
trois**, et jusqu'à **15** (V-31), **14** (V-17, V-18), **13** (V-08, V-14). §2.H l'écrit et
`ECART-019` É-5 le répète : *c'est l'endroit exact où un lot pressé casserait deux vues en croyant
en simplifier une.* **Interdiction de factoriser**, sans exception.

Les trois qui mordent le plus sur ce périmètre :

- **`.noeud`** — nœud d'arborescence dans 33 vues, **nœud de graphe en V-19 et V-20**, règles
  inconciliables. Les deux vues de cartographie sont dans le même lot proposé : le contrat doit
  écrire l'interdiction en toutes lettres.
- **`.vide`** — deux définitions, V-08 et V-39. V-08 est du périmètre. `.zone-etat` fait loi
  (§2.D-1) mais **V-08 se porte avec `.vide`**, sa définition à elle.
- **`.selecteur`** — dix déclarations, **cinq corps distincts**. Neuf des dix vues concernées sont du
  périmètre : V-17, V-18, V-23, V-24, V-29, V-31, V-32, V-33, V-36.

### 7.4 Emplois orphelins — les 92 de §2.I

`--composants`, colonne *orphelines*. **V-15 en porte 17**, V-17 six, V-32 cinq, V-31 quatre.
Porter fidèlement, c'est **poser la classe telle que le gel la pose**, sans inventer la règle qui
manque et sans la retirer parce qu'« elle ne sert à rien ».

### 7.5 `href="#"` du gel — ARB-013

`--pieges`, colonne `href#/tot`. Vingt-cinq vues du périmètre sont à **21 `#` sur 23**. ARB-013
retire les lignes `/url:` de la comparaison de structure : **le produit porte les adresses de
`docs/routes.md`, jamais les liens morts du gel.** L'autorité sur les adresses est `docs/routes.md`,
pas la maquette.

### 7.6 Blocs hors produit

`.planche` est présente dans **36 des 37 vues** du périmètre — V-09 est la seule sans. `section.regles`
n'existe que dans V-37, hors périmètre. **Piège nommé** : V-06 et V-25 portent une `ul.regles` —
la liste « Ce qui est demandé » des règles de mot de passe — et **celle-là est du produit**. Le
sélecteur du banc est `section.regles`, pas `.regles` ; un lot qui « nettoierait » par nom de classe
retirerait une exigence fonctionnelle.

Cinq classes seulement sont hors produit (§2.G) : `.planche`, `.planche__sep`, `.regles__liste`,
`.regles__sous`, `.regles__titre`. **Elles ne se portent jamais.**

### 7.7 `data-numerote` : un attribut posé là où la règle ne le lit pas

Cinq maquettes posent `data-numerote="non"` sur **`div.app#app`** — V-17 (`:1347`), V-18 (`:1468`),
V-31 (`:1488`), V-37 (`:1195`), V-41 (`:1695`) — tandis que la règle qui l'exploite vise
**`body`** : `body[data-numerote="non"] .prose h2::before { content: none }` (`V-17:836`). Une seule
maquette le pose au bon endroit, et c'est **V-03** (`:912`, `<body data-numerote="non">`). Le script
de ces vues lit lui aussi `document.body.getAttribute("data-numerote")` (`V-41:4712`).

**Dans ces cinq vues, l'attribut ne produit donc rien**, et le gel le veut ainsi. Une implémentation
qui « corrigerait » en le posant sur `<body>` **changerait le rendu** — c'est un comblement, et il
serait rouge au banc. Porter l'attribut où le gel le pose, et nulle part ailleurs.

### 7.8 Le contournement nommé et non emprunté

Déplacer un littéral de style dans un `.ts` importé le soustrait toujours à l'analyseur
(`ECART-015` É-3, `ECART-017` É-5). Deux exécutants l'ont nommé sans l'emprunter. **Il reste ouvert.**
Le nommer ici est la protection ; l'emprunter est un échec de lot, quelle que soit la qualité du
code.

---

## 8. Le regroupement de lots proposé

### 8.1 La méthode : le partage mesuré, pas la commodité

Le regroupement ci-dessous ne vient pas d'une lecture des noms de vues. Il vient d'un **relevé
d'affinité** : pour chaque paire de vues, le nombre de classes employées par **2 à 4 vues
seulement** — au-delà, une classe est un composant de fond (`.btn`, `.champ`) qui ne dit rien d'une
parenté. Les paires les plus fortes du dépôt :

| Classes partagées | Paire | Ce que le DAG en fait |
|---|---|---|
| 36 | V-14 / V-15 | même lot (T-105) ✔ |
| 35 | V-19 / V-20 | même lot (T-111) ✔ |
| 27 | V-17 / V-18 | même lot (T-110) ✔ |
| 25 | V-02 / V-04 | même lot (T-116) ✔ |
| 20 | V-04 / V-26 | même lot (T-116) ✔ |
| 19 | V-02 / V-08 | **séparées** — T-116 et T-106, mais séquencées (K-2) |
| 19 | **V-12 / V-22** | **séparées** — T-104 et T-109 |
| 19 | V-03 / V-14 | séparées, séquencées |
| 17 | V-05 / V-06 | même lot (T-117) ✔ |

Et par famille, le nombre de classes **n'appartenant qu'à cette famille** :

| Famille | Classes exclusives |
|---|---|
| Console — les dix vues | **38** |
| Graphes — V-19, V-20, V-21 | **33** |
| Recherche et listes filtrées — V-02, V-08, V-12, V-22 | **26** |
| Éditeurs — V-17, V-18 | **22** |
| Espace public et introuvable — V-01…V-04, V-26 | **18** |
| Authentification — V-05, V-06 | **15** |
| Import et export — V-24, V-35, V-36 | **3** |
| **Rangement — V-10, V-11, V-12, V-13** | **2** |

**Deux enseignements, et ils vont dans des sens opposés.** La famille *rangement* du DAG regroupe
quatre vues qui partagent **deux** classes : c'est un regroupement par préfixe de route, pas par
contenu — et V-12 partage **dix-neuf** classes avec V-22, qu'un autre lot porte. À l'inverse,
*import et export* est un faux voisinage (3 classes), et le DAG ne le fait d'ailleurs pas.

### 8.2 Les dix vues de console : ni un lot, ni dix — **trois**

```
node verif/inventaire-composants.mjs --classe=nav2
```

Le relevé donne la structure exacte de la famille :

| Classes | Portée | Ce que c'est |
|---|---|---|
| **13** | les **10** vues | `nav2*` (10 classes), `tete-section*`, `travail` — **le motif commun**, et `aside.nav2` est **identique à l'octet dans les dix maquettes** |
| **7** | V-27…V-32, V-35 | `.tableau-gestion`, `.tg*` — le tableau de gestion |
| **7** | V-27…V-32 | `.tiroir-form*` — le panneau latéral de formulaire |
| **3** | V-27, V-29, V-30, V-31, V-32 | `.refus*` — le refus de suppression |

S'y ajoutent, mesurés : `data-form="ferme"` sur les **six** mêmes vues et sur elles seules ;
`dialog#dlg-supprimer` sur ces six ; la focalisation à l'ouverture du panneau sur ces six ; et le
fil `["Accueil", "Console", "<section>"]` sur les dix.

**Un seul lot pour dix vues serait un lot de 46 états dans un seul contexte** — la topologie du DAG
§5.1 dit qu'un lot est un contexte. **Dix lots dupliqueraient dix fois l'extraction d'un motif
identique.** La coupure que le relevé dessine est en trois :

- **les six registres** (V-27 à V-32) — même panneau, même tableau, même dialogue de suppression,
  mêmes trois positions de formulaire, même focalisation ;
- **les quatre pages** (V-33, V-34, V-35, V-36) — ni panneau, ni `data-form`, ni suppression ;
  V-35 seule garde `.tg*`, et c'est une vue à **états de zone** ;
- et, à l'intérieur des six, **V-27 + V-28 d'abord**, parce que ce sont elles qui créent le motif
  commun, `.tg*`, `.tiroir-form*` et `.refus*`.

**L'écart au DAG est de deux vues** : V-32 quitte T-112 pour rejoindre les registres, V-33 quitte
T-112 pour rejoindre les pages. T-112 pairait deux vues qui ne partagent **rien** au-delà des 13
classes du motif commun.

### 8.3 Les seize lots proposés

| Lot | Vues | États | Couples |
|---|---|---|---|
| P-1  Bibliothèque de composants | V-41 | 11 | 11 |
| P-2  Console — motif commun, univers, domaines | V-27, V-28 | 11 | 11 |
| P-3  Console — les quatre registres | V-29, V-30, V-31, V-32 | 21 | 21 |
| P-4  Console — les quatre pages | V-33, V-34, V-35, V-36 | 14 | 14 |
| P-5  Lecture d’une note et historique | V-14, V-15 | 18 | 51 |
| P-6  Comparaison de versions | V-16 | 5 | 5 |
| P-7  Éditeurs de note | V-17, V-18 | 12 | 12 |
| P-8  Recherche et palette | V-08, V-09 | 13 | 52 |
| P-9  Rangement — univers, domaine, dossier | V-10, V-11, V-13 | 21 | 21 |
| P-10 Listes filtrées et signets | V-12, V-22, V-23 | 20 | 20 |
| P-11 Graphes — cartographie et carte mentale | V-19, V-20, V-21 | 14 | 14 |
| P-12 Import | V-24 | 7 | 7 |
| P-13 Espace public et adresses non résolues | V-01, V-02, V-03, V-04, V-26 | 24 | 72 |
| P-14 Authentification | V-05, V-06 | 13 | 13 |
| P-15 Accueil contributeur | V-07 | 9 | 9 |
| P-16 Profil | V-25 | 7 | 7 |
| **Total — 16 lots de vues** | **37 vues** | **220** | **340** |

Plus **un lot de gabarit**, en tête et seul :

| Lot | Objet | Vues | Critère de sortie |
|---|---|---|---|
| **P-0** | Les cinq amendements du §4, **en une fois**, puis regel | aucune | les 45 états des quatre vues livrées **identiques à l'octet** avant/après, plus le contrôle positif réversible d'`ECART-018` |

**Dix-sept lots au total, comme le DAG — mais pas les mêmes.**

### 8.4 L'écart au DAG, ligne à ligne

| Ce que le DAG prévoit | Ce que le relevé propose | Motif mesuré |
|---|---|---|
| *(rien)* | **P-0 — amendement unique du gabarit** | 5 amendements, 27 vues concernées, 2 formes de coquille |
| T-104 : V-10, V-11, V-12, V-13 | **P-9 : V-10, V-11, V-13** | la famille partage **2** classes ; V-12 en partage **19** avec V-22 |
| T-109 : V-22, V-23 | **P-10 : V-12, V-22, V-23** | 10 classes exclusives V-12/V-22 (`.barre-outils`, `.fac-menu*`, `.filtres-barre`, `.tete*`) |
| T-111 : V-19, V-20 · T-115 : V-21, V-24 | **P-11 : V-19, V-20, V-21** · **P-12 : V-24** | 5 classes exclusives aux trois graphes (`.scene`, `.voile*`, `.controles`, `.outils-graphe`) ; V-24 ne partage **rien** avec V-21 |
| T-108 : V-29, V-30, V-31 · T-112 : V-32, V-33 · T-113 : V-34, V-35, V-36 | **P-3 : V-29…V-32** · **P-4 : V-33…V-36** | `.tiroir-form*`, `.refus*`, `data-form` et le dialogue de suppression sont dans V-32 et **pas** dans V-33 |
| T-103, T-105, T-107, T-110, T-114, T-116, T-117, T-118, T-119 | **P-1, P-5, P-2, P-7, P-6, P-13, P-14, P-15, P-16** | inchangés — le relevé les confirme |
| T-106 : V-08, V-09 | **P-8 : V-08, V-09** | inchangé, mais **la dérogation K-10 est mesurée nulle** : l'hôte de palette n'a aucune incidence (§4.1) |

**Le DAG n'est pas à refaire.** Sur ses dix-sept lots, **dix sont confirmés tels quels** — T-103,
T-105, T-106, T-107, T-110, T-114, T-116, T-117, T-118, T-119 — et **sept sont redécoupés en six**
sur mesure d'affinité : T-104, T-108, T-109, T-111, T-112, T-113, T-115 deviennent P-3, P-4, P-9,
P-10, P-11, P-12. Ce qui manque au DAG n'est pas sa découpe : c'est **le lot de gabarit qu'il ne
pouvait pas prévoir**, parce que la seconde forme de coquille n'avait jamais été relevée.

### 8.5 L'ordre, et pourquoi il n'est pas celui du DAG

```
P-0  amendement du gabarit  (seul — 30 vues en dépendent)
 │
 └─ P-1  V-41                       (seul — rend l'inventaire observable, outille P-7 et P-8)
     │
     ├─ P-2  V-27 V-28 ──┬─> P-3  V-29 V-30 V-31 V-32
     │                   └─> P-4  V-33 V-34 V-35 V-36
     ├─ P-5  V-14 V-15 ──┬─> P-6  V-16
     │                   └─> P-7  V-17 V-18
     ├─ P-8  V-08 V-09 ────> P-13 V-01 V-02 V-03 V-04 V-26 ──┬─> P-14 V-05 V-06
     │                                                       └─> P-15 V-07
     ├─ P-9  V-10 V-11 V-13 ─> P-10 V-12 V-22 V-23
     ├─ P-11 V-19 V-20 V-21
     ├─ P-12 V-24
     └─ P-16 V-25
```

Cinq lots sont parallélisables après P-1 — P-2, P-5, P-8, P-9, P-11 —, ce qui dépasse le
« deux à quatre lots simultanés » du `PLAN §6.4`. **Le plafond du plan s'applique, pas celui du
graphe** : quatre au plus, et **jamais sans worktrees** (M-9).

**P-0 est seul, et il l'est pour la raison exacte qui a fait de T-101 un lot solitaire** : trente
vues en dépendent. Le paralléliser recréerait le conflit que `PLAN §6.4` proscrit.

**P-1 (V-41) reste tôt.** Le motif du DAG §2.2 tient : c'est là que la divergence du système visuel
devient immédiatement visible (R-06). Et deux sous-contrôles de `verif:jetons` — **P-7 et P-8** —
ne deviennent outillables qu'une fois la bibliothèque rendue sur une page réelle (DAG §7).

---

## 9. Les collisions de ressource entre lots proposés

| # | Ressource | Lots concernés | Traitement |
|---|---|---|---|
| **R-1** | **`src/lib/coquille/*` — le gabarit** | **P-0 seul** | Ressource exclusive de P-0, **regelée** à sa clôture. Un seul lot est encore autorisé à y revenir : **P-8**, pour monter la palette V-09 sur le champ de la barre (K-10) — et le relevé montre que cette dérogation n'a **aucune incidence de rendu** (§4.1), donc qu'elle peut attendre le temps 3 |
| **R-2** | **Le motif commun de console** — `nav2*`, `tete-section*`, `travail`, `.tg*`, `.tiroir-form*`, `.refus*` | **P-2** l'écrit ; **P-3** et **P-4** le consomment | 13 classes pour les dix vues, 7+7+3 pour les six registres. `aside.nav2` est identique à l'octet dans les dix maquettes : **une seule écriture** |
| **R-3** | **Le gabarit de route `/univers/{u}/{d}`** | **P-9** l'écrit ; **P-10** en dépend | K-12 du DAG, inchangé — mais le contenu se déplace : V-12 passe de P-9 à P-10 |
| **R-4** | **Le gabarit de route `/notes/{identifiant}`** | **P-5** l'écrit ; **P-6** et **P-7** en dépendent | K-13 du DAG, inchangé |
| **R-5** | **La route `/`** | **P-13** écrit la branche anonyme ; **P-15** ajoute la branche connectée | K-1 du DAG, inchangé. Séquencées, jamais parallèles |
| **R-6** | **La route `/recherche`** | **P-8** écrit la branche connectée ; **P-13** ajoute l'anonyme | K-2 du DAG, inchangé |
| **R-7** | **La résolution unique des adresses non résolues** | **P-13** seul — V-04 et V-26 | K-3, ADR-007 : un seul chemin de code. Deux lots parallèles y écrivant chacun leur branche est la manière la plus sûre de faire apparaître la branche « interdit » que l'ADR interdit |
| **R-8** | **`verif/references/protocole-app.json`** — révélations et états de zone | **aucun lot de vue** | Écriture humaine seule. **Huit vues y manquent** (§6.1) : c'est à l'orchestrateur d'écrire, avant P-2, P-3, P-7 et P-10 |
| **R-9** | **`src/lib/dates.ts`** — le calcul de fraîcheur | tous, en lecture | P-01 : **une seule définition**. `ECART-015` É-6 a relevé un second calcul dans V-40 ; aucun lot ne doit en écrire un troisième |
| **R-10** | **`seeds/corpus.ts`** | tous, en lecture seule | Aucune collision : le relevé confirme que les 29 globales des maquettes y ont toutes leur `export` |
| **R-11** | **Les 66 homonymes de §2.H** | **P-11** (`.noeud`, `.arete`, `.scene`, `.detail-col`, `.zone-graphe`, `.voile__boite`), **P-10** (`.facettes`, `.reglages`, `.val`, `.tri`, `.actifs`), **P-7** (`.selecteur`, `.oz`, `.ob`, `.outils-red`, `.colonne-redaction`), **P-2/P-3/P-4** (`.tiroir-form`, `.travail`, `.selecteur`), **P-12** (`.selecteur`, `.bilan`, `.depot`, `.barre-progres`) | **Ce ne sont pas des ressources partagées, et c'est le piège** : chaque vue porte sa définition, par P-6.3. La collision est de *nom*, pas d'objet. Interdiction de factoriser, à écrire dans les contrats de P-7, P-10, P-11, P-3 et P-4 |

**Aucun des seize lots de vue n'écrit une ressource qu'un autre écrit dans la même vague.** C'est la
propriété que R-1 à R-11 existent pour garantir, et elle se relit ligne à ligne.

---

## 10. Ce qui manque encore à l'instrument

Trois lots se sont arrêtés faute d'outil — `ECART-011` É-1 (le régime `app` inexistant),
`ECART-012` point 6 (les états de zone sans protocole), `ECART-015` É-4 (la modalité). Chaque arrêt
a coûté un lot. Voici ce qui manque **maintenant**, cherché avant que cela ne coûte.

| # | Manque | Ce qu'il bloquerait | À la charge de |
|---|---|---|---|
| **M-1** | **`protocole-app.json` → `revelations` ne déclare que V-40.** Huit vues du périmètre ouvrent un dialogue modal dans un état déclaré : V-17, V-23, V-27, V-28, V-29, V-30, V-31, V-32 — 15 états | **P-2, P-3, P-7 et P-10 buteront** exactement où T-102 a buté : `open` n'est pas `showModal()`, 1440×901 contre 1440×900, pas de voile. Fichier en écriture humaine seule : **un lot de vue ne peut pas se débloquer lui-même** | orchestrateur, **avant P-2** |
| **M-2** | **`pnpm verify:lot T-xxx` n'existe pas.** C'est un `jalon.mjs` qui sort en 1 en annonçant « non assigné » | `CLAUDE.md` §7 en fait un critère de clôture de toute tâche. Aucun lot ne peut le rendre vert. T-101 avait contourné en citant les commandes une à une ; les seize contrats doivent faire de même, ou la commande doit être écrite | orchestrateur |
| **M-3** | **Quatorze des dix-huit batteries sont des jalons** qui sortent en 1 en annonçant leur lot : les batteries 4 à 10 et 12 à 18. Quatre seulement sont réelles — 1 `check`, 2 `verif:jetons`, 3 `test:unit`, 11 `verif:maquette` —, plus trois contrôles d'intégrité du harnais : `verif:gel`, `verif:inventaire`, `verif:demo:hors-production` | Aucun lot ne peut déclarer tenues `RG-M18-03` (batterie 9), l'accessibilité (10), les droits (7), le corpus vide (8). **À écrire comme interdiction de conclure dans chaque contrat**, pas à outiller maintenant | connu, tracé au DAG §8 |
| **M-4** | **`verif:jetons` : P-2, P-4.3, P-7, P-8 restent non outillés.** Leur prémisse est levée depuis `ECART-019` — l'inventaire fermé existe | DAG §7 en fait une **condition de clôture de la phase 1**. P-7 et P-8 deviennent outillables **dès P-1** (V-41 rend l'inventaire complet sur une page réelle). Les repousser au-delà ferait porter le défaut par toutes les familles | orchestrateur, **P-2 et P-4.3 dès maintenant** |
| **M-5** | **Rien ne mesure l'indiscernabilité temporelle** (ARB-005, `ECART-009` É-5) | **P-13 et P-14** ne peuvent pas déclarer `RG-ACC-04` tenue. Déjà tracé, assigné à T-011 | connu |
| **M-6** | **Le mode démo ne connaît aucune vue** : `protocole-app.json` → `vues` est vide, et le banc refuse en 501 | Comportement voulu (« un refus explicite vaut mieux qu'un vert muet »), mais **chaque lot devra vérifier que sa vue est servie** avant de conclure. À écrire au contrat | chaque lot |
| **M-7** | **Aucun instrument ne dit ce qu'un état met à l'écran.** Il n'en existait pas ; les trois découvertes coûteuses de V-40 se sont faites au pixel | **Comblé par ce lot** — `verif/releve-etats.mjs`. À rejouer après tout regel | ce lot |
| **M-8** | **Aucun instrument ne confronte le gabarit aux maquettes.** L'interface du gabarit « se découvre au contact des vues » (ARB-019) parce que rien ne la confrontait aux 41 fichiers | **Comblé par ce lot** — `verif/releve-vues.mjs --gabarit`. À rejouer après P-0, où il doit rendre **zéro amendement** | ce lot |
| **M-9** | **Les worktrees ne sont toujours pas employés.** Cinquième symptôme relevé à `ECART-021` É-6 ; `ECART-017` É-8 les déclarait obligatoires | Les vagues proposées comptent jusqu'à cinq lots parallélisables. Sans isolement, `verif:jetons` et `pnpm check` d'un lot désignent les fichiers d'un autre (`ECART-014` É-2), et un commit englobe trois lots (`ECART-017` É-8). **C'est la dette la plus ancienne du dossier** | orchestrateur |
| **M-10** | **Aucun crochet ne refuse la clôture d'une session sans mise à jour du journal de vague.** Relevé à `ECART-021` É-2 : « la capitalisation différée n'a lieu que si quelqu'un la relève » | Seize lots à venir, seize occasions de perdre la trace | orchestrateur |

---

## 11. Écarts à numéroter

Ce lot n'ouvre aucun fichier dans `docs/ecarts/` — son contrat le lui interdit. Les points
ci-dessous sont **remontés pour numérotation**, dans l'ordre de gravité.

### É-1 — **Deux formes de coquille au gel, et le gabarit n'en connaît qu'une.** Gravité : haute.

Vingt-six maquettes sur trente-quatre portent une coquille que `src/lib/coquille/` ne sait pas
rendre — barre sans les deux menus déroulants, rail sans pictogrammes, arborescence écrite au
balisage. Six classes que le gabarit pose (`.menu-barre*`) **ne sont déclarées par aucune de leurs
deux feuilles** : la liste de menu s'y afficherait dépliée. Aucune des quatre vues livrées ne
pouvait le révéler : elles sont toutes du côté complet.

**Ce n'est pas une convergence** au sens d'ARB-020 : rendre deux formes est un **ajout d'interface**,
et ARB-020 réserve nommément l'arbitrage numéroté à « tout ce qui ne se lit pas dans le gel ».
Demande : un arbitrage sur A-1, A-2, A-4, A-5 du §4, et un lot P-0.

### É-2 — **L'arborescence du rail de 26 vues n'est pas dérivable de `seeds/corpus.ts`.** Gravité : haute.

Les 26 maquettes abrégées rendent 15 nœuds, dont `Exploitation › Ordonnancement` et
`Réseau › Adressage`, que le corpus ne porte pas comme dossiers de notes ; et elles ignorent cinq
dossiers qu'il porte. `sectionsDuRail(UNIVERS, DOMAINES, corpusPourVue(v))` rend **19 nœuds pour les
41 vues**. Les deux arbres ne sont pas emboîtés.

Le DAG §6 pose le test qui tranche : *« soit un état que la maquette ne déclare pas — donc hors
périmètre —, soit une donnée manquante du corpus — donc un écart à déclarer. »* C'est le second cas,
et il ne se comble pas en ajoutant les dossiers au corpus : cela déplacerait le rail des huit vues
de forme complète, dont les quatre livrées. Demande : arbitrage — le rail de la forme abrégée est-il
une **donnée de vue** (le gabarit reçoit son arborescence) ou le corpus est-il **variantisé** ?

### É-3 — **Quinze états ouvrent un dialogue modal, et aucun n'est déclaré révélable.** Gravité : haute.

`protocole-app.json` → `revelations` ne nomme que V-40. Huit vues du périmètre — V-17, V-23, V-27 à
V-32 — buteront sur ARB-017 sans y pouvoir rien : le fichier est en écriture humaine seule.
Demande : les huit déclarations, avant P-2.

### É-4 — **Le libellé du chevron d'arborescence est faux pour 27 vues.** Gravité : moyenne.

Le gel écrit « Replier {nom} » quand le nœud est ouvert (`V-37:3203`) ; `Rail.svelte` écrit
« Déplier » sans condition. C'est un nom accessible, donc le niveau 1 en échec sec. V-37 y échappe
parce qu'aucun de ses huit états ne déplie un nœud. **C'est une convergence** (ARB-020) : la ligne du
gel est citée, rien n'est ajouté. Demande : la corriger dans P-0, avec sa preuve de non-régression.

### É-5 — **Le gabarit écrit `flex: 0 0 auto` là où le gel écrit `flex: none`.** Gravité : basse.

`V-37:3212-3213` pose `vide.style.width = "20px"; vide.style.flex = "none"`. Le gabarit écrit
`style="width: 20px; flex: 0 0 auto;"`. Les deux calculent la même chose, donc aucun effet de rendu.
La forme abrégée, elle, n'écrit **que** `width:20px`. Divergence de gel non détectée parce que
P-6.4 / ARB-016 ne couvre que `src/vues/V-xx.svelte`, jamais `src/lib/` — c'est exactement la
**portée** sur laquelle `ECART-021` s'est arrêté. Convergence, à traiter dans P-0.

### É-6 — **`pnpm verify:lot T-xxx` n'existe pas, et `CLAUDE.md` §7 en fait un critère.** Gravité : moyenne.

Un critère de clôture qu'aucune commande ne peut rendre vert est un critère qui sera silencieusement
sauté seize fois. Demande : l'écrire, ou retirer la ligne de `CLAUDE.md` §7.

### É-7 — **La famille « rangement » du DAG regroupe quatre vues qui partagent deux classes.** Gravité : basse.

T-104 réunit V-10, V-11, V-12 et V-13 ; le relevé d'affinité leur trouve **2** classes exclusives,
quand V-12 en partage **19** avec V-22, qu'un autre lot porte. Le regroupement est par préfixe de
route, non par contenu. Sans conséquence sur la conformité — chaque vue est portée contre sa propre
maquette — mais avec une conséquence sur le coût : deux extractions au lieu d'une.

### É-8 — **Décomptes de ce document contre `docs/routes.md`.** Gravité : basse, déjà tracée.

`ECART-009` c) est confirmé et complété : les scénarios font foi, et l'écart porte sur **V-03**
(routes.md 5, scénarios 4), **V-07** (10 / 9), **V-08** (8 / 7), **V-39** (20 / 21). Le total de
`docs/routes.md` §9 — 268 états — se lit **265** aux scénarios. L'alignement est différé à la clôture
de T-007 ; il ne l'est toujours pas.

---

## 12. La question de clôture

**Le dépôt suffirait-il à réexpliquer ce lot sans le rouvrir ?**

Oui, à une condition qui est aussi son mode d'emploi : **les chiffres de ce document ne sont pas à
croire, ils sont à rejouer.** Chaque table porte sa commande ; les deux instruments sont dans
`verif/` ; aucun nombre n'a été saisi à la main. Si une maquette change — elle ne changera pas, elle
est gelée —, ou si le gabarit est amendé, `node verif/releve-vues.mjs --restant --gabarit` doit
rendre **zéro amendement**, et c'est le critère de sortie de P-0.

Ce que ce document ne remplace pas : la **lecture de la maquette** par le lot qui la porte. Le
temps 1 du protocole UI reste dû, vue par vue. Ce document dit ce qu'il faut avoir vu **avant**
d'ouvrir le fichier ; il ne dit pas ce que le fichier contient.

---

*Fin de `docs/releve-vues.md` — lot T-100. Instruments : `verif/releve-vues.mjs`,
`verif/releve-etats.mjs`.*
