# ÉCART-022 — Relevé unique et amendement du gabarit — 19 août 2026

Deux lots — le relevé T-100 et l'amendement P-0 — qui, ensemble, corrigent le défaut
d'orchestration le plus coûteux du dossier : **découvrir la spec du gabarit en la heurtant, un lot
à la fois**.

## Ce que le relevé a intercepté

**Les 34 maquettes à coquille portent deux formes, pas une.** Le gabarit implémentait la forme
**complète** — 8 vues, dont les 4 livrées. Les **26 autres** rendent une forme **abrégée** : barre
sans menus déroulants, rail sans pictogrammes ni `data-vers`, `Gestion` en `si-ecriture`, sans
`#rail-univers`, et une **arborescence de 15 nœuds écrite au balisage**.

**Elle n'est pas dérivable du corpus** : `sectionsDuRail(corpusPourVue(v))` en rend 19, et **les
deux arbres ne sont pas emboîtés**. Un lot qui l'aurait rencontrée aurait été tenté de « corriger »
`seeds/corpus.ts`, qui rend pourtant fidèlement ce que les maquettes portent.

**Sans ce relevé, 26 lots auraient buté un par un.** Trois amendements en trois lots avaient déjà
coûté trois arbitrages, trois preuves de non-régression et trois regels ; le motif se répétait à
l'échelle de la vague entière.

Deux autres interceptions du même ordre : **quinze états modaux sur huit vues**, dont aucun n'était
déclaré révélable — quatre lots auraient buté exactement là où V-40 a buté, sans pouvoir se
débloquer eux-mêmes ; et un découpage revu **sur les affinités mesurées** — la famille « rangement »
du DAG groupait quatre vues partageant **2 classes**, quand V-12 en partage **19** avec V-22, et la
console n'est ni un lot ni dix mais **trois**.

## É-1 — A-3 était faux, et l'appliquer aurait été une régression

Le relevé annonçait que le chevron dit « Replier » quand le nœud est ouvert, sur 27 vues. Mesuré
par P-0 au navigateur, conditions du banc : **V-14 rend trois nœuds ouverts et trois libellés
« Déplier »**.

La cause est fine : `element()` construit l'`aria-label` sur le dépliage **mémorisé** — vide à tout
chargement propre du banc —, puis la coquille déplie les ancêtres du nœud courant en posant
`data-ouvert` et `aria-expanded`, **sans toucher au libellé**. Le relevé avait déduit le libellé
d'un indicateur qui mesure l'**ouverture**.

Le gabarit écrivait déjà « Déplier » sans condition : **c'était juste**. A-3 est retiré, absorbé par
A-1.

## É-2 — A-2 porte 46 attributs, non 47

Le quarante-septième est celui de V-37, que le périmètre du relevé exclut. Recompté à la main **et**
par l'instrument du relevé lui-même.

**Cinquième et sixième constats transmis corrigés au recomptage** — et ils déplacent la leçon.
Ceux-ci venaient d'un relevé **mécanique**, non d'une énumération à la main. Un chiffre produit par
un instrument n'est donc pas davantage une source : **c'est son interprétation qui doit être
vérifiée**. L'instrument mesurait juste ; la colonne qu'on lui faisait dire était la mauvaise.

## É-3 — `flex: none` du gel se sérialise en `flex: 0 0 auto`

La prémisse d'ARB-022 était vraie du **littéral source** et fausse du **DOM rendu** :
`el.style.flex = "none"` sérialise en `flex: 0 0 auto`, ce que le gabarit écrivait déjà. La
divergence était de littéral, pas de rendu. La convergence a été portée quand même — P-6.4 gouverne
les littéraux, et `flex:none` figure à l'ensemble du gel de V-37 — pour zéro pixel sur 45 états.

## É-4 — Étendre P-6.4 ne rendra **pas** `flex: 0 0 auto` visible

`flex` n'appartient pas aux propriétés contraintes de P-1.7. L'effet que j'annonçais dans ARB-022
demande une **seconde** modification d'instrument, à décider séparément. Rectifié au registre :
une règle qui rend un défaut détectable vaut mieux qu'une règle qui l'ignore — encore faut-il ne
pas se tromper sur le défaut qu'elle rend détectable.

## É-5 — L'analyseur de styles lit les commentaires

Deux paragraphes de **documentation** citant un attribut `style` ont produit deux constats P-1.7.
**Un fichier ne peut donc pas documenter la valeur qu'il porte** — ce qui est fâcheux dans un dépôt
dont la discipline est d'écrire le motif de chaque contrainte à côté d'elle. Défaut d'instrument, à
corriger.

## É-6 — Les scripts du relevé n'étaient pas suivis par git

`verif/releve-vues.mjs` et `verif/releve-etats.mjs` étaient non suivis et absents de
`.worktreeinclude` : **une copie de travail fraîche ne pouvait pas rejouer le relevé**, alors que
tout le lot repose sur sa reproductibilité. Corrigé — ils sont versionnés.

## É-7 — ARB-022 pose une précondition qui n'était pas remplie

L'arbitrage exige que le rattachement ressource → maquette soit « déclaré dans un fichier en
écriture humaine seule ». Ce fichier n'existait pas. P-0 a donc **porté puis retiré** les sept
enveloppes de pictogrammes, mesuré leurs sept constats, et déclaré — même geste qu'`ECART-021`,
avec la mesure en plus. Le lot d'instrument T-007e crée le rattachement.

## Ce que P-0 a livré

Cinq amendements en **un seul lot**, plus deux convergences, avec la preuve de non-régression que
le régime exige : 45 états aspirés avant/après, les seules différences étant celles attendues, plus
un **contrôle positif réversible** qui bascule V-37 en forme abrégée et vérifie que les cinq
amendements atteignent le DOM servi — puis rétablit.

Et une vérification que rien n'obligeait : **le rail et la barre produits en forme abrégée sont
identiques au gel de V-25**, aux blancs inter-balises près, 4 105 et 1 116 caractères. La forme
abrégée est donc juste avant même qu'une vue ne l'emploie.

Vérifié dans l'arbre principal après rapatriement : **V-37 32/32, V-38 6/6, V-39 21/21, V-40 9/10**
avec le seul recours accordé. Toutes batteries en 0.
