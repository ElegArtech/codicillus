<script lang="ts">
	/**
	 * V-18 — Éditeur du registre Opérationnel.
	 * Route `/notes/{identifiant}/operationnel` (`docs/routes.md`,
	 * `verif/scenarios/V-18.json`).
	 *
	 * LE SECOND CORPS. La deuxième singularité du produit — « une même note peut
	 * porter deux registres de lecture » — a ici son écran d'écriture. La note est
	 * `n-restaurer-pg`, celle de V-14, et le corps rédigé est LE MÊME OBJET, porté
	 * par `$lib/lecture/CorpsReference.svelte` et
	 * `$lib/lecture/CorpsOperationnel.svelte` : `diff` entre `V-14:1523-1753` et
	 * `V-18:1709-1939` ne rend aucune ligne, et la maquette le dit d'elle-même —
	 * « la source de l'Opérationnel est le corps partagé de la note : l'éditeur et
	 * la lecture montrent le même contenu, jamais deux versions du markup »
	 * (`V-18:2930-2931`).
	 *
	 * LE CORPS OPÉRATIONNEL EST RENDU DEUX FOIS, et c'est le gel : une fois comme
	 * SOURCE masquée dans le panneau de référence (`#corps-operationnel[hidden]`,
	 * `V-18:2932-2934`),
	 * une fois dans la zone de rédaction, où le script le recopie tel quel
	 * (`redaction.innerHTML = OPERATIONNEL`, `V-18:3281`). Les identifiants de
	 * titre y sont donc en double — `o-preparer`, `o-executer`, `o-controler`,
	 * `o-bloque`. C'est mesuré sur la maquette stabilisée, pas déduit.
	 *
	 * SIX ÉTATS, UNE FENÊTRE — 6 couples. `ref-ouvert` est marqué `identiqueA`
	 * `cas-existant` par l'extraction : il ne dévie d'aucun contrôle.
	 *
	 * DEUX LEVIERS, ET ILS SONT ORTHOGONAUX. `cas` décide du contenu rédigé, de
	 * l'état de sauvegarde, du libellé du bouton principal, de l'avis affiché et
	 * de la présence des deux actions de registre (`charger()`, `V-18:3261`).
	 * `ref` décide de la place du panneau de Référence (`reglerReference()`,
	 * `V-18:3160`) : `ouvert`, `cote` ou `ferme`. Aucun état n'en combine deux
	 * déviations, la planche ne dévie qu'un contrôle à la fois.
	 *
	 * `RG-M06-08` À `RG-M06-10` — LA DÉSYNCHRONISATION SE SIGNALE, et ce lot NE
	 * LES DÉCLARE PAS TENUES. L'état `cas-desync` RÉGIT le signalement : bandeau
	 * `avis--resync` nommant la date et l'auteur de la modification de la
	 * Référence, et l'action « Marquer comme resynchronisé » révélée dans le
	 * panneau. C'est le RENDU d'un état, pas la règle : ni la détection de la
	 * désynchronisation, ni l'attestation, ni leur propagation à la lecture
	 * n'appartiennent à un squelette sans logique (ARB-011). De même, ce lot ne
	 * déclare tenue ni `P-09` ni aucune exigence d'édition.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main class="editeur"
	 * id="contenu">` (ARB-015) ; lien d'évitement vers `#redaction`, libellé
	 * « Aller à la rédaction » (ARB-019).
	 *
	 * LA BARRE D'ÉTAT PASSE PAR `apresContenu` — `ECART-027` É-2, cinquième
	 * passage du gabarit. Avec V-17, V-18 est la seule maquette du dépôt à porter
	 * un nœud après `<main>` : `div.barre-etat`, classe seule, boîte
	 * `248, 837, 1192, 63` aux douze états des deux vues et aux quatre fenêtres du banc.
	 *
	 * CINQ ATTRIBUTS DE DONNÉES HORS GABARIT — `data-vue`, `data-meta`,
	 * `data-numerote`, `data-reference` et `data-cas`, portés par `donnees`
	 * (ARB-021, A-2). `data-reference` commande à lui seul les trois positions du
	 * panneau (`V-18.css:961-962, 977-979`) ; `data-cas` est lu par le script de
	 * planche du gel, jamais par la feuille — `docs/releve-vues.md` §4 le range
	 * parmi les onze attributs de ce genre. Il est posé parce que le gel le pose.
	 * `data-numerote` ne produit RIEN : le gel le pose sur `div.app#app`
	 * (`V-18:1468`) et la règle qui l'exploite vise `body` (`V-18:836`) —
	 * `docs/releve-vues.md` §7.7. Le « corriger » changerait le rendu.
	 *
	 * UNE PARTICULARITÉ DU GEL, RELEVÉE ET NON CORRIGÉE. En position `cote`, la
	 * feuille écrit `.app[data-reference="cote"] .meta-panneau { display: none }`
	 * (`V-18.css:978`) alors que le panneau de Référence VIT DANS ce
	 * `.meta-panneau` (`V-18:1698-1707`) : la colonne de droite disparaît donc
	 * entièrement, là où le nom de la position en promet le contraire. C'est le
	 * rendu de la maquette gelée, et il est reproduit tel quel — la règle de
	 * non-comblement interdit de le « réparer », et P-3 rappelle qu'un
	 * implémenteur qui répare le gel fait rougir des vues. Constat remonté.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : ni Markdown à la frappe,
	 * ni reprise du plan de la Référence, ni bascule du panneau, ni
	 * enregistrement, ni suppression. Le squelette rend l'état de départ.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `div.commandes#commandes`, `dialog#dlg-supprimer`
	 * et `dialog#dlg-quitter`, tous deux FERMÉS aux six états.
	 * `docs/releve-vues.md` §4.1 les mesure : un `<dialog>` fermé ne porte aucune
	 * boîte de rendu, ne déplace aucun pixel et n'entre pas dans l'instantané
	 * ARIA. Et `div.planche`, bloc hors produit (`docs/DESIGN.md` §2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-18.css`, posé par `node verif/feuilles-de-vue.mjs V-18
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BandeauApercu from '$lib/edition/BandeauApercu.svelte';
	import BarreDEtat from '$lib/edition/BarreDEtat.svelte';
	import ZoneDeRedaction from '$lib/edition/ZoneDeRedaction.svelte';
	import CorpsOperationnel from '$lib/lecture/CorpsOperationnel.svelte';
	import CorpsReference from '$lib/lecture/CorpsReference.svelte';
	import { NOTE, rangementDe, type NoteAffichee } from '$lib/lecture/note-de-demonstration';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état — deux contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-18')`, variante « lecture ». */
		notes: readonly Note[];
		/**
		 * LES QUATRE PROPRIÉTÉS DE CONTEXTE — T-042, et elles sont OPTIONNELLES.
		 *
		 * Avant ce lot, cette vue lisait `UNIVERS`, `DOMAINES`, `MOI` et
		 * `INSTANCE` au niveau du module : un chargeur de route ne pouvait rien
		 * y substituer, et l'écran servait le contexte du jeu de semence quelle
		 * que fût l'identité de l'appelant.
		 *
		 * LE DÉFAUT EST LA CONSTANTE DU JEU, et c'est ce qui garantit que le banc
		 * ne bouge pas : le mode de conception ne passe que `vecteur` et `notes`,
		 * la vue reçoit donc exactement ce qu'elle avait.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: UtilisateurCourant;
		instance?: EtatDInstance;
		/**
		 * LA NOTE ÉDITÉE ET SES DEUX CORPS RENDUS — T-042.
		 *
		 * L'éditeur de l'Opérationnel montre TROIS choses de la note : son
		 * identité (fil d'Ariane, nom du registre édité, métadonnées figées), le
		 * registre Référence en panneau de rappel, et le registre Opérationnel
		 * dans la zone de rédaction. Les trois venaient de la transcription
		 * gelée de `n-restaurer-pg` ; elles viennent d'elle quand elle est
		 * fournie.
		 *
		 * **CE LOT N'ÉCRIT AUCUNE SAISIE.** La zone de rédaction reçoit le corps
		 * rendu, elle ne le modifie pas : l'édition est un comportement
		 * (ARB-011) et appartient au lot d'édition.
		 *
		 * ABSENTE, LA TRANSCRIPTION FIGÉE, à l'identique — les couples de la vue
		 * ne bougent pas.
		 */
		affichee?: NoteAffichee;
		/**
		 * CE QUE LE BANDEAU DE DÉSYNCHRONISATION NOMME — `RG-M06-08`.
		 *
		 * Le gel écrit la date et l'auteur en dur dans son script de planche
		 * (`V-18:3287`). Le produit les LIT : la date est celle de
		 * `corps_reference_modifie_le`, l'auteur celui de la version que cet
		 * enregistrement a écrite.
		 *
		 * L'AUTEUR PEUT MANQUER, et son absence retire la mention plutôt que
		 * d'inventer un nom (`P-02`). C'est la jurisprudence du bandeau de V-14,
		 * qui n'interpole que la date qu'il a (`NoteDeDemonstration.svelte:322`).
		 *
		 * ABSENTE, LA TRANSCRIPTION FIGÉE : le mode de conception ne passe rien,
		 * la vue rend exactement la phrase du gel, et les six couples ne bougent
		 * pas.
		 */
		desynchronisation?: { quand: string; par: string | null };
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		affichee,
		desynchronisation
	}: Proprietes = $props();

	/** La note éditée — celle qu'on modifie, ou celle du gel à défaut. */
	const note = $derived(affichee?.note ?? NOTE);
	const rangement = $derived(rangementDe(note));

	const reglage = $derived(vecteur ?? {});

	/** L'état du registre édité — `charger()`, `V-18:3261`. */
	const cas = $derived<'existant' | 'vierge' | 'desync'>(
		reglage['cas'] === 'vierge' ? 'vierge' : reglage['cas'] === 'desync' ? 'desync' : 'existant'
	);

	/** La place du panneau de Référence — `reglerReference()`, `V-18:3160`. */
	const reference = $derived<'ouvert' | 'cote' | 'ferme'>(
		reglage['ref'] === 'cote' ? 'cote' : reglage['ref'] === 'ferme' ? 'ferme' : 'ouvert'
	);

	/**
	 * LA PHRASE DU BANDEAU DE DÉSYNCHRONISATION — celle du gel, mot pour mot,
	 * quand rien n'est passé ; la même, nourrie, quand la note est réelle.
	 *
	 * La mention de l'auteur tombe avec l'auteur. Elle ne se remplace pas : une
	 * phrase qui nommerait « un contributeur » là où la base ne sait pas qui a
	 * écrit serait une valeur illustrative, ce que `P-02` refuse.
	 */
	const SUITE_DESYNC =
		", après votre dernière rédaction. Vérifiez que le pas-à-pas tient toujours — ou attestez qu'il tient, sans le rééditer.";
	const phraseDesync = $derived(
		desynchronisation === undefined
			? `Modifiée le 22 juillet 2026 par Sophie Nguyen${SUITE_DESYNC}`
			: `Modifiée le ${desynchronisation.quand}${
					desynchronisation.par === null ? '' : ` par ${desynchronisation.par}`
				}${SUITE_DESYNC}`
	);

	const etatSauvegarde = $derived(cas === 'vierge' ? 'vierge' : 'enregistre');
	const texteSauvegarde = $derived(
		cas === 'vierge' ? 'Aucune modification' : 'Enregistré · dernière version il y a 3 semaines'
	);
</script>

<!--
	LE CORPS OPÉRATIONNEL DANS LA ZONE DE RÉDACTION — la seconde des deux copies
	que le gel rend (`redaction.innerHTML = OPERATIONNEL`, `V-18:3281`). Le même
	composant que la source masquée du panneau : un seul markup, deux places.

	T-042 — SANS NOTE ÉDITÉE, LA TRANSCRIPTION FIGÉE ; avec, le corps
	Opérationnel rendu par l'implémentation unique de `rendreDocument`
	(ADR-004). Le bloc est protégé du formateur : un blanc inséré entre
	l'enveloppe et son contenu se relit dans le nom accessible du niveau 1
	(CLAUDE.md §6, P-6), et la forme exacte de la directive ne se cite jamais
	dans un commentaire (P-9).

	L'INSERTION DE BALISAGE EST ADMISE PARCE QUE LE CONTENU EST MAÎTRISÉ : c'est
	la sortie de `rendreDocument`, dont l'en-tête énonce la contrepartie du refus
	d'ADR-003 de stocker du HTML libre — « le texte d'un document est du TEXTE :
	il ne devient jamais du balisage ». Même jurisprudence que `V-31.svelte`.
-->
<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé par `echapper()` (ADR-003) -->
<!-- prettier-ignore -->
{#snippet corpsOperationnelRedige()}{#if affichee}{@html affichee.operationnel ?? ''}{:else}<CorpsOperationnel />{/if}{/snippet}
<!-- eslint-enable svelte/no-at-html-tags -->

<!--
	Le contenu du bouton principal de la barre d'état. Il vit ICI parce qu'il
	porte `margin-left:4px`, propriété contrainte par P-1.2 : un style en ligne
	n'est prouvé que par la maquette rattachée au fichier (ARB-016, P-6.4), et
	`src/lib/edition/` n'a aucun rattachement. Même jurisprudence que le
	séparateur `›` de V-14.
-->
{#snippet boutonEnregistrer()}<span id="enregistrer-txt"
		>{cas === 'vierge' ? "Créer l'Opérationnel" : "Enregistrer l'Opérationnel"}</span
	>
	<kbd class="touche" style="margin-left:4px">Ctrl</kbd><kbd class="touche">S</kbd>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="editeur"
	cibleEvitement="redaction"
	libelleEvitement="Aller à la rédaction"
	donnees={{
		'data-vue': 'redaction',
		'data-meta': 'ferme',
		'data-numerote': 'non',
		'data-reference': reference,
		'data-cas': cas
	}}
	fil={['Accueil', ...rangement, note.titre, 'Opérationnel']}
	courant={rangement.slice(1)}
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
	{#snippet enfants()}
		<div class="colonne-redaction">
			<!-- ---------- Registre édité : permanent, sans ambiguïté ---------- -->
			<div class="registre-actif">
				<div class="registre-actif__quoi">
					<span class="registre-actif__sceau" aria-hidden="true">OP</span>
					<div class="registre-actif__txt">
						<div class="registre-actif__label">Vous modifiez le registre</div>
						<div class="registre-actif__nom">Opérationnel</div>
						<div class="registre-actif__note" id="nom-note">{note.titre}</div>
					</div>
				</div>
				<button class="btn" id="vers-reference">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M14 8H3M6.5 4.5L3 8l3.5 3.5" /></svg
					>
					Modifier la Référence
				</button>
			</div>

			<!-- ---------- Avertissements ----------
				Un avis par état, et deux états seulement en portent un : l'aide au
				démarrage de la première rédaction, et le signalement de
				désynchronisation. `cas-existant` n'en porte aucun. -->
			<div id="avis">
				{#if cas === 'vierge'}
					<div class="avis avis--info" data-avis="depart">
						<div class="avis__corps">
							<div class="avis__titre">Première rédaction de l'Opérationnel</div>
							<div>
								Vous réorganisez un fond qui existe déjà. La Référence est consultable à droite ; le
								menu étendu permet d'en reprendre le plan pour ne pas repartir d'une page blanche.
							</div>
							<div class="avis__actions">
								<button class="btn">Reprendre le plan de la Référence</button>
							</div>
						</div>
					</div>
				{:else if cas === 'desync'}
					<div class="avis avis--resync" data-avis="resync">
						<div class="avis__corps">
							<div class="avis__titre">
								La Référence a changé depuis la dernière mise à jour de l'Opérationnel
							</div>
							<div>{phraseDesync}</div>
							<div class="avis__actions">
								<button class="btn">Comparer les deux registres</button>
								<button class="btn">Marquer comme resynchronisé</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<BandeauApercu texte="Prévisualisation du registre Opérationnel. Rien n'est perdu." />

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
				</div>
				<div class="oz" data-secondaire="oui">
					<button
						class="ob"
						type="button"
						data-bloc="alerte-attention"
						title="Alerte — attention"
						aria-label="Alerte attention"
					>
						<svg
							width="16"
							height="16"
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
						<button type="button" data-bloc="alerte-danger" role="menuitem"
							>Bloc d'alerte — danger</button
						>
						<button type="button" data-bloc="tableau" role="menuitem">Tableau</button>
						<button type="button" data-bloc="citation" role="menuitem">Citation</button>
						<button type="button" id="reprendre-ref" role="menuitem"
							>Reprendre le plan de la Référence</button
						>
					</div>
				</div>
			</div>

			<ZoneDeRedaction
				libelle="Corps du registre Opérationnel"
				invite="Le pas-à-pas d'intervention. Gardez les gestes, laissez les explications à la Référence — elle est consultable à droite."
				{...cas === 'vierge' ? {} : { corps: corpsOperationnelRedige }}
			/>
		</div>

		<!-- ---------- Colonne droite ---------- -->
		<aside class="meta-panneau" aria-label="Référence et métadonnées">
			<!-- Aide au démarrage : la Référence, consultable sans quitter l'écran -->
			<section class="ref-panneau">
				<div class="ref-panneau__tete">
					<button
						class="btn btn--discret"
						id="bascule-ref"
						aria-expanded={reference !== 'ferme'}
						style="padding:2px 4px;gap:var(--e-2)"
					>
						<svg class="ref-chevron" width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
							><path d="M3 1l4 4-4 4z" /></svg
						>
						<span class="etiq">Registre Référence</span>
					</button>
					<button class="btn btn--discret" id="cote-a-cote" style="padding:4px 8px"
						>{reference === 'cote' ? 'En panneau' : 'Côte à côte'}</button
					>
				</div>
				<div class="ref-panneau__corps" id="ref-corps">
					<!-- ============ NOTE DE DÉMONSTRATION — corps rédigé, deux registres ============ -->
					<!-- ================= CORPS — REGISTRE RÉFÉRENCE ================= -->
					<!-- eslint-disable svelte/no-at-html-tags -- sortie de `rendreDocument`, texte échappé (ADR-003) -->
					<!-- prettier-ignore -->
					<div class="prose" id="corps-reference">{#if affichee}{@html affichee.reference ?? ''}{:else}<CorpsReference />{/if}</div>

					<!-- ================ CORPS — REGISTRE OPÉRATIONNEL ================ -->
					<!-- prettier-ignore -->
					<div class="prose" id="corps-operationnel" hidden>{#if affichee}{@html affichee.operationnel ?? ''}{:else}<CorpsOperationnel />{/if}</div>
					<!-- eslint-enable svelte/no-at-html-tags -->
				</div>
			</section>

			<!-- Métadonnées : affichées pour le contexte, non modifiables ici -->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Métadonnées de la note</span></div>
				<div class="panneau__corps meta-figee" id="meta-figee">
					<div class="mf">
						<span class="mf__cle">Titre</span><span class="mf__val">{note.titre}</span>
					</div>
					<div class="mf">
						<span class="mf__cle">Type</span><span class="mf__val"
							><span class="past past--type">{note.type}</span></span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Rangement</span><span class="mf__val"
							>{rangement.join(' › ')}</span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Étiquettes</span><span class="mf__val"
							><span
								>{#each note.etiquettes as etiquette (etiquette)}<span class="past past--etiquette"
										>{etiquette}</span
									>{/each}</span
							></span
						>
					</div>
					<div class="mf">
						<span class="mf__cle">Visibilité</span><span class="mf__val">{note.visibilite}</span>
					</div>
					<div class="mf">
						<span class="mf__cle">Statut</span><span class="mf__val"
							>{note.brouillon ? 'Brouillon' : 'Publiée'}</span
						>
					</div>
					<div class="meta-figee__note">
						Ces informations appartiennent à la note et valent pour ses deux registres. Elles se
						modifient depuis l'éditeur de la Référence.
					</div>
				</div>
			</section>

			<!-- Actions propres à l'Opérationnel -->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Registre Opérationnel</span></div>
				<div class="panneau__corps panneau__corps--serre">
					<div style="display:flex;flex-direction:column;gap:var(--e-1)">
						<button class="btn btn--menu" id="a-resync" hidden={cas !== 'desync'}>
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
							>
							Marquer comme resynchronisé
						</button>
						<button
							class="btn btn--menu btn--destructif"
							id="a-supprimer"
							hidden={cas === 'vierge'}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
								/></svg
							>
							Supprimer la version opérationnelle
						</button>
					</div>
				</div>
			</section>
		</aside>
	{/snippet}

	{#snippet apresContenu()}
		<BarreDEtat
			etat={etatSauvegarde}
			texte={texteSauvegarde}
			libelleMeta="Référence"
			enregistrer={boutonEnregistrer}
		/>
	{/snippet}
</Coquille>
