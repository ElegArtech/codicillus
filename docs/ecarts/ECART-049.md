# ÉCART-049 — Lot T-080, la suppression d'une note — 21 août 2026

**Six écarts déclarés. Cinq ne sont pas comblés ; un l'est, parce que la maquette l'ordonnait et que
le contrat ne l'avait pas vu — É-5. Le lot est livré vert sur ses deux critères de sortie
(`pnpm check`, `pnpm test:unit`).**

Gravité d'ensemble : **moyenne**. Aucun des six ne fait servir de contenu qui ne devrait pas l'être ;
deux touchent la complétude de la destruction, deux l'exactitude d'un chiffre annoncé, un constate
qu'aucun écran n'atteint l'action livrée, un est une divergence entre le cahier et le gel.

---

## É-1 — **Les octets des pièces jointes survivent à la cascade**

**Gravité : moyenne.** `RG-M14-03` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1147`) dit
« atomique et définitive : soit tout est supprimé, soit rien. Il n'y a pas de corbeille ».

La cascade emporte les **lignes** de `pieces_jointes` — `src/lib/base/schema.ts:572`,
`onDelete: 'cascade'`, confirmé par `base/migrations/002_socle.montee.sql:438`,
`REFERENCES notes (id) ON DELETE CASCADE`. Elle ne peut pas emporter les **octets** : ils vivent
hors de la base, dans l'entrepôt, et leur chemin est *dérivé* de l'identifiant en base de la note et
de celui de la pièce (`src/lib/fichiers/entrepot.ts` ; `src/lib/donnees/edition.ts`, en-tête de
`PieceJointeResolue` : « `src/lib/fichiers/entrepot.ts` ne stocke aucun chemin : il le DÉRIVE »).

Ce qui reste après la destruction est donc **inatteignable** — aucun chemin n'est formable sans une
ligne résolue, et la résolution passe par `noteLisible()` — mais **présent sur le disque**.
« Définitive » se lit alors du point de vue de l'utilisateur, pas de celui de l'exploitant.

**Pourquoi ce n'est pas comblé ici, et ce n'est pas une commodité :**

1. **Le contrat de `T-080` ferme le périmètre** — trois fichiers, dont ni `pieces.ts` ni
   `entrepot.ts`. `retirerUnePieceJointe()` (`src/lib/donnees/pieces.ts:226`) existe et fait
   exactement le geste manquant, ligne puis octets ; l'appeler en boucle avant la transaction
   demanderait de lire les pièces, donc d'ouvrir un quatrième fichier.
2. **Le geste n'est pas transactionnalisable avec la base.** Effacer les octets *avant* la
   transaction expose à une transaction annulée qui laisserait des lignes sans octets ; les effacer
   *après* expose à un arrêt entre les deux. Aucune source ne tranche cet ordre. Le trancher serait
   combler.
3. **Le défaut n'est pas nouveau et n'est pas propre à cette route.** `supprimerUnDomaine()`
   (`src/lib/donnees/administration.ts:827`) supprime les notes d'un domaine par le même mécanisme
   et porte le même trou.

**Mesure du risque aujourd'hui : nul en pratique.** `pieces_jointes` compte **zéro ligne**
(relevé cité par `src/lib/donnees/edition.ts`, en-tête : « 7 notes sur 32 en déclarent, 13 pièces
déclarées, … 0 portées en base »). Aucun octet n'est donc orphelinable par ce chemin dans l'état du
dépôt — ce qui est précisément la raison pour laquelle il faut le **déclarer** plutôt que de compter
sur une batterie pour le trouver (`P-5`).

---

## É-2 — **Une note dont le corps n'est pas analysable ne peut pas être détruite**

**Gravité : faible aujourd'hui, structurelle.**

Le contrat impose — à raison, `P-01` sur la décision d'accès — d'appeler
`resoudreLEditionDUneNote()` plutôt que de recopier la règle de droit. Or cette fonction ne fait pas
que décider : elle **analyse le corps** du registre résolu (`src/lib/donnees/edition.ts`,
`analyserDocument(colonne)`), et `analyserDocument` **lève** sur un document mal formé (`ADR-003` :
aucune écriture directe d'un document non validé, et aucune réparation).

Conséquence : `supprimerUneNote()` lève sur une note dont le corps est illisible — **c'est-à-dire
sur la note qu'on voudrait le plus détruire.** La destruction dépend d'une propriété du contenu qui
n'a rien à voir avec le droit de détruire.

**Non comblé** : séparer la décision d'accès de l'analyse du corps demanderait de toucher
`edition.ts`, que le contrat interdit d'ouvrir (deux lots y travaillent en parallèle). La réparation
propre est une résolution d'accès *sans* corps, à ouvrir comme lot.

**Aucun cas ne l'exerce aujourd'hui** : les 32 corps du corpus s'analysent. C'est `P-5` — la règle
est connue, pas éprouvée.

---

## É-3 — **Le nombre de rétroliens annoncé est celui que l'appelant peut voir, pas le total**

**Gravité : faible. Lecture déduite, déclarée, et non arbitrée.**

`RG-M04-10` (`CDC:635`) fait annoncer « le nombre de rétroliens qui deviendront cassés ». Le total
vrai et le nombre affichable divergent : les rétroliens d'une lecture résolue sont déduits des seuls
corps que le **périmètre** de l'appelant rapporte (`src/lib/donnees/note.ts`,
`conditionDePerimetre()` posé dans le `where`, `ADR-006`).

Annoncer le total révélerait l'existence de notes rangées dans des dossiers interdits — ce que
`RG-ACC-01` refuse en propres termes (« le filtrage est appliqué au plus près de la donnée, pas
seulement dans l'affichage »). **Le chiffre livré est donc le nombre de rétroliens VISIBLES.**

Ce n'est pas un comblement : entre deux lectures, celle qui fuit et celle qui ne fuit pas, l'ordre
de préséance tranche — le cahier interdit la première. Mais la conséquence mérite d'être connue du
commanditaire : **un rédacteur peut détruire une note en croyant casser deux rétroliens alors qu'il
en casse cinq.** Si l'intention de `RG-M04-10` était le total, il faudra un arbitrage : un compte
non filtré, sans titres ni adresses, serait une troisième voie — elle fuit moins, elle fuit encore.

---

## É-4 — **Aucun écran n'atteint l'action livrée**

**Gravité : moyenne. C'est l'écart É-2 de `T-070` et l'écart de `T-024` qui se rejouent.**

`POST /notes/{identifiant}?/supprimer` existe et fonctionne. **Rien ne la vise.** `src/vues/V-14.svelte`
rend le bouton de suppression sous `{#if ecriture}` — l'écran est juste au regard de `P-09` et de
`RG-M05-08` —, mais le gel de V-14 ne porte **aucun** élément `form` (`ARB-054` §3 recense les
formulaires du gel, V-14 n'en a pas), et le bouton n'est donc dans aucun formulaire.

`ARB-063` §2 a tranché où va ce câblage : dans `src/routes/**/+page.svelte`, jamais dans
`src/vues/`. Le contrat de `T-080` n'ouvre pas `src/routes/notes/[identifiant]/+page.svelte` — il
énumère trois fichiers et écrit « n'ouvre AUCUN autre fichier ». Le câblage est donc **le lot
suivant**, et il est deux gestes : l'enveloppe de formulaire d'`ARB-063` §3, et le dialogue de
confirmation de `RG-M04-10` (V-40), qui a besoin de `resumeDeSuppression()` — lue par personne à ce
jour.

**Ce que cela veut dire pour la couverture** : `resumeDeSuppression()` est éprouvée en unitaire
(`src/lib/donnees/suppression.test.ts`, six cas, les deux polarités), et **aucun appelant du produit
ne l'appelle**. C'est `P-5` par anticipation : la fonction est posée, son usage est espéré.

---

## É-5 — **Le gel annonce QUATRE valeurs, `RG-M04-10` en nomme trois. Le contrat a suivi la règle**

**Gravité : moyenne. C'est le seul point de ce dossier qui a changé le code, et il l'a changé parce
que l'ordre de préséance ne laissait pas le choix.**

`RG-M04-10` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:635`) : « une boîte de dialogue rappelant le
titre, le nombre de rétroliens qui deviendront cassés, et le nombre de versions perdues ». Le contrat
`T-080` §3 reprend cette liste mot pour mot pour définir `resumeDeSuppression()`.

**Le gel en porte une de plus.** `mockups/V-40-dialogues.html`, `prepNote()`, construit la liste
« Ce qui disparaît avec elle » à partir de **trois** couples :

```
:3295   versions    « versions de son historique »   /   « version de son historique »
:3296   retroliens  « notes qui pointent vers elle » /   « note qui pointe vers elle »
:3297   n.pj        « pièces jointes »               /   « pièce jointe »
```

La troisième puce — **les pièces jointes** — n'a aucun équivalent dans `RG-M04-10`, ni dans le
contrat.

**Ce qui a été fait, et pourquoi ce n'est pas un comblement.** *Maquettes > Cahier des charges*, sans
exception. Le champ `piecesJointesPerdues` est porté par `ResumeDeSuppression`, alimenté par
`lecture.note.pj` — le **compte réel de la table**
(`lirePiecesJointesParNote()`, `src/lib/donnees/lecture.ts:493`), jamais un chiffre fabriqué (`P-02`).
Il n'y a aucun vide à combler ici : la maquette est explicite, et une transcription n'est pas une
décision. Ce qui aurait été une faute, c'est de la taire.

**Ce que le commanditaire doit savoir** : ou bien `RG-M04-10` est incomplète et mérite une entrée
d'errata, ou bien la troisième puce du gel est de trop et le regel s'impose. **Aucun lot ne peut
trancher cela** — c'est le guichet de `docs/dossier-regel.md`.

**Et le gel dit encore une chose que rien ne porte** : `:3290` compose le rappel du titre en
`« titre » — domaine › dossier.` La localisation n'est pas dans le résumé, et c'est délibéré — la
composition d'une chaîne d'affichage est un fait d'écran, et `lecture.note.domaine` et
`lecture.note.dossier` sont déjà à la disposition de la vue qui la peindra.

---

## É-6 — **Le gel compte les rétroliens sur les RELATIONS, le produit les déduit des corps**

**Gravité : faible. Observation, pas divergence de code.**

`mockups/V-40-dialogues.html:3291` calcule le décompte annoncé ainsi :

```js
var retroliens = window.RELATIONS.filter(function (r) { return r.vers === n.id; }).length;
```

C'est-à-dire sur les **relations qualifiées du graphe** (M08). Or `RG-M05-02` définit le rétrolien
autrement : « recalculés par parcours de l'arbre du document ». Ce sont **deux notions distinctes du
vocabulaire contractuel** — `Relation` et le lien interne d'un corps —, et le gel emploie la première
pour peindre un chiffre que la règle définit par la seconde.

**Le produit suit `RG-M05-02`** : `retroliensVers()` (`src/lib/donnees/note.ts`) est l'implémentation
unique, et le résumé compte ce qu'elle rend. La divergence est jugée **artefact de données de
démonstration** — la maquette n'a pas de corpus de liens de document à parcourir, et sa fixture de
relations est ce qu'elle avait sous la main. Le rendu, lui, est identique : un entier et un libellé.

**Elle est déclarée parce qu'elle ne se voit pas.** Sur le corpus réel, les deux comptes peuvent
différer, et personne ne saura lequel le dialogue était censé annoncer. Si l'intention était les
relations, `RG-M04-10` emploie le mauvais mot du §2.3, et c'est un errata.
