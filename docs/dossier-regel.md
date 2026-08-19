# Dossier des regels — ce qui attend votre geste

*Consolidé le 19 août 2026, **réduit le même jour** par les arbitrages ARB-026 à ARB-032.*

---

## Ce que ce dossier contenait, et pourquoi il a fondu

Il portait vingt points. Presque tous se déduisaient par mise en cohérence des sources gelées, et
c'est ce qui était demandé dès le départ : *« ça doit vraiment être celles qui ne peuvent pas se
déduire… par un minimum de travail de cohérence. »* Ils ont été tranchés, et tracés :

| Ce qui bloquait | Tranché par | Ce que ça lève |
|---|---|---|
| Deux batteries rouges, seuils non posés | `ARB-026` | `pnpm verify` s'enchaîne |
| 3 439 violations d'accessibilité « du gel » | `ARB-027` | tout ce qui ne peint aucun pixel devient réparable |
| V-06, le dernier écart des 409 couples | `ARB-028` | 409 sur 409 |
| V-14, `P-01` contre le gel | `ARB-029` | la fabrique unique porte les deux formes du gel |
| V-08, la maquette de la recherche qui ne rend rien | `ARB-030` | la carte de résultat dérive de V-02 |
| La page d'indisponibilité, sans maquette | `ARB-031` | elle dérive de V-04 |
| 173 couples zone × état non maquettés | `ARB-032` | l'état dérivé emploie le composant du gel |

**Le principe commun aux sept.** Les maquettes sont la loi **de ce qu'elles montrent**. Elles ne
sont pas une loi interdisant ce qu'elles ne montrent pas — et là où deux maquettes gelées montrent la
même chose pour deux publics, la seconde se déduit de la première. Ce qui reste ci-dessous est ce
qui échappe vraiment à ce raisonnement.

---

## 1. Les 707 violations de contraste — **elles peignent des pixels**

Seize vues portent du texte sous 4,5:1. `ARB-027` ne les couvre pas : corriger un contraste change
une couleur, donc un pixel, donc la maquette. Il n'y a pas de déduction possible — une valeur de
teinte est un choix, pas une conséquence.

**Deux issues, et elles vous appartiennent :** regeler les seize vues sur des teintes conformes, ou
admettre l'écart et le dire. En attendant, les 707 sont une **dette nommée** dans
`verif/references/a11y-seuil.json`, ligne `gel/axe:color-contrast` — elles ne peuvent pas grossir en
silence.

*Le contraste **non textuel** (WCAG 1.4.11) n'est mesuré par aucun outil : la moitié de `RG-M18-07`
reste hors de portée de la batterie, quelle que soit votre décision.*

## 2. V-20 — le fil déroulé par type maître n'existe dans aucun état

`id="fil"` est posé deux fois dans la maquette, et `getElementById` rend le premier : `.fil-deroule`
reste vide aux cinq états. Les deux côtés le portent, donc le banc est vert, donc **l'application
reproduit fidèlement une zone morte**.

Rien ne bloque, et rien n'est faux. Mais si ce fil doit fonctionner, **aucune maquette ne montre à
quoi il ressemble rempli** — et c'est le seul cas du dossier où la déduction n'a pas de source.

## 3. La navigation sur petit écran — déjà tranchée, rappelée ici

`ARB-010` a assumé l'absence : le rail disparaît sous 1240 px, aucune maquette ne montre de tiroir,
`RG-M18-12` et `RG-M18-13` sont déclarées **non tenues en connaissance de cause**. Rien à décider
tant que vous ne voulez pas revenir dessus.

---

## 4. Les trois entrées qui ne sont pas dans le dépôt

*Plan §15.2 — sans rapport avec le gel, et personne d'autre ne peut les fournir.*

| Attendu | Échéance |
|---|---|
| Le périmètre de la v1 | avant la vague 6 |
| Un échantillon réel du patrimoine à importer | avant la vague 7 |
| Un relais SMTP pour la réinitialisation de mot de passe | avant la vague 8 |
