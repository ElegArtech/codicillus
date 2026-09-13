import { basePartagee } from '$lib/base/acces';
import { listeAdministrativeDeRequetes, domainesDeRequete } from '$lib/donnees/requetes';
import { erreurDeRoute } from '$lib/requetes/serveur';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
	try {
		const requetes = await listeAdministrativeDeRequetes(basePartagee(), locals.identite);
		return { requetes, domainesDeRequete: await domainesDeRequete(basePartagee()) };
	} catch (cause) {
		erreurDeRoute(cause);
	}
};
