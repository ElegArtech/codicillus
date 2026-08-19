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
| A-2 | les attributs de données de la vue sont transmis à `div.app` — 47 attributs, 26 noms | 27 |
| A-3 | libellé du chevron : « Replier » quand le nœud est ouvert — **convergence**, ARB-020 | 27 |
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

**Effet attendu** : la convergence refusée devient possible, et `flex: 0 0 auto` devient visible.
Une règle qui rend un défaut détectable vaut mieux qu'une règle qui l'ignore par prudence.
