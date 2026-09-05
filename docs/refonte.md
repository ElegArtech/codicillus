# Refonte de l'interface — le plan d'exécution

Un seul document, et il tient le rôle de mémoire entre les sessions d'exécution. Il n'y aura ni
contrat de tâche, ni dossier d'écart, ni journal de vague : le dépôt les a déjà refusés une fois.

## 1. Ce qui fait foi

`design_handoff_refonte_codicillus/`, dans cet ordre d'autorité :

1. `README.md` du paquet — arbitrages, jetons, description des six écrans, ordre de livraison ;
2. `captures/*.png` — le prototype validé, rendu. **C'est la cible visuelle** ;
3. `Codicillus - Lecture de note.dc.html` et `reference/logique-prototype.js` — le comportement
   exact, les libellés au caractère près, les seuils de mise en page ;
4. `SPEC-vivacite.md` et `SPEC-modele-navigation.md` — les cinq états, le modèle, les routes ;
5. `maquettes/*.png` — intentions antérieures, elles cèdent partout où le prototype parle.

On ne copie pas le HTML du prototype. On recrée ses écrans dans le code du dépôt, avec les jetons
de `src/socle.css` et une feuille par vue.

## 2. Les arbitrages — pris, non rediscutés

1. **« Vivacité » à l'écran, `fraicheur` dans le code.** Le module reste `src/lib/fraicheur.ts`,
   les tables et les routes gardent leurs noms ; seuls les libellés visibles changent. Le composant
   s'appelle `GlypheDeVivacite.svelte` : les deux mots viennent du paquet.
2. **La fabrique à cinq états remplace celle à trois.** Les trois anciens niveaux survivent comme
   chemin de compatibilité tant qu'une vue les monte, et disparaissent quand la dernière est portée.
3. **Un cycle par registre, en base.** Une migration ajoute la date de vérification, la durée de
   validité et la demande de révision PAR REGISTRE, plus les événements d'historique. Sans elle,
   quatre des six écrans ne peuvent pas afficher ce que la référence montre.
4. **Le jeu de conformité est un jeu de démonstration de plus, pas la vérité du produit.** Il
   reproduit les données du prototype pour que l'écran soit comparable à la capture. Chaque écran
   est vérifié DEUX FOIS : avec ce jeu, et sur base vide.
5. **Pas de diff de pixels.** Le prototype est du HTML statique, le produit sert des données
   réelles : un seuil de pixels serait un faux rouge permanent. La comparaison est faite, à la
   bonne taille, côte à côte, à chaque tâche — le verdict reste humain.
6. **Périmètres d'écriture disjoints.** Les surfaces partagées — `src/socle.css`, `src/lib/coquille/`,
   `src/lib/fraicheur.ts`, le schéma — appartiennent à l'orchestrateur. Un agent de vue n'écrit que
   sa vue, sa feuille, sa route et son chargeur. C'est ce qui permet de paralléliser sans copies de
   travail : le dépôt prévient qu'un `node_modules` lié et une base partagée les rendent coûteuses.
7. **Les libellés que `cablage.ts` reconnaît par leur texte ne bougent pas.** « Modifier la
   référence », « Modifier l'opérationnel », « Historique des versions », « Exporter », « Imprimer »,
   « Supprimer », « Lever la demande » : le prototype porte les mêmes. Aucun écart à arbitrer.
8. **Une tâche = un contexte.** Chaque écran part en sous-agent neuf, avec sa référence, son
   protocole et ses commandes. L'orchestrateur ne code que les surfaces partagées.
9. **Pas de worktrees.** `node_modules` est un lien entre copies et la base est partagée : le coût
   d'isolation dépasse le gain. Les vagues s'exécutent en parallèle dans un seul arbre, sur des
   fichiers disjoints.
10. **Aucun onglet désactivé, aucune grande zone vide, aucun bouton inerte.** Un geste dessiné est
    un geste promis ; le rendre inerte est un défaut, pas une étape.
11. **Deux routes à créer.** L'historique n'existe aujourd'hui que comme état `?version` de la
    note ; la référence en fait une page à part entière (`/notes/{id}/historique`, fil d'Ariane
    « … › historique », bouton « ← Retour à la note »). Et la planche des états vit dans V-41,
    interdite aux non-administrateurs, alors que le pied de chaque note y renvoie : elle prend son
    adresse propre, `/bibliotheque/vivacite`, ouverte à tout compte connecté.
12. **`compte`, `univers` et `domaines` continuent de descendre par le contexte de coquille**
    (`CLE_IDENTITE`), jamais par des propriétés recopiées : six vues en dépendent.
13. **La coquille n'a plus qu'une feuille.** Ses règles étaient recopiées à l'octet près dans les
    trente-cinq feuilles de vue — 3 980 lignes décrivant toutes le même gabarit. Elles sont
    remontées dans `src/socle.css`. Sans ça, refondre le rail voulait dire éditer trente-cinq
    fichiers, et ils divergeaient au premier oubli.
14. **Les bascules automatiques d'état ne sont pas stockées.** L'historique les montre — « Passage
    automatique à « À vérifier » » — mais elles se DÉDUISENT du couple (vérifiée, validité). Une
    table d'événements imposerait un ordonnanceur pour recopier ce qu'un calcul rend.
15. **Les outils quittent le rail pour la carte de compte.** La référence ne montre ni Cartographie,
    ni Import, ni Console dans le rail : elle les place sur les pages d'univers et de domaine. Ils
    vivent désormais dans le menu de la carte de compte, en bas du rail — aucune adresse ne devient
    inatteignable, c'est la seule contrainte.

## 3. Le harnais — minimum, et rien de plus

- `pnpm check` à 0 et `pnpm test:unit` vert : la barrière bloquante, elle existe déjà.
- `node tools/conformite/conformite.mjs [vue]` : rend chaque écran connecté à la taille du
  prototype et l'assemble côte à côte avec sa capture, dans `tools/conformite/cote-a-cote/`.
- `CLAUDE.md` : porte désormais l'autorité du paquet et le vocabulaire. C'est là que ça vit, pas
  recopié dans chaque tâche.

Il n'y a ni hook, ni contrôle d'intégration continue, ni règle de style nouvelle, ni agent qui juge.

## 4. Les vagues

| # | Tâche | Dépend de | Écrit dans | Exécutant |
|---|---|---|---|---|
| T-01 | Jetons, fabrique à 5 états, glyphe | — | `socle.css`, `fraicheur.ts`, `GlypheDeVivacite.svelte` | orchestrateur — **fait** |
| T-02 | Cycle de vivacité par registre : migration, schéma, chargeurs, actions | T-01 | `base/migrations/`, `lib/base/`, `lib/donnees/` | implémenteur |
| T-03 | Jeu de conformité (données du prototype) | T-02 | `base/base.mjs`, `lib/base/` | orchestrateur |
| T-04 | Coquille : rail arborescent, en-tête à fil d'Ariane, tiroirs | T-01 | `lib/coquille/` | orchestrateur |
| T-05 | Lecture d'une note | T-02, T-04 | `V-14`, `lib/lecture/`, route `notes/[identifiant]` | implémenteur |
| T-06 | Historique | T-02, T-04 | `V-15`, route historique | implémenteur |
| T-07 | Accueil | T-02, T-04 | `V-07`, route `/` | implémenteur |
| T-08 | Page d'un univers | T-02, T-04 | `V-10`, route univers | implémenteur |
| T-09 | Page d'un domaine | T-02, T-04 | `V-11`, route domaine | implémenteur |
| T-10 | Planche des états + seuils en console | T-01 | `V-41`, console | implémenteur |
| T-11 | Convergence : les neuf captures, la base vide, les trois largeurs | tout | partout | orchestrateur |

Vague 1 : T-02, T-04 (parallèles). Vague 2 : T-03. Vague 3 : T-05…T-10 (parallèles).
Vague 4 : T-11.

## 5. Le protocole de chaque tâche d'écran

1. **Lire la référence et la restituer** — zones, composants, libellés, états — avant toute ligne
   de code. Un pointeur cité n'est pas un fichier lu.
2. **Le squelette d'abord** : la vue rendue avec les données du chargeur, conforme de structure,
   avant la logique.
3. **La logique**, sans perdre la conformité.
4. **Les preuves** : `pnpm check` à 0, `pnpm test:unit` vert, le côte-à-côte produit, et l'écran
   ouvert sur base vide.
5. **Un écart n'est pas une liberté** : si la référence est inimplémentable en l'état, on le dit
   dans le commit et on prend le chemin le plus simple qui ferme le geste. On ne s'arrête pas.
