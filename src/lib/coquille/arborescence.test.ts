import { describe, expect, it } from 'vitest';
import { arbreDuDomaine, railRendu, sectionsDuRail } from './arborescence';

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

	it('distingue deux dossiers homonymes placés dans deux univers', () => {
		const sections = sectionsDuRail(
			[
				{ nom: 'DPS', couleur: '#123456', glyphe: 'serveur', description: '' },
				{ nom: 'Support', couleur: '#654321', glyphe: 'serveur', description: '' }
			],
			[
				{ nom: 'Exploitation', univers: 'DPS', couleur: '#123456' },
				{ nom: 'Communication', univers: 'Support', couleur: '#654321' }
			],
			[],
			[
				{ univers: 'DPS', domaine: 'Exploitation', chemin: 'Publier' },
				{ univers: 'Support', domaine: 'Communication', chemin: 'Publier' }
			]
		);
		const rendu = railRendu(
			sections,
			{
				univers: 'DPS',
				chemin: ['Exploitation', 'Publier'],
				note: null,
				surLUnivers: false
			},
			null
		);
		const dossierDps = rendu[0]?.domaines[0]?.enfants[0];
		const dossierSupport = rendu[1]?.domaines[0]?.enfants[0];

		expect(dossierDps).toMatchObject({ nom: 'Publier', courant: true, page: true });
		expect(dossierSupport).toMatchObject({ nom: 'Publier', courant: false, page: false });
		expect(dossierDps?.cle).not.toBe(dossierSupport?.cle);
	});
});
