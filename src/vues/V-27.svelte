<script lang="ts">
	/**
	 * V-27 — Console · Univers. Première des dix sections de la console, et
	 * celle qui pose le motif commun que les neuf autres reprennent tel quel.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA FORME DE COQUILLE, ET L'ENVELOPPE DE CONTENU
	 *
	 * V-27 est l'une des HUIT vues de forme COMPLÈTE (ARB-021, A-1) — barre
	 * avec ses deux menus déroulants, rail dérivé du corpus, `data-vers` sur
	 * les entrées. V-28, sa jumelle de balisage, est abrégée : les deux vues du
	 * lot ne portent donc PAS la même coquille, et c'est le gel qui en décide.
	 *
	 * L'ENVELOPPE `div.console` est le quatrième amendement du gabarit
	 * (ARB-023, lot P-0b) : une GRILLE `244px minmax(0,1fr)` (`V-27.css:325`)
	 * qui intercale `aside.nav2` et `main.travail#travail`. Sans elle,
	 * `main.travail` passe de 492 / 948 à 248 / 1180 et les six états divergent
	 * avant même la comparaison de pixels (`ECART-024`). Elle arrive par
	 * `classeEnveloppe` + `avantContenu`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL
	 *
	 * La seule règle qui l'ouvre est `.app[data-form="ouvert"] .tiroir-form`
	 * (`V-27.css:443`), or `aside.tiroir-form#tiroir` vit HORS de `div.app` :
	 * le sélecteur ne peut pas s'appliquer, `transform: translateX(100%)` n'est
	 * jamais levé, le panneau reste hors fenêtre. Ce n'est PAS un défaut à
	 * corriger — « un implémenteur qui réparerait cela rendrait six vues
	 * rouges » (`CLAUDE.md` §6, P-3 ; `ECART-024`).
	 *
	 * Il est donc rendu EXACTEMENT — contenu, noms accessibles, ordre de
	 * tabulation —, et le NIVEAU 1 EN EST LE SEUL JUGE : `position: fixed` le
	 * garde dans le relevé de tabulation (`capture.mjs`, filtre
	 * `offsetParent !== null || position === 'fixed'`) et dans l'instantané
	 * ARIA, où il paraît en repère « Formulaire d'univers ». Les trois états de
	 * formulaire ne diffèrent QUE là, et ne diffèrent donc d'aucun pixel.
	 *
	 * `data-form` est néanmoins posé sur `div.app` avec la valeur du gel : la
	 * maquette l'écrit, et le rendre inexact serait diverger sans motif.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES TROIS ÉTATS MODAUX — ARB-017, RÉVÉLATION `modalite-dialogue`
	 *
	 * `sup-systeme` et `sup-ok` ouvrent `dialog#dlg-supprimer`. La vue le rend
	 * avec l'attribut `open`, ET RIEN DE PLUS : c'est le BANC qui établit la
	 * modalité, des deux côtés, par un code unique
	 * (`verif/references/protocole-app.json`, bloc `revelations`). `open` n'est
	 * pas `showModal()` ; exiger la couche supérieure d'un squelette sans
	 * hydratation serait exiger du JavaScript pour satisfaire une mesure.
	 *
	 * AUCUN `autofocus` ICI, et c'est mesuré. P-4 (`CLAUDE.md` §6) ne le rend
	 * utile que dans un dialogue révélé ; encore faut-il que la cible ne soit
	 * pas déjà le premier focalisable. Dans les deux dialogues de V-27, le
	 * premier focalisable EST `.dlg__fermer` — le gel n'y focalise rien.
	 * V-28 est l'autre cas : son `input#sup-saisie` en a besoin, et lui seul.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN COMPORTEMENT — ARB-011
	 *
	 * Réordonnancement, ouverture du panneau, validation, suppression : le gel
	 * y attache des écouteurs, tous du temps 3. Le squelette rend l'ÉTAT,
	 * jamais la transition. `div.notifs` est rendu vide.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-27.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-27 --installer`. Les `style=` reproduits
	 * figurent tous à l'ensemble clos du gel de V-27 (ARB-016, P-6.4) — y
	 * compris ceux que le script de la maquette pose par `.style.propriété`,
	 * que l'instrument lit aussi (`verif/styles-en-ligne.mjs`).
	 */
	import { resolve } from '$app/paths';
	import { identifiantLisible } from '$lib/rangement/adresses';
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
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { domainesDe, universOrdonnes } from '$lib/coquille/arborescence';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole, type TraitDePictogramme } from '$lib/console/sections';
	import type { RefusDeSaisie, SaisieDUnivers } from '$lib/console/structure';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-27')`, variante complète. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/**
		 * CE QUE LA VUE FAIT QUAND LA SUPPRESSION EST CONFIRMÉE — et rien d'autre.
		 *
		 * Même partage qu'en `V-28` : la vue tient l'état de son dialogue — quel
		 * univers est visé, laquelle des trois branches s'applique — parce que
		 * c'est ce que `demanderSuppression(u)` tenait au gel (`V-27:3524`) et
		 * parce que le décompte des domaines et des notes se fait sur ce qu'elle a
		 * reçu. Elle ne connaît ni route, ni action, ni réseau : `+page.svelte`
		 * passe le rappel.
		 */
		onSupprimer?: (univers: string) => void;
		/**
		 * LA SORTIE PROPOSÉE PAR LE REFUS — « Rattacher ces domaines à un autre
		 * univers ». Le gel y attache un geste (`V-27:3591`) ; la vue ne décide pas
		 * où il mène, la page le sait.
		 */
		onRattacher?: (univers: string) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND LE PANNEAU EST VALIDÉ — création puis
		 * enregistrement, dans cet ordre.
		 *
		 * Même partage que pour la suppression : la vue tient l'état du panneau —
		 * quel univers est édité, quel glyphe est retenu, quel rang est visé —
		 * parce que c'est ce que `ouvrirForm(u)` tenait au gel (`V-27:3436`), et
		 * elle ne connaît ni route, ni action, ni réseau.
		 *
		 * `onEnregistrer` reçoit d'abord le nom ACTUEL de l'univers : c'est la clé
		 * par laquelle la page retrouve son identifiant lisible, et un
		 * enregistrement peut justement changer le nom.
		 */
		onCreer?: (saisie: SaisieDUnivers) => void;
		onEnregistrer?: (nom: string, saisie: SaisieDUnivers) => void;
		/**
		 * LE RANG SEUL — ce que les flèches « Monter » et « Descendre » envoient.
		 * Elles ne touchent à rien d'autre, et le panneau n'a pas à s'ouvrir pour
		 * qu'un univers change de place.
		 */
		onReordonner?: (nom: string, ordre: number) => void;
		/** Le refus rendu par l'action, rattaché à son champ (`#erreur-nom`). */
		refus?: RefusDeSaisie | null;
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines: tousLesDomaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		onSupprimer,
		onRattacher,
		onCreer,
		onEnregistrer,
		onReordonner,
		refus = null
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	/** Panneau de formulaire : fermé, création, édition (`V-27:1388`). */
	const form = $derived(
		reglage['form'] === 'creation' || reglage['form'] === 'edition'
			? (reglage['form'] as 'creation' | 'edition')
			: 'ferme'
	);
	/** Suppression : refus par contenu, refus système, suppression possible. */
	const sup = $derived(
		reglage['sup'] === 'systeme' || reglage['sup'] === 'ok'
			? (reglage['sup'] as 'systeme' | 'ok')
			: 'refus'
	);

	/**
	 * LES SIX GLYPHES D'UNIVERS, décomposés en primitives typées plutôt que
	 * gardés en chaîne de balisage — le gel les injecte par `innerHTML`
	 * (`GLYPHES`, `V-27:3242`), ce qui demanderait ici `{@html}` que rien
	 * n'oblige à employer. Les valeurs sont celles du gel, au caractère près.
	 */
	const GLYPHES: Record<string, readonly TraitDePictogramme[]> = {
		pile: [
			{ forme: 'rect', x: '3', y: '4', largeur: '18', hauteur: '5', rx: '1.5' },
			{ forme: 'rect', x: '3', y: '12', largeur: '18', hauteur: '5', rx: '1.5' },
			{ forme: 'path', d: 'M6.5 6.5h.01M6.5 14.5h.01M3 19.5h18' }
		],
		jalon: [{ forme: 'path', d: 'M6 21V3M6 4h11l-2.2 3.5L17 11H6' }],
		corbeille: [
			{
				forme: 'path',
				d: 'M4 7h16M9.5 7V4.5h5V7M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7'
			}
		],
		boussole: [
			{ forme: 'circle', cx: '12', cy: '12', r: '9' },
			{ forme: 'path', d: 'M15.5 8.5l-2 5-5 2 2-5z' }
		],
		livre: [
			{
				forme: 'path',
				d: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5zM20 4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5a1.5 1.5 0 0 0 1.5-1.5z'
			}
		],
		engrenage: [
			{ forme: 'circle', cx: '12', cy: '12', r: '3' },
			{
				forme: 'path',
				d: 'M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3'
			}
		]
	};

	/**
	 * Palette d'univers : teintes profondes, tenues à l'écart du vert, de
	 * l'ambre et du rouge, qui appartiennent au signal de fraîcheur
	 * (`COULEURS`, `V-27:3253`).
	 */
	const COULEURS = [
		'#24485c',
		'#4a3d6b',
		'#1b6b7a',
		'#453ba0',
		'#3e5266',
		'#7a2f8f',
		'#5b4636',
		'#6b7c87'
	];

	/** L'univers tel que la copie de travail de la maquette le porte (`V-27:3236`). */
	interface UniversDeTravail {
		readonly nom: string;
		readonly description: string;
		readonly couleur: string;
		readonly glyphe: string;
		readonly ordre: number;
		readonly systeme: boolean;
	}

	/** La liste, dans l'ordre défini par l'administrateur (`rendreListe()`). */
	const liste: readonly UniversDeTravail[] = $derived(
		universOrdonnes(univers).map((u) => ({
			nom: u.nom,
			description: u.description,
			couleur: u.couleur,
			glyphe: u.glyphe,
			ordre: u.ordre ?? 0,
			systeme: !!u.systeme
		}))
	);

	/** Les domaines rattachés — jamais un chiffre saisi (P-02). */
	function domaines(nomDUnivers: string) {
		return domainesDe(tousLesDomaines, nomDUnivers);
	}
	/** Les notes que ces domaines contiennent (`notesDe()`, `V-27:3256`). */
	function compteDeNotes(univers: string): number {
		return domaines(univers).reduce(
			(total, d) => total + notes.filter((n) => n.domaine === d.nom).length,
			0
		);
	}

	/* ── Le panneau de formulaire ───────────────────────────────────────────
	   Trois états, et le gel les distingue par `ouvrirForm(u)` : à défaut
	   d'appel — état « fermé » —, le panneau garde le BALISAGE INITIAL, avec
	   ses zones d'icônes, de couleurs, de positions et d'aperçu VIDES. Ce n'est
	   pas un oubli : la maquette ne les peuple qu'à l'ouverture. */

	/**
	 * LE PANNEAU S'OUVRE, ET C'EST LA VUE QUI LE TIENT.
	 *
	 * `ouverture` vaut `null` tant que personne n'a cliqué : l'écran rendu est
	 * alors exactement celui que le vecteur décrit, et le mode de conception ne
	 * bouge pas d'un pixel. Dès qu'un geste l'ouvre, c'est cet état-là qui
	 * commande — le même arbitrage que `demande` pour le dialogue de suppression.
	 *
	 * `cible` PORTE LE NOM, PAS L'OBJET. La liste est reconstruite à chaque
	 * lecture de `univers` ; garder une référence ferait tenir un univers périmé
	 * après un enregistrement.
	 */
	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);

	/** Les cinq champs du panneau — `edite` du gel (`V-27:3436`), un par un. */
	let fNom = $state('');
	let fDescription = $state('');
	let fGlyphe = $state('boussole');
	let fCouleur = $state(COULEURS[0] as string);
	let fOrdre = $state(1);
	/** Le message de `#erreur-nom`, quand la validation de l'écran refuse. */
	let erreurLocale = $state<string | null>(null);

	/** L'univers édité : celui qu'on a désigné, ou celui que le vecteur nomme. */
	const edite = $derived(
		ouverture === 'creation'
			? null
			: ouverture === 'edition'
				? (liste.find((u) => u.nom === cible) ?? null)
				: form === 'edition'
					? (liste[0] ?? null)
					: null
	);
	/**
	 * LE PANNEAU EST OUVERT SI UN GESTE L'A OUVERT, OU SI LE VECTEUR LE DEMANDE.
	 *
	 * C'est cette valeur qui pose `data-form` sur `div.app`, et c'est elle que la
	 * règle gelée `.app[data-form="ouvert"] ~ .tiroir-form` attend pour lever
	 * `translateX(100%)`. La rédaction précédente ne lisait que le vecteur : le
	 * bouton « + » pouvait bien changer d'état, le panneau restait hors fenêtre.
	 */
	const ouvert = $derived(ouverture !== null || form !== 'ferme');

	const titreDuForm = $derived(edite ? edite.nom : 'Nouvel univers');
	const sousDuForm = $derived(
		edite
			? edite.systeme
				? 'Univers système : son nom et sa suppression sont verrouillés. Sa couleur et son rang restent modifiables.'
				: 'Les modifications prennent effet immédiatement pour tout le monde.'
			: 'Il apparaîtra dans la navigation latérale de tous les utilisateurs.'
	);
	/*
	   LES QUATRE VALEURS RETENUES : celles du panneau OUVERT quand il l'est, et
	   celles que le vecteur décrit sinon. Le rendu par défaut ne bouge donc pas,
	   et l'aperçu de navigation suit le choix en cours dès le premier clic.
	*/
	const glypheChoisi = $derived(ouverture !== null ? fGlyphe : edite ? edite.glyphe : 'boussole');
	const couleurChoisie = $derived(
		ouverture !== null ? fCouleur : edite ? edite.couleur : (COULEURS[0] as string)
	);
	/** `edite.ordre` : le rang de l'univers, ou la place suivante en création. */
	const ordreChoisi = $derived(
		ouverture !== null ? fOrdre : edite ? edite.ordre : liste.length + 1
	);
	const nomSaisi = $derived(ouverture !== null ? fNom : edite ? edite.nom : '');
	const descriptionSaisie = $derived(
		ouverture !== null ? fDescription : edite ? edite.description : ''
	);
	/**
	 * `RG-STR-01` — « son nom et sa suppression sont verrouillés. Sa couleur et
	 * son rang restent modifiables » (`V-27:3443`). Le gel désactive les deux
	 * champs de texte, et rien d'autre.
	 */
	const nomVerrouille = $derived(ouverture === 'edition' && edite !== null && edite.systeme);
	/** Le message de `#erreur-nom` : celui de l'écran, ou celui de l'action. */
	const erreurNom = $derived(
		erreurLocale ?? (refus !== null && refus.champ === 'nom' ? refus.message : null)
	);

	/** `ouvrirForm(u)` — `null` pour une création (`V-27:3436`). */
	function ouvrirForm(u: UniversDeTravail | null): void {
		ouverture = u === null ? 'creation' : 'edition';
		cible = u === null ? null : u.nom;
		fNom = u === null ? '' : u.nom;
		fDescription = u === null ? '' : u.description;
		fGlyphe = u === null ? 'boussole' : u.glyphe;
		fCouleur = u === null ? (COULEURS[0] as string) : u.couleur;
		fOrdre = u === null ? liste.length + 1 : u.ordre;
		erreurLocale = null;
	}

	/** `fermerForm()` — le panneau se referme, la saisie ne survit pas. */
	function fermerForm(): void {
		ouverture = null;
		cible = null;
		erreurLocale = null;
	}

	/**
	 * `form-valider` — LA VALIDATION DE L'ÉCRAN, celle du gel (`V-27:3478`) :
	 * nom vide, puis doublon insensible à la casse. Ce n'est pas LA règle —
	 * `creerUnUnivers()` et `modifierUnUnivers()` refusent quoi qu'il arrive, et
	 * rendent les mêmes messages — c'est son reflet, qui évite de proposer un
	 * geste voué au refus.
	 */
	function validerLeForm(): void {
		const nom = fNom.trim();
		if (!nomVerrouille) {
			if (nom === '') {
				erreurLocale = "Donnez un nom à l'univers.";
				return;
			}
			if (liste.some((u) => u.nom !== cible && u.nom.toLowerCase() === nom.toLowerCase())) {
				erreurLocale = `« ${nom} » existe déjà.`;
				return;
			}
		}
		erreurLocale = null;
		const saisie: SaisieDUnivers = {
			nom: nomVerrouille && edite ? edite.nom : nom,
			description: fDescription,
			couleur: fCouleur,
			glyphe: fGlyphe,
			ordre: fOrdre
		};
		if (ouverture === 'edition' && cible !== null) onEnregistrer?.(cible, saisie);
		else onCreer?.(saisie);
		fermerForm();
	}
	/** `rendrePositions()` : autant de positions que d'univers, plus une en création. */
	const positions = $derived(
		Array.from({ length: edite ? liste.length : liste.length + 1 }, (_, k) => k + 1)
	);

	/** Une ligne de l'aperçu de navigation (`rendreApercu()`, `V-27:3410`). */
	interface LigneDApercu {
		readonly nom: string;
		readonly couleur: string;
		readonly glyphe: string;
		readonly ordre: number;
		readonly courant: boolean;
	}
	/**
	 * L'aperçu : la navigation telle qu'elle sera. L'univers en cours d'édition
	 * est retiré de la liste puis réinséré à `ordre - 0.5`, ce qui le place
	 * JUSTE AVANT celui qui occupe sa position visée.
	 */
	const apercu: readonly LigneDApercu[] = $derived(
		[
			...liste
				.filter((u) => u !== edite)
				.map((u) => ({
					nom: u.nom,
					couleur: u.couleur,
					glyphe: u.glyphe,
					ordre: u.ordre,
					courant: false
				})),
			{
				nom: edite ? edite.nom : 'Nouvel univers',
				couleur: couleurChoisie,
				glyphe: glypheChoisi,
				ordre: ordreChoisi - 0.5,
				courant: true
			}
		].sort((a, b) => a.ordre - b.ordre)
	);

	/* ── La suppression ─────────────────────────────────────────────────────
	   `demanderSuppression(u)` : trois branches, deux atteignables par la
	   planche. `sup-refus` est le réglage PAR DÉFAUT du contrôle, donc aucun
	   `change` n'est émis et le dialogue reste FERMÉ — le scénario le déclare
	   lui-même identique à `form-ferme`. */

	/**
	 * L'UNIVERS D'ARCHIVES EST UN LITTÉRAL DU GEL, et il est porté comme tel.
	 * `V-27:3636` : la position « Possible · univers vide » cherche un univers
	 * non système et sans domaine ; le corpus n'en a aucun — Production et
	 * Projets en portent, « Non classé » est système —, et la maquette retombe
	 * sur cet objet écrit à la main. Fabriquer une dérivation qui rende cet
	 * univers-là serait inventer une donnée que le gel n'a pas.
	 */
	const ARCHIVES: UniversDeTravail = {
		nom: 'Archives',
		description: '',
		couleur: '#6b7c87',
		glyphe: 'livre',
		ordre: 9,
		systeme: false
	};

	/**
	 * L'UNIVERS DONT LA SUPPRESSION EST EXAMINÉE.
	 *
	 * `null` au rendu serveur : l'écran reste exactement celui que le vecteur
	 * décrit tant que personne n'a cliqué. C'est le comportement que le script du
	 * gel portait, rendu à la vue qui le transcrit.
	 */
	let demande = $state<string | null>(null);

	const aSupprimer = $derived(
		demande !== null
			? (liste.find((u) => u.nom === demande) ?? null)
			: sup === 'systeme'
				? (liste.find((u) => u.systeme) ?? null)
				: sup === 'ok'
					? ARCHIVES
					: null
	);
	const dialogueOuvert = $derived(aSupprimer !== null);

	/**
	 * LES TROIS BRANCHES DE `demanderSuppression(u)` — `V-27:3524-3606`, LUES.
	 *
	 * La transcription précédente n'en portait que DEUX : « univers système » et
	 * « univers vide ». La troisième — l'univers qui porte des domaines — existe
	 * au gel avec son titre, son décompte, la liste de ses domaines et sa sortie ;
	 * elle n'était pas atteignable par la planche, aucun état ne la montrait, et
	 * elle avait été laissée de côté. Servi sur des données réelles, l'écran
	 * disait donc « Production ne contient aucun domaine » à un univers qui en
	 * porte trois. La branche est ici transcrite, texte pour texte.
	 */
	const domainesDeLUnivers = $derived(aSupprimer === null ? [] : domaines(aSupprimer.nom));
	const notesDeLUnivers = $derived(aSupprimer === null ? 0 : compteDeNotes(aSupprimer.nom));
	/** `u.systeme` d'abord, `doms.length` ensuite, le reste sinon — l'ordre du gel. */
	const branche = $derived(
		aSupprimer === null
			? 'aucune'
			: aSupprimer.systeme
				? 'systeme'
				: domainesDeLUnivers.length
					? 'peuple'
					: 'possible'
	);

	/** `valider.hidden` et `annuler.textContent`, tels que le gel les pose. */
	const suppressionOfferte = $derived(branche === 'possible');

	/**
	 * LES DEUX LIGNES DU REFUS, accordées comme le gel les accorde
	 * (`V-27:3552-3554`) : « domaines rattachés » / « domaine rattaché »,
	 * « notes qu'ils contiennent » / « note qu'ils contiennent ».
	 */
	const refusPeuple = $derived([
		[
			domainesDeLUnivers.length,
			domainesDeLUnivers.length > 1 ? 'domaines rattachés' : 'domaine rattaché'
		],
		[notesDeLUnivers, notesDeLUnivers > 1 ? "notes qu'ils contiennent" : "note qu'ils contiennent"]
	] as [number, string][]);

	/** Le nombre de notes d'un domaine — `window.notesDuDomaine(d.nom).length`. */
	function notesDuDomaine(nom: string): number {
		return notes.filter((n) => n.domaine === nom).length;
	}

	/** `showModal()` — voir `V-28.svelte` : l'attribut `open` n'obtient pas la modalité. */
	$effect(() => {
		const boite = document.getElementById('dlg-supprimer');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (!dialogueOuvert) {
			if (boite.open) boite.close();
			return;
		}
		if (!boite.open) boite.showModal();
	});
</script>

<!-- Un glyphe d'univers, à la taille et à l'épaisseur que le gel lui donne. -->
{#snippet glyphe(cle: string, taille: string, epaisseur: string)}<Pictogramme
		traits={(GLYPHES[cle] ?? GLYPHES['boussole']) as readonly TraitDePictogramme[]}
		{taille}
		boite="0 0 24 24"
		{epaisseur}
	/>{/snippet}

<!--
	UNE LIGNE DU TABLEAU DE GESTION, ET AUCUN BLANC ENTRE SES NŒUDS.

	Le gel la construit par script (`rendreListe()`, `V-27:3263`) : aucun nœud
	de texte ne sépare les cellules, et le relevé d'ordre de tabulation du
	niveau 1 construit son nom accessible sur `textContent`, où un blanc inséré
	se verrait (`CLAUDE.md` §6, P-6 — 27 couples en échec pour cette seule
	cause). `<!-- prettier-ignore -- >` protège la région : le formateur
	réintroduirait les blancs, et `pnpm check` l'exige par ailleurs.
-->
<!-- prettier-ignore -->
{#snippet ligne(u: UniversDeTravail, rang: number)}<div class="tg tg--univers tg--ligne" role="row"
	><div class="rang"
		><button type="button" disabled={rang === 0} aria-label="Monter {u.nom}" onclick={() => onReordonner?.(u.nom, rang)}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6.5L6 3.5l3 3"/></svg></button
		><button type="button" disabled={rang === liste.length - 1} aria-label="Descendre {u.nom}" onclick={() => onReordonner?.(u.nom, rang + 2)}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5.5L6 8.5l3-3"/></svg></button
	></div
	><span class="apercu-nav__sceau" style="background:{u.couleur};width:28px;height:28px">{@render glyphe(u.glyphe, '16', '1.6')}</span
	><div style="min-width:0"
		><div class="tg__nom"><a class="tg__ouvrir" href={resolve('/univers/[univers]', { univers: identifiantLisible(u.nom) })}>{u.nom}</a>{#if u.systeme}<span class="past past--systeme" style="margin-left:var(--e-2)">système</span>{/if}</div
		><div class="tg__desc">{u.description}</div
	></div
	><span class="tg__n tg--masquable">{domaines(u.nom).length}</span
	><span class="tg__n tg--masquable">{compteDeNotes(u.nom)}</span
	><div class="tg__actions"
		><button class="btn" type="button" onclick={() => ouvrirForm(u)}>{u.systeme ? 'Voir' : 'Modifier'}</button
		><button class="btn btn--destructif" type="button" aria-label="Supprimer l'univers {u.nom}" onclick={() => (demande = u.nom)}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/></svg></button
	></div
></div>{/snippet}

<Coquille
	fil={filDeConsole('Univers')}
	{univers}
	domaines={tousLesDomaines}
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
	forme="complete"
	donnees={{ 'data-form': ouvert ? 'ouvert' : 'ferme' }}
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
>
	{#snippet avantContenu()}
		<NavigationConsole courante="univers" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Univers"
			description="La segmentation de plus haut niveau. Un univers regroupe des domaines qui partagent un contexte — ce qui tourne aujourd'hui, ce qui est en projet. Leur ordre pilote l'affichage dans la navigation latérale."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouvel univers" onCliquer={() => ouvrirForm(null)} />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--univers tg--entetes" role="row">
				<span>Rang</span>
				<span></span>
				<span>Nom et description</span>
				<span class="tg--masquable">Domaines</span>
				<span class="tg--masquable">Notes</span>
				<span></span>
			</div>
			<div id="liste">
				{#each liste as u, rang (u.nom)}{@render ligne(u, rang)}{/each}
			</div>
		</div>

		<p
			style="font-size:var(--t-mini);color:var(--c-encre-3);line-height:1.55;margin:var(--e-3) 0 0;max-width:64ch"
		>
			L'ordre se règle avec les flèches, utilisables au clavier. Le changement prend effet
			immédiatement dans la navigation de tous les utilisateurs.
		</p>
	{/snippet}

	<!--
		LES DEUX NŒUDS RENDUS HORS DE `div.app` (ARB-021, A-4), dans l'ordre du
		gel : le panneau de formulaire, puis la boîte de suppression.
	-->
	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire d'univers">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">{titreDuForm}</h2>
					<div class="tiroir-form__sous" id="form-sous">{sousDuForm}</div>
				</div>
				<button
					class="tiroir-form__fermer"
					id="form-fermer"
					aria-label="Fermer le formulaire"
					onclick={fermerForm}
				>
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
				<div class="champ" id="champ-nom" data-etat={erreurNom === null ? undefined : 'erreur'}>
					<label class="champ__label" for="f-nom">Nom <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Production"
						disabled={nomVerrouille}
						value={nomSaisi}
						oninput={(e) => (fNom = e.currentTarget.value)}
					/>
					<div class="champ__erreur" id="erreur-nom" hidden={erreurNom === null}>
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
						<span id="erreur-nom-txt">{erreurNom ?? ''}</span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Description</label>
					<!--
						ÉCART DÉCLARÉ — LA VALEUR DE `#f-desc` N'EST PAS ATTEIGNABLE DES DEUX
						RELEVÉS À LA FOIS, ET LE `<textarea>` EST LE SEUL NŒUD DANS CE CAS.

						Le gel la pose par `f-desc.value = u.description`, une PROPRIÉTÉ :
						l'arbre d'accessibilité la porte
						(`textbox "Description": - text: …`) et `textContent` reste VIDE. Un
						squelette sans hydratation n'a que le CONTENU du nœud pour l'établir,
						or le contenu d'un `<textarea>` EST sa valeur initiale.

						Les deux écritures, mesurées au banc :
						  · avec le contenu — instantané ARIA identique, et l'ordre de
						    tabulation diverge : le relevé construit le nom sur `textContent`
						    (`capture.mjs`, `nom()`), donc « Ce qui tourne… » contre «  » ;
						  · sans le contenu — ordre de tabulation identique, et l'instantané
						    ARIA perd sa ligne de valeur.

						C'est le CONTENU qui est retenu : l'arbre d'accessibilité est ce qu'un
						utilisateur perçoit, et un formulaire d'édition servi sans sa valeur
						serait un défaut de produit, non un artefact de mesure. `#f-nom` ne
						pose pas la question — l'attribut `value` d'un `<input>` alimente la
						propriété SANS toucher `textContent` —, et c'est ce qui borne l'écart
						au seul `<textarea>`. Remonté au rapport, jamais comblé ici : ni le
						relevé ni la maquette ne sont touchés.
					-->
					<textarea
						class="saisie"
						id="f-desc"
						rows="3"
						placeholder="Ce que cet univers regroupe, et pourquoi."
						disabled={nomVerrouille}
						oninput={(e) => (fDescription = e.currentTarget.value)}
						value={descriptionSaisie}></textarea>
					<span class="champ__aide"
						>Affichée en couverture de la page d'univers. Une phrase suffit.</span
					>
				</div>

				<div class="champ">
					<span class="champ__label">Icône</span>
					<!-- prettier-ignore -->
					<div class="icones" id="f-icones" role="group" aria-label="Icône de l'univers"
						>{#if ouvert}{#each Object.keys(GLYPHES) as cle (cle)}<button type="button" aria-pressed={cle === glypheChoisi} aria-label="Icône {cle}" onclick={() => (fGlyphe = cle)}>{@render glyphe(cle, '19', '1.6')}</button>{/each}{/if}</div
					>
				</div>

				<div class="champ">
					<span class="champ__label">Couleur</span>
					<!-- prettier-ignore -->
					<div class="couleurs" id="f-couleurs" role="group" aria-label="Couleur de l'univers"
						>{#if ouvert}{#each COULEURS as c (c)}<button type="button" style="background:{c}" aria-pressed={c === couleurChoisie} aria-label="Couleur {c}" onclick={() => (fCouleur = c)}></button>{/each}{/if}</div
					>
					<span class="champ__aide"
						>Choisie hors des teintes de fraîcheur — vert, ambre et rouge sont réservés au signal de
						fiabilité.</span
					>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-position">Position dans la navigation</label>
					<!-- prettier-ignore -->
					<select
						class="selecteur"
						id="f-position"
						onchange={(e) => (fOrdre = Number.parseInt(e.currentTarget.value, 10))}
						style="width:100%;padding:8px var(--e-3);border:1px solid var(--c-trait-fort);border-radius:var(--r-2);background:var(--c-papier);font-family:var(--f-ui);font-size:var(--t-base)"
						>{#if ouvert}{#each positions as p (p)}<option value={p} selected={p === ordreChoisi}>Position {p}{p === 1 ? ' — en tête' : p === positions.length ? ' — en dernier' : ''}</option>{/each}{/if}</select
					>
				</div>

				<!-- L'ordre, la couleur et l'icône se jugent là où ils apparaîtront. -->
				<div class="champ">
					<span class="champ__label">Aperçu de la navigation</span>
					<!-- prettier-ignore -->
					<div class="apercu-nav" id="apercu-nav"
						>{#if ouvert}{#each apercu as l, rang (rang)}<div class="apercu-nav__ligne" data-courant={l.courant ? 'oui' : undefined}><span class="apercu-nav__sceau" style="background:{l.couleur}">{@render glyphe(l.glyphe, '12', '1.8')}</span>{l.nom}</div>{/each}{/if}</div
					>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button
					class="btn btn--destructif"
					id="form-supprimer"
					hidden={!edite || edite.systeme}
					onclick={() => {
						if (edite === null) return;
						const vise = edite.nom;
						fermerForm();
						demande = vise;
					}}>Supprimer</button
				>
				<button class="btn" id="form-annuler" onclick={fermerForm}>Annuler</button>
				<button class="btn btn--principal" id="form-valider" onclick={validerLeForm}
					><span id="form-valider-txt">{edite ? 'Enregistrer' : "Créer l'univers"}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg dlg--destructif"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={dialogueOuvert}
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
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer l'univers</h2>
					<button
						class="dlg__fermer"
						data-fermer
						aria-label="Fermer"
						onclick={() => (demande = null)}
					>
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
				<!-- prettier-ignore -->
				<div class="dlg__corps" id="sup-corps"
					>{#if aSupprimer && branche === 'systeme'}<div class="refus"
						><div class="refus__titre">« {aSupprimer.nom} » ne peut pas être supprimé</div
						><div class="refus__sortie">C'est l'univers de repli du produit : quand un domaine perd son rattachement, il atterrit ici plutôt que de disparaître de la navigation. Sans lui, un domaine orphelin deviendrait invisible sans être supprimé. Vous pouvez en revanche changer sa couleur et son rang.</div
					></div
					>{:else if aSupprimer && branche === 'peuple'}<div class="refus"
						><div class="refus__titre">Suppression refusée : cet univers n'est pas vide</div
						><ul
							>{#each refusPeuple as [combien, mot] (mot)}<li><b>{combien}</b>{mot}</li>{/each}</ul
						><div class="refus__sortie">Un univers ne se supprime que vide, pour qu'aucun contenu ne disparaisse par ricochet. Rattachez d'abord ses domaines ailleurs — « Non classé » convient si aucune destination ne s'impose.</div
					></div
					><div style="display:flex;flex-direction:column;gap:var(--e-1)"
						>{#each domainesDeLUnivers as d (d.nom)}<div style="display:flex;align-items:center;gap:var(--e-2);padding:var(--e-2);border:1px solid var(--c-trait);border-radius:var(--r-2);font-size:var(--t-petit)"><span class="tg__puce" style="background:{d.couleur}"></span><span style="flex:1">{d.nom}</span><span class="tg__n">{notesDuDomaine(d.nom)} notes</span></div>{/each}</div
					><button class="btn btn--principal" style="width:100%" type="button" onclick={() => aSupprimer && onRattacher?.(aSupprimer.nom)}>Rattacher ces domaines à un autre univers</button
					>{:else if aSupprimer}<p class="dlg__texte">« {aSupprimer.nom} » ne contient aucun domaine : sa suppression ne détruit aucun contenu. Il disparaîtra de la navigation latérale de tous les utilisateurs.</p>{/if}</div
				>
				<div class="dlg__pied">
					<button class="btn" data-fermer id="sup-annuler" onclick={() => (demande = null)}
						>{aSupprimer && !suppressionOfferte ? 'Fermer' : 'Annuler'}</button
					>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						hidden={aSupprimer !== null && !suppressionOfferte}
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						onclick={() => {
							if (aSupprimer === null || !suppressionOfferte) return;
							onSupprimer?.(aSupprimer.nom);
						}}>Supprimer</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
