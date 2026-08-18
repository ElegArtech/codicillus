# ÉCART-008 — Résidu de T-004, cinq points tranchés — 18 août 2026

Consolidation des cinq écarts remontés par l'exécutant de T-004, avec leur résolution.
Aucun n'appelait d'arbitrage du commanditaire : tous se tranchent par cohérence ou relèvent du
harnais.

## a) `docs/DESIGN.md` §0.2 désignait V-41, l'errata désigne V-07 — **corrigé**

Les deux blocs sont identiques au saut de ligne final près : 19 622 octets pour V-41, non terminé
par un saut de ligne, contre 19 623 pour V-07. L'enjeu est nul au rendu, réel pour un contrôle à
l'octet — et P-6.1 compare précisément à l'octet.

**V-07 est retenu partout** : c'est le gel le plus récent et le sur-ensemble strict. `DESIGN.md`
§0.2 est aligné, avec la note de traçabilité.

## b) La clôture des huit valeurs littérales ne valait plus — **réénuméré**

`DESIGN.md` §5 P-1.8 recensait huit valeurs de couleur en dur hors `:root`, « pour qu'aucune
neuvième n'apparaisse ». Ce recensement portait sur `mockups/socle.css`, qui n'est plus la source.
Sur le socle retenu il y a **27 occurrences pour 20 valeurs distinctes**.

Les douze valeurs supplémentaires appartiennent **toutes au composant de notification**, absent du
socle abandonné — c'est la même refonte que celle décrite en `ECART-007`, qui explique à la fois
les 23 classes manquantes et ces douze littéraux.

Le second tableau de P-1.8 fait désormais foi. **Mais ce n'est pas lui qui contraint** : la
contrainte réelle est P-6.1, qui compare `src/socle.css` à l'octet au bloc gelé. Aucune
vingt-et-unième valeur ne peut apparaître sans faire rougir la batterie, indépendamment de toute
énumération. La liste sert la lecture humaine, pas le verrou.

## c) Cinq sous-contrôles de `verif:jetons` non outillés — **T-004 est clos malgré tout**

`pnpm verif:jetons` outille P-1.1 à P-1.7 et son exception d'épaisseur de trait, P-3.1, P-3.2,
P-4.1, P-4.2, P-6.1, P-6.2, et RG-NF-08. Restent non outillés : **P-2** et **P-4.3** (croisement
sélecteur ↔ jeton — demandent l'inventaire fermé extrait en liste exploitable), **P-5** (assigné à
T-009 par ADR-002), **P-7** et **P-8** (portent sur le balisage de composants).

**Décision : T-004 est clos.** Trois raisons :

1. Aucun de ces contrôles ne laisse passer un défaut **aujourd'hui** : P-7 et P-8 portent sur des
   vues, et aucune vue n'existe. P-2, P-4.3 et P-5 portent sur l'emploi des jetons et des
   composants dans des vues qui n'existent pas davantage.
2. Le script **les énonce à chaque exécution** plutôt que de les taire. Une batterie qui sort en 0
   en annonçant ce qu'elle ne couvre pas est honnête ; une batterie qui sort en 0 en silence est
   un faux témoin — c'est RA-01.
3. L'exécutant a eu raison de ne pas inventer P-8.1 (« contrôle inactif pour cause de droits ») :
   ce n'est pas décidable mécaniquement sans le contexte des droits, et un contrôle qui
   signalerait tout `disabled` produirait des faux positifs, donc finirait désactivé.

**Report tracé, non facultatif.** Ces cinq sous-contrôles sont une condition de clôture de la
**phase 1**, pas de T-004 : aucune vague de vues ne se clôt sans qu'ils soient opérants. À défaut,
la conformité des vues reposerait sur la seule comparaison de rendu, qui ne voit pas l'emploi d'un
jeton hors de son rôle.

## d) `ADR-002` portait encore la prémisse invalidée — **amendé**

Son titre affirmait que `socle.css` est la source unique et son corps annonçait 61 jetons. Un ADR
dont le titre contredit l'errata est un piège pour le prochain agent qui le lira seul — et les ADR
sont précisément faits pour être lus seuls.

**Amendé, non *superseded*.** La décision n'a pas changé : source unique, jetons nommés,
inventaire fermé, aucune classe utilitaire, aucune bibliothèque de composants. Seul l'objet
désigné change. Il n'y a pas eu de changement de décision, il y a eu une erreur de fait dans le
cadrage, corrigée. Trois interdits sont ajoutés : employer `mockups/socle.css` comme source,
éditer `src/socle.css` à la main, modifier un fichier de `mockups/`.

## e) `mockups/GEL.md` ne porte pas d'empreinte du bloc extrait — **non ajouté, par principe**

L'empreinte du socle retenu est :

```
c162702565e9804279764109fbc17f918db1ac6a8a4e9bafc85cc64c70feaaa7   19 623 o   466 lignes   70 jetons
```

Elle **n'est pas** ajoutée à `mockups/GEL.md`. Motif : `mockups/` est en écriture humaine
seulement, et y écrire pour la commodité d'une citation reviendrait à lever le verrou pour une
raison de confort — exactement le raisonnement par lequel un verrou finit par ne plus tenir.

La couverture existe déjà, indirectement mais complètement : `pnpm verif:gel` contrôle
`V-07-accueil-contributeur.html` dans son ensemble, et `verif/extraire-socle.mjs` refuse
d'extraire si cette empreinte diverge. Un socle altéré est donc détecté deux fois. L'empreinte du
bloc est citable depuis ce document, qui est versionné et daté.
