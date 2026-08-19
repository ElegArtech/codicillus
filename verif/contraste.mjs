#!/usr/bin/env node
/**
 * `pnpm verif:contraste` — T-065, LE PARTAGE DES 707.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE EST, ET CE QU'IL N'EST PAS
 *
 * Ce n'est PAS une batterie : il ne rend aucun verdict, il ne sort jamais en
 * échec sur le produit, et il ne remplace pas `pnpm test:a11y`. C'est un
 * INSTRUMENT DE PARTAGE, écrit À CÔTÉ de `verif/a11y.mjs` — que ce lot n'a pas
 * le droit de modifier (T-065, « l'instrument n'est pas ajusté par celui qui
 * l'exploite »).
 *
 * Il répond à une seule question, posée par ARB-033 :
 *
 *     « 707 occurrences de `axe:color-contrast`, oui — mais combien de
 *       DÉFAUTS ? »
 *
 * Le chiffre de 707 est un compte d'occurrences d'axe. axe mesure des pixels ;
 * il ne sait pas si l'élément qu'il condamne est un composant d'interface
 * INACTIF, que WCAG 1.4.3 exempte nommément :
 *
 *     « Text or images of text that are part of an inactive user interface
 *       component […] have no contrast requirement. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS NATURES, ET LA RÈGLE QUI LES SÉPARE
 *
 * La règle est écrite ici, en clair, et réimprimée à chaque exécution. Elle ne
 * regarde JAMAIS la couleur employée : un `--c-encre-4` sur un bouton actif est
 * un défaut réel, et un `--c-encre` sur un contrôle désactivé serait exempt.
 * C'est l'ÉTAT de l'élément qui exempte, jamais son jeton (T-065).
 *
 *   exempt       le nœud, ou l'un de ses ascendants, DÉCLARE son inactivité
 *                dans le DOM : `[disabled]`, `[aria-disabled="true"]`,
 *                `fieldset[disabled]`, `[inert]`, `<option>` d'un `<select>`
 *                désactivé, ou `::placeholder` d'un champ désactivé.
 *                L'exemption de 1.4.3 s'applique alors sans interprétation.
 *
 *   réel         aucune déclaration d'inactivité, et le nœud n'appartient à
 *                AUCUN composant d'interface — c'est du texte que
 *                l'utilisateur doit lire. L'exemption ne peut pas être
 *                invoquée : il n'y a pas de « user interface component » à
 *                déclarer inactif.
 *
 *   indécidable  aucune déclaration d'inactivité, MAIS le nœud appartient à un
 *                composant d'interface (ascendant interactif ou porteur d'un
 *                rôle de widget) ou à un composant que le gel marque
 *                conventionnellement « pas encore / sans objet » par une
 *                classe, sans que le DOM ne le déclare inactif. Trancher
 *                demanderait de décider si ce composant est « inactive » au
 *                sens de 1.4.3 — ce que ni WCAG ni le gel ne disent.
 *                CE SEAU N'EST PAS UN FOURRE-TOUT : il est compté à part et
 *                chacun de ses cas est nommé (règle de non-comblement).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE RELEVÉ NE REGARDE PAS — et c'est la moitié de RG-M18-07
 *
 *   • le contraste NON TEXTUEL (WCAG 1.4.11) : bordures de champs, anneaux de
 *     focus, traits, pictogrammes, témoins de fraîcheur. axe 4.13 ne porte
 *     AUCUNE règle dessus ; ce module non plus, puisqu'il part des constats
 *     d'axe. Ce qui n'est pas mesuré ne peut pas être partagé.
 *   • le contraste qu'axe refuse de trancher (`incomplete` — texte SVG, fonds
 *     recouverts) : il est compté par `test:a11y` en `instrument:axe-indecidable`
 *     et reste hors du partage.
 *   • le côté APPLICATION. Les 707 sont de nature « gel » : présents des deux
 *     côtés, donc originaires du gel. Le partage est relevé côté gel, qui est
 *     la source, et la réparation est un REGEL — que ce lot ne fait pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'USAGE
 *
 *   node verif/contraste.mjs                     tous les couples concernés
 *   node verif/contraste.mjs V-14 V-16           deux vues
 *   node verif/contraste.mjs --rapport=chemin    un autre rapport `test:a11y`
 *   node verif/contraste.mjs --concurrence=6     pages en parallèle (défaut 6)
 *
 * Le module LIT `verif/rapports/a11y.json` pour savoir QUELS couples visiter —
 * il ne redécouvre pas les violations, il les repart. Sans ce rapport, il
 * refuse : partager un compte qu'on n'a pas devant soi ne veut rien dire.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { servir } from './banc/serveur.mjs';
import { racine, RACINE_MAQUETTES, vues } from './banc/inventaire.mjs';
import {
	avancer,
	AVANCE_ETAT_MS,
	POINTEUR_AU_REPOS,
	retirerBlocsHorsProduit
} from './banc/conditions.mjs';
import { ouvrirPage, reglerPlanche } from './banc/capture.mjs';
import { reveler } from './banc/revelation.mjs';
import { declarationRevelation, focalisationDeclaree } from './banc/mode-demo.mjs';

const DOSSIER_SCENARIOS = join(racine, 'verif', 'scenarios');
const DOSSIER_RAPPORTS = join(racine, 'verif', 'rapports');

/* ═══════════════════════════════════════════════════════════════════════════
   LES SURFACES DU SOCLE, ET LA VÉRIFICATION QUI PORTE TOUT LE RESTE
   ═══════════════════════════════════════════════════════════════════════════

   ARB-033 s'appuie sur une méthode que le socle documente lui-même, dans un
   commentaire daté du 16/08/2026, AVANT le gel :

     « --c-encre-3 : assombri le 16/08/2026 : #71838a ne donnait que 2,75:1 sur
       le fond creux, là où RG-M18-07 exige 4,5:1 pour un texte de 11 px. Teinte
       conservée, contraste porté à 4,54:1 au pire des quatre surfaces. »

   Si ces deux nombres ne tombent pas, l'arbitrage repose sur du sable. Ils sont
   donc RECALCULÉS À CHAQUE EXÉCUTION, et le module refuse de mesurer quoi que
   ce soit si l'écart dépasse 0,01. */
const SURFACES = {
	'--c-fond': '#e2e7e4',
	'--c-fond-creux': '#d3d9d6',
	'--c-papier': '#fcfbf8',
	'--c-papier-2': '#f5f4ef'
};
/* Les surfaces que le socle ne compte PAS dans « les quatre », et sur
   lesquelles les 707 posent pourtant du texte. Relevées, parce qu'une méthode
   qui ne regarde que quatre fonds ne dit rien des autres. */
const SURFACES_HORS_QUATRE = {
	'--c-frais-voile': '#e4efe8',
	'--c-vieil-voile': '#f6eedd',
	'--c-danger-voile': '#f7e7e3',
	'--c-accent-voile': '#edecf8',
	'--c-info-voile': '#e4eef4'
};
const ENCRES = {
	'--c-encre': '#16222b',
	'--c-encre-2': '#46585f',
	'--c-encre-3': '#536066',
	'--c-encre-4': '#93a2a6'
};

/** Luminance relative WCAG 2.x, sRGB. */
function luminance(hex) {
	const c = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** Rapport de contraste WCAG 2.x. */
export function contraste(a, b) {
	const x = luminance(a);
	const y = luminance(b);
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Le jeton qui porte cette valeur, ou la valeur brute si aucun ne la porte. */
function jetonDe(hex, table) {
	const v = String(hex ?? '').toLowerCase();
	for (const [nom, valeur] of Object.entries(table)) if (valeur === v) return nom;
	return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA SONDE D'ÉTAT — posée dans la page, en LECTURE SEULE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Installée dans la page. Rend, pour un sélecteur d'axe, tout ce dont le
 * partage a besoin — et RIEN de ce qu'il ne faut pas regarder : la couleur du
 * nœud n'entre dans aucune décision.
 */
function installerSondeEtat() {
	const texte = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();

	/* La MÊME signature que `verif/a11y-sondes.mjs`, à l'identique : sans elle,
	   le partage ne se raccorde pas au rapport de la batterie 10 et l'on
	   comparerait deux relevés qui ne parlent pas des mêmes nœuds. */
	const signature = (e) => {
		if (!e || e.nodeType !== 1) return '?';
		const classes = [...e.classList].sort().join('.');
		const parents = [];
		for (let p = e.parentElement, n = 0; p && n < 2; p = p.parentElement, n++) {
			parents.push(p.tagName.toLowerCase() + (p.id ? '#' + p.id : ''));
		}
		return [
			e.tagName.toLowerCase(),
			e.id || '',
			classes,
			e.getAttribute('role') || '',
			e.getAttribute('href') || '',
			e.getAttribute('type') || '',
			(e.getAttribute('aria-label') || '').slice(0, 48),
			texte(e).slice(0, 48),
			parents.join('>')
		].join('|');
	};

	/* Ce qui fait d'un élément un COMPOSANT D'INTERFACE au sens de WCAG :
	   un contrôle natif, un lien, ou un rôle de widget ARIA. Un `<span>` dans
	   un `<li>` n'en est pas un, et c'est ce qui interdit de l'exempter. */
	const ROLES_WIDGET = new Set([
		'button',
		'link',
		'checkbox',
		'radio',
		'menuitem',
		'menuitemcheckbox',
		'menuitemradio',
		'option',
		'switch',
		'tab',
		'textbox',
		'combobox',
		'listbox',
		'slider',
		'spinbutton',
		'searchbox',
		'treeitem',
		'gridcell',
		'scrollbar'
	]);
	const estComposant = (e) => {
		const t = e.tagName.toLowerCase();
		if (['a', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'option'].includes(t)) {
			return t !== 'a' || e.hasAttribute('href');
		}
		if (ROLES_WIDGET.has(e.getAttribute('role'))) return true;
		return e.hasAttribute('tabindex') && e.getAttribute('tabindex') !== '-1';
	};

	/* La DÉCLARATION D'INACTIVITÉ — la seule chose qui exempte. Mécanique,
	   sans interprétation : un attribut, pas une convention graphique. */
	const declareInactif = (e) => {
		const t = e.tagName.toLowerCase();
		if (e.hasAttribute('inert')) return 'inert';
		if (e.getAttribute('aria-disabled') === 'true') return 'aria-disabled';
		if (['button', 'input', 'select', 'textarea', 'fieldset', 'optgroup', 'option'].includes(t)) {
			if (e.disabled === true) return 'disabled';
		}
		if (t === 'option' && e.closest('select')?.disabled) return 'option-de-select-desactive';
		if (e.hasAttribute('disabled')) return 'attribut-disabled';
		return null;
	};

	window.__contraste = {
		/**
		 * LES SITES QUI AURAIENT ÉTÉ EXEMPTS — et qu'axe n'a jamais rapportés.
		 *
		 * Le seau « exempt » du partage est vide. Un seau vide se lit de deux
		 * façons : « le gel ne grise jamais un composant inactif » ou « axe ne
		 * les rapporte pas ». Ce relevé tranche : il compte les nœuds PORTEURS
		 * DE TEXTE dont la couleur calculée est celle de --c-encre-4 ET dont
		 * l'inactivité est déclarée quelque part sur la chaîne ascendante.
		 * S'il en trouve, l'exemption existe bel et bien dans le gel — et son
		 * absence des 707 est un préfiltrage d'axe, pas une propriété du gel.
		 */
		exemptsInvisiblesAAxe() {
			const trouves = [];
			for (const e of document.querySelectorAll('*')) {
				if (!e.firstChild) continue;
				let aDuTexte = false;
				for (const n of e.childNodes) {
					if (n.nodeType === 3 && n.nodeValue.trim()) aDuTexte = true;
				}
				if (!aDuTexte) continue;
				if (getComputedStyle(e).color !== 'rgb(147, 162, 166)') continue;
				let motif = null;
				for (let p = e; p && p !== document.documentElement; p = p.parentElement) {
					const d = declareInactif(p);
					if (d) {
						motif =
							d +
							' sur ' +
							p.tagName.toLowerCase() +
							(p.className ? '.' + [...p.classList].join('.') : '');
						break;
					}
				}
				if (motif) trouves.push({ signature: signature(e), motif, texte: texte(e).slice(0, 48) });
			}
			return trouves;
		},

		etatDe(selecteurs) {
			return selecteurs.map((sel) => {
				let e = null;
				try {
					e = document.querySelector(sel);
				} catch {
					/* sélecteur illisible */
				}
				if (!e) return { selecteur: sel, introuvable: true };

				/* La chaîne ascendante, jusqu'au corps. */
				const chaine = [];
				let inactif = null;
				let composant = null;
				let composantInactif = null;
				for (let p = e; p && p !== document.documentElement; p = p.parentElement) {
					const d = declareInactif(p);
					const c = estComposant(p);
					chaine.push({
						tag: p.tagName.toLowerCase(),
						id: p.id || '',
						classes: [...p.classList],
						role: p.getAttribute('role') || '',
						composant: c,
						inactif: d
					});
					if (d && !inactif)
						inactif = {
							par: d,
							sur: p.tagName.toLowerCase() + (p.className ? '.' + [...p.classList].join('.') : '')
						};
					if (c && !composant) {
						composant =
							p.tagName.toLowerCase() + (p.className ? '.' + [...p.classList].join('.') : '');
						composantInactif = d;
					}
					if (chaine.length >= 8) break;
				}

				const st = getComputedStyle(e);
				return {
					selecteur: sel,
					signature: signature(e),
					tag: e.tagName.toLowerCase(),
					classes: [...e.classList],
					texte: texte(e).slice(0, 72),
					couleur: st.color,
					fond: st.backgroundColor,
					taille: st.fontSize,
					graisse: st.fontWeight,
					/* readonly : relevé, JAMAIS exemptant. Un champ en lecture seule
					   reste focalisable et son contenu reste à lire — WCAG ne
					   l'exempte pas. */
					readonly: e.matches('[readonly]') || Boolean(e.closest('[readonly]')),
					/* Le style EN LIGNE : quatre groupes sur vingt-deux tiennent leur
					   --c-encre-4 d'un `style.color` posé par le script de la maquette,
					   pas d'une règle de feuille. Un dossier de regel qui ne
					   chercherait que dans le CSS ne les trouverait pas. */
					styleEnLigne: e.getAttribute('style'),
					inactif,
					composant,
					composantInactif,
					chaine: chaine.slice(0, 5)
				};
			});
		}
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA RÈGLE DE PARTAGE — un seul endroit, réimprimée au rapport
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les classes du gel qui marquent conventionnellement un état « pas encore »,
 * « sans objet » ou « emplacement à remplir » — SANS que le DOM ne déclare
 * l'inactivité. Elles ne sont PAS exemptantes : elles rendent INDÉCIDABLE,
 * parce que décider demanderait de dire si le composant est « inactive » au
 * sens de 1.4.3, ce que ni WCAG ni le gel ne tranchent.
 *
 * Chaque entrée porte le motif de son inscription. Une entrée sans motif
 * serait un comblement déguisé.
 */
export const MARQUES_CONVENTIONNELLES = [
	{
		classe: 'jalon__nom',
		condition: 'le <li class="jalon"> ascendant ne porte pas data-etat',
		motif:
			"le fil d'étapes du gel colore en --c-encre-4 les jalons NON ATTEINTS (V-06 " +
			'L.528-547 : la couleur par défaut, que data-etat="faite"/"courante" remplace). ' +
			"Un jalon futur est-il un « composant d'interface inactif » ? Le <ol> n'est ni " +
			'interactif ni déclaré inactif : WCAG ne tranche pas.'
	},
	{
		classe: 'phrase-rel__vide',
		condition: 'toujours',
		motif:
			'emplacement à remplir dans une phrase de relation en cours de composition ' +
			"(V-40 : « …note à choisir… »). C'est un placeholder de TEXTE, pas le " +
			'::placeholder d’un champ : 1.4.3 ne le nomme pas, et le composant qui le ' +
			"porte n'est pas déclaré inactif."
	}
];

/**
 * Le partage d'un nœud. NE REGARDE JAMAIS LA COULEUR.
 * @returns {{nature: 'exempt'|'reel'|'indecidable', motif: string}}
 */
export function partager(etat) {
	if (etat.introuvable) {
		return { nature: 'indecidable', motif: 'nœud introuvable au moment du relevé' };
	}
	/* 1. L'inactivité DÉCLARÉE — la seule exemption sans interprétation. */
	if (etat.inactif) {
		return {
			nature: 'exempt',
			motif: `inactivité déclarée : ${etat.inactif.par} sur ${etat.inactif.sur} — WCAG 1.4.3 exempte nommément`
		};
	}
	/* 2. Les marques conventionnelles du gel — indécidables, nommées. */
	for (const m of MARQUES_CONVENTIONNELLES) {
		if (etat.classes.includes(m.classe)) {
			if (m.classe === 'jalon__nom') {
				const li = etat.chaine.find((c) => c.classes.includes('jalon'));
				if (li && !li.inactif)
					return {
						nature: 'indecidable',
						motif: `marque conventionnelle « ${m.classe} » — ${m.motif}`
					};
				continue;
			}
			return {
				nature: 'indecidable',
				motif: `marque conventionnelle « ${m.classe} » — ${m.motif}`
			};
		}
	}
	/* 3. Le nœud appartient-il à un composant d'interface ? Si oui, et qu'aucune
	      inactivité n'est déclarée, le composant est ACTIF : la lecture stricte
	      de 1.4.3 rend le défaut réel. C'est le cas du raccourci clavier dans un
	      <button> de menu contextuel, ou du rang dans un <a> de liste. */
	if (etat.composant) {
		return {
			nature: 'reel',
			motif: `texte d'un composant d'interface ACTIF (${etat.composant}) — aucune inactivité déclarée`
		};
	}
	/* 4. Ni composant, ni inactivité : du texte que l'utilisateur doit lire.
	      L'exemption de 1.4.3 n'a rien à quoi s'accrocher. */
	return {
		nature: 'reel',
		motif: "texte hors de tout composant d'interface — 1.4.3 n'exempte pas"
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   L'EXÉCUTION
   ═══════════════════════════════════════════════════════════════════════════ */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
	const t = args.find((a) => a.startsWith(`--${nom}=`));
	return t ? t.slice(nom.length + 3) : defaut;
};
const demandees = args.filter((a) => /^V-\d\d$/.test(a));
const concurrence = Math.max(1, Number(option('concurrence', '6')));
const cheminRapport = option('rapport', join(DOSSIER_RAPPORTS, 'a11y.json'));

console.log('\n═══ verif:contraste — T-065, le partage des occurrences de contraste ═══\n');

/* ── Les deux ratios de contrôle, AVANT toute mesure ─────────────────────── */
console.log('  Contrôle de la méthode citée par ARB-033 (commentaire du socle, 16/08/2026) :');
const ctrl = [
	{
		quoi: '#71838a sur --c-fond-creux',
		mesure: contraste('#71838a', SURFACES['--c-fond-creux']),
		annonce: 2.75
	},
	{
		quoi: '#536066 au pire des quatre surfaces',
		mesure: Math.min(...Object.values(SURFACES).map((s) => contraste('#536066', s))),
		annonce: 4.54
	}
];
let controleOk = true;
for (const c of ctrl) {
	const ecart = Math.abs(c.mesure - c.annonce);
	const verdict = ecart <= 0.01 ? '✓' : '✗';
	if (ecart > 0.01) controleOk = false;
	console.log(
		`    ${verdict} ${c.quoi.padEnd(38)} annoncé ${c.annonce.toFixed(2)}  mesuré ${c.mesure.toFixed(4)}  écart ${ecart.toFixed(4)}`
	);
}
if (!controleOk) {
	console.error(
		"\n  ⚠ LA MÉTHODE CITÉE PAR ARB-033 NE SE REPRODUIT PAS. L'arbitrage repose sur du\n" +
			'    sable, et aucun partage ne vaut d’être fait avant que ce point soit tranché.\n'
	);
	process.exit(3);
}

/* ── L'échelle complète : ce que chaque encre donne sur chaque surface ───── */
console.log('\n  L’échelle d’encres contre les neuf surfaces du socle (AA = 4,5:1) :');
const toutesSurfaces = { ...SURFACES, ...SURFACES_HORS_QUATRE };
const entete = Object.keys(toutesSurfaces).map((s) =>
	s.replace('--c-', '').slice(0, 11).padStart(12)
);
console.log('    ' + ' '.repeat(14) + entete.join(''));
for (const [nom, hex] of Object.entries(ENCRES)) {
	const ligne = Object.values(toutesSurfaces).map((s) => {
		const r = contraste(hex, s);
		return (r.toFixed(2) + (r >= 4.5 ? ' ' : '!')).padStart(12);
	});
	console.log('    ' + nom.replace('--c-', '').padEnd(14) + ligne.join(''));
}
console.log('    (« ! » = sous 4,5:1)');

/* ── Le rapport de la batterie 10 ────────────────────────────────────────── */
if (!existsSync(cheminRapport)) {
	console.error(
		`\n  verif:contraste — rapport introuvable : ${cheminRapport}\n` +
			'  Lancer `pnpm test:a11y` d’abord. Partager un compte qu’on n’a pas devant\n' +
			'  soi ne veut rien dire.\n'
	);
	process.exit(2);
}
const rapportA11y = JSON.parse(readFileSync(cheminRapport, 'utf8'));

/* Les couples qui portent au moins une occurrence de `axe:color-contrast`, et
   le compte attendu par couple : c'est le compte que le partage doit RETROUVER,
   sinon il partage autre chose que ce qu'il prétend partager. */
const attendus = new Map();
let totalAttendu = 0;
/* Les 707 sont les occurrences de nature « gel ». Le rapport en porte 8 de plus,
   de nature « gel-non-reporte » (V-37) : présentes au gel, absentes de
   l'application. Elles sont relevées, mais COMPTÉES À PART — les confondre
   ferait dire 715 là où l'arbitrage dit 707. */
const parNature = new Map();
for (const c of rapportA11y.par_couple) {
	let n = 0;
	for (const l of c.lignes) {
		if (l.regle !== 'axe:color-contrast') continue;
		n += l.occurrences;
		parNature.set(l.nature, (parNature.get(l.nature) ?? 0) + l.occurrences);
	}
	if (!n) continue;
	if (demandees.length && !demandees.includes(c.vue)) continue;
	attendus.set(`${c.vue}/${c.etat}@${c.fenetre}`, {
		vue: c.vue,
		etat: c.etat,
		fenetre: c.fenetre,
		n
	});
	totalAttendu += n;
}
const NATURES_GEL = new Map(
	rapportA11y.par_couple.flatMap((c) =>
		c.lignes
			.filter((l) => l.regle === 'axe:color-contrast')
			.map((l) => [`${c.vue}/${c.etat}@${c.fenetre}|${l.signature}`, l.nature])
	)
);
console.log(
	`\n  Rapport lu : ${cheminRapport}\n` +
		`  ${attendus.size} couple(s) portent ${totalAttendu} occurrence(s) de axe:color-contrast,\n` +
		`  sur ${new Set([...attendus.values()].map((a) => a.vue)).size} vue(s).\n` +
		`  dont, par nature du rapport : ${[...parNature].map(([n, v]) => `${n} ${v}`).join(' · ')}\n`
);

/* ── Les couples à rejouer, avec leur scénario ───────────────────────────── */
const parVue = new Map(vues().map((v) => [v.vue, v]));
/* ═══════════════════════════════════════════════════════════════════════════
   LA SONDE — « une règle qu'aucun cas n'exerce est une règle dont on ignore
   si elle marche » (CLAUDE.md P-5)
   ═══════════════════════════════════════════════════════════════════════════

   Le partage rend ZÉRO exempt sur les 707, et un seau vide n'est pas une
   mesure tant qu'on n'a pas montré qu'il POUVAIT se remplir. La sonde
   l'établit en deux temps, sur un couple réel :

     1. `partager()` reçoit un état d'inactivité déclarée et DOIT rendre
        « exempt ». C'est la branche du module, éprouvée sur un cas qui la
        sollicite.
     2. `aria-disabled="true"` est posé sur les ascendants des nœuds fautifs,
        et axe est relancé. S'il rend MOINS de violations, c'est qu'AXE
        APPLIQUE DÉJÀ l'exemption de 1.4.3 lui-même — et alors le seau
        « exempt » est vide PAR CONSTRUCTION, non par hasard.

   Le code de retour est celui de la sonde, pas celui du partage. */
if (option('sonde') === 'exemption') {
	console.log(
		'\n  ⚠ SONDE « exemption » — le partage ne sera pas fait ; seule la branche est éprouvée.\n'
	);
	let ok = true;

	/* Temps 1 — la branche de `partager()`. */
	for (const cas of [
		{ par: 'disabled', sur: 'button.btn' },
		{ par: 'aria-disabled', sur: 'div.menu-ctx' },
		{ par: 'inert', sur: 'section.panneau' },
		{ par: 'option-de-select-desactive', sur: 'option' }
	]) {
		const p = partager({ classes: ['x'], inactif: cas, composant: 'button', chaine: [] });
		const bon = p.nature === 'exempt';
		if (!bon) ok = false;
		console.log(`    ${bon ? '✓' : '✗'} inactivité « ${cas.par.padEnd(28)} » → ${p.nature}`);
	}
	/* Et le contre-cas : sans déclaration, JAMAIS exempt. */
	const contre = partager({ classes: ['x'], inactif: null, composant: 'button.btn', chaine: [] });
	if (contre.nature === 'exempt') ok = false;
	console.log(
		`    ${contre.nature === 'exempt' ? '✗' : '✓'} aucune déclaration, composant actif → ${contre.nature}`
	);

	/* Temps 2 — axe applique-t-il l'exemption lui-même ? */
	const vueSonde = demandees[0] ?? 'V-41';
	const cs = [...attendus.values()].find((a) => a.vue === vueSonde);
	if (!cs) {
		console.error(
			`\n    ✗ aucun couple de ${vueSonde} ne porte de violation : la sonde ne peut rien exercer.`
		);
		ok = false;
	} else {
		const v = parVue.get(cs.vue);
		const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${cs.vue}.json`), 'utf8'));
		const etat = scenario.etats.find((e) => e.cle === cs.etat);
		const serveur = await servir(RACINE_MAQUETTES);
		const nav = await chromium.launch();
		const { page, contexte } = await ouvrirPage(nav, `${serveur.origine}/${v.fichier}`, cs.fenetre);
		if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
		else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
		await retirerBlocsHorsProduit(page);
		await reveler(page, declarationRevelation(cs.vue), 'gel', { modaliteReference: 'script' });
		await page.clock.resume();
		const avant = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
		const nAvant = avant.violations.reduce((s, r) => s + r.nodes.length, 0);
		await page.evaluate(
			(sels) => {
				for (const s of sels) {
					const e = document.querySelector(s);
					if (e?.parentElement) e.parentElement.setAttribute('aria-disabled', 'true');
				}
			},
			avant.violations.flatMap((r) =>
				r.nodes.map((n) => (Array.isArray(n.target[0]) ? n.target[0] : n.target).slice(-1)[0])
			)
		);
		const apres = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
		const nApres = apres.violations.reduce((s, r) => s + r.nodes.length, 0);
		await page.close();
		await contexte.close();
		await nav.close();
		await serveur.fermer();
		const mord = nApres < nAvant;
		if (!mord) ok = false;
		console.log(
			`\n    ${mord ? '✓' : '✗'} ${cs.vue}/${cs.etat}@${cs.fenetre} : ${nAvant} violation(s) → ${nApres} ` +
				'après aria-disabled sur les ascendants.\n' +
				(mord
					? "      AXE APPLIQUE DÉJÀ L'EXEMPTION DE 1.4.3 LUI-MÊME (color-contrast-matches :\n" +
						'      `isDisabled(virtualNode) || isInert(virtualNode)` → false, et isDisabled\n' +
						'      REMONTE la chaîne des ascendants). Le seau « exempt » est donc vide PAR\n' +
						'      CONSTRUCTION : aucune des 707 occurrences ne peut porter une inactivité\n' +
						'      déclarée, puisque axe ne l’aurait pas rapportée.'
					: '      axe n’a pas bougé : le seau « exempt » vide ne s’explique PAS par un\n' +
						'      préfiltrage d’axe, et il faut chercher ailleurs.')
		);
	}
	console.log(ok ? '\n  Sonde : OK — la branche « exempt » mord.\n' : '\n  Sonde : ÉCHEC.\n');
	process.exit(ok ? 0 : 1);
}

const couples = [];
for (const a of attendus.values()) {
	const v = parVue.get(a.vue);
	if (!v) continue;
	const scenario = JSON.parse(readFileSync(join(DOSSIER_SCENARIOS, `${a.vue}.json`), 'utf8'));
	const etat = scenario.etats.find((e) => e.cle === a.etat);
	if (!etat) continue;
	couples.push({
		vue: a.vue,
		fichier: v.fichier,
		etat,
		fenetre: a.fenetre,
		scenario,
		attendu: a.n
	});
}

const serveurGel = await servir(RACINE_MAQUETTES);
const navigateur = await chromium.launch();
console.log(
	`  gel : ${serveurGel.origine} · ${couples.length} couple(s) · ${concurrence} page(s) en parallèle\n`
);

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

/* La reprise d'ÉCART-039 É-1, reprise telle quelle : l'horloge virtuelle du
   banc porte une course que seule la concurrence révèle (CLAUDE.md P-14). Ce
   module ne touche pas `conditions.mjs` — il absorbe la course, il ne la
   corrige pas. */
async function avecReprise(travail, essais = 3) {
	let derniere = null;
	for (let n = 0; n < essais; n++) {
		try {
			return await travail();
		} catch (e) {
			derniere = e;
			if (!String(e?.message ?? e).includes('Cannot fast-forward to the past')) throw e;
			await new Promise((r) => setTimeout(r, 120 * (n + 1)));
		}
	}
	throw derniere;
}

/** Rejoue un couple côté gel et rend ses nœuds en contraste insuffisant. */
async function releverCouple(couple) {
	const { vue, fichier, etat, fenetre, scenario } = couple;
	const { page, contexte } = await ouvrirPage(
		navigateur,
		`${serveurGel.origine}/${fichier}`,
		fenetre
	);
	try {
		if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
		else if (scenario.defaut) await reglerPlanche(page, scenario.defaut);
		if (etat.zone?.declencheur) await actionnerDeclencheur(page, etat.zone.declencheur);
		await retirerBlocsHorsProduit(page);
		await reveler(page, declarationRevelation(vue), 'gel', {
			modaliteReference: etat.zone?.declencheur ? 'pointeur' : 'script'
		});
		const focal = focalisationDeclaree(vue, etat.cle);
		if (focal) {
			await page.evaluate((sel) => {
				const e = document.querySelector(sel);
				if (e && document.activeElement !== e) e.focus();
			}, focal);
		}
		await page.evaluate(installerSondeEtat);

		/* axe, horloge REPRISE — P-15 : sous horloge arrêtée il ne rend jamais
		   la main. L'état est établi arrêté, puis l'horloge repart. */
		await page.clock.resume();
		const resultat = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

		const nodes = [];
		for (const r of resultat.violations) for (const n of r.nodes) nodes.push(n);
		const selecteurs = nodes.map(
			(n) => (Array.isArray(n.target[0]) ? n.target[0] : n.target).slice(-1)[0]
		);
		const etats = selecteurs.length
			? await page.evaluate((s) => window.__contraste.etatDe(s), selecteurs)
			: [];
		/* Ce qu'axe N'A PAS rapporté, et qui aurait été exempt. */
		const invisibles = await page.evaluate(() => window.__contraste.exemptsInvisiblesAAxe());
		for (const i of invisibles) exemptsHorsAxe.push({ vue, etat: etat.cle, fenetre, ...i });

		/* L'ÉTAT VIENT D'ABORD, LES COULEURS D'AXE ENSUITE, ET L'ORDRE COMPTE :
		   la sonde d'état rend aussi un champ `fond` — le `background-color`
		   PROPRE du nœud, qui vaut `rgba(0,0,0,0)` neuf fois sur dix parce que
		   le fond vient d'un ascendant. C'est la couleur COMPOSÉE d'axe qu'il
		   faut garder ; l'écraser par la couleur propre a rendu, à la première
		   exécution, 701 nœuds « sur rgba(0,0,0,0) » et zéro jeton de
		   réparation calculable. */
		return nodes.map((n, i) => {
			const message = n.any?.[0]?.message ?? '';
			const donnee = n.any?.[0]?.data ?? {};
			return {
				...etats[i],
				vue,
				etat: etat.cle,
				fenetre,
				selecteur: selecteurs[i],
				ratio:
					donnee.contrastRatio ?? Number((message.match(/contrast of ([0-9.]+)/) || [])[1] ?? 0),
				avantPlan: (
					donnee.fgColor ??
					(message.match(/foreground color: (#[0-9a-f]{6})/i) || [])[1] ??
					''
				).toLowerCase(),
				fond: (
					donnee.bgColor ??
					(message.match(/background color: (#[0-9a-f]{6})/i) || [])[1] ??
					''
				).toLowerCase(),
				fondPropre: etats[i]?.fond ?? '',
				taillePt: donnee.fontSize ?? '',
				graisse: donnee.fontWeight ?? ''
			};
		});
	} finally {
		await page.close().catch(() => {});
		await contexte.close().catch(() => {});
	}
}

const releves = [];
const echecs = [];
/** Les sites en --c-encre-4 sur un composant déclaré INACTIF — qu'axe n'a
 *  jamais rapportés, et qui seraient exactement le seau « exempt ». */
const exemptsHorsAxe = [];
let faits = 0;
const file = [...couples];
await Promise.all(
	Array.from({ length: Math.min(concurrence, file.length) }, async () => {
		for (let c = file.shift(); c; c = file.shift()) {
			try {
				releves.push(...(await avecReprise(() => releverCouple(c))));
			} catch (e) {
				echecs.push({
					couple: `${c.vue}/${c.etat.cle}@${c.fenetre}`,
					erreur: String(e?.message ?? e).slice(0, 160)
				});
			}
			if (++faits % 20 === 0) process.stdout.write(`  … ${faits}/${couples.length} couples\n`);
		}
	})
);
await navigateur.close();
await serveurGel.fermer();

/* ═══════════════════════════════════════════════════════════════════════════
   LE RAPPORT
   ═══════════════════════════════════════════════════════════════════════════ */
for (const r of releves) {
	const p = partager(r);
	r.nature = p.nature;
	r.motif = p.motif;
	r.jetonAvantPlan = jetonDe(r.avantPlan, ENCRES);
	r.jetonFond = jetonDe(r.fond, { ...SURFACES, ...SURFACES_HORS_QUATRE });
	/* Le jeton de réparation : la PLUS CLAIRE des encres qui tient 4,5:1 sur CE
	   fond. Aucune teinte n'est inventée — on remonte l'échelle du socle, on ne
	   la prolonge pas (ARB-033 : #526064 serait un doublon de --c-encre-3). */
	r.jetonReparation = null;
	if (r.nature !== 'exempt' && r.fond) {
		for (const [nom, hex] of [
			['--c-encre-3', ENCRES['--c-encre-3']],
			['--c-encre-2', ENCRES['--c-encre-2']],
			['--c-encre', ENCRES['--c-encre']]
		]) {
			if (contraste(hex, r.fond) >= 4.5) {
				r.jetonReparation = nom;
				r.ratioApres = Number(contraste(hex, r.fond).toFixed(2));
				break;
			}
		}
	}
}

const total = releves.length;
const compte = { exempt: 0, reel: 0, indecidable: 0 };
/* Le même partage, restreint aux occurrences de nature « gel » — les 707 dont
   parle ARB-033. Le reste (V-37, « gel non reporté ») est compté séparément. */
const compte707 = { exempt: 0, reel: 0, indecidable: 0 };
for (const r of releves) {
	compte[r.nature]++;
	r.natureRapport = NATURES_GEL.get(`${r.vue}/${r.etat}@${r.fenetre}|${r.signature}`) ?? 'inconnue';
	if (r.natureRapport === 'gel') compte707[r.nature]++;
}

console.log('\n  ── Le relevé, rapproché du rapport ──────────────────────────────────');
console.log(`     attendu par test:a11y : ${totalAttendu} occurrence(s)`);
console.log(`     relevé par ce module  : ${total} nœud(s)`);
if (echecs.length) console.log(`     couples non rejoués   : ${echecs.length}`);
if (total !== totalAttendu) {
	console.log(
		'     ⚠ ÉCART DE RAPPROCHEMENT — le partage porte sur ce que CE relevé a vu,\n' +
			'       pas sur le compte de la batterie. La différence est imprimée, jamais absorbée.'
	);
}

console.log('\n  ── Les couples (avant-plan × fond) en cause ─────────────────────────');
const parCouple = new Map();
for (const r of releves) {
	const k = `${r.jetonAvantPlan ?? r.avantPlan} × ${r.jetonFond ?? r.fond}`;
	const e = parCouple.get(k) ?? { n: 0, ratio: r.ratio, vues: new Set() };
	e.n++;
	e.vues.add(r.vue);
	parCouple.set(k, e);
}
for (const [k, v] of [...parCouple].sort((a, b) => b[1].n - a[1].n)) {
	console.log(
		`     ${String(v.n).padStart(4)}  ${k.padEnd(34)} ${String(v.ratio).padStart(5)}:1  ${[...v.vues].sort().join(' ')}`
	);
}

console.log('\n  ── Le partage ───────────────────────────────────────────────────────');
const total707 = Object.values(compte707).reduce((a, b) => a + b, 0);
console.log(
	`     nature            tout (${String(total).padStart(3)})        « gel » seul (${String(total707).padStart(3)})`
);
for (const n of ['exempt', 'reel', 'indecidable']) {
	const pc = total ? ((compte[n] / total) * 100).toFixed(1) : '0.0';
	const pc7 = total707 ? ((compte707[n] / total707) * 100).toFixed(1) : '0.0';
	console.log(
		`     ${n.padEnd(13)} ${String(compte[n]).padStart(4)}  ${pc.padStart(5)} %      ${String(compte707[n]).padStart(4)}  ${pc7.padStart(5)} %`
	);
}
/* Le contre-relevé : ce qu'axe n'a pas dit. */
const exemptsGroupes = new Map();
for (const e of exemptsHorsAxe) {
	const k = `${e.vue}|${e.signature}|${e.motif}`;
	const v = exemptsGroupes.get(k) ?? { ...e, occurrences: 0 };
	v.occurrences++;
	exemptsGroupes.set(k, v);
}
console.log(
	`\n     Contre-relevé — sites en --c-encre-4 PORTÉS PAR UN COMPOSANT DÉCLARÉ INACTIF :\n` +
		`     ${exemptsHorsAxe.length} occurrence(s), ${exemptsGroupes.size} site(s) distinct(s), sur les mêmes ${couples.length} couples.\n` +
		'     AUCUN d’eux n’est dans les 707 : axe ne les rapporte pas. C’est la preuve\n' +
		'     directe que l’exemption est appliquée EN AMONT, et non qu’elle serait absente\n' +
		'     du gel.'
);
for (const v of [...exemptsGroupes.values()]
	.sort((a, b) => b.occurrences - a.occurrences)
	.slice(0, 12)) {
	console.log(
		`       ${v.vue}  ${String(v.occurrences).padStart(3)}×  ${v.motif}  « ${v.texte.slice(0, 34)} »`
	);
}
if (exemptsGroupes.size > 12)
	console.log(`       … et ${exemptsGroupes.size - 12} autre(s) site(s).`);

if (compte.exempt === 0) {
	console.log(
		'\n     LE SEAU « EXEMPT » EST VIDE, ET IL L’EST PAR CONSTRUCTION.\n' +
			'     `color-contrast-matches` d’axe-core 4.13 écarte lui-même tout nœud pour lequel\n' +
			'     `isDisabled()` ou `isInert()` rend vrai — et `isDisabled` REMONTE la chaîne des\n' +
			'     ascendants. Un texte porté par un composant déclaré inactif ne peut donc PAS\n' +
			'     figurer dans les 707 : axe applique déjà l’exemption de WCAG 1.4.3.\n' +
			'     Éprouvé par `node verif/contraste.mjs V-41 --sonde=exemption` (CLAUDE.md P-5).'
	);
}

console.log('\n  ── Les sites « réel », nommés ───────────────────────────────────────');
const sites = new Map();
for (const r of releves.filter((x) => x.nature === 'reel')) {
	const k = `${r.vue}|${r.signature}|${r.fond}`;
	const e = sites.get(k) ?? { ...r, occurrences: 0, etats: new Set(), fenetres: new Set() };
	e.occurrences++;
	e.etats.add(r.etat);
	e.fenetres.add(r.fenetre);
	sites.set(k, e);
}
const listeSites = [...sites.values()].sort((a, b) =>
	a.vue === b.vue ? b.occurrences - a.occurrences : a.vue.localeCompare(b.vue)
);
console.log(`     ${listeSites.length} site(s) distinct(s), ${compte.reel} occurrence(s)\n`);
for (const s of listeSites) {
	console.log(
		`     ${s.vue}  ${String(s.occurrences).padStart(3)}×  ${('.' + s.classes.join('.')).padEnd(26)} ` +
			`${String(s.ratio).padStart(5)}:1  ${(s.jetonAvantPlan ?? s.avantPlan).padEnd(13)}→ ${s.jetonReparation ?? '—'}` +
			`  « ${s.texte.slice(0, 44)} »`
	);
}

if (compte.indecidable) {
	console.log('\n  ── Les indécidables, et pourquoi ────────────────────────────────────');
	const ind = new Map();
	for (const r of releves.filter((x) => x.nature === 'indecidable')) {
		const k = `${r.vue}|${r.classes.join('.')}`;
		const e = ind.get(k) ?? { ...r, occurrences: 0 };
		e.occurrences++;
		ind.set(k, e);
	}
	for (const v of [...ind.values()].sort((a, b) => b.occurrences - a.occurrences)) {
		console.log(`     ${v.vue}  ${String(v.occurrences).padStart(3)}×  .${v.classes.join('.')}`);
		console.log(`             ${v.motif}`);
	}
}

if (compte.exempt) {
	console.log('\n  ── Les exempts, et par quoi ─────────────────────────────────────────');
	const ex = new Map();
	for (const r of releves.filter((x) => x.nature === 'exempt')) {
		const k = `${r.vue}|${r.classes.join('.')}|${r.motif}`;
		const e = ex.get(k) ?? { ...r, occurrences: 0 };
		e.occurrences++;
		ex.set(k, e);
	}
	for (const v of [...ex.values()].sort((a, b) => b.occurrences - a.occurrences)) {
		console.log(
			`     ${v.vue}  ${String(v.occurrences).padStart(3)}×  .${v.classes.join('.')} — ${v.motif}`
		);
	}
}

/* ── La non-couverture, CHIFFRÉE ──────────────────────────────────────────
   L'obligation d'instrument du dépôt : une non-couverture déclarée mais non
   mesurée ne dit pas sa taille. Ces deux comptes sont relevés STATIQUEMENT sur
   le gel, parce qu'aucune règle d'axe ne les produirait. */
const { readdirSync } = await import('node:fs');
const fichiersGel = readdirSync(RACINE_MAQUETTES).filter((f) => f.endsWith('.html'));
let champsAvecPlaceholder = 0;
let vuesPlaceholderEncre4 = 0;
let reglesPseudoEncre4 = 0;
for (const f of fichiersGel) {
	const src = readFileSync(join(RACINE_MAQUETTES, f), 'utf8');
	champsAvecPlaceholder += (src.match(/\splaceholder="/g) ?? []).length;
	if (/::placeholder\s*\{[^}]*--c-encre-4/.test(src)) vuesPlaceholderEncre4++;
	reglesPseudoEncre4 += (src.match(/::(before|after)[^{]*\{[^}]*--c-encre-4/g) ?? []).length;
}

console.log('\n  ── Ce que ce relevé NE regarde PAS ──────────────────────────────────');
console.log(
	`     · le texte de ::placeholder — ${champsAvecPlaceholder} champ(s) portent un attribut\n` +
		`       placeholder dans le gel, et ${vuesPlaceholderEncre4} vue(s) sur ${fichiersGel.length} colorent ::placeholder\n` +
		'       en --c-encre-4 (2,10 à 2,55:1). axe-core 4.13 N’ÉVALUE PAS le contraste des\n' +
		'       pseudo-éléments : AUCUN de ces sites n’est dans les 707. Or le placeholder\n' +
		"       d'un champ ACTIF n'est pas exempté par 1.4.3 — c'est un défaut non compté.\n" +
		`     · le texte injecté par \`content:\` en ::before/::after — ${reglesPseudoEncre4} règle(s) du gel\n` +
		'       le colorent en --c-encre-4, et axe ne les voit pas davantage.'
);
const NON_COUVERT = [
	'le contraste NON TEXTUEL (WCAG 1.4.11) — bordures, anneaux de focus, traits,',
	'  pictogrammes, témoins. axe 4.13 ne porte aucune règle dessus ; ce module part',
	'  des constats d’axe, donc il n’en voit rien. C’est la MOITIÉ de RG-M18-07.',
	'le contraste qu’axe refuse de trancher (`incomplete` : texte SVG, fonds recouverts).',
	'le côté application : les 707 sont de nature « gel », le relevé est fait côté gel.',
	'les états, fenêtres et vues qu’aucun scénario ne déclare : ce qui n’est pas joué',
	'  n’est pas mesuré (CLAUDE.md P-5).',
	'le caractère « lisible » d’un texte au-delà du rapport de contraste.'
];
for (const l of NON_COUVERT) console.log(`     ${l.startsWith('  ') ? '' : '· '}${l}`);

if (echecs.length) {
	console.log('\n  ── Couples non rejoués ──────────────────────────────────────────────');
	for (const e of echecs) console.log(`     ${e.couple} : ${e.erreur}`);
}

mkdirSync(DOSSIER_RAPPORTS, { recursive: true });
const chemin = join(DOSSIER_RAPPORTS, 'contraste.json');
writeFileSync(
	chemin,
	JSON.stringify(
		{
			mesure_du: new Date().toISOString(),
			rapport_source: cheminRapport,
			controles: ctrl,
			echelle: Object.fromEntries(
				Object.entries(ENCRES).map(([n, h]) => [
					n,
					Object.fromEntries(
						Object.entries(toutesSurfaces).map(([s, v]) => [s, Number(contraste(h, v).toFixed(3))])
					)
				])
			),
			regle_de_partage: {
				exempt:
					'inactivité DÉCLARÉE dans le DOM (disabled, aria-disabled, fieldset[disabled], inert, option de select désactivé)',
				reel: "aucune inactivité déclarée — texte actif, dans ou hors composant d'interface",
				indecidable:
					'marque conventionnelle du gel sans déclaration d’inactivité — voir MARQUES_CONVENTIONNELLES'
			},
			marques_conventionnelles: MARQUES_CONVENTIONNELLES,
			non_couverture: NON_COUVERT,
			attendu: totalAttendu,
			releve: total,
			partage: compte,
			partage_gel_707: compte707,
			exempts_hors_axe: {
				occurrences: exemptsHorsAxe.length,
				sites: [...exemptsGroupes.values()].map((e) => ({
					vue: e.vue,
					occurrences: e.occurrences,
					signature: e.signature,
					motif: e.motif,
					texte: e.texte
				}))
			},
			natures_du_rapport: Object.fromEntries(parNature),
			non_couverture_chiffree: {
				champs_avec_attribut_placeholder: champsAvecPlaceholder,
				vues_colorant_placeholder_en_encre_4: vuesPlaceholderEncre4,
				vues_du_gel: fichiersGel.length,
				regles_pseudo_element_en_encre_4: reglesPseudoEncre4,
				motif:
					"axe-core 4.13 n'évalue pas le contraste des pseudo-éléments : ces sites ne sont dans aucun des 707"
			},
			couples_de_jetons: Object.fromEntries(
				[...parCouple].map(([k, v]) => [
					k,
					{ occurrences: v.n, ratio: v.ratio, vues: [...v.vues].sort() }
				])
			),
			sites_reels: listeSites.map((s) => ({
				vue: s.vue,
				occurrences: s.occurrences,
				etats: [...s.etats].sort(),
				fenetres: [...s.fenetres].sort(),
				selecteur: s.selecteur,
				signature: s.signature,
				classes: s.classes,
				texte: s.texte,
				ratio: s.ratio,
				jeton_actuel: s.jetonAvantPlan ?? s.avantPlan,
				jeton_fond: s.jetonFond ?? s.fond,
				jeton_reparation: s.jetonReparation,
				/* La chaîne ascendante : le dossier de regel doit savoir OÙ la
				   couleur est posée — règle CSS, style en ligne d'un script de
				   maquette, ou héritage. Quatre des vingt-deux groupes ne
				   viennent PAS d'une règle `.classe { color: … }`. */
				chaine: (s.chaine ?? []).map(
					(c) =>
						c.tag + (c.id ? '#' + c.id : '') + (c.classes.length ? '.' + c.classes.join('.') : '')
				),
				style_en_ligne: s.styleEnLigne ?? null,
				ratio_apres: s.ratioApres ?? null,
				motif: s.motif
			})),
			indecidables: releves
				.filter((r) => r.nature === 'indecidable')
				.map((r) => ({
					vue: r.vue,
					etat: r.etat,
					fenetre: r.fenetre,
					classes: r.classes,
					texte: r.texte,
					motif: r.motif
				})),
			exempts: releves
				.filter((r) => r.nature === 'exempt')
				.map((r) => ({
					vue: r.vue,
					etat: r.etat,
					fenetre: r.fenetre,
					classes: r.classes,
					texte: r.texte,
					motif: r.motif
				})),
			echecs
		},
		null,
		'\t'
	)
);
console.log(`\n  Rapport : ${chemin}\n`);
