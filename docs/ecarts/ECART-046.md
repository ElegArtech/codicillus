# ÉCART-046 — Lot T-013b, `ARB-029` appliqué et `ARB-056` posé — 20 août 2026

**Dix écarts remontés par le lot, tous vérifiés. Aucun écarté.** Plus **un défaut de harnais trouvé par
l'orchestrateur en vérifiant le lot**, et il produisait un **faux rouge** sur la batterie 1.

**La batterie 5 est verte.** `pnpm verif:fraicheur` rend **0 constat**, là où il rendait 1 depuis
`ARB-029` — rendu le 19 août et jamais exécuté. **`P-01` est tenu**, et il ne l'était pas.

```
pnpm verif:fraicheur     → 0 constat · B0 import de $lib/fraicheur : 16/16 · 46 facettes honorées   rc 0
pnpm test:unit           → 26 fichiers · 910 tests   (864 → +13 fraicheur, +32 document, +1 markdown)
node verif/contenu.mjs invalide → 24 documents mal formés, 7 genres · 24/24 refusés au bon motif    rc 0
pnpm check               → 0 erreurs · 92 avertissements INCHANGÉS · Prettier propre                rc 0
pnpm test:aller-retour · verif:convertisseur · verif:gel · verif:jetons · verif:inventaire
  · verif:demo:hors-production · test:droits · test:vide · test:etats · test:a11y
  · test:impression · verif:vocabulaire                                                         tous rc 0
pnpm verif:menus         → rouge à 81, code 1, JAMAIS 2 — dette ARB-047 intacte
```

---

## D-1 — **Défaut de harnais, trouvé en vérifiant le lot** : `pnpm check` rendait 340 erreurs

**Ce n'est pas le lot. C'est l'outillage agentique, et c'était un faux rouge.**

En rapatriant, `pnpm check` est passé de 0 à **340 erreurs** :

```
/home/alex/.../.claude/worktrees/agent-<id>/base/base.mjs
  0:0  error  Parsing error: No tsconfigRootDir was set, and multiple candidate TSConfigRootDirs are present
… ×340
```

**La cause.** L'outil d'agent a créé au lot voisin une copie de travail **à l'intérieur du dépôt**,
`git worktree list` :

```
/home/alex/Documents/Repo/codicillus                                           [master]
/home/alex/Documents/Repo/codicillus/.claude/worktrees/agent-<id>              locked
```

`.gitignore:23` exclut bien `.claude/worktrees/`. **Mais eslint ne lit pas `.gitignore`** : son ignore
est la liste de `eslint.config.js:10-20`, neuf entrées, et `.claude/` n'y était pas. Le dépôt entier
était donc relu une seconde fois, sous une racine `tsconfig` ambiguë — donc en échec par construction.

**Pourquoi c'est grave, et pourquoi ça ne s'était jamais vu.** `pnpm check` est la **batterie 1**, au
critère de sortie de **tout** lot. Le défaut :

- est **intermittent** — il n'existe que pendant qu'un agent doté d'une copie interne tourne ;
- est **sans rapport avec le moindre livrable**, donc indiagnostiquable depuis le diff ;
- et **n'était jamais apparu** parce que les vagues précédentes n'employaient que des copies sous
  `/tmp/wt-*`. C'est `P-5` retourné : une configuration qu'aucun cas n'exerçait, et qui était fausse.

**Correction : `.claude/` entre dans les ignores d'eslint**, avec son motif en commentaire.
`pnpm check` retrouve **0 erreur, 92 avertissements inchangés**.

**Et ce n'est pas un assouplissement**, la distinction important : la ligne ne retire aucun fichier du
**produit** au crible. Elle retire une copie transitoire que git ignore déjà, et dont le seul effet est
de faire relire deux fois les mêmes fichiers sous une racine indécidable. La lecture inverse — eslint
doit contrôler la copie de travail d'un agent — est absurde : elle échoue par construction, quel que
soit le code.

**Vérifié** : la copie interne est **vide de modifications** (`git status` sans sortie) ; le lot voisin
travaille bien dans la copie que son contrat lui assigne. C'est un artefact pur.

**Inscrit à `CLAUDE.md` §6 sous `P-25`.**

---

## É-1 et É-2 — Les deux branches de la forme compacte que le gel n'exerce pas

`ARB-029` dit « du même niveau et de la même ancienneté » et **ne descend pas aux quatre branches**. Le
lot a donc tranché deux fois, et l'a déclaré.

**La règle de dérivation, établie sur les deux seuls cas du gel** — et le lot a prouvé qu'ils sont les
seuls : `grep -o 'temoin__txt">[^<]*' mockups/*.html` sur les 41 fichiers rend **2 occurrences**.

| Gel | Corpus | Longue | Compacte |
|---|---|---|---|
| `V-14:1817` `temoin--frais` | `n-planifier-sauv` frais, 6 j | `Vérifié il y a 6 jours` | `il y a 6 j` |
| `V-14:1822` `temoin--vieil` | `n-purge-sauv` vieil, 126 j → 4 mois | `Vérifié il y a 4 mois` | `il y a 4 mois` |

> **Règle : la compacte retire le verbe d'attestation « Vérifié » et abrège « jours » en « j ».
> « mois » n'est pas abrégé — le gel l'écrit en entier.**

| # | Branche | Décision, et son appui |
|---|---|---|
| É-2 | `frais` ≥ 31 j | **`il y a 1 mois`**. Mécanique, sans perte : le retrait du verbe s'applique, aucune unité n'est en jeu |
| É-1 | **`obs`** | **la compacte EST la longue — `Pas revu depuis {mois} mois`** |

**Et le raisonnement d'É-1 est le bon.** `src/lib/fraicheur.ts:181-182` écrivait déjà, avant ce lot :
*« le niveau obsolète CHANGE DE VERBE — “Pas revu depuis” —, ce qui est une part de l'information
portée hors couleur »* ; et `CAHIER-DES-CHARGES-FONCTIONNEL.md:1403` (`RG-M18-09`) : *« l'information
n'est jamais portée par la couleur seule »*.

Appliquer mécaniquement « retirer le verbe » aurait donné `depuis 8 mois` et **effacé la seule chose
qui distingue `obs` de `vieil` à ancienneté égale.** Le lot l'a formulé mieux que mon contrat :
*« ce que la compacte retire, c'est le verbe redondant avec la jauge ; pas celui qui la contredit. »*

**Aucune maquette ne mesure ces deux branches** : les unitaires les nomment `BRANCHE NON EXERCÉE PAR LE
GEL`. C'est `P-5` dit à voix haute, comme `T-014` pour les images et `T-015` pour ses deux
constructions.

**Borne 1 non atteinte, et le lot l'a vérifiée** : les quatre autres `il y a …` du gel (`V-03:971`,
`V-14:1497`, `V-15:1589`, `V-37:1376`) sont des dates de **modification** en « semaines », une unité que
`libelleFraicheur` ne produit jamais.

---

## É-3 — La batterie 5 interdit d'épingler la forme longue, et ses octets ne sont tenus que par le banc

Le contrôle A2.3 relève toute chaîne littérale portant `Vérifié il y a` ou `Pas revu depuis` dans
`src/**` hors implémentation. **L'unique exemption de `src/lib/fraicheur.test.ts` ne couvre que A3**
(les seuils 90 et 180). Mesuré : la première rédaction des unitaires, qui écrivait les libellés
attendus, a produit **9 constats A2.3**.

**Le lot n'a ni touché l'instrument ni contourné le motif.** Ses unitaires prouvent la *branche* prise,
l'*unité* employée et la *dérivation* — `longue.endsWith(compacte.replace(/ j$/, ' jours'))` — sans
citer le verbe.

> **La conséquence est à connaître, et elle est structurelle : les octets exacts de la forme longue ne
> sont épinglés que par le banc, à ses 409 couples. Aucun unitaire ne les tient, et aucun ne peut.**

C'est acceptable — 39 maquettes portent `window.libelleFraicheur` et le banc les mesure au pixel — mais
il faut le savoir : une régression du libellé ne serait vue que par une campagne de 6 minutes, jamais
par les 1,6 s des unitaires.

---

## É-4 — **Borne 3 atteinte** : un cas nommé de la batterie 4 enfreignait la règle 7

Le contrat disait : *« si un document du gel enfreint l'une des deux règles d'`ARB-056`, ne l'assouplis
pas : dis lequel, et corrige le document. »*

Ce n'est pas un document du gel, c'est un **cas nommé de la batterie 4** :
`aller-retour.ts`, « marques empilées, dans les deux ordres » portait **5 textes à marques empilées,
dont 4 non canoniques** — `[italic, bold]`, `[lienInterne, bold]`, `[link, strike]`,
`[highlight, underline]`.

**Le document était faux, et il a été corrigé** : renommé « dans l'ordre du type », les 4 couples
distincts conservés en ordre canonique, le texte devenu doublon retiré. **La couverture ne baisse
pas** — mêmes 4 couples de marques — et l'ordre inverse passe de *cas d'aller-retour* à *cas de refus*.
Les 14 cas restent identiques, 0 écart.

**Et les quatre corps du gel n'enfreignent ni l'une ni l'autre règle**, mesuré par sonde temporaire
créée, exécutée et supprimée : `GEL : 4 documents, 203 nœuds de texte, 0 à plus d'une marque, 0 porteur
de \r`. `documents-du-gel.ts` appelant `analyserDocument` au chargement du module, un seul manquement
aurait empêché l'import.

---

## É-5 et É-6 — Deux tests de `T-015` et `T-014` reposaient sur des documents non canoniques

| # | Le test | Ce qu'il devient |
|---|---|---|
| É-5 | `markdown.test.ts` « l'ordre des marques est l'ordre d'imbrication » sérialisait puis relisait **les deux** ordres | scindé : l'ordre canonique fait l'aller-retour, l'ordre inverse **lève `DocumentInvalide` des deux côtés**. `markdown.ts` n'est pas touché |
| É-6 | deux `CAS_INVALIDES` — `[code, bold]`, `[lienInterne, link]` — violaient la règle 6 **et** la règle 7, et ne passaient pour la bonne raison que grâce à l'ordre des `refine` | remis en ordre canonique : un cas, une règle |

**É-5 porte un enseignement de forme qui vaut d'être gardé.** Le tiret bas de l'italique, que `T-015`
avait choisi pour préserver l'ordre des marques, est ce qui rend `_**x**_` **relisible**, donc
**refusable** : avec trois astérisques des deux côtés, la relecture aurait rendu un ordre au hasard et
le refus n'aurait jamais eu lieu. *Une décision de forme prise pour la fidélité s'est révélée la
condition de l'opposabilité d'une règle posée après elle.*

---

## É-7 — Un en-tête périmé, corrigé

`CAS_INVALIDES` s'annonçait « LES QUINZE DOCUMENTS MAL FORMÉS, en six genres » pour une liste qui en
portait **21 en 7 genres**. Corrigé à **24 / 7**. Les comptes du rapport sont **calculés** et n'ont
jamais menti — c'est la prose qui avait vieilli.

---

## É-8 — **Le seul cas réel qui exerçait le garde-fou de B3 disparaît avec la correction**

`verif/fraicheur.mjs` explique en propres termes que `{voisine.libelle}` de V-14 est ce qui empêche sa
condition de receveur d'être inerte : *« sans la condition de receveur, ce contrôle serait inerte »*.

**Ce cas n'existe plus dans le produit.** Le garde-fou n'est plus exercé que par les gabarits de
`verif/fraicheur.test.ts:313-380`. Le lot n'a pas touché l'instrument, et il a raison : c'est un `P-5`
à connaître, pas un rouge.

> **C'est la TROISIÈME occurrence du même motif, et il mérite un nom.** `docs/reprise.md` porte déjà :
> *« la sonde de restitution de focus, une fois corrigée, n'est plus exercée par aucun des 409
> couples — `P-5` sur la correction elle-même »*. Ici, c'est le contrôle B3 de la batterie 5 qui perd
> son unique cas **parce qu'on a réparé le défaut qu'il détectait.**
>
> **Un contrôle dont le seul cas d'épreuve est le défaut qu'il sert à trouver devient inerte le jour où
> il réussit.** Ce n'est pas un paradoxe, c'est une exigence de conception : un contrôle doit avoir un
> cas d'épreuve **synthétique**, indépendant du dépôt. `verif/fraicheur.test.ts:313-380` en porte un ;
> la sonde de focus n'en a pas. Porté à `CLAUDE.md` §6 avec `P-25`.

---

## É-9 — Une part de la règle 6 n'a toujours aucun cas, et devient masquable

« Deux marques de même type sur le même texte » est refusée par le schéma et **aucun `CAS_INVALIDE` ne
la sollicite** — trou préexistant, hors du périmètre du lot.

**Et la règle 7 le rend désormais masquable** : elle refuse aussi les doublons (rang non strictement
croissant), donc un futur cas pourrait passer **pour la mauvaise raison**. Non comblé, déclaré. À
reprendre par le lot qui touchera `CAS_INVALIDES`.

---

## É-10 et hygiène

`verif:menus` reste rouge à **81**, code 1 — dette `ARB-047` intacte. `verif:base` et `test:etancheite`
non exécutées : hors territoire, `T-012b` tient la base partagée — **c'est le partage que
`ECART-045` É-3 avait prescrit, et il a fonctionné.**

**Les onze références de ligne du contrat rouvertes une par une : toutes exactes.** Seule dérive, et
c'est la mienne : `ARB-056` cite `document.ts:91-105` pour le type `Marque`, que l'en-tête du lot a
déplacé en 114-128. Noté dans le code.

**P-22** — aucun serveur résiduel (`ls -l /proc/*/cwd | grep wt-frais` sans sortie, aucun socket sur
5912), aucun conteneur créé, sonde temporaire supprimée.

## Une précision d'honnêteté du lot, et elle mérite d'être lue

La campagne de 409 couples a tourné **une seule fois**, comme demandé — `409 conformes, 0 écart,
365,6 s`, dont **V-14 : 44 couples, 0 pixel différent sur 192 877 568 comparés**. **Trois éditions de
commentaire l'ont suivie**, et plutôt que de relancer six minutes sur une machine partagée le lot a
rejoué **V-14 seule** : `44 conformes, 0 écart`. Il le dit au lieu de le taire.

Les trois fichiers réédités sont `fraicheur.ts`, `document.ts` et `document.test.ts` — **aucun `.svelte`,
donc aucun effet possible sur le rendu**. La campagne complète est de toute façon rejouée par
l'orchestrateur sur l'arbre fusionné, avec `T-012b`.
