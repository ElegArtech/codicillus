import { describe, expect, it } from 'vitest';
import { creerUnPlafond } from './plafond';

describe('le plafond de fréquence', () => {
	it('admet jusqu’au plafond, puis refuse dans la fenêtre', () => {
		const plafond = creerUnPlafond(3, 1000);
		expect([0, 1, 2, 3].map((t) => plafond.admettre('a', t))).toEqual([true, true, true, false]);
	});

	it('rouvre quand la fenêtre est passée', () => {
		const plafond = creerUnPlafond(1, 1000);
		expect(plafond.admettre('a', 0)).toBe(true);
		expect(plafond.admettre('a', 999)).toBe(false);
		expect(plafond.admettre('a', 1000)).toBe(true);
	});

	it('compte chaque origine à part', () => {
		const plafond = creerUnPlafond(1, 1000);
		expect(plafond.admettre('a', 0)).toBe(true);
		expect(plafond.admettre('b', 0)).toBe(true);
	});
});
