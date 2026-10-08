/** La lecture intégrée et la disposition HTTP sont deux décisions distinctes. */
export const TYPE_MEDIA_PDF = 'application/pdf';

const TYPES_DES_TABLEURS = new Set([
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet'
]);
const TYPES_GENERIQUES = new Set([
	'application/octet-stream',
	'application/zip',
	'binary/octet-stream'
]);

export type FormeDeLecture = 'image' | 'pdf' | 'tableur' | 'video';

/** Les octets dont on ne sait rien, ou dont le type déclaré n'est pas un type. */
export const TYPE_DES_OCTETS = 'application/octet-stream';

/** `type/sous-type` en jetons de RFC 9110, sans paramètre, sans virgule, sans espace. */
const MOTIF_DE_TYPE = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/;

/**
 * LE TYPE QUE L'ON PEUT CROIRE. Le type d'une pièce vient du navigateur du déposant :
 * une liste séparée par des virgules y passe pour un PDF ici et se rend en HTML dans
 * le navigateur du lecteur, qui retient la dernière valeur. Tout ce qui n'est pas un
 * seul type bien formé devient des octets non typés.
 */
export function typeMediaNormalise(typeMedia: string): string {
	const type = (typeMedia.split(';')[0] ?? '').trim().toLowerCase();
	return MOTIF_DE_TYPE.test(type) ? type : TYPE_DES_OCTETS;
}

const typeDe = typeMediaNormalise;

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
