<script lang="ts">
	/**
	 * V-19 — Cartographie. Route `/cartographie`, atteinte par l'entrée de rail
	 * « Outils › Cartographie ».
	 *
	 * CE QUE CET ÉCRAN EST : un EXPLORATEUR DE GRAPHE, pas une illustration du
	 * corpus. Il répond à quatre questions, et elles commandent tout le reste —
	 * qu'est-ce qui structure le corpus, qu'est-ce qui n'est relié à rien, quels
	 * groupes se forment d'eux-mêmes, et où les zones importantes sont-elles
	 * devenues fragiles.
	 *
	 * LA GRAMMAIRE VISUELLE — UN CANAL, UNE INFORMATION. C'est la règle dont tout
	 * découle, et elle a été figée après mesure :
	 *
	 *   forme + code de trois lettres  →  le TYPE du nœud
	 *   couleur + glyphe               →  la VIVACITÉ
	 *   taille                         →  la CENTRALITÉ de passage
	 *   anneau interrompu et fanion    →  le POINT DE RUPTURE technique
	 *   trait plein                    →  la relation DÉCLARÉE
	 *   trait fin                      →  la relation DÉDUITE
	 *   proximité et contour           →  l'AFFINITÉ sémantique
	 *
	 * LA COULEUR PORTAIT LE TYPE, ET C'ÉTAIT LA DÉPENSE À CORRIGER : trois canaux —
	 * forme, code, teinte — disaient la même chose, et il n'en restait aucun pour
	 * l'état. `RG-M18-09` tient toujours des deux côtés — le type reste porté par la
	 * forme ET le code, la vivacité par la couleur ET le glyphe.
	 *
	 * L'AFFINITÉ NE SE DESSINE PAS EN ARÊTES, ET C'EST UNE DÉCISION, PAS UN OUBLI.
	 * Une appartenance commune n'est pas un lien entre deux objets : un trait
	 * partagé qui réunit quinze notes est UN fait, le décomposer en cent cinq
	 * segments l'encode avec cent cinq traits d'encre dont chacun, pris seul,
	 * affirme un rapport que personne n'a déclaré. Mesuré sur le corpus de
	 * démonstration : cent trente-quatre arêtes d'affinité pour vingt-deux
	 * relations déclarées. Elle PLACE les nœuds (`disposer()`) et les ENTOURE
	 * (`contourDeGroupe()`) ; elle ne devient un trait que dans la vue locale,
	 * autour d'un nœud choisi, et étiquetée de son motif.
	 *
	 * LES NOTES ISOLÉES SONT DESSINÉES. Elles étaient retirées, et c'était le
	 * défaut de fond : la seule question à laquelle la carte ne pouvait pas
	 * répondre était celle pour laquelle on l'ouvre.
	 *
	 * DEUX MODES, UNE SEULE FEUILLE. Sans `?centre=`, la vue complète ; avec, le
	 * VOISINAGE d'un nœud à une, deux ou trois profondeurs. Les deux partagent le
	 * dessin, l'encodage et la légende — les séparer en deux fichiers dupliquerait
	 * sept cents lignes pour changer un cadre.
	 *
	 * AUCUNE DONNÉE PROPRE (`RG-M09-01`) : tout vient du chargeur, et rien n'a de
	 * défaut tiré de `seeds/corpus.ts`.
	 *
	 * LE COMPORTEMENT VIT DANS `cablage.ts`, VOISIN DE LA ROUTE : la vue ne porte
	 * aucun gestionnaire, et les filtres ne rechargent jamais la page.
	 *
	 * `.noeud` EST ICI UN NŒUD DE GRAPHE : le même nom de classe désigne un nœud
	 * d'ARBORESCENCE dans 33 autres vues, dont le rail de cette page même. Les deux
	 * règles sont inconciliables et AUCUNE FACTORISATION N'EST PERMISE.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-19.css`.
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
		barycentre,
		centralites,
		contourDeForme,
		contourDeGroupe,
		degres,
		disposer,
		distancesDepuis,
		estTechnique,
		pointsArticulation,
		rayonDeNoeud,
		relationsDe,
		sousGraphe,
		titreDe,
		typeDe,
		typesPresents,
		codeCourt,
		etendreLeGraphe,
		famillesPresentes,
		voisinage,
		type Contour,
		type EncodageDeType,
		type Place
	} from '$lib/graphe/cartographie';
	import { areteMasquee, coucheDeLOrigine, noeudMasque } from '$lib/graphe/filtres';
	import { ETATS_DE_VIVACITE, ORDRE_DES_ETATS, type EtatDeVivacite } from '$lib/fraicheur';
	import {
		DEGRE_MINIMUM_MAXIMAL,
		EXPLORATION_DE_PLANCHE,
		PROFONDEUR_MAXIMALE,
		type EtatDExploration
	} from '../routes/cartographie/etat-dexploration';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { formaterDateHeureFr, formaterDateIso } from '$lib/dates';
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
		 * chargeur qui la calcule, sur le graphe du périmètre. La vue ne la refait
		 * pas ; un défaut vide la ferait taire sans que rien ne le dise.
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

	/* `gardees` : voir l'en-tête. Une note qu'aucune relation ne touche est un fait
	   sur le corpus, pas un nœud à jeter. */
	const grapheComplet = $derived(sousGraphe(corpus, perimetre, relations, 'gardees'));

	/** La famille de chaque note — elle PLACE le nœud, et l'entoure. */
	const familleParNote = $derived(
		new Map<string, string>(
			familles.familles.flatMap((f) => f.membres.map((membre) => [membre, f.nom] as const))
		)
	);

	/* ── LES DEUX MODES ────────────────────────────────────────────────────────
	   Le centre demandé n'ouvre le mode local que s'il désigne un nœud du
	   périmètre : une adresse qui nomme une note supprimée, ou qu'on n'a pas le
	   droit de lire, retombe sur la vue complète plutôt que sur un écran vide. */

	const centreValide = $derived(
		exploration.centre !== null && grapheComplet.index.has(exploration.centre)
			? exploration.centre
			: null
	);
	const locale = $derived(centreValide !== null);
	const profondeur = $derived(Math.min(PROFONDEUR_MAXIMALE, Math.max(1, exploration.profondeur)));

	/**
	 * LES AFFINITÉS DU CENTRE, EN VUE LOCALE — l'exception à la règle, et son seul
	 * lieu. L'écran entier est « autour d'un nœud choisi » : y arriver EST la
	 * demande. Les traits portent alors leur motif — « d'après l'étiquette
	 * installation » dit quelque chose, un pointillé anonyme non — et leur nombre est
	 * borné par construction au voisinage d'UNE note.
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

	/** Les rappels qui empêchent un voisin d'affinité de partir au bord du dessin. */
	const liensSouples = $derived(
		centreValide === null ? [] : affinitesDuCentre.map((v) => [centreValide, v.note] as const)
	);

	const deg = $derived(degres(graphe));
	const ruptures = $derived(pointsArticulation(graphe, relationsTechniques));
	const types = $derived(typesPresents(graphe));
	const distances = $derived(
		centreValide === null ? new Map<string, number>() : distancesDepuis(graphe, centreValide)
	);

	/**
	 * LA CENTRALITÉ DU MODE LOCAL EST RECALCULÉE SUR LE SOUS-GRAPHE, et c'est
	 * nécessaire : celle du chargeur mesure des passages dans le corpus entier, et
	 * l'employer ici dessinerait de gros nœuds pour des chemins qui ne sont pas sur
	 * l'écran. Le coût est celui d'une douzaine de nœuds.
	 */
	const centraliteRendue = $derived(
		centreValide === null ? centralite : Object.fromEntries(centralites(graphe))
	);

	const UNIVERS_PROPOSES = $derived(univers.filter((u) => !u.systeme));

	/**
	 * LES PLACES DES NŒUDS. Le départ de chaque corps est haché sur SON identifiant :
	 * ajouter une note ne déplace plus les autres, et on reconnaît sa carte d'une
	 * visite à l'autre. Les familles tirent au barycentre — c'est là, et nulle part
	 * sur le dessin, que l'affinité agit.
	 */
	const disposition = $derived(disposer(graphe, { familleParNoeud: familleParNote, liensSouples }));
	const places = $derived(disposition.places);

	/**
	 * LA COURBE D'UNE ARÊTE. Un graphe tracé au segment droit se lit comme un schéma
	 * de câblage ; la courbe est ce qui en fait une carte. Le point de contrôle est
	 * le milieu, décalé perpendiculairement d'un huitième de la portée : assez pour
	 * que deux arêtes entre les mêmes régions ne se confondent pas, assez peu pour
	 * qu'aucune ne mente sur ce qu'elle relie.
	 */
	const COURBURE = 0.12;
	const courbe = (a: Place, b: Place): string => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const cx = (a.x + b.x) / 2 - dy * COURBURE;
		const cy = (a.y + b.y) / 2 + dx * COURBURE;
		return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
	};

	const ORIGINE: Place = { x: 0, y: 0 };
	const positionDe = (id: string): Place => places.get(id) ?? ORIGINE;
	const degreDe = (id: string): number => deg.get(id) ?? 0;
	const centraliteDe = (id: string): number => centraliteRendue[id] ?? 0;
	const vivaciteDe = (id: string): EtatDeVivacite | null => vivaciteParNote[id] ?? null;

	/* ── LA TAILLE ─────────────────────────────────────────────────────────────
	   Elle plafonnait à huit connexions : une note à quarante-deux relations était
	   dessinée comme une note à huit, et le seul canal capable de dire « ceci est
	   central » s'éteignait juste avant de devenir utile. L'échelle est désormais
	   relative au périmètre affiché, et sans plafond. */

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

	/* TROIS ÉCHELLES, ET ELLES DISENT LE NIVEAU. Le moyeu du périmètre domine, les
	   moyeux de famille viennent ensuite, les notes en dessous : la hiérarchie se lit
	   avant même qu'on ait lu un mot. */
	/* LE NOM TIENT DANS LE MOYEU, OU IL PASSE DESSOUS. « Substack » tient, « Tout le
	   corpus » non : posé dedans, il sortait du disque des deux côtés. Le seuil est
	   celui du diamètre, en caractères. */
	const NOM_TENANT_DANS_LE_MOYEU = 11;
	const RAYON_DE_MOYEU = 34;
	const RAYON_DE_MOYEU_DE_FAMILLE = 11;

	/* ── LES CONTOURS DE FAMILLE ───────────────────────────────────────────────
	   La forme juste d'une appartenance est un ENSEMBLE, pas un faisceau de
	   segments : le contour dit d'un trait ce que cent cinq arêtes diraient mal, et
	   il ne peut pas être confondu avec une relation déclarée — ce qu'un pointillé,
	   si discret soit-il, ne garantit jamais.

	   ILS SONT D'UNE SEULE TEINTE, ET C'EST VOULU. Les colorer famille par famille
	   ajouterait un sixième code couleur à expliquer (`RG-M09-07`), et la teinte est
	   déjà prise : elle porte la vivacité. Ce qui distingue deux familles voisines
	   est leur NOM, écrit au barycentre. */

	interface ContourDeFamille {
		readonly cle: string;
		readonly nom: string;
		readonly effectif: number;
		readonly rang: number;
		readonly chemin: string;
		/** Où se pose l'en-tête : au-dessus du point le plus haut de l'îlot. */
		readonly tete: Place;
	}

	/** Le nombre de teintes d'îlot — voir `V-19.css`. */
	const TEINTES_DE_FAMILLE = 8;

	const contoursDeFamille = $derived.by<ContourDeFamille[]>(() => {
		if (!exploration.contours) return [];
		const dessines: ContourDeFamille[] = [];
		for (const m of moyeux) {
			const pts = [m.place, ...m.membres.map((id) => positionDe(id))];
			const rayons = [RAYON_DE_MOYEU_DE_FAMILLE, ...m.membres.map((id) => rayon(id))];
			const chemin = contourDeGroupe(pts, rayons);
			if (chemin === null) continue;
			const centre = barycentre(pts);
			if (centre === null) continue;
			/* L'EN-TÊTE SE POSE AU-DESSUS DE L'ÎLOT, comme un titre de carte. Au
			   barycentre, il tombait au milieu des nœuds et se disputait la place
			   avec leurs titres. */
			const haut = Math.min(...pts.map((p, i) => p.y - (rayons[i] ?? 0)));
			dessines.push({
				cle: m.cle,
				nom: m.nom,
				effectif: m.effectif,
				rang: m.rang % TEINTES_DE_FAMILLE,
				chemin,
				tete: { x: centre.x, y: haut - 18 }
			});
		}
		return dessines;
	});

	/* ── LE MOYEU DU PÉRIMÈTRE ET LES MOYEUX DE FAMILLE ────────────────────────
	   LE CENTRE PORTE LE NOM DU PÉRIMÈTRE, ET C'EST UNE INFORMATION. Le rattachement
	   d'une note à son rangement est un FAIT DÉCLARÉ du schéma — toute note est dans
	   un dossier, un domaine, un univers —, pas une similarité calculée. Et c'est un
	   ARBRE : un moyeu et ses rayons coûtent N traits, là où une clique d'affinité en
	   coûterait N². Les deux ne se rangent pas ensemble, et les avoir confondus était
	   une erreur d'arithmétique autant que de nature.

	   LE RAYON N'EST PAS UNE RELATION, ET IL NE PEUT PAS EN AVOIR L'AIR : il est plus
	   fin et plus pâle que la plus faible d'entre elles, il ne porte pas d'étiquette,
	   et la légende le nomme. Il n'entre ni dans les degrés, ni dans la centralité,
	   ni dans les points de rupture — ce sont des mesures du graphe des RELATIONS. */

	/** Ce que le moyeu central nomme : le périmètre affiché, tel qu'il est choisi. */
	const nomDuPerimetre = $derived.by(() => {
		if (perimetre.type === 'univers') return perimetre.nom ?? '';
		if (perimetre.type === 'domaine') return perimetre.nom ?? '';
		return 'Tout le corpus';
	});

	interface MoyeuDeFamille {
		readonly cle: string;
		readonly nom: string;
		readonly origine: string;
		readonly effectif: number;
		readonly rang: number;
		readonly place: Place;
		readonly membres: readonly string[];
	}

	const famillesDessinees = $derived(famillesPresentes(graphe, familleParNote));
	/* LES ANCRAGES VIENNENT DE LA DISPOSITION, jamais d'un second calcul : ils
	   subissent le même cadrage que les nœuds. Recalculés à part, ils tombaient à
	   côté de leur îlot — mesuré au navigateur. */
	const ancresDeFamille = $derived(disposition.ancres);
	const moyeuCentral = $derived(disposition.moyeu);

	const moyeux = $derived.by<MoyeuDeFamille[]>(() => {
		const parNom = new Map(familles.familles.map((f) => [f.nom, f] as const));
		return famillesDessinees.map((nom, rang) => {
			const membres = graphe.noeuds
				.filter((n) => familleParNote.get(n.id) === nom)
				.map((n) => n.id);
			/* LE MOYEU SE POSE AU BARYCENTRE DE SES MEMBRES, et non sur l'ancrage.
			   L'ancrage COMMANDE la disposition ; il n'est pas le milieu de ce
			   qu'elle produit — les nœuds s'en écartent sous la répulsion, et le
			   moyeu posé dessus se retrouvait au bord de son propre îlot. */
			const centre = barycentre(membres.map((id) => positionDe(id)));
			return {
				cle: parNom.get(nom)?.cle ?? nom,
				nom,
				origine: parNom.get(nom)?.origine ?? '',
				effectif: membres.length,
				rang,
				place: centre ?? ancresDeFamille.get(nom) ?? moyeuCentral,
				membres
			};
		});
	});

	/** Les notes qu'aucune famille dessinée ne réunit : elles pendent au moyeu central. */
	const orphelinesDeFamille = $derived(
		graphe.noeuds
			.filter((n) => !ancresDeFamille.has(familleParNote.get(n.id) ?? ''))
			.map((n) => n.id)
	);

	/* ── LES FILTRES ───────────────────────────────────────────────────────────
	   La vue rend l'état d'OUVERTURE ; `cablage.ts` le fait vivre ensuite, sur les
	   mêmes attributs, avec le MÊME prédicat (`$lib/graphe/filtres`). Aucun nœud
	   n'est retiré du document : un nœud masqué garde sa place, et le rallumer ne
	   fait pas sauter la carte. */

	const masqueDeNoeud = (id: string): boolean =>
		noeudMasque({ vivacite: vivaciteDe(id), degre: degreDe(id) }, exploration);

	const coucheDArete = (r: Relation): 'declarees' | 'deduites' =>
		coucheDeLOrigine((r as { origine?: string }).origine);

	const masqueDArete = (r: Relation): boolean =>
		areteMasquee(coucheDArete(r), !masqueDeNoeud(r.de) && !masqueDeNoeud(r.vers), exploration);

	/* ── LES COMPTES DE LA COLONNE DE COMMANDE ─────────────────────────────── */

	const comptesDeCouche = $derived.by(() => {
		let declarees = 0;
		let deduites = 0;
		for (const r of graphe.aretes) {
			if (coucheDArete(r) === 'declarees') declarees += 1;
			else deduites += 1;
		}
		return { declarees, deduites };
	});

	/* Un objet plutôt qu'une `Map` : ce décompte se REFAIT à chaque changement de
	   graphe, il n'est jamais muté après coup, et `svelte/prefer-svelte-reactivity`
	   n'admet pas de `Map` qu'on remplit — à raison, une `Map` mutée dans un état
	   dérivé ne réveille rien. */
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

	/* ── LES ALTERNATIVES TEXTUELLES ───────────────────────────────────────── */

	const nomCourt = (titre: string): string =>
		titre.length > 26 ? `${titre.slice(0, 25)}…` : titre;

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

	/**
	 * AU-DELÀ DE CE NOMBRE DE NŒUDS, LES ÉTIQUETTES SONT TUES PAR DÉFAUT.
	 *
	 * Le repère fait mille sur six cent vingt, marges déduites huit cent seize sur
	 * quatre cent trente-six. L'écart entre deux nœuds décroît comme l'inverse de la
	 * racine du nombre : à quatre-vingts nœuds il tombe sous trente-cinq unités,
	 * quand un titre en occupe une centaine. Mesuré au navigateur sur l'instance de
	 * recette — soixante-dix-sept notes, et pas un titre lisible.
	 *
	 * TOUT EXPLORATEUR DE GRAPHE FAIT AINSI, et pour cette raison : le nom d'un nœud
	 * se lit au survol, à la sélection, ou en grossissant. Ce qui reste écrit en
	 * permanence, ce sont les NOMS DE FAMILLE — ils sont peu nombreux, et ce sont eux
	 * qui permettent de s'orienter.
	 */
	const NOEUDS_AVANT_DE_TAIRE_LES_ETIQUETTES = 36;

	const dense = $derived(graphe.noeuds.length > NOEUDS_AVANT_DE_TAIRE_LES_ETIQUETTES);

	/* L'avancement du calcul de disposition : un état figé, jamais une animation. */
	const AVANCEMENT = 77;

	const dateDeCalcul = $derived(
		familles.calculeLe === '' ? null : formaterDateHeureFr(familles.calculeLe)
	);
	const dateDeCalculMachine = $derived(
		familles.calculeLe === '' ? null : formaterDateIso(familles.calculeLe)
	);

	/* ── CE QUI MANQUE, ET LE GESTE QUI DÉBLOQUE ───────────────────────────────
	   DEUX RÉGIMES, ET C'EST LA CORRECTION. Le voile couvrait aussi l'absence de
	   RELATION, si bien qu'un périmètre de trente-deux notes se voyait masqué au
	   motif qu'aucune n'était reliée — alors que le nuage des familles est
	   parfaitement lisible, et qu'il dit quelque chose d'utile. Le voile ne reste
	   que là où il n'y a RIEN À DESSINER ; ce qui manque par-dessus un dessin
	   peuplé se dit par un bandeau, qui n'empêche pas de regarder. */

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

	/** Le nœud choisi, en mode local — la vue le rend, le câblage l'ouvre. */
	const noteDuCentre = $derived(
		centreValide === null ? null : (graphe.index.get(centreValide)?.note ?? null)
	);

	/* Les cinq clés de lecture — `RG-M09-07` : « aucun encodage n'est laissé à
	   l'interprétation ». Elles suivent la grammaire figée, canal par canal. */
	const CLES_DE_LECTURE: readonly (readonly [string, string])[] = [
		['Forme et code', 'le type de la note'],
		['Couleur et glyphe', 'la vivacité — le pire des deux registres'],
		['Taille', 'la centralité de passage, ou le nombre de connexions'],
		['Anneau interrompu', 'point de rupture : son retrait isole une partie du périmètre'],
		['Contour pointillé, teinte pâle', 'nœud hors périmètre mais relié'],
		['Trait plein', 'relation déclarée'],
		['Trait fin', 'relation déduite'],
		['Contour et nom', 'famille sémantique : une appartenance, jamais un lien entre deux notes']
	];

	/** Ce que la colonne dit de la densité, quand les étiquettes se taisent. */
	const mentionDeDensite = $derived(
		dense
			? `${graphe.noeuds.length} nœuds : les titres se lisent au survol, à la sélection, ou en grossissant. Les noms de famille restent écrits.`
			: null
	);
</script>

<!-- Le contour d'un nœud. LA COULEUR N'EST PLUS UN ATTRIBUT DE PRÉSENTATION :
     elle vient de `currentColor`, que la classe d'état pose sur le groupe. C'est
     ce qui permet à la vivacité de commander la teinte sans qu'aucune règle de
     style ne soit écrite dans la vue (`ADR-002`). -->
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

<!-- La miniature de type de la légende : le même contour, au rayon 9, en encre
     neutre — la teinte y dirait un état que la légende ne parle pas. -->
{#snippet miniature(t: EncodageDeType)}<svg
		width="26"
		height="26"
		viewBox="-13 -13 26 26"
		class="lg__forme"
		>{@render contour(contourDeForme(t, 9))}<text class="noeud__code" style="font-size:6px"
			>{t.code}</text
		></svg
	>{/snippet}

<!-- Le glyphe d'un état, dans la légende de vivacité comme dans le panneau : le
     même chemin que `GlypheDeVivacite`, à la même géométrie. La couleur ne porte
     jamais seule l'information (`RG-M18-09`). -->
{#snippet glypheDEtat(etat: EtatDeVivacite)}<svg
		class="glyphe {ETATS_DE_VIVACITE[etat].classe}"
		width="14"
		height="14"
		viewBox="0 0 16 16"
		aria-hidden="true"
		><circle
			cx="8"
			cy="8"
			r="6.5"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
		/>{#if ETATS_DE_VIVACITE[etat].glyphe}<path
				d={ETATS_DE_VIVACITE[etat].glyphe}
				fill="currentColor"
			/>{/if}</svg
	>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="carto"
	cibleEvitement="liste-noeuds"
	libelleEvitement="Aller à la liste des nœuds"
	fil={locale ? ['Accueil', 'Cartographie', 'Voisinage'] : ['Accueil', 'Cartographie']}
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
			<!-- ══════════ Vue locale : le voisinage d'un nœud ══════════ -->
			<div class="controles controles--locale">
				<a class="retour" href={resolve('/cartographie')}
					><svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"><path d="M10 3L5 8l5 5" /></svg
					>Retour à la cartographie</a
				>
				<div class="controles__titre">
					<!-- LES GUILLEMETS NE SONT PAS UN ORNEMENT : « Voisinage de Ancienne procédure »
					     se lit mal, et aucune règle d'élision ne tient sur un titre libre — il
					     peut commencer par une voyelle, un chiffre, une majuscule ou un guillemet. -->
					<h1>{'Voisinage de « ' + (noteDuCentre?.titre ?? '') + ' »'}</h1>
					<p>Explorer les relations et les proximités autour de cette note.</p>
				</div>

				<div class="controles__groupe" style="margin-left:auto">
					<span class="etiq" id="etiq-profondeur">Profondeur</span>
					<div class="bascule-vue" role="group" aria-labelledby="etiq-profondeur">
						{#each [1, 2, 3] as niveau (niveau)}<button
								type="button"
								class="btn-profondeur"
								data-profondeur={niveau}
								aria-pressed={niveau === profondeur}>{niveau}</button
							>{/each}
					</div>
				</div>

				<div class="mesures">
					<span class="mesures__item"
						>{graphe.noeuds.length + ' ' + accord(graphe.noeuds.length, 'nœud')}</span
					><span class="mesures__item"
						>{graphe.aretes.length + ' ' + accord(graphe.aretes.length, 'relation')}</span
					><span class="mesures__item"
						>{(familles.voisinsParNote[centreValide ?? '']?.length ?? 0) + ' affinités'}</span
					>
				</div>
			</div>
		{:else}
			<!-- ══════════ Vue complète : la barre de commande ══════════ -->
			<div class="controles">
				<div class="controles__groupe">
					<label class="etiq" for="perimetre">Périmètre</label>
					<select id="perimetre"
						><option value="global|">Tous les domaines</option
						>{#each UNIVERS_PROPOSES as u (u.nom)}<option value="univers|{u.nom}"
								>Univers {u.nom}</option
							>{/each}{#each domaines as d (d.nom)}<option value="domaine|{d.nom}"
								>Domaine {d.nom}</option
							>{/each}</select
					>
				</div>

				<div class="bascule-vue" role="tablist" aria-label="Mode de cartographie">
					<button role="tab" aria-selected="true" data-vue="complete">Vue complète</button>
					<button role="tab" aria-selected="false" data-vue="maitre">Par type maître</button>
				</div>

				<div class="rech-graphe" id="rech-graphe">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
					>
					<input
						type="search"
						id="rech"
						placeholder="Rechercher un nœud…"
						autocomplete="off"
						aria-label="Chercher un nœud dans le graphe"
					/>
					<div class="rech-graphe__liste" id="rech-liste" role="listbox"></div>
				</div>

				<div style="margin-left:auto;display:flex;gap:var(--e-2)">
					<button class="btn" id="effacer-sel" disabled>Effacer la sélection</button>
					<button class="btn" id="recentrer">Recentrer</button>
				</div>
			</div>
		{/if}

		<div class="scene" data-mode={locale ? 'locale' : 'complete'}>
			{#if !locale}
				<!-- ---------- Colonne de commande ---------- -->
				<aside class="legende-col" id="commandes" aria-label="Commandes d’exploration">
					<div class="legende__bloc">
						<span class="etiq">Liens</span>
						<div id="filtre-couches" style="margin-top:var(--e-2)">
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
						<p class="legende__note">
							L'affinité sémantique n'est pas une couche de liens : elle rapproche les nœuds et les
							entoure. Une appartenance commune n'est pas un lien entre deux notes.
						</p>
					</div>

					<div class="legende__bloc">
						<span class="etiq">Regroupement</span>
						<div style="margin-top:var(--e-2)">
							<p class="legende__mesure">
								{familles.familles.length + ' ' + accord(familles.familles.length, 'famille')} ·
								{familles.notesExaminees + ' ' + accord(familles.notesExaminees, 'note')}
							</p>
							<label class="lg lg--case"
								><input type="checkbox" id="c-contours" checked={exploration.contours} /><span
									class="lg__nom">Contours</span
								></label
							>
							<label class="lg lg--case"
								><input type="checkbox" id="c-noms" checked={exploration.nomsDeFamille} /><span
									class="lg__nom">Noms</span
								></label
							>
						</div>
						<p class="legende__note">
							{#if familles.sansFamille > 0}{familles.sansFamille +
									' ' +
									accord(familles.sansFamille, 'note') +
									' hors famille. '}{/if}Regroupement par proximité de sens — étiquettes, dossier,
							mots des titres —, indépendant des relations déclarées.
							{#if dateDeCalcul !== null && dateDeCalculMachine !== null}<time
									datetime={dateDeCalculMachine}>{'Calculé le ' + dateDeCalcul + '.'}</time
								>{/if}
						</p>
					</div>

					<div class="legende__bloc">
						<span class="etiq">Vivacité</span>
						<div id="filtre-vivacite" style="margin-top:var(--e-2)">
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

					<div class="legende__bloc">
						<span class="etiq">Nœuds</span>
						<div id="legende-types" style="margin-top:var(--e-2)">
							{#each types as t (t.cle)}<button class="lg" type="button" data-isole="non"
									>{@render miniature(t.type)}<span class="lg__nom">{t.type.nom}</span><span
										class="lg__n">{t.n}</span
									></button
								>{/each}
						</div>
						<p class="legende__note">
							Cliquer un type isole ses nœuds. La forme et le code portent le type ; la couleur
							porte la vivacité.{#if mentionDeDensite !== null}{' ' + mentionDeDensite}{/if}
						</p>
					</div>

					<div class="legende__bloc">
						<span class="etiq">Taille des nœuds</span>
						<div id="filtre-taille" style="margin-top:var(--e-2)">
							{#each [['centralite', 'Centralité'], ['connexions', 'Connexions'], ['uniforme', 'Uniforme']] as choix (choix[0])}<label
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

					<div class="legende__bloc">
						<span class="etiq">Réduire le bruit</span>
						<div style="margin-top:var(--e-2)">
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
							<p class="legende__mesure">
								{isolees + ' ' + accord(isolees, 'note')} sans relation déclarée
							</p>
							<label class="lg lg--case"
								><input type="checkbox" id="c-ruptures" checked /><span class="lg__nom"
									>Points de rupture</span
								></label
							>
						</div>
						<button class="btn btn--discret" id="reinitialiser">Réinitialiser les filtres</button>
					</div>

					<div class="legende__bloc">
						<span class="etiq">Lecture du graphe</span>
						<div id="legende-cles" style="margin-top:var(--e-2)">
							{#each CLES_DE_LECTURE as cle (cle[0])}<div class="cle-lecture">
									<b>{cle[0]}</b><span>{cle[1]}</span>
								</div>{/each}
						</div>
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
				</aside>
			{/if}

			<!-- ---------- Le graphe ---------- -->
			<div class="zone-graphe" id="zone-graphe">
				<svg
					id="graphe"
					class="graphe"
					data-focus="non"
					data-isole="non"
					data-criticite="oui"
					data-contours={exploration.contours ? 'oui' : 'non'}
					data-noms={exploration.nomsDeFamille ? 'oui' : 'non'}
					data-dense={dense ? 'oui' : 'non'}
					role="img"
					aria-label="Graphe du périmètre. Une liste équivalente est disponible dans la colonne de commande."
					viewBox="0 0 1000 780"
					><g id="racine" transform="translate(0,0) scale(1)"
						><g class="familles" aria-hidden="true"
							>{#each contoursDeFamille as f (f.cle)}<path
									class="famille__contour"
									data-teinte={f.rang}
									d={f.chemin}
								/>{/each}</g
						><!-- LES RAYONS DE RATTACHEMENT — du moyeu du périmètre vers chaque
						     famille, de chaque famille vers ses notes, et du moyeu vers les
						     notes qu'aucune famille ne réunit. Plus fins et plus pâles que la
						     plus faible des relations, et sans étiquette : rien ne doit laisser
						     croire que quelqu'un les a déclarés. -->
						<g class="rattachements" aria-hidden="true"
							>{#if !locale}{#each moyeux as m (m.cle)}<line
										class="rattachement rattachement--tronc"
										data-teinte={m.rang % TEINTES_DE_FAMILLE}
										x1={moyeuCentral.x}
										y1={moyeuCentral.y}
										x2={m.place.x}
										y2={m.place.y}
									/>{/each}{/if}{#each moyeux as m (m.cle)}{#each m.membres as id (id)}<line
										class="rattachement"
										data-teinte={m.rang % TEINTES_DE_FAMILLE}
										data-membre={id}
										x1={m.place.x}
										y1={m.place.y}
										x2={positionDe(id).x}
										y2={positionDe(id).y}
									/>{/each}{/each}{#if !locale}{#each orphelinesDeFamille as id (id)}<line
										class="rattachement"
										data-membre={id}
										x1={moyeuCentral.x}
										y1={moyeuCentral.y}
										x2={positionDe(id).x}
										y2={positionDe(id).y}
									/>{/each}{/if}</g
						><g
							>{#each graphe.aretes as r, rang (rang)}<path
									class="arete"
									d={courbe(positionDe(r.de), positionDe(r.vers))}
									data-de={r.de}
									data-vers={r.vers}
									data-actif="non"
									data-couche={coucheDArete(r)}
									data-masque={masqueDArete(r) ? 'oui' : 'non'}
									data-technique={estTechnique(r.type, relationsTechniques) ? 'oui' : 'non'}
									><title
										>{`${titreDe(graphe, corpus, r.de)} ${typesRelation[r.type].sortant} ${titreDe(graphe, corpus, r.vers)}`}</title
									></path
								>{/each}</g
						>{#if locale}<g class="aretes-etiquettes" aria-hidden="true"
								>{#each graphe.aretes as r, rang (rang)}<text
										class="arete__etiquette"
										data-de={r.de}
										data-vers={r.vers}
										data-masque={masqueDArete(r) ? 'oui' : 'non'}
										x={(positionDe(r.de).x + positionDe(r.vers).x) / 2}
										y={(positionDe(r.de).y + positionDe(r.vers).y) / 2}
										>{typesRelation[r.type].sortant}</text
									>{/each}</g
							>{/if}<g class="moyeux"
							><!-- LE MOYEU DU PÉRIMÈTRE N'EST PAS DANS LA VUE LOCALE. Il dit « voici le
							     corpus et ses groupes » ; un voisinage dit « voici les abords de cette
							     note ». Posé là, il attire l'œil au centre d'un dessin dont le centre
							     est ailleurs, et ses rayons traversent tout. -->
							{#if !locale}<g
									class="moyeu moyeu--perimetre"
									transform="translate({moyeuCentral.x},{moyeuCentral.y})"
									><circle
										class="moyeu__forme"
										r={RAYON_DE_MOYEU}
									/>{#if nomDuPerimetre.length <= NOM_TENANT_DANS_LE_MOYEU}<text
											class="moyeu__nom moyeu__nom--dedans">{nomDuPerimetre}</text
										><text class="moyeu__code" y={RAYON_DE_MOYEU + 14}
											>{'(' + codeCourt(nomDuPerimetre) + ')'}</text
										>{:else}<text class="moyeu__code moyeu__code--dedans"
											>{codeCourt(nomDuPerimetre)}</text
										><text class="moyeu__nom" y={RAYON_DE_MOYEU + 15}>{nomDuPerimetre}</text
										>{/if}</g
								>{/if}{#each moyeux as m (m.cle)}<g
									class="moyeu moyeu--famille"
									data-teinte={m.rang % TEINTES_DE_FAMILLE}
									transform="translate({m.place.x},{m.place.y})"
									><circle class="moyeu__forme" r={RAYON_DE_MOYEU_DE_FAMILLE} /></g
								>{/each}</g
						><g class="familles-noms" aria-hidden="true"
							>{#each contoursDeFamille as f (f.cle)}<g
									class="famille__tete"
									data-teinte={f.rang}
									transform="translate({f.tete.x},{f.tete.y})"
									><circle
										class="famille__pastille"
										cx={-f.nom.length * 3.4 - 8}
										cy="-4"
										r="3.5"
									/><text class="famille__nom">{f.nom}</text><text class="famille__compte" y="14"
										>{f.effectif + ' ' + accord(f.effectif, 'note')}</text
									></g
								>{/each}</g
						><g class="affinites" id="affinites"
							>{#each affinitesDuCentre as v (v.note)}<line
									class="affinite"
									x1={positionDe(centreValide ?? '').x}
									y1={positionDe(centreValide ?? '').y}
									x2={positionDe(v.note).x}
									y2={positionDe(v.note).y}><title>{v.origine + ' ' + v.trait}</title></line
								>{/each}{#each affinitesDuCentre as v (v.note)}<text
									class="affinite__etiquette"
									x={(positionDe(centreValide ?? '').x + positionDe(v.note).x) / 2}
									y={(positionDe(centreValide ?? '').y + positionDe(v.note).y) / 2}>affinité</text
								>{/each}</g
						><g
							>{#each graphe.noeuds as n (n.id)}{@const ray = rayon(n.id)}{@const etat = vivaciteDe(
									n.id
								)}<g
									class="noeud {etat === null
										? 'noeud--sans-etat'
										: ETATS_DE_VIVACITE[etat].classe}"
									transform="translate({positionDe(n.id).x},{positionDe(n.id).y})"
									data-id={n.id}
									data-fantome={n.fantome ? 'oui' : 'non'}
									data-actif="non"
									data-type-visible="oui"
									data-choisi={n.id === centreValide ? 'oui' : 'non'}
									data-masque={masqueDeNoeud(n.id) ? 'oui' : 'non'}
									data-vivacite={etat ?? ''}
									data-degre={degreDe(n.id)}
									data-isolee={degreDe(n.id) === 0 ? 'oui' : 'non'}
									data-saut={distances.get(n.id) ?? ''}
									tabindex="0"
									role="button"
									aria-label={libelleDuNoeud(n.id, n.note)}
									>{@render contour(
										contourDeForme(typeDe(n.note), ray)
									)}{#if ruptures.has(n.id)}<circle class="rupture-anneau" r={ray + 5} /><circle
											class="rupture-fanion"
											cx={ray * 0.9}
											cy={-ray * 1.05}
											r="5.5"
										/><text class="rupture-glyphe" x={ray * 0.9} y={-ray * 1.05}>!</text>{/if}<text
										class="noeud__nom"
										y={ray + 12}>{nomCourt(n.note.titre)}</text
									></g
								>{/each}</g
						></g
					></svg
				>

				{#if avis !== null}
					<div class="avis-bandeau">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							style="flex:none"><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
						>
						<span style="flex:1"
							>{#if avis === 'relation'}Aucune relation n'est déclarée dans ce corpus. Les nœuds
								ci-dessus sont placés par leurs familles sémantiques — ouvrez une {motFicheMinuscule}
								et déclarez-y une relation pour que la carte montre des dépendances.{:else}Aucune
								relation ne touche ce périmètre. Les nœuds ci-dessus sont placés par leurs familles
								sémantiques.{/if}</span
						>
						{#if avis === 'relation'}<button class="btn" id="vers-relations"
								>Déclarer une relation</button
							>{:else}<a class="btn" href={resolve('/cartographie')}>Voir tout le corpus</a>{/if}
					</div>
				{/if}

				<div class="outils-graphe">
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

				<!-- La légende du dessin — `RG-M09-07`, sous le canevas dans les deux modes. -->
				<div class="legende-pied" aria-hidden="true">
					<div class="legende-pied__bloc">
						<span class="etiq">Type de nœud</span>
						<div class="legende-pied__items">
							{#each types.slice(0, 4) as t (t.cle)}<span class="lp"
									>{@render miniature(t.type)}<span>{t.type.nom}</span></span
								>{/each}
						</div>
					</div>
					<div class="legende-pied__bloc">
						<span class="etiq">Relation</span>
						<div class="legende-pied__items">
							<span class="lp"
								><span class="lg__trait lg__trait--declaree"></span><span>Déclarée</span></span
							><span class="lp"
								><span class="lg__trait lg__trait--deduite"></span><span>Déduite</span></span
							>{#if locale}<span class="lp"
									><span class="lg__trait lg__trait--affinite"></span><span>Affinité</span></span
								>{/if}
						</div>
					</div>
					<div class="legende-pied__bloc">
						<span class="etiq">Vivacité</span>
						<div class="legende-pied__items">
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
										<a class="btn btn--principal" href={resolve('/console/univers')}
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
										<a class="btn btn--principal" href={resolve('/console/domaines')}
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
									<a class="btn btn--principal si-ecriture" href={resolve('/notes/nouvelle')}
										>Créer une note</a
									>
								</div>
							</div>{/if}
					</div>
				</div>
			</div>

			<!-- ---------- Panneau contextuel ----------
			     IL N'APPARAÎT QUE LORSQU'UN NŒUD EST CHOISI. Il occupait un tiers de
			     l'écran en permanence pour n'y écrire que « Aucun nœud sélectionné » —
			     et son contenu n'était même pas rempli, ce que son câblage déclarait.
			     Le canevas garde donc toute sa place tant que rien n'est choisi. -->
			<aside class="detail-col" id="detail" aria-label="Détail du nœud sélectionné" hidden>
				<div id="detail-corps"></div>
			</aside>
		</div>
	{/snippet}
</Coquille>
