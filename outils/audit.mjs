/**
 * L'AUDIT DU PRODUIT — on ouvre les écrans, on clique tout, on mesure.
 *
 * Ce n'est PAS un harnais de test : aucune assertion, aucun compteur de
 * couverture, rien à tenir vert. C'est un instrument, et il existe parce que
 * quatre mesures successives faites à la main ont rendu quatre résultats faux.
 * Chacun de ses filtres répare une erreur RÉELLE :
 *
 *  1. viser un bouton par son LIBELLÉ attrape le premier homonyme — « + Ajouter »
 *     existe deux fois sur une page de note → on vise par index ;
 *  2. « effet » ne se réduit pas à l'URL, au DOM et au réseau : window.print(),
 *     window.open(), le presse-papiers, le sélecteur de fichier natif et les
 *     téléchargements n'en changent aucun → on les instrumente ;
 *  3. un nœud à 0×0 — le contenu d'un dialogue fermé — n'est pas inerte, il est
 *     hors d'atteinte → on l'écarte ;
 *  4. un parcours qui part des liens EXISTANTS ne peut pas voir un lien qui
 *     MANQUE → on compare les routes déclarées à celles que quelque chose
 *     référence, par lien OU par clic ;
 *  5. un onglet déjà actif, une entrée déjà courante, un bouton désactivé : ne
 *     rien faire est JUSTE → on les écarte ;
 *  6. la barre d'outils de l'éditeur agit sur une SÉLECTION que le clic
 *     précédent détruit — un balayage générique ne peut pas la mesurer, elle est
 *     écartée ici et s'éprouve à part.
 *
 * Usage : node outils/audit.mjs /     (parcours transitif depuis les arguments)
 * Prérequis : le serveur sur :5173, et un jeton de session dans FICHIER_JETON.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const B = process.env.BASE_URL ?? 'http://localhost:5173';
const FICHIER_JETON = process.env.FICHIER_JETON ?? '/tmp/codicillus-jeton.txt';
const J = fs.readFileSync(FICHIER_JETON, 'utf8').trim();

const routes = [];
(function marcher(d, url) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		if (e.isDirectory()) marcher(path.join(d, e.name), url + '/' + e.name);
		else if (e.name === '+page.svelte' || e.name === '+server.ts') routes.push(url || '/');
	}
})('src/routes', '');
const DECLAREES = [...new Set(routes)];

const DANGER = /supprim|effac|retir|révoqu|désactiv|déconnect|fermer les autres/i;
const file = process.argv.slice(2);
const faits = new Set();
const liensVus = new Set();
const codes = new Map();
const inertes = [];
const erreurs = [];

const n = await chromium.launch();
const ctx = await n.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: 'codicillus_session', value: J, domain: 'localhost', path: '/' }]);

while (file.length) {
	const chemin = file.shift();
	if (faits.has(chemin)) continue;
	faits.add(chemin);
	const p = await ctx.newPage();
	await p.addInitScript(() => {
		window.__effets = { print: 0, open: 0, presse: 0 };
		window.print = () => window.__effets.print++;
		window.open = () => (window.__effets.open++, null);
		if (navigator.clipboard?.writeText) {
			const v = navigator.clipboard.writeText.bind(navigator.clipboard);
			navigator.clipboard.writeText = (t) => (window.__effets.presse++, v(t));
		}
	});
	let requetes = 0,
		fichiers = 0,
		telecharges = 0;
	p.on('request', (r) => r.method() !== 'GET' && requetes++);
	p.on('filechooser', (fc) => (fichiers++, fc.setFiles([]).catch(() => {})));
	p.on('download', (d) => (telecharges++, d.cancel().catch(() => {})));
	p.on('pageerror', (e) => erreurs.push(`${chemin} : ${String(e).slice(0, 130)}`));
	p.on('dialog', (d) => d.dismiss().catch(() => {}));

	const r = await p.goto(B + chemin, { waitUntil: 'networkidle' }).catch(() => null);
	codes.set(chemin, r?.status() ?? 'ERR');
	if (r?.status() !== 200) {
		await p.close();
		continue;
	}

	for (const h of await p
		.locator('a[href]')
		.evaluateAll((l) => l.map((a) => a.getAttribute('href'))))
		if (h && !h.startsWith('http') && !h.startsWith('#') && !h.startsWith('mailto')) {
			const u = new URL(h, B + chemin);
			liensVus.add(u.pathname);
			const complet = u.pathname + u.search;
			if (!faits.has(complet) && !file.includes(complet) && faits.size + file.length < 90)
				file.push(complet);
		}

	const total = await p.locator('button').count();
	for (let i = 0; i < total; i++) {
		const b = p.locator('button').nth(i);
		let boite, texte;
		try {
			boite = await b.boundingBox();
			texte = (
				(await b.innerText()) ||
				(await b.getAttribute('aria-label')) ||
				(await b.getAttribute('title')) ||
				''
			)
				.replace(/\s+/g, ' ')
				.trim();
		} catch {
			continue;
		}
		if (!boite || boite.width === 0 || boite.height === 0) continue;
		if (DANGER.test(texte)) continue;
		const ecarte = await b
			.evaluate(
				(el) =>
					el.hasAttribute('disabled') ||
					/destructif/.test(el.className) ||
					el.getAttribute('aria-current') === 'page' ||
					el.getAttribute('aria-selected') === 'true' ||
					el.closest('[aria-current="page"]') !== null ||
					el.closest('.editeur__outils, .barre-outils, [role="toolbar"]') !== null
			)
			.catch(() => false);
		if (ecarte) continue;

		const url0 = p.url(),
			dom0 = await p.content(),
			req0 = requetes,
			fic0 = fichiers,
			tel0 = telecharges;
		const eff0 = await p.evaluate(() => ({ ...window.__effets }));
		try {
			await b.click({ timeout: 1200, noWaitAfter: true });
		} catch {
			continue;
		}
		await p.waitForTimeout(200);
		const eff1 = await p.evaluate(() => ({ ...window.__effets }));
		const horsPage = Object.keys(eff1).some((k) => eff1[k] > eff0[k]);
		const bouge =
			p.url() !== url0 ||
			requetes > req0 ||
			(await p.content()) !== dom0 ||
			horsPage ||
			fichiers > fic0 ||
			telecharges > tel0;
		if (!bouge) inertes.push({ chemin, rang: i, texte: texte.slice(0, 46) || '(sans libellé)' });
		if (p.url() !== url0) {
			liensVus.add(new URL(p.url()).pathname);
			await p.goto(B + chemin, { waitUntil: 'networkidle' }).catch(() => {});
		}
	}
	await p.close();
}
await n.close();

const motif = (r) =>
	new RegExp('^' + r.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+') + '$');
const orphelines = DECLAREES.filter(
	(r) =>
		r !== '/' && !/connexion|mot-de-passe/.test(r) && ![...liensVus].some((l) => motif(r).test(l))
);

const mauvais = [...codes.entries()].filter(([, c]) => c !== 200);
console.log(`══ ${faits.size} écrans ouverts, ${mauvais.length} hors 200`);
for (const [c, code] of mauvais) console.log(`   ${code}  ${c}`);
console.log(
	`\n══ ROUTES QUE RIEN NE RÉFÉRENCE — ni lien, ni clic (${orphelines.length}/${DECLAREES.length})`
);
for (const o of orphelines) console.log('   ' + o);
console.log(`\n══ GESTES SANS AUCUN EFFET (${inertes.length})`);
const parPage = {};
for (const i of inertes) (parPage[i.chemin] ??= []).push(i);
for (const [c, l] of Object.entries(parPage))
	console.log(`   ${c}\n${l.map((i) => `       #${i.rang} « ${i.texte} »`).join('\n')}`);
console.log(`\n══ ERREURS DE PAGE (${erreurs.length})`);
for (const e of erreurs.slice(0, 12)) console.log('   ' + e);
