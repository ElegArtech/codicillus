#!/usr/bin/env node
/**
 * releve-vues — le relevé mécanique des 41 maquettes gelées, vue par vue.
 *
 * INSTRUMENT DE LECTURE, écrit par le lot T-100. Il ne juge rien, ne sort
 * jamais en 1, et n'est branché sur aucune chaîne de vérification : il REND
 * LISIBLE ce que les maquettes gelées imposent, pour que les dix-sept lots de
 * vue suivants ne le découvrent pas un par un.
 *
 * POURQUOI IL EXISTE. Quatre vues ont coûté deux lots de production et cinq
 * lots correctifs, dont trois amendements du gabarit de coquille découverts
 * l'un après l'autre (ARB-015, ARB-019, ARB-020). Chacun a été relevé à la
 * main, sur la vue du moment. Ce script fait la même lecture sur les 41
 * fichiers d'un coup, et il se rejoue.
 *
 * IL NE LIT QUE `mockups/`, `verif/scenarios/` et `verif/references/`. Il
 * n'écrit rien. Aucun chiffre de `docs/releve-vues.md` n'est saisi à la main :
 * chacun sort d'ici, et la commande qui le régénère est citée à côté de lui.
 *
 * QUATRE FOIS DÉJÀ un chiffre transmis d'un rapport à un arbitrage s'est
 * révélé faux au recomptage (`ECART-010` É-3, `ECART-016` É-1, `ECART-018`
 * É-2, `ECART-021`). La règle du dossier est établie : un chiffre cité n'est
 * pas une source. Ce fichier est la source.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * COMMANDES
 *
 *   node verif/releve-vues.mjs                 le tableau de bord, 41 vues
 *   node verif/releve-vues.mjs V-14            la fiche d'une vue
 *   node verif/releve-vues.mjs --json          le relevé complet, exploitable
 *   node verif/releve-vues.mjs --gabarit       la liste close des amendements
 *   node verif/releve-vues.mjs --coquille      classe/id de main, évitement
 *   node verif/releve-vues.mjs --etats         le décompte d'états, scénarios
 *   node verif/releve-vues.mjs --pieges        les pièges connus, par vue
 *   node verif/releve-vues.mjs --hors-app      les nœuds hors de `div.app`
 *   node verif/releve-vues.mjs --restant       les 37 vues non livrées
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAQUETTES = join(RACINE, 'mockups');
const SCENARIOS = join(RACINE, 'verif', 'scenarios');

/** Les quatre vues livrées au 19 août 2026 — V-37, V-38, V-39, V-40. */
export const LIVREES = ['V-37', 'V-38', 'V-39', 'V-40'];

/**
 * Ce que `src/lib/coquille/Coquille.svelte` sait faire aujourd'hui, relevé sur
 * le gabarit REGELÉ après ARB-019. Tout ce qu'une maquette exige au-delà est
 * un amendement à faire, et c'est le propos de `--gabarit`.
 */
export const GABARIT = {
	/* Les attributs que le gabarit pose lui-même sur `div.app#app`. */
	attributsApp: ['class', 'id', 'data-rail', 'data-role', 'data-droits', 'data-contenu'],
	/* Les propriétés d'interface exposées par `Proprietes`. */
	proprietes: [
		'fil',
		'courant',
		'univers',
		'domaines',
		'notes',
		'compte',
		'version',
		'rail',
		'role',
		'droits',
		'brancheEnChargement',
		'notifications',
		'enfants',
		'contenu',
		'classeContenu',
		'idContenu',
		'cibleEvitement',
		'libelleEvitement'
	],
	/* Les enfants directs de `<body>` que le gabarit rend, dans cet ordre. */
	enfantsDeBody: ['a.saut-contenu', 'div.app', 'div.notifs'],
	/* Les blocs que le banc retire avant capture (`conditions.mjs`). */
	horsProduit: ['.planche', 'section.regles']
};

const VIDES = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

/* ── Lecture de bas niveau ────────────────────────────────────────────────
   Un analyseur minimal suffit, et il vaut mieux qu'une expression régulière
   sur les débuts de ligne : le contenu d'un `<pre>` porte des balises à la
   colonne 0, et une lecture naïve les prend pour des enfants de `<body>`
   (V-14, V-15, V-18 en portent quatre chacune). */

/** Les intervalles [début, fin[ des blocs `<script>` et `<style>`. */
function blocsOpaques(texte) {
	const zones = [];
	for (const nom of ['script', 'style']) {
		const ouvre = new RegExp(`<${nom}\\b[^>]*>`, 'gi');
		let m;
		while ((m = ouvre.exec(texte))) {
			const fin = texte.indexOf(`</${nom}>`, m.index + m[0].length);
			zones.push([m.index, fin === -1 ? texte.length : fin + nom.length + 3]);
		}
	}
	return zones;
}

function dansUneZone(zones, i) {
	return zones.some(([d, f]) => i >= d && i < f);
}

/**
 * Les attributs d'une balise ouvrante, dans l'ordre où elle les écrit.
 * Le nom de la balise est retiré d'abord : sans quoi il entre lui-même dans
 * la table, et `<body>` se relèverait comme portant un attribut `body`.
 */
export function attributsDe(balise) {
	const out = new Map();
	const corps = balise.replace(/^<\s*[a-zA-Z][a-zA-Z0-9-]*/, '').replace(/\/?>$/, '');
	for (const m of corps.matchAll(
		/([a-zA-Z-][a-zA-Z0-9:_.-]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g
	))
		out.set(m[1].toLowerCase(), m[3] ?? m[4] ?? m[5] ?? '');
	return out;
}

/** Une désignation courte et stable d'un nœud : `div.app`, `a.saut-contenu`. */
function designation(tag, attrs) {
	const classe = (attrs.get('class') ?? '').split(/\s+/).filter(Boolean)[0];
	return classe ? `${tag}.${classe}` : tag;
}

/**
 * Les enfants DIRECTS de `<body>`, avec leur balise et leurs attributs.
 * C'est la lecture qui dit ce que le gabarit devrait pouvoir rendre et ne
 * rend pas : `ECART-016` É-4 a été trouvé exactement ici, sur V-40.
 */
export function enfantsDeBody(texte) {
	const zones = blocsOpaques(texte);
	const ouvertureBody = /<body\b[^>]*>/i.exec(texte);
	if (!ouvertureBody) return [];
	const debut = ouvertureBody.index + ouvertureBody[0].length;
	const fin = texte.toLowerCase().indexOf('</body>');
	const portion = texte.slice(debut, fin === -1 ? texte.length : fin);
	const decalage = debut;

	const enfants = [];
	let profondeur = 0;
	for (const m of portion.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
		const absolu = decalage + m.index;
		if (dansUneZone(zones, absolu) && !/^(script|style)$/i.test(m[2])) continue;
		const fermante = m[1] === '/';
		const tag = m[2].toLowerCase();
		const auto = m[3].trimEnd().endsWith('/');
		if (fermante) {
			profondeur = Math.max(0, profondeur - 1);
			continue;
		}
		if (profondeur === 0) {
			const attrs = attributsDe(m[0]);
			enfants.push({
				tag,
				attrs,
				designation: designation(tag, attrs),
				ligne: ligneDe(texte, absolu)
			});
		}
		if (!VIDES.has(tag) && !auto) profondeur++;
	}
	return enfants;
}

export function ligneDe(texte, index) {
	let n = 1;
	for (let i = 0; i < index; i++) if (texte.charCodeAt(i) === 10) n++;
	return n;
}

/** Les deux blocs `<style>` d'une maquette : socle en ligne, puis feuille de vue. */
function blocsStyle(texte) {
	const out = [];
	for (const m of texte.matchAll(/<style\b[^>]*>/gi)) {
		const d = m.index + m[0].length;
		const f = texte.indexOf('</style>', d);
		out.push(texte.slice(d, f === -1 ? texte.length : f));
	}
	return out;
}

function blocsScript(texte) {
	const out = [];
	for (const m of texte.matchAll(/<script\b[^>]*>/gi)) {
		const d = m.index + m[0].length;
		const f = texte.indexOf('</script>', d);
		out.push(texte.slice(d, f === -1 ? texte.length : f));
	}
	return out;
}

/**
 * Le script, privé de ses commentaires.
 *
 * Indispensable, et découvert par l'erreur : les maquettes DOCUMENTENT l'appel
 * qu'elles font ensuite — `V-14:3814` porte, en commentaire, la ligne
 * « Chaque vue déclare son chemin : coquille({ fil: [...], courant: [...] }) ».
 * Une lecture qui garderait les commentaires relèverait ce gabarit-là au lieu
 * de l'appel réel, et rendrait un fil vide pour les 28 vues concernées.
 */
function sansCommentaires(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

/**
 * La valeur BRUTE d'une clé dans le corps d'un appel `coquille({ … })`.
 *
 * Brute, et non « littérale » : le fil de sept vues est une EXPRESSION —
 * `["Accueil", courant.univers, courant.nom]` (V-11:1944),
 * `["Accueil","Production", DOMAINE].concat(chemin)` (V-13:2033). Ne relever
 * que les chaînes entre guillemets rendrait « `["Accueil"]` » pour V-11, et
 * ferait écrire un contrat de tâche faux. Le lot lit l'expression.
 */
function valeurDe(source, cle) {
	const re = new RegExp(`(^|[\\{,\\s])${cle}\\s*:`);
	const m = re.exec(source);
	if (!m) return null;
	let i = m.index + m[0].length;
	let niveau = 0;
	let j = i;
	for (; j < source.length; j++) {
		const c = source[j];
		if ('[({'.includes(c)) niveau++;
		else if ('])}'.includes(c)) {
			if (niveau === 0) break;
			niveau--;
		} else if (c === ',' && niveau === 0) break;
	}
	return source.slice(i, j).replace(/\s+/g, ' ').trim() || null;
}

/** Les seules chaînes d'une expression — utile quand elle est littérale. */
function chainesDe(expression) {
	if (expression === null) return null;
	return [...expression.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
}

/**
 * Le sous-arbre d'un élément, repéré par sa balise ouvrante.
 * Sert à confronter la coquille de chaque maquette à celle de V-37 : le
 * gabarit rend un rail et une barre FIXES, et toute vue qui les modifie
 * exige de lui une propriété qu'il n'a pas.
 */
export function sousArbre(texte, ouverture) {
	const i = texte.indexOf(ouverture);
	if (i === -1) return null;
	const tag = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(ouverture)[1];
	let profondeur = 0;
	const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
	re.lastIndex = i;
	let m;
	while ((m = re.exec(texte))) {
		profondeur += m[1] ? -1 : 1;
		if (profondeur === 0) return texte.slice(i, m.index + m[0].length);
	}
	return null;
}

/** Normalisation : seule la substance est comparée, jamais l'indentation. */
export function normaliser(html) {
	return html
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.trim();
}

/* ── Le relevé d'une vue ──────────────────────────────────────────────────── */

export function maquettes() {
	return readdirSync(MAQUETTES)
		.filter((f) => /^V-\d\d-.*\.html$/.test(f))
		.sort()
		.map((f) => ({ vue: f.slice(0, 4), fichier: f, chemin: join(MAQUETTES, f) }));
}

export function relever(vue, fichier, chemin) {
	const texte = readFileSync(chemin, 'utf8');
	const enfants = enfantsDeBody(texte);
	const styles = blocsStyle(texte);
	const scripts = blocsScript(texte);
	const feuilleDeVue = styles[1] ?? '';
	const scriptBrut = scripts.join('\n');
	const scriptDeVue = sansCommentaires(scriptBrut);

	/* 1 — la coquille, et ce que la vue lui demande */
	const app = enfants.find((e) => (e.attrs.get('class') ?? '').split(/\s+/).includes('app'));
	const classesApp = app ? (app.attrs.get('class') ?? '').split(/\s+/).filter(Boolean) : [];
	const coquille = Boolean(app) && app.tag === 'div' && /<aside class="rail"/.test(texte);

	const attributsApp = app ? [...app.attrs.entries()].map(([k, v]) => ({ nom: k, valeur: v })) : [];
	const attributsAppInconnus = attributsApp.filter((a) => !GABARIT.attributsApp.includes(a.nom));

	/* 2 — `<main>` */
	const mMain = /<main\b([^>]*)>/i.exec(texte);
	const attrsMain = mMain ? attributsDe(`<main${mMain[1]}>`) : null;
	const main = mMain
		? {
				classe: attrsMain.get('class') ?? null,
				id: attrsMain.get('id') ?? null,
				autres: [...attrsMain.keys()].filter((k) => k !== 'class' && k !== 'id'),
				ligne: ligneDe(texte, mMain.index)
			}
		: null;

	/* 3 — le lien d'évitement */
	const mSaut = /<a class="saut-contenu" href="#([^"]*)"[^>]*>([^<]*)</.exec(texte);
	const evitement = mSaut
		? { cible: mSaut[1], libelle: mSaut[2].trim(), ligne: ligneDe(texte, mSaut.index) }
		: null;

	/* 4 — le `<body>` */
	const mBody = /<body\b([^>]*)>/i.exec(texte);
	const attributsBody = mBody
		? [...attributsDe(`<body${mBody[1]}>`).entries()].map(([k, v]) => ({ nom: k, valeur: v }))
		: [];

	/* 5 — fil d'Ariane et chemin courant, tels que la vue les déclare */
	const appels = [...scriptDeVue.matchAll(/coquille\(\s*\{([\s\S]*?)\}\s*\)/g)];
	const mCoquille = appels.length ? appels[appels.length - 1] : null;
	const filExpression = mCoquille ? valeurDe(mCoquille[1], 'fil') : null;
	const courantExpression = mCoquille ? valeurDe(mCoquille[1], 'courant') : null;
	const fil = chainesDe(filExpression);
	const courant = chainesDe(courantExpression);
	/* Un fil littéral se lit tel quel ; un fil calculé doit être lu à la source. */
	const filLitteral =
		filExpression !== null &&
		/^\[[^[\]]*\]$/.test(filExpression) &&
		!/[A-Za-z_$]/.test(filExpression.replace(/"[^"]*"|'[^']*'/g, ''));

	/* 6 — le rail */
	const rail = /<aside class="rail"/.test(texte);
	const entreesRail = [...texte.matchAll(/class="rail__lien([^"]*)"[^>]*data-vers="([^"]*)"/g)].map(
		(m) => ({ classes: m[1].trim(), vers: m[2] })
	);
	const railVersCetteVue = entreesRail.filter((e) => e.vers.includes(vue));

	/* 7 — les nœuds hors de `div.app`, que le gabarit ne sait pas placer */
	const horsApp = enfants
		.filter((e) => e !== app && e.tag !== 'script')
		.map((e) => ({ designation: e.designation, id: e.attrs.get('id') ?? null, ligne: e.ligne }));
	const horsAppNonGabarit = horsApp.filter(
		(e) => !GABARIT.enfantsDeBody.includes(e.designation) && e.designation !== 'div.planche'
	);

	/* 8 — les pièges connus, mesurés */
	const dialogues = [...texte.matchAll(/<dialog\b([^>]*)>/gi)].map((m) => {
		const a = attributsDe(`<dialog${m[1]}>`);
		return {
			classe: a.get('class') ?? null,
			id: a.get('id') ?? null,
			ligne: ligneDe(texte, m.index)
		};
	});
	const hrefs = [...texte.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
	const stylesEnLigne = [...texte.matchAll(/\sstyle="([^"]*)"/g)].length;
	const stylesParScript = [...scriptDeVue.matchAll(/\.style\.(cssText|[a-zA-Z]+)\s*=/g)].length;
	const fabriquesDeLargeur = [...scriptDeVue.matchAll(/\.style\.width\s*=/g)].length;
	const keyframes = [...feuilleDeVue.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
	const animations = [...feuilleDeVue.matchAll(/\banimation\s*:/g)].length;
	const autofocus = [...texte.matchAll(/\bautofocus\b/g)].length;
	const focus = [...scriptDeVue.matchAll(/\.focus\(\)/g)].length;
	const showModal = [...scriptDeVue.matchAll(/showModal\(\)/g)].length;
	const majAdresse = [...scriptDeVue.matchAll(/majAdresse\(([^)]*)\)/g)].map((m) => m[1].trim());
	/* Les clés de stockage local sont posées par une CONSTANTE, jamais en
	   ligne (`var CLE_RAIL = "codicillus.rail.deplies"`, V-37:3110) : on relève
	   donc les littéraux du préfixe du produit, et l'emploi de `localStorage`. */
	const stockageLocal = /localStorage/.test(scriptDeVue)
		? [...new Set([...scriptDeVue.matchAll(/["'](codicillus\.[\w.]+)["']/g)].map((m) => m[1]))]
		: [];
	const planche = /<div class="planche"/.test(texte);
	const sectionRegles = /<section class="regles"/.test(texte);
	const ulRegles = /<ul class="regles"/.test(texte);
	const palette = /id="palette"/.test(texte);
	const template = enfants.some((e) => e.tag === 'template');
	const graphe =
		/<svg[^>]*class="[^"]*(scene|zone-graphe)/.test(texte) || /class="zone-graphe"/.test(texte);

	/* 9 — la coquille rendue, pour confrontation au gabarit de V-37 */
	const barre = sousArbre(texte, '<header class="barre">');
	const railArbre = sousArbre(texte, '<aside class="rail" aria-label="Navigation principale">');
	const notifs = enfantsDeBody(texte).find((e) => e.designation === 'div.notifs');
	const altTexte = /class="alt-texte"/.test(texte);

	return {
		vue,
		fichier,
		lignes: texte.split('\n').length,
		livree: LIVREES.includes(vue),
		coquille,
		rail,
		app: app ? { classes: classesApp, attributs: attributsApp } : null,
		attributsAppInconnus,
		main,
		evitement,
		attributsBody,
		fil,
		filExpression,
		filLitteral,
		courant,
		courantExpression,
		entreesRail: entreesRail.map((e) => e.vers),
		entreesRailRestreintes: entreesRail
			.filter((e) => e.classes)
			.map((e) => `${e.vers} [${e.classes}]`),
		railDesigneCetteVue: railVersCetteVue.length > 0,
		horsApp,
		horsAppNonGabarit,
		dialogues,
		palette,
		template,
		hrefs: { total: hrefs.length, croisillon: hrefs.filter((h) => h === '#').length },
		stylesEnLigne,
		stylesParScript,
		fabriquesDeLargeur,
		keyframes,
		animations,
		autofocus,
		focus,
		showModal,
		majAdresse,
		stockageLocal,
		planche,
		sectionRegles,
		ulRegles,
		graphe,
		altTexte,
		classesDuGabaritSansRegle: /<aside class="rail"/.test(texte)
			? CLASSES_DU_GABARIT.filter((c) => !styles.join('\n').includes('.' + c))
			: null,
		barre: barre ? normaliser(barre) : null,
		railArbre: railArbre ? normaliser(railArbre) : null,
		notifsAttributs: notifs ? [...notifs.attrs.entries()].map(([k, v]) => `${k}="${v}"`) : null
	};
}

/* ── Les scénarios : le décompte d'états fait foi ─────────────────────────── */

export function scenarioDe(vue) {
	const chemin = join(SCENARIOS, `${vue}.json`);
	if (!existsSync(chemin)) return null;
	const s = JSON.parse(readFileSync(chemin, 'utf8'));
	const etats = s.etats ?? [];
	const dePlanche = etats.filter((e) => e.controle).length;
	const deZone = etats.filter((e) => e.zone).length;
	const aDeclencheur = etats.filter((e) => e.zone?.declencheur).length;
	const doublons = etats.filter((e) => e.identiqueA).length;
	return {
		vue,
		total: etats.length,
		dePlanche,
		deZone,
		nature: dePlanche && deZone ? 'mixte' : deZone ? 'zone' : 'planche',
		aDeclencheur,
		doublons,
		fenetres: s.fenetres ?? [],
		nbFenetres: (s.fenetres ?? []).length,
		couples: etats.length * (s.fenetres ?? []).length,
		planche: s.planche,
		zonesDeclarees: s.zones,
		routes: s.routes ?? [],
		cles: etats.map((e) => e.cle),
		selecteursDeZone: [...new Set(etats.filter((e) => e.zone).map((e) => e.zone.selecteur))]
	};
}

/* ── Les composants employés, croisés à l'inventaire fermé ────────────────
   Rien n'est recopié de `docs/DESIGN.md` : le croisement est fait par
   l'instrument qui TIENT ce document, `verif/inventaire-composants.mjs`, dont
   `--json` rend le relevé des 1 254 classes avec leur nature et leurs vues.
   Deux sources de vérité pour un même fait seraient deux occasions de
   diverger, et le §2.F l'interdit nommément. */

let cacheInventaire = null;

export function inventaire() {
	if (cacheInventaire) return cacheInventaire;
	const sortie = execFileSync(
		process.execPath,
		[join(RACINE, 'verif', 'inventaire-composants.mjs'), '--json'],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	cacheInventaire = JSON.parse(sortie);
	return cacheInventaire;
}

/** Les 66 noms de classe à définitions divergentes (§2.H), par vue. */
export function homonymes() {
	const sortie = execFileSync(
		process.execPath,
		[join(RACINE, 'verif', 'inventaire-composants.mjs'), '--homonymes'],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	const par = new Map();
	let courante = null;
	for (const ligne of sortie.split('\n')) {
		const m = /^\s{3}\.([\w-]+)\s+\[/.exec(ligne);
		if (m) {
			courante = m[1];
			continue;
		}
		const d = /diverge entre (.+)$/.exec(ligne);
		if (d && courante)
			for (const v of d[1].split(/,\s*/))
				if (/^V-\d\d$/.test(v)) {
					if (!par.has(v)) par.set(v, new Set());
					par.get(v).add('.' + courante);
				}
	}
	return par;
}

/** Les 92 emplois orphelins (§2.I), par vue. */
export function orphelines() {
	const sortie = execFileSync(
		process.execPath,
		[join(RACINE, 'verif', 'inventaire-composants.mjs'), '--orphelines'],
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	const par = new Map();
	for (const m of sortie.matchAll(/^\s+(V-\d\d)\s+(\.[\w-]+)/gm)) {
		if (!par.has(m[1])) par.set(m[1], []);
		par.get(m[1]).push(m[2]);
	}
	return par;
}

/** Le décompte de composants d'une vue : transverses, propres, hors produit. */
export function composantsDe(vue) {
	const inv = inventaire();
	const employees = inv.filter((c) => (c.vues ?? []).includes(vue));
	return {
		vue,
		total: employees.length,
		transverses: employees.filter((c) => c.nature === 'transverse').map((c) => c.classe),
		propres: employees.filter((c) => c.nature === 'propre').map((c) => c.classe),
		horsProduit: inv.filter((c) => (c.vuesHorsProduit ?? []).includes(vue)).map((c) => c.classe)
	};
}

/* ── Les deux formes de coquille du gel ───────────────────────────────────
   Le fait le plus lourd du relevé, et il n'était écrit nulle part : les 34
   maquettes à coquille n'en portent PAS une seule, elles en portent DEUX. La
   signature est calculée sur la barre entière et sur le rail privé de son
   arborescence — celle-ci varie par construction. */

const empreinte = (s) =>
	createHash('sha256')
		.update(s ?? '')
		.digest('hex')
		.slice(0, 8);

/** Le rail sans son arborescence : de la marque à la section « Outils ». */
export function railSansArborescence(rail) {
	if (!rail) return null;
	const i = rail.indexOf('Accueil</a></div>');
	const j = rail.indexOf('Outils');
	if (i === -1 || j === -1) return rail;
	return rail.slice(0, i + 17) + '⟨arborescence⟩' + rail.slice(j - 60);
}

/** Les formes distinctes de coquille, et les vues qui les portent. */
export function formesDeCoquille(releve) {
	const par = new Map();
	for (const v of releve) {
		if (!v.coquille) continue;
		const cle = empreinte(v.barre) + '/' + empreinte(railSansArborescence(v.railArbre));
		if (!par.has(cle)) par.set(cle, { cle, vues: [], modele: v });
		par.get(cle).vues.push(v.vue);
	}
	return [...par.values()].sort((a, b) => b.vues.length - a.vues.length);
}

/**
 * Les classes que le gabarit POSE et que les deux feuilles d'une vue ne
 * DÉCLARENT pas. Un nœud posé sans règle rend sans style : c'est le
 * mécanisme des 92 emplois orphelins du §2.I, appliqué au gabarit.
 */
export const CLASSES_DU_GABARIT = [
	'saut-contenu',
	'app',
	'cadre',
	'rail',
	'rail__marque',
	'rail__sceau',
	'rail__nom',
	'rail__section',
	'rail__titre',
	'rail__lien',
	'rail__pied',
	'rail__vide',
	'arbre',
	'noeud',
	'noeud__chevron',
	'noeud__nom',
	'noeud--courant',
	'noeud__rouet',
	'barre',
	'fil',
	'fil__courant',
	'recherche',
	'recherche__txt',
	'touche',
	'menu-barre',
	'menu-barre__liste',
	'menu-barre__entete',
	'menu-barre__nom',
	'menu-barre__role',
	'menu-barre__sep',
	'avatar',
	'notifs',
	'notif',
	'notif__marque',
	'notif__corps',
	'notif__titre',
	'notif__detail',
	'notif__fermer',
	'notif__progres',
	'notif__actions',
	'notif__rouet',
	'si-ecriture',
	'si-admin',
	'etiq'
];

export function classesDuGabaritSansRegle(vue, fichier) {
	const texte = readFileSync(join(MAQUETTES, fichier), 'utf8');
	const css = blocsStyle(texte).join('\n');
	return CLASSES_DU_GABARIT.filter((c) => !css.includes('.' + c));
}

/* ── L'assemblage ─────────────────────────────────────────────────────────── */

export function tout() {
	return maquettes().map(({ vue, fichier, chemin }) => ({
		...relever(vue, fichier, chemin),
		etats: scenarioDe(vue)
	}));
}

/* ── Les amendements du gabarit, liste close ──────────────────────────────── */

/**
 * LES NŒUDS HORS DE `div.app` QUI PORTENT UNE BOÎTE DE RENDU.
 *
 * Mesuré, pas déduit — et c'est tout l'intérêt : les 41 maquettes placent
 * 103 nœuds hors de `div.app`, et **neuf** seulement rendent quelque chose.
 * Les 94 autres sont des `<template>`, des `<dialog>` fermés et des blocs
 * masqués : ils ne peuvent pas déplacer un pixel, ni entrer dans l'instantané
 * ARIA. Les compter comme des manques du gabarit aurait fait ouvrir vingt-neuf
 * lots pour rien.
 *
 * Régénéré par : `node verif/releve-etats.mjs --incidence`
 */
/**
 * Les vues dont le rail rend AU MOINS UN NŒUD DÉPLIÉ, une fois la page
 * stabilisée. Le gel y écrit `aria-label="Replier {nom}"` (V-37:3203) ; le
 * gabarit écrit « Déplier » sans condition (`Rail.svelte`). C'est un nom
 * accessible, donc le niveau 1, qui est en échec sec.
 *
 * V-37 y échappe par accident : aucun de ses huit états ne déplie un nœud.
 *
 * Régénéré par : `node verif/releve-etats.mjs --json` (champ `ouverts` du rail)
 * ou par la sonde de rail du même instrument.
 */
export const RAIL_A_NOEUD_OUVERT = [
	'V-08',
	'V-10',
	'V-11',
	'V-12',
	'V-13',
	'V-14',
	'V-15',
	'V-16',
	'V-17',
	'V-18',
	'V-19',
	'V-20',
	'V-21',
	'V-22',
	'V-23',
	'V-24',
	'V-25',
	'V-26',
	'V-28',
	'V-29',
	'V-30',
	'V-31',
	'V-32',
	'V-33',
	'V-34',
	'V-35',
	'V-36'
];

export const HORS_APP_RENDUS = {
	'V-09': ['div.planche-vue'],
	'V-15': ['aside#tiroir.tiroir'],
	'V-23': ['dialog#dlg-signet.dlg.dlg--large.si-dialogue'],
	'V-27': ['aside#tiroir.tiroir-form'],
	'V-28': ['aside#tiroir.tiroir-form'],
	'V-29': ['aside#tiroir.tiroir-form'],
	'V-30': ['aside#tiroir.tiroir-form'],
	'V-31': ['aside#tiroir.tiroir-form'],
	'V-32': ['aside#tiroir.tiroir-form']
};

/**
 * Ce qu'une vue à coquille exige et que le gabarit ne sait pas faire.
 *
 * Regroupé par PROPRIÉTÉ à ajouter, non par occurrence : vingt-six attributs
 * de données distincts ne font pas vingt-six amendements, ils en font un —
 * « le gabarit transmet les attributs de données de la vue à `div.app` ». Le
 * détail des occurrences reste sous chaque ligne, avec ses vues.
 *
 * Chaque constat porte la ligne de maquette qui l'atteste : c'est la
 * discipline d'ARB-020 point 1 — la ligne du gel est citée, ou il n'y a rien.
 */
export function amendements(releve) {
	const par = new Map();
	const ajouter = (cle, vue, atteste) => {
		if (!par.has(cle)) par.set(cle, { cle, vues: [], attestations: [] });
		const e = par.get(cle);
		if (!e.vues.includes(vue)) e.vues.push(vue);
		if (atteste) e.attestations.push(atteste);
	};

	const formes = formesDeCoquille(releve.filter((v) => v.coquille));
	const abregee = formes.length > 1 ? new Set(formes[0].vues) : new Set();

	for (const v of releve) {
		if (!v.coquille) continue;

		/* 1 — la forme de coquille */
		if (abregee.has(v.vue)) ajouter('coquille de forme abrégée', v.vue, `${v.vue} rail+barre`);

		/* 2 — les attributs de données de `div.app` */
		for (const a of v.attributsAppInconnus)
			ajouter('attributs de données sur `div.app`', v.vue, `${v.vue} ${a.nom}="${a.valeur}"`);

		/* 3 — l'entrée de rail courante */
		if (
			/aria-current="page"/.test(v.railArbre ?? '') &&
			!/noeud__nom[^>]*aria-current/.test(v.railArbre ?? '')
		)
			ajouter(
				'entrée de rail marquée « page courante »',
				v.vue,
				`${v.vue} rail__lien[aria-current]`
			);

		/* 4 — les superpositions rendues hors de `div.app`, MESURÉES */
		for (const n of HORS_APP_RENDUS[v.vue] ?? [])
			ajouter('superposition rendue hors de `div.app`', v.vue, `${v.vue} ${n}`);

		/* 5 — le libellé du chevron d'arborescence.
		   Le balisage l'atteste pour les 26 vues à rail statique ; pour les
		   vues à rail construit par script, c'est le RENDU qui le dit — d'où
		   `RAIL_A_NOEUD_OUVERT`, mesuré. */
		if (/aria-label="Replier /.test(v.railArbre ?? '') || RAIL_A_NOEUD_OUVERT.includes(v.vue))
			ajouter('libellé du chevron : « Replier » quand le nœud est ouvert', v.vue, `${v.vue} rail`);

		/* 6 — `<main>` porteur d'attributs que le gabarit ne pose pas */
		if (v.main && v.main.autres.length)
			ajouter(`\`<main>\` porte ${v.main.autres.join(', ')}`, v.vue, `${v.vue}:${v.main.ligne}`);
		if (!v.main) ajouter('aucun `<main>`', v.vue, `${v.vue}`);
	}
	return [...par.values()].sort(
		(a, b) => b.vues.length - a.vues.length || a.cle.localeCompare(b.cle)
	);
}

/* ── Sorties ──────────────────────────────────────────────────────────────── */

/* Le module est importable sans rien exécuter : le relevé sert aussi de
   bibliothèque à d'autres instruments. */
const enLigneDeCommande = process.argv[1] && process.argv[1].endsWith('releve-vues.mjs');

const args = process.argv.slice(2);
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const restant = args.includes('--restant');
let releve = tout();
if (demandees.length) releve = releve.filter((v) => demandees.includes(v.vue));
else if (restant) releve = releve.filter((v) => !v.livree);

const col = (s, n) => String(s ?? '').padEnd(n);
const num = (s, n) => String(s ?? '').padStart(n);

function tableauCoquille() {
	console.log('  vue    coq  main.class          main.id   évitement (cible / libellé)');
	for (const v of releve) {
		console.log(
			`  ${col(v.vue, 6)} ${col(v.coquille ? 'oui' : '—', 4)} ${col(v.main?.classe ?? '—', 19)} ` +
				`${col(v.main?.id ?? '—', 9)} ${col('#' + (v.evitement?.cible ?? '—'), 16)} ${v.evitement?.libelle ?? '—'}`
		);
	}
}

function tableauEtats() {
	console.log('  vue    états  planche  zone  nature  fen  couples  déclencheurs  doublons');
	let t = 0,
		c = 0;
	for (const v of releve) {
		const e = v.etats;
		if (!e) continue;
		t += e.total;
		c += e.couples;
		console.log(
			`  ${col(v.vue, 6)} ${num(e.total, 5)} ${num(e.dePlanche, 8)} ${num(e.deZone, 5)}  ${col(e.nature, 7)} ${num(e.nbFenetres, 3)} ${num(e.couples, 8)} ${num(e.aDeclencheur, 13)} ${num(e.doublons, 9)}`
		);
	}
	console.log(`\n  total   ${num(t, 4)} états, ${c} couples de captures`);
}

function tableauPieges() {
	console.log(
		'  vue    style=  .style=  width=  keyfr  anim  dialog  showModal  focus  href#/tot  stockage'
	);
	for (const v of releve) {
		console.log(
			`  ${col(v.vue, 6)} ${num(v.stylesEnLigne, 6)} ${num(v.stylesParScript, 8)} ${num(v.fabriquesDeLargeur, 7)} ${num(v.keyframes.length, 6)} ${num(v.animations, 5)} ${num(v.dialogues.length, 7)} ${num(v.showModal, 10)} ${num(v.focus, 6)} ${num(v.hrefs.croisillon + '/' + v.hrefs.total, 10)}  ${v.stockageLocal.join(' ') || '—'}`
		);
	}
}

function tableauHorsApp() {
	for (const v of releve) {
		if (!v.horsAppNonGabarit.length) continue;
		console.log(
			`  ${v.vue}  ${v.horsAppNonGabarit.map((e) => `${e.designation}@${e.ligne}`).join('  ')}`
		);
	}
}

function tableauGabarit() {
	const a = amendements(releve);
	console.log(`  ${a.length} amendement(s) du gabarit exigé(s) par ce périmètre\n`);
	for (const e of a) {
		console.log(`  ${col(e.cle, 46)} ${num(e.vues.length, 3)} vue(s)  ${e.vues.join(' ')}`);
	}
}

function fiche(v) {
	console.log(`\n═══ ${v.vue} — ${v.fichier} (${v.lignes} lignes)${v.livree ? '  [LIVRÉE]' : ''}`);
	console.log(`  coquille          ${v.coquille ? 'oui' : 'non'}   rail ${v.rail ? 'oui' : 'non'}`);
	if (v.app) {
		console.log(`  div.app classes   ${v.app.classes.join(' ')}`);
		console.log(
			`  div.app attributs ${v.app.attributs.map((a) => `${a.nom}="${a.valeur}"`).join(' ')}`
		);
		if (v.attributsAppInconnus.length)
			console.log(`  ↳ HORS GABARIT    ${v.attributsAppInconnus.map((a) => a.nom).join(' ')}`);
	}
	console.log(
		`  <body>            ${v.attributsBody.map((a) => `${a.nom}="${a.valeur}"`).join(' ') || '—'}`
	);
	console.log(
		`  <main>            class="${v.main?.classe ?? '—'}" id="${v.main?.id ?? '—'}"${v.main?.autres.length ? ' + ' + v.main.autres.join(',') : ''}`
	);
	console.log(
		`  évitement         #${v.evitement?.cible ?? '—'} « ${v.evitement?.libelle ?? '—'} »`
	);
	console.log(
		`  fil               ${v.filExpression ?? '—'}${v.filLitteral ? '' : '   ⟨calculé — à lire à la source⟩'}`
	);
	console.log(`  courant           ${v.courantExpression ?? '—'}`);
	console.log(`  rail → cette vue  ${v.railDesigneCetteVue ? 'oui' : 'non'}`);
	console.log(
		`  hors div.app      ${v.horsApp.map((e) => `${e.designation}@${e.ligne}`).join('  ') || '—'}`
	);
	if (v.horsAppNonGabarit.length)
		console.log(`  ↳ HORS GABARIT    ${v.horsAppNonGabarit.map((e) => e.designation).join('  ')}`);
	console.log(
		`  dialogues         ${v.dialogues.length}${v.dialogues.length ? ' — ' + v.dialogues.map((d) => d.id ?? d.classe).join(' ') : ''}`
	);
	console.log(
		`  palette V-09      ${v.palette ? 'oui' : 'non'}   template ${v.template ? 'oui' : 'non'}`
	);
	console.log(
		`  styles en ligne   ${v.stylesEnLigne} au balisage, ${v.stylesParScript} par script (dont ${v.fabriquesDeLargeur} largeurs)`
	);
	console.log(
		`  animations        ${v.keyframes.length} @keyframes (${v.keyframes.join(' ') || '—'}), ${v.animations} déclarations`
	);
	console.log(
		`  focalisation      ${v.autofocus} autofocus, ${v.focus} .focus(), ${v.showModal} showModal()`
	);
	console.log(`  adresse           ${v.majAdresse.join(' | ') || '—'}`);
	console.log(`  stockage local    ${v.stockageLocal.join(' ') || '—'}`);
	console.log(`  href              ${v.hrefs.croisillon}/${v.hrefs.total} valent "#"`);
	console.log(
		`  hors produit      planche ${v.planche ? 'oui' : 'non'}, section.regles ${v.sectionRegles ? 'oui' : 'non'}, ul.regles ${v.ulRegles ? 'oui' : 'non'}`
	);
	const e = v.etats;
	if (e)
		console.log(
			`  états             ${e.total} (${e.dePlanche} de planche, ${e.deZone} de zone — ${e.nature}), ` +
				`${e.nbFenetres} fenêtre(s), ${e.couples} couples, ${e.aDeclencheur} à déclencheur, ${e.doublons} doublon(s)`
		);
	if (e?.selecteursDeZone.length)
		console.log(`  sélecteurs de zone ${e.selecteursDeZone.join('  ')}`);
	if (e?.routes.length) console.log(`  routes            ${e.routes.join('  ')}`);
}

/**
 * La confrontation de chaque coquille à celle de V-37.
 *
 * Le rail est comparé HORS de `#rail-univers` : son contenu est dérivé du
 * corpus, il varie légitimement d'une vue à l'autre. Tout le reste — marque,
 * entrée Accueil, section Outils, section Gestion, pied — est fixe au gel, et
 * une divergence y est une propriété que le gabarit devra exposer.
 */
function tableauCoquilleDiff() {
	const toutes = tout();
	const ref = toutes.find((v) => v.vue === 'V-37');
	const sansUnivers = (s) =>
		s
			? s.replace(
					/<div id="rail-univers">[\s\S]*?<div class="rail__section"><div class="rail__titre etiq">Outils/,
					'<div id="rail-univers">…<div class="rail__section"><div class="rail__titre etiq">Outils'
				)
			: null;
	const filDe = (s) =>
		s
			? s.replace(/<nav class="fil" id="fil"[^>]*>[\s\S]*?<\/nav>/, '<nav class="fil">…</nav>')
			: null;
	console.log('  vue    header.barre   aside.rail (hors #rail-univers)');
	for (const v of releve) {
		if (!v.coquille) {
			console.log(`  ${col(v.vue, 6)} ${col('—', 14)} —`);
			continue;
		}
		const b = filDe(v.barre) === filDe(ref.barre) ? 'identique' : 'DIVERGE';
		const r = sansUnivers(v.railArbre) === sansUnivers(ref.railArbre) ? 'identique' : 'DIVERGE';
		console.log(`  ${col(v.vue, 6)} ${col(b, 14)} ${r}`);
	}
}

function tableauComposants() {
	const hom = homonymes();
	const orph = orphelines();
	console.log('  vue    classes  transverses  propres  hors-prod  homonymes §2.H  orphelines §2.I');
	for (const v of releve) {
		const c = composantsDe(v.vue);
		console.log(
			`  ${col(v.vue, 6)} ${num(c.total, 7)} ${num(c.transverses.length, 12)} ${num(c.propres.length, 8)} ` +
				`${num(c.horsProduit.length, 10)} ${num([...(hom.get(v.vue) ?? [])].length, 15)} ${num((orph.get(v.vue) ?? []).length, 16)}`
		);
	}
}

/* L'ensemble clos des styles en ligne du gel, par vue — P-6.4 / ARB-016.
   Le calcul est celui de l'instrument qui APPLIQUE la règle, jamais un second. */
async function tableauStylesDuGel() {
	const { ensembleDuGel } = await import('./styles-en-ligne.mjs');
	console.log('  vue    déclarations  balisage  cssText  propriété  attribut  dont ‹calculé›');
	for (const v of releve) {
		const { declarations, comptes } = ensembleDuGel(v.vue);
		const calc = [...declarations].filter((d) => d.includes('\u0000')).length;
		console.log(
			`  ${col(v.vue, 6)} ${num(declarations.size, 9)} ${num(comptes.balisage, 11)} ` +
				`${num(comptes.cssText, 9)} ${num(comptes.propriete, 10)} ${num(comptes.attribut, 10)} ${num(calc, 13)}`
		);
	}
}

function tableauFormes() {
	const formes = formesDeCoquille(tout());
	console.log(`  ${formes.length} forme(s) de coquille dans le gel — signature barre/rail\n`);
	for (const f of formes) {
		console.log(`  ${f.cle}  ${f.vues.length} vues : ${f.vues.join(' ')}`);
	}
	console.log('\n  Classes du gabarit sans règle CSS dans la vue (rendu sans style) :');
	for (const v of releve) {
		if (!v.coquille) continue;
		console.log(`  ${col(v.vue, 6)} ${v.classesDuGabaritSansRegle.join(' ') || '—'}`);
	}
}

function tableauDeBord() {
	console.log(`\n  Relevé mécanique des maquettes gelées — ${releve.length} vue(s)\n`);
	tableauCoquille();
	console.log('');
	tableauEtats();
	console.log('');
	console.log('  Amendements du gabarit exigés par ce périmètre :');
	tableauGabarit();
}

if (!enLigneDeCommande) {
	/* rien */
} else if (args.includes('--json')) console.log(JSON.stringify(releve, null, '\t'));
else if (args.includes('--gabarit')) tableauGabarit();
else if (args.includes('--coquille')) tableauCoquille();
else if (args.includes('--etats')) tableauEtats();
else if (args.includes('--pieges')) tableauPieges();
else if (args.includes('--composants')) tableauComposants();
else if (args.includes('--formes')) tableauFormes();
else if (args.includes('--styles')) await tableauStylesDuGel();
else if (args.includes('--hors-app')) tableauHorsApp();
else if (args.includes('--coquille-diff')) tableauCoquilleDiff();
else if (demandees.length) releve.forEach(fiche);
else tableauDeBord();
