/**
 * `/console` — LES HUIT COMPTEURS DE LA NAVIGATION SECONDAIRE, ET RIEN D'AUTRE.
 *
 * POURQUOI UN GABARIT ET NON UN CHARGEUR PAR ÉCRAN : `aside.nav2` est rendu à
 * l'identique sur tous les écrans, et ses pastilles ne dépendent pas de l'écran
 * regardé. Les faire descendre par chaque `+page.server.ts` serait le même contrat
 * recopié onze fois (`P-35`), et le défaut se lirait comme un compteur juste sur une
 * section et faux sur la voisine.
 *
 * LE GABARIT GARDE SA PROPRE DONNÉE. Chaque page résout son droit, mais les données d'un
 * gabarit se demandent aussi seules (`__data.json`) : sans cette garde, n'importe quel
 * compte lisait les effectifs de l'instance — comptes actifs, requêtes à traiter, lots
 * d'import — sous une page qui lui répondait 404.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { accesALaConsole, lireLesEffectifsDeConsole } from '$lib/donnees/consoles';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
	return { effectifs: await lireLesEffectifsDeConsole(basePartagee()) };
};
