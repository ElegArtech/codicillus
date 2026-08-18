# ÉCART-006 — T-009 / système de design — 18 août 2026

- **Nature** : `PLAN-DE-REALISATION.md` §3.5 pose `mockups/socle.css` comme source unique du système visuel, dont « la feuille globale de l'application est une **copie contrôlée**, dont la non-divergence est vérifiée mécaniquement ».

  Constat mécanique sur les 41 fichiers gelés : le socle **en ligne** dans les maquettes n'est pas ce fichier. Il en existe **cinq états successifs, strictement emboîtés**, et `mockups/socle.css` est le plus ancien.

  | Lignes | Vues | Ce qu'il a de plus que `socle.css` |
  |---|---|---|
  | 331 | V-01, V-02, V-03, V-09 | — identique au fichier (empreinte confirmée) |
  | 399 | V-05, V-08, V-10 | section 11 « Champs de saisie », `.si-admin`, jeton `--l-large` |
  | 400 | V-11, V-12, V-13 | idem, à un commentaire près |
  | 401 | V-04, V-06, V-15 à V-37 | idem |
  | 465–466 | **V-07, V-14, V-38, V-39, V-40, V-41** | idem + section 9 « Notifications » complète : quatre types, glyphe de type, actions, barre de progression, fermeture individuelle, adaptation ≤ 640 px |

  Le retard porte sur **23 classes**, **une règle de rôle** et **un jeton** :

  - `--l-large: 900px` — employé par `.article { max-width: var(--l-large) }` dans toutes les vues de lecture. Absent, la mesure du texte n'est plus bornée.
  - `.champ`, `.champ__label`, `.champ__aide`, `.champ__erreur`, `.champ__boite`, `.champ__action`, `.saisie`, `.case`, `.case__txt`, `.case__aide`, `.avis-saisie`, `.rouet`, `.btn[data-attente]` — employés par 21 vues (V-05, V-06, V-13, V-17, V-23 à V-33, V-38, V-40).
  - `.notif--erreur`, `.notif--info`, `.notif--encours`, `.notif__marque`, `.notif__corps`, `.notif__titre`, `.notif__detail`, `.notif__actions`, `.notif__fermer`, `.notif__progres`, `.notif__rouet` — employés par V-38 et le mécanisme de notification des 40 vues.
  - `.app:not([data-role="admin"]) .si-admin` — la règle de masquage de la console, ADR-011.

- **Effet** : une copie conforme de `mockups/socle.css` dans l'application **ne rendrait pas les maquettes**. Un contrôle de non-divergence (batterie 2, `pnpm verif:jetons`) qui prendrait ce fichier pour référence échouerait à juste titre sur les champs de saisie et les notifications, ou — pire — validerait une feuille applicative amputée.

  Effet secondaire : le plan §3.4 annonce **61 jetons** et **dix familles de composants**. Le décompte réel est de **69 jetons** dans `mockups/socle.css`, **70** dans le socle en ligne, et **onze** familles dans le socle en ligne.

- **Cause** : le socle a été enrichi au fil de la production des 41 vues, en ligne dans chaque fichier. Le fichier autonome `mockups/socle.css` n'a pas été resynchronisé. Le `GEL.md` du 18 août 2026 a gelé les deux états sans les comparer — l'empreinte du fichier est enregistrée, mais rien ne vérifie qu'elle correspond au socle que les vues embarquent.

- **Traitement appliqué** : `docs/DESIGN.md` documente **les deux**, signale systématiquement ce qui n'existe que dans le socle en ligne, et retient comme référence de vérité le socle en ligne de **V-41** (lignes 8 à 472), par application de l'ordre de préséance *maquettes > cahier des charges* (§0 du plan, D-08). Le contrôle P-6.1 de `DESIGN.md` §5 porte une réserve explicite : il ne peut pas viser `mockups/socle.css` en l'état.

  Aucune écriture dans `mockups/` : la source est gelée et protégée mécaniquement.

- **Arbitrage attendu** : resynchroniser `mockups/socle.css` sur le socle en ligne de V-41 puis regeler, ou déclarer formellement que le socle de référence est le bloc en ligne de V-41 et que le fichier autonome est un vestige. Tant que l'un des deux n'est pas tranché, la batterie 2 n'a pas de référence stable.

- **Portée** : T-004 (batterie 2, contrôle des jetons), et tout lot portant une vue employant un champ de saisie ou une notification — soit 21 des 41 vues au moins.
