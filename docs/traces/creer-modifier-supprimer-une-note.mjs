/**
 * LA TRACE — une session RÉELLE, dans un navigateur, qui crée une note, la
 * modifie et la supprime. Pas une batterie : une trace, avec ses codes HTTP.
 *
 * Ce n'est pas un instrument de mesure et ce fichier ne vit pas dans `verif/` :
 * il ne rend aucun verdict opposable, il RACONTE ce qu'un utilisateur a fait.
 */
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const racine = process.argv[2] ?? process.cwd();
const PORT = Number(process.env.PORT_TRACE ?? 5199);
const BASE = `http://127.0.0.1:${PORT}`;
const IDENTIFIANT = 'karim.belhadj';
const MOT_DE_PASSE = 'trace-de-session-2026';

for (const f of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(join(racine, f));
	} catch {
		/* absent */
	}
}

const pg = (await import('pg')).default;
const bassin = new pg.Pool({
	host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
	port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
	user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
	password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES,
	database: process.env.NOM_BASE ?? process.env.BASE_POSTGRES ?? 'codicillus'
});
const interroger = async (sql, v = []) => (await bassin.query(sql, v)).rows;

/* 1. Un mot de passe pour le compte qui va agir. La semence n'en pose aucun —
      c'est la console M14.6 qui les pose —, et la batterie 6 fait de même. */
{
	const { createServer } = await import('vite');
	const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
	const M = await vite.ssrLoadModule('/src/lib/auth/mots-de-passe.ts');
	const condensat = await M.hacherMotDePasse(MOT_DE_PASSE);
	await vite.close();
	const n = await interroger(
		'update comptes set condensat_mot_de_passe = $1 where identifiant = $2 returning id, nom',
		[condensat, IDENTIFIANT]
	);
	if (n.length === 0) throw new Error(`aucun compte « ${IDENTIFIANT} »`);
	console.log(`  compte    ${IDENTIFIANT} — ${n[0].nom}, mot de passe posé`);
}

/* 2. UN DROIT D'ÉCRITURE. La semence ne pose AUCUNE ligne dans
      `droits_de_dossier` — mesuré : 0 pour les cinq comptes —, et `RG-DRO-02`
      est sans appel : « aucun droit explicite, aucune capacité ». Le produit
      est donc en lecture seule pour tout le monde tant que la console M14.6
      n'a rien posé. La batterie 6 fait exactement ce geste avant de mesurer ;
      la trace le fait aussi, et elle le DIT. */
{
	const racines = await interroger(
		`select d.id, dom.nom as domaine
		   from dossiers d join domaines dom on dom.id = d.domaine_id
		  where d.parent_id is null order by dom.nom`
	);
	const [compte] = await interroger('select id from comptes where identifiant = $1', [IDENTIFIANT]);
	for (const r of racines) {
		await interroger(
			`insert into droits_de_dossier (dossier_id, compte_id, droit)
			 values ($1, $2, 'gestionnaire')
			 on conflict (dossier_id, compte_id) do update set droit = 'gestionnaire'`,
			[r.id, compte.id]
		);
	}
	console.log(`  droits    gestionnaire sur ${racines.length} dossier(s) racine — RG-DRO-02`);
}

const echanges = [];
const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
const page = await contexte.newPage();

page.on('response', (r) => {
	const u = new URL(r.url());
	if (u.port !== String(PORT)) return;
	if (/\.(css|js|svg|png|woff2?|ico|map)$/.test(u.pathname)) return;
	if (u.pathname.startsWith('/@') || u.pathname.startsWith('/node_modules')) return;
	echanges.push({
		methode: r.request().method(),
		chemin: u.pathname + u.search,
		code: r.status(),
		vers: r.headers()['location'] ?? ''
	});
});
page.on('dialog', (d) => d.accept());
const etape = (n) => console.log(`\n── ${n} ${'─'.repeat(Math.max(0, 66 - n.length))}`);
const marque = () => echanges.length;
const depuis = (i) =>
	echanges
		.slice(i)
		.map((e) => `     ${e.methode.padEnd(4)} ${e.chemin.padEnd(46)} ${e.code}${e.vers ? ' → ' + e.vers : ''}`)
		.join('\n');

let identifiantNote = null;
try {
	/* ── CONNEXION ── */
	etape('1. CONNEXION');
	let i = marque();
	await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
	await page.fill('#identifiant', IDENTIFIANT);
	await page.fill('#motdepasse', MOT_DE_PASSE);
	await Promise.all([page.waitForURL(`${BASE}/`), page.click('#valider')]);
	console.log(depuis(i));
	console.log(`     session ouverte — adresse : ${page.url()}`);

	/* ── CRÉATION ── */
	etape('2. CRÉATION D’UNE NOTE');
	i = marque();
	await page.goto(`${BASE}/notes/nouvelle`, { waitUntil: 'networkidle' });
	const titre = `Rotation des clés SSH des passerelles`;
	await page.fill('#titre', titre);
	await page.check('#m-dossier input:first-of-type', { force: true }).catch(async () => {
		await page.locator('#m-dossier input').first().check({ force: true });
	});
	const dossier = await page.evaluate(() => {
		const coche = document.querySelector('#m-dossier input:checked');
		const seg = [];
		let li = coche?.closest('li') ?? null;
		while (li) {
			const n = li.querySelector(':scope > label > span')?.textContent?.trim();
			if (n) seg.unshift(n);
			li = li.parentElement?.closest('li') ?? null;
		}
		return seg.join(' › ');
	});
	await page.locator('#m-etiquette').fill('sécurité');
	await page.locator('#m-etiquette').press('Enter');
	await page.locator('#redaction').click();
	await page.keyboard.type('## Pourquoi');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Enter');
	await page.keyboard.type('Les clés des passerelles tournent tous les 180 jours.');
	await Promise.all([
		page.waitForURL(new RegExp(`${BASE.replace(/[.]/g, '\\.')}/notes/n-`)),
		page.click('#enregistrer')
	]);
	identifiantNote = new URL(page.url()).pathname.split('/').pop();
	console.log(depuis(i));
	console.log(`     titre    « ${titre} »`);
	console.log(`     dossier  ${dossier || '(aucun)'}`);
	console.log(`     adresse  ${page.url()}`);
	const cree = await interroger(
		'select identifiant, titre, statut, visibilite from notes where identifiant = $1',
		[identifiantNote]
	);
	console.log(`     en base  ${JSON.stringify(cree[0])}`);

	/* ── MODIFICATION ── */
	etape('3. MODIFICATION');
	i = marque();
	await page.goto(`${BASE}/notes/${identifiantNote}/modifier`, { waitUntil: 'networkidle' });
	const repris = await page.locator('#redaction').innerText();
	console.log(`     corps repris à l’écran :\n${repris.split('\n').map((l) => '       │ ' + l).join('\n')}`);
	await page.fill('#titre', `${titre} — révision annuelle`);
	await page.locator('#redaction').click();
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Enter');
	await page.keyboard.type('Ajouté par la trace de session.');
	await Promise.all([
		page.waitForURL(`${BASE}/notes/${identifiantNote}`),
		page.click('#enregistrer')
	]);
	console.log(depuis(i));
	const modifiee = await interroger(
		`select n.titre, (select count(*) from versions v where v.note_id = n.id) as versions
		   from notes n where n.identifiant = $1`,
		[identifiantNote]
	);
	console.log(`     en base  ${JSON.stringify(modifiee[0])}`);

	/* ── SUPPRESSION ── */
	etape('4. SUPPRESSION');
	i = marque();
	await page.goto(`${BASE}/notes/${identifiantNote}`, { waitUntil: 'networkidle' });
	const bouton = page.getByRole('button', { name: 'Supprimer', exact: true }).first();
	await Promise.all([page.waitForURL((u) => !u.pathname.endsWith(identifiantNote)), bouton.click()]);
	console.log(depuis(i));
	console.log(`     retour   ${page.url()}`);

	etape('5. LA NOTE N’EXISTE PLUS');
	i = marque();
	const reponse = await page.goto(`${BASE}/notes/${identifiantNote}`, { waitUntil: 'domcontentloaded' });
	console.log(depuis(i));
	console.log(`     GET /notes/${identifiantNote} → ${reponse.status()}`);
	const reste = await interroger('select count(*)::int as n from notes where identifiant = $1', [
		identifiantNote
	]);
	console.log(`     en base  ${reste[0].n} ligne(s)`);
	if (reponse.status() !== 404 || reste[0].n !== 0) throw new Error('la note survit');

	console.log('\n══ TRACE COMPLÈTE — créée, modifiée, supprimée ══\n');
} catch (cause) {
	console.error('\n!! LA TRACE S’EST ARRÊTÉE :', cause.message);
	console.error('\n   Les échanges relevés jusque-là :\n' + depuis(0));
	try {
		await page.screenshot({ path: join(racine, 'trace-echec.png'), fullPage: false });
	} catch {
		/* rien */
	}
	process.exitCode = 1;
} finally {
	await contexte.close();
	await navigateur.close();
	await bassin.end();
}
