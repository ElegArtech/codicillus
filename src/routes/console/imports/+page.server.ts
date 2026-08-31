/**
 * `/console/imports` — LE CHARGEUR de V-35. LA GARDE EST CELLE DES ONZE ADRESSES DE
 * CONSOLE : `resoudreLaConsole()` la prend, une fois pour toutes, et un non-administrateur
 * reçoit 404 V-26 — pas un refus (`P-09`, `RG-ACC-04`). Le seul `error(404, …)` est SANS
 * MESSAGE (`ADR-007`).
 *
 * LE JOURNAL EST CELUI DE LA BASE — `lots_d_import`, migration `009`. Il a été vide
 * structurellement, faute de table, et la vue garde la prise qui le disait : un tableau
 * vide n'affirme rien de faux, mais SOUS les deux phrases du gel — « les rapports restent
 * consultables indéfiniment » — il disait « aucun import n'a eu lieu » là où la vérité
 * était « rien n'est conservé ». `journalEnregistre` reste DÉRIVÉ du recensement, et il
 * rebasculerait tout seul si la lacune revenait.
 *
 * `/console/imports/{lot}` est montée à côté, et sert le rapport détaillé d'un lot.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	journalDImportsEnregistre,
	lireLeJournalDImports,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		notes: acces.ressource.notes,
		/* NI `univers` NI `compte` : LA COQUILLE LES LIT AU CONTEXTE D'IDENTITÉ.
		   Ils descendaient jusqu'à `CoquilleDeConsole`, qui retombait sur les
		   constantes de `seeds/corpus.ts` dès qu'une route en oubliait un. Le
		   gabarit racine pose le contexte ; les servir ici serait une seconde
		   source, et une charge utile que personne ne lit. */
		/* Le journal est-il enregistré ? Le recensement le sait ; l'écran le dit. */
		journalEnregistre: journalDImportsEnregistre(),
		/* LE JOURNAL LUI-MÊME — `RG-M12-09`, tous les lots, du plus récent au plus
		   ancien. Sans plafond : « les rapports restent consultables indéfiniment ». */
		journalImports: await lireLeJournalDImports(base),
		/* La correspondance nom d'affichage → forme canonique, pour « Ouvrir le
		   domaine » du rapport de lot — la même table qu'à `/console/exports`. */
		designations: await lireLesDesignationsDeDomaine(base)
	};
};
