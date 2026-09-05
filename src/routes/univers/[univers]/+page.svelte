<script lang="ts">
	/**
	 * `/univers/{univers}` — V-10, la page d'un univers.
	 *
	 * TOUT VIENT DU CHARGEUR, ET LA VUE L'EXIGE : `+page.server.ts` porte la
	 * résolution d'adresse, le périmètre, les droits, l'agrégation de vivacité et la
	 * composition des adresses. Aucune de ses propriétés n'a de défaut — une route qui
	 * en oublierait une ne compilerait pas.
	 *
	 * IL N'Y A PLUS DE CÂBLAGE. Les gestes de cet écran sont des LIENS : la ligne d'un
	 * domaine, les alertes, la cartographie, « + Créer ». Un câblage accroché au
	 * montage se débranchait sans qu'aucune compilation ne le voie — il suffisait
	 * qu'une classe change de nom.
	 */
	import Vue from '../../../vues/V-10.svelte';
	import '../../../vues/V-10.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	univers={data.univers}
	repartition={data.repartition}
	domaines={data.domaines}
	contributeurs={data.contributeurs}
	heuresDepuisLActivite={data.heuresDepuisLActivite}
	activite={data.activite}
	seuilBientot={data.seuilBientot}
	adresses={data.adresses}
	droits={data.droits}
/>
