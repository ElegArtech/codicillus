import { describe, expect, it } from 'vitest';
import { utils, write, type BookType } from 'xlsx';
import { formeDeLecture, seLitEnLigne } from './affichage';
import { lireLeTableur, nomDeColonne, valeurDeCellule } from './tableur';

function exemple(format: BookType): ArrayBuffer {
	const classeur = utils.book_new();
	const feuille = utils.aoa_to_sheet([
		['Libellé', 'Valeur'],
		['Montant', 1234.5],
		['Date', new Date(Date.UTC(2026, 8, 20))],
		['Calcul', 12],
		['Sans résultat'],
		['Texte', '<img src=x onerror=alert(1)>']
	]);
	feuille.B2.z = '#,##0.00';
	feuille.B3.z = 'dd/mm/yyyy';
	feuille.B2.w = '1,234.50';
	feuille.B3.w = '20/09/2026';
	feuille.B4 = { t: 'n', f: '6+6', v: 12 };
	feuille.B5 = { t: 'n', f: 'SUM(B2:B4)' };
	utils.book_append_sheet(classeur, feuille, 'Données');
	utils.book_append_sheet(classeur, utils.aoa_to_sheet([['Seconde feuille']]), 'Suite');
	utils.book_append_sheet(classeur, utils.aoa_to_sheet([]), 'Vide');
	return write(classeur, { type: 'array', bookType: format });
}

describe('lecture des tableurs joints', () => {
	it.each(['xls', 'xlsx', 'ods'] as const)(
		'lit les feuilles et les valeurs enregistrées en %s',
		(format) => {
			const feuilles = lireLeTableur(exemple(format));
			expect(feuilles.map((feuille) => feuille.nom)).toEqual(['Données', 'Suite', 'Vide']);
			expect(valeurDeCellule(feuilles[0]!, 1, 1)).toBe('1,234.50');
			expect(valeurDeCellule(feuilles[0]!, 2, 1)).toBe('20/09/2026');
			expect(valeurDeCellule(feuilles[0]!, 3, 1)).toBe('12');
			expect(valeurDeCellule(feuilles[0]!, 5, 1)).toBe('<img src=x onerror=alert(1)>');
			expect(valeurDeCellule(feuilles[0]!, 99, 99)).toBe('');
			expect(feuilles[2]!.finLigne).toBe(-1);
		}
	);

	it('signale une formule sans résultat enregistré', () => {
		const feuilles = lireLeTableur(exemple('xlsx'));
		expect(valeurDeCellule(feuilles[0]!, 4, 1)).toBe('Formule sans valeur enregistrée');
	});

	it('refuse un contenu arbitraire renommé en tableur', () => {
		expect(() =>
			lireLeTableur(new TextEncoder().encode('<html>Connexion</html>').buffer)
		).toThrow();
		expect(() => lireLeTableur(new ArrayBuffer(0))).toThrow();
		expect(() => lireLeTableur(new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer)).toThrow();
	});

	it('repère les colonnes au-delà de Z', () => {
		expect(nomDeColonne(26)).toBe('AA');
		expect(nomDeColonne(16383)).toBe('XFD');
	});
});

describe('affichage des pièces jointes', () => {
	it.each([
		['application/vnd.ms-excel', 'test.xls'],
		['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'test.xlsx'],
		['application/vnd.oasis.opendocument.spreadsheet', 'test.ods'],
		['application/octet-stream', 'TABLEUR.XLSX'],
		['', 'test.ods'],
		['application/zip', 'test.xlsx']
	])('reconnaît %s avec le nom %s', (typeMedia, nom) => {
		expect(formeDeLecture(typeMedia, nom)).toBe('tableur');
		expect(seLitEnLigne(typeMedia)).toBe(false);
	});

	it('conserve les dispositions des images, PDF et fichiers non lus', () => {
		expect(formeDeLecture('image/png')).toBe('image');
		expect(seLitEnLigne('image/png')).toBe(true);
		expect(formeDeLecture('application/pdf')).toBe('pdf');
		expect(seLitEnLigne('application/pdf')).toBe(true);
		expect(formeDeLecture('application/octet-stream', 'texte.txt')).toBeNull();
		expect(formeDeLecture('text/html', 'test.xlsx')).toBeNull();
	});
});
