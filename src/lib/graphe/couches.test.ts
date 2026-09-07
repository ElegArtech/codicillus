/**
 * LE PLACEMENT EN COUCHES — l'étagement, le déterminisme, et les circuits.
 *
 * CE QUI EST ÉPROUVÉ ICI NE SE VOIT PAS À L'ŒIL : qu'un modèle rouvert soit le modèle
 * qu'on a quitté, et qu'un corpus qui boucle ne fasse pas disparaître de nœud.
 */
import { describe, expect, it } from 'vitest';
import { cleDArete, disposerEnCouches } from './couches';
import { sousGraphe } from './cartographie';
import type { Note, Relation } from '../../../seeds/corpus';

function note(id: string): Note {
	return {
		id,
		titre: id,
		extrait: '',
		type: 'Note',
		univers: 'U',
		domaine: 'D',
		dossier: '',
		auteur: '',
		fraicheur: 'frais',
		jours: 0,
		revise: null,
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

/**
 * Une arête de contrôle. L'ORIGINE EST PORTÉE, parce que l'assise la lit : le graphe
 * est typé `Relation`, les objets réels sont des `RelationLisible`, et c'est cette
 * forme-là que la vue de modélisation fait descendre.
 */
function lien(de: string, vers: string, origine = 'declaree'): Relation {
	return { de, vers, type: 'depend', origine } as unknown as Relation;
}

/** Une mention — l'arête qu'un lien écrit dans un corps fabrique. */
function mention(de: string, vers: string): Relation {
	return { de, vers, type: 'mentionne', origine: 'deduite' } as unknown as Relation;
}

function monter(ids: readonly string[], aretes: readonly Relation[]) {
	return sousGraphe(ids.map(note), { type: 'global' }, aretes, 'retirees');
}

describe('disposerEnCouches', () => {
	it('rend une disposition vide sur un graphe vide', () => {
		const d = disposerEnCouches(monter([], []), 'tout');
		expect(d.places.size).toBe(0);
		expect(d.nombreDeCouches).toBe(0);
	});

	it('étage selon le sens : ce qui porte est au-dessus de ce qui dépend', () => {
		const d = disposerEnCouches(monter(['a', 'b', 'c'], [lien('a', 'b'), lien('b', 'c')]), 'tout');
		expect(d.places.get('a')?.couche).toBe(0);
		expect(d.places.get('b')?.couche).toBe(1);
		expect(d.places.get('c')?.couche).toBe(2);
		expect(d.nombreDeCouches).toBe(3);
	});

	it('prend le plus LONG chemin : aucune arête ne reste horizontale', () => {
		/* `a` mène à `c` directement ET par `b`. Le plus court poserait `c` sous `a`,
		   à la même couche que `b`, et l'arête b→c serait plate. */
		const d = disposerEnCouches(
			monter(['a', 'b', 'c'], [lien('a', 'b'), lien('b', 'c'), lien('a', 'c')]),
			'tout'
		);
		expect(d.places.get('c')?.couche).toBe(2);
	});

	it('ne perd aucun nœud sur un circuit, et NOMME l’arête qui remonte', () => {
		const aretes = [lien('a', 'b'), lien('b', 'c'), lien('c', 'a')];
		const d = disposerEnCouches(monter(['a', 'b', 'c'], aretes), 'tout');
		expect(d.places.size).toBe(3);
		expect(d.retours.size).toBe(1);
		expect(d.retours.has(cleDArete(lien('c', 'a')))).toBe(true);
	});

	it('rend le MÊME dessin quel que soit l’ordre d’entrée', () => {
		const ids = ['a', 'b', 'c', 'd'];
		const aretes = [lien('a', 'b'), lien('a', 'c'), lien('b', 'd'), lien('c', 'd')];
		const premier = disposerEnCouches(monter(ids, aretes), 'tout');
		const second = disposerEnCouches(monter([...ids].reverse(), [...aretes].reverse()), 'tout');
		expect([...second.places].map(([id, p]) => [id, p.x, p.y])).toEqual(
			[...premier.places].map(([id, p]) => [id, p.x, p.y])
		);
	});

	it('centre chaque couche : la position horizontale ne dit rien à elle seule', () => {
		const d = disposerEnCouches(monter(['a', 'b', 'c'], [lien('a', 'b'), lien('a', 'c')]), 'tout');
		const a = d.places.get('a');
		const b = d.places.get('b');
		const c = d.places.get('c');
		expect(a).toBeDefined();
		expect(a?.x).toBeCloseTo(((b?.x ?? 0) + (c?.x ?? 0)) / 2, 5);
	});
});

/**
 * L'ASSISE — SUR QUOI L'ÉTAGEMENT S'APPUIE.
 *
 * CE QUI EST ÉPROUVÉ ICI EST UNE DIFFÉRENCE QUE L'ŒIL NE VOIT PAS : le même dessin,
 * les mêmes nœuds, et une hauteur qui ne dit pas la même chose. Le réglage n'a de
 * sens que si l'écran peut dire lequel des deux on regarde.
 */
describe('l’assise de l’étagement', () => {
	/** A → B déclarée, B → C mention. */
	const GRAPHE = () => monter(['a', 'b', 'c'], [lien('a', 'b'), mention('b', 'c')]);

	it('assise « tout » : une mention étage comme une relation déclarée', () => {
		const d = disposerEnCouches(GRAPHE(), 'tout');
		expect(d.places.get('c')?.couche).toBe(2);
		expect(d.horsEtagement.size).toBe(0);
	});

	it('assise « declarees » : une mention ne place rien', () => {
		const d = disposerEnCouches(GRAPHE(), 'declarees');
		expect(d.places.get('c')?.couche).toBe(0);
		expect(d.horsEtagement.has(cleDArete(mention('b', 'c')))).toBe(true);
	});

	it('une arête écartée de l’étagement n’est PAS une arête de retour', () => {
		/* Les deux ensembles sont distincts, et l'écran le lit : il ne dira jamais
		   d'une mention écartée « ce lien referme un circuit ». */
		const d = disposerEnCouches(GRAPHE(), 'declarees');
		expect(d.retours.size).toBe(0);
		expect(d.horsEtagement.size).toBe(1);
	});

	it('une mention ne peut pas fermer un circuit qu’elle est seule à fermer', () => {
		const d = disposerEnCouches(
			monter(['a', 'b'], [lien('a', 'b'), mention('b', 'a')]),
			'declarees'
		);
		expect(d.retours.size).toBe(0);
		expect(d.horsEtagement.has(cleDArete(mention('b', 'a')))).toBe(true);
	});

	it('aucun nœud ne disparaît quand l’assise se réduit', () => {
		const tout = disposerEnCouches(GRAPHE(), 'tout');
		const declarees = disposerEnCouches(GRAPHE(), 'declarees');
		expect([...declarees.places.keys()].sort()).toEqual([...tout.places.keys()].sort());
	});
});
