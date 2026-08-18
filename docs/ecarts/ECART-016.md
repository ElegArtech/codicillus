# ÉCART-016 — Résidu de T-101b, cinq points — 19 août 2026

Le gabarit est amendé et **regelé**. Les quatre vues livrées sont conformes, vérifié
indépendamment : V-37 32/32, V-38 6/6, V-39 21/21, V-40 10/10 — zéro écart.

## É-1 — Mon décompte d'ARB-015 était faux. **Corrigé.**

ARB-015 énonçait « 33 maquettes sur 35 » portant `<main class="…">`, et deux valeurs d'`id`. Le
relevé mécanique de l'exécutant donne **32 sur 34** — V-09 n'a ni coquille ni `<main>`, V-23 et
V-37 n'ont pas de classe — et **trois** valeurs d'`id` : `contenu` (23 vues), `travail` (10), et
**`corps`** pour V-41.

Il a implémenté d'après **son relevé**, pas d'après ma liste : `idContenu` est une chaîne libre et
non une union fermée à deux valeurs. Sans lui, V-41 aurait buté au lot T-103.

**Ce que ça dit** : un chiffre cité dans un arbitrage n'est pas une source. Le mien venait d'un
rapport, pas d'un comptage. L'exécutant a eu raison de recompter — et c'est la deuxième fois qu'un
décompte de mon fait se révèle inexact (`ECART-010` É-3 sur les états).

## É-2 — Deux maquettes gelées se contredisent sur le composant de notification

V-37 construit ses notifications par un `window.notifier()` local de 18 lignes qui rend
`<div class="notif">texte</div>` — sans marque, sans corps, sans fermeture — **sous un commentaire
qui renvoie lui-même à V-38** (`/* ---------- Notifications (V-38) ---------- */`). V-38 rend le
composant complet à quatre types.

**Décision appliquée : le gabarit suit V-38**, qu'ARB-015 désigne comme la vue qui définit le
composant. V-37 lui passe le type `info`, valeur que V-38 attribue à sa forme courte.

**Conséquence mesurée** : le DOM de l'état `chargement` de V-37 diverge de sa propre maquette,
**hors des zones comparées** (ARB-012) — zéro pixel déplacé, 32/32 conformes. Divergence assumée à
un gel, donc déclarée plutôt que décidée en silence. Le commentaire de V-37 renvoyant à V-38, la
préséance entre maquettes se lit dans le gel lui-même.

## É-3 — Le lien d'évitement demandera un second amendement. **Hors périmètre, à arbitrer.**

La cible du lien d'évitement **n'est `<main>` que dans 22 des 34 maquettes à coquille**. Les douze
autres visent une ancre *intérieure* au contenu — `#resultats`, `#liste`, `#article`, `#zone`,
`#redaction`, `#liste-noeuds`, `#adresse`, `#rech` — et **onze vues portent un libellé autre** que
« Aller au contenu » : « Aller à la bibliothèque », « Aller à la rédaction », « Aller aux
résultats ».

L'exécutant a lié `href` à `idContenu` — exact pour les 22 concordantes, dont les quatre livrées et
les dix de console — et **s'est arrêté là**, la cible et le libellé exigeant deux propriétés
qu'ARB-015 n'ouvre pas. La limite est écrite dans le gabarit.

**À arbitrer avant le premier lot touchant** V-08, V-12, V-14 à V-19, V-21 à V-23, V-26 ou V-41 —
c'est-à-dire avant T-103, qui porte V-41.

## É-4 — Ordre du document sur V-40 : `.notifs` avant les dix `<dialog>`

Le gel place les dialogues entre `div.app` et `div.notifs` ; la coquille rendant `.notifs`
elle-même, l'application les place après. Les loger à leur rang exact aurait demandé une troisième
propriété de gabarit — hors du périmètre borné.

**Effet mesuré : nul.** `.notifs` est `position: fixed`, hors du flux ; la position statique des
dialogues est inchangée, les rangs `dialog.dlg#0…#9` des scénarios sont inchangés, et V-40 sort à
10/10. Même famille qu'`ECART-013` É-3 : divergence de balisage, mesurée nulle en rendu.

## É-5 — La famille `.notif__*` est désormais portée par le gabarit

`.notif--succes/erreur/info/encours`, `.notif__marque`, `.notif__rouet`, `.notif__corps`,
`.notif__titre`, `.notif__detail`, `.notif__fermer`, `.notif__progres`, `.notif__actions` — toutes
présentes au gel, aucune inventée. Absentes de l'inventaire fermé de `docs/DESIGN.md` §2, comme les
86 classes d'`ECART-015`.

**Ce qui change** : elles sont maintenant portées par le **gabarit** et non par une vue, donc
opposables aux 31 lots à venir. Le complètement de l'inventaire (T-009) reste condition de clôture
de la phase 1, et la contradiction `.zone-etat` contre `.vide` reste la première à trancher.

## Ce que la vérification croisée a produit, et qu'il faut noter

L'exécutant n'a pas cru mon arbitrage sur parole : il a **recompté**, trouvé trois faits que je
n'annonçais pas, et implémenté d'après les faits. Il a par ailleurs **aspiré les 45 états des
quatre vues avant et après l'amendement** et prouvé que 34 sur 45 sont identiques caractère pour
caractère, les 11 divergences étant exactement les deux attendues et aucune autre.

C'est ce niveau de preuve qui rend un amendement de ressource gelée acceptable. Une déclaration
« rien n'a bougé » ne l'aurait pas été.
