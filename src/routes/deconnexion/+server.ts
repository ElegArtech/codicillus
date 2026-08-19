/**
 * `/deconnexion` — UC-M16-02, RG-ACC-02.
 *
 * `docs/routes.md:116` l'inventorie déjà : « `/deconnexion` — aucune vue,
 * action, niveau connecté. […] Atterrit sur `/` (espace public), JAMAIS sur une
 * page d'erreur. » Elle est l'une des 39 routes du §3 : l'implémenter ne fait
 * donc bouger aucun décompte, et `ATTENDU_ROUTES` reste à 39.
 *
 * `RG-ACC-02` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:109`) : « après
 * déconnexion, l'utilisateur atterrit sur l'espace public, JAMAIS sur une page
 * d'erreur. » La règle est tenue à la lettre, et elle décide aussi du cas que
 * personne ne spécifie : une déconnexion SANS session. Il n'y a rien à fermer,
 * le résultat visé est déjà obtenu — l'appelant est anonyme —, et rendre une
 * erreur serait précisément ce que la règle interdit. La réponse est donc la
 * même : 302 vers `/`.
 *
 * DEUX MÉTHODES, ET C'EST LE GEL QUI L'IMPOSE. Le menu utilisateur de la
 * coquille est un LIEN (`mockups/V-37-coquille.html:3370`,
 * `data-vers="Déconnexion — vue V-05"`), donc un GET. Une déconnexion en GET est
 * déclenchable par un tiers ; le cookie étant `SameSite=Lax`, un GET
 * intersite l'emporte. Le risque est borné — fermer une session n'expose rien et
 * ne détruit rien — et la parade tient au gel : c'est la coquille (T-016) qui
 * décidera de poster. Le POST est accepté dès aujourd'hui pour qu'elle n'ait
 * rien à ajouter ici. Écart déclaré au rapport du lot.
 */
import type { Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fermerLaSession } from '$lib/auth/depot';
import { CIBLE_APRES_DECONNEXION } from '$lib/auth/garde';
import { ATTRIBUTS_DU_COOKIE, NOM_DU_COOKIE } from '$lib/auth/sessions';
import { basePartagee } from '$lib/base/acces';

async function deconnecter(locals: App.Locals, cookies: Cookies): Promise<Response> {
	if (locals.sessionId !== undefined) {
		await fermerLaSession(basePartagee(), locals.sessionId);
	}
	/* La session fermée EN BASE et le cookie effacé sortent dans la même
	   réponse : un cookie survivant à sa session ferait rejouer une lecture
	   inutile à chaque requête suivante. */
	return new Response(null, {
		status: 302,
		headers: new Headers({
			location: CIBLE_APRES_DECONNEXION,
			'set-cookie': cookies.serialize(NOM_DU_COOKIE, '', { ...ATTRIBUTS_DU_COOKIE, maxAge: 0 })
		})
	});
}

export const GET: RequestHandler = async ({ locals, cookies }) => deconnecter(locals, cookies);

export const POST: RequestHandler = async ({ locals, cookies }) => deconnecter(locals, cookies);
