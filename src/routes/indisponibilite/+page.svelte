<script lang="ts">
	/**
	 * `/indisponibilite` — CE QUE VOIENT LES COMPTES PENDANT UNE INTERVENTION,
	 * `RG-NF-10`.
	 *
	 * AUCUNE MAQUETTE NE LA DESSINE, et elle ne prend donc pas de numéro `V-xx` : les
	 * 41 vues sont des transcriptions de planches gelées, et en inventer une
	 * quarante-deuxième affirmerait une planche qui n'existe pas. Le balisage est ici,
	 * en jetons du socle — aucune couleur, aucune longueur littérale.
	 *
	 * NI RAIL, NI BARRE, NI COQUILLE : l'instance est fermée, et une navigation vers des
	 * écrans qui renverraient tous ici serait un mensonge de plus. La page ne propose
	 * qu'un geste, « Réessayer », et il ne fait que redemander la même adresse.
	 *
	 * LE MESSAGE VIENT DE LA BASE, JAMAIS D'ICI : c'est l'administrateur qui l'écrit en
	 * console, et le produit n'a pas à deviner la raison d'une intervention. Sans
	 * message, l'activation est refusée — le cas n'existe donc pas.
	 */
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Instance indisponible — Codicillus</title>
</svelte:head>

<main class="indispo">
	<div class="indispo__boite">
		<div class="indispo__marque" aria-hidden="true">
			<svg
				width="28"
				height="28"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"><circle cx="8" cy="8" r="6.2" /><path d="M8 4.6v3.6l2.4 1.4" /></svg
			>
		</div>
		<h1 class="indispo__titre">Instance momentanément indisponible</h1>
		<p class="indispo__message">{data.message}</p>
		<p class="indispo__pied">
			{data.nomOrganisation === '' ? 'Codicillus' : data.nomOrganisation + ' · Codicillus'}
		</p>
		<div class="indispo__gestes">
			<a class="btn btn--principal" href={resolve('/indisponibilite')}>Réessayer</a>
			{#if data.administrateur}
				<a class="btn" href={resolve('/console/configuration')}>Configuration de l'instance</a>
			{/if}
		</div>
		{#if data.administrateur}
			<!--
				CE QUE L'ADMINISTRATEUR DOIT SAVOIR EN ARRIVANT ICI : il n'est pas concerné.
				Sans cette ligne, celui qui ouvre l'adresse par curiosité croit son instance
				fermée pour lui aussi, et cherche un accès de secours qui n'existe pas.
			-->
			<p class="indispo__note">
				Vous voyez cette page parce que vous l'avez ouverte : les administrateurs ne sont jamais
				renvoyés ici et continuent de travailler normalement. L'interrupteur est dans Configuration,
				groupe « Indisponibilité programmée ».
			</p>
		{/if}
	</div>
</main>

<style>
	.indispo {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--e-5);
		background: var(--c-fond);
	}

	.indispo__boite {
		width: min(560px, 100%);
		padding: var(--e-6);
		background: var(--c-papier);
		border: 1px solid var(--c-trait);
		border-radius: var(--r-3);
		box-shadow: var(--o-pose);
		text-align: center;
	}

	.indispo__marque {
		color: var(--c-accent);
	}

	.indispo__titre {
		margin: var(--e-3) 0 var(--e-2);
		font-family: var(--f-ui);
		font-size: var(--t-t2);
		font-weight: var(--g-lourd);
		letter-spacing: -0.012em;
		color: var(--c-encre);
	}

	.indispo__message {
		margin: 0 0 var(--e-4);
		font-family: var(--f-lecture);
		font-size: var(--t-base);
		line-height: 1.6;
		color: var(--c-encre-2);
		white-space: pre-line;
	}

	.indispo__pied {
		margin: 0 0 var(--e-4);
		font-family: var(--f-donnee);
		font-size: var(--t-micro);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--c-encre-4);
	}

	.indispo__gestes {
		display: flex;
		gap: var(--e-2);
		justify-content: center;
		flex-wrap: wrap;
	}

	/* `.btn` du socle habille un `<button>` ; posée sur un lien, elle en garde le
	   soulignement du navigateur. Les deux gestes de cette page sont des liens. */
	.indispo__gestes .btn {
		text-decoration: none;
	}

	.indispo__note {
		margin: var(--e-4) 0 0;
		font-size: var(--t-mini);
		line-height: 1.5;
		color: var(--c-encre-3);
	}
</style>
