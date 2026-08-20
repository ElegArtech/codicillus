<script lang="ts">
	/**
	 * `/mon-profil` — V-25, les quatre onglets.
	 *
	 * L'onglet est dans l'adresse (`?onglet=`, `docs/routes.md:283`) et le
	 * vecteur est composé par `vecteurDeV25()`, à un seul endroit. Aucune
	 * décision n'est prise ici : la garde de session est aux hooks, le verrou de
	 * `RG-M16-02` vient de la base, et le périmètre de lecture de
	 * `resolution.ts`.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../vues/V-25.svelte';
	import '../../vues/V-25.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} notes={data.notes} />
