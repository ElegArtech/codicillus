import { describe, expect, it } from 'vitest';
import { sommaireRendu, type EntreeDeSommaire } from './note-de-demonstration';

describe('le sommaire interactif', () => {
	it('conserve les six niveaux absolus sans numérotation', () => {
		const entrees: readonly EntreeDeSommaire[] = [
			{ niveau: 1, ancre: 'h1-a', libelle: 'Partie A' },
			{ niveau: 2, ancre: 'h2-a', libelle: 'Section A' },
			{ niveau: 3, ancre: 'h3-a', libelle: 'Sous-section A' },
			{ niveau: 6, ancre: 'h6-a', libelle: 'Détail A' },
			{ niveau: 1, ancre: 'h1-b', libelle: 'Partie B' }
		];

		expect(sommaireRendu(entrees)).toEqual([
			{ ...entrees[0], profondeur: 1 },
			{ ...entrees[1], profondeur: 2 },
			{ ...entrees[2], profondeur: 3 },
			{ ...entrees[3], profondeur: 6 },
			{ ...entrees[4], profondeur: 1 }
		]);
	});

	it("n'aplatit pas une note qui commence à H2", () => {
		const entrees: readonly EntreeDeSommaire[] = [
			{ niveau: 2, ancre: 'h2', libelle: 'Section' },
			{ niveau: 3, ancre: 'h3', libelle: 'Sous-section' }
		];

		expect(sommaireRendu(entrees).map(({ profondeur }) => profondeur)).toEqual([2, 3]);
	});
});
