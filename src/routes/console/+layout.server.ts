/**
 * `/console` — LES SEPT COMPTEURS DE LA NAVIGATION SECONDAIRE, ET RIEN D'AUTRE.
 *
 * POURQUOI UN GABARIT ET NON DIX CHARGEURS : `aside.nav2` est rendu à l'identique
 * sur les dix écrans, et ses pastilles ne dépendent pas de l'écran regardé. Les
 * faire descendre par les dix `+page.server.ts` serait le même contrat recopié dix
 * fois (`P-35`), et le défaut se lirait comme un compteur juste sur une section et
 * faux sur la voisine.
 *
 * CE CHARGEUR NE GARDE RIEN, et il n'a pas à le faire : `garde.ts` redirige
 * l'anonyme sur le préfixe `/console`, et les dix pages résolvent chacune leur
 * droit par `resoudreLaConsole()`. Ce qu'il lit, c'est SEPT `count(*)`, qui ne
 * nomment aucune ressource.
 */
import { basePartagee } from '$lib/base/acces';
import { lireLesEffectifsDeConsole } from '$lib/donnees/consoles';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => ({
	effectifs: await lireLesEffectifsDeConsole(basePartagee())
});
