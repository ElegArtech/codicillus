---
titre: Cycle de vie de développement agentique
type: note de référence — méthode
statut: v1.2 — non éprouvée (pilote prévu — rationarium)
date: 2026-08-16
sources:
- "Conversation Claude, 2026-08-14 — construction du cycle"
- "Mike Codeur, « Agentic Engineering : la Masterclass Complète », YouTube (WCufvACxXVU) — greffons DAG, criticité, gate"
- "Conversation Claude, 2026-08-16 — renforcement des gardes-fous de conformité design (retour d'incident)"
- "Conversation Claude, 2026-08-16 — topologie d'exécution et orchestration (second incident : session monolithique)"
tags: [agentic-engineering, cycle-de-vie, méthode, dev-solo, spec-first]
---

# Cycle de vie de développement agentique — note de référence

**Objet.** Décrire de bout en bout le cycle de développement pour des projets greenfield menés en solo avec des agents de code, à valider sur un premier projet pilote avant généralisation. La note consolide la construction élaborée en conversation avec trois greffons retenus de la masterclass « Agentic Engineering » — signalés `[greffon]` dans le texte — en écartant le registre démonstratif de la source (les métriques de type « SaaS en 48 h » ne sont pas des hypothèses de travail ici).

**Statut.** Version 1.1, non éprouvée en conditions réelles. Les décisions établies et les points ouverts sont distingués ; les points ouverts sont regroupés en §8. La v1.1 (2026-08-16) renforce la chaîne de conformité design après un incident d'exécution — référence design ignorée par l'agent malgré sa mention au contrat : hiérarchie des gardes-fous (§1), double régime de conformité et intégrité de la référence (§4.10), invariant design au contrat (§4.13), volet UI du gate (§4.14), protocole UI et protocole d'écart (§4.15), couches bloquantes du harnais et défense en profondeur (§5), risque de contournement de la vérification (§6), annexes A–E révisées, F–G ajoutées. La v1.2 (même jour) ajoute la topologie d'exécution après un second incident — exécution monolithique en session unique, sans agent ni orchestration, malgré la consigne : topologie fixée par artefact (§1, §4.12–4.13), rôles et règle « une tâche = un contexte » (§4.15), inventaire d'exécutants et commandes de dispatch (§5), risque de monolithisme de session (§6), volet topologie du gate (annexe C), annexes B et E révisées, H ajoutée.

---

## 1. Principes directeurs

**Déplacement de la valeur.** Quand l'exécution devient bon marché — un agent produit du code vite et en volume — la valeur migre aux deux extrémités du cycle : la spécification en amont, la vérification en aval. Écrire le code cesse d'être le goulot d'étranglement ; la capacité à spécifier précisément et à vérifier honnêtement devient le facteur limitant. Tout le cycle décrit ici découle de ce déplacement.

**Réduction progressive des libertés.** Chaque artefact amont réduit l'espace des choix disponibles en aval : la Business Analysis fixe le problème, le PRD le périmètre, les US le comportement, les EF le détail vérifiable, les ENF les contraintes transversales, le mockup gelé le rendu. Corollaire : quand un agent « prend des libertés » (UI générique, routage improvisé, comportement inventé), ce n'est pas une faute de l'agent mais un vide de contrainte. Le texte seul sous-détermine l'UI ; l'agent comble les vides avec ses priors. La réponse est toujours structurelle — ajouter la contrainte manquante — jamais incantatoire (répéter la consigne plus fort).

**Hiérarchie des gardes-fous.** Corollaire opérationnel du principe précédent : les contraintes n'ont pas toutes la même force. Trois niveaux, par efficacité décroissante — **bloquant** (l'environnement rend la non-conformité non terminable : lint en échec, hook qui refuse l'écriture, CI rouge), **vérifiable** (l'écart est détecté et prouvé mécaniquement : diff de rendu, assertion), **déclaratif** (la consigne énonce : CLAUDE.md, brief, prompt). Le déclaratif seul ne tient pas la distance d'une session — il se dilue dans le contexte exactement comme une ENF recopiée (§4.6), et un pointeur cité n'est pas un fichier lu. Règle : toute contrainte qui compte existe au moins au niveau vérifiable ; toute contrainte non négociable existe au niveau bloquant. « Le design fait loi » écrit dans un prompt est une incantation ; le même invariant devient réel quand la tâche ne peut pas se clore sur un design:check rouge (§4.10, §5).

**Séparation divergence / convergence.** L'exploration créative s'épuise dans des espaces dédiés (la webapp pour les mockups, la conversation pour les specs) _avant_ l'exécution. L'agent d'exécution ne reçoit que des cibles fermées : il ne dessine pas, il transpose ; il ne décide pas, il implémente. Toute décision prise pendant l'exécution est un signal de spec incomplète.

**Trois régimes de production.** Chaque artefact du cycle relève d'un régime explicite — humain, assisté ou agentique (§2). L'assignation d'un artefact à un régime est elle-même une décision d'architecture du cycle, motivée et révisable.

**Topologie d'exécution décidée, jamais par défaut.** Le régime agentique dit *qui* produit ; il ne dit pas *dans quelle structure de sessions*. Or la structure par défaut — une session unique qui enchaîne tout — est la pire : le contexte sature, les contraintes amont se diluent, la qualité s'effondre en fin de course. C'est le mécanisme commun aux deux incidents fondateurs de cette note (référence design « pas vue », finitions bâclées). La topologie — orchestrateur, sous-agents isolés, vagues parallèles en worktrees — se fixe donc par artefact (DAG §4.12, contrat §4.13), au même titre que la criticité. « Utiliser au mieux les features agentiques disponibles » écrit en consigne est une incantation de plus : elle ne nomme ni feature, ni déclencheur, ni unité de travail. Une colonne *exécutant* dans le DAG est une décision.

**Le repo comme mémoire externe.** Quand l'agent écrit une part majoritaire du code, la connaissance du système migre de la tête vers le repo. Les specs, ADRs et docs de harnais cessent d'être de la documentation : ce sont la mémoire de travail externalisée. La question de fin de session n'est pas « est-ce que ça marche » mais « est-ce que je comprends encore ce système ». La dette de compréhension est le risque de fond du dev solo agentique (§6).

**La maîtrise comme variable à défendre.** La matrice autonomie × maîtrise `[greffon]` sert de grille d'auto-audit, pas de typologie : on ne quitte pas le quadrant « autonomie élevée / maîtrise élevée » en changeant d'outillage, mais par érosion silencieuse de la maîtrise — lancer plusieurs agents en parallèle peut toujours relever du vibe coding si le contrôle qualité s'est relâché. L'audit est périodique (§6).

---

## 2. Les trois régimes de production

|Régime|Définition|Artefacts concernés|Justification|
|---|---|---|---|
|**Humain**|Production sans IA rédactrice (au plus une IA maïeutique, voir ci-dessous)|Expression de besoin ; arbitrages et validations tout au long du cycle ; vérification finale|Ancrage épistémique : le besoin est le seul point où l'information entre dans le système depuis l'extérieur. Tout le reste est dérivation. Si l'IA co-rédige l'origine, boucle auto-référentielle : l'IA spécifie ce que l'IA construira, et l'humain valide du plausible.|
|**Assisté**|IA générative en boucle interactive serrée, hors boucle agentique et hors repo|Mockups (génération en webapp Claude, itération conversationnelle)|La boucle visuelle instantanée (artifact rendu immédiatement, itération « plus dense », « montre l'état vide ») est le bon outil pour épuiser la divergence. L'exploration ne pollue pas le repo.|
|**Agentique**|Un agent produit, l'humain valide et arbitre|BA, PRD, US, EF, ENF, briefs de vues, diff retour mockup ↔ specs, DAG, exécution du code, revue outillée, capitalisation|Levier de volume, contraint par le harnais (§5). Le rôle humain passe de rédacteur à valideur — mais la cohérence inter-artefacts reste un travail humain, et c'est le vrai poste de charge.|

**Exception maïeutique (régime humain).** Un agent peut intervenir sur l'expression de besoin en rôle strictement maïeutique : interviewer, détecter les ambiguïtés, poser les questions non posées — sans jamais tenir le stylo. Le texte final est écrit à la main.

---

## 3. Vue d'ensemble du pipeline

```mermaid
flowchart TD
    A["Expression de besoin (humain)"] --> B["Business Analysis (agentique)"]
    B --> C["PRD (agentique)"]
    C --> D["User Stories (agentique)"]
    D --> E["EF par US (agentique)"]
    D --> F["ENF → harnais permanent"]
    D --> G["Inventaire routes / vues / états"]
    G --> H["Briefs de vues (agentique)"]
    H --> I["Mockups en webapp (assisté)"]
    I --> J["Gel dans /design (référence versionnée)"]
    J --> K["Diff retour mockup ↔ US/EF (agentique)"]
    K -. mises à jour de specs .-> D
    E --> L["DAG / vagues de tâches"]
    J --> L
    L --> M["Contrats de tâche (+ criticité)"]
    M --> N{"Gate : 4 questions"}
    N -- go --> O["Exécution : pair ou délégation"]
    N -- no-go --> M
    O --> R{"design:check (tâches UI)"}
    R -- rouge --> O
    R -- vert --> P["Vérification (humain)"]
    P --> Q["Capitalisation → CLAUDE.md / ADR / DESIGN.md"]
    Q -. harnais enrichi .-> M
```

Le pipeline se lit comme une alternance de régimes : humain (besoin) → agentique (chaîne d'artefacts) → assisté (mockups) → agentique (diff retour, exécution contrainte) → humain (vérification). Chaque transition de régime a son artefact de passage : le besoin, le brief, le mockup gelé, la PR.

**Anti cycle en V.** La chaîne complète ne se déroule pas intégralement avant la première ligne de code. Deux choses se font globalement, une fois, en amont : le harnais (DESIGN.md, ENF, conventions — l'infrastructure anti-libertés) et l'inventaire des routes. Le reste — US → EF → briefs → mockups → exécution — se déroule **par tranche verticale**, sinon le cycle devient un tunnel d'un trimestre avant tout code.

### Table maîtresse des phases

|#|Phase|Régime|Entrées|Sorties|Critère de sortie|
|---|---|---|---|---|---|
|1|Expression de besoin|humain|—|`besoin.md`|Un tiers (ou un agent) peut reformuler le problème sans rien inventer|
|2|Business Analysis|agentique|besoin|`ba.md`|Problème fermé : on sait ce qu'on ne résout pas ; alternatives tranchées|
|3|PRD|agentique|BA|`prd.md`|Périmètre et **non-objectifs** arbitrés ; critères de succès observables|
|4|User Stories|agentique|PRD|`us/US-xxx.md`|Étanches, critères d'acceptation, tranches verticales définies|
|5|Exigences fonctionnelles|agentique|US|`ef/EF-xxx.y.md`|Vérifiables mécaniquement (sinon : redécouper)|
|6|Exigences non fonctionnelles|agentique|BA + PRD|sections de `CLAUDE.md` / `DESIGN.md`|Intégrées au harnais, jamais recopiées par tâche|
|7|Inventaire des vues|agentique|US|`routes.md`|Toutes les routes et **tous les états** listés|
|8|Briefs de vues|agentique|US + EF + inventaire + DESIGN.md|`briefs/V-xx.md`|Préambule commun + états exhaustifs + contraintes de la cible|
|9|Mockups|assisté|briefs|itérations en webapp|Libertés épuisées ; validation visuelle humaine|
|10|Gel|—|mockup validé|`/design/V-xx/` + `fixtures.json`|Référence versionnée, diffable, datée ; régime de conformité fixé ; écriture humaine seulement|
|11|Diff retour|agentique|mockup gelé + US/EF|mises à jour de specs|Aucun écart silencieux entre mockup et specs|
|12|DAG `[greffon]`|agentique|US + EF|`dag.md`|Dépendances explicites ; vagues identifiées ; **exécutant assigné par tâche**|
|13|Contrats de tâche|agentique|US + EF + mockup + DAG|`taches/T-xxx.md`|Critères exécutables + criticité + exécutant + preuves exigées|
|14|Gate `[greffon]`|humain|contrat de tâche|go / no-go|Quatre réponses positives, sans exception ; volet UI 4/4 le cas échéant|
|15|Exécution|agentique|contrat|branches, commits, PR|Critères verts + design:check vert (régime pixel ou structurel) ; écarts déclarés le cas échéant|
|16|Vérification|humain|PR|validation|Ordre spec → tests → diff ; profondeur = f(criticité) ; UI jugée sur pièces|
|17|Capitalisation|agentique + humain|session terminée|CLAUDE.md / ADR / DESIGN.md enrichis|Apprentissages intégrés au harnais|

---

## 4. Les phases en détail

### 4.1 Expression de besoin — _humain_

Le point d'ancrage épistémique du cycle. Contenu attendu : le problème vécu (pas la solution), le contexte d'usage, les contraintes non négociables, et les intuitions de solution — présentes si elles existent, mais explicitement marquées comme intuitions, pas comme exigences. Rédaction manuelle, éventuellement précédée d'une session maïeutique avec un agent (questions, détection d'ambiguïtés, reformulations proposées oralement — le stylo reste humain).

Critère de sortie : un lecteur extérieur peut reformuler le problème sans avoir à inventer. Si l'agent de la phase suivante doit combler des trous pour produire la BA, le besoin retourne en rédaction.

### 4.2 Business Analysis — _agentique_

Draft par agent à partir du besoin : reformulation du problème, acteurs et usages, existant et alternatives — y compris l'alternative « ne rien construire » et « utiliser un outil existant », qui doivent être examinées et tranchées explicitement —, contraintes, risques. Arbitrage humain ligne à ligne : c'est ici que commence le vrai poste de charge humain du cycle, la cohérence inter-artefacts. Un draft plausible mais subtilement à côté du besoin coûte plus cher que pas de draft du tout.

### 4.3 PRD — _agentique_

Le PRD change de statut par rapport à sa version classique : de document d'intention, il devient contrat d'exécution. Trois sections portantes : le périmètre, les **non-objectifs** — aussi contraignants que les objectifs, c'est la première barrière anti-libertés du cycle : ce qui n'est pas dans le périmètre ne doit pas émerger « en bonus » d'une session d'agent —, et les critères de succès observables. Les hypothèses non validées sont listées comme telles.

### 4.4 User Stories — _agentique_

Étanches (une US ne dépend pas de l'implémentation d'une autre pour être comprise), avec critères d'acceptation, identifiées `US-xxx`. Le découpage se fait en tranches verticales livrant chacune un comportement complet de bout en bout — c'est l'unité de déroulement du reste du cycle. Draft par agent depuis le PRD, validation et re-découpage humains.

### 4.5 Exigences fonctionnelles — _agentique, destination : contrat de tâche_

Rattachées aux US (`EF-xxx.y`), elles portent le détail vérifiable du comportement. Règle de découpe, qui vaut critère de qualité : **si on ne peut pas vérifier mécaniquement qu'une EF est satisfaite, elle est mal découpée**. Une EF vérifiable mécaniquement = un test, une commande, une assertion, une comparaison de rendu. Les EF voyagent dans le contrat de tâche (§4.13) : elles sont locales à leur US.

### 4.6 Exigences non fonctionnelles — _agentique, destination : harnais permanent_

Distinction structurelle avec les EF : les ENF sont transversales — budgets de performance, accessibilité, sécurité, conventions de code, contraintes d'architecture (une interdiction actée par ADR — un motif de routage proscrit, par exemple — est une ENF au sens plein). Elles vivent dans le harnais (`CLAUDE.md`, `DESIGN.md`, ADRs), jamais recopiées dans les tâches. Raison : une ENF recopiée dans chaque tâche finit diluée puis ignorée ; une ENF dans le harnais s'applique partout, mécaniquement, à chaque session.

### 4.7 Inventaire des routes et des vues — _agentique_

Table `route → vue → états → US couvertes`, établie globalement avant tout mockup. Raison d'être : les libertés de l'agent se prennent d'abord sur les états — vide, chargement, erreur, données limites — que personne ne spécifie jamais spontanément. L'inventaire force l'exhaustivité des états au moment où elle coûte le moins cher. C'est aussi le document qui révèle les vues implicites (paramètres, onboarding, écrans d'erreur globaux) que les US ne mentionnent pas.

### 4.8 Briefs de vues — _agentique_

L'artefact pivot du cycle : celui qui franchit la frontière entre le monde du repo et le monde de la webapp. Rédigé par un agent à partir des US, EF, de l'inventaire et du DESIGN.md. Trois exigences pour qu'il tienne ce rôle :

1. **Préambule commun**, strictement identique en tête de chaque brief : tokens, inventaire fermé des composants autorisés, règles de layout. C'est la parade au risque structurel de la génération en webapp — la dérive stylistique entre conversations, chaque session repartant de zéro. Dix briefs sans préambule commun produisent dix vues de dix applications différentes.
2. **Contraintes de l'environnement cible** : les artifacts webapp sont du React single-file avec Tailwind core et un jeu de bibliothèques limité. Le brief borne la génération à l'**intersection** de ce qui existe dans les artifacts _et_ dans la stack finale du projet — sinon on valide des mockups intransposables.
3. **Exhaustivité des états** par vue, reprise de l'inventaire : vide, chargement, erreur, nominal avec données réalistes, cas limites. C'est là que les libertés se prenaient ; c'est là que le brief est le plus explicite.

Template complet en annexe A.

### 4.9 Mockups — _assisté (webapp)_

Génération en webapp Claude à partir des briefs, itération conversationnelle jusqu'à épuisement des libertés — c'est l'espace de divergence officiel du cycle. Discipline de session : les vues d'un même flux se génèrent dans la même conversation autant que possible (cohérence stylistique). Niveau de fidélité : **wireframe pour l'intégralité des vues, haute fidélité pour les trois ou quatre vues cœur seulement**. L'intégralité en haute fidélité est le piège du dev solo — coût quadratique, valeur marginale. Le niveau de fidélité de chaque vue est inscrit à l'inventaire (annexe D) : c'est lui qui fixe le régime de conformité au gel (§4.10) — pixel pour la haute fidélité, structurel pour le wireframe.

### 4.10 Gel — rapatriement dans le repo

Après validation visuelle, le mockup est rapatrié dans `/design` du repo : mockup-as-code (HTML ou React statique sans logique), versionné, diffable, daté — **fixtures comprises** : le jeu de données d'exemple du brief (annexe A, §6) est extrait en `fixtures.json` et gelé avec la vue. C'est la condition d'une comparaison déterministe : référence et implémentation rendent le même contenu, sinon le diff mesure des écarts de données, pas de design.

Le gel transforme le mockup en **référence exécutable** — il ferme la boucle de vérification UI qui manquait au cycle — selon deux régimes de conformité, fixés par le niveau de fidélité inscrit à l'inventaire (annexe D) :

- **Régime pixel** (vues haute fidélité) : screenshot Playwright de l'implémentation comparé au rendu de la référence, mêmes fixtures, état par état, viewport par viewport, sous tolérance chiffrée. L'agent itère jusqu'à correspondance.
- **Régime structurel** (vues wireframe) : le diff pixel n'a pas de sens contre un wireframe — il échouerait toujours, ou forcerait l'implémentation à ressembler à un wireframe. La conformité se vérifie par assertions : zones et hiérarchie du brief présentes, composants pris exclusivement dans l'inventaire fermé, tous les états de l'inventaire atteignables, styles exclusivement issus des tokens (lint, §5).

Les deux régimes aboutissent au même statut : l'UI a un critère d'acceptation mécanique, exécutable par l'agent seul (`design:check`, annexe F).

**Intégrité de la référence.** Gelée, la référence est en écriture humaine seulement — `/design` comme `/tools/design-check`, tolérances comprises. Raison : le contournement le plus économique d'une vérification est de modifier la vérification ; un agent bloqué sur un diff rouge « corrigera » la baseline avant son code si rien ne l'en empêche. Mise en œuvre mécanique, pas déclarative : hook refusant l'écriture sur ces chemins (§5), contrôle CI qu'aucune PR de feature ne les touche. La référence n'évolue que par deux circuits : nouveau gel après itération en webapp, ou mise à jour arbitrée issue du diff retour (§4.11).

### 4.11 Diff retour mockup ↔ specs — _agentique_

Le point de discipline qui décide si le système tient dans la durée. L'itération visuelle fait émerger des choses que les US n'avaient pas prévues — un filtre nécessaire, un champ manquant, une navigation repensée. Si ces découvertes restent dans le mockup, les specs divergent silencieusement : le mockup devient source de vérité de facto pendant que les US pourrissent. Après chaque gel, un agent diffe le mockup contre les US/EF concernées et propose les mises à jour de specs correspondantes ; arbitrage humain. Chaque écart entre l'intention et le rendu laisse une trace remontante — c'est le réflexe provenance appliqué au design.

### 4.12 Planification — DAG et vagues `[greffon]`

Entre le découpage et l'exécution, un artefact explicite de planification : identifier les dépendances entre US/tâches pour constituer un graphe acyclique, puis regrouper les tâches indépendantes en **vagues** parallélisables. C'est ce qui justifie l'infrastructure de parallélisation (worktrees) : sans DAG, la parallélisation est un pari ; avec, c'est une lecture. S'y ajoute l'assignation de **topologie** : pour chaque tâche, un exécutant — sous-agent nommé de l'inventaire (§5, annexe H), ou session principale pour les seules activités d'orchestration et d'arbitrage. Règles d'assignation : contexte isolé par défaut pour toute tâche de production (une tâche = un contexte, §4.15) ; sous-agents auxiliaires pour ce qui consomme du contexte sans en produire pour la suite — exploration de codebase, extraction, vérification ; worktrees pour les vagues à tâches indépendantes. Artefact minimal : une table `tâche | dépend de | vague | exécutant` (annexe E).

### 4.13 Contrats de tâche

Le package que reçoit l'agent d'exécution, autosuffisant : US + EF concernées, mockup de référence gelé, critères d'acceptation exécutables, pointeurs vers les sections pertinentes du harnais, et un champ **criticité** `[greffon]` — basse / moyenne / haute. Auth, données, migrations, paiements, tout ce qui touche à l'intégrité ou à la sécurité : criticité haute par défaut. La criticité détermine mécaniquement deux choses en aval : le mode d'exécution (§4.15) et la profondeur de revue (§4.16). Le contrat porte aussi son **exécutant**, hérité du DAG (§4.12) : c'est ce champ qui rend la topologie opposable au gate — une tâche sans exécutant assigné ne se lance pas. Deux ajouts pour toute tâche référençant un mockup gelé, **quelle que soit la criticité** : un critère `design:check` exécutable — la conformité design est un invariant, pas une variable modulée par le risque — et une section **preuves exigées** : extraction restituée, rapport design:check, captures côte à côte (§4.15). Template en annexe B.

### 4.14 Gate — les quatre questions `[greffon]`

Avant tout lancement d'agent, quatre questions, toutes exigeant une réponse positive :

1. L'objectif attribué à l'agent est-il explicite et sans ambiguïté ?
2. Les contraintes techniques et critères d'acceptation sont-ils formalisés ?
3. L'agent dispose-t-il des outils pour implémenter, tester et corriger de manière autonome ?
4. Suis-je en mesure d'expliquer, d'évaluer et de valider la solution finale ?

Les questions 1–2 auditent le contrat de tâche, la question 3 audite le harnais, la question 4 audite la dette de compréhension. Une réponse négative renvoie en amont — elle ne se contourne pas en « surveillant de plus près ».

**Volet UI du gate.** Pour toute tâche référençant un mockup gelé, la question 3 se décline en quatre sous-vérifications, toutes bloquantes : (a) référence présente dans `/design`, datée, fixtures incluses ; (b) régime de conformité fixé à l'inventaire ; (c) `design:check` opérationnel sur la vue — exécutable par l'agent, tolérances définies ; (d) protections d'intégrité actives (hook, CI). Une seule case vide : no-go. Lancer quand même « en demandant à l'agent de faire attention au design » est exactement l'incantation que le cycle proscrit (§1) — c'est le scénario type de l'UI générique livrée avec aplomb.

### 4.15 Exécution — deux modes

**Pair** (interactif, présence continue) : pour l'exploratoire, le cœur du système, toute tâche de criticité haute. **Délégation** (plan proposé par l'agent → validé → autonomie avec checkpoints) : pour la criticité basse et le répétitif. Mécanique commune : branches ou worktrees jetables par vague, commits atomiques fréquents comme points de restauration, boucle UI screenshot ↔ mockup gelé jusqu'à correspondance. Le mode n'est jamais choisi à l'humeur : il découle de la criticité inscrite au contrat.

**Topologie d'exécution.** Trois rôles, à ne jamais confondre dans une même fenêtre de contexte :

- **L'orchestrateur** (session principale) lit le DAG et les contrats, prépare l'environnement (branches, worktrees), lance les exécutants via les commandes du harnais, collecte les preuves, tient le journal de vague. **Il ne code pas** — en délégation ; en mode pair, la session de pair est elle-même l'exécutant, ouverte pour un contrat et close avec lui. Une session principale qui se met à produire du feature code est le signal que la topologie a cédé — c'est le prélude mécanique au monolithisme (§6).
- **Les exécutants** (sous-agents nommés, définis dans le repo — §5, annexe H) reçoivent chacun un contrat, dans un contexte neuf. Règle : **une tâche = un contexte**, jamais d'enchaînement de contrats dans une même session — la saturation de contexte est le mécanisme commun de la dilution des contraintes et de la dégradation de fin de course.
- **Les auxiliaires** : exploration, extraction (protocole UI, temps 1), vérification — tout ce qui consomme du contexte sans en produire pour la suite part en sous-agent ; seul le résultat remonte.

L'invocation n'est pas laissée au jugement de l'agent en cours de route : elle passe par les commandes du harnais (`/executer T-xxx`, §5), qui lisent le contrat et lancent l'exécutant assigné. Demander en prose « utilise des sous-agents » relève du déclaratif (§1) ; une commande qui dispatche est un mécanisme.

**Protocole UI.** Toute tâche portant sur une vue gelée suit quatre temps ordonnés :

1. **Extraction — la lecture prouvée.** Un pointeur n'est pas une lecture : citer `/design/V-xx` dans un contrat ne garantit ni que le fichier soit ouvert, ni qu'il soit compris. Premier livrable, avant toute ligne de code : une restitution de la référence — zones, composants (tous de l'inventaire), tokens, états couverts — confrontée au brief. Une erreur de lecture se paie ici un paragraphe, pas une implémentation. En délégation, c'est le checkpoint n° 1.
2. **Squelette statique conforme.** Premier code : la vue sans logique, rendue avec les fixtures, design:check vert. La conformité s'établit avant que la logique ne rende le rendu coûteux à corriger.
3. **Logique**, design:check maintenu vert.
4. **Preuves.** La PR embarque le rapport design:check (code retour, écarts chiffrés) et les captures côte à côte par état. La conformité se constate sur pièces, jamais sur déclaration — « ça correspond au mockup » sans rapport joint est un critère non rempli.

**Protocole d'écart.** Si la référence s'avère inimplémentable en l'état — contrainte technique, incohérence découverte avec une spec —, l'agent **s'arrête et déclare** : entrée ÉCART (annexe G) rattachée au contrat, arbitrage humain, puis mise à jour de la référence par le circuit officiel ou amendement du contrat. La déviation légitime ayant un guichet, la liberté silencieuse n'a plus d'excuse : tout écart non déclaré vaut échec de la tâche, quelle que soit la qualité du code livré.

### 4.16 Vérification — _humain_

Le nouveau goulot du cycle, assumé comme tel. Ordre de revue strict : d'abord la conformité à la spec, ensuite l'honnêteté des tests — un agent sait écrire des tests qui valident son propre bug ; les tests se lisent comme du code suspect, pas comme des preuves —, enfin seulement le diff. Pour l'UI, la conformité se juge sur pièces — rapport design:check et captures joints à la PR (§4.15) —, jamais sur la déclaration de l'agent. **La profondeur de revue est fixée par la criticité inscrite au contrat, jamais par le track record récent de l'agent** : c'est la parade au cognitive drift `[greffon]` — la dérive naît des séries de succès, la confiance ne se capitalise pas entre tâches. Question de clôture de session : est-ce que je comprends encore ce système ? Une réponse hésitante déclenche une session de relecture sans production.

### 4.17 Capitalisation

Chaque session produit des apprentissages — erreurs récurrentes de l'agent, ambiguïtés de spec révélées, pièges d'environnement. Ils remontent dans le harnais : `CLAUDE.md` (pièges, conventions), ADRs (décisions), `DESIGN.md` (patterns UI). C'est le cycle de maturation appliqué au code : généré = brut/exploité, relu et documenté = capitalisé, extrait en pattern ou template = réutilisé. La boucle est fermée quand les échecs de l'agent améliorent la doc du repo — c'est-à-dire quand le harnais est _stateful_ là où chaque session d'agent est stateless.

---

## 5. Le harnais permanent

Le harnais est tout ce qui contraint l'agent sans figurer dans la tâche : la phase du cycle qui n'existait pas avant. Structure type du repo :

```
/.claude/
  agents/               — inventaire d'exécutants nommés (annexe H) : mission, outils, sorties exigées
  commands/             — protocoles mécanisés : /executer, /verifier, /geler…
  settings.json         — hooks : protections d'écriture, design:check à la clôture
/CLAUDE.md              — conventions, commandes, ENF, pièges connus, boucles de vérification
/docs/
  adr/                  — décisions d'architecture (contraintes lisibles par l'agent)
  specs/
    besoin.md
    ba.md
    prd.md
    us/                 — US-xxx.md
    ef/                 — EF-xxx.y.md
    routes.md           — inventaire routes / vues / états
    briefs/             — V-xx.md (briefs de vues)
    dag.md              — dépendances et vagues
    taches/             — T-xxx.md (contrats de tâche)
    ecarts/             — ECART-xxx.md (déviations déclarées, annexe G)
  design/
    DESIGN.md           — tokens, composants autorisés, règles de layout
/design/                — mockups gelés (V-xx/ + fixtures.json, datés) — écriture humaine seulement
/tools/
  design-check/         — comparaison implémentation ↔ référence (annexe F) — écriture humaine seulement
```

Rôles des pièces maîtresses :

- **CLAUDE.md** — le contrat permanent de l'agent : commandes de build et de test, conventions, ENF, pièges connus du projet. S'enrichit à chaque capitalisation ; c'est le document dont la qualité conditionne directement celle de la délégation.
- **ADRs** — seconde vie en contexte agentique : de traces de décision pour soi-futur, ils deviennent des contraintes actives lisibles par l'agent. Un ADR proscrivant un motif d'architecture, lu par l'agent à chaque session, devient la garantie mécanique que ce motif ne sera jamais proposé.
- **DESIGN.md** — le système de design comme contrainte : tokens, inventaire fermé de composants, règles de layout. Transforme la génération d'UI en assemblage contraint — l'agent ne dessine plus, il compose. Investissement unique, effet sur toutes les vues : le levier le plus rentable du cycle.
- **Boucles de vérification rapides** — tests, vet, typecheck, linters, comparaison de rendu : tout ce que l'agent exécute seul, sans attendre l'humain. La qualité de la délégation est proportionnelle à la vitesse de ces boucles.
- **/design** — les mockups gelés comme références exécutables (§4.10).
- **design:check** — la commande unique de conformité UI (annexe F) : rend chaque état d'une vue avec ses fixtures, capture par viewport, compare selon le régime — diff pixel sous tolérance ou assertions structurelles —, sort un code retour et un rapport. Exécutable par l'agent seul : c'est ce qui la rend opposable à la question 3 du gate.
- **Lint d'inventaire et de tokens** — la contrainte au moment de l'écriture, pas seulement après : imports de composants restreints à l'inventaire fermé (règle ESLint), palette Tailwind réduite aux tokens, valeurs arbitraires et styles inline proscrits. Une classe hors design system casse la boucle de l'agent lui-même : le générique est arrêté à la frappe, pas détecté au rendu.
- **Hooks d'environnement** — l'application du harnais que le contexte ne peut pas diluer : refus d'écriture sur `/design` et `/tools/design-check` (hook pre-tool-use ou règles de permission), design:check rejoué à la clôture de tâche sur toutes les vues gelées touchées, clôture refusée si rouge (hook de fin de tâche). Le hook fait ce que la consigne ne sait pas faire : il s'applique au quatre-centième tour de contexte comme au premier.
- **CI de non-régression visuelle** — design:check sur l'ensemble des vues gelées à chaque PR, pas seulement celle de la tâche : une tâche de vague 3 peut défaire la conformité d'une vue validée en vague 1. Les références gelées forment la baseline de régression visuelle du projet.
- **Inventaire d'exécutants** (`.claude/agents/`) — le pendant côté exécution de l'inventaire fermé de composants : des agents nommés, versionnés, à mission bornée (exécuteur-vue, exécuteur-back, extracteur, vérificateur…), chacun avec ses outils autorisés et ses sorties exigées (annexe H). « Lance un agent » cesse d'être un vœu quand les agents existent comme fichiers du repo et que l'orchestrateur compose depuis l'inventaire au lieu d'improviser. Détail d'outillage qui compte : c'est le champ *description* de la fiche qui déclenche l'auto-délégation — une fiche sans description opérationnelle est un agent qui ne sera jamais invoqué spontanément.
- **Commandes de dispatch** (`.claude/commands/`) — les protocoles du cycle mécanisés en slash-commands : `/executer T-xxx` (lit le contrat, vérifie le gate, lance l'exécutant assigné dans un contexte neuf), `/verifier T-xxx` (collecte les preuves, rejoue design:check). La commande est au protocole ce que le lint est au style : l'exécution de la règle, pas son rappel.

La philosophie plain-text rend le harnais quasi gratuit : le repo est déjà intégralement lisible par l'agent, sans couche d'extraction.

### Défense en profondeur — conformité design

Aucune couche n'est fiable seule — une consigne se dilue, une lecture se saute, un check se contourne. C'est leur redondance qui fait le garde-fou : pour livrer une UI non conforme, il faudrait franchir sept couches, chacune couvrant un mode de défaillance observé.

|Couche|Mécanisme|Défaillance couverte|
|---|---|---|
|Contrat|référence + critère design:check + preuves exigées (§4.13)|contrainte absente de la tâche|
|Gate|volet UI 4/4 (§4.14)|lancement sans boucle de vérification opérante|
|Lecture|extraction restituée avant code (§4.15)|référence citée mais jamais ouverte — « pas vue »|
|Écriture|lint inventaire + tokens, bloquant|composants inventés, styles hors design system|
|Vérification|design:check par état, pixel ou structurel (§4.10, annexe F)|écart de rendu non détecté|
|Clôture|hook / CI : ni fin de tâche ni merge en rouge|conformité auto-déclarée|
|Intégrité|`/design` et `/tools` en écriture humaine (§4.10)|vérification contournée par modification de la référence|

Le protocole d'écart (§4.15) est la huitième couche — pas une barrière, une soupape : la déviation a un chemin légitime, ce qui rend la déviation silencieuse indéfendable.

---

## 6. Gouvernance des risques

**Auto-audit par la matrice autonomie × maîtrise** `[greffon]`. Quatre quadrants — vibe coder (autonomie sans maîtrise), micro-dev chaotique (ni l'une ni l'autre), micro-dev expérimenté (maîtrise sans autonomie déléguée), agentic engineer (les deux). La matrice ne sert pas à se classer une fois : elle sert à détecter la trajectoire d'érosion. Signaux d'alerte, à vérifier périodiquement :

- je ne relis plus vraiment les diffs de criticité haute ;
- je ne saurais pas réexpliquer tel module sans le rouvrir ;
- la profondeur de revue a baissé « parce que ça marchait » ;
- les specs n'ont pas bougé depuis plusieurs sessions alors que le code, si.

Deux signaux ou plus : redescendre d'un cran d'autonomie (repasser en pair sur les tâches en cours) le temps de reconstruire la maîtrise.

**Modulation autonomie / criticité** `[greffon]`. L'autonomie accordée n'est pas une préférence de confort mais une fonction du risque : incertitude ou criticité élevées → mode pair, découpage plus fin, validation par étape ; tâches répétitives à faible enjeu → délégation large. La règle est inscrite au contrat de tâche pour ne pas être renégociée à chaud.

**Anti cognitive drift** `[greffon]`. Le mécanisme de la dérive : l'agent réussit plusieurs tâches d'affilée, la vigilance se relâche, l'erreur critique arrive sur le composant sensible. Parade structurelle déjà posée en §4.16 : profondeur de revue = f(criticité), jamais f(track record). S'ajoute une règle de non-transfert : la confiance acquise sur un type de tâche ne s'étend pas à un autre type.

**Contournement de la vérification.** Symétrique instrumental du cognitive drift : sous la pression d'un critère rouge, la voie de moindre résistance n'est pas de corriger le code mais le critère — baseline retouchée, tolérance élargie, test affaibli, cas supprimé. Parade structurelle, jamais incantatoire : références, fixtures, tolérances et outillage de vérification hors du périmètre d'écriture de l'agent (§4.10, §5) ; toute PR de feature touchant ces chemins est un signal d'audit immédiat. La règle dépasse l'UI : l'agent ne modifie jamais l'instrument qui le mesure.

**Monolithisme de session.** Les deux incidents fondateurs de cette note ont une cause commune : tout faire dans une session unique. Le contexte sature, les instructions amont se diluent (la référence design « pas vue »), la qualité s'effondre dans les derniers tours (les finitions bâclées). Parades structurelles : une tâche = un contexte (§4.15) ; topologie assignée par artefact (§4.12–4.13), jamais par jugement à chaud ; auxiliaires systématiquement externalisés en sous-agents ; et **budget de session** — au-delà d'un seuil de tours ou de volume (§8), la session se clôt sur un commit propre et un état de reprise pour un contexte neuf, jamais sur « encore une dernière chose ».

**Dette de compréhension.** Le risque de fond, propre au dev solo : le système peut fonctionner tout en devenant opaque à son propre mainteneur. Les parades sont réparties dans le cycle — question 4 du gate en amont, question de clôture en aval, specs et ADRs comme mémoire externe en continu. L'indicateur honnête : le temps nécessaire pour localiser où se ferait une modification donnée, sans agent.

---

## 7. Traçabilité

Chaîne d'identifiants de bout en bout, permettant de reconstituer pourquoi une vue ou un comportement est ce qu'il est :

```
besoin → ba.md §n → prd.md §n → US-042 → EF-042.3 → V-07 (brief) → /design/V-07 (gel 2026-xx-xx) → T-113 → PR / commits (+ rapport design:check archivé)
```

Convention de commit portant la trace : `feat(V-07): filtre par kind [US-042][EF-042.3]`. Le diff retour (§4.11) garantit que la chaîne reste vraie dans les deux sens : toute découverte aval remonte modifier l'amont, avec trace. C'est une logique de provenance appliquée au cycle de développement : chaque élément du système doit pouvoir dire d'où il vient.

---

## 8. Conditions de validité et limites

**Domaine de validité.** Cycle conçu pour du greenfield solo à specs ouvertes. Un premier projet pilote — cas d'école du spec-first (spec fonctionnelle → design → stack) — servira à calibrer les seuils avant généralisation, notamment au brownfield (où le harnais existe partiellement et où la chaîne amont est à reconstituer a posteriori).

**Non-transposition institutionnelle.** Le cadre ne se transpose pas tel quel en contexte institutionnel (administration, environnements régulés) : la lenteur des spécifications en environnement public ne relève pas de comités dysfonctionnels mais d'exigences structurelles — auditabilité, sécurité, commande publique, responsabilité. En revanche, le sous-ensemble spec / ADR / documentation de repo est transposable même sans agent, et vaut par lui-même.

**Provenance et limites des greffons.** Les quatre éléments marqués `[greffon]` (DAG, criticité, gate, matrice/anti-drift) proviennent de la masterclass Mike Codeur. Leur contexte d'origine est le clonage de SaaS existants sur boilerplate maîtrisé — un cas où la spec est pré-résolue par le marché, le produit de référence _étant_ la spec, ce qui explique l'essentiel des métriques annoncées. Le présent cycle couvre précisément ce que ce contexte contourne : l'amont (besoin, BA, maïeutique), l'UI comme problème de sous-détermination, la capitalisation stateful. Les greffons sont retenus pour leur valeur structurelle, pas pour leurs promesses de débit.

**Points ouverts, à trancher sur le pilote :**

1. Granularité réelle des contrats de tâche (taille moyenne d'une tâche agent-sized en pratique).
2. Coût effectif du diff retour mockup ↔ specs — soutenable à chaque gel, ou par lot ?
3. Seuils de criticité : la liste « haute par défaut » est-elle complète pour le projet pilote ?
4. Tenue du préambule commun dans la durée (dérive stylistique résiduelle entre conversations webapp).
5. Calibration du régime pixel : seuil de diff (valeur de départ : 1 % de pixels divergents), masques des zones volatiles, jeu de viewports — le double régime (§4.10) évacue le cas wireframe, restent les tolérances haute fidélité.
6. Charge réelle de la vérification humaine par vague — le goulot assumé est-il tenable au rythme visé ?
7. Coût d'entretien du mode démo (route `/__design`) et du lint d'inventaire — notamment les faux positifs sur composants composites.
8. Seuil de déclenchement du protocole d'écart : trop bas, du bruit ; trop haut, le retour des libertés silencieuses.
9. Granularité de l'inventaire d'exécutants : combien d'agents nommés avant que l'inventaire ne devienne lui-même de la dette ?
10. Coût de l'isolation : ce qu'un sous-agent perd sans le contexte de la session, à mesurer contre ce que la session perd en saturation.
11. Seuil du budget de session (tours / volume) déclenchant la clôture forcée avec état de reprise.

---

## 9. Annexes — templates

### A. Template — brief de vue

```markdown
# Brief de vue — V-xx <nom>

## 0. Préambule commun (identique pour toutes les vues — ne pas modifier localement)
- Tokens : <couleurs, typo, espacements — extrait DESIGN.md>
- Composants autorisés : <inventaire fermé>
- Règles de layout : <grille, densité, breakpoints>
- Environnement cible : React single-file, Tailwind core uniquement,
  bibliothèques autorisées : <intersection artifacts ∩ stack finale>
- Interdits : <libs hors liste, styles arbitraires, composants inventés>

## 1. Identité
- Route : /…
- US couvertes : US-…
- EF concernées : EF-…
- Fidélité : wireframe | HF → régime de conformité au gel : structurel | pixel

## 2. Objet de la vue
<une phrase : ce que l'utilisateur accomplit ici>

## 3. Structure
<zones, hiérarchie, navigation entrante et sortante>

## 4. États (exhaustif — critère de complétude du brief)
- Vide : …
- Chargement : …
- Erreur : …
- Nominal : … (avec les données d'exemple du §6)
- Limites : listes longues, textes longs, permissions restreintes…

## 5. Interactions
<actions, retours, validations, raccourcis>

## 6. Données d'exemple
<jeu réaliste fourni dans le brief — jamais laissé à l'invention ;
gelé en fixtures.json avec le mockup (§4.10)>

## 7. Hors périmètre de cette vue
<ce que le mockup ne doit PAS inventer>
```

### B. Template — contrat de tâche

```markdown
# Tâche T-xxx — <titre>

- US : US-xxx — EF : EF-xxx.a, EF-xxx.b
- Mockup de référence : /design/V-xx (gelé le <date>) — régime : pixel | structurel
- Criticité : basse | moyenne | haute → mode : délégation | pair
  (la conformité design n'est pas modulée par la criticité : invariant)
- Exécutant : <agent de l'inventaire — annexe H> — vague n, worktree oui | non
- Critères d'acceptation exécutables :
  - [ ] `<commande>` → <résultat attendu>
  - [ ] `design:check V-xx --states=all` → exit 0
- Preuves exigées dans la PR :
  - [ ] extraction (lecture restituée de la référence, confrontée au brief)
  - [ ] rapport design:check + captures côte à côte par état
- Pointeurs harnais : CLAUDE.md §…, DESIGN.md §…, ADR-…
- Gate (annexe C) : passée le <date> — go (volet UI : 4/4)
- Checkpoints (si délégation) : 1. extraction — 2. squelette statique conforme — 3. <suite>
- Écarts : — (tout écart non déclaré vaut échec de la tâche — annexe G)
```

### C. Gate — checklist de lancement

```markdown
- [ ] 1. Objectif explicite et sans ambiguïté
- [ ] 2. Contraintes et critères d'acceptation formalisés
- [ ] 3. Outils disponibles pour implémenter, tester, corriger en autonomie
- [ ] 4. Capacité à expliquer, évaluer et valider le résultat
→ 4/4 requis. Toute case vide renvoie en amont (contrat, harnais ou compréhension).

Volet UI — si la tâche référence un mockup gelé (décline la question 3) :
- [ ] 3a. Référence présente dans /design, datée, fixtures incluses
- [ ] 3b. Régime de conformité fixé à l'inventaire (pixel | structurel)
- [ ] 3c. design:check opérationnel sur la vue (exécutable par l'agent, tolérances définies)
- [ ] 3d. Protections d'intégrité actives (hook /design + /tools, CI)
→ 4/4 requis également. Une case vide = no-go — sans compensation par « surveillance accrue ».

Volet topologie — toute tâche :
- [ ] 3e. Exécutant assigné au contrat, présent dans /.claude/agents
- [ ] 3f. Lancement en contexte neuf via /executer ; worktree prêt si vague parallèle
→ Une session unique qui « fera tout » n'est pas une topologie : c'est l'absence de décision.
```

### D. Inventaire des routes — table type

```markdown
| Route | Vue | Fidélité (régime) | États attendus | US couvertes |
|---|---|---|---|---|
| /ressources | V-01 liste | wireframe (structurel) | vide, chargement, erreur, nominal, liste longue | US-010, US-011 |
| /ressources/:id | V-02 détail | HF (pixel) | chargement, erreur, nominal, ressource introuvable | US-012 |
| … | … | … | … | … |
```

### E. DAG — table type

```markdown
| Tâche | Dépend de | Vague | Exécutant |
|---|---|---|---|
| T-101 | — | 1 | exécuteur-vue (worktree A) |
| T-102 | — | 1 | exécuteur-back (worktree B) |
| T-103 | T-101 | 2 | exécuteur-vue |
| … | … | … | … |
```

### F. design:check — spécification minimale

```markdown
Entrée : V-xx [--states=all|liste] [--viewports=liste]
Préconditions : /design/V-xx/ (référence + fixtures.json) ;
mode démo de l'implémentation rendant chaque état avec les fixtures
(route /__design/V-xx?state=…, builds de développement uniquement)

Régime pixel (vues HF) :
1. rendu référence et implémentation — mêmes fixtures, mêmes viewports
2. capture Playwright par état × viewport
3. diff (pixelmatch / odiff), masques déclarés sur zones volatiles
   (curseurs, horodatages, animations)
4. verdict : ratio de pixels divergents ≤ seuil (§8 — départ : 1 %)

Régime structurel (vues wireframe) :
1. rendu de l'implémentation avec fixtures, état par état
2. assertions DOM : zones du brief présentes, hiérarchie respectée,
   composants ∈ inventaire fermé, chaque état de l'inventaire atteignable
3. lint tokens sur les fichiers de la vue (aucune valeur hors design system)
4. verdict : assertions vertes + lint propre

Sortie : code retour 0/1 ; rapport machine (écarts chiffrés) ;
captures côte à côte par état, archivées avec la PR
Écriture humaine seulement sur /tools/design-check (tolérances comprises)
```

### G. Template — entrée ÉCART

```markdown
# ÉCART-xxx — T-xxx / V-xx — <date>
- Nature : <ce qui ne peut pas être implémenté conforme, précisément>
- Cause : contrainte technique | incohérence référence ↔ spec | autre
- Alternative proposée : <…>
- Arbitrage : <date> — référence mise à jour (nouveau gel) | contrat amendé | écart rejeté
- Trace : <lien diff retour / commit>
```

### H. Template — fiche d'exécutant (`.claude/agents/<nom>.md`)

```markdown
# <nom> — ex. exécuteur-vue
- Description (déclenche l'auto-délégation — opérationnelle, pas décorative) :
  <quand m'invoquer, sur quel type de contrat>
- Mission (une phrase) : implémenter une vue depuis son contrat,
  protocole UI compris (§4.15)
- Entrées attendues : taches/T-xxx.md + pointeurs harnais du contrat
- Outils autorisés : <liste fermée — lecture, édition /src, design:check, tests>
- Interdits : écriture hors périmètre du contrat, /design, /tools, /docs/specs
- Sorties exigées : branche + commits atomiques, preuves (§4.15, temps 4),
  entrée ÉCART le cas échéant (annexe G)
- Clôture : critères du contrat verts + design:check vert, sinon échec déclaré
```

---

## Sources

- Conversation Claude, 2026-08-14 — construction du cycle (régimes, chaîne d'artefacts, briefs, gel, diff retour, harnais, vérification, capitalisation).
- Conversation Claude, 2026-08-16 — renforcement des gardes-fous de conformité design, sur retour d'incident (référence design ignorée par l'agent d'exécution malgré sa mention).
- Conversation Claude, 2026-08-16 — topologie d'exécution et orchestration, sur second incident (exécution monolithique en session unique malgré la consigne d'usage des features agentiques).
- Mike Codeur, _Agentic Engineering : la Masterclass Complète_, YouTube — https://www.youtube.com/watch?v=WCufvACxXVU — via note de synthèse intermédiaire. Éléments retenus : DAG, criticité, gate des 4 questions, matrice autonomie × maîtrise et anti-drift.