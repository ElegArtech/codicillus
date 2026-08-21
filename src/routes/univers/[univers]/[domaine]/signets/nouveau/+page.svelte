<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/signets/nouveau` — V-23, mode création.
	 *
	 * DEUX ROUTES, UN SEUL ÉCRAN (`docs/routes.md` §3.3) : celle-ci et
	 * `…/signets/{identifiant}/modifier` rendent la même vue, à un réglage de
	 * mode près. Le vecteur est composé par `vecteurDeV23()`, à un seul endroit.
	 *
	 * L'ENVELOPPE RENDUE EST « PAGE DÉDIÉE », ET C'EST UNE LECTURE DÉCLARÉE :
	 * la planche en offre deux, la maquette dit que « l'enveloppe n'est pas dans
	 * l'adresse », et aucune source ne dit laquelle une requête directe rend. Le
	 * raisonnement est écrit dans `vecteurDeV23()` et remonté au rapport du lot.
	 *
	 * La garde de droit est dans `+page.server.ts` : `docs/routes.md:129` exige
	 * « connecté + rédacteur », et le refus emprunte le chemin unique
	 * d'`ADR-007`. Rien n'est décidé ici.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../../../vues/V-23.svelte';
	import '../../../../../../vues/V-23.css';
	import { cablerLeSignet } from '$lib/cablage/formulaires';
	import { page } from '$app/state';
	import { adresseDesSignetsDuDomaine } from '$lib/rangement/adresses';
	import { cablerLAnnulationDuSignet } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

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
		const defaireLeSignet = cablerLeSignet(enveloppe);
		const defaireLAnnulation = cablerLAnnulationDuSignet(enveloppe, { retour });
		return () => {
			defaireLAnnulation();
			defaireLeSignet();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue vecteur={data.vecteur} notes={data.notes} />
</div>
