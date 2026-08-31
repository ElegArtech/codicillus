/**
 * LE PASSAGE À FROID — une instance NEUVE, ouverte écran par écran.
 *
 * Il monte une base vide, applique les migrations, N'EN SÈME AUCUNE DONNÉE,
 * crée à la main le strict nécessaire — un univers, un domaine, deux notes, un
 * signet —, puis ouvre les trente-neuf routes du produit dans Chromium et LIT LE
 * HTML SERVI. Il échoue si un seul nom du jeu de démonstration s'y trouve.
 *
 * IL PÈSE AUSSI LE CODE HTTP DE CHAQUE ROUTE, et c'est la moitié du contrôle :
 * chaque route porte, écrit à côté d'elle, le code qu'on attend d'elle. Le
 * passage a longtemps IMPRIMÉ ce code sans jamais le juger — trente-neuf pages
 * en 500 se seraient relevées en 500 sous un verdict « PASSAGE À FROID COMPLET »
 * et un code de sortie 0. Le dépôt porte cet incident-là au passé.
 *
 * C'EST EXACTEMENT LE GESTE QUE DEUX FICHIERS DU DÉPÔT RACONTENT AVOIR FAIT À
 * LA MAIN LE 21/08/2026 (`schema.ts:444`, `identite.ts:12`). Automatisé, il
 * aurait attrapé le seul défaut vraiment SERVI du balayage du 26/08 : ouvrir
 * n'importe quelle note en modification affichait le corps de la note de
 * démonstration, dans le rendu serveur, PERMANENT SANS JAVASCRIPT.
 *
 * IL MESURE LE PRODUIT CONSTRUIT, PAS LE SERVEUR DE DÉVELOPPEMENT.
 * `vite dev` sert les sources : il a rendu, dans le HTML, un commentaire de
 * `V-15.css` qui cite l'adresse où une mesure de grille a été prise le
 * 21/08/2026. Le relevé du 26/08 §3 a tranché ce cas — le commentaire est une
 * note d'ingénierie, esbuild l'efface, et `grep` sur le paquet ne le trouve pas.
 * Un contrôle qui crierait dessus crierait sur un fichier que personne ne livre.
 * Le passage construit donc le produit et lance `build/index.js`.
 *
 * DEUX LECTURES, ET ELLES NE DISENT PAS LA MÊME CHOSE :
 *   · LE HTML SERVI — la réponse du serveur, avant toute exécution. C'est ce
 *     que voit un lecteur sans JavaScript, un moteur d'indexation, et le source
 *     de la page. C'est là que vivait le défaut de l'éditeur.
 *   · LE RENDU HYDRATÉ — le document après exécution. Une constante remplacée
 *     au montage n'y est plus ; elle était pourtant servie.
 *
 * IL NE VOIT PAS CE QUI NE S'AFFICHE PAS. Une branche morte part chez le
 * lecteur sans jamais se rendre : c'est l'objet de `aiguilles-dans-le-paquet.mjs`,
 * et les deux contrôles ne se remplacent pas.
 *
 *     node docs/traces/passage-a-froid.mjs
 *     pnpm build && node docs/traces/passage-a-froid.mjs --tel-quel
 *     PORT_FROID=5267 BASE_FROIDE=codicillus_passage_a_froid \
 *       node docs/traces/passage-a-froid.mjs
 *
 * IL POSE SON DÉCOR ET IL LE DIT — c'est ce qui le distingue d'un instrument qui
 * triche. Il crée le premier administrateur (`pnpm base:administrateur`), puis
 * il pose un droit `gestionnaire` sur le dossier racine du domaine qu'il vient
 * de créer : `droits_de_dossier` ne porte AUCUNE ligne sur une instance neuve,
 * et `RG-DRO-02` est sans appel — aucun droit explicite, aucune capacité. Sans
 * ce geste, le produit est en lecture seule et aucune note ne peut naître.
 *
 * IL ÉCRIT EN BASE, mais dans une base à lui, qu'il détruit et recrée à chaque
 * passage. Aucune autre base du poste n'est touchée.
 *
 * Code de retour : 0 si chaque route a rendu le code attendu d'elle et qu'aucun
 * nom du jeu n'a été servi, 1 sinon.
 */
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { aiguillesDuCorpus, aiguillesTrouvees, ECARTES } from './aiguilles-du-corpus.mjs';

const telQuel = process.argv.includes('--tel-quel');
const racine = process.argv.slice(2).find((a) => !a.startsWith('-')) ?? process.cwd();
for (const f of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(join(racine, f));
	} catch {
		/* absent : l'environnement du processus fait foi */
	}
}

const PORT = Number(process.env.PORT_FROID ?? 5267);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BASE_FROIDE = process.env.BASE_FROIDE ?? 'codicillus_passage_a_froid';

/* LA BASE DU PASSAGE, POSÉE AVANT TOUT CHARGEMENT DE MODULE DU PRODUIT.
   `configurationDeConnexion()` lit les `*_BASE` d'abord et les `*_POSTGRES` à
   défaut ; poser les deux ferme les deux chemins, et `.env` ne les écrase pas. */
process.env.NOM_BASE = BASE_FROIDE;
process.env.BASE_POSTGRES = BASE_FROIDE;

const IDENTIFIANT = 'a.froid';
/* TIRÉ À CHAQUE PASSAGE, JAMAIS ÉCRIT ICI. Le compte naît dans la base jetable
   du passage et meurt avec elle : le secret n'a aucune valeur hors du processus
   qui le tire. Mais ce fichier est VERSIONNÉ dans un dépôt PUBLIC, et le dépôt
   vient d'expulser un mot de passe de développement de `CLAUDE.md` pour ce motif
   exact (`chore(sécurité)`). Un littéral qui ressemble à un identifiant n'a rien
   à faire dans un fichier public, même quand il n'ouvre rien. */
const MOT_DE_PASSE = (await import('node:crypto')).randomBytes(24).toString('base64url');

/* CE QUE LE PASSAGE CRÉE. Aucun de ces noms n'est dans le jeu, et c'est le
   point : si l'un des écrans affiche autre chose, l'autre chose vient d'ailleurs. */
const NOM_ADMIN = 'Compte du passage à froid';
const UNIVERS = 'Univers du passage';
const DOMAINE = 'Domaine du passage';
const NOTE_INTERNE = 'Note interne du passage à froid';
const NOTE_PUBLIQUE = 'Guide public du passage à froid';
const SIGNET = 'Signet du passage à froid';

const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 68 - t.length))}`);

/* ── 0. LE PRODUIT, CONSTRUIT ────────────────────────────────────────────────
   `--tel-quel` réemploie le paquet déjà là — c'est ce qui permet d'enchaîner les
   deux contrôles sur UNE construction. */
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

/* ── 1. UNE BASE VIDE ────────────────────────────────────────────────────────
   Détruite et recréée : un passage à froid qui repartirait d'une base d'hier
   mesurerait l'histoire du poste, pas l'installation d'un inconnu. */
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
	await gerant.query(`drop database if exists "${BASE_FROIDE}" with (force)`);
	await gerant.query(`create database "${BASE_FROIDE}"`);
	await gerant.end();
	console.log(`     base      ${BASE_FROIDE} — détruite puis recréée`);
}

const bassin = new pg.Pool({ ...connexion, database: BASE_FROIDE });
const interroger = async (sql, v = []) => (await bassin.query(sql, v)).rows;

/* Les migrations passent par le TypeScript du dépôt, comme `base/base.mjs` : un
   Vite en intergiciel, sans port, refermé aussitôt. */
const { createServer } = await import('vite');
const vite = await createServer({
	root: racine,
	server: { middlewareMode: true, hmr: false },
	appType: 'custom',
	logLevel: 'error'
});

let code = 0;
let serveur = null;
const navigateur = await chromium.launch();
try {
	const B = await vite.ssrLoadModule('/src/lib/base/commandes.ts');
	const session = B.ouvrir(process.env);
	const posees = await B.migrer(session.pool, racine);
	console.log(`     migrations ${posees.length} appliquées`);
	for (const t of ['univers', 'domaines', 'dossiers', 'notes', 'comptes', 'droits_de_dossier']) {
		const [{ n }] = await interroger(`select count(*)::int as n from ${t}`);
		console.log(`     ${t.padEnd(18)} ${n}`);
	}

	/* ── 2. LE DÉCOR, ET IL EST DIT ──────────────────────────────────────────── */
	titre('2. LE DÉCOR — posé, et nommé');
	const premier = await B.creerLePremierAdministrateur(session, {
		identifiant: IDENTIFIANT,
		nom: NOM_ADMIN,
		courriel: 'passage@invalid.test',
		motDePasse: MOT_DE_PASSE
	});
	if (!premier.cree) throw new Error(`premier administrateur refusé — ${premier.motif}`);
	console.log(`     compte    ${IDENTIFIANT} — « ${NOM_ADMIN} », administrateur`);
	await session.pool.end();

	/* LE PRODUIT CONSTRUIT, SERVI. Un enfant DIRECT : son identifiant de processus
	   est celui qu'on tient, et il n'y a pas de père à confondre avec son fils. */
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

	const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
	const page = await contexte.newPage();
	page.on('dialog', (d) => d.accept());

	const echanges = [];
	const marque = () => echanges.length;
	const depuis = (i) =>
		echanges
			.slice(i)
			.map((e) => `     ${e.methode.padEnd(4)} ${e.chemin.padEnd(58)} ${e.code}`)
			.join('\n');
	page.on('response', (r) => {
		const u = new URL(r.url());
		if (u.port !== String(PORT)) return;
		if (u.pathname.startsWith('/@') || u.pathname.startsWith('/src/')) return;
		if (u.pathname.startsWith('/node_modules') || u.pathname.startsWith('/polices')) return;
		if (/\.(css|js|svg|png|woff2?|ico|map|json)$/u.test(u.pathname)) return;
		echanges.push({
			methode: r.request().method(),
			chemin: u.pathname + u.search,
			code: r.status()
		});
	});

	let i = marque();
	await page.goto(`${BASE_URL}/connexion`, { waitUntil: 'networkidle' });
	await page.fill('#identifiant', IDENTIFIANT);
	await page.fill('#motdepasse', MOT_DE_PASSE);
	await Promise.all([page.waitForURL(`${BASE_URL}/`), page.click('#valider')]);

	/* L'UNIVERS ET LE DOMAINE — par la console, avec les gestes de la console.
	   C'est le chemin qu'un installateur suit, et le seul : sur zéro univers,
	   l'éditeur et l'import rendent 404 par conception. */
	await page.goto(`${BASE_URL}/console/univers`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', UNIVERS);
	await page.click('#form-valider');
	await page.waitForFunction((nom) => document.body.textContent?.includes(nom) === true, UNIVERS, {
		timeout: 15000
	});

	await page.goto(`${BASE_URL}/console/domaines`, { waitUntil: 'networkidle' });
	await page.click('#creer');
	await page.fill('#f-nom', DOMAINE);
	await page.selectOption('#f-univers', { index: 0 });
	/* TOUS LES MODULES : les routes de signets, de cartographie et de carte
	   mentale n'existent pas sans eux, et ce sont des routes à ouvrir.

	   ON AMÈNE CHAQUE CASE SOUS LES YEUX AVANT DE LA COCHER. Le tiroir de
	   formulaire est plus long que la fenêtre, et `force: true` saute les
	   contrôles d'actionnabilité SANS jamais lever la contrainte de fenêtre :
	   selon la hauteur rendue, la dernière case tombait dehors et le passage
	   s'arrêtait sur « Element is outside of the viewport », une fois sur
	   quatre. Un garde-fou intermittent est un garde-fou qu'on débranche.
	   Le geste reste celui d'un utilisateur — on déroule, puis on coche. */
	for (const b of await page.$$('#f-modules input[type="checkbox"]:not([disabled])')) {
		if (await b.isChecked()) continue;
		await b.scrollIntoViewIfNeeded();
		await b.check({ force: true });
	}
	await page.click('#form-valider');
	await page.waitForFunction((nom) => document.body.textContent?.includes(nom) === true, DOMAINE, {
		timeout: 15000
	});
	console.log(depuis(i));
	const [univers] = await interroger('select identifiant from univers');
	const [domaine] = await interroger('select identifiant from domaines');
	console.log(`     univers   ${univers.identifiant} — « ${UNIVERS} », créé en console`);
	console.log(`     domaine   ${domaine.identifiant} — « ${DOMAINE} », tous modules actifs`);

	/* LE DROIT D'ÉCRIRE. `droits_de_dossier` ne porte AUCUNE ligne sur une
	   instance neuve, et `RG-DRO-02` rend alors le produit en lecture seule pour
	   TOUT LE MONDE, administrateur compris. La console M14.6 pose ces droits ;
	   ici, le passage les pose lui-même — et il le dit. */
	{
		const [compte] = await interroger('select id from comptes where identifiant = $1', [
			IDENTIFIANT
		]);
		const racines = await interroger('select id, nom from dossiers where parent_id is null');
		for (const r of racines) {
			await interroger(
				`insert into droits_de_dossier (dossier_id, compte_id, droit)
				 values ($1, $2, 'gestionnaire')
				 on conflict (dossier_id, compte_id) do update set droit = 'gestionnaire'`,
				[r.id, compte.id]
			);
		}
		console.log(
			`     droits    gestionnaire sur ${racines.length} dossier racine — RG-DRO-02, posé en base`
		);
	}

	/* ── 3. LE STRICT NÉCESSAIRE ─────────────────────────────────────────────── */
	titre('3. LE STRICT NÉCESSAIRE — deux notes et un signet');
	i = marque();
	const ecrireUneNote = async (titreDeNote, publique) => {
		await page.goto(`${BASE_URL}/notes/nouvelle`, { waitUntil: 'networkidle' });
		await page.fill('#titre', titreDeNote);
		const dossier = page.locator('#m-dossier input').first();
		await dossier.scrollIntoViewIfNeeded();
		await dossier.check({ force: true });
		if (publique) await page.click('#m-visibilite button[data-val="Publique"]');
		await page.locator('#redaction').click();
		await page.keyboard.type(`Corps écrit par le passage à froid, pour « ${titreDeNote} ».`);
		await Promise.all([
			page.waitForURL(new RegExp(`${BASE_URL.replace(/\./gu, '\\.')}/notes/n-`, 'u')),
			page.click('#enregistrer')
		]);
		return new URL(page.url()).pathname.split('/').pop();
	};
	const interne = await ecrireUneNote(NOTE_INTERNE, false);
	const publique = await ecrireUneNote(NOTE_PUBLIQUE, true);

	/* UNE MODIFICATION, POUR QUE `/comparaison` AIT DEUX VERSIONS À COMPARER. */
	await page.goto(`${BASE_URL}/notes/${interne}/modifier`, { waitUntil: 'networkidle' });
	await page.locator('#redaction').click();
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Enter');
	await page.keyboard.type('Seconde version, écrite par le passage à froid.');
	await Promise.all([page.waitForURL(`${BASE_URL}/notes/${interne}`), page.click('#enregistrer')]);

	const adresseDomaine = `/univers/${univers.identifiant}/${domaine.identifiant}`;
	await page.goto(`${BASE_URL}${adresseDomaine}/signets/nouveau`, { waitUntil: 'networkidle' });
	await page.fill('#adresse', 'https://exemple.invalid/passage-a-froid');
	await page.fill('#titre-signet', SIGNET);
	await page.click('#valider-page');
	await page.waitForURL((u) => !u.pathname.endsWith('/nouveau'), { timeout: 15000 });
	console.log(depuis(i));

	const notes = await interroger('select identifiant, titre, visibilite from notes order by titre');
	for (const n of notes) console.log(`     note      ${n.identifiant} — ${n.visibilite}`);
	const [signet] = await interroger('select identifiant, titre from notes where titre = $1', [
		SIGNET
	]);
	if (signet === undefined) throw new Error('le signet du décor n’a pas été créé');
	console.log(`     signet    ${signet.identifiant} — « ${SIGNET} »`);

	/* ── 4. LES AIGUILLES ────────────────────────────────────────────────────── */
	titre('4. LES AIGUILLES');
	const aiguilles = await aiguillesDuCorpus();
	console.log(`     ${aiguilles.length} noms du jeu cherchés dans chaque réponse.`);
	console.log(
		ECARTES.length === 1
			? '     1 nom écarté — il est AUSSI du vocabulaire du produit :'
			: `     ${ECARTES.length} noms écartés — ils sont AUSSI du vocabulaire du produit :`
	);
	for (const e of ECARTES) console.log(`       « ${e.mot} » — ${e.motif}`);
	console.log('     AUCUNE EXEMPTION ICI. Ce qu’un lecteur peut lire à l’écran ne s’exempte pas.');

	/* ── 5. LES ROUTES ───────────────────────────────────────────────────────── */
	const chemin = (c) =>
		c
			.replaceAll('{univers}', univers.identifiant)
			.replaceAll('{domaine}', domaine.identifiant)
			.replaceAll('{note}', interne)
			.replaceAll('{guide}', publique)
			.replaceAll('{signet}', signet.identifiant);

	/* CHAQUE ROUTE PORTE LE CODE QU'ON ATTEND D'ELLE, ÉCRIT À CÔTÉ D'ELLE ET
	   JAMAIS DEVINÉ. Sur le décor que le passage se pose — un univers, un
	   domaine, deux notes, un signet —, tout s'ouvre ; seule l'adresse qui
	   n'existe pas est introuvable, et elle l'est dans les deux polarités. Un
	   écart au code attendu est une fuite au même titre qu'une aiguille du
	   jeu : il s'affiche au relevé, et il fait rendre 1. */
	const EN_SESSION = [
		['/', 200],
		['/recherche', 200],
		['/notes/nouvelle', 200],
		['/notes/{note}', 200],
		['/notes/{note}/modifier', 200],
		['/notes/{note}/operationnel', 200],
		['/notes/{note}/relations', 200],
		['/notes/{note}/comparaison', 200],
		['/univers/{univers}', 200],
		['/univers/{univers}/{domaine}', 200],
		['/univers/{univers}/{domaine}/notes', 200],
		['/univers/{univers}/{domaine}/dossiers/', 200],
		['/univers/{univers}/{domaine}/signets', 200],
		['/univers/{univers}/{domaine}/signets/nouveau', 200],
		['/univers/{univers}/{domaine}/signets/{signet}/modifier', 200],
		['/cartographie', 200],
		['/cartographie/par-type', 200],
		['/carte-mentale', 200],
		['/importer', 200],
		['/mon-profil', 200],
		['/bibliotheque', 200],
		['/console', 200],
		['/console/univers', 200],
		['/console/domaines', 200],
		['/console/types-de-fiches', 200],
		['/console/types-de-relations', 200],
		['/console/templates', 200],
		['/console/comptes', 200],
		['/console/imports', 200],
		['/console/exports', 200],
		['/console/analytique', 200],
		['/console/configuration', 200],
		/* L'ADRESSE QUI N'EXISTE PAS — c'est V-26, et c'est là que la table
		   d'adresses de sa planche s'afficherait si la route ne passait pas la
		   sienne. Elle est ouverte dans les deux polarités, et elle est la seule
		   du relevé dont on attend autre chose qu'un 200. */
		['/notes/n-adresse-qui-n-existe-pas', 404]
	];
	const ANONYME = [
		['/', 200],
		['/connexion', 200],
		['/guides/{guide}', 200],
		['/mot-de-passe-oublie', 200],
		/* 404, ET C'EST LE CHANGEMENT VOULU. La route `[jeton]` rendait le même
		   écran que sa parente sans jamais lire son paramètre, et aucun lien du
		   produit ne l'émettait : le parcours de réinitialisation passe par un mot
		   de passe temporaire que l'administrateur régénère, il n'y a pas de jeton.
		   Une adresse qui ne mène nulle part doit le dire. */
		['/mot-de-passe-oublie/jeton-qui-n-existe-pas', 404],
		['/notes/n-adresse-qui-n-existe-pas', 404]
	];

	const fuites = [];
	const ecarts = [];
	const ouvrir = async (p, routes, polarite) => {
		titre(`5. LES ROUTES — ${polarite} (${routes.length})`);
		for (const [brut, attendu] of routes) {
			const c = chemin(brut);
			const reponse = await p.goto(BASE_URL + c, { waitUntil: 'networkidle' });
			const obtenu = reponse.status();
			if (obtenu !== attendu) ecarts.push({ chemin: c, polarite, attendu, obtenu });
			const servi = await reponse.text();
			const rendu = await p.content();
			const surServi = aiguillesTrouvees(servi, aiguilles);
			const surRendu = aiguillesTrouvees(rendu, aiguilles);
			const marques = [
				...surServi.map((v) => ({ ...v, lecture: 'HTML servi' })),
				...surRendu
					.filter((v) => !surServi.some((s) => s.mot === v.mot))
					.map((v) => ({ ...v, lecture: 'rendu hydraté' }))
			];
			for (const m of marques) fuites.push({ ...m, chemin: c, polarite });
			const griefs = [];
			if (obtenu !== attendu) griefs.push(`${attendu} ATTENDU`);
			if (marques.length > 0) griefs.push(`${marques.length} AIGUILLE(S)`);
			const verdict = griefs.length === 0 ? 'propre' : griefs.join(', ');
			console.log(
				`     ${String(obtenu).padEnd(4)} ${c.padEnd(52)} ` +
					`${String(servi.length).padStart(7)} o  ${verdict}`
			);
		}
	};

	await ouvrir(page, EN_SESSION, 'en session');

	const contexteAnonyme = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
	const pageAnonyme = await contexteAnonyme.newPage();
	await ouvrir(pageAnonyme, ANONYME, 'anonyme');
	await contexteAnonyme.close();

	/* ── 6. LE RELEVÉ ────────────────────────────────────────────────────────── */
	titre('6. LE RELEVÉ');
	const nombreDeRoutes = EN_SESSION.length + ANONYME.length;

	if (ecarts.length === 0) {
		console.log(`     CODES.     Les ${nombreDeRoutes} routes ont rendu le code attendu d’elles.`);
	} else {
		for (const e of ecarts) {
			console.log(
				`     ${e.chemin.padEnd(56)} (${e.polarite})  a rendu ${e.obtenu}, ` +
					`${e.attendu} attendu`
			);
		}
		console.log(
			`\n!! ${ecarts.length} route(s) hors du code attendu : le produit ne s’ouvre pas comme il`
		);
		console.log('   le promet. Le remède est dans la ROUTE — son chargeur, son gabarit, son');
		console.log('   droit — jamais dans le code attendu écrit à côté d’elle.');
		code = 1;
	}

	if (fuites.length === 0) {
		console.log('     AIGUILLES. Aucun nom du jeu de démonstration n’a été servi.');
	} else {
		for (const f of fuites) {
			console.log(`     ${f.chemin}  (${f.polarite}, ${f.lecture})  ×${f.combien}`);
			console.log(`        « ${f.mot} » — ${f.origine}`);
			console.log(`        ${f.extrait}`);
		}
		console.log(
			`\n!! ${fuites.length} fuite(s) : une instance neuve montre le jeu de démonstration.`
		);
		console.log('   Le remède est la DONNÉE, pas la condition : une propriété requise que la');
		console.log('   route passe, ou un état vide explicite — jamais une constante du jeu.');
		code = 1;
	}

	if (code === 0) {
		console.log(
			`\n══ PASSAGE À FROID COMPLET — ${nombreDeRoutes} routes toutes au code attendu, ` +
				`${aiguilles.length} aiguilles, base sans une ligne du jeu ══\n`
		);
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
