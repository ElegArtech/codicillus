# Codicillus

**Une base de connaissances documentaire interne, auto-hébergée, où chaque document affiche s'il est
encore digne de confiance.**

Elle remplace un patrimoine éparpillé — procédures en traitement de texte, cartographies en tableur,
PDF, fichiers texte, liens web — par un point d'entrée unique, cherchable et fiable, pour une
direction technique de 50 à 200 personnes.

---

## Ce qui la distingue

**La fraîcheur est le mécanisme central.** Un signal de fiabilité temporelle, calculé sur la date de
dernière vérification, est visible partout où une note apparaît. N'importe quel contributeur habilité
le remet au vert en un clic, sans formulaire. Le principe `P-01` du cahier des charges exige qu'il
n'existe **qu'une seule implémentation** de ce calcul — badge de note, agrégats de domaine et
d'univers, indicateurs d'accueil appellent rigoureusement la même. Une batterie l'oppose
mécaniquement.

**Une note porte deux registres de lecture.** Une version *Référence*, dense et exhaustive, et une
version *Opérationnelle*, pas-à-pas et orientée action. Pas un résumé : le même fond, réorganisé pour
agir.

**Le corpus est aussi un graphe.** Les notes peuvent être typées — Application, Serveur, Équipement
réseau, Contact — et reliées par des relations qualifiées : *héberge*, *dépend de*, *administre*. On y
lit les dépendances techniques et les points de défaillance unique.

---

## La règle qui gouverne tout le reste

> **Les maquettes sont la loi. Pour chaque vue, dans chacun de ses aspects — pixels, polices,
> icônes.**

Quarante et une maquettes HTML statiques, gelées le 18 août 2026, sont la source de vérité du rendu.
L'ordre de préséance ne se discute pas :

```
Maquettes  >  Cahier des charges  >  Brief des vues  >  Pile technique  >  Plan de réalisation
```

**Et cette règle n'est pas déclarative — elle est portée par des mécanismes.** C'est la seule chose
qui la distingue d'une bonne intention :

| Mécanisme | Ce qu'il fait |
|---|---|
| Le bit d'écriture retiré de `cadrage/`, `mockups/`, `règles/` | Toute écriture y échoue, **y compris par `sed`, `tee` ou redirection** |
| `pnpm verif:gel` | Recompte 43 empreintes SHA-256 et sort en 1 à la première divergence |
| `pnpm verif:maquette --contre=app` | Compare **409 couples** de captures, application contre gel, **tolérance zéro pixel** |
| `pnpm verif:maquette:sonde` | Perturbe le seul côté candidat et **exige que le banc rougisse**, code retour inversé |

Le dernier point est le moins évident et le plus important : *un banc toujours vert ne prouve rien.*
Chaque instrument de ce dépôt doit démontrer qu'il sait dire **non** avant qu'on accorde du crédit à
son **oui**.

---

## Où en est le projet

**Les 41 vues sont implémentées et conformes au pixel près : 409 couples sur 409, zéro écart, zéro
recours au jugement humain.** Sur les 265 états déclarés, aux quatre fenêtres pour les vues soumises
à l'adaptation, sans tolérance.

**Le back commence.** Le schéma de données est posé — 18 tables, migrations réversibles prouvées par
empreinte, contraintes structurelles **inécrivables** plutôt qu'« interdites par l'application ».
Sept routes rendent leurs vues. Tout le reste — droits, authentification, recherche, versions,
relations, import, export, consoles — est devant.

**Douze batteries de vérification sur dix-huit sont réelles.** Les six restantes attendent
effectivement le back : aller-retour du format canonique, étanchéité, parcours de référence, budgets
de performance, dégradation, restauration.

> **Ce n'est donc pas un produit utilisable aujourd'hui.** Ce sont 41 écrans exacts, une base qui
> refuse les états illégaux, une navigation qui fonctionne, et un harnais qui a démontré douze fois
> qu'il sait dire non.

---

## Les batteries, et ce que chacune prouve

Elles ne mesurent pas la même chose, et le dépôt tient à ce que la différence reste lisible.

| Commande | Ce qu'elle prouve |
|---|---|
| `pnpm verif:gel` | Aucun regel non arbitré — 43 empreintes |
| `pnpm verif:maquette` | La conformité de rendu, trois niveaux : structure et ARIA, puis pixels, puis jugement |
| `pnpm verif:jetons` | Aucune couleur, aucun espacement, aucun rayon en dur hors du socle |
| `pnpm verif:fraicheur` | **Une seule** implémentation du calcul, et tous les affichages l'appellent |
| `pnpm test:droits` | Aucune action interdite dans le DOM — **ni grisée, ni masquée** |
| `pnpm test:etats` | Chaque zone rend ses quatre états, et une zone en erreur ne fait pas tomber la page |
| `pnpm test:a11y` | axe-core, parcours clavier, focus visible, alternatives textuelles |
| `pnpm test:vide` | Sur une base vierge, aucun indicateur n'affiche de valeur |
| `pnpm verif:menus` | Aucune entrée de navigation inerte ; un module désactivé disparaît |
| `pnpm verif:vocabulaire` | Aucun synonyme des douze termes contractuels |
| `pnpm test:impression` | La lecture d'une note s'imprime sans navigation ni panneaux |
| `pnpm verify` | Les dix-huit enchaînées |

**Plusieurs sortent rouges, délibérément.** Une batterie qui mesure les deux côtés — la maquette
gelée *et* l'application — sépare ce que le code a introduit de ce que la maquette porte déjà. Le
second n'est pas corrigeable sans trahir la loi : il est compté, nommé, et vit comme une **dette
déclarée** dans un seuil arbitré qui **ne peut que descendre**.

---

## Faire tourner

```bash
pnpm install
pnpm dev                    # le produit, en développement
pnpm verif:maquette         # étalonnage à blanc : la maquette contre elle-même, 409 couples
pnpm verif:maquette:app     # la conformité réelle de l'application aux 41 maquettes
pnpm verify                 # les dix-huit batteries
```

Node 24 · pnpm 11 · SvelteKit 2 · Svelte 5 · TypeScript 6 · Vite 8.
Pour la base : PostgreSQL 18 avec pgvector, Meilisearch, et une composition Docker à six services
dont **deux optionnels** — leur arrêt dégrade la fonctionnalité concernée sans jamais empêcher
l'usage du reste (`P-10`).

---

## Le dépôt

| Où | Quoi | Régime |
|---|---|---|
| `mockups/` | Les 41 vues gelées, le socle, `GEL.md` et ses empreintes | **lecture seule, mécaniquement** |
| `cadrage/` | Cahier des charges, brief des vues, pile technique, plan de réalisation | **lecture seule** |
| `règles/` | La méthode dont ce projet est le pilote | **lecture seule** |
| `verif/` | Le banc de comparaison et les batteries | instruments |
| `src/` | L'application | code |
| `base/` | Schéma et migrations | code |
| `docs/` | ADR, arbitrages, écarts, routes, journal de vague | mémoire externalisée |

Deux documents font autorité **au-dessus** du cadrage, et se lisent avant toute tâche :
`docs/arbitrages.md`, les décisions du commanditaire ; et `docs/errata-cadrage.md`, les affirmations
du cadrage révélées fausses. **Les sources gelées ne sont jamais corrigées** — les éditer détruirait
la propriété qui rend le dispositif opposable : l'immutabilité et la diffabilité du gel.

---

## Une note de méthode

Ce dépôt est le pilote d'une méthode de production assistée, documentée dans `règles/`. Elle repose
sur une hiérarchie simple : **bloquant > vérifiable > déclaratif**. Une règle qu'on énonce sans
pouvoir l'empêcher ni la détecter n'est pas une règle, c'est un espoir.

Trois choses en découlent, et elles se lisent partout dans l'historique :

- **La règle de non-comblement.** Un agent qui rencontre un vide — un comportement non spécifié, un
  état non maquetté — ne le comble pas : il s'arrête et le remonte. Toute décision prise en cours
  d'exécution est un défaut de contrat, jamais une initiative.
- **Celui qui écrit ne vérifie jamais.** Les mesures d'un lot sont rejouées ailleurs avant d'être
  crues.
- **Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle marche.** Plusieurs
  contrôles de ce dépôt ont été inertes pendant des semaines sans que rien ne le signale ; la parade
  est écrite dans les instruments, qui refusent de mesurer quand leur propre table n'est pas éprouvée.

`docs/ecarts/` en garde la trace, y compris — surtout — quand le défaut venait de l'orchestration :
un seuil posé faux, une clé de rapprochement qui fabriquait 31 défauts imaginaires, une sonde qui
mesurait avant que quiconque ait pu bouger. Ils sont numérotés et datés au même titre que les autres.
