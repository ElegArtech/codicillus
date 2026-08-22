/**
 * `/console` — LES SEPT COMPTEURS DE LA NAVIGATION SECONDAIRE, ET RIEN D'AUTRE.
 *
 * POURQUOI UN GABARIT ET NON DIX CHARGEURS. `aside.nav2` est rendu à
 * l'identique sur les dix écrans, et ses pastilles ne dépendent pas de l'écran
 * regardé. Les faire descendre par les dix `+page.server.ts` serait le même
 * contrat recopié dix fois, donc divergent au premier oubli (`P-35`) — et le
 * défaut se lirait comme un compteur juste sur une section et faux sur la
 * voisine, ce qui est plus coûteux qu'un compteur faux partout.
 *
 * CE CHARGEUR NE GARDE RIEN, et il n'a pas à le faire : `garde.ts` redirige
 * l'anonyme sur le préfixe `/console` (`ARB-052`), et les dix pages résolvent
 * chacune leur droit par `resoudreLaConsole()` — un non-administrateur reçoit
 * 404 avant que la moindre pastille ne soit rendue. Ce que ce chargeur lit,
 * c'est SIX `count(*)`, qui ne nomment aucune ressource.
 */
import { basePartagee } from '$lib/base/acces';
import { lireLesEffectifsDeConsole } from '$lib/donnees/consoles';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => ({
	effectifs: await lireLesEffectifsDeConsole(basePartagee())
});
