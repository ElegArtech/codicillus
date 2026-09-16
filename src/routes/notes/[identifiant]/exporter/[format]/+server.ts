/** Téléchargement d'une note seule, dans le registre actuellement affiché. */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaNote, registreDemande } from '$lib/donnees/note';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import {
	exporterLeRegistreEnMarkdown,
	exporterLeRegistreEnPdf,
	nomDuRegistreExporte
} from '$lib/export/note';
import type { RequestHandler } from './$types';

function disposition(nom: string): string {
	const repli = nom
		.normalize('NFKD')
		.replace(/[^\x20-\x7e]/gu, '')
		.replace(/["\\]/gu, '-');
	return `attachment; filename="${repli}"; filename*=UTF-8''${encodeURIComponent(nom)}`;
}

export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (params.format !== 'markdown' && params.format !== 'pdf') {
		error(404, MESSAGE_INTROUVABLE);
	}

	const base = basePartagee();
	const maintenant = new Date();
	const registre = registreDemande(url.searchParams.get('registre'));
	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre,
		identite: locals.identite,
		contexte: { maintenant, seuils: await lireSeuils(base) }
	});
	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);

	const lecture = resolution.ressource;
	const entree = {
		titre: lecture.note.titre,
		registre,
		document:
			registre === 'reference' ? lecture.documents.reference : lecture.documents.operationnel
	};
	const pdf = params.format === 'pdf';
	const octets = pdf
		? await exporterLeRegistreEnPdf(entree)
		: new TextEncoder().encode(exporterLeRegistreEnMarkdown(entree));
	const nom = nomDuRegistreExporte(lecture.note.titre, registre, pdf ? 'pdf' : 'md');

	return new Response(octets, {
		headers: {
			'content-type': pdf ? 'application/pdf' : 'text/markdown; charset=utf-8',
			'content-length': String(octets.length),
			'content-disposition': disposition(nom),
			'cache-control': 'private, no-store'
		}
	});
};
