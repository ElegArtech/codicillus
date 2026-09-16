/**
 * L'export autonome d'un registre de note.
 *
 * L'archive de domaine reste la forme de réversibilité complète. Ici, l'utilisateur
 * emporte ce qu'il est en train de lire : un fichier Markdown ou un PDF lisible,
 * sans passer par la console et sans embarquer le reste du domaine.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import PDFDocument from 'pdfkit';
import { serialiserEnMarkdown } from '../contenu/markdown';
import type { Registre } from '../donnees/note';

export interface RegistreAExporter {
	readonly titre: string;
	readonly registre: Registre;
	readonly document: unknown;
}

const LIBELLE_DU_REGISTRE: Readonly<Record<Registre, string>> = {
	reference: 'Référence',
	operationnel: 'Opérationnel'
};

/** Le nom téléchargé : stable, lisible, et sans séparateur de chemin. */
export function nomDuRegistreExporte(
	titre: string,
	registre: Registre,
	extension: 'md' | 'pdf'
): string {
	const sansCaracteresInterdits = Array.from(titre, (caractere) => {
		const code = caractere.codePointAt(0) ?? 0;
		return code < 32 || code === 127 || '/\\:"<>|?*'.includes(caractere) ? '-' : caractere;
	}).join('');
	const sain = sansCaracteresInterdits
		.replace(/\s+/gu, ' ')
		.trim()
		.replace(/[. ]+$/gu, '');
	const base = sain === '' ? 'note' : sain;
	const suffixe = registre === 'operationnel' ? '-operationnel' : '';
	return `${base}${suffixe}.${extension}`;
}

/** Un fichier Markdown autonome : titre, registre, puis le corps canonique. */
export function exporterLeRegistreEnMarkdown(entree: RegistreAExporter): string {
	const corps =
		entree.document === null || entree.document === undefined
			? ''
			: serialiserEnMarkdown(entree.document).trimEnd();
	const tete = `# ${entree.titre}\n\n> Registre : ${LIBELLE_DU_REGISTRE[entree.registre]}`;
	return corps === '' ? `${tete}\n` : `${tete}\n\n${corps}\n`;
}

/**
 * La police du produit est livrée avec l'application. En développement elle vit
 * dans `static`, et dans le paquet Node construit elle vit dans `build/client`.
 */
function policeDuProduit(): string | null {
	const candidats = [
		resolve('static/polices/literata-400-normal-latin-ext.woff2'),
		resolve('build/client/polices/literata-400-normal-latin-ext.woff2')
	];
	return candidats.find((chemin) => existsSync(chemin)) ?? null;
}

function policeMonospace(): string | null {
	const candidats = [
		resolve('static/polices/jetbrains-mono-400-normal-latin-ext.woff2'),
		resolve('build/client/polices/jetbrains-mono-400-normal-latin-ext.woff2')
	];
	return candidats.find((chemin) => existsSync(chemin)) ?? null;
}

/**
 * Pose le Markdown dans le PDF sans prétendre refaire le moteur HTML : titres,
 * listes, citations et blocs de code gardent leur hiérarchie, le reste demeure
 * du texte sélectionnable et paginé par PDFKit.
 */
function ecrireMarkdown(document: PDFKit.PDFDocument, markdown: string): void {
	let blocDeCode = false;
	for (const ligne of markdown.split('\n')) {
		if (ligne.startsWith('```')) {
			blocDeCode = !blocDeCode;
			continue;
		}
		if (blocDeCode) {
			document
				.font('Mono')
				.fontSize(9)
				.fillColor('#30383b')
				.text(ligne || ' ', {
					indent: 12,
					lineGap: 2
				});
			continue;
		}

		const titre = /^(#{1,6})\s+(.+)$/u.exec(ligne);
		if (titre !== null) {
			const niveau = titre[1]?.length ?? 1;
			document
				.moveDown(niveau === 1 ? 0.7 : 0.45)
				.font('Texte')
				.fontSize(Math.max(12, 22 - niveau * 2))
				.fillColor('#172326')
				.text(titre[2] ?? '');
			continue;
		}

		const liste = /^\s*(?:[-*+] |\d+[.)] )(.+)$/u.exec(ligne);
		if (liste !== null) {
			document
				.font('Texte')
				.fontSize(10.5)
				.fillColor('#263437')
				.text(`• ${liste[1] ?? ''}`, { indent: 12, lineGap: 3 });
			continue;
		}

		const citation = /^>\s?(.*)$/u.exec(ligne);
		if (citation !== null) {
			document
				.font('Texte')
				.fontSize(10)
				.fillColor('#566366')
				.text(citation[1] ?? '', { indent: 14, lineGap: 3 });
			continue;
		}

		if (ligne.trim() === '') {
			document.moveDown(0.55);
			continue;
		}
		document.font('Texte').fontSize(10.5).fillColor('#263437').text(ligne, { lineGap: 3 });
	}
}

/** Produit des octets PDF complets, prêts à être servis en téléchargement. */
export function exporterLeRegistreEnPdf(
	entree: RegistreAExporter
): Promise<Uint8Array<ArrayBuffer>> {
	return new Promise((accepter, refuser) => {
		const document = new PDFDocument({
			size: 'A4',
			margins: { top: 56, right: 54, bottom: 56, left: 54 },
			info: { Title: entree.titre, Author: 'Codicillus' }
		});
		const morceaux: Buffer[] = [];
		document.on('data', (morceau: Buffer) => morceaux.push(morceau));
		document.on('error', refuser);
		document.on('end', () => accepter(Uint8Array.from(Buffer.concat(morceaux))));

		const texte = policeDuProduit();
		const mono = policeMonospace();
		document.registerFont('Texte', texte ?? 'Helvetica');
		document.registerFont('Mono', mono ?? 'Courier');

		document.font('Texte').fontSize(22).fillColor('#172326').text(entree.titre);
		document.moveDown(0.35);
		document
			.fontSize(9)
			.fillColor('#6a7779')
			.text(`Registre ${LIBELLE_DU_REGISTRE[entree.registre]}`);
		document.moveDown(1.1);

		const markdown =
			entree.document === null || entree.document === undefined
				? ''
				: serialiserEnMarkdown(entree.document).trimEnd();
		if (markdown === '') {
			document.fontSize(10.5).fillColor('#6a7779').text('Ce registre est vide.');
		} else {
			ecrireMarkdown(document, markdown);
		}
		document.end();
	});
}
