<script lang="ts">
	/**
	 * Console — l'en-tête de section, `header.tete-section`.
	 *
	 * MOTIF COMMUN AUX DIX VUES DE CONSOLE : `tete-section` et
	 * `tete-section__corps` font partie des treize classes que le relevé
	 * mesure sur les dix (`docs/releve-vues.md` §8.2). La forme est la même
	 * partout — un titre, un paragraphe, et un élément d'action facultatif
	 * poussé à droite par `justify-content: space-between`.
	 *
	 * L'ACTION EST FACULTATIVE, ET C'EST UN FAIT DU GEL. Six vues y mettent le
	 * bouton `#creer` (V-27 à V-32), V-34 y met `<span class="etiq">30 derniers
	 * jours</span>`, et V-33, V-35, V-36 n'y mettent rien. Elle est donc reçue
	 * en fragment, jamais fabriquée ici.
	 *
	 * Aucune règle de style, aucun attribut `style` : ce composant ne vit pas
	 * sous `src/vues/` et n'a pas la dérogation P-6.4 (ARB-016).
	 */
	import type { Snippet } from 'svelte';

	interface Proprietes {
		/** Le titre de la section — `<h1>`, un seul par page. */
		titre: string;
		/** Ce que la section est, en une phrase. Le gel en écrit une par vue. */
		description: string;
		/** L'élément d'action, à droite de l'en-tête. Absent : rien. */
		action?: Snippet;
	}

	const { titre, description, action }: Proprietes = $props();
</script>

<header class="tete-section">
	<div class="tete-section__corps">
		<h1>{titre}</h1>
		<p>{description}</p>
	</div>
	{#if action}{@render action()}{/if}
</header>
