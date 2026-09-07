/**
 * LA GÉOMÉTRIE DES ARÊTES — ce qu'on ne voit pas à l'œil sur un dessin qui a l'air juste.
 *
 * DEUX CHOSES SE MESURENT ICI, ET AUCUNE NE SE REGARDE : qu'un chemin déjà rendu ne
 * bouge pas d'un caractère, et qu'une poignée de clic soit bien POSÉE SUR le trait
 * qu'elle prétend saisir. La seconde est la raison d'être du module : une poignée qui
 * flotte à côté de son arête ferait cliquer sur la mauvaise relation sans qu'aucun
 * écran ne le dise.
 *
 * L'ÉCHANTILLONNAGE EST ÉCRIT ICI, à la formule de Bézier, et il lit le chemin RENDU
 * plutôt que la géométrie interne du module : un contrôle qui reprendrait les points de
 * contrôle du module éprouverait sa propre copie, pas ce que le navigateur dessinera.
 */
import { describe, expect, it } from 'vitest';
import {
	DEMI_HAUTEUR,
	DEMI_LARGEUR,
	DISTANCE_DE_COLLISION,
	ECART_DE_PARALLELE,
	tracerLesAretes,
	type AreteATracer,
	type NoeudPlace
} from './traces';

function noeud(id: string, x: number, y: number, couche: number): NoeudPlace {
	return { id, x, y, couche };
}

function arete(de: string, vers: string, type: string, retour = false): AreteATracer {
	return { cle: de + '>' + vers + '>' + type, de, vers, retour };
}

/**
 * `cheminDArete()` TEL QU'IL ÉTAIT DANS LA VUE, recopié mot pour mot.
 *
 * C'est l'étalon du premier contrôle, et il n'a pas d'autre emploi : il dit ce que
 * l'écran rendait avant que la géométrie ne sorte du composant.
 */
function cheminDAvant(a: AreteATracer, noeuds: readonly NoeudPlace[]): string {
	const source = noeuds.find((n) => n.id === a.de);
	const cible = noeuds.find((n) => n.id === a.vers);
	if (source === undefined || cible === undefined) return '';
	if (a.retour || source.couche >= cible.couche) {
		const cote = source.x <= cible.x ? -1 : 1;
		const x1 = source.x + cote * DEMI_LARGEUR;
		const x2 = cible.x + cote * DEMI_LARGEUR;
		const pivot = Math.min(x1, x2) + cote * 46;
		return `M ${x1} ${source.y} C ${pivot} ${source.y}, ${pivot} ${cible.y}, ${x2} ${cible.y}`;
	}
	const y1 = source.y + DEMI_HAUTEUR;
	const y2 = cible.y - DEMI_HAUTEUR;
	const milieu = (y1 + y2) / 2;
	return `M ${source.x} ${y1} C ${source.x} ${milieu}, ${cible.x} ${milieu}, ${cible.x} ${y2}`;
}

interface Point {
	x: number;
	y: number;
}

/** Les quatre points d'un chemin rendu — on relit ce qui part au balisage. */
function pointsDuChemin(d: string): readonly Point[] {
	const nombres = (d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/g) ?? []).map(Number);
	expect(nombres.length).toBe(8);
	const points: Point[] = [];
	for (let i = 0; i < 8; i += 2) points.push({ x: nombres[i] ?? 0, y: nombres[i + 1] ?? 0 });
	return points;
}

/** Le point d'une cubique au paramètre donné — la formule de Bézier, rien d'autre. */
function pointA(d: string, t: number): Point {
	const [p0, p1, p2, p3] = pointsDuChemin(d);
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const g = 3 * u * t * t;
	const h = t * t * t;
	return {
		x: a * (p0?.x ?? 0) + b * (p1?.x ?? 0) + g * (p2?.x ?? 0) + h * (p3?.x ?? 0),
		y: a * (p0?.y ?? 0) + b * (p1?.y ?? 0) + g * (p2?.y ?? 0) + h * (p3?.y ?? 0)
	};
}

function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

/** La distance d'un point au chemin, échantillonné en 200 segments. */
function distanceAuChemin(p: Point, d: string): number {
	let mini = Infinity;
	for (let i = 0; i <= 200; i += 1) mini = Math.min(mini, distance(p, pointA(d, i / 200)));
	return mini;
}

describe('tracerLesAretes', () => {
	it('une arête seule sur sa paire garde le tracé d’avant', () => {
		/* Les trois natures de chemin : la descente d'une couche, le saut de deux
		   couches, et le crochet d'une arête qui remonte. Aucune ne doit bouger. */
		const noeuds = [
			noeud('a', 300, 70, 0),
			noeud('b', 100, 202, 1),
			noeud('c', 520, 334, 2),
			noeud('d', 300, 334, 2)
		];
		const aretes = [
			arete('a', 'b', 'depend'),
			arete('a', 'c', 'heberge'),
			arete('b', 'd', 'appelle'),
			arete('c', 'd', 'jouxte'),
			arete('d', 'a', 'cite', true)
		];
		const traces = tracerLesAretes(aretes, noeuds);
		for (const a of aretes) {
			const trace = traces.find((t) => t.cle === a.cle);
			expect(trace?.d).toBe(cheminDAvant(a, noeuds));
		}
	});

	it('deux arêtes sur la même paire reçoivent deux tracés distincts', () => {
		const noeuds = [noeud('a', 300, 70, 0), noeud('b', 100, 202, 1)];
		const aretes = [arete('a', 'b', 'depend'), arete('a', 'b', 'heberge')];
		const [premier, second] = tracerLesAretes(aretes, noeuds);
		expect(premier?.d).not.toBe(second?.d);
		expect(premier?.d).not.toBe(cheminDAvant(aretes[0] as AreteATracer, noeuds));
		expect(distance(pointA(premier?.d ?? '', 0.5), pointA(second?.d ?? '', 0.5))).toBeCloseTo(
			ECART_DE_PARALLELE,
			6
		);
	});

	it('trois arêtes sur la même paire s’écartent symétriquement autour du tracé nominal', () => {
		const noeuds = [noeud('a', 300, 70, 0), noeud('b', 100, 202, 1)];
		const aretes = [
			arete('a', 'b', 'appelle'),
			arete('a', 'b', 'depend'),
			arete('a', 'b', 'heberge')
		];
		const traces = tracerLesAretes(aretes, noeuds);
		const nominal = pointA(cheminDAvant(aretes[0] as AreteATracer, noeuds), 0.5);
		const milieux = traces.map((t) => pointA(t.d, 0.5));
		const moyenne = {
			x: milieux.reduce((s, p) => s + p.x, 0) / milieux.length,
			y: milieux.reduce((s, p) => s + p.y, 0) / milieux.length
		};
		expect(moyenne.x).toBeCloseTo(nominal.x, 6);
		expect(moyenne.y).toBeCloseTo(nominal.y, 6);
		/* Et l'éventail est bien ouvert : la médiane reste sur le tracé nominal. */
		expect(distance(milieux[1] ?? moyenne, nominal)).toBeCloseTo(0, 6);
		expect(distance(milieux[0] ?? moyenne, nominal)).toBeCloseTo(ECART_DE_PARALLELE, 6);
	});

	it('deux poignées ne sont jamais à moins de la distance de collision', () => {
		/* DEUX ARÊTES QUI SE CROISENT SANS PARTAGER D'EXTRÉMITÉ : leurs milieux tombent
		   au même point au pixel près, et l'éventail des parallèles ne les voit pas. */
		const noeuds = [
			noeud('a', 100, 70, 0),
			noeud('b', 310, 70, 0),
			noeud('c', 100, 202, 1),
			noeud('d', 310, 202, 1)
		];
		const traces = tracerLesAretes([arete('a', 'd', 'depend'), arete('b', 'c', 'depend')], noeuds);
		for (let i = 0; i < traces.length; i += 1) {
			for (let j = i + 1; j < traces.length; j += 1) {
				const un = traces[i];
				const autre = traces[j];
				if (un === undefined || autre === undefined) continue;
				expect(distance(un.poignee, autre.poignee)).toBeGreaterThanOrEqual(DISTANCE_DE_COLLISION);
			}
		}
	});

	it('chaque poignée est SUR le tracé de son arête', () => {
		const noeuds = [
			noeud('a', 100, 70, 0),
			noeud('b', 310, 70, 0),
			noeud('c', 100, 202, 1),
			noeud('d', 310, 202, 1)
		];
		const traces = tracerLesAretes(
			[
				arete('a', 'd', 'depend'),
				arete('b', 'c', 'depend'),
				arete('a', 'c', 'depend'),
				arete('a', 'c', 'heberge'),
				arete('a', 'c', 'appelle'),
				arete('d', 'b', 'cite', true)
			],
			noeuds
		);
		expect(traces.length).toBe(6);
		for (const trace of traces) {
			expect(distanceAuChemin(trace.poignee, trace.d)).toBeLessThan(0.5);
		}
	});

	it('le même graphe rend les mêmes tracés quel que soit l’ordre d’entrée', () => {
		const noeuds = [
			noeud('a', 100, 70, 0),
			noeud('b', 310, 70, 0),
			noeud('c', 100, 202, 1),
			noeud('d', 310, 202, 1)
		];
		const aretes = [
			arete('a', 'd', 'depend'),
			arete('b', 'c', 'depend'),
			arete('a', 'c', 'depend'),
			arete('a', 'c', 'heberge'),
			arete('d', 'b', 'cite', true)
		];
		const premier = tracerLesAretes(aretes, noeuds);
		const second = tracerLesAretes([...aretes].reverse(), [...noeuds].reverse());
		expect(second).toEqual(premier);
	});

	it('une arête qui remonte garde son crochet latéral', () => {
		const noeuds = [noeud('a', 100, 202, 1), noeud('b', 310, 70, 0)];
		const traces = tracerLesAretes([arete('a', 'b', 'cite', true)], noeuds);
		/* Elle part du CÔTÉ du nœud, à la demi-largeur, et non de son bas. */
		expect(traces[0]?.d.startsWith('M ' + String(100 - DEMI_LARGEUR) + ' 202 ')).toBe(true);
		expect(traces[0]?.d.startsWith('M 100 ' + String(202 + DEMI_HAUTEUR))).toBe(false);
	});

	it('un cas irréductible garde sa poignée sur son trait', () => {
		/* DOUZE ARÊTES QUI SE CROISENT TOUTES AU MÊME POINT, sur des nœuds si serrés
		   qu'aucune des neuf positions d'essai ne les sépare. Le module renonce alors à
		   écarter — mais aucune poignée ne quitte son propre trait. */
		const noeuds: NoeudPlace[] = [];
		const aretes: AreteATracer[] = [];
		for (let i = 0; i < 12; i += 1) {
			const decalage = i * 3;
			noeuds.push(noeud('h' + String(i), 200 + decalage, 70, 0));
			noeuds.push(noeud('b' + String(i), 300 - decalage, 202, 1));
			aretes.push(arete('h' + String(i), 'b' + String(i), 'depend'));
		}
		const traces = tracerLesAretes(aretes, noeuds);
		expect(traces.length).toBe(12);
		for (const trace of traces) {
			expect(distanceAuChemin(trace.poignee, trace.d)).toBeLessThan(0.5);
		}
		/* Et le cas est bien irréductible : deux poignées se recouvrent encore. */
		const trop = traces.some((un, i) =>
			traces.some(
				(autre, j) => i < j && distance(un.poignee, autre.poignee) < DISTANCE_DE_COLLISION
			)
		);
		expect(trop).toBe(true);
	});
});
