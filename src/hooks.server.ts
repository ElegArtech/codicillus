/**
 * LE POINT D'ENTRÉE DE TOUTE REQUÊTE — l'identité, puis les redirections de
 * session de `docs/routes.md` §5.2.
 *
 * Deux choses s'y font, dans cet ordre, et une seule fois par requête :
 *
 *   1. L'IDENTITÉ EST ÉTABLIE. Le cookie est lu, la session reprise, le compte
 *      relu. `event.locals.identite` vaut ensuite `ANONYME` ou une identité
 *      authentifiée — jamais rien. C'est le point que `T-011` attendait : sa
 *      résolution des droits « ne établit aucune identité, elle en REÇOIT une ».
 *   2. LES REDIRECTIONS DE §5.2 SONT APPLIQUÉES, selon le régime de l'adresse
 *      (`src/lib/auth/garde.ts`, qui porte la table et sa justification).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE FICHIER NE FAIT PAS, ET C'EST AUTANT DE LOTS
 *
 *  - Il ne résout AUCUN droit de dossier : `src/lib/droits/resolution.ts` le
 *    fait, et il l'appelle avec l'identité qu'on vient d'établir.
 *  - Il ne rend AUCUNE vue et ne choisit aucun 404 : le régime indiscernable
 *    d'`ADR-007` appartient aux routes, par le chemin unique de
 *    `src/lib/public/adresse-non-resolue.ts`. Une adresse de ressource sans
 *    session n'est donc PAS redirigée ici — voir `garde.ts`.
 *  - Il ne mesure RIEN. L'indiscernabilité de `RG-ACC-04` — corps, en-têtes,
 *    code ET temps de réponse — n'est prouvée par aucune batterie du dépôt
 *    (`docs/routes.md:460`), et ce lot ne la déclare pas tenue.
 *  - Il ne touche pas le mode démo : sa route de conception est un greffon Vite
 *    en `apply: 'serve'`, servi AVANT SvelteKit. Aucune requête du banc de
 *    comparaison ne traverse ce fichier, et le banc reste donc mesuré tel quel.
 *    (Son adresse n'est pas citée : ce fichier est bâti, et
 *    `verif:demo:hors-production` cherche cette chaîne dans le produit construit,
 *    commentaires compris.)
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LA RÉPONSE EST CONSTRUITE À LA MAIN
 *
 * Un `redirect()` levé depuis ce point laisse à SvelteKit le soin de reporter
 * les cookies modifiés sur la réponse. Le cookie de session est ici EFFACÉ dans
 * les mêmes cas où l'on redirige — session inconnue, échue, compte désactivé —,
 * et une redirection qui oublierait de l'effacer renverrait l'appelant en
 * boucle. La réponse est donc composée explicitement : `Location` et
 * `Set-Cookie` sortent ensemble ou pas du tout.
 */
import type { Handle } from '@sveltejs/kit';
import { ANONYME } from '$lib/droits/resolution';
import { identitePourCompte } from '$lib/auth/authentification';
import {
	fermerLaSession,
	sessionParCondensat,
	toucherLaSession,
	valeurDeDureeDeSession
} from '$lib/auth/depot';
import { MOTIF, adresseDeConnexion, regimeDe } from '$lib/auth/garde';
import {
	ATTRIBUTS_DU_COOKIE,
	NOM_DU_COOKIE,
	condensatDeJeton,
	dureeDInactiviteEnMinutes,
	sessionExpiree
} from '$lib/auth/sessions';
import { basePartagee } from '$lib/base/acces';

/**
 * L'état de la session de l'appelant.
 *
 *   `absente` — aucun cookie, cookie inconnu, session fermée, OU COMPTE
 *               DÉSACTIVÉ (RG-M14-08). Le dernier cas est rangé ici et non dans
 *               `expiree` parce que le message d'`expiree` AFFIRME une cause —
 *               « votre session a été fermée après une période d'inactivité »
 *               (`V-05:676`) — qui serait fausse. Des deux libellés gelés, on
 *               retient celui qui ne dit rien de faux.
 *   `expiree` — le délai d'inactivité est échu (RG-ACC-03).
 *   `valide`  — session ouverte, compte actif.
 */
type EtatDeSession = 'absente' | 'expiree' | 'valide';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.identite = ANONYME;

	const jeton = event.cookies.get(NOM_DU_COOKIE);
	let etat: EtatDeSession = 'absente';

	if (jeton !== undefined && jeton !== '') {
		const base = basePartagee();
		const trouvee = await sessionParCondensat(base, condensatDeJeton(jeton));
		if (trouvee === null) {
			etat = 'absente';
		} else {
			const duree = dureeDInactiviteEnMinutes(await valeurDeDureeDeSession(base));
			if (sessionExpiree(trouvee, duree, new Date())) {
				await fermerLaSession(base, trouvee.sessionId);
				etat = 'expiree';
			} else {
				const identite = identitePourCompte(trouvee.compte);
				if (identite === null) {
					/* RG-M14-08 — « perd IMMÉDIATEMENT l'accès ». La session est
					   fermée au premier accès, sans purge à faire courir. */
					await fermerLaSession(base, trouvee.sessionId);
					etat = 'absente';
				} else {
					await toucherLaSession(base, trouvee.sessionId);
					event.locals.identite = identite;
					event.locals.sessionId = trouvee.sessionId;
					etat = 'valide';
				}
			}
		}
	}

	/* Le cookie ne survit pas à une session qui n'en est plus une : il serait
	   rejoué à chaque requête pour le même résultat. */
	const cookiePerime = jeton !== undefined && etat !== 'valide';

	const regime = regimeDe(event.url.pathname);

	/* `/deconnexion` répond elle-même (RG-ACC-02 : l'espace public, jamais une
	   page d'erreur) — y compris sans session. Rien ne la redirige ici. */
	if (regime === 'deconnexion' || regime === 'publique') {
		if (cookiePerime) event.cookies.delete(NOM_DU_COOKIE, { path: ATTRIBUTS_DU_COOKIE.path });
		return resolve(event);
	}

	if (etat === 'valide') return resolve(event);

	/* RG-ACC-03 — « à l'expiration de la session, l'utilisateur est renvoyé vers
	   la page de connexion avec le message Session expirée. La page qu'il tentait
	   d'atteindre est restaurée après reconnexion. » La règle ne distingue pas
	   les familles d'adresses : une expiration se dit, quelle que soit la page
	   visée, et la redirection est la même pour toute adresse — elle ne révèle
	   donc l'existence d'aucune ressource. */
	if (etat === 'expiree') {
		return redirigerVersConnexion(event, MOTIF.expiree, cookiePerime);
	}

	/* Sans session : seules les adresses du régime `redirection` sont renvoyées
	   vers la connexion. Les adresses de ressource sont laissées à leur propre
	   résolution — régime indiscernable (`garde.ts`). */
	if (regime === 'redirection') {
		return redirigerVersConnexion(event, MOTIF.protegee, cookiePerime);
	}

	if (cookiePerime) event.cookies.delete(NOM_DU_COOKIE, { path: ATTRIBUTS_DU_COOKIE.path });
	return resolve(event);
};

/** La réponse 302 de §5.2, cookie périmé effacé dans la même réponse. */
function redirigerVersConnexion(
	event: Parameters<Handle>[0]['event'],
	motif: (typeof MOTIF)[keyof typeof MOTIF],
	cookiePerime: boolean
): Response {
	const entetes = new Headers({
		location: adresseDeConnexion(motif, event.url.pathname + event.url.search)
	});
	if (cookiePerime) {
		entetes.append(
			'set-cookie',
			event.cookies.serialize(NOM_DU_COOKIE, '', { ...ATTRIBUTS_DU_COOKIE, maxAge: 0 })
		);
	}
	return new Response(null, { status: 302, headers: entetes });
}
