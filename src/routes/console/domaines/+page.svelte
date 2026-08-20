<script lang="ts">
	/**
	 * `/console/domaines` — V-28 Console · Domaines.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES — un
	 * 404 d'absence, jamais une décision de refus (`RA-01`). `T-036` la monte
	 * avec sa garde : le rôle administrateur est éprouvé côté serveur par
	 * `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes, les
	 * univers, les domaines, leur détail — description et modules activés — et
	 * l'utilisateur courant viennent tous de la base. LE BANC NE PASSE JAMAIS PAR
	 * ICI : il atteint la vue par le mode de conception, qui rend le composant
	 * directement.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-28.svelte';
	import '../../../vues/V-28.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	detailDomaines={data.detailDomaines}
/>
