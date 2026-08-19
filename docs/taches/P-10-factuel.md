
> Généré par `node verif/contrat.mjs V-12 V-22 V-23`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-12

| | |
|---|---|
| Maquette gelée | `mockups/V-12-liste-notes.html` |
| Empreinte | `9993706d77343357cb1076616c58f3e6dbee8e13d1c18db921794710f18be0fb` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
dom-infrastructure · dom-poste-de-travail · arr-tout · arr-obsolete · arr-brouillon · etat-nominal · etat-vide
```

## V-22

| | |
|---|---|
| Maquette gelée | `mockups/V-22-signets.html` |
| Empreinte | `6e2acda1e36a62de0df4861c64c832a324a6d017f4e8a7e023f83f68a58ca312` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
dom-infrastructure · dom-applications · dom-poste-de-travail · droits-ecriture · droits-lecture · rappel
```

## V-23

| | |
|---|---|
| Maquette gelée | `mockups/V-23-signet-formulaire.html` |
| Empreinte | `358ec85ce74a7299303bdc8be6417e72ca32c9906ae668d492052ce19fbe525c` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | `modalite-dialogue` (ARB-017) |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
env-dialogue · env-page · mode-creation · mode-edition · recup-ok · recup-lente · recup-echec
```

## Critères de sortie — 20 couples au total

```
pnpm verif:maquette V-12 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-22 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-23 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-12 --installer
node verif/feuilles-de-vue.mjs V-22 --installer
node verif/feuilles-de-vue.mjs V-23 --installer
```
