/**
 * `/console/types-de-relations` — LE CHARGEUR de V-30.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-30.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence :
 * `TYPES_RELATION`, `RELATIONS` et `RELATIONS_TECHNIQUES` y sont importés au
 * niveau du module (`V-30:54`), alors que la base porte `types_de_relation` et
 * `relations` et que `lireTypesDeRelation()`, `lireRelations()` et
 * `lireRelationsTechniques()` de `T-030` les rendent. La donnée existe des deux
 * côtés et n'a AUCUN chemin jusqu'à l'écran — c'est le compte d'emploi de
 * chaque type qui en dépend, celui-là même qui décide si une suppression est
 * refusée. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos.
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
