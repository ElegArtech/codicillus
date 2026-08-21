# Plan de remédiation — faire fonctionner l'application

**21 août 2026.** Ce document remplace tout contrat de tâche, tout dossier d'écart et tout protocole
d'acceptation visuelle. Il n'y a rien d'autre à lire pour exécuter.

---

## 1. Le constat, mesuré

Audit du 21/08/2026, preuves à l'appui — serveur de développement sur `:5199`, base `codicillus`
sur `:19432`, Meilisearch sur `:19700`.

**Ce qui marche déjà** — et il faut le dire, parce que cela change la nature du travail :

| Couche | État | Preuve |
|---|---|---|
| Routage | 32 routes / 34 rendent 200 authentifié | parcours `curl` complet |
| Base | 23 tables, données réelles | 32 notes, 19 dossiers, 22 relations, 5 comptes |
| Chargeurs | servent la vraie donnée | `/notes/n-restaurer-pg` rend le titre de la base |
| Actions serveur | **40 actions, elles écrivent** | `POST ?/verifier` → `verifie_le` modifié en base |
| Recherche | Meilisearch répond | requêtes abouties, facettes rendues |
| Adresses | fabrique complète | `$lib/rangement/adresses.ts`, 11 fonctions |
| Câblage | motif établi, **21 pages / 36** | `$lib/cablage/`, appelé depuis les routes (ARB-063) |
| `pnpm check` | **0** | 1458 tests unitaires verts |

**Le défaut, en une phrase :**

> Le dos est construit et fonctionne. Le devant a été transcrit des maquettes en balisage statique
> et **n'a jamais été raccordé au dos**.

Preuve chirurgicale — le geste phare du produit, « Marquer comme vérifié » :
l'action serveur `?/verifier` fonctionne (vérifié en `curl`, la base bouge) ; le bouton
`#btn-verifier` de `NoteDeDemonstration.svelte` n'a **ni `onclick`, ni `<form>`, ni `formaction`**.
Le fil est branché des deux côtés et coupé au milieu.

**L'ampleur :**

- **338 gestes inertes** dans les vues (hors planches de catalogue V-09/39/40/41, dont les boutons
  sont des spécimens et le restent) : 276 actions, 38 états d'interface, 24 commandes d'éditeur.
- **74 liens `href="#"`** qui ne mènent nulle part — dont les résultats de recherche, les listes de
  notes, les rétroliens, les fils d'Ariane et « Se connecter ».
- **Les 5 consoles ne peuvent rien créer.** Le panneau `.tiroir-form` vit hors de `div.app` ; la
  règle `.app[data-form="ouvert"] .tiroir-form` ne peut jamais s'appliquer. Le bouton `#creer`
  n'ouvre rien.
- **`versions` = 0 ligne pour 32 notes.** L'historique et la comparaison n'ont rien à montrer, et
  V-15 n'a pas de route propre.
- **Index désynchronisé** : 48 documents Meilisearch pour 32 notes.
- **Registre de migrations vide** alors que le schéma est monté → `pnpm base:migrer` échoue sur la
  base courante. Les migrations elles-mêmes sont saines (base vierge → 23 tables).

---

## 2. La décision d'ouverture

**La phase « squelette statique » est close.** Les arbitrages qui interdisaient le comportement au
nom de la conformité au pixel — `ARB-011`, `ARB-012`, `ARB-017`, et la doctrine « le gel ne pose
aucun comportement » qu'ils ont installée — **ne s'appliquent plus**. Ils ont produit des vues
justes et mortes.

**Ce qui reste vrai du gel :** l'apparence. On ne redessine pas, on ne réécrit pas la copie, on ne
déplace pas les blocs. **Ce qui n'est plus vrai :** qu'un bouton dessiné sans comportement doive
rester sans comportement. Un bouton dessiné est un geste promis à l'utilisateur ; le rendre inerte
est un défaut, pas une fidélité.

**Corollaire opérationnel — `P-3` est révoqué.** La règle du tiroir de console est réparée, pas
préservée. Un produit où l'on ne peut créer aucun domaine n'est pas conforme, il est cassé.

**Ce qu'on ne fait pas** : aucun harnais, aucune batterie, aucun instrument de mesure, aucun
compteur de couverture, aucun document d'écart. La preuve qu'une chose marche est qu'elle marche
dans un navigateur.

---

## 3. Le motif unique de câblage

Il existe, il est éprouvé, on l'étend. **Aucun lot n'en invente un autre.**

1. **Le balisage des vues ne bouge pas.** Pas d'`onclick` ajouté dans `src/vues/`. Le comportement
   s'accroche depuis la route, par identifiant et par sélecteur — `ARB-063`.
2. **Chaque route porte son câblage** dans un `cablage.ts` voisin de son `+page.svelte`. Précédents
   à copier : `src/routes/notes/[identifiant]/operationnel/cablage.ts`, `src/routes/console/cablage.ts`.
3. **Les adresses sortent de `$lib/rangement/adresses.ts`.** Jamais de gabarit d'URL écrit à la main.
4. **Une écriture passe par une action serveur**, soumise en `POST` — `soumettreVers()` pour un
   formulaire existant, sinon un `<form>` d'enveloppe posé dans le `+page.svelte` de la route.
5. **Un geste destructeur demande confirmation** — `cablerLaSuppression()` porte déjà le motif.
6. **Un lien mort devient une vraie adresse** dans la vue, par la fabrique d'adresses. C'est la
   seule modification autorisée dans `src/vues/` : `href="#"` → `href={adresseDe…(…)}`.

---

## 4. Les invariants — non négociables

- `pnpm check` sort **0**. On lit le **code de sortie**, jamais un filtre sur la sortie.
- `pnpm test:unit` reste vert. On n'ajoute pas de test ; on ne casse pas ceux qui existent.
- **Aucun fichier partagé n'est modifié par deux lots.** `$lib/cablage/formulaires.ts`,
  `$lib/rangement/adresses.ts` et `$lib/base/schema.ts` sont **en lecture seule** pour tous les lots.
  Un lot qui a besoin d'une fonction nouvelle l'écrit dans son propre `cablage.ts`.
- **Le vocabulaire ne souffre aucun synonyme** : Note, Fiche, Registre, Univers, Domaine, Dossier,
  Étiquette, Relation, Signet, Fraîcheur, Vérifier, Console.
- `mockups/`, `cadrage/` et `règles/` sont **en lecture seule**.

---

## 5. Les lots

Partition par **propriété exclusive de fichiers** : deux lots ne touchent jamais le même fichier,
donc les huit tournent en parallèle sans coordination.

### L0 — Socle *(fait avant le lancement, par moi)*

Débloque les autres, et ne peut pas être parallélisé.

1. Réparer la règle du tiroir de console — `V-27/28/29/30/32.css`, une ligne chacun.
2. Réaligner `migrations_appliquees` sur le schéma monté.
3. Resynchroniser l'index Meilisearch sur les 32 notes.

### Les huit lots parallèles

| Lot | Périmètre | Gestes | Fichiers possédés |
|---|---|---|---|
| **L1** | Coquille et navigation | 16 | `lib/coquille/*`, `routes/+layout.svelte` |
| **L2** | Faces publiques | 16 | `V-01/02/03/04/05/06`, routes `/`, `/recherche`, `/guides`, `/connexion`, `/mot-de-passe-oublie` |
| **L3** | Lecture de note et historique | 34 | `V-14/15/16`, `lib/lecture/*`, routes `/notes/[id]`, `/notes/[id]/comparaison`, `/notes/[id]/relations` |
| **L4** | Éditeur des deux registres | 65 | `V-17/18`, `lib/edition/*`, routes `/notes/nouvelle`, `/notes/[id]/modifier`, `/notes/[id]/operationnel` |
| **L5** | Rangement | 59 | `V-10/11/12/13/22/23/26`, routes `/univers/**` |
| **L6** | Consoles — structure | 45 | `V-27/28/29/30`, `lib/console/*`, routes `/console/{univers,domaines,types-de-fiches,types-de-relations}` |
| **L7** | Consoles — exploitation | 40 | `V-31/32/33/34/35/36`, routes `/console/{templates,comptes,configuration,analytique,imports,exports}` |
| **L8** | Recherche, graphes, profil | 63 | `V-07/08/19/20/21/24/25/38`, routes `/bibliotheque`, `/cartographie*`, `/carte-mentale`, `/importer`, `/mon-profil` |

**Total : 338 gestes, 0 orphelin.**

### Actions serveur à créer

Les consoles savent supprimer, elles ne savent pas créer ni modifier. À la charge de L6 et L7 :

| Route | Existe | À écrire |
|---|---|---|
| `/console/univers` | `supprimer` | `creer`, `enregistrer` |
| `/console/domaines` | `supprimer` | `creer`, `enregistrer` |
| `/console/types-de-fiches` | `supprimer`, `delester` | `creer`, `enregistrer` |
| `/console/types-de-relations` | `supprimer` | `creer`, `enregistrer` |
| `/console/templates` | `supprimer`, `marquerParDefaut` | `creer`, `enregistrer` |

### Les deux chantiers de données

- **L4** — écrire une ligne `versions` à chaque enregistrement de note. `edition.ts:1048` sait déjà
  le faire ; le chemin n'est pas emprunté. L4 possède `src/lib/donnees/edition.ts`.
- **L3** — ouvrir la route de l'historique et la servir depuis `histoire.ts`, qui lit déjà `versions`.

---

## 6. Le critère de fin, par lot

Pas de rapport, pas de journal, pas de dossier. Un lot est fini quand, **dans un navigateur** :

1. Chaque geste de son périmètre produit un effet observable — une navigation, une écriture en base,
   un changement d'état visible.
2. Aucun geste ne mène à une page d'erreur ni ne reste sans réponse.
3. `pnpm check` sort 0 et `pnpm test:unit` est vert.

Un lot rend **une liste des gestes câblés et des gestes laissés de côté avec la raison**. Rien
d'autre. Un geste qu'on ne sait pas câbler se déclare ; il ne se maquille pas.

---

## 7. Brief opératoire — commun à tous les lots

**Environnement, déjà debout.** Ne pas le redémarrer, ne pas en lancer un second.

- Serveur de développement : `http://127.0.0.1:5199` (Vite recharge tout seul).
- Base : conteneur `codicillus-db-1`, `docker exec codicillus-db-1 psql -U codicillus -d codicillus -c "…"`.
- Recherche : `http://127.0.0.1:19700`. `pnpm base:reindexer` reconstruit l'index.

**Obtenir une session pour tester** — le cookie est `Secure`, donc un bocal `curl` sur `http://`
ne le retient pas ; on le lit dans les en-têtes :

```bash
curl -s -D /tmp/h.txt -o /dev/null -X POST http://127.0.0.1:5199/connexion \
  -H "Accept: text/html" \
  --data-urlencode "identifiant=sophie.nguyen" --data-urlencode "motdepasse=audit-2026"
S=$(grep -oE 'codicillus_session=[^;]+' /tmp/h.txt | head -1)
curl -s -H "Cookie: $S" http://127.0.0.1:5199/…
```

Comptes de développement, mot de passe `audit-2026` : `sophie.nguyen` (administrateur),
`marc.ferreira` (contributeur), `pierre.dubois` (lecteur, désactivé).

**Éprouver une action serveur** sans passer par le navigateur :

```bash
curl -s -H "Cookie: $S" -X POST "http://127.0.0.1:5199/notes/n-restaurer-pg?/verifier" -d ""
# → {"type":"success",…}  et la base bouge. C'est la preuve, pas le rendu.
```

**Vérification de fin de lot** — dans cet ordre :

1. Chaque geste du périmètre produit un effet observable. On le montre par une requête ou par la base.
2. `pnpm check` — on lit le **code de sortie**, jamais un filtre sur la sortie. Il doit valoir 0.
   Huit lots tournent ensemble : si l'échec est un module introuvable bizarre, relancer une fois
   avant d'y croire — `.svelte-kit/` est partagé.
3. `pnpm test:unit` reste vert. On n'ajoute aucun test.

**Ce qu'on rend** : la liste des gestes câblés, et la liste des gestes laissés de côté **avec la
raison**. Rien d'autre. Aucun rapport, aucun journal, aucun document d'écart.

**Interdits** : modifier `mockups/`, `cadrage/`, `règles/` ; modifier `$lib/cablage/formulaires.ts`,
`$lib/rangement/adresses.ts`, `$lib/base/schema.ts` ; ajouter un test, une batterie, un instrument ;
toucher un fichier hors de son périmètre. Un besoin hors périmètre se **déclare**, il ne se prend pas.
