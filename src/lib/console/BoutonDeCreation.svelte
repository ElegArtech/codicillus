<script lang="ts">
	/**
	 * Console — le bouton de création de l'en-tête de section.
	 *
	 * MOTIF DES SIX REGISTRES, PAS DU MOTIF COMMUN DES DIX. La distinction est
	 * mesurée : `.btn` et `.btn--principal` sont du socle, et le bouton
	 * `#creer` n'apparaît que dans V-27 à V-32 — les six vues à panneau de
	 * formulaire (`docs/releve-vues.md` §8.2). V-33 à V-36 n'en ont pas.
	 *
	 * Seul le LIBELLÉ change d'une vue à l'autre : « Nouvel univers » (V-27),
	 * « Nouveau domaine » (V-28), « Nouveau type » (V-29, V-30), « Nouveau
	 * template » (V-31), « Nouveau compte » (V-32). Le pictogramme et
	 * l'identifiant sont identiques au caractère près dans les six.
	 *
	 * Aucun comportement : le gel y attache `ouvrirForm(null)`, qui est du
	 * temps 3 (ARB-011).
	 */
	interface Proprietes {
		/** Le libellé, propre à chaque vue. */
		libelle: string;
	}

	const { libelle }: Proprietes = $props();
</script>

<button class="btn btn--principal" id="creer">
	<svg
		width="14"
		height="14"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
	>
	{libelle}
</button>
