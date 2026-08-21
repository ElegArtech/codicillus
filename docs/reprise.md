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

## Ce qui marche, écran par écran — mesuré, pas déclaré

Une note créée dans le navigateur, puis chaque adresse interrogée. **Tout est à 200 en rédacteur**,
et l'écran montre bien la donnée réelle :

| | |
|---|---|
| accueil | indicateurs, activité, corbeille de révisions, périmètre du compte |
| recherche | résultats réels, facettes, compteurs, pastilles, état vide, périmètre anonyme |
| lecture d'une note | titre, corps rendu, cartouche, sommaire, relations, rétroliens, consultations |
| **historique** | les vraies versions, ouvert par `?version`, **restaurer marche** et capture sa version |
| comparaison | modes Texte et Visuel sur les vraies versions, alternative textuelle |
| **éditeur** | ProseMirror monté sur le nœud du gel — gras, titres, listes, tâches, tableaux, alertes |
| univers, domaine, notes, dossiers | listes, compteurs, santé, **modules désactivés qui disparaissent** |
| signets | créer, modifier, supprimer |
| cartographie, par type, carte mentale | le graphe des vraies relations, alternative textuelle |
| profil, import, guides | préférences enregistrées, import idempotent, simulation qui n'écrit rien |
| **console** (12 écrans) | 200 en administratrice, **404 en rédacteur**, onze actions qui écrivent |

## Le parcours complet, joué dans un navigateur

Base fraîchement semée, session réelle, une seule exécution :

```
POST /connexion                                303 → /
POST /notes/nouvelle                           303 → /notes/n-bascule-du-reseau-de-secours
POST /notes/{id}/operationnel?/enregistrer     200      le second registre
POST /notes/{id}/modifier                      303      version capturée
GET  /notes/{id}?version                       200      Version 2 | Version 1
POST /notes/{id}?/deposerPiece                 200      TXT · plan · 15 o
POST /notes/{id}/relations?/ajouter            200      HÉBERGE Coffre hors site
POST …/dossiers/exploitation?/creerSousDossier 303 → …/dossiers/exploitation/bascule-reseau
GET  /recherche?q=bascule                      200      la note y est
POST /notes/{id}?/supprimer                    303 → /univers/production/infrastructure
GET  /notes/{id}                               404
```

Le titre affiché est celui saisi ; le corps est celui frappé **à la barre d'outils** — titre de
niveau 2, liste à puces. La connexion fonctionne **sans JavaScript**.

## Ce qui ne marche pas encore

### 1. Un geste, et un seul, reste inatteignable

**« Gérer les droits » d'un dossier.** Le gel de V-13 ne porte pas de dialogue pour ce geste : il
renvoie à celui de V-40, bâti sur des classes que `docs/DESIGN.md` range en V-40 seulement et que
`V-13.css` ne déclare pas. Le transcrire le rendrait sans style ; importer la feuille de V-40
mêlerait 85 sélecteurs communs. **Ce que le gel de V-13 porte est livré** : l'origine d'un droit —
« accordé sur ce dossier », « hérité du domaine X », « hérité du dossier Y » — est désormais vraie
(`RG-DRO-01`) au lieu d'être figée.

### 2. Trois finesses déclarées

- **Un dossier déposé sur l'écran d'import de la console perd son arborescence** ; les fichiers
  déposés un à un arrivent entiers. Le gel promet « l'arborescence est conservée telle quelle ».
- **`?dossier=` n'est pas émis** vers `/notes/nouvelle` : V-17 n'a aucune propriété qui le
  recevrait. `?domaine=` l'est, et il est honoré.
- **Les indicateurs de l'accueil et les tuiles de module d'un domaine ne naviguent pas.** V-12
  sait pourtant s'ouvrir déjà filtrée — c'est l'arrivée que son propre commentaire décrit.

### 3. Ce que le gel dit et que la base ne porte pas

`instance` (version, dernière synchronisation), le résumé d'une version, les utilisations d'un
gabarit, la dernière connexion en relatif, la prose chiffrée de V-34. Tout s'affiche en état neutre
explicite. `arrive_le` et le refus d'un courriel indisponible n'ont **aucun nœud** au gel pour se
dire.

### 4. Divergences avec le gel, assumées et à regeler

- **`method="post"` sur le formulaire de connexion.** La maquette ne l'écrit pas, faute de serveur.
  Sans lui, une soumission avant hydratation partait en `GET` **avec le mot de passe dans
  l'adresse** — mesuré sur le HTML servi.
- **Deux panneaux rendus atteignables** — l'historique (V-15) et le tiroir de formulaire des comptes
  (V-32) : la règle GELÉE qui les ouvre vise `.app[data-…]` et les panneaux vivent hors de `.app`.
- **Le dépôt et le retrait d'une pièce jointe** : le gel ne les dessine pas.
- **Les confirmations de suppression** sont natives, pas les dialogues de V-40 ; un refus de
  relation est annoncé par une alerte, le gel employant `window.notifier`, que le produit n'a pas.
- **`RG-M04-10` contre `V-40:3295`** : le cahier nomme trois quantités à rappeler, la maquette en
  construit quatre. Les maquettes priment.
- **`P-08`, l'origine d'une relation**, n'a de place dans aucun gel : elle est rendue sur la route
  dédiée.
- **Le repli sur deux lignes de `.droit`** quand un gestionnaire hérite son droit : le gel n'a pas
  ce cas, aucune règle ne réserve la largeur.

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
