/**
 * L'ENTREPÔT DES FICHIERS — les octets d'une pièce jointe, sur le disque.
 *
 * `compose.yaml:135-138` déclare `RACINE_FICHIERS` et y monte le volume
 * `fichiers` ; `Dockerfile:55` la pose dans l'image ; `STACK-TECHNIQUE.md` §8
 * en fait « le volume des fichiers joints et des images », SECOND et dernier
 * élément de la sauvegarde de `RG-NF-09`. Jusqu'au 20/08/2026 cette variable
 * n'était lue par AUCUNE ligne du dépôt : le produit déclarait un entrepôt
 * qu'il n'ouvrait jamais. Ce module l'ouvre, et lui seul.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CHEMIN EST DÉRIVÉ, JAMAIS STOCKÉ — ET C'EST CE QUI TIENT `RG-M04-08`
 *
 * `pieces_jointes` porte le nom, la taille et le type de média. Elle ne porte
 * NI OCTETS NI CHEMIN, et `006` n'en ajoute pas : le chemin d'une pièce est une
 * FONCTION de son identité en base — l'identifiant de sa note, puis le sien.
 *
 *     <racine>/<note_id>/<piece_id>
 *
 * Trois propriétés en découlent, et aucune ne repose sur la discipline de
 * l'appelant :
 *
 *   1. AUCUNE CHAÎNE FOURNIE PAR UN UTILISATEUR N'ENTRE DANS UN CHEMIN. Ni le
 *      nom du fichier, ni son type de média, ni rien de l'adresse demandée. Les
 *      deux seuls segments sont des UUID, et leur forme est VÉRIFIÉE ici avant
 *      toute jonction (`cheminDUnePiece`). La traversée de répertoire n'est pas
 *      « évitée par précaution » : elle est inaccessible par la forme. C'est la
 *      parade de `P-13` appliquée aux chemins — rien n'est concaténé à partir
 *      d'une saisie, donc rien n'est à échapper.
 *
 *   2. UNE PIÈCE N'EST PAS ATTEIGNABLE SANS PASSER PAR SA LIGNE EN BASE. Pour
 *      former le chemin, il faut déjà avoir résolu la ligne — donc avoir
 *      traversé `resoudreUnePieceJointe()`, son périmètre injecté (`ADR-006`)
 *      et `noteLisible()`. Un fichier servi statiquement, lui, rejouerait zéro
 *      droit : c'est exactement ce que `RG-M04-08` refuse, et le refus est ici
 *      structurel, pas déclaratif.
 *
 *   3. LE FICHIER SUR DISQUE NE PORTE NI NOM D'ORIGINE NI EXTENSION. Un serveur
 *      frontal mal configuré qui exposerait la racine ne rendrait que des
 *      octets anonymes, sans type devinable ni nom parlant, et sans révéler à
 *      quelle note ils appartiennent — l'identifiant de note en base est un
 *      UUID, pas l'identifiant lisible d'une note.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE FAIT PAS
 *
 * Il ne touche PAS la base : il ne connaît que des identifiants et des octets.
 * L'ordre des deux écritures — les octets d'abord, la ligne ensuite — est
 * décidé par `src/lib/donnees/pieces.ts`, qui les tient toutes les deux, et son
 * en-tête dit pourquoi cet ordre-là.
 *
 * Il n'invente AUCUNE racine par défaut. `RACINE_FICHIERS` absente est une
 * configuration manquante, pas un cas nominal : elle lève, exactement comme
 * `ConnexionNonConfigureeErreur` le fait pour la base (`connexion.ts`, ARB-050).
 * Un défaut deviné écrirait les fichiers d'exploitation à côté du volume
 * sauvegardé, et `RG-NF-09` perdrait la moitié de son objet SANS AUCUN SIGNAL.
 */
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/* ═══════════════════════════════════ Les refus typés ════════════════════ */

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

/* ═══════════════════════════════════ Les unités ═════════════════════════ */

/**
 * L'octet par kilooctet, puis par mégaoctet.
 *
 * LA VALEUR EST LUE AU GEL, ELLE N'EST PAS CHOISIE. `V-33:1351-1354` règle le
 * plafond en « Mo » ; `V-36:2878` est le seul endroit du gel qui convertisse, et
 * il divise par 1024 pour passer des Ko aux Mo (`src/vues/V-36.svelte:167` le
 * transcrit à l'identique). Le mégaoctet du produit vaut donc 1024 × 1024
 * octets, parce que c'est celui que la maquette calcule — et non parce qu'un
 * implémenteur aurait préféré la puissance de deux au multiple SI.
 */
export const OCTETS_PAR_KO = 1024;
export const OCTETS_PAR_MO = OCTETS_PAR_KO * OCTETS_PAR_KO;

/**
 * Le plafond, en octets, depuis le réglage de la console (M14.7).
 *
 * Le nombre de mégaoctets vient de `parametres.taille_max_piece_jointe`, lu par
 * `lireConfiguration()` — ce module ne connaît aucun plafond et n'en a aucun en
 * réserve : passer un nombre non entier ou négatif est une erreur de programme,
 * pas un cas de configuration, et il vaut mieux qu'elle éclate ici.
 *
 * @param mo le plafond tel que la console le règle
 */
export function plafondEnOctets(mo: number): number {
	if (!Number.isInteger(mo) || mo <= 0) {
		throw new RangeError(`plafond de pièce jointe non exploitable : ${String(mo)} Mo`);
	}
	return mo * OCTETS_PAR_MO;
}

/* ═══════════════════════════════════ La racine ══════════════════════════ */

/** Ce que ce module lit de l'environnement, et rien d'autre. */
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

/* ═══════════════════════════════════ Le chemin ══════════════════════════ */

/**
 * La forme d'un UUID, telle que PostgreSQL la rend. Le contrôle porte sur la
 * chaîne ENTIÈRE : c'est lui qui rend la traversée de répertoire inaccessible,
 * et il est éprouvé sur des chaînes qui la tentent (`P-5`).
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
 * Le chemin des octets d'une pièce. Fonction PURE, et c'est ce qui la rend
 * éprouvable sans disque ni base.
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

/** Le dossier d'une note — tout ce que l'effacement d'une note emporte. */
export function dossierDUneNote(racine: string, noteId: string): string {
	return join(racine, segment('l’identifiant de note', noteId));
}

/* ═══════════════════════════════════ Les octets ═════════════════════════ */

/**
 * Écrit les octets d'une pièce. L'écriture passe par un nom voisin puis un
 * renommage : une écriture interrompue laisserait un fichier TRONQUÉ à la place
 * définitive, c'est-à-dire une pièce dont la taille en base ne serait plus la
 * taille sur disque — le contrôle d'intégrité la dirait corrompue sans pouvoir
 * dire pourquoi. Le renommage, lui, est atomique dans un même système de
 * fichiers.
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
 * L'ABSENCE EST UNE VALEUR, PAS UNE EXCEPTION : une ligne en base sans octets
 * sur disque est un état que la restauration peut produire — une base rendue
 * sans son volume —, et l'appelant doit pouvoir la traiter plutôt que la subir.
 *
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
 */
export async function lireLesOctets(
	racine: string,
	noteId: string,
	pieceId: string
): Promise<Uint8Array<ArrayBuffer> | null> {
	try {
		/* Le tampon est RECOPIÉ dans un `ArrayBuffer` propre : c'est ce que le corps
		   d'une réponse HTTP accepte, et c'est aussi ce que fait `ecrireZip()`. */
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
 * La taille sur disque, ou `null` en l'absence du fichier. C'est elle que le
 * contrôle d'intégrité compare à `taille_octets`.
 *
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
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

/**
 * Efface les octets d'une pièce. Rend `true` si un fichier a été retiré.
 *
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
 */
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

/** L'absence de fichier, distinguée de toute autre panne du disque. */
function estAbsence(cause: unknown): boolean {
	return (
		typeof cause === 'object' &&
		cause !== null &&
		'code' in cause &&
		(cause as { code?: unknown }).code === 'ENOENT'
	);
}
