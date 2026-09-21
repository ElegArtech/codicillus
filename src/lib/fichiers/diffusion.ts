import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { cheminDUnePiece, tailleSurDisque } from './entrepot';

/** Une plage simple ; les syntaxes non prises en charge sont ignorées. */
export function plageDeLecture(
	valeur: string | null,
	taille: number
): { debut: number; fin: number } | 'insatisfaisable' | null {
	if (!valeur) return null;
	const forme = /^bytes=(\d*)-(\d*)$/.exec(valeur.trim());
	if (!forme || (!forme[1] && !forme[2])) return null;
	const debut = forme[1] ? Number(forme[1]) : Math.max(0, taille - Number(forme[2]));
	const fin = forme[1] && forme[2] ? Math.min(taille - 1, Number(forme[2])) : taille - 1;
	if (!Number.isSafeInteger(debut) || !Number.isSafeInteger(fin) || debut > fin || debut >= taille)
		return 'insatisfaisable';
	return { debut, fin };
}

/** Diffuse depuis le disque sans charger le fichier entier en mémoire. */
export async function diffuserLaPiece(
	racine: string,
	piece: { noteId: string; id: string; nom: string; typeMedia: string },
	request: Request,
	enLigne: boolean
): Promise<Response | null> {
	const taille = await tailleSurDisque(racine, piece.noteId, piece.id);
	if (taille === null) return null;
	const headers = new Headers({
		'content-type': piece.typeMedia,
		'content-disposition':
			(enLigne ? 'inline' : 'attachment') + "; filename*=UTF-8''" + encodeURIComponent(piece.nom),
		'accept-ranges': 'bytes',
		'x-content-type-options': 'nosniff',
		'cache-control': 'no-store'
	});
	const plage =
		request.method === 'HEAD' || request.headers.has('if-range')
			? null
			: plageDeLecture(request.headers.get('range'), taille);
	if (plage === 'insatisfaisable') {
		headers.set('content-range', `bytes */${taille}`);
		return new Response(null, { status: 416, headers });
	}
	headers.set('content-length', String(plage ? plage.fin - plage.debut + 1 : taille));
	if (plage) headers.set('content-range', `bytes ${plage.debut}-${plage.fin}/${taille}`);
	if (request.method === 'HEAD' || taille === 0)
		return new Response(null, { status: 200, headers });
	const flux = createReadStream(
		cheminDUnePiece(racine, piece.noteId, piece.id),
		plage ? { start: plage.debut, end: plage.fin } : {}
	);
	return new Response(Readable.toWeb(flux) as ReadableStream<Uint8Array>, {
		status: plage ? 206 : 200,
		headers
	});
}
