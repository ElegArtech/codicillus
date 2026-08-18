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

> **Précision du 18 août 2026, sur constat de maquette.** Une première application de cet
> arbitrage plaçait V-41 à `/console/bibliotheque`. C'était une sur-lecture, et elle contredisait
> une maquette gelée : les six vues de console rendent toutes un fil
> `["Accueil", "Console", "<section>"]`, tandis que **les quatre vues de bibliothèque rendent
> `["Accueil", "<nom>"]`** — premier niveau, sans segment « Console » (`V-41:5069`, `V-38:2898`,
> `V-39:3166`, `V-40:3636`). Les maquettes disent donc que ces vues ne sont pas *dans* la console.
>
> L'énoncé du commanditaire — « ça doit renvoyer vers la console et ça doit être un rôle des
> admins » — se satisfait intégralement sans les contredire : la console **y renvoie**, elle ne
> les **contient** pas. Les deux contraintes tiennent ensemble, il n'y avait rien à arbitrer.

**Ce que ça emporte.**
- L'adresse de V-41 est **`/bibliotheque`**, au premier niveau — conforme au fil d'Ariane que la
  maquette rend. Le point d'entrée est dans la navigation de la console, qui porte le lien.
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
## ARB-004 — `n-doc-barman` est une note interne
**18 août 2026** — répond à ÉCART-005.

**Décision.** `Interne`. Le corpus de V-09 (palette), qui la déclare `Publique`, est un état
antérieur et fautif.

**Motif.** Une note interne rendue publique contredit le périmètre que V-01 à V-04 posent à leur
point d'entrée, et `RG-M17-01`. Surtout : le corpus de la palette exposerait la note à un compte
sans droit interne, et **la comparaison visuelle validerait la fuite** — un état où le dispositif
de vérification certifie le défaut est pire que l'absence de vérification.

**Ce que ça emporte.** `seeds/corpus.ts` retient `Interne` ; l'écart est déclaré dans
`ECARTS_CONNUS` et vérifié à l'identique — le test échoue si l'écart disparaît, change de valeur,
ou si un nouveau apparaît. La batterie 6 (étanchéité) traite cette note comme interne, sur toutes
les routes et pour tous les personas.

---

## ARB-005 — Articulation du refus indiscernable et de l'état « sans droit »
**18 août 2026** — répond à la contradiction relevée entre `RG-ACC-04` et `RG-M18-03`.

> **Correction de référence, 18 août 2026.** La première rédaction citait `RG-M18-02`. C'est
> faux : `RG-M18-02` porte sur les notifications — non bloquantes, empilables, auto-effacées.
> L'état « sans droit » est le **quatrième état de zone de `RG-M18-03`**. La substance de
> l'arbitrage est inchangée ; seule la référence était erronée. Erreur héritée de la rédaction
> d'ADR-007, qui la porte aussi.

**Décision.** La lecture posée par `ADR-007` est validée. Les deux règles ne s'appliquent pas au
même objet :

| Régime | Portée | Comportement |
|---|---|---|
| **Indiscernable** (`RG-ACC-04`) | résolution d'une **ressource entière** — une adresse | Refus et inexistence produisent une réponse identique : corps, en-têtes, code, **et temps de réponse**. Un seul chemin de code. |
| **État « sans droit »** (`RG-M18-03`, quatrième état de zone) | une **zone** dans une page que l'utilisateur a le droit d'ouvrir | L'existence de la ressource porteuse lui est déjà connue : la signaler ne révèle rien. |

**Règle de tranchage.** Le contrat de tâche décide ; à défaut, **le régime indiscernable
l'emporte**. Le doute ne se résout jamais en faveur de l'information révélée.

**Ce que ça emporte.** La batterie 6 vérifie l'indiscernabilité sur la résolution d'adresse, y
compris **temporelle** — un écart de latence est une fuite. Le rôle `verificateur-acces`, qui est
adversarial par construction, éprouve nommément la frontière entre les deux régimes : c'est là
qu'une erreur d'implémentation se logera.

**Manque de couverture nommé, non résolu.** Aucune batterie ne mesure aujourd'hui
l'indiscernabilité temporelle. À outiller au lot T-011.

---

## ARB-006 — Errata du cadrage, sans modification des sources
**18 août 2026** — répond aux affirmations fausses relevées dans `cadrage/`.

**Décision.** Les corrections sont validées, et elles vivent dans `docs/errata-cadrage.md`.
`cadrage/` **n'est pas modifié**.

**Motif.** Éditer les sources gelées pour y corriger des faits détruirait la propriété qui rend
tout le dispositif opposable : leur immutabilité et leur diffabilité. Un errata daté, tracé à
l'arbitrage qui le valide et lu par tout agent depuis `CLAUDE.md`, produit le même effet
contraignant sans coûter le verrou. Les sources restent ce qu'elles étaient au gel ; l'errata dit
ce qui, depuis, s'est révélé faux.

**Ce que ça emporte.** `docs/errata-cadrage.md` fait autorité sur `cadrage/` pour les seuls points
qu'il énumère, et sur rien d'autre. Toute nouvelle correction y entre par un arbitrage numéroté.

---

## ARB-007 — Trois routes mineures
**18 août 2026** — répond à A-04, A-05, A-06 (`docs/routes.md`).

- **A-04 — pas de cartographie publique.** L'espace public compte quatre vues, et la planche de
  V-19 n'offre aucun profil anonyme. `RG-M09-02` ne l'impose pas explicitement ; l'implémenter
  serait un comblement.
- **A-05 — `/guides/{identifiant}` est servi tel quel à un utilisateur connecté.** Une seule
  adresse, un seul rendu. Conserve la vérification « voir ce que voit le public », qui est un
  usage réel, et évite une seconde adresse sans canonique ou un état hors planche — donc hors
  protocole de comparaison.
- **A-06 — le paramètre `?noeud=` est ajouté** à l'état de cartographie porté par l'adresse. Le
  point dur n° 5 du brief fait de la sélection un **état durable** (« focus persistant au clic,
  jamais éphémère au survol ») : un état durable qui ne survit pas au partage de l'adresse n'est
  pas durable.

**Ce que ça ferme.** A-04, A-05, A-06. `docs/routes.md` n'a plus de section « à arbitrer ».

---

## ARB-008 — pnpm 11
**18 août 2026.**

**Décision.** La ligne 11 est actée (11.22.0 en place). `STACK-TECHNIQUE.md §3` retient la ligne
10 ; c'est le document qui est mis à jour, pas l'environnement rétrogradé. Aucune incidence : les
propriétés recherchées — gestion stricte des dépendances, auditabilité de la chaîne (C-11) — sont
celles de la ligne 10 comme de la 11. Consigné à l'errata.
