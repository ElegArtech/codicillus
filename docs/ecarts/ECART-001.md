# ÉCART-001 — Vague 0 / harnais — 18 août 2026

- **Nature** : `PLAN-DE-REALISATION.md` §3.1 et §3.5 nomment `guide/` le dossier de la note de méthode, et posent les règles de refus d'écriture sur `Edit(guide/**)` / `Write(guide/**)`. Le dossier s'appelle en réalité **`règles/`**. Les règles de refus telles qu'écrites au plan n'auraient protégé aucun fichier existant.
- **Cause** : incohérence référence ↔ dépôt.
- **Alternative appliquée** : `.claude/settings.json` refuse `Edit(règles/**)` et `Write(règles/**)`. Le dossier n'est pas renommé — renommer une source de vérité relève de l'arbitrage, pas d'une session d'exécution.
- **Arbitrage attendu** : renommer `règles/` en `guide/` pour aligner le dépôt sur le plan, ou corriger le plan. Sans effet fonctionnel dans les deux cas.
- **Trace** : commit `ecd8951`.
