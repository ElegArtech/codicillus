<script lang="ts">
	/**
	 * LE BOUTON « + » DE LA TÊTE DE SECTION — celui que les dix consoles portent,
	 * et qui n'ouvrait rien.
	 *
	 * `#creer` EST LE DÉCLENCHEUR DU PANNEAU AU GEL, sur les dix écrans sans
	 * exception : « document.getElementById("creer").addEventListener("click",
	 * function () { ouvrirForm(null); }) » (`V-27:3471`, `V-28:3149`,
	 * `V-29:3379`, `V-30:3065`). Sans lui, aucun univers, aucun domaine, aucun
	 * type ne pouvait naître dans le produit.
	 *
	 * LE COMPORTEMENT N'EST PAS DÉCIDÉ ICI. Ce composant ne connaît ni panneau, ni
	 * état, ni route : il rend le clic à la vue qui l'emploie, laquelle tient
	 * l'état de son propre panneau — c'est le partage déjà établi pour les
	 * dialogues de suppression.
	 *
	 * `onCliquer` ABSENT LAISSE LE BOUTON INERTE, et c'est ce que le mode de
	 * conception obtient : le gel rendu tel quel, sans un attribut de plus.
	 */
	interface Proprietes {
		libelle: string;
		onCliquer?: () => void;
	}

	const { libelle, onCliquer }: Proprietes = $props();
</script>

<button class="btn btn--principal" id="creer" onclick={onCliquer}>
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
