/**
 * Banc de comparaison visuelle — lecture des sources d'inventaire.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Deux sources, et une confrontation.
 *
 *   • `mockups/*.html` — la maquette gelée, seule source d'autorité. Ce qui en
 *     est tiré l'est par lecture du DOM rendu, jamais par rédaction à la main.
 *   • `docs/routes.md` — l'inventaire du lot T-006, qui a fait le même travail
 *     à partir de la même source.
 *
 * Quand les deux divergent, LE BANC NE TRANCHE PAS : il signale. Une
 * divergence entre deux dérivations d'une même source gelée est un signal, pas
 * un détail de comptage.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RACINE_MAQUETTES = join(racine, 'mockups');

/** Les 41 fichiers de vue, dans l'ordre de leur numéro. */
export function vues() {
	return readdirSync(RACINE_MAQUETTES)
		.filter((f) => /^V-\d\d-.*\.html$/.test(f))
		.sort()
		.map((fichier) => ({
			vue: fichier.slice(0, 4),
			fichier,
			chemin: join(RACINE_MAQUETTES, fichier)
		}));
}

/** Empreinte SHA-256 d'un fichier de maquette — la même que `mockups/GEL.md`. */
export function empreinte(chemin) {
	return createHash('sha256').update(readFileSync(chemin)).digest('hex');
}

/**
 * Extrait de `docs/routes.md` ce que le lot T-006 déclare pour chaque vue :
 * ses routes et son décompte d'états.
 *
 * La lecture est volontairement naïve — elle ne connaît qu'une règle : dans
 * une ligne de tableau qui cite `**V-xx**`, la première cellule porte la route
 * et une cellule porte le décompte sous la forme `N — libellé · libellé…`.
 * Une source de vérité qui exigerait un analyseur savant ne serait pas une
 * source de vérité.
 */
export function declareParRoutes() {
	const texte = readFileSync(join(racine, 'docs', 'routes.md'), 'utf8');
	const parVue = new Map();

	for (const ligne of texte.split('\n')) {
		if (!ligne.startsWith('|')) continue;
		const cellules = ligne
			.split('|')
			.slice(1, -1)
			.map((c) => c.trim());
		const marque = ligne.match(/\*\*(V-\d\d)\*\*/);
		if (!marque) continue;
		const vue = marque[1];

		const entree = parVue.get(vue) ?? { vue, routes: [], etats: 0, libelles: [] };

		// Route : première cellule, si elle porte une adresse entre accents graves.
		for (const r of cellules[0].matchAll(/`([^`]+)`/g)) {
			if (r[1].startsWith('/') && !entree.routes.includes(r[1])) entree.routes.push(r[1]);
		}

		// Décompte d'états. Quatre formes coexistent dans `docs/routes.md` :
		//   `7 — …` · `4 des 8 — …` · `11 familles — …`
		//   `6 *(aucune planche ; six états côte à côte…)* — …`
		const DECOMPTE = /^(\d+)(?: des \d+)?(?: familles)?\s*(?:\*?\([^)]*\)\*?\s*)?—\s*/;
		const cellule = cellules.find((c) => DECOMPTE.test(c));
		if (cellule) {
			const n = Number(cellule.match(DECOMPTE)[1]);
			entree.etats += n;
			const corps = cellule.replace(DECOMPTE, '');
			for (const groupe of corps.split(' ; ')) {
				const [tete, suite] = groupe.includes(' : ') ? groupe.split(' : ') : [null, groupe];
				for (const item of suite.split(' · ')) {
					entree.libelles.push((tete ? `${tete} : ` : '') + item.replace(/\*|_/g, '').trim());
				}
			}
		}

		parVue.set(vue, entree);
	}

	return parVue;
}
