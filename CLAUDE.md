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

**Un vert ne vaut que ce que la commande a réellement emprunté.** Deux fois déjà, un étalonnage a
été déclaré vert sur un chemin que les vues n'empruntent pas — et le défaut est apparu au premier
lot réel. Avant de conclure d'un vert, demande-toi *ce qu'il n'a pas traversé*.

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

*(aucune entrée à ce jour)*

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
