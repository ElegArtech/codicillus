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
		const source = new TextDecoder('latin1').decode(octets);
		expect(source).toMatch(/^%PDF-/u);
		expect(octets.length).toBeGreaterThan(1_000);
		/* Le WOFF2 variable d'origine produisait un sous-ensemble vide et des pages
		   blanches. L'export doit embarquer la fonte TrueType statique dédiée. */
		expect(source).toContain('DejaVuSerif');
		expect(source).toContain('/FontFile2');
	});
});
