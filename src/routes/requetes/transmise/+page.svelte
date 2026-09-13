<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Requête transmise · Codicillus</title></svelte:head>
<section class="rq-formulaire">
	<div class="rq-recu">
		<h1>Votre requête de documentation a été transmise.</h1>
		<p>Les administrateurs vont évaluer le besoin que vous avez décrit.</p>
		<p>
			{data.session
				? 'Vous retrouverez les décisions et les commentaires qui vous sont destinés dans votre suivi.'
				: 'Ce dépôt est anonyme : aucun suivi individuel ni réponse par courriel ne sont prévus.'}
		</p>
		<div class="rq-actions">
			{#if data.session}<a class="btn btn--principal" href={resolve('/mes-requetes')}
					>Voir mes requêtes de documentation</a
				>{/if}<a class="btn" href={resolve('/')}>Retour à l’accueil</a>
		</div>
	</div>
</section>
