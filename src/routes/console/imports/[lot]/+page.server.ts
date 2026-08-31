/**
 * `/console/imports/{lot}` — LE RAPPORT DÉTAILLÉ D'UN LOT, V-35 dans son état « rapport
 * de lot ouvert » (`docs/routes.md:183`).
 *
 * POURQUOI CETTE ADRESSE EXISTE, mot pour mot de la source : le brief de V-35 promet
 * « l'accès au rapport détaillé de chaque lot » et des rapports « consultables
 * indéfiniment » ; « un objet identifié et consultable indéfiniment est un objet
 * adressable ». Elle n'était pas montée faute de table ; `lots_d_import` la porte depuis
 * la migration `009`.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES DE CONSOLE : `resoudreLaConsole()` la prend, une
 * fois pour toutes, et un non-administrateur reçoit 404 V-26 — pas un refus (`P-09`,
 * `RG-ACC-04`). UN LOT INTROUVABLE REÇOIT LE MÊME 404, AU MÊME OCTET : l'existence d'un
 * lot ne s'apprend pas par une adresse construite.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	contexteDeRequete,
	journalDImportsEnregistre,
	lireLeJournalDImports,
	lireLesDesignationsDeDomaine,
	lireUnLotDImport,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals, params }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const lot = await lireUnLotDImport(base, params.lot);
	if (lot === null) error(404, MESSAGE_INTROUVABLE);

	return {
		notes: acces.ressource.notes,
		journalEnregistre: journalDImportsEnregistre(),
		/* LE JOURNAL ENTIER, ET PAS SEULEMENT LA LIGNE DEMANDÉE : le rapport lit sa
		   date, son auteur et ses décomptes DANS le journal — c'est la mécanique du
		   gel —, et la page reste celle du journal, rapport ouvert par-dessus. */
		journalImports: await lireLeJournalDImports(base),
		lotOuvert: params.lot,
		/* Les fichiers du lot, ligne par ligne : ce que « rapport détaillé » détaille. */
		fichiersDuLot: lot.fichiers,
		designations: await lireLesDesignationsDeDomaine(base)
	};
};
