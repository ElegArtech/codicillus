<script lang="ts">
	/**
	 * `/notes/{identifiant}` — V-14 Lecture d'une note.
	 *
	 * LOT T-033, « le câblage ». La vue ne change pas : elle reçoit ses deux
	 * propriétés, et l'une des deux vient de la BASE — `notes` est le corpus
	 * lisible par l'appelant, plus le fichier de constantes.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait. C'est le fondement d'`ARB-063`.
	 *
	 * CE QUE `data.lecture` PORTE ET QUE RIEN NE MONTRE. Le chargeur rend la note
	 * réelle, son corps rendu par `rendreDocument` et ses rétroliens déduits.
	 * `src/vues/V-14.svelte` ne déclare aucune propriété pour les recevoir : son
	 * article est la transcription gelée de `n-restaurer-pg`. `ARB-063` §5 ferme
	 * `src/vues/` pour cette campagne ; l'écart reste déclaré, entier.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LA SUPPRESSION EST CÂBLÉE, ET SA CONFIRMATION EST CHIFFRÉE
	 *
	 * `RG-M04-10` (`CDC:635`) : la suppression « est confirmée par une boîte de
	 * dialogue rappelant le titre, le nombre de rétroliens qui deviendront
	 * cassés, et le nombre de versions perdues ». Les trois quantités sont
	 * SERVIES par le chargeur — `lecture.note.titre`, `lecture.retroliens`,
	 * `histoire.versions` — et composées ci-dessous : rien n'est compté à
	 * l'écran, rien n'est estimé.
	 *
	 * La FORME de la confirmation est un écart déclaré, et il est nommé dans
	 * `$lib/cablage/formulaires.ts` : le gel porte un dialogue pour ce geste
	 * (`V-40:510-549`), V-14 ne le transcrit pas, et le monter demanderait de
	 * toucher `src/vues/`. Le fond de la règle est tenu — rien n'est détruit sans
	 * un rappel chiffré —, la forme ne l'est pas.
	 *
	 * Le bouton n'est rendu qu'en écriture (`V-14:369`, sous `{#if ecriture}`) :
	 * `P-09` est servie par la vue, et le refus serveur ne dépend pas d'elle.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-14.svelte';
	import '../../../vues/V-14.css';
	import { cablerLaSuppression } from '$lib/cablage/formulaires';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/** Les trois quantités de `RG-M04-10`, telles que le chargeur les sert. */
	const rappel = $derived(
		[
			`Supprimer « ${data.lecture.note.titre} » ?`,
			'',
			`${data.lecture.retroliens.length} rétrolien(s) deviendront cassés.`,
			`${data.histoire.versions.length} version(s) seront perdues.`,
			'',
			'La suppression est définitive : il n’y a pas de corbeille.'
		].join('\n')
	);

	let formulaire: HTMLFormElement;

	onMount(() => cablerLaSuppression(formulaire, { rappel }));
</script>

<form method="POST" action="?/supprimer" bind:this={formulaire} style="display:contents">
	<Vue vecteur={data.vecteur} notes={data.notes} />
</form>
