# ÉCART-005 — T-005 / jeu de semence — 18 août 2026

- **Nature** : la réconciliation des blocs `window.CORPUS` des 41 maquettes (§3.6) fait apparaître **deux divergences de valeur sur un même identifiant de note**, `n-doc-barman`. Tout le reste des données est strictement emboîté : les cinq jeux de notes (32, 27, 19, 14, ∅) sont des sous-suites du jeu de 32, et les vingt-neuf globales de données de `V-14` couvrent, valeur par valeur, celles des quarante autres vues.

  | # | Champ | Valeur dans le jeu complet (24 vues) | Valeur divergente | Vues concernées |
  |---|---|---|---|---|
  | **a** | `n-doc-barman.url` | `https://docs.pgbarman.org/release/3.11/` (+ champ `ajoute`) | `docs.pgbarman.org` (hôte nu, sans `ajoute`) | V-01, V-02, V-03, V-08, V-09, V-10 à V-13, V-15 à V-19, V-21 — 15 vues |
  | **b** | `n-doc-barman.visibilite` | `Interne` | `Publique` | **V-09** seule |

- **Effet** : (a) est bénin — l'hôte se dérive de l'adresse entière, l'inverse est impossible ; c'est un enrichissement resté partiel. (b) est de première importance : la palette de recherche rapide donne pour **publique** une note que les trente-huit autres vues qui la portent donnent pour **interne**. Une note interne atteignable depuis l'espace public contredit RG-NOT-04 et le périmètre public que V-01 à V-04 posent explicitement à leur point d'entrée (`window.CORPUS = window.corpusPublic()`). En l'état, une implémentation qui nourrirait V-09 de son propre corpus de maquette exposerait cette note dans la palette d'un compte sans droit de lecture interne — et une comparaison visuelle V-09 ↔ maquette validerait la fuite.

- **Cause** : le corpus a été enrichi au fil de la production des vues, en ligne dans chaque fichier. Les quatre variantes réduites sont des états antérieurs du même jeu ; `n-doc-barman` y a été retouché sans que les vues déjà écrites soient reprises. La visibilité de V-09 est vraisemblablement une saisie isolée : aucune autre vue ne la partage, et V-09 n'a pas de contrainte de périmètre public qui l'expliquerait.

- **Traitement appliqué** : `seeds/corpus.ts` retient les valeurs du **jeu complet** (`V-14-lecture-note.html`), donc `url` entière et `visibilite: "Interne"`. Les deux écarts sont déclarés nommément dans `seeds/corpus.test.ts` (`ECARTS_CONNUS`) et vérifiés à l'identique : le test échoue si un écart disparaît, change de valeur, ou si un écart nouveau apparaît. Aucune écriture dans `mockups/`.

- **Écart mineur associé** : la date de référence est déduite de 45 dérivations `date + ancienneté en jours` portées par le corpus, les demandes de révision et les versions. 43 convergent sur le **13/08/2026** ; deux notes obsolètes — `n-srv-app-01` (26/12/2025 + 231 j) et `n-sig-facturation` (10/01/2026 + 216 j) — tombent sur le 14/08/2026. Leur libellé étant arrondi au mois, l'écart d'un jour y est invisible et ne remet pas en cause la convergence. `DATE_REFERENCE = "2026-08-13"`.

- **Manque signalé, non comblé** : l'**heure** de référence n'est déductible d'aucune donnée. Les maquettes portent des marqueurs qui la bornent par le bas sans la fixer (« aujourd'hui à 09:12 » pour le compte `c-lea`, activité « il y a 3 heures »). Aucune heure n'est déclarée : la fabriquer serait un comblement (P-02). Les captures et tests qui ont besoin d'un instant doivent choisir explicitement leur convention à partir de la date.

- **Arbitrage attendu** : trancher la visibilité de `n-doc-barman` — « Interne » partout, ou « Publique » partout et alors la note entre dans le corpus public — puis regeler V-09, ou déclarer formellement que la valeur de V-09 est une coquille sans portée. Tant que ce n'est pas tranché, la comparaison visuelle de V-09 se fait sur une donnée corrigée en silence par `corpus.ts`.

- **Portée** : V-09 pour la contradiction, les 15 vues du tableau pour l'adresse ; tout lot nourri par `corpusPourVue()`.
