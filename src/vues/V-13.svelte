<script lang="ts">
	/**
	 * V-13 — Page d'un dossier.
	 * Route `/univers/{univers}/{domaine}/dossiers/{chemin…}` (`docs/routes.md` §3.3).
	 *
	 * L'adresse prolonge la FORME CANONIQUE de V-11 : le segment `dossiers` lève la
	 * collision avec les segments réservés `notes` et `signets` ; `{chemin…}` est la
	 * suite des identifiants de dossiers, jusqu'à dix niveaux (`RG-STR-04`).
	 *
	 * Coquille de forme abrégée ; le chemin courant du rail est `[domaine, …chemin]`.
	 * `.noeud` n'est pas portée ici — nœud d'arborescence du rail, rendu par la
	 * coquille ; nœud de GRAPHE en V-19 et V-20 (`docs/DESIGN.md` §2.H).
	 *
	 * LES TROIS DROITS EFFECTIFS SONT DES ÉTATS DE PLANCHE, PAS UNE FRONTIÈRE DE
	 * SÉCURITÉ. Aucun chiffre n'est saisi.
	 *
	 * LES QUATRE `dialog.dlg` SONT TRANSCRITS ET FERMÉS. LE CONTENU EST CELUI QUE LE
	 * GEL COMPOSE À L'OUVERTURE, non celui de son HTML statique, que personne ne voit.
	 *
	 * `#dlg-droits` EST TRANSCRIT PLUTÔT QU'EMPRUNTÉ À `V-40.svelte` : monter V-40 en
	 * hôte imposerait d'importer `V-40.css` ici, et les deux feuilles ont 96
	 * sélecteurs de premier niveau identiques — dernier import gagnant, sur une page
	 * qui marche. Transcrire ne coûte que neuf règles de classe, absentes de
	 * `V-13.css`. `docs/DESIGN.md` §2.F range pourtant cette famille parmi les
	 * classes propres à V-40 : la règle est SCIEMMENT écartée, un clic qui ne produit
	 * rien étant un défaut. Le motif est reporté dans `V-13.css`.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-13.css`.
	 */
	import type { Domaine, IdentifiantNote, NomDeDomaine, Note, Univers } from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import { designationsDeCoquille, type CompteAffiche } from '$lib/coquille/identite';
	import { adresseDeNote, adressesParLesNoms, segmentsDeDossier } from '$lib/rangement/adresses';

	/** LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM : la vue
	    ne reçoit que des noms d'affichage et les slugifiait, or l'identifiant ne suit
	    pas les renommages (`RG-M12-11`) — renommer le domaine rendait 404 chaque
	    sous-dossier et chaque lien de liste d'ici. */
	const adresses = adressesParLesNoms(designationsDeCoquille());
	import { accord, pluriel, vocabulaireRendu } from '$lib/vocabulaire';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFichePluriel = $derived(motsDuProduit.fiches);

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu : leur défaut a été
		 * `UNIVERS`, `DOMAINES` et `MOI` de `seeds/corpus.ts`. La route n'en passe aucune
		 * des deux premières — le rail est de forme abrégée et le fil vient de
		 * l'adresse —, et leur état vide est le TABLEAU VIDE.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: CompteAffiche | null;
		/**
		 * LE DOMAINE DE LA PAGE — REQUIS. La maquette fixe `Infrastructure` en tête de
		 * son script (`V-13:1957`), la vue le recopiait en constante, et une adresse d'un
		 * AUTRE domaine rendait l'arborescence d'Infrastructure. Ne remets pas de défaut.
		 */
		domaine: NomDeDomaine;
		/**
		 * L'ancienneté de modification de chaque note. `Partial` et non `Record` total :
		 * un type total réclamerait toutes les clés et interdirait à un chargeur de
		 * passer un état partiel. Une note absente s'affiche « modification inconnue »,
		 * jamais une ancienneté inventée.
		 */
		modifications: Partial<Record<IdentifiantNote, number>>;
		/**
		 * LE RANGEMENT RÉEL DU DOMAINE, quand une route en a lu un. ABSENT, la vue déduit
		 * son arborescence des NOTES, comme le gel (`V-13:1965-1982`). PRÉSENT, il prend
		 * la place de la déduction, et c'est ce que le produit exige : un dossier VIDE
		 * n'apparaît dans aucune note, donc un sous-dossier fraîchement créé restait
		 * invisible de la page qui venait de le créer.
		 */
		rangement?: RangementReel | null;
		/**
		 * L'ORIGINE DU DROIT EFFECTIF — le texte de `.droit__source` (`V-13:1146`),
		 * REQUIS : elle dit d'où le droit vient réellement (`RG-DRO-01`). Le gel fige
		 * « — hérité du domaine Infrastructure », et cette tournure était le repli de la
		 * propriété. LA CHAÎNE VIDE EST L'ÉTAT VIDE : une origine que le produit ne sait
		 * pas nommer laisse la source muette.
		 */
		origineDuDroit: string;
		/** Le refus affiché par `#creer-erreur` (`V-13:1223`), s'il y en a un. */
		erreurDeCreation?: string | null;
		/** Le refus affiché par `#dep-erreur` (`V-13:1252`), s'il y en a un. */
		erreurDeDeplacement?: string | null;
		/**
		 * LES DROITS DU DOSSIER — la matière de `#dlg-droits`. `null` : le dialogue ne
		 * montre aucun droit, ce qui est l'état du gel, dont la liste n'est peuplée qu'à
		 * l'ouverture (`V-40:3344`). LA ROUTE NE LA SERT QU'AU GESTIONNAIRE : elle porte
		 * l'annuaire des comptes de l'instance.
		 */
		droits?: DroitsDuDossier | null;
		/** Le refus affiché par `#droits-erreur`, s'il y en a un. */
		erreurDeDroits?: string | null;
		/**
		 * L'UNIVERS PORTEUR DU DOMAINE, TEL QUE L'ADRESSE LE NOMME — requis. Il était
		 * cherché dans `domaines`, que la route ne passe pas, donc dans la constante du
		 * jeu, avec « Production » pour dernier repli : sur un domaine absent du jeu, tous
		 * les liens de la page rendaient 404. Ne remets pas de repli.
		 */
		universDuDomaine: string;
	}

	/**
	 * Une destination possible du dialogue « Renommer ou déplacer ». `refus` porte le
	 * MOTIF, jamais un booléen : le gel montre les destinations impossibles avec leur
	 * motif, « sans cela, on cherche longtemps un dossier qui n'apparaît nulle part »
	 * (`V-13:1247`).
	 */
	interface DestinationReelle {
		readonly id: string;
		/** Les segments affichés, racine du domaine EXCLUE — vides pour la racine. */
		readonly segments: readonly string[];
		readonly refus: string | null;
	}

	/**
	 * Un compte, tel que le dialogue des droits le nomme. LES FORMES SONT DÉCLARÉES
	 * ICI, NON IMPORTÉES DE `$lib/donnees` : ce module parle au connecteur de base, et
	 * l'importer d'une vue le ferait entrer dans le paquet du navigateur. Le typage
	 * reste structurel. Même geste que `RangementReel`.
	 */
	interface CompteDeDroit {
		readonly identifiant: string;
		readonly nom: string;
		readonly initiales: string;
	}

	interface DroitAffiche extends CompteDeDroit {
		readonly niveau: NiveauDeDroit;
		readonly herite: boolean;
		readonly origine: string;
		/** La ligne de l'appelant — aucun geste ne lui est offert (`P-09`). */
		readonly soiMeme: boolean;
	}

	interface DroitsDuDossier {
		readonly accordes: readonly DroitAffiche[];
		readonly candidats: readonly CompteDeDroit[];
		/** L'appelant voit-il l'annuaire des comptes ? Le rôle `administrateur`, et lui
		    seul. Absent, il vaut `false` : le panneau se dit alors fermé plutôt que
		    d'annoncer un geste que le serveur refusera. */
		readonly annuaire?: boolean;
	}

	interface RangementReel {
		/** Tous les dossiers du domaine, racine comprise (segments vides). */
		readonly destinations: readonly DestinationReelle[];
		readonly dossierId: string;
		readonly parentId: string;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte = null,
		domaine: DOMAINE,
		modifications,
		rangement = null,
		origineDuDroit,
		erreurDeCreation = null,
		erreurDeDeplacement = null,
		droits = null,
		erreurDeDroits = null,
		universDuDomaine
	}: Proprietes = $props();

	const UNIVERS_DU_DOMAINE = $derived(universDuDomaine);

	type NiveauDeDroit = 'gestionnaire' | 'redacteur' | 'lecteur';

	const reglage = $derived(vecteur ?? {});
	/* `dos` porte le chemin AFFICHÉ du dossier, racine du domaine exclue ; la
	   chaîne vide y désigne la racine. Le repli était `Exploitation`, un dossier du
	   jeu de démonstration : la page dépliait une branche qui n'existe pas. */
	const chemin = $derived(segmentsDeDossier(String(reglage['dos'] ?? '')));
	const niveau = $derived<NiveauDeDroit>(
		reglage['dr'] === 'redacteur'
			? 'redacteur'
			: reglage['dr'] === 'lecteur'
				? 'lecteur'
				: 'gestionnaire'
	);

	/** Le nom du droit effectif. Trois états, pas plus — son origine est servie. */
	const DROITS: Record<NiveauDeDroit, string> = {
		lecteur: 'Lecteur',
		redacteur: 'Rédacteur',
		gestionnaire: 'Gestionnaire'
	};
	const droitEffectif = $derived(DROITS[niveau]);

	const sourceDuDroit = $derived(origineDuDroit);

	/**
	 * L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040`. Le gel pose les
	 * actions puis les cache, ici avec la POLARITÉ INVERSE du socle :
	 * `.si-gestionnaire, .si-redacteur { display: none }` puis un `display:
	 * inline-flex` sous `data-droit` (`mockups/V-13-page-dossier.html:941-944`). LA
	 * CLASSE RESTE POSÉE quand le nœud est rendu — c'est elle qui porte le `display`.
	 */
	const gestionnaire = $derived(niveau === 'gestionnaire');
	const redacteur = $derived(niveau === 'gestionnaire' || niveau === 'redacteur');

	/* Arborescence — DEUX SOURCES, UNE SEULE STRUCTURE. Sans `rangement`, l'arbre
	   est déduit du rangement réel des NOTES, comme au gel : un chemin que le
	   corpus ne porte pas ne rend aucun nœud. Avec `rangement`, c'est
	   l'arborescence de la BASE, qui porte aussi les dossiers vides. */
	interface NoeudDeDossier {
		/** L'identifiant de base, `''` quand l'arbre est déduit des notes. */
		readonly id: string;
		/** Le motif qui interdit d'en faire une destination, `null` sinon. */
		readonly refus: string | null;
		readonly enfants: Record<string, NoeudDeDossier>;
	}

	function creuser(
		racines: Record<string, NoeudDeDossier>,
		segments: readonly string[]
	): NoeudDeDossier | null {
		let courant = racines;
		let dernier: NoeudDeDossier | null = null;
		for (const segment of segments) {
			const existant = courant[segment];
			const noeud: NoeudDeDossier = existant ?? { id: '', refus: null, enfants: {} };
			if (!existant) courant[segment] = noeud;
			dernier = noeud;
			courant = noeud.enfants;
		}
		return dernier;
	}

	const arbre = $derived.by<Record<string, NoeudDeDossier>>(() => {
		const racines: Record<string, NoeudDeDossier> = {};
		if (rangement !== null) {
			/* `creuser()` crée les maillons manquants, puis la ligne terminale reçoit
			   son identifiant et son motif de refus. */
			for (const d of rangement.destinations) {
				const noeud = creuser(racines, d.segments);
				if (noeud === null) continue;
				const remplace: NoeudDeDossier = { id: d.id, refus: d.refus, enfants: noeud.enfants };
				const parent = creuser(racines, d.segments.slice(0, -1));
				const cle = d.segments[d.segments.length - 1];
				if (cle === undefined) continue;
				if (parent === null) racines[cle] = remplace;
				else parent.enfants[cle] = remplace;
			}
			return racines;
		}
		for (const n of corpus) {
			if (n.domaine !== DOMAINE || !n.dossier) continue;
			creuser(racines, segmentsDeDossier(n.dossier));
		}
		return racines;
	});

	const racineDuDomaine = $derived<DestinationReelle | null>(
		rangement?.destinations.find((d) => d.segments.length === 0) ?? null
	);

	/**
	 * LE CHEMIN VIDE EST LA RACINE DU DOMAINE, ET NON « rien » : son chemin affiché
	 * est la suite vide, et sans ce cas `noeudDe([])` rendait `null` — la page de la
	 * racine n'annonçait JAMAIS ses sous-dossiers, on en créait un et il disparaissait
	 * de l'écran qui venait de le créer. `arbre` est déjà l'ensemble des enfants de la
	 * racine, dont la destination porte des segments vides.
	 */
	function noeudDe(c: readonly string[]): NoeudDeDossier | null {
		if (c.length === 0) {
			return {
				id: racineDuDomaine?.id ?? '',
				refus: racineDuDomaine?.refus ?? null,
				enfants: arbre
			};
		}
		let niveauCourant = arbre;
		let trouve: NoeudDeDossier | null = null;
		for (const segment of c) {
			const n = niveauCourant[segment];
			if (!n) return null;
			trouve = n;
			niveauCourant = n.enfants;
		}
		return trouve;
	}

	function compterDossiers(a: Record<string, NoeudDeDossier>): number {
		let total = 0;
		for (const n of Object.values(a)) total += 1 + compterDossiers(n.enfants);
		return total;
	}

	function cheminTexte(c: readonly string[]): string {
		return c.join(' › ');
	}

	function notesDirectes(c: readonly string[]): readonly Note[] {
		const cible = cheminTexte(c);
		return corpus.filter((n) => n.domaine === DOMAINE && n.dossier === cible);
	}

	function notesRecursives(c: readonly string[]): readonly Note[] {
		const prefixe = cheminTexte(c);
		return corpus.filter(
			(n) =>
				n.domaine === DOMAINE && (n.dossier === prefixe || n.dossier.startsWith(`${prefixe} ›`))
		);
	}

	function sousDossiers(c: readonly string[]): readonly string[] {
		const n = noeudDe(c);
		return n ? Object.keys(n.enfants) : [];
	}

	function compterSousArbre(c: readonly string[]): number {
		const n = noeudDe(c);
		return n ? compterDossiers(n.enfants) : 0;
	}

	/** LE NOM DU DOSSIER — dernier segment du chemin, et le NOM DU DOMAINE sur la
	    racine (`RG-STR-03`). Le repli sur la chaîne vide laissait le `h1` réduit à son
	    pictogramme et le dialogue des droits sans dossier. */
	const nom = $derived(chemin[chemin.length - 1] ?? DOMAINE);
	/** La racine du domaine est le seul dossier sans parent — RG-STR-03. */
	const surLaRacine = $derived(chemin.length === 0);
	const cheminDuDossier = $derived(surLaRacine ? DOMAINE : cheminTexte(chemin));
	const sous = $derived(sousDossiers(chemin));
	const notesDuDossier = $derived(notesDirectes(chemin));
	const toutes = $derived(notesRecursives(chemin));

	/* ── Notes groupées par type ─────────────────────────────────────────────
	   Une fiche est groupée sous son type structuré : « Fiche Serveur ». */
	function cleDeType(n: Note): string {
		return n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type;
	}

	/**
	 * LE PLURIEL D'UN NOM DE TYPE — ce n'est pas un accord en nombre : il ne reçoit
	 * aucun compte et rend un TITRE de groupe. Sa table énumérait quatre types et
	 * divergeait de `pluriel()` au premier type créé en console. Seule la COMPOSITION
	 * avec le mot renommable lui appartient : le pluriel porte sur le mot de `M14.7`,
	 * jamais sur le type qui le suit.
	 */
	function plurielDeType(t: string): string {
		if (t.startsWith(`${motFiche} `)) return `${motFichePluriel} ${t.slice(motFiche.length + 1)}`;
		return pluriel(t);
	}

	const groupes = $derived.by<readonly [string, readonly Note[]][]>(() => {
		const table: Record<string, Note[]> = {};
		for (const n of notesDuDossier) {
			const cle = cleDeType(n);
			const liste = table[cle];
			if (liste) liste.push(n);
			else table[cle] = [n];
		}
		return Object.entries(table).sort(
			(a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr')
		);
	});

	/* Le témoin de fraîcheur vient de `$lib/fraicheur` et de nulle part ailleurs
	   (ADR-005) : classe, nombre de barres et libellé en sortent tous les trois. */

	function modification(n: Note): string {
		const j = modifications[n.id];
		if (typeof j !== 'number') return 'modification inconnue';
		if (j <= 0) return "modifiée aujourd'hui";
		return j === 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/* Ce que les trois dialogues montrent — aucun chiffre n'est saisi. */

	/**
	 * LE PLAFOND DE `RG-STR-04`, DANS LA NUMÉROTATION D'ÉCRAN DU GEL (`V-13:1958`) :
	 * le gel compte les niveaux à partir du premier dossier SOUS la racine,
	 * `PROFONDEUR_MAX` de `$lib/donnees/rangement` compte la racine — même plafond,
	 * une unité d'écart. CE NOMBRE N'EST PAS L'AUTORITÉ : une vue ne peut importer
	 * `rangement.ts` sans faire entrer le connecteur de base dans le paquet du
	 * navigateur. L'autorité est le serveur, qui refuse.
	 */
	const PROFONDEUR_MAX = 10;

	/** Le niveau qu'aurait le sous-dossier à créer — `V-13:2196`. */
	const niveauDuSousDossier = $derived(chemin.length + 1);

	/** Le décompte de `RG-M03-04` — `V-13:2333`-`2351`. */
	const sousArbreDetruit = $derived(compterSousArbre(chemin));
	const brouillonsDetruits = $derived(toutes.filter((n) => n.brouillon).length);
	const consultationsDetruites = $derived(toutes.reduce((s, n) => s + n.vues, 0));

	/** La note du décompte — `V-13:2354-2360` : elle dit ce que la liste ne dit
	    pas, que les liens entrants vont casser. */
	const noteDuDecompte = $derived(
		toutes.length === 0
			? 'Ce dossier ne contient aucune note.'
			: `Ces notes totalisent ${nb(consultationsDetruites)} ${accord(
					consultationsDetruites,
					'consultation'
				)}${
					brouillonsDetruits === 0
						? ''
						: `, dont ${String(brouillonsDetruits)} ${accord(brouillonsDetruits, 'brouillon')}`
				}. Les liens qui pointent vers elles deviendront cassés.`
	);

	interface RameauDeChoix {
		readonly cle: string;
		readonly nom: string;
		readonly id: string;
		readonly refus: string | null;
		readonly enfants: readonly RameauDeChoix[];
	}

	function rameaux(niveauCourant: Record<string, NoeudDeDossier>): readonly RameauDeChoix[] {
		return Object.entries(niveauCourant).map(([cle, n]) => ({
			cle,
			nom: cle,
			id: n.id,
			refus: n.refus,
			enfants: rameaux(n.enfants)
		}));
	}

	const choixDeDestination = $derived(rameaux(arbre));

	/* Les compteurs mènent à la liste, filtrée sur ce dossier : la facette `dossier`
	   de V-12 existe et sa clé est le chemin AFFICHÉ d'une note.
	   LE TOTAL RÉCURSIF N'EST PAS UN FILTRE APPROCHANT : la facette compare un chemin
	   ENTIER, jamais un préfixe, donc le total est émis comme autant de valeurs
	   `dossier` qu'il y a de dossiers dans le sous-arbre. */
	function cheminsDuSousArbre(c: readonly string[]): readonly string[] {
		const dedans: string[] = [cheminTexte(c)];
		for (const enfant of sousDossiers(c)) dedans.push(...cheminsDuSousArbre([...c, enfant]));
		return dedans;
	}

	/**
	 * L'ADRESSE EST COMPOSÉE COUPLE PAR COUPLE, et non par `URLSearchParams` : une
	 * instance mutable de cette classe est refusée dans un composant
	 * (`svelte/prefer-svelte-reactivity`).
	 *
	 * ELLE REND `null` QUAND LA FACETTE NE SAIT PAS DIRE L'ENSEMBLE COMPTÉ — le cas du
	 * DOSSIER RACINE, dont le chemin affiché est VIDE : le chargeur de V-12 écarte
	 * toute valeur vide avant de poser la facette, et l'adresse rendrait TOUT le
	 * domaine là où le compteur annonce les seules notes de la racine.
	 */
	function adresseDesNotesDuDossier(chemins: readonly string[]): string | null {
		if (chemins.length === 0 || chemins.some((chemin) => chemin === '')) return null;
		const couples = chemins.map((chemin) => `dossier=${encodeURIComponent(chemin)}`);
		return `${adresses.notes(UNIVERS_DU_DOMAINE, DOMAINE)}?${couples.join('&')}`;
	}

	const lienDesNotesDirectes = $derived(adresseDesNotesDuDossier([cheminTexte(chemin)]));
	const lienDesNotesTotales = $derived(adresseDesNotesDuDossier(cheminsDuSousArbre(chemin)));

	/* Le dialogue des droits. LES LIBELLÉS SONT CEUX DE `.droit__nom`, EN HAUT DE
	   CETTE PAGE MÊME, et non ceux du gel de V-40 — qui écrit « Lecture / Écriture /
	   Gestion » (`V-40:1207-1209`) : deux jeux de mots pour trois valeurs sur un même
	   écran, c'est un synonyme. */
	const NIVEAUX: readonly { valeur: NiveauDeDroit; libelle: string }[] = [
		{ valeur: 'lecteur', libelle: 'Lecteur' },
		{ valeur: 'redacteur', libelle: 'Rédacteur' },
		{ valeur: 'gestionnaire', libelle: 'Gestionnaire' }
	];

	const cheminComplet = $derived(cheminTexte([DOMAINE, ...chemin]));

	/* ── « Ajouter un accès », et ce qui l'empêche ───────────────────────────── */

	const candidatsDeDroit = $derived(droits?.candidats ?? []);

	/**
	 * L'ANNUAIRE EST LA PREMIÈRE PORTE, LA LISTE LA SECONDE. Sans annuaire, le
	 * serveur refuse d'accorder quoi que ce soit (`accorderUnDroitDeDossier()` sort en
	 * refus MUET) : offrir le geste serait promettre un `404`.
	 */
	const annuaireOuvert = $derived(droits?.annuaire === true);
	const peutAjouterUnAcces = $derived(annuaireOuvert && candidatsDeDroit.length > 0);

	/** Ce que porte l'option de repli, quand il n'y a personne à nommer. */
	const motifDeLAjoutImpossible = $derived(
		annuaireOuvert ? 'Tous les comptes ont déjà un accès' : 'Aucun compte à proposer'
	);

	/**
	 * L'AIDE NOMME LE GESTE QUI DÉBLOQUE — un état vide qui ne dit pas quoi faire
	 * laisse l'écran sans issue.
	 */
	const aideDeLAjout = $derived(
		annuaireOuvert
			? candidatsDeDroit.length > 0
				? 'Le droit posé ici gouverne ce dossier et tout son sous-arbre.'
				: 'Créez un compte dans Console › Comptes pour en rattacher un de plus.'
			: "Seul un administrateur peut nommer un compte qui n'a encore aucun droit ici. Les niveaux déjà accordés restent modifiables ci-dessus."
	);
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE : ses adresses sont COMPOSÉES par `$lib/rangement/adresses.ts`, la
	fabrique unique du rangement, que la règle ne sait pas suivre. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet temoin(n: Note)}
	<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="dossier-vue"
	fil={['Accueil', UNIVERS_DU_DOMAINE, DOMAINE, ...chemin]}
	courant={[DOMAINE, ...chemin]}
	droits={niveau === 'lecteur' ? 'lecture' : 'ecriture'}
	donnees={{ 'data-droit': niveau }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_VIDE}
	version=""
>
	{#snippet enfants()}
		<header class="tete-dossier">
			<div class="tete-dossier__corps">
				<div class="tete-dossier__sur">
					<span class="droit" id="droit" data-niveau={niveau}>
						<span class="droit__pastille"></span>
						<span id="droit-nom">{droitEffectif}</span>
						<span class="droit__source" id="droit-source">{sourceDuDroit}</span>
					</span>
				</div>
				<h1>
					<svg
						width="22"
						height="22"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
						/></svg
					>
					<span id="titre">{nom}</span>
				</h1>
				<!--
					LES COMPTEURS MÈNENT À CE QU'ILS COMPTENT — ils étaient inertes. La balise
					change, et c'est le seul endroit où cette vue s'écarte du gel : trois `span`
					deviennent des liens, comme `V-11:1953` distingue le cliquable de l'inerte. Un
					lien, non un bouton : la cible est une adresse, elle s'ouvre dans un nouvel
					onglet, se copie, et marche sans script. « sous-dossiers » n'est posé que
					lorsqu'il y en a — sans quoi il mènerait à un bloc masqué.
				-->
				{#snippet compteurDeNotes(combien: number, libelle: string, adresse: string | null)}
					{#if adresse === null}<span><b>{nb(combien)}</b> {libelle}</span>{:else}<a href={adresse}
							><b>{nb(combien)}</b> {libelle}</a
						>{/if}
				{/snippet}
				<div class="compteurs" id="compteurs">
					{#if sous.length}<a href="#bloc-sous"
							><b>{nb(sous.length)}</b> {accord(sous.length, 'sous-dossier')}</a
						>{:else}<span><b>{nb(sous.length)}</b> sous-dossier</span>{/if}<span
						style="color:var(--c-trait-fort)">·</span
					>{@render compteurDeNotes(
						notesDuDossier.length,
						accord(notesDuDossier.length, 'note directe', 'notes directes'),
						lienDesNotesDirectes
					)}{#if toutes.length !== notesDuDossier.length}<span style="color:var(--c-trait-fort)"
							>·</span
						>{@render compteurDeNotes(
							toutes.length,
							accord(
								toutes.length,
								'note au total, sous-dossiers compris',
								'notes au total, sous-dossiers compris'
							),
							lienDesNotesTotales
						)}{/if}
				</div>
			</div>

			<div class="actions-dossier">
				<!-- P-09 · ARB-040 — omises, jamais masquées. `V-13:1157`, `:1161`–`:1164` -->
				{#if redacteur}<button class="btn btn--principal si-redacteur" id="a-note">
						<svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
						>
						Nouvelle note
					</button>{/if}
				<!--
					RENOMMER ET SUPPRIMER SONT OMIS SUR LA RACINE — `P-03`, un geste offert est un
					geste qui marche. `renommerOuDeplacerUnDossier()` et `supprimerUnDossier()`
					refusent tout dossier sans parent, et leur refus est MUET : les deux boutons
					étaient rendus et ne pouvaient rien produire. « Nouveau sous-dossier » et
					« Gérer les droits » marchent sur la racine — c'est même le seul endroit d'où
					le premier dossier d'un domaine se crée.
				-->
				{#if gestionnaire}<button class="btn si-gestionnaire" id="a-sousdossier"
						>Nouveau sous-dossier</button
					>
					{#if !surLaRacine}<button class="btn si-gestionnaire" id="a-renommer"
							>Renommer ou déplacer</button
						>{/if}
					<button class="btn si-gestionnaire" id="a-droits">Gérer les droits</button>
					{#if !surLaRacine}<button class="btn btn--destructif si-gestionnaire" id="a-supprimer"
							>Supprimer</button
						>{/if}{/if}
			</div>
		</header>

		<section class="bloc" id="bloc-sous" hidden={!sous.length}>
			<div class="section-titre">
				<h2>Sous-dossiers</h2>
				<span class="etiq" id="n-sous"
					>{#if sous.length}{sous.length}
						{accord(sous.length, 'sous-dossier')}{/if}</span
				>
			</div>
			<div class="tuiles" id="tuiles">
				{#each sous as s (s)}
					{@const sousChemin = [...chemin, s]}
					{@const nbNotes = notesRecursives(sousChemin).length}
					{@const nbSous = compterSousArbre(sousChemin)}
					<a class="tuile" href={adresses.dossier(UNIVERS_DU_DOMAINE, DOMAINE, sousChemin)}
						><span class="tuile__ic"
							><svg
								width="18"
								height="18"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
								/></svg
							></span
						><span
							><span class="tuile__nom">{s}</span><span class="tuile__n"
								>{nbNotes}
								{accord(nbNotes, 'note')}{nbSous
									? ` · ${nbSous} ${accord(nbSous, 'sous-dossier')}`
									: ''}</span
							></span
						></a
					>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-notes" hidden={!notesDuDossier.length}>
			<div class="section-titre">
				<h2>Notes de ce dossier</h2>
				<span class="etiq" id="n-notes"
					>{#if notesDuDossier.length}{notesDuDossier.length}
						{accord(notesDuDossier.length, 'note')}{/if}</span
				>
			</div>
			<div id="groupes">
				{#each groupes as [type, liste] (type)}
					<section class="groupe">
						<div class="groupe__tete">
							<h3 class="groupe__nom">{liste.length > 1 ? plurielDeType(type) : type}</h3>
							<span class="groupe__n">{liste.length}</span>
						</div>
						{#each liste as n (n.id)}<a class="note-ligne" href={adresseDeNote(n.id)}
								><span class="note-ligne__corps"
									><span class="note-ligne__titre"
										>{n.titre}{#if n.brouillon}<span class="past past--brouillon">Brouillon</span
											>{/if}</span
									><span class="note-ligne__sous"
										><span>{n.auteur}</span><span class="sep">·</span><span>{modification(n)}</span
										></span
									></span
								>{@render temoin(n)}</a
							>{/each}
					</section>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-vide" hidden={sous.length > 0 || notesDuDossier.length > 0}>
			<div class="vide-dossier">
				<h2>Ce dossier est vide</h2>
				<p id="vide-txt">
					Aucune note, aucun sous-dossier. Un dossier vide n'est pas un problème : c'est une place
					préparée pour ce qui va venir.
				</p>
				<div class="vide-dossier__actions">
					<!-- P-09 · ARB-040 — omises, jamais masquées. `V-13:1192`, `:1193` -->
					{#if redacteur}<button class="btn btn--principal si-redacteur" id="v-note"
							>Créer une note ici</button
						>{/if}
					{#if gestionnaire}<button class="btn si-gestionnaire" id="v-sousdossier"
							>Créer un sous-dossier</button
						>{/if}
				</div>
			</div>
		</section>
	{/snippet}
</Coquille>

<!-- LES DIALOGUES DU GEL, HORS `div.app` COMME DANS LA MAQUETTE ET FERMÉS : ils
	suivent `</div></div>` dans le gel (`V-13:1202`), donc la coquille ici. AUCUN
	`name`, AUCUNE `method`, AUCUNE `action` — `ARB-063` : c'est la route qui nomme
	les champs à l'installation. -->

<!-- LES DIALOGUES SONT DES GESTES DE GESTIONNAIRE, ET ILS SUIVENT LEURS BOUTONS
	(`P-09`) : émettre un `dialog` fermé que l'appelant ne peut pas ouvrir laisserait
	`#creer-valider`, `#dep-valider` et `#sup-valider` dans le DOM d'un rédacteur —
	des actions interdites, présentes. -->
{#if gestionnaire}
	<!-- ============================ DIALOGUE 1 — Créer un sous-dossier ============================ -->
	<dialog class="dlg" id="dlg-creer" aria-labelledby="dlg-creer-titre">
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
						><path
							d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
						/><path d="M8 7v4M6 9h4" stroke-width="1.4" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="dlg-creer-titre">Nouveau sous-dossier</h2>
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
				<p class="dlg__texte">
					Il sera créé dans <strong id="creer-parent">{cheminDuDossier}</strong>.
				</p>
				<div
					class="champ"
					id="champ-creer"
					data-etat={erreurDeCreation === null ? undefined : 'erreur'}
				>
					<label class="champ__label" for="creer-nom"
						>Nom du dossier <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="creer-nom"
						placeholder="Restauration"
						autocomplete="off"
					/>
					<span class="champ__aide" id="creer-aide"
						>Un nom court et parlant. Ce dossier sera au niveau {niveauDuSousDossier} sur {PROFONDEUR_MAX}
						— il restera {PROFONDEUR_MAX - niveauDuSousDossier} niveaux disponibles en dessous.</span
					>
					<div class="champ__erreur" id="creer-erreur" hidden={erreurDeCreation === null}>
						{erreurDeCreation ?? ''}
					</div>
				</div>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer>Annuler</button>
				<button class="btn btn--principal" id="creer-valider">Créer le dossier</button>
			</div>
		</div>
	</dialog>

	<!-- ============================ DIALOGUE 2 — Renommer ou déplacer ============================ -->
	<!-- LES DEUX DIALOGUES SUIVENT LEURS BOUTONS, RACINE COMPRISE : `#dep-valider`
		et `#sup-valider` laissés dans le DOM d'une racine seraient deux gestes que le
		module de données refuse par construction. -->
	{#if !surLaRacine}
		<dialog class="dlg dlg--large" id="dlg-deplacer" aria-labelledby="dlg-deplacer-titre">
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M2 8h9M8 4.5L11.5 8 8 11.5M13.5 3v10" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-deplacer-titre">Renommer ou déplacer</h2>
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
					<div class="champ">
						<label class="champ__label" for="dep-nom">Nom</label>
						<input class="saisie" type="text" id="dep-nom" autocomplete="off" value={nom} />
					</div>
					<div class="champ">
						<span class="champ__label">Emplacement</span>
						<span class="champ__aide"
							>Les destinations impossibles sont montrées avec leur motif plutôt que masquées : sans
							cela, on cherche longtemps un dossier qui n'apparaît nulle part.</span
						>
						<div class="arbre-choix" id="arbre-choix">
							<ul>
								<li>
									{@render choix(
										racineDuDomaine?.id ?? '',
										`Racine du domaine ${DOMAINE}`,
										racineDuDomaine?.refus ?? null
									)}
									{@render sousChoix(choixDeDestination)}
								</li>
							</ul>
						</div>
					</div>
					<div class="champ__erreur" id="dep-erreur" hidden={erreurDeDeplacement === null}>
						{erreurDeDeplacement ?? ''}
					</div>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer>Annuler</button>
					<button class="btn btn--principal" id="dep-valider">Enregistrer</button>
				</div>
			</div>
		</dialog>

		<!-- ============================ DIALOGUE 3 — Supprimer ============================ -->
		<dialog class="dlg dlg--destructif" id="dlg-supprimer" aria-labelledby="dlg-supprimer-titre">
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
					<h2 class="dlg__titre" id="dlg-supprimer-titre">Supprimer ce dossier</h2>
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
						<div class="decompte__titre">Cette suppression est définitive</div>
						<ul id="decompte-liste">
							<li><b>1</b>dossier — {cheminTexte(chemin)}</li>
							{#if sousArbreDetruit > 0}<li>
									<b>{sousArbreDetruit}</b>{accord(sousArbreDetruit, 'sous-dossier')}
								</li>{/if}
							{#if toutes.length > 0}<li>
									<b>{toutes.length}</b>{accord(
										toutes.length,
										'note',
										'notes, tous sous-dossiers compris'
									)}
								</li>{/if}
						</ul>
						<div class="decompte__note" id="decompte-note">{noteDuDecompte}</div>
					</div>
					<div class="champ" id="champ-sup">
						<label class="champ__label" for="sup-saisie">
							Pour confirmer, saisissez le nom exact du dossier :
							<span class="confirmation__cible" id="sup-cible">{nom}</span>
						</label>
						<input
							class="saisie"
							type="text"
							id="sup-saisie"
							autocomplete="off"
							spellcheck="false"
							placeholder="Nom du dossier"
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
	{/if}

	<!-- ============================ DIALOGUE 4 — Gérer les droits ============================ -->
	<!--
		TRANSCRIT DE `mockups/V-40-dialogues.html:1184-1224`, et non emprunté à
		`V-40.svelte` — motif à l'en-tête. TROIS ÉCARTS AU GEL, chacun réparant un
		défaut de la maquette :
		 · LE NIVEAU D'UN DROIT PROPRE EST UN SÉLECTEUR, non une pastille inerte — le gel
		   n'offre qu'ajouter et retirer, donc fermer un accès pour le rouvrir. La
		   pastille reste sur les droits HÉRITÉS, qui ne se changent pas ici.
		 · LE PIED NE PORTE PLUS « Enregistrer les droits » : au gel, les deux boutons
		   ferment, et le second promet un enregistrement qu'il ne fait pas.
		 · LA LIGNE DE L'APPELANT N'OFFRE NI RETRAIT NI CHANGEMENT — le serveur refuse
		   qu'un gestionnaire se ferme la porte (`P-09`).
	-->
	<dialog class="dlg dlg--large" id="dlg-droits" aria-labelledby="dlg-droits-titre">
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
						><rect x="3" y="7" width="10" height="6.5" rx="1.3" /><path
							d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
						/></svg
					>
				</span>
				<div style="flex:1;min-width:0">
					<h2 class="dlg__titre" id="dlg-droits-titre">Droits du dossier {nom}</h2>
					<div style="font-size:var(--t-mini);color:var(--c-encre-3);margin-top:2px">
						{cheminComplet}
					</div>
				</div>
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
				<span class="etiq">Droits accordés</span>
				<div class="droits" id="liste-droits">
					{#each droits?.accordes ?? [] as ligne (ligne.identifiant)}
						<div class="dr" data-herite={ligne.herite ? 'oui' : 'non'}>
							<span class="dr__avatar">{ligne.initiales}</span>
							<div style="min-width:0">
								<div class="dr__nom">{ligne.nom}</div>
								{#if ligne.origine !== ''}<div class="dr__origine">
										<svg
											width="10"
											height="10"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2"><path d="M4 2v8a2 2 0 0 0 2 2h6" /></svg
										>{ligne.origine.replace('— ', '')}
									</div>{/if}
							</div>
							{#if ligne.herite || ligne.soiMeme}
								<span class="dr__role"
									>{NIVEAUX.find((n) => n.valeur === ligne.niveau)?.libelle}</span
								>
							{:else}
								<select
									class="selecteur"
									data-compte={ligne.identifiant}
									aria-label="Niveau de droit de {ligne.nom}"
								>
									{#each NIVEAUX as niveauOffert (niveauOffert.valeur)}
										<option
											value={niveauOffert.valeur}
											selected={niveauOffert.valeur === ligne.niveau}>{niveauOffert.libelle}</option
										>
									{/each}
								</select>
							{/if}
							{#if ligne.herite || ligne.soiMeme}
								<span style="width:27px"></span>
							{:else}
								<button
									class="dr__retirer"
									data-compte={ligne.identifiant}
									aria-label="Retirer l'accès de {ligne.nom}"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
									>
								</button>
							{/if}
						</div>
					{:else}
						<!-- L'ÉTAT VIDE SE DIT. Un domaine neuf n'a AUCUN droit explicite —
							l'administrateur tient le sien de `RG-DRO-03`, sans ligne dans la
							table —, et la liste sortait vide sous son étiquette, sans un mot. -->
						<p class="dr__vide">
							Aucun droit explicite sur ce dossier. Tant que personne n'y est nommé, seuls les
							administrateurs le voient.
						</p>
					{/each}
				</div>

				<!--
						« AJOUTER UN ACCÈS » EST TOUJOURS RENDU, et le vide se DIT — le modèle est
						celui de `V-40.svelte` : une option de repli qui NOMME le vide, et
						`disabled`. Le panneau était escamoté quand la liste était vide, et le
						vide a DEUX causes qu'un panneau absent confondait : plus aucun compte à
						nommer, ou pas d'annuaire à consulter. Le chargeur ne sert l'annuaire
						qu'au rôle `administrateur` (`ADR-006`) ; un gestionnaire qui ne l'est pas
						ne pouvait rien accorder, et l'écran ne le disait nulle part.
					-->
				<div class="champ">
					<span class="champ__label">Ajouter un accès</span>
					<div class="dr-ajout">
						<select
							class="selecteur"
							id="droit-qui"
							aria-label="Personne"
							disabled={!peutAjouterUnAcces}
							>{#if peutAjouterUnAcces}{#each candidatsDeDroit as candidat (candidat.identifiant)}<option
										value={candidat.identifiant}>{candidat.nom}</option
									>{/each}{:else}<option value="">{motifDeLAjoutImpossible}</option>{/if}</select
						>
						<select
							class="selecteur"
							id="droit-role"
							aria-label="Niveau de droit sur ce dossier"
							disabled={!peutAjouterUnAcces}
							>{#each NIVEAUX as niveauOffert (niveauOffert.valeur)}<option
									value={niveauOffert.valeur}>{niveauOffert.libelle}</option
								>{/each}</select
						>
						<button class="btn btn--principal" id="droit-ajouter" disabled={!peutAjouterUnAcces}
							>Ajouter</button
						>
					</div>
					<span class="champ__aide">{aideDeLAjout}</span>
				</div>

				<div class="champ__erreur" id="droits-erreur" hidden={erreurDeDroits === null}>
					{erreurDeDroits ?? ''}
				</div>

				<div class="decompte">
					<div class="decompte__titre">Droits explicites et droits hérités</div>
					<div class="decompte__note">
						Les droits en pointillé sont hérités d'un dossier parent ou du domaine. <b
							>Retirer un droit explicite ne retire pas un droit hérité</b
						> : si un compte a l'écriture sur tout le domaine, la lui retirer ici la lui laisse — il faut
						la retirer là où elle a été accordée. Le nom du dossier d'origine est indiqué sous chaque
						droit hérité.
					</div>
				</div>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer>Fermer</button>
			</div>
		</div>
	</dialog>
{/if}

<!-- LE SÉLECTEUR ARBORESCENT DE DESTINATION — `V-13:2252-2306`. La récursion est
	celle du gel : une ligne, puis la liste de ses enfants si elle en a. La racine du
	domaine fait exception, elle porte toujours sa liste, fût-elle vide (`V-13:2303`).
	Le bouton radio est COCHÉ sur le parent actuel et DÉSACTIVÉ sur toute destination
	refusée : « refuser après le clic serait une porte fermée. » -->
{#snippet choix(id: string, libelle: string, refus: string | null)}
	<label class="choix" data-refuse={refus === null ? undefined : 'oui'}>
		<input
			type="radio"
			name="destination"
			value={id}
			disabled={refus !== null}
			checked={refus === null && id !== '' && id === rangement?.parentId}
		/>
		<span class="choix__corps">
			<span class="choix__nom">{libelle}</span>
			{#if refus !== null}<span class="choix__motif">{refus}</span>{/if}
		</span>
	</label>
{/snippet}

{#snippet sousChoix(branches: readonly RameauDeChoix[])}
	<ul>
		{#each branches as branche (branche.cle)}
			<li>
				{@render choix(branche.id, branche.nom, branche.refus)}
				{#if branche.enfants.length}{@render sousChoix(branche.enfants)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}
