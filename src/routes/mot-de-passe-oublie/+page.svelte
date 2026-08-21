<script lang="ts">
	/**
	 * `/mot-de-passe-oublie` — V-06, étapes 1 et 2 (`docs/routes.md` §3.2).
	 *
	 * DEUX ROUTES, UN SEUL ÉCRAN : celle-ci et `…/{jeton}` rendent la même vue,
	 * à un vecteur près. Les deux vecteurs sont composés dans
	 * `$lib/donnees/profil`, à un seul endroit.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../vues/V-06.svelte';
	import '../../vues/V-06.css';
	import { cablerLaReinitialisation } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063`. La vue reste une
	 * transcription du gel. La racine est cherchée dans le document plutôt que
	 * liée par `bind:this` : la lier demanderait un nœud d'enveloppe que le gel
	 * ne porte pas.
	 */
	onMount(() => {
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLaReinitialisation(racine);
	});
</script>

<Vue vecteur={data.vecteur} portail={data.portail} />
