# ÉCART-009 — Résidu de T-006b, six points — 18 août 2026

## a) `RG-M18-02` citée pour l'état « sans droit » — **corrigé**

`RG-M18-02` porte sur les **notifications** — non bloquantes, empilables, auto-effacées après
quelques secondes pour les succès, persistantes jusqu'à action pour les erreurs. L'état « sans
droit » est le **quatrième des quatre états de zone de `RG-M18-03`**.

Erreur née à la rédaction d'ADR-007, propagée à ARB-005 puis à `docs/routes.md`. Les trois sont
corrigés ; la substance n'était pas affectée, seule la référence l'était. Sans correction, tout
contrat citant `RG-M18-02` pour un état de zone aurait cité une règle qui parle d'autre chose —
et l'agent d'exécution aurait implémenté des notifications là où on attendait un état vide.

**Ce que ça dit du dispositif** : une référence fausse se propage silencieusement, parce qu'elle
*ressemble* à une référence juste. Seule une relecture croisée l'attrape. C'est le vérificateur
de spec qui l'a trouvée, pas l'auteur — la règle « celui qui écrit ne vérifie pas » vient de payer.

## b) L'adresse de la bibliothèque contredisait une maquette gelée — **réconcilié**

Voir ARB-002, précision du 18 août. Les six vues de console rendent
`["Accueil", "Console", "<section>"]` ; les quatre vues de bibliothèque rendent
`["Accueil", "<nom>"]`. Les maquettes disent donc que ces vues ne sont pas dans la console.

L'énoncé du commanditaire se satisfait sans les contredire : la console **y renvoie**, elle ne les
**contient** pas. Adresse retenue : **`/bibliotheque`**, premier niveau, rôle administrateur,
point d'entrée dans la navigation de la console.

L'exécutant a eu raison de refuser de décider du fil rendu : c'eût été un comblement contre une
source gelée. C'est le premier cas où le protocole d'écart fonctionne comme prévu — l'agent
s'arrête et déclare au lieu de choisir.

## c) `routes.md` et `verif/scenarios/` divergent sur trois décomptes — **à réconcilier**

V-03 (5 contre 4), V-08 (8 contre 7), V-39 (20 contre 21). Deux dérivations de la même source
n'aboutissent pas au même ensemble d'états.

**L'enjeu n'est pas cosmétique** : le critère de sortie de chaque lot de phase 1 est
« `verif:maquette V-xx` conforme sur **tous** les états ». Si « tous » ne désigne pas le même
ensemble selon le document lu, le critère est ambigu — et un lot pourrait se clore en ayant
couvert un état de moins.

**Traitement** : `verif/scenarios/` fait foi, parce qu'il est extrait mécaniquement des planches
et qu'il est ce que la commande exécute. `routes.md` s'aligne. À faire à la clôture de T-007,
lorsque les scénarios seront figés — les réconcilier maintenant, sur un fichier en cours
d'écriture, produirait un alignement faux.

## d) Rendu conditionné au rôle sur des lots sans lentille adversariale — **assumé, borné**

ARB-002 impose un rendu conditionnel au rôle (P-09, ADR-011) sur T-101 (coquille) et T-103
(bibliothèque), classés moyenne et basse — donc sans vérificateur adversarial, qui n'échoit qu'à
T-116 et T-117.

**Décision : la criticité n'est pas relevée**, et le motif tient à ce que la phase 1 livre. Dans un
squelette statique, il n'existe **aucun droit réel** : le « profil administrateur » est un état de
planche, pas une frontière de sécurité. Ce que la phase 1 doit prouver, c'est que l'état existe et
qu'il rend juste — ce que la comparaison de rendu établit.

**Mais le report est nommé** : la conformité de P-09 comme propriété de sécurité — une action
interdite n'est **pas dans le DOM**, ni grisée ni masquée — relève de la batterie 7 et des lots
T-011 et T-016, en criticité haute, avec lentille adversariale. Aucun lot de phase 1 ne peut la
déclarer tenue.

La règle est respectée dans les deux sens : la criticité ne se relève pas à l'humeur, et elle ne
se baisse pas non plus au motif qu'un lot « a l'air simple ».

## e) Indiscernabilité temporelle — **rappel, déjà assigné**

Nommée par ARB-005, assignée à T-011. T-116 ne peut la vérifier qu'en rendu, donc pas du tout.
Aucun lot de phase 1 ne déclare `RG-ACC-04` tenue.

## f) Retrait de `domaines` et `bibliotheque` des identifiants réservés — **confirmé**

La réservation d'un segment n'a de sens que s'il occuperait une place de route. `/domaines/…`
n'existant plus (ARB-001), et `bibliotheque` étant désormais un segment de premier niveau non
ambigu, la conséquence est saine. Elle découle des arbitrages, sans en ajouter.
