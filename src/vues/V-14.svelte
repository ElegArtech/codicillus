<script lang="ts">
	/**
	 * V-14 — LECTURE D'UNE NOTE. Route `/notes/{identifiant}`.
	 *
	 * L'ÉCRAN CŒUR DU PRODUIT, refondu sur le prototype validé du 5 septembre 2026
	 * (`design_handoff_refonte_codicillus/`, § 5 et `SPEC-vivacite.md`).
	 *
	 * L'ORDRE VERTICAL DU DOCUMENT NE SE DISCUTE PAS : sélecteur de registre, ligne
	 * de vivacité, titre, étiquettes, métadonnées, résumé, sections. À gauche le
	 * sommaire, à droite la colonne de contexte ; sous les seuils du socle, l'un
	 * disparaît et l'autre devient un tiroir — la vue ne mesure aucune largeur, elle
	 * marque ses deux colonnes et laisse `src/socle.css` décider.
	 *
	 * ELLE NE CALCULE AUCUNE VIVACITÉ. L'état, les deux libellés, la position sur la
	 * frise, le rappel : tout sort de `vivacite()` (`$lib/fraicheur.ts`), appelée par
	 * le chargeur pour CHAQUE registre. Écrire ici « dans 67 jours » serait le second
	 * calcul que `P-01` interdit.
	 *
	 * LE REGISTRE EST UN ÉTAT D'ADRESSE, PAS UN ÉTAT LOCAL. Les deux onglets sont des
	 * LIENS vers `?registre=…` : le serveur sert alors le bon corps, le bon sommaire
	 * ET la bonne vivacité, et « tout ce qui parle de vivacité parle du registre
	 * affiché » est vrai sans une ligne de script. Sans JavaScript, la bascule marche.
	 *
	 * LES GESTES SONT CÂBLÉS DEPUIS LA ROUTE (`ARB-063`,
	 * `src/routes/notes/{identifiant}/cablage.ts`). NE RENOMME NI NE RETIRE ce que ces
	 * câblages visent : `#btn-verifier`, `#btn-reviser`, `#btn-lever`, les libellés
	 * « Modifier la référence », « Modifier l'opérationnel », « Exporter »,
	 * « Imprimer », « Supprimer ». Renommer débranche le geste sans erreur de
	 * compilation.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002) : `src/socle.css` et
	 * `src/vues/V-14.css`.
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import type { Notification } from '$lib/coquille/notifications';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import SommaireDeLaNote from '$lib/lecture/SommaireDeLaNote.svelte';
	import { rangementDe, type LectureAffichee } from '$lib/lecture/note-de-demonstration';
	import type {
		AdressesDeLecture,
		ContexteDeLaNote,
		EnteteDeLecture,
		Registre,
		VivaciteDesRegistres
	} from '$lib/lecture/ecran';
	import type { PanneauxDeLaNote } from '$lib/lecture/panneaux';
	import { adresseDeNote } from '$lib/rangement/adresses';

	interface Proprietes {
		/** Ce que la route sait de l'appelant — ses droits, et rien d'autre. */
		vecteur: Record<string, string | boolean> | null;
		/** Le corpus lisible : la coquille l'accepte, le rail vient du contexte. */
		notes: readonly Note[];
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: CompteAffiche | null;
		/** La note lue, ses corps rendus et son sommaire — REQUISE. */
		affichee: LectureAffichee;
		/** Pièces jointes, relations, rétroliens — vides, ils se disent en un chiffre. */
		panneaux: PanneauxDeLaNote;
		/** Le registre affiché. C'est lui que TOUT ce qui parle de vivacité décrit. */
		registre: Registre;
		/** Les deux cycles. `operationnelle` nul : le registre n'existe pas encore. */
		vivacite: VivaciteDesRegistres;
		/** Création, version, dernière modification — la ligne de métadonnées. */
		entete: EnteteDeLecture;
		/** Univers, rangement, voisinage — la section « Contexte » de la colonne. */
		contexte: ContexteDeLaNote;
		/** Les adresses des gestes, composées par la route. */
		adresses: AdressesDeLecture;
		/**
		 * CE QUE LE GESTE QUI VIENT D'AVOIR LIEU ANNONCE — le texte du prototype, servi
		 * par la route qui seule connaît la durée du cycle. `null` : aucune bulle.
		 */
		annonce?: string | null;
		notifications?: readonly Notification[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte = null,
		affichee,
		panneaux,
		registre,
		vivacite,
		entete,
		contexte,
		adresses,
		annonce = null,
		notifications = []
	}: Proprietes = $props();

	/** Hors application, aucun compte n'est connecté : la barre le rend vide. */
	const COMPTE_ABSENT: CompteAffiche = { nom: '', initiales: '', role: '', domaine: '' };

	const reglage = $derived(vecteur ?? {});
	const droits = $derived<'ecriture' | 'lecture'>(
		reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture'
	);
	/** `P-09`, `ARB-040` — ce qui n'est pas permis n'est pas ÉMIS, jamais masqué. */
	const ecriture = $derived(droits !== 'lecture');

	const note = $derived(affichee.note);
	const rangement = $derived(rangementDe(note));

	/** La vivacité du registre AFFICHÉ — ligne, carte, frise, rappel, menu. */
	const viv = $derived(vivacite.courante);
	const aOperationnel = $derived(vivacite.operationnelle !== null);
	const surLOperationnel = $derived(registre === 'operationnel');
	const nomDuRegistre = $derived(surLOperationnel ? 'Opérationnel' : 'Référence');

	/** Le corps du registre affiché — `null` : le registre ne porte pas de texte. */
	const corps = $derived(surLOperationnel ? affichee.operationnel : affichee.reference);
	const idDuCorps = $derived(surLOperationnel ? 'corps-operationnel' : 'corps-reference');

	/** « 412 consultations », accordé : une note ouverte une fois n'en a pas deux. */
	const consultations = $derived(
		`${affichee.consultationsTotal} consultation${affichee.consultationsTotal > 1 ? 's' : ''}`
	);
	const consultations30j = $derived(`${affichee.consultations30j} sur les 30 derniers jours`);

	/** Le nombre de notes reliées, tous types de relation confondus. */
	const relations = $derived(panneaux.relations.reduce((n, g) => n + g.notes.length, 0));

	/**
	 * LES LIBELLÉS DONT UN GESTE DÉPEND, ÉCRITS UNE FOIS ET PORTÉS PAR UNE
	 * EXPRESSION. Deux raisons, et la seconde est un défaut vécu : le câblage
	 * retrouve ces boutons PAR LEUR TEXTE (`RG-M18-16`), et le formateur coupe un
	 * libellé long entre deux lignes — « Historique des\n\t\t\tversions » n'est plus
	 * égal à « Historique des versions », et le geste se débranche en silence. Dans
	 * une expression, le texte reste un nœud unique.
	 */
	const LIBELLE = {
		historique: 'Historique des versions',
		signaler: 'Signaler à réviser',
		lever: 'Lever la demande de révision',
		creerLOperationnel: 'Créer la version opérationnelle'
	} as const;

	/** La frise : la position d'aujourd'hui, en pourcentage, telle que la fabrique la donne. */
	const positionDuJour = $derived(`${(viv.fraction * 100).toFixed(1)}%`);
</script>

<!-- Les pictogrammes du prototype, tracés dans une boîte de 16 — un seul patron. -->
{#snippet ic(trace: string, taille = 16)}<svg
		width={taille}
		height={taille}
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.4"
		aria-hidden="true"><path d={trace} /></svg
	>{/snippet}

{#snippet actionsDEntete()}
	<div class="modif">
		<svg
			width="18"
			height="18"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			aria-hidden="true"><path d="M1 10h4l2-5 3 10 2-6 1.5 3H19" /></svg
		>
		<span class="modif__corps">
			<span class="modif__titre">Dernière modification</span>
			<span class="modif__quand">{entete.derniereModification}</span>
		</span>
	</div>

	{#if ecriture}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse composée par la route -->
		<a class="btn btn--principal" href={adresses.modifier}
			>{@render ic('M11 2.5l2.5 2.5L5 13.5H2.5V11z', 15)}Modifier</a
		>
	{/if}

	<!-- Le tiroir de contexte : le socle ne le montre que sous 1180 px. -->
	<button class="btn ouvrir-contexte" type="button" data-ouvrir-tiroir="contexte">
		<GlypheDeVivacite etat={viv.etat} taille={14} />Contexte
	</button>

	<div class="menu-barre menu-note">
		<button class="btn btn--carre" type="button" aria-label="Plus d'actions" aria-expanded="false">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
				><circle cx="8" cy="3" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle
					cx="8"
					cy="13"
					r="1.4"
				/></svg
			>
		</button>
		<div class="menu-barre__liste menu-barre__liste--droite">
			{#if ecriture}
				<button class="menu-note__verifier" type="button" id="btn-verifier"
					>{@render ic('M3 8.5l3.5 3.5L13 4.5', 14)}Marquer comme vérifiée</button
				>
				{#if viv.revision}
					<button type="button" id="btn-lever"
						>{@render ic('M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM5 8h6', 14)}{LIBELLE.lever}</button
					>
				{:else}
					<button type="button" id="btn-reviser" aria-expanded="false"
						>{@render ic(
							'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 4.5v4M8 11v.5',
							14
						)}{LIBELLE.signaler}</button
					>
				{/if}
				<div class="menu-barre__sep"></div>
			{/if}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- adresses composées par la route -->
			<a class="menu-note__lien" href={adresses.historique}>{LIBELLE.historique}</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<button type="button">Exporter</button>
			<button type="button">Imprimer</button>
			{#if ecriture}
				<div class="menu-barre__sep"></div>
				<button class="menu-note__danger" type="button">Supprimer</button>
			{/if}
		</div>
	</div>
{/snippet}

<Coquille
	classeContenu="lecture"
	cibleEvitement="article"
	fil={['Accueil', ...rangement, note.titre]}
	courant={rangement.slice(1)}
	{droits}
	donnees={{ 'data-registre': registre }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_ABSENT}
	version=""
	{notifications}
	{actionsDEntete}
>
	{#snippet enfants()}
		<!-- ═══════════ Sommaire — 190 px, collant, il disparaît sous 1380 px ═══ -->
		<div class="colonne-sommaire" data-colonne="sommaire">
			<SommaireDeLaNote entrees={affichee.sommaire} />
		</div>

		<!-- ═══════════ Le document ═════════════════════════════════════════════ -->
		<article class="document" id="article">
			<!-- eslint-disable svelte/no-navigation-without-resolve -- toutes les adresses
				de ce bloc sont composées par la route, jamais écrites ici. -->
			<nav class="registres" id="registre" aria-label="Registre de lecture">
				<a
					class="registres__onglet"
					href={adresses.reference}
					aria-current={surLOperationnel ? undefined : 'page'}
					>{@render ic(
						'M2 3.5c2-.8 4-.8 6 .5 2-1.3 4-1.3 6-.5v9c-2-.8-4-.8-6 .5-2-1.3-4-1.3-6-.5zM8 4v9'
					)}Référence</a
				>
				{#if aOperationnel}
					<a
						class="registres__onglet"
						href={adresses.operationnel}
						aria-current={surLOperationnel ? 'page' : undefined}
						><svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
							><circle cx="8" cy="8" r="2.2" /><path
								d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
							/></svg
						>Opérationnel</a
					>
				{:else if ecriture}
					<!-- JAMAIS D'ONGLET DÉSACTIVÉ : le registre absent se crée, et l'invite dit
						 où. Elle mène à l'éditeur de l'Opérationnel, qui EST l'endroit où on
						 l'écrit — un registre créé vide n'aurait rien à lire. -->
					<a class="btn registres__creer" href={adresses.modifierLOperationnel}
						><span class="registres__plus" aria-hidden="true">+</span
						>{LIBELLE.creerLOperationnel}</a
					>
				{/if}
			</nav>

			<!-- La ligne de vivacité — `data-attention` commande le fond et le poids. -->
			<p class="ligne-vivacite" data-attention={viv.attention}>
				<span class="ligne-vivacite__etat {viv.classe}">
					<GlypheDeVivacite etat={viv.etat} />{viv.libelle}
				</span>
				<span class="ligne-vivacite__sep" aria-hidden="true"></span>
				<span class="ligne-vivacite__verif">{viv.ligneVerification}</span>
				<span class="ligne-vivacite__sep" aria-hidden="true"></span>
				<span class="ligne-vivacite__echeance {viv.classe}">{viv.ligneEcheance}</span>
				<span class="ligne-vivacite__sep" aria-hidden="true"></span>
				<a class="ligne-vivacite__histoire" href={adresses.historique}
					>{"Voir l'historique " + ''}{@render ic('M4 6l4 4 4-4', 12)}</a
				>
				{#if viv.revision}
					<span class="pastille-revision"
						>{viv.revisionPar === ''
							? 'Révision demandée'
							: `Révision demandée · ${viv.revisionPar}`}</span
					>
				{/if}
			</p>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<!-- Le signalement — déplié par l'entrée « Signaler à réviser » du menu ⋮.
				 `UC-M06-03` veut l'explication : sans elle, l'action refuse. -->
			{#if ecriture}
				<div class="reviser si-ecriture" id="panneau-reviser" data-ouvert="non">
					<label class="etiq" for="txt-reviser">Qu'attendez-vous de cette révision&nbsp;?</label>
					<textarea
						id="txt-reviser"
						placeholder="Décrivez ce qui doit être vérifié ou corrigé. Le message sera affiché en tête de la note."
					></textarea>
					<div class="reviser__pied">
						<button class="btn btn--principal" type="button" id="btn-reviser-envoi"
							>Signaler à réviser</button
						>
						<button class="btn btn--discret" type="button" id="btn-reviser-annul">Annuler</button>
					</div>
				</div>
			{/if}

			<h1 class="titre-note" id="h-titre">{note.titre}</h1>

			<!-- eslint-disable svelte/no-navigation-without-resolve -- adresse composée par la route -->
			<div class="etiquettes">
				{#each note.etiquettes as etiquette (etiquette)}
					<span class="etiquette">{etiquette}</span>
				{/each}
				{#if ecriture}
					<a class="etiquettes__ajout" href={adresses.modifier}
						><span aria-hidden="true">+</span>Ajouter une étiquette</a
					>
				{/if}
			</div>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<div class="metas">
				<div class="meta-item">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						aria-hidden="true"><path d="M4 5h16v15H4zM4 10h16M8 3v4M16 3v4" /></svg
					>
					<span class="meta-item__corps"
						><span class="meta-item__valeur">{entete.creeeLe}</span><span class="meta-item__libelle"
							>Date de création</span
						></span
					>
				</div>
				<div class="meta-item">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						aria-hidden="true"
						><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></svg
					>
					<span class="meta-item__corps"
						><span class="meta-item__valeur">{note.auteur}</span><span class="meta-item__libelle"
							>Rédacteur</span
						></span
					>
				</div>
				<div class="meta-item">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						aria-hidden="true"
						><path
							d="M3 12c2.5-4.5 6-6.5 9-6.5s6.5 2 9 6.5c-2.5 4.5-6 6.5-9 6.5s-6.5-2-9-6.5zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
						/></svg
					>
					<span class="meta-item__corps"
						><span class="meta-item__valeur">{consultations}</span><span class="meta-item__libelle"
							>{consultations30j}</span
						></span
					>
				</div>
				<div class="meta-item">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						aria-hidden="true"><path d="M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01" /></svg
					>
					<span class="meta-item__corps"
						><span class="meta-item__valeur">Version</span><span class="meta-item__libelle"
							>{entete.version ?? 'aucune version capturée'}</span
						></span
					>
				</div>
			</div>

			<div class="filet-doc" aria-hidden="true">
				<span class="filet-doc__trait"></span>
				<svg
					width="22"
					height="14"
					viewBox="0 0 22 14"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><circle cx="4" cy="7" r="3" /><rect x="9" y="1" width="4" height="12" rx="1.5" /><circle
						cx="18"
						cy="7"
						r="3"
					/></svg
				>
				<span class="filet-doc__trait"></span>
			</div>

			<!-- LE CORPS. Il est rendu par `rendreDocument` et par lui seul (`ADR-004`) :
				 la vue reçoit du HTML déjà rendu, dont chaque nœud de texte a été
				 échappé. Un registre sans texte le DIT, et nomme le geste qui l'écrit. -->
			<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé (ADR-003) -->
			<!-- prettier-ignore -->
			<div class="prose" id={idDuCorps}>{#if corps === null}<div class="zone-etat"><div class="zone-etat__titre">{`Registre ${nomDuRegistre} vide`}</div><div class="zone-etat__txt">Cette note ne porte encore aucun texte pour ce registre.</div></div>{:else}{@html corps}{/if}</div>
			<!-- eslint-enable svelte/no-at-html-tags -->

			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse composée par la route -->
			<footer class="pied-note">
				<span>{viv.rappel}</span>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse composée par la route -->
				<a class="pied-note__planche" href={adresses.planche}>Planche des états de vivacité</a>
			</footer>
		</article>

		<!-- ═══════════ Colonne de contexte — tiroir sous 1180 px ═══════════════ -->
		<aside class="contexte" data-colonne="contexte" aria-label="Contexte de la note">
			<button class="contexte__fermer" type="button" data-fermer-tiroir aria-label="Fermer"
				>{@render ic('M3 3l10 10M13 3L3 13')}</button
			>

			<!-- eslint-disable svelte/no-navigation-without-resolve -- adresses composées par la route -->
			<section class="zone" data-zone="actions">
				<p class="etiq zone__titre">Actions</p>
				<div class="zone__actions">
					{#if ecriture}
						<button class="action" type="button"
							>{@render ic('M11 2.5l2.5 2.5L5 13.5H2.5V11z')}Modifier la référence</button
						>
						<button class="action" type="button"
							>{@render ic('M11 2.5l2.5 2.5L5 13.5H2.5V11z')}{aOperationnel
								? "Modifier l'opérationnel"
								: "Créer l'opérationnel"}</button
						>
					{/if}
					<a class="action" href={adresses.historique}
						>{@render ic(
							'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5'
						)}{LIBELLE.historique}</a
					>
					<button class="action" type="button"
						>{@render ic('M8 2v8M5 7l3 3 3-3M2.5 12.5h11')}Exporter</button
					>
					<button class="action" type="button"
						>{@render ic(
							'M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z'
						)}Imprimer</button
					>
					{#if ecriture}
						<button class="action action--danger" type="button"
							>{@render ic(
								'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8'
							)}Supprimer</button
						>
					{/if}
				</div>
			</section>

			<section class="zone" data-zone="contexte">
				<p class="etiq zone__titre">Contexte</p>
				<p class="contexte__univers">{contexte.univers}</p>
				<p class="contexte__rangement">
					<span class="contexte__branche" aria-hidden="true">└</span><a
						href={contexte.rangement.adresse}>{contexte.rangement.libelle}</a
					>
				</p>
				{#if contexte.voisinage !== null}
					<p class="contexte__voisines">
						<a href={contexte.voisinage.adresse}
							>{@render ic('M2 8h12M9 4l4 4-4 4', 14)}{contexte.voisinage.libelle}</a
						>
					</p>
				{/if}
			</section>

			<section class="zone" data-zone="relations">
				<a class="zone__lien" href={adresses.relations}>
					<span class="zone__lien-corps">
						<span class="etiq">Relations</span>
						<span class="zone__compte"
							><span class="chiffre">{relations}</span>{relations > 1
								? 'notes liées'
								: 'note liée'}</span
						>
					</span>
					{@render ic('M6 3l5 5-5 5', 14)}
				</a>
				{#if ecriture}
					<button class="zone__ajout" type="button"><span aria-hidden="true">+</span>Ajouter</button
					>
				{/if}
			</section>

			<section class="zone" data-zone="pieces">
				<div class="zone__tete">
					<span class="etiq">Pièces jointes</span>
					<span class="chiffre">{panneaux.pieces.length}</span>
				</div>
				{#if panneaux.pieces.length > 0}
					<div class="zone__liste">
						{#each panneaux.pieces as piece, rang (rang)}
							<a class="pj" href={piece.adresse}>
								<span class="pj__ext">{piece.extension}</span>
								<span class="pj__corps"
									><span class="pj__nom">{piece.nom}</span><span class="pj__sous"
										>{piece.taille + ' · ' + piece.depose}</span
									></span
								>
							</a>
						{/each}
					</div>
				{/if}
			</section>

			<section class="zone" data-zone="retroliens">
				<div class="zone__tete">
					<span class="etiq">Rétroliens</span>
					<span class="chiffre">{panneaux.retroliens.length}</span>
				</div>
				{#if panneaux.retroliens.length > 0}
					<div class="zone__liste">
						{#each panneaux.retroliens as retrolien (retrolien.identifiant)}
							<a class="zone__note" href={adresseDeNote(retrolien.identifiant)}
								><span class="zone__note-titre">{retrolien.titre}</span><span
									class="zone__note-sous">{retrolien.domaine}</span
								></a
							>
						{/each}
					</div>
				{/if}
			</section>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<!-- LA CARTE DE VIVACITÉ DU REGISTRE AFFICHÉ. Elle nomme le registre : deux
				 cycles cohabitent, et une carte anonyme laisserait croire qu'il n'y en a
				 qu'un. -->
			<section class="carte-vivacite">
				<p class="etiq">{`Vivacité (${nomDuRegistre})`}</p>
				<p class="carte-vivacite__etat {viv.classe}">
					<GlypheDeVivacite etat={viv.etat} taille={18} />{viv.libelle}
				</p>
				<p class="carte-vivacite__verif">{viv.ligneVerification}</p>

				<!-- LA FRISE. La position d'aujourd'hui vient de `fraction`, calculée par la
					 fabrique : la vue ne fait que la poser en pourcentage. -->
				<div class="frise" aria-hidden="true">
					<span class="frise__ecoule {viv.classe}" style:width={positionDuJour}></span>
					<span class="frise__reste" style:left={positionDuJour}></span>
					<span class="frise__rond frise__rond--depart {viv.classe}"></span>
					<span class="frise__rond frise__rond--jour {viv.classe}" style:left={positionDuJour}
					></span>
					<span
						class={`frise__rond frise__rond--echeance ${viv.echeanceEchue ? viv.classe : ''}`}
						data-echue={viv.echeanceEchue ? 'oui' : 'non'}
					></span>
				</div>
				<div class="frise__legendes">
					<!-- LE MOT SUIT LE FAIT : une note jamais vérifiée part de sa dernière
						 modification, et écrire « vérifiée » sous cette date-là serait le
						 seul mensonge de la frise. -->
					<span class="frise__legende"
						><span class="frise__date">{viv.departCourt}</span><span class="frise__mot"
							>{viv.jamaisVerifiee ? 'modifiée' : 'vérifiée'}</span
						></span
					>
					<span class="frise__legende frise__legende--centre"
						><span class="frise__date">aujourd'hui</span><span class="frise__mot"
							>{viv.relatif}</span
						></span
					>
					<span class="frise__legende frise__legende--fin"
						><span class="frise__date">{viv.echeanceCourt}</span><span class="frise__mot"
							>échéance</span
						></span
					>
				</div>
			</section>

			<section class="carte-rappel">
				<svg
					width="18"
					height="18"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					aria-hidden="true"
					><circle cx="8" cy="9" r="5.5" /><path d="M8 6.5V9l2 1.2M6 2h4M12.5 4.5l1-1" /></svg
				>
				<span class="carte-rappel__corps">
					<span class="etiq">Rappel automatique</span>
					<span class="carte-rappel__texte">{viv.rappel}</span>
				</span>
			</section>
		</aside>
	{/snippet}
</Coquille>

<!-- LA BULLE DU GESTE — le texte vient de la route, jamais d'un état d'écran : le
	geste passe par une soumission et une redirection, et une redirection ne
	transporte que son adresse. Le câblage l'efface au bout de 2,6 s. -->
{#if annonce !== null}
	<div class="toast" id="toast" role="status">
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
		>{annonce}
	</div>
{/if}
