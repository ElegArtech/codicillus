<script lang="ts">
	/**
	 * `/notes/{identifiant}/operationnel` — V-18 Éditeur du registre Opérationnel.
	 *
	 * La vue ne change pas. Elle reçoit la note lue et ses deux corps rendus par
	 * l'implémentation unique de `rendreDocument` (`ADR-004`), plus la date et
	 * l'auteur que le bandeau de `RG-M06-08` nomme.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LA DEUXIÈME SINGULARITÉ DU PRODUIT S'ÉCRIT ENFIN
	 *
	 * Cet écran montrait les deux registres et n'en écrivait aucun : la zone de
	 * rédaction était un `contenteditable` inerte, et la barre d'outils du gel
	 * sans commande derrière. L'éditeur est le MÊME que celui de la Référence —
	 * `monterLEditeur()`, monté sur le `#redaction` du gel par l'option `mount` de
	 * ProseMirror, qui ne crée aucun nœud. « Même éditeur, mêmes constructions,
	 * mêmes droits que l'édition du corps Référence » (`M05.9`), et c'est vrai au
	 * sens strict : c'est le même module, appelé de la même façon.
	 *
	 * `data.corps` porte le DOCUMENT canonique du registre édité — la matière de
	 * l'éditeur, distincte du HTML rendu que porte `affichee`. Il entre par
	 * `noeudDepuisDocument()` et ressort par `documentDepuisNoeud()` : ce qui est
	 * réenregistré sans une frappe est identique à ce qui a été ouvert.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CE QUE CET ÉCRAN NE PROPOSE TOUJOURS PAS, ET QUI EST DÉCLARÉ
	 *
	 * Les gestes d'affichage du gel restent inertes — bascule et mise côte à côte
	 * du panneau de Référence, prévisualisation, « Annuler », « Modifier la
	 * Référence », « Reprendre le plan de la Référence ». Ils l'étaient avant ce
	 * lot, ils le sont chez le voisin V-17, et aucun n'appartient aux trois
	 * actions que `M05.9` nomme. Les câbler ici serait décider hors contrat.
	 *
	 * `horsDePorteeDeLEditeur` reste non montré : la liste est vide quand la note
	 * s'ouvre entière, et aucun nœud du gel ne l'accueillerait autrement.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../../vues/V-18.svelte';
	import '../../../../vues/V-18.css';
	import { cablerLEditeur } from '$lib/cablage/formulaires';
	import { monterLEditeur } from '$lib/edition/editeur-client';
	import { cablerLOperationnel } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let formulaire: HTMLFormElement;

	/**
	 * L'ORDRE DES TROIS GESTES COMPTE.
	 *
	 * L'éditeur d'abord : il prend la zone du gel et y pose le document, et le
	 * câblage du formulaire ne doit surtout pas la réécrire — `cablerLEditeur()`
	 * ne pose le corps que lorsqu'AUCUN éditeur ne lui est déclaré, ce que
	 * l'option `editeur` lui dit ici.
	 *
	 * Le câblage des trois actions ensuite : il nomme l'action du formulaire, que
	 * `cablerLEditeur()` emploiera au premier `Ctrl` `S`, et il neutralise les
	 * deux boutons d'action de registre après que le câblage général a neutralisé
	 * les autres.
	 */
	onMount(() => {
		const zone = formulaire.querySelector<HTMLElement>('#redaction');
		const editeur = zone === null ? null : monterLEditeur(zone, data.corps, formulaire);
		const defaireLEditeur = cablerLEditeur(formulaire, {
			...(editeur === null ? {} : { editeur: () => editeur.document() })
		});
		const defaireLesActions = cablerLOperationnel(formulaire);
		return () => {
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
