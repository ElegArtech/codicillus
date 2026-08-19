# ÉCART-041 — Les 31 « défauts de portage » n'en sont pas — 19 août 2026

**Gravité : haute. Deux défauts d'orchestrateur, un défaut d'instrument, et un seuil posé sur du
sable.**

Lot **T-060**, qui devait fermer 31 défauts de portage d'accessibilité. **Il n'en a fermé aucun, et
c'était la bonne livraison** : aucun des 31 n'est un défaut de portage. L'exécutant n'a écrit aucune
ligne de code, et a livré deux mesures plutôt qu'un vert.

## Le fait, prouvé et non supposé

**Les 31 sont présents des deux côtés**, sur le même nœud, pour la même règle. Chaque ligne
`portage` a un jumeau `gel-non-reporté` de même règle et de même compte :

| Règle | portage | jumeau `gel-non-reporté` | reliquat réel |
|---|---|---|---|
| `axe:scrollable-region-focusable` | 24 | **24** (sur 28) | 4 (V-37) |
| `axe:aria-required-children` | 3 | **3** | 0 |
| `axe:aria-required-parent` | 3 | **3** | 0 |
| `superposition:sans-piege` | 1 | **1** | 0 |

Contrôle sur le rapport machine : **`portage opposable = 31 | jumelés = 31`**.

**La cause est dans la clé de rapprochement.** `cleDe()` vaut `règle + signature`, et `signature()`
embarque `texte(e).slice(0,48)` — le `textContent` avec `\s+ → ' '`. Les deux côtés n'ont pas le
même nombre de nœuds de texte blancs :

| Vue | gel | application |
|---|---|---|
| V-14 | `…RétentionÉtat 20260810T` | `…RétentionÉtat20260810T0` |
| V-35 | `Date Source et scénario Auteur…` | `DateSource et scénarioAuteur…` |
| V-19 | `…périmètreLa cartographie` | `…périmètre La cartographi` |

Blancs retirés, les 31 chaînes sont identiques sur leur préfixe commun. **Rien d'autre ne diffère.**

**Et le portage ne pouvait pas faire autrement.** Le `div.tableau-boite` de V-03 est écrit dans
`src/vues/V-03.svelte` **identique au gel hors caractère d'indentation** — `diff` vide, vérifié.
Même source, DOM différent : c'est **le compilateur Svelte qui élague les nœuds de texte blancs**.
C'est le piège **P-8**, du côté où personne ne le regardait.

**Le banc, lui, lit les deux côtés comme identiques** : l'instantané ARIA de Playwright rend
`- row "Date Source et scénario Auteur Notes Ignorés Échecs"` — avec les espaces — des deux côtés.
**C'est la clé de la batterie 10 qui sur-discrimine, pas le banc qui laisse passer.**

## Les deux routes de réparation, fermées par la mesure

**La prémisse de mon contrat était fausse.** J'avais écrit : *« un `aria-*`, un `role`, un `tabindex`
ne peignent aucun pixel — c'est pourquoi ces 31 défauts sont réparables. »* Vrai pour les pixels ;
**faux pour le banc**, dont le niveau 1 compare l'instantané ARIA **et l'ordre de tabulation** :

```
role="table" sur .tableau-gestion (V-35)   →  3 conformes, 1 écart — echec-structure
    référence : - row "Date Source et scénario Auteur Notes Ignorés Échecs"
    candidat  : - table:

tabindex="0" sur .tableau-boite (V-15)     →  6/6 conformes  →  0/7
    référence : button[submit] « Agrandir le schéma d'enchaînement »
    candidat  : div « IdentifiantDateTypeTailleRétentionÉtat… »
```

Les deux perturbations ont été retirées et les deux vues revérifiées à 0 écart.

**La seconde route — aligner les blancs — fonctionne, et l'exécutant l'a refusée.** Mesurée sur
V-19 : banc à 0 écart, prettier stable, `portage` de la vue passant de 1 à 0. Refusée pour deux
raisons qu'il faut garder :

1. **Elle ne répare rien.** Le `div.voile` ne piège toujours pas le focus ; le `div.tableau-boite`
   défile toujours sans contenu focalisable. **Seule l'étiquette change.** L'en-tête de
   `verif/a11y-sondes.mjs` nomme ce geste : *« requalifier une nature pour obtenir du vert est le
   contournement nommé par PLAN §12 (RA-01) »*.
2. **Elle déplace `gel`** : 3 439 → 3 470 si on la généralise.

## Ce que cela emporte pour ARB-026 — mon seuil est faux

`verif/references/a11y-seuil.json` a été posé en **retirant les 31 lignes `portage/…`**, sur la
recommandation « ne jamais admettre de portage ». La recommandation reste juste ; **son application
ici est fausse**, puisque ces 31 sont du gel. Le seuil fige donc 31 fausses lignes et la batterie
échouera indéfiniment dessus.

**`ARB-026` est suspendu sur son volet accessibilité** jusqu'à correction de l'instrument. Le volet
batterie 9 (`--seuil-gel=173`) n'est pas concerné.

## É-4 — et il est le plus grave : la batterie 10 n'est pas déterministe

**Deux exécutions sur un arbre strictement identique donnent 92 puis 95.** Le delta est entièrement
sur `superposition:sans-restitution`, **côté gel**, V-40 : 1 occurrence au premier passage
(`d-simple`), 4 au second (`d-deplacer`, `d-relation`, `d-restaurer`, `d-reviser`). La sonde presse
Échappement et constate la restitution du focus **sous horloge reprise** — cf. **P-15**.

`portage` et `gel` n'ont pas bougé, mais **un compteur de défauts qui varie sans qu'aucune source ne
change rend sans valeur tout seuil posé dessus.** À stabiliser avant toute réinstallation.

## Mes deux défauts

**É-5 de l'exécutant — mes deux critères de sortie étaient mutuellement inaccessibles.** *« `portage`
doit descendre »* et *« `gel` ne doit pas bouger d'une unité »* ne peuvent pas être satisfaits
ensemble : chaque unité de `portage` est **soudée** à son jumeau `gel-non-reporté`, et la fermer la
reverse mécaniquement dans `gel`. Mon inférence — *« s'il bouge, tu as touché à la maquette ou à
l'instrument »* — **omettait une troisième cause** : rapprocher le DOM de l'application de celui du
gel. L'exécutant a refusé de trancher seul et a livré les deux mesures. C'est le geste attendu.

**É-3 de l'exécutant — un sixième chiffre transmis faux.** `ECART-039` écrit « 24 / 43 / 28 » pour
`scrollable-region-focusable` avec « 28 instrument ». Mesuré : **24 portage / 43 gel / 28
gel-non-reporté, et zéro instrument**. `verif/contrat.mjs` protège contre les chiffres tapés à la
main, **pas contre un relevé correct lu de travers** — c'est la sixième fois, et toujours la même
cause.

**Et la réserve d'ECART-039 sur `scrollable-region-focusable` ne tient pas non plus.** Elle annonçait
*« elle bascule sur un dépassement d'un pixel que le niveau 2 du banc ne voit pas »*. Mesuré : les 24
portent sur **le même `div.tableau-boite`, dans tous les états, des deux côtés** — la région déborde
**toujours**. Il n'y a pas de bascule au pixel, il y a une signature qui diffère d'un espace. La
consigne « à ne pas traiter en premier » était fondée, **mais pas pour le motif donné**.

## La leçon, et elle est neuve

Le recoupement à deux côtés a été présenté — par moi, dans `ECART-039` — comme ce qui rend le verdict
lisible. **Il l'est ; mais il n'est pas plus fiable que sa clé de rapprochement.** Un instrument qui
compare deux populations produit exactement deux fautes symétriques : sur-rapprocher, et masquer un
défaut réel ; sous-rapprocher, et fabriquer un faux portage. **Toute clé de rapprochement doit donc
être éprouvée dans les deux sens** — un cas qui doit se rapprocher, et un cas qui ne doit pas.
C'est P-5 appliqué à une jointure.

## Suite donnée

Le lot est renvoyé à son exécutant avec un mandat renversé : réparer la clé (avec **contrôle positif
de sur-rapprochement** exigé), stabiliser la sonde (**trois exécutions identiques** exigées), puis
régénérer le partage. L'interdiction de toucher à `verif/a11y.mjs` est levée pour ces deux points
seulement — il ne l'ajuste pas pour obtenir du vert, il répare une clé dont il a démontré qu'elle
fabrique le faux positif que l'en-tête du module dit qu'elle ne doit pas fabriquer.

**Une fois la clé corrigée, T-060 n'a plus d'objet** : il n'y a rien à porter. Les trois défauts
réels — région défilante sans contenu focalisable, `role="row"` orphelin, voile non piégeant — sont
dans les maquettes gelées.
