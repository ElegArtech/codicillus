import { describe, expect, it } from 'vitest';
import { GLYPHES_DUNIVERS, glypheDUnivers } from './glyphes';

describe("catalogue des icônes d'univers", () => {
	it('propose trente-deux choix distincts', () => {
		expect(Object.keys(GLYPHES_DUNIVERS)).toHaveLength(32);
	});

	it('couvre notamment les publications et le logement', () => {
		expect(GLYPHES_DUNIVERS.publication).toBeTruthy();
		expect(GLYPHES_DUNIVERS.maison).toBeTruthy();
	});

	it('rend un dessin non vide pour chaque choix', () => {
		for (const cle of Object.keys(GLYPHES_DUNIVERS)) {
			expect(glypheDUnivers(cle).length).toBeGreaterThan(0);
		}
	});
});
