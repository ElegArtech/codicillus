<script lang="ts">
	/**
	 * V-24 — Importer un lot de fichiers existants.
	 * Route `/importer` (`verif/scenarios/V-24.json`).
	 *
	 * SEPT ÉTATS, UNE SEULE FENÊTRE — 7 couples, deux contrôles de planche :
	 * l'étape du parcours (`et`, quatre positions) et l'issue de l'import
	 * (`issue`, trois positions).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES TROIS ÉTATS D'ISSUE RENDENT L'ÉTAPE 1, ET C'EST MESURÉ
	 *
	 * `issue-erreurs` porte déjà `identiqueA: "et-1"` au scénario. Les deux
	 * autres — `issue-propre`, `issue-global` — ne le portent pas, et rendent
	 * pourtant le MÊME écran : leur vecteur est `{ et: "1", issue: … }`, or le
	 * gel ne relit `issue` que si `div.app` est à l'étape 4
	 * (`V-24:3396`). Relevé au navigateur, dans les conditions du banc : les
	 * quatre documents `et-1`, `issue-erreurs`, `issue-propre` et `issue-global`
	 * sont identiques à l'octet sur `<main>`.
	 *
	 * CONSÉQUENCE, ET ELLE EST STRUCTURANTE : **LE RAPPORT D'IMPORT N'EST DANS
	 * AUCUN DES SEPT ÉTATS.** `div#rapport` est vide et `hidden` partout ; les
	 * trois issues — terminé avec erreurs, terminé sans erreur, échec global —
	 * ne sont atteignables qu'en étape 4, que la planche ne combine pas. Le
	 * squelette ne les écrit donc PAS : ce serait poser des règles qu'aucun cas
	 * n'exerce (`CLAUDE.md` §6, P-5), et deviner leur rendu plutôt que le
	 * porter. Remonté au rapport de lot.
	 *
	 * `RG-M12-04` — « un fichier en erreur n'interrompt jamais le lot » — est
	 * donc rendu par ce que les états MONTRENT : la phrase de l'étape 4
	 * (« le traitement va jusqu'au bout et le rapport détaillera chaque cas »),
	 * le compteur « en échec » qui vit à côté des deux autres, et les motifs en
	 * clair des fichiers écartés à l'étape 3. **CE LOT NE DÉCLARE TENUE AUCUNE
	 * DES RÈGLES `RG-M12-01` À `RG-M12-11`** : ce sont des rendus, pas la preuve
	 * d'une exigence.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ÉTAPE 4 EST UN INSTANT FIGÉ — ARB-011
	 *
	 * Le gel avance par `setInterval(…, 130)` (`V-24:3122`) : un fichier tous
	 * les 130 ms. Le banc, lui, ne patiente pas, il AVANCE une horloge virtuelle
	 * de 1 000 ms après avoir réglé la planche (`conditions.mjs` du banc,
	 * `AVANCE_ETAT_MS`), puis capture. Sept tics sont donc dus — 130, 260, …,
	 * 910 ms —, et l'écran mesuré est celui du septième : barre à 23 %, septième
	 * fichier du lot en cours, compteurs à 5 / 2 / 0.
	 *
	 * (Le chemin complet du module du banc n'est volontairement PAS cité :
	 * depuis T-070 cette vue est servie par une route réelle, donc BÂTIE, et
	 * `verif:demo:hors-production` cherche cette chaîne en texte brut dans le
	 * produit construit — commentaires compris. Écart É-2 du lot T-070.)
	 *
	 * AUCUNE MINUTERIE N'EST ÉCRITE ICI, et aucun de ces chiffres n'est saisi
	 * (P-02) : `TRAITES` est le seul nombre déclaré — le rang de l'instant
	 * capturé —, et tout le reste s'en déduit sur `LOT_IMPORT`. Le squelette
	 * rend l'ÉTAT, jamais la transition : « une capture est un instant, pas un
	 * film » (ARB-011).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main class="import-vue"
	 * id="contenu">` (ARB-015), lien d'évitement et libellé par défaut
	 * (ARB-019). Un attribut de données hors gabarit — `data-etape` (ARB-021,
	 * A-2) —, que la feuille de la vue lit pour l'avancement du fil de jalons.
	 *
	 * TOUT VIENT DE CE QUE LA ROUTE SERT — le lot déposé, les libellés de format
	 * et les domaines où écrire sont EXIGÉS en propriété. Ils étaient
	 * optionnels, de défaut `LOT_IMPORT`, `FORMATS_IMPORT` et `DOMAINES` de
	 * `seeds/corpus.ts` : un écran d'import sans chargeur montrait donc trente
	 * fichiers de démonstration comme s'ils venaient d'être déposés.
	 * L'arborescence détectée, le récapitulatif chiffré, les fichiers écartés et
	 * leurs motifs sont tous DÉRIVÉS du lot par les fonctions du gel,
	 * transcrites ici : `arborescenceLot()` (`V-24:2532`) et `resumeLot()`
	 * (`V-24:2552`).
	 *
	 * `JOURNAL_IMPORTS` n'est PAS employé : le journal des imports est une
	 * section de console (ARB-003, V-35), et aucun des sept états de V-24 ne le
	 * montre. Le porter ici serait inventer un écran.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN COMPORTEMENT — ARB-011. Le choix d'un scénario, le dépôt, le
	 * glisser-déposer, la navigation du parcours, le renoncement, la relance et
	 * les notifications sont du temps 3. `div.notifs` est rendu vide.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog.palette#palette`
	 * FERMÉ — `docs/releve-vues.md` §4.1 les mesure : aucune boîte de rendu,
	 * aucun pixel, aucune entrée dans l'instantané ARIA. Et `div.planche`, bloc
	 * hors produit (`docs/DESIGN.md` §2.G), que le banc retire lui-même.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-24.css`, posé par `node verif/feuilles-de-vue.mjs V-24
	 * --installer` (P-6.3). Les `style=` reproduits figurent tous à l'ensemble
	 * clos du gel de V-24 (ARB-016, P-6.4), y compris la largeur que le script
	 * de la maquette pose par `.style.width`.
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
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { adresseDeDomaine } from '$lib/rangement/adresses';
	import { cheminDuFichier, fichiersDuTransfert } from '$lib/cablage/depot-de-fichiers';
	import {
		SCENARIO_LIVRE,
		scenarioEstLivre,
		type ScenarioDImport
	} from '$lib/donnees/scenarios-d-import';

	interface Proprietes {
		/** Le vecteur complet de l'état — deux contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Les notes du périmètre, telles que le chargeur les lit. */
		notes: readonly Note[];
		/**
		 * CE QUE LA ROUTE SERT EST EXIGÉ, LE RESTE A UN ÉTAT VIDE.
		 *
		 * Les sources de cet écran étaient OPTIONNELLES, de défaut la constante de
		 * `seeds/corpus.ts` : une route qui en oubliait une servait le lot, les
		 * domaines et l'identité du jeu de démonstration sans que rien ne
		 * proteste. `/importer` sert les domaines où écrire, le lot déposé, les
		 * libellés de format et le domaine proposé : ces quatre-là sont EXIGÉS, et
		 * une route qui en oublierait un ne bâtirait plus.
		 *
		 * `univers` et `compte` restent optionnelles, avec un ÉTAT VIDE pour
		 * défaut — le contexte de coquille porte le rail et l'identité réels.
		 * `instance` a disparu : le contexte sert déjà la version.
		 */
		/** Les univers déclarés. Absente, aucun univers — jamais ceux du jeu. */
		univers?: readonly Univers[];
		/** Les domaines où l'utilisateur a le droit d'écrire. */
		domaines: readonly Domaine[];
		/** Le compte connecté. Absente, un compte VIDE — jamais celui du jeu. */
		compte?: CompteAffiche | null;
		/** Le lot déposé, tel que l'analyse le rend. */
		lotImport: LotDImport;
		/**
		 * Les libellés des formats admis — `LIBELLE_PAR_FORMAT` de
		 * `$lib/donnees/import.ts`, un référentiel du produit. La table est reçue
		 * PARTIELLE : un service de conversion qui n'en reconnaîtrait qu'une partie
		 * ne doit pas être empêché de le dire, et le rendu retombe déjà sur
		 * l'extension quand le libellé manque.
		 */
		formatsImport: Partial<Record<FormatDImport, string>>;
		/**
		 * UN LOT DÉJÀ DÉPOSÉ, REMIS PAR L'ÉCRAN QUI L'A REÇU — le gel de V-35.
		 *
		 * `mockups/V-35-console-imports.html:3000` fait atterrir le lot de la
		 * console « à l'étape du choix de scénario » : les fichiers sont donc
		 * REÇUS AVANT que le scénario ne soit choisi, et le parcours doit les
		 * tenir pendant l'étape 1. Cette propriété est ce qui les tient.
		 *
		 * VIDE, RIEN NE CHANGE — le parcours s'ouvre sur une étape 1 vierge, et
		 * le dépôt se fait à l'étape 2 comme le gel de V-24 le dessine. La zone
		 * de dépôt de l'étape 2 reste vivante dans les deux cas : « Remplacer le
		 * lot » du bloc `lot-depose` la rouvre.
		 *
		 * LE LOT N'EST PAS ANALYSÉ POUR AUTANT. Le classement demande une cible,
		 * et la cible demande un scénario : le lot attend, exactement là où le
		 * gel le dit.
		 */
		lotRecu?: readonly File[];
		/**
		 * L'ANALYSE D'UN LOT DÉPOSÉ — ce que la route fait du dépôt.
		 *
		 * Absente, le parcours reste celui de la planche : les vignettes se
		 * choisissent, le pied avance, et rien n'est envoyé nulle part. Fournie,
		 * l'étape 2 devient un vrai dépôt : les fichiers partent au serveur, qui
		 * les CLASSE sans rien écrire — c'est l'étape 3 de `UC-M12-04`, « rien
		 * n'a encore été écrit » — et rend le lot tel qu'il sera traité.
		 *
		 * Rend `null` quand l'analyse a échoué : le parcours reste alors où il est,
		 * et rien n'est inventé.
		 */
		analyser?: (
			fichiers: readonly File[],
			reglages: ReglagesDuDepot
		) => Promise<Issue<AnalyseDuLot>>;
		/**
		 * L'EXÉCUTION DU LOT — réelle ou simulée, c'est le même appel. `RG-M12-02` :
		 * « un seul chemin de code, donc un rapport de simulation qui dit
		 * rigoureusement ce que fera l'import réel ». La simulation n'est pas un
		 * autre geste, c'est un réglage du même.
		 */
		importer?: (
			fichiers: readonly File[],
			reglages: ReglagesDuDepot
		) => Promise<Issue<RapportAffiche>>;
		/**
		 * LE DOMAINE DE DESTINATION PROPOSÉ — exigé.
		 *
		 * Il était optionnel et retombait sur `compte.domaine`, dont le défaut
		 * était `MOI` du jeu de démonstration : un import sans destination visait
		 * alors « Infrastructure », un domaine que rien ne pose sur une instance
		 * réelle. La route le sert toujours ; la branche de repli est supprimée,
		 * pas neutralisée.
		 */
		domaineParDefaut: string;
	}

	/**
	 * CE QU'UN GESTE SERVEUR REND — le résultat, OU LE MOTIF DE SON REFUS.
	 *
	 * Les deux rappels rendaient `null` sur tout ce qui n'était pas un succès, et
	 * `avancer()` retournait en silence : « Analyser le lot » ne produisait alors
	 * RIEN DU TOUT, sans message — une impasse muette. `P-09` veut qu'une action
	 * offerte aboutisse ; à défaut, elle doit au moins DIRE pourquoi elle refuse.
	 *
	 * Le motif est un CODE, comme les motifs de classement : sa mise en français
	 * est ici, dans `LIBELLE_DU_REFUS`.
	 */
	type Issue<T> = { readonly valeur: T } | { readonly refus: string };

	/** Ce que l'analyse d'un lot rend : le lot classé, et l'état de la cible. */
	interface AnalyseDuLot {
		readonly lot: LotDImport;
		/**
		 * LES DOSSIERS QUE LA CIBLE PORTE DÉJÀ, en chemins relatifs à elle.
		 *
		 * L'aperçu marquait « dossier créé » sur chaque nœud, sans condition, et
		 * comptait tous les segments dans « dossiers créés ». Sur le rejeu d'un lot
		 * déjà importé, l'écran annonçait donc trois créations que l'import n'allait
		 * pas faire. `UC-M12-04` §3 parle des dossiers « qui seront créés ».
		 */
		readonly dossiersExistants: readonly string[];
	}

	/** Ce que le dépôt règle, et que les deux appels transportent. */
	interface ReglagesDuDepot {
		/**
		 * LE SCÉNARIO RETENU — il ne partait NULLE PART, et c'est ce qui rendait
		 * la promesse dangereuse : un lot choisi « domaine complet » arrivait au
		 * serveur sans rien qui le distingue, et se rangeait dans le domaine
		 * proposé par défaut. Il voyage désormais, et l'action le refuse quand il
		 * n'est pas celui que l'import exécute.
		 */
		readonly scenario: string;
		readonly domaine: string;
		readonly simulation: boolean;
	}

	/**
	 * LE RAPPORT D'UN LOT, TEL QUE L'ÉCRAN LE REND — `RG-M12-04` et `RG-M12-09`.
	 *
	 * Chaque nombre vient du traitement réel : rien n'est déduit ici, et surtout
	 * rien n'est figé (`P-02`). Les noms sont ceux de `RapportDImport`
	 * (`$lib/donnees/import.ts`), à la mise en forme près.
	 */
	interface RapportAffiche {
		readonly simulation: boolean;
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
		/** Le domaine où le lot a atterri — la section « Structure créée » le nomme. */
		readonly domaine: string;
		/** `RG-M12-04` — chaque fichier en échec, avec sa cause en clair. */
		readonly enEchec: readonly { readonly chemin: string; readonly motif: string }[];
		/** `RG-M12-03` — les renvois qu'aucune note ne résout. */
		readonly renvoisNonResolus: readonly {
			readonly chemin: string;
			readonly renvois: readonly string[];
		}[];
		/** Les notes écrites, créées ou mises à jour, avec leur adresse. */
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

	/**
	 * LE COMPTE RENDU QUAND AUCUNE IDENTITÉ N'EST SERVIE — un état VIDE, jamais
	 * un compte du jeu de démonstration. En application, le contexte de coquille
	 * l'emporte et cette valeur n'atteint aucun écran.
	 */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	/* ═══════════════════════════════════════════════════════════════════════
	   L'ÉTAT DU PARCOURS — local, et seulement quand il y a un parcours

	   `ARB-011` reste vrai de la PLANCHE : sans les deux rappels ci-dessus,
	   aucun de ces états ne bouge, et les sept captures sont exactement celles
	   du vecteur. Ce qui suit ne s'anime que sur une route réelle, où le gel
	   lui-même s'anime — `aller()`, `deposer()`, `lancerImport()` du script de
	   la maquette. La transition n'est pas inventée : elle est transcrite.
	   ═══════════════════════════════════════════════════════════════════════ */

	/** Le parcours est-il vivant ? Il l'est dès qu'une route lui donne prise. */
	const vivant = $derived(analyser !== undefined && importer !== undefined);

	let etapeLocale = $state(1);
	let scenarioLocal = $state<string | null>(null);
	/**
	 * LE LOT TENU PAR LE PARCOURS — vide au départ, SAUF si un écran l'a déjà
	 * reçu et nous le remet (`lotRecu`, le dépôt de la console).
	 *
	 * L'initialisation est faite ici et pas dans un effet : un lot remis est
	 * connu au montage, et le repasser par un effet ferait un premier rendu où
	 * l'étape 2 s'annonce vide avant de se corriger.
	 *
	 * LA VALEUR INITIALE DE `lotRecu` EST BIEN CE QU'ON VEUT, et l'avertissement
	 * `state_referenced_locally` ne s'applique donc pas : un lot est REMIS une
	 * fois, à l'ouverture du parcours. Le suivre ensuite écraserait le lot que
	 * l'utilisateur aurait remplacé à l'étape 2 par celui de son arrivée.
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

	const reglage = $derived(vecteur ?? {});

	/** L'étape du parcours — `data-etape` de `div.app`, quatre positions. */
	const etape = $derived(
		vivant
			? etapeLocale
			: reglage['et'] === '2' || reglage['et'] === '3' || reglage['et'] === '4'
				? Number(reglage['et'])
				: 1
	);

	/**
	 * LE SCÉNARIO CHOISI ET LE LOT DÉPOSÉ ne sont pas des réglages de planche :
	 * ils sont POSÉS par le déplacement d'étape, parce qu'on ne peut pas être à
	 * l'étape suivante sans avoir répondu à la précédente — `V-24:3387`. À
	 * l'étape 1, aucun scénario n'est retenu et aucune vignette n'est enfoncée.
	 */
	const scenarioChoisi = $derived<string | null>(
		vivant ? scenarioLocal : etape >= 2 ? SCENARIO_LIVRE : null
	);
	const depose = $derived(vivant ? fichiers.length > 0 : etape >= 3);

	/* ── Le scénario offert ───────────────────────────────────────────────────
	   `SCENARIOS` (`V-24:2871`). Ils appartiennent à la maquette, pas au corpus,
	   et sont transcrits au caractère près. L'illustration est décomposée en
	   segments plutôt que gardée en chaîne de balisage : le gel l'injecte par
	   `innerHTML`, ce qui demanderait ici un `{@html}` que rien n'oblige à
	   employer.

	   LE GEL EN DESSINE TROIS, ET L'IMPORT N'EN EXÉCUTE QU'UN. Les deux autres
	   n'étaient pas seulement inertes : leur choix ne partait nulle part, et le
	   lot atterrissait dans le domaine proposé par défaut — un domaine que
	   l'utilisateur n'avait pas choisi, alors qu'il croyait en créer un. Ce qui
	   est offert ici est donc ce que `scenarioEstLivre()` reconnaît, et rien de
	   plus ; ce qui manque aux deux autres est nommé, exigence par exigence,
	   dans `$lib/donnees/scenarios-d-import.ts`. */

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

	/* L'ILLUSTRATION NOMMAIT « Infrastructure », UN DOMAINE DU JEU DE
	   DÉMONSTRATION. Sur une instance neuve, la vignette montrait donc un
	   domaine qui n'existe pas et que rien ne pose : elle nomme désormais le
	   domaine RÉELLEMENT proposé pour la destination. */
	const SCENARIOS: readonly Scenario[] = $derived([
		{
			id: SCENARIO_LIVRE,
			nom: 'Importer des notes dans un domaine existant',
			txt: "Vos fichiers rejoignent un domaine déjà en place. L'arborescence des dossiers de votre disque devient l'arborescence des dossiers du domaine, à l'identique.",
			illus: [
				{
					gras: false,
					texte: `Exploitation/\n  Sauvegardes/\n    Restauration.docx\n\n→ ${domaineParDefaut}\n   └ `
				},
				{ gras: true, texte: 'Exploitation' },
				{ gras: false, texte: '\n      └ ' },
				{ gras: true, texte: 'Sauvegardes' },
				{ gras: false, texte: '\n         └ Restauration' }
			]
		}
	]);

	/**
	 * CE QUI EST OFFERT — le filtre est ici, et il est PORTÉ PAR LA SOURCE.
	 *
	 * Écrire une liste d'une entrée aurait tenu, et se serait périmée en
	 * silence le jour où un lot livrerait `UC-M12-02` : le filtre lit le module
	 * qui déclare ce que l'import fait, de sorte qu'y ajouter un scénario livré
	 * suffit à le rendre offert.
	 */
	const SCENARIOS_OFFERTS = $derived(SCENARIOS.filter((s) => scenarioEstLivre(s.id)));

	const scenarioCourant = $derived(SCENARIOS_OFFERTS.find((s) => s.id === scenarioChoisi) ?? null);

	/* ── Étape 2 — le dépôt ───────────────────────────────────────────────────
	   `rendreDepot()` (`V-24:2918`). Le gel y pose trois réglages, un par
	   scénario, et n'en montre qu'un à la fois. Il n'en reste que deux ici : le
	   champ du nom de domaine est parti avec le scénario qui le portait, et la
	   case de simulation garde la sienne — son scénario n'étant plus offert,
	   elle ne l'est plus non plus. Un seul réglage est donc visible, celui du
	   domaine de destination. La liste des formats admis et les options de
	   domaine ne sont peuplées QUE lorsque l'étape 2 a été traversée : aux
	   étapes 1, 3 et 4 elles restent vides, et le gel le montre. */

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

	/* ── Le lot, et ce qu'on en déduit ────────────────────────────────────────
	   `resumeLot()` (`V-24:2552`) et `arborescenceLot()` (`V-24:2532`). Aucun
	   chiffre n'est saisi : tout est compté sur `LOT_IMPORT` (P-02). */

	const LOT = $derived(lotAnalyse ?? lotImport);

	/**
	 * LES MOTIFS EN CLAIR — les codes du classement, mis en français ICI.
	 *
	 * `$lib/donnees/import.ts` le dit de lui-même : « les motifs sont donc des
	 * codes stables, que la vue mettra en français quand elle en aura la prise.
	 * Le gel de V-24 en porte d'ailleurs les formulations, dans le lot d'exemple
	 * du jeu de semence : elles seront reprises là-bas. » C'est fait, et les
	 * quatre phrases que le lot d'exemple écrit sont reprises au caractère près.
	 *
	 * UNE VALEUR INCONNUE PASSE TELLE QUELLE, et ce n'est pas une négligence :
	 * le lot d'exemple du jeu de semence porte déjà des PHRASES dans ce champ, et
	 * elles doivent traverser sans être traduites deux fois.
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
	 * LES FRAGMENTS DE PHRASE DU GEL QUI ENTOURENT UN SEGMENT GRAS.
	 *
	 * Ils sont nommés plutôt qu'écrits au balisage pour une raison de rendu, et
	 * elle est mesurée : Svelte ÉLAGUE les blancs en bord d'élément (`CLAUDE.md`
	 * §6, P-8), et « reçus depuis » perdrait ses espaces encadrants — le texte
	 * rendu serait « 30 fichiersreçus depuisExploitation ». Portés dans une
	 * expression, les blancs survivent. Les phrases sont celles de
	 * `rendreRapport()` et de `deposer()`, au caractère près.
	 */
	const PHRASES = {
		recusDepuis: ' reçus depuis ',
		bilanAvecErreurs: "L'import est allé jusqu'au bout : ",
		bilanSansErreur: 'Tous les fichiers retenus ont été convertis. ',
		ecartesALApercu: ' avaient été écartés à l\u2019aperçu, comme annoncé.'
	};

	function motifEnClair(motif: string | undefined): string {
		if (motif === undefined) return '';
		return LIBELLE_DU_MOTIF[motif] ?? motif;
	}

	/**
	 * LES REFUS, MIS EN FRANÇAIS — même régime que les motifs.
	 *
	 * QUATRE CODES VIENNENT DE LA ROUTE, LE CINQUIÈME NON. Cible inconnue, cible
	 * interdite, lot vide, scénario non livré : ce sont les quatre seuls motifs
	 * que les actions rendent, chacun avant la moindre écriture. Les trois
	 * premiers n'étaient pas visibles — le
	 * parcours restait où il était, sans un mot. `erreur-serveur` est le repli de
	 * l'écran lui-même, posé quand la réponse ne porte aucun motif lisible : il
	 * ne sait donc PAS ce que le serveur a fait du lot, et sa phrase se garde de
	 * l'affirmer. Un code inconnu passe tel quel plutôt que d'être remplacé par
	 * une phrase rassurante qui cacherait ce qui s'est passé.
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
	 * LE TITRE DU BILAN — la phrase du gel, et la MISE À JOUR y prend sa place.
	 *
	 * Le gel écrit « N notes créées, M fichiers en échec » ou « … aucun échec ».
	 * `RG-M12-01` fait apparaître un troisième nombre que le gel ne connaissait
	 * pas — les notes MISES À JOUR par un réimport —, et le taire ferait croire
	 * qu'un réimport n'a rien fait. Il n'est nommé que lorsqu'il n'est pas nul.
	 */
	/**
	 * L'INTITULÉ DE LA DERNIÈRE SECTION — « Notes créées » du gel, sauf quand ce
	 * n'est pas vrai.
	 *
	 * Le gel ne connaît pas la mise à jour : son lot d'exemple ne crée que des
	 * notes neuves. Un réimport, lui, n'en crée aucune et en met à jour trois —
	 * garder « Notes créées — 0 » au-dessus d'une liste de trois notes serait
	 * faux à l'écran. L'intitulé nomme alors ce que la liste contient.
	 */
	function intituleDesNotes(r: RapportAffiche): string {
		if (r.simulation) return `Notes qui seraient écrites — ${r.ecrites.length}`;
		if (r.notesMisesAJour === 0) return `Notes créées — ${r.notesCreees}`;
		return `Notes écrites — ${r.ecrites.length}`;
	}

	/**
	 * UNE SIMULATION N'A RIEN ÉCRIT, ET AUCUNE PHRASE DU RAPPORT NE DOIT DIRE LE
	 * CONTRAIRE.
	 *
	 * `RG-M12-02` promet « un seul chemin de code, donc un rapport de simulation
	 * qui dit rigoureusement ce que fera l'import réel ». Le rapport le tient : le
	 * drapeau `simulation` est le SEUL champ par lequel les deux diffèrent —
	 * `import.test.ts` le neutralise explicitement avant de comparer les deux
	 * rapports. L'écran, lui, ne le lisait nulle part : il annonçait « Import
	 * terminé — 3 notes créées » et offrait trois liens qui rendaient 404, alors
	 * que la base était inchangée.
	 *
	 * LA DOCTRINE DE `import.ts` N'EST PAS EN CAUSE : elle porte sur l'EXÉCUTION,
	 * où `options.simulation` est lu une seule fois, en dernière instruction de la
	 * transaction. Un choix de mot dans une vue ne touche ni le plan, ni
	 * l'écriture, ni le rapport.
	 */
	function auFuturSiSimule(r: RapportAffiche, passe: string, futur: string): string {
		return r.simulation ? futur : passe;
	}

	function titreDuBilan(r: RapportAffiche): string {
		const creees = auFuturSiSimule(r, 'créées', 'seraient créées');
		const majs = auFuturSiSimule(r, 'mises à jour', 'seraient mises à jour');
		const debut =
			r.notesMisesAJour > 0
				? `${r.notesCreees} notes ${creees}, ${r.notesMisesAJour} ${majs}`
				: `${r.notesCreees} notes ${creees}`;
		return r.echecs > 0 ? `${debut}, ${r.echecs} fichiers en échec` : `${debut}, aucun échec`;
	}

	/**
	 * Le sort d'un fichier décide de sa colonne : note, écarté, en échec.
	 *
	 * ET LA COLONNE DES NOTES SE PARTAGE EN DEUX — `maj` dit que la cible porte
	 * déjà cette note, à cette place, donc que l'écriture sera une MISE À JOUR.
	 * Sans lui, l'aperçu annonçait « 4 notes seront créées » là où l'import
	 * n'allait en créer aucune. Le champ est absent du jeu de semence, qui n'a pas
	 * de cible : le compte des mises à jour y reste nul, et l'écran ne bouge pas.
	 */
	const resume = $derived.by(() => {
		let notes = 0;
		let misesAJour = 0;
		let ignores = 0;
		let echecs = 0;
		/* Une table ORDONNÉE, tenue en liste : le gel trie les formats par effectif
		   décroissant sur un tri stable, donc l'ordre de première rencontre
		   départage les ex æquo. */
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
		/**
		 * LE CHEMIN DU NŒUD SOUS LA CIBLE — ce qui permet de dire s'il existe
		 * déjà. Le nom seul ne suffisait pas : deux branches peuvent porter un
		 * dossier de même nom à des places différentes.
		 */
		readonly chemin: string;
		readonly enfants: NoeudDuLot[];
		readonly fichiers: { nom: string; format: FormatDImport }[];
	}

	/** Le nœud d'un niveau, créé à la première rencontre. */
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
	 * UN DOSSIER QUE LA CIBLE PORTE DÉJÀ N'EST PAS UN DOSSIER CRÉÉ.
	 *
	 * Vide — le régime de la planche, où aucune cible n'est connue —, tout est
	 * neuf, et c'est ce que le gel montre.
	 */
	function dossierExistant(chemin: string): boolean {
		return dossiersExistants.includes(chemin);
	}

	/**
	 * L'arborescence détectée dans le lot, telle qu'elle deviendra celle des
	 * dossiers. Seuls les fichiers retenus comptent — un fichier écarté ne crée
	 * pas de dossier.
	 */
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

	/**
	 * Les dossiers que l'import CRÉERA, tous niveaux confondus — ceux que la
	 * cible ne porte pas encore.
	 */
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

	/** Les formats du récapitulatif, du plus fourni au moins fourni. */
	const parFormat = $derived(
		[...resume.formats]
			.sort((a, b) => b[1] - a[1])
			.map(([f, n]) => [n, formatsImport[f] ?? f] as const)
	);

	/** La structure annoncée. Le scénario « notes » ne crée aucun domaine. */
	const creations = $derived([[nombreDeDossiers, 'dossiers créés'] as const]);

	const ecartes = $derived(LOT.fichiers.filter((f) => f.s === 'ignore'));

	/* ── Étape 4 — l'instant capturé ──────────────────────────────────────────
	   `lancerImport()` (`V-24:3100`). Voir l'en-tête : sept tics de 130 ms
	   tiennent dans l'avance de 1 000 ms du banc, et c'est le seul nombre
	   déclaré ici. */

	/** Rang de l'instant capturé, en fichiers traités. */
	const TRAITES = 7;

	const progression = $derived.by(() => {
		/* SUR UNE ROUTE RÉELLE, LE TRAITEMENT EST AU SERVEUR ET NE SE RACONTE PAS
		   FICHIER PAR FICHIER. Le gel anime une minuterie locale ; le produit, lui,
		   attend une réponse. Poser une barre qui progresserait toute seule serait
		   une valeur illustrative (`P-02`) : la barre reste donc à zéro et les
		   compteurs à zéro tant que rien n'est connu, puis le rapport les remplace.
		   L'invite est celle du balisage gelé, « Préparation… ». */
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

	/* ── Le fil de jalons et le pied de parcours ──────────────────────────────
	   `aller()` (`V-24:3331`) et `majPied()` (`V-24:3349`). */

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
	/** Le rapport à l'écran est-il celui d'une simulation ? */
	const rapportSimule = $derived(rapport !== null && rapport.simulation);
	/** L'étape 4 close sur un rapport de SIMULATION : rien n'a été écrit. */
	const simulationTerminee = $derived(termine && rapportSimule);
	/** Le retour en arrière reste possible jusqu'à la validation, pas au-delà. */
	const precedentMasque = $derived(etape === 1 || etape === 4);
	/**
	 * « OUVRIR LE DOMAINE » N'EST OFFERT QUE SI QUELQUE CHOSE Y A ÉTÉ ÉCRIT.
	 * Après une simulation, le domaine ne porte aucune des notes annoncées :
	 * proposer d'y aller serait promettre ce qui n'existe pas (`P-03`).
	 *
	 * CE QUE CELA LAISSE, ET QUI N'EST PAS COMBLÉ ICI : le pied n'a que trois
	 * boutons, et les trois sont alors retirés — « Renoncer » ne vit qu'à
	 * l'étape 3, « Retour » pas au-delà de la validation. L'étape 4 d'une
	 * simulation ne porte donc aucun geste de parcours, et on en sort par la
	 * coquille. Y ajouter une sortie serait un geste que rien ne demande : le
	 * vide est remonté tel quel.
	 */
	const ouvrirLeDomaine = $derived(termine && !simulationTerminee);
	/* L'import lancé, « Continuer » disparaît jusqu'à ce que le rapport soit là ;
	   aucun état de la planche ne l'y voit revenir. */
	const suivantMasque = $derived(etape === 4 && !ouvrirLeDomaine);
	/**
	 * `majPied()` ne retouche l'inhibition qu'aux étapes 1 à 3 : à l'étape 4
	 * elle reste celle du dernier passage, et le gel arrive toujours à l'étape 4
	 * par l'étape 1, où aucun scénario n'était encore retenu. Mesuré sur le gel.
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

	/* ═══════════════════════════════════════════════════════════════════════
	   LES GESTES DU PARCOURS — `aller()`, `deposer()`, `lancerImport()` du gel

	   Aucun n'a d'effet quand la vue est rendue sans ses deux rappels : la
	   planche reste ce qu'elle est, et `vivant` en est le seul juge.
	   ═══════════════════════════════════════════════════════════════════════ */

	/** Le champ de fichiers, caché — voir le balisage. */
	let champDeFichiers: HTMLInputElement | undefined = $state();
	/** La zone de dépôt du gel, qui reçoit le glisser-déposer. */
	let zoneDeDepot: HTMLElement | undefined = $state();

	/**
	 * LE GLISSER-DÉPOSER — les quatre écouteurs du gel, posés APRÈS LE MONTAGE.
	 *
	 * Ils sont posés en script plutôt qu'en attributs parce que `div.depot` n'est
	 * pas un élément interactif : lui attacher des gestionnaires au balisage
	 * ferait rougir le contrôle d'accessibilité pour un nœud que le gel écrit
	 * ainsi. `data-survol` est l'attribut du gel, et la feuille le lit.
	 *
	 * L'ARBORESCENCE D'UN DOSSIER DÉPOSÉ EST CONSERVÉE — c'est la promesse écrite
	 * du scénario, « à l'identique ». Les entrées du transfert sont parcourues en
	 * profondeur ; à défaut d'entrées, les fichiers nus sont pris.
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

	/** Le domaine effectivement visé — celui qu'on a choisi, sinon le proposé. */
	const domaineCible = $derived(domaineRetenu || domaineParDefaut);

	const reglages = $derived({
		scenario: scenarioChoisi ?? SCENARIO_LIVRE,
		domaine: domaineCible,
		simulation: simulationRetenue
	});

	function choisirScenario(id: string): void {
		if (!vivant) return;
		/* Une vignette non offerte n'est pas rendue ; la garde est ici pour que le
		   choix ne puisse pas retenir autre chose que ce que l'import exécute. */
		if (!scenarioEstLivre(id)) return;
		scenarioLocal = id;
	}

	/** La source affichée : le dossier de tête du lot, ou le nombre de fichiers. */
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

	/** Le total du lot, en méga-octets à une décimale — la phrase du gel. */
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
				/* LE REFUS S'AFFICHE — il retournait en silence, et le bouton
				   « Analyser le lot » ne produisait alors rien du tout. */
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

	/**
	 * L'adresse du domaine visé — pour la sortie de l'étape 4. Elle est BÂTIE par
	 * le constructeur unique du dépôt, jamais écrite à la main : `ARB-001` en fait
	 * la seule forme publiée.
	 */
	const adresseDuDomaine = $derived.by(() => {
		const cible = domaines.find((d) => d.nom === domaineCible);
		return cible === undefined ? '/' : adresseDeDomaine(cible.univers, cible.nom);
	});
</script>

<!--
	Les régions serrées reproduisent un DOM que le gel construit en script :
	elles sont soustraites au formateur, qui y réintroduirait des blancs entre
	nœuds — lus par le relevé d'ordre de tabulation du niveau 1
	(`CLAUDE.md` §6, P-6).
-->
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
					« Glissez un dossier OU UNE ARCHIVE ici » au gel. Une archive
					déposée est ÉCARTÉE — le classement range le format `zip` en voie
					`ecarte` —, avec son motif visible à l'aperçu. L'invitation ne la
					nomme donc plus : les formats admis sont ceux du bandeau
					ci-dessous, et eux seuls.
				-->
				<h3>Glissez un dossier ici</h3>
				<p>
					L'arborescence est conservée. Vous pouvez aussi parcourir vos fichiers si vous préférez.
				</p>
				<button class="btn btn--principal" id="parcourir" onclick={parcourir}
					>Parcourir mes fichiers</button
				>
				<!--
					LE CHAMP DE FICHIERS DU GEL N'EXISTE PAS : `#parcourir` y est un
					bouton nu, et le dépôt un comportement de navigateur. Le champ est
					donc posé ici, CACHÉ, et seulement quand le parcours est vivant —
					la planche ne le porte pas. C'est le geste de
					`$lib/cablage/formulaires.ts`, qui pose lui aussi des champs cachés
					sur des formulaires que le gel n'attribue pas.
				-->
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
					`#champ-nom-domaine` DU GEL N'EST PLUS RENDU, et c'est le cœur du
					défaut : « Nom du domaine à créer * » était un champ OBLIGATOIRE
					que personne ne lisait — ni l'envoi, ni l'action —, sous un
					scénario que l'import n'exécute pas. Le laisser demandait une
					saisie pour rien et laissait croire à la création d'un domaine
					pendant que le lot se rangeait ailleurs.
				-->
				<!--
					LA CASE « SIMULATION » APPARTIENT À UN SCÉNARIO QUE L'IMPORT
					N'EXÉCUTE PAS, ET SA GARDE NE BOUGE PAS. Le gel ne l'offre que sous
					« corpus préparé » — `UC-M12-03`, que `SCENARIOS_NON_LIVRES`
					déclare non livré —, et l'aide qu'elle porte recommande justement
					de vérifier un corpus préparé avant de l'engager. La rebrancher sur
					le scénario livré servirait cette recommandation sous le SEUL
					scénario offert : l'écran nommerait de nouveau une fonction que le
					produit ne tient pas, à l'endroit même que ce lot répare. Le
					scénario n'étant plus offert, la case ne l'est pas davantage, et
					rien de ce qu'elle porte n'atteint l'écran.

					CE QUE CE LOT NE TRANCHE PAS : ce qu'il reste à offrir dans ces
					réglages une fois les deux scénarios non livrés retirés. Offrir la
					simulation au scénario livré serait un geste d'interface qu'aucune
					exigence ne demande, et le gel ne le dessine pas.
				-->
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
				<!--
					`deposer()` du gel, transcrit : la coche, la phrase chiffrée, et le
					bouton qui reprend le dépôt. Les deux nombres sont MESURÉS sur les
					fichiers reçus, jamais annoncés (`P-02`).
				-->
				<!-- prettier-ignore -->
				<div class="lot-depose" id="lot-depose" hidden={!depose}
					>{#if depose}<span
						><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--c-frais)"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg
					></span
					><span style="flex:1"
						><b>{`${fichiers.length} fichiers`}</b>{PHRASES.recusDepuis}<b>{sourceDuLot}</b>{` — ${megaOctets} Mo.`}</span
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
			<!--
				`rendreRapport()` du gel remplace ces deux textes quand le rapport
				arrive : le titre devient « Import terminé », le sous-titre s'efface.
			-->
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

			<!--
				LE RAPPORT — `rendreRapport()` du gel, transcrit nœud pour nœud, et
				nourri du traitement RÉEL. Aucun de ses nombres n'est écrit ici :
				`RapportAffiche` les porte tous, et ils viennent de la base.

				Les quatre sections sont celles du gel, dans son ordre : le bilan,
				les fichiers en échec, les références non résolues, la structure
				créée, les notes écrites. La section « Références non résolues » du
				gel porte deux exemples ; ici elle porte les renvois que le lot n'a
				pas résolus, et elle DISPARAÎT quand il n'y en a aucun — une section
				vide affirmerait qu'il y en a.
			-->
			<!--
				`svelte/no-navigation-without-resolve` est levée pour le seul lien de
				note ci-dessous. `resolve()` n'accepte qu'un chemin CONNU à la
				compilation ; l'adresse d'une note importée est bâtie à l'exécution
				par `adresseDeNote()` — le constructeur unique du dépôt, `ARB-001`,
				« seule forme publiée ». La résoudre est impossible, la construire à
				la main serait la faute que la règle vise.
			-->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<!-- prettier-ignore -->
			<div id="rapport" hidden={rapport === null}
				>{#if rapport !== null}<div class="bilan" data-avec-erreurs={rapport.echecs ? 'oui' : 'non'}
					><div class="bilan__ic"
						>{#if rapport.echecs}<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--c-alerte)" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5M12 16.3v.3"/></svg>{:else}<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--c-frais)" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l3 3 5.4-6"/></svg>{/if}</div
					><div style="flex:1"
						><h3>{titreDuBilan(rapport)}</h3
						><p
							>{#if rapport.echecs}{PHRASES.bilanAvecErreurs}<b>{`${rapport.notesCreees + rapport.notesMisesAJour} fichiers sur ${rapport.total}`}</b>{` sont devenus des notes. Les ${rapport.echecs} fichiers en échec sont listés plus bas avec leur cause ; ils n'ont bloqué aucun des autres et peuvent être repris séparément.`}{:else}{PHRASES.bilanSansErreur}<b>{`${rapport.ignores} fichiers`}</b>{PHRASES.ecartesALApercu}{/if}</p
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
						>{`${rapport.dossiersCrees} dossiers ${auFuturSiSimule(rapport, 'créés', 'seraient créés')} dans le domaine ${rapport.domaine}.`}</div
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
							>{`et ${rapport.ecrites.length - 8} autres — la liste complète est dans le domaine.`}</div
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
