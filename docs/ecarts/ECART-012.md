# ÉCART-012 — Résidu de T-007b, onze points — 18 août 2026

Le lot est livré et vérifié indépendamment par l'orchestrateur : régime `app` étalonné à zéro
pixel divergent, mode démo absent du build de production, mutation P-6.3 confirmée, à-blanc des
41 vues toujours vert (409 couples). Onze points remontés, tous tranchés ici.

## Ce que l'étalonnage a trouvé — et qui justifie à lui seul le lot

Le contrat exigeait de prouver le chemin `app` sur un **candidat connu identique**, faute
d'implémentation à mesurer. Ce contrôle a révélé un **vrai défaut de plomberie** : en appliquant le
vecteur d'état au chargement (t=0) plutôt qu'à l'instant où la référence règle sa planche
(t=`AVANCE_CHARGEMENT_MS`), **12 états sur 333 divergeaient** — dialogues de suppression de V-27,
V-29, V-30, V-31, les étapes 3 et 4 de V-06, plus V-17, V-19, V-24 et V-32.

**Sans cet étalonnage, ces douze écarts auraient été imputés à la première implémentation.** Un
implémenteur aurait cherché pendant des heures un défaut dans son code, là où le défaut était dans
l'instrument. C'est exactement ce qu'un étalonnage sert à empêcher, et c'est la raison pour
laquelle il ne se saute pas.

## Points tranchés

**1. Le mode démo est un greffon Vite `apply: 'serve'`, non une route SvelteKit — retenu.**
Motif de l'exécutant, et il est meilleur que ce que le contrat demandait : une route gardée par
`if (dev)` **existe** dans le build de production, et la garde est une convention révocable d'une
ligne. Un greffon en `apply: 'serve'` n'est pas compilé du tout. Prouvé mécaniquement par
`pnpm verif:demo:hors-production` : 89 fichiers inspectés, quatre adresses en 404. Corollaire
cohérent : le mode démo vit dans `verif/`, donc dans l'instrument, jamais dans le produit.

**2. `?etat=` et non `?state=` — retenu.** Divergence assumée avec la lettre de
`règles/workflow_agentic.md` annexe F, par cohérence avec les clés françaises des scénarios et le
vocabulaire contractuel (P-07). L'annexe décrit un protocole, pas une syntaxe.

**3. P-6.3 lève P-1, P-4.2 *et* P-6.2 dans le bloc vérifié — validé.**
Le contrat ne nommait que P-1 ; sans les deux autres, les 94 constats d'`ECART-011` n'auraient pas
été résolus. La justification vaut identiquement pour les trois : *« identique au gel » implique et
dépasse toute règle sur le contenu du bloc*. Ce qui compte est que l'exemption soit **strictement
bornée au bloc vérifié à l'octet** — vérifié par mutation : un octet dévie, et P-6.3 tire **plus
les 92 constats P-1 qui reviennent tous**. Il n'existe aucune fenêtre par laquelle glisser du CSS
modifié sous couvert d'exemption.

**4. Le relevé réel était 92 P-1, pas 94.** Les deux P-6.2 d'`ECART-011` étaient exactement le faux
positif `@keyframes` d'É-3. Corrigé, unitaire à l'appui.

**5. Ré-étalonnage de `verif/references/empreintes.json` — légitime.**
Ce que le banc **lit** a changé : retrait de `section.regles`, zones comparées, signature portant
le nom de zone. Ce que la maquette **montre** n'a pas bougé — `verif:gel` reste vert sur les 43
fichiers. La distinction est celle qui autorise le geste : on ré-étalonne l'instrument, jamais la
référence. Geste d'orchestrateur, tracé dans le bandeau du fichier.

**6. Le régime `app` n'a pas de protocole pour les états de zone.** V-09, V-35, V-38 à V-41 —
55 états côte à côte. Le banc **refuse en code 2** en citant `protocole-app.json`, plutôt que de
sortir en vert. À trancher au lot qui portera ces vues (T-102, T-103, T-106). Le comportement
actuel est le bon : un refus explicite vaut mieux qu'un vert muet.

**7. La surface comparée de V-37 est mince, et il faut le savoir.** Conséquence combinée d'ARB-010
et ARB-012 : `aside.rail` n'est pas rendu sous 1240 px ni à `rail-ferme`, donc sur trois fenêtres
sur quatre, seul `header.barre` est comparé. Le banc traite la non-restitution comme un fait
comparable — échec sec si un seul côté la rend —, mais **« 32 couples conformes » sur V-37 ne
prouve pas 32 rendus distincts**. `--zones=page` reste disponible et sort à 0 lui aussi.

**8. `pnpm verify` compte 19 maillons, hors catalogue des 18 batteries.** `verif:demo:hors-production`
n'est pas une batterie du `PLAN §5` : c'est un contrôle d'intégrité du harnais, de la même famille
que `verif:gel`. **Retenu comme tel**, et à régulariser au catalogue plutôt qu'à retirer — un
contrôle qui prouve qu'un mode de démonstration ne fuit pas en production n'a pas à disparaître
pour une question de numérotation.

**9. L'à-blanc fait 409 couples, non 364.** Le contrat citait un chiffre antérieur à ARB-009, qui a
porté V-01 et V-37 à quatre fenêtres. Correction de fait.

**10. `CLAUDE.md` §4 ne cite pas les quatre commandes nouvelles** — `verif:maquette:app`,
`verif:maquette:app:etalon`, `verif:demo:hors-production`, `vues:feuille`. Ajout d'orchestrateur,
fait avec le présent écart.

**11. `ECART-011` É-4 reste ouvert** — 36 classes de V-37 absentes de l'inventaire fermé. Hors
périmètre de ce lot, conditionné au complètement de `docs/DESIGN.md` §2 par relevé systématique des
41 maquettes. Déjà condition de clôture de la phase 1 (`ECART-008 c`). **Non bloquant pour
T-101** : ces classes existent dans la maquette gelée, elles ne sont pas inventées.
