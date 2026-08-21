<script lang="ts">
	/**
	 * `/cartographie` — V-19 Cartographie.
	 *
	 * Ce fichier rend la vue avec ce que son chargeur a lu en base, et lui donne
	 * ses gestes. Le vecteur, les notes, les relations et le périmètre viennent
	 * de `+page.server.ts`, qui porte le périmètre de droits et l'état de zone.
	 * `T-070` l'avait posé sans chargeur — « pas de garde de droit, pas de
	 * chargeur » —, et il servait le jeu de semence à tout connecté ; `T-037` le
	 * branche sur la base.
	 *
	 * LES ARÊTES VIENNENT DE LA TABLE `relations`, PLUS DU JEU DE SEMENCE. Les
	 * trois propriétés de relation de `src/vues/V-19.svelte` sont optionnelles
	 * et retombent, si rien ne leur est passé, sur les constantes du jeu ; les
	 * nourrir ici est ce qui fait de cette page la cartographie du corpus réel.
	 * Le mode de conception, lui, ne passe que `vecteur` et `notes` : le rendu
	 * du banc de comparaison est inchangé, à l'octet.
	 *
	 * LE COMPORTEMENT VIT DANS `cablage.ts`, VOISIN DE CE FICHIER — `ARB-063`,
	 * et le motif de `src/routes/console/cablage.ts`. La vue ne porte aucun
	 * gestionnaire ; la route les accroche par identifiant et par sélecteur,
	 * après le montage.
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
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { cablerLaCartographie } from './cablage';

	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/**
	 * LE PÉRIMÈTRE QUE « RÉDUIRE LE PÉRIMÈTRE » PROPOSE — `V-19:3131`.
	 *
	 * Le gel pose `domaine|Applications`, un nom de son jeu de semence. Le
	 * produit n'a pas de domaine garanti : le premier domaine effectivement
	 * présent dans le périmètre lisible est pris, et le bouton reste inopérant
	 * s'il n'y en a aucun. C'est l'intention du gel — retomber sur UN domaine,
	 * le plus petit périmètre proposé — sans en recopier le nom.
	 */
	const perimetreReduit = $derived.by(() => {
		const domaine = data.notes[0]?.domaine;
		return domaine === undefined ? null : `domaine|${domaine}`;
	});

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

		const debrancher = cablerLaCartographie(enveloppe, {
			perimetreCourant: data.perimetreDemande,
			adresseParType: resolve('/cartographie/par-type'),
			adresseDesRelations:
				data.premiereNote === null ? null : `${adresseDeNote(data.premiereNote)}/relations`,
			perimetreReduit
		});

		return () => {
			enveloppe.removeEventListener('click', aller);
			debrancher();
		};
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<!-- `domaines` vient du GABARIT RACINE, qui les lit en base : la propriété de
	     la vue retombe sinon sur `DOMAINES` du jeu de semence, et le sélecteur
	     proposait des domaines inexistants — mesuré sur une instance neuve, il
	     offrait « Production › Infrastructure » à une base qui n'en a jamais eu. -->
	<Vue
		domaines={page.data.domaines}
		vecteur={data.vecteur}
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
		perimetreDemande={data.perimetreDemande}
	/>
</div>
