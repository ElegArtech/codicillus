
> Généré par `node verif/contrat.mjs V-14 V-15`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-14

| | |
|---|---|
| Maquette gelée | `mockups/V-14-lecture-note.html` |
| Empreinte | `248c882fce2a1099bd6915abdc246fca300681ae2694c4cc0e1e0eb4a7281c37` |
| États | **11** — 11 de planche, 0 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **44** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
droits-ecriture · droits-lecture · fr-frais · fr-vieil · fr-obs · revision · brouillon · resync · op · etat-nominal · etat-chargement
```

## V-15

| | |
|---|---|
| Maquette gelée | `mockups/V-15-historique.html` |
| Empreinte | `2c874fc2c022daa5c2313d6a6c1e8f53e8a57e4a907468c5362b3bac1631a0bd` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
pan-ouvert · pan-ferme · hist-riche · hist-une · hist-aucune · droits-ecriture · droits-lecture
```

## Critères de sortie — 51 couples au total

```
pnpm verif:maquette V-14 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-15 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-14 --installer
node verif/feuilles-de-vue.mjs V-15 --installer
```
