<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { erreursDuDepot } from '$lib/requetes/modele';
	import type { PageData, ActionData } from './$types';
	const { data, form }: { data: PageData; form: ActionData } = $props();
	let sujet = $state(untrack(() => form?.sujet ?? data.recherche));
	let besoin = $state(untrack(() => form?.besoin ?? ''));
	let erreurs = $state<{ sujet?: string; besoin?: string }>(untrack(() => form?.erreurs ?? {}));
	let envoi = $state(false);
	let erreurReseau = $state('');
</script>

<svelte:head><title>Formuler une requête · Codicillus</title></svelte:head>
<section class="rq-formulaire">
	<a class="rq-lien" href={resolve('/')}>← Retour à l’accueil</a>
	<h1>Formuler une requête de documentation</h1>
	<p class="rq-intro">
		Une connaissance manque, reste difficile à trouver ou ne répond pas à votre situation ? Décrivez
		ce qui vous serait utile.
	</p>
	{#if data.recherche}<div class="rq-contexte">
			<span class="etiq">Contexte de recherche</span><strong>« {data.recherche} »</strong>Ces mots
			accompagnent votre requête. Vous pouvez préciser un autre sujet ci-dessous.
		</div>{/if}
	<form
		id="rq-depot"
		method="POST"
		novalidate
		use:enhance={({ cancel }) => {
			erreurs = erreursDuDepot(sujet, besoin);
			erreurReseau = '';
			if (Object.keys(erreurs).length) {
				cancel();
				document.getElementById(erreurs.sujet ? 'rq-sujet' : 'rq-besoin')?.focus();
				return;
			}
			envoi = true;
			return async ({ result, update }) => {
				envoi = false;
				if (result.type === 'error') {
					erreurReseau =
						'La requête n’a pas pu être transmise. Votre saisie est conservée ; réessayez.';
					return;
				}
				await update({ reset: false });
				if (result.type === 'failure') erreurs = form?.erreurs ?? {};
			};
		}}
	>
		<input type="hidden" name="idDepot" value={form?.idDepot ?? data.idDepot} />
		<div class="rq-champ">
			<label for="rq-sujet">Sujet</label><input
				id="rq-sujet"
				name="sujet"
				bind:value={sujet}
				aria-required="true"
				aria-invalid={Boolean(erreurs.sujet)}
				aria-describedby="rq-sujet-aide rq-sujet-erreur"
			/><small id="rq-sujet-aide">Ce qui devrait être documenté. 160 caractères maximum.</small
			><small class="rq-erreur" id="rq-sujet-erreur">{erreurs.sujet ?? ''}</small>
		</div>
		<div class="rq-champ">
			<label for="rq-besoin">Besoin</label><textarea
				id="rq-besoin"
				name="besoin"
				rows="4"
				bind:value={besoin}
				aria-required="true"
				aria-invalid={Boolean(erreurs.besoin)}
				aria-describedby="rq-besoin-aide rq-besoin-erreur"></textarea><small id="rq-besoin-aide"
				>La situation rencontrée et ce que vous auriez voulu trouver. 2 000 caractères maximum.</small
			><small class="rq-erreur" id="rq-besoin-erreur">{erreurs.besoin ?? ''}</small>
		</div>
		<div class="rq-avis">
			N’indiquez aucun mot de passe, secret ni information personnelle sensible. Cette requête est
			transmise aux administrateurs pour évaluer un besoin de connaissance.
		</div>
		<p class="rq-secondaire">
			{data.session
				? 'Votre requête sera rattachée à votre compte. Les décisions et les commentaires qui vous sont destinés seront disponibles dans « Mes requêtes de documentation ».'
				: 'Ce dépôt est anonyme. Vous recevrez une confirmation ici, sans suivi individuel ni réponse par courriel.'}
		</p>
		{#if erreurReseau}<div class="rq-avis rq-avis--erreur" role="alert">{erreurReseau}</div>{/if}
		<div class="rq-actions">
			<button class="btn btn--principal" type="submit" disabled={envoi}
				>{envoi ? 'Transmission…' : 'Transmettre la requête'}</button
			><a class="btn" href={resolve('/')}>Annuler</a>
		</div>
	</form>
</section>
