<script lang="ts">
	/**
	 * `/notes/{identifiant}/modifier` — V-17 Éditeur d'une note, modification.
	 *
	 * La vue ne change pas. Six de ses propriétés viennent de la base : le corpus
	 * lisible par l'appelant, la NOTE REPRISE — celle que l'adresse désigne, et
	 * non plus celle du gel —, et les trois référentiels de saisie.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict.
	 *
	 * CE QUE `data.corps` PORTE ET QUE RIEN NE MONTRE. Le chargeur rend le
	 * document canonique du registre Référence, validé par la porte unique, et
	 * `src/vues/V-17.svelte` ne déclare aucune propriété qui le recevrait : sa
	 * zone de rédaction est vide aux six états du gel, sauf reprise. Le contrat
	 * de ce lot interdit de toucher `src/vues/` ; l'écart est déclaré au rapport
	 * plutôt que comblé ici.
	 */
	import Vue from '../../../../vues/V-17.svelte';
	import '../../../../vues/V-17.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	noteModifiee={data.noteModifiee}
	typesNote={data.typesNote}
	typesFiche={data.typesFiche}
	templates={data.templates}
/>
