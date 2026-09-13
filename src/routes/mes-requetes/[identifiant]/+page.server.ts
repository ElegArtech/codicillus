import { basePartagee } from '$lib/base/acces';
import { maRequete, marquerRequeteLue } from '$lib/donnees/requetes';
import { erreurDeRoute } from '$lib/requetes/serveur';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals, params }) => {
	try {
		return await maRequete(basePartagee(), locals.identite, params.identifiant);
	} catch (cause) {
		erreurDeRoute(cause);
	}
};
export const actions: Actions = {
	lue: async ({ locals, params, request }) => {
		try {
			const champs = await request.formData();
			await marquerRequeteLue(
				basePartagee(),
				locals.identite,
				params.identifiant,
				Number(champs.get('revision'))
			);
			return { lue: true };
		} catch (cause) {
			erreurDeRoute(cause);
		}
	}
};
