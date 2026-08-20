<script lang="ts">
	/**
	 * `/console/analytique` — V-34 Console · Analytique.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * LE VECTEUR VIENT DU SERVEUR, ET IL PORTE `P-02`. Le produit n'a aucune des
	 * cinq mesures que cet écran calcule ; le chargeur demande donc l'état neutre
	 * explicite que le gel porte lui-même — voir son en-tête pour le
	 * raisonnement complet et le recensement des lacunes.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il atteint la vue par le mode de
	 * conception, qui rend le composant directement et lui passe le vecteur du
	 * scénario. Rien de ce fichier n'entre dans son verdict, et `pnpm test:vide`
	 * n'en dépend pas davantage — il mesure la vue, pas la route.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-34.svelte';
	import '../../../vues/V-34.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
