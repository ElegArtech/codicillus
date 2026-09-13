<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { ETATS, ORIGINES, dateDeRequete, type EtatDeRequete } from '$lib/requetes/modele';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	let recherche = $state('');
	let domaine = $state('');
	const etat = $derived(
		(Object.hasOwn(ETATS, page.url.searchParams.get('etat') ?? '')
			? page.url.searchParams.get('etat')
			: 'a-evaluer') as EtatDeRequete
	);
	const lignes = $derived(
		data.requetes.filter(
			(r) =>
				r.etat === etat &&
				(!domaine || r.domaineId === domaine) &&
				(r.sujet + ' ' + r.besoin)
					.toLocaleLowerCase('fr')
					.includes(recherche.toLocaleLowerCase('fr'))
		)
	);
	const onglets: Record<EtatDeRequete, string> = {
		'a-evaluer': 'À évaluer',
		acceptee: 'Acceptées',
		diffusee: 'Diffusées',
		'non-retenue': 'Non retenues'
	};
</script>

<svelte:head><title>Requêtes de documentation · Console · Codicillus</title></svelte:head>
<TeteDeSection
	titre="Requêtes de documentation"
	description="Évaluer les besoins proposés, organiser leur prise en charge et identifier les réponses diffusées."
	>{#snippet action()}<a class="btn" href={resolve('/console/requetes/journal')}
			>Journal des décisions</a
		>{/snippet}</TeteDeSection
>
<nav class="rq-onglets" aria-label="État des requêtes">
	{#each Object.entries(onglets) as [cle, nom] (cle)}<a
			href={resolve(`/console/requetes?etat=${cle}`)}
			aria-current={etat === cle ? 'page' : undefined}
			>{nom} <b>{data.requetes.filter((r) => r.etat === cle).length}</b></a
		>{/each}
</nav>
<div class="rq-outils">
	<div class="rq-champ">
		<label for="rq-filtre">Rechercher une requête</label><input
			id="rq-filtre"
			type="search"
			placeholder="Sujet ou besoin"
			bind:value={recherche}
		/>
	</div>
	<div class="rq-champ">
		<label for="rq-domaine-filtre">Domaine</label><select
			id="rq-domaine-filtre"
			bind:value={domaine}
			><option value="">Tous les domaines</option>{#each data.domainesDeRequete as d (d.id)}<option
					value={d.id}>{d.nom}</option
				>{/each}</select
		>
	</div>
</div>
<div id="rq-lignes" aria-live="polite">
	{#if lignes.length}<div class="rq-liste">
			<div class="rq-ligne rq-ligne--tete">
				<span>Sujet · demandeur · origine</span><span>Domaine</span><span>État</span><span></span>
			</div>
			{#each lignes as r (r.id)}<a
					class="rq-ligne"
					href={resolve('/console/requetes/[identifiant]', { identifiant: r.id })}
					><span
						><strong>{r.sujet}</strong><small
							>{r.demandeur ?? 'Visiteur anonyme'} · {ORIGINES[r.origine]} · {dateDeRequete(
								r.creeLe
							)}</small
						></span
					><span class="rq-secondaire">{r.domaine ?? 'Non assigné'}</span><span
						class={'rq-badge rq-badge--' + r.etat}>{ETATS[r.etat]}</span
					><span aria-hidden="true">›</span></a
				>{/each}
		</div>{:else}<div class="rq-vide">
			<h2>
				{recherche || domaine
					? 'Aucune requête ne correspond à ces filtres'
					: 'Aucune requête ' +
						{
							'a-evaluer': 'à évaluer',
							acceptee: 'acceptée',
							diffusee: 'diffusée',
							'non-retenue': 'non retenue'
						}[etat]}
			</h2>
			<p>
				{recherche || domaine
					? 'Modifiez votre recherche ou retirez le filtre de domaine.'
					: 'Les requêtes de documentation déposées depuis l’accueil ou la recherche apparaîtront ici.'}
			</p>
			{#if recherche || domaine}<button
					class="btn"
					onclick={() => {
						recherche = '';
						domaine = '';
					}}>Effacer les filtres</button
				>{/if}
		</div>{/if}
</div>
