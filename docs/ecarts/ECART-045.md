# ÉCART-045 — Lot T-015, convertisseur unique document ⇄ Markdown — 20 août 2026

**Huit écarts remontés, tous vérifiés par l'orchestrateur. Aucun n'a été écarté.**
Gravité d'ensemble : **moyenne** — mais `É-1` atteint une borne du contrat, et `É-6` trouve un trou
dans le livrable du lot précédent.

**Le lot ferme sa cible.** La **batterie 4** existe : `pnpm test:aller-retour` rend
`14 cas · 14 identiques · 0 écart`, et le jalon qui échouait bruyamment depuis la vague 0 est débranché.
C'est la propriété que `RG-M13-01` désigne comme le **« critère de réussite principal »** du produit.
`pnpm test:unit` passe de **681 à 786** pour ce lot seul. Banc inchangé, 409/409.

---

## É-1 — **Borne 1 atteinte** : le gel porte une troisième sérialisation Markdown · **tranché par `ARB-055`**

Le contrat disait : *« si une maquette gelée montre un Markdown sérialisé, ligne ouverte et citée, alors
elle est la loi et `ARB-049` doit céder devant elle […] mais je n'ai pas cherché toutes les
orthographes. »*

**Il a cherché, et il a trouvé** — `mockups/V-16-comparaison.html:1862-1878`, `window.blocEnLignes`,
« représentation linéaire d'un bloc, façon texte source ». Sept familles, dont **six coïncident** avec
les formes qu'il avait retenues **avant** de la trouver.

**C'est le mécanisme du contrat qui a fonctionné, et c'est la seule chose à retenir de cet écart** :
une borne posée sur une affirmation de l'orchestrateur a produit une lecture que l'orchestrateur
n'avait pas faite. Neuf affirmations fausses en une journée avaient donné la parade
(`docs/orchestration.md` §2) ; elle marche.

`ARB-055` tranche : `blocEnLignes` est un **quatrième rendu** dérivé du document canonique, de la même
nature que le HTML, et non un second convertisseur. Trois faits l'établissent — son entrée est le
`BlocDeContenu` des maquettes et non le document canonique ; elle est irréversible **par construction**
(ni glyphe, ni source d'image, ni ancre, ni état coché, et un `default: return [""]` qui efface
silencieusement) ; et elle est **définie dans 29 maquettes, appelée par une seule**
(`V-16:2019` — vérifié).

Les deux divergences que le lot déclarait ne sont donc pas des divergences : **ce sont deux fonctions.**
Et le port du gel existe déjà, conforme, à `src/vues/V-16.svelte:149-173`.

---

## É-2 — `pnpm verif:fraicheur` était déjà rouge · **doublon de `ECART-044` É-1**

**Les deux lots l'ont trouvé indépendamment, chacun sur sa ligne de base, dans deux copies distinctes.**
`T-015` a poussé la preuve plus loin : `git diff HEAD -- src/vues/V-14.svelte` est vide, et une analyse
réduite à ce seul fichier rend le même constat.

Deux lots parallèles convergeant sur le même constat est la meilleure confirmation qu'on pouvait avoir
que le défaut préexistait. Voir `ECART-044` É-1 pour le dossier : `ARB-029` en porte la solution
complète depuis le 19 août et n'a jamais été appliqué.

---

## É-3 — `pnpm verif:base` non exécutée, et le refus est juste

Le lot a **refusé** d'exécuter une commande de son propre critère de sortie, et il a eu raison.

`pnpm verif:base` enchaîne `reversibilite` — qui descend puis remonte toutes les migrations — et
`semer`. Sur la base **partagée** avec `T-012`, qui travaillait en parallèle, c'étaient deux gestes
destructeurs sur le lot du voisin.

**C'est un défaut de mon contrat, pas du lot.** J'ai inscrit `pnpm verif:base` aux critères de sortie
des **deux** lots parallèles sans voir que la commande est destructrice et la base unique. Le lot ne
touchait aucun fichier de `base/**` ni de `src/lib/base/**` : la commande ne pouvait rien prouver de
lui, et pouvait casser l'autre.

**Rejouée par l'orchestrateur après rapatriement des deux : `18/18 sondes conformes`.**

> **Leçon d'orchestration, à porter à `docs/orchestration.md` §3** : une commande destructrice sur une
> ressource partagée ne peut pas figurer aux critères de sortie de deux lots parallèles. Soit une base
> par copie, soit la commande n'est au critère que du lot qui touche son domaine.

---

## É-4 — Le prédicat du contrôle d'unicité a été resserré après mesure, et le lot le déclare

Écrit d'abord comme « deux formes Markdown hors de l'implémentation », le contrôle `A2` rougissait sur
`src/vues/V-16.svelte:149-172` — **la transcription fidèle du gel de `É-1`**.

Le resserrement est **légitime et bien motivé** : une batterie qui fait rougir une transcription du gel
crie faux, et c'est la faute exacte d'`ECART-041` — 31 faux défauts sur 31, tous nés d'une clé de
rapprochement mal choisie. Le prédicat devient « formes **et** contact avec le format canonique ».

**Ce qui rend le resserrement acceptable est ce que le lot a ajouté avec lui** : le rapport imprime la
liste des **frontaliers** à chaque exécution — les fichiers qui portent des formes sans toucher au
format canonique, et qui basculeront en constat le jour où ils y toucheront. Un fichier aujourd'hui,
`src/vues/V-16.svelte`, nommé.

**Le risque résiduel est déclaré et chiffré** : `documents-du-gel.ts:285` et `document.test.ts:130`
portent déjà un littéral `# depuis bkp-01.prod…` — un commentaire shell dans un bloc de code — compté
comme *un* marqueur ; un second littéral de ce genre ferait un faux positif. **Il se réglera par une
exemption déclarée, jamais par un nouveau resserrement**, et le lot l'écrit ainsi.

---

## É-5 — Une seule limite de représentation, levée bruyamment

Un texte portant la marque `code` et fait **uniquement d'espaces** n'a pas de forme inversible.
`serialiserEnMarkdown` **lève** `MarkdownNonRepresentable` plutôt que de perdre en silence.
**0 occurrence au corpus**, cas éprouvé en unitaire.

C'est exactement le « se déclare et se compte » d'`ARB-049` décision 4, et
`STACK-TECHNIQUE.md:461` (`R-05`) : *« un aller-retour non idempotent fait échouer la construction »*.
**Rien à arbitrer** : la règle a été appliquée.

---

## É-6 et É-7 — Deux trous du format canonique · **tranchés par `ARB-056`**

Le lot que la règle 1 de `T-014` visait explicitement en a trouvé deux qui manquent.

| # | Le trou | Décision |
|---|---|---|
| É-6 | **l'ordre des marques n'est pas contraint** : `[bold, italic]` et `[italic, bold]` sont deux JSON, donc deux documents, pour ce que ProseMirror n'écrirait jamais qu'une fois. C'est ce que la règle 1 existe pour interdire, et elle l'a manqué | septième règle : ordre de déclaration du type `Marque`, et `analyserDocument` **refuse** — il ne réordonne pas. Réordonner ferait de la validation une normalisation, et rendrait la batterie 4 verte par construction sur ce point |
| É-7 | **`texteEnLigne` (`document.ts:300`) n'interdit que `\n`** : un fichier en CRLF donnerait des paragraphes à `\r` final, acceptés par le schéma. `RG-M04-05` n'est tenue que dans les blocs de code | aucun `\r` n'entre dans un document canonique, où que ce soit. L'hygiène de fin de ligne appartient à la frontière du fichier, donc à `T-043` |

Le lot **n'a pas comblé** : il a préservé l'ordre des marques dans son convertisseur — c'est pourquoi son
italique s'écrit avec un tiret bas — et refusé de normaliser les `\r` à la désérialisation, au motif
qu'`ADR-004` interdit « la correction appliquée d'un seul côté ». **Les deux gestes sont justes.**

---

## É-8 — Le niveau 1 de titre reste contradictoire, et se refermera à `T-021`

`mockups/V-17-editeur.html:3146` donne `h2` pour `# ` **et** pour `## ` ;
`mockups/V-18-editeur-operationnel.html:3120` n'offre même pas `# `. Le format canonique admet six
niveaux, et le convertisseur émet un dièse pour le niveau 1 — fidélité oblige, avec un cas nommé.

C'est l'une des trois contradictions ouvertes de `T-014`, et elle est **d'affordance de frappe**, non
de format : elle appartient à `T-021`. **Rien à arbitrer ici.**

---

## Ce que le lot a livré au-delà de sa cible, et qui vaut d'être noté

**Une troisième sonde que le contrat ne demandait pas, et qui manquait.**
`--sonde=temoin-inerte` retire un délimiteur que le convertisseur n'écrit **jamais**. Elle touche 0
fois, et l'instrument **refuse de conclure** — code **1**, jamais inversé — au lieu de rendre le vert
d'une mutation inerte.

```
$ node verif/aller-retour.mjs --sonde=temoin-inerte ; echo $?
  la sonde a touché 0 fois, et 0 cas sur 14 rougissent.
  REFUS DE CONCLURE : la mutation est INERTE — elle n'a rien touché, donc elle ne
  teste rien. C'est le mode de défaillance RA-01, et il ne se lit pas comme une panne.
1
```

`docs/orchestration.md` §1.2 règle 4 exige de *« prouver que la mutation n'est pas inerte »*. **Le lot
a fait de cette exigence un contrôle exécutable**, là où elle n'était jusqu'ici qu'une consigne de
contrat — et c'est le régime que ce dépôt préfère : *bloquant > vérifiable > déclaratif*. Sans elle, la
garde anti-faux-vert aurait été une règle qu'aucun cas n'exerce, soit `P-5` sur le livrable même.

**Et une non-revendication honnête** : *« tous les appelants passent par l'unique »* est **vrai par
vacuité** aujourd'hui — deux fichiers importent l'implémentation, la batterie et son unitaire. Le
garde-fou est posé, pas démontré ; il ne prouvera quelque chose qu'au premier lot d'export, d'import ou
de frappe. Le lot le dit lui-même, et c'est `P-5` déclaré sur son propre livrable.

---

## P-22 — ce que le lot laisse derrière lui

Aucune dépendance installée. Aucun conteneur créé. Aucun serveur laissé ouvert — vérifié par `ps`,
**jamais par `pgrep`** (`P-1`). Un premier lancement du banc au premier plan a été tué à 20 minutes
d'horloge, relancé en tâche de fond, et attendu **sur un marqueur écrit** — la parade exacte de `P-1`,
appliquée sans qu'on la lui rappelle.
