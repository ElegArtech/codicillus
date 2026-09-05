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
import { SEUILS_DE_VIVACITE } from '../fraicheur';
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

/**
 * `RG-NOT-02` — les deux registres de lecture d'une note. Le type vivait en
 * TypeScript seul (`donnees/note.ts`), et la base ne savait donc pas dire de
 * QUEL registre parlaient une vérification ou une demande de révision. Même
 * ensemble, même ordre, mêmes valeurs que `Registre`.
 */
export const registreDeNote = pgEnum('registre_de_note', ['reference', 'operationnel']);

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

/**
 * `RG-M12-04` — le sort d'un fichier d'un lot d'import : devenu note, écarté à l'aperçu,
 * ou en échec. Même ensemble que `SortDeFichier` de `seeds/corpus.ts`, que les trois
 * écrans d'import lisent.
 */
export const sortDeFichier = pgEnum('sort_de_fichier', ['note', 'ignore', 'echec']);

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
 * Les quinze clés de `parametres`, écrites une fois — M14.7 et `RG-NF-10`. Elles vivaient en littéraux dans
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
	validiteReference: 'validite_reference',
	validiteOperationnel: 'validite_operationnel',
	seuilBientot: 'seuil_bientot',
	retardRevoir: 'retard_revoir',
	retardObsolete: 'retard_obsolete',
	versionsMax: 'versions_max',
	portailAssistance: 'portail_assistance',
	nomOrganisation: 'nom_organisation',
	motFiche: 'mot_fiche',
	tailleMaxPieceJointe: 'taille_max_piece_jointe',
	dureeSession: 'duree_session',
	indisponibiliteActive: 'indisponibilite_active',
	messageDIndisponibilite: 'message_indisponibilite'
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
	/* LES CINQ RÉGLAGES DU CYCLE DE VIVACITÉ. Les deux validités sont ce qu'une
	   note NEUVE reçoit dans ses colonnes — la base porte les mêmes défauts, et
	   `014` les y a posés ; les trois seuils viennent de `SEUILS_DE_VIVACITE`,
	   fabrique unique du calcul (`P-01`). Les redire ici en littéraux ouvrirait
	   la divergence même que `ADR-005` interdit. */
	validiteReference: 90,
	validiteOperationnel: 21,
	seuilBientot: SEUILS_DE_VIVACITE.bientot,
	retardRevoir: SEUILS_DE_VIVACITE.retardRevoir,
	retardObsolete: SEUILS_DE_VIVACITE.retardObsolete,
	versionsMax: 50,
	portailAssistance: '',
	nomOrganisation: '',
	motFiche: 'Fiche',
	tailleMaxPieceJointe: 25,
	dureeSession: 120,
	/* `RG-NF-10` — UNE INSTANCE NEUVE EST DISPONIBLE, et son message est vide :
	   activer sans message est refusé, ce qui ne peut donc pas arriver par défaut. */
	indisponibiliteActive: false,
	messageDIndisponibilite: ''
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
		/** La vérification de la RÉFÉRENCE — le registre canonique (`RG-NOT-02`). */
		verifieLe: timestamp('verifie_le', { withTimezone: true }),
		/**
		 * La vérification de l'OPÉRATIONNEL — son cycle est indépendant de celui de
		 * la Référence, et créer le registre le démarre. Nulle tant qu'aucun corps
		 * opérationnel n'existe : `notes_operationnel_verification_coherente`.
		 */
		verifieLeOperationnel: timestamp('verifie_le_operationnel', { withTimezone: true }),
		/**
		 * Les durées de validité, en jours, PAR REGISTRE. Une référence
		 * d'architecture tient un trimestre, une procédure d'exploitation trois
		 * semaines : une seule durée aurait fait mentir l'un des deux registres.
		 */
		validiteReference: integer('validite_reference').notNull().default(90),
		validiteOperationnel: integer('validite_operationnel').notNull().default(21),
		compteurDeConsultations: integer('compteur_de_consultations').notNull().default(0),
		revisionDemandee: boolean('revision_demandee').notNull().default(false),
		revisionCommentaire: text('revision_commentaire'),
		revisionParId: uuid('revision_par_id').references(() => comptes.id, {
			onDelete: 'set null'
		}),
		revisionLe: timestamp('revision_le', { withTimezone: true }),
		/** Le registre que la demande de révision VISE — nul quand il n'y en a pas. */
		revisionRegistre: registreDeNote('revision_registre'),
		typeDeFicheId: uuid('type_de_fiche_id').references(() => typesDeFiche.id, {
			onDelete: 'restrict'
		}),
		proprietesTypees: jsonb('proprietes_typees'),
		/**
		 * LE TEMPLATE QUI A AMORCÉ LA RÉDACTION — une TRACE D'ORIGINE, jamais un
		 * rattachement : le squelette est COPIÉ à la création, la note en est aussitôt
		 * indépendante, et V-31 le dit à trois endroits. La colonne existe pour que
		 * « Utilisations » se compte ; elle ne fait rien d'autre.
		 *
		 * `ON DELETE SET NULL`, ET SURTOUT PAS `RESTRICT` : V-31 promet que supprimer un
		 * template n'affecte aucune note. `RESTRICT` ferait mentir l'écran à la première
		 * suppression. La trace s'efface, la note reste entière.
		 */
		templateId: uuid('template_id').references(() => templates.id, { onDelete: 'set null' }),
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
			sql`(NOT ${t.revisionDemandee} AND ${t.revisionCommentaire} IS NULL AND ${t.revisionParId} IS NULL AND ${t.revisionLe} IS NULL AND ${t.revisionRegistre} IS NULL) OR (${t.revisionDemandee} AND ${t.revisionParId} IS NOT NULL AND ${t.revisionLe} IS NOT NULL AND ${t.revisionRegistre} IS NOT NULL)`
		),
		check('notes_validite_reference_positive', sql`${t.validiteReference} > 0`),
		check('notes_validite_operationnel_positive', sql`${t.validiteOperationnel} > 0`),
		check(
			'notes_operationnel_verification_coherente',
			sql`${t.corpsOperationnel} IS NOT NULL OR ${t.verifieLeOperationnel} IS NULL`
		),
		check(
			'notes_signet_coherent',
			sql`(${t.signetAdresse} IS NULL) = (${t.signetAjouteLe} IS NULL)`
		),
		check('notes_consultations_positives', sql`${t.compteurDeConsultations} >= 0`),
		index('notes_domaine_idx').on(t.domaineId),
		index('notes_dossier_idx').on(t.dossierId),
		index('notes_auteur_idx').on(t.auteurId),
		index('notes_template_idx').on(t.templateId),
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

/**
 * `RG-M12-09` — l'entrée de journal que produit CHAQUE lot d'import : source, volume,
 * erreurs, auteur, date. Elle était composée à chaque lot puis jetée au journal
 * d'application ; aucune table ne la recevait, et les deux destinataires que la règle
 * nomme — le flux d'activité de l'accueil et l'écran d'administration — n'avaient rien à
 * lire.
 *
 * AUCUNE PURGE : « les rapports restent consultables indéfiniment » (BRIEF V-35), donc
 * aucune colonne d'expiration.
 *
 * `domaineId` EST NULLABLE ET `domaine` NE L'EST PAS : la clé dit si la cible existe
 * encore, le nom dit où le lot a atterri. `supprimerUnDomaine()` efface les notes puis le
 * domaine sans rien attraper — un `restrict` y ferait remonter une violation de clé
 * jusqu'à l'écran, un `cascade` purgerait le journal.
 */
export const lotsDImport = pgTable(
	'lots_d_import',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		source: text('source').notNull(),
		domaineId: uuid('domaine_id').references(() => domaines.id, { onDelete: 'set null' }),
		domaine: text('domaine').notNull(),
		auteurId: uuid('auteur_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'restrict' }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow(),
		scenario: text('scenario').notNull(),
		simulation: boolean('simulation').notNull().default(false),
		/** Mesurée, jamais estimée — `V-35:2736` porte une durée par ligne. */
		dureeMs: integer('duree_ms').notNull().default(0),
		total: integer('total').notNull().default(0),
		notesCreees: integer('notes_creees').notNull().default(0),
		notesMisesAJour: integer('notes_mises_a_jour').notNull().default(0),
		ignores: integer('ignores').notNull().default(0),
		echecs: integer('echecs').notNull().default(0),
		dossiersCrees: integer('dossiers_crees').notNull().default(0)
	},
	(t) => [
		check(
			'lots_d_import_volume_positif',
			sql`${t.dureeMs} >= 0 AND ${t.total} >= 0 AND ${t.notesCreees} >= 0 AND ${t.notesMisesAJour} >= 0 AND ${t.ignores} >= 0 AND ${t.echecs} >= 0 AND ${t.dossiersCrees} >= 0`
		),
		index('lots_d_import_le_idx').on(t.le.desc()),
		index('lots_d_import_domaine_idx').on(t.domaineId)
	]
);

/**
 * Le détail d'un lot — une ligne par fichier reçu, ce que `RG-M12-04` fait consigner et ce
 * que le « rapport détaillé de chaque lot » (BRIEF V-35) détaille. `rang` est l'ordre de
 * RÉCEPTION : deux lignes peuvent porter le même chemin, un doublon dans le lot étant
 * précisément une ligne de plus sur le même chemin.
 */
export const lignesDeLot = pgTable(
	'lignes_de_lot',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		lotId: uuid('lot_id')
			.notNull()
			.references(() => lotsDImport.id, { onDelete: 'cascade' }),
		rang: integer('rang').notNull(),
		chemin: text('chemin').notNull(),
		sort: sortDeFichier('sort').notNull(),
		motif: text('motif'),
		identifiant: text('identifiant'),
		aplatie: boolean('aplatie').notNull().default(false),
		avertissements: text('avertissements')
			.array()
			.notNull()
			.default(sql`'{}'`),
		imagesNonReprises: integer('images_non_reprises').notNull().default(0)
	},
	(t) => [
		check('lignes_de_lot_rang_positif', sql`${t.rang} >= 0`),
		check('lignes_de_lot_images_positives', sql`${t.imagesNonReprises} >= 0`),
		unique('lignes_de_lot_rang_unique').on(t.lotId, t.rang),
		index('lignes_de_lot_lot_idx').on(t.lotId, t.rang)
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
		/**
		 * LE REGISTRE ATTESTÉ. Sans lui, l'historique d'une note mêlait les deux
		 * cycles en une seule colonne de dates, et rien ne disait laquelle avait
		 * remis quoi au vert. Défaut `reference` : c'est le seul registre que le
		 * produit savait vérifier avant `014`.
		 */
		registre: registreDeNote('registre').notNull().default('reference'),
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
 * `RG-M02-03` — le journal que produit toute recherche : requête, horodatage, nombre de
 * résultats, ouverture éventuelle d'un résultat. Troisième des quatre journaux de M15.2.
 *
 * `compteId` NULL EST L'ANONYMISATION (`RG-M15-02`), comme pour `consultations` : la ligne
 * existe toujours. `ouvertureNoteId` NULL est la recherche restée sans suite — c'est
 * exactement ce que l'indicateur nord de V-34 mesure ; elle est attachée APRÈS coup, à
 * l'ouverture, et `set null` sur la note : supprimer la note ne rend pas la recherche non
 * advenue.
 */
export const recherches = pgTable(
	'recherches',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		terme: text('terme').notNull(),
		/** NULL : entrée anonymisée (RG-M15-02). */
		compteId: uuid('compte_id').references(() => comptes.id, { onDelete: 'set null' }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow(),
		resultats: integer('resultats').notNull().default(0),
		/** NULL : aucune ouverture n'a suivi. */
		ouvertureNoteId: uuid('ouverture_note_id').references(() => notes.id, {
			onDelete: 'set null'
		})
	},
	(t) => [
		check('recherches_resultats_positifs', sql`${t.resultats} >= 0`),
		index('recherches_le_idx').on(t.le.desc()),
		index('recherches_terme_idx').on(t.terme, t.le.desc())
	]
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
/**
 * `RG-M16-03` — LES DISTINCTIONS OBTENUES, ET RIEN QUE L'INSTANT DE LEUR OBTENTION.
 *
 * AUCUN BARÈME N'EST STOCKÉ : les six paliers sont une définition du produit
 * (`src/lib/donnees/distinctions.ts`), comme les seuils de fraîcheur. AUCUNE MESURE NON
 * PLUS : elles se dérivent des contributions que la base porte déjà — `notes.auteur_id`,
 * `versions`, `verifications`, `relations`. Ce que le calcul ne peut PAS retrouver est
 * l'instant : une mesure dit qu'un seuil EST franchi, jamais QUAND il l'a été.
 *
 * INDIVIDUELLES ET PRIVÉES : la clé primaire `(compte_id, cle)` est aussi la seule
 * lecture, et elle part toujours du compte de la SESSION. Aucun classement n'existe.
 *
 * `cle` EST DU TEXTE : il n'y a pas de table de barème à référencer.
 */
export const distinctionsObtenues = pgTable(
	'distinctions_obtenues',
	{
		compteId: uuid('compte_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'cascade' }),
		cle: text('cle').notNull(),
		obtenueLe: timestamp('obtenue_le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ name: 'distinctions_obtenues_pkey', columns: [t.compteId, t.cle] })]
);

/**
 * `RG-NF-05` — QUI A DÉTRUIT QUOI, ET QUAND. « Les actions destructives sont confirmées,
 * TRACÉES ET ATTRIBUÉES à leur auteur. »
 *
 * LA SUPPRESSION DU PRODUIT EST DÉFINITIVE ET SANS CORBEILLE (`RG-M14-03`) : il ne reste
 * aucune ligne où écrire un « supprimé par », donc la trace ne peut vivre que dans une
 * table à part. Elle s'écrit DANS LA MÊME TRANSACTION que la destruction — validée
 * séparément, elle mentirait à la première transaction annulée.
 *
 * `reference` EST DU TEXTE, JAMAIS UNE CLÉ ÉTRANGÈRE : la cible n'existe plus. `detail`
 * porte en clair ce qui est parti avec, et c'est le compte que l'écran de confirmation a
 * DÉJÀ affiché — jamais un second, calculé autrement.
 *
 * `auteurId` EST `NOT NULL` ET EN `RESTRICT` : une trace qui perd son auteur cesse d'être
 * une attribution. Le produit ne supprime aucun compte (`RG-M14-08`), la contrainte ne
 * bloque donc rien — elle interdit qu'on la contourne.
 *
 * AUCUN CONTENU DÉTRUIT N'EST RECOPIÉ ICI : ce n'est pas une corbeille, et l'y transformer
 * rendrait récupérable ce que `RG-M14-03` veut définitif.
 */
export const tracesDeSuppression = pgTable(
	'traces_de_suppression',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		objet: text('objet').notNull(),
		reference: text('reference').notNull(),
		designation: text('designation').notNull(),
		detail: text('detail').notNull().default(''),
		auteurId: uuid('auteur_id')
			.notNull()
			.references(() => comptes.id, { onDelete: 'restrict' }),
		le: timestamp('le', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('traces_de_suppression_le_idx').on(t.le.desc())]
);

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
	lotsDImport,
	lignesDeLot,
	verifications,
	consultations,
	recherches,
	versions,
	distinctionsObtenues,
	tracesDeSuppression,
	sessions,
	tentativesDeConnexion
};
