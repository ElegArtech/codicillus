import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	deposerUnePieceJointe,
	NomDePieceDejaPris,
	NomDePieceVide,
	PieceTropVolumineuse
} from '$lib/donnees/pieces';
import { racineDesFichiers } from '$lib/fichiers/entrepot';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { ImageRefusee, lireImage } from '$lib/edition/images-serveur';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	try {
		const image = await lireImage((await request.formData()).get('fichier'));
		const fait = await deposerUnePieceJointe(basePartagee(), racineDesFichiers(env), {
			note: params.identifiant,
			nom: image.nom,
			typeMedia: image.typeMedia,
			octets: image.octets,
			identite: locals.identite
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return json({ adresse: fait.ressource.adresse, nom: fait.ressource.nom });
	} catch (cause) {
		if (
			cause instanceof ImageRefusee ||
			cause instanceof PieceTropVolumineuse ||
			cause instanceof NomDePieceDejaPris ||
			cause instanceof NomDePieceVide
		)
			return json({ motif: cause.message }, { status: 400 });
		throw cause;
	}
};
