<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}` — V-11 Page d'un domaine. Le chargeur porte la
	 * résolution du couple univers × domaine, le périmètre et les droits.
	 *
	 * TOUTES LES SOURCES DE L'ÉCRAN SONT PASSÉES, ET LA VUE LES EXIGE : optionnelles,
	 * de défaut les constantes de `seeds/corpus.ts`, un oubli ici servait le jeu de
	 * démonstration en silence.
	 *
	 * `nombreDeDossiers` reste optionnelle, pour une raison distincte : absente, le
	 * compteur du module « Dossiers » se déduit du rangement des notes — et un
	 * dossier vide n'y compte pas ; c'est pourquoi le chargeur la sert.
	 *
	 * `modules` EST LE CATALOGUE DE LIBELLÉS DU PRODUIT, pas une donnée d'instance :
	 * les clés actives d'un domaine viennent de `modules_de_domaine` par
	 * `detailDomaines` (`RG-STR-06`).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-11.svelte';
	import '../../../../vues/V-11.css';
	import { cablerLeDomaine } from './cablage';
	import { page } from '$app/state';
	import { CATALOGUE_DE_MODULES } from '$lib/rangement/modules';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * L'UNIVERS DU DOMAINE, LU À LA LISTE DES DOMAINES, JAMAIS SUPPOSÉ — ce que fait
	 * la vue, et pour la même raison : le segment d'adresse est un identifiant
	 * lisible, dont le NOM ne se redérive pas. « Poste de travail » et
	 * « poste-de-travail » ne se retrouvent pas l'un l'autre.
	 */
	const domaine = $derived(String(data.vecteur.dom));
	const univers = $derived(data.domaines.find((d) => d.nom === domaine)?.univers ?? '');

	/**
	 * LES DEUX IDENTIFIANTS D'ADRESSE VIENNENT DES SEGMENTS DEMANDÉS, pas d'une
	 * slugification des noms : ce sont ceux sur lesquels le chargeur vient de
	 * résoudre le domaine, et ils ne suivent pas les renommages (`RG-M12-11`). Les
	 * noms restent pour les paramètres de requête qui en attendent un.
	 */
	onMount(() =>
		cablerLeDomaine(enveloppe, {
			univers,
			domaine,
			universIdentifiant: page.params.univers ?? '',
			domaineIdentifiant: page.params.domaine ?? ''
		})
	);
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		univers={data.univers}
		domaines={data.domaines}
		detailDomaines={data.detailDomaines}
		nombreDeDossiers={data.nombreDeDossiers}
		mesures7j={data.mesures7j}
		modifications={data.modifications}
		revisions={data.revisions}
		modules={CATALOGUE_DE_MODULES}
	/>
</div>
