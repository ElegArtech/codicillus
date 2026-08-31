<script lang="ts">
	/**
	 * `/mot-de-passe-oublie/{jeton}` — V-06. Le jeton n'est pas regardé : aucune
	 * table n'en porte, et aucun lien n'a jamais été envoyé. L'écran est celui de
	 * l'autre adresse, à l'octet.
	 */
	import Vue from '../../../vues/V-06.svelte';
	import '../../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue portail={data.portail} />
