
> Généré par `node verif/contrat.mjs V-19 V-20 V-21`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-19

| | |
|---|---|
| Maquette gelée | `mockups/V-19-cartographie.html` |
| Empreinte | `8b347b0645065996b06703e8356957d99dee8d5ee36b8a28a23b2078dfb21976` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
role-admin · role-referent · etat-nominal · etat-chargement · etat-vide · etat-dense
```

## V-20

| | |
|---|---|
| Maquette gelée | `mockups/V-20-carto-type-maitre.html` |
| Empreinte | `3d1a5eb8b89c21967b761b1af53e057e32934c8463127d79cee93e4e4d3f7295` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
moment-aucun · moment-anneau · moment-deplie · isole · disparu
```

## V-21

| | |
|---|---|
| Maquette gelée | `mockups/V-21-carte-mentale.html` |
| Empreinte | `7db54fe019022d985ed3aa43fc76fb0af32de611ba705fa09e67f414ed43f8c1` |
| États | **3** — 3 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **3** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
dv-complets · dv-restreints · lent
```

## Critères de sortie — 14 couples au total

```
pnpm verif:maquette V-19 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-20 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-21 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-19 --installer
node verif/feuilles-de-vue.mjs V-20 --installer
node verif/feuilles-de-vue.mjs V-21 --installer
```
