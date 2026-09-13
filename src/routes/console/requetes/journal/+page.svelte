<script lang="ts">
	import { resolve } from '$app/paths';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { GESTES, dateDeRequete } from '$lib/requetes/modele';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Journal des décisions · Requêtes · Codicillus</title></svelte:head>
<a class="rq-lien rq-retour" href={resolve('/console/requetes')}>← Requêtes de documentation</a>
<TeteDeSection
	titre="Journal des décisions"
	description="Les décisions et suppressions restent consultables par les administrateurs."
/>
<div class="rq-bloc">
	{#if data.journal.length}<ol class="rq-historique">
			{#each data.journal as h (h.id)}<li>
					<strong>{GESTES[h.geste] ?? h.geste}</strong>{#if h.requeteId}<a
							class="rq-lien"
							href={resolve('/console/requetes/[identifiant]', { identifiant: h.requeteId })}
							>{h.sujet}</a
						>{:else}<span>Contenu retiré du module</span>{/if}<small
						>{dateDeRequete(h.le)} · {h.acteur ?? 'Visiteur anonyme'}</small
					>
				</li>{/each}
		</ol>{:else}<p>Aucune décision pour le moment.</p>{/if}
</div>
