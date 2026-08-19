
> Généré par `node verif/contrat.mjs V-17 V-18`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-17

| | |
|---|---|
| Maquette gelée | `mockups/V-17-editeur.html` |
| Empreinte | `3527a627001b5e0159b95dfbac0f98290d7b725dbb969d456f63008b50c532f0` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
cas-vierge · cas-template · cas-modif · sv-normal · sv-erreur · doublon
```

## V-18

| | |
|---|---|
| Maquette gelée | `mockups/V-18-editeur-operationnel.html` |
| Empreinte | `856bf804f50202757d580acbfe6f28aa559a8cbb65d730835ef2b39acac62200` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
cas-existant · cas-vierge · cas-desync · ref-ouvert · ref-cote · ref-ferme
```

## Critères de sortie — 12 couples au total

```
pnpm verif:maquette V-17 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-18 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-17 --installer
node verif/feuilles-de-vue.mjs V-18 --installer
```
