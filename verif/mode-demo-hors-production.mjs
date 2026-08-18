#!/usr/bin/env node
/**
 * `pnpm verif:demo:hors-production` — le mode démo n'existe pas en production.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QU'IL PROUVE, ET POURQUOI UNE PROMESSE NE SUFFIT PAS
 *
 * `règles/workflow_agentic.md` annexe F borne le mode démo aux « builds de
 * développement uniquement ». C'est une exigence de sécurité autant que de
 * propreté : la route rend des états arbitraires d'une vue, nourris de
 * fixtures, sans passer par les droits du produit. Livrée, elle serait un
 * contournement de `RG-ACC-01` offert avec l'application.
 *
 * Le greffon `verif/banc/mode-demo.mjs` est en `apply: 'serve'` : il n'est
 * monté que par le serveur de développement. Mais « il est censé ne pas y
 * être » n'est pas une preuve. Ce script en produit une, en trois constats
 * indépendants sur un build réel :
 *
 *   1. AUCUNE TRACE — ni `__design`, ni `mode-demo`, ni un module de `verif/`
 *      dans les fichiers produits.
 *   2. AUCUNE ROUTE — le manifeste de routes de SvelteKit n'en porte pas.
 *   3. AUCUNE RÉPONSE — le produit servi par `node build/index.js` rend un
 *      404 sur l'adresse, comme sur n'importe quelle adresse inexistante.
 *
 * Le troisième constat est le seul qui compte vraiment, et les deux premiers
 * sont ce qui empêche de le contourner par une garde d'exécution : une route
 * qui répondrait 404 tout en embarquant son code resterait une route livrée.
 *
 * Usage : node verif/mode-demo-hors-production.mjs [--sans-construire]
 * Code retour : 0 absent de la production, 1 présent.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREFIXE } from './banc/mode-demo.mjs';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIES = ['build', '.svelte-kit/output'];
const MOTIFS = [PREFIXE.replace(/^\//, ''), 'mode-demo', 'codicillus:mode-demo'];
const EXTENSIONS = ['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.map'];

const constats = [];

/* ── 1. Construire ────────────────────────────────────────────────────────── */
if (!process.argv.includes('--sans-construire')) {
	console.log('  construction du produit (vite build)…');
	const build = spawnSync('pnpm', ['run', 'build'], { cwd: racine, encoding: 'utf8' });
	if (build.status !== 0) {
		console.error(`verif:demo:hors-production — la construction a échoué :\n${build.stderr}`);
		process.exit(1);
	}
}
if (!existsSync(join(racine, 'build'))) {
	console.error('verif:demo:hors-production — aucun répertoire build/ : rien à contrôler.');
	process.exit(1);
}

/* ── 2. Aucune trace dans les fichiers produits ───────────────────────────── */
let fichiersLus = 0;
for (const sortie of SORTIES) {
	const base = join(racine, sortie);
	if (!existsSync(base)) continue;
	const descendre = (dossier) => {
		for (const entree of readdirSync(dossier)) {
			const chemin = join(dossier, entree);
			if (statSync(chemin).isDirectory()) {
				descendre(chemin);
				continue;
			}
			if (!EXTENSIONS.includes(extname(entree))) continue;
			fichiersLus++;
			const contenu = readFileSync(chemin, 'utf8');
			for (const motif of MOTIFS) {
				if (contenu.includes(motif)) {
					constats.push({
						quoi: 'trace dans un fichier produit',
						detail: `${chemin.slice(racine.length + 1)} contient « ${motif} »`
					});
				}
			}
			if (/\bverif\/banc\//.test(contenu)) {
				constats.push({
					quoi: 'module d’instrument embarqué',
					detail: `${chemin.slice(racine.length + 1)} référence verif/banc/`
				});
			}
		}
	};
	descendre(base);
}

/* ── 3. Aucune réponse du produit servi ───────────────────────────────────── */
const PORT = 41973;
console.log(`  démarrage du produit construit sur le port ${PORT}…`);
const produit = spawn(process.execPath, ['build/index.js'], {
	cwd: racine,
	env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
	stdio: 'ignore'
});

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let vivant = false;
for (let essai = 0; essai < 60 && !vivant; essai++) {
	await attendre(150);
	vivant = Boolean(await fetch(`http://127.0.0.1:${PORT}/`).catch(() => null));
}

/** @type {{adresse: string, code: number|string}[]} */
const reponses = [];
if (!vivant) {
	constats.push({
		quoi: 'produit injoignable',
		detail: `node build/index.js n’a pas répondu sur le port ${PORT} — le contrôle 3 n’a rien prouvé.`
	});
} else {
	for (const adresse of [
		`${PREFIXE}/`,
		`${PREFIXE}/V-37`,
		`${PREFIXE}/V-37?etat=cont-bord`,
		`${PREFIXE}/V-37?etat=cont-bord&source=etalon`
	]) {
		const reponse = await fetch(`http://127.0.0.1:${PORT}${adresse}`).catch(() => null);
		const code = reponse ? reponse.status : 'aucune réponse';
		reponses.push({ adresse, code });
		if (code !== 404) {
			constats.push({
				quoi: 'adresse servie en production',
				detail: `${adresse} répond ${code} — attendu 404, comme toute adresse inexistante.`
			});
		}
	}
}
produit.kill('SIGTERM');

/* ── Rapport ──────────────────────────────────────────────────────────────── */
console.log('\nverif:demo:hors-production — le mode démo dans le produit construit');
console.log(`  fichiers produits inspectés : ${fichiersLus}`);
console.log(`  motifs cherchés : ${MOTIFS.map((m) => `« ${m} »`).join(', ')}, « verif/banc/ »`);
for (const r of reponses) console.log(`  ${r.adresse.padEnd(46)} → ${r.code}`);

if (constats.length) {
	console.error(`\n  ÉCHEC : ${constats.length} constat(s).`);
	for (const c of constats) console.error(`    ${c.quoi} — ${c.detail}`);
	console.error(
		'\nLe mode démo rend des états arbitraires nourris de fixtures, sans passer par\n' +
			'les droits du produit. Livré, il offrirait un contournement de RG-ACC-01 avec\n' +
			"l’application. Il est en `apply: 'serve'` dans vite.config.ts, et doit le rester.\n"
	);
	process.exit(1);
}

console.log(
	'\n  Aucune trace, aucune route, aucune réponse : le mode démo n’existe pas dans le\n' +
		'  produit construit. Annexe F, « builds de développement uniquement ».\n'
);
process.exit(0);
