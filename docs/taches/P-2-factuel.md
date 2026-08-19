
> Généré par `node verif/contrat.mjs V-27 V-28`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-27

| | |
|---|---|
| Maquette gelée | `mockups/V-27-console-univers.html` |
| Empreinte | `ba621606ceab5bb74f094d1a916c1ae6f8a9709760fcba5d56dfb9469f1779ca` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · sup-refus · sup-systeme · sup-ok
```

## V-28

| | |
|---|---|
| Maquette gelée | `mockups/V-28-console-domaines.html` |
| Empreinte | `07195d8bf5a91a4c9e2ba266b8cb1aa7d4fbb7580d834920d982a81d809c4d94` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · sup-plein · sup-vide
```

## Critères de sortie — 11 couples au total

```
pnpm verif:maquette V-27 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-28 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-27 --installer
node verif/feuilles-de-vue.mjs V-28 --installer
```
