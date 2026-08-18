#!/usr/bin/env node
/**
 * extraire-socle — installation contrôlée du socle et des polices.
 *
 * Le système visuel n'est pas recopié à la main : il est **extrait
 * mécaniquement** de la maquette gelée qui le porte, à chaque fois qu'on le
 * demande. Le jour où un regel arbitré modifie la maquette, on rejoue
 * `pnpm socle:extraire` et la non-divergence reste démontrable.
 *
 * ── La source ────────────────────────────────────────────────────────────
 * `mockups/V-07-accueil-contributeur.html`, **premier bloc `<style>`**.
 *
 * Ce n'est PAS `mockups/socle.css` (voir `docs/ecarts/ECART-007.md`) : le
 * fichier autonome est le plus ancien de six états du socle, employé par 4
 * vues sur 41 ; il lui manque toute la section « champs de saisie », les
 * notifications à quatre types, la règle de rôle `.si-admin` et le jeton
 * `--l-large`. Une copie conforme de `socle.css` produirait une application
 * qui ne rend pas 37 vues sur 41.
 *
 * Le socle en ligne de V-07 est le plus complet des six états : 466 lignes,
 * sur-ensemble strict des cinq autres. Son seul écart avec l'état 465
 * (V-14, V-38, V-39, V-40, V-41) est le saut de ligne final.
 *
 * ── Ce que le script installe ────────────────────────────────────────────
 *   1. `src/socle.css`      — le bloc, octet pour octet, sans retouche
 *   2. `static/polices/`    — les trois familles en woff2 + `polices.css`
 *
 * ── Ce que le script ne fait jamais ──────────────────────────────────────
 * Reformater, renommer, « nettoyer ». Les huit valeurs littérales
 * résiduelles recensées par `docs/DESIGN.md` §5 P-1.8 restent telles
 * quelles : ce sont des exceptions énumérées et closes.
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *   node verif/extraire-socle.mjs              installe (écrit)
 *   node verif/extraire-socle.mjs --verifier   ne touche à rien, compare
 *
 * Le mode `--verifier` est la propriété (a) de la batterie 2
 * (`pnpm verif:jetons`) : la feuille applicative est identique, octet pour
 * octet, au socle extrait de la maquette telle que gelée.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/** La maquette porteuse du plus complet des six états du socle (ÉCART-007). */
export const MAQUETTE_SOURCE = 'V-07-accueil-contributeur.html';

/** La feuille applicative : copie contrôlée, importée globalement. */
export const CIBLE_SOCLE = join('src', 'socle.css');

/** Le répertoire d'actifs statiques où les polices sont servies (RG-NF-08). */
export const SOURCE_POLICES = join('mockups', 'polices');
export const CIBLE_POLICES = join('static', 'polices');

/**
 * Garde-fou de structure : le bloc extrait doit commencer par la bannière du
 * socle. Si la maquette est restructurée, on veut un refus bruyant, pas un
 * fichier silencieusement faux.
 */
const BANNIERE = 'CODICILLUS — SOCLE';

/** Repères de non-régression, contrôlés à chaque extraction (ÉCART-007). */
const ATTENDU = { lignes: 466, jetons: 70 };

const empreinte = (donnees) => createHash('sha256').update(donnees).digest('hex');

/**
 * Lit `mockups/GEL.md` et rend la table `fichier → { empreinte, octets }`.
 * L'extraction est ancrée sur le gel : on n'extrait pas d'une maquette qui a
 * bougé sans arbitrage.
 */
export function lireGel() {
	const ligne = /^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{64})`\s*\|\s*(\d+)\s*\|/;
	const table = new Map();
	for (const l of readFileSync(join(racine, 'mockups', 'GEL.md'), 'utf8').split('\n')) {
		const m = l.match(ligne);
		if (m) table.set(m[1], { empreinte: m[2], octets: Number(m[3]) });
	}
	return table;
}

/**
 * Isole le premier bloc `<style>` de la maquette source et en rend le contenu
 * brut — sans la moindre transformation.
 *
 * @returns {{ contenu: string, lignes: number, jetons: number, empreinteSource: string }}
 */
export function extraireSocle() {
	const chemin = join(racine, 'mockups', MAQUETTE_SOURCE);
	if (!existsSync(chemin)) {
		throw new Error(`maquette source absente : mockups/${MAQUETTE_SOURCE}`);
	}
	const html = readFileSync(chemin, 'utf8');

	// Ancrage sur le gel : la source doit être celle qui a été gelée.
	const gel = lireGel().get(MAQUETTE_SOURCE);
	const empreinteSource = empreinte(readFileSync(chemin));
	if (!gel) {
		throw new Error(`mockups/${MAQUETTE_SOURCE} n'est pas déclarée au GEL.md`);
	}
	if (gel.empreinte !== empreinteSource) {
		throw new Error(
			`mockups/${MAQUETTE_SOURCE} diverge du gel — regel non arbitré.\n` +
				`  gelée  : ${gel.empreinte}\n  lue    : ${empreinteSource}\n` +
				`  L'extraction est refusée : voir pnpm verif:gel.`
		);
	}

	const ouvrant = html.indexOf('<style>');
	if (ouvrant === -1) throw new Error('aucun bloc <style> dans la maquette source');
	const debut = ouvrant + '<style>'.length;
	const fin = html.indexOf('</style>', debut);
	if (fin === -1) throw new Error('bloc <style> non refermé dans la maquette source');

	const contenu = html.slice(debut, fin);
	if (!contenu.includes(BANNIERE)) {
		throw new Error(
			`le premier bloc <style> ne porte pas la bannière « ${BANNIERE} » : ` +
				'la maquette a été restructurée, l\'extraction est refusée.'
		);
	}

	const lignes = contenu.split('\n').length;
	// Décompte des jetons du bloc `:root` — plusieurs jetons peuvent partager
	// une ligne (l'échelle d'espacement, les rayons), et les commentaires en
	// contiennent qui n'en sont pas : on neutralise les commentaires d'abord.
	const racineJetons = contenu
		.slice(contenu.indexOf(':root'), contenu.indexOf('@media'))
		.replace(/\/\*[\s\S]*?\*\//g, '');
	const jetons = new Set(racineJetons.match(/--[a-z0-9-]+(?=\s*:)/g) ?? []).size;

	if (lignes !== ATTENDU.lignes || jetons !== ATTENDU.jetons) {
		throw new Error(
			`repères de non-régression rompus — attendu ${ATTENDU.lignes} lignes et ` +
				`${ATTENDU.jetons} jetons (ÉCART-007, DESIGN.md §1.0), obtenu ${lignes} et ${jetons}.`
		);
	}

	return { contenu, lignes, jetons, empreinteSource };
}

/** Rend la liste des fichiers de polices à installer, triée. */
export function listerPolices() {
	return readdirSync(join(racine, SOURCE_POLICES))
		.filter((f) => f.endsWith('.woff2') || f === 'polices.css')
		.sort();
}

/**
 * Installe. Rend le journal des écritures effectuées.
 * @param {{ verifier?: boolean }} options
 */
export function installer({ verifier = false } = {}) {
	const { contenu, lignes, jetons } = extraireSocle();
	const ecarts = [];
	const journal = [];

	// 1. La feuille de socle applicative.
	const cible = join(racine, CIBLE_SOCLE);
	const attendu = Buffer.from(contenu, 'utf8');
	const existant = existsSync(cible) ? readFileSync(cible) : null;

	if (verifier) {
		if (existant === null) {
			ecarts.push({ fichier: CIBLE_SOCLE, motif: 'feuille applicative absente' });
		} else if (!existant.equals(attendu)) {
			ecarts.push({
				fichier: CIBLE_SOCLE,
				motif: 'divergence du socle',
				attendue: empreinte(attendu),
				obtenue: empreinte(existant),
				diff: diffTextuel(attendu.toString('utf8'), existant.toString('utf8'))
			});
		}
	} else {
		mkdirSync(dirname(cible), { recursive: true });
		writeFileSync(cible, attendu);
		journal.push(`${CIBLE_SOCLE} — ${lignes} lignes, ${jetons} jetons, ${attendu.length} o`);
	}

	// 2. Les polices, servies localement (RG-NF-08, ADR-002 « conséquences »).
	//    Les `url()` de polices.css sont relatifs et les woff2 sont installés
	//    dans le même répertoire : servi sous /polices/, chaque `url()` résout
	//    en /polices/<fichier>.woff2. Aucune réécriture n'est donc nécessaire —
	//    et le fichier reste identique au gel, ce qui est vérifiable.
	const cibleDir = join(racine, CIBLE_POLICES);
	if (!verifier) mkdirSync(cibleDir, { recursive: true });

	for (const nom of listerPolices()) {
		const source = readFileSync(join(racine, SOURCE_POLICES, nom));
		const dest = join(cibleDir, nom);
		if (verifier) {
			if (!existsSync(dest)) {
				ecarts.push({ fichier: join(CIBLE_POLICES, nom), motif: 'police absente' });
			} else if (!readFileSync(dest).equals(source)) {
				ecarts.push({
					fichier: join(CIBLE_POLICES, nom),
					motif: 'divergence de police',
					attendue: empreinte(source),
					obtenue: empreinte(readFileSync(dest))
				});
			}
		} else {
			writeFileSync(dest, source);
		}
	}
	if (!verifier) {
		journal.push(`${CIBLE_POLICES}/ — ${listerPolices().length} fichiers`);
	}

	return { ecarts, journal, lignes, jetons };
}

/** Diff ligne à ligne, borné, pour un message exploitable. */
export function diffTextuel(attendu, obtenu, maximum = 20) {
	const a = attendu.split('\n');
	const b = obtenu.split('\n');
	const lignes = [];
	for (let i = 0; i < Math.max(a.length, b.length) && lignes.length < maximum; i++) {
		if (a[i] !== b[i]) {
			if (a[i] !== undefined) lignes.push(`    -${i + 1} attendu : ${a[i]}`);
			if (b[i] !== undefined) lignes.push(`    +${i + 1} obtenu  : ${b[i]}`);
		}
	}
	const reste = a.length !== b.length ? ` (${a.length} lignes attendues, ${b.length} obtenues)` : '';
	return lignes.join('\n') + (lignes.length >= maximum ? '\n    … diff tronqué' : '') + reste;
}

// ── Exécution directe ──────────────────────────────────────────────────────
if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
	const verifier = process.argv.includes('--verifier');
	try {
		const { ecarts, journal, lignes, jetons } = installer({ verifier });
		if (verifier) {
			if (ecarts.length > 0) {
				console.error(`extraire-socle — ÉCHEC : ${ecarts.length} divergence(s).`);
				for (const e of ecarts) console.error(`  ${e.fichier} — ${e.motif}`);
				process.exit(1);
			}
			console.log('extraire-socle — la feuille applicative est conforme à la maquette gelée.');
		} else {
			console.log(`extraire-socle — socle de mockups/${MAQUETTE_SOURCE} installé :`);
			for (const l of journal) console.log(`  ${l}`);
			console.log(`  repères : ${lignes} lignes, ${jetons} jetons — conformes à ÉCART-007.`);
		}
		process.exit(0);
	} catch (erreur) {
		console.error(`extraire-socle — ÉCHEC : ${erreur.message}`);
		process.exit(1);
	}
}
