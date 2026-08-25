<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/signets/{identifiant}/modifier` — V-23, mode
	 * édition.
	 *
	 * MÊME ÉCRAN QUE `…/signets/nouveau` (`docs/routes.md` §3.3), à un réglage
	 * de mode près : `mode: 'edition'` peuple les champs, ajoute la suppression,
	 * et change les deux libellés. Le vecteur est composé par `vecteurDeV23()`,
	 * à un seul endroit.
	 *
	 * LE SIGNET ÉDITÉ EST CELUI QUE L'ADRESSE DÉSIGNE : le chargeur le résout et
	 * la vue le lit par sa propriété `signet`. Les domaines du sélecteur viennent
	 * du gabarit racine, qui les lit en base ; la vue les EXIGE désormais — elle
	 * retombait sur `DOMAINES` du jeu de démonstration et proposait des domaines
	 * qui n'existent pas.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../../../../vues/V-23.svelte';
	import '../../../../../../../vues/V-23.css';
	import { cablerLeSignet } from '$lib/cablage/formulaires';
	import { page } from '$app/state';
	import { adresseDesSignetsDuDomaine } from '$lib/rangement/adresses';
	import { cablerLAnnulationDuSignet } from '../../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/** `RG-M18-05` — une action irréversible rappelle ce qui sera détruit. */
	const rappel = $derived(
		`Supprimer le signet « ${data.signet.titre} » ?\n\n` +
			`${data.signet.url ?? '(aucune adresse)'}\n\n` +
			'La suppression est définitive : il n’y a pas de corbeille.'
	);

	let enveloppe: HTMLDivElement;

	/**
	 * OÙ « ANNULER » RAMÈNE — la liste des signets du domaine, par la fabrique
	 * d'adresses. Les deux segments de la route sont déjà des identifiants
	 * lisibles, et `identifiantLisible()` est idempotente sur eux.
	 */
	const retour = $derived(
		adresseDesSignetsDuDomaine(
			String(page.params['univers'] ?? ''),
			String(page.params['domaine'] ?? '')
		)
	);

	onMount(() => {
		const defaireLeSignet = cablerLeSignet(enveloppe, { rappelDeSuppression: rappel });
		const defaireLAnnulation = cablerLAnnulationDuSignet(enveloppe, { retour });
		return () => {
			defaireLAnnulation();
			defaireLeSignet();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		signet={data.signet}
		domaines={page.data.domaines}
	/>
</div>
