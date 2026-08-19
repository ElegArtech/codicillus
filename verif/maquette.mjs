#!/usr/bin/env node
/**
 * `pnpm verif:maquette` — batterie 11 du catalogue (PLAN-DE-REALISATION.md §5).
 * La conformité de rendu à la maquette gelée, par le protocole en trois
 * niveaux du §4.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI
 * `verif/banc/conditions.mjs`, NI `verif/references/tolerances.json`, NI
 * `verif/masques.json`. Élargir une tolérance ou masquer une zone pour obtenir
 * du vert est le contournement de vérification nommé par PLAN §12. La seule
 * sortie légitime d'un rouge est le protocole d'écart.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DEUX RÉGIMES
 *
 *   --contre=maquette  (défaut au lot T-007) — ÉTALONNAGE À BLANC.
 *       La maquette gelée est comparée à elle-même, état par état, fenêtre par
 *       fenêtre, capturée deux fois dans deux contextes de navigateur
 *       indépendants. L'exigence y est ZÉRO écart, sans seuil : c'est la seule
 *       preuve que le harnais est déterministe et que ses conditions de
 *       capture tiennent. Tout écart non nul en à blanc est un DÉFAUT DE BANC,
 *       jamais un défaut de maquette.
 *
 *   --contre=app [--base=http://…] [--source=app|etalon|composant] — CONFORMITÉ.
 *       Le côté candidat devient l'APPLICATION, servie à sa propre adresse, et
 *       son état est atteint par le mode démo de l'annexe F —
 *       `/__design/V-xx?etat=…`, `verif/banc/mode-demo.mjs`. La référence
 *       reste la maquette gelée, pilotée par sa planche de revue. Deux
 *       serveurs, deux adresses, deux protocoles d'état ; les CONDITIONS de
 *       capture, elles, restent rigoureusement identiques des deux côtés,
 *       parce qu'elles sont appliquées par le même code
 *       (`verif/banc/conditions.mjs`, `verif/banc/capture.mjs`).
 *
 *       Sans `--base`, le banc démarre lui-même le serveur de développement de
 *       l'application, par l'API Node de Vite : c'est le seul contexte où le
 *       mode démo existe.
 *
 *       `--source=etalon` — ÉTALONNAGE DU RÉGIME `app`. Le mode démo sert la
 *       maquette gelée elle-même. Le candidat est alors CONNU IDENTIQUE à la
 *       référence, et l'exigence est zéro pixel divergent, sans seuil. Ce
 *       n'est pas une conformité : c'est la preuve que la plomberie du régime
 *       ne fabrique pas d'écart à elle seule. Sans elle, le premier rouge
 *       d'une vraie vue serait indiscernable d'un défaut de harnais — le banc
 *       mesurerait le harnais et non l'implémentation.
 *
 *       `--source=composant` — LE MÊME ÉTALONNAGE, MAIS PAR `render()`.
 *       `ECART-013` É-1 a montré la limite de `etalon` : il sert le gel sans
 *       jamais passer par `render()`, si bien que le chemin étalonné n'était
 *       pas le chemin exercé et que tout composant rendait 500 sans que
 *       l'étalonnage ne le voie. Un étalonnage sur candidat connu identique ne
 *       vaut QUE POUR LES PORTIONS DE CHEMIN QU'IL EMPRUNTE. Cette source fait
 *       traverser au corps du gel les fonctions mêmes qu'un lot de vue
 *       empruntera — `ssrLoadModule`, `render()`, le contrat de propriétés,
 *       `corpusPourVue()` — sans cesser d'être connue identique.
 *
 * Usage :
 *   pnpm verif:maquette [V-xx …] [--etats=cle,cle] [--fenetres=1440x900,…]
 *                       [--contre=maquette|app] [--base=URL]
 *                       [--source=app|etalon|composant]
 *                       [--zones=declarees|page]
 *                       [--archiver=ecarts|complet] [--silencieux]
 *
 * Sans argument de vue : les 41 vues.
 * Code retour : 0 conforme, 1 non conforme ou recours au niveau 3 en attente.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ZONES COMPARÉES — ARB-012
 *
 * Une vue peut déclarer, dans `verif/references/zones.json` et en écriture
 * humaine seule, les zones de son rendu qui font l'objet du verdict. Les DEUX
 * niveaux s'y restreignent — structure comme pixels —, sans quoi ils ne
 * jugeraient pas le même objet. Une vue sans déclaration est comparée PAGE
 * ENTIÈRE, par défaut : ne rien déclarer est la position la plus stricte.
 *
 * `--zones=page` force la page entière malgré une déclaration. L'option
 * n'existe que vers le PLUS strict : il n'y a aucun moyen, en ligne de
 * commande, de restreindre une zone. Un agent bloqué sur un rouge ne
 * restreint jamais une zone (PLAN §12).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ÉTATS DE ZONE — ECART-012 point 6
 *
 * Six vues — V-09, V-35, V-38, V-39, V-40, V-41 — ne présentent pas leurs
 * états comme des variantes d'un même écran pilotées par un contrôle, mais
 * comme des ZONES DISTINCTES DE LA PAGE, montrées simultanément : 55 états.
 * Ce ne sont pas des zones comparées au sens d'ARB-012 — elles ne restreignent
 * aucun verdict —, ce SONT des états.
 *
 * Côté maquette, un tel état est atteint en isolant la zone dans la page
 * rendue. Côté application, il l'est PAR LE MÊME MOYEN : l'application sert la
 * page entière à `/__design/V-xx?etat=cle`, dans la condition où la zone est
 * montrable, et le banc y isole la même zone, par le même sélecteur, au même
 * rang, avec le même code. Les deux côtés montrent la même chose, obtenue par
 * des chemins symétriques ; le niveau 1 et le niveau 2 jugent la même zone,
 * parce qu'ils lisent le même descripteur.
 *
 * La vue doit le DÉCLARER dans `verif/references/protocole-app.json`, bloc
 * `etats_de_zone`, en écriture humaine seule — le motif de la voie retenue et
 * de la voie écartée y est écrit au long. Une vue non déclarée reste REFUSÉE en
 * code 2 pour ses états de zone : ne rien écrire n'ouvre rien.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * RÉVÉLATIONS — ARB-017
 *
 * Certaines propriétés du document mesuré ne s'atteignent pas déclarativement.
 * La COUCHE SUPÉRIEURE d'un `dialog` en est une : `open` n'est pas
 * `showModal()`, et sans elle la zone `dialog.dlg` de V-40 fait 1440×901 au
 * lieu de 1440×900, sans voile. L'exiger de l'application, ce serait exiger du
 * JavaScript d'un squelette statique — donc contredire ARB-011 pour satisfaire
 * une mesure.
 *
 * Le banc établit donc la propriété lui-même, DES DEUX CÔTÉS, par un code
 * unique (`verif/banc/revelation.mjs`), comme il actionne déjà le clic des
 * déclencheurs (`ECART-014` É-3). La déclaration vit dans
 * `verif/references/protocole-app.json`, bloc `revelations`, en écriture
 * humaine seule ; UNE VUE SANS DÉCLARATION N'EST JAMAIS RÉVÉLÉE ; et le
 * rapport nomme la révélation appliquée à chaque exécution.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA RÈGLE D'ÉTALONNAGE — `ECART-015` É-5, troisième occurrence
 *
 * UN ÉTALON NE VAUT QUE POUR LES PORTIONS DE CHEMIN QU'IL EMPRUNTE RÉELLEMENT,
 * ET POUR LES PROPRIÉTÉS QUE LE CANDIDAT NE POSSÈDE PAS DÉJÀ.
 *
 * La seconde moitié est la plus récente et la plus contre-intuitive : un étalon
 * TROP CAPABLE est aveugle exactement là où le candidat est démuni. `--source=
 * composant` rejoue le corps du gel AVEC SES SCRIPTS, entre donc en modalité
 * tout seul, et sort conforme sur V-40 là où l'implémentation échouait sur les
 * dix états. Ce que chaque source n'éprouve pas est ÉNUMÉRÉ dans
 * `protocole-app.json`, bloc `sources`, et RÉIMPRIMÉ ici à chaque exécution en
 * régime d'étalonnage : un vert d'étalon qu'on lirait sans cette liste ferait
 * croire à une couverture qu'il n'a pas (RA-01).
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES, vues } from './banc/inventaire.mjs';
import {
	fenetresDe,
	FENETRES,
	avancer,
	AVANCE_CHARGEMENT_MS,
	AVANCE_ETAT_MS,
	zonesDe,
	declarationZones,
	BLOCS_HORS_PRODUIT,
	POINTEUR_AU_REPOS
} from './banc/conditions.mjs';
import { ouvrirPage, reglerPlanche, mesurer } from './banc/capture.mjs';
import { comparerStructure, comparerZone, coteACote, TOLERANCES } from './banc/comparer.mjs';
import { decoder } from './banc/png.mjs';
import {
	adresseDeLEtat,
	declarationEtatDeZone,
	declarationRevelation,
	limitesDeLaSource,
	SOURCES,
	PREFIXE as PREFIXE_DEMO
} from './banc/mode-demo.mjs';
import { reveler } from './banc/revelation.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_CAPTURES = join(racine, 'verif', 'captures');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
const EMPREINTES = join(racine, 'verif', 'references', 'empreintes.json');

/* ── Arguments ─────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
	const trouve = args.find((a) => a.startsWith(`--${nom}=`));
	return trouve ? trouve.slice(nom.length + 3) : defaut;
};
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const filtreEtats = option('etats') ? option('etats').split(',') : null;
const filtreFenetres = option('fenetres') ? option('fenetres').split(',') : null;
const contre = option('contre', 'maquette');
const base = option('base');
const source = option('source', 'app');
const filtreZones = option('zones', 'declarees');
const archiver = option('archiver', 'ecarts');
const silencieux = args.includes('--silencieux');
const sonde = option('sonde');
const etalonner = args.includes('--etalonner');

if (sonde && !['pixels', 'structure'].includes(sonde)) {
	console.error(`verif:maquette — --sonde=${sonde} inconnue (pixels | structure).`);
	process.exit(2);
}

if (!['maquette', 'app'].includes(contre)) {
	console.error(`verif:maquette — --contre=${contre} inconnu (maquette | app).`);
	process.exit(2);
}
if (!SOURCES.includes(source)) {
	console.error(`verif:maquette — --source=${source} inconnue (${SOURCES.join(' | ')}).`);
	process.exit(2);
}
if (source !== 'app' && contre !== 'app') {
	console.error('verif:maquette — --source ne vaut qu’en régime « app ».');
	process.exit(2);
}
if (!['declarees', 'page'].includes(filtreZones)) {
	// Il n'existe volontairement AUCUNE valeur qui restreindrait une zone : la
	// ligne de commande ne sait aller que vers le plus strict.
	console.error(
		`verif:maquette — --zones=${filtreZones} inconnu (declarees | page).\n` +
			'  Les zones comparées se déclarent dans verif/references/zones.json, en\n' +
			'  écriture humaine seule et sous arbitrage (ARB-012). La ligne de commande\n' +
			'  ne peut qu’élargir la surface jugée, jamais la restreindre.'
	);
	process.exit(2);
}
if (filtreFenetres?.some((f) => !FENETRES[f])) {
	console.error(`verif:maquette — fenêtre inconnue. Connues : ${Object.keys(FENETRES).join(', ')}`);
	process.exit(2);
}

const masques = JSON.parse(readFileSync(join(racine, 'verif', 'masques.json'), 'utf8'));
const toutes = vues();
const cibles = demandees.length ? toutes.filter((v) => demandees.includes(v.vue)) : toutes;
if (demandees.length && cibles.length !== demandees.length) {
	console.error(`verif:maquette — vue inconnue parmi : ${demandees.join(', ')}`);
	process.exit(2);
}

/* ── La dérive du banc, rendue visible ────────────────────────────────────
   `verif/references/empreintes.json` fige la SIGNATURE que le banc relève du
   côté maquette : empreinte de l'instantané ARIA, empreinte de l'ordre de
   tabulation, dimensions de la capture, pour chaque état et chaque fenêtre.

   Ce n'est pas une baseline en images — il n'y en a pas, et c'est délibéré
   (verif/banc/capture.mjs). C'est le témoin d'une question que rien d'autre ne
   pose : *le banc lit-il encore la maquette gelée comme il la lisait ?* Une
   montée de version de Chromium, un réglage de contexte modifié, une avance de
   temps virtuel raccourcie déplacent cette signature sans qu'aucune source
   n'ait bougé — et déplaceraient donc silencieusement tous les verdicts
   rendus ensuite. `pnpm verif:gel` garde la maquette ; ce fichier garde
   l'instrument qui la lit.

   Il est en ÉCRITURE HUMAINE SEULE, comme le reste de `verif/references/`. Un
   agent bloqué sur une dérive ne le régénère pas : il la déclare. */
function signature(mesure) {
	const somme = (v) => createHash('sha256').update(v).digest('hex').slice(0, 16);
	const releves = mesure.releves;
	return {
		aria: somme(releves.map((r) => `${r.nom}\n${r.aria}`).join('\n═══\n')),
		tabulation: somme(releves.map((r) => `${r.nom}\n${r.tabulation.join('\n')}`).join('\n═══\n')),
		focalisables: releves.reduce((total, r) => total + r.tabulation.length, 0),
		dimensions: releves
			.map((r) => {
				// Une zone non rendue n'a pas de capture — et c'est en soi une
				// propriété de la signature : le jour où la maquette se mettrait
				// à rendre le rail sous 1240 px, la dérive serait vue.
				const taille = r.png
					? (() => {
							const image = decoder(r.png);
							return `${image.largeur}×${image.hauteur}`;
						})()
					: 'non rendue';
				return releves.length > 1 ? `${r.nom} ${taille}` : taille;
			})
			.join(' · ')
	};
}

/* ── La sonde : prouver que l'instrument sait dire non ─────────────────────
   Un banc toujours vert ne prouve rien — c'est le mode de défaillance RA-01 du
   plan (§12). `--sonde` introduit une perturbation connue du seul côté
   candidat et EXIGE que la comparaison la voie. Le code retour est inversé :
   0 quand le banc a bien rougi, 1 quand il est resté vert malgré la
   perturbation, ce qui est alors le vrai défaut.

     pixels     — un assombrissement global de 4 %, sans effet sur la mise en
                  page. Le niveau 1 reste vert, seul le niveau 2 doit rougir.
     structure  — un caractère ajouté au premier titre. Le niveau 1 doit
                  rougir, avant même que les pixels ne soient comparés.
   ─────────────────────────────────────────────────────────────────────── */
async function perturber(page, genre) {
	if (genre === 'pixels') {
		await page.addStyleTag({ content: 'html { filter: brightness(0.96) !important; }' });
	} else {
		await page.evaluate(() => {
			const titre = document.querySelector('h1, h2, h3');
			if (titre) titre.textContent = `${titre.textContent} ⟂`;
		});
	}
}

/* ── Le geste qui révèle une zone ──────────────────────────────────────────
   Onze des cinquante-cinq états de zone ne sont pas simplement présents dans la
   page : ils y sont RÉVÉLÉS par un geste, que `verif/scenarios/V-xx.json` porte
   sous `zone.declencheur` — les dix boîtes de V-40, ouvertes par leur entrée de
   catalogue, et le rapport de lot de V-35.

   LE DÉFILEMENT EST REMIS À ZÉRO APRÈS LE GESTE, et c'est une condition de
   capture, pas une commodité. Playwright fait défiler jusqu'à l'élément avant de
   le cliquer : la neuvième entrée du catalogue de V-40 est sous la ligne de
   flottaison, si bien que la capture de référence porte un arrière-plan défilé
   de plusieurs centaines de pixels — 33 % de la surface comparée sur
   `d-doublon`. Or ce défilement n'appartient pas à l'état : il appartient au
   MOYEN par lequel le banc a livré le clic. Le laisser exigerait d'une
   implémentation qu'elle reproduise l'offset de défilement d'un geste qu'elle ne
   fait pas — c'est-à-dire un rouge impossible à corriger autrement qu'en
   trichant.

   `stabiliser()` remet déjà le défilement à zéro au chargement, des deux côtés :
   cette remise-ci est la même condition, appliquée après le seul autre moment où
   le banc peut le déplacer. Elle est appliquée AUX DEUX CÔTÉS, par ce code
   unique, et ne change donc jamais un verdict en faveur d'un côté.

   LE POINTEUR EST REMIS AU REPOS POUR LA MÊME RAISON, ET C'EST LE MÊME DÉFAUT
   D'UN CRAN PLUS LOIN. Playwright laisse son curseur là où il a cliqué. La
   boîte s'ouvre ensuite au centre de la fenêtre — et le curseur s'y retrouve,
   par accident de géométrie, sur le bouton principal : la référence capture
   alors un `.btn--principal:hover`, `--c-accent-fonce` au lieu de
   `--c-accent`. Mesuré sur cinq des dix boîtes de V-40, de 2 884 à 5 169 pixels
   divergents, tous sur le seul bouton.

   Ce survol n'appartient pas plus à l'état que le défilement : il appartient au
   MOYEN par lequel le banc a livré le clic. Le laisser exigerait d'une
   implémentation qu'elle devine la position du curseur d'un geste qu'elle ne
   fait pas. Le repos est (0, 0) — la position qu'a le pointeur dans TOUTES les
   autres captures du banc, celles qui ne cliquent rien : la remise au repos
   rend donc les états à déclencheur semblables aux autres, elle ne leur invente
   pas une condition à part. */
async function actionnerDeclencheur(page, declencheur) {
	const cible =
		typeof declencheur === 'string'
			? page.locator(declencheur).first()
			: page.locator(declencheur.selecteur).nth(declencheur.index);
	await cible.click();
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.mouse.move(...POINTEUR_AU_REPOS);
	await avancer(page, AVANCE_ETAT_MS);
}

/* ── Exécution ─────────────────────────────────────────────────────────── */
const debut = Date.now();
mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
if (existsSync(DOSSIER_CAPTURES)) rmSync(DOSSIER_CAPTURES, { recursive: true, force: true });
mkdirSync(DOSSIER_CAPTURES, { recursive: true });

/* ── Les deux côtés, et leurs deux serveurs ───────────────────────────────
   LA RÉFÉRENCE EST TOUJOURS LA MAQUETTE GELÉE, servie en lecture seule depuis
   `mockups/` par le serveur du banc, et pilotée par sa planche de revue. Elle
   ne change pas de régime en régime : c'est ce qui rend les deux régimes
   comparables entre eux.

   LE CANDIDAT CHANGE. En à blanc, c'est la même adresse — la maquette contre
   elle-même. En régime `app`, c'est l'application, à sa propre adresse, dont
   l'état est atteint par le mode démo. Faute de `--base`, le banc démarre
   lui-même le serveur de développement par l'API Node de Vite : le mode démo
   est un greffon `apply: 'serve'`, il n'existe que là. Démarrer un build de
   production n'aurait aucun sens — l'adresse y répond 404, et c'est la
   propriété qu'on veut.

   Deux serveurs, donc, et deux origines distinctes. Ce qui reste rigoureusement
   identique des deux côtés est ce qui décide du verdict : les conditions de
   capture, appliquées par le même code. */
const serveur = await servir(RACINE_MAQUETTES);

/** @type {{ origine: string, fermer: () => Promise<void> } | null} */
let serveurApp = null;
if (contre === 'app') {
	if (base) {
		serveurApp = { origine: base.replace(/\/$/, ''), fermer: async () => {} };
		console.log(`  candidat : ${serveurApp.origine} (base fournie)`);
	} else {
		const { createServer } = await import('vite');
		const vite = await createServer({
			configFile: join(racine, 'vite.config.ts'),
			root: racine,
			server: { port: 0, strictPort: false },
			logLevel: 'warn'
		});
		await vite.listen();
		const origine = vite.resolvedUrls?.local?.[0]?.replace(/\/$/, '');
		if (!origine) {
			console.error('verif:maquette — le serveur de développement n’a pas rendu d’adresse.');
			process.exit(2);
		}
		serveurApp = { origine, fermer: () => vite.close() };
		console.log(`  candidat : ${origine} (serveur de développement démarré par le banc)`);
	}
	// Un mode démo absent ferait comparer la maquette à une page d'erreur, et
	// le banc rougirait pour la mauvaise raison. On le constate ici, une fois.
	const sonder = await fetch(`${serveurApp.origine}${PREFIXE_DEMO}/`).catch(() => null);
	if (!sonder || !sonder.ok) {
		console.error(
			`\nverif:maquette — le mode démo ne répond pas sur ${serveurApp.origine}${PREFIXE_DEMO}/.\n` +
				'  Le régime « app » n’a alors aucun moyen d’atteindre un état côté application\n' +
				'  (ÉCART-011 É-1). Sans --base, le banc démarre lui-même le serveur de\n' +
				'  développement ; avec --base, l’adresse doit être celle d’un `vite dev`.\n'
		);
		await serveur.fermer();
		await serveurApp.fermer();
		process.exit(2);
	}
}

const navigateur = await chromium.launch();
const resultats = [];
const defauts = [];
const derives = [];
const signatures = {};
/** Les zones effectivement comparées, vue par vue — le rapport les nomme. */
const zonesParVue = new Map();
/** Les révélations effectivement appliquées, vue par vue — ARB-017, même règle. */
const revelationsParVue = new Map();
const empreintesConnues =
	existsSync(EMPREINTES) && !etalonner ? JSON.parse(readFileSync(EMPREINTES, 'utf8')) : null;
/** La baseline porte la surface déclarée : l'élargir la rend incomparable. */
const signatureComparable = filtreZones === 'declarees';

/* ── L'agrégation d'un verdict sur plusieurs zones ─────────────────────────
   Quand une vue déclare des zones comparées, le protocole s'applique zone par
   zone, et le verdict de l'état est LE PIRE des verdicts de zone — jamais une
   moyenne. Une moyenne diluerait une petite zone entièrement fausse dans une
   grande zone juste : c'est exactement l'inverse de ce qu'on veut savoir. Les
   comptes de pixels, eux, sont cumulés, pour que le rapport reste lisible. */
const RANG = { conforme: 0, niveau3: 1, echec: 2 };

function agregerNiveau2(parZone) {
	if (parZone.some((z) => z.niveau2 === null)) return null;
	let pixelsDifferents = 0;
	let pixelsTotal = 0;
	let ecartCanalMax = 0;
	let motif = null;
	let verdict = 'conforme';
	const nonRendues = [];
	const dimensionsRef = [];
	const dimensionsCand = [];
	for (const z of parZone) {
		const n = z.niveau2;
		pixelsDifferents += n.pixelsDifferents ?? 0;
		pixelsTotal += n.pixelsTotal ?? 0;
		ecartCanalMax = Math.max(ecartCanalMax, n.ecartCanalMax ?? 0);
		if (n.motif && motif === null) motif = `${z.zone} — ${n.motif}`;
		if (n.nonRendue) nonRendues.push(z.zone);
		if (RANG[n.verdict] > RANG[verdict]) verdict = n.verdict;
		dimensionsRef.push(
			parZone.length > 1 ? `${z.zone} ${n.dimensions.reference}` : n.dimensions.reference
		);
		dimensionsCand.push(
			parZone.length > 1 ? `${z.zone} ${n.dimensions.candidat}` : n.dimensions.candidat
		);
	}
	return {
		verdict,
		motif,
		nonRendues,
		pixelsDifferents,
		pixelsTotal,
		proportion: pixelsTotal === 0 ? 0 : pixelsDifferents / pixelsTotal,
		ecartCanalMax,
		dimensions: { reference: dimensionsRef.join(' · '), candidat: dimensionsCand.join(' · ') }
	};
}

/** Un nom de zone rendu sûr pour un nom de fichier de capture. */
const nomDeFichier = (zone) => zone.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

for (const { vue, fichier } of cibles) {
	const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${vue}.json`), 'utf8'));
	const masquesVue = (masques.vues[vue] ?? []).map((m) => m.selecteur);
	const fenetres = (filtreFenetres ?? fenetresDe(vue)).filter((f) => fenetresDe(vue).includes(f));
	const etats = scenario.etats.filter((e) => !filtreEtats || filtreEtats.includes(e.cle));
	if (filtreEtats) {
		// Un filtre qui laisse tomber silencieusement une clé inconnue est un
		// piège : il fait croire qu'un état a été vérifié alors qu'il n'a même
		// pas été tenté.
		const connues = new Set(scenario.etats.map((e) => e.cle));
		const inconnues = filtreEtats.filter((c) => !connues.has(c));
		if (inconnues.length && cibles.length === 1) {
			console.error(
				`verif:maquette — état(s) inconnu(s) de ${vue} : ${inconnues.join(', ')}\n` +
					`  états déclarés : ${[...connues].join(', ')}`
			);
			process.exit(2);
		}
		if (etats.length === 0) continue;
	}

	// ARB-012 — les zones comparées. Une vue qui n'en déclare pas est comparée
	// page entière ; `--zones=page` force la page entière malgré la déclaration.
	const zonesVue = filtreZones === 'page' ? [] : zonesDe(vue);
	zonesParVue.set(vue, {
		vue,
		zones: zonesVue,
		surface: zonesVue.length ? zonesVue.join(' + ') : 'page entière',
		declaration: declarationZones(vue),
		forcePageEntiere: filtreZones === 'page' && zonesDe(vue).length > 0,
		// ECART-012 point 6 — les états de zone, comptés et déclarés à part : ils ne
		// restreignent aucun verdict, ils SONT des états. Le rapport les nomme pour
		// que leur isolement ne puisse pas être silencieux.
		etatsDeZone: etats.filter((e) => e.zone).length,
		protocoleZone: declarationEtatDeZone(vue)
	});

	for (const fenetre of fenetres) {
		const adresseMaquette = `${serveur.origine}/${fichier}`;

		for (const etat of etats) {
			if (contre === 'app' && etat.zone && !declarationEtatDeZone(vue)) {
				// Le refus reste le défaut, et il reste explicite : un état de zone
				// est atteint dans la maquette en isolant un fragment de la page, pas
				// en réglant un contrôle. Tant que `protocole-app.json` ne déclare pas
				// que la vue est atteignable par sa page, le banc n'a aucun chemin —
				// et un refus vaut mieux qu'un vert muet (RA-01).
				console.error(
					`\nverif:maquette — ${vue} · ${etat.cle} est un état de ZONE côte à côte, et ${vue}\n` +
						'  n’a pas de protocole d’état de zone déclaré. Il est atteint dans la maquette\n' +
						'  en isolant un fragment de la page, pas en réglant un contrôle : le banc n’a\n' +
						'  aucun moyen d’en déduire ce que l’application doit servir. La déclaration se\n' +
						'  fait dans verif/references/protocole-app.json, bloc « etats_de_zone », en\n' +
						'  écriture humaine seule (ÉCART-011 É-9, ÉCART-012 point 6).\n'
				);
				process.exit(2);
			}

			/* ── LE MÊME BUDGET D'HORLOGE DES DEUX CÔTÉS ────────────────────────
			   PLAN §4.2 exige des conditions identiques des deux côtés, et
			   l'horloge en fait partie : `ECART-012` a montré que douze états sur
			   333 divergeaient pour un vecteur appliqué à t = 0 au lieu de
			   t = AVANCE_CHARGEMENT_MS.

			   Le côté référence dépense, après le chargement, exactement ce que
			   son état exige : une avance s'il y a une planche à régler, une autre
			   s'il y a un déclencheur de zone à actionner. Le candidat dépense les
			   MÊMES avances, dans le même ordre, et les sources qui rejouent la
			   maquette reçoivent en plus l'INSTANT du vecteur — `&differe=` — pour
			   l'appliquer au même moment virtuel. Sans ce calcul, un état de zone
			   sans planche ni déclencheur (V-09, V-41) verrait le candidat avancer
			   de 1 000 ms que la référence n'a pas dépensés : c'est l'horloge
			   qu'on mesurerait, et non la vue. */
			const regleLaPlanche = Boolean(etat.vecteur ?? scenario.defaut);
			const instantVecteur = AVANCE_CHARGEMENT_MS;

			const mesures = {};
			// Deux chargements indépendants, dans deux contextes distincts :
			// c'est ce qui rend l'à-blanc probant. Deux captures prises sur la
			// même page seraient identiques par construction et ne
			// prouveraient rien du déterminisme du harnais.
			for (const nom of ['reference', 'candidat']) {
				const coteApplication = contre === 'app' && nom === 'candidat';
				const adresse = coteApplication
					? `${serveurApp.origine}${adresseDeLEtat(vue, etat.cle, source, instantVecteur)}`
					: adresseMaquette;
				const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, fenetre);
				if (coteApplication && statut !== null && statut >= 400) {
					// Une page d'erreur se compare aussi bien qu'une vue, et le
					// banc rougirait alors pour une raison qui n'a rien à voir
					// avec le rendu. On cite ce que le mode démo a répondu.
					const titre = await page
						.locator('h1')
						.first()
						.textContent()
						.catch(() => null);
					const explication = await page
						.locator('p')
						.allTextContents()
						.catch(() => []);
					console.error(
						`\nverif:maquette — le candidat a répondu ${statut} sur\n  ${adresse}\n\n` +
							`  ${titre ?? '(sans titre)'}\n` +
							explication.map((l) => `  ${l}`).join('\n') +
							'\n'
					);
					await page.close();
					await contexte.close();
					await navigateur.close();
					await serveur.fermer();
					if (serveurApp) await serveurApp.fermer();
					process.exit(1);
				}
				if (sonde && nom === 'candidat') await perturber(page, sonde);
				if (coteApplication) {
					// L'ÉTAT EST DÉJÀ ATTEINT : il est porté par l'adresse, c'est
					// tout le propos du mode démo. On dépense néanmoins, dans le
					// même ordre, les avances que la référence a dépensées : le
					// budget d'horloge doit être identique des deux côtés, sinon
					// c'est lui qu'on mesurerait et non la vue.
					if (regleLaPlanche) await avancer(page, AVANCE_ETAT_MS);
					if (etat.zone?.declencheur) {
						// LES SOURCES QUI REJOUENT LA MAQUETTE REJOUENT AUSSI LE
						// GESTE, par ce même code. Elles n'ont pas d'implémentation à
						// qui demander l'état ; et un clic livré autrement — depuis
						// un script de la page — n'est pas le même geste : il ne fait
						// pas défiler jusqu'à l'élément et ne met pas le document en
						// modalité « pointeur ». Mesuré : 33 % des pixels d'écart sur
						// `d-doublon`, un anneau de focalisation de trop sur
						// `d-simple`. La source `app`, elle, reçoit l'état par
						// l'adresse : elle rend l'état et jamais la transition
						// (ARB-011), il n'y a rien à cliquer.
						if (source !== 'app') await actionnerDeclencheur(page, etat.zone.declencheur);
						else await avancer(page, AVANCE_ETAT_MS);
					}
				} else {
					if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
					else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
					if (etat.zone?.declencheur) await actionnerDeclencheur(page, etat.zone.declencheur);
				}

				/* ── LA RÉVÉLATION — ARB-017, appliquée ICI et donc AUX DEUX CÔTÉS.
				   Elle est écrite comme une PROPRIÉTÉ À RENDRE VRAIE, jamais comme
				   un geste à jouer d'un seul côté : « tout dialog[open] est :modal ».
				   Du côté maquette le clic du banc l'a déjà rendue vraie, et le code
				   ne touche à rien — la référence n'est pas modifiée, sa signature
				   au verif/references/empreintes.json ne bouge pas. Du côté
				   application il l'établit. La postcondition est VÉRIFIÉE des deux
				   côtés : une révélation qui n'aurait pas pris échoue bruyamment.

				   Une vue sans déclaration n'est jamais révélée : `reveler()` rend
				   `null` sans toucher à la page. */
				const revele = await reveler(page, declarationRevelation(vue), nom, {
					/* La modalité de saisie de la RÉFÉRENCE, que la révélation
					   reproduira du côté candidat au lieu d'en imposer une. Le banc
					   la connaît mécaniquement : il a livré un vrai geste de pointeur
					   à la référence si et seulement si l'état porte un déclencheur —
					   onze états sur les vingt-six qui ouvrent un dialogue. Les quinze
					   autres s'ouvrent sur un `change` synthétique de `reglerPlanche()`,
					   sans qu'aucun pointeur ne touche la page : leur référence affiche
					   donc l'anneau de focalisation, et l'appui retiré au candidat en
					   ferait 308 px d'écart. Voir verif/banc/revelation.mjs. */
					modaliteReference: etat.zone?.declencheur ? 'pointeur' : 'script'
				});
				if (revele) {
					const cumul = revelationsParVue.get(vue) ?? {
						vue,
						revelation: revele.revelation,
						mesures: 0,
						deja_vraie: 0,
						etablie: 0,
						elements: 0
					};
					cumul.mesures++;
					if (revele.revelees.length) {
						cumul.etablie++;
						cumul.elements += revele.revelees.length;
					} else cumul.deja_vraie++;
					revelationsParVue.set(vue, cumul);
				}

				mesures[nom] = await mesurer(page, {
					zone: etat.zone ?? null,
					zones: zonesVue,
					masques: masquesVue
				});
				await page.close();
				await contexte.close();
			}

			const cle = `${vue}/${etat.cle}@${fenetre}`;
			const empreinte = signature(mesures.reference);
			signatures[cle] = empreinte;
			// La signature de référence est relevée sur la SURFACE JUGÉE. Élargir
			// cette surface par `--zones=page` la rend, à bon droit, incomparable
			// à la baseline : on ne compare pas deux mesures de deux objets. Le
			// contrôle de dérive est alors suspendu, et le rapport le dit — il
			// n'est jamais suspendu en silence.
			const attendue = signatureComparable ? empreintesConnues?.signatures?.[cle] : null;
			if (attendue && JSON.stringify(attendue) !== JSON.stringify(empreinte)) {
				derives.push({ cle, attendue, obtenue: empreinte });
			}

			// Le protocole en trois niveaux, appliqué zone par zone. Les DEUX
			// niveaux lisent la même liste de zones : ils jugent donc le même
			// objet (ARB-012).
			const parZone = mesures.reference.releves.map((r, i) => {
				const c = mesures.candidat.releves[i];
				const n1 = comparerStructure(r, c);
				return {
					zone: r.nom,
					niveau1: n1,
					niveau2: n1.conforme ? comparerZone(r, c) : null,
					pngReference: r.png,
					pngCandidat: c.png
				};
			});

			const niveau1 = {
				conforme: parZone.every((z) => z.niveau1.conforme),
				ecarts: parZone.flatMap((z) =>
					z.niveau1.ecarts.map((e) => (parZone.length > 1 ? { ...e, zone: z.zone } : e))
				)
			};
			const niveau2 = agregerNiveau2(parZone);

			// EN À BLANC, LES TOLÉRANCES NE S'APPLIQUENT PAS. La maquette est
			// comparée à elle-même : l'exigence est zéro pixel différent, sans
			// seuil. Laisser passer 0,5 % ici reviendrait à étalonner
			// l'instrument avec l'instrument, et à masquer précisément le genre
			// de dérive — sous-pixel, fonderie, minuterie — que l'à-blanc
			// existe pour débusquer (verif/references/tolerances.json, « a_blanc »).
			//
			// LE RÉGIME `app` EN SOURCE `etalon` OBÉIT À LA MÊME RÈGLE, et pour
			// la même raison : le candidat y est CONNU IDENTIQUE à la référence.
			// Une tolérance y absorberait précisément l'écart que l'étalonnage
			// existe pour débusquer — celui que la plomberie du régime
			// fabriquerait à elle seule.
			const sansTolerance = contre === 'maquette' || source !== 'app';
			const verdict = !niveau1.conforme
				? 'echec-structure'
				: sansTolerance
					? niveau2.pixelsDifferents === 0 && niveau2.motif === null
						? 'conforme'
						: 'echec-a-blanc'
					: niveau2.verdict === 'conforme'
						? 'conforme'
						: niveau2.verdict === 'niveau3'
							? 'recours-niveau3'
							: 'echec-pixels';

			/* LE RAPPORT NOMME CE QUI A ÉTÉ COMPARÉ, état par état. Un état de
			   zone n'est pas comparé page entière : il est comparé SUR SA ZONE, et
			   le dire est le garde-fou qui rend l'isolement non silencieux — le
			   même qu'ARB-012 impose aux zones comparées. */
			const surfaceEtat = etat.zone
				? `zone ${etat.zone.selecteur}#${etat.zone.index}`
				: zonesVue.length
					? zonesVue.join(' + ')
					: 'page entière';

			const resultat = {
				vue,
				etat: etat.cle,
				libelle: etat.libelle,
				fenetre,
				surface: surfaceEtat,
				etat_de_zone: Boolean(etat.zone),
				verdict,
				niveau1: { conforme: niveau1.conforme, ecarts: niveau1.ecarts },
				niveau2: niveau2
					? {
							verdict: niveau2.verdict,
							motif: niveau2.motif,
							pixelsDifferents: niveau2.pixelsDifferents,
							pixelsTotal: niveau2.pixelsTotal,
							proportion: niveau2.proportion,
							ecartCanalMax: niveau2.ecartCanalMax,
							nonRendues: niveau2.nonRendues,
							dimensions: niveau2.dimensions,
							parZone:
								parZone.length > 1
									? parZone.map((z) => ({
											zone: z.zone,
											pixelsDifferents: z.niveau2?.pixelsDifferents ?? null,
											pixelsTotal: z.niveau2?.pixelsTotal ?? null,
											verdict: z.niveau2?.verdict ?? null
										}))
									: null
						}
					: null,
				captures: null
			};

			const aArchiver = archiver === 'complet' || verdict !== 'conforme';
			if (aArchiver) {
				const dossier = join(DOSSIER_CAPTURES, vue);
				mkdirSync(dossier, { recursive: true });
				resultat.captures = [];
				for (const z of parZone) {
					if (!z.pngReference && !z.pngCandidat) continue; // zone non rendue des deux côtés
					const suffixe = parZone.length > 1 ? `~${nomDeFichier(z.zone)}` : '';
					const base = `${etat.cle}@${fenetre}${suffixe}`;
					const prefixe = join(dossier, base);
					if (z.pngReference) writeFileSync(`${prefixe}-reference.png`, z.pngReference);
					if (z.pngCandidat) writeFileSync(`${prefixe}-candidat.png`, z.pngCandidat);
					if (z.niveau2?.ecart) writeFileSync(`${prefixe}-ecart.png`, z.niveau2.ecart);
					if (z.pngReference && z.pngCandidat) {
						writeFileSync(`${prefixe}-cote-a-cote.png`, coteACote(z.pngReference, z.pngCandidat));
					}
					resultat.captures.push({
						zone: z.zone,
						reference: z.pngReference ? `verif/captures/${vue}/${base}-reference.png` : null,
						candidat: z.pngCandidat ? `verif/captures/${vue}/${base}-candidat.png` : null,
						ecart: z.niveau2?.ecart ? `verif/captures/${vue}/${base}-ecart.png` : null,
						coteACote:
							z.pngReference && z.pngCandidat
								? `verif/captures/${vue}/${base}-cote-a-cote.png`
								: null
					});
				}
			}

			resultats.push(resultat);
			if (verdict !== 'conforme') defauts.push(resultat);
			if (!silencieux) {
				process.stdout.write(
					`  ${vue} ${etat.cle.padEnd(34)} ${fenetre.padEnd(9)} ` +
						`${verdict === 'conforme' ? 'conforme' : verdict.toUpperCase()}` +
						(niveau2?.pixelsDifferents
							? `  ${niveau2.pixelsDifferents} px (${(niveau2.proportion * 100).toFixed(4)} %)`
							: '') +
						'\n'
				);
			}
		}
	}
}

await navigateur.close();
await serveur.fermer();
if (serveurApp) await serveurApp.fermer();

/* ── Étalonnage de la signature, ou contrôle de non-dérive ─────────────── */
if (etalonner) {
	if (
		contre !== 'maquette' ||
		demandees.length ||
		filtreEtats ||
		filtreFenetres ||
		sonde ||
		filtreZones !== 'declarees'
	) {
		console.error(
			'verif:maquette --etalonner — la signature de référence se produit sur la\n' +
				'  totalité des vues, en régime « maquette », sans filtre ni sonde, et sur la\n' +
				'  surface réellement jugée (--zones=declarees).'
		);
		process.exit(2);
	}
	writeFileSync(
		EMPREINTES,
		JSON.stringify(
			{
				_: [
					'BASELINE DU BANC — ÉCRITURE HUMAINE SEULE.',
					'Signature que le banc relève du côté maquette gelée : empreinte de',
					"l'instantané ARIA, empreinte de l'ordre de tabulation, nombre",
					"d'éléments focalisables, dimensions de la capture — sur la SURFACE",
					'RÉELLEMENT JUGÉE : page entière, ou zones comparées quand la vue en',
					'déclare (ARB-012). Produite par `pnpm verif:maquette --etalonner`.',
					'',
					'RÉ-ÉTALONNÉE le 18 août 2026, lot T-007b. Motif : ce que le banc LIT a',
					"changé, sur décision d'instrument, et non ce que la maquette montre.",
					'Trois changements, tous déclarés — `section.regles` de V-37 retiré',
					"avant capture parce que la maquette dit elle-même qu'il n'appartient",
					'pas au produit ; les zones comparées de V-37 (ARB-012) ; la signature',
					'qui porte désormais le nom de chaque zone et sa restitution. Un',
					"ré-étalonnage est un geste d'orchestrateur, tracé ici et au rapport de",
					"lot — jamais la sortie silencieuse d'un contrôle de dérive.",
					'',
					"Elle répond à une question que rien d'autre ne pose : le banc lit-il",
					'encore la maquette gelée comme il la lisait ? `pnpm verif:gel` garde',
					"la maquette ; ce fichier garde l'instrument qui la lit.",
					'',
					"Un agent d'exécution ne le régénère JAMAIS pour faire passer un",
					'contrôle de dérive : il déclare la dérive (PLAN §12).'
				],
				navigateur: `chromium ${navigateur.version()}`,
				le: new Date().toISOString(),
				etats: Object.keys(signatures).length,
				signatures
			},
			null,
			'\t'
		) + '\n'
	);
	console.log(
		`\n  Signature de référence écrite : ${Object.keys(signatures).length} états — verif/references/empreintes.json\n`
	);
}

/* ── Rapport ───────────────────────────────────────────────────────────── */
const duree = ((Date.now() - debut) / 1000).toFixed(1);
const recours = resultats.filter((r) => r.verdict === 'recours-niveau3');
const parVue = new Map();
for (const r of resultats) {
	const e = parVue.get(r.vue) ?? { vue: r.vue, total: 0, conformes: 0, defauts: 0, recours: 0 };
	e.total++;
	if (r.verdict === 'conforme') e.conformes++;
	else e.defauts++;
	if (r.verdict === 'recours-niveau3') e.recours++;
	parVue.set(r.vue, e);
}

const rapport = {
	batterie: '11 « conformité de maquette »',
	lot: 'T-007 (étalonnage à blanc) puis T-007b (régime « app »)',
	regime:
		contre === 'maquette'
			? 'étalonnage à blanc — maquette contre elle-même'
			: source === 'etalon'
				? 'étalonnage du régime « app » — candidat CONNU IDENTIQUE (maquette gelée servie par le mode démo)'
				: source === 'composant'
					? 'étalonnage du régime « app » PAR LE CHEMIN RÉEL — candidat CONNU IDENTIQUE, corps du gel rendu par render() (ÉCART-013 É-1)'
					: 'conformité — maquette gelée contre application',
	candidat:
		contre === 'maquette'
			? 'la maquette gelée elle-même'
			: `${serveurApp?.origine ?? '(inconnu)'}${PREFIXE_DEMO}/V-xx?etat=… (source « ${source} »)`,
	blocs_hors_produit: BLOCS_HORS_PRODUIT,
	zones_comparees: [...zonesParVue.values()].map((z) => ({
		vue: z.vue,
		surface: z.surface,
		arbitrage: z.declaration?.arbitrage ?? null,
		forcee_page_entiere: z.forcePageEntiere
	})),
	/* ARB-017 — LE RAPPORT NOMME LA RÉVÉLATION APPLIQUÉE, comme il nomme déjà
	   les zones. Une vue déclarée mais jamais atteinte n'apparaît pas : ce qui
	   est écrit ici est ce que le banc a RÉELLEMENT établi. */
	revelations: [...revelationsParVue.values()].map((r) => {
		const declaration = declarationRevelation(r.vue);
		return {
			vue: r.vue,
			revelation: r.revelation,
			propriete: declaration?.propriete ?? null,
			mesures: r.mesures,
			deja_vraie: r.deja_vraie,
			etablie: r.etablie,
			elements_reveles: r.elements,
			arbitrage: declaration?.arbitrage ?? null
		};
	}),
	source_limites: contre === 'app' ? (limitesDeLaSource(source) ?? null) : null,
	etats_de_zone: [...zonesParVue.values()]
		.filter((z) => z.etatsDeZone > 0)
		.map((z) => ({
			vue: z.vue,
			etats: z.etatsDeZone,
			protocole: z.protocoleZone?.protocole ?? null,
			zone: z.protocoleZone?.zone ?? null,
			obligation: z.protocoleZone?.obligation ?? null,
			arbitrage: z.protocoleZone?.arbitrage ?? null
		})),
	le: new Date().toISOString(),
	duree_s: Number(duree),
	tolerances: TOLERANCES,
	comptes: {
		vues: parVue.size,
		etats: resultats.length,
		conformes: resultats.length - defauts.length,
		defauts: defauts.length,
		recours_niveau3: recours.length,
		taux_recours: resultats.length ? recours.length / resultats.length : 0
	},
	derives,
	parVue: [...parVue.values()],
	resultats
};
writeFileSync(join(DOSSIER_RAPPORTS, 'maquette.json'), JSON.stringify(rapport, null, '\t') + '\n');

console.log('\n─────────────────────────────────────────────────────────────────────');
console.log(`verif:maquette — ${rapport.regime}`);
console.log(
	`  ${parVue.size} vue(s) · ${resultats.length} couple(s) de captures · ${duree} s\n` +
		`  conformes : ${rapport.comptes.conformes}` +
		`  ·  écarts : ${defauts.length}` +
		`  ·  recours au niveau 3 : ${recours.length} (${(rapport.comptes.taux_recours * 100).toFixed(2)} %)`
);
console.log(`  candidat : ${rapport.candidat}`);
console.log(
	`  blocs retirés avant capture (déclarés hors produit par la maquette) : ${BLOCS_HORS_PRODUIT.join(', ')}`
);

/* ARB-012 — LE RAPPORT NOMME LES ZONES COMPARÉES À CHAQUE EXÉCUTION. C'est
   l'un des trois garde-fous sans lesquels la conformité par zone serait une
   échappatoire : une restriction silencieuse est impossible, elle se lit dans
   la sortie de chaque exécution, avec l'arbitrage qui l'autorise. */
const restreintes = [...zonesParVue.values()].filter((z) => z.zones.length);
if (restreintes.length) {
	console.log(`  zones comparées — ${restreintes.length} vue(s) à surface déclarée :`);
	for (const z of restreintes) {
		console.log(
			`    ${z.vue} : ${z.surface}   (${z.declaration?.arbitrage ?? 'sans arbitrage cité'})`
		);
	}
	console.log(
		`  les ${zonesParVue.size - restreintes.length} autre(s) vue(s) sont comparées PAGE ENTIÈRE, par défaut.`
	);
} else {
	const forcees = [...zonesParVue.values()].filter((z) => z.forcePageEntiere);
	console.log(
		`  zones comparées : page entière pour les ${zonesParVue.size} vue(s)` +
			(forcees.length
				? ` — dont ${forcees.length} à surface déclarée, élargie par --zones=page`
				: '')
	);
}
/* ECART-012 point 6 — LE RAPPORT NOMME AUSSI LES ÉTATS DE ZONE. Un état de zone
   n'est pas comparé page entière : il est comparé SUR SA ZONE, isolée dans la
   page rendue des DEUX côtés. Le dire à chaque exécution est le garde-fou qui
   rend l'isolement non silencieux, exactement comme ARB-012 l'impose aux zones
   comparées. */
const parEtatDeZone = [...zonesParVue.values()].filter((z) => z.etatsDeZone > 0);
if (parEtatDeZone.length) {
	const total = parEtatDeZone.reduce((n, z) => n + z.etatsDeZone, 0);
	console.log(
		`  états de zone — ${total} état(s) isolé(s) dans la page, sur ${parEtatDeZone.length} vue(s) :`
	);
	for (const z of parEtatDeZone) {
		console.log(
			`    ${z.vue} : ${z.etatsDeZone} état(s) de zone` +
				(contre === 'app'
					? `   (${z.protocoleZone?.protocole ?? 'sans protocole déclaré'} — ${
							z.protocoleZone?.arbitrage ?? 'sans arbitrage cité'
						})`
					: '')
		);
	}
	console.log(
		'    la zone de chaque état est celle de verif/scenarios/V-xx.json, dérivée de la\n' +
			'    maquette gelée ; elle est isolée par le même code des deux côtés.'
	);
}

/* ARB-017 — LE RAPPORT NOMME LA RÉVÉLATION APPLIQUÉE, à chaque exécution, et
   au même titre que les zones comparées et les états de zone. Une révélation
   silencieuse serait un changement de surface mesurée qu'on ne verrait pas. */
if (revelationsParVue.size) {
	console.log(`  révélations — ${revelationsParVue.size} vue(s) à propriété établie par le banc :`);
	for (const r of revelationsParVue.values()) {
		const declaration = declarationRevelation(r.vue);
		console.log(
			`    ${r.vue} : « ${r.revelation} » — ${declaration?.propriete ?? 'sans propriété citée'}`
		);
		console.log(
			`      ${r.mesures} mesure(s) : déjà vraie sur ${r.deja_vraie}, établie sur ${r.etablie} ` +
				`(${r.elements} élément(s))   (${declaration?.arbitrage ?? 'sans arbitrage cité'})`
		);
	}
	console.log(
		'    exigée par le même code des DEUX côtés, avant la mesure, et VÉRIFIÉE des deux côtés :\n' +
			'    là où la propriété est déjà vraie, rien n’est touché. Une vue non déclarée à\n' +
			'    verif/references/protocole-app.json n’est jamais révélée.'
	);
} else {
	console.log('  révélations : aucune — aucune vue mesurée n’en déclare (ARB-017).');
}

/* `ECART-015` É-5 — CE QUE L'ÉTALON N'ÉPROUVE PAS, RÉIMPRIMÉ À CHAQUE
   EXÉCUTION. Un étalon ne vaut que pour les portions de chemin qu'il emprunte
   réellement, ET pour les propriétés que le candidat ne possède pas déjà. Un
   vert d'étalon lu sans cette liste ferait croire à une couverture qu'il n'a
   pas (RA-01). */
if (contre === 'app') {
	const limites = limitesDeLaSource(source);
	if (limites?.n_eprouve_pas?.length) {
		console.log(`  ce que la source « ${source} » N’ÉPROUVE PAS :`);
		for (const ligne of limites.n_eprouve_pas) console.log(`    · ${ligne}`);
	}
}

if (!signatureComparable) {
	console.log(
		'  contrôle de dérive du banc : SUSPENDU — --zones=page mesure une autre surface\n' +
			'    que celle qu’étalonne verif/references/empreintes.json. Le contrôle reprend\n' +
			'    dès que la surface jugée redevient la surface déclarée.'
	);
}
console.log(`  rapport machine : verif/rapports/maquette.json`);

if (derives.length) {
	console.error(
		`\n  ${derives.length} DÉRIVE(S) DE BANC — la signature relevée sur la maquette gelée\n` +
			`  ne correspond plus à verif/references/empreintes.json (${empreintesConnues.navigateur},\n` +
			`  étalonnée le ${empreintesConnues.le}). Aucune source n'a bougé : c'est l'instrument\n` +
			`  qui a changé, ou son environnement. À déclarer, jamais à ré-étalonner en silence.\n`
	);
	for (const d of derives.slice(0, 20)) {
		console.error(
			`    ${d.cle}\n      attendue : ${JSON.stringify(d.attendue)}\n      obtenue  : ${JSON.stringify(d.obtenue)}`
		);
	}
	process.exit(1);
}

if (sonde) {
	if (defauts.length === resultats.length && resultats.length > 0) {
		console.log(
			`  SONDE « ${sonde} » — le banc a vu la perturbation sur ${defauts.length} état(s) sur ${resultats.length}.\n`
		);
		process.exit(0);
	}
	console.error(
		`\n  SONDE « ${sonde} » — ÉCHEC : ${resultats.length - defauts.length} état(s) sont restés\n` +
			`  conformes malgré une perturbation délibérée. Un banc qui ne sait pas dire non\n` +
			`  ne prouve rien (PLAN §12, RA-01).\n`
	);
	process.exit(1);
}

if (defauts.length) {
	console.error(`\n  ${defauts.length} état(s) non conforme(s) :`);
	for (const d of defauts.slice(0, 40)) {
		console.error(`    ${d.vue} · ${d.etat} @ ${d.fenetre} — ${d.verdict}`);
		if (!d.niveau1.conforme) {
			for (const e of d.niveau1.ecarts) {
				console.error(
					`        niveau 1 · ${e.zone ? `${e.zone} · ` : ''}${e.quoi} · ligne ${e.detail?.ligne}\n` +
						`          référence : ${e.detail?.reference}\n` +
						`          candidat  : ${e.detail?.candidat}`
				);
			}
		}
		if (d.niveau2) {
			console.error(
				`        niveau 2 · ${
					d.niveau2.motif ??
					`${d.niveau2.pixelsDifferents} px sur ${d.niveau2.pixelsTotal}` +
						` (${(d.niveau2.proportion * 100).toFixed(4)} %), écart de canal max ${d.niveau2.ecartCanalMax}`
				}` + `  ${d.niveau2.dimensions.reference} / ${d.niveau2.dimensions.candidat}`
			);
		}
		for (const c of d.captures ?? []) {
			console.error(`        captures ${c.zone} : ${c.coteACote}`);
		}
	}
	if (defauts.length > 40)
		console.error(`    … et ${defauts.length - 40} autre(s), voir le rapport.`);

	if (contre === 'app' && source !== 'app') {
		console.error(`
En étalonnage du régime « app », le candidat est la MAQUETTE GELÉE elle-même,
servie par le mode démo. Un écart n'est donc JAMAIS un défaut d'implémentation
— il n'y a pas d'implémentation — mais un DÉFAUT DE PLOMBERIE du régime :
adresse mal construite, état atteint autrement des deux côtés, budget d'horloge
virtuelle différent, police servie par un autre chemin, document altéré à la
volée. Tant qu'il n'est pas à zéro, le régime « app » mesurerait le harnais et
non la vue.

Il ne s'absorbe pas en élargissant une tolérance : c'est le contournement de
vérification nommé par PLAN §12.
`);
	}

	if (contre === 'maquette') {
		console.error(`
En étalonnage à blanc, la maquette est comparée à elle-même : un écart n'est
JAMAIS un défaut de maquette, toujours un DÉFAUT DE BANC — polices chargées en
retard, animation résiduelle, horloge non gelée, barre de défilement, arrondi
sous-pixel, tirage au sort. Il se chasse jusqu'à zéro, ou il se déclare.

Il ne s'absorbe pas en élargissant une tolérance : c'est le contournement de
vérification nommé par PLAN §12.
`);
	}
	process.exit(1);
}

if (recours.length) {
	console.error(`\n  ${recours.length} état(s) en attente d'arbitrage au niveau 3.`);
	process.exit(1);
}

console.log('  Aucun écart.\n');
process.exit(0);
