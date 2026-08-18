# Plan de réalisation agentique

**Produit** : Codicillus — plateforme de gestion des connaissances documentaires
**Documents sources** : `CAHIER-DES-CHARGES-FONCTIONNEL.md`, `BRIEF-VUES.md`, `STACK-TECHNIQUE.md`, `mockups/` (41 vues + `socle.css`), `guide/workflow_agentic.md`
**Version du document** : 1.0
**Date** : 16 août 2026
**Statut** : proposition soumise à arbitrage — aucune ligne de code n'est engagée avant validation

---

## Avertissement de périmètre

Les trois documents de cadrage existants disent **ce que le produit doit faire** (cahier des charges), **comment il doit se présenter** (brief des vues et maquettes), et **avec quoi il est fait** (pile technique). Celui-ci dit **comment il est fabriqué** : dans quel ordre, par qui — humain ou agent —, sous quelles contraintes, et à quelle condition une tâche est déclarée faite.

Il leur est **subordonné**. L'ordre de préséance de la pile technique est prolongé d'un cran :

```
Maquettes  >  Cahier des charges  >  Brief des vues  >  Pile technique  >  Plan de réalisation
```

Trois règles en découlent, et elles ne souffrent aucune exception :

**Règle de non-comblement.** Un agent qui rencontre un vide — un comportement non spécifié, un état non maquetté, une règle ambiguë — ne le comble pas. Il s'arrête et remonte. Toute décision fonctionnelle ou graphique prise pendant l'exécution est un **défaut de contrat de tâche**, pas une initiative. C'est l'application directe du principe du guide : quand un agent prend des libertés, ce n'est pas une faute de l'agent, c'est un vide de contrainte.

**Règle de subordination.** Aucune difficulté de réalisation ne justifie une entorse au fonctionnel ou aux maquettes. Une difficulté remonte comme demande d'arbitrage, jamais comme adaptation silencieuse.

**Règle d'immutabilité des sources.** `cadrage/`, `mockups/` et `guide/` ne sont **jamais** modifiés par un agent d'exécution. Ils changent par arbitrage humain explicite, tracé. Le harnais applique cette règle mécaniquement (§3.5).

**Provenance méthodologique.** Ce plan est l'application de `guide/workflow_agentic.md` v1, note explicitement non éprouvée, qui annonce un projet pilote destiné à la calibrer. **Codicillus est ce pilote.** Les six points ouverts du guide sont tranchés ici à titre d'hypothèses de travail, et §14 précise à quoi on mesurera qu'ils l'ont été correctement.

**Vérification de l'outillage.** Toutes les capacités d'orchestration citées en §7 ont été vérifiées le **16 août 2026** auprès de la documentation officielle de Claude Code, et non de mémoire. La méthode et les constats figurent en §13.

---

## Sommaire

1. [Où en est le projet dans le cycle](#1-où-en-est-le-projet-dans-le-cycle)
2. [Les trois régimes appliqués à Codicillus](#2-les-trois-régimes-appliqués-à-codicillus)
3. [Le harnais permanent](#3-le-harnais-permanent)
4. [La boucle d'acceptation visuelle](#4-la-boucle-dacceptation-visuelle)
5. [Le catalogue des critères exécutables](#5-le-catalogue-des-critères-exécutables)
6. [Découpage : lots, dépendances, vagues](#6-découpage--lots-dépendances-vagues)
7. [L'orchestration agentique](#7-lorchestration-agentique)
8. [La gate — les quatre questions instanciées](#8-la-gate--les-quatre-questions-instanciées)
9. [La vérification](#9-la-vérification)
10. [La capitalisation](#10-la-capitalisation)
11. [Le diff retour maquettes ↔ specs](#11-le-diff-retour-maquettes--specs)
12. [Risques propres à la réalisation agentique](#12-risques-propres-à-la-réalisation-agentique)
13. [Méthode de vérification des capacités d'outillage](#13-méthode-de-vérification-des-capacités-doutillage)
14. [Les six points ouverts du guide, tranchés pour le pilote](#14-les-six-points-ouverts-du-guide-tranchés-pour-le-pilote)
15. [Décisions rendues et arbitrages ouverts](#15-décisions-rendues-et-arbitrages-ouverts)
16. [Annexes — templates et configurations de référence](#16-annexes--templates-et-configurations-de-référence)

---

## 1. Où en est le projet dans le cycle

### 1.1 Correspondance entre le cycle du guide et l'état du dépôt

Le guide décrit dix-sept phases. Le projet en a franchi la majeure partie, mais sous une forme condensée : le cahier des charges absorbe à lui seul quatre phases du cycle. Cette table établit la correspondance, parce qu'aucun contrat de tâche ne peut être écrit sans savoir où lire l'exigence qu'il sert.

| # | Phase du guide | Artefact attendu | Où il se trouve dans ce projet | État |
|---|---|---|---|---|
| 1 | Expression de besoin | `besoin.md` | Hors dépôt (amont humain) | Absorbé par le CDC §1 |
| 2 | Business Analysis | `ba.md` | CDC §1 (vision, problèmes, différenciateur, indicateur nord) | **Fait** |
| 3 | PRD | `prd.md` | CDC §1, §28 (principes non négociables), §Hors périmètre | **Fait** |
| 4 | User Stories | `us/US-xxx.md` | CDC, cas d'usage `UC-Mxx-yy` + parcours `PU-01` à `PU-06` | **Fait**, sous une autre nomenclature |
| 5 | Exigences fonctionnelles | `ef/EF-xxx.y.md` | CDC, règles de gestion `RG-…` | **Fait**, mais toutes ne sont pas mécaniquement vérifiables en l'état → §5 |
| 6 | Exigences non fonctionnelles | Sections de harnais | CDC §25, §28 (P-01 à P-10) ; STACK §5 | Rédigées, **pas encore dans le harnais** |
| 7 | Inventaire des routes et des vues | `routes.md` | CDC §4 et BRIEF §Récapitulatif : 41 vues, sans la table des adresses | **Partiel** — la colonne « route » manque |
| 8 | Briefs de vues | `briefs/V-xx.md` | `BRIEF-VUES.md`, une section par vue, trame constante | **Fait** |
| 9 | Mockups | Itérations | 40 vues + `socle.css` | **Fait** |
| 10 | Gel | `/design/V-xx/`, daté, versionné | `mockups/` — **non versionné, non daté** | **À régulariser** (§3.1) |
| 11 | Diff retour mockup ↔ specs | Mises à jour de specs | — | **Jamais fait** → §11 |
| 12 | DAG et vagues | `dag.md` | — | **Ce document, §6** |
| 13 | Contrats de tâche | `taches/T-xxx.md` | — | **Ce document, §6.3 et annexe A** |
| 14 | Gate | Checklist | — | **Ce document, §8** |
| 15 | Exécution | Branches, commits | — | À lancer |
| 16 | Vérification | Validation humaine | — | **Ce document, §9** |
| 17 | Capitalisation | Harnais enrichi | — | **Ce document, §10** |

### 1.2 Les sept manques à combler avant la première ligne de code

1. ~~**Le dépôt n'est pas sous git.**~~ **Levé le 16 août 2026** (commit `c0475ae`). Le dépôt manquait totalement de contrôle de version : les maquettes — source de vérité du produit — n'étaient ni versionnées, ni datées, ni diffables ; il n'existait aucun point de restauration ; worktrees, convention de commit porteuse de traçabilité, revue outillée et retour arrière étaient tous indisponibles. Le premier commit **constitue le gel** au sens de la phase 10 du guide. Reste à produire `mockups/GEL.md` (T-001) et à décider de l'hébergement (§15, point 1).
2. **Le harnais est en cours.** Posés le 16 août 2026 : `.claude/settings.json` (mode d'autorisation et règles de refus), `CLAUDE.md` (contrat permanent de l'agent) et les onze ADR de `docs/adr/`. **Reste** : `docs/DESIGN.md` et l'inventaire fermé des composants (T-009), puis les définitions d'agents, skills, workflows et hooks (T-001 et T-002) — un hook qui appelle un script absent est un harnais qui échoue à chaque écriture, ils viennent donc après les commandes de vérification.
3. **Le diff retour n'a jamais eu lieu.** Les maquettes ont fait émerger des comportements que le cahier des charges n'avait pas prévus — c'est mécanique, l'itération visuelle en produit toujours. Tant qu'ils ne sont pas remontés, les maquettes sont source de vérité de fait pendant que le cahier des charges vieillit (§11).
4. **L'inventaire des routes est incomplet.** Les 41 vues sont listées, leurs adresses ne le sont pas. Or `RG-M03-02` (adresse canonique incluant l'univers, redirection des adresses anciennes, désambiguïsation), `RG-M03-03` (stabilité de l'adresse d'une note) et `RG-M02-06`/`RG-M09-05` (état de recherche et de cartographie partageables par l'adresse) sont des exigences de premier plan. La table `route → vue → états → exigences couvertes` est un livrable de la vague 0.
5. **Le jeu de semence est éparpillé.** Chaque maquette embarque son propre `window.CORPUS`, cohérent en interne mais partiellement redondant d'une vue à l'autre. Ce corpus est un actif considérable — c'est lui qui rend la comparaison visuelle possible — mais il doit être unifié en une source unique (§3.6).
6. ~~**Une maquette manque.**~~ **Levé le 16 août 2026.** Le dépôt contenait 40 fichiers de vue pour 41 vues : `V-07 — Accueil contributeur` n'avait pas de maquette, alors que le brief la classe en vague 1 et que c'est elle qui fixe les indicateurs, les cartes, les panneaux et le flux d'activité. `mockups/V-07-accueil-contributeur.html` a été produite par assemblage des composants déjà gelés — socle de V-41, coquille et palette de V-14, barre de répartition de V-11, corpus de démonstration commun — et vérifiée au rendu dans ses six états. Reste à l'inscrire à `mockups/GEL.md` (T-001).

7. **Onze arbitrages sont en attente**, dont trois bloquent la vague 1 (§15).

### 1.3 La chaîne de traçabilité de ce projet

Le guide propose une chaîne `US → EF → V → gel → T → PR`. Ce projet n'a pas d'US ni d'EF : il a des modules, des cas d'usage, des règles de gestion et des principes. La chaîne est donc réécrite avec les identifiants réels, et c'est **elle** qui fait foi :

```
CDC §M04.4  →  UC-M04-02 / RG-M04-04  →  BRIEF V-14 §Sélecteur de registre
            →  mockups/V-14-lecture-note.html (gelé le jj/mm/aaaa, empreinte …)
            →  T-013 (contrat de tâche)  →  branche t-013-lecture-note  →  commits  →  vérification
```

**Convention de commit**, porteuse de la trace dans les deux sens :

```
feat(V-14): sélecteur de registre [UC-M04-02][RG-M04-04][T-013]
fix(V-08): compteur de facettes sur filtres combinés [RG-M02-05][T-018]
chore(harnais): contrôle mécanique des jetons [RG-DA-01]
```

Types employés : `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `adr`. La portée est **la vue** quand la modification est visible, **le module** (`M06`, `M12`) quand elle ne l'est pas, `harnais` quand elle porte sur l'outillage.

Le diff retour (§11) garantit que la chaîne reste vraie dans le sens remontant : toute découverte en aval modifie l'amont, avec trace.

---

## 2. Les trois régimes appliqués à Codicillus

| Régime | Ce qui en relève dans ce projet | Justification |
|---|---|---|
| **Humain** | Les arbitrages du §15 ; l'arbitrage de chaque écart remonté par le diff retour ; toute modification d'une source de vérité ; la réception sur le rapport de fin de vague | Ancrage épistémique. Ce sont les seuls points où de l'information entre dans le système depuis l'extérieur. Tout le reste est dérivation. **Périmètre réduit le 16 août 2026** : la gate et la vérification intermédiaire passent en régime agentique (§7.7, §9) |
| **Assisté** | Retouche d'une maquette lorsqu'un écart arbitré l'exige — en webapp, hors du dépôt, puis regel | La divergence créative est épuisée : les 41 vues sont produites. Ce régime ne sert plus qu'en correction, et reste hors de la boucle agentique pour ne pas polluer le dépôt. |
| **Agentique** | Tout le reste : harnais, ADR, `DESIGN.md`, inventaire des routes, jeu de semence, diff retour, contrats de tâche, code, tests, mesures, revue outillée, capitalisation | Levier de volume, contraint par le harnais. Le rôle humain est celui de valideur — et la cohérence inter-artefacts reste le vrai poste de charge humain. |

**Un déplacement notable par rapport au guide.** Le guide place les briefs de vues et la chaîne de specs en régime agentique parce qu'ils sont à produire. Ici ils sont produits : le poste de charge agentique s'est déplacé vers l'aval — vérification, conformité, mesure. C'est cohérent avec le principe directeur du guide : quand l'exécution devient bon marché, la valeur migre vers la spécification en amont et la vérification en aval. L'amont est fait. **Tout ce plan est donc, pour l'essentiel, un plan de vérification.**

---

## 3. Le harnais permanent

Le harnais est tout ce qui contraint l'agent sans figurer dans la tâche. C'est l'investissement le plus rentable du cycle : écrit une fois, il s'applique à chacune des 55 tâches.

### 3.1 Arborescence cible du dépôt

```
/CLAUDE.md                  — contrat permanent de l'agent
/.claude/
  settings.json             — permissions, hooks, variables (versionné)
  settings.local.json       — approbations locales (ignoré par git)
  agents/                   — définitions de rôles (§7.2)
  skills/                   — rituels exécutables (§7.6)
  workflows/                — orchestrations enregistrées (§7.3)
  hooks/                    — scripts appelés par les hooks (§7.5)
  loop.md                   — prompt de cadence par défaut
/cadrage/                   — LECTURE SEULE (les quatre livrables)
/guide/                     — LECTURE SEULE
/mockups/                   — LECTURE SEULE — le gel
  GEL.md                    — vue → date de gel → empreinte du fichier
/docs/
  adr/                      — ADR-001…  décisions d'architecture
  routes.md                 — inventaire route → vue → états → exigences
  taches/                   — T-001.md …  contrats de tâche
  journal/                  — V0.md … journal par vague (§10)
  DESIGN.md                 — jetons, inventaire fermé de composants, règles de layout
/verif/
  masques.json              — zones exclues de la comparaison visuelle, par vue
  scenarios/                — état de maquette → scénario applicatif (§4.2)
  references/               — captures de référence (produites, versionnées)
/seeds/
  corpus.ts                 — jeu de semence unique issu des maquettes (§3.6)
/src/ …                     — l'application
/services/conversion/       — le service Python d'import
compose.yaml · .env.example · .worktreeinclude · package.json
```

**Sur le gel.** Le guide veut une référence « versionnée, diffable, datée ». `mockups/` est diffable et le deviendra versionnée au premier commit ; la datation est portée par `mockups/GEL.md`, qui associe à chaque vue sa date de gel et l'empreinte du fichier. Toute divergence entre l'empreinte et le fichier signale un regel non arbitré — et le contrôle est mécanique.

### 3.2 `CLAUDE.md` — ce qu'il contient

Sept sections, et rien d'autre. Un `CLAUDE.md` qui enfle cesse d'être lu.

1. **Ce qu'est le produit**, en dix lignes, repris de `BRIEF-VUES.md §1`.
2. **L'ordre de préséance** et les trois règles de l'avertissement de périmètre ci-dessus.
3. **Le vocabulaire contractuel** (`BRIEF-VUES.md §2.3`) : note, fiche, registre, univers, domaine, dossier, étiquette, relation, signet, fraîcheur, vérifier, console. Aucun synonyme ne circule, ni dans l'interface, ni dans le code, ni dans les noms de tables (P-07).
4. **Les commandes** : chaque commande de vérification du §5, avec ce qu'elle prouve.
5. **Les dix principes non négociables** (CDC §28), recopiés intégralement — ce sont eux que l'agent sacrifie en premier sous contrainte.
6. **Les pièges connus du projet**, alimentés par la capitalisation (§10). Vide au départ.
7. **Le protocole de fin de tâche** : quels critères doivent être verts, quoi écrire dans le journal de vague, quoi remonter.

Les exigences non fonctionnelles transversales — budgets de performance, accessibilité, sécurité, conventions — vivent ici et dans les ADR, **jamais recopiées dans un contrat de tâche**. Une ENF recopiée dans chaque tâche finit diluée puis ignorée.

### 3.3 Les ADR à écrire

Les ADR ont une seconde vie en contexte agentique : de traces de décision, ils deviennent des **contraintes actives lues à chaque session**. Un ADR qui proscrit un motif est la garantie mécanique que ce motif ne sera jamais proposé. Onze sont dérivés des documents existants ; ils sont à rédiger en vague 0, avant tout code.

| ADR | Décision | Source | Ce que l'ADR interdit activement |
|---|---|---|---|
| ADR-001 | Rendu serveur avec îlots interactifs, en Svelte | STACK §4.1 | Toute page dont le contenu n'existe qu'après exécution de JavaScript |
| ADR-002 | `socle.css` est la source unique du système visuel | STACK §1, RG-DA-01 | Toute valeur de couleur, d'espacement, de rayon ou de typographie en dur ; toute bibliothèque de composants ; toute classe utilitaire |
| ADR-003 | Le corps d'une note est un document ProseMirror sérialisé en `jsonb` | STACK §4.3 | Le stockage en HTML libre ou en Markdown |
| ADR-004 | Une **seule** implémentation document ⇄ Markdown | C-04, RG-M13-01 | Tout second convertisseur, y compris « temporaire » ou « pour l'import » |
| ADR-005 | Une **seule** définition du calcul de fraîcheur | P-01, RG-M06-03 | Tout recalcul local, toute variante d'agrégat |
| ADR-006 | L'autorisation est calculée côté serveur et projetée dans l'index | C-08, RG-ACC-01 | Tout filtrage d'affichage ; toute route qui reçoit une liste puis la filtre |
| ADR-007 | Refus et inexistence produisent la même réponse, par le même chemin de code | RG-ACC-04, RG-NF-04 | Toute branche distincte « interdit » / « introuvable » |
| ADR-008 | Cartographie rendue en SVG dans le DOM, disposition calculée dans un fil dédié | STACK §4.4 | WebGL, canvas opaque, animation continue de disposition |
| ADR-009 | Les briques optionnelles ne sont jamais dans le chemin critique | P-10, RG-NF-01 | Tout appel synchrone bloquant vers embeddings ou service de conversion |
| ADR-010 | Aucune valeur illustrative | P-02, RG-M01-01 | Toute donnée simulée, toute tendance figée, tout compteur de démonstration en production |
| ADR-011 | Une action interdite n'est pas rendue | P-09, RG-M05-08 | Le bouton grisé, l'onglet inerte, le refus après clic |

### 3.4 `DESIGN.md` — le système de design comme contrainte

Produit par extraction de `mockups/socle.css` et de `mockups/V-41-bibliotheque.html`, il transforme la production d'interface en **assemblage contraint** : l'agent ne dessine plus, il compose. Trois parties :

- **Les 61 jetons nommés**, avec leur rôle — encres, surfaces, traits, accent, fraîcheur, sémantique, typographie, échelle, espacement, rayons, élévations, dimensions de structure, mouvement.
- **L'inventaire fermé des composants**, extrait des dix familles de `socle.css` et de la planche V-41 : nom de classe, variantes, états, règles d'emploi. Fermé signifie : un composant absent de cet inventaire n'existe pas, et sa création est un écart à remonter.
- **Les règles de layout** : grille, densité (compact / confortable), points de rupture, comportement à 360 px.

Le témoin de fraîcheur y fait l'objet d'une section propre : jauge à trois barres dont **la forme porte l'information et la couleur ne fait que la répéter** (RG-M18-09, RG-DA-03). C'est le composant le plus reproduit du produit et le plus facile à dégrader.

### 3.5 Les sources de vérité en lecture seule

Mécanisme, pas consigne. Dans `.claude/settings.json` :

```json
{
  "permissions": {
    "deny": [
      "Edit(cadrage/**)", "Write(cadrage/**)",
      "Edit(guide/**)",   "Write(guide/**)",
      "Edit(mockups/**)", "Write(mockups/**)"
    ]
  }
}
```

Un agent qui a besoin de modifier l'un de ces fichiers reçoit un refus d'outil — et c'est exactement le comportement recherché : la modification d'une source de vérité passe par un arbitrage humain, jamais par une session d'exécution. `mockups/socle.css` est donc lu, jamais édité : la feuille globale de l'application en est une **copie contrôlée**, dont la non-divergence est vérifiée mécaniquement (§5, famille 2).

### 3.6 Le corpus de démonstration comme jeu de semence unique

C'est l'actif le plus sous-estimé du dépôt. Trente-six des quarante maquettes embarquent un objet `window.CORPUS` : des notes plausibles, cohérentes entre elles, avec auteurs, dossiers, fraîcheurs, compteurs de consultation, étiquettes, pièces jointes, registres, relations. Les compteurs affichés dans les vues en sont **calculés**, jamais saisis — c'est P-02 appliqué jusque dans les maquettes.

Décision : ce corpus devient le **jeu de semence unique** du projet, dans `seeds/corpus.ts`. Trois bénéfices, tous décisifs :

1. La comparaison visuelle application ↔ maquette porte sur **les mêmes données des deux côtés**. Sans cela, elle ne prouve rien.
2. Les tests de bout en bout, les états vides, les listes longues et les cas limites disposent d'un jeu réaliste et stable, sans invention d'agent.
3. Les parcours `PU-01` à `PU-06` deviennent scriptables tels qu'ils sont écrits, avec les mêmes titres de notes.

Tâche de vague 0 : extraire les 36 corpus, les réconcilier — un même identifiant doit porter les mêmes valeurs partout —, produire la source unique, et **remonter toute incohérence détectée** comme écart de diff retour (§11).

**Une date de référence est gelée avec le corpus.** Les maquettes affichent « Vérifié il y a 12 jours » à partir de dates absolues : ces libellés ne sont reproductibles que si l'horloge est fixée. La date de référence est déclarée dans `seeds/corpus.ts` et imposée à toute capture et à tout test (§4.2).

### 3.7 Les boucles de vérification rapides

La qualité de la délégation est proportionnelle à la vitesse des boucles que l'agent exécute seul, sans attendre l'humain. Trois niveaux, du plus fréquent au plus rare :

| Niveau | Déclenchement | Contenu | Budget de temps |
|---|---|---|---|
| **Réflexe** | À chaque écriture de fichier, par hook | Format, lint, contrôle des jetons sur le fichier touché | < 2 s |
| **Tâche** | À la fin de chaque lot, par l'agent lui-même | `pnpm verify:lot T-xxx` — typage, unitaires du lot, états, conformité de maquette des vues concernées | < 3 min |
| **Vague** | À la clôture d'une vague | `pnpm verify` — la batterie complète du §5 | < 20 min |

Un niveau qui dépasse son budget est un défaut de harnais à traiter comme tel : au-delà, l'agent cesse de l'exécuter spontanément et la délégation se dégrade.

---

## 4. La boucle d'acceptation visuelle

C'est la pièce qui ferme la boucle de vérification d'interface, et le point ouvert n° 5 du guide — « fiabilité de la boucle screenshot ↔ mockup gelé comme critère d'acceptation UI (tolérances, faux positifs) ». Ce projet est en position exceptionnellement favorable pour y répondre.

### 4.1 Ce que les maquettes fournissent déjà

L'inspection des fichiers gelés révèle trois propriétés qui rendent la boucle mécanisable :

- **Une planche de revue** dans 36 des 40 vues : un bloc `<div class="planche">`, explicitement marqué « hors produit », qui pilote par cases et boutons radio les variantes de la vue — droits (écriture / lecture seule), fraîcheur (frais / vieillissant / obsolète), bandeaux (révision, brouillon, resynchronisation), existence du registre opérationnel, état (nominal / chargement). Ces contrôles sont pilotables par script.
- **Un corpus commun** (§3.6), qui donne aux deux côtés de la comparaison les mêmes données.
- **`socle.css` en ligne et à l'identique** dans chaque vue : la feuille de l'application et celle de la maquette sont le même fichier, ce qui élimine la première cause d'écart de rendu.

Les quatre vues sans planche — V-09, V-35, V-40, V-41 — sont couvertes autrement : leurs états sont présentés côte à côte dans la page elle-même.

### 4.2 Le protocole de comparaison

Pour une vue `V-xx`, la vérification produit et compare **N couples de captures**, un par état déclaré dans `verif/scenarios/V-xx.json`. Chaque entrée du fichier associe une combinaison de contrôles de la planche à un scénario applicatif — semence, persona, adresse — qui doit produire le même écran.

```json
{
  "vue": "V-14",
  "route": "/u/production/infrastructure/n/restaurer-une-sauvegarde-postgresql-depuis-barman",
  "etats": [
    { "cle": "nominal-ecriture",
      "planche": { "droits": "ecriture", "fr": "frais", "etat": "nominal", "c-op": true },
      "app":     { "persona": "redacteur", "note": "n-restaurer-pg" } },
    { "cle": "lecture-seule",
      "planche": { "droits": "lecture" },
      "app":     { "persona": "lecteur", "note": "n-restaurer-pg" } },
    { "cle": "bandeau-revision",
      "planche": { "c-revision": true },
      "app":     { "persona": "redacteur", "note": "n-restaurer-pg", "revision": true } },
    { "cle": "chargement",
      "planche": { "etat": "chargement" },
      "app":     { "persona": "redacteur", "note": "n-restaurer-pg", "latence": "suspendue" } }
  ]
}
```

**Conditions de capture, identiques des deux côtés.** Ce sont elles qui font la différence entre un critère d'acceptation et un générateur de faux positifs :

| Condition | Réglage |
|---|---|
| Fenêtres | 1440 × 900, 1024 × 768, 768 × 1024, 360 × 780 — les quatre pour les vues concernées par RG-M18-13, la première seule sinon |
| Horloge | Gelée à la date de référence du corpus, des deux côtés |
| Polices | Servies **localement** — voir l'écart signalé ci-dessous |
| Animation | Désactivée (`prefers-reduced-motion`, transitions à durée nulle) |
| Barres de défilement | Masquées, largeur neutralisée |
| Densité de pixels | 1, fixée |
| Planche de revue | Retirée du DOM avant capture |
| Zones masquées | Celles déclarées dans `verif/masques.json` : temps de réponse de recherche, horodatages relatifs à la minute, identifiants générés |

> **Écart identifié, à arbitrer.** Les 40 maquettes chargent leurs trois familles typographiques depuis Google Fonts. `RG-NF-08` exige un produit auto-hébergeable sans dépendance à un service externe : l'application devra donc servir Archivo, Literata et JetBrains Mono localement. Le harnais de capture doit alors **réécrire la source des polices dans la maquette** au moment du rendu, sinon la comparaison mesure une différence de fonderie et non une différence d'implémentation. Les trois familles sont sous licence ouverte, le rapatriement ne pose pas de difficulté — mais il doit être décidé et tracé (§15, point 8).

**Trois niveaux de contrôle**, appliqués dans l'ordre, du moins coûteux au plus coûteux :

| Niveau | Ce qui est comparé | Verdict |
|---|---|---|
| **1 — Structure** | Repères ARIA, rôles, ordre de tabulation, hiérarchie des titres, présence et ordre des blocs nommés | Écart = **échec sec**. Aucune tolérance : c'est de la sémantique, pas du rendu |
| **2 — Pixels** | Différence de pixels entre les deux captures, seuil de canal 3 % | ≤ 0,5 % de pixels différents : **conforme**. > 3 % : **échec sec**. Entre les deux : niveau 3 |
| **3 — Jugement** | Un agent dédié reçoit les deux captures et le libellé de l'état, et répond : écart de fond ou écart de rendu acceptable | Écart de fond : échec, avec la description de l'écart. Écart acceptable : conforme, **et l'écart est consigné dans le journal de vague** |

Le niveau 3 n'est jamais un moyen de faire passer un échec : sa fenêtre est étroite par construction, et tout recours au niveau 3 est comptabilisé. Un taux de recours qui augmente d'une vague à l'autre est le signal que le protocole de capture dérive (§14, point 5).

### 4.3 Ce qui fait échouer une tâche

Une tâche portant une vue n'est pas terminée tant que, pour **chaque** état déclaré : le niveau 1 est vert, le niveau 2 est conforme ou arbitré au niveau 3, et les quatre états de zone exigés par `RG-M18-03` sont couverts. Une vue partiellement conforme n'est pas une vue livrée.

### 4.4 Ce que la boucle ne prouve pas

Elle prouve la conformité du rendu, jamais celle du comportement. Le focus persistant au clic de la cartographie, la boucle cyclique du clavier dans les résultats, la propreté du texte copié depuis un bloc de code, le fait qu'une palette rende le focus à son déclencheur : rien de tout cela n'apparaît sur une capture. Ces comportements relèvent des batteries du §5, et ils sont explicitement listés dans les contrats de tâche concernés — ce sont les dix points durs du brief des vues.

---

## 5. Le catalogue des critères exécutables

La règle de découpe du guide vaut critère de qualité : **si l'on ne peut pas vérifier mécaniquement qu'une exigence est satisfaite, elle est mal découpée**. Les règles de gestion du cahier des charges ne sont pas toutes dans cet état — certaines sont des propriétés globales du produit, pas des comportements locaux. Ce catalogue les traduit en batteries exécutables ; chacune est une commande, et chaque contrat de tâche cite les batteries qui le concernent.

| # | Batterie | Commande | Ce qu'elle prouve | Exigences couvertes |
|---|---|---|---|---|
| 1 | Typage et style | `pnpm check` | Le code compile, respecte les conventions | — |
| 2 | Jetons et non-divergence du socle | `pnpm verif:jetons` | Aucune valeur de couleur, d'espacement, de rayon ou de police en dur hors `socle.css` ; la copie du socle est identique au gel | RG-DA-01, ADR-002, R-06 |
| 3 | Unitaires | `pnpm test:unit` | Comportements locaux, dont la résolution des droits et le calcul de fraîcheur | RG-DRO-01…05, RG-M06-01…04 |
| 4 | Aller-retour Markdown | `pnpm test:aller-retour` | Pour **tout** document du corpus, sérialiser puis désérialiser redonne le document d'origine | RG-M13-01 (« critère de réussite principal »), C-04, R-05 |
| 5 | Unicité de la fraîcheur | `pnpm verif:fraicheur` | Il n'existe qu'une implémentation du calcul, et tous les affichages l'appellent | P-01, RG-M06-03 |
| 6 | Étanchéité du périmètre | `pnpm test:etancheite` | Matrice **toutes routes × tous personas** : anonyme, contributeur sans droit, lecteur, rédacteur, gestionnaire, administrateur. Aucun contenu interne n'est atteignable en anonyme, par aucun chemin, y compris par adresse construite ; refus et inexistence sont indiscernables | RG-ACC-01, RG-ACC-04, RG-M02-04, RG-M17-01, RG-M04-08, PU-03 |
| 7 | Actions interdites | `pnpm test:droits` | Aucune action non autorisée n'est présente dans le DOM — ni grisée, ni masquée | P-09, RG-M05-08 |
| 8 | Corpus vide | `pnpm test:vide` | Sur une base vierge, aucun indicateur n'affiche de valeur ; tous affichent un état neutre explicite | P-02, RG-M01-01 |
| 9 | Quatre états | `pnpm test:etats` | Chaque zone de contenu rend ses états chargement, vide, erreur, sans droit ; une zone en erreur ne fait pas tomber la page | RG-M18-03, RG-M18-04, RG-M04-07 |
| 10 | Accessibilité | `pnpm test:a11y` | axe-core sans violation ; parcours complet au clavier ; focus visible ; superpositions qui piègent le focus et le rendent ; alternatives textuelles des contenus graphiques | RG-M18-07…11, P-06 |
| 11 | Conformité de maquette | `pnpm verif:maquette V-xx` | Le protocole du §4 | Toutes les exigences de rendu |
| 12 | Parcours de référence | `pnpm test:parcours` | PU-01 à PU-06 joués de bout en bout, avec leurs critères de réussite chiffrés | PU-01…06 |
| 13 | Budgets de performance | `pnpm mesure:budgets` | Les sept budgets du cahier des charges, mesurés sur volumétrie haute synthétique | CDC §Performance, STACK §5, R-01 |
| 14 | Dégradation | `pnpm test:degradation` | Les deux conteneurs optionnels arrêtés, le produit reste pleinement utilisable et se signale dégradé | P-10, RG-NF-01, RG-M02-01 |
| 15 | Impression | `pnpm test:impression` | La lecture d'une note produit une impression sans navigation ni panneaux, avec métadonnées de confiance et adresses des liens en note | RG-M18-17 |
| 16 | Menu vivant | `pnpm verif:menus` | Aucune entrée de navigation inerte ; un module désactivé disparaît de la navigation et des tableaux de bord | P-03, P-04, RG-STR-06 |
| 17 | Vocabulaire | `pnpm verif:vocabulaire` | Aucun synonyme des douze termes contractuels dans l'interface | P-07 |
| 18 | Sauvegarde et restauration | `pnpm exploitation:restauration` | Restauration complète depuis une sauvegarde, réindexation incluse, corpus identique après | RG-NF-09 |

`pnpm verify` enchaîne les dix-huit. `pnpm verify:lot T-xxx` n'exécute que les batteries citées par le contrat de tâche.

**Les batteries 6, 7, 8, 14 et 16 sont la vraie originalité de ce catalogue.** Elles traduisent en test des principes que l'on vérifie d'ordinaire à l'œil, donc jamais. Ce sont aussi celles qui protègent les propriétés que le cahier des charges désigne comme les plus coûteuses à réintroduire après coup.

---

## 6. Découpage : lots, dépendances, vagues

### 6.1 La règle de taille d'un lot

Un lot est une **tranche verticale** livrant un comportement complet de bout en bout, et il reçoit un contrat de tâche `T-xxx`. Trois bornes :

- il touche **une dizaine de fichiers**, pas trente ;
- **chaque exigence qu'il sert a son critère exécutable** ; s'il en existe une qui n'en a pas, le lot est mal découpé et retourne en découpe ;
- il tient dans **une session** — s'il déborde, c'est qu'il portait deux tranches.

C'est l'hypothèse de granularité du pilote (point ouvert n° 1 du guide), et §14 dit comment on la mesurera.

### 6.2 La grille de criticité

La criticité n'est pas une appréciation : elle est déterminée par ce que le lot touche. Elle est inscrite au contrat et **ne se renégocie pas à chaud**.

| Criticité | Ce qui la déclenche | Mode d'exécution | Profondeur de revue |
|---|---|---|---|
| **Haute** | Authentification, sessions, droits, périmètre public, schéma de données et migrations, suppressions atomiques, format canonique du contenu, convertisseur Markdown, calcul de fraîcheur, projection des droits dans l'index, import et export | **Pair** — présence continue, plan approuvé avant écriture | Intégrale : spec, puis tests, puis diff, ligne à ligne |
| **Moyenne** | Éditeur, lecture, recherche, historique et comparaison, cartographie et analyses, comptes et configuration, carte mentale | **Délégation avec plan approuvé** et points de contrôle intermédiaires | Spec et tests intégralement ; diff sur les zones sensibles |
| **Basse** | Consoles de référentiel, signets, profil, pages non trouvées, vues périphériques, travaux de mise en forme | **Délégation large**, éventuellement en éventail | Spec et tests ; diff par échantillonnage (§9) |

La liste « haute par défaut » est une hypothèse de pilote (point ouvert n° 3 du guide) : tout incident constaté en revue sur un lot classé basse ou moyenne fait remonter la catégorie concernée, définitivement.

### 6.3 Le graphe des lots

Cinquante-cinq lots, douze vagues. Les vagues d'implémentation **ne sont pas** les vagues de maquettage du cahier des charges : le maquettage était ordonné par le risque de système visuel, l'implémentation l'est par les dépendances de données. La lecture d'une note (V-14, vague 1 du maquettage) ne peut pas être livrée avant que la note existe en base.

| Lot | Intitulé | Dépend de | Vague | Crit. | Vues | Exigences dimensionnantes | Critère de sortie |
|---|---|---|---|---|---|---|---|
| T-001 | Gel daté et harnais initial *(mise sous git faite)* | — | 0 | haute | — | §1.2, §3 | `mockups/GEL.md` complet ; `CLAUDE.md` rédigé ; ADR-001…011 rédigés ; `.claude/` en place |
| T-002 | Squelette applicatif et outillage de test | T-001 | 0 | haute | — | STACK §3 | `pnpm check` et `pnpm test:unit` verts sur un projet vide |
| T-003 | Composition d'exploitation, cinq services | T-002 | 0 | haute | — | STACK §8, C-13 | `docker compose up` ; les cinq services répondent ; arrêt des deux optionnels sans erreur |
| T-004 | Intégration contrôlée de `socle.css`, polices locales | T-002 | 0 | moyenne | — | RG-DA-01, RG-NF-08 | Batterie 2 verte |
| T-005 | Jeu de semence unique issu des maquettes | T-001 | 0 | moyenne | — | §3.6, P-02 | `seeds/corpus.ts` ; réconciliation tracée ; incohérences remontées |
| T-006 | Inventaire des routes et des états | T-001 | 0 | moyenne | toutes | RG-M03-02, RG-M03-03 | `docs/routes.md` : toutes les routes, tous les états, exigences couvertes |
| T-007 | Banc de comparaison visuelle | T-004, T-005, T-006 | 0 | haute | — | §4 | `pnpm verif:maquette V-41` conforme sur la maquette elle-même (contrôle à blanc) |
| T-008 | Diff retour maquettes ↔ specs | T-006 | 0 | haute | toutes | §11, phase 11 du guide | Écarts listés, arbitrés, specs mises à jour |
| T-009 | `DESIGN.md` et inventaire fermé des composants | T-004 | 0 | moyenne | V-41 | RG-DA-01 | Inventaire complet, chaque composant tracé vers `socle.css` |
| T-010 | Schéma de données et migrations | T-003 | 1 | haute | — | CDC §3, RG-STR-01…06 | Migration réversible ; semence chargée ; contraintes d'unicité vérifiées |
| T-011 | Résolution des droits | T-010 | 1 | haute | — | RG-DRO-01…05, RG-ACC-01, RG-ACC-04 | Batteries 3 et 6 vertes sur le corpus |
| T-012 | Authentification et sessions | T-011 | 1 | haute | V-05 | M16.1, RG-M16-01, RG-ACC-02, RG-ACC-03 | Batteries 3, 6, 11 ; ralentissement mesuré |
| T-013 | Fraîcheur — définition unique | T-010 | 1 | haute | — | P-01, RG-M06-01…04 | Batterie 5 verte |
| T-014 | Format canonique du contenu et rendu serveur | T-010 | 1 | haute | — | C-03, ADR-003, M04.6 | Les 15 constructions rendues ; schéma refusant l'invalide |
| T-015 | Convertisseur unique document ⇄ Markdown | T-014 | 1 | haute | — | C-04, RG-M13-01 | Batterie 4 verte sur tout le corpus |
| T-016 | Coquille applicative | T-011, T-012 | 1 | moyenne | V-37 | UC-M03-01, RG-M03-01, M03.3 | Dépliage mémorisé ; dossiers interdits absents ; batterie 11 |
| T-017 | Notifications, états, dialogues, messages | T-016 | 1 | moyenne | V-38, V-39, V-40 | RG-M18-01…05, RG-M18-14 | Batteries 9 et 11 ; catalogue de messages en français |
| T-018 | Bibliothèque de composants, page réelle | T-009, T-016 | 1 | basse | V-41 | RG-DA-01, R-06 | La page rend l'inventaire complet ; batterie 11 |
| T-019 | Cycle de vie d'une note et versions | T-013, T-014 | 2 | haute | — | M05.7, RG-M07-01…04 | Version capturée au bon moment, jamais à vide ; purge au plafond |
| T-020 | Éditeur — barre d'outils et constructions | T-014, T-017 | 2 | moyenne | V-17 | M05.3, M05.4, UC-M05-03…05 | Les 15 constructions ; menu de commandes ; batterie 11 |
| T-021 | Markdown à la frappe | T-020 | 2 | moyenne | V-17 | UC-M05-04 | Les neuf conversions attendues |
| T-022 | Liens internes et rétroliens | T-019, T-020 | 2 | moyenne | V-17, V-14 | UC-M05-06, RG-M05-02 | Lien stable au renommage ; lien cassé signalé ; rétroliens déduits |
| T-023 | Lecture d'une note | T-014, T-016, T-013 | 2 | moyenne | V-14 | M04.1…04.7, RG-M04-01…07 | Batteries 9, 10, 11, 15 ; sommaire ; panneaux à trois états |
| T-024 | Vérification et demande de révision | T-013, T-023 | 2 | moyenne | V-14 | M06.2, M06.3, RG-M06-05…07 | Un clic, sans formulaire ; historique conservé ; demande levée |
| T-025 | Registre opérationnel et désynchronisation | T-019, T-023 | 2 | moyenne | V-18 | M05.9, RG-M06-08…10 | Signal levé par les deux voies ; métadonnées sans effet |
| T-026 | Pièces jointes et images | T-011, T-020 | 2 | haute | V-14, V-17 | RG-M04-08, M05.4 | Batterie 6 sur les pièces jointes ; plafond configurable |
| T-027 | Indexation et projection des droits | T-011, T-014 | 3 | haute | — | C-08, ADR-006, RG-M05-06 | Batterie 6 sur l'index ; trouvable en moins de 10 s |
| T-028 | Recherche — mots-clés, facettes, tri | T-027 | 3 | moyenne | V-08 | M02.2…02.6, UC-M02-03 | Deux fautes sur deux mots ; compteurs de facettes ; adresse partageable ; batterie 13 |
| T-029 | Palette de recherche rapide | T-028 | 3 | moyenne | V-09 | M02.1, M02.7, UC-M02-06 | Boucle cyclique ; second appui ; batteries 10, 11 |
| T-030 | Recherche infructueuse et création | T-028 | 3 | basse | V-08 | UC-M02-07, RG-M02-03 | Titre pré-rempli ; recherche journalisée |
| T-031 | Arborescence de dossiers et droits explicites | T-011, T-016 | 4 | haute | V-13 | M03.5, RG-M03-04, RG-STR-04, RG-STR-05 | Suppression atomique ; saisie du nom exact ; hérités affichés |
| T-032 | Pages d'univers, de domaine, de dossier | T-031, T-013 | 4 | moyenne | V-10, V-11, V-13 | M01.2, M01.3, RG-M01-04 | Agrégats stables quel que soit le rôle ; batteries 8, 11, 16 |
| T-033 | Liste des notes d'un domaine | T-032, T-028 | 4 | basse | V-12 | M03.4 | Filtres, tris, densité ; batterie 11 |
| T-034 | Accueil contributeur | T-032, T-024 | 4 | moyenne | V-07 | M01.1, RG-M01-01…03 | Batterie 8 ; corbeille de révisions ; activité dédupliquée ; indicateur et corbeille lisant la même source |
| T-035 | Historique des versions et restauration | T-019 | 5 | moyenne | V-15 | M07.2, RG-M07-05, RG-M07-06 | Restauration réversible ; deux corps restaurés |
| T-036 | Comparaison texte et visuelle | T-035 | 5 | moyenne | V-16 | C-05, M07.3, RG-M18-11 | Blocs identiques alignés ; marqueur en plus de la couleur ; liste des différences |
| T-037 | Fiches, propriétés typées, relations | T-019 | 6 | moyenne | V-14 | M08, RG-M08-01…07, P-08 | Unicité de relation ; libellé inverse ; origine visible |
| T-038 | Cartographie — vue complète | T-037 | 6 | moyenne | V-19 | M09.3, RG-M09-01…04, RG-M18-11 | Focus persistant au clic ; alternative textuelle ; batterie 13 |
| T-039 | Analyses de criticité et communautés | T-038 | 6 | moyenne | V-19 | M09.5, M09.6, RG-M09-07 | Points d'articulation testés sur graphes connus ; légende exhaustive |
| T-040 | Cartographie — vue par type maître | T-038 | 6 | moyenne | V-20 | M09.4, RG-M09-05 | Un seul voisinage à la fois ; un saut ; états limites |
| T-041 | Carte mentale | T-031 | 6 | basse | V-21 | M10, RG-M10-01 | Dépliage progressif ; périmètre respecté |
| T-042 | Service de conversion isolé | T-003 | 7 | haute | — | M12.1, RG-M12-04, RG-NF-01 | Trois formats ; fichier malformé sans effet sur le lot ; batterie 14 |
| T-043 | Import — scénarios, idempotence, simulation | T-042, T-015, T-031 | 7 | haute | V-24 | M12.2, RG-M12-01…03 | Réimport sans doublon ; simulation fidèle ; mode strict |
| T-044 | Import — parcours, progression, rapport | T-043 | 7 | moyenne | V-24, V-35 | M12.3, RG-M12-05…11 | Progression en temps réel ; rapport complet ; onglet fermable |
| T-045 | Export réimportable | T-015, T-031 | 7 | haute | V-36 | M13, RG-M13-01…03 | Export puis réimport reconstituent le domaine à l'identique |
| T-046 | Espace public | T-011, T-023, T-028 | 8 | haute | V-01…V-04 | M17, RG-M17-01…04, PU-03 | Batterie 6 intégrale ; aucune action d'écriture ; fraîcheur affichée |
| T-047 | Réinitialisation de mot de passe | T-012 | 8 | moyenne | V-06 | M16, arbitrage §15 | Selon l'arbitrage retenu |
| T-048 | Signets | T-027, T-032 | 8 | basse | V-22, V-23 | M11, RG-M11-01, RG-M11-02 | Cherchables et identifiés comme liens externes |
| T-049 | Profil, distinctions, page non trouvée | T-012, T-034 | 8 | basse | V-25, V-26 | M16.3…16.5 | Distinctions calculées, jamais figées ; batterie 8 |
| T-050 | Console — motif commun, univers, domaines | T-031 | 9 | haute | V-27, V-28 | M14.1, M14.2, RG-M14-01…05 | Suppression atomique ; modules réellement effectifs ; batterie 16 |
| T-051 | Console — référentiels | T-050 | 9 | basse | V-29, V-30, V-31 | M14.3…14.5, RG-M14-06, RG-M08-07 | Refus de suppression d'un type utilisé, avec réaffectation |
| T-052 | Console — comptes et configuration | T-050, T-013 | 9 | haute | V-32, V-33 | M14.6, M14.7, RG-M14-07…10 | Recalcul immédiat des badges ; dernier administrateur protégé |
| T-053 | Journaux et console analytique | T-028, T-034 | 9 | moyenne | V-34 | M15, RG-M15-01…03 | Trous documentaires réels ; aucun classement nominatif |
| T-054 | Vecteurs, mode Sens, hybride | T-027, T-003 | 10 | moyenne | V-08 | M02.4, RG-M02-01, C-02 | Batterie 14 : service arrêté, bascule silencieuse |
| T-055 | Notes connexes, familles sémantiques, suggestions | T-054, T-039 | 10 | basse | V-14, V-17 | M05.6, M09.6, RG-M05-03, RG-M05-04 | Jamais appliqué automatiquement ; date de calcul affichée |
| T-056 | Durcissement : accessibilité, petits écrans, impression | tous | 11 | moyenne | toutes | RG-M18-07…17 | Batteries 10, 11 (quatre fenêtres), 15 |
| T-057 | Budgets de performance et volumétrie haute | tous | 11 | moyenne | — | CDC §Performance, R-01 | Batterie 13 ; seuil de bascule cartographique fixé |
| T-058 | Exploitation : sauvegarde, restauration, indisponibilité | T-003 | 11 | haute | — | RG-NF-09, RG-NF-10 | Batterie 18 ; page d'indisponibilité activable |
| T-059 | Recette des parcours de référence | tous | 11 | haute | — | PU-01…PU-06 | Batterie 12, critères chiffrés tenus |

### 6.4 Ce qui est parallélisable, et ce qui ne l'est pas

Sans graphe, la parallélisation est un pari ; avec, c'est une lecture. Mais le graphe des dépendances ne suffit pas : deux lots indépendants peuvent se marcher dessus par les ressources qu'ils écrivent. **Règle : deux lots ne s'exécutent en parallèle que s'ils ne partagent ni migration, ni fichier de route, ni définition de composant, ni schéma d'index.**

Concrètement :

- **Vagues 0 et 1 : séquentielles.** Elles construisent le socle ; toute parallélisation y crée des conflits de migration.
- **Vagues 2 à 9 : parallélisation à l'intérieur d'une vague**, deux à quatre lots simultanés, chacun dans son worktree (§7.4).
- **Les lots à criticité haute ne sont jamais parallélisés entre eux** : ils exigent une présence continue, qui ne se divise pas.
- **Les fortes candidates à l'éventail** sont les vues de console (T-051), les vues périphériques (T-048, T-049) et les batteries de vérification transversales (§7.3) : nombreuses, semblables, faiblement couplées.

### 6.5 Les lots détachables

Si le périmètre de la première version devait être réduit (CDC §Ce qui reste à arbitrer, point 2 ; STACK §11, point 3), les lots suivants se retirent **sans effet sur l'architecture** — ce sont précisément ceux qui reposent sur les briques marquées optionnelles :

| Lot | Ce qui disparaît | Effet sur le reste |
|---|---|---|
| T-054, T-055 | Mode Sens, hybride, notes connexes, familles sémantiques, suggestions de doublon | La recherche reste en mots-clés ; c'est déjà le comportement de repli exigé par RG-M02-01 |
| T-041 | Carte mentale | Un module de domaine de moins ; RG-STR-06 le prévoit |
| T-039 | Analyses de criticité et communautés | La cartographie reste navigable ; le différenciateur « point de défaillance unique » est perdu — décision lourde |

Le retrait de T-039 mérite un avertissement : le point d'articulation est cité au cahier des charges comme différenciateur secondaire du produit et comme moteur du parcours PU-06. Le retirer réduit la cartographie à un affichage.

---

## 7. L'orchestration agentique

### 7.1 Carte des mécanismes retenus

| Mécanisme | Ce que c'est | Usage retenu dans ce projet |
|---|---|---|
| **Session principale** | La conversation qui tient le plan | Chef d'orchestre : lit le contrat, passe la gate, exécute ou délègue, consigne. Une session par lot, nommée `t-xxx` |
| **Sous-agents** (`.claude/agents/`) | Rôles réutilisables, contexte propre, modèle, effort, outils, hooks et mémoire par rôle | Six rôles définis en §7.2 |
| **Workflows dynamiques** (`.claude/workflows/`) | Un script JavaScript qui orchestre des dizaines d'agents ; les résultats intermédiaires restent dans le script, hors du contexte | Six orchestrations enregistrées en §7.3, toutes en éventail sur un inventaire connu |
| **Worktrees** | Copie de travail isolée, par session ou par sous-agent | Isolation des écritures pour les lots parallèles (§7.4) |
| **Hooks** | Scripts, prompts ou agents déclenchés sur événement, capables de bloquer | Sept contraintes mécaniques (§7.5) |
| **`/goal`** | Une condition d'arrêt évaluée après chaque tour par un modèle rapide, qui relance tant qu'elle n'est pas tenue | Convergence intra-lot : « les critères du contrat T-xxx sont verts » (§7.6) |
| **`/loop`** | Réexécution d'une consigne à intervalle fixe ou choisi | Surveillance des traitements longs : lots d'import, mesures de volumétrie, réindexation |
| **Monitor** | Diffusion en continu d'un flux de sortie dans la conversation | Suivi des journaux du serveur de développement et des conteneurs, sans interrogation répétée |
| **Skills** (`.claude/skills/`) | Procédures nommées, invocables | Les rituels du cycle rendus exécutables (§7.6) |
| **Mode plan** | L'agent propose avant d'écrire ; approbation requise | Obligatoire pour toute délégation de criticité moyenne, et pour la part déléguée des lots de criticité haute |
| **Advisor** | Consultation d'un second modèle aux points de décision | Activé sur les lots de criticité haute : approche, erreur récurrente, déclaration d'achèvement |
| **Revue outillée** | `/code-review`, `/security-review`, revue multi-agents en nuage | À la clôture de chaque vague, et systématiquement sur T-011, T-012, T-026, T-027, T-046 |
| **Points de restauration** | Commits atomiques, `/rewind` | Un commit par comportement vérifié, jamais un commit par session |
| **Mémoire de sous-agent** | Persistance de portée projet pour un rôle | Le rôle « vérificateur » accumule les pièges de vérification d'une vague à l'autre (§10) |
| **Artifacts** | Publication d'une page consultable | Rapport de fin de vague remis au commanditaire |
| **Remote Control et notifications** | Pilotage et alerte à distance | Supervision des vagues longues sans rester au terminal |

### 7.2 Les six rôles d'agents

Définir un rôle une fois vaut mieux que le décrire à chaque invocation : c'est la différence entre une consigne et une contrainte.

| Rôle | Ce qu'il fait | Outils | Particularités |
|---|---|---|---|
| `implementeur` | Réalise un lot à partir de son contrat | Complets | `isolation: worktree`, `permissionMode: plan`, effort élevé |
| `verificateur-maquette` | Exécute le protocole §4, analyse l'écart, tranche au niveau 3 | Lecture, Bash, capture | Lecture seule sur `src/` : il constate, il ne corrige pas |
| `verificateur-acces` | **Adversarial** : cherche activement un chemin d'accès à un contenu interdit | Lecture, Bash, réseau local | Consigne explicite : « ton succès est de trouver une faille, pas de confirmer qu'il n'y en a pas » |
| `verificateur-specs` | Confronte l'implémentation au cahier des charges et aux maquettes, relève les écarts silencieux | Lecture seule | Mémoire de portée projet |
| `mesureur` | Tient les budgets de performance sur volumétrie haute | Bash, lecture | Rend des chiffres, jamais des appréciations |
| `capitalisateur` | Extrait de la session les apprentissages et les propose au harnais | Lecture, écriture sur `CLAUDE.md`, `docs/adr/`, `docs/journal/` | Ne touche ni `src/` ni `cadrage/` |

Définition de référence en annexe F. Deux principes en gouvernent l'usage :

**Celui qui écrit ne vérifie pas.** Les tests d'un lot sont relus par un rôle qui n'a pas produit le code. Un agent sait écrire des tests qui valident son propre défaut ; c'est la parade structurelle, et elle est peu coûteuse.

**Le vérificateur d'accès est adversarial par construction.** Un agent à qui l'on demande de confirmer qu'une protection tient la confirme. Un agent à qui l'on demande de la contourner trouve ce qu'il y a à trouver. C'est la seule manière crédible d'éprouver `RG-ACC-01` et `RG-M17-01`, dont le cahier des charges fait le critère de réussite du parcours PU-03.

### 7.3 Les six workflows enregistrés

Un workflow déplace le plan dans du code : la boucle, les branches et les résultats intermédiaires vivent dans le script, et la conversation ne voit que la conclusion. Il est justifié exactement quand une même étape doit s'exécuter sur de nombreux éléments d'un inventaire connu — ce qui, ici, arrive six fois.

| Workflow | Éventail | Vague | Ce qu'il produit |
|---|---|---|---|
| `/diff-retour` | 1 agent par vue (40) + 1 synthèse | 0 | La liste des écarts maquette ↔ brief ↔ cahier des charges, dédoublonnée, classée par gravité (§11) |
| `/corpus-unifie` | 1 agent par maquette porteuse de corpus (36) + réconciliation | 0 | `seeds/corpus.ts` et la liste des incohérences entre corpus |
| `/conformite` | 1 agent par vue implémentée, chacun enchaînant capture, comparaison et analyse | 2 à 11 | Le verdict de conformité par vue et par état, avec les écarts décrits |
| `/etancheite` | 1 agent par persona × famille de routes, puis vérification adversariale de chaque faille supposée | 3, 8 | Les chemins d'accès non couverts, confirmés par contre-épreuve |
| `/revue-de-vague` | 1 agent par dimension (correction, droits, accessibilité, performance, fidélité aux specs), puis vérification adversariale de chaque constat | fin de vague | Un rapport unique, constats confirmés seulement |
| `/console` | 1 agent par vue de console (10), en worktrees isolés | 9 | Les dix vues du motif commun, implémentées en parallèle |

Trois contraintes de la mécanique, à connaître avant d'écrire un script :

- **Seize agents simultanés au maximum**, mille par exécution. Un éventail de quarante s'exécute donc en trois vagues internes ; ce n'est pas un problème, c'est un délai.
- **La reprise après interruption rejoue tout ce qui a démarré après le premier agent non terminé.** Conséquence pratique : mieux vaut beaucoup de petits agents qu'un seul long — un éventail conserve davantage de progrès qu'une chaîne.
- **Le garde-fou de taille par défaut vise moins de quinze agents.** Les workflows `/diff-retour`, `/corpus-unifie` et `/conformite` le dépassent délibérément et demandent le réglage `large` ; c'est une décision explicite, pas un débordement.

Script de référence en annexe G.

### 7.4 Isolation : worktrees, et le problème des ressources partagées

Un worktree isole les fichiers. Il n'isole ni la base de données, ni l'index de recherche, ni les ports. Or deux agents qui appliquent chacun une migration sur la même base produisent exactement le genre de dégât que la parallélisation est censée éviter.

Décisions :

1. `worktree.baseRef` réglé sur `head` : un lot part de l'état de travail courant, pas du dépôt distant.
2. `.worktreeinclude` reprend `.env` et `.env.local`, absents d'une copie fraîche.
3. **Un jeu de ports et un nom de composition par worktree**, alloués automatiquement au démarrage de session par un hook (`SessionStart`), qui écrit `.env.local` avec `COMPOSE_PROJECT_NAME`, le port applicatif, celui de la base et celui du moteur de recherche. Sans ce mécanisme, le deuxième agent lancé échoue sur un port occupé — ou, pire, écrit dans la base du premier.
4. **Les lots qui portent une migration ne sont jamais parallélisés.** Ils sont marqués comme tels dans le contrat de tâche.
5. `.claude/worktrees/` est ignoré par git.

### 7.5 Les hooks

Sept contraintes mécaniques, pas une de plus. Un harnais de hooks bavard finit désactivé.

| Événement | Filtre | Ce qu'il fait | Pourquoi mécanique plutôt que consigne |
|---|---|---|---|
| `PostToolUse` | `Edit\|Write` sur `*.svelte`, `*.css` | Contrôle des jetons sur le fichier touché ; sortie 2 en cas de valeur en dur | RG-DA-01 est la contrainte la plus facile à enfreindre sans s'en apercevoir, et la plus coûteuse à rattraper (R-06) |
| `PostToolUse` | `Edit\|Write` | Format et correction de style, en tâche de fond | Supprime une classe entière d'allers-retours |
| `SubagentStop` | `implementeur` | Lance `pnpm verify:lot` ; sortie 2 renvoie l'agent au travail avec le rapport | Un lot n'est pas terminé parce que l'agent le croit |
| `Stop` | — | Vérifie que le journal de vague a été mis à jour ; sortie 2 sinon | La capitalisation différée n'a jamais lieu |
| `SessionStart` | — | Affiche vague courante, lot en cours, critères rouges ; alloue les ports du worktree | Le dépôt est la mémoire ; la session démarre en la lisant |
| `PreCompact` | — | Consigne l'état de la tâche dans le journal avant compaction | Ce qui n'est pas écrit disparaît à la compaction |
| `WorktreeCreate` | — | Prépare l'environnement de la copie : dépendances, `.env.local`, semence | Sans cela, le premier geste de chaque agent parallèle est le même travail répété |

Les hooks `PostToolUse` sur `Edit|Write` s'appliquent aussi aux sous-agents : c'est leur intérêt principal — la contrainte suit l'agent partout, y compris là où personne ne regarde.

### 7.6 Convergence, cadence et rituels

**`/goal` — la convergence intra-lot.** Une fois la gate passée et le plan approuvé, la condition d'arrêt est posée et l'agent travaille jusqu'à ce qu'elle tienne :

```
/goal les critères du contrat T-023 sont tous verts : `pnpm verify:lot T-023` sort en 0,
et `pnpm verif:maquette V-14` est conforme sur les quatre états déclarés,
sans modification de cadrage/, mockups/ ni guide/
```

Deux propriétés à connaître : l'évaluateur ne lit que la conversation — il n'exécute rien —, donc la condition doit être **démontrable par ce que l'agent affiche** ; et le verdict « impossible » est un verdict légitime, qui doit être traité comme une remontée, pas comme un échec à contourner.

**`/loop` — la cadence.** Pour ce qui prend du temps sans demander d'attention continue : un lot d'import de plusieurs centaines de fichiers, une mesure de volumétrie, une réindexation complète. En cadence choisie par l'agent plutôt qu'à intervalle fixe, avec le rappel que les tâches de session expirent au bout de sept jours et ne survivent pas à une nouvelle conversation.

**Les skills — les rituels du cycle rendus exécutables.** Un rituel que l'on doit se rappeler d'appliquer n'est pas appliqué :

| Skill | Ce qu'elle fait |
|---|---|
| `/gate T-xxx` | Pose les quatre questions, affiche le contrat, refuse de continuer sans quatre réponses positives (§8) |
| `/lot T-xxx` | Ouvre le lot : branche, worktree, contrat en contexte, plan, condition d'arrêt |
| `/verif V-xx` | Exécute le protocole d'acceptation visuelle et rend le verdict par état |
| `/capitaliser` | Extrait les apprentissages de la session, propose les modifications de harnais, met à jour le journal (§10) |
| `/cloture-vague` | Enchaîne batterie complète, revue outillée, rapport, question de clôture |

### 7.7 Le mode d'exécution découle de la criticité

**Décision du 16 août 2026 : autonomie complète, sans vérification humaine intermédiaire.** L'humain n'est plus dans la boucle d'exécution ; il arbitre en amont et réceptionne en aval. La criticité ne module donc plus la présence humaine — elle module **l'intensité de la vérification machine**. C'est le seul report possible : ce que l'humain ne vérifie plus doit être vérifié par autre chose, sans quoi rien ne l'est.

| Criticité | Ce que fait l'agent d'exécution | Vérification appliquée | Mécanismes |
|---|---|---|---|
| **Haute** | Plan écrit et consigné au contrat avant toute écriture ; implémentation par petits pas ; un commit par comportement vérifié | **Trois vérificateurs indépendants à lentilles distinctes** — conformité à la spec, accès et périmètre en mode adversarial, honnêteté des tests par épreuve de mutation. Une seule réfutation bloque le lot | Advisor actif, pas de parallélisation, `/goal`, revue outillée systématique |
| **Moyenne** | Implémente en autonomie, points de contrôle consignés au journal | **Deux vérificateurs** : conformité à la spec, honnêteté des tests | `/goal`, worktree, `SubagentStop`, revue outillée en fin de vague |
| **Basse** | Implémente, éventuellement en éventail | **Un vérificateur**, distinct de l'agent qui a produit le code | Workflow, worktrees |

Trois règles rendent ce report crédible :

1. **Celui qui écrit ne vérifie jamais.** Un agent qui relit son propre travail confirme son propre travail.
2. **Le vérificateur est adversarial**, pas confirmatoire : sa consigne est de réfuter, et un rapport « rien trouvé » n'a de valeur que s'il énumère ce qui a été tenté.
3. **L'épreuve de mutation remplace la lecture humaine des tests.** Sur criticité haute, un agent casse volontairement le comportement testé : si la batterie reste verte, le test est un faux témoin et le lot repart.

**Le nombre de vérificateurs ne se choisit jamais à l'humeur ni au vu des succès récents.** C'est la parade à la dérive : elle naît des séries de réussites, et la confiance ne se capitalise pas d'une tâche à l'autre. Sans humain dans la boucle, cette règle cesse d'être une discipline et devient la seule chose qui tienne.

### 7.8 Ce qui est écarté, et pourquoi

| Écarté | Motif |
|---|---|
| **Équipes d'agents** (sessions pairs coordonnées) | Expérimental et désactivé par défaut ; pas de reprise de session pour les coéquipiers en cours ; coût en jetons proportionnel au nombre de sessions. Surtout : leur valeur est la **discussion entre agents**, or ici le DAG et les contrats suppriment le besoin de discussion. Un éventail de workflow donne le parallélisme sans la coordination |
| **Ultracode systématique** | Fait planifier un workflow pour chaque tâche substantielle. La plupart des lots sont bornés et n'ont rien à éventer ; le coût ne serait pas payé en qualité. Le mot-clé reste disponible au cas par cas |
| **Canaux** (événements poussés dans la session) | Recherche préliminaire ; utile pour réagir à un système externe, ce que ce projet n'a pas. Rien à recevoir tant qu'il n'y a ni intégration continue distante ni supervision |
| **Routines en nuage** | Exécution sur clone distant : suppose un dépôt hébergé, ce qui n'est pas décidé (§15, point 1). À reconsidérer si le dépôt est poussé |
| **Pilotage d'interface par ordinateur** | Playwright couvre la totalité de la vérification d'interface de ce projet, de façon reproductible. Un pilotage manuel ajouterait de la variance là où l'on cherche un critère |
| **Serveurs MCP externes** | Aucun besoin identifié : tout ce que les agents doivent atteindre est dans le dépôt ou dans la composition locale. Cohérent avec l'esprit de C-11 |
| **Équipes d'agents**, deuxième motif | Ajouté après décision d'autonomie complète : leur intérêt supposait un humain qui arbitre les désaccords entre pairs. Sans lui, un désaccord non tranché est une impasse |

**Sur `bypassPermissions`.** Ce document proposait initialement de l'exclure, au motif qu'il annulerait les protections du §3.5. **C'était faux, et la correction est structurante** : les règles de refus s'appliquent dans tous les modes, `bypassPermissions` compris ; seules les règles d'autorisation deviennent sans effet, puisque tout est déjà autorisé. Le mode retenu le 16 août 2026 est donc `bypassPermissions`, et `cadrage/`, `mockups/` et `guide/` restent protégés mécaniquement. Un agent en autonomie complète ne peut pas modifier la référence qui l'accepte — c'est précisément ce qui rend l'autonomie complète tenable.

---

## 8. La gate — les quatre questions instanciées

Avant tout lancement d'agent sur un lot, quatre questions, toutes exigeant une réponse positive. Une réponse négative renvoie en amont — elle ne se contourne pas en « surveillant de plus près ».

| # | Question | Ce qu'elle audite | Instanciation dans ce projet |
|---|---|---|---|
| 1 | L'objectif est-il explicite et sans ambiguïté ? | Le contrat de tâche | Le contrat cite ses `UC-` et `RG-`, sa ou ses vues, et l'état de maquette de chacune. Si une exigence citée n'est illustrée par aucun état de maquette, la réponse est **non** |
| 2 | Les contraintes et critères d'acceptation sont-ils formalisés ? | Le contrat de tâche | Chaque exigence du lot a sa batterie (§5) ou sa clé d'état (§4.2). Une exigence sans critère exécutable : **non**, le lot retourne en découpe |
| 3 | L'agent dispose-t-il des outils pour implémenter, tester et corriger seul ? | Le harnais | Composition démarrable, semence chargeable, `pnpm verify:lot` opérationnel, banc de comparaison en état, journaux accessibles par Monitor. Un seul manquant : **non** |
| 4 | Le résultat sera-t-il explicable, évaluable et validable ? | La dette de compréhension | **Re-ancrée après la décision d'autonomie complète.** L'humain ne lisant plus le code au fil de l'eau, la question ne peut plus porter sur ce qu'il comprend : elle porte sur ce que le dépôt conservera. Le lot déclare, avant de s'ouvrir, quelle trace il laissera — quel ADR, quelle entrée de journal, quels critères exécutables. Un lot qui ne laisse qu'un diff vaut **non** |

La skill `/gate T-xxx` pose les quatre questions, affiche le contrat et refuse d'ouvrir le lot sans quatre réponses positives. La date et l'issue sont inscrites au contrat.

**La gate est désormais auto-administrée.** Elle est passée par l'agent d'orchestration, pas par l'humain — mais elle ne perd son intérêt que si elle devient une formalité. Deux garde-fous : les réponses sont **écrites au contrat**, donc relisables et opposables ; et une réponse négative n'ouvre pas le lot « avec vigilance », elle renvoie en amont. Un lot ouvert sur trois réponses positives est un défaut de dispositif, pas un raccourci.

---

## 9. La vérification

**Décision du 16 août 2026 : il n'y a pas de vérification humaine intermédiaire.** Le guide fait de la revue humaine le goulot assumé du cycle ; ce projet s'en écarte délibérément et le report est intégral vers la machine. La section ci-dessous décrit ce qui remplace la lecture humaine — non pas rien, mais un dispositif qui doit être au moins aussi exigeant, parce que plus personne ne rattrapera ce qu'il laisse passer.

**Ce que l'humain garde.** L'arbitrage en amont — les décisions du §15, les écarts remontés par le diff retour, toute modification de `cadrage/`, `mockups/` ou `guide/` — et la réception en aval, sur le rapport de fin de vague. Rien entre les deux.

**L'ordre de vérification reste strict**, mais il est exécuté par des agents distincts, chacun sur sa lentille :

1. **Conformité à la spec.** L'implémentation fait-elle ce que `RG-…` demande, ni plus ni moins ? Le vérificateur lit le contrat et le code, jamais le résumé de l'agent qui a produit le lot.
2. **Honnêteté des tests.** Un test se lit comme du code suspect, pas comme une preuve. Sur criticité haute, la lecture est remplacée par une **épreuve de mutation** : casser volontairement le comportement testé ; si la batterie reste verte, le test est un faux témoin et le lot repart.
3. **Étanchéité**, pour tout lot touchant les droits, le périmètre public ou l'index : un agent adversarial dont le succès est de trouver une faille, pas de confirmer qu'il n'y en a pas.
4. **Conformité de rendu**, par le protocole du §4.

**Le nombre de vérificateurs est fixé par la criticité inscrite au contrat** (§7.7), jamais par la qualité des lots précédents. Il n'y a plus d'échantillonnage : ce qui n'est pas vérifié n'est vérifié par personne.

**Ce qui n'est jamais délégué**, sous aucune criticité : l'arbitrage d'un écart entre maquette et spec ; la décision de modifier une source de vérité ; les décisions du §15. Le harnais l'impose mécaniquement — les règles de refus s'appliquent aussi en `bypassPermissions`.

**La question de clôture change de porteur.** Elle ne peut plus être « est-ce que je comprends encore ce système ? », puisque personne ne lit plus le code au fil de l'eau. Elle devient : **le dépôt suffirait-il à réexpliquer ce lot sans le rouvrir ?** Contrat, journal de vague, ADR et commentaires du code sont la mémoire externalisée ; si l'un d'eux manque, la dette de compréhension s'installe sans témoin. Un agent dédié pose la question à chaque clôture de lot et refuse la clôture si la réponse est non.

**Signaux d'érosion**, relevés au journal à chaque clôture de vague. Deux signaux ou plus : la vague suivante repasse en vérification renforcée — nombre de vérificateurs porté au niveau supérieur pour toutes les criticités — jusqu'à extinction des signaux.

- Les écarts remontés par les vérificateurs tombent à zéro sur une vague entière — un dispositif qui ne trouve plus rien est plus probablement aveugle qu'irréprochable.
- Le taux de recours au niveau 3 de la comparaison visuelle augmente sans cause identifiée.
- Les specs n'ont pas bougé depuis plusieurs vagues alors que le code, si.
- Un lot est rouvert après clôture — le dispositif l'avait donc accepté à tort.
- Le journal de vague se réduit d'une vague à l'autre.

**Le risque résiduel est nommé, pas résolu.** Sans lecteur humain, une erreur qu'aucun critère exécutable ne couvre traverse le dispositif sans être vue. La contre-mesure est en amont, dans le catalogue du §5 : la qualité du produit est désormais exactement la qualité de ses critères. C'est l'arbitrage qui a été rendu, et le rapport de fin de vague le rappelle à chaque livraison.

---

## 10. La capitalisation

Chaque session produit des apprentissages : erreurs récurrentes de l'agent, ambiguïtés de spec révélées, pièges d'environnement. **La boucle est fermée quand les échecs de l'agent améliorent la documentation du dépôt** — c'est-à-dire quand le harnais devient persistant là où chaque session est sans mémoire.

| Nature de l'apprentissage | Destination | Exemple |
|---|---|---|
| Piège d'environnement, convention non évidente | `CLAUDE.md` §6 | « L'index de recherche doit être attendu explicitement en test, jamais par temporisation » |
| Décision d'architecture ou interdiction | `docs/adr/` | Un motif de requête proscrit après incident |
| Pattern d'interface, précision de jeton | `docs/DESIGN.md` | Le comportement exact de la jauge de fraîcheur à 360 px |
| Écart de spec révélé | `cadrage/` — **par arbitrage humain uniquement** | Un état non prévu par le cahier des charges, découvert en implémentant |
| Fait de déroulement | `docs/journal/Vn.md` | Lots livrés, écarts, temps, incidents, recours au niveau 3, coût |

**Trois mécanismes rendent la capitalisation effective plutôt que vertueuse :**

1. La skill `/capitaliser`, appelée à la fin de chaque lot, qui propose les modifications de harnais — l'humain arbitre, l'agent rédige.
2. Le hook `Stop`, qui refuse de clore une session dont le journal n'a pas bougé.
3. La **mémoire de portée projet** du rôle `verificateur-specs` : les ambiguïtés qu'il a rencontrées lui reviennent d'une vague à l'autre, ce qu'aucune session neuve ne peut faire.

**Le rapport de fin de vague** est publié en page consultable et remis au commanditaire : lots livrés, exigences couvertes, écarts arbitrés, batteries vertes et rouges, budget consommé, décisions en attente.

---

## 11. Le diff retour maquettes ↔ specs

C'est le point de discipline qui décide si le système tient dans la durée, et c'est la phase qui manque au projet.

**Le problème.** Les 41 maquettes ont été produites à partir du brief, puis itérées. L'itération visuelle fait toujours émerger des choses que le texte n'avait pas prévues : un filtre nécessaire, un état non listé, une navigation repensée, un libellé plus juste. L'inspection des fichiers gelés le confirme : les planches de revue exposent des variantes — bandeau de resynchronisation, existence du registre opérationnel, dégradation du mode Sens — dont la combinatoire exacte n'est pas écrite dans le cahier des charges. Tant que ces découvertes restent dans les maquettes, **les maquettes sont source de vérité de fait pendant que le cahier des charges vieillit** — et les contrats de tâche, qui citent le cahier des charges, deviennent faux sans que personne ne le voie.

**Le traitement.** T-008, en vague 0, exécute le workflow `/diff-retour` : un agent par vue, chacun confrontant la maquette gelée à sa section de brief et aux règles de gestion citées, puis une synthèse dédoublonnée. Chaque écart est classé :

| Classe | Ce que c'est | Traitement |
|---|---|---|
| **Précision** | La maquette détaille ce que la spec laissait ouvert | Remonte dans le cahier des charges comme précision, sans arbitrage lourd |
| **Ajout** | La maquette fait quelque chose que la spec ne prévoit pas | **Arbitrage humain** : soit la spec s'enrichit, soit la maquette est corrigée et regelée |
| **Contradiction** | La maquette contredit une règle de gestion | **Arbitrage humain obligatoire**, avec trace. Aucun contrat de tâche ne peut être écrit sur une vue en contradiction |
| **Manque** | La spec exige quelque chose que la maquette ne montre pas | Complément de maquette, en régime assisté, puis regel. Premier cas traité : V-07, absente, produite le 16/08/2026 (§1.2, point 6) |

**Deux contradictions ont déjà été trouvées, sans attendre T-008**, en rendant les maquettes dans un navigateur plutôt qu'en les lisant. Elles portent sur la coquille, donc sur les vingt-cinq vues de l'espace de travail et de la console :

| # | Écart | Effet | Portée |
|---|---|---|---|
| **E-01** | En dessous de 1240 px, le rail passe en `display: none` mais la grille conserve deux pistes (`0 minmax(0,1fr)`). Un élément masqué ne consomme plus sa piste : le contenu se place dans la piste de largeur nulle | La colonne de contenu tombe à 0 et toute la page déborde. **Le produit est inutilisable en dessous de 1240 px** — contradiction frontale avec RG-M18-12 (« utilisable de 360 px ») et RG-M18-13, l'un des dix points durs du brief | Toutes les vues portant la coquille, V-37 comprise |
| **E-02** | Le même motif s'applique au mode concentration (`[data-rail="ferme"]`) | Le bouton de repli de la navigation vide l'écran de son contenu, **à toute largeur** | Idem |

Le correctif est d'une ligne par vue — une seule piste de grille au lieu de deux — et il est appliqué dans V-07. Les quarante autres maquettes étant gelées, leur correction relève de l'arbitrage (§15, point 8), pas d'une session d'exécution.

Ces deux écarts disent quelque chose du dispositif : ils étaient invisibles à la lecture et évidents au rendu. C'est exactement ce que la boucle d'acceptation visuelle du §4 est censée intercepter — et l'argument pour l'installer en vague 0 plutôt qu'au fil de l'eau.

**Ce que le diff retour aurait produit** : une liste d'écarts arbitrés, les mises à jour de `cadrage/` correspondantes, les regels éventuels.

### Ce qui se passe puisqu'il n'a pas lieu (D-08)

La part mécanisable est livrée et rejouable : `pnpm diff-retour` confronte les états déclarés au brief aux états que chaque planche sait atteindre. La part interprétative — lire chaque maquette contre sa section de brief et les règles qu'elle cite — n'est pas faite, par décision.

**Ce n'est pas un vide, c'est une résolution par défaut.** L'ordre de préséance du §0 dit déjà qui gagne : *Maquettes > Cahier des charges*. Une contradiction non arbitrée est donc tranchée en faveur de la maquette, sans que personne ne l'ait décidé pour ce cas précis. Trois conséquences, énoncées ici pour qu'elles soient lisibles plus tard :

1. **Le cahier des charges vieillit là où les maquettes divergent.** Il reste la référence du *quoi*, mais cesse de l'être du *comment ça se présente* partout où une maquette a tranché autrement.
2. **Un contrat de tâche qui cite une règle contredite par sa maquette cite une règle fausse.** La règle de non-comblement s'applique alors à l'envers : l'agent ne comble pas, il constate, et implémente ce que montre la maquette.
3. **L'écart se découvre à l'implémentation** plutôt qu'en amont — au moment où il coûte le plus cher, mais il se découvre : la conformité de rendu au gel est un critère d'acceptation de chaque lot (§4). C'est la seule chose qui rattrape l'absence de diff retour, et elle ne rattrape que ce qui se voit à l'écran.

**Deux écarts sont déjà connus**, trouvés incidemment et non par une recherche systématique. Ils sont tranchés par l'ordre de préséance, comme tous ceux qu'on trouvera :

| Écart | Ce que dit la spec | Ce que fait la maquette | Résolution par préséance |
|---|---|---|---|
| Bascule en mots-clés | RG-M02-01 : « bascule **silencieusement** » | V-08 et V-09 affichent un bandeau « Recherche par sens indisponible — résultats en mots-clés » | La maquette. Le bandeau est implémenté |
| Mode concentration | M03.1 décrit une barre latérale permanente ; le mot n'apparaît pas au cahier des charges | V-37 escamote le rail sur grand écran, avec bouton dédié | La maquette. Le mode est implémenté |

Le coût de cette phase est le point ouvert n° 2 du guide. Ici, il est concentré une fois en amont — ce qui est le bon moment : les 41 vues existent déjà, il n'y aura pas de gel supplémentaire à traiter au fil de l'eau, sauf correction.

---

## 12. Risques propres à la réalisation agentique

Distincts des six risques techniques de la pile (R-01 à R-06), qui restent valables.

| # | Risque | Effet | Traitement |
|---|---|---|---|
| **RA-01** | Tests complaisants : l'agent écrit un test qui valide son propre défaut | Une batterie verte qui ne prouve rien — le pire des états, car il désarme la vigilance | Celui qui écrit ne vérifie pas (§7.2) ; les tests se lisent avant le diff (§9) ; sur les lots de criticité haute, épreuve de mutation : casser volontairement le comportement, le test doit rougir |
| **RA-02** | Dérive du système visuel : valeurs en dur, composant inventé | Perte du caractère systémique de la charte (RG-DA-01) | Hook de contrôle des jetons à chaque écriture ; inventaire fermé dans `DESIGN.md` ; V-41 page réelle, où la divergence devient visible immédiatement |
| **RA-03** | Dette de compréhension : le système fonctionne et devient opaque à son mainteneur | Le risque de fond du développement solo agentique | Question 4 de la gate en amont, question de clôture en aval, ADR et journal en continu ; indicateur honnête : temps de localisation sans agent |
| **RA-04** | Conflits de parallélisation | Travail perdu, migrations concurrentes | Règle de ressource exclusive (§6.4) ; worktrees ; jamais deux lots à migration en parallèle |
| **RA-05** | Collision d'infrastructure entre copies de travail : ports, base, index partagés | Un agent écrit dans la base d'un autre — dégât silencieux | Allocation automatique de ports et de nom de composition par worktree (§7.4) |
| **RA-06** | Faux positifs de la comparaison visuelle | Perte de confiance dans le critère, puis abandon du critère | Horloge gelée, polices locales, animations coupées, masques déclarés, tolérance graduée à trois niveaux (§4.2) ; taux de recours au niveau 3 suivi par vague |
| **RA-07** | Coût en jetons non maîtrisé | Budget consommé sans rapport avec la valeur produite | Workflows réservés aux éventails sur inventaire connu ; garde-fou de taille explicite ; modèles économiques pour les rôles mécaniques ; relevé du coût par vague dans le journal |
| **RA-08** | L'agent comble un vide de spec au lieu de le remonter | Le produit s'éloigne du cahier des charges sans trace | Règle de non-comblement en tête de `CLAUDE.md` ; rôle `verificateur-specs` à mémoire projet ; toute décision prise en exécution est traitée comme un défaut de contrat |
| **RA-09** | Non-déterminisme de l'index de recherche en test | Batterie instable, donc désactivée « en attendant » | Indexation attendue explicitement, jamais par temporisation ; réindexation complète avant les batteries 6 et 12 |
| **RA-10** | Interruption d'un workflow au mauvais moment | Travail refait, jeton dépensé deux fois | Éventails larges plutôt que chaînes longues ; états intermédiaires écrits dans le dépôt, jamais seulement dans le script |
| **RA-11** | Perte de contexte de session | La consigne implicite disparaît, l'agent repart de travers | Le dépôt est la mémoire : contrat, journal, condition d'arrêt écrits avant de commencer ; hook `PreCompact` ; hook `SessionStart` qui relit l'état |
| **RA-12** | Les maquettes dépendent d'une fonderie externe | Contradiction avec RG-NF-08, et variance de rendu dans la comparaison | Rapatriement local des trois familles, réécriture de la source des polices dans le harnais de capture (§4.2, §15 point 8) |

---

## 13. Méthode de vérification des capacités d'outillage

Comme pour les versions de la pile technique, les capacités d'orchestration citées ici ont été vérifiées par consultation directe de la documentation officielle le **16 août 2026**, et non de mémoire.

| Source consultée | Vérifié |
|---|---|
| Index de documentation (`llms.txt`) | Inventaire exhaustif des pages, pour ne pas ignorer une capacité récente |
| Page « workflows dynamiques » | Modèle de script, plafonds de concurrence, garde-fou de taille, enregistrement et paramétrage, règle de reprise |
| Page « sous-agents » | Champs de définition, exécution en tâche de fond, profondeur d'imbrication, sélection de modèle, reprise par message |
| Page « équipes d'agents » | Statut expérimental, activation, limites — base de la décision de §7.8 |
| Référence des hooks | Liste complète des événements, types de gestionnaires, sémantique des codes de sortie |
| Page « worktrees » | Création, base de branchement, `.worktreeinclude`, isolation des sous-agents, nettoyage |
| Pages « objectif » et « tâches programmées » | Mécanique de `/goal`, ce que l'évaluateur peut et ne peut pas voir ; cadences, expiration à sept jours |
| Pages « advisor » et « canaux » | Conditions d'emploi et statut, base des décisions de §7.1 et §7.8 |
| Digest hebdomadaire, semaines 13 à 32 de 2026 | Recensement des capacités apparues depuis mars 2026, pour n'en écarter aucune sans l'avoir examinée |

**Cinq constats ont modifié la proposition initiale :**

1. Les équipes d'agents, séduisantes sur le papier, sont expérimentales, sans reprise de session, et leur valeur propre — la discussion entre pairs — est sans objet quand le DAG et les contrats suppriment le besoin de coordination. Écartées.
2. La reprise d'un workflow rejoue tout ce qui a démarré après le premier agent non terminé : cela commande d'écrire des éventails larges plutôt que des chaînes longues.
3. L'évaluateur de `/goal` ne lit que la conversation et n'exécute rien : les conditions d'arrêt doivent être formulées comme démontrables à l'écran.
4. Le garde-fou de taille des workflows vise moins de quinze agents par défaut : les trois workflows en éventail large de §7.3 demandent un réglage explicite.
5. Le mode d'autorisation automatique est devenu le mode par défaut des nouvelles sessions le 14 août 2026 : les règles de refus du §3.5 cessent d'être une précaution théorique pour devenir la protection effective des sources de vérité.

---

## 14. Les six points ouverts du guide, tranchés pour le pilote

Le guide annonce six points à trancher sur son premier projet. Chacun reçoit ici une hypothèse et un indicateur qui dira si elle était bonne.

| # | Point ouvert | Hypothèse retenue | Ce qu'on relève pour la trancher |
|---|---|---|---|
| 1 | Granularité réelle d'un contrat de tâche | Une tranche verticale, une dizaine de fichiers, une session, un critère exécutable par exigence (§6.1) | Nombre de lots rouverts après clôture ; nombre de lots ayant débordé d'une session |
| 2 | Coût du diff retour | Concentré une fois en amont, en éventail (§11) — les gels sont tous faits, il n'y aura pas de flux | Durée et coût de T-008 ; nombre d'écarts par classe ; nombre de regels |
| 3 | Seuils de criticité | La grille §6.2, avec remontée définitive d'une catégorie dès le premier incident | Incidents constatés en revue sur des lots classés basse ou moyenne |
| 4 | Tenue du préambule commun | Sans objet ici — les maquettes sont gelées et `socle.css` est unique. Remplacé par le contrôle mécanique des jetons | Nombre de violations interceptées par le hook, par vague : une tendance croissante signalerait une dérive du harnais, pas de l'agent |
| 5 | Fiabilité de la boucle de comparaison visuelle | Protocole à trois niveaux, conditions de capture strictes (§4.2) | Taux de recours au niveau 3 et taux de faux positifs, par vague |
| 6 | ~~Charge de vérification humaine par vague~~ **Coût de la vérification machine** | Le point ouvert du guide supposait un humain dans la boucle ; D-01 l'en retire. Il devient : le dispositif de §7.7 et §9 rattrape-t-il ce que la lecture humaine attrapait ? | Écarts trouvés par vérificateur et par lentille ; lots rouverts après clôture ; jetons consommés par la vérification, rapportés à ceux de l'implémentation |

Ces six indicateurs figurent au journal de vague (annexe C). Ils sont la contribution de ce pilote à la méthode : sans eux, la note de référence resterait v1 non éprouvée après le projet comme avant.

---

## 15. Décisions rendues et arbitrages ouverts

### 15.1 Décisions rendues le 16 août 2026

| # | Décision | Ce qu'elle emporte |
|---|---|---|
| **D-01** | **Autonomie complète, sans vérification humaine intermédiaire** | L'humain arbitre en amont et réceptionne en aval, rien entre les deux. Le report est intégral vers la vérification machine : §7.7 fixe le nombre de vérificateurs par criticité, §9 décrit le dispositif et nomme le risque résiduel. Conséquence directe : **la qualité du produit devient exactement la qualité des critères exécutables du §5** |
| **D-02** | **Mode d'autorisation `bypassPermissions`** | Exécution continue, sans invite. Les règles de refus restant actives dans tous les modes, `cadrage/`, `mockups/` et `guide/` demeurent protégés mécaniquement — c'est ce qui rend D-01 tenable. Configuré dans `.claude/settings.json` |
| **D-03** | **Dépôt hébergé sur GitHub** — `ElegArtech/codicillus` | Ouvre la revue outillée sur demande de fusion, la revue multi-agents en nuage et les routines programmées. La branche de travail devient l'unité de livraison d'un lot |
| **D-04** | **Correction des défauts de coquille et regel** | Les quatre défauts E-01 à E-04 sont corrigés sur les 41 vues : le produit tient à 360 px sans défilement horizontal, le mode concentration fonctionne. Mesuré avant et après, sans régression à 1440 px. `mockups/GEL.md` enregistre le regel |
| **D-05** | **Polices rapatriées en local** | Les 41 maquettes ne dépendent plus d'une fonderie distante (RG-NF-08), et la comparaison de rendu cesse de mesurer une différence de fonderie |
| **D-06** | **Docker retenu sur la machine d'accueil** | La composition à cinq services de la pile technique est confirmée ; T-003 peut s'ouvrir |
| **D-07** | **Nom du produit : Codicillus** — et « Fiche » pour le concept renommable | Tranché par l'usage bien avant d'être posé en question : c'est le nom du dépôt, celui des 41 maquettes et celui des quatre documents de cadrage. Le cahier des charges le listait comme nom de travail le 13 août ; il ne l'est plus. Le libellé « fiche » reste un paramètre de configuration (M14.7), modifiable sans toucher au code |
| **D-08** | **La part interprétative du diff retour n'est pas faite** | Décision du commanditaire. Seule la part mécanisable est livrée (`pnpm diff-retour`). Conséquence mécanique, détaillée en §11 : l'ordre de préséance tranche seul les contradictions, en faveur des maquettes, et le cahier des charges vieillit là où elles divergent |

### 15.2 Arbitrages encore ouverts

Aucun ne bloque l'ouverture de la vague 1.

| # | Arbitrage | Échéance | Proposition par défaut |
|---|---|---|---|

| A-02 | **Périmètre de la première version** | Avant la vague 6 | Tout garder. §6.5 donne les lots détachables et le coût de chaque retrait — celui de T-039 fait perdre le différenciateur « point de défaillance unique » |
| A-03 | **Cadence et plafond de jetons par vague** | Après la vague 0, sur chiffres réels | Relevé au journal de vague, décidé au vu de la vague 0 |
| A-04 | **Répartition des modèles et de l'effort** | Révisable en continu | Orchestration et implémentation sur le modèle le plus capable à effort élevé ; rôles mécaniques sur un modèle économique ; second avis activé sur criticité haute |
| A-05 | **Relais de messagerie** pour la réinitialisation de mot de passe | Avant la vague 8 (T-047) | Retenir M14.6 — mot de passe temporaire affiché une seule fois par l'administrateur — si aucun relais n'est disponible |
| A-06 | **Volumétrie et formats du patrimoine à reprendre** | Avant la vague 7 | Conditionne R-03 : éprouver Pandoc sur un échantillon réel avant la vague d'import |
| A-07 | **Modèle d'embeddings**, **seuil de bascule cartographique** | Après mesure (R-04, R-01) | Paramètres, décisions réversibles |
| A-08 | **TypeScript 6 → 7.1**, **Drizzle 0.45 → 1.0** | À la sortie stable | Recommandations déjà posées à la pile technique §11 |

---

## 16. Annexes — templates et configurations de référence

### A. Contrat de tâche

```markdown
# Tâche T-023 — Lecture d'une note

- Vue(s) : V-14 — maquette gelée : mockups/V-14-lecture-note.html (gel du jj/mm/aaaa, empreinte …)
- Exigences : UC-M04-01, UC-M04-02, UC-M04-03, RG-M04-01…07, RG-M18-03, RG-M18-17
- Dépend de : T-014, T-016, T-013
- Criticité : moyenne  →  mode : délégation avec plan approuvé
- Ressources exclusives : aucune (pas de migration)  →  parallélisable
- Pointeurs de harnais : CLAUDE.md §3 (vocabulaire), §5 (principes) · DESIGN.md §composants de lecture · ADR-001, ADR-003, ADR-005, ADR-011

## Critères d'acceptation exécutables
- [ ] `pnpm verify:lot T-023` sort en 0
- [ ] `pnpm verif:maquette V-14` conforme sur : nominal-ecriture, lecture-seule,
      bandeau-revision, bandeau-brouillon, bandeau-resync, sans-operationnel, chargement
- [ ] Batterie 9 : les huit panneaux de la colonne droite rendent leurs trois états
- [ ] Batterie 10 : axe sans violation ; sommaire atteignable au clavier
- [ ] Batterie 15 : impression sans navigation ni panneaux, adresses des liens en note
- [ ] Comportement non capturable en image : la copie d'un bloc de code produit un texte brut
      sans numéro de ligne ni retour chariot Windows (RG-M04-05) — test dédié

## Hors périmètre de cette tâche
Édition (T-020), historique (T-035), relations (T-037). Aucune de ces actions n'est
implémentée ici, même partiellement, même « pour préparer ».

## Gate
Passée le jj/mm/aaaa — 4/4 — go

## Points de contrôle
1. Structure et sommaire  2. Bandeaux et sélecteur de registre  3. Panneaux et leurs états

## Condition d'arrêt (/goal)
« Tous les critères ci-dessus sont verts, sans modification de cadrage/, mockups/ ni guide/ »
```

### B. Gate — checklist

```markdown
- [ ] 1. Objectif explicite : exigences citées, vues citées, états de maquette identifiés
- [ ] 2. Critères formalisés : chaque exigence a sa batterie ou sa clé d'état
- [ ] 3. Outillage disponible : composition démarrable, semence chargeable,
         `pnpm verify:lot` opérationnel, banc de comparaison en état, journaux accessibles
- [ ] 4. Capacité à expliquer, évaluer et valider le résultat
→ 4/4 requis. Toute case vide renvoie en amont : contrat, harnais, ou compréhension.
```

### C. Journal de vague

```markdown
# Vague n — intitulé
Ouverte le … · close le …

## Lots
| Lot | État | Rouvert ? | Sessions | Écarts remontés |

## Écarts arbitrés
| Écart | Classe | Décision | Trace |

## Batteries
| Batterie | Verte | Remarque |

## Indicateurs du pilote (§14)
- Lots rouverts : …           - Débordements d'une session : …
- Écarts de diff retour : …   - Incidents sur lots basse/moyenne : …
- Recours au niveau 3 : … %   - Faux positifs visuels : …
- Écarts trouvés par lentille : …  - Jetons : implémentation … / vérification …

## Capitalisation
| Apprentissage | Destination | Fait |

## Question de clôture
Le dépôt suffirait-il à réexpliquer chaque lot de cette vague sans le rouvrir ?
→ réponse, et décision qui en découle
```

### D. `.claude/settings.json` de référence

```json
{
  "permissions": {
    "deny": [
      "Edit(cadrage/**)", "Write(cadrage/**)",
      "Edit(guide/**)", "Write(guide/**)",
      "Edit(mockups/**)", "Write(mockups/**)"
    ],
    "allow": [
      "Bash(pnpm *)", "Bash(git status)", "Bash(git diff*)", "Bash(git log*)",
      "Bash(docker compose *)", "Bash(npx playwright *)"
    ]
  },
  "worktree": { "baseRef": "head" },
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/jetons.sh",
            "statusMessage": "Contrôle des jetons…", "timeout": 20 },
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format.sh",
            "async": true }
        ] }
    ],
    "SubagentStop": [
      { "matcher": "implementeur",
        "hooks": [ { "type": "command",
                     "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/verif-lot.sh",
                     "timeout": 600 } ] }
    ],
    "SessionStart": [
      { "hooks": [ { "type": "command",
                     "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/etat-harnais.sh" } ] }
    ],
    "PreCompact": [
      { "hooks": [ { "type": "command",
                     "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/journal.sh" } ] }
    ],
    "WorktreeCreate": [
      { "hooks": [ { "type": "command",
                     "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/preparer-copie.sh",
                     "timeout": 600 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "prompt", "timeout": 30,
                     "prompt": "Le journal de vague a-t-il été mis à jour pour le travail de cette session ? Réponds par la décision seule. $ARGUMENTS" } ] }
    ]
  }
}
```

### E. Définition de rôle — `verificateur-acces`

```markdown
---
name: verificateur-acces
description: Cherche activement un chemin d'accès à un contenu qui devrait être interdit. À employer sur tout lot touchant les droits, le périmètre public ou l'index de recherche.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: inherit
effort: high
memory: project
color: red
---

Tu es un attaquant, pas un auditeur. Ton succès est de **trouver une faille**, jamais de
confirmer qu'il n'y en a pas. Un rapport « rien trouvé » n'a de valeur que s'il énumère
ce que tu as réellement tenté.

Périmètre : RG-ACC-01, RG-ACC-04, RG-DRO-01 à 05, RG-M02-04, RG-M17-01, RG-M04-08.

Méthode :
1. Énumère toutes les routes depuis docs/routes.md, tous les personas depuis seeds/corpus.ts.
2. Pour chaque couple, tente l'accès direct par adresse construite, sans passer par la navigation.
3. Cherche les chemins dérivés : recherche, suggestions, cartographie, carte mentale,
   rétroliens, panneaux latéraux, pièces jointes, export, journaux, flux d'activité.
4. Vérifie que refus et inexistence produisent une réponse **identique** — corps, en-têtes,
   temps de réponse.
5. Vérifie que rien ne fuit dans un message d'erreur (RG-NF-06).

Pour chaque faille : la route, le persona, la requête exacte, ce qui a fuité, l'exigence violée.
Ne corrige rien. Tu constates.
```

### F. Script de workflow — `/conformite`

```javascript
export const meta = {
  name: 'conformite',
  description: 'Vérifie la conformité de chaque vue implémentée à sa maquette gelée',
  phases: [
    { title: 'Capture', detail: 'captures maquette et application, par état' },
    { title: 'Analyse', detail: 'verdict par état, niveau 3 si nécessaire' },
  ],
}

const VUES = args?.vues ?? []
if (!VUES.length) return { erreur: 'aucune vue fournie' }

const VERDICT = {
  type: 'object',
  required: ['vue', 'etats'],
  properties: {
    vue: { type: 'string' },
    etats: {
      type: 'array',
      items: {
        type: 'object',
        required: ['cle', 'niveau1', 'ecartPixels', 'verdict'],
        properties: {
          cle: { type: 'string' },
          niveau1: { type: 'boolean' },
          ecartPixels: { type: 'number' },
          verdict: { enum: ['conforme', 'conforme-niveau-3', 'echec'] },
          description: { type: 'string' },
        },
      },
    },
  },
}

const resultats = await pipeline(
  VUES,
  vue => agent(
    `Exécute \`pnpm verif:maquette ${vue} --captures-seulement\`. ` +
    `Rends la liste des états déclarés avec, pour chacun, le résultat du niveau 1 ` +
    `(structure) et l'écart de pixels du niveau 2. N'interprète pas.`,
    { label: `capture:${vue}`, phase: 'Capture', effort: 'low' },
  ),
  (capture, vue) => agent(
    `Pour la vue ${vue}, voici les mesures brutes :\n${capture}\n\n` +
    `Applique le protocole : niveau 1 faux → echec. Écart ≤ 0,5 % → conforme. ` +
    `Écart > 3 % → echec. Entre les deux, ouvre les deux captures dans ` +
    `verif/references/${vue}/ et tranche : écart de fond (echec, décris-le) ` +
    `ou écart de rendu acceptable (conforme-niveau-3, décris-le aussi).`,
    { label: `analyse:${vue}`, phase: 'Analyse', agentType: 'verificateur-maquette',
      schema: VERDICT },
  ),
)

const vues = resultats.filter(Boolean)
const echecs = vues.flatMap(v =>
  v.etats.filter(e => e.verdict === 'echec').map(e => ({ vue: v.vue, ...e })))
const niveau3 = vues.flatMap(v => v.etats.filter(e => e.verdict === 'conforme-niveau-3'))

log(`${vues.length} vues · ${echecs.length} échecs · ${niveau3.length} recours au niveau 3`)
return { echecs, recoursNiveau3: niveau3.length, vues: vues.length }
```

### G. Commandes de vérification

| Commande | Contenu |
|---|---|
| `pnpm check` | Typage, style, formatage |
| `pnpm test:unit` | Unitaires |
| `pnpm test:aller-retour` | Propriété document ⇄ Markdown sur tout le corpus |
| `pnpm test:etancheite` | Matrice routes × personas |
| `pnpm test:droits` | Absence des actions interdites dans le DOM |
| `pnpm test:vide` | Corpus vierge, aucun chiffre inventé |
| `pnpm test:etats` | Les quatre états de chaque zone |
| `pnpm test:a11y` | axe, clavier, focus, alternatives textuelles |
| `pnpm test:parcours` | PU-01 à PU-06 |
| `pnpm test:degradation` | Conteneurs optionnels arrêtés |
| `pnpm test:impression` | Feuille d'impression |
| `pnpm verif:jetons` | Aucune valeur en dur, socle non divergent |
| `pnpm verif:fraicheur` | Une seule définition du calcul |
| `pnpm verif:menus` | Aucune entrée inerte, modules effectifs |
| `pnpm verif:vocabulaire` | Aucun synonyme des termes contractuels |
| `pnpm verif:maquette V-xx` | Protocole d'acceptation visuelle |
| `pnpm mesure:budgets` | Les sept budgets de performance |
| `pnpm exploitation:restauration` | Sauvegarde, restauration, réindexation |
| `pnpm verify:lot T-xxx` | Le sous-ensemble cité par le contrat |
| `pnpm verify` | Les dix-huit batteries |

---

*Fin du plan de réalisation agentique — version 1.0*
