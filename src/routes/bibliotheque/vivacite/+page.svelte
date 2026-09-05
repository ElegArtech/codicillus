<script lang="ts">
	/** `/bibliotheque/vivacite` — V-42, la planche des cinq états. */
	import Vue from '../../../vues/V-42.svelte';
	import '../../../vues/V-42.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	aujourdhui={data.aujourdhui}
/>
