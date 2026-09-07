<script lang="ts">
	/**
	 * V-19 — Cartographie et voisinage. Route `/cartographie`, atteinte par
	 * l'entrée de rail « Cartographie ».
	 *
	 * DEUX ÉCRANS, UNE SEULE FEUILLE. Sans `?centre=`, la CARTOGRAPHIE du périmètre ;
	 * avec, le VOISINAGE d'une note à une, deux ou trois profondeurs. Les deux
	 * partagent l'encodage, la légende et le panneau de note — les séparer en deux
	 * fichiers dupliquerait sept cents lignes pour changer un cadre.
	 *
	 * ── LE DESSIN EST UN ARBRE, PLUS UNE SIMULATION DE FORCES ──────────────────
	 * C'est LE changement de fond, et il vient d'une mesure : sur l'univers réel —
	 * cent quarante-huit notes, deux cent quarante-cinq mentions, treize familles —
	 * la simulation rendait une boule. Les contours se recouvraient, les libellés se
	 * chevauchaient, et les traits passaient tous dans le même paquet. Une simulation
	 * cherche un minimum d'énergie ; rien dans ses forces ne l'oblige à être lisible.
	 *
	 * Le squelette est désormais CONSTRUIT (`$lib/graphe/disposition-carte`) :
	 *
	 *   · le PÉRIMÈTRE affiché est un grand disque au centre ;
	 *   · chaque FAMILLE sémantique est une branche, sur un anneau autour de lui ;
	 *   · son secteur angulaire est proportionnel à son nombre de notes ;
	 *   · ses notes tiennent sur des cercles concentriques autour de son PIVOT — sa
	 *     note la plus centrale, dessinée plus grande, à la forme de son type ;
	 *   · « Isolées » — sans famille et sans relation — part en périphérie.
	 *
	 * LES TRAITS DU SQUELETTE DISENT L'APPARTENANCE, PAS UNE RELATION. Ils sont en
	 * pointillés, ils passent SOUS tout le reste, et la légende ne les nomme pas :
	 * ils sont la charpente du dessin, pas une donnée du corpus. Les RELATIONS se
	 * dessinent par-dessus, avec les styles de la légende — trait plein pour
	 * déclarée, tirets pour déduite, pointillés pour affinité.
	 *
	 * ── LA GRAMMAIRE VISUELLE — UN CANAL, UNE INFORMATION ──────────────────────
	 *
	 *   forme                   →  le TYPE du nœud
	 *   couleur                 →  la VIVACITÉ
	 *   taille                  →  le réglage « Taille des nœuds »
	 *   place                   →  la FAMILLE sémantique
	 *   anneau interrompu       →  le POINT DE RUPTURE technique
	 *   trait plein / tirets / pointillés  →  déclarée / déduite / affinité
	 *
	 * LE PIVOT FAIT EXCEPTION SUR LA COULEUR, et c'est la direction artistique : il
	 * porte la teinte SATURÉE de sa famille, avec un halo pâle. Sa vivacité se lit
	 * au survol et dans le panneau. Sans cette exception, une famille n'aurait
	 * aucune couleur propre sur le dessin, et douze contours pastel ne suffisent pas
	 * à distinguer douze branches quand on regarde le centre.
	 *
	 * ── CE QUI EST ÉCRIT, ET CE QUI NE L'EST PAS ───────────────────────────────
	 * Le nom d'une famille et son effectif sont écrits UNE SEULE FOIS, en haut à
	 * gauche de son contour, et rien ne les recouvre jamais : leurs boîtes sont
	 * réservées AVANT tout libellé de nœud. Les libellés de nœud ne s'écrivent que
	 * sur les PIVOTS, sur le nœud survolé, sur le nœud sélectionné et ses voisins, et
	 * sur tout le monde au-delà du seuil de zoom. Deux libellés ne se chevauchent
	 * jamais : celui qui en recouvrirait un autre est tu.
	 *
	 * ── AUCUNE COULEUR, AUCUNE TAILLE ÉCRITE ICI ───────────────────────────────
	 * Tout vient de `src/vues/carto-jetons.css` — pour le style — et de
	 * `$lib/graphe/jetons` — pour la géométrie. Les deux fichiers portent les mêmes
	 * nombres, et `jetons.test.ts` échoue s'ils divergent.
	 *
	 * ── CE QUI RESTE VRAI DE L'ÉCRAN D'AVANT ───────────────────────────────────
	 *   · Les notes ISOLÉES sont dessinées. Leur isolement EST l'information.
	 *   · Le dessin est DÉTERMINISTE : même périmètre, même dessin, sans mouvement.
	 *   · AUCUNE DONNÉE PROPRE (`RG-M09-01`) : tout vient du chargeur.
	 *   · Le comportement vit dans `cablage.ts`, voisin de la route.
	 *   · `.noeud` est ICI un nœud de graphe ; le même nom désigne un nœud
	 *     d'ARBORESCENCE dans 33 autres vues, dont le rail de cette page même. Les
	 *     deux règles sont inconciliables et AUCUNE FACTORISATION N'EST PERMISE.
	 *
	 * Le style est dans `src/socle.css`, `src/vues/carto-jetons.css` et `V-19.css`.
	 */
	import type {
		CleDeTypeDeRelation,
		Domaine,
		LibellesDeRelation,
		Note,
		Relation,
		Univers
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import {
		CLE_IDENTITE,
		type CompteAffiche,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		centralites,
		codeCourt,
		contourDeForme,
		degres,
		distancesDepuis,
		estTechnique,
		etendreLeGraphe,
		famillesPresentes,
		pointsArticulation,
		rayonDeNoeud,
		relationsDe,
		sousGraphe,
		titreDe,
		typeDe,
		typesPresents,
		voisinage,
		type Contour,
		type EncodageDeType
	} from '$lib/graphe/cartographie';
	import { HAUTEUR_DETIQUETTE, MARGE_DETIQUETTE } from '$lib/graphe/jetons';
	import {
		DESCENTE_DU_COMPTE,
		RETRAIT_DE_LICONE,
		disposerLaCarte,
		disposerLeVoisinage,
		largeurDeLibelle,
		libelleCourt,
		libelleDuCentre,
		type CarteDisposee,
		type MesuresDeNoeud,
		type NoeudPlace
	} from '$lib/graphe/disposition-carte';
	import { areteMasquee, coucheDeLOrigine, noeudMasque } from '$lib/graphe/filtres';
	import { ETATS_DE_VIVACITE, ORDRE_DES_ETATS, type EtatDeVivacite } from '$lib/fraicheur';
	import {
		DEGRE_MINIMUM_MAXIMAL,
		EXPLORATION_DE_PLANCHE,
		PROFONDEUR_MAXIMALE,
		type EtatDExploration
	} from '../routes/cartographie/etat-dexploration';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { formaterDateHeureFr } from '$lib/dates';
	import type { FamillesSemantiques } from '$lib/graphe/familles';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille. */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		/** L'utilisateur courant. Absente, un compte VIDE — rien n'est inventé. */
		compte?: CompteAffiche | null;
		/** Les relations du corpus, avec leur origine (`P-08`). */
		relations: readonly Relation[];
		typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		relationsTechniques: readonly CleDeTypeDeRelation[];
		/** Le périmètre demandé par l'adresse, sous la forme du sélecteur : `type|nom`. */
		perimetreDemande?: string | undefined;
		/** Les familles sémantiques du périmètre et la date de leur calcul — `RG-M09-06`. */
		familles: FamillesSemantiques;
		/**
		 * LA CENTRALITÉ DE PASSAGE, PAR NŒUD — `CDC M09.5`. EXIGÉE : c'est le
		 * chargeur qui la calcule, sur le graphe du périmètre.
		 */
		centralite: Readonly<Record<string, number>>;
		/** La vivacité de chaque note — le pire de ses deux registres. */
		vivaciteParNote: Readonly<Record<string, EtatDeVivacite>>;
		/** L'état d'exploration d'ouverture, lu dans l'adresse. */
		exploration?: EtatDExploration;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte = null,
		relations,
		typesRelation,
		relationsTechniques,
		perimetreDemande,
		familles,
		centralite,
		vivaciteParNote,
		exploration = EXPLORATION_DE_PLANCHE
	}: Proprietes = $props();

	/** Aucune identité servie : un compte VIDE, jamais celui du jeu de démonstration. */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	const reglage = $derived(vecteur ?? {});
	const cas = $derived(String(reglage['etat'] ?? 'nominal'));

	const PERIMETRE_DE_PLANCHE = 'global|';

	/**
	 * LE PÉRIMÈTRE EFFECTIF — la valeur du sélecteur, découpée. Une valeur sans
	 * barre verticale, ou d'un type inconnu, retombe sur celle de la planche.
	 */
	const perimetre = $derived.by(() => {
		const brut = perimetreDemande ?? PERIMETRE_DE_PLANCHE;
		const barre = brut.indexOf('|');
		const type = barre < 0 ? brut : brut.slice(0, barre);
		const nom = barre < 0 ? '' : brut.slice(barre + 1);
		if ((type === 'univers' || type === 'domaine') && nom !== '') return { type, nom };
		return { type: 'global' };
	});

	/* `gardees` : une note qu'aucune relation ne touche est un fait sur le corpus,
	   pas un nœud à jeter. */
	const grapheComplet = $derived(sousGraphe(corpus, perimetre, relations, 'gardees'));

	/** La famille de chaque note — elle PLACE le nœud, et l'entoure. */
	const familleParNote = $derived(
		new Map<string, string>(
			familles.familles.flatMap((f) => f.membres.map((membre) => [membre, f.nom] as const))
		)
	);

	/* ── LES DEUX MODES ────────────────────────────────────────────────────────
	   Le centre demandé n'ouvre le voisinage que s'il désigne un nœud du périmètre :
	   une adresse qui nomme une note supprimée, ou qu'on n'a pas le droit de lire,
	   retombe sur la cartographie plutôt que sur un écran vide. */

	const centreValide = $derived(
		exploration.centre !== null && grapheComplet.index.has(exploration.centre)
			? exploration.centre
			: null
	);
	const locale = $derived(centreValide !== null);
	const profondeur = $derived(Math.min(PROFONDEUR_MAXIMALE, Math.max(1, exploration.profondeur)));

	/**
	 * LES AFFINITÉS DU CENTRE, DANS LE VOISINAGE. L'écran entier est « autour d'une
	 * note choisie » : y arriver EST la demande. Les traits portent alors leur motif,
	 * et leur nombre est borné par construction au voisinage d'UNE note.
	 */
	const affinitesDuCentre = $derived(
		centreValide === null
			? []
			: (familles.voisinsParNote[centreValide] ?? []).filter((v) => grapheComplet.index.has(v.note))
	);

	/* La boule des relations NE CONTIENT PAS les voisins d'affinité : ils sont
	   proches par le sens, pas par un lien déclaré — c'est tout l'intérêt de les
	   montrer. On les fait entrer comme NŒUDS, jamais comme arêtes. */
	const graphe = $derived(
		centreValide === null
			? grapheComplet
			: etendreLeGraphe(
					voisinage(grapheComplet, centreValide, profondeur),
					grapheComplet,
					affinitesDuCentre.map((v) => v.note)
				)
	);

	const deg = $derived(degres(graphe));
	const ruptures = $derived(pointsArticulation(graphe, relationsTechniques));
	const types = $derived(typesPresents(graphe));

	/**
	 * LA CENTRALITÉ DU VOISINAGE EST RECALCULÉE SUR LE SOUS-GRAPHE : celle du
	 * chargeur mesure des passages dans le corpus entier, et l'employer ici
	 * dessinerait de gros nœuds pour des chemins qui ne sont pas sur l'écran.
	 */
	const centraliteRendue = $derived(
		centreValide === null ? centralite : Object.fromEntries(centralites(graphe))
	);

	const UNIVERS_PROPOSES = $derived(univers.filter((u) => !u.systeme));

	/** L'univers du périmètre courant — celui choisi, ou celui du domaine choisi. */
	const universChoisi = $derived.by(() => {
		if (perimetre.type === 'univers') return perimetre.nom ?? '';
		if (perimetre.type === 'domaine') {
			return domaines.find((d) => d.nom === perimetre.nom)?.univers ?? '';
		}
		return '';
	});

	const domaineChoisi = $derived(perimetre.type === 'domaine' ? (perimetre.nom ?? '') : '');

	const domainesProposes = $derived(
		universChoisi === '' ? domaines : domaines.filter((d) => d.univers === universChoisi)
	);

	/** Ce que le disque du centre porte : le périmètre affiché, et son code court. */
	const nomDuPerimetre = $derived(
		perimetre.type === 'global' ? 'Tout le corpus' : (perimetre.nom ?? '')
	);
	const codeDuPerimetre = $derived(
		perimetre.type === 'global' ? '' : codeCourt(perimetre.nom ?? '')
	);

	/* ── LES MESURES QUE LA DISPOSITION LIT ─────────────────────────────────── */

	const degreDe = (id: string): number => deg.get(id) ?? 0;
	const centraliteDe = (id: string): number => centraliteRendue[id] ?? 0;
	const vivaciteDe = (id: string): EtatDeVivacite | null => vivaciteParNote[id] ?? null;

	/**
	 * L'ÉCHELLE DE TAILLE EST RELATIVE AU PÉRIMÈTRE AFFICHÉ, et sans plafond : une
	 * note à quarante-deux relations ne se dessine pas comme une note à huit.
	 */
	const maximumDeMesure = $derived.by(() => {
		if (exploration.taille === 'uniforme') return 1;
		let max = 0;
		for (const n of graphe.noeuds) {
			const v = exploration.taille === 'connexions' ? degreDe(n.id) : centraliteDe(n.id);
			if (v > max) max = v;
		}
		return max;
	});

	const rayon = (id: string): number =>
		rayonDeNoeud(
			exploration.taille,
			exploration.taille === 'connexions' ? degreDe(id) : centraliteDe(id),
			maximumDeMesure
		);

	const titrePar = $derived(new Map(corpus.map((n) => [n.id as string, n.titre] as const)));

	const mesures = $derived<MesuresDeNoeud>({
		rayon,
		degre: degreDe,
		centralite: centraliteDe,
		titre: (id) => titrePar.get(id) ?? id
	});

	/* ── L'ADJACENCE DU DESSIN — relations ET affinités du centre ─────────────
	   Le voisinage place ses nœuds de proche en proche : un voisin d'affinité, qui
	   n'a aucune relation déclarée vers le centre, doit pourtant avoir un parent,
	   sans quoi il n'a pas de secteur et se pose sur l'origine. */

	/* Des objets plutôt que des `Map` : ces tables se REFONT à chaque changement de
	   graphe, elles ne sont jamais mutées après coup, et `svelte/prefer-svelte-reactivity`
	   n'admet pas une `Map` qu'on remplit — à raison, une `Map` mutée dans un état
	   dérivé ne réveille rien. */
	const adjacenceDuDessin = $derived.by<Record<string, string[]>>(() => {
		const table: Record<string, string[]> = {};
		const relier = (a: string, b: string): void => {
			const deja = (table[a] ??= []);
			if (!deja.includes(b)) deja.push(b);
		};
		for (const r of graphe.aretes) {
			relier(r.de, r.vers);
			relier(r.vers, r.de);
		}
		for (const v of affinitesDuCentre) {
			relier(centreValide ?? '', v.note);
			relier(v.note, centreValide ?? '');
		}
		return table;
	});

	/** La profondeur de chaque nœud du voisinage — affinités comprises. */
	const distances = $derived.by<ReadonlyMap<string, number>>(() => {
		if (centreValide === null) return new Map<string, number>();
		const table: Record<string, number> = Object.fromEntries(distancesDepuis(graphe, centreValide));
		/* Un voisin d'affinité est à UN SAUT du centre par le sens, jamais par une
		   relation : sans lui donner cette profondeur, il resterait hors du dessin. */
		for (const v of affinitesDuCentre) table[v.note] ??= 1;
		return new Map(Object.entries(table));
	});

	/* ── LE DESSIN ─────────────────────────────────────────────────────────────
	   Il se calcule ICI, une fois, et rien au navigateur ne le refait : les places
	   descendent dans le balisage, et `cablage.ts` les relit sur le document. */

	const carte = $derived.by<CarteDisposee>(() =>
		centreValide === null
			? disposerLaCarte(graphe, {
					familleParNoeud: familleParNote,
					ordreDesFamilles: familles.familles.map((f) => f.nom),
					mesures,
					perimetre: { nom: nomDuPerimetre, code: codeDuPerimetre }
				})
			: disposerLeVoisinage(graphe, {
					centre: centreValide,
					familleParNoeud: familleParNote,
					ordreDesFamilles: familles.familles.map((f) => f.nom),
					mesures,
					distances,
					voisinsDe: (id) => adjacenceDuDessin[id] ?? [],
					code: ''
				})
	);

	const ORIGINE: NoeudPlace = {
		id: '',
		x: 0,
		y: 0,
		r: 0,
		pivot: false,
		famille: null,
		teinte: null
	};
	const positionDe = (id: string): NoeudPlace => carte.places.get(id) ?? ORIGINE;

	/**
	 * LA COURBE D'UNE RELATION. Un graphe tracé au segment droit se confond avec le
	 * squelette, qui est droit lui aussi : la courbe est ce qui sépare la relation de
	 * l'appartenance. Le point de contrôle est le milieu, décalé perpendiculairement
	 * d'un huitième de la portée.
	 */
	const COURBURE = 0.1;
	const courbe = (a: NoeudPlace, b: NoeudPlace): string => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const cx = (a.x + b.x) / 2 - dy * COURBURE;
		const cy = (a.y + b.y) / 2 + dx * COURBURE;
		return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
	};

	/**
	 * UN TRAIT NE PORTE SON LIBELLÉ QUE S'IL EST ASSEZ LONG POUR LUI. Sur un
	 * voisinage dense, une douzaine de traits courts empilaient leurs « déduite » au
	 * même endroit, et le tas se lisait « dédudéduite » — mesuré sur l'instance de
	 * recette. Un trait trop court se lit à son style, que la légende nomme.
	 */
	const porteSonLibelle = (a: NoeudPlace, b: NoeudPlace, texte: string): boolean =>
		Math.hypot(b.x - a.x, b.y - a.y) - a.r - b.r > largeurDeLibelle(texte) * 1.3;

	/** Le milieu de la courbe — là où se pose le libellé d'une relation. */
	const milieuDeCourbe = (a: NoeudPlace, b: NoeudPlace): { x: number; y: number } => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		return {
			x: (a.x + b.x) / 2 - (dy * COURBURE) / 2,
			y: (a.y + b.y) / 2 + (dx * COURBURE) / 2
		};
	};

	/* ── LES FILTRES ───────────────────────────────────────────────────────────
	   La vue rend l'état d'OUVERTURE ; `cablage.ts` le fait vivre ensuite, sur les
	   mêmes attributs, avec le MÊME prédicat (`$lib/graphe/filtres`). */

	const codeDuNoeud = (note: Note): string => typeDe(note).code;

	const masqueDeNoeud = (id: string, note: Note): boolean =>
		noeudMasque(
			{ vivacite: vivaciteDe(id), degre: degreDe(id), type: codeDuNoeud(note) },
			exploration
		);

	const masqueParIdentifiant = (id: string): boolean => {
		const note = graphe.index.get(id)?.note;
		return note === undefined ? true : masqueDeNoeud(id, note);
	};

	const coucheDArete = (r: Relation): 'declarees' | 'deduites' =>
		coucheDeLOrigine((r as { origine?: string }).origine);

	const masqueDArete = (r: Relation): boolean =>
		areteMasquee(
			coucheDArete(r),
			!masqueParIdentifiant(r.de) && !masqueParIdentifiant(r.vers),
			exploration
		);

	/* ── LES COMPTES DU PANNEAU D'AFFICHAGE ────────────────────────────────── */

	const comptesDeCouche = $derived.by(() => {
		let declarees = 0;
		let deduites = 0;
		for (const r of graphe.aretes) {
			if (coucheDArete(r) === 'declarees') declarees += 1;
			else deduites += 1;
		}
		return { declarees, deduites };
	});

	const comptesDeVivacite = $derived.by<Record<EtatDeVivacite, number>>(() => {
		const table = Object.fromEntries(ORDRE_DES_ETATS.map((e) => [e, 0])) as Record<
			EtatDeVivacite,
			number
		>;
		for (const n of graphe.noeuds) {
			const etat = vivaciteDe(n.id);
			if (etat === null) continue;
			table[etat] += 1;
		}
		return table;
	});

	/** Les notes du dessin qu'aucune relation ne touche — la mesure de structuration. */
	const isolees = $derived(graphe.noeuds.filter((n) => degreDe(n.id) === 0).length);

	/** Les familles réellement dessinées, et le nombre de notes qu'elles réunissent. */
	const famillesDessinees = $derived(famillesPresentes(graphe, familleParNote));
	const notesEnFamille = $derived(
		graphe.noeuds.filter((n) => {
			const nom = familleParNote.get(n.id);
			return nom !== undefined && famillesDessinees.includes(nom);
		}).length
	);

	/* ── LES ALTERNATIVES TEXTUELLES ───────────────────────────────────────── */

	const libelleDEtat = (id: string): string => {
		const etat = vivaciteDe(id);
		return etat === null ? 'vivacité inconnue' : ETATS_DE_VIVACITE[etat].libelle;
	};

	const libelleDuNoeud = (id: string, note: Note): string =>
		`${note.titre}, ${typeDe(note).nom}, ${libelleDEtat(id)}, ${degreDe(id)} ${accord(degreDe(id), 'connexion')}` +
		(ruptures.has(id) ? ', point de rupture' : '') +
		(degreDe(id) === 0 ? ', aucune relation déclarée' : '');

	const ligneAlternative = (id: string, note: Note): string => {
		const famille = familleParNote.get(id);
		return (
			` — ${typeDe(note).nom}, ${note.domaine}, ${libelleDEtat(id)}, ${degreDe(id)} ${accord(degreDe(id), 'connexion')}` +
			(ruptures.has(id) ? ', point de rupture' : '') +
			(famille === undefined ? ', aucune famille sémantique' : `, famille sémantique ${famille}`) +
			'.'
		);
	};

	/* L'avancement du calcul de disposition : un état figé, jamais une animation. */
	const AVANCEMENT = 77;

	const dateDeCalcul = $derived(
		familles.calculeLe === '' ? null : formaterDateHeureFr(familles.calculeLe)
	);

	/* ── CE QUI MANQUE, ET LE GESTE QUI DÉBLOQUE ───────────────────────────────
	   Le voile ne reste que là où il n'y a RIEN À DESSINER ; ce qui manque
	   par-dessus un dessin peuplé se dit par un bandeau, qui n'empêche pas de
	   regarder. */

	type ManqueBloquant = 'univers' | 'domaine' | 'note';
	type Avis = 'relation' | 'perimetre';

	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const administrateur = $derived(identite?.administrateur ?? false);

	const manque = $derived.by<ManqueBloquant | null>(() => {
		if (UNIVERS_PROPOSES.length === 0) return 'univers';
		if (domaines.length === 0) return 'domaine';
		if (corpus.length === 0) return 'note';
		return null;
	});

	const avis = $derived.by<Avis | null>(() => {
		if (manque !== null || locale) return null;
		if (graphe.aretes.length > 0) return null;
		return relations.length === 0 ? 'relation' : 'perimetre';
	});

	const voileActif = $derived(cas === 'chargement' || manque !== null ? 'oui' : undefined);

	/**
	 * LE FIL PORTE LE PÉRIMÈTRE, et pas seulement le nom de l'écran : le sélecteur
	 * vient de choisir de QUOI on regarde la carte.
	 */
	const filDAriane = $derived.by<string[]>(() => {
		const tete = universChoisi === '' ? ['Accueil'] : ['Accueil', universChoisi];
		return locale ? [...tete, 'Cartographie', 'Voisinage'] : [...tete, 'Cartographie'];
	});

	/** La note au centre, dans le voisinage — la vue la rend, le câblage l'ouvre. */
	const noteDuCentre = $derived(
		centreValide === null ? null : (graphe.index.get(centreValide)?.note ?? null)
	);

	/* ── LES COMPTEURS DU VOISINAGE ────────────────────────────────────────── */

	const compteursDuVoisinage = $derived({
		noeuds: graphe.noeuds.length,
		relations: graphe.aretes.length,
		affinites: affinitesDuCentre.length
	});

	/* ── CE QUI S'EXPLIQUE, ET OÙ ──────────────────────────────────────────── */

	const infoDesFamilles = $derived(
		'Regroupement par proximité de sens — étiquettes, dossier, mots des titres —, ' +
			'indépendant des relations déclarées. Une famille est une branche du dessin : ' +
			'ses notes entourent son pivot, et un contour la cerne.' +
			(familles.sansFamille > 0
				? ` ${familles.sansFamille} ${accord(familles.sansFamille, 'note')} hors famille.`
				: '') +
			(dateDeCalcul === null ? '' : ` Calculé le ${dateDeCalcul}.`)
	);

	const infoDeLaTaille =
		'Connexions : le nombre de relations qui touchent le nœud. ' +
		'Centralité : la part des plus courts chemins du périmètre qui passent par lui — ' +
		'une note peut avoir vingt voisins et ne relier rien à rien.';

	/** Le repère du dessin, tel que la disposition l'a calculé sur son contenu. */
	const boiteDuRepere = $derived(
		`${carte.repere.x.toFixed(1)} ${carte.repere.y.toFixed(1)} ${carte.repere.largeur.toFixed(1)} ${carte.repere.hauteur.toFixed(1)}`
	);

	/** Le regroupement est-il montré ? L'interrupteur commande les deux cases. */
	const regroupementActif = $derived(exploration.contours || exploration.nomsDeFamille);
</script>

<!-- Le contour d'un nœud. LA COULEUR N'EST PAS UN ATTRIBUT DE PRÉSENTATION : elle
     vient de `currentColor`, que la classe d'état pose sur le groupe. -->
{#snippet contour(f: Contour)}{#if f.balise === 'circle'}<circle
			r={f.r}
			class="noeud__forme"
		/>{:else if f.balise === 'rect'}<rect
			x={f.x}
			y={f.y}
			width={f.largeur}
			height={f.hauteur}
			rx={f.rx}
			class="noeud__forme"
		/>{:else if f.balise === 'polygon'}<polygon
			points={f.points}
			class="noeud__forme"
		/>{:else}<path d={f.d} class="noeud__forme" />{/if}{/snippet}

<!-- La miniature de type de la légende : le même contour, en encre neutre — la
     teinte y dirait un état que la légende ne parle pas. -->
{#snippet miniature(t: EncodageDeType)}<svg
		width="20"
		height="20"
		viewBox="-11 -11 22 22"
		class="lg__forme"
		aria-hidden="true">{@render contour(contourDeForme(t, 7.5))}</svg
	>{/snippet}

<!-- Le glyphe d'un état. La couleur ne porte jamais seule l'information. -->
{#snippet glypheDEtat(etat: EtatDeVivacite)}<svg
		class="glyphe {ETATS_DE_VIVACITE[etat].classe}"
		width="12"
		height="12"
		viewBox="0 0 16 16"
		aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="currentColor" /></svg
	>{/snippet}

<!-- La petite icône qui précède un nom de famille — une étoile à quatre branches. -->
{#snippet etoileDeFamille(x: number, y: number, r: number)}<path
		class="famille__icone"
		d="M{x} {y - r}Q{x + r * 0.16} {y - r * 0.16} {x + r} {y}Q{x + r * 0.16} {y + r * 0.16} {x} {y +
			r}Q{x - r * 0.16} {y + r * 0.16} {x - r} {y}Q{x - r * 0.16} {y - r * 0.16} {x} {y - r}Z"
	/>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="carto"
	cibleEvitement="liste-noeuds"
	libelleEvitement="Aller à la liste des nœuds"
	fil={filDAriane}
	donnees={{ 'data-detail': 'ferme', 'data-mode': locale ? 'locale' : 'complete' }}
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
>
	{#snippet enfants()}
		{#if locale}
			<!-- ══════════ Voisinage d'une note ══════════ -->
			<div class="carto-tete carto-tete--voisinage">
				<a class="carto-retour" href={resolve('/cartographie')}
					><svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg
					>Retour à la cartographie</a
				>

				<div class="carto-tete__ligne">
					<span class="carto-tete__glyphe" aria-hidden="true"
						><svg
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><circle cx="12" cy="5" r="2.4" /><circle cx="5" cy="17" r="2.4" /><circle
								cx="19"
								cy="17"
								r="2.4"
							/><path d="M10.4 6.8 6.6 15M13.6 6.8 17.4 15M7.5 17.4h9" /></svg
						></span
					>
					<div class="carto-tete__titre">
						<h1>{'Voisinage de ' + (noteDuCentre?.titre ?? '')}</h1>
						<p>Explorer les relations et les proximités autour de cette note.</p>
					</div>

					<div class="carto-carte carto-carte--profondeur">
						<span class="carto-etiq" id="etiq-profondeur">Profondeur</span>
						<div class="carto-segments" role="group" aria-labelledby="etiq-profondeur">
							{#each [1, 2, 3] as niveau (niveau)}<button
									type="button"
									class="btn-profondeur"
									data-profondeur={niveau}
									aria-pressed={niveau === profondeur}>{niveau}</button
								>{/each}
						</div>
					</div>

					<div class="carto-carte carto-carte--mesures">
						<span class="carto-mesure"
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								aria-hidden="true"
								><circle cx="8" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle
									cx="12"
									cy="12"
									r="2"
								/><path d="M7 5.7 5 10M9 5.7 11 10M6 12h4" /></svg
							>{compteursDuVoisinage.noeuds +
								' ' +
								accord(compteursDuVoisinage.noeuds, 'nœud')}</span
						>
						<span class="carto-mesure"
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								aria-hidden="true"
								><path
									d="M6.5 9.5 9.5 6.5M4 8a2.5 2.5 0 0 1 0-3.5l1-1a2.5 2.5 0 0 1 3.5 3.5M12 8a2.5 2.5 0 0 1 0 3.5l-1 1a2.5 2.5 0 0 1-3.5-3.5"
								/></svg
							>{compteursDuVoisinage.relations +
								' ' +
								accord(compteursDuVoisinage.relations, 'relation')}</span
						>
						<span class="carto-mesure"
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								stroke-dasharray="2 2"
								aria-hidden="true"><circle cx="8" cy="8" r="5.5" /></svg
							>{compteursDuVoisinage.affinites + ' affinités'}</span
						>
					</div>
				</div>
			</div>
		{:else}
			<!-- ══════════ Cartographie ══════════
			     LES RÉGLAGES DU DESSIN NE SONT PAS ICI, et ce n'est pas une question de
			     place : cette barre appartient à la PAGE — où l'on regarde, et comment y
			     revenir. Ce qui règle le DESSIN vit dans le panneau « Affichage », posé
			     sur le canevas qu'il commande. -->
			<div class="carto-tete">
				<div class="carto-tete__ligne">
					<span class="carto-tete__glyphe" aria-hidden="true"
						><svg
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><circle cx="12" cy="5" r="2.4" /><circle cx="5" cy="17" r="2.4" /><circle
								cx="19"
								cy="17"
								r="2.4"
							/><path d="M10.4 6.8 6.6 15M13.6 6.8 17.4 15M7.5 17.4h9" /></svg
						></span
					>
					<div class="carto-tete__titre">
						<h1>Cartographie</h1>
						<p>Explorez les liens et les forces de votre connaissance.</p>
					</div>

					<div class="carto-tete__outils">
						<label class="hors-ecran" for="perimetre-univers">Univers</label>
						<select id="perimetre-univers" class="carto-choix"
							><option value="">Univers : tous</option>{#each UNIVERS_PROPOSES as u (u.nom)}<option
									value={u.nom}
									selected={u.nom === universChoisi}>{'Univers : ' + u.nom}</option
								>{/each}</select
						>

						<label class="hors-ecran" for="perimetre-domaine">Domaine</label>
						<select id="perimetre-domaine" class="carto-choix"
							><option value="">Domaine : tous</option>{#each domainesProposes as d (d.nom)}<option
									value={d.nom}
									selected={d.nom === domaineChoisi}>{'Domaine : ' + d.nom}</option
								>{/each}</select
						>

						<div class="rech-graphe" id="rech-graphe">
							<svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								aria-hidden="true"
								><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
							>
							<input
								type="search"
								id="rech"
								placeholder="Rechercher dans le graphe…"
								autocomplete="off"
								aria-label="Chercher un nœud dans le graphe"
							/>
							<div class="rech-graphe__liste" id="rech-liste" role="listbox"></div>
						</div>

						<button class="carto-btn" id="recentrer" type="button"
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								aria-hidden="true"
								><circle cx="8" cy="8" r="3" /><path
									d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15"
								/></svg
							>Recentrer</button
						>
						<button class="carto-btn" id="effacer-sel" type="button" disabled
							>Effacer la sélection</button
						>

						<div class="carto-segments" role="tablist" aria-label="Mode de cartographie">
							<button role="tab" aria-selected="true" data-vue="complete">Graphe</button>
							<button role="tab" aria-selected="false" data-vue="maitre">Par type</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="carto-scene" data-mode={locale ? 'locale' : 'complete'}>
			<!-- ---------- Le dessin ---------- -->
			<div class="carto-toile" id="zone-graphe">
				<svg
					id="graphe"
					class="graphe"
					data-focus="non"
					data-zoom="loin"
					data-ruptures="oui"
					data-contours={exploration.contours ? 'oui' : 'non'}
					data-noms={exploration.nomsDeFamille ? 'oui' : 'non'}
					data-mode={locale ? 'locale' : 'complete'}
					role="img"
					aria-label="Dessin du périmètre. Une liste équivalente est disponible dans le panneau d’affichage."
					viewBox={boiteDuRepere}
					preserveAspectRatio="xMidYMid meet"
					><defs
						><marker
							id="pointe"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="5"
							markerHeight="5"
							orient="auto-start-reverse"><path class="pointe" d="M0 1L9 5L0 9z" /></marker
						></defs
					><g id="racine" transform="translate(0,0) scale(1)"
						><!-- 1. Les contours de famille, tout au fond. -->
						<g class="calque-contours" aria-hidden="true"
							>{#each carte.familles as f (f.cle)}<path
									class="famille__contour"
									data-teinte={f.teinte}
									d={f.chemin}
								/>{/each}</g
						><!-- 2. Le squelette : l'appartenance, jamais une relation. -->
						<g class="calque-squelette" aria-hidden="true"
							>{#each carte.squelette as trait, rang (rang)}<line
									class="squelette"
									x1={trait.x1.toFixed(1)}
									y1={trait.y1.toFixed(1)}
									x2={trait.x2.toFixed(1)}
									y2={trait.y2.toFixed(1)}
								/>{/each}</g
						><!-- 3. Les relations, par-dessus, avec les styles de la légende. -->
						<g class="calque-relations"
							>{#each graphe.aretes as r, rang (rang)}<path
									class="arete"
									d={courbe(positionDe(r.de), positionDe(r.vers))}
									data-de={r.de}
									data-vers={r.vers}
									data-actif="non"
									data-couche={coucheDArete(r)}
									data-masque={masqueDArete(r) ? 'oui' : 'non'}
									data-technique={estTechnique(r.type, relationsTechniques) ? 'oui' : 'non'}
									marker-end="url(#pointe)"
									><title
										>{`${titreDe(graphe, corpus, r.de)} ${typesRelation[r.type].sortant} ${titreDe(graphe, corpus, r.vers)}`}</title
									></path
								>{/each}</g
						><!-- 4. Les affinités du centre — dans le voisinage seulement. -->
						<g class="calque-affinites" id="affinites"
							>{#if locale}{#each affinitesDuCentre as v (v.note)}<line
										class="affinite"
										data-de={centreValide}
										data-vers={v.note}
										x1={positionDe(centreValide ?? '').x}
										y1={positionDe(centreValide ?? '').y}
										x2={positionDe(v.note).x}
										y2={positionDe(v.note).y}><title>{v.origine + ' ' + v.trait}</title></line
									>{/each}{/if}</g
						><!-- 5. Les libellés des relations — dans le voisinage seulement. -->
						{#if locale}<g class="calque-etiquettes-relation" aria-hidden="true"
								>{#each graphe.aretes as r, rang (rang)}{@const m = milieuDeCourbe(
										positionDe(r.de),
										positionDe(r.vers)
									)}{#if porteSonLibelle(positionDe(r.de), positionDe(r.vers), coucheDArete(r) === 'declarees' ? 'déclarée' : 'déduite')}<text
											class="arete__etiquette"
											data-de={r.de}
											data-vers={r.vers}
											data-masque={masqueDArete(r) ? 'oui' : 'non'}
											x={m.x.toFixed(1)}
											y={m.y.toFixed(1)}
											>{coucheDArete(r) === 'declarees' ? 'déclarée' : 'déduite'}</text
										>{/if}{/each}{#each affinitesDuCentre as v (v.note)}<text
										class="arete__etiquette arete__etiquette--affinite"
										x={((positionDe(centreValide ?? '').x + positionDe(v.note).x) / 2).toFixed(1)}
										y={((positionDe(centreValide ?? '').y + positionDe(v.note).y) / 2).toFixed(1)}
										>affinité</text
									>{/each}</g
							>{/if}<!-- 6. Le disque du centre : le périmètre, ou la note du voisinage. -->
						{#if graphe.noeuds.length > 0}<g
								class="centre"
								transform="translate({carte.centre.x},{carte.centre.y})"
								><title>{carte.centre.libelle}</title><circle
									class="centre__disque"
									r={carte.centre.r}
								/><text class="centre__nom" y={carte.centre.code === '' ? 4 : 0}
									>{libelleDuCentre(carte.centre.libelle, carte.centre.r)}</text
								>{#if carte.centre.code !== ''}<text class="centre__code" y="16"
										>({carte.centre.code})</text
									>{/if}</g
							>{/if}<!-- 7. Les nœuds. -->
						<g class="calque-noeuds"
							>{#each graphe.noeuds as n (n.id)}{@const place = positionDe(n.id)}{@const etat =
									vivaciteDe(n.id)}{#if !(locale && n.id === centreValide)}<g
										class="noeud {etat === null
											? 'noeud--sans-etat'
											: ETATS_DE_VIVACITE[etat].classe}"
										transform="translate({place.x},{place.y})"
										data-id={n.id}
										data-code={codeDuNoeud(n.note)}
										data-fantome={n.fantome ? 'oui' : 'non'}
										data-actif="non"
										data-pivot={place.pivot ? 'oui' : 'non'}
										data-teinte={place.teinte ?? ''}
										data-nomme={carte.etiquettes.has(n.id) ? 'oui' : 'non'}
										data-choisi="non"
										data-masque={masqueDeNoeud(n.id, n.note) ? 'oui' : 'non'}
										data-vivacite={etat ?? ''}
										data-degre={degreDe(n.id)}
										data-isolee={degreDe(n.id) === 0 ? 'oui' : 'non'}
										data-saut={distances.get(n.id) ?? ''}
										tabindex="0"
										role="button"
										aria-label={libelleDuNoeud(n.id, n.note)}
										><title>{libelleDuNoeud(n.id, n.note)}</title>{#if place.pivot}<circle
												class="pivot__halo"
												r={place.r + 7}
											/>{/if}{@render contour(
											contourDeForme(typeDe(n.note), place.pivot ? place.r : rayon(n.id))
										)}{#if ruptures.has(n.id)}<circle
												class="rupture-anneau"
												r={(place.pivot ? place.r : rayon(n.id)) + 5}
											/>{/if}<text
											class="noeud__nom"
											y={carte.etiquettesAuDessus.has(n.id)
												? -place.r - MARGE_DETIQUETTE
												: place.r + MARGE_DETIQUETTE + HAUTEUR_DETIQUETTE * 0.72}
											>{libelleCourt(n.note.titre)}</text
										></g
									>{/if}{/each}</g
						><!-- 8. Les noms de famille, au-dessus de tout : rien ne les recouvre. -->
						<g class="calque-noms" aria-hidden="true"
							>{#each carte.familles as f (f.cle)}<g
									class="famille__tete"
									data-teinte={f.teinte}
									transform="translate({f.tete.x.toFixed(1)},{f.tete.y.toFixed(1)})"
									>{@render etoileDeFamille(
										RETRAIT_DE_LICONE / 2.6,
										-RETRAIT_DE_LICONE / 3.6,
										RETRAIT_DE_LICONE / 3
									)}<text class="famille__nom" x={RETRAIT_DE_LICONE}>{f.nom}</text><text
										class="famille__compte"
										x={RETRAIT_DE_LICONE}
										y={DESCENTE_DU_COMPTE}>{f.effectif + ' ' + accord(f.effectif, 'note')}</text
									></g
								>{/each}</g
						></g
					></svg
				>

				<!-- ---------- Le panneau d'affichage ----------
				     IL EST POSÉ SUR LE CANEVAS QU'IL COMMANDE, et c'est ce qui le distingue
				     du rail : le rail dit où l'on est dans le produit, ce panneau dit ce
				     que le dessin montre.

				     CHAQUE LIGNE EST À LA FOIS UNE LÉGENDE, UN FILTRE ET UN COMPTE. La
				     ligne « ● À vérifier 12 » montre la teinte, la nomme, la dénombre, et
				     l'éteint d'un clic. -->
				{#if !locale}
					<aside class="carto-reglages" id="commandes" aria-label="Affichage du graphe">
						<div class="carto-reglages__tete">
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								aria-hidden="true"
								><circle cx="8" cy="8" r="2.2" /><path
									d="M8 1.4v1.8M8 12.8v1.8M1.4 8h1.8M12.8 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3"
								/></svg
							>
							<span class="carto-reglages__nom">Affichage</span>
							<button
								type="button"
								class="carto-reglages__bascule"
								id="carto-reglages-bascule"
								aria-expanded="true"
								aria-controls="carto-reglages-corps"
								aria-label="Replier le panneau d’affichage"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"><path d="M5 3l5 5-5 5" /></svg
								></button
							>
						</div>

						<div class="carto-reglages__corps" id="carto-reglages-corps">
							<!-- 1. Périmètre — ce que le dessin montre, en toutes lettres.
							     LES DEUX LIGNES SONT DES BOUTONS QUI FONT QUELQUE CHOSE : elles
							     portent le regard sur le sélecteur correspondant. Un rappel
							     inerte du périmètre serait un bouton mort. -->
							<div class="carto-bloc">
								<span class="carto-etiq">Périmètre</span>
								<button type="button" class="lg lg--lien" data-vers="perimetre-univers"
									><span class="lg__nom"
										>Univers : <b>{universChoisi === '' ? 'Tous' : universChoisi}</b></span
									><span class="lg__chevron" aria-hidden="true">›</span></button
								>
								<button type="button" class="lg lg--lien" data-vers="perimetre-domaine"
									><span class="lg__nom"
										>Domaine : <b>{domaineChoisi === '' ? 'Tous' : domaineChoisi}</b></span
									><span class="lg__chevron" aria-hidden="true">›</span></button
								>
							</div>

							<!-- 2. Liens -->
							<div class="carto-bloc">
								<span class="carto-etiq">Liens</span>
								<div id="filtre-couches">
									<label class="lg lg--case"
										><input
											type="checkbox"
											data-couche="declarees"
											checked={exploration.couches.includes('declarees')}
										/><span class="lg__trait lg__trait--declaree" aria-hidden="true"></span><span
											class="lg__nom">Relations déclarées</span
										><span class="lg__n">{comptesDeCouche.declarees}</span></label
									>
									<label class="lg lg--case"
										><input
											type="checkbox"
											data-couche="deduites"
											checked={exploration.couches.includes('deduites')}
										/><span class="lg__trait lg__trait--deduite" aria-hidden="true"></span><span
											class="lg__nom">Relations déduites</span
										><span class="lg__n">{comptesDeCouche.deduites}</span></label
									>
								</div>
							</div>

							<!-- 3. Regroupement -->
							<div class="carto-bloc">
								<span class="carto-etiq"
									>Regroupement<button
										type="button"
										class="apropos"
										title={infoDesFamilles}
										aria-label={infoDesFamilles}>ⓘ</button
									></span
								>
								<div>
									<label class="lg lg--bascule"
										><span class="lg__nom">Familles sémantiques</span><input
											type="checkbox"
											id="c-regroupement"
											checked={regroupementActif}
										/><span class="lg__interrupteur" aria-hidden="true"></span></label
									>
									<p class="lg__sous">
										{carte.familles.length +
											' ' +
											accord(carte.familles.length, 'famille') +
											' · ' +
											notesEnFamille +
											' ' +
											accord(notesEnFamille, 'note')}
									</p>
									<label class="lg lg--case"
										><input type="checkbox" id="c-contours" checked={exploration.contours} /><span
											class="lg__nom">Contours</span
										><span class="lg__n">{carte.familles.length}</span></label
									>
									<label class="lg lg--case"
										><input type="checkbox" id="c-noms" checked={exploration.nomsDeFamille} /><span
											class="lg__nom">Noms</span
										></label
									>
								</div>
							</div>

							<!-- 4. Vivacité -->
							<div class="carto-bloc">
								<span class="carto-etiq">Vivacité</span>
								<div id="filtre-vivacite">
									{#each ORDRE_DES_ETATS as etat (etat)}<label class="lg lg--case"
											><input
												type="checkbox"
												data-vivacite={etat}
												checked={exploration.vivacite.includes(etat)}
											/>{@render glypheDEtat(etat)}<span class="lg__nom"
												>{ETATS_DE_VIVACITE[etat].libelle}</span
											><span class="lg__n">{comptesDeVivacite[etat]}</span></label
										>{/each}
								</div>
							</div>

							<!-- 5. Nœuds -->
							<div class="carto-bloc">
								<span class="carto-etiq">Nœuds</span>
								<div id="filtre-types">
									{#each types as t (t.cle)}<label class="lg lg--case"
											><input
												type="checkbox"
												data-type={t.type.code}
												checked={exploration.types === null ||
													exploration.types.includes(t.type.code)}
											/>{@render miniature(t.type)}<span class="lg__nom">{t.type.nom}</span><span
												class="lg__n">{t.n}</span
											></label
										>{/each}
								</div>
							</div>

							<!-- 6. Taille des nœuds -->
							<div class="carto-bloc">
								<span class="carto-etiq"
									>Taille des nœuds<button
										type="button"
										class="apropos"
										title={infoDeLaTaille}
										aria-label={infoDeLaTaille}>ⓘ</button
									></span
								>
								<div id="filtre-taille">
									{#each [['uniforme', 'Uniforme'], ['connexions', 'Connexions'], ['centralite', 'Centralité']] as choix (choix[0])}<label
											class="lg lg--case"
											><input
												type="radio"
												name="taille"
												data-taille={choix[0]}
												checked={exploration.taille === choix[0]}
											/><span class="lg__nom">{choix[1]}</span></label
										>{/each}
								</div>
							</div>

							<!-- 7. Réduire le bruit -->
							<div class="carto-bloc">
								<span class="carto-etiq">Réduire le bruit</span>
								<div>
									<label class="curseur" for="degre-min"
										>Degré minimum <output id="degre-min-valeur">{exploration.degreMinimum}</output
										></label
									>
									<input
										type="range"
										id="degre-min"
										min="0"
										max={DEGRE_MINIMUM_MAXIMAL}
										step="1"
										value={exploration.degreMinimum}
									/>
									<div class="curseur__bornes" aria-hidden="true">
										<span>0</span><span>{DEGRE_MINIMUM_MAXIMAL}</span>
									</div>
									<label class="lg lg--case"
										><input
											type="checkbox"
											id="c-isolees"
											checked={exploration.masquerIsolees}
										/><span class="lg__nom">Masquer les nœuds isolés</span><span class="lg__n"
											>{isolees}</span
										></label
									>
									<label class="lg lg--case"
										><input type="checkbox" id="c-ruptures" checked /><span class="lg__nom"
											>Points de rupture</span
										><span class="lg__n">{ruptures.size}</span></label
									>
								</div>
								<button class="carto-btn carto-btn--discret" id="reinitialiser" type="button"
									><svg
										width="13"
										height="13"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2v3h-3" /></svg
									>Réinitialiser les filtres</button
								>
							</div>

							<details class="alt-texte" id="liste-noeuds">
								<summary>Liste des nœuds et de leurs relations</summary>
								<ul id="alt-liste">
									{#each graphe.noeuds as n (n.id)}<li>
											<b>{n.note.titre}</b>{ligneAlternative(
												n.id,
												n.note
											)}{#each relationsDe(n.id, relations) as r, rang (rang)}<div class="alt-rel">
													{`${typesRelation[r.type][r.sortant ? 'sortant' : 'entrant']} : ${titreDe(graphe, corpus, r.autre)}`}
												</div>{/each}
										</li>{/each}
								</ul>
							</details>
						</div>
					</aside>
				{:else}
					<button class="carto-btn carto-btn--flottant" id="tout-afficher" type="button"
						>Tout afficher</button
					>
					<div class="carto-pied-gestes">
						<button class="carto-btn" id="centrer" type="button"
							><svg
								width="14"
								height="14"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								aria-hidden="true"
								><circle cx="8" cy="8" r="3" /><path
									d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15"
								/></svg
							>Centrer</button
						>
					</div>
				{/if}

				{#if avis !== null}
					<div class="avis-bandeau">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							style="flex:none"
							aria-hidden="true"
							><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
						>
						<span style="flex:1"
							>{#if avis === 'relation'}Aucune relation n'est déclarée dans ce corpus. Les nœuds
								ci-dessus sont placés par leurs familles sémantiques — ouvrez une {motFicheMinuscule}
								et déclarez-y une relation pour que la carte montre des dépendances.{:else}Aucune
								relation ne touche ce périmètre. Les nœuds ci-dessus sont placés par leurs familles
								sémantiques.{/if}</span
						>
						{#if avis === 'relation'}<button class="carto-btn" id="vers-relations"
								>Déclarer une relation</button
							>{:else}<a class="carto-btn" href={resolve('/cartographie')}>Voir tout le corpus</a
							>{/if}
					</div>
				{/if}

				<div class="carto-outils">
					<button type="button" id="zoom-plus" aria-label="Agrandir" title="Agrandir">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M8 3.5v9M3.5 8h9" /></svg
						>
					</button>
					<button type="button" id="zoom-moins" aria-label="Réduire" title="Réduire">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M3.5 8h9" /></svg
						>
					</button>
					<button
						type="button"
						id="ajuster"
						aria-label="Recentrer sur l'ensemble"
						title="Recentrer sur l'ensemble"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M2 5.5V2.5h3M14 5.5V2.5h-3M2 10.5v3h3M14 10.5v3h-3" /></svg
						>
					</button>
				</div>

				<!-- La légende du dessin — `RG-M09-07`. TROIS CANAUX, ET UNE SEULE FOIS :
				     le type, la relation, la vivacité. Le squelette n'y figure pas — il
				     n'est pas une donnée du corpus mais la charpente du dessin. -->
				<div class="carto-legende" aria-hidden="true">
					<div class="carto-legende__bloc">
						<span class="carto-etiq">Type de nœud</span>
						<div class="carto-legende__items">
							{#each types.slice(0, 4) as t (t.cle)}<span class="lp"
									>{@render miniature(t.type)}<span>{t.type.nom}</span></span
								>{/each}
						</div>
					</div>
					<div class="carto-legende__bloc">
						<span class="carto-etiq">Relation</span>
						<div class="carto-legende__items">
							<span class="lp"
								><span class="lg__trait lg__trait--declaree"></span><span>Déclarée</span></span
							><span class="lp"
								><span class="lg__trait lg__trait--deduite"></span><span>Déduite</span></span
							><span class="lp"
								><span class="lg__trait lg__trait--affinite"></span><span>Affinité</span></span
							>
						</div>
					</div>
					<div class="carto-legende__bloc">
						<span class="carto-etiq">Vivacité</span>
						<div class="carto-legende__items">
							{#each ORDRE_DES_ETATS as etat (etat)}<span class="lp"
									>{@render glypheDEtat(etat)}<span>{ETATS_DE_VIVACITE[etat].libelle}</span></span
								>{/each}
						</div>
					</div>
				</div>

				<div class="voile" id="voile" data-actif={voileActif}>
					<div class="voile__boite" id="voile-boite">
						{#if cas === 'chargement'}<div>
								<h2>Calcul de la disposition</h2>
								<p>
									Les nœuds cherchent leur place. Le calcul se fait une fois : la carte sera ensuite
									stable, et identique à chaque ouverture du même périmètre.
								</p>
								<div class="progression"><i style="width:{AVANCEMENT}%"></i></div>
							</div>{:else if manque === 'univers'}<div>
								<h2>Aucun univers sur cette instance</h2>
								<p>
									La cartographie n'a pas de données propres : elle se nourrit des notes et des
									relations du corpus, et cette instance n'a encore nulle part où les ranger.{administrateur
										? ''
										: ' Demandez à un administrateur d’en créer un.'}
								</p>
								{#if administrateur}
									<div class="voile__actions">
										<a class="carto-btn carto-btn--principal" href={resolve('/console/univers')}
											>Créer un univers</a
										>
									</div>
								{/if}
							</div>{:else if manque === 'domaine'}<div>
								<h2>Aucun domaine lisible</h2>
								<p>
									Les notes se rangent dans un domaine, et aucun ne vous est ouvert dans ce
									périmètre.{administrateur ? '' : ' Demandez à un administrateur d’en ouvrir un.'}
								</p>
								{#if administrateur}
									<div class="voile__actions">
										<a class="carto-btn carto-btn--principal" href={resolve('/console/domaines')}
											>Créer un domaine</a
										>
									</div>
								{/if}
							</div>{:else if manque === 'note'}<div>
								<h2>Aucune note à cartographier</h2>
								<p>
									La carte se dessine sur les notes du corpus. Créez-en une pour commencer, puis
									reliez-la à une autre.
								</p>
								<div class="voile__actions">
									<a
										class="carto-btn carto-btn--principal si-ecriture"
										href={resolve('/notes/nouvelle')}>Créer une note</a
									>
								</div>
							</div>{/if}
					</div>
				</div>
			</div>

			<!-- ---------- Panneau de la note ----------
			     IL N'APPARAÎT QUE LORSQU'UN NŒUD EST CHOISI, sauf dans le voisinage, où la
			     note du centre est choisie d'office : y arriver EST la demande. Son contenu
			     est bâti par `cablage.ts`, à partir de la table que la route descend. -->
			<aside class="detail-col" id="detail" aria-label="Panneau de la note choisie" hidden>
				<div id="detail-corps"></div>
			</aside>
		</div>
	{/snippet}
</Coquille>
