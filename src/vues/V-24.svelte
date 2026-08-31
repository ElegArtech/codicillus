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
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { designationsDeCoquille, type CompteAffiche } from '$lib/coquille/identite';
	import { adressesParLesNoms } from '$lib/rangement/adresses';
	import { accord } from '$lib/vocabulaire';

	/** Les adresses se composent sur l'identifiant persisté, jamais sur le nom. */
	const adresses = adressesParLesNoms(designationsDeCoquille());
	import { cheminDuFichier, fichiersDuTransfert } from '$lib/cablage/depot-de-fichiers';
	import {
		SCENARIO_LIVRE,
		scenarioEstLivre,
		type ScenarioDImport
	} from '$lib/donnees/scenarios-d-import';

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
		/** Le compte connecté. Absente, un compte VIDE — jamais celui du jeu. */
		compte?: CompteAffiche | null;
		lotImport: LotDImport;
		/** Les libellés des formats admis. Reçue PARTIELLE : le rendu retombe sur l'extension. */
		formatsImport: Partial<Record<FormatDImport, string>>;
		/**
		 * Un lot déjà déposé, remis par l'écran qui l'a reçu — le dépôt de la console
		 * (`mockups/V-35-console-imports.html:3000`) fait atterrir les fichiers AVANT le
		 * choix du scénario, et l'étape 1 doit les tenir. Vide, le parcours s'ouvre sur
		 * une étape 1 vierge. Le lot n'est pas analysé pour autant : le classement
		 * demande une cible, donc un scénario.
		 */
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
	}

	/** Ce que le dépôt règle, et que les deux appels transportent. */
	interface ReglagesDuDepot {
		/**
		 * Le scénario retenu. Il ne partait nulle part : un lot arrivait au serveur
		 * sans rien qui le distingue et se rangeait dans le domaine par défaut.
		 */
		readonly scenario: string;
		readonly domaine: string;
		readonly simulation: boolean;
	}

	/** Le rapport d'un lot tel que l'écran le rend — `RG-M12-04` et `RG-M12-09`.
	    Chaque nombre vient du traitement réel ; les noms sont ceux de
	    `RapportDImport`. */
	interface RapportAffiche {
		readonly simulation: boolean;
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
		readonly domaine: string;
		/** `RG-M12-04` — chaque fichier en échec, avec sa cause en clair. */
		readonly enEchec: readonly { readonly chemin: string; readonly motif: string }[];
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
	let scenarioLocal = $state<string | null>(null);
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
	let domaineRetenu = $state('');
	/** Le motif du dernier refus serveur, en code. `null` : aucun refus en cours. */
	let refus = $state<string | null>(null);

	const domaineCible = $derived(domaineRetenu || domaineParDefaut);
	/**
	 * `domaineParDefaut` vaut la chaîne vide quand aucune cible n'est ouverte au
	 * compte : l'illustration nomme alors le geste, jamais un domaine du jeu.
	 */
	const domaineIllustre = $derived(domaineCible === '' ? 'le domaine choisi' : domaineCible);

	const reglage = $derived(vecteur ?? {});

	/** L'étape du parcours — `data-etape` de `div.app`, quatre positions. */
	const etape = $derived(
		vivant
			? etapeLocale
			: reglage['et'] === '2' || reglage['et'] === '3' || reglage['et'] === '4'
				? Number(reglage['et'])
				: 1
	);

	/* Le scénario choisi et le lot déposé ne sont pas des réglages de planche :
	   ils sont posés par le déplacement d'étape (`V-24:3387`). */
	const scenarioChoisi = $derived<string | null>(
		vivant ? scenarioLocal : etape >= 2 ? SCENARIO_LIVRE : null
	);
	const depose = $derived(vivant ? fichiers.length > 0 : etape >= 3);

	/* Le scénario offert — `SCENARIOS` (`V-24:2871`), transcrit de la maquette.
	   L'illustration est en segments plutôt qu'en balisage : le gel l'injecte par
	   `innerHTML`. LE GEL EN DESSINE TROIS, L'IMPORT N'EN EXÉCUTE QU'UN : le choix
	   des deux autres ne partait nulle part et le lot atterrissait dans le domaine
	   par défaut. N'offre que ce que `scenarioEstLivre()` reconnaît. */

	interface SegmentIllustre {
		readonly gras: boolean;
		readonly texte: string;
	}
	interface Scenario {
		readonly id: ScenarioDImport;
		readonly nom: string;
		readonly txt: string;
		readonly illus: readonly SegmentIllustre[];
	}

	/**
	 * L'ILLUSTRATION NE NOMME RIEN DU JEU DE DÉMONSTRATION — ni la cible, ni les deux
	 * dossiers en gras à DROITE de la flèche, qui désignent des dossiers du produit.
	 * `import-promesses.test.ts` tient la porte, sur une liste lue de `seeds/corpus.ts`.
	 */
	const SCENARIOS: readonly Scenario[] = $derived([
		{
			id: SCENARIO_LIVRE,
			nom: 'Importer des notes dans un domaine existant',
			txt: "Vos fichiers rejoignent un domaine déjà en place. L'arborescence des dossiers de votre disque devient l'arborescence des dossiers du domaine, à l'identique.",
			illus: [
				{
					gras: false,
					texte: `Contrats/\n  Prestataires/\n    Infogérance.docx\n\n→ ${domaineIllustre}\n   └ `
				},
				{ gras: true, texte: 'Contrats' },
				{ gras: false, texte: '\n      └ ' },
				{ gras: true, texte: 'Prestataires' },
				{ gras: false, texte: '\n         └ Infogérance' }
			]
		}
	]);

	/**
	 * Le filtre lit le module qui déclare ce que l'import exécute : y ajouter un
	 * scénario livré suffit à le rendre offert.
	 */
	const SCENARIOS_OFFERTS = $derived(SCENARIOS.filter((s) => scenarioEstLivre(s.id)));

	const scenarioCourant = $derived(SCENARIOS_OFFERTS.find((s) => s.id === scenarioChoisi) ?? null);

	/* Étape 2 — le dépôt (`rendreDepot()`, `V-24:2918`). Les formats admis et les
	   options de domaine ne sont peuplés qu'une fois l'étape 2 traversée. */

	/** Les cinq familles annoncées comme admises — `V-24:2929`. */
	const FORMATS_ADMIS: readonly string[] = [
		'Traitement de texte',
		'Présentation',
		'PDF',
		'Texte brut',
		'Markdown'
	];

	const depotTraverse = $derived(vivant ? etape >= 2 : etape === 2);
	const sousTitreDuDepot = $derived(
		depotTraverse && scenarioCourant
			? scenarioCourant.nom +
					'. Les formats acceptés sont indiqués ci-dessous ; tout le reste sera écarté et vous saurez pourquoi.'
			: '—'
	);

	/* Le lot, et ce qu'on en déduit — `resumeLot()` (`V-24:2552`) et
	   `arborescenceLot()` (`V-24:2532`). Aucun chiffre n'est saisi. */

	const LOT = $derived(lotAnalyse ?? lotImport);

	/**
	 * Les codes de motif du classement, mis en français ici — les formulations du
	 * gel, au caractère près. Une valeur inconnue passe telle quelle : le lot
	 * d'exemple porte déjà des phrases dans ce champ, à ne pas traduire deux fois.
	 */
	const LIBELLE_DU_MOTIF: Readonly<Record<string, string>> = {
		'format-non-converti':
			"Ce format n'est pas converti en note. Déposez-le en pièce jointe d'une note existante.",
		'format-inconnu': "Le dépôt ne reconnaît pas ce format : le fichier n'a pas été ouvert.",
		'fichier-vide': 'Fichier vide, sans contenu à reprendre.',
		'doublon-dans-le-lot': 'Fichier identique à un autre du lot, conservé une seule fois.',
		'service-de-conversion-injoignable':
			"Le service de conversion n'a pas répondu. Le reste du lot a été traité ; ce fichier est à reprendre.",
		'outil-de-conversion-absent':
			"L'outil qui lit ce format manque au service de conversion. Le reste du lot a été traité.",
		'fichier-protege':
			"Le fichier est protégé par un mot de passe : son contenu n'a pas pu être lu.",
		'fichier-endommage': "La structure interne du fichier ne s'ouvre pas : il est endommagé.",
		'delai-de-conversion-depasse': 'La conversion a dépassé le délai accordé et a été interrompue.',
		'conversion-absente': "Ce fichier n'a pas été soumis à la conversion.",
		'contenu-illisible': "Le contenu n'a pas pu être lu comme un document."
	};

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

	function motifEnClair(motif: string | undefined): string {
		if (motif === undefined) return '';
		return LIBELLE_DU_MOTIF[motif] ?? motif;
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
		'scenario-non-livre':
			'Ce scénario d’import n’est pas exécuté par cette instance. Rien n’a été déposé : seul l’import de notes dans un domaine existant est disponible.',
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
		if (r.simulation) return `Notes qui seraient écrites — ${r.ecrites.length}`;
		if (r.notesMisesAJour === 0) return `Notes créées — ${r.notesCreees}`;
		return `Notes écrites — ${r.ecrites.length}`;
	}

	/**
	 * Une simulation n'a rien écrit, et aucune phrase du rapport ne doit dire le
	 * contraire. `simulation` est le SEUL champ par lequel les deux rapports diffèrent
	 * (`RG-M12-02`) ; l'écran ne le lisait nulle part et offrait des liens qui
	 * rendaient 404.
	 */
	function auFuturSiSimule(r: RapportAffiche, passe: string, futur: string): string {
		return r.simulation ? futur : passe;
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
	const nombreDeDossiers = $derived(compterDossiers(arborescence));

	/** Un niveau dans l'ordre alphabétique — `Object.keys(a).sort()` du gel. */
	function niveauTrie(niveau: readonly NoeudDuLot[]): NoeudDuLot[] {
		return [...niveau].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
	}

	const parFormat = $derived(
		[...resume.formats]
			.sort((a, b) => b[1] - a[1])
			.map(([f, n]) => [n, formatsImport[f] ?? f] as const)
	);

	/** La structure annoncée. Le scénario « notes » ne crée aucun domaine. */
	const creations = $derived([[nombreDeDossiers, 'dossiers créés'] as const]);

	const ecartes = $derived(LOT.fichiers.filter((f) => f.s === 'ignore'));

	/* Étape 4 — l'instant capturé (`lancerImport()`, `V-24:3100`). */

	/** Rang de l'instant capturé, en fichiers traités. */
	const TRAITES = 7;

	const progression = $derived.by(() => {
		/* Sur une route réelle, le traitement est au serveur : une barre qui
		   progresserait toute seule serait une valeur illustrative. Elle reste à
		   zéro, comme les compteurs, jusqu'à ce que le rapport les remplace. */
		if (vivant) return { pourcent: 0, courant: 'Préparation…', notes: 0, ignores: 0, echecs: 0 };
		if (etape !== 4) {
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
		const dernier = LOT.fichiers[TRAITES - 1] as FichierDuLot;
		return {
			pourcent: Math.round((TRAITES / LOT.fichiers.length) * 100),
			courant: dernier.c,
			notes,
			ignores,
			echecs
		};
	});

	/* Le fil de jalons et le pied de parcours — `majPied()` (`V-24:3349`). */

	const JALONS: readonly { readonly rang: number; readonly nom: string }[] = [
		{ rang: 1, nom: 'Scénario' },
		{ rang: 2, nom: 'Dépôt' },
		{ rang: 3, nom: 'Aperçu' },
		{ rang: 4, nom: 'Import' }
	];

	function etatDuJalon(rang: number): 'faite' | 'courante' | 'avenir' {
		return rang < etape ? 'faite' : rang === etape ? 'courante' : 'avenir';
	}

	const renoncerMasque = $derived(etape !== 3);
	/** `termine` de `majPied()` — l'étape 4 avec son rapport à l'écran. */
	const termine = $derived(etape === 4 && rapport !== null);
	const rapportSimule = $derived(rapport !== null && rapport.simulation);
	const simulationTerminee = $derived(termine && rapportSimule);
	const precedentMasque = $derived(etape === 1 || etape === 4);
	/**
	 * « Ouvrir le domaine » n'est offert que si quelque chose y a été écrit : après
	 * une simulation, le domaine ne porte aucune des notes annoncées. Le pied de
	 * l'étape 4 d'une simulation n'a donc aucun geste, et on en sort par la coquille.
	 */
	const ouvrirLeDomaine = $derived(termine && !simulationTerminee);
	/* L'import lancé, « Continuer » disparaît jusqu'à ce que le rapport soit là. */
	const suivantMasque = $derived(etape === 4 && !ouvrirLeDomaine);
	/**
	 * `majPied()` ne retouche l'inhibition qu'aux étapes 1 à 3 : à l'étape 4, elle
	 * reste celle du dernier passage.
	 */
	const suivantInhibe = $derived(
		etape === 1 ? scenarioChoisi === null : etape === 2 ? !depose : etape === 3 ? enCours : !termine
	);
	const libelleDuSuivant = $derived(
		etape === 2
			? 'Analyser le lot'
			: etape === 3
				? simulationRetenue
					? 'Lancer la simulation'
					: "Lancer l'import"
				: ouvrirLeDomaine
					? 'Ouvrir le domaine'
					: 'Continuer'
	);

	/* Les gestes du parcours. Aucun n'a d'effet sans les deux rappels : `vivant`
	   en est le seul juge. */

	let champDeFichiers: HTMLInputElement | undefined = $state();
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
		scenario: scenarioChoisi ?? SCENARIO_LIVRE,
		domaine: domaineCible,
		simulation: simulationRetenue
	});

	function choisirScenario(id: string): void {
		if (!vivant) return;
		/* Le choix ne peut retenir que ce que l'import exécute. */
		if (!scenarioEstLivre(id)) return;
		scenarioLocal = id;
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
		fichiers = retenus;
		sourceDuLot = sourceDe(retenus);
		lotAnalyse = null;
		dossiersExistants = [];
		rapport = null;
		refus = null;
	}

	const megaOctets = $derived(
		Math.round((fichiers.reduce((t, f) => t + f.size, 0) / 1024 / 1024) * 10) / 10
	);

	function parcourir(): void {
		if (!vivant) return;
		champDeFichiers?.click();
	}

	function surChoixDeFichiers(evenement: Event): void {
		const champ = evenement.currentTarget as HTMLInputElement;
		retenir(Array.from(champ.files ?? []));
	}

	async function avancer(): Promise<void> {
		if (!vivant || enCours) return;

		if (etape === 1) {
			if (scenarioLocal !== null) etapeLocale = 2;
			return;
		}
		if (etape === 2) {
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
				etapeLocale = 3;
			} finally {
				enCours = false;
			}
			return;
		}
		if (etape === 3) {
			if (importer === undefined) return;
			enCours = true;
			refus = null;
			etapeLocale = 4;
			try {
				const issue = await importer(fichiers, reglages);
				if ('refus' in issue) {
					refus = issue.refus;
					/* Rien n'a été traité : on rend l'aperçu, où le geste se reprend. */
					etapeLocale = 3;
					return;
				}
				rapport = issue.valeur;
			} finally {
				enCours = false;
			}
			return;
		}
		/* Étape 4, rapport à l'écran : « Ouvrir le domaine ». */
		if (ouvrirLeDomaine) location.assign(adresseDuDomaine);
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
		rapport = null;
		refus = null;
		sourceDuLot = '';
		etapeLocale = 1;
	}

	/** L'adresse du domaine visé — bâtie par le constructeur unique (`ARB-001`). */
	const adresseDuDomaine = $derived.by(() => {
		const cible = domaines.find((d) => d.nom === domaineCible);
		/* L'IDENTIFIANT PERSISTÉ, PAS LE NOM SLUGIFIÉ : il ne suit pas les
		   renommages (`RG-M12-11`), et la sortie de l'étape 4 rendait 404. */
		return cible === undefined ? '/' : adresses.domaine(cible.univers, cible.nom);
	});
</script>

<!-- Les régions serrées reproduisent un DOM que le gel construit en script :
	elles sont soustraites au formateur, qui y réintroduirait des blancs entre
	nœuds. -->
<!-- prettier-ignore -->
{#snippet vignetteDeScenario(s: Scenario)}<button
		class="scen" type="button" aria-pressed={scenarioChoisi === s.id} onclick={() => choisirScenario(s.id)}
		><span class="scen__marque" aria-hidden="true"></span
		><span
			><h2 class="scen__nom">{s.nom}</h2
			><p class="scen__txt">{s.txt}</p></span
		><span class="scen__illus"
			>{#each s.illus as seg, k (k)}{#if seg.gras}<b>{seg.texte}</b>{:else}{seg.texte}{/if}{/each}</span
		></button
	>{/snippet}

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

		<!-- ============ ÉTAPE 1 — Scénario ============ -->
		<section class="etape" data-etape="1" data-active={etape === 1 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Que voulez-vous reprendre&nbsp;?</h1>
			<p class="etape__sous">
				Une manière de faire entrer l'existant est disponible sur cette instance. Confirmez qu'elle
				décrit votre situation — la structure de vos fichiers sera reprise telle quelle.
			</p>
			<!-- prettier-ignore -->
			<div class="scenarios" id="scenarios" role="group" aria-label="Scénario d'import"
				>{#each SCENARIOS_OFFERTS as s (s.id)}{@render vignetteDeScenario(s)}{/each}</div
			>
		</section>

		<!-- ============ ÉTAPE 2 — Dépôt ============ -->
		<section class="etape" data-etape="2" data-active={etape === 2 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Déposez vos fichiers</h1>
			<p class="etape__sous" id="depot-sous">{sousTitreDuDepot}</p>

			<div class="depot" id="depot" bind:this={zoneDeDepot}>
				<div class="depot__ic">
					<svg
						width="42"
						height="42"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.3"
						><path d="M12 16V4M8 7.5L12 3.5l4 4" /><path
							d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"
						/></svg
					>
				</div>
				<!--
					« Glissez un dossier OU UNE ARCHIVE ici » au gel. Une archive déposée
					est écartée par le classement : l'invitation ne la nomme donc plus.
				-->
				<h3>Glissez un dossier ici</h3>
				<p>
					L'arborescence est conservée. Vous pouvez aussi parcourir vos fichiers si vous préférez.
				</p>
				<button class="btn btn--principal" id="parcourir" onclick={parcourir}
					>Parcourir mes fichiers</button
				>
				<!-- Le gel ne porte pas de champ de fichiers : `#parcourir` y est un bouton
					nu. Le champ est donc posé ici, CACHÉ, et seulement quand le parcours est
					vivant. -->
				{#if vivant}<input
						type="file"
						multiple
						hidden
						bind:this={champDeFichiers}
						onchange={surChoixDeFichiers}
					/>{/if}
				<!-- prettier-ignore -->
				<div class="formats-admis" id="formats-admis"
					>{#if depotTraverse}{#each FORMATS_ADMIS as f (f)}<span>{f}</span>{/each}{/if}</div
				>
			</div>

			<div class="reglages-depot">
				<div class="champ" id="champ-domaine" hidden={scenarioChoisi !== SCENARIO_LIVRE}>
					<label class="champ__label" for="domaine-cible"
						>Domaine de destination <span class="oblig">*</span></label
					>
					<!-- prettier-ignore -->
					<select class="selecteur" id="domaine-cible" onchange={(e) => (domaineRetenu = (e.currentTarget as HTMLSelectElement).value)}
						>{#if depotTraverse}{#each domaines as d (d.nom)}<option
							value={d.nom} selected={d.nom === domaineCible}>{d.univers + ' › ' + d.nom}</option
						>{/each}{/if}</select
					>
				</div>
				<!--
					`#champ-nom-domaine` du gel n'est plus rendu : un champ obligatoire que
					personne ne lisait, sous un scénario que l'import n'exécute pas.
				-->
				<!-- La case « Simulation » n'est offerte que sous « corpus préparé », scénario
					non livré : rien de ce qu'elle porte n'atteint l'écran. Ne la rebranche pas
					sur le scénario livré — elle nommerait de nouveau une fonction que le produit
					ne tient pas. -->
				<label class="case" id="champ-simulation" hidden={scenarioChoisi !== 'prepare'}>
					<input
						type="checkbox"
						id="simulation"
						checked={simulationRetenue}
						onchange={(e) => (simulationRetenue = (e.currentTarget as HTMLInputElement).checked)}
					/>
					<span class="case__txt"
						>Simulation
						<span class="case__aide"
							>Tout est validé et le rapport est produit, mais rien n'est écrit. Utile pour vérifier
							un corpus préparé avant de l'engager.</span
						>
					</span>
				</label>
				<!-- `deposer()` du gel : les deux nombres sont mesurés sur les fichiers reçus. -->
				<!-- prettier-ignore -->
				<div class="lot-depose" id="lot-depose" hidden={!depose}
					>{#if depose}<span
						><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--c-frais)"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg
					></span
					><span style="flex:1"
						><b>{`${fichiers.length} ${accord(fichiers.length, 'fichier')}`}</b>{PHRASES.recusDepuis(fichiers.length)}<b>{sourceDuLot}</b>{` — ${megaOctets} Mo.`}</span
					><button class="btn" onclick={renoncer}>Remplacer le lot</button>{/if}</div
				>
			</div>
		</section>

		<!-- ============ ÉTAPE 3 — Aperçu ============ -->
		<section class="etape" data-etape="3" data-active={etape === 3 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Ce qui va être créé</h1>
			<p class="etape__sous">
				Rien n'a encore été écrit. Vérifiez l'arborescence détectée et les fichiers écartés, puis
				validez ou renoncez.
			</p>

			<div class="apercu-grille">
				<div>
					<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
						>Arborescence détectée</span
					>
					<!-- prettier-ignore -->
					<div class="arbre-lot" id="arbre-lot"
						>{#if etape === 3}<ul
							>{#each niveauTrie(arborescence) as e (e.nom)}{@render dossierDuLot(e)}{/each}</ul
						>{/if}</div
					>

					<div class="ignores">
						<span class="etiq" style="display:block;margin-bottom:var(--e-2)">Fichiers écartés</span
						>
						<!-- prettier-ignore -->
						<div id="liste-ignores"
							>{#if etape === 3}{#each ecartes as f (f.c)}{@render fichierEcarte(f)}{/each}{/if}</div
						>
					</div>
				</div>

				<!-- prettier-ignore -->
				<aside class="recap" id="recap"
					>{#if etape === 3}<div class="recap__bloc"
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

		<!-- ============ ÉTAPE 4 — Import et rapport ============ -->
		<section class="etape" data-etape="4" data-active={etape === 4 ? 'oui' : 'non'}>
			<!-- `rendreRapport()` remplace ces deux textes quand le rapport arrive. -->
			<h1 class="etape__titre" id="titre-4">
				{rapport === null
					? 'Import en cours'
					: rapport.simulation
						? 'Simulation terminée — rien n’a été écrit'
						: 'Import terminé'}
			</h1>
			<p class="etape__sous" id="sous-4">
				{#if rapport === null}Un fichier en erreur n'interrompt pas le lot : le traitement va
					jusqu'au bout et le rapport détaillera chaque cas.{:else if rapport.simulation}Le lot a
					été traité de bout en bout, puis annulé : la base est exactement dans l'état où elle
					était. Revenez à l'aperçu pour lancer l'import réel.{/if}
			</p>

			<div class="progression-bloc" id="bloc-progression" hidden={rapport !== null}>
				<!-- prettier-ignore -->
				<div class="barre-progres"
					>{#if etape === 4}<i id="barre" style="width:{progression.pourcent}%"></i
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
						>{#each rapport.enEchec as f (f.chemin)}<div class="ign"
							><span class="ign__marque" style="background:var(--c-danger-voile);color:var(--c-danger)">échec</span
							><span class="ign__nom">{f.chemin}</span
							><span class="ign__motif">{motifEnClair(f.motif)}</span></div
						>{/each}</div
					></section
				>{/if}{#if rapport.renvoisNonResolus.length}<section class="section-rapport"
					><span class="etiq">Références non résolues</span
					><div class="section-rapport__cadre"
						>{#each rapport.renvoisNonResolus as r (r.chemin)}<div class="ign"
							><span class="ign__marque">lien</span
							><span class="ign__nom">{r.chemin}</span
							><span class="ign__motif">{`renvoie à « ${r.renvois.join(' », « ')} », absente du lot. Le renvoi est consigné ici et nulle part ailleurs : aucun lien n’est mis en attente, et la relation reste à créer à la main.`}</span></div
						>{/each}</div
					></section
				>{/if}<section class="section-rapport"
					><span class="etiq">{rapportSimule ? 'Structure qui serait créée' : 'Structure créée'}</span
					><div class="section-rapport__cadre" style="padding:var(--e-3) var(--e-4);font-size:var(--t-petit)"
						>{`${rapport.dossiersCrees} ${accord(rapport.dossiersCrees, 'dossier')} ${auFuturSiSimule(rapport, accord(rapport.dossiersCrees, 'créé'), accord(rapport.dossiersCrees, 'serait créé', 'seraient créés'))} dans le domaine ${rapport.domaine}.`}</div
					></section
				><section class="section-rapport"
					><span class="etiq">{intituleDesNotes(rapport)}</span
					><div class="section-rapport__cadre"
						>{#each rapport.ecrites.slice(0, 8) as n (n.identifiant)}{#if rapportSimule}<div class="note-creee"
							><span class="note-creee__nom">{n.titre}</span
							><span class="note-creee__ou">{n.ou}</span></div
						>{:else}<a class="note-creee" href={n.adresse}
							><span class="note-creee__nom">{n.titre}</span
							><span class="note-creee__ou">{n.ou}</span></a
						>{/if}{/each}{#if rapport.ecrites.length > 8}<div style="padding:var(--e-2);font-size:var(--t-mini);color:var(--c-encre-3)"
							>{`et ${rapport.ecrites.length - 8} ${accord(rapport.ecrites.length - 8, 'autre')} — la liste complète est dans le domaine.`}</div
						>{/if}</div
					></section
				>{/if}</div
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</section>

		<!-- ---------- Pied de parcours ---------- -->
		<div class="pied-parcours" id="pied">
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
