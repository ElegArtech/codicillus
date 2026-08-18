# ÉCART-004 — Harnais / intégrité des sources de vérité — 18 août 2026

**Gravité : haute.** Porte sur le garde-fou dont dépend toute la méthode.

- **Nature.** Les règles de refus prescrites par `PLAN-DE-REALISATION.md` §3.5 et annexe D —
  `Edit(cadrage/**)`, `Write(cadrage/**)`, `Edit(mockups/**)`, `Write(mockups/**)`, etc. — ne
  s'appliquent **qu'aux outils Edit et Write**. Elles ne couvrent pas l'outil Bash.

  Vérifié par sonde le 18/08/2026 : `echo "test" > mockups/__sonde.txt` a réussi sans le moindre
  refus, dépôt configuré selon l'annexe D. Les agents d'exécution disposent tous de Bash, et le
  mode `bypassPermissions` retenu par D-02 les invite explicitement à éditer par `sed`, `tee` et
  redirection.

  Conséquence : la protection que §7.8 du plan présente comme « ce qui rend l'autonomie complète
  tenable » — *« un agent en autonomie complète ne peut pas modifier la référence qui l'accepte »* —
  était **fausse en pratique**. Le garde-fou se croyait bloquant ; il était déclaratif.

  C'est très exactement le mode de défaillance nommé en §12, RA-06 du guide et en §6 de
  `règles/workflow_agentic.md` : *« le contournement le plus économique d'une vérification est de
  modifier la vérification »*.

- **Cause.** Modèle mental erroné sur la portée des règles de permission : elles filtrent par outil,
  pas par chemin du système de fichiers.

- **Correctif appliqué — couche bloquante réelle.**
  `chmod -R a-w cadrage mockups règles`. Cinq sondes rejouées, toutes refusées :
  redirection, `sed -i`, `tee`, `rm`, écriture dans `cadrage/`. Les règles de refus de
  `.claude/settings.json` sont conservées : elles restent la première couche, et donnent un
  message d'erreur intelligible avant que le système de fichiers ne rende son refus brut.

  La propriété visée est celle du gel : **écriture humaine seulement**. Le commanditaire, seul
  propriétaire des fichiers, peut lever le bit d'écriture d'un geste délibéré et visible ; aucune
  session d'exécution ne le fera par inadvertance.

- **Correctif complémentaire.** `verif/gel.mjs` (`pnpm verif:gel`) recalcule les 43 empreintes
  SHA-256 de `mockups/GEL.md` et sort en 1 à la première divergence. Le verrou empêche ; le
  contrôle détecte. Les deux, parce qu'aucune couche n'est fiable seule.

- **Portée méthodologique.** Cet écart ne concerne pas seulement Codicillus : il invalide la
  configuration de référence de l'annexe D du plan et, en amont, la mise en œuvre suggérée en
  §5 de `règles/workflow_agentic.md` (« hook refusant l'écriture sur ces chemins »). À remonter
  au guide comme correction de méthode — c'est une contribution du pilote.

- **Arbitrage attendu** : aucun pour le correctif, qui ne fait que rendre vraie une propriété déjà
  décidée. Mise à jour du plan et du guide à valider.
