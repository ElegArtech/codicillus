<script lang="ts">
	/**
	 * `/notes/{identifiant}/comparaison` — V-16 Comparaison de deux versions.
	 *
	 * LOT T-039, « le câblage ». La vue ne change pas : elle reçoit ses
	 * propriétés, et celles qui décrivent l'historique viennent désormais de la
	 * BASE — `notes` est le corpus lisible par l'appelant, `versions` est la
	 * table des versions de la note, `contenuVersions` est vide parce que la base
	 * ne porte aucun contenu de version.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par son propre
	 * mode. Rien de ce fichier n'entre dans son verdict, et les 409 couples ne
	 * peuvent pas bouger de son fait.
	 *
	 * CE QUE `data.comparaison` PORTE ET QUE RIEN NE MONTRE. Le chargeur rend les
	 * deux modes de `cadrage/STACK-TECHNIQUE.md` §4.5 calculés sur les documents
	 * canoniques des deux versions. `src/vues/V-16.svelte` calcule les siens à
	 * partir de `contenuVersions`, et ne déclare aucune propriété qui porterait
	 * un alignement. Le contrat de ce lot interdit de toucher `src/vues/` ;
	 * l'écart est déclaré au rapport plutôt que comblé ici.
	 *
	 * LA VUE NOMME SA PROPRE NOTE. Le gel de V-16 compare `n-restaurer-pg`, et la
	 * transcription le reprend : la vue ignore le paramètre d'adresse. Le
	 * chargeur, lui, résout la note DE L'ADRESSE — c'est elle qui décide de
	 * l'accès. L'écart entre les deux est déclaré au rapport.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3) et n'est pas
	 * modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les titres des maquettes sont ceux des planches de revue, et en inventer un
	 * serait un comblement.
	 */
	import Vue from '../../../../vues/V-16.svelte';
	import '../../../../vues/V-16.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	versions={data.versions}
	contenuVersions={data.contenuVersions}
/>
