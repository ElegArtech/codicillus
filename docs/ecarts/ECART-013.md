# ÉCART-013 — Résidu de T-101, six points — 18 août 2026

T-101 a livré le squelette et l'a mesuré **conforme à zéro pixel divergent sur les 32 couples**,
mais son critère contractuel sortait en 1 : deux défauts de l'instrument, qu'il a diagnostiqués,
prouvés, et refusé de corriger. **C'est le comportement exigé** — un agent qui répare l'instrument
qui le mesure fabrique son propre verdict. Les deux sont corrigés par l'orchestrateur ; le critère
sort désormais en 0.

## É-1 — `render` obtenu du mauvais graphe de modules. **Bloquant, générique.**

`verif/banc/mode-demo.mjs` faisait `await import('svelte/server')`, qui charge l'exemplaire ESM de
Node, alors que le composant vient de `serveur.ssrLoadModule()`, l'exemplaire du graphe SSR de
Vite. Deux exemplaires de `svelte/internal/server` coexistaient, `ssr_context` était nul dans
`push_element`, et **tout composant rendait 500** — prouvé sur un `<p>essai</p>`.

**Ce que cet écart révèle de mon étalonnage.** `--source=etalon` sert la maquette gelée **sans
jamais passer par `render()`** : le chemin calibré n'était pas le chemin réel. L'étalonnage a
prouvé les serveurs, les protocoles d'état et les conditions de capture — mais pas le rendu de
composant, c'est-à-dire précisément ce dont dépend toute vue. **Un étalonnage sur candidat connu
identique ne vaut que pour les portions de chemin qu'il emprunte réellement**, et j'ai posé ce
critère sans vérifier qu'il les empruntait toutes.

Corrigé : `await serveur.ssrLoadModule('svelte/server')`.

## É-2 — Le mode démo servait la page sans aucun style. **Bloquant.**

Sous `vite dev`, `/src/socle.css` répond en `content-type: text/javascript` — c'est le module de
rechargement à chaud — et le navigateur ignore la feuille. Le banc capturait donc une page nue :
rail visible à 360 px, entrées de menu focalisables, trois échecs de structure qui n'étaient que
l'absence de CSS. Corrigé par `?direct` sur les deux feuilles.

Les deux défauts sont de la même famille : **l'instrument marchait sur le chemin qu'il avait
étalonné, et seulement sur celui-là.**

## É-3 — `<span style="line-height:0">` autour des icônes : P-1.7 contre fidélité. **Résolu par mesure.**

La maquette enveloppe chaque icône de menu d'un `<span style="line-height:0">` construit par son
script. Reproduit tel quel, il déclenche P-1.7 et fait rougir la batterie 2 ; omis, le DOM diverge
dans une zone jamais capturée.

L'exécutant a **mesuré les trois variantes** menus ouverts plutôt que d'arbitrer à l'estime :
émettre le `<svg>` nu donne des géométries identiques au centième de pixel (`btn 206×34.84`,
`svg y=63.42`, `txt y=63.50`) ; le span sans style diverge (`36.84`). Le SVG nu est retenu.
Divergence de balisage, mesurée nulle en rendu, dans un état hors des huit.

## É-4 — Quatre classes des zones comparées absentes de l'inventaire fermé

`menu-barre__liste--droite`, `menu-barre__nom`, `menu-barre__role`, `recherche__txt`. Instance
concrète d'`ECART-011` É-4 et `ECART-012` point 11. Non bloquant — elles existent dans la maquette
gelée, elles ne sont pas inventées. Reste conditionné au complètement de `docs/DESIGN.md` §2, déjà
condition de clôture de la phase 1.

## É-5 — Les liens inertes — **tranché par ARB-013**

L'instantané ARIA imprime `/url: "#"` ; toute adresse réelle faisait échouer le niveau 1. Le
produit aurait dû porter des liens morts pour rester conforme. Les lignes `/url:` sont retirées de
la comparaison : les 681 `href` des maquettes valent tous `#`, c'est un artefact du régime assisté
et non une décision de conception. L'autorité sur les adresses est `docs/routes.md`.

**Cet écart n'avait pas encore mordu** — la coquille livrée porte des liens inertes, comme le gel.
Il aurait mordu au premier lot câblant une adresse, c'est-à-dire au suivant.

## É-6 — `data-numerote="non"` non porté par le gabarit

L'attribut pilote la numérotation du sommaire de V-14. Le porter ici serait « préparer ». Sans
effet sur les zones comparées. À reprendre au lot de V-14.
