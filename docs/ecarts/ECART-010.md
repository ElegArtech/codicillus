# ÉCART-010 — Résidu de T-007, cinq points — 18 août 2026

## É-1 — La liste des vues visées par `RG-M18-13` n'est écrite nulle part
**Gravité moyenne. Arbitrage attendu avant la vague 4 de la phase 1.**

`RG-M18-13` nomme deux **cas d'usage** — « chercher », « lire » —, pas des vues. Aucune source du
dépôt n'en donne la liste : ni le cahier des charges, ni le brief, ni `DESIGN.md` §4.5, ni
`routes.md`.

Le banc retient **V-02, V-03, V-08, V-09, V-14**, dérivés de la fonction que `routes.md` §3
attribue à chaque vue, V-09 étant par ailleurs la seule maquette portant un état « Petit écran —
360 px » (`V-09:740`).

**C'est une dérivation raisonnée, pas une lecture**, et elle a une conséquence mesurable : elle
décide quelles vues sont contrôlées sur **quatre fenêtres** au lieu d'une. Aujourd'hui 5 vues sur
41, soit 112 couples de captures sur 364 — près d'un tiers de l'effort de vérification.

Deux candidats ont été écartés, et le sont discutablement :
- **V-01**, l'accueil public, qui porte un champ de recherche — donc le cas d'usage « chercher ».
- **V-37**, la coquille, qui porte le rail escamotable — mécanisme central de `RG-M18-12`, et
  siège des deux défauts E-01/E-02 relevés au plan §11.

Le second est le plus gênant : la coquille est portée par 35 vues sur 41. Ne pas la contrôler aux
quatre fenêtres laisserait sans preuve la règle même dont le plan dit qu'elle était enfreinte.

## É-2 — Deux des trois familles de zones masquées n'ont aucun support dans les maquettes
**Gravité faible. Aucune action.**

`PLAN §4.2` prescrit de masquer « temps de réponse de recherche, horodatages relatifs à la minute,
identifiants générés ». Relevé sur les 41 maquettes :

- **temps de réponse de recherche** : aucune maquette n'en affiche, sous aucune forme ;
- **horodatages à la minute** : ils existent (`V-17:2666`, `V-18:2950`, « enregistré à HH:MM »)
  mais seulement **après une action d'enregistrement qu'aucune position de planche ne déclenche**,
  et sont de toute façon neutralisés par le gel de l'horloge ;
- **identifiants générés** : une seule occurrence attestée, le mot de passe temporaire de V-32.

`verif/masques.json` ne porte donc **qu'une entrée**. C'est le bon comportement : inventer des
masques pour des zones qui n'existent pas reviendrait à créer des angles morts par anticipation.
**Un masque est une renonciation à vérifier** ; il s'ajoute sur constat, jamais par précaution.

## É-3 — Divergences d'inventaire entre `verif/scenarios/` et `docs/routes.md` — **tranché**
**`verif/scenarios/` fait foi.** 265 états contre 268.

| Vue | routes.md | scénarios | Cause |
|---|---|---|---|
| V-03 | 5 | 4 | `routes.md` compte la case `c-op` comme deux positions ; l'extraction compte une déviation du défaut. La même règle appliquée à V-14 donne pourtant 11 des deux côtés — **`routes.md` n'est pas homogène avec lui-même** |
| V-06 | 8 | 7 | `routes.md` ajoute « + succès », qui n'est pas un contrôle de la planche |
| V-07 | 10 | 9 | **`routes.md` annonce 10 et en énumère 9** — incohérence interne |
| V-08 | 8 | 7 | **annonce 8, énumère 7** — idem |
| V-39 | 20 | 21 | `routes.md` ne compte pas la case `c-anim`, qui change pourtant le rendu |

Deux divergences structurelles s'y ajoutent : le §9 de `routes.md` déclare 47 états côte à côte
mais en énumère 51, et 221 états de planche quand la somme des positions réellement présentes dans
les 37 planches en donne 210.

**Motif de la décision.** `verif/scenarios/` est extrait mécaniquement des planches, il est
rejouable (`pnpm scenarios:verifier`), et c'est **ce que la commande exécute**. Le critère de
sortie de chaque lot — « conforme sur tous les états » — doit désigner un ensemble unique et
opposable ; trois des cinq divergences sont d'ailleurs des erreurs d'arithmétique de `routes.md`,
pas des désaccords de fond.

`routes.md` s'aligne. Son avertissement `ECART-009 c)` ne nommait que V-03, V-08 et V-39 :
**V-06 et V-07 y manquaient.**

## É-4 — Un contrôle dont l'effet dépend de l'historique n'est pas un état capturable
**Gravité faible. Comportement retenu.**

`c-vider` de V-38 (« tout refermer ») n'a d'effet que sur une pile de notifications déjà
constituée. Capturé depuis un chargement propre — la seule règle qui rende un état reproductible
par l'application —, il rend l'écran nominal. Le banc le capture ainsi et **le déclare**.

L'alternative — enchaîner deux positions de planche — ferait dépendre le résultat de l'ordre de
parcours. Un banc dont le verdict dépend de l'ordre dans lequel il travaille est un banc qui ment.

## É-5 — Le volet `app` des 265 états est vide
**Ce n'est pas un défaut, c'est une déclaration.**

Aucune vue applicative n'existe. Les 41 fichiers portent l'emplacement du volet, sa forme et son
mode d'emploi. `--contre=app` **refuse de s'exécuter et le dit**, plutôt que de sortir en 0 sans
rien prouver — c'est la différence entre une batterie honnête et un faux témoin (RA-01).

Chaque lot de vue renseignera `app` — persona, adresse, données — avec sa route à l'appui, avant
de lever le garde-fou.

## Six vues portent des états côte à côte, pas quatre — correction d'E-03

`PLAN §4.1`, l'errata `E-03` et le contrat de T-007 n'en nommaient que quatre : V-09, V-35, V-40,
V-41. **V-38** (quatre types de notification dans `#types`) et **V-39** (vingt vignettes dans
`#vides`, `#squelettes`, `#erreurs`) en portent aussi — **et** une planche. Le banc les traite en
régime mixte. `routes.md` §3.7 les comptait d'ailleurs déjà ainsi.
