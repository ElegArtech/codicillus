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
 * administrateur, servie par `/console/comptes` (`M14.6`).
 *
 * CETTE ADRESSE N'ACCEPTE PLUS AUCUNE SOUMISSION, ET ELLE N'EN A JAMAIS ACCEPTÉ
 * UNE UTILE. Elle portait une action par défaut vide — `default: () => {}` —, que
 * l'écran ne visait pas et qui ne faisait rien : une adresse qui répond `200` à un
 * envoi sans rien en faire laisse croire qu'une demande a été déposée. Sans
 * `actions`, un `POST` reçoit `405`, ce qui est la vérité. Son ancienne voisine
 * `…/{jeton}` a été retirée pour la même raison : elle rendait le même écran et ne
 * lisait même pas son paramètre, alors qu'aucun lien n'a jamais été émis.
 *
 * `RG-ACC-04` — RIEN NE PEUT RÉVÉLER QU'UN COMPTE EXISTE. Le chargeur ne lit aucun
 * compte et l'écran ne demande aucun identifiant : même page pour tout visiteur,
 * sans lecture en base, donc sans écart de temps entre un identifiant connu et un
 * inconnu.
 */
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE — clé `portail_assistance`
 * de `parametres` (M14.7), « adresse externe configurée en console ».
 */
export const load: PageServerLoad = async () => ({
	portail: (await lireConfiguration(basePartagee())).portailAssistance
});
