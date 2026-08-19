# ÉCART-019 — Résidu de T-009b, sept points — 19 août 2026

**L'inventaire fermé est complet et mécaniquement tenu.** C'était une dette ouverte depuis cinq
lots et une condition de clôture de la phase 1 : elle est soldée.

## Ce que le lot établit

**1 254 classes** relevées sur les 41 maquettes, par un instrument rejouable et non par un relevé à
la main :

| Nature | Classes | Règle |
|---|---|---|
| **Transverse** | 449 (210 déjà là, **239 ajoutées**) | déclarée au socle **ou** employée par ≥ 2 vues → **nommée au §2**, P-5 la tient |
| **Propre à une vue** | 790 | employée par une seule → **pas nommée**, gouvernée par sa maquette gelée |
| **Hors produit** | 5 | `.planche`, `section.regles` |
| Déclarée sans emploi | 10 | fait du gel |

**La règle distinguant les deux premières natures manquait**, et son absence rendait le mot
« fermé » ambigu depuis le premier lot. Elle est écrite et opposable : le document ne duplique pas
790 lignes d'une source gelée — ce serait une seconde source de vérité.

**Le relevé lit les fabriques de script.** Sans elles, 1 679 affectations de `className` restaient
invisibles et `.avatar-p`, `.encart-b`, `.chrono__txt` passaient pour mortes. Le §6.4 annonçait
« 1 202 classes » sans méthode ; le chiffre est refait et reproductible.

## Les quatre contradictions, tranchées sur décompte

1. **`.zone-etat` fait loi contre `.vide`.** `.zone-etat` : socle, **une seule définition**, 5 vues.
   `.vide` : 2 vues seulement, déclarée par elles, et **deux définitions divergentes** — bord plein
   contre tireté, espacements et graduations différents. Fait mesuré qui confirme `ECART-015` : les
   trois occurrences de `zone-etat` dans V-39 sont les **déclarations du socle**, aucune n'est un
   emploi. `.vide` ne disparaît pas — elle est au gel — mais ne se factorise ni ne se promeut.
2. **Aucun des trois indicateurs chiffrés n'est canonique.** `.indicateur` 1 vue, `.mesure` 3 vues
   à **trois définitions divergentes**, `.mesure-a`/`.nord` 1 vue. La vue à porter garde la sienne.
   **Et le §6.3 se trompait de volume** : ce ne sont pas quatre composants propres à V-41, c'en est
   **37** — il plaçait en outre `.infobulle` en V-08 et `.menu-ctx` en V-12/V-22, où elles
   n'apparaissent pas.
3. **`.selecteur` entre à l'inventaire.** Sur les 25 `<select>` classés des 41 maquettes, **15
   portent `.selecteur`, 10 `.nav2__selecteur`, aucun `.saisie`** ; réciproquement aucun
   `input`/`textarea` ne porte `.selecteur`. A-9 était fausse.
4. **`.contexte` entre comme quatrième famille d'encart.** 6 vues, une seule définition. Piège
   mesuré : elle est **employée par 6 vues et déclarée par 2** — dans V-15, V-31, V-32 et V-40 le
   nœud rend sans style, et c'est le gel qui le veut. `.encart-b`, elle, n'est employée que par la
   planche : elle ne pouvait pas être « l'encart du produit ».

## P-5 est outillé, chaîné, et il mord

`pnpm verif:inventaire` — câblé par l'orchestrateur dans `package.json` et **inséré dans la chaîne
`pnpm verify`** (É-2 du rapport : sans ce câblage, P-5 ne rougissait dans aucune chaîne).

Quatre sous-contrôles : **P-5.1** classe de `src/**` absente des 41 maquettes ou appartenant à un
bloc hors produit · **P-5.2** classe propre à une vue employée par une autre · **P-5.3** transverse
absent du §2, ou entrée du §2 absente du gel · **P-5.4** colonne « En situation » démentie par le
relevé.

**Éprouvé par mutation par l'orchestrateur** : une classe inventée dans `V-38.svelte` →
`P-5.1 hors inventaire — .classe-inventee-sonde employée par src/vues/V-38.svelte:204 n'existe dans
aucune des 41 maquettes`, code 1. Retirée → 0. Il partait de **240 constats** sur l'état d'origine.

Et il **énonce ce qu'il ne couvre pas** à chaque exécution — les variantes documentées non
implémentées, qui supposent une vue achevée quand 36 restent à écrire.

## Points corrigés par l'orchestrateur

**É-1 — `verif/jetons.mjs` annonçait encore P-5 « non outillé — lot T-009 »**, et P-2 / P-4.3 comme
« demandant l'inventaire fermé ». Trois prémisses périmées. Corrigé : P-5 sort de la liste des non
outillés, P-2 et P-4.3 disent que leur prémisse est levée et qu'il reste à les écrire. *Une
batterie qui se déclare non outillée alors qu'elle l'est fait douter des quatre autres lignes.*

**É-2 — `package.json` ne câblait pas le contrôle.** Fait.

**É-3 — 18 lignes fausses dans la colonne « En situation »** du §2, corrigées, et P-5.4 les tient
désormais.

## Points restants

**É-4 — V-09 ne porte pas la correction de troncature du fil (E-03).** Son `.fil` est identique aux
34 autres, moins l'`overflow: hidden`. **Aucun arbitrage requis** : chaque vue est implémentée
contre sa propre maquette, la divergence n'existe qu'au regard d'une factorisation que rien
n'impose. Consigné comme fait du gel, à ne pas « corriger » au portage.

**É-5 — 66 noms de classe reçoivent deux définitions ou plus selon la vue**, dont **`.noeud`** :
nœud d'arborescence dans presque toutes les vues, **nœud de graphe en V-19 et V-20**.

C'est le point le plus dangereux du lot pour la suite : *c'est l'endroit exact où un lot pressé
casserait deux vues en croyant en simplifier une.* Interdiction de factoriser, écrite au §2.H.

**É-6 — 92 emplois orphelins** (`.btn-copier` sur 5 vues, déclarée nulle part) et 10 déclarations
sans emploi. Faits du gel, ni corrigés ni retirés au portage.

**É-7 — §0.2 annonçait 23 classes manquantes à `mockups/socle.css`** ; le relevé en compte **25**.
Sans effet — P-6.1 compare à l'octet — mais noté.
