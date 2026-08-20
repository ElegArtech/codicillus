# Le plan de câblage — de la maquette fidèle à l'application vivante

*Écrit le 20 août 2026, sur reproche du commanditaire, et il était juste : trois jours ont produit
41 écrans conformes au pixel et une authentification, mais l'application n'est pas branchée. Les vues
lisent un fichier de constantes. Ce document dit comment on en sort, en une session, en parallèle.*

---

## Le fait qui rend ce plan rapide

Trois choses, mesurées et non supposées :

1. **Les vues attendent déjà leurs données en propriété.** `src/vues/V-12.svelte:78-85` déclare
   `notes: readonly Note[]`. Le mode de conception les lui passe. Une route n'a qu'à passer le même
   type depuis la base.
2. **La base a été semée depuis le fichier en dur.** `src/lib/base/semence.ts` importe `CORPUS` de
   `seeds/corpus.ts`. Les deux côtés portent les mêmes 32 notes. Une couche de lecture rendant les
   mêmes formes donne donc **les mêmes pixels par construction**.
3. **Le banc ne passe jamais par les routes.** Il attaque les composants par le mode de conception.
   **Câbler une route ne peut pas casser les 409 couples.**

La conséquence est la seule qui compte : **le câblage est mécanique, parallélisable, et sans risque
pour la conformité.** La contrainte « pas deux lots gourmands en banc », qui a sérialisé toute la
vague 1, ne s'y applique pas.

## La règle qui garantit le parallélisme

**Aucun lot ne touche `src/vues/`. Aucun.** Chaque lot écrit :

- ses `+page.server.ts`, sous ses propres dossiers de route ;
- son module de requêtes, `src/lib/donnees/<sa-famille>.ts`, composé sur la base de `T-030`.

Deux lots ne partagent donc jamais un fichier. `package.json` n'est touché que par `T-030`.

---

## Les vagues

### Vague 0 — `T-030`, seule, et elle bloque tout

La couche de lecture ; la migration `004` — les deux colonnes du signet **et les tables de
l'historique** ; la coquille branchée sur l'identité et les droits réels ; et **la batterie
d'équivalence** qui prouve que la base rend ce que le fichier exporte.

C'est cette batterie qui rend les huit lots suivants sûrs : sans elle, chacun devrait prouver sa
fidélité écran par écran.

### Vague 1 — quatre lots en parallèle

| Lot | Routes | Vues | Ce qu'il ferme en plus |
|---|---|---|---|
| **T-031** Espace public | `/`, `/recherche` anonyme, `/guides/{id}`, adresse non résolue | V-01 à V-04 | la demi-règle de `notesPubliques` (`ECART-047`) ; `RG-M17-01` |
| **T-032** Rangement | `/univers/{u}`, `/univers/{u}/{d}`, `…/notes`, `…/dossiers/{chemin}` | V-10 à V-13 | `RG-STR-06` — un module désactivé disparaît |
| **T-033** Lecture d'une note | `/notes/{id}`, `/notes/{id}/operationnel` | V-14, V-18 | le corps canonique lu en base ; les rétroliens |
| **T-034** Signets | `…/signets`, `…/signets/nouveau`, `…/signets/{id}/modifier` | V-22, V-23 | **la fuite mesurée d'`ECART-047` É-1** |

### Vague 2 — quatre lots en parallèle

| Lot | Routes | Vues | Ce qu'il ferme en plus |
|---|---|---|---|
| **T-035** Accueil connecté | `/` avec session, adresse non résolue connectée | V-07, V-26 | `RG-M01-01` — aucun indicateur figé (`P-02`) |
| **T-036** Consoles | les dix routes `/console/…` | V-27 à V-36, V-41 | **la fuite de `/console/univers`** ; `P-09` sur le rôle |
| **T-037** Outils | `/cartographie`, `/cartographie/par-type`, `/carte-mentale` | V-19 à V-21 | le graphe depuis les relations réelles |
| **T-038** Profil et compte | `/mon-profil`, `/mot-de-passe-oublie` | V-25, V-06 | `RG-M16-02` — mot de passe verrouillé |

### Vague 3 — deux lots

| Lot | Routes | Vues |
|---|---|---|
| **T-039** Historique et comparaison | `/notes/{id}/comparaison` | V-15, V-16 |
| **T-040** Import, écran câblé | `/importer` | V-24 |

### Clôture — l'orchestrateur seul

La campagne complète des 409 couples **une fois**, les quinze batteries, le journal, `reprise.md`,
le commit.

---

## Ce qui ne sera pas fonctionnel, et pourquoi — à déclarer, pas à combler

| Sujet | Ce qui manque | Ce qu'on a quand même |
|---|---|---|
| **Éditeur** | TipTap n'est pas installé (`STACK` §4.3) | la lecture ; pas la saisie. `V-17` reste une maquette |
| **Recherche « Sens »** | aucun vecteur, Ollama non sollicité | le mode « mots-clés », en base |
| **Index Meilisearch** | jamais alimenté (`T-027`) | la recherche interroge PostgreSQL. `ADR-006` — la projection des droits dans l'index — reste à faire |
| **Import bureautique** | le service Python n'est pas construit (`T-042`) | l'écran câblé, pas la conversion |
| **Export** | l'archive n'est pas produite (`T-045`) | le convertisseur Markdown existe et est vert |
| **Corps des anciennes versions** | `CONTENU_VERSIONS` est dans une forme ancienne que `T-014` et `T-015` ont refusé de transposer | les tables ; le lot `T-039` dira ce qu'il en fait |

**Aucune de ces absences ne se comble en silence.** Chaque lot qui en rencontre une la déclare et la
compte.

---

## Ce que le plan attend de chaque lot, sans exception

1. **La ligne de base relevée avant écriture**, citée au rapport.
2. **Aucun fichier de `src/vues/`.**
3. **Les droits appelés, jamais recopiés** — `src/lib/droits/resolution.ts` est l'implémentation unique,
   et jusqu'au 20 août **aucune route ne l'appelait**.
4. **`pnpm test:etancheite` ne monte pas.** Son empreinte au départ est `90/145/131/12` ; chaque lot de
   câblage doit la faire **descendre**, et dire de combien.
5. **Rapport court.** Le dispositif porte déjà 47 dossiers d'écart ; ce qui manque n'est pas de la
   documentation, c'est un produit qui marche.
