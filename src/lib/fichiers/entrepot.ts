/**
 * L'entrepôt des fichiers — les octets d'une pièce jointe, sur le disque. `RACINE_FICHIERS`
 * est déclarée par `compose.yaml` et l'entrepôt est le SECOND élément de la sauvegarde de
 * `RG-NF-09` ; aucune ligne du dépôt ne la lisait. Ce module l'ouvre, et lui seul.
 *
 * LE CHEMIN EST DÉRIVÉ, JAMAIS STOCKÉ — ET C'EST CE QUI TIENT `RG-M04-08` : `pieces_jointes`
 * ne porte ni octets ni chemin, et le chemin est une FONCTION de l'identité en base,
 * `<racine>/<note_id>/<piece_id>`. Trois propriétés en découlent :
 *
 *  1. AUCUNE CHAÎNE FOURNIE PAR UN UTILISATEUR N'ENTRE DANS UN CHEMIN. Les deux seuls segments
 *     sont des UUID, dont la forme est VÉRIFIÉE avant toute jonction : la traversée de
 *     répertoire est inaccessible par la forme.
 *  2. UNE PIÈCE N'EST PAS ATTEIGNABLE SANS PASSER PAR SA LIGNE EN BASE. Un fichier servi
 *     statiquement rejouerait zéro droit.
 *  3. LE FICHIER SUR DISQUE NE PORTE NI NOM D'ORIGINE NI EXTENSION.
 *
 * Il n'invente AUCUNE racine par défaut : `RACINE_FICHIERS` absente est une configuration
 * manquante, pas un cas nominal — elle lève. Un défaut deviné écrirait les fichiers à côté du
 * volume sauvegardé, et `RG-NF-09` perdrait la moitié de son objet SANS AUCUN SIGNAL.
 */
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Levée quand `RACINE_FICHIERS` n'est pas dans l'environnement. */
export class EntrepotNonConfigureErreur extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'EntrepotNonConfigureErreur';
	}
}

/** Levée quand un identifiant n'a pas la forme d'un UUID (voir l'en-tête, 1.). */
export class CheminNonDerivableErreur extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CheminNonDerivableErreur';
	}
}

/**
 * L'octet par kilooctet, puis par mégaoctet. LA VALEUR EST LUE AU GEL, ELLE N'EST PAS
 * CHOISIE : `V-36:2878` est le seul endroit du gel qui convertisse, et il divise par
 * 1024. Le mégaoctet du produit vaut donc 1024 × 1024 octets parce que c'est celui
 * que la maquette calcule.
 */
export const OCTETS_PAR_KO = 1024;
export const OCTETS_PAR_MO = OCTETS_PAR_KO * OCTETS_PAR_KO;

/**
 * Le plafond, en octets, depuis le réglage de la console (M14.7). Le nombre de mégaoctets
 * vient de `parametres.taille_max_piece_jointe` : ce module ne connaît aucun plafond et n'en a
 * aucun en réserve — passer un nombre non entier ou négatif est une erreur de programme.
 *
 * @param mo le plafond tel que la console le règle
 */
export function plafondEnOctets(mo: number): number {
	if (!Number.isInteger(mo) || mo <= 0) {
		throw new RangeError(`plafond de pièce jointe non exploitable : ${String(mo)} Mo`);
	}
	return mo * OCTETS_PAR_MO;
}

export interface EnvironnementDeLEntrepot {
	readonly RACINE_FICHIERS?: string | undefined;
}

/**
 * La racine de l'entrepôt. Aucune valeur par défaut — voir l'en-tête.
 *
 * @param env l'environnement à lire
 */
export function racineDesFichiers(env: EnvironnementDeLEntrepot): string {
	const racine = env.RACINE_FICHIERS?.trim();
	if (!racine) {
		throw new EntrepotNonConfigureErreur(
			'RACINE_FICHIERS n’est pas configurée : les pièces jointes et les images ' +
				'n’ont aucun entrepôt. La composition la pose (compose.yaml, service `app`) ' +
				'et l’image aussi (Dockerfile) ; hors conteneur, elle est à renseigner. ' +
				'Voir .env.example.'
		);
	}
	return racine;
}

/**
 * La forme d'un UUID, telle que PostgreSQL la rend. Le contrôle porte sur la chaîne
 * ENTIÈRE : c'est lui qui rend la traversée de répertoire inaccessible, et il est
 * éprouvé sur des chaînes qui la tentent.
 */
const FORME_DUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segment(role: string, valeur: string): string {
	if (!FORME_DUUID.test(valeur)) {
		throw new CheminNonDerivableErreur(
			`${role} n’a pas la forme d’un UUID : aucun chemin de fichier n’en est dérivable`
		);
	}
	return valeur;
}

/**
 * Le chemin des octets d'une pièce. Fonction PURE, éprouvable sans disque ni base.
 *
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
 */
export function cheminDUnePiece(racine: string, noteId: string, pieceId: string): string {
	return join(
		racine,
		segment('l’identifiant de note', noteId),
		segment('l’identifiant de pièce', pieceId)
	);
}

export function dossierDUneNote(racine: string, noteId: string): string {
	return join(racine, segment('l’identifiant de note', noteId));
}

/**
 * Écrit les octets d'une pièce. L'écriture passe par un nom voisin puis un renommage : une
 * écriture interrompue laisserait un fichier TRONQUÉ à la place définitive, c'est-à-dire une
 * pièce dont la taille en base ne serait plus la taille sur disque.
 *
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
 * @param octets le contenu, tel quel
 */
export async function ecrireLesOctets(
	racine: string,
	noteId: string,
	pieceId: string,
	octets: Uint8Array
): Promise<string> {
	const chemin = cheminDUnePiece(racine, noteId, pieceId);
	await mkdir(dossierDUneNote(racine, noteId), { recursive: true });
	const provisoire = `${chemin}.entrant`;
	await writeFile(provisoire, octets);
	await rename(provisoire, chemin);
	return chemin;
}

/**
 * Les octets d'une pièce, ou `null` si l'entrepôt ne les porte pas.
 *
 * L'ABSENCE EST UNE VALEUR, PAS UNE EXCEPTION : une ligne en base sans octets sur
 * disque est un état que la restauration peut produire — une base rendue sans son
 * volume —, et l'appelant doit pouvoir la traiter plutôt que la subir.
 */
export async function lireLesOctets(
	racine: string,
	noteId: string,
	pieceId: string
): Promise<Uint8Array<ArrayBuffer> | null> {
	try {
		/* Le tampon est RECOPIÉ dans un `ArrayBuffer` propre : c'est ce que le corps
		   d'une réponse HTTP accepte. */
		const lu = await readFile(cheminDUnePiece(racine, noteId, pieceId));
		const octets = new Uint8Array(new ArrayBuffer(lu.byteLength));
		octets.set(lu);
		return octets;
	} catch (cause) {
		if (estAbsence(cause)) return null;
		throw cause;
	}
}

/**
 * La taille sur disque, ou `null` en l'absence du fichier. C'est elle que le contrôle
 * d'intégrité compare à `taille_octets`.
 */
export async function tailleSurDisque(
	racine: string,
	noteId: string,
	pieceId: string
): Promise<number | null> {
	try {
		return (await stat(cheminDUnePiece(racine, noteId, pieceId))).size;
	} catch (cause) {
		if (estAbsence(cause)) return null;
		throw cause;
	}
}

/** Efface les octets d'une pièce. Rend `true` si un fichier a été retiré. */
export async function effacerLesOctets(
	racine: string,
	noteId: string,
	pieceId: string
): Promise<boolean> {
	const chemin = cheminDUnePiece(racine, noteId, pieceId);
	if ((await tailleSurDisque(racine, noteId, pieceId)) === null) return false;
	await rm(chemin, { force: true });
	return true;
}

function estAbsence(cause: unknown): boolean {
	return (
		typeof cause === 'object' &&
		cause !== null &&
		'code' in cause &&
		(cause as { code?: unknown }).code === 'ENOENT'
	);
}
