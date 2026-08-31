/**
 * `/console` — LA REDIRECTION D'ATTERRISSAGE vers `/console/univers`, en 308 : c'est le
 * code que la source écrit, permanent et préservant la méthode.
 *
 * POURQUOI UNE PAGE ET NON UN `+server.ts`, ALORS QUE `docs/routes.md:471` RANGE CETTE
 * ADRESSE PARMI LES ROUTES « SANS VUE » — ET C'EST MESURÉ : un point de terminaison ne
 * traverse pas `+error.svelte`, si bien que le refus opposé au non-administrateur
 * rendait le repli de SvelteKit, 23 octets, contre les 31 988 de V-26. Un tel écart
 * entre un refus et une inexistence est le canal que `RG-ACC-04` ferme.
 *
 * LE DROIT EST ÉPROUVÉ AVANT LA REDIRECTION, JAMAIS APRÈS : rediriger d'abord ferait
 * recevoir au non-administrateur un 308 puis un 404, et la redirection à elle seule
 * apprend que `/console` existe. La garde est celle des onze autres adresses,
 * `accesALaConsole()`, et l'`error(404, …)` est SANS message (`ADR-007`). Le contrôle
 * ne s'en remet pas à `garde.ts` pour l'anonyme — une garde qui ne tiendrait que par une
 * autre garde n'est pas une garde.
 */
import { error, redirect } from '@sveltejs/kit';
import { accesALaConsole } from '$lib/donnees/consoles';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
	redirect(308, '/console/univers');
};
