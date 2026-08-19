<script lang="ts">
	/**
	 * LA ZONE DE RÉDACTION ET SA PRÉVISUALISATION — les deux `div.prose` que V-17
	 * et V-18 rendent l'un derrière l'autre, en fin de colonne de rédaction.
	 *
	 * Mêmes classes, mêmes rôles, mêmes attributs (`V-17:1583-1590`,
	 * `V-18:1701-1705`) ; seuls varient le nom accessible, l'invite d'amorçage et
	 * le contenu :
	 *
	 *   V-17  « Corps de la note »              · vide aux six états sauf `cas-modif`
	 *   V-18  « Corps du registre Opérationnel » · le corps opérationnel de la note,
	 *          sauf `cas-vierge`
	 *
	 * `data-vide` N'EST PAS UN CHOIX DE LA VUE : le gel le calcule
	 * (`majVide()`, `V-17:3030` ; `V-18:3053`) — « oui » quand le corps ne porte ni texte ni
	 * image, table, préformaté ou filet. Il commande le seul rendu visible du
	 * vide, `.redaction[data-vide="oui"]::before` (`V-17.css:517`), qui écrit
	 * l'invite. Il est donc DÉDUIT de la présence d'un corps, pas déclaré.
	 *
	 * `#apercu` reste VIDE aux douze états : il n'est rempli que par le clic sur
	 * « Prévisualiser », qui est un comportement (ARB-011). Il est masqué par
	 * `.app:not([data-vue="apercu"]) .si-apercu` dans les douze.
	 *
	 * AUCUN STYLE EN LIGNE ICI, donc aucune question de rattachement (ARB-016,
	 * ARB-022). AUCUNE RÈGLE DE STYLE non plus (P-6.1, P-6.3).
	 */
	import type { Snippet } from 'svelte';

	interface Proprietes {
		/** Le nom accessible de la zone — `aria-label` du gel. */
		libelle: string;
		/** L'invite d'amorçage, rendue par la feuille quand la zone est vide. */
		invite: string;
		/** Le corps rédigé. Absent, la zone est vide et se signale telle. */
		corps?: Snippet;
	}

	const { libelle, invite, corps }: Proprietes = $props();
</script>

<div
	class="prose redaction si-redaction"
	id="redaction"
	contenteditable="true"
	spellcheck="true"
	role="textbox"
	aria-multiline="true"
	aria-label={libelle}
	data-invite={invite}
	data-vide={corps ? 'non' : 'oui'}
>
	{#if corps}{@render corps()}{/if}
</div>

<div class="prose si-apercu" id="apercu"></div>
