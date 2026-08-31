/**
 * LES MOTIFS D'IMPORT, MIS EN FRANÇAIS — et une seule fois.
 *
 * `$lib/donnees/import.ts` ne produit que des CODES, et il dit pourquoi : « STACK §4.7
 * désigne la source des phrases françaises, un catalogue de messages, qui n'existe pas au
 * dépôt : les écrire là déciderait d'un texte d'interface en exécution ». Les phrases sont
 * donc du côté des écrans — mais elles sont lues par DEUX écrans : le rapport de fin de
 * parcours (`V-24`) et le rapport d'un lot passé (`V-35`, `/console/imports/{lot}`).
 *
 * Elles étaient écrites dans V-24 seulement, et V-35 rendait le code nu :
 * « service-de-conversion-injoignable » sous le nom du fichier. Deux tables auraient
 * divergé au premier motif ajouté ; il n'y en a qu'une, ici.
 *
 * Les formulations sont celles du gel de V-24, au caractère près.
 */
export const LIBELLE_DU_MOTIF: Readonly<Record<string, string>> = {
	'format-non-converti':
		"Ce format n'est pas converti en note. Déposez-le en pièce jointe d'une note existante.",
	'format-inconnu': "Le dépôt ne reconnaît pas ce format : le fichier n'a pas été ouvert.",
	'fichier-vide': 'Fichier vide, sans contenu à reprendre.',
	'doublon-dans-le-lot': 'Fichier identique à un autre du lot, conservé une seule fois.',
	'service-de-conversion-injoignable':
		"Le service de conversion n'a pas répondu. Le reste du lot a été traité ; ce fichier est à reprendre.",
	'outil-de-conversion-absent':
		"L'outil qui lit ce format manque au service de conversion. Le reste du lot a été traité.",
	'fichier-protege': "Le fichier est protégé par un mot de passe : son contenu n'a pas pu être lu.",
	'fichier-endommage': "La structure interne du fichier ne s'ouvre pas : il est endommagé.",
	'delai-de-conversion-depasse': 'La conversion a dépassé le délai accordé et a été interrompue.',
	'conversion-absente': "Ce fichier n'a pas été soumis à la conversion.",
	'contenu-illisible': "Le contenu n'a pas pu être lu comme un document."
};

/**
 * Le motif en clair, ou la valeur brute quand elle n'est pas un code connu : le lot
 * d'exemple du gel porte déjà des phrases dans ce champ, à ne pas traduire deux fois.
 */
export function motifEnClair(motif: string | undefined): string {
	if (motif === undefined) return '';
	return LIBELLE_DU_MOTIF[motif] ?? motif;
}
