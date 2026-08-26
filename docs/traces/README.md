# Les traces

**Une trace n'est pas une batterie.** Elle ne rend aucun verdict opposable, elle ne s'ajoute pas à
`pnpm verify`, et son vert ne prouve rien de plus que ce qu'elle a fait. Elle **raconte**, avec ses
codes HTTP, ce qu'un utilisateur a pu faire dans un navigateur.

Elle existe parce que, le 21 août 2026, **vingt batteries mesuraient le produit et aucune ne
demandait : peut-on créer une note ?** Le `501` était déclaré depuis des jours dans le fichier qui le
portait, et il a fallu que le commanditaire pose la question pour qu'il remonte.

> *Une batterie mesure ce qu'on lui a demandé de mesurer. Le produit se juge à ce qu'un utilisateur
> peut en faire.*

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

### `passage-a-froid.mjs` — ce qui s'affiche

Il détruit sa base, la recrée, applique les migrations, **n'en sème aucune donnée**, crée le premier
administrateur, puis **crée à la main le strict nécessaire par les écrans de la console** — un
univers, un domaine, deux notes, un signet, tous nommés hors du jeu. Il ouvre ensuite les
**trente-neuf routes** dans Chromium, en session et en anonyme, et lit **le HTML servi** autant que
le rendu hydraté. C'est exactement le geste que `schema.ts:444` et `identite.ts:12` racontent avoir
fait à la main le 21/08/2026 ; automatisé, il aurait attrapé le seul défaut vraiment *servi* du
balayage — ouvrir n'importe quelle note en modification affichait le corps de la note de
démonstration, **permanent sans JavaScript**.

Il **pose son décor et il le dit** : `droits_de_dossier` ne porte aucune ligne sur une instance
neuve, et `RG-DRO-02` rend alors le produit en lecture seule pour tout le monde. Sans un droit
`gestionnaire` posé en base, aucune note ne peut naître.

Il mesure **le produit construit**, jamais `vite dev` : le serveur de développement sert les sources,
commentaires compris, et l'un d'eux cite légitimement une adresse du jeu.

### `aiguilles-dans-le-paquet.mjs` — ce qui se livre

Il lit chaque octet de `build/client/`. Une branche morte ne s'affiche nulle part et part quand même
chez le lecteur : les 57 Ko de `/bibliotheque` qui importaient le corpus **en valeur**, les 30 Ko du
corps de démonstration sur le chunk de `/notes/{id}`, l'arborescence entière du gel dans tout chunk
montant une coquille. **Aucun test de rendu ne verra jamais rien de tout cela.**

### Les aiguilles — `aiguilles-du-corpus.mjs`

La liste **n'est pas recopiée : elle est produite par sa source.** Les noms du corpus sont lus dans
`seeds/corpus.ts` par `ssrLoadModule`, comme `base/base.mjs` lit ses commandes — ajouter une note au
jeu ajoute son identifiant et son titre aux aiguilles sans que personne y pense, et la forme de la
source est vérifiée plutôt que supposée. S'y ajoutent les noms que le corpus ne porte pas et que les
relevés du 26/08 ont nommés un par un dans les vues, chacun citant son relevé.

Trois choses s'y lisent, et elles ne sont pas la même :

- **les écartés** — des noms du jeu qui sont *aussi* du vocabulaire du produit (« Comptes » est la
  section de la console autant que le dossier `Déploiement › Comptes`). Ce ne sont pas des
  aiguilles : il n'y a rien à voir. Un chemin de dossier d'un seul mot en est un.
- **les exemptions** — des fuites reconnues, qui ne valent **que pour le paquet** et **jamais pour le
  HTML servi**. Chacune nomme un site, son lot et ce qui la retirerait.
- **et elles expirent seules** : une exemption qui ne trouve plus rien **fait échouer le contrôle**,
  avec l'ordre de la retirer. C'est ce qui interdit qu'une table d'exemptions survive aux fuites
  qu'elle couvrait.
