/**
 * LES RÈGLES DE LA PALETTE QUI SE JOUENT SANS NAVIGATEUR — celles qui décident, et que
 * `UC-M02-01` et `UC-M02-02` énoncent en toutes lettres. Le reste — le focus piégé, le
 * fond atténué, le focus rendu au déclencheur — est natif à `<dialog>` et ne se prouve
 * qu'en ouvrant la palette dans un navigateur.
 */
import { describe, expect, it } from 'vitest';
import {
	MAX_RECENTES,
	MAX_RESULTATS,
	MINIMUM_DE_CARACTERES,
	adresseDInterrogation,
	adresseDeTousLesResultats,
	compteurDeResultats,
	estLeRaccourciDeLaPalette,
	rangSuivant
} from './palette';

/** Un événement clavier réduit à ce que le prédicat lit. */
function touche(clef: Partial<KeyboardEvent>): KeyboardEvent {
	return { key: '', ctrlKey: false, metaKey: false, altKey: false, ...clef } as KeyboardEvent;
}

describe('le raccourci — « Ctrl K », et il doit répondre aussi la seconde fois', () => {
	it('reconnaît Ctrl+K', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'k', ctrlKey: true }))).toBe(true);
	});
	it('reconnaît Cmd+K, le modificateur de commande du clavier Apple', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'k', metaKey: true }))).toBe(true);
	});
	it('reconnaît la majuscule : avec Maj enfoncée, le navigateur rend « K »', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'K', ctrlKey: true }))).toBe(true);
	});
	it('ignore « K » seul — le raccourci ne peut pas manger une frappe de recherche', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'k' }))).toBe(false);
	});
	it('ignore Ctrl+Alt+K, qui est un autre geste', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'k', ctrlKey: true, altKey: true }))).toBe(
			false
		);
	});
	it('ignore une autre touche sous Ctrl', () => {
		expect(estLeRaccourciDeLaPalette(touche({ key: 'j', ctrlKey: true }))).toBe(false);
	});
});

describe('rangSuivant — « la navigation boucle : après le dernier, retour au premier »', () => {
	it('descend d’un rang', () => {
		expect(rangSuivant(0, 7, 1)).toBe(1);
	});
	it('reboucle sur le premier après le dernier', () => {
		expect(rangSuivant(6, 7, 1)).toBe(0);
	});
	it('reboucle sur le dernier avant le premier', () => {
		expect(rangSuivant(0, 7, -1)).toBe(6);
	});
	it('prend le premier quand rien n’est sélectionné et qu’on descend', () => {
		expect(rangSuivant(-1, 7, 1)).toBe(0);
	});
	it('prend le dernier quand rien n’est sélectionné et qu’on monte', () => {
		expect(rangSuivant(-1, 7, -1)).toBe(6);
	});
	it('rend −1 sur une liste vide : aucun rang n’est sélectionnable', () => {
		expect(rangSuivant(0, 0, 1)).toBe(-1);
		expect(rangSuivant(-1, 0, -1)).toBe(-1);
	});
});

describe('le compteur — un nombre mesuré, et une durée seulement si elle existe', () => {
	it('accorde le pluriel', () => {
		expect(compteurDeResultats(7, 6)).toBe('7 résultats en 0,01 s');
	});
	it('garde le singulier à un', () => {
		expect(compteurDeResultats(1, 6)).toBe('1 résultat en 0,01 s');
	});
	it('garde le singulier à zéro — « 0 résultat »', () => {
		expect(compteurDeResultats(0, 12)).toBe('0 résultat en 0,01 s');
	});
	it('rend la virgule décimale et deux décimales', () => {
		expect(compteurDeResultats(3, 1250)).toBe('3 résultats en 1,25 s');
	});
	it('N’ÉCRIT AUCUNE DURÉE quand rien n’a été mesuré : « null » ne vaut pas zéro', () => {
		expect(compteurDeResultats(3, null)).toBe('3 résultats');
	});
});

describe('les adresses — la sortie vers la recherche complète, et l’interrogation', () => {
	it('mène à /recherche avec la requête, encodée', () => {
		expect(adresseDeTousLesResultats('base de données')).toBe(
			'/recherche?q=base%20de%20donn%C3%A9es'
		);
	});
	it('ne pose aucun paramètre pour une requête vide', () => {
		expect(adresseDeTousLesResultats('   ')).toBe('/recherche');
	});
	it('interroge sans paramètre au repos — c’est l’état des notes récemment consultées', () => {
		expect(adresseDInterrogation('')).toBe('/recherche/palette');
	});
	it('interroge avec la requête nette', () => {
		expect(adresseDInterrogation('  pg  ')).toBe('/recherche/palette?q=pg');
	});
	it('encode ce qui pourrait sortir de la chaîne de requête', () => {
		expect(adresseDInterrogation('a&b=c#d')).toBe('/recherche/palette?q=a%26b%3Dc%23d');
	});
});

describe('les bornes que le cahier fixe', () => {
	it('promet des résultats dès le DEUXIÈME caractère (UC-M02-02)', () => {
		expect(MINIMUM_DE_CARACTERES).toBe(2);
	});
	it('montre sept lignes au plus, et quatre récentes', () => {
		expect(MAX_RESULTATS).toBe(7);
		expect(MAX_RECENTES).toBe(4);
	});
});
