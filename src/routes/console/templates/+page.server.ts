/**
 * `/console/templates` — LE CHARGEUR de V-31.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-31.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : `TEMPLATES`
 * et `TYPES_NOTE` y sont importés au niveau du module (`V-31:59`). Et même s'ils
 * entraient par propriété, une colonne manquerait : `pnpm verif:donnees` compte
 * `Template.utilisations` parmi ses LACUNES — « c'est un compteur d'EMPLOI, qui
 * se calcule sur les notes créées depuis un template, et rien n'enregistre cette
 * provenance ». Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import { lireTemplates, lireTypesDeNote } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const [templates, typesNote] = await Promise.all([lireTemplates(base), lireTypesDeNote(base)]);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		templates,
		typesNote
	};
};
