<script lang="ts">
	/**
	 * `/notes/{identifiant}/operationnel` — V-18 Éditeur du registre Opérationnel. La
	 * vue reçoit la note lue et ses deux corps rendus par `rendreDocument` (`ADR-004`).
	 *
	 * L'ÉDITEUR EST LE MÊME QUE CELUI DE LA RÉFÉRENCE — `monterLEditeur()`, monté sur
	 * le `#redaction` du gel par l'option `mount` de ProseMirror, qui ne crée aucun
	 * nœud. « Même éditeur, mêmes constructions, mêmes droits » (`M05.9`) est vrai au
	 * sens strict : c'est le même module, appelé de la même façon.
	 *
	 * `data.corps` porte le DOCUMENT canonique du registre édité — la matière de
	 * l'éditeur, distincte du HTML rendu que porte `affichee`. Il entre par
	 * `noeudDepuisDocument()` et ressort par `documentDepuisNoeud()`.
	 *
	 * LES GESTES D'AFFICHAGE DU GEL RESTENT INERTES — bascule du panneau de Référence,
	 * prévisualisation, « Annuler » : aucun n'appartient aux trois actions que `M05.9`
	 * nomme.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-18.svelte';
	import '../../../../vues/V-18.css';
	import { page } from '$app/state';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import {
		cablerLesGestesDEdition,
		resolveurDuCorpusServi,
		DOCUMENT_VIDE,
		type GestesCables
	} from '$lib/edition/gestes';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { cablerLOperationnel } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let formulaire: HTMLFormElement;

	/**
	 * L'ORDRE DES TROIS GESTES COMPTE. L'éditeur d'abord : il prend la zone du gel et
	 * y pose le document, et `cablerLEditeur()` ne doit surtout pas la réécrire — il
	 * ne pose le corps que lorsqu'AUCUN éditeur ne lui est déclaré, ce que l'option
	 * `editeur` lui dit ici. Le câblage des trois actions ensuite : il nomme l'action
	 * du formulaire, qu'emploiera le premier `Ctrl` `S`, et neutralise les deux
	 * boutons d'action de registre après le câblage général.
	 */
	onMount(() => {
		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		const adresse = adresseDeNote(page.params['identifiant'] ?? '');
		/* LE NŒUD ENTRE LES CÂBLAGES — voir `/notes/nouvelle`, même raison. */
		let gestes: GestesCables | null = null;
		const editeur =
			zone === null
				? null
				: monterLEditeur(zone, data.corps, formulaire, {
						surChangement: () => gestes?.signalerUneModification()
					});
		const defaireLEditeur = cablerLEditeur(formulaire, {
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		const defaireLesActions = cablerLOperationnel(formulaire, {
			adresseDeLaNote: adresse,
			...(editeur === null ? {} : { inserer: (document) => editeur.inserer(document) })
		});
		gestes = cablerLesGestesDEdition(formulaire, {
			document: () => editeur?.document() ?? data.corps ?? DOCUMENT_VIDE,
			resoudre: resolveurDuCorpusServi(data.notes),
			retour: adresse
		});
		return () => {
			gestes?.defaire();
			defaireLesActions();
			defaireLEditeur();
			editeur?.detruire();
		};
	});
</script>

<form method="POST" bind:this={formulaire} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		affichee={data.affichee}
		desynchronisation={data.desynchronisation}
	/>
</form>
