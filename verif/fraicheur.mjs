#!/usr/bin/env node
/**
 * verif:fraicheur — batterie 5 du catalogue (PLAN-DE-REALISATION.md §5).
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
 * POURQUOI IL EXISTE, ET C'EST UN AVEU
 *
 * `P-01` est l'un des dix principes non négociables : « il n'existe qu'une
 * seule définition du calcul de fraîcheur ». `ADR-005` le pose comme
 * interdiction active, et nomme lui-même l'écart type : « `si (jours > 180)`
 * dans une vue ».
 *
 * IL A ÉTÉ VIOLÉ PENDANT VINGT LOTS SANS QUE RIEN NE LE DÉTECTE. Deux vues
 * redéfinissaient localement `classeTemoin` et `libelleFraicheur` ; c'est un
 * exécutant qui l'a relevé en passant, pas le dispositif. `pnpm verif:fraicheur`
 * était un JALON (`verif/jalon.mjs`) : il sortait en 1 en annonçant son lot,
 * sans rien mesurer. Une batterie qui ne mesure pas est une batterie dont on
 * ignore ce qu'elle laisse passer — c'est le mode de défaillance RA-01.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX PROPRIÉTÉS PROUVÉES
 *
 *   (A) IL N'EXISTE QU'UNE IMPLÉMENTATION. Hors de `src/lib/fraicheur.ts`,
 *       aucune autre définition de `niveauFraicheur`, `barresFraicheur`,
 *       `classeTemoin`, `libelleFraicheur`, `temoinFraicheur` — ni fonction,
 *       ni constante, ni EXPRESSION ÉQUIVALENTE. Une réécriture se déguise :
 *       un `jours < 90 ? 'frais' : …` en ligne dans une vue est un second
 *       calcul, même sans nom. Quatre contrôles :
 *
 *         A1 — seconde déclaration nominale (fonction, constante, `window.x`)
 *         A2.1 — chaîne de décision sur le NIVEAU rendant une sortie de la
 *                fabrique : un nombre de barres, une classe `temoin--*`, un
 *                libellé de fraîcheur
 *         A2.2 — chaîne de décision sur l'ANCIENNETÉ ou sur un SEUIL rendant
 *                un niveau ou une classe de témoin — l'écart type d'ADR-005
 *         A2.3 — libellé de fraîcheur écrit en clair hors de la fabrique
 *         A3 — duplication des seuils sous forme de constante littérale
 *
 *   (B) TOUS LES AFFICHAGES L'APPELLENT. Toute vue qui rend un témoin, une
 *       jauge, un libellé de fraîcheur ou le cartouche de contrôle importe la
 *       fabrique unique, et CHAQUE FACETTE rendue en sort. Cinq contrôles :
 *
 *         B0 — le fichier qui rend un témoin importe `$lib/fraicheur`
 *         B1 — le modificateur de `.temoin` vient de `classeTemoin`
 *         B2 — le remplissage de `.temoin__jauge` vient de `barresFraicheur`
 *         B3 — le texte de `.temoin__txt` vient de `libelleFraicheur`
 *         B4 — la valeur de `.cartouche__valeur` vient de `libelleFraicheur`
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE « VIENT DE LA FABRIQUE » VEUT DIRE, MÉCANIQUEMENT
 *
 * Une facette vient de la fabrique si son expression appelle la fonction
 * correspondante — `classeTemoin(`, `barresFraicheur(`, `libelleFraicheur(` —,
 * ou si elle lit le champ correspondant d'un RECEVEUR, c'est-à-dire d'un
 * identifiant dont on prouve qu'il porte un `Temoin` :
 *
 *   • lié à un appel de `temoinFraicheur(…)` — `const t = temoinFraicheur(n)`,
 *     `{@const t = temoinFraicheur(n)}`, `$derived(temoinFraicheur(…))` ;
 *   • ANNOTÉ `: Temoin` — le type est celui de la fabrique, et `pnpm check`
 *     interdit de l'obtenir autrement. C'est ce qui admet le paramètre de
 *     `{#snippet temoin(t: Temoin)}` et celui de `jauge(t: Temoin)`.
 *
 * Le garde-fou compte : `{voisine.libelle}` porte bien `.libelle`, mais
 * `voisine` n'est pas un receveur — c'est une table écrite à la main. Sans la
 * condition de receveur, ce contrôle serait inerte, et une règle qu'aucun cas
 * n'exerce est une règle dont on ignore si elle marche (CLAUDE.md §6, P-5).
 *
 * Un RELAIS est admis à un niveau d'indirection : une fonction ou une
 * constante locale dont le corps lit lui-même la fabrique relaie la facette.
 * `jauge(t)` de V-41 en est un ; `barres(niveau)` de V-11, qui recalcule, n'en
 * est pas un — et c'est exactement la différence que la batterie doit voir.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA LECTURE EST DÉNUDÉE — SANS QUOI ELLE MENT
 *
 * Ce dépôt commente abondamment, EN CITANT LES FORMES INTERDITES : l'en-tête
 * de `NoteDeDemonstration.svelte` écrit « si (jours > 180) » pour dire qu'il
 * ne l'écrit pas, et `fraicheur.ts` recopie le gel en toutes lettres. Une
 * analyse qui lirait les commentaires trouverait des violations partout, et
 * serait à jeter. Chaque fichier est donc DÉNUDÉ avant analyse : blocs
 * `<style>`, commentaires de balisage, commentaires JavaScript des blocs
 * `<script>`, tous remplacés par des blancs DE MÊME LONGUEUR — les numéros de
 * ligne restent exacts. Les chaînes de caractères, elles, sont conservées :
 * un libellé écrit en clair EST une violation.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'UNIQUE EXEMPTION, ET SA BORNE
 *
 * `src/lib/fraicheur.test.ts` est exempté du SEUL contrôle A3 : son objet est
 * d'épingler les seuils du gel, il doit donc écrire 90 et 180. Il reste soumis
 * à A1, A2 et B. Aucun autre fichier n'est exempté de quoi que ce soit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * Usage :
 *   node verif/fraicheur.mjs            le contrôle — sort en 1 dès un constat
 *   node verif/fraicheur.mjs --sites    les sites de témoin relevés, décrits
 *   node verif/fraicheur.mjs --json     le relevé complet, exploitable
 *
 * Les modes descriptifs sortent en 0 : décrire n'est pas juger.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** L'implémentation unique. Elle seule a le droit d'écrire le calcul. */
export const IMPLEMENTATION = 'src/lib/fraicheur.ts';

/** L'unitaire de l'implémentation — exempté du seul contrôle A3. */
export const UNITAIRE_DE_L_IMPLEMENTATION = 'src/lib/fraicheur.test.ts';

/** Les dossiers du PRODUIT. `verif/` est le harnais, `mockups/` est le gel. */
export const DOSSIERS = ['src', 'seeds'];

/** Les noms de la fabrique. Aucun ne se redéclare hors de l'implémentation. */
export const NOMS_DE_LA_FABRIQUE = [
	'niveauFraicheur',
	'barresFraicheur',
	'classeTemoin',
	'libelleFraicheur',
	'temoinFraicheur',
	'SEUILS_PAR_DEFAUT',
	'BARRES_DE_JAUGE'
];

/**
 * Le nom que le GEL donnait au calcul — `window.niveauPour` (`V-14:3255`). Une
 * transposition qui le réemploierait serait une seconde définition sous son nom
 * d'origine. `window.impactSeuils` et `window.repartitionPour` n'y figurent PAS :
 * ce sont des CONSOMMATEURS du calcul, que V-33 réimplémente légitimement en
 * appelant `niveauFraicheur` — les confondre rendait la batterie rouge sur une
 * vue exemplaire, et une batterie qui crie faux ne se lit plus.
 */
export const NOMS_DU_GEL = ['niveauPour'];

/** Les trois niveaux, et jamais un quatrième (docs/DESIGN.md §3.7, 8). */
export const NIVEAUX = ['frais', 'vieil', 'obs'];

/** Les seuils par défaut du gel — treize maquettes, toutes à 90 / 180. */
export const SEUILS = [90, 180];

/** Les deux verbes du libellé. Le second est le changement de verbe de l'obsolète. */
export const VERBES_DE_LIBELLE = ['Vérifié il y a', 'Pas revu depuis'];

/** Le balisage du témoin — `docs/DESIGN.md` §3.3, inventaire fermé §2. */
export const MARQUEURS_DE_TEMOIN = [
	'temoin__jauge',
	'temoin__txt',
	'temoin--',
	'cartouche__valeur'
];

/* ═══ Dénudement ═══════════════════════════════════════════════════════════ */

/** Remplace une tranche par des blancs, en gardant les fins de ligne. */
function blanchir(texte, debut, fin) {
	let out = '';
	for (let i = debut; i < fin && i < texte.length; i++) out += texte[i] === '\n' ? '\n' : ' ';
	return texte.slice(0, debut) + out + texte.slice(Math.min(fin, texte.length));
}

function blanchirMotif(texte, motif) {
	let t = texte;
	for (const m of [...texte.matchAll(motif)]) t = blanchir(t, m.index, m.index + m[0].length);
	return t;
}

/**
 * Blanchit les commentaires JavaScript d'une source, en respectant les
 * chaînes — apostrophes, guillemets et gabarits, `${}` compris. Une chaîne
 * simple ou double non refermée sur sa ligne est refermée d'office : c'est ce
 * qui empêche une apostrophe française de faire dérailler le reste du fichier.
 */
export function denuderJs(source) {
	const out = source.split('');
	const pile = [];
	let i = 0;
	let dansChaine = false;
	let delim = '';
	while (i < source.length) {
		const c = source[i];
		const d = source[i + 1];
		if (!dansChaine) {
			if (c === '/' && d === '/') {
				while (i < source.length && source[i] !== '\n') out[i++] = ' ';
				continue;
			}
			if (c === '/' && d === '*') {
				while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
					if (source[i] !== '\n') out[i] = ' ';
					i++;
				}
				if (i < source.length) out[i] = ' ';
				if (i + 1 < source.length) out[i + 1] = ' ';
				i += 2;
				continue;
			}
			if (c === '"' || c === "'" || c === '`') {
				dansChaine = true;
				delim = c;
				i++;
				continue;
			}
			if (c === '}' && pile.length) {
				dansChaine = true;
				delim = pile.pop();
				i++;
				continue;
			}
			i++;
			continue;
		}
		if (c === '\\') {
			i += 2;
			continue;
		}
		if (delim === '`' && c === '$' && d === '{') {
			pile.push('`');
			dansChaine = false;
			i += 2;
			continue;
		}
		if (c === delim) {
			dansChaine = false;
			i++;
			continue;
		}
		if (c === '\n' && delim !== '`') {
			dansChaine = false;
			i++;
			continue;
		}
		i++;
	}
	return out.join('');
}

/** Les bornes des blocs `<script>` d'un fichier Svelte. */
export function blocsScript(texte) {
	const out = [];
	for (const m of texte.matchAll(/<script\b[^>]*>/g)) {
		const debut = m.index + m[0].length;
		const fin = texte.indexOf('</script>', debut);
		if (fin < 0) break;
		out.push({ debut, fin });
	}
	return out;
}

/**
 * La source dénudée : mêmes longueurs, mêmes lignes, sans commentaires ni
 * blocs `<style>`. Les commentaires JavaScript ne sont retirés que DANS les
 * blocs `<script>` : le balisage porte de la prose française, dont les
 * apostrophes ne sont pas des chaînes.
 */
export function denuder(source, extension) {
	if (extension !== '.svelte') return denuderJs(source);
	let t = blanchirMotif(source, /<style\b[^>]*>[\s\S]*?<\/style>/g);
	t = blanchirMotif(t, /<!--[\s\S]*?-->/g);
	for (const b of blocsScript(t)) {
		const nu = denuderJs(t.slice(b.debut, b.fin));
		t = t.slice(0, b.debut) + nu + t.slice(b.fin);
	}
	return t;
}

/* ═══ Outils de lecture ════════════════════════════════════════════════════ */

export function ligneDe(texte, index) {
	let n = 1;
	for (let i = 0; i < index && i < texte.length; i++) if (texte.charCodeAt(i) === 10) n++;
	return n;
}

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ═══ La fabrique : receveurs, accès, relais ═══════════════════════════════ */

const ACCES = {
	barres: { appel: /\bbarresFraicheur\s*\(/, champ: 'barres' },
	classe: { appel: /\bclasseTemoin\s*\(/, champ: 'classe' },
	libelle: { appel: /\blibelleFraicheur\s*\(/, champ: 'libelle' }
};

/**
 * Les identifiants dont on PROUVE qu'ils portent un `Temoin` : liés à un appel
 * de la fabrique, ou annotés du type de la fabrique.
 */
export function receveursDeTemoin(nu) {
	const r = new Set();
	for (const m of nu.matchAll(
		/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*(?:\$derived\(\s*)?temoinFraicheur\s*\(/g
	))
		r.add(m[1]);
	for (const m of nu.matchAll(/\{@const\s+([A-Za-z_$][\w$]*)\s*=\s*temoinFraicheur\s*\(/g))
		r.add(m[1]);
	for (const m of nu.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*(?:readonly\s+)?Temoin\b/g)) r.add(m[1]);
	return r;
}

/** La facette de ce fragment sort-elle de la fabrique, directement ? */
export function vientDeLaFabrique(fragment, facette, receveurs) {
	if (ACCES[facette].appel.test(fragment)) return true;
	for (const r of receveurs)
		if (new RegExp(`\\b${echapper(r)}\\s*\\.\\s*${ACCES[facette].champ}\\b`).test(fragment))
			return true;
	return false;
}

/** Le corps d'une déclaration : jusqu'à la déclaration suivante, 600 signes au plus. */
function corpsDe(nu, debut) {
	const reste = nu.slice(debut + 1, debut + 600);
	const suivant = reste.search(/\n\s*(?:export\s+)?(?:function|const|let|var|class)\s/);
	return nu.slice(debut, debut + 1 + (suivant >= 0 ? suivant : reste.length));
}

/**
 * Les RELAIS d'une facette : les fonctions et constantes locales dont le corps
 * lit lui-même la fabrique. Un seul niveau d'indirection est admis, et il est
 * déclaré comme tel au rapport.
 */
export function relaisDe(nu, facette, receveurs) {
	const noms = new Set();
	for (const m of nu.matchAll(
		/(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=)/g
	)) {
		const nom = m[1] ?? m[2];
		if (!nom) continue;
		if (vientDeLaFabrique(corpsDe(nu, m.index), facette, receveurs)) noms.add(nom);
	}
	return noms;
}

/** La facette vient-elle de la fabrique, directement ou par un relais admis ? */
export function facetteHonoree(fragment, facette, receveurs, relais) {
	if (vientDeLaFabrique(fragment, facette, receveurs)) return true;
	for (const r of relais) if (new RegExp(`\\b${echapper(r)}\\b`).test(fragment)) return true;
	return false;
}

/* ═══ (A) L'unicité de l'implémentation ════════════════════════════════════ */

/** A1 — une seconde déclaration nominale, sous l'un des noms de la fabrique. */
export function constatsA1(nu) {
	const out = [];
	const noms = [...new Set([...NOMS_DE_LA_FABRIQUE, ...NOMS_DU_GEL])].map(echapper).join('|');
	for (const m of nu.matchAll(new RegExp(`(?:function|const|let|var|class)\\s+(${noms})\\b`, 'g')))
		out.push({ controle: 'A1', index: m.index, quoi: m[1], comment: 'déclaration' });
	for (const m of nu.matchAll(
		new RegExp(
			`(?:^|[^.\\w$])(${noms})\\s*[:=]\\s*(?:function\\b|\\([^)]*\\)\\s*=>|[\\w$]+\\s*=>)`,
			'gm'
		)
	))
		out.push({ controle: 'A1', index: m.index, quoi: m[1], comment: 'affectation de fonction' });
	for (const m of nu.matchAll(new RegExp(`window\\s*\\.\\s*(${noms})\\s*=`, 'g')))
		out.push({
			controle: 'A1',
			index: m.index,
			quoi: `window.${m[1]}`,
			comment: 'transposition du gel'
		});
	return out;
}

/* Les trois SORTIES de la fabrique, telles qu'une réécriture les produit.
   Chaque motif exige que la BRANCHE ENTIÈRE soit la sortie : `? 3 :` et non
   « un 3 quelque part ». Sans cette exigence, la prose datée du cartouche de
   V-03 — « contrôlé le 2 août 2026 » — passerait pour un nombre de barres. */
const SORTIES = [
	{
		nom: 'un nombre de barres',
		motifs: [/\?\s*[123]\s*[:)]/, /:\s*[123]\s*[;,)\]}]/, /\breturn\s+[123]\s*;/]
	},
	{ nom: 'une classe de témoin', motifs: [/['"`]temoin--/] },
	{
		nom: 'un libellé de fraîcheur',
		motifs: VERBES_DE_LIBELLE.map((v) => new RegExp(`['"\`][^'"\`]*${echapper(v)}`))
	}
];

const NIVEAUX_EN_BRANCHE = [
	{
		nom: 'un niveau de fraîcheur',
		motifs: NIVEAUX.map((n) => new RegExp(`[?:]\\s*['"\`]${n}['"\`]`))
	},
	{ nom: 'une classe de témoin', motifs: [/['"`]temoin--/] }
];

/** La portée d'une décision : la branche qui suit, bornée. */
const PORTEE = 260;

function sortieTrouvee(suite, table) {
	for (const s of table) for (const m of s.motifs) if (m.test(suite)) return s.nom;
	return null;
}

/**
 * A2.1 — une chaîne de décision sur le NIVEAU qui rend une sortie de la
 * fabrique. `niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1` est
 * `barresFraicheur`, réécrit sans son nom.
 */
export function constatsA21(nu) {
	const out = [];
	const re = new RegExp(`[=!]==?\\s*['"\`](${NIVEAUX.join('|')})['"\`]`, 'g');
	for (const m of nu.matchAll(re)) {
		const apres = m.index + m[0].length;
		const suite = nu.slice(apres, apres + PORTEE);
		/* Une décision, et non une lecture : le littéral est immédiatement suivi
		   d'un `?` de ternaire, ou de la fermeture d'un `if`. */
		const ternaire = /^[\s)]*\?/.test(suite);
		const conditionnelle = /^[\s)]*(?:\{|return\b)/.test(suite);
		if (!ternaire && !conditionnelle) continue;
		const quoi = sortieTrouvee(suite, SORTIES);
		if (quoi)
			out.push({
				controle: 'A2.1',
				index: m.index,
				quoi,
				comment: `décision sur le niveau « ${m[1]} »`,
				portee: [m.index, apres + PORTEE]
			});
	}
	return out;
}

/**
 * A2.2 — une chaîne de décision sur l'ANCIENNETÉ ou sur un SEUIL qui rend un
 * niveau. C'est l'écart type qu'ADR-005 nomme : « `si (jours > 180)` dans une
 * vue ».
 */
export function constatsA22(nu) {
	const out = [];
	const gauche = `(?:[\\w$]+\\s*\\.\\s*)?(?:jours?|anciennete|ancienneté|age|vieillissement)`;
	const droite = `(?:\\d+|(?:[\\w$]+\\s*\\.\\s*)?(?:seuil[\\w$]*|frais|vieillissant))`;
	const re = new RegExp(`\\b(${gauche})\\s*(<=?|>=?)\\s*(${droite})\\b`, 'gi');
	for (const m of nu.matchAll(re)) {
		const apres = m.index + m[0].length;
		const suite = nu.slice(apres, apres + PORTEE);
		if (!/^[\s)]*(?:\?|\{|return\b)/.test(suite)) continue;
		const quoi = sortieTrouvee(suite, NIVEAUX_EN_BRANCHE);
		if (quoi)
			out.push({
				controle: 'A2.2',
				index: m.index,
				quoi,
				comment: `décision sur l'ancienneté « ${m[0].trim()} »`,
				portee: [m.index, apres + PORTEE]
			});
	}
	return out;
}

/** A2.3 — un libellé de fraîcheur écrit en clair, hors de la fabrique. */
export function constatsA23(nu) {
	const out = [];
	for (const verbe of VERBES_DE_LIBELLE)
		for (const m of nu.matchAll(new RegExp(`['"\`][^'"\`\\n]*${echapper(verbe)}`, 'g')))
			out.push({
				controle: 'A2.3',
				index: m.index,
				quoi: `libellé « ${verbe} … » construit localement`,
				comment: 'ADR-005 : « tout libellé de fraîcheur construit localement »'
			});
	return out;
}

/** A3 — une duplication littérale des seuils, hors de la configuration lue. */
export function constatsA3(nu) {
	const out = [];
	const re = new RegExp(
		`\\b([\\w$]*(?:seuil|frais|vieillissant)[\\w$]*)\\s*:\\s*(${SEUILS.join('|')})\\b`,
		'gi'
	);
	for (const m of nu.matchAll(re))
		out.push({
			controle: 'A3',
			index: m.index,
			quoi: `${m[1]} : ${m[2]}`,
			comment: 'seuil littéral'
		});
	for (const m of nu.matchAll(new RegExp(`\\[\\s*${SEUILS[0]}\\s*,\\s*${SEUILS[1]}\\s*\\]`, 'g')))
		out.push({
			controle: 'A3',
			index: m.index,
			quoi: `couple de seuils ${m[0]}`,
			comment: 'le couple par défaut, retranscrit'
		});
	return out;
}

/* ═══ (B) Tous les affichages appellent la fabrique ════════════════════════ */

/** Le fichier rend-il quelque chose du témoin ? */
export function rendUnTemoin(nu) {
	if (/class\s*=\s*"temoin(?:\s|")/.test(nu)) return true;
	return MARQUEURS_DE_TEMOIN.some((m) => nu.includes(m));
}

/** La région qui suit un marqueur de balisage, bornée. */
function region(nu, index, taille) {
	return nu.slice(index, index + taille);
}

export function constatsB(nu, receveurs) {
	const out = [];
	const relais = {
		classe: relaisDe(nu, 'classe', receveurs),
		barres: relaisDe(nu, 'barres', receveurs),
		libelle: relaisDe(nu, 'libelle', receveurs)
	};

	/* B1 — le modificateur de `.temoin`. La teinte vient de LUI seul
	   (docs/DESIGN.md §3.4) : s'il est écrit à la main, la teinte l'est aussi. */
	for (const m of nu.matchAll(/class\s*=\s*"temoin(\s[^"]*)?"/g)) {
		const valeur = m[1] ?? '';
		if (!facetteHonoree(valeur, 'classe', receveurs, relais.classe))
			out.push({
				controle: 'B1',
				index: m.index,
				quoi: `class="temoin${valeur}"`,
				comment: 'le modificateur de niveau ne vient pas de classeTemoin()'
			});
	}

	/* B2 — le remplissage de la jauge. Trois `<i>` toujours, `.plein` sur les n
	   premiers : c'est `n` qui doit sortir de la fabrique. */
	for (const m of nu.matchAll(/temoin__jauge/g)) {
		const r = region(nu, m.index, 700);
		if (!facetteHonoree(r, 'barres', receveurs, relais.barres))
			out.push({
				controle: 'B2',
				index: m.index,
				quoi: '.temoin__jauge',
				comment: 'le nombre de barres pleines ne vient pas de barresFraicheur()'
			});
	}

	/* B3 — le texte du témoin. `docs/DESIGN.md` §3.7, 1 : un signal sans durée
	   lisible ne remplit pas son rôle — et cette durée sort du même calcul. */
	for (const m of nu.matchAll(/temoin__txt/g)) {
		const r = region(nu, m.index, 260);
		if (!facetteHonoree(r, 'libelle', receveurs, relais.libelle))
			out.push({
				controle: 'B3',
				index: m.index,
				quoi: '.temoin__txt',
				comment: 'le libellé ne vient pas de libelleFraicheur()'
			});
	}

	/* B4 — le cartouche de contrôle. Sa valeur EST le libellé de fraîcheur ;
	   `NoteDeDemonstration.svelte` le prouve en le tirant de la fabrique. */
	for (const m of nu.matchAll(/cartouche__valeur/g)) {
		const r = region(nu, m.index, 260);
		if (!facetteHonoree(r, 'libelle', receveurs, relais.libelle))
			out.push({
				controle: 'B4',
				index: m.index,
				quoi: '.cartouche__valeur',
				comment: 'la valeur du cartouche ne vient pas de libelleFraicheur()'
			});
	}
	return out;
}

/** B0 — le fichier qui rend un témoin importe la fabrique unique. */
export function constatB0(nu, rel) {
	if (!rendUnTemoin(nu)) return null;
	if (/from\s+['"](?:\$lib\/fraicheur|[./]*fraicheur)['"]/.test(nu)) return null;
	return {
		controle: 'B0',
		index: nu.search(/class\s*=\s*"temoin|temoin__jauge|temoin__txt|cartouche__valeur/),
		quoi: rel,
		comment: 'rend un témoin sans importer $lib/fraicheur'
	};
}

/* ═══ Le périmètre ═════════════════════════════════════════════════════════ */

const EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.svelte']);

function fichiersDe(dossier) {
	const out = [];
	if (!existsSync(dossier)) return out;
	for (const entree of readdirSync(dossier).sort()) {
		if (entree === 'node_modules' || entree.startsWith('.')) continue;
		const chemin = join(dossier, entree);
		if (statSync(chemin).isDirectory()) out.push(...fichiersDe(chemin));
		else if (EXTENSIONS.has(extname(entree))) out.push(chemin);
	}
	return out;
}

export function perimetre() {
	return DOSSIERS.flatMap((d) => fichiersDe(join(RACINE, d)))
		.map((c) => relative(RACINE, c))
		.filter((r) => r !== IMPLEMENTATION)
		.sort();
}

/* ═══ L'analyse ════════════════════════════════════════════════════════════ */

export function analyserFichier(rel, source) {
	const nu = denuder(source, extname(rel));
	const receveurs = receveursDeTemoin(nu);
	const bruts = [
		...constatsA1(nu),
		...constatsA21(nu),
		...constatsA22(nu),
		...constatsA3(nu).filter(() => rel !== UNITAIRE_DE_L_IMPLEMENTATION),
		...constatsB(nu, receveurs)
	];
	/* UNE CHAÎNE DE DÉCISION NE COMPTE QU'UNE FOIS. `n === 'frais' ? 3 : n ===
	   'vieil' ? 2 : 1` porte deux comparaisons et un seul défaut ; les compter
	   deux fois enflerait le décompte sans qu'un second défaut existe. Deux
	   constats se replient s'ils nomment la MÊME sortie et que le second tombe
	   dans la portée du premier — deux sorties différentes sur les mêmes lignes,
	   elles, restent deux constats : le `barres` et le `valeur` de V-03 sont
	   deux réécritures distinctes. */
	const replies = [];
	for (const c of bruts) {
		if (
			c.portee &&
			replies.some(
				(v) => v.portee && v.quoi === c.quoi && c.index >= v.portee[0] && c.index <= v.portee[1]
			)
		)
			continue;
		replies.push(c);
	}
	const porteesDeLibelle = replies
		.filter((c) => c.portee && c.quoi === 'un libellé de fraîcheur')
		.map((c) => c.portee);
	for (const c of constatsA23(nu))
		if (!porteesDeLibelle.some(([a, b]) => c.index >= a && c.index <= b)) replies.push(c);
	const bruts2 = replies;

	const b0 = constatB0(nu, rel);
	if (b0) bruts2.push(b0);

	/* CE QUE LES CONTRÔLES ONT RÉELLEMENT EXAMINÉ. Un vert ne vaut que ce que la
	   commande a emprunté (CLAUDE.md §4) : sans ces nombres, « aucun constat »
	   est indiscernable de « aucun regard ». Ils sont imprimés au rapport. */
	const compter = (re) => [...nu.matchAll(re)].length;
	const sondes = {
		niveaux: compter(new RegExp(`[=!]==?\\s*['"\`](${NIVEAUX.join('|')})['"\`]`, 'g')),
		anciennetes: compter(/\b(?:[\w$]+\s*\.\s*)?(?:jours?|anciennete|age)\s*(?:<=?|>=?)/gi),
		facettes:
			compter(/class\s*=\s*"temoin(?:\s[^"]*)?"/g) +
			compter(/temoin__jauge/g) +
			compter(/temoin__txt/g) +
			compter(/cartouche__valeur/g)
	};

	return {
		receveurs: [...receveurs].sort(),
		temoin: rendUnTemoin(nu),
		sondes,
		constats: bruts2
			.map((c) => ({ ...c, fichier: rel, ligne: ligneDe(nu, c.index) }))
			.sort((x, y) => x.ligne - y.ligne || x.controle.localeCompare(y.controle))
	};
}

export function analyser(rels = perimetre()) {
	const fichiers = [];
	for (const rel of rels) {
		const source = readFileSync(join(RACINE, rel), 'utf8');
		fichiers.push({ rel, ...analyserFichier(rel, source) });
	}
	return fichiers;
}

/* ═══ Ce qui n'est PAS couvert — mesuré, jamais supposé ════════════════════ */

/**
 * Un instrument qui tait ce qu'il ne couvre pas fait croire à une couverture
 * qu'il n'a pas (RA-01). Quatre instruments de ce dépôt l'ont dit, et l'un
 * d'eux a laissé passer une phrase codée en dur devenue fausse — quatre lots
 * l'ont signalée. Ici, CHAQUE ligne de cette liste est un NOMBRE RECALCULÉ à
 * l'exécution : si le dépôt change, la déclaration change avec lui.
 */
export function mesurerNonCouvert(fichiers) {
	const lu = new Map(fichiers.map((f) => [f.rel, readFileSync(join(RACINE, f.rel), 'utf8')]));
	const nu = new Map([...lu].map(([r, s]) => [r, denuder(s, extname(r))]));

	const gelees = existsSync(join(RACINE, 'mockups'))
		? readdirSync(join(RACINE, 'mockups')).filter((f) => /^V-\d\d-.*\.html$/.test(f)).length
		: 0;
	const vues = fichiers.filter((f) => /^src\/vues\/V-\d\d\.svelte$/.test(f.rel)).length;

	/* Les AGRÉGATS de P-01 — « les agrégats de domaine, ceux d'univers et les
	   indicateurs d'accueil ». Ils lisent tous le même niveau, la batterie le
	   prouve ; mais leur FORMULE n'a pas de fabrique unique à quoi la comparer. */
	const sitesAgregat = [...nu]
		.filter(([, s]) => NIVEAUX.every((n) => new RegExp(`cle\\s*:\\s*['"\`]${n}['"\`]`).test(s)))
		.map(([r]) => r);
	const impl = readFileSync(join(RACINE, IMPLEMENTATION), 'utf8');
	const exportsImpl = [
		...impl.matchAll(/export\s+(?:function|const|interface|type)\s+([\w$]+)/g)
	].map((m) => m[1]);
	const fabriquesDAgregat = exportsImpl.filter((n) =>
		/agreg|repartition|part|pourcent|sante/i.test(n)
	);

	/* Les PROJECTIONS DÉRIVÉES d'ADR-005 — vue SQL, champ d'index, export. Une
	   requête SQL ne suffit pas : le corpus de démonstration en CITE dans le
	   corps d'une note, et compter ces citations aurait rendu le nombre faux.
	   Une projection est une construction de vue, d'index ou d'export QUI PORTE
	   LA FRAÎCHEUR. */
	const porteLaFraicheur = (s) =>
		/\bfraicheur\b|\bNiveauFraicheur\b|\bseuil/i.test(s) ||
		NIVEAUX.some((n) => new RegExp(`['"\`]${n}['"\`]`).test(s));
	const projections = [...nu]
		.filter(([, s]) =>
			/\b(?:CREATE\s+(?:VIEW|INDEX|MATERIALIZED)|createIndex|indexer|projeter)\b/i.test(s)
		)
		.filter(([, s]) => porteLaFraicheur(s))
		.map(([r]) => r);
	const sql = fichiersDeSuffixe(RACINE, '.sql');

	/* Les classes posées par une EXPRESSION non littérale : elles échappent au
	   relevé de balisage, qui lit des littéraux. */
	const dynamiques = [...nu].reduce(
		(n, [, s]) =>
			n + [...s.matchAll(/class\s*=\s*\{([^}]*)\}/g)].filter((m) => !/['"`]/.test(m[1])).length,
		0
	);

	/* Le HARNAIS, hors périmètre : `verif/**` n'est pas le produit. */
	const harnais = fichiersDe(join(RACINE, 'verif'))
		.map((c) => relative(RACINE, c))
		.filter((r) => r !== 'verif/fraicheur.mjs' && r !== 'verif/fraicheur.test.ts')
		.filter((r) => {
			const s = denuder(readFileSync(join(RACINE, r), 'utf8'), extname(r));
			return NOMS_DE_LA_FABRIQUE.some((n) => s.includes(n)) || /temoin/.test(s);
		});

	const motifs =
		NOMS_DE_LA_FABRIQUE.length +
		NOMS_DU_GEL.length +
		NIVEAUX.length +
		SEUILS.length +
		VERBES_DE_LIBELLE.length +
		MARQUEURS_DE_TEMOIN.length +
		1; /* + `class="temoin` */

	return {
		gelees,
		vues,
		sitesAgregat,
		fabriquesDAgregat,
		projections,
		sql,
		dynamiques,
		harnais,
		motifs
	};
}

function fichiersDeSuffixe(racine, suffixe) {
	const out = [];
	const marcher = (d) => {
		for (const e of readdirSync(d).sort()) {
			if (e === 'node_modules' || e.startsWith('.') || e === 'build') continue;
			const c = join(d, e);
			if (statSync(c).isDirectory()) marcher(c);
			else if (e.endsWith(suffixe)) out.push(relative(racine, c));
		}
	};
	marcher(racine);
	return out;
}

/* ═══ Le rapport ═══════════════════════════════════════════════════════════ */

function bandeau() {
	console.log('verif:fraicheur — batterie 5 « unicité du calcul de fraîcheur »');
	console.log('  fondement : P-01 (dix principes non négociables), ADR-005, RG-M06-03');
	console.log('  INSTRUMENT DE MESURE — périmètre d’écriture humain / orchestrateur. Un rouge se');
	console.log('  sort par le protocole d’écart, jamais en modifiant ce fichier.');
}

function autoControle(fichiers) {
	/* Un banc toujours vert ne prouve rien (RA-01). Si le périmètre est vide, si
	   l'implémentation a disparu, ou si AUCUN témoin n'est relevé alors que des
	   vues existent, l'instrument refuse de conclure — il ne conclut pas au vert. */
	const anomalies = [];
	if (!existsSync(join(RACINE, IMPLEMENTATION)))
		anomalies.push(`l'implémentation unique ${IMPLEMENTATION} est absente`);
	if (fichiers.length === 0)
		anomalies.push('le périmètre est vide : aucun fichier de produit analysé');
	const vues = fichiers.filter((f) => /^src\/vues\/V-\d\d\.svelte$/.test(f.rel)).length;
	const sites = fichiers.filter((f) => f.temoin).length;
	if (vues > 0 && sites === 0)
		anomalies.push(
			`${vues} vues implémentées et aucun site de témoin relevé : le relevé est inerte`
		);
	return anomalies;
}

function rapport(fichiers) {
	bandeau();
	const constats = fichiers.flatMap((f) => f.constats);
	const porteurs = fichiers.filter((f) => f.temoin);

	console.log(`\n  implémentation unique : ${IMPLEMENTATION}`);
	console.log(`  fichiers de produit analysés : ${fichiers.length} (src/**, seeds/**)`);
	console.log(`  fichiers qui rendent un témoin : ${porteurs.length}`);
	for (const f of porteurs)
		console.log(
			`      ${f.rel}${f.receveurs.length ? `  receveurs de Temoin : ${f.receveurs.join(', ')}` : ''}`
		);

	const anomalies = autoControle(fichiers);
	if (anomalies.length) {
		console.error('\nverif:fraicheur — REFUS DE CONCLURE : le relevé lui-même est suspect.\n');
		for (const a of anomalies) console.error(`  ${a}`);
		console.error('');
		return 2;
	}

	if (constats.length) {
		console.error(`\nverif:fraicheur — ÉCHEC : ${constats.length} constat(s).\n`);
		const par = new Map();
		for (const c of constats) {
			if (!par.has(c.controle)) par.set(c.controle, []);
			par.get(c.controle).push(c);
		}
		for (const [controle, liste] of [...par].sort()) {
			console.error(`  ${controle} — ${liste.length} constat(s)`);
			for (const c of liste)
				console.error(`    ${c.fichier}:${c.ligne} — ${c.quoi} · ${c.comment}`);
			console.error('');
		}
		console.error(
			'P-01 est l’un des dix principes non négociables : « le badge d’une note, les\n' +
				'agrégats de domaine, ceux d’univers et les indicateurs d’accueil emploient\n' +
				'rigoureusement le même calcul. Deux définitions concurrentes ruinent la\n' +
				'crédibilité du signal. » La voie normale est d’APPELER `$lib/fraicheur` ; si\n' +
				'la fabrique ne rend pas la forme attendue, c’est un écart à déclarer, jamais\n' +
				'un second calcul à écrire. Spécification : docs/adr/ADR-005.md, docs/DESIGN.md §3.7.\n'
		);
	} else {
		const somme = (c) => fichiers.reduce((n, f) => n + f.sondes[c], 0);
		console.log('\n  (A) unicité de l’implémentation — et ce qui a été examiné pour le dire');
		console.log('      A1 seconde déclaration nominale : aucune');
		console.log(
			`      A2.1 décision sur le niveau : ${somme('niveaux')} comparaison(s) à un niveau examinée(s), aucune ne rend une sortie de la fabrique`
		);
		console.log(
			`      A2.2 décision sur l’ancienneté : ${somme('anciennetes')} comparaison(s) d’ancienneté examinée(s), aucune ne rend un niveau`
		);
		console.log('      A2.3 libellé de fraîcheur écrit en clair : aucun');
		console.log('      A3 duplication littérale des seuils : aucune');
		console.log('  (B) tous les affichages appellent la fabrique');
		console.log(`      B0 import de $lib/fraicheur : ${porteurs.length}/${porteurs.length}`);
		console.log(
			`      B1 classe · B2 jauge · B3 libellé · B4 cartouche : ${somme('facettes')} facette(s) rendues, toutes honorées`
		);
	}

	nonCouvert(fichiers);
	return constats.length ? 1 : 0;
}

function nonCouvert(fichiers) {
	const m = mesurerNonCouvert(fichiers);
	console.log('\n  NON COUVERT PAR CETTE BATTERIE — et chaque nombre est mesuré à l’exécution :');
	console.log(
		`  • LE RENDU. La batterie lit la SOURCE, jamais le DOM. ${m.vues} vues sur ${m.gelees}\n` +
			`    maquettes gelées sont implémentées ; ce qu’elles rendent réellement relève de\n` +
			`    la batterie 11 (pnpm verif:maquette), et la correction du calcul de la\n` +
			`    batterie 3 (pnpm test:unit).`
	);
	console.log(
		`  • LES AGRÉGATS de P-01 — « les agrégats de domaine, ceux d’univers et les\n` +
			`    indicateurs d’accueil ». ${m.sitesAgregat.length} fichier(s) portent une table de\n` +
			`    parts par niveau — le motif MESURÉ est \`cle: 'frais'|'vieil'|'obs'\` :\n` +
			`      ${m.sitesAgregat.join(', ') || 'aucun'}\n` +
			`    et ${m.fabriquesDAgregat.length} fabrique(s) d’agrégat exportée(s) par\n` +
			`    ${IMPLEMENTATION}. La batterie prouve que ces sites lisent tous le MÊME\n` +
			`    niveau ; elle ne peut pas prouver l’unicité de leur FORMULE, faute d’une\n` +
			`    définition unique à quoi la comparer. Vide de contrat, non comblé ici.`
	);
	const totalProjections = m.sql.length + m.projections.length;
	console.log(
		`  • LES PROJECTIONS DÉRIVÉES qu’ADR-005 veut « générées depuis la définition\n` +
			`    unique et vérifiées contre elle » : ${m.sql.length} fichier(s) .sql et\n` +
			`    ${m.projections.length} module(s) construisant une vue, un index ou un export\n` +
			`    QUI PORTE la fraîcheur${totalProjections ? ` — ${[...m.sql, ...m.projections].join(', ')}` : ''}.\n` +
			(totalProjections === 0
				? `    Le contrôle n’a rien à mordre aujourd’hui, et n’en prouve donc rien : sa\n` +
					`    prémisse tombe au premier de ces artefacts, et il sera alors à écrire.`
				: `    Ils NE SONT PAS comparés à l’implémentation unique : ce contrôle reste à\n` +
					`    écrire, et sa prémisse est désormais levée.`)
	);
	console.log(
		`  • LES CLASSES POSÉES PAR UNE EXPRESSION NON LITTÉRALE : ${m.dynamiques} occurrence(s)\n` +
			`    de class={…} sans littéral dans le périmètre. Elles échappent au relevé B1,\n` +
			`    qui lit des littéraux de balisage.`
	);
	console.log(
		`  • LE HARNAIS. ${m.harnais.length} fichier(s) de verif/** nomment la fraîcheur ou le\n` +
			`    témoin${m.harnais.length ? ` — ${m.harnais.join(', ')}` : ''} ; ils ne sont pas\n` +
			`    analysés : verif/** est l’instrument, pas le produit. mockups/** ne l’est pas\n` +
			`    davantage — le gel est la SOURCE du calcul, pas un second calcul.`
	);
	console.log(
		`  • UN SECOND CALCUL QUI NE TOUCHERAIT AUCUN des ${m.motifs} motifs reconnus — ni les\n` +
			`    noms de la fabrique, ni les trois niveaux, ni les seuils, ni les verbes du\n` +
			`    libellé, ni le balisage du témoin — resterait invisible. La batterie borne\n` +
			`    la réécriture DÉGUISÉE, pas la réécriture ÉTRANGÈRE.`
	);
	console.log(
		`  • L’UNIQUE EXEMPTION : ${UNITAIRE_DE_L_IMPLEMENTATION} n’est pas soumis à A3 —\n` +
			`    épingler 90 et 180 est son objet même. Il reste soumis à A1, A2 et B.\n`
	);
}

/* ═══ Modes descriptifs ════════════════════════════════════════════════════ */

function sites(fichiers) {
	bandeau();
	console.log('\n  Les sites de témoin du produit, et ce qui alimente chaque facette.\n');
	for (const f of fichiers.filter((x) => x.temoin)) {
		const source = readFileSync(join(RACINE, f.rel), 'utf8');
		const nu = denuder(source, extname(f.rel));
		const marques = [];
		/* La racine du témoin se relève avec le MÊME motif que B1 : `class="temoin`
		   est aussi le début de `class="temoin__jauge"`, et un relevé descriptif
		   qui compterait le préfixe ferait voir trois racines là où il n'y en a
		   qu'une. Décrire n'est pas juger, mais décrire faux égare. */
		for (const m of nu.matchAll(/class\s*=\s*"temoin(?:\s[^"]*)?"/g))
			marques.push(`.temoin@${ligneDe(nu, m.index)}`);
		for (const marque of MARQUEURS_DE_TEMOIN)
			for (const m of nu.matchAll(new RegExp(echapper(marque), 'g')))
				marques.push(`${marque}@${ligneDe(nu, m.index)}`);
		console.log(`   ${f.rel}`);
		console.log(`       receveurs : ${f.receveurs.join(', ') || '—'}`);
		console.log(`       balisage  : ${marques.join(' ')}`);
		console.log(`       constats  : ${f.constats.length}`);
	}
	console.log('');
}

/* ═══ Entrée ═══════════════════════════════════════════════════════════════ */

if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
	const args = process.argv.slice(2);
	const fichiers = analyser();
	if (args.includes('--json')) {
		console.log(JSON.stringify({ fichiers, nonCouvert: mesurerNonCouvert(fichiers) }, null, '\t'));
		process.exit(0);
	} else if (args.includes('--sites')) {
		sites(fichiers);
		process.exit(0);
	} else {
		process.exit(rapport(fichiers));
	}
}
