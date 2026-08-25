<script lang="ts">
	/**
	 * `/mot-de-passe-oublie` — V-06 (`docs/routes.md` §3.2).
	 *
	 * DEUX ROUTES, UN SEUL ÉCRAN : celle-ci et `…/{jeton}` rendent la même vue,
	 * et désormais dans le même état — le produit n'ayant aucun expéditeur de
	 * courriel, il n'y a rien à distinguer entre les deux adresses.
	 *
	 * AUCUN CÂBLAGE : la vue ne porte plus ni formulaire, ni bouton de reprise,
	 * ni champ de mot de passe à révéler. Le module de câblage de cette route a
	 * été retiré avec eux.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../vues/V-06.svelte';
	import '../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue portail={data.portail} />
