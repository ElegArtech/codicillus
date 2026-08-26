/**
 * LE CONTRÔLE DU PAQUET — ce qui SE LIVRE, et qui ne s'affiche jamais.
 *
 * Il construit le produit, puis lit chaque octet de `build/client/` en cherchant
 * les noms du jeu de démonstration. Il ne rend aucun verdict sur ce qu'un écran
 * montre : c'est l'objet de `passage-a-froid.mjs`, et les deux ne se remplacent
 * pas.
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
 * Ce n'est pas un harnais. Il fait UNE chose, et il la raconte : il nomme le
 * fichier, le nombre d'occurrences, et l'extrait qui les entoure.
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
const PAQUET = join(racine, 'build', 'client');

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
try {
	await stat(PAQUET);
} catch {
	console.error(`\n!! ${relative(racine, PAQUET)} n’existe pas. Construis le produit d’abord.`);
	process.exit(1);
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
console.log(`     ${aiguilles.length} noms cherchés dans ${relative(racine, PAQUET)}`);
for (const [famille, n] of parFamille) console.log(`       ${String(n).padStart(3)}  ${famille}`);
console.log(`     ${ECARTES.length} noms écartés — ils sont AUSSI du vocabulaire du produit :`);
for (const e of ECARTES) console.log(`       « ${e.mot} » — ${e.motif}`);

/* ── 3. LE BALAYAGE ──────────────────────────────────────────────────────────
   Tout `build/client/`, octet par octet. Rien n'est filtré par extension : une
   fuite dans une feuille de style ou dans un manifeste compte autant qu'une
   fuite dans un chunk. */
titre('3. LE BALAYAGE');
async function* fichiersDe(rep) {
	for (const e of await readdir(rep, { withFileTypes: true })) {
		const chemin = join(rep, e.name);
		if (e.isDirectory()) yield* fichiersDe(chemin);
		else if (e.isFile()) yield chemin;
	}
}

const servies = [];
const exemptees = [];
const exemptionsServies = new Set();
let lus = 0;
let octets = 0;

for await (const chemin of fichiersDe(PAQUET)) {
	let texte;
	try {
		texte = await readFile(chemin, 'utf8');
	} catch {
		continue; /* binaire illisible en UTF-8 : aucune chaîne à y trouver */
	}
	lus += 1;
	octets += texte.length;
	for (const vue of aiguillesTrouvees(texte, aiguilles)) {
		const exemption = EXEMPTIONS_DU_PAQUET.find(
			(x) => x.mot === vue.mot && texte.includes(x.temoin)
		);
		const trouvaille = { ...vue, fichier: relative(racine, chemin) };
		if (exemption) {
			exemptionsServies.add(exemption);
			exemptees.push({ ...trouvaille, exemption });
		} else {
			servies.push(trouvaille);
		}
	}
}
console.log(`     ${lus} fichiers lus, ${(octets / 1024).toFixed(0)} Ko de texte`);

/* ── 4. CE QUE LES EXEMPTIONS COUVRENT ───────────────────────────────────────
   Elles ne valent QUE pour le paquet, elles nomment un SITE, et elles expirent
   seules : une exemption qui ne trouve plus rien fait échouer le contrôle. */
titre('4. LES EXEMPTIONS');
if (EXEMPTIONS_DU_PAQUET.length === 0) console.log('     aucune.');
for (const x of exemptees) {
	console.log(`     « ${x.mot} » ×${x.combien}  dans ${x.fichier}`);
	console.log(`        vue ${x.exemption.vue} · lot ${x.exemption.lot}`);
	console.log(`        ${x.exemption.motif}`);
}
const perimees = EXEMPTIONS_DU_PAQUET.filter((x) => !exemptionsServies.has(x));
for (const x of perimees) {
	console.log(`     PÉRIMÉE — « ${x.mot} » dans ${x.vue} ne se trouve plus dans le paquet.`);
}

/* ── 5. LE RELEVÉ ────────────────────────────────────────────────────────────*/
titre('5. LE RELEVÉ');
for (const t of servies) {
	console.log(`     ${t.fichier}  ×${t.combien}`);
	console.log(`        « ${t.mot} » — ${t.origine}`);
	console.log(`        ${t.extrait}`);
}

if (servies.length === 0 && perimees.length === 0) {
	console.log(
		exemptees.length === 0
			? '     RIEN. Aucun nom du jeu de démonstration ne part dans le paquet.'
			: `     RIEN hors des ${exemptees.length} occurrences exemptées ci-dessus, qui sont` +
					' nommées, situées, et qui expireront d’elles-mêmes.'
	);
	console.log(
		`\n══ PAQUET PROPRE — ${aiguilles.length} aiguilles, ${lus} fichiers, ` +
			`${exemptees.length} occurrence(s) exemptée(s) ══\n`
	);
	process.exit(0);
}

console.log('');
if (servies.length > 0) {
	console.log(`!! ${servies.length} fuite(s) : le jeu de démonstration part dans le paquet servi.`);
	console.log('   Une branche morte est livrée quand même. Le remède est le RETRAIT du littéral,');
	console.log('   ou une propriété REQUISE qui le remplace — jamais une condition de rendu.');
}
if (perimees.length > 0) {
	console.log(`!! ${perimees.length} exemption(s) périmée(s) : retire-les de`);
	console.log('   docs/traces/aiguilles-du-corpus.mjs. Une exemption qui ne couvre plus rien');
	console.log('   est une porte laissée ouverte sur un défaut déjà réparé.');
}
process.exit(1);
