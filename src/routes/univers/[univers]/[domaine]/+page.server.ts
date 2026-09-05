/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}` — V-11. « Connecté + lecteur » ; le droit
 * vient de `resolution.ts`, et aucune règle de droit n'est écrite ici.
 *
 * `RG-STR-02` — l'unicité d'un domaine n'est portée QUE par son univers. Le couple est
 * donc résolu ENSEMBLE, par une seule requête jointe : chercher le domaine d'abord puis
 * vérifier son univers rendrait la mauvaise ligne dans le cas même que la règle prévoit.
 *
 * LES TROIS POSITIONS DE L'AXE « PROFIL » ne sont pas devinées : `admin` se lit sur le
 * périmètre, que `perimetreDeLecture()` rend TOTAL au seul administrateur, et `ecriture`
 * est `capacites(droit).ecrireDesNotes`.
 *
 * LE COMPTEUR DE DOSSIERS NE SE DÉDUIT PAS DU RANGEMENT DES NOTES : un dossier VIDE
 * n'apparaît dans aucun chemin de note. Il est lu dans la table `dossiers`, racine
 * exclue, et réduit aux dossiers que l'appelant peut lire.
 *
 * LA VIVACITÉ NE SE RECALCULE PAS ICI. Les cinq états viennent de `vivacite()`, la
 * fabrique unique, nourrie par `cycleDuRegistre()` — l'unique pont entre les colonnes de
 * `notes` et la fabrique. La répartition du domaine est l'agrégat des registres
 * RÉFÉRENCE de ses notes : c'est le registre canonique, le seul qu'une note porte
 * toujours (`RG-NOT-02`).
 *
 * L'ACTIVITÉ NE S'INVENTE PAS (`P-02`) : chaque ligne du fil est une trace horodatée et
 * signée — `verifications`, `versions`, la création de la note, un lot d'import — ou une
 * BASCULE dérivée du cycle, que `basculesDUnCycle()` calcule et que personne ne stocke.
 * Rien n'est illustré.
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import {
	comptes,
	consultations,
	domaines as tableDesDomaines,
	lotsDImport,
	notes as tableDesNotes,
	univers as tableDesUnivers,
	verifications,
	versions
} from '$lib/base/schema';
import { capacites, resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	droitEffectif,
	lireDomaineParIdentifiants,
	lireNotesLisibles,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { lireModulesParDomaine, lireSeuilsDeVivacite, lireUnivers } from '$lib/donnees/lecture';
import { identifiantLisible } from '$lib/rangement/adresses';
import { basculesDUnCycle, cycleDuRegistre, type LigneDeCycles } from '$lib/donnees/vivacite';
import { vivacite, type EtatDeVivacite, type SeuilsDeVivacite } from '$lib/fraicheur';
import { accord } from '$lib/vocabulaire';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type {
	DetailDeDomaine,
	Domaine,
	IdentifiantNote,
	NomDeDomaine,
	Univers
} from '../../../../../seeds/corpus';
import type { PageServerLoad } from './$types';

interface RangementLisible {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	readonly detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
}

/**
 * LE RANGEMENT RÉDUIT À CE QUI EST LISIBLE. `P-03` : « une entrée visible est une
 * entrée qui fonctionne » — un domaine sur lequel l'appelant n'a aucun droit mène
 * à une adresse que cette même route refuse. AUCUNE RÈGLE DE DROIT N'EST ÉCRITE
 * ICI : `domaineLisible()` interroge `capacites()`.
 *
 * CE CODE EST LE MÊME DANS LE CHARGEUR PARENT, et la duplication est SUBIE :
 * `+page.server.ts` n'admet que les exports que SvelteKit valide.
 */
async function lireLeRangementLisible(
	base: Base,
	acces: AccesAuRangement
): Promise<RangementLisible> {
	const lignes = await base
		.select({
			id: tableDesDomaines.id,
			nom: tableDesDomaines.nom,
			couleur: tableDesDomaines.couleur,
			description: tableDesDomaines.description,
			universNom: tableDesUnivers.nom
		})
		.from(tableDesDomaines)
		.innerJoin(tableDesUnivers, eq(tableDesDomaines.universId, tableDesUnivers.id))
		.orderBy(tableDesUnivers.ordre, tableDesDomaines.nom);

	const lisibles = lignes.filter((ligne) => domaineLisible(acces, ligne.id));
	const modulesParDomaine = await lireModulesParDomaine(base);

	/* `DetailDeDomaine.modules` est la liste RÉELLE de `modules_de_domaine`. Un
	   domaine sans ligne fille rend une liste vide : la base ne porte pas le
	   plancher « 1 à N » de RG-STR-06, et supposer un module par défaut serait le
	   combler ici, au mauvais endroit. */
	const detail: Record<string, DetailDeDomaine> = {};
	for (const ligne of lisibles) {
		detail[ligne.nom] = {
			description: ligne.description,
			modules: modulesParDomaine.get(ligne.nom) ?? []
		};
	}

	const tousLesUnivers = await lireUnivers(base);
	return {
		univers: tousLesUnivers.filter((u) => lisibles.some((l) => l.universNom === u.nom)),
		domaines: lisibles.map(
			(l) => ({ nom: l.nom, univers: l.universNom, couleur: l.couleur }) as Domaine
		),
		detailDomaines: detail as Record<NomDeDomaine, DetailDeDomaine>
	};
}

/**
 * L'ENTRÉE « DOSSIERS » N'EST OFFERTE QUE SI SA DESTINATION S'OUVRE. Elle mène à
 * la RACINE du rangement, qui se lit avec un droit propre : un lecteur qui n'en
 * tient un que sur un SOUS-dossier voit la page du domaine — `domaineLisible()`
 * se contente d'UN dossier lisible — mais la racine lui reste fermée, et la
 * tuile menait en 404 (`P-03`, `P-09`).
 *
 * Le module reste ACTIF en base : un droit posé plus tard sur la racine remet
 * l'entrée à l'écran sans autre geste.
 */
function sansLEntreeDesDossiers(
	detail: Record<NomDeDomaine, DetailDeDomaine>,
	nom: NomDeDomaine
): Record<NomDeDomaine, DetailDeDomaine> {
	const courant = detail[nom];
	if (courant === undefined) return detail;
	return {
		...detail,
		[nom]: { ...courant, modules: courant.modules.filter((m) => m !== 'dossiers') }
	};
}

const MILLISECONDES_PAR_JOUR = 86_400_000;
const MILLISECONDES_PAR_HEURE = 3_600_000;

/**
 * LES DEUX FENÊTRES QUE LE SÉLECTEUR DE « NOTES LES PLUS CONSULTÉES » ANNONCE.
 * Le panneau porte son unité à l'écran ; la mesure servie doit être celle-là, et
 * pas une autre. Toute autre valeur d'adresse retombe sur la première.
 */
const FENETRES_DE_CONSULTATION = [7, 30] as const;

/** Le filtre du fil d'activité — les quatre positions du sélecteur. */
const FILTRES_DACTIVITE = ['tous', 'verification', 'note', 'vivacite', 'import'] as const;
type FiltreDActivite = (typeof FILTRES_DACTIVITE)[number];

/**
 * UN ÉVÉNEMENT DU FIL — la forme que la vue rend, et rien de plus. Le GENRE est
 * une donnée ; le titre, le badge et la couleur du disque sont du dessin, et se
 * décident dans la vue.
 */
interface EvenementDuDomaine {
	readonly genre: 'verification' | 'modification' | 'creation' | 'echeance' | 'import';
	/** Ce sur quoi l'événement porte — le titre de la note, ou la source du lot. */
	readonly objet: string;
	/** L'identifiant de la note visée, ou `null` : un lot d'import n'en vise aucune. */
	readonly note: string | null;
	/** Qui l'a fait. Vide pour une bascule automatique : personne ne l'a faite. */
	readonly par: string;
	/** Ancienneté, en heures. */
	readonly heures: number;
}

/**
 * LES CONSULTATIONS DE LA FENÊTRE, PAR NOTE.
 * `notes.compteur_de_consultations` est un CUMUL de toute la vie de la note ; la
 * série datée est le journal `consultations`, compté par le serveur — ramener les
 * lignes pour les compter ici serait le motif qu'`ADR-006` interdit.
 *
 * Le filtre de périmètre est DANS la requête, et un périmètre vide n'interroge pas
 * la base : un ensemble vide passé à une clause d'appartenance ne se rend pas de
 * la même façon selon le dialecte.
 *
 * UNE NOTE SANS AUCUNE CONSULTATION N'A PAS DE CLÉ : la vue lit une table
 * PARTIELLE et rend zéro pour ce qu'elle n'y trouve pas.
 */
async function lireLesConsultations(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date,
	fenetreEnJours: number
): Promise<Partial<Record<IdentifiantNote, number>>> {
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return {};
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);
	const depuis = new Date(maintenant.getTime() - fenetreEnJours * MILLISECONDES_PAR_JOUR);

	const lignes = await base
		.select({
			identifiant: tableDesNotes.identifiant,
			nombre: sql<number>`count(${consultations.id})::int`
		})
		.from(consultations)
		.innerJoin(tableDesNotes, eq(consultations.noteId, tableDesNotes.id))
		.where(and(gte(consultations.le, depuis), filtre))
		.groupBy(tableDesNotes.identifiant);

	const table: Record<string, number> = {};
	for (const ligne of lignes) table[ligne.identifiant] = ligne.nombre;
	return table as Partial<Record<IdentifiantNote, number>>;
}

/** La projection minimale d'une note pour la vivacité, plus son titre et sa date de création. */
interface LigneDeNoteDuDomaine extends LigneDeCycles {
	readonly identifiant: string;
	readonly titre: string;
	readonly creeLe: Date;
	readonly auteur: string;
}

/**
 * LES NOTES DU DOMAINE, avec les colonnes du cycle. Le filtre de périmètre est
 * dans la requête (`ADR-006`), et le domaine y est aussi : la page ne mesure que
 * ce qu'elle montre.
 */
async function lireLesNotesDuDomaine(
	base: Base,
	acces: AccesAuRangement,
	domaineId: string
): Promise<readonly LigneDeNoteDuDomaine[]> {
	const demandeur = alias(comptes, 'demandeur_de_revision');
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: tableDesNotes.identifiant,
			titre: tableDesNotes.titre,
			creeLe: tableDesNotes.creeLe,
			auteur: comptes.nom,
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
		.where(and(eq(tableDesNotes.domaineId, domaineId), filtre))
		.orderBy(tableDesNotes.identifiant);

	/* LES DEUX NOMS DE VÉRIFICATEUR NE SONT PAS LUS : ils ne nourrissent que la
	   ligne « Vérifiée le … par … » d'une note, que cette page n'affiche pas. Le
	   contrat de `LigneDeCycles` les exige, et l'état vide explicite est `null`. */
	return lignes.map((l) => ({
		...l,
		verifieParReference: null,
		verifieParOperationnel: null
	}));
}

/**
 * L'ÉTAT DE VIVACITÉ DU REGISTRE RÉFÉRENCE, PAR NOTE. Rien n'est calculé ici : le
 * cycle vient de `cycleDuRegistre()`, l'état de `vivacite()`. La Référence est le
 * registre canonique — le seul qu'une note porte toujours (`RG-NOT-02`) —, donc le
 * seul sur lequel une répartition de domaine puisse se dire.
 */
function etatsDeVivacite(
	lignes: readonly LigneDeNoteDuDomaine[],
	maintenant: Date,
	seuils: SeuilsDeVivacite
): Partial<Record<IdentifiantNote, EtatDeVivacite>> {
	const table: Record<string, EtatDeVivacite> = {};
	for (const ligne of lignes) {
		const cycle = cycleDuRegistre(ligne, 'reference');
		if (cycle === null) continue;
		table[ligne.identifiant] = vivacite(cycle, maintenant, seuils).etat;
	}
	return table as Partial<Record<IdentifiantNote, EtatDeVivacite>>;
}

/**
 * LE FIL D'ACTIVITÉ DU DOMAINE. Quatre traces écrites — vérification, version,
 * création, lot d'import — et une bascule DÉRIVÉE : « Échéance atteinte » n'a
 * aucune ligne en base, et n'en aura pas (voir `basculesDUnCycle`).
 *
 * AUCUNE FENÊTRE DE TEMPS. Le panneau montre les derniers événements, pas ceux de
 * la semaine : sur un domaine calme, une fenêtre de sept jours ne rendait rien
 * alors que l'histoire du domaine existe.
 */
async function lireLActiviteDuDomaine(
	base: Base,
	acces: AccesAuRangement,
	domaineId: string,
	notesDuDomaine: readonly LigneDeNoteDuDomaine[],
	maintenant: Date,
	seuils: SeuilsDeVivacite
): Promise<readonly EvenementDuDomaine[]> {
	const titres = new Map(notesDuDomaine.map((n) => [n.identifiant, n.titre]));
	const depuis = (le: Date): number =>
		Math.max(0, Math.floor((maintenant.getTime() - le.getTime()) / MILLISECONDES_PAR_HEURE));

	/* LE PÉRIMÈTRE EST DANS LA REQUÊTE (`ADR-006`). Une note rangée dans un dossier
	   que l'appelant ne lit pas n'a pas à paraître au fil, ne serait-ce que par son
	   titre : le domaine est lisible, ses dossiers ne le sont pas tous. */
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const lisibles = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);

	const verifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: verifications.le })
		.from(verifications)
		.innerJoin(tableDesNotes, eq(verifications.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(and(eq(tableDesNotes.domaineId, domaineId), lisibles))
		.orderBy(desc(verifications.le))
		.limit(20);

	const modifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: versions.le })
		.from(versions)
		.innerJoin(tableDesNotes, eq(versions.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(and(eq(tableDesNotes.domaineId, domaineId), lisibles))
		.orderBy(desc(versions.le))
		.limit(20);

	/* UN LOT D'IMPORT NE VISE AUCUNE NOTE : il en vise douze, et son objet est la
	   source déposée. Une SIMULATION n'écrit rien (`RG-M12-02`), un lot refusé en
	   bloc non plus : les annoncer ferait chercher des notes qui n'existent pas. */
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
		.where(and(eq(lotsDImport.domaineId, domaineId), eq(lotsDImport.simulation, false)))
		.orderBy(desc(lotsDImport.le))
		.limit(10);

	/* La bascule la plus récente de chaque note — « Échéance atteinte », « Passage
	   à À revoir », « Passage à Obsolète ». Dérivée, jamais stockée. */
	const bascules: EvenementDuDomaine[] = [];
	for (const ligne of notesDuDomaine) {
		const cycle = cycleDuRegistre(ligne, 'reference');
		if (cycle === null) continue;
		const suite = basculesDUnCycle(cycle, 'reference', maintenant, seuils);
		const derniere = suite[suite.length - 1];
		if (derniere === undefined) continue;
		bascules.push({
			genre: 'echeance',
			objet: ligne.titre,
			note: ligne.identifiant,
			par: '',
			heures: depuis(derniere.le)
		});
	}

	const evenements: EvenementDuDomaine[] = [
		...verifiees.map((l) => ({
			genre: 'verification' as const,
			objet: titres.get(l.cible) ?? l.cible,
			note: l.cible,
			par: l.qui,
			heures: depuis(l.le)
		})),
		...modifiees.map((l) => ({
			genre: 'modification' as const,
			objet: titres.get(l.cible) ?? l.cible,
			note: l.cible,
			par: l.qui,
			heures: depuis(l.le)
		})),
		...notesDuDomaine.map((n) => ({
			genre: 'creation' as const,
			objet: n.titre,
			note: n.identifiant,
			par: n.auteur,
			heures: depuis(n.creeLe)
		})),
		...lots
			.filter((l) => l.notesCreees + l.notesMisesAJour > 0)
			.map((l) => {
				const ecrites = l.notesCreees + l.notesMisesAJour;
				return {
					genre: 'import' as const,
					objet: `${String(ecrites)} ${accord(ecrites, 'note reprise', 'notes reprises')} depuis ${l.source}`,
					note: null,
					par: l.qui,
					heures: depuis(l.le)
				};
			}),
		...bascules
	];

	/* Du plus récent au plus ancien. À égalité, l'objet départage : sans lui,
	   l'ordre dépendrait de celui que le serveur a rendu, donc du plan de requête. */
	return evenements.sort((a, b) => a.heures - b.heures || a.objet.localeCompare(b.objet, 'fr'));
}

/** Le genre que chaque position du sélecteur retient. `tous` ne filtre rien. */
const GENRES_PAR_FILTRE: Readonly<Record<FiltreDActivite, readonly EvenementDuDomaine['genre'][]>> =
	{
		tous: [],
		verification: ['verification'],
		note: ['modification', 'creation'],
		vivacite: ['echeance'],
		import: ['import']
	};

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const resolution = resoudre(domaine, (trouve) => domaineLisible(acces, trouve.id));
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	const siens = dossiersDuDomaine(acces, resolution.ressource.id);
	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);

	/* L'état « sans note » de la page, décidé sur les notes RÉELLEMENT lisibles de
	   ce domaine — l'état vide de `RG-M18-03`. */
	const aDesNotes = notes.some((n) => n.domaine === resolution.ressource.nom);

	/* La racine est exclue : elle porte le nom du domaine et n'apparaît dans aucun
	   chemin affiché. */
	const nombreDeDossiers = siens.filter(
		(d) => d.profondeur > 1 && capacites(droitEffectif(acces, d.id)).lire
	).length;

	const rangement = await lireLeRangementLisible(base, acces);

	/* LA RACINE SE LIT AVEC SON PROPRE DROIT, et c'est la seule destination de
	   l'entrée « Dossiers ». Sans lecture sur elle, l'entrée est retirée plutôt que
	   rendue vers un refus. */
	const racineDuRangement = siens.find((d) => d.parentId === null) ?? null;
	const racineLisible =
		racineDuRangement !== null && capacites(droitEffectif(acces, racineDuRangement.id)).lire;
	const detailDomaines = racineLisible
		? rangement.detailDomaines
		: sansLEntreeDesDossiers(rangement.detailDomaines, resolution.ressource.nom);

	/* LES DEUX SÉLECTEURS DE LA PAGE SONT DES ADRESSES. Une valeur hors table
	   retombe sur la première position — un paramètre bricolé ne change pas ce que
	   le panneau annonce. */
	const demandee = Number(url.searchParams.get('vues'));
	const fenetreDeConsultation =
		FENETRES_DE_CONSULTATION.find((f) => f === demandee) ?? FENETRES_DE_CONSULTATION[0];
	const filtreDemande = url.searchParams.get('evenements') ?? '';
	const filtreDActivite: FiltreDActivite =
		FILTRES_DACTIVITE.find((f) => f === filtreDemande) ?? 'tous';

	/**
	 * LES ADRESSES DU DOMAINE, COMPOSÉES SUR LES IDENTIFIANTS PERSISTÉS.
	 *
	 * `adressesParLesNoms()` repasse ses arguments par `identifiantLisible()`, qui
	 * n'est PAS idempotente : la console garde `audit_code` tel quel — un nom qui
	 * est déjà une adresse reste l'adresse —, et la refaire passer par la
	 * dérivation rend `audit-code`. Les quatre sorties de cette page rendaient donc
	 * 404 sur tout domaine dont le nom porte un souligné.
	 *
	 * Les segments sont posés ici, sur `domaines.identifiant` et
	 * `univers.identifiant`, que `RG-M12-11` dit stables sous les renommages.
	 */
	const racine = `/univers/${resolution.ressource.universIdentifiant}/${resolution.ressource.identifiant}`;

	/* L'ENTRÉE « DOSSIERS » VISE LA FORME NOMMÉE DE LA RACINE, jamais l'adresse
	   nue : celle-ci redirige (308) vers une adresse recomposée sur les noms, où
	   le souligné se perd une seconde fois. Viser directement la forme canonique
	   épargne le détour ET son défaut. */
	const adresseDesDossiers =
		racineDuRangement === null
			? `${racine}/dossiers`
			: `${racine}/dossiers/${identifiantLisible(racineDuRangement.nom)}`;

	const seuils = await lireSeuilsDeVivacite(base);
	const lignesDuDomaine = await lireLesNotesDuDomaine(base, acces, resolution.ressource.id);
	const activite = await lireLActiviteDuDomaine(
		base,
		acces,
		resolution.ressource.id,
		lignesDuDomaine,
		maintenant,
		seuils
	);
	const retenus = GENRES_PAR_FILTRE[filtreDActivite];

	return {
		vecteur: {
			/* `dom` porte le NOM : ce que la vue cherche dans les domaines qu'elle reçoit. */
			dom: resolution.ressource.nom,
			role: acces.perimetre.tout
				? 'admin'
				: peutEcrireDansLUn(
							acces,
							siens.map((d) => d.id)
					  )
					? 'referent'
					: 'lecteur',
			etat: aDesNotes ? 'peuple' : 'vide'
		},
		notes,
		univers: rangement.univers,
		domaines: rangement.domaines,
		detailDomaines,
		nombreDeDossiers,
		adressesDuDomaine: {
			domaine: racine,
			notes: `${racine}/notes`,
			/* Les fiches sont les notes de type « Fiche » : la liste de V-12 sait
			   retenir cette facette, et le compteur de la tuile les compte ainsi. */
			fiches: `${racine}/notes?type=Fiche`,
			dossiers: adresseDesDossiers,
			signets: `${racine}/signets`
		},
		vivacites: etatsDeVivacite(lignesDuDomaine, maintenant, seuils),
		/* LE SEUIL QUE L'ALERTE ANNONCE — celui de la console, jamais la constante
		   du module : « dans les 10 prochains jours » doit dire le réglage réel. */
		seuilBientot: seuils.bientot,
		mesures: await lireLesConsultations(base, acces, maintenant, fenetreDeConsultation),
		fenetreDeConsultation,
		filtreDActivite,
		/* LE FIL COMPLET DÉCIDE DE « DERNIÈRE ACTIVITÉ », le fil FILTRÉ décide de ce
		   que le panneau montre : filtrer sur « Imports » ne doit pas faire vieillir
		   le domaine dans le bandeau. */
		derniereActiviteHeures: activite[0]?.heures ?? null,
		activite: (retenus.length === 0
			? activite
			: activite.filter((e) => retenus.includes(e.genre))
		).slice(0, 6)
	};
};
