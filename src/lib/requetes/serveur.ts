import { error } from '@sveltejs/kit';
import { ErreurDeRequete } from '$lib/donnees/requetes';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
export function erreurDeRoute(cause: unknown): never {
	if (cause instanceof ErreurDeRequete)
		error(cause.statut, cause.statut === 404 ? MESSAGE_INTROUVABLE : cause.message);
	throw cause;
}
