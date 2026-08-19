
> Généré par `node verif/contrat.mjs V-25`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-25

| | |
|---|---|
| Maquette gelée | `mockups/V-25-profil.html` |
| Empreinte | `14164a1e5e5140357fb65696aa4bc7e9528d81cd7a7f3cc58abf2c5f9d378dc8` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
ong-identite · ong-securite · ong-distinctions · ong-activite · cpt-karim · cpt-neuf · verrou
```

## Critères de sortie — 7 couples au total

```
pnpm verif:maquette V-25 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-25 --installer
```
