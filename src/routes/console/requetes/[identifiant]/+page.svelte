<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import HistoriqueRequete from '$lib/requetes/HistoriqueRequete.svelte';
	import { ETATS, ORIGINES, dateDeRequete } from '$lib/requetes/modele';
	import type { PageData } from './$types';
	const { data }: { data: PageData } = $props();
	const r = $derived(data.requete);
	const note = $derived(data.note);
	let dialogue = $state<HTMLDialogElement>();
	let geste = $state('');
	let envoi = $state(false);
	let erreur = $state('');
	let annonce = $state('');
	let domaine = $state('');
	let interne = $state('');
	let retour = $state('');
	let choixNote = $state('');
	let chercherNote = $state('');
	const titres: Record<string, string> = {
		accepter: 'Accepter la requête',
		refuser: 'Ne pas retenir la requête',
		associer: 'Associer une note',
		diffuser: 'Marquer comme diffusée',
		supprimer: 'Supprimer la requête'
	};
	const boutons: Record<string, string> = {
		accepter: 'Accepter la requête',
		refuser: 'Confirmer la non-retenue',
		associer: 'Associer cette note',
		diffuser: 'Confirmer la diffusion',
		supprimer: 'Supprimer la requête'
	};
	function ouvrir(action: string) {
		geste = action;
		erreur = '';
		domaine = r.domaineId ?? '';
		interne = r.commentaireInterne;
		choixNote = r.noteId ?? '';
		chercherNote = '';
		retour = action === 'supprimer' ? r.commentaireDemandeur : '';
		dialogue?.showModal();
	}
	const envoyer: SubmitFunction = ({ formElement }) => {
		envoi = true;
		erreur = '';
		annonce = '';
		const qualification = formElement.id === 'rq-qualification';
		return async ({ result, update }) => {
			envoi = false;
			if (result.type === 'error') {
				erreur = 'L’enregistrement a échoué. Votre saisie est conservée ; réessayez.';
				return;
			}
			if (result.type === 'failure') {
				erreur = String(result.data?.erreur ?? 'La requête a changé. Rechargez son détail.');
				return;
			}
			if (!qualification) dialogue?.close();
			await update({ reset: false });
			annonce = 'Enregistrement effectué.';
		};
	};
	const noteFiltree = $derived(
		data.notesDisponibles.filter((n) =>
			n.titre.toLocaleLowerCase('fr').includes(chercherNote.toLocaleLowerCase('fr'))
		)
	);
</script>

<svelte:head><title>{r.sujet} · Requêtes · Codicillus</title></svelte:head>
<a class="rq-lien rq-retour" href={resolve(`/console/requetes?etat=${r.etat}`)}
	>← Requêtes de documentation</a
>
<div>
	<span class={'rq-badge rq-badge--' + r.etat}>{ETATS[r.etat]}</span>
	<h1 class="rq-titre-detail">{r.sujet}</h1>
	<p class="rq-secondaire">{dateDeRequete(r.creeLe)} · {data.demandeur ?? 'Visiteur anonyme'}</p>
</div>
{#if r.etat === 'a-evaluer'}<div class="rq-actions">
		<button class="btn btn--principal" onclick={() => ouvrir('accepter')}>Accepter</button><button
			class="btn"
			onclick={() => ouvrir('refuser')}>Ne pas retenir</button
		>
	</div>{/if}
{#if annonce}<p class="rq-secondaire" role="status">{annonce}</p>{/if}
{#if erreur && !dialogue?.open}<div class="rq-avis rq-avis--erreur" role="alert">{erreur}</div>{/if}
<div class="rq-detail">
	<div>
		<div class="rq-bloc">
			<h2>Besoin exprimé</h2>
			<p class="rq-besoin">{r.besoin}</p>
			<dl class="rq-definition">
				<dt>Déposée le</dt>
				<dd>{dateDeRequete(r.creeLe)}</dd>
				<dt>Origine</dt>
				<dd>{ORIGINES[r.origine]}</dd>
				<dt>Demandeur</dt>
				<dd>{data.demandeur ?? 'Visiteur anonyme · aucun suivi individuel'}</dd>
				{#if r.recherche}<dt>Mots recherchés</dt>
					<dd>« {r.recherche} »</dd>{/if}
				<dt>Domaine</dt>
				<dd>{data.domainesDisponibles.find((d) => d.id === r.domaineId)?.nom ?? 'Non assigné'}</dd>
			</dl>
		</div>
		<div class="rq-bloc">
			<h2>Historique des décisions</h2>
			<HistoriqueRequete lignes={data.historique} />
		</div>
	</div>
	<div>
		<div class="rq-bloc">
			<h2>Note associée</h2>
			{#if note}<a
					class="rq-note-liee"
					href={resolve('/notes/[identifiant]', { identifiant: note.identifiant })}>{note.titre}</a
				>
				<p class="rq-secondaire">
					{note.statut === 'publiee' ? 'Publiée' : 'Brouillon'} · {note.visibilite === 'publique'
						? 'Publique'
						: 'Interne'}
				</p>{:else}<p>
					{r.etat === 'acceptee'
						? 'Le besoin est retenu. Aucune note n’est encore associée.'
						: r.etat === 'diffusee'
							? 'La réponse a été diffusée. La note associée n’est plus disponible.'
							: r.etat === 'non-retenue'
								? 'Cette requête n’a pas été retenue.'
								: 'Aucune note associée. La requête attend une évaluation.'}
				</p>{/if}
			{#if r.commentaireDemandeur}<div class="rq-commentaire">{r.commentaireDemandeur}</div>{/if}
			{#if r.etat === 'acceptee'}<div class="rq-actions">
					<button class="btn" onclick={() => ouvrir('associer')}
						>{note ? 'Changer de note' : 'Associer une note'}</button
					>
					{#if note}<a
							class="btn"
							href={resolve(`/notes/[identifiant]/modifier?requete=${r.id}`, {
								identifiant: note.identifiant
							})}
							>{note.statut === 'brouillon' ? 'Continuer la rédaction' : 'Modifier la réponse'}</a
						>
					{:else if data.domainesDisponibles.length}<a
							class="btn"
							href={resolve(`/notes/nouvelle?requete=${r.id}`)}>Écrire une note</a
						>{/if}
					{#if note?.statut === 'publiee'}<button
							class="btn btn--principal"
							onclick={() => ouvrir('diffuser')}>Marquer comme diffusée</button
						>{/if}
				</div>
				{#if note?.statut === 'brouillon'}<p class="rq-secondaire">
						La requête reste acceptée tant que la réponse n’est pas publiée.
					</p>{/if}
				{#if !data.domainesDisponibles.length}<div class="rq-avis rq-avis--attention">
						Un domaine est nécessaire pour écrire une note. Créez le rangement depuis la console,
						puis reprenez cette requête acceptée.
						<p><a class="rq-lien" href={resolve('/console/univers')}>Créer le rangement</a></p>
					</div>{/if}
			{/if}
		</div>
		<form id="rq-qualification" method="POST" use:enhance={envoyer} class="rq-bloc">
			<input type="hidden" name="geste" value="qualifier" />
			<h2>Qualification</h2>
			<div class="rq-champ">
				<label for="rq-domaine">Domaine responsable</label><select id="rq-domaine" name="domaine"
					><option value="">Non assigné</option>{#each data.domainesDisponibles as d (d.id)}<option
							value={d.id}
							selected={r.domaineId === d.id}>{d.nom}</option
						>{/each}</select
				>{#if !data.domainesDisponibles.length}<small
						>Aucun domaine n’a encore été créé. La requête peut être acceptée sans affectation.</small
					>{/if}
			</div>
			<div class="rq-champ">
				<label for="rq-interne">Commentaire interne <span>· administrateurs uniquement</span></label
				><textarea id="rq-interne" name="interne" rows="4" value={r.commentaireInterne}></textarea>
			</div>
			<button class="btn" disabled={envoi}>Enregistrer la qualification</button>
		</form>
		<div class="rq-actions">
			{#if r.etat === 'acceptee'}<button class="btn" onclick={() => ouvrir('refuser')}
					>Ne plus retenir</button
				>{/if}<button class="btn" onclick={() => ouvrir('supprimer')}>Supprimer la requête</button>
		</div>
	</div>
</div>
<dialog class="rq-dialogue" bind:this={dialogue} aria-labelledby="rq-dialogue-titre">
	<form method="POST" use:enhance={envoyer}>
		<input type="hidden" name="geste" value={geste} />
		<h2 id="rq-dialogue-titre">{titres[geste] ?? ''}</h2>
		{#if geste === 'accepter'}<p>
				Le besoin est retenu. La requête ne sera diffusée qu’une fois une réponse publiée et
				identifiable.
			</p>
			<div class="rq-champ">
				<label for="rq-domaine-decision">Domaine responsable <span>· facultatif</span></label
				><select id="rq-domaine-decision" name="domaine" bind:value={domaine}
					><option value="">Non assigné</option>{#each data.domainesDisponibles as d (d.id)}<option
							value={d.id}>{d.nom}</option
						>{/each}</select
				>{#if !data.domainesDisponibles.length}<small
						>Aucun domaine disponible pour le moment.</small
					>{/if}
			</div>
		{:else if geste === 'refuser'}<p>
				Cette décision sera conservée dans l’historique.{r.demandeurId
					? ' Le demandeur en sera informé dans son suivi.'
					: ''}
			</p>
			<div class="rq-champ">
				<label for="rq-interne-decision">Commentaire interne <span>· facultatif</span></label
				><textarea id="rq-interne-decision" name="interne" bind:value={interne}></textarea><small
					>Réservé aux administrateurs. Jamais affiché au demandeur.</small
				>
			</div>
		{:else if geste === 'associer'}<p>
				Choisissez une réponse existante ou une note en préparation. L’association ne diffuse pas
				encore la requête.
			</p>
			<div class="rq-champ">
				<label for="rq-chercher-note">Rechercher une note</label><input
					id="rq-chercher-note"
					type="search"
					placeholder="Titre de la note"
					bind:value={chercherNote}
				/>
			</div>
			<div>
				{#each noteFiltree as n (n.id)}<label class="rq-choix"
						><input type="radio" name="note" value={n.id} bind:group={choixNote} />{n.titre}<small
							>{n.statut === 'publiee' ? 'Publiée' : 'Brouillon'} · {n.visibilite === 'publique'
								? 'Publique'
								: 'Interne'} · {n.domaine}</small
						></label
					>{:else}<p>
						{data.notesDisponibles.length
							? 'Aucune note ne correspond à cette recherche.'
							: 'Aucune note disponible. Créez d’abord un domaine puis une note.'}
					</p>{/each}
			</div>
		{:else if geste === 'diffuser'}<p>La réponse est publiée et répond au besoin exprimé.</p>
			<div class="rq-contexte">
				<strong>{note?.titre}</strong>Publiée · {note?.visibilite === 'publique'
					? 'Publique'
					: 'Interne'}
			</div>
			{#if !data.reponseAccessible}<div class="rq-avis rq-avis--attention">
					{r.origine.includes('public')
						? 'Cette requête vient du public. La note associée doit être publique pour que la réponse soit accessible.'
						: 'Le demandeur ne peut pas consulter cette note. Rendez la réponse accessible ou associez une autre note.'}
				</div>{/if}
		{:else if geste === 'supprimer'}<p>
				Le besoin et les commentaires internes seront retirés du module. La suppression restera
				tracée dans le journal administratif.
			</p>
			{#if r.demandeurId}<p>
					Le demandeur conservera une indication de la décision dans son suivi.{[
						'a-evaluer',
						'acceptee'
					].includes(r.etat)
						? ' Sa requête sera indiquée comme non retenue.'
						: ''}
				</p>{/if}{/if}
		{#if geste !== 'associer'}{#if r.demandeurId}<div class="rq-champ">
					<label for="rq-retour">Commentaire destiné au demandeur <span>· facultatif</span></label
					><textarea id="rq-retour" name="retour" bind:value={retour} rows="4"></textarea><small
						>Visible dans son suivi. Ce champ n’ouvre pas de conversation.</small
					>
				</div>{:else}<div class="rq-avis">
					Dépôt anonyme : aucun retour individuel ne sera envoyé.
				</div>{/if}{/if}
		{#if erreur}<div class="rq-avis rq-avis--erreur" role="alert">{erreur}</div>{/if}
		<div class="rq-actions">
			<button class="btn" type="button" onclick={() => dialogue?.close()} disabled={envoi}
				>Annuler</button
			><button
				class="btn btn--principal"
				type="submit"
				disabled={envoi ||
					(geste === 'associer' && !choixNote) ||
					(geste === 'diffuser' && !data.reponseAccessible)}
				>{envoi ? 'Enregistrement…' : boutons[geste]}</button
			>
		</div>
	</form>
</dialog>
