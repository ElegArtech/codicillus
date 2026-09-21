import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basePartagee } from '$lib/base/acces';
import { resoudreUnePieceJointe } from '$lib/donnees/edition';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import { seLitEnLigne } from '$lib/fichiers/affichage';
import { racineDesFichiers } from '$lib/fichiers/entrepot';
import { diffuserLaPiece } from '$lib/fichiers/diffusion';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	const resolue = await resoudreUnePieceJointe(basePartagee(), {
		identifiant: params.identifiant,
		fichier: params.fichier,
		identite: locals.identite
	});
	if (!resolue.trouve) error(404, MESSAGE_INTROUVABLE);
	const piece = resolue.ressource;

	const reponse = await diffuserLaPiece(
		racineDesFichiers(env),
		piece,
		request,
		seLitEnLigne(piece.typeMedia)
	);
	if (reponse === null) {
		error(
			500,
			'les octets de cette pièce jointe ne sont pas dans l’entrepôt : sa ligne existe ' +
				'en base, son fichier non. La base et le volume des fichiers sont les deux ' +
				'éléments de la sauvegarde (RG-NF-09) et ils sont ici désaccordés.'
		);
	}

	return reponse;
};

export const HEAD = GET;
