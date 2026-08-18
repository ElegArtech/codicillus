# Arbitrages rendus

Registre des décisions du commanditaire. Seule source d'autorité au-dessus de l'ordre de
préséance quand les documents de cadrage se contredisent ou se taisent.

Format : décision, ce qu'elle emporte, et ce qu'elle **ferme** — c'est-à-dire ce qu'aucun agent
d'exécution n'a plus à demander.

---

## ARB-001 — Désambiguïsation de domaine : supprimée par contrainte d'unicité
**18 août 2026** — répond à A-01 (`docs/routes.md`), gravité haute.

**Décision.** Il n'y a pas d'écran de désambiguïsation, parce qu'il n'y a pas d'ambiguïté
possible : l'unicité est une **règle métier bloquante**, garantie à l'écriture. La clause de
`RG-M03-02` prescrivant de « demander à l'utilisateur de choisir » est une **erreur du cahier des
charges** — elle traite un cas que le modèle de données doit rendre inatteignable.

**Ce que ça emporte.**
- Contrainte d'unicité sur le nom d'univers (énoncé du commanditaire).
- Contrainte d'unicité **globale** sur l'identifiant de domaine — *extension nécessaire, voir
  ci-dessous*.
- La forme raccourcie `/domaines/{domaine}` résout toujours vers un domaine et un seul : elle
  redirige en 308 vers `/univers/{univers}/{domaine}`. Aucun troisième comportement.
- Aucune maquette manquante à produire. Le manque relevé en A-01 se dissout.
- La console des domaines (V-28) et celle des univers (V-27) refusent la création d'un doublon
  avec un message explicite, jamais un renommage silencieux.

**Extension appliquée, à confirmer.** L'énoncé porte sur le nom d'**univers**. Or le cas
d'ambiguïté visé par `RG-M03-02` est « même identifiant de **domaine** dans deux univers » :
l'unicité des noms d'univers seule ne le ferme pas. L'unicité globale de l'identifiant de domaine
a donc été retenue en plus — c'est elle qui rend la désambiguïsation structurellement impossible
et qui valide la forme raccourcie. Contrainte de schéma, criticité haute : signalée pour
confirmation explicite.

**Ce que ça ferme.** A-01. Plus aucun agent n'a à traiter le cas ambigu ni à inventer l'écran.

---

## ARB-002 — La bibliothèque de composants est une vue de console, réservée aux administrateurs
**18 août 2026** — répond à A-02 (`docs/routes.md`).

**Décision.** « Concepteur et développeurs » du brief est un vestige de rédaction : la population
visée est celle des **administrateurs**. V-41 est une vue de console, atteignable depuis la
console, sous rôle administrateur.

**Ce que ça emporte.**
- L'adresse de V-41 passe sous l'espace de noms de la console.
- L'entrée correspondante apparaît dans la navigation de la console — et **n'apparaît pas** pour
  les autres rôles : une action interdite n'est pas rendue (P-09, ADR-011).
- V-41 reste une **page réelle** de l'application, jamais une maquette morte : c'est là que la
  divergence du système visuel devient visible immédiatement (risque R-06).
- V-38, V-39 et V-40 restent des **catalogues transverses**, non des routes : ils documentent des
  composants employés partout. Leur présentation suit le même régime d'accès que V-41.

**Ce que ça ferme.** A-02. Le décompte des routes livrées est arrêté.

---

## ARB-003 — Le journal des imports est un module de console administrateur
**18 août 2026** — répond à A-03 (`docs/routes.md`).

**Décision.** V-35 est et reste une vue de console réservée aux administrateurs. Le renvoi du
contributeur vers V-35, écrit au brief de V-24, est l'erreur.

**Ce que ça emporte.**
- Le contributeur reçoit son rapport **dans son propre parcours d'import**, à l'étape 4 de V-24
  — progression puis rapport —, qui le porte déjà. Il n'a jamais besoin de la console.
- V-35 est le journal **transverse** des imports de l'instance : périmètre administrateur.
- Aucune route de rapport d'import n'est exposée hors console.

**Ce que ça ferme.** A-03. Le brief V-24 est corrigé de fait par cet arbitrage ; le lien qu'il
décrit ne sera pas implémenté.
