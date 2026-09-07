/**
 * LA GÉOMÉTRIE DES ARÊTES DE `/modelisation` — le trait, et le point où on le vise.
 *
 * ELLE VIVAIT DANS LA VUE, donc nulle part où un unitaire l'atteigne : aucun contrôle
 * du dépôt ne monte de composant hors `src/vues/*.test.ts`. Sortie ici, elle est un
 * module PUR — aucun accès au DOM, aucune donnée propre, tout entre par les
 * paramètres — et chacune de ses trois mesures se mesure.
 *
 * LE DÉFAUT QU'ELLE RÉPARE. Le chemin ne dépendait que des positions des deux
 * extrémités : deux relations entre les deux mêmes notes — parfaitement légales, la
 * contrainte d'unicité porte sur le couple ET le type — recevaient un chemin
 * RIGOUREUSEMENT identique, et leurs deux prises se superposaient. Le clic atteignait
 * toujours la dernière rendue ; l'autre était inatteignable.
 *
 * TROIS MESURES, DANS CET ORDRE, TOUTES DÉTERMINISTES — aucun tirage n'entre ici, un
 * modèle qu'on rouvre doit être le modèle qu'on a quitté :
 *
 *   1. L'ÉVENTAIL DES PARALLÈLES. Les arêtes qui partagent la même paire NON ORIENTÉE
 *      sont groupées, classées par leur clé, et chacune reçoit un rang. Son chemin est
 *      écarté perpendiculairement à la corde source→cible. À une arête seule sur sa
 *      paire l'écart vaut zéro : AUCUN DESSIN EXISTANT NE BOUGE.
 *   2. UNE POIGNÉE PAR ARÊTE, au paramètre 0,5 de SON PROPRE chemin — donc sur son
 *      tracé, jamais à côté. C'est elle que la vue rend en disque cliquable.
 *   3. L'ÉCARTEMENT DES POIGNÉES trop proches — ce que produit un croisement
 *      quelconque —, en les glissant LE LONG DE LEUR PROPRE CHEMIN, sur des positions
 *      d'essai fixes. Au-delà de la dernière, la poignée garde 0,5 et le recouvrement
 *      est assumé : UNE POIGNÉE QUI QUITTE SON TRAIT SERAIT UN MENSONGE, et on préfère
 *      un cas rare non résolu à un cas courant faussé.
 */

export interface AreteATracer {
	readonly cle: string;
	readonly de: string;
	readonly vers: string;
	readonly retour: boolean;
}

export interface NoeudPlace {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly couche: number;
}

export interface TraceDArete {
	readonly cle: string;
	/** L'attribut du chemin — le trait visible ET sa prise. */
	readonly d: string;
	/** Le centre du disque de clic. Toujours SUR le chemin ci-dessus. */
	readonly poignee: { readonly x: number; readonly y: number };
}

/** Les demi-dimensions d'un nœud — celles que la vue dessine. */
export const DEMI_LARGEUR = 84;
export const DEMI_HAUTEUR = 21;

/**
 * L'ÉCART ENTRE DEUX PARALLÈLES, mesuré là où on le voit : entre les MILIEUX des deux
 * tracés. Il vaut plus que la distance de collision, si bien que deux arêtes d'une
 * même paire n'ont jamais besoin de la troisième mesure — l'éventail suffit.
 */
export const ECART_DE_PARALLELE = 24;

/** Le rayon du disque de clic, celui que la vue dessine. */
export const RAYON_DE_POIGNEE = 9;

/** Deux poignées plus proches que cela se recouvrent à l'œil comme à la souris. */
export const DISTANCE_DE_COLLISION = RAYON_DE_POIGNEE * 2 + 2;

/**
 * LES POSITIONS D'ESSAI D'UNE POIGNÉE, dans l'ordre où on les tente. Elles sont FIXES
 * et bornées : une recherche libre rendrait le dessin dépendant de son point de
 * départ, et deux chargements du même modèle ne se ressembleraient plus.
 */
const POSITIONS_D_ESSAI: readonly number[] = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82];

/**
 * Le facteur qui porte l'écart des POINTS DE CONTRÔLE à l'écart des MILIEUX.
 *
 * Le milieu d'une cubique vaut (P0 + 3·P1 + 3·P2 + P3) / 8 : déplacer les deux points
 * de contrôle d'une même quantité ne déplace le milieu que des trois quarts. On
 * corrige ici, pour que la constante ci-dessus dise ce qu'on mesure à l'écran plutôt
 * qu'une grandeur intermédiaire que personne ne voit.
 */
const CONTROLE_POUR_MILIEU = 4 / 3;

interface Point {
	readonly x: number;
	readonly y: number;
}

/** Une cubique, par ses quatre points — la forme qui sert au dessin ET à la mesure. */
interface Cubique {
	readonly depart: Point;
	readonly controle1: Point;
	readonly controle2: Point;
	readonly arrivee: Point;
}

/** Le point d'une cubique au paramètre donné — la formule de Bézier, sans plus. */
function pointDeCubique(c: Cubique, t: number): Point {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const g = 3 * u * t * t;
	const d = t * t * t;
	return {
		x: a * c.depart.x + b * c.controle1.x + g * c.controle2.x + d * c.arrivee.x,
		y: a * c.depart.y + b * c.controle1.y + g * c.controle2.y + d * c.arrivee.y
	};
}

/**
 * LE CHEMIN D'UNE ARÊTE — du bas de la note qui porte au haut de la note visée.
 *
 * UNE ARÊTE QUI REMONTE PART ET ARRIVE SUR LE CÔTÉ : dessinée comme les autres, elle
 * traverserait le nœud dont elle sort. Le crochet dit sans un mot qu'on remonte.
 *
 * L'écart de l'éventail s'applique aux POINTS DE CONTRÔLE, jamais aux extrémités : une
 * arête doit toucher le bord de ses deux nœuds, sinon elle ne dit plus qui elle relie.
 */
function cubiqueDArete(
	arete: AreteATracer,
	source: NoeudPlace,
	cible: NoeudPlace,
	decalage: number
): Cubique {
	const normale = normaleDeLaCorde(source, cible);
	const dx = normale.x * decalage * CONTROLE_POUR_MILIEU;
	const dy = normale.y * decalage * CONTROLE_POUR_MILIEU;

	if (arete.retour || source.couche >= cible.couche) {
		const cote = source.x <= cible.x ? -1 : 1;
		const x1 = source.x + cote * DEMI_LARGEUR;
		const x2 = cible.x + cote * DEMI_LARGEUR;
		const pivot = Math.min(x1, x2) + cote * 46;
		return {
			depart: { x: x1, y: source.y },
			controle1: { x: pivot + dx, y: source.y + dy },
			controle2: { x: pivot + dx, y: cible.y + dy },
			arrivee: { x: x2, y: cible.y }
		};
	}
	const y1 = source.y + DEMI_HAUTEUR;
	const y2 = cible.y - DEMI_HAUTEUR;
	const milieu = (y1 + y2) / 2;
	return {
		depart: { x: source.x, y: y1 },
		controle1: { x: source.x + dx, y: milieu + dy },
		controle2: { x: cible.x + dx, y: milieu + dy },
		arrivee: { x: cible.x, y: y2 }
	};
}

/**
 * LA NORMALE UNITAIRE À LA CORDE source→cible, celle qui porte l'éventail.
 *
 * Une arête d'une note vers elle-même n'a pas de corde : l'écart part alors vers le
 * bas, arbitrairement mais toujours de la même façon — mieux vaut un choix fixe qu'une
 * division par zéro qui rendrait le chemin illisible.
 */
function normaleDeLaCorde(source: NoeudPlace, cible: NoeudPlace): Point {
	const cx = cible.x - source.x;
	const cy = cible.y - source.y;
	const longueur = Math.hypot(cx, cy);
	if (longueur === 0) return { x: 0, y: 1 };
	return { x: -cy / longueur, y: cx / longueur };
}

/** L'attribut du chemin, à la lettre près de ce que la vue rendait avant ce module. */
function attributDeChemin(c: Cubique): string {
	return (
		`M ${c.depart.x} ${c.depart.y} C ${c.controle1.x} ${c.controle1.y}, ` +
		`${c.controle2.x} ${c.controle2.y}, ${c.arrivee.x} ${c.arrivee.y}`
	);
}

/** La clé de la paire NON ORIENTÉE — a→b et b→a tiennent le même faisceau. */
function clePaire(arete: AreteATracer): string {
	return arete.de <= arete.vers ? arete.de + '|' + arete.vers : arete.vers + '|' + arete.de;
}

/**
 * LES TRACÉS DE TOUTES LES ARÊTES D'UN MODÈLE.
 *
 * LE RÉSULTAT EST RANGÉ PAR CLÉ, jamais dans l'ordre d'entrée : c'est ce rangement qui
 * fait que le même modèle rend le même dessin d'une lecture à l'autre, quelle que soit
 * la façon dont la requête a rendu ses lignes. La vue lit par clé, l'ordre ne lui coûte
 * rien.
 *
 * UNE ARÊTE DONT UNE EXTRÉMITÉ MANQUE reçoit un chemin vide, comme avant. Elle ne pèse
 * pas sur l'écartement des poignées : elle n'a pas de trait où glisser.
 */
export function tracerLesAretes(
	aretes: readonly AreteATracer[],
	noeuds: readonly NoeudPlace[]
): readonly TraceDArete[] {
	const parId = new Map(noeuds.map((n) => [n.id, n]));
	const rangees = [...aretes].sort((a, b) => a.cle.localeCompare(b.cle));

	/* 1. L'ÉVENTAIL — le rang de chaque arête dans le faisceau de sa paire. */
	const tailleDuFaisceau = new Map<string, number>();
	for (const a of rangees) {
		const paire = clePaire(a);
		tailleDuFaisceau.set(paire, (tailleDuFaisceau.get(paire) ?? 0) + 1);
	}
	const rangDansLeFaisceau = new Map<string, number>();

	const cubiques = new Map<string, Cubique>();
	const traces: TraceDArete[] = [];
	for (const a of rangees) {
		const source = parId.get(a.de);
		const cible = parId.get(a.vers);
		if (source === undefined || cible === undefined) {
			traces.push({ cle: a.cle, d: '', poignee: { x: 0, y: 0 } });
			continue;
		}
		const paire = clePaire(a);
		const k = rangDansLeFaisceau.get(paire) ?? 0;
		rangDansLeFaisceau.set(paire, k + 1);
		const n = tailleDuFaisceau.get(paire) ?? 1;
		const decalage = (k - (n - 1) / 2) * ECART_DE_PARALLELE;

		const cubique = cubiqueDArete(a, source, cible, decalage);
		cubiques.set(a.cle, cubique);
		traces.push({
			cle: a.cle,
			d: attributDeChemin(cubique),
			poignee: pointDeCubique(cubique, 0.5)
		});
	}

	/* 2 et 3. LES POIGNÉES, posées au milieu puis écartées les unes des autres. */
	const posees: Point[] = [];
	return traces.map((trace) => {
		const cubique = cubiques.get(trace.cle);
		if (cubique === undefined) return trace;
		const poignee = poigneeLibre(cubique, posees);
		posees.push(poignee);
		return { cle: trace.cle, d: trace.d, poignee };
	});
}

/**
 * LA PREMIÈRE POSITION D'ESSAI QUI NE RECOUVRE AUCUNE POIGNÉE DÉJÀ POSÉE.
 *
 * Si aucune ne convient, on rend le milieu : le recouvrement est assumé plutôt que la
 * poignée déplacée hors de son arête.
 */
function poigneeLibre(cubique: Cubique, posees: readonly Point[]): Point {
	for (const t of POSITIONS_D_ESSAI) {
		const candidate = pointDeCubique(cubique, t);
		const libre = posees.every(
			(p) => Math.hypot(candidate.x - p.x, candidate.y - p.y) >= DISTANCE_DE_COLLISION
		);
		if (libre) return candidate;
	}
	return pointDeCubique(cubique, 0.5);
}
