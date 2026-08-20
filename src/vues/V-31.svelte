<script lang="ts">
	/**
	 * V-31 — Console · Templates.
	 * Route `/console/templates` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * `data-numerote="non"` EST POSÉ SUR `div.app`, ET NULLE PART AILLEURS.
	 * Le gel l'écrit là (`V-31:1488`) alors que la règle qui l'exploite vise
	 * `body` (`docs/releve-vues.md` §7.7) : dans cette vue l'attribut ne produit
	 * donc RIEN, et le gel le veut ainsi. Le porter sur `<body>` — ce que
	 * `verif/references/protocole-app.json` → `attributs_de_corps` permettrait —
	 * CHANGERAIT le rendu. C'est un comblement, et il serait rouge au banc.
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-31 : `rassurance`,
	 * `structure-apercu`, `redaction-tpl`, `outils-red`, `oz`, `ob`, `ob--txt`,
	 * et le modificateur de grille `tg--templates`. V-31 est la vue qui emploie
	 * le PLUS d'homonymes du périmètre — quinze (`docs/releve-vues.md` §7.3),
	 * dont `.selecteur`, `.prose` et `.contexte` : AUCUNE FACTORISATION.
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, `.app[data-form="ouvert"] .tiroir-form` ne l'atteint pas. Le
	 * NIVEAU 1 en est le seul juge (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus` : hors dialogue, le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans le dialogue, `showModal()` — établi par le
	 * banc (ARB-017) — focalise déjà `button.dlg__fermer`.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : le total d'utilisations est la somme
	 * des utilisations de `TEMPLATES`, et la structure annoncée est extraite du
	 * contenu du squelette — la règle du gel (`V-31:3295`), pas une table
	 * parallèle.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-31.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		TEMPLATES,
		TYPES_NOTE,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Template,
		type TypeDeNote,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × suppression. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-31')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Les squelettes déclarés. Absente, la constante du jeu de semence. */
		templates?: readonly Template[];
		/** Les types de note proposés. Absente, la constante du jeu de semence. */
		typesNote?: readonly TypeDeNote[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		templates = TEMPLATES,
		typesNote = TYPES_NOTE
	}: Proprietes = $props();

	/**
	 * LA STRUCTURE ANNONCÉE EST EXTRAITE DU CONTENU, jamais lue ailleurs.
	 * C'est la règle du gel (`V-31:3295`) : les titres de section du squelette
	 * SONT sa structure. `Template.structure` du jeu de semence dit la même
	 * chose, mais la lire ferait deux sources pour une seule — et le contenu
	 * saisi dans le panneau, lui, n'a pas de table à consulter.
	 */
	function structure(html: string): readonly string[] {
		return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
			(m[1] ?? '').replace(/<[^>]*>/g, '').trim()
		);
	}

	/**
	 * Le nombre de notes créées à partir d'un squelette.
	 *
	 * `Template.utilisations` est FACULTATIF dans `seeds/corpus.ts` — les
	 * variantes réduites du corpus (V-17, V-18, V-19…) ne le portent pas. V-31
	 * est nourrie du jeu complet, qui le porte pour les quatre templates : le
	 * repli à zéro n'est jamais emprunté ici, il satisfait le typage.
	 */
	function utilisations(t: Template): number {
		return t.utilisations ?? 0;
	}

	/** Le total affiché par le bandeau de rassurance — calculé, jamais écrit. */
	const totalUtilisations = $derived(templates.reduce((s, t) => s + utilisations(t), 0));

	/**
	 * LE SQUELETTE D'UN TEMPLATE NEUF est celui du gel (`V-31:3468`) : une
	 * section et une ligne de texte d'exemple. Aucun template du jeu de semence
	 * ne le porte — c'est le point de départ, pas une donnée.
	 */
	const SQUELETTE_NEUF = "<h2>Première section</h2><p>Texte d'exemple, à remplacer.</p>";

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et le dialogue ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut (`V-31:3567`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'defaut'));
	const panneauOuvert = $derived(form !== 'ferme');

	/** Le template édité par la position « Édition · Procédure » (`V-31:3571`). */
	const edite = $derived<Template | null>(form === 'edition' ? (templates[0] ?? null) : null);
	const contenuEdite = $derived(panneauOuvert ? (edite ? edite.contenu : SQUELETTE_NEUF) : '');
	const titresEdites = $derived(panneauOuvert ? structure(contenuEdite) : []);

	/** Le template par défaut, hors celui qu'on édite — l'aide du gel s'y règle. */
	const defautActuel = $derived(templates.find((t) => t.defaut && t !== edite) ?? null);

	/**
	 * LE TEMPLATE PROPOSÉ À LA SUPPRESSION (`V-31:3574`) : celui par défaut pour
	 * la position « Template par défaut », le premier qui ne l'est pas pour
	 * « Template ordinaire ». La position par défaut n'ouvre rien.
	 */
	const aSupprimer = $derived<Template | null>(
		sup === 'defaut' ? null : (templates.find((t) => !t.defaut) ?? null)
	);
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Templates')}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme', 'data-numerote': 'non' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
>
	{#snippet avantContenu()}
		<NavigationConsole courante="templates" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Templates"
			description="Les squelettes proposés au moment de créer une note. Ils font gagner la page blanche, jamais l'écriture : le rédacteur reste libre de tout modifier ou de partir de rien."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau template" />
			{/snippet}
		</TeteDeSection>

		<!-- Réponse à l'inquiétude la plus fréquente, affichée d'emblée. -->
		<div class="rassurance">
			<svg
				width="18"
				height="18"
				viewBox="0 0 16 16"
				fill="none"
				stroke="var(--c-frais)"
				stroke-width="1.8"
				style="flex:none;margin-top:1px"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
			>
			<div>
				<b>Modifier ou supprimer un template n'affecte aucune note existante.</b>
				Un squelette est copié au moment de la création : la note devient aussitôt indépendante. Les
				<span id="total-utilisations">{totalUtilisations}</span> notes déjà créées à partir de ces templates
				ne bougeront pas.
			</div>
		</div>

		<div class="tableau-gestion">
			<div class="tg tg--templates tg--entetes" role="row">
				<span>Nom et structure</span>
				<span class="tg--masquable">Type de note</span>
				<span class="tg--masquable">Par défaut</span>
				<span class="tg--masquable">Utilisations</span>
				<span></span>
			</div>
			<div id="liste">
				{#each templates as t (t.id)}
					{@const titres = structure(t.contenu)}
					<div class="tg tg--templates tg--ligne">
						<div style="min-width:0">
							<div class="tg__nom">{t.nom}</div>
							<div class="tg__desc" style="font-family:var(--f-donnee)">
								{titres.length ? titres.join(' › ') : 'Squelette sans section'}
							</div>
						</div>
						<span class="past past--type tg--masquable" style="justify-self:start">{t.type}</span>
						<span class="tg--masquable"
							>{#if t.defaut}<span class="past past--defaut">par défaut</span>{:else}<button
									class="btn btn--discret"
									style="padding:3px var(--e-2);font-size:var(--t-mini)">Marquer</button
								>{/if}</span
						>
						<span
							class="tg__n tg--masquable"
							style={utilisations(t) ? undefined : 'color:var(--c-encre-4)'}
							>{utilisations(t)} {utilisations(t) > 1 ? 'notes' : 'note'}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button">Modifier</button>
							<button class="btn" type="button" aria-label="Dupliquer {t.nom}"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
										d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
									/></svg
								></button
							>
							<button class="btn btn--destructif" type="button" aria-label="Supprimer {t.nom}"
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
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de template">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.nom : 'Nouveau template'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{utilisations(edite)}
							{utilisations(edite) > 1
								? 'notes ont été créées à partir de ce squelette — elles ne bougeront pas.'
								: 'note a été créée à partir de ce squelette — elle ne bougera pas.'}{:else}Ce que
							vous écrivez ici est exactement ce que trouvera le rédacteur.{/if}
					</div>
				</div>
				<button class="tiroir-form__fermer" id="form-fermer" aria-label="Fermer le formulaire">
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>

			<div class="tiroir-form__corps">
				<div class="champ" id="champ-nom">
					<label class="champ__label" for="f-nom">Nom <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Procédure d'intervention"
						value={edite ? edite.nom : ''}
					/>
					<span class="champ__aide">Affiché au moment de choisir un point de départ.</span>
					<div class="champ__erreur" id="erreur-nom" hidden>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span id="erreur-nom-txt"></span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Description</label>
					<textarea
						class="saisie"
						id="f-desc"
						rows="2"
						placeholder="Quand employer ce squelette plutôt qu'un autre."
						value={edite ? edite.description : ''}></textarea>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-type">Type de note associé</label>
					<select class="selecteur" id="f-type"
						>{#if panneauOuvert}{#each typesNote as type (type)}<option
									value={type}
									selected={type === (edite ? edite.type : 'Procédure')}>{type}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide"
						>Choisir ce template pré-remplira le type de la note. Le rédacteur pourra le changer.</span
					>
				</div>

				<div class="champ">
					<label class="case" style="align-items:flex-start">
						<input type="checkbox" id="f-defaut" checked={edite ? edite.defaut : false} />
						<span class="case__txt"
							>Template par défaut
							<span class="case__aide" id="aide-defaut"
								>{#if panneauOuvert}{#if defautActuel}Proposé en premier dans le sélecteur. Cocher
										décochera « {defautActuel.nom} », qui l'est actuellement.{:else}Proposé en
										premier dans le sélecteur. Aucun template n'est marqué par défaut pour
										l'instant.{/if}{:else}Proposé en premier dans le sélecteur. Un seul template
									peut l'être : cocher celui-ci décochera l'actuel.{/if}</span
							>
						</span>
					</label>
				</div>

				<div class="champ">
					<span class="champ__label">Contenu du squelette</span>
					<span class="champ__aide" style="margin-bottom:var(--e-2)"
						>Éditeur réduit : titres, listes, tâches et encadrés. Le texte sert d'exemple, il est
						destiné à être remplacé.</span
					>

					<div class="outils-red" role="toolbar" aria-label="Mise en forme du squelette">
						<div class="oz">
							<button class="ob ob--txt" type="button" data-bloc="h2" title="Titre de section"
								>H2</button
							>
							<button class="ob ob--txt" type="button" data-bloc="h3" title="Sous-titre">H3</button>
						</div>
						<div class="oz">
							<button class="ob" type="button" data-cmd="bold" title="Gras"
								><b style="font-family:var(--f-ui);font-size:13px">G</b></button
							>
							<button class="ob" type="button" data-cmd="italic" title="Italique"
								><i style="font-family:var(--f-lecture);font-size:13px">I</i></button
							>
						</div>
						<div class="oz">
							<button
								class="ob"
								type="button"
								data-cmd="insertUnorderedList"
								title="Liste à puces"
								aria-label="Liste à puces"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M6 4h8M6 8h8M6 12h8" /><circle
										cx="3"
										cy="4"
										r="1"
										fill="currentColor"
										stroke="none"
									/><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" /><circle
										cx="3"
										cy="12"
										r="1"
										fill="currentColor"
										stroke="none"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-cmd="insertOrderedList"
								title="Liste numérotée"
								aria-label="Liste numérotée"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M6 4h8M6 8h8M6 12h8" /><path
										d="M2 2.5h1V6M1.8 9.2h1.6L1.8 11.4h1.7"
										stroke-width="1.2"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-bloc="taches"
								title="Liste de tâches"
								aria-label="Liste de tâches"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><rect x="1.5" y="2.5" width="4" height="4" rx="1" /><rect
										x="1.5"
										y="9.5"
										width="4"
										height="4"
										rx="1"
									/><path d="M7.5 4.5H14M7.5 11.5H14" /></svg
								>
							</button>
						</div>
						<div class="oz">
							<button
								class="ob"
								type="button"
								data-bloc="alerte-attention"
								title="Encadré attention"
								aria-label="Encadré attention"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									><path d="M8 6v3M8 11.2v.3" /><path
										d="M7 2.9L1.7 12a.8.8 0 0 0 .7 1.2h11.2a.8.8 0 0 0 .7-1.2L9 2.9a1.1 1.1 0 0 0-2 0z"
									/></svg
								>
							</button>
							<button
								class="ob"
								type="button"
								data-bloc="code"
								title="Bloc de code"
								aria-label="Bloc de code"
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
										d="M6 6.5L4 8l2 1.5M10 6.5L12 8l-2 1.5"
									/></svg
								>
							</button>
						</div>
					</div>
					<div
						class="prose redaction-tpl"
						id="f-contenu"
						contenteditable="true"
						spellcheck="true"
						role="textbox"
						aria-multiline="true"
						aria-label="Contenu du squelette"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html contenuEdite}
					</div>
				</div>

				<div class="champ">
					<span class="champ__label">Structure produite</span>
					<div class="structure-apercu" id="apercu-structure">
						{#if panneauOuvert}{#if titresEdites.length}{#each titresEdites as titre (titre)}<span
										>{titre}</span
									>{/each}{:else}<span
									style="font-size:var(--t-mini);color:var(--c-encre-3);background:none"
									>Aucune section — le squelette s'ouvrira sur un texte libre.</span
								>{/if}{/if}
					</div>
					<span class="champ__aide"
						>Les titres de section, tels qu'ils apparaîtront dans le sélecteur de template.</span
					>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button class="btn btn--destructif" id="form-supprimer" hidden={!edite}>Supprimer</button>
				<button class="btn" id="form-dupliquer" hidden={!edite}>Dupliquer</button>
				<button class="btn" id="form-annuler">Annuler</button>
				<button class="btn btn--principal" id="form-valider"
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le template'}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={aSupprimer !== null}
		>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le template</h2>
					<button class="dlg__fermer" data-fermer aria-label="Fermer">
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
					<p class="dlg__texte" id="sup-txt">
						{#if aSupprimer}« {aSupprimer.nom} » disparaîtra du choix proposé à la création d'une note.{:else}—{/if}
					</p>
					<!-- Le rappel est répété ici, à l'endroit où l'inquiétude se manifeste. -->
					<div class="contexte contexte--succes" style="margin:0">
						<span class="contexte__marque" aria-hidden="true">✓</span>
						<div>
							<div class="contexte__titre">Aucune note ne sera touchée</div>
							<div id="sup-rassure">
								{#if aSupprimer}{#if utilisations(aSupprimer)}Les {utilisations(aSupprimer)} notes créées
										à partir de ce squelette gardent leur contenu, leur structure et leur historique.
										Un template est copié à la création : elles n'y sont plus rattachées depuis longtemps.{:else}Aucune
										note n'a encore été créée à partir de ce squelette.{/if}{:else}—{/if}
							</div>
						</div>
					</div>
					<div id="sup-defaut" hidden={!aSupprimer?.defaut}>
						<div class="refus">
							<div class="refus__titre">Ce template est le template par défaut</div>
							<div class="refus__sortie">
								En le supprimant, la création de note s'ouvrira sur la page vierge tant qu'un autre
								n'aura pas été marqué par défaut. Ce n'est pas bloquant, mais autant le savoir.
							</div>
						</div>
					</div>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						>Supprimer</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
