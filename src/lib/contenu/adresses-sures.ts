/**
 * LES ADRESSES QU'UN CORPS DE NOTE A LE DROIT DE FAIRE CHARGER OU OUVRIR.
 *
 * Le schéma du document n'exige d'un lien ou d'une source qu'une chaîne non vide : sans
 * ce filtre, `javascript:` dans un lien, une image ou une pièce jointe intégrée
 * s'exécutait dans l'origine de l'application chez quiconque lisait la note — un
 * contributeur prenait ainsi la session d'un administrateur, et une note publique
 * atteignait les visiteurs anonymes.
 *
 * LE FILTRE EST AU RENDU, PAS À L'ENREGISTREMENT : une note déjà stockée avec une adresse
 * refusée continue de s'afficher, sans le lien, au lieu de tomber en erreur.
 */

const SCHEMAS_DE_LIEN = new Set(['http', 'https', 'mailto', 'tel']);
const SCHEMAS_DE_MEDIA = new Set(['http', 'https']);

/** Le chemin que `adresseDePieceJointe()` compose, et lui seul. */
const CHEMIN_DE_PIECE_JOINTE = /^\/notes\/[^/?#]+\/pieces-jointes\/[^/?#]+$/;

/**
 * L'adresse telle que le navigateur la lira : il retire les blancs et caractères de
 * contrôle en bordure, et les tabulations et sauts de ligne n'importe où — sans quoi
 * une tabulation glissée dans le schéma passerait le contrôle.
 */
function normaliser(adresse: string): string {
	let propre = '';
	for (const caractere of adresse) {
		const code = caractere.charCodeAt(0);
		if (code === 0x09 || code === 0x0a || code === 0x0d) continue;
		propre += caractere;
	}
	let debut = 0;
	let fin = propre.length;
	while (debut < fin && propre.charCodeAt(debut) <= 0x20) debut += 1;
	while (fin > debut && propre.charCodeAt(fin - 1) <= 0x20) fin -= 1;
	return propre.slice(debut, fin);
}

/** Le schéma en minuscules, ou `null` pour une adresse relative. */
function schemaDe(adresse: string): string | null {
	const trouve = /^([a-z][a-z0-9+.-]*):/i.exec(adresse);
	return trouve === null ? null : (trouve[1] ?? '').toLowerCase();
}

function admise(adresse: string, schemas: ReadonlySet<string>): string | null {
	const propre = normaliser(adresse);
	if (propre === '') return null;
	const schema = schemaDe(propre);
	return schema === null || schemas.has(schema) ? propre : null;
}

/** Un lien externe : web, courriel, téléphone, ou une adresse relative. */
export function lienSur(href: string): string | null {
	return admise(href, SCHEMAS_DE_LIEN);
}

/** La source d'une image : web, ou une adresse relative. */
export function sourceDImageSure(src: string): string | null {
	return admise(src, SCHEMAS_DE_MEDIA);
}

/**
 * La source d'une pièce jointe intégrée. Elle entre dans un cadre, une vidéo ou un
 * tableur : seule l'adresse d'une pièce jointe de l'instance y est admise.
 */
export function sourceDePieceJointeSure(src: string): string | null {
	const propre = normaliser(src);
	return CHEMIN_DE_PIECE_JOINTE.test(propre) ? propre : null;
}
