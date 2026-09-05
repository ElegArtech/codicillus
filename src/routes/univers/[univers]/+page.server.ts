/**
 * LE CHARGEUR DE `/univers/{univers}` — V-10.
 *
 * IL PRODUIT DES COMPTES, PAS UN CORPUS. La page d'un univers montre une répartition
 * de vivacité, trois compteurs par domaine et un fil de sept jours : elle n'a jamais
 * eu besoin des notes elles-mêmes. Ce chargeur ne projette donc que les colonnes du
 * CYCLE de chaque note, les agrège, et sert des nombres — la vue n'a rien à
 * recalculer, et rien du corpus ne part dans le paquet du navigateur.
 *
 * LA RÉPARTITION EST CELLE DES REGISTRES *RÉFÉRENCE* (`SPEC-modele-navigation.md`).
 * L'Opérationnel a son propre cycle, et le compter avec ferait apparaître deux fois la
 * même note dans une bande de cinq compteurs qui annonce un total de notes.
 *
 * AUCUN ÉTAT N'EST CALCULÉ ICI. `cycleDuRegistre()` donne le cycle, `vivacite()` donne
 * l'état : ce sont les deux implémentations uniques, et les seuils viennent de la
 * configuration, pas d'une constante locale.
 *
 * LES ADRESSES SONT COMPOSÉES ICI, ET SEULEMENT ICI. `univers.identifiant` et
 * `domaines.identifiant` sont PERSISTÉS et ne suivent pas les renommages
 * (`RG-M12-11`) ; les dériver d'un nom d'affichage rendait 404 dès le premier
 * renommage, et pire encore sur un nom qui EST déjà une adresse — `audit_code`
 * devenait `audit-code`.
 *
 * L'ACTIVITÉ NE S'INVENTE PAS (`P-02`). La base porte cinq traces horodatées et
 * signées : la vérification, la version, la naissance de la note, la demande de
 * révision et le lot d'import. La fenêtre est de sept jours — la carte le dit
 * elle-même quand elle est vide.
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import {
	comptes,
	domaines as tableDesDomaines,
	lotsDImport,
	notes as tableDesNotes,
	univers as tableDesUnivers,
	verifications,
	versions
} from '$lib/base/schema';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { lireSeuilsDeVivacite } from '$lib/donnees/lecture';
import { cycleDuRegistre, type LigneDeCycles } from '$lib/donnees/vivacite';
import { accesALaConsole } from '$lib/donnees/consoles';
import {
	ORDRE_DES_ETATS,
	vivacite,
	type EtatDeVivacite,
	type SeuilsDeVivacite
} from '$lib/fraicheur';
import { LIBELLE_DE_FRAICHEUR } from '$lib/liste/facettes';
import { accord } from '$lib/vocabulaire';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { TypeDEvenement } from '../../../../seeds/corpus';
import type { PageServerLoad } from './$types';

const MILLISECONDES_PAR_JOUR = 86_400_000;
const MILLISECONDES_PAR_HEURE = 3_600_000;
/** La semaine que la carte d'activité annonce elle-même quand elle est vide. */
const FENETRE_DACTIVITE_JOURS = 7;
/** Cinq lignes de fil, comme la référence — au-delà, la carte devient une liste. */
const LIGNES_DACTIVITE = 5;
/**
 * L'écart au-dessous duquel une version EST la naissance de la note. Créer une note
 * écrit sa première version dans la foulée ; annoncer « Nouvelle note » et « Note
 * modifiée » pour le même geste ferait compter deux fois un seul fait.
 */
const MARGE_DE_NAISSANCE = 60_000;

/** Le chemin de la cartographie — `docs/routes.md` §3.4, le périmètre en requête. */
const ADRESSE_DE_LA_CARTOGRAPHIE = '/cartographie';
/** La recherche, seule liste que le produit ait à l'échelle d'un univers. */
const ADRESSE_DE_LA_RECHERCHE = '/recherche';
/** La console des domaines — le seul écran du produit qui écrive un domaine. */
const ADRESSE_DE_LA_CONSOLE_DES_DOMAINES = '/console/domaines';
const ADRESSE_DE_LA_NOUVELLE_NOTE = '/notes/nouvelle';
const ADRESSE_DU_PROFIL = '/mon-profil';

/** Le paramètre de requête composé, jamais concaténé à la main. */
function requete(chemin: string, valeurs: readonly (readonly [string, string])[]): string {
	const parametres = new URLSearchParams();
	for (const [nom, valeur] of valeurs) parametres.append(nom, valeur);
	return `${chemin}?${parametres.toString()}`;
}

/**
 * LES NOTES « À SURVEILLER » D'UN UNIVERS, dans la seule liste que le produit sache
 * rendre à cette échelle.
 *
 * ÉCART ASSUMÉ, ET IL EST DÉCLARÉ : `/recherche` porte une facette de fraîcheur à
 * TROIS valeurs, quand la vivacité en a cinq. « Vieillissant » et « Obsolète
 * probable » réunis sont les notes dont l'échéance est passée — ce que les deux
 * alertes désignent —, à la nuance des validités qui ne sont pas de quatre-vingt-dix
 * jours. La liste est réelle, et c'est ce qui compte : un lien mort ne l'était pas.
 */
function adresseDeSurveillance(universNom: string): string {
	return requete(ADRESSE_DE_LA_RECHERCHE, [
		['univers', universNom],
		['fraicheur', LIBELLE_DE_FRAICHEUR.vieil],
		['fraicheur', LIBELLE_DE_FRAICHEUR.obs]
	]);
}

/** La répartition vide — cinq états, cinq zéros, dans l'ordre des compteurs. */
function repartitionVide(): Record<EtatDeVivacite, number> {
	return { ajour: 0, bientot: 0, averifier: 0, arevoir: 0, obsolete: 0 };
}

/** La forme que la vue rend : cinq entrées, toujours, y compris à zéro. */
function enCompteurs(
	repartition: Record<EtatDeVivacite, number>
): readonly { etat: EtatDeVivacite; n: number }[] {
	return ORDRE_DES_ETATS.map((etat) => ({ etat, n: repartition[etat] }));
}

/** L'ancienneté en heures, jamais négative — une horloge qui recule n'est pas un fait. */
function heuresDepuis(instant: Date, maintenant: Date): number {
	return Math.max(
		0,
		Math.floor((maintenant.getTime() - instant.getTime()) / MILLISECONDES_PAR_HEURE)
	);
}

/**
 * LES COLONNES DE CYCLE D'UNE NOTE, telles que la requête les rend. Les deux noms de
 * vérificateur ne sont pas projetés : ils ne servent qu'aux LIBELLÉS d'une note
 * ouverte, et cette page n'en affiche aucun. `cycleDuRegistre()` reste l'unique
 * chemin — c'est lui qui décide du repli de `RG-M06-01`, pas ce chargeur.
 */
interface LigneDeNotePourCompteur {
	readonly domaineId: string;
	readonly auteur: string;
	readonly creeLe: Date;
	readonly modifieLe: Date;
	readonly corpsOperationnelModifieLe: Date | null;
	readonly verifieLe: Date | null;
	readonly verifieLeOperationnel: Date | null;
	readonly validiteReference: number;
	readonly validiteOperationnel: number;
	readonly revisionDemandee: boolean;
	readonly revisionRegistre: 'reference' | 'operationnel' | null;
	readonly revisionPar: string | null;
}

/** L'état du registre RÉFÉRENCE d'une note, par les deux implémentations uniques. */
function etatDeReference(
	ligne: LigneDeNotePourCompteur,
	maintenant: Date,
	seuils: SeuilsDeVivacite
): EtatDeVivacite {
	const cycles: LigneDeCycles = {
		modifieLe: ligne.modifieLe,
		corpsOperationnelModifieLe: ligne.corpsOperationnelModifieLe,
		verifieLe: ligne.verifieLe,
		verifieLeOperationnel: ligne.verifieLeOperationnel,
		validiteReference: ligne.validiteReference,
		validiteOperationnel: ligne.validiteOperationnel,
		revisionDemandee: ligne.revisionDemandee,
		revisionRegistre: ligne.revisionRegistre,
		revisionPar: ligne.revisionPar,
		verifieParReference: null,
		verifieParOperationnel: null
	};
	const cycle = cycleDuRegistre(cycles, 'reference');
	/* La Référence existe toujours (`RG-NOT-02`) : `cycleDuRegistre` ne rend `null`
	   que pour l'Opérationnel absent. La garde est là pour le compilateur. */
	if (cycle === null) return 'ajour';
	return vivacite(cycle, maintenant, seuils).etat;
}

/** La dernière trace datée d'une note — la plus récente de ses quatre dates. */
function derniereTrace(ligne: LigneDeNotePourCompteur): Date {
	const dates = [
		ligne.creeLe,
		ligne.modifieLe,
		ligne.corpsOperationnelModifieLe,
		ligne.verifieLe,
		ligne.verifieLeOperationnel
	].filter((d): d is Date => d !== null);
	return dates.reduce(
		(tard, d) => (d.getTime() > tard.getTime() ? d : tard),
		dates[0] ?? new Date(0)
	);
}

/**
 * LES NOTES DES DOMAINES OUVERTS, RÉDUITES AU PÉRIMÈTRE DE LECTURE.
 *
 * Le filtre de périmètre est DANS la requête, jamais après elle (`ADR-006`). Un
 * périmètre vide n'interroge pas la base : un ensemble vide passé à une clause
 * d'appartenance ne se rend pas de la même façon selon le dialecte.
 */
async function lireLesNotesDesDomaines(
	base: Base,
	acces: AccesAuRangement,
	domainesOuverts: readonly string[]
): Promise<readonly LigneDeNotePourCompteur[]> {
	if (domainesOuverts.length === 0) return [];
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);

	/* LE DEMANDEUR DE RÉVISION EST UN AUTRE COMPTE QUE L'AUTEUR, et la jointure doit
	   le dire : `cycleDuRegistre()` ne force « À revoir » que si elle porte un NOM. La
	   jointure est EXTERNE — la plupart des notes n'en ont pas. */
	const demandeur = alias(comptes, 'demandeur_de_revision');

	return base
		.select({
			domaineId: tableDesNotes.domaineId,
			auteur: comptes.nom,
			creeLe: tableDesNotes.creeLe,
			modifieLe: tableDesNotes.modifieLe,
			corpsOperationnelModifieLe: tableDesNotes.corpsOperationnelModifieLe,
			verifieLe: tableDesNotes.verifieLe,
			verifieLeOperationnel: tableDesNotes.verifieLeOperationnel,
			validiteReference: tableDesNotes.validiteReference,
			validiteOperationnel: tableDesNotes.validiteOperationnel,
			revisionDemandee: tableDesNotes.revisionDemandee,
			revisionRegistre: tableDesNotes.revisionRegistre,
			revisionPar: demandeur.nom
		})
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.auteurId, comptes.id))
		.leftJoin(demandeur, eq(tableDesNotes.revisionParId, demandeur.id))
		.where(and(inArray(tableDesNotes.domaineId, [...domainesOuverts]), filtre));
}

/** Un événement du fil, dans la forme que la vue rend. */
interface EvenementDUnivers {
	readonly type: TypeDEvenement;
	readonly qui: string;
	readonly objet: string;
	readonly adresse: string;
	readonly heures: number;
}

/**
 * L'ACTIVITÉ DE LA SEMAINE, LUE DANS LES CINQ TRACES QUI EXISTENT.
 *
 * UN ÉVÉNEMENT SANS AUTEUR CONNU N'EST PAS RENDU : les jointures sur `comptes` sont
 * INTERNES, une ligne de fil s'écrivant « QUI a fait QUOI ».
 */
async function lireLActiviteRecente(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date,
	/**
	 * LES DOMAINES OUVERTS DE CET UNIVERS. Ils bornent les quatre traces de note, et
	 * ils sont la SEULE chose qui rattache un lot d'import à un univers : un lot ne
	 * vise aucune note, il vise un domaine.
	 */
	domainesOuverts: readonly string[]
): Promise<readonly EvenementDUnivers[]> {
	if (domainesOuverts.length === 0) return [];
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const perimetre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);
	const surLUnivers = inArray(tableDesNotes.domaineId, [...domainesOuverts]);
	const depuis = new Date(maintenant.getTime() - FENETRE_DACTIVITE_JOURS * MILLISECONDES_PAR_JOUR);

	const verifiees = await base
		.select({
			objet: tableDesNotes.titre,
			cible: tableDesNotes.identifiant,
			qui: comptes.nom,
			le: verifications.le
		})
		.from(verifications)
		.innerJoin(tableDesNotes, eq(verifications.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(and(gte(verifications.le, depuis), surLUnivers, perimetre));

	/* LA VERSION QUI ACCOMPAGNE LA NAISSANCE N'EST PAS UNE MODIFICATION : elle est
	   écartée ici, et la naissance est rendue par sa propre trace. */
	const modifiees = await base
		.select({
			objet: tableDesNotes.titre,
			cible: tableDesNotes.identifiant,
			qui: comptes.nom,
			le: versions.le,
			creeLe: tableDesNotes.creeLe
		})
		.from(versions)
		.innerJoin(tableDesNotes, eq(versions.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(and(gte(versions.le, depuis), surLUnivers, perimetre));

	const creees = await base
		.select({
			objet: tableDesNotes.titre,
			cible: tableDesNotes.identifiant,
			qui: comptes.nom,
			le: tableDesNotes.creeLe
		})
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.auteurId, comptes.id))
		.where(and(gte(tableDesNotes.creeLe, depuis), surLUnivers, perimetre));

	const signalees = await base
		.select({
			objet: tableDesNotes.titre,
			cible: tableDesNotes.identifiant,
			qui: comptes.nom,
			le: tableDesNotes.revisionLe
		})
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.revisionParId, comptes.id))
		.where(
			and(
				eq(tableDesNotes.revisionDemandee, true),
				gte(tableDesNotes.revisionLe, depuis),
				surLUnivers,
				perimetre
			)
		);

	/* LES LOTS D'IMPORT — `RG-M12-09`. Une SIMULATION n'écrit rien (`RG-M12-02`) et un
	   lot refusé en bloc non plus : les annoncer ferait chercher des notes qui
	   n'existent pas. */
	const lots = await base
		.select({
			qui: comptes.nom,
			le: lotsDImport.le,
			source: lotsDImport.source,
			notesCreees: lotsDImport.notesCreees,
			notesMisesAJour: lotsDImport.notesMisesAJour
		})
		.from(lotsDImport)
		.innerJoin(comptes, eq(lotsDImport.auteurId, comptes.id))
		.where(
			and(
				gte(lotsDImport.le, depuis),
				eq(lotsDImport.simulation, false),
				inArray(lotsDImport.domaineId, [...domainesOuverts])
			)
		);

	function surNote(
		type: TypeDEvenement,
		ligne: { objet: string; cible: string; qui: string; le: Date | null }
	): EvenementDUnivers | null {
		if (ligne.le === null) return null;
		return {
			type,
			qui: ligne.qui,
			objet: ligne.objet,
			adresse: `/notes/${ligne.cible}`,
			heures: heuresDepuis(ligne.le, maintenant)
		};
	}

	const evenements: readonly EvenementDUnivers[] = [
		...verifiees.map((l) => surNote('verification', l)),
		...modifiees
			.filter((l) => l.le.getTime() - l.creeLe.getTime() > MARGE_DE_NAISSANCE)
			.map((l) => surNote('edition', l)),
		...creees.map((l) => surNote('publication', l)),
		...signalees.map((l) => surNote('revision', l)),
		...lots
			.filter((l) => l.notesCreees + l.notesMisesAJour > 0)
			.map((l) => {
				const ecrites = l.notesCreees + l.notesMisesAJour;
				return {
					type: 'import' as const,
					qui: l.qui,
					/* LE DÉTAIL EST MESURÉ, PAS ILLUSTRÉ : le nombre vient du journal du lot,
					   la source du dossier déposé. */
					objet: `${String(ecrites)} ${accord(ecrites, 'note reprise', 'notes reprises')} depuis ${l.source}`,
					adresse: '',
					heures: heuresDepuis(l.le, maintenant)
				};
			})
	].filter((e): e is EvenementDUnivers => e !== null);

	/* Du plus récent au plus ancien. À égalité, l'objet départage : sans lui, l'ordre
	   dépendrait de celui que le serveur a rendu, donc du plan de requête. */
	return [...evenements]
		.sort((a, b) => a.heures - b.heures || a.objet.localeCompare(b.objet, 'fr'))
		.slice(0, LIGNES_DACTIVITE);
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const [universOuvert] = await base
		.select({
			id: tableDesUnivers.id,
			identifiant: tableDesUnivers.identifiant,
			nom: tableDesUnivers.nom,
			description: tableDesUnivers.description,
			glyphe: tableDesUnivers.glyphe
		})
		.from(tableDesUnivers)
		.where(eq(tableDesUnivers.identifiant, params.univers));

	const tousLesDomaines =
		universOuvert === undefined
			? []
			: await base
					.select({
						id: tableDesDomaines.id,
						identifiant: tableDesDomaines.identifiant,
						nom: tableDesDomaines.nom,
						description: tableDesDomaines.description
					})
					.from(tableDesDomaines)
					.where(eq(tableDesDomaines.universId, universOuvert.id))
					.orderBy(tableDesDomaines.nom);

	const lisibles = tousLesDomaines.filter((d) => domaineLisible(acces, d.id));

	/**
	 * UN UNIVERS SANS AUCUN DOMAINE S'OUVRE, et rend son état vide. Il rendait 404 :
	 * on crée un univers en premier sur une instance neuve, et aucun chemin ne
	 * l'ouvrait ensuite.
	 *
	 * Les deux refus ne bougent pas — univers absent, ou univers dont aucun domaine
	 * n'est lisible : 404 par le même point de sortie (`ADR-007`).
	 */
	const vide = universOuvert !== undefined && tousLesDomaines.length === 0;
	const ouvrable = locals.identite.type === 'authentifie' && vide;
	const resolution = resoudre(universOuvert ?? null, () => lisibles.length > 0 || ouvrable);
	if (!resolution.trouve) refuserLAdresse(url.pathname);
	const univers = resolution.ressource;

	/* Les dossiers des seuls domaines lisibles : c'est sur eux que se lit la capacité
	   d'écriture, jamais sur l'univers entier. Sur un univers vide, il n'y en a aucun,
	   et c'est l'accès à la console qui décide — un domaine ne se crée que là. */
	const dossiersLisibles = lisibles.flatMap((d) =>
		dossiersDuDomaine(acces, d.id).map((ligne) => ligne.id)
	);
	const ecriture = vide
		? accesALaConsole(locals.identite)
		: peutEcrireDansLUn(acces, dossiersLisibles);

	const seuils = await lireSeuilsDeVivacite(base);
	const notesLisibles = await lireLesNotesDesDomaines(
		base,
		acces,
		lisibles.map((d) => d.id)
	);

	/* L'agrégation : une passe, deux accumulateurs — l'univers et chaque domaine. */
	const repartitionDeLUnivers = repartitionVide();
	const parDomaine = new Map<
		string,
		{ repartition: Record<EtatDeVivacite, number>; le: Date | null }
	>();
	for (const d of lisibles) parDomaine.set(d.id, { repartition: repartitionVide(), le: null });
	const auteurs = new Set<string>();
	let derniereDeLUnivers: Date | null = null;

	for (const ligne of notesLisibles) {
		const etat = etatDeReference(ligne, maintenant, seuils);
		repartitionDeLUnivers[etat] += 1;
		auteurs.add(ligne.auteur);
		const trace = derniereTrace(ligne);
		if (derniereDeLUnivers === null || trace.getTime() > derniereDeLUnivers.getTime()) {
			derniereDeLUnivers = trace;
		}
		const cumul = parDomaine.get(ligne.domaineId);
		if (cumul === undefined) continue;
		cumul.repartition[etat] += 1;
		if (cumul.le === null || trace.getTime() > cumul.le.getTime()) cumul.le = trace;
	}

	return {
		univers: {
			nom: univers.nom,
			description: univers.description,
			glyphe: univers.glyphe
		},
		droits: ecriture ? ('ecriture' as const) : ('lecture' as const),
		repartition: enCompteurs(repartitionDeLUnivers),
		contributeurs: auteurs.size,
		heuresDepuisLActivite:
			derniereDeLUnivers === null ? null : heuresDepuis(derniereDeLUnivers, maintenant),
		domaines: lisibles.map((d) => {
			const cumul = parDomaine.get(d.id);
			return {
				nom: d.nom,
				description: d.description,
				adresse: `/univers/${univers.identifiant}/${d.identifiant}`,
				repartition: enCompteurs(cumul?.repartition ?? repartitionVide()),
				heures:
					cumul?.le === undefined || cumul?.le === null ? null : heuresDepuis(cumul.le, maintenant)
			};
		}),
		activite: await lireLActiviteRecente(
			base,
			acces,
			maintenant,
			lisibles.map((d) => d.id)
		),
		seuilBientot: seuils.bientot,
		adresses: {
			cartographie: requete(ADRESSE_DE_LA_CARTOGRAPHIE, [['perimetre', `univers|${univers.nom}`]]),
			surveillance: adresseDeSurveillance(univers.nom),
			creationDeDomaine: ADRESSE_DE_LA_CONSOLE_DES_DOMAINES,
			creationDeNote: ADRESSE_DE_LA_NOUVELLE_NOTE,
			profil: ADRESSE_DU_PROFIL
		}
	};
};
