<script lang="ts">
	/**
	 * `/mot-de-passe-oublie/{jeton}` — V-06.
	 *
	 * Le jeton n'est pas regardé : aucune table n'en porte, et aucun lien n'a
	 * jamais été envoyé. L'écran est donc celui de l'autre adresse, à l'octet.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../vues/V-06.svelte';
	import '../../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue portail={data.portail} />
