<script lang="ts">
	/**
	 * V-28 — Console · Domaines. Deuxième des dix sections, et la jumelle de
	 * balisage de V-27 : même enveloppe, même navigation secondaire, même
	 * panneau de formulaire, même famille de dialogue destructif.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * ELLE N'A PAS LA MÊME COQUILLE QUE V-27, ET C'EST LE GEL QUI EN DÉCIDE
	 *
	 * V-27 est de forme COMPLÈTE, V-28 de forme ABRÉGÉE (ARB-021, A-1) : barre
	 * sans les deux menus déroulants, rail sans pictogrammes ni `data-vers`,
	 * `Gestion` en `si-ecriture`, arborescence de quinze nœuds ÉCRITE AU
	 * BALISAGE que le corpus ne peut pas produire. Les deux vues du même lot
	 * portent donc deux formes différentes — c'est mesuré, pas supposé, et
	 * c'est le premier fait à ne pas généraliser d'une console à l'autre.
	 *
	 * L'ENVELOPPE `div.console` est en revanche IDENTIQUE aux dix (ARB-023) :
	 * grille `244px minmax(0,1fr)`, `aside.nav2` puis `main.travail#travail`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL — VOIR `V-27.svelte`
	 *
	 * Même constat, même cause : `.app[data-form="ouvert"] .tiroir-form` ne
	 * peut pas s'appliquer à un panneau qui vit hors de `div.app`
	 * (`CLAUDE.md` §6, P-3). Il est rendu exactement, et le niveau 1 en est le
	 * seul juge.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `autofocus` — LE SEUL DU PÉRIMÈTRE, ET IL EST MESURÉ
	 *
	 * `input#sup-saisie` de l'état `sup-vide`, et lui seul. P-4 (`CLAUDE.md`
	 * §6) : `autofocus` ne survit à `stabiliser()` que dans un dialogue révélé,
	 * où la modalité est établie APRÈS la stabilisation. Le gel y pose le focus
	 * par `setTimeout(() => saisieSup.focus(), 50)` ; sans lui, l'anneau de
	 * focalisation manque et l'état coûte 4 684 pixels (`ECART-024`).
	 *
	 * Il N'EST PAS posé sur les treize `input.saisie` du panneau — le panneau
	 * est hors fenêtre, le relevé qui les rangeait parmi les cibles à risque
	 * était faux, et zéro pixel en dépend.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE DIALOGUE — ARB-017, RÉVÉLATION `modalite-dialogue`
	 *
	 * `sup-vide` ouvre `dialog#dlg-supprimer` ; `sup-plein`, qui est le réglage
	 * PAR DÉFAUT du contrôle, n'émet aucun `change` et n'ouvre rien — le
	 * scénario le déclare lui-même identique à `form-ferme`. La vue rend
	 * l'attribut `open`, et rien de plus : c'est le banc qui établit la
	 * modalité, des deux côtés.
	 *
	 * AUCUN COMPORTEMENT — ARB-011. La confirmation par le nom, la bascule des
	 * modules et leurs conséquences sont du temps 3 ; le squelette rend l'état
	 * INITIAL de chacun, celui que le gel écrit à l'ouverture.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-28.css` (P-6.3). Les `style=` reproduits figurent à
	 * l'ensemble clos du gel de V-28 (ARB-016, P-6.4).
	 */
	import {
		DETAIL_DOMAINES,
		DOMAINES,
		INSTANCE,
		MODULES,
		MOI,
		UNIVERS,
		type CleDeModule,
		type DetailDeDomaine,
		type Domaine,
		type EtatDInstance,
		type Module,
		type NomDeDomaine,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { dossiersDuDomaine, universOrdonnes } from '$lib/coquille/arborescence';
	import type { NoeudDeDossier } from '$lib/coquille/arborescence';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import { motFicheMinuscule, motFichePluriel, motFichePlurielMinuscule } from '$lib/vocabulaire';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-28')`, variante complète. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Description et modules de chaque domaine. Absente, la constante du jeu. */
		detailDomaines?: Record<NomDeDomaine, DetailDeDomaine>;
		/** Le registre des modules de domaine. Absente, la constante du jeu. */
		modules?: Record<CleDeModule, Module>;
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines: registreDeDomaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		detailDomaines = DETAIL_DOMAINES,
		modules = MODULES
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const form = $derived(
		reglage['form'] === 'creation' || reglage['form'] === 'edition'
			? (reglage['form'] as 'creation' | 'edition')
			: 'ferme'
	);
	/** Suppression : domaine peuplé (défaut, dialogue fermé) ou domaine vide. */
	const sup = $derived(reglage['sup'] === 'vide' ? 'vide' : 'plein');

	/** Le domaine tel que la copie de travail de la maquette le porte (`V-28:2912`). */
	interface DomaineDeTravail {
		readonly nom: string;
		readonly univers: string;
		readonly couleur: string;
		readonly description: string;
		readonly modules: readonly CleDeModule[];
	}

	/**
	 * LE DOMAINE « TÉLÉPHONIE » EST UN LITTÉRAL DU GEL, et il est porté comme
	 * tel. `V-28:2918` l'ajoute à la copie de travail sous un commentaire qui
	 * en donne le motif : « le brief demande que ce cas soit maquetté, et il
	 * existe réellement en exploitation ». Aucune table du jeu de semence ne le
	 * contient — `DOMAINES` en compte quatre, tous peuplés. Le fabriquer par
	 * dérivation serait inventer une donnée que le gel n'a pas ; il est donc
	 * recopié, et le fait est écrit plutôt que tu.
	 */
	const TELEPHONIE: DomaineDeTravail = {
		nom: 'Téléphonie',
		univers: 'Production',
		couleur: '#5b4636',
		description: 'Postes fixes, standard et messagerie vocale. Espace ouvert, pas encore alimenté.',
		modules: ['notes', 'dossiers']
	};

	/**
	 * La copie de travail : le registre des domaines — plus le domaine vide,
	 * MAIS SEULEMENT QUAND LE REGISTRE EST CELUI DU JEU DE SEMENCE.
	 *
	 * `TELEPHONIE` est un littéral de démonstration (voir juste au-dessus) : il
	 * donne à la maquette le cas « domaine vide » que le brief demande de
	 * montrer, et il n'existe dans aucune table. Servi À CÔTÉ des domaines réels
	 * d'une instance, c'est une ligne que l'administrateur voit, ne peut ni
	 * éditer ni supprimer, et qui ne correspond à rien — la valeur illustrative
	 * que `P-02` proscrit, sur l'écran qui gouverne le rangement.
	 *
	 * LA CONDITION EST UNE COMPARAISON D'IDENTITÉ, ET C'EST LE PLUS PETIT GESTE
	 * POSSIBLE. `registreDeDomaines === DOMAINES` n'est vrai que lorsque la
	 * propriété n'a pas été passée, c'est-à-dire quand la vue tourne sur le jeu
	 * de semence : la maquette garde alors exactement ce qu'elle montrait, au
	 * nœud près. Dès qu'un chargeur passe les domaines de la base, la ligne
	 * disparaît. Rien de la structure, des classes, des styles ni de l'ordre
	 * n'est touché — seul le CONTENU l'est, et c'est ce que ce lot a à faire.
	 */
	const domaines: readonly DomaineDeTravail[] = $derived([
		...registreDeDomaines.map((d) => ({
			nom: d.nom,
			univers: d.univers,
			couleur: d.couleur,
			description: detailDomaines[d.nom]?.description ?? '',
			modules: detailDomaines[d.nom]?.modules ?? []
		})),
		...(registreDeDomaines === DOMAINES ? [TELEPHONIE] : [])
	]);

	/** Le tableau : par univers, puis par nom, en français (`rendreListe()`). */
	const tableau = $derived(
		[...domaines].sort(
			(a, b) => a.univers.localeCompare(b.univers, 'fr') || a.nom.localeCompare(b.nom, 'fr')
		)
	);

	/**
	 * Palette de domaines : la même intention que celle des univers — hors des
	 * teintes de fraîcheur —, mais PAS la même liste (`COULEURS`, `V-28:2923`).
	 */
	const COULEURS = [
		'#453ba0',
		'#1b6b7a',
		'#7a2f8f',
		'#3e5266',
		'#24485c',
		'#5b4636',
		'#8f3f5a',
		'#6b7c87'
	];

	/** Le code de trois lettres affiché en pastille (`CODES_MODULES`, `V-28:2934`). */
	const CODES_MODULES: Record<CleDeModule, string> = {
		notes: 'NOT',
		dossiers: 'DOS',
		fiches: 'FIC',
		cartographie: 'CAR',
		signets: 'SIG',
		carteMentale: 'MEN'
	};

	/** Ce que chaque module apporte, et ce qu'il coûte (`AIDES_MODULES`, `V-28:2926`). */
	const AIDES_MODULES: Record<CleDeModule, string> = {
		notes: "Le corps même du domaine. Sans lui, il n'y a rien à ranger.",
		dossiers:
			"Rangement arborescent des notes. À désactiver pour un domaine plat de quelques dizaines de notes, où l'arborescence coûte plus qu'elle ne rapporte.",
		fiches:
			'Objets typés — serveurs, applications, contacts — avec leurs propriétés structurées et leurs relations.',
		cartographie: `Graphe des dépendances entre ${motFichePlurielMinuscule}. N'a d'intérêt que si le domaine déclare des relations.`,
		signets:
			"Liens web curatés rattachés au domaine : documentation d'éditeur, portails de prestataires.",
		carteMentale:
			'Vue arborescente dépliable de tout le domaine, utile pour découvrir son organisation.'
	};

	/** Les six modules, dans l'ordre du registre (`Object.keys(window.MODULES)`). */
	const CLES_DE_MODULE = $derived(Object.keys(modules) as CleDeModule[]);

	/** Le nombre en français — `nb()` du gel, `toLocaleString("fr-FR")`. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	function couleurUnivers(nom: string): string {
		return univers.find((u) => u.nom === nom)?.couleur ?? '#6b7c87';
	}

	function compterDossiers(arbre: readonly NoeudDeDossier[]): number {
		return arbre.reduce((total, n) => total + 1 + compterDossiers(n.enfants), 0);
	}

	/** Les décomptes d'un domaine — calculés sur le corpus, jamais écrits (P-02). */
	interface Mesures {
		readonly notes: number;
		readonly fiches: number;
		readonly signets: number;
		readonly dossiers: number;
		readonly contributeurs: number;
		readonly vues: number;
	}
	function mesures(nom: string): Mesures {
		const duDomaine = notes.filter((n) => n.domaine === nom);
		return {
			notes: duDomaine.length,
			fiches: duDomaine.filter((n) => n.type === 'Fiche').length,
			signets: duDomaine.filter((n) => n.type === 'Signet').length,
			dossiers: compterDossiers(dossiersDuDomaine(notes, nom)),
			contributeurs: new Set(duDomaine.map((n) => n.auteur)).size,
			vues: duDomaine.reduce((total, n) => total + n.vues, 0)
		};
	}

	/* ── Le panneau de formulaire ───────────────────────────────────────────
	   `ouvrirForm(d)` — à défaut d'appel, le panneau garde son BALISAGE
	   INITIAL : sélecteur d'univers, nuancier et liste de modules VIDES. */

	/** L'édition porte sur Infrastructure — la planche le nomme (`V-28:3261`). */
	const edite = $derived(
		form === 'edition' ? (domaines.find((d) => d.nom === 'Infrastructure') ?? null) : null
	);
	const ouvert = $derived(form !== 'ferme');

	const titreDuForm = $derived(edite ? edite.nom : 'Nouveau domaine');
	const sousDuForm = $derived(
		edite
			? 'Les modifications prennent effet immédiatement.'
			: 'Il apparaîtra dans la navigation de ceux qui y ont accès.'
	);
	const couleurChoisie = $derived(edite ? edite.couleur : COULEURS[0]);
	/** `su.value` : l'univers du domaine, ou le premier du registre en création. */
	const universChoisi = $derived(edite ? edite.univers : (univers[0] as Univers).nom);
	/** `edite.modules` : ceux du domaine, ou le seul module obligatoire. */
	const modulesActifs: readonly CleDeModule[] = $derived(edite ? edite.modules : ['notes']);

	/* ── La suppression ─────────────────────────────────────────────────── */

	const aSupprimer = $derived(sup === 'vide' ? TELEPHONIE : null);
	const mesuresSup = $derived(aSupprimer ? mesures(aSupprimer.nom) : null);
	/** Un domaine est vide quand il ne porte ni note ni dossier (`V-28:3201`). */
	const videSup = $derived(mesuresSup !== null && !mesuresSup.notes && !mesuresSup.dossiers);

	/** Les quatre lignes du décompte, accordées comme le gel les accorde. */
	const decompte = $derived(
		mesuresSup
			? ([
					[mesuresSup.notes, mesuresSup.notes > 1 ? 'notes' : 'note'],
					[mesuresSup.fiches, mesuresSup.fiches > 1 ? motFichePlurielMinuscule : motFicheMinuscule],
					[mesuresSup.signets, mesuresSup.signets > 1 ? 'signets' : 'signet'],
					[mesuresSup.dossiers, mesuresSup.dossiers > 1 ? 'dossiers' : 'dossier']
				] as [number, string][])
			: []
	);
</script>

<!--
	UN DÉCOMPTE DE CELLULE. Le gel pose `s.style.color = "var(--c-encre-4)"` sur
	la SEULE cellule à zéro (`V-28:2998`) — un creux typographique, pas une
	absence. Deux branches littérales plutôt qu'un ternaire dans l'attribut :
	l'ensemble clos du gel se prouve sur des DÉCLARATIONS, et `verif/styles-en-ligne.mjs`
	ne résout pas un `undefined` posé en branche (ARB-016, P-6.4).
-->
<!-- prettier-ignore -->
{#snippet nombre(valeur: number, classes: string)}{#if valeur}<span class={classes}>{valeur}</span>{:else}<span class={classes} style="color:var(--c-encre-4)">{valeur}</span>{/if}{/snippet}

<!--
	UNE LIGNE DU TABLEAU DE GESTION, ET AUCUN BLANC ENTRE SES NŒUDS — le gel la
	construit par script (`rendreListe()`, `V-28:2961`), sans un nœud de texte
	entre les cellules. `<!-- prettier-ignore -- >` protège la région : le
	formateur y réintroduirait des blancs, que le relevé de nom accessible du
	niveau 1 verrait (`CLAUDE.md` §6, P-6).
-->
<!-- prettier-ignore -->
{#snippet ligne(d: DomaineDeTravail)}{@const m = mesures(d.nom)}<div class="tg tg--domaines tg--ligne" role="row"
	><span class="tg__puce" style="background:{d.couleur}"></span
	><div style="min-width:0"
		><div class="tg__nom">{d.nom}</div
		><div class="tg__desc">{d.description}</div
	></div
	><span class="tg__univers"><i style="background:{couleurUnivers(d.univers)}"></i>{d.univers}</span
	>{@render nombre(m.notes, 'tg__n tg--reduit')}{@render nombre(m.fiches, 'tg__n tg--reduit')}{@render nombre(m.signets, 'tg__n tg--masquable tg--reduit')}{@render nombre(m.dossiers, 'tg__n tg--masquable tg--reduit')}{@render nombre(m.contributeurs, 'tg__n tg--masquable tg--reduit')}<div class="tg__modules tg--reduit"
		>{#each d.modules as cle (cle)}<span class="mod-pastille" title={modules[cle].nom}>{CODES_MODULES[cle]}</span>{/each}</div
	><div class="tg__actions"
		><button class="btn" type="button">Modifier</button
		><button class="btn btn--destructif" type="button" aria-label="Supprimer le domaine {d.nom}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/></svg></button
	></div
></div>{/snippet}

<!--
	UNE LIGNE DE MODULE. Même régime : `rendreModules()` (`V-28:3048`) assemble
	l'étiquette sans un blanc, et `data-consequence="non"` est posé à
	l'initialisation sur les six — la conséquence d'une désactivation ne
	s'affiche qu'après un geste, donc jamais dans un état rendu.
-->
<!-- prettier-ignore -->
{#snippet moduleDuForm(cle: CleDeModule)}{@const verrou = cle === 'notes'}<label class="mod" data-verrou={verrou ? 'oui' : undefined} data-consequence="non"
	><input type="checkbox" checked={modulesActifs.includes(cle) || verrou} disabled={verrou}
	/><span class="mod__corps"
		><span class="mod__nom">{modules[cle].nom}{#if verrou}<span class="mod__oblig">toujours actif</span>{/if}</span
		><span class="mod__aide">{AIDES_MODULES[cle]}</span
		><span class="mod__consequence"></span
	></span
></label>{/snippet}

<Coquille
	fil={filDeConsole('Domaines')}
	{univers}
	domaines={registreDeDomaines}
	{notes}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
	rail="ouvert"
	role="admin"
	forme="abregee"
	donnees={{ 'data-form': ouvert ? 'ouvert' : 'ferme' }}
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
>
	{#snippet avantContenu()}
		<NavigationConsole courante="domaines" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Domaines"
			description="Les espaces de connaissance. Chaque domaine a ses contributeurs, son rangement et ses modules : un domaine qui n'a pas besoin de cartographie ne doit pas en afficher l'onglet."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau domaine" />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--domaines tg--entetes" role="row">
				<span></span>
				<span>Nom</span>
				<span>Univers</span>
				<span class="tg__n tg--reduit">Notes</span>
				<span class="tg__n tg--reduit">{motFichePluriel}</span>
				<span class="tg__n tg--masquable tg--reduit">Signets</span>
				<span class="tg__n tg--masquable tg--reduit">Dossiers</span>
				<span class="tg__n tg--masquable tg--reduit">Contrib.</span>
				<span class="tg--reduit">Modules activés</span>
				<span></span>
			</div>
			<div id="liste">
				{#each tableau as d (d.nom)}{@render ligne(d)}{/each}
			</div>
		</div>
	{/snippet}

	<!-- Les deux nœuds rendus hors de `div.app` (ARB-021, A-4), dans l'ordre du gel. -->
	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de domaine">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">{titreDuForm}</h2>
					<div class="tiroir-form__sous" id="form-sous">{sousDuForm}</div>
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
						placeholder="Infrastructure"
						value={edite ? edite.nom : ''}
					/>
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
					<!--
						ÉCART DÉCLARÉ — la valeur d'un `<textarea>` n'est pas atteignable des
						deux relevés du niveau 1 à la fois. Le motif complet, la mesure et le
						choix retenu sont écrits à `V-27.svelte`, au même endroit : les deux
						vues du lot portent le même nœud et le même constat.
					-->
					<textarea
						class="saisie"
						id="f-desc"
						rows="3"
						placeholder="Ce que ce domaine couvre, en une phrase."
						value={edite ? edite.description : ''}></textarea>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-univers"
						>Univers de rattachement <span class="oblig">*</span></label
					>
					<!-- prettier-ignore -->
					<select
						class="selecteur"
						id="f-univers"
						style="width:100%;padding:8px var(--e-3);border:1px solid var(--c-trait-fort);border-radius:var(--r-2);background:var(--c-papier);font-family:var(--f-ui);font-size:var(--t-base)"
						>{#if ouvert}{#each universOrdonnes(univers) as u (u.nom)}<option value={u.nom} selected={u.nom === universChoisi}>{u.nom}</option>{/each}{/if}</select
					>
					<span class="champ__aide" id="aide-univers"
						>Le rattachement change la place du domaine dans la navigation, jamais son contenu.</span
					>
				</div>

				<div class="champ">
					<span class="champ__label">Couleur</span>
					<!-- prettier-ignore -->
					<div class="couleurs" id="f-couleurs" role="group" aria-label="Couleur du domaine"
						>{#if ouvert}{#each COULEURS as c (c)}<button type="button" style="background:{c}" aria-pressed={c === couleurChoisie} aria-label="Couleur {c}"></button>{/each}{/if}</div
					>
					<span class="champ__aide">Sert au repérage. Choisie hors des teintes de fraîcheur.</span>
				</div>

				<div class="champ">
					<span class="champ__label">Modules</span>
					<span class="champ__aide" style="margin-bottom:var(--e-2)"
						>Un module désactivé n'apparaît nulle part pour ce domaine : ni onglet grisé, ni entrée
						morte.</span
					>
					<!-- prettier-ignore -->
					<div class="modules-form" id="f-modules"
						>{#if ouvert}{#each CLES_DE_MODULE as cle (cle)}{@render moduleDuForm(cle)}{/each}{/if}</div
					>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button class="btn btn--destructif" id="form-supprimer" hidden={!edite}>Supprimer</button>
				<button class="btn" id="form-annuler">Annuler</button>
				<button class="btn btn--principal" id="form-valider"
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le domaine'}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg dlg--destructif"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={aSupprimer !== null}
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
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le domaine</h2>
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
					<div class="decompte">
						<div class="decompte__titre" id="sup-titre-decompte">
							{videSup ? 'Ce domaine est vide' : 'Ce qui sera détruit'}
						</div>
						<!--
							LE DÉCOMPTE RESTE AFFICHÉ MÊME À ZÉRO : c'est lui qui prouve que le
							domaine est bien vide, et il rassure autant qu'il alerte. Aucun blanc
							entre le nombre et son mot — le gel accole les deux nœuds.
						-->
						<!-- prettier-ignore -->
						<ul id="sup-decompte"
							>{#each decompte as [combien, mot] (mot)}<li>{#if combien}<b>{combien}</b>{:else}<b style="color:var(--c-encre-3)">{combien}</b>{/if}{mot}</li>{/each}</ul
						>
						<div class="decompte__note" id="sup-note">
							{#if mesuresSup}{videSup
									? "Aucun contenu ne sera perdu. La confirmation par le nom reste demandée : la suppression d'un domaine est irréversible même quand il est vide."
									: `Ces notes totalisent ${nb(mesuresSup.vues)} consultations. Tous les liens internes qui pointent vers elles deviendront cassés dans les autres domaines.`}{/if}
						</div>
					</div>

					<div class="definitif">
						<svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span
							>La suppression est définitive. Il n'y a pas de corbeille : rien de ce qui précède ne
							pourra être récupéré, ni par vous, ni par un administrateur.</span
						>
					</div>

					<!--
						Les comptes ne suivent pas le domaine : il faut le dire, sans quoi on
						imagine supprimer des collègues en supprimant leur domaine.
					-->
					<div class="conserve">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							style="flex:none;margin-top:1px"
							><circle cx="8" cy="5.5" r="2.6" /><path d="M2.8 13.5a5.2 5.2 0 0 1 10.4 0" /></svg
						>
						<span id="sup-comptes"
							>{#if !mesuresSup}—{:else if mesuresSup.contributeurs}Les {mesuresSup.contributeurs}
								comptes rattachés à ce domaine sont conservés : ils perdent seulement ce rattachement
								et devront s'en voir attribuer un autre. Supprimer un domaine ne supprime jamais de compte.{:else}Aucun
								compte n'est rattaché à ce domaine. Supprimer un domaine ne supprime jamais de
								compte.{/if}</span
						>
					</div>

					<div class="champ" id="champ-confirm">
						<label class="champ__label" for="sup-saisie">
							Pour confirmer, retapez le nom du domaine :
							<span class="confirmation__cible" id="sup-cible">{aSupprimer?.nom ?? '—'}</span>
						</label>
						<!--
							LE SEUL `autofocus` DU PÉRIMÈTRE — et il ne vaut que dans un dialogue
							révélé (P-4). Le gel y pose le focus à l'ouverture ; sans lui,
							l'anneau de focalisation manque à `sup-vide` et l'état coûte
							4 684 pixels.
						-->
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="saisie"
							type="text"
							id="sup-saisie"
							autocomplete="off"
							spellcheck="false"
							autofocus
							placeholder="Nom du domaine"
						/>
					</div>
				</div>

				<div class="dlg__pied">
					<button class="btn" data-fermer>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						disabled
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
					>
						Supprimer définitivement
					</button>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
