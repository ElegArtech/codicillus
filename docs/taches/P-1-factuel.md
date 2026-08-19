
> Généré par `node verif/contrat.mjs V-41`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-41

| | |
|---|---|
| Maquette gelée | `mockups/V-41-bibliotheque.html` |
| Empreinte | `71b82a9ef1d5347985f7288759f234e823ae9c07899b141e4cd99e11ef27940a` |
| États | **11** — 0 de planche, 11 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **11** |
| Zones comparées | page entière, par défaut |
| États de zone | `page-entiere-zone-isolee` (ARB-014) |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
fraicheur · boutons · champs · pastilles · conteneurs · navigation · donnees · superpositions · prose · retours · identite
```

## Critères de sortie — 11 couples au total

```
pnpm verif:maquette V-41 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-41 --installer
```
