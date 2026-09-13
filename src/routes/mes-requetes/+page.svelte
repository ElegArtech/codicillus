<script lang="ts">
	import { resolve } from '$app/paths';
	import { ETATS, dateDeRequete } from '$lib/requetes/modele';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Mes requêtes de documentation · Codicillus</title></svelte:head>
<header class="rq-entete">
	<div>
		<h1>Mes requêtes de documentation</h1>
		<p class="rq-intro">
			Les décisions et les retours concernant les besoins que vous avez proposés.
		</p>
	</div>
	<a class="btn" href={resolve('/requetes/nouvelle')}>Formuler une requête</a>
</header>
{#if data.requetes.length}<div class="rq-liste">
		{#each data.requetes as r (r.id)}<a
				class="rq-ligne"
				href={resolve('/mes-requetes/[identifiant]', { identifiant: r.id })}
				><span
					><strong>{r.sujet}</strong><small
						>{dateDeRequete(r.creeLe)}{r.nouveau ? ' · Nouvelle décision' : ''}</small
					></span
				><span class="rq-secondaire">{r.domaine ?? 'Non assigné'}</span><span
					class={'rq-badge rq-badge--' + r.etat}>{ETATS[r.etat]}</span
				><span aria-hidden="true">›</span></a
			>{/each}
	</div>{:else}<div class="rq-vide">
		<h2>Vous n’avez pas encore formulé de requête</h2>
		<p>
			Une connaissance manque ou ne répond pas à votre situation ? Vous pouvez proposer un besoin
			aux administrateurs.
		</p>
		<a class="btn btn--principal" href={resolve('/requetes/nouvelle')}
			>Formuler une requête de documentation</a
		>
	</div>{/if}
