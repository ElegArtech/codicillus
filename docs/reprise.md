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
POST /notes/{id}?/deposerPiece                 200      TXT · plan-bascule · 21 o
POST /notes/{id}/relations?/ajouter            200      origine visible
GET  /recherche?q=bascule                      200      la note y est
GET  /recherche?q=sauvegarde&tri=alpha         200      tri appliqué
POST /notes/{id}?/supprimer                    303 → /univers/production/infrastructure
GET  /notes/{id}                               404
```

Le titre affiché est celui qui a été saisi, le corps est celui qui a été frappé à la barre d'outils
— titre de niveau 2 et liste à puces —, et la note disparaît vraiment.

## Ce qui ne marche pas encore

### 1. Trois gestes que le gel dessine et que rien n'atteint

- **Créer un compte** (`RG-M14-06`) : aucune action de route. Le bouton ferme le panneau sans rien
  envoyer plutôt que de mentir sur une création.
- **Les octets d'un lot déposé sur l'écran d'import de la console** ne traversent pas : V-35 fait
  atterrir le lot à l'étape du *choix de scénario*, où le parcours d'import n'a aucun état pour les
  tenir. Le dépôt et « Parcourir » répondent, la navigation se fait, les fichiers restent en route.
- **Ajouter une relation depuis la note** : le gel dessine le bouton dans V-14 et le dialogue dans
  V-40, mais V-40 fixe sa note de démonstration en dur — le monter ferait parler l'écran d'une autre
  note que celle regardée. Le geste vit sur `/notes/{id}/relations`.

### 2. Ce que le gel dit et que la base ne porte pas

`instance` (version, dernière synchronisation), le résumé d'une version, les utilisations d'un
gabarit, la dernière connexion en relatif, la prose chiffrée de V-34, et « dernière version il y a
3 semaines » dans la barre d'état des deux éditeurs. Tout cela s'affiche en état neutre explicite —
sauf la dernière, qui reste la chaîne du gel et **est** une valeur illustrative sur une note réelle.

### 3. Cinq divergences avec le gel, assumées et à regeler

- **Le panneau d'historique** (V-15) et **le tiroir de formulaire des comptes** (V-32) sont rendus
  descendants de `.app` pour que la règle GELÉE qui les ouvre puisse s'appliquer — elle vise
  `.app[data-…="ouvert"] …` et les panneaux vivent hors de `.app`. Aucune déclaration inventée.
- **Le dépôt et le retrait d'une pièce jointe** : le gel ne les dessine pas. Les deux nœuds posés
  empruntent leurs formes au gel voisin, depuis la route.
- **La confirmation de suppression** est celle du navigateur, pas le dialogue de V-40.
- **`RG-M04-10` contre `V-40:3295`** : le cahier nomme trois quantités à rappeler, la maquette en
  construit quatre. Les maquettes priment, le produit porte les quatre.
- **`P-08`, l'origine d'une relation**, n'a de place dans aucun gel : elle est rendue sur la route
  dédiée. Le principe est tenu sur le fond, pas à l'endroit que la maquette aurait choisi.

### 4. Trois divergences de tri, mesurées

`alpha` suit l'ordre du moteur et non `localeCompare('fr')` · `verification` range en dernier les
notes jamais vérifiées · `consultations` classe sur la valeur **indexée**, qui dérive de celle de la
base entre deux indexations.

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
