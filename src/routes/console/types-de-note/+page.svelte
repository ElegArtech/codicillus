<script lang="ts">
	/**
	 * `/console/types-de-note` — Console · Types de note. Le rôle administrateur est
	 * éprouvé côté serveur par `+page.server.ts`.
	 *
	 * POURQUOI LE BALISAGE EST ICI ET NON SOUS `src/vues/` : les 41 vues sont des
	 * transcriptions de maquettes gelées, et AUCUNE MAQUETTE NE DESSINE CET ÉCRAN. Lui
	 * donner un numéro `V-xx` affirmerait une planche qui n'existe pas. Il suit le
	 * PATRON de `V-30` — tableau de gestion, dialogue de saisie, dialogue de
	 * suppression — et emprunte sa feuille : les classes de console y sont définies une
	 * fois, et une seconde copie de 724 lignes divergerait au premier ajustement.
	 *
	 * CE N'EST PAS L'ÉCRAN DES TYPES DE FICHE. `types_de_note` et `types_de_fiche` sont
	 * deux nomenclatures ; `/console/types-de-fiches` traite la seconde, et les deux
	 * mots ne se croisent nulle part.
	 *
	 * LA RÉAFFECTATION N'EST OFFERTE QUE SI UN TYPE PEUT ACCUEILLIR — même leçon que
	 * `V-30` : sans autre type au catalogue, le sélecteur sortait vide et « Appliquer »
	 * envoyait une cible que le geste refuse ; on cliquait, et rien ne se passait.
	 */
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import { envoyerAUneAction } from '../cablage';
	import {
		CHAMP_NOM,
		CHAMP_TYPE_DE_NOTE_CIBLE,
		CHAMP_TYPE_DE_NOTE_DACCUEIL,
		type RefusDeSaisie
	} from '$lib/console/structure';
	import { accord } from '$lib/vocabulaire';
	import '../../../vues/V-30.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const types = $derived(data.typesDeNote);

	/* ── La saisie : création ou renommage, un seul champ ─────────────────── */

	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);
	let nomSaisi = $state('');
	/** Le refus de l'écran, et celui que l'action rend — le premier des deux. */
	let refusLocal = $state<RefusDeSaisie | null>(null);
	let refusDuServeur = $state<RefusDeSaisie | null>(null);
	const erreurNom = $derived(refusLocal ?? refusDuServeur);

	const edite = $derived(
		ouverture === 'edition' ? (types.find((t) => t.identifiant === cible) ?? null) : null
	);

	function ouvrirLaSaisie(identifiant: string | null): void {
		ouverture = identifiant === null ? 'creation' : 'edition';
		cible = identifiant;
		nomSaisi =
			identifiant === null ? '' : (types.find((t) => t.identifiant === identifiant)?.nom ?? '');
		refusLocal = null;
		refusDuServeur = null;
	}

	function fermerLaSaisie(): void {
		ouverture = null;
		cible = null;
		refusLocal = null;
		refusDuServeur = null;
	}

	function premierRefus(donnees: unknown): RefusDeSaisie | null {
		if (typeof donnees !== 'object' || donnees === null) return null;
		const erreurs = (donnees as { erreurs?: unknown }).erreurs;
		if (!Array.isArray(erreurs)) return null;
		const [premiere] = erreurs as RefusDeSaisie[];
		return premiere ?? null;
	}

	/**
	 * LA VALIDATION DE L'ÉCRAN REFLÈTE CELLE DU SERVEUR, elle ne la remplace pas :
	 * `creerUnTypeDeNote()` refuse le nom vide et le doublon de la même façon, et
	 * l'unicité de `types_de_note.nom` reste le dernier mot.
	 */
	function validerLaSaisie(): void {
		const nom = nomSaisi.trim();
		refusDuServeur = null;
		if (nom === '') {
			refusLocal = { champ: 'nom', message: 'Donnez un nom au type de note.' };
			return;
		}
		if (types.some((t) => t.identifiant !== cible && t.nom.toLowerCase() === nom.toLowerCase())) {
			refusLocal = { champ: 'nom', message: `« ${nom} » existe déjà.` };
			return;
		}
		refusLocal = null;

		const action = ouverture === 'edition' ? '?/enregistrer' : '?/creer';
		const champs =
			ouverture === 'edition' && cible !== null
				? { [CHAMP_TYPE_DE_NOTE_CIBLE]: cible, [CHAMP_NOM]: nom }
				: { [CHAMP_NOM]: nom };
		void envoyerAUneAction(document, action, champs).then((retour) => {
			if (retour.succes) return;
			refusDuServeur = premierRefus(retour.donnees);
		});
	}

	/* ── La suppression — `RG-REF-03` ─────────────────────────────────────── */

	let demande = $state<string | null>(null);
	let versLeType = $state('');

	const aSupprimer = $derived(
		demande === null ? null : (types.find((t) => t.identifiant === demande) ?? null)
	);
	const notesRetenues = $derived(aSupprimer?.notes ?? 0);
	const templatesRetenus = $derived(aSupprimer?.templates ?? 0);
	/** Ce que la réaffectation déplacera — notes ET templates, les deux tables qui
	    pointent `types_de_note`. */
	const concernes = $derived(notesRetenues + templatesRetenus);
	const employe = $derived(concernes > 0);
	const autresTypes = $derived(
		aSupprimer === null ? [] : types.filter((t) => t.identifiant !== aSupprimer.identifiant)
	);
	const reaffectationPossible = $derived(autresTypes.length > 0);
	const cibleDAccueil = $derived(versLeType || (autresTypes[0]?.identifiant ?? ''));

	function refermer(): void {
		demande = null;
		versLeType = '';
	}

	function appliquerLaSuppression(): void {
		if (aSupprimer === null) return;
		if (employe && !reaffectationPossible) return;
		void envoyerAUneAction(document, '?/supprimer', {
			[CHAMP_TYPE_DE_NOTE_CIBLE]: aSupprimer.identifiant,
			...(employe ? { [CHAMP_TYPE_DE_NOTE_DACCUEIL]: cibleDAccueil } : {})
		});
	}

	/** `showModal()` — l'attribut `open` seul n'obtient pas la modalité. */
	function tenirLaBoite(id: string, ouverte: boolean): void {
		const boite = document.getElementById(id);
		if (!(boite instanceof HTMLDialogElement)) return;
		if (!ouverte) {
			if (boite.open) boite.close();
			return;
		}
		if (!boite.open) boite.showModal();
	}

	$effect(() => tenirLaBoite('dlg-type-de-note', ouverture !== null));
	$effect(() => tenirLaBoite('dlg-supprimer-type-de-note', aSupprimer !== null));
</script>

<CoquilleDeConsole section="notes" notes={data.notes}>
	{#snippet enfants()}
		<TeteDeSection
			titre="Types de note"
			description="La nomenclature qui dit ce qu'est chaque note : une procédure, un guide, une note libre. Elle est proposée à la création d'une note et sert de filtre partout ailleurs. Elle n'a rien à voir avec les types de fiche, qui décrivent des propriétés structurées."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau type" onCliquer={() => ouvrirLaSaisie(null)} />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--types-de-note tg--entetes" role="row">
				<span>Nom</span>
				<span class="tg--masquable">Notes</span>
				<span class="tg--masquable">Templates</span>
				<span></span>
			</div>
			<div id="liste">
				{#each types as t (t.identifiant)}
					<div class="tg tg--types-de-note tg--ligne">
						<span class="tg__nom">{t.nom}</span>
						<span class="tg__n tg--masquable">{t.notes} {accord(t.notes, 'note')}</span>
						<span class="tg__n tg--masquable">{t.templates} {accord(t.templates, 'template')}</span>
						<div class="tg__actions">
							<button class="btn" type="button" onclick={() => ouvrirLaSaisie(t.identifiant)}
								>Renommer</button
							>
							<button
								class="btn btn--destructif"
								type="button"
								aria-label="Supprimer le type de note {t.nom}"
								onclick={() => {
									demande = t.identifiant;
									versLeType = '';
								}}
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><path
										d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
									/></svg
								></button
							>
						</div>
					</div>
					<!--
						L'ÉTAT VIDE, PARCE QUE LE PRODUIT COMMENCE VIDE — et ici il vaut
						avertissement : sans un seul type de note, l'éditeur ne propose rien et
						aucune note ne peut naître. Le geste qui débloque est nommé.
					-->
				{:else}
					<div class="zone-etat" id="liste-vide">
						<div class="zone-etat__titre">Aucun type de note</div>
						<div class="zone-etat__txt">
							Tant que la nomenclature est vide, l'éditeur ne propose aucun type et aucune note ne
							peut être créée. Le bouton « Nouveau type », en haut à droite, pose le premier.
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<dialog class="dlg" id="dlg-type-de-note" aria-labelledby="dlg-type-titre">
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M3.5 2.2h5.2L12.5 6v7.8H3.5z" /><path d="M8.7 2.2V6h3.8" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-type-titre">
						{edite ? `Renommer « ${edite.nom} »` : 'Nouveau type de note'}
					</h2>
					<button class="dlg__fermer" type="button" aria-label="Fermer" onclick={fermerLaSaisie}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps">
					<div class="champ" data-etat={erreurNom === null ? undefined : 'erreur'}>
						<label class="champ__label" for="f-nom">Nom du type <span class="oblig">*</span></label>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="saisie"
							type="text"
							id="f-nom"
							autocomplete="off"
							autofocus
							placeholder="Compte rendu"
							value={nomSaisi}
							oninput={(e) => (nomSaisi = e.currentTarget.value)}
							onkeydown={(e) => {
								if (e.key === 'Enter') validerLaSaisie();
							}}
						/>
						<span class="champ__aide"
							>Au singulier, avec sa majuscule. C'est ce mot que l'éditeur propose et que les
							filtres affichent.</span
						>
						<div class="champ__erreur" hidden={erreurNom === null}>
							<svg
								width="13"
								height="13"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
							>
							<span>{erreurNom?.message ?? ''}</span>
						</div>
					</div>
					{#if edite && edite.notes > 0}
						<p class="dlg__texte">
							{edite.notes}
							{accord(edite.notes, 'note porte', 'notes portent')} ce type : elles suivront le nouveau
							nom, sans qu'aucune ne soit modifiée.
						</p>
					{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" type="button" onclick={fermerLaSaisie}>Annuler</button>
					<button class="btn btn--principal" type="button" onclick={validerLaSaisie}
						>{edite ? 'Enregistrer' : 'Créer le type'}</button
					>
				</div>
			</div>
		</dialog>

		<dialog
			class="dlg dlg--destructif"
			id="dlg-supprimer-type-de-note"
			aria-labelledby="dlg-sup-titre"
		>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><path
								d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le type de note</h2>
					<button class="dlg__fermer" type="button" aria-label="Fermer" onclick={refermer}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps">
					{#if aSupprimer}
						{#if !employe}
							<p class="dlg__texte">
								« {aSupprimer.nom} » n'est porté par aucune note et par aucun template. Sa suppression
								retire seulement ce mot de la nomenclature proposée.
							</p>
						{:else}
							<div class="refus">
								<div class="refus__titre">Suppression refusée en l'état : ce type est employé</div>
								<ul>
									{#if notesRetenues > 0}
										<li>
											<b>{notesRetenues}</b>{' ' +
												accord(
													notesRetenues,
													'note rédigée sous ce type',
													'notes rédigées sous ce type'
												)}
										</li>
									{/if}
									{#if templatesRetenus > 0}
										<li>
											<b>{templatesRetenus}</b>{' ' +
												accord(
													templatesRetenus,
													'template déclaré pour ce type',
													'templates déclarés pour ce type'
												)}
										</li>
									{/if}
								</ul>
								<div class="refus__sortie">
									Rien d'autre que le type ne disparaît : notes et templates changent de type et
									gardent leur contenu. La réaffectation est la seule sortie que la règle propose.
								</div>
							</div>
							<div class="choix-reaffectation">
								<label
									><span class="reaffectation__corps"
										><span class="reaffectation__intitule">Réaffecter à un autre type</span>
										<select
											class="selecteur reaffectation__cible"
											aria-label="Type de note d'accueil"
											disabled={!reaffectationPossible}
											value={cibleDAccueil}
											onchange={(e) => (versLeType = e.currentTarget.value)}
											>{#each autresTypes as t (t.identifiant)}<option value={t.identifiant}
													>{t.nom}</option
												>{:else}<option value="">Aucun autre type de note n'existe</option
												>{/each}</select
										>
										<span class="aide"
											>{reaffectationPossible
												? accord(
														concernes,
														'L’élément concerné change de type ; son contenu rédigé reste intact.',
														`Les ${concernes} éléments concernés changent de type ; leur contenu rédigé reste intact.`
													)
												: 'C’est le seul type de la nomenclature : il n’y a nulle part où déplacer ces notes. Fermez cette boîte, créez un autre type avec « Nouveau type », et la réaffectation sera possible.'}</span
										></span
									>
								</label>
							</div>
						{/if}
					{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" type="button" onclick={refermer}>Annuler</button>
					<button
						class="btn btn--principal btn--destructif dlg__valider"
						type="button"
						disabled={employe && !reaffectationPossible}
						onclick={appliquerLaSuppression}
						>{employe ? 'Réaffecter et supprimer' : 'Supprimer'}</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</CoquilleDeConsole>

<style>
	/*
		LES QUATRE COLONNES DE CE TABLEAU, ET RIEN D'AUTRE. `.tg` et tout le reste
		viennent de la feuille de console importée plus haut ; seule la grille est
		propre à cet écran, comme `.tg--relations` l'est au sien.
	*/
	.tg--types-de-note {
		grid-template-columns: minmax(0, 1.6fr) 110px 120px auto;
	}

	/*
		La sortie de réaffectation : l'intitulé, le sélecteur et l'aide, EMPILÉS DANS UN
		SEUL ENFANT. `.choix-reaffectation label` est une rangée `flex` ; trois enfants
		directs s'y partageaient la largeur, et l'intitulé sortait sur quatre lignes à
		côté d'un sélecteur écrasé.
	*/
	.reaffectation__corps {
		flex: 1;
		min-width: 0;
	}

	.reaffectation__intitule {
		display: block;
		font-weight: var(--g-fort);
	}

	.reaffectation__cible {
		margin-top: var(--e-2);
		width: 100%;
		padding: 6px var(--e-2);
		border: 1px solid var(--c-trait-fort);
		border-radius: var(--r-2);
		background: var(--c-papier);
		font-family: var(--f-ui);
		font-size: var(--t-petit);
	}

	.dlg__valider {
		background: var(--c-danger);
		border-color: var(--c-danger);
		color: #fff;
	}

	.dlg__valider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
