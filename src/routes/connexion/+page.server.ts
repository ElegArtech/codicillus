/**
 * `/connexion` — le CHARGEUR et l'ACTION de V-05.
 *
 * LE FORMULAIRE GELÉ NE POSTE PAS. La maquette porte `<form class="auth__form"
 * id="form" novalidate>` : NI `method`, NI `action`, la soumission du gel étant
 * entièrement en JavaScript (`ARB-011`). Or un formulaire sans `method` soumet en
 * GET vers l'adresse courante : le mot de passe partirait dans la barre d'adresse.
 *
 * L'ACTION ATTEND `identifiant`, `motdepasse` et `souvenir` — exactement les noms
 * du gel. Rien n'est à renommer le jour où le lien se fait.
 *
 * L'ACTION LIVRE LA DÉCISION ET LA TRANSMET (`echec`, `trop`, et les secondes
 * restantes) ; elle ne peint pas le bandeau, ce qui demanderait de modifier la
 * vue. Le décompte lui-même est un comportement temporisé.
 */
import { fail, redirect } from '@sveltejs/kit';
import { authentifier } from '$lib/auth/authentification';
import {
	compteParIdentifiant,
	enregistrerLaTentative,
	ouvrirUneSession,
	tentativesDeLOrigine
} from '$lib/auth/depot';
import { arriveeDepuisMotif, cibleApresConnexion, suiteInterne } from '$lib/auth/garde';
import {
	ATTRIBUTS_DU_COOKIE,
	NOM_DU_COOKIE,
	condensatDeJeton,
	tirerUnJeton
} from '$lib/auth/sessions';
import { BAREME, attendre, etatDesTentatives, finDuBlocage } from '$lib/auth/tentatives';
import { basePartagee } from '$lib/base/acces';
import type { Actions, PageServerLoad } from './$types';

/**
 * `?motif=` → la position de l'axe « Arrivée » de la planche, et `?suite=` → le
 * chemin à restaurer (une valeur externe est remplacée par `/`).
 */
export const load: PageServerLoad = ({ url }) => ({
	arrivee: arriveeDepuisMotif(url.searchParams.get('motif')),
	suite: suiteInterne(url.searchParams.get('suite'))
});

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const champs = await request.formData();
		const identifiant = String(champs.get('identifiant') ?? '');
		const motdepasse = String(champs.get('motdepasse') ?? '');
		/* La case du gel n'a pas d'attribut `name` (`V-05:582`) : sa présence
		   suffit, quelle que soit la valeur qu'un client lui donnera. */
		const souvenir = champs.get('souvenir') !== null;

		/* RG-M16-01 — « depuis une même origine ». `getClientAddress()` rend
		   l'adresse de l'appelant telle que l'adaptateur la voit. DERRIÈRE LE
		   FRONTAL, CE N'EST PAS CELLE DU CLIENT : voir l'écart au rapport du lot. */
		const origine = getClientAddress();
		const base = basePartagee();
		const maintenant = new Date();

		const etat = etatDesTentatives(await tentativesDeLOrigine(base, origine), maintenant);

		/* Déjà bloquée : rien n'est évalué, et rien n'est compté. Le gel fait de
		   même — le formulaire est désactivé, donc aucune soumission ne part
		   (`V-05:714`, `champs.disabled = true`). */
		if (etat.bloquee) {
			return fail(429, { issue: 'trop', secondes: etat.secondesRestantes });
		}

		/* Le ralentissement s'applique AVANT toute évaluation : il ne dépend donc
		   pas de ce qui va échouer, et il n'ajoute aucun écart de temps entre un
		   identifiant inconnu et un mot de passe faux (ARB-005). */
		await attendre(etat.attenteSecondes);

		if (etat.ouvreLeBlocage) {
			const jusqua = finDuBlocage(maintenant);
			await enregistrerLaTentative(base, {
				origine,
				reussie: false,
				attenteSecondes: etat.attenteSecondes,
				blocageJusquA: jusqua
			});
			return fail(429, { issue: 'trop', secondes: BAREME.blocageEnSecondes });
		}

		const compte = await compteParIdentifiant(base, identifiant);
		const decision = await authentifier(compte, motdepasse);

		await enregistrerLaTentative(base, {
			origine,
			reussie: decision.reussie,
			attenteSecondes: etat.attenteSecondes,
			blocageJusquA: null
		});

		if (!decision.reussie) {
			/* Un seul et même retour, quelle que soit la cause : identifiant
			   inconnu, compte désactivé, mot de passe faux, aucun mot de passe
			   posé. Même code, même corps, mêmes en-têtes (`V-05:691-696`). */
			return fail(401, { issue: 'echec' });
		}

		const jeton = tirerUnJeton();
		await ouvrirUneSession(base, decision.identite.compteId, condensatDeJeton(jeton), souvenir);
		cookies.set(NOM_DU_COOKIE, jeton, ATTRIBUTS_DU_COOKIE);

		/* §5.2 — « après connexion : {suite} si présent, sinon / ». 303 et non
		   302 : la requête était un POST, et la cible se lit en GET. */
		redirect(303, cibleApresConnexion(url.searchParams.get('suite')));
	}
};
