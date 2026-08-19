# ÉCART-039 — Batterie 10 : l'accessibilité est majoritairement un défaut du gel — 19 août 2026

**Gravité : haute pour le commanditaire, nulle pour le portage. La batterie est livrée ROUGE, et
c'est le bon verdict.**

Lot **T-023 (batterie 10)** — `verif/a11y.mjs`, `verif/a11y-sondes.mjs`, `verif/a11y.test.ts`.
`pnpm test:a11y` n'est plus un jalon.

## La méthode, et pourquoi elle est décisive

La batterie audite **les deux côtés** de chaque couple — maquette gelée **et** application — par le
**même code** et dans les **mêmes conditions de capture** que le banc, puis lit la nature dans la
comparaison, par multi-ensemble :

| commun aux deux côtés | **gel** — demande un regel |
| surplus côté application | **portage** — corrigeable par un lot |
| surplus côté gel | gel non reporté |
| indécidable | instrument — non opposable |

C'est mécanique, pas apprécié. **Sans ce recoupement à deux côtés, la batterie aurait rendu 3 470
défauts imputables au code** — et deux défauts de son propre instrument seraient restés invisibles
(voir plus bas). C'est la première batterie du dépôt qui distingue structurellement *ce que le
produit a introduit* de *ce que la loi porte déjà*.

## Le verdict — 409 couples, 818 pages, 265 s

| Nature | Occurrences |
|---|---|
| **PORTAGE** — corrigeable par un lot | **31** |
| **GEL** — demande un regel arbitré | **3 439** |
| gel non reporté | 92 |
| instrument — non opposable | 2 380 |
| constat — mesuré, non opposé | 8 820 |

Couples sans violation opposable : **8 sur 409**. Une seule vue entièrement propre : **V-05**.

Reproduit à l'identique dans l'arbre principal, hors de la copie de travail où il a été écrit.

### Les 31 de portage, nommés

`axe:scrollable-region-focusable` 24 (V-03, V-14 en 360×780 ; V-15, V-18 en 1440×900) ·
`axe:aria-required-children` 3 + `aria-required-parent` 3 (V-35, `div.tg[role=row]` sans
`role=table`) · `superposition:sans-piege` 1 (V-19, `div.voile`).

**Réserve de l'exécutant, à respecter :** `scrollable-region-focusable` sort dans les **trois**
natures (24 / 43 / 28) — elle bascule sur un dépassement d'un pixel que le niveau 2 du banc ne voit
pas. **À ne pas traiter en premier.**

### Les défauts du gel — les principaux

| Occurrences | Défaut | Portée |
|---|---|---|
| 894 | `saut:cible-non-focalisable` — **ECART-018 confirmé** | **34 vues** ; V-23 et V-26 exemptes |
| 707 | `axe:color-contrast` < 4,5:1 — **RG-M18-07** | 16 vues |
| 629 | `graphique:sans-alternative` — **RG-M18-11 / P-06** | 26 vues |
| 249 | `axe:label` — champ sans nom accessible | 6 vues |
| 144 | `axe:aria-required-attr` — combobox sans `aria-controls` / `aria-expanded` | V-09 |
| 129 | `axe:aria-required-parent` — `treeitem` sans `role="tree"` | 8 vues |
| 114 | `clavier:action-non-atteignable` | V-41, V-17, V-40, V-18 |
| **80** | **`couleur:temoin-jauge-annoncee`** — `.temoin__jauge` **sans `aria-hidden`** aux lignes 1817 et 1822 de V-14 : **DESIGN §3.7 interdit 3**, sur le composant central du produit | V-14 |
| 91 | `etiquette:orpheline` | V-41 (66), V-29 (25) |
| 86 | `axe:nested-interactive` — `svg[role=img]` contenant des focalisables | 9 vues |

**Aucun n'est corrigeable par un lot** sans faire diverger la vue de son gel : `pnpm verif:maquette`
reste vert sur tous. Ils appellent un regel, ou une exemption arbitrée.

> **Les deux lignes 1817 et 1822 de V-14 sont les mêmes que celles d'ECART-038 É-1.** Le même panneau
> latéral porte, dans le gel, un libellé que la fabrique ne produit pas *et* une jauge annoncée aux
> technologies d'assistance que DESIGN interdit. Un regel de V-14 refermerait les deux.

## Ce que la batterie ne couvre pas — mesuré, pas supposé

- **axe : 90 règles activées, 61 exercées, 29 jamais applicables** — la liste est réimprimée à chaque
  exécution ; elles ne prouvent rien ici.
- **Ce qu'axe refuse de trancher : 2 377 nœuds** — dont `color-contrast` 2 299 sur du texte SVG et
  des fonds recouverts : **donc précisément la cartographie et la carte mentale**.
- **WCAG 1.4.11, contraste non textuel : aucune règle axe.** La moitié de `RG-M18-07` — « tout
  élément d'interface porteur de sens » — **n'est pas tenue par cette batterie**.
- « Ordre de tabulation cohérent » (RG-M18-08) : 1 343 remontées visuelles, heuristiques, non
  conclusives. « Alternative exploitable » (P-06) : présence mesurée, équivalence non décidable —
  V-19 et V-20 ont un nom accessible mais **aucune restitution textuelle candidate**.
- Hors périmètre déclaré : jugement humain WCAG, temporisé, clavier au-delà de Tab/Échap, lecteurs
  d'écran réels, états non maquettés, produit construit.

## Preuve de mutation — la batterie sait dire non

1. **Sondes intégrées** (`pnpm test:a11y:sonde`, code retour inversé) : 4 genres, **4 sur 4 nommés en
   nature portage**.
2. **Mutation de fichier** : `aria-label` retiré de `svg#graphe` dans `src/vues/V-19.svelte` — avant
   `1/13/1`, pendant **`19/7/7`** avec `graphique:sans-alternative` ×6 **en portage** ; après
   restauration, `1/13/1` à l'identique, arbre propre.

## Les écarts de l'exécutant

1. **Défaut latent de `verif/banc/conditions.mjs`.** `install({time:T})` puis `pauseAt(T)` : le temps
   virtuel court entre les deux, donc **sous parallélisme T est déjà passé** →
   `Cannot fast-forward to the past`. 2 couples sur 409 à 6 pages parallèles, **0 en séquentiel** —
   le banc, séquentiel, ne l'a jamais vu. Le fichier n'a **pas** été touché ; `a11y.mjs` rejoue trois
   fois au plus et le déclare. **À réparer avant toute parallélisation du banc.**
2. **axe-core est incompatible avec l'horloge arrêtée** — il enchaîne ses tranches par `setTimeout`
   et ne rend jamais la main (> 2 min sur V-21). L'état est établi horloge arrêtée, puis
   `clock.resume()` juste avant `analyze()`, sous garde `instrument:dom-instable` (3 couples / 409).
3. **Trois chiffres du mandat ne tiennent pas au recomptage** — la règle d'ECART-018 É-2 a joué une
   fois de plus : « 96 » avertissements → **92** ; « deux `treeitem` de V-21 » → 2 sites de source
   mais **24 nœuds rendus**, et **aucun `role="tree"`** ; « cinq `label` de V-29 » exact, mais
   **V-41 en porte 6 de plus**, non cités. *C'est le cinquième lot où un chiffre transmis est faux.*
4. **Une sonde oppose une règle qu'axe ne pose pas** (`arbre:treeitem-sans-aria-selected`, 58). Elle
   n'est pas inventée : le compilateur Svelte la pose déjà, donc `pnpm check`. À retirer si le
   commanditaire veut s'en tenir strictement à axe/AA.
5. **Budget.** Batterie 10 = 265 s ; `verif:maquette` à blanc = 391 s. **Deux batteries consomment
   déjà 11 des 20 minutes de `pnpm verify`** (PLAN §3.7).
6. **Deux défauts de son propre instrument, trouvés et corrigés en cours de lot** : le parcours
   clavier ne rebouclait pas — Chromium garde le point de départ de la navigation séquentielle après
   `blur()` — soit **~1 500 faux « non atteignable »** ; et l'empreinte « au repos » d'un élément
   déjà focalisé (ECART-029, `showModal()`) donnait **22 faux `focus:invisible`**. **Aucun des deux
   n'aurait été visible sans le recoupement à deux côtés.**

## Le seuil — non installé, et c'est délibéré

`verif/rapports/a11y-seuil-propose.json`, 23 clés `nature/règle`. **Il n'a pas été installé** : il ne
devient opposable que recopié en `verif/references/a11y-seuil.json`, **écriture humaine seule** — un
agent ne se donne pas son seuil. Sans lui, le seuil implicite est **zéro** et `pnpm test:a11y` sort
en 1.

**Recommandation de l'exécutant, reprise ici :** ne **jamais** admettre de ligne `portage/…` — 31
unités, corrigeables par six lots ; n'admettre les lignes `gel/…` qu'**avec l'arbitrage de regel
correspondant**.
