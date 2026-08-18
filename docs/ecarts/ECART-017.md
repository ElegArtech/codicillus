# ÉCART-017 — Résidu de T-007d, neuf points — 19 août 2026

## É-2 — Un défaut réel passait sous la tolérance. **Le point le plus grave du projet à ce jour.**

**Tranché par ARB-018 : le seuil du régime « app » passe à zéro.**

Quatre états de V-40 — `d-dossier` 4 380 px, `d-reviser` 4 746 px, `d-relation` 2 884 px,
`d-droits` 18 px — étaient déclarés **conformes**. Cause : un bloc `.contexte` posé sur
`--c-papier` là où la référence le pose sur `--c-accent-voile`. **Un jeton faux**, pas du bruit.

**Ce que cet écart apprend, et qui dépasse V-40.** Le seuil de 0,5 % venait du plan, qui l'avait
posé sans connaître le bruit réel du harnais — il n'existait pas encore. Une fois mesuré, ce bruit
est **nul** : 409 couples à blanc et 59 couples réels, tous à exactement zéro. Le seuil ne
protégeait donc de rien et masquait quelque chose.

**C'est l'exécutant qui l'a vu**, alors que sa commande sortait en 0 et qu'il aurait pu la déclarer
verte. Il a écrit : *« conformes (≤ 0,5 %), mais ce n'est pas du bruit de rendu »*. Sans cette
phrase, quatre défauts entraient au dépôt certifiés conformes — et le même seuil les aurait
absorbés sur les 37 vues restantes.

**Le défaut lui-même reste à corriger** : c'est du ressort de T-102, dont V-40 est le livrable.

## É-1 — Granularité de P-6.4 : déclaration par déclaration. **Entériné.**

ARB-016 disait « la même valeur » ; l'instrument compare **déclaration par déclaration**. Motif
mesuré : le gel écrit la même mise en forme tantôt en un attribut, tantôt en un `cssText`, tantôt
en quatre affectations séparées ; et l'attribut d'un squelette sans hydratation n'a aucun homologue
textuel. La comparaison d'attributs entiers aurait produit des faux positifs sur des styles
pourtant identiques.

Deux asymétries assumées, **toutes deux dans le sens de la sévérité** : les identifiants sont
résolus côté composant seulement, et les portions non littérales sont réduites au même marqueur des
deux côtés — marqueur qui **n'est pas un joker**, un gel posant `width:‹calculé›` n'admettant pas
`width:64%`.

## É-3 — Le pointeur au repos, condition de capture nouvelle. **Retenu.**

Playwright laissait son curseur là où il avait cliqué, et la boîte s'ouvrait dessous : la référence
capturait un `.btn--principal:hover` — `--c-accent-fonce` au lieu de `--c-accent` — soit 2 884 à
5 169 px sur **cinq des dix boîtes**. `POINTEUR_AU_REPOS = [0, 0]`, appliqué aux deux côtés par le
même code.

Même famille qu'`ECART-014` É-3 : une condition de capture, pas une tolérance. Elle rend les deux
côtés comparables, elle n'excuse aucun écart.

## É-4 — La révélation ne résout pas la question de fond. **Nommé, non résolu.**

Une vue de production rendant `<dialog open>` sans hydratation resterait **non modale pour
l'utilisateur** : ni couche supérieure, ni voile, ni piège de focus. Le banc mesure le rendu
attendu ; la modalité réelle relève du temps 3, donc de T-017.

**Aucun lot de phase 1 ne déclare la modalité tenue.** À ajouter aux interdictions de conclure.

## É-5 — Un contournement reste ouvert, nommé et non emprunté

Déplacer les littéraux de style dans un `.ts` importé les soustrait toujours à l'analyseur. Deux
exécutants successifs l'ont **nommé sans l'emprunter** (`ECART-015` É-3, et ici). C'est le meilleur
signal du dispositif à ce jour : la voie de moindre résistance est connue de tous et personne ne la
prend.

À fermer quand le coût en vaudra la peine ; le nommer publiquement est déjà une protection.

## É-6 — Le trou d'étalonnage n'est pas comblé, il est déclaré

Aucun étalon possédant du JavaScript ne peut éprouver une contrainte qui ne mord que sur un
candidat qui n'en a pas. La règle est désormais **inscrite dans l'instrument et réimprimée à chaque
exécution** : chaque source porte un champ `n_eprouve_pas`, et trois unitaires vérifient qu'aucune
ne le laisse vide.

Le banc en donne la démonstration empirique : sur V-40, l'étalon affiche « déjà vraie sur 20,
établie sur 0 » — il entre en modalité tout seul, des deux côtés.

## É-7 — Cinq largeurs codées en dur dans V-39

`64%`, `88%`, `100%`, `46%`, `78%` : la vue code des largeurs que le gel calcule depuis ses
tableaux. **Aucun constat**, `width` n'étant pas dans le vocabulaire contraint de P-1.7 — mais
`pnpm vues:styles` les nomme. À reprendre par T-102 avec le défaut d'É-2.

## É-8 — Un commit a englobé le travail de trois lots

`b0aa3da` embarque les fichiers de T-007d avec ceux de T-102 et T-101b. **Le commit est de
l'orchestrateur**, aucun exécutant n'a committé. C'est la conséquence directe de trois lots dans le
même arbre de travail — signalée en `ECART-014` É-2 et toujours pas corrigée.

**Décision : les worktrees deviennent obligatoires** pour toute vague à plus d'un lot, comme
`PLAN §6.4` et §7.4 le prescrivaient depuis le début. Trois symptômes en trois vagues suffisent.

## É-9 — Rien à renvoyer au lot parallèle

Ni `verif:jetons` ni `pnpm check` n'ont désigné les fichiers de T-101b. Les deux lots ont travaillé
sans se marcher dessus, malgré l'arbre commun.
