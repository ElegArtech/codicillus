/**
 * LES NOMS DE L'ARCHIVE D'EXPORT — LA SOURCE UNIQUE.
 *
 * Ces noms étaient définis au milieu de `archive.ts`, qui dépend de `node:zlib`
 * par `./zip`. Un écran ne pouvait donc pas les IMPORTER : `V-36` les
 * réécrivait en littéraux, et les littéraux ont divergé — l'écran annonçait un
 * rapport en Markdown quand l'archive en écrit un en texte, et un fichier
 * d'index que l'archive n'a jamais porté.
 *
 * Ce module ne dépend de rien. Il porte les noms ET les fabriques qui les
 * composent, de sorte que l'écran qui DÉCRIT l'archive et la fabrique qui la
 * PRODUIT lisent la même définition. `archive.ts` les réexporte : ses appelants
 * ne changent pas d'adresse.
 */

/** Le dossier voisin des pièces jointes — `V-36:2932`. */
export const DOSSIER_DES_PIECES = 'pieces-jointes';

/** Le rapport de conversion — `V-36:2937`. Du texte, jamais du Markdown. */
export const NOM_DU_RAPPORT = 'rapport-de-conversion.txt';

/** Le suffixe d'un fichier de note. */
export const SUFFIXE_DE_NOTE = '.md';

/** Les deux noms que la racine de l'archive se réserve. */
const RESERVES: readonly string[] = [DOSSIER_DES_PIECES, NOM_DU_RAPPORT];

/** Le caractère dont l'allongement du séparateur de registre ajoute une occurrence. */
export const ALLONGEMENT = '%';

/**
 * Un segment de chemin, rendu écrivable sans rien perdre. Deux caractères
 * seulement sont échappés, et le second l'est pour que le premier soit
 * inversible.
 */
export function echapperSegment(segment: string): string {
	let out = '';
	for (const c of segment) {
		if (c === ALLONGEMENT) out += '%25';
		else if (c === '/') out += '%2F';
		else out += c;
	}
	return out;
}

/**
 * L'inverse exact. Il décode TOUTE séquence de pour cent, et non les deux
 * seules qu'écrit l'échappement : le nom réservé est évité en échappant le
 * premier caractère du segment, quel qu'il soit.
 */
export function desechapperSegment(segment: string): string {
	return segment.replace(/%[0-9A-Fa-f]{2}/g, (m) =>
		String.fromCodePoint(Number.parseInt(m.slice(1), 16))
	);
}

/**
 * Le premier caractère d'un segment, échappé en séquence de pour cent —
 * l'unique parade à la collision avec un nom réservé de la racine.
 */
function eviterLeNomReserve(segmentEchappe: string): string {
	if (!RESERVES.includes(segmentEchappe)) return segmentEchappe;
	const premier = segmentEchappe.codePointAt(0);
	if (premier === undefined) return segmentEchappe;
	const hexa = premier.toString(16).toUpperCase().padStart(2, '0');
	return ALLONGEMENT + hexa + segmentEchappe.slice(String.fromCodePoint(premier).length);
}

/** Le chemin d'archive d'un dossier, dossier racine compris. */
export function cheminDArchive(chemin: readonly string[]): string {
	return chemin
		.map((s, rang) => (rang === 0 ? eviterLeNomReserve(echapperSegment(s)) : echapperSegment(s)))
		.join('/');
}

/** L'inverse : les segments vrais d'un chemin d'archive. */
export function segmentsDepuisLArchive(chemin: string): readonly string[] {
	return chemin.split('/').map(desechapperSegment);
}

/** Le dossier des pièces d'une note — un par note, pour que deux noms égaux tiennent. */
export function dossierDesPiecesDe(identifiant: string): string {
	return DOSSIER_DES_PIECES + '/' + echapperSegment(identifiant);
}

/**
 * Le nom de fichier d'une note, AVANT tout départage d'homonymes. Le titre est
 * repris tel quel — c'est ce que le gel promet (« le nom du fichier reprend le
 * titre de la note »), et il n'est ni mis en minuscules ni translittéré.
 */
export function nomDeFichierDeNote(titre: string): string {
	return echapperSegment(titre) + SUFFIXE_DE_NOTE;
}
