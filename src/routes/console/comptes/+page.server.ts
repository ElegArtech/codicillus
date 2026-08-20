/**
 * `/console/comptes` — LE CHARGEUR de V-32.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS, ET C'EST L'ÉCRAN OÙ CELA PÈSE LE PLUS. Il ne
 * touche pas `src/vues/V-32.svelte`, qui importe `COMPTES` au niveau du module
 * (`V-32:65`) : la liste des comptes affichée est celle du JEU DE SEMENCE, non
 * celle de la table. `lireComptes()` de `T-030` existe et rend les comptes de la
 * base, mais aucune propriété ne les porte jusqu'à l'écran. Un administrateur
 * qui créerait un compte ne le verrait donc pas apparaître — écran de gestion
 * dont la gestion n'est pas branchée. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos : les quatre positions de l'axe
 * « Formulaire » et les deux de l'axe « Cas » sont des états d'INTERACTION.
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
