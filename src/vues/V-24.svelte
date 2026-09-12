<script lang="ts">
	/**
	 * V-24 — Importer un lot de fichiers existants. Route `/importer`.
	 *
	 * Quatre étapes, portées par `data-etape` de `div.app` que la feuille de la vue
	 * lit pour l'avancement du fil de jalons ; hors application, `vecteur` en règle
	 * la position.
	 *
	 * AUCUNE MINUTERIE N'EST ÉCRITE ICI ET AUCUN NOMBRE N'EST SAISI : l'étape 4 rend
	 * un ÉTAT, jamais une transition (`ARB-011`). `TRAITES` est le seul nombre
	 * déclaré ; tout le reste se déduit du lot.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-24.css`.
	 */
	import type {
		Domaine,
		FichierDuLot,
		FormatDImport,
		LotDImport,
		Note,
		Univers
	} from '../../seeds/corpus';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { designationsDeCoquille, type CompteAffiche } from '$lib/coquille/identite';
	import { adressesParLesNoms } from '$lib/rangement/adresses';
	import { accord } from '$lib/vocabulaire';
	/* LES PHRASES DES MOTIFS SONT PARTAGÉES AVEC V-35 : le rapport d'un lot passé les
	   affiche aussi, et il rendait le code nu. Une seule table (`$lib/import/motifs.ts`). */
	import { motifEnClair } from '$lib/import/motifs';

	/** Les adresses se composent sur l'identifiant persisté, jamais sur le nom. */
	const adresses = adressesParLesNoms(designationsDeCoquille());
	import { cheminDuFichier, fichiersDuTransfert } from '$lib/cablage/depot-de-fichiers';
	import {
		SCENARIO_DE_DOMAINE,
		SCENARIO_DE_RACINE,
		SCENARIO_D_UNIVERS,
		SCENARIO_LIVRE,
		SCENARIO_PREPARE
	} from '$lib/donnees/scenarios-d-import';
	import type { ScenarioDImport } from '$lib/donnees/scenarios-d-import';

	interface DestinationDImport {
		readonly univers: string;
		readonly universNom: string;
		readonly domaine: string;
		readonly domaineNom: string;
		readonly chemin: string;
		readonly libelle: string;
		readonly niveau: 'domaine' | 'dossier';
	}

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * CE QUE LA ROUTE SERT EST EXIGÉ : le lot, les domaines, les libellés de format
		 * et le domaine proposé étaient optionnels, de défaut les constantes de
		 * `seeds/corpus.ts`. Le reste a un état vide.
		 */
		/** Les univers déclarés. Absente, aucun univers — jamais ceux du jeu. */
		univers?: readonly Univers[];
		/** Les domaines où l'utilisateur a le droit d'écrire. */
		domaines: readonly Domaine[];
		/** Domaines et dossiers où une note ou un dossier peuvent être rangés. */
		destinationsOuEcrire: readonly DestinationDImport[];
		/**
		 * `UC-M12-02` — LES UNIVERS OÙ UN DOMAINE PEUT NAÎTRE. Vide, le scénario
		 * « domaine complet » n'est pas offert : créer un domaine est un geste
		 * d'administration, et une action interdite n'est pas rendue (`P-09`).
		 */
		universOuCreerUnDomaine: readonly { readonly identifiant: string; readonly nom: string }[];
		/** Seul l'administrateur peut créer le niveau supérieur du rangement. */
		peutCreerUnUnivers: boolean;
		/** Le journal détaillé de la console est réservé aux administrateurs. */
		peutVoirLeJournal?: boolean;
		/** Préselection facultative conservée pour les liens historiques. */
		scenarioInitial: ScenarioDImport;
		/** Le compte connecté. Absente, un compte VIDE — jamais celui du jeu. */
		compte?: CompteAffiche | null;
		lotImport: LotDImport;
		/** Les libellés des formats admis. Reçue PARTIELLE : le rendu retombe sur l'extension. */
		formatsImport: Partial<Record<FormatDImport, string>>;

		lotRecu?: readonly File[];
		/** L'analyse d'un lot déposé. Absente, rien n'est envoyé nulle part. Fournie, le
		    serveur CLASSE le lot sans rien écrire — `UC-M12-04` §3, « rien n'a encore été
		    écrit ». Un refus laisse le parcours où il est. */
		analyser?: (
			fichiers: readonly File[],
			reglages: ReglagesDuDepot
		) => Promise<Issue<AnalyseDuLot>>;
		/**
		 * L'exécution du lot — réelle ou simulée, c'est le même appel : `RG-M12-02`
		 * veut un seul chemin de code. La simulation est un réglage, pas un geste.
		 */
		importer?: (
			fichiers: readonly File[],
			reglages: ReglagesDuDepot
		) => Promise<Issue<RapportAffiche>>;
		/**
		 * Le domaine de destination proposé — EXIGÉ. Il retombait sur `compte.domaine`,
		 * dont le défaut était celui du jeu de démonstration : ne remets pas de repli.
		 */
		domaineParDefaut: string;
	}

	/**
	 * Ce qu'un geste serveur rend : le résultat, OU le motif de son refus. Les deux
	 * rappels rendaient `null` sur tout ce qui n'était pas un succès, et « Analyser
	 * le lot » ne produisait alors rien du tout, sans message. Le motif est un code,
	 * mis en français par `LIBELLE_DU_REFUS`.
	 */
	type Issue<T> = { readonly valeur: T } | { readonly refus: string };

	/** Ce que l'analyse d'un lot rend : le lot classé, et l'état de la cible. */
	interface AnalyseDuLot {
		readonly lot: LotDImport;
		/**
		 * Les dossiers que la cible porte DÉJÀ, en chemins relatifs à elle : sans
		 * eux, le rejeu d'un lot annonçait des créations qui n'auraient pas lieu.
		 */
		readonly dossiersExistants: readonly string[];
		/**
		 * `UC-M12-02` — le nom du domaine que l'import CRÉERA, vide s'il en existe
		 * déjà un de ce nom. L'aperçu l'annonce ; rien n'a encore été écrit.
		 */
		readonly domaineACreer: string;
		readonly universACreer: string;
		readonly domainesACreer: readonly string[];
	}

	/** Ce que le dépôt règle, et que les deux appels transportent. */
	interface ReglagesDuDepot {
		/**
		 * Le scénario retenu. Il ne partait nulle part : un lot arrivait au serveur
		 * sans rien qui le distingue et se rangeait dans le domaine par défaut.
		 */
		readonly scenario: string;
		readonly domaine: string;
		/** `UC-M12-02` — le nom du domaine à créer, et l'univers qui l'accueille. */
		readonly nomDuDomaine: string;
		readonly universDAccueil: string;
		readonly nomDeLUnivers: string;
		readonly cibleUnivers: string;
		readonly cibleDomaine: string;
		readonly cibleChemin: string;
		readonly simulation: boolean;
		/** `RG-M12-03` — refuser le lot entier si une ligne échoue. */
		readonly strict: boolean;
	}

	/** Le rapport d'un lot tel que l'écran le rend — `RG-M12-04` et `RG-M12-09`.
	    Chaque nombre vient du traitement réel ; les noms sont ceux de
	    `RapportDImport`. */
	interface RapportAffiche {
		readonly simulation: boolean;
		/** `RG-M12-03`, mode strict — le lot est allé au bout puis a été annulé. */
		readonly refuseEnBloc: boolean;
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
		/** `RG-M12-03` — les relations créées par les renvois déclarés. */
		readonly relationsCreees: number;
		readonly domaine: string;
		readonly destination: 'domaine' | 'univers' | 'racine';
		readonly universCree: boolean;
		readonly universCrees: number;
		readonly domainesCrees: number;
		/** L'adresse du domaine visé, composée par le serveur : lui seul connaît
		    l'identifiant persisté d'un domaine que l'import vient de créer. */
		readonly adresseDuDomaine: string;
		/** `RG-M12-04` — chaque fichier en échec, avec sa cause en clair. */
		readonly enEchec: readonly { readonly chemin: string; readonly motif: string }[];
		readonly ignoresDetail: readonly { readonly chemin: string; readonly motif: string }[];
		/** `RG-M12-03` — les renvois qu'aucune note ne résout. */
		readonly renvoisNonResolus: readonly {
			readonly chemin: string;
			readonly renvois: readonly string[];
		}[];
		readonly ecrites: readonly {
			readonly identifiant: string;
			readonly titre: string;
			readonly ou: string;
			readonly adresse: string;
			readonly miseAJour: boolean;
		}[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines,
		destinationsOuEcrire,
		universOuCreerUnDomaine,
		peutCreerUnUnivers,
		peutVoirLeJournal = false,
		scenarioInitial,
		compte = null,
		lotImport,
		formatsImport,
		lotRecu = [],
		analyser,
		importer,
		domaineParDefaut
	}: Proprietes = $props();

	/** Aucune identité servie : un compte VIDE, jamais celui du jeu de démonstration. */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	/* L'état du parcours — local, et vivant seulement quand une route donne les
	   deux rappels. Sans eux, la vue reste la planche que le vecteur règle. */

	/** Le parcours est-il vivant ? Il l'est dès qu'une route lui donne prise. */
	const vivant = $derived(analyser !== undefined && importer !== undefined);

	let etapeLocale = $state(1);
	// svelte-ignore state_referenced_locally
	let typeChoisi = $state<'note' | 'dossier'>(
		scenarioInitial === SCENARIO_LIVRE ? 'note' : 'dossier'
	);
	// svelte-ignore state_referenced_locally
	let destinationDuDossier = $state<'existant' | 'domaine' | 'univers' | 'racine'>(
		scenarioInitial === SCENARIO_DE_RACINE
			? 'racine'
			: scenarioInitial === SCENARIO_D_UNIVERS
				? 'univers'
				: scenarioInitial === SCENARIO_DE_DOMAINE
					? 'domaine'
					: 'existant'
	);
	// svelte-ignore state_referenced_locally
	let destinationRetenue = $state(scenarioInitial === SCENARIO_D_UNIVERS ? 'racine' : '');
	let universDeNoteRetenu = $state('');
	let domaineDeNoteRetenu = $state('');
	/**
	 * Le lot tenu par le parcours, initialisé ici et non dans un effet : un lot remis
	 * est connu au montage. La valeur INITIALE de `lotRecu` est bien ce qu'on veut —
	 * le suivre écraserait le lot remplacé à l'étape 2.
	 */
	// svelte-ignore state_referenced_locally
	let fichiers = $state<readonly File[]>(lotRecu);
	// svelte-ignore state_referenced_locally
	let sourceDuLot = $state(lotRecu.length > 0 ? sourceDe(lotRecu) : '');
	let lotAnalyse = $state<LotDImport | null>(null);
	/** Les dossiers que la cible porte déjà — vide tant que rien n'a été analysé. */
	let dossiersExistants = $state<readonly string[]>([]);
	let rapport = $state<RapportAffiche | null>(null);
	let enCours = $state(false);
	let simulationRetenue = $state(false);
	/** `RG-M12-03` — la case du mode strict, à l'étape 1. */
	let strictRetenu = $state(false);
	let domaineRetenu = $state('');
	/** `UC-M12-02` — le nom saisi, et l'univers d'accueil retenu. */
	let nomDuDomaine = $state('');
	let nomDeLUnivers = $state('');
	let universRetenu = $state('');
	/** Le domaine que l'aperçu annonce comme à créer, ou la chaîne vide. */
	let domaineACreer = $state('');
	let universACreer = $state('');
	let domainesACreer = $state<readonly string[]>([]);
	/** Le motif du dernier refus serveur, en code. `null` : aucun refus en cours. */
	let refus = $state<string | null>(null);

	const domaineCible = $derived(domaineRetenu || domaineParDefaut);
	/**
	 * `domaineParDefaut` vaut la chaîne vide quand aucune cible n'est ouverte au
	 * compte : l'illustration nomme alors le geste, jamais un domaine du jeu.
	 */
	const reglage = $derived(vecteur ?? {});

	/** L'étape du parcours — dépôt, aperçu, import. */
	const etape = $derived(
		vivant
			? etapeLocale
			: reglage['et'] === '2' || reglage['et'] === '3'
				? Number(reglage['et'])
				: 1
	);

	const depose = $derived(vivant ? fichiers.length > 0 : etape >= 2);
	const destination = $derived.by(() => {
		if (!destinationRetenue.startsWith('emplacement:')) return null;
		const index = Number(destinationRetenue.slice('emplacement:'.length));
		return destinationsOuEcrire[index] ?? null;
	});
	const universPourUneNote = $derived.by(() => {
		return destinationsOuEcrire
			.filter(
				(cible, index, toutes) =>
					toutes.findIndex((candidate) => candidate.univers === cible.univers) === index
			)
			.map((cible) => ({ identifiant: cible.univers, nom: cible.universNom }));
	});
	const domainesPourUneNote = $derived.by(() => {
		return destinationsOuEcrire
			.filter((cible) => cible.univers === universDeNoteRetenu)
			.filter(
				(cible, index, toutes) =>
					toutes.findIndex((candidate) => candidate.domaine === cible.domaine) === index
			)
			.map((cible) => ({ identifiant: cible.domaine, nom: cible.domaineNom }));
	});
	const emplacementsPourUneNote = $derived(
		destinationsOuEcrire
			.map((cible, index) => ({ cible, index }))
			.filter(
				({ cible }) =>
					cible.univers === universDeNoteRetenu && cible.domaine === domaineDeNoteRetenu
			)
	);
	const scenarioChoisi = $derived<ScenarioDImport>(
		typeChoisi === 'note'
			? SCENARIO_LIVRE
			: destinationDuDossier === 'racine'
				? SCENARIO_DE_RACINE
				: destinationDuDossier === 'univers'
					? SCENARIO_D_UNIVERS
					: destinationDuDossier === 'domaine'
						? SCENARIO_DE_DOMAINE
						: SCENARIO_PREPARE
	);

	/* Étape 1 — le dépôt et sa destination sont réunis sur un même écran. */

	/* Le lot, et ce qu'on en déduit — `resumeLot()` (`V-24:2552`) et
	   `arborescenceLot()` (`V-24:2532`). Aucun chiffre n'est saisi. */

	const LOT = $derived(lotAnalyse ?? lotImport);

	/**
	 * Les fragments de phrase du gel qui entourent un segment gras, nommés plutôt
	 * qu'écrits au balisage pour une raison de rendu : Svelte élague les blancs en
	 * bord d'élément, et « reçus depuis » perdrait ses espaces encadrants — « 30
	 * fichiersreçus depuisExploitation ». Portés dans une expression, ils survivent.
	 */
	const PHRASES = {
		/* Deux fragments s'accordent avec le compte qui les précède. */
		recusDepuis: (n: number): string => ` ${accord(n, 'reçu')} depuis `,
		bilanAvecErreurs: "L'import est allé jusqu'au bout : ",
		bilanSansErreur: 'Tous les fichiers retenus ont été convertis. ',
		ecartesALApercu: (n: number): string =>
			` ${accord(n, 'avait été écarté', 'avaient été écartés')} à l\u2019aperçu, comme annoncé.`
	};

	/**
	 * L'accord court ici sur TOUT le syntagme — verbe, article, possessif et
	 * pronom —, pas sur un nom : c'est la seconde forme d'`accord()`.
	 */
	function bilanDesEchecs(devenues: number, echecs: number): string {
		return (
			` ${accord(devenues, 'est devenu une note', 'sont devenus des notes')}. ` +
			accord(
				echecs,
				"Le fichier en échec est listé plus bas avec sa cause ; il n'a bloqué aucun des autres et peut être repris séparément.",
				`Les ${echecs} fichiers en échec sont listés plus bas avec leur cause ; ils n'ont bloqué aucun des autres et peuvent être repris séparément.`
			)
		);
	}

	/**
	 * Les refus, mis en français. Quatre codes viennent de la route, chacun rendu
	 * avant la moindre écriture. `erreur-serveur` est le repli de l'écran, posé quand
	 * la réponse ne porte aucun motif lisible : il ne sait donc PAS ce que le serveur
	 * a fait du lot, et sa phrase se garde de l'affirmer.
	 */
	const LIBELLE_DU_REFUS: Readonly<Record<string, string>> = {
		'domaine-inconnu':
			"Ce domaine n'existe pas. Choisissez une destination dans la liste ; rien n'a été déposé.",
		'sans-droit-sur-la-cible':
			"Vous n'avez pas le droit d'écrire dans ce domaine. Rien n'a été déposé.",
		'lot-vide': 'Aucun fichier n’est parti. Reprenez le dépôt et relancez.',
		'une-note-attendue': 'Choisissez un seul fichier pour importer une note.',
		'scenario-non-livre':
			'Ce scénario d’import n’est pas exécuté par cette instance. Rien n’a été déposé.',
		'structure-univers-invalide':
			'La structure ne permet pas de reconnaître un univers. Choisissez un dossier racine unique ; ses dossiers directs deviendront des domaines et ses fichiers racine seront rangés dans un domaine portant son nom.',
		'structure-racine-invalide':
			'La structure ne contient aucun sous-dossier pouvant devenir un univers. Choisissez un dossier maître dont chaque dossier direct représente un univers.',
		'univers-deja-present':
			'Un univers porte déjà ce nom, mais il n’a pas pu être repris. Vérifiez son nom puis relancez.',
		'erreur-serveur':
			"Le serveur n'a pas rendu de réponse lisible. Ce qu'il a fait du lot n'est pas connu d'ici : rouvrez le domaine de destination avant de relancer."
	};

	/** Le refus à l'écran — une notification d'erreur, ou rien du tout. */
	const notifications = $derived(
		refus === null
			? []
			: [
					{
						type: 'erreur' as const,
						titre: 'Le lot n’a pas été traité',
						detail: LIBELLE_DU_REFUS[refus] ?? refus
					}
				]
	);

	/**
	 * L'intitulé de la dernière section — « Notes créées » du gel, sauf quand ce
	 * n'est pas vrai : un réimport ne crée aucune note et en met à jour trois.
	 */
	function intituleDesNotes(r: RapportAffiche): string {
		if (rienNAEteEcrit(r)) return `Notes qui seraient écrites — ${r.ecrites.length}`;
		if (r.notesMisesAJour === 0) return `Notes créées — ${r.notesCreees}`;
		return `Notes écrites — ${r.ecrites.length}`;
	}

	/**
	 * Une simulation n'a rien écrit, et aucune phrase du rapport ne doit dire le
	 * contraire. `simulation` est le SEUL champ par lequel les deux rapports diffèrent
	 * (`RG-M12-02`) ; l'écran ne le lisait nulle part et offrait des liens qui
	 * rendaient 404.
	 *
	 * LE MODE STRICT A EXACTEMENT LE MÊME EFFET (`RG-M12-03`) : le lot est allé au
	 * bout, son rapport dit ce qui serait arrivé, et la base est intacte.
	 */
	function rienNAEteEcrit(r: RapportAffiche): boolean {
		return r.simulation || r.refuseEnBloc;
	}

	function auFuturSiSimule(r: RapportAffiche, passe: string, futur: string): string {
		return rienNAEteEcrit(r) ? futur : passe;
	}

	/* `RG-M12-01` — les notes MISES À JOUR font un troisième nombre, que le gel ne
	   connaît pas et qui n'est nommé que lorsqu'il n'est pas nul. */
	function titreDuBilan(r: RapportAffiche): string {
		const creees = auFuturSiSimule(
			r,
			accord(r.notesCreees, 'créée'),
			accord(r.notesCreees, 'serait créée', 'seraient créées')
		);
		const majs = auFuturSiSimule(
			r,
			accord(r.notesMisesAJour, 'mise à jour', 'mises à jour'),
			accord(r.notesMisesAJour, 'serait mise à jour', 'seraient mises à jour')
		);
		const notes = `${r.notesCreees} ${accord(r.notesCreees, 'note')}`;
		const debut =
			r.notesMisesAJour > 0
				? `${notes} ${creees}, ${r.notesMisesAJour} ${majs}`
				: `${notes} ${creees}`;
		return r.echecs > 0
			? `${debut}, ${r.echecs} ${accord(r.echecs, 'fichier en échec', 'fichiers en échec')}`
			: `${debut}, aucun échec`;
	}

	/** Le sort d'un fichier décide de sa colonne : note, écarté, en échec. `maj`
	    partage la colonne des notes — la cible porte déjà la note, l'écriture sera une
	    mise à jour ; sans lui, l'aperçu annonçait des créations imaginaires. */
	const resume = $derived.by(() => {
		let notes = 0;
		let misesAJour = 0;
		let ignores = 0;
		let echecs = 0;
		/* Une table ORDONNÉE, tenue en liste : le tri du gel est stable, donc
		   l'ordre de première rencontre départage les ex æquo. */
		const formats: [FormatDImport, number][] = [];
		for (const f of LOT.fichiers) {
			if (f.s === 'ignore') ignores++;
			else if (f.s === 'echec') echecs++;
			else if (f.maj === true) misesAJour++;
			else notes++;
			if (f.s === 'ignore') continue;
			const deja = formats.find((e) => e[0] === f.f);
			if (deja) deja[1]++;
			else formats.push([f.f, 1]);
		}
		return { total: LOT.fichiers.length, notes, misesAJour, ignores, echecs, formats };
	});

	interface NoeudDuLot {
		readonly nom: string;
		/** Le chemin du nœud sous la cible : deux branches peuvent porter le même nom. */
		readonly chemin: string;
		readonly enfants: NoeudDuLot[];
		readonly fichiers: { nom: string; format: FormatDImport }[];
	}

	function noeud(niveau: NoeudDuLot[], nom: string, cheminDuParent: string): NoeudDuLot {
		const deja = niveau.find((n) => n.nom === nom);
		if (deja) return deja;
		const neuf: NoeudDuLot = {
			nom,
			chemin: cheminDuParent === '' ? nom : `${cheminDuParent}/${nom}`,
			enfants: [],
			fichiers: []
		};
		niveau.push(neuf);
		return neuf;
	}

	/**
	 * Un dossier que la cible porte déjà n'est pas un dossier créé. Liste vide —
	 * le régime de la planche, sans cible connue —, tout est neuf.
	 */
	function dossierExistant(chemin: string): boolean {
		return dossiersExistants.includes(chemin);
	}

	/** L'arborescence du lot. Un fichier écarté ne crée pas de dossier. */
	const arborescence = $derived.by<NoeudDuLot[]>(() => {
		const racine: NoeudDuLot[] = [];
		for (const f of LOT.fichiers) {
			if (f.s === 'ignore') continue;
			const segments = f.c.split('/');
			const nom = segments.pop() as string;
			let niveau = racine;
			let dernier: NoeudDuLot | null = null;
			for (const s of segments) {
				dernier = noeud(niveau, s, dernier === null ? '' : dernier.chemin);
				niveau = dernier.enfants;
			}
			if (dernier) dernier.fichiers.push({ nom, format: f.f });
		}
		return racine;
	});

	/** Les dossiers que l'import CRÉERA — ceux que la cible ne porte pas encore. */
	function compterDossiers(niveau: readonly NoeudDuLot[]): number {
		let total = 0;
		for (const n of niveau) {
			total += (dossierExistant(n.chemin) ? 0 : 1) + compterDossiers(n.enfants);
		}
		return total;
	}
	const nombreDeDossiers = $derived(
		Math.max(
			0,
			compterDossiers(arborescence) -
				(scenarioChoisi === SCENARIO_D_UNIVERS ? domainesACreer.length : 0)
		)
	);

	/** Un niveau dans l'ordre alphabétique — `Object.keys(a).sort()` du gel. */
	function niveauTrie(niveau: readonly NoeudDuLot[]): NoeudDuLot[] {
		return [...niveau].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
	}

	const parFormat = $derived.by(() => {
		const regroupes: [string, number][] = [];
		for (const [format, nombre] of resume.formats) {
			const libelle = formatsImport[format] ?? format;
			const deja = regroupes.find((entree) => entree[0] === libelle);
			if (deja === undefined) regroupes.push([libelle, nombre]);
			else deja[1] += nombre;
		}
		return regroupes
			.map(([libelle, nombre]) => [nombre, libelle] as const)
			.sort((a, b) => b[0] - a[0]);
	});

	/** La structure annoncée. Seul `UC-M12-02` crée un domaine, et seulement quand
	    il n'en existe pas déjà un de ce nom — un réimport le réécrit. */
	const creations = $derived.by(() => {
		const lignes: [number, string][] = [];
		if (universACreer !== '') {
			const noms =
				scenarioChoisi === SCENARIO_DE_RACINE ? universACreer.split(', ') : [universACreer];
			lignes.push([
				noms.length,
				`${accord(noms.length, 'univers créé', 'univers créés')} — ${noms.join(', ')}`
			]);
		}
		if (domainesACreer.length > 0) {
			lignes.push([
				domainesACreer.length,
				`${accord(domainesACreer.length, 'domaine créé', 'domaines créés')} — ${domainesACreer.join(', ')}`
			]);
		} else if (domaineACreer !== '') {
			lignes.push([1, `domaine créé — ${domaineACreer}`]);
		}
		lignes.push([nombreDeDossiers, 'dossiers créés']);
		return lignes;
	});

	const ecartes = $derived(LOT.fichiers.filter((f) => f.s === 'ignore'));
	const destinationDeLApercu = $derived.by(() => {
		if (scenarioChoisi === SCENARIO_DE_RACINE) return 'racine de l’application';
		if (scenarioChoisi === SCENARIO_D_UNIVERS)
			return `nouvel univers ${nomDeLUnivers.trim() || sourceDuLot}`;
		if (scenarioChoisi === SCENARIO_DE_DOMAINE) {
			const univers = universOuCreerUnDomaine.find((u) => u.identifiant === universRetenu)?.nom;
			return `nouveau domaine ${nomDuDomaine.trim() || sourceDuLot}${univers ? ` dans ${univers}` : ''}`;
		}
		return destination?.libelle ?? '';
	});
	function resultatDeFichier(fichier: FichierDuLot): string {
		if (fichier.s === 'ignore') return `Ignoré — ${motifEnClair(fichier.m)}`;
		if (fichier.s === 'echec') return `En erreur — ${motifEnClair(fichier.m)}`;
		const titre =
			fichier.titre ??
			(fichier.c
				.split('/')
				.pop()
				?.replace(/\.[^.]+$/, '') ||
				fichier.c);
		const emplacement = fichier.ou === undefined || fichier.ou === '' ? '' : ` › ${fichier.ou}`;
		return `${fichier.maj ? 'Mise à jour' : 'Création'} — ${destinationDeLApercu}${emplacement} › note ${titre}`;
	}

	/* Étape 3 — l'import et son rapport. */

	/** Rang de l'instant capturé, en fichiers traités. */
	const TRAITES = 7;

	const progression = $derived.by(() => {
		/* Sur une route réelle, le traitement est au serveur : une barre qui
		   progresserait toute seule serait une valeur illustrative. Elle reste à
		   zéro, comme les compteurs, jusqu'à ce que le rapport les remplace. */
		if (vivant) return { pourcent: 0, courant: 'Préparation…', notes: 0, ignores: 0, echecs: 0 };
		if (etape !== 3) {
			return { pourcent: 0, courant: 'Préparation…', notes: 0, ignores: 0, echecs: 0 };
		}
		let notes = 0;
		let ignores = 0;
		let echecs = 0;
		for (const f of LOT.fichiers.slice(0, TRAITES)) {
			if (f.s === 'note') notes++;
			else if (f.s === 'ignore') ignores++;
			else echecs++;
		}
		const traites = Math.min(TRAITES, LOT.fichiers.length);
		const dernier = LOT.fichiers[traites - 1];
		return {
			pourcent: LOT.fichiers.length === 0 ? 0 : Math.round((traites / LOT.fichiers.length) * 100),
			courant: dernier?.c ?? 'Préparation…',
			notes,
			ignores,
			echecs
		};
	});

	/* Le fil de jalons et le pied de parcours — `majPied()` (`V-24:3349`). */

	const JALONS: readonly { readonly rang: number; readonly nom: string }[] = [
		{ rang: 1, nom: 'Dépôt' },
		{ rang: 2, nom: 'Aperçu' },
		{ rang: 3, nom: 'Import' }
	];

	function etatDuJalon(rang: number): 'faite' | 'courante' | 'avenir' {
		return rang < etape ? 'faite' : rang === etape ? 'courante' : 'avenir';
	}

	const renoncerMasque = $derived(etape !== 2);
	const rapportSimule = $derived(rapport !== null && rienNAEteEcrit(rapport));
	const precedentMasque = $derived(etape === 1 || etape === 3);
	/* L'import lancé, « Continuer » disparaît jusqu'à ce que le rapport soit là. */
	const suivantMasque = $derived(etape === 3);
	/** La destination requise dépend du geste choisi sur la page de dépôt. */
	const destinationValide = $derived(
		scenarioChoisi === SCENARIO_DE_RACINE
			? sourceDuLot !== ''
			: scenarioChoisi === SCENARIO_D_UNIVERS
				? nomDeLUnivers.trim() !== '' || sourceDuLot !== ''
				: scenarioChoisi === SCENARIO_DE_DOMAINE
					? universRetenu !== '' && (nomDuDomaine.trim() !== '' || sourceDuLot !== '')
					: destination !== null
	);
	const suivantInhibe = $derived(
		etape === 1 ? !depose || !destinationValide || enCours : etape === 2 ? enCours : true
	);
	const libelleDuSuivant = $derived(
		etape === 1 ? 'Voir l’aperçu' : simulationRetenue ? 'Lancer la simulation' : 'Importer'
	);

	/* Les gestes du parcours. Aucun n'a d'effet sans les deux rappels : `vivant`
	   en est le seul juge. */

	let champDeFichiers: HTMLInputElement | undefined = $state();
	let champDeDossier: HTMLInputElement | undefined = $state();
	let zoneDeDepot: HTMLElement | undefined = $state();

	/**
	 * Le glisser-déposer, posé APRÈS LE MONTAGE plutôt qu'en attributs : `div.depot`
	 * n'est pas un élément interactif, et lui attacher des gestionnaires au balisage
	 * ferait rougir le contrôle d'accessibilité. `data-survol` est l'attribut du gel,
	 * que la feuille lit. L'arborescence d'un dossier déposé est conservée.
	 */
	onMount(() => {
		const zone = zoneDeDepot;
		if (zone === undefined || !vivant) return;
		const marquer = (etat: string) => (evenement: Event) => {
			evenement.preventDefault();
			zone.setAttribute('data-survol', etat);
		};
		const entree = marquer('oui');
		const sortie = marquer('non');
		const deposer = (evenement: DragEvent): void => {
			sortie(evenement);
			void fichiersDuTransfert(evenement.dataTransfer).then(retenir);
		};
		zone.addEventListener('dragenter', entree);
		zone.addEventListener('dragover', entree);
		zone.addEventListener('dragleave', sortie);
		zone.addEventListener('drop', deposer as (e: Event) => void);
		return () => {
			zone.removeEventListener('dragenter', entree);
			zone.removeEventListener('dragover', entree);
			zone.removeEventListener('dragleave', sortie);
			zone.removeEventListener('drop', deposer as (e: Event) => void);
		};
	});

	const reglages = $derived({
		scenario: scenarioChoisi,
		domaine: destination?.domaineNom ?? domaineCible,
		nomDuDomaine,
		universDAccueil: universRetenu,
		nomDeLUnivers,
		cibleUnivers: destination?.univers ?? '',
		cibleDomaine: destination?.domaine ?? '',
		cibleChemin: destination?.chemin ?? '',
		simulation: simulationRetenue,
		strict: strictRetenu
	});

	function changerDeType(type: 'note' | 'dossier'): void {
		if (typeChoisi === type) return;
		typeChoisi = type;
		if (type === 'dossier') {
			destinationDuDossier =
				destinationsOuEcrire.length > 0
					? 'existant'
					: universOuCreerUnDomaine.length > 0
						? 'domaine'
						: 'univers';
		}
		destinationRetenue = '';
		universDeNoteRetenu = '';
		domaineDeNoteRetenu = '';
		fichiers = [];
		sourceDuLot = '';
		lotAnalyse = null;
		refus = null;
	}

	function choisirDestinationDuDossier(valeur: string): void {
		if (
			valeur !== 'existant' &&
			valeur !== 'domaine' &&
			valeur !== 'univers' &&
			valeur !== 'racine'
		)
			return;
		destinationDuDossier = valeur;
		destinationRetenue = '';
		lotAnalyse = null;
		refus = null;
	}

	function choisirUniversDeNote(identifiant: string): void {
		universDeNoteRetenu = identifiant;
		domaineDeNoteRetenu = '';
		destinationRetenue = '';
	}

	function choisirDomaineDeNote(identifiant: string): void {
		domaineDeNoteRetenu = identifiant;
		const racine = destinationsOuEcrire.findIndex(
			(cible) =>
				cible.univers === universDeNoteRetenu &&
				cible.domaine === identifiant &&
				cible.niveau === 'domaine'
		);
		destinationRetenue = racine < 0 ? '' : `emplacement:${racine}`;
	}

	function sourceDe(retenus: readonly File[]): string {
		const premiers = retenus
			.map((f) => cheminDuFichier(f))
			.filter((c) => c.includes('/'))
			.map((c) => c.slice(0, c.indexOf('/')));
		const tete = premiers[0];
		if (tete !== undefined && premiers.every((p) => p === tete)) return tete;
		return 'votre poste';
	}

	function retenir(retenus: readonly File[]): void {
		if (retenus.length === 0) return;
		const retenusPourLeGeste = typeChoisi === 'note' ? retenus.slice(0, 1) : retenus;
		fichiers = retenusPourLeGeste;
		sourceDuLot = sourceDe(retenusPourLeGeste);
		if (typeChoisi === 'dossier' && sourceDuLot !== 'votre poste') {
			nomDuDomaine = sourceDuLot;
			nomDeLUnivers = sourceDuLot;
		}
		lotAnalyse = null;
		dossiersExistants = [];
		domaineACreer = '';
		universACreer = '';
		domainesACreer = [];
		rapport = null;
		refus = null;
	}

	const nomDeLaSource = $derived.by(() => {
		if (!depose) return typeChoisi === 'note' ? 'la note choisie' : 'le dossier choisi';
		if (typeChoisi === 'note') return fichiers[0]?.name.replace(/\.[^.]+$/, '') ?? 'La note';
		return sourceDuLot;
	});
	const annonceDuResultat = $derived.by(() => {
		const dossier = depose ? `Le dossier « ${nomDeLaSource} »` : 'Le dossier choisi';
		if (scenarioChoisi === SCENARIO_DE_RACINE)
			return `${dossier} sera traité comme la racine de l’application. Chacun de ses dossiers directs deviendra un univers ou complétera l’univers existant du même nom. Les fichiers placés directement à la racine seront ignorés.`;
		if (scenarioChoisi === SCENARIO_D_UNIVERS)
			return `${dossier} deviendra un univers. Ses dossiers directs deviendront des domaines. Ses fichiers Markdown placés à la racine seront rangés automatiquement dans un domaine portant le même nom que l’univers.`;
		if (!destinationValide)
			return 'Choisissez la destination pour voir exactement ce qui sera créé.';
		if (scenarioChoisi === SCENARIO_LIVRE && destination !== null)
			return `La note « ${nomDeLaSource} » sera rangée dans ${destination.libelle}.`;
		if (scenarioChoisi === SCENARIO_DE_DOMAINE) {
			const univers = universOuCreerUnDomaine.find((u) => u.identifiant === universRetenu);
			if (univers !== undefined)
				return `${dossier} deviendra un domaine dans l’univers ${univers.nom}.`;
		}
		if (scenarioChoisi === SCENARIO_PREPARE && destination !== null)
			return `Les notes du dossier seront rangées dans ${destination.libelle}.`;
		return '';
	});

	function parcourir(): void {
		if (!vivant) return;
		champDeFichiers?.click();
	}

	function parcourirUnDossier(): void {
		if (!vivant) return;
		champDeDossier?.click();
	}

	function surChoixDeFichiers(evenement: Event): void {
		const champ = evenement.currentTarget as HTMLInputElement;
		retenir(Array.from(champ.files ?? []));
	}

	async function avancer(): Promise<void> {
		if (!vivant || enCours) return;

		if (etape === 1) {
			if (fichiers.length === 0 || analyser === undefined) return;
			enCours = true;
			refus = null;
			try {
				const issue = await analyser(fichiers, reglages);
				/* Le refus s'affiche : « Analyser le lot » ne produisait rien du tout. */
				if ('refus' in issue) {
					refus = issue.refus;
					return;
				}
				lotAnalyse = issue.valeur.lot;
				dossiersExistants = issue.valeur.dossiersExistants;
				domaineACreer = issue.valeur.domaineACreer;
				universACreer = issue.valeur.universACreer;
				domainesACreer = issue.valeur.domainesACreer;
				etapeLocale = 2;
			} finally {
				enCours = false;
			}
			return;
		}
		if (etape === 2) {
			if (importer === undefined) return;
			enCours = true;
			refus = null;
			etapeLocale = 3;
			try {
				const issue = await importer(fichiers, reglages);
				if ('refus' in issue) {
					refus = issue.refus;
					/* Rien n'a été traité : on rend l'aperçu, où le geste se reprend. */
					etapeLocale = 2;
					return;
				}
				rapport = issue.valeur;
			} finally {
				enCours = false;
			}
			return;
		}
	}

	function reculer(): void {
		if (!vivant || etape === 1) return;
		etapeLocale = etape - 1;
	}

	function renoncer(): void {
		if (!vivant) return;
		fichiers = [];
		lotAnalyse = null;
		dossiersExistants = [];
		domaineACreer = '';
		universACreer = '';
		domainesACreer = [];
		rapport = null;
		refus = null;
		sourceDuLot = '';
		destinationRetenue = '';
		universDeNoteRetenu = '';
		domaineDeNoteRetenu = '';
		nomDuDomaine = '';
		nomDeLUnivers = '';
		universRetenu = '';
		destinationDuDossier =
			destinationsOuEcrire.length > 0
				? 'existant'
				: universOuCreerUnDomaine.length > 0
					? 'domaine'
					: 'univers';
		etapeLocale = 1;
	}

	function remplacerLaSource(): void {
		fichiers = [];
		lotAnalyse = null;
		rapport = null;
		refus = null;
		sourceDuLot = '';
	}

	/** L'adresse du domaine visé — bâtie par le constructeur unique (`ARB-001`). */
	const adresseDuDomaine = $derived.by(() => {
		/* LE SERVEUR L'A COMPOSÉE, ET LUI SEUL LE POUVAIT : un domaine que l'import
		   vient de créer (`UC-M12-02`) n'est dans aucune liste servie à l'ouverture
		   de l'écran, et son identifiant persisté n'est connu que de lui. */
		if (rapport !== null && rapport.adresseDuDomaine !== '') return rapport.adresseDuDomaine;
		const cible = domaines.find((d) => d.nom === domaineCible);
		/* L'IDENTIFIANT PERSISTÉ, PAS LE NOM SLUGIFIÉ : il ne suit pas les
		   renommages (`RG-M12-11`), et la sortie de l'étape 4 rendait 404. */
		return cible === undefined ? '/' : adresses.domaine(cible.univers, cible.nom);
	});
</script>

<!-- prettier-ignore -->
{#snippet dossierDuLot(d: NoeudDuLot)}<li
		><div class="al al--dossier"
			><span class="al__ic"
				><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
					><path d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"/></svg
				></span
			><span class="al__nom">{d.nom}</span
			><span class="al__neuf">{dossierExistant(d.chemin) ? 'dossier existant' : 'dossier créé'}</span></div
		>{#each d.fichiers as f, k (k)}<div class="al al--fichier"
			><span class="al__ic"
				><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
					><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"/></svg
				></span
			><span class="al__nom">{f.nom}</span
			><span class="al__fmt">{f.format}</span></div
		>{/each}{#if d.enfants.length}<ul
			>{#each niveauTrie(d.enfants) as e (e.nom)}{@render dossierDuLot(e)}{/each}</ul
		>{/if}</li
	>{/snippet}

<!-- prettier-ignore -->
{#snippet fichierEcarte(f: FichierDuLot)}<div class="ign"
		><span class="ign__marque">{f.f}</span
		><span class="ign__nom">{f.c}</span
		><span class="ign__motif">{motifEnClair(f.m)}</span></div
	>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="import-vue"
	idContenu="contenu"
	fil={['Accueil', 'Importer']}
	donnees={{ 'data-etape': String(etape) }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compteRendu.nom,
		initiales: compteRendu.initiales,
		role: compteRendu.role,
		domaine: compteRendu.domaine
	}}
	version=""
	{notifications}
>
	{#snippet enfants()}
		<!-- prettier-ignore -->
		<ol class="jalons" id="jalons" aria-label="Étapes de l'import"
			>{#each JALONS as j (j.rang)}<li
				class="jalon" data-jalon={j.rang} data-etat={etatDuJalon(j.rang)}
				><span class="jalon__barre"></span
				><span class="jalon__nom">{j.nom}</span></li
			>{/each}</ol
		>

		<!-- ============ ÉTAPE 1 — Dépôt et destination ============ -->
		<section class="etape" data-etape="1" data-active={etape === 1 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Importer</h1>
			<div class="import-card">
				<div class="type-tabs" role="group" aria-label="Contenu à importer">
					<button
						class:active={typeChoisi === 'note'}
						aria-pressed={typeChoisi === 'note'}
						onclick={() => changerDeType('note')}>Une note</button
					>
					<button
						class:active={typeChoisi === 'dossier'}
						aria-pressed={typeChoisi === 'dossier'}
						onclick={() => changerDeType('dossier')}>Un dossier</button
					>
				</div>

				<div class="depot-compact" id="depot" bind:this={zoneDeDepot}>
					<label
						class="champ__label"
						for={typeChoisi === 'note' ? 'parcourir' : 'parcourir-dossier'}
						>{typeChoisi === 'note' ? 'Fichier de la note' : 'Dossier à importer'}</label
					>
					<div class="selecteur-fichier">
						<span class="selecteur-fichier__icone" aria-hidden="true">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"><path d="M3 7h6l2 2h10v10H3z" /></svg
							>
						</span>
						<button
							class="btn"
							id={typeChoisi === 'note' ? 'parcourir' : 'parcourir-dossier'}
							onclick={typeChoisi === 'note' ? parcourir : parcourirUnDossier}
							>{typeChoisi === 'note' ? 'Choisir un fichier' : 'Choisir un dossier'}</button
						>
						<span class="selecteur-fichier__nom">
							{depose
								? typeChoisi === 'note'
									? fichiers[0]?.name
									: sourceDuLot
								: typeChoisi === 'note'
									? 'Aucun fichier choisi'
									: 'Aucun dossier choisi'}
						</span>
						{#if depose}<button
								class="selecteur-fichier__effacer"
								aria-label="Retirer la sélection"
								onclick={remplacerLaSource}>×</button
							>{/if}
					</div>
					{#if vivant}<input
							type="file"
							hidden
							bind:this={champDeFichiers}
							onchange={surChoixDeFichiers}
						/><input
							type="file"
							multiple
							webkitdirectory={true}
							hidden
							bind:this={champDeDossier}
							onchange={surChoixDeFichiers}
						/>{/if}
				</div>

				<div class="reglages-depot">
					{#if typeChoisi === 'note'}
						<h2 class="destination-titre">Où ranger cette note&nbsp;?</h2>
						{#if destinationsOuEcrire.length === 0}
							<p class="etat-destination-vide">
								Aucun emplacement ne peut encore recevoir cette note. Créez d’abord un univers puis
								un domaine dans la console.
							</p>
						{/if}
						<div class="destination-note" id="destination-note">
							<div class="champ">
								<label class="champ__label" for="univers-note"
									>Univers <span class="oblig">*</span></label
								>
								<select
									class="selecteur"
									id="univers-note"
									value={universDeNoteRetenu}
									onchange={(e) =>
										choisirUniversDeNote((e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="">Choisir un univers…</option>
									{#each universPourUneNote as u (u.identifiant)}<option value={u.identifiant}
											>{u.nom}</option
										>{/each}
								</select>
							</div>
							<div class="champ">
								<label class="champ__label" for="domaine-note"
									>Domaine <span class="oblig">*</span></label
								>
								<select
									class="selecteur"
									id="domaine-note"
									value={domaineDeNoteRetenu}
									disabled={universDeNoteRetenu === ''}
									onchange={(e) =>
										choisirDomaineDeNote((e.currentTarget as HTMLSelectElement).value)}
								>
									<option value="">Choisir un domaine…</option>
									{#each domainesPourUneNote as d (d.identifiant)}<option value={d.identifiant}
											>{d.nom}</option
										>{/each}
								</select>
							</div>
							<div class="champ">
								<label class="champ__label" for="destination-import"
									>Dossier <span class="champ__facultatif">facultatif</span></label
								>
								<select
									class="selecteur"
									id="destination-import"
									value={destinationRetenue}
									disabled={domaineDeNoteRetenu === ''}
									onchange={(e) =>
										(destinationRetenue = (e.currentTarget as HTMLSelectElement).value)}
								>
									{#each emplacementsPourUneNote as emplacement (emplacement.index)}<option
											value={'emplacement:' + emplacement.index}
											>{emplacement.cible.niveau === 'domaine'
												? 'À la racine du domaine'
												: emplacement.cible.chemin.split('/').join(' › ')}</option
										>{/each}
								</select>
								<span class="champ__aide"
									>Laissez « À la racine du domaine » si aucun dossier particulier n’est nécessaire.</span
								>
							</div>
						</div>
					{:else}
						<div class="destination-dossier" id="destination-dossier">
							<div class="champ champ--destination-mode">
								<label class="champ__label" for="mode-destination">Destination</label>
								<select
									class="selecteur"
									id="mode-destination"
									value={destinationDuDossier}
									onchange={(e) =>
										choisirDestinationDuDossier((e.currentTarget as HTMLSelectElement).value)}
								>
									{#if destinationsOuEcrire.length > 0}<option value="existant"
											>Importer dans un emplacement existant</option
										>{/if}
									{#if universOuCreerUnDomaine.length > 0}<option value="domaine"
											>Créer un domaine à partir de ce dossier</option
										>{/if}
									{#if peutCreerUnUnivers}<option value="univers"
											>Créer un univers à partir de ce dossier</option
										><option value="racine">Importer comme racine de l’application</option>{/if}
								</select>
							</div>
							{#if destinationDuDossier === 'existant'}
								<div class="champ">
									<label class="champ__label" for="destination-import"
										>Emplacement <span class="oblig">*</span></label
									>
									<select
										class="selecteur"
										id="destination-import"
										value={destinationRetenue}
										onchange={(e) =>
											(destinationRetenue = (e.currentTarget as HTMLSelectElement).value)}
									>
										<option value="">Choisir un emplacement…</option>
										{#each destinationsOuEcrire as d, index (d.univers + '/' + d.domaine + '/' + d.chemin)}<option
												value={'emplacement:' + index}>{d.libelle}</option
											>{/each}
									</select>
								</div>
							{:else if destinationDuDossier === 'domaine'}
								<div class="destination-champs">
									<div class="champ">
										<label class="champ__label" for="univers-domaine"
											>Univers <span class="oblig">*</span></label
										>
										<select
											class="selecteur"
											id="univers-domaine"
											value={universRetenu}
											onchange={(e) =>
												(universRetenu = (e.currentTarget as HTMLSelectElement).value)}
										>
											<option value="">Choisir un univers…</option>
											{#each universOuCreerUnDomaine as u (u.identifiant)}<option
													value={u.identifiant}>{u.nom}</option
												>{/each}
										</select>
									</div>
									<div class="champ">
										<label class="champ__label" for="nom-domaine">Nom du domaine</label>
										<input
											class="saisie"
											id="nom-domaine"
											value={nomDuDomaine}
											oninput={(e) => (nomDuDomaine = (e.currentTarget as HTMLInputElement).value)}
										/>
									</div>
								</div>
							{:else if destinationDuDossier === 'univers'}
								<div class="champ">
									<label class="champ__label" for="nom-univers">Nom de l’univers</label>
									<input
										class="saisie"
										id="nom-univers"
										value={nomDeLUnivers}
										oninput={(e) => (nomDeLUnivers = (e.currentTarget as HTMLInputElement).value)}
									/>
								</div>
								<div class="explication-structure">
									Le dossier devient un univers. Ses sous-dossiers directs deviennent des domaines.
								</div>
								<p class="rangement-automatique">
									Les notes placées à la racine seront rangées automatiquement dans un domaine
									portant le nom de l’univers.
								</p>
							{:else}
								<div class="explication-structure">
									Chaque dossier direct du dossier choisi deviendra un univers. Un univers déjà
									existant sera complété ; un univers absent sera créé.
								</div>
								<p class="rangement-automatique">
									Les fichiers placés directement dans le dossier racine seront ignorés et signalés
									dans l’aperçu et le rapport.
								</p>
							{/if}
						</div>
					{/if}
					<p class="resultat-destination" id="resultat-destination">{annonceDuResultat}</p>
					<details class="options-import">
						<summary>Options avancées</summary>
						<label class="case" id="champ-simulation"
							><input
								type="checkbox"
								id="simulation"
								checked={simulationRetenue}
								onchange={(e) =>
									(simulationRetenue = (e.currentTarget as HTMLInputElement).checked)}
							/><span class="case__txt"
								>Simulation<span class="case__aide"
									>Analyser le contenu et produire le rapport sans rien écrire.</span
								></span
							></label
						>
						<label class="case" id="champ-strict"
							><input
								type="checkbox"
								id="strict"
								checked={strictRetenu}
								onchange={(e) => (strictRetenu = (e.currentTarget as HTMLInputElement).checked)}
							/><span class="case__txt"
								>Refuser tout l’import si un fichier échoue<span class="case__aide"
									>Sans cette option, les fichiers en échec sont consignés et les autres sont
									importés.</span
								></span
							></label
						>
					</details>
				</div>
			</div>
		</section>

		<!-- ============ ÉTAPE 2 — Aperçu ============ -->
		<section class="etape" data-etape="2" data-active={etape === 2 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Vérifier avant d’importer</h1>
			<p class="etape__sous">
				Rien n'a encore été écrit. Vérifiez l'arborescence détectée et les fichiers écartés, puis
				validez ou renoncez.
			</p>
			<h2 class="apercu-destination">Destination&nbsp;: {destinationDeLApercu}</h2>
			<div class="table-apercu">
				<table>
					<thead><tr><th>Élément importé</th><th>Résultat</th></tr></thead>
					<tbody>
						{#each LOT.fichiers as fichier, index (`${fichier.c}:${index}`)}<tr
								><td>{fichier.c}</td><td>{resultatDeFichier(fichier)}</td></tr
							>{/each}
					</tbody>
				</table>
			</div>

			<div class="apercu-grille">
				<div>
					<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
						>Arborescence détectée</span
					>
					<!-- prettier-ignore -->
					<div class="arbre-lot" id="arbre-lot"
						>{#if etape === 2}<ul
							>{#each niveauTrie(arborescence) as e (e.nom)}{@render dossierDuLot(e)}{/each}</ul
						>{/if}</div
					>

					<div class="ignores">
						<span class="etiq" style="display:block;margin-bottom:var(--e-2)">Fichiers écartés</span
						>
						<!-- prettier-ignore -->
						<div id="liste-ignores"
							>{#if etape === 2}{#each ecartes as f, index (`${f.c}:${index}`)}{@render fichierEcarte(f)}{/each}{/if}</div
						>
					</div>
				</div>

				<!-- prettier-ignore -->
				<aside class="recap" id="recap"
					>{#if etape === 2}<div class="recap__bloc"
						><div class="recap__val">{resume.notes}</div
						><span class="recap__nom">notes seront créées</span></div
					>{#if resume.misesAJour}<div class="recap__bloc"
						><div class="recap__val">{resume.misesAJour}</div
						><span class="recap__nom">notes seront mises à jour</span></div
					>{/if}<div class="recap__bloc"
						><span class="etiq">Par format</span
						><div class="recap__liste"
							>{#each parFormat as [n, nom] (nom)}<div class="recap__ligne"
								><b>{n}</b><span>{nom}</span></div
							>{/each}</div
						></div
					><div class="recap__bloc"
						><span class="etiq">Structure</span
						><div class="recap__liste"
							>{#each creations as [n, nom] (nom)}<div class="recap__ligne"
								><b>{n}</b><span>{nom}</span></div
							>{/each}</div
						></div
					><div class="recap__bloc"
						><div class="recap__val">{resume.ignores}</div
						><span class="recap__nom">fichiers écartés</span></div
					>{/if}</aside
				>
			</div>
		</section>

		<!-- ============ ÉTAPE 3 — Import et résultat ============ -->
		<section class="etape" data-etape="3" data-active={etape === 3 ? 'oui' : 'non'}>
			<!-- `rendreRapport()` remplace ces deux textes quand le rapport arrive. -->
			<h1 class="etape__titre" id="titre-4">
				{rapport === null
					? 'Import en cours'
					: rapport.refuseEnBloc
						? 'Lot refusé en bloc — rien n’a été écrit'
						: rapport.simulation
							? 'Simulation terminée — rien n’a été écrit'
							: 'Import terminé'}
			</h1>
			<p class="etape__sous" id="sous-4">
				{#if rapport === null}Un fichier en erreur n'interrompt pas le lot : le traitement va
					jusqu'au bout et le rapport détaillera chaque cas.{:else if rapport.refuseEnBloc}Vous avez
					demandé le mode strict. Le lot a été traité de bout en bout — le rapport ci-dessous dit ce
					qui serait entré —, puis tout a été annulé parce qu'une ligne au moins n'est pas passée.
					Corrigez ce qui est signalé, ou relancez sans le mode strict.{:else if rapport.simulation}Le
					lot a été traité de bout en bout, puis annulé : la base est exactement dans l'état où elle
					était. Revenez à l'aperçu pour lancer l'import réel.{/if}
			</p>

			<div class="progression-bloc" id="bloc-progression" hidden={rapport !== null}>
				<!-- prettier-ignore -->
				<div class="barre-progres"
					>{#if etape === 3}<i id="barre" style="width:{progression.pourcent}%"></i
					>{:else}<i id="barre"></i>{/if}</div
				>
				<div class="fichier-courant" id="fichier-courant">{progression.courant}</div>
				<div class="compteurs-vifs">
					<div class="cv cv--succes">
						<div class="cv__val" id="c-notes">{progression.notes}</div>
						<span class="cv__nom">notes créées</span>
					</div>
					<div class="cv cv--ignore">
						<div class="cv__val" id="c-ignores">{progression.ignores}</div>
						<span class="cv__nom">ignorées</span>
					</div>
					<div class="cv cv--echec">
						<div class="cv__val" id="c-echecs">{progression.echecs}</div>
						<span class="cv__nom">en échec</span>
					</div>
				</div>
				<div style="margin-top:var(--e-4);display:flex;gap:var(--e-2);flex-wrap:wrap">
					<button class="btn" id="arriere-plan">Laisser tourner en arrière-plan</button>
				</div>
			</div>

			<!-- Le rapport — `rendreRapport()` du gel, nourri du traitement RÉEL : aucun
				de ses nombres n'est écrit ici. « Références non résolues » disparaît quand il
				n'y en a aucune ; une section vide affirmerait le contraire. -->
			<!-- `svelte/no-navigation-without-resolve` est levée pour le seul lien de note
				ci-dessous : `resolve()` n'accepte qu'un chemin connu à la compilation, et
				l'adresse d'une note importée est bâtie à l'exécution (`ARB-001`). -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<!-- prettier-ignore -->
			<div id="rapport" hidden={rapport === null}
				>{#if rapport !== null}<div class="bilan" data-avec-erreurs={rapport.echecs ? 'oui' : 'non'}
					><div class="bilan__ic"
						>{#if rapport.echecs}<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--c-alerte)" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5M12 16.3v.3"/></svg>{:else}<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--c-frais)" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l3 3 5.4-6"/></svg>{/if}</div
					><div style="flex:1"
						><h3>{titreDuBilan(rapport)}</h3
						><p
							>{#if rapport.echecs}{PHRASES.bilanAvecErreurs}<b>{`${rapport.notesCreees + rapport.notesMisesAJour} ${accord(rapport.notesCreees + rapport.notesMisesAJour, 'fichier')} sur ${rapport.total}`}</b>{bilanDesEchecs(rapport.notesCreees + rapport.notesMisesAJour, rapport.echecs)}{:else}{PHRASES.bilanSansErreur}<b>{`${rapport.ignores} ${accord(rapport.ignores, 'fichier')}`}</b>{PHRASES.ecartesALApercu(rapport.ignores)}{/if}</p
						></div
					></div
				>{#if rapport.echecs}<section class="section-rapport section-rapport--erreurs"
					><span class="etiq">Fichiers en échec — à reprendre</span
					><div class="section-rapport__cadre"
						>{#each rapport.enEchec as f, index (`${f.chemin}:${index}`)}<div class="ign"
							><span class="ign__marque" style="background:var(--c-danger-voile);color:var(--c-danger)">échec</span
							><span class="ign__nom">{f.chemin}</span
							><span class="ign__motif">{motifEnClair(f.motif)}</span></div
						>{/each}</div
					></section
				>{/if}{#if rapport.ignoresDetail.length}<section class="section-rapport"
					><span class="etiq">Fichiers ignorés</span
					><div class="section-rapport__cadre"
						>{#each rapport.ignoresDetail as f, index (`${f.chemin}:${index}`)}<div class="ign"
							><span class="ign__marque">ignoré</span
							><span class="ign__nom">{f.chemin}</span
							><span class="ign__motif">{motifEnClair(f.motif)}</span></div
						>{/each}</div
					></section
				>{/if}{#if rapport.renvoisNonResolus.length}<section class="section-rapport"
					><span class="etiq">Références non résolues</span
					><div class="section-rapport__cadre"
						>{#each rapport.renvoisNonResolus as r, index (`${r.chemin}:${index}`)}<div class="ign"
							><span class="ign__marque">lien</span
							><span class="ign__nom">{r.chemin}</span
							><span class="ign__motif">{`renvoie à « ${r.renvois.join(' », « ')} », absente du lot. Le renvoi est consigné ici et nulle part ailleurs : aucun lien n’est mis en attente, et la relation reste à créer à la main.`}</span></div
						>{/each}</div
					></section
				>{/if}<section class="section-rapport"
					><span class="etiq">{rapportSimule ? 'Structure qui serait créée' : 'Structure créée'}</span
					><div class="section-rapport__cadre" style="padding:var(--e-3) var(--e-4);font-size:var(--t-petit)"
						>{#if rapport.destination === 'racine'}{`${rapport.universCrees} ${accord(rapport.universCrees, 'univers créé', 'univers créés')}, ${rapport.domainesCrees} ${accord(rapport.domainesCrees, 'domaine créé', 'domaines créés')} et ${rapport.dossiersCrees} ${accord(rapport.dossiersCrees, 'dossier créé', 'dossiers créés')} depuis la racine ${rapport.domaine}.`}{:else if rapport.destination === 'univers'}{`${rapport.universCree ? '1 univers créé, ' : ''}${rapport.domainesCrees} ${accord(rapport.domainesCrees, 'domaine créé', 'domaines créés')} et ${rapport.dossiersCrees} ${accord(rapport.dossiersCrees, 'dossier créé', 'dossiers créés')} dans l’univers ${rapport.domaine}.`}{:else}{`${rapport.dossiersCrees} ${accord(rapport.dossiersCrees, 'dossier')} ${auFuturSiSimule(rapport, accord(rapport.dossiersCrees, 'créé'), accord(rapport.dossiersCrees, 'serait créé', 'seraient créés'))} dans le domaine ${rapport.domaine}.`}{/if}{#if rapport.relationsCreees}{` ${rapport.relationsCreees} ${accord(rapport.relationsCreees, 'relation')} ${auFuturSiSimule(rapport, accord(rapport.relationsCreees, 'créée', 'créées'), accord(rapport.relationsCreees, 'serait créée', 'seraient créées'))} par les renvois déclarés.`}{/if}</div
					></section
				><section class="section-rapport"
					><span class="etiq">{intituleDesNotes(rapport)}</span
					><div class="section-rapport__cadre"
						>{#each rapport.ecrites.slice(0, 8) as n, index (`${n.identifiant}:${index}`)}{#if rapportSimule}<div class="note-creee"
							><span class="note-creee__nom">{n.titre}</span
							><span class="note-creee__ou">{n.ou}</span></div
						>{:else}<a class="note-creee" href={n.adresse}
							><span class="note-creee__nom">{n.titre}</span
							><span class="note-creee__ou">{n.ou}</span></a
						>{/if}{/each}{#if rapport.ecrites.length > 8}<div style="padding:var(--e-2);font-size:var(--t-mini);color:var(--c-encre-3)"
							>{`et ${rapport.ecrites.length - 8} ${accord(rapport.ecrites.length - 8, 'autre')} — la liste complète est accessible depuis ${rapport.destination === 'racine' ? 'l’accueil' : rapport.destination === 'univers' ? 'l’univers' : 'le domaine'}.`}</div
						>{/if}</div
					></section
			>{/if}</div
			>
			{#if rapport !== null && !rapportSimule}
				<div class="actions-resultat">
					<a
						class="btn btn--principal"
						href={typeChoisi === 'note' && rapport.ecrites.length === 1
							? rapport.ecrites[0]?.adresse
							: adresseDuDomaine}
						>{typeChoisi === 'note' && rapport.ecrites.length === 1
							? 'Ouvrir la note'
							: rapport.destination === 'univers'
								? 'Ouvrir l’univers'
								: rapport.destination === 'racine'
									? 'Ouvrir l’accueil'
									: 'Ouvrir le domaine'}</a
					>
					{#if peutVoirLeJournal}<a class="btn" href={resolve('/console/imports')}
							>Voir le rapport</a
						>{/if}
					<button class="btn" onclick={renoncer}>Nouvel import</button>
				</div>
			{:else if rapport !== null}
				<div class="actions-resultat">
					<button class="btn btn--principal" onclick={reculer}>Retour à l’aperçu</button>
					{#if peutVoirLeJournal}<a class="btn" href={resolve('/console/imports')}
							>Voir le rapport</a
						>{/if}
					<button class="btn" onclick={renoncer}>Nouvel import</button>
				</div>
			{/if}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</section>

		<!-- ---------- Pied de parcours ---------- -->
		<div class="pied-parcours" id="pied" hidden={etape === 3}>
			<button class="btn" id="precedent" hidden={precedentMasque} onclick={reculer}>Retour</button>
			<div class="pied-parcours__droite">
				<button class="btn" id="renoncer" hidden={renoncerMasque} onclick={renoncer}
					>Renoncer</button
				>
				<button
					class="btn btn--principal"
					id="suivant"
					disabled={suivantInhibe}
					hidden={suivantMasque}
					onclick={() => void avancer()}><span id="suivant-txt">{libelleDuSuivant}</span></button
				>
			</div>
		</div>
	{/snippet}
</Coquille>
