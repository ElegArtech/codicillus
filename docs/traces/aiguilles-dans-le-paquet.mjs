/**
 * LE CONTRÔLE DU PAQUET — ce qui SE LIVRE, et qui ne s'affiche jamais.
 *
 * Il construit le produit, puis lit chaque octet de `build/` en cherchant les
 * noms du jeu de démonstration. Il ne rend aucun verdict sur ce qu'un écran
 * montre : c'est l'objet de `passage-a-froid.mjs`, et les deux ne se remplacent
 * pas.
 *
 * IL LIT LES DEUX MOITIÉS DU PAQUET, ET C'EST UNE CORRECTION.
 * La première rédaction ne balayait que `build/client/` tout en annonçant
 * mesurer « ce qui se livre » — une ZONE AVEUGLE, non déclarée, sur la moitié du
 * paquet. `build/server/` est livré aussi : c'est ce que l'image porte et ce que
 * `node build/index.js` exécute. Mesuré sur la même construction, il portait
 * QUATRE CENTS occurrences sur cinquante-trois fichiers, autant dans leurs
 * cartes de source. La principale est le chunk de `creation.js` — 85 314 octets,
 * `CORPUS` sérialisé en entier (titres, auteurs, univers, domaines, adresses),
 * importé par DIX nœuds de routes de `build/server/chunks/nodes/`.
 *
 * ET LA CAUSE EST DÉJÀ NOMMÉE DANS LE DÉPÔT, à son site : le bloc d'exemption
 * d'`eslint.config.js` dit que `src/lib/donnees/creation.ts:76` et
 * `src/lib/donnees/signets-ecriture.ts:41` importent `corpsVide()` de
 * `src/lib/base/semence.ts`, qui importe `CORPUS` EN VALEUR — si bien que
 * `notes/nouvelle/+page.server.ts` et les trois serveurs de signets font
 * descendre le jeu entier dans le paquet serveur. Le remède y est écrit :
 * déplacer `corpsVide()` hors de la semence. Il n'appartient à aucun lot de la
 * campagne, et il ne s'obtient pas en ne regardant pas.
 *
 * LES DEUX ZONES NE PÈSENT PAS PAREIL, ET LE RELEVÉ LE DIT :
 *   · `build/client/` — CE QUI PART CHEZ LE LECTEUR. Un nom trouvé là est lu par
 *     qui veut, y compris par qui reçoit 404 : les chunks sont servis comme
 *     ressources statiques, avant toute autorisation. Relevé occurrence par
 *     occurrence.
 *   · `build/server/` — CE QUI TOURNE SUR LE SERVEUR. Aucun octet n'en part vers
 *     un navigateur, mais tout littéral qui s'y trouve est à UNE ROUTE de s'y
 *     rendre, et c'est ainsi que les quatre campagnes précédentes ont commencé.
 *     Relevé fichier par fichier, avec le compte et les noms.
 * Les deux font échouer le contrôle. Une zone qu'on mesure sans en tirer de code
 * est une zone qu'on ne mesure pas.
 *
 * POURQUOI IL EXISTE ALORS QU'UN CONTRÔLE DE RENDU EXISTE.
 * Une branche morte ne s'affiche nulle part et part quand même chez le lecteur.
 * Le 26/08/2026, le relevé a mesuré ce qui voyageait sans jamais se rendre :
 * les 57 Ko de `/bibliotheque`, qui importaient le corpus EN VALEUR et
 * sérialisaient trente-deux notes — noms, hôtes, dates, compteurs — dans un
 * fichier JavaScript servi comme ressource statique, ATTEIGNABLE MÊME PAR QUI
 * REÇOIT 404 ; les 30 Ko du corps de la note de démonstration dans
 * `CorpsReference.svelte` et `CorpsOperationnel.svelte`, sur le chunk de
 * `/notes/{id}` ; l'arborescence entière du gel dans TOUT chunk montant une
 * coquille. **Aucun test de rendu ne verra jamais rien de tout cela, puisque
 * rien ne s'affiche.**
 *
 * Ce n'est pas un harnais. Il fait UNE chose, et il la raconte : il nomme la
 * zone, le fichier, le nombre d'occurrences, et l'extrait qui les entoure.
 *
 *     pnpm build && node docs/traces/aiguilles-dans-le-paquet.mjs --tel-quel
 *     node docs/traces/aiguilles-dans-le-paquet.mjs        # construit lui-même
 *
 * Code de retour : 0 si le paquet est propre, 1 sinon.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, relative } from 'node:path';
import {
	aiguillesDuCorpus,
	aiguillesTrouvees,
	ECARTES,
	EXEMPTIONS_DU_PAQUET
} from './aiguilles-du-corpus.mjs';

const racine =
	process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) ??
	process.cwd();
const telQuel = process.argv.includes('--tel-quel');

/* LES DEUX MOITIÉS DU PAQUET. `detail` dit comment la zone se raconte : la
   moitié cliente occurrence par occurrence, parce qu'elle est petite et grave ;
   la moitié serveur fichier par fichier, parce qu'elle est vaste et qu'un relevé
   de huit cents lignes ne se lit pas. Le code de sortie ne fait, lui, aucune
   différence entre les deux. */
const ZONES = [
	{
		rep: join(racine, 'build', 'client'),
		nom: 'CE QUI PART CHEZ LE LECTEUR',
		detail: 'occurrence',
		remede:
			'Le remède est le RETRAIT du littéral, ou une propriété REQUISE qui le\n' +
			'   remplace — jamais une condition de rendu : la condition laisse le littéral\n' +
			'   dans le chunk, et le chunk est servi avant toute autorisation.'
	},
	{
		rep: join(racine, 'build', 'server'),
		nom: 'CE QUI TOURNE SUR LE SERVEUR',
		detail: 'fichier',
		remede:
			'Aucun octet n’en part vers un navigateur — mais chaque littéral est à UNE\n' +
			'   ROUTE de s’y rendre. La cause principale est nommée dans `eslint.config.js` :\n' +
			'   `src/lib/donnees/creation.ts:76` et `src/lib/donnees/signets-ecriture.ts:41`\n' +
			'   importent `corpsVide()` de `src/lib/base/semence.ts`, qui importe `CORPUS`\n' +
			'   EN VALEUR. Le remède y est écrit : déplacer `corpsVide()` hors de la semence.'
	}
];

const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 68 - t.length))}`);

/* ── 1. LE PRODUIT, CONSTRUIT ────────────────────────────────────────────────
   Le contrôle mesure l'artefact qu'on livre, jamais un artefact d'hier. Sans
   construction, `--tel-quel` dit qu'on assume de lire ce qui traîne. */
titre('1. LA CONSTRUCTION');
if (telQuel) {
	console.log('     --tel-quel : le paquet déjà présent est mesuré tel quel.');
} else {
	const code = await new Promise((resoudre) => {
		const enfant = spawn('pnpm', ['build'], { cwd: racine, stdio: ['ignore', 'pipe', 'pipe'] });
		let dernieres = [];
		const garder = (t) => {
			dernieres = [...dernieres, ...String(t).split('\n')].slice(-4);
		};
		enfant.stdout.on('data', garder);
		enfant.stderr.on('data', garder);
		enfant.on('close', (c) => {
			for (const l of dernieres) if (l.trim() !== '') console.log(`     ${l.trim()}`);
			resoudre(c);
		});
	});
	if (code !== 0) {
		console.error(`\n!! pnpm build a rendu ${code} — rien à mesurer.`);
		process.exit(1);
	}
}
for (const z of ZONES) {
	try {
		await stat(z.rep);
	} catch {
		console.error(`\n!! ${relative(racine, z.rep)} n’existe pas. Construis le produit d’abord.`);
		process.exit(1);
	}
}

/* ── 2. LES AIGUILLES ────────────────────────────────────────────────────────
   Produites par leur source, jamais recopiées ici : voir
   `aiguilles-du-corpus.mjs`. */
titre('2. LES AIGUILLES');
const aiguilles = await aiguillesDuCorpus();
const parFamille = new Map();
for (const a of aiguilles) {
	const famille = a.origine.split(' ·')[0];
	parFamille.set(famille, (parFamille.get(famille) ?? 0) + 1);
}
console.log(`     ${aiguilles.length} noms cherchés dans build/client/ ET build/server/`);
for (const [famille, n] of parFamille) console.log(`       ${String(n).padStart(3)}  ${famille}`);
console.log(`     ${ECARTES.length} nom écarté — il est AUSSI du vocabulaire du produit :`);
for (const e of ECARTES) console.log(`       « ${e.mot} » — ${e.motif}`);

/* ── 3. LE BALAYAGE ──────────────────────────────────────────────────────────
   Les deux zones, octet par octet. Rien n'est filtré par extension : une fuite
   dans une feuille de style, dans un manifeste ou dans une carte de source
   compte autant qu'une fuite dans un chunk. Les cartes de source sont RELEVÉES
   ET ÉTIQUETÉES comme telles : elles portent les mêmes littéraux que le fichier
   qu'elles décrivent, et les taire ferait tomber la moitié du compte. */
titre('3. LE BALAYAGE');
async function* fichiersDe(rep) {
	for (const e of await readdir(rep, { withFileTypes: true })) {
		const chemin = join(rep, e.name);
		if (e.isDirectory()) yield* fichiersDe(chemin);
		else if (e.isFile()) yield chemin;
	}
}

const exemptees = [];
const exemptionsServies = new Set();

for (const zone of ZONES) {
	zone.servies = [];
	zone.lus = 0;
	zone.octets = 0;
	for await (const chemin of fichiersDe(zone.rep)) {
		let texte;
		try {
			texte = await readFile(chemin, 'utf8');
		} catch {
			continue; /* binaire illisible en UTF-8 : aucune chaîne à y trouver */
		}
		zone.lus += 1;
		zone.octets += texte.length;
		for (const vue of aiguillesTrouvees(texte, aiguilles)) {
			const exemption = EXEMPTIONS_DU_PAQUET.find(
				(x) => x.mot === vue.mot && texte.includes(x.temoin)
			);
			const trouvaille = {
				...vue,
				fichier: relative(racine, chemin),
				carte: chemin.endsWith('.map')
			};
			if (exemption) {
				exemptionsServies.add(exemption);
				exemptees.push({ ...trouvaille, exemption });
			} else {
				zone.servies.push(trouvaille);
			}
		}
	}
	console.log(
		`     ${relative(racine, zone.rep).padEnd(14)} ${String(zone.lus).padStart(4)} fichiers, ` +
			`${(zone.octets / 1024).toFixed(0)} Ko de texte`
	);
}

/* ── 4. CE QUE LES EXEMPTIONS COUVRENT ───────────────────────────────────────
   La table est VIDE, et son commentaire dit pourquoi : le seul cas qu'elle
   prévoit est un lot en quarantaine, et il n'y en a aucun. Le mécanisme reste,
   parce que ce cas peut revenir ; ce qui a disparu, ce sont quatre exemptions
   posées hors de lui, sur les défauts résiduels de lots déjà fusionnés. */
titre('4. LES EXEMPTIONS');
if (EXEMPTIONS_DU_PAQUET.length === 0) {
	console.log('     AUCUNE. Aucun lot n’est en quarantaine ; rien n’est laissé passer.');
}
for (const x of exemptees) {
	console.log(`     « ${x.mot} » ×${x.combien}  dans ${x.fichier}`);
	console.log(`        vue ${x.exemption.vue} · lot ${x.exemption.lot}`);
	console.log(`        ${x.exemption.motif}`);
}
const perimees = EXEMPTIONS_DU_PAQUET.filter((x) => !exemptionsServies.has(x));
for (const x of perimees) {
	console.log(`     PÉRIMÉE — « ${x.mot} » dans ${x.vue} ne se trouve plus dans le paquet.`);
}

/* ── 5. LE RELEVÉ, ZONE PAR ZONE ─────────────────────────────────────────────*/
for (const zone of ZONES) {
	const total = zone.servies.reduce((s, t) => s + t.combien, 0);
	/* LES CARTES DE SOURCE, COMPTÉES À PART. Elles portent les mêmes littéraux que
	   le fichier qu'elles décrivent : les taire ferait tomber la moitié du compte,
	   les confondre ferait croire à deux fois plus de sites. */
	const cartes = zone.servies.filter((t) => t.carte).reduce((s, t) => s + t.combien, 0);
	zone.total = total;
	zone.fichiersTouches = new Set(zone.servies.map((t) => t.fichier)).size;
	zone.suffixe = cartes === 0 ? '' : ` — dont ${cartes} dans des cartes de source`;
	titre(`5. ${relative(racine, zone.rep)} — ${zone.nom}`);
	if (zone.servies.length === 0) {
		console.log('     RIEN. Aucun nom du jeu de démonstration dans cette moitié du paquet.');
		continue;
	}
	if (zone.detail === 'occurrence') {
		for (const t of zone.servies) {
			console.log(`     ${t.fichier}  ×${t.combien}`);
			console.log(`        « ${t.mot} » — ${t.origine}`);
			console.log(`        ${t.extrait}`);
		}
	} else {
		/* PAR FICHIER : le compte, puis les noms. L'extrait n'apporterait rien sur
		   cinquante-trois fichiers, et il noierait ce qui se lit — quel fichier
		   porte le jeu, et lequel en porte le plus. */
		const parFichier = new Map();
		for (const t of zone.servies) {
			const d = parFichier.get(t.fichier) ?? { combien: 0, mots: [], carte: t.carte };
			d.combien += t.combien;
			d.mots.push(t.mot);
			parFichier.set(t.fichier, d);
		}
		const rangs = [...parFichier].sort((a, b) => b[1].combien - a[1].combien);
		for (const [fichier, d] of rangs) {
			console.log(
				`     ×${String(d.combien).padStart(4)}  ${fichier}${d.carte ? '   (carte de source)' : ''}`
			);
			console.log(`            ${d.mots.slice(0, 8).join(' · ')}${d.mots.length > 8 ? ' · …' : ''}`);
		}
	}
	console.log(`     ── ${total} occurrence(s) sur ${zone.fichiersTouches} fichier(s)${zone.suffixe}.`);
}

/* ── 6. LE VERDICT ───────────────────────────────────────────────────────────*/
titre('6. LE VERDICT');
const fuites = ZONES.reduce((s, z) => s + z.servies.length, 0);
if (fuites === 0 && perimees.length === 0) {
	console.log(
		exemptees.length === 0
			? '     RIEN. Aucun nom du jeu de démonstration ne part dans le paquet.'
			: `     RIEN hors des ${exemptees.length} occurrences exemptées ci-dessus, qui sont` +
					' nommées, situées, et qui expireront d’elles-mêmes.'
	);
	const lus = ZONES.reduce((s, z) => s + z.lus, 0);
	console.log(
		`\n══ PAQUET PROPRE — ${aiguilles.length} aiguilles, ${lus} fichiers sur deux zones, ` +
			`${exemptees.length} occurrence(s) exemptée(s) ══\n`
	);
	process.exit(0);
}

for (const zone of ZONES) {
	if (zone.servies.length === 0) continue;
	console.log(`\n!! ${relative(racine, zone.rep)} — ${zone.nom}`);
	console.log(
		`   ${zone.total} occurrence(s) du jeu de démonstration sur ${zone.fichiersTouches} ` +
			`fichier(s)${zone.suffixe}.`
	);
	console.log(`   ${zone.remede}`);
}
if (perimees.length > 0) {
	console.log(`\n!! ${perimees.length} exemption(s) périmée(s) : retire-les de`);
	console.log('   docs/traces/aiguilles-du-corpus.mjs. Une exemption qui ne couvre plus rien');
	console.log('   est une porte laissée ouverte sur un défaut déjà réparé.');
}
console.log('');
process.exit(1);
