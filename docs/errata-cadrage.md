# Errata du cadrage

**Ce document fait autorité sur `cadrage/` pour les seuls points qu'il énumère, et sur rien
d'autre.**

`cadrage/`, `mockups/` et `règles/` sont gelés et en écriture humaine seulement — mécaniquement,
pas déclarativement (`ECART-004`). Quand un fait s'y révèle faux, on ne corrige pas la source : on
l'inscrit ici, daté, rattaché à l'arbitrage qui le valide. Les sources restent ce qu'elles étaient
au gel, donc diffables et opposables ; l'errata dit ce qui, depuis, s'est révélé inexact.

Toute nouvelle entrée passe par un arbitrage numéroté de `docs/arbitrages.md`. Aucun agent
d'exécution n'écrit ici.

---

## E-01 — La source unique du système visuel n'est pas `mockups/socle.css`

**Portée** : `STACK-TECHNIQUE.md §1` et §4.1 · `PLAN-DE-REALISATION.md` §3.4 et critère de sortie
de T-004 · `docs/adr/ADR-002.md`
**Validé par** : ARB-006 · **Détail** : `docs/ecarts/ECART-007.md`

Ces documents désignent `mockups/socle.css` comme « la source unique de vérité du système
visuel ». C'est inexact : le fichier est **le plus ancien de six états** du socle en ligne,
employé par 4 vues sur 41 (V-01, V-02, V-03, V-09). Il lui manque toute la section « champs de
saisie » — que 21 vues emploient —, les notifications à quatre types, la règle de rôle
`.si-admin` et le jeton `--l-large`.

**Correction.** La source unique est le socle en ligne le plus complet, celui de
`mockups/V-07-accueil-contributeur.html` (466 lignes). Il est extrait mécaniquement, jamais
recopié à la main. Analyse règle à règle : ses 104 règles couvrent tous les sélecteurs des six
états, `:root` est identique dans les six (les jetons n'ont jamais bougé), et la seule divergence
réelle porte sur le composant de notification, inerte à l'état par défaut.

## E-02 — Le socle compte 69 jetons, non 61

**Portée** : `PLAN-DE-REALISATION.md` §3.4 · **Validé par** : ARB-006

69 dans le socle extrait, 70 avec `--l-large`, propre aux états récents du socle en ligne.
Décompte par famille dans `docs/DESIGN.md`.

## E-03 — 37 planches de revue sur 41 vues, non 36 sur 40

**Portée** : `PLAN-DE-REALISATION.md` §3.6 et §4.1 · **Validé par** : ARB-006

Le dépôt contient **41** fichiers de vue, non 40. **37** portent une planche de revue ; les quatre
qui n'en portent pas sont **V-09, V-35, V-40 et V-41**, et présentent leurs états côte à côte dans
la page. Le §4.1 se contredit d'ailleurs lui-même : il annonce « 36 des 40 » puis donne deux
phrases plus loin la liste correcte des vues sans planche.

## E-04 — Cinq variantes de corpus emboîtées, non 36 corpus à réconcilier

**Portée** : `PLAN-DE-REALISATION.md` §3.6 et §7.3 (workflow `/corpus-unifie`)
**Validé par** : ARB-006 · **Détail** : `docs/ecarts/ECART-002.md`

Il n'existe que cinq variantes, **strictement emboîtées** : 32 notes (24 vues), 27 (2), 19 (12),
14 (V-09), vide (V-05, V-06). Aucun identifiant n'existe hors du jeu de 32. Il n'y a rien à
réconcilier : le workflow `/corpus-unifie` et son réglage `large` sont sans objet. Deux
divergences de valeur subsistent sur `n-doc-barman`, traitées par ARB-004.

## E-05 — `RG-M02-05` et `RG-M02-06` n'existaient pas : numérotation créée

**Portée** : `CAHIER-DES-CHARGES-FONCTIONNEL.md` §M02.6 · `PLAN-DE-REALISATION.md` §1.3 et §6.3
**Validé par** : ARB-006

Le plan cite `RG-M02-05` et `RG-M02-06` ; le cahier des charges ne les définit pas. Les exigences
sont réelles, mais restées des puces non numérotées de M02.6, qui s'arrête à `RG-M02-04`. La
numérotation ci-dessous leur est attribuée, dans l'ordre des puces, et correspond exactement à
l'usage qu'en fait le plan :

| Référence | Exigence, telle qu'écrite en M02.6 |
|---|---|
| **RG-M02-05** | Chaque facette affiche le nombre de résultats correspondants. |
| **RG-M02-06** | L'état de la recherche — requête, filtres, mode — est partageable par l'adresse de la page. |
| **RG-M02-07** | Les filtres actifs sont affichés en pastilles supprimables individuellement ; un lien « tout effacer » réinitialise l'ensemble. |
| **RG-M02-08** | Le compteur global reflète le filtrage (« 4 résultats sur 37 »). |

`RG-M02-05` et `RG-M02-06` reprennent l'usage du plan à l'identique : la convention de commit de
§1.3 illustre `RG-M02-05` par « compteur de facettes sur filtres combinés », et §1.2 point 4
associe `RG-M02-06` à `RG-M09-05` comme « état de recherche et de cartographie partageables par
l'adresse ».

## E-06 — pnpm : ligne 11, non ligne 10

**Portée** : `STACK-TECHNIQUE.md §3` · **Validé par** : ARB-008

L'environnement exécute pnpm 11.22.0. Les propriétés recherchées — gestion stricte des
dépendances, auditabilité de la chaîne (C-11) — sont tenues par la ligne 11 comme par la 10.

## E-07 — `guide/` s'appelle `règles/`

**Portée** : `PLAN-DE-REALISATION.md` §3.1, §3.5, annexe D · **Validé par** : ARB-006
**Détail** : `docs/ecarts/ECART-001.md`

Le dossier de la note de méthode s'appelle `règles/`. Les règles de refus et les pointeurs suivent
le dossier réel.

## E-08 — Les règles de refus par outil ne protègent pas les sources

**Portée** : `PLAN-DE-REALISATION.md` §3.5, §7.8 et annexe D · `règles/workflow_agentic.md` §5
**Validé par** : ARB-006 · **Détail** : `docs/ecarts/ECART-004.md`, gravité haute

`Edit(mockups/**)` et `Write(mockups/**)` ne couvrent **que** les outils Edit et Write. Bash passe
à travers — prouvé par sonde. L'affirmation du §7.8 selon laquelle « un agent en autonomie
complète ne peut pas modifier la référence qui l'accepte » était donc fausse en pratique.

**Correction.** La protection est portée par le système de fichiers (`chmod a-w` sur les trois
dossiers), doublée du contrôle d'empreintes `pnpm verif:gel`. Les règles de refus sont conservées
comme première couche : elles rendent un message intelligible avant le refus brut du système.

Cette correction dépasse Codicillus : elle vaut pour la configuration de référence du plan **et**
pour la mise en œuvre suggérée par le guide.

## E-09 — La clause de désambiguïsation de `RG-M03-02` est sans objet

**Portée** : `CAHIER-DES-CHARGES-FONCTIONNEL.md` §M03.2 · **Validé par** : ARB-001

La règle n'est pas fautive. Mais la forme raccourcie `/domaines/{domaine}` n'étant pas
implémentée, la clause « en cas d'ambiguïté, demander à l'utilisateur de choisir » n'a aucun
déclencheur. Clause 1 (adresse canonique incluant l'univers) : tenue. Clause 2 : **sans objet**,
à ne jamais implémenter.

## E-10 — Le brief de V-24 renvoie à tort le contributeur vers V-35

**Portée** : `BRIEF-VUES.md §V-24` · **Validé par** : ARB-003

V-35 est une vue de console réservée aux administrateurs. Le contributeur reçoit son rapport à
l'étape 4 de son propre parcours d'import, que V-24 porte déjà. Le lien décrit au brief n'est pas
implémenté.

## E-11 — « Concepteur et développeurs » désigne les administrateurs

**Portée** : `BRIEF-VUES.md §V-41` · **Validé par** : ARB-002

La population visée est celle des administrateurs. V-41 est une vue de console, sous rôle
administrateur, et reste une page réelle de l'application.
