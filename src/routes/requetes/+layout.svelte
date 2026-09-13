<script lang="ts">
	import CoquilleRequetes from '$lib/requetes/CoquilleRequetes.svelte';
	import VuePublique from '../../vues/V-01.svelte';
	import '../../vues/V-01.css';
	import type { LayoutData } from './$types';
	const { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

{#if data.session}<CoquilleRequetes titre="Requête de documentation"
		>{@render children()}</CoquilleRequetes
	>{:else}<VuePublique
		vecteur={null}
		notes={[]}
		portail={data.portailAssistance}
		contenu={children}
	/>{/if}
