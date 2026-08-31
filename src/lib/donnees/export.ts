/**
 * LA LECTURE D'UN DOMAINE POUR L'EXPORT — la base, et rien d'inventé. `UC-M13-01` :
 * « l'administrateur exporte l'INTÉGRALITÉ d'un domaine dans un format ouvert et
 * réimportable. » La forme rendue est celle que `export/archive.ts` sait écrire ET
 * relire — la même des deux côtés, sans quoi « réimportable » ne voudrait rien dire.
 *
 * CE QUI ENTRE : les dossiers (l'arborescence entière, dossiers VIDES compris), les
 * notes avec la totalité de leurs colonnes, leurs étiquettes DANS LEUR RANG, leurs
 * relations sortantes avec leur origine (`P-08`), et leurs pièces jointes.
 *
 * LA CONSIGNATION DES PIÈCES vise un cas étroit et bien réel : une pièce dont la base
 * porte la ligne et dont l'entrepôt ne porte pas le fichier. `RG-NF-09` prend la base
 * et le volume SÉPARÉMENT, une restauration désaccordée produit exactement cet état,
 * et l'archive le consigne plutôt que d'écrire un fichier vide — une pièce de zéro
 * octet serait la valeur illustrative que `P-02` proscrit.
 *
 * L'ORDRE DES DOSSIERS FRÈRES VOYAGE, LA VALEUR DE LEUR POSITION NON : l'archive
 * conserve l'ordre par celui de ses entrées, et une réimportation reconstitue les
 * positions par rang. Un domaine dont les positions ne seraient pas un rang dense
 * verrait ses VALEURS renormalisées, son ordre intact.
 *
 * L'HISTORIQUE N'EST PAS L'ÉTAT : ni les vérifications (M06.2) ni les versions ne
 * sont exportées — `RG-M13-01` demande de reconstituer LE DOMAINE, et ni le gel ni
 * `UC-M13-01` ne les citent au contenu de l'archive.
 */
import { asc, eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	relations,
	typesDeFiche,
	typesDeNote,
	typesDeRelation
} from '../base/schema';
import type {
	AvertissementDeConversion,
	DomaineAExporter,
	NoteAExporter,
	PieceJointeAExporter,
	RelationAExporter
} from '../export/archive';
import { lireLesPiecesAvecLeursOctets } from './pieces';

/**
 * Le domaine, tel que l'adresse d'export le désigne. `DomaineResolu` ne porte PAS
 * l'identifiant lisible — il n'en a pas besoin —, et l'archive en a besoin : elle le
 * porte dans ses en-têtes et dans son nom de fichier. Le type est donc distinct.
 */
export interface DomaineDeLExport {
	readonly id: string;
	readonly identifiant: string;
	readonly nom: string;
}

export interface DomaineLu {
	readonly domaine: DomaineAExporter;
	readonly avertissements: readonly AvertissementDeConversion[];
}

export interface UniversDeLExport {
	readonly identifiant: string;
	readonly nom: string;
}

/**
 * Lit tout le domaine. Une seule passe par table, jamais une requête par note :
 * l'export d'un domaine volumineux est l'un des états que `V-36` montre.
 */
export async function lireLeDomaineAExporter(
	base: Base,
	univers: UniversDeLExport,
	domaine: DomaineDeLExport,
	racineDesFichiers: () => string
): Promise<DomaineLu> {
	const avertissements: AvertissementDeConversion[] = [];

	/* ── L'arborescence, dossiers vides compris ─────────────────────────── */
	const lignesDeDossier = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur,
			position: dossiers.position
		})
		.from(dossiers)
		.where(eq(dossiers.domaineId, domaine.id))
		.orderBy(asc(dossiers.profondeur), asc(dossiers.position), asc(dossiers.nom));

	const cheminParId = new Map<string, readonly string[]>();
	const ordonnes: { id: string; chemin: readonly string[] }[] = [];
	for (const ligne of lignesDeDossier) {
		const parent = ligne.parentId === null ? [] : (cheminParId.get(ligne.parentId) ?? []);
		const chemin = [...parent, ligne.nom];
		cheminParId.set(ligne.id, chemin);
		ordonnes.push({ id: ligne.id, chemin });
	}

	/* ── Les notes, et tout ce qu'une ligne de note porte ───────────────── */
	const lignesDeNote = await base
		.select({
			id: notes.id,
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			typeDeNote: typesDeNote.nom,
			typeDeFiche: typesDeFiche.nom,
			proprietesTypees: notes.proprietesTypees,
			dossierId: notes.dossierId,
			auteur: comptes.identifiant,
			visibilite: notes.visibilite,
			statut: notes.statut,
			creeLe: notes.creeLe,
			modifieLe: notes.modifieLe,
			corpsReferenceModifieLe: notes.corpsReferenceModifieLe,
			corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe,
			revisionDemandee: notes.revisionDemandee,
			revisionCommentaire: notes.revisionCommentaire,
			revisionParId: notes.revisionParId,
			revisionLe: notes.revisionLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id))
		.where(eq(notes.domaineId, domaine.id))
		.orderBy(asc(notes.identifiant));

	const idsDeNote = new Set(lignesDeNote.map((n) => n.id));

	/* ── Les étiquettes, DANS LEUR RANG ─────────────────────────────────── */
	const lignesDEtiquette = await base
		.select({
			noteId: etiquettesDeNote.noteId,
			libelle: etiquettes.libelle,
			ordre: etiquettesDeNote.ordre
		})
		.from(etiquettesDeNote)
		.innerJoin(etiquettes, eq(etiquettesDeNote.etiquetteId, etiquettes.id))
		.innerJoin(notes, eq(etiquettesDeNote.noteId, notes.id))
		.where(eq(notes.domaineId, domaine.id))
		.orderBy(asc(etiquettesDeNote.noteId), asc(etiquettesDeNote.ordre));

	const etiquettesParNote = new Map<string, string[]>();
	for (const ligne of lignesDEtiquette) {
		const deja = etiquettesParNote.get(ligne.noteId);
		if (deja === undefined) etiquettesParNote.set(ligne.noteId, [ligne.libelle]);
		else deja.push(ligne.libelle);
	}

	/* ── Les relations sortantes, avec leur origine (P-08) ──────────────── */
	const lignesDeRelation = await base
		.select({
			sourceId: relations.sourceId,
			cibleId: relations.cibleId,
			type: typesDeRelation.identifiant,
			origine: relations.origine
		})
		.from(relations)
		.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
		.innerJoin(notes, eq(relations.sourceId, notes.id))
		.where(eq(notes.domaineId, domaine.id))
		.orderBy(asc(relations.sourceId), asc(relations.cibleId), asc(typesDeRelation.identifiant));

	/* Les cibles d'une relation peuvent vivre HORS du domaine — la relation est
	   alors écrite dans l'archive, et c'est au chemin d'import de constater que
	   la cible lui manque. La perdre ici serait décider à sa place. */
	const identifiantParId = new Map(
		(await base.select({ id: notes.id, identifiant: notes.identifiant }).from(notes)).map((n) => [
			n.id,
			n.identifiant
		])
	);

	/* Le compte qui a demandé la révision est un COMPTE, pas une note : sa table
	   est lue à part. Les confondre aurait rendu `null` sans rien dire. */
	const comptesParId = new Map(
		(await base.select({ id: comptes.id, identifiant: comptes.identifiant }).from(comptes)).map(
			(c) => [c.id, c.identifiant]
		)
	);

	const relationsParNote = new Map<string, RelationAExporter[]>();
	for (const ligne of lignesDeRelation) {
		const cible = identifiantParId.get(ligne.cibleId);
		if (cible === undefined) continue;
		const relation = { cible, type: ligne.type, origine: ligne.origine };
		const deja = relationsParNote.get(ligne.sourceId);
		if (deja === undefined) relationsParNote.set(ligne.sourceId, [relation]);
		else deja.push(relation);
	}

	/* ── Les pièces jointes : lues dans l'entrepôt, jamais fabriquées ───── */
	const lignesDePiece = [
		...(await lireLesPiecesAvecLeursOctets(base, racineDesFichiers, [...idsDeNote]))
	].sort((a, b) => a.noteId.localeCompare(b.noteId) || a.nom.localeCompare(b.nom));

	/* ── L'assemblage ───────────────────────────────────────────────────── */
	const cheminDeNote = (dossierId: string): readonly string[] => {
		const chemin = cheminParId.get(dossierId);
		if (chemin === undefined) {
			throw new Error('note rattachée à un dossier hors du domaine : ' + dossierId);
		}
		return chemin;
	};

	const titreParNote = new Map(lignesDeNote.map((n) => [n.id, n.titre]));
	/* Les pièces dont l'entrepôt PORTE les octets entrent dans l'archive ; les autres
	   sont consignées — non par absence de stockage, mais par désaccord entre la base
	   et le volume, que `RG-NF-09` prend séparément. */
	const piecesParNote = new Map<string, PieceJointeAExporter[]>();
	for (const piece of lignesDePiece) {
		if (!idsDeNote.has(piece.noteId)) continue;
		if (piece.octets === null) {
			avertissements.push({
				famille: 'piece-sans-octets',
				note: identifiantParId.get(piece.noteId) ?? piece.noteId,
				titre: titreParNote.get(piece.noteId) ?? '',
				raison:
					'la pièce jointe « ' +
					piece.nom +
					' » (' +
					String(piece.tailleOctets) +
					' octets, ' +
					piece.typeMedia +
					') est en base mais ses octets ne sont pas dans l’entrepôt : la base et le volume des fichiers sont les deux éléments de la sauvegarde (RG-NF-09) et ils sont ici désaccordés'
			});
			continue;
		}
		const deja = piecesParNote.get(piece.noteId);
		const aExporter: PieceJointeAExporter = {
			nom: piece.nom,
			typeMedia: piece.typeMedia,
			deposeeLe: piece.deposeeLe.toISOString(),
			octets: piece.octets
		};
		if (deja === undefined) piecesParNote.set(piece.noteId, [aExporter]);
		else deja.push(aExporter);
	}

	const notesAExporter: NoteAExporter[] = lignesDeNote.map((n) => ({
		identifiant: n.identifiant,
		titre: n.titre,
		typeDeNote: n.typeDeNote,
		typeDeFiche: n.typeDeFiche,
		proprietesDeFiche: n.proprietesTypees ?? null,
		cheminDeDossier: cheminDeNote(n.dossierId),
		auteur: n.auteur,
		etiquettes: etiquettesParNote.get(n.id) ?? [],
		visibilite: n.visibilite,
		statut: n.statut,
		creeLe: n.creeLe.toISOString(),
		modifieLe: n.modifieLe.toISOString(),
		corpsReferenceModifieLe: n.corpsReferenceModifieLe.toISOString(),
		corpsOperationnelModifieLe: n.corpsOperationnelModifieLe?.toISOString() ?? null,
		verifieLe: n.verifieLe?.toISOString() ?? null,
		consultations: n.consultations,
		signetAdresse: n.signetAdresse,
		signetAjouteLe: n.signetAjouteLe,
		revisionDemandee: n.revisionDemandee,
		revisionCommentaire: n.revisionCommentaire,
		revisionPar: n.revisionParId === null ? null : (comptesParId.get(n.revisionParId) ?? null),
		revisionLe: n.revisionLe?.toISOString() ?? null,
		relations: relationsParNote.get(n.id) ?? [],
		corpsReference: n.corpsReference,
		corpsOperationnel: n.corpsOperationnel ?? null,
		/* Les pièces dont l'entrepôt porte les octets, et elles seules : une pièce
		   sans octets ferait échouer la relecture de l'archive — à raison. */
		piecesJointes: piecesParNote.get(n.id) ?? []
	}));

	return {
		domaine: {
			universIdentifiant: univers.identifiant,
			universNom: univers.nom,
			identifiant: domaine.identifiant,
			nom: domaine.nom,
			dossiers: ordonnes.map((d) => ({ chemin: d.chemin })),
			notes: notesAExporter
		},
		avertissements
	};
}

/**
 * CE QUE L'ARCHIVE NE PORTE PAS, ÉNUMÉRÉ PLUTÔT QUE TU. Cette liste est le seul
 * endroit du produit où ces quatre lacunes sont nommées ensemble : un lot qui en
 * comblerait une doit la retirer d'ici.
 */
export const CHAMPS_NON_EXPORTES: readonly string[] = [
	'l’historique des vérifications (M06.2)',
	'l’historique des versions (RG-M07-01)',
	'la valeur de `dossiers.position` — l’ORDRE des frères voyage, la valeur est renormalisée'
];
