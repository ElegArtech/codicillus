/**
 * LA CONFORMITÉ AU DESSIN — la comparaison mécanique d'un écran rendu à sa capture de référence.
 *
 * Le paquet de refonte livre neuf captures d'un prototype VALIDÉ. Elles sont la référence, et
 * une référence ne se lit pas : elle se compare. Cet outil rend chaque écran du produit avec le
 * jeu de conformité, le capture au format de la référence, et pose les deux images côte à côte
 * dans un seul fichier — l'écart se voit alors sans lecture croisée.
 *
 * IL NE JUGE PAS, IL MONTRE. Un diff de pixels contre le prototype serait un faux rouge
 * permanent : le prototype est du HTML statique, le produit sert des données réelles, et les
 * deux ne porteront jamais les mêmes antialiasings. Le verdict reste humain ; ce que la machine
 * garantit, c'est que la comparaison soit FAITE, à la bonne taille, sur le bon état, à chaque
 * fois — et pas déclarée.
 *
 *   node tools/conformite/conformite.mjs            toutes les vues
 *   node tools/conformite/conformite.mjs note       une seule
 *
 * Sortie : tools/conformite/rendu/<cle>.png (le produit seul)
 *          tools/conformite/cote-a-cote/<cle>.png (référence | produit)
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, '../..');
const CAPTURES = join(RACINE, 'design_handoff_refonte_codicillus/captures');
const RENDU = join(ICI, 'rendu');
const COTE = join(ICI, 'cote-a-cote');

/** L'adresse du serveur de développement. Il doit tourner. */
const SITE = process.env.SITE_CONFORMITE ?? 'http://localhost:5173';

/**
 * Le compte de développement. Les captures sont prises connecté : la coquille, le rail et la
 * colonne contexte n'existent pas autrement.
 */
const COMPTE = {
	identifiant: process.env.ADMIN_IDENTIFIANT ?? 'a.berge',
	motDePasse: process.env.MDP_ADMINISTRATEUR ?? ''
};

/**
 * LES VUES À COMPARER. `route` est servie par le produit, `capture` est le fichier de
 * référence, et `taille` reprend la fenêtre du prototype (le README du paquet donne
 * 1536 × 1150 pour les captures, 900 de large pour la planche des tiroirs).
 */
const VUES = JSON.parse(readFileSync(join(ICI, 'vues.json'), 'utf8'));

function pngEnDonnees(chemin) {
	return `data:image/png;base64,${readFileSync(chemin).toString('base64')}`;
}

async function main() {
	const demande = process.argv[2];
	const aFaire = demande ? VUES.filter((v) => v.cle === demande) : VUES;
	if (aFaire.length === 0) {
		console.error(`vue inconnue : ${demande}`);
		console.error(`connues : ${VUES.map((v) => v.cle).join(', ')}`);
		process.exit(1);
	}
	for (const dossier of [RENDU, COTE])
		if (!existsSync(dossier)) mkdirSync(dossier, { recursive: true });

	const navigateur = await chromium.launch();
	const contexte = await navigateur.newContext({ deviceScaleFactor: 1 });
	const page = await contexte.newPage();

	/* La connexion, une fois : le contexte garde le témoin de session pour toutes les vues. */
	await page.setViewportSize({ width: 1536, height: 1150 });
	await page.goto(`${SITE}/connexion`, { waitUntil: 'networkidle' });
	if (page.url().includes('/connexion')) {
		await page.fill('input[name="identifiant"]', COMPTE.identifiant);
		await page.fill('input[type="password"]', COMPTE.motDePasse);
		await Promise.all([
			page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
			page.click('button[type="submit"]')
		]);
	}
	if (page.url().includes('/connexion')) {
		console.error('CONNEXION REFUSÉE — pose ADMIN_IDENTIFIANT et MDP_ADMINISTRATEUR dans .env');
		await navigateur.close();
		process.exit(1);
	}

	let echecs = 0;
	for (const vue of aFaire) {
		const largeur = vue.largeur ?? 1536;
		const hauteur = vue.hauteur ?? 1150;
		await page.setViewportSize({ width: largeur, height: hauteur });
		const reponse = await page.goto(`${SITE}${vue.route}`, { waitUntil: 'networkidle' });
		const statut = reponse?.status() ?? 0;
		await page.waitForTimeout(400);
		const rendu = join(RENDU, `${vue.cle}.png`);
		await page.screenshot({ path: rendu });

		const reference = join(CAPTURES, vue.capture);
		const composeur = await contexte.newPage();
		await composeur.setViewportSize({ width: largeur * 2 + 60, height: hauteur + 76 });
		await composeur.setContent(`<body style="margin:0;background:#3a3a3a;font:13px system-ui;color:#fff">
<div style="display:flex;gap:20px;padding:20px">
  <div><div style="padding:6px 2px">RÉFÉRENCE — ${vue.capture}</div>
    <img src="${pngEnDonnees(reference)}" style="width:${largeur}px;display:block;border:1px solid #666"></div>
  <div><div style="padding:6px 2px">PRODUIT — ${vue.route} (${statut})</div>
    <img src="${pngEnDonnees(rendu)}" style="width:${largeur}px;display:block;border:1px solid #666"></div>
</div></body>`);
		await composeur.screenshot({ path: join(COTE, `${vue.cle}.png`), fullPage: true });
		await composeur.close();

		const verdict = statut === 200 ? 'ok' : 'ÉCHEC';
		if (statut !== 200) echecs += 1;
		console.log(`${verdict.padEnd(6)} ${vue.cle.padEnd(14)} ${vue.route} → ${statut}`);
	}

	await navigateur.close();
	if (echecs > 0) {
		console.error(
			`\n${echecs} vue(s) ne rendent pas 200. La conformité ne se pose pas : l'écran n'existe pas.`
		);
		process.exit(1);
	}
	console.log(`\nCôte à côte dans tools/conformite/cote-a-cote/. Regarde-les.`);
}

await main();
