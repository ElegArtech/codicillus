<script lang="ts">
	/**
	 * `/cartographie` — V-19 Cartographie.
	 *
	 * Ce fichier rend la vue avec ce que son chargeur a lu en base, et lui donne ses
	 * gestes. Le périmètre de droits et l'état de zone viennent de `+page.server.ts`.
	 *
	 * LES ARÊTES VIENNENT DE LA TABLE `relations`, PLUS DU JEU DE SEMENCE. Les trois
	 * propriétés de relation étaient OPTIONNELLES et retombaient sur les constantes
	 * du jeu quand rien ne leur était passé : cette page-ci les nourrissait, mais
	 * rien n'obligeait la suivante à le faire. Elles sont EXIGÉES, avec les univers
	 * et les domaines, et c'est le compilateur qui garde la porte.
	 *
	 * LE COMPORTEMENT VIT DANS `cablage.ts`, VOISIN DE CE FICHIER (`ARB-063`) : la
	 * vue ne porte aucun gestionnaire, la route les accroche après le montage.
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
	 * LE PÉRIMÈTRE QUE « RÉDUIRE LE PÉRIMÈTRE » PROPOSE. Le gel pose
	 * `domaine|Applications`, un nom de son jeu de semence ; le produit n'a pas de
	 * domaine garanti. Le premier domaine effectivement présent dans le périmètre
	 * lisible est pris, et le bouton reste inopérant s'il n'y en a aucun — l'intention
	 * du gel sans en recopier le nom.
	 */
	const perimetreReduit = $derived.by(() => {
		const domaine = data.notes[0]?.domaine;
		return domaine === undefined ? null : `domaine|${domaine}`;
	});

	/**
	 * LES DEUX ONGLETS DE LA CARTOGRAPHIE ne faisaient rien, alors que le produit
	 * porte DEUX routes pour eux. Le gel les pose en `role="tab"` avec `data-vue`,
	 * sans comportement (`ARB-011`).
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
	<!-- `univers` ET `domaines` viennent du GABARIT RACINE, qui les lit en base :
	     les propriétés de la vue retombent sinon sur `UNIVERS` et `DOMAINES` du
	     jeu de semence, et le sélecteur proposait des rangements inexistants —
	     mesuré sur une instance neuve, il offrait « Production › Infrastructure »
	     à une base qui n'en a jamais eu.

	     LA MOITIÉ UNIVERS DU MÊME SÉLECTEUR AVAIT ÉTÉ OUBLIÉE, et c'est pire que
	     pour les domaines : le menu mélangeait une moitié réelle et une moitié
	     fictive. Sur une base dont la table des univers ne porte que celui-ci, il
	     offrait encore « Univers Projets » ; le choisir menait à un graphe vide
	     sous le voile « Aucune relation dans ce périmètre » — faux, puisque c'est
	     le périmètre qui n'existe pas. Symétriquement, un univers créé en console
	     n'était jamais proposé.

	     DEUX VOIES EXISTAIENT, ET C'EST LA PROPRIÉTÉ QUI EST RETENUE. V-20 lit le
	     contexte de coquille et ne déclare pas la propriété ; V-19, elle, la
	     déclare déjà et n'appelle jamais `getContext` — la lui passer ici est la
	     ligne symétrique de celle des domaines, dans le fichier même où l'oubli a
	     eu lieu, et ne touche ni la vue ni le chargeur. Le gabarit racine filtre
	     déjà les univers au périmètre lisible de l'appelant. -->
	<Vue
		univers={page.data.univers}
		domaines={page.data.domaines}
		vecteur={data.vecteur}
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
		perimetreDemande={data.perimetreDemande}
	/>
</div>
