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
	 * LES GESTES SONT BRANCHÉS. Le nom d'un domaine ouvre sa page, « Modifier »
	 * ouvre le tiroir, la suppression demande le nom, les modules basculent. La
	 * mention « aucun comportement, temps 3 » qui tenait ici était fausse : un
	 * geste dessiné est un geste promis.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-28.css` (P-6.3). Les `style=` reproduits figurent à
	 * l'ensemble clos du gel de V-28 (ARB-016, P-6.4).
	 */
	import { resolve } from '$app/paths';
	import { identifiantLisible } from '$lib/rangement/adresses';
	import type {
		CleDeModule,
		DetailDeDomaine,
		Domaine,
		Module,
		NomDeDomaine,
		Note,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { dossiersDuDomaine, universOrdonnes } from '$lib/coquille/arborescence';
	import type { NoeudDeDossier } from '$lib/coquille/arborescence';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import { vocabulaireRendu } from '$lib/vocabulaire';
	import type { RefusDeSaisie, SaisieDeDomaine } from '$lib/console/structure';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePluriel = $derived(motsDuProduit.fiches);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-28')`, variante complète. */
		notes: readonly Note[];
		/** Les univers déclarés, servis par la route. Vide : aucun périmètre. */
		univers: readonly Univers[];
		/** Les domaines déclarés, servis par la route. Vide : aucun domaine. */
		domaines: readonly Domaine[];
		/** L'utilisateur courant, servi par la route. */
		compte: UtilisateurCourant;
		/** Description et modules de chaque domaine, servies par la route. */
		detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
		/**
		 * CE QUE LA VUE FAIT QUAND LA SUPPRESSION EST CONFIRMÉE — et rien d'autre.
		 *
		 * La vue tient l'ÉTAT de son dialogue — quel domaine est visé, ce qui a été
		 * retapé — parce que c'est ce que le script du gel tenait lui-même
		 * (`demanderSuppression(d)`, `V-28:3201`), et parce que le décompte exact de
		 * `RG-M14-02` se calcule sur les notes qu'elle a reçues : personne d'autre
		 * ne peut le composer.
		 *
		 * ELLE NE CONNAÎT NI ROUTE, NI ACTION, NI RÉSEAU. Le rappel est passé par
		 * `+page.svelte`, qui seul sait à quelle action s'adresser — la frontière est
		 * celle de `$lib/cablage/formulaires.ts` : le gel n'écrit aucun `method` ni
		 * aucun `action`, et rien ici n'en invente.
		 *
		 * Absent, le dialogue s'ouvre, se ferme et se confirme sans rien envoyer :
		 * c'est ce que le mode de conception et les tests de propriétés obtiennent.
		 */
		onSupprimer?: (demande: {
			readonly univers: string;
			readonly domaine: string;
			readonly saisie: string;
		}) => void;
		/**
		 * LE CATALOGUE DES SIX MODULES — leur libellé et leur sous-titre, servis
		 * par la route. Ce n'est pas de la démonstration : c'est le référentiel
		 * d'interface du produit, et ce qui varie d'un domaine à l'autre — quels
		 * modules sont ACTIVÉS — entre par `detailDomaines`.
		 */
		modules: Record<CleDeModule, Module>;
		/**
		 * CE QUE LA VUE FAIT QUAND LE PANNEAU EST VALIDÉ — création puis
		 * enregistrement. Même partage que pour la suppression : la vue tient
		 * l'état du panneau — quel domaine est édité, quels modules sont cochés —
		 * parce que c'est ce que `ouvrirForm(d)` tenait au gel (`V-28:3108`), et
		 * elle ne connaît ni route, ni action, ni réseau.
		 *
		 * `onEnregistrer` reçoit d'abord le nom ACTUEL du domaine : c'est la clé
		 * par laquelle la page retrouve sa désignation canonique.
		 */
		onCreer?: (saisie: SaisieDeDomaine) => void;
		onEnregistrer?: (nom: string, saisie: SaisieDeDomaine) => void;
		/** Le refus rendu par l'action, rattaché à son champ (`#erreur-nom`). */
		refus?: RefusDeSaisie | null;
	}

	const {
		vecteur,
		notes,
		univers,
		domaines: registreDeDomaines,
		compte,
		detailDomaines,
		onSupprimer,
		modules,
		onCreer,
		onEnregistrer,
		refus = null
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
	 * LA COPIE DE TRAVAIL : LE REGISTRE SERVI, ET RIEN QUE LUI.
	 *
	 * Une ligne « Téléphonie » y était ajoutée — un littéral du gel, recopié
	 * pour donner à la maquette le cas « domaine vide », et qu'aucune table ne
	 * porte. Elle n'était retenue que par une COMPARAISON D'IDENTITÉ,
	 * `registreDeDomaines === DOMAINES` : la propriété était facultative, et
	 * une route qui l'oubliait servait donc, à côté des domaines réels, un
	 * domaine que l'administrateur voyait, ne pouvait ni éditer ni supprimer,
	 * et qui ne correspondait à rien. La propriété est désormais REQUISE — le
	 * compilateur refuse la route qui l'oublierait —, la sentinelle n'a plus
	 * d'objet, et elle part avec le littéral qu'elle gardait.
	 */
	const domaines: readonly DomaineDeTravail[] = $derived(
		registreDeDomaines.map((d) => ({
			nom: d.nom,
			univers: d.univers,
			couleur: d.couleur,
			description: detailDomaines[d.nom]?.description ?? '',
			modules: detailDomaines[d.nom]?.modules ?? []
		}))
	);

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
	const AIDES_MODULES: Record<CleDeModule, string> = $derived({
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
	});

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

	/**
	 * LE PANNEAU S'OUVRE, ET C'EST LA VUE QUI LE TIENT — même arbitrage que pour
	 * le dialogue de suppression, et même motif : `ouverture` vaut `null` tant
	 * que personne n'a cliqué, si bien que l'écran rendu est exactement celui que
	 * le vecteur décrit.
	 */
	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);

	/** Les cinq champs du panneau — `edite` du gel (`V-28:3108`), un par un. */
	let fNom = $state('');
	let fDescription = $state('');
	let fUnivers = $state('');
	let fCouleur = $state(COULEURS[0] as string);
	let fModules = $state<readonly CleDeModule[]>(['notes']);
	/** Le message de `#erreur-nom`, quand la validation de l'écran refuse. */
	let erreurLocale = $state<string | null>(null);

	/* L'ÉDITION PORTE SUR LE PREMIER DOMAINE SERVI. La planche nomme
	   « Infrastructure » (`V-28:3261`), premier domaine de son registre : le
	   désigner par son rang dit la même chose sans écrire un domaine du jeu. */
	const edite = $derived(
		ouverture === 'creation'
			? null
			: ouverture === 'edition'
				? (domaines.find((d) => d.nom === cible) ?? null)
				: form === 'edition'
					? (domaines[0] ?? null)
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

	const titreDuForm = $derived(edite ? edite.nom : 'Nouveau domaine');
	const sousDuForm = $derived(
		edite
			? 'Les modifications prennent effet immédiatement.'
			: 'Il apparaîtra dans la navigation de ceux qui y ont accès.'
	);
	const couleurChoisie = $derived(
		ouverture !== null ? fCouleur : edite ? edite.couleur : COULEURS[0]
	);
	/** `su.value` : l'univers du domaine, ou le premier du registre en création. */
	const universChoisi = $derived(
		ouverture !== null ? fUnivers : edite ? edite.univers : (univers[0] as Univers).nom
	);
	/** `edite.modules` : ceux du domaine, ou le seul module obligatoire. */
	const modulesActifs: readonly CleDeModule[] = $derived(
		ouverture !== null ? fModules : edite ? edite.modules : ['notes']
	);
	const nomSaisi = $derived(ouverture !== null ? fNom : edite ? edite.nom : '');
	const descriptionSaisie = $derived(
		ouverture !== null ? fDescription : edite ? edite.description : ''
	);
	/** Le message de `#erreur-nom` : celui de l'écran, ou celui de l'action. */
	const erreurNom = $derived(
		erreurLocale ?? (refus !== null && refus.champ === 'nom' ? refus.message : null)
	);

	/** `ouvrirForm(d)` — `null` pour une création (`V-28:3108`). */
	function ouvrirForm(d: DomaineDeTravail | null): void {
		ouverture = d === null ? 'creation' : 'edition';
		cible = d === null ? null : d.nom;
		fNom = d === null ? '' : d.nom;
		fDescription = d === null ? '' : d.description;
		fUnivers = d === null ? ((univers[0] as Univers)?.nom ?? '') : d.univers;
		fCouleur = d === null ? (COULEURS[0] as string) : d.couleur;
		fModules = d === null ? ['notes'] : [...d.modules];
		erreurLocale = null;
	}

	/** `fermerForm()` — le panneau se referme, la saisie ne survit pas. */
	function fermerForm(): void {
		ouverture = null;
		cible = null;
		erreurLocale = null;
	}

	/**
	 * `RG-STR-06` — « un domaine active 1 à N modules ». `notes` est verrouillé
	 * au gel (`data-verrou`), il ne se décoche donc jamais : c'est lui qui tient
	 * le plancher de 1, ici comme dans `creerUnDomaine()`.
	 */
	function basculerLeModule(cle: CleDeModule, actif: boolean): void {
		if (cle === 'notes') return;
		fModules = actif ? [...fModules, cle] : fModules.filter((m) => m !== cle);
	}

	/**
	 * `form-valider` — LA VALIDATION DE L'ÉCRAN, celle du gel (`V-28:3157`) : nom
	 * vide ou doublon insensible à la casse, un seul message pour les deux cas.
	 * Ce n'est pas LA règle — `creerUnDomaine()` refuse quoi qu'il arrive — c'est
	 * son reflet, qui évite de proposer un geste voué au refus.
	 */
	function validerLeForm(): void {
		const nom = fNom.trim();
		const doublon = domaines.some(
			(d) => d.nom !== cible && d.nom.toLowerCase() === nom.toLowerCase()
		);
		if (nom === '' || doublon) {
			erreurLocale = nom === '' ? 'Donnez un nom au domaine.' : `« ${nom} » existe déjà.`;
			return;
		}
		erreurLocale = null;
		const saisie: SaisieDeDomaine = {
			nom,
			description: fDescription,
			univers: fUnivers,
			couleur: fCouleur,
			modules: fModules
		};
		if (ouverture === 'edition' && cible !== null) onEnregistrer?.(cible, saisie);
		else onCreer?.(saisie);
		fermerForm();
	}

	/* ── La suppression ─────────────────────────────────────────────────── */

	/**
	 * LE DOMAINE DONT LA SUPPRESSION EST EXAMINÉE, et ce qui a été retapé.
	 *
	 * Deux états, et ils ne servent qu'au document vivant : au rendu serveur ils
	 * valent `null` et `''`, si bien que l'écran rendu est exactement celui que le
	 * vecteur décrit. C'est le comportement que le script du gel portait, rendu à
	 * la vue qui le transcrit.
	 */
	let demande = $state<string | null>(null);
	let saisie = $state('');

	/**
	 * L'OUVERTURE PAR UN CLIC L'EMPORTE SUR LE VECTEUR DE PLANCHE, et ne le
	 * contredit pas : tant que personne n'a cliqué, `demande` est `null` et l'état
	 * reste celui que le scénario demande.
	 */
	/* `sup === 'vide'` DÉSIGNE UN DOMAINE SANS AUCUNE NOTE, ET LE CHERCHE DANS
	   CE QUI A ÉTÉ SERVI. Il désignait un littéral de démonstration ; le cas que
	   la position décrit — « le domaine est vide, la suppression est possible » —
	   se lit sur le corpus reçu, et n'a jamais eu besoin d'être inventé. */
	const aSupprimer = $derived(
		demande !== null
			? (domaines.find((d) => d.nom === demande) ?? null)
			: sup === 'vide'
				? (domaines.find((d) => mesures(d.nom).notes === 0) ?? null)
				: null
	);

	/**
	 * `RG-M14-02`, SECONDE MOITIÉ — « exige la saisie du nom exact du domaine. Le
	 * bouton reste inactif tant que la saisie ne correspond pas. »
	 *
	 * EXACT VEUT DIRE EXACT : le gel le commente en propres termes —
	 * « Correspondance exacte, SANS TOLÉRANCE DE CASSE : le geste doit être
	 * délibéré » (`V-28:3239-3240`). Aucun `trim()`, aucune normalisation.
	 *
	 * CE N'EST PAS LA RÈGLE, C'EST SON REFLET À L'ÉCRAN. La règle est écrite une
	 * fois, dans `nomConfirme()` de `src/lib/donnees/administration.ts`, et c'est
	 * ELLE qui décide : l'action refuse une saisie non conforme quoi qu'il arrive.
	 * Ce module-là ne peut pas être importé ici — il tire le schéma, le connecteur
	 * et le moteur de recherche —, et c'est pourquoi la comparaison est réécrite.
	 * Le serveur reste seul juge ; l'écran ne fait qu'éviter de proposer un geste
	 * qui serait refusé.
	 */
	const confirme = $derived(aSupprimer !== null && saisie === aSupprimer.nom);

	/**
	 * LA MODALITÉ EST ÉTABLIE SUR LE DOCUMENT VIVANT, jamais au rendu serveur.
	 *
	 * La vue rend `<dialog open={…}>` parce qu'un rendu serveur ne peut pas
	 * appeler `showModal()`. Or l'attribut seul n'obtient NI le fond assombri —
	 * `.dlg::backdrop` ne s'applique qu'à un dialogue modal (`V-28.css:525`) — NI
	 * l'inertie du reste de la page, NI la fermeture par `Échap`. `$effect` ne
	 * tourne qu'au client : le rendu serveur est inchangé.
	 */
	$effect(() => {
		const boite = document.getElementById('dlg-supprimer');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (aSupprimer === null) {
			if (boite.open) boite.close();
			return;
		}
		if (!boite.open) boite.showModal();
	});

	/** Refermer : le dialogue disparaît, et la saisie ne survit pas au geste. */
	function refermer(): void {
		demande = null;
		saisie = '';
	}
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
		><div class="tg__nom"><a class="tg__ouvrir" href={resolve('/univers/[univers]/[domaine]', {
			univers: identifiantLisible(d.univers),
			domaine: identifiantLisible(d.nom)
		})}>{d.nom}</a></div
		><div class="tg__desc">{d.description}</div
	></div
	><span class="tg__univers"><i style="background:{couleurUnivers(d.univers)}"></i>{d.univers}</span
	>{@render nombre(m.notes, 'tg__n tg--reduit')}{@render nombre(m.fiches, 'tg__n tg--reduit')}{@render nombre(m.signets, 'tg__n tg--masquable tg--reduit')}{@render nombre(m.dossiers, 'tg__n tg--masquable tg--reduit')}{@render nombre(m.contributeurs, 'tg__n tg--masquable tg--reduit')}<div class="tg__modules tg--reduit"
		>{#each d.modules as cle (cle)}<span class="mod-pastille" title={modules[cle].nom}>{CODES_MODULES[cle]}</span>{/each}</div
	><div class="tg__actions"
		><button class="btn" type="button" onclick={() => ouvrirForm(d)}>Modifier</button
		><button class="btn btn--destructif" type="button" aria-label="Supprimer le domaine {d.nom}" onclick={() => { demande = d.nom; saisie = ''; }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"/></svg></button
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
	><input type="checkbox" checked={modulesActifs.includes(cle) || verrou} disabled={verrou} onchange={(e) => basculerLeModule(cle, e.currentTarget.checked)}
	/><span class="mod__corps"
		><span class="mod__nom">{modules[cle].nom}{#if verrou}<span class="mod__oblig">toujours actif</span>{/if}</span
		><span class="mod__aide">{AIDES_MODULES[cle]}</span
		><span class="mod__consequence"></span
	></span
></label>{/snippet}

<!--
	LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, JAMAIS D'ICI.
	La vue passait `instance.version` — le `1.0.0` d'`INSTANCE` du jeu de
	démonstration, servi comme un fait sur le pied du rail d'une instance
	réelle. Aucune route ne passe de version : `Coquille` lit celle du paquet
	sur le contexte que le gabarit racine pose, et la propriété n'est plus
	qu'un état vide explicite — hors gabarit racine, le pied ne nomme rien
	plutôt que de nommer un numéro de démonstration.
-->
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
	version=""
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
				<BoutonDeCreation libelle="Nouveau domaine" onCliquer={() => ouvrirForm(null)} />
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
				{#each tableau as d, rang (rang)}{@render ligne(d)}{/each}
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
						placeholder="Bureautique"
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
						oninput={(e) => (fDescription = e.currentTarget.value)}
						value={descriptionSaisie}></textarea>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-univers"
						>Univers de rattachement <span class="oblig">*</span></label
					>
					<!-- prettier-ignore -->
					<select
						class="selecteur"
						id="f-univers"
						onchange={(e) => (fUnivers = e.currentTarget.value)}
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
						>{#if ouvert}{#each COULEURS as c (c)}<button type="button" style="background:{c}" aria-pressed={c === couleurChoisie} aria-label="Couleur {c}" onclick={() => (fCouleur = c)}></button>{/each}{/if}</div
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
				<button
					class="btn btn--destructif"
					id="form-supprimer"
					hidden={!edite}
					onclick={() => {
						if (edite === null) return;
						const vise = edite.nom;
						fermerForm();
						demande = vise;
						saisie = '';
					}}>Supprimer</button
				>
				<button class="btn" id="form-annuler" onclick={fermerForm}>Annuler</button>
				<button class="btn btn--principal" id="form-valider" onclick={validerLeForm}
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
					<button class="dlg__fermer" data-fermer aria-label="Fermer" onclick={refermer}>
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
							value={saisie}
							oninput={(e) => (saisie = e.currentTarget.value)}
						/>
					</div>
				</div>

				<div class="dlg__pied">
					<button class="btn" data-fermer onclick={refermer}>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						disabled={!confirme}
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						onclick={() => {
							if (aSupprimer === null || !confirme) return;
							onSupprimer?.({ univers: aSupprimer.univers, domaine: aSupprimer.nom, saisie });
						}}
					>
						Supprimer définitivement
					</button>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
