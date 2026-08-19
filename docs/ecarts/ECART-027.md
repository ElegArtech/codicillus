# ÉCART-027 — L'enveloppe posée, la fraîcheur unifiée, et un trou dans mon instrument — 19 août 2026

P-0b livre le quatrième passage du gabarit et l'implémentation unique de la fraîcheur. **Les quatre
vues livrées ne bougent pas d'un pixel**, et il l'a prouvé autrement que par les batteries — pour
une raison qui est le constat le plus lourd du lot.

## É-3 — Les quatre batteries de vue sont **incapables de voir l'enveloppe**. Trou d'instrument.

Établi **par contrôle positif**, pas par raisonnement. P-0b a injecté dans les quatre vues livrées
une enveloppe `div.console` **et** un `aside.nav2` visible, puis relancé le banc :

| Vue | sous contrôle positif | attendu si la batterie voyait le cadre |
|---|---|---|
| **V-37** | **32 conformes, 0 écart** | rouge |
| V-38 | 1 conforme, 5 écarts | rouge |
| V-39 | 7 conformes, 14 écarts | rouge |
| V-40 | 0 conforme, 10 écarts | rouge |

**V-37 est restée entièrement verte** avec une enveloppe et un `aside` injectés dans son cadre —
parce qu'elle compare une **surface déclarée**, `aside.rail + header.barre` (ARB-012), dont
`<main>`, son parent et ses frères sont hors champ.

Les trois autres comparent des **zones isolées** — notifications, blocs d'états, `dialog.dlg`.
Aucune n'est le cadre : elles ne rougissent que **par effet de bord**, hauteur de document et barre
de défilement. Avec la seule classe d'enveloppe, sans `aside` — classe qu'aucune de leurs feuilles
ne déclare — **les quatre restaient à leur ligne de base**.

**Conséquence, et P-0b l'écrit lui-même** : *« le vert des quatre batteries n'est pas ce qui prouve
mon amendement inoffensif. C'est la comparaison de DOM qui le prouve. »* Une régression future de
l'enveloppe, du parent de `<main>` ou de ses frères **passerait ces quatre batteries en vert**.

Le trou se refermera de lui-même quand les onze vues concernées seront livrées — elles comparent
page entière. **Mais il est ouvert maintenant**, et il l'était pendant tout l'amendement.

## É-2 — V-17 et V-18 portent un nœud **après** `<main>`. Cinquième passage à venir.

Mesuré : `div.cadre` y a **trois** enfants — `header.barre`, `main.editeur#contenu`, puis
`div.barre-etat` (classe seule, boîte `248, 837, 1192, 63`). **ARB-023 n'ouvre qu'un nœud avant
`<main>`, dans l'enveloppe** : il ne couvre pas ce cas.

Hors de ses onze vues, P-0b n'a rien porté — et il le remonte **maintenant**, *« pour que le lot qui
portera V-17/V-18 ne l'apprenne pas en y butant, comme ARB-023 l'a fait pour P-1 et P-2 »*.

C'est la première fois qu'un lot anticipe un amendement pour un lot qui n'existe pas encore. C'est
exactement ce que le relevé unique aurait dû faire, et ce que sa colonne manquante l'a empêché de
faire.

## É-1 — La fabrique unique livrée sans sa batterie. **Écrite par l'orchestrateur.**

Le périmètre de P-0b ne lui ouvrait pas `src/lib/fraicheur.test.ts`. Il a **préféré le déclarer
plutôt qu'élargir son périmètre en silence**, et joindre une preuve de substitution : **83 cas** —
les 32 notes du corpus plus les bornes 89/90/91 et 179/180/181 — passés d'un côté dans les
`window.*` du gel exécutés au navigateur, de l'autre dans son module chargé en SSR par Vite.
**83 sur 83 identiques**, balisage recomposé compris.

Le fichier est écrit. Il fige la part rejouable sans navigateur : **les bornes**, seul endroit où
une comparaison stricte se distingue d'une comparaison large — donc le seul endroit où une
réécriture distraite changerait le niveau affiché sur une note réelle. 190 tests verts.

**Et une leçon à mon compte** : j'ai écrit ce test une première fois **d'après ce que je supposais
des signatures**, sans lire le module — `SEUILS_PAR_DEFAUT.seuilFrais` au lieu de `.frais`,
`libelleFraicheur(jours, seuils)` au lieu de `libelleFraicheur(note)`. Dix assertions en échec.
C'est exactement le défaut que je relève depuis huit constats, commis par moi, sur un fichier de
quatre-vingts lignes que j'avais sous la main.

## É-4 — `verif:inventaire` affirme une chose fausse dans son propre bloc « non couvert »

Il imprime *« les classes posées par une expression Svelte non littérale : aucune n'existe
aujourd'hui »* — **phrase codée en dur, non mesurée**. Or `<main class={classeContenu}>` en est une
depuis ARB-015, et l'amendement en ajoute une seconde.

Troisième lot à le signaler. La limite déclarée est juste ; le décompte qui l'accompagne ne l'est
plus. **Un instrument qui annonce une couverture qu'il n'a plus est pire qu'un instrument qui se
tait** — et celui-ci le fait dans le bloc même où il énonce ses angles morts.

## Ce que la preuve de non-régression a établi

**49 états** des quatre vues, avant et après, lus de trois façons :

| Lecture | Résultat |
|---|---|
| DOM significatif — arbre parsé, commentaires ôtés | **49 / 49 identiques** |
| Octet brut | 0 / 49 |
| Octet brut, commentaires ôtés | **49 / 49 identiques** |

Nature **exhaustive** des différences brutes : deux insertions, `<!--[-1-->` et `<!--]-->`, les
marqueurs de bloc conditionnel de Svelte. **Zéro suppression, zéro élément, zéro attribut, zéro
texte, zéro nœud d'espacement modifié.**

## Une divergence de convention, relevée entre deux lots

Les chiffres de P-1 pour V-41 — `480 / 936` → `272 / 1012` — sont des **boîtes de contenu**, ceux de
V-27 — `492 / 948` → `248 / 1180` — des **boîtes de bordure**. Chaque vue est cohérente avec
elle-même et la conclusion tient, mais **les deux lignes ne se comparent pas entre elles**. En boîte
de bordure, V-41 fait `456 / 984` → `248 / 1060`.

C'est le genre d'écart qui ne fausse rien tant que personne ne compare deux rapports — et qui fausse
tout le jour où quelqu'un le fait.
