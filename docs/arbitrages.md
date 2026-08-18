# Arbitrages rendus

Registre des décisions du commanditaire. Seule source d'autorité au-dessus de l'ordre de
préséance quand les documents de cadrage se contredisent ou se taisent.

Format : décision, ce qu'elle emporte, et ce qu'elle **ferme** — c'est-à-dire ce qu'aucun agent
d'exécution n'a plus à demander.

---

## ARB-001 — Unicité de l'univers, et suppression de la forme raccourcie
**18 août 2026, révisé le même jour** — répond à A-01 (`docs/routes.md`), gravité haute.

> **Révision.** Une première rédaction étendait l'unicité à l'identifiant de domaine et qualifiait
> `RG-M03-02` d'erreur du cahier des charges. Le commanditaire a corrigé : l'amalgame venait de la
> rédaction de la question, pas de la règle. `RG-M03-02` est cohérente et n'est pas fautive.

**Décision, en deux volets.**

1. **L'univers porte une contrainte d'unicité bloquante.** Deux univers ne peuvent pas porter le
   même nom ; le refus est une règle métier appliquée à l'écriture, pas un contrôle d'affichage.
2. **Le domaine n'en porte aucune au-delà de son univers.** Deux univers différents peuvent
   parfaitement contenir un domaine homonyme — « Infrastructure » dans *Production* et dans
   *Support* sont deux domaines distincts et légitimes.
3. **La forme raccourcie `/domaines/{domaine}` n'est pas implémentée.** Seule l'adresse canonique
   `/univers/{univers}/{domaine}` existe. Le produit n'émet jamais de forme raccourcie : la clause
   d'ambiguïté de `RG-M03-02` n'a donc aucun déclencheur.

**Ce que ça emporte.**
- Contrainte d'unicité sur le nom d'univers, au schéma — criticité haute.
- **Aucune** contrainte d'unicité globale sur l'identifiant de domaine. L'unicité y est *par
  univers*.
- `/domaines/{quoi-que-ce-soit}` rend la page non trouvée (V-26), déjà maquettée, par le chemin
  de code unique d'ADR-007 — refus et inexistence indiscernables.
- **Aucune maquette manquante.** Le régime assisté n'a pas à être rouvert.
- `RG-M03-02` clause 1 (adresse canonique incluant l'univers) : tenue. Clause 2 (redirection et
  désambiguïsation) : **sans objet**, faute de forme raccourcie à rediriger. À consigner comme
  telle, jamais à implémenter.
- La console des univers (V-27) refuse la création d'un doublon avec un message explicite.
- Sans effet sur la recherche : les résultats affichent l'arborescence, qui distingue déjà deux
  domaines homonymes sans mécanisme supplémentaire.

**Ce que ça ferme.** A-01, et la question de la vue manquante avec elle.

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
