/**
 * `/console/analytique` — LE CHARGEUR de V-34, et le seul des onze qui pose un vecteur. LA
 * GARDE EST CELLE DES ONZE ADRESSES DE CONSOLE : `resoudreLaConsole()` la prend, une fois
 * pour toutes, et un non-administrateur reçoit 404 V-26 (`P-09`, `RG-ACC-04`). Le seul
 * `error(404, …)` est SANS MESSAGE (`ADR-007`).
 *
 * LES CINQ BLOCS SONT SERVIS DEPUIS LA BASE : les consultations (`006`), le journal de
 * recherche (`010`), les demandes de révision portées par `notes.revision_*`, et
 * l'ancienneté de modification lue sur `notes.modifie_le`. LES TROIS ENTRÉES V-34 DU
 * RECENSEMENT ONT ÉTÉ RETIRÉES en conséquence : deux d'entre elles étaient FAUSSES — les
 * colonnes de révision existent depuis `002` et sont lues en quatre endroits, et la
 * maquette ne demande pas un compte de modifications mais une ancienneté en jours.
 *
 * `P-02` GARDE SON POINT D'APPUI : `vecteurDeV34()` DÉRIVE l'état du recensement plutôt que
 * de l'écrire. Le jour où une mesure disparaîtrait, son entrée y reviendrait et l'écran se
 * tairait de nouveau, sans qu'une ligne de cette route change (`P-26`).
 */
import { error } from '@sveltejs/kit';
import { and, count, eq, gte, lt } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { consultations, notes } from '$lib/base/schema';
import {
	contexteDeRequete,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole,
	vecteurDeV34
} from '$lib/donnees/consoles';
import {
	ancienneteDeModification,
	lireRelations,
	lireToutesLesDemandesDeRevision
} from '$lib/donnees/lecture';
import { lireLesRecherches } from '$lib/donnees/recherches';
import { lireLesTracesDeSuppression } from '$lib/donnees/traces';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

/**
 * LES CONSULTATIONS D'UNE FENÊTRE, PAR NOTE — la table montée par `006`. Les deux entrées
 * correspondantes ont été retirées du recensement des lacunes : un registre qui ment
 * dispense d'aller voir.
 */
async function consultationsParNote(
	base: Base,
	depuis: Date,
	avant: Date
): Promise<Record<string, number>> {
	const lignes = await base
		.select({ identifiant: notes.identifiant, n: count() })
		.from(consultations)
		.innerJoin(notes, eq(notes.id, consultations.noteId))
		.where(and(gte(consultations.le, depuis), lt(consultations.le, avant)))
		.groupBy(notes.identifiant);
	return Object.fromEntries(lignes.map((l) => [l.identifiant, Number(l.n)]));
}

/**
 * COMBIEN DE DESTRUCTIONS L'ÉCRAN MONTRE. Le bloc rend compte des gestes récents ; la
 * table les garde tous. Un plafond parce qu'une console qui charge dix ans de traces
 * cesse de s'ouvrir, et parce qu'au-delà d'une vingtaine de lignes personne ne lit.
 */
const DERNIERES_DESTRUCTIONS = 20;

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	/* UN SEUL INSTANT POUR TOUT L'ÉCRAN : deux fenêtres lues sur deux horloges ne se
	   compareraient pas. */
	const instant = new Date();
	const maintenant = instant.getTime();

	return {
		vecteur: vecteurDeV34(),
		notes: acces.ressource.notes,
		domaines: acces.ressource.domaines,
		/* NI `univers` NI `compte` : LA COQUILLE LES LIT AU CONTEXTE D'IDENTITÉ.
		   Ils descendaient jusqu'à `CoquilleDeConsole`, qui retombait sur les
		   constantes de `seeds/corpus.ts` dès qu'une route en oubliait un. Le
		   gabarit racine pose le contexte ; les servir ici serait une seconde
		   source, et une charge utile que personne ne lit. */
		relations: await lireRelations(base),
		designations: await lireLesDesignationsDeDomaine(base),
		mesures7j: await consultationsParNote(
			base,
			new Date(maintenant - SEPT_JOURS),
			new Date(maintenant)
		),
		mesures7jPrec: await consultationsParNote(
			base,
			new Date(maintenant - 2 * SEPT_JOURS),
			new Date(maintenant - SEPT_JOURS)
		),
		/* LE JOURNAL DE RECHERCHE — `RG-M02-03`, agrégé par terme sur les 30 jours de
		   l'étiquette de l'en-tête, avec l'évolution contre les 30 précédents. C'est la
		   source de l'indicateur nord et des trous documentaires. */
		recherches: await lireLesRecherches(base, instant),
		/* LES DEMANDES DE RÉVISION — `notes.revision_*`, sans filtre de périmètre : la
		   console est administrateur. Le recensement les disait sans table ; elles en ont
		   une depuis `002`. */
		revisions: await lireToutesLesDemandesDeRevision(base, instant),
		/* L'ANCIENNETÉ DE LA DERNIÈRE MODIFICATION, EN JOURS — ce que la maquette demande
		   (« Ancienneté de la dernière modification, en jours »), et non un compte par
		   période. Le calcul est celui de `lecture.ts`, employé par trois autres écrans :
		   une seconde définition en ferait diverger les alertes. */
		modifications: await ancienneteDeModification(base, acces.ressource.notes, instant),
		/* `RG-NF-05` — QUI A DÉTRUIT QUOI, ET QUAND. La table `traces_de_suppression`
		   est écrite dans la transaction de chaque destruction ; c'est ici qu'elle se
		   relit, et nulle part ailleurs — le seul écran d'administration du produit.
		   LE PLAFOND EST CELUI DES AUTRES CLASSEMENTS DE L'ÉCRAN : ce bloc rend compte,
		   il n'archive pas ; la table, elle, garde tout. */
		destructions: await lireLesTracesDeSuppression(base, DERNIERES_DESTRUCTIONS)
	};
};
