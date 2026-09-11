import { describe, expect, it } from 'vitest';
import { sommaireRendu, type EntreeDeSommaire } from './note-de-demonstration';

describe('le sommaire interactif', () => {
	it('conserve les six niveaux et numérote le niveau principal réellement présent', () => {
		const entrees: readonly EntreeDeSommaire[] = [
			{ niveau: 1, ancre: 'h1-a', libelle: 'Partie A' },
			{ niveau: 2, ancre: 'h2-a', libelle: 'Section A' },
			{ niveau: 3, ancre: 'h3-a', libelle: 'Sous-section A' },
			{ niveau: 6, ancre: 'h6-a', libelle: 'Détail A' },
			{ niveau: 1, ancre: 'h1-b', libelle: 'Partie B' }
		];

		expect(sommaireRendu(entrees)).toEqual([
			{ ...entrees[0], profondeur: 1, numero: '01' },
			{ ...entrees[1], profondeur: 2, numero: null },
			{ ...entrees[2], profondeur: 3, numero: null },
			{ ...entrees[3], profondeur: 6, numero: null },
			{ ...entrees[4], profondeur: 1, numero: '02' }
		]);
	});

	it('garde H2 comme niveau principal dans une note qui ne porte aucun H1', () => {
		const entrees: readonly EntreeDeSommaire[] = [
			{ niveau: 2, ancre: 'h2', libelle: 'Section' },
			{ niveau: 3, ancre: 'h3', libelle: 'Sous-section' }
		];

		expect(
			sommaireRendu(entrees).map(({ profondeur, numero }) => ({ profondeur, numero }))
		).toEqual([
			{ profondeur: 1, numero: '01' },
			{ profondeur: 2, numero: null }
		]);
	});
});
