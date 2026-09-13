<script lang="ts">
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	const { children }: { children: import('svelte').Snippet } = $props();
</script>

<CoquilleDeConsole section="requetes" notes={[]}
	>{#snippet enfants()}<div class="rq-module">
			{@render children()}
		</div>{/snippet}</CoquilleDeConsole
>
