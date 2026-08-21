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
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import {
		cablerLesGestesDEdition,
		resolveurDuCorpusServi,
		DOCUMENT_VIDE,
		type GestesCables,
		peindreLeRefusDEdition
	} from '$lib/edition/gestes';
	import { cablerLeChoixDeDepart } from './cablage';
	import { MOI } from '../../../../seeds/corpus';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/** Le domaine demandé par l'adresse, à défaut celui du compte du jeu. */
	const domaineDemande = $derived(page.url.searchParams.get('domaine'));
	const compte = $derived(
		domaineDemande === null ? MOI : { ...MOI, domaine: domaineDemande as typeof MOI.domaine }
	);

	let formulaire: HTMLFormElement;

	/**
	 * LE REFUS D'ENREGISTREMENT SE VOIT — mesuré muet le 21/08/2026.
	 * Créer sans choisir de dossier renvoyait `400 { motif: 'dossier manquant' }`
	 * et l'écran ne disait rien : ni message, ni témoin, ni foyer. Les deux blocs
	 * du gel — `#erreur-titre`, `#erreur-dossier` — existaient depuis le début.
	 */
	$effect(() => {
		if (formulaire === undefined) return;
		peindreLeRefusDEdition(formulaire, form ?? null);
	});

	/**
	 * L'ÉDITEUR SE MONTE SUR LA ZONE DU GEL, ET C'EST LUI QUI DONNE LE CORPS.
	 *
	 * Il rend la barre d'outils vivante — gras, titres, listes, tableaux,
	 * alertes, tâches — et la soumission porte alors le document canonique dans
	 * `corps`, jamais du Markdown. Sans lui, la zone resterait une saisie nue et
	 * le champ serait `corps-markdown` : les deux chemins existent, ils ne se
	 * mélangent pas (`P-35`).
	 */
	onMount(() => {
		/* `?titre=` — LE QUATRIÈME PARAMÈTRE DE `docs/routes.md:287`, LU ICI.
		   TROIS ÉCRANS L'ÉMETTAIENT DÉJÀ, ET PERSONNE NE LE LISAIT : la recherche
		   sans résultat (`V-08:659`), la page d'adresse non résolue
		   (`cablage-erreur.ts`) et la console analytique, toutes trois par
		   « Créer la note « … » ». Le titre cherché se perdait donc en chemin, et
		   l'utilisateur retrouvait une page blanche là où le produit lui promettait
		   sa requête. C'est le trou que `P-35` décrit : un contrat émis d'un côté,
		   jamais honoré de l'autre.
		   Le champ est posé DIRECTEMENT plutôt que passé en propriété : le titre
		   n'est pas un état de départ que le serveur décide, c'est une amorce que
		   l'utilisateur va récrire — et `src/vues/` ne se touche pas (`ARB-063`). */
		const titreDemande = page.url.searchParams.get('titre');
		const champTitre = formulaire.querySelector<HTMLTextAreaElement>('#titre');
		if (titreDemande !== null && titreDemande !== '' && champTitre !== null) {
			champTitre.value = titreDemande;
		}

		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		/* LE NŒUD ENTRE LES DEUX CÂBLAGES. L'éditeur est monté AVANT les gestes —
		   il prend la zone du gel, que les gestes interrogent ensuite — et il ne
		   peut donc pas se référer à eux à sa construction. Le renvoi est différé
		   par cette variable : c'est ce qui fait passer le témoin de sauvegarde à
		   « Modifications non enregistrées » à la première frappe. */
		let gestes: GestesCables | null = null;
		const editeur =
			zone === null
				? null
				: monterLEditeur(zone, null, formulaire, {
						surChangement: () => gestes?.signalerUneModification()
					});
		const defaire = cablerLEditeur(formulaire, {
			rechargerSurDomaine: (domaine) => `/notes/nouvelle?domaine=${encodeURIComponent(domaine)}`,
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		gestes = cablerLesGestesDEdition(formulaire, {
			document: () => editeur?.document() ?? DOCUMENT_VIDE,
			resoudre: resolveurDuCorpusServi(data.notes)
			/* « Annuler » ramène à la page précédente : une note qui n'existe pas
			   encore n'a pas d'adresse où revenir, et en inventer une serait
			   décider d'une navigation qu'aucune source ne porte. */
		});
		const defaireLeChoix =
			editeur === null
				? () => undefined
				: cablerLeChoixDeDepart(formulaire, {
						templates: data.templates,
						inserer: (document) => editeur.inserer(document),
						demande: data.templateDemande
					});
		return () => {
			defaireLeChoix();
			gestes?.defaire();
			defaire();
			editeur?.detruire();
		};
	});
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
