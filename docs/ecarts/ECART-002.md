# ÉCART-002 — T-005 / jeu de semence — 18 août 2026

- **Nature** : `PLAN-DE-REALISATION.md` §3.6 annonce « trente-six des quarante maquettes embarquent un objet `window.CORPUS` […] partiellement redondant d'une vue à l'autre » et prévoit en §7.3 un workflow `/corpus-unifie` fanant sur 36 agents pour « réconcilier » ces corpus et « remonter toute incohérence détectée ».

  Constat mécanique sur les 41 fichiers gelés : il n'existe que **cinq variantes, strictement emboîtées**.

  | Empreinte du bloc | Notes | Vues |
  |---|---|---|
  | `439cbcd0` | 32 | V-04, V-07, V-14, V-20, V-22 à V-41 — **sur-ensemble** |
  | `46cba239` | 27 | V-19, V-21 |
  | `aacdc9a3` | 19 | V-01 à V-03, V-08, V-10 à V-13, V-15 à V-18 |
  | `fff876ff` | 14 | V-09 |
  | vide | 0 | V-05, V-06 |

  Aucun identifiant de note n'existe hors du jeu de 32 (vérifié par `comm` sur les listes triées d'identifiants). Il n'y a **rien à réconcilier**.

- **Cause** : estimation du plan établie par comptage de fichiers porteurs, non par comparaison de contenu.
- **Effet** : le workflow `/corpus-unifie` et son réglage `large` (§7.3) tombent. T-005 devient un lot d'agent unique avec preuve d'emboîtement par test.
- **Arbitrage** : aucun requis — allègement sans perte. Signalé pour la mise à jour du plan et pour le point ouvert n° 2 du guide (coût du diff retour).
