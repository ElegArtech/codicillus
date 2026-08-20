# ÉCART-048 — Lot T-079, la création d'une note côté serveur — 21 août 2026

**Six écarts remontés. Aucun n'est comblé. Le lot est livré VERT sur son critère de sortie, et le
vert ne couvre pas ce que les écarts nomment.**

```
pnpm check       → rc 0   (svelte-check 1081 fichiers, 0 erreur · eslint 0 · prettier 0)
pnpm test:unit   → rc 0   (72 fichiers, 1965 cas, 0 échec — dont 35 nouveaux)
```

Gravité d'ensemble : **moyenne**. Cinq écarts sur six sont des vides de spécification déclarés et
non comblés ; le sixième — **É-4** — est une **déviation assumée du contrat de tâche**, prise au nom
de l'ordre de préséance, et c'est celui qui demande un arbitrage explicite.

---

## É-1 — Le type de fiche et les propriétés typées ne sont pas pris. **Contrat, §3.**

Le contrat de soumission de `T-079` §3 est fermé sur huit champs, et il le dit : *« `typeFiche` et
les propriétés typées ne sont **pas** de ce lot : tu le déclares en écart chiffré, tu ne les combles
pas. »* Chiffré, donc :

| Ce qui existe | Ce qui est pris | Ce qui reste |
|---|---|---|
| `notes.type_de_fiche_id` (FK `types_de_fiche`, `RESTRICT`) | rien | jamais renseigné |
| `notes.proprietes_typees` (`jsonb`) | rien | jamais renseigné |
| contrainte `notes_proprietes_exigent_un_type_de_fiche` | honorée par le vide | — |
| `#m-fiche` du gel — `V-17:1657-1659`, un `<select>` rempli par script | **soumis par personne** | inerte |
| `types_de_fiche` en base | **3 types** — `Serveur`, `Application`, `Contact` (`seeds/corpus.ts:84`) —, lus par le chargeur et passés à la vue | affichés, jamais écrits |

**Une note créée par ce produit est donc une note SIMPLE, jamais une fiche** — au sens du §3 du
vocabulaire contractuel : *« Fiche — une note à laquelle un type structuré a été attribué »*.
Conséquence directe sur `M08` : une fiche ne peut aujourd'hui entrer dans le corpus que par le jeu de
semence ou par l'import.

Ce qui manque pour le combler n'est pas du code : c'est le **contrat de soumission des propriétés
typées** — comment un `jsonb` de propriétés arrive d'un formulaire, comment une propriété obligatoire
manquante se refuse, et ce que `V-17` affiche de ce refus. Aucune source ne le dit.

---

## É-2 — `ARB-062` §2.2 : les deux moitiés de la règle de troncature se contredisent sur un cas

`ARB-062` §2.2 exige deux choses à la fois : *« tronqué à **48 caractères** »* et *« **sur une
frontière de tiret** (jamais au milieu d'un mot) »*.

**Un slug dont le PREMIER mot dépasse déjà 48 caractères n'offre aucune frontière avant la borne.**
Les deux exigences ne peuvent alors pas être tenues ensemble : ou l'on coupe au milieu d'un mot, ou
l'on dépasse la borne.

**Ce qui est implémenté, et pourquoi ce n'est pas un comblement.** La borne l'emporte ; la troncature
rend la chaîne vide ; la règle §2.3 — *« un titre dont le slug est vide donne le corps `note` »* —
prend alors le relais. **Aucune troisième règle n'est écrite : les deux règles d'`ARB-062` se
composent.** Un titre d'un seul mot de 49 caractères rend donc `n-note`, puis `n-note-2`, `n-note-3`
par la levée de collision ordinaire.

Cas d'épreuve : `src/lib/rangement/identifiants.test.ts`, « rend le corps par défaut quand aucune
frontière ne précède la borne ».

**Ce qu'un arbitrage pourrait préférer** : couper à 48 au milieu du mot, ou porter la borne au premier
tiret suivant. Les deux sont défendables ; aucune n'est écrite dans `ARB-062`.

---

## É-3 — Deux domaines homonymes ne sont pas distinguables par ce formulaire

**Relevé sur pièce, `mockups/V-17-editeur.html:2788-2793` :**

```js
window.DOMAINES.forEach(function (d) {
  var o = document.createElement("option");
  o.value = d.nom; o.textContent = d.univers + " › " + d.nom;
```

**L'univers est AFFICHÉ ; il n'est pas SOUMIS.** La valeur portée par `#m-domaine` est le nom seul, et
le contrat de soumission de `T-079` §3 reconduit ce relevé — *« `domaine` : le **nom** d'un
domaine »*.

Or `RG-STR-02` n'impose l'unicité d'un domaine **qu'au sein de son univers**, et le schéma la porte
sur le couple : `unique('domaines_identifiant_par_univers_unique').on(t.universId, t.identifiant)`
(`src/lib/base/schema.ts:213`). **Et `domaines.nom` ne porte AUCUNE contrainte d'unicité**, pas même
par univers : le schéma n'interdit donc rien de ce que cet écart décrit.
`src/lib/rangement/adresses.test.ts` porte d'ailleurs le cas — *« l'univers est ce qui distingue deux
domaines homonymes »*. **Deux domaines de même nom dans deux univers sont donc écrivables, et un nom
seul ne les désigne pas.**

**Ce qui est implémenté** : `resoudreLaCible()` lit **deux** lignes plutôt qu'une, précisément pour
distinguer « aucun domaine de ce nom » de « plusieurs », et **refuse** dans les deux cas — même
`404 MESSAGE_INTROUVABLE`, même octet. Écrire une note dans un domaine élu par l'ordre des lignes
aurait été une décision fonctionnelle prise en exécution.

**Le corpus n'exerce pas ce cas** : ses quatre noms de domaine — `Infrastructure`, `Applications`,
`Poste de travail`, `Migration 2026` (`seeds/corpus.ts:102-103`) — sont distincts. C'est `P-5` en
attente : la branche existe et **rien ne l'exerce**, ni en base ni au banc.

**Ce que le comblement demanderait** : un champ d'univers dans la soumission, donc un attribut de plus
sur `#m-domaine`, donc un **regel de V-17**. C'est hors de tout lot.

---

## É-4 — **Le défaut du statut : le contrat de tâche dit `brouillon`, le cahier des charges et le gel disent `publiée`**

**C'est le seul écart de ce lot qui soit une déviation d'un contrat, et non un vide de source.**

| Source | Ce qu'elle dit | Rang |
|---|---|---|
| `mockups/V-17-editeur.html:1645` | `<button data-val="Publiée" aria-pressed="true">` — **Publiée est le bouton pressé à l'ouverture** | **1 — Maquettes** |
| `CAHIER-DES-CHARGES-FONCTIONNEL.md:187` | « Statut · *brouillon* ou *publiée* · oui (**défaut : publiée**) » | **2 — CDC** |
| `CAHIER-DES-CHARGES-FONCTIONNEL.md:729` | `RG-M05-05` — « Publication immédiate […] le statut *brouillon* est le seul mécanisme de rétention, et il est **optionnel** » | **2 — CDC** |
| `src/lib/base/schema.ts:452` | `statutDeNote('statut').notNull().default('publiee')` | conséquence des deux ci-dessus |
| `docs/taches/T-079.md:31` | « `statut` · non · `brouillon` \| `publiee` — **défaut `brouillon`** » | **5 — sous le plan** |

L'ordre de préséance de `CLAUDE.md` §2 tranche sans appréciation : *Maquettes > Cahier des charges >
Brief des vues > Pile technique > Plan de réalisation*, et un contrat de tâche est **en dessous** du
plan. **Trois sources supérieures disent `publiée` ; le contrat seul dit `brouillon`.**

**Ce qui est implémenté** : le champ absent n'est **pas écrit**, et le défaut de colonne — `publiee` —
s'applique. Il n'existe donc **aucun** défaut en dur dans le code : le schéma est le seul endroit où le
défaut est écrit, et il transcrit `CDC:187`.

**La portée réelle est étroite, et il faut le dire** : le câblage d'`ARB-063` §3.2 lit `#m-statut`, un
`role="group"` dont **un** bouton est toujours pressé — le champ sera donc **toujours soumis**, et ce
défaut ne se rencontrera que sur une soumission composée à la main.

**Ce qui est demandé** : que l'arbitrage confirme `publiée`, ou corrige `CDC:187` et regèle `V-17`.
Tant qu'il ne s'est pas prononcé, une lecture de ce dépôt trouvera **deux affirmations contraires**
dans deux fichiers, et c'est cette entrée qui les réconcilie.

---

## É-5 — Un index qui refuse laisse une note écrite et introuvable, et aucun écran ne le dit

`creerUneNote()` soumet à l'index **après** la transaction (`ARB-060`, et l'ordre prescrit par
`retirerDesNotes()`). Si le moteur est arrêté ou refuse, **la note est écrite** et l'appel lève :
l'appelant reçoit l'échec plutôt qu'un silence — et l'action rend alors une erreur `500` sur une
création qui a **réussi** en base.

C'est **mot pour mot** l'écart déjà déclaré par `enregistrerLeCorps()` (`src/lib/donnees/edition.ts`),
et il se rejoue ici : *« aucune source ne décrit l'état d'un enregistrement dont l'index a refusé, et
aucune maquette ne le porte »*. `P-10` — « dégradation, jamais panne » — vise nommément cette
situation, et la réponse tenue n'est pas la sienne.

**Rien n'est comblé** : inventer ici une reprise, une file d'attente ou un avis d'écran serait décider
d'un comportement produit. `V-17` porte bien un état `sv=erreur` dans sa planche, mais il décrit
l'échec d'**enregistrement**, pas l'échec d'**indexation** après enregistrement réussi.

---

## É-6 — **La boucle de collision n'est éprouvée qu'à moitié, et la moitié qui manque est celle que le contrat demandait**

Le contrat `T-079` §6 le demande en propres termes : *« `P-28` — la boucle de collision doit
réessayer sur violation de contrainte, pas lire puis écrire. **Éprouve-la : deux notes du même titre,
la seconde doit prendre `-2`.** »*

**Elle n'a pas été jouée**, et pour une raison que le même contrat impose au paragraphe suivant :
*« `P-30` — la base est PARTAGÉE avec d'autres copies. Ne lance **aucune** batterie qui écrit en
base. »* L'instruction d'orchestration du lot la reprend et l'étend. Les deux exigences ne sont pas
tenables ensemble sur une base partagée.

**Ce qui EST éprouvé, sans base et de façon permanente (`P-26`) :**

| Propriété | Où | Cas |
|---|---|---|
| la suite des candidats — `n-x`, `n-x-2`, `n-x-3`, jamais `-1` | `identifiants.test.ts` | 6 |
| les candidats sont deux à deux distincts — **c'est ce qui fait terminer la boucle** | `identifiants.test.ts` | 1 |
| une violation de `notes_identifiant_unique` fait repartir | `creation.test.ts` | 1 |
| une violation d'unicité **d'une autre contrainte** ne fait **pas** repartir — polarité inverse, `P-5` | `creation.test.ts` | 2 |
| tout autre échec ressort — `23503`, `25P02`, `Error`, `null`, `undefined`, une chaîne | `creation.test.ts` | 1 |

**Ce qui n'est éprouvé par RIEN à ce jour** : que l'insertion lève bien un objet portant `code` et
`constraint` aux valeurs attendues (c'est le contrat de `node-postgres`, **lu**, jamais mesuré ici) ;
que la transaction par essai reparte réellement ; que la seconde note d'un même titre prenne `-2` ;
que l'index reçoive la note ; que le `303` mène à une adresse qui répond.

**Aucune batterie du dépôt ne couvre `POST /notes/nouvelle`.** C'est une dette de couverture, elle est
connue, et elle appelle un lot qui dispose d'une **base à lui** — c'est ce que `P-30` recommande
au-delà de quatre copies concurrentes.

---

## Ce que ce lot NE déclare PAS comme écart, et pourquoi

- **Le formulaire gelé ne soumet pas.** Déjà arbitré : `ARB-063` §4 le déclare, chiffré, pour les sept
  formulaires. L'action existe et est atteignable par un `POST`
  `application/x-www-form-urlencoded` ; le câblage est écrit par un autre lot, dans la route.
- **Les cinq paramètres de pré-remplissage de `docs/routes.md:287-288`.** Déjà déclarés par le lot du
  chargeur, en tête de `src/routes/notes/nouvelle/+page.server.ts` ; ce lot n'y touche pas.
- **`verif:maquette` n'a pas été joué.** Ce n'est pas un écart : aucun fichier traversé par le banc
  n'est modifié — ni `src/vues/`, ni `src/socle.css`, ni `src/vues/V-xx.css` —, et `ARB-063` §2
  établit pourquoi c'est vrai **par construction** : « le banc rend les composants par le mode de
  conception ; rien de ce fichier n'entre dans son verdict ».
