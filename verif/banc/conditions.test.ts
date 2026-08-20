/**
 * Les conditions de capture — unitaires de la pose de l'horloge (P-14, T-047).
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution.
 *
 * CE QU'ILS PROUVENT, ET POURQUOI ILS EXISTENT.
 *
 * La pose de l'horloge demande deux ordres au navigateur, et le temps réel
 * court entre les deux. Tant que les deux ordres visaient le même instant, le
 * second visait le passé dès que le premier avait pris plus de 100 ms — mesuré
 * au navigateur, six délais imposés : 0 et 50 ms passent, 100, 150, 300 et
 * 1 000 ms sont rejetés. Sous 96 pages de front et charge machine à 10, le
 * défaut se produisait sur 171 pages sur 192.
 *
 * La parade est une marge, et une marge se vérifie par calcul, pas par chance.
 * Sans ces cas SYNTHÉTIQUES — indépendants de l'état du dépôt, du navigateur
 * et de la charge —, le seul cas d'épreuve de la parade serait le défaut
 * qu'elle vient de fermer : elle deviendrait inerte en réussissant (P-26).
 *
 * Les deux polarités sont éprouvées (P-5) : ce qui doit passer, et ce qui doit
 * être refusé. Un prédicat qui répondrait toujours « non refusée » passerait la
 * moitié de ce fichier et échouerait l'autre.
 */
import { describe, it, expect } from 'vitest';
import {
	MARGE_INSTALLATION_MS,
	instantDInstallation,
	pauseRefusee,
	INSTANT_REFERENCE
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './conditions.mjs';

const CIBLE = new Date(INSTANT_REFERENCE).getTime();

/** Le seuil au-delà duquel le navigateur rejetait, mesuré par T-047. */
const SEUIL_MESURE_MS = 100;

/**
 * Les deux écritures possibles de la pose, réduites à leur seule arithmétique :
 * quel instant reçoit l'installation. Celle d'avant T-047 visait la cible.
 */
const ECRITURES = {
	'avant T-047 — installation sur la cible': () => CIBLE,
	'depuis T-047 — installation sur la cible reculée de la marge': () => instantDInstallation()
};

describe('pose de l’horloge du banc — la course entre les deux ordres (P-14)', () => {
	it('l’écriture d’avant T-047 est refusée dès qu’une milliseconde s’écoule', () => {
		const installe = ECRITURES['avant T-047 — installation sur la cible']();
		expect(pauseRefusee(installe, CIBLE, 0)).toBe(false);
		expect(pauseRefusee(installe, CIBLE, 1)).toBe(true);
	});

	it('l’écriture d’avant T-047 est refusée à tous les délais que le navigateur a rejetés', () => {
		const installe = ECRITURES['avant T-047 — installation sur la cible']();
		for (const delai of [100, 150, 300, 1000]) {
			expect(pauseRefusee(installe, CIBLE, delai)).toBe(true);
		}
	});

	it('l’écriture de T-047 accepte tous ces délais, et le seuil mesuré avec eux', () => {
		const installe = ECRITURES['depuis T-047 — installation sur la cible reculée de la marge']();
		for (const delai of [0, 50, SEUIL_MESURE_MS, 150, 300, 1000, 3000]) {
			expect(pauseRefusee(installe, CIBLE, delai)).toBe(false);
		}
	});

	it('la marge est exactement ce qui sépare l’acceptation du refus', () => {
		const installe = instantDInstallation();
		expect(pauseRefusee(installe, CIBLE, MARGE_INSTALLATION_MS - 1)).toBe(false);
		expect(pauseRefusee(installe, CIBLE, MARGE_INSTALLATION_MS)).toBe(false);
		expect(pauseRefusee(installe, CIBLE, MARGE_INSTALLATION_MS + 1)).toBe(true);
	});

	it('une marge trop courte redevient refusée — la parade tient à la marge, pas à la chance', () => {
		/* La polarité inverse, éprouvée au navigateur elle aussi : marge ramenée
		   à 200 ms, 300 ms d'écoulement, et le rejet revient. */
		const courte = instantDInstallation(200);
		expect(pauseRefusee(courte, CIBLE, 100)).toBe(false);
		expect(pauseRefusee(courte, CIBLE, 300)).toBe(true);
	});

	it('l’installation recule la cible de la marge, exactement', () => {
		expect(CIBLE - instantDInstallation()).toBe(MARGE_INSTALLATION_MS);
		expect(CIBLE - instantDInstallation(0)).toBe(0);
		expect(CIBLE - instantDInstallation(7)).toBe(7);
	});

	it('la marge couvre le seuil mesuré avec au moins deux ordres de grandeur', () => {
		expect(MARGE_INSTALLATION_MS).toBeGreaterThanOrEqual(SEUIL_MESURE_MS * 100);
	});

	it('l’instant visé par la mise en pause reste l’instant de référence, marge comprise', () => {
		/* Ce que la marge NE fait PAS : déplacer l'instant de capture. Elle recule
		   l'installation, jamais la cible — la salutation de la coquille se calcule
		   sur l'heure de référence, et rien d'autre. */
		expect(new Date(CIBLE).toISOString()).toBe(INSTANT_REFERENCE);
		expect(instantDInstallation()).toBeLessThan(CIBLE);
	});
});
