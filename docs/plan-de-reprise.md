# Plan de reprise — modélisation, mentions, refus, module

*Écrit le 7 septembre 2026, sur le dépôt à `08bf423`. Ce fichier se suffit à lui-même : une
session neuve l'exécute sans rien lire d'autre que le code qu'il désigne et `CLAUDE.md`.*

---

## 0. Ce qui est mesuré au départ

Tout ce qui suit a été **relevé**, pas supposé. Les commandes sont rejouables.

```
pnpm check      = 0                                     (0 erreur, 0 avertissement, 1430 fichiers)
pnpm test:unit  = 0                                     88 fichiers, 2012 contrôles, tous verts
base de développement : conteneur codicillus-db-1, PostgreSQL 18.6, port 19432
  77 notes · 13 domaines · 6 univers · 7 relations, toutes `declaree` · 0 `deduite` · 0 `ambigue`
  12 notes portent un paragraphe `[fixture-liens]` · 12 notes portent des liens internes
  types_de_relation : depend-de (technique), documente, complete, corrige, remplace
extension `vector` 0.8.6 installée, aucune colonne `vector` créée (migration 001)
migrations appliquées jusqu'à 015
```

Faits de structure qui commandent plusieurs chantiers ci-dessous :

- **`types_de_relation.technique` EXISTE DÉJÀ** — `base/migrations/002_socle.montee.sql:277`,
  `src/lib/base/schema.ts:356-357`. Le chantier 3 ne pose donc aucune migration : voir §C3.
- **Chaque fichier de migration s'exécute dans UNE transaction** —
  `src/lib/base/commandes.ts:173-179` : `BEGIN`, le fichier entier, `COMMIT`. PostgreSQL refuse
  d'employer une valeur d'énuméré ajoutée dans la transaction qui l'ajoute. Deux migrations sont
  donc le MINIMUM pour le chantier 8 : voir §Migrations.
- **74 notes sur 77 sont à la racine de leur domaine** (`dossiers.profondeur = 1`), donc leur
  `Note.dossier` vaut la chaîne vide (`src/lib/donnees/lecture.ts:308-332`). C'est le défaut
  central de la carte mentale : voir §C11.
- **Aucun fichier de `seeds/demonstration/` ne porte un lien interne `[[…]]`** — vérifié par
  `grep -c '\[\[' seeds/demonstration/*.md`, zéro partout. Le jeu de démonstration ne produit donc
  aucune arête déduite : voir §C2.
- **`/modelisation` n'est ni dans `docs/routes.md`, ni dans `docs/traces/passage-a-froid.mjs`.**
  Les deux le reçoivent au chantier 8.

---

## 1. Les migrations, groupées

Deux fichiers, et c'est le minimum atteignable. La raison est mécanique, pas esthétique :
`ALTER TYPE module_de_domaine ADD VALUE 'modelisation'` et l'`INSERT` qui emploie cette valeur ne
peuvent pas tenir dans la même transaction, et le lanceur enveloppe chaque fichier dans une
transaction.

### `016_modelisation_et_propositions_refusees`

Elle porte **les deux changements de schéma du plan**, parce qu'ils tiennent ensemble : ni l'un ni
l'autre n'emploie la valeur d'énuméré qu'elle ajoute.

`base/migrations/016_modelisation_et_propositions_refusees.montee.sql` :

```sql
-- La modélisation devient un module de domaine — chantier 8.
ALTER TYPE module_de_domaine ADD VALUE 'modelisation';

-- La mémoire des refus de proposition — chantier 9.
CREATE TABLE propositions_refusees (
	id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	source_id           uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	cible_id            uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	type_de_relation_id uuid NOT NULL REFERENCES types_de_relation (id) ON DELETE CASCADE,
	refusee_par_id      uuid REFERENCES comptes (id) ON DELETE SET NULL,
	refusee_le          timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT propositions_refusees_unicite UNIQUE (source_id, cible_id, type_de_relation_id),
	CONSTRAINT propositions_refusees_pas_reflexives CHECK (source_id <> cible_id)
);

CREATE INDEX propositions_refusees_cible_idx ON propositions_refusees (cible_id);
```

`…016….descente.sql` — retirer une valeur d'énuméré demande de recréer le type :

```sql
DROP TABLE propositions_refusees;

DELETE FROM modules_de_domaine WHERE module = 'modelisation';
ALTER TYPE module_de_domaine RENAME TO module_de_domaine_ancien;
CREATE TYPE module_de_domaine AS ENUM (
	'notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carte_mentale'
);
ALTER TABLE modules_de_domaine
	ALTER COLUMN module TYPE module_de_domaine USING module::text::module_de_domaine;
DROP TYPE module_de_domaine_ancien;
```

### `017_modelisation_suit_cartographie`

```sql
-- Rien ne doit disparaître : tout domaine qui a ouvert son graphe garde les DEUX
-- façons de le lire. C'était la règle que V-11 tenait en dur avant ce lot.
INSERT INTO modules_de_domaine (domaine_id, module)
SELECT domaine_id, 'modelisation'::module_de_domaine
  FROM modules_de_domaine
 WHERE module = 'cartographie'
ON CONFLICT DO NOTHING;
```

`…017….descente.sql` : `DELETE FROM modules_de_domaine WHERE module = 'modelisation';`

**Ce qui se passe ENTRE les deux migrations.** Après `016` et avant `017`, l'énuméré porte la
valeur et aucun domaine ne l'a : l'entrée « Modélisation » disparaît de la navigation. C'est un
état de quelques millisecondes à l'intérieur d'un seul `pnpm base:migrer`, et il ne casse rien —
`/modelisation` reste servie, seule l'entrée de navigation manque. Aucun ordre inverse n'est
possible : `017` ne peut pas précéder `016`.

**Arbitrage — les deux changements dans la même migration.** Ils sont indépendants et n'ont
aucune interaction : les grouper tient la consigne « une seule migration si les changements
peuvent tenir ensemble », et les séparer ferait trois fichiers là où deux suffisent.

**Arbitrage — `ON DELETE CASCADE` sur `type_de_relation_id`.** `relations` emploie `RESTRICT`
parce qu'une relation est un fait qu'on ne détruit pas par ricochet ; un refus est une opinion sur
une hypothèse, et supprimer le type qu'elle nommait la vide de sens.

**Arbitrage — `refusee_par_id` en `ON DELETE SET NULL`.** `RG-NF-05` exige qu'une trace de
DESTRUCTION garde son auteur (`RESTRICT`) ; un refus ne détruit rien, et faire dépendre la
suppression d'un compte de ses refus serait un verrou sans contrepartie.

---

## 2. L'ordre d'exécution — les vagues

Deux chantiers qui touchent le même fichier ne sont jamais dans la même vague. La base PostgreSQL
est PARTAGÉE par toutes les copies de travail : une seule vague à la fois écrit en base.

### Vague 0 — la donnée locale (1 lot, séquentiel, aucun worktree)

| Lot | Chantier | Fichiers |
|---|---|---|
| **0** | **C1** nettoyage du corpus local | aucun fichier du dépôt — du SQL |

*Ce que la vague 1 en attend :* une base de développement sans un seul `[fixture-liens]`, donc
zéro arête déduite. Tout ce qui suit s'observe sur cette base ; la laisser sale ferait apparaître
à l'écran des mentions qui n'ont rien à y faire et fausserait chaque contrôle de navigateur.

### Vague 1 — les fondations (3 lots en parallèle, worktrees séparés)

| Lot | Chantier | Fichiers possédés |
|---|---|---|
| **A** | **C8** module Modélisation **+ les deux migrations** | `base/migrations/016_*`, `017_*` · `src/lib/base/schema.ts` · `seeds/corpus.ts` · `src/lib/rangement/modules.ts` · `src/lib/donnees/rangement.ts` · `src/lib/donnees/lecture.ts` · `src/lib/donnees/administration.ts` · `src/lib/base/semence.ts` · `src/lib/base/commandes.ts` · `src/lib/base/conformite.ts` · `src/vues/V-11.svelte` · `src/vues/V-28.svelte` · `src/lib/coquille/Rail.svelte` · `src/routes/+layout.server.ts` · `docs/routes.md` · `docs/traces/passage-a-froid.mjs` · les tests de ces modules |
| **B** | **C7-a** la géométrie des tracés, testable | `src/lib/graphe/traces.ts` *(nouveau)* · `src/lib/graphe/traces.test.ts` *(nouveau)* |
| **C** | **C2** jeu de démonstration | `seeds/demonstration/*.md` · `src/lib/base/demonstration.ts` · `seeds/demonstration.test.ts` *(nouveau)* |

Seul le lot A écrit en base (les migrations). B et C sont purs.

*Ce que la vague 2 en attend :* de A, l'énuméré et la table `propositions_refusees` posés et
`pnpm base:coherence` vert ; de B, un module de tracé testé qu'il ne reste qu'à brancher ; de C,
un jeu de démonstration qui porte enfin des liens de corps, donc de la matière à dessiner.

### Vague 2 — `/modelisation` (1 lot)

| Lot | Chantiers | Fichiers |
|---|---|---|
| **D** | **C9** mémoire des refus (application) · **C3** points de défaillance unique · **C6** étagement · **C7-b** câblage des tracés | `src/lib/donnees/relations.ts` · `src/lib/donnees/relations.test.ts` · `src/lib/graphe/propositions.ts` · `src/lib/graphe/propositions.test.ts` · `src/lib/graphe/couches.ts` · `src/lib/graphe/couches.test.ts` · `src/routes/modelisation/+page.server.ts` · `+page.svelte` · `modelisation.css` |

Un seul lot, parce que les quatre chantiers touchent tous `+page.server.ts`, `+page.svelte` et
`modelisation.css`. Ordre interne imposé : **C9, puis C3, puis C6, puis C7-b** — C9 change la
forme des données servies, C3 et C6 s'y ajoutent, C7-b ne touche que le dessin.

*Ce que la vague 3 en attend :* un écran dont les six gestes fonctionnent et dont le chargeur sert
sa forme définitive.

### Vague 3 — la preuve (2 lots en parallèle)

| Lot | Chantier | Fichiers |
|---|---|---|
| **E** | **C5** couverture de tests restante | `src/routes/cartographie/lecture-du-graphe.ts` *(une extraction pure, voir §C5)* · `src/routes/cartographie/lecture-du-graphe.test.ts` *(nouveau)* · `src/lib/graphe/modele.test.ts` *(nouveau)* |
| **F** | **C4** hydratation : rejeu des clics avec le JavaScript client | aucun fichier du dépôt — un script jetable dans le répertoire de travail temporaire |

Disjoints : E n'écrit que des tests neufs, F n'écrit rien dans le dépôt. F emploie la base de
développement en LECTURE et en ÉCRITURE (il déclare et retire des relations) — il ne tourne donc
pas en même temps qu'un lot qui migre, ce qui est acquis puisque la vague 1 est close.

### Vague 4 — la clôture (1 lot)

`pnpm check`, `pnpm test:unit`, `pnpm build`, le passage à froid, les aiguilles, le parcours de
bout en bout sur une base à ZÉRO DONNÉE, la mise à jour de `docs/reprise.md`, le rapport de fin.
Voir §Critères de fin.

---

## C1 — Nettoyage du corpus local

### État actuel

Douze notes de la base de développement portent un troisième bloc de paragraphe qui commence par
le texte `[fixture-liens]` et porte deux ou trois marques `lienInterne`. Il a été écrit par une
session précédente pour éprouver les arêtes déduites ; il n'a rien à faire dans le corpus.

Relevé exact, le 7 septembre :

```
12 notes portent « fixture-liens » dans corps_reference ; 0 dans corps_operationnel
chacune a exactement 3 blocs : heading, paragraph, paragraph
le bloc porteur est TOUJOURS le troisième et dernier
0 ligne de `versions` porte « fixture-liens » — le paragraphe n'a jamais été versionné
notes.modifie_le et corps_reference_modifie_le portent des valeurs de semis (2026-08-13,
  2026-06-13), identiques à celles des 65 notes non touchées : la pose n'y a pas touché
```

Les douze identifiants :

```
atelier-cartographie-des-processus   atelier-modele-d-animation
atelier-parcours-utilisateur         atelier-priorisation-des-besoins
atelier-restitution-du-4-fevrier     cadrage-contraintes-et-hypotheses
cadrage-glossaire-du-projet          cadrage-note-de-perimetre
cadrage-objectifs-et-indicateurs     cadrage-parties-prenantes
cadrage-risques-identifies           cadrage-trajectoire-de-livraison
```

**La preuve du retour à l'état initial est déjà disponible, et elle est exacte.** Chacune de ces
douze notes a EXACTEMENT une ligne dans `versions`, `numero = 1`, `resume = 'Création de la
note'`. Il a été vérifié que, pour les douze, le corps privé de son bloc `[fixture-liens]` est
**égal au sens de `jsonb`** au `corps_reference` de la version 1. Le corpus n'a donc pas à être
« comparé de mémoire » : il se compare à sa propre version d'origine.

### Le changement exact

Aucun fichier du dépôt. Trois requêtes, dans cet ordre, sur la base de développement.

**Décompte avant.**

```sql
SELECT count(*) AS notes_touchees FROM notes
 WHERE corps_reference::text LIKE '%fixture-liens%'
    OR coalesce(corps_operationnel::text, '') LIKE '%fixture-liens%';
-- attendu : 12
SELECT count(*) FROM notes WHERE jsonb_array_length(liens_internes) > 0;
-- attendu : 12
```

**Le retrait.** Il retire les blocs porteurs, et **refuse de vider un corps** :

```sql
BEGIN;

UPDATE notes n
   SET corps_reference = jsonb_set(
	   n.corps_reference,
	   '{content}',
	   (SELECT coalesce(jsonb_agg(b.bloc ORDER BY b.ord), '[]'::jsonb)
	      FROM jsonb_array_elements(n.corps_reference->'content')
	           WITH ORDINALITY AS b(bloc, ord)
	     WHERE b.bloc::text NOT LIKE '%fixture-liens%')
   )
 WHERE n.corps_reference::text LIKE '%fixture-liens%'
   -- LA PARADE, DANS LA REQUÊTE : on ne retire un bloc que s'il en reste un autre.
   AND (SELECT count(*) FROM jsonb_array_elements(n.corps_reference->'content') AS b(bloc)
         WHERE b.bloc::text NOT LIKE '%fixture-liens%') > 0;
```

**Le contrôle, AVANT le `COMMIT`** — c'est lui qui décide de valider ou d'annuler :

```sql
SELECT count(*) AS restant FROM notes
 WHERE corps_reference::text LIKE '%fixture-liens%';                       -- attendu : 0

SELECT count(*) AS corps_vides FROM notes
 WHERE jsonb_array_length(corps_reference->'content') = 0;                 -- attendu : 0

SELECT count(*) AS divergentes FROM notes n JOIN versions v ON v.note_id = n.id
 WHERE v.numero = 1 AND n.identifiant IN (
	'atelier-cartographie-des-processus','atelier-modele-d-animation',
	'atelier-parcours-utilisateur','atelier-priorisation-des-besoins',
	'atelier-restitution-du-4-fevrier','cadrage-contraintes-et-hypotheses',
	'cadrage-glossaire-du-projet','cadrage-note-de-perimetre',
	'cadrage-objectifs-et-indicateurs','cadrage-parties-prenantes',
	'cadrage-risques-identifies','cadrage-trajectoire-de-livraison')
   AND n.corps_reference <> v.corps_reference;                             -- attendu : 0

SELECT count(*) FROM notes;                                                -- attendu : 77
SELECT count(*) FROM notes WHERE jsonb_array_length(liens_internes) > 0;   -- attendu : 0

COMMIT;   -- seulement si les cinq chiffres sont ceux annoncés ; sinon ROLLBACK
```

`liens_internes` est une colonne GÉNÉRÉE (migration 015) : elle se recalcule seule, rien à
resynchroniser.

### Migration

Aucune.

### Tests à écrire

Aucun. C'est un geste sur une donnée locale, pas un comportement du produit. Écrire un unitaire
qui « prouve » l'absence d'une chaîne dans une base de développement serait un contrôle de plus
sur rien, ce que `CLAUDE.md` interdit.

### Contrôle de fin

```
SELECT count(*) FROM notes WHERE corps_reference::text LIKE '%fixture-liens%';   -- 0
SELECT count(*) FROM notes;                                                      -- 77
```

Puis, dans un navigateur, en session : `/modelisation` affiche **« 0 mentions »** et les sept
relations déclarées, et `/notes/cadrage-note-de-perimetre` rend un corps de deux blocs sans le
paragraphe technique.

L'index de recherche n'a pas à être reconstruit : il a été vérifié que la requête `fixture` rend
**zéro résultat** sur l'index `notes`, parce que le corps n'est pas indexé et que l'extrait est
borné avant le troisième bloc (`src/lib/recherche/notes-indexees.ts:73-80`,
`src/lib/donnees/lecture.ts:211-217`). Le rejouer après le retrait, une fois, coûte une seconde et
ferme la question.

### Arbitrages

- **Le retrait passe par du SQL, pas par un script du dépôt** : un script versionné pour un geste
  qui ne sera jamais rejoué est de la cérémonie, et `CLAUDE.md` la refuse.
- **La comparaison de preuve se fait contre `versions.numero = 1`** : c'est la seule copie du
  corps d'avant que le produit détienne, et elle est en base — aucune mémoire, aucun fichier.
- **Le filtre porte sur le BLOC, pas sur la note** : une note dont le paragraphe technique aurait
  été le seul contenu garde son corps, parce que la clause `> 0` exclut la ligne du `UPDATE`.

### Risques et parades

| Risque | Parade |
|---|---|
| Une note perd tout son corps | La clause `AND (…) > 0` de l'`UPDATE` : une note dont il ne resterait aucun bloc n'est pas mise à jour du tout. Le contrôle `corps_vides = 0` le constate avant le `COMMIT`. |
| Un `LIKE '%fixture-liens%'` attrape un bloc légitime | Vérifié : les 12 blocs porteurs sont les seuls du corpus à contenir cette chaîne, et ce sont les 12 troisièmes blocs. Le contrôle « divergentes = 0 » le prouve après coup : le corps obtenu est EXACTEMENT celui de la version 1. |
| `modifie_le` bouge et fait vieillir douze notes | L'`UPDATE` ne nomme que `corps_reference`, et il a été vérifié qu'aucun déclencheur ne pèse sur `notes` (`pg_trigger` n'en porte que sur `univers` et `versions`). |
| Le `COMMIT` part avant les contrôles | La transaction est ouverte explicitement ; les cinq `SELECT` sont dans la même transaction et le `COMMIT` est la dernière commande tapée. |

---

## C2 — Jeu de démonstration : des liens de corps entre les notes

### État actuel

`pnpm base:peupler` charge `seeds/demonstration/*.md` par `src/lib/base/demonstration.ts`. Les
25 fichiers ne portent **aucun** lien interne : `grep -c '\[\[' seeds/demonstration/*.md` rend
zéro partout. Le jeu de démonstration est donc le seul corpus complet du dépôt qui ne peut pas
faire apparaître une arête déduite, alors que c'est exactement ce qu'il devrait montrer.

La syntaxe d'un lien interne en Markdown est `[[cible|texte]]` —
`src/lib/contenu/markdown.ts:253-254` à l'écriture, `:757-768` à la lecture. La cible est
l'**identifiant** de la note, insensible au renommage (`src/lib/edition/schema.ts:206`).

`lireLeFichier()` de `src/lib/base/demonstration.ts:69` est PRIVÉE : elle sépare l'en-tête, coupe
sur `--- OPERATIONNEL ---` et appelle `analyserMarkdown()`.

Les 22 relations déclarées du jeu sont dans `seeds/demonstration.ts:369-445`.

### Le changement exact

**1. Exporter le lecteur de fichier.** `src/lib/base/demonstration.ts:69` — renommer
`lireLeFichier` en `lireLaNoteDeDemonstration` et l'exporter. *Raison* : le test doit passer par
le parseur DU SEMEUR, sinon il éprouve un second parseur et prouve autre chose.

**2. Écrire neuf liens dans six fichiers.** Chaque lien est une phrase de contexte, jamais une
liste de renvois : le jeu doit ressembler à de la documentation.

| Fichier | Registre | Lien à écrire | Effet attendu |
|---|---|---|---|
| `42-astreinte.md` | Référence | `[[n-lire-une-alerte-de-supervision\|Lire une alerte de supervision]]` | 1 arête |
| `42-astreinte.md` | Opérationnel | `[[n-lire-une-alerte-de-supervision\|la lecture d'alerte]]` | **aucune arête de plus** — dédoublonnage |
| `42-astreinte.md` | Référence | `[[n-bascule-du-reseau-de-secours\|Bascule du réseau de secours]]` | 1 arête |
| `43-supervision.md` | Référence | `[[n-restaurer-une-sauvegarde-postgresql\|Restaurer une sauvegarde PostgreSQL]]` | 1 arête |
| `31-ns-materiel.md` | Référence | `[[n-regles-d-architecture\|Règles d'architecture]]` | 1 arête |
| `31-ns-materiel.md` | Référence | `[[n-note-de-service-equipement-du-teletravail\|équipement du télétravail]]` | 1 arête |
| `32-ns-teletravail.md` | Référence | `[[n-note-de-service-commande-de-materiel\|commande de matériel]]` | 1 arête — **les deux sens se gardent** |
| `40-restaurer-sauvegarde.md` | Référence | `[[n-bkp-01\|bkp-01]]` | **aucune arête** — `n-restaurer-… documente n-bkp-01` est déclarée |
| `60-fiche-pg-prod-01.md` | Référence | `[[n-bkp-01\|bkp-01]]` | **aucune arête** — `n-bkp-01 sauvegarde n-pg-prod-01` est déclarée **en sens inverse** |

Neuf liens écrits, huit paires orientées distinctes, **six arêtes déduites** sur le périmètre
global. Ces six paires ont été vérifiées absentes de `seeds/demonstration.ts` `RELATIONS`.

### Migration

Aucune.

### Tests à écrire

Fichier neuf : **`seeds/demonstration.test.ts`**. Il ne touche pas la base : il lit les fichiers
`.md`, les analyse avec `lireLaNoteDeDemonstration()`, tire les cibles avec `liensInternes()`
(`src/lib/contenu/document.ts:759`), monte les `RELATIONS` du jeu en `RelationLisible` d'origine
`declaree`, puis appelle `aretesDeMention()` sur le périmètre global.

| Nom du contrôle | Ce qu'il vérifie |
|---|---|
| `le jeu de démonstration porte des liens de corps` | Au moins six notes portent au moins un `lienInterne` : sans cela, tout le reste est vide et vert pour rien. |
| `six arêtes déduites, pas une de plus` | `aretesDeMention(...).length === 6`. |
| `chaque arête déduite porte le type « mentionne »` | Toutes les arêtes ont `type === TYPE_DE_MENTION`, et `LIBELLES_DE_MENTION.sortant === 'mentionne'`. |
| `l'arête va de la note qui écrit vers la note citée` | La paire `n-astreinte-conduite-a-tenir → n-lire-une-alerte-de-supervision` est présente ; la paire inverse ne l'est pas. |
| `deux citations de la même note ne font qu'une arête` | `n-astreinte-conduite-a-tenir` cite `n-lire-une-alerte-de-supervision` dans les DEUX registres ; il n'y a qu'une arête entre elles. |
| `les deux sens se gardent quand les deux notes se citent` | `materiel → teletravail` ET `teletravail → materiel` sont toutes deux présentes. |
| `une relation déclarée efface la mention, dans le sens direct` | Aucune arête entre `n-restaurer-une-sauvegarde-postgresql` et `n-bkp-01`. |
| `une relation déclarée efface la mention, dans le sens inverse` | Aucune arête entre `n-pg-prod-01` et `n-bkp-01`, alors que la relation déclarée va de `n-bkp-01` vers `n-pg-prod-01`. |
| `toute cible de lien interne désigne une note du jeu` | Un `[[…]]` vers un identifiant inexistant est un lien mort dans le jeu de démonstration ; le test le refuse. |

### Contrôle de fin

`pnpm test:unit` vert, puis, dans un navigateur, **sur une base d'épreuve jetable** (voir Risques) :

```
NOM_BASE=codicillus_epreuve pnpm base:migrer
NOM_BASE=codicillus_epreuve pnpm base:peupler
NOM_BASE=codicillus_epreuve pnpm dev
```

`/modelisation` affiche **« 6 mentions »**, six traits fins, et le panneau « Lien choisi » d'un de
ces traits dit « Nature : Mention » et offre « Qualifier ce lien ».

### Arbitrages

- **Les liens s'écrivent dans les fichiers `.md`, pas dans une table de `seeds/demonstration.ts`**
  : un lien de corps EST du corps, et le porter ailleurs ferait mentir le mécanisme qu'on
  démontre — la colonne générée ne lit que les corps.
- **Le test est pur et ne touche pas la base** : `pnpm base:peupler` REMPLACE le contenu, et un
  unitaire ne doit jamais pouvoir détruire un corpus.
- **Le test passe par le parseur du semeur** : deux parseurs finiraient par diverger, et le test
  déclarerait alors vraie une chose que le semeur écrirait autrement.
- **Deux cas d'effacement, un par sens** : la règle de préséance est écrite sans ordre
  (`src/lib/graphe/mentions.ts`, `cleDePaire`), et un seul sens ne l'éprouverait qu'à moitié.

### Risques et parades

| Risque | Parade |
|---|---|
| **`pnpm base:peupler` détruit les 77 notes locales** | Il ne se lance JAMAIS sur la base de développement. Toujours `NOM_BASE=codicillus_epreuve`, une base créée pour l'occasion (`docker exec codicillus-db-1 createdb -U codicillus codicillus_epreuve`). `.env` ne porte pas `NOM_BASE`, et `configurationDeConnexion()` la fait primer sur `BASE_POSTGRES` (`src/lib/base/connexion.ts:103`). **Avant tout autre geste**, lire la ligne `base : …` que `base/base.mjs` imprime au démarrage : si elle ne nomme pas la base d'épreuve, on s'arrête. |
| Un identifiant de cible mal orthographié fait un lien mort | Le contrôle `toute cible de lien interne désigne une note du jeu`. |
| Le compte de six arêtes se périme au prochain lien ajouté | C'est voulu : le chiffre est le contrat. Ajouter un lien oblige à mettre le compte à jour, ce qui est la seule façon qu'un compte reste vrai. |

---

## C3 — Points de défaillance unique : l'attribut « porte une dépendance »

### État actuel — et il n'est pas celui que le chantier suppose

**L'attribut existe déjà, et le calcul le lit déjà.** Relevé :

- `base/migrations/002_socle.montee.sql:277` — `technique boolean NOT NULL DEFAULT false` dans
  `types_de_relation`.
- `src/lib/base/schema.ts:356-357` — la colonne, glosée « Porte-t-elle une dépendance technique ?
  “Documente” n'en est pas une ».
- `src/lib/donnees/lecture.ts:524-531` — `lireRelationsTechniques()` lit la colonne, rien d'autre.
- `src/lib/graphe/cartographie.ts:722-727` — `estTechnique()` est un `includes` sur la liste
  reçue : **aucune clé de type n'y est écrite**.
- `src/lib/graphe/cartographie.ts:660-704` — `pointsArticulation(g, techniques)` prend la liste
  en paramètre exigé.
- `src/routes/modelisation/+page.server.ts:90` — passe `relationsTechniques` lu en base.
- `src/routes/console/types-de-relations/+page.server.ts:105` et `:116-124` — la création et la
  modification honorent `CHAMP_TECHNIQUE`.
- `src/vues/V-30.svelte:612-617` — la case `#f-technique`, libellée « Dépendance technique »,
  existe au formulaire ; `:425-427` affiche le marqueur « technique » dans la liste ;
  `:729-731` avertit à la suppression d'un type technique.
- `seeds/demonstration.ts:330-353` — `depend-de`, `heberge` et `sauvegarde` portent
  `technique: true` ; `documente`, `encadre`, `contact`, `remplace` non.

**Il n'y a donc ni migration à poser, ni clé en dur à retirer, ni écran d'administration à
écrire.** La seule constante de types techniques du dépôt, `RELATIONS_TECHNIQUES`
(`seeds/corpus.ts:1928`), n'est lue que par `src/lib/base/semence.ts:486` — le SEMEUR, qui décide
quels types de SON jeu sont techniques — et par trois fichiers de test. `eslint.config.js`
exempte ce fichier pour cette raison précise. Aucun chemin de lecture du produit ne la voit.

### Ce qui manque vraiment, et c'est un défaut

**L'écran ne dit pas quand la question n'a pas de sens.** Sur une instance dont aucun type ne
porte l'attribut — cas de toute instance neuve, la colonne valant `false` par défaut —,
`pointsArticulation()` reçoit une liste vide, ne trouve aucun point de rupture, et l'écran
n'affiche aucun avertissement. Il dit donc silencieusement « aucun point de défaillance unique »
là où la vérité est « personne n'a dit ce qui porte une dépendance ». C'est un mensonge par
omission, du même genre que la recherche qui affirmait « aucun guide ne répond » moteur éteint.

Sur la base de développement, `depend-de` est bien marqué technique ; sur une instance neuve, rien
ne l'est.

### Le changement exact

**1. `src/routes/modelisation/+page.server.ts`.** Servir deux valeurs de plus :

```ts
/** Les types qui portent une dépendance, tels que la table les marque. */
nombreDeTypesPorteurs: relationsTechniques.length,
/** L'appelant peut-il aller les régler ? La console n'est ouverte qu'à lui. */
consoleOuverte: locals.identite.type === 'authentifie'
	&& locals.identite.role === 'administrateur',
```

Et remplacer le commentaire du bloc `ruptures` (`:83-89`), qui affirme que `estTechnique()`
compare à ce que la table marque — vrai — mais tait le cas où la table ne marque rien.

**2. `src/routes/modelisation/+page.svelte`.** Sous la bande de mesures, un bloc rendu
**uniquement** quand `data.nombreDeTypesPorteurs === 0` :

> **Aucun type de relation ne porte de dépendance.** Les points de défaillance unique ne sont donc
> pas calculés : le produit ne sait pas encore quelles relations font dépendre une note d'une
> autre. Un administrateur le règle sur *Console › Types de relations*, case « Dépendance
> technique ».

La phrase d'issue n'est offerte qu'à l'administrateur (`data.consoleOuverte`) : promettre une
adresse qu'on ne peut pas ouvrir est le motif de `V-07`.

**3. `src/routes/modelisation/modelisation.css`.** Une classe `.mod-avis`, sur les jetons du
socle, pour ce bloc et pour lui seul.

### Migration

**Aucune.** La colonne existe depuis la migration `002`. Le déclarer ici est la seule chose
honnête à faire du chantier tel qu'il était formulé.

### Tests à écrire

Les trois assertions portent sur `pointsArticulation()` de `src/lib/graphe/cartographie.ts`,
qu'aucun lot de la vague 2 ne touche. Elles sont donc écrites dans
**`src/lib/graphe/modele.test.ts`**, le fichier neuf du lot E en vague 3, et elles sont reprises
ici parce que c'est ce chantier qui les exige.

| Nom du contrôle | Ce qu'il vérifie |
|---|---|
| `aucun type porteur : aucun point de rupture, et ce n'est pas une bonne nouvelle` | `pointsArticulation(g, [])` rend un ensemble vide sur un graphe qui EN PORTERAIT un si le type était marqué. Le même graphe avec `['depend-de']` rend le point attendu. |
| `une arête déduite ne fabrique jamais un point de rupture` | Un graphe dont la seule arête coupante est de type `mentionne` : `pointsArticulation()` rend un ensemble vide, quelle que soit la liste des types porteurs. |
| `un type porteur créé en console est pris en compte sans qu'aucun nom soit écrit` | Une liste `['un-type-que-personne-n-a-prevu']` produit bien un point de rupture sur un graphe relié par ce type. |

### Contrôle de fin

Sur une base neuve (`pnpm base:migrer` + `pnpm base:administrateur`, rien de semé), créer un
univers, un domaine, deux notes, un type de relation **sans** cocher « Dépendance technique »,
puis relier les deux notes : `/modelisation` affiche l'avis « Aucun type de relation ne porte de
dépendance » et le lien vers la console. Cocher la case en console, recharger : l'avis disparaît.

### Arbitrages

- **Aucune migration n'est posée** : la colonne existe depuis `002`, et en poser une seconde
  serait une migration qui ne change rien à la base.
- **Le libellé à l'écran reste « Dépendance technique »** : `mockups/V-30-console-types-relations.html`
  le porte mot pour mot, le paquet de refonte ne couvre pas V-30, et la maquette prime là où il
  se tait. « Porte une dépendance » nomme le concept ; `technique` nomme la colonne.
- **`RELATIONS_TECHNIQUES` de `seeds/corpus.ts` n'est pas retirée** : c'est une donnée du jeu de
  semence, lue par le seul semeur, et la retirer casserait `pnpm base:semer` sans rien gagner.
- **L'avis est rendu par `/modelisation` et pas par `/cartographie`** : la cartographie affiche
  les points de rupture parmi d'autres mesures, la modélisation en fait une garantie ; c'est là
  que le silence est trompeur.

### Ce que devient l'attribut sur une instance existante

`technique` vaut `false` par défaut depuis `002`. Sur une instance dont les types ne sont pas ceux
du jeu de démonstration — celle de développement porte `depend-de`, `documente`, `complete`,
`corrige`, `remplace` —, **chaque type conserve la valeur qu'il a**, et un type créé en console
sans cocher la case n'en porte aucune. Aucune reprise automatique n'est faite, et c'est délibéré :
deviner qu'un type nommé `depend-de` porte une dépendance marcherait sur le français et sur rien
d'autre. L'écran dit le manque, l'administrateur tranche.

### Risques et parades

| Risque | Parade |
|---|---|
| L'avis s'affiche sur une instance où l'attribut est réglé | Il est conditionné à `nombreDeTypesPorteurs === 0`, lu en base à chaque chargement. |
| Le lien vers la console rend 404 à un non-administrateur | Il n'est pas émis : `data.consoleOuverte` le garde (`P-03`, `P-09`). |

---

## C4 — Hydratation

### Ce que « éprouvé sans hydratation » voulait dire

`src/routes/modelisation/+page.svelte:5-9` porte la phrase du lot précédent : « ELLE FONCTIONNE
SANS HYDRATATION, ET C'EST LE CHOIX STRUCTURANT. Tous les gestes passent par un formulaire qui
poste, et la sélection d'une arête passe par l'adresse. » Le rapport précédent affirmait donc que
l'écran avait été **éprouvé au serveur seul** : chaque geste vérifié par un `POST` de formulaire
et chaque sélection par une adresse, sans qu'un navigateur exécute le paquet client.

C'est une propriété réelle et souhaitable — un écran qui marche script coupé est un écran qu'on
peut réparer —, mais **ce n'est pas une preuve que l'écran marche**. Aucune route du dépôt ne pose
`export const csr = false` (vérifié : `grep -rn 'export const csr' src/routes` ne rend rien) : en
usage réel, SvelteKit hydrate `/modelisation` et **intercepte** les clics. Ce que le serveur
seul ne peut pas montrer : le routeur client qui reprend un `<a>` placé **dans du SVG**, la
navigation client qui relance le chargeur sans recharger la page, la redirection 303 d'une action
suivie par le client, et l'état du panneau après cette navigation.

Un point a été vérifié dans le code du framework et n'est donc PAS un risque :
`node_modules/@sveltejs/kit/src/runtime/client/utils.js:133` et `client.js:2725` traitent
explicitement `SVGAElement` et lisent `a.href.baseVal`. Les ancres SVG du dessin sont donc bien
prises par le routeur.

### Le changement exact

Aucun fichier du dépôt. **Les clics sont rejoués dans un navigateur, avec le JavaScript client**,
et le relevé est porté au rapport de fin.

**Comment.** Playwright est déjà une dépendance de développement (`@playwright/test` 1.62.1) et
son Chromium est installé (`~/.cache/ms-playwright/chromium-1234`). Le rejeu se fait par un script
**jetable**, écrit dans le répertoire de travail temporaire de la session, **jamais commité** :
`docs/reprise.md` interdit un troisième contrôle permanent, et cette consigne tient.

Le script ouvre une session (`ADMIN_IDENTIFIANT` / `MDP_ADMINISTRATEUR` de `.env`), va sur
`/modelisation`, et **clique** — jamais de `page.goto()` pour atteindre un état qu'un clic doit
atteindre. Il écoute `page.on('console')` et `page.on('pageerror')` et échoue à la première
entrée.

Les onze gestes à rejouer, dans cet ordre :

1. Choisir un périmètre dans le sélecteur, cliquer **Afficher**.
2. Cliquer un **trait déclaré** du dessin ; le panneau « Lien choisi » se remplit.
3. Changer son type, cliquer **Appliquer** ; le trait change de libellé.
4. Cliquer un trait, cliquer **Retirer** ; le trait disparaît, le compteur baisse de un.
5. Déclarer une relation par le formulaire « Déclarer une relation » ; le trait apparaît.
6. Cliquer un **trait de mention** ; le panneau offre « Qualifier ce lien » et **pas** « Retirer ».
7. Qualifier cette mention ; elle devient une relation déclarée et le trait s'épaissit.
8. Cliquer **Proposer N relation(s) à confirmer** ; N traits tiretés apparaissent.
9. Cliquer une proposition, cliquer **Confirmer**.
10. Cliquer une proposition, cliquer **Rejeter** ; elle disparaît. Recliquer **Proposer** : elle
    **ne revient pas** (chantier 9).
11. Ouvrir la liste « Les N liens du modèle, en liste », vérifier qu'elle porte le même nombre
    d'arêtes que le dessin.

Et deux gestes de la navigation, une fois le chantier 8 posé : l'entrée **Modélisation** du rail,
et la tuile **Modélisation** du bloc EXPLORER d'une page de domaine.

### Migration

Aucune.

### Tests à écrire

Aucun unitaire. C'est un contrôle de navigateur, et son résultat est une ligne du rapport de fin.

### Contrôle de fin

Les onze gestes passent, **zéro entrée de console**, zéro `pageerror`. Le même parcours est rejoué
une seconde fois **script client coupé** (`context = await browser.newContext({ javaScriptEnabled:
false })`) : les onze gestes doivent encore passer. Les deux passages sont rapportés.

### Arbitrages

- **Le script n'entre pas dans le dépôt** : `docs/reprise.md` dit « N'en ajoute pas un
  troisième », et un rejeu de clics est un contrôle. Il vit le temps de la session.
- **Le rejeu se fait sur la base de développement**, pas sur une base d'épreuve : c'est celle qui
  porte les sept relations réelles et le corpus réel, donc celle où un défaut se voit. Il écrit
  et retire des relations ; le lot rétablit l'état de départ à la fin et le prouve par un compte
  (`SELECT origine, count(*) FROM relations GROUP BY 1` — attendu `declaree|7`).
- **Les deux passages, avec et sans script** : la propriété « marche sans hydratation » est réelle
  et vaut d'être gardée ; ne rejouer qu'avec le script la perdrait au premier lot suivant.

### Risques et parades

| Risque | Parade |
|---|---|
| Le rejeu laisse la base de développement modifiée | Compte des relations avant et après, et retrait explicite de ce que le script a posé. Le contrôle est au rapport. |
| Le cache de pré-groupage de Vite est partagé et casse l'hydratation sans erreur visible | `rm -rf node_modules/.vite` avant de lancer `pnpm dev`, comme `CLAUDE.md` le dit. Le symptôme, `Outdated Optimize Dep`, se lit dans la console que le script écoute. |
| Le serveur de développement d'une autre copie occupe le port | Repérer le processus par son **PID**, jamais par `pgrep` sur un motif, et tuer le `vite` fils plutôt que le `pnpm dev` père. |

---

## C5 — Couverture de tests

### État actuel — l'inventaire

**Ce qui couvre les mentions aujourd'hui.**

| Fichier | Contrôles |
|---|---|
| `src/lib/graphe/mentions.test.ts` | 8 : orientation ; les deux sens gardés quand deux notes se citent ; dédoublonnage d'un corps qui cite deux fois ; les deux extrémités dans le périmètre ; effacement par une relation déclarée ; effacement par une relation déclarée **en sens inverse** ; une note qui se cite elle-même ; un lien vers une note illisible ; ordre lexical stable. |
| `src/lib/graphe/propositions.test.ts` | 7 : aucune proposition sans relation déclarée ; le type dominant du couple ; le support minimal de deux exemples ; le silence sur une égalité ; le sens du couple ; aucune proposition appuyée sur une proposition ; le relevé d'usage par couple. |
| `src/lib/graphe/couches.test.ts` | 6 : graphe vide ; étagement selon le sens ; plus long chemin ; circuit sans perte de nœud et arête de retour nommée ; même dessin quel que soit l'ordre d'entrée ; couches centrées. |
| `src/lib/donnees/outils.test.ts` | modifié au lot précédent — porte la lecture de `liens_internes`. |

**Ce qui couvre `/modelisation` aujourd'hui : une ligne.** `src/lib/auth/garde.test.ts:55` vérifie
que `/modelisation` est en régime `redirection`. C'est tout. Recherché : aucun autre fichier de
test du dépôt ne nomme `modelisation`.

**Ce qui manque, et qui n'est couvert par aucun autre chantier.**

1. `lireLeGraphe()` (`src/routes/cartographie/lecture-du-graphe.ts`) — la fusion des arêtes
   déclarées et déduites, et l'ajout des deux libellés de mention au vocabulaire lu en base.
   Aucun test.
2. La forme servie par le chargeur de `/modelisation` — le passage des arêtes du graphe aux
   objets `{cle, id, de, vers, type, origine, libelle, technique, retour, titreDe, titreVers}`.
   Aucun test.
3. `pointsArticulation()` face à une liste de types porteurs vide, et face à une arête déduite.
   Aucun test (c'est le chantier 3 qui les demande).
4. Les notes servies aux deux sélecteurs de déclaration : **toutes** celles du périmètre, y
   compris celles que le dessin a retirées faute de relation. Aucun test, et c'est la propriété
   qui rend possible le premier lien d'une note.

Les chantiers 2, 6, 7 et 9 écrivent chacun leurs propres tests ; ce chantier écrit ceux-là et
seulement ceux-là.

### Le changement exact

**La règle de la maison d'abord.** `src/lib/donnees/relations.test.ts:1-8` la pose en toutes
lettres : « ce qui exige un conteneur n'est pas ici […] elles sont éprouvées au navigateur, contre
la base réelle ». Ce chantier la tient : rien de ce qu'il écrit ne parle à PostgreSQL.

**1. Une extraction pure dans `src/routes/cartographie/lecture-du-graphe.ts`.** La fonction fait
aujourd'hui deux choses : cinq lectures en base, puis un assemblage — le calcul des mentions, la
fusion des deux natures d'arêtes, l'ajout des deux libellés de mention au vocabulaire lu. Le
second est pur et n'a aucune raison d'être inatteignable :

```ts
/**
 * L'ASSEMBLAGE DU GRAPHE, SANS UNE SEULE LECTURE. Il était mêlé aux cinq requêtes de
 * `lireLeGraphe()`, et la règle de préséance entre une relation déclarée et une mention
 * n'était donc éprouvable qu'au navigateur, contre une base réelle.
 */
export function assemblerLeGraphe(
	notes: readonly Note[],
	declarees: readonly RelationLisible[],
	typesRelation: Record<string, LibellesDeRelation>,
	relationsTechniques: readonly CleDeTypeDeRelation[],
	liensParNote: ReadonlyMap<string, readonly string[]>,
	perimetre: PerimetreDAffichage
): GrapheLu
```

`lireLeGraphe()` garde ses cinq lectures et l'appelle. Aucun appelant ne change.

**2. `src/routes/cartographie/lecture-du-graphe.test.ts`** *(neuf)* — pur, aucun faux, aucun
`vi.mock` : il appelle `assemblerLeGraphe()` avec des littéraux.

**3. `src/lib/graphe/modele.test.ts`** *(neuf)* — pur lui aussi : il monte des notes et des
relations en mémoire et éprouve `sousGraphe` + `aretesDeMention` + `pointsArticulation` +
`disposerEnCouches` tels que le chargeur les enchaîne.

### Migration

Aucune.

### Tests à écrire

**`lecture-du-graphe.test.ts`** — sur `assemblerLeGraphe()`

| Nom | Ce qu'il vérifie |
|---|---|
| `les arêtes déclarées et déduites descendent mêlées, distinguées par leur origine` | Le tableau rendu porte les deux, et `origine` les sépare. |
| `le vocabulaire rendu porte les libellés de la base PLUS les deux mots de la mention` | `typesRelation['mentionne']` vaut `LIBELLES_DE_MENTION` et les clés lues en base sont intactes. |
| `la base ne connaît pas le type « mentionne »` | Aucune écriture n'est faite, et la clé n'est ajoutée qu'au dictionnaire rendu. |
| `un périmètre d'affichage borne les mentions, pas les relations déclarées` | Une relation déclarée dont une extrémité sort du périmètre reste ; une mention dans le même cas disparaît. |

**`modele.test.ts`**

| Nom | Ce qu'il vérifie |
|---|---|
| `aucun type porteur : aucun point de rupture, et ce n'est pas une bonne nouvelle` | Voir §C3. |
| `une arête déduite ne fabrique jamais un point de rupture` | Voir §C3. |
| `un type porteur créé en console est pris en compte sans qu'aucun nom soit écrit` | Voir §C3. |
| `les notes isolées sortent du dessin et restent dans les sélecteurs` | `sousGraphe(..., 'retirees')` retire la note que rien ne relie ; la liste des notes du périmètre la garde. |
| `l'arête servie porte le titre de ses deux extrémités, jamais l'identifiant` | Sur des notes connues, `titreDe` et `titreVers` sont des titres ; sur une extrémité absente de la table des titres, l'identifiant est le repli. |
| `la clé d'une arête distingue deux relations de types différents sur la même paire` | `cleDArete` rend deux clés distinctes — c'est ce qui rend le chantier 7 nécessaire. |

### Contrôle de fin

`pnpm test:unit` : **88 → 90 fichiers**, et le total de contrôles augmente d'au moins dix.

### Arbitrages

- **Deux fichiers de test neufs plutôt que des ajouts aux fichiers existants** : les fichiers
  existants sont touchés par les lots de la vague 2, et une vague ne réécrit pas ce qu'une autre
  écrit.
- **L'assemblage est extrait plutôt que simulé** : `vi.mock` sur trois modules ferait éprouver
  des faux plutôt que le produit, et le dépôt ne s'en sert qu'une fois, pour une atomicité de
  transaction qu'aucune extraction ne peut rendre pure.
- **Rien n'est écrit pour l'accessibilité du dessin** : `P-06` est déjà tenu par la restitution en
  liste, qui existe (`+page.svelte:352-364`), et un test qui compterait ses `<li>` n'ajouterait
  rien à ce que le chantier 7 éprouve déjà.

### Risques et parades

| Risque | Parade |
|---|---|
| L'extraction change le comportement de `lireLeGraphe()` | Le corps déplacé est repris **tel quel**, sans une ligne réécrite ; les deux cartographies et `/modelisation` l'appellent, et le passage à froid les ouvre toutes les trois. |
| Le test fige une signature qui bouge | Il est écrit en vague 3, après que la vague 2 a fixé la forme servie. |

---

## C6 — Étagement dans `/modelisation`

### État actuel

`src/lib/graphe/couches.ts:222-231` — `disposerEnCouches(g)` étage sur **toutes** les arêtes du
graphe, déclarées comme déduites. Le commentaire l'assume et le justifie : « Étager sur les seules
déclarées donnerait, sur un corpus consolidé au lien de corps et sans une relation saisie, UNE
couche unique portant tout le périmètre : un peigne, pas un modèle. »

**Ce qui manque : l'écran ne le dit pas.** `+page.svelte:153-158` affiche quatre compteurs —
déclarées, à confirmer, mentions, notes reliées — et rien n'indique que la position verticale d'un
nœud dépend aussi des mentions. Un lecteur qui prend le dessin pour un modèle de dépendances
déclarées se trompe sans être averti.

Et il n'y a **aucun réglage** : `disposerEnCouches()` ne prend qu'un argument.

### Le changement exact

**1. `src/lib/graphe/couches.ts`.** Un second paramètre EXIGÉ, sans défaut :

```ts
/**
 * SUR QUOI L'ÉTAGEMENT S'APPUIE. `tout` : les arêtes déclarées ET les mentions —
 * le dessin le plus riche, et celui qui répond sur un corpus consolidé au lien de
 * corps. `declarees` : les seules relations qu'un humain a saisies — le modèle au
 * sens strict, où la position ne doit rien à une citation.
 *
 * IL N'A PAS DE DÉFAUT, ET C'EST LA RÈGLE DE `SortDesIsolees` : un défaut ferait
 * pencher un appelant sans que personne l'ait décidé.
 */
export type AssiseDeLEtagement = 'tout' | 'declarees';

export function disposerEnCouches(g: Graphe, assise: AssiseDeLEtagement): DispositionEnCouches
```

Mise en œuvre : les arêtes **hors étagement** sont celles dont `origine !== 'declaree'` quand
l'assise vaut `declarees`. Elles s'ajoutent à l'ensemble déjà écarté par `aretesDeRetour()` :

- `aretesDeRetour()` ne parcourt QUE les arêtes retenues pour l'étagement — sinon une mention
  fermerait un circuit qu'elle ne devrait pas fermer ;
- `etages()` et `ordonner()` reçoivent `ecartees = retours ∪ horsEtagement` ;
- `DispositionEnCouches` gagne un champ `horsEtagement: ReadonlySet<string>` **distinct** de
  `retours` : une mention écartée n'est pas une arête qui remonte, et l'écran ne dira pas d'elle
  « ce lien referme un circuit ».

Une arête écartée qui, du coup, ne descend plus est déjà dessinée par le crochet latéral
(`+page.svelte:56` — `a.retour || source.couche >= cible.couche`) : aucun cas nouveau à traiter.

**2. `src/routes/modelisation/+page.server.ts`.** Lire le réglage dans l'adresse, comme le
périmètre, et le rendre :

```ts
const assise = url.searchParams.get('etagement') === 'declarees' ? 'declarees' : 'tout';
const disposition = disposerEnCouches(graphe, assise);
```

Le rendre dans `data` (`assise`), et le porter dans le champ caché de **tous** les formulaires
et dans `retour()`, exactement comme `perimetre` : sans cela le premier geste ramènerait
l'étagement à son défaut.

**3. `src/routes/modelisation/+page.svelte`.**

- Deux liens, à côté du sélecteur de périmètre : **« Sur tout ce qui est dessiné »** et
  **« Sur les seules relations déclarées »**, celui qui est actif portant `aria-current="true"`.
  Des liens, pas un script : l'adresse obtenue est partageable.
- Une phrase sous les compteurs, **toujours** rendue, qui dit sur quoi on regarde :
  - assise `tout` : *« L'étagement s'appuie sur les N relations déclarées et les M mentions : la
    hauteur d'une note dépend aussi des liens écrits dans les corps. »*
  - assise `declarees` : *« L'étagement s'appuie sur les seules N relations déclarées. Les M
    mentions sont dessinées, elles ne placent rien. »*
- Le champ caché `etagement` dans les sept formulaires.

**4. `modelisation.css`.** Une classe `.mod-assise` pour la paire de liens et la phrase.

### Migration

Aucune.

### Est-ce que ce réglage s'appuie sur « porte une dépendance » ? **Non.**

Et c'est une décision, pas un oubli. Les deux attributs répondent à deux questions différentes :

- **`origine`** dit **qui l'a affirmé** — un humain (`declaree`) ou le corps d'une note
  (`deduite`). C'est la question de l'étagement : « la position doit-elle quelque chose à une
  citation ? »
- **`technique`** dit **ce que le lien porte** — une dépendance, ou une relation éditoriale. C'est
  la question des points de rupture : « retirer cette note en casse-t-elle une autre ? »

Étager sur les seules relations **techniques** effondrerait tout corpus documentaire en une seule
couche : sur la base de développement, un seul type sur cinq porte l'attribut, et sur le jeu de
démonstration trois sur sept. Le réglage porte donc sur l'origine, et sur rien d'autre.

### Tests à écrire

Dans `src/lib/graphe/couches.test.ts` (lot D) :

| Nom | Ce qu'il vérifie |
|---|---|
| `assise « tout » : une mention étage comme une relation déclarée` | A→B déclarée, B→C mention : C est à la couche 2. |
| `assise « declarees » : une mention ne place rien` | Même graphe, assise `declarees` : C est à la couche 0, et l'arête B→C est dans `horsEtagement`. |
| `une arête écartée de l'étagement n'est pas une arête de retour` | Le même cas : `retours` est vide, `horsEtagement` porte la clé de B→C. |
| `une mention ne peut pas fermer un circuit qu'elle est seule à fermer` | A→B déclarée, B→A mention, assise `declarees` : `retours` est vide. |
| `aucun nœud ne disparaît quand l'assise se réduit` | Les deux assises rendent le même ensemble de clés dans `places`. |
| `l'assise est exigée` | Purement typée : `disposerEnCouches(g)` ne compile pas. Le contrôle est `pnpm check`, pas un unitaire. |

### Contrôle de fin

Dans un navigateur, sur le jeu de démonstration (base d'épreuve, après le chantier 2) :
`/modelisation` affiche la phrase « … et les 6 mentions » ; cliquer **« Sur les seules relations
déclarées »** change la phrase, réétage le dessin, et l'adresse porte `?etagement=declarees`.
Déclarer une relation depuis cet état revient sur un écran qui a **gardé** le réglage.

### Arbitrages

- **Le réglage porte sur l'origine, pas sur l'attribut de dépendance** — justifié ci-dessus.
- **Le réglage est dans l'adresse, pas dans un état de composant** : un modèle qu'on montre à
  quelqu'un se montre par son adresse, et l'écran doit continuer de marcher script coupé.
- **Le paramètre est exigé, sans défaut** : `SortDesIsolees` a posé la règle dans ce même fichier,
  et un défaut ferait pencher `/cartographie` le jour où elle appellera cette fonction.
- **Deux valeurs seulement** : une troisième — « sur les seules relations techniques » — a été
  écartée, elle rendrait un peigne sur tout corpus documentaire.
- **La phrase est toujours affichée**, y compris à zéro mention : « … et les 0 mentions » dit que
  la règle existe, là où une phrase conditionnelle laisserait croire qu'elle change.

### Risques et parades

| Risque | Parade |
|---|---|
| Le réglage se perd au premier geste | Le champ caché est ajouté aux **sept** formulaires et à `retour()` ; le contrôle de fin le rejoue explicitement. |
| Une valeur inconnue de `?etagement=` fait sortir l'écran | La lecture est un `=== 'declarees'` : toute autre valeur vaut `tout`. Ignorer plutôt que refuser, §4.2 de `docs/routes.md`. |
| `horsEtagement` est confondu avec `retours` par la vue | Deux champs distincts, et un test qui l'exige. |

---

## C7 — Traits superposés

### État actuel

Le dessin est dans `src/routes/modelisation/+page.svelte` :

- `cheminDArete()` (`:52-67`) calcule un chemin cubique : du bas de la source au haut de la
  cible, ou un crochet latéral quand l'arête remonte ou reste dans la couche.
- Chaque arête est rendue deux fois (`:193-206`) : le trait visible, puis une **prise** — le même
  chemin, `stroke-width: 12`, transparente (`modelisation.css:122-127`) — enveloppée dans un `<a>`.

**Le défaut.** Le chemin ne dépend **que** des positions des deux extrémités. Deux arêtes qui
relient la même paire orientée reçoivent donc un chemin **rigoureusement identique**, et leurs
deux prises se superposent : le clic atteint toujours celle que le balisage rend en dernier,
c'est-à-dire la dernière dans l'ordre de `cleDArete`. L'autre est **inatteignable**.

Ce n'est pas un cas de laboratoire : `relations_unicite` porte sur `(source_id, cible_id,
type_de_relation_id)`, donc deux relations de types différents entre les deux mêmes notes sont
parfaitement légales, et c'est exactement ce que le jeu de démonstration produit dès qu'on relie
deux notes deux fois. Le second cas est celui de deux arêtes qui **se croisent ou se recouvrent
sans partager d'extrémité** : une arête longue qui saute une couche passe sur les nœuds et sur les
traits intermédiaires.

Il faut aussi noter que la géométrie vit **dans un fichier `.svelte`** : elle n'est donc
éprouvable par aucun unitaire du dépôt, qui n'a pas de rendu de composant hors
`src/vues/*.test.ts`.

### La solution retenue

**Trois mesures, dans cet ordre. Toutes déterministes, aucun tirage.**

1. **L'éventail des parallèles.** Les arêtes qui partagent la même paire **non orientée** sont
   groupées, classées par `cleDArete` — l'ordre lexical, déjà celui du reste du module —, et
   chacune reçoit un rang `k` sur `n`. Son chemin est écarté perpendiculairement à la corde
   source→cible de `(k − (n − 1) / 2) × ÉCART_DE_PARALLÈLE`, appliqué aux **points de contrôle**
   de la cubique. À `n = 1`, l'écart vaut zéro et le tracé est exactement celui d'aujourd'hui :
   aucun dessin existant ne bouge.

2. **Une poignée par arête.** La cible de clic n'est plus seulement la prise : chaque arête reçoit
   un **disque** de rayon 9, placé au point de paramètre `t = 0,5` de **son propre** chemin — donc
   sur son tracé, jamais à côté. C'est lui qui porte le `<a>` et le nom accessible. La prise large
   reste, sous le disque, pour le confort.

3. **L'écartement des poignées.** Deux poignées à moins de `2 × 9 + 2` pixels l'une de l'autre —
   ce que produit un croisement quelconque — sont **glissées le long de leur propre chemin** :
   dans l'ordre de `cleDArete`, la seconde essaie `t = 0,42`, puis `0,58`, puis `0,34`, puis
   `0,66`, jusqu'à `0,18` / `0,82` ; au-delà, elle garde `0,5` et le recouvrement est assumé
   plutôt que la poignée déplacée hors de son arête. **Une poignée qui quitte son trait serait un
   mensonge** ; on préfère un cas rare non résolu à un cas courant faussé.

### Le changement exact

**1. Fichier neuf : `src/lib/graphe/traces.ts`** *(lot B, vague 1)*. La géométrie sort du
`.svelte`, à l'identique pour le cas simple, augmentée des trois mesures.

```ts
export interface AreteATracer {
	readonly cle: string;
	readonly de: string;
	readonly vers: string;
	readonly retour: boolean;
}

export interface NoeudPlace {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly couche: number;
}

export interface TraceDArete {
	readonly cle: string;
	/** L'attribut `d` du chemin — le trait visible ET sa prise. */
	readonly d: string;
	/** Le centre du disque de clic. Toujours SUR le chemin ci-dessus. */
	readonly poignee: { readonly x: number; readonly y: number };
}

/** Les demi-dimensions d'un nœud — celles que la vue dessine. */
export const DEMI_LARGEUR = 84;
export const DEMI_HAUTEUR = 21;

export function tracerLesAretes(
	aretes: readonly AreteATracer[],
	noeuds: readonly NoeudPlace[]
): readonly TraceDArete[];
```

Le module est **pur** : aucun accès au DOM, aucune donnée propre, tout entre par les paramètres.

**2. `src/routes/modelisation/+page.svelte`** *(lot D, vague 2)*. `cheminDArete()`, `DEMI_LARGEUR`
et `DEMI_HAUTEUR` disparaissent du fichier. La vue lit une table `tracesParCle` dérivée de
`tracerLesAretes(data.aretes, data.noeuds)` et rend, par arête :

```
<path class={classeDArete(a)} d={trace.d} marker-end="url(#pointe)" />
<a href={adresseDArete(a.cle)} aria-label={…}>
	<path class="mod-arete__prise" d={trace.d} />
	<circle class="mod-arete__poignee" cx={trace.poignee.x} cy={trace.poignee.y} r="9" />
</a>
```

**3. `modelisation.css`.** `.mod-arete__poignee { fill: transparent; cursor: pointer }` et, à
`:hover` et `:focus-visible`, un contour à la teinte d'accent : la poignée doit se **voir** quand
on la vise, sinon elle ne se vise pas.

### Migration

Aucune.

### Tests à écrire

Fichier neuf : **`src/lib/graphe/traces.test.ts`** *(lot B)*. Il porte une fonction utilitaire
d'échantillonnage de cubique (formule de Bézier, aucune dépendance) pour mesurer les distances.

| Nom | Ce qu'il vérifie |
|---|---|
| `une arête seule sur sa paire garde le tracé d'avant` | Le `d` rendu est exactement celui que `cheminDArete()` rendait — le cas courant ne bouge pas. |
| `deux arêtes sur la même paire reçoivent deux tracés distincts` | Les deux `d` diffèrent, et l'écart mesuré entre leurs milieux vaut `ÉCART_DE_PARALLÈLE`. |
| `trois arêtes sur la même paire s'écartent symétriquement autour du tracé nominal` | La moyenne des trois écarts est nulle : l'éventail ne déporte pas le faisceau. |
| `deux poignées ne sont jamais à moins de la distance de collision` | Sur un graphe qui porte un croisement construit, toutes les paires de poignées sont à plus de 20 px l'une de l'autre. |
| `chaque poignée est SUR le tracé de son arête` | Pour chaque arête, la distance de sa poignée au point le plus proche de son propre chemin, échantillonné en 200 points, est inférieure à 0,5 px. |
| `le même graphe rend les mêmes tracés quel que soit l'ordre d'entrée` | Les arêtes mélangées rendent une table identique. |
| `une arête qui remonte garde son crochet latéral` | Le `d` d'une arête `retour` commence par le côté, pas par le bas du nœud. |
| `un cas irréductible garde sa poignée sur son trait` | Un graphe construit pour saturer les positions d'essai : aucune poignée n'a quitté son chemin, même si deux se recouvrent. |

### Contrôle de fin

Dans un navigateur, sur la base de développement : déclarer **deux relations de types différents
entre les deux mêmes notes**, ouvrir `/modelisation`, et cliquer chacune des deux poignées. Le
panneau « Lien choisi » doit afficher **le bon type à chaque fois** — c'est-à-dire deux types
différents pour deux clics à deux endroits. Répéter au clavier : `Tab` atteint les deux ancres,
`Entrée` sélectionne, et le contour de survol se voit.

### Arbitrages

- **L'éventail agit sur les points de contrôle, pas sur les extrémités** : les deux traits doivent
  partir du même nœud et arriver au même nœud, sinon le dessin ment sur ce qu'ils relient.
- **La poignée glisse le long de son chemin, jamais à côté** : une cible de clic qui n'est pas sur
  son trait est une cible qui désigne autre chose que ce qu'on vise.
- **La prise large est gardée sous la poignée** : la retirer rendrait le clic plus difficile dans
  le cas courant, qui est celui d'une arête seule.
- **La géométrie sort du `.svelte`** : elle est la seule partie du dessin qu'un unitaire puisse
  éprouver, et l'y laisser rendait le chantier invérifiable autrement qu'à l'œil.
- **Un cas de recouvrement irréductible est assumé et dit** : la restitution en liste
  (`+page.svelte:352-364`) reste le chemin qui atteint **toujours** chaque arête, et c'est déjà
  ce que `P-06` exige.

### Risques et parades

| Risque | Parade |
|---|---|
| L'écartement des poignées devient un placement par forces, donc non reproductible | Aucune itération libre : sept positions d'essai fixes, parcourues dans l'ordre lexical des clés. Un test l'exige. |
| Le tracé du cas courant change et tout le dessin bouge | Le premier test compare au `d` d'aujourd'hui, caractère pour caractère. |
| La poignée masque le trait | Elle est transparente ; seul son contour apparaît au survol et au focus. |
| Un `<circle>` dans un `<a>` SVG n'est pas cliquable | Il l'est ; et le routeur de SvelteKit traite explicitement `SVGAElement` (`node_modules/@sveltejs/kit/src/runtime/client/utils.js:133`). Le chantier 4 le rejoue dans un navigateur. |

---

## C8 — La modélisation devient un module de domaine

### État actuel

`src/vues/V-11.svelte:283-293` porte la règle en dur, et son commentaire dit pourquoi :

> LA MODÉLISATION SUIT LA CARTOGRAPHIE, ET N'EST PAS UN MODULE À PART. `modules_de_domaine.module`
> est un ÉNUMÉRÉ de la base : y ajouter une valeur demande une migration […]

Conséquences aujourd'hui :

- `V-11.svelte:658` — la tuile EXPLORER « Modélisation » s'affiche dès que `cartographie` est
  active, et pas autrement.
- `V-11.svelte:575` — la même règle dans le menu « … » du bandeau.
- `src/lib/coquille/Rail.svelte:402` — l'entrée « Modélisation » du menu de compte est
  **inconditionnelle**.
- `src/lib/rangement/modules.ts:17` — le catalogue porte six modules.
- `seeds/corpus.ts:250-251` — `CleDeModule` est une union close de six clés ; `:1440-1447` —
  `MODULES` est un `Record` exhaustif.
- Les six clés sont traduites vers l'énuméré en cinq endroits : `src/lib/base/semence.ts:188-197`,
  `src/lib/donnees/administration.ts:1673-1681`, `src/lib/donnees/rangement.ts:151-157`,
  `src/lib/donnees/lecture.ts:265-271`, `src/lib/base/commandes.ts:368`. Et une liste littérale
  dans `src/lib/base/conformite.ts:125`.
- `src/vues/V-28.svelte:167-174` — `CODES_MODULES`, un `Record` exhaustif ; `:177` —
  `AIDES_MODULES`, idem ; `:191` — la liste des cases se dérive du catalogue, donc une clé de plus
  fait apparaître sa case **toute seule**.

### Le changement exact

**1. Les deux migrations.** Voir §Migrations.

**2. `src/lib/base/schema.ts:69-76`** — ajouter `'modelisation'` à `moduleDeDomaine`, **en
dernier**, dans l'ordre où `ALTER TYPE ADD VALUE` la pose.

**3. `seeds/corpus.ts`** — `CleDeModule` (`:250`) reçoit `'modelisation'` ; `MODULES` (`:1440`)
reçoit `modelisation: { nom: 'Modélisation', sous: 'Ce qui dépend de quoi' }`. `DETAIL_DOMAINES`
n'est **pas** touché : un domaine du jeu n'a pas à activer le module.

**4. `src/lib/rangement/modules.ts:17`** — la même entrée dans `CATALOGUE_DE_MODULES`, placée
après `cartographie` : c'est l'ordre dans lequel les deux entrées d'exploration se lisent.

**5. Les cinq tables de traduction et la liste de conformité** — `modelisation: 'modelisation'`
dans les deux sens (la clé du produit et la valeur d'énuméré sont ici identiques, contrairement à
`carteMentale` / `carte_mentale`), et `'modelisation'` dans le littéral de `commandes.ts:368` et
la liste de `conformite.ts:125`.

**6. `src/vues/V-28.svelte`** — `CODES_MODULES` reçoit `modelisation: 'MOD'` ; `AIDES_MODULES`
reçoit sa phrase : *« La lecture des dépendances : ce qui porte, ce qui dépend, ce qui casse si on
le retire. Sans lui, le graphe ne se lit qu'en cartographie. »* La case apparaît alors seule dans
`#f-modules`, et le geste d'activation existe **sans une ligne de câblage de plus**.

**7. `src/vues/V-11.svelte`** — `CLES_DEXPLORATION` (`:258`) devient
`['cartographie', 'modelisation', 'carteMentale']`. Le dérivé `modelisationOfferte` (`:293`) et le
bloc conditionnel `:657-668` **disparaissent** : la tuile est rendue par la boucle
`{#each exploration}` comme les deux autres. `adresseDeModule('modelisation')` (`:367-368`) reste.
Le menu « … » (`:573-578`) : l'entrée « Modélisation du domaine » passe sous
`{#if exploration.includes('modelisation')}`.

**8. `src/routes/+layout.server.ts`** — le rail doit savoir si le module vit quelque part. Une
lecture bornée de plus, et une seule ligne :

```ts
/**
 * LE MODULE EXISTE-T-IL QUELQUE PART DANS CE QUE L'APPELANT PEUT LIRE ? L'entrée
 * de rail est GLOBALE : la gager sur un domaine précis n'aurait pas de sens, et la
 * laisser inconditionnelle promettrait un écran vide. Une ligne, un `limit 1`, sur
 * une table dont la clé primaire porte les deux colonnes.
 */
async function modelisationOfferte(base: Base, acces: AccesAuRangement): Promise<boolean>
```

Le résultat descend dans `data` et `Rail.svelte:402` devient
`{#if modelisationOfferte}<a …>Modélisation</a>{/if}`.

**9. `docs/routes.md`** — une ligne de tableau au §3, insérée après celle de
`/cartographie/par-type` (`:155`), et écrite **d'un seul tenant** : un tableau Markdown n'admet
aucun repli de ligne. Ses six colonnes, dans l'ordre du tableau : l'adresse `/modelisation` ; le
libellé « Modélisation — ce qui dépend de quoi » ; l'accès « connecté ; périmètre rabattu sans
droit » ; un tiret pour les états de planche, cette vue n'en ayant aucune ; un tiret pour les
règles du cahier, aucune ne la nommant ; et l'ancrage « S4 rail *Outils › Modélisation* ».

`/modelisation` est aussi ajoutée à la liste des **chemins fixes de fonction** du §5.5 — elle y
manque alors que `garde.ts:73` l'y range déjà — et au décompte du §9.

**10. `docs/traces/passage-a-froid.mjs:403-405`** — `['/modelisation', 200]` après
`['/cartographie/par-type', 200]`. Le passage coche déjà **toutes** les cases de `#f-modules`
(`:272-276`), donc le domaine d'épreuve activera Modélisation sans une ligne de plus. Le décompte
passe de 42 à **43 routes**.

### Ce qui ne change PAS, et c'est une décision

**La route `/modelisation` reste ouverte à tout compte connecté**, module actif ou non — comme
`/cartographie` aujourd'hui, qui n'est pas non plus gardée par son module. Seules les **entrées de
navigation** dépendent du module. Une adresse partagée doit continuer de s'ouvrir ; `P-03` parle
d'entrées visibles, pas d'adresses.

**L'entrée de rail « Cartographie » n'est pas touchée.** Elle reste inconditionnelle. La demande
porte sur Modélisation, et fermer Cartographie ferait disparaître une entrée dont on se sert
aujourd'hui, sans que rien ne l'ait signalée comme un défaut. L'asymétrie est assumée et notée
ici pour qu'elle ne se découvre pas en la lisant dans le code.

### Migration

`016` (valeur d'énuméré) et `017` (reprise). Voir §Migrations.

### Tests à écrire

| Fichier | Nom | Ce qu'il vérifie |
|---|---|---|
| `src/lib/base/semence.test.ts` | `le catalogue de modules et l'énuméré de la base portent les mêmes clés` | Les clés de `CATALOGUE_DE_MODULES` traduites par `MODULE_EN_ENUM` sont exactement les valeurs de `moduleDeDomaine.enumValues`. C'est le contrôle qui empêchera la prochaine clé d'être ajoutée d'un seul côté. |
| `src/vues/consoles-proprietes.test.ts` | `V-28 offre une case par module du catalogue` | Le balisage de `#f-modules` porte sept `input[type=checkbox]`, un par clé. |
| `src/vues/proprietes-graphes.test.ts` | `la tuile Modélisation n'est rendue que si le module est actif` | V-11, un domaine dont `modules` porte `cartographie` mais pas `modelisation` : le balisage ne contient pas l'adresse `/modelisation`. Le même domaine avec les deux : elle y est. |
| `src/vues/proprietes-graphes.test.ts` | `un domaine sans cartographie n'offre plus la modélisation par ricochet` | Le cas exact que la règle en dur rendait impossible à écrire. |

### Contrôle de fin

Sur une base neuve, migrée et sans rien de semé :

1. `pnpm base:migrer` applique `016` puis `017` et sort à 0 ; `pnpm base:coherence` sort à 0 ;
   `pnpm base:reversibilite` sort à 0.
2. Créer un univers, un domaine avec **Cartographie décochée** : la page du domaine n'offre ni
   Cartographie ni Modélisation ; le menu de compte du rail n'offre pas Modélisation.
3. Cocher **Modélisation** en console : la tuile apparaît dans EXPLORER, l'entrée apparaît au
   rail, et les deux mènent à `/modelisation?perimetre=domaine|…`.
4. Décocher : les deux disparaissent, et `/modelisation` tapée à la main s'ouvre encore.
5. **La reprise** : sur une base qui portait des domaines avec Cartographie active **avant** la
   migration, vérifier après `pnpm base:migrer` que
   `SELECT count(*) FROM modules_de_domaine WHERE module='cartographie'` égale
   `SELECT count(*) FROM modules_de_domaine WHERE module='modelisation'`. Rien n'a disparu.
6. `pnpm build && node docs/traces/passage-a-froid.mjs` : **43 routes**, chacune au code attendu.

### Arbitrages

- **Deux migrations, pas une** : contrainte de PostgreSQL, démontrée en §0.
- **La clé du produit et la valeur d'énuméré sont identiques (`modelisation`)** : `carteMentale`
  est la seule à diverger, et cette divergence est une dette qu'on n'agrandit pas.
- **`DETAIL_DOMAINES` de `seeds/corpus.ts` n'est pas touché** : le jeu de semence n'a pas à
  activer un module pour que le module existe.
- **La reprise est faite par migration, pas par un code de démarrage** : une reprise qui
  s'exécuterait à chaque lancement s'exécuterait aussi après une désactivation volontaire, et
  ressusciterait un module que quelqu'un vient d'éteindre.
- **Le rail lit une ligne de plus à chaque requête** : mesuré comme acceptable — un `limit 1` sur
  une table dont la clé primaire est `(domaine_id, module)` —, et c'est le prix d'une entrée de
  navigation qui ne ment pas.

### Risques et parades

| Risque | Parade |
|---|---|
| `ALTER TYPE ADD VALUE` et l'`INSERT` dans la même transaction : `unsafe use of new value` | Deux fichiers de migration. Le contrôle est `pnpm base:migrer` sur une base neuve, sortie 0. |
| La descente ne sait pas retirer une valeur d'énuméré et `pnpm base:reversibilite` rougit | La descente recrée le type dans son ordre d'origine et retype la colonne. Le relevé structurel lit `enumsortorder` (`src/lib/base/commandes.ts:225-230`) : l'ordre recréé est celui d'avant. |
| Une des cinq tables de traduction est oubliée et une clé stockée devient invisible | `libelleDeModule()` (`src/lib/rangement/modules.ts:32`) nomme une clé inconnue par elle-même plutôt que de tomber ; et le test `le catalogue et l'énuméré portent les mêmes clés` refuse l'oubli. |
| Une migration tourne pendant qu'un autre lot lit la base partagée | Le lot A est le seul de la vague 1 à toucher la base, et la vague 2 attend sa fin. |

---

## C9 — Mémoire des propositions rejetées

### État actuel

`src/lib/donnees/relations.ts:615-625` — `rejeterUneRelation()` **supprime la ligne**, et son
commentaire assume l'absence de mémoire :

> REJETER PUIS REPROPOSER FAIT REVENIR LA PROPOSITION, et c'est assumé. Le rejet efface la ligne,
> rien ne garde la mémoire du refus, et une table de refus serait un schéma de plus pour un cas
> que l'utilisateur provoque lui-même […]

Le raisonnement est faux dès que le corpus grandit : « Proposer » est un bouton **de lot** — il
pose toutes les propositions du périmètre d'un coup (`proposerLesRelations()`, `:659`) —, et
l'utilisateur qui en rejette trois sur quarante retrouve ses trois au clic suivant, mêlées aux
nouvelles. Le geste de rejet ne sert alors à rien.

`propositionsDeMention()` (`src/lib/graphe/propositions.ts:141`) ne connaît aucun refus.
`+page.server.ts:150` compte les propositions possibles pour le libellé du bouton.

### La forme retenue : une table, pas une marque sur la relation

**Arbitrage, et il est structurant.** Une quatrième valeur `refusee` sur `origine_de_relation`
garderait la ligne dans `relations`, et cela casse deux choses :

1. **La contrainte `relations_unicite (source_id, cible_id, type_de_relation_id)`**
   (`base/migrations/002_socle.montee.sql:425`) rendrait alors **impossible** de déclarer
   soi-même la relation refusée : le geste sortirait en « cette relation existe déjà ». Or la
   demande est explicite — *« Je peux toujours déclarer moi-même une relation sur une paire
   refusée. »*
2. **Tous les lecteurs de `relations`** — les deux cartographies, le panneau de relations d'une
   note, les compteurs de la console, l'export d'archive, l'import — devraient apprendre à
   ignorer la nouvelle valeur. Chacun qui l'oublierait afficherait un lien que personne n'a
   déclaré et que quelqu'un a refusé.

Une table séparée n'a aucun de ces deux effets : un refus n'est pas une relation, et il ne vit
donc pas dans la table des relations.

### Le changement exact

**1. Migration** — `propositions_refusees`, dans `016`. Voir §Migrations.

**2. `src/lib/base/schema.ts`** — la table, à côté de `relations`.

**3. `src/lib/donnees/relations.ts`.**

`rejeterUneRelation()` fait désormais **deux écritures dans une transaction** : elle supprime la
ligne `relations` et insère la ligne `propositions_refusees` avec le même triplet et
`refusee_par_id = ` le compte appelant. `ON CONFLICT DO NOTHING` — rejeter deux fois n'est pas une
erreur.

Trois fonctions neuves :

```ts
/** Les triplets refusés, bornés au périmètre lisible de l'appelant. */
export async function lireLesPropositionsRefusees(
	base: Base, perimetre: Perimetre
): Promise<readonly PropositionRefusee[]>

/** Annuler un refus — la ligne disparaît, rien n'est reposé. */
export async function annulerUnRefus(
	base: Base, demande: { identite: Identite; refus: string }
): Promise<Resolution<{ annule: true }>>

/** La clé d'un triplet, pour comparer sans se tromper d'ordre de colonnes. */
export function cleDeTriplet(de: string, vers: string, type: string): string
```

`proposerLesRelations()` lit `propositions_refusees` sur les notes concernées **dans la même
requête bornée** que les paires déjà reliées, et compte les propositions écartées pour ce motif
dans `ecartees` — le relevé dit déjà « écartées », il dira maintenant aussi pourquoi :
`ReleveDesPropositions` gagne `refusees: number`.

`annulerUnRefus()` porte la **même garde de droit** que `rejeterUneRelation()` : le droit
d'écriture sur les deux extrémités (`RG-M08-04`), par `relationEcrivable()` généralisé aux deux
identifiants de note plutôt qu'à une clé de relation.

**4. `src/lib/graphe/propositions.ts`.** `propositionsDeMention()` prend un quatrième paramètre
**exigé** :

```ts
export function propositionsDeMention(
	notes: readonly Note[],
	declarees: readonly RelationLisible[],
	mentions: readonly RelationLisible[],
	/**
	 * LES TRIPLETS DÉJÀ REFUSÉS. Exigé, sans défaut : un appelant qui l'oublierait
	 * reproposerait ce qu'on vient de refuser, et le bouton mentirait sur son compte.
	 */
	refuses: ReadonlySet<string>
): readonly Proposition[]
```

**5. `src/routes/modelisation/+page.server.ts`.** `monterLeModele()` lit les refus et les rend ;
le chargeur les sert enrichis des titres et du libellé de type, pour que la vue n'ait rien à
résoudre. Une action de plus : `annulerLeRefus`.

**6. `src/routes/modelisation/+page.svelte`.** Un bloc de panneau **« Propositions refusées »**,
rendu seulement s'il y en a. Chaque ligne : *« Titre A — libellé du type → Titre B »*, la date, et
un bouton **« Annuler ce refus »** dans son formulaire. Le bloc porte une phrase liminaire :
*« Ces liens ont été proposés puis refusés. Ils ne seront plus proposés. Vous pouvez toujours les
déclarer vous-même. »*

### Migration

`016`. Voir §Migrations.

### Tests à écrire

Dans `src/lib/graphe/propositions.test.ts` (lot D) :

| Nom | Ce qu'il vérifie |
|---|---|
| `un triplet refusé n'est plus proposé` | La même mention, la même règle, un refus : `propositionsDeMention()` ne le rend pas. |
| `le refus porte sur le TRIPLET, pas sur la paire` | Refuser `A → B, depend-de` n'empêche pas de proposer `A → B, documente` si l'usage bascule. |
| `le refus porte sur le SENS` | Refuser `A → B` n'empêche pas `B → A`. |
| `un refus sur un couple sans mention ne fait rien` | Un ensemble de refus qui ne correspond à aucune mention ne change pas le résultat. |
| `le paramètre de refus est exigé` | Typé — le contrôle est `pnpm check`. |

Dans `src/lib/donnees/relations.test.ts` — **le fichier existe**, et son en-tête pose la règle de
la maison : « ce qui exige un conteneur n'est pas ici […] elles sont éprouvées au navigateur,
contre la base réelle » (`:1-8`). Ce chantier la tient. N'y entrent donc que les deux contrôles
qui ne parlent pas à PostgreSQL, plus **un seul** qui emploie une base feinte locale — le motif de
`src/lib/donnees/administration.test.ts:189`, `baseFeinte()`, écrit pour éprouver une atomicité de
transaction, qu'aucune extraction ne peut rendre pure.

| Nom | Ce qu'il vérifie |
|---|---|
| `la clé d'un triplet ne dépend pas de l'ordre des colonnes` | `cleDeTriplet()` — fonction pure. Deux appels sur le même triplet rendent la même clé, deux triplets différents deux clés différentes, et le sens compte. |
| `le relevé des propositions distingue les écartées des refusées` | `ReleveDesPropositions` porte `posees`, `ecartees` et `refusees`, et les trois comptes se lisent séparément. |
| `rejeter émet les DEUX écritures dans la MÊME transaction, la suppression d'abord` | Une base feinte locale journalise `tx:delete relations` puis `tx:insert propositions_refusees` ; avec l'échec simulé sur la seconde, la première est annulée. |

**Tout le reste est éprouvé au navigateur**, et c'est le §Contrôle de fin qui le porte : le droit
sur les deux extrémités, le refus d'une relation `declaree`, la déclaration manuelle sur une paire
refusée, l'annulation. Ces quatre-là passent par la résolution des droits et par
`relations_unicite`, c'est-à-dire par la base ; les simuler ne prouverait rien de ce qu'ils
prouvent.

### Contrôle de fin

Dans un navigateur, sur le jeu de démonstration (base d'épreuve, après C2) :

1. `/modelisation` : le bouton dit « Proposer N relation(s) à confirmer ». Cliquer.
2. Cliquer une proposition, cliquer **Rejeter**. Le trait disparaît.
3. Le bloc **« Propositions refusées »** apparaît et porte cette ligne.
4. Recliquer **Proposer** : le bouton propose **N − 1**, et la proposition rejetée **ne revient
   pas**.
5. Déclarer soi-même une relation sur cette paire, avec le type refusé : **elle est acceptée**.
6. Retirer cette relation, cliquer **Annuler ce refus** : la ligne quitte le bloc, et le clic
   suivant sur **Proposer** la repropose.
7. Cliquer une relation **déclarée** et vérifier que le panneau n'offre **pas** « Rejeter » : seule
   une proposition se rejette, et ce comportement d'aujourd'hui ne se perd pas.
8. En session **contributeur sans droit d'écriture** sur l'un des deux dossiers : le bloc
   « Propositions refusées » ne montre pas la ligne, et une tentative d'annulation forgée à la
   main rend le refus uniforme du module (`INTROUVABLE`), pas un message qui révélerait la paire.

### Arbitrages

- **Une table plutôt qu'une marque sur la relation** — justifié ci-dessus : la contrainte
  d'unicité, et les dix lecteurs de `relations` qu'il faudrait éduquer.
- **Le refus porte sur le triplet orienté, pas sur la paire** : une proposition EST un triplet ;
  refuser « A dépend de B » ne dit rien de « A documente B », ni de « B dépend de A ».
- **Aucune trace de suppression n'est écrite** — ni au rejet, ni à l'annulation. `RG-NF-05` trace
  la disparition de ce que quelqu'un a créé ; une hypothèse avancée par le produit n'a jamais été
  un fait du corpus. C'est le raisonnement que porte déjà `rejeterUneRelation()`, et il tient.
- **Le refus est nominatif (`refusee_par_id`)** mais n'est pas un droit personnel : n'importe quel
  compte ayant le droit d'écriture sur les deux extrémités peut l'annuler. Un refus est une
  décision sur le corpus, pas une préférence d'utilisateur.
- **Le paramètre de refus de `propositionsDeMention()` est exigé** : c'est ce qui garde le compte
  du bouton honnête, et un défaut vide le ferait mentir au premier appelant distrait.
- **`ecartees` gagne un détail plutôt qu'un message** : le relevé compte déjà, il comptera mieux.

### Risques et parades

| Risque | Parade |
|---|---|
| Le compte du bouton « Proposer N » ne tient pas compte des refus | `propositionsDeMention()` filtre, et c'est cette fonction que le chargeur appelle pour le compte comme l'action pour l'écriture (`+page.server.ts:150` et `:293`). |
| Un refus survit à la suppression d'une note et pointe dans le vide | `ON DELETE CASCADE` sur les deux extrémités. |
| Un refus survit à la suppression de son type | `ON DELETE CASCADE` sur `type_de_relation_id`. |
| Le bloc « Propositions refusées » montre des notes hors du droit de l'appelant | La lecture est bornée par le périmètre **dans la requête** (`ADR-006`), comme `lireRelationsLisibles()` : les deux extrémités doivent être lisibles. |
| La transaction du rejet laisse la relation supprimée sans refus écrit | Les deux écritures sont dans une transaction ; le contrôle à base feinte l'exige, échec simulé compris. |

---

# Chantiers ultérieurs

*Ils ne sont PAS exécutés dans la session d'exécution. Chacun a ici son état, son périmètre, ses
décisions prises, ce qu'il faut produire avant de coder, et ses arbitrages.*

**L'ordre des trois : C11, puis C10, puis C12.**

- **C11 d'abord** parce qu'un écran cassé passe avant un écran laid : la carte mentale montre
  aujourd'hui **3 notes sur 77** de la base de développement, et le manque n'est pas visible — il
  se lit comme un corpus vide.
- **C10 ensuite** parce qu'il attend une maquette qui n'existe pas, et que produire cette maquette
  peut commencer pendant C11 sans rien bloquer.
- **C12 en dernier** parce qu'il est le plus lourd — un choix de modèle, une migration
  irréversible dans les faits (la dimension est dans le type de colonne), un calcul initial sur
  tout le corpus — et parce qu'il remplace un mécanisme qui **marche** aujourd'hui, ce qui n'est
  jamais l'urgence.

---

## C10 — Apparence de `/modelisation`

### État actuel

L'apparence n'a pas été travaillée, et le code le déclare :
`src/routes/modelisation/modelisation.css:4-6` — « ELLE NE PORTE AUCUNE COULEUR EN DUR […] L'écran
est FONCTIONNEL avant d'être beau — la forme sera reprise » ; `+page.svelte:15` — « L'APPARENCE
SERA REPRISE. »

Ce qui existe : une grille à deux colonnes (`minmax(0,1fr)` et 340 px), un cadre de dessin qui
défile (`max-height: 74vh`), des nœuds en rectangles de 168 × 42 px, quatre styles d'arête
(pleine, fine, tiretée, choisie), un panneau collant, une restitution en liste repliée. 224 lignes
de feuille, entièrement sur les jetons du socle.

Les manques mesurés :

1. **Les titres sont coupés à 22 caractères** — `+page.svelte:228` :
   `n.titre.length > 22 ? n.titre.slice(0, 21) + '…' : n.titre`. Un plafond en dur, dans une boîte
   dont la largeur est elle-même en dur (`DEMI_LARGEUR = 84`), avec une police dont la largeur
   moyenne n'est pas mesurée. Sur le corpus de développement, la moitié des titres sont coupés,
   dont plusieurs au même préfixe : « Atelier — Cartographie… » et « Atelier — Cadrage… » rendent
   des étiquettes qu'on ne distingue plus.
2. `.mod-arete__mot` (`modelisation.css:129-132`) est une classe **morte** : aucun `<text>` ne la
   porte. Les arêtes n'ont donc pas de libellé au dessin, seulement dans le panneau et la liste.
3. Aucun état de survol sur un nœud, aucun focus visible sur les ancres de nœud.
4. Le paquet de refonte `design_handoff_refonte_codicillus/` **ne couvre pas cet écran** : son
   `README.md` annonce six vues — lecture de note, accueil, univers, domaine —, et `mockups/` n'en
   porte pas non plus (`V-19`, `V-20`, `V-21`, mais aucune modélisation).

### Périmètre exact

L'apparence de `/modelisation` **et rien d'autre** : `+page.svelte` pour le balisage,
`modelisation.css` pour la forme. Aucune règle de placement (`couches.ts`), aucun tracé
(`traces.ts`), aucune donnée servie (`+page.server.ts`) — ces trois-là sont fixés par les
chantiers 6, 7 et 9 et ne se rediscutent pas.

Y est inclus, parce que c'est de l'apparence : **la coupe des titres**, la classe morte, les états
de survol et de focus, et la place des libellés d'arête.

### Décisions déjà prises

- L'apparence sera **reprise sur maquette**, pas dessinée dans le code.
- La feuille reste `src/routes/modelisation/modelisation.css`, une feuille par vue, sur les jetons
  de `src/socle.css` — la convention du dépôt ne change pas pour cet écran.

### Ce qu'il faut produire AVANT de coder

Un paquet de référence, de la même forme que
`design_handoff_refonte_codicillus/`, dans **`design_handoff_modelisation/`** :

1. **`README.md`** — l'ordre d'autorité du paquet, les arbitrages produits, et les jetons employés
   s'ils s'écartent de ceux du socle.
2. **Des captures** (`captures/`) de l'écran dans ses **cinq états**, parce que ce sont eux qui
   décident de la forme : périmètre vide ; modèle de trois nœuds ; modèle de trente nœuds sur cinq
   couches ; un lien choisi, panneau ouvert ; l'avis « aucun type ne porte de dépendance ».
3. **Le prototype** `Modélisation.dc.html`, dont les écrans se recréent dans le code — jamais un
   HTML à copier.
4. **La règle des titres**, écrite : quelle largeur de boîte, quelle police, quelle taille, et
   comment un titre trop long se rend — coupé à la mesure, sur deux lignes, ou boîte élargie. La
   décision est de design, pas de code, et c'est elle qui règle le manque n° 1.
5. **La décision sur les libellés d'arête** : au dessin, au survol, ou nulle part. Elle décide du
   sort de `.mod-arete__mot`.

Ce paquet est un **acte de conception**, produit du côté du propriétaire du produit comme l'a été
celui de la refonte. La session d'exécution ne l'invente pas, et ne code pas sans lui.

### Arbitrages pris dès maintenant

- **La coupe à 22 caractères est un défaut, pas un choix d'apparence** : un plafond en dur sur un
  texte de longueur variable est exactement ce que
  `fix(lecture): plus un seul plafond en dur` (`a98a1dd`) a retiré d'un autre écran. Elle sera
  retirée avec ce chantier, et non avant : la remplacer maintenant demanderait de décider de la
  largeur de boîte, c'est-à-dire de dessiner.
- **La restitution en liste reste**, quelle que soit la maquette : `P-06` n'est pas négociable, et
  c'est aussi le chemin qui atteint une arête que le dessin recouvre (voir C7).
- **`.mod-arete__mot` n'est pas supprimée dans l'intervalle** : elle nomme une intention — un
  libellé au dessin — que la maquette tranchera. La supprimer d'ici là ferait perdre la question.
- **Aucune couleur en dur ne sera introduite** : si la maquette demande une teinte que le socle ne
  porte pas, le jeton se pose dans `src/socle.css`, jamais dans la feuille de vue.

---

## C11 — Carte mentale

### État actuel — mesuré, pas déduit

`/carte-mentale` rend V-21 (`src/vues/V-21.svelte`, 783 lignes). Le chargeur
(`src/routes/carte-mentale/+page.server.ts`) sert les notes lisibles, les univers et les domaines
lisibles, et le périmètre demandé. L'arbre se construit dans la vue :
`dossiersDuDomaine()` (`:224`), `brancheDeDossiers()` (`:240`), `racine` (`:261`).

**Ce qui marche.** Le dépliage est un état réel depuis un lot précédent (`:318-322`) — les trois
gestes du gel agissent. Le sélecteur de périmètre navigue. La disposition est déterministe. La
bascule Arbre / Liste est câblée (`+page.svelte:32-69`). Les quatre manques ont chacun leur phrase
et l'adresse qui débloque (`:485-508`).

**Ce qui ne marche pas — le défaut central, et il est chiffré.**

`brancheDeDossiers()` n'accroche une note qu'à un **dossier** :

```
:227   if (n.domaine !== domaine || !n.dossier) continue;      → la note sans dossier est ignorée
:252   .filter((n) => n.domaine === domaine && n.dossier === c) → une note ne pend qu'à un chemin
```

Or `Note.dossier` est **la chaîne vide** pour toute note rangée à la RACINE de son domaine : la
racine porte le nom du domaine et n'entre pas dans le chemin
(`src/lib/donnees/lecture.ts:323-329`). Sur la base de développement :

```
notes dont le dossier est de profondeur 1 (la racine) : 74
notes dont le dossier est plus profond                :  3
```

**La carte mentale affiche donc 3 notes sur 77**, et son en-tête compte « 3 notes dans 13
domaines » (`:475-476`, comptés sur l'arbre rendu). Elle n'affiche aucun message : ni les quatre
manques ne se déclenchent — il y a des univers, des domaines, des notes, et `racine.length` n'est
pas nul —, ni rien ne dit que soixante-quatorze notes ont été laissées de côté. **L'écran ment par
omission, et c'est un mensonge qui grandit avec l'usage réel** : ranger une note à la racine est
le geste le plus courant.

**Trois défauts de second rang, tous latents et tous atteignables.**

1. **Deux domaines de même nom dans deux univers différents s'écrasent.** La clé d'un nœud de
   domaine est `d:${d.nom}` (`:274`), et `dossiersDuDomaine()` filtre sur `n.domaine === domaine`,
   le NOM. L'unicité en base est `UNIQUE (univers_id, identifiant)`
   (`base/migrations/002_socle.montee.sql:134`) : deux domaines nommés « Cadrage » dans deux
   univers sont parfaitement légaux. Les deux nœuds porteraient alors la **même clé** dans un
   `{#each … (n.cle)}` — ce que Svelte refuse à l'exécution —, et leurs notes seraient mêlées.
   Non reproduit sur la base actuelle, où aucun nom de domaine n'est en double ; reproductible en
   deux gestes de console.
2. **Un dossier vide n'existe pas.** L'arborescence est déduite du champ `dossier` des notes : un
   dossier créé et pas encore rempli n'apparaît pas. Sur une instance neuve, où l'on crée le
   rangement avant d'écrire, la carte reste vide après un travail réel.
3. **`totalNotes` et `totalDomaines` comptent l'arbre rendu**, pas le périmètre. Ils sont donc
   justes par rapport au dessin et **faux** par rapport au corpus, ce qui est le pire des deux :
   l'utilisateur lit un compte de notes et croit qu'il compte ses notes.

### Périmètre exact

`src/routes/carte-mentale/+page.server.ts` et `src/vues/V-21.svelte`, plus la feuille
`src/vues/V-21.css` si le rendu d'un nouveau rang l'exige. **Rien d'autre** : ni la cartographie,
ni la modélisation, ni le rail.

### Décisions déjà prises

- **La carte mentale reste un arbre** : univers, domaines, dossiers, notes. Aucune relation
  qualifiée n'y entre — c'est ce qui la sépare de `/modelisation`, et cette séparation est déjà
  écrite (`src/routes/modelisation/+page.server.ts:12-15`).
- **Elle doit fonctionner.**

### Ce qu'il faut produire avant de coder

1. **La décision de rendu d'une note à la racine**, écrite. Trois formes possibles, et il faut en
   choisir une : (a) la note pend directement au nœud du domaine, à côté des dossiers ;
   (b) un nœud « (à la racine) » regroupe ces notes ; (c) le nœud du domaine porte les notes de
   racine **après** ses dossiers. La forme (c) est celle que la maquette
   `mockups/V-21-carte-mentale.html` suggère, et c'est celle qu'il faut confirmer en la relisant :
   c'est un relevé, pas un choix libre.
2. **Le relevé du comptage attendu** : ce que l'en-tête doit dire — le compte de l'arbre ou le
   compte du périmètre — selon la même maquette.
3. **Rien d'autre.** Ce chantier ne demande pas de maquette neuve : V-21 existe dans `mockups/`,
   et le paquet de refonte ne la couvre pas, donc elle fait foi.

### Arbitrages pris dès maintenant

- **L'arborescence continue d'être déduite des notes, avec les dossiers lus en base en plus.** Le
  chargeur servira l'arborescence de `dossiers` — que `ouvrirLAcces()` charge **déjà** pour
  résoudre les droits (`src/routes/+layout.server.ts:178-181` le dit pour le rail) — et la vue
  cessera de la reconstruire à partir des chemins de notes. Cela règle d'un coup le dossier vide
  et la collision de noms, et ne coûte aucune requête de plus.
- **La clé d'un nœud de domaine devient `d:${univers}:${nom}`**, et le filtre des notes portera
  sur le couple. Un nom seul n'a jamais identifié un domaine ; le croire est le défaut, pas le
  symptôme.
- **Les deux compteurs de l'en-tête compteront le PÉRIMÈTRE, pas l'arbre.** Un compte qui ne
  compte que ce qu'on a réussi à dessiner rend le défaut invisible, ce qui est exactement ce qui
  s'est passé ici.
- **Aucun nouveau contrôle automatique n'est ajouté.** Le défaut se voit en ouvrant l'écran sur la
  base de développement, où 74 notes sur 77 doivent apparaître.
- **Le chantier se termine sur une base à ZÉRO DONNÉE**, comme le veut `CLAUDE.md` : créer un
  univers, un domaine, un dossier vide, une note à la racine, une note dans le dossier — et les
  cinq doivent se voir.

---

## C12 — Embeddings

### État actuel

**Ce qui est déjà en place.**

- `pgvector 0.8.6` est **installée** — migration `001_extensions.montee.sql`, et vérifié en base
  (`extname = vector`, `extversion = 0.8.6`). La migration déclare pourquoi elle ne crée aucune
  colonne : « Un vecteur pgvector porte sa dimension dans son type (`vector(n)`), et `n` est celle
  du modèle d'embeddings. […] Choisir 384, 768 ou 1536 ici serait un comblement : la dimension
  viendra du lot qui installera le modèle. »
- Un service **Ollama** est déclaré dans `compose.yaml:259-274`, **optionnel**, avec
  `URL_EMBEDDINGS` et `MODELE_EMBEDDINGS` passés à l'application (`:132-133`).
  `.env.example:100-105` livre `MODELE_EMBEDDINGS=` **vide**, sans valeur par défaut.
- Le relevé structurel du schéma **exclut déjà** les objets apportés par une extension
  (`src/lib/base/commandes.ts:271-276`), en nommant pgvector : l'empreinte ne bougera pas quand
  l'extension changera de version.

**Le mode « Sens ».** `src/lib/recherche/notes-indexees.ts:123-140` — `REGLAGES_DE_L_INDEX` ne
porte pas `embedders`, et `SENS_DISPONIBLE` en est **dérivé** : `REGLAGES_DE_L_INDEX.embedders
!== undefined`. C'est une **constante de module**, importée par `src/lib/donnees/public.ts:35` et
lue par `/recherche` (`+page.server.ts:354`) et par la recherche publique (`public.ts:250`) pour
poser `c-degrade` et afficher « Recherche par sens momentanément indisponible ».

**Les familles.** `src/lib/graphe/familles.ts` regroupe par **Louvain sur un graphe d'affinités**
bâti sur trois traits : étiquette (poids 3), dossier (2), mot du titre (1). Le nom d'une famille
est le trait dominant de ses membres (`nommerLaFamille()`, `:500-537`), avec un repli
« Famille N ». La légende dit d'où vient le nom (`ORIGINE_DE_NATURE`, `:51-55`). Le calcul est
déterministe, graine fixe.

### Périmètre exact

1. Le choix du modèle et sa dimension.
2. Une migration : la table des vecteurs et son index.
3. Le calcul initial des vecteurs sur tout le corpus.
4. Leur mise à jour à chaque modification de note.
5. Le mode « Sens » de `/recherche`, et le mode « Hybride » avec lui.
6. Le remplacement des familles par mots-clés dans les deux cartographies.

**Hors périmètre** : tout ce qui ressemblerait à un assistant, à un résumé engendré ou à une
suggestion de contenu. Le vecteur sert à trouver et à regrouper, à rien d'autre.

### Décisions déjà prises

- Les vecteurs servent au **mode « Sens »** de la recherche **et** aux **familles** de la
  cartographie.
- Les familles gardent un **nom lisible à l'écran**.
- **Le nom du modèle est enregistré à côté des vecteurs.**
- Le modèle doit être **bon en français**.
- **La dimension est fixée à la création de la colonne** : le modèle se choisit **avant** toute
  migration.

### Ce qu'il faut produire avant de coder

Trois choses, dans cet ordre, et aucune ligne de code avant les trois.

1. **Une mesure de capacité sur le VPS de recette**, écrite : le modèle tiré, les 300 notes
   réelles embarquées, et le relevé du temps total, de la mémoire résidente au pic et de la place
   qu'occupent les vecteurs. Un modèle qu'on n'a pas fait tourner sur la machine qui le portera
   n'est pas un modèle choisi.
2. **La décision de dimension, actée**, avec le modèle qui la porte et le modèle de repli. Elle
   est irréversible dans les faits : `vector(n)` fige `n` dans le type de colonne, et en changer
   impose une seconde colonne et un recalcul complet du corpus.
3. **Un relevé de ce que le regroupement par vecteurs change au dessin**, sur le corpus de
   recette : combien de familles, de quelle taille, et combien portent encore un nom tiré d'un
   trait. Si le regroupement par vecteurs rend des familles qu'aucun trait ne sait nommer, la
   décision « les familles gardent un nom lisible » n'est pas tenue, et il faut le savoir avant
   d'avoir remplacé le mécanisme qui marche.

### Le modèle proposé, et ses critères

**Critères, dans l'ordre où ils tranchent :**

1. **Le français mesuré**, pas annoncé — un score publié sur une base multilingue incluant le
   français, et non un « supporte 100 langues ».
2. **Servi par le Ollama déjà provisionné**, sans nouvelle brique ni nouvelle dépendance du dépôt.
3. **Dimension compatible avec un index HNSW pgvector**, qui plafonne à 2000 dimensions.
4. **Empreinte tenable sur le VPS de recette**, en inférence **processeur** — il n'y a pas de carte
   graphique, et le calcul est un travail de fond, jamais sur le chemin d'une requête.
5. **Licence permettant l'auto-hébergement** sans condition.
6. **Fenêtre de contexte assez longue** pour porter une note entière, ou à défaut une section.

**Proposition : `bge-m3`, dimension 1024.** Il est multilingue par conception et non par extension,
publie des résultats en français, a une fenêtre de 8 192 jetons — donc la plupart des notes
entrent d'un bloc —, est servi tel quel par Ollama, et sa licence est permissive. 1024 dimensions
tiennent largement sous le plafond HNSW.

**Repli nommé, si la mesure de capacité du VPS le refuse : `embeddinggemma`, dimension 768.**
Plus petit, multilingue, et encore correct en français. Le repli **doit être décidé avant la
migration** : changer de modèle après coup impose une seconde colonne et un recalcul complet.

**Ce qu'il faut mesurer avant de trancher — et c'est le premier livrable du chantier :** sur le
VPS de recette, tirer le modèle, embarquer les 300 notes réelles, et relever le temps total, la
mémoire résidente au pic, et la place occupée par les vecteurs. Un modèle qu'on n'a pas fait
tourner sur la machine qui le portera n'est pas un modèle choisi.

### La migration

**Une seule**, et elle est irréversible dans les faits — la dimension est dans le type.

```sql
CREATE TABLE vecteurs_de_note (
	note_id           uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	registre          registre_de_note NOT NULL,
	vecteur           vector(1024) NOT NULL,
	-- LE MODÈLE EST À CÔTÉ DU VECTEUR, ET C'EST LA CONDITION DE TOUT LE RESTE :
	-- comparer deux vecteurs de deux modèles rend un nombre qui ne veut rien dire.
	modele            text NOT NULL,
	-- CE QUI DIT SI LE VECTEUR EST À JOUR, SANS DÉCLENCHEUR NI ÉTAT À TENIR :
	-- l'empreinte du corps au moment du calcul. Elle diffère, le vecteur est périmé.
	empreinte_du_corps text NOT NULL,
	calcule_le        timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (note_id, registre)
);

CREATE INDEX vecteurs_de_note_hnsw
	ON vecteurs_de_note USING hnsw (vecteur vector_cosine_ops);
```

**Un vecteur par REGISTRE, pas par note** : les deux registres d'une note disent deux choses
différentes — la référence explique, l'opérationnel exécute —, et les moyenner rendrait une note
introuvable par les deux.

**Pourquoi une table et pas une colonne sur `notes`** : `notes` est lue sur presque toutes les
pages, et un vecteur de 1024 flottants pèse 4 ko par ligne ; le mettre là ferait payer à chaque
liste de notes un poids dont elle n'a que faire.

### Le calcul initial

Une commande de plus dans `base/base.mjs` : **`pnpm base:vectoriser`**. Elle lit les notes dont le
vecteur manque ou dont l'empreinte a changé, les embarque par lots, écrit, et **rend son compte**.
Elle est **reprenable** : coupée en cours, elle reprend là où elle en est, puisque l'état est dans
la table et nulle part ailleurs.

Elle sort **non nulle** si le service d'embeddings ne répond pas ou si le modèle servi n'est pas
celui de `MODELE_EMBEDDINGS` : un vecteur calculé par un autre modèle que celui qu'on croit est
pire qu'un vecteur absent.

### La mise à jour à chaque modification

**Aucun déclencheur, aucune file d'attente, aucun état à resynchroniser.** L'empreinte du corps
est la seule chose à comparer : un vecteur dont `empreinte_du_corps` ne correspond plus au corps
actuel est périmé, et c'est vrai instantanément, sans que personne l'écrive.

Deux conséquences :

- **La lecture ignore un vecteur périmé.** Le mode « Sens » ne cherche que parmi les vecteurs à
  jour, et **dit** combien de notes il a laissées de côté. Un résultat incomplet qui s'annonce
  vaut mieux qu'un résultat complet qui ment.
- **Le recalcul est déclenché après l'enregistrement d'une note**, hors du chemin de la réponse —
  l'écran ne l'attend pas —, et `pnpm base:vectoriser` reste le rattrapage de tout ce qui aurait
  manqué.

### Le mode « Sens »

**Arbitrage structurant : les vecteurs sont produits UNE FOIS, par le produit, et poussés dans
l'index de recherche.** Meilisearch reçoit un embedder `userProvided` de la même dimension ; la
réindexation lui passe le vecteur lu en base, et la requête est embarquée par le produit avant
d'être envoyée. Le moteur de recherche n'appelle donc **jamais** Ollama.

*Pourquoi* : un seul producteur de vecteurs, un seul nom de modèle, une seule dimension. Laisser
Meilisearch appeler Ollama lui-même créerait un second chemin — donc deux chances de diverger sur
le modèle — et ferait dépendre la recherche d'une brique **optionnelle** : le jour où Ollama est
éteint, la recherche par mots-clés tomberait avec le mode « Sens », ce que `P-10` refuse.

**`SENS_DISPONIBLE` cesse d'être une constante de module.** Il devient un **constat de
fonctionnement**, lu à chaque chargement de `/recherche` : l'index porte-t-il un embedder, et
l'instance porte-t-elle des vecteurs pour le modèle courant ? Les deux appelants
(`src/routes/recherche/+page.server.ts:354`, `src/lib/donnees/public.ts:250`) reçoivent alors une
valeur, pas une constante importée. C'est le changement le plus large du chantier, et il faut le
prévoir : la constante est importée à trois endroits et lue à deux.

### Le remplacement des familles par mots-clés

**Le regroupement change ; le nommage ne change pas.**

- Le graphe d'affinités de `familles.ts` n'est plus bâti sur étiquette / dossier / mot de titre :
  il est bâti sur la **similarité cosinus** entre vecteurs, en ne gardant, pour chaque note, que
  ses `k` plus proches voisines au-dessus d'un seuil. Louvain tourne ensuite sur ce graphe, avec
  la même graine fixe.
- **`nommerLaFamille()` reste tel quel**, appliqué aux membres des familles obtenues. C'est ce qui
  tient la décision « les familles gardent un nom lisible à l'écran » : un regroupement par
  vecteurs n'a aucun mot à donner, et « Famille 3 » n'apprend rien. La légende continue de dire
  d'où vient le nom — « d'après l'étiquette », « d'après le dossier », « d'après un mot du titre »
  —, et elle reste vraie, puisque le nom vient toujours d'un trait des notes réunies.
- **Quand une instance n'a pas de vecteurs, les familles retombent sur les traits**, telles
  qu'elles marchent aujourd'hui, et l'écran le dit. Le mécanisme actuel n'est pas supprimé : il
  devient le mode dégradé, ce qui est sa juste place.

### Arbitrages pris dès maintenant

- **Un vecteur par registre**, jamais un vecteur moyenné par note.
- **Une table séparée**, jamais une colonne sur `notes`.
- **Le nom du modèle est dans chaque ligne**, pas dans un paramètre global : un corpus à moitié
  recalculé doit pouvoir dire, ligne par ligne, ce qui l'a calculé.
- **La péremption se lit sur une empreinte de corps**, jamais sur un drapeau : un drapeau se
  désynchronise, une empreinte non.
- **Le produit est le seul producteur de vecteurs** ; Meilisearch reçoit, il ne calcule pas.
- **Les familles par traits deviennent le mode dégradé**, elles ne sont pas retirées.
- **Le mode « Sens » annonce ce qu'il n'a pas pu chercher**, plutôt que de rendre un résultat
  silencieusement partiel.
- **Le modèle se mesure sur le VPS avant la migration** : la dimension est dans le type de
  colonne, et se tromper coûte une seconde colonne et un recalcul complet du corpus.

---

# Critères de fin de l'ensemble

La session d'exécution est finie quand **les sept lignes suivantes sont vraies, mesurées, dans cet
ordre**.

**1. `pnpm check` sort à zéro.**

```
pnpm check >/dev/null 2>&1; echo $?     # 0, ou rien n'est vert
```

Le code de sortie, jamais un filtre sur la sortie : `pnpm check` enchaîne quatre outils qui ne
rapportent pas leurs erreurs de la même façon.

**2. `pnpm test:unit` est vert**, avec **au moins 92 fichiers** (88 au départ, plus
`seeds/demonstration.test.ts`, `src/lib/graphe/traces.test.ts`,
`src/lib/graphe/modele.test.ts`, `src/routes/cartographie/lecture-du-graphe.test.ts`) et **plus de
2012 contrôles**. Aucun test existant n'a été supprimé ni relâché ; si l'un a changé, le rapport
dit lequel et pourquoi.

**3. La base monte, se contrôle et se démonte.**

```
pnpm base:migrer        # applique 016 puis 017, sortie 0
pnpm base:coherence     # sortie 0 — schema.ts décrit exactement la base migrée
pnpm base:reversibilite # sortie 0 — monte, descend, remonte, empreintes identiques
```

**4. Le produit se construit et le passage à froid passe.**

```
pnpm build && node docs/traces/passage-a-froid.mjs      # 43 routes, base neuve, sortie 0
pnpm build && node docs/traces/aiguilles-dans-le-paquet.mjs   # sortie 0
```

**5. Les clics sont rejoués dans un navigateur, avec le JavaScript client, et zéro erreur de
console.** Les onze gestes de `/modelisation` du §C4, plus les deux gestes de navigation du §C8,
plus la vérification du chantier 7 — deux relations de types différents entre deux mêmes notes,
chacune atteinte par son clic. Le même parcours est rejoué **script coupé** et passe aussi. Le
relevé porte les deux passages, avec le nombre d'entrées de console : **zéro**.

**6. Le parcours à ZÉRO DONNÉE est rejoué.** Sur une base migrée et jamais semée
(`pnpm base:migrer` + `pnpm base:administrateur`) : créer un univers, un domaine, un dossier, deux
notes, un type de relation, les relier, ouvrir `/modelisation`, activer et désactiver le module
Modélisation. **Aucun écran vide sans phrase, aucune 404, aucune 500.** C'est là que les défauts
vivent, et c'est le seul contrôle que rien ne remplace.

**7. Le journal et le rapport.**

- **Le journal des décisions** : chaque arbitrage pris pendant l'exécution qui s'écarte de ce plan
  est ajouté en une ligne à la fin de ce fichier, sous un titre `## Décisions prises à
  l'exécution`, avec sa raison. Rien d'autre n'est créé — pas de dossier d'écart, pas de contrat
  de tâche : `CLAUDE.md` les a supprimés et ce plan ne les ressuscite pas.
- **Le rapport de fin** : `docs/reprise.md` est **remesuré**, pas complété. Les cinq chiffres de
  son bandeau sont refaits, la section « Ce que le 7 septembre a réparé » remplace la précédente,
  et « Ce qui reste » dit l'état des chantiers 10, 11 et 12. C'est le fichier d'état du dépôt, et
  il porte déjà sa propre leçon : *un fichier d'état qui n'est pas remesuré vieillit plus vite que
  le code.*

---

# Les pièges à ne pas payer deux fois

Ils sont dans `CLAUDE.md` ; ceux-ci concernent directement ce plan.

| Piège | Ce qu'il coûte ici |
|---|---|
| **`node_modules` est un LIEN dans les copies de travail** | Trois worktrees en vague 1. Un `pnpm add` dans l'un écrit dans l'arbre du voisin. Avant toute installation : `rm node_modules && pnpm install --frozen-lockfile`. Aucun lot de ce plan n'a besoin d'une dépendance neuve — si l'un croit en avoir besoin, il se trompe de solution. |
| **Le cache de pré-groupage de Vite est PARTAGÉ** | Symptôme : `Outdated Optimize Dep`, hydratation cassée sans erreur visible — exactement ce que le chantier 4 cherche. `rm -rf node_modules/.vite` avant chaque `pnpm dev`. |
| **La base PostgreSQL est PARTAGÉE** | Une seule vague écrit à la fois ; en vague 1, seul le lot A touche la base. `pnpm base:peupler` et `pnpm base:conformite` **REMPLACENT le contenu** : jamais sur la base de développement, toujours avec `NOM_BASE=codicillus_epreuve`, et toujours après avoir lu la ligne `base : …` que `base/base.mjs` imprime. |
| **Ne jamais repérer un processus par `pgrep`/`pkill` sur un motif** | Le shell qui le lance se trouve lui-même. Passer par le PID, et tuer le `vite` fils, pas le `pnpm dev` père — sinon le port reste occupé. |
| **Svelte élague les blancs en bord d'élément** | `+page.svelte` en pose déjà plusieurs (`{x + ' › '}`). Toute phrase ajoutée aux chantiers 3 et 6 porte ses espaces **dans l'expression**. |
| **Décrire une forme, ne jamais la citer dans un commentaire** | Le chantier 7 écrit de la géométrie SVG et le chantier 2 du Markdown à double crochets : un accent grave dans un modèle littéral, un joker de type MIME ou une classe citée en prose cassent le fichier à cent lignes de la cause. |
| **Un formulaire de navigateur réécrit toute fin de ligne en CRLF** | Le chantier 4 poste des formulaires. Si un corps de note passe par là, `markdownDeFormulaire()` (`src/lib/contenu/markdown.ts:1252`) est la parade. |

---

# Décisions prises à l'exécution

*Les arbitrages qui s'écartent de ce plan, ou qui le corrigent. Une ligne chacun, avec sa
raison. Rien d'autre n'est créé — pas de dossier d'écart, pas de contrat de tâche.*

## Vague 0 — nettoyage du corpus

- **Les cinq contrôles sont dans un bloc `DO … RAISE EXCEPTION`, pas dans des `SELECT` lus à
  l'œil** : le plan décrivait cinq requêtes et un `COMMIT` tapé ensuite ; une exception dans la
  transaction est la seule forme où le contrôle ne peut pas être sauté.
- **Résultat mesuré** : 12 → 0 blocs `fixture-liens`, 77 notes, 0 corps vide, 12/12 corps égaux
  au sens de `jsonb` à leur `versions.numero = 1`, index de recherche à 0 résultat sur
  « fixture », `modifie_le` inchangé, `relations` toujours `declaree|7`.

## Vague 1, lot B — la géométrie des tracés

- **Le plan se contredisait, et c'est la mesure visible qui l'emporte.** Il demandait à la fois
  « écart appliqué aux points de contrôle » et « l'écart mesuré entre les milieux vaut
  `ÉCART_DE_PARALLÈLE` » : le milieu d'une cubique valant `(P0 + 3·P1 + 3·P2 + P3)/8`, déplacer
  les points de contrôle de `e` ne déplace le milieu que de `0,75·e`. `ECART_DE_PARALLELE` est
  donc l'écart **entre les milieux**, et le déplacement des points de contrôle vaut `4/3` de
  cela.
- **Le résultat est rangé par clé, pas dans l'ordre d'entrée** : c'est ce qui rend le contrôle
  d'indépendance à l'ordre littéralement vrai, et la vue lit par clé de toute façon.
- **Une arête dont une extrémité manque ne pèse pas sur l'écartement des poignées** : elle n'a
  pas de trait où glisser, et la faire compter déplacerait de vraies poignées pour une arête qui
  ne se dessine pas.
- **`ECART_DE_PARALLELE = 24`, soit plus que `DISTANCE_DE_COLLISION = 20`** : deux arêtes d'une
  même paire sont donc séparées par le seul éventail, et la troisième mesure n'a jamais à les
  traiter.
- **Le contrôle relit le `d` RENDU**, dont il extrait les huit nombres, plutôt que la géométrie
  interne du module : un contrôle qui reprendrait les points de contrôle éprouverait sa propre
  copie.

## Vague 1, lot C — le jeu de démonstration

- **`interface NoteLue` est exportée en plus de la fonction** : le type de retour de
  `lireLaNoteDeDemonstration()` doit être nommable côté appelant.
- **Le contrôle navigateur du §C2 n'a pas été fait par ce lot**, et c'est juste : il exigeait
  `pnpm base:peupler`, interdit au lot sur toute base. Il est repris en vague 4, sur
  `codicillus_epreuve`. Le compte de six arêtes est établi par le calcul même de la route.

## Vague 1, lot A — le module et les migrations

- **`pnpm base:reversibilite` n'a pas tourné sur la base partagée** : elle vide la base, ce qui
  aurait détruit les 77 notes réelles. Elle a tourné sur une base jetable, sortie 0, 17
  migrations, empreinte identique.
- **`propositionsRefusees` a dû entrer dans l'agrégat `schema` de `src/lib/base/schema.ts`** —
  défaut du plan, qui ne demandait que le `pgTable`. `verifierCoherence()` itère
  `Object.values(schema)`, pas les exports du module : sans cela `pnpm base:coherence` sortait à 1.
- **Le verdict du rail ne passe pas par un `limit 1`**, contrairement à ce que le plan proposait :
  la première ligne venue peut porter un domaine que l'appelant ne lit pas, et le rail aurait dit
  « oui » à qui ne verrait rien. La lisibilité se tranche sur l'accès déjà ouvert, sans requête
  de plus.
- **`Rail.svelte` lit `page.data` sous garde du contexte d'identité** : `page.data` nu lève hors
  requête SvelteKit et faisait tomber 337 contrôles ; le contexte `CLE_IDENTITE` est le
  court-circuit que `Coquille.svelte` emploie déjà.
- **`seeds/corpus.test.ts` reçoit une exemption nommée** `CLES_DE_MODULE_HORS_GEL`, de la même
  forme close que `CHAMPS_DE_CONFIG_HORS_GEL` : la clé est vérifiée absente du gel **et** présente
  dans `corpus.ts` avant d'être écartée.
- **`docs/routes.md` §9** : vues 35 → 36, total 40 → 41. Le décompte du passage à froid se calcule
  à l'exécution — il passe de 42 à 43 sans qu'un chiffre soit à écrire.

## Vague 1 — environnement

- **Le piège `node_modules` s'est déclenché** : pnpm v11 lance un `install` de lui-même
  (`verify-deps-before-run`), et deux copies de travail ont reçu un vrai `node_modules` local.
  `pnpm-lock.yaml` est resté intact, 0 ligne de diff, et l'arbre principal n'a pas été écrit.
- **`codicillus_epreuve` a été créée** comme base jetable pour tout ce qui exige
  `pnpm base:peupler`. `codicillus` ne reçoit jamais ni `peupler` ni `conformite`.

## Vague 1 — état à la sortie

```
pnpm check      = 0        1432 fichiers, 0 erreur, 0 avertissement
pnpm test:unit  = 0        90 fichiers, 2033 contrôles   (départ : 88 / 2012)
base            modelisation 13 = cartographie 13 · notes 77 · propositions_refusees, 0 ligne
```

## Vague 2, lot D — les quatre chantiers de `/modelisation`

- **Un défaut trouvé hors énoncé, et réparé** : le bloc « Déclarer une relation » vivait dans la
  branche `{:else}` du dessin. Sur une instance sans une seule relation — le cas de toute
  installation neuve — le dessin est vide et **le formulaire qui sert à déclarer la première
  partait avec lui**. Le panneau est sorti de la branche, et le bloc « Propositions refusées »
  avec lui, pour la même raison : rejeter la seule proposition d'une paire peut vider le dessin.
  Il a été trouvé parce que le contrôle de fin du §C3 a échoué à sa première exécution.
- **Le jeu de démonstration ne produit AUCUNE proposition**, et c'est correct : ses six mentions
  tombent sur des couples de types sans usage dominant — `Note → Note` est à égalité 3/3 entre
  `depend-de` et `documente`, et la règle se tait sur une égalité. Le §C9 supposait à tort que les
  propositions apparaîtraient seules. Le décor a été posé **par le geste du produit**, pas en
  changeant le code.
- **La ligne de refus est rendue en trois éléments distincts**, pas en une chaîne « Titre A —
  libellé → Titre B » : la forme du plan est illisible quand un titre porte lui-même un tiret
  cadratin.
- **`refusees` est un sous-ensemble d'`ecartees`**, jamais un compte qui s'y ajoute, et le refus
  est compté **avant** « paire déjà reliée » pour que le second compte reste exact.
- **Le contrôle « la clé d'un triplet » n'assert pas l'absence de collision par concaténation** :
  `cleDeTriplet('a>b','c','t')` et `cleDeTriplet('a','b>c','t')` sont égales, et un identifiant de
  note ne porte jamais ce caractère. Une assertion fausse n'a pas été écrite pour la forme.

## Vague 3, lot G — un défaut hors plan, signalé par le lot D

- **`pnpm base:peupler` échouait sur toute base portant une trace de suppression.**
  `demonstration.ts` supprime les comptes du jeu ; `traces_de_suppression.auteur_id` est en
  `NOT NULL … ON DELETE RESTRICT`. Une instance sur laquelle on avait supprimé quoi que ce soit ne
  pouvait plus être repeuplée.
- **La clé étrangère n'a pas bougé, aucune migration n'a été écrite.** Le `RESTRICT` de `013` est
  juste — une trace qui perd son auteur cesse d'être une attribution —, et le commentaire le redit
  à l'endroit du `delete` pour que personne ne « répare » demain en passant en `SET NULL`. C'est
  l'ordre de suppression du semeur qui était faux.
- **Les trois commandes ont été vérifiées avant de corriger** : `semer` ne supprime rien
  (insertion pure), `conformite` efface le contenu sans toucher aux comptes, `peupler` seul était
  cassé. Seul le cassé a été réparé.
- **Toutes les traces partent, pas seulement celles des comptes du jeu** : `peupler` REMPLACE le
  contenu, et une trace survivante parlerait d'une note détruite dans une instance qui n'existe
  plus.
- **Aucun unitaire ajouté** : le défaut ne se voit que contre une vraie base, et un contrôle qui
  inspecterait la liste de suppressions dans le source serait le garde-fou que `CLAUDE.md`
  interdit. La preuve est le scénario rejoué — suppression par l'écran, échec, correction, succès.

## Vague 3, lot E — la couverture restante

- **Les imports de `lecture-du-graphe.ts` passent de l'alias à des chemins relatifs.** L'alias est
  posé par le greffon SvelteKit, que `vitest.config.ts` ne charge pas : l'extraction restait
  inatteignable sans cela, ce qui vidait le chantier de son objet. Les deux autres parades étaient
  hors périmètre (`vitest.config.ts`, partagé) ou écartées par le plan (`vi.mock`). Le fichier
  portait déjà un import relatif vers `seeds/` : la convention n'y était pas uniforme.
- **Le contrôle des titres s'appuie sur `titreDe()` de `cartographie.ts`** — le code du produit —
  plutôt que sur la carte de titres recomposée dans `+page.server.ts`, qui n'est pas importable
  sans base. Les deux ont le même repli.
- **Les mentions des contrôles sont montées par `aretesDeMention()`**, pas par un littéral portant
  `type: 'mentionne'` : c'est le producteur réel qui pose le type.

## Vague 3, lot F — le rejeu navigateur

- **Les treize gestes passent, aux DEUX passages**, script client allumé puis coupé, avec les
  mêmes résultats ligne pour ligne. La propriété « marche sans hydratation » tient.
- **Console : 0 erreur, 0 avertissement, 0 `pageerror`, 0 requête en échec** aux deux passages.
  Les 40 entrées relevées au premier passage sont toutes des `console.debug` du client HMR du
  serveur de développement, une paire par chargement.
- **Le contrôle décisif du §C7 passe** : deux relations sur la même paire, deux chemins distincts,
  poignées à 24,0 px, et deux clics rendent deux types différents.
- **UN DÉFAUT TROUVÉ** : « Proposer 3 relation(s) à confirmer » en posait **2**, sans un mot. Une
  paire qui se cite mutuellement produisait deux propositions sur la même paire non orientée, dont
  l'écriture en écartait une ; le chiffre du bouton était compté avant cette règle, et l'action ne
  parlait que si `posees === 0`. Réparé au lot H.
- **Deux observations sans conséquence sur un geste** : les avertissements de préchargement de
  police sont l'heuristique du navigateur et non un défaut de câblage — 9 requêtes `woff2` pour
  9 préchargements, aucun double téléchargement ; et le chevron de l'arbre du rail est un
  `<button>`, donc script coupé aucun univers ne s'y déplie. **Ce second point n'est pas réparé** :
  les cartes d'univers de l'accueil et les cartes de domaine de la page d'univers sont des liens,
  et le parcours complet a été rejoué par elles, script coupé compris. Il est noté ici plutôt que
  corrigé — élargir le périmètre une seconde fois pour un chemin qui a déjà une issue serait
  décider à la place de qui commande.

## Lot H — le bouton « Proposer » ment sur son compte

- **Une paire qui se cite mutuellement ne donne plus AUCUNE proposition**, dans les deux sens et
  sans condition. C'est la doctrine du module appliquée à un cas qu'elle n'avait pas vu :
  `usagesParCouple()` se tait déjà sur une égalité de TYPE ; une citation réciproque est une
  égalité sur le SENS. Une déduplication qui aurait gardé le premier sens lexical aurait été le
  tirage au sort que le module refuse, avec l'apparence d'un raisonnement.
- **Le relevé voyage dans l'adresse, en trois comptes**, pas dans une réponse d'action : une
  adresse d'action SvelteKit remplace la chaîne de requête, et le périmètre choisi aurait été
  perdu au moment même où on veut le montrer. Les comptes sont des entiers validés et la phrase
  est composée au serveur — vérifié qu'une adresse forgée ne fait afficher aucun texte que le
  produit n'a pas écrit.
- **Le message est un `role="status"` en ton d'information**, pas une alerte : le geste a abouti.
- **Mesuré** : bouton « Proposer 3 » qui posait 2, sans un mot → bouton « Proposer 1 » qui pose 1.
  Et quand un droit manque sur une extrémité, le bandeau le dit désormais.

## Vague 4 — la clôture

- **`aiguilles-dans-le-paquet` sort à 1, et ce n'est PAS cette session.** Le dépôt a été
  reconstruit à `08bf423` — le commit d'avant la première ligne de ce plan — et le contrôle y
  rend **exactement le même échec** : 52 occurrences, 1 fichier. Le fichier est
  `build/client/_app/immutable/chunks/…`, 662 Ko de chevrotain et mermaid, où « Production » est
  le nom d'une classe de grammaire et non l'univers du jeu. Mermaid est entré dans le paquet
  client à `42c56cf feat(diagrammes)`, bien avant cette session. **Le `aiguilles = 0` de
  `docs/reprise.md` était déjà faux au départ.**
- **Il n'est pas réparé, et c'est un arbitrage.** C'est un faux positif d'un outil de
  vérification, pas un défaut du produit ; `CLAUDE.md` interdit de faire grossir l'appareil de
  vérification, et le périmètre a déjà été élargi deux fois dans cette exécution — pour un défaut
  qui bloquait une commande documentée (lot G) et pour un défaut que le rejeu a trouvé sur le code
  de ce plan (lot H). Une troisième fois, sur un outil, serait décider à la place de qui commande.
  Le fait est relevé dans `docs/reprise.md`.
- **Le parcours à ZÉRO DONNÉE a été rejoué** sur une base migrée et jamais semée : univers,
  domaine, type de relation, deux notes, la relation déclarée **depuis l'écran vide** — c'est le
  défaut que le lot D avait réparé, confirmé ici sur une instance neuve. `/modelisation` rend 200
  avant tout contenu, avec son avis. **0 incident de console.**
- **Les gestes de fin du parcours n'ont pas été re-prouvés par moi** : mon script de clôture bute
  sur le tiroir de console, ancré à droite et hors de la fenêtre quelle que soit sa largeur —
  une limite du harnais, pas du produit. Ces gestes sont prouvés ailleurs, et il faut savoir par
  qui : le lot A a retiré puis remis le module sur un domaine et sur les treize, et vu les entrées
  disparaître et revenir ; le lot D a coché « Dépendance technique » en console et vu l'avis
  disparaître.
