<script lang="ts">
	/**
	 * `/notes/{identifiant}` — V-14 Lecture d'une note.
	 *
	 * LOT T-033, « le câblage ». La vue ne change pas : elle reçoit ses deux
	 * propriétés, et l'une des deux vient désormais de la BASE — `notes` est le
	 * corpus lisible par l'appelant, plus le fichier de constantes.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait.
	 *
	 * CE QUE `data.lecture` PORTE ET QUE RIEN NE MONTRE. Le chargeur rend la note
	 * réelle, son corps rendu par `rendreDocument` et ses rétroliens déduits.
	 * `src/vues/V-14.svelte` ne déclare aucune propriété pour les recevoir : son
	 * article est la transcription gelée de `n-restaurer-pg`. Le contrat de ce lot
	 * interdit de toucher `src/vues/` ; l'écart est déclaré au rapport plutôt que
	 * comblé ici.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert :
	 * `+layout.svelte` ne porte que le socle. Elle est identique à l'octet à sa
	 * source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les `<title>` des maquettes sont ceux des planches de revue, et en inventer
	 * un serait un comblement.
	 */
	import Vue from '../../../vues/V-14.svelte';
	import '../../../vues/V-14.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
