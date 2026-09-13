<script lang="ts">
	import type { Snippet } from 'svelte';
	import Coquille from '$lib/coquille/Coquille.svelte';
	const { titre, children }: { titre: string; children: Snippet } = $props();
</script>

<Coquille
	fil={['Accueil', titre]}
	univers={[]}
	domaines={[]}
	notes={[]}
	compte={{ nom: '', initiales: '', role: '', domaine: '' }}
	version=""
	rail="ouvert"
	classeContenu="rq-travail rq-module"
	idContenu="contenu"
	enfants={children}
/>
