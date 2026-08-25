/**
 * LE CHARGEUR DE `/univers/{univers}/{domaine}` — V-11, page d'un domaine.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA FORME CANONIQUE, ET ELLE SEULE
 *
 * `docs/routes.md:125` : « **Forme canonique** au sens de RG-M03-02, et **seule
 * forme** publiée depuis ARB-001 ». La forme raccourcie n'existe pas, et la
 * clause de désambiguïsation de `RG-M03-02` est sans objet (`E-09`) : rien ici
 * ne peut la déclencher, et rien n'a à l'implémenter.
 *
 * `RG-STR-02` — l'unicité d'un domaine n'est portée QUE par son univers. Le
 * couple est donc résolu ENSEMBLE, par une seule requête jointe : chercher le
 * domaine d'abord puis vérifier son univers rendrait la mauvaise ligne dans le
 * cas même que la règle prévoit — deux univers ayant chacun un domaine de même
 * identifiant.
 *
 * Niveau d'accès, `docs/routes.md:125` : « connecté + lecteur ». Le droit vient
 * de `src/lib/droits/resolution.ts`, par `capacites()` ; aucune règle de droit
 * n'est écrite ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS POSITIONS DE L'AXE « PROFIL », ET D'OÙ ELLES VIENNENT
 *
 * La planche a trois positions — `referent`, `admin`, `lecteur`
 * (`verif/scenarios/V-11.json`) — là où le produit a quatre rôles (`ARB-036`) et
 * trois droits de dossier. La correspondance n'est pas devinée : elle est lue
 * dans ce que la VUE fait de cette valeur, et elle ne fait que deux choses —
 * `ecriture = profil !== 'lecteur'` et `admin = profil === 'admin'`. Les deux
 * questions ont déjà une réponse autorisée dans le dépôt :
 *
 *   `admin`    — `perimetreDeLecture()` rend le périmètre TOTAL au seul
 *                administrateur (`RG-DRO-03`, et `resolution.ts` l'écrit :
 *                « `tout` est réservé à l'administrateur »). La route lit donc
 *                le périmètre, et ne compare aucun rôle elle-même.
 *   `ecriture` — la colonne « créer et modifier des notes » de la table de
 *                CDC §2.3, c'est-à-dire `capacites(droit).ecrireDesNotes`.
 *
 * C'est une DÉDUCTION à partir de deux sources citées, non une décision
 * fonctionnelle : la planche n'invente pas un quatrième rôle, elle présente
 * trois combinaisons de ces deux réponses.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA VUE REÇOIT DÉSORMAIS — SIX TABLEAUX DE BORD BRANCHÉS
 *
 * `T-041` avait rendu les neuf sources de V-11 PASSABLES sans rien passer. La
 * page rendait donc la santé et les compteurs sur les notes RÉELLES, mais la
 * description du domaine, ses modules, son palmarès et sa corbeille de révisions
 * sortaient encore de `seeds/corpus.ts` : une note créée à l'instant ne pouvait
 * PAS apparaître dans « Notes récemment modifiées », puisque son identifiant
 * n'était dans aucune des deux tables de mesure du jeu de semence.
 *
 *   `univers`, `domaines`   le rangement lisible, comme sur V-10 ;
 *   `detailDomaines`        description de `domaines` + `modules_de_domaine`.
 *                           C'est ce qui rend `P-04` EFFECTIVE sur la section
 *                           « Accès » : elle coïncidait avec la table sans en
 *                           être pilotée (mesuré par `T-032`) ;
 *   `nombreDeDossiers`      la table `dossiers`, racine exclue — voir plus bas ;
 *   `mesures7j`             le journal `consultations` (migration 006), fenêtre
 *                           de sept jours, exactement l'unité que le panneau
 *                           annonce ;
 *   `modifications`         `Note.jours`, DÉJÀ porté par les notes reçues :
 *                           `noteDepuisLigne()` l'écrit comme le nombre de jours
 *                           écoulés depuis `modifie_le`. Aucune seconde lecture,
 *                           donc aucune seconde définition — la table du jeu de
 *                           semence porte les mêmes valeurs, ce qui se vérifie
 *                           note à note ;
 *   `revisions`             `notes.revision_*` — le signalement de RG-M06-05 est
 *                           porté par la note, comme CDC §3.2 l'écrit.
 *
 * NE SONT TOUJOURS PAS PASSÉS, déclarés plutôt que comblés : `modules` — le
 * catalogue des six libellés, une nomenclature qu'aucune table ne porte —,
 * `compte` et `instance`, qui appartiennent à la COQUILLE et sont servis de la
 * même façon aux 41 vues.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE COMPTEUR DE DOSSIERS NE SE DÉDUIT PAS DU RANGEMENT DES NOTES
 *
 * La vue déduisait son arborescence des chemins portés par les notes : un
 * dossier VIDE n'y comptait pas. Mesuré sur le corpus — `Infrastructure` porte
 * sept dossiers sous sa racine et la page en affichait six. L'entrée « Dossiers »
 * de la section « Accès » annonce ce que le module contient ; elle est donc lue
 * dans la table `dossiers`, racine exclue, et réduite aux dossiers que
 * l'appelant peut lire — un compteur qui inclurait l'inatteignable serait la
 * porte fermée de `P-09` sous forme de chiffre.
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

/** Le rangement que l'appelant peut atteindre — univers, domaines, détail. */
interface RangementLisible {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	readonly detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
}

/**
 * LE RANGEMENT RÉDUIT À CE QUI EST LISIBLE.
 *
 * `P-03` : « une entrée visible est une entrée qui fonctionne ». Un domaine sur
 * lequel l'appelant n'a aucun droit mène à une adresse que cette même route
 * refuse.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : `domaineLisible()` interroge
 * `capacites()`, l'implémentation unique.
 *
 * CE CODE EST LE MÊME DANS LE CHARGEUR PARENT, `../+page.server.ts`, et la
 * duplication est SUBIE : `+page.server.ts` n'admet que les exports que
 * SvelteKit valide, et un module partagé demanderait un fichier hors du
 * périmètre de ce lot. Les deux copies appellent les mêmes fonctions de lecture.
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
	   domaine sans aucune ligne fille rend une liste vide : la base ne porte pas
	   le plancher « 1 à N » de RG-STR-06 (déclaré par `002_socle.montee.sql`), et
	   supposer un module par défaut serait le combler ici, au mauvais endroit. */
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
 * L'ENTRÉE « DOSSIERS » N'EST OFFERTE QUE SI SA DESTINATION S'OUVRE.
 *
 * Elle mène à la RACINE du rangement, et à elle seule — voir `cablage.ts`, où
 * elle est la seule des six à composer une adresse de dossier. Or la racine se
 * lit avec un droit qui lui est propre : un lecteur qui n'en tient un que sur un
 * SOUS-dossier voit bien la page du domaine — `domaineLisible()` se contente
 * d'UN dossier lisible, n'importe lequel — mais la racine lui reste fermée, et
 * la pastille menait alors en 404.
 *
 * `P-03`, « une entrée visible est une entrée qui fonctionne », et `P-09`,
 * l'action interdite n'est ni grisée ni masquée mais ABSENTE du DOM : l'entrée
 * est retirée du détail servi à la vue, du même mouvement que le compteur de
 * dossiers exclut plus bas ce que l'appelant ne peut pas atteindre. Les cinq
 * autres entrées ne dépendent que de la lisibilité du domaine, déjà acquise.
 *
 * Le module reste ACTIF en base — rien n'est écrit ici : un droit posé plus tard
 * sur la racine remet l'entrée à l'écran sans autre geste.
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
 *
 * `notes.compteur_de_consultations` est un CUMUL de toute la vie de la note —
 * c'est `Note.vues`, et ce n'est pas ce que ce panneau demande. La série datée
 * est le journal `consultations` de la migration 006, et le compte est fait par
 * le serveur : ramener les lignes pour les compter ici serait le motif
 * qu'`ADR-006` interdit.
 *
 * Le filtre de périmètre est DANS la requête. Un périmètre vide n'interroge pas
 * la base — même raison que `lireNotesLisibles()`, un ensemble vide passé à une
 * clause d'appartenance ne se rend pas de la même façon selon le dialecte.
 *
 * UNE NOTE SANS AUCUNE CONSULTATION N'A PAS DE CLÉ, et c'est voulu : la vue lit
 * une table PARTIELLE et rend zéro pour ce qu'elle n'y trouve pas. Poser zéro
 * ici ne changerait rien à l'écran et ferait porter à la table une exhaustivité
 * qu'elle n'a pas.
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
 * LES DEMANDES DE RÉVISION OUVERTES — `notes.revision_*`.
 *
 * `RG-M06-05` : le signalement « à réviser » est porté par la NOTE, drapeau +
 * commentaire + demandeur + date, et `002_socle.montee.sql` le transcrit tel
 * quel. Il n'y a donc aucune table à chercher, et la contrainte
 * `notes_revision_coherente` garantit que le demandeur et la date sont présents
 * dès que le drapeau l'est : la jointure interne sur `comptes` ne peut retirer
 * qu'une demande dont le compte a été supprimé, cas où le « par » n'existe plus.
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
 * L'ANCIENNETÉ DE MODIFICATION, PAR NOTE — et elle ne se relit pas en base.
 *
 * CE N'EST PAS `Note.jours`, ET C'ÉTAIT L'ERREUR. `Note.jours` porte l'âge de la
 * VÉRIFICATION — `seeds/corpus.ts` le documente ainsi, et c'est lui qui rend le
 * libellé de fraîcheur cohérent avec sa jauge. L'écran de domaine, lui, écrit
 * « dernière modification il y a N jours » : deux grandeurs, deux dates, et les
 * confondre faisait dire à la page qu'une note vérifiée hier avait été modifiée
 * hier. Elle se lit donc à la source, sur `modifie_le`.
 *
 * Ce n'est pas une seconde définition de la fraîcheur — `P-01` ne s'applique
 * pas : ce n'est pas de la fraîcheur, c'est une ancienneté de modification, que
 * rien d'autre ne calcule.
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

	/* L'état « sans note » de la planche, décidé sur les notes RÉELLEMENT
	   lisibles de ce domaine — c'est l'état vide de `RG-M18-03`, et il n'est pas
	   simulé. La vue refait le même filtre sur la propriété `notes` qu'elle
	   reçoit (`src/vues/V-11.svelte`), de sorte que les deux ne peuvent pas se
	   contredire : elles lisent la même liste.

	   CE QU'IL NE GOUVERNE PLUS : L'ACCÈS AUX MODULES. Il ne pèse que sur les
	   quatre panneaux de MESURE, qui n'ont rien à mesurer sans note. La section
	   « Accès » et ses pastilles sont rendues quel que soit l'état — sans quoi un
	   domaine neuf n'offrait aucun chemin vers la racine de ses dossiers, et un
	   lecteur au périmètre étroit perdait les mêmes entrées sur un domaine
	   pourtant peuplé, faute d'y voir une seule note. */
	const aDesNotes = notes.some((n) => n.domaine === resolution.ressource.nom);

	/* La racine est exclue : elle porte le nom du domaine et n'apparaît dans
	   aucun chemin affiché (`lireCheminsDeDossier()`, `profondeur === 1`). */
	const nombreDeDossiers = siens.filter(
		(d) => d.profondeur > 1 && capacites(droitEffectif(acces, d.id)).lire
	).length;

	const rangement = await lireLeRangementLisible(base, acces);

	/* LA RACINE SE LIT AVEC SON PROPRE DROIT, et c'est la seule destination de
	   l'entrée « Dossiers ». Sans lecture sur elle, l'entrée est retirée plutôt
	   que rendue vers un refus. */
	const racineDuRangement = siens.find((d) => d.parentId === null) ?? null;
	const racineLisible =
		racineDuRangement !== null && capacites(droitEffectif(acces, racineDuRangement.id)).lire;
	const detailDomaines = racineLisible
		? rangement.detailDomaines
		: sansLEntreeDesDossiers(rangement.detailDomaines, resolution.ressource.nom);

	return {
		vecteur: {
			/* `dom` porte le NOM : c'est ce que l'axe « Domaine » de la planche
			   emploie, et ce que la vue cherche dans les domaines qu'elle reçoit. */
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
