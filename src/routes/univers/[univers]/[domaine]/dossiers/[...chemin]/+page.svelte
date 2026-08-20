<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/dossiers/{chemin…}` — V-13 Page d'un dossier.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur et les notes viennent de `+page.server.ts`, qui porte la
	 * traduction du chemin, l'exigence du module `dossiers` (RG-STR-06), le
	 * périmètre et le droit effectif.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../../../../vues/V-13.svelte';
	import '../../../../../../vues/V-13.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
