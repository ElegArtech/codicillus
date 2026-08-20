<script lang="ts">
	/**
	 * `/console/types-de-fiches` — V-29 Console · Types de fiches.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes
	 * viennent de la base. LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue
	 * par le mode de conception, qui rend le composant directement.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-29.svelte';
	import '../../../vues/V-29.css';
	import { envoyerAUneAction } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — voir
	`/console/domaines` pour le motif.

	DEUX GESTES, ET LE SECOND EST CELUI QUE LE REFUS PROPOSE. `RG-M14-06` refuse
	la suppression d'un type employé, et exige que le refus porte une sortie : le
	gel l'offre en « Délester ces N notes »
	(`mockups/V-29-console-types-fiches.html:3464`), et `P-03` interdit qu'elle
	soit inerte. Les deux désignent le type par son identifiant lisible, lu en
	base — un libellé se renomme, un identifiant est stable.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	typesFiche={data.typesFiche}
	onSupprimer={(type) => {
		const identifiant = data.designations[type];
		if (identifiant === undefined) return;
		void envoyerAUneAction(document, '?/supprimer', { 'type-de-fiche': identifiant });
	}}
	onDelester={(type) => {
		const identifiant = data.designations[type];
		if (identifiant === undefined) return;
		void envoyerAUneAction(document, '?/delester', { 'type-de-fiche': identifiant });
	}}
/>
