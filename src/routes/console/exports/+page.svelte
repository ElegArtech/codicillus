<script lang="ts">
	/**
	 * `/console/exports` — V-36 Console · Exports.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * `notes` EST LA SEULE PROPRIÉTÉ QUE CETTE VUE LIT — elle le déclare
	 * elle-même : ses quatre états rendent le même écran. Elle vient de la base.
	 * L'archive, elle, n'est pas produite : voir le chargeur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-36.svelte';
	import '../../../vues/V-36.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue notes={data.notes} />
