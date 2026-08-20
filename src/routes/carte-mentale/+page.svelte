<script lang="ts">
	/**
	 * `/carte-mentale` — V-21 Carte mentale.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Les notes viennent de `+page.server.ts`, qui porte le périmètre de droits.
	 * `T-070` l'avait posé sans chargeur, et il servait le jeu de semence — vingt-
	 * sept notes, titres compris — à tout connecté, sans le moindre droit.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../vues/V-21.svelte';
	import '../../vues/V-21.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
