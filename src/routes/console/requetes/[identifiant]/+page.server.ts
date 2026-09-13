import { fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	agirSurRequete,
	detailAdministratifDeRequete,
	domainesDeRequete,
	notesPourRequete,
	ErreurDeRequete
} from '$lib/donnees/requetes';
import { erreurDeRoute } from '$lib/requetes/serveur';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals, params }) => {
	try {
		const base = basePartagee();
		const detail = await detailAdministratifDeRequete(base, locals.identite, params.identifiant);
		const [domainesDisponibles, notesDisponibles] = await Promise.all([
			domainesDeRequete(base),
			notesPourRequete(base, locals.identite)
		]);
		return { ...detail, domainesDisponibles, notesDisponibles };
	} catch (cause) {
		erreurDeRoute(cause);
	}
};
export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		const champs = await request.formData();
		const geste = String(champs.get('geste') ?? '');
		try {
			await agirSurRequete(basePartagee(), locals.identite, params.identifiant, geste, champs);
		} catch (cause) {
			if (cause instanceof ErreurDeRequete && cause.statut !== 404)
				return fail(cause.statut, { erreur: cause.message });
			erreurDeRoute(cause);
		}
		if (geste === 'supprimer') redirect(303, '/console/requetes');
		return { succes: true };
	}
};
