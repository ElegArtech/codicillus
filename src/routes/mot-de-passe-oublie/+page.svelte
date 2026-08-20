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
	import Vue from '../../vues/V-06.svelte';
	import '../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} />
