# ÉCART-020 — Résidu de T-102b — 19 août 2026

**Écart consigné avec retard.** Le rapport de T-102b existait, mais son fichier d'écart n'a jamais
été écrit et son correctif est entré dans le commit d'un autre lot (`c1bb2f6`, étiqueté T-009b).
Le vérificateur du recours au niveau 3, chargé de vérifier ce rapport, ne l'a pas trouvé et a **tout
remesuré depuis zéro**. Défaut d'orchestrateur.

## É-1 — V-40 passe de 0/10 à 9/10, et de 4 états en écart à 1

| État | Avant | Après |
|---|---|---|
| `d-dossier` | 4 380 px | **0** |
| `d-reviser` | 4 746 px | **0** |
| `d-relation` | 2 884 px | **0** |
| `d-droits` | 18 px | 18 px — recours au niveau 3, accordé |

**La cause.** La maquette focalise le premier contrôle à l'ouverture — `showModal()` puis
`focus()` sur `.saisie, .selecteur, .btn--principal`. Le squelette n'ayant pas de script (ADR-001,
ARB-011), la focalisation retombait sur le bouton de fermeture. **Exactement les trois boîtes dont
la cible est une `.saisie` ou un `.selecteur` produisaient des pixels** — les cinq dont la cible
est un `.btn--principal` étaient à zéro, la focalisation programmatique en modalité pointeur ne
déclenchant pas `:focus-visible`.

**La correction.** `autofocus` sur l'élément que la maquette focalise, dans les dix boîtes : c'est
la forme **déclarative** que l'algorithme du délégué de focalisation de `showModal()` honore. Pas
de script, donc aucune contradiction avec ARB-011. Pour les deux cibles désactivées, le délégué
retombe sur le bouton de fermeture — le même résultat que la maquette, où `focus()` y est sans
effet.

## É-2 — L'attribution d'ARB-018 était fausse. **Corrigée au registre.**

`ARB-018` et `ECART-017` É-2 nommaient « un bloc `.contexte` posé sur `--c-papier` là où la
référence le pose sur `--c-accent-voile` ». Vérifié par l'orchestrateur : `.contexte` n'apparaît que
dans `d-restaurer`, **qui était déjà conforme**, et **aucune règle `.contexte` ne pose de fond**
dans le socle ni dans la feuille de V-40. Le couple de jetons était juste ; l'élément était faux.
La cause réelle est `.saisie:focus { box-shadow: 0 0 0 3px var(--c-accent-voile) }`
(`src/socle.css:422`).

La **décision** d'ARB-018 n'est pas affectée : un défaut réel passait bien sous la tolérance, et le
resserrement est ce qui l'a fait remonter. Seule l'attribution était fausse — et une leçon attachée
à un diagnostic invérifiable ne vaut rien.

Corrigé dans `docs/arbitrages.md` **et** dans le bandeau de `verif/references/tolerances.json`, qui
portait encore le diagnostic rétracté.

## É-3 — Les cinq largeurs de V-39, résolues par adoption de la factorisation du gel

Le gel n'écrit pas ces largeurs dans un style : il a une fabrique `ligne(largeur, classe)` qui fait
`l.style.width = largeur`. L'analyseur réduit donc le gel à `width:‹calculé›`, et **ce marqueur
n'est pas un joker** : il n'admet pas `width:64%`.

L'exécutant a porté le **calque exact de cette fabrique** en fragment Svelte, appelé avec les cinq
mêmes valeurs. Ce n'est pas un déplacement de littéral dans un `.ts` — le contournement nommé et
non emprunté deux fois — c'est l'adoption de la factorisation du gel, largeurs au point d'appel.
`pnpm vues:styles V-39` : de 5 déclarations hors du gel à **0**.

## É-4 — Deux divergences du gabarit relevées en passant

Traitées par ARB-020 et le lot T-101d, qui les a l'une et l'autre **refusées** après mesure. Voir
`ECART-021`.
