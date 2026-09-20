import { read, utils, type WorkBook, type WorkSheet } from 'xlsx';

export interface FeuilleDeTableur {
	readonly nom: string;
	readonly cellules: WorkSheet;
	readonly debutLigne: number;
	readonly finLigne: number;
	readonly debutColonne: number;
	readonly finColonne: number;
}

export function lireLeTableur(octets: ArrayBuffer): FeuilleDeTableur[] {
	const signature = new Uint8Array(octets, 0, Math.min(octets.byteLength, 8));
	const zip = signature[0] === 0x50 && signature[1] === 0x4b;
	const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every(
		(octet, index) => signature[index] === octet
	);
	const biff = signature[0] === 0x09 && [0x00, 0x02, 0x04, 0x08].includes(signature[1] ?? -1);
	if (!zip && !ole && !biff)
		throw new Error('Le fichier n’est pas un tableur XLS, XLSX ou ODS lisible.');
	const classeur: WorkBook = read(octets, {
		type: 'array',
		cellFormula: true,
		cellText: true,
		cellHTML: false,
		sheetStubs: true
	});
	return classeur.SheetNames.map((nom) => {
		const cellules = classeur.Sheets[nom] ?? {};
		const contientDesValeurs = Object.keys(cellules).some((adresse) => {
			if (adresse.startsWith('!')) return false;
			const cellule = cellules[adresse];
			return cellule.f !== undefined || (cellule.v !== undefined && cellule.v !== null);
		});
		const plage =
			contientDesValeurs && cellules['!ref'] ? utils.decode_range(cellules['!ref']) : null;
		return {
			nom,
			cellules,
			debutLigne: plage?.s.r ?? 0,
			finLigne: plage?.e.r ?? -1,
			debutColonne: plage?.s.c ?? 0,
			finColonne: plage?.e.c ?? -1
		};
	});
}

export function nomDeColonne(colonne: number): string {
	return utils.encode_col(colonne);
}

export function valeurDeCellule(feuille: FeuilleDeTableur, ligne: number, colonne: number): string {
	const cellule = feuille.cellules[utils.encode_cell({ r: ligne, c: colonne })];
	if (!cellule) return '';
	if (cellule.f && (cellule.v === undefined || cellule.v === null))
		return 'Formule sans valeur enregistrée';
	if (cellule.v === undefined || cellule.v === null) return '';
	return cellule.w ?? utils.format_cell(cellule);
}
