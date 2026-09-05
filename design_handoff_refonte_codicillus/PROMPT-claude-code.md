# Prompt de démarrage pour Claude Code

Copier-coller dans Claude Code, à la racine du dépôt `codicillus`, après avoir dézippé ce dossier à la racine.

---

Tu travailles dans le dépôt Codicillus (SvelteKit). Lis dans cet ordre, en entier, sans rien coder :
1. `CLAUDE.md`
2. `design_handoff_refonte_codicillus/README.md`
3. `design_handoff_refonte_codicillus/SPEC-vivacite.md`
4. `design_handoff_refonte_codicillus/SPEC-modele-navigation.md`
5. `design_handoff_refonte_codicillus/BRIEF-UI-UX.md` (le brief d'origine, pour le pourquoi)

Le prototype `design_handoff_refonte_codicillus/Codicillus - Lecture de note.dc.html` s'ouvre dans un navigateur ; c'est la référence visuelle (haute fidélité) et `captures/` en sont les captures d'écran validées. Les images de `maquettes/` sont les maquettes d'intention antérieures ; en cas d'écart entre maquette et prototype/captures, le prototype gagne ; en cas d'écart entre prototype et README, le README gagne.

Règles :
- Tu recrées ces écrans dans le code existant (`src/socle.css`, `src/vues/V-xx.svelte` + `V-xx.css`, `src/lib/fraicheur.ts`, `src/lib/coquille/`, `src/lib/lecture/`). Tu ne copies pas le HTML du prototype. Tu ne crées pas de nouveau framework CSS ni de fichier de tokens parallèle.
- Vocabulaire à l'écran : Univers, Domaine, Dossier, Note, Registre (Référence / Opérationnel), Étiquette, **Vivacité**. Jamais tag, espace, document, fraîcheur (à l'écran), version opérationnelle.
- Une étape à la fois, dans l'ordre « Ordre de livraison conseillé » du README. Après chaque étape : `pnpm check` et `pnpm test:unit` à zéro, puis tu me montres ce qui a changé et tu attends ma validation avant l'étape suivante.
- Ne touche à aucun libellé visé par un `cablage.ts` sans me le signaler.
- Si une information manque, tu poses la question ; tu n'inventes pas.

Commence par me rendre, en 20 lignes maximum : ton plan pour l'étape 1 (jetons + composant glyphe de vivacité + fabrique 5 états avec tests), la liste des fichiers que tu vas modifier ou créer, et les points où tu as un doute.
