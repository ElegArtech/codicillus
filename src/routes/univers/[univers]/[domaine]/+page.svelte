<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}` — V-11 Page d'un domaine.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur et les notes viennent de `+page.server.ts`, qui porte la
	 * résolution du couple univers × domaine, le périmètre et les droits.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../../vues/V-11.svelte';
	import '../../../../vues/V-11.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
