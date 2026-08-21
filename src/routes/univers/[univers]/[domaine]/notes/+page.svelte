<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/notes` — V-12 Liste des notes.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur et les notes viennent de `+page.server.ts`, qui porte la
	 * résolution d'adresse, l'exigence du module `notes` (RG-STR-06), le
	 * périmètre et les droits.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../../../vues/V-12.svelte';
	import '../../../../../vues/V-12.css';
	import { onMount } from 'svelte';
	import { cablerLesFacettes } from '$lib/cablage/facettes';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LES SIX FACETTES DU GEL, DANS SON ORDRE — c'est le rang qui les identifie,
	 * pas leur libellé : le bouton porte le nom suivi de son compteur.
	 */
	onMount(() =>
		cablerLesFacettes(enveloppe, {
			facettes: [
				{ id: 'type', nom: 'Type' },
				{ id: 'fraicheur', nom: 'Fraîcheur' },
				{ id: 'statut', nom: 'Statut' },
				{ id: 'dossier', nom: 'Dossier' },
				{ id: 'auteur', nom: 'Auteur' },
				{ id: 'etiquette', nom: 'Étiquette', prefixe: '#' }
			]
		})
	);
</script>

<div bind:this={enveloppe} style="display:contents">
	<!-- `exactOptionalPropertyTypes` : une propriété OPTIONNELLE n'accepte pas
	     `undefined` comme valeur — elle accepte d'être ABSENTE. Les deux ne se
	     confondent pas, et c'est la garantie qui fait que la vue retombe sur la
	     dérivation du gel plutôt que sur une valeur vide. -->
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		{...data.retenues === undefined ? {} : { retenues: data.retenues }}
		{...data.tri === undefined ? {} : { tri: data.tri }}
	/>
</div>
