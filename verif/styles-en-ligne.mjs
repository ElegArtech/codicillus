#!/usr/bin/env node
/**
 * styles-en-ligne — P-6.4, le style en ligne prouvé par le gel.
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
 * CE QU'IL CONTRÔLE — ARB-016
 *
 * `docs/ecarts/ECART-015.md` É-3 a mesuré la contradiction : 62 constats
 * `verif:jetons` — 49 P-1.7, 5 P-1.3, 3 P-1.4, 3 P-1.2, 2 P-1.1 — portant TOUS
 * sur des attributs `style="…"` que la maquette gelée porte elle-même. Sceaux
 * colorés des quatre types de V-38, géométrie des esquisses de chargement de
 * V-39, boutons destructifs de V-40. Aucun n'est décoratif : les retirer
 * déplace le rendu, les garder rend la batterie rouge. Les deux contraintes
 * sont vraies et incompatibles.
 *
 * C'est `ECART-011` É-2 d'un cran plus loin. P-6.3 a RENVERSÉ la contrainte
 * pour le bloc `<style>` porté ; il ne couvrait pas les styles en ligne du
 * BALISAGE porté. ARB-016 étend la même logique, bornée de la même façon :
 *
 *   un attribut `style="…"` d'un composant `src/**\/V-xx.svelte` est admis
 *   SI ET SEULEMENT SI la même valeur figure dans `mockups/V-xx-*.html`.
 *
 * Les valeurs de `style` du fichier gelé forment un ENSEMBLE CLOS. Hors de cet
 * ensemble, P-1.7 et les autres contrôles P-1 s'appliquent intégralement.
 *
 * CE QUI REND LA RÈGLE SÛRE, et c'est le même argument que pour P-6.3 : on ne
 * peut pas inventer un style, il faut qu'il soit déjà dans le gel. La
 * contrainte est donc PLUS STRICTE que P-1 — « présent dans la référence »
 * implique et dépasse « n'emploie que des jetons ». Elle n'ouvre aucune
 * fenêtre : un style absent du gel reste un écart, quelle qu'en soit la
 * justification.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CONVENTION DE NOMMAGE EST LE VERROU, DANS LES DEUX SENS
 *
 * Est un composant de vue TOUT fichier de `src/**` nommé `V-xx.svelte`, et
 * rien d'autre — la même famille de noms que la feuille portée `V-xx.css` de
 * P-6.3 et que le composant qu'attend le mode démo. Deux évasions sont donc
 * fermées :
 *
 *   • écrire ses propres styles en ligne dans `src/lib/…/Machin.svelte` —
 *     aucun gel ne lui répond, P-1.7 s'y applique en entier ;
 *   • renommer un fichier en `V-38.svelte` pour hériter du gel de V-38 — le
 *     mode démo sert alors CE fichier pour la vue V-38, et le banc le compare
 *     à la maquette de V-38, pixel pour pixel. Hériter du gel, c'est en même
 *     temps se soumettre à lui.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES RESSOURCES PARTAGÉES — ARB-022, ET UN SECOND VERROU
 *
 * La première évasion ci-dessus se lisait aussi comme une LIMITE, et elle a
 * coûté deux fois (`ECART-021`, `ECART-022` É-5) :
 *
 *   • la convergence de `<span style="line-height: 0">` vers le gel a été
 *     REFUSÉE par son exécutant, bien que MESURÉE GRATUITE, faute de portée —
 *     un lot a renoncé à ressembler à la maquette parce que la règle ne savait
 *     pas le lui reconnaître ;
 *   • le gabarit de coquille écrivait `flex: 0 0 auto` là où le gel de V-37
 *     écrit `flex: none`, et RIEN NE L'A DÉTECTÉ.
 *
 * LA PORTÉE TROP ÉTROITE NE PROTÈGE PAS, ELLE AVEUGLE. ARB-022 l'étend donc
 * aux ressources partagées dont la maquette de référence est IDENTIFIABLE ET
 * DÉCLARÉE — pour `src/lib/coquille/`, c'est V-37, et l'instrument le savait
 * déjà : `ensembleDuGel('V-37')` contient `line-height:0`.
 *
 * LE VERROU CHANGE DE NATURE, IL NE DISPARAÎT PAS. Une ressource partagée n'a
 * pas de nom qui la désigne, donc le nommage ne peut plus servir de verrou. Le
 * rattachement ressource → maquette vit dans
 * `verif/references/preuve-par-le-gel.json`, en ÉCRITURE HUMAINE SEULE : un
 * agent ne choisit pas la référence contre laquelle il sera prouvé, sans quoi
 * il rattacherait son fichier à la maquette la plus permissive du dépôt.
 *
 * CE QUI NE CHANGE PAS : la valeur doit FIGURER AU GEL de la maquette de
 * référence, sans quoi P-1 s'applique en entier. On n'invente pas un style, on
 * le prouve. Une ressource non déclarée n'a aucune maquette qui réponde d'elle
 * — ne rien écrire n'ouvre rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA GRANULARITÉ EST LA DÉCLARATION, ET ELLE NE PEUT PAS ÊTRE AUTRE CHOSE
 *
 * ARB-016 parle des « valeurs de `style` ». Comparer des ATTRIBUTS ENTIERS est
 * impossible, et pas par commodité :
 *
 *   • côté gel, la même mise en forme est écrite tantôt en un attribut
 *     (`style="flex:1;min-width:0"`, V-40:1190), tantôt en un `cssText`
 *     (`x.style.cssText = "width:" + w + ";height:15px;border-radius:3px"`,
 *     V-39:2960), tantôt en QUATRE affectations séparées
 *     (`l.style.left`, `.top`, `.width`, `.transform`, V-39:3022-3025) ;
 *   • côté composant, ces quatre-là sont un seul attribut, parce qu'un
 *     squelette sans hydratation n'a pas de script pour les poser une à une.
 *
 * Un attribut du composant n'a donc, en général, AUCUN homologue textuel dans
 * le gel — alors que chacune de ses déclarations en a un, exactement. La
 * comparaison porte donc sur la DÉCLARATION `propriété: valeur`, normalisée ;
 * l'ordre des déclarations en devient sans effet, un ensemble n'ayant pas
 * d'ordre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES STYLES CONSTRUITS PAR LE SCRIPT DE LA MAQUETTE SONT DANS L'ENSEMBLE
 *
 * `ECART-013` É-3 l'avait déjà rencontré avec le `<span style="line-height:0">`
 * des icônes de menu, posé par `i.style.lineHeight = "0"`. Le cas est la RÈGLE
 * et non l'exception : sur les trois vues portées, la quasi-totalité des styles
 * en ligne du rendu final sont posés par le script, jamais écrits dans le
 * balisage. Un ensemble clos qui ne lirait que le balisage déclarerait absents
 * du gel des styles que le gel affiche — le pire des faux positifs, celui qui
 * exige de l'implémenteur qu'il retire ce que la référence montre.
 *
 * Quatre formes sont donc lues, dans le balisage ET dans les scripts :
 *
 *   style="…"                        attribut de balisage
 *   x.style.cssText = <expr>         feuille complète posée d'un coup
 *   x.style.propriété = <expr>       déclaration unique (nom camel, converti)
 *   x.setAttribute("style", <expr>)  et x.style.setProperty("p", <expr>)
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES VALEURS CALCULÉES : UN MARQUEUR, ET IL NE JOUE PAS LE JOKER
 *
 * `l.style.left = s[0] + "%"` ne dit pas QUELLE valeur, il dit sa FORME :
 * « quelque chose, puis `%` ». Le composant écrit `style="left:{a.gauche}%"`,
 * qui dit exactement la même forme. Chaque portion non littérale est donc
 * réduite au même marqueur des deux côtés, et la comparaison porte sur le
 * squelette littéral.
 *
 * LE MARQUEUR N'EST PAS UN JOKER. La comparaison reste une ÉGALITÉ de chaînes,
 * marqueur compris : un gel qui pose `width:‹calculé›` n'admet pas un composant
 * qui écrit `width:64%`, et réciproquement. Aucune permissivité n'entre par
 * là — une évaluation trop grossière ne peut que laisser un constat debout,
 * jamais en effacer un.
 *
 * ASYMÉTRIE ASSUMÉE, ET DANS LE SENS STRICT. Les identifiants sont résolus dans
 * le composant — `const pause = $derived(etat === 'anim' ? ';animation-play-state:paused' : '')`
 * de V-39 : une portée de module, des liaisons `const` — et ils NE LE SONT PAS
 * dans les scripts de maquette, qui sont des fonctions imbriquées où un nom se
 * réaffecte. Résoudre du côté candidat le rend plus précisément comparable ; ne
 * pas résoudre du côté gel garde l'ensemble clos PLUS PETIT. Les deux vont dans
 * le sens de la sévérité.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CET INSTRUMENT N'ÉPROUVE PAS
 *
 *   • Il ne prouve pas que le style est posé sur le MÊME ÉLÉMENT que dans le
 *     gel. Cette preuve-là est celle du banc, au pixel près :
 *     `pnpm verif:maquette V-xx --contre=app`. Les deux contrôles sont
 *     complémentaires, et aucun ne remplace l'autre.
 *   • Il ne voit pas un littéral sorti du fichier. Déplacer `"#fff"` dans un
 *     `.ts` importé le soustrait à l'analyseur — c'est le contournement de
 *     `PLAN §12`, nommé par `ECART-015` É-3 et laissé nommé plutôt qu'emprunté.
 *   • Il ne lit pas les blocs `<style>` de la maquette : l'ensemble clos est
 *     celui des VALEURS DE `style`, pas celui des déclarations CSS de la vue.
 *     Admettre les secondes ouvrirait le gel entier au balisage.
 *
 * Usage :
 *   node verif/styles-en-ligne.mjs            état des composants de vue
 *   node verif/styles-en-ligne.mjs V-39       le détail d'une vue
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { racine, htmlGele } from './feuilles-de-vue.mjs';

/** Est un composant de vue tout fichier `src/**` nommé exactement `V-xx.svelte`. */
export const RE_COMPOSANT = /^(V-\d\d)\.svelte$/;

/**
 * Le marqueur d'une portion non littérale. Choisi hors du jeu imprimable pour
 * qu'aucune source ne puisse le contenir, donc le fabriquer.
 */
export const MARQUEUR = '\u0000';

/** Sa forme lisible, au rapport. */
export const MARQUEUR_LISIBLE = '‹calculé›';

/** Profondeur maximale de résolution d'identifiants — coupe les cycles. */
const PROFONDEUR_MAX = 6;

/** Au-delà, l'évaluation abandonne et rend le marqueur : le sens strict. */
const VARIANTES_MAX = 32;

/** Rend une déclaration lisible dans un message d'écart. */
export const lisible = (texte) => texte.split(MARQUEUR).join(MARQUEUR_LISIBLE);

/* ═══════════════════════════════════════════════════════════════════════════
   Balayage à profondeur zéro — chaînes, gabarits, parenthèses, commentaires
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Découpe un texte aux occurrences d'un séparateur situées HORS chaîne, hors
 * gabarit et à profondeur d'imbrication nulle.
 * @param {string} texte
 * @param {string} separateur
 * @returns {string[]}
 */
export function decouperAuNiveau(texte, separateur) {
	const morceaux = [];
	let debut = 0;
	let profondeur = 0;
	let i = 0;
	while (i < texte.length) {
		const c = texte[i];
		if (c === '"' || c === "'" || c === '`') {
			i = finDeChaine(texte, i);
			continue;
		}
		if (c === '/' && texte[i + 1] === '*') {
			const fin = texte.indexOf('*/', i + 2);
			i = fin === -1 ? texte.length : fin + 2;
			continue;
		}
		if (c === '(' || c === '[' || c === '{') profondeur++;
		else if (c === ')' || c === ']' || c === '}') profondeur--;
		else if (
			profondeur === 0 &&
			texte.startsWith(separateur, i) &&
			!(separateur === '+' && (texte[i + 1] === '+' || texte[i - 1] === '+'))
		) {
			morceaux.push(texte.slice(debut, i));
			i += separateur.length;
			debut = i;
			continue;
		}
		i++;
	}
	morceaux.push(texte.slice(debut));
	return morceaux;
}

/** Rend l'index qui suit la chaîne (ou le gabarit) ouverte en `debut`. */
function finDeChaine(texte, debut) {
	const guillemet = texte[debut];
	let i = debut + 1;
	while (i < texte.length) {
		const c = texte[i];
		if (c === '\\') {
			i += 2;
			continue;
		}
		if (guillemet === '`' && c === '$' && texte[i + 1] === '{') {
			i = finDAccolade(texte, i + 1) + 1;
			continue;
		}
		if (c === guillemet) return i + 1;
		i++;
	}
	return texte.length;
}

/** Rend l'index de l'accolade fermante appariée à celle ouverte en `debut`. */
export function finDAccolade(texte, debut) {
	let profondeur = 0;
	let i = debut;
	while (i < texte.length) {
		const c = texte[i];
		if (c === '"' || c === "'" || c === '`') {
			i = finDeChaine(texte, i);
			continue;
		}
		if (c === '{') profondeur++;
		else if (c === '}') {
			profondeur--;
			if (profondeur === 0) return i;
		}
		i++;
	}
	return texte.length;
}

function finDeParenthese(texte, debut) {
	let profondeur = 0;
	let i = debut;
	while (i < texte.length) {
		const c = texte[i];
		if (c === '"' || c === "'" || c === '`') {
			i = finDeChaine(texte, i);
			continue;
		}
		if (c === '(') profondeur++;
		else if (c === ')') {
			profondeur--;
			if (profondeur === 0) return i;
		}
		i++;
	}
	return -1;
}

/* ═══════════════════════════════════════════════════════════════════════════
   L'ÉVALUATION ABSTRAITE — d'une expression aux chaînes qu'elle peut produire

   Le sous-ensemble reconnu est exactement celui qu'emploient les maquettes et
   les composants de vue : littéral de chaîne, gabarit, concaténation, ternaire,
   `||` / `??`, parenthèses, `String(…)`, la rune `$derived(…)`, et —
   côté composant seul — l'identifiant lié. TOUT LE RESTE EST OPAQUE, donc
   réduit au marqueur. Une grammaire qui devinerait plus produirait des valeurs
   que rien ne prouve.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * @param {string} expression
 * @param {Map<string, string>} liaisons identifiant → texte de son initialiseur
 * @param {number} profondeur
 * @returns {Set<string>} les chaînes que l'expression peut produire
 */
export function evaluer(expression, liaisons = new Map(), profondeur = 0) {
	let e = expression.trim();
	if (e === '' || profondeur > PROFONDEUR_MAX) return new Set([MARQUEUR]);

	// Parenthèses englobantes.
	while (e.startsWith('(') && finDeParenthese(e, 0) === e.length - 1) {
		e = e.slice(1, -1).trim();
		if (e === '') return new Set([MARQUEUR]);
	}

	// Ternaire — l'union des deux branches.
	const ternaire = couperTernaire(e);
	if (ternaire) {
		return union(
			evaluer(ternaire.alors, liaisons, profondeur + 1),
			evaluer(ternaire.sinon, liaisons, profondeur + 1)
		);
	}

	// `??` et `||` — l'union des membres. `&&` n'est PAS traité : il n'apparaît
	// dans aucune source mesurée, et le supposer produirait une valeur que rien
	// ne prouve.
	for (const operateur of ['??', '||']) {
		const membres = decouperAuNiveau(e, operateur);
		if (membres.length > 1) {
			return membres
				.map((m) => evaluer(m, liaisons, profondeur + 1))
				.reduce((a, b) => union(a, b), new Set());
		}
	}

	// Concaténation.
	const termes = decouperAuNiveau(e, '+');
	if (termes.length > 1) {
		return termes
			.map((t) => evaluer(t, liaisons, profondeur + 1))
			.reduce((a, b) => produit(a, b), new Set(['']));
	}

	return atome(e, liaisons, profondeur);
}

function atome(e, liaisons, profondeur) {
	// Littéral de chaîne.
	if ((e.startsWith('"') || e.startsWith("'")) && finDeChaine(e, 0) === e.length) {
		return new Set([deEchapper(e.slice(1, -1))]);
	}
	// Gabarit.
	if (e.startsWith('`') && finDeChaine(e, 0) === e.length) {
		return gabarit(e.slice(1, -1), liaisons, profondeur);
	}
	// Enveloppes transparentes : les runes Svelte et la conversion explicite.
	const enveloppe = /^(\$derived\.by|\$derived|\$state|String)\s*\(/.exec(e);
	if (enveloppe && finDeParenthese(e, e.indexOf('(')) === e.length - 1) {
		const dedans = e.slice(e.indexOf('(') + 1, -1).trim();
		const fleche = /^\(\s*\)\s*=>\s*/.exec(dedans);
		return evaluer(fleche ? dedans.slice(fleche[0].length) : dedans, liaisons, profondeur + 1);
	}
	// Identifiant lié — côté composant uniquement (`liaisons` y est renseignée).
	if (/^[A-Za-z_$][\w$]*$/.test(e) && liaisons.has(e)) {
		return evaluer(liaisons.get(e), liaisons, profondeur + 1);
	}
	return new Set([MARQUEUR]);
}

function gabarit(corps, liaisons, profondeur) {
	let formes = new Set(['']);
	let litteral = '';
	let i = 0;
	while (i < corps.length) {
		if (corps[i] === '\\') {
			litteral += deEchapper(corps.slice(i, i + 2));
			i += 2;
			continue;
		}
		if (corps[i] === '$' && corps[i + 1] === '{') {
			const fin = finDAccolade(corps, i + 1);
			formes = produit(formes, new Set([litteral]));
			litteral = '';
			formes = produit(formes, evaluer(corps.slice(i + 2, fin), liaisons, profondeur + 1));
			i = fin + 1;
			continue;
		}
		litteral += corps[i];
		i++;
	}
	return produit(formes, new Set([litteral]));
}

/** Le `?` de tête et le `:` qui lui répond, à profondeur zéro. */
function couperTernaire(e) {
	let profondeur = 0;
	let rang = 0;
	let question = -1;
	let i = 0;
	while (i < e.length) {
		const c = e[i];
		if (c === '"' || c === "'" || c === '`') {
			i = finDeChaine(e, i);
			continue;
		}
		if (c === '(' || c === '[' || c === '{') profondeur++;
		else if (c === ')' || c === ']' || c === '}') profondeur--;
		else if (
			profondeur === 0 &&
			c === '?' &&
			e[i + 1] !== '?' &&
			e[i + 1] !== '.' &&
			e[i - 1] !== '?'
		) {
			if (rang === 0) question = i;
			rang++;
		} else if (profondeur === 0 && c === ':' && rang > 0) {
			rang--;
			if (rang === 0) return { alors: e.slice(question + 1, i), sinon: e.slice(i + 1) };
		}
		i++;
	}
	return null;
}

const union = (a, b) => new Set([...a, ...b]);

function produit(a, b) {
	if (a.size * b.size > VARIANTES_MAX) return new Set([MARQUEUR]);
	const r = new Set();
	for (const x of a) for (const y of b) r.add(x + y);
	return r;
}

function deEchapper(texte) {
	return texte.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, s) => {
		if ((s[0] === 'u' || s[0] === 'x') && s.length > 1) {
			return String.fromCodePoint(parseInt(s.replace(/[ux{}]/g, ''), 16));
		}
		return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v' }[s] ?? s;
	});
}

/* ═══════════════════════════════════════════════════════════════════════════
   NORMALISATION — espaces, ordre, point-virgule final, casse des unités

   La liste est CLOSE et volontairement courte. Chaque normalisation
   supplémentaire élargit l'ensemble des styles admis : normaliser plus, c'est
   accepter plus. Un faux positif se corrige ; un faux négatif accepté détruit
   la confiance dans le critère.
   ═══════════════════════════════════════════════════════════════════════ */

const UNITES =
	'px|rem|em|ch|ex|vw|vh|vmin|vmax|dvw|dvh|dvi|dvb|svw|svh|lvw|lvh|pt|pc|cm|mm|in|q|deg|grad|rad|turn|ms|s|fr|dpi|dpcm|dppx';

const RE_UNITE = new RegExp(`(?<=[\\d.])(${UNITES})\\b`, 'gi');
const RE_MARQUEURS = new RegExp(`${MARQUEUR}+`, 'g');

/** @param {string} valeur */
export function normaliserValeur(valeur) {
	return valeur
		.replace(RE_MARQUEURS, MARQUEUR)
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/#[0-9a-fA-F]{3,8}\b/g, (m) => m.toLowerCase())
		.replace(RE_UNITE, (m) => m.toLowerCase())
		.replace(/!\s*important\b/gi, '!important');
}

/** @param {string} propriete */
export const normaliserPropriete = (propriete) => propriete.trim().toLowerCase();

/** `propriété:valeur`, normalisée. C'est l'unité de comparaison. */
export const declaration = (propriete, valeur) =>
	`${normaliserPropriete(propriete)}:${normaliserValeur(valeur)}`;

/** `marginBottom` → `margin-bottom`. */
export const enKebab = (nom) =>
	nom.replace(/^(webkit|moz|ms|o)([A-Z])/, '-$1$2').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Découpe un texte de style en déclarations normalisées. Le point-virgule final
 * et les déclarations vides disparaissent d'eux-mêmes.
 * @param {string} texte
 * @returns {string[]}
 */
export function declarationsDe(texte) {
	const trouvees = [];
	for (const morceau of decouperAuNiveau(texte, ';')) {
		if (morceau.trim() === '') continue;
		const coupe = morceau.indexOf(':');
		if (coupe === -1) continue;
		trouvees.push(declaration(morceau.slice(0, coupe), morceau.slice(coupe + 1)));
	}
	return trouvees;
}

/* ═══════════════════════════════════════════════════════════════════════════
   L'ENSEMBLE CLOS D'UNE MAQUETTE GELÉE
   ═══════════════════════════════════════════════════════════════════════ */

/** Neutralise un intervalle en préservant la longueur — les index restent justes. */
const blanchir = (s) => s.replace(/[^\n]/g, ' ');

/**
 * Toutes les déclarations de style que la maquette gelée d'une vue peut poser.
 *
 * L'extraction est ANCRÉE SUR LE GEL : `htmlGele()` refuse de rendre un fichier
 * qui diverge de son empreinte au `mockups/GEL.md`. On ne prouve pas un style
 * par une maquette qui a bougé sans arbitrage.
 *
 * @param {string} vue
 * @returns {{ maquette: string, declarations: Set<string>, comptes: Record<string, number> }}
 */
export function ensembleDuGel(vue) {
	const { html, fichier } = htmlGele(vue);
	const declarations = new Set();
	const comptes = { balisage: 0, cssText: 0, propriete: 0, attribut: 0 };

	// Les blocs <style> sont retirés : l'ensemble clos est celui des VALEURS DE
	// `style`, jamais celui des règles CSS de la vue — celles-là relèvent de
	// P-6.3, et les admettre au balisage ouvrirait le gel entier.
	const sansCss = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, blanchir);

	// (1) Le balisage — y compris le balisage écrit DANS une chaîne de script,
	//     qui produit le même attribut au rendu.
	for (const m of sansCss.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
		for (const d of declarationsDe(m[1] ?? m[2] ?? '')) {
			declarations.add(d);
			comptes.balisage++;
		}
	}

	// (2) Les scripts — la forme dominante du rendu final (ÉCART-013 É-3).
	for (const bloc of sansCss.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
		lireScript(bloc[1], declarations, comptes);
	}

	return { maquette: `mockups/${fichier}`, declarations, comptes };
}

/**
 * Relève les styles qu'un script pose. Les identifiants n'y sont PAS résolus :
 * ces scripts sont des fonctions imbriquées où un nom se réaffecte, et une
 * résolution par le nom seul serait une supposition. Ne pas résoudre garde
 * l'ensemble clos plus petit — le sens strict.
 */
function lireScript(source, declarations, comptes) {
	const ajouter = (d, quoi) => {
		declarations.add(d);
		comptes[quoi]++;
	};

	// x.style.cssText = <expr>   et   x.style.cssText += <expr>
	for (const m of source.matchAll(/\.style\s*\.\s*cssText\s*\+?=\s*/g)) {
		for (const forme of evaluer(expressionApres(source, m.index + m[0].length))) {
			for (const d of declarationsDe(forme)) ajouter(d, 'cssText');
		}
	}

	// x.style.propriété = <expr>
	for (const m of source.matchAll(/\.style\s*\.\s*([A-Za-z][A-Za-z0-9]*)\s*=(?!=)\s*/g)) {
		if (m[1] === 'cssText') continue;
		const propriete = enKebab(m[1]);
		for (const forme of evaluer(expressionApres(source, m.index + m[0].length))) {
			ajouter(declaration(propriete, forme), 'propriete');
		}
	}

	// x.style.setProperty("p", <expr>)
	for (const m of source.matchAll(/\.style\s*\.\s*setProperty\s*\(\s*(['"])([^'"]+)\1\s*,\s*/g)) {
		for (const forme of evaluer(expressionApres(source, m.index + m[0].length))) {
			ajouter(declaration(m[2], forme), 'propriete');
		}
	}

	// x.setAttribute("style", <expr>)
	for (const m of source.matchAll(/\.setAttribute\s*\(\s*(['"])style\1\s*,\s*/g)) {
		for (const forme of evaluer(expressionApres(source, m.index + m[0].length))) {
			for (const d of declarationsDe(forme)) ajouter(d, 'attribut');
		}
	}

	/* CINQUIÈME FORME — ÉCART-028.
	   Les quatre formes ci-dessus supposent que le nom de l'attribut est LITTÉRAL.
	   Le gel de V-41 pose ses styles par `b.setAttribute(k, attrs[k])` — nom
	   VARIABLE, dans une boucle sur un objet d'attributs. La valeur
	   `outline:2px solid var(--c-accent);outline-offset:2px` est donc bien au gel,
	   mot pour mot, et échappait pourtant à l'ensemble clos.

	   ARB-016 dit : « la valeur doit figurer dans la maquette gelée ». Les formes
	   ne sont que la MANIÈRE de l'y trouver — et une manière incomplète refusait
	   une valeur que l'arbitrage admet.

	   Ce balayage récolte donc toute chaîne littérale de la maquette qui se lit
	   comme une liste de déclarations CSS. La borne reste la même et elle est
	   entière : la chaîne doit EXISTER dans le gel. On ne peut pas inventer un
	   style, on peut seulement en trouver un que les quatre formes manquaient. */
	for (const m of source.matchAll(/(['"])((?:[-a-zA-Z]+\s*:\s*[^'";{}]+;?\s*){1,8})\1/g)) {
		const brut = m[2].trim();
		if (!/^[-a-zA-Z]+\s*:/.test(brut)) continue;
		for (const d of declarationsDe(brut)) ajouter(d, 'litteral');
	}
}

/**
 * Le texte de l'expression qui commence en `debut` — jusqu'au `;`, à la virgule,
 * à la parenthèse fermante ou à la fin de ligne, à profondeur zéro. Une
 * expression multi-lignes reste entière quand la ligne courante se termine sur
 * un opérateur en attente : les `cssText` du gel s'écrivent sur deux lignes.
 */
function expressionApres(source, debut) {
	let profondeur = 0;
	let i = debut;
	while (i < source.length) {
		const c = source[i];
		if (c === '"' || c === "'" || c === '`') {
			i = finDeChaine(source, i);
			continue;
		}
		if (c === '(' || c === '[' || c === '{') profondeur++;
		else if (c === ')' || c === ']' || c === '}') {
			if (profondeur === 0) break;
			profondeur--;
		} else if (profondeur === 0 && (c === ';' || c === ',')) break;
		else if (profondeur === 0 && c === '\n' && !/[+?:|&([,]\s*$/.test(source.slice(debut, i)))
			break;
		i++;
	}
	return source.slice(debut, i);
}

/* ═══════════════════════════════════════════════════════════════════════════
   LE CÔTÉ CANDIDAT — les styles en ligne d'un composant de vue
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Les liaisons `const` / `let` / `var` du `<script>` d'un composant, pour
 * résoudre les identifiants interpolés. Une portée de module, des liaisons
 * nommées une fois : c'est ce qui rend la résolution sûre ici et pas dans les
 * scripts de maquette. Un nom déclaré deux fois n'est PAS résolu — deviner
 * laquelle des deux vaut serait une supposition.
 * @param {string} source
 * @returns {Map<string, string>}
 */
export function liaisonsDuComposant(source) {
	const liaisons = new Map();
	const doublons = new Set();
	for (const bloc of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
		const script = bloc[1];
		for (const m of script.matchAll(
			/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;{}]+)?=\s*/g
		)) {
			const nom = m[1];
			if (liaisons.has(nom)) doublons.add(nom);
			liaisons.set(nom, expressionApres(script, m.index + m[0].length));
		}
	}
	for (const nom of doublons) liaisons.delete(nom);
	return liaisons;
}

/**
 * Développe un texte d'attribut `style` d'un composant Svelte : chaque `{…}`
 * est évalué, et le produit cartésien donne les formes que l'attribut peut
 * prendre. Un attribut sans interpolation rend une seule forme, la sienne.
 * @param {string} texte
 * @param {Map<string, string>} liaisons
 * @returns {Set<string>}
 */
export function developper(texte, liaisons = new Map()) {
	let formes = new Set(['']);
	let litteral = '';
	let i = 0;
	while (i < texte.length) {
		if (texte[i] === '{') {
			const fin = finDAccolade(texte, i);
			formes = produit(formes, new Set([litteral]));
			litteral = '';
			formes = produit(formes, evaluer(texte.slice(i + 1, fin), liaisons));
			i = fin + 1;
			continue;
		}
		litteral += texte[i];
		i++;
	}
	return produit(formes, new Set([litteral]));
}

/**
 * Le nom de vue d'un chemin de composant, ou `null`.
 * @param {string} chemin
 */
export function vueDe(chemin) {
	const m = RE_COMPOSANT.exec(basename(chemin));
	return m ? m[1] : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LES RESSOURCES PARTAGÉES, RATTACHÉES À LEUR MAQUETTE — ARB-022
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Le rattachement ressource → maquette de référence, en ÉCRITURE HUMAINE
 * SEULE. Un agent ne choisit pas la référence contre laquelle il sera prouvé :
 * il pourrait sinon rattacher son fichier à la maquette la plus permissive du
 * dépôt. Le fichier porte son propre bandeau, et le motif au long.
 */
export const RESSOURCES_PROUVEES = JSON.parse(
	readFileSync(join(racine, 'verif', 'references', 'preuve-par-le-gel.json'), 'utf8')
);

/**
 * Les entrées de rattachement, triées de la plus longue à la plus courte : le
 * cas particulier prime le général, jamais l'inverse.
 * @type {{ prefixe: string, maquette: string, declaration: Record<string, string> }[]}
 */
const RATTACHEMENTS = Object.entries(RESSOURCES_PROUVEES.ressources ?? {})
	.map(([prefixe, declaration]) => {
		if (!/^V-\d\d$/.test(declaration?.maquette ?? '')) {
			throw new Error(
				`preuve-par-le-gel : la ressource « ${prefixe} » nomme une maquette ` +
					`« ${declaration?.maquette} » qui n'est pas au format V-xx.\n` +
					'  Une déclaration illisible est REFUSÉE, jamais ignorée en silence (RA-01).'
			);
		}
		return { prefixe: prefixe.replace(/\/+$/, ''), maquette: declaration.maquette, declaration };
	})
	.sort((a, b) => b.prefixe.length - a.prefixe.length);

/**
 * LA MAQUETTE QUI RÉPOND DES STYLES EN LIGNE D'UN FICHIER, ou `null`.
 *
 * Deux voies, et la première l'emporte :
 *
 *   1. LA CONVENTION DE NOMMAGE (ARB-016, P-6.4). Un fichier `V-xx.svelte` est
 *      prouvé par `mockups/V-xx-*.html`, et le nommage est le verrou : hériter
 *      du gel, c'est en même temps s'y soumettre au banc, pixel pour pixel.
 *      Elle garde la priorité, y compris sous une ressource déclarée — sans
 *      quoi il suffirait de déplacer une vue sous un dossier rattaché pour lui
 *      changer de référence.
 *   2. LE RATTACHEMENT DÉCLARÉ (ARB-022). Une ressource partagée n'a pas de nom
 *      qui la désigne : `Rail.svelte` n'est la vue d'aucune maquette, il est le
 *      portage d'une PORTION de maquette réutilisée par les 41. Le verrou n'est
 *      donc plus le nommage mais l'ÉCRITURE HUMAINE SEULE du rattachement.
 *
 * @param {string} chemin chemin absolu du fichier
 * @returns {{ vue: string, origine: 'nommage' | 'ressource',
 *             declaration: Record<string, string> | null } | null}
 */
export function referenceDe(chemin) {
	const parNom = vueDe(chemin);
	if (parNom) return { vue: parNom, origine: 'nommage', declaration: null };
	const relatif = relative(racine, chemin).split(sep).join('/');
	for (const r of RATTACHEMENTS) {
		if (relatif === r.prefixe || relatif.startsWith(r.prefixe + '/')) {
			return { vue: r.maquette, origine: 'ressource', declaration: r.declaration };
		}
	}
	return null;
}

/**
 * Parcourt `src/` et rend tout fichier dont une maquette gelée répond des
 * styles en ligne — composants de vue par le NOMMAGE (ARB-016) et fichiers de
 * ressource partagée par le RATTACHEMENT DÉCLARÉ (ARB-022), dans le même
 * relevé. Le diagnostic doit montrer ce que la batterie contrôle, sans quoi il
 * dirait moins qu'elle.
 */
export function composantsDeVue() {
	const trouves = [];
	const base = join(racine, 'src');
	const descendre = (dossier) => {
		for (const entree of readdirSync(dossier)) {
			if (entree === 'node_modules' || entree.startsWith('.')) continue;
			const chemin = join(dossier, entree);
			if (statSync(chemin).isDirectory()) descendre(chemin);
			else if (chemin.endsWith('.svelte') || chemin.endsWith('.html')) {
				const reference = referenceDe(chemin);
				if (reference) trouves.push({ vue: reference.vue, origine: reference.origine, chemin });
			}
		}
	};
	if (existsSync(base)) descendre(base);
	return trouves.sort((a, b) => a.chemin.localeCompare(b.chemin));
}

/* ── Exécution directe : l'état des composants de vue ─────────────────────
   Le corps est une fonction ASYNCHRONE APPELÉE SANS `await` : `jetons.mjs`
   importe ce module, et une attente de premier niveau dans un cycle d'imports
   bloquerait les deux modules l'un sur l'autre. L'évaluation de ce fichier se
   termine donc d'abord ; le cycle se referme ensuite, résolu. */
async function diagnostiquer() {
	const demandees = process.argv.slice(2).filter((a) => /^V-\d\d$/.test(a));
	const composants = composantsDeVue().filter(
		(c) => demandees.length === 0 || demandees.includes(c.vue)
	);
	if (composants.length === 0) {
		console.log(
			'styles-en-ligne — aucun fichier rattaché à une maquette dans src/.\n' +
				'  Deux voies : src/vues/V-xx.svelte par le nommage (P-6.4, ARB-016), et les\n' +
				'  ressources partagées déclarées à verif/references/preuve-par-le-gel.json\n' +
				'  (ARB-022). Chaque attribut style="…" doit figurer au gel de sa maquette.'
		);
		process.exit(0);
	}
	// Chargé à la demande : `jetons.mjs` est le propriétaire du vocabulaire P-1,
	// et son corps est enfermé dans `executer()` — l'importer ne déclenche donc
	// aucune analyse.
	const { PROPRIETES_CONTRAINTES } = await import('./jetons.mjs');
	let hors = 0;
	for (const { vue, origine, chemin } of composants) {
		const { maquette, declarations, comptes } = ensembleDuGel(vue);
		const source = readFileSync(chemin, 'utf8');
		const liaisons = liaisonsDuComposant(source);
		let admises = 0;
		const absentes = new Set();
		for (const m of source.matchAll(
			/\bstyle(?::([a-z-]+))?\s*=\s*("([^"]*)"|'([^']*)'|\{([^}]*)\})/gi
		)) {
			const brut = m[3] ?? m[4] ?? m[5] ?? '';
			for (const forme of developper(m[1] ? `${m[1]}:${brut}` : brut, liaisons)) {
				for (const d of declarationsDe(forme)) {
					if (declarations.has(d)) admises++;
					else absentes.add(d);
				}
			}
		}
		const contraintes = [...absentes].filter((d) =>
			PROPRIETES_CONTRAINTES.has(d.slice(0, d.indexOf(':')))
		);
		hors += contraintes.length;
		console.log(
			`  ${relative(racine, chemin)} — ${maquette} ` +
				`[${origine === 'nommage' ? 'nommage, ARB-016' : 'ressource déclarée, ARB-022'}] : ` +
				`${declarations.size} déclaration(s) ` +
				`au gel (${comptes.balisage} de balisage, ${comptes.cssText} de cssText, ` +
				`${comptes.propriete} de propriété, ${comptes.attribut} d'attribut)\n` +
				`      ${admises} déclaration(s) admise(s), ${absentes.size} hors du gel ` +
				`dont ${contraintes.length} sur une propriété que P-1.7 contraint`
		);
		for (const d of [...absentes].sort()) {
			const contrainte = PROPRIETES_CONTRAINTES.has(d.slice(0, d.indexOf(':')));
			console.log(
				`      hors du gel : ${lisible(d)}` +
					(contrainte ? '   ← constat P-1.7 / P-6.4' : '   (propriété non contrainte par P-1.7)')
			);
		}
	}
	// Le verdict appartient à `pnpm verif:jetons` : ce mode n'existe que pour
	// lire l'ensemble clos et voir ce qui en sort. Il rend le même code que la
	// batterie rendrait sur ce seul contrôle.
	process.exit(hors ? 1 : 0);
}

if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
	diagnostiquer();
}
