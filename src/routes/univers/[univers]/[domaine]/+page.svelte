<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}` — V-11 Page d'un domaine. Le chargeur porte la
	 * résolution du couple univers × domaine, le périmètre et les droits.
	 *
	 * TOUTES LES SOURCES DE L'ÉCRAN SONT PASSÉES, ET LA VUE LES EXIGE : optionnelles,
	 * de défaut les constantes de `seeds/corpus.ts`, un oubli ici servait le jeu de
	 * démonstration en silence.
	 *
	 * `modules` EST LE CATALOGUE DE LIBELLÉS DU PRODUIT, pas une donnée d'instance :
	 * les clés actives d'un domaine viennent de `modules_de_domaine` par
	 * `detailDomaines` (`RG-STR-06`).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-11.svelte';
	import '../../../../vues/V-11.css';
	import { cablerLeDomaine } from './cablage';
	import { CATALOGUE_DE_MODULES } from '$lib/rangement/modules';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LE CÂBLAGE NE PORTE PLUS D'ADRESSE. Les six entrées de « Contenu du domaine »
	 * et d'« Explorer », les trois actions du bandeau et le menu ⋯ sont des ancres
	 * du balisage ; il ne reste à câbler que les deux sélecteurs, qui sont des
	 * formulaires. La racine d'écoute suffit.
	 */
	onMount(() => cablerLeDomaine(enveloppe));
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		univers={data.univers}
		domaines={data.domaines}
		detailDomaines={data.detailDomaines}
		nombreDeDossiers={data.nombreDeDossiers}
		vivacites={data.vivacites}
		mesures={data.mesures}
		fenetreDeConsultation={data.fenetreDeConsultation}
		activite={data.activite}
		filtreDActivite={data.filtreDActivite}
		derniereActiviteHeures={data.derniereActiviteHeures}
		seuilBientot={data.seuilBientot}
		adressesDuDomaine={data.adressesDuDomaine}
		modules={CATALOGUE_DE_MODULES}
	/>
</div>
