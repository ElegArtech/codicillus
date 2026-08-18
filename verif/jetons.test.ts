/**
 * Batterie 2 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `pnpm verif:jetons` sort en 0 depuis le lot T-004. Un vert permanent ne dit
 * rien : il est compatible avec un analyseur qui ne voit rien, et avec un
 * analyseur qui voit ce qui n'existe pas. Les deux défaillances se sont
 * produites, et sont documentées par `docs/ecarts/ECART-011.md` :
 *
 *   É-3 — FAUX POSITIF. `selecteursDe()` lisait les étapes `to` et `from` d'un
 *         `@keyframes` comme des sélecteurs CSS. Le socle en déclarant cinq,
 *         toute feuille de vue portant une animation nommée était rouge
 *         d'avance en P-6.2 — sans qu'aucune ligne mesurée ne soit en cause.
 *   É-2 — CONTRÔLE MANQUANT. P-6.3, l'identité à l'octet d'une feuille de vue
 *         portée à sa maquette gelée, n'existait pas.
 *
 * Les unitaires ci-dessous figent l'un et l'autre. Ils s'exécutent sans
 * navigateur et sans réseau : c'est ce qui permet de les jouer à chaque
 * `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
import { selecteursDe, PROPRIETES_CONTRAINTES } from './jetons.mjs';
import {
	declarationsDe,
	developper,
	ensembleDuGel,
	evaluer,
	liaisonsDuComposant,
	MARQUEUR,
	RE_COMPOSANT,
	vueDe
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './styles-en-ligne.mjs';
import {
	blocDeVue,
	maquetteDe,
	premiereDivergence,
	racine,
	RE_FEUILLE
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './feuilles-de-vue.mjs';

const cles = (css: string): string[] => [...(selecteursDe(css) as Map<string, number>).keys()];

describe('selecteursDe — les étapes d’un @keyframes ne sont pas des sélecteurs (ÉCART-011 É-3)', () => {
	it('ne rend ni « to » ni « from » d’une animation nommée', () => {
		const css = `
			.rouet { animation: tourne 1s linear infinite; }
			@keyframes tourne { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
		`;
		expect(cles(css)).toEqual(['.rouet']);
	});

	it('ne rend pas non plus les étapes en pourcentage', () => {
		const css = '@keyframes pulse { 0% { opacity: 1; } 50% { opacity: .4; } 100% { opacity: 1; } }';
		expect(cles(css)).toEqual([]);
	});

	it('sait ressortir du bloc : le sélecteur qui suit l’animation est bien vu', () => {
		const css = '@keyframes tourne { to { transform: rotate(360deg); } }\n.barre { color: red; }';
		expect(cles(css)).toEqual(['.barre']);
	});

	it('continue de relever les vrais sélecteurs imbriqués dans une @media', () => {
		const css = '@media (max-width: 1240px) { .rail { display: none; } .barre, .fil { gap: 0; } }';
		expect(cles(css)).toEqual(['.rail', '.barre', '.fil']);
	});

	it('le socle ne déclare donc plus « to » ni « from » comme sélecteurs', () => {
		// C'était la cause exacte des deux constats P-6.2 garantis d'avance sur
		// toute feuille de vue portant une animation (ÉCART-011 É-3).
		const socle = readFileSync(join(racine as string, 'src', 'socle.css'), 'utf8');
		const releves = cles(socle);
		expect(releves).not.toContain('to');
		expect(releves).not.toContain('from');
		// Le relevé reste par ailleurs substantiel : la correction n'a pas
		// aveuglé l'analyseur.
		expect(releves.length).toBeGreaterThan(100);
	});
});

describe('P-6.3 — identité à l’octet d’une feuille de vue portée (ÉCART-011 É-2)', () => {
	it('ne reconnaît comme feuille portée que le nom de vue exact', () => {
		const re = RE_FEUILLE as RegExp;
		expect(re.test('V-37.css')).toBe(true);
		expect(re.test('V-07.css')).toBe(true);
		// Porter le bloc sous un autre nom ne dispense de rien : le fichier
		// reste analysé par P-1, avec ses quatre-vingt-quatorze constats.
		expect(re.test('coquille.css')).toBe(false);
		expect(re.test('V-37-coquille.css')).toBe(false);
		expect(re.test('v-37.css')).toBe(false);
	});

	it('extrait le SECOND bloc <style> de la maquette, pas le socle', () => {
		const vue = blocDeVue('V-37') as { contenu: string; lignes: number; maquette: string };
		expect(vue.maquette).toBe('mockups/V-37-coquille.html');
		// Le premier bloc est le socle : il porte la bannière et les jetons.
		expect(vue.contenu).not.toContain('CODICILLUS — SOCLE');
		expect(vue.contenu).not.toContain('--c-encre:');
		// Le second est le style propre à la coquille.
		expect(vue.contenu).toContain('.rail');
		expect(vue.lignes).toBeGreaterThan(700);
	});

	it('le bloc extrait est celui de la maquette, octet pour octet', () => {
		const fichier = maquetteDe('V-37') as string;
		const html = readFileSync(join(racine as string, 'mockups', fichier), 'utf8');
		const { contenu } = blocDeVue('V-37') as { contenu: string };
		expect(html.includes(contenu)).toBe(true);
		// Et il est unique : un fragment de 780 lignes ne se retrouve pas deux
		// fois dans le document.
		expect(html.indexOf(contenu)).toBe(html.lastIndexOf(contenu));
	});

	it('nomme la première ligne divergente — c’est ce qui rend le rouge exploitable', () => {
		const gel = 'a { color: var(--c-encre); }\nb { gap: var(--e-2); }\n';
		const porte = 'a { color: var(--c-encre); }\nb { gap: 7px; }\n';
		const d = premiereDivergence(gel, porte) as {
			ligne: number;
			attendue: string;
			obtenue: string;
			lignes: number[];
		};
		expect(d.ligne).toBe(2);
		expect(d.attendue).toBe('b { gap: var(--e-2); }');
		expect(d.obtenue).toBe('b { gap: 7px; }');
	});

	it('voit une divergence d’un seul octet, y compris invisible à l’œil', () => {
		const gel = '.rail { padding: 13px; }\n';
		// Une espace de plus : le rendu est identique, la feuille n'est plus le gel.
		expect(premiereDivergence(gel, '.rail {  padding: 13px; }\n')).not.toBeNull();
		expect(premiereDivergence(gel, gel)).toBeNull();
	});

	it('signale une feuille tronquée plutôt que de la déclarer conforme', () => {
		const gel = 'a { color: var(--c-encre); }\nb { gap: var(--e-2); }\n';
		const d = premiereDivergence(gel, 'a { color: var(--c-encre); }\n') as { ligne: number };
		expect(d.ligne).toBe(2);
	});

	it('refuse bruyamment une vue sans maquette', () => {
		expect(() => blocDeVue('V-99')).toThrow(/aucune maquette unique/i);
	});
});

/* ═════════════════════════════════════════════════════════════════════════
   P-6.4 — LE STYLE EN LIGNE PROUVÉ PAR LE GEL (ARB-016, ÉCART-015 É-3)

   Ce contrôle DISPENSE de P-1.7 : c'est exactement le genre de règle qui doit
   prouver qu'elle sait encore dire non. Les unitaires ci-dessous figent les
   quatre propriétés dont dépend sa sûreté.

     1. L'ensemble clos contient bien ce que le gel pose PAR SCRIPT — sans quoi
        la règle exigerait de retirer ce que la référence montre.
     2. Le marqueur des valeurs calculées N'EST PAS UN JOKER.
     3. L'ensemble est PAR VUE : le gel de V-39 ne prouve rien de V-40.
     4. La normalisation est CLOSE : elle ne rapproche que ce qui est déclaré
        rapprochable — espaces, ordre, point-virgule final, casse des unités.
   ═════════════════════════════════════════════════════════════════════════ */

const marqueur = MARQUEUR as string;
const gel = (vue: string) =>
	(ensembleDuGel as (v: string) => { declarations: Set<string>; maquette: string })(vue);
const decl = (texte: string) => (declarationsDe as (t: string) => string[])(texte);
const formes = (texte: string, liaisons?: Map<string, string>) =>
	[...(developper as (t: string, l?: Map<string, string>) => Set<string>)(texte, liaisons)].sort();
const valeurs = (expression: string, liaisons?: Map<string, string>) =>
	[
		...(evaluer as (e: string, l?: Map<string, string>) => Set<string>)(expression, liaisons)
	].sort();

describe('P-6.4 — la normalisation d’une déclaration, et rien de plus', () => {
	it('efface les espaces, le point-virgule final et la casse des unités', () => {
		expect(decl('  MARGIN-TOP :  2PX ;  ')).toEqual(['margin-top:2px']);
		expect(decl('color:#FFF')).toEqual(['color:#fff']);
		expect(decl('gap:var(--e-3);')).toEqual(['gap:var(--e-3)']);
	});

	it('rend un ENSEMBLE de déclarations : l’ordre n’a donc aucun effet', () => {
		expect(decl('a:1;b:2').sort()).toEqual(decl('b:2;a:1').sort());
	});

	it('ne rapproche PAS ce que la liste close ne déclare pas rapprochable', () => {
		// Une valeur numériquement identique n'est pas la même valeur : `0px`
		// n'est pas `0`, et `12.0px` n'est pas `12px`. Normaliser plus, ce
		// serait accepter plus.
		expect(decl('margin:0')).not.toEqual(decl('margin:0px'));
		expect(decl('padding:12px')).not.toEqual(decl('padding:12.0px'));
	});
});

describe('P-6.4 — l’évaluation abstraite d’une expression', () => {
	it('rend la chaîne d’un littéral, et la forme d’une concaténation calculée', () => {
		expect(valeurs('"width:26px"')).toEqual(['width:26px']);
		expect(valeurs('"left:" + s[0] + "%"')).toEqual([`left:${marqueur}%`]);
		expect(valeurs('"rotate(" + Math.atan2(dy, dx) + "deg)"')).toEqual([`rotate(${marqueur}deg)`]);
	});

	it('rend les DEUX branches d’un ternaire — le gel de V-39 en dépend', () => {
		expect(valeurs('actif ? "running" : "paused"')).toEqual(['paused', 'running']);
	});

	it('réduit au marqueur ce qu’elle ne sait pas lire, plutôt que de deviner', () => {
		expect(valeurs('opts.hauteur')).toEqual([marqueur]);
		expect(valeurs('(-n[2] / 2) + "px"')).toEqual([`${marqueur}px`]);
	});

	it('résout un identifiant lié du composant, et lui seul', () => {
		const liaisons = new Map([['pause', "etat === 'anim' ? ';animation-play-state:paused' : ''"]]);
		expect(valeurs('pause', liaisons)).toEqual(['', ';animation-play-state:paused']);
		expect(valeurs('inconnu', liaisons)).toEqual([marqueur]);
	});

	it('traverse la rune $derived, qui n’est pas une valeur mais une enveloppe', () => {
		expect(valeurs('$derived(cond ? "a" : "b")')).toEqual(['a', 'b']);
	});
});

describe('P-6.4 — le développement d’un attribut de composant Svelte', () => {
	it('développe une interpolation qui AJOUTE une déclaration (V-39, {pause})', () => {
		const liaisons = (liaisonsDuComposant as (s: string) => Map<string, string>)(
			"<script>const pause = $derived(etat === 'anim' ? ';animation-play-state:paused' : '');</script>"
		);
		expect(formes('border-radius:3px{pause}', liaisons)).toEqual([
			'border-radius:3px',
			'border-radius:3px;animation-play-state:paused'
		]);
		// Et les deux formes se découpent, chacune, en déclarations exactes.
		expect(decl('border-radius:3px;animation-play-state:paused')).toEqual([
			'border-radius:3px',
			'animation-play-state:paused'
		]);
	});

	it('un attribut sans interpolation rend exactement une forme, la sienne', () => {
		expect(formes('flex:1;min-width:0')).toEqual(['flex:1;min-width:0']);
	});
});

describe('P-6.4 — l’ensemble clos d’une maquette gelée', () => {
	it('contient les styles que le SCRIPT du gel pose, pas seulement le balisage', () => {
		const v39 = gel('V-39').declarations;
		// cssText : `x.style.cssText = "width:" + w + ";height:15px;border-radius:3px"`
		expect(v39.has('border-radius:3px')).toBe(true);
		expect(v39.has('height:15px')).toBe(true);
		// Affectation de propriété, nom en camel : `b.style.paddingLeft = (p[0] * 18) + "px"`
		expect(v39.has(`padding-left:${marqueur}px`)).toBe(true);
		// Ternaire : `e.style.animationPlayState = actif ? "running" : "paused"`
		expect(v39.has('animation-play-state:paused')).toBe(true);
		expect(v39.has('animation-play-state:running')).toBe(true);
		// ÉCART-013 É-3 — le `line-height:0` des icônes de menu, posé par script.
		expect(v39.has('line-height:0')).toBe(true);
		// Balisage.
		expect(v39.has('margin-bottom:var(--e-4)')).toBe(true);
	});

	it('LE MARQUEUR N’EST PAS UN JOKER : une forme calculée n’admet pas un littéral', () => {
		const v39 = gel('V-39').declarations;
		// Le gel pose la largeur des lignes d'esquisse par `l.style.width = largeur`.
		expect(v39.has(`width:${marqueur}`)).toBe(true);
		// Il ne s'ensuit AUCUNE licence sur une largeur littérale.
		expect(v39.has('width:64%')).toBe(false);
		expect(v39.has('width:1px')).toBe(false);
	});

	it('l’ensemble est PAR VUE : le gel de l’une ne prouve rien de l’autre', () => {
		expect(gel('V-39').declarations.has('border-radius:3px')).toBe(true);
		expect(gel('V-40').declarations.has('border-radius:3px')).toBe(false);
		expect(gel('V-40').declarations.has('color:#fff')).toBe(true);
		expect(gel('V-39').declarations.has('color:#fff')).toBe(false);
	});

	it('n’admet pas un jeton du socle que le gel de la vue ne porte pas en ligne', () => {
		// `--e-3` existe, la vue s'en sert dans son bloc <style> — mais elle ne
		// pose aucun `padding:var(--e-3)` en ligne. « Présent dans la référence »
		// est plus strict que « n'emploie que des jetons ».
		expect(gel('V-40').declarations.has('padding:var(--e-3)')).toBe(false);
	});

	it('ne verse PAS les règles du bloc <style> dans l’ensemble', () => {
		// `.dlg__boite { position: fixed }` est du CSS de la vue (P-6.3), pas une
		// valeur de `style`. Les admettre ouvrirait le gel entier au balisage.
		const v40 = gel('V-40').declarations;
		expect(v40.has('position:fixed')).toBe(false);
	});

	it('refuse de prouver quoi que ce soit sur une vue sans maquette', () => {
		expect(() => gel('V-99')).toThrow(/aucune maquette unique/i);
	});

	it('nomme la maquette qui prouve — le rapport doit pouvoir la citer', () => {
		expect(gel('V-38').maquette).toBe('mockups/V-38-notifications.html');
	});
});

describe('P-6.4 — la convention de nommage est le verrou', () => {
	it('ne reconnaît comme composant de vue que le nom de vue exact', () => {
		const re = RE_COMPOSANT as RegExp;
		expect(re.test('V-38.svelte')).toBe(true);
		expect(re.test('V-07.svelte')).toBe(true);
		expect(re.test('Coquille.svelte')).toBe(false);
		expect(re.test('V-38-notifications.svelte')).toBe(false);
		expect(re.test('v-38.svelte')).toBe(false);
		expect(re.test('V-38.css')).toBe(false);
	});

	it('un fichier hors convention n’a aucune preuve, donc aucune dispense', () => {
		const de = vueDe as (chemin: string) => string | null;
		expect(de('src/vues/V-40.svelte')).toBe('V-40');
		expect(de('src/lib/coquille/Coquille.svelte')).toBeNull();
	});
});

describe('P-1.7 — le vocabulaire contraint reste celui de P-1', () => {
	it('couvre les propriétés que la dispense P-6.4 pourrait sinon amnistier', () => {
		const contraintes = PROPRIETES_CONTRAINTES as Set<string>;
		for (const p of ['margin', 'padding', 'gap', 'top', 'border-radius', 'font-size', 'color']) {
			expect(contraintes.has(p)).toBe(true);
		}
		// `width` n'est pas contrainte, et ne l'a jamais été : la dispense ne
		// l'élargit pas non plus.
		expect(contraintes.has('width')).toBe(false);
	});
});
