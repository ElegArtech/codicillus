/**
 * Les pièces jointes — la ligne en base et les octets sur le disque, ensemble. Ce module est
 * le SEUL endroit du produit où les deux écritures se rencontrent.
 *
 * L'ORDRE DES DEUX ÉCRITURES N'EST PAS ARBITRAIRE : les octets D'ABORD, la ligne ENSUITE.
 * Une ligne SANS octets est une pièce que le produit annonce et ne peut pas servir ; des
 * octets SANS ligne sont inertes, le chemin d'une pièce étant dérivé de son identité en base.
 * Si l'insertion échoue, les octets sont retirés dans le même geste.
 *
 * LE PLAFOND EST LU EN BASE, ET RIEN NE LE REDIT : il est lu à chaque dépôt, seule façon pour
 * qu'un réglage de console soit réellement effectif.
 *
 * AUCUNE SOURCE NE MAQUETTE LE DÉPÔT : `M04.8` ne porte que le TÉLÉCHARGEMENT, et la seule
 * affordance du gel est la zone de dépôt d'image de l'éditeur. `deposerUnePieceJointe()` est
 * donc la MÉCANIQUE du dépôt, sans écran : inventer la route et l'écran serait un comblement.
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

/**
 * Le dépôt dépasse le plafond de la console. C'est un refus ADRESSÉ à quelqu'un qui a
 * le droit d'écrire : il nomme la limite, contrairement au refus indiscernable
 * d'`ADR-007`.
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
 * CE REFUS EST DÉRIVÉ DE DEUX SOURCES ÉCRITES : `docs/routes.md:146` fait du NOM l'adresse de
 * la pièce, donc deux homonymes ne sont pas distinguables ; et `../export/archive.ts` REFUSE
 * déjà la note à l'export pour cette raison. LA BASE N'EN PORTE AUCUNE CONTRAINTE, et c'est
 * délibéré : poser un index unique trancherait, sans source, une règle fonctionnelle que ni le
 * cahier ni le gel n'énoncent.
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

export interface DepotDePieceJointe {
	readonly note: string;
	readonly nom: string;
	readonly typeMedia: string;
	readonly octets: Uint8Array;
	readonly identite: Identite;
}

export interface PieceDeposee {
	readonly id: string;
	readonly noteId: string;
	readonly nom: string;
	readonly tailleOctets: number;
	readonly typeMedia: string;
	readonly adresse: string;
}

/**
 * Dépose une pièce jointe : ses octets dans l'entrepôt, sa métadonnée en base.
 *
 * LA SORTIE EST CELLE D'`ADR-007` QUAND LE DROIT MANQUE : une note inexistante et une note sur
 * laquelle l'appelant ne peut pas écrire rendent le MÊME `INTROUVABLE`.
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
 * Retire une pièce jointe : sa ligne, puis ses octets. L'ordre est l'inverse du dépôt, et pour
 * la même raison — après la ligne, les octets ne sont plus adressables.
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

export interface RetraitDePieceJointe {
	readonly note: string;
	/** Le nom de la pièce, qui EST son adresse (`docs/routes.md:146`). */
	readonly nom: string;
	readonly identite: Identite;
}

/**
 * RETIRE UNE PIÈCE DÉSIGNÉE PAR SON NOM — le geste tel qu'un écran peut le former, le nom
 * étant la seule clé qu'une adresse porte.
 *
 * ELLE EST LE PENDANT EXACT DE `deposerUnePieceJointe()` : même ordre — le droit d'abord, la
 * ressource ensuite —, même résolution par `peutEcrireSurLeDossier()`, et même sortie unique
 * `INTROUVABLE` quand la note n'existe pas, quand l'appelant n'y écrit pas, ou quand aucune
 * pièce ne porte ce nom (`ADR-007`, `RG-ACC-04`).
 *
 * LE DROIT EXIGÉ EST CELUI D'ÉCRIRE, PAS CELUI DE LIRE, et c'est ce qui interdit d'emprunter
 * `resoudreUnePieceJointe()`, qui résout la LISIBILITÉ. L'ORDRE DES DEUX EFFACEMENTS est celui
 * de `retirerUnePieceJointe()`, qu'elle appelle sans le redire.
 *
 * @param base la base
 * @param racine la racine de l'entrepôt
 * @param retrait ce qui est retiré, et par qui
 */
export async function retirerUnePieceJointeParNom(
	base: Base,
	racine: string,
	retrait: RetraitDePieceJointe
): Promise<Resolution<{ nom: string }>> {
	const nom = retrait.nom.trim();
	if (nom === '') return INTROUVABLE;

	const [note] = await base
		.select({ id: notes.id, dossierId: notes.dossierId })
		.from(notes)
		.where(eq(notes.identifiant, retrait.note))
		.limit(1);
	if (note === undefined) return INTROUVABLE;
	if (!(await peutEcrireSurLeDossier(base, retrait.identite, note.dossierId))) return INTROUVABLE;

	const [piece] = await base
		.select({ id: piecesJointes.id })
		.from(piecesJointes)
		.where(and(eq(piecesJointes.noteId, note.id), eq(piecesJointes.nom, nom)))
		.limit(1);
	if (piece === undefined) return INTROUVABLE;

	if (!(await retirerUnePieceJointe(base, racine, note.id, piece.id))) return INTROUVABLE;
	return { trouve: true, ressource: { nom } };
}

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
 * Les pièces d'un ensemble de notes, octets compris. Une pièce dont l'entrepôt ne porte pas
 * les octets est rendue avec `null` : c'est à l'appelant de dire ce qu'il en fait — l'export
 * la consigne au rapport, il ne l'invente pas.
 *
 * LA RACINE EST DEMANDÉE TARD, ET C'EST DÉLIBÉRÉ. `racineDesFichiers()` LÈVE quand la variable
 * manque, et c'est le bon comportement. Mais un domaine SANS AUCUNE PIÈCE n'a pas besoin
 * d'entrepôt, et le faire échouer là ferait dépendre l'export de la configuration d'une chose
 * qu'il n'utilise pas — un piège qui ne se déclencherait que là où personne ne le chercherait.
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

export interface DefautDePiece {
	readonly note: string;
	readonly nom: string;
	readonly quoi: 'octets-absents' | 'taille-divergente';
	readonly attenduOctets: number;
	readonly surDisqueOctets: number | null;
}

export interface IntegriteDesPieces {
	readonly pieces: number;
	readonly octetsEnBase: number;
	readonly octetsSurDisque: number;
	readonly defauts: readonly DefautDePiece[];
}

/**
 * L'INTÉGRITÉ DE L'ENTREPÔT CONTRE LA BASE — ce que `RG-NF-09` a besoin de savoir après une
 * restauration.
 *
 * `STACK-TECHNIQUE.md` §8 fait de la sauvegarde deux éléments : le cliché de PostgreSQL, et le
 * volume des fichiers. Les deux sont pris séparément, donc peuvent être rendus désaccordés —
 * c'est le seul défaut de restauration que la procédure puisse produire silencieusement. Ce
 * contrôle le mesure, et IL EST CONCLUANT DANS LES DEUX SENS : la taille en base est MESURÉE
 * au dépôt, jamais déclarée par l'appelant, donc une divergence de taille est un fichier
 * tronqué, ou le volume d'une autre sauvegarde.
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
