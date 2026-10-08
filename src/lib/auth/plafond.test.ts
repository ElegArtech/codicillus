import { describe, expect, it } from 'vitest';
import { creerUnPlafond, origineDe } from './plafond';

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

describe('l’origine d’une adresse', () => {
	it.each([
		['203.0.113.7', '203.0.113.7'],
		['::ffff:203.0.113.7', '203.0.113.7'],
		['2001:db8:aa:bb:1:2:3:4', '2001:db8:aa:bb::/64'],
		['2001:db8:aa:bb::99', '2001:db8:aa:bb::/64'],
		['2001:0db8::1', '2001:db8:0:0::/64']
	])('%s compte comme %s', (adresse, origine) => {
		expect(origineDe(adresse)).toBe(origine);
	});

	it('deux adresses du même /64 partagent le plafond', () => {
		const plafond = creerUnPlafond(1, 1000);
		expect(plafond.admettre('2001:db8:aa:bb::1', 0)).toBe(true);
		expect(plafond.admettre('2001:db8:aa:bb::2', 0)).toBe(false);
	});

	it('la mémoire reste bornée sous un flot d’adresses distinctes', () => {
		const plafond = creerUnPlafond(1, 1_000_000);
		for (let i = 0; i < 20_000; i += 1) plafond.admettre(`10.0.${i >> 8}.${i & 255}`, i);
		/* La première vue a été oubliée : elle est de nouveau admise. */
		expect(plafond.admettre('10.0.0.0', 20_001)).toBe(true);
	});
});
