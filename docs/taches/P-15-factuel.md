
> Généré par `node verif/contrat.mjs V-07`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-07

| | |
|---|---|
| Maquette gelée | `mockups/V-07-accueil-contributeur.html` |
| Empreinte | `73931a3edd612aef57d0138ca5ced4a2aef9624909ba3047074c5136b194847c` |
| États | **9** — 9 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **9** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
role-referent · role-admin · role-lecteur · etat-nominal · etat-chargement · etat-partiel · etat-erreur · etat-vide · aide
```

## Critères de sortie — 9 couples au total

```
pnpm verif:maquette V-07 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-07 --installer
```
