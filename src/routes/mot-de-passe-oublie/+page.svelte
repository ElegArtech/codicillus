<script lang="ts">
	/**
	 * `/mot-de-passe-oublie` — V-06.
	 *
	 * DEUX ROUTES, UN SEUL ÉCRAN : celle-ci et `…/{jeton}` rendent la même vue, dans
	 * le même état — le produit n'ayant aucun expéditeur de courriel, il n'y a rien à
	 * distinguer entre les deux adresses.
	 *
	 * AUCUN CÂBLAGE : la vue ne porte plus ni formulaire, ni bouton de reprise, ni
	 * champ de mot de passe à révéler.
	 */
	import Vue from '../../vues/V-06.svelte';
	import '../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue portail={data.portail} />
