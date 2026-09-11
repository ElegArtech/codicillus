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
import type { RequestHandler } from './$types';

const TYPES_D_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function typeReel(octets: Uint8Array): string | null {
	if (
		octets.length >= 8 &&
		octets[0] === 0x89 &&
		octets[1] === 0x50 &&
		octets[2] === 0x4e &&
		octets[3] === 0x47 &&
		octets[4] === 0x0d &&
		octets[5] === 0x0a &&
		octets[6] === 0x1a &&
		octets[7] === 0x0a
	)
		return 'image/png';
	if (octets.length >= 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) {
		return 'image/jpeg';
	}
	if (
		octets.length >= 12 &&
		String.fromCharCode(...octets.slice(0, 4)) === 'RIFF' &&
		String.fromCharCode(...octets.slice(8, 12)) === 'WEBP'
	)
		return 'image/webp';
	return null;
}

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const fichier = (await request.formData()).get('fichier');
	if (!(fichier instanceof File) || fichier.size === 0) {
		return json({ motif: 'Choisissez une image à déposer.' }, { status: 400 });
	}
	if (!TYPES_D_IMAGES.has(fichier.type)) {
		return json({ motif: 'Formats acceptés : JPEG, PNG et WebP.' }, { status: 400 });
	}
	const octets = new Uint8Array(await fichier.arrayBuffer());
	const reconnu = typeReel(octets);
	if (reconnu === null || reconnu !== fichier.type) {
		return json(
			{ motif: 'Le contenu du fichier ne correspond pas à une image valide.' },
			{ status: 400 }
		);
	}
	try {
		const fait = await deposerUnePieceJointe(basePartagee(), racineDesFichiers(env), {
			note: params.identifiant,
			nom: fichier.name,
			typeMedia: reconnu,
			octets,
			identite: locals.identite
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return json({ adresse: fait.ressource.adresse, nom: fait.ressource.nom });
	} catch (cause) {
		if (
			cause instanceof PieceTropVolumineuse ||
			cause instanceof NomDePieceDejaPris ||
			cause instanceof NomDePieceVide
		)
			return json({ motif: cause.message }, { status: 400 });
		throw cause;
	}
};
