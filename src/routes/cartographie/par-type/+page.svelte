<script lang="ts">
	/**
	 * `/cartographie/par-type` — V-20 Cartographie par type maître.
	 *
	 * Ce fichier ne fait que rendre la vue avec ce que son chargeur a lu en base.
	 * Aucune entrée de navigation ne vise cette adresse : on y arrive par la
	 * bascule « Par type maître » de V-19, et le segment porte le mode
	 * d'affichage exigé par `RG-M09-05` (`docs/routes.md:267`).
	 *
	 * `data.relations` n'est pas passée à la vue : `src/vues/V-20.svelte` n'expose
	 * que `vecteur` et `notes`. Écart déclaré au rapport du lot.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la sert.
	 * Elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import Vue from '../../../vues/V-20.svelte';
	import '../../../vues/V-20.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
