<script lang="ts">
	import { fractionner, demanderAuParent, dansUnVolet } from './navigation';
	import { onMount } from 'svelte';
	let integre = $state(false);
	onMount(() => {
		integre = dansUnVolet();
	});

	function choisir(evenement: MouseEvent, action: () => void): void {
		const menu = (evenement.currentTarget as HTMLElement).closest('.menu-barre');
		menu?.removeAttribute('data-ouvert');
		menu?.querySelector('button')?.setAttribute('aria-expanded', 'false');
		action();
	}
</script>

<div class="menu-barre__sep"></div>
<button type="button" onclick={(e) => choisir(e, fractionner)}>Fractionner vers la droite</button>
{#if integre}
	<button type="button" onclick={(e) => choisir(e, () => demanderAuParent('fermer'))}
		>Fermer le volet</button
	>
{/if}
