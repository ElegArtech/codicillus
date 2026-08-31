<script lang="ts">
	/**
	 * `/console` — LE GABARIT NE REND RIEN, IL POSE UN CONTEXTE.
	 *
	 * Les écrans de console montent chacun leur vue en pleine page ; ce gabarit n'ajoute
	 * aucun nœud. Sa seule raison d'être est de faire descendre les huit compteurs de
	 * `aside.nav2` jusqu'à `NavigationConsole.svelte`.
	 *
	 * LES MEMBRES SONT DES ACCESSEURS, comme au gabarit racine : le contexte est posé
	 * une fois, et il suit une navigation d'une section à l'autre sans être réémis.
	 */
	import { setContext } from 'svelte';
	import { CLE_EFFECTIFS, type EffectifsDeConsole } from '$lib/console/effectifs';
	import type { LayoutData } from './$types';

	const { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	setContext<EffectifsDeConsole>(CLE_EFFECTIFS, {
		get univers() {
			return data.effectifs.univers;
		},
		get domaines() {
			return data.effectifs.domaines;
		},
		get notes() {
			return data.effectifs.notes;
		},
		get fiches() {
			return data.effectifs.fiches;
		},
		get relations() {
			return data.effectifs.relations;
		},
		get templates() {
			return data.effectifs.templates;
		},
		get comptes() {
			return data.effectifs.comptes;
		},
		get imports() {
			return data.effectifs.imports;
		}
	});
</script>

{@render children()}
