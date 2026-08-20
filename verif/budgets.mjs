#!/usr/bin/env node
/**
 * BATTERIE 13 — LES SEPT BUDGETS DE PERFORMANCE, SUR VOLUMÉTRIE HAUTE.
 *
 * `PLAN-DE-REALISATION.md` §5 : « les sept budgets de performance, mesurés sur
 * volumétrie haute synthétique ». Les cibles et les seuils d'échec sont ceux du
 * cahier des charges — `CAHIER-DES-CHARGES-FONCTIONNEL.md:1529-1537` — et de
 * `STACK-TECHNIQUE.md:340-350`. Aucun n'est écrit ici de mémoire : chaque poste
 * porte la ligne d'où son chiffre vient.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE BATTERIE REFUSE DE FAIRE
 *
 *   1. MESURER SUR LE CORPUS GELÉ. 32 notes ne sont pas une volumétrie haute,
 *      et un budget mesuré sur 32 notes présenté comme tenu serait la valeur
 *      illustrative que `P-02` proscrit. La batterie CONTRÔLE les volumes avant
 *      de mesurer et sort en 2 — refus de mesurer — s'ils ne sont pas là.
 *   2. RENDRE UNE MESURE UNIQUE. Trois séries, chacune de plusieurs tirages,
 *      médiane ET 95ᵉ centile, dispersion inter-séries. Un tirage extrême
 *      déplace la moyenne, pas la médiane ; une médiane seule cache la queue.
 *   3. SE DONNER SON SEUIL. Le verdict compare à la cible de la source. Un
 *      budget dépassé sort ROUGE avec son chiffre — c'est un résultat, pas un
 *      échec de l'instrument.
 *   4. CONCLURE SUR CE QU'ELLE N'A PAS TRAVERSÉ. Un poste dont le chemin
 *      n'existe pas dans le produit sort NON MESURABLE, nommé et compté. Sept
 *      budgets annoncés, sept verdicts rendus, dont « non mesurable » est un.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA MESURE COUVRE, ET CE QU'ELLE NE COUVRE PAS
 *
 * Elle mesure le PRODUIT CONSTRUIT (`pnpm build`, `node build/index.js`), servi
 * sur la boucle locale, interrogé en HTTP : le temps entre l'émission de la
 * requête et, selon le poste, l'arrivée des premiers octets ou la fin du corps.
 * C'est le seul instant que le serveur décide entièrement.
 *
 * ELLE NE MESURE PAS LE RENDU DU NAVIGATEUR — ni analyse, ni mise en page, ni
 * peinture. Le produit est rendu au serveur sans hydratation (`ADR-001`), donc
 * le temps serveur en est la part dominante et la seule que le dépôt puisse
 * tenir ; la part client n'est pas nulle pour autant, et un budget tenu ici
 * n'est pas un budget tenu à l'écran. C'est dit à chaque exécution.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SONDE — RA-01 : UN BANC TOUJOURS VERT NE PROUVE RIEN
 *
 * `--sonde=latence` INSÈRE UN RETARD RÉEL dans le chemin mesuré : un relais
 * local retarde chaque réponse. La batterie doit rougir, et le code de retour
 * est inversé. `--sonde=temoin-inerte` ne retarde rien et doit donc RESTER
 * verte : elle s'invoque en la niant, comme celle de la batterie 6.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA BASE DE LA MESURE N'EST PAS CELLE DES AUTRES LOTS
 *
 * Le chargement de la volumétrie ÉCRIT — 5 000 notes, 200 comptes, 30 domaines
 * —, et le poste « enregistrement » écrit à chaque tirage. Sur la base partagée,
 * la batterie 6 rougirait aussitôt : elle exige « 5 comptes, ceux du corpus ».
 * La mesure se fait donc sur une base et un index PROPRES, obtenus sans rien
 * changer au dépôt : un fichier d'environnement à part, portant un `NOM_PROJET`,
 * un `PORT_DB` et un `PORT_RECHERCHE` distincts, passé à `docker compose
 * --env-file … up -d db recherche`. La séquence complète est :
 *
 *   base:migrer · base:semer · volumetrie:charger · réindexation · mesure
 *
 * et le retour à l'état de départ est `volumetrie:retirer`, qui rend la base
 * strictement au corpus gelé — 32 notes, 5 comptes, 19 dossiers (vérifié).
 *
 * Usage :
 *   node verif/budgets.mjs                       la batterie
 *   node verif/budgets.mjs --sonde=latence       la preuve qu'elle sait dire non
 *   node verif/budgets.mjs --sans-construire     diagnostic : réemploie build/
 *   node verif/budgets.mjs --detail              chaque tirage, série par série
 *
 * Codes de retour : 0 tous les budgets tenus et prouvés · 1 un budget dépassé
 * ou non mesurable · 2 refus de mesurer (volumétrie absente, produit muet).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { cpus, totalmem, loadavg } from 'node:os';
import { join } from 'node:path';
import { argv, exit } from 'node:process';
import { racine } from './banc/inventaire.mjs';
import {
	UNIVERS_DU_GRAPHE,
	charger,
	chargerLeGenerateur,
	etat,
	lireExistant,
	ouvrirLeBassin,
	ramenerAuPalier
} from './volumetrie.mjs';

/* ═══════════════════════════════════════════════ Les sept postes ═══════ */

/**
 * LES SEPT BUDGETS, RECOPIÉS DE LA SOURCE.
 *
 * `cible` et `echec` sont en millisecondes. `cible: null` signale le seul poste
 * dont la source ne donne pas de nombre — la palette, dont le cahier dit
 * « Immédiate, perçue instantanée » et dont le seuil d'échec est
 * « perceptible ». Un nombre inventé ici serait un comblement (`CLAUDE.md` §2).
 */
export const POSTES = [
	{
		cle: 'recherche-premiers',
		libelle: 'Premiers résultats de recherche',
		cible: 500,
		echec: 1500,
		source: 'CDC:1531 · STACK:344',
		instant: 'premiers octets'
	},
	{
		cle: 'recherche-facettes',
		libelle: 'Recherche complète avec facettes',
		cible: 1500,
		echec: 3000,
		source: 'CDC:1532 · STACK:345',
		instant: 'réponse complète'
	},
	{
		cle: 'note',
		libelle: 'Ouverture d’une note',
		cible: 1000,
		echec: 2500,
		source: 'CDC:1533 · STACK:346',
		instant: 'réponse complète'
	},
	{
		cle: 'enregistrement',
		libelle: 'Enregistrement d’une note',
		cible: 1000,
		echec: 3000,
		source: 'CDC:1537 · STACK:347',
		instant: 'réponse complète'
	},
	{
		cle: 'indexation',
		libelle: 'Indexation après enregistrement',
		cible: 10_000,
		echec: 30_000,
		source: 'CDC:1534 · RG-M05-06 (CDC:731) · STACK:348',
		instant: 'note retrouvée en recherche'
	},
	{
		cle: 'palette',
		libelle: 'Palette perçue instantanée',
		cible: null,
		echec: null,
		source: 'CDC:1535 · STACK:349',
		instant: 'ouverture perçue'
	},
	{
		cle: 'cartographie',
		libelle: 'Cartographie de 500 nœuds',
		cible: 3000,
		echec: 8000,
		source: 'CDC:1536 · STACK:350 · R-01 (STACK:457)',
		instant: 'réponse complète'
	}
];

/* ═════════════════════════════════════════════ Ce qu'on exige des volumes */

/**
 * LES VOLUMES SANS LESQUELS LA MESURE N'EST PAS CELLE QU'ON ANNONCE.
 *
 * Recopiés de `CAHIER-DES-CHARGES-FONCTIONNEL.md:1539-1544`. Le nombre de notes
 * est le seul lu comme une interprétation : « plusieurs milliers » est ici 5 000,
 * et ce choix est imprimé à chaque exécution plutôt que caché.
 */
export const VOLUMES_EXIGES = {
	notes: 5000,
	comptes: 200,
	univers: 6,
	domaines: 30,
	dossiers: 300,
	profondeurMax: 10,
	relations: 3000,
	noeudsDuGraphe: 500
};

/**
 * La base porte-t-elle la volumétrie haute ? Rend la liste des manquements —
 * vide quand tout y est.
 *
 * FONCTION PURE, ET C'EST VOULU : son cas d'épreuve est SYNTHÉTIQUE
 * (`verif/budgets.test.ts`), donc indépendant de l'état du dépôt. `P-26` — un
 * contrôle dont le seul cas d'épreuve est le défaut qu'il trouve devient inerte
 * en réussissant.
 *
 * @param {Record<string, number>} mesure ce que la base porte
 * @param {Record<string, number>} exiges ce que le cahier annonce
 */
export function manquementsDeVolumetrie(mesure, exiges = VOLUMES_EXIGES) {
	const manques = [];
	for (const [quoi, attendu] of Object.entries(exiges)) {
		const obtenu = mesure[quoi];
		if (typeof obtenu !== 'number' || obtenu < attendu) {
			manques.push(`${quoi} : ${String(obtenu)} en base, ${attendu} exigés`);
		}
	}
	return manques;
}

/* ═══════════════════════════════════════════════ La statistique ════════ */

/** La médiane d'un échantillon. Rend `null` sur un échantillon vide. */
export function mediane(valeurs) {
	if (valeurs.length === 0) return null;
	const triees = [...valeurs].sort((a, b) => a - b);
	const milieu = Math.floor(triees.length / 2);
	if (triees.length % 2 === 1) return triees[milieu];
	return (triees[milieu - 1] + triees[milieu]) / 2;
}

/**
 * Le centile `p` (0 à 100), par la méthode du plus proche rang — celle qui ne
 * fabrique aucune valeur qui n'a pas été observée. Sur 45 tirages, le 95ᵉ
 * centile est le 43ᵉ dans l'ordre croissant.
 */
export function centile(valeurs, p) {
	if (valeurs.length === 0) return null;
	const triees = [...valeurs].sort((a, b) => a - b);
	const rang = Math.max(1, Math.ceil((p / 100) * triees.length));
	return triees[rang - 1];
}

/**
 * La dispersion d'un poste, dite en trois nombres et jamais résumée en un seul.
 * `queue` est l'écart entre le 95ᵉ centile et la médiane — ce qu'un utilisateur
 * malchanceux paie de plus que l'utilisateur médian. `interSeries` est l'écart
 * entre la plus grande et la plus petite des médianes de série : c'est LUI qui
 * dit si la mesure est reproductible, et une batterie qui ne l'imprime pas
 * laisse croire qu'un chiffre unique fait foi.
 */
export function dispersion(series) {
	const tous = series.flat();
	const medianes = series.map((s) => mediane(s)).filter((m) => m !== null);
	const med = mediane(tous);
	const p95 = centile(tous, 95);
	return {
		tirages: tous.length,
		min: tous.length === 0 ? null : Math.min(...tous),
		max: tous.length === 0 ? null : Math.max(...tous),
		mediane: med,
		p95,
		queue: med === null || p95 === null ? null : p95 - med,
		medianesDeSerie: medianes,
		interSeries: medianes.length === 0 ? null : Math.max(...medianes) - Math.min(...medianes)
	};
}

/**
 * LE VERDICT D'UN POSTE. La règle est écrite ici une fois, et elle est la même
 * pour les sept :
 *
 *   NON MESURABLE  le chemin n'existe pas dans le produit, ou la source ne
 *                  donne pas de cible chiffrée. Ce n'est PAS un vert.
 *   ROUGE          la médiane atteint la cible, ou le 95ᵉ centile atteint le
 *                  seuil d'échec du cahier.
 *   VERT RÉSERVÉ   la médiane tient, le 95ᵉ centile dépasse la cible. Le budget
 *                  est tenu pour l'utilisateur médian, pas pour tous.
 *   VERT           médiane et 95ᵉ centile sous la cible.
 *
 * @param {{cible: number|null, echec: number|null}} poste
 * @param {{mediane: number|null, p95: number|null}|null} stats
 * @param {string|null} empechement pourquoi le poste n'a pas pu être mesuré
 */
export function verdictDuPoste(poste, stats, empechement = null) {
	if (empechement !== null) return { etat: 'non mesurable', motif: empechement };
	if (stats === null || stats.mediane === null || stats.p95 === null) {
		return { etat: 'non mesurable', motif: 'aucun tirage' };
	}
	if (poste.cible === null) {
		return {
			etat: 'non mesurable',
			motif: 'la source ne donne aucune cible chiffrée pour ce poste'
		};
	}
	if (stats.mediane >= poste.cible) {
		return { etat: 'rouge', motif: `médiane ${Math.round(stats.mediane)} ms ≥ ${poste.cible} ms` };
	}
	if (poste.echec !== null && stats.p95 >= poste.echec) {
		return { etat: 'rouge', motif: `95ᵉ centile ${Math.round(stats.p95)} ms ≥ seuil d’échec` };
	}
	if (stats.p95 >= poste.cible) {
		return { etat: 'vert réservé', motif: `95ᵉ centile ${Math.round(stats.p95)} ms ≥ cible` };
	}
	return { etat: 'vert', motif: null };
}

/**
 * LE SEUIL DE BASCULE DE `RG-M09-04`, LU SUR LA COURBE.
 *
 * `STACK:284` : « le seuil de bascule vers l'exploration progressive exigé par
 * RG-M09-04 est un PARAMÈTRE, réglé après mesure ». Il ne se décide donc pas
 * ici : il se LIT. La fonction rend la plus grande taille de graphe dont le 95ᵉ
 * centile tient encore sous le budget, et la première qui ne tient plus. Deux
 * nombres, pas un avis.
 *
 * @param {{noeuds: number, p95: number|null}[]} paliers
 * @param {number} budget
 */
export function seuilDeBascule(paliers, budget) {
	const ordonnes = [...paliers].sort((a, b) => a.noeuds - b.noeuds);
	let dernierTenu = null;
	let premierRompu = null;
	for (const palier of ordonnes) {
		if (palier.p95 === null) continue;
		if (palier.p95 < budget) dernierTenu = palier.noeuds;
		else if (premierRompu === null) premierRompu = palier.noeuds;
	}
	return { dernierTenu, premierRompu, mesurePartielle: premierRompu === null };
}

/* ═══════════════════════════════════ Le lanceur — au-delà, la mesure ═══ */

if (import.meta.url !== `file://${process.argv[1]}`) {
	/* Importé par les unitaires : rien ne s'exécute. */
} else {
	await principale();
}

async function principale() {
	const args = argv.slice(2);
	const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length) ?? null;
	const sansConstruire = args.includes('--sans-construire');
	const detail = args.includes('--detail');
	/* EN RÉGIME DE SONDE, MOINS DE TIRAGES : une sonde établit le SIGNE d'un
	   effet, pas sa valeur. Les défauts par défaut restent ceux de la mesure. */
	const SERIES = Number(
		args.find((a) => a.startsWith('--series='))?.slice(9) ?? (sonde === null ? 3 : 2)
	);
	const TIRAGES = Number(
		args.find((a) => a.startsWith('--tirages='))?.slice(10) ?? (sonde === null ? 15 : 3)
	);
	const ECHAUFFEMENT = 5;
	const PORT = Number(process.env.PORT_DEV ?? 5913);
	const PORT_RELAIS = PORT + 40;
	const RETARD_DE_SONDE = 1200;

	if (sonde !== null && sonde !== 'latence' && sonde !== 'temoin-inerte') {
		console.error(`sonde « ${sonde} » inconnue — les genres sont : latence, temoin-inerte`);
		exit(2);
	}

	/* LES TROIS ÉTATS QUE `conclure()` DOIT POUVOIR FERMER SONT DÉCLARÉS ICI, ET
	   PAS PLUS BAS. Déclarés au moment de leur usage, ils étaient dans la zone
	   morte temporelle pour tout refus survenu AVANT — et le refus de mesurer
	   sortait en `ReferenceError` au lieu de son code 2. Le chemin n'avait jamais
	   été emprunté : `P-5`, une branche qu'aucun cas n'exerce. */
	let produit = null;
	let relais = null;
	let base = `http://127.0.0.1:${PORT}`;

	const refus = [];
	const rouges = [];
	/**
	 * LES ROUGES IMPUTABLES À UNE MESURE DE TEMPS — et c'est la leçon de `P-28`
	 * transposée à la sonde.
	 *
	 * La batterie porte des rouges de FOND : deux postes du produit n'ont pas de
	 * chemin (indexation à l'enregistrement, palette). « La batterie a rougi » est
	 * donc vrai quoi qu'une sonde fasse — exactement le piège que la batterie 6 a
	 * nommé : une sonde déclarée mordante par les défauts d'autrui. Le verdict de
	 * la sonde ne regarde donc QUE les postes chronométrés, ceux qu'un retard
	 * ajouté peut faire basculer.
	 */
	const rougesChronometres = [];
	/** @type {Record<string, unknown>} */
	const rapport = {};

	const bassin = await ouvrirLeBassin();
	const { module: generateur, fermer: fermerVite } = await chargerLeGenerateur();

	/* ── 1. LES CONDITIONS, DÉCLARÉES AVANT LE PREMIER TIRAGE ───────────────
	   Le rembobinage vient AVANT le relevé des volumes : les paliers de graphe
	   sont cumulatifs et la base garde le dernier chargé. Voir `ramenerAuPalier`. */
	const existant = await lireExistant(bassin, UNIVERS_DU_GRAPHE);
	const jeu = generateur.engendrer(generateur.VOLUMETRIE_HAUTE, existant);
	const rembobinees = await ramenerAuPalier(bassin, jeu, 0);
	const volumes = await etat(bassin, UNIVERS_DU_GRAPHE);
	const entrees = await entreesDeLIndex();
	const machine = {
		processeur: cpus()[0]?.model ?? 'inconnu',
		coeurs: cpus().length,
		memoireGo: Math.round(totalmem() / 1e9),
		charge1min: loadavg()[0],
		node: process.version
	};

	console.log('BATTERIE 13 — LES SEPT BUDGETS DE PERFORMANCE');
	console.log('');
	console.log('CONDITIONS DE LA MESURE');
	console.log(
		`  machine            ${machine.processeur} · ${machine.coeurs} cœurs · ${machine.memoireGo} Go`
	);
	console.log(`  charge à 1 min     ${machine.charge1min.toFixed(2)} (avant mesure)`);
	console.log(`  node               ${machine.node}`);
	console.log(
		`  base               ${volumes.notes} notes · ${volumes.comptes} comptes · ${volumes.univers} univers · ${volumes.domaines} domaines`
	);
	console.log(
		`                     ${volumes.dossiers} dossiers (profondeur max ${volumes.profondeurMax}) · ${volumes.relations} relations`
	);
	console.log(
		`  dont engendrées    ${volumes.notesEngendrees} notes (seeds/volumetrie.ts, graine ${generateur.GRAINE})`
	);
	console.log(`  index              ${entrees === null ? 'injoignable' : `${entrees} entrées`}`);
	console.log(
		`  graphe de V-19     ${volumes.noeudsDuGraphe} nœuds dans l’univers « ${UNIVERS_DU_GRAPHE} »` +
			`${rembobinees > 0 ? ` (${rembobinees} notes d’un palier supérieur retirées avant mesure)` : ''}`
	);
	console.log(
		`  protocole          ${SERIES} séries × ${TIRAGES} tirages, ${ECHAUFFEMENT} d’échauffement écartés par série`
	);
	console.log(
		'  cache              chaud — les tirages d’échauffement sont écartés, le premier accès'
	);
	console.log(
		'                     à froid est mesuré à part (poste « à froid » de chaque tableau)'
	);
	console.log(
		'  instant mesuré     serveur seul : émission de la requête → premiers octets ou fin du'
	);
	console.log(
		'                     corps. NI analyse, NI mise en page, NI peinture du navigateur.'
	);
	if (sonde !== null)
		console.log(
			`  SONDE              ${sonde}${sonde === 'latence' ? ` (+${RETARD_DE_SONDE} ms par réponse)` : ''}`
		);
	console.log('');

	/* ── 2. LE REFUS DE MESURER — `P-02` À L'ENVERS ─────────────────────── */
	const manques = manquementsDeVolumetrie(volumes);
	if (manques.length > 0) {
		refus.push(
			`la base ne porte pas la volumétrie haute : ${manques.join(' ; ')}. ` +
				'Charger avec « node verif/volumetrie.mjs charger », puis réindexer.'
		);
	}
	if (entrees !== null && entrees !== volumes.notes) {
		refus.push(
			`l’index porte ${entrees} entrées pour ${volumes.notes} notes : la recherche ne serait ` +
				'pas mesurée sur le corpus chargé (réindexer).'
		);
	}
	if (refus.length > 0) return await conclure();

	/* ── 3. LE PRODUIT CONSTRUIT ET SERVI ───────────────────────────────── */
	/* `P-22` — CE QU'UN LOT LAISSE DERRIÈRE LUI. Une exception non rattrapée
	   saute `conclure()`, et le serveur enfant SURVIT au parent : mesuré une fois
	   ici même, un `node build/index.js` orphelin gardait le port et la mesure
	   suivante interrogeait le mauvais serveur (`ECART-017` É-8). Le filet est
	   posé sur la sortie du processus, quelle qu'en soit la cause. */
	process.on('exit', () => produit?.kill('SIGKILL'));
	for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => exit(2));
	process.on('uncaughtException', (erreur) => {
		console.error(`ÉCHEC — exception non rattrapée : ${String(erreur)}`);
		exit(2);
	});
	process.on('unhandledRejection', (erreur) => {
		console.error(`ÉCHEC — rejet non rattrapé : ${String(erreur)}`);
		exit(2);
	});
	if (!sansConstruire) {
		const build = spawnSync('pnpm', ['run', 'build'], { cwd: racine, encoding: 'utf8' });
		if (build.status !== 0) {
			refus.push(`la construction a échoué :\n${String(build.stderr).slice(-800)}`);
			return await conclure();
		}
	}
	if (!existsSync(join(racine, 'build', 'index.js'))) {
		refus.push('aucun build/index.js : rien à mesurer');
		return await conclure();
	}

	const env = {};
	for (const [c, v] of Object.entries(process.env)) if (v !== undefined) env[c] = v;
	env.PORT = String(PORT);
	env.HOST = '127.0.0.1';
	env.ORIGIN = `http://127.0.0.1:${PORT}`;
	produit = spawn(process.execPath, ['build/index.js'], {
		cwd: racine,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let journal = '';
	produit.stdout?.on('data', (d) => (journal += String(d)));
	produit.stderr?.on('data', (d) => (journal += String(d)));

	/* `P-1` — un marqueur ÉCRIT, jamais la disparition d'un processus. Ici, la
	   première réponse HTTP : elle prouve que le serveur écoute ET qu'il sert. */
	let debout = false;
	for (let essai = 0; essai < 200 && !debout; essai++) {
		const vivant = await fetch(`${base}/connexion`, { redirect: 'manual' }).catch(() => null);
		if (vivant !== null) debout = true;
		else if (produit.exitCode !== null) {
			refus.push(
				`node build/index.js s’est arrêté en ${produit.exitCode} :\n${journal.slice(-600)}`
			);
			return await conclure();
		} else await pause(150);
	}
	if (!debout) {
		refus.push(`le produit n’a pas répondu sur le port ${PORT} :\n${journal.slice(-600)}`);
		return await conclure();
	}

	/* LA SONDE DE LATENCE PERTURBE LE CHEMIN RÉELLEMENT MESURÉ : un relais local
	   retarde chaque réponse. Rien n'est ajouté au chronomètre — c'est la
	   réponse qui arrive plus tard, comme si le produit était lent. */
	if (sonde === 'latence') {
		relais = createServer((entrant, sortant) => {
			const morceaux = [];
			entrant.on('data', (d) => morceaux.push(d));
			entrant.on('end', () => {
				setTimeout(async () => {
					/* Le relais ne masque JAMAIS une panne du produit : il la rend en
					   statut, pour que la mesure la voie au lieu de mourir. */
					try {
						const reponse = await fetch(`http://127.0.0.1:${PORT}${entrant.url}`, {
							method: entrant.method,
							headers: Object.fromEntries(
								Object.entries(entrant.headers).filter(([c]) => c !== 'host' && c !== 'connection')
							),
							body: morceaux.length > 0 ? Buffer.concat(morceaux) : undefined,
							redirect: 'manual'
						});
						sortant.writeHead(reponse.status, {
							'content-type': reponse.headers.get('content-type') ?? 'text/html'
						});
						sortant.end(Buffer.from(await reponse.arrayBuffer()));
					} catch (erreur) {
						sortant.writeHead(599, { 'content-type': 'text/plain' });
						sortant.end(`le relais de sonde n’a pas joint le produit : ${String(erreur)}`);
					}
				}, RETARD_DE_SONDE);
			});
		});
		await new Promise((r) => relais.listen(PORT_RELAIS, '127.0.0.1', r));
		base = `http://127.0.0.1:${PORT_RELAIS}`;
	}

	/* ── 4. L'IDENTITÉ DE MESURE — une session posée en base ────────────── */
	const [admin] = (
		await bassin.query("select id, identifiant from comptes where role = 'administrateur' limit 1")
	).rows;
	if (admin === undefined) {
		refus.push('aucun compte administrateur en base : le périmètre de mesure serait indéfini');
		return await conclure();
	}
	const jeton = 'batterie13-administrateur';
	const condensat = createHash('sha256').update(jeton).digest('hex');
	await bassin.query('delete from sessions where condensat_jeton = $1', [condensat]);
	await bassin.query(
		'insert into sessions (compte_id, condensat_jeton, souvenir) values ($1, $2, true)',
		[admin.id, condensat]
	);
	const COOKIE = `codicillus_session=${jeton}`;

	const [uneNote] = (
		await bassin.query(
			"select identifiant from notes where identifiant like 'vol-%' order by identifiant limit 1"
		)
	).rows;
	if (uneNote === undefined) {
		refus.push('aucune note engendrée en base : rien à ouvrir ni à enregistrer');
		return await conclure();
	}

	/* ── 5. LA MESURE ───────────────────────────────────────────────────── */

	/** Une requête, chronométrée. `jusqua` décide de l'instant retenu. */
	async function tirer(chemin, options = {}) {
		const entetes = { accept: 'text/html,application/xhtml+xml' };
		if (options.cookie) entetes.cookie = options.cookie;
		if (options.corps !== undefined) {
			entetes['content-type'] = 'application/x-www-form-urlencoded';
			entetes.origin = `http://127.0.0.1:${PORT}`;
		}
		const depart = performance.now();
		const reponse = await fetch(`${base}${chemin}`, {
			method: options.corps === undefined ? 'GET' : 'POST',
			headers: entetes,
			body: options.corps,
			redirect: 'manual'
		});
		const entete = performance.now() - depart;
		const corps = await reponse.arrayBuffer();
		const complet = performance.now() - depart;
		return { entete, complet, statut: reponse.status, octets: corps.byteLength };
	}

	/**
	 * Trois séries de tirages sur une même sollicitation.
	 * @returns {{series: number[][], froid: number, statuts: Set<number>, octets: number}}
	 */
	async function serier(sollicitation, jusqua) {
		const series = [];
		let froid = null;
		let octets = 0;
		const statuts = new Set();
		for (let s = 0; s < SERIES; s++) {
			const serie = [];
			for (let t = 0; t < ECHAUFFEMENT + TIRAGES; t++) {
				const r = await sollicitation();
				statuts.add(r.statut);
				octets = r.octets;
				if (froid === null) froid = jusqua === 'entete' ? r.entete : r.complet;
				if (t >= ECHAUFFEMENT) serie.push(jusqua === 'entete' ? r.entete : r.complet);
			}
			series.push(serie);
		}
		return { series, froid, statuts, octets };
	}

	/**
	 * LA MÊME PAGE, MESURÉE AU NAVIGATEUR — et c'est le poste 7 qui l'exige.
	 *
	 * Le cahier n'écrit pas « réponse du serveur » : il écrit « AFFICHAGE INITIAL
	 * d'une cartographie de 500 nœuds » (`CDC:1536`). Pour six postes sur sept, le
	 * temps serveur est la part qui décide ; pour un document SVG de plusieurs
	 * mégaoctets, l'analyse et la mise en page du navigateur ne sont pas
	 * négligeables — et `R-01` porte précisément sur le RENDU. Mesurer le seul
	 * serveur ici aurait conclu vert sur un chemin que l'utilisateur n'emprunte
	 * pas seul : c'est l'interdiction de `CLAUDE.md` §4.
	 *
	 * L'instant retenu est l'évènement `load` de la page, chargée par un Chromium
	 * de Playwright — celui du banc, donc la même version que le reste du dépôt.
	 */
	async function serierAuNavigateur(chemin, series, tirages) {
		const { chromium } = await import('@playwright/test');
		const navigateur = await chromium.launch();
		try {
			const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
			await contexte.addCookies([
				{ name: 'codicillus_session', value: jeton, domain: '127.0.0.1', path: '/' }
			]);
			const page = await contexte.newPage();
			const releve = [];
			let froid = null;
			for (let s = 0; s < series; s++) {
				const serie = [];
				for (let t = 0; t < tirages + 1; t++) {
					const depart = performance.now();
					await page.goto(`${base}${chemin}`, { waitUntil: 'load', timeout: 120_000 });
					const ms = performance.now() - depart;
					if (froid === null) froid = ms;
					if (t > 0) serie.push(ms);
				}
				releve.push(serie);
			}
			return { series: releve, froid, statuts: new Set([200]), octets: 0 };
		} finally {
			await navigateur.close();
		}
	}

	/** Imprime un poste et rend son verdict. */
	function rendre(poste, releve, empechement = null, notes = [], statsDuVerdict = null) {
		const stats = releve === null ? null : dispersion(releve.series);
		const verdict = verdictDuPoste(poste, statsDuVerdict ?? stats, empechement);
		const cible = poste.cible === null ? 'aucune cible chiffrée' : `< ${poste.cible} ms`;
		const echec = poste.echec === null ? '—' : `> ${poste.echec} ms`;
		console.log(`${poste.libelle}`);
		console.log(`  budget             ${cible} · seuil d’échec ${echec}   [${poste.source}]`);
		console.log(`  instant mesuré     ${poste.instant}`);
		if (stats !== null) {
			console.log(
				`  médiane            ${fmt(stats.mediane)} ms   ·   95ᵉ centile ${fmt(stats.p95)} ms   ` +
					`·   min ${fmt(stats.min)}   max ${fmt(stats.max)}`
			);
			console.log(
				`  dispersion         queue (p95−médiane) ${fmt(stats.queue)} ms · ` +
					`médianes de série ${stats.medianesDeSerie.map(fmt).join(' / ')} ms · ` +
					`écart inter-séries ${fmt(stats.interSeries)} ms`
			);
			console.log(
				`  tirages            ${stats.tirages} retenus (${SERIES}×${TIRAGES}), à froid ${fmt(releve.froid)} ms, réponse ${Math.round(releve.octets / 1024)} Kio, statuts ${[...releve.statuts].join('/')}`
			);
			if (detail)
				for (const [i, s] of releve.series.entries())
					console.log(`    série ${i + 1} : ${s.map(fmt).join(' ')}`);
		}
		for (const n of notes) console.log(`  ${n}`);
		console.log(
			`  VERDICT            ${verdict.etat.toUpperCase()}${verdict.motif === null ? '' : ` — ${verdict.motif}`}`
		);
		console.log('');
		rapport[poste.cle] = { stats, verdict };
		if (verdict.etat === 'rouge' && poste.cible !== null) rougesChronometres.push(poste.libelle);
		if (verdict.etat === 'rouge' || verdict.etat === 'non mesurable') {
			rouges.push(
				`${poste.libelle} : ${verdict.etat}${verdict.motif ? ` — ${verdict.motif}` : ''}`
			);
		}
		return verdict;
	}

	const fmt = (v) => (v === null || v === undefined ? '—' : String(Math.round(v)));

	console.log('LES SEPT POSTES');
	console.log('');

	/* ── Poste 1 — premiers résultats de recherche ─────────────────────── */
	const MOT = 'bascule';
	const anonyme = await serier(() => tirer(`/recherche?q=${MOT}`), 'entete');
	const enSession = await serier(() => tirer(`/recherche?q=${MOT}`, { cookie: COOKIE }), 'entete');
	/* LE VERDICT PORTE SUR LE PIRE DES DEUX RÉGIMES : c'est celui qu'un
	   utilisateur peut rencontrer. Les deux chiffres sont imprimés. */
	const pireRecherche =
		(mediane(enSession.series.flat()) ?? 0) >= (mediane(anonyme.series.flat()) ?? 0)
			? enSession
			: anonyme;
	rendre(POSTES[0], pireRecherche, null, [
		`régime anonyme     médiane ${fmt(mediane(anonyme.series.flat()))} ms (« ?q= » honoré, périmètre public)`,
		`régime en session  médiane ${fmt(mediane(enSession.series.flat()))} ms (« ?q= » IGNORÉ — V-08 n’a pas d’axe de requête,`,
		'                   public.ts:252 rend une liste d’honorés VIDE en session — la requête au moteur est alors VIDE,',
		'                   donc tout le périmètre. C’est le régime le plus lourd, et c’est celui du produit.)',
		'verdict rendu sur  le pire des deux régimes'
	]);

	/* ── Poste 2 — recherche complète avec facettes ──────────────────────
	   DEUX FACETTES, ET DEUX SEULEMENT, ONT UN CHEMIN JUSQU'AU MOTEUR.
	   `src/lib/donnees/public.ts:226` pose la liste close des paramètres honorés
	   en anonyme — `q`, `domaine`, `type` — et `:252` rend une liste VIDE en
	   session : V-08 n'a d'axe pour aucun paramètre, `q` compris. Mesurer les
	   facettes en session aurait mesuré une adresse dont aucun caractère
	   n'atteint la requête — un vert sur un chemin non emprunté, ce que
	   `CLAUDE.md` §4 interdit de conclure. La première rédaction de ce poste
	   faisait exactement cela, avec `univers`, `statut` et `visibilite`, qui ne
	   sont honorés NULLE PART. */
	const FACETTES = `?q=${MOT}&domaine=Infrastructure&type=Proc%C3%A9dure`;
	/* LA FACETTE MORD-ELLE ? Un filtre inerte rendrait le même corps, et le poste
	   mesurerait une recherche SANS facette sous le nom d'une recherche avec
	   facettes (`P-5`). Le témoin est pris avant la mesure, et son absence de
	   morsure EMPÊCHE de conclure. */
	const sansFacette = await tirer(`/recherche?q=${MOT}`);
	const avecFacette = await tirer(`/recherche${FACETTES}`);
	const mordent = sansFacette.octets !== avecFacette.octets;
	const facettes = await serier(() => tirer(`/recherche${FACETTES}`), 'complet');
	const facettesEnSession = await serier(
		() => tirer(`/recherche${FACETTES}`, { cookie: COOKIE }),
		'complet'
	);
	const pireFacettes =
		(mediane(facettesEnSession.series.flat()) ?? 0) >= (mediane(facettes.series.flat()) ?? 0)
			? facettesEnSession
			: facettes;
	rendre(
		POSTES[1],
		pireFacettes,
		mordent
			? null
			: `les facettes n’ont rien filtré : ${sansFacette.octets} octets sans elles, ` +
					`${avecFacette.octets} avec. Le poste refuse de conclure sur un filtre inerte.`,
		[
			'facettes honorées  domaine et type, et elles seules (public.ts:226). Témoin de morsure :',
			`                   ${Math.round(sansFacette.octets / 1024)} Kio sans facette contre ` +
				`${Math.round(avecFacette.octets / 1024)} Kio avec — elles ${mordent ? 'MORDENT' : 'sont INERTES'}.`,
			`régime anonyme     médiane ${fmt(mediane(facettes.series.flat()))} ms (les deux facettes atteignent le filtre d’index)`,
			`régime en session  médiane ${fmt(mediane(facettesEnSession.series.flat()))} ms (AUCUN paramètre honoré — public.ts:252 —,`,
			'                   donc tout le périmètre : c’est le régime le plus lourd)',
			'verdict rendu sur  le pire des deux régimes',
			'RÉSERVE            l’écran n’AFFICHE aucune colonne de facettes : ni V-02 ni V-08 n’ont',
			'                   d’axe qui la reçoive (public.ts:145). La mesure couvre le calcul, pas',
			'                   un rendu qui n’existe pas.',
			'RÉSERVE            univers, statut, visibilité et étiquette ne sont honorés NULLE PART :',
			'                   le poste ne mesure donc que deux des six facettes que',
			'                   docs/routes.md:248 énumère.'
		]
	);

	/* ── Poste 3 — ouverture d'une note ────────────────────────────────── */
	const note = await serier(
		() => tirer(`/notes/${uneNote.identifiant}`, { cookie: COOKIE }),
		'complet'
	);
	rendre(POSTES[2], note, null, [`note mesurée       ${uneNote.identifiant}`]);

	/* ── Poste 4 — enregistrement ──────────────────────────────────────── */
	let rang = 0;
	const corpsDe = (marque) =>
		'corps=' +
		encodeURIComponent(
			JSON.stringify(
				generateur.corpsDeNote(`Enregistrement de mesure ${marque} — batterie 13, lot T-055.`)
			)
		);
	const enregistrement = await serier(
		() =>
			tirer(`/notes/${uneNote.identifiant}/modifier`, {
				cookie: COOKIE,
				corps: corpsDe(`t${rang++}`)
			}),
		'complet'
	);
	rendre(POSTES[3], enregistrement, null, [
		'écriture réelle    corps Référence remplacé, version capturée (RG-M07-01) — chaque tirage écrit'
	]);

	/* ── Poste 5 — indexation après enregistrement ─────────────────────── */
	const marque = `reperet055${Date.now().toString(36)}`;
	const avant = performance.now();
	const ecrit = await tirer(`/notes/${uneNote.identifiant}/modifier`, {
		cookie: COOKIE,
		corps: corpsDe(marque)
	});
	let trouveeEn = null;
	while (performance.now() - avant < POSTES[4].echec) {
		if ((await entreesTrouvees(marque)) > 0) {
			trouveeEn = performance.now() - avant;
			break;
		}
		await pause(250);
	}
	const attendu = performance.now() - avant;
	rendre(
		POSTES[4],
		trouveeEn === null
			? null
			: { series: [[trouveeEn]], froid: trouveeEn, statuts: new Set([ecrit.statut]), octets: 0 },
		trouveeEn === null
			? `la note enregistrée n’est PAS retrouvable après ${Math.round(attendu)} ms d’attente ` +
					'(seuil d’échec du cahier). Aucun chemin du produit n’indexe à l’enregistrement : ' +
					'src/lib/donnees/edition.ts n’appelle jamais indexerDesNotes(), et la seule écriture ' +
					'd’index du dépôt est la commande de réindexation complète.'
			: null,
		[
			`marque cherchée    « ${marque} », portée par l’extrait dérivé du corps (moteur.ts:200)`,
			`réindexation complète du corpus (le seul chemin qui existe) : ${fmt(await mesurerLaReindexation())} ms pour ${volumes.notes} notes`
		]
	);

	/* ── Poste 6 — palette ─────────────────────────────────────────────── */
	rendre(
		POSTES[5],
		null,
		'la palette V-09 n’est atteignable par aucun chemin du produit. `docs/routes.md:206` : ' +
			'« Superposition, invoquée au clavier depuis n’importe quelle route. AUCUNE ADRESSE » ; ' +
			'`src/lib/coquille/Coquille.svelte:137` réserve son montage sur le champ de la barre au ' +
			'lot T-106 / P-8. Rien à solliciter, donc rien à chronométrer — et la source ne donne de ' +
			'toute façon aucune cible chiffrée (CDC:1535 : « Immédiate, perçue instantanée »).',
		[]
	);

	/* ── Poste 7 — cartographie, et la courbe de R-01 ──────────────────── */
	const paliers = [];
	/* EN RÉGIME DE SONDE, LA COURBE N'EST PAS PARCOURUE : une sonde prouve que
	   l'instrument sait dire non, elle n'a pas de seuil à situer. Le palier du
	   budget suffit, et il économise huit minutes de mesure. */
	const paliersAMesurer = sonde === null ? generateur.VOLUMETRIE_HAUTE.paliersDeGraphe.length : 1;
	for (const [indice] of generateur.VOLUMETRIE_HAUTE.paliersDeGraphe
		.slice(0, paliersAMesurer)
		.entries()) {
		/* Le palier 0 est déjà en base — c'est celui du budget, 500 nœuds. Les
		   suivants sont posés à la volée : `R-01` demande une COURBE. */
		if (indice > 0) await charger(bassin, jeu, generateur.corpsDeNote, indice);
		const noeuds = (await etat(bassin, UNIVERS_DU_GRAPHE)).noeudsDuGraphe;
		const releve = await serier(() => tirer('/cartographie', { cookie: COOKIE }), 'complet');
		const auNavigateur = await serierAuNavigateur('/cartographie', 3, 3);
		paliers.push({
			noeuds,
			releve,
			stats: dispersion(releve.series),
			navigateur: dispersion(auNavigateur.series)
		});
	}

	const auBudget = paliers[0];
	const courbe = ['LA COURBE — R-01 (STACK:457), « un jeu synthétique aux volumes hauts » :'];
	for (const p of paliers) {
		courbe.push(
			`  ${String(p.noeuds).padStart(5)} nœuds  serveur méd. ${fmt(p.stats.mediane).padStart(5)} / 95ᵉ ${fmt(p.stats.p95).padStart(5)} ms  ` +
				`·  navigateur méd. ${fmt(p.navigateur.mediane).padStart(6)} / 95ᵉ ${fmt(p.navigateur.p95).padStart(6)} ms  ` +
				`·  inter-séries ${fmt(p.navigateur.interSeries).padStart(5)} ms  ·  ${String(Math.round(p.releve.octets / 1024)).padStart(6)} Kio`
		);
	}
	const seuilServeur = seuilDeBascule(
		paliers.map((p) => ({ noeuds: p.noeuds, p95: p.stats.p95 })),
		POSTES[6].cible
	);
	const seuil = seuilDeBascule(
		paliers.map((p) => ({ noeuds: p.noeuds, p95: p.navigateur.p95 })),
		POSTES[6].cible
	);
	courbe.push('SEUIL DE BASCULE DE RG-M09-04 — lu sur la courbe, jamais décidé a priori.');
	courbe.push(
		'  Il se lit sur l’AFFICHAGE (navigateur), parce que c’est le mot du cahier ; le chiffre'
	);
	courbe.push('  serveur est donné à côté, et il ne dit pas la même chose.');
	courbe.push(
		`  affichage — dernier palier tenu sous ${POSTES[6].cible} ms au 95ᵉ : ` +
			`${seuil.dernierTenu ?? 'aucun'} nœuds · premier rompu : ` +
			`${seuil.premierRompu ?? `aucun jusqu’à ${paliers.at(-1)?.noeuds}`}`
	);
	courbe.push(
		`  serveur   — dernier palier tenu : ${seuilServeur.dernierTenu ?? 'aucun'} nœuds · ` +
			`premier rompu : ${seuilServeur.premierRompu ?? `aucun jusqu’à ${paliers.at(-1)?.noeuds}`}`
	);
	courbe.push(
		'RÉSERVE — la disposition du graphe n’est PAS calculée par le produit (ARB-011 : V-19 rend'
	);
	courbe.push(
		'  les positions du gel ; un nœud engendré retombe sur l’origine). Le budget de STACK:350 est'
	);
	courbe.push(
		'  tenu, dit la source, par « une disposition dans un fil dédié + un rendu SVG statique » :'
	);
	courbe.push('  seule la seconde moitié existe, et seule elle est mesurée ici.');
	rapport.seuilDeBascule = { affichage: seuil, serveur: seuilServeur };
	rapport.cartographie = paliers.map((p) => ({ noeuds: p.noeuds, ...p.stats }));

	/* Le verdict du poste porte sur le palier du BUDGET — 500 nœuds, le nombre
	   que le cahier écrit. Les paliers supérieurs informent le seuil, ils ne
	   déplacent pas le budget. */
	/* LE VERDICT PORTE SUR L'AFFICHAGE, PAS SUR LA RÉPONSE : « affichage initial »
	   est le mot du cahier. Les deux chiffres sont imprimés, le pire décide. */
	const pireCarto =
		(auBudget.navigateur.mediane ?? 0) >= (auBudget.stats.mediane ?? 0)
			? { series: [], mediane: auBudget.navigateur.mediane, p95: auBudget.navigateur.p95 }
			: { series: [], mediane: auBudget.stats.mediane, p95: auBudget.stats.p95 };
	rendre(
		POSTES[6],
		auBudget.releve,
		null,
		[
			`palier du budget   ${auBudget.noeuds} nœuds dans l’univers « ${UNIVERS_DU_GRAPHE} »`,
			`au navigateur      médiane ${fmt(auBudget.navigateur.mediane)} ms · 95ᵉ ${fmt(auBudget.navigateur.p95)} ms ` +
				`· inter-séries ${fmt(auBudget.navigateur.interSeries)} ms (Chromium de Playwright, évènement « load », 3×3 tirages)`,
			...courbe
		],
		pireCarto
	);

	return await conclure();

	/* ═════════════════════════════════════════════ Les utilitaires ════ */

	/* `T-075` É-3 : le port du moteur était ÉCRIT EN DUR, et `PORT_RECHERCHE`
	   ignoré. Sous copies parallèles, la batterie mesurait donc le moteur du
	   VOISIN — mesuré : « l'index porte 32 entrées pour 5000 notes », refus de
	   mesurer, sur une copie dont le moteur était ailleurs. C'est `P-30` dans
	   l'instrument lui-même, et un instrument qui mesure le voisin est pire
	   qu'un instrument absent : il rend un chiffre. */
	function adresseDuMoteur() {
		if (process.env.URL_RECHERCHE !== undefined) return process.env.URL_RECHERCHE;
		const port = process.env.PORT_RECHERCHE ?? '19700';
		return `http://127.0.0.1:${port}`;
	}

	async function entreesDeLIndex() {
		const adresse = adresseDuMoteur();
		const cle = process.env.CLE_RECHERCHE ?? process.env.CLE_MAITRE_RECHERCHE;
		const r = await fetch(`${adresse}/indexes/notes/stats`, {
			headers: { authorization: `Bearer ${cle}` }
		}).catch(() => null);
		if (r === null || !r.ok) return null;
		const corps = await r.json();
		return typeof corps.numberOfDocuments === 'number' ? corps.numberOfDocuments : null;
	}

	async function entreesTrouvees(requete) {
		const adresse = adresseDuMoteur();
		const cle = process.env.CLE_RECHERCHE ?? process.env.CLE_MAITRE_RECHERCHE;
		const r = await fetch(`${adresse}/indexes/notes/search`, {
			method: 'POST',
			headers: { authorization: `Bearer ${cle}`, 'content-type': 'application/json' },
			body: JSON.stringify({ q: requete, limit: 1 })
		}).catch(() => null);
		if (r === null || !r.ok) return 0;
		const corps = await r.json();
		return corps.hits?.length ?? 0;
	}

	async function mesurerLaReindexation() {
		const depart = performance.now();
		const fait = spawnSync(process.execPath, ['recherche/recherche.mjs', 'reindexer'], {
			cwd: racine,
			encoding: 'utf8'
		});
		if (fait.status !== 0) return null;
		return performance.now() - depart;
	}

	async function conclure() {
		await fermerVite();
		await bassin.end();
		if (relais !== null) await new Promise((r) => relais.close(r));
		if (produit !== null) produit.kill('SIGTERM');

		console.log('CONCLUSION');
		for (const r of refus) console.log(`  REFUS DE MESURER — ${r}`);
		for (const r of rouges) console.log(`  ROUGE — ${r}`);
		if (refus.length === 0 && rouges.length === 0) {
			console.log('  les sept budgets sont tenus, sur les volumes déclarés en tête.');
		}
		console.log('');

		if (sonde !== null) {
			/* LE CODE EST INVERSÉ POUR LA SONDE : elle prouve que la batterie sait
			   dire non. Une sonde de latence qui laisse tout vert est un instrument
			   qui ne mesure rien. Le compte retenu est celui des postes CHRONOMÉTRÉS
			   — voir `rougesChronometres`. */
			const aRougi = rougesChronometres.length > 0;
			console.log(
				`SONDE « ${sonde} » — les postes chronométrés ` +
					`${aRougi ? `ONT ROUGI : ${rougesChronometres.join(', ')}` : 'sont restés verts'} ` +
					`(${rouges.length} rouges au total, dont ${rouges.length - rougesChronometres.length} de fond)`
			);
			exit(aRougi ? 0 : 1);
		}
		if (refus.length > 0) exit(2);
		exit(rouges.length > 0 ? 1 : 0);
	}
}

function pause(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
