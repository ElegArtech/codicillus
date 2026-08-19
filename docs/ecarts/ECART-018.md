# ÉCART-018 — T-101c, et un défaut d'orchestrateur — 19 août 2026

Le second amendement du gabarit est livré, prouvé sans régression, et **regelé**.

## É-1 — `pnpm test:unit` était rouge sur tout le dépôt depuis `ffa0f77`. **Mon défaut.**

En resserrant le seuil par ARB-018, j'ai modifié `verif/references/tolerances.json`
(`conforme_au_plus : 0,005 → 0`) **sans mettre à jour les deux assertions de
`verif/banc/banc.test.ts`** qui codaient l'ancien seuil. La batterie 3 était donc rouge sur
l'ensemble du dépôt, et je ne l'avais pas vu : je n'avais rejoué que `verif:maquette`.

**Ce que l'exécutant a fait, et qui est le bon geste.** Il a diagnostiqué, **prouvé par `git stash`**
que les deux échecs préexistaient à son lot, et **refusé de corriger** — parce que le correctif
tombe dans `verif/**`. Il a préféré déclarer son critère de sortie « non tenu, pour une cause
antérieure à mon lot » plutôt qu'ajuster la vérification.

Un agent qui touche à l'instrument pour verdir sa propre tâche fabrique son verdict. Il l'a refusé
alors que le correctif tenait en une ligne et que personne ne l'aurait su.

Corrigé par l'orchestrateur : les assertions codent désormais zéro, et une assertion **nouvelle**
vérifie qu'**un seul pixel** ne passe plus en conforme — la propriété qu'ARB-018 introduit.
162 tests verts.

**Leçon d'orchestration** : resserrer un critère, c'est modifier l'instrument. Il faut rejouer
**toutes** les batteries, pas seulement celle qu'on croit toucher. Je n'ai rejoué que
`verif:maquette`.

## É-2 — Mon tableau classait V-41 à tort. **Troisième occurrence.**

Le mandat de T-101c plaçait V-41 parmi les douze vues dont la cible du lien d'évitement diffère de
`<main>`. **C'est faux** : `#corps` **est** l'identifiant de son propre
`<main class="corps-b" id="corps">`. La ligne était vraie comme *valeur* et fausse comme *besoin* —
`idContenu`, déjà ouvert par ARB-015, la sert.

L'exécutant a recompté, implémenté d'après son relevé, et **écrit le fait dans la documentation de
la propriété** pour que T-103 ne pose pas une propriété inutile.

Deux autres corrections : « V-12, V-21, V-22 → Aller à la liste » mélangeait trois libellés, V-21
disant « Aller à l'**arborescence** » ; et les libellés exacts portent une ligature (« nœuds ») et
une apostrophe droite.

**C'est la troisième fois qu'un décompte que je transmets se révèle inexact au recomptage** —
`ECART-010` É-3, `ECART-016` É-1, et celui-ci. La règle est désormais établie et vaut pour moi :
**un chiffre cité dans un arbitrage n'est pas une source.** Tout contrat le transmettant doit
exiger sa vérification, et les trois exécutants concernés l'ont faite sans qu'on la leur demande.

## É-3 — Pourquoi deux propriétés et non une

Cible et libellé varient **ensemble partout sauf trois fois** : V-14 et V-15 (cible propre,
libellé par défaut) et V-41 (cible par défaut, libellé propre). Ces trois exceptions interdisent
une propriété unique. ARB-019 disait « deux propriétés » sans dire pourquoi ; la raison est
mesurée, pas conventionnelle.

## Une preuve de non-régression meilleure que la précédente

Les 45 états des quatre vues aspirés avant et après : **45 identiques, 0 divergent**, octet par
octet. Le premier amendement en donnait 34 sur 45 avec 11 divergences attendues ; celui-ci ne
déplace rien.

Et l'exécutant a fait ce qu'aucun contrat ne demandait : **un contrôle positif réversible**. Un vert
de non-régression peut venir d'un module non rechargé — il a donc basculé temporairement les
défauts sur `ancre-sonde` / `Libellé sonde`, vérifié que les deux propriétés atteignent réellement
le DOM servi, puis rétabli et re-prouvé l'identité. Sans ce contrôle, « 45/45 identiques » aurait
pu ne rien prouver du tout.

## Pour la batterie 10, à ne pas perdre

Dans le gel, **aucune cible de lien d'évitement ne porte `tabindex="-1"`** — ni les douze ancres
intérieures, ni `<main>`. Le déplacement réel du focus n'est donc effectif que pour V-23 et V-26,
dont la cible est un `<input>`.

C'est uniforme au gel, ce n'est pas introduit par l'amendement, et `verif:maquette` **restera vert
là-dessus** : c'est un cas d'école de « ce qu'un vert ne dit jamais ». À reprendre par la
batterie 10 (accessibilité), et à ne pas déclarer tenu d'ici là.

## É-4 — Les lots parallèles partagent toujours le même arbre

`verif/inventaire-composants.mjs` de T-009b est apparu pendant l'exécution, et deux serveurs de
développement voisins tournaient. `git status` n'est pas une frontière d'isolement.

Quatrième symptôme. Les worktrees sont déjà décidés pour la vague suivante (`ECART-017` É-8) ; ce
lot confirme qu'ils ne sont plus reportables.
