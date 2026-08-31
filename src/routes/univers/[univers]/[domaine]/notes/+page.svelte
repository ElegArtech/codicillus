<script lang="ts">
	/**
	 * `/univers/{univers}/{domaine}/notes` — V-12 Liste des notes. Le chargeur porte
	 * la résolution d'adresse, l'exigence du module `notes` (RG-STR-06), le
	 * périmètre et les droits — et, depuis `lireLaListeDeNotes()`, la restriction au
	 * domaine, les six facettes, l'ordre et la page.
	 */
	import Vue from '../../../../../vues/V-12.svelte';
	import '../../../../../vues/V-12.css';
	import { onMount } from 'svelte';
	import { cablerLesFacettes } from '$lib/cablage/facettes';
	import { FACETTES_DE_NOTE } from '$lib/liste/facettes';
	import { cablerLaListeDeNotes } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LES SIX FACETTES, DÉCLARÉES UNE SEULE FOIS DANS LE PRODUIT. Elles l'étaient à
	 * trois endroits — ici, dans la vue et dans le chargeur — et la liste recopiée
	 * décide de la CLÉ D'ADRESSE qu'un clic écrit : un contrat de données recopié
	 * dans deux modules diverge en silence (`P-35`).
	 */
	const FACETTES = FACETTES_DE_NOTE;

	onMount(() => {
		const defaireLesFacettes = cablerLesFacettes(enveloppe, { facettes: FACETTES });
		const defaireLaListe = cablerLaListeDeNotes(enveloppe, {
			domaine: String(data.vecteur.dom),
			facettes: FACETTES.map((f) => f.id)
		});
		return () => {
			defaireLaListe();
			defaireLesFacettes();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<!-- `exactOptionalPropertyTypes` : une propriété OPTIONNELLE n'accepte pas
	     `undefined` comme valeur — elle accepte d'être ABSENTE. Les deux ne se
	     confondent pas, et c'est la garantie qui fait que la vue retombe sur la
	     dérivation du gel plutôt que sur une valeur vide. -->
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		domaines={data.domaines}
		total={data.total}
		nombre={data.nombre}
		facettes={data.facettes}
		retenues={data.retenues}
		pagination={data.pagination}
		{...data.tri === undefined ? {} : { tri: data.tri }}
		modifications={data.modifications}
	/>
</div>
