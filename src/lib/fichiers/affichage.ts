/** La lecture intégrée et la disposition HTTP sont deux décisions distinctes. */
export const TYPE_MEDIA_PDF = 'application/pdf';

const TYPES_DES_TABLEURS = new Set([
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet'
]);
const TYPES_GENERIQUES = new Set([
	'',
	'application/octet-stream',
	'application/zip',
	'binary/octet-stream'
]);

export type FormeDeLecture = 'image' | 'pdf' | 'tableur';

export function formeDeLecture(typeMedia: string, nom = ''): FormeDeLecture | null {
	const type = (typeMedia.split(';')[0] ?? '').trim().toLowerCase();
	if (type.startsWith('image/')) return 'image';
	if (type === TYPE_MEDIA_PDF) return 'pdf';
	if (TYPES_DES_TABLEURS.has(type)) return 'tableur';
	if (TYPES_GENERIQUES.has(type) && /\.(xlsx?|ods)$/i.test(nom)) return 'tableur';
	return null;
}

/** Seuls les formats rendus nativement par le navigateur sont servis en ligne. */
export function seLitEnLigne(typeMedia: string): boolean {
	const forme = formeDeLecture(typeMedia);
	return forme === 'image' || forme === 'pdf';
}
