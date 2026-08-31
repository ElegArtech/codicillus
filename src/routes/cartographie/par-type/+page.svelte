<script lang="ts">
	/**
	 * `/cartographie/par-type` — V-20 Cartographie par type maître. On y arrive par
	 * la bascule de V-19 ; le segment porte le mode d'affichage exigé par
	 * `RG-M09-05`.
	 *
	 * LES ARÊTES VIENNENT DE LA TABLE `relations`, comme à `/cartographie` et par le
	 * même chemin de lecture : la bascule change le mode d'affichage, jamais le
	 * corpus. Les trois propriétés de relation étaient OPTIONNELLES et retombaient
	 * sur les constantes du jeu de semence ; elles sont EXIGÉES, et le compilateur
	 * garde la porte.
	 *
	 * LE RÉFÉRENTIEL DE FICHE EST EXIGÉ à son tour ; les valeurs restent
	 * optionnelles, une fiche sans propriété enregistrée étant un cas ordinaire.
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
	 * LES DEUX ONGLETS DE LA CARTOGRAPHIE ne faisaient rien, alors que le produit
	 * porte DEUX routes pour eux. Le gel les pose en `role="tab"` avec `data-vue`,
	 * sans comportement (`ARB-011`) ; la route le leur donne, et la navigation est
	 * une vraie navigation, donc partageable.
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
		 * LES TROIS OUTILS DE `div.outils-graphe` — les mêmes qu'en V-19, et par le
		 * même code : `cablerLaVue()` écrit la transformation de `g#racine`, l'attribut
		 * que le gel y pose déjà. Ils sont ici et non dans la vue parce qu'ils n'agissent
		 * que sur le DOM rendu, sans rien devoir au graphe (`ARB-063`).
		 *
		 * LE SÉLECTEUR DE PÉRIMÈTRE MONTRE CE QUE L'ADRESSE PORTE : le gel n'écrit aucun
		 * `selected`, et le poser au balisage ferait diverger le document servi.
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
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
		typesFiche={data.typesFiche}
		proprietesDeFiche={data.proprietesDeFiche}
		perimetreDemande={data.perimetreDemande}
		typeMaitreDemande={data.typeMaitreDemande}
		centreDemande={data.centreDemande}
		familles={data.familles}
	/>
</div>
