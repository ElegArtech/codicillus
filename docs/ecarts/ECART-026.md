# ÉCART-026 — P-13 livre l'espace public, et un attribut de `<body>` inatteignable — 19 août 2026

**Douze vues conformes.** V-01 28/28, V-02 20/20, V-03 16/16, V-04 3/3, V-26 5/5 — zéro pixel
divergent sur les 72 couples, après correction d'instrument.

## É-1 — `data-numerote="non"` de V-03 n'avait aucun chemin pour atteindre `<body>`

V-03 est **la seule maquette du dépôt** — vérifié : `grep -l '<body [^>]' mockups/V-*.html` ne
retourne qu'elle — à poser un attribut sur `<body>`, et sa feuille le lit :
`body[data-numerote="non"] .prose h2::before { content: none }`.

Aucun chemin n'existait : le mode démo **compose le document lui-même**, et Svelte **refuse** tout
attribut sur `<svelte:body>`. Le poser sur `div.app` n'aurait rien changé, la règle visant `body`.

**Coût mesuré** : 34 870 pixels sur 12 couples, et **dimensions divergentes** sur les 4 autres — la
numérotation de section et son `gap` étant l'unique cause. L'exécutant l'a isolée par un diagnostic
hors banc qui pose l'attribut du seul côté candidat : **structure verte et 0 pixel sur les 16
couples**. Il n'a ni comblé, ni contourné, ni touché l'instrument.

**Résolu** : `attributs_de_corps` dans `verif/references/protocole-app.json`, en **écriture humaine
seule**. Le motif de ce verrou est le même que pour les zones et les révélations — *une vue ne
choisit pas les attributs du document qui la porte, sinon elle pourrait s'accorder une règle que le
gel ne lui donne pas*, et le banc certifierait un rendu que la maquette n'a jamais montré.

## É-2 — ARB-013, confirmé indépendamment

P-13 a mesuré le même défaut que P-9, sur d'autres vues : V-04 câblée sur ses adresses réelles
sortait en échec de structure sur 3 états sur 3. **Deux lots, deux découvertes indépendantes, même
cause.** Corrigé au commit précédent.

## É-3 — Troisième restitution locale du calcul de fraîcheur

`src/lib/dates.ts` ne porte que du formatage. L'exécutant a écrit **une seule** définition pour ses
cinq vues plutôt que cinq copies — « un troisième point de divergence possible plutôt que sept ».
C'est la bonne proportion sous contrainte, mais **P-01 reste non tenue** : la fabrique unique est le
chantier 2 de P-0b, en cours.

## É-4 — L'état `cas-inexistant` de V-04 rend, à la référence, le cas `prive`

La maquette s'initialise sur `appliquerCas("prive")` alors que le bouton coché au balisage est
`inexistant`, et le protocole n'émet un `change` que sur un bouton **non déjà coché**. La référence
affiche donc l'adresse de l'autre cas.

**Ce n'est pas nuisible** — les deux cas *doivent* être indiscernables, c'est `ADR-007` — mais
**l'état déclaré ne montre pas l'adresse qu'il nomme**. Le scénario couvre donc trois cas dont deux
rendent la même chose pour une raison de planche, non de conception. À arbitrer si l'on veut que
`cas-inexistant` exerce réellement son cas.

## É-5 — Le compteur de durée de V-02 contredit P-02

Le gel écrit `Math.max(0.06, (performance.now() - t0)/1000 + 0.18)` : un compteur **simulé**, que
P-02 proscrit nommément. Le squelette ne mesure rien et porte la valeur de la formule à durée nulle,
**0,18 s** — ce que la référence affiche.

**Contradiction du gel, pas du port.** P-02 n'est pas déclarée tenue. C'est le deuxième cas où
l'implémentation porte fidèlement un défaut de la maquette parce que le gel fait loi — après
l'accumulation de la mise en évidence du rail dans V-11 (`ECART-025` É-2).

## É-6 — **Le formateur peut casser la conformité, et rien ne le signale**

`prettier --write` réintroduit des blancs entre nœuds ; le niveau 1 construit le nom accessible sur
`textContent`, où un blanc se voit. **27 couples en échec de structure** sur V-01, V-02 et V-26,
pour cette seule cause.

Le formatage fait partie de `pnpm check`, donc du critère de sortie : **un lot peut échouer parce
qu'il a obéi à une autre de ses obligations.** Contourné par `<!-- prettier-ignore -->`, forme
exacte obligatoire. **Porté aux pièges connus (`CLAUDE.md` §6, P-6)** — c'est le genre de piège qui
coûte une demi-journée à chaque lot tant qu'il n'est pas écrit.

## Ce que le chemin unique d'`ADR-007` doit à sa signature

Le module partagé de V-04 et V-26 n'a **qu'une seule entrée : le chemin demandé**. Ni paramètre
`cas`, ni drapeau `interdit`, ni exception typée : la fonction **n'a rien à quoi se raccrocher**
pour distinguer inexistence et refus, et une branche ne peut plus s'y glisser sans changer la
signature — ce qu'aucune vue ne peut faire seule.

C'est une garantie **portée par le type**, non par une intention. Et le gel la confirme par la
donnée : les requêtes des cas `inexistante` et `interdite` sont exactement celles que l'adresse
produit, tandis que `supprimee` ne l'est pas — ce cas relève de l'autre régime d'`ADR-007`, celui
où l'existence est déjà connue de l'utilisateur.

Mesuré : `cas-inexistant` et `cas-prive` rendent des captures **identiques à l'octet**.
