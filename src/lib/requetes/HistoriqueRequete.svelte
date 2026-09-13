<script lang="ts">
	import { GESTES, dateDeRequete } from './modele';
	const {
		lignes
	}: {
		lignes: readonly {
			id: string;
			geste: string;
			le: Date;
			commentaireDemandeur: string;
			acteur?: string | null;
		}[];
	} = $props();
</script>

<ol class="rq-historique">
	{#each lignes as h (h.id)}<li>
			<strong>{GESTES[h.geste] ?? h.geste}</strong><small
				>{dateDeRequete(h.le)}{h.acteur ? ' · ' + h.acteur : ''}</small
			>{#if h.commentaireDemandeur}<p>{h.commentaireDemandeur}</p>{/if}
		</li>{/each}
</ol>
