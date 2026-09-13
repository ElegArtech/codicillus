<script lang="ts">
	import CoquilleRequetes from '$lib/requetes/CoquilleRequetes.svelte';
	const { children }: { children: import('svelte').Snippet } = $props();
</script>

<CoquilleRequetes titre="Mes requêtes de documentation">{@render children()}</CoquilleRequetes>
