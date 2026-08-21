<script lang="ts">
	/**
	 * `/notes/{identifiant}/modifier` — V-17 Éditeur d'une note, modification.
	 *
	 * La vue ne change pas. Six de ses propriétés viennent de la base : le corpus
	 * lisible par l'appelant, la NOTE REPRISE — celle que l'adresse désigne, et
	 * non plus celle du gel —, et les trois référentiels de saisie.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict. C'est le fondement
	 * d'`ARB-063`.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LE CORPS RÉDIGÉ ENTRE ENFIN DANS L'ÉCRAN, ET PAR LE CONVERTISSEUR UNIQUE
	 *
	 * `data.corps` porte le document canonique du registre Référence, validé par
	 * la porte unique du format. `src/vues/V-17.svelte` ne déclare aucune
	 * propriété qui le recevrait — la vue le dit elle-même —, et `ARB-063` §5
	 * ferme `src/vues/` pour cette campagne. Le corps est donc posé dans la zone
	 * de rédaction APRÈS le montage, par le câblage, exactement comme les champs
	 * cachés du formulaire : c'est le même geste, au même endroit, pour la même
	 * raison.
	 *
	 * La sérialisation passe par `serialiserEnMarkdown()`, le convertisseur
	 * unique (`verif:convertisseur` en interdit un second). Le texte posé est
	 * celui-là même que la soumission renverra si rien n'est frappé, et
	 * `pnpm test:aller-retour` est ce qui rend cette phrase vraie.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CE QUE CET ÉCRAN NE PROPOSE PAS ENCORE
	 *
	 * Le sélecteur de domaine ne recharge PAS : déplacer une note exige le droit
	 * de rédaction sur le dossier d'origine ET sur celui de destination
	 * (`RG-M05-09`, `CDC:752`), et l'arborescence rendue est celle du domaine
	 * courant. Le déplacement se soumet donc, mais il ne s'explore pas depuis cet
	 * écran. Écart déclaré.
	 *
	 * `horsDePorteeDeLEditeur` reste non montré : la liste est vide quand la note
	 * s'ouvre entière, et aucun nœud du gel ne l'accueillerait autrement.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-17.svelte';
	import '../../../../vues/V-17.css';
	import { page } from '$app/state';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import {
		cablerLesGestesDEdition,
		resolveurDuCorpusServi,
		DOCUMENT_VIDE,
		type GestesCables,
		peindreLeRefusDEdition
	} from '$lib/edition/gestes';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();

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
	 * L'ÉDITEUR REÇOIT LE DOCUMENT CANONIQUE, pas une transposition.
	 *
	 * `data.corps` est ce que la base porte, validé par la porte unique du
	 * format. Il entre dans l'éditeur par `noeudDepuisDocument()` et en ressort
	 * par `documentDepuisNoeud()` : ce qui est réenregistré sans une frappe est
	 * identique à ce qui a été ouvert.
	 */
	onMount(() => {
		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		/* LE NŒUD ENTRE LES DEUX CÂBLAGES — voir `/notes/nouvelle`, même raison :
		   l'éditeur est monté avant les gestes et ne peut pas s'y référer. */
		let gestes: GestesCables | null = null;
		const editeur =
			zone === null
				? null
				: monterLEditeur(zone, data.corps, formulaire, {
						surChangement: () => gestes?.signalerUneModification()
					});
		const defaire = cablerLEditeur(formulaire, {
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		gestes = cablerLesGestesDEdition(formulaire, {
			document: () => editeur?.document() ?? data.corps ?? DOCUMENT_VIDE,
			resoudre: resolveurDuCorpusServi(data.notes),
			/* « Annuler » ramène à la LECTURE de la note qu'on modifiait — la
			   destination que `docs/routes.md` donne à cette famille, et celle
			   qu'un enregistrement réussi emprunte déjà. */
			retour: adresseDeNote(page.params['identifiant'] ?? '')
		});
		return () => {
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
		noteModifiee={data.noteModifiee}
		typesNote={data.typesNote}
		typesFiche={data.typesFiche}
		templates={data.templates}
		dernierEnregistrement={data.dernierEnregistrement}
	/>
</form>
