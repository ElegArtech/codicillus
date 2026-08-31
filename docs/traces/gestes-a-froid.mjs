/**
 * LES GESTES À FROID — une instance NEUVE, et tout ce qu'on y écrit.
 *
 * `passage-a-froid.mjs` OUVRE les routes et lit ce qui s'affiche. Il ne CLIQUE
 * rien : il crée son décor, puis il regarde. Or un écran peut rendre 200,
 * n'afficher aucun nom du jeu de démonstration, et n'offrir aucun geste qui
 * aboutisse — c'est exactement ce qui a été mesuré le 31/08/2026 sur l'écran
 * des relations, servi en 200, propre, et incapable de déclarer une relation.
 *
 * CE PASSAGE-CI ÉCRIT. Il monte une base vide, applique les migrations, N'EN
 * SÈME AUCUNE DONNÉE, puis il fait, dans un navigateur, les gestes d'un
 * installateur qui vient de recevoir son produit : un univers, un domaine, deux
 * notes, une vérification, une demande de révision, une relation, une pièce
 * jointe, une archive, les cinq créations de console, une suppression. Chaque
 * geste est jugé sur SON EFFET EN BASE, pas sur l'écran qui l'a accepté : un
 * formulaire qui rend 200 sans rien écrire est le défaut que ce passage existe
 * pour trouver.
 *
 * IL MESURE LE PRODUIT CONSTRUIT, comme son jumeau, et pour la même raison :
 * `vite dev` sert les sources, et ce n'est pas ce qui s'installe.
 *
 *     node docs/traces/gestes-a-froid.mjs
 *     node docs/traces/gestes-a-froid.mjs --tel-quel
 *     PORT_GESTES=5268 BASE_GESTES=codicillus_gestes_a_froid \
 *       node docs/traces/gestes-a-froid.mjs
 *
 * IL POSE SON DÉCOR PAR L'INTERFACE, ET IL N'ÉCRIT EN BASE QUE POUR LIRE.
 * C'est ce qui le distingue d'un instrument qui triche : son jumeau pose un
 * droit de dossier en SQL pour pouvoir écrire ; ici, tout passe par les écrans,
 * et les requêtes ne servent qu'à COMPTER ce que les écrans ont produit.
 *
 * CE QU'IL NE FAIT PAS ENCORE. Les écrans d'impasse — ceux qui, à zéro donnée,
 * retirent un moyen d'agir sans le dire — sont recensés en bas de ce fichier,
 * dans `IMPASSES`. La liste est VIDE tant qu'aucun n'est réparé : un contrôle
 * qui échoue sur un défaut connu et non traité ne se lit plus au bout de deux
 * passages. Chaque lot qui ferme une impasse ajoute la sienne ici, et la preuve
 * devient permanente.
 *
 * Code de retour : 0 si tous les gestes ont écrit ce qu'ils promettaient.
 */
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const telQuel = process.argv.includes('--tel-quel');
const racine = process.argv.slice(2).find((a) => !a.startsWith('-')) ?? process.cwd();
for (const f of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(join(racine, f));
	} catch {
		/* absent : l'environnement du processus fait foi */
	}
}

const PORT = Number(process.env.PORT_GESTES ?? 5268);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BASE_GESTES = process.env.BASE_GESTES ?? 'codicillus_gestes_a_froid';

/* LA BASE DU PASSAGE, POSÉE AVANT TOUT CHARGEMENT DE MODULE DU PRODUIT — et
   distincte de celle de `passage-a-froid.mjs`, pour que les deux puissent
   courir sans se marcher dessus. */
process.env.NOM_BASE = BASE_GESTES;
process.env.BASE_POSTGRES = BASE_GESTES;

const IDENTIFIANT = 'a.gestes';
/* TIRÉ À CHAQUE PASSAGE, JAMAIS ÉCRIT ICI : ce fichier est versionné dans un
   dépôt public, et un littéral qui ressemble à un identifiant n'y a pas sa
   place, même quand il n'ouvre rien. */
const MOT_DE_PASSE = (await import('node:crypto')).randomBytes(24).toString('base64url');

const NOM_ADMIN = 'Compte des gestes à froid';
const UNIVERS = 'Univers des gestes';
const DOMAINE = 'Domaine des gestes';
const NOTE_A = 'Première note des gestes';
const NOTE_B = 'Seconde note des gestes';
const TYPE_DE_FICHE = 'Type de fiche des gestes';
const TYPE_DE_RELATION = 'relie';
const TYPE_DE_RELATION_INVERSE = 'est relié à';
const GABARIT = 'Gabarit des gestes';
const COMPTE_CREE = 'c.gestes';

const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 68 - t.length))}`);

/**
 * LES ÉCRANS D'IMPASSE — vide tant qu'aucun n'est réparé.
 *
 * Un écran d'impasse est un écran qui, faute d'une donnée qu'une instance neuve
 * n'a pas, RETIRE un moyen d'agir sans nommer le geste qui débloquerait. Chaque
 * entrée porte l'adresse à ouvrir, la condition de l'impasse, et le fragment de
 * texte que l'écran DOIT afficher. Le passage échoue si le texte manque.
 *
 * On n'inscrit ici que ce qui est réparé : un contrôle qui échoue sur un défaut
 * connu et non traité cesse d'être lu au bout de deux passages.
 */
const IMPASSES = [];

/* ── 0. LA CONSTRUCTION ──────────────────────────────────────────────────── */
titre('0. LA CONSTRUCTION');
if (telQuel) {
	console.log('     --tel-quel : le paquet déjà présent est servi tel quel.');
} else {
	const rendu = await new Promise((resoudre) => {
		const enfant = spawn('pnpm', ['build'], { cwd: racine, stdio: ['ignore', 'pipe', 'pipe'] });
		let dernieres = [];
		const garder = (t) => {
			dernieres = [...dernieres, ...String(t).split('\n')].slice(-3);
		};
		enfant.stdout.on('data', garder);
		enfant.stderr.on('data', garder);
		enfant.on('close', (c) => {
			for (const l of dernieres) if (l.trim() !== '') console.log(`     ${l.trim()}`);
			resoudre(c);
		});
	});
	if (rendu !== 0) {
		console.error(`\n!! pnpm build a rendu ${rendu} — rien à ouvrir.`);
		process.exit(1);
	}
}

/* ── 1. UNE BASE VIDE ────────────────────────────────────────────────────── */
titre('1. UNE BASE NEUVE, MIGRÉE, JAMAIS SEMÉE');
const pg = (await import('pg')).default;
const connexion = {
	host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
	port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
	user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
	password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES
};
{
	const gerant = new pg.Pool({ ...connexion, database: 'postgres' });
	await gerant.query(`drop database if exists "${BASE_GESTES}" with (force)`);
	await gerant.query(`create database "${BASE_GESTES}"`);
	await gerant.end();
	console.log(`     base      ${BASE_GESTES} — détruite puis recréée`);
}

const bassin = new pg.Pool({ ...connexion, database: BASE_GESTES });
const interroger = async (sql, v = []) => (await bassin.query(sql, v)).rows;
const compter = async (table) => {
	const [{ n }] = await interroger(`select count(*)::int as n from ${table}`);
	return n;
};

const { createServer } = await import('vite');
const vite = await createServer({
	root: racine,
	server: { middlewareMode: true, hmr: false },
	appType: 'custom',
	logLevel: 'error'
});

/** Ce que chaque geste a produit : le passage n'échoue que là-dessus. */
const constats = [];
const juger = (geste, reussi, detail) => {
	constats.push({ geste, reussi, detail });
	console.log(`     ${(reussi ? 'ÉCRIT' : 'RIEN').padEnd(6)} ${geste.padEnd(44)} ${detail}`);
};

let code = 0;
let serveur = null;
const navigateur = await chromium.launch();
try {
	const B = await vite.ssrLoadModule('/src/lib/base/commandes.ts');
	const session = B.ouvrir(process.env);
	const posees = await B.migrer(session.pool, racine);
	console.log(`     migrations ${posees.length} appliquées`);
	for (const t of ['univers', 'domaines', 'notes', 'types_de_relation', 'templates']) {
		console.log(`     ${t.padEnd(18)} ${await compter(t)}`);
	}

	/* ── 2. LE DÉCOR ───────────────────────────────────────────────────────── */
	titre('2. LE DÉCOR — le premier compte, et rien d’autre');
	const premier = await B.creerLePremierAdministrateur(session, {
		identifiant: IDENTIFIANT,
		nom: NOM_ADMIN,
		courriel: 'gestes@invalid.test',
		motDePasse: MOT_DE_PASSE
	});
	if (!premier.cree) throw new Error(`premier administrateur refusé — ${premier.motif}`);
	console.log(`     compte    ${IDENTIFIANT} — « ${NOM_ADMIN} », administrateur`);
	await session.pool.end();

	/* AUCUN DROIT DE DOSSIER N'EST POSÉ ICI, et c'est délibéré : `RG-DRO-03`
	   fait de l'administrateur celui qui contourne les droits de dossier
	   (`src/lib/droits/resolution.ts:270`). Si un geste d'écriture échoue faute
	   de droit, c'est un défaut du produit — pas un décor à compléter. */
	serveur = spawn('node', ['build/index.js'], {
		cwd: racine,
		env: { ...process.env, PORT: String(PORT), ORIGIN: BASE_URL },
		stdio: ['ignore', 'ignore', 'pipe']
	});
	let plainte = '';
	serveur.stderr.on('data', (t) => {
		plainte += String(t);
	});
	for (let essai = 0; ; essai += 1) {
		if (serveur.exitCode !== null) throw new Error(`build/index.js s’est arrêté :\n${plainte}`);
		try {
			await fetch(`${BASE_URL}/connexion`);
			break;
		} catch {
			if (essai > 60) throw new Error(`build/index.js n’écoute pas sur ${PORT}\n${plainte}`);
			await new Promise((r) => setTimeout(r, 500));
		}
	}
	console.log(`     serveur   build/index.js sur ${BASE_URL} (pid ${serveur.pid})`);

	const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 1600 } });
	const page = await contexte.newPage();
	page.on('dialog', (d) => d.accept());
	const cinqCents = [];
	page.on('response', (r) => {
		if (r.status() >= 500) cinqCents.push(`${r.status()} ${new URL(r.url()).pathname}`);
	});

	/** Cocher une case du produit sans jamais sortir du geste d'utilisateur. */
	const cocher = async (selecteur) => {
		const cases = await page.$$(selecteur);
		for (const c of cases) {
			if (await c.isChecked()) continue;
			await c.scrollIntoViewIfNeeded();
			await c.check();
		}
		return cases.length;
	};
	/** Valider un tiroir de console et attendre que la liste porte le nom. */
	const validerLeTiroir = async (nom) => {
		await page.click('#form-valider');
		await page
			.waitForFunction((n) => document.body.textContent?.includes(n) === true, nom, {
				timeout: 15000
			})
			.catch(() => undefined);
	};

	await page.goto(`${BASE_URL}/connexion`, { waitUntil: 'networkidle' });
	await page.fill('#identifiant', IDENTIFIANT);
	await page.fill('#motdepasse', MOT_DE_PASSE);
	await Promise.all([page.waitForURL(`${BASE_URL}/`), page.click('#valider')]);

	/* ── 3. LE RANGEMENT ───────────────────────────────────────────────────── */
	titre('3. LE RANGEMENT — un univers, un domaine, par la console');
	await page.goto(`${BASE_URL}/console/univers`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', UNIVERS);
	await validerLeTiroir(UNIVERS);
	juger('créer un univers', (await compter('univers')) === 1, `univers = ${await compter('univers')}`);

	await page.goto(`${BASE_URL}/console/domaines`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', DOMAINE);
	await page.selectOption('#f-univers', { index: 0 });
	const modules = await cocher('#f-modules input[type="checkbox"]:not([disabled])');
	await validerLeTiroir(DOMAINE);
	juger(
		'créer un domaine',
		(await compter('domaines')) === 1,
		`domaines = ${await compter('domaines')}, ${modules} module(s) offerts`
	);
	/* RG-STR-03 — un domaine naît avec son dossier racine, sans quoi aucune note
	   ne peut y vivre. Le geste de console porte les trois écritures ou aucune. */
	juger('le dossier racine du domaine', (await compter('dossiers')) >= 1, `dossiers = ${await compter('dossiers')}`);

	const [univers] = await interroger('select identifiant from univers');
	const [domaine] = await interroger('select identifiant from domaines');

	/* ── 4. LES NOTES ──────────────────────────────────────────────────────── */
	titre('4. LES NOTES — écrites, modifiées, vérifiées, signalées');
	const ecrireUneNote = async (titreDeNote) => {
		await page.goto(`${BASE_URL}/notes/nouvelle`, { waitUntil: 'networkidle' });
		await page.fill('#titre', titreDeNote);
		const dossier = await page.$('#m-dossier input');
		if (dossier !== null) {
			await dossier.scrollIntoViewIfNeeded();
			await dossier.check();
		}
		await page.locator('#redaction').click();
		await page.keyboard.type(`Corps écrit par le passage des gestes, pour « ${titreDeNote} ».`);
		await Promise.all([
			page.waitForURL(new RegExp(`${BASE_URL.replace(/\./gu, '\\.')}/notes/n-`, 'u')),
			page.click('#enregistrer')
		]);
		return new URL(page.url()).pathname.split('/').pop();
	};
	const a = await ecrireUneNote(NOTE_A);
	const b = await ecrireUneNote(NOTE_B);
	juger('créer deux notes', (await compter('notes')) === 2, `notes = ${await compter('notes')}`);

	{
		const avant = await compter('verifications');
		await page.goto(`${BASE_URL}/notes/${a}`, { waitUntil: 'networkidle' });
		const bouton = await page.$('#btn-verifier');
		if (bouton !== null) {
			await bouton.click();
			await page.waitForLoadState('networkidle');
		}
		const apres = await compter('verifications');
		juger('marquer comme vérifié', apres > avant, `verifications ${avant} → ${apres}`);
	}

	{
		await page.goto(`${BASE_URL}/notes/${a}`, { waitUntil: 'networkidle' });
		const ouvrir = await page.$('#btn-reviser');
		if (ouvrir !== null) {
			await ouvrir.click();
			await page.fill('#txt-reviser', 'Motif écrit par le passage des gestes.');
			const envoyer = await page.$('#btn-reviser-envoi');
			if (envoyer !== null) {
				await envoyer.click();
				await page.waitForLoadState('networkidle');
			}
		}
		const [note] = await interroger('select revision_demandee from notes where identifiant = $1', [a]);
		juger('signaler à réviser', note.revision_demandee === true, `revision_demandee = ${note.revision_demandee}`);
	}

	/* ── 5. LES RÉFÉRENTIELS DE CONSOLE ────────────────────────────────────── */
	titre('5. LA CONSOLE — les cinq créations');
	await page.goto(`${BASE_URL}/console/types-de-fiches`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', TYPE_DE_FICHE);
	await validerLeTiroir(TYPE_DE_FICHE);
	juger('créer un type de fiche', (await compter('types_de_fiche')) === 1, `types_de_fiche = ${await compter('types_de_fiche')}`);

	await page.goto(`${BASE_URL}/console/types-de-relations`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-direct', TYPE_DE_RELATION);
	await page.fill('#f-inverse', TYPE_DE_RELATION_INVERSE);
	await validerLeTiroir(TYPE_DE_RELATION);
	juger('créer un type de relation', (await compter('types_de_relation')) === 1, `types_de_relation = ${await compter('types_de_relation')}`);

	await page.goto(`${BASE_URL}/console/templates`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', GABARIT);
	const contenu = await page.$('#f-contenu');
	if (contenu !== null) await contenu.fill('# Titre\n\nCorps du gabarit.');
	await validerLeTiroir(GABARIT);
	juger('créer un gabarit', (await compter('templates')) === 1, `templates = ${await compter('templates')}`);

	{
		const avant = await compter('comptes');
		await page.goto(`${BASE_URL}/console/comptes`, { waitUntil: 'networkidle' });
		await page.click('#creer');
		await page.fill('#f-ident', COMPTE_CREE);
		await page.fill('#f-nom', 'Compte créé par le passage');
		await page.fill('#f-courriel', 'c.gestes@invalid.test');
		const mdp = await page.$('#f-mdp');
		if (mdp !== null) await mdp.fill(`${MOT_DE_PASSE}!aA1`);
		await validerLeTiroir(COMPTE_CREE);
		const apres = await compter('comptes');
		juger('créer un compte', apres > avant, `comptes ${avant} → ${apres}`);
	}

	/* ── 6. LE GRAPHE, LES PIÈCES, L'ARCHIVE ───────────────────────────────── */
	titre('6. LE GRAPHE, LES PIÈCES, L’ARCHIVE');
	{
		const avant = await compter('relations');
		await page.goto(`${BASE_URL}/notes/${a}/relations`, { waitUntil: 'networkidle' });
		const types = await page.$$eval('#rel-type option', (o) => o.length);
		const cibles = await page.$$eval('#rel-cible option', (o) => o.length);
		if (types > 0 && cibles > 0) {
			await page.selectOption('#rel-type', { index: 0 });
			await page.selectOption('#rel-cible', { index: 0 });
			await page.getByRole('button', { name: 'Déclarer la relation' }).click();
			await page.waitForLoadState('networkidle');
		}
		const apres = await compter('relations');
		juger('déclarer une relation', apres > avant, `relations ${avant} → ${apres} (${types} type(s), ${cibles} cible(s) offerts)`);
	}

	{
		const avant = await compter('pieces_jointes');
		await page.goto(`${BASE_URL}/notes/${a}`, { waitUntil: 'networkidle' });
		const entree = await page.$('input[type="file"]');
		if (entree !== null) {
			await entree.setInputFiles({
				name: 'piece-des-gestes.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('Contenu déposé par le passage des gestes.')
			});
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(1500);
		}
		const apres = await compter('pieces_jointes');
		juger('déposer une pièce jointe', apres > avant, `pieces_jointes ${avant} → ${apres}`);
	}

	{
		const reponse = await page.request.get(
			`${BASE_URL}/console/exports/${univers.identifiant}/${domaine.identifiant}`
		);
		const octets = (await reponse.body()).length;
		juger('exporter un domaine', reponse.status() === 200 && octets > 0, `${reponse.status()}, ${octets} octets`);
	}

	/* ── 7. LA SUPPRESSION ─────────────────────────────────────────────────── */
	titre('7. LA SUPPRESSION — définitive, et vraiment faite');
	{
		const avant = await compter('notes');
		await page.goto(`${BASE_URL}/notes/${b}`, { waitUntil: 'networkidle' });
		const bouton = page.getByRole('button', { name: 'Supprimer', exact: true }).first();
		if ((await bouton.count()) > 0) {
			await bouton.click();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(1500);
		}
		const apres = await compter('notes');
		juger('supprimer une note', apres < avant, `notes ${avant} → ${apres}`);
	}

	/* ── 8. LES ÉCRANS D'IMPASSE ───────────────────────────────────────────── */
	titre(`8. LES ÉCRANS D’IMPASSE — ${IMPASSES.length} recensé(s)`);
	if (IMPASSES.length === 0) {
		console.log('     Aucun encore réparé. Chaque lot qui en ferme un l’inscrit ici.');
	}
	for (const impasse of IMPASSES) {
		const contexteVierge = await navigateur.newContext({ viewport: { width: 1440, height: 1600 } });
		const p = await contexteVierge.newPage();
		await p.goto(BASE_URL + impasse.chemin, { waitUntil: 'networkidle' });
		const texte = await p.$eval('body', (n) => n.innerText).catch(() => '');
		await contexteVierge.close();
		juger(`impasse ${impasse.chemin}`, texte.includes(impasse.doitDire), `attendu « ${impasse.doitDire} »`);
	}

	/* ── 9. LE VERDICT ─────────────────────────────────────────────────────── */
	titre('9. LE VERDICT');
	const muets = constats.filter((c) => !c.reussi);
	console.log(`     500 relevés : ${cinqCents.length === 0 ? 'aucun' : cinqCents.join(', ')}`);
	if (muets.length === 0 && cinqCents.length === 0) {
		console.log(
			`\n══ GESTES À FROID COMPLETS — ${constats.length} gestes, tous suivis d’effet, base sans une ligne semée ══\n`
		);
	} else {
		for (const m of muets) console.log(`     ${m.geste} — ${m.detail}`);
		console.log(`\n!! ${muets.length} geste(s) sans effet, ${cinqCents.length} réponse(s) en 500.`);
		console.log('   Un écran qui accepte un geste sans rien écrire est un écran qui ment.');
		code = 1;
	}
} catch (cause) {
	console.error('\n!! LE PASSAGE S’EST ARRÊTÉ :', cause.message);
	code = 1;
} finally {
	await navigateur.close();
	if (serveur !== null && serveur.exitCode === null) serveur.kill('SIGTERM');
	await vite.close();
	await bassin.end();
}
process.exit(code);
