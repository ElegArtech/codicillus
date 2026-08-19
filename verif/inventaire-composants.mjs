#!/usr/bin/env node
/**
 * inventaire-composants — P-5, le contrôle de fermeture de l'inventaire.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie NI ce script, NI la règle qu'il
 * applique. La seule sortie légitime d'un rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI IL EXISTE
 *
 * `docs/DESIGN.md` §2 déclare un inventaire FERMÉ : « un composant absent de
 * cet inventaire n'existe pas ». Cet inventaire avait été extrait de
 * `mockups/socle.css` et de V-41 seulement. Quatre lots successifs ont relevé
 * ce qu'il ne portait pas, sans pouvoir le compléter :
 *
 *   • `ECART-011` É-4 — 36 classes de V-37, dont une troisième forme
 *     d'indicateur chiffré (`.mesure`) ;
 *   • `ECART-013` É-4 — quatre classes des zones comparées de V-37 ;
 *   • `ECART-015` — 86 classes sur V-38, V-39, V-40, et la contradiction
 *     `.zone-etat` contre `.vide` ;
 *   • `ECART-016` É-5 — la famille `.notif__*`, portée par le gabarit.
 *
 * `ECART-008 c)` assigne P-5 à T-009 et en fait une condition de clôture de la
 * phase 1. Ce script est l'instrument de ce contrôle. Il ne consulte AUCUNE
 * liste rédigée à la main : il relève les 41 maquettes gelées à chaque
 * exécution, et confronte le relevé à ce que `docs/DESIGN.md` §2 déclare.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS NATURES, ET LA RÈGLE QUI LES SÉPARE (docs/DESIGN.md §2.0)
 *
 *   HORS PRODUIT — employée seulement à l'intérieur d'un bloc que la maquette
 *   déclare elle-même hors produit (`.planche`, `section.regles`), et que le
 *   banc retire du DOM avant toute mesure (`verif/banc/conditions.mjs`,
 *   BLOCS_HORS_PRODUIT). Elle n'est jamais portée dans l'application.
 *
 *   TRANSVERSE — déclarée par le socle en ligne (le premier bloc `<style>`,
 *   commun aux 41 maquettes) OU employée en produit par DEUX vues ou plus.
 *   C'est un composant au sens de l'inventaire fermé : il est opposable à
 *   toutes les vues, et son absence de `docs/DESIGN.md` §2 est un trou
 *   d'inventaire.
 *
 *   PROPRE À UNE VUE — employée en produit par UNE SEULE vue et non déclarée
 *   par le socle. Elle n'est pas dans l'inventaire nominatif : elle est
 *   gouvernée par sa maquette gelée, qui est sa seule autorité. « Fermé » y
 *   signifie « relevé de la maquette à porter », non « listé au §2 ».
 *
 * Une quatrième catégorie est signalée mais n'appartient pas à l'inventaire :
 * DÉCLARÉE SANS EMPLOI — une règle CSS d'une maquette qu'aucun balisage
 * n'emploie. Elle ne se porte pas : elle ne rend rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE « EMPLOYÉE » VEUT DIRE, MÉCANIQUEMENT
 *
 * Une classe est employée par une vue si la maquette la pose sur un nœud.
 * Quatre chemins, tous relevés :
 *
 *   1. `class="…"` dans le balisage, hors des blocs `<style>` et `<script>` ;
 *   2. dans un `<script>` : `className = …`, `classList.add/remove/toggle`,
 *      `setAttribute("class", …)`, et le balisage des chaînes (`class=\"…\"`) ;
 *   3. dans un `<script>`, par une FONCTION D'AIDE. Les maquettes construisent
 *      l'essentiel de leur DOM par des fabriques du type
 *      `el(balise, classe, texte)`. Le script les découvre : toute fonction
 *      dont le corps affecte un de ses paramètres à `.className` est une
 *      fabrique, et la position de ce paramètre est retenue ; la propagation
 *      est itérée jusqu'à point fixe, de sorte que `html()` qui appelle `el()`
 *      est reconnue à son tour. Les 41 maquettes portent 1 679 affectations de
 *      `className` et davantage encore d'appels de fabrique ; sans les chemins 2
 *      et 3, `.avatar-p`, `.encart-b`, `.chrono__txt` passaient pour non
 *      employées alors que V-41 les rend.
 *
 * Les concaténations (`"avis avis--" + variante`) laissent un FRAGMENT se
 * terminant par `-`. Il n'est pas jeté : il est développé sur les classes
 * déclarées du même fichier qui commencent par lui, et l'emploi est marqué
 * « construit ». C'est ainsi que `.notif--erreur` de V-37 est relevée.
 *
 *   4. par une TABLE DE DONNÉES ou une fonction de choix : `{ classe:
 *      "p-frais" }`, `window.classeTemoin = function (niv) { return …
 *      "temoin--obs" }`. Ces littéraux ne sont retenus que sous DEUX
 *      conditions cumulées : ils sont dans un contexte de classe — propriété
 *      `classe`/`class`/`className`, ou corps d'une fonction dont le nom porte
 *      « class » — ET le nom est DÉCLARÉ par une feuille du même fichier.
 *
 * DEUX GARDE-FOUS, parce qu'un script contient aussi de la prose, et ils ne
 * portent pas au même endroit.
 *
 *   • Un littéral qui touche un opérateur de comparaison n'est jamais une
 *     classe : dans `tagName === "H3" ? "n2" : "n1"`, « H3 » est comparé et non
 *     posé. Le garde-fou vaut pour les quatre chemins.
 *   • Un jeton des chemins 3 et 4 — argument de fabrique, valeur de table — est
 *     REJETÉ s'il n'est déclaré par aucune maquette et posé par aucun attribut
 *     `class` : « Gagner du temps » est une phrase d'alerte, `pg-prod-01` le
 *     titre d'une note. Le chemin 2 n'y est PAS soumis : ce que reçoit
 *     `className` est une classe par construction, même si aucune règle ne la
 *     style — `.n1` du sommaire de note est dans ce cas.
 *
 * Le nombre de rejets est affiché par `--rejets` ; il ne se tait pas. Aucun
 * jeton n'est en revanche jamais INVENTÉ : tous viennent du gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * Usage :
 *   node verif/inventaire-composants.mjs              le décompte par nature
 *   node verif/inventaire-composants.mjs --verifier   P-5 : le contrôle de fermeture
 *   node verif/inventaire-composants.mjs --liste      les transverses, tracées
 *   node verif/inventaire-composants.mjs --liste=propre[=V-xx]  les classes de vue
 *   node verif/inventaire-composants.mjs --classe=vide          la fiche d'une classe
 *   node verif/inventaire-composants.mjs --vue=V-39             le relevé d'une vue
 *   node verif/inventaire-composants.mjs --homonymes  les collisions de nom entre vues
 *   node verif/inventaire-composants.mjs --orphelines les emplois sans déclaration
 *   node verif/inventaire-composants.mjs --residu     les déclarations sans emploi
 *   node verif/inventaire-composants.mjs --rejets     les jetons de script écartés
 *   node verif/inventaire-composants.mjs --json       le relevé complet, exploitable
 *   node verif/inventaire-composants.mjs --markdown   les tables du §2.E à §2.H
 *
 * Le mode `--verifier` sort en 1 dès un constat. Les autres modes décrivent et
 * sortent en 0 : décrire n'est pas juger.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAQUETTES = join(RACINE, 'mockups');
const SOURCES = join(RACINE, 'src');
const DESIGN = join(RACINE, 'docs', 'DESIGN.md');

/* ── Les blocs hors produit ────────────────────────────────────────────────
   La même liste que `verif/banc/conditions.mjs`, BLOCS_HORS_PRODUIT, et pour
   la même raison : ce que la maquette déclare hors produit, le banc le retire
   avant de mesurer. La liste est ici sous forme analysable sans navigateur.
   Elle n'est pas élargie : `section.regles` vise la section de V-37, pas le
   `ul.regles` de V-06 et V-25, qui est du produit. */
const HORS_PRODUIT = [
	{ balise: null, classe: 'planche' },
	{ balise: 'section', classe: 'regles' }
];

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

/* ══ Lecture des maquettes ════════════════════════════════════════════════ */

function maquettes() {
	return readdirSync(MAQUETTES)
		.filter((f) => /^V-\d\d-.*\.html$/.test(f))
		.sort()
		.map((fichier) => ({ vue: fichier.slice(0, 4), fichier, chemin: join(MAQUETTES, fichier) }));
}

function ligneDe(texte, index) {
	let n = 1;
	for (let i = 0; i < index && i < texte.length; i++) if (texte.charCodeAt(i) === 10) n++;
	return n;
}

/** Les blocs `<style>` ou `<script>` d'un fichier, avec leurs bornes. */
function blocs(texte, nom) {
	const out = [];
	const re = new RegExp(`<${nom}\\b[^>]*>`, 'g');
	let m;
	while ((m = re.exec(texte))) {
		const debut = m.index + m[0].length;
		const fin = texte.indexOf(`</${nom}>`, debut);
		if (fin < 0) break;
		out.push({ debut, fin, contenu: texte.slice(debut, fin) });
		re.lastIndex = fin;
	}
	return out;
}

/**
 * Les classes déclarées par un bloc CSS, avec la ligne de leur première
 * apparition en sélecteur. La lecture est délibérément naïve : un préambule de
 * règle est ce qui précède une accolade ouvrante et ne commence pas par `@`.
 * Une source de vérité qui exigerait un analyseur savant ne serait pas une
 * source de vérité.
 */
function declarationsCss(css, offset, texteGlobal) {
	const out = new Map();
	for (const m of css.matchAll(/([^{}();]+)\{/g)) {
		const prelude = m[1];
		if (/^\s*@/.test(prelude)) continue;
		for (const c of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
			if (out.has(c[1])) continue;
			out.set(c[1], ligneDe(texteGlobal, offset + m.index + prelude.indexOf(c[0])));
		}
	}
	return out;
}

/**
 * Le texte des règles CSS qui visent une classe, par classe, normalisé.
 * Il sert à départager deux DÉCLARATIONS HOMONYMES : `.vide` de V-08 et
 * `.vide` de V-39 portent le même nom et ne décrivent pas le même objet — bord
 * plein contre bord tireté, `--e-7 --e-5` contre `--e-5 --e-4`, titre `--t-t2`
 * contre `--t-t3`. Un nom partagé par deux vues qui n'en donnent pas la même
 * définition n'est pas un composant transverse : c'est une collision.
 */
function reglesParClasse(css) {
	const out = new Map();
	const texte = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
	const contexte = [];
	let tampon = '';
	for (let i = 0; i < texte.length; i++) {
		const c = texte[i];
		if (c === '{') {
			const prelude = tampon.trim().replace(/\s+/g, ' ');
			tampon = '';
			if (prelude.startsWith('@')) {
				contexte.push(prelude);
				continue;
			}
			/* une règle : son corps va jusqu'à l'accolade fermante */
			const fin = texte.indexOf('}', i);
			const corpsRegle = texte
				.slice(i + 1, fin < 0 ? texte.length : fin)
				.replace(/\s+/g, ' ')
				.trim();
			i = fin < 0 ? texte.length : fin;
			const cle = [...contexte, prelude].join(' » ');
			for (const m of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
				if (!out.has(m[1])) out.set(m[1], new Map());
				/* Une feuille peut redéclarer le même sélecteur plus bas — la cascade
				   fait la valeur finale. Les corps sont donc CUMULÉS dans l'ordre du
				   document, jamais écrasés : sinon deux vues qui portent la même
				   règle de base et le même correctif passeraient pour divergentes. */
				const dejaLa = out.get(m[1]).get(cle);
				if (!dejaLa) out.get(m[1]).set(cle, corpsRegle);
				else if (!dejaLa.split(' ‖ ').includes(corpsRegle))
					/* une redéclaration à l'identique ne change rien à la cascade :
					   elle ne compte pas comme une définition de plus */
					out.get(m[1]).set(cle, `${dejaLa} ‖ ${corpsRegle}`);
			}
			continue;
		}
		if (c === '}') {
			contexte.pop();
			tampon = '';
			continue;
		}
		tampon += c;
	}
	return out;
}

/**
 * Les sous-arbres hors produit d'un balisage, par bornes de caractères.
 * Analyse par pile de balises : les maquettes sont écrites à la main et bien
 * formées, et le contrôle croisé du nombre de blocs retirés par le banc le
 * confirme (`--verifier`, constat de cohérence).
 */
function regionsHorsProduit(texte, ignorees) {
	const regions = [];
	const pile = [];
	const re = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
	let m;
	while ((m = re.exec(texte))) {
		if (ignorees.some(([d, f]) => m.index >= d && m.index < f)) continue;
		const fermant = m[1] === '/';
		const balise = m[2].toLowerCase();
		if (VIDES.has(balise)) continue;
		if (!fermant && /\/\s*$/.test(m[3])) continue;
		if (fermant) {
			for (let i = pile.length - 1; i >= 0; i--) {
				if (pile[i].balise !== balise) continue;
				if (pile[i].hors) regions.push([pile[i].debut, m.index + m[0].length]);
				pile.length = i;
				break;
			}
			continue;
		}
		const classes = classesDAttribut(m[3]);
		pile.push({
			balise,
			debut: m.index,
			hors: HORS_PRODUIT.some(
				(h) => (h.balise === null || h.balise === balise) && classes.includes(h.classe)
			)
		});
	}
	return regions;
}

function classesDAttribut(attributs) {
	const m =
		attributs.match(/\bclass\s*=\s*"([^"]*)"/) || attributs.match(/\bclass\s*=\s*'([^']*)'/);
	return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

/* ══ Les fabriques de classe des scripts ══════════════════════════════════ */

/** Le corps d'une fonction, à partir de son accolade ouvrante, cordes et
 *  commentaires respectés. */
function corps(src, debutAccolade) {
	let profondeur = 0;
	for (let i = debutAccolade; i < src.length; i++) {
		const c = src[i];
		if (c === '"' || c === "'" || c === '`') {
			const q = c;
			i++;
			while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1;
			continue;
		}
		if (c === '/' && src[i + 1] === '/') {
			i = src.indexOf('\n', i);
			if (i < 0) break;
			continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			i = src.indexOf('*/', i);
			if (i < 0) break;
			i++;
			continue;
		}
		if (c === '{') profondeur++;
		else if (c === '}') {
			profondeur--;
			if (profondeur === 0) return src.slice(debutAccolade + 1, i);
		}
	}
	return '';
}

/** Découpe une liste d'arguments aux virgules de premier niveau. */
function arguments1(src) {
	const out = [];
	let courant = '';
	let profondeur = 0;
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (c === '"' || c === "'" || c === '`') {
			const q = c;
			let s = c;
			i++;
			while (i < src.length && src[i] !== q) {
				s += src[i];
				i += src[i] === '\\' ? 2 : 1;
				if (src[i - 1] === '\\') s += src[i - 1] + (src[i] ?? '');
			}
			courant += s + q;
			continue;
		}
		if ('([{'.includes(c)) profondeur++;
		else if (')]}'.includes(c)) profondeur--;
		if (c === ',' && profondeur === 0) {
			out.push(courant);
			courant = '';
			continue;
		}
		courant += c;
	}
	if (courant.trim() !== '') out.push(courant);
	return out;
}

/** L'appel `nom(...)` : rend la liste des arguments, ou null. */
function appels(src, nom) {
	const out = [];
	const re = new RegExp(`(?<![\\w$.])${nom}\\s*\\(`, 'g');
	let m;
	while ((m = re.exec(src))) {
		let profondeur = 1;
		let i = m.index + m[0].length;
		const debut = i;
		for (; i < src.length && profondeur > 0; i++) {
			const c = src[i];
			if (c === '"' || c === "'" || c === '`') {
				const q = c;
				i++;
				while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1;
				continue;
			}
			if ('([{'.includes(c)) profondeur++;
			else if (')]}'.includes(c)) profondeur--;
		}
		out.push(arguments1(src.slice(debut, i - 1)));
	}
	return out;
}

const AFFECTE_CLASSE = [
	/\.className\s*=\s*([^;\n]+)/g,
	/\.setAttribute\(\s*["']class["']\s*,([^;]*?)\)\s*;/g,
	/\.classList\.(?:add|remove|toggle|replace)\(([^)]*)\)/g
];

/**
 * Les fabriques de classe d'un script : `Map(nom -> Set(rangs d'argument))`.
 * Une fonction est une fabrique quand elle affecte un de ses paramètres à une
 * classe. La propagation est itérée jusqu'à point fixe : une fonction qui
 * passe son paramètre au rang de classe d'une fabrique connue en est une.
 */
function fabriques(src) {
	const fonctions = [];
	const re =
		/(?:function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)|(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\))\s*\{/g;
	let m;
	while ((m = re.exec(src))) {
		const nom = m[1] ?? m[3];
		const params = (m[2] ?? m[4])
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);
		fonctions.push({ nom, params, corps: corps(src, re.lastIndex - 1) });
	}

	const trouvees = new Map();
	const marquer = (nom, rang) => {
		if (!trouvees.has(nom)) trouvees.set(nom, new Set());
		if (trouvees.get(nom).has(rang)) return false;
		trouvees.get(nom).add(rang);
		return true;
	};

	for (const f of fonctions) {
		for (const motif of AFFECTE_CLASSE) {
			for (const a of f.corps.matchAll(motif)) {
				f.params.forEach((p, rang) => {
					if (new RegExp(`(?<![\\w$])${p}(?![\\w$])`).test(a[1])) marquer(f.nom, rang);
				});
			}
		}
	}

	let bouge = true;
	while (bouge) {
		bouge = false;
		for (const f of fonctions) {
			for (const [nom, rangs] of [...trouvees]) {
				if (nom === f.nom) continue;
				for (const args of appels(f.corps, nom)) {
					for (const rang of rangs) {
						const arg = args[rang];
						if (!arg) continue;
						f.params.forEach((p, r) => {
							if (new RegExp(`(?<![\\w$])${p}(?![\\w$])`).test(arg) && marquer(f.nom, r))
								bouge = true;
						});
					}
				}
			}
		}
	}
	return trouvees;
}

/** Les chaînes littérales d'une expression, concaténations comprises. */
function litteraux(expr, sansComparaisons = false) {
	const out = [];
	for (const m of expr.matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)) {
		if (sansComparaisons) {
			/* `t.tagName === "H3" ? "n2" : "n1"` — « H3 » est comparé, pas posé.
			   Un littéral qui touche un opérateur de comparaison n'est pas une
			   classe : c'est la condition qui décide de la classe. */
			const avant = expr.slice(0, m.index);
			const apres = expr.slice(m.index + m[0].length);
			if (/[=!]==?\s*$/.test(avant) || /^\s*[=!]==?/.test(apres)) continue;
		}
		out.push((m[1] ?? m[2]).replace(/\\(.)/g, '$1'));
	}
	return out;
}

/* ══ Le relevé ════════════════════════════════════════════════════════════ */

export function relever() {
	const registre = new Map();
	const parVue = new Map();

	const fiche = (classe) => {
		if (!registre.has(classe))
			registre.set(classe, { classe, emplois: new Map(), declarations: [] });
		return registre.get(classe);
	};
	const noter = (classe, vue, hors, chemin, ligne) => {
		const e = fiche(classe).emplois;
		if (!e.has(vue)) e.set(vue, { produit: 0, hors: 0, chemins: new Set(), lignes: [] });
		const v = e.get(vue);
		if (hors) v.hors++;
		else v.produit++;
		v.chemins.add(chemin);
		if (ligne && v.lignes.length < 4) v.lignes.push(ligne);
	};

	/* ── Passe 1 : les déclarations et le balisage ────────────────────────
	   Elle établit ce que les 41 maquettes CONNAISSENT — l'ensemble des noms
	   déclarés par une feuille ou posés par un attribut `class`. C'est le
	   crible de la passe 2 : un jeton de script hors de cet ensemble est de la
	   prose, pas un composant. */
	const fichiers = [];
	const connues = new Set();
	const signatures = new Map();
	for (const { vue, fichier, chemin } of maquettes()) {
		const texte = readFileSync(chemin, 'utf8');
		const styles = blocs(texte, 'style');
		const scripts = blocs(texte, 'script');
		const ignorees = [...styles, ...scripts].map((b) => [b.debut, b.fin]);

		/* Déclarations : bloc 1 = socle en ligne (§0.2), bloc 2 = feuille de vue. */
		const declaresIci = new Set();
		styles.forEach((b, i) => {
			for (const [classe, ligne] of declarationsCss(b.contenu, b.debut, texte)) {
				fiche(classe).declarations.push({ vue, fichier, bloc: i === 0 ? 'socle' : 'vue', ligne });
				declaresIci.add(classe);
				connues.add(classe);
			}
			if (i === 0) return;
			for (const [classe, regles] of reglesParClasse(b.contenu)) {
				if (!signatures.has(classe)) signatures.set(classe, new Map());
				signatures.get(classe).set(vue, regles);
			}
		});

		const regions = regionsHorsProduit(texte, ignorees);
		const hors = (i) => regions.some(([d, f]) => i >= d && i < f);

		/* 1 — le balisage */
		for (const m of texte.matchAll(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/g)) {
			if (ignorees.some(([d, f]) => m.index >= d && m.index < f)) continue;
			for (const c of (m[2] ?? m[3]).split(/\s+/).filter(Boolean)) {
				noter(c, vue, hors(m.index), 'balisage', ligneDe(texte, m.index));
				connues.add(c);
			}
		}

		fichiers.push({ vue, fichier, scripts, declaresIci, regions });
		parVue.set(vue, { fichier, declares: declaresIci, blocsHorsProduit: regions.length });
	}

	/* ── Passe 2 : les scripts ────────────────────────────────────────────── */
	const rejets = new Map();
	for (const { vue, scripts, declaresIci } of fichiers) {
		const retenir = (jeton, chemin) => {
			if (!connues.has(jeton)) {
				rejets.set(jeton, (rejets.get(jeton) ?? 0) + 1);
				return;
			}
			noter(jeton, vue, false, chemin, null);
		};

		for (const b of scripts) {
			const src = b.contenu;

			/* 2 et 3 — contextes de classe, fabriques comprises */
			/* Chemin 2 — les API de classe. Ce qu'elles reçoivent EST une classe :
			   le crible des classes connues ne s'y applique pas, sans quoi une
			   classe que rien ne style — `.n1` du sommaire — serait perdue. */
			const parApi = [];
			for (const motif of AFFECTE_CLASSE) for (const m of src.matchAll(motif)) parApi.push(m[1]);
			for (const m of src.matchAll(/class=\\"([^\\]*)\\"|class="([^"]*)"|class='([^']*)'/g))
				parApi.push(JSON.stringify(m[1] ?? m[2] ?? m[3]));

			/* Chemin 3 — les fabriques. Un argument de fabrique peut être du texte :
			   le crible s'y applique. */
			const parFabrique = [];
			for (const [nom, rangs] of fabriques(src))
				for (const args of appels(src, nom))
					for (const rang of rangs) if (args[rang]) parFabrique.push(args[rang]);

			const depouiller = (expr, chemin) => {
				for (const chaine of litteraux(expr, true))
					for (const jeton of chaine.split(/\s+/).filter(Boolean)) {
						if (/^[_a-zA-Z][\w-]*$/.test(jeton) && !jeton.endsWith('-')) {
							if (chemin === 'script') noter(jeton, vue, false, chemin, null);
							else retenir(jeton, chemin);
						} else if (/^[_a-zA-Z][\w-]*-$/.test(jeton))
							/* fragment de concaténation : développé sur les classes du fichier */
							for (const c of declaresIci)
								if (c.startsWith(jeton) && c !== jeton) noter(c, vue, false, 'construit', null);
					}
			};
			for (const expr of parApi) depouiller(expr, 'script');
			for (const expr of parFabrique) depouiller(expr, 'fabrique');

			/* 4 — tables de données et fonctions de choix, bornées aux classes
			   que le fichier déclare lui-même */
			const donnees = [];
			for (const m of src.matchAll(/\b(?:classe|class|className|cls)\s*:\s*("([^"]*)"|'([^']*)')/g))
				donnees.push(m[2] ?? m[3]);
			for (const m of src.matchAll(
				/(?:function\s+([A-Za-z_$][\w$]*)|(?:var|let|const|window\.)[\w$.]*\b([A-Za-z_$][\w$]*)\s*=\s*function)\s*\(([^)]*)\)\s*\{/g
			)) {
				const nom = m[1] ?? m[2] ?? '';
				if (!/class/i.test(nom)) continue;
				for (const l of litteraux(corps(src, m.index + m[0].length - 1))) donnees.push(l);
			}
			for (const d of donnees)
				for (const jeton of d.split(/\s+/).filter(Boolean))
					if (declaresIci.has(jeton)) noter(jeton, vue, false, 'donnée', null);
		}
	}

	/* Nature */
	const socle = new Set();
	for (const [c, f] of registre) if (f.declarations.some((d) => d.bloc === 'socle')) socle.add(c);

	for (const [, f] of registre) {
		f.vuesProduit = [...f.emplois]
			.filter(([, v]) => v.produit > 0)
			.map(([k]) => k)
			.sort();
		f.vuesHors = [...f.emplois]
			.filter(([, v]) => v.hors > 0)
			.map(([k]) => k)
			.sort();
		f.socle = socle.has(f.classe);
		f.definitions = signatures.get(f.classe) ?? new Map();
		/* Collision : DEUX vues donnent au MÊME sélecteur DEUX corps différents.
		   Une vue qui ajoute une règle que l'autre n'a pas étend, elle ne
		   contredit pas — ce n'est donc pas une collision. */
		f.collisions = [];
		if (!f.socle && f.definitions.size > 1) {
			const parSelecteur = new Map();
			for (const [vue, regles] of f.definitions)
				for (const [prelude, corpsRegle] of regles) {
					if (!parSelecteur.has(prelude)) parSelecteur.set(prelude, new Map());
					parSelecteur.get(prelude).set(vue, corpsRegle);
				}
			for (const [prelude, parVue2] of parSelecteur)
				if (new Set(parVue2.values()).size > 1)
					f.collisions.push({ selecteur: prelude, vues: [...parVue2.keys()] });
		}
		f.divergentes = f.collisions.length > 0;
		if (f.vuesProduit.length === 0 && f.vuesHors.length > 0) f.nature = 'hors-produit';
		else if (f.vuesProduit.length === 0) f.nature = 'declaree-sans-emploi';
		else if (f.socle || f.vuesProduit.length >= 2) f.nature = 'transverse';
		else f.nature = 'propre';
		f.trace = traceDe(f);
	}
	return { registre, parVue, rejets };
}

/**
 * La trace d'une classe : le fichier et la ligne qui la DÉCLARENT.
 * Préférences, dans l'ordre : `mockups/socle.css` quand il la porte (c'est la
 * source citée par l'inventaire d'origine), sinon le socle en ligne de
 * `V-07-accueil-contributeur.html` — le socle retenu par `ECART-008 a)` —,
 * sinon la feuille de la vue qui la déclare.
 */
let SOCLE_FICHIER = null;
function socleFichier() {
	if (SOCLE_FICHIER) return SOCLE_FICHIER;
	const texte = readFileSync(join(MAQUETTES, 'socle.css'), 'utf8');
	SOCLE_FICHIER = declarationsCss(texte, 0, texte);
	return SOCLE_FICHIER;
}

function traceDe(f) {
	const dansFichier = socleFichier().get(f.classe);
	if (dansFichier) return `socle.css:${dansFichier}`;
	const v07 = f.declarations.find((d) => d.vue === 'V-07' && d.bloc === 'socle');
	if (v07) return `V-07:${v07.ligne}`;
	const socle = f.declarations.find((d) => d.bloc === 'socle');
	if (socle) return `${socle.vue}:${socle.ligne}`;
	const vue = f.declarations[0];
	return vue ? `${vue.vue}:${vue.ligne}` : '—';
}

/* ══ Le contrôle de fermeture — P-5 ═══════════════════════════════════════ */

/** Les classes citées par le §2 de `docs/DESIGN.md`, en `code span`. */
export function inventaireDeclare() {
	const texte = readFileSync(DESIGN, 'utf8');
	const debut = texte.indexOf("\n## 2. L'inventaire fermé des composants");
	const fin = texte.indexOf('\n## 3. ', debut);
	if (debut < 0 || fin < 0) throw new Error('DESIGN.md : le §2 est introuvable.');
	const section = texte.slice(debut, fin);
	const classes = new Set();
	const prefixes = [];
	for (const m of section.matchAll(/`([^`]+)`/g)) {
		/* un nom de fichier n'est pas une classe : `socle.css`, `V-41-….html` */
		if (/\.(css|html|md|mjs|json|ts|js|svelte)\b/.test(m[1])) continue;
		for (const c of m[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)(\*?)/g)) {
			if (c[2] === '*') prefixes.push(c[1]);
			else classes.add(c[1]);
		}
	}
	return { classes, prefixes };
}

/** Le §2 cite-t-il cette classe, nommément ou par une famille `.prefixe*` ? */
function citee(inventaire, classe) {
	return (
		inventaire.classes.has(classe) ||
		inventaire.prefixes.some((p) => p.length >= 3 && classe.startsWith(p))
	);
}

/**
 * Les lignes de tableau du §2 qui NOMMENT des vues : la colonne « En
 * situation ». Le relevé peut la démentir, et il l'a fait — l'inventaire
 * d'origine plaçait `.infobulle` en V-08 et `.menu-ctx` en V-12, deux vues où
 * ces classes n'apparaissent pas. Une colonne « en situation » fausse envoie un
 * lot chercher un composant là où il n'est pas.
 *
 * La lecture est bornée : seule la DERNIÈRE cellule d'une ligne est lue comme
 * une situation, et seulement si elle cite au moins un `V-xx`.
 */
function situationsDeclarees() {
	const texte = readFileSync(DESIGN, 'utf8');
	const debut = texte.indexOf("\n## 2. L'inventaire fermé des composants");
	const fin = texte.indexOf('\n## 3. ', debut);
	const lignes = [];
	for (const ligne of texte.slice(debut, fin).split('\n')) {
		if (!ligne.startsWith('|')) continue;
		const cellules = ligne
			.replace(/^\||\|$/g, '')
			.split('|')
			.map((c) => c.trim());
		if (cellules.length < 3) continue;
		const vues = [...new Set([...cellules.at(-1).matchAll(/V-\d\d/g)].map((m) => m[0]))];
		if (vues.length === 0) continue;
		const trouvees = [
			...cellules
				.slice(0, -1)
				.join(' ')
				.matchAll(/`([^`]+)`/g)
		]
			.filter((m) => !/\.(css|html|md|mjs|json|ts|js|svelte)\b/.test(m[1]))
			.flatMap((m) => [...m[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)(\*?)/g)]);
		const classes = [...new Set(trouvees.filter((m) => m[2] !== '*').map((m) => m[1]))];
		const prefixes = trouvees.filter((m) => m[2] === '*').map((m) => m[1]);
		if (classes.length === 0 && prefixes.length === 0) continue;
		lignes.push({ classes, prefixes, vues, ligne });
	}
	return lignes;
}

/** Les classes employées par l'application, par fichier de `src/**`. */
function classesDeLApplication() {
	const trouvees = new Map();
	const parcourir = (dossier) => {
		for (const e of readdirSync(dossier)) {
			const p = join(dossier, e);
			if (statSync(p).isDirectory()) parcourir(p);
			else if (/\.svelte$/.test(p)) {
				const texte = readFileSync(p, 'utf8');
				const rel = relative(RACINE, p);
				const vue = /(?:^|\/)(V-\d\d)\.svelte$/.exec(rel)?.[1] ?? null;
				const noter = (c, ligne) => {
					if (!trouvees.has(c)) trouvees.set(c, []);
					trouvees.get(c).push({ fichier: rel, vue, ligne });
				};
				/* Un attribut `class` de composant mêle du texte et des expressions :
				   `class="sq {fort ? 'sq--fort' : ''}"`. Les deux sont lus — le
				   texte hors accolades, et les littéraux à l'intérieur —, jamais
				   l'expression elle-même. */
				const poser = (valeur, index, expression) => {
					const jetons = [];
					if (expression) {
						/* `class={expr}` : seuls les littéraux de l'expression sont des
						   classes. Le nom d'une variable n'en est pas une. */
						for (const l of litteraux(valeur)) jetons.push(...l.split(/\s+/));
					} else {
						const dedans = [];
						const reste = valeur.replace(/\{[^{}]*\}/g, (bloc) => {
							dedans.push(bloc);
							return ' ';
						});
						jetons.push(...reste.split(/\s+/));
						for (const bloc of dedans)
							for (const l of litteraux(bloc)) jetons.push(...l.split(/\s+/));
					}
					for (const c of jetons)
						if (/^-?[_a-zA-Z][\w-]*$/.test(c)) noter(c, ligneDe(texte, index));
				};
				for (const m of texte.matchAll(
					/\bclass\s*=\s*("([^"]*)"|'([^']*)'|\{([^{}]*(?:\{[^{}]*\})?[^{}]*)\})/g
				))
					poser(m[2] ?? m[3] ?? m[4] ?? '', m.index, m[4] !== undefined);
				for (const m of texte.matchAll(/\bclass:([\w-]+)/g)) noter(m[1], ligneDe(texte, m.index));
			}
		}
	};
	if (existsSync(SOURCES)) parcourir(SOURCES);
	return trouvees;
}

function verifier(releve) {
	const { registre } = releve;
	const constats = [];
	const declare = inventaireDeclare();
	const transverses = [...registre.values()].filter((f) => f.nature === 'transverse');

	/* P-5.3 — couverture : tout transverse est-il au §2 ? */
	const absentes = transverses.filter((f) => !citee(declare, f.classe));
	for (const f of absentes)
		constats.push(
			`P-5.3  trou d'inventaire — .${f.classe} est transverse (${f.vuesProduit.length} vues) ` +
				`et absente du §2 · ${f.trace}`
		);

	/* P-5.3 bis — entrées fantômes : le §2 cite-t-il ce qui n'existe pas ? */
	for (const c of [...declare.classes].sort()) {
		const f = registre.get(c);
		if (!f) constats.push(`P-5.3  entrée fantôme — le §2 cite .${c}, absente des 41 maquettes`);
		else if (f.nature === 'declaree-sans-emploi')
			constats.push(
				`P-5.3  entrée sans emploi — le §2 cite .${c}, déclarée mais employée par aucune ` +
					`maquette · ${f.trace}`
			);
	}

	/* P-5.4 — situation : le §2 place-t-il un composant dans une vue qui ne
	   l'emploie pas ? */
	for (const l of situationsDeclarees()) {
		const reelles = new Set();
		const membres = [
			...l.classes,
			...[...registre.keys()].filter((c) =>
				l.prefixes.some((p) => p.length >= 3 && c.startsWith(p))
			)
		];
		for (const c of membres) for (const v of registre.get(c)?.vuesProduit ?? []) reelles.add(v);
		if (membres.every((c) => !registre.has(c))) continue;
		const dementies = l.vues.filter((v) => !reelles.has(v));
		if (dementies.length)
			constats.push(
				`P-5.4  situation démentie — .${l.classes[0] ?? l.prefixes[0] + '*'} est donnée « en situation » dans ` +
					`${dementies.join(', ')} ; le relevé ne l'y trouve pas ` +
					`(employée par ${[...reelles].sort().join(', ') || 'aucune vue'})`
			);
	}

	/* P-5.1 — dérive : l'application emploie-t-elle hors inventaire ? */
	const noms = [...registre.keys()];
	for (const [c, emplois] of classesDeLApplication()) {
		const f = registre.get(c);
		/* `class="notif notif--{type}"` laisse le fragment `notif--` : il est
		   admis dès lors qu'une classe du gel commence par lui — c'est une
		   variante construite, pas une classe inventée. */
		if (!f && c.endsWith('-') && noms.some((n) => n.startsWith(c) && n !== c)) continue;
		for (const e of emplois) {
			if (!f) {
				constats.push(
					`P-5.1  hors inventaire — .${c} employée par ${e.fichier}:${e.ligne} ` +
						`n'existe dans aucune des 41 maquettes`
				);
				continue;
			}
			if (f.nature === 'hors-produit')
				constats.push(
					`P-5.1  bloc hors produit — .${c} employée par ${e.fichier}:${e.ligne} appartient ` +
						`à un bloc que la maquette déclare hors produit`
				);
			else if (f.nature === 'propre' && e.vue && !f.vuesProduit.includes(e.vue))
				constats.push(
					`P-5.2  classe d'une autre vue — .${c} employée par ${e.fichier}:${e.ligne} est ` +
						`propre à ${f.vuesProduit.join(', ')}`
				);
			else if (f.nature === 'propre' && !e.vue)
				/* un fichier partagé — gabarit, coquille — ne porte pas en dur la
				   classe d'une vue : ce serait y loger une vue */
				constats.push(
					`P-5.2  classe de vue dans un fichier partagé — .${c} employée par ` +
						`${e.fichier}:${e.ligne} est propre à ${f.vuesProduit.join(', ')}`
				);
		}
	}
	return constats;
}

/* ══ Sorties ══════════════════════════════════════════════════════════════ */

function parNature(registre) {
	const g = { transverse: [], propre: [], 'hors-produit': [], 'declaree-sans-emploi': [] };
	for (const f of registre.values()) g[f.nature].push(f);
	for (const k of Object.keys(g)) g[k].sort((a, b) => a.classe.localeCompare(b.classe));
	return g;
}

/** La racine de famille d'une classe BEM : `notif__titre` → `notif`. */
export function famille(classe) {
	return classe.split('__')[0].split('--')[0];
}

function resume(releve) {
	const g = parNature(releve.registre);
	const familles = new Set(g.transverse.map((f) => famille(f.classe)));
	console.log('\n  Relevé des 41 maquettes gelées — inventaire des composants\n');
	console.log(`  classes connues des maquettes        ${releve.registre.size}`);
	console.log(
		`  ├─ transverses (inventaire fermé)    ${g.transverse.length}  · ${familles.size} familles`
	);
	console.log(`  ├─ propres à une vue                 ${g.propre.length}`);
	console.log(`  ├─ hors produit                      ${g['hors-produit'].length}`);
	console.log(`  └─ déclarées sans emploi             ${g['declaree-sans-emploi'].length}`);

	const divergentes = [...releve.registre.values()].filter((f) => f.divergentes);
	console.log(
		`\n  définitions divergentes entre vues    ${divergentes.length}` +
			'  (même nom, corps différents)'
	);
	const socle = g.transverse.filter((f) => f.socle).length;
	console.log(
		`\n  dont déclarées par le socle en ligne  ${socle}` +
			`\n  dont employées par ≥ 2 vues           ${g.transverse.filter((f) => f.vuesProduit.length >= 2).length}`
	);

	console.log('\n  Propres à une vue, par vue :');
	const parVue = new Map();
	for (const f of g.propre) {
		const v = f.vuesProduit[0];
		parVue.set(v, (parVue.get(v) ?? 0) + 1);
	}
	const lignes = [...parVue].sort();
	for (let i = 0; i < lignes.length; i += 6)
		console.log(
			'    ' +
				lignes
					.slice(i, i + 6)
					.map(([v, n]) => `${v} ${String(n).padStart(3)}`)
					.join('   ')
		);
	console.log('');
}

function listeTransverses(releve) {
	const g = parNature(releve.registre);
	const parFamille = new Map();
	for (const f of g.transverse) {
		const r = famille(f.classe);
		if (!parFamille.has(r)) parFamille.set(r, []);
		parFamille.get(r).push(f);
	}
	for (const [r, membres] of [...parFamille].sort()) {
		const vues = new Set();
		for (const m of membres) m.vuesProduit.forEach((v) => vues.add(v));
		console.log(`\n.${r}  — ${membres.length} classe(s), ${vues.size} vue(s)`);
		for (const m of membres.sort((a, b) => a.classe.localeCompare(b.classe)))
			console.log(
				`   .${m.classe.padEnd(30)} ${m.trace.padEnd(18)} ${m.vuesProduit.length} vues : ` +
					`${m.vuesProduit.join(' ')}`
			);
	}
}

function listePropres(releve, filtre) {
	const g = parNature(releve.registre);
	const membres = g.propre.filter((f) => !filtre || f.vuesProduit[0] === filtre);
	const parVue = new Map();
	for (const f of membres) {
		const v = f.vuesProduit[0];
		if (!parVue.has(v)) parVue.set(v, []);
		parVue.get(v).push(f);
	}
	for (const [v, liste] of [...parVue].sort()) {
		console.log(`\n${v} — ${liste.length} classes propres`);
		for (const f of liste) console.log(`   .${f.classe.padEnd(32)} ${f.trace}`);
	}
}

function ficheClasse(releve, nom) {
	const f = releve.registre.get(nom.replace(/^\./, ''));
	if (!f) return console.log(`\n  .${nom} — absente des 41 maquettes.\n`);
	console.log(`\n  .${f.classe}  —  ${f.nature}`);
	console.log(`  trace        ${f.trace}`);
	console.log(`  socle        ${f.socle ? 'oui — déclarée par le socle en ligne' : 'non'}`);
	console.log(
		`  emplois      ${f.vuesProduit.length} vue(s) en produit : ${f.vuesProduit.join(' ') || '—'}`
	);
	if (f.vuesHors.length) console.log(`  hors produit ${f.vuesHors.join(' ')}`);
	for (const [vue, v] of [...f.emplois].sort())
		console.log(
			`    ${vue}  produit ${String(v.produit).padStart(3)}  hors ${String(v.hors).padStart(2)}` +
				`  [${[...v.chemins].join(', ')}]${v.lignes.length ? '  l. ' + v.lignes.join(', ') : ''}`
		);
	console.log(
		`  déclarée     ${
			f.declarations
				.map((d) => `${d.vue}:${d.ligne}(${d.bloc})`)
				.slice(0, 8)
				.join(' ') || '—'
		}` + (f.declarations.length > 8 ? ` … ${f.declarations.length} au total` : '')
	);
	console.log('');
}

function ficheVue(releve, vue) {
	const fiches = [...releve.registre.values()].filter((f) => f.emplois.has(vue));
	const g = { transverse: [], propre: [], 'hors-produit': [], 'declaree-sans-emploi': [] };
	for (const f of fiches) g[f.nature].push(f.classe);
	console.log(`\n  ${vue} — ${fiches.length} classes employées`);
	for (const [k, v] of Object.entries(g))
		if (v.length) console.log(`\n  ${k} (${v.length}) :\n    ${v.sort().join(' ')}`);
	console.log('');
}

/**
 * Les tables de `docs/DESIGN.md` §2.E à §2.H, telles qu'elles y figurent.
 *
 * Le §2 n'est pas rédigé à la main pour ses 239 entrées de complément : il est
 * DÉRIVÉ du gel, comme le reste. Ce mode réémet les tables ; `--verifier`
 * contrôle ensuite que le document et le gel disent la même chose. Les deux
 * moitiés se tiennent : l'une écrit, l'autre juge, et aucune ne croit l'autre
 * sur parole.
 */
function markdown(releve) {
	const g = parNature(releve.registre);
	const dejaCitees = inventaireDeclare();
	const complement = g.transverse.filter((f) => !citee(dejaCitees, f.classe));
	const parFamille = new Map();
	for (const f of complement) {
		const r = famille(f.classe);
		if (!parFamille.has(r)) parFamille.set(r, []);
		parFamille.get(r).push(f);
	}
	const vuesDe = (f) =>
		f.vuesProduit.length <= 5 ? f.vuesProduit.join(', ') : `${f.vuesProduit.length} vues`;

	console.log(`<!-- ${complement.length} classes, ${parFamille.size} familles -->\n`);
	console.log('| Classe | Trace | Employée par |');
	console.log('|---|---|---|');
	for (const [, membres] of [...parFamille].sort())
		for (const f of membres.sort((a, b) => a.classe.localeCompare(b.classe)))
			console.log(
				`| \`.${f.classe}\` | ${f.trace === '—' ? '— *crochet de script, aucune règle*' : `\`${f.trace}\``} | ` +
					`${f.vuesProduit.length} — ${vuesDe(f)}${f.divergentes ? ' · **divergente**' : ''} |`
			);

	console.log('\n\n<!-- §2.F — les classes propres à une vue -->\n');
	const propresParVue = new Map();
	for (const f of g.propre) {
		const v = f.vuesProduit[0];
		if (!propresParVue.has(v)) propresParVue.set(v, []);
		propresParVue.get(v).push(f);
	}
	console.log('| Vue | Classes propres | Premières |');
	console.log('|---|---|---|');
	for (const [v, liste] of [...propresParVue].sort())
		console.log(
			`| ${v} | ${liste.length} | ` +
				liste
					.slice(0, 4)
					.map((f) => `\`.${f.classe}\``)
					.join(' ') +
				(liste.length > 4 ? ' …' : '') +
				' |'
		);

	console.log('\n\n<!-- §2.G — hors produit -->\n');
	console.log('| Classe | Trace | Bloc | Vues |');
	console.log('|---|---|---|---|');
	for (const f of g['hors-produit'])
		console.log(
			`| \`.${f.classe}\` | \`${f.trace}\` | ${f.classe.startsWith('regles') ? '`section.regles`' : '`.planche`'} | ${f.vuesHors.length} |`
		);

	console.log('\n\n<!-- §2.H — définitions divergentes -->\n');
	console.log('| Classe | Vues qui la déclarent | Sélecteur en collision |');
	console.log('|---|---|---|');
	for (const f of [...releve.registre.values()]
		.filter((x) => x.divergentes)
		.sort((a, b) => a.classe.localeCompare(b.classe)))
		console.log(
			`| \`.${f.classe}\` | ${[...f.definitions.keys()].sort().length} — ${[...f.definitions.keys()].sort().join(', ')} | \`${f.collisions[0].selecteur}\`${f.collisions.length > 1 ? ` (+${f.collisions.length - 1})` : ''} |`
		);

	console.log('\n\n<!-- déclarées sans emploi -->\n');
	for (const f of g['declaree-sans-emploi']) console.log(`\`.${f.classe}\` (${f.trace}) ·`);
}

/**
 * Les emplois ORPHELINS : une vue pose une classe qu'aucune de ses deux
 * feuilles ne déclare. Le nœud rend alors sans style — ce n'est pas une
 * erreur de relevé, c'est un fait du gel, et il faut le savoir avant de
 * porter la vue en croyant qu'il manque une règle.
 */
function orphelines(releve) {
	const lignes = [];
	for (const f of releve.registre.values())
		for (const [vue, e] of f.emplois) {
			if (e.produit === 0) continue;
			if (releve.parVue.get(vue).declares.has(f.classe)) continue;
			lignes.push({ classe: f.classe, vue, nature: f.nature, trace: f.trace });
		}
	lignes.sort((a, b) => a.classe.localeCompare(b.classe) || a.vue.localeCompare(b.vue));
	console.log(
		`\n  ${lignes.length} emplois orphelins : la vue pose la classe, aucune de ses` +
			'\n  feuilles ne la déclare. Le nœud rend sans style.\n'
	);
	for (const l of lignes)
		console.log(
			`   ${l.vue}  .${l.classe.padEnd(28)} [${l.nature}] déclarée ailleurs : ${l.trace}`
		);
	console.log('');
}

function regles(releve, nom) {
	const f = releve.registre.get(nom.replace(/^\./, ''));
	if (!f) return console.log(`\n  .${nom} — absente des 41 maquettes.\n`);
	console.log(`\n  .${f.classe} — déclarations des feuilles de vue, par vue\n`);
	for (const [vue, r] of [...f.definitions].sort())
		for (const [cle, corpsRegle] of r) console.log(`  ${vue}  ${cle}\n        { ${corpsRegle} }`);
	console.log('');
}

function homonymes(releve) {
	const liste = [...releve.registre.values()]
		.filter((f) => f.divergentes)
		.sort((a, b) => a.classe.localeCompare(b.classe));
	console.log(
		`\n  ${liste.length} noms de classe que DEUX vues ou plus déclarent, en donnant au` +
			'\n  MÊME sélecteur des corps différents. Ce ne sont pas des composants' +
			'\n  transverses : ce sont des collisions de nom, et chaque vue garde la sienne.\n'
	);
	for (const f of liste) {
		console.log(`   .${f.classe}  [${f.nature}] — employée par ${f.vuesProduit.join(' ')}`);
		for (const c of f.collisions.slice(0, 3))
			console.log(`       ${c.selecteur}  diverge entre ${c.vues.join(', ')}`);
		if (f.collisions.length > 3)
			console.log(`       … ${f.collisions.length} sélecteurs en collision`);
	}
	console.log('');
}

function rejets(releve) {
	const liste = [...releve.rejets].sort((a, b) => b[1] - a[1]);
	console.log(
		`\n  ${liste.length} jetons relevés dans un contexte de classe d'un script, et REJETÉS` +
			'\n  parce que aucune maquette ne les déclare ni ne les pose : de la prose, des' +
			"\n  valeurs de données, des noms de balise. Aucun n'entre dans l'inventaire.\n"
	);
	console.log('   ' + liste.map(([j, n]) => `${j}(${n})`).join(' '));
	console.log('');
}

function residu(releve) {
	const g = parNature(releve.registre);
	console.log(`\n  ${g['declaree-sans-emploi'].length} classes déclarées par une maquette et`);
	console.log('  employées par aucun balisage — elles ne rendent rien, donc ne se portent pas.\n');
	for (const f of g['declaree-sans-emploi']) console.log(`   .${f.classe.padEnd(32)} ${f.trace}`);
	console.log('');
}

function json(releve) {
	const out = [];
	for (const f of [...releve.registre.values()].sort((a, b) => a.classe.localeCompare(b.classe)))
		out.push({
			classe: f.classe,
			nature: f.nature,
			socle: f.socle,
			trace: f.trace,
			famille: famille(f.classe),
			vues: f.vuesProduit,
			vuesHorsProduit: f.vuesHors
		});
	console.log(JSON.stringify(out, null, '\t'));
}

/* ══ Entrée ═══════════════════════════════════════════════════════════════ */

const args = process.argv.slice(2);
const releve = relever();

if (args.includes('--json')) json(releve);
else if (args.includes('--residu')) residu(releve);
else if (args.includes('--markdown')) markdown(releve);
else if (args.includes('--orphelines')) orphelines(releve);
else if (args.includes('--homonymes')) homonymes(releve);
else if (args.some((a) => a.startsWith('--regles=')))
	regles(releve, args.find((a) => a.startsWith('--regles=')).split('=')[1]);
else if (args.includes('--rejets')) rejets(releve);
else if (args.some((a) => a.startsWith('--classe='))) {
	ficheClasse(releve, args.find((a) => a.startsWith('--classe=')).split('=')[1]);
} else if (args.some((a) => a.startsWith('--vue='))) {
	ficheVue(releve, args.find((a) => a.startsWith('--vue=')).split('=')[1]);
} else if (args.some((a) => a.startsWith('--liste'))) {
	const a = args.find((x) => x.startsWith('--liste'));
	const [, valeur] = a.split('=');
	if (!valeur || valeur === 'transverse') listeTransverses(releve);
	else listePropres(releve, valeur === 'propre' ? null : valeur);
} else if (args.includes('--verifier')) {
	const constats = verifier(releve);
	const g = parNature(releve.registre);
	console.log(
		`\n  P-5 — fermeture de l'inventaire · ${releve.registre.size} classes relevées sur ` +
			`41 maquettes\n  ${g.transverse.length} transverses, ${g.propre.length} propres à une vue, ` +
			`${g['hors-produit'].length} hors produit.\n`
	);
	if (constats.length === 0) {
		console.log('  0 constat. Le §2 couvre tous les composants transverses, et ne cite');
		console.log("  rien qui n'existe pas. L'application n'emploie aucune classe hors");
		console.log('  inventaire.\n');
		console.log('  NON COUVERT PAR CE CONTRÔLE, et il faut le lire :');
		console.log('  • P-5.2 — les variantes déclarées au §2 mais non implémentées : le sens');
		console.log('    inverse suppose une vue achevée, et 36 vues restent à écrire.');
		console.log('  • les classes posées par une expression Svelte non littérale : elles');
		console.log("    échappent au relevé de `src/**`. Aucune n'existe aujourd'hui.\n");
		process.exit(0);
	}
	for (const c of constats) console.log('  ' + c);
	console.log(`\n  ${constats.length} constat(s). P-5 est rouge.\n`);
	process.exit(1);
} else resume(releve);
