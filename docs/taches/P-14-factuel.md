
> Généré par `node verif/contrat.mjs V-05 V-06`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-05

| | |
|---|---|
| Maquette gelée | `mockups/V-05-connexion.html` |
| Empreinte | `31cb9bb65c0898432ef01c209f6cbbc863d776b48ff9ef34b2518858fd47cb25` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
arrivee-protegee · arrivee-expiree · arrivee-directe · issue-succes · issue-echec · issue-trop
```

## V-06

| | |
|---|---|
| Maquette gelée | `mockups/V-06-reinitialisation.html` |
| Empreinte | `edbbd06fd7c3aafb4d29bb0b7b25964eb971b0e2a509361c2f6c15ad028ef020` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
et-1 · et-2 · et-3 · et-4 · cpt-connu · cpt-inconnu · expire
```

## Critères de sortie — 13 couples au total

```
pnpm verif:maquette V-05 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-06 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-05 --installer
node verif/feuilles-de-vue.mjs V-06 --installer
```
