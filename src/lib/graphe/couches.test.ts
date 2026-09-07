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

function lien(de: string, vers: string): Relation {
	return { de, vers, type: 'depend' } as unknown as Relation;
}

function monter(ids: readonly string[], aretes: readonly Relation[]) {
	return sousGraphe(ids.map(note), { type: 'global' }, aretes, 'retirees');
}

describe('disposerEnCouches', () => {
	it('rend une disposition vide sur un graphe vide', () => {
		const d = disposerEnCouches(monter([], []));
		expect(d.places.size).toBe(0);
		expect(d.nombreDeCouches).toBe(0);
	});

	it('étage selon le sens : ce qui porte est au-dessus de ce qui dépend', () => {
		const d = disposerEnCouches(monter(['a', 'b', 'c'], [lien('a', 'b'), lien('b', 'c')]));
		expect(d.places.get('a')?.couche).toBe(0);
		expect(d.places.get('b')?.couche).toBe(1);
		expect(d.places.get('c')?.couche).toBe(2);
		expect(d.nombreDeCouches).toBe(3);
	});

	it('prend le plus LONG chemin : aucune arête ne reste horizontale', () => {
		/* `a` mène à `c` directement ET par `b`. Le plus court poserait `c` sous `a`,
		   à la même couche que `b`, et l'arête b→c serait plate. */
		const d = disposerEnCouches(
			monter(['a', 'b', 'c'], [lien('a', 'b'), lien('b', 'c'), lien('a', 'c')])
		);
		expect(d.places.get('c')?.couche).toBe(2);
	});

	it('ne perd aucun nœud sur un circuit, et NOMME l’arête qui remonte', () => {
		const aretes = [lien('a', 'b'), lien('b', 'c'), lien('c', 'a')];
		const d = disposerEnCouches(monter(['a', 'b', 'c'], aretes));
		expect(d.places.size).toBe(3);
		expect(d.retours.size).toBe(1);
		expect(d.retours.has(cleDArete(lien('c', 'a')))).toBe(true);
	});

	it('rend le MÊME dessin quel que soit l’ordre d’entrée', () => {
		const ids = ['a', 'b', 'c', 'd'];
		const aretes = [lien('a', 'b'), lien('a', 'c'), lien('b', 'd'), lien('c', 'd')];
		const premier = disposerEnCouches(monter(ids, aretes));
		const second = disposerEnCouches(monter([...ids].reverse(), [...aretes].reverse()));
		expect([...second.places].map(([id, p]) => [id, p.x, p.y])).toEqual(
			[...premier.places].map(([id, p]) => [id, p.x, p.y])
		);
	});

	it('centre chaque couche : la position horizontale ne dit rien à elle seule', () => {
		const d = disposerEnCouches(monter(['a', 'b', 'c'], [lien('a', 'b'), lien('a', 'c')]));
		const a = d.places.get('a');
		const b = d.places.get('b');
		const c = d.places.get('c');
		expect(a).toBeDefined();
		expect(a?.x).toBeCloseTo(((b?.x ?? 0) + (c?.x ?? 0)) / 2, 5);
	});
});
