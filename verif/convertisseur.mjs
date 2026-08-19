#!/usr/bin/env node
/**
 * verif:convertisseur — L'UNICITÉ DU CONVERTISSEUR `document ⇄ Markdown`.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI IL EXISTE, ET POURQUOI MAINTENANT
 *
 * `ADR-004` dit lui-même que la batterie 4 « prouve la propriété, pas
 * l'unicité », et renvoie le contrôle d'unicité « au lot d'export (M13) »,
 * c'est-à-dire à T-045, vague 7. `ARB-051` a tranché : ce délai n'est pas
 * tenable, parce que `T-021` — « Markdown à la frappe », vague 2 — est
 * littéralement un lot de conversion Markdown. Une interdiction dont le
 * contrôle arrive cinq vagues après la première occasion de la violer est
 * DÉCLARATIVE, et ce dépôt tient : bloquant > vérifiable > déclaratif.
 *
 * BATTERIE PROPRE, ET NON EXTENSION DE LA BATTERIE 5, pour trois raisons :
 *   1. la batterie 5 porte `P-01` et nomme `ADR-005` dans son rapport ; un
 *      rouge de convertisseur y arriverait sous le mauvais nom ;
 *   2. `pnpm verify:lot` cite les batteries par leur nom : `ADR-004` a besoin
 *      du sien pour figurer à un contrat de tâche ;
 *   3. `verif/fraicheur.mjs` est un instrument du périmètre humain — l'étendre
 *      voudrait dire modifier l'instrument qui mesure une AUTRE propriété.
 *
 * Trois de ses fonctions sont en revanche RÉUTILISÉES telles quelles —
 * `denuder`, `ligneDe`, `DOSSIERS` — plutôt que recopiées : le dénudement est
 * la partie délicate, et deux dénudements divergeraient.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES PROPRIÉTÉS PROUVÉES
 *
 *   A1 — AUCUNE REDÉCLARATION DES DEUX ENTRÉES. `serialiserEnMarkdown` et
 *        `analyserMarkdown` ne sont déclarés qu'à l'implémentation unique.
 *   A2 — AUCUN SECOND CONVERTISSEUR DÉGUISÉ. Un convertisseur se reconnaît à
 *        deux traits simultanés : il écrit les FORMES du Markdown, et il
 *        touche au FORMAT CANONIQUE. Hors de l'implémentation, aucun fichier
 *        de produit ne réunit les deux. Un convertisseur anonyme — « fonction
 *        utilitaire d'import », « chemin rapide », « transformation ad hoc
 *        dans un test » — les réunit forcément : il ne peut convertir un
 *        document ni sans écrire les formes, ni sans nommer les nœuds.
 *
 *        LA SECONDE CONDITION N'EST PAS UN CONFORT, ET ELLE A ÉTÉ MESURÉE.
 *        Sans elle, le contrôle rougissait sur `src/vues/V-16.svelte:149-172`,
 *        qui écrit quatre formes — et qui est la TRANSCRIPTION FIDÈLE de
 *        `window.blocEnLignes` du gel (`mockups/V-16-comparaison.html:1864-1878`,
 *        « représentation linéaire d'un bloc, façon texte source. C'est elle
 *        qui est comparée ligne à ligne en mode Texte »). Cette fonction ne
 *        convertit PAS le document canonique : son entrée est le
 *        `BlocDeContenu` de `seeds/corpus.ts`, la forme que T-014 a refusé de
 *        transposer. Faire rougir une transcription du gel, c'est crier faux —
 *        et « une batterie qui crie faux ne se lit plus »
 *        (`verif/fraicheur.mjs`, sur un cas jumeau).
 *
 *        ET LE CONTRÔLE MORDRA LE JOUR OÙ IL LE FAUT : quand V-16 comparera de
 *        vrais documents canoniques, son fichier touchera au format, et la
 *        fonction devra passer par l'implémentation unique. La condition
 *        n'affaiblit pas la règle, elle la place là où ADR-004 la place.
 *   A2b — LES FICHIERS EXEMPTÉS DE A2 SONT DES CLIENTS. Chacun doit IMPORTER
 *        l'implémentation : un fichier autorisé à porter les formes sans
 *        déléguer serait précisément la cachette d'un second convertisseur.
 *   A3 — AUCUN CHEMIN DÉTOURNÉ. Un fichier qui nomme Markdown ET touche au
 *        format canonique importe l'implémentation.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA LECTURE EST DÉNUDÉE, ET BORNÉE AUX LITTÉRAUX
 *
 * Ce dépôt commente en citant les formes : l'en-tête de `markdown.ts` DÉCRIT
 * les conventions en prose plutôt que de les citer, précisément parce que
 * `P-20` a montré qu'une forme citée dans un commentaire est lue comme du
 * balisage. Les commentaires sont donc blanchis (`denuder`), et les marqueurs
 * ne sont cherchés que dans les LITTÉRAUX — chaînes et expressions
 * régulières —, parce qu'un `**` de code est l'exponentiation et non du gras.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * Usage :
 *   node verif/convertisseur.mjs              le contrôle — 1 dès un constat
 *   node verif/convertisseur.mjs --sonde=<g>  la preuve qu'il sait dire non
 *   node verif/convertisseur.mjs --marqueurs  ce qui a été relevé, décrit
 *
 * Les sondes : `second-convertisseur`, `nom-redeclare`, `chemin-detourne`.
 * Sous sonde, un fichier de synthèse est ajouté au périmètre EN MÉMOIRE — rien
 * n'est écrit sur le disque — et le code de retour est inversé.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { DOSSIERS, RACINE, blocsScript, denuder, ligneDe } from './fraicheur.mjs';

/** L'implémentation unique. Elle seule a le droit d'écrire les formes. */
export const IMPLEMENTATION = 'src/lib/contenu/markdown.ts';

/** Les deux entrées, et il n'y en a pas de troisième. */
export const ENTREES = ['serialiserEnMarkdown', 'analyserMarkdown'];

/**
 * LES FICHIERS EXEMPTÉS DU SEUL CONTRÔLE A2, ET LE MOTIF DE CHACUN. Ils
 * PORTENT les formes parce que c'est leur objet ; ils restent soumis à A1, à
 * A2b — donc ils doivent importer l'implémentation — et à A3.
 */
export const EXEMPTES_DE_A2 = {
	'src/lib/contenu/markdown.test.ts':
		'l’unitaire de l’implémentation : son objet est d’épingler les formes écrites',
	'src/lib/contenu/aller-retour.ts':
		'la batterie 4 : ses cas nommés portent des textes adverses qui CITENT les formes ' +
		'en contenu, pour prouver qu’elles sont échappées',
	'src/lib/contenu/aller-retour.test.ts': 'l’unitaire de la batterie 4, pour la même raison'
};

/**
 * LES MARQUEURS DE CONSTRUCTION MARKDOWN — liste FERMÉE, et chacun est une
 * forme que seul un convertisseur écrit.
 */
export const MARQUEURS = [
	['clôture de bloc', /```/],
	['gras', /\*\*/],
	['barré', /~~/],
	['surligné', /==/],
	['souligné', /\+\+/],
	['lien interne', /\[\[/],
	['case de tâche', /-\s\[[ x]\]/],
	['conteneur', /:::/],
	['filet de tableau', /\|\s*:?-{3,}/],
	['titre en tête de ligne', /\^#/],
	['citation en tête de ligne', /\^>/],
	['puce en tête de ligne', /\^-\s/],
	['numéro en tête de ligne', /\^\\d\+\\\./],
	/* Les quatre formes ÉCRITES, et non lues : un convertisseur qui écrit ne
	   porte pas de motif ancré, il porte le préfixe lui-même. Les motifs
	   ci-dessous sont ancrés SUR LE LITTÉRAL, de sorte qu'une prose contenant
	   un dièse au milieu n'en soit pas un. */
	['préfixe de titre', /^#{1,6} /],
	['préfixe de puce', /^- $/],
	['préfixe de citation', /^> $/],
	['préfixe de numéro', /^\d+\. $/],
	['destination de lien', /\]\(/],
	['forme d’image', /!\[/]
];

/** Ce qui « touche au format canonique » : le schéma, ou son entrée unique. */
const FORMAT_CANONIQUE = /analyserDocument|verifierDocument|schemaDocument|contenu\/document/;

/**
 * LES NOMS DE NŒUDS DU FORMAT CANONIQUE — `document.ts`, les douze natures de
 * blocs, le nœud de texte et les cinq conteneurs. Un convertisseur du document
 * canonique en nomme forcément plusieurs : il aiguille dessus.
 */
const NOEUDS_DU_FORMAT = [
	'paragraph',
	'heading',
	'codeBlock',
	'bulletList',
	'orderedList',
	'listItem',
	'taskList',
	'taskItem',
	'blockquote',
	'alerte',
	'table',
	'tableRow',
	'tableHeader',
	'tableCell',
	'image',
	'horizontalRule',
	'diagramme',
	'lienInterne'
];

/** Combien de noms de nœuds du format un fichier nomme, dans ses littéraux. */
function noeudsNommes(nu, extension) {
	const vus = new Set();
	for (const l of litteraux(nu, extension)) {
		for (const n of NOEUDS_DU_FORMAT) if (l.texte === n) vus.add(n);
	}
	return vus;
}

/** Le fichier touche-t-il au format canonique ? Deux façons, et deux seules. */
function toucheAuFormat(nu, extension) {
	return FORMAT_CANONIQUE.test(nu) || noeudsNommes(nu, extension).size >= 2;
}

/** Ce qui « nomme Markdown » : le mot, quelle que soit la casse. */
const NOMME_MARKDOWN = /markdown/i;

const EXTENSIONS = new Set(['.ts', '.js', '.svelte', '.mjs']);

/* ═══ Le périmètre ═════════════════════════════════════════════════════════ */

function fichiersDe(dossier) {
	const out = [];
	if (!existsSync(dossier)) return out;
	for (const entree of readdirSync(dossier)) {
		if (entree === 'node_modules' || entree.startsWith('.')) continue;
		const chemin = join(dossier, entree);
		if (statSync(chemin).isDirectory()) out.push(...fichiersDe(chemin));
		else if (EXTENSIONS.has(extname(entree))) out.push(chemin);
	}
	return out;
}

/**
 * Le périmètre : le PRODUIT. `verif/` est le harnais et `mockups/` est le gel —
 * le gel n'est pas un second convertisseur, c'est la SOURCE des deux formes
 * qu'ARB-049 retient.
 */
export function perimetre() {
	return DOSSIERS.flatMap((d) => fichiersDe(join(RACINE, d)))
		.map((c) => relative(RACINE, c))
		.sort();
}

/* ═══ Les littéraux ════════════════════════════════════════════════════════ */

/**
 * LES ZONES DE CODE d'un fichier. Pour un composant, ce sont ses blocs
 * `<script>` et EUX SEULS : le balisage ne convertit pas, et il porte de la
 * prose française dont les apostrophes droites ne sont pas des chaînes — les
 * lire comme telles faisait voir cinq formes Markdown dans `V-16.svelte`, qui
 * n'en écrit aucune. C'est le même piège que `denuder` traite pour les
 * commentaires, et il se traite au même endroit.
 */
export function zonesDeCode(nu, extension) {
	if (extension !== '.svelte') return [{ debut: 0, fin: nu.length }];
	return blocsScript(nu);
}

/**
 * Les LITTÉRAUX d'une source dénudée — chaînes simples, doubles, gabarits, et
 * expressions régulières. Rendus avec leur position, pour que le rapport
 * nomme la ligne.
 */
export function litteraux(nu, extension) {
	return zonesDeCode(nu, extension).flatMap((z) => litterauxDeZone(nu, z.debut, z.fin));
}

function litterauxDeZone(nu, depart, arret) {
	const out = [];
	let i = depart;
	const debutDeRegex = /[([,:=!&|?+\-*/%<>~^{};\s]/;
	while (i < arret) {
		const c = nu[i];
		if (c === "'" || c === '"' || c === '`') {
			const debut = i;
			i += 1;
			while (i < arret && nu[i] !== c) {
				if (nu[i] === '\\') i += 1;
				i += 1;
			}
			out.push({ index: debut, texte: nu.slice(debut + 1, i) });
			i += 1;
			continue;
		}
		if (c === '/' && (debut2(nu, i) === -1 || debutDeRegex.test(nu[debut2(nu, i)]))) {
			const debut = i;
			i += 1;
			let ferme = false;
			while (i < arret && nu[i] !== '\n') {
				if (nu[i] === '\\') {
					i += 2;
					continue;
				}
				if (nu[i] === '[') {
					while (i < nu.length && nu[i] !== ']' && nu[i] !== '\n') i += 1;
				}
				if (nu[i] === '/') {
					ferme = true;
					break;
				}
				i += 1;
			}
			if (ferme) {
				out.push({ index: debut, texte: nu.slice(debut + 1, i) });
				i += 1;
				continue;
			}
			i = debut + 1;
			continue;
		}
		i += 1;
	}
	return out;
}

/** L'index du dernier caractère non blanc avant `i`, ou -1. */
function debut2(nu, i) {
	let j = i - 1;
	while (j >= 0 && (nu[j] === ' ' || nu[j] === '\t')) j -= 1;
	return j;
}

/* ═══ Les contrôles ════════════════════════════════════════════════════════ */

/** A1 — une seconde déclaration nominale de l'une des deux entrées. */
export function constatsA1(nu, rel) {
	if (rel === IMPLEMENTATION) return [];
	const out = [];
	for (const nom of ENTREES) {
		const motif = new RegExp(
			'(?:function|const|let|var|class)\\s+' +
				nom +
				'\\b|\\b' +
				nom +
				'\\s*[:=]\\s*(?:function|\\()',
			'g'
		);
		for (const m of nu.matchAll(motif)) {
			out.push({
				controle: 'A1 seconde déclaration nominale',
				index: m.index,
				quoi: nom,
				comment:
					'une seconde déclaration de l’entrée du convertisseur. ADR-004 : « il existe UNE ' +
					'SEULE implémentation ».'
			});
		}
	}
	return out;
}

/** A2 — les marqueurs de construction Markdown relevés dans les littéraux. */
export function marqueursDe(nu, extension = '.ts') {
	const trouves = new Map();
	for (const l of litteraux(nu, extension)) {
		for (const [nom, motif] of MARQUEURS) {
			if (motif.test(l.texte) && !trouves.has(nom)) trouves.set(nom, l.index);
		}
	}
	return trouves;
}

export function constatsA2(nu, rel) {
	if (rel === IMPLEMENTATION || rel in EXEMPTES_DE_A2) return [];
	const trouves = marqueursDe(nu, extname(rel));
	if (trouves.size < 2) return [];
	if (!toucheAuFormat(nu, extname(rel))) return [];
	return [
		{
			controle: 'A2 second convertisseur déguisé',
			index: Math.min(...trouves.values()),
			quoi: [...trouves.keys()].join(', '),
			comment:
				'ce fichier écrit ' +
				String(trouves.size) +
				' formes de construction Markdown ET touche au format canonique, hors de ' +
				'l’implémentation unique. ADR-004 interdit « tout second convertisseur, sous ' +
				'quelque forme que ce soit ».'
		}
	];
}

/**
 * A2b — un fichier exempté de A2 doit DÉLÉGUER. Il importe l'implémentation
 * unique, ou un autre exempté qui la porte — un seul relais, et il est
 * déclaré : l'unitaire de la batterie 4 passe par la batterie, qui passe par
 * l'implémentation. Au-delà d'un relais, la chaîne cesserait d'être lisible.
 */
export function constatsA2b(nu, rel) {
	if (!(rel in EXEMPTES_DE_A2)) return [];
	if (importeLImplementation(nu) || importeUnExempte(nu, rel)) return [];
	return [
		{
			controle: 'A2b un exempté qui ne délègue pas',
			index: 0,
			quoi: rel,
			comment:
				'ce fichier est exempté du relevé des formes, et il ne délègue ni à ' +
				'l’implémentation unique ni à un exempté qui la porte : l’exemption devient une ' +
				'cachette.'
		}
	];
}

function importeLImplementation(nu) {
	return /from\s+['"][^'"]*\/markdown['"]|\$lib\/contenu\/markdown/.test(nu);
}

function importeUnExempte(nu, rel) {
	return Object.keys(EXEMPTES_DE_A2)
		.filter((autre) => autre !== rel)
		.some((autre) => {
			const nom = autre.replace(/^.*\//, '').replace(/\.ts$/, '');
			return new RegExp('from\\s+[\'"][^\'"]*/' + nom + '[\'"]').test(nu);
		});
}

/** A3 — nommer Markdown et toucher au format sans passer par l'unique. */
export function constatsA3(nu, rel) {
	if (rel === IMPLEMENTATION) return [];
	if (!NOMME_MARKDOWN.test(nu) || !FORMAT_CANONIQUE.test(nu)) return [];
	if (importeLImplementation(nu)) return [];
	const m = NOMME_MARKDOWN.exec(nu);
	return [
		{
			controle: 'A3 chemin détourné',
			index: m ? m.index : 0,
			quoi: 'Markdown et format canonique dans le même fichier',
			comment:
				'ce fichier nomme Markdown et touche au document canonique sans importer ' +
				'l’implémentation unique. ADR-004 : « toute conversion du document canonique ' +
				'effectuée hors de l’application » et tout chemin parallèle sont interdits.',
			index2: 0
		}
	];
}

export function analyserFichier(rel, source) {
	const nu = denuder(source, extname(rel));
	const constats = [
		...constatsA1(nu, rel),
		...constatsA2(nu, rel),
		...constatsA2b(nu, rel),
		...constatsA3(nu, rel)
	];
	return {
		rel,
		marqueurs: [...marqueursDe(nu, extname(rel)).keys()],
		toucheAuFormat: toucheAuFormat(nu, extname(rel)),
		importe: importeLImplementation(nu),
		constats: constats
			.map((c) => ({ ...c, fichier: rel, ligne: ligneDe(nu, c.index) }))
			.sort((a, b) => a.ligne - b.ligne)
	};
}

/* ═══ Les sondes ═══════════════════════════════════════════════════════════ */

/**
 * LES TROIS SONDES, et chacune pose EN MÉMOIRE le fichier qu'elle prétend
 * trouver. `ARB-051` exigence 2 : « le contrôle est éprouvé sur un cas qui le
 * sollicite […] un contrôle d'unicité sur un dépôt qui n'en porte qu'une seule
 * est vert par vacuité ».
 *
 * Le fichier de synthèse n'est PAS écrit sur le disque : une sonde qui laisse
 * une trace est une sonde qui peut être oubliée en place.
 */
export const SONDES = {
	'second-convertisseur': {
		rel: 'src/lib/import/convertisseur-rapide.ts',
		attendu: 'A2 second convertisseur déguisé',
		source: [
			"import type { Bloc } from '../contenu/document';",
			'export function versMarkdownRapide(blocs: readonly Bloc[]): string {',
			'  return blocs',
			"    .map((b) => (b.type === 'heading' ? '## ' + b.type : '**' + b.type + '**'))",
			"    .join('\\n\\n');",
			'}'
		].join('\n')
	},
	'nom-redeclare': {
		rel: 'src/lib/import/entree.ts',
		attendu: 'A1 seconde déclaration nominale',
		source: [
			'export function analyserMarkdown(texte: string): unknown {',
			'  return { type: "doc", content: [{ type: "paragraph" }] };',
			'}'
		].join('\n')
	},
	'chemin-detourne': {
		rel: 'src/lib/import/detour.ts',
		attendu: 'A3 chemin détourné',
		source: [
			"import { analyserDocument } from '../contenu/document';",
			'/* Un import Markdown qui ne passerait pas par le convertisseur unique. */',
			'export function importer(texte: string) {',
			'  const nom = "Markdown";',
			'  return analyserDocument({ type: "doc", content: [], nom });',
			'}'
		].join('\n')
	}
};

/* ═══ Le rapport ═══════════════════════════════════════════════════════════ */

function bandeau() {
	console.log('verif:convertisseur — unicité du convertisseur document ⇄ Markdown');
	console.log('  fondement : ADR-004, ARB-051, contrainte C-04, RG-M13-01');
	console.log('  INSTRUMENT DE MESURE — périmètre d’écriture humain / orchestrateur. Un rouge se');
	console.log('  sort par le protocole d’écart, jamais en modifiant ce fichier.');
}

function autoControle(fichiers) {
	const anomalies = [];
	if (!existsSync(join(RACINE, IMPLEMENTATION))) {
		anomalies.push('l’implémentation unique ' + IMPLEMENTATION + ' est absente');
	} else {
		const nu = denuder(readFileSync(join(RACINE, IMPLEMENTATION), 'utf8'), '.ts');
		const vus = marqueursDe(nu).size;
		if (vus < 5) {
			anomalies.push(
				'le relevé ne voit que ' +
					String(vus) +
					' marqueur(s) dans l’implémentation elle-même : le crible est inerte'
			);
		}
	}
	if (fichiers.length === 0) anomalies.push('le périmètre est vide : aucun fichier analysé');
	for (const rel of Object.keys(EXEMPTES_DE_A2)) {
		if (!existsSync(join(RACINE, rel))) {
			anomalies.push('l’exemption ' + rel + ' vise un fichier qui n’existe pas');
		}
	}
	return anomalies;
}

function nonCouvert(fichiers) {
	const porteurs = fichiers.filter((f) => f.marqueurs.length > 0);
	const clients = fichiers.filter((f) => f.importe);
	console.log('\n  NON COUVERT PAR CETTE BATTERIE — et chaque nombre est mesuré à l’exécution :');
	console.log(
		'  • LES APPELANTS. ' +
			String(clients.length) +
			' fichier(s) de produit importent l’implémentation :\n' +
			'      ' +
			(clients.map((f) => f.rel).join(', ') || 'aucun') +
			'\n    L’export (T-045), l’import (T-043) et « Markdown à la frappe » (T-021) ne sont\n' +
			'    pas écrits : la propriété « tous les appelants passent par l’unique » est donc\n' +
			'    VRAIE PAR VACUITÉ aujourd’hui, et elle ne prouvera quelque chose qu’au premier\n' +
			'    de ces lots. C’est le garde-fou qui est posé maintenant, pas sa démonstration.'
	);
	console.log(
		'  • LE HARNAIS ET LE GEL. verif/** et mockups/** ne sont pas analysés : le premier est\n' +
			'    l’instrument, le second est la SOURCE des deux formes qu’ARB-049 retient.'
	);
	console.log(
		'  • UN CONVERTISSEUR QUI N’ÉCRIRAIT AUCUN des ' +
			String(MARQUEURS.length) +
			' marqueurs de la liste fermée\n' +
			'    resterait invisible — par exemple en composant ses délimiteurs caractère par\n' +
			'    caractère. La batterie borne le convertisseur ÉCRIT, pas le convertisseur OBFUSQUÉ.'
	);
	console.log(
		'  • LES LITTÉRAUX SEULS. Le relevé lit les chaînes et les expressions régulières, jamais\n' +
			'    le code nu : un `**` de code est l’exponentiation. Une forme construite par\n' +
			'    concaténation de deux littéraux d’un caractère échappe au relevé.'
	);
	const frontaliers = fichiers.filter(
		(f) => f.marqueurs.length >= 2 && !f.toucheAuFormat && !(f.rel in EXEMPTES_DE_A2)
	);
	console.log(
		'  • LES FRONTALIERS — ' +
			String(frontaliers.length) +
			' fichier(s) écrivent DEUX FORMES OU PLUS sans toucher au format\n' +
			'    canonique. Ils ne sont pas des convertisseurs du document canonique, et la\n' +
			'    batterie les laisse passer À CE TITRE. Ils basculeraient en constat le jour où\n' +
			'    ils toucheraient au format :\n' +
			(frontaliers.map((f) => '      ' + f.rel + ' — ' + f.marqueurs.join(', ')).join('\n') ||
				'      aucun')
	);
	console.log(
		'  • ' +
			String(porteurs.length) +
			' fichier(s) de produit portent au moins un marqueur, dont ' +
			String(Object.keys(EXEMPTES_DE_A2).length) +
			' exempté(s) de A2 :\n' +
			porteurs.map((f) => '      ' + f.rel + ' — ' + f.marqueurs.join(', ')).join('\n')
	);
	console.log('');
}

function rapport(fichiers, sonde) {
	bandeau();
	const constats = fichiers.flatMap((f) => f.constats);
	console.log('\n  implémentation unique : ' + IMPLEMENTATION);
	console.log(
		'  fichiers de produit analysés : ' + String(fichiers.length) + ' (src/**, seeds/**)'
	);
	console.log('  exemptions déclarées de A2 :');
	for (const [rel, motif] of Object.entries(EXEMPTES_DE_A2)) {
		console.log('      ' + rel + '\n          ' + motif);
	}
	if (sonde !== undefined) {
		console.log(
			'\n  SONDE POSÉE : ' +
				sonde +
				' — fichier de synthèse ' +
				SONDES[sonde].rel +
				'\n    contrôle attendu : ' +
				SONDES[sonde].attendu +
				'\n    Le rouge est ATTENDU : le code de retour est inversé.'
		);
	}

	const anomalies = autoControle(fichiers);
	if (anomalies.length > 0) {
		console.error('\nverif:convertisseur — REFUS DE CONCLURE : le relevé lui-même est suspect.\n');
		for (const a of anomalies) console.error('  ' + a);
		console.error('');
		return 2;
	}

	if (constats.length > 0) {
		console.error('\nverif:convertisseur — ÉCHEC : ' + String(constats.length) + ' constat(s).\n');
		for (const c of constats) {
			console.error('  ' + c.controle);
			console.error('    ' + c.fichier + ':' + String(c.ligne) + ' — ' + c.quoi);
			console.error('    ' + c.comment);
		}
		console.error(
			'\nLa voie normale est d’APPELER `serialiserEnMarkdown` et `analyserMarkdown` de\n' +
				IMPLEMENTATION +
				'. Si l’implémentation unique ne rend pas la forme\n' +
				'attendue, c’est un écart à déclarer, jamais un second convertisseur à écrire.\n' +
				'Spécification : docs/adr/ADR-004.md, docs/arbitrages.md ARB-049 et ARB-051.\n'
		);
	} else {
		console.log('\n  (A) unicité de l’implémentation — et ce qui a été examiné pour le dire');
		console.log('      A1 seconde déclaration nominale des deux entrées : aucune');
		console.log(
			'      A2 second convertisseur déguisé : aucun fichier hors exemption ne porte deux ' +
				'formes'
		);
		console.log('      A2b les exemptés délèguent tous à l’implémentation unique');
		console.log('      A3 chemin détourné : aucun');
	}
	nonCouvert(fichiers);
	return constats.length > 0 ? 1 : 0;
}

function marqueurs(fichiers) {
	bandeau();
	console.log('\n  Les formes relevées, fichier par fichier. Décrire n’est pas juger.\n');
	const nu = denuder(readFileSync(join(RACINE, IMPLEMENTATION), 'utf8'), '.ts');
	console.log('   ' + IMPLEMENTATION + ' (l’implémentation)');
	console.log('       ' + [...marqueursDe(nu).keys()].join(', '));
	for (const f of fichiers.filter((x) => x.marqueurs.length > 0)) {
		console.log('   ' + f.rel);
		console.log('       ' + f.marqueurs.join(', '));
		console.log('       importe l’unique : ' + (f.importe ? 'oui' : 'non'));
	}
	console.log('');
}

/* ═══ Entrée ═══════════════════════════════════════════════════════════════ */

export function analyser(sonde) {
	const fichiers = perimetre().map((rel) =>
		analyserFichier(rel, readFileSync(join(RACINE, rel), 'utf8'))
	);
	if (sonde !== undefined) {
		const s = SONDES[sonde];
		fichiers.push(analyserFichier(s.rel, s.source));
	}
	return fichiers;
}

const args = process.argv.slice(2);
const sonde = args.find((a) => a.startsWith('--sonde='))?.slice('--sonde='.length);
if (sonde !== undefined && SONDES[sonde] === undefined) {
	console.error(
		'sonde inconnue : « ' + sonde + ' ». Les sondes posées : ' + Object.keys(SONDES).join(', ')
	);
	process.exit(1);
}
const fichiers = analyser(sonde);
if (args.includes('--marqueurs')) {
	marqueurs(fichiers);
	process.exit(0);
}
const code = rapport(fichiers, sonde);
if (sonde === undefined) process.exit(code);
if (code === 2) {
	/* Un refus de conclure ne s'inverse jamais : ce serait fabriquer un vert. */
	process.exit(1);
}
const attendu = SONDES[sonde].attendu;
const vu = fichiers.flatMap((f) => f.constats).some((c) => c.controle === attendu);
console.log(
	vu
		? '  sonde ' + sonde + ' : ' + attendu + ' a mordu — code de retour inversé, 0.'
		: '  sonde ' + sonde + ' : ' + attendu + ' n’a PAS mordu — 1.'
);
process.exit(vu ? 0 : 1);
