
> Généré par `node verif/contrat.mjs V-08 V-09`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-08

| | |
|---|---|
| Maquette gelée | `mockups/V-08-recherche.html` |
| Empreinte | `02c455a44274b304725a9a0bd011632d28cedaa27af80cdc23c3ffac1f8ede7e` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **28** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
droits-ecriture · droits-lecture · etat-nominal · etat-chargement · etat-vide · etat-trop · degrade
```

## V-09

| | |
|---|---|
| Maquette gelée | `mockups/V-09-palette.html` |
| Empreinte | `337c9bff280f9b65f924b8cae209fadc0229e29e8adfd65717dd1ad96ee2bdb0` |
| États | **6** — 0 de planche, 6 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **24** |
| Zones comparées | page entière, par défaut |
| États de zone | `page-entiere-zone-isolee` (ARB-014) |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
repos · unecar · resultats · vide · degrade · etroit
```

## Critères de sortie — 52 couples au total

```
pnpm verif:maquette V-08 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-09 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-08 --installer
node verif/feuilles-de-vue.mjs V-09 --installer
```
