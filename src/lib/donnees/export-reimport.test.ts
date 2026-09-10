import { describe, expect, it } from 'vitest';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import type { DomaineAExporter } from '../export/archive';
import { CollisionDArchive, reimporterLeDomaine } from './export';

describe('réimportation transactionnelle d’une archive', () => {
	it('refuse une identité vide avant toute lecture ou écriture externe', async () => {
		const domaine: DomaineAExporter = {
			universIdentifiant: '',
			universNom: 'Univers',
			identifiant: 'domaine',
			nom: 'Domaine',
			dossiers: [],
			notes: []
		};
		const baseInaccessible = new Proxy(
			{},
			{
				get() {
					throw new Error('la base ne devait pas être consultée');
				}
			}
		) as Base;

		await expect(
			reimporterLeDomaine(baseInaccessible, {} as Meilisearch, '/sans-ecriture', domaine)
		).rejects.toBeInstanceOf(CollisionDArchive);
	});
});
