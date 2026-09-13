import { describe, expect, it } from 'vitest';
import { erreursDuDepot, longueur } from './modele';
describe('la saisie d’un besoin', () => {
	it('refuse les deux champs vides, y compris les blancs', () => {
		expect(erreursDuDepot('  ', '\n\t')).toHaveProperty('sujet');
		expect(erreursDuDepot('  ', '\n\t')).toHaveProperty('besoin');
	});
	it('compte les caractères Unicode sans couper une paire de substitution', () => {
		expect(longueur('😀')).toBe(1);
		expect(erreursDuDepot('😀'.repeat(160), 'é'.repeat(2000))).toEqual({});
		expect(erreursDuDepot('😀'.repeat(161), 'é'.repeat(2001))).toHaveProperty('sujet');
		expect(erreursDuDepot('😀'.repeat(161), 'é'.repeat(2001))).toHaveProperty('besoin');
	});
	it('ne corrige ni ne tronque silencieusement le besoin', () => {
		const besoin = 'Ligne 1\n' + 'a'.repeat(2000);
		expect(erreursDuDepot('Sujet', besoin).besoin).toBeDefined();
		expect(besoin).toHaveLength(2008);
	});
});
