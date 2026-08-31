<script lang="ts">
	/**
	 * `/univers/{univers}` — V-10 Page d'un univers.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Aucune décision n'y est prise : le vecteur, les notes, le rangement lisible
	 * et l'activité viennent de `+page.server.ts`, qui porte la résolution
	 * d'adresse, le périmètre et les droits.
	 *
	 * TOUTES LES SOURCES DE L'ÉCRAN SONT PASSÉES, ET LA VUE LES EXIGE. Elles ont
	 * été optionnelles, de défaut les constantes de `seeds/corpus.ts` : un oubli
	 * ici servait le jeu de démonstration en silence. Elles sont requises, et
	 * `svelte-check` refuse désormais de compiler cet appel s'il en manque une.
	 *
	 * `modules` EST LE CATALOGUE DE LIBELLÉS DU PRODUIT, pas une donnée d'instance :
	 * les clés actives d'un domaine viennent de `modules_de_domaine` par
	 * `detailDomaines` (`RG-STR-06`), leurs noms de `$lib/rangement/modules.ts`.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert :
	 * `+layout.svelte` ne porte que le socle. Elle est identique à l'octet à sa
	 * source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 * Les titres des maquettes sont ceux des planches de revue, et en inventer un
	 * serait un comblement.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-10.svelte';
	import '../../../vues/V-10.css';
	import { cablerLUnivers } from './cablage';
	import { designationsDeCoquille } from '$lib/coquille/identite';
	import { CATALOGUE_DE_MODULES } from '$lib/rangement/modules';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LES QUATRE GESTES DE V-10 — tous des navigations, aucun n'écrit.
	 *
	 * Le vecteur porte le NOM de l'univers sous `uni` ; c'est lui que la fabrique
	 * d'adresses redérive en identifiant lisible. Le lire ici plutôt que dans
	 * l'adresse évite de reconstruire un nom depuis un segment, ce qui n'est pas
	 * réversible — « Poste de travail » et « poste-de-travail » ne se retrouvent
	 * pas l'un l'autre.
	 */
	/* LES IDENTIFIANTS D'ADRESSE, LUS EN BASE PAR LE GABARIT RACINE. Le câblage ne
	   voit que des NOMS — il les lit sur les cartes rendues — et les slugifiait :
	   un domaine renommé rendait alors 404 (`RG-M12-11`). */
	const designations = designationsDeCoquille();

	onMount(() => cablerLUnivers(enveloppe, { univers: String(data.vecteur.uni), designations }));
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		univers={data.univers}
		domaines={data.domaines}
		detailDomaines={data.detailDomaines}
		activite={data.activite}
		modules={CATALOGUE_DE_MODULES}
	/>
</div>
