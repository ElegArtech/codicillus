#!/usr/bin/env node
/**
 * `pnpm test:a11y` — batterie 10 du catalogue (PLAN-DE-REALISATION.md §5).
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni
 * `verif/a11y-sondes.mjs`, ni `verif/references/a11y-seuil.json`. Retirer une
 * règle, élargir un seuil ou requalifier une nature pour obtenir du vert est
 * le contournement nommé par PLAN §12 (RA-01) : le dispositif certifierait
 * alors le défaut. La sortie légitime est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BATTERIE PROUVE
 *
 * PLAN §5, batterie 10 : « axe-core sans violation ; parcours complet au
 * clavier ; focus visible ; superpositions qui piègent le focus et le rendent ;
 * alternatives textuelles des contenus graphiques » — RG-M18-07 à 11, P-06.
 *
 * Elle le prouve sur les 41 vues implémentées et leurs 409 couples
 * « état × fenêtre », les mêmes que `verif:maquette`, lus dans les mêmes
 * `verif/scenarios/V-xx.json` et atteints par les mêmes chemins : la planche
 * de revue côté gel, le mode démo côté application.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE POINT DÉCISIF : DEUX CÔTÉS, UN SEUL CODE, TROIS NATURES
 *
 * Une batterie d'accessibilité qui n'auditerait que l'application rendrait un
 * chiffre inutilisable. Le dépôt porte 41 maquettes GELÉES qui font loi
 * (`CLAUDE.md` §2) et qu'un lot n'a pas le droit de corriger : un défaut
 * d'accessibilité qui vient d'elles ne se répare pas dans le code, il se
 * répare par un REGEL — geste du commanditaire. Un rapport qui mélangerait les
 * deux ferait perdre son temps à tout le monde, et pousserait un exécutant à
 * dévier de son gel pour verdir une batterie.
 *
 * La batterie audite donc les DEUX CÔTÉS, dans les mêmes conditions de
 * capture, par le même code — c'est la jurisprudence de `verif/banc/` — et
 * lit le verdict dans leur comparaison :
 *
 *     gel + application  → « gel »              regel, arbitrage
 *     application seule  → « portage »          corrigeable par le lot
 *     gel seul           → « gel non reporté »  divergence à signaler
 *     ni l'un ni l'autre → « instrument »       la batterie ne tranche pas
 *
 * La méthode et ses garde-fous sont écrits en tête de `verif/a11y-sondes.mjs`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'HORLOGE — UN COUPLAGE QU'IL A FALLU DÉCOUVRIR
 *
 * `verif/banc/conditions.mjs` ARRÊTE l'horloge du document : `Date`,
 * `setTimeout`, `setInterval` sont virtualisés et ne bougent que sur ordre du
 * banc. C'est ce qui rend les captures déterministes.
 *
 * AXE-CORE NE REND JAMAIS LA MAIN SOUS HORLOGE ARRÊTÉE. Il découpe son travail
 * en tranches qu'il enchaîne par `setTimeout` : avec une horloge en pause,
 * la première tranche attend indéfiniment. Mesuré : `axe.analyze()` n'a pas
 * rendu au bout de deux minutes sur V-21.
 *
 * La batterie établit donc l'état SOUS HORLOGE ARRÊTÉE — exactement comme le
 * banc, pour que l'état audité soit celui que le banc compare — puis REPREND
 * l'horloge juste avant `analyze()`. Le risque est nommé et mesuré, pas
 * ignoré : l'empreinte du document est relevée avant et après, et toute
 * divergence est portée en `instrument:dom-instable`. Une minuterie de
 * maquette qui se déclencherait pendant l'audit s'y verrait.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'USAGE
 *
 *   node verif/a11y.mjs                       les 41 vues, 409 couples
 *   node verif/a11y.mjs V-21 V-29             deux vues
 *   node verif/a11y.mjs V-40 --etats=d-simple un état
 *   node verif/a11y.mjs --fenetres=1440x900   une fenêtre
 *   node verif/a11y.mjs --cote=app            l'application seule — SANS
 *                                             classement, donc sans verdict
 *   node verif/a11y.mjs V-01 --sonde=contraste  la preuve que la batterie sait
 *                                               dire non ; code retour inversé
 *   node verif/a11y.mjs --concurrence=12      le nombre de pages en parallèle (défaut 8)
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES, vues } from './banc/inventaire.mjs';
import {
	fenetresDe,
	avancer,
	AVANCE_ETAT_MS,
	POINTEUR_AU_REPOS,
	retirerBlocsHorsProduit,
	AVANCE_CHARGEMENT_MS
} from './banc/conditions.mjs';
import { ouvrirPage, reglerPlanche } from './banc/capture.mjs';
import { reveler } from './banc/revelation.mjs';
import {
	adresseDeLEtat,
	declarationEtatDeZone,
	declarationRevelation,
	focalisationDeclaree,
	PREFIXE
} from './banc/mode-demo.mjs';
import {
	TAGS_VERDICT,
	TAGS_CONSTAT,
	REGLES_ECARTEES,
	PORTEE_DOCUMENT,
	CATALOGUE_SONDES,
	CATALOGUE_CONSTATS,
	CATALOGUE_INSTRUMENT,
	NON_COUVERTURE,
	installerSondes,
	classer,
	agreger,
	verdictDuCouple,
	confronterAuSeuil,
	estConstat,
	estInstrument
} from './a11y-sondes.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');
const SEUIL = join(racine, 'verif', 'references', 'a11y-seuil.json');

/* Les vues que P-06 nomme : cartographie, carte mentale, comparaison visuelle.
   La liste est DÉRIVÉE de `docs/routes.md` et rappelée ici pour que la sonde
   d'alternative textuelle sache où relever sa mesure. Elle ne décide d'aucun
   verdict : elle décide d'un CONSTAT. */
const VUES_P06 = ['V-16', 'V-19', 'V-20', 'V-21'];

/* ── Arguments ──────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
	const trouve = args.find((a) => a.startsWith(`--${nom}=`));
	return trouve ? trouve.slice(nom.length + 3) : defaut;
};
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const filtreEtats = option('etats') ? option('etats').split(',') : null;
const filtreFenetres = option('fenetres') ? option('fenetres').split(',') : null;
const cote = option('cote', 'deux');
const sonde = option('sonde');
const concurrence = Math.max(1, Number(option('concurrence', '8')));
const base = option('base');
const silencieux = args.includes('--silencieux');

if (!['deux', 'app', 'gel'].includes(cote)) {
	console.error(`test:a11y — côté « ${cote} » inconnu. Attendus : deux, app, gel.`);
	process.exit(2);
}
if (cote !== 'deux' && !sonde) {
	console.log(
		`\n  ⚠ --cote=${cote} : un seul côté est audité, le CLASSEMENT EN TROIS NATURES est\n` +
			'    donc suspendu et la batterie ne rend PAS de verdict. Ce régime sert au\n' +
			'    diagnostic, jamais à conclure : sans les deux côtés, rien ne distingue un\n' +
			'    défaut du gel d’un défaut du portage.\n'
	);
}

const SONDES_CONNUES = {
	contraste: {
		quoi: 'un texte à contraste 1,2:1 posé sur le candidat',
		regle_attendue: 'axe:color-contrast',
		poser: async (page) => {
			await page.evaluate(() => {
				const p = document.createElement('p');
				p.textContent = 'Sonde de contraste — cette ligne doit être relevée.';
				p.setAttribute('style', 'color:#dddddd;background:#ffffff;font-size:14px;padding:4px');
				document.body.appendChild(p);
			});
		}
	},
	alternative: {
		quoi: 'le nom accessible retiré du premier contenu graphique du candidat',
		regle_attendue: 'graphique:sans-alternative',
		poser: async (page) => {
			await page.evaluate(() => {
				const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				svg.setAttribute('width', '48');
				svg.setAttribute('height', '48');
				const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				r.setAttribute('width', '48');
				r.setAttribute('height', '48');
				svg.appendChild(r);
				document.body.appendChild(svg);
			});
		}
	},
	focus: {
		quoi: 'un bouton dont le style focalisé est identique à son style au repos',
		regle_attendue: 'focus:invisible',
		/* La perturbation POSE UN ÉLÉMENT, elle ne neutralise pas le focus de
		   toute la page. Une règle `*:focus { outline: none }` ne suffirait pas :
		   le socle marque aussi le focus par le fond et la bordure, si bien que
		   les deux empreintes resteraient différentes et la sonde ne mordrait
		   pas. C'est le piège P-5 de CLAUDE.md — une perturbation qui n'exerce
		   pas la règle qu'elle croit exercer. */
		poser: async (page) => {
			await page.addStyleTag({
				content:
					'[data-sonde-focus]:focus, [data-sonde-focus]:focus-visible { ' +
					'outline: none !important; box-shadow: none !important; }'
			});
			await page.evaluate(() => {
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = 'Sonde de focalisation';
				b.setAttribute('data-sonde-focus', '');
				b.setAttribute('style', 'all: unset; display: inline-block; padding: 4px');
				document.body.appendChild(b);
			});
		}
	},
	saut: {
		quoi: "la cible du lien d'évitement retirée du candidat",
		regle_attendue: 'saut:cible-inexistante',
		poser: async (page) => {
			await page.evaluate(() => {
				const a = document.querySelector('a[href^="#"]:not([href="#"])');
				if (!a) return;
				const cible = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
				if (cible) cible.removeAttribute('id');
			});
		}
	}
};

if (sonde && !SONDES_CONNUES[sonde]) {
	console.error(
		`test:a11y — sonde « ${sonde} » inconnue. Connues : ${Object.keys(SONDES_CONNUES).join(', ')}.`
	);
	process.exit(2);
}

/* ── L'inventaire des couples ───────────────────────────────────────────── */
const toutes = vues();
const cibles = demandees.length ? toutes.filter((v) => demandees.includes(v.vue)) : toutes;
if (demandees.length && cibles.length !== demandees.length) {
	console.error(`test:a11y — vue(s) inconnue(s) : ${demandees.join(', ')}`);
	process.exit(2);
}

/** @type {{vue: string, fichier: string, etat: object, fenetre: string, scenario: object}[]} */
const couples = [];
for (const { vue, fichier } of cibles) {
	const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${vue}.json`), 'utf8'));
	const fenetres = (filtreFenetres ?? fenetresDe(vue)).filter((f) => fenetresDe(vue).includes(f));
	const etats = scenario.etats.filter((e) => !filtreEtats || filtreEtats.includes(e.cle));
	for (const fenetre of fenetres) {
		for (const etat of etats) couples.push({ vue, fichier, etat, fenetre, scenario });
	}
}
if (couples.length === 0) {
	console.error('test:a11y — aucun couple à auditer avec ces filtres.');
	process.exit(2);
}

/* ── Le bandeau d'intégrité ─────────────────────────────────────────────── */
console.log('\n═══ pnpm test:a11y — batterie 10, accessibilité ═══\n');
console.log(`  ${cibles.length} vue(s) · ${couples.length} couple(s) « état × fenêtre »`);
console.log(`  côtés audités : ${cote === 'deux' ? 'gel ET application' : cote}`);
console.log(`  axe-core par @axe-core/playwright 4.13.0`);
console.log(`  étiquettes du verdict : ${TAGS_VERDICT.join(', ')}`);
console.log(`  étiquettes en constat : ${TAGS_CONSTAT.join(', ')} (jamais opposées)`);
console.log(`  sondes propres au dépôt : ${CATALOGUE_SONDES.length}`);
console.log(`  parallélisme : ${concurrence} page(s)`);
if (sonde) {
	console.log(
		`\n  ⚠ SONDE « ${sonde} » — ${SONDES_CONNUES[sonde].quoi}.\n` +
			`    Le code retour est INVERSÉ : la batterie doit nommer ` +
			`« ${SONDES_CONNUES[sonde].regle_attendue} »\n` +
			'    en nature « portage ». Un banc toujours vert ne prouve rien (RA-01).'
	);
}
console.log('');

/* ── Les serveurs ───────────────────────────────────────────────────────── */
const serveurGel = await servir(RACINE_MAQUETTES);
/** @type {{origine: string, fermer: () => Promise<void>} | null} */
let serveurApp = null;
if (cote !== 'gel') {
	if (base) {
		serveurApp = { origine: base.replace(/\/$/, ''), fermer: async () => {} };
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
			console.error('test:a11y — le serveur de développement n’a pas rendu d’adresse.');
			process.exit(2);
		}
		serveurApp = { origine, fermer: () => vite.close() };
	}
	const sonder = await fetch(`${serveurApp.origine}${PREFIXE}/`).catch(() => null);
	if (!sonder || !sonder.ok) {
		console.error(
			`\ntest:a11y — le mode démo ne répond pas sur ${serveurApp.origine}${PREFIXE}/.\n` +
				"  Sans lui, la batterie n'a aucun chemin vers un état côté application\n" +
				'  (ÉCART-011 É-1). Rien ne sera mesuré : refus.\n'
		);
		await serveurGel.fermer();
		await serveurApp.fermer();
		process.exit(2);
	}
	console.log(`  application : ${serveurApp.origine}`);
}
console.log(`  gel : ${serveurGel.origine}\n`);

/* ═══════════════════════════════════════════════════════════════════════════
   L'AUDIT D'UN CÔTÉ
   ═══════════════════════════════════════════════════════════════════════════ */

/** Le geste qui révèle une zone — repris de `verif/maquette.mjs`, à
 *  l'identique : le côté gel doit atteindre exactement l'état que le banc
 *  compare, sans quoi la batterie auditerait un autre écran. */
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

/**
 * Audite une page déjà posée dans son état, et rend ses constats.
 * @returns {Promise<{constats: object[], regles: object, attendus: number}>}
 */
async function auditerLaPage(page, { vue, etat }) {
	const constats = [];
	await page.evaluate(installerSondes);

	/* ── axe, sous horloge REPRISE — voir le bandeau ────────────────────── */
	const avant = await page.evaluate(() => window.__a11y.empreinteDocument());
	await page.clock.resume();
	const resultat = await new AxeBuilder({ page })
		.withTags([...TAGS_VERDICT, ...TAGS_CONSTAT])
		.disableRules(REGLES_ECARTEES.filter((r) => !r.active).map((r) => r.regle))
		.analyze();
	const apres = await page.evaluate(() => window.__a11y.empreinteDocument());
	if (avant !== apres) {
		constats.push({
			regle: 'instrument:dom-instable',
			signature: '(document)',
			detail: `${avant} → ${apres}`
		});
	}

	/* Le rapprochement des nœuds d'axe à la MÊME signature que les sondes :
	   c'est elle qui porte le classement en trois natures. */
	const selecteurDe = (n) => (Array.isArray(n.target[0]) ? n.target[0] : n.target).slice(-1)[0];
	const aRapprocher = [];
	for (const genre of ['violations', 'incomplete']) {
		for (const r of resultat[genre]) for (const n of r.nodes) aRapprocher.push(selecteurDe(n));
	}
	const signatures = aRapprocher.length
		? await page.evaluate((s) => window.__a11y.signaturesDe(s), aRapprocher)
		: [];
	let curseur = 0;

	const opposable = (regle) => regle.tags.some((t) => TAGS_VERDICT.includes(t));
	for (const r of resultat.violations) {
		for (const n of r.nodes) {
			const signature = signatures[curseur++];
			constats.push({
				regle: opposable(r) ? `axe:${r.id}` : `constat:axe-${r.id}`,
				signature,
				detail: (n.any?.[0]?.message ?? n.all?.[0]?.message ?? r.help).slice(0, 160),
				impact: n.impact ?? r.impact ?? ''
			});
		}
	}
	for (const r of resultat.incomplete) {
		for (const n of r.nodes) {
			const signature = signatures[curseur++];
			constats.push({
				regle: 'instrument:axe-indecidable',
				signature,
				detail: r.id,
				motif: (n.any?.[0]?.message ?? n.all?.[0]?.message ?? '').slice(0, 160)
			});
		}
	}

	/* Le relevé de couverture d'axe, règle par règle — c'est lui qui dira
	   quelles règles activées n'ont JAMAIS rencontré de nœud à juger. */
	const regles = {};
	for (const [genre, cle] of [
		['passes', 'passe'],
		['violations', 'viole'],
		['incomplete', 'indecis'],
		['inapplicable', 'inapplicable']
	]) {
		for (const r of resultat[genre]) {
			regles[r.id] = regles[r.id] ?? { passe: 0, viole: 0, indecis: 0, inapplicable: 0 };
			regles[r.id][cle] += 1;
		}
	}

	/* ── Les sondes de DOM — lecture seule ──────────────────────────────── */
	constats.push(...(await page.evaluate(() => window.__a11y.dom())));

	/* ── P-06 : la restitution textuelle, en CONSTAT ────────────────────── */
	if (VUES_P06.includes(vue)) {
		const alternatives = await page.evaluate(() => window.__a11y.alternativeTextuelle());
		for (const a of alternatives) {
			constats.push({
				regle: 'constat:alternative-textuelle',
				signature: a.signature,
				detail: `nom=${a.nom ? 'oui' : 'non'} restitution=${a.restitution ? 'oui' : 'non'}`
			});
		}
	}

	/* ── Le parcours au clavier — RG-M18-08 ─────────────────────────────── */
	/* LE FOCUS EST RELÂCHÉ AVANT L'INVENTAIRE, pas après : l'empreinte « au
	   repos » d'un élément qui porte déjà le focus est son empreinte FOCALISÉE,
	   et la sonde `focus:invisible` le comparerait à lui-même. Mesuré : 22 faux
	   positifs sur onze vues avant correction — tous des champs focalisés par
	   ÉCART-029 ou par le `showModal()` de la révélation. */
	await page.evaluate(() => window.__a11y.relacherFocus());
	const inventaire = await page.evaluate(() => window.__a11y.inventorier());
	const limite = Math.min(320, inventaire.attendus.length + 16);
	const atteints = [];
	const vus = new Set();
	/* LE PARCOURS DOIT BOUCLER, ET C'EST UN DÉFAUT QUE J'AI DÛ CORRIGER.
	   `blur()` vide `document.activeElement`, mais Chromium garde le POINT DE
	   DÉPART DE LA NAVIGATION SÉQUENTIELLE là où l'élément flouté se trouvait :
	   la première tabulation reprend au MILIEU du document, pas à son début.
	   Une boucle qui s'arrêterait au premier retour au corps déclarerait alors
	   « non atteignables » tous les éléments situés AVANT ce point — le lien
	   d'évitement en tête. Mesuré : 20 faux positifs par couple sur V-07, 30 sur
	   V-26, avant correction. On continue donc de tabuler après le retour au
	   corps — le parcours repart alors du début — et l'on ne s'arrête qu'au
	   premier élément DÉJÀ VU, ou après trois retours au corps consécutifs. */
	let corpsConsecutifs = 0;
	for (let i = 0; i < limite; i++) {
		await page.keyboard.press('Tab');
		const f = await page.evaluate(() => window.__a11y.focal());
		if (!f) {
			if (++corpsConsecutifs >= 3) break;
			continue;
		}
		corpsConsecutifs = 0;
		const cle = f.rang === null ? `s:${f.signature}` : `r:${f.rang}`;
		if (vus.has(cle)) break;
		vus.add(cle);
		atteints.push(f);
	}
	if (atteints.length >= limite && inventaire.attendus.length + 16 > 320) {
		constats.push({
			regle: 'instrument:parcours-tronque',
			signature: '(document)',
			detail: `${inventaire.attendus.length} interactifs, borne 320`
		});
	}

	const rangsAtteints = new Set(atteints.filter((a) => a.rang !== null).map((a) => a.rang));
	for (const a of inventaire.attendus) {
		if (!rangsAtteints.has(a.rang)) {
			constats.push({
				regle: 'clavier:action-non-atteignable',
				signature: a.signature,
				detail: ''
			});
		}
	}
	for (const f of atteints) {
		if (f.rang === null) {
			constats.push({
				regle: 'constat:focalisable-hors-inventaire',
				signature: f.signature,
				detail: ''
			});
			continue;
		}
		const attendu = inventaire.attendus[f.rang];
		if (attendu.dejaFocalise) {
			constats.push({
				regle: 'instrument:focus-deja-pose',
				signature: f.signature,
				detail: 'focus non relâchable : empreinte de repos indisponible'
			});
		} else if (attendu.repos === f.focalise) {
			constats.push({ regle: 'focus:invisible', signature: f.signature, detail: '' });
		}
		if (inventaire.modal && !f.dansPortee) {
			constats.push({ regle: 'superposition:fuite-du-focus', signature: f.signature, detail: '' });
		}
	}
	for (let i = 1; i < atteints.length; i++) {
		if (atteints[i - 1].y - atteints[i].y > 24) {
			constats.push({
				regle: 'constat:ordre-visuel-inverse',
				signature: atteints[i].signature,
				detail: `${atteints[i - 1].y} → ${atteints[i].y}`
			});
		}
	}
	await page.evaluate(() => window.__a11y.demarquer());

	/* ── Les superpositions — RG-M18-10. En dernier : la sonde d'échappement
	     ferme ce qu'elle mesure. ────────────────────────────────────────── */
	const superpositions = await page.evaluate(() => window.__a11y.superpositions());
	for (const s of superpositions) {
		if (s.natif && s.modal) continue;
		if (!s.natif && s.focalisables === 0) continue;
		constats.push({
			regle: 'superposition:sans-piege',
			signature: s.signature,
			detail: s.natif ? 'dialog non modal' : 'superposition non native',
			impact: 'serious'
		});
	}
	if (superpositions.some((s) => s.natif && s.modal)) {
		const arme = await page.evaluate(() => window.__a11y.armerRestitution());
		if (!arme.arme) {
			constats.push({
				regle: 'instrument:restitution-non-mesurable',
				signature: '(document)',
				detail: arme.motif
			});
		} else {
			await page.keyboard.press('Escape');
			const c = await page.evaluate(() => window.__a11y.constaterRestitution());
			if (!c.ferme) {
				constats.push({
					regle: 'superposition:sans-echappement',
					signature: '(superposition)',
					detail: ''
				});
			} else if (!c.rendu) {
				constats.push({
					regle: 'superposition:sans-restitution',
					signature: '(superposition)',
					detail: `focus rendu à ${c.actif}`
				});
			}
		}
	}

	return { constats, regles, attendus: inventaire.attendus.length, etat: etat.cle };
}

/* ── LA REPRISE, ET L'ÉCART QU'ELLE CONTOURNE SANS LE MASQUER ─────────────
   `verif/banc/conditions.mjs` installe l'horloge virtuelle puis la met en
   pause au MÊME instant : `install({ time: T })` la laisse COURIR jusqu'à ce
   que `pauseAt(T)` s'exécute. Sous charge parallèle, T est alors déjà passé et
   Playwright refuse — « Cannot fast-forward to the past ».

   Mesuré : 2 couples sur 409 à six pages en parallèle (V-23 `env-dialogue`,
   V-41 `pastilles`), jamais en séquentiel. C'est pourquoi le banc, qui est
   séquentiel, ne l'a jamais rencontré : le défaut est latent dans
   `conditions.mjs`, il ne mord que sur un instrument parallèle.

   Ce lot NE MODIFIE PAS `conditions.mjs` — écriture humaine seule, et corriger
   la course y changerait les conditions de capture de toutes les batteries.
   La batterie REJOUE donc le côté, trois fois au plus, et l'écart est déclaré
   au rapport de lot. Un couple qui échouerait encore reste « instrument » :
   la reprise ne fabrique pas de vert, elle absorbe une course connue. */
async function avecReprise(travail, essais = 3) {
	let derniere = null;
	for (let n = 0; n < essais; n++) {
		try {
			return await travail();
		} catch (erreur) {
			derniere = erreur;
			const message = String(erreur?.message ?? erreur);
			if (!message.includes('Cannot fast-forward to the past')) throw erreur;
			await new Promise((r) => setTimeout(r, 120 * (n + 1)));
		}
	}
	throw derniere;
}

/**
 * Ouvre un côté dans son état, puis l'audite.
 * @param {string} cible 'gel' ou 'app'
 */
async function auditerCote(navigateur, cible, couple) {
	const { vue, fichier, etat, fenetre, scenario } = couple;
	const app = cible === 'app';
	const adresse = app
		? `${serveurApp.origine}${adresseDeLEtat(vue, etat.cle, 'app', AVANCE_CHARGEMENT_MS)}`
		: `${serveurGel.origine}/${fichier}`;

	const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, fenetre);
	try {
		if (app && statut !== null && statut >= 400) {
			return {
				echec: `le mode démo a répondu ${statut}`,
				constats: [],
				regles: {},
				attendus: 0
			};
		}

		/* LE MÊME BUDGET D'HORLOGE DES DEUX CÔTÉS — la règle du banc, reprise
		   telle quelle : l'état audité doit être celui que `verif:maquette`
		   compare, sans quoi les deux batteries parleraient de deux écrans. */
		const regleLaPlanche = Boolean(etat.vecteur ?? scenario.defaut);
		if (app) {
			if (regleLaPlanche) await avancer(page, AVANCE_ETAT_MS);
			if (etat.zone?.declencheur) await avancer(page, AVANCE_ETAT_MS);
		} else {
			if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
			else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
			if (etat.zone?.declencheur) await actionnerDeclencheur(page, etat.zone.declencheur);
			// PLAN §4.2 — les blocs que la maquette DÉCLARE hors produit sont
			// retirés. Auditer la planche de revue reviendrait à opposer au gel
			// les défauts d'un outil de maquette qui n'est pas le produit.
			await retirerBlocsHorsProduit(page);
		}

		await reveler(page, declarationRevelation(vue), app ? 'application' : 'gel', {
			modaliteReference: etat.zone?.declencheur ? 'pointeur' : 'script'
		});
		const focal = focalisationDeclaree(vue, etat.cle);
		if (focal) {
			await page.evaluate((sel) => {
				const e = document.querySelector(sel);
				if (e && document.activeElement !== e) e.focus();
			}, focal);
		}

		if (sonde && app) await SONDES_CONNUES[sonde].poser(page);

		return await auditerLaPage(page, couple);
	} finally {
		await page.close().catch(() => {});
		await contexte.close().catch(() => {});
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   L'EXÉCUTION
   ═══════════════════════════════════════════════════════════════════════════ */
const debut = Date.now();
const navigateur = await chromium.launch();
const resultats = [];
const couvertureAxe = {};
let faits = 0;

function cumulerCouverture(regles) {
	for (const [id, c] of Object.entries(regles)) {
		couvertureAxe[id] = couvertureAxe[id] ?? { passe: 0, viole: 0, indecis: 0, inapplicable: 0 };
		for (const k of Object.keys(c)) couvertureAxe[id][k] += c[k];
	}
}

async function traiter(couple) {
	const ligne = {
		vue: couple.vue,
		etat: couple.etat.cle,
		libelle: couple.etat.libelle,
		fenetre: couple.fenetre,
		verdict: 'conforme',
		total: null,
		lignes: []
	};
	try {
		if (couple.etat.zone && cote !== 'gel' && !declarationEtatDeZone(couple.vue)) {
			// Le refus du banc, repris tel quel : un état de zone sans protocole
			// déclaré n'a aucun chemin côté application. Un vert muet vaudrait
			// moins qu'un refus (RA-01).
			throw new Error('état de zone sans protocole d’état de zone déclaré');
		}
		const gel =
			cote === 'app' ? null : await avecReprise(() => auditerCote(navigateur, 'gel', couple));
		const app =
			cote === 'gel' ? null : await avecReprise(() => auditerCote(navigateur, 'app', couple));
		for (const c of [gel, app]) if (c) cumulerCouverture(c.regles);
		if (gel?.echec || app?.echec) throw new Error(gel?.echec ?? app?.echec);

		ligne.attendus = { gel: gel?.attendus ?? null, app: app?.attendus ?? null };
		ligne.lignes =
			cote === 'deux'
				? classer(gel.constats, app.constats)
				: (gel ?? app).constats.map((c) => ({ ...c, nature: 'non-classe', occurrences: 1 }));
		ligne.total = agreger(ligne.lignes);
		ligne.verdict = cote === 'deux' ? verdictDuCouple(ligne.total) : 'non-classe';
	} catch (erreur) {
		ligne.verdict = 'instrument';
		ligne.lignes = [
			{
				regle: 'instrument:etat-inatteignable',
				signature: '(couple)',
				detail: String(erreur.message ?? erreur).slice(0, 200),
				nature: 'instrument',
				occurrences: 1
			}
		];
		ligne.total = agreger(ligne.lignes);
	}
	resultats.push(ligne);
	faits++;
	if (!silencieux && faits % 20 === 0) {
		process.stdout.write(`  … ${faits}/${couples.length} couples\n`);
	}
}

const file = [...couples];
await Promise.all(
	Array.from({ length: Math.min(concurrence, file.length) }, async () => {
		for (let c = file.shift(); c; c = file.shift()) await traiter(c);
	})
);
await navigateur.close();
await serveurGel.fermer();
if (serveurApp) await serveurApp.fermer();

/* ═══════════════════════════════════════════════════════════════════════════
   LE RAPPORT
   ═══════════════════════════════════════════════════════════════════════════ */
const duree = ((Date.now() - debut) / 1000).toFixed(1);
resultats.sort((a, b) =>
	a.vue === b.vue
		? a.fenetre === b.fenetre
			? a.etat.localeCompare(b.etat)
			: a.fenetre.localeCompare(b.fenetre)
		: a.vue.localeCompare(b.vue)
);

/** Toutes les lignes de tous les couples, aplaties. */
const toutesLignes = [];
for (const r of resultats) {
	for (const l of r.lignes) {
		toutesLignes.push({ ...l, vue: r.vue, etat: r.etat, fenetre: r.fenetre });
	}
}

const totalGlobal = agreger(toutesLignes);
const parVue = new Map();
for (const r of resultats) {
	const e = parVue.get(r.vue) ?? {
		vue: r.vue,
		couples: 0,
		conformes: 0,
		portage: 0,
		gel: 0,
		gelNonReporte: 0,
		instrument: 0,
		constat: 0
	};
	e.couples++;
	if (r.verdict === 'conforme') e.conformes++;
	e.portage += r.total.portage;
	e.gel += r.total.gel;
	e.gelNonReporte += r.total['gel-non-reporte'];
	e.instrument += r.total.instrument;
	e.constat += r.total.constat;
	parVue.set(r.vue, e);
}

/** Le regroupement par règle et par nature — le chiffre qui compte. */
const parRegle = new Map();
for (const l of toutesLignes) {
	const nature = estConstat(l.regle) ? 'constat' : estInstrument(l.regle) ? 'instrument' : l.nature;
	const k = `${nature} ${l.regle}`;
	const e = parRegle.get(k) ?? {
		nature,
		regle: l.regle,
		occurrences: 0,
		couples: new Set(),
		vues: new Set(),
		exemple: l.detail || l.signature
	};
	e.occurrences += l.occurrences;
	e.couples.add(`${l.vue}/${l.etat}@${l.fenetre}`);
	e.vues.add(l.vue);
	parRegle.set(k, e);
}
const rangees = [...parRegle.values()].sort(
	(a, b) => b.occurrences - a.occurrences || a.regle.localeCompare(b.regle)
);

const ligneRegle = (r) =>
	`    ${String(r.occurrences).padStart(6)}  ${r.regle.padEnd(38)} ` +
	`${String(r.vues.size).padStart(2)} vue(s), ${String(r.couples.size).padStart(3)} couple(s)`;

console.log(`\n─── Ce que la batterie a parcouru ───\n`);
console.log(`  ${resultats.length} couples audités en ${duree} s`);
if (cote === 'deux')
	console.log(`  ${resultats.length * 2} pages chargées — un gel, une application`);

if (cote === 'deux') {
	console.log(`\n─── Le verdict, par nature ───\n`);
	console.log(
		`    PORTAGE          ${String(totalGlobal.portage).padStart(6)}  ` +
			'— le code livré ; corrigeable par le lot de la vue'
	);
	console.log(
		`    GEL              ${String(totalGlobal.gel).padStart(6)}  ` +
			'— la maquette ; demande un REGEL, geste du commanditaire'
	);
	console.log(
		`    gel non reporté  ${String(totalGlobal['gel-non-reporte']).padStart(6)}  ` +
			"— présent au gel, absent de l'application : divergence"
	);
	console.log(
		`    instrument       ${String(totalGlobal.instrument).padStart(6)}  ` +
			'— la batterie ne tranche pas ; non opposable'
	);
	console.log(
		`    constat          ${String(totalGlobal.constat).padStart(6)}  ` + '— mesuré, jamais opposé'
	);

	const conformes = resultats.filter((r) => r.verdict === 'conforme').length;
	console.log(
		`\n    couples sans violation opposable : ${conformes} / ${resultats.length}` +
			` (${((conformes / resultats.length) * 100).toFixed(1)} %)`
	);
}

for (const nature of ['portage', 'gel', 'gel-non-reporte', 'instrument', 'constat']) {
	const lot = rangees.filter((r) => r.nature === nature);
	if (!lot.length) continue;
	const titres = {
		portage: 'PORTAGE — à corriger par le lot de la vue, sans toucher au gel',
		gel: 'GEL — à corriger par un REGEL arbitré ; aucun lot ne peut y toucher',
		'gel-non-reporte': 'GEL NON REPORTÉ — le gel le porte, l’application non',
		instrument: 'INSTRUMENT — ce que la batterie ne tranche pas',
		constat: 'CONSTATS — mesurés, jamais opposés',
		'non-classe': 'NON CLASSÉ — un seul côté audité'
	};
	console.log(`\n─── ${titres[nature] ?? nature} ───\n`);
	for (const r of lot) console.log(ligneRegle(r));
}
if (cote !== 'deux') {
	const lot = rangees.filter((r) => r.nature === 'non-classe');
	if (lot.length) {
		console.log(`\n─── NON CLASSÉ — un seul côté audité, aucun verdict ───\n`);
		for (const r of lot) console.log(ligneRegle(r));
	}
}

/* ── Les vues, une ligne chacune ────────────────────────────────────────── */
console.log(`\n─── Par vue ───\n`);
console.log('    vue     couples  sans viol.  portage      gel  non rep.  instrum.  constat');
for (const v of [...parVue.values()].sort((a, b) => a.vue.localeCompare(b.vue))) {
	console.log(
		`    ${v.vue}  ${String(v.couples).padStart(8)}  ${String(v.conformes).padStart(10)}  ` +
			`${String(v.portage).padStart(7)}  ${String(v.gel).padStart(7)}  ` +
			`${String(v.gelNonReporte).padStart(8)}  ${String(v.instrument).padStart(8)}  ` +
			`${String(v.constat).padStart(7)}`
	);
}

/* ── La couverture d'axe, mesurée ───────────────────────────────────────── */
const reglesJamaisExercees = Object.entries(couvertureAxe)
	.filter(([, c]) => c.passe === 0 && c.viole === 0 && c.indecis === 0)
	.map(([id]) => id)
	.sort();
const reglesExercees = Object.keys(couvertureAxe).length - reglesJamaisExercees.length;

console.log(`\n─── Ce que la batterie NE COUVRE PAS, mesuré ───\n`);
console.log(
	`  axe : ${Object.keys(couvertureAxe).length} règles activées, ` +
		`${reglesExercees} réellement exercées, ${reglesJamaisExercees.length} jamais applicables`
);
if (reglesJamaisExercees.length) {
	console.log(`  Règles activées qu'AUCUN couple n'a exercées — elles ne prouvent rien ici :`);
	for (let i = 0; i < reglesJamaisExercees.length; i += 4) {
		console.log(`    ${reglesJamaisExercees.slice(i, i + 4).join(', ')}`);
	}
}
console.log(`\n  Règles écartées, et leur motif :`);
for (const r of REGLES_ECARTEES) {
	console.log(`    ${r.active ? '(active)' : 'désactivée'} ${r.regle} — ${r.motif}`);
}

const indecisParRegle = new Map();
for (const l of toutesLignes) {
	if (l.regle !== 'instrument:axe-indecidable') continue;
	indecisParRegle.set(l.detail, (indecisParRegle.get(l.detail) ?? 0) + l.occurrences);
}
if (indecisParRegle.size) {
	console.log(`\n  Ce qu'axe REFUSE de trancher — la non-couverture, chiffrée :`);
	for (const [id, n] of [...indecisParRegle].sort((a, b) => b[1] - a[1])) {
		console.log(`    ${String(n).padStart(6)}  ${id}`);
	}
}

console.log(`\n  Les bornes déclarées de la batterie :`);
for (const nc of NON_COUVERTURE) {
	let chiffre = '';
	if (nc.mesure === 'axe:color-contrast/incomplete') {
		chiffre = ` — ${indecisParRegle.get('color-contrast') ?? 0} nœud(s)`;
	} else if (nc.mesure === 'couverture:couples') {
		chiffre = ` — ${resultats.length} couples parcourus`;
	} else if (nc.mesure) {
		const n = rangees.filter((r) => r.regle === nc.mesure).reduce((s, r) => s + r.occurrences, 0);
		chiffre = ` — ${n} relevé(s)`;
	}
	console.log(`    · ${nc.sujet}${chiffre}`);
}

/* ── Le seuil ───────────────────────────────────────────────────────────── */
const seuil = existsSync(SEUIL) ? JSON.parse(readFileSync(SEUIL, 'utf8')) : null;
const confrontation = cote === 'deux' ? confronterAuSeuil(toutesLignes, seuil) : null;

if (cote === 'deux') {
	console.log(`\n─── Le seuil ───\n`);
	if (!seuil) {
		console.log(
			`  Aucun seuil arbitré : ${SEUIL} n'existe pas.\n` +
				'  Le seuil implicite est ZÉRO — toute violation opposable fait échouer la\n' +
				'  batterie. C’est la position stricte, et elle reste la position par défaut :\n' +
				'  ce fichier est en ÉCRITURE HUMAINE SEULE, un agent ne se donne pas son seuil.'
		);
	} else {
		console.log(`  Seuil lu : ${SEUIL}`);
		for (const d of confrontation.depassements) {
			console.log(`    DÉPASSEMENT  ${d.cle} : ${d.mesure} mesuré, ${d.admis} admis (+${d.exces})`);
		}
		for (const r of confrontation.retombees) {
			console.log(`    retombée     ${r.cle} : ${r.mesure} mesuré, ${r.admis} admis — à resserrer`);
		}
		if (confrontation.tenu && !confrontation.retombees.length)
			console.log('    tenu, à l’unité près.');
	}
}

/* ── Le rapport écrit, et le seuil proposé ──────────────────────────────── */
mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
const seuilPropose = {
	_: [
		'SEUIL DE DÉPART PROPOSÉ par `pnpm test:a11y` — NON ARBITRÉ.',
		'',
		'Ce fichier est une PROPOSITION écrite dans verif/rapports/, qui est volatile.',
		'Il ne devient opposable que si un humain le recopie en',
		'verif/references/a11y-seuil.json — écriture humaine seule, au même titre que',
		'les tolérances, les masques et les zones comparées. Un agent qui se donnerait',
		'son propre seuil fabriquerait son verdict (PLAN §12, RA-01).',
		'',
		'Il porte un compte PAR RÈGLE ET PAR NATURE, jamais un compte global : un seuil',
		'global se remplirait de dettes nouvelles sans que rien ne le dise.',
		'',
		'Les lignes « portage/… » ne devraient jamais être admises : elles sont',
		'corrigeables par le lot de la vue. Les lignes « gel/… » demandent un regel.'
	],
	mesure_du: new Date().toISOString(),
	couples: resultats.length,
	admis: confrontation ? confrontation.mesure : {}
};
writeFileSync(
	join(DOSSIER_RAPPORTS, 'a11y-seuil-propose.json'),
	JSON.stringify(seuilPropose, null, '\t') + '\n'
);
writeFileSync(
	join(DOSSIER_RAPPORTS, 'a11y.json'),
	JSON.stringify(
		{
			mesure_du: new Date().toISOString(),
			duree_s: Number(duree),
			cote,
			sonde,
			couples: resultats.length,
			vues: cibles.length,
			tags_verdict: TAGS_VERDICT,
			tags_constat: TAGS_CONSTAT,
			regles_ecartees: REGLES_ECARTEES,
			portee_document: PORTEE_DOCUMENT,
			catalogue_sondes: CATALOGUE_SONDES,
			catalogue_constats: CATALOGUE_CONSTATS,
			catalogue_instrument: CATALOGUE_INSTRUMENT,
			non_couverture: NON_COUVERTURE,
			couverture_axe: couvertureAxe,
			regles_jamais_exercees: reglesJamaisExercees,
			total: totalGlobal,
			par_regle: rangees.map((r) => ({
				nature: r.nature,
				regle: r.regle,
				occurrences: r.occurrences,
				vues: [...r.vues].sort(),
				couples: r.couples.size,
				exemple: r.exemple
			})),
			par_couple: resultats
		},
		null,
		'\t'
	) + '\n'
);
console.log(`\n  Rapport : verif/rapports/a11y.json`);
console.log(`  Seuil proposé : verif/rapports/a11y-seuil-propose.json`);

/* ═══════════════════════════════════════════════════════════════════════════
   LE CODE RETOUR
   ═══════════════════════════════════════════════════════════════════════════ */
const instrumentEnPanne = resultats.filter((r) => r.verdict === 'instrument').length;

if (sonde) {
	const attendue = SONDES_CONNUES[sonde].regle_attendue;
	const trouve = toutesLignes.filter((l) => l.regle === attendue && l.nature === 'portage');
	const n = trouve.reduce((s, l) => s + l.occurrences, 0);
	console.log(`\n─── SONDE « ${sonde} » ───\n`);
	if (n > 0) {
		console.log(`  ✔ la batterie a nommé « ${attendue} » en nature PORTAGE, ${n} occurrence(s).`);
		console.log(`    Elle sait dire non, et elle sait dire d'où ça vient.`);
		process.exit(0);
	}
	console.error(
		`  ✘ la batterie N'A PAS nommé « ${attendue} » en nature portage.\n` +
			'    Une batterie qui ne sait pas dire non ne prouve rien de ses verts (RA-01).\n'
	);
	process.exit(1);
}

if (instrumentEnPanne) {
	console.error(
		`\n✘ ${instrumentEnPanne} couple(s) n'ont pas pu être audités — défaut d'instrument.\n` +
			'  Rien ne peut être conclu de leur silence.\n'
	);
	process.exit(2);
}

if (cote !== 'deux') {
	console.log(
		`\n  Régime --cote=${cote} : aucun verdict rendu, par construction. Code retour 0 ` +
			'ne vaut pas conformité.\n'
	);
	process.exit(0);
}

if (seuil) {
	if (confrontation.tenu) {
		console.log(`\n✔ batterie 10 — le seuil arbitré est tenu.\n`);
		process.exit(0);
	}
	console.error(`\n✘ batterie 10 — le seuil arbitré est dépassé.\n`);
	process.exit(1);
}

if (totalGlobal.portage === 0 && totalGlobal.gel === 0) {
	console.log(`\n✔ batterie 10 — aucune violation opposable sur ${resultats.length} couples.\n`);
	process.exit(0);
}

console.error(
	`\n✘ batterie 10 — ${totalGlobal.portage} violation(s) de PORTAGE et ` +
		`${totalGlobal.gel} de GEL sur ${resultats.length} couples.\n` +
		'  Les premières se corrigent dans un lot de vue ; les secondes demandent un\n' +
		'  regel arbitré et ne peuvent PAS être corrigées dans le code sans faire\n' +
		'  diverger la vue de sa maquette (CLAUDE.md §2, règle d’immutabilité).\n' +
		'  Le seuil de départ mesuré est proposé dans verif/rapports/a11y-seuil-propose.json.\n'
);
process.exit(1);
