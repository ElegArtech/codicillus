# ÉCART-038 — `P-01` contre le gel sur V-14, et le sens de dérivation des seuils — 19 août 2026

**Gravité : moyenne. Un point d'arbitrage, deux décisions d'exécution déclarées.**

Lot **T-013c** — réparation des violations de `P-01` relevées par la batterie 5. Cinq des six
constats sont réparés à pixel constant ; le sixième ne l'est pas, et ne peut pas l'être par un lot.

## É-1 — Le gel de V-14 écrit un libellé que la fabrique unique ne produit pas

**Le fait, recompté sur les 41 maquettes.** Le gel ne connaît **qu'une seule** fonction de libellé,
`window.libelleFraicheur`. Et il porte **exactement deux** `.temoin__txt` écrits en dur dans le
balisage statique — tous deux au panneau « Position » de `V-14-lecture-note.html`, lignes 1817 et
1822 :

| Note | corpus | ce que `libelleFraicheur` donne | ce que le gel écrit |
|---|---|---|---|
| `n-planifier-sauv` | frais, 6 j | « Vérifié il y a 6 jours » | **« il y a 6 j »** |
| `n-purge-sauv` | vieil, 126 j | « Vérifié il y a 4 mois » | **« il y a 4 mois »** |

Cette forme **compacte** n'apparaît nulle part ailleurs dans le gel, n'est produite par aucune
fonction, et n'est pas spécifiée par un document. Les autres témoins de V-14 — dont celui de la note
lue — passent bien par la fabrique ; la divergence est confinée à un panneau latéral.

**C'est le même genre de défaut que V-06 (ARB-024), V-08 (ECART-033) et V-20 (ARB-025) : une
maquette qui se contredit elle-même.** Le gel écrit ici à la main ce qu'il fabrique ailleurs — la
note en tête de `src/lib/fraicheur.ts` relevait déjà que V-01 et V-09 écrivent leur témoin au
balisage plutôt que par la fabrique ; V-14 va plus loin, puisque le **texte** diverge, pas seulement
le support.

**Non comblé, et non touché.** Appeler la fabrique ferait rougir **les 44 couples de la vue centrale
du produit**. Trois issues existent, aucune du ressort d'un lot :

1. **regel de V-14** sur la forme longue — la voie cohérente avec `P-01` ;
2. **ajout d'une forme compacte à la fabrique unique** — elle sortirait alors du même calcul, mais
   *aucune source ne la spécifie* : c'est un comblement, et il faudrait dire quand chaque forme
   s'emploie ;
3. **exemption arbitrée et tracée** — le libellé reste local, `P-01` porte une exception nommée.

`pnpm verif:fraicheur` sort donc en **1**, avec **un** constat. La batterie n'est pas assouplie pour
l'absorber : ce serait reproduire la faute que le lot existe pour réparer.

## É-2 — Le sens de dérivation des seuils est une décision d'exécution, pas une lecture

`SEUILS_PAR_DEFAUT` (`src/lib/fraicheur.ts`) et `CONFIG.seuil*` (`seeds/corpus.ts`) transcrivent tous
deux `window.CONFIG` du gel — 90 / 180, treize maquettes concordantes. **Aucun document ne dit lequel
dérive de l'autre.** C'est l'instrument qui a tranché : la batterie 5 n'exempte de `A3` que
`src/lib/fraicheur.ts`, donc le littéral ne peut vivre que là.

Le sens écrit est : `SEUILS_PAR_DEFAUT` (implémentation unique) → `CONFIG.seuil*` (configuration de
l'instance de démonstration) → `SEUILS_DE_PLANCHE.actuel` de V-33 (position « en vigueur », que le
gel étiquette lui-même « 90 / 180 · en vigueur »). Il est justifié par ADR-005 — « les seuils sont
des paramètres de cette implémentation » — mais **c'est l'instrument qui l'a imposé, pas une
source**.

**Conséquence à valider.** `seeds/corpus.ts` importe désormais de `src/lib/`, alors que son en-tête
déclarait que « les fonctions de calcul relèvent du code applicatif, pas du jeu de semence ». Il ne
s'agit que d'une constante — et l'en-tête le dit maintenant —, mais **la dépendance est nouvelle**.
Aucun cycle n'en naît : `fraicheur.ts` ne prend du corpus qu'un `import type`, effacé à la
compilation.

## É-3 — Les trois anciennetés de V-03 sont déduites, non lues

Le gel de V-03 ne porte ni `jours` ni note de corpus : le guide de lecture publique est une page
écrite. Les trois anciennetés — 11 / 155 / 280 jours — ont été **déduites** des trois
`<time datetime>` du cartouche contre `DATE_REFERENCE`.

La déduction est **prouvée juste** : les trois libellés sortent à la lettre de `libelleFraicheur`, et
les 16 couples de la vue restent conformes. Mais **c'est une lecture du gel qu'aucun document
n'énonce**. Elle a une conséquence voulue, et qui n'existait pas avant : si `DATE_REFERENCE`
bougeait, V-03 suivrait.

## Ce qui est réparé, et prouvé à pixel constant

`V-03` (3 constats), `V-11` (2), `V-13` (2), `seeds/corpus.test.ts` (1), `seeds/corpus.ts` +
`V-33` (3) — **13 constats sur 14**.

Ligne de base relevée **avant** toute écriture : 78 couples, 0 écart. Après : `V-03` 16/16 · `V-11`
8/8 · `V-13` 6/6 · `V-14` 44/44 · `V-33` 4/4 — **0 écart**. Puis les 41 vues : 409 couples, 408
conformes, le seul écart restant étant `V-06 · cpt-inconnu` (ARB-024), ni plus ni moins qu'avant.
`pnpm check` 0 · `verif:jetons` 0 · `verif:inventaire` 0 · `verif:gel` 0 · `test:unit` 248.
