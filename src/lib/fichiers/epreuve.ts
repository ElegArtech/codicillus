/**
 * L'ESSAI DES PIÈCES JOINTES — la chaîne entière, sur la base réelle. `pnpm
 * test:unit` éprouve les décisions ; ce module éprouve la CHAÎNE : une pièce déposée,
 * ses octets sur le disque, sa métadonnée en base, les mêmes octets ressortis par le
 * chemin de `RG-M04-08`, et le refus indiscernable pour qui n'y a pas droit.
 *
 * UN ESSAI, ET NON UNE SEMENCE : la table des pièces jointes compte ZÉRO ligne, et
 * elle en comptera zéro tant que le gel ne donnera pas ses treize pièces en données.
 * La branche « pièce servie » n'est donc exercée par AUCUN état du dépôt (`P-5`,
 * `P-26`). L'essai DÉPOSE ce qu'il lui faut, MESURE, puis RETIRE tout — et il le
 * vérifie plutôt que de le promettre.
 *
 * LES DEUX POLARITÉS SONT JOUÉES : la même pièce est demandée par l'administrateur,
 * qui reçoit ses octets comparés un par un, et par l'anonyme, qui reçoit le refus. Ce
 * refus est comparé PAR IDENTITÉ à celui d'une pièce inexistante : `ADR-007` n'exige
 * pas deux refus égaux, il exige le même objet par le même chemin.
 */
import { eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, notes, piecesJointes } from '../base/schema';
import { rendreDocument } from '../contenu/rendu';
import { gabaritDImage } from '../edition/constructions';
import {
	deposerUnePieceJointe,
	NomDePieceDejaPris,
	PieceTropVolumineuse,
	retirerUnePieceJointe,
	verifierLesPiecesJointes
} from '../donnees/pieces';
import { lireConfiguration } from '../donnees/lecture';
import { resoudreUnePieceJointe } from '../donnees/edition';
import { ANONYME, identiteAuthentifiee, INTROUVABLE } from '../droits/resolution';
import { adresseDePieceJointe } from '../rangement/adresses';
import { engendrerDesOctets, engendrerUneImagePng, TYPE_MEDIA_PNG } from './engendrer';
import {
	effacerLesOctets,
	ecrireLesOctets,
	lireLesOctets,
	plafondEnOctets,
	tailleSurDisque
} from './entrepot';

export interface PasDEpreuve {
	readonly nom: string;
	readonly regle: string;
	readonly attendu: string;
	readonly obtenu: string;
	readonly reussi: boolean;
}

/** Le nom que l'essai emploie. Il est retiré à la fin, il ne reste rien. */
const NOM_DE_LA_PIECE = 'essai-t026.png';

/** Les dimensions de l'image engendrée. La taille en octets, elle, est MESURÉE. */
const LARGEUR = 48;
const HAUTEUR = 32;

function pas(
	nom: string,
	regle: string,
	attendu: string,
	obtenu: string,
	reussi: boolean
): PasDEpreuve {
	return { nom, regle, attendu, obtenu, reussi };
}

/**
 * Joue l'essai. Rend un pas par mesure, dans l'ordre où elle a été faite.
 *
 * @param base la base
 * @param racine la racine de l'entrepôt
 */
export async function eprouverLesPiecesJointes(
	base: Base,
	racine: string
): Promise<readonly PasDEpreuve[]> {
	const resultats: PasDEpreuve[] = [];

	/* ── L'état d'entrée, pour pouvoir prouver le retour à l'identique ───── */
	const avant = await verifierLesPiecesJointes(base, racine);

	/* ── Le décor : une note INTERNE et un administrateur, tous deux réels ─ */
	const [note] = await base
		.select({ id: notes.id, identifiant: notes.identifiant, dossierId: notes.dossierId })
		.from(notes)
		.where(eq(notes.visibilite, 'interne'))
		.orderBy(notes.identifiant)
		.limit(1);
	const [administrateur] = await base
		.select({ id: comptes.id })
		.from(comptes)
		.where(eq(comptes.role, 'administrateur'))
		.limit(1);
	if (note === undefined || administrateur === undefined) {
		return [
			pas(
				'le décor',
				'—',
				'une note interne et un compte administrateur en base',
				'la base n’en porte pas : semer avant de jouer cet essai',
				false
			)
		];
	}
	const ADMIN = identiteAuthentifiee(administrateur.id, 'administrateur');

	/* ── 1. Le dépôt ─────────────────────────────────────────────────────── */
	const image = engendrerUneImagePng(LARGEUR, HAUTEUR);
	const depot = await deposerUnePieceJointe(base, racine, {
		note: note.identifiant,
		nom: NOM_DE_LA_PIECE,
		typeMedia: TYPE_MEDIA_PNG,
		octets: image,
		identite: ADMIN
	});
	if (!depot.trouve) {
		return [
			pas(
				'le dépôt',
				'RG-M04-08',
				'une pièce déposée sur ' + note.identifiant,
				'refus : l’administrateur n’a pas pu écrire sur le dossier de la note',
				false
			)
		];
	}
	const piece = depot.ressource;

	resultats.push(
		pas(
			'le dépôt écrit les OCTETS sur le disque',
			'STACK §8, RACINE_FICHIERS',
			`${String(image.length)} octets sous la racine de l’entrepôt`,
			`${String(await tailleSurDisque(racine, piece.noteId, piece.id))} octets`,
			(await tailleSurDisque(racine, piece.noteId, piece.id)) === image.length
		)
	);

	const [enBase] = await base
		.select({ tailleOctets: piecesJointes.tailleOctets, typeMedia: piecesJointes.typeMedia })
		.from(piecesJointes)
		.where(eq(piecesJointes.id, piece.id))
		.limit(1);
	resultats.push(
		pas(
			'le dépôt écrit la MÉTADONNÉE en base, taille MESURÉE',
			'P-02 — aucune valeur illustrative',
			`taille_octets = ${String(image.length)}, type_media = ${TYPE_MEDIA_PNG}`,
			`taille_octets = ${String(enBase?.tailleOctets)}, type_media = ${String(enBase?.typeMedia)}`,
			enBase?.tailleOctets === image.length && enBase.typeMedia === TYPE_MEDIA_PNG
		)
	);

	/* ── 2. La première polarité : l'ayant droit reçoit la pièce ─────────── */
	const pourAdmin = await resoudreUnePieceJointe(base, {
		identifiant: note.identifiant,
		fichier: NOM_DE_LA_PIECE,
		identite: ADMIN
	});
	let servis: Uint8Array | null = null;
	if (pourAdmin.trouve) {
		servis = await lireLesOctets(racine, pourAdmin.ressource.noteId, pourAdmin.ressource.id);
	}
	const identiques =
		servis !== null &&
		servis.length === image.length &&
		servis.every((octet, i) => octet === image[i]);
	resultats.push(
		pas(
			'un AYANT DROIT reçoit la pièce, octet pour octet',
			'RG-M04-08, UC-M04-04',
			`${String(image.length)} octets identiques à ceux déposés`,
			servis === null
				? 'aucun octet servi'
				: `${String(servis.length)} octets, identiques : ${String(identiques)}`,
			identiques
		)
	);

	/* ── 3. La polarité inverse : l'anonyme, et l'indiscernabilité ───────── */
	const pourAnonyme = await resoudreUnePieceJointe(base, {
		identifiant: note.identifiant,
		fichier: NOM_DE_LA_PIECE,
		identite: ANONYME
	});
	const pourAnonymeInexistante = await resoudreUnePieceJointe(base, {
		identifiant: note.identifiant,
		fichier: 'une-piece-qui-n-existe-pas.png',
		identite: ANONYME
	});
	resultats.push(
		pas(
			'un ANONYME ne reçoit pas la pièce d’une note interne',
			'RG-M04-08, RG-ACC-01',
			'refus, donc 404 à la route',
			pourAnonyme.trouve ? 'LA PIÈCE A ÉTÉ SERVIE' : 'refus',
			!pourAnonyme.trouve
		)
	);
	resultats.push(
		pas(
			'et son refus est LE MÊME OBJET que celui d’une pièce absente',
			'RG-ACC-04, ADR-007',
			'le même objet, par le même chemin de code',
			pourAnonyme === pourAnonymeInexistante && pourAnonyme === INTROUVABLE
				? 'le même objet'
				: 'deux objets distincts',
			pourAnonyme === pourAnonymeInexistante && pourAnonyme === INTROUVABLE
		)
	);

	/* ── 4. Le plafond, lu en base ───────────────────────────────────────── */
	const plafond = plafondEnOctets((await lireConfiguration(base)).tailleMaxPieceJointe);
	let refusDuPlafond = 'accepté — LE PLAFOND N’A PAS JOUÉ';
	try {
		await deposerUnePieceJointe(base, racine, {
			note: note.identifiant,
			nom: 'essai-t026-trop-gros.bin',
			typeMedia: 'application/octet-stream',
			octets: engendrerDesOctets(plafond + 1),
			identite: ADMIN
		});
	} catch (cause) {
		refusDuPlafond =
			cause instanceof PieceTropVolumineuse ? 'refusé' : `autre échec : ${String(cause)}`;
	}
	resultats.push(
		pas(
			'un dépôt d’un octet au-dessus du plafond est REFUSÉ',
			'M14.7 — le plafond est lu en base, jamais codé',
			`refus au-delà de ${String(plafond)} octets (${String(plafond / 1024 / 1024)} Mo)`,
			refusDuPlafond,
			refusDuPlafond === 'refusé'
		)
	);

	/* ── 5. L'homonyme, refusé au chemin d'écriture ──────────────────────── */
	let refusDeLHomonyme = 'accepté — L’AMBIGUÏTÉ A ÉTÉ CRÉÉE';
	try {
		await deposerUnePieceJointe(base, racine, {
			note: note.identifiant,
			nom: NOM_DE_LA_PIECE,
			typeMedia: TYPE_MEDIA_PNG,
			octets: image,
			identite: ADMIN
		});
	} catch (cause) {
		refusDeLHomonyme =
			cause instanceof NomDePieceDejaPris ? 'refusé' : `autre échec : ${String(cause)}`;
	}
	resultats.push(
		pas(
			'deux pièces de même nom sur une note sont REFUSÉES',
			'routes.md:146 (le nom EST l’adresse) + archive.ts:562',
			'refus',
			refusDeLHomonyme,
			refusDeLHomonyme === 'refusé'
		)
	);

	/* ── 6. La construction n° 10, de bout en bout ───────────────────────── */
	const adresse = adresseDePieceJointe(note.identifiant, piece.nom);
	const corps = gabaritDImage(adresse, 'L’image engendrée par l’essai', 'Figure', null);
	const html = rendreDocument(corps, { resoudre: () => null, contexte: 'interne' });
	const porteLAdresse = html.includes(`src="${adresse}"`);
	resultats.push(
		pas(
			'la construction n° 10 est productible de bout en bout',
			'M04.6, construction 10',
			`un corps rendu dont la source d’image est ${adresse}`,
			porteLAdresse
				? 'la source est celle de la pièce déposée'
				: 'la source n’est pas dans le rendu',
			porteLAdresse && identiques
		)
	);

	/* ── 7. L'intégrité, dans les deux polarités ─────────────────────────── */
	const accorde = await verifierLesPiecesJointes(base, racine);
	resultats.push(
		pas(
			'l’intégrité base ↔ entrepôt est SANS DÉFAUT quand les deux s’accordent',
			'RG-NF-09',
			'0 défaut',
			`${String(accorde.defauts.length)} défaut(s) sur ${String(accorde.pieces)} pièce(s)`,
			accorde.defauts.length === 0 && accorde.pieces === avant.pieces + 1
		)
	);

	/* La polarité inverse : le volume rendu sans les octets d'une pièce. Le cas
	   est FABRIQUÉ, donc il ne dépend d'aucun état du dépôt (`P-26`). */
	await effacerLesOctets(racine, piece.noteId, piece.id);
	const desaccorde = await verifierLesPiecesJointes(base, racine);
	const releve = desaccorde.defauts.filter(
		(d) => d.nom === NOM_DE_LA_PIECE && d.quoi === 'octets-absents'
	);
	resultats.push(
		pas(
			'et elle RELÈVE une ligne dont l’entrepôt ne porte pas les octets',
			'RG-NF-09 — la base et le volume sont deux éléments distincts',
			'1 défaut « octets-absents »',
			`${String(releve.length)} défaut(s) de ce type`,
			releve.length === 1
		)
	);
	await ecrireLesOctets(racine, piece.noteId, piece.id, image);

	/* ── 8. Le retrait — l'essai ne laisse rien ──────────────────────────── */
	const retiree = await retirerUnePieceJointe(base, racine, piece.noteId, piece.id);
	const apres = await verifierLesPiecesJointes(base, racine);
	const octetsRestants = await tailleSurDisque(racine, piece.noteId, piece.id);
	resultats.push(
		pas(
			'l’essai ne laisse RIEN derrière lui — ni ligne, ni octet',
			'P-22',
			`${String(avant.pieces)} pièce(s) en base, aucun octet de l’essai sur le disque`,
			`${String(apres.pieces)} pièce(s), octets de l’essai : ${octetsRestants === null ? 'aucun' : String(octetsRestants)}`,
			retiree && apres.pieces === avant.pieces && octetsRestants === null
		)
	);

	return resultats;
}
