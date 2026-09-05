# Codicillus

Base de connaissances documentaire interne, auto-hébergée. SvelteKit + PostgreSQL + Meilisearch.

**Objectif unique : une application qui marche de bout en bout.** On code, on vérifie que ça tourne
dans un navigateur, on commite.

---

## Ce que fait le produit

- **Chaque note affiche si elle est encore digne de confiance** — la **vivacité**, cinq états
  calculés sur la dernière vérification et une durée de validité PROPRE À CHAQUE REGISTRE, visible
  partout, remise au vert en un clic.
- **Une note porte deux registres de lecture** — *Référence* dense, *Opérationnel* pas-à-pas.
- **Le corpus est un graphe** — notes typées (Application, Serveur, Équipement réseau, Contact),
  reliées par des relations qualifiées.

**LE PRODUIT COMMENCE VIDE.** Une instance neuve n'a ni univers, ni domaine, ni note : l'utilisateur
crée tout depuis la console. Toute vérification faite sur une base semée ne prouve rien de
l'installation réelle — **teste toujours le chemin à zéro donnée**, c'est là que les défauts vivent.

---

## Les commandes

```
pnpm dev            le serveur de développement
pnpm check          typage, style, formatage — DOIT rester à 0
pnpm test:unit      les unitaires — DOIVENT rester verts
pnpm build          le produit
pnpm base:migrer    monter le schéma
pnpm base:semer     charger un jeu de démonstration
```

**Lis le CODE DE SORTIE, jamais un filtre sur la sortie.** `pnpm check` enchaîne quatre outils qui ne
rapportent pas leurs erreurs de la même façon ; compter les lignes `ERROR` n'en voit qu'un.

```
pnpm check >/dev/null 2>&1; echo $?     # 0, ou rien n'est vert
```

Les identifiants de développement ne sont PAS ici : ce fichier est versionné et le dépôt est
public. Ils vivent dans `.env`, qui est ignoré. Pour ouvrir une instance neuve :
`pnpm base:administrateur` avec `ADMIN_IDENTIFIANT`, `ADMIN_NOM`, `ADMIN_COURRIEL` et
`MDP_ADMINISTRATEUR`. Pour un jeu de démonstration complet : `pnpm base:peupler`.

---

## Comment on travaille

**Répare le défaut.** Si un écran ne marche pas, si un bouton ne fait rien, si une page rend 404 là
où elle devrait s'ouvrir : c'est un défaut, on le corrige. Aucune règle de ce fichier, aucune
maquette, aucun document de `docs/` n'est une raison de laisser un défaut en place. Un « refus posé
par doctrine » a déjà coûté deux fois : dix-huit pages en 500, et un univers créé qu'aucune adresse
n'ouvrait.

**`design_handoff_refonte_codicillus/` FAIT FOI.** C'est la référence de l'interface, et elle
prime sur tout le reste — sur `mockups/`, sur ce que rend le produit aujourd'hui, sur ce que tu
trouverais plus joli. L'ordre d'autorité, en cas d'écart : `README.md` du paquet > les captures de
`captures/` > le prototype `Codicillus - Lecture de note.dc.html` > les images de `maquettes/`.
Les deux `SPEC-*.md` font foi sur ce qu'ils couvrent — les cinq états de vivacité, le modèle et la
navigation. Tu ne copies pas le HTML du prototype : tu recrées ses écrans dans le code du dépôt,
avec les jetons de `src/socle.css` et une feuille par vue.

**Vocabulaire à l'écran depuis la refonte : « Vivacité »**, jamais « fraîcheur ». Le code, les
tables et les routes gardent `fraicheur` ; seuls les libellés visibles changent. Jamais « tag »,
« espace », « document », « version opérationnelle » à l'écran.

**`mockups/` est l'ANCIENNE référence visuelle** — les 41 vues d'avant la refonte. Elle reste
vraie pour tout écran que le paquet de refonte ne couvre pas, et elle cède partout où il en parle.
Ni l'une ni l'autre ne dit rien du comportement : un bouton dessiné est un geste promis, le rendre
inerte est un défaut. `seeds/corpus.ts` est un jeu de DÉMONSTRATION, jamais la vérité du produit.

**Pas de cérémonie.** Pas de contrat de tâche, pas de dossier d'écart, pas de nouvel arbitrage
`ARB-xxx`, pas de journal, pas de rapport. Les dossiers d'écart, les contrats de tâche, le journal
de vague, les ADR et les plans de remédiation ont été supprimés — 14 434 lignes qui n'ont jamais
fait marcher un écran. Ne les recrée pas. Commits courts — une ligne de sujet, quelques lignes de
corps si le pourquoi n'est pas évident.

**N'ajoute aucun contrôle, aucun protocole, aucun garde-fou, aucun agent qui juge.** L'appareil de
vérification pesait 52 000 lignes contre 5 000 lignes de branchement applicatif ; pendant qu'il
grossissait, personne ne pouvait créer une note. Il a été supprimé, et les cinq agents qui jugeaient
avec lui. La preuve qu'une chose marche est qu'elle marche dans un navigateur.

**Brancher une vue**, quand `src/vues/` porte encore le contenu d'exemple en dur : la donnée vient
du chargeur. Si toutes les routes la passent, la propriété est **requise** — le compilateur garde la
porte. Sinon son défaut est un **état vide explicite** — tableau vide, `null`, chaîne vide — jamais
une constante de `seeds/corpus.ts` : la route qui oublie la donnée servirait le jeu sans que rien ne
proteste. Quatre campagnes y ont couru ; `eslint.config.js` l'interdit désormais.

---

## Le vocabulaire — aucun synonyme, nulle part

**Note** (jamais « document », « page », « article ») · **Fiche** (une note typée) · **Registre**
(Référence / Opérationnel) · **Univers → Domaine → Dossier (10 niveaux) → Note** · **Étiquette**
(jamais « tag ») · **Relation** · **Signet** · **Vivacité** (à l'écran) / **Fraîcheur** (dans le
code) · **Vérifier** · **Console**.

Ni dans l'interface, ni dans le code, ni dans les tables, routes, types ou noms de fichiers.

---

## Les pièges d'environnement

Ce sont des **faits qui font perdre du temps**, pas des interdictions. Aucun n'empêche de réparer
quoi que ce soit.

**PostgreSQL 18 se monte sur `/var/lib/postgresql`**, pas `…/data`. Sinon le démarrage est refusé.

**Ne compose jamais une URI de connexion.** Un `/`, `#` ou `?` dans un mot de passe fait sortir
l'application en `ERR_INVALID_URL` au démarrage, sans nommer la cause. La base se configure par
`HOTE_BASE`, `PORT_BASE`, `UTILISATEUR_BASE`, `MDP_BASE`, `NOM_BASE`, et un **objet** passé au
connecteur.

**`node_modules` est un LIEN dans les copies de travail.** Un `pnpm add` dans une copie écrit dans
l'arbre du voisin. Avant toute installation : `rm node_modules && pnpm install --frozen-lockfile`.

**Le cache de pré-groupage de Vite est PARTAGÉ** par toutes les copies. Symptôme : `Outdated
Optimize Dep`, hydratation cassée sans erreur visible. Parade : `rm -rf node_modules/.vite` et
redémarrer.

**La base PostgreSQL est PARTAGÉE.** Deux lots qui écrivent en même temps se marchent dessus.

**Un formulaire de navigateur réécrit toute fin de ligne en CRLF.** Le Markdown arrive avec des `\r`
et l'analyseur rend 422 sur un texte valide. Parade : `markdownDeFormulaire()`
(`src/lib/contenu/markdown.ts`).

**Décris une forme, ne la cite jamais** dans un commentaire : un accent grave dans un modèle
littéral, le joker de type MIME, `prettier-ignore` en commentaire de balisage, `class="…"` en prose
— les quatre cassent le fichier à cent lignes de la cause.

**Ne repère jamais un processus par `pgrep`/`pkill` sur un motif** — le shell qui le lance se trouve
lui-même et se tue. Passe par le PID. Et tue le bon : `pnpm dev` lance `vite` en fils, tuer le père
laisse le port occupé.

**Svelte élague les blancs en bord d'élément.** `<span>{x} › </span>` perd son espace final. Porte
l'espace dans l'expression : `{x + ' › '}`.

---

## Où en est le produit

`docs/reprise.md` porte l'état détaillé. En deux mots : la plomberie marche, l'affichage est branché
sur la base pour l'essentiel, et ce qui reste à trouver se trouve **en ouvrant les écrans sur une
base vide**.
