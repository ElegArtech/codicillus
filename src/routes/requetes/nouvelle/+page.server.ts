import { randomUUID } from 'node:crypto';
import { fail } from '@sveltejs/kit';
import { redirect } from '$lib/redirection';
import { basePartagee } from '$lib/base/acces';
import { ErreurDeRequete, deposerRequete } from '$lib/donnees/requetes';
import { erreursDuDepot } from '$lib/requetes/modele';
import { creerUnPlafond } from '$lib/auth/plafond';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ url }) => ({
	idDepot: randomUUID(),
	recherche: url.searchParams.get('q') ?? ''
});
/* Cinq dépôts par quart d'heure et par origine : le formulaire est ouvert à tout
   Internet, et rien d'autre ne retenait un robot. */
const plafond = creerUnPlafond(5, 15 * 60 * 1000);

export const actions: Actions = {
	default: async ({ locals, request, url, getClientAddress }) => {
		const champs = await request.formData();
		const sujet = String(champs.get('sujet') ?? '').replace(/\r\n?/g, '\n');
		const besoin = String(champs.get('besoin') ?? '').replace(/\r\n?/g, '\n');
		const idDepot = String(champs.get('idDepot') ?? '');
		const erreurs = erreursDuDepot(sujet, besoin);
		if (Object.keys(erreurs).length) return fail(400, { erreurs, sujet, besoin, idDepot });
		if (!plafond.admettre(getClientAddress())) {
			return fail(429, {
				erreurs: { sujet: 'Trop de requêtes envoyées. Réessayez dans quelques minutes.' },
				sujet,
				besoin,
				idDepot
			});
		}
		try {
			await deposerRequete(basePartagee(), locals.identite, {
				id: idDepot,
				sujet,
				besoin,
				recherche: (url.searchParams.get('q') ?? '').slice(0, 500)
			});
		} catch (cause) {
			if (cause instanceof ErreurDeRequete)
				return fail(400, {
					erreurs: { sujet: 'Cet envoi n’est plus valide. Rechargez le formulaire.' },
					sujet,
					besoin,
					idDepot
				});
			throw cause;
		}
		redirect(303, '/requetes/transmise');
	}
};
