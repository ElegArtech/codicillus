<script lang="ts">
	/**
	 * `/console/imports/{lot}` — V-35, rapport de lot ouvert. Le rôle administrateur et
	 * l'existence du lot sont éprouvés côté serveur, dans `+page.server.ts`.
	 *
	 * C'EST LA MÊME VUE QUE `/console/imports`, ET C'EST LA SOURCE QUI LE VEUT :
	 * `docs/routes.md` range les deux adresses sous V-35, la seconde n'étant que
	 * « l'état "rapport de lot ouvert" » de la première. Deux vues auraient divergé.
	 */
	import Vue from '../../../../vues/V-35.svelte';
	import '../../../../vues/V-35.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDeDomaine } from '$lib/rangement/adresses';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	notes={data.notes}
	journalImports={data.journalImports}
	journalEnregistre={data.journalEnregistre}
	lotOuvert={data.lotOuvert}
	fichiersDuLot={data.fichiersDuLot}
	onFermerLeRapport={() => {
		/* FERMER LE RAPPORT, C'EST REVENIR AU JOURNAL. Sans cela, le dialogue se
		   fermait sur une adresse qui le rouvrait au rechargement. */
		void goto(resolve('/console/imports'));
	}}
	onOuvrirLeRapport={(lot) => {
		void goto(resolve('/console/imports/[lot]', { lot }));
	}}
	onOuvrirLeDomaine={(domaine) => {
		/* « OUVRIR LE DOMAINE » — la désignation est canonique, comme partout ailleurs
		   en console : le rapport porte un nom d'affichage, l'adresse attend deux
		   identifiants lisibles. UN DOMAINE SUPPRIMÉ DEPUIS N'A PLUS DE DÉSIGNATION,
		   et le geste ne mène alors nulle part plutôt que vers un 404. */
		const canonique = data.designations[domaine];
		if (canonique === undefined) return;
		/* LA RÈGLE EST DÉSARMÉE, MÊME MOTIF QU'À `/console/imports` : l'adresse sort de
		   la fabrique de `$lib/rangement/adresses.ts`, déjà composée, et
		   `svelte/no-navigation-without-resolve` ne sait pas la reconnaître. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresseDeDomaine(canonique.univers, canonique.domaine));
	}}
	onScenario={() => {
		void goto(resolve('/importer'));
	}}
/>
