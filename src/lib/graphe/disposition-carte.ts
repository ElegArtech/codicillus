/** Placement déterministe : seuls les liens du graphe exercent une attraction. */
import { contourDeGroupe, type Graphe, type Place } from './cartographie';
import {
	HAUTEUR_DETIQUETTE,
	LARGEUR_DE_CARACTERE,
	MARGE_DETIQUETTE,
	MARGE_DE_CONTOUR,
	NOEUD_MAXIMUM,
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

export const NOM_DES_ISOLEES = 'Isolées';
export const NOM_HORS_FAMILLE = 'Hors famille';
export const DESCENTE_DU_COMPTE = T_FAMILLE_COMPTE + MARGE_DETIQUETTE;
export const RETRAIT_DE_LICONE = 16;
export const CARACTERES_DUN_LIBELLE = 22;
const BLOC_DE_TITRE = T_FAMILLE + T_FAMILLE_COMPTE + MARGE_DETIQUETTE * 2;

export interface NoeudPlace {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly r: number;
	/** Vrai pour la note consultée dans le voisinage. */
	readonly pivot: boolean;
	readonly famille: string | null;
	/** Le rang de teinte de sa famille, ou `null` — voir `carto-jetons.css`. */
	readonly teinte: number | null;
}

export interface ContourDeFamille {
	readonly cle: string;
	readonly nom: string;
	readonly effectif: number;
	readonly membres?: readonly string[];
	readonly teinte: number;
	/** Conservé pour les consommateurs du contour ; aucun secteur n’est imposé. */
	readonly secteur: number;
	readonly chemin: string;
	/** Ancre du nom au-dessus de son contour. */
	readonly tete: Place;
	readonly pivot: string;
	/** Enveloppe de lecture, sans effet sur le placement. */
	readonly centre: Place;
	readonly rayon: number;
}

/** Compatibilité des vues : le graphe ne produit plus de traits d’appartenance. */
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
	/** Le titre de la note consultée, vide dans le graphe global. */
	readonly libelle: string;
	/** Le code court, écrit sous le libellé — vide s'il n'y en a pas. */
	readonly code: string;
	/** Identifiant de la note consultée ; aucun centre dans le graphe global. */
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

export interface ForcesDeCarte {
	readonly repulsion?: number;
	readonly distance?: number;
	readonly attraction?: number;
	readonly centrage?: number;
}

export interface OptionsDeCarte {
	readonly familleParNoeud: ReadonlyMap<string, string>;
	readonly ordreDesFamilles: readonly string[];
	readonly mesures: MesuresDeNoeud;
	readonly perimetre: { readonly nom: string; readonly code: string };
	readonly forces?: ForcesDeCarte;
}

export interface OptionsDeVoisinage {
	readonly centre: string;
	readonly familleParNoeud: ReadonlyMap<string, string>;
	readonly ordreDesFamilles: readonly string[];
	readonly mesures: MesuresDeNoeud;
	readonly distances: ReadonlyMap<string, number>;
	readonly voisinsDe: (id: string) => readonly string[];
	readonly code: string;
	readonly forces?: ForcesDeCarte;
}

export function libelleDuCentre(titre: string, rayon: number): string {
	const largeurDUnCaractere = LARGEUR_DE_CARACTERE * (T_CENTRE / T_NOEUD);
	const tenables = Math.max(4, Math.floor((rayon * 1.95) / largeurDUnCaractere));
	return titre.length > tenables ? titre.slice(0, tenables - 1).trimEnd() + '…' : titre;
}

export interface EtiquetteDeRelation {
	readonly cle: string;
	readonly x: number;
	readonly y: number;
	readonly texte: string;
	/** Longueur disponible sur le lien, extrémités déduites. */
	readonly portee: number;
}

const PORTEE_MINIMALE = 1.3;

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

export function libelleCourt(titre: string): string {
	return titre.length > CARACTERES_DUN_LIBELLE
		? titre.slice(0, CARACTERES_DUN_LIBELLE - 1).trimEnd() + '…'
		: titre;
}

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

function boitesDeLibelle(place: NoeudPlace, texte: string): Boite[] {
	const demi = largeurDeLibelle(texte) / 2;
	const dessous = place.y + place.r + MARGE_DETIQUETTE;
	const dessus = place.y - place.r - MARGE_DETIQUETTE - HAUTEUR_DETIQUETTE;
	return [
		{ x1: place.x - demi, y1: dessous, x2: place.x + demi, y2: dessous + HAUTEUR_DETIQUETTE },
		{ x1: place.x - demi, y1: dessus, x2: place.x + demi, y2: dessus + HAUTEUR_DETIQUETTE }
	];
}

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

interface PointMobile {
	id: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	fixe: boolean;
}

type OptionsCommunes = Pick<
	OptionsDeCarte,
	'familleParNoeud' | 'ordreDesFamilles' | 'mesures' | 'forces'
>;

/** Les identifiants triés et un départ en spirale rendent le calcul reproductible. */
function placer(
	g: Graphe,
	options: OptionsCommunes,
	centre?: string,
	distances?: ReadonlyMap<string, number>
): Map<string, NoeudPlace> {
	const ids = g.noeuds.map((n) => n.id).sort();
	const indice = new Map(ids.map((id, i) => [id, i]));
	const points: PointMobile[] = ids.map((id, i) => {
		const rayon = 26 * Math.sqrt(i + 0.5);
		const angle = i * Math.PI * (3 - Math.sqrt(5));
		return {
			id,
			x: id === centre ? 0 : Math.cos(angle) * rayon,
			y: id === centre ? 0 : Math.sin(angle) * rayon,
			vx: 0,
			vy: 0,
			fixe: id === centre
		};
	});
	// Un lien réciproque ou plusieurs qualifications ne multiplient pas le ressort.
	const uniques = new Map<string, readonly [number, number]>();
	for (const arete of g.aretes) {
		const a = indice.get(arete.de);
		const b = indice.get(arete.vers);
		if (a === undefined || b === undefined || a === b) continue;
		const debut = Math.min(a, b);
		const fin = Math.max(a, b);
		uniques.set(`${debut}:${fin}`, [debut, fin]);
	}
	const liens = [...uniques.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, paire]) => paire);
	const multiplicateur = (valeur: number | undefined): number =>
		Number.isFinite(valeur) ? Math.max(0.05, Math.min(5, valeur ?? 1)) : 1;
	const repulsion = multiplicateur(options.forces?.repulsion);
	const distance = (centre === undefined ? 105 : 170) * multiplicateur(options.forces?.distance);
	const attraction = multiplicateur(options.forces?.attraction);
	const centrage = multiplicateur(options.forces?.centrage);
	const degres = new Map(ids.map((id) => [id, 0]));
	for (const [a, b] of liens) {
		const pa = points[a]!;
		const pb = points[b]!;
		degres.set(pa.id, (degres.get(pa.id) ?? 0) + 1);
		degres.set(pb.id, (degres.get(pb.id) ?? 0) + 1);
	}
	for (let tour = 0; tour < 240; tour += 1) {
		const energie = 1 - tour / 260;
		for (let i = 0; i < points.length; i += 1) {
			const a = points[i]!;
			for (let j = i + 1; j < points.length; j += 1) {
				const b = points[j]!;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const carre = Math.max(1, dx * dx + dy * dy);
				const force = (38 * repulsion * energie) / carre;
				a.vx -= dx * force;
				a.vy -= dy * force;
				b.vx += dx * force;
				b.vy += dy * force;
			}
		}
		for (const [i, j] of liens) {
			const a = points[i]!;
			const b = points[j]!;
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const longueur = Math.max(1, Math.hypot(dx, dy));
			const force = ((longueur - distance) / longueur) * 0.035 * attraction * energie;
			const poids = Math.sqrt(Math.max(degres.get(a.id) ?? 1, degres.get(b.id) ?? 1));
			a.vx += (dx * force) / poids;
			a.vy += (dy * force) / poids;
			b.vx -= (dx * force) / poids;
			b.vy -= (dy * force) / poids;
		}
		for (const p of points) {
			if (p.fixe) {
				p.x = 0;
				p.y = 0;
				p.vx = 0;
				p.vy = 0;
				continue;
			}
			p.vx -= p.x * 0.006 * centrage * energie;
			p.vy -= p.y * 0.006 * centrage * energie;
			const profondeur = distances?.get(p.id);
			if (profondeur !== undefined && profondeur > 0) {
				const rayon = Math.max(1, Math.hypot(p.x, p.y));
				const force = ((profondeur * distance - rayon) / rayon) * 0.014 * energie;
				p.vx += p.x * force;
				p.vy += p.y * force;
			}
			p.vx *= 0.72;
			p.vy *= 0.72;
			p.x += Math.max(-12, Math.min(12, p.vx));
			p.y += Math.max(-12, Math.min(12, p.vy));
		}
		separer(points);
	}
	// Le choix de mesure visuelle ne déplace aucune note : la collision réserve le rayon maximal.
	for (let tour = 0; tour < 24; tour += 1) separer(points);
	const dx =
		centre === undefined && points.length ? points.reduce((s, p) => s + p.x, 0) / points.length : 0;
	const dy =
		centre === undefined && points.length ? points.reduce((s, p) => s + p.y, 0) / points.length : 0;
	const familles = [...new Set([...options.ordreDesFamilles, ...options.familleParNoeud.values()])];
	return new Map(
		points.map((p) => {
			const famille = options.familleParNoeud.get(p.id) ?? null;
			const teinte =
				famille === null
					? null
					: famille === NOM_DES_ISOLEES
						? TEINTE_DES_ISOLEES
						: familles.indexOf(famille) % (TEINTES_DE_FAMILLE - 1);
			return [
				p.id,
				{
					id: p.id,
					x: p.x - dx,
					y: p.y - dy,
					r: p.fixe ? PIVOT : options.mesures.rayon(p.id),
					pivot: p.fixe,
					famille,
					teinte
				}
			];
		})
	);
}

function separer(points: PointMobile[]): void {
	for (let i = 0; i < points.length; i += 1) {
		const a = points[i]!;
		for (let j = i + 1; j < points.length; j += 1) {
			const b = points[j]!;
			const dx = b.x - a.x || 0.001;
			const dy = b.y - a.y;
			const distance = Math.hypot(dx, dy);
			const minimum =
				(a.fixe ? PIVOT : NOEUD_MAXIMUM) + (b.fixe ? PIVOT : NOEUD_MAXIMUM) + PAS_ENTRE_NOEUDS + 6;
			if (distance >= minimum) continue;
			const correction = (minimum - distance) / distance;
			const partA = a.fixe ? 0 : b.fixe ? 1 : 0.5;
			const partB = b.fixe ? 0 : a.fixe ? 1 : 0.5;
			a.x -= dx * correction * partA;
			a.y -= dy * correction * partA;
			b.x += dx * correction * partB;
			b.y += dy * correction * partB;
		}
	}
}

/** Les familles éclatées sont découpées en îlots proches, sans traverser d’autres notes. */
export function contoursDeFamille(places: ReadonlyMap<string, NoeudPlace>): ContourDeFamille[] {
	const ilots: NoeudPlace[][] = [];
	for (const p of places.values()) {
		if (p.famille === null) continue;
		const ilot = ilots.find(
			(membres) =>
				membres[0]?.famille === p.famille &&
				membres.every((m) => Math.hypot(m.x - p.x, m.y - p.y) <= 230)
		);
		if (ilot) ilot.push(p);
		else ilots.push([p]);
	}
	const titres: Boite[] = [];
	return ilots.flatMap((membres) => {
		if (membres.length < 2) return [];
		const nom = membres[0]!.famille!;
		const x1 = Math.min(...membres.map((p) => p.x - p.r)) - MARGE_DE_CONTOUR;
		const x2 = Math.max(...membres.map((p) => p.x + p.r)) + MARGE_DE_CONTOUR;
		const y1 = Math.min(...membres.map((p) => p.y - p.r)) - MARGE_DE_CONTOUR;
		const y2 = Math.max(...membres.map((p) => p.y + p.r)) + MARGE_DE_CONTOUR;
		// Une enveloppe ambiguë reste masquée ; la couleur continue de désigner la famille.
		if (
			[...places.values()].some(
				(p) =>
					p.famille !== nom && p.x + p.r > x1 && p.x - p.r < x2 && p.y + p.r > y1 && p.y - p.r < y2
			)
		)
			return [];
		const chemin = contourDeGroupe(
			membres,
			membres.map((p) => p.r),
			MARGE_DE_CONTOUR
		);
		if (chemin === null) return [];
		const centre = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
		const rayon =
			Math.max(...membres.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y) + p.r)) +
			MARGE_DE_CONTOUR;
		const tete = { x: x1 + MARGE_DE_CONTOUR, y: y1 };
		const boite = boiteDeFamille(tete, nom, membres.length);
		if (titres.some((b) => seHeurtent(b, boite))) return [];
		titres.push(boite);
		return [
			{
				cle: membres[0]!.id,
				nom,
				membres: membres.map((p) => p.id),
				effectif: membres.length,
				teinte: membres[0]!.teinte ?? 0,
				secteur: 0,
				chemin,
				tete,
				pivot: membres[0]!.id,
				centre,
				rayon
			}
		];
	});
}

/** Chaque composante connexe garde ses ressorts ; les composantes se rangent sans liens fictifs. */
function placerLesComposantes(g: Graphe, options: OptionsDeCarte): Map<string, NoeudPlace> {
	const voisins = new Map(g.noeuds.map((n) => [n.id, new Set<string>()]));
	for (const a of g.aretes) {
		if (!voisins.has(a.de) || !voisins.has(a.vers)) continue;
		voisins.get(a.de)!.add(a.vers);
		voisins.get(a.vers)!.add(a.de);
	}
	const restants = new Set([...voisins.keys()].sort());
	const composantes: Set<string>[] = [];
	for (const id of restants) {
		const composante = new Set([id]);
		restants.delete(id);
		for (const membre of composante) {
			for (const voisin of voisins.get(membre) ?? []) {
				if (!restants.delete(voisin)) continue;
				composante.add(voisin);
			}
		}
		composantes.push(composante);
	}
	if (composantes.length <= 1) return placer(g, options);
	composantes.sort((a, b) => b.size - a.size || [...a][0]!.localeCompare([...b][0]!));
	const prises: { x: number; y: number; rayon: number }[] = [];
	const places = new Map<string, NoeudPlace>();
	for (const membres of composantes) {
		const noeuds = g.noeuds.filter((n) => membres.has(n.id));
		const locale = placer(
			{
				noeuds,
				index: new Map(noeuds.map((n) => [n.id, n])),
				aretes: g.aretes.filter((a) => membres.has(a.de) && membres.has(a.vers))
			},
			options
		);
		const rayon = Math.max(
			...[...locale.values()].map((p) => Math.hypot(p.x, p.y) + NOEUD_MAXIMUM)
		);
		let x = 0,
			y = 0,
			essai = 0;
		while (prises.some((p) => Math.hypot(x - p.x, y - p.y) < rayon + p.rayon + 24)) {
			essai += 1;
			const angle = essai * Math.PI * (3 - Math.sqrt(5));
			const distance = 12 * Math.sqrt(essai);
			x = Math.cos(angle) * distance;
			y = Math.sin(angle) * distance;
		}
		prises.push({ x, y, rayon });
		for (const p of locale.values()) places.set(p.id, { ...p, x: p.x + x, y: p.y + y });
	}
	return new Map([...places].sort(([a], [b]) => a.localeCompare(b)));
}

function composer(
	places: ReadonlyMap<string, NoeudPlace>,
	centre: CentreDeCarte,
	mesures: MesuresDeNoeud
): CarteDisposee {
	const familles = contoursDeFamille(places);
	const etiquettes = new Set<string>();
	const etiquettesAuDessus = new Set<string>();
	const prises: Boite[] = [...places.values()].map((p) => ({
		x1: p.x - p.r - 2,
		x2: p.x + p.r + 2,
		y1: p.y - p.r - 2,
		y2: p.y + p.r + 2
	}));
	prises.push(...familles.map((f) => boiteDeFamille(f.tete, f.nom, f.effectif)));
	const candidats = [...places.values()].sort(
		(a, b) =>
			Number(b.pivot) - Number(a.pivot) ||
			mesures.degre(b.id) - mesures.degre(a.id) ||
			a.id.localeCompare(b.id)
	);
	for (const p of candidats) {
		const boites = boitesDeLibelle(p, libelleCourt(mesures.titre(p.id)));
		const libre = boites.findIndex((b) => !prises.some((prise) => seHeurtent(prise, b)));
		if (libre < 0) continue;
		prises.push(boites[libre]!);
		etiquettes.add(p.id);
		if (libre === 1) etiquettesAuDessus.add(p.id);
	}
	// Une note seule garde une échelle lisible. Tous les libellés retenus entrent dans le cadrage.
	let minX = -300,
		maxX = 300,
		minY = -210,
		maxY = 210;
	for (const b of prises) {
		minX = Math.min(minX, b.x1);
		maxX = Math.max(maxX, b.x2);
		minY = Math.min(minY, b.y1);
		maxY = Math.max(maxY, b.y2);
	}
	const largeur = maxX - minX + REPERE_MARGE * 2;
	const hauteur = maxY - minY + REPERE_MARGE * 2;
	const proportion = REPERE_LARGEUR / REPERE_HAUTEUR;
	const largeurFinale = Math.max(largeur, hauteur * proportion);
	const hauteurFinale = Math.max(hauteur, largeur / proportion);
	const repere = places.size
		? {
				x: (minX + maxX - largeurFinale) / 2,
				y: (minY + maxY - hauteurFinale) / 2,
				largeur: largeurFinale,
				hauteur: hauteurFinale
			}
		: {
				x: -REPERE_LARGEUR / 2,
				y: -REPERE_HAUTEUR / 2,
				largeur: REPERE_LARGEUR,
				hauteur: REPERE_HAUTEUR
			};
	return {
		centre,
		noeuds: [...places.values()],
		places,
		familles,
		squelette: [],
		repere,
		etiquettes,
		etiquettesAuDessus
	};
}

export function disposerLaCarte(g: Graphe, options: OptionsDeCarte): CarteDisposee {
	return composer(
		placerLesComposantes(g, options),
		{ x: 0, y: 0, r: 0, libelle: '', code: '', note: null },
		options.mesures
	);
}

export function disposerLeVoisinage(g: Graphe, options: OptionsDeVoisinage): CarteDisposee {
	const present = g.index.has(options.centre);
	const places = placer(g, options, present ? options.centre : undefined, options.distances);
	return composer(
		places,
		{
			x: 0,
			y: 0,
			r: present ? PIVOT : 0,
			libelle: present ? options.mesures.titre(options.centre) : '',
			code: present ? options.code : '',
			note: present ? options.centre : null
		},
		options.mesures
	);
}
