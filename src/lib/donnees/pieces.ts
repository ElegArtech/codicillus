/**
 * LES PIÈCES JOINTES — la ligne en base et les octets sur le disque, ensemble.
 *
 * Ce module est le SEUL endroit du produit où les deux écritures se rencontrent.
 * `src/lib/fichiers/entrepot.ts` ne connaît que des octets ; `edition.ts` ne
 * connaît que des lignes ; personne d'autre ne compose les deux.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ORDRE DES DEUX ÉCRITURES, ET IL N'EST PAS ARBITRAIRE
 *
 * Les octets D'ABORD, la ligne ENSUITE. Les deux pannes possibles ne sont pas de
 * même gravité :
 *
 *   · une ligne SANS octets est une pièce que le produit annonce et ne peut pas
 *     servir. Elle est visible partout — le panneau de V-14 la compte, l'export
 *     la réclame, le téléchargement rend une réponse que rien n'explique ;
 *   · des octets SANS ligne sont inertes. Le chemin d'une pièce étant dérivé de
 *     son identité en base, aucun octet orphelin n'est adressable : il n'est ni
 *     compté, ni servi, ni exporté. C'est du volume perdu, pas un mensonge.
 *
 * L'ordre choisi est donc celui qui rend la seconde panne possible et la
 * première improbable. Et si l'insertion échoue, les octets sont retirés dans le
 * même geste : la panne inerte elle-même n'est laissée que si le processus meurt
 * entre les deux, cas que `verifierLesPiecesJointes()` relève.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE PLAFOND EST LU EN BASE, ET RIEN NE LE REDIT
 *
 * `M14.7` (CDC:1197) range « taille maximale d'un fichier joint » parmi les
 * réglages de la console ; `V-33:1351-1354` le rend, en Mo, borné à 500 par la
 * maquette elle-même. La clé `taille_max_piece_jointe` EXISTAIT DÉJÀ en base —
 * `lireConfiguration()` la lit depuis `T-030`, la semence l'écrit
 * (`semence.ts:614`) —, et aucune clé n'a donc été ajoutée. Le plafond n'est
 * écrit nulle part dans le code : il est lu à chaque dépôt, ce qui est la seule
 * façon pour qu'un réglage de console soit « réellement effectif ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI N'EST PAS DÉCIDÉ ICI, ET QUI MANQUE — DÉCLARÉ, NON COMBLÉ
 *
 * AUCUNE SOURCE NE MAQUETTE LE DÉPÔT. `M04.8` porte un seul cas d'usage,
 * `UC-M04-04`, et c'est le TÉLÉCHARGEMENT ; `docs/routes.md` — inventaire
 * fermé de 39 routes — n'en compte aucune qui dépose ; la seule affordance du
 * gel est la zone de dépôt d'image de l'éditeur (`V-17:3076`, `V-17:3186`), qui
 * ne montre ni progression, ni refus, ni liste. `deposerUnePieceJointe()` est
 * donc la MÉCANIQUE du dépôt, sans écran : inventer la route et l'écran serait
 * un comblement (`CLAUDE.md` §2). Le manque est compté au rapport de `T-026`.
 */
import { and, eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { notes, piecesJointes } from '../base/schema';
import {
	effacerLesOctets,
	ecrireLesOctets,
	lireLesOctets,
	plafondEnOctets,
	tailleSurDisque
} from '../fichiers/entrepot';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { adresseDePieceJointe } from '../rangement/adresses';
import { peutEcrireSurLeDossier } from './edition';
import { lireConfiguration } from './lecture';

/* ═══════════════════════════════════ Les refus ══════════════════════════ */

/**
 * Le dépôt dépasse le plafond de la console. C'est un refus ADRESSÉ à quelqu'un
 * qui a le droit d'écrire : il nomme la limite, contrairement au refus
 * indiscernable d'`ADR-007` qui ne nomme jamais rien.
 */
export class PieceTropVolumineuse extends Error {
	constructor(
		readonly tailleOctets: number,
		readonly plafondOctets: number
	) {
		super(
			`la pièce jointe fait ${String(tailleOctets)} octets, le plafond de la ` +
				`configuration est de ${String(plafondOctets)} octets`
		);
		this.name = 'PieceTropVolumineuse';
	}
}

/**
 * Deux pièces de même nom sur une même note.
 *
 * CE REFUS EST DÉRIVÉ, ET DE DEUX SOURCES ÉCRITES DU DÉPÔT. `docs/routes.md:146`
 * fait du NOM l'adresse de la pièce : deux homonymes ne sont pas distinguables
 * par l'adresse, et la résolution en servirait un des deux sans que l'appelant
 * sache lequel. `src/lib/export/archive.ts:562-572` en tire déjà la conséquence
 * et REFUSE la note à l'export — « deux homonymes ne feraient qu'UNE entrée
 * d'archive, et la relecture rendrait les mêmes octets aux deux : une perte
 * silencieuse ».
 *
 * Le produit ne crée donc pas une ambiguïté que son propre export refuse. LA
 * BASE, ELLE, N'EN PORTE AUCUNE CONTRAINTE, et c'est délibéré : `archive.ts`
 * constate en propres termes qu'elle n'impose pas cette unicité, et poser un
 * index unique reviendrait à trancher, sans source, une règle fonctionnelle que
 * ni la CDC ni le gel n'énoncent. Le refus est donc au chemin d'ÉCRITURE, là où
 * l'ambiguïté naîtrait — pas dans le schéma. Compté au rapport de `T-026`.
 */
export class NomDePieceDejaPris extends Error {
	constructor(readonly nom: string) {
		super(`une pièce jointe nommée « ${nom} » est déjà portée par cette note`);
		this.name = 'NomDePieceDejaPris';
	}
}

/** Un nom de pièce vide n'est pas une adresse. */
export class NomDePieceVide extends Error {
	constructor() {
		super('une pièce jointe sans nom n’a pas d’adresse : le nom EST son adresse');
		this.name = 'NomDePieceVide';
	}
}

/* ═══════════════════════════════════ Le dépôt ═══════════════════════════ */

/** Ce qu'un dépôt porte. Les octets sont fournis entiers : rien n'est diffusé. */
export interface DepotDePieceJointe {
	/** L'identifiant LISIBLE de la note porteuse — celui de l'adresse. */
	readonly note: string;
	readonly nom: string;
	readonly typeMedia: string;
	readonly octets: Uint8Array;
	readonly identite: Identite;
}

/** Une pièce déposée, telle que le produit la porte désormais. */
export interface PieceDeposee {
	readonly id: string;
	readonly noteId: string;
	readonly nom: string;
	readonly tailleOctets: number;
	readonly typeMedia: string;
	/** L'adresse par laquelle elle sera servie, et la seule. */
	readonly adresse: string;
}

/**
 * Dépose une pièce jointe : ses octets dans l'entrepôt, sa métadonnée en base.
 *
 * LA SORTIE EST CELLE D'`ADR-007` QUAND LE DROIT MANQUE. Une note inexistante et
 * une note sur laquelle l'appelant ne peut pas écrire rendent le MÊME
 * `INTROUVABLE`, par le même chemin : un dépôt qui répondrait « cette note
 * existe mais vous n'y écrivez pas » énumérerait le corpus aussi bien qu'une
 * lecture.
 *
 * @param base la base
 * @param racine la racine de l'entrepôt
 * @param depot ce qui est déposé, et par qui
 */
export async function deposerUnePieceJointe(
	base: Base,
	racine: string,
	depot: DepotDePieceJointe
): Promise<Resolution<PieceDeposee>> {
	const nom = depot.nom.trim();
	if (nom === '') throw new NomDePieceVide();

	/* Le droit d'abord, la ressource ensuite — l'ordre de la route d'export. */
	const [note] = await base
		.select({ id: notes.id, dossierId: notes.dossierId })
		.from(notes)
		.where(eq(notes.identifiant, depot.note))
		.limit(1);
	if (note === undefined) return INTROUVABLE;
	if (!(await peutEcrireSurLeDossier(base, depot.identite, note.dossierId))) return INTROUVABLE;

	/* Le plafond, lu en base à CHAQUE dépôt (M14.7). */
	const plafond = plafondEnOctets((await lireConfiguration(base)).tailleMaxPieceJointe);
	if (depot.octets.length > plafond) {
		throw new PieceTropVolumineuse(depot.octets.length, plafond);
	}

	const [homonyme] = await base
		.select({ id: piecesJointes.id })
		.from(piecesJointes)
		.where(and(eq(piecesJointes.noteId, note.id), eq(piecesJointes.nom, nom)))
		.limit(1);
	if (homonyme !== undefined) throw new NomDePieceDejaPris(nom);

	/* L'identifiant est tiré ICI, et non par la base : le chemin des octets en
	   est la fonction, et les octets s'écrivent avant la ligne. */
	const id = crypto.randomUUID();
	await ecrireLesOctets(racine, note.id, id, depot.octets);
	try {
		await base.insert(piecesJointes).values({
			id,
			noteId: note.id,
			nom,
			/* La taille est MESURÉE sur les octets reçus. Aucun chiffre annoncé par
			   un appelant n'entre en base : c'est ce que `P-02` demande, et c'est
			   aussi ce qui rend le contrôle d'intégrité concluant. */
			tailleOctets: depot.octets.length,
			typeMedia: depot.typeMedia,
			deposeeParId: depot.identite.type === 'authentifie' ? depot.identite.compteId : null
		});
	} catch (cause) {
		await effacerLesOctets(racine, note.id, id);
		throw cause;
	}

	return {
		trouve: true,
		ressource: {
			id,
			noteId: note.id,
			nom,
			tailleOctets: depot.octets.length,
			typeMedia: depot.typeMedia,
			adresse: adresseDePieceJointe(depot.note, nom)
		}
	};
}

/**
 * Retire une pièce jointe : sa ligne, puis ses octets. L'ordre est l'inverse du
 * dépôt, et pour la même raison — après la ligne, les octets ne sont plus
 * adressables, et leur retrait ne peut plus mentir à personne.
 *
 * @param base la base
 * @param racine la racine de l'entrepôt
 * @param noteId l'identifiant en base de la note porteuse
 * @param pieceId l'identifiant en base de la pièce
 */
export async function retirerUnePieceJointe(
	base: Base,
	racine: string,
	noteId: string,
	pieceId: string
): Promise<boolean> {
	const efface = await base
		.delete(piecesJointes)
		.where(and(eq(piecesJointes.id, pieceId), eq(piecesJointes.noteId, noteId)))
		.returning({ id: piecesJointes.id });
	if (efface.length === 0) return false;
	await effacerLesOctets(racine, noteId, pieceId);
	return true;
}

/* ═══════════════════════════════════ L'export ═══════════════════════════ */

/** Une pièce jointe et ses octets, telle que l'archive d'export les attend. */
export interface PieceAvecOctets {
	readonly noteId: string;
	readonly nom: string;
	readonly typeMedia: string;
	readonly deposeeLe: Date;
	readonly tailleOctets: number;
	/** `null` quand l'entrepôt ne porte pas les octets — voir l'intégrité. */
	readonly octets: Uint8Array | null;
}

/**
 * Les pièces d'un ensemble de notes, octets compris. Une pièce dont l'entrepôt
 * ne porte pas les octets est rendue avec `null` : c'est à l'appelant de dire ce
 * qu'il en fait — l'export la consigne au rapport, il ne l'invente pas.
 *
 * LA RACINE EST DEMANDÉE TARD, ET C'EST DÉLIBÉRÉ. `racineDesFichiers()` LÈVE
 * quand la variable manque, et c'est le bon comportement : une configuration
 * absente ne se devine pas. Mais un domaine SANS AUCUNE PIÈCE n'a pas besoin
 * d'entrepôt, et le faire échouer là où il n'a rien à lire ferait dépendre
 * l'export de la configuration d'une chose qu'il n'utilise pas — un piège qui ne
 * se déclencherait que dans les environnements où la variable manque, c'est-à-dire
 * là où personne ne le chercherait. La fonction reçoit donc de quoi OBTENIR la
 * racine, et ne l'obtient que s'il y a des octets à lire.
 *
 * @param base la base
 * @param racine de quoi obtenir la racine de l'entrepôt, appelé au plus tard
 * @param noteIds les notes concernées
 */
export async function lireLesPiecesAvecLeursOctets(
	base: Base,
	racine: () => string,
	noteIds: readonly string[]
): Promise<readonly PieceAvecOctets[]> {
	if (noteIds.length === 0) return [];
	const voulues = new Set(noteIds);
	const lignes = (
		await base
			.select({
				id: piecesJointes.id,
				noteId: piecesJointes.noteId,
				nom: piecesJointes.nom,
				typeMedia: piecesJointes.typeMedia,
				deposeeLe: piecesJointes.deposeeLe,
				tailleOctets: piecesJointes.tailleOctets
			})
			.from(piecesJointes)
	).filter((l) => voulues.has(l.noteId));
	if (lignes.length === 0) return [];

	const ou = racine();
	const avec: PieceAvecOctets[] = [];
	for (const l of lignes) {
		avec.push({
			noteId: l.noteId,
			nom: l.nom,
			typeMedia: l.typeMedia,
			deposeeLe: l.deposeeLe,
			tailleOctets: l.tailleOctets,
			octets: await lireLesOctets(ou, l.noteId, l.id)
		});
	}
	return avec;
}

/* ═══════════════════════════════════ L'intégrité ════════════════════════ */

/** Ce qu'une pièce peut avoir de travers entre la base et l'entrepôt. */
export interface DefautDePiece {
	readonly note: string;
	readonly nom: string;
	readonly quoi: 'octets-absents' | 'taille-divergente';
	readonly attenduOctets: number;
	readonly surDisqueOctets: number | null;
}

/** Le rapport d'intégrité — combien de pièces, combien de défauts. */
export interface IntegriteDesPieces {
	readonly pieces: number;
	readonly octetsEnBase: number;
	readonly octetsSurDisque: number;
	readonly defauts: readonly DefautDePiece[];
}

/**
 * L'INTÉGRITÉ DE L'ENTREPÔT CONTRE LA BASE — ce que `RG-NF-09` a besoin de
 * savoir après une restauration.
 *
 * `STACK-TECHNIQUE.md` §8 fait de la sauvegarde deux éléments : le cliché de
 * PostgreSQL, et le volume des fichiers. Les deux sont pris séparément, donc
 * peuvent être rendus désaccordés — c'est même le seul défaut de restauration
 * que la procédure puisse produire silencieusement. Ce contrôle le mesure : pour
 * chaque ligne, l'entrepôt porte-t-il un fichier, et fait-il exactement le
 * nombre d'octets que la colonne annonce.
 *
 * IL EST CONCLUANT DANS LES DEUX SENS, et c'est ce qui le distingue d'un simple
 * « le fichier est là » : la taille en base est MESURÉE au dépôt, jamais
 * déclarée par l'appelant, donc une divergence de taille n'est pas une erreur de
 * saisie — c'est un fichier tronqué, ou le volume d'une autre sauvegarde.
 *
 * @param base la base
 * @param racine la racine de l'entrepôt
 */
export async function verifierLesPiecesJointes(
	base: Base,
	racine: string
): Promise<IntegriteDesPieces> {
	const lignes = await base
		.select({
			id: piecesJointes.id,
			noteId: piecesJointes.noteId,
			nom: piecesJointes.nom,
			tailleOctets: piecesJointes.tailleOctets,
			identifiant: notes.identifiant
		})
		.from(piecesJointes)
		.innerJoin(notes, eq(piecesJointes.noteId, notes.id));

	const defauts: DefautDePiece[] = [];
	let octetsEnBase = 0;
	let octetsSurDisque = 0;
	for (const l of lignes) {
		octetsEnBase += l.tailleOctets;
		const taille = await tailleSurDisque(racine, l.noteId, l.id);
		if (taille === null) {
			defauts.push({
				note: l.identifiant,
				nom: l.nom,
				quoi: 'octets-absents',
				attenduOctets: l.tailleOctets,
				surDisqueOctets: null
			});
			continue;
		}
		octetsSurDisque += taille;
		if (taille !== l.tailleOctets) {
			defauts.push({
				note: l.identifiant,
				nom: l.nom,
				quoi: 'taille-divergente',
				attenduOctets: l.tailleOctets,
				surDisqueOctets: taille
			});
		}
	}
	return { pieces: lignes.length, octetsEnBase, octetsSurDisque, defauts };
}
