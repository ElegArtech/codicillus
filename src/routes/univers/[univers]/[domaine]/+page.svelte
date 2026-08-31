<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}` — V-11 Page d'un domaine.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur, les notes, le rangement lisible, les deux tables de mesure et
	 * les demandes de révision viennent de `+page.server.ts`, qui porte la
	 * résolution du couple univers × domaine, le périmètre et les droits.
	 *
	 * TOUTES LES SOURCES DE L'ÉCRAN SONT PASSÉES, ET LA VUE LES EXIGE. Elles ont
	 * été optionnelles, de défaut les constantes de `seeds/corpus.ts` : un oubli
	 * ici servait le jeu de démonstration en silence. Elles sont requises, et
	 * `svelte-check` refuse désormais de compiler cet appel s'il en manque une.
	 *
	 * `nombreDeDossiers` reste optionnelle, et pour une raison distincte : elle
	 * n'a jamais tenu au jeu. Absente, le compteur du module « Dossiers » se
	 * déduit du rangement des notes — et un dossier vide n'y compte pas ; c'est
	 * pourquoi le chargeur la sert.
	 *
	 * `modules` EST LE CATALOGUE DE LIBELLÉS DU PRODUIT, pas une donnée d'instance :
	 * les clés actives d'un domaine viennent de `modules_de_domaine` par
	 * `detailDomaines` (`RG-STR-06`), leurs noms de `$lib/rangement/modules.ts`.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
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
	 * L'UNIVERS DU DOMAINE, LU À LA LISTE DES DOMAINES, JAMAIS SUPPOSÉ — c'est
	 * exactement ce que fait la vue (`V-11:176`), et pour la même raison : le
	 * segment d'adresse est un identifiant lisible, dont le NOM ne se redérive
	 * pas. « Poste de travail » et « poste-de-travail » ne se retrouvent pas
	 * l'un l'autre.
	 */
	const domaine = $derived(String(data.vecteur.dom));
	const univers = $derived(data.domaines.find((d) => d.nom === domaine)?.univers ?? '');

	/**
	 * LES DEUX IDENTIFIANTS D'ADRESSE VIENNENT DES SEGMENTS DEMANDÉS, pas d'une
	 * slugification des noms : ce sont ceux-là mêmes sur lesquels le chargeur
	 * vient de résoudre le domaine, et ils ne suivent pas les renommages
	 * (`RG-M12-11`). Les noms, eux, restent pour les paramètres de requête qui en
	 * attendent un.
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
