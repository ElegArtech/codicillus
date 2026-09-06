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
	 * répondre était celle pour laquelle on l'ouvre. Aucun trait ne les rattache à
	 * quoi que ce soit — leur isolement EST l'information.
	 *
	 * RIEN NE SE DESSINE QUI N'AIT ÉTÉ DÉCLARÉ. L'écran portait un nœud central au
	 * nom du périmètre, un moyeu par famille, et des rayons de l'un vers les autres
	 * puis vers chaque note : sur l'instance de recette, soixante-dix-sept traits
	 * inventés pour sept relations réelles, et une rosace qui affirmait que le
	 * corpus rayonne depuis un point. Un périmètre est un CONTEXTE DE FILTRAGE ;
	 * une famille est une APPARTENANCE. Ni l'un ni l'autre n'est un objet du graphe.
	 *
	 * ── CE QUI NE DOIT PAS REVENIR ────────────────────────────────────────────
	 * Chacun de ces points a été rendu, vu au navigateur, et retiré. Les remettre
	 * ne se discute pas au cas par cas : ils se tiennent, et c'est ensemble qu'ils
	 * refaisaient une illustration là où il faut un explorateur.
	 *
	 *   · UN NŒUD AU NOM DU PÉRIMÈTRE. Un périmètre filtre, il n'est pas un objet
	 *     du graphe, et rien n'est « relié à l'univers ».
	 *   · UN MOYEU PAR FAMILLE, ET DES RAYONS VERS SES NOTES. Une appartenance
	 *     n'est pas un lien vers un centre.
	 *   · DES ARÊTES D'AFFINITÉ EN VUE COMPLÈTE. Six fois plus nombreuses que les
	 *     relations, et chacune affirme un rapport que personne n'a déclaré.
	 *   · DES ANCRAGES DE FAMILLE POSÉS SUR UN CERCLE. Un regroupement s'observe,
	 *     il ne se range pas ; la couronne dessinait la géométrie qu'on avait
	 *     choisie, pas celle qu'on avait.
	 *   · LE RETRAIT DES NOTES ISOLÉES. Sur l'instance de recette, soixante-huit
	 *     sur soixante-dix-sept : c'est la mesure, pas le bruit.
	 *   · UN PLAFOND SUR LA TAILLE. À `min(degré, 8)`, une note à quarante-deux
	 *     relations se dessine comme une note à huit.
	 *   · UNE COLONNE DE RÉGLAGES RÉSERVÉE EN PERMANENCE, ni un panneau de détail
	 *     vide. Le canevas garde sa place tant qu'on ne demande rien.
	 *   · DES PARAGRAPHES D'EXPLICATION DANS LE PANNEAU. Chaque ligne est une
	 *     légende, un filtre et un compte ; ce qui demande une phrase tient dans
	 *     un `ⓘ`.
	 *   · UNE SECONDE LÉGENDE. Il y en a UNE, sous le dessin, et elle nomme les
	 *     cinq canaux.
	 *   · UN RECHARGEMENT DE PAGE SUR UN FILTRE. Seuls le périmètre et la mesure
	 *     de taille naviguent, et par `goto`.
	 *   · UN VOILE SUR UN GRAPHE PEUPLÉ. « Aucune relation » se dit en bandeau ;
	 *     le nuage des familles reste lisible et dit quelque chose.
	 *   · UNE PLACE DE DÉPART TIRÉE DU RANG DU NŒUD. Elle est hachée sur son
	 *     identifiant : ajouter une note ne redessine pas la carte.
	 *
	 * ── CE QU'ON REGARDE POUR VÉRIFIER, DANS UN NAVIGATEUR ─────────────────────
	 * Sur un corpus RÉEL, jamais sur cinq nœuds — c'est à la densité que tout se
	 * joue. Deux secondes de regard doivent donner, dans cet ordre : les zones de
	 * famille, les nœuds structurants, les taches de vivacité, les relations.
	 *
	 *   1. Aucun trait ne part d'un point central, et aucun nœud ne porte le nom
	 *      du périmètre. Le compte de `.rattachement` et de `.moyeu` est ZÉRO.
	 *   2. Le nombre de `.arete` égale celui des couches cochées, à l'unité.
	 *   3. Les notes sans relation sont TOUTES dessinées, et sans trait.
	 *   4. Le dessin ne passe ni sous le panneau, ni sous le fil, ni hors cadre.
	 *   5. Cocher une case n'appelle pas le serveur, et l'adresse suit.
	 *   6. Un clic ouvre le panneau ; un double-clic ouvre la note.
	 *   7. Molette, glisser et « Recentrer » répondent.
	 *   8. Changer de périmètre garde les filtres et vide la sélection.
	 *   9. Un périmètre sans relation montre la carte ET le bandeau.
	 *  10. Recharger deux fois le même périmètre rend la MÊME carte.
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

	/* ── LE PÉRIMÈTRE, EN DEUX SÉLECTEURS ──────────────────────────────────────
	   Un seul les mélangeait — « Univers Substack », « Domaine Cadrage » à la
	   suite —, ce qui obligeait à lire un préfixe pour savoir de quoi on parlait, et
	   rendait impossible le geste évident : rester dans un univers et n'y regarder
	   qu'un domaine. Les deux sélecteurs se composent, et le second ne propose que
	   les domaines du premier. */

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

	/**
	 * LES PLACES DES NŒUDS. Le départ de chaque corps est haché sur SON identifiant :
	 * ajouter une note ne déplace plus les autres, et on reconnaît sa carte d'une
	 * visite à l'autre. Les familles tirent au barycentre et se repoussent entre
	 * elles — c'est là, et nulle part sur le dessin, que l'affinité agit.
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

	/* ── LES NŒUDS QUI PORTENT LEUR NOM EN PERMANENCE ──────────────────────────
	   Un dessin où RIEN n'est nommé n'a pas de prise : les nœuds structurants
	   gardent leur titre, et ce sont ceux qu'on cherche du regard.

	   DEUX CONDITIONS, ET LA SECONDE EST CELLE QUI COMPTE. Le seul seuil de rayon a
	   été mesuré sur l'instance de recette : les nœuds les plus centraux y sont TOUS
	   dans le même amas — c'est ce qui les rend centraux —, si bien qu'une quinzaine
	   de titres se sont empilés au même endroit en une tache illisible, pendant que
	   le reste de la carte n'en portait aucun. Le nombre est donc PLAFONNÉ : les huit
	   plus gros, et eux seuls. Les autres se lisent au survol ou à la sélection. */

	const RAYON_DE_NOEUD_NOMME = 11;
	const NOEUDS_NOMMES_AU_PLUS = 8;

	/* ── LES ÎLOTS SÉMANTIQUES ─────────────────────────────────────────────────
	   La forme juste d'une appartenance est un ENSEMBLE, pas un faisceau de
	   segments : le contour dit d'un trait ce que cent cinq arêtes diraient mal, et
	   il ne peut pas être confondu avec une relation déclarée — ce qu'un pointillé,
	   si discret soit-il, ne garantit jamais.

	   L'ÎLOT N'A NI CENTRE NI MOYEU. Il en portait un — un disque au barycentre, d'où
	   partait un rayon vers chacun de ses membres. C'était un objet inventé, et ses
	   rayons autant : une famille est ce que ses notes ont en commun, pas une chose à
	   laquelle elles se relient. Ne restent que la GÉOGRAPHIE — la disposition les
	   rapproche — et le CONTOUR, qui la donne à voir. */

	interface Ilot {
		readonly cle: string;
		readonly nom: string;
		readonly origine: string;
		readonly rang: number;
		readonly membres: readonly string[];
	}

	/** Le nombre de teintes d'îlot — voir `V-19.css`. */
	const TEINTES_DE_FAMILLE = 8;

	const famillesDessinees = $derived(famillesPresentes(graphe, familleParNote));

	/**
	 * LE RANG D'UN ÎLOT VIENT DU CLASSEMENT DU CHARGEUR, jamais de l'ordre des nœuds
	 * du dessin. C'est lui qui décide de la teinte : pris sur l'ordre de parcours du
	 * graphe, deux chargements du même périmètre auraient recoloré les îlots.
	 */
	const ilots = $derived.by<Ilot[]>(() => {
		const dessinees = new Set(famillesDessinees);
		/* Un objet plutôt qu'une `Map` : ce regroupement se REFAIT à chaque changement
		   de graphe, il n'est jamais muté après coup, et `svelte/prefer-svelte-reactivity`
		   n'admet pas de `Map` qu'on remplit — à raison, une `Map` mutée dans un état
		   dérivé ne réveille rien. */
		const membresParNom: Record<string, string[]> = {};
		for (const n of graphe.noeuds) {
			const nom = familleParNote.get(n.id);
			if (nom === undefined || !dessinees.has(nom)) continue;
			(membresParNom[nom] ??= []).push(n.id);
		}
		return familles.familles
			.filter((f) => membresParNom[f.nom] !== undefined)
			.map((f, rang) => ({
				cle: f.cle,
				nom: f.nom,
				origine: f.origine,
				rang,
				membres: membresParNom[f.nom] ?? []
			}));
	});

	interface ContourDeFamille {
		readonly cle: string;
		readonly nom: string;
		readonly effectif: number;
		readonly rang: number;
		readonly chemin: string;
		/** Où se pose l'en-tête : au-dessus du point le plus haut de l'îlot. */
		readonly tete: Place;
	}

	const contoursDeFamille = $derived.by<ContourDeFamille[]>(() => {
		if (!exploration.contours) return [];
		const dessines: ContourDeFamille[] = [];
		for (const ilot of ilots) {
			const pts = ilot.membres.map((id) => positionDe(id));
			const rayons = ilot.membres.map((id) => rayon(id));
			const chemin = contourDeGroupe(pts, rayons);
			if (chemin === null) continue;
			const centre = barycentre(pts);
			if (centre === null) continue;
			/* L'EN-TÊTE SE POSE AU-DESSUS DE L'ÎLOT, comme un titre de carte. Au
			   barycentre, il tombait au milieu des nœuds et se disputait la place
			   avec leurs titres. */
			const haut = Math.min(...pts.map((pt, i) => pt.y - (rayons[i] ?? 0)));
			dessines.push({
				cle: ilot.cle,
				nom: ilot.nom,
				effectif: ilot.membres.length,
				rang: ilot.rang % TEINTES_DE_FAMILLE,
				chemin,
				tete: { x: centre.x, y: haut - 20 }
			});
		}
		return dessines;
	});

	/* ── LES FILTRES ───────────────────────────────────────────────────────────
	   La vue rend l'état d'OUVERTURE ; `cablage.ts` le fait vivre ensuite, sur les
	   mêmes attributs, avec le MÊME prédicat (`$lib/graphe/filtres`). Aucun nœud
	   n'est retiré du document : un nœud masqué garde sa place, et le rallumer ne
	   fait pas sauter la carte. */

	const codeDuNoeud = (note: Note): string => typeDe(note).code;

	const masqueDeNoeud = (id: string, note: Note): boolean =>
		noeudMasque(
			{ vivacite: vivaciteDe(id), degre: degreDe(id), type: codeDuNoeud(note) },
			exploration
		);

	/** Le prédicat d'arête a besoin des deux notes : il les retrouve par l'index. */
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

	const noeudsNommes = $derived.by<ReadonlySet<string>>(() => {
		if (!dense) return new Set(graphe.noeuds.map((n) => n.id));
		return new Set(
			graphe.noeuds
				.map((n) => [n.id, rayon(n.id)] as const)
				.filter(([, r]) => r >= RAYON_DE_NOEUD_NOMME)
				/* À rayon égal, l'identifiant tranche : le classement ne doit pas
				   dépendre de l'ordre de la requête. */
				.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
				.slice(0, NOEUDS_NOMMES_AU_PLUS)
				.map(([id]) => id)
		);
	});

	/* L'avancement du calcul de disposition : un état figé, jamais une animation. */
	const AVANCEMENT = 77;

	const dateDeCalcul = $derived(
		familles.calculeLe === '' ? null : formaterDateHeureFr(familles.calculeLe)
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

	/**
	 * LE FIL PORTE LE PÉRIMÈTRE, et pas seulement le nom de l'écran. « Accueil ›
	 * Cartographie » ne disait pas de QUOI on regarde la carte, alors que le
	 * sélecteur venait de le choisir. Le second segment est l'univers, par la
	 * convention de la coquille : le rail le déplie et le met en évidence.
	 */
	const filDAriane = $derived.by<string[]>(() => {
		const tete = universChoisi === '' ? ['Accueil'] : ['Accueil', universChoisi];
		return locale ? [...tete, 'Cartographie', 'Voisinage'] : [...tete, 'Cartographie'];
	});

	/** Le nœud choisi, en mode local — la vue le rend, le câblage l'ouvre. */
	const noteDuCentre = $derived(
		centreValide === null ? null : (graphe.index.get(centreValide)?.note ?? null)
	);

	/* ── CE QUI S'EXPLIQUE, ET OÙ ──────────────────────────────────────────────
	   Le panneau portait trois paragraphes — dont « L'affinité sémantique n'est pas
	   une couche de liens… » — et un bloc de huit clés de lecture. Un explorateur
	   qu'on ouvre tous les jours n'a pas à redire son mode d'emploi à chaque
	   ouverture : la légende du dessin nomme les encodages, chaque ligne du panneau
	   se compte et se filtre, et ce qui demande une phrase tient dans un `ⓘ`. */

	const infoDesFamilles = $derived(
		'Regroupement par proximité de sens — étiquettes, dossier, mots des titres —, ' +
			'indépendant des relations déclarées. Une appartenance commune rapproche les nœuds ' +
			'et les entoure ; elle ne se dessine jamais en traits.' +
			(familles.sansFamille > 0
				? ` ${familles.sansFamille} ${accord(familles.sansFamille, 'note')} hors famille.`
				: '') +
			(dateDeCalcul === null ? '' : ` Calculé le ${dateDeCalcul}.`)
	);

	const infoDeLaTaille =
		'Connexions : le nombre de relations qui touchent le nœud. ' +
		'Centralité : la part des plus courts chemins du périmètre qui passent par lui — ' +
		'une note peut avoir vingt voisins et ne relier rien à rien.';
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
			<!-- ══════════ Vue complète : le titre et les commandes de périmètre ══════════
			     LES RÉGLAGES DU GRAPHE NE SONT PAS ICI, et ce n'est pas une question de
			     place : cette barre appartient à la PAGE — où l'on regarde, et comment
			     y revenir. Ce qui règle le DESSIN vit dans le panneau « Affichage »,
			     posé sur le canevas qu'il commande. -->
			<div class="controles">
				<div class="controles__titre">
					<span class="controles__glyphe" aria-hidden="true"
						><svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><circle cx="12" cy="5" r="2.4" /><circle cx="5" cy="17" r="2.4" /><circle
								cx="19"
								cy="17"
								r="2.4"
							/><path d="M10.4 6.8 6.6 15M13.6 6.8 17.4 15M7.5 17.4h9" /></svg
						></span
					>
					<div>
						<h1>Cartographie</h1>
						<p>Explorez les liens et les forces de votre connaissance.</p>
					</div>
				</div>

				<div class="controles__outils">
					<label class="hors-ecran" for="perimetre-univers">Univers</label>
					<select id="perimetre-univers" class="choix"
						><option value="">Univers : tous</option>{#each UNIVERS_PROPOSES as u (u.nom)}<option
								value={u.nom}
								selected={u.nom === universChoisi}>{'Univers : ' + u.nom}</option
							>{/each}</select
					>

					<label class="hors-ecran" for="perimetre-domaine">Domaine</label>
					<select id="perimetre-domaine" class="choix"
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

					<button class="btn" id="recentrer" type="button"
						><svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><circle cx="8" cy="8" r="3" /><path d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15" /></svg
						>Recentrer</button
					>
					<button class="btn" id="effacer-sel" type="button" disabled>Effacer la sélection</button>

					<div class="bascule-vue" role="tablist" aria-label="Mode de cartographie">
						<button role="tab" aria-selected="true" data-vue="complete">Graphe</button>
						<button role="tab" aria-selected="false" data-vue="maitre">Par type</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="scene" data-mode={locale ? 'locale' : 'complete'}>
			<!-- ---------- Le graphe ---------- -->
			<div class="zone-graphe" id="zone-graphe">
				<svg
					id="graphe"
					class="graphe"
					data-focus="non"
					data-isole="non"
					data-ruptures="oui"
					data-contours={exploration.contours ? 'oui' : 'non'}
					data-noms={exploration.nomsDeFamille ? 'oui' : 'non'}
					data-dense={dense ? 'oui' : 'non'}
					role="img"
					aria-label="Graphe du périmètre. Une liste équivalente est disponible dans le panneau d’affichage."
					viewBox="0 0 1000 780"
					><g id="racine" transform="translate(0,0) scale(1)"
						><g class="familles" aria-hidden="true"
							>{#each contoursDeFamille as f (f.cle)}<path
									class="famille__contour"
									data-teinte={f.rang}
									d={f.chemin}
								/>{/each}</g
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
							>{/if}<g class="familles-noms" aria-hidden="true"
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
									data-code={codeDuNoeud(n.note)}
									data-fantome={n.fantome ? 'oui' : 'non'}
									data-actif="non"
									data-gros={noeudsNommes.has(n.id) ? 'oui' : 'non'}
									data-choisi={n.id === centreValide ? 'oui' : 'non'}
									data-masque={masqueDeNoeud(n.id, n.note) ? 'oui' : 'non'}
									data-vivacite={etat ?? ''}
									data-degre={degreDe(n.id)}
									data-isolee={degreDe(n.id) === 0 ? 'oui' : 'non'}
									data-saut={distances.get(n.id) ?? ''}
									tabindex="0"
									role="button"
									aria-label={libelleDuNoeud(n.id, n.note)}
									><!-- LE SURVOL DIT LE NŒUD, ET IL RESTE LÉGER — titre, type, état,
									     connexions. Il ne modifiait RIEN : l'étiquette de titre
									     reparaissait sous la pastille, et rien ne disait de quel type ni
									     de quel état il s'agit, alors que ce sont les deux canaux que le
									     dessin encode. Un `title` de SVG suffit ; une bulle dessinée
									     serait un second panneau, et le panneau existe déjà. -->
									<title>{libelleDuNoeud(n.id, n.note)}</title>{@render contour(
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

				<!-- ---------- Le panneau d'affichage ----------
				     IL EST POSÉ SUR LE CANEVAS QU'IL COMMANDE, et c'est ce qui le distingue
				     du rail : le rail dit où l'on est dans le produit, ce panneau dit ce
				     que le dessin montre. Mêler les deux ferait de la navigation générale
				     un panneau de configuration, et il y en a onze autres écrans.

				     CHAQUE LIGNE EST À LA FOIS UNE LÉGENDE, UN FILTRE ET UN COMPTE. C'est
				     la seule façon d'expliquer un encodage sans écrire un paragraphe : la
				     ligne « ● À vérifier 12 » montre la teinte, la nomme, la dénombre, et
				     l'éteint d'un clic. Les trois paragraphes qui tenaient ce rôle ont été
				     retirés — un panneau d'exploration n'est pas un manuel. -->
				{#if !locale}
					<aside class="panneau" id="commandes" aria-label="Affichage du graphe">
						<div class="panneau__tete">
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
							<span class="panneau__nom">Affichage</span>
							<button
								type="button"
								class="panneau__bascule"
								id="panneau-bascule"
								aria-expanded="true"
								aria-controls="panneau-corps"
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

						<div class="panneau__corps" id="panneau-corps">
							<div class="legende__bloc">
								<span class="etiq">Liens</span>
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

							<div class="legende__bloc">
								<span class="etiq"
									>Regroupement<button
										type="button"
										class="apropos"
										title={infoDesFamilles}
										aria-label={infoDesFamilles}>ⓘ</button
									></span
								>
								<div>
									<label class="lg lg--case"
										><input type="checkbox" id="c-contours" checked={exploration.contours} /><span
											class="lg__nom">Contours</span
										><span class="lg__n">{ilots.length}</span></label
									>
									<label class="lg lg--case"
										><input type="checkbox" id="c-noms" checked={exploration.nomsDeFamille} /><span
											class="lg__nom">Noms</span
										></label
									>
								</div>
							</div>

							<div class="legende__bloc">
								<span class="etiq">Vivacité</span>
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

							<div class="legende__bloc">
								<span class="etiq">Nœuds</span>
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

							<div class="legende__bloc">
								<span class="etiq"
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

							<div class="legende__bloc">
								<span class="etiq">Réduire le bruit</span>
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
								<button class="btn btn--discret" id="reinitialiser" type="button"
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

				<!-- La légende du dessin — `RG-M09-07`. LES CINQ CANAUX, ET UNE SEULE FOIS :
				     elle se répétait dans la colonne de commande, sous le titre « Lecture du
				     graphe », en huit lignes de prose. Deux légendes pour un dessin, dont
				     une qu'il fallait lire. -->
				<div class="legende-pied" aria-hidden="true">
					<div class="legende-pied__bloc">
						<span class="etiq">Type</span>
						<div class="legende-pied__items">
							{#each types.slice(0, 4) as t (t.cle)}<span class="lp"
									>{@render miniature(t.type)}<span>{t.type.nom}</span></span
								>{/each}
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
						<span class="etiq">Groupe</span>
						<div class="legende-pied__items">
							<span class="lp"><span class="lp__ilot"></span><span>Famille</span></span>
						</div>
					</div>
					<div class="legende-pied__bloc">
						<span class="etiq">Taille</span>
						<div class="legende-pied__items">
							<span class="lp"
								><span class="lp__tailles"><i></i><i></i><i></i></span><span
									>{exploration.taille === 'uniforme'
										? 'Uniforme'
										: exploration.taille === 'connexions'
											? 'Connexions'
											: 'Centralité'}</span
								></span
							>
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
