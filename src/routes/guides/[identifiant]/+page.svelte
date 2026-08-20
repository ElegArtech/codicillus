<script lang="ts">
	/**
	 * `/guides/{identifiant}` — V-03 Lecture publique d'un guide.
	 *
	 * Ce fichier ne fait que rendre la vue. La résolution — 200 ou 404, sur la
	 * note réellement demandée — est dans `+page.server.ts`, qui porte le
	 * périmètre public et le point de sortie unique du refus.
	 *
	 * `vecteur={null}` : les deux axes de la planche décrivent LA NOTE AFFICHÉE
	 * — fraîcheur du cartouche, présence du registre « En bref » —, et la note
	 * les porte désormais elle-même. Il ne reste rien à piloter par vecteur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3). Cette route ne rend
	 * qu'une vue : l'import direct suffit, et aucun croisement de feuille n'est à
	 * mesurer.
	 */
	import Vue from '../../../vues/V-03.svelte';
	import '../../../vues/V-03.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} guide={data.guide} />
