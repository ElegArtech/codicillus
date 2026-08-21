<script lang="ts">
	/**
	 * `/guides/{identifiant}` — V-03 Lecture publique d'un guide.
	 *
	 * Ce fichier ne fait que rendre la vue. La résolution — 200 ou 404, sur la
	 * note réellement demandée — est dans `+page.server.ts`, qui porte le
	 * périmètre public et le point de sortie unique du refus.
	 *
	 * `vecteur={null}` : les deux axes de la planche décrivent LA NOTE AFFICHÉE
	 * — fraîcheur du cartouche, présence du registre « En bref » —, et la note
	 * les porte désormais elle-même. Il ne reste rien à piloter par vecteur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3). Cette route ne rend
	 * qu'une vue : l'import direct suffit, et aucun croisement de feuille n'est à
	 * mesurer.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-03.svelte';
	import '../../../vues/V-03.css';
	import { cablerLeGuide } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063`. La vue reste une
	 * transcription du gel ; les quatre gestes de la lecture publique — sommaire
	 * replié, bascule de registre, agrandissement du schéma, impression — sont
	 * posés par `./cablage.ts` au montage, et retirés au démontage.
	 *
	 * LA RACINE EST CHERCHÉE DANS LE DOCUMENT, et non liée par `bind:this` : la
	 * lier demanderait un nœud d'enveloppe autour de la vue, donc une boîte de
	 * rendu de plus, ce que le gel ne porte pas.
	 */
	onMount(() => {
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLeGuide(racine);
	});
</script>

<Vue vecteur={data.vecteur} guide={data.guide} portail={data.portail} />
