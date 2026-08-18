import { describe, expect, it } from 'vitest';
import {
	DateInvalideErreur,
	formaterDateCourteFr,
	formaterDateFr,
	formaterDateHeureFr,
	formaterDateIso
} from './dates';

// Batterie 3 du catalogue (PLAN-DE-REALISATION.md §5).
// Les instants sont donnés en UTC et les attentes formulées dans le fuseau du
// produit : c'est justement l'écart entre les deux que ces tests surveillent.

describe('formaterDateFr', () => {
	it('rend le mois en toutes lettres, en français', () => {
		expect(formaterDateFr('2026-08-18T12:03:00Z')).toBe('18 août 2026');
		expect(formaterDateFr('2026-05-04T09:00:00Z')).toBe('4 mai 2026');
		// Septembre distingue la forme longue de la forme abrégée (« sept. ») :
		// sans lui, un mois abrégé passerait inaperçu.
		expect(formaterDateFr('2026-09-30T10:00:00Z')).toBe('30 septembre 2026');
	});

	it('accepte un objet Date et un horodatage', () => {
		const instant = new Date('2026-08-18T12:03:00Z');
		expect(formaterDateFr(instant)).toBe('18 août 2026');
		expect(formaterDateFr(instant.getTime())).toBe('18 août 2026');
	});

	it('applique le fuseau du produit, pas celui de la machine', () => {
		// 23 h 30 UTC le 1er janvier, c'est déjà le 2 janvier à Paris.
		expect(formaterDateFr('2026-01-01T23:30:00Z')).toBe('2 janvier 2026');
		expect(formaterDateFr('2026-01-01T23:30:00Z', 'UTC')).toBe('1 janvier 2026');
	});

	it('ne modifie pas la Date qu’on lui confie', () => {
		const instant = new Date('2026-08-18T12:03:00Z');
		formaterDateFr(instant);
		expect(instant.toISOString()).toBe('2026-08-18T12:03:00.000Z');
	});

	it('refuse une entrée qui ne désigne aucun instant', () => {
		expect(() => formaterDateFr('pas une date')).toThrow(DateInvalideErreur);
		expect(() => formaterDateFr(Number.NaN)).toThrow(DateInvalideErreur);
	});
});

describe('formaterDateCourteFr', () => {
	it('rend le jour et le mois sur deux chiffres', () => {
		expect(formaterDateCourteFr('2026-08-18T12:03:00Z')).toBe('18/08/2026');
		expect(formaterDateCourteFr('2026-05-04T09:00:00Z')).toBe('04/05/2026');
	});
});

describe('formaterDateHeureFr', () => {
	it('accole l’heure locale à la date en toutes lettres', () => {
		expect(formaterDateHeureFr('2026-08-18T12:03:00Z')).toBe('18 août 2026 à 14:03');
	});

	it('suit le décalage saisonnier', () => {
		// Même heure UTC, décalage d’hiver : une heure de moins à Paris.
		expect(formaterDateHeureFr('2026-01-18T12:03:00Z')).toBe('18 janvier 2026 à 13:03');
	});
});

describe('formaterDateIso', () => {
	it('donne la forme lisible par une machine, dans le fuseau du produit', () => {
		expect(formaterDateIso('2026-08-18T12:03:00Z')).toBe('2026-08-18');
		expect(formaterDateIso('2026-01-01T23:30:00Z')).toBe('2026-01-02');
		expect(formaterDateIso('2026-01-01T23:30:00Z', 'UTC')).toBe('2026-01-01');
	});
});
