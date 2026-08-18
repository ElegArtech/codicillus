<script lang="ts">
	/**
	 * Banc de comparaison visuelle — le composant d'étalonnage `source=composant`.
	 *
	 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
	 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
	 * plus économique d'une vérification est de modifier la vérification.
	 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
	 *
	 * IL N'EST PAS UNE VUE, et il ne vit pas dans `src/vues/`. Il n'entre dans
	 * aucun graphe applicatif : seul le greffon `apply: 'serve'` du mode démo le
	 * charge, et seulement quand la source demandée est `composant`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CE QU'IL EXISTE POUR PROUVER — ÉCART-013 É-1
	 *
	 * `--source=etalon` sert la maquette gelée telle quelle : elle ne passe
	 * JAMAIS par `render()`. Le chemin étalonné n'était donc pas le chemin
	 * exercé, et tout composant rendait 500 sans que l'étalonnage ne le voie.
	 * La leçon est générale : un étalonnage sur candidat connu identique ne vaut
	 * que pour les portions de chemin qu'il emprunte réellement.
	 *
	 * Ce composant fait emprunter au corps de la maquette gelée exactement le
	 * chemin d'une vue implémentée — compilation Svelte, `ssrLoadModule`,
	 * `render()`, contrat de propriétés, mise en réponse — tout en restant, au
	 * rendu, un candidat CONNU IDENTIQUE à la référence. L'exigence est donc zéro
	 * pixel divergent, et tout écart est un défaut de plomberie.
	 *
	 * `{@html}` est ici le seul moyen d'être à la fois identique au gel et de
	 * traverser le compilateur. Le corps servi n'est pas construit par ce
	 * composant : il est LU dans `mockups/`, gelé, et `pnpm verif:gel` en garde
	 * l'intégrité. Ce n'est pas une porte d'entrée pour du balisage arbitraire —
	 * le mode démo ne lui passe rien d'autre que le corps du fichier gelé de la
	 * vue demandée.
	 */
	interface Proprietes {
		/**
		 * Le contrat de propriétés d'une vue du mode démo, à l'identique — clé
		 * d'état, vecteur, jeu de semence. Il est reçu et non employé : ce qui est
		 * étalonné ici est le CHEMIN, et une vue qui recevrait d'autres
		 * propriétés que celles-là ne serait pas servie par le même code.
		 */
		etat: string;
		vecteur: Record<string, string | boolean> | null;
		notes: readonly unknown[];
		/** Le corps de la maquette gelée de la vue, tel que `mockups/` le porte. */
		corps: string;
	}

	const { corps }: Proprietes = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- corps gelé, lu dans mockups/, gardé par `pnpm verif:gel` -->
{@html corps}
