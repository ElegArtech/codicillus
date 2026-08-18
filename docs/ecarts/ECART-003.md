# ÉCART-003 — T-006 / inventaire des routes — 18 août 2026

- **Nature** : les 41 maquettes gelées **ne portent aucune liaison inter-vue**. Les 681 attributs `href` des fichiers de vue valent tous `"#"`, à l'exception de la feuille de polices, de six ancres internes et de deux liens externes de contenu de démonstration.

  Conséquence directe sur l'ordre de préséance : *Maquettes > Cahier des charges* ne peut pas trancher l'adressage, puisque les maquettes ne disent rien. La liaison se déduit du cahier des charges — `RG-M03-02` (adresse canonique incluant l'univers, redirection des adresses anciennes, désambiguïsation explicite), `RG-M03-03` (stabilité de l'adresse d'une note), `RG-M02-06` et `RG-M09-05` (états partageables par l'adresse) — des fils d'Ariane des vues, et des libellés de navigation de V-37.

- **Cause** : les maquettes sont des vues isolées, produites en régime assisté hors dépôt ; la liaison n'était pas dans leur périmètre. `PLAN-DE-REALISATION.md` §1.2 point 4 identifiait déjà le manque.
- **Traitement** : T-006 produit `docs/routes.md` comme **dérivation tracée**, chaque route portant sa source citée, et une section « à arbitrer » pour ce qui ne se déduit pas.
- **Arbitrage attendu** : réception de `docs/routes.md`. Aucune vue de la phase 1 ne peut être liée avant.
