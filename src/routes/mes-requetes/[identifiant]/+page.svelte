<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { ETATS, ORIGINES, dateDeRequete } from '$lib/requetes/modele';
	import HistoriqueRequete from '$lib/requetes/HistoriqueRequete.svelte';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	const r = $derived(data.requete);
	let lecture = $state<HTMLFormElement>();
	let derniereLecture = $state('');
	let lectureReussie = $state(false);
	$effect(() => {
		const cle = r.id + ':' + r.revision;
		if (lecture && cle !== derniereLecture) {
			derniereLecture = cle;
			lectureReussie = false;
			lecture.requestSubmit();
		}
	});
</script>

<svelte:head><title>{r.sujet} · Mes requêtes · Codicillus</title></svelte:head>
<a class="rq-lien rq-retour" href={resolve('/mes-requetes')}>← Mes requêtes de documentation</a>
<div>
	<span class={'rq-badge rq-badge--' + r.etat}>{ETATS[r.etat]}</span>
	<h1 class="rq-titre-detail">{r.sujet}</h1>
	<p class="rq-secondaire">{dateDeRequete(r.creeLe)}</p>
</div>
<div class="rq-detail">
	<div>
		<div class="rq-bloc">
			<h2>Besoin exprimé</h2>
			{#if r.supprimeeLe}<p>
					Le contenu de cette requête a été retiré du module. Ce reçu conserve le sujet et la
					décision qui vous est destinée.
				</p>{:else}<p class="rq-besoin">{r.besoin}</p>
				<dl class="rq-definition">
					<dt>Déposée le</dt>
					<dd>{dateDeRequete(r.creeLe)}</dd>
					<dt>Origine</dt>
					<dd>{ORIGINES[r.origine]}</dd>
					{#if r.recherche}<dt>Mots recherchés</dt>
						<dd>« {r.recherche} »</dd>{/if}
					<dt>Domaine</dt>
					<dd>{r.domaine ?? 'Non assigné'}</dd>
				</dl>{/if}
		</div>
		<div class="rq-bloc">
			<h2>Réponse à votre requête</h2>
			{#if data.note}<a
					class="rq-note-liee"
					href={data.note.publique
						? resolve('/guides/[identifiant]', { identifiant: data.note.identifiant })
						: resolve('/notes/[identifiant]', { identifiant: data.note.identifiant })}
					>{data.note.titre}</a
				>{:else}<p>
					{r.etat === 'diffusee'
						? 'La réponse a été diffusée. La note associée n’est plus accessible.'
						: r.etat === 'acceptee'
							? 'Le besoin est retenu. La réponse est en préparation.'
							: r.etat === 'non-retenue'
								? 'Cette requête n’a pas été retenue.'
								: 'Votre requête attend une évaluation.'}
				</p>{/if}{#if r.commentaireDemandeur}<div class="rq-commentaire">
					{r.commentaireDemandeur}
				</div>{/if}
		</div>
	</div>
	<div>
		<div class="rq-bloc">
			<h2>Suivi</h2>
			<HistoriqueRequete lignes={data.historique} />
		</div>
	</div>
</div>
<form
	method="POST"
	action="?/lue"
	bind:this={lecture}
	use:enhance={() =>
		async ({ result }) => {
			lectureReussie = result.type === 'success';
		}}
>
	<input type="hidden" name="revision" value={r.revision} />{#if !lectureReussie}<button
			class="btn"
			type="submit">Marquer la décision comme lue</button
		>{/if}
</form>
