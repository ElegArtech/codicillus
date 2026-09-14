import { describe, expect, it } from 'vitest';
import {
	SCENARIO_DE_DOMAINE,
	SCENARIO_LIVRE,
	SCENARIO_PREPARE,
	scenarioDuDepotSurLeRail
} from './scenarios-d-import';

describe('scénario du dépôt direct sur le rail', () => {
	it('importe un fichier isolé comme une note', () => {
		expect(scenarioDuDepotSurLeRail('dossier', 1, false)).toBe(SCENARIO_LIVRE);
	});

	it('importe plusieurs fichiers dans la destination existante', () => {
		expect(scenarioDuDepotSurLeRail('dossier', 2, false)).toBe(SCENARIO_PREPARE);
		expect(scenarioDuDepotSurLeRail('domaine', 2, false)).toBe(SCENARIO_PREPARE);
	});

	it('conserve l’arborescence d’un dossier déposé', () => {
		expect(scenarioDuDepotSurLeRail('dossier', 1, true)).toBe(SCENARIO_PREPARE);
	});

	it('crée un domaine quand la cible est un univers', () => {
		expect(scenarioDuDepotSurLeRail('univers', 2, true)).toBe(SCENARIO_DE_DOMAINE);
	});
});
