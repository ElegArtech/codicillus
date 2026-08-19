# ÉCART-044 — Lot T-012, authentification et sessions — 20 août 2026

**Quatorze écarts remontés, tous vérifiés par l'orchestrateur. Aucun n'a été écarté.**
Gravité d'ensemble : **haute** — deux des quatorze sont des défauts que rien ne mesurait, et le
premier contredit l'état déclaré du dépôt.

Le lot ferme sa cible : `pnpm verif:maquette:app` reste à **409 conformes, 0 écart, 0 recours** (365,8 s),
`pnpm test:unit` passe de **681 à 759**, la migration `003_authentification` est réversible à empreinte
identique. Rapport complet du lot en pièce, sortie de chaque commande jointe.

---

## É-1 — `pnpm verif:fraicheur` était DÉJÀ ROUGE, et `ARB-029` n'a jamais été appliqué

**C'est le plus important des quatorze, et il ne vient pas de ce lot.**

Le lot a relevé sa ligne de base avant d'écrire, comme le contrat l'exige, et y a trouvé :

```
$ pnpm verif:fraicheur                                   (à HEAD 4f37cc5, avant toute écriture)
verif:fraicheur — ÉCHEC : 1 constat(s).
  B3 — 1 constat(s)
    src/vues/V-14.svelte:345 — .temoin__txt · le libellé ne vient pas de libelleFraicheur()
                                                                          rc 1
```

**Reproduit par l'orchestrateur sur l'arbre principal, au même commit.** Le fait est exact.

### Ce que cela contredit

`docs/reprise.md` — le document qu'une session fraîche lit en premier — affirme :

> « **13 batteries réelles sur 19. Onze vertes.** `verif:menus` rouge à 81 — dette de gel arbitrée
> (`ARB-047`) […] »

**Il y a deux batteries rouges, non une.** Et la seconde est la **batterie 5**, celle qui tient `P-01`
— *« une seule définition de la fraîcheur »* —, le **premier** des dix principes non négociables.

### Et le pire : la décision existait déjà

`ARB-029`, rendu le 19 août, est titré *« La forme compacte du libellé entre dans la fabrique
unique »*. Il tranche exactement ce constat :

> **Décision.** `libelleFraicheur(note, forme)` admet `'longue'` (défaut, inchangée) et `'compacte'`.
> La forme compacte sort **du même niveau et de la même ancienneté** que la longue : ce n'est pas un
> second calcul, c'est un second rendu du même calcul. Aucune vue n'écrit de libellé de fraîcheur en
> dur, et **`pnpm verif:fraicheur` retrouve zéro constat**.

Vérifié fichier ouvert : `src/lib/fraicheur.ts:187` porte `libelleFraicheur(note: EtatDeFraicheur): string`
— **aucun paramètre `forme`**. Et `src/vues/V-14.svelte:135-148` porte toujours les deux libellés en
dur, sous un commentaire qui dit *« Constat remonté, non comblé »* — écrit avant `ARB-029`, et jamais
revu après.

**`ARB-029` a été rendu, puis oublié.** Ce n'est pas une dette de gel comme les 81 entrées Signets :
c'est un **défaut de portage**, corrigeable, avec sa solution déjà écrite. `docs/orchestration.md` §4
est formel : *« aucune ligne de portage n'est jamais admise ; les admettre, c'est les enterrer. »*

### Ce qui a permis à l'erreur de durer

`pnpm verif:fraicheur` n'était dans les critères de sortie d'**aucun** contrat depuis `ARB-029` — il
figure au §8 du contrat de `T-014` et du contrat de `T-012`, annoncé **à 0** dans les deux. Un critère
« inchangé » annoncé vert sur une batterie rouge ne détecte rien : il enregistre.

**Réparation** : lot propre, à appliquer `ARB-029` à la lettre — la fabrique reçoit `forme`, V-14
l'appelle, `verif:fraicheur` retrouve zéro constat, et le banc reste à 409/409 (les 44 couples du
panneau « Position » sont le juge). Et **`docs/reprise.md` est corrigé** : deux batteries rouges.

---

## É-2 — `docs/routes.md` §5.2 contredit §5.5 · **tranché par `ARB-052`**

Vérifié : `:324` veut `302 …motif=page-protegee` pour toute route protégée sans session ; `:370` et
suivantes donnent **404 V-04** en anonyme aux six chemins fixes, et le principe 4 déclarait la matrice
« **entièrement** » indiscernable. Incompatibles pour la même requête.

`ARB-052` tranche par la **nature de l'adresse**, non par la famille, et corrige §5.5. La décision
d'exécution du lot est **ratifiée** et **étendue** à `/bibliotheque`, `/cartographie` et
`/carte-mentale`.

---

## É-3 — `RG-M16-01` « depuis une même origine » n'est pas tenable derrière le frontal · **tranché par `ARB-053`**

Vérifié : `grep -rn "ADDRESS_HEADER\|XFF\|X-Forwarded\|trusted_proxies" compose.yaml Dockerfile
frontal/Caddyfile .env.example` → **zéro occurrence**, et `frontal/Caddyfile:74` est un
`reverse_proxy app:3000` nu.

**Conséquence réelle : un attaquant bloque l'instance entière 90 secondes.** Une exigence tenue à la
lettre dont l'effet est l'inverse de son intention.

`ARB-053` pose `ADDRESS_HEADER=X-Forwarded-For` et `XFF_DEPTH=1`, et **la confiance n'est pas un
pari** : `compose.yaml:117` publie l'application sur `127.0.0.1` seulement, donc aucun client ne peut
forger l'en-tête. Deux cas doivent être éprouvés, dont celui qui rougit avant la correction.

---

## É-4, É-5, É-6, É-9 — quatre décisions de forme · **ratifiées par `ARB-054`**

| # | Objet | Sort |
|---|---|---|
| É-4 | barème `[0,0,1,2,4,8]` + blocage 90 s | **ratifié**. Seul le 90 est du gel (`V-05:777`) et il ne bouge pas. Non configurable : `V-33` rend les sept paramètres de M14.7 et aucun n'est un barème |
| É-5 | durée du cookie « se souvenir de moi » | **le lot avait tort de le croire indécidable**, et c'est le seul point où il s'est arrêté trop tôt. `V-25:1222-1223`, `:1236` et `:2917` promettent une persistance **sans terme** et fournissent trois affordances de révocation. Le gel spécifie l'inverse d'une durée |
| É-6 | les cinq formulaires du gel n'ont ni `method` ni `action` | **ratifié**, raisonnement 1 du dossier de regel : ces attributs ne peignent aucun pixel. Borne absolue : sans `method`, une soumission native part en GET **avec le mot de passe dans l'adresse** |
| É-9 | `/deconnexion` répond en GET | **ratifié** : le gel en fait un lien (`V-37:3370`). Seule action d'écriture en GET du produit, et elle l'est parce que sa pire conséquence est l'état de départ |

**Aucun des quatre ne va au dossier de regel**, qui reste vide. Deux se déduisaient d'une ligne du gel
que le lot n'avait pas ouverte — ce qui est le raisonnement 3 de `docs/dossier-regel.md` : *une source
manquante est souvent une source non lue*.

---

## É-7, É-10, É-11, É-12 — quatre non-revendications, et elles sont la valeur du lot

| # | Ce que le lot REFUSE de déclarer |
|---|---|
| É-7 | les issues `echec` et `trop` ne sont pas peintes : T-070 a mesuré que le rendu de V-05 **ne dépend que de `arrivee`**. La décision serveur est transmise (`401` / `429` + secondes), la peinture est `T-017` |
| É-10 | **`RG-ACC-04` n'est pas déclarée tenue.** Mesure fournie et bornée : écart des médianes **0,408 ms** contre un plancher de bruit de **−1,165 ms** sur couple témoin, 40 tirages entrelacés par série. L'écart est **dans** le bruit. Et la méthode **sait dire non** : 401 avec Argon2id contre 429 sans condensat donne **11,55 ms**, hors du bruit |
| É-11 | `event.locals.identite` est établie et **n'a aucun lecteur** : ce qui est éprouvé est la fabrique, pas le champ. `P-5`, déclaré sur son propre livrable |
| É-12 | **l'étanchéité n'est pas fermée** : `GET /cartographie` sans session rendait **200** au moment de la mesure. `ARB-052` la range désormais en redirection, et c'est ce lot-ci qui devra la poser |

Le §5 du contrat lui interdisait d'écrire la batterie 6 ; il a livré à la place **quatre
enseignements de méthode** pour celle qui l'écrira, dont deux qu'aucun document ne portait :

- **le compteur de tentatives pollue toute mesure de latence** — deux tirages successifs suffisent à
  faire entrer le ralentissement. La batterie devra neutraliser ou isoler l'origine, faute de quoi
  **elle mesurera son propre barème** ;
- **le couple témoin doit être entrelacé exactement comme le couple mesuré** — ici il a rendu
  −1,165 ms, *plus* que l'écart mesuré : un seuil absolu aurait conclu à tort ;
- **la sonde n'a pas besoin d'un délai artificiel** : le dépôt porte déjà deux chemins de coûts
  connus et opposés, 401 avec Argon2id contre 429 sans, soit 11,55 ms qui rougissent à coup sûr ;
- médiane et écart interquartile valent mieux que la moyenne — un tirage à 28,98 ms sur 40 déplace la
  moyenne, pas la médiane.

---

## É-8 — un piège nouveau, mesuré · **devient `P-23`**

Citer l'adresse du mode démo **dans un commentaire** d'une route bâtie a fait rougir
`verif:demo:hors-production` sur **trois fichiers produits**. Cause : le regroupeur conserve un
commentaire qui précède une instruction **retenue** ; les autres routes bâties y échappent seulement
parce que leur commentaire ne précède que des imports — **un `$props()` de plus et la trace revient**.

C'est l'écart É-2 de `T-070` qui se rejoue, et la parade est celle de `P-20` : *décrire une forme, ne
jamais la citer*. Corrigé par le lot, batterie verte. **Inscrit à `CLAUDE.md` §6 sous `P-23`.**

---

## É-13 — trois traces périmées, hors territoire du lot

Toutes trois vérifiées fichier ouvert :

| Où | Ce qui y est écrit, et pourquoi c'est faux |
|---|---|
| `.env.example:53-55` | « Engendrer en HEXADÉCIMAL : ce mot de passe entre dans une **URI de connexion (`URL_BASE`)** » — périmé par `ARB-038`, et `ARB-050` vient de retirer `URL_BASE` du code. **Le document conseille désormais une parade contre un piège qui n'existe plus, en nommant une variable qui n'existe plus** |
| `playwright.config.ts:14` | `baseURL: process.env.URL_BASE ?? 'http://localhost:4173'` — emploie `URL_BASE` comme **base HTTP**. Homonymie avec la variable de base de données qui vient d'être retirée : deux sens pour un nom, dont l'un vient d'être aboli |
| `package.json:20` | `test:etancheite` attribue encore la batterie 6 à **`T-011`**, qui l'a livrée sans, et dont ce n'est plus la charge |

**Corrigées par l'orchestrateur au rapatriement** : la première parce qu'elle induit l'exploitant en
erreur, la deuxième parce que l'homonymie est un piège en formation, la troisième parce qu'un jalon
doit nommer le lot qui le lèvera.

---

## É-14 — `pnpm add` a réordonné `package.json`

`zod` et `@types/pg` déplacés alphabétiquement, en plus de la ligne ajoutée. **`T-015` modifie le même
fichier** : le rapatriement se fait par fusion à la main, jamais par `cp`. Signalé avant, ce qui est
exactement l'utilité de le signaler.

---

## P-16 — le geste, et il a été posé

```
$ ls -ld node_modules      → node_modules -> /home/alex/Documents/Repo/codicillus/node_modules
$ rm node_modules && pnpm install --frozen-lockfile      → 1,127 s, node_modules local
$ pnpm add @node-rs/argon2@2.1.0                         → Packages: +2
$ Argon2id opérant : $argon2id$v=19$m=19456,t=2,p=1$…    16 ms
```

**Le lien a été remplacé avant l'installation : l'arbre de `T-015` n'a pas été écrit.** C'est la
première fois que le piège était exercé — `verif/preparer-copie.sh:23` se justifiait par *« le lien
est sûr ici parce qu'aucun lot n'installe de dépendance »*, et cette hypothèse a cessé d'être vraie
aujourd'hui.

Les paramètres Argon2id sont **ceux de la bibliothèque**, relevés à l'exécution (`m=19456, t=2, p=1`) :
aucune source du dépôt n'en fixe, et les inventer aurait été une décision fonctionnelle.

## P-22 — ce que le lot laisse derrière lui

**Aucun conteneur créé** ; les deux du jour employés tels quels. **Aucun serveur orphelin** : les deux
processus du lot arrêtés nominativement. Base rendue propre — 5 comptes, **0 condensat**, 0 session,
0 tentative, `duree_session = 120`.
