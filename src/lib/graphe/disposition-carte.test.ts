import { describe, expect, it } from 'vitest';
import type { Note, Relation } from '../../../seeds/corpus';
import type { Graphe } from './cartographie';
import {
	contoursDeFamille,
	disposerLaCarte,
	disposerLeVoisinage,
	etiquettesDeRelation,
	libelleCourt,
	libelleDuCentre,
	type CarteDisposee,
	type OptionsDeCarte
} from './disposition-carte';

function note(id: string, titre: string): Note {
	return {
		id,
		titre,
		extrait: '',
		type: 'Note',
		univers: 'Substack',
		domaine: 'Atelier',
		dossier: '',
		auteur: 'a.berge',
		fraicheur: 'frais',
		jours: 1,
		revise: '2026-09-01',
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

function jeu(
	nombre: number,
	liens: readonly (readonly [number, number])[] = []
): { graphe: Graphe; options: OptionsDeCarte } {
	const noeuds = Array.from({ length: nombre }, (_, i) => ({
		id: `n${i}`,
		note: note(`n${i}`, `Note ${i}`),
		fantome: false
	}));
	const aretes = liens.map(
		([a, b]) => ({ de: `n${a}`, vers: `n${b}`, type: 'documente' }) as unknown as Relation
	);
	const graphe = { noeuds, index: new Map(noeuds.map((n) => [n.id, n])), aretes };
	const options = {
		familleParNoeud: new Map<string, string>(),
		ordreDesFamilles: [],
		perimetre: { nom: 'Univers de travail', code: 'UNI' },
		mesures: {
			rayon: () => 9,
			degre: (id: string) => aretes.filter((a) => a.de === id || a.vers === id).length,
			centralite: () => 0,
			titre: (id: string) => `Note ${id}`
		}
	};
	return { graphe, options };
}

function distance(carte: CarteDisposee, a: string, b: string): number {
	const pa = carte.places.get(a)!;
	const pb = carte.places.get(b)!;
	return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

function positions(carte: CarteDisposee): unknown {
	return carte.noeuds.map(({ id, x, y }) => ({ id, x, y }));
}

describe('disposition du graphe', () => {
	it('ne fabrique ni centre de périmètre, ni lien d’appartenance', () => {
		const { graphe, options } = jeu(8, [
			[0, 1],
			[1, 2]
		]);
		const carte = disposerLaCarte(graphe, options);
		expect(carte.noeuds.map((n) => n.id).sort()).toEqual(graphe.noeuds.map((n) => n.id).sort());
		expect(carte.centre).toMatchObject({ note: null, r: 0, libelle: '' });
		expect(carte.squelette).toEqual([]);
		expect(carte.noeuds.every((n) => !n.pivot)).toBe(true);
	});

	it('place les notes selon les relations et jamais selon les familles', () => {
		const { graphe, options } = jeu(12, [
			[0, 1],
			[1, 2],
			[2, 0],
			[3, 4],
			[4, 5],
			[5, 3]
		]);
		const carte = disposerLaCarte(graphe, options);
		const familles = new Map(graphe.noeuds.map((n, i) => [n.id, `Famille ${i % 3}`]));
		const coloree = disposerLaCarte(graphe, {
			...options,
			familleParNoeud: familles,
			ordreDesFamilles: ['Famille 2', 'Famille 0', 'Famille 1']
		});
		expect(positions(coloree)).toEqual(positions(carte));
		const entreComposantes =
			['n3', 'n4', 'n5'].reduce((s, id) => s + distance(carte, 'n0', id), 0) / 3;
		expect(distance(carte, 'n0', 'n1')).toBeLessThan(entreComposantes);
		const sansLiens = disposerLaCarte({ ...graphe, aretes: [] }, options);
		expect(positions(sansLiens)).not.toEqual(positions(carte));
	});

	it('reste déterministe quand la requête change l’ordre des notes et relations', () => {
		const { graphe, options } = jeu(14, [
			[0, 1],
			[0, 2],
			[2, 3],
			[4, 7],
			[7, 10]
		]);
		expect(positions(disposerLaCarte(graphe, options))).toEqual(
			positions(
				disposerLaCarte(
					{ ...graphe, noeuds: [...graphe.noeuds].reverse(), aretes: [...graphe.aretes].reverse() },
					options
				)
			)
		);
	});

	it('ne multiplie pas l’attraction des relations réciproques ou qualifiées', () => {
		const { graphe, options } = jeu(4, [
			[0, 1],
			[1, 2]
		]);
		const { graphe: doublons } = jeu(4, [
			[0, 1],
			[1, 2],
			[1, 0],
			[0, 1]
		]);
		expect(positions(disposerLaCarte(graphe, options))).toEqual(
			positions(disposerLaCarte(doublons, options))
		);
	});

	it('écarte les pastilles même dans un graphe dense avec des notes isolées', () => {
		const { graphe, options } = jeu(
			120,
			Array.from({ length: 89 }, (_, i) => [0, i + 1] as const)
		);
		const carte = disposerLaCarte(graphe, options);
		for (let i = 0; i < carte.noeuds.length; i += 1) {
			const a = carte.noeuds[i]!;
			expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
			for (const b of carte.noeuds.slice(i + 1))
				expect(distance(carte, a.id, b.id)).toBeGreaterThan(a.r + b.r);
		}
	});

	it('cadre un corpus peu relié sans disperser les notes isolées', () => {
		const { graphe, options } = jeu(
			77,
			Array.from({ length: 7 }, (_, i) => [i, i + 1] as const)
		);
		const carte = disposerLaCarte(graphe, options);
		expect(carte.noeuds).toHaveLength(77);
		expect(carte.repere.largeur).toBeLessThan(1600);
	});

	it('ne trace pas une enveloppe entre deux notes éloignées autour d’une note étrangère', () => {
		const places = new Map(
			[-300, 0, 300].map((x, i) => [
				`n${i}`,
				{
					id: `n${i}`,
					x,
					y: 0,
					r: 9,
					pivot: false,
					famille: i === 1 ? 'Autre famille' : 'Même famille',
					teinte: 0
				}
			])
		);
		expect(contoursDeFamille(places)).toEqual([]);
		const proches = new Map([...places].map(([id, p]) => [id, { ...p, x: p.x / 3 }]));
		expect(contoursDeFamille(proches)).toEqual([]);
	});

	it('donne les membres précis de chaque contour compact', () => {
		const { graphe, options } = jeu(2, [[0, 1]]);
		const carte = disposerLaCarte(graphe, {
			...options,
			familleParNoeud: new Map([
				['n0', 'Famille'],
				['n1', 'Famille']
			])
		});
		expect(carte.familles).toHaveLength(1);
		expect(carte.familles[0]?.membres).toEqual(['n0', 'n1']);
	});

	it('respecte la taille choisie pour chaque note et conserve les positions', () => {
		const { graphe, options } = jeu(8, [
			[0, 1],
			[1, 2]
		]);
		const carte = disposerLaCarte(graphe, options);
		const autre = disposerLaCarte(graphe, {
			...options,
			mesures: { ...options.mesures, rayon: () => 14 }
		});
		expect(positions(autre)).toEqual(positions(carte));
		expect(autre.noeuds.every((n) => n.r === 14)).toBe(true);
	});

	it('applique les réglages de forces', () => {
		const { graphe, options } = jeu(6, [
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 4],
			[4, 5]
		]);
		const initiale = disposerLaCarte(graphe, options);
		const espacee = disposerLaCarte(graphe, { ...options, forces: { distance: 2 } });
		expect(distance(espacee, 'n2', 'n3')).toBeGreaterThan(distance(initiale, 'n2', 'n3'));
		for (const forces of [{ repulsion: 2 }, { attraction: 2 }, { centrage: 2 }])
			expect(positions(disposerLaCarte(graphe, { ...options, forces }))).not.toEqual(
				positions(initiale)
			);
	});

	it('rend un état vide sans note inventée', () => {
		const { graphe, options } = jeu(0);
		const carte = disposerLaCarte(graphe, options);
		expect(carte.noeuds).toEqual([]);
		expect(carte.familles).toEqual([]);
		expect(carte.repere.largeur).toBeGreaterThan(0);
		const locale = disposerLeVoisinage(graphe, {
			...options,
			centre: 'absente',
			distances: new Map(),
			voisinsDe: () => [],
			code: ''
		});
		expect(locale.noeuds).toEqual([]);
		expect(locale.centre.note).toBeNull();
	});
});

describe('voisinage de la note', () => {
	it('fixe seulement la vraie note centrale et garde chaque relation du voisinage', () => {
		const { graphe, options } = jeu(6, [
			[0, 1],
			[0, 2],
			[1, 3],
			[2, 3],
			[3, 4],
			[4, 5]
		]);
		const carte = disposerLeVoisinage(graphe, {
			...options,
			centre: 'n0',
			code: 'NOT',
			distances: new Map([
				['n0', 0],
				['n1', 1],
				['n2', 1],
				['n3', 2],
				['n4', 3],
				['n5', 4]
			]),
			voisinsDe: () => []
		});
		expect(carte.centre).toMatchObject({ note: 'n0', x: 0, y: 0 });
		expect(carte.places.get('n0')).toMatchObject({ pivot: true, x: 0, y: 0 });
		expect(carte.noeuds).toHaveLength(6);
		expect(carte.squelette).toEqual([]);
		expect(distance(carte, 'n0', 'n5')).toBeGreaterThan(distance(carte, 'n0', 'n1'));
	});

	it('affiche une note sans relation sans fabriquer de voisins', () => {
		const { graphe, options } = jeu(1);
		const carte = disposerLeVoisinage(graphe, {
			...options,
			centre: 'n0',
			code: '',
			distances: new Map([['n0', 0]]),
			voisinsDe: () => []
		});
		expect(carte.noeuds).toHaveLength(1);
		expect(carte.etiquettes.has('n0')).toBe(true);
		expect(carte.repere.largeur).toBeGreaterThan(300);
	});
});

describe('libellés', () => {
	it('raccourcit les titres longs et garde les titres courts', () => {
		expect(libelleCourt('Note')).toBe('Note');
		expect(libelleCourt('Une note dont le titre est particulièrement long')).toHaveLength(22);
		expect(libelleDuCentre('Un titre très long à raccourcir', 17)).toMatch(/…$/);
	});

	it('évite les libellés de relation trop courts et superposés', () => {
		const candidat = { cle: 'a', x: 0, y: 0, texte: 'relie', portee: 200 };
		expect([
			...etiquettesDeRelation([
				candidat,
				{ ...candidat, cle: 'b' },
				{ ...candidat, cle: 'c', x: 200, portee: 1 }
			])
		]).toEqual(['a']);
	});
});
