
> Généré par `node verif/contrat.mjs V-01 V-02 V-03 V-04 V-26`.
> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de
> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.

## V-01

| | |
|---|---|
| Maquette gelée | `mockups/V-01-accueil-public.html` |
| Empreinte | `2d850e4f7775a80978cf12d2baf0e95bdc69c32e6e6f89ebb0d859565d5a40f2` |
| États | **7** — 7 de planche, 0 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **28** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
etat-nominal · etat-chargement · etat-vide · etat-erreur · frappe-rien · frappe-trouve · frappe-rien-trouve
```

## V-02

| | |
|---|---|
| Maquette gelée | `mockups/V-02-recherche-publique.html` |
| Empreinte | `1e4f6361209c7fc8ee3999d610d6ba0514f3cdea68cf5d3b7b819ede8f396675` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **20** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
etat-nominal · etat-chargement · req-mot-de-passe · req-support · req-note-de-frais
```

## V-03

| | |
|---|---|
| Maquette gelée | `mockups/V-03-lecture-publique.html` |
| Empreinte | `ed2971199ae3b319771c9bffad76c1309a5e53b1925efc21f65475de843c12fb` |
| États | **4** — 4 de planche, 0 de zone |
| Fenêtres | 4 — vue visée par RG-M18-13 (ARB-009) |
| **Couples à rendre conformes** | **16** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
fr-frais · fr-vieil · fr-obs · op
```

## V-04

| | |
|---|---|
| Maquette gelée | `mockups/V-04-non-trouvee-public.html` |
| Empreinte | `79c79fb281f58d514aa51f3c986929eb65fdb64ec20e3d6c8796677a8acdea2f` |
| États | **3** — 3 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **3** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
cas-inexistant · cas-prive · cas-nu
```

## V-26

| | |
|---|---|
| Maquette gelée | `mockups/V-26-non-trouvee-connecte.html` |
| Empreinte | `85eec603edecbe6110ace2d43a5facd312a994b2bbe8ab907d63766e039ebf51` |
| États | **5** — 5 de planche, 0 de zone |
| Fenêtres | 1 |
| **Couples à rendre conformes** | **5** |
| Zones comparées | page entière, par défaut |
| États de zone | — |
| Révélation | — |

**Clés d'état** — toutes doivent être conformes, une vue partiellement
conforme n'est pas une vue livrée (`PLAN §4.3`) :

```
cas-supprimee · cas-inexistante · cas-interdite · droits-ecriture · droits-lecture
```

## Critères de sortie — 72 couples au total

```
pnpm verif:maquette V-01 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-02 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-03 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-04 --contre=app     → 0, zéro pixel divergent
pnpm verif:maquette V-26 --contre=app     → 0, zéro pixel divergent
pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0
pnpm verif:gel · pnpm test:unit                             → 0
pnpm verif:maquette          (à blanc, 41 vues)             → 0
```

Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge
sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un
recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.

**La feuille de style se pose par commande**, jamais à la main :
```
node verif/feuilles-de-vue.mjs V-01 --installer
node verif/feuilles-de-vue.mjs V-02 --installer
node verif/feuilles-de-vue.mjs V-03 --installer
node verif/feuilles-de-vue.mjs V-04 --installer
node verif/feuilles-de-vue.mjs V-26 --installer
```
