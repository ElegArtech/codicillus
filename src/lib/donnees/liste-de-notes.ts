/**
 * LA LISTE DES NOTES D'UN DOMAINE — V-12, lue BORNÉE AU DOMAINE, EN SQL.
 *
 * CE QUE CE MODULE REMPLACE, ET POURQUOI IL EXISTE. Le chargeur appelait
 * `lireNotesLisibles()`, qui ne prend AUCUN identifiant de domaine : son seul `where`
 * est le périmètre de droits, et pour un administrateur il n'y a pas de `where` du
 * tout. La restriction au domaine, les six facettes, leurs compteurs, le tri et le
 * compteur de résultats se faisaient DANS LE NAVIGATEUR, sur le corpus entier de
 * l'instance — corps `jsonb` compris, dont l'un servait à produire un extrait et
 * l'autre à une comparaison à `null`. Le coût était linéaire dans le nombre de notes
 * lisibles de L'INSTANCE, pas du domaine, et il ne se voyait pas à trente-deux notes.
 *
 * `ADR-006` EST TENU DE LA MÊME MANIÈRE QU'AVANT, ET AU MÊME ENDROIT : le périmètre
 * entre dans le `where` de CHACUNE des requêtes ci-dessous — le compte, la page, et
 * les six agrégats de facette. Aucune ligne n'est écartée après coup. Il est même
 * resserré : le périmètre est croisé avec les dossiers DU DOMAINE avant d'entrer dans
 * la clause, ce qui restreint sans jamais élargir.
 *
 * LA RÈGLE DES COMPTEURS DE FACETTE EST LE VRAI TRAVAIL. « Le compte affiché en
 * regard d'une valeur est celui qu'on obtiendrait SI cette valeur était retenue, les
 * autres facettes restant appliquées » : une facette ne se compte jamais sous son
 * propre filtre. Cela fait SIX agrégats, chacun sous un `where` DIFFÉRENT.
 *
 * LES DEUX FORMES ONT ÉTÉ MESURÉES, sur un domaine de deux mille notes et deux
 * facettes retenues : six requêtes, médiane 15,9 ms ; une passe en `GROUPING SETS`,
 * médiane 9,2 ms. La seconde n'est pas retenue, et le motif n'est pas le goût. Elle
 * porte les cinq valeurs et cinq prédicats en colonnes d'une passe unique, choisit
 * lequel des cinq comptes elle lit par `GROUPING()`, LAISSE DE TOUTE FAÇON LA FACETTE
 * « ÉTIQUETTE » DEHORS — la jointure qui la porte multiplie les lignes —, et surtout
 * rend des valeurs À COMPTE NUL que l'écran ne doit pas montrer : il lui faut un
 * `HAVING` de plus, dont l'oubli ne se voit sur aucun jeu de démonstration. Sept
 * millisecondes gagnées sur une lecture qui en perdait NEUF CENT SOIXANTE ne valent
 * pas ce piège.
 *
 * LE CORPS DE RÉFÉRENCE N'EST PLUS LU QUE POUR LA PAGE SERVIE, et le corps
 * OPÉRATIONNEL n'est plus lu du tout : la projection n'en teste que la nullité.
 */
import { and, eq, exists, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines,
	etiquettes,
	etiquettesDeNote,
	notes,
	piecesJointes,
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
import type { Perimetre } from '../droits/resolution';
import {
	assemblerLaFacette,
	CLES_DE_FACETTE,
	FACETTES_DE_NOTE,
	LIBELLE_DE_FRAICHEUR,
	LIBELLE_DE_STATUT,
	nombreDePages,
	type CleDeFacette,
	type FacetteRendue,
	type OrdreDeListe,
	type RetenuesDeFacette
} from '../liste/facettes';
import { joursEcoules, type ContexteDeLecture } from './lecture';
import { cheminAffiche, noteDepuisLigne, segmentsAffiches, type LigneDeDossier } from './rangement';
import type { IdentifiantNote, Note } from '../../../seeds/corpus';

export interface DemandeDeListe {
	readonly domaineId: string;
	readonly perimetre: Perimetre;
	/** Les dossiers du domaine, tels que `ouvrirLAcces()` les a déjà lus. */
	readonly dossiersDuDomaine: readonly LigneDeDossier[];
	readonly contexte: ContexteDeLecture;
	readonly retenues: RetenuesDeFacette;
	readonly ordre: OrdreDeListe;
	readonly page: number;
	readonly parPage: number;
}

export interface ListeDeNotes {
	/** LA PAGE, DÉJÀ FILTRÉE ET ORDONNÉE — la vue n'a plus rien à trier. */
	readonly notes: readonly Note[];
	/** Les notes du domaine dans le périmètre, SANS aucun filtre de facette. */
	readonly total: number;
	/** Celles qui passent les filtres retenus — le grand chiffre du compteur. */
	readonly nombre: number;
	readonly facettes: readonly FacetteRendue[];
	readonly modifications: Partial<Record<IdentifiantNote, number>>;
	readonly page: number;
	readonly pages: number;
}

/**
 * L'instant de référence de la fraîcheur — `RG-M06-01` : la dernière vérification, et
 * à défaut la dernière modification. C'est la transcription littérale de ce que
 * `noteDepuisLigne()` calcule en TypeScript, et les deux ne peuvent pas diverger sans
 * qu'un écran cesse de correspondre à sa facette.
 */
const REFERENCE_DE_FRAICHEUR = sql`coalesce(${notes.verifieLe}, ${notes.modifieLe})`;

/**
 * L'ancienneté d'un instant, EN JOURS ENTIERS — l'exacte contrepartie de
 * `joursEcoules()`, qui divise un écart de millisecondes par un jour et prend le
 * plancher. LE TRI PASSE PAR ELLE, ET IL LE FAUT : ordonner sur l'horodatage
 * départagerait deux notes que la vue tenait pour ex æquo, et la première page
 * changerait de contenu sans que rien ne l'explique.
 */
function joursEnSql(instant: SQL, maintenant: Date): SQL<number> {
	return sql<number>`floor(extract(epoch from (${maintenant}::timestamptz - ${instant})) / 86400)`;
}

/** La condition « FAUX », écrite plutôt que subie : voir `conditionDeFacette()`. */
const AUCUNE_LIGNE = sql`false`;

/**
 * LE REGROUPEMENT SE FAIT SUR LE RANG DE LA COLONNE, ET C'EST UNE NÉCESSITÉ, PAS UN
 * RACCOURCI. L'expression de la fraîcheur porte des PARAMÈTRES — l'instant de
 * référence et les deux seuils. Réécrite une seconde fois dans la clause de
 * regroupement, elle reçoit d'autres NUMÉROS de paramètre, et PostgreSQL n'y
 * reconnaît alors plus la même expression : il refuse la requête entière en exigeant
 * que la colonne figure dans le regroupement. Le rang, lui, désigne sans réécrire.
 */
const COLONNE_GROUPEE = sql`1`;

/**
 * Les notes d'un domaine, page par page, avec les compteurs de ses six facettes.
 */
export async function lireLaListeDeNotes(
	base: Base,
	demande: DemandeDeListe
): Promise<ListeDeNotes> {
	const chemins = cheminsDesDossiers(demande.dossiersDuDomaine);

	/* LE PÉRIMÈTRE, CROISÉ AVEC LE DOMAINE. `null` vaut « aucune restriction de
	   droit » — l'administrateur de `RG-DRO-03`. Un périmètre vide N'INTERROGE PAS
	   la base : un ensemble vide passé à une clause d'appartenance est une
	   expression que chaque dialecte rend à sa façon, et le doute ne se résout
	   jamais en faveur de l'accès. */
	const perimetre = demande.perimetre;
	const autorises = perimetre.tout
		? null
		: demande.dossiersDuDomaine.filter((d) => perimetre.dossiers.has(d.id)).map((d) => d.id);
	if (autorises !== null && autorises.length === 0) return LISTE_VIDE;

	const socle = and(
		eq(notes.domaineId, demande.domaineId),
		autorises === null ? undefined : inArray(notes.dossierId, autorises)
	);

	const parFacette = conditionsDesFacettes(base, demande, chemins);
	const toutes = CLES_DE_FACETTE.map((cle) => parFacette[cle]);
	/** Les filtres de toutes les facettes SAUF une — la règle des compteurs. */
	const saufCelleCi = (cle: CleDeFacette): SQL | undefined =>
		and(socle, ...CLES_DE_FACETTE.filter((c) => c !== cle).map((c) => parFacette[c]));
	const filtrees = and(socle, ...toutes);

	const [decompte] = await base
		.select({
			total: sql<number>`count(*)::int`,
			nombre: sql<number>`count(*) filter (where ${filtrees ?? sql`true`})::int`
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.where(socle);

	const total = decompte?.total ?? 0;
	const nombre = decompte?.nombre ?? 0;
	const pages = nombreDePages(nombre, demande.parPage);
	const page = Math.min(Math.max(1, demande.page), pages);

	const facettes = await lireLesFacettes(base, demande, chemins, saufCelleCi);
	const notesDeLaPage = await lireLaPage(base, demande, chemins, filtrees, page);

	const modifications: Record<string, number> = {};
	for (const n of notesDeLaPage.jours) modifications[n.identifiant] = n.jours;

	return {
		notes: notesDeLaPage.notes,
		total,
		nombre,
		facettes,
		modifications: modifications as Partial<Record<IdentifiantNote, number>>,
		page,
		pages
	};
}

/** Un domaine dont aucun dossier n'est lisible — rendu SANS interroger la base. */
const LISTE_VIDE: ListeDeNotes = Object.freeze({
	notes: [],
	total: 0,
	nombre: 0,
	facettes: [],
	modifications: {},
	page: 1,
	pages: 1
});

/**
 * Le chemin AFFICHÉ de chaque dossier du domaine — la valeur exacte de
 * `Note.dossier`, racine exclue. IL EST CALCULÉ ICI, PAS EN SQL, et ce n'est pas une
 * concession : `ouvrirLAcces()` a déjà lu l'arborescence entière, un domaine en
 * compte quelques dizaines de dossiers, et `segmentsAffiches()` est l'implémentation
 * unique de cette remontée. Une descente récursive en SQL en serait une seconde.
 */
function cheminsDesDossiers(lignes: readonly LigneDeDossier[]): ReadonlyMap<string, string> {
	return new Map(lignes.map((d) => [d.id, cheminAffiche(segmentsAffiches(lignes, d.id))]));
}

/** Les dossiers qu'un chemin affiché désigne — l'inverse de la table ci-dessus. */
function dossiersDuChemin(chemins: ReadonlyMap<string, string>): ReadonlyMap<string, string[]> {
	const par = new Map<string, string[]>();
	for (const [id, chemin] of chemins) {
		const deja = par.get(chemin);
		if (deja === undefined) par.set(chemin, [id]);
		else deja.push(id);
	}
	return par;
}

/**
 * La condition SQL d'une facette retenue. UNE VALEUR INCONNUE NE S'IGNORE PAS ICI :
 * `?statut=Brouillonn` doit rendre zéro résultat, comme la vue le faisait en
 * comparant des chaînes. D'où `AUCUNE_LIGNE` plutôt que l'absence de condition —
 * l'absence élargirait le résultat au lieu de le restreindre.
 */
function conditionDeFacette(
	base: Base,
	cle: CleDeFacette,
	valeurs: readonly string[],
	demande: DemandeDeListe,
	dossiers: ReadonlyMap<string, string[]>
): SQL {
	const secondes = sql`extract(epoch from (${demande.contexte.maintenant}::timestamptz - ${REFERENCE_DE_FRAICHEUR}))`;
	const seuil = (jours: number): SQL => sql`${jours * 86400}`;

	switch (cle) {
		case 'type':
			return inArray(typesDeNote.nom, [...valeurs]);
		case 'auteur':
			return inArray(comptes.nom, [...valeurs]);
		case 'statut': {
			const enBase = (['brouillon', 'publiee'] as const).filter((e) =>
				valeurs.includes(LIBELLE_DE_STATUT[e])
			);
			return enBase.length === 0 ? AUCUNE_LIGNE : inArray(notes.statut, [...enBase]);
		}
		case 'fraicheur': {
			/* Les deux comparaisons sont STRICTES, et le passage par les secondes est
			   exact : `floor(x) < k` équivaut à `x < k` pour un seuil entier. */
			const bornes: Record<string, SQL> = {
				[LIBELLE_DE_FRAICHEUR.frais]: sql`${secondes} < ${seuil(demande.contexte.seuils.frais)}`,
				[LIBELLE_DE_FRAICHEUR.vieil]: sql`${secondes} >= ${seuil(demande.contexte.seuils.frais)} and ${secondes} < ${seuil(demande.contexte.seuils.vieillissant)}`,
				[LIBELLE_DE_FRAICHEUR.obs]: sql`${secondes} >= ${seuil(demande.contexte.seuils.vieillissant)}`
			};
			const retenues = valeurs.flatMap((v) => {
				const borne = bornes[v];
				return borne === undefined ? [] : [borne];
			});
			return retenues.length === 0 ? AUCUNE_LIGNE : (or(...retenues) ?? AUCUNE_LIGNE);
		}
		case 'dossier': {
			const ids = valeurs.flatMap((v) => dossiers.get(v) ?? []);
			return ids.length === 0 ? AUCUNE_LIGNE : inArray(notes.dossierId, ids);
		}
		case 'etiquette':
			return conditionDEtiquette(base, valeurs);
	}
}

/**
 * La facette « Étiquette » est la seule MULTIVALUÉE : une note en porte zéro à N, et
 * les valeurs sont en OU. Sa condition est une SOUS-REQUÊTE D'EXISTENCE, jamais une
 * jointure : une jointure multiplierait les lignes de la page et ferait compter une
 * note autant de fois qu'elle porte d'étiquettes retenues.
 */
function conditionDEtiquette(base: Base, valeurs: readonly string[]): SQL {
	if (valeurs.length === 0) return AUCUNE_LIGNE;
	return exists(
		base
			.select({ un: sql<number>`1` })
			.from(etiquettesDeNote)
			.innerJoin(etiquettes, eq(etiquettes.id, etiquettesDeNote.etiquetteId))
			.where(and(eq(etiquettesDeNote.noteId, notes.id), inArray(etiquettes.libelle, [...valeurs])))
	);
}

function conditionsDesFacettes(
	base: Base,
	demande: DemandeDeListe,
	chemins: ReadonlyMap<string, string>
): Partial<Record<CleDeFacette, SQL>> {
	const dossiers = dossiersDuChemin(chemins);
	const par: Partial<Record<CleDeFacette, SQL>> = {};
	for (const cle of CLES_DE_FACETTE) {
		const valeurs = demande.retenues[cle];
		if (valeurs === undefined || valeurs.length === 0) continue;
		par[cle] = conditionDeFacette(base, cle, valeurs, demande, dossiers);
	}
	return par;
}

/** Les valeurs et leurs comptes, facette par facette. Six requêtes, six `where`. */
async function lireLesFacettes(
	base: Base,
	demande: DemandeDeListe,
	chemins: ReadonlyMap<string, string>,
	saufCelleCi: (cle: CleDeFacette) => SQL | undefined
): Promise<readonly FacetteRendue[]> {
	const rendues: FacetteRendue[] = [];
	for (const declaration of FACETTES_DE_NOTE) {
		const comptesDeLaFacette = await comptesDUneFacette(
			base,
			declaration.id,
			demande,
			chemins,
			saufCelleCi(declaration.id)
		);
		const facette = assemblerLaFacette(
			declaration,
			comptesDeLaFacette,
			demande.retenues[declaration.id] ?? []
		);
		if (facette.valeurs.length > 0) rendues.push(facette);
	}
	return rendues;
}

async function comptesDUneFacette(
	base: Base,
	cle: CleDeFacette,
	demande: DemandeDeListe,
	chemins: ReadonlyMap<string, string>,
	filtre: SQL | undefined
): Promise<ReadonlyMap<string, number>> {
	const n = sql<number>`count(*)::int`;
	const comptesRendus = new Map<string, number>();
	const ajouter = (valeur: string, nombre: number): void => {
		comptesRendus.set(valeur, (comptesRendus.get(valeur) ?? 0) + nombre);
	};

	if (cle === 'etiquette') {
		/* La seule facette dont l'agrégat JOINT : le couple (note, étiquette) est
		   unique en base, `count(*)` compte donc bien des notes distinctes. */
		const lignes = await base
			.select({ valeur: etiquettes.libelle, n })
			.from(notes)
			.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
			.innerJoin(comptes, eq(notes.auteurId, comptes.id))
			.innerJoin(etiquettesDeNote, eq(etiquettesDeNote.noteId, notes.id))
			.innerJoin(etiquettes, eq(etiquettes.id, etiquettesDeNote.etiquetteId))
			.where(filtre)
			.groupBy(COLONNE_GROUPEE);
		for (const ligne of lignes) ajouter(ligne.valeur, ligne.n);
		return comptesRendus;
	}

	const colonne =
		cle === 'type'
			? typesDeNote.nom
			: cle === 'auteur'
				? comptes.nom
				: cle === 'statut'
					? notes.statut
					: cle === 'dossier'
						? notes.dossierId
						: niveauDeFraicheurEnSql(demande.contexte);

	const lignes = await base
		.select({ valeur: sql<string>`${colonne}`, n })
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.where(filtre)
		.groupBy(COLONNE_GROUPEE);

	for (const ligne of lignes) {
		if (cle === 'dossier') ajouter(chemins.get(String(ligne.valeur)) ?? '', ligne.n);
		else if (cle === 'statut')
			ajouter(LIBELLE_DE_STATUT[ligne.valeur === 'brouillon' ? 'brouillon' : 'publiee'], ligne.n);
		else ajouter(String(ligne.valeur), ligne.n);
	}
	return comptesRendus;
}

/**
 * Le libellé de fraîcheur, calculé par la base. Il est GROUPÉ tel quel : les trois
 * valeurs sont celles de l'adresse autant que de l'affichage, et les traduire après
 * coup ferait un second endroit où le seuil se compare.
 */
function niveauDeFraicheurEnSql(contexte: ContexteDeLecture): SQL<string> {
	const secondes = sql`extract(epoch from (${contexte.maintenant}::timestamptz - ${REFERENCE_DE_FRAICHEUR}))`;
	return sql<string>`case
		when ${secondes} < ${contexte.seuils.frais * 86400} then ${LIBELLE_DE_FRAICHEUR.frais}::text
		when ${secondes} < ${contexte.seuils.vieillissant * 86400} then ${LIBELLE_DE_FRAICHEUR.vieil}::text
		else ${LIBELLE_DE_FRAICHEUR.obs}::text end`;
}

/**
 * L'ordre demandé, en clauses. LE DÉPARTAGE EST L'IDENTIFIANT, et il l'était déjà :
 * la lecture d'avant rendait ses lignes ordonnées par identifiant, et le tri de la
 * vue — un tri de tableau, donc STABLE — laissait cet ordre aux ex æquo.
 */
function ordreEnSql(ordre: OrdreDeListe, maintenant: Date): SQL[] {
	const parIdentifiant = sql`${notes.identifiant} asc`;
	switch (ordre) {
		case 'alpha':
			/* LA COLLATION EST NOMMÉE, ET C'EST LA CONDITION DE L'ÉQUIVALENCE : la
			   collation d'une base neuve classe sur les octets de l'encodage, où le e
			   accentué suit le f. `fr-FR-x-icu` est la table que `localeCompare(…, 'fr')`
			   applique de son côté. */
			return [sql`${notes.titre} collate "fr-FR-x-icu" asc`, parIdentifiant];
		case 'consultations':
			return [sql`${notes.compteurDeConsultations} desc`, parIdentifiant];
		case 'verification':
			return [sql`${joursEnSql(REFERENCE_DE_FRAICHEUR, maintenant)} asc`, parIdentifiant];
		case 'modification':
			return [sql`${joursEnSql(sql`${notes.modifieLe}`, maintenant)} asc`, parIdentifiant];
	}
}

interface PageDeNotes {
	readonly notes: readonly Note[];
	readonly jours: readonly { readonly identifiant: string; readonly jours: number }[];
}

/**
 * LA PAGE. DEUX REQUÊTES, ET C'EST LA RAISON D'ÊTRE DE CE MODULE : la première ne
 * rapporte que des identifiants et n'emporte donc aucun corps dans son tri ; la
 * seconde ne lit les corps que des notes réellement servies.
 */
async function lireLaPage(
	base: Base,
	demande: DemandeDeListe,
	chemins: ReadonlyMap<string, string>,
	filtrees: SQL | undefined,
	page: number
): Promise<PageDeNotes> {
	const rangs = await base
		.select({ id: notes.id })
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.where(filtrees)
		.orderBy(...ordreEnSql(demande.ordre, demande.contexte.maintenant))
		.limit(demande.parPage)
		.offset((page - 1) * demande.parPage);

	const identifiantsInternes = rangs.map((r) => r.id);
	if (identifiantsInternes.length === 0) return { notes: [], jours: [] };

	const lignes = await base
		.select({
			id: notes.id,
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			/* LE CORPS OPÉRATIONNEL N'EST PLUS RAPPORTÉ : `noteDepuisLigne()` n'en teste
			   que la nullité pour poser `operationnel`. Un document entier par note pour
			   une comparaison à `null`, c'était le quart des octets lus. */
			aOperationnel: sql<boolean>`${notes.corpsOperationnel} is not null`,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id))
		.where(inArray(notes.id, identifiantsInternes));

	const parId = new Map(lignes.map((l) => [l.id, l]));
	const ordonnees = identifiantsInternes.flatMap((id) => {
		const ligne = parId.get(id);
		return ligne === undefined ? [] : [ligne];
	});

	const voisines = {
		chemins,
		etiquettes: await etiquettesDesNotes(base, identifiantsInternes),
		piecesJointes: await piecesJointesDesNotes(base, identifiantsInternes)
	};

	return {
		notes: ordonnees.map((ligne) =>
			noteDepuisLigne(
				{
					...ligne,
					/* Le marqueur porte EXACTEMENT ce que la requête rapporte : la
					   présence, pas le contenu. */
					corpsOperationnel: ligne.aOperationnel ? CORPS_OPERATIONNEL_PRESENT : null
				},
				voisines,
				demande.contexte
			)
		),
		jours: ordonnees.map((ligne) => ({
			identifiant: ligne.identifiant,
			jours: joursEcoules(ligne.modifieLe, demande.contexte.maintenant)
		}))
	};
}

/** Voir `lireLaPage()` : `noteDepuisLigne()` ne LIT jamais ce corps, il le compare à `null`. */
const CORPS_OPERATIONNEL_PRESENT: unknown = Object.freeze({});

/**
 * Les étiquettes des notes de la page, triées en français. LE TRI EST FAIT EN
 * TYPESCRIPT, ET SURTOUT PAS PAR ORDRE SQL : la collation d'une base neuve classe sur
 * les octets de l'encodage.
 */
async function etiquettesDesNotes(
	base: Base,
	identifiantsInternes: readonly string[]
): Promise<ReadonlyMap<string, readonly string[]>> {
	const lignes = await base
		.select({ noteIdentifiant: notes.identifiant, libelle: etiquettes.libelle })
		.from(etiquettesDeNote)
		.innerJoin(notes, eq(etiquettesDeNote.noteId, notes.id))
		.innerJoin(etiquettes, eq(etiquettesDeNote.etiquetteId, etiquettes.id))
		.where(inArray(notes.id, [...identifiantsInternes]));

	const par = new Map<string, string[]>();
	for (const ligne of lignes) {
		const deja = par.get(ligne.noteIdentifiant);
		if (deja === undefined) par.set(ligne.noteIdentifiant, [ligne.libelle]);
		else deja.push(ligne.libelle);
	}
	for (const libelles of par.values()) libelles.sort((a, b) => a.localeCompare(b, 'fr'));
	return par;
}

/** Le nombre de pièces jointes des notes de la page — le compte RÉEL de la table. */
async function piecesJointesDesNotes(
	base: Base,
	identifiantsInternes: readonly string[]
): Promise<ReadonlyMap<string, number>> {
	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			nombre: sql<number>`count(${piecesJointes.id})::int`
		})
		.from(notes)
		.leftJoin(piecesJointes, eq(piecesJointes.noteId, notes.id))
		.where(inArray(notes.id, [...identifiantsInternes]))
		.groupBy(notes.identifiant);
	return new Map(lignes.map((l) => [l.identifiant, l.nombre]));
}
