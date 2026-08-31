<script lang="ts">
	/**
	 * V-17 — Éditeur d'une note (registre Référence).
	 * Routes `/notes/nouvelle` et `/notes/{identifiant}/modifier` (`docs/routes.md`).
	 *
	 * Coquille de forme abrégée ; le lien d'évitement vise `#redaction` avec le
	 * libellé « Aller à la rédaction » (`ARB-019`).
	 *
	 * LA BARRE D'ÉTAT PASSE PAR `apresContenu` : V-17 et V-18 sont les deux SEULES
	 * maquettes du dépôt à porter un nœud après `<main>` — `div.barre-etat`,
	 * collante (`position: sticky; bottom: 0`, `V-17:1099`). Son absence n'est pas
	 * sans incidence : elle occupe une place réelle.
	 *
	 * TROIS ATTRIBUTS DE DONNÉES HORS GABARIT — `data-vue`, `data-meta` et
	 * `data-numerote`, portés par `donnees`. Le premier commande `.si-redaction` /
	 * `.si-apercu` (`V-17.css:711-712`), le deuxième le dépliage des métadonnées
	 * sous 980 px. LE TROISIÈME NE PRODUIT RIEN, ET LE GEL LE VEUT AINSI : le gel
	 * le pose sur `div.app#app` (`V-17:1347`) tandis que la règle qui l'exploite
	 * vise `body` (`V-17:836`). Le poser sur `<body>` CHANGERAIT le rendu.
	 *
	 * LA HAUTEUR DU CHAMP DE TITRE EST UNE MESURE DU GEL, PAS UN CHOIX : le script
	 * écrit `titre.style.height = titre.scrollHeight + "px"` (`V-17:3473`), ce qui
	 * donne 49 px — un `textarea[rows="1"]` en mesure 50,8.
	 *
	 * L'état `cas-template` rend `#dlg-template` avec l'attribut `open`, et rien
	 * d'autre : `open` n'est pas `showModal()`, la couche supérieure ne s'atteint
	 * pas déclarativement.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-17.css` ; les styles en ligne
	 * sont ceux du gel.
	 */
	import { getContext } from 'svelte';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BandeauApercu from '$lib/edition/BandeauApercu.svelte';
	import BarreDEtat from '$lib/edition/BarreDEtat.svelte';
	import ZoneDeRedaction from '$lib/edition/ZoneDeRedaction.svelte';
	import type {
		ChampDeFiche,
		Domaine,
		Note,
		Template,
		TypeDeFiche,
		TypeDeNote,
		Univers
	} from '../../seeds/corpus';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';

	/* LE NOM DE L'ORGANISATION VIENT DU CONTEXTE, JAMAIS DU PRODUIT. Cette phrase
	   nommait « la direction technique » en dur — le segment de marché du cadrage
	   soudé dans une phrase d'écran. Chaîne vide : l'instance ne s'est pas nommée,
	   et la phrase retombe sur une formulation qui n'affirme rien. */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LE CONTEXTE — CE QUE LES DEUX ROUTES PASSENT EST REQUIS. Cette vue lisait
		 * `UNIVERS`, `DOMAINES`, `MOI` et `INSTANCE` au niveau du module : l'éditeur
		 * ouvrait une note vierge dans le domaine d'un compte du jeu.
		 *
		 * `compte` COMMANDE ICI DAVANTAGE QUE LA PASTILLE : le domaine pré-choisi
		 * d'une note vierge est celui de l'utilisateur courant (`V-17:3537`), et
		 * l'arborescence du choix de dossier s'en déduit.
		 *
		 * `univers` reste optionnelle et VIDE : le contexte de coquille porte le rail.
		 */
		univers?: readonly Univers[];
		domaines: readonly Domaine[];
		universDuCompte: string;
		/** Les dossiers de chaque domaine, lus en base. `null` : déduits des notes. */
		dossiersParDomaine: Readonly<Record<string, readonly DossierDeChoix[]>> | null;
		/**
		 * LE DOSSIER SUR LEQUEL L'ÉDITEUR S'OUVRE PRÉ-REMPLI — le point d'injection que
		 * le gel offre (`dossierChoisi` assignable, `V-17:2638`) et que le port avait
		 * supprimé en le durcissant en valeur dérivée : en création, AUCUN dossier ne
		 * pouvait être coché, et la promesse de V-13 — « nouvelle note DANS CE
		 * DOSSIER » — était intenable. La valeur est le chemin AFFICHÉ, celui que
		 * `Note.dossier` porte et que le rendu compare pour cocher son bouton radio.
		 */
		dossierDeDepart?: string | null;
		compte: CompteAffiche;
		/**
		 * LES TROIS RÉFÉRENTIELS DE SAISIE — types de note, types de fiche et gabarits.
		 * Ils sont administrables (`M14`), donc propres à l'instance : les deux routes
		 * les lisent en base et les passent. Leur défaut était le jeu de démonstration.
		 */
		typesNote: readonly TypeDeNote[];
		typesFiche: Record<TypeDeFiche, readonly ChampDeFiche[]>;
		templates: readonly Template[];
		/**
		 * LA NOTE REPRISE EN MODIFICATION. La vue la lisait au corpus AU NIVEAU DU
		 * MODULE : `/notes/{identifiant}/modifier` rouvrait donc toujours la même note,
		 * quelle que fût l'adresse. Tout ce que l'écran en montre HORS DU CORPS sort du
		 * type `Note` ; le corps a sa propre propriété. Absente, il n'y a pas de note
		 * reprise — c'est le cas de la création.
		 */
		noteModifiee?: Note | undefined;
		/**
		 * LE CORPS RÉDIGÉ, EN HTML. La zone de rédaction recevait, en modification, un
		 * SNIPPET ÉCRIT ICI : les sections d'une procédure de démonstration, servies
		 * pour n'importe quelle note ouverte. Le câblage le remplaçait au montage, d'où
		 * un flash à chaque chargement — et un contenu PERMANENT sans JavaScript.
		 *
		 * C'est le HTML de `rendreDocument` (`ADR-004`), lu par la route sur le corps
		 * de la note : le même document que l'éditeur ouvrira ensuite.
		 *
		 * CHAÎNE VIDE : IL N'Y A RIEN À ÉDITER. C'est le cas ORDINAIRE d'une note créée
		 * par le produit — `creerUneNote()` n'écrit jamais NULL mais `corpsVide()`, un
		 * paragraphe sans texte : servi tel quel, la zone se déclarait NON vide. REQUISE.
		 */
		corps: string;
		/**
		 * L'ANCIENNETÉ DU DERNIER ENREGISTREMENT, quand la route la connaît. La barre
		 * d'état écrivait « dernière version il y a 3 semaines » sur n'importe quelle
		 * note — la chaîne du gel, figée. Les deux phrases restent celles du gel : un
		 * nombre donne « Enregistré · dernière version il y a N jours », `null` donne
		 * « Aucune modification ». Absente, il n'y a rien à dater.
		 */
		dernierEnregistrement?: number | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines,
		universDuCompte,
		/* L'arborescence de choix, servie par la route depuis la table `dossiers`.
		   `null`, elle se déduit des chemins des notes servies. */
		dossiersParDomaine,
		/* LE DOSSIER DE DÉPART, SERVI PAR LA ROUTE DEPUIS `?dossier=`. */
		dossierDeDepart = null,
		compte,
		typesNote,
		typesFiche,
		templates,
		noteModifiee = undefined,
		/* Le corps rédigé, servi par la route. Vide, la zone est vide et se signale telle. */
		corps,
		/* L'ancienneté du dernier enregistrement. `null` par défaut, et la barre dit
		   alors « Aucune modification ». Elle se lisait à défaut dans une TABLE du gel,
		   l'ancienneté des trente-deux notes de démonstration. */
		dernierEnregistrement = null
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** Le seul levier que la planche exerce sur le rendu — `charger()`, `V-17:3537`. */
	const cas = $derived<'vierge' | 'template' | 'modif'>(
		reglage['cas'] === 'modif' ? 'modif' : reglage['cas'] === 'template' ? 'template' : 'vierge'
	);

	const titre = $derived(cas === 'modif' ? (noteModifiee?.titre ?? '') : '');
	const typeChoisi = $derived(cas === 'modif' ? (noteModifiee?.type ?? 'Procédure') : 'Procédure');
	/* LE DOMAINE VIF — celui que le sélecteur porte MAINTENANT. Sans lui, changer de
	   domaine ne changeait pas l'arbre des dossiers : le seul dossier cochable
	   restait celui du domaine qu'on quitte, et l'enregistrement sortait en 400
	   « Choisissez un dossier de rangement. » L'aide du champ promet l'inverse :
	   « Changer de domaine réinitialise le dossier. » */
	let domaineVif = $state<string | null>(null);
	const domaineDeDepart = $derived(
		cas === 'modif' ? (noteModifiee?.domaine ?? '') : compte.domaine
	);
	const domaineChoisi = $derived(domaineVif ?? domaineDeDepart);
	const universDuDomaineChoisi = $derived(
		domaines.find((d) => d.nom === domaineChoisi)?.univers ?? universDuCompte
	);
	/* Le dossier repris ne vaut que dans SON domaine : on en sort, il tombe.
	   UN DOSSIER VIDE DÉSIGNE LA RACINE, et c'est un chemin, pas une absence.
	   `Note.dossier` ne porte que les segments SOUS la racine ; l'arborescence, elle,
	   offre cette racine sous le nom du domaine. Sans cette équivalence, aucun
	   dossier n'était coché à l'ouverture et l'enregistrement rendait `400 rangement
	   incomplet`. `garderChoix` du gel ne vaut vrai qu'au cas `modif` (`V-17:3554`). */
	const dossierAmorce = $derived(
		dossierDeDepart ??
			(cas === 'modif' && domaineChoisi === domaineDeDepart
				? noteModifiee === undefined
					? null
					: noteModifiee.dossier || domaineDeDepart
				: null)
	);
	/* LE CHOIX VIF — assignable, comme au gel. `dossierChoisi` était une valeur
	   DÉRIVÉE, nulle hors du cas `modif` : en création aucun bouton radio n'était
	   jamais coché, et RIEN NE POUVAIT LE CHANGER.
	   `undefined` dit « rien d'écarté ni de choisi depuis l'ouverture » et laisse
	   l'amorce parler ; changer de domaine y pose `null`, ce qui décoche tout. */
	let choixVifDeDossier = $state<string | null | undefined>(undefined);
	const dossierChoisi = $derived(
		choixVifDeDossier === undefined ? dossierAmorce : choixVifDeDossier
	);
	const etiquettes = $derived(cas === 'modif' ? (noteModifiee?.etiquettes ?? []) : []);

	/**
	 * L'ARBORESCENCE DU CHOIX DE DOSSIER — `window.dossiersDuDomaine`,
	 * `V-17:2247`. Elle N'EST PAS celle du rail : le gel la construit dans l'ORDRE
	 * DE RENCONTRE des notes et compte, pour chaque dossier, les notes de son chemin
	 * terminal, là où la dérivation du rail trie alphabétiquement et ne compte rien.
	 * Deux dérivations, deux objets — ce n'est pas un doublon.
	 */
	interface DossierDeChoix {
		readonly nom: string;
		readonly notes: number;
		readonly enfants: readonly DossierDeChoix[];
	}

	interface DossierEnConstruction {
		readonly nom: string;
		notes: number;
		readonly enfants: DossierEnConstruction[];
	}

	function dossiersDuDomaine(domaine: string): readonly DossierDeChoix[] {
		const racines: DossierEnConstruction[] = [];
		for (const note of corpus) {
			if (note.domaine !== domaine || !note.dossier) continue;
			let niveau = racines;
			let terminal: DossierEnConstruction | null = null;
			for (const segment of note.dossier.split('›').map((s) => s.trim())) {
				if (!segment) continue;
				let branche = niveau.find((n) => n.nom === segment);
				if (!branche) {
					branche = { nom: segment, notes: 0, enfants: [] };
					niveau.push(branche);
				}
				terminal = branche;
				niveau = branche.enfants;
			}
			if (terminal) terminal.notes += 1;
		}
		return racines;
	}

	const dossiers = $derived(
		dossiersParDomaine?.[domaineChoisi] ?? dossiersDuDomaine(domaineChoisi)
	);

	/** L'état du témoin de sauvegarde, et son libellé — `charger()`, `V-17:3537`. */
	const etatSauvegarde = $derived(cas === 'modif' ? 'enregistre' : 'vierge');
	const texteSauvegarde = $derived(
		cas === 'modif' && dernierEnregistrement !== null
			? `Enregistré · dernière version il y a ${dernierEnregistrement} ${accord(dernierEnregistrement, 'jour')}`
			: 'Aucune modification'
	);

	/* Le fil d'Ariane et le chemin courant du rail — `coquille({…})`, `V-17:3568`.
	   UN SEGMENT VIDE N'EST PAS UN RANGEMENT : sur une instance à zéro domaine, les
	   deux valent la chaîne vide et `adressesDuFil()` lisait quand même les rangs 1
	   et 2 comme un univers et un domaine — deux liens vers des adresses qui
	   n'existent pas. */
	const rangementConnu = $derived(universDuDomaineChoisi !== '' && domaineChoisi !== '');
	const fil = $derived([
		'Accueil',
		...(rangementConnu ? [universDuDomaineChoisi, domaineChoisi] : []),
		cas === 'modif' ? 'Modifier' : 'Nouvelle note'
	]);
</script>

<!--
	L'ARBORESCENCE DU CHOIX DE DOSSIER, rendue par un snippet récursif : le gel
	l'écrit par une fonction récursive (`parcourir`, `V-17:2810`), et la profondeur
	du rangement va jusqu'à dix niveaux. Le chemin porte le séparateur ` › ` du
	corpus, parce que c'est LUI qui décide quel bouton radio est coché
	(`V-17:2819`).
-->
{#snippet niveauDeDossiers(noeuds: readonly DossierDeChoix[], prefixe: string)}
	<ul>
		{#each noeuds as noeud, rang (rang)}
			{@const chemin = prefixe ? `${prefixe} › ${noeud.nom}` : noeud.nom}
			<li>
				<label class="dc"
					><input type="radio" name="choix-de-dossier" checked={dossierChoisi === chemin} /><span
						>{noeud.nom}</span
					><span class="dc__n">{noeud.notes || ''}</span></label
				>
				{#if noeud.enfants.length}{@render niveauDeDossiers(noeud.enfants, chemin)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<!--
	Le contenu du bouton principal de la barre d'état. Il vit ICI, et non dans
	`$lib/edition/`, parce qu'il porte un style en ligne — `margin-left:4px` — et
	qu'un style en ligne n'est prouvé que par la maquette rattachée au fichier
	(`ARB-016`). Même jurisprudence que le séparateur `›` de V-14.
-->
{#snippet boutonEnregistrer()}<span id="enregistrer-txt"
		>{cas === 'modif' ? 'Enregistrer les modifications' : 'Enregistrer'}</span
	>
	<kbd class="touche" style="margin-left:4px">Ctrl</kbd><kbd class="touche">S</kbd>{/snippet}

<!--
	LE CORPS REPRIS EN MODIFICATION — celui de LA NOTE OUVERTE, et rien d'autre. Ce
	bloc portait le corps de la note de démonstration, écrit au balisage ; il vient
	de la propriété `corps`, rendue par `rendreDocument` (`ADR-004`).

	POURQUOI L'INSERTION DE BALISAGE EST ADMISE ICI : la règle vise le contenu NON
	MAÎTRISÉ, et celui-ci est la sortie de `rendreDocument`, dont chaque nœud de
	texte est passé par `echapper()` et dont le schéma refuse tout document invalide
	avant le rendu (`ADR-003`).

	AUCUN BLANC ENTRE LE SNIPPET ET SON CONTENU : la zone de rédaction est un nœud
	modifiable, et un blanc inséré s'y relit comme du texte.
-->
<!-- eslint-disable-next-line svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé par `echapper()` (ADR-003) -->
{#snippet corpsRedige()}{@html corps}{/snippet}

{#snippet dialogueTemplate()}
	<!-- Sélecteur de template — rendu OUVERT par l'attribut `open`, et rien
			d'autre. -->
	<dialog class="dlg dlg--large" id="dlg-template" aria-labelledby="dlg-tpl-titre" open>
		<div class="dlg__boite">
			<div class="dlg__tete">
				<span class="dlg__marque" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><rect x="2" y="2.5" width="12" height="11" rx="1.4" /><path d="M2 6h12M6 6v7.5" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="dlg-tpl-titre">Par quoi commencer&nbsp;?</h2>
			</div>
			<div class="dlg__corps">
				<!-- La page vierge est proposée en premier et avec le même poids visuel que
						les templates : le template est subsidiaire, jamais imposé. -->
				<button
					class="btn btn--principal"
					id="tpl-vierge"
					style="width:100%;padding:12px;justify-content:flex-start;gap:var(--e-3)"
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
						/></svg
					>
					Partir d'une page vierge
				</button>
				<div class="etiq">Ou reprendre une structure éprouvée</div>
				<div id="templates" style="display:flex;flex-direction:column;gap:var(--e-2)">
					{#each templates as gabarit (gabarit.id)}<button
							class="module"
							type="button"
							style="width:100%"
							><span class="module__ic" style="font-family:var(--f-donnee);font-size:var(--t-micro)"
								>{gabarit.type.slice(0, 3).toUpperCase()}</span
							><span class="module__corps"
								><span class="module__nom">{gabarit.nom}</span><span class="module__sous"
									>{gabarit.description}</span
								><span
									class="module__sous"
									style="margin-top:var(--e-1);font-family:var(--f-donnee)"
									>{gabarit.structure.join(' › ')}</span
								></span
							></button
						>{/each}
				</div>
			</div>
		</div>
	</dialog>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="editeur"
	cibleEvitement="redaction"
	libelleEvitement="Aller à la rédaction"
	donnees={{ 'data-vue': 'redaction', 'data-meta': 'ferme', 'data-numerote': 'non' }}
	{fil}
	courant={rangementConnu ? [domaineChoisi] : []}
	{univers}
	{domaines}
	notes={corpus}
	{compte}
	version=""
	{...cas === 'template' ? { superposition: dialogueTemplate } : {}}
>
	{#snippet enfants()}
		<div class="colonne-redaction">
			<!-- Avertissements — vides à l'ouverture : les deux avis de V-17, échec
				d'enregistrement et doublon détecté, ne se posent qu'après un geste. -->
			<div id="avis"></div>

			<BandeauApercu
				texte="Prévisualisation — le rendu tel qu'il s'affichera en lecture. Rien n'est perdu."
			/>

			<!-- ---------- Titre ---------- -->
			<div class="champ" id="champ-titre">
				<label class="hors-ecran" for="titre">Titre de la note</label>
				<!-- prettier-ignore — un blanc entre la balise et la valeur entrerait dans
					la valeur du champ, donc dans son nom accessible au niveau 1 (P-6). -->
				<textarea
					class="champ-titre"
					id="titre"
					rows="1"
					placeholder="Titre de la note"
					spellcheck="false"
					style="height:49px">{titre}</textarea
				>
				<div class="champ__erreur" id="erreur-titre" hidden>
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
					Une note sans titre est introuvable. Donnez-lui-en un, même approximatif.
				</div>
			</div>

			<!-- ---------- Barre d'outils ---------- -->
			<div class="outils-red si-redaction" role="toolbar" aria-label="Mise en forme">
				<div class="oz">
					<button
						class="ob"
						type="button"
						data-cmd="undo"
						title="Annuler · Ctrl+Z"
						aria-label="Annuler"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M3 7h7a3.5 3.5 0 0 1 0 7H7" /><path d="M5.5 4.5L3 7l2.5 2.5" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-cmd="redo"
						title="Rétablir · Ctrl+Y"
						aria-label="Rétablir"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M13 7H6a3.5 3.5 0 0 0 0 7h3" /><path d="M10.5 4.5L13 7l-2.5 2.5" /></svg
						>
					</button>
				</div>

				<div class="oz">
					<button class="ob ob--txt" type="button" data-bloc="h2" title="Titre de niveau 2"
						>H2</button
					>
					<button class="ob ob--txt" type="button" data-bloc="h3" title="Titre de niveau 3"
						>H3</button
					>
					<button class="ob ob--txt" type="button" data-bloc="h4" title="Titre de niveau 4"
						>H4</button
					>
				</div>

				<div class="oz">
					<button class="ob" type="button" data-cmd="bold" title="Gras · Ctrl+B" aria-label="Gras"
						><b style="font-family:var(--f-ui);font-size:14px">G</b></button
					>
					<button
						class="ob"
						type="button"
						data-cmd="italic"
						title="Italique · Ctrl+I"
						aria-label="Italique"
						><i style="font-family:var(--f-lecture);font-size:14px">I</i></button
					>
					<button
						class="ob"
						type="button"
						data-cmd="underline"
						title="Souligné · Ctrl+U"
						aria-label="Souligné"><u style="font-family:var(--f-ui);font-size:14px">S</u></button
					>
					<button class="ob" type="button" data-cmd="strikeThrough" title="Barré" aria-label="Barré"
						><s style="font-family:var(--f-ui);font-size:14px">B</s></button
					>
					<button
						class="ob"
						type="button"
						data-mark="surligne"
						title="Surligné"
						aria-label="Surligné"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M2.5 13.5h11" /><path d="M4.5 11l6-6 2 2-6 6H4.5V11z" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-mark="code"
						title="Code en ligne"
						aria-label="Code en ligne"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4" /></svg
						>
					</button>
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
							width="16"
							height="16"
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
							width="16"
							height="16"
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
							width="16"
							height="16"
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
							/><path d="M7.5 4.5H14M7.5 11.5H14M2.5 4.5l.8.8 1.4-1.6" /></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-bloc="citation"
						title="Citation"
						aria-label="Citation"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M3 3v10M6 5.5h8M6 8.5h8M6 11.5h5" /></svg
						>
					</button>
				</div>

				<div class="oz" data-secondaire="oui">
					<button
						class="ob"
						type="button"
						data-bloc="code"
						title="Bloc de code"
						aria-label="Bloc de code"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
								d="M6 6.5L4 8l2 1.5M10 6.5L12 8l-2 1.5"
							/></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="tableau" title="Tableau" aria-label="Tableau">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path
								d="M1.5 6h13M6 6v7.5M10.5 6v7.5"
							/></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="image" title="Image" aria-label="Image">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><circle
								cx="5.5"
								cy="6"
								r="1.2"
							/><path d="M2 11.5l3.5-3 3 2.5 2.5-2 3 2.5" /></svg
						>
					</button>
					<button class="ob" type="button" data-bloc="lien" title="Lien" aria-label="Lien">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.9.9" /><path
								d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.9-.9"
							/></svg
						>
					</button>
					<button
						class="ob"
						type="button"
						data-bloc="separateur"
						title="Séparateur"
						aria-label="Séparateur"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"><path d="M2 8h12" /></svg
						>
					</button>
				</div>

				<div class="oz menu-etendu" id="menu-etendu" style="margin-left:auto">
					<button
						class="ob"
						type="button"
						id="ouvrir-etendu"
						aria-haspopup="true"
						aria-expanded="false"
						title="Plus"
						aria-label="Menu étendu"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
							><circle cx="3" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle
								cx="13"
								cy="8"
								r="1.4"
							/></svg
						>
					</button>
					<div class="menu-etendu__liste" role="menu">
						<button type="button" data-bloc="alerte-astuce" role="menuitem"
							>Bloc d'alerte — astuce</button
						>
						<button type="button" data-bloc="alerte-attention" role="menuitem"
							>Bloc d'alerte — attention</button
						>
						<button type="button" data-bloc="alerte-danger" role="menuitem"
							>Bloc d'alerte — danger</button
						>
						<button type="button" data-bloc="diagramme" role="menuitem">Diagramme</button>
						<!--
							LES DEUX RACCOURCIS DE FRAPPE NE SONT PAS ANNONCÉS, PARCE QU'ILS
							N'EXISTENT PAS : aucune règle de frappe n'est posée dans `$lib/edition`
							— ni « / » sur une ligne vide, ni « [[ » —, et la délégation ne branche
							que `data-cmd`, `data-bloc` et `data-mark`. C'est le menu qui insère ces
							blocs.
						-->
						<button type="button" data-bloc="lien-interne" role="menuitem">Lien interne</button>
					</div>
				</div>
			</div>

			<ZoneDeRedaction
				libelle="Corps de la note"
				invite="Écrivez ici. Le menu « Plus » de la barre insère un bloc d'alerte, un diagramme ou un lien interne."
				{...corps === '' ? {} : { corps: corpsRedige }}
			/>
		</div>

		<!-- ---------- Métadonnées ---------- -->
		<aside class="meta-panneau" aria-label="Métadonnées de la note">
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Rangement</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<label class="champ__label" for="m-type"
							>Type de note <span class="oblig">*</span></label
						>
						<select class="selecteur" id="m-type">
							{#each typesNote as type (type)}<option value={type} selected={type === typeChoisi}
									>{type}</option
								>{/each}
						</select>
					</div>

					<div class="champ">
						<label class="champ__label" for="m-domaine">Domaine <span class="oblig">*</span></label>
						<select
							class="selecteur"
							id="m-domaine"
							onchange={(evenement) => {
								domaineVif = evenement.currentTarget.value;
								/* « Changer de domaine réinitialise le dossier. » — l'aide du
							   champ, deux lignes plus bas, et `garderChoix = false` du gel. */
								choixVifDeDossier = null;
							}}
						>
							{#each domaines as domaine, rang (rang)}<option
									value={domaine.nom}
									selected={domaine.nom === domaineChoisi}
									>{domaine.univers + ' › ' + domaine.nom}</option
								>{/each}
						</select>
						<span class="champ__aide">Changer de domaine réinitialise le dossier.</span>
					</div>

					<div class="champ" id="champ-dossier">
						<span class="champ__label">Dossier <span class="oblig">*</span></span>
						<div class="dossier-choix" id="m-dossier">
							{#key domaineChoisi}{@render niveauDeDossiers(dossiers, '')}{/key}
						</div>
						<div class="champ__erreur" id="erreur-dossier" hidden>
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
							Choisissez un dossier de rangement.
						</div>
					</div>

					<div class="champ" style="position:relative">
						<label class="champ__label" for="m-etiquette">Étiquettes</label>
						<div class="etq-boite" id="etq-boite">
							{#each etiquettes as etiquette (etiquette)}<span class="etq"
									>{etiquette}<button type="button" aria-label="Retirer l'étiquette {etiquette}"
										><svg
											width="11"
											height="11"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2.2"><path d="M4 4l8 8M12 4l-8 8" /></svg
										></button
									></span
								>{/each}<input
								type="text"
								id="m-etiquette"
								placeholder="Ajouter…"
								autocomplete="off"
								spellcheck="false"
							/>
						</div>
						<div class="etq-suggestions" id="etq-suggestions"></div>
						<span class="champ__aide"
							>Entrée pour valider. Une étiquette qui n'existe pas est créée.</span
						>
					</div>
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Publication</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<span class="champ__label">Visibilité</span>
						<div class="duo" id="m-visibilite" role="group">
							<button type="button" data-val="Interne" aria-pressed="true">Interne</button>
							<button type="button" data-val="Publique" aria-pressed="false">Publique</button>
						</div>
						<span class="champ__aide" id="aide-visibilite"
							>{nomOrganisation === ''
								? 'Consultable par les comptes de cette instance.'
								: `Consultable par les comptes de ${nomOrganisation}.`}</span
						>
					</div>
					<div class="champ">
						<span class="champ__label">Statut</span>
						<div class="duo" id="m-statut" role="group">
							<button type="button" data-val="Publiée" aria-pressed="true">Publiée</button>
							<button type="button" data-val="Brouillon" aria-pressed="false">Brouillon</button>
						</div>
					</div>
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">{motFiche} structurée</span></div>
				<div class="panneau__corps meta-bloc">
					<div class="champ">
						<label class="champ__label" for="m-fiche">Type de {motFicheMinuscule}</label>
						<select class="selecteur" id="m-fiche">
							<option value="" selected>Aucun — note simple</option>
							{#each Object.keys(typesFiche) as type (type)}<option value={type}>{type}</option
								>{/each}
						</select>
						<span class="champ__aide"
							>Optionnel. Un type ajoute des propriétés structurées et rend la note exploitable en
							cartographie.</span
						>
					</div>
					<div class="proprietes" id="proprietes"></div>
				</div>
			</section>

			<!-- Les liens suggérés ne se calculent qu'à la frappe (`suggererLiens`,
				`V-17:3384`) : le bloc reste masqué aux six états, comme au gel. -->
			<section class="panneau" id="bloc-suggestions" hidden>
				<div class="panneau__tete">
					<span class="etiq">Liens suggérés</span>
					<span class="chiffre" id="n-suggestions"></span>
				</div>
				<div class="panneau__corps" id="suggestions"></div>
			</section>
		</aside>
	{/snippet}

	{#snippet apresContenu()}
		<BarreDEtat
			etat={etatSauvegarde}
			texte={texteSauvegarde}
			libelleMeta="Métadonnées"
			enregistrer={boutonEnregistrer}
		/>
	{/snippet}
</Coquille>
