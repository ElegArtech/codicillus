<script lang="ts">
	/**
	 * `/console/configuration` — V-33 Console · Configuration. Le rôle
	 * administrateur est éprouvé côté serveur par `+page.server.ts`.
	 *
	 * CE FICHIER REND CE QUE LE CHARGEUR A RÉSOLU, ET CÂBLE CE QUE LE GEL LAISSE
	 * INERTE : les notes, le rangement, l'utilisateur ET LES SEPT RÉGLAGES viennent
	 * de la base, `config` étant lu par `lireConfiguration()`.
	 *
	 * LE CÂBLAGE EST APPELÉ DEPUIS `onMount`, jamais ailleurs : le chemin mesuré ne
	 * traverse pas ce code, si bien que la conformité au gel n'a pas à être défendue
	 * par une relecture. Le module appelé vit sous `src/routes/console/cablage.ts`.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-33.svelte';
	import '../../../vues/V-33.css';
	import { cablerLaConfiguration } from '../cablage';
	import { cablerLeTemoinDeConfiguration, peindreLesRefusDeConfiguration } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * DEUX CÂBLAGES, ET LA FRONTIÈRE EST NETTE : le commun tient les sept champs,
	 * les deux boutons et l'envoi ; celui d'à côté tient le seul nœud qu'il laissait
	 * derrière — `#etat-config`, la phrase qui dit que les modifications ne
	 * s'appliquent pas encore.
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
	NI RAIL, NI IDENTITÉ, NI VERSION : LA COQUILLE LES LIT AU CONTEXTE. Cette page
	les passait à la vue, qui les remettait à `CoquilleDeConsole`, qui retombait sur
	`seeds/corpus.ts` dès qu'une route en oubliait une. Le gabarit racine pose le
	contexte d'identité, seule source.
-->
<Vue vecteur={data.vecteur} notes={data.notes} config={data.config} />
