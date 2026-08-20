/**
 * `/console/domaines` — LE CHARGEUR de V-28.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; aucune règle de droit
 * n'est écrite ici, et le seul `error(404)` du fichier est SANS MESSAGE — un
 * message entrerait dans le corps et rendrait le refus discernable (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-28.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : les univers,
 * les domaines et leur détail y sont importés au niveau du module (`V-28:68`).
 * Seules les NOTES entrent par propriété, et c'est par là que la base entre —
 * ce sont elles que V-28 compte pour la colonne « notes » de chaque domaine.
 * Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos : les trois positions de l'axe
 * « Formulaire » et les deux de l'axe « Suppression » sont des états
 * d'INTERACTION, qu'aucune donnée ne détermine.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404);

	return { vecteur: null, notes: acces.ressource.notes };
};
