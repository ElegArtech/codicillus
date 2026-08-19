# ÉCART-028 — Quatre lots, onze vues, et cinq défauts d'instrument — 19 août 2026

**Vingt-trois vues sur quarante et une sont conformes. Zéro écart. Aucun recours au niveau 3.**

Les quatre lots de la vague ont livré ensemble V-41 et les dix vues de console. Trois d'entre eux
ont buté sur **la même cause**, diagnostiquée indépendamment, et **aucun n'a emprunté le
contournement qu'il avait pourtant identifié**.

## É-1 — Le niveau 1 était **insatisfiable** par un squelette sans script. Défaut d'instrument.

`ordreDeTabulation()` construisait le nom accessible d'un contrôle de formulaire sur son
`textContent`. Or :

- la maquette pose la valeur d'un `<textarea>` **par propriété** — son `textContent` reste vide ;
- une application statique n'a que le **contenu** du nœud pour porter cette valeur ;
- et l'instantané ARIA du même niveau 1 **exige** cette valeur.

**Les deux relevés du même niveau se contredisaient** : valeur ⇒ `textContent` non vide. Cinq vues
étaient touchées — V-27 à V-31, état `form-edition`.

L'asymétrie était dans l'instrument, pas dans les vues : un `<input value="…">` ne posait pas la
question, son contenu étant vide.

**Ce que deux exécutants ont refusé de faire** : poser `aria-label=""` sur le `<textarea>`. Vérifié
par sonde, ça rendait vert — `getAttribute` retourne `""`, que le relevé retenait, tandis que le nom
accessible réel l'ignore. *« Il ne change rien pour personne sauf pour le relevé. »* Ils l'ont nommé
pour que l'arbitrage l'ait sous les yeux, pas pour l'employer.

Corrigé : un contrôle de formulaire ne se nomme jamais par son contenu.

## É-2 — Un masque ne valait qu'à moitié

`verif/masques.json` déclare le mot de passe temporaire de V-32 — tiré par `Math.random()`,
qu'aucune implémentation ne peut reproduire. Le masque était passé à la capture d'écran : il ne
couvrait donc **que le niveau 2**. Le niveau 1 compare les instantanés ARIA caractère par caractère,
et la valeur y figurait.

**Un masque qui ne vaut qu'à moitié est pire qu'un masque absent** : il donne l'illusion que la zone
est neutralisée, et le lot cherche la cause ailleurs.

Corrigé : le texte des zones masquées est remplacé par un jeton constant, identique des deux côtés —
jamais retiré, sans quoi la présence du nœud cesserait d'être comparée. Et `#f-mdp`, que le relevé
avait manqué, est déclaré.

## É-3 — La révélation redémarrait l'animation. **Et elle explique le seul recours du projet.**

`ARB-017` ouvre le dialogue par `close()` puis `showModal()` — ce qui **redémarre l'animation
nommée**. Même à durée nulle, ce redémarrage change la rastérisation des coins arrondis d'une boîte
translatée d'un offset fractionnaire, et l'écart transparaît à travers le voile.

P-4 l'a mesuré **sur la maquette gelée seule, sans aucune implémentation** : le même document,
ouvert par les deux chemins, diverge de **77 pixels dont 2 au-delà du seuil**. Puis il a isolé la
cause par neutralisation successive — animation : **0 pixel**, voile : 8, ombre : 18.

**Et il a osé une hypothèse qu'il a lui-même qualifiée de « faisceau, pas preuve »** : que les
18 pixels du recours accordé sur V-40 `d-droits` aient la même cause.

**C'était une preuve.** Après neutralisation de l'animation de dialogue des deux côtés, **V-40 passe
à 10/10 et le recours disparaît**.

> **Le premier et unique recours au niveau 3 du projet est annulé.** Il avait été instruit avec
> rigueur, jugé par un tiers, assorti de bornes de précédent — et sa cause était un défaut
> d'instrument que personne n'avait su nommer à ce moment-là.
>
> Ce n'est pas un reproche au vérificateur : il avait mesuré que l'implémentation n'y était pour
> rien, et c'était vrai. C'est la démonstration que **« irréductible » veut dire « irréductible avec
> ce que l'on sait aujourd'hui »**, et que le niveau 3 doit rester rare, compté, et rouvrable.

## É-4 — Une cinquième forme de style manquait à l'ensemble clos

Le gel de V-41 pose ses styles par `b.setAttribute(k, attrs[k])` — **nom d'attribut variable**, dans
une boucle. La valeur était donc au gel, mot pour mot, et échappait pourtant aux quatre formes que
l'analyseur savait lire.

`ARB-016` dit : *« la valeur doit figurer dans la maquette gelée »*. Les formes ne sont que la
**manière** de l'y trouver — et une manière incomplète refusait une valeur que l'arbitrage admet.

Corrigé par un balayage des chaînes littérales qui se lisent comme une liste de déclarations. **La
borne reste entière**, et c'est prouvé par mutation : un style absent du gel rougit toujours.

## É-5 — Le ré-étalonnage dû, signalé par les quatre lots

Ma correction du filtre d'adresses avait changé la signature de 316 couples sur 409. **Les quatre
lots l'ont diagnostiqué**, tous ont refusé de ré-étalonner eux-mêmes, tous ont produit la même
preuve : `tabulation`, `focalisables` et `dimensions` intacts, `aria` seul modifié. Ré-étalonné par
l'orchestrateur.

## Et un défaut de ma main, encore

En retirant la troisième implémentation de la fraîcheur, j'ai cassé **quatre vues** qui
l'importaient — sans vérifier avant. Repointées sur la fabrique unique ; P-01 est désormais tenu au
sens strict : **une seule définition dans tout le dépôt**.

## Ce qui reste ouvert

- **`CoquilleDeConsole.svelte`** : P-4 l'a écrit, P-3 s'est abstenu au motif que le relevé
  l'attribue à P-2. Les deux ont raison ; à consolider.
- **Le décompte des indicateurs littéraux de V-41** — « 1 240 », « 59 % », « 32 » — sont des
  spécimens de composant, pas des indicateurs. Tension avec P-02 signalée, non tranchée.
