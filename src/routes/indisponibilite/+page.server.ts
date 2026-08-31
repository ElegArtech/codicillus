/**
 * `/indisponibilite` — LA PAGE D'INDISPONIBILITÉ PROGRAMMÉE, `RG-NF-10`.
 *
 * C'est ici que `hooks.server.ts` renvoie tout appelant non administrateur tant que le
 * réglage est actif. La page n'est pas une erreur : elle rend 200 et dit ce qui se passe.
 *
 * INACTIVE, ELLE N'EXISTE PAS : l'adresse renvoie à l'accueil plutôt que d'annoncer une
 * indisponibilité que l'instance ne connaît pas. C'est le pendant exact de la garde —
 * l'état en base décide dans les deux sens.
 */
import { redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import { accesALaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const config = await lireConfiguration(basePartagee());
	if (!config.indisponibiliteActive) redirect(303, '/');

	return {
		message: config.messageDIndisponibilite,
		nomOrganisation: config.nomOrganisation,
		/**
		 * L'ADMINISTRATEUR PEUT ATTEINDRE CETTE PAGE, mais il n'y est jamais renvoyé.
		 * S'il l'ouvre, l'écran lui dit pourquoi il la voit et où se trouve
		 * l'interrupteur — un administrateur qui la découvre par hasard croirait
		 * autrement son instance fermée pour lui aussi.
		 */
		administrateur: accesALaConsole(locals.identite)
	};
};
