/**
 * LE CHARGEUR DE `/univers/{univers}` — V-10. « Connecté (AU MOINS UN DOMAINE LISIBLE) » :
 * la session vient de `src/hooks.server.ts`, « lisible » de `resolution.ts`, et les deux
 * refus passent par le même point de sortie (`ADR-007`). `univers` et `domaines` sont
 * réduits à ce qui porte au moins un domaine lisible : une carte de domaine mène à une
 * page atteignable (`P-03`). `modules`, `compte` et `instance` ne sont pas passés.
 *
 * L'ACTIVITÉ NE S'INVENTE PAS (`P-02`) : la base porte trois des cinq types de
 * `TypeDEvenement`, chacun par une trace horodatée et signée — `verification`, `edition`
 * et `revision`. LES DEUX AUTRES, `publication` et `import`, N'ONT AUCUNE TRACE et ne
 * sont JAMAIS ÉMIS. LA FENÊTRE EST DE SEPT JOURS, ET ELLE EST LUE DANS LE GEL : la zone
 * annonce elle-même son absence par « Rien de neuf CETTE SEMAINE ».
 *
 * UN ÉVÉNEMENT SANS AUTEUR CONNU N'EST PAS RENDU : les trois jointures sur `comptes` sont
 * INTERNES, une ligne de flux s'écrivant « QUI a fait QUOI ».
 */
import { basePartagee } from '$lib/base/acces';
import type { Base } from '$lib/base/acces';
import {
	comptes,
	domaines as tableDesDomaines,
	notes as tableDesNotes,
	univers as tableDesUnivers,
	verifications,
	versions
} from '$lib/base/schema';
import { resoudre } from '$lib/droits/resolution';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireDomainesDeLUnivers,
	lireNotesLisibles,
	lireUniversParIdentifiant,
	ouvrirLAcces,
	peutEcrireDansLUn,
	refuserLAdresse,
	type AccesAuRangement
} from '$lib/donnees/rangement';
import { lireModulesParDomaine, lireUnivers } from '$lib/donnees/lecture';
import { accesALaConsole } from '$lib/donnees/consoles';
import { and, eq, gte, inArray } from 'drizzle-orm';
import type {
	DetailDeDomaine,
	Domaine,
	EvenementDActivite,
	NomDeDomaine,
	Univers
} from '../../../../seeds/corpus';
import type { PageServerLoad } from './$types';

interface RangementLisible {
	readonly univers: readonly Univers[];
	readonly domaines: readonly Domaine[];
	readonly detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
}

/**
 * LE RANGEMENT RÉDUIT À CE QUI EST LISIBLE — et la réduction est un refus de
 * porte fermée, pas une précaution.
 *
 * `P-03` : « une entrée visible est une entrée qui fonctionne ». La carte d'un
 * domaine sur lequel l'appelant n'a aucun droit mènerait à une adresse que cette
 * même route refuse — un lien mort, et un nom de domaine divulgué que `RG-ACC-01`
 * n'autorise pas davantage.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : `domaineLisible()` interroge
 * `capacites()`, l'implémentation unique.
 *
 * CE CODE EST LE MÊME DANS LE CHARGEUR VOISIN, et la duplication est SUBIE :
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

const MILLISECONDES_PAR_JOUR = 86_400_000;
const MILLISECONDES_PAR_HEURE = 3_600_000;
/** La semaine que la zone d'activité annonce elle-même quand elle est vide. */
const FENETRE_DACTIVITE_JOURS = 7;

/**
 * L'ACTIVITÉ DE LA SEMAINE, LUE DANS LES TROIS TRACES QUI EXISTENT.
 *
 * Le filtre de périmètre est DANS la requête, jamais après elle (`ADR-006`). Un
 * périmètre vide n'interroge pas la base : un ensemble vide passé à une clause
 * d'appartenance ne se rend pas de la même façon selon le dialecte.
 */
async function lireLActiviteRecente(
	base: Base,
	acces: AccesAuRangement,
	maintenant: Date
): Promise<readonly EvenementDActivite[]> {
	const autorises = acces.perimetre.tout ? null : [...acces.perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];
	const filtre = autorises === null ? undefined : inArray(tableDesNotes.dossierId, autorises);
	const depuis = new Date(maintenant.getTime() - FENETRE_DACTIVITE_JOURS * MILLISECONDES_PAR_JOUR);

	const verifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: verifications.le })
		.from(verifications)
		.innerJoin(tableDesNotes, eq(verifications.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(and(gte(verifications.le, depuis), filtre));

	const modifiees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: versions.le })
		.from(versions)
		.innerJoin(tableDesNotes, eq(versions.noteId, tableDesNotes.id))
		.innerJoin(comptes, eq(versions.auteurId, comptes.id))
		.where(and(gte(versions.le, depuis), filtre));

	const signalees = await base
		.select({ cible: tableDesNotes.identifiant, qui: comptes.nom, le: tableDesNotes.revisionLe })
		.from(tableDesNotes)
		.innerJoin(comptes, eq(tableDesNotes.revisionParId, comptes.id))
		.where(
			and(eq(tableDesNotes.revisionDemandee, true), gte(tableDesNotes.revisionLe, depuis), filtre)
		);

	function evenement(
		type: EvenementDActivite['type'],
		ligne: { cible: string; qui: string; le: Date | null }
	): EvenementDActivite | null {
		if (ligne.le === null) return null;
		return {
			type,
			qui: ligne.qui,
			cible: ligne.cible,
			heures: Math.floor((maintenant.getTime() - ligne.le.getTime()) / MILLISECONDES_PAR_HEURE)
		} as EvenementDActivite;
	}

	const evenements = [
		...verifiees.map((l) => evenement('verification', l)),
		...modifiees.map((l) => evenement('edition', l)),
		...signalees.map((l) => evenement('revision', l))
	].filter((e): e is EvenementDActivite => e !== null);

	/* Du plus récent au plus ancien — l'ordre du gel, où `heures` croît le long
	   de la liste. À égalité, l'identifiant de note départage : sans lui, l'ordre
	   dépendrait de celui que le serveur a rendu, donc du plan de requête. */
	return evenements.sort(
		(a, b) => a.heures - b.heures || (a.cible ?? '').localeCompare(b.cible ?? '', 'fr')
	);
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);

	const univers = await lireUniversParIdentifiant(base, params.univers);
	const domainesDeLUnivers = univers === null ? [] : await lireDomainesDeLUnivers(base, univers.id);
	const lisibles = domainesDeLUnivers.filter((d) => domaineLisible(acces, d.id));

	/**
	 * UN UNIVERS SANS AUCUN DOMAINE S'OUVRE, et rend l'état vide du gel. Il rendait
	 * 404 : on crée un univers en premier sur une instance neuve, et aucun chemin
	 * ne l'ouvrait ensuite.
	 *
	 * Les deux refus ne bougent pas — univers absent, ou univers dont aucun domaine
	 * n'est lisible : 404 par le même point de sortie (`ADR-007`). Seul s'ouvre
	 * celui qui ne porte rien, où il n'y a aucun contenu à protéger.
	 */
	const vide = univers !== null && domainesDeLUnivers.length === 0;
	const ouvrable = locals.identite.type === 'authentifie' && vide;
	const resolution = resoudre(univers, () => lisibles.length > 0 || ouvrable);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	/* Les dossiers des seuls domaines lisibles : c'est sur eux que se lit la
	   capacité d'écriture, jamais sur l'univers entier. */
	const dossiersLisibles = lisibles.flatMap((d) =>
		dossiersDuDomaine(acces, d.id).map((ligne) => ligne.id)
	);

	const rangement = await lireLeRangementLisible(base, acces);

	/* L'univers ouvert doit être dans la liste passée à la vue, même vide :
	   `lireLeRangementLisible()` ne garde que ceux qui portent un domaine lisible,
	   et `V-10.svelte:163` lit `univers[0].nom` — sur une liste vide, c'est un 500.
	   On n'ajoute que celui que l'adresse nomme déjà : la liste complète révélerait
	   les autres. */
	const universOuvert = rangement.univers.some((u) => u.nom === resolution.ressource.nom)
		? rangement.univers
		: [
				...rangement.univers,
				...(await lireUnivers(base)).filter((u) => u.nom === resolution.ressource.nom)
			];

	return {
		/* `uni` porte le NOM, non l'identifiant d'adresse : c'est ce que l'axe
		   « Univers » de la planche emploie (`verif/scenarios/V-10.json`, valeurs
		   `Production` et `Projets`), et ce que la vue cherche dans les univers
		   qu'elle reçoit.

		   `etat` vaut « vide » quand l'univers ne porte aucun domaine ; hors de ce
		   cas il n'est pas posé et vaut « nominal ». */
		vecteur: {
			uni: resolution.ressource.nom,
			/* Sur un univers vide, c'est l'accès à la console qui décide :
			   `peutEcrireDansLUn()` interroge les dossiers, il n'y en a aucun, et le
			   bouton « Créer un domaine » resterait caché à l'administrateur. Un
			   domaine ne se crée qu'à la console — même prédicat que la destination. */
			droits: (vide ? accesALaConsole(locals.identite) : peutEcrireDansLUn(acces, dossiersLisibles))
				? 'ecriture'
				: 'lecture',
			...(vide ? { etat: 'vide' } : {})
		},
		notes: await lireNotesLisibles(base, acces.perimetre, acces.contexte),
		univers: universOuvert,
		domaines: rangement.domaines,
		detailDomaines: rangement.detailDomaines,
		activite: await lireLActiviteRecente(base, acces, maintenant)
	};
};
