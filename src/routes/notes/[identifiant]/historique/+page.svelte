<script lang="ts">
	/**
	 * `/notes/{identifiant}/historique` — V-15, l'historique d'une note.
	 *
	 * AUCUN CÂBLAGE : les trois états de l'écran — filtre de registre, panneau de
	 * comparaison, confirmation de restauration — sont des ADRESSES, et la
	 * restauration est un formulaire natif vers l'action de la note. Rien ici
	 * n'attend l'hydratation, donc rien ne casse sans elle.
	 */
	import Vue from '../../../../vues/V-15.svelte';
	import '../../../../vues/V-15.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	note={data.note}
	notes={data.notes}
	adresseDeLaNote={data.adresseDeLaNote}
	derniereModification={data.derniereModification}
	onglets={data.onglets}
	evenements={data.evenements}
	vide={data.vide}
	ecriture={data.ecriture}
/>
