import { describe, expect, it } from 'vitest';
import { lienSur, sourceDImageSure, sourceDePieceJointeSure } from './adresses-sures';
import { rendreDocument, type OptionsDeRendu } from './rendu';

const OPTIONS: OptionsDeRendu = { resoudre: () => null, contexte: 'interne' };

describe('les adresses d’un corps de note', () => {
	it('un lien garde le web, le courriel, le téléphone et les adresses relatives', () => {
		for (const href of [
			'https://exemple.test/a',
			'HTTP://exemple.test',
			'mailto:a@exemple.test',
			'tel:+33100000000',
			'/notes/n-x',
			'#s-titre',
			'page.html'
		]) {
			expect(lienSur(href), href).toBe(href);
		}
	});

	it('un lien refuse tout autre schéma, même déguisé', () => {
		for (const href of [
			'javascript:alert(1)',
			' JavaScript:alert(1)',
			'java\tscript:alert(1)',
			'java\nscript:alert(1)',
			'\u0001javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'vbscript:msgbox(1)',
			''
		]) {
			expect(lienSur(href), JSON.stringify(href)).toBeNull();
		}
	});

	it('une image n’accepte que le web et les adresses relatives', () => {
		expect(sourceDImageSure('https://exemple.test/a.png')).toBe('https://exemple.test/a.png');
		expect(sourceDImageSure('/notes/n-x/pieces-jointes/a.png')).toBe(
			'/notes/n-x/pieces-jointes/a.png'
		);
		expect(sourceDImageSure('javascript:alert(1)')).toBeNull();
		expect(sourceDImageSure('data:image/svg+xml,<svg onload=alert(1)>')).toBeNull();
	});

	it('une pièce jointe intégrée n’accepte que l’adresse d’une pièce de l’instance', () => {
		expect(sourceDePieceJointeSure('/notes/n-x/pieces-jointes/guide%20vpn.pdf')).toBe(
			'/notes/n-x/pieces-jointes/guide%20vpn.pdf'
		);
		for (const src of [
			'javascript:parent.alert(1)',
			'https://exemple.test/notes/n-x/pieces-jointes/a.pdf',
			'//exemple.test/notes/n-x/pieces-jointes/a.pdf',
			'/deconnexion',
			'/notes/n-x/pieces-jointes/../../console'
		]) {
			expect(sourceDePieceJointeSure(src), src).toBeNull();
		}
	});
});

describe('le rendu n’émet aucune adresse refusée', () => {
	const rendu = rendreDocument(
		{
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'piège',
							marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
						}
					]
				},
				{
					type: 'image',
					attrs: { src: 'javascript:alert(2)', alt: 'schéma', etiquette: null, legende: null }
				},
				{
					type: 'pieceJointe',
					attrs: { src: 'javascript:alert(3)', nom: 'guide.pdf', typeMedia: 'application/pdf' }
				},
				{
					type: 'pieceJointe',
					attrs: { src: 'javascript:alert(4)', nom: 'film.mp4', typeMedia: 'video/mp4' }
				}
			]
		},
		OPTIONS
	);

	it('aucun javascript ne sort', () => {
		expect(rendu.toLowerCase()).not.toContain('javascript:');
	});

	it('le texte reste lisible', () => {
		expect(rendu).toContain('<a class="lien-casse">piège</a>');
		expect(rendu).toContain('guide.pdf');
		expect(rendu).not.toContain('<iframe');
		expect(rendu).not.toContain('<video');
	});
});
