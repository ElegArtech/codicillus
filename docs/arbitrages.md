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

---

## ARB-009 — Les vues contrôlées sur quatre fenêtres
**18 août 2026** — répond à `ECART-010` É-1.

**Décision.** Sept vues, et non cinq. Aux cinq dérivées par le banc — V-02, V-03, V-08, V-09,
V-14 — s'ajoutent **V-37** et **V-01**.

**Motif.** `RG-M18-13` nomme deux cas d'usage, « chercher » et « lire », et aucune source du dépôt
n'en donne la liste de vues : la dérivation initiale était raisonnée, pas lue.

- **V-37, la coquille** : portée par 35 vues sur 41, elle porte le rail escamotable — mécanisme
  central de `RG-M18-12` — et elle est le siège des défauts E-01 et E-02 relevés au `PLAN §11`,
  qui portaient précisément sur le comportement en petite largeur. L'omettre laisserait sans
  preuve **la seule règle dont le cadrage documente qu'elle avait été enfreinte**.
- **V-01, l'accueil public** : porte un champ de recherche, donc le cas d'usage « chercher ».

**Ce que ça emporte.** Le contrôle aux quatre fenêtres — 1440×900, 1024×768, 768×1024, 360×780 —
passe de 5 à 7 vues. `verif/banc/conditions.mjs` porte la liste et sa justification. La liste est
en **écriture humaine seule** : un agent bloqué sur un rouge en petite largeur n'en retire jamais
une vue. C'est le cas d'école du contournement de vérification (`PLAN §12`).

**Ce que ça ferme.** `ECART-010` É-1.

---

## ARB-010 — Le petit écran n'a pas de navigation arborescente, et c'est assumé
**18 août 2026** — arbitrage délégué à l'orchestrateur par le commanditaire. Répond à `ECART-011` É-6.

**Le conflit.** `BRIEF-VUES.md §V-37` exige, sur petit écran, une navigation *« masquée par défaut,
ouverte par un bouton, refermée après sélection »*. La maquette gelée ne l'implémente pas :
`@media (max-width:1240px){ .rail{display:none} }` est **inconditionnel**, sans contre-règle sur
`[data-rail="ouvert"]`. Vérifié : aucun tiroir, aucune superposition, aucune navigation de
remplacement ; le bouton `#bascule-rail` bascule bien l'attribut, le CSS l'ignore. Un script
referme même le rail d'autorité en dessous de 900 px (`V-37:3224`).

**Décision.** La maquette est implémentée **telle quelle**. Sous 1240 px, l'arborescence est
inatteignable.

**Motif.** L'ordre de préséance ne laisse pas le choix : *Maquettes > Cahier des charges > Brief*.
Et l'alternative n'est pas ouverte à un agent : dessiner un tiroir serait un comblement, et il
échouerait de toute façon au banc, qui compare au gel. **Ce que la maquette ne montre pas
n'existe pas.**

**Ce que ça emporte, et qu'il faut lire sans adoucissement.**
`RG-M18-12` (« utilisable de 360 px ») et `RG-M18-13` sont **partiellement non tenues** sur l'axe
navigation. Ce qui reste atteignable sous 1240 px : le fil d'Ariane, le champ de recherche de la
barre supérieure, les liens du contenu. Ce qui ne l'est pas : l'arbre des univers, domaines et
dossiers.

**Aucun lot ne déclarera `RG-M18-12` ni `RG-M18-13` tenues.** C'est une interdiction de conclure,
au même titre que celles de `P-09` et `RG-ACC-04` : la batterie de conformité sera verte — elle
mesure la fidélité au gel — et la règle restera non satisfaite. Un vert ne vaut jamais
satisfaction d'une exigence que la référence elle-même n'honore pas.

**La voie de correction, si elle est voulue.** Le régime assisté : produire un V-37 corrigé hors
dépôt, le geler, mettre `mockups/GEL.md` à jour. Geste du commanditaire, pas session d'exécution.
Le correctif est mince — une contre-règle sur `[data-rail="ouvert"]` sous 1240 px, plus un voile de
fermeture — mais il n'appartient pas à un agent de l'écrire.

**Effet de bord à connaître.** Sous 1240 px, `rail-ouvert` et `rail-ferme` rendent le même écran :
trois des huit états de V-37 deviennent indiscernables deux à deux sur trois des quatre fenêtres.
« 32 couples conformes » ne signifie donc pas « 32 rendus distincts prouvés ».

---

## ARB-011 — L'état « chargement » rend la notification, pas la minuterie
**18 août 2026** — arbitrage délégué. Répond à `ECART-011` É-7.

**Le conflit.** L'état `chargement` de V-37 fait apparaître un rouet sur une branche **et** une
notification qui vit 2 600 ms. Le banc n'avançant l'horloge que de 1 000 ms, la notification est
dans la capture. La reproduire semblait exiger une minuterie, donc de la logique — que le temps 3
du protocole UI interdit en phase 1.

**Décision.** Le squelette rend **l'état**, jamais la transition. En mode démo, l'état `chargement`
affiche la notification et le rouet **statiquement** : c'est ce que la référence montre à l'instant
capturé. Aucune minuterie n'est écrite.

**Motif.** Une capture est un instant, pas un film. Ce que la maquette montre à cet instant est un
DOM, et un DOM se rend sans horloge. La confusion venait de lire « notification qui s'efface après
2 600 ms » comme un comportement à implémenter, alors que le seul fait opposable est : *à cet état,
cette notification est visible.*

**Ce que ça emporte.** L'effacement automatique — 3 200 ms pour un succès, 6 000 ms pour une
information, persistance jusqu'à action pour une erreur (`RG-M18-02`) — est du **comportement**, et
relève de T-102 puis de T-017. Aucun lot de phase 1 ne le déclare tenu.

---

## ARB-012 — L'état « vide » de V-37 est un défaut de maquette, neutralisé par la conformité par zone
**18 août 2026** — arbitrage délégué. Répond à `ECART-011` É-8.

**Le conflit.** À l'état `vide`, le rail annonce « aucun domaine ne vous est accessible » pendant
que le tableau de bord affiche 18 notes, 2 révisions, 1 jamais vérifiée, 299 consultations et une
répartition sur 18 — `rendreBord()` n'étant pas rejoué après le vidage du corpus. Le reproduire,
c'est afficher des indicateurs sans données, **contre P-02**, l'un des dix principes non
négociables, et faire rougir la batterie 8. Ne pas le reproduire, c'est diverger du gel.

**Décision.** Le conflit ne se tranche pas : il **disparaît**. La conformité de V-37 est déclarée
par zone — `aside.rail` et `header.barre`, la coquille proprement dite. Le tableau de bord n'est
pas dans les zones comparées.

**Motif.** V-37 **n'est pas une route** : `docs/routes.md` la classe parmi les six vues sans adresse
propre. C'est un catalogue de la coquille, comme V-41 l'est des composants. Le tableau de bord
qu'elle embarque est le contenu de V-07, la note de démonstration celui de V-14 — chacun couvert
par son propre lot, sur sa propre maquette, où il est cohérent. Comparer page entière une vue qui
n'existe à aucune adresse était l'erreur de départ.

**Ce que ça emporte.** L'incohérence reste **dans la maquette** : ni corrigée, ni propagée,
consignée ici. La question de fond — que montre le tableau de bord sur un corpus vide — est
tranchée par la maquette de V-07, qui porte son propre état « aucune note », et par la batterie 8
au lot correspondant.

**Garde-fou, sans lequel la conformité par zone est une échappatoire.** La liste des zones est en
**écriture humaine seule**, comme les tolérances et les masques ; le rapport nomme les zones
comparées à chaque exécution ; une vue sans déclaration de zones est comparée **page entière**, par
défaut. Un agent bloqué sur un rouge ne restreint jamais une zone — c'est le contournement de
vérification que `PLAN §12` nomme.

---

## ARB-013 — Les adresses sont retirées de la comparaison de structure
**18 août 2026** — arbitrage délégué à l'orchestrateur. Répond à `ECART-013` É-5.

**Le conflit.** Le niveau 1 du banc compare l'instantané ARIA, qui imprime `/url: "#"` pour chaque
lien. Les liens de l'implémentation doivent porter les adresses de `docs/routes.md`. Toute adresse
réelle fait donc **échouer la structure**, en échec sec et sans tolérance.

Conséquence si rien n'est décidé : **le produit devrait porter des liens morts pour rester
conforme.**

**Décision.** Les lignes `/url:` sont retirées de l'instantané avant comparaison. Le reste du
niveau 1 — rôles, repères, noms accessibles, hiérarchie des titres, ordre des blocs nommés — est
comparé sans aucune tolérance, comme avant.

**Motif, et il est de fait, pas de confort.** Les 41 maquettes gelées ne portent **aucune
liaison** : sur 681 attributs `href` des fichiers de vue, **681 valent `#`**. Zéro lien inter-vue.
C'est un artefact du régime assisté — chaque vue a été produite isolément, la liaison n'était pas
dans son périmètre (`ECART-003`) — et non une décision de conception. La référence imposerait au
produit un défaut qu'elle ne tient elle-même que par accident de fabrication.

**Ce n'est pas un trou de vérification.** L'autorité sur les adresses est `docs/routes.md` :
dérivation tracée, chaque route justifiée par une source citée, arbitrée par ARB-001, ARB-002,
ARB-003 et ARB-007. C'est elle qui les vérifie, et la batterie 6 (étanchéité) les éprouve
persona par persona. Le banc vérifie le rendu ; il n'a jamais eu à vérifier le routage.

**Portée strictement bornée.** Seules les lignes `/url:` sont retirées. Toute autre réduction du
niveau 1 est un contournement de vérification (`PLAN §12`), et `verif/banc/capture.mjs` reste en
écriture humaine seule.

---

## ARB-014 — Les états de zone : la page entière servie, la même zone isolée des deux côtés
**19 août 2026** — arbitrage délégué à l'orchestrateur. Régularise `ECART-012` point 6 et
`ECART-014` É-1.

**Le manque.** Six vues — V-09, V-35, V-38, V-39, V-40, V-41 — présentent leurs états **côte à
côte** dans la page : 55 états qui ne sont pas des variantes d'un même écran, mais des zones
distinctes. Le régime `app` n'avait aucun protocole pour les atteindre, et refusait en code 2.

**Décision. La zone comme sélecteur.** L'application sert la **page entière** à
`/__design/V-xx?etat=cle`, dans la condition où la zone est montrable, et le banc y isole **la même
zone** que du côté maquette : même sélecteur, même rang, **même code**.

**Motif — trois propriétés, dont deux rendent l'autre voie fausse et non seulement moins
commode.**

1. **Le rang n'a de sens que dans la page.** Un état de zone est un couple sélecteur + rang
   (`dialog.dlg` n° 9, `#vides .vignette` n° 7). Hors de l'ordre du document complet, un rang ne
   désigne rien.
2. **Le contexte de mise en page fait la géométrie.** Les vingt vignettes de V-39 tirent leur
   largeur de `grid-template-columns`, donc du nombre de leurs voisines. Rendue seule, une vignette
   n'a pas les mêmes dimensions : on comparerait deux objets différents en croyant mesurer un
   écart.
3. **Rien n'est rédigé à la main.** Sélecteur et rang viennent de `verif/extraire-scenarios.mjs`,
   et `pnpm scenarios:verifier` le prouve en régénérant.

**La voie écartée — le rendu isolé.** Le mode démo ne rendrait que la zone demandée. Elle rompt la
symétrie du protocole : référence découpée dans sa page, candidat servi comme fragment sans page.
Elle rend le rang indéfinissable, donc exige une table clé → fragment **rédigée à la main de 55
lignes**, qui dériverait au premier regel. Elle ferait juger au niveau 1 un arbre ARIA amputé quand
le niveau 2 mesurerait un fragment sans contexte. Et surtout elle mettrait **l'implémenteur en
charge du découpage par lequel il est mesuré** — la faute nommée en `ECART-011` É-1.

**Ce que ça emporte.** Déclaration dans `verif/references/protocole-app.json`, bloc
`etats_de_zone`, **écriture humaine seule**, six vues nommées, chacune avec son obligation et son
motif. Le rapport nomme les zones à chaque exécution. **Une vue non déclarée reste refusée en code
2** — vérifié sur une copie du dépôt privée de la déclaration de V-40.

**Étalonnage : 76 couples, 55 états de zone isolés, 0 écart.** Vérifié indépendamment par
l'orchestrateur.

---

## ARB-015 — Le gabarit de coquille est rouvert, pour un amendement borné
**19 août 2026** — arbitrage délégué. Répond à `ECART-015` É-1 et É-2.

**Le problème.** Le gabarit livré par T-101 est gelé depuis sa clôture (DAG K-10). Deux manques
apparus au lot suivant :

- `Coquille.svelte` rend `<main id="contenu">` **sans classe et sans moyen d'en passer une**. Or
  **33 maquettes sur 35** à coquille portent `<main class="…">` — `doc`, `travail`, `lecture`,
  `editeur`, `carto`, `tdb`. Chaque lot devrait redéclarer le cadre pour poser une classe.
- La coquille n'expose que des notifications **texte** (`readonly string[]`). V-38 exige les quatre
  types avec marque, corps, titre, détail, fermeture, progression, actions, et `role="alert"` pour
  l'erreur. **Le catalogue qui définit le composant de notification ne peut pas alimenter la zone
  que la coquille pose.**

**Décision. Le gel est levé pour un amendement borné, puis reposé.**

Périmètre exact, et rien d'autre : une propriété de classe sur `<main>`, et un jeu de notifications
typé conforme au catalogue de V-38. Aucune autre modification de `src/lib/coquille/`.

**Motif.** Le gel de K-10 existe pour **empêcher la dérive**, pas pour sanctuariser une interface
incomplète découverte au deuxième lot. La lettre du gel conduisait ici à l'inverse de son
intention : 33 vues auraient dupliqué le cadre pour contourner un manque de trois lignes, et la
duplication est exactement la dérive que le gel visait.

T-102 a eu raison de **ne pas y toucher et de déclarer** — c'est ce qui rend cet arbitrage
possible au bon niveau.

**Ce que ça emporte.** Un lot dédié, **T-101b**, criticité moyenne. Il ne fait que l'amendement, ne
touche aucune vue, et **regèle** à sa clôture. V-38, V-39 et V-40 sont ensuite ramenées sur le
gabarit amendé, leur cadre local retiré. Le regel vaut pour la suite : aucune autre ouverture sans
arbitrage numéroté.

---

## ARB-016 — Un style en ligne identique au gel est prouvé par le gel
**19 août 2026** — arbitrage délégué. Répond à `ECART-015` É-3. **Portée : les 41 vues.**

**Le problème.** 62 constats `verif:jetons`, dont 49 P-1.7, tous sur des **styles en ligne que la
maquette gelée porte elle-même** : les sceaux colorés des quatre types de V-38, la géométrie des
esquisses de chargement de V-39, les boutons destructifs de V-40. Aucun n'est décoratif — les
retirer déplace le rendu.

C'est `ECART-011` É-2 d'un cran plus loin : **P-6.3 a renversé la contrainte pour le bloc
`<style>` porté, il ne couvre pas les styles en ligne du balisage porté.** La même contradiction,
au même endroit, pour la même raison.

**Décision. La même résolution, étendue au balisage — et bornée de la même façon.**

Un attribut `style="…"` d'un composant de vue est admis **si et seulement si la même valeur figure
dans la maquette gelée de cette vue**. Le contrôle est mécanique : les valeurs de `style` du fichier
gelé forment un ensemble clos, et tout `style` de `src/vues/V-xx.svelte` doit y appartenir. Hors de
cet ensemble, P-1.7 s'applique intégralement.

**Ce qui rend la règle sûre.** On ne peut pas inventer un style : il faut qu'il soit déjà dans le
gel. La contrainte est donc, comme P-6.3, **plus stricte que P-1** — « présent dans la référence »
implique et dépasse « n'emploie que des jetons ». Et elle n'ouvre aucune fenêtre : un style absent
du gel reste un écart, quelle qu'en soit la justification.

**Ce que l'exécutant n'a pas fait, et qu'il faut saluer.** Il n'a pas déplacé ces littéraux dans un
fichier `.ts` pour les soustraire à l'analyseur — et il écrit que **ça aurait marché**. C'est
exactement le contournement de vérification de `PLAN §12`. Il l'a nommé au lieu de l'emprunter.

---

## ARB-017 — Le dialogue modal est révélé par le banc, des deux côtés
**19 août 2026** — arbitrage délégué. Répond à `ECART-015` É-4. **Bloquait V-40, dix états sur dix.**

**Le problème.** Côté maquette, le banc clique l'entrée du catalogue et `showModal()` place le
`dialog` dans la couche supérieure : `position: fixed; inset: 0`, zone **1440×900**, avec son
`::backdrop`. Côté application, la vue rend le dialogue avec l'attribut `open` — qui **n'est pas**
`showModal()` : le dialogue reste `position: absolute` à sa position statique, la zone fait
**1440×901**, et le voile n'existe pas. Verdict sur les dix : dimensions divergentes.

La couche supérieure **ne s'atteint pas déclarativement**. Et l'hydratation est du temps 3, interdit
en phase 1 (ARB-011).

**Décision. Le banc révèle le dialogue, des deux côtés, par un code unique** — déclaré dans
`verif/references/protocole-app.json`, en écriture humaine seule.

**Motif.** Le principe est déjà posé et éprouvé : `ECART-014` É-3 a établi que **le geste appartient
au banc, pas au candidat** — c'est ainsi que le clic des déclencheurs a été traité, après que
`element.click()` eut produit 33 % de pixels divergents. La modalité est le même cas : une
condition de capture, pas un comportement à implémenter.

Exiger de l'application qu'elle entre en modalité, ce serait exiger du JavaScript d'un squelette
statique — donc contredire ARB-011 pour satisfaire une mesure. **L'instrument s'adapte au régime de
la phase, il ne le dicte pas.**

> **Rectification, 19 août 2026 — `ECART-023` É-2. Cet arbitrage était écrit sur un seul cas.**
>
> La reproduction de la modalité « pointeur » valait pour V-40, dont la référence tient sa modalité
> d'un **vrai clic du banc**. Mais **quinze des seize autres états modaux s'ouvrent sur un `change`
> synthétique** : aucun pointeur ne touche leur référence, qui **affiche donc l'anneau de
> focalisation**. Livrer l'appui au seul candidat le lui retirait — **308 pixels** sur `V-27`
> `sup-systeme` et `sup-ok`, exactement le chiffre relevé sur V-40, **dans l'autre sens**.
>
> Corrigé : la modalité de la référence est **déduite mécaniquement** de la présence d'un
> déclencheur. La formulation juste du principe est **« on reproduit la modalité de la référence,
> on n'en impose pas une »** — et elle n'était pas la mienne : j'avais généralisé un cas
> particulier en règle. Neuf vues portent des états modaux, non une.

**Ce qui est déjà acquis sur V-40, et qui rend la décision sûre** : le niveau 1 est **vert sur les
dix états**, et le DOM des dix boîtes est **identique caractère pour caractère** à la référence —
vérifié par diff, aux seules différences de sérialisation près. Le contenu est juste ; seule la
surface capturée diffère. On ne masque pas un écart de fond : on corrige un artefact de mesure.

---

## ARB-018 — Le seuil de conformité du régime « app » est zéro
**19 août 2026** — arbitrage délégué à l'orchestrateur. Répond à `ECART-017` É-2.
**Portée : les 41 vues, et tout le reste du projet.**

**Le fait.** Quatre états de V-40 étaient déclarés **conformes** à 4 380, 4 746, 2 884 et 18 pixels
divergents — sous le seuil de 0,5 % du `PLAN §4.2`. Leur cause n'était pas du bruit de rendu.

> **Correction d'attribution, 19 août 2026 — `ECART-020` É-2.** La première rédaction nommait
> « un bloc `.contexte` posé sur `--c-papier` là où la référence le pose sur `--c-accent-voile` ».
> **Le couple de jetons était juste, l'élément était faux**, et T-102b l'a établi en décodant les
> captures : `.contexte` n'apparaît que dans `d-restaurer`, **qui était déjà conforme**, et aucune
> règle `.contexte` ne pose de fond nulle part.
>
> La cause réelle est l'**anneau de focalisation** —
> `.saisie:focus { box-shadow: 0 0 0 3px var(--c-accent-voile) }` (`src/socle.css:422`). La maquette
> focalise le premier contrôle à l'ouverture (`showModal()` puis `focus()` sur
> `.saisie, .selecteur, .btn--principal`) ; le squelette n'ayant pas de script, la focalisation
> retombait sur le bouton de fermeture. **Exactement les trois boîtes dont la cible est une
> `.saisie` ou un `.selecteur` produisaient des pixels** — `d-dossier`, `d-reviser`, `d-relation`.
>
> **La décision d'ARB-018 n'est pas affectée** : un défaut réel passait bien sous la tolérance, et
> le resserrement est ce qui l'a fait remonter. Seule l'attribution était fausse. Elle est corrigée
> ici parce qu'une leçon attachée à un diagnostic invérifiable ne vaut rien — et parce que c'est le
> deuxième diagnostic de ma main que le recomptage d'un exécutant corrige.

**Le dispositif certifiait un défaut.** C'est l'état que `PLAN §12` désigne comme strictement pire
que l'absence de dispositif : une batterie verte qui ne prouve rien désarme la vigilance.

**La décision. Le seuil de conformité passe à zéro, comme en à-blanc.**

**Le motif est empirique, pas doctrinal.** Le seuil de 0,5 % supposait un harnais bruité —
antialiasing, sous-pixel, variance de fonderie. **Le nôtre n'en a pas**, et c'est démontré :

| Mesure | Couples | Pixels divergents |
|---|---|---|
| Étalonnage à blanc, 41 vues | 409 | **exactement 0** |
| V-37 contre son implémentation | 32 | **exactement 0** |
| V-38 | 6 | **exactement 0** |
| V-39 | 21 | **exactement 0** |

Cinquante-neuf couples de comparaison **réelle** entre une application et sa maquette, à zéro
pixel. Le zéro n'est donc pas un idéal, c'est le comportement observé du dispositif.

**Il s'ensuit qu'en régime « app », un pixel divergent n'est jamais du bruit.** C'est toujours une
différence réelle. Le seuil n'absorbait pas de la variance : il absorbait des défauts.

**Ce qui est conservé.** Le niveau 3 demeure : un écart irréductible reste arbitrable par un agent
dédié, sur pièces. Mais il est désormais **visible et compté** au lieu d'être silencieusement
absorbé — c'est précisément la propriété qui manquait. Le taux de recours reste l'indicateur de
dérive du protocole (`PLAN §14`, point 5). L'échec sec au-delà de 3 % est inchangé : passé ce
seuil, aucun arbitrage n'est recevable.

**Effet immédiat, vérifié** : les quatre états de V-40 remontent en recours au niveau 3, la
commande sort en 1, et **V-37, V-38, V-39 tiennent le seuil zéro sans une retouche**.

**Sens du geste.** `verif/references/tolerances.json` est en écriture humaine seule, et un agent
bloqué sur un rouge n'y touche jamais. Ce resserrement va dans la seule direction jamais suspecte :
il **durcit** le critère. Élargir eût demandé un arbitrage bien plus lourd que celui-ci.

---

## ARB-019 — Second amendement borné du gabarit : le lien d'évitement
**19 août 2026** — arbitrage délégué. Répond à `ECART-016` É-3.

**Le problème, relevé mécaniquement par T-101b.** La cible du lien d'évitement **n'est `<main>` que
dans 22 des 34 maquettes à coquille**. Douze visent une ancre *intérieure* au contenu —
`#resultats` (V-08), `#liste` (V-12, V-21, V-22), `#article` (V-14, V-15), `#zone` (V-16),
`#redaction` (V-17, V-18), `#liste-noeuds` (V-19), `#adresse` (V-23), `#rech` (V-26) — et **onze
vues portent un libellé autre** que « Aller au contenu » : « Aller à la bibliothèque » (V-41),
« Aller à la rédaction », « Aller aux résultats », « Aller à la comparaison », « Aller à la liste
des nœuds »…

Le gabarit lie aujourd'hui `href` à `idContenu`, ce qui est exact pour les 22 concordantes et faux
pour les douze autres.

**Décision. Le gel est levé une seconde fois, pour un périmètre aussi étroit que la première.**

Deux propriétés, et rien d'autre : la **cible** du lien d'évitement, et son **libellé**. Défauts
inchangés — `#{idContenu}` et « Aller au contenu » — pour ne rien casser des quatre vues livrées.
Puis regel.

**Motif.** Le lien d'évitement est le **premier nœud focalisable de chaque page** : il est dans
l'instantané ARIA que le niveau 1 compare en échec sec, et il porte une exigence d'accessibilité
réelle (`RG-M18-08`, P-06), pas une décoration. Un libellé faux n'est pas un écart de rendu, c'est
une régression d'accessibilité que le banc signalerait à juste titre.

**Pourquoi maintenant.** V-41 est le prochain lot (T-103) et fait partie des douze : son lien dit
« Aller à la bibliothèque » et vise `#corps`. Attendre, c'est faire buter le lot ou le laisser
dupliquer le gabarit — ce que le premier amendement visait précisément à empêcher.

**Ce que ça emporte.** Un lot dédié **T-101c**, criticité basse, qui n'amende que ces deux
propriétés, ne touche aucune vue au-delà de la preuve de non-régression, et **regèle** à sa
clôture. Les quatre vues livrées doivent rester à zéro pixel : c'est le critère.

**Sur la répétition.** C'est le deuxième amendement d'une ressource gelée en deux lots. Ce n'est
pas le gel qui est mal posé : c'est l'interface du gabarit qui se découvre au contact des vues, et
elle continuera. La discipline qui tient est celle-ci — **jamais d'écriture opportuniste dans la
ressource gelée, toujours un arbitrage numéroté, un périmètre écrit, une preuve de non-régression,
un regel.** Trois lots successifs s'y sont tenus.


---

## ARB-020 — Converger vers le gel n'est jamais une dérive
**19 août 2026** — arbitrage délégué. Répond à `ECART-020` É-4.

**Le problème.** Le gabarit de coquille est gelé, et deux divergences avec la maquette y ont été
relevées en passant par un lot qui n'avait pas le droit d'y écrire : les `.menu-barre` ne portent
pas `data-ouvert="non"` que le gel pose, et les SVG des menus ne sont pas enveloppés du
`<span style="line-height: 0">` dont le gel les entoure. Aucun effet de rendu mesuré, aucune
batterie ne les nomme.

Faut-il un arbitrage numéroté pour chaque correction de ce genre ? Trois amendements en trois lots
donnaient la réponse par l'absurde : le gel deviendrait un frein administratif là où il doit être
un garde-fou.

**Décision. Le gel interdit de *diverger* du gel ; il ne peut pas interdire d'y *converger*.**

Une correction qui rapproche une ressource gelée de sa maquette — attribut manquant, enveloppe
absente, ordre de nœuds — **ne demande pas d'arbitrage numéroté**. Elle demande trois choses, toutes
vérifiables :

1. La divergence est **constatée contre le gel**, pas contre un jugement — le fichier de maquette
   et la ligne sont cités.
2. La correction est **prouvée sans effet de rendu**, ou avec l'effet attendu : comparaison de DOM
   avant/après, état par état, et les batteries de toutes les vues portant la ressource.
3. Elle est **déclarée** au rapport de lot, comme n'importe quelle écriture en ressource gelée.

**Ce qui reste soumis à arbitrage numéroté**, sans exception : tout ajout d'**interface** — une
propriété, un contrat, un comportement — c'est-à-dire tout ce qui ne se lit pas dans le gel. C'est
ce qu'ARB-015 et ARB-019 ont couvert, et la distinction est nette : l'un **corrige** vers la
référence, l'autre **ajoute** ce que la référence ne dit pas.

**Le risque, et sa parade.** Un agent pourrait qualifier de « convergence » une modification de
confort. La parade est le point 1 : la ligne du gel est citée, ou il n'y a pas de convergence.
Un agent bloqué sur un rouge ne « converge » jamais vers quelque chose que la maquette ne montre
pas.

---

## ARB-021 — Les deux formes de coquille, et l'amendement unique du gabarit
**19 août 2026** — arbitrage délégué. Répond à `ECART-022` É-1 à É-5. **Portée : 27 vues.**

**Le fait, et personne ne l'avait vu.** Les 34 maquettes à coquille portent **deux formes** :

- la forme **complète** — 8 vues, dont **les 4 déjà livrées** : menus déroulants, pictogrammes de
  rail, `#rail-univers`, `Gestion` conditionné au rôle ;
- la forme **abrégée** — **26 vues** : barre sans menus, rail sans pictogrammes ni `data-vers`,
  `Gestion` en `si-ecriture`, **arborescence de 15 nœuds écrite au balisage** — que
  `sectionsDuRail(corpusPourVue(v))` ne peut pas produire, puisqu'il en rend 19 et que **les deux
  arbres ne sont pas emboîtés**.

Et les six classes `.menu-barre*` que le gabarit pose ne sont **déclarées par aucune des deux
feuilles** de ces 26 vues : la liste s'y afficherait dépliée.

**Décision. Un amendement unique, couvrant les cinq besoins d'un coup, puis regel.**

| | Amendement | Vues |
|---|---|---|
| A-1 | la coquille rend la forme **abrégée** ou complète | 26 |
| A-2 | les attributs de données de la vue sont transmis à `div.app` — ~~47~~ **46** attributs, 26 noms | 27 |
| ~~A-3~~ | ~~libellé du chevron~~ — **retiré : le constat était faux** (voir ci-dessous) | — |
| A-4 | loger une superposition rendue hors de `div.app` | 8 |
| A-5 | marquer l'entrée de rail courante | 1 |

**Motif du regroupement.** Trois amendements en trois lots ont déjà coûté trois arbitrages, trois
preuves de non-régression et trois regels — pour des besoins qu'un seul relevé aurait donnés
ensemble. C'est le défaut d'orchestration que ce lot corrige ; le répéter cinq fois de plus serait
l'aggraver en connaissance de cause.

**L'arborescence de la forme abrégée n'est pas dérivable du corpus** (É-2). Elle est **écrite au
balisage du gel**, et les deux arbres divergent. Elle se porte donc comme une donnée de vue, non
comme un calcul — et surtout **pas** en « corrigeant » `seeds/corpus.ts`, qui rend fidèlement ce que
les 41 maquettes portent.

> **Deux rectifications, 19 août 2026 — `ECART-022` É-1 et É-2.**
>
> **A-3 était faux, et l'appliquer aurait été une régression.** Mesuré au navigateur dans les
> conditions du banc : **V-14 rend trois nœuds ouverts et trois libellés « Déplier »**. La cause
> est que `element()` construit l'`aria-label` sur le dépliage mémorisé — **vide à tout chargement
> propre** —, puis la coquille déplie les ancêtres du nœud courant **sans toucher au libellé**. Le
> relevé avait déduit « Replier » d'un indicateur qui mesure l'*ouverture*, pas le *libellé*. Le
> gabarit écrivait déjà « Déplier » sans condition : **c'était juste**. En forme abrégée, le
> libellé vient du balisage. A-3 est entièrement absorbé par A-1.
>
> **A-2 porte 46 attributs, non 47** — le quarante-septième est celui de V-37, que le périmètre du
> relevé exclut. Les 26 noms sont exacts.
>
> **Cinquième et sixième constats transmis corrigés au recomptage.** Ils viennent cette fois d'un
> relevé *mécanique*, ce qui déplace la leçon : un chiffre produit par un instrument n'est pas
> davantage une source qu'un chiffre écrit à la main — **c'est son interprétation qui doit être
> vérifiée**. Ici, l'instrument mesurait juste ; la colonne qu'on lui a fait dire était la mauvaise.

**Critère, et il ne souffre aucune marge** : les 4 vues livrées restent à **zéro pixel**. Le seuil
est zéro (ARB-018).

---

## ARB-022 — La preuve par le gel s'étend aux ressources partagées
**19 août 2026** — arbitrage délégué. Répond à `ECART-021` (convergence bloquée) et `ECART-022` É-5.

**Le problème, rencontré deux fois.** `ARB-016` (P-6.4) n'accorde la preuve par le gel qu'aux
composants `src/vues/V-xx.svelte`. Conséquences mesurées :

- la convergence de `<span style="line-height: 0">` vers le gel a été **refusée** par son exécutant,
  bien que **mesurée gratuite** — l'enveloppe ne déplace rien —, faute de portée ;
- le gabarit écrit `flex: 0 0 auto` là où le gel écrit `flex: none`, et **rien ne l'a détecté**,
  P-6.4 ne couvrant pas `src/lib/`.

Le second cas est le plus parlant : la portée trop étroite ne protège pas, elle **aveugle**.

**Décision. La preuve par le gel s'étend aux ressources partagées dont la maquette de référence est
identifiable et déclarée.**

Pour le gabarit de coquille, la référence est **V-37** — l'instrument le sait déjà :
`ensembleDuGel('V-37')` contient `line-height:0`, précisément parce que `styles-en-ligne.mjs` lit
les styles posés par script.

**Ce qui ne change pas** : la valeur doit **figurer au gel** de la maquette de référence, sans quoi
P-1 s'applique en entier. On n'invente pas un style, on le prouve. Et le rattachement
ressource → maquette est déclaré dans un fichier en **écriture humaine seule** — un agent ne
choisit pas la référence contre laquelle il sera prouvé.

**Effet attendu** : la convergence refusée devient possible.

> **Rectification, 19 août 2026 — `ECART-022` É-4.** J'annonçais aussi que `flex: 0 0 auto`
> deviendrait visible. **C'est faux** : `flex` n'appartient pas aux propriétés contraintes de
> P-1.7. Étendre la portée ne le révèle pas ; il y faudrait une **seconde** modification
> d'instrument, à décider séparément.
>
> Et la prémisse elle-même était plus subtile que je ne l'avais écrite (`ECART-022` É-3) : le gel
> écrit bien `flex: none` **dans son littéral source**, mais le navigateur le sérialise en
> `flex: 0 0 auto` — ce que le gabarit écrivait déjà. La divergence était donc **de littéral, pas
> de rendu**. La convergence a été portée quand même, P-6.4 gouvernant les littéraux.
>
> Une règle qui rend un défaut détectable vaut toujours mieux qu'une règle qui l'ignore par
> prudence — mais encore faut-il ne pas se tromper sur le défaut qu'elle rend détectable.

---

## ARB-023 — Troisième amendement borné : l'enveloppe de contenu
**19 août 2026** — arbitrage délégué. Répond à `ECART-024` É-1. **Portée : 11 vues.**

**Le fait.** Le gabarit rend `<main>` en **enfant direct de `div.cadre`, sans frère**. **Onze
maquettes** intercalent un conteneur :

- **V-27 à V-36** — `div.cadre > div.console > (aside.nav2, main.travail#travail)` ;
- **V-41** — `div.cadre > div.biblio > (nav.sommaire-b#sommaire, main.corps-b#corps)`.

Ce sont des **grilles** : `.biblio` fait `208px minmax(0,1fr)`. Mesuré : le contenu de V-41 passe de
`480 / 936` à `272 / 1012` sans l'enveloppe, celui de V-27 de `492 / 948` à `248 / 1180`. À seuil
zéro, **les états divergent avant même la comparaison de pixels** — les découpes n'ont pas les mêmes
dimensions.

**Décision. Un amendement unique couvrant les onze vues, puis regel.** Deux propriétés : la classe
de l'enveloppe autour de `<main>`, et le nœud rendu dans l'enveloppe avant `<main>`.

**Pourquoi ni le relevé ni P-0 ne l'ont vu, et c'est la leçon.** Le contrôle d'amendements du relevé
fait six vérifications — forme, attributs de `div.app`, rail courant, superposition, chevron,
attributs de `<main>`. **Aucune ne regarde le parent ni les frères de `<main>`.**

C'est la **troisième occurrence** du même motif : `ECART-022` É-1 (le libellé du chevron déduit d'un
indicateur d'ouverture), `ECART-023` É-1 (l'état modal à déclencheur, que le relevé ne joue pas),
et celle-ci. À chaque fois **l'instrument mesure juste, et la colonne lue n'est pas la bonne**.

**La règle qui en découle, et qui vaut pour tous les relevés à venir** : un relevé ne prouve que ce
qu'il regarde. Sa valeur ne tient pas à sa mécanicité mais à **l'exhaustivité de ce qu'il
interroge** — et cette exhaustivité, elle, n'est pas mécanisable. Tout relevé doit donc énoncer ce
qu'il **ne** regarde pas, comme les sources d'étalonnage le font depuis `ECART-015`.

**Effet immédiat** : P-1 est arrêté au temps 1, P-2 est prévenu avant d'y buter. Les deux reprennent
au temps 2 sans rien réextraire.

---

## ARB-024 — La famille des notifications suit V-38, et V-06 demande un regel
**19 août 2026** — arbitrage délégué. Répond à `ECART-030` É-3.

**Le fait, et il contredit une de mes résolutions.** `ECART-007` a retenu le socle de V-07 comme
source unique, en écartant la seule divergence réelle — le composant de notification, refondu de
`flex` en `grid` entre l'état 401 et l'état 465 — au motif qu'elle était **inerte** : le conteneur
`.notifs` est vide dans les 41 vues, les notifications étant injectées au déclenchement.

**Elle ne l'est plus.** `V-06 cpt-inconnu` est **le seul état de tout le projet** qui rende une
notification hors de V-38 — et il a été gelé **avant** la refonte. Mesuré : **13 276 pixels**, soit
1,02 %. La bulle de la référence n'est pas bornée et tient sur une ligne ; celle de l'application est
plafonnée à 400 px et repasse à la ligne.

**Ce n'est pas un emboîtement partiel : les règles sont remplacées, pas étendues.** `.notif` passe
de `flex / gap:--e-3 / padding:--e-3 --e-4` à `grid / width:100% / padding:--e-3 --e-3 --e-3 --e-4`,
et `.notifs` gagne un `max-width` qu'elle n'avait pas. `docs/DESIGN.md` §0.2 écrit que le socle
retenu est « strictement plus riche » et « emboîté » : **pour cette famille, c'est faux**.

**Décision. La famille des notifications suit V-38**, et le raisonnement est celui d'`ECART-007`
lui-même : *une vue dont la notification n'est qu'un accessoire ne peut pas trancher contre la vue
qui la spécifie*. V-38 est la vue dont c'est le sujet.

**Conséquence, énoncée sans l'adoucir.** `V-06 cpt-inconnu` **ne peut pas être conforme**. Ce n'est
pas un défaut d'implémentation — l'exécutant a mesuré que rendre au candidat *les seules
déclarations que V-07 remplace* ramène l'écart à **zéro**. C'est une **divergence du gel avec
lui-même** : deux maquettes gelées à des dates différentes montrent le même composant autrement.

**La seule résolution propre est un regel de V-06** — régime assisté, hors dépôt, geste du
commanditaire. Aucun agent ne peut le faire, et aucun ne doit contourner.

**En attendant : V-06 n'est pas déclarée livrée.** Six de ses sept états sont conformes à zéro
pixel ; le septième est consigné au journal comme **recours au niveau 3 en attente d'arbitrage**,
non accordé. Une vue partiellement conforme n'est pas une vue livrée (`PLAN §4.3`), et je ne vais
pas faire une exception pour tenir un décompte.

**Ce que cet écart apprend, et qui vaut mieux que le cas.** `ECART-007` avait raison sur les faits
et tort sur la conclusion : « inerte » n'était vrai que **des états alors connus**. C'est
exactement la règle du piège **P-5** — *une règle qu'aucun cas n'exerce est une règle dont on ignore
si elle marche* — appliquée à une **divergence** plutôt qu'à un contrôle. Une divergence
qu'aucun état n'exerce est une divergence dont on ignore si elle est inerte.

---

## ARB-025 — V-20 recompose son enveloppe, et le gabarit n'est pas rouvert
**19 août 2026** — arbitrage délégué. Répond à `ECART-034` É-1.

**Le fait, vérifié.** `mockups/V-20-carto-type-maitre.html` pose **deux fois** l'identifiant `fil` :
sur `nav.fil` de la barre supérieure (`:1090`) et sur `div.fil-deroule` de la zone de graphe
(`:1129`). `getElementById` rendant le premier, **le fil déroulé par type maître écrase le fil
d'Ariane**, et `.fil-deroule` reste vide et masqué aux cinq états.

Balayage des 41 maquettes : **V-20 est la seule dans ce cas.**

**Décision. Le gabarit n'est pas rouvert ; V-20 recompose son enveloppe, bornée et déclarée.**

**Motif.** Trois issues existaient, et l'exécutant les a toutes nommées : écrire dans le gabarit —
interdit, il est regelé après cinq passages ; rendre un fil d'Ariane que la maquette ne montre pas —
comblement, et rouge au banc ; recomposer l'enveloppe dans la vue. Il a pris la troisième, en la
bornant : **`Rail.svelte` est emprunté tel quel** — le rail de V-20 est identique à l'octet à ceux
de V-19, V-21 et V-22 —, seules la barre supérieure et les trois nœuds d'enveloppe sont réécrits, et
**aucune règle de style n'est dupliquée**.

**Un sixième passage du gabarit pour une seule vue coûterait plus qu'il ne rapporte** : un arbitrage,
une preuve de non-régression sur 34 vues, un regel — pour un défaut qui n'existe qu'ici, et qui est
un **défaut de la maquette**, pas un manque d'interface.

**La borne, et elle reprend celle du recours au niveau 3.** Si une **seconde** vue exige cette
recomposition, elle cesse d'être un cas particulier et devient une propriété de l'interface :
l'amendement du gabarit devient alors obligatoire, et cette recomposition est reprise avec lui. Une
cause qui se répète n'est plus une exception.

**Ce qui reste ouvert.** Le double identifiant est un **défaut du gel** — il rend une zone de la
maquette morte. Il n'empêche pas la conformité, puisque les deux côtés le portent, mais il signifie
que **le fil déroulé par type maître n'est visible dans aucun état**. À verser au dossier des regels,
avec V-06 et V-08.

---

## ARB-026 — Les deux seuils sont posés, et ils ne peuvent que descendre

> **RÉTABLI le 19 août 2026, après réparation de l'instrument.** Le seuil est reposé sur le partage
> corrigé : **0 portage, 3 470 gel**, 20 lignes toutes `gel/…`. `pnpm test:a11y` est **vert**.
> La suspension qui suit est conservée pour mémoire.
>
> **SUSPENDU sur son volet accessibilité, le 19 août 2026 — `ECART-041`.** Le seuil a été posé en
> retirant 31 lignes `portage/…` dont T-060 a établi ensuite qu'elles sont du **gel** : la batterie
> 10 sur-discrimine sur une clé de rapprochement sensible aux blancs, que le compilateur Svelte
> élague d'un côté et pas de l'autre (P-8). Le fichier fige donc 31 fausses lignes. La batterie s'est
> par ailleurs révélée **non déterministe** (92 puis 95 sur un arbre identique). Le volet batterie 9
> — `--seuil-gel=173` — n'est **pas** concerné et reste en vigueur.
**19 août 2026** — arbitrage délégué. Répond à `ECART-039` et `ECART-040`.

**Décision.** `verif/references/a11y-seuil.json` est posé, et `pnpm test:etats` porte
`--seuil-gel=173`.

**Ce que le seuil admet, et ce qu'il refuse.** Les **3 439** lignes `gel/…` sont admises. Les **31**
lignes `portage/…` de la proposition ont été **retirées à la pose** : elles sont corrigeables par un
lot, et le lot T-060 les traite. La batterie 10 échoue donc aujourd'hui sur ces 31 exactement — c'est
le comportement recherché, pas un défaut de seuil.

**Ce que cela ferme.** Plus personne n'a à demander si une batterie rouge peut être intégrée. La
batterie 9 est verte, la 10 le sera quand T-060 rendra, et `pnpm verify` s'enchaîne.

**La borne, et elle est la seule chose qui empêche un seuil de devenir une amnistie.** Ce fichier
**descend, il ne monte pas.** Toute hausse est un défaut de lot, pas une mise à jour. Chaque ligne
`gel/…` est une **dette nommée** : elle tombe quand `ARB-027` est appliqué à la vue, ou quand la
maquette est regelée. Un seuil global aurait absorbé les dettes nouvelles en silence ; celui-ci
compte par règle **et** par nature.

---

## ARB-027 — L'application peut dépasser le gel sur ce qui ne peint aucun pixel
**19 août 2026** — arbitrage délégué. Répond à `ECART-039`, et lève 3 439 constats.

**Le fait.** La batterie 10 impute **3 439 violations d'accessibilité aux maquettes elles-mêmes** :
894 cibles de lien d'évitement non focalisables sur 34 vues, 629 graphiques sans alternative,
129 `treeitem` sans `role="tree"`, 80 jauges de témoin annoncées alors que `DESIGN.md` §3.7
l'interdit. Elles étaient réputées irréparables sans regel.

**Elles ne le sont pas, et le raisonnement tenait dans une confusion.** Les maquettes sont la loi
**de ce qu'elles montrent** — pixels, polices, icônes, disposition, libellés. Elles ne sont pas une
loi *interdisant* ce qu'elles ne montrent pas. Un `tabindex="-1"`, un `role`, un `aria-hidden`, un
`aria-controls`, une alternative textuelle hors flux **ne peignent aucun pixel** : les ajouter ne
fait diverger aucune vue de sa maquette au sens de la règle ultime.

**Décision. L'application PEUT porter un attribut d'accessibilité absent du gel, à trois
conditions cumulatives :**

1. **Il ne déplace aucun pixel.** Le niveau 2 du banc reste à zéro, sans exception ni tolérance.
   C'est vérifié à chaque lot, pas déclaré.
2. **Une règle du projet l'exige nommément** — `RG-M18-07` à `RG-M18-11`, `P-06`, ou une
   interdiction explicite de `docs/DESIGN.md`. Pas « ce serait mieux » : une règle citée.
3. **Il est énuméré**, vue par vue et attribut par attribut, dans un fichier de référence en
   écriture humaine seule. Le banc le lit pour tolérer l'asymétrie **exactement là où elle est
   déclarée**.

**L'asymétrie n'est autorisée que dans un sens : ajouter.** Retirer un attribut que le gel porte,
ou en changer la valeur, reste rouge — sans quoi la déclaration deviendrait une porte ouverte.

**Ce que cela ne ferme pas, et qui reste au commanditaire.** Les **707** violations de contraste
changent des couleurs : elles peignent des pixels, elles sont hors de cette décision. Elles restent
au dossier des regels, seules.

---

## ARB-028 — V-06 rend la notification que V-06 montre — révision d'ARB-024
**19 août 2026** — arbitrage délégué.

**Ce qu'ARB-024 avait décidé.** La famille des notifications suit V-38, et V-06 « demande un
regel ». Conséquence : **13 276 pixels d'écart**, le seul des 409 couples, et V-06 non livrée.

**Pourquoi c'était le mauvais sens.** ARB-024 a fait primer une doctrine de réalisation — *une seule
définition de composant* — sur une maquette gelée. L'ordre de préséance dit exactement l'inverse :

```
Maquettes  >  Cahier des charges  >  Brief des vues  >  Pile technique  >  Plan de réalisation
```

Et la règle ultime porte sur **chaque vue, dans chacun de ses aspects**. V-06 montre une bulle non
bornée qui tient sur une ligne : **c'est la loi de V-06.**

**Décision. V-06 rend sa propre notification**, telle que sa maquette l'écrit. `docs/DESIGN.md` est
amendé en conséquence : la famille des notifications a **deux états gelés**, celui de V-38 et celui
de V-06, et le composant porte une variante déclarée — il n'est pas recopié.

**Ce que cela ferme.** Le dernier écart visuel du projet. **409 couples sur 409**, aucun recours au
niveau 3.

**Ce qui reste vrai d'ARB-024.** Le constat était juste et la mesure exacte : les deux maquettes
divergent, et la refonte `flex` → `grid` a bien eu lieu entre deux états du socle. Seule la
résolution est renversée.

---

## ARB-029 — La forme compacte du libellé entre dans la fabrique unique
**19 août 2026** — arbitrage délégué. Répond à `ECART-038` É-1.

**Le fait.** V-14 écrit « il y a 6 j » là où `libelleFraicheur` produit « Vérifié il y a 6 jours ».
Deux lectures s'affrontaient : tenir `P-01` coûte 44 couples, tenir le gel laisse un libellé
construit localement.

**Les deux perdent, parce que la question était mal posée.** `P-01` exige **une seule
implémentation**, pas **un seul libellé**. Le gel porte manifestement deux formes — la longue, que
sa fabrique produit ; la compacte, qu'il écrit dans le panneau « Position ». Transcrire les deux
dans l'implémentation unique **tient les deux règles à la fois**.

**Décision.** `libelleFraicheur(note, forme)` admet `'longue'` (défaut, inchangée) et `'compacte'`.
La forme compacte sort **du même niveau et de la même ancienneté** que la longue : ce n'est pas un
second calcul, c'est un second rendu du même calcul. Aucune vue n'écrit de libellé de fraîcheur en
dur, et `pnpm verif:fraicheur` retrouve **zéro constat**.

**La borne.** La forme compacte s'emploie **là où le gel l'emploie**, et nulle part ailleurs :
aujourd'hui les deux voisines du panneau « Position » de V-14. Un troisième site l'emploierait sans
qu'aucune maquette ne le montre : ce serait un comblement.

---

## ARB-030 — V-08 dérive sa carte de résultat de V-02
**19 août 2026** — arbitrage délégué. Répond à `ECART-033`.

**Le fait.** `mockups/V-08-recherche.html` appelle `trier()` et `carte()`, qui n'existent pas ;
`rendre()` lève sur les sept états. La recherche connectée n'a donc **aucune maquette de résultat**.

**Elle en a une, et elle est gelée.** `V-02-recherche-publique.html` est la recherche **publique**,
sa maquette fonctionne, et elle rend ses résultats. C'est la même fonction, pour un autre public.

**Décision. La carte de résultat de V-08 est celle de V-02**, augmentée des seuls éléments que V-08
montre par ailleurs dans son balisage statique et que le public n'a pas — les facettes, le compteur,
le sélecteur de tri. Le reste de V-08 — enveloppe, filtres, barre — est déjà porté et conforme :
**seule la zone de résultats était vide.**

**Pourquoi ce n'est pas un comblement.** Le comblement, c'est inventer ce qu'aucune source ne
montre. Ici deux maquettes gelées montrent la même liste de résultats pour deux publics ; en déduire
la seconde depuis la première est le *travail de cohérence* que le commanditaire a demandé dès le
départ, et il est vérifiable : la carte de V-08 doit être identique à celle de V-02 au jeton près.

**Ce qui reste au dossier.** La maquette de V-08 reste cassée dans le dépôt, et `verif:maquette`
restera vert sur sa zone de résultats vide **des deux côtés**. C'est le cas d'école de « ce qu'un
vert ne dit jamais » : la conformité de V-08 ne prouve rien sur ses résultats, et le contrat de tout
lot touchant V-08 doit le rappeler.

---

## ARB-031 — La page d'indisponibilité dérive de V-04
**19 août 2026** — arbitrage délégué. Répond à `RG-NF-10`, sans maquette.

**Décision.** L'écran d'indisponibilité reprend la composition de `V-04-non-trouvee-public.html` —
même enveloppe, même bloc centré, même hiérarchie typographique —, avec le message et l'action que
`RG-NF-10` prescrit. Aucune forme nouvelle n'est inventée : une page d'erreur pleine page existe et
est gelée.

**La borne.** Cet écran n'entre pas au banc : il n'a pas de maquette de référence, donc rien à
comparer. Il est couvert par la batterie 14 (dégradation), et sa conformité au socle par
`pnpm verif:jetons`. **Ne pas le déclarer « conforme au gel » : il ne l'est pas, il en dérive.**

---

## ARB-032 — Les états de zone non maquettés dérivent de ceux qui le sont
**19 août 2026** — arbitrage délégué. Répond à `ECART-040`, et lève 173 couples.

**Le fait.** Le point dur n° 9 — « chaque zone est maquettée dans ses quatre états » — n'est pas
tenu par le gel : **173 couples zone × état sur 252** manquent, dont 112 sur la seule coquille.
L'erreur est la grande absente.

**Décision. Une zone dont le gel ne montre pas un état le rend quand même**, en reprenant le
composant que le gel emploie **ailleurs** pour ce même état : `.panneau--erreur` pour l'erreur,
`.vide` et `.palette__etat` pour le vide, `.rouet` pour le chargement. Le vocabulaire est celui de
l'inventaire fermé de `docs/DESIGN.md` ; **aucune classe nouvelle n'est créée**.

**Pourquoi cela ne casse rien.** Le banc ne compare que les états **déclarés** dans
`verif/scenarios/V-xx.json`, extraits mécaniquement des planches. Un état que le gel ne montre pas
n'a pas de couple : le rendre n'expose aucune surface à la comparaison. La conformité des 409
couples est intacte.

**La borne, et elle est stricte.** L'état dérivé emploie **le composant du gel, sans le modifier** —
même balisage, mêmes classes, mêmes jetons. Inventer une forme d'erreur propre à une zone serait le
comblement que le contrat interdit. Et `V-39` ne démontrant **aucun** état « sans droit », celui-ci
reste hors de cette décision : il relève de `P-09`, donc de l'**absence** du nœud, donc de la
batterie 7 — il n'y a rien à rendre.

---

## ARB-033 — Le contraste : la précédence tranche, et ce qui reste se mesure
**19 août 2026** — arbitrage délégué. Répond au dernier point du dossier des regels.

**J'avais posé une question là où l'ordre de préséance avait déjà répondu.** Les maquettes priment
sur le cahier des charges. Là où le gel porte un contraste sous 4,5:1, `RG-M18-07` **n'est pas
tenue**, et ce n'est pas une décision en attente : c'est une conséquence de la loi du projet. Les
707 occurrences sont une **dette nommée**, pas une question ouverte.

**Ce que la mesure a établi ensuite, et qui change la nature du problème.** L'exemple type de la
batterie est `#93a2a6` sur `#fcfbf8` — soit **`--c-encre-4` sur `--c-papier`**, à 2,55:1.

Le socle documente lui-même la méthode, dans un commentaire daté du 16/08/2026, **avant le gel** :

> `--c-encre-3` — *« assombri le 16/08/2026 : #71838a ne donnait que 2,75:1 sur le fond creux, là où
> RG-M18-07 exige 4,5:1 pour un texte de 11 px. Teinte conservée, contraste porté à 4,54:1 au pire
> des quatre surfaces. »*

**La méthode est reproductible, et je l'ai reproduite** : mes calculs rendent 2,76:1 et 4,54:1, aux
mêmes bornes. Appliquée à `--c-encre-4` à teinte constante, elle donne **`#526064`**, 4,56:1 au pire
des quatre surfaces.

**Et c'est précisément ce qui prouve qu'il ne faut pas l'appliquer.** `#526064` est à un point de
`--c-encre-3` (`#536066`) : les deux encres deviendraient indistinguables. **Une quatrième encre qui
ne se distingue pas de la troisième n'est plus une encre, c'est un doublon.**

**Décision, en deux volets.**

1. **`--c-encre-4` n'est pas assombri.** Son rôle est écrit au socle : *« désactivé, placeholder »*.
   **WCAG 1.4.3 exempte nommément les composants d'interface inactifs** de toute exigence de
   contraste. Là où ce jeton habille un élément réellement inactif, **il n'y a pas de violation** —
   axe ne peut pas savoir que l'élément l'est.
2. **Ce qui n'est pas exempt est un défaut réel, et il se mesure — il ne se demande pas.** Là où
   `--c-encre-4` habille du texte **actif**, la règle est violée, et la réparation est connue sans
   qu'aucune teinte ne soit inventée : employer `--c-encre-3`, qui est conforme sur les quatre
   surfaces. Cela déplace des pixels, donc cela demande un regel — mais **de quelques sites nommés,
   pas de seize vues**.

**Ce que cela ferme.** Plus personne ne demande « que faire des 707 ». La suite est un lot de
mesure : partager les 707 entre *exempt par 1.4.3* et *défaut réel*, site par site. Tant que ce
partage n'est pas fait, **le chiffre de 707 ne veut rien dire** — c'est un compte d'occurrences
d'axe, pas un compte de défauts.

---

## ARB-034 — Le fil déroulé de V-20 est entièrement spécifié par sa propre maquette
**19 août 2026** — arbitrage délégué. Ferme le point 2 du dossier des regels.

**J'avais écrit : *« aucune maquette ne montre à quoi il ressemble rempli »*. C'est faux, et il
suffisait de lire le fichier.**

`mockups/V-20-carto-type-maitre.html` **construit le fil déroulé lui-même**, et le décrit
complètement :

| Où | Quoi |
|---|---|
| l. 869–883 | la feuille — `.fil-deroule`, `.fil-deroule button`, son survol, `__sep`, `__courant` |
| l. 2934–2948 | le constructeur — `fil-deroule__courant`, `fil-deroule__sep` de `textContent "›"` |
| l. 1129 | le conteneur, `id="fil"`, `hidden` |

Rien ne manque : les classes, le séparateur, la graisse du courant, le fond du survol. **Le fil n'est
pas non spécifié, il est spécifié et inatteignable** — le double `id="fil"` d'ARB-025 fait rendre
l'autre nœud à `getElementById`.

**Décision.** V-20 rend le fil déroulé **tel que son propre constructeur le produirait**, lu au
balisage et à la feuille du gel. Aucune forme n'est inventée, aucune source n'est empruntée à une
autre vue.

**La borne.** Le nœud reste `hidden` dans les états où le gel le laisse `hidden` — le banc compare
les états déclarés, et le fil n'y est visible dans aucun. Ce lot rend la zone **vivante**, il ne la
rend pas **visible** là où le gel la masque.

---

## ARB-035 — Les trois entrées attendues ne bloquent rien, et n'ont jamais rien bloqué
**19 août 2026** — arbitrage délégué. Ferme le point 4 du dossier des regels.

Le plan §15.2 attend trois choses du commanditaire. **Je les avais présentées comme des attentes ;
elles sont des précisions, et chacune a un comportement par défaut déductible.**

| Attendu | Ce qui se déduit, et se construit sans l'attendre |
|---|---|
| **Le périmètre de la v1** | Le cahier des charges **est** le périmètre. En l'absence de retrait explicite, v1 = le cahier intégral. Un retrait ultérieur soustrait ; il ne se devine pas à l'avance |
| **Un échantillon du patrimoine** | Les formats sont nommés au cahier (traitement de texte, tableur, PDF, texte, liens web). Le convertisseur se construit contre les **formats**, pas contre un échantillon, et se valide sur des pièces synthétiques jusqu'à ce qu'un échantillon réel arrive. Il n'en sera que mieux éprouvé |
| **Un relais SMTP** | `P-10` l'impose déjà : *dégradation, jamais panne*. Le produit doit fonctionner **sans** relais — donc le comportement sans relais est le cas nominal à construire, et le relais est une configuration, jamais une dépendance |

**Décision.** Aucun lot n'attend ces trois entrées. Elles sont des paramètres, pas des préalables.
Le dossier des regels ne les porte plus.

---

## ARB-036 — Les quatre divergences relevées par T-010, et une lecture qui n'était pas la bonne
**19 août 2026** — arbitrage délégué. Répond à `T-010` É-7.

T-010 a relevé quatre divergences entre le cahier des charges et les maquettes, et les a toutes
tranchées par l'ordre de préséance. **Trois sont justes ; la quatrième repose sur une contradiction
qui n'existe pas.**

| Point | Cahier | Maquettes | Retenu |
|---|---|---|---|
| Rôles de compte | §2.2 : 3 niveaux d'accès | 4 rôles (V-28) | **4 rôles** — la maquette prime |
| Modules de domaine | RG-STR-06 : 5 modules | 6, « Dossiers » en plus | **6** — la maquette prime |
| Signet | §3.3 : objet de référentiel | type de note portant `url` et `ajoute` | **type de note** — la maquette prime |
| Types de note | §3.4 : **11 fournis** | **5 employés** | **11 au référentiel, 5 au corpus** |

**La quatrième n'est pas un conflit.** T-010 a retenu « les 5 des maquettes », en concluant qu'elles
priment. Mais *fournir* onze types et *en employer* cinq dans un corpus de démonstration ne se
contredisent pas : **le cahier décrit un référentiel, les maquettes montrent un jeu de données.** Une
maquette qui emploie cinq types ne prouve pas que les six autres n'existent pas — elle prouve que le
corpus de démonstration n'en emploie que cinq.

**L'ordre de préséance tranche les conflits ; il ne s'invoque pas quand il n'y en a pas.** Retenir 5
aurait fait perdre six types fournis que rien ne contredit.

**Décision.** Le référentiel livré porte **les onze types de CDC §3.4**, avec les libellés du cahier.
Les **cinq des maquettes** sont ceux que la semence emploie, avec **les libellés des maquettes** —
là, elles priment, puisque ces libellés sont rendus à l'écran. Si un des cinq porte un libellé
différent du type de cahier correspondant, c'est le libellé de la maquette qui est stocké.

**Ce que cela coûte :** une migration de plus, comme T-010 l'avait prévu. Rien à défaire.

---

## ARB-037 — Les trois décisions de T-010 prises faute de source
**19 août 2026** — arbitrage délégué. Répond à `T-010` É-8.

**1. Le nom du dossier racine.** `RG-STR-03` donne à chaque domaine un dossier racine par défaut,
sans le nommer, et aucune maquette ne l'affiche — l'adresse `/…/dossiers/{chemin…}` ne le porte pas.
T-010 lui donne **le nom de son domaine**. **Retenu.** C'est la seule valeur qui ne soit pas
inventée : elle est déjà connue, elle est unique dans son univers, et un dossier racine ne s'affiche
nulle part, donc aucune vue ne dépend de ce choix.

**2. La profondeur se compte racine comprise** — `BETWEEN 1 AND 10`. `RG-STR-04` plafonne à dix
niveaux sans dire si la racine en est un. **Retenu**, et c'est le sens strict : le plafond protège
d'une arborescence ingérable, et la racine est un niveau de rangement comme un autre. La lecture
inverse offrirait onze niveaux là où la règle en écrit dix.

**3. L'origine des relations.** `P-08` exige que l'utilisateur sache toujours si une relation est
*déclarée*, *déduite* ou *ambiguë*. Aucune maquette ne porte l'origine des 22 relations du corpus.
T-010 les entre toutes en `declaree`. **Retenu, et c'est la seule valeur défendable** : une relation
du jeu de semence a été écrite à la main, donc elle est déclarée. **Mais la colonne n'a pas de
défaut** — `declaree` doit être posé explicitement à chaque écriture, jamais hérité d'un `DEFAULT`.
Une origine par défaut ferait entrer des relations déduites en « déclarées » le jour où l'inférence
existera, et `P-08` tomberait sans que rien ne le signale.

**Et la traduction déclarée est retenue** : le type de champ `interrupteur` du corpus devient
`booleen`, terme de CDC §3.5. Le vocabulaire contractuel de `CLAUDE.md` §3 ne couvre pas les types de
champ ; à défaut, le cahier fait foi.

---

## ARB-038 — La base ne se configure pas par une URI
**19 août 2026** — arbitrage délégué. Répond à `T-010` É-5, et referme `P-13`.

**Le fait, mesuré et non supposé.** `compose.yaml` composait
`postgres://${UTILISATEUR}:${MDP}@db:5432/${BASE}` **par interpolation brute**. T-010 l'a éprouvé sur
six mots de passe :

```
mot/de+passe  → ERR_INVALID_URL au démarrage      mot@passe  → intact
mot#passe     → ERR_INVALID_URL au démarrage      mot:passe  → intact
mot?passe     → ERR_INVALID_URL au démarrage      hexadécimal → intact
```

**`P-13` n'était pas refermé, il était évité.** Le piège recommandait `openssl rand -hex 32` — une
parade **déclarative**, qui repose sur la discipline de l'exploitant. Or ce dépôt tient une hiérarchie
explicite : *bloquant > vérifiable > déclaratif*. Une parade déclarative sur un défaut qui refuse le
démarrage et dont le message ne nomme pas la cause est le plus mauvais des trois régimes.

**Décision. La base se configure par variables séparées, jamais par une URI.** `compose.yaml` est
corrigé : `HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE`. Le connecteur reçoit
un **objet**, jamais une chaîne — **rien n'est concaténé, donc rien n'est à échapper**. Le piège
devient inaccessible par la forme, pas évité par la consigne.

**`P-13` est réécrit en conséquence** dans `CLAUDE.md` §6 : il ne recommande plus un tirage
hexadécimal, il interdit la composition d'URI.

**Ce que cela emporte.** `URL_BASE` disparaît du contrat de déploiement. `.env.example` garde ses
noms `*_POSTGRES` — ils nomment la configuration du **conteneur PostgreSQL**, qui les attend sous
cette forme ; les `*_BASE` nomment la configuration du **client**. Les deux jeux ne se confondent
pas, et c'est voulu.

---

## ARB-039 — `P-09` gouverne les droits, pas l'état d'un formulaire
**19 août 2026** — arbitrage délégué. Répond à `T-061` É-1 et É-2, et corrige une prémisse à moi.

**La tension que j'avais transmise n'existe pas.** J'ai écrit — et la batterie 9 l'avait écrit avant
moi — que `.ac--interdit` était *« un droit hérité affiché en grisé, que le brief V-40 exige
explicitement »*. **C'est faux, et il suffisait de lire `V-40:3579`** : `.ac--interdit` est
l'**emplacement courant**, rendu non sélectionnable dans l'arborescence de destination du dialogue de
déplacement — `label.ac.ac--interdit` avec un `input[type=radio][disabled]` et le libellé
« emplacement actuel ».

Le droit hérité, lui, est `.dr[data-herite="oui"]`, et **le gel y tient `P-09` exactement là où on le
croyait en défaut** : mesuré, une rangée héritée porte **0 action**, une rangée explicite en porte
**1**. Le gel pose un `<span>` de 27 px là où serait le bouton « Retirer l'accès ». **Il ne grise pas
un bouton : il n'en met pas.**

*L'exclusion de `.ac--interdit` par la batterie 9 reste juste ; son motif est faux et corrigé.*

**La vraie question est ailleurs, et elle se déduit.** Le brief V-40 exige, pour les suppressions à
confirmation : *« saisie du nom exact exigée · bouton inactif tant que la saisie ne correspond
pas »*. Cinq actions sont dans ce cas, et à la lettre de `P-09` un bouton inactif est « une action
interdite affichée, grisée ».

**Décision. Ce n'est pas une action interdite, et `P-09` ne le vise pas.** Le principe se lit en
entier : *« Une action interdite n'est pas affichée. Ni grisée, ni refusée après le clic.
**L'utilisateur ne rencontre pas de porte fermée.** »* — et il renvoie à `RG-M05-08`, une règle de
**droits**.

Un bouton de confirmation inactif tant que le nom n'est pas saisi **n'est pas une porte fermée** :
l'utilisateur *a* le droit de supprimer, et la clé est dans sa main. Ce n'est pas un refus, c'est un
**état de formulaire incomplet** — la même famille qu'un « Enregistrer » inactif tant qu'aucun champ
n'a changé.

**La frontière, et elle est nette.** `P-09` interdit d'afficher une action que l'utilisateur **ne
peut pas** accomplir. Il ne dit rien d'une action qu'il **peut** accomplir mais **n'a pas encore
préparée**. Le critère est : *l'inertie dépend-elle d'un droit, ou d'un état que l'utilisateur peut
changer lui-même ?* Si l'utilisateur peut la lever, ce n'est pas `P-09`.

**Portée.** Les **51 actions inertes qu'aucun droit ne gouverne** relevées par la batterie —
`disabled ×28`, `pointer-events:none ×23`, sur 16 vues — sortent de `P-09` par ce critère. Elles
restent **comptées et imprimées** en constat : le jour où l'une d'elles serait inerte par droit, elle
change de nature, et la batterie le verra.

---

## ARB-040 — Le produit peut omettre ce que le gel rend masqué — extension d'ARB-027
**19 août 2026** — arbitrage délégué. Répond à `T-061` É-5, et lève 59 actions.

`ARB-027` autorisait l'application à **ajouter** ce qui ne peint aucun pixel, et fermait
explicitement l'autre sens : *« retirer un attribut que le gel porte, ou en changer la valeur, reste
rouge »*. **La mesure de T-061 montre que la borne était trop large d'un cas.**

**Le fait, prouvé et non argumenté.** Un nœud en `display:none` ne pèse **ni dans l'instantané ARIA,
ni dans l'ordre de tabulation, ni dans un pixel** — donc dans aucune des trois surfaces que le banc
compare. Vérifié par mutation : les trois actions propres de V-11, rendues **conditionnellement** au
lieu d'être masquées, laissent `pnpm verif:maquette V-11 --contre=app` à **8/8 conformes, 0 écart**.

**Et le masquage n'est pas un choix de la maquette : c'est sa seule possibilité.** Une maquette
statique n'a pas de serveur. Elle ne peut exprimer « cette action n'existe pas pour ce rôle »
qu'en la posant puis en la cachant. **L'application, elle, peut ne pas l'émettre** — et `P-09` exige
précisément cela : *« ni grisée, ni masquée »*.

**Décision. L'application peut OMETTRE un nœud que le gel rend masqué, à trois conditions
cumulatives** — les mêmes qu'`ARB-027`, dans l'autre sens :

1. **le nœud est effectivement masqué dans le gel** pour cet état — jamais visible ;
2. **une règle du projet exige l'absence**, nommément : `P-09` / `RG-M05-08`, ou `P-04` /
   `RG-STR-06` pour un module désactivé ;
3. **l'omission est énumérée**, vue par vue, dans un fichier de référence en écriture humaine seule.

**Le banc reste juge, sans exception** : `verif:maquette` doit rester à zéro pixel et zéro écart de
structure sur la vue touchée. Si l'omission déplace quoi que ce soit, elle est refusée — c'est le
contrôle qui décide, pas le raisonnement ci-dessus.

**Ce que cela emporte.** Les **59 actions de gel** de la batterie 7 ne sont **pas** une impasse,
contrairement aux 173 de la batterie 9 et aux 3 439 de la batterie 10. **Elles se referment par une
campagne de portage, sans aucun regel.** C'est la différence que T-061 a établie et qu'il faut
garder : *un « gel » qui vient d'une limite du support n'est pas un « gel » qui vient de la loi.*

**Le seuil de 59 n'est donc PAS installé.** Il figerait comme dette permanente ce qu'un lot referme.

---

## ARB-041 — Deux motifs faux dans la documentation, corrigés
**19 août 2026** — arbitrage délégué. Répond à `T-061` É-1 et É-6.

**`docs/DESIGN.md` §2.A A-7 décrit une propriété que sa source n'a pas.** Il écrit *« Sans droit …
Pas de composant : l'élément est **absent du DOM** »* en citant `.si-ecriture` et `.si-admin` — or
`socle.css:396-397` **masque**. C'était faux du gel, et cela le reste.

**Mais avec `ARB-040`, la phrase devient vraie du produit.** `DESIGN.md` est amendé pour dire les
deux : *le gel masque, faute de serveur ; le produit omet, parce que `P-09` l'exige* — et la batterie
7 l'oppose.

**Et le motif d'exclusion de `.ac--interdit` dans `verif/etats.mjs` est corrigé** : la classe n'est
pas un droit hérité grisé, c'est l'emplacement courant du dialogue de déplacement. L'exclusion tient ;
sa justification était fausse et se serait propagée.

---

## ARB-042 — Révision d'ARB-033 : le motif d'exemption tombe, la conclusion tient
**19 août 2026** — arbitrage délégué. Répond à `T-065` É-3, É-5, É-6.

### Ce que j'avais écrit, et qui est faux

`ARB-033` §3 : *« Là où ce jeton habille un élément réellement inactif, il n'y a pas de violation —
**axe ne peut pas savoir que l'élément l'est**. »*

**Si, il le sait.** `color-contrast-matches` d'axe-core 4.13 écarte lui-même tout nœud pour lequel
`isDisabled()` ou `isInert()` rend vrai, et **`isDisabled()` remonte la chaîne des ascendants**.
Aucune occurrence des 707 ne *peut* donc porter une inactivité déclarée : **le seau « exempt » est
vide par construction**, et le partage que j'avais demandé n'avait mécaniquement qu'une issue.

Éprouvé sur cas réel plutôt que déduit : poser `aria-disabled="true"` sur les ascendants d'un site de
V-41 fait passer axe de 2 violations à 0. Et contre-relevé : les 4 sites en `--c-encre-4` réellement
portés par un composant inactif — les `<option disabled>` de V-32 — **existent dans le gel et ne sont
dans aucun des 707**.

**La conclusion d'`ARB-033` tient sur son autre jambe**, et c'était la bonne : `#526064` est à un
point de `--c-encre-3`, donc `--c-encre-4` assombri cesse d'être une quatrième encre. **Elle n'est
pas assombrie.** Mais son motif d'exemption est retiré.

### Ce que la mesure a établi, et qui vaut mieux qu'un chiffre

| | |
|---|---|
| Contrôle de la méthode du socle | `#71838a` → **2,7590** (annoncé 2,75) · `#536066` → **4,5366** (annoncé 4,54). Elle se reproduit |
| Avant-plan en cause | **`--c-encre-4` dans 715 cas sur 715.** Aucune autre encre |
| Fonds en cause | **six**, non quatre — `--c-frais-voile` et `--c-danger-voile` s'ajoutent aux quatre surfaces de la méthode |
| Partage | **exempt 0 · réel 675 · indécidable 32** — borne `675 ≤ réel ≤ 707` |
| Le dossier | **133 sites nommés · 22 groupes · 18 classes · 16 vues** |
| La réparation | **`--c-encre-3` partout**, vérifié contre le fond **composé** de chaque site, pas contre une moyenne. Il tient AA sur les **neuf** surfaces du socle, voiles compris |

**C'est cela qui remplace « 707 ».** Un chiffre d'occurrences d'axe est devenu un dossier borné, où
chaque ligne porte son sélecteur, son texte, son état, sa fenêtre et sa réparation — **aucune teinte
inventée**.

### Et le chiffre de 707 sous-compte

`axe` n'évalue pas les pseudo-éléments. Or **71 champs portent un `placeholder`, et les 41 vues sur
41 colorent `::placeholder` en `--c-encre-4`** (2,10 à 2,55:1) ; 64 règles font de même sur
`::before`/`::after`. **Aucun de ces sites n'est dans les 707** — et le placeholder d'un champ
**actif** n'est pas exempté par 1.4.3.

S'y ajoutent **2 299 nœuds** qu'axe classe `incomplete` et refuse de trancher — plus de trois fois
les 707 — et le **contraste non textuel** (WCAG 1.4.11), que rien ne mesure : la seconde moitié de
`RG-M18-07`.

### Décision

1. **`--c-encre-4` n'est pas assombri.** Inchangé.
2. **La ligne `gel/axe:color-contrast: 707` du seuil est une dette *sous-évaluée*, et doit le dire.**
   Elle ne borne que ce qu'axe voit.
3. **Le dossier de regel des 16 vues est prêt et chiffré** — `verif/rapports/contraste.json`,
   `pnpm verif:contraste`. Il ne s'exécute pas de lui-même : remplacer `--c-encre-4` par
   `--c-encre-3` déplace des pixels, donc c'est un regel, donc **l'ordre de préséance le refuse tant
   qu'il n'est pas arbitré**. `RG-M18-07` reste non tenue sur ces sites, et c'est une conséquence de
   la loi du projet — pas une question ouverte.
4. **Aucun site n'est classé « décoration ».** Le gel plaide lui-même contre : V-32 garde le **nom**
   d'un compte inactif en `--c-encre-3` et ne laisse tomber que sa date ; et `.alerte-dom[data-nul]`
   grise une **valeur zéro**, c'est-à-dire une donnée que `P-02` et `P-05` imposent de lire.

---

## ARB-043 — Quatre lectures du vocabulaire, tranchées
**19 août 2026** — arbitrage délégué. Répond à `T-066` É-2, É-3, É-5, É-6.

**1. « Guide » n'est pas un synonyme de « note ».** Le gel emploie le mot 227 fois pour la note
publique. **`CDC` §3.4 en fait un type de note fourni** : une note publiée de ce type *est* un guide,
et la nommer ainsi emploie le **nom du type**, pas un synonyme du concept. C'est exactement le
raisonnement d'`ARB-036` — le cahier décrit un référentiel, la vue montre une instance. La batterie
le compte en constat et ne l'oppose jamais : c'est le bon classement, et il est confirmé.

**2. Les trois « document » du gel sont des violations réelles, et le gel les emporte.** `V-24` écrit
« Les liens entre **documents** sont résolus automatiquement » et « sans **document** qui la
référence » — du chrome, donc `P-07` à la lettre. Mais **maquettes > brief** : `P-07` n'est pas tenue
sur ces 9 occurrences, et c'est une conséquence de la loi, pas une question. Dette nommée, ligne
`gel` du seuil. *(Le cas de `V-12` est l'extrait d'une note, pas du chrome — `É-4` du lot signale à
juste titre qu'aucune source ne dit si `P-07` vise le contenu. Non tranché, non compté.)*

**3. L'extension de `P-07` aux identifiants ne peut pas s'opposer au gel.** `CLAUDE.md` §3 l'étend
aux noms de classes ; `P-6.3` exige que la feuille d'une vue soit **identique à l'octet** au gel. Le
portage **ne peut pas** renommer `.article` ou `.page-signet` sans casser `pnpm vues:feuille` et le
banc. **L'extension vaut pour le code neuf, jamais contre un identifiant gelé.** `CLAUDE.md` §3 est
amendé en ce sens.

**4. « Fiche » en dur est une dette de portage, et elle se ferme par un lot.** 69 emplois en dur pour
**une seule** lecture de `CONFIG.motFiche`, alors que `M14.7` rend le concept renommable globalement.
**Une maquette statique ne lit aucune configuration : qu'elle écrive « Fiche » en dur n'autorise
rien.** Le seuil est posé à **67**, la valeur mesurée à l'arbitrage — il descend, il ne monte pas, et
les 2 unités au-dessus sont un défaut à fermer, pas un seuil à relever.

---

## ARB-044 — Les seuils des batteries 8 et 17
**19 août 2026** — arbitrage délégué.

| Batterie | Seuil posé | Ce qui reste rouge, et c'est voulu |
|---|---|---|
| 8 — corpus vide | `--seuil-gel=210` | **1 défaut de portage** : `V-33` n'a pas la branche vide que son gel porte (`V-33:2897-2907`, `zone-etat__txt` « Aucune note à mesurer »). `verif:maquette` est vert dessus parce que le corpus natif ne l'exerce jamais — cas d'école de « ce qu'un vert ne dit jamais » |
| 17 — vocabulaire | `--seuil-gel=138 --seuil-fiche=67` | **2 emplois de « fiche »** au-dessus du seuil |

Les 210 du gel sont établis par un fait que la batterie 8 a mesuré et qu'il faut retenir : **aucune
des 41 maquettes ne modélise une vue sous corpus vide.** Elles modélisent la base vierge comme un
**état de planche**, jamais comme un corpus. Sous corpus vide et état nominal, **14 zones du gel
rendent « 0 » sans état neutre** — `V-28 #travail` en rend 25. `RG-M01-01` n'est donc pas tenue par
la référence elle-même.

**Les deux batteries restent rouges, et c'est le but** : elles pointent chacune un défaut réel et
fermable, pas une dette de gel.
