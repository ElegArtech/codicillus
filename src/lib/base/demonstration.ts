/**
 * LE CHARGEUR DU JEU DE DÉMONSTRATION — `pnpm base:peupler`. Il écrit une instance complète et
 * cohérente ; `seeds/demonstration.ts` porte la structure et `seeds/demonstration/*.md` le
 * contenu, qui est dans des FICHIERS et non dans le module : un corps de note contient des
 * blocs de code, et les écrire dans un modèle littéral demanderait d'échapper les accents
 * graves — un accent grave mal échappé casse le fichier à cent lignes de la cause (`P-17`).
 *
 * IL REMPLACE LE CONTENU, IL NE S'Y AJOUTE PAS. LES COMPTES QUI NE SONT PAS DU JEU NE SONT PAS
 * TOUCHÉS : `truncate … cascade` a détruit un compte d'administration réel, `comptes`
 * référençant `domaines`. Les suppressions sont explicites, des filles vers les mères.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { Session } from './commandes';
import {
	champsDeTypeDeFiche,
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	etiquettes,
	etiquettesDeNote,
	modulesDeDomaine,
	notes,
	relations,
	typesDeFiche,
	typesDeNote,
	typesDeRelation,
	univers,
	verifications,
	CONFIGURATION_PAR_DEFAUT
} from './schema';
import { analyserMarkdown } from '../contenu/markdown';
import { hacherMotDePasse } from '../auth/mots-de-passe';
import {
	COMPTES,
	DOMAINES,
	DOSSIERS,
	DROITS,
	RELATIONS,
	TYPES_DE_FICHE,
	TYPES_DE_RELATION,
	UNIVERS
} from '../../../seeds/demonstration';

/** Le mot de passe de tous les comptes du jeu. Une démonstration, pas une instance. */
export const MOT_DE_PASSE_DE_DEMONSTRATION = 'demonstration-2026';

const SEPARATEUR_DE_REGISTRE = '--- OPERATIONNEL ---';
const JOUR = 86_400_000;

interface EnTete {
	readonly [cle: string]: string;
}

interface NoteLue {
	readonly entete: EnTete;
	readonly reference: string;
	readonly operationnel: string | null;
}

/**
 * L'en-tête est délimité par deux lignes de trois tirets. Le format est
 * volontairement pauvre — une clé, deux points, une valeur — parce qu'il n'a
 * qu'un producteur et qu'un lecteur : y mettre un analyseur YAML complet serait
 * une dépendance pour rien.
 */
function lireLeFichier(texte: string): NoteLue {
	const lignes = texte.split('\n');
	if (lignes[0]?.trim() !== '---') throw new Error('en-tête manquant');
	const fin = lignes.indexOf('---', 1);
	if (fin < 0) throw new Error('en-tête non refermé');

	const entete: Record<string, string> = {};
	for (const ligne of lignes.slice(1, fin)) {
		const sep = ligne.indexOf(':');
		if (sep < 0) continue;
		entete[ligne.slice(0, sep).trim()] = ligne.slice(sep + 1).trim();
	}

	const corps = lignes
		.slice(fin + 1)
		.join('\n')
		.trim();
	const coupe = corps.indexOf(SEPARATEUR_DE_REGISTRE);
	return coupe < 0
		? { entete, reference: corps, operationnel: null }
		: {
				entete,
				reference: corps.slice(0, coupe).trim(),
				operationnel: corps.slice(coupe + SEPARATEUR_DE_REGISTRE.length).trim()
			};
}

/** « a=1; b=2 » → { a: '1', b: '2' } — les propriétés d'une fiche typée. */
function lireLesProprietes(valeur: string | undefined): Record<string, string> {
	if (valeur === undefined || valeur.trim() === '') return {};
	const rendu: Record<string, string> = {};
	for (const morceau of valeur.split(';')) {
		const sep = morceau.indexOf('=');
		if (sep < 0) continue;
		rendu[morceau.slice(0, sep).trim()] = morceau.slice(sep + 1).trim();
	}
	return rendu;
}

const liste = (v: string | undefined): string[] =>
	v === undefined
		? []
		: v
				.split(',')
				.map((x) => x.trim())
				.filter((x) => x !== '');

function exiger<T>(valeur: T | undefined, quoi: string): T {
	if (valeur === undefined) throw new Error(`introuvable : ${quoi}`);
	return valeur;
}

export interface RapportDePeuplement {
	readonly comptes: number;
	readonly univers: number;
	readonly domaines: number;
	readonly dossiers: number;
	readonly notes: number;
	readonly relations: number;
	readonly etiquettes: number;
	readonly verifications: number;
}

export async function peupler(
	session: Session,
	racine = process.cwd()
): Promise<RapportDePeuplement> {
	const dossierDuContenu = path.join(racine, 'seeds', 'demonstration');
	const fichiers = (await readdir(dossierDuContenu)).filter((f) => f.endsWith('.md')).sort();
	const lues = await Promise.all(
		fichiers.map(async (f) => {
			try {
				return lireLeFichier(await readFile(path.join(dossierDuContenu, f), 'utf8'));
			} catch (cause) {
				throw new Error(`${f} : ${cause instanceof Error ? cause.message : String(cause)}`, {
					cause
				});
			}
		})
	);

	const maintenant = Date.now();
	const condensat = await hacherMotDePasse(MOT_DE_PASSE_DE_DEMONSTRATION);

	return session.db.transaction(async (tx) => {
		/**
		 * ON EFFACE LE CONTENU, ET SURTOUT PAS LES COMPTES. `truncate … cascade` sur `domaines` a
		 * détruit un compte réel : `comptes` porte une clé étrangère vers `domaines`, donc le
		 * CASCADE emportait la table ENTIÈRE avant même que la ligne suivante, censée en préserver
		 * un, ne s'exécute. Un `cascade` ne se raisonne pas sur les tables qu'on nomme mais sur
		 * toutes celles qui les référencent.
		 */
		await tx.execute(sql`delete from ${etiquettesDeNote}`);
		await tx.execute(sql`delete from ${relations}`);
		await tx.execute(sql`delete from ${verifications}`);
		await tx.execute(sql`delete from consultations`);
		await tx.execute(sql`delete from versions`);
		await tx.execute(sql`delete from pieces_jointes`);
		await tx.execute(sql`delete from ${droitsDeDossier}`);
		await tx.execute(sql`delete from ${champsDeTypeDeFiche}`);
		await tx.execute(sql`delete from ${modulesDeDomaine}`);
		await tx.execute(sql`delete from ${notes}`);
		await tx.execute(sql`delete from ${dossiers}`);
		await tx.execute(sql`delete from ${etiquettes}`);
		await tx.execute(sql`delete from ${typesDeFiche}`);
		await tx.execute(sql`delete from ${typesDeRelation}`);
		/* Le rattachement d'un compte à un domaine s'efface avec le domaine
		   (`on delete set null`) ; le compte, lui, reste. */
		await tx.execute(sql`delete from ${domaines}`);
		await tx.execute(sql`delete from ${univers}`);

		/* Les comptes du JEU seulement, désignés un à un. Tout autre compte —
		   celui d'un administrateur réel — n'est pas touché. */
		const identifiantsDuJeu = COMPTES.map((c) => c.identifiant);
		await tx.execute(
			sql`delete from ${comptes} where ${comptes.identifiant} in ${identifiantsDuJeu}`
		);

		/* Les comptes. */
		const comptesPoses = await tx
			.insert(comptes)
			.values(
				COMPTES.map((c) => ({
					identifiant: c.identifiant,
					nom: c.nom,
					courriel: c.courriel,
					role: c.role,
					actif: c.actif,
					arriveLe: c.arriveLe,
					condensatMotDePasse: condensat
				}))
			)
			.returning({ id: comptes.id, identifiant: comptes.identifiant });
		const compteParIdentifiant = new Map(comptesPoses.map((c) => [c.identifiant, c.id]));

		/* Le rangement. */
		const universPoses = await tx
			.insert(univers)
			.values(UNIVERS.map((u) => ({ ...u, systeme: false })))
			.returning({ id: univers.id, nom: univers.nom });
		const universParNom = new Map(universPoses.map((u) => [u.nom, u.id]));

		const domainesPoses = await tx
			.insert(domaines)
			.values(
				DOMAINES.map((d) => ({
					universId: exiger(universParNom.get(d.univers), `univers ${d.univers}`),
					identifiant: d.identifiant,
					nom: d.nom,
					description: d.description,
					couleur: d.couleur
				}))
			)
			.returning({ id: domaines.id, nom: domaines.nom });
		const domaineParNom = new Map(domainesPoses.map((d) => [d.nom, d.id]));

		await tx.insert(modulesDeDomaine).values(
			DOMAINES.flatMap((d) =>
				d.modules.map((module) => ({
					domaineId: exiger(domaineParNom.get(d.nom), `domaine ${d.nom}`),
					module: module as 'notes'
				}))
			)
		);

		/* Les dossiers : la racine porte le nom du domaine (RG-STR-03), puis les
		   chemins déclarés, du plus court au plus long — un enfant ne peut pas
		   être posé avant son parent. */
		const dossierParChemin = new Map<string, string>();
		for (const d of DOMAINES) {
			const domaineId = exiger(domaineParNom.get(d.nom), `domaine ${d.nom}`);
			const [racineDuDomaine] = await tx
				.insert(dossiers)
				.values({ domaineId, parentId: null, nom: d.nom, position: 0, profondeur: 1 })
				.returning({ id: dossiers.id });
			dossierParChemin.set(`${d.nom}|`, exiger(racineDuDomaine?.id, `racine de ${d.nom}`));

			const chemins = [...(DOSSIERS[d.nom] ?? [])].sort(
				(a, b) => a.split('›').length - b.split('›').length
			);
			for (const [rang, chemin] of chemins.entries()) {
				const segments = chemin.split('›').map((s) => s.trim());
				const nom = exiger(segments.at(-1), chemin);
				const cheminDuParent = segments.slice(0, -1).join(' › ');
				const parentId = exiger(
					dossierParChemin.get(`${d.nom}|${cheminDuParent}`),
					`parent de ${chemin}`
				);
				const [pose] = await tx
					.insert(dossiers)
					.values({ domaineId, parentId, nom, position: rang, profondeur: segments.length + 1 })
					.returning({ id: dossiers.id });
				dossierParChemin.set(`${d.nom}|${chemin}`, exiger(pose?.id, chemin));
			}
		}

		/* Les référentiels de saisie. */
		const typesNotePoses = await tx
			.select({ id: typesDeNote.id, nom: typesDeNote.nom })
			.from(typesDeNote);
		const typeDeNoteParNom = new Map(typesNotePoses.map((t) => [t.nom, t.id]));

		const fichesPosees = await tx
			.insert(typesDeFiche)
			.values(TYPES_DE_FICHE.map((t, ordre) => ({ identifiant: t.identifiant, nom: t.nom, ordre })))
			.returning({ id: typesDeFiche.id, nom: typesDeFiche.nom });
		const typeDeFicheParNom = new Map(fichesPosees.map((t) => [t.nom, t.id]));

		await tx.insert(champsDeTypeDeFiche).values(
			TYPES_DE_FICHE.flatMap((t) =>
				t.champs.map((c, ordre) => ({
					typeDeFicheId: exiger(typeDeFicheParNom.get(t.nom), `type de fiche ${t.nom}`),
					cle: c.cle,
					nom: c.nom,
					type: c.type,
					ordre,
					exemple: c.exemple ?? null,
					valeurs: c.valeurs === undefined ? null : [...c.valeurs]
				}))
			)
		);

		const relationsPosees = await tx
			.insert(typesDeRelation)
			.values(
				TYPES_DE_RELATION.map((t, ordre) => ({
					identifiant: t.identifiant,
					libelleSortant: t.sortant,
					libelleEntrant: t.entrant,
					technique: t.technique,
					ordre
				}))
			)
			.returning({ id: typesDeRelation.id, identifiant: typesDeRelation.identifiant });
		const typeDeRelationParIdentifiant = new Map(relationsPosees.map((t) => [t.identifiant, t.id]));

		/* Les notes. */
		const noteParIdentifiant = new Map<string, string>();
		const etiquetteParLibelle = new Map<string, string>();
		let combienDeVerifications = 0;

		for (const { entete, reference, operationnel } of lues) {
			const domaine = exiger(entete['domaine'], 'domaine');
			const cheminDuDossier = entete['dossier'] ?? '';
			const auteurId = exiger(
				compteParIdentifiant.get(exiger(entete['auteur'], 'auteur')),
				`compte ${entete['auteur']}`
			);
			const verifieIlYA = entete['verifie-il-y-a-jours'];
			const verifieLe =
				verifieIlYA === undefined ? null : new Date(maintenant - Number(verifieIlYA) * JOUR);
			const revision = entete['revision-demandee'];
			/**
			 * LE CYCLE DE L'OPÉRATIONNEL — `014`. Sans corps opérationnel il n'y en a
			 * pas, et `notes_operationnel_verification_coherente` le refuserait ; avec
			 * un corps, le défaut est « vérifié à l'instant », parce que créer le
			 * registre le vérifie. `verifie-operationnel-il-y-a-jours` déplace la date
			 * pour que le jeu montre les deux registres dans DEUX ÉTATS DIFFÉRENTS —
			 * ce qui est tout l'intérêt d'un cycle par registre.
			 */
			const verifieOperationnelIlYA = entete['verifie-operationnel-il-y-a-jours'];
			const verifieLeOperationnel =
				operationnel === null
					? null
					: new Date(
							maintenant -
								(verifieOperationnelIlYA === undefined ? 0 : Number(verifieOperationnelIlYA) * JOUR)
						);
			/* Les durées de validité : celles de l'instance, sauf mention dans
			   l'en-tête. Une valeur nulle ou négative serait refusée par la base — le
			   repli sur le défaut la garde hors de la transaction. */
			const jours = (cle: string, defaut: number): number => {
				const brut = entete[cle];
				if (brut === undefined) return defaut;
				const valeur = Number(brut);
				return Number.isSafeInteger(valeur) && valeur >= 1 ? valeur : defaut;
			};

			const [posee] = await tx
				.insert(notes)
				.values({
					identifiant: exiger(entete['identifiant'], 'identifiant'),
					titre: exiger(entete['titre'], 'titre'),
					corpsReference: analyserMarkdown(reference),
					corpsOperationnel: operationnel === null ? null : analyserMarkdown(operationnel),
					/* Quatre contraintes de cohérence lient ces colonnes deux à deux, et
					   la base a raison de les tenir : un corps opérationnel sans sa date,
					   un signet sans sa date d'ajout, une révision sans son auteur sont
					   des états qu'aucun écran ne saurait rendre. */
					corpsOperationnelModifieLe: operationnel === null ? null : new Date(maintenant),
					signetAjouteLe:
						entete['adresse'] === undefined
							? null
							: new Date(maintenant - 30 * JOUR).toISOString().slice(0, 10),
					typeDeNoteId: exiger(
						typeDeNoteParNom.get(exiger(entete['type'], 'type')),
						`type ${entete['type']}`
					),
					domaineId: exiger(domaineParNom.get(domaine), `domaine ${domaine}`),
					dossierId: exiger(
						dossierParChemin.get(`${domaine}|${cheminDuDossier}`),
						`dossier ${domaine} › ${cheminDuDossier}`
					),
					auteurId,
					typeDeFicheId:
						entete['fiche'] === undefined
							? null
							: exiger(typeDeFicheParNom.get(entete['fiche']), `fiche ${entete['fiche']}`),
					proprietesTypees:
						entete['fiche'] === undefined ? null : lireLesProprietes(entete['proprietes']),
					signetAdresse: entete['adresse'] ?? null,
					statut: entete['statut'] === 'brouillon' ? 'brouillon' : 'publiee',
					verifieLe,
					verifieLeOperationnel,
					validiteReference: jours(
						'validite-reference',
						CONFIGURATION_PAR_DEFAUT.validiteReference
					),
					validiteOperationnel: jours(
						'validite-operationnel',
						CONFIGURATION_PAR_DEFAUT.validiteOperationnel
					),
					compteurDeConsultations: 0,
					revisionDemandee: revision !== undefined,
					revisionCommentaire: revision ?? null,
					/* La demande vise le registre nommé par l'en-tête, la Référence à
					   défaut — et rien du tout s'il n'y a pas de demande. */
					revisionRegistre:
						revision === undefined
							? null
							: entete['revision-registre'] === 'operationnel'
								? ('operationnel' as const)
								: ('reference' as const),
					revisionParId:
						entete['revision-par'] === undefined
							? null
							: (compteParIdentifiant.get(entete['revision-par']) ?? null),
					revisionLe:
						entete['revision-il-y-a-jours'] === undefined
							? null
							: new Date(maintenant - Number(entete['revision-il-y-a-jours']) * JOUR)
				} as never)
				.returning({ id: notes.id });
			const noteId = exiger(posee?.id, entete['identifiant'] ?? '?');
			noteParIdentifiant.set(exiger(entete['identifiant'], 'identifiant'), noteId);

			/* La vérification est une TRACE, pas seulement une date : sans elle, le
			   flux d'activité de l'accueil resterait vide alors que les notes
			   s'affichent vérifiées. */
			if (verifieLe !== null) {
				await tx.insert(verifications).values({
					noteId,
					compteId: auteurId,
					registre: 'reference',
					le: verifieLe
				});
				combienDeVerifications += 1;
			}
			/* La création du registre Opérationnel EST une vérification : le fil
			   d'activité doit la montrer comme telle, avec son registre. */
			if (verifieLeOperationnel !== null) {
				await tx.insert(verifications).values({
					noteId,
					compteId: auteurId,
					registre: 'operationnel',
					le: verifieLeOperationnel
				});
				combienDeVerifications += 1;
			}

			for (const [rang, libelle] of liste(entete['etiquettes']).entries()) {
				let etiquetteId = etiquetteParLibelle.get(libelle);
				if (etiquetteId === undefined) {
					const [poseeEtq] = await tx
						.insert(etiquettes)
						.values({ libelle })
						.returning({ id: etiquettes.id });
					etiquetteId = exiger(poseeEtq?.id, libelle);
					etiquetteParLibelle.set(libelle, etiquetteId);
				}
				await tx.insert(etiquettesDeNote).values({ noteId, etiquetteId, ordre: rang });
			}
		}

		/* Les relations, une fois toutes les notes posées. */
		const lignesDeRelation = RELATIONS.map((r) => ({
			sourceId: exiger(noteParIdentifiant.get(r.source), `note ${r.source}`),
			cibleId: exiger(noteParIdentifiant.get(r.cible), `note ${r.cible}`),
			typeDeRelationId: exiger(typeDeRelationParIdentifiant.get(r.type), `relation ${r.type}`),
			origine: 'declaree' as const
		}));
		await tx.insert(relations).values(lignesDeRelation);

		/* Les droits, posés sur la racine de chaque domaine. */
		await tx.insert(droitsDeDossier).values(
			DROITS.map((d) => ({
				dossierId: exiger(dossierParChemin.get(`${d.domaine}|`), `racine de ${d.domaine}`),
				compteId: exiger(compteParIdentifiant.get(d.compte), `compte ${d.compte}`),
				droit: d.droit
			}))
		);

		return {
			comptes: comptesPoses.length,
			univers: universPoses.length,
			domaines: domainesPoses.length,
			dossiers: dossierParChemin.size,
			notes: noteParIdentifiant.size,
			relations: lignesDeRelation.length,
			etiquettes: etiquetteParLibelle.size,
			verifications: combienDeVerifications
		};
	});
}
