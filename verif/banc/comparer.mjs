/**
 * Banc de comparaison visuelle — le protocole en trois niveaux.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Les seuils vivent dans `verif/references/tolerances.json`, en écriture
 * humaine seule. Un agent bloqué sur un rouge ne les modifie jamais.
 *
 * PLAN §4.2, les trois niveaux, appliqués dans l'ordre du moins coûteux au
 * plus coûteux :
 *
 *   1 — STRUCTURE. Écart = échec sec, aucune tolérance. On ne descend pas au
 *       niveau 2 : comparer les pixels de deux arbres différents ne dirait
 *       rien d'utile.
 *   2 — PIXELS. Seuil de canal, puis proportion de pixels différents.
 *   3 — JUGEMENT. Ce module ne l'arbitre pas — il n'en a pas les moyens et
 *       ce n'est pas son rôle. Il PRÉPARE le dossier (les deux captures,
 *       l'image d'écart, le libellé) et COMPTE le recours. Le compte est le
 *       vrai livrable du niveau 3 : un taux de recours qui monte d'une vague
 *       à l'autre dit que le protocole de capture dérive.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { racine } from './inventaire.mjs';
import { decoder, encoder, image, coller } from './png.mjs';

export const TOLERANCES = JSON.parse(
	readFileSync(join(racine, 'verif', 'references', 'tolerances.json'), 'utf8')
);

/** Niveau 1 — structure. Aucune tolérance. */
export function comparerStructure(reference, candidat) {
	const ecarts = [];
	if (reference.aria !== candidat.aria) {
		ecarts.push({
			quoi: 'instantané ARIA',
			detail: premiereDivergence(reference.aria.split('\n'), candidat.aria.split('\n'))
		});
	}
	const a = reference.tabulation;
	const b = candidat.tabulation;
	if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
		ecarts.push({
			quoi: 'ordre de tabulation',
			detail: premiereDivergence(a, b),
			longueurs: [a.length, b.length]
		});
	}
	return { conforme: ecarts.length === 0, ecarts };
}

function premiereDivergence(a, b) {
	const n = Math.max(a.length, b.length);
	for (let i = 0; i < n; i++) {
		if (a[i] !== b[i]) {
			return {
				ligne: i + 1,
				reference: a[i] ?? '(rien)',
				candidat: b[i] ?? '(rien)'
			};
		}
	}
	return null;
}

/**
 * Niveau 2 — pixels.
 *
 * Un pixel est « différent » quand l'écart d'au moins un de ses canaux dépasse
 * le seuil de canal. Le seuil est en proportion de la pleine échelle, comme
 * l'écrit PLAN §4.2 (« seuil de canal 3 % »), donc 7,65 valeurs sur 255.
 */
export function comparerPixels(pngReference, pngCandidat) {
	const r = decoder(pngReference);
	const c = decoder(pngCandidat);

	if (r.largeur !== c.largeur || r.hauteur !== c.hauteur) {
		return {
			verdict: 'echec',
			motif: 'dimensions divergentes',
			dimensions: {
				reference: `${r.largeur}×${r.hauteur}`,
				candidat: `${c.largeur}×${c.hauteur}`
			},
			pixelsDifferents: null,
			proportion: null,
			ecart: null
		};
	}

	const seuil = Math.round(TOLERANCES.niveau2.seuil_canal * 255);
	const total = r.largeur * r.hauteur;
	const ecart = image(r.largeur, r.hauteur, [255, 255, 255, 255]);
	let differents = 0;
	let maxEcartCanal = 0;

	for (let i = 0; i < total; i++) {
		const p = i * 4;
		const dr = Math.abs(r.donnees[p] - c.donnees[p]);
		const dv = Math.abs(r.donnees[p + 1] - c.donnees[p + 1]);
		const db = Math.abs(r.donnees[p + 2] - c.donnees[p + 2]);
		const da = Math.abs(r.donnees[p + 3] - c.donnees[p + 3]);
		const d = Math.max(dr, dv, db, da);
		if (d > maxEcartCanal) maxEcartCanal = d;
		if (d > seuil) {
			differents++;
			ecart.donnees[p] = 255;
			ecart.donnees[p + 1] = 0;
			ecart.donnees[p + 2] = 255;
		} else {
			// Le fond de l'image d'écart est la référence, éclaircie : elle situe
			// les taches roses sans jamais se confondre avec elles.
			ecart.donnees[p] = 200 + (r.donnees[p] >> 2);
			ecart.donnees[p + 1] = 200 + (r.donnees[p + 1] >> 2);
			ecart.donnees[p + 2] = 200 + (r.donnees[p + 2] >> 2);
		}
	}

	const proportion = total === 0 ? 0 : differents / total;
	const verdict =
		proportion <= TOLERANCES.niveau2.conforme_au_plus
			? 'conforme'
			: proportion > TOLERANCES.niveau2.echec_au_dela
				? 'echec'
				: 'niveau3';

	return {
		verdict,
		motif: null,
		pixelsDifferents: differents,
		pixelsTotal: total,
		proportion,
		ecartCanalMax: maxEcartCanal,
		dimensions: { reference: `${r.largeur}×${r.hauteur}`, candidat: `${c.largeur}×${c.hauteur}` },
		ecart: encoder(ecart)
	};
}

/**
 * Niveau 2 sur une ZONE, dont la restitution elle-même peut différer.
 *
 * Une zone déclarée peut n'être rendue à aucune surface — `aside.rail` de V-37
 * sous 1240 px, que la maquette escamote inconditionnellement (ARB-010). Le
 * fait est alors : « cette zone n'est pas rendue ». C'est une propriété
 * comparable, et elle doit l'être : une application qui afficherait le rail là
 * où la maquette ne l'affiche pas divergerait, sans qu'aucun pixel ne puisse
 * en témoigner.
 *
 *   • rendue des deux côtés   — comparaison de pixels ordinaire ;
 *   • non rendue des deux côtés — conforme, sans pixel comparé, et le rapport
 *     le dit plutôt que de laisser croire à une comparaison ;
 *   • rendue d'un seul côté    — échec sec. Aucun seuil ne s'applique à une
 *     divergence de cette nature.
 */
export function comparerZone(reference, candidat) {
	if (!reference.png && !candidat.png) {
		return {
			verdict: 'conforme',
			motif: null,
			nonRendue: true,
			pixelsDifferents: 0,
			pixelsTotal: 0,
			proportion: 0,
			ecartCanalMax: 0,
			dimensions: { reference: 'non rendue', candidat: 'non rendue' },
			ecart: null
		};
	}
	if (!reference.png || !candidat.png) {
		return {
			verdict: 'echec',
			motif: reference.png
				? 'zone rendue par la maquette, absente du candidat'
				: 'zone absente de la maquette, rendue par le candidat',
			nonRendue: false,
			pixelsDifferents: null,
			pixelsTotal: null,
			proportion: null,
			ecartCanalMax: null,
			dimensions: {
				reference: reference.png ? 'rendue' : 'non rendue',
				candidat: candidat.png ? 'rendue' : 'non rendue'
			},
			ecart: null
		};
	}
	return { ...comparerPixels(reference.png, candidat.png), nonRendue: false };
}

/** Assemble les deux captures côte à côte, séparées par un filet. */
export function coteACote(pngReference, pngCandidat) {
	const r = decoder(pngReference);
	const c = decoder(pngCandidat);
	const filet = 8;
	const planche = image(
		r.largeur + filet + c.largeur,
		Math.max(r.hauteur, c.hauteur),
		[20, 30, 36, 255]
	);
	coller(planche, r, 0, 0);
	coller(planche, c, r.largeur + filet, 0);
	return encoder(planche);
}
