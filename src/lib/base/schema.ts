/**
 * Le schéma — la description typée des objets métier de `CDC` §3, pour Drizzle ORM sur
 * PostgreSQL.
 *
 * CE FICHIER N'EST PAS CE QUI CRÉE LES TABLES : elles le sont par
 * `base/migrations/*.montee.sql`, écrites à la main avec leur descente. Deux descriptions
 * du même objet peuvent diverger sans que rien ne le dise — `pnpm base:coherence` compare
 * celle-ci au CATALOGUE de la base migrée et sort en 1 à la première divergence. Les
 * migrations sont écrites à la main parce que le contrat exige des migrations RÉVERSIBLES
 * et que `drizzle-kit` ne produit pas de descente.
 *
 * LE VOCABULAIRE EST CONTRACTUEL (`P-07`) : noms de tables, de colonnes, de types et
 * d'exports sont les douze termes de `CLAUDE.md` §3, sans aucun synonyme.
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
import type { Configuration } from '../../../seeds/corpus';

/**
 * Les quatre rôles des maquettes gelées. CDC §2.2 n'énonce que trois NIVEAUX
 * D'ACCÈS ; la console des comptes en porte quatre RÔLES, et les maquettes priment.
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
		/**
		 * Le mot de passe a été posé par un administrateur, et il est à usage unique — V-32 :
		 * « il devra être changé à la première connexion ». ELLE NE SE LIT JAMAIS SEULE :
		 * `mot_de_passe_verrouille` dit qui ne PEUT PAS changer son mot de passe
		 * (`RG-CPT-01`), et lui imposer le changement l'enfermerait dehors.
		 */
		motDePasseAChanger: boolean('mot_de_passe_a_changer').notNull().default(false),
		/**
		 * `STACK` §4.7 — le condensat Argon2id, et jamais le mot de passe. NULLABLE :
		 * un compte sans condensat ne peut pas s'authentifier, ce qui est la
		 * fermeture par défaut.
		 */
		condensatMotDePasse: text('condensat_mot_de_passe'),
		arriveLe: date('arrive_le').notNull(),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
		modifieLe: timestamp('modifie_le', { withTimezone: true }).notNull().defaultNow(),
		/**
		 * Le domaine principal du compte. NULLABLE PAR EXIGENCE, et non faute de mieux :
		 * `RG-M14-04` dit « les comptes rattachés au domaine supprimé sont conservés ; leur
		 * rattachement devient vide ». `ON DELETE SET NULL` est la transcription littérale de
		 * cette phrase — `RESTRICT` interdirait la suppression que la règle autorise, `CASCADE`
		 * emporterait le compte qu'elle veut conserver. L'ACTION RÉFÉRENTIELLE N'EST ÉPROUVÉE
		 * PAR AUCUNE BATTERIE : `base:coherence` ne regarde ni les valeurs par défaut, ni le
		 * corps des CHECK, ni les actions référentielles. Dette nommée, pas oubli.
		 */
		domaineId: uuid('domaine_id').references(() => domaines.id, { onDelete: 'set null' }),
		/**
		 * L'instant de la dernière connexion. C'EST UN INSTANT, ET LE JEU N'EN PORTE QUE LE
		 * LIBELLÉ : « aujourd'hui à 08:41 » est un RENDU relatif, que les deux vues écrivent tel
		 * quel sans le calculer. Le gel ne donne aucune règle de passage de l'instant vers le
		 * libellé, et l'inventer serait un comblement. Nullable : un compte qui ne s'est jamais
		 * connecté n'a pas de dernière connexion.
		 */
		derniereConnexionLe: timestamp('derniere_connexion_le', { withTimezone: true })
	},
	(t) => [
		unique('comptes_identifiant_unique').on(t.identifiant),
		unique('comptes_courriel_unique').on(t.courriel),
		index('comptes_domaine_idx').on(t.domaineId)
	]
);

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
		ordre: integer('ordre').notNull(),
		/** `#f-desc` de V-29 — « ce que ce type décrit, et quand l'employer ». */
		description: text('description'),
		/** `#f-icones` de V-29 — la clé de l'icône choisie par l'administrateur. */
		glyphe: text('glyphe')
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
		/** `#f-props` de V-29 — l'aide à la saisie, telle que l'administrateur l'écrit. */
		aide: text('aide'),
		defaut: text('defaut'),
		/** V-29 — la propriété est-elle requise par le schéma de son type ? */
		obligatoire: boolean('obligatoire').notNull().default(false),
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

/**
 * Les huit clés de `parametres`, écrites une fois — M14.7. Elles vivaient en littéraux dans
 * `lireConfiguration()` seule, ce qui suffisait tant que RIEN N'ÉCRIVAIT dans cette table.
 * Deux jeux de littéraux rendraient possible ce que `RG-M14-09` interdit : un seuil
 * enregistré sous un nom que la lecture ignore, donc un badge qui ne bouge pas.
 *
 * LE TYPE EST LA GARANTIE, PAS LA DISCIPLINE : `Record<keyof Configuration, string>` refuse
 * à la compilation qu'un champ de la configuration n'ait pas sa clé. L'import du type est
 * ERASÉ à l'exécution — le jeu de semence n'entre pas dans le graphe du serveur par là.
 */
export const CLES_DE_PARAMETRE: Readonly<Record<keyof Configuration, string>> = Object.freeze({
	seuilFrais: 'seuil_frais',
	seuilVieillissant: 'seuil_vieillissant',
	versionsMax: 'versions_max',
	portailAssistance: 'portail_assistance',
	nomOrganisation: 'nom_organisation',
	motFiche: 'mot_fiche',
	tailleMaxPieceJointe: 'taille_max_piece_jointe',
	dureeSession: 'duree_session'
});

/**
 * Les valeurs par défaut de la configuration — ce qu'une instance vierge vaut.
 *
 * Sur une base migrée mais NON SEMÉE — l'état normal du produit au premier démarrage —
 * `parametres` est vide, `lireConfiguration()` levait sur la première clé absente, et les
 * pages sortaient en 500 : le produit était inutilisable tant qu'on ne l'avait pas semé avec
 * le jeu de démonstration. Les défauts vivent au même endroit que les clés, pour qu'une clé
 * ajoutée sans le sien se voie ; les deux seuils viennent de `SEUILS_PAR_DEFAUT`, la
 * fabrique unique de `P-01`.
 *
 * `portailAssistance` et `nomOrganisation` sont VIDES par défaut : inventer une adresse
 * d'assistance poserait un lien mort, et nommer d'office l'organisation d'autrui signerait
 * son produit à sa place.
 */
export const CONFIGURATION_PAR_DEFAUT: Readonly<Configuration> = Object.freeze({
	seuilFrais: 90,
	seuilVieillissant: 180,
	versionsMax: 50,
	portailAssistance: '',
	nomOrganisation: '',
	motFiche: 'Fiche',
	tailleMaxPieceJointe: 25,
	dureeSession: 120
});

/**
 * `RG-NOT-01` — une note est unique ; la fiche n'est pas un objet séparé, et le signet non
 * plus. LA FRAÎCHEUR N'EST PAS UNE COLONNE (`P-01`, `ADR-005`) : les trois dates de
 * `RG-M06-01` sont stockées, le niveau jamais.
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
			.references(() => etiquettes.id, { onDelete: 'cascade' }),
		/**
		 * Le rang de l'étiquette sur sa note. Sans elle, cette table était une pure liaison, et
		 * le seul ordre qu'elle pouvait rendre était l'ordre PHYSIQUE des lignes, que PostgreSQL
		 * ne garantit pas. L'unicité du couple `(note_id, ordre)` avec un défaut à `0` fait de
		 * l'omission une ERREUR de la base : deux étiquettes sans rang explicite se heurtent au
		 * même `0`.
		 */
		ordre: integer('ordre').notNull().default(0)
	},
	(t) => [
		primaryKey({ name: 'etiquettes_de_note_pk', columns: [t.noteId, t.etiquetteId] }),
		index('etiquettes_de_note_etiquette_idx').on(t.etiquetteId),
		unique('etiquettes_de_note_ordre_unique').on(t.noteId, t.ordre),
		check('etiquettes_de_note_ordre_positif', sql`${t.ordre} >= 0`)
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

/**
 * `RG-M04-09` — le journal que produit toute ouverture d'une note.
 *
 * TROIS DES QUATRE MEMBRES QUE LE CAHIER ÉNUMÈRE : la note, l'horodatage, l'utilisateur. Le
 * quatrième — la durée approximative — n'a pas de colonne, et c'est un vide DÉCLARÉ : aucune
 * source ne dit comment on l'obtient. `compteId` NULL EST L'ANONYMISATION (`RG-M15-02`) : la
 * ligne existe toujours — anonymiser n'est pas omettre.
 */
export const consultations = pgTable(
	'consultations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		noteId: uuid('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		/** NULL : entrée anonymisée (RG-M15-02). */
		compteId: uuid('compte_id').references(() => comptes.id, { onDelete: 'set null' }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('consultations_note_idx').on(t.noteId, t.le.desc())]
);

/**
 * `RG-M07-02` — « une version capture titre et les deux corps, immuable ».
 *
 * IMMUABLE SE LIT DANS L'ABSENCE : il n'y a pas de `modifieLe`. Le refus est porté par un
 * déclencheur sur UPDATE, non par cette description — Drizzle ne modélise pas les
 * déclencheurs. `date` et `heure` du jeu sont deux champs d'AFFICHAGE d'un seul instant : la
 * colonne `le` les porte tous deux.
 */
export const versions = pgTable(
	'versions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		noteId: uuid('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		numero: integer('numero').notNull(),
		le: timestamp('le', { withTimezone: true }).notNull(),
		auteurId: uuid('auteur_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'restrict' }),
		resume: text('resume').notNull(),
		ajout: integer('ajout').notNull(),
		retrait: integer('retrait').notNull(),
		/** Capturé parce que le titre est renommable, et que V-16 doit le montrer. */
		titre: text('titre').notNull(),
		/** ADR-003 — documents ProseMirror sérialisés, comme sur `notes`. */
		corpsReference: jsonb('corps_reference').notNull(),
		corpsOperationnel: jsonb('corps_operationnel'),
		creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		unique('versions_numero_par_note_unique').on(t.noteId, t.numero),
		check('versions_numero_positif', sql`${t.numero} >= 1`),
		check('versions_ajout_positif', sql`${t.ajout} >= 0`),
		check('versions_retrait_positif', sql`${t.retrait} >= 0`),
		index('versions_note_idx').on(t.noteId, t.numero.desc())
	]
);

/**
 * `STACK` §4.7 — « sessions : jetons opaques en base ». Le jeton vit dans le cookie de
 * l'appelant ; la base n'en garde que le condensat. `souvenir` EXEMPTE du délai
 * d'inactivité, il ne prolonge aucune durée, et le délai est lu dans `parametres`.
 */
export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		condensatJeton: text('condensat_jeton').notNull(),
		compteId: uuid('compte_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'cascade' }),
		souvenir: boolean('souvenir').notNull().default(false),
		creeeLe: timestamp('creee_le', { withTimezone: true }).notNull().defaultNow(),
		derniereActiviteLe: timestamp('derniere_activite_le', { withTimezone: true })
			.notNull()
			.defaultNow(),
		fermeeLe: timestamp('fermee_le', { withTimezone: true })
	},
	(t) => [
		unique('sessions_condensat_unique').on(t.condensatJeton),
		check('sessions_activite_apres_ouverture', sql`${t.derniereActiviteLe} >= ${t.creeeLe}`),
		index('sessions_compte_idx').on(t.compteId, t.creeeLe.desc())
	]
);

/**
 * `RG-M16-01` — « un nombre excessif de tentatives DEPUIS UNE MÊME ORIGINE est ralenti puis
 * bloqué temporairement ». L'identifiant saisi n'est pas stocké : la règle ne le demande pas,
 * et une saisie décalée d'un champ écrirait un mot de passe dans cette table.
 */
export const tentativesDeConnexion = pgTable(
	'tentatives_de_connexion',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		origine: text('origine').notNull(),
		reussie: boolean('reussie').notNull(),
		attenteSecondes: integer('attente_secondes').notNull().default(0),
		blocageJusquA: timestamp('blocage_jusqu_a', { withTimezone: true }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		check('tentatives_attente_positive', sql`${t.attenteSecondes} >= 0`),
		check(
			'tentatives_blocage_posterieur',
			sql`${t.blocageJusquA} IS NULL OR ${t.blocageJusquA} > ${t.le}`
		),
		index('tentatives_de_connexion_origine_idx').on(t.origine, t.le.desc())
	]
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
	verifications,
	consultations,
	versions,
	sessions,
	tentativesDeConnexion
};
