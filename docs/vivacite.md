# Vivacité des notes

La vivacité est calculée pour chaque registre, Référence et Opérationnel. Elle n'est pas un état
figé enregistré dans la base : elle évolue avec la date d'observation et les vérifications.
L'implémentation est dans `src/lib/fraicheur.ts` ; le code conserve le nom `fraicheur`.

## Données du cycle

- La date de dernière vérification du registre, si une vérification existe.
- La date de modification, utilisée pour le calcul lorsqu'il n'a jamais été vérifié.
- La durée de validité propre au registre.
- L'éventuelle demande de révision active.
- La date courante et les seuils configurés pour l'instance.

Par défaut, la validité est de 90 jours en Référence et 21 jours en Opérationnel. Les seuils sont
10 jours avant échéance, 14 jours de retard pour « À revoir », et 90 jours de retard pour « Obsolète ».
La console permet de modifier les réglages de l'instance.

## Calcul

L'échéance est la date de départ du cycle plus la durée de validité. Le nombre de jours restants
est calculé en jours civils dans le fuseau du produit.

| Condition, dans cet ordre | État |
|---|---|
| Une révision est demandée | À revoir |
| Plus de 10 jours avant échéance | À jour |
| De 10 jours avant échéance jusqu'au jour d'échéance inclus | Bientôt à vérifier |
| De 1 à 13 jours de retard | À vérifier |
| De 14 à 89 jours de retard | À revoir |
| Au moins 90 jours de retard | Obsolète |

Ce tableau utilise les seuils par défaut. À l'écran, les dates de vérification et d'échéance
accompagnent le signal. Un registre jamais vérifié l'indique explicitement, même si son état
est calculé depuis sa modification.

## Vérification et agrégats

Vérifier relance le cycle du registre concerné et lève sa demande de révision. Le second registre
reste indépendant. Avec une validité très courte ou des seuils modifiés, le nouvel état est celui
donné par le calcul ; il n'est pas forcé artificiellement à « À jour ».

Les vues d'ensemble agrègent les registres Référence des notes accessibles. La consultation d'une
note affiche la vivacité du registre choisi. Les droits continuent de déterminer les notes qui
entrent dans les listes et les agrégats.
