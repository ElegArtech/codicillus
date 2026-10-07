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

export type FormeDeLecture = 'image' | 'pdf' | 'tableur' | 'video';

function typeDe(typeMedia: string): string {
	return (typeMedia.split(';')[0] ?? '').trim().toLowerCase();
}

export function formeDeLecture(typeMedia: string, nom = ''): FormeDeLecture | null {
	const type = typeDe(typeMedia);
	if (type.startsWith('image/')) return 'image';
	if (type === 'video/mp4' || type === 'video/webm') return 'video';
	if (type === TYPE_MEDIA_PDF) return 'pdf';
	if (TYPES_DES_TABLEURS.has(type)) return 'tableur';
	if (TYPES_GENERIQUES.has(type) && /\.(xlsx?|ods)$/i.test(nom)) return 'tableur';
	return null;
}

/**
 * Seuls les formats rendus nativement par le navigateur sont servis en ligne. LE SVG
 * N'EN EST PAS : c'est un document qui exécute ses scripts quand on l'ouvre, et le type
 * est celui que le navigateur du déposant a déclaré. Il reste affiché dans la note, par
 * une balise d'image, où aucun script ne tourne.
 */
export function seLitEnLigne(typeMedia: string): boolean {
	if (typeDe(typeMedia) === 'image/svg+xml') return false;
	const forme = formeDeLecture(typeMedia);
	return forme === 'image' || forme === 'pdf' || forme === 'video';
}

/** Le PDF est le seul format qui doit garder ses scripts : la visionneuse en dépend. */
export function seLitSansScript(typeMedia: string): boolean {
	return typeDe(typeMedia) !== TYPE_MEDIA_PDF;
}
