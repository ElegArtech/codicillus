# Spécification : vivacité (5 états)

Remplace la fabrique à 3 niveaux de `src/lib/fraicheur.ts`. Garder le principe P-01 / ADR-005 : une seule implémentation, aucune vue ne recalcule.

## Entrées
- `verifiee` : date de la dernière vérification du **registre** (Référence ou Opérationnel), ou `null` si jamais vérifié (alors repli sur la date de modification, comme RG-M06-01).
- `validite` : durée de validité en jours, propre au registre (Référence 90 j par défaut, Opérationnel 21–30 j par défaut ; configurables).
- `revision` : demande de révision active (compte + date) ou `null`.
- `aujourdhui`.
- Configuration : `seuilBientot` = 10 j, `retardRevoir` = 14 j, `retardObsolete` = 90 j.

## Calcul
```
echeance = verifiee + validite
reste    = jours(aujourdhui → echeance)          // entier, négatif si dépassé

si revision                  → arevoir
sinon si reste >  seuilBientot     → ajour
sinon si reste >= 0                → bientot
sinon si reste > -retardRevoir     → averifier
sinon si reste > -retardObsolete   → arevoir
sinon                              → obsolete
```

## Sorties (une seule fabrique)
| clé | libellé | couleur | voile | glyphe (dans un anneau r=6.5) | attention |
|---|---|---|---|---|---|
| ajour | À jour | #1d6b4a | #e4efe8 | disque plein | 0 |
| bientot | Bientôt à vérifier | #6f6a0e | #f2f0dc | ¾ de disque `M8 8V1.5A6.5 6.5 0 1 1 1.5 8z` | 1 |
| averifier | À vérifier | #8f5c00 | #f6eedd | ½ disque `M8 1.5a6.5 6.5 0 0 1 0 13z` | 2 |
| arevoir | À revoir | #b4471c | #f8e6dc | « ! » `M7.1 4h1.8v5H7.1zM7.1 10.3h1.8v1.8H7.1z` | 3 |
| obsolete | Obsolète | #a52c1b | #f7e7e3 | anneau vide | 3 |

Libellés temporels (forme longue, ligne compacte) :
- `Vérifiée le 13 août 2026 par Alexandre Berge`
- reste > 0 : `Prochaine vérification : 11 nov. 2026 (dans 67 jours)`
- reste = 0 : `Échéance aujourd'hui : 5 sept. 2026`
- reste < 0 : `Échéance dépassée de 4 jours (1 sept. 2026)`
- jamais vérifiée : `Jamais vérifiée` (le niveau se lit sur la modification)

Rappel automatique (colonne droite + pied de note) :
- reste ≥ 0 : `Cette note repassera automatiquement à « À vérifier » le 11 nov. 2026.`
- en retard : `En attente de vérification depuis le 1 sept. 2026. Passage à « À revoir » le 15 sept. 2026.`
- obsolète : `Échéance dépassée depuis le … Une nouvelle vérification relancera le cycle.`

Forme compacte (rail, listes) : `dans 67 j` / `21 j de retard` / `jamais`.

Frise (colonne droite) : position d'aujourd'hui = clamp((aujourdhui − verifiee) / (echeance − verifiee), 0, 1) ; trait plein coloré jusqu'à aujourd'hui, pointillé ensuite ; rond d'échéance plein de la couleur d'état si dépassée, anneau gris sinon ; légende centrale `J−67` ou `J+21`.

## Attention progressive (ligne compacte de la note)
- attention 0–1 : fond transparent, échéance en gris 400
- attention 2 : fond `rgba(143,92,0,.06)`, échéance en couleur d'état 600
- attention 3 : fond = voile de l'état, échéance en couleur d'état 600

## Événements d'historique générés automatiquement
- passage `ajour → averifier` à l'échéance (type `etat`)
- passage `averifier → arevoir` à J+14 (type `etat`)
- passage `arevoir → obsolete` à J+90 (type `etat`)
- vérification (type `verif`, remet à `ajour`, lève la révision)
- demande / levée de révision (type `etat`)
- création de l'Opérationnel (type `verif`, registre `operationnel`, vérifié à l'instant)

## Tests attendus (vitest)
- bornes strictes : reste = seuilBientot → bientot ; reste = 0 → bientot ; reste = −1 → averifier ; reste = −14 → arevoir ; reste = −90 → obsolete
- révision active force arevoir même à reste = 80
- deux registres de la même note peuvent être dans deux états différents
- « Marquer comme vérifiée » n'agit que sur le registre courant
