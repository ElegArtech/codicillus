/**
 * LE SCHÉMA — la description typée des objets métier de `CAHIER-DES-CHARGES-
 * FONCTIONNEL.md` §3, pour Drizzle ORM 0.45.2 sur PostgreSQL 18.6.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER N'EST PAS CE QUI CRÉE LES TABLES
 *
 * Les tables sont créées par `base/migrations/*.montee.sql`, écrites à la main
 * et accompagnées de leur `*.descente.sql`. Ce fichier en est la vue TYPÉE,
 * celle que l'application interroge.
 *
 * Deux descriptions du même objet peuvent diverger sans que rien ne le dise :
 * `pnpm base:coherence` compare celle-ci au CATALOGUE de la base réellement
 * migrée — tables, colonnes, types, nullabilité, contraintes — et sort en 1 à
 * la première divergence. C'est ce contrôle, et non la bonne volonté, qui tient
 * les deux ensemble.
 *
 * POURQUOI DES MIGRATIONS ÉCRITES À LA MAIN plutôt que `drizzle-kit generate` :
 * le contrat exige des migrations RÉVERSIBLES, et `drizzle-kit` 0.31 ne produit
 * pas de descente. Une réversibilité qu'aucun fichier ne porte ne se prouve
 * pas. Écart déclaré au rapport.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE VOCABULAIRE EST CONTRACTUEL (P-07)
 *
 * Noms de tables, de colonnes, de types et d'exports : les douze termes de
 * `CLAUDE.md` §3 et leurs dérivés directs, sans aucun synonyme. `note` n'est
 * jamais « document », « page » ni « article » ; `etiquette` n'est jamais
 * « tag » ; la fiche n'a pas de table à elle — c'est une note typée (RG-NOT-01).
 */
import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	check,
	date,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';

/* ═══════════════════════════════════════════════ Les énumérations ═══════ */

/**
 * Les quatre rôles des maquettes gelées. CDC §2.2 n'énonce que trois NIVEAUX
 * D'ACCÈS (anonyme, contributeur, administrateur) ; la console des comptes
 * (V-28) et `seeds/corpus.ts` portent quatre RÔLES. Les maquettes priment.
 */
export const roleDeCompte = pgEnum('role_de_compte', [
	'administrateur',
	'referent',
	'contributeur',
	'lecteur'
]);

/** CDC §3.2 — publique ou interne, défaut interne. */
export const visibilite = pgEnum('visibilite', ['interne', 'publique']);

/** CDC §3.2 et RG-NOT-04 — brouillon ou publiée, défaut publiée. */
export const statutDeNote = pgEnum('statut_de_note', ['brouillon', 'publiee']);

/** CDC §2.3 — les trois droits hérités dans l'arborescence de dossiers. */
export const droitDeDossier = pgEnum('droit_de_dossier', ['lecteur', 'redacteur', 'gestionnaire']);

/**
 * RG-STR-06 en énumère cinq ; les maquettes en portent six — « Dossiers » s'y
 * ajoute (`seeds/corpus.ts` `MODULES`). Les maquettes priment.
 */
export const moduleDeDomaine = pgEnum('module_de_domaine', [
	'notes',
	'dossiers',
	'fiches',
	'cartographie',
	'signets',
	'carte_mentale'
]);

/** P-08 et M08.3 — l'origine d'une relation est toujours visible. */
export const origineDeRelation = pgEnum('origine_de_relation', ['declaree', 'deduite', 'ambigue']);

/** CDC §3.5 — texte, nombre, date, liste de valeurs, lien, booléen. */
export const typeDeChamp = pgEnum('type_de_champ', [
	'texte',
	'nombre',
	'date',
	'liste',
	'lien',
	'booleen'
]);

/* ═══════════════════════════════════════════════════ Les comptes ════════ */

export const comptes = pgTable(
	'comptes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		courriel: text('courriel').notNull(),
		role: roleDeCompte('role').notNull(),
		actif: boolean('actif').notNull().default(true),
		/** RG-CPT-01 — compte de démonstration partagé : droits intacts, mot de passe figé. */
		motDePasseVerrouille: boolean('mot_de_passe_verrouille').notNull().default(false),
		arriveLe: date('arrive_le').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		unique('comptes_identifiant_unique').on(t.identifiant),
		unique('comptes_courriel_unique').on(t.courriel)
	]
);

/* ═══════════════════════════════ Le rangement : univers → domaine ═══════ */

/**
 * RG-STR-01 et ARB-001. Deux univers ne peuvent porter ni le même nom, ni le
 * même identifiant lisible — le second parce qu'il est le segment d'adresse.
 */
export const univers = pgTable(
	'univers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		description: text('description').notNull().default(''),
		couleur: text('couleur').notNull(),
		/** CDC §3.1 dit « icône » ; les maquettes portent `glyphe`, et priment. */
		glyphe: text('glyphe').notNull(),
		ordre: integer('ordre').notNull(),
		/** RG-STR-01 — « Non classé » existe par défaut et ne peut pas être supprimé. */
		systeme: boolean('systeme').notNull().default(false),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		unique('univers_nom_unique').on(t.nom),
		unique('univers_identifiant_unique').on(t.identifiant)
	]
);

/**
 * RG-STR-02 — l'identifiant lisible d'un domaine est unique AU SEIN DE SON
 * UNIVERS, pas globalement. L'unicité porte sur le couple, et ARB-001 interdit
 * explicitement d'y ajouter une unicité globale.
 */
export const domaines = pgTable(
	'domaines',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		universId: uuid('univers_id')
			.notNull()
			.references(() => univers.id, { onDelete: 'restrict' }),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		description: text('description').notNull().default(''),
		couleur: text('couleur').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [unique('domaines_identifiant_par_univers_unique').on(t.universId, t.identifiant)]
);

/** RG-STR-06 — un domaine active 1 à N modules parmi les six. */
export const modulesDeDomaine = pgTable(
	'modules_de_domaine',
	{
		domaineId: uuid('domaine_id')
			.notNull()
			.references(() => domaines.id, { onDelete: 'cascade' }),
		module: moduleDeDomaine('module').notNull()
	},
	(t) => [primaryKey({ name: 'modules_de_domaine_pk', columns: [t.domaineId, t.module] })]
);

/**
 * RG-STR-03, RG-STR-04, RG-STR-05. La clé étrangère composite
 * (parent_id, domaine_id) → (id, domaine_id) rend un parent d'un autre domaine
 * INÉCRIVABLE ; l'index partiel garantit un dossier racine et un seul par
 * domaine ; la contrainte de plafond porte RG-STR-04.
 */
export const dossiers = pgTable(
	'dossiers',
	{
		id: uuid('id').notNull().defaultRandom(),
		domaineId: uuid('domaine_id')
			.notNull()
			.references(() => domaines.id, { onDelete: 'cascade' }),
		parentId: uuid('parent_id'),
		nom: text('nom').notNull(),
		position: integer('position').notNull().default(0),
		profondeur: integer('profondeur').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({ name: 'dossiers_pk', columns: [t.id] }),
		unique('dossiers_id_domaine_unique').on(t.id, t.domaineId),
		foreignKey({
			name: 'dossiers_parent_meme_domaine',
			columns: [t.parentId, t.domaineId],
			foreignColumns: [t.id, t.domaineId]
		}).onDelete('cascade'),
		check('dossiers_profondeur_plafonnee', sql`${t.profondeur} BETWEEN 1 AND 10`),
		check('dossiers_racine_sans_parent', sql`(${t.parentId} IS NULL) = (${t.profondeur} = 1)`),
		check('dossiers_pas_son_propre_parent', sql`${t.parentId} IS DISTINCT FROM ${t.id}`),
		uniqueIndex('dossiers_racine_unique_par_domaine')
			.on(t.domaineId)
			.where(sql`${t.parentId} IS NULL`),
		index('dossiers_parent_idx').on(t.parentId)
	]
);

/**
 * RG-DRO-01 — « le droit explicite LE PLUS PROCHE » : un compte n'a qu'un droit
 * explicite par dossier. RG-DRO-02 — l'absence de ligne vaut fermeture.
 */
export const droitsDeDossier = pgTable(
	'droits_de_dossier',
	{
		dossierId: uuid('dossier_id')
			.notNull()
			.references(() => dossiers.id, { onDelete: 'cascade' }),
		compteId: uuid('compte_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'cascade' }),
		droit: droitDeDossier('droit').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ name: 'droits_de_dossier_pk', columns: [t.dossierId, t.compteId] })]
);

/* ═══════════════════════════════════════════════ Le référentiel ═════════ */

export const typesDeNote = pgTable(
	'types_de_note',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		ordre: integer('ordre').notNull()
	},
	(t) => [
		unique('types_de_note_identifiant_unique').on(t.identifiant),
		unique('types_de_note_nom_unique').on(t.nom)
	]
);

/** RG-REF-01 — un template par type fourni ; subsidiaire, jamais imposé. */
export const templates = pgTable(
	'templates',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		description: text('description').notNull().default(''),
		typeDeNoteId: uuid('type_de_note_id')
			.notNull()
			.references(() => typesDeNote.id, { onDelete: 'restrict' }),
		defaut: boolean('defaut').notNull().default(false),
		structure: jsonb('structure')
			.notNull()
			.default(sql`'[]'::jsonb`),
		contenu: text('contenu').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [unique('templates_identifiant_unique').on(t.identifiant)]
);

export const typesDeFiche = pgTable(
	'types_de_fiche',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		nom: text('nom').notNull(),
		ordre: integer('ordre').notNull()
	},
	(t) => [
		unique('types_de_fiche_identifiant_unique').on(t.identifiant),
		unique('types_de_fiche_nom_unique').on(t.nom)
	]
);

/** CDC §3.5 — le schéma de propriétés d'un type de fiche. */
export const champsDeTypeDeFiche = pgTable(
	'champs_de_type_de_fiche',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		typeDeFicheId: uuid('type_de_fiche_id')
			.notNull()
			.references(() => typesDeFiche.id, { onDelete: 'cascade' }),
		cle: text('cle').notNull(),
		nom: text('nom').notNull(),
		type: typeDeChamp('type').notNull(),
		ordre: integer('ordre').notNull(),
		exemple: text('exemple'),
		valeurs: jsonb('valeurs')
	},
	(t) => [
		unique('champs_cle_par_type_unique').on(t.typeDeFicheId, t.cle),
		check('champs_valeurs_reservees_a_la_liste', sql`${t.valeurs} IS NULL OR ${t.type} = 'liste'`)
	]
);

/** RG-M08-06 — un libellé par sens de lecture. */
export const typesDeRelation = pgTable(
	'types_de_relation',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		libelleSortant: text('libelle_sortant').notNull(),
		libelleEntrant: text('libelle_entrant').notNull(),
		/** Porte-t-elle une dépendance technique ? « Documente » n'en est pas une. */
		technique: boolean('technique').notNull().default(false),
		ordre: integer('ordre').notNull()
	},
	(t) => [
		unique('types_de_relation_identifiant_unique').on(t.identifiant),
		unique('types_de_relation_libelle_sortant_unique').on(t.libelleSortant)
	]
);

/** CDC §3.3 — mot-clé libre, PARTAGÉ à l'échelle du produit. Jamais « tag ». */
export const etiquettes = pgTable(
	'etiquettes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		libelle: text('libelle').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [unique('etiquettes_libelle_unique').on(t.libelle)]
);

/** CDC §3.3 — valeur de configuration globale : seuils, adresses, quotas, libellés. */
export const parametres = pgTable('parametres', {
	cle: text('cle').primaryKey(),
	valeur: jsonb('valeur').notNull(),
	modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow()
});

/* ══════════════════════════════════════════════════════ La note ═════════ */

/**
 * RG-NOT-01 — une note est unique ; la fiche n'est pas un objet séparé, et le
 * signet non plus (les maquettes en font un type de note portant une adresse).
 *
 * LA FRAÎCHEUR N'EST PAS UNE COLONNE (P-01, ADR-005) : les trois dates de
 * RG-M06-01 sont stockées, le niveau jamais.
 */
export const notes = pgTable(
	'notes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifiant: text('identifiant').notNull(),
		titre: text('titre').notNull(),
		/** ADR-003 — document ProseMirror sérialisé. Canonique, obligatoire. */
		corpsReference: jsonb('corps_reference').notNull(),
		/** RG-NOT-02 — optionnel, et ne peut exister sans Référence. */
		corpsOperationnel: jsonb('corps_operationnel'),
		typeDeNoteId: uuid('type_de_note_id')
			.notNull()
			.references(() => typesDeNote.id, { onDelete: 'restrict' }),
		domaineId: uuid('domaine_id')
			.notNull()
			.references(() => domaines.id, { onDelete: 'restrict' }),
		/** RG-STR-03 — toute note appartient à un dossier. */
		dossierId: uuid('dossier_id').notNull(),
		auteurId: uuid('auteur_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'restrict' }),
		visibilite: visibilite('visibilite').notNull().default('interne'),
		statut: statutDeNote('statut').notNull().default('publiee'),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow(),
		corpsReferenceModifieLe: timestamp('corps_reference_modifie_le', { withTimezone: true })
			.notNull()
			.defaultNow(),
		corpsOperationnelModifieLe: timestamp('corps_operationnel_modifie_le', {
			withTimezone: true
		}),
		verifieLe: timestamp('verifie_le', { withTimezone: true }),
		compteurDeConsultations: integer('compteur_de_consultations').notNull().default(0),
		revisionDemandee: boolean('revision_demandee').notNull().default(false),
		revisionCommentaire: text('revision_commentaire'),
		revisionParId: uuid('revision_par_id').references(() => comptes.id, {
			onDelete: 'set null'
		}),
		revisionLe: timestamp('revision_le', { withTimezone: true }),
		typeDeFicheId: uuid('type_de_fiche_id').references(() => typesDeFiche.id, {
			onDelete: 'restrict'
		}),
		proprietesTypees: jsonb('proprietes_typees'),
		signetAdresse: text('signet_adresse'),
		signetAjouteLe: date('signet_ajoute_le')
	},
	(t) => [
		unique('notes_identifiant_unique').on(t.identifiant),
		foreignKey({
			name: 'notes_dossier_du_meme_domaine',
			columns: [t.dossierId, t.domaineId],
			foreignColumns: [dossiers.id, dossiers.domaineId]
		}).onDelete('restrict'),
		check(
			'notes_operationnel_date_coherente',
			sql`(${t.corpsOperationnel} IS NULL) = (${t.corpsOperationnelModifieLe} IS NULL)`
		),
		check(
			'notes_proprietes_exigent_un_type_de_fiche',
			sql`${t.proprietesTypees} IS NULL OR ${t.typeDeFicheId} IS NOT NULL`
		),
		check(
			'notes_revision_coherente',
			sql`(NOT ${t.revisionDemandee} AND ${t.revisionCommentaire} IS NULL AND ${t.revisionParId} IS NULL AND ${t.revisionLe} IS NULL) OR (${t.revisionDemandee} AND ${t.revisionParId} IS NOT NULL AND ${t.revisionLe} IS NOT NULL)`
		),
		check(
			'notes_signet_coherent',
			sql`(${t.signetAdresse} IS NULL) = (${t.signetAjouteLe} IS NULL)`
		),
		check('notes_consultations_positives', sql`${t.compteurDeConsultations} >= 0`),
		index('notes_domaine_idx').on(t.domaineId),
		index('notes_dossier_idx').on(t.dossierId),
		index('notes_auteur_idx').on(t.auteurId),
		index('notes_perimetre_public_idx')
			.on(t.domaineId)
			.where(sql`${t.visibilite} = 'publique' AND ${t.statut} = 'publiee'`)
	]
);

export const etiquettesDeNote = pgTable(
	'etiquettes_de_note',
	{
		noteId: uuid('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		etiquetteId: uuid('etiquette_id')
			.notNull()
			.references(() => etiquettes.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ name: 'etiquettes_de_note_pk', columns: [t.noteId, t.etiquetteId] }),
		index('etiquettes_de_note_etiquette_idx').on(t.etiquetteId)
	]
);

/** RG-M08-03 — une même relation ne peut exister qu'une fois. */
export const relations = pgTable(
	'relations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		sourceId: uuid('source_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		cibleId: uuid('cible_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		typeDeRelationId: uuid('type_de_relation_id')
			.notNull()
			.references(() => typesDeRelation.id, { onDelete: 'restrict' }),
		origine: origineDeRelation('origine').notNull().default('declaree'),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		unique('relations_unicite').on(t.sourceId, t.cibleId, t.typeDeRelationId),
		check('relations_pas_reflexives', sql`${t.sourceId} <> ${t.cibleId}`),
		index('relations_cible_idx').on(t.cibleId)
	]
);

/** M04.7 — nom, taille, type. RG-M04-08 — la visibilité est celle de la note. */
export const piecesJointes = pgTable(
	'pieces_jointes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		noteId: uuid('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		nom: text('nom').notNull(),
		tailleOctets: bigint('taille_octets', { mode: 'number' }).notNull(),
		typeMedia: text('type_media').notNull(),
		deposeeLe: timestamp('deposee_le', { withTimezone: true }).notNull().defaultNow(),
		deposeeParId: uuid('deposee_par_id').references(() => comptes.id, { onDelete: 'set null' })
	},
	(t) => [
		check('pieces_jointes_taille_positive', sql`${t.tailleOctets} >= 0`),
		index('pieces_jointes_note_idx').on(t.noteId)
	]
);

/** M06.2 — l'historique complet des vérifications est conservé. */
export const verifications = pgTable(
	'verifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		noteId: uuid('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		compteId: uuid('compte_id').references(() => comptes.id, { onDelete: 'set null' }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('verifications_note_idx').on(t.noteId, t.le.desc())]
);

/** Le schéma complet, tel que l'ORM et le contrôle de cohérence le lisent. */
export const schema = {
	comptes,
	univers,
	domaines,
	modulesDeDomaine,
	dossiers,
	droitsDeDossier,
	typesDeNote,
	templates,
	typesDeFiche,
	champsDeTypeDeFiche,
	typesDeRelation,
	etiquettes,
	parametres,
	notes,
	etiquettesDeNote,
	relations,
	piecesJointes,
	verifications
};
