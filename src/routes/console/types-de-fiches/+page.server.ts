/**
 * `/console/types-de-fiches` — LE CHARGEUR de V-29.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; aucune règle de droit
 * n'est écrite ici, et le seul `error(404)` du fichier est SANS MESSAGE
 * (`ADR-007`).
 *
 * LE SEGMENT D'ADRESSE EST CELUI DE `docs/routes.md` §3.6, non le vocabulaire
 * de la vue : le concept « fiche » est renommable globalement par la
 * configuration (`CDC M14.7`, `P-07`), et la vue lit ce nom par
 * `$lib/vocabulaire`. L'ADRESSE, elle, ne se renomme pas — la déduire du
 * réglage rendrait un chemin instable.
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-29.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : `TYPES_FICHE`
 * et ses champs y sont importés au niveau du module (`V-29:72`), alors que la
 * base porte `types_de_fiche` et `champs_de_type_de_fiche` et que
 * `lireTypesDeFiche()` de `T-030` les rend. La donnée existe des deux côtés et
 * n'a AUCUN chemin jusqu'à l'écran. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos — formulaire fermé, aucun refus de
 * suppression ouvert.
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
