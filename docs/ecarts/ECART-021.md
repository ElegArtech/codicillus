# ÉCART-021 — Verdict du recours n° 1, et convergence refusée — 19 août 2026

Deux lots rendus le même jour, l'un jugeant, l'autre refusant d'agir. Les deux ont produit ce que
le dispositif attend d'eux, et **cinq défauts de dispositif** — dont quatre de l'orchestrateur.

## Le verdict — recours au niveau 3 n° 1, **accordé**

Consigné au journal de vague (`docs/journal/V1.md`), avec sa cause, ses preuves, son déterminisme
et **les bornes du précédent**. Le vérificateur a tout remesuré depuis zéro plutôt que de reprendre
les mesures de l'implémenteur — et a **contredit** un point de son rapport : « sous-arbre DOM
identique » était faux au sens littéral (marqueurs de rendu Svelte, sérialisation de `min-width`),
la formule juste étant « aux différences de sérialisation près ».

La borne qui protège le précédent est la sienne, et elle est meilleure que ce que j'aurais posé :
**si la même cause revient sur une seconde vue, le second cas est refusé même s'il satisfait tous
les critères.** Une cause qui se répète n'est plus un artefact — c'est une propriété du protocole,
et elle se traite dans l'instrument.

## É-1 — **L'image d'écart livrée à l'arbitre était fausse.** Gravité haute. Corrigé.

`verif/banc/comparer.mjs` : `ecart.donnees[p] = 200 + (r.donnees[p] >> 2)` atteint **263** pour une
composante à 255, et **déborde** dans un `Buffer`, qui tronque au modulo.

Constat mesuré sur `d-droits` : **350 515 pixels de fond sur 1 296 000 débordaient** — le papier
clair rendu presque noir — et **2 355 prenaient exactement `(255, 0, 255)`**, la couleur réservée
aux divergences. L'image portait donc **2 373 pixels magenta pour 18 vraies divergences**.

Aucun verdict n'en dépendait — les comptes se font sur les tampons bruts. Mais **le niveau 3 juge
sur pièces**, et cette pièce mentait : un arbitre qui l'aurait regardée aurait vu un écart massif là
où il y en a dix-huit.

Corrigé par un voile borné par construction. Vérifié : **18 pixels magenta, 0 débordement.**

## É-2 — Le journal de vague n'existait pas. **Écrit.**

`docs/journal/` était vide, alors que `CLAUDE.md` §7 et `PLAN` annexe C y placent la consignation
des recours. Le vérificateur a **conditionné son verdict à cette écriture** : *« un recours accordé
et non consigné est exactement ce qu'ARB-018 a voulu rendre impossible »*.

Il avait raison de le poser comme condition, et pas comme remarque. Le hook `Stop` qui devait
refuser la clôture d'une session sans mise à jour du journal n'a jamais été installé — la
capitalisation différée n'a lieu que si quelqu'un la relève, et ici c'est un agent, pas le
dispositif.

## É-3 — `ECART-020` était cité et n'existait pas. **Écrit.**

`docs/arbitrages.md` renvoyait à `ECART-020` É-2 pour corriger l'attribution d'ARB-018 ; le fichier
n'existait pas, et aucun commit ne nommait T-102b. Le vérificateur, chargé de vérifier ce rapport
introuvable, a **tout remesuré depuis zéro** — ce qui a bien fonctionné, mais par sa rigueur à lui
et non par la tenue du dossier.

## É-4 — `tolerances.json` portait encore le diagnostic rétracté. **Rectifié.**

Le bandeau nommait toujours « un bloc `.contexte` » comme cause. Corrigé, avec la mention explicite
que la décision n'est pas affectée.

## La convergence refusée — et une divergence de plus qui n'existait pas

**ARB-020 nommait deux divergences du gabarit. La première n'existe pas.**

Aucune ligne de maquette ne pose `data-ouvert="non"` sur `.menu-barre` : les 16 balises des huit
maquettes concernées n'ont aucun attribut. Le gel ne le pose **qu'au clic**, par `fermerMenus()`.
Or le protocole de capture dispatche `change`, jamais `click`, sur 35 des 45 états — il n'apparaît
que sur les dix états de V-40, **posé par le clic du banc lui-même**.

Le poser au gabarit aurait fait **diverger 35 états sur 45** vers un attribut qu'aucune maquette
n'écrit. L'exécutant a appliqué ARB-020 point 1 — *la ligne du gel est citée, ou il n'y a pas de
convergence* — et s'est arrêté.

**C'est la quatrième fois qu'un constat que je transmets se corrige au recomptage** (`ECART-010`
É-3, `ECART-016` É-1, `ECART-018` É-2, celui-ci). La règle tient et vaut d'abord pour moi.

**La seconde divergence est réelle, et gratuite.** L'enveloppe `<span style="line-height: 0">` des
SVG de menu (`mockups/V-37-coquille.html:3308`) : mesuré, elle ne déplace **rien** — géométries
identiques au centième de pixel, et 45 états identiques à l'octet après retrait mécanique des
seules enveloppes. L'obstacle d'`ECART-013` É-3 est bien levé sur le fond.

**Mais elle bute sur une portée, pas sur une valeur.** P-6.4 / ARB-016 n'accorde la preuve par le
gel qu'aux composants `src/vues/V-xx.svelte` ; `src/lib/coquille/BarreSuperieure.svelte` n'en
bénéficie pas, et P-1.7 s'y applique en entier — 7 constats. Or l'instrument lui-même sait que
`line-height:0` **est** au gel de V-37 : `ensembleDuGel('V-37')` le contient. Il ne manque que la
portée.

L'exécutant a écarté les deux échappatoires — étendre P-6.4 lui-même (modifier l'instrument), ou
porter la valeur en classe (diverger du gel **et** écrire dans une feuille verrouillée) — a
**rétabli l'arbre** et déclaré. C'est le bon geste : ARB-020 délègue la convergence, pas
l'élargissement d'un arbitrage antérieur.

## É-5 — Une asymétrie de mesure, à ne surtout pas « corriger »

Le clic du banc pose `data-ouvert="non"` côté référence **sur les dix états de V-40, et sur eux
seuls**. Même famille qu'ARB-017 : une propriété du document établie par le **geste de mesure**,
pas par le produit. Sans effet mesuré.

**Un lot futur qui la relèverait risquerait d'écrire dans le gabarit un attribut que 35 états sur
45 démentent.** C'est consigné ici pour que le prochain qui la voie sache que c'est le banc qui la
produit.

## É-6 — Cinquième symptôme de l'arbre partagé

Six serveurs de développement orphelins sur les ports 5173-5177, 5199 et 5399, dont un occupait
celui qu'un lot avait choisi. Et le correctif de T-102b entré dans le commit d'un autre lot.

`ECART-017` É-8 déclarait les worktrees obligatoires. **Ils ne le sont toujours pas dans les
faits.** C'est la dette la plus ancienne du dossier.
