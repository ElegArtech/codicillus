<script lang="ts">
	import { resolve } from '$app/paths';
	const { recherche = '' }: { recherche?: string } = $props();
</script>

<aside class="rq-public" class:rq-recherche={Boolean(recherche)}>
	<div>
		<strong
			>{recherche
				? 'Vous n’avez pas trouvé ce qu’il vous faut ?'
				: 'Une connaissance manque ?'}</strong
		>
		<p>
			{recherche
				? 'Vous pouvez proposer un besoin, même si la recherche donne des résultats.'
				: 'Proposez un besoin de connaissance aux administrateurs.'}
		</p>
	</div>
	<a class="btn" href={resolve(`/requetes/nouvelle?q=${encodeURIComponent(recherche)}`)}
		>Formuler une requête de documentation</a
	>
</aside>
