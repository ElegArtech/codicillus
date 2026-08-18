# Proposition de pile technique

**Produit** : Codicillus — plateforme de gestion des connaissances documentaires
**Documents sources** : `CAHIER-DES-CHARGES-FONCTIONNEL.md`, `BRIEF-VUES.md`, `mockups/` (41 vues + `socle.css`)
**Version du document** : 1.0
**Date** : 15 août 2026
**Statut** : proposition soumise à arbitrage — aucune ligne de code n'est engagée avant validation

---

## Avertissement de périmètre

Ce document décrit **comment le produit est réalisé**. Il est le pendant technique du cahier des charges fonctionnel, et il lui est **subordonné** : aucune contrainte technique n'y justifie une entorse au fonctionnel ou aux maquettes.

L'ordre de préséance retenu, conforme à la stratégie de développement énoncée par le commanditaire — *le web design décide, la pile s'adapte* — est le suivant :

```
Maquettes  >  Cahier des charges fonctionnel  >  Brief des vues  >  Pile technique
```

Concrètement : **aucune brique de cette proposition n'impose de convention de nommage, de classe utilitaire, de grille ou de composant préfabriqué au HTML et au CSS déjà produits.** Le `socle.css` des maquettes est repris tel quel comme source de vérité du système visuel. Ce critère a éliminé plusieurs candidates par ailleurs excellentes (§7).

Toutes les versions citées ont été **vérifiées le 15 août 2026** auprès des registres officiels : registre npm, PyPI, API GitHub Releases, `endoflife.date`, Docker Hub. La méthode et les valeurs relevées figurent en §9.

---

## Sommaire

1. [Ce que le cadrage impose à la technique](#1-ce-que-le-cadrage-impose-à-la-technique)
2. [Architecture d'ensemble](#2-architecture-densemble)
3. [Le socle — versions vérifiées](#3-le-socle--versions-vérifiées)
4. [Décisions structurantes](#4-décisions-structurantes)
5. [Budget de performance](#5-budget-de-performance)
6. [Traçabilité exigence → brique](#6-traçabilité-exigence--brique)
7. [Ce qui est écarté, et pourquoi](#7-ce-qui-est-écarté-et-pourquoi)
8. [Exploitation](#8-exploitation)
9. [Méthode de vérification des versions](#9-méthode-de-vérification-des-versions)
10. [Risques](#10-risques)
11. [Ce qui reste à arbitrer](#11-ce-qui-reste-à-arbitrer)

---

## 1. Ce que le cadrage impose à la technique

Le fonctionnel n'a nommé aucune technologie. Il a en revanche posé **treize contraintes qui, ensemble, disqualifient l'essentiel des piles génériques**. Les voici, avec leur conséquence technique directe.

| # | Exigence du cadrage | Référence | Conséquence technique non négociable |
|---|---|---|---|
| C-01 | Recherche tolérante aux fautes, premiers résultats dès le 2ᵉ caractère, < 500 ms, facettes avec compteurs, mise en évidence des termes | M02, ENF Performance | Un moteur de recherche dédié. Le plein texte natif d'une base relationnelle ne tient ni la tolérance aux fautes à deux erreurs, ni les compteurs de facettes à ce budget |
| C-02 | Recherche par sens, **et** bascule silencieuse en mots-clés si elle est indisponible | RG-M02-01, RG-NF-01, P-10 | Le vectoriel est une brique **séparable**, jamais dans le chemin critique. Un même moteur doit savoir servir les deux modes et leur fusion |
| C-03 | Deux corps rédigés par note, riches, avec 15 constructions de contenu dont diagrammes, alertes, liens internes | M04.6, M05.3-4, V-14 | Un éditeur à modèle de document structuré, pas un champ HTML libre. Le format stocké doit être manipulable programmatiquement (sommaire, diff visuel, réécriture de liens, export) |
| C-04 | Export Markdown **réimportable à l'identique** — « critère de réussite principal » | RG-M13-01 | Une **seule** implémentation de la conversion document ⇄ Markdown, partagée par l'import et l'export, testée par aller-retour |
| C-05 | Comparaison visuelle de deux versions avec **blocs identiques alignés horizontalement** | M07.3, V-16 | Diff au niveau des **blocs du document**, pas des lignes de texte. Impose un format de contenu en arbre de nœuds |
| C-06 | Graphe de 500 à 2 000 nœuds, disposition **stable**, focus **persistant au clic**, centralité de passage, points d'articulation, communautés | M09, V-19, V-20 | Bibliothèque d'algorithmes de graphe + calcul de disposition hors du fil d'affichage. Rendu maîtrisé au pixel près, avec alternative textuelle (RG-M18-11) |
| C-07 | Import de .docx, .pptx, .pdf, .md, .txt, par lots de plusieurs centaines de fichiers, un échec unitaire n'interrompt jamais le lot | M12 | Un service de conversion **isolé** : ces convertisseurs sont lents, gourmands et faillibles. Traitement en tâche de fond avec progression en temps réel |
| C-08 | Droits par dossier, hérités, fermeture par défaut, filtrage « au plus près de la donnée », refus et inexistence indiscernables | RG-ACC-01, RG-ACC-04, RG-DRO-01/02 | L'autorisation est calculée côté serveur **et** projetée dans l'index de recherche. Elle ne peut pas être un filtre d'affichage |
| C-09 | Une action interdite **n'est pas affichée** | P-09, RG-M05-08 | Le rendu de la page connaît les droits **avant** de produire le HTML. Un rendu purement client obligerait à exposer les droits au navigateur et à composer l'interface après coup |
| C-10 | Impression propre d'une note, alternative textuelle sur tout contenu graphique, contraste AA, tout au clavier | RG-M18-17, RG-M18-07/08/11, P-06 | Le contenu est du HTML sémantique servi par le serveur. Une application qui ne s'affiche qu'après exécution de JavaScript rend ces exigences beaucoup plus coûteuses |
| C-11 | Auto-hébergeable **sans dépendance à un service externe payant** | RG-NF-08 | Licences ouvertes obligatoires sur toute la chaîne, y compris l'éditeur riche et le moteur de recherche. Aucun quota d'API, aucun modèle hébergé chez un tiers |
| C-12 | Aucun chiffre illustratif, jamais | P-02, RG-M01-01 | Les agrégats sont calculés à la demande ou matérialisés, jamais approximés. Une donnée indisponible remonte un état neutre explicite jusqu'à l'interface |
| C-13 | Volumétrie réelle : 200 comptes, 30 simultanés, quelques milliers de notes | ENF Volumétrie | **Rien ne justifie une architecture distribuée.** Le dimensionnement tient sur une machine. Toute complexité d'échelle ajoutée ici est une dette gratuite |

**Lecture d'ensemble.** C-13 impose la sobriété ; C-01, C-06 et C-07 imposent trois briques spécialisées qu'aucune base de données ne remplace ; C-09 et C-10 imposent le rendu serveur ; C-11 impose l'ouverture des licences. Le reste découle.

### Ce que les maquettes ajoutent

Les 41 maquettes sont du **HTML sémantique, du CSS à jetons nommés et du JavaScript natif**. Aucune bibliothèque externe, aucune classe utilitaire, aucun composant importé — vérification faite : les seules ressources externes des 40 fichiers de vue sont les trois familles typographiques.

`socle.css` définit 61 jetons nommés (encres, surfaces, traits, accent, fraîcheur, sémantique, typographie, espacement, rayons, élévations, dimensions de structure, mouvement) et 10 familles de composants. Le témoin de fraîcheur y est une **jauge à trois barres** dont la forme porte l'information et dont la couleur ne fait que la répéter — c'est la réponse construite à RG-M18-09 et RG-DA-03.

**Conséquence directe sur le choix de la couche d'affichage** : il faut une technologie où le balisage des maquettes se transpose **sans réécriture** et où le CSS reste du CSS. C'est le critère qui départage §4.1.

---

## 2. Architecture d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Navigateur                                                              │
│  HTML sémantique rendu par le serveur + îlots interactifs :              │
│  éditeur · palette · graphe · carte mentale · comparaison · import       │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTP · SSE (progression des lots)
┌───────────────────────────────▼──────────────────────────────────────────┐
│  APPLICATION — SvelteKit (Node 24 LTS)                                   │
│  ┌────────────┬───────────────┬──────────────┬───────────────────────┐   │
│  │ Rendu SSR  │ Points d'API  │ Autorisation │ Document ⇄ Markdown   │   │
│  │ des vues   │ + SSE         │ (droits      │ (implémentation       │   │
│  │            │               │  hérités)    │  unique, C-04)        │   │
│  └────────────┴───────────────┴──────────────┴───────────────────────┘   │
│  Travaux différés : pg-boss (file de tâches dans PostgreSQL)             │
└───┬────────────────────┬───────────────────┬─────────────────────────────┘
    │                    │                   │
┌───▼──────────┐  ┌──────▼─────────┐  ┌──────▼──────────────┐  ┌──────────┐
│ PostgreSQL 18│  │ Meilisearch    │  │ Service de          │  │ Service  │
│ + pgvector   │  │ 1.53           │  │ conversion (Python) │  │ d'embed. │
│              │  │                │  │ pandoc · pptx · pdf │  │ (Ollama) │
│ Vérité       │  │ Index de       │  │                     │  │          │
│ métier       │  │ recherche      │  │      OPTIONNEL      │  │ OPTIONNEL│
└──────────────┘  └────────────────┘  └─────────────────────┘  └──────────┘
        │
┌───────▼──────────────────────────────┐
│ Stockage de fichiers (volume local)  │
│ images et pièces jointes, servies    │
│ derrière un contrôle d'accès         │
└──────────────────────────────────────┘
```

Les deux briques marquées **OPTIONNEL** sont celles dont l'indisponibilité doit **dégrader et non interrompre** (RG-NF-01, P-10). Elles sont volontairement hors du chemin critique : arrêter les deux conteneurs laisse le produit pleinement utilisable, seuls le mode *Sens* et l'import bureautique se signalent comme indisponibles.

**Cinq conteneurs, une machine.** Aucun orchestrateur, aucun cache distribué, aucune file de messages tierce. C'est ce que commande C-13.

---

## 3. Le socle — versions vérifiées

Versions relevées le **15 août 2026**. La colonne *Retenue* indique ce qui est proposé ; quand elle diffère de la dernière version publiée, la raison est donnée.

### Exécution et langage

| Brique | Dernière publiée | Retenue | Licence | Raison |
|---|---|---|---|---|
| **Node.js** | 26.7.0 | **24.19.0 « Krypton »** | MIT | 24 est la ligne LTS active (fin de vie 30/04/2028). 26 ne devient LTS qu'en octobre 2026 : montée prévue au premier trimestre de maintenance |
| **TypeScript** | 7.0.2 | **6.0.3** | Apache-2.0 | TypeScript 7 (compilateur natif Go) est stable depuis le 8 juillet 2026, mais l'API programmatique dont dépendent `svelte-check` et les outils Svelte n'arrive qu'en **7.1**, attendue vers octobre 2026. Démarrer en 6.0.3 et migrer dès 7.1 — voir §10, R-02 |
| **pnpm** | 10.x | **10.x** | MIT | Gestion stricte des dépendances, indispensable pour l'auditabilité de la chaîne (C-11) |

### Couche d'affichage

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **SvelteKit** | 2.70.2 | MIT | Rendu serveur, routage, points d'API, SSE. `@sveltejs/adapter-node` 5.5.7 |
| **Svelte** | 5.56.9 | MIT | Composants compilés en DOM natif. Pas de DOM virtuel, pas de runtime imposé au balisage |
| **Vite** | 8.2.1 | MIT | Chaîne de construction |

### Données

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **PostgreSQL** | 18.6 | PostgreSQL (BSD) | Vérité métier. Fin de vie 14/11/2030. Requêtes récursives pour l'arborescence (10 niveaux), `jsonb` pour les propriétés typées, transactions pour les suppressions atomiques (RG-M14-03) |
| **pgvector** | 0.8.6 | PostgreSQL | Vecteurs de sens conservés dans la base de vérité. Image `pgvector/pgvector:pg18` |
| **Drizzle ORM** | 0.45.2 | Apache-2.0 | Accès SQL typé. La 1.0 est en *release candidate* (rc.5) : on démarre sur la 0.45.2 stable |
| **pg-boss** | 12.27.0 | MIT | File de tâches **adossée à PostgreSQL**. Import, calcul des vecteurs, familles sémantiques, purge des versions. Évite d'ajouter Redis pour trois files (C-13) |

### Recherche

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **Meilisearch** | 1.53.1 | MIT | Moteur unique pour les trois modes de M02.4. Tolérance aux fautes native, facettes avec compteurs, mise en évidence, tri, filtres — et recherche hybride **stabilisée**, non expérimentale |
| **client `meilisearch`** | 0.60.0 | MIT | Client officiel TypeScript |
| **Ollama** | 0.32.13 | MIT | Service local d'embeddings, conteneur optionnel |

### Rédaction et rendu du contenu

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **TipTap** | 3.30.1 | MIT | Éditeur riche. Toutes les extensions nécessaires sont sous licence MIT — vérifié paquet par paquet. **Aucune extension « Pro » n'est employée**, C-11 est respecté |
| **ProseMirror** | `prosemirror-model` 1.25.11 | MIT | Modèle de document sous-jacent. C'est lui qui rend possibles C-03, C-04 et C-05 |
| **lowlight / highlight.js** | 3.3.0 / 11.12.0 | MIT / BSD-3 | Coloration syntaxique. Couvre les 8 langages exigés en M05.4 |
| **Mermaid** | 11.16.1 | MIT | Rendu des diagrammes décrits en texte |
| **DOMPurify** | 3.4.13 | MPL-2.0 / Apache-2.0 | Assainissement du HTML issu de l'import |

### Cartographie et carte mentale

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **graphology** | 0.26.0 | MIT | Modèle de graphe |
| **graphology-metrics** | 2.4.0 | MIT | Centralité de passage (M09.5) |
| **graphology-communities-louvain** | 2.0.2 | MIT | Communautés (M09.6) |
| **d3-force** | 3.0.0 | ISC | Calcul de disposition, exécuté dans un fil dédié |
| **d3-hierarchy** | 3.1.2 | ISC | Disposition de la carte mentale (V-21) |

Les **points d'articulation** (M09.5, le différenciateur « point de défaillance unique ») n'ont pas de paquet dédié satisfaisant : l'algorithme de Hopcroft-Tarjan tient en une cinquantaine de lignes et sera écrit et testé en propre. C'est un ajout assumé, préférable à une dépendance non maintenue sur une fonction centrale du produit.

### Import — service de conversion

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **Python** | 3.14.7 | PSF | Exécution du service. Fin de vie 31/10/2030 |
| **FastAPI** | 0.141.1 | MIT | Interface du service |
| **Pandoc** | 3.10.2 | GPL-2.0+ | Conversion **.docx** → Markdown, avec extraction des images |
| **python-pptx** | 1.0.2 | MIT | **.pptx** — pandoc ne lit pas ce format, vérification faite dans son manuel. Une section par diapositive, conformément à M12.1 |
| **pdfplumber** | 0.11.10 | MIT | **.pdf** — extraction du texte sélectionnable et détection d'un PDF scanné (aucun texte extractible → avertissement explicite exigé par M12.1) |

`.md` et `.txt` ne passent **pas** par ce service : ils sont traités directement par l'application, avec l'implémentation unique exigée par C-04.

### Qualité

| Brique | Version | Licence | Rôle |
|---|---|---|---|
| **Vitest** | 4.1.10 | MIT | Tests unitaires — dont l'aller-retour Markdown de C-04 |
| **Playwright** | 1.62.1 | Apache-2.0 | Tests de bout en bout, dont les parcours PU-01 à PU-06 |
| **@axe-core/playwright** | 4.13.0 | MPL-2.0 | Contrôle automatisé de l'accessibilité (RG-M18-07 à 11) |
| **ESLint / Prettier** | 10.8.1 / 3.9.6 | MIT | Avec `eslint-plugin-svelte` 3.23.0 et `prettier-plugin-svelte` 4.1.1 |
| **Zod** | 4.4.3 | MIT | Validation des entrées, des en-têtes de métadonnées d'import et de la configuration |

**Aucune licence copyleft ne contamine l'application.** Pandoc est en GPL mais s'exécute comme processus séparé dans un conteneur distinct, sans liaison de code.

---

## 4. Décisions structurantes

### 4.1 — Rendu serveur avec îlots interactifs, en Svelte

**Le problème.** C-09 (« une action interdite n'est pas affichée ») et C-10 (impression, alternative textuelle, clavier) veulent un HTML complet produit par le serveur. C-03 et C-06 veulent un éditeur riche et un graphe manipulable, donc du JavaScript substantiel sur quelques écrans. Et les maquettes, elles, sont du HTML sémantique avec un CSS à jetons.

**La décision.** SvelteKit en rendu serveur, avec hydratation ciblée des seules zones interactives : éditeur (V-17, V-18), palette (V-09), graphe (V-19, V-20), carte mentale (V-21), comparaison visuelle (V-16), parcours d'import (V-24). Tout le reste — lecture, listes, tableaux de bord, console — est du HTML servi, enrichi au besoin.

**Pourquoi Svelte plutôt qu'un autre.** Le critère décisif est la **transposition des maquettes sans réécriture**.

| | Balisage | CSS | Verdict au regard des maquettes |
|---|---|---|---|
| **Svelte 5** | HTML natif : `class`, `for`, `tabindex` s'écrivent tels quels | CSS ordinaire, portée au composant, jetons `:root` inchangés | Le corps d'une maquette se colle dans un composant et fonctionne. **Retenu** |
| React / Next.js | JSX : `className`, `htmlFor`, attributs en camelCase, styles en objets | Écosystème qui pousse vers Tailwind ou une bibliothèque de composants | Réécriture systématique des 41 vues. La gravité de l'écosystème tire vers un système visuel concurrent de `socle.css` |
| Vue / Nuxt | Balisage proche du HTML | CSS à portée de composant | Techniquement recevable. Écarté sur le poids d'exécution et sur la moindre affinité du modèle réactif avec un rendu sans DOM virtuel |
| Astro | Excellent en HTML servi | — | Écarté : l'éditeur et le graphe demandent un état client soutenu que le modèle en îlots stricts rend inconfortable |

Svelte compile vers des opérations DOM directes : le poids envoyé au navigateur est celui des seuls écrans interactifs, et la lecture d'une note — l'écran le plus vu du produit — n'embarque presque rien.

**Ce que ça donne pour `socle.css`.** Le fichier est repris **sans modification** comme feuille globale. Les styles propres à une vue passent dans le bloc `<style>` du composant correspondant. Les 61 jetons restent la source unique de vérité, ce qui satisfait RG-DA-01 par construction, et V-41 (bibliothèque de composants) devient une **page réelle de l'application**, pas une maquette morte — conformément à son rôle de « page de démonstration vivante ».

### 4.2 — Recherche : un seul moteur pour les trois modes

**La décision.** Meilisearch 1.53, avec un index par domaine logique de recherche et un index unique pour le corpus.

Ce que Meilisearch couvre nativement, exigence par exigence :

| Exigence | Référence | Couverture |
|---|---|---|
| Une lettre manquante ou remplacée, deux fautes sur deux mots | UC-M02-03 | Tolérance aux fautes native, réglable par longueur de mot |
| Premiers résultats dès le 2ᵉ caractère, < 500 ms | UC-M02-02, ENF | Recherche par préfixe conçue pour la frappe |
| Extrait de 2-3 lignes, termes mis en évidence | M02.5 | `attributesToCrop` et `attributesToHighlight` |
| Facettes combinables **avec compteur** | M02.6 | `facetDistribution`, calculée dans la même requête |
| « 4 résultats sur 37 » | M02.6 | `totalHits` avec et sans filtres |
| Tri par pertinence, date, consultations, alphabétique | V-08 | Attributs triables |
| Mode *Sens* | M02.4 | Recherche vectorielle |
| Mode *Hybride* | M02.4 | Fusion des deux classements en une requête, avec pondération |

**La dégradation de C-02.** Les vecteurs sont fournis à Meilisearch par l'application (mode `userProvided`), à partir des embeddings calculés par le service optionnel et **conservés dans PostgreSQL avec pgvector**. Trois bénéfices :

1. Si le service d'embeddings est arrêté, l'index reste complet en mots-clés. Le mode *Sens* se signale indisponible, l'hybride retombe sur les mots-clés — silencieusement pour l'utilisateur (RG-M02-01), avec une mention discrète prévue en V-08.
2. Les vecteurs étant dans PostgreSQL, les **notes connexes** (panneau de V-14) et les **familles sémantiques** (M09.6) se calculent en SQL, sans dépendre du moteur de recherche.
3. La base de vérité reste la base de vérité. Meilisearch est un index reconstructible : le perdre n'a jamais d'effet sur le contenu.

**Le filtrage de périmètre (C-08).** C'est le point le plus délicat, parce que RG-ACC-01 exige un filtrage « au plus près de la donnée » et pas un masquage d'affichage. Le motif retenu :

- chaque document indexé porte `visibilite`, `statut`, et le **chemin complet de ses dossiers ancêtres** sous forme de liste (`["infra", "infra/exploitation", "infra/exploitation/sauvegardes"]`) ;
- à chaque requête, le serveur calcule l'ensemble des dossiers effectivement lisibles par l'appelant — application de RG-DRO-01 (le droit explicite le plus proche gagne) et RG-DRO-02 (fermeture par défaut) — et l'injecte comme filtre ;
- en anonyme, le filtre est réduit à `visibilite = publique AND statut = publiee`, sans exception ni chemin dérogatoire.

La requête envoyée au moteur **ne peut pas** rapporter un document interdit. Un identifiant deviné dans l'adresse produit la même réponse qu'un identifiant inexistant (RG-ACC-04, V-04).

**Indexation < 10 s (RG-M05-06, RG-M12-08).** L'écriture est synchrone à l'enregistrement, le calcul du vecteur est différé. Une note est donc trouvable en mots-clés immédiatement, et par le sens quelques secondes plus tard — ce qui est conforme, l'exigence portant sur la trouvabilité.

### 4.3 — Contenu rédigé : un format, trois usages

**La décision.** Le corps d'une note est conservé en **document ProseMirror sérialisé en JSON**, dans une colonne `jsonb`. C'est le format canonique. Trois formes en dérivent :

| Forme dérivée | Produite | Sert à |
|---|---|---|
| HTML | Au rendu, côté serveur | Lecture (V-14, V-03), impression, aperçu |
| Texte brut | À l'enregistrement | Indexation, extraits, détection de doublon |
| Markdown | À la demande | Export (M13), et en sens inverse pour l'import |

**Pourquoi pas stocker du Markdown.** Le Markdown ne sait pas représenter proprement les blocs d'alerte à trois niveaux, les liens internes stables au renommage, les cases de tâches imbriquées ni les blocs de diagramme sans conventions maison ; et surtout il rend C-05 (alignement des blocs identiques en comparaison visuelle) beaucoup plus fragile. Le JSON de ProseMirror est un arbre de nœuds : l'alignement se fait sur les nœuds.

**Pourquoi pas stocker du HTML.** Un HTML libre ne se valide pas. Le schéma ProseMirror garantit qu'aucun contenu ne peut être structurellement invalide — condition pour que le sommaire, le diff et l'export soient fiables.

**L'aller-retour de C-04.** Une **seule** implémentation `document ⇄ Markdown` existe, dans l'application. L'import l'utilise dans un sens, l'export dans l'autre. Elle est couverte par des tests de propriété : *pour tout document du corpus, sérialiser puis désérialiser redonne le document d'origine*. C'est ce test, et non une inspection visuelle, qui atteste RG-M13-01.

**Extensions TipTap employées** — toutes MIT, vérifiées individuellement : `starter-kit`, `table`, `task-list`, `image`, `link`, `placeholder`, `character-count`, `code-block-lowlight`, `mention` (auto-complétion de lien interne, UC-M05-06), `suggestion` (menu de commandes déclenché par un caractère, UC-M05-05). Trois nœuds sont écrits en propre : **bloc d'alerte** à trois niveaux, **bloc de diagramme**, **lien interne** portant l'identifiant de la note cible plutôt que son titre — c'est ce qui le rend insensible au renommage (UC-M05-06) et permet de le signaler cassé si la cible disparaît.

**Les rétroliens (RG-M05-02)** sont recalculés à chaque enregistrement par parcours de l'arbre du document. Aucune saisie manuelle, aucune table à maintenir à la main.

### 4.4 — Cartographie : disposition calculée à part, rendu en SVG

**La décision.** `graphology` pour le modèle et les métriques, `d3-force` pour la disposition **exécutée dans un fil dédié** (Web Worker), rendu en **SVG** dans le DOM.

**Pourquoi la disposition dans un fil dédié.** RG-M09 exige une disposition qui « se stabilise puis reste stable » et V-19 demande d'indiquer une progression pendant le calcul. On fait donc tourner la simulation à part, on récupère les positions finales, et on rend une image **statique**. Il n'y a aucune animation continue : le graphe ne « danse » pas, ce qui est exactement l'exigence, et la page ne se fige jamais pendant le calcul.

**Pourquoi SVG et pas WebGL.** Trois raisons, toutes issues du cadrage :

1. **RG-M18-11** exige une alternative textuelle exploitable. Un SVG est dans le DOM : les nœuds sont des éléments nommés, atteignables au clavier et lisibles par une technologie d'assistance. Un rendu WebGL est une image opaque, pour laquelle il faudrait construire une seconde représentation en parallèle.
2. **Les maquettes décident.** V-19 est un SVG écrit à la main, avec un encodage par type combinant forme et pictogramme (RG-M18-09). Reproduire cet encodage dans une bibliothèque de rendu de graphe imposerait des compromis visuels. En SVG, la maquette *est* le rendu.
3. **La volumétrie le permet.** 500 à 2 000 nœuds statiques en SVG tiennent le budget de 3 secondes (ENF). Le seuil de bascule vers l'exploration progressive exigé par RG-M09-04 est un **paramètre**, réglé après mesure sur le corpus réel.

**Les analyses.** Centralité de passage par `graphology-metrics`, communautés par `graphology-communities-louvain`, points d'articulation par implémentation propre (§3). Toutes s'exécutent dans le fil dédié, avec les positions.

**Les familles sémantiques (M09.6)** sont d'une autre nature : elles reposent sur les vecteurs, coûtent cher, et RG-M09-06 autorise explicitement un calcul périodique avec affichage de sa date. Elles sont donc une tâche de fond `pg-boss`, pas un calcul de consultation.

### 4.5 — Historique et comparaison

**Versions.** Une version capture titre et les deux corps (RG-M07-02), immuable, plafonnée à une valeur configurable — la purge des plus anciennes est une tâche de fond. La restauration écrit d'abord l'état courant comme nouvelle version, puis applique l'ancien (RG-M07-05) : l'opération est donc elle-même réversible, sans traitement particulier.

**Mode Texte (V-16).** Différences ligne à ligne sur le rendu Markdown des deux versions, avec le paquet `diff` (9.0.0, BSD-3). Marqueur en début de ligne en plus de la couleur, comme l'exige la vue.

**Mode Visuel.** C'est le point dur C-05. Algorithme retenu : plus longue sous-séquence commune sur les **nœuds de premier niveau** du document, empreinte de nœud calculée sur son contenu normalisé. Les nœuds appariés sont alignés sur une même ligne de grille dans les deux colonnes ; les nœuds sans correspondance créent un vide en face. À l'intérieur d'un paragraphe apparié mais modifié, un second passage marque les différences de mots. Développement en propre — aucune bibliothèque ne fait exactement cela — et c'est justement pour le rendre possible que le format canonique est un arbre de nœuds (§4.3).

L'alternative textuelle exigée par V-16 tombe alors naturellement : la liste ordonnée des différences est le sous-produit direct de l'algorithme.

### 4.6 — Import : un service isolé, un lot qui ne s'arrête jamais

**La décision.** Un service Python séparé, appelé fichier par fichier, qui **retourne du Markdown et des images extraites**. L'application applique ensuite son unique convertisseur Markdown → document (§4.3).

| Format | Outil | Remarque |
|---|---|---|
| `.docx` | Pandoc 3.10.2 | Titres, listes, tableaux et images préservés, médias extraits |
| `.pptx` | python-pptx 1.0.2 | **Pandoc ne lit pas le pptx** — vérifié dans son manuel, ce format n'existe qu'en sortie. Une section par diapositive |
| `.pdf` | pdfplumber 0.11.10 | Texte sélectionnable. Aucun texte extractible → la note est créée avec l'avertissement « contenu scanné » exigé en M12.1, sans reconnaissance de caractères (hors périmètre) |
| `.md`, `.txt` | Application | Ne sort pas de l'application : c'est le chemin qui garantit l'idempotence et la résolution des références (RG-M12-01) |

**Pourquoi un service séparé.** Ces convertisseurs sont lents, consomment de la mémoire de façon irrégulière et échouent sur des fichiers malformés. Les isoler garantit RG-M12-04 : un fichier en erreur ne peut pas interrompre le lot, ni faire tomber l'application. Et l'arrêt du service dégrade l'import bureautique **sans empêcher** l'import Markdown (RG-NF-01).

**Le parcours de V-24.** L'analyse produit l'aperçu (étape 3) sans rien écrire ; la validation crée une tâche `pg-boss` ; la progression remonte par **SSE** — compteurs de succès et d'échecs qui s'incrémentent en temps réel, sans interrogation répétée du serveur ni WebSocket à exploiter. L'utilisateur peut fermer l'onglet : le lot continue, et V-38 prévoit déjà la notification « Import terminé » qui l'attend.

**Le mode simulation (RG-M12-02)** est la même tâche exécutée dans une transaction annulée à la fin. Un seul chemin de code, donc un rapport de simulation qui dit rigoureusement ce que fera l'import réel.

### 4.7 — Autorisation, sessions, sécurité

| Sujet | Décision | Exigence servie |
|---|---|---|
| Mots de passe | `@node-rs/argon2` 2.1.0, Argon2id | Comptes locaux (M16.1) |
| Sessions | Jetons opaques en base, cookie `HttpOnly`, `SameSite=Lax`, `Secure` | Durée configurable (M14.7), restauration de la page visée après reconnexion (RG-ACC-03) |
| Tentatives répétées | Ralentissement progressif puis blocage temporaire, compteur en base | RG-M16-01, RG-NF-07 |
| Droits de dossier | Résolution en une requête récursive remontant l'arborescence, le droit explicite le plus proche l'emporte | RG-DRO-01, RG-DRO-02 |
| Rendu conditionné | Les droits effectifs sont connus **avant** production du HTML : une action interdite n'est pas dans la page | P-09, RG-M05-08 |
| Refus / inexistence | Une réponse unique, produite par le même chemin de code | RG-ACC-04, RG-NF-04, V-04 |
| Pièces jointes | Servies par une route qui revérifie la visibilité de la note porteuse — jamais en fichier statique | RG-M04-08 |
| Messages d'erreur | Catalogue de messages en français ; aucune trace technique ne remonte à l'interface | RG-M18-14, RG-NF-06 |

### 4.8 — Travaux différés et suppression atomique

`pg-boss` porte cinq familles de tâches : lots d'import, calcul des vecteurs, familles sémantiques, purge des versions au-delà du plafond, agrégats d'analytique. La file étant **dans PostgreSQL**, une sauvegarde de la base sauvegarde l'état des traitements, et il n'y a pas de second système à exploiter (C-13).

Les suppressions structurantes (dossier, domaine) sont des transactions uniques : « soit tout est supprimé, soit rien » (RG-M03-04, RG-M14-03). Le retrait de l'index de recherche suit la validation de la transaction, jamais avant — de sorte qu'une transaction annulée ne peut pas laisser un index amputé.

---

## 5. Budget de performance

Chaque exigence des ENF est rattachée au poste qui la tient. La colonne *Marge* estime le confort au regard de la volumétrie annoncée (C-13).

| Exigence | Cible | Tenue par | Marge |
|---|---|---|---|
| Premiers résultats de recherche | < 500 ms | Meilisearch, index de quelques milliers de documents | Très confortable — l'ordre de grandeur usuel est la dizaine de millisecondes |
| Recherche complète avec facettes | < 1,5 s | Facettes calculées dans la même requête | Confortable |
| Ouverture d'une note | < 1 s | HTML rendu par le serveur, une requête principale + panneaux différés | Confortable — les panneaux latéraux chargent séparément et gèrent leurs états (RG-M04-07) |
| Enregistrement | < 1 s | Écriture transactionnelle + indexation mots-clés synchrone ; vecteur différé | Confortable |
| Indexation après enregistrement | < 10 s | Synchrone en mots-clés | Tenue par construction |
| Palette perçue instantanée | — | Superposition déjà présente dans la page, requête dès le 2ᵉ caractère avec temporisation | Tenue par construction |
| Cartographie de 500 nœuds | < 3 s | Disposition dans un fil dédié, rendu SVG statique | À **mesurer** : c'est le seul poste où le budget mérite une vérification précoce (§10, R-01) |

---

## 6. Traçabilité exigence → brique

| Module | Exigence dimensionnante | Brique |
|---|---|---|
| M01 Accueil | Chiffres réels, jamais illustratifs (P-02) | PostgreSQL — agrégats calculés, état neutre explicite si indisponible |
| M02 Recherche | Trois modes, facettes, tolérance aux fautes | Meilisearch + pgvector |
| M03 Navigation | Arborescence à 10 niveaux, dépliage mémorisé | Requêtes récursives PostgreSQL + préférence d'affichage par compte |
| M04 Lecture | 15 constructions, sommaire, impression | Rendu serveur du document + `socle.css` + feuille d'impression |
| M05 Rédaction | Éditeur riche, Markdown à la frappe, menu de commandes | TipTap 3.30 |
| M06 Fraîcheur | **Une seule définition** du calcul (P-01) | Fonction unique côté serveur, appelée par la note, les agrégats et l'index |
| M07 Historique | Diff visuel à blocs alignés | Document ProseMirror + algorithme propre |
| M08 Fiches | Propriétés typées, relations dirigées | `jsonb` + tables de relations, contrainte d'unicité (RG-M08-03) |
| M09 Cartographie | 2 000 nœuds, criticité, communautés | graphology + d3-force + SVG |
| M10 Carte mentale | Dépliage progressif | d3-hierarchy + chargement de branche à la demande |
| M11 Signets | Cherchables comme les notes | Même index Meilisearch, marqueur de type |
| M12 Import | 5 formats, lots de centaines de fichiers | Service Python + pg-boss + SSE |
| M13 Export | **Réimportable à l'identique** | Convertisseur unique, testé par aller-retour |
| M14 Administration | Suppressions atomiques, seuils recalculés | Transactions PostgreSQL + réindexation |
| M15 Pilotage | Journaux de recherche et de consultation | Tables dédiées + agrégats différés |
| M16 Compte | Argon2id, ralentissement des tentatives | `@node-rs/argon2` + compteurs en base |
| M17 Public | Périmètre strict, aucun chemin dérogatoire | Filtre appliqué dans la requête au moteur, pas à l'affichage |
| M18 Transverses | AA, clavier, alternative textuelle | HTML sémantique + SVG dans le DOM + axe-core en intégration continue |

---

## 7. Ce qui est écarté, et pourquoi

| Écarté | Motif |
|---|---|
| **Tailwind CSS** | Impose un vocabulaire de classes utilitaires en contradiction directe avec `socle.css` et RG-DA-01. Les maquettes devraient être réécrites, et la charte cesserait d'être systémique |
| **React / Next.js** | JSX impose la réécriture des 41 vues (`className`, camelCase, styles en objets). L'écosystème gravite vers Tailwind et les bibliothèques de composants, c'est-à-dire vers un système visuel concurrent |
| **Bibliothèques de composants** (MUI, shadcn/ui, Radix…) | Le système de composants existe déjà : c'est V-41. En importer un second garantit la divergence que V-41 est précisément censée empêcher |
| **Elasticsearch / OpenSearch** | Surdimensionné pour quelques milliers de documents. Empreinte mémoire et charge d'exploitation sans commune mesure avec C-13. La tolérance aux fautes y demande un réglage nettement plus fin |
| **Plein texte PostgreSQL seul** | Ne tient pas la tolérance à deux fautes réparties sur deux mots (UC-M02-03), ni les compteurs de facettes au budget de M02.6. Envisageable en repli d'urgence, pas en cible |
| **Neo4j / base de graphe** | RG-M09-01 est explicite : « la cartographie n'a aucune donnée propre ». Un second entrepôt créerait la donnée parallèle que le cadrage interdit, et un graphe de 2 000 nœuds se traite intégralement en mémoire |
| **Redis** | pg-boss couvre les files et les compteurs. Un composant d'exploitation en moins (C-13) |
| **S3 / MinIO** | Un volume local suffit à la volumétrie. La sauvegarde reste « une base + un dossier », ce qui rend RG-NF-09 réellement documentable et testable |
| **Kubernetes** | 30 utilisateurs simultanés. Docker Compose sur une machine |
| **Éditeurs riches concurrents** (Lexical, Quill, CKEditor) | Lexical : modèle de document moins outillé pour le diff structurel de C-05. Quill : trop pauvre pour les 15 constructions de M04.6. CKEditor : les fonctions requises relèvent d'une licence commerciale, ce que C-11 interdit |
| **Extensions TipTap « Pro »** | Payantes. Aucune n'est nécessaire : la collaboration temps réel est hors périmètre, et les fonctions retenues sont toutes MIT |
| **Services d'embeddings hébergés** (OpenAI et équivalents) | C-11 interdit toute dépendance à un service externe payant. Le modèle tourne en local |
| **Reconnaissance de caractères sur PDF scannés** | Hors périmètre : M12.1 demande explicitement un **avertissement**, pas une transcription |
| **Rendu WebGL du graphe** (sigma.js, cytoscape) | Rend RG-M18-11 (alternative textuelle) coûteux et empêche de reproduire l'encodage visuel de la maquette V-19 |

---

## 8. Exploitation

### Composition

Cinq services, un fichier `compose.yaml` :

| Service | Image | Rôle | Critique |
|---|---|---|---|
| `app` | construite | SvelteKit + tâches de fond | oui |
| `db` | `pgvector/pgvector:pg18` | PostgreSQL 18.6 + pgvector 0.8.6 | oui |
| `recherche` | `getmeili/meilisearch:v1.53.1` | Index | oui |
| `conversion` | construite | Pandoc, python-pptx, pdfplumber | **non** |
| `embeddings` | `ollama/ollama:0.32.13` | Vecteurs de sens | **non** |

Un serveur frontal (Caddy 2.11.4, TLS automatique) termine les connexions et sert la page d'indisponibilité programmée exigée par RG-NF-10.

### Sauvegarde et restauration (RG-NF-09)

Trois éléments seulement, ce qui rend la procédure réellement testable :

1. `pg_dump` de PostgreSQL — contenu, versions, droits, configuration, journaux, vecteurs, état des tâches ;
2. le volume des fichiers joints et des images ;
3. rien d'autre. **L'index Meilisearch est reconstructible** depuis la base : la procédure de restauration inclut une réindexation complète, ce qui en fait aussi un test de cohérence.

### Montées de version

| Brique | Échéance | Nature |
|---|---|---|
| TypeScript 6.0.3 → 7.1 | ~ octobre 2026 | Dès que l'API programmatique dont dépend l'outillage Svelte est publiée |
| Node 24 LTS → 26 LTS | ~ octobre 2026 | Après passage de 26 en LTS |
| Drizzle 0.45 → 1.0 | À la sortie stable | La 1.0 est en *release candidate* |
| PostgreSQL 18 | 14/11/2030 | Aucune échéance avant longtemps |

---

## 9. Méthode de vérification des versions

L'exigence de n'employer que des versions réellement disponibles a été traitée par **interrogation directe des registres**, le 15 août 2026, et non de mémoire.

| Source | Interrogée pour |
|---|---|
| `registry.npmjs.org` | Version `latest` **et** l'ensemble des `dist-tags`, pour distinguer une version stable d'une préversion. C'est ce contrôle qui a révélé que Drizzle 1.0 n'est encore qu'en *release candidate*, et que SvelteKit 3 n'existe qu'en `next` |
| `pypi.org` | Briques du service de conversion, avec leur licence |
| `api.github.com/repos/*/releases/latest` | Meilisearch, Pandoc, Node, Caddy, Ollama — avec la date de publication |
| `endoflife.date` | PostgreSQL, Python, Node : version courante **et fin de vie**, pour ne pas démarrer sur une ligne bientôt close |
| `hub.docker.com` | Existence effective des étiquettes d'images citées |
| Manuel de Pandoc | Vérification que le `.pptx` n'est pas un format d'**entrée** — d'où le recours à python-pptx |
| Journal de publication TypeScript | Confirmation que la 7.0 est stable depuis le 8 juillet 2026, mais que le support de l'outillage Svelte attend la 7.1 |

Deux constats ont modifié la proposition initiale : le décalage de l'outillage Svelte sur TypeScript 7, et l'absence de lecture du `.pptx` par Pandoc.

---

## 10. Risques

| # | Risque | Effet | Traitement |
|---|---|---|---|
| **R-01** | Le rendu SVG de 2 000 nœuds dépasse le budget de 3 s | Dégradation d'une vue de pilotage | **Mesurer en vague 2**, sur un jeu synthétique aux volumes hauts. Repli identifié : bascule automatique en vue par type maître (V-20) au-delà d'un seuil — comportement déjà prévu par RG-M09-04, donc sans effet sur le fonctionnel |
| **R-02** | TypeScript 7.1 glisse au-delà d'octobre 2026 | Aucun : on reste en 6.0.3 | Sans effet fonctionnel. La 6.0.3 est stable et maintenue |
| **R-03** | Fidélité de conversion `.docx` insuffisante sur le patrimoine réel | Notes importées à retoucher | **Éprouver Pandoc sur un échantillon réel avant la vague d'import**. Le rapport d'import prévu en M12.3 rend de toute façon le résultat vérifiable fichier par fichier |
| **R-04** | Le modèle d'embeddings tient mal le vocabulaire technique français | Mode *Sens* peu pertinent | Le choix du modèle est un **paramètre**, pas une décision de structure : les vecteurs se recalculent par tâche de fond. À trancher par mesure sur le corpus réel, pas a priori |
| **R-05** | Aller-retour d'export non parfait sur des constructions rares | RG-M13-01 en défaut, critère de réussite principal | Test de propriété sur **tout** le corpus, exécuté en intégration continue. Un aller-retour non idempotent fait échouer la construction |
| **R-06** | Écart progressif entre `socle.css` et les écrans réalisés | Perte du caractère systémique de la charte (RG-DA-01) | V-41 devient une **page réelle** de l'application et non une maquette : la divergence devient visible immédiatement |

---

## 11. Ce qui reste à arbitrer

Sept décisions sont attendues avant d'engager la réalisation. Les quatre premières relèvent du commanditaire, les trois dernières de l'exploitant.

1. **Cible d'hébergement.** Le cadrage exige l'auto-hébergement (RG-NF-08) sans décrire l'infrastructure d'accueil : système d'exploitation, ressources, Docker disponible ou non, politique de sauvegarde existante. Le dimensionnement proposé (une machine, cinq conteneurs) suppose Docker. À confirmer.

2. **Envoi de courriel.** V-06 décrit une réinitialisation de mot de passe en quatre étapes dont une « confirmation d'envoi », ce qui suppose un relais de messagerie — alors que les notifications par courriel sont explicitement hors périmètre. Il n'y a pas contradiction (l'un est transactionnel, l'autre est de la notification), mais il faut **un relais SMTP interne**. Trois issues possibles : relais disponible, ou parcours de réinitialisation entièrement délégué à l'administrateur (M14.6 le prévoit déjà, mot de passe temporaire affiché une seule fois), ou V-06 retiré de la première version.

3. **Périmètre de la première version.** Question déjà ouverte par le cahier des charges (§29, point 2). Elle a une incidence directe ici : carte mentale, analyses de graphe avancées et mode *Sens* représentent environ un quart de la charge technique. Les reporter ne change **rien** à l'architecture proposée — les briques concernées sont précisément celles marquées optionnelles.

4. **Modèle d'embeddings.** À choisir par mesure sur le corpus réel, une fois l'amorçage documentaire connu (§29, point 4 du cahier des charges). Décision réversible : les vecteurs se recalculent.

5. **TypeScript 6.0.3 maintenant, ou attendre la 7.1.** Recommandation : démarrer en 6.0.3 sans attendre. La migration vers la 7 est un changement d'outillage, pas de code.

6. **Drizzle 0.45.2 stable, ou 1.0 en *release candidate*.** Recommandation : la 0.45.2. La 1.0 sera vraisemblablement stable avant la fin du développement, et la migration se fera à ce moment-là.

7. **Seuil de bascule de la cartographie** (RG-M09-04). À fixer après la mesure R-01, pas avant.

---

*Fin de la proposition de pile technique — version 1.0*
