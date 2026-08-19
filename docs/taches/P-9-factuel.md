
> Généré par `node verif/contrat.mjs V-10 V-11 V-13`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-10

| | |
|---|---|
| Maquette gelée | `mockups/V-10-page-univers.html` |
| Empreinte | `5a76b3c6a9ec0b81ce47468e7c0f6975c6e2d9c4602ca3b91daf8c4d53d7adc5` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **7** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
droits-ecriture · droits-lecture · uni-production · uni-projets · etat-peuple · etat-vide · etat-chargement
```

## V-11

| | |
|---|---|
| Maquette gelée | `mockups/V-11-page-domaine.html` |
| Empreinte | `fd9edfac2335ab35cd57d6bd687c51b6221264fadbe54de01846b00acdd65bcb` |
| États | **8** — 8 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **8** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
dom-infrastructure · dom-migration-2026 · dom-poste-de-travail · role-referent · role-admin · role-lecteur · etat-peuple · etat-vide
```

## V-13

| | |
|---|---|
| Maquette gelée | `mockups/V-13-page-dossier.html` |
| Empreinte | `43a48eca4ebfc6fac6dabda0dc8858a2dadc5e68302bc83b253dfbef91dd12f5` |
| États | **6** — 6 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **6** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
dos-exploitation · dos-exploitation-sauvegardes · dos-exploitation-ordonnancement · dr-gestionnaire · dr-redacteur · dr-lecteur
```

## Critères de sortie — 21 couples au total

```
pnpm verif:maquette V-10 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-11 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-13 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-10 --installer
node verif/feuilles-de-vue.mjs V-11 --installer
node verif/feuilles-de-vue.mjs V-13 --installer
```
