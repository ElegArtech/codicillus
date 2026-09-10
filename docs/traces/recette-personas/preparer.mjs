import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { hash } from '@node-rs/argon2';

// Décor de recette uniquement : aucune semence du produit et aucune base remplacée.
const racine = process.cwd();
for (const fichier of ['.env', '.env.local']) {
	try { process.loadEnvFile(fichier); } catch { /* Facultatif. */ }
}
const connexion = {
	host: process.env.HOTE_BASE ?? process.env.HOTE_POSTGRES ?? '127.0.0.1',
	port: Number(process.env.PORT_BASE ?? process.env.PORT_DB ?? 19432),
	user: process.env.UTILISATEUR_BASE ?? process.env.UTILISATEUR_POSTGRES ?? 'codicillus',
	password: process.env.MDP_BASE ?? process.env.MDP_POSTGRES
};
const ident = (nom) => {
	if (!/^codicillus_recette9_[a-z0-9_]+$/.test(nom)) throw new Error('Nom de base de recette attendu');
	return '"' + nom + '"';
};
async function commande(programme, args, env = process.env) {
	return await new Promise((resolve, reject) => {
		const enfant = spawn(programme, args, { cwd: racine, env, stdio: ['ignore', 'pipe', 'pipe'] });
		let sortie = '';
		enfant.stdout.on('data', (t) => { sortie += t; });
		enfant.stderr.on('data', (t) => { sortie += t; });
		enfant.on('error', reject);
		enfant.on('close', (code) => code === 0 ? resolve(sortie.trim()) : reject(new Error(`${programme} : ${code}\n${sortie}`)));
	});
}
export async function preparer() {
	const suffixe = Date.now().toString(36);
	const prefixe = `codicillus_recette9_${suffixe}`;
	const dossier = `/tmp/${prefixe}`;
	await mkdir(dossier, { mode: 0o700 });
	const bases = { vide: `${prefixe}_vide`, garnie: `${prefixe}_garnie` };
	const gerant = new pg.Pool({ ...connexion, database: 'postgres' });
	await gerant.query(`create database ${ident(bases.vide)}`);
	const { createServer } = await import('vite');
	const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
	const B = await vite.ssrLoadModule('/src/lib/base/commandes.ts');
	const session = B.ouvrir({ ...process.env, NOM_BASE: bases.vide, BASE_POSTGRES: bases.vide });
	const personas = {};
	try {
		await B.migrer(session.pool, racine);
		for (const [nom, role] of [['intervenant', 'lecteur'], ['contributeur', 'contributeur'], ['referent', 'referent'], ['administrateur', 'administrateur']]) {
			const motDePasse = randomBytes(24).toString('base64url');
			const identifiant = `recette.${nom}`;
			const { rows: [compte] } = await session.pool.query(`insert into comptes (identifiant, nom, courriel, role, arrive_le, condensat_mot_de_passe) values ($1,$2,$3,$4,current_date,$5) returning id`, [identifiant, `Recette ${nom}`, `${nom}@recette.invalid`, role, await hash(motDePasse)]);
			personas[nom] = { identifiant, motDePasse, id: compte.id, role };
		}
	} finally { await session.fermer(); await vite.close(); }
	await gerant.query(`create database ${ident(bases.garnie)} template ${ident(bases.vide)}`);
	await gerant.end();
	const pool = new pg.Pool({ ...connexion, database: bases.garnie });
	let donnees;
	try {
		const { rows: [univers] } = await pool.query(`insert into univers (identifiant,nom,couleur,glyphe,ordre) values ('atelier-recette','Atelier boréal','#49745c','layers',0) returning id,identifiant`);
		const { rows: [domaine] } = await pool.query(`insert into domaines (univers_id,identifiant,nom,couleur) values ($1,'exploitation-recette','Exploitation boréale','#49745c') returning id,identifiant`, [univers.id]);
		await pool.query(`insert into modules_de_domaine select $1, unnest(enum_range(null::module_de_domaine))`, [domaine.id]);
		const { rows: [dossierRacine] } = await pool.query(`insert into dossiers (domaine_id,nom,profondeur) values ($1,'Racine boréale',1) returning id`, [domaine.id]);
		const { rows: [dossierEnfant] } = await pool.query(`insert into dossiers (domaine_id,parent_id,nom,profondeur) values ($1,$2,'Relève boréale',2) returning id`, [domaine.id,dossierRacine.id]);
		await pool.query('update comptes set domaine_id=$1', [domaine.id]);
		for (const [nom,droit] of [['intervenant','lecteur'],['contributeur','redacteur'],['referent','gestionnaire']]) await pool.query('insert into droits_de_dossier (dossier_id,compte_id,droit) values ($1,$2,$3)', [dossierRacine.id,personas[nom].id,droit]);
		const corps = (texte) => JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }] });
		const notes = [];
		for (const [suffixeNote,titre,visibilite,anciennete] of [['interne','Relève du relais boréal','interne',120],['publique','Accès public au relais boréal','publique',3],['ancienne','Archive de la station boréale','interne',250]]) {
			const { rows: [note] } = await pool.query(`insert into notes (identifiant,titre,corps_reference,corps_operationnel,corps_operationnel_modifie_le,type_de_note_id,domaine_id,dossier_id,auteur_id,visibilite,verifie_le,verifie_le_operationnel) values ($1,$2,$3,$4,now(),(select id from types_de_note where identifiant='procedure'),$5,$6,$7,$8,now()-$9*interval '1 day',now()-$9*interval '1 day') returning id,identifiant,titre`, [`recette-${suffixeNote}`,titre,corps(`Référence du relais boréal : inventaire et diagnostic ${suffixeNote}.`),corps('Étape 1 : observer le relais. Étape 2 : confirmer la reprise.'),domaine.id,dossierEnfant.id,personas.contributeur.id,visibilite,anciennete]);
			await pool.query(`insert into versions (note_id,numero,le,auteur_id,resume,ajout,retrait,titre,corps_reference,corps_operationnel) select id,1,now(),auteur_id,'Création du décor de recette',1,0,titre,corps_reference,corps_operationnel from notes where id=$1`,[note.id]);
			notes.push(note);
		}
		donnees = { univers,domaine,dossierRacine,dossierEnfant,notes };
	} finally { await pool.end(); }
	const configuration = { racine,prefixe,dossier,bases,personas,donnees };
	const chemin = `${dossier}/configuration.json`;
	await writeFile(chemin,JSON.stringify(configuration,null,2),{ mode:0o600 });
	return chemin;
}
export async function cloner(chemin, nom, jeu = 'garnie', port = 5370) {
	const config = JSON.parse(await readFile(chemin,'utf8'));
	const base = `${config.prefixe}_${nom}`;
	const gerant = new pg.Pool({ ...connexion,database:'postgres' });
	try { await gerant.query(`create database ${ident(base)} template ${ident(config.bases[jeu])}`); } finally { await gerant.end(); }
	const portRecherche = port + 1000;
	const cle = randomBytes(32).toString('hex');
	const conteneur = `${base}_recherche`;
	await commande('docker',['run','-d','--name',conteneur,'-p',`127.0.0.1:${portRecherche}:7700`,'-e','MEILI_MASTER_KEY','getmeili/meilisearch:v1.53.1'], { ...process.env,MEILI_MASTER_KEY:cle });
	const env = { ...process.env,NOM_BASE:base,BASE_POSTGRES:base,PORT:String(port),HOST:'127.0.0.1',ORIGIN:`http://127.0.0.1:${port}`,URL_RECHERCHE:`http://127.0.0.1:${portRecherche}`,CLE_RECHERCHE:cle,CLE_MAITRE_RECHERCHE:cle };
	for (let i=0;i<100;i++) { try { if ((await fetch(`${env.URL_RECHERCHE}/health`)).ok) break; } catch { /* Démarrage. */ } await new Promise((r)=>setTimeout(r,100)); }
	await commande('node',['recherche/recherche.mjs','reindexer'],env);
	const journal = await open(`${config.dossier}/${nom}.log`,'a',0o600);
	const serveur = spawn('node',['build/index.js'],{ cwd:config.racine,env,detached:true,stdio:['ignore',journal.fd,journal.fd] });
	serveur.unref();
	await journal.close();
	const instance = { ...config,base,jeu,port,url:env.ORIGIN,pid:serveur.pid,conteneur,env };
	const sortie = `${config.dossier}/${nom}.json`;
	await writeFile(sortie,JSON.stringify(instance,null,2),{ mode:0o600 });
	for (let essai = 0; essai < 100; essai += 1) {
		try {
			if ((await fetch(`${instance.url}/connexion`)).ok) return sortie;
		} catch { /* Le processus n'écoute pas encore. */ }
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error(`Le clone ${nom} n'écoute pas sur ${port}`);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	if (process.argv[2] === 'cloner') console.log(await cloner(process.argv[3],process.argv[4],process.argv[5],Number(process.argv[6] ?? 5370)));
	else console.log(await preparer());
}

export async function ouvrirNavigateur(cheminInstance, persona, nomTrace) {
	const { chromium } = await import('@playwright/test');
	const instance = JSON.parse(await readFile(cheminInstance, 'utf8'));
	const dossierTraces = `${instance.racine}/docs/traces/recette-personas/${nomTrace}`;
	await mkdir(dossierTraces, { recursive: true });
	const navigateur = await chromium.launch();
	// Aucun enregistrement pendant la connexion : les identifiants restent hors traces.
	const connexionNavigateur = await navigateur.newContext({ locale: 'fr-FR' });
	try {
	if (persona !== 'externe') {
		const pageConnexion = await connexionNavigateur.newPage();
		await pageConnexion.goto(`${instance.url}/connexion`);
		await pageConnexion.locator('#identifiant').fill(instance.personas[persona].identifiant);
		await pageConnexion.locator('#motdepasse').fill(instance.personas[persona].motDePasse);
		await Promise.all([pageConnexion.waitForURL((url) => url.pathname === '/'),pageConnexion.locator('#valider').click()]);
	}
	} catch (erreur) {
		await navigateur.close();
		throw erreur;
	}
	const storageState = await connexionNavigateur.storageState();
	await connexionNavigateur.close();
	const contexte = await navigateur.newContext({ locale: 'fr-FR', viewport: { width: 1440, height: 1000 }, storageState, recordVideo: { dir: dossierTraces } });
	await contexte.tracing.start({ screenshots: true, snapshots: true, sources: false });
	const page = await contexte.newPage();
	const erreurs = [];
	page.on('console', (message) => { if (message.type() === 'error') erreurs.push({ type: 'console', texte: message.text() }); });
	page.on('pageerror', (erreur) => erreurs.push({ type: 'pageerror', texte: erreur.message }));
	page.on('requestfailed', (requete) => erreurs.push({ type: 'requestfailed', url: requete.url(), texte: requete.failure()?.errorText }));
	page.on('response', (reponse) => { if (reponse.status() >= 400) erreurs.push({ type: 'http', code: reponse.status(), url: reponse.url() }); });
	return {
		instance, navigateur, contexte, page, erreurs, dossierTraces,
		async fermer() {
			await page.screenshot({ path: `${dossierTraces}/final.png`, fullPage: true }).catch(() => {});
			await writeFile(`${dossierTraces}/erreurs.json`, JSON.stringify(erreurs,null,2));
			await contexte.tracing.stop({ path: `${dossierTraces}/trace.zip` });
			await contexte.close();
			await navigateur.close();
		}
	};
}

export async function fermerInstance(cheminInstance) {
	const instance = JSON.parse(await readFile(cheminInstance, 'utf8'));
	ident(instance.base);
	if (Object.values(instance.bases).includes(instance.base)) {
		throw new Error('Les bases modèles ne sont pas des clones');
	}
	try { process.kill(instance.pid, 'SIGTERM'); } catch (erreur) { if (erreur.code !== 'ESRCH') throw erreur; }
	await commande('docker', ['rm', '-f', instance.conteneur]);
	const gerant = new pg.Pool({ ...connexion, database: 'postgres' });
	try { await gerant.query(`drop database ${ident(instance.base)} with (force)`); } finally { await gerant.end(); }
}
