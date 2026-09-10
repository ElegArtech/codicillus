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
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines as tableDomaines,
	modulesDeDomaine,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	piecesJointes,
	relations,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers as tableUnivers
} from '../base/schema';
import type {
	AvertissementDeConversion,
	DomaineAExporter,
	NoteAExporter,
	PieceJointeAExporter,
	RelationAExporter
} from '../export/archive';
import { lireLesPiecesAvecLeursOctets } from './pieces';
import { ecrireLesOctets, effacerLesOctets } from '../fichiers/entrepot';
import { entretenirLIndex } from '../recherche/entretien';

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
			validiteReference: notes.validiteReference,
			validiteOperationnel: notes.validiteOperationnel,
			verifieLeOperationnel: notes.verifieLeOperationnel,
			revisionRegistre: notes.revisionRegistre,
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
		cycle: {
			validiteReference: n.validiteReference,
			validiteOperationnel: n.validiteOperationnel,
			verifieLeOperationnel: n.verifieLeOperationnel?.toISOString() ?? null,
			revisionRegistre: n.revisionRegistre
		},
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

	const [configuration] = await base
		.select()
		.from(tableDomaines)
		.where(eq(tableDomaines.id, domaine.id));
	const modules = await base
		.select()
		.from(modulesDeDomaine)
		.where(eq(modulesDeDomaine.domaineId, domaine.id));
	return {
		domaine: {
			universIdentifiant: univers.identifiant,
			universNom: univers.nom,
			identifiant: domaine.identifiant,
			nom: domaine.nom,
			dossiers: ordonnes.map((d) => ({ chemin: d.chemin })),
			notes: notesAExporter,
			configuration: {
				description: configuration?.description ?? '',
				couleur: configuration?.couleur ?? '#1f5a3c',
				modules: modules.map((m) => m.module)
			}
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

/** Une archive cohérente qui entrerait en collision avec l'état déjà présent. */
export class CollisionDArchive extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CollisionDArchive';
	}
}

export interface DomaineReimporte {
	readonly univers: string;
	readonly domaine: string;
	readonly notes: number;
	readonly dossiers: number;
	readonly avertissements: readonly string[];
}

const MODULE_VERS_ENUM: Readonly<Record<string, (typeof modulesDeDomaine.$inferInsert)['module']>> =
	{
		notes: 'notes',
		dossiers: 'dossiers',
		fiches: 'fiches',
		cartographie: 'cartographie',
		modelisation: 'modelisation',
		signets: 'signets',
		carteMentale: 'carte_mentale',
		carte_mentale: 'carte_mentale'
	};

function dateDArchive(valeur: string | null, champ: string): Date | null {
	if (valeur === null) return null;
	const date = new Date(valeur);
	if (Number.isNaN(date.getTime())) throw new CollisionDArchive(`date « ${champ} » illisible`);
	return date;
}

function cleDeChemin(chemin: readonly string[]): string {
	return JSON.stringify(chemin);
}

/**
 * Recrée le domaine relu par `reimporterLArchive`. Toutes les lignes relationnelles sont
 * validées puis écrites dans UNE transaction. Les octets, qui ne peuvent appartenir à une
 * transaction PostgreSQL, sont posés avant elle et retirés si elle est annulée. L'index n'est
 * entretenu qu'après validation.
 */
export async function reimporterLeDomaine(
	base: Base,
	client: Meilisearch,
	racineFichiers: string,
	domaine: DomaineAExporter
): Promise<DomaineReimporte> {
	if (
		[domaine.universIdentifiant, domaine.universNom, domaine.identifiant, domaine.nom].some(
			(v) => v.trim() === ''
		)
	) {
		throw new CollisionDArchive('l’identité de l’univers ou du domaine est vide');
	}

	const universTrouves = await base
		.select({ id: tableUnivers.id, identifiant: tableUnivers.identifiant, nom: tableUnivers.nom })
		.from(tableUnivers)
		.where(
			or(
				eq(tableUnivers.identifiant, domaine.universIdentifiant),
				eq(tableUnivers.nom, domaine.universNom)
			)
		);
	if (
		universTrouves.length > 1 ||
		(universTrouves[0] !== undefined &&
			(universTrouves[0].identifiant !== domaine.universIdentifiant ||
				universTrouves[0].nom !== domaine.universNom))
	) {
		throw new CollisionDArchive(
			'l’univers de l’archive entre en collision avec un nom ou un identifiant existant'
		);
	}
	const universExistant = universTrouves[0];
	if (universExistant !== undefined) {
		const domaineExistant = await base
			.select({ id: tableDomaines.id })
			.from(tableDomaines)
			.where(
				and(
					eq(tableDomaines.universId, universExistant.id),
					eq(tableDomaines.identifiant, domaine.identifiant)
				)
			)
			.limit(1);
		if (domaineExistant.length > 0) {
			throw new CollisionDArchive('ce domaine existe déjà dans l’univers de destination');
		}
	}

	const identifiants = domaine.notes.map((note) => note.identifiant);
	if (new Set(identifiants).size !== identifiants.length) {
		throw new CollisionDArchive('plusieurs notes de l’archive portent le même identifiant');
	}
	if (identifiants.length > 0) {
		const collisions = await base
			.select({ identifiant: notes.identifiant })
			.from(notes)
			.where(inArray(notes.identifiant, identifiants));
		if (collisions.length > 0) {
			throw new CollisionDArchive(
				`l’identifiant de note « ${collisions[0]?.identifiant ?? ''} » est déjà utilisé`
			);
		}
	}

	const nomsDeType = [...new Set(domaine.notes.map((note) => note.typeDeNote))];
	const nomsDeFiche = [
		...new Set(domaine.notes.map((note) => note.typeDeFiche).filter((v): v is string => v !== null))
	];
	const nomsDeCompte = [
		...new Set(
			domaine.notes.flatMap((note) =>
				note.revisionPar === null ? [note.auteur] : [note.auteur, note.revisionPar]
			)
		)
	];
	const typesNotes = await base
		.select({ id: typesDeNote.id, nom: typesDeNote.nom })
		.from(typesDeNote)
		.where(inArray(typesDeNote.nom, nomsDeType));
	const typesFiches =
		nomsDeFiche.length === 0
			? []
			: await base
					.select({ id: typesDeFiche.id, nom: typesDeFiche.nom })
					.from(typesDeFiche)
					.where(inArray(typesDeFiche.nom, nomsDeFiche));
	const auteurs = await base
		.select({ id: comptes.id, identifiant: comptes.identifiant })
		.from(comptes)
		.where(inArray(comptes.identifiant, nomsDeCompte));
	const typeNoteParNom = new Map(typesNotes.map((ligne) => [ligne.nom, ligne.id]));
	const typeFicheParNom = new Map(typesFiches.map((ligne) => [ligne.nom, ligne.id]));
	const compteParNom = new Map(auteurs.map((ligne) => [ligne.identifiant, ligne.id]));
	for (const note of domaine.notes) {
		if (!typeNoteParNom.has(note.typeDeNote))
			throw new CollisionDArchive(`type de note « ${note.typeDeNote} » absent`);
		if (note.typeDeFiche !== null && !typeFicheParNom.has(note.typeDeFiche))
			throw new CollisionDArchive(`type de fiche « ${note.typeDeFiche} » absent`);
		if (!compteParNom.has(note.auteur))
			throw new CollisionDArchive(`auteur « ${note.auteur} » absent`);
		if (note.revisionPar !== null && !compteParNom.has(note.revisionPar))
			throw new CollisionDArchive(`compte de révision « ${note.revisionPar} » absent`);
	}

	const modulesDemandes = domaine.configuration?.modules ?? ['notes'];
	const modules = [...new Set(modulesDemandes.map((module) => MODULE_VERS_ENUM[module]))];
	if (modules.some((module) => module === undefined) || modules.length === 0) {
		throw new CollisionDArchive(
			'la configuration du domaine porte un module inconnu ou aucun module'
		);
	}

	const chemins = domaine.dossiers.map((dossier) => cleDeChemin(dossier.chemin));
	if (
		new Set(chemins).size !== chemins.length ||
		domaine.dossiers.some((d) => d.chemin.length === 0)
	) {
		throw new CollisionDArchive('l’arborescence porte un dossier vide ou dupliqué');
	}
	const cheminsConnus = new Set(chemins);
	for (const dossier of domaine.dossiers) {
		if (dossier.chemin.length > 1 && !cheminsConnus.has(cleDeChemin(dossier.chemin.slice(0, -1)))) {
			throw new CollisionDArchive(
				`le parent du dossier « ${dossier.chemin.join(' / ')} » est absent`
			);
		}
	}
	for (const note of domaine.notes) {
		if (!cheminsConnus.has(cleDeChemin(note.cheminDeDossier))) {
			throw new CollisionDArchive(`le dossier de la note « ${note.identifiant} » est absent`);
		}
	}

	const typesRelations = await base
		.select({ id: typesDeRelation.id, identifiant: typesDeRelation.identifiant })
		.from(typesDeRelation);
	const typeRelationParNom = new Map(typesRelations.map((ligne) => [ligne.identifiant, ligne.id]));
	const ciblesExternes = [
		...new Set(domaine.notes.flatMap((n) => n.relations.map((r) => r.cible)))
	];
	const notesExternes =
		ciblesExternes.length === 0
			? []
			: await base
					.select({ id: notes.id, identifiant: notes.identifiant })
					.from(notes)
					.where(inArray(notes.identifiant, ciblesExternes));
	const noteExterneParNom = new Map(notesExternes.map((ligne) => [ligne.identifiant, ligne.id]));
	const avertissements: string[] = [];
	const fichiersPoses: { noteId: string; pieceId: string }[] = [];
	let resultat: { universId: string; domaineId: string } | null = null;

	try {
		await base.transaction(async (tx) => {
			let universId = universExistant?.id;
			if (universId === undefined) {
				const dernier = await tx
					.select({ ordre: tableUnivers.ordre })
					.from(tableUnivers)
					.orderBy(desc(tableUnivers.ordre))
					.limit(1);
				const [cree] = await tx
					.insert(tableUnivers)
					.values({
						identifiant: domaine.universIdentifiant,
						nom: domaine.universNom,
						description: '',
						couleur: domaine.configuration?.couleur ?? '#1f5a3c',
						glyphe: 'globe',
						ordre: (dernier[0]?.ordre ?? 0) + 1
					})
					.returning({ id: tableUnivers.id });
				universId = cree?.id;
			}
			if (universId === undefined) throw new Error('univers non créé');
			const [domaineCree] = await tx
				.insert(tableDomaines)
				.values({
					universId,
					identifiant: domaine.identifiant,
					nom: domaine.nom,
					description: domaine.configuration?.description ?? '',
					couleur: domaine.configuration?.couleur ?? '#1f5a3c'
				})
				.returning({ id: tableDomaines.id });
			if (domaineCree === undefined) throw new Error('domaine non créé');
			await tx
				.insert(modulesDeDomaine)
				.values(modules.map((module) => ({ domaineId: domaineCree.id, module: module! })));

			const dossierParChemin = new Map<string, string>();
			const positionParParent = new Map<string, number>();
			for (const dossier of [...domaine.dossiers].sort(
				(a, b) => a.chemin.length - b.chemin.length
			)) {
				const parentCle = cleDeChemin(dossier.chemin.slice(0, -1));
				const parentId = dossier.chemin.length === 1 ? null : dossierParChemin.get(parentCle);
				if (dossier.chemin.length > 1 && parentId === undefined) throw new Error('parent absent');
				const rang = positionParParent.get(parentCle) ?? 0;
				const [cree] = await tx
					.insert(dossiers)
					.values({
						domaineId: domaineCree.id,
						parentId,
						nom: dossier.chemin.at(-1)!,
						position: rang,
						profondeur: dossier.chemin.length
					})
					.returning({ id: dossiers.id });
				if (cree === undefined) throw new Error('dossier non créé');
				dossierParChemin.set(cleDeChemin(dossier.chemin), cree.id);
				positionParParent.set(parentCle, rang + 1);
			}

			const noteParIdentifiant = new Map(noteExterneParNom);
			for (const note of domaine.notes) {
				const noteId = crypto.randomUUID();
				const dossierId = dossierParChemin.get(cleDeChemin(note.cheminDeDossier));
				if (dossierId === undefined) throw new Error('dossier de note absent');
				for (const piece of note.piecesJointes) {
					const pieceId = crypto.randomUUID();
					await ecrireLesOctets(racineFichiers, noteId, pieceId, piece.octets);
					fichiersPoses.push({ noteId, pieceId });
				}
				await tx.insert(notes).values({
					id: noteId,
					identifiant: note.identifiant,
					titre: note.titre,
					corpsReference: note.corpsReference,
					corpsOperationnel: note.corpsOperationnel,
					typeDeNoteId: typeNoteParNom.get(note.typeDeNote)!,
					typeDeFicheId: note.typeDeFiche === null ? null : typeFicheParNom.get(note.typeDeFiche),
					proprietesTypees: note.proprietesDeFiche,
					domaineId: domaineCree.id,
					dossierId,
					auteurId: compteParNom.get(note.auteur)!,
					visibilite: note.visibilite as 'publique' | 'interne',
					statut: note.statut as 'brouillon' | 'publiee',
					creeLe: dateDArchive(note.creeLe, 'cree_le')!,
					modifieLe: dateDArchive(note.modifieLe, 'modifie_le')!,
					corpsReferenceModifieLe: dateDArchive(
						note.corpsReferenceModifieLe,
						'corps_reference_modifie_le'
					)!,
					corpsOperationnelModifieLe: dateDArchive(
						note.corpsOperationnelModifieLe,
						'corps_operationnel_modifie_le'
					),
					verifieLe: dateDArchive(note.verifieLe, 'verifie_le'),
					verifieLeOperationnel: dateDArchive(
						note.cycle?.verifieLeOperationnel ?? null,
						'verifie_le_operationnel'
					),
					validiteReference: note.cycle?.validiteReference ?? 90,
					validiteOperationnel: note.cycle?.validiteOperationnel ?? 21,
					compteurDeConsultations: note.consultations,
					revisionDemandee: note.revisionDemandee,
					revisionCommentaire: note.revisionCommentaire,
					revisionParId: note.revisionPar === null ? null : compteParNom.get(note.revisionPar),
					revisionLe: dateDArchive(note.revisionLe, 'revision_le'),
					revisionRegistre: note.cycle?.revisionRegistre ?? null,
					signetAdresse: note.signetAdresse,
					signetAjouteLe: note.signetAjouteLe
				});
				noteParIdentifiant.set(note.identifiant, noteId);

				for (const [ordre, libelle] of note.etiquettes.entries()) {
					await tx.insert(etiquettes).values({ libelle }).onConflictDoNothing();
					const [etiquette] = await tx
						.select({ id: etiquettes.id })
						.from(etiquettes)
						.where(eq(etiquettes.libelle, libelle))
						.limit(1);
					if (etiquette === undefined) throw new Error('étiquette non créée');
					await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId: etiquette.id, ordre });
				}
				let rangPiece = 0;
				for (const piece of note.piecesJointes) {
					const posee = fichiersPoses[fichiersPoses.length - note.piecesJointes.length + rangPiece];
					if (posee === undefined) throw new Error('pièce non posée');
					await tx.insert(piecesJointes).values({
						id: posee.pieceId,
						noteId,
						nom: piece.nom,
						tailleOctets: piece.octets.length,
						typeMedia: piece.typeMedia,
						deposeeLe: dateDArchive(piece.deposeeLe, 'deposee_le')!
					});
					rangPiece += 1;
				}
			}

			for (const note of domaine.notes) {
				const sourceId = noteParIdentifiant.get(note.identifiant)!;
				for (const relation of note.relations) {
					const cibleId = noteParIdentifiant.get(relation.cible);
					const typeDeRelationId = typeRelationParNom.get(relation.type);
					if (cibleId === undefined || typeDeRelationId === undefined || cibleId === sourceId) {
						avertissements.push(
							`relation ${note.identifiant} → ${relation.cible} ignorée : cible ou type absent`
						);
						continue;
					}
					await tx.insert(relations).values({
						sourceId,
						cibleId,
						typeDeRelationId,
						origine: relation.origine as 'declaree' | 'deduite' | 'ambigue'
					});
				}
			}
			resultat = { universId, domaineId: domaineCree.id };
		});
	} catch (erreur) {
		await Promise.all(
			fichiersPoses.map(({ noteId, pieceId }) =>
				effacerLesOctets(racineFichiers, noteId, pieceId).catch(() => undefined)
			)
		);
		throw erreur;
	}

	if (resultat === null) throw new Error('réimportation non validée');
	await entretenirLIndex(base, client, identifiants);
	return {
		univers: domaine.universIdentifiant,
		domaine: domaine.identifiant,
		notes: domaine.notes.length,
		dossiers: domaine.dossiers.length,
		avertissements
	};
}
