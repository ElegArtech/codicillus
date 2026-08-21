<script lang="ts">
	/**
	 * `/cartographie/par-type` — V-20 Cartographie par type maître.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Aucune entrée de navigation ne vise cette adresse : on y arrive par la
	 * bascule « Par type maître » de V-19, et le segment porte le mode
	 * d'affichage exigé par `RG-M09-05` (`docs/routes.md:267`).
	 *
	 * LES ARÊTES VIENNENT DE LA TABLE `relations`, comme à `/cartographie` et par
	 * le même chemin de lecture : la bascule change le mode d'affichage, jamais
	 * le corpus. Les trois propriétés de relation de `src/vues/V-20.svelte` sont
	 * optionnelles et retombent sur les constantes du jeu de semence quand rien
	 * ne leur est passé — le rendu du banc de comparaison est donc inchangé.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../../vues/V-20.svelte';
	import '../../../vues/V-20.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Attaches, cablerLaVue } from '$lib/graphe/commandes';

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

		/**
		 * LES TROIS OUTILS DE `div.outils-graphe` — les mêmes qu'en V-19, et par
		 * le même code : `cablerLaVue()` écrit la transformation de `g#racine`,
		 * l'attribut que le gel y pose déjà. Ils sont ici et non dans la vue
		 * parce qu'ils n'agissent que sur le DOM rendu, sans rien devoir au
		 * graphe (`ARB-063`).
		 *
		 * LE SÉLECTEUR DE PÉRIMÈTRE MONTRE CE QUE L'ADRESSE PORTE. Le gel n'écrit
		 * aucun `selected` sur ses `<option>` ; le poser au balisage ferait
		 * diverger le document servi de la référence pour un effet que cette
		 * ligne obtient sans y toucher.
		 */
		const attaches = new Attaches();
		cablerLaVue(enveloppe, attaches);
		const perimetre = enveloppe.querySelector<HTMLSelectElement>('#perimetre');
		if (perimetre !== null) perimetre.value = data.perimetreDemande;

		return () => {
			enveloppe.removeEventListener('click', aller);
			attaches.debranchement()();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<Vue
		vecteur={data.vecteur}
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
		perimetreDemande={data.perimetreDemande}
		typeMaitreDemande={data.typeMaitreDemande}
		centreDemande={data.centreDemande}
	/>
</div>
