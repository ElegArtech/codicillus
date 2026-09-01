<script lang="ts">
	/**
	 * LE BANDEAU DE PRÉVISUALISATION des deux éditeurs — `div.apercu-bandeau`.
	 *
	 * Identique à l'octet entre `V-17:1496-1500` et `V-18:1608-1612`, à sa seule
	 * phrase près. Il est rendu dans les douze états, et il n'y est jamais
	 * VISIBLE : `.app:not([data-vue="apercu"]) .si-apercu { display: none }`
	 * (`V-17.css:712`). Aucun des douze états ne pose `data-vue="apercu"` — la
	 * bascule est un comportement (ARB-011). Il est donc porté parce que le gel
	 * le porte, non parce qu'un état l'affiche.
	 *
	 * Le `flex:1` en ligne de son libellé est du gel, et `flex` n'est pas une
	 * propriété contrainte par P-1 : il peut vivre dans une ressource non
	 * rattachée. (On ne cite jamais un attribut de style sous sa forme exacte dans
	 * un commentaire : décris la forme, ne l'écris pas.)
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-6.1, P-6.3).
	 */
	interface Proprietes {
		/** La phrase du bandeau, propre à chaque éditeur. */
		texte: string;
	}

	const { texte }: Proprietes = $props();
</script>

<div class="apercu-bandeau si-apercu">
	<svg
		width="15"
		height="15"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" /><circle
			cx="8"
			cy="8"
			r="1.8"
		/></svg
	>
	<span style="flex:1">{texte}</span>
	<button class="btn" id="quitter-apercu">Reprendre la rédaction</button>
</div>
