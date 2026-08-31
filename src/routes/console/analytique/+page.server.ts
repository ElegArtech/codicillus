/**
 * `/console/analytique` — LE CHARGEUR de V-34, et le seul des onze qui pose un vecteur. LA
 * GARDE EST CELLE DES ONZE ADRESSES DE CONSOLE : `resoudreLaConsole()` la prend, une fois
 * pour toutes, et un non-administrateur reçoit 404 V-26 (`P-09`, `RG-ACC-04`). Le seul
 * `error(404, …)` est SANS MESSAGE (`ADR-007`).
 *
 * `P-02` MORD ICI, ET C'EST LE VECTEUR QUI LUI RÉPOND : le produit ne porte presque aucune
 * des mesures de cet écran, et les lacunes sont recensées une par une, avec la table qui
 * manque, dans `MESURES_DE_CONSOLE_SANS_CONTREPARTIE`. Servir des zéros serait pire que la
 * section « Suffisantes » — « 0 » et « indisponible » sont deux informations différentes.
 * LE GEL PORTE DÉJÀ L'ÉTAT NEUTRE EXPLICITE, et `vecteurDeV34()` le DÉRIVE du recensement
 * plutôt que de l'écrire, pour que le contrôle garde un cas d'épreuve après une migration
 * future (`P-26`).
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
import { lireRelations } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

/**
 * LES CONSULTATIONS D'UNE FENÊTRE, PAR NOTE — la seule des cinq mesures de V-34
 * que le produit porte vraiment, depuis que la migration `006` a monté la table
 * des consultations horodatées. Les deux entrées correspondantes ont été retirées
 * du recensement des lacunes : un registre de lacunes qui ment dispense d'aller
 * voir.
 *
 * LES DEUX AUTRES SÉRIES DE L'ÉCRAN N'ONT TOUJOURS AUCUNE TABLE — le journal de
 * recherche et les demandes de révision. La vue garde leur défaut, et le vecteur
 * continue de demander l'état « Pas encore assez d'usage pour conclure » : un
 * seul indicateur réel ne fait pas un tableau de bord.
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

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const maintenant = Date.now();

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
		)
	};
};
