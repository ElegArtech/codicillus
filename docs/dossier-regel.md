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

**À ce jour, aucun point ne les satisfait.**
