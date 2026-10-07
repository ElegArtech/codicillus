/**
 * LA LONGUEUR D'UN TITRE OU D'UN NOM. Sans borne, un titre de trois mille caractères
 * passait, et cassait l'affichage de tous ceux qui croisaient la note ou le dossier.
 */
export const LONGUEUR_MAX_DE_NOM = 200;

export function tropLong(texte: string): boolean {
	return [...texte].length > LONGUEUR_MAX_DE_NOM;
}

export const MOTIF_TITRE_TROP_LONG = 'titre trop long';
export const PHRASE_NOM_TROP_LONG = `Le nom dépasse ${LONGUEUR_MAX_DE_NOM} caractères. Raccourcissez-le.`;
