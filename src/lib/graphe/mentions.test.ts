/**
 * LES MENTIONS — les quatre règles de `aretesDeMention()`, chacune prise seule.
 *
 * CE QUI EST ÉPROUVÉ ICI EST CE QUI DÉCIDE DU DESSIN : le bornage au périmètre
 * affiché, l'orientation, le dédoublonnage, et la préséance de la relation déclarée.
 * Aucune ne se vérifie à l'œil sur un graphe de trois cents nœuds.
 */
import { describe, expect, it } from 'vitest';
import { TYPE_DE_MENTION, aretesDeMention } from './mentions';
import type { RelationLisible } from '../donnees/outils';
import type { Note } from '../../../seeds/corpus';

/** Une note réduite à ce que le calcul regarde — identité et rangement. */
function note(id: string, univers = 'U', domaine = 'D'): Note {
	return {
		id,
		titre: id,
		extrait: '',
		type: 'Note',
		univers,
		domaine,
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

function declaree(de: string, vers: string): RelationLisible {
	return { de, vers, type: 'heberge', origine: 'declaree' } as unknown as RelationLisible;
}

const GLOBAL = { type: 'global' } as const;

describe('aretesDeMention', () => {
	it("oriente l'arête de la note qui porte le lien vers la note visée", () => {
		const aretes = aretesDeMention([note('a'), note('b')], new Map([['a', ['b']]]), [], GLOBAL);
		expect(aretes).toHaveLength(1);
		expect(aretes[0]?.de).toBe('a');
		expect(aretes[0]?.vers).toBe('b');
		expect(aretes[0]?.type).toBe(TYPE_DE_MENTION);
		expect(aretes[0]?.origine).toBe('deduite');
	});

	it('garde les deux sens quand les deux notes se citent', () => {
		const aretes = aretesDeMention(
			[note('a'), note('b')],
			new Map([
				['a', ['b']],
				['b', ['a']]
			]),
			[],
			GLOBAL
		);
		expect(aretes.map((r) => r.de + '>' + r.vers)).toEqual(['a>b', 'b>a']);
	});

	it('ne rend quune arête quand un corps cite plusieurs fois la même note', () => {
		const aretes = aretesDeMention(
			[note('a'), note('b')],
			new Map([['a', ['b', 'b', 'b']]]),
			[],
			GLOBAL
		);
		expect(aretes).toHaveLength(1);
	});

	it('exige que les DEUX extrémités soient dans le périmètre affiché', () => {
		const aretes = aretesDeMention(
			[note('a', 'U'), note('b', 'AUTRE')],
			new Map([['a', ['b']]]),
			[],
			{ type: 'univers', nom: 'U' }
		);
		expect(aretes).toEqual([]);
	});

	it('efface la mention quand une relation déclarée porte déjà la paire', () => {
		const aretes = aretesDeMention(
			[note('a'), note('b')],
			new Map([['a', ['b']]]),
			[declaree('a', 'b')],
			GLOBAL
		);
		expect(aretes).toEqual([]);
	});

	it('efface la mention même si la relation déclarée va dans lautre sens', () => {
		const aretes = aretesDeMention(
			[note('a'), note('b')],
			new Map([['a', ['b']]]),
			[declaree('b', 'a')],
			GLOBAL
		);
		expect(aretes).toEqual([]);
	});

	it('ignore une note qui se cite elle-même', () => {
		const aretes = aretesDeMention([note('a')], new Map([['a', ['a']]]), [], GLOBAL);
		expect(aretes).toEqual([]);
	});

	it('ignore un lien vers une note que lappelant ne lit pas', () => {
		const aretes = aretesDeMention([note('a')], new Map([['a', ['interdite']]]), [], GLOBAL);
		expect(aretes).toEqual([]);
	});

	it('rend un ordre lexical stable, quel que soit lordre dentrée', () => {
		const liens = new Map([
			['c', ['a']],
			['a', ['b', 'c']]
		]);
		const premier = aretesDeMention([note('c'), note('a'), note('b')], liens, [], GLOBAL);
		const second = aretesDeMention([note('b'), note('a'), note('c')], liens, [], GLOBAL);
		expect(premier.map((r) => r.de + '>' + r.vers)).toEqual(['a>b', 'a>c', 'c>a']);
		expect(second).toEqual(premier);
	});
});
