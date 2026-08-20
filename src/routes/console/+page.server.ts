/**
 * `/console` — LA REDIRECTION D'ATTERRISSAGE, et la seule des douze adresses
 * d'administration qui manquait vraiment.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI ÉTAIT MESURÉ
 *
 * Sur une session `sophie.nguyen` (administratrice), les onze autres adresses
 * rendaient 200 ; `/console` rendait **404 et 32 569 octets de V-26**. Ce
 * n'était donc pas un refus de droit — c'était une route absente. Toutes les
 * autres 404 relevées avec un compte non administrateur étaient, elles, le
 * refus légitime que `docs/routes.md:167` prescrit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SOURCE, ET ELLE EST DOUBLE
 *
 * `docs/routes.md:173` : « `/console` — *(redirection 308 → `/console/univers`)*
 * […] S4 rail `Gestion › Console` → `data-vers="Console — vue V-27"` : l'entrée
 * unique du rail désigne V-27 comme section d'atterrissage. » `docs/routes.md:313`
 * la reprend au tableau des redirections.
 *
 * Le code est **308** et non 302 : c'est celui que la source écrit, et il dit ce
 * qu'il doit dire — la redirection est permanente et préserve la méthode.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE PAGE ET NON UN `+server.ts`, ALORS QUE `docs/routes.md:471`
 * RANGE CETTE ADRESSE PARMI LES ROUTES « SANS VUE » — ET C'EST MESURÉ
 *
 * La première rédaction était un `+server.ts` : c'est ce que « sans vue »
 * suggère, et c'est FAUX ici. Un point de terminaison ne traverse pas
 * `+error.svelte`, si bien que le refus opposé au non-administrateur rendait le
 * repli de SvelteKit au lieu de V-26 :
 *
 *     /console            404 —     23 octets  (JSON `{"message":"Not Found"}`)
 *     /console            404 —  1 368 octets  (avec un `accept` de navigateur)
 *     /console/inexistant 404 — 31 988 octets  (V-26)
 *
 * Un écart de trente mille octets entre un refus et une inexistence est
 * exactement le canal que `RG-ACC-04` ferme, et `docs/routes.md:380` tranche :
 * « en cas de doute, l'indiscernable l'emporte ». La forme retenue est donc une
 * page dont le chargeur ne rend JAMAIS — il redirige ou il refuse — et dont le
 * composant n'est là que parce que le routeur en exige un. « Sans vue » reste
 * vrai du produit : aucun octet de `+page.svelte` n'atteint jamais un client.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DROIT EST ÉPROUVÉ AVANT LA REDIRECTION, JAMAIS APRÈS — RG-ACC-04
 *
 * L'ordre n'est pas indifférent. Rediriger d'abord ferait recevoir au
 * non-administrateur un 308 puis un 404 : la redirection à elle seule apprend
 * que `/console` existe, alors qu'une adresse inexistante rend 404 tout de
 * suite. `docs/routes.md:372` range `/console/…` — ce préfixe compris — dans la
 * colonne « 404 V-26 » pour tout connecté sans le droit.
 *
 * La garde est celle des onze autres adresses, empruntée et jamais redite :
 * `accesALaConsole()` de `$lib/donnees/consoles.ts`, qui lit lui-même le verdict
 * de `src/lib/droits/resolution.ts` (`RG-DRO-03`). L'`error(404, …)` est SANS
 * message propre, pour la raison qu'`ADR-007` donne.
 *
 * L'anonyme n'arrive pas jusqu'ici : `src/lib/auth/garde.ts` range `/console`
 * en régime `redirection` et l'envoie sur `/connexion?motif=page-protegee`
 * (`ARB-052`). Le contrôle ci-dessous ne s'en remet pas pour autant à cette
 * garde-là — `accesALaConsole()` rend `false` pour l'anonyme aussi, et une garde
 * qui ne tiendrait que par une autre garde n'est pas une garde.
 */
import { error, redirect } from '@sveltejs/kit';
import { accesALaConsole } from '$lib/donnees/consoles';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
	redirect(308, '/console/univers');
};
