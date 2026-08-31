/**
 * `/mot-de-passe-oublie` — LE CHARGEUR de V-06. Niveau « anonyme », et
 * `src/lib/auth/garde.ts` la classe `publique` : rien ne la redirige — une adresse
 * de récupération qui refuserait un connecté serait une porte fermée de plus.
 *
 * L'ÉCRAN A CESSÉ DE PROMETTRE UN COURRIEL. Le produit n'a AUCUN expéditeur de
 * courriel, et aucune table ne porte de jeton de réinitialisation ; l'écran
 * promettait pourtant un lien, et l'action répondait `error(501)` — sur la SEULE
 * porte de secours d'un compte dont l'accès est perdu. V-06 rend désormais ce qui
 * est vrai et nomme le chemin QUI EXISTE : la réinitialisation par un
 * administrateur, servie par `/console/comptes`.
 *
 * `RG-ACC-04` — RIEN NE PEUT RÉVÉLER QU'UN COMPTE EXISTE. Le chargeur ne lit aucun
 * compte, l'écran ne demande aucun identifiant, et l'action ne regarde pas son
 * corps : même code, même page, sans lecture en base, donc sans écart de temps
 * entre un identifiant connu et un inconnu.
 */
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE — clé `portail_assistance`
 * de `parametres` (M14.7), « adresse externe configurée en console ».
 */
export const load: PageServerLoad = async () => ({
	portail: (await lireConfiguration(basePartagee())).portailAssistance
});

export const actions: Actions = {
	/**
	 * L'ÉCRAN NE PORTE PLUS AUCUN FORMULAIRE : cette action n'est atteinte que par
	 * une requête composée à la main. Elle ne rend RIEN, et ne lit ni le corps ni la
	 * base — la réponse est donc la même pour tout envoi.
	 *
	 * CE QUE « NE RIEN RENDRE » PRODUIT DÉPEND DU CLIENT, et les deux cas ont été
	 * mesurés : un envoi de formulaire de navigateur obtient `200` et LA PAGE
	 * elle-même, re-rendue par le chargeur ; un client qui négocie
	 * `application/json` obtient l'enveloppe d'action de SvelteKit — `204`, sans
	 * donnée. C'est l'enveloppe, pas l'écran, et la confondre avec lui fait prendre
	 * une mesure pour une autre.
	 */
	default: () => {}
};
