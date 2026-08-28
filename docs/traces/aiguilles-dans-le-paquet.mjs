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
 * `node build/index.js` exécute.
 *
 * CE QUE LA ZONE AVEUGLE A LAISSÉ PASSER — au passé, la fuite est retirée.
 * Mesuré le 28/08/2026 avant le lot L1, `build/server/` portait QUATRE CENTS
 * occurrences sur cinquante-trois fichiers, autant dans leurs cartes de source.
 * La principale était le chunk de `creation.js` — 85 314 octets, `CORPUS`
 * sérialisé en entier (titres, auteurs, univers, domaines, adresses), importé
 * par DIX nœuds de routes de `build/server/chunks/nodes/`. Pendant ce temps le
 * contrôle déclarait « PAQUET PROPRE » sur l'autre moitié.
 *
 * CE QUI LA RETENAIT, ET CE QUI L'A RETIRÉE. La cause était nommée dans le
 * dépôt, au bloc d'exemption d'`eslint.config.js` : `src/lib/donnees/creation.ts`
 * et `src/lib/donnees/signets-ecriture.ts` importaient `corpsVide()` de
 * `src/lib/base/semence.ts`, qui importe `CORPUS` EN VALEUR — si bien que
 * `notes/nouvelle/+page.server.ts` et les trois serveurs de signets faisaient
 * descendre le jeu entier dans le paquet serveur. Le lot L1 a déplacé
 * `corpsVide()` de `src/lib/base/semence.ts` vers
 * `src/lib/contenu/corps-vide.ts`, à côté de `markdown.ts`, sans un seul import
 * de `seeds/` : `creation.js` est passé de 85 314 à 65 263 octets, et plus une
 * note du jeu ne subsiste dans `build/server/`. Ce contrôle rend donc 0 sur
 * cette moitié AU MÉRITE, et non plus par cécité.
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
 * ET LE RELEVÉ SÉPARE LE CODE DE NOTRE PROPRE PROSE. `build/server/` n'est pas
 * minifié : tout commentaire de documentation du dépôt s'y retrouve mot pour
 * mot, et l'historique de ce produit cite les noms du jeu par dizaines. Chaque
 * occurrence compte et fait échouer le contrôle — rien n'est exempté —, mais le
 * relevé dit laquelle est un littéral de code et laquelle est une phrase qu'on a
 * écrite soi-même. Les deux ne se réparent pas de la même façon, et les
 * confondre est le plus court chemin vers un garde-fou débranché.
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
   de huit cents lignes ne se lit pas.

   `faute` DIT CE QUI FAIT ÉCHOUER LA ZONE, ET LES DEUX NE RÉPONDENT PAS PAREIL.
   La première rédaction comptait tout, des deux côtés. Mesuré à l'intégration du
   28/08 : `build/client` à ZÉRO, `build/server` à 355 occurrences dont ZÉRO dans
   du code — 178 cartes de source et 177 commentaires, c'est-à-dire LA PROSE DE
   CE DÉPÔT, que le paquet serveur garde parce qu'il n'est pas minifié. L'en-tête
   de `Rail.js` énumère à lui seul les quatorze dossiers du gel pour raconter ce
   qu'il a réparé, et le fichier que vous lisez cite les cinq adresses qu'il
   cherche. Le contrôle ne pouvait donc PLUS JAMAIS rendre 0, quel que soit l'état
   du produit — et un garde-fou qui ne peut pas être vert est un garde-fou qu'on
   débranche au troisième passage. C'est le motif même que cette trace existe pour
   empêcher, d'un cran plus haut : l'instrument devenu inutilisable.

   La distinction n'affaiblit rien, parce qu'elle n'est pas un seuil mais une
   PROPRIÉTÉ :
     · `build/client` — TOUT compte, code, prose et cartes. Ces fichiers sont
       servis comme ressources statiques à qui les demande, avant toute
       autorisation ; un commentaire y est aussi lisible qu'un littéral. La zone
       n'a d'ailleurs aucune carte de source. Le critère ne bouge pas d'un pouce.
     · `build/server` — SEUL LE CODE compte. Un littéral en commentaire ne
       s'évalue pas, ne se sérialise pas, n'entre dans aucune réponse : il n'est
       pas « à une route de se rendre », il n'a aucun chemin vers un lecteur. Le
       relevé continue d'AFFICHER les 355 en entier, fichier par fichier — rien
       n'est tu, rien n'est exempté, et la table d'exemptions reste vide. C'est le
       code de sortie qui vise la seule colonne qui dise ce qui peut se rendre.

   Ce qui reste vrai des deux côtés : aucune exemption ne s'obtient en changeant
   ce critère, et une exemption périmée fait toujours échouer le contrôle. */
const ZONES = [
	{
		rep: join(racine, 'build', 'client'),
		nom: 'CE QUI PART CHEZ LE LECTEUR',
		detail: 'occurrence',
		faute: (z) => z.total > 0,
		remede:
			'Le remède est le RETRAIT du littéral, ou une propriété REQUISE qui le\n' +
			'   remplace — jamais une condition de rendu : la condition laisse le littéral\n' +
			'   dans le chunk, et le chunk est servi avant toute autorisation.'
	},
	{
		rep: join(racine, 'build', 'server'),
		nom: 'CE QUI TOURNE SUR LE SERVEUR',
		detail: 'fichier',
		faute: (z) => z.enCode > 0,
		remede:
			'Aucun octet n’en part vers un navigateur — mais chaque littéral est à UNE\n' +
			'   ROUTE de s’y rendre. LIS LA COLONNE « DANS DU CODE » : elle seule dit ce\n' +
			'   qui peut se rendre. Le reste est la prose du dépôt, que le paquet serveur\n' +
			'   garde parce qu’il n’est pas minifié — elle se retire en réécrivant le\n' +
			'   commentaire, pas le produit.\n' +
			'   Pour un littéral de code, cherche la chaîne d’imports qui atteint `seeds/`\n' +
			'   EN VALEUR : `eslint.config.js` la garde par `IMPORT_DU_JEU` et\n' +
			'   `IMPORT_DE_LA_SEMENCE`. La fuite de 85 Ko du 28/08 tenait à un maillon de\n' +
			'   cette forme, et le remède fut de sortir la fonction empruntée de la\n' +
			'   semence — `corpsVide()` vit désormais dans `src/lib/contenu/corps-vide.ts`.'
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

/* CE QUI EST DU CODE, ET CE QUI EST NOTRE PROPRE PROSE.
   `build/server/` N'EST PAS MINIFIÉ : chaque commentaire de documentation du
   dépôt s'y retrouve mot pour mot, et l'historique de ce produit cite les noms
   du jeu par dizaines — le commentaire de `Rail.js` énumère les quatorze
   dossiers du gel pour raconter ce qu'il a réparé. Un nom cité là ne se rend sur
   aucune route.
   IL COMPTE QUAND MÊME, IL EST RELEVÉ, ET IL FAIT ÉCHOUER LE CONTRÔLE comme le
   reste : ce n'est pas une exemption, et rien ici ne se tait. Ce que la
   distinction change est LE RELEVÉ, jamais le code de sortie — un lecteur doit
   voir en une ligne s'il a devant lui une fuite de données ou la prose qu'on a
   écrite soi-même. Confondre les deux, c'est un garde-fou qu'on débranche au
   troisième passage.
   Le repérage est grossier à dessein — il ne connaît ni les chaînes ni les
   expressions rationnelles — et il l'est DANS LE BON SENS : il ne peut que
   prendre du code pour un commentaire dans des cas tordus, et il ne change
   aucune fatalité. */
function masqueDesCommentaires(texte) {
	const masque = new Uint8Array(texte.length);
	let i = 0;
	while (i < texte.length) {
		const deux = texte[i] + texte[i + 1];
		if (deux === '/*') {
			let fin = texte.indexOf('*/', i + 2);
			if (fin < 0) fin = texte.length;
			for (let k = i; k < Math.min(fin + 2, texte.length); k += 1) masque[k] = 1;
			i = fin + 2;
		} else if (deux === '//') {
			let fin = texte.indexOf('\n', i);
			if (fin < 0) fin = texte.length;
			for (let k = i; k < fin; k += 1) masque[k] = 1;
			i = fin;
		} else {
			i += 1;
		}
	}
	return masque;
}

/* Combien des occurrences de cette aiguille tombent HORS commentaire. La
   recherche refait le parcours d'`aiguillesTrouvees`, à la même casse. */
function occurrencesEnCode(texte, masque, vue) {
	const stricte = vue.casse !== false;
	const ou_chercher = stricte ? texte : texte.toLowerCase();
	const cherche = stricte ? vue.mot : vue.mot.toLowerCase();
	let depuis = 0;
	let combien = 0;
	for (;;) {
		const ou = ou_chercher.indexOf(cherche, depuis);
		if (ou < 0) break;
		if (masque[ou] === 0) combien += 1;
		depuis = ou + cherche.length;
	}
	return combien;
}

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
		/* Une carte de source est le miroir du fichier qu'elle décrit : elle ne
		   s'exécute pas, et elle est déjà comptée à part. */
		const carte = chemin.endsWith('.map');
		const masque = carte ? null : masqueDesCommentaires(texte);
		for (const vue of aiguillesTrouvees(texte, aiguilles)) {
			const exemption = EXEMPTIONS_DU_PAQUET.find(
				(x) => x.mot === vue.mot && texte.includes(x.temoin)
			);
			const trouvaille = {
				...vue,
				fichier: relative(racine, chemin),
				carte,
				enCode: masque === null ? 0 : occurrencesEnCode(texte, masque, vue)
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
	const enCode = zone.servies.reduce((s, t) => s + t.enCode, 0);
	const enProse = total - cartes - enCode;
	zone.total = total;
	zone.enCode = enCode;
	zone.fichiersTouches = new Set(zone.servies.map((t) => t.fichier)).size;
	const parts = [];
	if (cartes > 0) parts.push(`${cartes} dans des cartes de source`);
	if (enProse > 0) parts.push(`${enProse} en commentaire de documentation`);
	parts.push(`${enCode} DANS DU CODE`);
	zone.suffixe = ` — dont ${parts.join(', ')}`;
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
			const d = parFichier.get(t.fichier) ?? { combien: 0, enCode: 0, mots: [], carte: t.carte };
			d.combien += t.combien;
			d.enCode += t.enCode;
			d.mots.push(t.mot);
			parFichier.set(t.fichier, d);
		}
		/* LES FICHIERS QUI PORTENT DU CODE D'ABORD, quel que soit leur compte : c'est
		   ce qu'on vient lire. Un en-tête de documentation qui cite vingt et un noms
		   passe après un chunk qui en porte un seul dans un littéral. */
		const rangs = [...parFichier].sort(
			(a, b) => (b[1].enCode > 0) - (a[1].enCode > 0) || b[1].combien - a[1].combien
		);
		for (const [fichier, d] of rangs) {
			const nature = d.carte
				? '   (carte de source)'
				: d.enCode > 0
					? `   ← ${d.enCode} DANS DU CODE`
					: '   (commentaires de documentation)';
			console.log(`     ×${String(d.combien).padStart(4)}  ${fichier}${nature}`);
			console.log(`            ${d.mots.slice(0, 8).join(' · ')}${d.mots.length > 8 ? ' · …' : ''}`);
		}
	}
	console.log(`     ── ${total} occurrence(s) sur ${zone.fichiersTouches} fichier(s)${zone.suffixe}.`);
}

/* ── 6. LE VERDICT ───────────────────────────────────────────────────────────*/
titre('6. LE VERDICT');
const enFaute = ZONES.filter((z) => z.faute(z));
if (enFaute.length === 0 && perimees.length === 0) {
	/* CE QUI RESTE SE DIT, MÊME QUAND LE CONTRÔLE PASSE. Une zone peut être hors
	   faute sans être muette : la moitié serveur porte la prose du dépôt, et la
	   taire ferait croire à un paquet dont on n'a rien mesuré. */
	const bavardes = ZONES.filter((z) => z.total > 0);
	console.log(
		exemptees.length === 0
			? '     RIEN QUI PUISSE SE RENDRE. Aucun nom du jeu de démonstration ne part chez' +
					' un lecteur,\n     et aucun n’est en position de code dans le paquet serveur.'
			: `     RIEN hors des ${exemptees.length} occurrences exemptées ci-dessus, qui sont` +
					' nommées, situées, et qui expireront d’elles-mêmes.'
	);
	for (const z of bavardes) {
		console.log(
			`     Pour mémoire — ${relative(racine, z.rep)} : ${z.total} occurrence(s) sur ` +
				`${z.fichiersTouches} fichier(s)${z.suffixe}.`
		);
	}
	const lus = ZONES.reduce((s, z) => s + z.lus, 0);
	console.log(
		`\n══ PAQUET PROPRE — ${aiguilles.length} aiguilles, ${lus} fichiers sur deux zones, ` +
			`${exemptees.length} occurrence(s) exemptée(s) ══\n`
	);
	process.exit(0);
}

for (const zone of enFaute) {
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
