import { describe, expect, it } from 'vitest';
import { etendueDeTableur, fenetreDeTableur, positionDeDefilement } from './fenetre-tableur';

describe('fenêtre de lecture d’un tableur', () => {
	it('rend le début, le milieu et la dernière ligne sans pagination', () => {
		for (const position of [0, 4500, 2100 * 38 - 400]) {
			const fenetre = fenetreDeTableur(2100, 38, position, 400, 5);
			expect(fenetre.fin - fenetre.debut + 1).toBeLessThanOrEqual(23);
			expect(fenetre.avant + (fenetre.fin - fenetre.debut + 1) * 38 + fenetre.apres).toBeCloseTo(
				2100 * 38
			);
		}
		expect(fenetreDeTableur(2100, 38, 0, 400, 5).debut).toBe(0);
		expect(fenetreDeTableur(2100, 38, 4500, 400, 5).debut).toBeGreaterThan(100);
		expect(fenetreDeTableur(2100, 38, 2100 * 38, 400, 5).fin).toBe(2099);
	});

	it('atteint les colonnes au-delà de T avec un nombre de cellules borné', () => {
		const fenetre = fenetreDeTableur(50, 190, 50 * 190, 700, 2);
		expect(fenetre.fin).toBe(49);
		expect(fenetre.fin - fenetre.debut + 1).toBeLessThanOrEqual(8);
		expect(fenetre.apres).toBe(0);
	});

	it('garde toute une feuille Excel accessible sous les limites de hauteur du navigateur', () => {
		const lignes = 1_048_576;
		expect(etendueDeTableur(lignes, 38)).toBe(8_000_000);
		const derniere = fenetreDeTableur(lignes, 38, 8_000_000, 400, 5);
		expect(derniere.fin).toBe(lignes - 1);
		expect(derniere.fin - derniere.debut + 1).toBeLessThanOrEqual(23);
		expect(derniere.apres).toBeCloseTo(0);
		const position = positionDeDefilement(500_000 * 38, lignes, 38, 400);
		const milieu = fenetreDeTableur(lignes, 38, position, 400, 5);
		expect(milieu.debut).toBeLessThanOrEqual(500_000);
		expect(milieu.fin).toBeGreaterThanOrEqual(500_000);
	});

	it('borne les fenêtres vides, les positions négatives et les petites feuilles', () => {
		expect(fenetreDeTableur(0, 38, 0, 400, 5)).toEqual({ debut: 0, fin: -1, avant: 0, apres: 0 });
		expect(fenetreDeTableur(2, 38, -15, 400, 5)).toEqual({ debut: 0, fin: 1, avant: 0, apres: 0 });
		expect(positionDeDefilement(300, 2, 38, 400)).toBe(0);
	});
});
