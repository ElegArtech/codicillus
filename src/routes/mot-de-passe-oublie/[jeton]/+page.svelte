<script lang="ts">
	/**
	 * `/mot-de-passe-oublie/{jeton}` — V-06, état « Lien expiré ».
	 *
	 * Le vecteur vient de `vecteurDeV06LienInconnu()`, qui porte la raison :
	 * aucune table ne porte de jeton de réinitialisation, donc aucun jeton n'est
	 * valide. Rien n'est décidé ici.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 */
	import Vue from '../../../vues/V-06.svelte';
	import '../../../vues/V-06.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<Vue vecteur={data.vecteur} />
