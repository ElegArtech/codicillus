/**
 * `/mot-de-passe-oublie` — LE CHARGEUR de V-06.
 *
 * `docs/routes.md:114` : niveau « anonyme ». `src/lib/auth/garde.ts` la classe
 * `publique` : rien ne la redirige — une adresse de récupération qui refuserait
 * un connecté serait une porte fermée de plus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN A CESSÉ DE PROMETTRE UN COURRIEL, ET L'ACTION A CESSÉ DE RENDRE 501
 *
 * Le produit n'a AUCUN expéditeur de courriel, et aucune table ne porte de
 * jeton de réinitialisation. L'écran promettait pourtant « vous recevrez un
 * lien de réinitialisation sur votre adresse professionnelle », et l'action
 * répondait `error(501)` à qui soumettait son identifiant : sur la SEULE porte
 * de secours d'un compte dont l'accès est perdu, c'était une page d'erreur.
 *
 * V-06 rend désormais ce qui est vrai — la réinitialisation par courriel n'est
 * pas disponible sur cette instance — et nomme le chemin QUI EXISTE : la
 * réinitialisation par un administrateur, servie par `/console/comptes`
 * (action `reinitialiserLeMotDePasse`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `RG-ACC-04` — RIEN NE PEUT PLUS RÉVÉLER QU'UN COMPTE EXISTE
 *
 * Le chargeur ne lit aucun compte, l'écran ne demande aucun identifiant, et
 * l'action ci-dessous ne regarde pas son corps. La réponse est donc la même
 * pour tout le monde — même code, même page, sans lecture en base, donc sans
 * écart de temps entre un identifiant connu et un inconnu.
 */
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE. V-06 pose « Ouvrir un
 * ticket d'assistance » dans son pied ; le gel dit d'où l'adresse sort —
 * « adresse externe configurée en console » (`V-04:2205`) —, et c'est la clé
 * `portail_assistance` de la table `parametres` (M14.7).
 */
export const load: PageServerLoad = async () => ({
	portail: (await lireConfiguration(basePartagee())).portailAssistance
});

export const actions: Actions = {
	/**
	 * L'ÉCRAN NE PORTE PLUS AUCUN FORMULAIRE : cette action n'est atteinte que
	 * par une requête composée à la main. Elle rend la page telle quelle — la
	 * même pour tout corps envoyé, sans rien lire. `error(501)` disait « pas
	 * implémenté » à l'utilisateur enfermé dehors ; ne rien rendre du tout lui
	 * rend l'écran qui, lui, nomme le chemin réel.
	 */
	default: () => {}
};
