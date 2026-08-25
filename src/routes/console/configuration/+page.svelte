<script lang="ts">
	/**
	 * `/console/configuration` — V-33 Console · Configuration.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER REND CE QUE LE CHARGEUR A RÉSOLU, ET CÂBLE CE QUE LE GEL LAISSE
	 * INERTE. Les notes, le rangement, l'utilisateur ET LES SEPT RÉGLAGES viennent
	 * de la base — la rédaction précédente disait « les seuils affichés, non »,
	 * ce qui n'est plus vrai : `config` est passé, lu par `lireConfiguration()`.
	 *
	 * LE CÂBLAGE EST APPELÉ DEPUIS `onMount`, jamais ailleurs — c'est le motif
	 * de `$lib/cablage/formulaires.ts`, et son en-tête en donne la raison : le
	 * chemin mesuré ne traverse pas ce code, si bien que la conformité au gel n'a
	 * pas à être défendue par une relecture. Le module appelé vit à côté, sous
	 * `src/routes/console/cablage.ts`.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-33.svelte';
	import '../../../vues/V-33.css';
	import { cablerLaConfiguration } from '../cablage';
	import { cablerLeTemoinDeConfiguration, peindreLesRefusDeConfiguration } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * DEUX CÂBLAGES, ET LA FRONTIÈRE EST NETTE. Le commun tient les sept champs,
	 * les deux boutons et l'envoi ; celui d'à côté tient le seul nœud qu'il
	 * laissait derrière — `#etat-config`, la phrase qui dit à l'administrateur
	 * que ses modifications ne s'appliquent pas encore. Voir `./cablage.ts` pour
	 * la raison du partage.
	 */
	onMount(() => {
		const commun = cablerLaConfiguration(document, {
			surRefus: peindreLesRefusDeConfiguration(document)
		});
		const temoin = cablerLeTemoinDeConfiguration(document);
		return () => {
			commun();
			temoin();
		};
	});
</script>

<!--
	NI RAIL, NI IDENTITÉ, NI VERSION : LA COQUILLE LES LIT AU CONTEXTE. Cette
	page les passait à la vue, qui les remettait à `CoquilleDeConsole`, qui
	retombait sur `seeds/corpus.ts` dès qu'une route en oubliait une. Les quatre
	propriétés ont disparu des trois côtés ; le gabarit racine pose le contexte
	d'identité, seule source.
-->
<Vue vecteur={data.vecteur} notes={data.notes} config={data.config} />
