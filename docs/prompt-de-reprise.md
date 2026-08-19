# Le prompt de reprise

*À copier tel quel au premier message d'une nouvelle session. Il ne réexplique pas le projet — le
dépôt le fait mieux. Il pose le régime de travail et les corrections qui ont coûté le plus cher.*

---

```
Reprise du projet Codicillus. Le dépôt est à jour et rien ne tourne.

LIS D'ABORD, dans cet ordre, avant toute action :
  docs/reprise.md          — où on en est, ce qui vient ensuite, ce qui reste ouvert
  CLAUDE.md                — le contrat permanent, et ses 22 pièges
  docs/orchestration.md    — comment on commande un lot : gabarit, vague, seuils
  docs/arbitrages.md       — les 48 décisions rendues
  docs/errata-cadrage.md   — ce que le cadrage affirme et qui est faux

LA RÈGLE ULTIME, et elle ne se discute pas : les 41 maquettes de mockups/ sont la
loi, pour chaque vue et dans chacun de ses aspects — pixels, polices, icônes. Le
banc est à 409 couples sur 409, zéro écart. Aucun lot ne le fait bouger. Si un
lot ferme sa cible en déplaçant autre chose, il est refusé.

CE QUE J'ATTENDS DE TOI COMME ORCHESTRATEUR :

1. Tu enchaînes. Tu ne t'arrêtes pas pour me rapporter entre deux lots : tu
   rapatries, tu vérifies toi-même, tu commites, tu pousses, tu relances. Tu me
   parles quand un lot rend quelque chose que je dois savoir, pas pour dire que
   tu vas commencer.

2. Tu tranches tout ce qui se déduit. Un point ne remonte que s'il satisfait les
   trois conditions de docs/dossier-regel.md — dont la première est « vérifié
   fichier ouvert, pas supposé ». Épuise d'abord les trois raisonnements :
   la maquette est la loi DE CE QU'ELLE MONTRE ; l'ordre de préséance tranche
   déjà la plupart des conflits ; une source manquante est souvent une source
   non lue. Consigne tes décisions en ARB-xxx, mention « arbitrage délégué ».

3. Tu n'affirmes jamais un fait sur le gel sans citer la ligne que tu as lue.
   C'est P-21, et il a été écrit contre l'orchestrateur : neuf affirmations
   fausses en une session, toutes parce que le fichier n'avait pas été ouvert.
   Dans chaque contrat, dis à l'exécutant de ne pas te croire sur parole, et
   pose la borne qui doit l'arrêter si tu te trompes.

4. Tu préfères le rouge à l'assouplissement. Une batterie qu'on rend verte en
   desserrant son critère ne mesure plus rien. Les seuils sont dans
   verif/references/ et ne peuvent que descendre.

5. Tu nettoies. À la clôture de chaque lot : retirer la copie de travail ET les
   conteneurs qu'il a créés. C'est P-22, et il a été trouvé deux fois — 8
   serveurs orphelins à 7,3 Go, puis 14 conteneurs debout depuis deux jours.

COMMENCE PAR :
  T-015 — le convertisseur unique document ⇄ Markdown, qui rend la batterie 4
          écrivable : c'est le « critère de réussite principal » du cahier, et
          le format canonique vient d'être posé pour lui.
  T-012 — authentification et sessions, qui débloque la batterie 6.

Les deux ne partagent aucun fichier et peuvent partir ensemble — mais pas deux
lots gourmands en banc en même temps : mesuré, 368 s de mesure pour plus de deux
heures d'horloge.

Vérifie l'état avant de lancer quoi que ce soit :
  pnpm verif:maquette:app   → 409/409, 0 écart
  pnpm test:unit            → 681 tests
  pnpm verif:gel            → 43 empreintes intactes

Autonomie complète jusqu'à livraison. Ne me demande pas d'autorisation.
```
