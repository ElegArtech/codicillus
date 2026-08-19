#!/usr/bin/env node
/**
 * `pnpm test:impression` — batterie 15 du catalogue (PLAN-DE-REALISATION.md §5,
 * ligne 350) : « La lecture d'une note produit une impression sans navigation
 * ni panneaux, avec métadonnées de confiance et adresses des liens en note » —
 * `RG-M18-17`.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni
 * `verif/impression-regles.mjs`, ni `verif/references/`. La sortie légitime
 * d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA MESURE QUI A DÉCIDÉ DE LA FORME DE CETTE BATTERIE
 *
 * « Le gel porte-t-il seulement une règle `@media print` ? » — cherchée dans
 * les 41 maquettes et dans `src/socle.css` AVANT d'écrire une ligne.
 *
 *   mockups/V-14-lecture-note.html:1271     @media print { … }   7 déclarations
 *   mockups/V-03-lecture-publique.html:896  @media print { … }   6 déclarations
 *   src/socle.css                           AUCUNE
 *   les 39 autres maquettes                 AUCUNE
 *
 * Le gel EN PORTE. RG-M18-17 est donc tenue par quelqu'un, et la batterie
 * mesure la conformité du produit à cette règle — deux côtés audités. Si le
 * gel n'en avait porté aucune, la batterie aurait dû livrer rouge en nommant
 * les quatre exigences non tenues, sans écrire la feuille manquante : écrire
 * une feuille d'impression que le gel ne montre pas serait une décision de
 * conception, donc un défaut de contrat.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CHEMIN — celui du banc, et rien d'autre
 *
 * `verif/banc/serveur.mjs` pour le gel, le mode démo `/__design/V-xx?etat=…`
 * pour l'application, `ouvrirPage`, `reglerPlanche`, `retirerBlocsHorsProduit`
 * et les conditions de `verif/banc/conditions.mjs`. Une mesure prise dans
 * d'autres conditions dirait autre chose que ce que le banc mesure — et ce
 * serait un troisième dispositif à réconcilier, pas un instrument.
 *
 * `page.emulateMedia({ media: 'print' })` bascule la CASCADE en média
 * impression sans produire de PDF : le DOM reste interrogeable, et l'on peut
 * lire ce qui n'est plus rendu ET les valeurs de `content` des pseudo-éléments
 * — ce qu'un PDF interdirait.
 *
 * L'ORDRE COMPTE : l'état est posé D'ABORD, en média écran, exactement comme
 * le banc le pose ; le média n'est basculé qu'ensuite. Basculer avant
 * fausserait le réglage de la planche, dont les gestes dépendent du rendu.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'HORLOGE
 *
 * Elle reste ARRÊTÉE de bout en bout — la batterie n'appelle aucune analyse
 * asynchrone, donc rien ici ne réclame `clock.resume()` (P-15 ne mord pas).
 * P-14 mord en revanche : `conditions.mjs` installe puis met en pause au même
 * instant, et sous charge parallèle Playwright refuse « Cannot fast-forward to
 * the past ». Ce lot NE MODIFIE PAS `conditions.mjs` — écriture humaine seule.
 * La batterie REJOUE le côté, trois fois au plus, et l'écart est déclaré.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'USAGE
 *
 *   node verif/impression.mjs                      les 3 vues du périmètre
 *   node verif/impression.mjs V-14                 une vue
 *   node verif/impression.mjs V-14 --etats=op      un état
 *   node verif/impression.mjs --fenetres=1440x900  une fenêtre
 *   node verif/impression.mjs --cote=gel           un seul côté — SANS verdict
 *   node verif/impression.mjs --sonde=navigation   la preuve que la batterie
 *                                                  sait dire non ; code inversé
 *   node verif/impression.mjs --seuil-gel=N        le manque de GEL arbitré
 *   node verif/impression.mjs --concurrence=6      pages en parallèle (défaut 6)
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES } from './banc/inventaire.mjs';
import {
	fenetresDe,
	avancer,
	AVANCE_ETAT_MS,
	AVANCE_CHARGEMENT_MS,
	POINTEUR_AU_REPOS,
	retirerBlocsHorsProduit
} from './banc/conditions.mjs';
import { ouvrirPage, reglerPlanche } from './banc/capture.mjs';
import { adresseDeLEtat, declarationEtatDeZone, PREFIXE } from './banc/mode-demo.mjs';
import { classesDuGel } from './etats.mjs';
import {
	PERIMETRE,
	VUES_MESUREES,
	FAMILLES,
	famillesPour,
	HORS_REGLE,
	CATALOGUE_DEFAUTS,
	CATALOGUE_CONSTATS,
	CATALOGUE_INSTRUMENT,
	NON_COUVERTURE,
	porteUneAdresse,
	eprouverLesFamilles,
	constatsDuReleve,
	classer,
	agreger,
	verdictDuCouple,
	jumelages,
	estConstat,
	estDefaut,
	estInstrument
} from './impression-regles.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');

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
const concurrence = Math.max(1, Number(option('concurrence', '6')));
const base = option('base');
const silencieux = args.includes('--silencieux');
const seuilBrut = option('seuil-gel');
const seuilGel = seuilBrut === null ? null : Number(seuilBrut);

if (!['deux', 'app', 'gel'].includes(cote)) {
	console.error(`test:impression — côté « ${cote} » inconnu. Attendus : deux, app, gel.`);
	process.exit(2);
}
if (seuilGel !== null && !Number.isInteger(seuilGel)) {
	console.error('test:impression — `--seuil-gel=` attend un entier.');
	process.exit(2);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LES SONDES — la preuve que la batterie sait dire non (RA-01).

   Deux genres, et il en faut les deux.

   · QUATRE SONDES DE DÉFAUT perturbent le seul côté CANDIDAT et exigent que la
     batterie nomme la règle attendue en nature PORTAGE. Un banc toujours vert
     ne prouve rien.

   · DEUX SONDES DE CLÉ éprouvent la JOINTURE, dans les deux sens — la leçon
     d'ÉCART-041. Une jointure produit deux fautes symétriques : sur-rapprocher
     masque un défaut réel, sous-rapprocher en fabrique un faux. Les deux sont
     jouées, et elles n'attendent pas la même chose.
   ═════════════════════════════════════════════════════════════════════════ */

/** Force un élément à s'imprimer, ancêtres masqués compris. */
const FORCER = ([selecteur, ordinal]) => {
	const n = document.querySelectorAll(selecteur)[ordinal];
	if (!n) return false;
	for (let e = n; e && e !== document.documentElement; e = e.parentElement) {
		const s = getComputedStyle(e);
		if (s.display === 'none') e.style.setProperty('display', 'block', 'important');
		if (s.visibility === 'hidden') e.style.setProperty('visibility', 'visible', 'important');
	}
	n.style.setProperty('position', 'static', 'important');
	return true;
};

/** Insère des nœuds de texte blancs partout dans l'article — P-8, simulé. */
const BLANCHIR = () => {
	const art = document.querySelector('.article');
	if (!art) return false;
	for (const e of [...art.querySelectorAll('*')]) {
		e.parentNode.insertBefore(document.createTextNode(' '), e);
		if (e.nextSibling) e.parentNode.insertBefore(document.createTextNode(' '), e.nextSibling);
	}
	return true;
};

const SONDES = {
	navigation: {
		quoi: 'le rail de navigation forcé à s’imprimer sur le seul candidat',
		regle: 'impression:navigation-imprimee',
		attendu: 'portage',
		app: async (page) => {
			await page.evaluate(FORCER, ['.rail', 0]);
		}
	},
	panneau: {
		quoi: 'la colonne de panneaux latéraux forcée à s’imprimer sur le seul candidat',
		regle: 'impression:panneau-imprime',
		attendu: 'portage',
		app: async (page) => {
			await page.evaluate(FORCER, ['.panneaux', 0]);
		}
	},
	metadonnee: {
		quoi: 'le cartouche de confiance retiré de l’impression du seul candidat',
		regle: 'impression:metadonnee-absente',
		attendu: 'portage',
		app: async (page) => {
			await page.evaluate(() => {
				const c = document.querySelector('.cartouche');
				if (c) c.style.setProperty('display', 'none', 'important');
			});
		}
	},
	adresse: {
		/* LA PERTURBATION REND LA RÈGLE INERTE, ELLE NE SUPPRIME PAS LE LIEN.
		   Retirer le lien ferait disparaître le couple à juger ; ici le lien
		   reste, son adresse cesse d'être restituée. C'est P-5 : une sonde qui
		   n'exerce pas la règle qu'elle croit exercer ne prouve rien. */
		quoi: 'le contenu généré des liens externes ramené à sa forme d’écran',
		regle: 'impression:adresse-non-restituee',
		attendu: 'portage',
		app: async (page) => {
			await page.addStyleTag({
				content: '@media print { .lien-ext::after { content: " \\2197" !important; } }'
			});
		}
	},
	'cle-appariement': {
		/* CONTRÔLE POSITIF DE SUR-RAPPROCHEMENT — ÉCART-041.
		   Le MÊME défaut des deux côtés, plus l'asymétrie de blancs que le
		   compilateur Svelte produit (P-8). Une clé qui embarquerait du texte
		   rendrait ici deux lignes — un « portage » et un « gel non reporté ».
		   La clé de ce module ne contient aucun texte : elle doit rendre UNE
		   ligne, en nature « gel ». */
		quoi: 'le même défaut des deux côtés, avec des blancs en plus côté candidat',
		regle: 'impression:navigation-imprimee',
		attendu: 'gel',
		exigeZeroPortage: true,
		gel: async (page) => {
			await page.evaluate(FORCER, ['.rail', 0]);
		},
		app: async (page) => {
			await page.evaluate(FORCER, ['.rail', 0]);
			await page.evaluate(BLANCHIR);
		}
	},
	'cle-discrimination': {
		/* CONTRÔLE NÉGATIF DE SOUS-DISCRIMINATION — l'autre faute symétrique.
		   Deux défauts sur des ORDINAUX DIFFÉRENTS de la même famille : ils ne
		   doivent PAS se rapprocher. Une clé trop grossière — la règle seule,
		   ou la règle et la famille — les fondrait en un « gel » et masquerait
		   un défaut réel de portage. */
		quoi: 'un défaut sur le nav n° 0 côté gel, sur le nav n° 1 côté candidat',
		regle: 'impression:navigation-imprimee',
		attendu: 'portage',
		exigeGelNonReporte: true,
		exigeZeroGel: true,
		gel: async (page) => {
			await page.evaluate(FORCER, ['nav, [role="navigation"]', 0]);
		},
		app: async (page) => {
			await page.evaluate(FORCER, ['nav, [role="navigation"]', 1]);
		}
	}
};

if (sonde && !SONDES[sonde]) {
	console.error(
		`test:impression — sonde « ${sonde} » inconnue. Connues : ${Object.keys(SONDES).join(', ')}.`
	);
	process.exit(2);
}
if (sonde && cote !== 'deux') {
	console.error('test:impression — une sonde exige les deux côtés : le classement en dépend.');
	process.exit(2);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LE RELEVÉ, EXÉCUTÉ DANS LA PAGE

   Il ne DÉCIDE de rien : il rend des faits — ce qui a de l'encre, ce qui n'en
   a pas, ce que les pseudo-éléments engendrent. Les règles sont dérivées en
   Node, où elles sont éprouvables sans navigateur.
   ═════════════════════════════════════════════════════════════════════════ */

const RELEVER = ({ familles, horsRegle }) => {
	const imprime = (e) => {
		const s = getComputedStyle(e);
		if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
		const b = e.getBoundingClientRect();
		if (!(b.width > 0 && b.height > 0)) return false;
		// Hors page : une boîte au-dessus ou à gauche de la feuille n'a pas
		// d'encre. Sans cette clause, `.saut-contenu` (top: -60px) serait compté.
		return b.bottom > 0 && b.right > 0 && b.left < document.documentElement.scrollWidth;
	};
	const signature = (e) => {
		const c = e.getAttribute('class');
		return e.tagName.toLowerCase() + (c ? '.' + c.trim().split(/\s+/).join('.') : '');
	};

	const releve = { familles: [], horsRegle: [] };
	for (const f of familles) {
		const n = [...document.querySelectorAll(f.selecteur)];
		const rendus = [];
		for (let i = 0; i < n.length; i++) if (imprime(n[i])) rendus.push(i);
		releve.familles.push({
			famille: f.famille,
			exigence: f.exigence,
			partie: f.partie ?? null,
			sens: f.sens,
			total: n.length,
			rendus,
			signatures: Object.fromEntries(rendus.map((i) => [i, signature(n[i])]))
		});
	}
	for (const h of horsRegle) {
		const n = [...document.querySelectorAll(h.selecteur)];
		releve.horsRegle.push({
			famille: h.famille,
			total: n.length,
			rendus: n.filter(imprime).length
		});
	}

	/* LA LECTURE EST-ELLE IMPRIMÉE ? Définition mécanique : un `.article`
	   imprimé qui porte un `h1` imprimé. C'est elle qui décide si les exigences
	   de PRÉSENCE — métadonnées, adresses — ont un objet. Sur l'état
	   `etat-chargement` de V-14, l'esquisse rend un `.article` sans `h1` : il
	   n'y a rien à lire, donc rien que la règle puisse exiger. */
	const articles = [...document.querySelectorAll('.article')].filter(imprime);
	const titres = articles.flatMap((a) => [...a.querySelectorAll('h1')]).filter(imprime);
	releve.articles = articles.length;
	releve.titres = titres.length;
	releve.lecture = articles.length > 0 && titres.length > 0;

	/* Les liens du corps, avec le contenu ENGENDRÉ — `attr(href)` dans
	   `content` n'apparaît jamais dans `textContent`. */
	releve.liens = [];
	for (const a of articles) {
		for (const l of a.querySelectorAll('a')) {
			if (!imprime(l)) continue;
			const av = getComputedStyle(l, '::before').content;
			const ap = getComputedStyle(l, '::after').content;
			const brut = [av, ap].filter((x) => x && x !== 'none' && x !== 'normal').join(' ');
			releve.liens.push({
				href: l.getAttribute('href'),
				genere: brut.replace(/^"|"$/g, '').replace(/"/g, ''),
				signature: signature(l)
			});
		}
	}

	/* Ce qui EXERCE la règle des adresses : un lien qui en porte une. Le compte
	   est relevé dans la page, il n'est pas déduit du nombre de défauts — un
	   compteur de défauts à zéro ne distingue pas « conforme » de « jamais
	   sollicité » (P-5). */
	releve.liensExamines = releve.liens.length;

	/* Le CONSTAT de l'ajustement des couleurs — la jauge est peinte par des
	   fonds, et une imprimante qui ne les imprime pas la rend muette. */
	const jauge = document.querySelector('.cartouche .temoin__jauge i');
	releve.ajustementJauge = jauge
		? getComputedStyle(jauge).printColorAdjust || getComputedStyle(jauge).webkitPrintColorAdjust
		: null;

	/* Les règles `@page` et `@media print` que le document porte réellement. */
	let page = 0;
	let mediaPrint = 0;
	for (const f of document.styleSheets) {
		let regles;
		try {
			regles = f.cssRules;
		} catch {
			continue;
		}
		for (const r of regles) {
			if (r.constructor?.name === 'CSSPageRule') page++;
			if (r.media && /print/.test(r.conditionText ?? r.media.mediaText ?? '')) mediaPrint++;
		}
	}
	releve.reglesPage = page;
	releve.blocsMediaPrint = mediaPrint;
	return releve;
};

/* ── Le relevé d'écran : ce qui EXERCE la règle ──────────────────────────
   Une famille absente de l'écran ne prouve rien de son absence à l'impression.
   C'est P-5, et c'est pourquoi les deux médias sont relevés. */
const RELEVER_ECRAN = ({ familles }) => {
	const imprime = (e) => {
		const s = getComputedStyle(e);
		if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
		const b = e.getBoundingClientRect();
		if (!(b.width > 0 && b.height > 0)) return false;
		return b.bottom > 0 && b.right > 0 && b.left < document.documentElement.scrollWidth;
	};
	return familles.map((f) => ({
		famille: f.famille,
		total: document.querySelectorAll(f.selecteur).length,
		rendus: [...document.querySelectorAll(f.selecteur)].filter(imprime).length
	}));
};

/* ═══════════════════════════════════════════════════════════════════════════
   L'INVENTAIRE DES COUPLES
   ═══════════════════════════════════════════════════════════════════════════ */
const cibles = demandees.length ? demandees : VUES_MESUREES;
const inconnues = cibles.filter((v) => !VUES_MESUREES.includes(v));
if (inconnues.length) {
	console.error(
		`test:impression — vue(s) hors périmètre : ${inconnues.join(', ')}.\n` +
			`  Le périmètre est ${VUES_MESUREES.join(', ')} — cf. PERIMETRE dans\n` +
			'  verif/impression-regles.mjs, dérivé de docs/routes.md. Une vue s’y ajoute\n' +
			'  par arbitrage, jamais par argument de ligne de commande.'
	);
	process.exit(2);
}

const couples = [];
for (const vue of cibles) {
	const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${vue}.json`), 'utf8'));
	const toutes = fenetresDe(vue);
	const fenetres = (filtreFenetres ?? toutes).filter((f) => toutes.includes(f));
	const etats = scenario.etats.filter((e) => !filtreEtats || filtreEtats.includes(e.cle));
	for (const fenetre of fenetres)
		for (const etat of etats) couples.push({ vue, etat, fenetre, scenario });
}
if (couples.length === 0) {
	console.error('test:impression — aucun couple à auditer avec ces filtres.');
	process.exit(2);
}

/* ── L'ÉPREUVE DE LA TABLE, AVANT TOUTE MESURE — P-5, volet statique ────── */
const inertes = eprouverLesFamilles(classesDuGel());
if (inertes.length) {
	console.error(
		`\ntest:impression — ${inertes.length} famille(s) qu'AUCUNE classe du gel ne satisfait :\n` +
			`    ${inertes.join('\n    ')}\n` +
			'  Une famille inerte rend le même verdict qu’une famille qui marche : elle est\n' +
			'  espérée, pas posée (CLAUDE.md §6 P-5). Refus, avant toute mesure.\n'
	);
	process.exit(2);
}

/* ── Le bandeau d'intégrité ─────────────────────────────────────────────── */
console.log('\n═══ pnpm test:impression — batterie 15, RG-M18-17 ═══\n');
console.log(`  ${cibles.length} vue(s) · ${couples.length} couple(s) « état × fenêtre »`);
console.log(`  côtés audités : ${cote === 'deux' ? 'gel ET application' : cote}`);
console.log(`  familles déclarées : ${FAMILLES.length} · écartées : ${HORS_REGLE.length}`);
console.log(`  parallélisme : ${concurrence} page(s)`);
console.log('  périmètre :');
for (const p of PERIMETRE) {
	console.log(
		`    ${p.vue}  ${p.opposable ? 'OPPOSABLE ' : 'constat   '} ${p.quoi}\n           ${p.trace}`
	);
}
if (cote !== 'deux') {
	console.log(
		`\n  ⚠ --cote=${cote} : un seul côté audité, le CLASSEMENT EN NATURES est suspendu.\n` +
			'    Régime de diagnostic ; aucun verdict n’en sort.'
	);
}
if (sonde) {
	console.log(
		`\n  ⚠ SONDE « ${sonde} » — ${SONDES[sonde].quoi}.\n` +
			`    Code retour INVERSÉ : la batterie doit nommer « ${SONDES[sonde].regle} »\n` +
			`    en nature « ${SONDES[sonde].attendu} ». Un banc toujours vert ne prouve rien (RA-01).`
	);
}
console.log('');

/* ── Les serveurs ───────────────────────────────────────────────────────── */
const serveurGel = await servir(RACINE_MAQUETTES);
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
			console.error('test:impression — le serveur de développement n’a pas rendu d’adresse.');
			process.exit(2);
		}
		serveurApp = { origine, fermer: () => vite.close() };
	}
	const reponse = await fetch(`${serveurApp.origine}${PREFIXE}/`).catch(() => null);
	if (!reponse || !reponse.ok) {
		console.error(
			`\ntest:impression — le mode démo ne répond pas sur ${serveurApp.origine}${PREFIXE}/.\n` +
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
 * P-14 — la course de `conditions.mjs` entre `install()` et `pauseAt()`. Ce lot
 * ne modifie pas le fichier ; il rejoue, et il le déclare.
 */
let reprises = 0;
async function avecReprise(travail, essais = 3) {
	let derniere = null;
	for (let n = 0; n < essais; n++) {
		try {
			return await travail();
		} catch (erreur) {
			derniere = erreur;
			if (!String(erreur?.message ?? erreur).includes('Cannot fast-forward to the past'))
				throw erreur;
			await new Promise((r) => setTimeout(r, 120 * (n + 1)));
			reprises++;
		}
	}
	throw derniere;
}

const tablesParVue = new Map(
	VUES_MESUREES.map((v) => [
		v,
		{
			familles: famillesPour(v).map((f) => ({
				famille: f.famille,
				exigence: f.exigence,
				partie: f.partie ?? null,
				sens: f.sens,
				selecteur: f.selecteur
			})),
			horsRegle: HORS_REGLE.map((h) => ({ famille: h.famille, selecteur: h.selecteur }))
		}
	])
);

async function auditerCote(navigateur, cible, couple) {
	const { vue, etat, fenetre, scenario } = couple;
	const app = cible === 'app';
	const adresse = app
		? `${serveurApp.origine}${adresseDeLEtat(vue, etat.cle, 'app', AVANCE_CHARGEMENT_MS)}`
		: `${serveurGel.origine}/${scenario.maquette.replace(/^mockups\//, '')}`;

	const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, fenetre);
	try {
		if (app && statut !== null && statut >= 400) {
			return { echec: `le mode démo a répondu ${statut}` };
		}
		/* LE MÊME BUDGET D'HORLOGE DES DEUX CÔTÉS — la règle du banc, recopiée. */
		const regleLaPlanche = Boolean(etat.vecteur ?? scenario.defaut);
		if (app) {
			if (regleLaPlanche) await avancer(page, AVANCE_ETAT_MS);
			if (etat.zone?.declencheur) await avancer(page, AVANCE_ETAT_MS);
		} else {
			if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
			else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
			if (etat.zone?.declencheur) await actionnerDeclencheur(page, etat.zone.declencheur);
			await retirerBlocsHorsProduit(page);
		}

		/* L'écran D'ABORD — il dit ce que la règle d'impression EXERCE. */
		const tables = tablesParVue.get(vue);
		const ecran = await page.evaluate(RELEVER_ECRAN, tables);

		/* LA PERTURBATION EST POSÉE APRÈS LA BASCULE DE MÉDIA, ET C'EST UNE
		   CORRECTION MESURÉE. Posée avant, `FORCER` lisait le style d'ÉCRAN — où
		   le rail est visible — n'écrivait donc rien, et la règle d'impression le
		   masquait ensuite : les quatre sondes de structure rendaient un vert
		   silencieux. C'est P-5 sur la sonde elle-même — une perturbation qui
		   n'exerce pas la règle qu'elle croit exercer. */
		await page.emulateMedia({ media: 'print' });
		if (sonde && SONDES[sonde][cible]) await SONDES[sonde][cible](page);
		const releve = await page.evaluate(RELEVER, tables);
		return { releve, ecran, constats: constatsDuReleve(releve, vue) };
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
/** L'exercice de chaque famille, cumulé — le volet « à l'exécution » de P-5. */
const exercice = new Map(
	FAMILLES.map((f) => [f.famille, { rencontres: 0, exerces: 0, imprimes: 0 }])
);
/* Ce que le document porte réellement — relevé, jamais supposé. */
let reglesPageVues = 0;
let blocsMediaPrintVus = 0;
/* CE QUI EXERCE CHAQUE EXIGENCE — le compte de cas SOLLICITANTS, côté par côté.
   Un compteur de défauts à zéro ne distingue pas « la règle est tenue » de « la
   règle n'a jamais été sollicitée » : c'est P-5, et c'est la seule différence
   entre une batterie et un décor. */
const exerciceExigence = {
	navigation: 0,
	panneaux: 0,
	metadonnees: 0,
	adresses: 0
};
let faits = 0;

async function traiter(couple) {
	const ligne = {
		vue: couple.vue,
		etat: couple.etat.cle,
		libelle: couple.etat.libelle,
		fenetre: couple.fenetre,
		opposable: PERIMETRE.find((p) => p.vue === couple.vue).opposable,
		verdict: 'conforme',
		lignes: [],
		total: null
	};
	try {
		if (couple.etat.zone && cote !== 'gel' && !declarationEtatDeZone(couple.vue)) {
			throw new Error('état de zone sans protocole d’état de zone déclaré');
		}
		const gel =
			cote === 'app' ? null : await avecReprise(() => auditerCote(navigateur, 'gel', couple));
		const app =
			cote === 'gel' ? null : await avecReprise(() => auditerCote(navigateur, 'app', couple));
		if (gel?.echec || app?.echec) throw new Error(gel?.echec ?? app?.echec);

		for (const c of [gel, app]) {
			if (!c) continue;
			reglesPageVues += c.releve.reglesPage;
			blocsMediaPrintVus += c.releve.blocsMediaPrint;
			for (const f of c.releve.familles) {
				const e = exercice.get(f.famille);
				e.rencontres += f.total;
				e.imprimes += f.rendus.length;
			}
			for (const f of c.ecran) exercice.get(f.famille).exerces += f.rendus;
			for (const f of c.ecran) {
				const dec = FAMILLES.find((x) => x.famille === f.famille);
				if (dec?.sens === 'absent') exerciceExigence[dec.exigence] += f.rendus;
			}
			if (c.releve.lecture) exerciceExigence.metadonnees += 1;
			exerciceExigence.adresses += c.releve.liens.filter((l) => porteUneAdresse(l.href)).length;
		}
		ligne.lecture = { gel: gel?.releve.lecture ?? null, app: app?.releve.lecture ?? null };
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
				exigence: 'instrument',
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
	if (!silencieux && faits % 20 === 0) process.stdout.write(`  … ${faits}/${couples.length}\n`);
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

const toutesLignes = [];
for (const r of resultats) {
	for (const l of r.lignes) {
		toutesLignes.push({
			...l,
			vue: r.vue,
			etat: r.etat,
			fenetre: r.fenetre,
			opposable: r.opposable
		});
	}
}
/* LES LIGNES DE V-18 NE SONT PAS OPPOSÉES — elle est mesurée, jamais opposée.
   Le verdict se calcule sur les seules vues du périmètre opposable. */
const lignesOpposables = toutesLignes.filter((l) => l.opposable);
const totalGlobal = agreger(lignesOpposables);
const totalMesure = agreger(toutesLignes);

const parRegle = new Map();
for (const l of toutesLignes) {
	const nature = estConstat(l.regle) ? 'constat' : estInstrument(l.regle) ? 'instrument' : l.nature;
	const k = `${l.opposable ? 'O' : 'C'} ${nature} ${l.regle}`;
	const e = parRegle.get(k) ?? {
		nature,
		opposable: l.opposable,
		regle: l.regle,
		occurrences: 0,
		couples: new Set(),
		vues: new Set(),
		exemple: l.detail || l.signature || ''
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
	`    ${String(r.occurrences).padStart(6)}  ${r.regle.padEnd(42)} ` +
	`${[...r.vues].sort().join(' ').padEnd(16)} ${String(r.couples.size).padStart(3)} couple(s)` +
	(r.opposable ? '' : '   [non opposé]');

console.log(`\n─── Ce que la batterie a parcouru ───\n`);
console.log(`  ${resultats.length} couples audités en ${duree} s`);
if (cote === 'deux')
	console.log(`  ${resultats.length * 2} pages chargées — un gel, une application`);
if (reprises) console.log(`  ${reprises} reprise(s) sur la course d’horloge P-14`);
console.log(
	`  blocs @media print rencontrés : ${blocsMediaPrintVus} · règles @page : ${reglesPageVues}`
);

if (cote === 'deux') {
	console.log(`\n─── Le verdict, par nature — VUES OPPOSABLES SEULES ───\n`);
	const l = (nom, n, quoi) =>
		console.log(`    ${nom.padEnd(17)}${String(n).padStart(6)}  — ${quoi}`);
	l('PORTAGE', totalGlobal.portage, 'le code livré ; corrigeable par le lot de la vue');
	l('GEL', totalGlobal.gel, 'la maquette ; demande un REGEL, geste du commanditaire');
	l('gel non reporté', totalGlobal['gel-non-reporte'], 'présent au gel, absent de l’application');
	l('instrument', totalGlobal.instrument, 'la batterie ne tranche pas ; non opposable');
	l('constat', totalGlobal.constat, 'mesuré, jamais opposé');
	const opposables = resultats.filter((r) => r.opposable);
	const conformes = opposables.filter((r) => r.verdict === 'conforme').length;
	console.log(
		`\n    couples opposables sans défaut : ${conformes} / ${opposables.length}` +
			` (${((conformes / Math.max(1, opposables.length)) * 100).toFixed(1)} %)`
	);
	console.log(
		`    couples mesurés hors périmètre opposable : ${resultats.length - opposables.length}` +
			` — V-18, ${totalMesure.gel - totalGlobal.gel} défaut(s) relevé(s), aucun opposé`
	);
}

/* ── Les quatre exigences, séparément. Un vert global qui n'en distinguerait
      aucune ne dirait pas laquelle est tenue. ─────────────────────────────── */
console.log(`\n─── LES QUATRE EXIGENCES DE RG-M18-17, séparément ───\n`);
const EXIGENCES = [
	['navigation', 'sans navigation', 'impression:navigation-imprimee'],
	['panneaux', 'sans panneaux latéraux', 'impression:panneau-imprime'],
	['metadonnees', 'métadonnées de confiance', 'impression:metadonnee-absente'],
	['adresses', 'adresses des liens en note', 'impression:adresse-non-restituee']
];
console.log('    exigence                      portage      gel  non rep.   sollicitée par');
let exigenceInerte = 0;
for (const [cle, libelle, regle] of EXIGENCES) {
	const l = lignesOpposables.filter((x) => x.regle === regle);
	const n = (nat) => l.filter((x) => x.nature === nat).reduce((s, x) => s + x.occurrences, 0);
	const quoi = {
		navigation: 'élément(s) de navigation rendu(s) à l’écran',
		panneaux: 'panneau(x) rendu(s) à l’écran',
		metadonnees: 'relevé(s) où la lecture est imprimée',
		adresses: 'lien(s) porteur(s) d’une adresse'
	}[cle];
	if (exerciceExigence[cle] === 0) exigenceInerte++;
	console.log(
		`    ${libelle.padEnd(28)}${String(n('portage')).padStart(7)}  ` +
			`${String(n('gel')).padStart(7)}  ${String(n('gel-non-reporte')).padStart(8)}   ` +
			`${exerciceExigence[cle]} ${quoi}`
	);
}
console.log(
	'\n    UN ZÉRO DE DÉFAUT NE VAUT QUE PAR LA COLONNE DE DROITE : une exigence que\n' +
		'    rien ne sollicite rend le même zéro qu’une exigence tenue (P-5).'
);

for (const nature of ['portage', 'gel', 'gel-non-reporte', 'instrument', 'constat', 'non-classe']) {
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
	console.log(`\n─── ${titres[nature]} ───\n`);
	for (const r of lot) console.log(ligneRegle(r));
}

/* ── Le détail des défauts opposables : où, exactement ──────────────────── */
const defauts = lignesOpposables.filter(
	(l) => estDefaut(l.regle) && (l.nature === 'portage' || l.nature === 'gel')
);
if (defauts.length) {
	console.log(`\n─── Où, exactement ───\n`);
	const vus = new Set();
	for (const d of defauts) {
		const k = `${d.vue} ${d.regle} ${d.famille ?? d.partie ?? d.href ?? ''} ${d.ordinal}`;
		if (vus.has(k)) continue;
		vus.add(k);
		console.log(
			`    ${d.nature.padEnd(8)} ${d.vue}  ${d.regle}\n` +
				`             ${d.famille ?? d.partie ?? d.href ?? ''} n°${d.ordinal ?? '-'} · ${d.signature}` +
				(d.detail ? `\n             ${d.detail}` : '')
		);
	}
}

/* ── LE CONTRÔLE D'ÉCART-041, imprimé à chaque exécution ────────────────── */
const jum = jumelages(toutesLignes);
console.log(`\n─── La clé de rapprochement, contrôlée ───\n`);
console.log(
	`    portage opposable = ${jum.portage} | jumelés d'un gel-non-reporté = ${jum.jumeles}`
);
for (const d of jum.detail)
	console.log(`      ${d.regle} : ${d.portage} portage, ${d.jumeles} jumelés`);
console.log(
	'    Un jumelage systématique est la SIGNATURE d’une clé qui sur-discrimine\n' +
		'    (ÉCART-041 : 31 sur 31). La clé de cette batterie ne contient aucun texte ;\n' +
		'    les deux sens sont éprouvés par --sonde=cle-appariement et --sonde=cle-discrimination.'
);

/* ── L'EXERCICE DES FAMILLES — P-5, volet exécution ─────────────────────── */
console.log(`\n─── Ce que chaque famille a réellement exercé ───\n`);
console.log('    famille                             au DOM   à l’écran   à l’impression');
const jamaisRencontrees = [];
const jamaisExercees = [];
for (const [famille, e] of exercice) {
	console.log(
		`    ${famille.padEnd(34)}${String(e.rencontres).padStart(7)}${String(e.exerces).padStart(12)}` +
			`${String(e.imprimes).padStart(17)}`
	);
	if (e.rencontres === 0) jamaisRencontrees.push(famille);
	else if (e.exerces === 0) jamaisExercees.push(famille);
}
if (jamaisExercees.length) {
	console.log(
		`\n    ${jamaisExercees.length} famille(s) qu’AUCUN élément rendu à l’écran n’exerce — leur\n` +
			'    absence à l’impression ne prouve rien (P-5) :\n' +
			`      ${jamaisExercees.join(', ')}`
	);
}

/* ── Ce que la batterie ne couvre pas ───────────────────────────────────── */
const compte = (regle) =>
	toutesLignes.filter((l) => l.regle === regle).reduce((s, l) => s + l.occurrences, 0);
console.log(`\n─── Ce que la batterie NE COUVRE PAS, chiffré ───\n`);
for (const nc of NON_COUVERTURE) {
	let chiffre = '';
	if (nc.mesure === 'regles-page') chiffre = ` — ${reglesPageVues} règle(s) @page rencontrée(s)`;
	else if (nc.mesure === 'vues-hors-perimetre') chiffre = ` — ${41 - cibles.length} vue(s)`;
	else if (nc.mesure === 'etats-registre-operationnel') chiffre = ' — 0 état';
	else if (nc.mesure === 'boutons-imprimer') chiffre = ' — non mesuré, par construction';
	else if (nc.mesure) chiffre = ` — ${compte(nc.mesure)} relevé(s)`;
	console.log(`    · ${nc.sujet}${chiffre}\n`);
}
console.log('    Les familles ÉCARTÉES, et leur motif :');
for (const h of HORS_REGLE) console.log(`      ${h.famille} — ${h.motif}\n`);

/* ── Le rapport écrit ───────────────────────────────────────────────────── */
mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
const rapport = {
	mesure_du: new Date().toISOString(),
	duree_s: Number(duree),
	cote,
	sonde,
	couples: resultats.length,
	vues: cibles,
	perimetre: PERIMETRE,
	familles: FAMILLES.map((f) => ({
		exigence: f.exigence,
		sens: f.sens,
		famille: f.famille,
		selecteur: f.selecteur,
		structurel: Boolean(f.structurel),
		trace: f.trace,
		exercice: exercice.get(f.famille)
	})),
	hors_regle: HORS_REGLE,
	catalogue_defauts: CATALOGUE_DEFAUTS,
	catalogue_constats: CATALOGUE_CONSTATS,
	catalogue_instrument: CATALOGUE_INSTRUMENT,
	non_couverture: NON_COUVERTURE,
	jumelages: jum,
	total_opposable: totalGlobal,
	total_mesure: totalMesure,
	par_regle: rangees.map((r) => ({
		nature: r.nature,
		opposable: r.opposable,
		regle: r.regle,
		occurrences: r.occurrences,
		vues: [...r.vues].sort(),
		couples: r.couples.size
	})),
	par_couple: resultats
};
writeFileSync(
	join(DOSSIER_RAPPORTS, 'impression.json'),
	JSON.stringify(rapport, null, '\t') + '\n'
);
writeFileSync(
	join(DOSSIER_RAPPORTS, 'impression-seuil-propose.json'),
	JSON.stringify(
		{
			_: [
				'SEUIL DE DÉPART PROPOSÉ par `pnpm test:impression` — NON ARBITRÉ.',
				'',
				'Ce fichier est une PROPOSITION écrite dans verif/rapports/, qui est volatile.',
				'Il ne devient opposable que si un humain le porte au jalon de package.json',
				'sous la forme `--seuil-gel=N`. Un agent qui se donnerait son propre seuil',
				'fabriquerait son verdict (PLAN §12, RA-01).',
				'',
				'Le seuil ne couvre QUE la nature « gel » : un manque que la maquette porte et',
				'qu’aucun lot ne peut combler. Les lignes « portage » ne sont jamais admises —',
				'elles sont corrigeables par le lot de la vue.'
			],
			mesure_du: new Date().toISOString(),
			couples: resultats.length,
			seuil_gel_propose: totalGlobal.gel,
			detail: rangees
				.filter((r) => r.nature === 'gel' && r.opposable)
				.map((r) => ({ regle: r.regle, occurrences: r.occurrences, vues: [...r.vues].sort() }))
		},
		null,
		'\t'
	) + '\n'
);
console.log(`  Rapport : verif/rapports/impression.json`);
console.log(`  Seuil proposé : verif/rapports/impression-seuil-propose.json\n`);

/* ═══════════════════════════════════════════════════════════════════════════
   LE CODE RETOUR
   ═══════════════════════════════════════════════════════════════════════════ */
const enPanne = resultats.filter((r) => r.verdict === 'instrument').length;

if (sonde) {
	const s = SONDES[sonde];
	const n = (nat) =>
		toutesLignes
			.filter((l) => l.regle === s.regle && l.nature === nat)
			.reduce((somme, l) => somme + l.occurrences, 0);
	console.log(`─── SONDE « ${sonde} » ───\n`);
	console.log(
		`    ${s.regle} : portage=${n('portage')} gel=${n('gel')} gel-non-reporte=${n('gel-non-reporte')}`
	);
	const echecs = [];
	if (n(s.attendu) === 0) echecs.push(`aucune occurrence en nature « ${s.attendu} »`);
	if (s.exigeZeroPortage && n('portage') !== 0)
		echecs.push(`${n('portage')} portage alors que la clé doit RAPPROCHER les deux côtés`);
	if (s.exigeZeroGel && n('gel') !== 0)
		echecs.push(`${n('gel')} gel alors que la clé doit DISTINGUER les deux ordinaux`);
	if (s.exigeGelNonReporte && n('gel-non-reporte') === 0)
		echecs.push('aucun gel-non-reporté alors que le gel seul porte un défaut');
	if (echecs.length === 0) {
		console.log(`\n  ✔ la sonde « ${sonde} » est concluante.\n`);
		process.exit(0);
	}
	console.error(`\n  ✘ sonde « ${sonde} » NON concluante :\n    · ${echecs.join('\n    · ')}\n`);
	process.exit(1);
}

if (enPanne) {
	console.error(
		`\n✘ ${enPanne} couple(s) n'ont pas pu être audités — défaut d'instrument.\n` +
			'  Rien ne peut être conclu de leur silence.\n'
	);
	process.exit(2);
}
/* L'ÉPREUVE D'INERTIE À L'EXÉCUTION NE VAUT QUE SUR UN RELEVÉ COMPLET.
   `.aparte` n'existe que dans V-03, `.ref-panneau` que dans V-18 : sous filtre,
   « jamais rencontrée » ne dit rien de la famille, il dit que la vue qui la
   porte n'a pas été regardée. Refuser là-dessus ferait échouer tout diagnostic
   partiel — et un refus qu'on apprend à contourner ne protège plus rien. */
const releveComplet = !demandees.length && !filtreEtats && !filtreFenetres && cote === 'deux';
if (exigenceInerte && releveComplet) {
	console.error(
		`\n✘ ${exigenceInerte} exigence(s) de RG-M18-17 qu'AUCUN cas ne sollicite. Leur zéro de\n` +
			'  défaut ne prouve rien (P-5). Refus : mieux vaut pas de mesure qu’une fausse.\n'
	);
	process.exit(2);
}
if (jamaisRencontrees.length && releveComplet) {
	console.error(
		`\n✘ ${jamaisRencontrees.length} famille(s) qu'AUCUN élément du corpus mesuré ne satisfait :\n` +
			`    ${jamaisRencontrees.join(', ')}\n` +
			'  Une famille inerte rend le même verdict qu’une famille qui marche (P-5).\n'
	);
	process.exit(2);
}
if (jamaisRencontrees.length && !releveComplet) {
	console.log(
		`  ⚠ ${jamaisRencontrees.length} famille(s) non rencontrée(s) sous ce filtre — l'épreuve
` + `    d'inertie ne vaut que sur le relevé complet : ${jamaisRencontrees.join(', ')}\n`
	);
}
if (cote !== 'deux') {
	console.log(
		`\n  Régime --cote=${cote} : aucun verdict rendu, par construction. Code retour 0 ` +
			'ne vaut pas conformité.\n'
	);
	process.exit(0);
}

if (totalGlobal.portage === 0 && totalGlobal.gel === 0) {
	console.log(
		`\n✔ batterie 15 — les quatre exigences de RG-M18-17 sont tenues sur ` +
			`${resultats.filter((r) => r.opposable).length} couples opposables.\n`
	);
	process.exit(0);
}
if (totalGlobal.portage === 0 && seuilGel !== null && totalGlobal.gel <= seuilGel) {
	console.log(
		`\n✔ batterie 15 — aucun défaut de portage ; ${totalGlobal.gel} manque(s) de GEL,` +
			` seuil arbitré ${seuilGel}.\n`
	);
	if (totalGlobal.gel < seuilGel)
		console.log(
			`  SEUIL PÉRIMÉ — arbitré à ${seuilGel}, mesuré à ${totalGlobal.gel}. À resserrer.\n`
		);
	process.exit(0);
}
console.error(
	`\n✘ batterie 15 — ${totalGlobal.portage} défaut(s) de PORTAGE et ${totalGlobal.gel} de GEL` +
		` sur ${resultats.filter((r) => r.opposable).length} couples opposables.\n` +
		'  Les premiers se corrigent dans un lot de vue ; les seconds demandent un regel\n' +
		'  arbitré et ne peuvent PAS être corrigés dans le code sans faire diverger la vue\n' +
		'  de sa maquette (CLAUDE.md §2, règle d’immutabilité).\n' +
		'  Le seuil de départ mesuré est proposé dans verif/rapports/impression-seuil-propose.json.\n'
);
process.exit(1);
