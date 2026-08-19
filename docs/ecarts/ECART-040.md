# ÉCART-040 — Batterie 9 : le point dur n° 9 n'est pas tenu par le gel — 19 août 2026

**Gravité : haute pour le commanditaire, nulle pour le portage.** `0` défaut imputable au code,
**173 couples zone × état manquants à la maquette**.

Lot **T-017 (batterie 9)** — `verif/etats.mjs` (1 577 l.), `verif/etats.test.ts` (32 unitaires).
`pnpm test:etats` n'est plus un jalon. Aucune vue touchée.

## Ce qu'elle mesure

Elle n'emprunte que le chemin du banc — `servir`, `ouvrirPage`, `reglerPlanche`, `conditions.mjs`,
`/__design/V-xx?etat=…` — sur les **41 vues / 265 états déclarés**, **deux côtés** (gel et portage),
en 49 s. Le verdict a cinq valeurs : `porté` · `MANQUE PORTAGE` · `gel : déclaré` (le composant est
au DOM, aucun état ne l'atteint) · `gel : rien` · `sans objet`, plus `hors verdict` (ARB-012).

**« Zone de contenu » est une définition mécanique et déclarée** : une région (`main`, `header`,
`section`, `aside`, `nav`, `form`, `article`, `[role=region]`) à identité stable (`id`, sinon
`aria-label`, sinon `main`), qui rend, **et que le gel équipe d'au moins un marqueur d'état**. Aucune
source n'énumère les zones de contenu : le gel est le seul juge, et ce qu'il n'équipe jamais est
compté à part, **jamais absous**.

La table de marqueurs est tracée à `DESIGN.md` §2.A A-7 et au relevé de `inventaire-composants.mjs`,
et **éprouvée avant toute mesure** : une famille qu'aucune classe du gel ne satisfait fait sortir
l'instrument en code 2. C'est la parade explicite au piège **P-5** — *une règle qu'aucun cas n'exerce
est une règle dont on ignore si elle marche*.

## Le verdict — 63 zones attestées, 252 couples

| | |
|---|---|
| porté | **60** |
| **MANQUE PORTAGE** | **0** |
| gel : déclaré, hors d'atteinte | 24 |
| gel : rien | 149 |
| sans objet | 18 |
| hors verdict (ARB-012) | 1 |
| **manque au GEL** | **173** |

Reproduit à l'identique dans l'arbre principal : `0` portage, `173` gel, 45 s.

**112 des 173 portent sur la coquille** (`aside.rail`, `header.barre` au sens de `zones.json`) —
**4 manques distincts** répétés dans les 35 vues qui l'enveloppent. Les **61 autres** appartiennent
en propre à leur vue. **L'erreur est la grande absente** : `#p-revisions`, `#indics`, `#p-domaines`,
`#sante`, `#detail`, `#article`… ne l'ont dans aucune maquette.

`V-03`, `V-05`, `V-06` : aucune zone attestée. `V-09`, `V-35`, `V-40`, `V-41` : **aucun état de
planche** — leurs 31 états sont des spécimens côte à côte, donc aucune zone de contenu mesurable.
C'est leur nature, mesurée, pas supposée.

**Registre B — 55 spécimens de catalogue** : le corpus démontre `chargement ×8`, `vide ×14`,
`erreur ×3`, **`sans-droit ×0`** — attendu, `P-09` veut l'absence, il n'y a donc pas de composant.

**RG-M18-04 : 0 chute**, sur **28 états du gel** où une zone porte réellement un marqueur d'erreur.
Le second chiffre est imprimé avec le premier : sans lui, « aucune chute » serait compatible avec
« aucune erreur mesurée ».

## Pourquoi le dépôt ne peut pas passer au vert

Le point dur n° 9 du brief — *« chaque zone est maquettée dans ses quatre états »* — **n'est pas
tenu par le gel**. Aucun lot ne peut combler ces 173 couples : `mockups/` est en lecture seule, et
inventer un état non maquetté est le comblement que le contrat interdit.

**Seuil de départ proposé : 173.** Il n'est **pas** écrit dans l'instrument — *un seuil que la mesure
se donne à elle-même ne mesure rien*. Une fois arbitré, il se passe au contrat :
`pnpm test:etats --seuil-gel=173` → 0, vérifié. Un seuil devenu trop haut est signalé « périmé ».

**Conséquence immédiate : `pnpm verify` s'arrête à `test:etats`** tant que le seuil n'est pas
arbitré — comme il s'arrêtait sur le jalon, mais désormais avec une mesure derrière.

## Preuve de mutation — et la mutation qui a corrigé l'instrument

1. `V-07`, `panneau--erreur` retiré → `V-07 #p-activite non rendu(s) : erreur`, **ROUGE**, code 1.
   Remis → code 0.
2. `V-07`, `#p-revisions` escamoté sous l'erreur voisine → `RG-M18-04 — zone(s) que le gel rend dans
   ce même état et que le portage n'a plus ; emportée(s) : #p-revisions`, code 1. Remis → 0.

**La mutation 2 a fait échouer la première rédaction du crible** — la référence était « les zones
rendues dans tous les états », un cran trop prudent. Le point de comparaison est désormais le gel
**état par état**. *C'est la preuve qui a corrigé l'instrument, pas l'inverse.*

## Ce qu'elle ne couvre pas — imprimé à chaque exécution

144 couples sur 409 (fenêtre unique) · 11 états à déclencheur (geste joué côté gel seul, ARB-011) ·
4 vues sans registre A · **101 régions nommées qu'aucun marqueur n'atteste** · **44 zones du portage
portent encore un nœud conditionné par un droit** — le socle *masque*, `P-09` exige l'*absence*, donc
batterie 7 · 13 groupes d'états indistinguables · **30 spécimens sur 55 que la table ne rattache à
rien** · **5 familles de marqueur hors de toute région nommée** · 0 classe non classée.

**Les deux derniers cribles ne dépendent d'aucun nom, et ils ont servi** : le heuristique de noms
rendait « 0 classe non classée » alors que **`.palette__etat` — l'état vide de la palette, présent
sur 30 vues — lui échappait entièrement**. Trouvée, classée, heuristique élargi.

## Les écarts de l'exécutant, à arbitrer

1. **La définition de « zone de contenu » est dérivée** — aucune source ne l'énumère (§3.2 dit
   seulement « chaque zone qui charge des données »). Déclarée dans l'instrument, non comblée en
   douce.
2. **Un second vocabulaire d'erreur, non tranché.** `V-39`, la planche des états, **n'emploie pas
   `.panneau--erreur`** : elle démontre l'erreur avec `.err-local` / `.err-vue`, propres à V-39.
   C'est exactement le motif de `§2.D-1` (`.zone-etat` contre `.vide`), sur l'état d'erreur cette
   fois, **et il n'est pas arbitré**. La batterie classe les deux ; la contradiction reste.
3. **`.palette__etat` est un composant d'état vide transverse (30 vues) absent du §2.A A-7** de
   `DESIGN.md` — trou d'inventaire au sens de P-5.3.
4. **9 familles écartées des quatre états** — `.notif--erreur`, `.champ__erreur`, `.refus*`,
   `.degrade`, `.ac--interdit`, `.bandeau-reseau*`, `.contexte--attente`, les `.si-*` de mode, les
   `.barre-etat*`. Chacune est motivée et chiffrée à chaque exécution, **mais chacune est une
   lecture**.
5. **ARB-012 appliqué au `#contenu` de V-37** : le verdict de portage y est retiré, le banc ne le
   juge pas. Sans cela, la batterie sortait 1 défaut de portage sur une surface que l'arbitrage
   exclut.
6. **Deux constats sur le gel, à verser au dossier des regels** — **V-08** : les positions `vide` et
   `trop` de la planche ne changent rien de mesurable (`data-etat="vide"` posé, aucun bloc `.vide` au
   DOM ; `trop` laisse `data-etat="nominal"`) — *s'ajoute à ECART-033* ; **V-39** ne démontre aucun
   état « sans droit », donc le point dur n° 9 n'a de composant que pour **trois** états sur quatre.
