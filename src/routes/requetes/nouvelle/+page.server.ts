import { randomUUID } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { ErreurDeRequete, deposerRequete } from '$lib/donnees/requetes';
import { erreursDuDepot } from '$lib/requetes/modele';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ url }) => ({
	idDepot: randomUUID(),
	recherche: url.searchParams.get('q') ?? ''
});
export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		const champs = await request.formData();
		const sujet = String(champs.get('sujet') ?? '').replace(/\r\n?/g, '\n');
		const besoin = String(champs.get('besoin') ?? '').replace(/\r\n?/g, '\n');
		const idDepot = String(champs.get('idDepot') ?? '');
		const erreurs = erreursDuDepot(sujet, besoin);
		if (Object.keys(erreurs).length) return fail(400, { erreurs, sujet, besoin, idDepot });
		try {
			await deposerRequete(basePartagee(), locals.identite, {
				id: idDepot,
				sujet,
				besoin,
				recherche: url.searchParams.get('q') ?? ''
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
