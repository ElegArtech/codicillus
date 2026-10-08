/**
 * `/deconnexion` — UC-M16-02, RG-ACC-02. « Aucune vue, action, niveau connecté ;
 * atterrit sur `/` (espace public), JAMAIS sur une page d'erreur. »
 *
 * La règle décide aussi du cas que personne ne spécifie : une déconnexion SANS
 * session. Il n'y a rien à fermer, le résultat visé est déjà obtenu, et rendre une
 * erreur serait précisément ce que la règle interdit. La réponse est donc la
 * même — 302 vers `/`.
 *
 * LA DÉCONNEXION EST UN POST (`seDeconnecter()`), soumis au contrôle d'origine de
 * SvelteKit. En GET, n'importe quel site ou une image glissée dans une note fermait la
 * session de qui l'ouvrait. Un GET ne ferme donc rien : il mène au profil, où le bouton
 * de déconnexion se trouve, ou à l'accueil sans session.
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
		status: 303,
		headers: new Headers({
			location: CIBLE_APRES_DECONNEXION,
			'set-cookie': cookies.serialize(NOM_DU_COOKIE, '', { ...ATTRIBUTS_DU_COOKIE, maxAge: 0 })
		})
	});
}

export const GET: RequestHandler = ({ locals }) =>
	new Response(null, {
		status: 303,
		headers: new Headers({
			location: locals.sessionId === undefined ? CIBLE_APRES_DECONNEXION : '/mon-profil'
		})
	});

export const POST: RequestHandler = async ({ locals, cookies }) => deconnecter(locals, cookies);
