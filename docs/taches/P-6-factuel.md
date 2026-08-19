
> Généré par `node verif/contrat.mjs V-16`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-16

| | |
|---|---|
| Maquette gelée | `mockups/V-16-comparaison.html` |
| Empreinte | `f41c89d825e7375068fc90230b6a26242162fc79a0cd3ca743404591dd9ececc` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
cmp-13-14 · cmp-11-14 · cmp-14-14 · cmp-13-13 · tout
```

## Critères de sortie — 5 couples au total

```
pnpm verif:maquette V-16 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-16 --installer
```
