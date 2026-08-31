/**
 * `/console/exports` — LE CHARGEUR de V-36. LA GARDE EST CELLE DES ONZE ADRESSES DE
 * CONSOLE : `resoudreLaConsole()` la prend, une fois pour toutes, et un
 * non-administrateur reçoit 404 V-26 — pas un refus (`P-09`, `RG-ACC-04`). Le seul
 * `error(404, …)` est SANS MESSAGE (`ADR-007`).
 *
 * L'ÉCRAN, PAS LE TRAITEMENT : aucune table n'enregistre d'export passé. L'écran
 * présente le PÉRIMÈTRE exportable, jamais un export accompli, et rien n'est simulé.
 *
 * LE NOM ANNONCÉ EST PRODUIT PAR SA SOURCE — `nomDArchive()`, la fabrique que le point
 * de téléchargement appelle lui-même : le recomposer ici laisserait les deux
 * définitions diverger. LA DATE EST CELLE DE LA REQUÊTE DE PAGE, celle du fichier sera
 * celle de la requête de téléchargement — la seule marge, bornée à la journée. SUR UNE
 * INSTANCE NEUVE la table est vide, aucun domaine n'est choisi, aucun nom n'est annoncé.
 *
 * `/console/exports/{univers}/{domaine}` est un `+server.ts`, et cette vue-ci n'y
 * renvoie pas : le bouton du gel est une minuterie, et `ARB-011` interdit de rendre une
 * transition.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import { nomDArchive } from '$lib/export/archive';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const designations = await lireLesDesignationsDeDomaine(base);
	const maintenant = new Date().toISOString();

	return {
		notes: acces.ressource.notes,
		domaines: acces.ressource.domaines,
		/* NI `univers` NI `compte` : LA COQUILLE LES LIT AU CONTEXTE D'IDENTITÉ.
		   Ils descendaient jusqu'à `CoquilleDeConsole`, qui retombait sur les
		   constantes de `seeds/corpus.ts` dès qu'une route en oubliait un. Le
		   gabarit racine pose le contexte ; les servir ici serait une seconde
		   source, et une charge utile que personne ne lit. */

		designations,
		/* Le nom du fichier tel que le point de téléchargement le nommera — la
		   même fabrique, les mêmes deux valeurs, aucune recomposition. */
		nomsDArchive: Object.fromEntries(
			Object.entries(designations).map(([nom, canonique]) => [
				nom,
				nomDArchive(canonique.domaine, maintenant)
			])
		)
	};
};
