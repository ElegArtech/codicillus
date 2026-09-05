<script lang="ts">
	/**
	 * `/` — deux écrans pour une adresse : V-01 Accueil public sans session, V-07 Accueil
	 * contributeur avec session. `data.session` vient du chargeur, jamais du navigateur
	 * (`ADR-006`).
	 *
	 * V-07 NE REÇOIT PLUS DE VECTEUR DE PLANCHE : ses états — bibliothèque vide, aucun
	 * univers, aucune consultation — se lisent sur la DONNÉE, et un état joué par un
	 * réglage d'écran finissait toujours par diverger de l'état réel. `ecriture` et
	 * `administrateur` viennent du gabarit et du chargeur, jamais de la vue.
	 *
	 * LES DEUX FEUILLES DE VUE, ET L'ORDRE DE LEURS IMPORTS EST PORTEUR. La racine de V-01
	 * est `div.public.app`, et `.app` est une grille — `src/socle.css`. `V-01.css` vient
	 * DONC EN SECOND, de sorte que son `.public { display: flex; … }`, source postérieure,
	 * l'emporte. Ne pas les intervertir.
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
		notes={data.notes}
		compte={data.compte}
		univers={data.univers}
		domaines={data.domaines}
		vivacites={data.vivacites}
		recemment={data.recemment}
		plusConsultees={data.plusConsultees}
		seuilBientot={data.seuilBientot}
		surveiller={data.surveiller}
		ecriture={data.ecriture}
		administrateur={data.administrateur}
	/>
{:else}
	<!--
		`portail` est une donnée d'INSTANCE — la clé `portail_assistance` de la
		table `parametres` —, et V-07 n'en a pas l'usage : elle ne va qu'à la
		branche publique, la seule qui porte les trois appels à l'assistance.
	-->
	<VuePublique vecteur={null} notes={data.notes} portail={data.portail} />
{/if}
