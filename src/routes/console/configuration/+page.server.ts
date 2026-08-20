/**
 * `/console/configuration` — LE CHARGEUR de V-33.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS, ET `P-01` EN DÉPEND. Il ne touche pas
 * `src/vues/V-33.svelte`, qui importe `CONFIG` et `CORPUS` au niveau du module
 * (`V-33:93`) : les seuils de fraîcheur AFFICHÉS sont ceux du jeu de semence.
 * La base les porte — table `parametres`, lus par `lireSeuils()` de `T-030` —
 * et ce sont eux que le PRODUIT applique, puisque `contexteDeRequete()` les
 * passe à `lireNotes()`. Les deux coïncident aujourd'hui parce que la base a été
 * semée depuis le jeu ; le jour où un administrateur les changerait, l'écran qui
 * les règle afficherait autre chose que ce que le produit applique. C'est le
 * plus contrariant des écarts de ce lot, et il est déclaré au rapport.
 *
 * `vecteur: null` demande l'état au repos — les quatre positions de l'axe
 * « Seuils » sont des états de SAISIE, que la vue lit de son propre réglage.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return { vecteur: null, notes: acces.ressource.notes };
};
