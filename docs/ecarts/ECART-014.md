# ÉCART-014 — Résidu de T-007c, huit points — 19 août 2026

Le lot est livré et vérifié indépendamment : protocole d'état de zone étalonné à 0 écart sur
76 couples, à-blanc des 41 vues toujours vert, sonde toujours mordante.

## Ce que cet étalonnage a trouvé — et qui justifie la leçon d'ÉCART-013

`ECART-013` É-1 avait montré qu'un étalon qui n'emprunte pas le chemin réel ne prouve rien de ce
chemin. Le contrat de ce lot exigeait donc que l'étalon **passe par les mêmes fonctions qu'un lot
de vue**. L'exécutant a créé `verif/banc/CorpsEtalon.svelte` — un vrai composant, qui traverse
`render()`, `ssrLoadModule` et le compilateur Svelte — et a **énuméré ce que son étalon n'emprunte
pas** : les feuilles `src/vues/V-xx.css`, `src/socle.css`, le gabarit de document de `servirApp()`,
la traduction du corpus en balisage, et la révélation par l'adresse des onze états à déclencheur.

Deux défauts de plomberie en sont sortis, invisibles autrement :

**Le budget d'horloge était asymétrique.** Le candidat avançait 1 000 ms que la référence ne
dépensait pas, sur tout état de zone sans planche — V-09, V-35, V-41. Les avances sont désormais
calculées état par état et dépensées dans le même ordre des deux côtés.

**Le clic ne se livre pas par script.** `element.click()`, même précédé d'un `PointerEvent`, ne
fait pas défiler jusqu'à l'élément et ne met pas le document en modalité « pointeur ». Mesuré :
**33 % des pixels divergents** sur le dialogue de doublon — arrière-plan défilé — et **584 px** sur
le dialogue simple — un anneau de focalisation de trop. Le geste est donc actionné par le banc, des
deux côtés, par un code unique, avec remise à zéro du défilement après le geste.

**Sans cet étalonnage, ces deux défauts auraient été imputés à l'implémentation de V-40.** Un
exécutant aurait cherché pendant des heures pourquoi son dialogue diverge de 33 %.

## Points tranchés

**É-1 — Le protocole n'avait pas d'arbitrage numéroté.** Régularisé par **ARB-014**. Le champ
`arbitrage` des six entrées portait « à régulariser » ; il pointe désormais l'arbitrage.

**É-2 — `pnpm verif:jetons` sort en 1, et ce n'est pas ce lot.** Vingt constats portant
**exclusivement** sur `src/vues/V-38.svelte`, `V-39.svelte`, `V-40.svelte` — couleurs littérales,
espacements, styles en ligne — écrits par T-102, qui travaillait dans le même arbre au même moment.
Prouvé par l'exécutant sur une copie du dépôt privée de ces trois fichiers : `conforme`, code 0.

**C'est un signal, pas un bruit** : il dit que T-102 écrit du balisage porteur de valeurs en dur,
ce que P-1 proscrit hors du bloc vérifié à l'octet. À traiter à la clôture de T-102, pas ici.

**Leçon d'orchestration** : deux lots dans le même arbre de travail se lisent mutuellement dans les
batteries. Le DAG prévoit des worktrees isolés pour les vagues parallèles (`PLAN §6.4`, §7.4) ; je
ne les ai pas employés, et c'est le premier symptôme. À corriger avant la vague à quatre lots.

**É-3 — Remise à zéro du défilement après un déclencheur : retenu.** Appliquée aux deux côtés par
un code unique. Sans elle, les dix états de V-40 exigeraient d'une implémentation qu'elle
reproduise l'offset de défilement d'un geste qu'elle ne fait pas — un rouge incorrigible autrement
qu'en trichant. C'est une condition de capture, au même titre que l'horloge gelée ou les animations
coupées : elle rend les deux côtés comparables, elle n'excuse aucun écart.

**É-4 — La référence de V-40 dépend de `showModal()`.** La zone comparée est le `dialog.dlg`
entier, 1440×900 : elle englobe le voile et la page derrière. Un squelette sans hydratation
(ARB-011) devra reproduire cet écran **sans** `showModal()`. À noter : la référence n'affiche
**aucun anneau de focalisation**, la modalité étant « pointeur » — une implémentation sans focus
est donc le bon comportement, non un oubli. Transmis à T-102.

**É-5 — Référence pendante résorbée.** `mode-demo.mjs` annonçait un contrôle dans
`verif/mode-demo-rend.mjs`, fichier qui n'a jamais existé : ma correction d'`ECART-013` É-1 était
incomplète — j'avais écrit le commentaire d'un contrôle que je n'avais pas écrit.
`--source=composant` existe désormais pour de bon.

**É-6 — `CLAUDE.md` §4 ne liste toujours pas les commandes du banc.** Annoncé en `ECART-012`
point 10, pas fait, et la dette grossit : s'y ajoutent `verif:maquette:app:composant` et
`verif:maquette:app:zones`. **Fait avec le présent écart.**

**É-7 — Exception ESLint pour un `.svelte` d'instrument.** `verif/banc/CorpsEtalon.svelte` n'est
dans aucun programme TypeScript, l'`include` généré par SvelteKit ne couvrant que `src/`, `test/`,
`tests/`. Bloc `files: ['verif/**/*.svelte']` avec `projectService: false` : le fichier reste linté,
sans les règles typées — dont aucune n'est active dans cette configuration. Retenu.

**É-8 — Divergences `docs/routes.md` ↔ extraction, inchangées.** V-07 (10 vs 9), V-08 (8 vs 7),
V-39 (20 vs 21 — 1 de planche + 20 de zone). Préexistant (`ECART-010` É-3, tranché : les scénarios
font foi). V-39 concerne directement T-102, qui doit couvrir **21** états et non 20.
