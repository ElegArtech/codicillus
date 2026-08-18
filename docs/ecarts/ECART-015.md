# ÉCART-015 — Résidu de T-102, sept points — 19 août 2026

**V-38 et V-39 sont livrées et conformes** — 27 couples, zéro pixel divergent, tous états couverts.
**V-40 et `verif:jetons` sont rouges**, sur deux écarts de règle et d'instrument. Le lot s'est
arrêté et a déclaré, sans rien contourner.

## É-1 et É-2 — Le gabarit de coquille est incomplet. **Tranchés par ARB-015.**

`Coquille.svelte` rend `<main id="contenu">` sans classe ni moyen d'en passer une, alors que **33
maquettes sur 35** portent `<main class="…">`. Et il n'expose que des notifications texte, quand
V-38 — **la vue qui définit le composant de notification** — exige les quatre types complets.

T-102 a composé un cadre local plutôt que d'écrire dans la ressource gelée. C'était le bon geste,
et c'est ce qui a permis de traiter le manque au bon niveau : le gel est rouvert pour un amendement
borné (T-101b), puis reposé.

**Ce que ça dit du gel de K-10.** Sa lettre conduisait à l'inverse de son intention : 33 vues
auraient dupliqué le cadre pour contourner un manque de trois lignes. Un gel protège d'une dérive ;
il ne sanctuarise pas une interface incomplète découverte au lot suivant.

## É-3 — 62 constats sur des styles en ligne portés par la maquette. **Tranché par ARB-016.**

49 P-1.7, 5 P-1.3, 3 P-1.4, 3 P-1.2, 2 P-1.1 — tous sur des `style="…"` que **le gel porte
lui-même** : sceaux des quatre types de V-38, géométrie des esquisses de V-39, boutons destructifs
de V-40. Aucun n'est décoratif.

P-6.3 avait renversé la contrainte pour le bloc `<style>` porté ; il ne couvrait pas le balisage.
ARB-016 étend la même logique, bornée de la même façon : un `style` est admis **si et seulement
si** sa valeur figure dans la maquette gelée de la vue.

**À saluer** : l'exécutant n'a **pas** déplacé ces littéraux dans un `.ts` pour les soustraire à
l'analyseur — et il écrit que ça aurait marché. C'est le contournement de vérification de
`PLAN §12` ; il l'a nommé au lieu de l'emprunter.

## É-4 — Les dix dialogues de V-40. **Tranché par ARB-017.**

`open` n'est pas `showModal()` : sans couche supérieure, la zone fait 1440×901 au lieu de 1440×900
et le voile n'existe pas. Le banc révélera le dialogue des deux côtés, comme il actionne déjà les
déclencheurs (`ECART-014` É-3).

**Ce qui est acquis et rend la décision sûre** : niveau 1 vert sur les dix, et DOM **identique
caractère pour caractère** à la référence — vérifié par diff sur les dix états. Le contenu est
juste ; seule la surface capturée diffère.

## É-5 — L'étalon `--source=composant` ne peut pas révéler É-4. **Troisième occurrence du même trou.**

`V-40 --contre=app --source=composant` sort **conforme** là où l'implémentation réelle échoue :
cette source rejoue le corps du gel **avec ses scripts**, elle entre donc en modalité. Un candidat
qui a du JavaScript ne peut pas éprouver une contrainte qui ne mord que sur un candidat sans
JavaScript.

**C'est la troisième fois que le même mécanisme se produit**, et il mérite d'être énoncé comme
règle du dossier plutôt que comme incident :

| | Ce que l'étalon n'empruntait pas | Ce qui l'a révélé |
|---|---|---|
| `ECART-013` É-1 | `render()` — tout composant rendait 500 | T-101, au premier composant réel |
| `ECART-014` | rien de nouveau : l'exécutant a **énuméré** les chemins non empruntés | l'énumération elle-même |
| `ECART-015` É-5 | l'absence de JavaScript du candidat | T-102, au premier dialogue modal |

**Règle** : un étalonnage sur candidat connu identique ne vaut que pour les portions de chemin
qu'il emprunte réellement, **et pour les propriétés que le candidat ne possède pas déjà**. Tout
contrat d'instrument doit désormais exiger l'énumération explicite de ce que l'étalon **n'emprunte
pas** — c'est ce que T-007c a fait, et c'est la seule fois où le trou a été vu avant de mordre.

## É-6 — Restitution locale du libellé de fraîcheur dans V-40

`libelleFraicheur()` est réimplémenté dans `V-40.svelte` pour le texte du dialogue de doublon,
`src/lib/dates.ts` ne l'offrant pas. **Second calcul dérivé de la fraîcheur dans le dépôt** — c'est
précisément ce que P-01 proscrit et ce que la batterie 5 vérifiera. Signalé par l'exécutant dans
l'en-tête du composant. À reprendre par l'implémentation unique de T-013.

## É-7 — V-39 déclare 21 états, le DAG en annonce 20

20 de zone plus l'état de planche `anim`. Instance d'`ECART-009 c)`, déjà tranchée : **les
scénarios font foi**. L'exécutant a couvert les 21.

## Le constat le plus lourd de l'extraction, à porter à `DESIGN.md`

**86 classes** relevées sur les trois vues, absentes de l'inventaire fermé. Et parmi elles, une
contradiction de fond : l'inventaire donne `.zone-etat` comme composant d'état vide, mais **la vue
qui définit les états vides n'emploie pas cette famille** — elle emploie `.vide`, `.vide--sobre`,
`.vide__titre`, `.vide__txt`, `.vide__actions`. Deux familles pour le même état, dont une seule est
inventoriée.

Les 19 lots suivants liront ce §2. **C'est la contradiction à trancher en priorité** dans le
complètement de l'inventaire, déjà condition de clôture de la phase 1 (`ECART-008 c`).
