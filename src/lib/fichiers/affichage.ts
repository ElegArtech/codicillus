/**
 * CE QUE LE PRODUIT SAIT LIRE LUI-MÊME, ET CE QU'IL SE CONTENTE DE RENDRE.
 *
 * Une pièce jointe téléchargée n'est pas une pièce jointe lue : le fichier quitte
 * l'application, s'ouvre dans un autre outil, et la note qui le portait n'est plus
 * à l'écran. Deux familles échappent à cela — les IMAGES et les PDF —, parce que
 * tout navigateur les rend sans rien installer. Elles s'affichent donc DANS la
 * note ; tout le reste se télécharge.
 *
 * LA DÉFINITION EST ICI, ET UNE SEULE FOIS (`P-01`). Elle décide de deux choses
 * qui doivent s'accorder ou la lecture casse sans erreur visible :
 *
 * - l'en-tête `content-disposition` que sert `…/pieces-jointes/{fichier}` — une
 *   pièce servie en `attachment` DÉCLENCHE UN TÉLÉCHARGEMENT même à l'intérieur
 *   d'un cadre, et la visionneuse resterait blanche ;
 * - l'affordance que le panneau de la note pose sur la pièce — un cadre pour un
 *   PDF, une image pour une image, un lien nu pour le reste.
 *
 * LE TYPE VIENT DE LA BASE, JAMAIS DU SUFFIXE. `deposerUnePieceJointe()` écrit le
 * type que le navigateur a annoncé, ou `application/octet-stream` à défaut ; rien
 * n'est déduit du nom de fichier, ici pas plus qu'ailleurs.
 */

/** Le préfixe des types d'image — le groupe entier, tel que la norme le nomme. */
const PREFIXE_DES_IMAGES = 'image/';

/** Le type d'un document portable. */
export const TYPE_MEDIA_PDF = 'application/pdf';

/**
 * La forme sous laquelle une pièce se lit en place — `null` quand le produit n'a
 * rien à en montrer et que le fichier doit sortir.
 */
export type FormeDeLecture = 'image' | 'pdf';

export function formeDeLecture(typeMedia: string): FormeDeLecture | null {
	if (typeMedia.startsWith(PREFIXE_DES_IMAGES)) return 'image';
	if (typeMedia === TYPE_MEDIA_PDF) return 'pdf';
	return null;
}

/**
 * `true` quand les octets doivent être servis `inline`. C'est le MÊME prédicat que
 * ci-dessus, exprimé pour l'en-tête : ce qui s'affiche en place se sert en place.
 */
export function seLitEnLigne(typeMedia: string): boolean {
	return formeDeLecture(typeMedia) !== null;
}
