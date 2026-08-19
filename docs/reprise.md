# Où reprendre

*État arrêté au 19 août 2026, 23 h 30. Tout est commité et poussé ; rien ne tourne.*

---

## Lire d'abord, dans cet ordre

| Fichier | Ce qu'il donne |
|---|---|
| `CLAUDE.md` | le contrat permanent — sources, préséance, vocabulaire, batteries, **22 pièges** |
| `docs/orchestration.md` | **comment on commande un lot** — le gabarit, la procédure d'une vague, les seuils |
| `docs/arbitrages.md` | les **48 décisions** rendues, dont celles qui priment sur le cadrage |
| `docs/errata-cadrage.md` | ce que le cadrage affirme et qui est faux |
| `docs/journal/V1.md` | ce qui s'est passé, et ce qu'on en a appris |

**Une session fraîche n'a pas besoin d'autre chose.** Les contrats des lots livrés sont dans
`docs/taches/contrats/`.

---

## L'état, vérifiable en une commande

```
pnpm verif:maquette:app   → 409 couples · 409 conformes · 0 écart · 0 recours
pnpm test:unit            → 681 tests
pnpm verif:gel            → 43 empreintes intactes
```

**13 batteries réelles sur 19.** **Dix vertes, DEUX ROUGES** — et la seconde a été affirmée verte
ici pendant une journée (`ECART-044` É-1, relevé par le lot `T-012` sur sa ligne de base) :

- `verif:menus` **rouge à 81** — dette de gel arbitrée (`ARB-047`), qui ne se ferme que par un regel ;
- `verif:fraicheur` **rouge à 1** — `src/vues/V-14.svelte:345`, le libellé ne vient pas de
  `libelleFraicheur()`. **Ce n'est pas une dette de gel : c'est un défaut de portage, et `ARB-029` en
  porte déjà la solution complète** — rendu le 19 août, jamais appliqué. Il touche `P-01`, le premier
  des dix principes non négociables. Aucune ligne de portage n'est jamais admise
  (`docs/orchestration.md` §4).

Les six jalons restants attendent tous réellement le back : `test:aller-retour`, `test:etancheite`,
`test:parcours`, `mesure:budgets`, `test:degradation`, `exploitation:restauration`.

**Ce qui est posé côté produit** : les 41 vues conformes au pixel ; 7 routes ; le schéma de données
(18 tables, migrations réversibles prouvées) ; la résolution des droits ; le format canonique du
contenu et son rendu serveur ; la fraîcheur en implémentation unique.

**Ce qui n'existe pas encore** : authentification, recherche, indexation, versions, relations,
cartographie, import, export, espace public, consoles, éditeur. **C'est l'essentiel du produit.**

---

## Les prochains lots, dans l'ordre des dépendances

| Lot | Objet | Dépend de | Pourquoi maintenant |
|---|---|---|---|
| **T-015** | Convertisseur unique document ⇄ Markdown | T-014 ✅ | Rend la **batterie 4** écrivable — le « critère de réussite principal » de `RG-M13-01`. Le format canonique vient d'être posé pour ça |
| **T-012** | Authentification et sessions | T-011 ✅ | Débloque la **batterie 6** (étanchéité), et `RG-M14-08` qui n'a aujourd'hui aucun point d'application (`T-011` É-6) |
| **T-016** | Coquille applicative | T-011, T-012 | Dépliage mémorisé, dossiers interdits absents |
| **T-027** | Indexation et projection des droits | T-011 ✅, T-014 ✅ | `ADR-006` — le filtrage au plus près de la donnée |

**Deux lots peuvent partir ensemble** — T-015 et T-012 ne partagent aucun fichier. **Mais pas deux
lots gourmands en banc** : mesuré, 368 s de temps instrument pour plus de deux heures d'horloge
(`docs/orchestration.md` §3).

---

## Ce qui reste ouvert, et que personne n'a repris

### Trois défauts d'instrument, déclarés et non réparés

1. **`P-14`** — l'horloge du banc ne survit pas au parallélisme. Le banc étant séquentiel, il ne l'a
   jamais rencontré. **À réparer avant toute parallélisation.**
2. **`ECART-042` É-6** — une troisième source de non-déterminisme sur `V-37 chargement` : la
   minuterie de 2 600 ms de `window.notifier` que les 2 × 1 000 ms d'avance virtuelle ne drainent
   pas. 2 couples sur 409.
3. **La sonde de restitution de focus**, une fois corrigée, **n'est plus exercée par aucun des 409
   couples**. `P-5` sur la correction elle-même — elle est redevenue une règle qu'on espère.

### Un garde-fou qui bloque toute route nouvelle

`verif/menus.mjs` porte `ATTENDU_ROUTES = 39` en dur et refuse de mesurer si l'extraction diverge.
Son commentaire annonce lire le §9 de `docs/routes.md` ; **il l'a recopié**. Toute route ajoutée,
même arbitrée, fait sortir l'instrument en code 2.

### Trois contradictions ouvertes du lot de contenu

La **coloration syntaxique** (le gel porte ses jetons au balisage ; les stocker casserait
l'aller-retour, les recalculer demanderait un lexer hors pile) ; le **rendu graphique d'un
diagramme**, qu'aucune maquette ne montre ; et un **titre de niveau 1** que le cahier autorise et que
le gel réserve au titre de la note.

### Aucun mécanisme n'exige la mise à jour du journal

Le journal de vague a été écrit **après coup**, parce qu'un vérificateur l'a relevé — pas parce que
le dispositif l'a demandé.

---

## Ce qui attend le commanditaire

**Une seule chose bloque, et elle est visuelle** : les **81 entrées « Signets » mortes**. Le rail est
global, V-22 est portée par un domaine, et les deux sont dans le gel — aucun chemin ne satisfait les
deux sans inventer (`ARB-047`). Elles se ferment par un regel du rail **ou** de V-22.

Le reste du dossier de regel est **vide** : tout s'est déduit (`docs/dossier-regel.md`).

Les dettes de gel arbitrées — 3 470 violations d'accessibilité, 173 couples zone × état, 210 sous
corpus vide, 138 emplois de vocabulaire — sont **nommées et bornées**, et leurs seuils ne peuvent que
descendre.
