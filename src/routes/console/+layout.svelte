<script lang="ts">
	/**
	 * `/console` — LE GABARIT NE REND RIEN, IL POSE UN CONTEXTE.
	 *
	 * Les dix écrans de console montent chacun leur vue en pleine page ; ce
	 * gabarit n'ajoute donc aucun nœud, et le balisage servi est à l'octet celui
	 * que les maquettes posent. Sa seule raison d'être est de faire descendre les
	 * sept compteurs de `aside.nav2` jusqu'à `NavigationConsole.svelte`, que six
	 * vues montent directement et que `CoquilleDeConsole.svelte` monte pour les
	 * autres — `$lib/console/effectifs.ts` porte le motif.
	 *
	 * LES MEMBRES SONT DES ACCESSEURS, comme au gabarit racine : le contexte est
	 * posé une fois, et il suit une navigation d'une section à l'autre sans être
	 * réémis.
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
		}
	});
</script>

{@render children()}
