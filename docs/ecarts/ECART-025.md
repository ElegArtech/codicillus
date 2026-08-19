# ÉCART-025 — P-9 livre trois vues, et découvre qu'ARB-013 n'a jamais fonctionné — 19 août 2026

**Premier lot de production de la vague à passer entier.** V-10, V-11, V-13 : **21 couples sur 21
conformes, écart de canal maximum 0**, dimensions identiques des deux côtés, niveau 1 vert partout.

## É-1 — `ARB-013` était inerte depuis sa pose. **Mon défaut.**

Le filtre qui devait retirer les adresses de l'instantané ARIA s'écrivait `/^\s*\/url:/`. Or
Playwright imprime son instantané **en liste** :

```
- main:
  - link "lien":
    - /url: /reel
```

Le tiret n'était pas prévu. **Le filtre n'a jamais retiré une seule ligne** — vérifié par sonde
directe sur Playwright.

**Pourquoi personne ne l'a vu pendant huit lots** : les quatre vues livrées portent toutes
`href="#"`, comme le gel. La ligne comparée était donc **identique des deux côtés**, et le filtre
inerte donnait exactement le même verdict qu'un filtre qui marche.

Le premier lot à câbler une adresse réelle l'a découvert : **6 des 7 états de V-10 échouaient au
niveau 1 sur cette seule ligne** — `référence : - /url: "#"` contre
`candidat : - /url: /univers/production/infrastructure`.

**La leçon, et elle vaut au-delà de ce cas** : *une règle qu'aucun cas n'exerce est une règle dont
on ignore si elle marche*. ARB-013 a été posé, motivé, commité — et jamais éprouvé, faute d'un cas
qui le sollicite. C'est la même famille que les étalonnages qui n'empruntent pas le chemin réel
(`ECART-013` É-1, `ECART-015` É-5) : **le dispositif ne prouve que ce qu'il exerce**.

Corrigé. Les sept vues livrées restent conformes après correction : la modification ne peut
qu'assouplir le niveau 1, jamais le durcir.

**Conséquence en attente** : les vues portent encore `href="#"`, et le gabarit d'adresse de P-9 est
livré et testé mais **non câblé**. Le câblage est désormais possible ; il fera l'objet d'un lot.

## É-2 — V-11 : la planche du gel accumule la mise en évidence du rail

Mesuré : `dom-migration-2026` marque `["Infrastructure", "Migration 2026"]`, `dom-poste-de-travail`
marque `["Infrastructure", "Poste de travail"]`. La coquille ajoute la marque et **ne la retire
jamais**, et la planche rend d'abord Infrastructure.

Ne pas le reproduire coûte **6 903 px sur 2 des 8 états**. L'exécutant a porté le gel et l'a nommé
en toutes lettres dans le fichier — *« ce n'est pas le comportement du produit : une page de domaine
n'a qu'un domaine courant »*.

C'est le bon geste, et il faut voir ce qu'il coûte : **l'implémentation porte fidèlement un défaut
de la maquette**, parce que le gel fait loi et que le banc l'exigerait. À reprendre par le lot de
logique, avec l'arbitrage qui va avec. V-10 et V-13 y échappent — V-10 ne marque aucun nœud, et les
chemins de V-13 sont emboîtés.

## É-3 — `data-role="lecteur"` n'existe pas au gabarit

La planche de V-11 le pose ; le gabarit n'accepte que `referent | admin`. Divergence **mesurée
nulle** : la seule règle sur `data-role` est `.app:not([data-role="admin"]) .si-admin`, et aucun
sélecteur de la feuille de V-11 ne lit cet attribut. Déclaré plutôt que réglé en rouvrant un gabarit
regelé — et c'est la bonne proportion.

## É-4 — Une phrase de couverture de `verif:inventaire` est périmée

Il annonce que « les classes posées par une expression Svelte non littérale échappent au relevé —
aucune n'existe aujourd'hui ». **Ce lot est le premier à en poser** : `class={p.classe}`,
`class="temoin {…}"`, `class={… ? 'plein' : undefined}`.

Toutes figurent au gel, donc **aucun constat n'est manqué** — mais la couverture annoncée n'est plus
exacte, et il faut le corriger avant que 34 vues n'en posent. Un instrument qui annonce une
couverture qu'il n'a plus est pire qu'un instrument qui se tait.

## Ce que P-10 hérite

`src/lib/rangement/adresses.ts` et ses 13 tests : la forme canonique `/univers/{u}/{d}`, l'adresse
plate d'une note (`RG-M03-03`), les segments de dossier. Le fichier **écrit noir sur blanc**
qu'aucune fonction n'émet `/domaines/…` (ARB-001) et que la clause de désambiguïsation est sans
objet, **à ne jamais implémenter** — vérifié par un test sur les quatre domaines du corpus.

## Les homonymes, tenus séparés

Quatorze des 66 touchent ce lot, dont `.mesure` à **trois corps différents** et `.section-titre` à
**trois définitions dans les trois vues du lot lui-même**. Aucune factorisation, aucune promotion.
`.noeud` n'est écrite dans aucun des trois fichiers : elle n'existe que dans le rail du gabarit,
où c'est un nœud d'arborescence — le nœud de graphe de la cartographie reste intact.
