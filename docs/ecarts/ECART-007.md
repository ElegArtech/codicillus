# ÉCART-007 — Système visuel / source du socle — 18 août 2026

**Gravité : haute.** Invalide la prémisse d'ADR-002 et le critère de sortie de T-004.

## Nature

`mockups/socle.css` est présenté par `STACK-TECHNIQUE.md §1`, par `ADR-002` et par le critère de
sortie de T-004 comme **la source unique du système visuel**. C'est faux : c'est un **extrait
périmé**.

Chaque maquette embarque son propre socle en ligne — et c'est *lui* qui rend à l'écran. Il en
existe **six états** :

| Lignes | Vues porteuses |
|---|---|
| 331 | V-01, V-02, V-03, V-09 — **état repris par `mockups/socle.css` (332 l. au saut de ligne près)** |
| 399 | V-05, V-08, V-10 |
| 400 | V-11, V-12, V-13 |
| 401 | 25 vues (V-04, V-06, V-15 à V-37) |
| 465 | V-14, V-38, V-39, V-40, V-41 |
| 466 | V-07 — le plus complet |

Le fichier autonome correspond au **plus ancien**, employé par 4 vues sur 41. Il lui manque toute
la section « champs de saisie » — que 21 vues emploient —, les notifications à quatre types, la
règle de rôle `.si-admin` et le jeton `--l-large`.

**Une copie conforme de `mockups/socle.css` produirait une application qui ne rend pas 37 vues
sur 41.**

## Analyse d'emboîtement

Comparaison règle à règle, commentaires neutralisés, du socle de V-07 (466 lignes, 104 règles)
contre les cinq états antérieurs :

- **Aucune règle absente** : les 104 règles du plus complet couvrent l'intégralité des sélecteurs
  des cinq autres états.
- **`:root` strictement identique** dans les six états — les 69 jetons sont stables. Aucune valeur
  de couleur, d'espacement, de rayon ou de typographie n'a bougé.
- **Une seule divergence réelle** : le composant de notification a été refondu entre l'état 401 et
  l'état 465.

| | état 401 | état 465-466 |
|---|---|---|
| `.notif` | `display: flex` · `align-items: center` · `gap: var(--e-3)` · `padding: var(--e-3) var(--e-4)` | `display: grid` · `grid-template-columns: auto minmax(0,1fr) auto` · `align-items: start` · `gap: var(--e-1) var(--e-3)` · `width: 100%` · `line-height: 1.45` |
| `.notifs` | — | `max-width: min(400px, calc(100vw - var(--e-5)*2))` · `pointer-events: none` · repli à `bottom/left/right: var(--e-3)` et `max-width: none` |

Le reste des écarts entre états est de l'**ajout pur** ou de la **reformulation de commentaire**
(`--l-lecture`, titre de la section 9).

## Résolution par cohérence — pas d'arbitrage requis

Le socle de **V-07 (466 lignes)** est retenu comme feuille applicative. Trois raisons, toutes
opposables :

1. **Aucune régression possible sur les 35 vues à socle antérieur.** Leur balisage de
   notification est `<div class="notifs" id="notifs" role="status" aria-live="polite"></div>` —
   **vide**. Les notifications sont injectées par script au déclenchement. Dans l'état capturé par
   défaut, aucun élément `.notif` n'existe : la divergence de style est **inerte**.
2. **V-38 fait autorité sur les notifications.** C'est la vue dont c'est le sujet, et elle porte
   l'état 465. Une vue dont la notification n'est qu'un accessoire ne peut pas trancher contre la
   vue qui la spécifie. L'ordre de préséance joue ici entre maquettes, par spécialité.
3. **V-07 est le gel le plus récent** (produite le 16/08/2026, `PLAN §1.2` point 6) et son socle
   est un sur-ensemble strict de celui de V-38 — un ajout d'une ligne.

**Conséquence pour le banc de comparaison** : tout scénario déclenchant une notification sur l'une
des 35 vues à socle antérieur comparera l'implémentation (grille) contre une référence en flex.
Ces états sont à déclarer dans `verif/scenarios/` avec un renvoi au présent écart, et à trancher
au niveau 3 en faveur de l'implémentation. Aucun n'est un état par défaut.

## Ce qui doit être corrigé en amont

- `ADR-002` : la source unique est le socle en ligne le plus complet, pas `mockups/socle.css`.
- `STACK-TECHNIQUE.md §1` et `PLAN §3.4` : même correction.
- Critère de sortie de T-004 : la « copie contrôlée » porte sur le socle extrait de V-07.
- `PLAN §3.4` annonce 61 jetons ; il y en a **69** (70 avec `--l-large`, propre au socle en ligne).

**Arbitrage attendu** : validation de la résolution ci-dessus, et mise à jour des trois documents
de cadrage — qui ne peut être faite que par vous, `cadrage/` étant en écriture humaine seulement.
