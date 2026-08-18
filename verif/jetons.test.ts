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
import { selecteursDe } from './jetons.mjs';
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
