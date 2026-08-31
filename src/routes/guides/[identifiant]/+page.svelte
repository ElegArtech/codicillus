<script lang="ts">
	/**
	 * `/guides/{identifiant}` — V-03 Lecture publique d'un guide. La résolution —
	 * 200 ou 404, sur la note réellement demandée — est dans `+page.server.ts`, qui
	 * porte le périmètre public et le point de sortie unique du refus.
	 *
	 * LA VUE N'A PLUS DE `vecteur` : ses deux axes décrivaient LA NOTE AFFICHÉE —
	 * fraîcheur du cartouche, présence du registre « En bref » —, et la note les
	 * porte elle-même.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-03.svelte';
	import '../../../vues/V-03.css';
	import { cablerLeGuide } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063`. Les quatre gestes de la
	 * lecture publique sont posés par `./cablage.ts` au montage, et retirés au
	 * démontage.
	 *
	 * LA RACINE EST CHERCHÉE DANS LE DOCUMENT, et non liée par `bind:this` : la lier
	 * demanderait un nœud d'enveloppe autour de la vue, donc une boîte de rendu de
	 * plus, ce que le gel ne porte pas.
	 */
	onMount(() => {
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLeGuide(racine);
	});
</script>

<Vue guide={data.guide} portail={data.portail} />
