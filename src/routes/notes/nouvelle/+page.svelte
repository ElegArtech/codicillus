<script lang="ts">
	/**
	 * `/notes/nouvelle` — V-17 Éditeur d'une note, création.
	 *
	 * La vue ne change pas : elle reçoit ses propriétés, et cinq d'entre elles
	 * viennent de la BASE — le corpus lisible par l'appelant, les types de note,
	 * les types de fiche et les gabarits, tous administrables (M14) donc propres
	 * à l'instance.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait. C'est le fondement d'`ARB-063`, et c'est
	 * pourquoi le câblage du formulaire est écrit ici plutôt qu'en `src/vues/`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * L'ENVELOPPE DE FORMULAIRE NE PÈSE AUCUN PIXEL
	 *
	 * `display: contents` retire l'élément de la génération de boîtes : il ne
	 * porte ni marge, ni remplissage, ni contexte de formatage, et ses enfants
	 * se disposent comme s'il n'était pas là. Le rendu est celui d'avant, à
	 * l'octet — et le banc, qui ne traverse pas ce fichier, n'a de toute façon
	 * pas à en juger.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE DOMAINE VIENT DE L'ADRESSE, ET IL COMMANDE L'ARBORESCENCE
	 *
	 * `docs/routes.md:287` prévoit un paramètre `domaine` sur cette adresse. Il
	 * est désormais honoré, et il l'est PAR LA VUE plutôt qu'à côté d'elle :
	 * `compte.domaine` commande le domaine pré-choisi d'une note vierge
	 * (`V-17:3537`) ET l'arborescence du choix de dossier qui s'en déduit. Le
	 * porter par cette propriété est donc le seul moyen que la vue offre — et
	 * elle l'offre : `compte` est optionnelle depuis `T-042`, son défaut est la
	 * constante du jeu, et le mode de conception ne la passe pas.
	 *
	 * Les trois autres paramètres de `docs/routes.md:287-288` — titre, dossier,
	 * template — restent non lus : aucune propriété de la vue ne les recevrait,
	 * et un paramètre honoré à moitié serait pire que pas de paramètre. Écart
	 * inchangé, déclaré.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Vue from '../../../vues/V-17.svelte';
	import '../../../vues/V-17.css';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { MOI } from '../../../../seeds/corpus';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/** Le domaine demandé par l'adresse, à défaut celui du compte du jeu. */
	const domaineDemande = $derived(page.url.searchParams.get('domaine'));
	const compte = $derived(
		domaineDemande === null ? MOI : { ...MOI, domaine: domaineDemande as typeof MOI.domaine }
	);

	let formulaire: HTMLFormElement;

	onMount(() =>
		cablerLEditeur(formulaire, {
			rechargerSurDomaine: (domaine) => `/notes/nouvelle?domaine=${encodeURIComponent(domaine)}`
		})
	);
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		{compte}
		typesNote={data.typesNote}
		typesFiche={data.typesFiche}
		templates={data.templates}
	/>
</form>
