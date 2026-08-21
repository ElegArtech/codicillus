<script lang="ts">
	/**
	 * `/cartographie` — V-19 Cartographie.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Le vecteur, les notes et les relations viennent de `+page.server.ts`, qui
	 * porte le périmètre de droits et l'état de zone. `T-070` l'avait posé sans
	 * chargeur — « pas de garde de droit, pas de chargeur » —, et il servait le
	 * jeu de semence à tout connecté ; `T-037` le branche sur la base.
	 *
	 * LES ARÊTES VIENNENT DE LA TABLE `relations`, PLUS DU JEU DE SEMENCE. Les
	 * trois propriétés de relation de `src/vues/V-19.svelte` sont optionnelles
	 * et retombent, si rien ne leur est passé, sur les constantes du jeu ; les
	 * nourrir ici est ce qui fait de cette page la cartographie du corpus réel.
	 * Le mode de conception, lui, ne passe que `vecteur` et `notes` : le rendu
	 * du banc de comparaison est inchangé, à l'octet.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../vues/V-19.svelte';
	import '../../vues/V-19.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LES DEUX ONGLETS DE LA CARTOGRAPHIE — « Vue complète » et « Par type
	 * maître » — ne faisaient rien, alors que le produit porte DEUX routes pour
	 * eux : `/cartographie` et `/cartographie/par-type`. Le gel les pose en
	 * `role="tab"` avec `data-vue`, sans comportement (`ARB-011`) ; la route le
	 * leur donne, et la navigation est une vraie navigation, donc partageable.
	 */
	onMount(() => {
		const aller = (evenement: Event): void => {
			const onglet = (evenement.target as Element | null)?.closest('[data-vue]');
			if (onglet === null || onglet === undefined) return;
			evenement.preventDefault();
			const vue = (onglet as HTMLElement).dataset['vue'];
			location.assign(
				vue === 'maitre' ? resolve('/cartographie/par-type') : resolve('/cartographie')
			);
		};
		enveloppe.addEventListener('click', aller);
		return () => enveloppe.removeEventListener('click', aller);
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
	/>
</div>
