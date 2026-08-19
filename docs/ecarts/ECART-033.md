# ÉCART-033 — La maquette de la recherche est cassée — 19 août 2026

**Gravité : haute. Demande un regel, donc votre geste.**

## Le fait, vérifié par l'orchestrateur

`mockups/V-08-recherche.html` appelle deux fonctions **qui ne sont définies nulle part** dans ses
2 377 lignes :

```
V-08:1966    affiches = trier(filtres);          →  aucune définition de `trier`
V-08:2025    zoneRes.appendChild(carte(n, q, k, …))
```

Vérifié : `grep` ne trouve **aucune** définition de `trier` dans le fichier. `rendre()` **lève à
chaque appel**, sur les sept états.

**V-08 est la seule des 41 maquettes à lever une erreur de page** — balayage complet, une charge
chacune.

## Ce que cela produit, mesuré

L'exception tombe **après** le calcul des facettes et **avant** le remplissage des résultats :

| Zone | État |
|---|---|
| `#facettes` | **rendu** — les sept facettes sont calculées |
| `#resultats` | **vide** |
| `#compteur` | **vide** |
| `#actifs` | **vide** |
| champ de saisie | garde la valeur du balisage, jamais focalisé |

Conséquence : **`etat-trop` est identique à `etat-nominal`**, et les sept états ne diffèrent que par
quatre attributs.

## Ce que l'exécutant a fait, et pourquoi c'est juste

Il a **reproduit ce vide**. C'est la jurisprudence du piège **P-3** — *le gel fait loi, et un
implémenteur qui « réparerait » une évidence rendrait ses vues rouges*. Les 52 couples sortent à
zéro pixel, sur quatre fenêtres.

Il n'a rien inventé : il aurait fallu **décider à quoi ressemble un résultat de recherche**, ce que
le gel ne dit pas et qu'aucun agent n'a le droit de dessiner.

## Ce que cela laisse ouvert, et qu'il faut lire sans l'adoucir

> **La vue de recherche du produit est conforme à sa maquette, et sa maquette ne montre pas de
> résultats.**

`M02.5` décrit pourtant ce qu'un résultat doit porter — extrait de deux à trois lignes, termes mis
en évidence, compteur « 4 résultats sur 37 », facettes avec leur décompte. Le cahier des charges le
dit ; la maquette ne le montre pas.

**Le trou n'est écrit nulle part** : ni dans `docs/`, ni dans `verif/`. Il a fallu qu'un lot charge
la maquette dans un navigateur pour le voir — trois mois après le gel, et après que le banc l'a
déclarée conforme à elle-même 409 fois.

## Pourquoi le dispositif ne l'a pas vu

L'étalonnage à blanc compare **la maquette à elle-même**. Une maquette qui lève une erreur la lève
des deux côtés : les deux captures sont identiques, et le verdict est vert.

C'est la limite structurelle du régime à blanc, et elle est de la même famille que celles déjà
nommées — `ECART-015` É-5 (un étalon ne prouve que ce qu'il emprunte) et le piège **P-5** (une règle
qu'aucun cas n'exerce). **Ici : un défaut que les deux côtés partagent est un défaut que la
comparaison ne peut pas voir.**

## Résolution

**Un regel de V-08**, en régime assisté — hors dépôt, geste du commanditaire. Aucun agent ne peut
dessiner ce que la maquette ne montre pas.

**En attendant : V-08 est conforme et livrée**, contrairement à V-06. La différence est nette et
elle tient : V-06 diverge de **son propre gel** et ne peut donc pas être conforme ; V-08 est
**fidèle à son gel**, lequel est incomplet. Le premier est un problème de conformité, le second un
problème de spécification.

## Deux autres remontées du même lot

**La dérogation K-10 n'a pas été empruntée.** Le lot avait seul le droit de rouvrir le gabarit pour
monter la palette. Il a **vérifié que ce n'était pas nécessaire** — V-09 n'a ni coquille ni `<main>`,
l'hôte de palette des 30 autres maquettes a une incidence mesurée nulle, et le montage réel est du
comportement. Le sixième passage est évité.

**Un trou d'extracteur, déclaré**  : `ensembleDuGel('V-09')` ne voit pas `max-height:300px`, que le
gel pose dans un **objet d'options** et non dans une affectation de style. C'est une sixième forme,
après celle d'`ECART-028`. L'exécutant a gardé le calque de la fabrique et déclaré le manque.
