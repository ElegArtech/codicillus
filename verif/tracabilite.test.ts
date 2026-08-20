/**
 * Les unitaires du contrôle de traçabilité.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN CORPUS SYNTHÉTIQUE, ET PAS LE DÉPÔT
 *
 * `P-26` — « un contrôle dont le seul cas d'épreuve est le défaut qu'il
 * trouve devient inerte en réussissant ». Trois occurrences sont au dossier,
 * et la troisième a nommé le motif : la sonde de restitution de focus a été
 * effacée par sa propre correction, faute d'un cas indépendant de l'état du
 * dépôt.
 *
 * Ce contrôle-ci est né rouge, et il est fait pour devenir vert : le jour où
 * les pièces manquantes seront écrites, un unitaire adossé au dépôt cesserait
 * d'exercer quoi que ce soit, SANS QUE RIEN NE LE SIGNALE. Chaque cas ci-
 * dessous construit donc son propre petit dépôt dans un dossier temporaire —
 * registres compris — et n'observe jamais le vrai.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN NUMÉRO N'EST ÉCRIT ICI EN TOUTES LETTRES
 *
 * L'instrument lit `verif/`, donc il lit ce fichier. Un numéro inventé écrit
 * en clair dans un cas de test serait une citation morte de plus, comptée au
 * passif du dépôt : le contrôle accuserait ses propres unitaires. Les numéros
 * sont composés à partir de leur préfixe et de leur rang — `P-20`, `P-23` :
 * décrire une forme, ne jamais la citer.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	referencesDUneLigne,
	fichiersDuPerimetre,
	citationsDuCorpus,
	registresDuDepot,
	sortDeLaCitation,
	confronter
} from './tracabilite.mjs';

/* Les préfixes, séparés de leur rang : assemblés à l'exécution, jamais
   présents dans le texte de ce fichier sous leur forme complète. */
const PRE_ECART = 'ECART-';
const PRE_ECART_ACCENTUE = 'ÉCART-';
const PRE_ARB = 'ARB-';
const PRE_P = 'P-';
const ecart = (rang: string) => PRE_ECART + rang;
const arb = (rang: string) => PRE_ARB + rang;
const piege = (rang: string) => PRE_P + rang;

/* Des rangs qui n'existent nulle part au dépôt : le corpus synthétique est
   clos sur lui-même, et rien de ce qu'il affirme ne dépend du vrai dépôt. */
const PRESENT = '801';
const ABSENT = '802';
const SANS_NUMEROTATION = '803';

let base: string;

beforeAll(() => {
	base = mkdtempSync(join(tmpdir(), 'tracabilite-'));
	mkdirSync(join(base, 'docs', 'ecarts'), { recursive: true });
	mkdirSync(join(base, 'verif'), { recursive: true });

	/* Un dossier d'écart qui numérote ses écarts par titre de section. */
	writeFileSync(
		join(base, 'docs', 'ecarts', `${ecart(PRESENT)}.md`),
		`# ${PRE_ECART_ACCENTUE}${PRESENT} — un dossier de laboratoire\n\n## É-1 — le premier\n\n## É-2 — le second\n`
	);
	/* Un dossier qui existe mais ne numérote AUCUN écart : le citer par un
	   rang est un pointeur mort de l'intérieur. */
	writeFileSync(
		join(base, 'docs', 'ecarts', `${ecart(SANS_NUMEROTATION)}.md`),
		`# ${PRE_ECART_ACCENTUE}${SANS_NUMEROTATION} — un dossier qui numérote par lettres\n\n## a) le premier\n`
	);
	writeFileSync(
		join(base, 'docs', 'arbitrages.md'),
		`## ${arb('801')} — un arbitrage de laboratoire\nRéponse.\n`
	);
	writeFileSync(
		join(base, 'CLAUDE.md'),
		`| ${piege('01')} | un principe |\n\n### ${piege('7')} · un piège\n`
	);
	writeFileSync(join(base, 'docs', 'releve-vues.md'), `| **${piege('0')}** | un amendement |\n`);
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe('l’extraction — ce que le crible voit, et ce qu’il refuse de voir', () => {
	it('relève un dossier d’écart, un arbitrage et un piège sur la même ligne', () => {
		const r = referencesDUneLigne(`voir ${ecart('012')}, ${arb('013')} et ${piege('9')}`);
		expect(r.map((x) => x.genre).sort()).toEqual(['arb', 'ecart', 'piege']);
	});

	/* LA FORME ACCENTUÉE EST LA MOITIÉ MANQUANTE DE L'AUDIT D'ORIGINE. Les
	   titres de dossier l'emploient, les chemins de fichier non ; un crible qui
	   ne lirait que la forme nue passerait à côté de citations réelles. */
	it('relève la forme accentuée du préfixe, et la normalise sur la forme nue', () => {
		const r = referencesDUneLigne(`${PRE_ECART_ACCENTUE}031 É-2.`);
		expect(r).toHaveLength(1);
		expect(r[0]?.numero).toBe(`${ecart('031')} É-2`);
	});

	it('reconnaît un écart nommé à travers les ornements de balisage', () => {
		const r = referencesDUneLigne('`' + ecart('013') + '`' + ' É-1 avait montré que…');
		expect(r[0]?.genre).toBe('e-decart');
		expect(r[0]?.numero).toBe(`${ecart('013')} É-1`);
	});

	/* Sans effacement de l'empreinte, la même citation compterait deux fois —
	   une fois comme écart nommé, une fois comme dossier porteur — et le même
	   défaut serait imputé deux fois au même endroit. */
	it('ne compte PAS deux fois le porteur d’un écart nommé', () => {
		const r = referencesDUneLigne(`${ecart('013')} É-1`);
		expect(r).toHaveLength(1);
		expect(r.filter((x) => x.genre === 'ecart')).toHaveLength(0);
	});

	it('classe un rang d’écart sans porteur comme nu, jamais comme dossier', () => {
		const r = referencesDUneLigne('É-3 — le troisième point de ce dossier');
		expect(r).toHaveLength(1);
		expect(r[0]?.genre).toBe('e-nu');
	});

	it('distingue le rang porté par un lot du rang porté par un dossier', () => {
		const r = referencesDUneLigne('T-072 É-4');
		expect(r[0]?.genre).toBe('e-de-lot');
	});

	/* Un niveau de protocole du plan a la forme d'un piège, au point près. Le
	   confondre fabriquerait des pointeurs morts qui n'en sont pas. */
	it('n’attrape pas un niveau de protocole, qui a la même forme suivie d’un point', () => {
		expect(referencesDUneLigne(`${piege('6')}.3 pose la feuille de vue`)).toHaveLength(0);
		expect(referencesDUneLigne(`${piege('1')}.7 mesure les icônes`)).toHaveLength(0);
	});

	it('relève le piège quand le chiffre n’est suivi d’aucun point', () => {
		expect(referencesDUneLigne(`${piege('6')} — le formateur`)[0]?.numero).toBe(piege('6'));
	});
});

describe('le verdict — les quatre issues, sur un dépôt de laboratoire', () => {
	it('une citation dont la pièce existe est résolue', () => {
		const reg = registresDuDepot(base);
		const c = {
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'ecart',
			numero: ecart(PRESENT),
			brut: ''
		};
		expect(sortDeLaCitation(c, reg, []).sort).toBe('resolue');
	});

	/* LE CAS D'ÉPREUVE QUI SURVIT À LA CORRECTION DU DÉPÔT. Le jour où les
	   dossiers manquants seront écrits, celui-ci exercera toujours la règle. */
	it('une citation dont la pièce n’existe pas est un pointeur mort', () => {
		const reg = registresDuDepot(base);
		const c = { fichier: 'verif/x.mjs', ligne: 1, genre: 'ecart', numero: ecart(ABSENT), brut: '' };
		expect(sortDeLaCitation(c, reg, []).sort).toBe('pointeur-mort');
	});

	it('un arbitrage absent du registre est un pointeur mort', () => {
		const reg = registresDuDepot(base);
		const c = { fichier: 'verif/x.mjs', ligne: 1, genre: 'arb', numero: arb('802'), brut: '' };
		expect(sortDeLaCitation(c, reg, []).sort).toBe('pointeur-mort');
	});

	it('un écart nommé que son dossier numérote est résolu', () => {
		const reg = registresDuDepot(base);
		const c = {
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'e-decart',
			numero: `${ecart(PRESENT)} É-2`,
			brut: ''
		};
		expect(sortDeLaCitation(c, reg, []).sort).toBe('resolue');
	});

	/* Un dossier peut exister et ne pas porter le rang qu'on lui prête : le
	   pointeur meurt À L'INTÉRIEUR d'une pièce présente, et c'est le cas que
	   la seule existence du fichier laisserait passer. */
	it('un écart nommé que son dossier ne numérote pas est un pointeur mort', () => {
		const reg = registresDuDepot(base);
		const horsRang = {
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'e-decart',
			numero: `${ecart(PRESENT)} É-9`,
			brut: ''
		};
		expect(sortDeLaCitation(horsRang, reg, []).sort).toBe('pointeur-mort');
		const sansRang = {
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'e-decart',
			numero: `${ecart(SANS_NUMEROTATION)} É-1`,
			brut: ''
		};
		expect(sortDeLaCitation(sansRang, reg, []).sort).toBe('pointeur-mort');
	});

	it('un rang nu et un rang de lot sont sans registre, ni verts ni rouges', () => {
		const reg = registresDuDepot(base);
		const nu = { fichier: 'verif/x.mjs', ligne: 1, genre: 'e-nu', numero: 'É-1', brut: '' };
		const lot = {
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'e-de-lot',
			numero: 'T-072 É-4',
			brut: ''
		};
		expect(sortDeLaCitation(nu, reg, []).sort).toBe('sans-registre');
		expect(sortDeLaCitation(lot, reg, []).sort).toBe('sans-registre');
	});

	/* Les trois registres homographes. Chacun doit résoudre, et l'instrument
	   déclare qu'il ne sait pas dire lequel était visé. */
	it('la forme du piège se résout sur ses trois registres', () => {
		const reg = registresDuDepot(base);
		const cite = (numero: string) => ({
			fichier: 'verif/x.mjs',
			ligne: 1,
			genre: 'piege',
			numero,
			brut: ''
		});
		expect(sortDeLaCitation(cite(piege('7')), reg, []).motif).toContain('§6');
		expect(sortDeLaCitation(cite(piege('01')), reg, []).motif).toContain('§5');
		expect(sortDeLaCitation(cite(piege('0')), reg, []).motif).toContain('releve-vues');
		expect(sortDeLaCitation(cite(piege('98')), reg, []).sort).toBe('pointeur-mort');
	});
});

describe('les registres d’absence — une exemption qui n’efface rien', () => {
	const citation = (fichier: string, numero: string) => ({
		fichier,
		ligne: 1,
		genre: 'ecart',
		numero,
		brut: ''
	});

	it('ne blanchit que le numéro déclaré, et que dans le fichier déclaré', () => {
		const reg = registresDuDepot(base);
		const traces = [
			{ fichier: 'docs/dossier.md', numeros: [ecart(ABSENT)], motif: 'déclaré absent ici' }
		];
		expect(sortDeLaCitation(citation('docs/dossier.md', ecart(ABSENT)), reg, traces).sort).toBe(
			'documente'
		);
		/* Le même numéro, ailleurs : toujours rouge. */
		expect(sortDeLaCitation(citation('verif/x.mjs', ecart(ABSENT)), reg, traces).sort).toBe(
			'pointeur-mort'
		);
		/* Un autre numéro, dans le même fichier : toujours rouge. */
		expect(sortDeLaCitation(citation('docs/dossier.md', ecart('804')), reg, traces).sort).toBe(
			'pointeur-mort'
		);
	});

	it('couvre l’écart nommé quand c’est le dossier porteur qui est déclaré absent', () => {
		const reg = registresDuDepot(base);
		const traces = [
			{ fichier: 'docs/dossier.md', numeros: [ecart(ABSENT)], motif: 'déclaré absent ici' }
		];
		const c = {
			fichier: 'docs/dossier.md',
			ligne: 1,
			genre: 'e-decart',
			numero: `${ecart(ABSENT)} É-3`,
			brut: ''
		};
		expect(sortDeLaCitation(c, reg, traces).sort).toBe('documente');
	});

	/* Une exemption qu'aucune citation n'exerce est une porte laissée ouverte
	   (`P-5`). L'instrument doit la dénoncer, pas la garder au chaud. */
	it('signale périmée l’exemption qu’aucune citation n’exerce', () => {
		const reg = registresDuDepot(base);
		const traces = [
			{ fichier: 'docs/dossier.md', numeros: [ecart(ABSENT), ecart('805')], motif: 'déclaré' }
		];
		const r = confronter([citation('docs/dossier.md', ecart(ABSENT))], reg, traces);
		expect(r.exemptionsPerimees).toEqual([{ fichier: 'docs/dossier.md', numero: ecart('805') }]);
	});
});

describe('la lecture du dépôt de laboratoire, de bout en bout', () => {
	it('lit ses fichiers, ses registres, et rend le compte attendu', () => {
		writeFileSync(
			join(base, 'verif', 'citations.mjs'),
			`/* ${ecart(PRESENT)} et ${ecart(ABSENT)} et ${arb('801')} et ${arb('802')} */\n`
		);
		const fichiers = fichiersDuPerimetre(base);
		expect(fichiers).toContain('verif/citations.mjs');
		const citations = citationsDuCorpus(
			fichiers.filter((f) => f === 'verif/citations.mjs'),
			base
		);
		const r = confronter(citations, registresDuDepot(base), []);
		expect(r.comptes.total).toBe(4);
		expect(r.comptes.resolue).toBe(2);
		expect(r.comptes.pointeurMort).toBe(2);
		expect([...r.parNumero.keys()].sort()).toEqual([ecart(ABSENT), arb('802')].sort());
		expect(r.numerosParGenre).toEqual({ ecart: 1, arb: 1 });
	});
});
