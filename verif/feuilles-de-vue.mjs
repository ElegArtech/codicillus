#!/usr/bin/env node
/**
 * feuilles-de-vue — P-6.3, l'identité à l'octet des feuilles de vue portées.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI la règle qu'il
 * applique. La seule sortie légitime d'un rouge est le protocole d'écart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QU'IL CONTRÔLE, ET POURQUOI LA CONTRAINTE EST RENVERSÉE
 *
 * `docs/ecarts/ECART-011.md` É-2 a mesuré l'incompatibilité : le second bloc
 * `<style>` de V-37 — 782 lignes de style propre à la vue, que la conformité
 * pixel oblige à porter TEL QUEL — produit 94 constats `verif:jetons`. Aucun
 * de ces littéraux n'a d'équivalent parmi les 70 jetons du socle : `13px`
 * n'est pas un pas de `--e-*`, `#f6e9a8` n'existe nulle part, `90ms` n'est pas
 * un `--m-*`. Les remplacer déplace le rendu ; les garder rend la batterie
 * rouge. Les deux contraintes sont vraies et incompatibles.
 *
 * La résolution n'assouplit rien : elle RENVERSE et RESSERRE. Une feuille de
 * vue portée d'une maquette gelée doit être IDENTIQUE À L'OCTET au second bloc
 * `<style>` de sa maquette, contrôlée mécaniquement comme P-6.1 le fait déjà
 * pour le socle. Dans ce bloc vérifié, les contrôles de contenu — P-1, P-4.2,
 * P-6.2 — ne s'appliquent pas : non par tolérance, mais parce qu'« identique
 * au gel » IMPLIQUE et DÉPASSE « n'emploie que des jetons ». Une feuille
 * identique au gel ne peut pas dériver du tout, là où une feuille jetonnée
 * pouvait dériver en restant jetonnée. RA-02 est donc mieux couvert qu'avant.
 *
 * HORS DE CE BLOC, P-1 S'APPLIQUE INTÉGRALEMENT. Toute ligne de CSS qu'un
 * agent écrit lui-même reste soumise à la règle entière : c'est la seconde
 * moitié de la résolution, et c'est elle qui interdit de faire passer du style
 * rédigé à la main pour du style porté.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA CONVENTION DE NOMMAGE EST LE VERROU, ET ELLE NE S'ÉVADE PAS
 *
 * Est une feuille de vue portée TOUT fichier de `src/**` nommé `V-xx.css`, et
 * rien d'autre. Deux évasions sont donc fermées, dans les deux sens :
 *
 *   • rédiger sa propre feuille et la nommer `V-37.css` — elle n'est pas
 *     identique au gel, P-6.3 la nomme, ET P-1 continue de s'y appliquer ;
 *   • porter le bloc de la maquette sous un autre nom (`coquille.css`) — le
 *     fichier n'est pas reconnu comme porté, et P-1 y relève ses 94 constats.
 *
 * La seule façon d'être vert est donc de porter le bloc TEL QUEL, sous son
 * nom de vue. C'est exactement ce que la conformité pixel exige.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Usage :
 *   node verif/feuilles-de-vue.mjs                  état des feuilles portées
 *   node verif/feuilles-de-vue.mjs V-37 --installer installe src/vues/V-37.css
 *   node verif/feuilles-de-vue.mjs --verifier       ne touche à rien, compare
 *
 * Le mode `--installer` existe pour la même raison que `pnpm socle:extraire` :
 * une feuille portée ne se recopie pas à la main. Elle s'extrait
 * mécaniquement de la maquette gelée, à chaque fois qu'on le demande.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE_MAQUETTES = join(racine, 'mockups');

/** Le répertoire d'installation par défaut d'une feuille portée. */
export const DOSSIER_VUES = join('src', 'vues');

/** Est une feuille de vue portée tout fichier `src/**` nommé exactement `V-xx.css`. */
export const RE_FEUILLE = /^(V-\d\d)\.css$/;

const empreinte = (donnees) => createHash('sha256').update(donnees).digest('hex');

/** Lit `mockups/GEL.md` — l'extraction est ancrée sur le gel, comme le socle. */
function lireGel() {
	const ligne = /^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{64})`\s*\|\s*(\d+)\s*\|/;
	const table = new Map();
	for (const l of readFileSync(join(RACINE_MAQUETTES, 'GEL.md'), 'utf8').split('\n')) {
		const m = l.match(ligne);
		if (m) table.set(m[1], { empreinte: m[2], octets: Number(m[3]) });
	}
	return table;
}

/** Le fichier de maquette d'une vue — `V-37` → `V-37-coquille.html`. */
export function maquetteDe(vue) {
	const trouve = readdirSync(RACINE_MAQUETTES)
		.filter((f) => f.startsWith(`${vue}-`) && f.endsWith('.html'))
		.sort();
	if (trouve.length !== 1) {
		throw new Error(
			`aucune maquette unique pour ${vue} — ${trouve.length} fichier(s) dans mockups/`
		);
	}
	return trouve[0];
}

/**
 * Rend le SECOND bloc `<style>` d'une maquette gelée — le style propre à la
 * vue, par opposition au premier bloc, qui est le socle (ÉCART-007).
 *
 * Aucune transformation : ni reformatage, ni normalisation de fin de ligne.
 * Le contrôle porte sur les octets ; les produire autrement qu'à l'identique
 * le rendrait invérifiable.
 *
 * @returns {{ contenu: string, lignes: number, maquette: string }}
 */
export function blocDeVue(vue) {
	const fichier = maquetteDe(vue);
	const chemin = join(RACINE_MAQUETTES, fichier);
	const gel = lireGel().get(fichier);
	if (!gel) throw new Error(`mockups/${fichier} n'est pas déclarée au GEL.md`);
	const octets = readFileSync(chemin);
	if (gel.empreinte !== empreinte(octets)) {
		throw new Error(
			`mockups/${fichier} diverge du gel — regel non arbitré.\n` +
				`  gelée : ${gel.empreinte}\n  lue   : ${empreinte(octets)}\n` +
				`  L'extraction est refusée : voir pnpm verif:gel.`
		);
	}

	const html = octets.toString('utf8');
	const premier = html.indexOf('<style');
	if (premier === -1) throw new Error(`aucun bloc <style> dans mockups/${fichier}`);
	const finPremier = html.indexOf('</style>', premier);
	const second = html.indexOf('<style', finPremier);
	if (second === -1) {
		throw new Error(
			`mockups/${fichier} ne porte qu'un bloc <style> : elle n'a pas de feuille de vue ` +
				'propre, il n’y a rien à porter.'
		);
	}
	const debut = html.indexOf('>', second) + 1;
	const fin = html.indexOf('</style>', debut);
	if (fin === -1) throw new Error(`second bloc <style> non refermé dans mockups/${fichier}`);

	const contenu = html.slice(debut, fin);
	return { contenu, lignes: contenu.split('\n').length, maquette: `mockups/${fichier}` };
}

/** Parcourt `src/` et rend les feuilles de vue portées, triées. */
export function feuillesPortees() {
	const trouvees = [];
	const base = join(racine, 'src');
	const descendre = (dossier) => {
		for (const entree of readdirSync(dossier)) {
			if (entree === 'node_modules' || entree.startsWith('.')) continue;
			const chemin = join(dossier, entree);
			if (statSync(chemin).isDirectory()) descendre(chemin);
			else {
				const m = RE_FEUILLE.exec(basename(entree));
				if (m) trouvees.push({ vue: m[1], chemin });
			}
		}
	};
	if (existsSync(base)) descendre(base);
	return trouvees.sort((a, b) => a.chemin.localeCompare(b.chemin));
}

/** Premier écart ligne à ligne entre deux textes — un message exploitable. */
export function premiereDivergence(attendu, obtenu) {
	const a = attendu.split('\n');
	const b = obtenu.split('\n');
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if (a[i] !== b[i]) {
			return {
				ligne: i + 1,
				attendue: a[i] ?? '(la feuille portée s’arrête avant)',
				obtenue: b[i] ?? '(la feuille portée s’arrête avant)',
				lignes: [a.length, b.length]
			};
		}
	}
	return null;
}

/**
 * Contrôle P-6.3 sur toutes les feuilles portées présentes.
 * @returns {{ feuilles: Array, ecarts: Array }}
 */
export function verifier() {
	const feuilles = [];
	const ecarts = [];
	for (const { vue, chemin } of feuillesPortees()) {
		const relatif = relative(racine, chemin).split('\\').join('/');
		let attendu;
		try {
			attendu = blocDeVue(vue);
		} catch (erreur) {
			ecarts.push({ vue, fichier: relatif, ligne: 0, motif: erreur.message });
			feuilles.push({ vue, fichier: relatif, chemin, identique: false });
			continue;
		}
		const obtenu = readFileSync(chemin, 'utf8');
		const identique = obtenu === attendu.contenu;
		feuilles.push({
			vue,
			fichier: relatif,
			chemin,
			identique,
			maquette: attendu.maquette,
			lignes: attendu.lignes
		});
		if (!identique) {
			const d = premiereDivergence(attendu.contenu, obtenu);
			ecarts.push({
				vue,
				fichier: relatif,
				ligne: d?.ligne ?? 0,
				motif:
					`la feuille de vue portée diverge du second bloc <style> de ${attendu.maquette} — ` +
					'une feuille portée est identique À L’OCTET à sa maquette gelée (P-6.3)',
				detail: d
			});
		}
	}
	return { feuilles, ecarts };
}

/** Installe la feuille d'une vue depuis sa maquette gelée. */
export function installer(vue, dossier = DOSSIER_VUES) {
	const { contenu, lignes, maquette } = blocDeVue(vue);
	const cible = join(racine, dossier, `${vue}.css`);
	mkdirSync(dirname(cible), { recursive: true });
	writeFileSync(cible, Buffer.from(contenu, 'utf8'));
	return { cible: relative(racine, cible).split('\\').join('/'), lignes, maquette };
}

// ── Exécution directe ──────────────────────────────────────────────────────
if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
	const args = process.argv.slice(2);
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	try {
		if (args.includes('--installer')) {
			if (!demandees.length) {
				console.error('feuilles-de-vue --installer — nommez au moins une vue (V-xx).');
				process.exit(2);
			}
			for (const vue of demandees) {
				const { cible, lignes, maquette } = installer(vue);
				console.log(`feuilles-de-vue — ${cible} installé : ${lignes} lignes, depuis ${maquette}`);
			}
			process.exit(0);
		}

		const { feuilles, ecarts } = verifier();
		if (feuilles.length === 0) {
			console.log(
				'feuilles-de-vue — aucune feuille de vue portée dans src/.\n' +
					`  Convention : ${DOSSIER_VUES}/V-xx.css, identique à l’octet au second bloc\n` +
					'  <style> de mockups/V-xx-*.html (P-6.3, docs/DESIGN.md §5).'
			);
			process.exit(0);
		}
		for (const f of feuilles) {
			console.log(
				`  ${f.fichier} — ${f.identique ? `identique au gel (${f.lignes} lignes)` : 'DIVERGENTE'}`
			);
		}
		if (ecarts.length) {
			console.error(`\nfeuilles-de-vue — ÉCHEC : ${ecarts.length} feuille(s) divergente(s).`);
			for (const e of ecarts) {
				console.error(`  ${e.fichier}:${e.ligne} — ${e.motif}`);
				if (e.detail) {
					console.error(`      attendue : ${e.detail.attendue}`);
					console.error(`      obtenue  : ${e.detail.obtenue}`);
				}
			}
			process.exit(1);
		}
		console.log('\nfeuilles-de-vue — conforme.');
		process.exit(0);
	} catch (erreur) {
		console.error(`feuilles-de-vue — ÉCHEC : ${erreur.message}`);
		process.exit(1);
	}
}
