# Où reprendre

*État au 21 août 2026, réalisation accélérée. Le harnais de vérification a été supprimé : ce
document ne cite plus de batterie, il dit **ce qu'un utilisateur peut faire**.*

---

## Ce qui marche, prouvé dans un navigateur

| Geste | Trace |
|---|---|
| Se connecter | `POST /connexion` → **303** → `/` |
| Créer une note | `POST /notes/nouvelle` → **303** → `/notes/{identifiant}` |
| Modifier une note | `POST /notes/{id}/modifier` → **303**, version capturée |
| Supprimer une note | `POST /notes/{id}?/supprimer` → **303**, puis **404** sur la note |
| Créer un signet | `POST .../signets/nouveau` → **303** → `/notes/{identifiant}` |
| Modifier un signet | `POST .../signets/{id}/modifier?/enregistrer` → **303** |
| Supprimer un signet | `POST .../signets/{id}/modifier?/supprimer` → **303**, puis **404** |

L'aller-retour du corps est **idempotent** : deux réenregistrements sans frappe rendent un document
identique, et aucune version n'est écrite pour un enregistrement sans changement.

Le **produit construit** démarre et sert : `pnpm build` puis `node build/index.js` avec les cinq
variables de base (`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE` — jamais une
URI composée, `P-13`).

---

## Ce qui ne marche pas encore

### 1. La plupart des écrans montrent le gel, pas les données

Les 41 vues sont des transcriptions fidèles des maquettes **avec le contenu d'exemple écrit en dur**.
Les chargeurs servent déjà les vraies données ; personne ne les lit. C'est ça, le travail — la
manière de le faire est au §5 de `CLAUDE.md`.

Mesuré : une note créée à l'instant apparaît sur `/univers/{u}/{d}`, `…/notes` et `…/dossiers/…`,
et **n'apparaît pas** sur la page de lecture d'une note, la recherche, l'accueil, la cartographie.

### 2. L'éditeur n'est pas un éditeur

La zone de rédaction est un `contenteditable` nu. **La barre d'outils est inerte** — cliquer sur
Gras ne fait rien —, et le corps se saisit en Markdown à la main. Monter un vrai éditeur demande
d'installer les paquets ProseMirror manquants ; `prosemirror-model` seul est présent.

### 3. Le produit livré ne laisse écrire personne

**`droits_de_dossier` porte zéro ligne** dans le jeu de semence, et sans droit explicite il n'y a
aucune capacité. Une instance semée puis démarrée est en lecture seule pour tout le monde :
`/notes/nouvelle` y rend 404. Il faut soit que la semence pose des droits, soit que la console soit
le chemin déclaré. Aucune source ne tranche.

### 4. Trois choses attendent un arbitrage

- **`RG-M04-10` contre le gel** : le cahier nomme trois quantités à rappeler avant de supprimer une
  note, `mockups/V-40-dialogues.html:3295` en construit quatre — les pièces jointes s'y ajoutent.
  Les maquettes priment, le produit porte les quatre. Errata ou regel.
- **Le statut par défaut d'une note neuve** : `CDC:187` dit « publiée », et le gel de V-17 presse
  « Publiée ». C'est ce qui est appliqué.
- **La forme des valeurs de rangement soumises** : nom affiché du domaine, chemin affiché du dossier,
  séparateur ` › `. Déduite du gel, pas arbitrée.

---

## Comment on travaille maintenant

Lire `CLAUDE.md` — il tient en une page. En deux mots : **les maquettes font la loi**, on ne
redessine pas, on branche. La preuve qu'une chose marche est qu'elle marche dans un navigateur, avec
ses codes HTTP relevés.

```
pnpm dev            le serveur
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires — DOIVENT rester verts
```

Compte d'essai : `karim.belhadj`, mot de passe `trace-de-session-2026`, droits posés en base de
développement.

**Ne reconstruis pas le harnais.** Il pesait 52 000 lignes contre 5 000 lignes de branchement
applicatif, et pendant qu'il grossissait personne ne pouvait créer une note.
