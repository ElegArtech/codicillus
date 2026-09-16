import { describe, expect, it } from 'vitest';
import {
	exporterLeRegistreEnMarkdown,
	exporterLeRegistreEnPdf,
	nomDuRegistreExporte
} from './note';

const document = {
	type: 'doc',
	content: [
		{
			type: 'heading',
			attrs: { level: 2, ancre: 'procedure' },
			content: [{ type: 'text', text: 'Procédure' }]
		},
		{ type: 'paragraph', content: [{ type: 'text', text: 'Éteindre puis rallumer.' }] }
	]
};

describe('export unitaire d’une note', () => {
	it('produit un Markdown autonome du registre demandé', () => {
		const sortie = exporterLeRegistreEnMarkdown({
			titre: 'Routeur cœur',
			registre: 'reference',
			document
		});
		expect(sortie).toContain('# Routeur cœur');
		expect(sortie).toContain('> Registre : Référence');
		expect(sortie).toContain('## Procédure');
		expect(sortie).toContain('Éteindre puis rallumer.');
	});

	it('distingue le registre opérationnel dans le nom téléchargé', () => {
		expect(nomDuRegistreExporte('Plan / reprise', 'operationnel', 'pdf')).toBe(
			'Plan - reprise-operationnel.pdf'
		);
	});

	it('produit un véritable fichier PDF', async () => {
		const octets = await exporterLeRegistreEnPdf({
			titre: 'Routeur cœur',
			registre: 'operationnel',
			document
		});
		expect(new TextDecoder().decode(octets.slice(0, 8))).toMatch(/^%PDF-/u);
		expect(octets.length).toBeGreaterThan(1_000);
	});
});
