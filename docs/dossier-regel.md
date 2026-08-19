# Dossier des regels — ce qui attend votre geste

*Consolidé le 19 août 2026. Tenu à jour à chaque lot. Il ne se substitue pas aux écarts : chaque
ligne renvoie à la pièce qui l'établit.*

---

## Pourquoi ce dossier existe

Les maquettes sont la loi de ce produit — c'est la règle ultime, et elle est tenue mécaniquement :
`mockups/` est en lecture seule au système de fichiers, `pnpm verif:gel` recompte 43 empreintes
SHA-256 à chaque clôture, et le banc compare **409 couples** au pixel près, sans tolérance.

**La conséquence est que le produit ne peut pas être meilleur que sa loi.** Là où une maquette se
contredit, se casse, ou omet, aucun lot ne peut réparer sans la trahir : *combler* est interdit, et
*diverger* est rouge. Ces cas remontent ici.

Depuis le 18 août, **trois instruments qui auditent les deux côtés** — le banc, la batterie 9 des
états de zone, la batterie 10 de l'accessibilité — ont rendu le partage lisible : ce que le portage a
introduit se corrige dans un lot, ce que le gel porte déjà demande votre gesture. **Les chiffres
ci-dessous sont tous du second genre.**

---

## A. Quatre maquettes se contredisent elles-mêmes

### A-1 · V-06 — le composant de notification diverge de V-38 · **bloque le 409ᵉ couple**

`ARB-024`. La famille des notifications a été portée d'après V-38, qui en est la planche. **V-06 en
écrit une autre**, et l'écart est de **13 276 pixels** sur l'état `cpt-inconnu`.

C'est **le seul écart des 409 couples**. Sans lui, le produit serait à 409/409. V-06 n'est pas
comptée comme livrée.

### A-2 · V-08 — la maquette de la recherche ne rend rien · **la vue centrale du produit**

`ECART-033`. `mockups/V-08-recherche.html` appelle `trier()` (l. 1966) et `carte()` (l. 2025),
**dont aucune n'est définie** dans ses 2 377 lignes. `rendre()` lève sur **les sept états** :
résultats, compteur et facettes restent vides.

**C'est la seule des 41 maquettes qui lève.** Et c'est ce défaut qui montre la limite structurelle du
banc : *un défaut que les deux côtés partagent est invisible à la comparaison* — V-08 a traversé 409
verdicts verts.

La batterie 9 y ajoute (`ECART-040` É-6) : les positions `vide` et `trop` de la planche **ne changent
rien de mesurable** — `data-etat="vide"` est posé mais aucun bloc `.vide` n'entre au DOM, et `trop`
laisse `data-etat="nominal"`.

### A-3 · V-20 — un identifiant posté deux fois rend une zone morte

`ARB-025`. `id="fil"` est posé sur `nav.fil` (l. 1090) **et** sur `div.fil-deroule` (l. 1129).
`getElementById` rendant le premier, **le fil déroulé par type maître écrase le fil d'Ariane**, et
`.fil-deroule` reste vide aux cinq états. Balayage des 41 maquettes : **V-20 est la seule dans ce
cas**.

### A-4 · V-14, lignes 1817 et 1822 — **deux défauts au même endroit**

Le panneau « Position » de la lecture de note écrit ses deux témoins **à la main**, et il les écrit
mal deux fois :

1. **Un libellé que la fabrique unique ne produit pas** (`ECART-038` É-1). Le gel ne connaît qu'une
   fonction de libellé, `window.libelleFraicheur` ; ces deux `.temoin__txt` sont les **seuls** du gel
   écrits en dur, et dans une forme **compacte** — « il y a 6 j », « il y a 4 mois » — au lieu de
   « Vérifié il y a 6 jours », « Vérifié il y a 4 mois ». C'est `P-01` contre le gel : tenir le
   principe coûte **44 couples**, tenir le gel laisse un libellé construit localement, ce qu'ADR-005
   interdit nommément.
2. **Une jauge annoncée aux technologies d'assistance** (`ECART-039`, 80 occurrences) :
   `.temoin__jauge` **sans `aria-hidden`**, ce que `DESIGN.md` §3.7 interdit explicitement — sur le
   composant signature du produit.

> **Un regel de V-14 sur ces deux lignes refermerait les deux.**

---

## B. Ce que les maquettes n'accordent pas à l'accessibilité — 3 439 violations

Mesuré par la batterie 10 sur 409 couples, **deux côtés audités par le même code**. Aucune n'est
corrigeable par un lot : `pnpm verif:maquette` reste vert sur toutes.

| Occ. | Défaut | Portée | Règle visée |
|---|---|---|---|
| **894** | Cible de lien d'évitement **non focalisable** | **34 vues** | RG-M18-09 |
| **707** | Contraste < 4,5:1 | 16 vues | RG-M18-07 |
| **629** | Graphique sans alternative | 26 vues | RG-M18-11, P-06 |
| 249 | Champ sans nom accessible | 6 vues | — |
| 144 | Combobox sans `aria-controls` / `aria-expanded` | V-09 | — |
| 129 | `treeitem` sans `role="tree"` | 8 vues | — |
| 114 | Action non atteignable au clavier | V-41, V-17, V-40, V-18 | RG-M18-08 |
| 91 | Étiquette orpheline | V-41 (66), V-29 (25) | — |
| 86 | `svg[role=img]` contenant des focalisables | 9 vues | — |
| 80 | Jauge du témoin annoncée | V-14 | DESIGN §3.7 |

**Les 894 étaient prévues.** `ECART-018`, le 19 août, notait : *« dans le gel, aucune cible de lien
d'évitement ne porte `tabindex="-1"` — le déplacement réel du focus n'est effectif que pour V-23 et
V-26, dont la cible est un `<input>`. À reprendre par la batterie 10, et à ne pas déclarer tenu d'ici
là. »* La batterie 10 a rendu, indépendamment : **894 occurrences, 34 vues, V-23 et V-26 exemptes.**
La prédiction était exacte, cible pour cible.

**Deux angles morts déclarés**, qui ne sont pas dans le tableau et qu'aucun outil ne mesure
aujourd'hui : le contraste **non textuel** (WCAG 1.4.11) — donc la moitié de `RG-M18-07` —, et
l'équivalence réelle d'une alternative textuelle (`P-06`) : V-19 et V-20 ont un nom accessible mais
**aucune restitution textuelle candidate**.

---

## C. Le point dur n° 9 n'est pas tenu par les maquettes — 173 couples

*« Chaque zone est maquettée dans ses quatre états »* — chargement, vide, erreur, sans droit.

Mesuré par la batterie 9 : **63 zones de contenu attestées, 252 couples zone × état, dont 173
manquent au gel** — et **0 défaut de portage**. Le produit rend tout ce que la maquette lui donne.

- **112 des 173 portent sur la coquille** — **4 manques distincts** répétés dans les 35 vues qui
  l'enveloppent. *Un seul regel de la coquille en refermerait 112.*
- **L'erreur est la grande absente** : `#p-revisions`, `#indics`, `#p-domaines`, `#sante`, `#detail`,
  `#article`… ne l'ont dans aucune maquette.
- **V-39, la planche des états, ne démontre aucun état « sans droit »** : le point dur n'a de
  composant que pour **trois** états sur quatre.
- **V-39 emploie un second vocabulaire d'erreur** — `.err-local` / `.err-vue` au lieu de
  `.panneau--erreur` — non arbitré. C'est le motif de `DESIGN.md` §2.D-1, appliqué cette fois à
  l'erreur.

---

## D. Ce qui manque tout court

- **La page d'indisponibilité (`RG-NF-10`) n'a aucune maquette.** Rien à porter.
- **La navigation sur petit écran.** `ARB-010` : le rail est en `display:none` inconditionnel
  au-dessous de 1240 px, et **aucune maquette ne montre de tiroir**. `RG-M18-12` et `RG-M18-13` sont
  déclarées **non tenues**, en connaissance de cause.
- **`.palette__etat`** — l'état vide de la palette, présent sur **30 vues** — est absent de
  l'inventaire fermé de `DESIGN.md` §2.A A-7. Trou d'inventaire au sens de `P-5.3`.

---

## E. Deux seuils à installer, et ils ne peuvent l'être que par vous

`verif/references/` est en **écriture humaine seule** : *un seuil qu'une mesure se donne à elle-même
ne mesure rien.* Deux batteries livrées rouges attendent le vôtre.

| Batterie | Commande | État | Ce qu'il faut installer |
|---|---|---|---|
| 9 — quatre états | `pnpm test:etats` | **rouge**, 173 | `--seuil-gel=173` au contrat, vérifié → 0 |
| 10 — accessibilité | `pnpm test:a11y` | **rouge**, 31 + 3 439 | copier `verif/rapports/a11y-seuil-propose.json` (23 clés) en `verif/references/a11y-seuil.json` |

**Recommandation** — ne **jamais** admettre une ligne `portage/…` : les 31 sont corrigeables, et un
lot y travaille. N'admettre les lignes `gel/…` qu'**avec l'arbitrage de regel correspondant**, pour
qu'aucune ne devienne une dette sans nom.

**Conséquence immédiate, à connaître** : `pnpm verify` s'arrête aujourd'hui à `test:etats`. Il
s'arrêtait déjà sur le jalon — mais désormais avec une mesure derrière.

---

## F. Ce qui vous attend hors des maquettes

*Rappel du plan §15.2, sans rapport avec le gel.*

- **Le périmètre de la v1** — avant la vague 6.
- **Un échantillon réel du patrimoine à importer** — avant la vague 7.
- **Un relais SMTP** pour la réinitialisation de mot de passe — avant la vague 8.

---

## Si vous ne deviez trancher que trois choses

1. **Les deux seuils (E).** Sans eux, `pnpm verify` ne peut pas s'enchaîner, et deux batteries
   coûteuses restent illisibles en intégration.
2. **V-08 (A-2).** C'est la recherche, et elle est au cœur du produit. Sa maquette ne rend rien : ce
   qui sera construit derrière n'aura pas de loi.
3. **La coquille (C).** Un seul regel referme 112 des 173 couples manquants — le meilleur rapport du
   dossier.

*Les regels de V-06, V-14 et V-20 sont bornés et sans effet de bord : trois interventions
ponctuelles, à faire quand vous voudrez.*
