<script lang="ts">
	import { resolve } from '$app/paths';
	const { requete }: { requete: { id: string; sujet: string; besoin: string } } = $props();
</script>

<div class="rq-contexte rq-editeur-contexte">
	<span class="etiq">Requête de documentation acceptée</span><strong>{requete.sujet}</strong><a
		class="rq-lien"
		href={resolve('/console/requetes/[identifiant]', { identifiant: requete.id })}
		>Voir la requête</a
	>
	<p class="rq-besoin">{requete.besoin}</p>
	Un brouillon garde la requête acceptée. Après publication, la diffusion se confirme dans la console.
</div>
