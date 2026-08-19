#!/usr/bin/env node
/**
 * verif:jetons — batterie 2 du catalogue (PLAN-DE-REALISATION.md §5).
 *
 * Spécification : `docs/DESIGN.md` §5 « Ce qui est proscrit ». Fondement :
 * ADR-002, RG-DA-01, risque RA-02 (« la dérive du système visuel est une
 * perte silencieuse »).
 *
 * La batterie prouve trois propriétés.
 *
 *   (a) NON-DIVERGENCE DU SOCLE — P-6.1.
 *       La feuille applicative `src/socle.css` est identique, octet pour
 *       octet, au socle extrait de la maquette gelée qui le porte. La
 *       référence est le socle **en ligne** de `mockups/V-07-…html`, pas
 *       `mockups/socle.css` : la réserve portée par `docs/DESIGN.md` §5 P-6.1
 *       et tranchée par `docs/ecarts/ECART-007.md`.
 *
 *   (b) AUCUNE VALEUR EN DUR HORS DU SOCLE — P-1, et les contrôles
 *       mécanisables de P-3, P-4 et P-6.2.
 *       Sur `src/**` moins les feuilles dont l'identité à une source gelée
 *       est prouvée : aucune couleur, aucun espacement, aucun rayon, aucune
 *       ombre, aucune police, aucune durée qui ne passe par un jeton
 *       `var(--…)`.
 *
 *   (c) IDENTITÉ À L'OCTET DES FEUILLES DE VUE PORTÉES — P-6.3.
 *       Toute feuille nommée `V-xx.css` sous `src/` est identique, octet pour
 *       octet, au second bloc `<style>` de `mockups/V-xx-*.html`. C'est la
 *       résolution d'`ECART-011` É-2 : la contrainte n'est pas assouplie,
 *       elle est renversée et resserrée. Dans ce bloc vérifié, les contrôles
 *       de contenu ne s'appliquent pas — « identique au gel » implique et
 *       dépasse « n'emploie que des jetons ». Hors de ce bloc, P-1 s'applique
 *       intégralement. Détail : `verif/feuilles-de-vue.mjs`.
 *
 *   (d) LE STYLE EN LIGNE PROUVÉ PAR LE GEL — P-6.4.
 *       Un attribut `style="…"` d'un composant `src/**\/V-xx.svelte` est admis
 *       si et seulement si la même valeur figure dans `mockups/V-xx-*.html`,
 *       balisage ET styles posés par ses scripts. C'est la résolution
 *       d'`ECART-015` É-3, tranchée par ARB-016 : la même logique que P-6.3,
 *       bornée de la même façon, étendue du bloc `<style>` porté au balisage
 *       porté. Hors de cet ensemble clos, P-1.7 et les autres contrôles P-1
 *       s'appliquent intégralement. Détail : `verif/styles-en-ligne.mjs`.
 *
 *       ÉTENDU AUX RESSOURCES PARTAGÉES PAR ARB-022 (lot T-007e). La portée
 *       d'ARB-016 était les 41 vues, et elle a coûté deux fois : une
 *       convergence vers le gel REFUSÉE faute de portée (`ECART-021`), et un
 *       `flex: 0 0 auto` là où le gel écrit `flex: none`, que RIEN N'A DÉTECTÉ
 *       (`ECART-022` É-5). La portée trop étroite ne protège pas, elle aveugle.
 *       Une ressource partagée n'ayant pas de nom qui la désigne, le verrou
 *       n'est plus le nommage mais le RATTACHEMENT DÉCLARÉ, dans
 *       `verif/references/preuve-par-le-gel.json`, en écriture humaine seule :
 *       un agent ne choisit pas la référence contre laquelle il sera prouvé.
 *       Ce qui ne change pas : la valeur doit figurer au gel, sans quoi P-1
 *       s'applique en entier.
 *
 * Ce script est un INSTRUMENT DE MESURE. Le contournement le plus économique
 * d'une vérification est de modifier la vérification
 * (règles/workflow_agentic.md §4.10).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { racine, CIBLE_SOCLE, CIBLE_POLICES, installer } from './extraire-socle.mjs';
import { DOSSIER_VUES, verifier as verifierFeuillesDeVue } from './feuilles-de-vue.mjs';
import {
	declarationsDe,
	developper,
	ensembleDuGel,
	liaisonsDuComposant,
	lisible,
	MARQUEUR,
	referenceDe,
	RESSOURCES_PROUVEES
} from './styles-en-ligne.mjs';

// ───────────────────────────────────────────────────────────────────────────
// Le vocabulaire des interdits — docs/DESIGN.md §5, P-1
// ───────────────────────────────────────────────────────────────────────────

/** P-1.2 — propriétés d'espacement. Une longueur littérale y est proscrite. */
const PROPS_ESPACEMENT = new Set([
	'margin',
	'margin-top',
	'margin-right',
	'margin-bottom',
	'margin-left',
	'margin-inline',
	'margin-inline-start',
	'margin-inline-end',
	'margin-block',
	'margin-block-start',
	'margin-block-end',
	'padding',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'padding-inline',
	'padding-inline-start',
	'padding-inline-end',
	'padding-block',
	'padding-block-start',
	'padding-block-end',
	'gap',
	'row-gap',
	'column-gap',
	'inset',
	'inset-inline',
	'inset-inline-start',
	'inset-inline-end',
	'inset-block',
	'inset-block-start',
	'inset-block-end',
	'top',
	'right',
	'bottom',
	'left'
]);

/** P-1.3 — rayons. */
const PROPS_RAYON = new Set([
	'border-radius',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-left-radius',
	'border-bottom-right-radius',
	'border-start-start-radius',
	'border-start-end-radius',
	'border-end-start-radius',
	'border-end-end-radius'
]);

/** P-1.4 — typographie. */
const PROPS_TYPO = new Set(['font', 'font-family', 'font-size', 'font-weight', 'line-height']);

/** P-1.5 — élévations. */
const PROPS_OMBRE = new Set(['box-shadow']);

/** P-1.6 — mouvement. */
const PROPS_DUREE = new Set([
	'transition',
	'transition-duration',
	'transition-delay',
	'animation',
	'animation-duration',
	'animation-delay'
]);

/** Exception énumérée : épaisseurs de trait — le système ne les jetonne pas. */
const PROPS_TRAIT = new Set([
	'border-width',
	'border-top-width',
	'border-right-width',
	'border-bottom-width',
	'border-left-width',
	'border-inline-width',
	'border-block-width',
	'outline-width',
	'outline-offset'
]);
const TRAITS_ADMIS = new Set(['1px', '1.5px', '2px', '3px', '4px']);

/**
 * Exceptions admises, énumérées et closes — `docs/DESIGN.md` §5, P-1.
 * Toute autre exception est un écart : cette liste ne s'allonge pas en
 * session d'exécution.
 */
const MOTS_CLES_ADMIS = new Set([
	'0',
	'auto',
	'none',
	'inherit',
	'initial',
	'unset',
	'revert',
	'currentcolor',
	'transparent',
	'100%',
	'100vw',
	'100vh',
	'100dvh'
]);

/** P-1.3 — formes circulaires : avatars, rouets, planche de revue. */
const RAYONS_ADMIS = new Set(['0', '50%', '999px', 'inherit', 'initial', 'unset']);

/** Les 148 noms de couleur CSS. P-1.1 les proscrit au même titre qu'un `#rrggbb`. */
const NOMS_COULEUR = new Set(
	`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
	blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
	crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
	darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
	darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
	dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
	gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
	lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
	lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
	lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
	magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
	mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
	mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
	palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
	powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
	seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
	steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
	yellowgreen`
		.split(/\s+/)
		.filter(Boolean)
);

/** P-3.1 / P-4.1 — bibliothèques d'interface et générateurs de classes. */
const DEPENDANCES_PROSCRITES = [
	/^tailwindcss$/,
	/^@tailwindcss\//,
	/^unocss$/,
	/^@unocss\//,
	/^windicss$/,
	/^twind$/,
	/^@twind\//,
	/^tachyons$/,
	/^bootstrap$/,
	/^bulma$/,
	/^foundation-sites$/,
	/^daisyui$/,
	/^flowbite/,
	/^@mui\//,
	/^@material/,
	/^material-components-web$/,
	/^@smui\//,
	/^svelte-material-ui$/,
	/^@skeletonlabs\//,
	/^bits-ui$/,
	/^melt-ui$/,
	/^@melt-ui\//,
	/^shadcn/,
	/^@radix-ui\//,
	/^@headlessui\//,
	/^@mantine\//,
	/^@chakra-ui\//,
	/^antd$/,
	/^@ant-design\//,
	/^semantic-ui/,
	/^@carbon\//,
	/^@primer\//,
	/^primevue$/,
	/^primeicons$/,
	/^vuetify$/,
	/^@nextui-org\//
];

/** P-4.1 — fichiers de configuration d'un générateur de classes. */
const CONFIGS_PROSCRITES = [
	/^tailwind\.config\.[cm]?[jt]s$/,
	/^uno\.config\.[cm]?[jt]s$/,
	/^windi\.config\.[cm]?[jt]s$/,
	/^twind\.config\.[cm]?[jt]s$/
];

/** P-4.2 — nomenclature utilitaire. La nomenclature du produit est BEM. */
const PREFIXES_UTILITAIRES = new Set(
	`m mt mr mb ml mx my p pt pr pb pl px py w h min-w max-w min-h max-h text font bg fg
	border rounded shadow flex grid inline block hidden gap items justify content self place
	col row order z opacity leading tracking truncate uppercase lowercase capitalize static
	fixed absolute relative sticky overflow cursor float clear space divide ring inset top
	right bottom left size aspect basis grow shrink`
		.split(/\s+/)
		.filter(Boolean)
);

/** RG-NF-08 — aucune fonderie distante. */
const FONDERIES_DISTANTES = [
	/fonts\.googleapis\.com/i,
	/fonts\.gstatic\.com/i,
	/fonts\.bunny\.net/i,
	/use\.typekit\.net/i,
	/fonts\.cdnfonts\.com/i,
	/cdn\.jsdelivr\.net\/[^"')\s]*font/i,
	/unpkg\.com\/[^"')\s]*font/i
];

// ───────────────────────────────────────────────────────────────────────────
// Outillage
// ───────────────────────────────────────────────────────────────────────────

const constats = [];

/**
 * @param {{controle: string, fichier: string, ligne: number, message: string}} c
 *
 * Le marqueur des portions calculées (`verif/styles-en-ligne.mjs`) est rendu
 * lisible ici, et nulle part ailleurs : il doit rester un caractère impossible
 * à écrire dans une source pendant toute l'analyse.
 */
const releve = (c) => constats.push({ ...c, message: lisible(c.message) });

const ligneDe = (texte, index) => texte.slice(0, index).split('\n').length;

/**
 * Neutralise commentaires et chaînes en préservant longueur et sauts de ligne,
 * pour que les décalages et les numéros de ligne restent exacts.
 */
function neutraliser(css) {
	const blanchir = (s) => s.replace(/[^\n]/g, ' ');
	return css
		.replace(/\/\*[\s\S]*?\*\//g, blanchir)
		.replace(/"(?:[^"\\\n]|\\.)*"/g, blanchir)
		.replace(/'(?:[^'\\\n]|\\.)*'/g, blanchir);
}

/** Parcours récursif de `src/`, `static/`, etc. */
function fichiers(base, extensions) {
	const trouves = [];
	const descendre = (dossier) => {
		for (const entree of readdirSync(dossier)) {
			if (entree === 'node_modules' || entree.startsWith('.')) continue;
			const chemin = join(dossier, entree);
			if (statSync(chemin).isDirectory()) descendre(chemin);
			else if (extensions.includes(extname(entree))) trouves.push(chemin);
		}
	};
	if (existsSync(base)) descendre(base);
	return trouves.sort();
}

// ───────────────────────────────────────────────────────────────────────────
// P-1 — Aucune valeur en dur hors du socle
// ───────────────────────────────────────────────────────────────────────────

const RE_LONGUEUR =
	/(?<![\w.#-])\d*\.?\d+(px|rem|em|ch|ex|vw|vh|vmin|vmax|dvw|dvh|pt|pc|cm|mm|in|q)\b/gi;
const RE_DUREE = /(?<![\w.#-])\d*\.?\d+m?s\b/gi;
const RE_HEXA = /#[0-9a-f]{3,8}\b/gi;
const RE_FONCTION_COULEUR = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/gi;
const RE_MOT = /[a-z][a-z0-9-]*/gi;

/** Retire les `var(--…)` d'une valeur : ce qui reste est ce qui est littéral. */
const horsJetons = (valeur) => valeur.replace(/var\(\s*--[a-z0-9-]+[^)]*\)/gi, ' ');

const admis = (jeton) => MOTS_CLES_ADMIS.has(jeton.toLowerCase());

/**
 * Analyse une déclaration `propriete: valeur` et relève ce qui viole P-1.
 * @param {string} propriete
 * @param {string} valeur
 * @param {(controle: string, message: string) => void} signaler
 */
function analyserDeclaration(propriete, valeur, signaler) {
	const prop = propriete.trim().toLowerCase();
	const reste = horsJetons(valeur);

	// P-1.1 — couleur littérale, sur n'importe quelle propriété.
	for (const m of reste.matchAll(RE_HEXA)) {
		signaler('P-1.1', `couleur littérale « ${m[0]} » — attendu un jeton var(--c-…)`);
	}
	for (const m of reste.matchAll(RE_FONCTION_COULEUR)) {
		signaler('P-1.1', `couleur littérale « ${m[1]}(…) » — attendu un jeton var(--c-…)`);
	}
	for (const m of reste.matchAll(RE_MOT)) {
		if (NOMS_COULEUR.has(m[0].toLowerCase()) && !admis(m[0])) {
			signaler('P-1.1', `nom de couleur CSS « ${m[0]} » — attendu un jeton var(--c-…)`);
		}
	}

	// P-1.2 — longueur d'espacement littérale.
	if (PROPS_ESPACEMENT.has(prop)) {
		for (const m of reste.matchAll(RE_LONGUEUR)) {
			if (!admis(m[0])) {
				signaler('P-1.2', `espacement littéral « ${m[0]} » — attendu un jeton var(--e-…)`);
			}
		}
	}

	// P-1.3 — rayon littéral. Exceptions : formes circulaires.
	if (PROPS_RAYON.has(prop)) {
		for (const jeton of reste.split(/[\s/]+/).filter(Boolean)) {
			if (!RAYONS_ADMIS.has(jeton.toLowerCase()) && !admis(jeton)) {
				signaler('P-1.3', `rayon littéral « ${jeton} » — attendu un jeton var(--r-…)`);
			}
		}
	}

	// Exception énumérée : épaisseurs de trait — seules cinq valeurs passent.
	if (PROPS_TRAIT.has(prop)) {
		for (const m of reste.matchAll(RE_LONGUEUR)) {
			if (!TRAITS_ADMIS.has(m[0].toLowerCase()) && !admis(m[0])) {
				signaler(
					'P-1.exc',
					`épaisseur de trait « ${m[0]} » hors des cinq valeurs admises ` +
						'(1px, 1.5px, 2px, 3px, 4px)'
				);
			}
		}
	}

	// P-1.4 — typographie littérale.
	if (PROPS_TYPO.has(prop) && reste.trim() !== '' && !admis(reste.trim())) {
		signaler(
			'P-1.4',
			`${prop} littérale « ${valeur.trim()} » — attendu un jeton var(--f-…/--t-…/--g-…/--i-…)`
		);
	}

	// P-1.5 — ombre littérale.
	if (PROPS_OMBRE.has(prop) && reste.trim() !== '' && !admis(reste.trim())) {
		signaler(
			'P-1.5',
			`box-shadow littérale « ${valeur.trim()} » — attendu var(--o-pose) ou var(--o-flotte)`
		);
	}

	// P-1.6 — durée littérale.
	if (PROPS_DUREE.has(prop)) {
		for (const m of reste.matchAll(RE_DUREE)) {
			if (parseFloat(m[0]) !== 0) {
				signaler(
					'P-1.6',
					`durée littérale « ${m[0]} » — attendu var(--m-vif), var(--m-doux) ou var(--m-ample)`
				);
			}
		}
	}
}

/** Parcourt les déclarations d'un fragment CSS et applique P-1. */
function analyserCss(fragment, fichier, decalageLigne, controlePrefixe = '') {
	const net = neutraliser(fragment);
	const re = /(--[a-z0-9-]+|[a-z-]+)\s*:\s*([^;{}]*?)\s*(?=[;}])/gi;
	for (const m of net.matchAll(re)) {
		const valeur = fragment.slice(m.index + m[0].indexOf(':') + 1, m.index + m[0].length);
		const ligne = decalageLigne + ligneDe(fragment, m.index) - 1;
		analyserDeclaration(m[1], valeur, (controle, message) =>
			releve({ controle: controlePrefixe || controle, fichier, ligne, message })
		);
	}
}

/**
 * Les propriétés que P-1.7 refuse de voir dans un attribut `style`. Exportée :
 * `verif/styles-en-ligne.mjs` s'en sert pour dire, en diagnostic, laquelle de
 * ses déclarations hors du gel emporterait un constat.
 */
export const PROPRIETES_CONTRAINTES = new Set([
	...PROPS_ESPACEMENT,
	...PROPS_RAYON,
	...PROPS_TYPO,
	...PROPS_OMBRE,
	...PROPS_DUREE,
	...PROPS_TRAIT,
	'color',
	'background',
	'background-color',
	'border',
	'border-color',
	'outline',
	'outline-color',
	'fill',
	'stroke'
]);

/**
 * P-1.7 — style en ligne portant l'une des propriétés contraintes, ET P-6.4 —
 * sauf si la maquette gelée de la vue porte elle-même cette valeur (ARB-016).
 *
 * L'ATTRIBUT EST DÉVELOPPÉ AVANT D'ÊTRE ANALYSÉ. Un attribut de composant
 * Svelte n'est pas un texte CSS : `style="width:{l};height:15px{pause}"` porte
 * des interpolations, dont l'une peut ELLE-MÊME ajouter une déclaration.
 * `verif/styles-en-ligne.mjs` en rend les formes possibles, en réduisant au
 * marqueur ce qui n'est pas littéral. Le développement est strictement PLUS
 * SÉVÈRE que la lecture naïve précédente : un `style="color:{c}"` dont `c` est
 * lié à `'red'` relève désormais P-1.1, là où le découpage par `;` ne voyait
 * qu'un accolade opaque.
 *
 * @param {string} source
 * @param {string} fichier
 * @param {{ maquette: string, declarations: Set<string>, origine?: string } | null} preuve
 *   l'ensemble clos de la maquette gelée qui répond du fichier, ou `null` quand
 *   aucune maquette n'en répond — il n'a alors rien qui le prouve, et P-1.7 s'y
 *   applique en entier. `origine` dit par quelle voie le rattachement est fait :
 *   `nommage` (ARB-016) ou `ressource` (ARB-022, déclaration humaine).
 * @returns {number} le nombre de déclarations admises par le gel
 */
function analyserStylesEnLigne(source, fichier, preuve = null) {
	const liaisons = preuve ? liaisonsDuComposant(source) : new Map();
	let admises = 0;

	// style="…" et la directive Svelte style:propriete="…"
	const re = /\bstyle(?::([a-z-]+))?\s*=\s*("([^"]*)"|'([^']*)'|\{([^}]*)\})/gi;
	for (const m of source.matchAll(re)) {
		const ligne = ligneDe(source, m.index);
		const brut = m[3] ?? m[4] ?? m[5] ?? '';
		const texte = m[1] ? `${m[1]}:${brut}` : brut;
		const dejaVues = new Set();
		for (const forme of developper(texte, liaisons)) {
			for (const decl of declarationsDe(forme)) {
				if (dejaVues.has(decl)) continue;
				dejaVues.add(decl);
				const coupe = decl.indexOf(':');
				const nom = decl.slice(0, coupe);
				const valeur = decl.slice(coupe + 1);
				if (!PROPRIETES_CONTRAINTES.has(nom)) continue;
				// P-6.4 — « présent dans la référence » implique et dépasse
				// « n'emploie que des jetons ». Le contrôle est plus strict que
				// P-1, pas plus lâche : on ne peut pas inventer un style.
				if (preuve?.declarations.has(decl)) {
					admises++;
					continue;
				}
				releve({
					controle: 'P-1.7',
					fichier,
					ligne,
					message:
						`style en ligne « ${decl} » — une mise en forme contrainte passe ` +
						"par une classe de l'inventaire, jamais par un attribut style" +
						(preuve
							? `,\n      et cette valeur ne figure pas parmi les ${preuve.declarations.size} ` +
								`valeurs de style de ${preuve.maquette} ` +
								(preuve.origine === 'ressource'
									? '(P-6.4, ARB-022 — ressource partagée rattachée par\n' +
										'      verif/references/preuve-par-le-gel.json, en écriture humaine seule)'
									: '(P-6.4, ARB-016)')
							: '')
				});
				analyserDeclaration(nom, valeur, (controle, message) =>
					releve({ controle: `${controle} (en ligne)`, fichier, ligne, message })
				);
			}
		}
	}
	return admises;
}

/**
 * ARB-022, LA PART QUI N'EST PAS ENCORE UN CONSTAT — ET POURQUOI ELLE EST
 * IMPRIMÉE QUAND MÊME.
 *
 * `flex: 0 0 auto` là où le gel écrit `flex: none` : c'est le second cas
 * mesuré par ARB-022, celui dont l'arbitrage dit qu'il « dit l'essentiel — la
 * portée trop étroite ne protège pas, elle aveugle ». Or l'étendre à
 * `src/lib/coquille/` NE SUFFIT PAS À LE FAIRE VOIR, et il faut le dire :
 * `analyserStylesEnLigne()` ne regarde que les PROPRIÉTÉS CONTRAINTES par P-1
 * — espacements, rayons, typographie, ombres, durées, traits, couleurs.
 * `flex` et `width` n'en sont pas. Le rattachement déclaré ouvre donc la
 * preuve à ces fichiers ; il n'ouvre pas le vocabulaire du contrôle.
 *
 * CE QUE CETTE FONCTION FAIT : elle relève, pour un fichier RATTACHÉ, les
 * déclarations LITTÉRALES dont la propriété figure au gel SOUS UNE AUTRE
 * VALEUR. Ce n'est pas une invention (la propriété est bien du vocabulaire de
 * la maquette), c'est une DIVERGENCE — et c'est exactement la forme du défaut
 * qu'ARB-022 veut rendre visible.
 *
 * CE QU'ELLE NE FAIT PAS, ET C'EST DÉLIBÉRÉ : elle ne relève pas de constat.
 * Elle IMPRIME. Deux raisons, et la seconde est la vraie :
 *
 *   • P-1 ne contraint pas ces propriétés, et un constat P-1.7 sur `flex`
 *     serait un contrôle qui n'existe pas ;
 *   • un lot parallèle porte la coquille au moment où ceci est écrit. Rendre
 *     la divergence bloquante ici la rendrait rouge chez un exécutant qui n'a
 *     pas le droit d'y toucher — et un rouge qu'on ne peut pas corriger est
 *     le meilleur moyen de faire désactiver un contrôle.
 *
 * La passer en constat une fois la convergence acquise est un geste d'une
 * ligne, et il est nommé dans le rapport du lot T-007e sous « écarts à
 * numéroter ». Rendre un défaut DÉTECTABLE vaut mieux que l'ignorer par
 * prudence ; le rendre BLOQUANT est la marche d'après, et elle se décide.
 *
 * LES VALEURS NON LITTÉRALES SONT ÉCARTÉES : `style="width:{n.progres}%"` ne
 * dit pas une valeur, il dit une forme. On ne compare que du comparable —
 * sinon on relèverait comme divergence tout ce qui est calculé, c'est-à-dire
 * ce dont on ne sait rien.
 *
 * @param {string} source
 * @param {string} fichier
 * @param {string} vue
 * @param {{ maquette: string, declarations: Set<string> }} preuve
 * @returns {{fichier: string, ligne: number, vue: string, declaration: string}[]}
 */
function divergerDuGel(source, fichier, vue, preuve) {
	/** Les valeurs que le gel donne à chaque propriété. */
	const auGel = new Map();
	for (const decl of preuve.declarations) {
		const coupe = decl.indexOf(':');
		const nom = decl.slice(0, coupe);
		if (!auGel.has(nom)) auGel.set(nom, new Set());
		auGel.get(nom).add(decl.slice(coupe + 1));
	}

	const trouvees = [];
	const liaisons = liaisonsDuComposant(source);
	const re = /\bstyle(?::([a-z-]+))?\s*=\s*("([^"]*)"|'([^']*)'|\{([^}]*)\})/gi;
	const dejaVues = new Set();
	for (const m of source.matchAll(re)) {
		const ligne = ligneDe(source, m.index);
		const brut = m[3] ?? m[4] ?? m[5] ?? '';
		const texte = m[1] ? `${m[1]}:${brut}` : brut;
		for (const forme of developper(texte, liaisons)) {
			for (const decl of declarationsDe(forme)) {
				if (decl.includes(MARQUEUR)) continue; // rien de comparable
				if (preuve.declarations.has(decl)) continue; // prouvé
				const coupe = decl.indexOf(':');
				const nom = decl.slice(0, coupe);
				if (PROPRIETES_CONTRAINTES.has(nom)) continue; // déjà P-1.7
				if (!auGel.has(nom)) continue; // propriété absente du gel : muet
				const cle = `${fichier}:${ligne}:${decl}`;
				if (dejaVues.has(cle)) continue;
				dejaVues.add(cle);
				trouvees.push({
					fichier,
					ligne,
					vue,
					declaration:
						`${lisible(decl)} — le gel écrit ` +
						[...auGel.get(nom)].map((v) => `${nom}:${lisible(v)}`).join(' ou ')
				});
			}
		}
	}
	return trouvees;
}

// ───────────────────────────────────────────────────────────────────────────
// P-4.2 — classes utilitaires écrites à la main
// ───────────────────────────────────────────────────────────────────────────

function analyserUtilitaires(fragment, fichier, decalageLigne) {
	const net = neutraliser(fragment);
	// Une règle terminale : un sélecteur, un bloc sans bloc imbriqué. `[^{}]+`
	// ne peut pas franchir une accolade : le sélecteur est donc tout ce qui
	// précède l'accolade ouvrante depuis la règle précédente.
	const re = /([^{}]+)\{([^{}]*)\}/g;
	for (const m of net.matchAll(re)) {
		const selecteur = (m[1].split(';').pop() ?? '').trim();
		const corps = m[2];
		const declarations = corps.split(';').filter((d) => d.trim() !== '');
		if (declarations.length !== 1) continue;
		if (!/^\.[a-z][a-z0-9-]*$/i.test(selecteur)) continue;
		if (selecteur.includes('__') || selecteur.includes('--')) continue; // BEM
		const nom = selecteur.slice(1).toLowerCase();
		const tete = nom.split('-')[0];
		if (!PREFIXES_UTILITAIRES.has(tete) && !PREFIXES_UTILITAIRES.has(nom)) continue;
		releve({
			controle: 'P-4.2',
			fichier,
			ligne: decalageLigne + ligneDe(fragment, m.index) - 1,
			message:
				`classe utilitaire « ${selecteur} » — une seule déclaration, nomenclature ` +
				'utilitaire. La nomenclature du produit est BEM (ADR-002, DESIGN.md §5 P-4)'
		});
	}
}

// ───────────────────────────────────────────────────────────────────────────
// P-6.2 — une règle du socle redéclarée dans une feuille de vue
// ───────────────────────────────────────────────────────────────────────────

/**
 * Relève les sélecteurs d'un fragment CSS.
 *
 * LES ÉTAPES D'UN `@keyframes` NE SONT PAS DES SÉLECTEURS — ÉCART-011 É-3.
 * `@keyframes tourne { to { transform: rotate(360deg); } }` fait apparaître
 * `to` là où l'analyse naïve attend un sélecteur. Le socle en déclare cinq
 * (`glisse`, `monte`, `descend`, `tourne-notif`, `tourne`, src/socle.css:302 à
 * 465), dont les étapes `from` et `to` entraient donc dans l'ensemble des
 * sélecteurs du socle : TOUTE feuille de vue portant une animation nommée
 * était rouge d'avance en P-6.2, quelle qu'elle soit. C'était un défaut
 * d'instrument, pas du code mesuré.
 *
 * La profondeur d'accolades est donc suivie, et le corps d'un `@keyframes` est
 * traversé sans en tirer de sélecteur. Les autres at-règles à bloc — `@media`,
 * `@supports`, `@layer`, `@container` — en portent de vrais : elles sont
 * traversées normalement.
 */
export function selecteursDe(fragment) {
	const net = neutraliser(fragment);
	const trouves = new Map();
	// Un prélude est tout ce qui précède `{` depuis la dernière accolade ou le
	// dernier `;`. On avance accolade par accolade en tenant la profondeur, et
	// la profondeur à laquelle un `@keyframes` a été ouvert.
	let profondeur = 0;
	let profondeurKeyframes = -1;
	let debutPrelude = 0;
	for (let i = 0; i < net.length; i++) {
		const c = net[i];
		if (c === '{') {
			const prelude = (net.slice(debutPrelude, i).split(';').pop() ?? '').trim();
			const dansKeyframes = profondeurKeyframes !== -1;
			if (/^@(-[a-z]+-)?keyframes\b/i.test(prelude)) {
				profondeurKeyframes = profondeur;
			} else if (!dansKeyframes && !prelude.startsWith('@')) {
				for (const sel of prelude.split(',')) {
					const normalise = sel.trim().replace(/\s+/g, ' ');
					if (normalise === '' || normalise.startsWith('/')) continue;
					if (!trouves.has(normalise)) trouves.set(normalise, ligneDe(fragment, debutPrelude));
				}
			}
			profondeur++;
			debutPrelude = i + 1;
		} else if (c === '}') {
			profondeur = Math.max(0, profondeur - 1);
			if (profondeurKeyframes !== -1 && profondeur <= profondeurKeyframes) {
				profondeurKeyframes = -1;
			}
			debutPrelude = i + 1;
		}
	}
	return trouves;
}

// ───────────────────────────────────────────────────────────────────────────
// Exécution
//
// Le corps de la batterie est enfermé dans `executer()`, comme
// `verif/extraire-socle.mjs` le fait déjà pour le sien. Motif : les
// analyseurs ci-dessus doivent rester importables par les unitaires de
// `verif/jetons.test.ts` sans qu'un simple import ne déclenche l'analyse ni un
// `process.exit`. Un instrument dont les règles ne sont pas elles-mêmes
// testables ne prouve pas qu'il sait dire non (PLAN §12, RA-01).
// ───────────────────────────────────────────────────────────────────────────

function executer() {
	const rel = (chemin) => relative(racine, chemin).split('\\').join('/');

	// ── (a) P-6.1 — non-divergence du socle ────────────────────────────────────
	let socleConforme = true;
	try {
		const { ecarts } = installer({ verifier: true });
		for (const e of ecarts) {
			socleConforme = false;
			releve({
				controle: 'P-6.1',
				fichier: e.fichier.split('\\').join('/'),
				ligne: 0,
				message:
					`${e.motif}` +
					(e.attendue ? `\n      attendue : ${e.attendue}\n      obtenue  : ${e.obtenue}` : '') +
					(e.diff ? `\n${e.diff}` : '')
			});
		}
	} catch (erreur) {
		socleConforme = false;
		releve({ controle: 'P-6.1', fichier: CIBLE_SOCLE, ligne: 0, message: erreur.message });
	}

	// ── (c) P-6.3 — identité à l'octet des feuilles de vue portées ─────────────
	//    ECART-011 É-2. Une feuille de vue portée d'une maquette gelée est
	//    identique À L'OCTET au second bloc <style> de sa maquette. Le contrôle
	//    est plus strict que P-1, pas plus lâche : « identique au gel » implique
	//    et dépasse « n'emploie que des jetons ». Détail et motifs :
	//    verif/feuilles-de-vue.mjs, docs/DESIGN.md §5 P-6.3.
	let feuilles = [];
	try {
		const resultat = verifierFeuillesDeVue();
		feuilles = resultat.feuilles;
		for (const e of resultat.ecarts) {
			releve({
				controle: 'P-6.3',
				fichier: e.fichier,
				ligne: e.ligne,
				message:
					e.motif +
					(e.detail
						? `\n      attendue (ligne ${e.detail.ligne}) : ${e.detail.attendue}` +
							`\n      obtenue  (ligne ${e.detail.ligne}) : ${e.detail.obtenue}` +
							`\n      ${e.detail.lignes[0]} ligne(s) au gel, ${e.detail.lignes[1]} dans la feuille portée` +
							`\n      Réinstaller : node verif/feuilles-de-vue.mjs ${e.vue} --installer`
						: '')
			});
		}
	} catch (erreur) {
		releve({ controle: 'P-6.3', fichier: DOSSIER_VUES, ligne: 0, message: erreur.message });
	}

	// ── (b) P-1, P-4.2, P-6.2 sur src/ moins les feuilles vérifiées ────────────
	//    Deux feuilles seulement échappent à l'analyse de contenu, et pour la
	//    même raison : leur identité à une source gelée est prouvée par ailleurs,
	//    ce qui est strictement plus fort. `src/socle.css` par P-6.1, une
	//    `V-xx.css` conforme par P-6.3. Une feuille portée qui DIVERGE reste
	//    analysée : elle n'est plus le gel, donc P-1 lui est dû en entier.
	const cheminSocle = join(racine, CIBLE_SOCLE);
	const selecteursSocle = existsSync(cheminSocle)
		? new Set(selecteursDe(readFileSync(cheminSocle, 'utf8')).keys())
		: new Set();

	const exclues = new Set([
		cheminSocle,
		...feuilles.filter((f) => f.identique).map((f) => f.chemin)
	]);
	const aAnalyser = fichiers(join(racine, 'src'), ['.css', '.svelte', '.html']).filter(
		(f) => !exclues.has(f)
	);

	/* ── (d) P-6.4 — l'ensemble clos des styles en ligne du gel ──────────────
	   ARB-016, `ECART-015` É-3, ÉTENDU PAR ARB-022.

	   DEUX VOIES DE RATTACHEMENT, ET UNE SEULE PORTE :

	     • LE NOMMAGE — un composant `V-xx.svelte` a la maquette de son nom. Le
	       verrou est le nom lui-même : hériter du gel de V-38, c'est du même
	       coup se faire comparer à `mockups/V-38-*.html` au pixel près.
	     • LE RATTACHEMENT DÉCLARÉ (ARB-022) — une ressource partagée n'a pas de
	       nom qui la désigne. `verif/references/preuve-par-le-gel.json`, en
	       ÉCRITURE HUMAINE SEULE, dit quelle maquette répond d'elle : pour
	       `src/lib/coquille/`, c'est V-37. Un agent ne choisit pas la référence
	       contre laquelle il sera prouvé.

	   Tout fichier hors de ces deux voies n'a aucune maquette qui réponde de
	   lui, et P-1.7 s'y applique en entier. Une maquette illisible ou divergente
	   du GEL.md ne prouve RIEN : le constat est relevé, et le fichier reste
	   analysé comme s'il n'avait pas de preuve. */
	/** @type {{fichier: string, vue: string, origine: string, maquette: string,
	            au_gel: number, admises: number}[]} */
	const composantsDeVueVus = [];
	/** ARB-022, la part encore invisible — voir le rapport, plus bas. */
	/** @type {{fichier: string, ligne: number, vue: string, declaration: string}[]} */
	const divergencesHorsP17 = [];

	for (const chemin of aAnalyser) {
		const source = readFileSync(chemin, 'utf8');
		const nom = rel(chemin);
		const reference = referenceDe(chemin);
		const vue = reference?.vue ?? null;
		/** @type {{maquette: string, declarations: Set<string>} | null} */
		let preuve = null;
		if (vue) {
			try {
				preuve = { ...ensembleDuGel(vue), origine: reference?.origine ?? 'nommage' };
			} catch (erreur) {
				releve({ controle: 'P-6.4', fichier: nom, ligne: 0, message: erreur.message });
			}
		}

		/** @type {{css: string, ligne: number}[]} */
		const fragments = [];
		if (extname(chemin) === '.css') {
			fragments.push({ css: source, ligne: 1 });
		} else {
			for (const m of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
				fragments.push({
					css: m[1],
					ligne: ligneDe(source, m.index + m[0].indexOf('>') + 1)
				});
			}
		}

		for (const { css, ligne } of fragments) {
			analyserCss(css, nom, ligne);
			analyserUtilitaires(css, nom, ligne);
			// P-6.2 — redéclaration d'une règle du socle.
			for (const [sel, lg] of selecteursDe(css)) {
				if (selecteursSocle.has(sel)) {
					releve({
						controle: 'P-6.2',
						fichier: nom,
						ligne: ligne + lg - 1,
						message: `le sélecteur « ${sel} » est déjà déclaré par le socle — surcharge interdite`
					});
				}
			}
		}

		if (extname(chemin) !== '.css') {
			const admises = analyserStylesEnLigne(source, nom, preuve);
			if (vue && preuve) {
				composantsDeVueVus.push({
					fichier: nom,
					vue,
					origine: reference?.origine ?? 'nommage',
					maquette: preuve.maquette,
					au_gel: preuve.declarations.size,
					admises
				});
				divergencesHorsP17.push(...divergerDuGel(source, nom, vue, preuve));
			}
		}

		// RG-NF-08 — aucune fonderie distante dans les gabarits de l'application.
		for (const motif of FONDERIES_DISTANTES) {
			const m = source.match(motif);
			if (m) {
				releve({
					controle: 'RG-NF-08',
					fichier: nom,
					ligne: ligneDe(source, source.indexOf(m[0])),
					message: `référence à une fonderie distante « ${m[0]} » — le produit est auto-hébergeable`
				});
			}
		}
	}

	// ── RG-NF-08 sur les actifs statiques servis ───────────────────────────────
	for (const chemin of fichiers(join(racine, 'static'), ['.css', '.html'])) {
		const source = readFileSync(chemin, 'utf8');
		for (const motif of [
			...FONDERIES_DISTANTES,
			/url\(\s*['"]?https?:/i,
			/@import\s+url\(\s*['"]?https?:/i
		]) {
			const m = source.match(motif);
			if (m) {
				releve({
					controle: 'RG-NF-08',
					fichier: rel(chemin),
					ligne: ligneDe(source, source.indexOf(m[0])),
					message: `référence distante « ${m[0]} » dans un actif servi — RG-NF-08`
				});
			}
		}
	}

	// ── P-3.1 / P-4.1 — dépendances et configurations proscrites ───────────────
	const paquet = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8'));
	for (const champ of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies'
	]) {
		for (const nom of Object.keys(paquet[champ] ?? {})) {
			const motif = DEPENDANCES_PROSCRITES.find((m) => m.test(nom));
			if (motif) {
				releve({
					controle: 'P-3.1/P-4.1',
					fichier: 'package.json',
					ligne: 0,
					message: `dépendance proscrite « ${nom} » (${champ}) — ADR-002`
				});
			}
		}
	}
	for (const entree of readdirSync(racine)) {
		if (CONFIGS_PROSCRITES.some((m) => m.test(entree))) {
			releve({
				controle: 'P-4.1',
				fichier: entree,
				ligne: 0,
				message: `configuration de générateur de classes utilitaires — ADR-002`
			});
		}
	}

	// ── P-3.2 — import de feuille de style tierce ──────────────────────────────
	for (const chemin of fichiers(join(racine, 'src'), ['.css', '.svelte', '.ts', '.js', '.html'])) {
		const source = readFileSync(chemin, 'utf8');
		for (const m of source.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)) {
			const cible = m[1];
			if (!/^[./]|^\$lib\//.test(cible)) {
				releve({
					controle: 'P-3.2',
					fichier: rel(chemin),
					ligne: ligneDe(source, m.index),
					message: `import d'une feuille de style tierce « ${cible} » — ADR-002`
				});
			}
		}
		for (const m of source.matchAll(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)/g)) {
			if (!/^[./]|^\$lib\//.test(m[1])) {
				releve({
					controle: 'P-3.2',
					fichier: rel(chemin),
					ligne: ligneDe(source, m.index),
					message: `@import d'une feuille de style tierce « ${m[1]} » — ADR-002`
				});
			}
		}
	}

	// ───────────────────────────────────────────────────────────────────────────
	// Rapport
	// ───────────────────────────────────────────────────────────────────────────

	/**
	 * Contrôles de la §5 non outillés à ce lot, avec leur motif. Ils sont
	 * énoncés à chaque exécution : une batterie qui tait ce qu'elle ne couvre
	 * pas fait croire à une couverture qu'elle n'a pas (RA-01).
	 */
	const NON_OUTILLES = [
		[
			'P-2',
			"croisement sélecteur ↔ jeton : l'inventaire fermé du §2 est désormais complet " +
				'(T-009b) et `node verif/inventaire-composants.mjs --json` en donne la liste ' +
				'exploitable. Reste à écrire, la prémisse est levée.'
		],
		['P-4.3', 'analyse des gabarits : même prémisse levée par T-009b. Reste à écrire.'],
		['P-7', 'balisage des composants : 4 vues sur 41 implémentées — phase 1, batteries 5 et 10'],
		['P-8', 'balisage des actions : 4 vues sur 41 implémentées — phase 1, batterie 7']
	];

	/* P-5 est OUTILLÉ depuis T-009b — `pnpm verif:inventaire`, chaîné dans `pnpm verify`.
	   Il ne figure donc plus ici : une batterie qui se déclarerait non outillée alors
	   qu'elle l'est ferait douter des quatre autres lignes de cette liste. */

	console.log('verif:jetons — batterie 2 « jetons et non-divergence du socle »');
	console.log(`  source du socle : mockups/V-07-accueil-contributeur.html, premier bloc <style>`);
	console.log(`  feuille contrôlée : ${CIBLE_SOCLE} (exclue de l'analyse P-1, c'est la frontière)`);
	console.log(
		`  feuilles de vue portées : ` +
			(feuilles.length
				? feuilles.map((f) => `${f.fichier} ${f.identique ? '= gel' : 'DIVERGENTE'}`).join(', ')
				: `aucune (convention : ${DOSSIER_VUES}/V-xx.css, P-6.3)`)
	);
	/* P-6.4 — LE RAPPORT NOMME CE QUI PROUVE QUOI, à chaque exécution. C'est le
	   même garde-fou que celui d'ARB-012 pour les zones : un style admis par le
	   gel ne peut pas l'être en silence, ni sans que la maquette qui le prouve
	   soit citée. */
	console.log(
		`  styles en ligne prouvés par le gel (P-6.4) : ` +
			(composantsDeVueVus.length
				? '\n' +
					composantsDeVueVus
						.map(
							(c) =>
								`      ${c.fichier} ← ${c.maquette} ` +
								`[${c.origine === 'nommage' ? 'nommage, ARB-016' : 'ressource déclarée, ARB-022'}] : ` +
								`${c.au_gel} valeur(s) de style au gel, ${c.admises} déclaration(s) admise(s)`
						)
						.join('\n')
				: `aucun (convention : src/**/V-xx.svelte, ARB-016)`)
	);
	/* ARB-022 — LE RATTACHEMENT EST NOMMÉ À CHAQUE EXÉCUTION, comme le banc
	   nomme ses zones, ses états de zone et ses révélations. Une preuve par le
	   gel qui s'appliquerait en silence à un dossier serait indiscernable d'une
	   tolérance. */
	const ressources = Object.entries(RESSOURCES_PROUVEES.ressources ?? {});
	console.log(
		`  ressources partagées rattachées à une maquette (ARB-022, écriture humaine seule) : ` +
			(ressources.length
				? '\n' + ressources.map(([p, d]) => `      ${p}/** ← ${d.maquette}`).join('\n')
				: 'aucune — ne rien écrire n’ouvre rien')
	);
	/* LA PART ENCORE INVISIBLE, DITE PLUTÔT QUE TUE (RA-01). Voir
	   `divergerDuGel()` pour le motif : P-1 ne contraint pas ces propriétés,
	   donc aucun constat ne leur correspond aujourd'hui. Les taire ferait
	   croire que la portée étendue les couvre. */
	if (divergencesHorsP17.length) {
		console.log(
			`  divergences avec le gel HORS du vocabulaire de P-1 — signalées, NON bloquantes :`
		);
		for (const d of divergencesHorsP17) {
			console.log(`      ${d.fichier}:${d.ligne}  ${d.declaration}  (gel de ${d.vue})`);
		}
		console.log(
			`      ARB-022 les veut visibles ; P-1 ne contraint pas ces propriétés, donc\n` +
				`      aucun constat ne leur répond encore. Les passer en constat est la marche\n` +
				`      d'après, et elle se décide — elle ne se prend pas par surprise.`
		);
	}
	console.log(`  polices servies localement : ${CIBLE_POLICES}/`);
	console.log(`  fichiers analysés : ${aAnalyser.length}`);

	if (constats.length > 0) {
		console.error(`\nverif:jetons — ÉCHEC : ${constats.length} constat(s).\n`);
		const parControle = new Map();
		for (const c of constats) {
			if (!parControle.has(c.controle)) parControle.set(c.controle, []);
			parControle.get(c.controle).push(c);
		}
		for (const [controle, liste] of [...parControle].sort()) {
			console.error(`  ${controle} — ${liste.length} constat(s)`);
			for (const c of liste) {
				console.error(`    ${c.fichier}${c.ligne ? `:${c.ligne}` : ''} — ${c.message}`);
			}
			console.error('');
		}
		console.error(
			'Le système visuel est une contrainte, pas une préférence : toute valeur qui\n' +
				"n'est pas un jeton du socle est un écart, y compris si elle est numériquement\n" +
				'identique au jeton (ADR-002). La voie normale est un jeton existant ; un jeton\n' +
				"nouveau est une modification d'une source gelée, donc un arbitrage.\n" +
				'Spécification : docs/DESIGN.md §5. Réinstaller le socle : pnpm socle:extraire.\n'
		);
		process.exit(1);
	}

	console.log(`\n  (a) P-6.1 non-divergence du socle : ${socleConforme ? 'conforme' : 'ÉCHEC'}`);
	console.log('  (b) P-1.1 à P-1.7, P-3.1, P-3.2, P-4.1, P-4.2, P-6.2, RG-NF-08 : aucun constat');
	console.log(
		`  (c) P-6.3 identité à l'octet des feuilles de vue portées : ` +
			(feuilles.length
				? `${feuilles.length} feuille(s), toutes identiques au gel`
				: 'aucune feuille portée à ce jour')
	);
	console.log(
		`  (d) P-6.4 styles en ligne prouvés par le gel : ` +
			(composantsDeVueVus.length
				? `${composantsDeVueVus.reduce((n, c) => n + c.admises, 0)} déclaration(s) admise(s) sur ` +
					`${composantsDeVueVus.filter((c) => c.origine === 'nommage').length} composant(s) de vue ` +
					`et ${composantsDeVueVus.filter((c) => c.origine === 'ressource').length} fichier(s) de ` +
					`ressource partagée rattachée, aucune hors du gel` +
					(divergencesHorsP17.length
						? ` — ${divergencesHorsP17.length} divergence(s) hors du vocabulaire de P-1, signalée(s) plus haut`
						: '')
				: 'aucun composant de vue à ce jour')
	);
	console.log('\n  Non outillé à ce lot, et déclaré comme tel :');
	for (const [controle, motif] of NON_OUTILLES) console.log(`    ${controle} — ${motif}`);
	console.log('\nverif:jetons — conforme.');
	process.exit(0);
}

// ── Exécution directe ──────────────────────────────────────────────────────
if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
	executer();
}
