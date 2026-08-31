<script lang="ts">
	/**
	 * `/` — deux écrans pour une adresse : V-01 Accueil public sans session, V-07 Accueil
	 * contributeur avec session. `data.session` vient du chargeur, jamais du navigateur
	 * (`ADR-006`).
	 *
	 * `vecteur={null}` demande à chaque vue son état par défaut : « aucune note » est un
	 * état de V-07 dont la phrase gelée affirme « Votre base ne contient encore aucune
	 * note », or un périmètre vide n'est pas une base vide. `ecriture` VIENT DU GABARIT, PAS
	 * DE LA VUE — V-07 la recevait de son seul vecteur de planche, donc toujours vraie.
	 *
	 * LES DEUX FEUILLES DE VUE, ET LA SEULE RÈGLE QUI SE CROISE : `V-07.css:3` pose `.app {
	 * display: grid; … }`, et la racine de V-01 est `div.public.app`. L'ORDRE DES DEUX
	 * IMPORTS EST DONC PORTEUR — `V-01.css` vient EN SECOND, de sorte que son `.public {
	 * display: flex; … }`, même spécificité et source postérieure, l'emporte.
	 */
	import { onMount } from 'svelte';
	import VuePublique from '../vues/V-01.svelte';
	import VueContributeur from '../vues/V-07.svelte';
	/* L'ordre compte — voir l'en-tête. V-07 d'abord, V-01 ensuite. */
	import '../vues/V-07.css';
	import '../vues/V-01.css';
	import { cablerLAccueilPublic } from './cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE CÂBLAGE S'ACCROCHE DEPUIS LA ROUTE — `ARB-063` —, et SEULEMENT SUR LA
	 * BRANCHE ANONYME : le champ de V-01 mène à la recherche publique, et V-07 a le
	 * sien. La racine est cherchée dans le document plutôt que liée par `bind:this`
	 * : la lier demanderait un nœud d'enveloppe que le gel ne porte pas.
	 */
	onMount(() => {
		if (data.session) return undefined;
		const racine = document.getElementById('app');
		return racine === null ? undefined : cablerLAccueilPublic(racine);
	});
</script>

{#if data.session}
	<VueContributeur
		vecteur={data.vecteur ?? null}
		notes={data.notes}
		compte={data.compte}
		univers={data.univers}
		domaines={data.domaines}
		mesures7j={data.mesures7j}
		mesures7jPrec={data.mesures7jPrec}
		modifications={data.modifications}
		activite={data.activite}
		revisions={data.revisions}
		ecriture={data.ecriture}
	/>
{:else}
	<!--
		`portail` est une donnée d'INSTANCE — la clé `portail_assistance` de la
		table `parametres` —, et V-07 n'en a pas l'usage : elle ne va qu'à la
		branche publique, la seule qui porte les trois appels à l'assistance.
	-->
	<VuePublique vecteur={null} notes={data.notes} portail={data.portail} />
{/if}
