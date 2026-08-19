# ÉCART-037 — Le verrou manquait à toutes les copies de travail — 19 août 2026

**Gravité : haute. Défaut d'orchestrateur, resté ouvert une vingtaine de lots.**

## Le fait

`git worktree add` recrée les fichiers avec les permissions normales : **le `chmod a-w` posé sur
l'arbre principal ne se propage pas.** `verif/preparer-copie.sh` ne le reposait pas.

Vérifié par sonde : dans une copie fraîche, `mockups/` était en `775`, et une écriture y **réussissait**.

**Toutes les copies de travail créées depuis ce script ont donc eu `cadrage/`, `mockups/` et
`règles/` en écriture** — une vingtaine de lots, dont les vingt-neuf qui ont porté les vues.

## Ce que cela signifie, sans l'adoucir

`ECART-004` avait relevé que les règles de refus par outil ne couvrent pas Bash, et posé la
protection au système de fichiers — la seule couche **bloquante**. `CLAUDE.md` l'affirme en tête de
document, et chaque contrat de lot le répète : *« les sources sont en lecture seule,
mécaniquement »*.

**C'était faux dans les copies.** La protection y était redevenue **déclarative** — exactement la
faute qu'`ECART-004` avait nommée, et que je croyais close depuis.

## Ce qui limite les dégâts, et ce qui ne les excuse pas

**Aucun lot n'a écrit.** `pnpm verif:gel` est resté vert à chaque clôture — 43 empreintes intactes,
vérifié encore à l'instant. Le contrôle de détection a fait son travail là où le verrou d'empêchement
était absent.

Mais c'est précisément l'argument que le dépôt refuse ailleurs : **un dispositif qui repose sur le
fait que personne n'a essayé n'est pas un dispositif.** Les agents se sont conformés à une consigne
qu'aucun mécanisme ne tenait.

## Comment il a été trouvé

**Par un exécutant qui a sondé l'écriture au lieu de croire le document.** Il n'y était pas obligé :
son lot portait sur la fraîcheur. Il a testé la propriété que son contrat lui affirmait, l'a trouvée
fausse, a retiré ses fichiers de sonde, **posé le verrou lui-même dans sa copie**, re-sondé, et
revérifié le gel — puis déclaré que le correctif appartenait au script, pas à lui.

## Correctif

`verif/preparer-copie.sh` pose désormais `chmod -R a-w` sur `cadrage/`, `mockups/`, `règles/` **et
`verif/references/`** — cette dernière étant la baseline de l'instrument, en écriture humaine seule
au même titre.

**Éprouvé sur les quatre chemins** : écriture par redirection refusée sur les quatre, `sed -i` refusé
sur le socle. La copie de sonde a été nettoyée.

## La leçon, et elle vaut au-delà de ce cas

`ECART-025` avait posé : *une règle qu'aucun cas n'exerce est une règle dont on ignore si elle
marche*. Celle-ci en est le cas symétrique et pire : **une règle qu'on croit exercée parce qu'elle
l'est ailleurs.** Le verrou fonctionnait dans l'arbre principal, il était vérifié, documenté, cité —
et absent là où tout le travail se faisait.

**Toute protection doit être éprouvée dans le contexte où elle s'applique**, pas dans celui où elle
a été posée.
