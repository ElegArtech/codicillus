
> Généré par `node verif/contrat.mjs V-29 V-30 V-31 V-32`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-29

| | |
|---|---|
| Maquette gelée | `mockups/V-29-console-types-fiches.html` |
| Empreinte | `f1503bf578b4194979573d6812eedf17596ccfcc231a62144177a97e53cea45f` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · sup-refus · sup-ok
```

## V-30

| | |
|---|---|
| Maquette gelée | `mockups/V-30-console-types-relations.html` |
| Empreinte | `452372405330b6fd9f2f760146a08e290939e1a4e8fbbea8257130e66f0441d9` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · sup-utilise · sup-libre
```

## V-31

| | |
|---|---|
| Maquette gelée | `mockups/V-31-console-templates.html` |
| Empreinte | `c7a6f5344b1673446684e9d19102e0cd5053785f277c09b229ada60bc02c2bec` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · sup-defaut · sup-autre
```

## V-32

| | |
|---|---|
| Maquette gelée | `mockups/V-32-console-comptes.html` |
| Empreinte | `4114c925491ed41295c11405144f5e5de21097bf390ee2b6ea01bc0e9dbb8335` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
form-ferme · form-creation · form-edition · form-admin · mdp · des
```

## Critères de sortie — 21 couples au total

```
pnpm verif:maquette V-29 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-30 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-31 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-32 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-29 --installer
node verif/feuilles-de-vue.mjs V-30 --installer
node verif/feuilles-de-vue.mjs V-31 --installer
node verif/feuilles-de-vue.mjs V-32 --installer
```
