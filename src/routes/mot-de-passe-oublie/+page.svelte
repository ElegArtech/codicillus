<script lang="ts">
	/**
	 * `/mot-de-passe-oublie` — V-06.
	 *
	 * UNE SEULE ADRESSE. `…/{jeton}` rendait le même écran sans jamais lire son
	 * paramètre : aucun lien n'ayant jamais été émis, elle a été retirée.
	 *
	 * AUCUN CÂBLAGE : la vue ne porte ni formulaire, ni bouton de reprise, ni champ
	 * de mot de passe à révéler.
	 */
	import Vue from '../../vues/V-06.svelte';
	import '../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue portail={data.portail} />
