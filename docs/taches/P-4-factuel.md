
> Généré par `node verif/contrat.mjs V-33 V-34 V-35 V-36`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-33

| | |
|---|---|
| Maquette gelée | `mockups/V-33-console-configuration.html` |
| Empreinte | `4e950a464d8a89065ec4bb4c02339acc4cbf58f124b65f75f97c8ea6ce282364` |
| États | **4** — 4 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **4** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
seuils-actuel · seuils-severe · seuils-large · seuils-invalide
```

## V-34

| | |
|---|---|
| Maquette gelée | `mockups/V-34-console-analytique.html` |
| Empreinte | `42e06c77b460a77074bfc030e35dcfdbb4212c31989c44f3b8312ecac92f4373` |
| États | **2** — 2 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **2** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
don-completes · don-insuffisantes
```

## V-35

| | |
|---|---|
| Maquette gelée | `mockups/V-35-console-imports.html` |
| Empreinte | `5765c89ac0866aefbde0627993791b67960bc867f777aba94f8c3edde67df90d` |
| États | **4** — 0 de planche, 4 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **4** |
| Zones comparées | page entière, par défaut |
| États de zone | `page-entiere-zone-isolee` (ARB-014) |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
depot-au-repos · scenarios-directs · journal-peuple · rapport-de-lot
```

## V-36

| | |
|---|---|
| Maquette gelée | `mockups/V-36-console-exports.html` |
| Empreinte | `768c5fc304435ca2088bc937f2b7ddb8bb618a1572580bb9bf2973b86e081928` |
| États | **4** — 4 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **4** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
issue-propre · issue-avert · vol-normal · vol-lent
```

## Critères de sortie — 14 couples au total

```
pnpm verif:maquette V-33 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-34 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-35 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-36 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-33 --installer
node verif/feuilles-de-vue.mjs V-34 --installer
node verif/feuilles-de-vue.mjs V-35 --installer
node verif/feuilles-de-vue.mjs V-36 --installer
```
