<script lang="ts">
	/**
	 * `/importer` — V-24 Import.
	 *
	 * `T-070` avait monté cette route sans chargeur, et elle servait l'écran
	 * d'import — quinze kilo-octets, rail et arborescence compris — à tout
	 * connecté, y compris à un lecteur et à un contributeur sans le moindre
	 * droit de rédaction (`ECART-047` É-1). La garde est désormais côté serveur,
	 * dans `+page.server.ts`, à côté de ce fichier.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu. Le
	 * périmètre de droits est porté par `notes` ; le lot est vide parce que rien
	 * n'a été déposé, et non parce qu'on l'aurait caché.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../vues/V-24.svelte';
	import '../../vues/V-24.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	lotImport={data.lotImport}
	formatsImport={data.formatsImport}
/>
