/**
 * Banc de comparaison visuelle — serveur statique des maquettes.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * POURQUOI UN SERVEUR PLUTÔT QUE `file://`. Les 41 maquettes chargent leurs
 * polices par un chemin relatif — `<link rel="stylesheet" href="polices/…">`.
 * Servies depuis `file://`, elles les résolvent tout de même, mais le contexte
 * n'est pas le même que celui de l'application : origine opaque, pas de
 * cache HTTP, `document.fonts` alimenté par un autre chemin. Or PLAN §4.2
 * exige des conditions IDENTIQUES des deux côtés. Les deux côtés sont donc
 * servis en HTTP, par le même code, sur la même boucle locale.
 *
 * Le serveur est en LECTURE SEULE et n'expose que `mockups/` : il ne peut pas
 * servir de chemin d'écriture vers une source gelée.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.woff2': 'font/woff2',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.json': 'application/json; charset=utf-8'
};

/**
 * Démarre un serveur statique sur un port libre.
 * @param {string} racine répertoire servi
 * @returns {Promise<{ origine: string, fermer: () => Promise<void> }>}
 */
export function servir(racine) {
	const serveur = createServer((requete, reponse) => {
		const chemin = decodeURIComponent(new URL(requete.url, 'http://x').pathname);
		// `normalize` puis vérification du préfixe : aucun `..` ne sort de la racine.
		const cible = join(racine, normalize(chemin).replace(/^(\.\.[/\\])+/, ''));
		if (!cible.startsWith(racine)) {
			reponse.writeHead(403).end();
			return;
		}
		let infos;
		try {
			infos = statSync(cible);
		} catch {
			reponse.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
			return;
		}
		if (infos.isDirectory()) {
			reponse.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
			return;
		}
		reponse.writeHead(200, {
			'content-type': TYPES[extname(cible)] ?? 'application/octet-stream',
			'content-length': infos.size,
			// Aucun cache : deux captures successives doivent parcourir le même
			// chemin de chargement, sinon la seconde mesure un cache chaud.
			'cache-control': 'no-store'
		});
		createReadStream(cible).pipe(reponse);
	});

	return new Promise((resoudre) => {
		serveur.listen(0, '127.0.0.1', () => {
			const { port } = serveur.address();
			resoudre({
				origine: `http://127.0.0.1:${port}`,
				fermer: () => new Promise((fini) => serveur.close(fini))
			});
		});
	});
}
