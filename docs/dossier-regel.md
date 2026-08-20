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

**Un point les satisfait, depuis le 20 août 2026. Il est ci-dessous.**

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
