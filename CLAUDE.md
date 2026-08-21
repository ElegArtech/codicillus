# Codicillus — contrat de l'agent

Base de connaissances documentaire interne, auto-hébergée, pour une direction technique de
50 à 200 personnes. SvelteKit + PostgreSQL + Meilisearch.

**On est en réalisation accélérée. Objectif unique : une application qui marche de bout en bout.**
Pas de contrat de tâche, pas de dossier d'écart, pas de journal, pas de batterie nouvelle. On code,
on vérifie que ça tourne dans un navigateur, on commite.

---

## 1. Les sources — lecture seule, jamais modifiées

| Où | Quoi |
|---|---|
| `mockups/` | **Les 41 vues gelées.** Elles font la loi sur le rendu. Le bit d'écriture est retiré |
| `cadrage/` | Cahier des charges, brief des vues, pile technique |
| `règles/` | La méthode |

**Les maquettes décident de L'APPARENCE, et de rien d'autre.** Un conflit de rendu se tranche par :
*maquettes > cahier des charges > brief > pile technique*. On ne redessine pas.

**Elles ne décident NI du comportement, NI des données.** Cette confusion a coûté une semaine : les
41 vues ont été transcrites fidèlement puis laissées mortes — 338 gestes sans écouteur, 74 liens
vers nulle part — au motif que le gel « ne pose aucun comportement ». Un bouton dessiné est un geste
promis à l'utilisateur ; le rendre inerte est un défaut, pas une fidélité. De même, `seeds/corpus.ts`
transcrit les données des maquettes : c'est un jeu de DÉMONSTRATION, jamais la vérité du produit.

**LE PRODUIT COMMENCE VIDE.** C'est un outil de gestion des connaissances : une instance neuve n'a ni
univers, ni domaine, ni note, ni paramètre — l'utilisateur crée tout. Toute vérification faite sur
une base semée ne prouve donc rien de l'installation réelle. Mesuré le 21/08/2026 : sur une base
migrée mais non semée, **les dix-huit pages essayées sortaient en 500**, et les deux causes étaient
des refus posés par doctrine (« échoue plutôt que de se donner un défaut »).

`docs/arbitrages.md` porte les décisions numérotées `ARB-xxx` ; elles priment sur le cadrage sur les
points qu'elles nomment. `docs/errata-cadrage.md` dit ce que le cadrage affirme et qui est faux.

---

## 2. Ce que fait le produit

- **Chaque note affiche si elle est encore digne de confiance** — un signal de fraîcheur calculé sur
  la date de dernière vérification, visible partout, remis au vert en un clic.
- **Une note porte deux registres de lecture** — *Référence* dense, *Opérationnel* pas-à-pas.
- **Le corpus est un graphe** — notes typées (Application, Serveur, Équipement réseau, Contact),
  reliées par des relations qualifiées.

---

## 3. Le vocabulaire — aucun synonyme, nulle part

**Note** (jamais « document », « page », « article ») · **Fiche** (une note typée) · **Registre**
(Référence / Opérationnel) · **Univers → Domaine → Dossier (10 niveaux) → Note** · **Étiquette**
(jamais « tag ») · **Relation** · **Signet** · **Fraîcheur** · **Vérifier** · **Console**.

Ni dans l'interface, ni dans le code, ni dans les tables, routes, types ou noms de fichiers.

---

## 4. Les commandes

```
pnpm dev            le serveur de développement
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires de src/ et seeds/ — DOIVENT rester verts
pnpm build          le produit
pnpm base:migrer    monter le schéma
pnpm base:semer     charger le jeu de semence
```

**Lis le CODE DE SORTIE, jamais un filtre sur la sortie.** `pnpm check` enchaîne quatre outils —
`svelte-check`, `tsc`, `eslint`, `prettier` — et ils ne rapportent pas leurs erreurs de la même
façon. Compter les lignes `ERROR "` ne voit que le premier : une erreur `eslint` passe alors pour un
vert. Mesuré — `'ParentNode' is not defined` a traversé trois commits annoncés à zéro.

```
pnpm check >/dev/null 2>&1; echo $?     # 0, ou rien n'est vert
```

**Le harnais de vérification a été supprimé le 21/08/2026.** Il pesait 52 000 lignes contre 5 000
lignes de branchement applicatif. Ne le reconstruis pas. Ne crée aucune batterie, aucun instrument,
aucun compteur de couverture. La preuve qu'une chose marche est **qu'elle marche dans un navigateur**.

---

## 5. Comment on branche une vue

Les vues de `src/vues/` sont des transcriptions fidèles des maquettes, avec le contenu d'exemple du
gel **écrit en dur**. Les chargeurs de `src/routes/` servent déjà les vraies données. Le travail est
de faire passer l'un dans l'autre :

1. **Déclarer des propriétés optionnelles** sur la vue, avec la constante de `seeds/corpus.ts` pour
   défaut. Le rendu par défaut ne bouge donc pas.
2. **Remplacer le contenu en dur** par la propriété.
3. **Passer la donnée** depuis `+page.svelte`.

Le câblage des formulaires (`method`, `action`, champs nommés) vit dans `src/routes/**/+page.svelte`
et dans `$lib/cablage/formulaires.ts` — `ARB-063`.

---

## 6. Les pièges qui mordent encore

**P-11 · PostgreSQL 18 se monte sur `/var/lib/postgresql`**, pas `…/data`. Sinon le démarrage est
refusé.

**P-13 · Ne compose jamais une URI de connexion.** Un `/`, `#` ou `?` dans un mot de passe fait
sortir l'application en `ERR_INVALID_URL` au démarrage, sans nommer la cause. La base se configure
par `HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE`, et un **objet** passé au
connecteur (`ARB-038`).

**P-16 / P-24 · `node_modules` est un LIEN dans les copies de travail.** Un `pnpm add` dans une copie
écrit dans l'arbre du voisin. Avant toute installation : `rm node_modules && pnpm install
--frozen-lockfile`. Et deux lots qui touchent `package.json` ne se fusionnent jamais par copie.

**P-29 · Le cache de pré-groupage de Vite est PARTAGÉ** par toutes les copies. Symptôme :
`Outdated Optimize Dep`, `There is a new version of the pre-bundle`, hydratation cassée sans erreur
visible. Parade : `rm -rf node_modules/.vite` et redémarrer le serveur.

**P-30 · La base PostgreSQL est PARTAGÉE.** Deux lots qui écrivent en même temps se marchent dessus.
Au-delà de quatre copies concurrentes, donne une base à chaque lot qui écrit.

**P-34 · Un formulaire de navigateur réécrit toute fin de ligne en CRLF.** Le Markdown arrive donc
avec des `\r` et l'analyseur rend 422 sur un texte valide. Parade posée :
`markdownDeFormulaire()` (`src/lib/contenu/markdown.ts`), à la frontière de transport.

**P-35 · Deux lots parallèles qui se parlent par un contrat de données** — noms de champs, codes de
retour — doivent le lire au même endroit. Recopié dans deux contrats, il diverge en silence : une
note s'est créée avec un corps vide, en 303, sans que rien ne s'en plaigne.

**P-17 / P-27 / P-9 / P-20 · Décris une forme, ne la cite jamais.** Un accent grave dans un modèle
littéral, le joker de type MIME dans un commentaire de bloc, `prettier-ignore` dans un commentaire de
balisage, `class="…"` en prose : les quatre cassent le fichier à cent lignes de la cause.

**P-1 · Ne repère jamais un processus par `pgrep`/`pkill` sur un motif** — le shell qui le lance se
trouve lui-même et se tue. Passe par le PID.

**P-8 · Svelte élague les blancs en bord d'élément.** `<span>{x} › </span>` perd son espace final.
Porter l'espace dans l'expression : `{x + ' › '}`.

**P-3 · RÉVOQUÉ le 21/08/2026, et voici pourquoi il est resté faux si longtemps.** Il disait que le
panneau `tiroir-form` des consoles ne glisse jamais « et c'est le gel », et interdisait de le
réparer. Le constat technique était juste — la règle vise un descendant, or le panneau est un FRÈRE
de `.app` — mais la conclusion était fausse : aucune des cinq consoles ne pouvait rien créer. La
règle de frère est posée, le tiroir s'ouvre.

**Un piège décrit un FAIT D'ENVIRONNEMENT qui fait perdre du temps. Il n'interdit jamais de réparer
un défaut du produit.** P-3 avait glissé de l'un à l'autre.

---

## 7. Ce qui reste à faire

`docs/reprise.md` porte l'état. En deux mots : **la plomberie marche, l'affichage non.** On peut
créer, modifier et supprimer une note — la base et les codes HTTP le prouvent — et la plupart des
écrans montrent encore le contenu d'exemple du gel au lieu des vraies données. C'est ça, le travail.
