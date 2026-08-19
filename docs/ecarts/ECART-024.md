# ÉCART-024 — L'enveloppe de contenu, et pourquoi aucun relevé ne pouvait la voir — 19 août 2026

Deux lots de la première vague — P-1 et P-2 — se sont arrêtés au temps 1 sur le **même blocage,
découvert indépendamment**. Onze vues, mesuré, non supposé.

## Le fait

Le gabarit rend `<main>` en **enfant direct de `div.cadre`, sans frère**. Onze maquettes intercalent
un conteneur, et ce sont des **grilles** :

| Chaîne d'ancêtres de `<main>` | Vues |
|---|---|
| `div.app > div.cadre > main` — le gabarit est juste | **23** |
| `… > div.console > aside.nav2 + main.travail#travail` | **10** — V-27 à V-36 |
| `… > div.biblio > nav.sommaire-b#sommaire + main.corps-b#corps` | **1** — V-41 |

Géométries relevées, enveloppe dégrafée dans la référence elle-même : le contenu de V-27 passe de
`492, 52, 948, 848` à `248, 598, 1180, 550`, et la hauteur du document de 1 022 à 1 270 px. Privé de
son enveloppe, `aside.nav2` devient un bloc pleine largeur **au-dessus** de `<main>` et le repousse
de 546 px.

## Pourquoi aucun contrôle de structure ne pouvait le trouver

C'est le constat le plus utile des deux rapports, et il vaut bien au-delà de ce cas :

> Un `div` nu ne porte **ni rôle ni nom accessible**. L'enveloppe est **invisible au niveau 1** —
> instantané ARIA et ordre de tabulation rigoureusement inchangés — et **fatale au niveau 2**, où
> la comparaison échoue *avant* de compter un pixel. Aucun contrôle de structure ne pouvait la
> trouver ; **seule la géométrie la révèle.**

Vérifié par le banc, enveloppe dégrafée : les 11 couples sortent en « dimensions divergentes »,
**niveau 1 identique sur les 11**.

**Il existe donc une classe de défauts que ni le niveau 1 ni le niveau 2 ne diagnostiquent** : le
premier est aveugle aux conteneurs de mise en forme, le second échoue trop tôt pour dire pourquoi.
Le protocole les **attrape** — le lot ne peut pas se clore — mais ne les **nomme** pas.

## La troisième occurrence du même motif de relevé

Le contrôle d'amendements du relevé T-100 fait six vérifications sur `<main>` — forme, attributs de
`div.app`, rail courant, superposition, chevron, attributs de `<main>` — et **aucune ne regarde son
parent ni ses frères**.

Comme le libellé du chevron déduit d'un indicateur d'ouverture (`ECART-022` É-1). Comme l'état modal
à déclencheur que le relevé ne joue pas (`ECART-023` É-1). **À chaque fois l'instrument mesure
juste, et la colonne lue n'est pas la bonne.**

**Règle posée par ARB-023** : un relevé ne prouve que ce qu'il regarde. Sa valeur ne tient pas à sa
mécanicité mais à **l'exhaustivité de ce qu'il interroge** — et celle-ci n'est pas mécanisable. Tout
relevé énonce désormais ce qu'il **ne** regarde pas.

## Ce que P-2 a livré malgré l'arrêt

`src/lib/console/` — cinq fichiers **qui ne dépendent pas du gabarit** et survivront à l'amendement :
le catalogue des dix sections, la navigation de console, la tête de section, le bouton de création
des six registres, l'enveloppe de pictogramme.

**Et la frontière que P-3 et P-4 hériteront**, mesurée et non supposée :

- **Le motif commun des dix : 13 classes**, et `aside.nav2` **identique à l'octet** au balisage des
  dix — 684 octets, même empreinte. Une fois stabilisés, les dix rendus font 4 872 octets et ne
  diffèrent que par le **seul `aria-current="page"`**.
- **Trois cercles plus étroits** : les sept classes de panneau (V-27 à V-32), les sept du tableau de
  gestion (V-27 à V-32 **plus V-35**), les trois du refus de suppression (cinq vues).
- **P-4 n'hérite d'aucun des trois cercles**, sauf le tableau pour V-35.

P-2 a écrit la frontière **en tête de `sections.ts`**, « pour que P-3 et P-4 la lisent dans le code
et non dans un rapport ». C'est mieux que ce que je lui demandais.

## Trois pièges relevés au passage, tous mesurés

**Le relevé était faux sur un point.** Il rangeait les treize `input.saisie` des panneaux parmi les
« cibles à risque » d'anneau de focalisation. **Zéro pixel** : le panneau est hors fenêtre. Le vrai
risque du périmètre est `input#sup-saisie` de V-28, à **4 684 pixels**. Ne pas dépenser de lot à
corriger le premier.

**`autofocus` ne survit pas à `stabiliser()` hors dialogue.** Le banc floute l'élément actif au
chargement ; `autofocus` ne fonctionne que pour les dialogues, où la révélation appelle
`showModal()` **après**. Sans incidence ici, mais à connaître avant V-06 et V-23, que le relevé
range dans la même jurisprudence.

**Le panneau `tiroir-form` ne glisse jamais, au gel même.** La seule règle qui l'ouvre est
`.app[data-form="ouvert"] .tiroir-form`, or le panneau vit **hors de `div.app`** — le sélecteur ne
peut pas s'appliquer. Ce n'est pas un défaut à corriger : c'est le gel, et il fait loi. **Un
implémenteur qui « réparerait » cela rendrait ses six vues rouges.** Le panneau doit être rendu
exactement — contenu, ordre de tabulation, noms accessibles — et ne pèse aucun pixel : le niveau 1
en est le seul juge.

## Un comblement amorcé, retiré, déclaré

P-2 a écrit puis supprimé un composant qui rendait `aside.nav2` en tête de `<main>`, faute
d'emplacement. Retiré **avant toute mesure**, et déclaré : *« c'était un comblement, et ton message
est arrivé pendant que je pesais s'il fallait le déclarer ou le retirer »*.

Il a fait les deux. C'est le comportement attendu, et il vaut d'être noté : la tentation était
réelle, et le lot l'a nommée.
