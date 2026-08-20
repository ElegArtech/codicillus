#!/usr/bin/env node
/**
 * BATTERIE 18 — SAUVEGARDE, SINISTRE, RESTAURATION, RÉINDEXATION.
 *
 * `PLAN` §5, batterie 18 : « restauration complète depuis une sauvegarde,
 * réindexation incluse, CORPUS IDENTIQUE APRÈS » — `RG-NF-09`. Cette commande a
 * été un JALON pendant cinquante-six lots : elle sortait en 1 sans rien mesurer.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE FAIT VRAIMENT, ET DANS CET ORDRE
 *
 *   1. RELEVÉ AVANT   empreinte du schéma, contenu champ par champ, volume des
 *                     fichiers joints, état de l'index.
 *   2. SAUVEGARDE     les DEUX seuls éléments que `STACK` §8 nomme : le cliché
 *                     de la base, et le volume des fichiers joints. Rien
 *                     d'autre — l'index n'y entre pas, il est reconstructible.
 *   3. SINISTRE       le schéma est détruit, le volume est vidé, l'index est
 *                     perdu. Le sinistre est MESURÉ, pas supposé : sans lui, la
 *                     restauration n'aurait rien à rétablir et la batterie
 *                     serait verte en ne faisant rien.
 *   4. RESTAURATION   les commandes de `docs/exploitation.md` §6, telles
 *                     qu'elles y sont écrites, puis la réindexation complète.
 *   5. RELEVÉ APRÈS   et la comparaison, champ par champ.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ELLE PASSE PAR LES CONTENEURS
 *
 * `pg_dump` et `pg_restore` sont l'élément de sauvegarde que la pile nomme ; ils
 * vivent dans l'image de la base, et le volume des fichiers joints n'est
 * atteignable que par un conteneur. La batterie joue donc les commandes de
 * `docs/exploitation.md` §6 dans leur forme documentée : une recette qu'aucune
 * batterie ne joue est une recette qu'on espère (`P-5`), et c'est précisément ce
 * qu'elle était.
 *
 * ELLE NE SAUTE JAMAIS. Docker absent, conteneur arrêté, corpus vide : elle
 * sort en 1 en disant quoi. Un « rien à faire » vert serait le mode de
 * défaillance `RA-01` du plan.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE VIDE LA BASE QU'ELLE MESURE
 *
 * C'est la nature de l'épreuve, et elle l'annonce avant d'agir — comme
 * `base:reversibilite`, qui descend tout puis remonte. À jouer sur une base
 * d'épreuve, jamais sur une base que d'autres lisent au même moment.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SONDES, ET POURQUOI LEUR CODE EST INVERSÉ
 *
 * Un banc toujours vert ne prouve rien (`RA-01`). `--sonde=<genre>` perturbe le
 * CANDIDAT — la base restaurée, le volume restauré, l'index reconstruit —,
 * jamais le relevé de référence, et exige que la batterie rougisse.
 *
 *   --sonde=ligne-perdue          une ligne retirée après restauration
 *   --sonde=champ-modifie         un seul champ altéré
 *   --sonde=schema-ampute         un index du schéma retiré
 *   --sonde=octets-perdus         un octet réécrit dans un fichier restauré
 *   --sonde=index-non-reconstruit la réindexation n'est pas jouée
 *   --sonde=temoin-inerte         LA MUTATION QUI NE TOUCHE RIEN — refus de
 *                                 conclure, code 2, jamais inversé
 *
 * Usage :
 *   node verif/restauration.mjs                  la batterie
 *   node verif/restauration.mjs --sonde=<genre>  la preuve qu'elle sait dire non
 *   node verif/restauration.mjs --garder         conserve le cliché et l'archive
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, open, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

/* UN TUYAU FERMÉ NE DOIT PAS LAISSER LA BASE DÉTRUITE — mesuré au lot.
   La sortie dirigée vers un afficheur qui s'arrête aux trente premières lignes
   ferme le tuyau ; l'écriture suivante lève une rupture de tuyau, et le
   processus meurt ENTRE le sinistre et la restauration. La base reste vide, et
   AUCUN message ne le dit : le lecteur croit avoir seulement tronqué un
   affichage. Une commande destructive doit survivre à la fermeture de sa
   sortie, et aller au bout de son cycle. */
for (const flux of [process.stdout, process.stderr]) {
	flux.on('error', (erreur) => {
		if (erreur.code !== 'EPIPE') throw erreur;
	});
}

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
const garder = args.includes('--garder');

const SONDES = [
	'ligne-perdue',
	'champ-modifie',
	'schema-ampute',
	'octets-perdus',
	'index-non-reconstruit',
	'temoin-inerte'
];
if (sonde !== undefined && !SONDES.includes(sonde)) {
	console.error(`sonde inconnue : ${sonde}\nsondes : ${SONDES.join(', ')}`);
	exit(2);
}

/* L'ENVIRONNEMENT EST LU AVANT TOUT LE RESTE, ET LES DEUX FICHIERS COMPTENT.
   `.env` porte les secrets de la composition ; `.env.local` porte le PORT de la
   copie de travail, et c'est `verif/preparer-copie.sh` qui l'y écrit. Ne lire
   que le premier fait mesurer le port d'une AUTRE copie — `T-076` É-2 l'a payé :
   sa batterie 6 est partie sur le port par défaut, occupé par le serveur du lot
   voisin et adossé à la base PARTAGÉE, et a rendu 140 défauts dont AUCUN
   n'existait. C'est `ECART-017` É-8, que `P-22` remesure à chaque lot. */
for (const fichier of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(join(racine, fichier));
	} catch {
		/* Absent : l'environnement du processus fait foi (`base/base.mjs`). */
	}
}

/* ═══════════════════════════════════ Les paramètres d'exploitation ═════ */

/* Les mêmes défauts que `src/lib/base/connexion.ts` et que la composition.
   Aucun secret n'est lu ici : la connexion applicative est ouverte par le
   module de commandes, et rien de ce fichier n'imprime de mot de passe. */
const projet = process.env.NOM_PROJET?.trim() || 'codicillus';
const utilisateur = process.env.UTILISATEUR_POSTGRES?.trim() || 'codicillus';
const nomDeLaBase = process.env.BASE_POSTGRES?.trim() || 'codicillus';
const volumeDesFichiers = `${projet}_fichiers`;

/** L'image employée pour atteindre un volume — celle de la recette §6. */
const IMAGE_OUTIL = 'alpine';

/** Le dossier des octets synthétiques dans le volume. Il est retiré à la fin. */
const DOSSIER_DE_L_EPREUVE = 'epreuve-restauration';

/* ═══════════════════════════════════ Les lancements ════════════════════ */

/**
 * Lance une commande. `entree` et `sortie` acceptent un descripteur de fichier,
 * ce dont le cliché a besoin : il sort en binaire sur la sortie standard.
 *
 * @param {string} commande
 * @param {readonly string[]} arguments_
 * @param {{ entree?: number, sortie?: number }} [flux]
 * @returns {Promise<{ code: number, sortie: string, erreur: string }>}
 */
function lancer(commande, arguments_, flux = {}) {
	return new Promise((resoudre, rejeter) => {
		const processus = spawn(commande, [...arguments_], {
			cwd: racine,
			stdio: [
				flux.entree === undefined ? 'ignore' : flux.entree,
				flux.sortie === undefined ? 'pipe' : flux.sortie,
				'pipe'
			]
		});
		let sortie = '';
		let erreur = '';
		processus.stdout?.on('data', (bloc) => (sortie += String(bloc)));
		processus.stderr.on('data', (bloc) => (erreur += String(bloc)));
		processus.on('error', rejeter);
		processus.on('close', (code) => resoudre({ code: code ?? 1, sortie, erreur }));
	});
}

/**
 * Lance une commande et exige qu'elle réussisse.
 *
 * @param {string} quoi
 * @param {string} commande
 * @param {readonly string[]} arguments_
 * @param {{ entree?: number, sortie?: number }} [flux]
 */
async function exiger(quoi, commande, arguments_, flux) {
	const rendu = await lancer(commande, arguments_, flux);
	if (rendu.code !== 0) {
		throw new Error(
			`${quoi} a échoué (code ${String(rendu.code)}) :\n${rendu.erreur.trim() || rendu.sortie.trim()}`
		);
	}
	return rendu;
}

/** Les mêmes arguments de composition à chaque appel, projet compris. */
const composer = (...suite) => ['compose', '--progress', 'quiet', ...suite];

/** Une commande jouée dans un conteneur jetable, monté sur le volume. */
const surLeVolume = (montages, ...commande) => [
	'run',
	'--rm',
	...montages.flatMap((m) => ['-v', m]),
	IMAGE_OUTIL,
	...commande
];

/* ═══════════════════════════════════ L'impression ══════════════════════ */

const ligne = (gauche, droite) => console.log(`  ${gauche.padEnd(58)} ${droite}`);
const titre = (texte) => console.log(`\n  ${texte}`);

/* ═══════════════════════════════════ La batterie ═══════════════════════ */

console.log('AVERTISSEMENT — cette commande DÉTRUIT le schéma et VIDE le volume des');
console.log('fichiers joints, puis les restaure depuis la sauvegarde qu’elle vient de');
console.log('prendre. À jouer sur une base d’épreuve.');
console.log('');
ligne('projet de composition', projet);
ligne('base', `${utilisateur}@${nomDeLaBase}`);
ligne('volume des fichiers joints', volumeDesFichiers);
if (sonde !== undefined) ligne('sonde', sonde);

const { createServer } = await import('vite');
const vite = await createServer({
	server: { middlewareMode: true },
	appType: 'custom',
	logLevel: 'error'
});

/* AUCUNE VALEUR INITIALE, ET C'EST VOLONTAIRE : le verdict ne peut venir que
   d'une branche qui a conclu. Un zéro posé d'avance serait un vert par défaut,
   qu'un chemin oublié rendrait sans rien avoir mesuré. */
/** @type {0 | 1 | 2 | undefined} */
let code;
/** @type {string[]} */
const defauts = [];
let session;
let atelier;
let posesDansLeVolume = false;
/** @type {readonly {table: string, quoi: string, retrait: string}[]} */
let posees = [];
/** @type {unknown} */
let initialContenuPourLeRetrait;
/** @type {import('../src/lib/exploitation/restauration.ts') | undefined} */
let R;

try {
	/** @type {import('../src/lib/base/commandes.ts')} */
	const B = await vite.ssrLoadModule('/src/lib/base/commandes.ts');
	R = await vite.ssrLoadModule('/src/lib/exploitation/restauration.ts');
	/** @type {import('../src/lib/recherche/commandes.ts')} */
	const I = await vite.ssrLoadModule('/src/lib/recherche/commandes.ts');
	/** @type {import('../src/lib/recherche/notes-indexees.ts')} */
	const N = await vite.ssrLoadModule('/src/lib/recherche/notes-indexees.ts');

	/* ── 0. Ce sans quoi la mesure n'aurait aucun sens ────────────────── */

	titre('0. CE QUE LA BATTERIE EXIGE AVANT DE MESURER');

	const docker = await lancer('docker', ['version', '--format', '{{.Server.Version}}']);
	if (docker.code !== 0) {
		throw new Error(
			'Docker ne répond pas. Le cliché de la base et le volume des fichiers joints ' +
				'sont les deux éléments de sauvegarde (STACK §8) et ils vivent tous deux dans ' +
				'la composition : sans Docker, cette batterie ne peut RIEN mesurer — elle ne ' +
				'se contente pas de le supposer.'
		);
	}
	ligne('moteur de conteneurs', docker.sortie.trim());

	const service = await lancer('docker', composer('ps', '--status=running', '--services'));
	const services = service.sortie.split('\n').map((s) => s.trim());
	if (!services.includes('db')) {
		throw new Error(
			`le service « db » du projet ${projet} n’est pas démarré — services en marche : ` +
				`${services.filter(Boolean).join(', ') || 'aucun'}`
		);
	}
	ligne('services en marche', services.filter(Boolean).join(', '));

	session = B.ouvrir(process.env);
	console.log(`  base : ${session.lisible}`);

	const initialContenu = await R.releverLeContenu(session.pool);
	if (initialContenu.lignes === 0) {
		throw new Error(
			'la base est VIDE : une identité prouvée sur zéro ligne ne prouve rien (P-5). ' +
				'Charger le jeu de semence — `pnpm base:migrer && pnpm base:semer` — puis rejouer.'
		);
	}

	atelier = await mkdtemp(join(tmpdir(), 'codicillus-sauvegarde-'));

	/* ── 1. Le relevé d'avant ─────────────────────────────────────────── */

	titre('1. LE RELEVÉ D’AVANT');

	const avantSchema = await B.empreinte(session.pool);
	ligne(
		'empreinte du schéma (base:empreinte, réemployée)',
		`${avantSchema.somme.slice(0, 16)}… (${avantSchema.lignes.length} lignes)`
	);

	/* LES TABLES QUE LE CORPUS LAISSE VIDES N'AURAIENT RIEN À COMPARER : une
	   ligne y est POSÉE pour l'épreuve, puis retirée. Sans elle, la batterie
	   serait verte sur elles sans les avoir éprouvées (P-5). */
	const videsAuDepart = initialContenu.tables.filter((t) => t.lignes.length === 0);
	initialContenuPourLeRetrait = initialContenu;
	posees = await R.poserDesLignesSynthetiques(session.pool);

	const avantContenu = await R.releverLeContenu(session.pool);
	ligne(
		'contenu',
		`${avantContenu.tables.length} tables · ${avantContenu.lignes} lignes · ${avantContenu.somme.slice(0, 16)}…`
	);
	/* LE DÉTAIL EST IMPRIMÉ : un total de lignes cache lesquelles. */
	console.log(
		`      ${avantContenu.tables.map((t) => `${t.table} ${t.lignes.length}`).join(' · ')}`
	);
	ligne(
		'  tables que le jeu de semence laisse vides',
		videsAuDepart.length === 0
			? 'aucune'
			: `${videsAuDepart.length} — ${videsAuDepart.map((t) => t.table).join(', ')}`
	);
	for (const p of posees) ligne(`  ligne posée pour l’épreuve · ${p.table}`, p.quoi);
	const vides = avantContenu.tables.filter((t) => t.lignes.length === 0);
	ligne(
		'  tables restant sans aucune ligne à comparer',
		vides.length === 0 ? 'aucune' : `${vides.length} — ${vides.map((t) => t.table).join(', ')}`
	);

	const pieces = await R.recenserLesPieces(session.pool);

	/* Les octets synthétiques. Le volume des fichiers joints est le second
	   élément de sauvegarde, et il n'a AUCUN octet réel à porter : la table des
	   pièces jointes ne porte ni contenu ni chemin. La mécanique se prouve donc
	   sur des octets fabriqués — écrire un fichier vide « pour faire une pièce »
	   serait une valeur illustrative (P-02). */
	const initialVolume = await mirroirDuVolume(R, atelier, 'volume-initial');
	const source = join(atelier, 'octets-synthetiques', DOSSIER_DE_L_EPREUVE);
	await mkdir(join(source, 'images', '2026'), { recursive: true });
	await writeFile(join(source, 'images', '2026', 'schéma réseau.bin'), Buffer.from(octets256()));
	await writeFile(join(source, 'procédure.txt'), 'des octets accentués — é, ç, ≠\n');
	await writeFile(join(source, 'vide.bin'), Buffer.alloc(0));
	await exiger(
		'la pose des octets synthétiques',
		'docker',
		surLeVolume(
			[`${volumeDesFichiers}:/cible`, `${join(atelier, 'octets-synthetiques')}:/source:ro`],
			'cp',
			'-a',
			'/source/.',
			'/cible/'
		)
	);
	posesDansLeVolume = true;

	const avantFichiers = await mirroirDuVolume(R, atelier, 'volume-avant');
	ligne(
		'volume des fichiers joints',
		`${avantFichiers.fichiers.length} fichiers · ${avantFichiers.octets} octets · ${avantFichiers.somme.slice(0, 16)}…`
	);
	ligne(
		'  dont octets réels du produit',
		`${initialVolume.fichiers.length} fichiers · ${initialVolume.octets} octets`
	);
	ligne(
		'  dont octets synthétiques posés par la batterie',
		`${avantFichiers.fichiers.length - initialVolume.fichiers.length} fichiers`
	);

	const avantIndex = await I.etatDeLIndex(I.moteurDeRecherche(process.env));
	ligne(
		'index avant',
		`${avantIndex.entrees} entrées · posé : ${avantIndex.existe ? 'oui' : 'NON'}`
	);

	/* ── 2. La sauvegarde — les deux seuls éléments ───────────────────── */

	titre('2. LA SAUVEGARDE — les deux éléments de STACK §8, et rien d’autre');

	const cliche = join(atelier, 'sauvegarde.dump');
	const fichierDuCliche = await open(cliche, 'w');
	try {
		await exiger(
			'le cliché de la base',
			'docker',
			composer(
				'exec',
				'-T',
				'db',
				'pg_dump',
				'-U',
				utilisateur,
				'-d',
				nomDeLaBase,
				'--format=custom'
			),
			{ sortie: fichierDuCliche.fd }
		);
	} finally {
		await fichierDuCliche.close();
	}
	const tailleDuCliche = (await stat(cliche)).size;
	ligne('1. cliché de la base (pg_dump --format=custom)', `${tailleDuCliche} octets`);

	const archive = join(atelier, 'fichiers.tar.gz');
	await exiger(
		'l’archive du volume',
		'docker',
		surLeVolume(
			[`${volumeDesFichiers}:/source:ro`, `${atelier}:/cible`],
			'tar',
			'czf',
			'/cible/fichiers.tar.gz',
			'-C',
			'/source',
			'.'
		)
	);
	ligne('2. archive du volume des fichiers joints', `${(await stat(archive)).size} octets`);
	ligne('l’index n’entre PAS dans la sauvegarde', 'RG-NF-09 — il se reconstruit depuis la base');

	/* ── 3. Le sinistre, mesuré ───────────────────────────────────────── */

	titre('3. LE SINISTRE — mesuré, jamais supposé');

	await session.pool.query('DROP SCHEMA public CASCADE');
	await session.pool.query('CREATE SCHEMA public');
	const apresSinistre = await R.releverLeContenu(session.pool);
	const schemaSinistre = await B.empreinte(session.pool);
	ligne(
		'schéma détruit',
		`${schemaSinistre.lignes.length} lignes de catalogue · ${apresSinistre.lignes} lignes de contenu`
	);
	if (apresSinistre.lignes !== 0 || schemaSinistre.lignes.length !== 0) {
		defauts.push(
			`le sinistre n’a pas eu lieu : ${apresSinistre.lignes} lignes et ` +
				`${schemaSinistre.lignes.length} objets subsistent — la restauration n’aurait rien à rétablir`
		);
	}

	await exiger(
		'le vidage du volume',
		'docker',
		surLeVolume([`${volumeDesFichiers}:/cible`], 'find', '/cible', '-mindepth', '1', '-delete')
	);
	const volumeSinistre = await mirroirDuVolume(R, atelier, 'volume-sinistre');
	ligne('volume vidé', `${volumeSinistre.fichiers.length} fichiers restants`);
	if (volumeSinistre.fichiers.length !== 0) {
		defauts.push(`le volume n’a pas été vidé : ${volumeSinistre.fichiers.length} fichiers`);
	}

	const moteur = I.moteurDeRecherche(process.env);
	await moteur.deleteIndexIfExists(N.NOM_DE_L_INDEX);
	const indexSinistre = await I.etatDeLIndex(moteur);
	ligne(
		'index perdu',
		`${indexSinistre.entrees} entrées · posé : ${indexSinistre.existe ? 'OUI' : 'non'}`
	);
	if (indexSinistre.existe) {
		defauts.push('l’index n’a pas été perdu : la réindexation d’après restauration serait inerte');
	}

	/* ── 4. La restauration ───────────────────────────────────────────── */

	titre('4. LA RESTAURATION — les commandes de docs/exploitation.md §6');

	const clicheALire = await open(cliche, 'r');
	/** @type {string[]} */
	let avertissements = [];
	try {
		const rendu = await lancer(
			'docker',
			composer(
				'exec',
				'-T',
				'db',
				'pg_restore',
				'-U',
				utilisateur,
				'-d',
				nomDeLaBase,
				'--clean',
				'--if-exists'
			),
			{ entree: clicheALire.fd }
		);
		/* LE BRUIT DE LA COMPOSITION N'EST PAS UN AVERTISSEMENT DE LA BASE.
		   `docker compose` écrit ses propres avis sur la même sortie ; les
		   compter ensemble ferait annoncer « 1 avertissement » là où la remise en
		   place n'en a produit aucun — un chiffre juste sur la mauvaise chose. */
		avertissements = rendu.erreur
			.split('\n')
			.filter((l) => l.trim() !== '' && !/level=(warning|info|error)/.test(l));
		if (rendu.code !== 0) {
			throw new Error(`la remise en place de la base a échoué :\n${rendu.erreur.trim()}`);
		}
	} finally {
		await clicheALire.close();
	}
	ligne(
		'base remise en place (pg_restore --clean --if-exists)',
		`${avertissements.length} avertissement(s)`
	);
	/* Les avertissements sont IMPRIMÉS, jamais comptés en silence : un chiffre
	   seul laisserait le lecteur supposer ce qu'ils disent. */
	for (const a of avertissements.slice(0, 5)) console.log(`      ${a.trim()}`);

	await exiger(
		'la remise en place du volume',
		'docker',
		surLeVolume(
			[`${volumeDesFichiers}:/cible`, `${atelier}:/source:ro`],
			'tar',
			'xzf',
			'/source/fichiers.tar.gz',
			'-C',
			'/cible'
		)
	);
	ligne('volume remis en place (tar xzf)', 'fait');

	/* La sonde perturbe le CANDIDAT, après restauration et avant relevé. */
	let mutations = 0;
	if (sonde === 'ligne-perdue') {
		const { rowCount } = await session.pool.query(
			'DELETE FROM public.etiquettes_de_note WHERE ctid IN (SELECT ctid FROM public.etiquettes_de_note LIMIT 1)'
		);
		mutations = rowCount ?? 0;
	} else if (sonde === 'champ-modifie') {
		const { rowCount } = await session.pool.query(
			`UPDATE public.notes SET titre = titre || ' (sonde)'
			  WHERE id = (SELECT id FROM public.notes ORDER BY id LIMIT 1)`
		);
		mutations = rowCount ?? 0;
	} else if (sonde === 'schema-ampute') {
		const { rows } = await session.pool.query(
			`SELECT indexname FROM pg_indexes
			  WHERE schemaname = 'public' AND indexname LIKE '%_idx' ORDER BY indexname LIMIT 1`
		);
		const nom = rows[0]?.indexname;
		if (nom !== undefined) {
			await session.pool.query(`DROP INDEX public."${String(nom).replaceAll('"', '""')}"`);
			mutations = 1;
		}
	} else if (sonde === 'octets-perdus') {
		mutations = await reecrireUnOctetDuVolume(atelier);
	} else if (sonde === 'temoin-inerte') {
		/* LA MUTATION QUI NE TOUCHE RIEN : un prédicat qu'aucune ligne ne
		   satisfait. La batterie ne conclut pas d'une perturbation qui n'a rien
		   perturbé — elle refuserait de dire non à un défaut inexistant. */
		const { rowCount } = await session.pool.query(
			`UPDATE public.notes SET titre = titre WHERE FALSE`
		);
		mutations = rowCount ?? 0;
	}
	if (sonde !== undefined) ligne(`sonde ${sonde} — lignes touchées`, String(mutations));

	titre('  LA RÉINDEXATION — le test de cohérence de RG-NF-09');
	let reindexation = { projetees: 0, indexees: 0, precedentes: 0 };
	if (sonde === 'index-non-reconstruit') {
		ligne('réindexation', 'NON JOUÉE — sonde');
	} else {
		reindexation = await I.reindexerLeCorpus(session.db, process.env);
		ligne('notes projetées depuis la base restaurée', String(reindexation.projetees));
		ligne('entrées portées par l’index après échange', String(reindexation.indexees));
		if (reindexation.projetees !== reindexation.indexees) {
			defauts.push(
				`la reconstruction ne redonne pas le corpus : ${reindexation.projetees} projetées, ` +
					`${reindexation.indexees} indexées`
			);
		}
	}

	/* ── 5. L'identité, champ par champ ───────────────────────────────── */

	titre('5. LE CORPUS EST-IL IDENTIQUE ?');

	const apresSchema = await B.empreinte(session.pool);
	const apresContenu = await R.releverLeContenu(session.pool);
	const apresFichiers = await mirroirDuVolume(R, atelier, 'volume-apres');
	const apresIndex = await I.etatDeLIndex(I.moteurDeRecherche(process.env));

	ligne(
		'empreinte du schéma',
		avantSchema.somme === apresSchema.somme
			? `identique — ${avantSchema.somme}`
			: `DIFFÉRENTE — ${avantSchema.somme.slice(0, 16)}… ≠ ${apresSchema.somme.slice(0, 16)}…`
	);
	if (avantSchema.somme !== apresSchema.somme) {
		const apres = new Set(apresSchema.lignes);
		const avant = new Set(avantSchema.lignes);
		for (const l of avantSchema.lignes) if (!apres.has(l)) defauts.push(`schéma perdu  : ${l}`);
		for (const l of apresSchema.lignes) if (!avant.has(l)) defauts.push(`schéma apparu : ${l}`);
	}

	const differences = R.comparerLesContenus(avantContenu, apresContenu);
	ligne(
		'contenu, champ par champ',
		differences.length === 0
			? `identique — ${apresContenu.lignes} lignes, ${apresContenu.somme}`
			: `${differences.length} DIFFÉRENCE(S)`
	);
	for (const d of differences) defauts.push(R.decrireLaDifference(d));

	const differencesDeFichiers = R.comparerLesFichiers(avantFichiers, apresFichiers);
	ligne(
		'volume des fichiers joints, octet par octet',
		differencesDeFichiers.length === 0
			? `identique — ${apresFichiers.fichiers.length} fichiers, ${apresFichiers.octets} octets`
			: `${differencesDeFichiers.length} DIFFÉRENCE(S)`
	);
	for (const d of differencesDeFichiers) defauts.push(R.decrireLaDifferenceDeFichier(d));

	const notesEnBase = apresContenu.tables.find((t) => t.table === 'notes')?.lignes.length ?? 0;
	ligne(
		'l’index porte exactement le corpus',
		apresIndex.entrees === notesEnBase
			? `oui — ${apresIndex.entrees} entrées pour ${notesEnBase} notes`
			: `NON — ${apresIndex.entrees} entrées pour ${notesEnBase} notes`
	);
	if (apresIndex.entrees !== notesEnBase) {
		defauts.push(
			`l’index ne porte pas le corpus : ${apresIndex.entrees} entrées pour ${notesEnBase} notes`
		);
	}

	/* ── 6. Ce que cette batterie NE prouve PAS ───────────────────────── */

	titre('6. CE QUE CETTE BATTERIE NE PEUT PAS PROUVER, ET POURQUOI');
	console.log(
		`    LES OCTETS DES PIÈCES JOINTES. La base recense ${pieces.recensees} pièce(s) jointe(s)\n` +
			`      pour ${pieces.octetsAnnonces} octets annoncés, et la table ne porte AUCUNE colonne de\n` +
			`      contenu ni de chemin — mesuré : [${pieces.colonnes.join(', ')}],\n` +
			`      dont ${pieces.colonnesDeContenu.length} colonne(s) de contenu. Aucun octet réel n’existe\n` +
			'      donc à sauvegarder : la moitié « fichiers joints » de RG-NF-09 est éprouvée sur des\n' +
			'      octets SYNTHÉTIQUES, et ce comptage tombera de lui-même le jour où un lot livrera\n' +
			'      le stockage des fichiers.'
	);
	console.log(
		`    CE QUE LE JEU DE SEMENCE NE REMPLIT PAS. ${videsAuDepart.length} table(s) sur ` +
			`${avantContenu.tables.length} n’y portent aucune ligne :\n      ` +
			`${videsAuDepart.map((t) => t.table).join(', ') || 'aucune'}.\n` +
			`      ${posees.length} y ont été POSÉES pour l’épreuve, puis retirées — leur identité est donc\n` +
			'      mesurée, pas supposée. Restent sans aucune ligne à comparer : ' +
			`${vides.map((t) => t.table).join(', ') || 'aucune'}.`
	);
	console.log(
		'    LA VOLUMÉTRIE. Le cycle est joué sur le corpus de la base mesurée ; la durée d’une\n' +
			'      restauration sur volumétrie haute relève de la batterie 13, pas de celle-ci.'
	);

	/* ── Le verdict ───────────────────────────────────────────────────── */

	console.log('');
	if (defauts.length === 0) {
		console.log(
			'AUCUN DÉFAUT — la sauvegarde des deux seuls éléments de STACK §8, un sinistre\n' +
				'  mesuré, la restauration par les commandes documentées, et le corpus est\n' +
				`  IDENTIQUE : même schéma, mêmes ${apresContenu.lignes} lignes champ par champ,\n` +
				`  mêmes ${apresFichiers.octets} octets, et l’index reconstruit porte les ${notesEnBase} notes.`
		);
	} else {
		console.log(`ÉCHEC — ${defauts.length} défaut(s) :`);
		for (const d of defauts.slice(0, 60)) console.log(`    ${d}`);
		if (defauts.length > 60) console.log(`    … et ${defauts.length - 60} autre(s).`);
	}

	if (sonde === undefined) {
		code = defauts.length === 0 ? 0 : 1;
	} else if (mutations === 0 && sonde !== 'index-non-reconstruit') {
		/* Refus de conclure : la mutation n'a rien touché, elle ne teste rien.
		   Jamais inversé — c'est le témoin qui garde la sonde honnête. */
		console.log(
			`  sonde ${sonde} : la mutation n’a RIEN touché — la batterie refuse de conclure, 2.`
		);
		code = 2;
	} else {
		code = defauts.length > 0 ? 0 : 1;
		console.log(
			defauts.length > 0
				? `  sonde ${sonde} : la batterie a dit non — code de retour inversé, 0.`
				: `  sonde ${sonde} : la batterie n’a rien vu — 1.`
		);
	}

	/* ── La remise en état après une sonde ────────────────────────────── */

	/* UNE SONDE ABÎME LA BASE, ET ELLE NE PEUT PAS L'Y LAISSER. La perturbation
	   porte sur la base RESTAURÉE : sans remise en état, l'exécution suivante
	   prendrait son cliché d'une base amputée, et le défaut posé par la sonde
	   deviendrait la référence — la batterie serait verte sur un corpus dégradé.
	   Le cliché est encore là : la remise en place est rejouée, et VÉRIFIÉE. */
	if (sonde !== undefined) {
		const rejoue = await open(cliche, 'r');
		try {
			await exiger(
				'la remise en état après sonde',
				'docker',
				composer(
					'exec',
					'-T',
					'db',
					'pg_restore',
					'-U',
					utilisateur,
					'-d',
					nomDeLaBase,
					'--clean',
					'--if-exists'
				),
				{ entree: rejoue.fd }
			);
		} finally {
			await rejoue.close();
		}
		await exiger(
			'la remise en état du volume après sonde',
			'docker',
			surLeVolume(
				[`${volumeDesFichiers}:/cible`, `${atelier}:/source:ro`],
				'tar',
				'xzf',
				'/source/fichiers.tar.gz',
				'-C',
				'/cible'
			)
		);
		await I.reindexerLeCorpus(session.db, process.env);
		const remis = R.comparerLesContenus(avantContenu, await R.releverLeContenu(session.pool));
		const remisSchema = await B.empreinte(session.pool);
		const remisEnEtat = remis.length === 0 && remisSchema.somme === avantSchema.somme;
		ligne(
			'base remise en état après la sonde',
			remisEnEtat ? 'identique' : 'NON — voir ci-dessous'
		);
		if (!remisEnEtat) {
			console.log(`    ${remis.length} différence(s) subsistent, schéma ${remisSchema.somme}`);
			for (const d of remis.slice(0, 10)) console.log(`    ${R.decrireLaDifference(d)}`);
			code = 1;
		}
	}
} catch (erreur) {
	console.error(`\nÉCHEC — ${erreur instanceof Error ? erreur.message : String(erreur)}`);
	code = 1;
} finally {
	/* LES LIGNES POSÉES POUR L'ÉPREUVE NE RESTENT PAS DANS LA BASE, et leur
	   retrait est VÉRIFIÉ : une épreuve qui laisserait sa propre semence
	   derrière elle deviendrait la référence de l'exécution suivante. */
	if (posees.length > 0 && session !== undefined && R !== undefined) {
		const retirees = await R.retirerLesLignesSynthetiques(session.pool, posees);
		const restant = R.comparerLesContenus(
			initialContenuPourLeRetrait,
			await R.releverLeContenu(session.pool)
		);
		ligne(
			'lignes synthétiques retirées',
			`${retirees} — base rendue à son état d’origine : ${restant.length === 0 ? 'oui' : 'NON'}`
		);
		if (restant.length !== 0) {
			for (const d of restant.slice(0, 10)) console.log(`    ${R.decrireLaDifference(d)}`);
			code = 1;
		}
	}

	/* Les octets synthétiques ne restent pas dans le volume du produit. */
	if (posesDansLeVolume) {
		const retrait = await lancer(
			'docker',
			surLeVolume([`${volumeDesFichiers}:/cible`], 'rm', '-rf', `/cible/${DOSSIER_DE_L_EPREUVE}`)
		);
		if (retrait.code !== 0) {
			console.error(
				`  AVERTISSEMENT — les octets synthétiques n’ont pas pu être retirés du volume.`
			);
			code = 1;
		}
	}
	/* LE CLICHÉ SURVIT À UN ÉCHEC, ET C'EST LA SEULE ISSUE POUR L'EXPLOITANT.
	   Cette batterie détruit avant de rétablir : si elle rend rouge, la base peut
	   être dans l'état où la restauration l'a laissée. Effacer la sauvegarde au
	   même moment retirerait à l'exploitant le seul objet qui la rétablit. Elle
	   n'est donc retirée que sur un verdict VERT. */
	if (atelier !== undefined) {
		if (garder || code !== 0) {
			console.log(`\n  cliché et archive CONSERVÉS dans ${atelier}`);
			console.log(
				'  pour rétablir la base à la main :\n' +
					`    docker compose exec -T db pg_restore -U ${utilisateur} -d ${nomDeLaBase} --clean --if-exists < ${join(atelier, 'sauvegarde.dump')}`
			);
		} else {
			await rm(atelier, { recursive: true, force: true });
		}
	}
	if (session !== undefined) await session.fermer();
	await vite.close();
}

/* Le refus de conclure (2) sort en 1 comme un échec : seule une batterie qui a
   conclu au vert sort en 0. Un verdict absent sort en 1, jamais en 0. */
exit(code === 0 ? 0 : 1);

/* ═══════════════════════════════════ Les outils du lanceur ═════════════ */

/**
 * Le relevé du volume, par une copie fidèle sur l'hôte : un volume nommé n'est
 * lisible que depuis un conteneur. La copie emploie le même chemin aux deux
 * bouts du cycle — un artefact de copie s'annulerait donc, et `cp -a` préserve
 * les octets.
 *
 * @param {import('../src/lib/exploitation/restauration.ts')} R
 * @param {string} atelier
 * @param {string} nom
 */
async function mirroirDuVolume(R, atelier, nom) {
	const cible = join(atelier, nom);
	await rm(cible, { recursive: true, force: true });
	await mkdir(cible, { recursive: true });
	await exiger(
		`la lecture du volume (${nom})`,
		'docker',
		surLeVolume(
			[`${volumeDesFichiers}:/source:ro`, `${cible}:/cible`],
			'sh',
			'-c',
			'cp -a /source/. /cible/ 2>/dev/null; exit 0'
		)
	);
	return await R.releverUneArborescence(cible);
}

/**
 * Réécrit UN octet d'un fichier restauré du volume, sans en changer la taille.
 * C'est la perturbation que seule une comparaison d'octets voit — une
 * comparaison de tailles la laisserait passer.
 *
 * @param {string} atelier
 * @returns {Promise<number>}
 */
async function reecrireUnOctetDuVolume(atelier) {
	const chemin = `/cible/${DOSSIER_DE_L_EPREUVE}/procédure.txt`;
	const rendu = await lancer(
		'docker',
		surLeVolume(
			[`${volumeDesFichiers}:/cible`, `${atelier}:/source:ro`],
			'sh',
			'-c',
			`printf 'X' | dd of="${chemin}" bs=1 seek=0 conv=notrunc 2>/dev/null && echo touche`
		)
	);
	return rendu.sortie.includes('touche') ? 1 : 0;
}

/** Les 256 valeurs d'octet, dans l'ordre — un contenu binaire non textuel. */
function octets256() {
	return Array.from({ length: 256 }, (_, i) => i);
}
