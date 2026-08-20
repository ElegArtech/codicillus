<script lang="ts">
	/**
	 * `/notes/nouvelle` — V-17 Éditeur d'une note, création.
	 *
	 * La vue ne change pas : elle reçoit ses propriétés, et cinq d'entre elles
	 * viennent désormais de la BASE — le corpus lisible par l'appelant, les types
	 * de note, les types de fiche et les gabarits, tous administrables (M14) donc
	 * propres à l'instance.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait.
	 *
	 * CE QUE LA VUE NE PEUT PAS RECEVOIR, ET QUI EST DÉCLARÉ. Quatre propriétés
	 * de contexte — univers, domaines, compte courant, état d'instance — restent
	 * au défaut du jeu de semence : aucune n'est lisible en base sous la forme
	 * que la vue attend (`EtatDInstance.synchro` est un libellé relatif que rien
	 * ne porte), et les inventer serait la valeur illustrative que `P-02`
	 * proscrit. L'écart est celui que `T-042` a ouvert en les rendant
	 * optionnelles ; il est chiffré au rapport de ce lot.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert :
	 * le gabarit racine ne porte que le socle. Elle est identique à l'octet à sa
	 * source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN élément d'en-tête : rien ne déclare de titre de page pour le PRODUIT.
	 * Les titres des maquettes sont ceux des planches de revue, et en inventer un
	 * serait un comblement.
	 */
	import Vue from '../../../vues/V-17.svelte';
	import '../../../vues/V-17.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	typesNote={data.typesNote}
	typesFiche={data.typesFiche}
	templates={data.templates}
/>
