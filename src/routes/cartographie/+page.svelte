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
	 * `data.relations` N'EST PAS PASSÉE À LA VUE, ET C'EST UN ÉCART DÉCLARÉ.
	 * `src/vues/V-19.svelte` n'expose que `vecteur` et `notes` ; ses arêtes
	 * viennent encore de la constante du jeu de semence, par
	 * `$lib/graphe/cartographie`. Ce lot n'écrit dans aucun fichier de
	 * `src/vues/` — cinq lots y travaillent en parallèle —, et la propriété
	 * manquante est remontée plutôt qu'ajoutée.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../vues/V-19.svelte';
	import '../../vues/V-19.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
