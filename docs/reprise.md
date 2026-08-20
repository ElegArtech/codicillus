# Où reprendre

*État arrêté au 20 août 2026, au petit matin. Tout est commité et poussé.*

---

## Lire d'abord, dans cet ordre

| Fichier | Ce qu'il donne |
|---|---|
| `CLAUDE.md` | le contrat permanent — sources, préséance, vocabulaire, batteries, **28 pièges** |
| `docs/orchestration.md` | **comment on commande un lot** — le gabarit, la procédure d'une vague, les seuils |
| `docs/arbitrages.md` | les **55 décisions** rendues, dont celles qui priment sur le cadrage |
| `docs/errata-cadrage.md` | ce que le cadrage affirme et qui est faux |
| `docs/journal/V1.md` | ce qui s'est passé, et ce qu'on en a appris |

**Une session fraîche n'a pas besoin d'autre chose.** Les contrats des lots livrés sont dans
`docs/taches/contrats/`.

---

## L'état, vérifiable en quatre commandes

```
pnpm verif:maquette:app   → 409 couples · 409 conformes · 0 écart · 0 recours   (365,8 s)
pnpm test:unit            → 943 tests
pnpm verif:gel            → 43 empreintes intactes
pnpm verif:base           → 18/18 sondes conformes
```

**15 batteries réelles sur 19. Treize vertes, DEUX ROUGES**, et les deux rouges ne se ressemblent pas :

| Batterie | État | Nature |
|---|---|---|
| `verif:menus` | **rouge à 81** | **dette de gel arbitrée** (`ARB-047`) — ne se ferme que par un regel |
| `test:etancheite` | **ROUGE** — 145 vacuités, 12 défauts, 7 couples fuyants | **défaut de PRODUIT**, fermable route par route. Aucun seuil posé, et c'est délibéré |

Les quatre jalons restants attendent réellement le back : `test:parcours`, `mesure:budgets`,
`test:degradation`, `exploitation:restauration`.

**Ce qui est posé côté produit** : les 41 vues conformes au pixel ; **8 routes** ; le schéma de données
(20 tables, migrations réversibles prouvées) ; la résolution des droits ; le format canonique et son
rendu serveur ; **le convertisseur unique document ⇄ Markdown** ; **l'authentification, les sessions et
le ralentissement des tentatives** ; la fraîcheur en implémentation unique, **et enfin conforme à
`P-01`**.

**Ce qui n'existe pas encore** : recherche, indexation, versions, relations, cartographie, import,
export, espace public, consoles, éditeur — **et les gardes de trois routes déjà montées** (voir
ci-dessous). C'est l'essentiel du produit.

---

## ⚠ Ce qui doit être fermé avant tout le reste

### Trois routes servent du contenu interne à qui n'y a pas droit — `ECART-047` É-1

**Mesuré, et reproduit à la main sur le produit construit :**

```
curl -H 'accept: text/html' .../univers/production/infrastructure/signets   → 200 · 18 629 o
                                                            (aucun cookie, aucune session)
```

| Adresse | Servie à | Octets | Attendu (`routes.md` §5.5) |
|---|---|---|---|
| `/univers/{u}/{d}/signets` | **anonyme**, contributeur sans droit, compte désactivé | 18 529 | 404 |
| `/importer` | contributeur sans droit, lecteur | 14 874 | 404 |
| `/console/univers` | contributeur sans droit, lecteur, rédacteur, gestionnaire | 30 315 | 404 |

Le contenu servi n'est pas une coquille : signets curatés, noms d'auteurs, **arborescence complète des
univers et domaines**, et les actions d'écriture. `RG-ACC-01` en défaut, `P-09` par-dessus. Et la même
adresse avec un identifiant **inexistant** rend les mêmes octets : la route ne lit pas ses paramètres.

**Ce n'est le défaut d'aucun lot livré** — les lots de vue excluent nommément le chargeur et la garde.
`T-011` a livré la résolution des droits ; **aucune route de page ne l'appelle.**

> **C'est un trou du DAG : ces trois routes ont été montées par avance par les lots de liaison, et
> aucun contrat n'hérite de leur garde. À attribuer avant toute autre chose.**

### Une demi-règle sur le chemin public — `ECART-047`

`seeds/corpus.ts:2452-2454` — `notesPubliques` filtre sur `visibilite === 'Publique'` **seulement**.
`src/lib/droits/resolution.ts:328-330` exige `publique ET publiee`. **Deux définitions de « ce qu'un
anonyme peut voir », et celle dont `V-01` se sert n'en porte que la moitié.**

Zéro note `publique + brouillon` au corpus aujourd'hui : la moitié manquante n'est exercée par aucun
cas (`P-5`). **Elle devient une fuite au premier brouillon public.**

---

## Les prochains lots, dans l'ordre des dépendances

| Lot | Objet | Dépend de | Pourquoi maintenant |
|---|---|---|---|
| **à créer** | **Les gardes des trois routes montées** | T-011 ✅, T-012 ✅ | fait descendre 12 défauts et 7 couples fuyants de la batterie 6, et ferme une fuite réelle |
| **à créer** | **Contrôle de traçabilité** (`ECART-043`) | — | six numéros cités sans pièce, dont `ARB-045` **imprimé par la batterie 9 à chaque exécution** |
| **T-016** | Coquille applicative | T-011 ✅, T-012 ✅ | dépliage mémorisé, dossiers interdits absents. **Premier lecteur de `event.locals.identite`**, qui n'en a aucun |
| **T-027** | Indexation et projection des droits | T-011 ✅, T-014 ✅ | `ADR-006` — le filtrage au plus près de la donnée |
| **T-017** | Notifications, états, dialogues, messages | T-016 | porte le décompte de V-05 et le bandeau d'échec, que `T-012` a laissés |

**Deux lots peuvent partir ensemble** s'ils ne partagent aucun fichier. **Mais pas deux lots gourmands
en banc** : mesuré, 368 s de temps instrument pour plus de deux heures d'horloge. **Et pas deux lots
dont les critères de sortie contiennent une commande destructrice sur la base** — `pnpm verif:base`
n'appartient qu'au lot qui touche `base/**` (`ECART-045` É-3).

---

## Ce qui reste ouvert, et que personne n'a repris

### Six numéros cités sans pièce — `ECART-043`

`ECART-029`, `030`, `034`, `042`, `ARB-045`, `ARB-046`, cités depuis **dix** endroits. Deux sont dans
`verif/references/`, en écriture humaine seule : `a11y-seuil.json:16-21` justifie **deux lignes
volontairement absentes d'un seuil** en renvoyant à `ECART-042`, qui n'existe pas. Et **`ARB-045` est
imprimé par la batterie 9 à chaque exécution** comme l'autorisation d'une correction d'instrument.

Réparation proposée en **bloquant** : un contrôle qui refuse toute référence sans pièce porteuse. Dette
de départ **six lignes**, dont deux à réparation connue.

### Trois défauts d'instrument, déclarés et non réparés

1. **`P-14`** — l'horloge du banc ne survit pas au parallélisme. **À réparer avant toute
   parallélisation du banc.**
2. **`ECART-042` É-6** — troisième source de non-déterminisme sur `V-37 chargement` (et le dossier
   n'existe pas — voir ci-dessus).
3. **La sonde de restitution de focus** n'est plus exercée par aucun des 409 couples. Le motif a
   désormais un nom, **`P-26`**, et trois occurrences.

### Un garde-fou qui bloque toute route nouvelle

`verif/menus.mjs:923` porte `ATTENDU_ROUTES = 39` en dur et sort en **code 2** si l'extraction diverge.
Toute route ajoutée au §3 de `docs/routes.md`, même arbitrée, fait refuser l'instrument.

### Deux contradictions ouvertes du lot de contenu

La **coloration syntaxique** (le gel porte ses jetons au balisage) ; et le **titre de niveau 1** que le
cahier autorise et que le gel réserve — `V-17:3146` donne `h2` pour `#` **et** `##`. Se refermera à
`T-021`. *(La troisième — le rendu graphique d'un diagramme — est tranchée : `ARB-049`, bloc de code.)*

### Aucun mécanisme n'exige la mise à jour du journal

Toujours vrai. Le journal de cette journée a été écrit à la clôture, parce que l'orchestrateur l'a
fait — pas parce que le dispositif l'a demandé.

---

## Ce qui attend le commanditaire

**Une seule chose bloque, et elle est visuelle** : les **81 entrées « Signets » mortes**. Le rail est
global, V-22 est portée par un domaine, et les deux sont dans le gel (`ARB-047`). Elles se ferment par
un regel du rail **ou** de V-22.

Le reste du dossier de regel est **vide** : tout s'est déduit, y compris les quatre décisions de forme
de `T-012` et les deux branches de libellé de `T-013b` (`docs/dossier-regel.md`).

Les dettes de gel arbitrées — 3 470 violations d'accessibilité, 173 couples zone × état, 210 sous
corpus vide, 138 emplois de vocabulaire — sont **nommées et bornées**, et leurs seuils ne peuvent que
descendre.

**La batterie 6 n'a PAS de seuil, et il ne faut pas lui en donner** : ses 12 défauts sont trois gardes
de route, et ses 145 vacuités se referment route par route. *Ne pose pas de seuil sur une dette qu'un
lot referme* (`docs/orchestration.md` §4).
