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
