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
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import {
	comptes,
	consultations,
	domaines as tableDesDomaines,
	notes as tableDesNotes,
	univers as tableDesUnivers
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
import {
	dateCourteDInstant,
	joursEcoules,
	lireModulesParDomaine,
	lireUnivers
} from '$lib/donnees/lecture';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import type {
	DemandeDeRevision,
	DetailDeDomaine,
	Domaine,
	IdentifiantNote,
	NomDeDomaine,
	Note,
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
 * pastille menait en 404 (`P-03`, `P-09`).
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
/** L'unité que le panneau « Notes les plus consultées » annonce lui-même. */
const FENETRE_DE_CONSULTATION_JOURS = 7;

/**
 * LES CONSULTATIONS DES SEPT DERNIERS JOURS, PAR NOTE.
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
async function lireLesConsultations7j(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return {};
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);
	const depuis = new Date(
		maintenant.getTime() - FENETRE_DE_CONSULTATION_JOURS * MILLISECONDES_PAR_JOUR
	);

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

/**
 * LES DEMANDES DE RÉVISION OUVERTES — `notes.revision_*`. `RG-M06-05` : le
 * signalement est porté par la NOTE. La contrainte `notes_revision_coherente`
 * garantit que le demandeur et la date sont présents dès que le drapeau l'est :
 * la jointure interne sur `comptes` ne peut retirer qu'une demande dont le compte
 * a été supprimé.
 */
async function lireLesRevisions(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date
): Promise<readonly DemandeDeRevision[]> {
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);

	const lignes = await base
		.select({
			identifiant: tableDesNotes.identifiant,
			par: comptes.nom,
			le: tableDesNotes.revisionLe,
			commentaire: tableDesNotes.revisionCommentaire
		})
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.revisionParId, comptes.id))
		.where(and(eq(tableDesNotes.revisionDemandee, true), filtre))
		.orderBy(tableDesNotes.identifiant);

	const demandes: DemandeDeRevision[] = [];
	for (const ligne of lignes) {
		if (ligne.le === null) continue;
		demandes.push({
			id: ligne.identifiant,
			par: ligne.par,
			le: dateCourteDInstant(ligne.le),
			jours: joursEcoules(ligne.le, maintenant),
			commentaire: ligne.commentaire ?? ''
		} as DemandeDeRevision);
	}
	return demandes;
}

/**
 * L'ANCIENNETÉ DE MODIFICATION, PAR NOTE. CE N'EST PAS `Note.jours`, qui porte
 * l'âge de la VÉRIFICATION : deux grandeurs, deux dates, et les confondre faisait
 * dire à la page qu'une note vérifiée hier avait été modifiée hier. Ce n'est pas
 * une seconde définition de la fraîcheur — `P-01` ne s'applique pas.
 */
async function ancienneteDeModification(
	base: Base,
	notes: readonly Note[],
	maintenant: Date
): Promise<Partial<Record<IdentifiantNote, number>>> {
	const identifiants = notes.map((n) => n.id as string);
	if (identifiants.length === 0) return {};
	const lignes = await base
		.select({ identifiant: tableDesNotes.identifiant, modifieLe: tableDesNotes.modifieLe })
		.from(tableDesNotes)
		.where(inArray(tableDesNotes.identifiant, identifiants));
	const table: Record<string, number> = {};
	for (const ligne of lignes) table[ligne.identifiant] = joursEcoules(ligne.modifieLe, maintenant);
	return table as Partial<Record<IdentifiantNote, number>>;
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const domaine = await lireDomaineParIdentifiants(base, params.univers, params.domaine);
	const resolution = resoudre(domaine, (trouve) => domaineLisible(acces, trouve.id));
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	const siens = dossiersDuDomaine(acces, resolution.ressource.id);
	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);

	/* L'état « sans note » de la planche, décidé sur les notes RÉELLEMENT lisibles
	   de ce domaine — l'état vide de `RG-M18-03`. La vue refait le même filtre sur
	   la propriété `notes`, de sorte que les deux ne peuvent pas se contredire.

	   IL NE GOUVERNE PAS L'ACCÈS AUX MODULES : il ne pèse que sur les panneaux de
	   MESURE, qui n'ont rien à mesurer sans note. La section « Accès » est rendue
	   quel que soit l'état — sans quoi un domaine neuf n'offrait aucun chemin vers
	   la racine de ses dossiers. */
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

	return {
		vecteur: {
			/* `dom` porte le NOM : ce que l'axe « Domaine » de la planche emploie, et
			   ce que la vue cherche dans les domaines qu'elle reçoit. */
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
		mesures7j: await lireLesConsultations7j(base, acces, maintenant),
		modifications: await ancienneteDeModification(base, notes, maintenant),
		revisions: await lireLesRevisions(base, acces, maintenant)
	};
};
