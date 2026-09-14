import { describe, expect, it } from 'vitest';
import { arbreDuDomaine } from './arborescence';

describe('arborescence du rail', () => {
	it('conserve un dossier vide et ses parents', () => {
		const arbre = arbreDuDomaine([], 'Applications', 'Production', [
			{
				univers: 'Production',
				domaine: 'Applications',
				chemin: 'Exploitation › Sauvegardes'
			}
		]);

		expect(arbre.dossiers).toMatchObject([
			{
				nom: 'Exploitation',
				notes: [],
				enfants: [{ nom: 'Sauvegardes', notes: [], enfants: [] }]
			}
		]);
	});

	it('pose les notes dans les dossiers réels sans les dupliquer', () => {
		const arbre = arbreDuDomaine(
			[
				{
					id: 'procedure-restauration',
					titre: 'Restaurer une sauvegarde',
					univers: 'Production',
					domaine: 'Applications',
					dossier: 'Exploitation › Sauvegardes'
				}
			],
			'Applications',
			'Production',
			[
				{
					univers: 'Production',
					domaine: 'Applications',
					chemin: 'Exploitation › Sauvegardes'
				}
			]
		);

		expect(arbre.dossiers).toHaveLength(1);
		expect(arbre.dossiers[0]?.enfants).toHaveLength(1);
		expect(arbre.dossiers[0]?.enfants[0]?.notes).toEqual([
			{
				nom: 'Restaurer une sauvegarde',
				cle: 'n:procedure-restauration',
				identifiant: 'procedure-restauration'
			}
		]);
	});
});
