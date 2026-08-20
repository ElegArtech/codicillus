# Codicillus — contrat permanent de l'agent

Ce fichier est lu à chaque session. Il ne contient que ce qui contraint toute tâche, sans exception.
Sept sections, et rien d'autre : un `CLAUDE.md` qui enfle cesse d'être lu (`cadrage/PLAN-DE-REALISATION.md` §3.2).

---

## État du dépôt

Le projet est en **vague 0** : harnais, gel, semence, inventaire des routes. Aucun code applicatif n'est encore livré.

| Où | Quoi | Régime |
|---|---|---|
| `cadrage/` | Les quatre livrables de cadrage — cahier des charges, brief des vues, pile technique, plan de réalisation | **Lecture seule** |
| `mockups/` | Les 41 vues gelées, `socle.css`, `GEL.md` (empreintes SHA-256, gel du 18 août 2026) | **Lecture seule** |
| `règles/` | `workflow_agentic.md` — la méthode dont ce projet est le pilote | **Lecture seule** |
| `docs/` | ADR, routes, contrats de tâche, journal de vague, `DESIGN.md` | Écriture agentique |
| `verif/`, `seeds/`, `src/` | Banc de comparaison, jeu de semence, application | Écriture agentique — sauf `verif/references/` |

**Le refus d'écriture est bloquant, pas déclaratif — et il ne l'était pas au départ.** Les règles de `.claude/settings.json` refusent `Edit` et `Write` sur `cadrage/**`, `règles/**`, `mockups/**` et `verif/references/**`. Elles ne suffisent pas : **elles filtrent par outil, et Bash passe à travers** — prouvé par sonde le 18/08/2026 (`docs/ecarts/ECART-004.md`, gravité haute). La protection réelle est portée par le système de fichiers : le bit d'écriture est retiré des trois dossiers. Toute écriture y échoue, y compris par `sed`, `tee` ou redirection. C'est le comportement recherché, jamais un obstacle à contourner. `pnpm verif:gel` recalcule par ailleurs les 43 empreintes du gel et sort en 1 à la première divergence : le verrou empêche, le contrôle détecte.

### Deux documents font autorité au-dessus du cadrage

Ils sont à lire **avant** toute tâche, et ils priment sur `cadrage/` pour les seuls points qu'ils énumèrent :

| Document | Ce qu'il porte |
|---|---|
| `docs/arbitrages.md` | Les décisions du commanditaire, numérotées `ARB-xxx`. Seule autorité au-dessus de l'ordre de préséance quand les sources se contredisent ou se taisent. Ce qu'un arbitrage ferme n'a plus à être demandé. |
| `docs/errata-cadrage.md` | Les affirmations du cadrage révélées fausses, numérotées `E-xx`, chacune rattachée à l'arbitrage qui la valide. |
| `docs/dossier-regel.md` | **Ce qui attend le geste du commanditaire** : les défauts que les maquettes portent elles-mêmes, consolidés et chiffrés. Aucun lot ne peut les fermer — combler est interdit, diverger est rouge. Tenu à jour à chaque lot. |
| `docs/orchestration.md` | **Comment un lot se commande, se surveille et se rapatrie.** Le gabarit de contrat, la procédure d'une vague, la politique des seuils, et la liste datée de ce que le dispositif n'a pas encore. Rien n'y est théorique : chaque règle vient d'une faute chiffrée. |
| `docs/reprise.md` | **Où reprendre.** L'état vérifiable, les prochains lots dans l'ordre de leurs dépendances, et ce qui reste ouvert sans que personne l'ait repris. À lire en premier après une interruption. |

**Pourquoi un errata plutôt qu'une correction des sources.** Éditer `cadrage/` pour y corriger un fait détruirait la propriété qui rend le dispositif opposable : l'immutabilité et la diffabilité du gel. Les sources restent ce qu'elles étaient ; l'errata dit ce qui, depuis, s'est révélé inexact. Aucun agent d'exécution n'y écrit.

Onze entrées à ce jour. Les trois qui changent le plus de choses :

- **E-01 — `mockups/socle.css` n'est pas la source du système visuel.** C'est le plus ancien de six états du socle en ligne, employé par 4 vues sur 41 ; il lui manque les champs de saisie, que 21 vues emploient. La source est le socle de `mockups/V-07-accueil-contributeur.html` (466 lignes), extrait mécaniquement.
- **E-04 — cinq variantes de corpus strictement emboîtées**, non 36 corpus à réconcilier (32, 27, 19, 14 notes, et vide). Aucun identifiant n'existe hors du jeu de 32 de `V-14`.
- **E-05 — `RG-M02-05` à `RG-M02-08` n'existaient pas** : les exigences étaient réelles mais restées des puces non numérotées de M02.6. La numérotation est créée à l'errata.

Également : `guide/` s'appelle `règles/` (E-07), le socle compte 69 jetons et non 61 (E-02), et il y a 37 planches de revue sur 41 vues et non 36 sur 40 (E-03).

---

## 1. Ce qu'est le produit

*Repris de `cadrage/BRIEF-VUES.md` §1.*

Une base de connaissances documentaire interne, auto-hébergée, pour une direction technique d'environ 50 à 200 personnes.

Elle remplace un patrimoine éparpillé — procédures en traitement de texte, cartographies en tableur, PDF, fichiers texte, liens web — par un point d'entrée unique, cherchable et fiable.

Sa singularité : **chaque document affiche s'il est encore digne de confiance**. Un signal de fraîcheur, calculé sur la date de dernière vérification, est visible partout où un document apparaît. N'importe quel contributeur habilité peut le remettre au vert en un clic, sans formulaire. C'est le mécanisme central du produit.

Deuxième singularité : **une même note peut porter deux registres de lecture** — une version *Référence* dense et exhaustive, et une version *Opérationnelle* pas-à-pas orientée action. Pas un résumé : le même fond, réorganisé pour agir.

Troisième singularité : **le corpus est aussi un graphe**. Les notes peuvent être typées (Application, Serveur, Équipement réseau, Contact) et reliées entre elles par des relations qualifiées (héberge, dépend de, administre). On y lit les dépendances techniques et les points de défaillance unique.

---

## 2. L'ordre de préséance et les trois règles

*Repris de `cadrage/STACK-TECHNIQUE.md` avertissement de périmètre et `cadrage/PLAN-DE-REALISATION.md` avertissement de périmètre.*

```
Maquettes  >  Cahier des charges  >  Brief des vues  >  Pile technique  >  Plan de réalisation
```

*Le web design décide, la pile s'adapte.* Un conflit entre deux documents se tranche par ce classement, jamais par appréciation.

**Règle de non-comblement.** Un agent qui rencontre un vide — un comportement non spécifié, un état non maquetté, une règle ambiguë — ne le comble pas. Il s'arrête et remonte. Toute décision fonctionnelle ou graphique prise pendant l'exécution est un **défaut de contrat de tâche**, pas une initiative. Quand un agent prend des libertés, ce n'est pas une faute de l'agent, c'est un vide de contrainte (`règles/workflow_agentic.md` §1).

**Règle de subordination.** Aucune difficulté de réalisation ne justifie une entorse au fonctionnel ou aux maquettes. Une difficulté remonte comme demande d'arbitrage, jamais comme adaptation silencieuse.

**Règle d'immutabilité des sources.** `cadrage/`, `mockups/` et `règles/` ne sont **jamais** modifiés par un agent d'exécution. Ils changent par arbitrage humain explicite, tracé.

**Le guichet de la déviation légitime** est le protocole d'écart (`règles/workflow_agentic.md` §4.15) : l'agent s'arrête, écrit une entrée ÉCART rattachée au contrat, et attend l'arbitrage. La déviation ayant un chemin officiel, **tout écart non déclaré vaut échec de la tâche**, quelle que soit la qualité du code livré.

---

## 3. Le vocabulaire contractuel

*Repris de `cadrage/BRIEF-VUES.md` §2.3. Opposable par P-07 et par la batterie 17.*

| Terme | Ce que c'est |
|---|---|
| **Note** | L'unité de connaissance. Jamais « document », « page » ou « article » |
| **Fiche** | Une note à laquelle un type structuré a été attribué (Application, Serveur…). Ce n'est pas un objet séparé |
| **Registre** | L'un des deux modes de lecture d'une note : *Référence* ou *Opérationnel* |
| **Univers** | Le niveau de rangement le plus haut |
| **Domaine** | Un espace de connaissance autonome, appartenant à un univers |
| **Dossier** | Rangement arborescent dans un domaine, jusqu'à 10 niveaux |
| **Étiquette** | Mot-clé libre. Jamais « tag » |
| **Relation** | Lien qualifié et dirigé entre deux notes |
| **Signet** | Lien web curaté |
| **Fraîcheur** | Le signal de fiabilité temporelle |
| **Vérifier** | Attester qu'une note est toujours d'actualité |
| **Console** | L'espace d'administration |

**Aucun synonyme ne circule** : ni dans l'interface, ni dans le code, ni dans les noms de tables, de colonnes, de routes, de types ou de fichiers. Hiérarchie de rangement : `Univers → Domaine → Dossier (jusqu'à 10 niveaux) → Note`. Seul le concept « fiche » est renommable, et globalement, par la configuration (CDC M14.7).

---

## 4. Les commandes, et ce que chacune prouve

*Catalogue des 18 batteries : `cadrage/PLAN-DE-REALISATION.md` §5 et annexe G.*

| Commande | Ce qu'elle prouve |
|---|---|
| `pnpm check` | Le code compile et respecte les conventions — typage, style, formatage |
| `pnpm verif:jetons` | Aucune valeur de couleur, d'espacement, de rayon ou de police en dur hors `socle.css`, et la copie du socle est identique au gel (RG-DA-01, ADR-002) |
| `pnpm test:unit` | Les comportements locaux, dont la résolution des droits et le calcul de fraîcheur (RG-DRO-01…05, RG-M06-01…04) |
| `pnpm test:aller-retour` | Pour **tout** document du corpus, sérialiser puis désérialiser redonne le document d'origine — le « critère de réussite principal » de RG-M13-01 |
| `pnpm verif:fraicheur` | Il n'existe **qu'une** implémentation du calcul de fraîcheur, et tous les affichages l'appellent (P-01) |
| `pnpm test:etancheite` | Matrice **toutes routes × tous personas** : aucun contenu interne atteignable en anonyme, par aucun chemin, y compris par adresse construite ; refus et inexistence indiscernables (RG-ACC-01, RG-ACC-04) |
| `pnpm test:droits` | Aucune action non autorisée n'est présente dans le DOM — ni grisée, ni masquée (P-09) |
| `pnpm test:vide` | Sur une base vierge, aucun indicateur n'affiche de valeur ; tous affichent un état neutre explicite (P-02) |
| `pnpm test:etats` | Chaque zone rend ses quatre états — chargement, vide, erreur, sans droit — et une zone en erreur ne fait pas tomber la page (RG-M18-03/04) |
| `pnpm test:a11y` | axe-core sans violation, parcours complet au clavier, focus visible, pièges de focus rendus, alternatives textuelles (P-06, RG-M18-07…11) |
| `pnpm verif:maquette V-xx` | La conformité de rendu à la maquette gelée, par le protocole en trois niveaux du plan §4 |
| `pnpm test:parcours` | PU-01 à PU-06 joués de bout en bout, avec leurs critères de réussite chiffrés |
| `pnpm mesure:budgets` | Les sept budgets de performance, mesurés sur volumétrie haute synthétique |
| `pnpm test:degradation` | Les deux conteneurs optionnels arrêtés, le produit reste pleinement utilisable et se signale dégradé (P-10) |
| `pnpm test:impression` | La lecture d'une note s'imprime sans navigation ni panneaux, avec métadonnées de confiance et adresses des liens en note (RG-M18-17) |
| `pnpm verif:menus` | Aucune entrée de navigation inerte ; un module désactivé disparaît de la navigation et des tableaux de bord (P-03, P-04) |
| `pnpm verif:vocabulaire` | Aucun synonyme des douze termes contractuels dans l'interface (P-07) |
| `pnpm exploitation:restauration` | Restauration complète depuis une sauvegarde, réindexation incluse, corpus identique après (RG-NF-09) |
| `pnpm verif:gel` | Les empreintes de `mockups/GEL.md` correspondent aux fichiers : aucun regel non arbitré |
| `pnpm verify:lot T-xxx` | Le sous-ensemble de batteries cité par le contrat de tâche — budget < 3 min |
| `pnpm verify` | Les dix-huit batteries enchaînées — budget < 20 min |

### Le banc de comparaison — les commandes qui l'entourent

`verif:maquette` est la commande de conformité. Six autres l'accompagnent, et il faut savoir
laquelle prouve quoi : elles ne prouvent **pas** la même chose.

| Commande | Ce qu'elle prouve |
|---|---|
| `pnpm verif:maquette` | **Étalonnage à blanc** — la maquette contre elle-même, 41 vues, 409 couples, tolérance zéro. Prouve que le banc est déterministe, **rien sur l'application** |
| `pnpm verif:maquette V-xx --contre=app` | **La conformité réelle** d'une vue implémentée à sa maquette gelée. C'est le critère de sortie de tout lot de vue |
| `pnpm verif:maquette:app:etalon` | Le chemin `app` sur un candidat connu identique — serveurs, protocoles d'état, conditions de capture. **Ne passe pas par `render()`** |
| `pnpm verif:maquette:app:composant` | Le même chemin **en traversant `render()`**, `ssrLoadModule` et le compilateur Svelte. C'est celui qui manquait quand tout composant rendait 500 sans que rien ne le voie (`ECART-013` É-1) |
| `pnpm verif:maquette:app:zones` | Le protocole des 55 états de zone des six vues qui présentent leurs états côte à côte (ARB-014) |
| `pnpm verif:maquette:sonde` | **Que le banc sait dire non** : perturbe le seul côté candidat et exige qu'il rougisse, code retour inversé. Un banc toujours vert ne prouve rien (RA-01) |
| `pnpm verif:demo:hors-production` | Que le mode démo `/__design/…` n'existe pas dans le produit construit |
| `pnpm scenarios:verifier` | Que les scénarios du dépôt sont bien ceux que l'extraction des planches régénère |
| `pnpm vues:feuille V-xx --installer` | Pose `src/vues/V-xx.css`, **identique à l'octet** au second bloc `<style>` de la maquette (P-6.3) |
| `pnpm vues:styles [V-xx]` | L'ensemble clos des valeurs de `style` du gel d'une vue, et ce qui en sort côté composant (P-6.4, ARB-016). Diagnostic : le verdict reste celui de `pnpm verif:jetons` |

**Un vert ne vaut que ce que la commande a réellement emprunté — ni plus, ni pour des propriétés
que le candidat possède déjà.** Trois fois déjà, un étalonnage a été déclaré vert sur un chemin que
les vues n'empruntent pas, ou sur un candidat qui possédait ce dont l'implémentation est démunie —
et le défaut est apparu au premier lot réel (`ECART-013` É-1, `ECART-014`, `ECART-015` É-5). Avant
de conclure d'un vert, demande-toi *ce qu'il n'a pas traversé* **et** *ce qu'il avait en trop*. Le
banc réimprime la liste à chaque exécution en régime d'étalonnage ; elle est tenue à
`verif/references/protocole-app.json`, bloc `sources`.

### Ce qu'un vert ne dit jamais

`verif:maquette` mesure la **fidélité au gel**, jamais la satisfaction d'une exigence. Quand la
référence elle-même n'honore pas une règle, la batterie est verte et la règle reste non tenue.
Les interdictions de conclure en vigueur sont listées à `docs/dag-phase-1.md` §8 et rappelées au
contrat de chaque lot. À ce jour : `P-09`, `RG-ACC-04`, `RG-M18-12`, `RG-M18-13`, et tout
comportement temporisé.

Un niveau de boucle qui dépasse son budget est un **défaut de harnais** : au-delà, l'agent cesse de l'exécuter spontanément et la délégation se dégrade (plan §3.7).

---

## 5. Les dix principes non négociables

*Recopiés intégralement de `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` § « Principes de conception non négociables ». Ils priment sur toute considération de commodité de réalisation. Ce sont eux que l'agent sacrifie en premier sous contrainte, et les plus coûteux à réintroduire après coup.*

| # | Principe | Portée |
|---|---|---|
| P-01 | **Une seule définition de la fraîcheur** | Le badge d'une note, les agrégats de domaine, ceux d'univers et les indicateurs d'accueil emploient rigoureusement le même calcul. Deux définitions concurrentes ruinent la crédibilité du signal (RG-M06-03) |
| P-02 | **Aucune valeur illustrative** | Aucun indicateur, aucune tendance, aucun compteur ne peut être figé ou simulé. Une donnée indisponible s'affiche comme telle (RG-M01-01) |
| P-03 | **Aucune entrée de menu inerte** | Une entrée visible est une entrée qui fonctionne. Pas de « bientôt disponible », pas de lien mort, pas d'onglet grisé |
| P-04 | **Les modules de domaine sont réellement effectifs** | Un module désactivé disparaît de la navigation et des tableaux de bord du domaine. L'activation n'est pas décorative (RG-STR-06) |
| P-05 | **Le pilotage documentaire est livré, pas différé** | Santé par domaine, trous documentaires et notes orphelines font partie de la première livraison. Ce sont eux qui font vivre le corpus (M15) |
| P-06 | **Alternative textuelle sur tout contenu graphique** | Cartographie, carte mentale et comparaison visuelle disposent d'une restitution exploitable sans le rendu graphique (RG-M18-11) |
| P-07 | **Un seul terme par concept** | Le vocabulaire du §2.3 est contractuel. Aucun synonyme ne circule dans l'interface. Seul le concept « fiche » est renommable, et globalement (M14.7) |
| P-08 | **L'origine d'une relation est visible** | Déclarée, déduite ou ambiguë : l'utilisateur sait toujours si une relation a été saisie par un humain ou inférée (M08.3) |
| P-09 | **Une action interdite n'est pas affichée** | Ni grisée, ni refusée après le clic. L'utilisateur ne rencontre pas de porte fermée (RG-M05-08) |
| P-10 | **Dégradation, jamais panne** | Une brique optionnelle indisponible dégrade la fonctionnalité concernée avec un message clair, sans jamais empêcher l'usage du reste (RG-NF-01) |

---

## 6. Les pièges connus du projet

*Vide au départ. Cette section est alimentée par la capitalisation (`cadrage/PLAN-DE-REALISATION.md` §10) : à la clôture de chaque lot, tout piège d'environnement ou convention non évidente rencontré par un agent y est inscrit — l'agent rédige, l'humain arbitre. Une décision d'architecture ou une interdiction va dans `docs/adr/` ; un motif d'interface va dans `docs/DESIGN.md` ; un écart de spec va en `cadrage/`, par arbitrage humain uniquement.*

### P-1 · Un guetteur `pgrep` ne convient pas — attends un marqueur écrit

`until ! pgrep -f "verif/maquette.mjs"; do sleep 10; done` **ne se termine pas** : la ligne de
commande du shell guetteur contient le motif, `pgrep` la trouve, et l'attente expire.

**Et la parade recommandée ici ne suffit pas.** Un guetteur `pgrep -f "node verif/a11y.mjs"` s'est
trouvé lui-même à son tour (T-065). Pire : **le motif attrape aussi les processus des autres copies
de travail** — jusqu'à dix tournent en parallèle, et le guetteur attend alors la fin d'un lot
étranger.

**La seule parade sûre est d'attendre un marqueur écrit** — une ligne de journal, un fichier de
rapport, un code de sortie —, jamais la disparition d'un processus.
*(P-9, 19/08/2026 ; élargi par T-065)*

### P-2 · Une copie de travail fraîche déclare « no tests » au lieu d'échouer

`.svelte-kit/tsconfig.json` est **généré** et ignoré par git. Sans `svelte-kit sync`, vitest rend
`Tsconfig not found` puis **« no tests »** — un faux vert traître, qu'un lecteur pressé lit
« rien à faire » là où la commande a échoué. `verif/preparer-copie.sh` lance la synchronisation ;
ne pas créer de copie à la main. *(T-101d, 19/08/2026)*

### P-3 · Le panneau `tiroir-form` des consoles ne glisse jamais, et c'est le gel

La seule règle qui l'ouvre est `.app[data-form="ouvert"] .tiroir-form`, or le panneau vit **hors de
`div.app`** : le sélecteur ne peut pas s'appliquer. Le panneau reste hors fenêtre et **ne pèse aucun
pixel** — le niveau 1 en est le seul juge. **Un implémenteur qui « réparerait » cela rendrait six
vues rouges.** *(P-2, 19/08/2026)*

### P-4 · `autofocus` ne survit pas à `stabiliser()` hors dialogue

Le banc floute l'élément actif au chargement. `autofocus` ne prend que dans un dialogue révélé, où
`showModal()` est appelé **après** la stabilisation. Inutile de le poser sur un nœud de page : il
sera perdu, et la cause cherchée ailleurs. *(P-2, 19/08/2026)*

### P-6 · **Le formateur peut casser la conformité, et rien ne le signale**

`prettier --write` réintroduit des **blancs entre nœuds** à l'intérieur des cartes et des listes.
Le relevé d'ordre de tabulation du niveau 1 construit le nom accessible sur `textContent` : **un
blanc inséré s'y voit**. Mesuré : **27 couples en échec de structure** sur V-01, V-02 et V-26, pour
cette seule cause.

Le formatage fait partie de `pnpm check`, donc du critère de sortie de tout lot : **un lot peut
donc échouer parce qu'il a obéi à une autre de ses obligations.** Parade : `<!-- prettier-ignore -->`
au-dessus de la région concernée — **forme exacte obligatoire**, un commentaire
`prettier-ignore — …` n'est pas reconnu. Documenter le motif à côté. *(P-13, 19/08/2026)*

### P-7 · Un attribut de `<body>` n'est pas atteignable depuis une vue

Svelte **refuse** tout attribut sur `<svelte:body>`, et le mode démo compose le document lui-même.
Une maquette qui pose `<body data-x="…">` et dont la feuille lit `body[data-x]` a besoin d'une
déclaration dans `verif/references/protocole-app.json` → `attributs_de_corps`, en écriture humaine
seule. Une seule maquette est dans ce cas — V-03 —, et l'oublier coûtait 34 870 pixels.
*(P-13, 19/08/2026)*

### P-8 · Svelte élague les blancs en bord d'élément

`<span>{n.univers} › </span>` perd son espace final : le rendu donne « Production ›Infrastructure› »
et le niveau 1 échoue sur le nom accessible. **Porter l'espace dans l'expression** :
`{n.univers + ' › '}`. Mesuré sur deux lots. *(P-1 et P-4, 19/08/2026)*

### P-9 · Un commentaire de balisage ne peut pas citer `<!-- prettier-ignore -->`

Le `-->` intérieur ferme le commentaire, et la suite fuit dans le DOM en nœud de texte — quatre
couples en échec de structure. Ne jamais citer la forme exacte à l'intérieur d'un commentaire.
*(P-4, 19/08/2026)*

### P-10 · Dans une région serrée, une ligne qui ne finit pas par un tag ouvert crée un nœud de texte

Dans un bloc `<!-- prettier-ignore -->` écrit en `></tag\n\t><tag`, remplacer une ligne par un
`{@render}` qui ne finit **pas** par un tag ouvert transforme le `\n\t>` suivant en texte. Se relit
dans le nom accessible du `row`. *(P-2, 19/08/2026)*

### P-11 · PostgreSQL 18 se monte sur `/var/lib/postgresql`, pas `…/data`

Le point de montage a changé avec la 18 : monter `…/data` fait **refuser le démarrage**. Coûté un
démarrage raté. *(T-003, 19/08/2026)*

### P-12 · L'instrument est dans le chemin de construction de l'image

`vite.config.ts` importe le mode démo, qui lit `verif/references/protocole-app.json` **au chargement
du module**. Sans ces deux fichiers dans le contexte, `vite build` s'arrête sur `ENOENT`. Une image
qui n'embarquerait que `src/` ne se construit pas. *(T-003, 19/08/2026)*

### P-13 · **Ne compose jamais une URI de connexion — la base se configure par variables séparées**

Un `/`, un `#` ou un `?` dans un mot de passe fait sortir l'application en `ERR_INVALID_URL`
**au démarrage**, et le message ne nomme pas la cause. Mesuré sur six mots de passe : `mot/de+passe`,
`mot#passe` et `mot?passe` tuent le service ; `mot@passe`, `mot:passe` et un tirage hexadécimal
passent.

**La première rédaction de ce piège recommandait `openssl rand -hex 32`. C'était une parade
déclarative**, qui repose sur la discipline de l'exploitant — le plus mauvais des trois régimes de ce
dépôt (*bloquant > vérifiable > déclaratif*) pour un défaut qui refuse le démarrage.

**La parade est désormais dans la forme** (ARB-038) : `HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`,
`MDP_BASE`, `NOM_BASE`, et un **objet** passé au connecteur. Rien n'est concaténé, donc rien n'est à
échapper. *(T-003 puis T-010, 19/08/2026)*

### P-16 · Un lot qui installe une dépendance casse l'hypothèse des copies de travail

`node_modules` est un **lien** vers l'arbre principal (`verif/preparer-copie.sh`), et le script le
justifie : *« le lien est sûr ici parce qu'aucun lot n'installe de dépendance »*. **Un `pnpm add` dans
une copie écrit donc dans l'arbre du voisin.** Remplacer le lien par une installation locale coûte
10 s, le magasin pnpm étant sur le même tmpfs.

Et **retirer une dépendance ne suffit pas à revenir en arrière** : pnpm laisse un
`pnpm-workspace.yaml` et des pairs optionnels résolus dans le lockfile, qui font sortir
`pnpm install --frozen-lockfile` en 1. Réinitialiser le lockfile depuis `HEAD`, puis réinstaller.

**Corollaire pour l'orchestrateur** : ne jamais rapatrier un lot qui ajoute une dépendance tant que
d'autres copies tournent — l'installation change `node_modules` **sous** elles. *(T-010, 19/08/2026)*

### P-17 · Un accent grave dans un modèle littéral JavaScript ferme le modèle

Un commentaire SQL rédigé à l'intérieur d'un *template literal* et citant un identifiant entre
accents graves coupe la chaîne : l'erreur remonte en `[PARSE_ERROR] Expected a semicolon`, **à cent
lignes de la cause**. Même famille que **P-9**, où citer la forme exacte de `prettier-ignore` dans un
commentaire de balisage faisait fuir la suite dans le DOM. *(T-010, 19/08/2026)*

### P-19 · Un bloc `<style>` de composant n'est **jamais** servi au banc

`verif/banc/mode-demo.mjs` **compose le document lui-même** et n'y lie que trois feuilles : les
polices, `src/socle.css`, `src/vues/V-xx.css`. Or Svelte en rendu serveur **ne met pas la CSS d'un
composant dans `rendu.head`**.

Conséquence, et elle est traître : `pnpm check`, `verif:jetons` et `svelte-check` sont **verts**, la
classe de portée est bien posée sur les nœuds du document servi — et le banc reste **au pixel près
identique à l'écart d'avant**. Mesuré : 13 276 px inchangés, sur une correction pourtant juste.

**Aucun composant de `src/` ne portait de bloc `<style>` avant le 19/08/2026** : la propriété n'avait
jamais été exercée — **P-5** mot pour mot. Le canal qui atteint le document est `<svelte:head>`, et
il ne se soustrait à aucun contrôle : `verif:jetons` relève tout bloc `<style>` d'un `.svelte`, où
qu'il soit. *(T-063, 19/08/2026)*

### P-20 · Une forme de balisage citée dans un commentaire est lue comme du balisage

Écrire `class="notifs …"` **dans un commentaire** fait rougir le relevé de composants :
`inventaire-composants.mjs` relève les `class="…"` sans distinguer prose et balisage. C'est le cousin
exact de **P-9**, où citer la forme de `prettier-ignore` dans un commentaire de balisage faisait fuir
la suite dans le DOM. **Décrire une forme, ne jamais la citer.** *(T-063, 19/08/2026)*

### P-21 · N'énonce jamais un fait sur le gel sans citer la ligne que tu as lue

**Sept chiffres ou affirmations transmis par l'orchestrateur se sont révélés faux**, et la cause est
toujours la même : une propriété du gel affirmée sans ouvrir le fichier. Trois exemples du seul
19 août :

- *« aucune maquette ne montre un module de domaine désactivé »* — **V-11 et V-28 en montrent 39
  instances, 7 ensembles distincts** ; `P-04` était éprouvé depuis le début ;
- *« V-18 est la lecture du registre Opérationnel »* — c'est l'**éditeur** ; son gel ne porte aucun
  `<article>` ni aucune règle d'impression ;
- une plage de lignes de constructeur **amputée du quatrième nœud** : qui l'aurait crue aurait porté
  trois nœuds sur quatre.

`verif/contrat.mjs` protège contre les chiffres tapés à la main. **Il ne protège pas contre une
lecture de travers, ni contre une affirmation qu'on n'a pas vérifiée.** La parade est une discipline
d'écriture : *fichier, ligne, et ce qu'on y lit* — ou rien. *(19/08/2026)*

### P-22 · Ce qu'un lot laisse derrière lui — serveurs, conteneurs, volumes

**Mesuré deux fois le 19 août, et la seconde était pire.**

| Ce qui restait | Combien | Depuis | Coût |
|---|---|---|---|
| Serveurs Vite | **8** | jusqu'à **21 h** | **7,3 Go** de mémoire |
| Conteneurs d'agents | **14** | **2 jours** | 0,7 Go, et 49 volumes |

`ECART-014` É-2 relevait déjà « six serveurs de développement orphelins », et le passage aux copies
de travail devait refermer le cas. **Il l'a aggravé** : chaque copie lance les siens, et rien ne les
arrête quand le lot rend. Un lot qui appelle `pnpm verif:base` crée en outre un **conteneur
PostgreSQL et ses volumes**, que le retrait de la copie n'emporte pas.

**Deux conséquences, et la seconde est la plus grave.** Le banc ralentit — les mêmes 409 couples
passent de 363 s à 563 s selon la charge. Et surtout, **un port pris par un orphelin fait mesurer le
mauvais serveur** : c'est le symptôme qu'`ECART-017` É-8 avait nommé, et `--strictPort` n'y protège
que si le lot le passe.

**Deux gestes à la clôture d'un lot, jamais un seul :**

```bash
chmod -R u+w /tmp/wt-<nom> && git worktree remove /tmp/wt-<nom> --force   # emporte son serveur
docker rm -f -v <les conteneurs que le lot a créés>                       # jamais un prune aveugle
```

**Ne jamais repérer un processus par `pgrep` sur un motif** (`P-1`) : il se trouve lui-même, et il
attrape les processus des autres copies. *(19/08/2026)*

### P-18 · Depuis l'imbrication CSS, `CSSStyleRule` porte un `cssRules` vide mais vrai

`CSSStyleRule` hérite désormais de `CSSGroupingRule` : **toute** règle expose un `cssRules`, vide la
plupart du temps, **donc présent, donc vrai**. Un parcours écrit
`if (r.cssRules) { descendre ; continue }` saute **toutes** les règles du document et rend `0` sans
se plaindre — mesuré : **0 règle masquante sur V-08, qui en porte 30**.

Faux vert silencieux, et de la pire espèce : il ne ressemble pas à une panne, il ressemble à un
résultat. Tester `r.cssRules && r.cssRules.length`, ou le type de la règle.
*(T-061, 19/08/2026)*

### P-5 · Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle marche

Le filtre d'adresses d'ARB-013 fut inerte pendant huit lots : il visait `/url:` quand Playwright
imprime `- /url:`. Personne ne l'a vu parce que toutes les vues portaient `href="#"` — la ligne
comparée était identique des deux côtés, et le filtre inerte rendait le même verdict qu'un filtre
qui marche. **Toute règle nouvelle doit être éprouvée sur un cas qui la sollicite**, sinon elle
n'est pas posée, elle est espérée. *(P-9, 19/08/2026)*

**Et une règle éprouvée sur un seul mécanisme n'est éprouvée qu'à moitié.** Le socle **masque** quand
le droit tombe ; **V-13 masque par défaut et révèle quand le droit est là**. Un crible limité aux
règles masquantes ne voit **rien** de V-13 — dix actions gouvernées, invisibles. Chercher la
**polarité inverse** de ce qu'on mesure fait partie de l'épreuve. *(T-061, 19/08/2026)*

### P-14 · L'horloge virtuelle du banc ne survit pas au parallélisme

`verif/banc/conditions.mjs` fait `clock.install({time: T})` puis `clock.pauseAt(T)`. **Entre les deux
appels, le temps virtuel court.** En séquentiel l'écart est nul et rien ne se voit ; dès que
plusieurs pages s'ouvrent de front, `T` est déjà passé quand `pauseAt` s'exécute et Playwright rejette
avec `Cannot fast-forward to the past`. Mesuré : **2 couples sur 409 à six pages parallèles, 0 en
séquentiel**.

Le banc étant séquentiel, il ne l'a jamais rencontré — c'est la batterie 10 qui l'a levé, et elle
rejoue trois fois plutôt que de toucher au fichier. **À réparer avant toute parallélisation du
banc** : `pauseAt` doit viser un instant postérieur à l'installation, ou l'installation poser
l'horloge déjà arrêtée. *(ECART-039 É-1, 19/08/2026)*

**Corollaire, et il vaut au-delà de l'horloge.** Un instrument séquentiel peut porter un défaut que
seule la concurrence révèle : *l'absence de panne n'est pas une preuve de correction, c'est une
preuve que le cas n'a pas été joué.* C'est P-5 sous un autre angle.

### P-15 · axe-core est incompatible avec une horloge arrêtée

axe enchaîne ses tranches d'analyse par `setTimeout` : **horloge arrêtée, il ne rend jamais la
main** — mesuré à plus de deux minutes sur V-21 avant abandon. L'état doit être établi horloge
arrêtée, puis `clock.resume()` appelé juste avant `analyze()`, sous une garde qui déclare le DOM
possiblement instable (3 couples sur 409 l'ont déclenchée). *(ECART-039 É-2, 19/08/2026)*

---

### P-23 · Un commentaire n'est retiré du produit construit que s'il ne précède rien de retenu

Citer l'adresse du mode démo **dans un commentaire** d'une route bâtie fait rougir
`verif:demo:hors-production` sur **trois fichiers produits** — la batterie cherche la chaîne en texte
brut, commentaires compris.

**Et la raison pour laquelle les autres routes y échappent est un accident, pas une propriété.** Le
regroupeur conserve un commentaire qui précède une instruction **retenue** ; les routes bâties
existantes s'en tirent seulement parce que leur commentaire ne précède que des imports. **Un `$props()`
de plus, et la trace revient.** C'est l'écart É-2 de `T-070` qui se rejoue au lot suivant.

La parade est celle de **P-20**, et elle vaut mot pour mot ici : **décrire une forme, ne jamais la
citer.** *(T-012, 20/08/2026)*

---

### P-24 · `verif/preparer-copie.sh` lie `node_modules`, et l'hypothèse qui le justifiait est tombée

Le script se justifie en propres termes : *« le lien est sûr ici parce qu'aucun lot n'installe de
dépendance »*. **`T-012` en a installé une** — `@node-rs/argon2`, que `STACK-TECHNIQUE.md:321`
impose —, et l'hypothèse a cessé d'être vraie le 20 août 2026.

Le geste est celui de **P-16**, et il coûte 1,1 s :

```bash
rm node_modules && pnpm install --frozen-lockfile     # AVANT tout pnpm add, dans la copie
```

**Ce que P-16 ne disait pas, et qui décide du rapatriement :** un lot qui ajoute une dépendance
modifie aussi `package.json` **et** `pnpm-lock.yaml`. Or `pnpm add` **réordonne** les dépendances
existantes. Deux lots parallèles qui touchent `package.json` ne se rapatrient donc **jamais par `cp`** :
la fusion est à la main, ligne par ligne. *(T-012, 20/08/2026)*

---

### P-25 · Une copie de travail d'agent DANS le dépôt fait rendre 340 erreurs à `pnpm check`

L'outillage agentique peut créer une copie de travail **à l'intérieur** du dépôt, sous
`.claude/worktrees/`. `.gitignore` l'exclut ; **eslint ne lit pas `.gitignore`** — son ignore est la
liste de `eslint.config.js`. Sans `.claude/` dedans, le dépôt entier est relu une seconde fois sous une
racine `tsconfig` ambiguë, et la **batterie 1** rend :

```
0:0  error  Parsing error: No tsconfigRootDir was set, and multiple
            candidate TSConfigRootDirs are present          … ×340
```

**Faux rouge, et de la pire espèce pour un diagnostic** : il est **intermittent** — il n'existe que
pendant qu'un tel agent tourne —, il est **sans rapport avec le moindre livrable**, et il ne s'était
jamais vu parce que les vagues précédentes n'employaient que des copies sous `/tmp/wt-*`. C'est `P-5`
retourné : une configuration qu'aucun cas n'exerçait, et qui était fausse.

`.claude/` est désormais dans les ignores. **Et ce n'est pas un assouplissement** : la ligne ne retire
aucun fichier du **produit** au crible, seulement une copie transitoire que git ignore déjà. La lecture
inverse — eslint doit contrôler la copie d'un agent — échoue par construction, quel que soit le code.
*(T-013b, 20/08/2026)*

---

### P-26 · Un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve devient inerte en réussissant

**Trois occurrences, et la troisième a nommé le motif.**

| Le contrôle | Son unique cas | Ce qui l'a effacé |
|---|---|---|
| la sonde de restitution de focus | un couple du banc | sa propre correction — plus exercée par aucun des 409 |
| `B3` de la batterie 5 — « le libellé vient de `libelleFraicheur()` » | `{voisine.libelle}` de V-14, et `verif/fraicheur.mjs` le DIT : *« sans la condition de receveur, ce contrôle serait inerte »* | `T-013b`, en réparant précisément ce défaut |
| le filtre d'adresses d'`ARB-013` | aucun — inerte huit lots | rien : il n'a jamais marché (`P-5`) |

Ce n'est pas un paradoxe, c'est une **exigence de conception** : tout contrôle doit avoir un cas
d'épreuve **synthétique**, indépendant de l'état du dépôt. `verif/fraicheur.test.ts:313-380` en porte
un, et c'est pourquoi B3 reste éprouvé après la correction ; la sonde de focus n'en a pas, et elle est
redevenue une règle qu'on espère.

**Corollaire pour tout lot qui répare un défaut** : demande-toi si le contrôle qui l'a trouvé garde un
cas après ta correction. Si non, **dis-le** — ce n'est pas un rouge, c'est une dette à connaître.
*(T-013b, 20/08/2026 ; motif présent depuis ECART-039)*

---

### P-27 · Le joker de type MIME ferme un commentaire de bloc JavaScript

Écrit **dans un commentaire de bloc**, il en referme la clôture : la suite du commentaire devient du
code, et l'erreur remonte en `SyntaxError: Unexpected template string`, **à quarante lignes de la
cause**. Coûté une exécution.

**Quatrième membre d'une famille que ce dépôt connaît bien** : `P-9` (citer la forme de
`prettier-ignore` dans un commentaire de balisage), `P-17` (un accent grave dans un modèle littéral),
`P-20` (citer une forme de balisage dans un commentaire). La règle est la même dans les quatre cas, et
elle est courte : **décrire une forme, ne jamais la citer.** *(T-012b, 20/08/2026)*

---

### P-28 · Une matrice dont les cases se contaminent mesure l'ordre, pas la propriété

`/deconnexion` est la **seule action d'écriture en GET** du produit (`ARB-054`). Dans une matrice
adresses × personas, la case qui la demandait **fermait la session**, et toutes les cases suivantes du
même persona étaient mesurées en anonyme. **Mesuré : 76 défauts, dont 62 étaient cet artefact.**

Deux enseignements, et le second est le moins évident :

1. **Chaque case rétablit son état avant de mesurer.** Une matrice doit être indépendante de l'ordre de
   parcours, sinon elle mesure son propre parcours.
2. **Ce qu'on neutralise, on le mesure ailleurs.** Neutraliser l'effet de bord de `/deconnexion` aurait
   effacé la preuve que `RG-ACC-02` est tenue. Elle est donc mesurée **à part** — sinon la correction
   du piège aurait créé un trou de couverture invisible.

Même famille que **P-14** (un instrument séquentiel porte des défauts que seule la concurrence révèle)
et que **P-26** : *l'absence de panne n'est pas une preuve de correction, c'est une preuve que le cas
n'a pas été joué.* *(T-012b, 20/08/2026)*

---

### P-29 · Le cache de pré-groupage de Vite est PARTAGÉ par toutes les copies de travail

`verif/preparer-copie.sh` **lie** `node_modules` à l'arbre principal. `P-16` et `P-24` n'en retenaient
que l'installation de dépendances — mais `node_modules/.vite/deps_ssr` est **écrit à l'exécution**, et
dix copies l'écrivent donc en même temps.

Symptôme : `There is a new version of the pre-bundle`, sur une commande qui n'a rien à voir. Mesuré
trois fois sur un seul lot, en concurrence avec neuf autres. Cousin de **P-14** — un défaut que seule la
concurrence révèle.

**Parade** : sérialiser les batteries d'un même lot, et rejouer. Une copie qui échoue là-dessus n'a rien
à corriger. *(T-037, 20/08/2026)*

---

## 7. Protocole de fin de tâche

### Le protocole UI en quatre temps

*`règles/workflow_agentic.md` §4.15. Toute tâche portant sur une vue gelée s'y soumet, dans cet ordre.*

1. **Extraction — la lecture prouvée.** Un pointeur n'est pas une lecture. Premier livrable, **avant toute ligne de code** : une restitution de la maquette — zones, composants (tous issus de l'inventaire fermé de `docs/DESIGN.md`), jetons, états couverts — confrontée au brief de la vue. Une erreur de lecture se paie ici un paragraphe, pas une implémentation.
2. **Squelette statique conforme.** Premier code : la vue sans logique, rendue avec le jeu de semence, `pnpm verif:maquette V-xx` vert. La conformité s'établit **avant** que la logique ne rende le rendu coûteux à corriger.
3. **Logique**, conformité de maquette maintenue verte à chaque étape.
4. **Preuves.** Le rapport de conformité (code retour, écarts chiffrés) et les captures côte à côte par état sont joints. La conformité se constate sur pièces, jamais sur déclaration : « ça correspond à la maquette » sans rapport joint est un critère non rempli.

Une vue n'est livrée que si, **pour chaque état déclaré** dans `verif/scenarios/V-xx.json` : le niveau 1 (structure) est vert sans tolérance, le niveau 2 (pixels) est conforme ou arbitré au niveau 3, et les quatre états de zone de RG-M18-03 sont couverts. Une vue partiellement conforme n'est pas une vue livrée (plan §4.3).

### Ce qui doit être vert

- `pnpm verify:lot T-xxx` — l'intégralité des batteries citées par le contrat de tâche, aucune ignorée, aucune désactivée « en attendant ».
- Les quatre états de chaque zone touchée, et la conformité de maquette de chaque vue touchée.
- Aucun écart non déclaré : toute décision prise en exécution est un défaut de contrat, à remonter comme entrée ÉCART.

### Ce qu'il faut écrire au journal de vague

*Dans `docs/journal/Vn.md`, gabarit en plan §16 annexe C.* Lot livré et son état ; rouvert ou non ; nombre de sessions ; écarts remontés et leur arbitrage ; batteries vertes et rouges avec remarque ; recours au niveau 3 de la comparaison visuelle ; faux positifs visuels ; jetons consommés en implémentation et en vérification ; apprentissages et leur destination.

### Ce qu'il faut remonter

Tout vide de spécification rencontré, tout état non maquetté, toute incohérence entre maquette et cahier des charges, toute exigence sans critère exécutable, tout débordement d'une session. Ces remontées sont l'entrée d'information du dispositif — les taire est le seul échec irrécupérable.

### La question de clôture

**Le dépôt suffirait-il à réexpliquer ce lot sans le rouvrir ?** (plan §9.) Contrat, journal de vague, ADR et commentaires du code sont la mémoire externalisée ; si l'un manque, la dette de compréhension s'installe sans témoin. Une réponse négative refuse la clôture.
