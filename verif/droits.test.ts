/**
 * Batterie 7 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/droits.mjs` rend un verdict sur 265 états et deux côtés. Sa justesse
 * tient dans cinq décisions minuscules, dont TROIS ont été fausses en cours
 * d'écriture — et dont aucune ne se voit dans un total global :
 *
 *   1. « le nœud n'existe pas de ce côté » n'est PAS « le nœud n'est pas rendu
 *      dans l'état de référence ». Les confondre rendait INVISIBLE toute action
 *      que seule l'application porte : les sondes `masque` et `grise` sont
 *      restées rouges jusqu'à ce que la distinction existe. C'est la preuve de
 *      mutation qui a corrigé l'instrument, pas l'inverse ;
 *   2. un crible qui ne retient que les règles MASQUANTES ne voit rien de
 *      V-13, qui masque par défaut et RÉVÈLE quand le droit est là. Les deux
 *      polarités comptent ;
 *   3. le sujet d'un sélecteur se coupe sur les combinateurs DE PREMIER
 *      NIVEAU : `.app:not([data-role="admin"]) .si-admin` coupé à l'intérieur
 *      du `:not()` rend un sujet faux, donc une gouvernance faussement large ;
 *   4. un couple de droit exige que TOUS les autres axes soient égaux. Sans
 *      cela, `V-11 dom-infrastructure ↔ role-lecteur` — qui change aussi de
 *      domaine — imputerait au droit toutes les actions du domaine absent ;
 *   5. la signature d'appariement ne porte pas les classes : `.ac--interdit`
 *      s'ajoute d'un état à l'autre, et une signature qui la porterait
 *      déclarerait « nœud disparu » là où c'est le même nœud, grisé.
 *
 * Ils s'exécutent sans navigateur et sans serveur — c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import {
	AXES_DE_DROIT,
	AXES_ECARTES,
	MARQUEURS_INERTES,
	SELECTEUR_ACTION,
	SONDES_CONNUES,
	agreger,
	apparier,
	attributsQuiChangent,
	couplesDeDroit,
	eprouverLesAxes,
	gouverneesParUnDroit,
	natureDuCouple,
	scenarioDe,
	sortDeLAction,
	sujetsDuSelecteur,
	vuesDuDepot
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './droits.mjs';

type Action = { sig: string; rend: boolean; inerte: boolean };
const a = (sig: string, rend = true, inerte = false): Action => ({ sig, rend, inerte });

/* ═══════════════════════════════════════════════════════════════════════════
   Les couples de droit
   ═══════════════════════════════════════════════════════════════════════════ */

describe('couplesDeDroit', () => {
	it('retient deux états qui ne diffèrent QUE par un axe de droit', () => {
		const s = {
			etats: [
				{ cle: 'a', vecteur: { droits: 'ecriture', rail: 'ouvert' } },
				{ cle: 'b', vecteur: { droits: 'lecture', rail: 'ouvert' } }
			]
		};
		expect(couplesDeDroit(s)).toEqual([
			{ axe: 'droits', a: 'a', b: 'b', valeurA: 'ecriture', valeurB: 'lecture' }
		]);
	});

	it('REFUSE un couple qui change aussi un autre axe — sinon le contenu passerait pour un droit', () => {
		const s = {
			etats: [
				{ cle: 'a', vecteur: { droits: 'ecriture', dom: 'Infrastructure' } },
				{ cle: 'b', vecteur: { droits: 'lecture', dom: 'Applications' } }
			]
		};
		expect(couplesDeDroit(s)).toEqual([]);
	});

	it('refuse un couple dont l’axe qui change n’est pas un axe de droit', () => {
		const s = {
			etats: [
				{ cle: 'a', vecteur: { rail: 'ouvert' } },
				{ cle: 'b', vecteur: { rail: 'ferme' } }
			]
		};
		expect(couplesDeDroit(s)).toEqual([]);
	});

	it('écarte les états de ZONE — deux spécimens de catalogue ne sont pas deux droits', () => {
		const s = {
			etats: [
				{ cle: 'a', vecteur: { droits: 'ecriture' }, zone: { selecteur: '.x', index: 0 } },
				{ cle: 'b', vecteur: { droits: 'lecture' }, zone: { selecteur: '.x', index: 1 } }
			]
		};
		expect(couplesDeDroit(s)).toEqual([]);
	});

	it('le corpus exerce chacun des axes déclarés — P-5, et c’est le contrôle qui refuse en code 2', () => {
		const { parAxe, inertes } = eprouverLesAxes(vuesDuDepot());
		expect(inertes).toEqual([]);
		for (const x of parAxe) expect(x.couples).toBeGreaterThan(0);
	});

	it('les axes écartés sont motivés, et aucun n’est en même temps retenu', () => {
		const retenus = AXES_DE_DROIT.map((x: { axe: string }) => x.axe);
		for (const e of AXES_ECARTES) {
			expect(e.motif.length).toBeGreaterThan(40);
			expect(retenus).not.toContain(e.axe);
		}
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   Le sujet d'un sélecteur — décision n° 3
   ═══════════════════════════════════════════════════════════════════════════ */

describe('sujetsDuSelecteur', () => {
	it('rend la dernière compound d’un descendant', () => {
		expect(sujetsDuSelecteur('.app[data-droits="lecture"] .si-ecriture')).toEqual(['.si-ecriture']);
	});

	it('ne coupe PAS à l’intérieur d’un :not() — le piège de `.si-admin`', () => {
		expect(sujetsDuSelecteur('.app:not([data-role="admin"]) .si-admin')).toEqual(['.si-admin']);
	});

	it('ne coupe pas à l’intérieur d’un attribut dont la valeur contient une espace', () => {
		expect(sujetsDuSelecteur('.app[data-x="a b"] .cible')).toEqual(['.cible']);
	});

	it('rend un sujet par sélecteur de la liste', () => {
		expect(
			sujetsDuSelecteur(
				'.app[data-droit="gestionnaire"] .si-gestionnaire, .app[data-droit="redacteur"] .si-redacteur'
			)
		).toEqual(['.si-gestionnaire', '.si-redacteur']);
	});

	it('traite les combinateurs d’enfant, d’adjacence et de frère', () => {
		expect(sujetsDuSelecteur('.a > .b + .c ~ .d')).toEqual(['.d']);
	});

	it('rend le sélecteur lui-même quand il n’a qu’une compound', () => {
		expect(sujetsDuSelecteur('.si-gestionnaire')).toEqual(['.si-gestionnaire']);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   Les attributs de droit, DÉRIVÉS
   ═══════════════════════════════════════════════════════════════════════════ */

describe('attributsQuiChangent', () => {
	it('nomme l’attribut dont la valeur diffère entre les deux états', () => {
		expect(
			attributsQuiChangent(
				['data-droits=ecriture', 'data-rail=ouvert'],
				['data-droits=lecture', 'data-rail=ouvert']
			)
		).toEqual(['data-droits']);
	});

	it('ne nomme rien quand les deux relevés portent le même jeu', () => {
		expect(attributsQuiChangent(['data-rail=ouvert'], ['data-rail=ouvert'])).toEqual([]);
	});

	it('nomme un attribut PRÉSENT d’un seul côté', () => {
		expect(attributsQuiChangent(['data-x=1'], [])).toEqual(['data-x']);
	});

	it('compare des ENSEMBLES de valeurs, pas des valeurs : plusieurs nœuds portent le même attribut', () => {
		expect(attributsQuiChangent(['data-n=1', 'data-n=2'], ['data-n=2', 'data-n=1'])).toEqual([]);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   L'appariement — décision n° 5
   ═══════════════════════════════════════════════════════════════════════════ */

describe('apparier', () => {
	it('apparie par signature', () => {
		const p = apparier([a('x'), a('y')], [a('y', false), a('x')]);
		expect(p[0].b?.sig).toBe('x');
		expect(p[1].b?.rend).toBe(false);
	});

	it('départage les homonymes par RANG, en ordre de document', () => {
		const p = apparier([a('r'), a('r')], [a('r', true), a('r', false)]);
		expect(p[0].b?.rend).toBe(true);
		expect(p[1].b?.rend).toBe(false);
	});

	it('rend `null` quand l’autre côté n’a pas la contrepartie', () => {
		expect(apparier([a('seul')], [])[0].b).toBeNull();
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   Le sort d'une action — décision n° 1, celle que les sondes ont corrigée
   ═══════════════════════════════════════════════════════════════════════════ */

describe('sortDeLAction', () => {
	it('« inexistant » quand ce côté n’a pas le nœud du tout', () => {
		expect(sortDeLAction(null, a('x'))).toBe('inexistant');
	});

	it('« hors-etat » quand le nœud est là mais n’est pas offert dans l’état de référence', () => {
		expect(sortDeLAction(a('x', false), a('x'))).toBe('hors-etat');
	});

	it('« absent » quand le nœud a disparu du DOM — P-09 TENU', () => {
		expect(sortDeLAction(a('x'), null)).toBe('absent');
	});

	it('« masque » quand le nœud reste dans le DOM sans être rendu', () => {
		expect(sortDeLAction(a('x'), a('x', false))).toBe('masque');
	});

	it('« grise » quand le nœud reste rendu et devient inerte', () => {
		expect(sortDeLAction(a('x'), a('x', true, true))).toBe('grise');
	});

	it('« actif » quand rien ne change — le droit ne retire pas cette action', () => {
		expect(sortDeLAction(a('x'), a('x'))).toBe('actif');
	});

	it('une action DÉJÀ inerte des deux côtés n’est pas grisée PAR LE DROIT', () => {
		expect(sortDeLAction(a('x', true, true), a('x', true, true))).toBe('actif');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   La nature — la lecture des deux côtés
   ═══════════════════════════════════════════════════════════════════════════ */

describe('natureDuCouple', () => {
	it('masqué des deux côtés → GEL', () => {
		const v = natureDuCouple('masque', 'masque');
		expect(v).toMatchObject({ regle: 'p09:action-masquee', nature: 'gel' });
	});

	it('grisé des deux côtés → GEL', () => {
		expect(natureDuCouple('grise', 'grise')).toMatchObject({
			regle: 'p09:action-grisee',
			nature: 'gel'
		});
	});

	it('la maquette retire, l’application laisse ACTIF → PORTAGE, et c’est le pire cas', () => {
		expect(natureDuCouple('absent', 'actif')).toMatchObject({
			regle: 'p09:action-offerte-sans-droit',
			nature: 'portage'
		});
		expect(natureDuCouple('masque', 'actif')).toMatchObject({ nature: 'portage' });
	});

	it('la maquette RETIRE, l’application MASQUE → PORTAGE', () => {
		expect(natureDuCouple('absent', 'masque')).toMatchObject({
			regle: 'p09:action-masquee',
			nature: 'portage'
		});
	});

	it('la maquette masque, l’application RETIRE → constat FAVORABLE, jamais un défaut', () => {
		expect(natureDuCouple('masque', 'absent')).toMatchObject({
			nature: 'constat-favorable'
		});
	});

	it('P-09 tenu des deux côtés → rien à dire', () => {
		expect(natureDuCouple('absent', 'absent')).toBeNull();
	});

	it('aucun conditionnement des deux côtés → rien à dire', () => {
		expect(natureDuCouple('actif', 'actif')).toBeNull();
	});

	it('une action que SEULE l’application porte et masque → PORTAGE (la sonde `masque`)', () => {
		expect(natureDuCouple('inexistant', 'masque')).toMatchObject({
			regle: 'p09:action-masquee',
			nature: 'portage'
		});
		expect(natureDuCouple('inexistant', 'grise')).toMatchObject({
			regle: 'p09:action-grisee',
			nature: 'portage'
		});
	});

	it('une action que seule l’application porte SANS la conditionner ne dit rien', () => {
		expect(natureDuCouple('inexistant', 'actif')).toBeNull();
		expect(natureDuCouple('inexistant', 'absent')).toBeNull();
	});

	it('un nœud non offert dans l’état de référence ne déclare aucune interdiction', () => {
		expect(natureDuCouple('hors-etat', 'masque')).toBeNull();
		expect(natureDuCouple('masque', 'hors-etat')).toBeNull();
	});

	it('l’application conditionne ce que la maquette laisse → constat, jamais un défaut de P-09', () => {
		expect(natureDuCouple('actif', 'masque')).toMatchObject({
			regle: 'divergence:conditionnement-du-portage-seul',
			nature: 'constat'
		});
	});

	it('la maquette conditionne un nœud que l’application n’a pas du tout → constat', () => {
		expect(natureDuCouple('masque', 'inexistant')).toMatchObject({
			regle: 'divergence:action-absente-du-portage',
			nature: 'constat'
		});
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   R-2 — la gouvernance par la règle CSS, les DEUX polarités (décision n° 2)
   ═══════════════════════════════════════════════════════════════════════════ */

describe('gouverneesParUnDroit', () => {
	const releve = {
		actions: [a('vue'), a('cachee', false), a('libre')],
		regles: [
			{
				sel: '.app[data-droits="lecture"] .si-ecriture',
				masque: true,
				inerte: false,
				actions: [1]
			},
			{
				sel: '.app[data-droit="gestionnaire"] .si-gestionnaire',
				masque: false,
				inerte: false,
				actions: [0]
			},
			{ sel: '.rail[data-rail="ferme"] .x', masque: true, inerte: false, actions: [2] }
		]
	};

	it('retient les règles qui citent un attribut de droit, quelle que soit leur polarité', () => {
		const g = gouverneesParUnDroit(releve, ['data-droits', 'data-droit']);
		expect(g.regles).toHaveLength(2);
		expect(g.masquees).toEqual(['cachee']);
		expect(g.visibles).toEqual(['vue']);
	});

	it('n’attribue rien à une règle qui ne cite aucun attribut de droit', () => {
		const g = gouverneesParUnDroit(releve, ['data-droits', 'data-droit']);
		expect([...g.masquees, ...g.visibles]).not.toContain('libre');
	});

	it('rend un relevé vide sans attribut de droit dérivé', () => {
		expect(gouverneesParUnDroit(releve, [])).toEqual({ masquees: [], visibles: [], regles: [] });
	});

	it('ne casse pas sur un relevé absent — un état en échec ne fabrique pas de gouvernance', () => {
		expect(gouverneesParUnDroit(null, ['data-droits'])).toEqual({
			masquees: [],
			visibles: [],
			regles: []
		});
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   L'agrégation et les invariants de l'instrument
   ═══════════════════════════════════════════════════════════════════════════ */

describe('agreger', () => {
	it('compte par nature, occurrences comprises', () => {
		expect(
			agreger([
				{ nature: 'gel', occurrences: 3 },
				{ nature: 'portage', occurrences: 1 },
				{ nature: 'gel', occurrences: 1 }
			])
		).toMatchObject({ gel: 4, portage: 1, constat: 0 });
	});
});

describe('les invariants de l’instrument', () => {
	it('le sélecteur d’action couvre les formes interactives que RG-M05-08 suppose', () => {
		for (const forme of [
			'a[href]',
			'button',
			'input',
			'select',
			'[role="menuitem"]',
			'[tabindex]'
		]) {
			expect(SELECTEUR_ACTION).toContain(forme);
		}
	});

	it('les quatre marqueurs d’inertie sont motivés', () => {
		expect(MARQUEURS_INERTES).toHaveLength(4);
		for (const m of MARQUEURS_INERTES) expect(m.quoi.length).toBeGreaterThan(20);
	});

	it('chaque sonde vise une règle que la batterie sait nommer, et une vue qui la porte', () => {
		const regles = new Set([
			'p09:action-masquee',
			'p09:action-grisee',
			'p09:action-offerte-sans-droit'
		]);
		for (const nom of Object.keys(SONDES_CONNUES)) {
			const s = SONDES_CONNUES[nom] as { vue: string; paire: string[]; attendue: string };
			expect(regles.has(s.attendue), nom).toBe(true);
			const couples = couplesDeDroit(scenarioDe(s.vue)).map(
				(c: { a: string; b: string }) => `${c.a}|${c.b}`
			);
			expect(couples, nom).toContain(s.paire.join('|'));
		}
	});

	it('les axes de droit portent chacun leur trace', () => {
		for (const x of AXES_DE_DROIT) expect(x.trace.length).toBeGreaterThan(20);
	});
});
