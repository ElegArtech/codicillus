import { basePartagee } from '$lib/base/acces';
import { journalDeRequetes } from '$lib/donnees/requetes';
import { erreurDeRoute } from '$lib/requetes/serveur';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
	try {
		return { journal: await journalDeRequetes(basePartagee(), locals.identite) };
	} catch (cause) {
		erreurDeRoute(cause);
	}
};
