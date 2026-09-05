/**
 * LES COMMANDES DE LA BASE — migrer, annuler, semer, et les trois contrôles. Ce que chacune
 * prouve, et rien de plus :
 *
 *   `migrer`        — que les montées s'appliquent dans l'ordre.
 *   `annuler`       — que les descentes s'appliquent en ordre inverse.
 *   `reversibilite` — que monter, descendre et remonter REDONNE LA MÊME BASE. Elle seule
 *                     atteste « migration réversible » ; `migrer` et `annuler` ne le font pas.
 *   `semer`         — que le schéma accepte le corpus des maquettes gelées. Il ne dit rien du
 *                     corpus qu'il ne charge pas ; la liste est imprimée.
 *   `unicite`       — que la BASE refuse les violations d'unicité, et qu'elle ACCEPTE le cas
 *                     de `RG-STR-02`. Ne faire que le premier laisserait passer une unicité
 *                     trop large.
 *   `coherence`     — que `src/lib/base/schema.ts` décrit la base réellement migrée.
 *
 * L'EMPREINTE EST STRUCTURELLE : types énumérés, tables, colonnes, contraintes, index,
 * déclencheurs et fonctions. Elle ignore le contenu des tables et le journal des migrations.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { CORPUS } from '../../../seeds/corpus';
import { SEUILS_PAR_DEFAUT, niveauFraicheur } from '../fraicheur';
import { configurationDeConnexion, connexionLisible } from './connexion';
import {
	champsDeTypeDeFiche,
	comptes,
	droitsDeDossier,
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	parametres,
	relations,
	schema,
	templates,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers,
	verifications,
	versions
} from './schema';
import {
	anciennete,
	lignesDEtiquette,
	lignesDUnivers,
	lignesDeChamp,
	lignesDeCompte,
	lignesDeDroitDeDossier,
	lignesDeDomaine,
	lignesDeDossier,
	lignesDeNote,
	lignesDeParametre,
	lignesDeRelation,
	lignesDeVersion,
	lignesDeTemplate,
	lignesDeTypeDeFiche,
	lignesDeTypeDeNote,
	lignesDeTypeDeRelation,
	verifierFraicheur,
	verifierUniversDesNotes
} from './semence';
/* LA SECONDE COUCHE DU JEU DE SEMENCE — `semence-organisation.ts` porte le
   motif complet. En deux mots : `seeds/corpus.ts` est la TRANSCRIPTION des
   maquettes gelées, prouvée telle par `seeds/corpus.test.ts` ; on ne peut donc
   pas y ajouter une note sans casser le gel. Ce qui s'ajoute ici n'entre que
   dans la BASE, jamais dans le rendu par défaut d'une vue. */
import {
	champsDOrganisation,
	domainesDOrganisation,
	dossiersDOrganisation,
	etiquettesDOrganisation,
	notesDOrganisation,
	relationsDOrganisation,
	typesDeFicheDOrganisation,
	typesDeRelationDOrganisation,
	fraicheurAttendueDOrganisation,
	universDOrganisation
} from './semence-organisation';
import type { Registre } from '../donnees/note';

/** Le dossier des migrations, relatif à la racine du dépôt. */
export const DOSSIER_DES_MIGRATIONS = 'base/migrations';

/**
 * Le journal des migrations appliquées. Il est créé par le lanceur, non par une
 * migration : une migration qui créerait son propre journal ne pourrait pas
 * s'annuler sans effacer la trace de son annulation.
 */
export const TABLE_DU_JOURNAL = 'migrations_appliquees';

export type Base = ReturnType<typeof drizzle<typeof schema>>;

export interface Session {
	readonly db: Base;
	readonly pool: pg.Pool;
	readonly lisible: string;
	fermer(): Promise<void>;
}

export function ouvrir(env: NodeJS.ProcessEnv = process.env): Session {
	const config = configurationDeConnexion(env);
	const pool = new pg.Pool(config);
	const db = drizzle(pool, { schema });
	return {
		db,
		pool,
		lisible: connexionLisible(config),
		fermer: async () => {
			await pool.end();
		}
	};
}

export interface Migration {
	readonly nom: string;
	readonly montee: string;
	readonly descente: string;
}

export async function lireLesMigrations(racine = process.cwd()): Promise<readonly Migration[]> {
	const dossier = join(racine, DOSSIER_DES_MIGRATIONS);
	const fichiers = await readdir(dossier);
	const noms = fichiers
		.filter((f) => f.endsWith('.montee.sql'))
		.map((f) => f.slice(0, -'.montee.sql'.length))
		.sort();
	const migrations: Migration[] = [];
	for (const nom of noms) {
		const montee = await readFile(join(dossier, `${nom}.montee.sql`), 'utf8');
		const descente = await readFile(join(dossier, `${nom}.descente.sql`), 'utf8');
		migrations.push({ nom, montee, descente });
	}
	return migrations;
}

async function assurerLeJournal(pool: pg.Pool): Promise<void> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS ${TABLE_DU_JOURNAL} (
			nom          text PRIMARY KEY,
			empreinte    text NOT NULL,
			appliquee_le timestamptz NOT NULL DEFAULT now()
		)
	`);
}

function empreinteDeTexte(texte: string): string {
	return createHash('sha256').update(texte, 'utf8').digest('hex');
}

export async function migrationsAppliquees(pool: pg.Pool): Promise<readonly string[]> {
	await assurerLeJournal(pool);
	const { rows } = await pool.query<{ nom: string }>(
		`SELECT nom FROM ${TABLE_DU_JOURNAL} ORDER BY nom`
	);
	return rows.map((r) => r.nom);
}

export async function migrer(pool: pg.Pool, racine = process.cwd()): Promise<readonly string[]> {
	const migrations = await lireLesMigrations(racine);
	const deja = new Set(await migrationsAppliquees(pool));
	const posees: string[] = [];
	for (const migration of migrations) {
		if (deja.has(migration.nom)) continue;
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query(migration.montee);
			await client.query(`INSERT INTO ${TABLE_DU_JOURNAL} (nom, empreinte) VALUES ($1, $2)`, [
				migration.nom,
				empreinteDeTexte(migration.montee)
			]);
			await client.query('COMMIT');
			posees.push(migration.nom);
		} catch (erreur) {
			await client.query('ROLLBACK');
			throw erreur;
		} finally {
			client.release();
		}
	}
	return posees;
}

/** Annule les `combien` dernières migrations appliquées, en ordre inverse. */
export async function annuler(
	pool: pg.Pool,
	combien = 1,
	racine = process.cwd()
): Promise<readonly string[]> {
	const migrations = new Map((await lireLesMigrations(racine)).map((m) => [m.nom, m]));
	const appliquees = [...(await migrationsAppliquees(pool))].reverse();
	const annulees: string[] = [];
	for (const nom of appliquees.slice(0, combien)) {
		const migration = migrations.get(nom);
		if (migration === undefined) {
			throw new Error(`migration appliquée sans fichier : ${nom}`);
		}
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query(migration.descente);
			await client.query(`DELETE FROM ${TABLE_DU_JOURNAL} WHERE nom = $1`, [nom]);
			await client.query('COMMIT');
			annulees.push(nom);
		} catch (erreur) {
			await client.query('ROLLBACK');
			throw erreur;
		} finally {
			client.release();
		}
	}
	return annulees;
}

const RELEVE_STRUCTUREL = `
WITH exclues AS (SELECT '${TABLE_DU_JOURNAL}'::text AS nom)
SELECT ligne FROM (
	SELECT format('enum %s = %s', t.typname, e.enumlabel) AS ligne,
	       1 AS rang, t.typname AS a, e.enumsortorder::text AS b
	  FROM pg_type t
	  JOIN pg_enum e ON e.enumtypid = t.oid
	  JOIN pg_namespace n ON n.oid = t.typnamespace
	 WHERE n.nspname = 'public'
	   AND NOT EXISTS (
	     SELECT 1 FROM pg_depend d
	      WHERE d.objid = t.oid AND d.classid = 'pg_type'::regclass AND d.deptype = 'e'
	   )
	UNION ALL
	SELECT format('colonne %s.%s %s %s %s %s',
	              c.table_name, c.column_name, c.ordinal_position,
	              c.udt_name, c.is_nullable, coalesce(c.column_default, '-')),
	       2, c.table_name, lpad(c.ordinal_position::text, 4, '0')
	  FROM information_schema.columns c
	  JOIN information_schema.tables t
	    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
	 WHERE c.table_schema = 'public'
	   AND t.table_type = 'BASE TABLE'
	   AND c.table_name NOT IN (SELECT nom FROM exclues)
	UNION ALL
	SELECT format('contrainte %s %s %s', rel.relname, con.conname, pg_get_constraintdef(con.oid)),
	       3, rel.relname, con.conname
	  FROM pg_constraint con
	  JOIN pg_class rel ON rel.oid = con.conrelid
	  JOIN pg_namespace n ON n.oid = rel.relnamespace
	 WHERE n.nspname = 'public' AND rel.relname NOT IN (SELECT nom FROM exclues)
	UNION ALL
	SELECT format('index %s %s', i.tablename, i.indexdef), 4, i.tablename, i.indexname
	  FROM pg_indexes i
	 WHERE i.schemaname = 'public' AND i.tablename NOT IN (SELECT nom FROM exclues)
	UNION ALL
	SELECT format('declencheur %s', pg_get_triggerdef(tg.oid)), 5, rel.relname, tg.tgname
	  FROM pg_trigger tg
	  JOIN pg_class rel ON rel.oid = tg.tgrelid
	  JOIN pg_namespace n ON n.oid = rel.relnamespace
	 WHERE n.nspname = 'public' AND NOT tg.tgisinternal
	UNION ALL
	SELECT format('fonction %s', pg_get_functiondef(p.oid)), 6, p.proname, p.oid::text
	  FROM pg_proc p
	  JOIN pg_namespace n ON n.oid = p.pronamespace
	 WHERE n.nspname = 'public'
	   AND p.prokind = 'f'
	   -- Les objets APPORTES PAR UNE EXTENSION ne sont pas du schema du produit :
	   -- pgvector pose une centaine de fonctions et d agregats dans public. Les
	   -- relever ferait dependre l empreinte de la version de l extension, et
	   -- pg_get_functiondef refuse d ailleurs de decrire un agregat.
	   AND NOT EXISTS (
	     SELECT 1 FROM pg_depend d
	      WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
	   )
	UNION ALL
	SELECT format('extension %s', e.extname), 7, e.extname, ''
	  FROM pg_extension e
	 WHERE e.extname <> 'plpgsql'
) releve
ORDER BY rang, a, b, ligne
`;

export interface Empreinte {
	readonly somme: string;
	readonly lignes: readonly string[];
}

/** L'empreinte structurelle du schéma `public`, journal des migrations exclu. */
export async function empreinte(pool: pg.Pool): Promise<Empreinte> {
	const { rows } = await pool.query<{ ligne: string }>(RELEVE_STRUCTUREL);
	const lignes = rows.map((r) => r.ligne);
	return { somme: empreinteDeTexte(lignes.join('\n')), lignes };
}

export interface RapportDeSemence {
	readonly comptes: number;
	readonly droitsDeDossier: number;
	readonly univers: number;
	readonly domaines: number;
	readonly modulesDeDomaine: number;
	readonly dossiers: number;
	readonly typesDeNote: number;
	readonly typesDeFiche: number;
	readonly champsDeTypeDeFiche: number;
	readonly typesDeRelation: number;
	readonly templates: number;
	readonly etiquettes: number;
	readonly notes: number;
	readonly etiquettesDeNote: number;
	readonly relations: number;
	readonly versions: number;
	readonly verifications: number;
	readonly parametres: number;
}

function exigerDefini<T>(valeur: T | undefined, quoi: string): T {
	if (valeur === undefined) throw new Error(`introuvable : ${quoi}`);
	return valeur;
}

/**
 * Charge le corpus des maquettes gelées dans une base fraîchement migrée.
 *
 * L'ordre est celui des dépendances : un référentiel avant ce qui le référence.
 * Toute la charge tient dans UNE transaction — un chargement partiel serait un
 * état que rien ne décrit.
 */
export async function semer(session: Session): Promise<RapportDeSemence> {
	const divergences = [...verifierFraicheur(), ...verifierUniversDesNotes()];
	if (divergences.length > 0) {
		throw new Error(
			`le corpus ne se dérive pas sans perte : ${divergences
				.map((d) => `${d.quoi} attendu ${d.attendu}, obtenu ${d.obtenu}`)
				.join(' ; ')}`
		);
	}

	return session.db.transaction(async (tx) => {
		/* Les univers. */
		const universPoses = await tx
			.insert(univers)
			.values([...lignesDUnivers(), ...universDOrganisation()].map((u) => ({ ...u })))
			.returning({ id: univers.id, nom: univers.nom });
		const universParNom = new Map(universPoses.map((u) => [u.nom, u.id]));

		/* Les domaines, et leurs modules. */
		const lignesDomaine = [...lignesDeDomaine(), ...domainesDOrganisation()];
		const domainesPoses = await tx
			.insert(domaines)
			.values(
				lignesDomaine.map((d) => ({
					universId: exigerDefini(universParNom.get(d.universNom), `univers ${d.universNom}`),
					identifiant: d.identifiant,
					nom: d.nom,
					description: d.description,
					couleur: d.couleur
				}))
			)
			.returning({ id: domaines.id, nom: domaines.nom });
		const domaineParNom = new Map(domainesPoses.map((d) => [d.nom, d.id]));

		const lignesModule = lignesDomaine.flatMap((d) =>
			d.modules.map((module) => ({
				domaineId: exigerDefini(domaineParNom.get(d.nom), `domaine ${d.nom}`),
				module: module as
					'notes' | 'dossiers' | 'fiches' | 'cartographie' | 'signets' | 'carte_mentale'
			}))
		);
		await tx.insert(modulesDeDomaine).values(lignesModule);

		/* ── Les comptes, APRÈS les domaines depuis `005` : ils ont besoin de leur
		   DOMAINE PRINCIPAL, d'où univers → domaines → comptes → dossiers → notes. Le
		   rattachement est écrit À L'INSERTION plutôt que par un UPDATE d'après-coup,
		   qui laisserait cinq comptes sans périmètre le temps d'une instruction. */
		const comptesPoses = await tx
			.insert(comptes)
			.values(
				lignesDeCompte().map((c) => ({
					identifiant: c.identifiant,
					nom: c.nom,
					courriel: c.courriel,
					role: c.role as 'administrateur' | 'referent' | 'contributeur' | 'lecteur',
					actif: c.actif,
					arriveLe: c.arriveLe,
					domaineId:
						c.domaineNom === null
							? null
							: exigerDefini(domaineParNom.get(c.domaineNom), `domaine ${c.domaineNom}`),
					derniereConnexionLe: c.derniereConnexionLe
				}))
			)
			.returning({ id: comptes.id, nom: comptes.nom });
		const compteParNom = new Map(comptesPoses.map((c) => [c.nom, c.id]));

		/* Les dossiers, de la racine vers les feuilles : le parent doit exister. */
		const dossierParChemin = new Map<string, string>();
		const cleDeChemin = (domaine: string, chemin: readonly string[]): string =>
			`${domaine}\0${chemin.join('\0')}`;
		const lignesDossier = [...lignesDeDossier(), ...dossiersDOrganisation()].sort(
			(a, b) => a.profondeur - b.profondeur
		);
		for (const ligne of lignesDossier) {
			const parentChemin = ligne.chemin.slice(0, -1);
			const parentId =
				parentChemin.length === 0
					? null
					: exigerDefini(
							dossierParChemin.get(cleDeChemin(ligne.domaineNom, parentChemin)),
							`dossier parent ${parentChemin.join(' > ')}`
						);
			const [pose] = await tx
				.insert(dossiers)
				.values({
					domaineId: exigerDefini(
						domaineParNom.get(ligne.domaineNom),
						`domaine ${ligne.domaineNom}`
					),
					parentId,
					nom: ligne.nom,
					position: ligne.position,
					profondeur: ligne.profondeur
				})
				.returning({ id: dossiers.id });
			dossierParChemin.set(
				cleDeChemin(ligne.domaineNom, ligne.chemin),
				exigerDefini(pose, `dossier ${ligne.nom}`).id
			);
		}

		/* ── LES DROITS DE DOSSIER, APRÈS LES DOSSIERS. `RG-DRO-02` : sans droit
		   explicite, aucune capacité — sans ces lignes, les quatre comptes non
		   administrateurs du jeu ne peuvent RIEN écrire. La dérivation est celle de
		   `CDC §2.3` et vit dans `lignesDeDroitDeDossier()` ; l'administrateur n'en
		   reçoit AUCUNE (`RG-DRO-03`). */
		const lignesDroit = lignesDeDroitDeDossier();
		if (lignesDroit.length > 0) {
			await tx.insert(droitsDeDossier).values(
				lignesDroit.map((d) => ({
					dossierId: exigerDefini(
						dossierParChemin.get(cleDeChemin(d.domaineNom, [d.domaineNom])),
						`racine du domaine ${d.domaineNom}`
					),
					compteId: exigerDefini(compteParNom.get(d.compteNom), `compte ${d.compteNom}`),
					droit: d.droit
				}))
			);
		}

		/* Le référentiel. */
		/* LES TYPES DE NOTE SONT POSÉS PAR LA MIGRATION `007`, pas par la semence : une
		   installation neuve doit pouvoir écrire sa première note sans avoir chargé le
		   jeu de démonstration. Le semis les repose SANS ÉCHOUER SI ELLES SONT LÀ, puis
		   relit la table : les lignes ignorées ne reviennent pas d'un `returning`. */
		await tx
			.insert(typesDeNote)
			.values(lignesDeTypeDeNote().map((t) => ({ ...t })))
			.onConflictDoNothing();
		const typesNotePoses = await tx
			.select({ id: typesDeNote.id, nom: typesDeNote.nom })
			.from(typesDeNote);
		const typeDeNoteParNom = new Map(typesNotePoses.map((t) => [t.nom, t.id]));

		const typesFichePoses = await tx
			.insert(typesDeFiche)
			.values([...lignesDeTypeDeFiche(), ...typesDeFicheDOrganisation()].map((t) => ({ ...t })))
			.returning({ id: typesDeFiche.id, nom: typesDeFiche.nom });
		const typeDeFicheParNom = new Map(typesFichePoses.map((t) => [t.nom, t.id]));

		const lignesChamp = [...lignesDeChamp(), ...champsDOrganisation()];
		await tx.insert(champsDeTypeDeFiche).values(
			lignesChamp.map((c) => ({
				typeDeFicheId: exigerDefini(
					typeDeFicheParNom.get(c.typeDeFicheNom),
					`type de fiche ${c.typeDeFicheNom}`
				),
				cle: c.cle,
				nom: c.nom,
				type: c.type as 'texte' | 'nombre' | 'date' | 'liste' | 'lien' | 'booleen',
				ordre: c.ordre,
				exemple: c.exemple,
				valeurs: c.valeurs
			}))
		);

		const lignesTypeRelation = [...lignesDeTypeDeRelation(), ...typesDeRelationDOrganisation()];
		const typesRelationPoses = await tx
			.insert(typesDeRelation)
			.values(lignesTypeRelation.map((t) => ({ ...t })))
			.returning({ id: typesDeRelation.id, identifiant: typesDeRelation.identifiant });
		const typeDeRelationParIdentifiant = new Map(
			typesRelationPoses.map((t) => [t.identifiant, t.id])
		);

		const lignesTemplate = lignesDeTemplate();
		await tx.insert(templates).values(
			lignesTemplate.map((t) => ({
				identifiant: t.identifiant,
				nom: t.nom,
				description: t.description,
				typeDeNoteId: exigerDefini(
					typeDeNoteParNom.get(t.typeDeNoteNom),
					`type de note ${t.typeDeNoteNom}`
				),
				defaut: t.defaut,
				structure: t.structure,
				contenu: t.contenu
			}))
		);

		const libelles = [...new Set([...lignesDEtiquette(), ...etiquettesDOrganisation()])].sort(
			(a, b) => a.localeCompare(b, 'fr')
		);
		const etiquettesPosees = await tx
			.insert(etiquettes)
			.values(libelles.map((libelle) => ({ libelle })))
			.returning({ id: etiquettes.id, libelle: etiquettes.libelle });
		const etiquetteParLibelle = new Map(etiquettesPosees.map((e) => [e.libelle, e.id]));

		await tx
			.insert(parametres)
			.values(lignesDeParametre().map((p) => ({ cle: p.cle, valeur: p.valeur })));

		/* Les notes. */
		const lignesNote = [...lignesDeNote(), ...notesDOrganisation()];
		const notesPosees = await tx
			.insert(notes)
			.values(
				lignesNote.map((n) => ({
					identifiant: n.identifiant,
					titre: n.titre,
					corpsReference: n.corpsReference,
					corpsOperationnel: n.corpsOperationnel,
					typeDeNoteId: exigerDefini(
						typeDeNoteParNom.get(n.typeDeNoteNom),
						`type de note ${n.typeDeNoteNom}`
					),
					typeDeFicheId:
						n.typeDeFicheNom === null
							? null
							: exigerDefini(
									typeDeFicheParNom.get(n.typeDeFicheNom),
									`type de fiche ${n.typeDeFicheNom}`
								),
					domaineId: exigerDefini(domaineParNom.get(n.domaineNom), `domaine ${n.domaineNom}`),
					dossierId: exigerDefini(
						dossierParChemin.get(cleDeChemin(n.domaineNom, n.cheminDeDossier)),
						`dossier ${n.cheminDeDossier.join(' > ')}`
					),
					auteurId: exigerDefini(compteParNom.get(n.auteurNom), `compte ${n.auteurNom}`),
					visibilite: n.visibilite,
					statut: n.statut,
					creeLe: n.creeLe,
					modifieLe: n.modifieLe,
					corpsReferenceModifieLe: n.modifieLe,
					corpsOperationnelModifieLe: n.corpsOperationnelModifieLe,
					verifieLe: n.verifieLe,
					verifieLeOperationnel: n.verifieLeOperationnel,
					compteurDeConsultations: n.compteurDeConsultations,
					revisionDemandee: n.revisionDemandee,
					revisionCommentaire: n.revisionCommentaire,
					revisionParId:
						n.revisionParNom === null
							? null
							: exigerDefini(compteParNom.get(n.revisionParNom), `compte ${n.revisionParNom}`),
					revisionLe: n.revisionLe,
					/* `014` — la demande VISE un registre, et `notes_revision_coherente`
					   l'exige dès qu'elle existe. Le corpus n'en nomme aucun : les trois
					   demandes du jeu portaient sur la note entière, c'est-à-dire sur sa
					   Référence. */
					revisionRegistre: n.revisionDemandee ? ('reference' as const) : null,
					signetAdresse: n.signetAdresse,
					signetAjouteLe: n.signetAjouteLe
				}))
			)
			.returning({ id: notes.id, identifiant: notes.identifiant });
		const noteParIdentifiant = new Map(notesPosees.map((n) => [n.identifiant, n.id]));

		/* L'ORDRE DU JEU EST ÉCRIT : `n.etiquettes` est le tableau du jeu, sans retri —
		   son rang EST le rang. Sans cette colonne, la seule restitution possible était
		   un tri alphabétique, faux sur 25 notes de 32. */
		const lignesEtiquetteDeNote = lignesNote.flatMap((n) =>
			n.etiquettes.map((libelle, rang) => ({
				noteId: exigerDefini(noteParIdentifiant.get(n.identifiant), `note ${n.identifiant}`),
				etiquetteId: exigerDefini(etiquetteParLibelle.get(libelle), `étiquette ${libelle}`),
				ordre: rang
			}))
		);
		await tx.insert(etiquettesDeNote).values(lignesEtiquetteDeNote);

		const lignesRelation = [...lignesDeRelation(), ...relationsDOrganisation()];
		await tx.insert(relations).values(
			lignesRelation.map((r) => ({
				sourceId: exigerDefini(
					noteParIdentifiant.get(r.sourceIdentifiant),
					`note ${r.sourceIdentifiant}`
				),
				cibleId: exigerDefini(
					noteParIdentifiant.get(r.cibleIdentifiant),
					`note ${r.cibleIdentifiant}`
				),
				typeDeRelationId: exigerDefini(
					typeDeRelationParIdentifiant.get(r.typeIdentifiant),
					`type de relation ${r.typeIdentifiant}`
				)
			}))
		);

		/* LES VERSIONS — sans elles, l'historique (V-15) et la comparaison (V-16) n'ont
		   rien à montrer. `versions.numero` est unique PAR NOTE, et le corpus donne les
		   numéros : ils sont repris tels quels, jamais renumérotés. */
		const lignesVersion = lignesDeVersion();
		if (lignesVersion.length > 0) {
			await tx.insert(versions).values(
				lignesVersion.map((v) => ({
					noteId: exigerDefini(
						noteParIdentifiant.get(v.noteIdentifiant),
						`note ${v.noteIdentifiant}`
					),
					numero: v.numero,
					le: v.le,
					auteurId: exigerDefini(compteParNom.get(v.auteurNom), `compte ${v.auteurNom}`),
					resume: v.resume,
					ajout: v.ajout,
					retrait: v.retrait,
					titre: v.titre,
					corpsReference: v.corpsReference,
					corpsOperationnel: null
				}))
			);
		}

		/* L'historique des vérifications : une entrée par note vérifiée. Le
		   VÉRIFICATEUR n'est nulle part dans les maquettes — la colonne reste
		   nulle plutôt que de désigner quelqu'un au hasard. */
		const lignesVerification = lignesNote.flatMap((n) => {
			const noteId = exigerDefini(noteParIdentifiant.get(n.identifiant), `note ${n.identifiant}`);
			/* UNE ENTRÉE PAR REGISTRE VÉRIFIÉ — `014`. Les deux cycles ont chacun leur
			   histoire, et une entrée sans registre les mêlerait de nouveau. */
			const lignes: { noteId: string; compteId: null; registre: Registre; le: Date }[] = [];
			if (n.verifieLe !== null) {
				lignes.push({ noteId, compteId: null, registre: 'reference', le: n.verifieLe });
			}
			if (n.verifieLeOperationnel !== null) {
				lignes.push({
					noteId,
					compteId: null,
					registre: 'operationnel',
					le: n.verifieLeOperationnel
				});
			}
			return lignes;
		});
		await tx.insert(verifications).values(lignesVerification);

		/* ── LE CONTRÔLE D'ALLER-RETOUR, DANS LA MÊME TRANSACTION. Ce qui a été ÉCRIT
		   n'est pas ce qui sera LU : un `timestamptz` traverse une conversion de fuseau
		   à l'aller comme au retour, et une date décalée d'un jour décale le niveau de
		   fraîcheur d'une note posée sur un seuil. Le contrôle relit donc les dates
		   DEPUIS LA BASE et rejoue `niveauFraicheur()`. S'il échoue, rien n'est chargé :
		   une base à moitié semée qui ment sur la fraîcheur serait pire que rien. */
		const relues = await tx
			.select({
				identifiant: notes.identifiant,
				verifieLe: notes.verifieLe,
				modifieLe: notes.modifieLe,
				creeLe: notes.creeLe
			})
			.from(notes);
		const niveauAttendu = new Map<string, string>([
			...CORPUS.map((n) => [n.id as string, n.fraicheur as string] as const),
			...fraicheurAttendueDOrganisation()
		]);
		const menteuses: string[] = [];
		for (const ligne of relues) {
			const reference = ligne.verifieLe ?? ligne.modifieLe ?? ligne.creeLe;
			const niveau = niveauFraicheur(anciennete(reference), SEUILS_PAR_DEFAUT);
			const attendu = niveauAttendu.get(ligne.identifiant);
			if (niveau !== attendu) {
				menteuses.push(`${ligne.identifiant} : attendu ${String(attendu)}, relu ${niveau}`);
			}
		}
		if (menteuses.length > 0) {
			throw new Error(
				`la fraîcheur relue depuis la base ne redonne pas celle des maquettes — ${menteuses.join(' ; ')}`
			);
		}

		return {
			comptes: comptesPoses.length,
			droitsDeDossier: lignesDroit.length,
			univers: universPoses.length,
			domaines: domainesPoses.length,
			modulesDeDomaine: lignesModule.length,
			dossiers: lignesDossier.length,
			typesDeNote: typesNotePoses.length,
			typesDeFiche: typesFichePoses.length,
			champsDeTypeDeFiche: lignesChamp.length,
			typesDeRelation: typesRelationPoses.length,
			templates: lignesTemplate.length,
			etiquettes: etiquettesPosees.length,
			notes: notesPosees.length,
			etiquettesDeNote: lignesEtiquetteDeNote.length,
			relations: lignesRelation.length,
			versions: lignesVersion.length,
			verifications: lignesVerification.length,
			parametres: lignesDeParametre().length
		};
	});
}

export interface ResultatDeSonde {
	readonly nom: string;
	readonly regle: string;
	readonly attendu: 'refus' | 'acceptation';
	readonly obtenu: 'refus' | 'acceptation';
	readonly code: string;
	readonly detail: string;
	readonly reussi: boolean;
}

interface Sonde {
	readonly nom: string;
	readonly regle: string;
	readonly attendu: 'refus' | 'acceptation';
	readonly sql: string;
	readonly valeurs?: readonly unknown[];
}

/**
 * LES SONDES. Chacune écrit dans une transaction TOUJOURS annulée : la base n'en
 * garde rien, et leur ordre n'importe pas. Trois attendent une ACCEPTATION, et ce
 * n'est pas un remplissage : une unicité trop large refuserait aussi ces cas-là, et
 * la sonde serait verte pour un schéma qui interdit ce que `RG-STR-02` autorise.
 */
function sondes(): readonly Sonde[] {
	const nouvelUnivers = (identifiant: string, nom: string): string =>
		`INSERT INTO univers (identifiant, nom, couleur, glyphe, ordre) VALUES ('${identifiant}', '${nom}', '#000000', 'pile', 99)`;
	return [
		{
			nom: 'univers — même nom refusé',
			regle: 'ARB-001 · RG-STR-01',
			attendu: 'refus',
			sql: `${nouvelUnivers('sonde-a', 'Sonde')}; ${nouvelUnivers('sonde-b', 'Sonde')}`
		},
		{
			nom: 'univers — même identifiant refusé',
			regle: 'ARB-001 · RG-M03-02',
			attendu: 'refus',
			sql: `${nouvelUnivers('sonde-c', 'Sonde C')}; ${nouvelUnivers('sonde-c', 'Sonde D')}`
		},
		{
			nom: 'domaine — même identifiant dans le MÊME univers refusé',
			regle: 'RG-STR-02',
			attendu: 'refus',
			sql: `
				${nouvelUnivers('sonde-e', 'Sonde E')};
				INSERT INTO domaines (univers_id, identifiant, nom, couleur)
					SELECT id, 'support', 'Support', '#111111' FROM univers WHERE identifiant = 'sonde-e';
				INSERT INTO domaines (univers_id, identifiant, nom, couleur)
					SELECT id, 'support', 'Support bis', '#222222' FROM univers WHERE identifiant = 'sonde-e';
			`
		},
		{
			nom: 'domaine — même identifiant dans DEUX univers accepté',
			regle: 'RG-STR-02, le cas que la règle autorise',
			attendu: 'acceptation',
			sql: `
				${nouvelUnivers('sonde-f', 'Sonde F')};
				${nouvelUnivers('sonde-g', 'Sonde G')};
				INSERT INTO domaines (univers_id, identifiant, nom, couleur)
					SELECT id, 'support', 'Support', '#111111' FROM univers WHERE identifiant = 'sonde-f';
				INSERT INTO domaines (univers_id, identifiant, nom, couleur)
					SELECT id, 'support', 'Support', '#222222' FROM univers WHERE identifiant = 'sonde-g';
			`
		},
		{
			nom: 'note — même identifiant lisible refusé',
			regle: 'CDC §3.2, « identifiant lisible, unique »',
			attendu: 'refus',
			sql: `
				INSERT INTO notes (identifiant, titre, corps_reference, type_de_note_id, domaine_id, dossier_id, auteur_id)
					SELECT 'n-restaurer-pg', 'Doublon', '{"type":"doc","content":[]}'::jsonb,
					       type_de_note_id, domaine_id, dossier_id, auteur_id
					  FROM notes WHERE identifiant = 'n-restaurer-pg';
			`
		},
		{
			nom: 'étiquette — même libellé refusé',
			regle: 'CDC §3.3, « étiquette partagée à l’échelle du produit »',
			attendu: 'refus',
			sql: `INSERT INTO etiquettes (libelle) SELECT libelle FROM etiquettes LIMIT 1`
		},
		{
			nom: 'relation — même source, même cible, même type refusée',
			regle: 'RG-M08-03',
			attendu: 'refus',
			sql: `
				INSERT INTO relations (source_id, cible_id, type_de_relation_id)
					SELECT source_id, cible_id, type_de_relation_id FROM relations LIMIT 1;
			`
		},
		{
			nom: 'compte — même identifiant refusé',
			regle: 'CDC §2.4',
			attendu: 'refus',
			sql: `
				INSERT INTO comptes (identifiant, nom, courriel, role, arrive_le)
					SELECT identifiant, 'Homonyme', 'homonyme@exemple.fr', 'lecteur', '2026-01-01'
					  FROM comptes LIMIT 1;
			`
		},
		{
			nom: 'compte — même courriel refusé',
			regle: 'CDC §2.4',
			attendu: 'refus',
			sql: `
				INSERT INTO comptes (identifiant, nom, courriel, role, arrive_le)
					SELECT 'sonde.courriel', 'Homonyme', courriel, 'lecteur', '2026-01-01'
					  FROM comptes LIMIT 1;
			`
		},
		{
			nom: 'droit de dossier — deux droits pour un même couple refusés',
			regle: 'RG-DRO-01, « le droit explicite le plus proche »',
			attendu: 'refus',
			sql: `
				INSERT INTO droits_de_dossier (dossier_id, compte_id, droit)
					SELECT d.id, c.id, 'lecteur' FROM dossiers d, comptes c LIMIT 1;
				INSERT INTO droits_de_dossier (dossier_id, compte_id, droit)
					SELECT d.id, c.id, 'gestionnaire' FROM dossiers d, comptes c LIMIT 1;
			`
		},
		{
			nom: 'dossier racine — un second refusé pour le même domaine',
			regle: 'RG-STR-03',
			attendu: 'refus',
			sql: `
				INSERT INTO dossiers (domaine_id, parent_id, nom, profondeur)
					SELECT id, NULL, 'Seconde racine', 1 FROM domaines LIMIT 1;
			`
		},
		{
			nom: 'dossier — parent dans un AUTRE domaine refusé',
			regle: 'RG-STR-05, seconde clause',
			attendu: 'refus',
			sql: `
				INSERT INTO dossiers (domaine_id, parent_id, nom, profondeur)
					SELECT d2.id, r1.id, 'Transfuge', 2
					  FROM dossiers r1
					  JOIN domaines d2 ON d2.id <> r1.domaine_id
					 WHERE r1.parent_id IS NULL
					 LIMIT 1;
			`
		},
		{
			nom: 'dossier — profondeur 11 refusée',
			regle: 'RG-STR-04',
			attendu: 'refus',
			sql: `
				INSERT INTO dossiers (domaine_id, parent_id, nom, profondeur)
					SELECT domaine_id, id, 'Trop profond', 11 FROM dossiers WHERE parent_id IS NULL LIMIT 1;
			`
		},
		{
			nom: 'note — dossier d’un AUTRE domaine refusé',
			regle: 'RG-STR-03 lu avec RG-STR-05',
			attendu: 'refus',
			sql: `
				INSERT INTO notes (identifiant, titre, corps_reference, type_de_note_id, domaine_id, dossier_id, auteur_id)
					SELECT 'n-sonde-transfuge', 'Transfuge', '{"type":"doc","content":[]}'::jsonb,
					       n.type_de_note_id, n.domaine_id, d.id, n.auteur_id
					  FROM notes n
					  JOIN dossiers d ON d.domaine_id <> n.domaine_id
					 LIMIT 1;
			`
		},
		{
			nom: 'univers système — suppression refusée',
			regle: 'RG-STR-01, seconde clause',
			attendu: 'refus',
			sql: `DELETE FROM univers WHERE systeme`
		},
		{
			nom: 'univers non système — suppression acceptée',
			regle: 'RG-STR-01, le cas que la règle autorise',
			attendu: 'acceptation',
			sql: `${nouvelUnivers('sonde-h', 'Sonde H')}; DELETE FROM univers WHERE identifiant = 'sonde-h'`
		},
		{
			nom: 'note — propriétés typées sans type de fiche refusées',
			regle: 'RG-NOT-01',
			attendu: 'refus',
			sql: `UPDATE notes SET proprietes_typees = '{}'::jsonb WHERE type_de_fiche_id IS NULL`
		},
		{
			nom: 'note — même titre dans deux domaines accepté',
			regle: 'CDC §3.2 : le TITRE ne porte aucune unicité, seul l’identifiant en porte une',
			attendu: 'acceptation',
			sql: `
				INSERT INTO notes (identifiant, titre, corps_reference, type_de_note_id, domaine_id, dossier_id, auteur_id)
					SELECT 'n-sonde-homonyme', titre, corps_reference, type_de_note_id, domaine_id, dossier_id, auteur_id
					  FROM notes WHERE identifiant = 'n-restaurer-pg';
			`
		}
	];
}

export async function verifierUnicite(pool: pg.Pool): Promise<readonly ResultatDeSonde[]> {
	const resultats: ResultatDeSonde[] = [];
	for (const sonde of sondes()) {
		const client = await pool.connect();
		let obtenu: 'refus' | 'acceptation' = 'acceptation';
		let code = '-';
		let detail = 'aucune erreur';
		try {
			await client.query('BEGIN');
			await client.query(sonde.sql);
			await client.query('ROLLBACK');
		} catch (erreur) {
			obtenu = 'refus';
			const e = erreur as { code?: string; message?: string; constraint?: string };
			code = e.code ?? '-';
			detail = e.constraint ?? e.message ?? String(erreur);
			try {
				await client.query('ROLLBACK');
			} catch {
				/* la transaction est déjà close : rien à annuler */
			}
		} finally {
			client.release();
		}
		resultats.push({
			nom: sonde.nom,
			regle: sonde.regle,
			attendu: sonde.attendu,
			obtenu,
			code,
			detail,
			reussi: obtenu === sonde.attendu
		});
	}
	return resultats;
}

export interface EcartDeCoherence {
	readonly quoi: string;
	readonly detail: string;
}

interface ColonneDuCatalogue {
	readonly table_name: string;
	readonly column_name: string;
	readonly udt_name: string;
	readonly is_nullable: string;
}

/**
 * Compare `src/lib/base/schema.ts` au catalogue de la base migrée : mêmes tables,
 * colonnes, types de base, nullabilité. ELLE NE REGARDE PAS les valeurs par défaut,
 * le détail des CHECK ni les actions référentielles — elle attrape la dérive de
 * structure, pas celle de comportement.
 */
export async function verifierCoherence(pool: pg.Pool): Promise<readonly EcartDeCoherence[]> {
	const { rows } = await pool.query<ColonneDuCatalogue>(`
		SELECT c.table_name, c.column_name, c.udt_name, c.is_nullable
		  FROM information_schema.columns c
		  JOIN information_schema.tables t
		    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
		 WHERE c.table_schema = 'public'
		   AND t.table_type = 'BASE TABLE'
		   AND c.table_name <> '${TABLE_DU_JOURNAL}'
	`);

	const ecarts: EcartDeCoherence[] = [];
	const catalogue = new Map<string, Map<string, ColonneDuCatalogue>>();
	for (const ligne of rows) {
		const table = catalogue.get(ligne.table_name) ?? new Map<string, ColonneDuCatalogue>();
		table.set(ligne.column_name, ligne);
		catalogue.set(ligne.table_name, table);
	}

	const attendues = new Set<string>();
	for (const table of Object.values(schema)) {
		const config = table as unknown as {
			[k: symbol]: unknown;
		};
		const nomDeTable = tableNom(config);
		attendues.add(nomDeTable);
		const colonnes = catalogue.get(nomDeTable);
		if (colonnes === undefined) {
			ecarts.push({
				quoi: `table ${nomDeTable}`,
				detail: 'décrite par le schéma, absente de la base'
			});
			continue;
		}
		for (const colonne of tableColonnes(config)) {
			const reelle = colonnes.get(colonne.nom);
			if (reelle === undefined) {
				ecarts.push({
					quoi: `${nomDeTable}.${colonne.nom}`,
					detail: 'décrite par le schéma, absente de la base'
				});
				continue;
			}
			const nullableSchema = !colonne.notNull;
			const nullableBase = reelle.is_nullable === 'YES';
			if (nullableSchema !== nullableBase) {
				ecarts.push({
					quoi: `${nomDeTable}.${colonne.nom}`,
					detail: `nullabilité : schéma ${String(nullableSchema)}, base ${String(nullableBase)}`
				});
			}
			const attendu = typeAttendu(colonne.type);
			if (attendu !== null && attendu !== reelle.udt_name) {
				ecarts.push({
					quoi: `${nomDeTable}.${colonne.nom}`,
					detail: `type : schéma ${attendu}, base ${reelle.udt_name}`
				});
			}
			colonnes.delete(colonne.nom);
		}
		for (const restante of colonnes.keys()) {
			ecarts.push({
				quoi: `${nomDeTable}.${restante}`,
				detail: 'présente dans la base, absente du schéma'
			});
		}
	}
	for (const nomDeTable of catalogue.keys()) {
		if (!attendues.has(nomDeTable)) {
			ecarts.push({
				quoi: `table ${nomDeTable}`,
				detail: 'présente dans la base, absente du schéma'
			});
		}
	}
	return ecarts;
}

interface ColonneDuSchema {
	readonly nom: string;
	readonly notNull: boolean;
	readonly type: string;
}

function tableNom(table: unknown): string {
	const symboles = Object.getOwnPropertySymbols(table as object);
	const cle = symboles.find((s) => s.description === 'drizzle:Name');
	if (cle === undefined) throw new Error('table Drizzle sans nom');
	return (table as Record<symbol, string>)[cle] as string;
}

function tableColonnes(table: unknown): readonly ColonneDuSchema[] {
	const symboles = Object.getOwnPropertySymbols(table as object);
	const cle = symboles.find((s) => s.description === 'drizzle:Columns');
	if (cle === undefined) throw new Error('table Drizzle sans colonnes');
	const colonnes = (table as Record<symbol, Record<string, unknown>>)[cle] as Record<
		string,
		{ name: string; notNull: boolean; columnType: string; getSQLType(): string }
	>;
	return Object.values(colonnes).map((c) => ({
		nom: c.name,
		notNull: c.notNull,
		type: c.getSQLType()
	}));
}

/** La traduction du type SQL déclaré par Drizzle vers le `udt_name` de PostgreSQL. */
function typeAttendu(type: string): string | null {
	const base = type.replace(/\s.*$/, '').toLowerCase();
	const table: Record<string, string> = {
		uuid: 'uuid',
		text: 'text',
		integer: 'int4',
		bigint: 'int8',
		boolean: 'bool',
		jsonb: 'jsonb',
		date: 'date',
		timestamp: 'timestamptz'
	};
	return table[base] ?? (/^[a-z_]+$/.test(base) ? base : null);
}

/** La commande de sortie du lot : le SQL brut, pour un diagnostic à la main. */
export const RELEVE_STRUCTUREL_SQL = RELEVE_STRUCTUREL;

export async function compter(session: Session, table: string): Promise<number> {
	const { rows } = await session.pool.query<{ n: string }>(`SELECT count(*) AS n FROM ${table}`);
	return Number(rows[0]?.n ?? 0);
}

/** Réexporté pour le lanceur : la marque d'un SQL brut piloté par Drizzle. */
export { sql };

export interface PremierAdministrateur {
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly motDePasse: string;
}

/**
 * CRÉE LE PREMIER ADMINISTRATEUR D'UNE INSTANCE — sans elle, une instance fraîchement migrée
 * n'a AUCUN compte et personne ne peut s'y connecter ; le seul chemin restant serait
 * `base:semer`, c'est-à-dire ouvrir une instance de production avec les identités d'une
 * maquette.
 *
 * ELLE REFUSE DE S'EXÉCUTER DEUX FOIS : elle n'écrit que si la table est VIDE. Un
 * administrateur créé en ligne de commande contourne toute traçabilité, et ce contournement ne
 * se justifie que pour l'amorçage. LE MOT DE PASSE N'EST NI ENGENDRÉ, NI IMPRIMÉ : l'appelant
 * le fournit, et seul son condensat Argon2id est écrit. AUCUN DOMAINE DE RATTACHEMENT : une
 * instance neuve n'en a pas encore, et `RG-DRO-03` dispense l'administrateur des droits de
 * dossier.
 */
export async function creerLePremierAdministrateur(
	session: Session,
	qui: PremierAdministrateur
): Promise<{ cree: boolean; motif?: string }> {
	for (const [champ, valeur] of Object.entries(qui)) {
		if (valeur.trim() === '') return { cree: false, motif: `${champ} manquant` };
	}
	if (qui.motDePasse.length < 12) {
		return { cree: false, motif: 'mot de passe trop court — douze caractères au minimum' };
	}
	const [dejaLa] = await session.db.select({ id: comptes.id }).from(comptes).limit(1);
	if (dejaLa !== undefined) {
		return {
			cree: false,
			motif: "l'instance porte déjà au moins un compte — les suivants se créent en console"
		};
	}
	const { hacherMotDePasse } = await import('../auth/mots-de-passe');
	await session.db.insert(comptes).values({
		identifiant: qui.identifiant.trim(),
		nom: qui.nom.trim(),
		courriel: qui.courriel.trim(),
		role: 'administrateur',
		actif: true,
		arriveLe: new Date().toISOString().slice(0, 10),
		condensatMotDePasse: await hacherMotDePasse(qui.motDePasse)
	});
	return { cree: true };
}
