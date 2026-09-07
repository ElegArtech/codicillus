/**
 * LES DEUX ÉCRITURES DES JETONS NE DOIVENT JAMAIS DIVERGER.
 *
 * `carto-jetons.css` habille le dessin, `jetons.ts` le calcule. Les mêmes nombres y
 * sont écrits deux fois, parce qu'une feuille de style ne se lit pas depuis un
 * module. Ce contrôle est ce qui rend la duplication sûre : il échoue si un rayon,
 * une marge ou une taille de police change d'un côté seulement.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JETONS_PARTAGES, TEINTES_DE_FAMILLE } from './jetons';
import * as jetons from './jetons';

const FEUILLE = readFileSync(path.join(process.cwd(), 'src', 'vues', 'carto-jetons.css'), 'utf8');

/** La valeur d'un jeton de la feuille, telle qu'elle y est déclarée. */
function valeurDeclaree(nom: string): string | null {
	const trouve = new RegExp(`${nom}\\s*:\\s*([^;]+);`).exec(FEUILLE);
	return trouve === null ? null : (trouve[1] as string).trim();
}

describe('les jetons de la cartographie', () => {
	it('déclare dans la feuille chaque nombre que le calcul emploie', () => {
		for (const [nom, attendu] of Object.entries(JETONS_PARTAGES)) {
			const declare = valeurDeclaree(nom);
			expect(declare, `${nom} manque à carto-jetons.css`).not.toBeNull();
			expect(Number(declare), `${nom} diffère entre la feuille et le calcul`).toBe(attendu);
		}
	});

	it("n'oublie aucune constante numérique dans la table comparée", () => {
		/* Les constantes DÉRIVÉES ne sont pas dans la feuille : elles se calculent
		   à partir de celles qui y sont, donc ne peuvent pas en diverger. */
		const derivees = new Set(['NOEUD_MAXIMUM', 'TEINTES_DE_FAMILLE', 'TEINTE_DES_ISOLEES']);
		const comparees = new Set(Object.values(JETONS_PARTAGES));
		for (const [nom, valeur] of Object.entries(jetons)) {
			if (typeof valeur !== 'number' || derivees.has(nom)) continue;
			expect(comparees.has(valeur), `${nom} n'est comparé à aucun jeton de la feuille`).toBe(true);
		}
	});

	it('déclare autant de teintes de famille que le calcul en compte', () => {
		for (let rang = 0; rang < TEINTES_DE_FAMILLE; rang += 1) {
			for (const part of ['sature', 'pastel', 'bord']) {
				expect(
					valeurDeclaree(`--carto-famille-${rang}-${part}`),
					`--carto-famille-${rang}-${part} manque`
				).not.toBeNull();
			}
		}
		expect(valeurDeclaree(`--carto-famille-${TEINTES_DE_FAMILLE}-sature`)).toBeNull();
	});
});
