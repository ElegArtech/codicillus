<script lang="ts">
	/**
	 * `/univers/{univers}` — V-10 Page d'un univers.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Aucune décision n'y est prise : le vecteur, les notes, le rangement lisible
	 * et l'activité viennent de `+page.server.ts`, qui porte la résolution
	 * d'adresse, le périmètre et les droits.
	 *
	 * QUATRE PROPRIÉTÉS DE PLUS QUE LE PREMIER CÂBLAGE, et elles sont exactement
	 * celles que `T-041` avait rendues passables sans que rien ne les passe :
	 * `univers`, `domaines`, `detailDomaines`, `activite`. La vue n'a pas changé —
	 * ce sont ses propriétés optionnelles, dont le défaut reste `seeds/corpus.ts`
	 * pour le mode démo du banc, qui n'en passe aucune.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert :
	 * `+layout.svelte` ne porte que le socle. Elle est identique à l'octet à sa
	 * source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les titres des maquettes sont ceux des planches de revue, et en inventer un
	 * serait un comblement.
	 */
	import Vue from '../../../vues/V-10.svelte';
	import '../../../vues/V-10.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	detailDomaines={data.detailDomaines}
	activite={data.activite}
/>
