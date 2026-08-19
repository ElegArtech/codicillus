# ÉCART-023 — Révélations modales et portée de la preuve — 19 août 2026

Le dernier verrou avant l'éventail. Seize états modaux déclarés, la preuve par le gel étendue aux
ressources partagées, et **trois défauts trouvés en le prouvant** — dont un dans un arbitrage que
j'avais écrit sur un seul cas.

## É-1 — Seize états sur neuf vues, non quinze sur huit. **Cinquième occurrence.**

Le relevé annonçait quinze états modaux sur huit vues. Exact **et incomplet** : **V-35
`rapport-de-lot`** manquait.

**La cause est instructive** : c'est un état **à déclencheur** — il faut cliquer pour l'atteindre —
et un relevé qui ne joue pas le geste ne le voit pas. **L'instrument de T-100 énonce cette limite
dans son propre bandeau.** Elle était écrite ; c'est la liste qui l'a perdue en chemin.

Un instrument qui déclare ses angles morts ne protège que le lecteur qui les lit. `pnpm verif:modaux`
ferme la boucle : il relève en jouant les déclencheurs, **confronte à la déclaration**, et sort en 1
sur divergence.

## É-2 — ARB-017 était écrit sur un seul cas. **Défaut d'arbitrage, le mien.**

J'avais posé que le banc reproduit la modalité « pointeur » du dialogue. Vrai pour V-40, dont la
référence tient sa modalité d'un **vrai clic du banc**. Faux pour les **quinze autres**, qui
s'ouvrent sur un `change` synthétique : aucun pointeur ne les touche, leur référence **affiche donc
l'anneau de focalisation**.

Livrer l'appui au seul candidat le lui retirait : **308 pixels** sur `V-27 sup-systeme` et `sup-ok`
— exactement le chiffre relevé sur V-40, **dans l'autre sens**.

Corrigé : la modalité de la référence est **déduite** de la présence d'un déclencheur. La
formulation juste du principe est **« on reproduit la modalité de la référence, on n'en impose pas
une »** — et elle n'était pas la mienne. J'avais généralisé un cas particulier en règle.

**Réserve honnête** : la correction est mesurée sur un **candidat fabriqué démuni**, pas sur une
implémentation. À revérifier au premier lot de vue réel.

## É-3 — Une postcondition vacuement vraie. **Rencontrée, pas supposée.**

Le contrôle de `reveler()` cherchait un `dialog[open]` non modal parmi les « récalcitrants ». **Si
la révélation referme ce qu'elle devait promouvoir, il n'en trouve plus — et se tait.** Le banc
rendait alors « échec de structure » : le bon verdict, pour la mauvaise raison.

Découvert en le provoquant : l'appui au repos (0, 0) tombe sur le `dialog`, dont l'`inset: 0`
couvre la fenêtre, et y déclenche le renvoi au clic du voile. Le compte d'ouverts est désormais
relevé après révélation et comparé.

## É-4 — L'effet annoncé d'ARB-022 n'est pas atteint par la seule extension de portée

`flex` et `width` n'appartiennent pas aux propriétés contraintes par P-1 : étendre la portée ne les
révèle pas. Elles sont désormais **imprimées** à chaque exécution comme « divergences avec le gel
hors du vocabulaire de P-1 — signalées, non bloquantes ».

Le choix de ne pas les rendre bloquantes est motivé, et le motif est bon : **un rouge incorrigible
chez un exécutant qui n'a pas le droit d'y toucher est le meilleur moyen de faire désactiver un
contrôle.** Les passer en constat est la marche d'après, et elle se décide.

## É-5 — Il manque une source d'étalonnage « candidat démuni »

`etalon` et `composant` **possèdent tous deux les scripts du gel** : aucune ne peut éprouver une
contrainte qui ne mord que sans JavaScript. C'est la quatrième fois que ce trou se manifeste
(`ECART-013` É-1, `ECART-014`, `ECART-015` É-5, ici).

L'exécutant l'a contourné par une **mutation temporaire** — un brouillon jetable, refait à chaque
fois. Un régime permanent vaudrait mieux. À outiller avant la vague qui portera les neuf vues
modales.

## É-6 — Les instruments du relevé n'étaient pas suivis par git

`verif/releve-vues.mjs` et `verif/releve-etats.mjs` étaient non suivis : **toute copie de travail
fraîche en était privée, et toute commande qui les cite était irreproductible.** Corrigé au commit
précédent. `releve-modaux.mjs` ne dépend, lui, que de fichiers suivis — l'exécutant en a tiré la
leçon sans qu'on la lui donne.

## Ce que l'étalonnage prouve, et ce qu'il ne prouve pas

Les neuf vues modales sortent à **zéro pixel sur 59 couples** en `--source=composant`. Mais cette
source rejoue le gel **avec ses scripts** : elle entre en modalité toute seule, et le banc
l'imprime lui-même — *« déjà vraie sur N, établie sur 0 »*.

**L'étalonnage prouve que la déclaration ne casse rien. Il ne prouve pas qu'elle serve.** Ce
qu'elle établit ne se verra qu'au premier candidat démuni de JavaScript — c'est-à-dire au premier
lot qui implémentera l'une des neuf vues.

**La déclaration mord**, en revanche, et c'est prouvé : V-27 retirée de la déclaration → deux états
en échec, « dimensions divergentes, 1440×900 contre 1440×1800 ». Ne rien déclarer n'ouvre rien.
