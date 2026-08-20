<script lang="ts">
	/**
	 * `/console/imports` — V-35 Console · Imports.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * `etat` N'EST PAS PASSÉ. La propriété nomme la zone que le banc découpe
	 * (protocole des états de zone) et ne change rien au rendu de trois des
	 * quatre états ; le banc n'atteint jamais cette route. Ne rien passer rend la
	 * page entière au repos, ce qui est l'état du produit.
	 *
	 * Les notes viennent de la base ; le journal des imports, non — aucune table
	 * ne le porte, voir le chargeur.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-35.svelte';
	import '../../../vues/V-35.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue notes={data.notes} />
