/**
 * LA DISPOSITION DE LA CARTOGRAPHIE — un ARBRE, pas un nuage de forces.
 *
 * CE QUI A CHANGÉ, ET POURQUOI. Le dessin était produit par une simulation de
 * forces : répulsion entre nœuds, ressorts sur les arêtes, rappel vers le
 * barycentre de la famille. Sur un corpus réel — cent quarante-huit notes, deux
 * cent quarante-cinq mentions, treize familles — l'équilibre est une BOULE : les
 * contours se recouvrent, les libellés se chevauchent, et deux cent quarante-cinq
 * traits passent dans le même paquet. Une simulation cherche un minimum d'énergie ;
 * elle ne cherche pas à être lisible, et rien dans ses forces ne l'y oblige.
 *
 * LE SQUELETTE EST DONC CONSTRUIT, JAMAIS SIMULÉ :
 *
 *   · le PÉRIMÈTRE affiché — univers ou domaine — est un grand disque au centre ;
 *   · chaque FAMILLE sémantique est une branche, posée sur un anneau autour de lui ;
 *   · chaque famille reçoit un SECTEUR ANGULAIRE proportionnel à son nombre de
 *     notes, relevé au minimum géométrique qui empêche deux contours de se toucher ;
 *   · l'ordre est déterministe — par taille décroissante, dans le sens horaire à
 *     partir du haut ;
 *   · les notes d'une famille tiennent sur un ou plusieurs CERCLES CONCENTRIQUES
 *     autour de son pivot, sans se recouvrir ;
 *   · les notes sans famille et sans relation forment « Isolées », en périphérie.
 *
 * LES TRAITS DU SQUELETTE SIGNIFIENT L'APPARTENANCE, PAS UNE RELATION, et c'est
 * pour cela qu'ils sont en pointillés et qu'ils passent SOUS tout le reste : du
 * centre vers les pivots, des pivots vers les notes. Les relations déclarées et
 * déduites se dessinent PAR-DESSUS, avec les styles de la légende.
 *
 * LE DESSIN EST DÉTERMINISTE, ET C'EST UNE PROPRIÉTÉ ÉPROUVÉE : aucun tirage,
 * aucune horloge, aucune mesure du document. Même périmètre et mêmes données
 * donnent le même dessin à chaque ouverture, sans aucun mouvement — voir
 * `disposition-carte.test.ts`.
 *
 * AUCUNE COULEUR NI AUCUNE TAILLE N'EST ÉCRITE ICI : tout vient de `jetons.ts`,
 * qui est comparé à `src/vues/carto-jetons.css` à chaque passage des unitaires.
 */
import { contourDeGroupe, type Graphe, type Place } from './cartographie';
import {
	CENTRE,
	HAUTEUR_DETIQUETTE,
	LARGEUR_DE_CARACTERE,
	MARGE_DETIQUETTE,
	MARGE_DE_CONTOUR,
	MARGE_ENTRE_FAMILLES,
	NOEUD_MAXIMUM,
	PAS_ENTRE_CERCLES,
	PAS_ENTRE_NOEUDS,
	PIVOT,
	REPERE_HAUTEUR,
	REPERE_LARGEUR,
	REPERE_MARGE,
	TEINTES_DE_FAMILLE,
	TEINTE_DES_ISOLEES,
	T_ARETE,
	T_CENTRE,
	T_FAMILLE,
	T_FAMILLE_COMPTE,
	T_NOEUD
} from './jetons';

/* ── LES DEUX FAMILLES QUE LE CALCUL FABRIQUE ──────────────────────────────
   Le regroupement sémantique laisse des notes de côté : celles qui ne partagent ni
   étiquette, ni dossier, ni mot de titre avec une autre. Elles ne disparaissent
   pas du dessin — leur isolement EST l'information —, mais elles ne se mêlent pas
   aux familles réelles.

   DEUX CAS, ET ILS NE DISENT PAS LA MÊME CHOSE. Une note sans famille ET SANS
   RELATION n'est rattachée à rien du tout : c'est « Isolées », et la périphérie est
   sa place. Une note sans famille mais RELIÉE tient au corpus par ses relations ;
   la ranger dans « Isolées » démentirait les traits qui partent d'elle. */

export const NOM_DES_ISOLEES = 'Isolées';
export const NOM_HORS_FAMILLE = 'Hors famille';

/** Le pas angulaire minimal entre deux pastilles voisines d'un même cercle. */
const PAS_ANGULAIRE = NOEUD_MAXIMUM * 2 + PAS_ENTRE_NOEUDS;

/** La hauteur du bloc de titre d'une famille : son nom, puis son effectif. */
const BLOC_DE_TITRE = T_FAMILLE + T_FAMILLE_COMPTE + MARGE_DETIQUETTE * 2;

/** De combien le compte descend sous le nom — la vue pose la même valeur. */
export const DESCENTE_DU_COMPTE = T_FAMILLE_COMPTE + MARGE_DETIQUETTE;

/** La largeur que la petite icône prend devant le nom d'une famille. */
export const RETRAIT_DE_LICONE = 16;

/**
 * OÙ LE BLOC DE TITRE S'ANCRE SUR LE CONTOUR : en haut à gauche, sur un cercle un
 * peu en deçà du bord. À neuf dixièmes du bord et à quarante-cinq degrés, il tombe
 * DEHORS de la dernière couronne de pastilles et DEDANS du contour — c'est la seule
 * bande où il ne dispute rien.
 */
const ANCRAGE_DU_TITRE = 0.9 / Math.SQRT2;

/** Le nombre de caractères au-delà duquel un titre de nœud est coupé. */
export const CARACTERES_DUN_LIBELLE = 22;

/** Jusqu'où la famille « Isolées » est repoussée au-delà de l'anneau commun. */
const REJET_DES_ISOLEES = 1.14;

/** Le nombre de tours accordés à la recherche du rayon de l'anneau. */
const TOURS_DANSEMBLE = 80;

export interface NoeudPlace {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly r: number;
	/** Le pivot de sa famille : la note la plus centrale, dessinée plus grande. */
	readonly pivot: boolean;
	readonly famille: string | null;
	/** Le rang de teinte de sa famille, ou `null` — voir `carto-jetons.css`. */
	readonly teinte: number | null;
}

export interface ContourDeFamille {
	readonly cle: string;
	readonly nom: string;
	readonly effectif: number;
	readonly teinte: number;
	/** Le secteur angulaire qu'elle occupe sur l'anneau, en radians. */
	readonly secteur: number;
	readonly chemin: string;
	/** L'ancre du nom : en haut à gauche du contour, jamais recouverte. */
	readonly tete: Place;
	readonly pivot: string;
	/** Le disque qui contient toute la famille — ce qui garantit la séparation. */
	readonly centre: Place;
	readonly rayon: number;
}

/** Un trait d'appartenance : du centre vers un pivot, d'un pivot vers une note. */
export interface TraitDeSquelette {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
}

export interface CentreDeCarte {
	readonly x: number;
	readonly y: number;
	readonly r: number;
	/** Le nom du périmètre, ou le titre de la note en vue de voisinage. */
	readonly libelle: string;
	/** Le code court, écrit sous le libellé — vide s'il n'y en a pas. */
	readonly code: string;
	/** L'identifiant de la note au centre, ou `null` : le centre est un périmètre. */
	readonly note: string | null;
}

export interface Repere {
	readonly x: number;
	readonly y: number;
	readonly largeur: number;
	readonly hauteur: number;
}

export interface CarteDisposee {
	readonly centre: CentreDeCarte;
	readonly noeuds: readonly NoeudPlace[];
	readonly places: ReadonlyMap<string, NoeudPlace>;
	readonly familles: readonly ContourDeFamille[];
	readonly squelette: readonly TraitDeSquelette[];
	readonly repere: Repere;
	/**
	 * LES NŒUDS DONT LE LIBELLÉ EST ÉCRIT D'OFFICE. Le survol, la sélection et le
	 * zoom en ajoutent au navigateur ; ceux-ci sont écrits dès l'ouverture, et
	 * aucun n'en recouvre un autre.
	 */
	readonly etiquettes: ReadonlySet<string>;
	/** Ceux d'entre eux dont le libellé se pose AU-DESSUS de la pastille. */
	readonly etiquettesAuDessus: ReadonlySet<string>;
}

/** Ce que la disposition a besoin de savoir de chaque nœud. */
export interface MesuresDeNoeud {
	readonly rayon: (id: string) => number;
	readonly degre: (id: string) => number;
	readonly centralite: (id: string) => number;
	readonly titre: (id: string) => string;
}

export interface OptionsDeCarte {
	/** La famille sémantique de chaque note — ce qui fait les branches. */
	readonly familleParNoeud: ReadonlyMap<string, string>;
	/**
	 * L'ORDRE DE RÉFÉRENCE DES FAMILLES, celui du chargeur. Il ne décide PAS du
	 * placement — la taille décroissante s'en charge — mais il tranche les égalités,
	 * pour que deux familles de même effectif ne s'échangent pas leur secteur d'une
	 * ouverture à l'autre.
	 */
	readonly ordreDesFamilles: readonly string[];
	readonly mesures: MesuresDeNoeud;
	/** Ce qui s'écrit dans le disque du centre. */
	readonly perimetre: { readonly nom: string; readonly code: string };
}

/* ── LES OUTILS DE GÉOMÉTRIE ───────────────────────────────────────────────── */

/**
 * LE TITRE ÉCRIT DANS LE DISQUE DU CENTRE, coupé à ce que le disque porte.
 *
 * IL Y ÉTAIT ÉCRIT EN BLANC ET DÉBORDAIT, et sur fond blanc la part qui dépasse
 * DISPARAÎT : « 2026_05_18_Fusion DIN… » se lisait « 5_18_Fusion ». Vu sur
 * l'instance de recette. Le titre entier reste dans le `title` du groupe, et le
 * grand titre de l'écran le porte en toutes lettres.
 */
export function libelleDuCentre(titre: string, rayon: number): string {
	/* LA LARGEUR D'UN CARACTÈRE EST CALIBRÉE SUR LA POLICE DES NŒUDS ; celle du
	   centre est plus grosse, et l'oublier laissait treize caractères là où onze
	   tiennent. La corde utile est presque le diamètre entier : le texte est posé à
	   mi-hauteur, là où le disque est le plus large. */
	const largeurDUnCaractere = LARGEUR_DE_CARACTERE * (T_CENTRE / T_NOEUD);
	const tenables = Math.max(4, Math.floor((rayon * 1.95) / largeurDUnCaractere));
	return titre.length > tenables ? titre.slice(0, tenables - 1).trimEnd() + '…' : titre;
}

/* ── LES LIBELLÉS DE RELATION ──────────────────────────────────────────────
   Ils ne sont écrits que dans le voisinage, au milieu de leur trait. Sur un
   corpus dense, une douzaine de milieux tombent au même endroit et le tas se lit
   « dédudéduite » — vu sur l'instance de recette. La règle est celle des libellés
   de nœud : le premier arrivé garde sa place, celui qui la heurte est tu. Un
   trait sans mot se lit à son STYLE, que la légende nomme. */

/** Un libellé de relation, candidat à l'écriture. */
export interface EtiquetteDeRelation {
	readonly cle: string;
	readonly x: number;
	readonly y: number;
	readonly texte: string;
	/** La longueur du trait, extrémités déduites — un trait court n'écrit rien. */
	readonly portee: number;
}

/** Ce qu'un trait doit mesurer, en proportion de son libellé, pour le porter. */
const PORTEE_MINIMALE = 1.3;

/**
 * LES LIBELLÉS DE RELATION QUI S'ÉCRIVENT. L'ordre des candidats décide de qui
 * garde sa place : il est pris tel que l'appelant le donne, c'est-à-dire l'ordre
 * des arêtes du graphe — déterministe, donc le même à chaque ouverture.
 */
export function etiquettesDeRelation(
	candidats: readonly EtiquetteDeRelation[]
): ReadonlySet<string> {
	const prises: Boite[] = [];
	const retenus: string[] = [];
	for (const c of candidats) {
		const largeur = largeurDeLibelle(c.texte) * (T_ARETE / T_NOEUD);
		if (c.portee < largeur * PORTEE_MINIMALE) continue;
		const boite = {
			x1: c.x - largeur / 2,
			y1: c.y - HAUTEUR_DETIQUETTE / 2,
			x2: c.x + largeur / 2,
			y2: c.y + HAUTEUR_DETIQUETTE / 2
		};
		if (prises.some((prise) => seHeurtent(prise, boite))) continue;
		prises.push(boite);
		retenus.push(c.cle);
	}
	return new Set(retenus);
}

/** Le titre d'un nœud, coupé s'il est trop long — le titre entier reste au survol. */
export function libelleCourt(titre: string): string {
	return titre.length > CARACTERES_DUN_LIBELLE
		? titre.slice(0, CARACTERES_DUN_LIBELLE - 1).trimEnd() + '…'
		: titre;
}

/** La largeur estimée d'un libellé, en unités du repère. */
export function largeurDeLibelle(texte: string): number {
	return texte.length * LARGEUR_DE_CARACTERE;
}

interface Boite {
	readonly x1: number;
	readonly y1: number;
	readonly x2: number;
	readonly y2: number;
}

function seHeurtent(a: Boite, b: Boite): boolean {
	return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
}

/**
 * LES DEUX BOÎTES QU'UN LIBELLÉ DE NŒUD PEUT OCCUPER : sous la pastille, ou dessus.
 *
 * LE SECOND POSTE N'EST PAS UN ORNEMENT. Dans le voisinage, tous les libellés sont
 * écrits ; deux nœuds côte à côte à la même hauteur voient leurs libellés se
 * heurter alors qu'il y a toute la place au-dessus de l'un des deux. Mesuré sur le
 * voisinage de « Claude Code » : trois libellés sur dix-huit étaient tus faute de
 * ce second poste.
 */
function boitesDeLibelle(place: NoeudPlace, texte: string): Boite[] {
	const demi = largeurDeLibelle(texte) / 2;
	const dessous = place.y + place.r + MARGE_DETIQUETTE;
	const dessus = place.y - place.r - MARGE_DETIQUETTE - HAUTEUR_DETIQUETTE;
	return [
		{ x1: place.x - demi, y1: dessous, x2: place.x + demi, y2: dessous + HAUTEUR_DETIQUETTE },
		{ x1: place.x - demi, y1: dessus, x2: place.x + demi, y2: dessus + HAUTEUR_DETIQUETTE }
	];
}

/** La boîte qu'occupe le bloc de titre d'une famille. */
function boiteDeFamille(tete: Place, nom: string, effectif: number): Boite {
	const largeur =
		RETRAIT_DE_LICONE +
		Math.max(
			largeurDeLibelle(nom) * (T_FAMILLE / T_NOEUD),
			largeurDeLibelle(`${effectif} notes`) * (T_FAMILLE_COMPTE / T_NOEUD)
		);
	return {
		x1: tete.x,
		y1: tete.y - T_FAMILLE,
		x2: tete.x + largeur,
		y2: tete.y - T_FAMILLE + BLOC_DE_TITRE
	};
}

/**
 * OÙ S'ÉCRIT LE NOM D'UNE FAMILLE — quatre postes, et le premier libre l'emporte.
 *
 * LE PREMIER EST CELUI DE LA MAQUETTE : en haut à gauche du contour, et c'est celui
 * qu'on obtient dans la très grande majorité des cas.
 *
 * LES TROIS AUTRES EXISTENT PARCE QUE « LE NOM D'UNE FAMILLE N'EST JAMAIS
 * RECOUVERT » EST UNE EXIGENCE. Deux familles voisines de l'anneau écrivent leur
 * nom du même côté, et sur un corpus dense les deux blocs se heurtent — mesuré sur
 * l'univers Substack : « Outils & Tech » par-dessus « Business & Stratégie ».
 *
 * L'AUTRE PARADE AURAIT ÉTÉ DE RÉSERVER LE BLOC DANS LE DISQUE DE SÉPARATION, et
 * elle a été essayée : un nom de vingt caractères est plus large que le rayon de sa
 * famille, si bien que la réserve poussait l'anneau de vingt-trois pour cent et que
 * le dessin entier rapetissait d'autant. Déplacer un nom sur quatre coûte zéro.
 */
const POSTES_DU_TITRE: readonly (readonly [number, number])[] = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[1, 1]
];

/* ── LE REGROUPEMENT EN BRANCHES ───────────────────────────────────────────── */

interface Branche {
	readonly nom: string;
	readonly membres: readonly string[];
	readonly pivot: string;
	/** Vrai pour « Isolées » : la branche part en périphérie. */
	readonly peripherie: boolean;
	/** Le rang de teinte — fixé pour « Isolées », tiré du rang sinon. */
	readonly teinte: number;
	/** Les cercles concentriques et leur rayon, autour du pivot. */
	readonly cercles: readonly { readonly rayon: number; readonly effectif: number }[];
	/** Le rayon du CONTOUR : la dernière couronne de pastilles, plus la marge. */
	readonly bord: number;
	/** Le rayon du disque de séparation — le contour, et de quoi loger le titre. */
	readonly rayon: number;
}

/**
 * LE PIVOT D'UNE FAMILLE : SA NOTE LA PLUS CENTRALE. Le degré tranche d'abord — le
 * nombre de relations qui la touchent —, puis la centralité de passage, puis
 * l'identifiant. Les trois critères ensemble ne laissent aucune égalité : le pivot
 * d'une famille est le même à chaque ouverture.
 */
function pivotDe(membres: readonly string[], mesures: MesuresDeNoeud): string {
	let meilleur = membres[0] as string;
	for (const id of membres) {
		const d = mesures.degre(id) - mesures.degre(meilleur);
		if (d > 0) {
			meilleur = id;
			continue;
		}
		if (d < 0) continue;
		const c = mesures.centralite(id) - mesures.centralite(meilleur);
		if (c > 0) {
			meilleur = id;
			continue;
		}
		if (c < 0) continue;
		if (id.localeCompare(meilleur) < 0) meilleur = id;
	}
	return meilleur;
}

/**
 * LES CERCLES CONCENTRIQUES D'UNE FAMILLE. Chaque cercle prend autant de notes que
 * sa circonférence en admet AU PAS ANGULAIRE — deux pastilles voisines ne peuvent
 * donc pas se toucher, quel que soit l'effectif. L'écart entre deux cercles vaut le
 * diamètre maximal d'une pastille plus le pas : deux cercles ne se touchent pas non
 * plus.
 *
 * LE RAYON MAXIMAL EST PRIS POUR TOUS, ET C'EST VOULU : le réglage « Taille des
 * nœuds » change alors la taille des pastilles SANS DÉPLACER PERSONNE. Une carte
 * qui se réorganise parce qu'on a changé ce que la taille représente ferait perdre
 * le fil à chaque essai.
 */
function cerclesDeFamille(nombre: number): { readonly rayon: number; readonly effectif: number }[] {
	const cercles: { rayon: number; effectif: number }[] = [];
	let restant = nombre;
	let rayon = PIVOT + NOEUD_MAXIMUM + PAS_ENTRE_NOEUDS;
	while (restant > 0) {
		const capacite = Math.max(1, Math.floor((2 * Math.PI * rayon) / PAS_ANGULAIRE));
		const effectif = Math.min(restant, capacite);
		cercles.push({ rayon, effectif });
		restant -= effectif;
		rayon += PAS_ENTRE_CERCLES;
	}
	return cercles;
}

/**
 * LE RAYON DU DISQUE QUI CONTIENT UNE FAMILLE — pastilles et contour.
 *
 * LE BLOC DE TITRE N'Y EST PLUS, ET C'ÉTAIT UNE PERTE MESURÉE. Il y était, ajouté
 * dans TOUTES les directions pour un texte qui ne monte que d'un côté : trente
 * unités de vide autour de chaque famille, soit près de quarante pour cent du
 * disque. Sur dix familles, la contrainte de séparation angulaire portait alors
 * l'anneau à six cent vingt unités pour des amas de quatre-vingt-dix — le dessin
 * était une couronne de petites taches autour d'un grand vide. Vu au navigateur.
 *
 * Le titre se pose désormais DANS la bande du contour, en haut à gauche de l'amas,
 * là où la maquette le montre ; et `etiquettesRetenues()` réserve sa boîte avant
 * tout libellé de nœud, si bien que rien ne peut le recouvrir.
 */
function rayonDeBranche(cercles: readonly { readonly rayon: number }[]): number {
	const dernier = cercles.length === 0 ? PIVOT : (cercles[cercles.length - 1]?.rayon ?? PIVOT);
	const externe = cercles.length === 0 ? PIVOT : dernier + NOEUD_MAXIMUM;
	return externe + MARGE_DE_CONTOUR;
}

/**
 * LES BRANCHES, DANS L'ORDRE OÙ ELLES SERONT POSÉES : par taille décroissante, puis
 * par le rang du chargeur, puis par le nom. « Isolées » passe toujours en dernier —
 * c'est la périphérie, et elle ne prend pas la place d'une famille réelle.
 */
function brancher(g: Graphe, options: OptionsDeCarte): Branche[] {
	const membresParNom = new Map<string, string[]>();
	for (const n of g.noeuds) {
		const declaree = options.familleParNoeud.get(n.id);
		const nom =
			declaree ?? (options.mesures.degre(n.id) === 0 ? NOM_DES_ISOLEES : NOM_HORS_FAMILLE);
		const deja = membresParNom.get(nom);
		if (deja === undefined) membresParNom.set(nom, [n.id]);
		else deja.push(n.id);
	}

	const rangDeReference = new Map(options.ordreDesFamilles.map((nom, i) => [nom, i] as const));
	const rangDe = (nom: string): number => rangDeReference.get(nom) ?? Number.MAX_SAFE_INTEGER;

	const noms = [...membresParNom.keys()].sort((a, b) => {
		const aPeripherie = a === NOM_DES_ISOLEES;
		const bPeripherie = b === NOM_DES_ISOLEES;
		if (aPeripherie !== bPeripherie) return aPeripherie ? 1 : -1;
		const ecart = (membresParNom.get(b)?.length ?? 0) - (membresParNom.get(a)?.length ?? 0);
		if (ecart !== 0) return ecart;
		const rang = rangDe(a) - rangDe(b);
		return rang !== 0 ? rang : a.localeCompare(b);
	});

	return noms.map((nom, rang) => {
		const membres = membresParNom.get(nom) as string[];
		const pivot = pivotDe(membres, options.mesures);
		const cercles = cerclesDeFamille(membres.length - 1);
		const bord = rayonDeBranche(cercles);
		return {
			nom,
			membres,
			pivot,
			peripherie: nom === NOM_DES_ISOLEES,
			teinte: nom === NOM_DES_ISOLEES ? TEINTE_DES_ISOLEES : rang % (TEINTES_DE_FAMILLE - 1),
			cercles,
			bord,
			rayon: bord
		};
	});
}

/* ── L'ANNEAU DES FAMILLES ─────────────────────────────────────────────────── */

interface Secteur {
	readonly branche: Branche;
	/** L'angle attribué, en radians. */
	readonly angle: number;
	/** L'angle du milieu du secteur — la direction de la branche. */
	readonly direction: number;
	/** Où le centre de la branche se pose, sur l'anneau. */
	readonly centre: Place;
}

/**
 * L'ANNEAU EST UNE ELLIPSE, PAS UN CERCLE, ET C'EST UNE MESURE.
 *
 * Un anneau circulaire dans une zone d'affichage plus large que haute laisse deux
 * bandes vides sur les côtés : le dessin se cadre alors sur la HAUTEUR, et tout —
 * pastilles, traits, libellés — rapetisse d'autant. Mesuré sur l'univers Substack
 * dans une toile de mille deux sur sept cent dix-neuf : le dessin n'occupait que
 * sept cent soixante pixels de large sur mille deux disponibles, et les noms de
 * famille tombaient sous neuf pixels.
 *
 * L'anneau est donc étiré dans le rapport du repère, à SURFACE CONSTANTE : les
 * familles s'écartent horizontalement, se rapprochent verticalement, et le dessin
 * remplit sa zone. La séparation est revérifiée APRÈS l'étirement — c'est le point
 * délicat, car deux familles voisines en haut de l'anneau se rapprochent quand on
 * l'aplatit.
 */
const PROPORTION_DU_REPERE = REPERE_LARGEUR / REPERE_HAUTEUR;
export const ETIREMENT_X = Math.sqrt(PROPORTION_DU_REPERE);
export const ETIREMENT_Y = 1 / ETIREMENT_X;

/**
 * LA DISTANCE DE L'ANNEAU, ET LES SECTEURS.
 *
 * Chaque famille reçoit un secteur PROPORTIONNEL à son nombre de notes ; mais un
 * secteur proportionnel ne suffit pas à séparer les contours — une famille de deux
 * notes reçoit un angle minuscule, et son disque déborde largement sur ses voisines.
 * L'angle est donc RELEVÉ au minimum géométrique : celui sous lequel son disque,
 * marge comprise, se voit depuis le centre. Si la somme dépasse le tour complet,
 * l'anneau s'écarte et l'on recommence — le minimum géométrique décroît avec la
 * distance, donc la boucle converge.
 *
 * CE QUI RESTE APRÈS COUP est redistribué au prorata des angles visés : la
 * proportionnalité est ainsi tenue partout où la géométrie ne s'y oppose pas.
 */
function anneauDesFamilles(branches: readonly Branche[]): Secteur[] {
	if (branches.length === 0) return [];

	const total = branches.reduce((somme, b) => somme + b.membres.length, 0) || 1;
	const rayonMaximal = Math.max(...branches.map((b) => b.rayon));

	let distance = CENTRE + rayonMaximal + MARGE_ENTRE_FAMILLES;

	/* Une seule branche : elle se pose au nord, et il n'y a pas de secteur à partager. */
	if (branches.length === 1) {
		const seule = branches[0] as Branche;
		const d = seule.peripherie ? distance * REJET_DES_ISOLEES : distance;
		return [
			{
				branche: seule,
				angle: 2 * Math.PI,
				direction: -Math.PI / 2,
				centre: { x: 0, y: -d }
			}
		];
	}

	/**
	 * L'ANGLE SOUS LEQUEL LE DISQUE D'UNE FAMILLE SE VOIT DEPUIS LE CENTRE. C'est le
	 * minimum au-dessous duquel deux contours voisins se touchent.
	 */
	const besoin = (b: Branche, d: number): number =>
		2 * Math.asin(Math.min(0.999, (b.rayon + MARGE_ENTRE_FAMILLES / 2) / d));

	/**
	 * L'ANNEAU S'ÉCARTE JUSQU'À CE QUE LES MINIMUMS TIENNENT DANS LE TOUR, ET PAS
	 * PLUS LOIN.
	 *
	 * IL S'ÉCARTAIT JUSQU'À CE QUE LA PROPORTIONNALITÉ TIENNE, et c'était le défaut :
	 * dans un univers de cent quarante-huit notes, une famille de DEUX reçoit huit
	 * centièmes de radian ; pour qu'un disque de soixante-seize unités s'y voie, il
	 * faut reculer l'anneau à mille neuf cent cinquante — et tout le dessin, familles
	 * comprises, rapetissait au cinquième. Mesuré au navigateur sur l'univers réel :
	 * un repère de cinq mille cent quatre-vingt-sept unités pour mille pixels, et pas
	 * un nom de famille lisible.
	 *
	 * CHAQUE FAMILLE GARDE DONC SON MINIMUM GÉOMÉTRIQUE, et c'est LE SURPLUS qui se
	 * partage au prorata du nombre de notes. La proportionnalité est tenue partout où
	 * la géométrie la laisse tenir, et l'anneau ne recule que pour ce qui l'y oblige
	 * vraiment : la somme des minimums.
	 */
	let minimums: number[] = [];
	for (let tour = 0; tour < TOURS_DANSEMBLE; tour += 1) {
		minimums = branches.map((b) => besoin(b, distance));
		const somme = minimums.reduce((a, b) => a + b, 0);
		if (somme <= 2 * Math.PI) break;
		distance *= somme / (2 * Math.PI);
	}

	const sommeDesMinimums = minimums.reduce((a, b) => a + b, 0);
	const reste = Math.max(0, 2 * Math.PI - sommeDesMinimums);
	const larges = branches.map((b, i) => (minimums[i] ?? 0) + (reste * b.membres.length) / total);

	/* LE SENS HORAIRE À PARTIR DU HAUT. Dans le repère du dessin l'axe des
	   ordonnées descend : l'angle croissant tourne donc dans le sens des aiguilles,
	   et le haut vaut moins un quart de tour. */
	const directions: number[] = [];
	let curseur = -Math.PI / 2;
	branches.forEach((_, i) => {
		const angle = larges[i] ?? 0;
		directions.push(curseur + angle / 2);
		curseur += angle;
	});

	/* L'ÉTIREMENT, PUIS LA VÉRIFICATION. Le facteur rend de combien l'anneau est
	   trop serré, toutes paires confondues ET par rapport au disque du centre ; il
	   vaut un quand plus rien ne se touche. La boucle converge parce que toutes les
	   distances croissent avec l'anneau, et les rayons non. */
	const centres = (d: number): Place[] =>
		branches.map((branche, i) => {
			const rayon = branche.peripherie ? d * REJET_DES_ISOLEES : d;
			const direction = directions[i] ?? 0;
			return {
				x: Math.cos(direction) * rayon * ETIREMENT_X,
				y: Math.sin(direction) * rayon * ETIREMENT_Y
			};
		});

	for (let tour = 0; tour < TOURS_DANSEMBLE; tour += 1) {
		const poses = centres(distance);
		let facteur = 1;
		poses.forEach((a, i) => {
			const ra = (branches[i] as Branche).rayon;
			/* Aucune famille ne recouvre le disque du centre. */
			const auCentre = Math.hypot(a.x, a.y);
			if (auCentre > 0) {
				facteur = Math.max(facteur, (CENTRE + ra + MARGE_ENTRE_FAMILLES) / auCentre);
			}
			poses.forEach((b, k) => {
				if (k <= i) return;
				const rb = (branches[k] as Branche).rayon;
				const ecart = Math.hypot(a.x - b.x, a.y - b.y);
				if (ecart > 0) facteur = Math.max(facteur, (ra + rb + MARGE_ENTRE_FAMILLES) / ecart);
			});
		});
		if (facteur <= 1.0001) break;
		distance *= facteur;
	}

	const poses = centres(distance);
	return branches.map((branche, i) => ({
		branche,
		angle: larges[i] ?? 0,
		direction: directions[i] ?? 0,
		centre: poses[i] as Place
	}));
}

/* ── LA CARTE ──────────────────────────────────────────────────────────────── */

/**
 * LA CARTE D'UN PÉRIMÈTRE — le squelette en arbre, les familles sur leur anneau, les
 * notes sur leurs cercles.
 */
export function disposerLaCarte(g: Graphe, options: OptionsDeCarte): CarteDisposee {
	const branches = brancher(g, options);
	const secteurs = anneauDesFamilles(branches);

	const origine: Place = { x: 0, y: 0 };
	const places = new Map<string, NoeudPlace>();
	const squelette: TraitDeSquelette[] = [];
	const familles: ContourDeFamille[] = [];
	/** Les blocs de titre déjà posés — c'est eux que le poste suivant évite. */
	const titresPris: Boite[] = [];

	for (const secteur of secteurs) {
		const { branche } = secteur;
		const centre: Place = {
			x: origine.x + secteur.centre.x,
			y: origine.y + secteur.centre.y
		};

		places.set(branche.pivot, {
			id: branche.pivot,
			x: centre.x,
			y: centre.y,
			r: PIVOT,
			pivot: true,
			famille: branche.nom,
			teinte: branche.teinte
		});

		squelette.push({ x1: origine.x, y1: origine.y, x2: centre.x, y2: centre.y });

		/* Les membres autres que le pivot, dans un ordre déterministe : le plus
		   connecté d'abord, l'identifiant tranchant les égalités. */
		const autres = branche.membres
			.filter((id) => id !== branche.pivot)
			.sort((a, b) => options.mesures.degre(b) - options.mesures.degre(a) || a.localeCompare(b));

		let rang = 0;
		branche.cercles.forEach((cercle, k) => {
			/* LE PREMIER NŒUD D'UN CERCLE PART DU CÔTÉ OPPOSÉ AU CENTRE DU DESSIN, et
			   chaque cercle est décalé d'un demi-pas : sans ce décalage, les nœuds de
			   deux cercles voisins s'alignent sur le même rayon, et le trait
			   d'appartenance de l'un traverse la pastille de l'autre. */
			const depart = secteur.direction + Math.PI + (k % 2 === 0 ? 0 : Math.PI / cercle.effectif);
			for (let i = 0; i < cercle.effectif; i += 1) {
				const id = autres[rang];
				rang += 1;
				if (id === undefined) break;
				const angle = depart + (2 * Math.PI * i) / cercle.effectif;
				const x = centre.x + Math.cos(angle) * cercle.rayon;
				const y = centre.y + Math.sin(angle) * cercle.rayon;
				places.set(id, {
					id,
					x,
					y,
					r: options.mesures.rayon(id),
					pivot: false,
					famille: branche.nom,
					teinte: branche.teinte
				});
				squelette.push({ x1: centre.x, y1: centre.y, x2: x, y2: y });
			}
		});

		const points = branche.membres.map((id) => places.get(id) as NoeudPlace);
		const chemin = contourDeGroupe(
			points,
			points.map((p) => (p.pivot ? PIVOT : NOEUD_MAXIMUM)),
			MARGE_DE_CONTOUR
		);
		if (chemin === null) continue;

		/* LE NOM SE POSE EN HAUT À GAUCHE DU CONTOUR, sur un cercle à neuf dixièmes
		   du bord : dehors de la dernière couronne de pastilles, dedans du contour —
		   la seule bande qui ne dispute rien. Le poste bascule sur l'un des trois
		   autres coins si le bloc heurte celui d'une famille déjà posée : voir
		   `POSTES_DU_TITRE`. */
		let tete: Place = { x: 0, y: 0 };
		for (const [dx, dy] of POSTES_DU_TITRE) {
			tete = {
				x: centre.x + dx * branche.bord * ANCRAGE_DU_TITRE,
				y: centre.y + dy * branche.bord * ANCRAGE_DU_TITRE
			};
			const essai = boiteDeFamille(tete, branche.nom, branche.membres.length);
			if (!titresPris.some((prise) => seHeurtent(prise, essai))) break;
		}
		titresPris.push(boiteDeFamille(tete, branche.nom, branche.membres.length));

		familles.push({
			cle: branche.pivot,
			nom: branche.nom,
			effectif: branche.membres.length,
			teinte: branche.teinte,
			secteur: secteur.angle,
			chemin,
			tete,
			pivot: branche.pivot,
			centre,
			rayon: branche.rayon
		});
	}

	const centreDuDessin: CentreDeCarte = {
		x: origine.x,
		y: origine.y,
		r: CENTRE,
		libelle: options.perimetre.nom,
		code: options.perimetre.code,
		note: null
	};

	return {
		centre: centreDuDessin,
		noeuds: [...places.values()],
		places,
		familles,
		squelette,
		repere: repereDe(places, familles, centreDuDessin),
		...marquerLesEtiquettes(etiquettesRetenues(places, familles, options.mesures, (p) => p.pivot))
	};
}

/* ── LE REPÈRE ─────────────────────────────────────────────────────────────── */

/**
 * LE REPÈRE DU DESSIN — ce que la vue pose en `viewBox`.
 *
 * IL EST CALCULÉ SUR LE CONTENU, ET NON L'INVERSE. Un repère fixe obligerait à
 * mettre le dessin à l'échelle par une transformation : les traits, les pastilles et
 * les textes s'épaissiraient ou s'amincireraient avec elle, et les libellés d'un
 * grand corpus deviendraient illisibles pendant que ceux d'un petit deviendraient
 * énormes. Le repère suit le dessin ; tout y garde ses proportions.
 *
 * SES PROPORTIONS SONT CELLES DE LA ZONE, sans quoi le rendu SVG laisserait deux
 * bandes vides sur les côtés — `preserveAspectRatio` conserve le rapport.
 */
function repereDe(
	places: ReadonlyMap<string, NoeudPlace>,
	familles: readonly ContourDeFamille[],
	centre: CentreDeCarte
): Repere {
	/**
	 * UN DESSIN SANS UN SEUL NŒUD REND LE REPÈRE DE PLANCHE, et il le faut : cadré
	 * sur le seul disque du centre, il le grossissait jusqu'à remplir tout le
	 * canevas — un aplat vert de mille pixels sous le voile de l'état vide. Mesuré
	 * au navigateur sur une instance neuve.
	 */
	if (places.size === 0 && familles.length === 0) {
		return {
			x: centre.x - REPERE_LARGEUR / 2,
			y: centre.y - REPERE_HAUTEUR / 2,
			largeur: REPERE_LARGEUR,
			hauteur: REPERE_HAUTEUR
		};
	}

	let minX = centre.x - centre.r;
	let maxX = centre.x + centre.r;
	let minY = centre.y - centre.r;
	let maxY = centre.y + centre.r;

	const etendre = (x: number, y: number, marge: number): void => {
		minX = Math.min(minX, x - marge);
		maxX = Math.max(maxX, x + marge);
		minY = Math.min(minY, y - marge);
		maxY = Math.max(maxY, y + marge);
	};

	for (const place of places.values()) etendre(place.x, place.y, place.r + MARGE_DE_CONTOUR);
	for (const famille of familles) {
		etendre(famille.centre.x, famille.centre.y, famille.rayon);
		/* LE BLOC DE TITRE ENTRE DANS LE REPÈRE PAR SA BOÎTE RÉELLE : il n'est plus
		   compris dans le disque de séparation, et un nom long dépasse largement du
		   contour de sa famille. Sans cela, le dessin s'ouvrait avec un nom coupé. */
		const titre = boiteDeFamille(famille.tete, famille.nom, famille.effectif);
		etendre(titre.x1, titre.y1, 0);
		etendre(titre.x2, titre.y2, 0);
	}

	const largeur = Math.max(1, maxX - minX) + REPERE_MARGE * 2;
	const hauteur = Math.max(1, maxY - minY) + REPERE_MARGE * 2;
	const proportion = REPERE_LARGEUR / REPERE_HAUTEUR;

	/* La dimension déficitaire est complétée : le dessin n'est jamais déformé. */
	const largeurFinale = Math.max(largeur, hauteur * proportion);
	const hauteurFinale = Math.max(hauteur, largeur / proportion);

	return {
		x: (minX + maxX) / 2 - largeurFinale / 2,
		y: (minY + maxY) / 2 - hauteurFinale / 2,
		largeur: largeurFinale,
		hauteur: hauteurFinale
	};
}

/* ── LES ÉTIQUETTES ────────────────────────────────────────────────────────── */

/**
 * LES LIBELLÉS ÉCRITS D'OFFICE, ET AUCUN N'EN RECOUVRE UN AUTRE.
 *
 * Les noms de famille sont réservés EN PREMIER : ils sont le seul repère permanent
 * du dessin, et « le nom d'une famille n'est jamais recouvert » est une exigence,
 * pas une préférence. Les libellés de nœud viennent ensuite, du plus gros au plus
 * petit — à rayon égal, l'identifiant tranche, pour que le classement ne dépende
 * pas de l'ordre de la requête. Un libellé qui en heurterait un autre est TU ; il
 * reparaît au survol, à la sélection, et au-delà du seuil de zoom.
 */
function etiquettesRetenues(
	places: ReadonlyMap<string, NoeudPlace>,
	familles: readonly ContourDeFamille[],
	mesures: MesuresDeNoeud,
	admis: (place: NoeudPlace) => boolean
): { ecrits: ReadonlySet<string>; auDessus: ReadonlySet<string> } {
	const prises: Boite[] = familles.map((f) => boiteDeFamille(f.tete, f.nom, f.effectif));

	const candidats = [...places.values()]
		.filter(admis)
		.sort((a, b) => b.r - a.r || a.id.localeCompare(b.id));

	const retenus: string[] = [];
	const dessus: string[] = [];
	for (const place of candidats) {
		const postes = boitesDeLibelle(place, libelleCourt(mesures.titre(place.id)));
		const libre = postes.findIndex((boite) => !prises.some((prise) => seHeurtent(prise, boite)));
		if (libre < 0) continue;
		prises.push(postes[libre] as Boite);
		retenus.push(place.id);
		if (libre === 1) dessus.push(place.id);
	}
	return { ecrits: new Set(retenus), auDessus: new Set(dessus) };
}

/** Le résultat du placement des libellés, sous la forme que la carte porte. */
function marquerLesEtiquettes(retenues: {
	ecrits: ReadonlySet<string>;
	auDessus: ReadonlySet<string>;
}): { etiquettes: ReadonlySet<string>; etiquettesAuDessus: ReadonlySet<string> } {
	return { etiquettes: retenues.ecrits, etiquettesAuDessus: retenues.auDessus };
}

/* ── LE VOISINAGE D'UNE NOTE ───────────────────────────────────────────────── */

export interface OptionsDeVoisinage {
	readonly centre: string;
	readonly familleParNoeud: ReadonlyMap<string, string>;
	readonly ordreDesFamilles: readonly string[];
	readonly mesures: MesuresDeNoeud;
	/** La profondeur de chaque nœud depuis le centre — 0 pour le centre lui-même. */
	readonly distances: ReadonlyMap<string, number>;
	/** Les voisins de chaque nœud dans le graphe affiché, relations ET affinités. */
	readonly voisinsDe: (id: string) => readonly string[];
	/** Le code court écrit sous le titre du centre — vide s'il n'y en a pas. */
	readonly code: string;
}

/** L'écart radial entre deux profondeurs successives. */
const ECART_DE_PROFONDEUR = PAS_ENTRE_CERCLES * 3.6;

/**
 * LE VOISINAGE D'UNE NOTE — la note au centre, ses voisins en amas, leurs voisins
 * au-delà.
 *
 * L'ÉCRAN S'EST D'ABORD FAIT EN UN SEUL CERCLE, et c'était le défaut : dix-huit
 * voisins directs répartis à espacement égal sur un cercle, chacun portant son
 * libellé, imposent un rayon de quatre cents unités — et le contour d'une famille
 * de sept membres devient alors un CROISSANT qui traverse le quart du dessin. Vu
 * au navigateur sur le voisinage de « Claude Code ».
 *
 * LES VOISINS SONT DONC GROUPÉS PAR FAMILLE, EN AMAS COMPACTS. Chaque famille
 * reçoit un secteur d'un seul tenant, proportionnel au nombre de nœuds qu'elle
 * porte, et ses voisins directs se posent sur un petit cercle au milieu de ce
 * secteur. Un voisin sans famille forme son propre amas, sans contour. C'est ce que
 * la maquette montre — de petites bulles nommées autour de la note —, et c'est ce
 * qui garantit qu'aucun contour n'en recouvre un autre : deux amas disjoints ont
 * deux enveloppes disjointes.
 *
 * LES VOISINS DE PROFONDEUR 2 SONT PLACÉS AU-DELÀ DE LEUR VOISIN DE PROFONDEUR 1,
 * dans sa direction, et ainsi de suite : le lien de parenté se lit sur le trait du
 * squelette, qui va toujours du plus proche au plus lointain.
 *
 * LES LIBELLÉS SONT TOUS ÉCRITS, et le rayon des amas est calculé pour qu'ils
 * tiennent : c'est ce qu'on vient chercher sur cet écran.
 */
export function disposerLeVoisinage(g: Graphe, options: OptionsDeVoisinage): CarteDisposee {
	const origine: Place = { x: 0, y: 0 };
	const places = new Map<string, NoeudPlace>();
	const squelette: TraitDeSquelette[] = [];

	/* ── L'arbre des parentés ───────────────────────────────────────────────
	   Chaque nœud de profondeur p est rattaché au PREMIER de ses voisins de
	   profondeur p−1, dans l'ordre des identifiants : le rattachement ne dépend
	   donc pas de l'ordre de la requête. */
	const profondeurDe = (id: string): number => options.distances.get(id) ?? -1;
	const enfants = new Map<string, string[]>();
	const parents = new Map<string, string>();

	const parProfondeur = new Map<number, string[]>();
	for (const n of g.noeuds) {
		const p = profondeurDe(n.id);
		if (p < 0) continue;
		const deja = parProfondeur.get(p);
		if (deja === undefined) parProfondeur.set(p, [n.id]);
		else deja.push(n.id);
	}
	for (const liste of parProfondeur.values()) liste.sort((a, b) => a.localeCompare(b));

	const profondeurMaximale = Math.max(0, ...parProfondeur.keys());
	for (let p = 1; p <= profondeurMaximale; p += 1) {
		for (const id of parProfondeur.get(p) ?? []) {
			const parent = [...options.voisinsDe(id)]
				.filter((v) => profondeurDe(v) === p - 1)
				.sort((a, b) => a.localeCompare(b))[0];
			if (parent === undefined) continue;
			parents.set(id, parent);
			const deja = enfants.get(parent);
			if (deja === undefined) enfants.set(parent, [id]);
			else deja.push(id);
		}
	}

	/** Le nombre de nœuds sous un voisin direct, lui compris — sa part de secteur. */
	const poids = new Map<string, number>();
	const peser = (id: string): number => {
		const deja = poids.get(id);
		if (deja !== undefined) return deja;
		const dessous = enfants.get(id) ?? [];
		const valeur = 1 + dessous.reduce((s, e) => s + peser(e), 0);
		poids.set(id, valeur);
		return valeur;
	};

	const premiers = parProfondeur.get(1) ?? [];
	for (const id of premiers) peser(id);

	/* ── Les amas : une famille, un secteur ─────────────────────────────────
	   Un voisin sans famille forme son propre amas, et il n'a pas de contour : une
	   note que rien ne rapproche d'une autre ne se cerne pas. */
	const familleDe = (id: string): string | null => options.familleParNoeud.get(id) ?? null;

	interface Amas {
		readonly nom: string | null;
		readonly membres: string[];
		readonly poids: number;
		/** Le rayon du petit cercle qui porte les voisins directs de l'amas. */
		readonly rayonInterne: number;
		/** Le rayon du disque qui contient l'amas, contour compris. */
		readonly rayon: number;
	}

	const parNom = new Map<string, string[]>();
	const solitaires: string[] = [];
	for (const id of premiers) {
		const nom = familleDe(id);
		if (nom === null) {
			solitaires.push(id);
			continue;
		}
		const deja = parNom.get(nom);
		if (deja === undefined) parNom.set(nom, [id]);
		else deja.push(id);
	}

	const rangDeReference = new Map(options.ordreDesFamilles.map((nom, i) => [nom, i] as const));
	const nomsOrdonnes = [...parNom.keys()].sort((a, b) => {
		const ecart = (parNom.get(b)?.length ?? 0) - (parNom.get(a)?.length ?? 0);
		if (ecart !== 0) return ecart;
		const rang =
			(rangDeReference.get(a) ?? Number.MAX_SAFE_INTEGER) -
			(rangDeReference.get(b) ?? Number.MAX_SAFE_INTEGER);
		return rang !== 0 ? rang : a.localeCompare(b);
	});

	/** La place qu'un libellé demande sur un cercle, pastille comprise. */
	const pasDuLibelle = (id: string): number =>
		Math.max(
			largeurDeLibelle(libelleCourt(options.mesures.titre(id))) + MARGE_DETIQUETTE * 2,
			PAS_ANGULAIRE
		);

	/**
	 * LE RAYON DU PETIT CERCLE PORTANT `n` VOISINS DIRECTS. Il se règle sur la CORDE
	 * entre deux voisins, jamais sur la circonférence : deux libellés se heurtent
	 * quand la corde qui les sépare est plus courte que le plus large des deux, et
	 * un partage de circonférence laisse justement les cordes trop courtes pour les
	 * petits effectifs. À deux membres, la circonférence dit 48 unités et la corde
	 * en exige 75.
	 */
	const rayonInterneDe = (membres: readonly string[]): number => {
		if (membres.length < 2) return 0;
		const pas = membres.reduce((large, id) => Math.max(large, pasDuLibelle(id)), PAS_ANGULAIRE);
		return pas / (2 * Math.sin(Math.PI / membres.length));
	};

	const amas: Amas[] = [
		...nomsOrdonnes.map((nom) => {
			const membres = parNom.get(nom) as string[];
			const rayonInterne = rayonInterneDe(membres);
			return {
				nom,
				membres,
				poids: membres.reduce((s, id) => s + (poids.get(id) ?? 1), 0),
				rayonInterne,
				rayon: rayonInterne + NOEUD_MAXIMUM + MARGE_DE_CONTOUR
			};
		}),
		...solitaires.map((id) => ({
			nom: null,
			membres: [id],
			poids: poids.get(id) ?? 1,
			rayonInterne: 0,
			rayon:
				NOEUD_MAXIMUM +
				MARGE_DE_CONTOUR +
				largeurDeLibelle(libelleCourt(options.mesures.titre(id))) / 2
		}))
	];

	if (amas.length === 0) {
		return voisinageVide(options, places, squelette);
	}

	/* ── L'anneau des amas, sur la même ellipse que la cartographie ────────── */
	const poidsTotal = amas.reduce((s, a) => s + a.poids, 0) || 1;
	const vises = amas.map((a) => (2 * Math.PI * a.poids) / poidsTotal);
	let distance = CENTRE + Math.max(...amas.map((a) => a.rayon)) + MARGE_ENTRE_FAMILLES;

	let angles: number[] = vises;
	if (amas.length > 1) {
		for (let tour = 0; tour < TOURS_DANSEMBLE; tour += 1) {
			angles = amas.map((a, i) =>
				Math.max(
					vises[i] ?? 0,
					2 * Math.asin(Math.min(0.999, (a.rayon + MARGE_ENTRE_FAMILLES / 2) / distance))
				)
			);
			const somme = angles.reduce((x, y) => x + y, 0);
			if (somme <= 2 * Math.PI) break;
			distance *= somme / (2 * Math.PI);
		}
	}

	const directions: number[] = [];
	let curseur = -Math.PI / 2;
	for (const angle of angles) {
		directions.push(curseur + angle / 2);
		curseur += angle;
	}

	const centresDAmas = (d: number): Place[] =>
		directions.map((direction) => ({
			x: Math.cos(direction) * d * ETIREMENT_X,
			y: Math.sin(direction) * d * ETIREMENT_Y
		}));

	for (let tour = 0; tour < TOURS_DANSEMBLE; tour += 1) {
		const poses = centresDAmas(distance);
		let facteur = 1;
		poses.forEach((a, i) => {
			const ra = (amas[i] as Amas).rayon;
			const auCentre = Math.hypot(a.x, a.y);
			if (auCentre > 0) {
				facteur = Math.max(facteur, (CENTRE + ra + MARGE_ENTRE_FAMILLES) / auCentre);
			}
			poses.forEach((b, k) => {
				if (k <= i) return;
				const rb = (amas[k] as Amas).rayon;
				const ecart = Math.hypot(a.x - b.x, a.y - b.y);
				if (ecart > 0) facteur = Math.max(facteur, (ra + rb + MARGE_ENTRE_FAMILLES) / ecart);
			});
		});
		if (facteur <= 1.0001) break;
		distance *= facteur;
	}

	const centres = centresDAmas(distance);

	/* ── Le placement ───────────────────────────────────────────────────────
	   Les voisins directs d'un amas se posent sur son petit cercle ; leurs propres
	   voisins se posent AU-DELÀ, dans la direction qui va du centre du dessin vers
	   eux, en éventail. */
	/**
	 * LE CONTOUR D'UNE FAMILLE SE BORNE À SON AMAS, et c'est ce qui garantit qu'aucun
	 * contour n'en recouvre un autre. Une famille peut réapparaître à deux endroits
	 * du dessin — un de ses membres est voisin direct ici, un autre est descendant
	 * d'un voisin là-bas —, et l'enveloppe des deux traverserait tout l'écran. Mesuré
	 * au navigateur à la profondeur 2 : le contour de « Développement » passait
	 * par-dessus celui d'« Installation ».
	 */
	const membresDAmas = new Map<number, string[]>();

	const poserLeNoeud = (
		id: string,
		x: number,
		y: number,
		depart: Place,
		amasCourant: number
	): void => {
		places.set(id, {
			id,
			x,
			y,
			r: options.mesures.rayon(id),
			pivot: false,
			famille: familleDe(id),
			teinte: null
		});
		const deja = membresDAmas.get(amasCourant);
		if (deja === undefined) membresDAmas.set(amasCourant, [id]);
		else deja.push(id);
		squelette.push({ x1: depart.x, y1: depart.y, x2: x, y2: y });
	};

	const poserLaDescendance = (id: string, amasCourant: number, ouvertureMax: number): void => {
		const dessous = enfants.get(id) ?? [];
		if (dessous.length === 0) return;
		const parent = places.get(id) as NoeudPlace;
		const norme = Math.hypot(parent.x, parent.y) || 1;
		const direction = Math.atan2(parent.y, parent.x);
		const rayon = norme + ECART_DE_PROFONDEUR;
		/* L'ÉVENTAIL S'OUVRE JUSTE ASSEZ POUR LES LIBELLÉS, et JAMAIS AU-DELÀ DU
		   SECTEUR DE SON AMAS : sans cette borne, la descendance d'un voisin déborde
		   sur l'amas d'à côté, et les deux contours se recouvrent. */
		const demande = dessous.reduce((somme, e) => somme + pasDuLibelle(e), 0);
		const ouverture = Math.min(ouvertureMax, demande / rayon);
		dessous.forEach((enfant, i) => {
			const part = dessous.length === 1 ? 0 : i / (dessous.length - 1) - 0.5;
			const angle = direction + part * ouverture;
			poserLeNoeud(enfant, Math.cos(angle) * rayon, Math.sin(angle) * rayon, parent, amasCourant);
			poserLaDescendance(enfant, amasCourant, ouvertureMax);
		});
	};

	amas.forEach((groupe, i) => {
		const centre = centres[i] as Place;
		const direction = directions[i] ?? 0;
		const ouvertureMax = (angles[i] ?? Math.PI / 4) * 0.7;
		groupe.membres.forEach((id, rang) => {
			if (groupe.membres.length === 1) {
				poserLeNoeud(id, centre.x, centre.y, origine, i);
			} else {
				/* Le premier membre part du côté opposé au centre du dessin : l'amas
				   s'ouvre vers l'extérieur, jamais vers la note qu'on explore. */
				const angle = direction + Math.PI + (2 * Math.PI * rang) / groupe.membres.length;
				poserLeNoeud(
					id,
					centre.x + Math.cos(angle) * groupe.rayonInterne,
					centre.y + Math.sin(angle) * groupe.rayonInterne,
					origine,
					i
				);
			}
		});
		for (const id of groupe.membres) poserLaDescendance(id, i, ouvertureMax);
	});

	/* ── Les contours ───────────────────────────────────────────────────────── */
	const familles: ContourDeFamille[] = [];
	const titresPris: Boite[] = [];
	amas.forEach((groupe, i) => {
		const nom = groupe.nom;
		if (nom === null) return;
		const rang = nomsOrdonnes.indexOf(nom);
		const membres = (membresDAmas.get(i) ?? [])
			.filter((id) => familleDe(id) === nom)
			.map((id) => places.get(id) as NoeudPlace);
		if (membres.length < 2) return;
		const chemin = contourDeGroupe(
			membres,
			membres.map((m) => m.r),
			MARGE_DE_CONTOUR
		);
		if (chemin === null) return;
		const centreDeFamille: Place = {
			x: membres.reduce((s, m) => s + m.x, 0) / membres.length,
			y: membres.reduce((s, m) => s + m.y, 0) / membres.length
		};
		const bord = Math.max(
			...membres.map((m) => Math.hypot(m.x - centreDeFamille.x, m.y - centreDeFamille.y) + m.r)
		);
		let tete: Place = { x: 0, y: 0 };
		for (const [dx, dy] of POSTES_DU_TITRE) {
			tete = {
				x: centreDeFamille.x + dx * (bord + MARGE_DE_CONTOUR) * ANCRAGE_DU_TITRE,
				y: centreDeFamille.y + dy * (bord + MARGE_DE_CONTOUR) * ANCRAGE_DU_TITRE
			};
			const essai = boiteDeFamille(tete, nom, membres.length);
			if (!titresPris.some((prise) => seHeurtent(prise, essai))) break;
		}
		titresPris.push(boiteDeFamille(tete, nom, membres.length));
		familles.push({
			cle: (membres[0] as NoeudPlace).id,
			nom,
			effectif: membres.length,
			teinte: rang % (TEINTES_DE_FAMILLE - 1),
			secteur: angles[i] ?? 0,
			chemin,
			tete,
			pivot: (membres[0] as NoeudPlace).id,
			centre: centreDeFamille,
			rayon: bord + MARGE_DE_CONTOUR
		});
	});

	const centre: CentreDeCarte = {
		x: origine.x,
		y: origine.y,
		r: CENTRE,
		libelle: options.mesures.titre(options.centre),
		code: options.code,
		note: options.centre
	};

	places.set(options.centre, {
		id: options.centre,
		x: origine.x,
		y: origine.y,
		r: CENTRE,
		pivot: true,
		famille: options.familleParNoeud.get(options.centre) ?? null,
		teinte: null
	});

	return {
		centre,
		noeuds: [...places.values()],
		places,
		familles,
		squelette,
		repere: repereDe(places, familles, centre),
		/* TOUS LES LIBELLÉS SONT ÉCRITS DANS CETTE VUE — c'est ce qu'on y vient
		   chercher —, et le rayon des amas a été calculé pour qu'ils tiennent. Le
		   contrôle de chevauchement reste, en dernier recours. */
		...marquerLesEtiquettes(
			etiquettesRetenues(places, familles, options.mesures, (p) => p.id !== options.centre)
		)
	};
}

/** Un voisinage sans un seul voisin : la note, seule au milieu de son écran. */
function voisinageVide(
	options: OptionsDeVoisinage,
	places: Map<string, NoeudPlace>,
	squelette: TraitDeSquelette[]
): CarteDisposee {
	const centre: CentreDeCarte = {
		x: 0,
		y: 0,
		r: CENTRE,
		libelle: options.mesures.titre(options.centre),
		code: options.code,
		note: options.centre
	};
	places.set(options.centre, {
		id: options.centre,
		x: 0,
		y: 0,
		r: CENTRE,
		pivot: true,
		famille: options.familleParNoeud.get(options.centre) ?? null,
		teinte: null
	});
	return {
		centre,
		noeuds: [...places.values()],
		places,
		familles: [],
		squelette,
		repere: repereDe(places, [], centre),
		etiquettes: new Set<string>(),
		etiquettesAuDessus: new Set<string>()
	};
}
