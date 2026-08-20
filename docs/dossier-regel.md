# Dossier des regels

*19 août 2026. Il portait vingt points le matin ; il en porte **zéro** le soir.*

---

## Il est vide, et ce n'est pas un oubli

Tout ce qu'il contenait se déduisait des sources gelées par un travail de cohérence. Chaque point a
été tranché et tracé — `ARB-026` à `ARB-035` dans `docs/arbitrages.md`.

| Ce qui bloquait | Tranché par |
|---|---|
| Deux batteries rouges, seuils non posés | `ARB-026` |
| 3 439 violations d'accessibilité « du gel » | `ARB-027` |
| V-06, le dernier écart des 409 couples | `ARB-028` |
| V-14, `P-01` contre le gel | `ARB-029` |
| V-08, la maquette de la recherche qui ne rend rien | `ARB-030` |
| La page d'indisponibilité, sans maquette | `ARB-031` |
| 173 couples zone × état non maquettés | `ARB-032` |
| 707 violations de contraste | `ARB-033` |
| Le fil déroulé de V-20 | `ARB-034` |
| Les trois entrées attendues du commanditaire | `ARB-035` |

**Trois raisonnements ont suffi, et chacun était disponible depuis le début.**

1. **Les maquettes sont la loi *de ce qu'elles montrent*.** Elles ne sont pas une loi interdisant ce
   qu'elles ne montrent pas. Un `tabindex`, un `role`, un `aria-hidden` ne peignent aucun pixel.
2. **L'ordre de préséance répond déjà à la plupart des conflits.** Là où j'ai posé une question, il
   avait souvent tranché : une règle du cahier des charges que le gel ne tient pas **n'est pas
   tenue**, et c'est une conséquence, pas une décision en attente.
3. **Une source manquante est souvent une source non lue.** Le fil déroulé de V-20 était réputé sans
   maquette ; il est décrit à trois endroits de sa propre maquette — feuille, constructeur,
   conteneur. Je ne l'avais pas ouverte.

---

## Ce qui vaut d'être retenu de l'épisode

**Un chiffre d'instrument n'est pas un chiffre de défauts.** « 707 violations de contraste » est un
compte d'occurrences d'axe. Le partager entre *exempt par WCAG 1.4.3*, *défaut réel* et *indécidable*
change sa nature — et ce partage est une mesure, jamais une question à poser.

**Une remontée n'est légitime que si la déduction a été tentée d'abord.** Le protocole d'écart
existe pour les vides réels. S'en servir pour ce qui se déduit transforme un dispositif de sûreté en
dispositif d'attente, et déplace sur le commanditaire un travail qui est celui de l'exécution.

---

## Si quelque chose doit y revenir

Un point n'entre ici que s'il satisfait les trois conditions **à la fois** :

1. aucune maquette gelée ne le montre, **vérifié fichier ouvert**, pas supposé ;
2. aucune autre vue ne montre la même chose pour un autre public ou dans un autre état ;
3. l'ordre de préséance ne le tranche pas, et aucune règle déjà écrite n'en fixe la valeur.

**Deux points les satisfont, depuis le 20 août 2026. Ils sont ci-dessous.**

---

## R-01 · `Template.utilisations` — 72 annoncées, 32 possibles

*Ouvert le 20/08/2026 par `T-049`. Vue concernée : **V-31**. Batterie qui le tient : `pnpm verif:donnees`, lacune `Template.utilisations`.*

### Le fait, mesuré fichier ouvert

`mockups/V-31-console-templates.html` déclare quatre templates et leur compteur d'emploi :

| Ligne | Template | `utilisations` |
|---|---|---|
| `:2705` | Procédure d'intervention | 34 |
| `:2711` | Fiche applicative | 12 |
| `:2717` | Retour d'incident | 7 |
| `:2723` | Guide utilisateur | 19 |

`total()` (`:3289-3291`) en fait la somme — **72** — et `rendreListe()` (`:3305`) l'écrit dans le `span#total-utilisations` du `:1655`, qui se lit alors :

> « Les **72** notes déjà créées à partir de ces templates ne bougeront pas. »

Le `:3348` rend en outre chaque compteur note par note, dans la colonne de la liste.

**Le corpus embarqué par cette même maquette compte 32 notes** (`:1876-2200`). Une note ne peut être créée qu'à partir d'un seul template : 72 provenances ne se répartissent pas sur 32 lignes. **Le chiffre affiché est arithmétiquement impossible dans le monde que la maquette décrit elle-même.**

### Les trois conditions

Ce point n'est pas de la famille des vingt précédents — ceux-là étaient des **silences** du gel, celui-ci est une **contradiction interne**. Les trois conditions se lisent donc en conséquence, et elles sont satisfaites :

1. **Aucune maquette ne montre la provenance d'une note.** Vérifié sur les 41 fichiers : la seule prose sur le sujet est celle de V-31 (`:3464`, `:3548`), qui parle des notes issues d'un squelette **sans jamais en désigner une**. Aucune vue de lecture, d'édition ou de console n'affiche « créée depuis le template X ». La donnée qui rendrait 72 vérifiable n'est montrée nulle part.
2. **Aucune autre vue ne montre la même chose autrement.** Quinze maquettes embarquent le même tableau `TEMPLATES` avec les mêmes quatre valeurs ; **une seule les rend** — V-31 est le seul fichier où `t.utilisations` est lu. Il n'existe donc ni second chiffre, ni autre public, ni autre état qui trancherait.
3. **L'ordre de préséance ne tranche pas.** Il classe *Maquettes > Cahier des charges > …* et règle les conflits **entre** documents. Ici le conflit est **entre une maquette et elle-même** : V-31 contre V-31. Aucun classement ne départage un document d'avec lui-même. Et aucune règle écrite ne fixe `utilisations` : le CDC ne le mentionne pas, et `docs/arbitrages.md` ne l'a jamais abordé.

### Pourquoi aucun lot ne peut le fermer

Les deux issues qu'un agent d'exécution pourrait prendre sont fermées, chacune par une règle :

- **Poser la colonne de provenance et compter** rendrait au mieux un total ≤ 32, donc **pas 72** : l'écran resterait faux, et la colonne serait écrite par personne et lue par personne — la règle qu'aucun cas n'exerce de `P-5`.
- **Rendre 72 depuis le jeu** serait la valeur illustrative que **`P-02`** proscrit en propres termes : « aucun indicateur, aucun compteur ne peut être figé ou simulé ».

`T-030b` avait refusé de poser la colonne ; `T-049` ne la pose pas davantage. **Le produit ne rend donc pas `utilisations`** : `lireTemplates()` l'omet, et `pnpm verif:donnees` porte la lacune, chiffrée à chaque exécution — *« les 4 templates — 72 utilisations annoncées pour 32 notes au corpus, 0 provenance en base »*. Le manque est **compté en rouge**, jamais comblé.

### Ce que le commanditaire a à trancher

Une seule question, et elle appelle un chiffre ou une suppression :

> **Les compteurs d'emploi de V-31 doivent-ils être ramenés à des valeurs compatibles avec les 32 notes du corpus — et lesquelles —, ou l'indicateur doit-il disparaître de la vue ?**

Toute réponse est un **regel de V-31** : la valeur vit dans le corpus embarqué de la maquette, et le gel de `mockups/GEL.md` couvre le fichier entier. Tant qu'elle n'est pas donnée, la lacune reste ouverte et la batterie reste rouge d'un point — **c'est le comportement voulu**, pas un défaut à corriger.

---

## R-02 · Les treize pièces jointes de V-14 — nommées à deux, chiffrées à zéro

*Ouvert le 20/08/2026 par `T-026`. Vues concernées : **V-14**, et les six autres maquettes qui déclarent un décompte de pièces. Batterie qui le tient : `pnpm verif:donnees`, lacune `Note.pj`.*

### Ce que ce point n'est plus

**Jusqu'au 20 août, il était double, et l'une de ses deux moitiés vient de tomber.** `T-030b` puis `T-049` ont refusé de semer les pièces pour deux raisons cumulées : le gel ne donne pas leurs données, **et** le produit ne savait stocker aucun fichier — `RACINE_FICHIERS` était déclarée à `compose.yaml:136` et lue par zéro ligne.

`T-026` a fermé la seconde. L'entrepôt existe, une pièce déposée porte ses octets sur le disque et sa métadonnée en base, la route de `RG-M04-08` les ressert, et `node base/base.mjs pieces` le mesure en onze pas. **Ce qui reste est donc exclusivement un défaut du gel** : c'est ce qui fait entrer ce point ici plutôt que dans un contrat de lot.

### Le fait, mesuré fichier ouvert

Sept notes sur les 32 du corpus déclarent des pièces jointes, **treize au total**. Le gel n'en **nomme** que deux, au panneau de `mockups/V-14-lecture-note.html` :

| Ligne | Nom | Type affiché | Taille affichée |
|---|---|---|---|
| `:1833-1836` | Plan de reprise — volet bases | PDF | « 1,2 Mo » |
| `:1837-1840` | Matrice des serveurs sauvegardés | CSV | « 18 Ko » |

Les onze autres n'existent nulle part : le corpus n'en porte que le **nombre**.

**Et les deux nommées ne se sèment pas davantage, pour un motif plus étroit que l'absence de nom.** `pieces_jointes.taille_octets` veut un nombre d'octets ; « 1,2 Mo » n'en désigne pas un, il en désigne **un intervalle** — toutes les tailles qui s'arrondissent pareil à deux chiffres significatifs s'y affichent identiques. Le gel montre le **rendu**, la colonne veut la **donnée**, et le passage inverse n'est pas une fonction. C'est le défaut de `Compte.derniere` mot pour mot.

Ce ne sont donc pas onze noms qui manquent : **ce sont treize tailles**, plus onze noms et onze types de média.

### Les trois conditions

1. **Aucune maquette ne donne une pièce jointe en données.** Vérifié sur les 41 fichiers : le seul endroit où une pièce est nommée est le panneau de V-14 ci-dessus. Partout ailleurs, le corpus embarqué ne porte qu'un entier `pj`.
2. **Aucune autre vue ne montre la même chose autrement.** Les six autres notes déclarantes n'ont pas de panneau rendu ; aucune console, aucun export, aucune vue de recherche n'énumère les pièces d'une note.
3. **L'ordre de préséance ne tranche pas.** Le CDC décrit le panneau — « liste des fichiers, taille, type, téléchargement » (`M04.7`) — sans donner aucune valeur, et `docs/arbitrages.md` n'a jamais abordé le sujet.

### Pourquoi aucun lot ne peut le fermer

- **Semer un chiffre recopié du libellé** — 1 258 291 octets pour « 1,2 Mo » — est la valeur illustrative que **`P-02`** proscrit, et `T-049` a déjà refusé ce geste.
- **Semer des octets engendrés** donnerait une taille réelle et mesurée, mais **elle contredirait celle que la maquette affiche à côté** : le corpus cesserait d'être le corpus du gel. C'est pourquoi `src/lib/fichiers/engendrer.ts` sert les épreuves et **jamais la semence**, et le dit dans son en-tête.
- **Inventer onze noms** est un comblement au sens de `CLAUDE.md` §2.

La table compte donc toujours zéro ligne, `lireNotes()` rend le décompte **réel** et non celui du jeu, et la lacune reste chiffrée à chaque exécution.

### Ce que le commanditaire a à trancher

> **Les treize pièces jointes du corpus doivent-elles être données en DONNÉES — nom, nombre d'octets, type de média pour chacune — ou le corpus doit-il ramener les décomptes `pj` à zéro ?**

Toute réponse est un **regel** : les décomptes vivent dans le corpus embarqué des maquettes, et les deux noms dans le balisage de V-14. Tant qu'elle n'est pas donnée, la lacune reste ouverte et la batterie reste rouge d'un point — **c'est le comportement voulu**.

**Ce que la réponse débloquerait, et qui est prêt :** le panneau de pièces de V-14 rendu depuis la base plutôt que transcrit du gel ; la matrice de `pnpm test:etancheite`, dont le paramètre `{fichier}` est aujourd'hui vacant faute d'une seule pièce en base ; et l'archive d'export, qui emporte désormais les octets qu'on lui donne.
