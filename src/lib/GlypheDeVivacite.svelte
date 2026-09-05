<script lang="ts">
	/**
	 * LE GLYPHE DE VIVACITÉ — un seul composant, partout.
	 *
	 * Ligne compacte de la note, colonne contexte, rail, listes de l'accueil,
	 * compteurs d'un univers, fil de l'historique, planche des états : c'est ce
	 * composant, et lui seul. Recopier son balisage ailleurs est le geste qui
	 * fait diverger deux écrans à six mois d'intervalle.
	 *
	 * IL NE PARAÎT JAMAIS SEUL. La couleur ne porte pas l'information à elle
	 * seule (RG-M18-09) : l'appelant rend le libellé de l'état à côté, et
	 * l'information temporelle avec. Le glyphe est donc masqué aux lecteurs
	 * d'écran — ils lisent le texte, qui dit tout.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002). La teinte vient de
	 * la classe d'état posée par la fabrique, définie dans le socle ; le trait
	 * et le remplissage sont en `currentColor`.
	 */
	import { ETATS_DE_VIVACITE, type EtatDeVivacite } from './fraicheur';

	interface Proprietes {
		/** L'état à rendre. REQUISE : un glyphe par défaut mentirait en silence. */
		etat: EtatDeVivacite;
		/**
		 * Le côté du carré, en pixels. Le prototype va de 10 px (compteur dense)
		 * à 18 px (pastille d'alerte) ; 16 est la taille de la ligne de vivacité.
		 */
		taille?: number;
	}

	const { etat, taille = 16 }: Proprietes = $props();

	const description = $derived(ETATS_DE_VIVACITE[etat]);

	/**
	 * L'anneau s'épaissit quand le glyphe rapetisse : à 10 px, un trait de 1,5
	 * s'efface. Les trois paliers sont ceux du prototype.
	 */
	const epaisseur = $derived(taille >= 16 ? 1.5 : taille >= 12 ? 1.8 : 2);
</script>

<svg
	class="glyphe {description.classe}"
	width={taille}
	height={taille}
	viewBox="0 0 16 16"
	aria-hidden="true"
>
	<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width={epaisseur} />
	{#if description.glyphe}
		<path d={description.glyphe} fill="currentColor" />
	{/if}
</svg>
