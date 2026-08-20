# Où reprendre

*État arrêté au 21 août 2026, mesuré batterie par batterie. Tout est commité et poussé.*

---

## Lire d'abord, dans cet ordre

| Fichier | Ce qu'il donne |
|---|---|
| `CLAUDE.md` | le contrat permanent — sources, préséance, vocabulaire, batteries, **32 pièges** |
| `docs/orchestration.md` | **comment on commande un lot** — le gabarit, la procédure d'une vague, les seuils |
| `docs/arbitrages.md` | les **59 décisions** rendues, dont celles qui priment sur le cadrage |
| `docs/errata-cadrage.md` | ce que le cadrage affirme et qui est faux |
| `docs/journal/V1.md` | ce qui s'est passé, et ce qu'on en a appris |

**Une session fraîche n'a pas besoin d'autre chose.** Les contrats des lots livrés sont dans
`docs/taches/contrats/` — quarante à ce jour.

---

## L'état, en une commande

```
pnpm verify        les 25 batteries, chacune jouée JUSQU'AU BOUT
```

**Elle ne s'arrête plus au premier rouge**, et c'est la réparation qui rend ce document tenable : une
chaîne conjonctive rendait toujours le même chiffre — celui de la première batterie rouge — et
n'apprenait rien des seize suivantes. Elle appelait par ailleurs `verif:maquette`, l'étalonnage à
blanc, et **jamais** `verif:maquette:app` : elle ne confrontait pas le produit à la loi du projet.

### Dix-neuf vertes

`verif:gel` (43 empreintes) · `check` · `verif:jetons` · `verif:inventaire` ·
`verif:demo:hors-production` · `test:unit` (**1 864**) · `test:aller-retour` · `verif:convertisseur` ·
`verif:fraicheur` · `test:droits` · `test:vide` · `test:etats` · `test:impression` · `verif:menus` ·
`verif:vocabulaire` · `test:a11y` · `verif:maquette` · **`verif:maquette:app` — 409 couples, 409
conformes, 0 écart, 0 recours** · `exploitation:restauration`

### Six rouges, et aucun ne ressemble aux autres

| Batterie | Le chiffre | Ce que c'est | Qui la referme |
|---|---|---|---|
| `verif:couverture` | **60** règles que rien ne porte, **82** que rien ne contrôle | **la dette de fonctionnalité**, énumérée pour la première fois | des lots, un module à la fois |
| `test:parcours` | 13 étapes franchies, **27 non couvertes** | 11 comportements non câblés, **7 tenues par le gel**, 3 actions absentes, 2 routes absentes | des lots — sauf les 7 du gel |
| `test:etancheite` | 0 défaut, 0 couple discernable, **8 vacuités** | des cases vertes **par absence de route** : `RA-01`, pas une réussite | chaque lot de route |
| `test:degradation` | **0 défaut**, 2 non-couvertures | le gel n'a **aucune phrase** pour dire qu'une brique est absente | un regel de V-24 / V-35 |
| `verif:donnees` | 0 divergence, **4 lacunes** | dont `R-01` — V-31 somme 72 utilisations sur un corpus de 32 notes | le commanditaire |
| `verif:tracabilite` | **24 citations, 14 numéros** sans pièce | la mémoire du dépôt renvoie à des pièces absentes | un arbitrage, pas un lot |

**Et une septième qui n'est pas un rouge** : `mesure:budgets` sort en **2** sur une base non préparée
— *refus de mesurer*, plutôt qu'un chiffre faux tenu sur 32 notes. La séquence est
`base:migrer · base:semer · volumetrie:charger · réindexer · mesurer`. Préparée, elle rend **cinq
budgets verts** (recherche 63–71 ms, note 156–176 ms, enregistrement 237–276 ms, cartographie
221–232 ms) et **un rouge de produit**, traité ci-dessous.

---

## Ce qui est posé, et ce qui ne l'est pas

**Posé** : les 41 vues conformes au pixel · **34 routes de page** et leurs chargeurs, 3 points
d'entrée d'API, 11 actions de formulaire · le schéma (**21 tables**, migrations réversibles
prouvées) · la résolution des droits · le format canonique et son rendu serveur · le convertisseur
unique document ⇄ Markdown · l'authentification, les sessions, le ralentissement des tentatives · la
fraîcheur en implémentation unique · **les pièces jointes** · le geste de vérification.

**Non posé** : ce que `verif:couverture` énumère — **60 règles du cahier que pas une ligne de code ne
cite**. Ce n'est plus une impression, c'est une liste, par module, que la batterie imprime.

---

## ⚠ Le rouge de produit qui bloque la recherche

### Une note enregistrée n'entre jamais dans l'index — `T-075`, en vol

`mesure:budgets` poste 5 : la note enregistrée n'est pas retrouvable après **30,1 s**, le seuil
d'échec du cahier. `RG-M05-06` (« trouvable en 10 secondes ») n'est pas tenue.

La cause est lue, pas déduite :

- `indexerDesNotes()` **déclare** porter la règle (`src/lib/recherche/moteur.ts:236`) ;
- elle n'a que **deux appelants**, tous deux dans la console ;
- `src/lib/donnees/edition.ts` ne mentionne ni recherche ni index ;
- et `moteur.ts:144-145` porte un paramètre écrit **pour ce cas** — *« l'indexation synchrone d'une
  écriture n'a pas à relire le corpus entier »* — qu'**aucun appelant ne passe**.

`ADR-009` tranche le seul point qui aurait pu se discuter : *« l'écriture dans l'index est synchrone
à l'enregistrement »*. Meilisearch n'est pas une brique optionnelle ; les deux nommées sont les
embeddings et le convertisseur.

**La partie dangereuse est le périmètre** : `ADR-006` le projette *dans* l'index, et **aucune
batterie ne lit l'index**. Une note qui *sort* du périmètre d'un compte à l'écriture est une fuite
que `test:etancheite` ne verrait pas.

---

## Les prochains lots, dans l'ordre

`verif:couverture` **est** le plan. Son tableau par module donne l'ordre, et il n'est pas celui
qu'on aurait deviné :

| Module | Règles | Portées | Contrôlées | Ce que ça veut dire |
|---|---|---|---|---|
| **M04** cycle de vie d'une note | 10 | 2 | 2 | huit règles sur dix ne sont nulle part |
| **M14** administration | 10 | 2 | 2 | idem |
| **M08** relations | 7 | 3 | **0** | sept règles, **zéro contrôle** |
| **M18** interface | 17 | 11 | 11 | six manquent |
| **NF** non fonctionnel | 10 | 4 | 4 | six manquent |
| **M05** édition | 9 | 4 | 3 | et le rouge d'indexation est là |
| **NOT** modèle de note | 4 | **4** | 2 | portée en entier, **à moitié sans contrôle** |
| **DA** design | 3 | 0 | 2 | **un contrôle qui mesure du vide** |
| **M12**, **DRO**, **ACC** | — | pleins | pleins | rien à faire |

**Les deux chiffres ne se remplacent pas.** Une règle portée mais non contrôlée est une règle dont
personne ne saura qu'elle s'est cassée ; une règle contrôlée mais non portée est un contrôle qui
mesure du vide. `NOT` et `DA` sont les deux cas, et ils demandent des lots opposés.

**Deux lots peuvent partir ensemble** s'ils ne partagent aucun fichier. **Mais pas deux lots gourmands
en banc**, et **pas deux lots qui écrivent dans la base partagée** — au-delà de quatre copies
concurrentes, donne une base à chaque lot qui écrit (`P-30`). Un lot qui touche `package.json` ne se
rapatrie **jamais** par copie : la fusion est à la main (`P-24`).

---

## Ce qui reste ouvert, et que personne n'a repris

### Les numéros cités sans pièce — `verif:tracabilite`, rouge à 24 citations pour 14 numéros

L'instrument imprime la liste avec fichier et ligne à chaque exécution, et l'écrit dans
`verif/rapports/tracabilite.json`. **Ce document ne l'énumère pas, et c'est délibéré** : une liste
tenue à la main se périme, et c'est exactement la faute que `ECART-043` documente.

**Le seuil n'est pas posé** : l'instrument le propose par genre, jamais globalement, et refuse de se
le donner. Les dossiers manquants ne se reconstituent pas — `git log -S` ne rend que les commits qui
les citent, et écrire un dossier depuis un résumé de deuxième main produirait une pièce d'apparence
opposable et de contenu deviné.

### Deux défauts d'instrument, déclarés et non réparés

1. **`ECART-042` É-6** — la minuterie de 2 600 ms de `V-37 chargement`. Elle tient à `clock.resume()`
   avant axe, non à la pose de l'horloge : `P-14` est réparé, celui-ci ne l'est pas.
2. **La sonde de restitution de focus** n'est plus exercée par aucun des 409 couples. Le motif a un
   nom — `P-26` — et trois occurrences.

### Un garde-fou qui bloque toute route nouvelle

`verif/menus.mjs` porte un nombre de routes attendu **en dur** et sort en **code 2** si l'extraction
diverge. Toute route ajoutée au §3 de `docs/routes.md`, même arbitrée, fait refuser l'instrument.

### Deux contradictions ouvertes du lot de contenu

La **coloration syntaxique** (le gel porte ses jetons au balisage) ; et le **titre de niveau 1** que
le cahier autorise et que le gel réserve — `V-17:3146` donne `h2` pour un dièse **et** pour deux.

### Aucun mécanisme n'exige la mise à jour du journal

Toujours vrai. Le journal de cette nuit a été écrit parce que l'orchestrateur l'a fait — pas parce
que le dispositif l'a demandé.

---

## Ce qui attend le commanditaire

**Quatre choses, et trois sont visuelles.**

| # | Ce qui bloque | Pourquoi aucun lot ne peut le fermer |
|---|---|---|
| `R-01` | **V-31 somme 72 utilisations de template** sur un corpus de 32 notes (`:2705`, `:2711`, `:2717`, `:2723`, sommées au `:3289`) | le défaut est **arithmétique et dans le gel**. Aucune colonne de provenance ne peut porter 72 provenances sur 32 lignes |
| `R-02` | **les treize pièces jointes de V-14** sont nommées deux fois et pesées **zéro octet** | le gel les déclare ainsi ; les inventer serait `P-02` |
| — | **le gel n'a aucune phrase pour dire qu'une brique est absente** — V-24 n'a pas de prise du tout, V-35 en a une dont les trois phrases nomment le défaut *du fichier* | `ADR-009` le nomme : « l'absence d'un tel état est un vide de spécification à remonter, pas à combler » |
| — | **le libellé relatif de dernière connexion** — « aujourd'hui à 08:41 » | aucune source ne donne le seuil où « N jours » devient « N mois ». Les deux vues écrivent la chaîne telle quelle |

Les dettes de gel arbitrées — violations d'accessibilité, couples zone × état, emplois de vocabulaire
— sont **nommées et bornées**, et leurs seuils ne peuvent que descendre.

**`test:etancheite` et `verif:couverture` n'ont PAS de seuil, et il ne faut pas leur en donner** :
leurs chiffres se referment lot par lot. *Ne pose pas de seuil sur une dette qu'un lot referme*
(`docs/orchestration.md` §4).
