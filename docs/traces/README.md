# Les traces

**Une trace n'est pas une batterie.** Elle ne rend aucun verdict opposable, elle ne s'ajoute pas à
`pnpm verify`, et son vert ne prouve rien de plus que ce qu'elle a fait. Elle **raconte**, avec ses
codes HTTP, ce qu'un utilisateur a pu faire dans un navigateur.

Elle existe parce que, le 21 août 2026, **vingt batteries mesuraient le produit et aucune ne
demandait : peut-on créer une note ?** Le `501` était déclaré depuis des jours dans le fichier qui le
portait, et il a fallu que le commanditaire pose la question pour qu'il remonte.

> *Une batterie mesure ce qu'on lui a demandé de mesurer. Le produit se juge à ce qu'un utilisateur
> peut en faire.*

**Aucune des trois n'est branchée à une commande de `package.json`, et c'est délibéré.** Une trace
qu'on ajoute à `pnpm check` devient une batterie : elle prend un verdict opposable, elle bloque, et
le harnais recommence à pousser. Elles se lancent à la main, avec les lignes de commande écrites
ci-dessous — comme `creer-modifier-supprimer-une-note.mjs` depuis le 21/08.

## `creer-modifier-supprimer-une-note.mjs`

Les trois gestes fondamentaux du produit, joués de bout en bout dans Chromium.

```bash
pnpm exec vite dev --port 5199 --strictPort &
PORT_TRACE=5199 node docs/traces/creer-modifier-supprimer-une-note.mjs .
```

Elle **prépare son décor et le dit** — c'est ce qui la distingue d'un instrument qui triche :

1. elle pose un mot de passe sur `karim.belhadj` (la semence n'en pose aucun ; c'est la console M14.6
   qui les pose, et la batterie 6 fait exactement ce geste) ;
2. elle pose un droit `gestionnaire` sur les dossiers racine — **`droits_de_dossier` porte zéro
   ligne** dans le jeu de semence, et `RG-DRO-02` rend alors le produit en lecture seule pour tout le
   monde.

Le relevé de la dernière exécution est dans `creer-modifier-supprimer-une-note.txt`.

**Elle écrit en base**, comme tout ce qui mesure ce produit : ne la lancer que sur une base dont on
accepte qu'elle bouge, et jamais en concurrence avec un autre lot (`P-30`).

---

## Les deux garde-fous — `passage-a-froid.mjs` et `aiguilles-dans-le-paquet.mjs`

Ils existent parce que, le 26 août 2026, **quatre campagnes avaient couru après les symptômes d'une
seule cause** : une vue déclarait une propriété *optionnelle* dont le défaut était une constante de
`seeds/corpus.ts`, si bien qu'une route qui oubliait de passer la donnée servait le jeu de
démonstration **sans que rien ne proteste**. La règle `no-restricted-imports` d'`eslint.config.js`
ferme la porte par laquelle le défaut est entré ; elle interdit des *spécificateurs d'import*, et
**aucun des quarante littéraux relevés ne passait par un import**. Elle est structurellement aveugle
à ce motif-là.

> **Le premier vérifie ce qui s'affiche, le second ce qui se livre. Deux propriétés distinctes, et
> les deux étaient fausses.**

```bash
pnpm build
node docs/traces/passage-a-froid.mjs --tel-quel
node docs/traces/aiguilles-dans-le-paquet.mjs --tel-quel
```

Sans `--tel-quel`, chacun construit le produit lui-même. Les deux rendent `0` ou `1`. Les relevés de
la dernière exécution sont dans `passage-a-froid.txt` et `aiguilles-dans-le-paquet.txt`.

**Le passage à froid écrit en base**, comme tout ce qui mesure ce produit — mais dans une base à lui,
`codicillus_passage_a_froid`, qu'il détruit et recrée à chaque passage. Aucune autre base du poste
n'est touchée.

### `passage-a-froid.mjs` — ce qui s'affiche · **rend 0**

Il détruit sa base, la recrée, applique les migrations, **n'en sème aucune donnée**, crée le premier
administrateur, puis **crée à la main le strict nécessaire par les écrans de la console** — un
univers, un domaine, deux notes, un signet, tous nommés hors du jeu. Il ouvre ensuite les
**trente-neuf routes** dans Chromium, en session et en anonyme, et lit **le HTML servi** autant que
le rendu hydraté. C'est exactement le geste que `schema.ts:444` et `identite.ts:12` racontent avoir
fait à la main le 21/08/2026 ; automatisé, il aurait attrapé le seul défaut vraiment *servi* du
balayage — ouvrir n'importe quelle note en modification affichait le corps de la note de
démonstration, **permanent sans JavaScript**.

**Chaque route porte le code HTTP qu'on attend d'elle, écrit à côté d'elle**, et le verdict le pèse.
Le passage a longtemps imprimé ce code sans jamais le juger : trente-neuf pages en 500 se seraient
relevées en 500 sous un « PASSAGE À FROID COMPLET » et un code de sortie `0` — et le dépôt porte
précisément cet incident-là au passé. Un écart au code attendu est désormais une fuite au même titre
qu'une aiguille du jeu : il s'affiche au relevé, il nomme la route, et il fait rendre `1`.

Il **pose son décor et il le dit** : `droits_de_dossier` ne porte aucune ligne sur une instance
neuve, et `RG-DRO-02` rend alors le produit en lecture seule pour tout le monde. Sans un droit
`gestionnaire` posé en base, aucune note ne peut naître. Le mot de passe de son compte est **tiré au
hasard à chaque passage** : le compte meurt avec la base, mais ce dépôt est public et n'y écrit aucun
littéral qui ressemble à un identifiant.

Il mesure **le produit construit**, jamais `vite dev` : le serveur de développement sert les sources,
commentaires compris, et l'un d'eux cite légitimement une adresse du jeu.

### `aiguilles-dans-le-paquet.mjs` — ce qui se livre · **rend 1 aujourd'hui, sur quatre littéraux**

Il lit chaque octet du paquet construit. Une branche morte ne s'affiche nulle part et part quand même
chez le lecteur : les 57 Ko de `/bibliotheque` qui importaient le corpus **en valeur**, les 30 Ko du
corps de démonstration sur le chunk de `/notes/{id}`, l'arborescence entière du gel dans tout chunk
montant une coquille. **Aucun test de rendu ne verra jamais rien de tout cela.**

**Il lit les DEUX moitiés du paquet.** La première rédaction ne balayait que `build/client/` en
annonçant mesurer « ce qui se livre » : une zone aveugle sur la moitié du paquet, et elle n'était
déclarée nulle part. `build/server/` se livre aussi — c'est ce que l'image porte et ce que
`node build/index.js` exécute.

| Zone | Ce que c'est | Relevé |
|---|---|---|
| `build/client/` | **ce qui part chez le lecteur** — servi comme ressource statique, lisible par qui veut, **y compris par qui reçoit 404** | occurrence par occurrence |
| `build/server/` | **ce qui tourne sur le serveur** — aucun octet n'en part vers un navigateur, mais chaque littéral est **à une route** de s'y rendre | fichier par fichier |

**Le relevé sépare le code de notre propre prose.** `build/server/` n'est pas minifié : chaque
commentaire de documentation du dépôt s'y retrouve mot pour mot, et l'historique de ce produit cite
les noms du jeu par dizaines — l'en-tête de `Rail.js` énumère les quatorze dossiers du gel pour
raconter ce qu'il a réparé. Ces occurrences **comptent, sont relevées et font échouer le contrôle**
comme les autres : rien n'est exempté. Mais chaque ligne du relevé dit ce qu'elle est —
`← n DANS DU CODE`, `(commentaires de documentation)`, `(carte de source)` —, et les fichiers qui
portent du code passent **en tête**. Les deux ne se réparent pas de la même façon, et les confondre
est le plus court chemin vers un garde-fou qu'on débranche.

**Les deux font échouer le contrôle.** Une zone qu'on mesure sans en tirer de code est une zone qu'on
ne mesure pas.

**Ce que la zone aveugle avait laissé passer est retiré.** Mesuré le 28/08/2026 avant le lot L1,
`build/server/` portait quatre cents occurrences, et la principale était le chunk de `creation.js` :
**85 314 octets**, `CORPUS` sérialisé en entier, importé par **dix** nœuds de routes — pendant que le
contrôle déclarait « PAQUET PROPRE » sur l'autre moitié. La cause était nommée dans le dépôt, au bloc
d'exemption d'`eslint.config.js` : `creation.ts` et `signets-ecriture.ts` empruntaient `corpsVide()`
à `src/lib/base/semence.ts`, qui importe `CORPUS` **en valeur**. **L1 a déplacé `corpsVide()`** de
`src/lib/base/semence.ts` vers `src/lib/contenu/corps-vide.ts`, sans un import de `seeds/` :
`creation.js` est passé à **65 263 octets**, et plus une note du jeu n'y est sérialisée. Le contrôle
rend désormais **0 sur cette moitié au mérite**, pas par cécité.

**Ce qui reste, et pourquoi il rend encore 1** — mesuré sur la construction du 28/08 après L1 :

- **`build/client/` — quatre occurrences sur deux fichiers, toutes DANS DU CODE.** Le nœud d'erreur
  porte `bascule-telephonie-voip`, `restaurer-une-sauvegarde-mariadb` et
  `comptes-a-privileges-production` — la table d'adresses de la planche de `V-26`, gardée parce que
  la propriété `adresse` est restée optionnelle. Le nœud de la carte mentale porte `Applications`, le
  filtre par nom de domaine de `V-21:141`. Ces chunks sont servis **comme ressources statiques, avant
  toute autorisation** : n'importe qui les lit, y compris qui reçoit 404. Le remède : rendre
  `adresse` **requise** dans V-26 — et reprendre les trois cas de
  `proprietes-coquille.test.ts:763-790` sur une autre source que le repli —, et faire filtrer l'axe
  restreint de V-21 sur une donnée de droits plutôt que sur un nom.
- **`build/server/` — 371 occurrences sur 110 fichiers, dont 4 seulement dans du code** : 186 sont
  dans des cartes de source et 181 dans des commentaires de documentation. Les **quatre** littéraux
  sont **les mêmes quatre sites** que ci-dessus, vus depuis leur nœud serveur.

Autrement dit : après L1, **le seul jeu de démonstration qui subsiste dans le paquet tient en quatre
littéraux, tous à la même paire de causes**. Le reste est la prose du dépôt.

Un garde-fou vert sur la fuite qu'il devait nommer ne serait pas un garde-fou. Le rouge est le
relevé, il est dans `aiguilles-dans-le-paquet.txt`, et il nomme chaque site.

### Les aiguilles — `aiguilles-du-corpus.mjs`

La liste **n'est pas recopiée : elle est produite par sa source.** Les noms du corpus sont lus dans
`seeds/corpus.ts` par `ssrLoadModule`, comme `base/base.mjs` lit ses commandes — ajouter une note au
jeu ajoute son identifiant et son titre aux aiguilles sans que personne y pense, et la forme de la
source est vérifiée plutôt que supposée. S'y ajoutent les noms que le corpus ne porte pas et que les
relevés du 26/08 ont nommés un par un dans les vues, chacun citant son relevé.

Deux choses s'y lisent, et elles ne sont pas la même :

- **l'écarté** — il y en a **un seul**, « Non classé », et c'est un univers *système* : `schema.ts:193`
  le pose par défaut au titre de `RG-STR-01` et interdit sa suppression, `administration.ts:156` le
  nomme dans l'aide de la console. Ce n'est pas une aiguille : il n'y a rien à voir. La première
  rédaction en portait quatre, mais **trois étaient inertes** — « Comptes », « Accès » et
  « Codicillus 1.0.0 » ne sont jamais posés comme aiguilles, et leur prose décrivait un filtrage qui
  ne filtrait rien. Ce qui écarte réellement les segments d'un seul mot est la garde de
  `aiguillesDuCorpus`, commentée à son site : **un chemin de dossier n'est retenu que s'il porte un
  espace ou un « › »**, parce qu'un chemin d'un seul mot n'accuse personne.
- **les exemptions** — la table est **vide**, et le mécanisme reste. Le brief ne prévoyait qu'un cas :
  *un lot en quarantaine*, dont les noms passeraient encore, exempté nommément et provisoirement. La
  première rédaction en posait quatre **hors de ce cas** — les six lots étaient fusionnés, aucun
  n'était en quarantaine —, si bien que le contrôle partait vert sur les quatre fuites clientes
  ci-dessus. Elles sont retirées. Une exemption ne vaudrait de toute façon **que pour le paquet** et
  **jamais pour le HTML servi**, et **elle expirerait seule** : une exemption qui ne trouve plus rien
  **fait échouer le contrôle**, avec l'ordre de la retirer.
