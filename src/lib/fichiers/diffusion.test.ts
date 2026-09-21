import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffuserLaPiece, plageDeLecture } from './diffusion';
import { ecrireLesOctets } from './entrepot';
import { formeDeLecture, seLitEnLigne } from './affichage';

const temporaires: string[] = [];
afterEach(async () => {
	await Promise.all(temporaires.splice(0).map((p) => rm(p, { recursive: true, force: true })));
});

describe('lecture des vidéos', () => {
	it.each(['video/mp4', 'video/webm'])('ouvre %s en ligne', (type) => {
		expect(formeDeLecture(type)).toBe('video');
		expect(seLitEnLigne(type)).toBe(true);
	});
	it.each([
		['bytes=2-4', { debut: 2, fin: 4 }],
		['bytes=6-', { debut: 6, fin: 9 }],
		['bytes=-3', { debut: 7, fin: 9 }],
		['bytes=7-999', { debut: 7, fin: 9 }],
		['bytes=10-', 'insatisfaisable'],
		['bytes=5-2', 'insatisfaisable'],
		['bytes=-0', 'insatisfaisable'],
		['bytes=1-2,4-5', null],
		['invalide', null]
	])('interprète %s', (valeur, attendu) => {
		expect(plageDeLecture(valeur, 10)).toEqual(attendu);
	});
	it('diffuse les octets demandés, la fin et les en-têtes sans corps', async () => {
		const racine = await mkdtemp(join(tmpdir(), 'codicillus-video-'));
		temporaires.push(racine);
		const piece = {
			noteId: '00000000-0000-0000-0000-000000000001',
			id: '00000000-0000-0000-0000-000000000002',
			nom: 'Vidéo.mp4',
			typeMedia: 'video/mp4'
		};
		await ecrireLesOctets(
			racine,
			piece.noteId,
			piece.id,
			new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
		);
		const lire = (range?: string, method = 'GET') =>
			diffuserLaPiece(
				racine,
				piece,
				new Request('http://localhost/video', { method, headers: range ? { range } : {} }),
				true
			);
		const partielle = await lire('bytes=2-4');
		expect(partielle?.status).toBe(206);
		expect(partielle?.headers.get('content-range')).toBe('bytes 2-4/10');
		expect(partielle?.headers.get('content-length')).toBe('3');
		expect(Array.from(new Uint8Array(await partielle!.arrayBuffer()))).toEqual([2, 3, 4]);
		const fin = await lire('bytes=-2');
		expect(Array.from(new Uint8Array(await fin!.arrayBuffer()))).toEqual([8, 9]);
		const hors = await lire('bytes=10-');
		expect(hors?.status).toBe(416);
		expect(hors?.headers.get('content-range')).toBe('bytes */10');
		const tete = await lire(undefined, 'HEAD');
		expect(tete?.headers.get('content-length')).toBe('10');
		expect(tete?.body).toBeNull();
		const complete = await lire();
		expect(complete?.status).toBe(200);
		expect((await complete!.arrayBuffer()).byteLength).toBe(10);
	});
});
