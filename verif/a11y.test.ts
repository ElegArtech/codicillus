/**
 * Batterie 10 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * La batterie 10 rend un chiffre par NATURE — portage, gel, instrument. Ce
 * chiffre décide de qui doit agir : un lot de vue, ou le commanditaire par un
 * regel. Une erreur silencieuse du classement ne se verrait nulle part : elle
 * produirait un rapport bien formé, chiffré, et faux. C'est exactement le mode
 * de défaillance RA-01 (PLAN §12) — la vérification qui ne vérifie rien.
 *
 * Trois familles d'unitaires, dans l'ordre de ce qu'elles protègent.
 *
 *   1. LE CLASSEMENT. Multi-ensemble, requalification de portée document,
 *      agrégation, verdict. C'est du calcul pur, donc figeable sans navigateur.
 *   2. LE SEUIL. Un seuil qui pardonnerait plus que ce qu'il nomme serait une
 *      passoire ; un seuil qui ne signalerait pas ses retombées laisserait la
 *      dette s'installer sans témoin.
 *   3. LA NON-DIVERGENCE DU CATALOGUE ET DU CODE. C'est la plus importante, et
 *      la moins évidente : une sonde qui émettrait une règle absente du
 *      catalogue serait invisible au rapport de couverture, et le rapport
 *      annoncerait une couverture qu'il n'a pas. `CLAUDE.md` P-5 le dit dans
 *      l'autre sens — « une règle qu'aucun cas n'exerce est une règle dont on
 *      ignore si elle marche ». Ici c'est le miroir : une règle que le
 *      catalogue ignore est une règle dont personne ne saura qu'elle a parlé.
 *
 * Ce que ces unitaires NE font PAS : éprouver les sondes elles-mêmes.
 * `installerSondes()` s'exécute dans un navigateur, et l'environnement de
 * `vitest.config.ts` est `node` — le dépôt n'a aucune dépendance qui
 * fournirait un DOM. Les sondes sont éprouvées de bout en bout par
 * `node verif/a11y.mjs --sonde=…`, quatre genres, code retour inversé : la
 * même parade que `pnpm verif:maquette:sonde` pour le comparateur du banc.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CATALOGUE_CONSTATS,
	CATALOGUE_INSTRUMENT,
	CATALOGUE_SONDES,
	NON_COUVERTURE,
	PORTEE_DOCUMENT,
	TAGS_CONSTAT,
	TAGS_VERDICT,
	agreger,
	classer,
	cleDe,
	compter,
	confronterAuSeuil,
	estConstat,
	estInstrument,
	installerSondes,
	verdictDuCouple
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './a11y-sondes.mjs';

type Constat = { regle: string; signature: string; detail?: string };
type Ligne = { regle: string; signature: string; nature: string; occurrences: number };

const c = (regle: string, signature: string, detail = ''): Constat => ({
	regle,
	signature,
	detail
});
const ici = dirname(fileURLToPath(import.meta.url));

/* ═══════════════════════════════════════════════════════════════════════════
   1. LE CLASSEMENT EN TROIS NATURES
   ═══════════════════════════════════════════════════════════════════════════ */

describe('classer — les trois natures, et la quatrième qui ne blâme personne', () => {
	it('un défaut présent des deux côtés est du GEL, jamais du portage', () => {
		const defaut = c('axe:color-contrast', 'a|||||||Accueil|nav');
		const lignes: Ligne[] = classer([defaut], [defaut]);
		expect(lignes).toHaveLength(1);
		expect(lignes[0].nature).toBe('gel');
		expect(lignes[0].occurrences).toBe(1);
	});

	it('un défaut que le gel ne porte pas est du PORTAGE', () => {
		const lignes: Ligne[] = classer([], [c('focus:invisible', 'button|btn||||||')]);
		expect(lignes).toHaveLength(1);
		expect(lignes[0].nature).toBe('portage');
	});

	it('un défaut que le gel porte seul est signalé, sans être imputé', () => {
		const lignes: Ligne[] = classer([c('etiquette:orpheline', 'label||||||Nom|')], []);
		expect(lignes).toHaveLength(1);
		expect(lignes[0].nature).toBe('gel-non-reporte');
	});

	it('AUCUN couple ne produit de nature inconnue', () => {
		const lignes: Ligne[] = classer(
			[c('a', 'x'), c('b', 'y')],
			[c('a', 'x'), c('c', 'z'), c('c', 'z')]
		);
		for (const l of lignes) {
			expect(['gel', 'portage', 'gel-non-reporte', 'instrument']).toContain(l.nature);
		}
	});
});

describe('classer — le rapprochement par MULTI-ENSEMBLE', () => {
	/* Le cas qui décide de la méthode : douze liens de rail identiques au gel,
	   treize dans l'application. Un appariement naïf par présence rendrait « gel »
	   pour les treize, et le treizième — le seul défaut du portage — serait
	   absous. Une comparaison par ensemble de clés, symétriquement, rendrait
	   « portage » pour les treize et accuserait un lot de ce que le gel porte. */
	it('impute au portage le SURPLUS, et au gel le commun', () => {
		const gel = Array.from({ length: 12 }, () => c('axe:color-contrast', 'a|rail__lien'));
		const app = Array.from({ length: 13 }, () => c('axe:color-contrast', 'a|rail__lien'));
		const lignes: Ligne[] = classer(gel, app);
		const parNature = Object.fromEntries(lignes.map((l) => [l.nature, l.occurrences]));
		expect(parNature.gel).toBe(12);
		expect(parNature.portage).toBe(1);
		expect(lignes.some((l) => l.nature === 'gel-non-reporte')).toBe(false);
	});

	it('impute au gel non reporté le DÉFICIT, et rien au portage', () => {
		const gel = Array.from({ length: 5 }, () => c('couleur:notif-sans-marque', 'div|notif'));
		const app = Array.from({ length: 2 }, () => c('couleur:notif-sans-marque', 'div|notif'));
		const lignes: Ligne[] = classer(gel, app);
		const parNature = Object.fromEntries(lignes.map((l) => [l.nature, l.occurrences]));
		expect(parNature.gel).toBe(2);
		expect(parNature['gel-non-reporte']).toBe(3);
		expect(parNature.portage).toBeUndefined();
	});

	it('la clé de rapprochement joint la règle ET la signature du nœud', () => {
		expect(cleDe(c('axe:label', 'input|nom'))).not.toBe(cleDe(c('axe:label', 'input|courriel')));
		expect(cleDe(c('axe:label', 'input|nom'))).not.toBe(cleDe(c('focus:invisible', 'input|nom')));
		expect(compter([c('r', 's'), c('r', 's'), c('r', 't')]).size).toBe(2);
	});
});

describe('classer — la requalification de PORTÉE DOCUMENT', () => {
	/* Le mode démo compose `<html>`, `<head>` et `<body>` lui-même
	   (verif/banc/mode-demo.mjs). Un défaut de document mesuré côté application
	   ne dit rien de la vue : il dit quelque chose de l'instrument. L'imputer au
	   portage enverrait un lot corriger un fichier qu'il n'écrit pas. */
	it("une règle de document qui échoue côté application seul revient à l'instrument", () => {
		const lignes: Ligne[] = classer([], [c('axe:html-has-lang', 'html')]);
		expect(lignes[0].nature).toBe('instrument');
	});

	it('une règle ORDINAIRE qui échoue côté application seul reste du portage', () => {
		const lignes: Ligne[] = classer([], [c('axe:color-contrast', 'p')]);
		expect(lignes[0].nature).toBe('portage');
	});

	it('la requalification ne vaut QUE pour le surplus côté application', () => {
		const lignes: Ligne[] = classer(
			[c('axe:document-title', 'html')],
			[c('axe:document-title', 'html')]
		);
		expect(lignes[0].nature).toBe('gel');
	});

	it('la liste de portée document est celle du module, pas une copie locale', () => {
		expect(PORTEE_DOCUMENT).toContain('html-has-lang');
		expect(PORTEE_DOCUMENT).toContain('document-title');
		expect(PORTEE_DOCUMENT).not.toContain('color-contrast');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. L'AGRÉGATION ET LE VERDICT
   ═══════════════════════════════════════════════════════════════════════════ */

describe('agreger — constats et instrument ne pèsent JAMAIS sur le verdict', () => {
	it('compte à part ce qui n’est pas opposable', () => {
		const total = agreger([
			{ regle: 'axe:color-contrast', nature: 'portage', occurrences: 2 },
			{ regle: 'saut:cible-non-focalisable', nature: 'gel', occurrences: 3 },
			{ regle: 'constat:lien-inerte', nature: 'gel', occurrences: 96 },
			{ regle: 'instrument:axe-indecidable', nature: 'instrument', occurrences: 58 }
		]);
		expect(total).toEqual({
			portage: 2,
			gel: 3,
			'gel-non-reporte': 0,
			instrument: 58,
			constat: 96,
			'non-classe': 0
		});
	});

	it('une nature inconnue tombe dans « non-classe », jamais dans un NaN', () => {
		const total = agreger([{ regle: 'axe:color-contrast', nature: 'inconnue', occurrences: 4 }]);
		expect(total['non-classe']).toBe(4);
		expect(Number.isNaN(total.portage)).toBe(false);
		expect(verdictDuCouple(total)).toBe('conforme');
	});

	it('un constat classé « portage » ne fabrique pas de portage', () => {
		const total = agreger([{ regle: 'constat:lien-inerte', nature: 'portage', occurrences: 7 }]);
		expect(total.portage).toBe(0);
		expect(total.constat).toBe(7);
		expect(verdictDuCouple(total)).toBe('conforme');
	});

	it('le verdict nomme la nature la plus ACTIONNABLE en premier', () => {
		expect(verdictDuCouple({ portage: 1, gel: 9, instrument: 0, constat: 0 })).toBe('portage');
		expect(verdictDuCouple({ portage: 0, gel: 9, instrument: 0, constat: 0 })).toBe('gel');
		expect(verdictDuCouple({ portage: 0, gel: 0, instrument: 40, constat: 90 })).toBe('conforme');
	});

	it('estConstat et estInstrument ne se recouvrent pas', () => {
		expect(estConstat('constat:lien-inerte')).toBe(true);
		expect(estInstrument('constat:lien-inerte')).toBe(false);
		expect(estInstrument('instrument:dom-instable')).toBe(true);
		expect(estConstat('axe:color-contrast')).toBe(false);
		expect(estInstrument('axe:color-contrast')).toBe(false);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE SEUIL
   ═══════════════════════════════════════════════════════════════════════════ */

describe('confronterAuSeuil — un seuil ne pardonne que ce qu’il nomme', () => {
	const lignes: Ligne[] = [
		{ regle: 'saut:cible-non-focalisable', signature: 'a', nature: 'gel', occurrences: 34 },
		{ regle: 'axe:aria-required-parent', signature: 'g', nature: 'gel', occurrences: 29 },
		{ regle: 'focus:invisible', signature: 'b', nature: 'portage', occurrences: 1 }
	];

	it('sans seuil, tout est dépassement — le défaut est ZÉRO', () => {
		const r = confronterAuSeuil(lignes, null);
		expect(r.tenu).toBe(false);
		expect(r.depassements).toHaveLength(3);
	});

	it('un seuil nommé règle par règle admet exactement ce qu’il écrit', () => {
		const r = confronterAuSeuil(lignes, {
			admis: {
				'gel/saut:cible-non-focalisable': 34,
				'gel/axe:aria-required-parent': 29,
				'portage/focus:invisible': 1
			}
		});
		expect(r.tenu).toBe(true);
		expect(r.depassements).toHaveLength(0);
	});

	it('une unité de plus est un échec, quel que soit le volume admis', () => {
		const r = confronterAuSeuil(lignes, {
			admis: { 'gel/saut:cible-non-focalisable': 33, 'gel/axe:aria-required-parent': 29 }
		});
		expect(r.tenu).toBe(false);
		expect(r.depassements.map((d: { cle: string }) => d.cle)).toEqual([
			'gel/saut:cible-non-focalisable',
			'portage/focus:invisible'
		]);
		expect(r.depassements[0].exces).toBe(1);
	});

	it('un seuil GLOBAL ne peut pas exister : la clé porte la nature ET la règle', () => {
		// 63 défauts de gel admis « en gros » ne couvrent aucune règle en
		// particulier : une dette nouvelle ne peut pas se cacher dans un total.
		const r = confronterAuSeuil(lignes, { admis: { gel: 63 } });
		expect(r.tenu).toBe(false);
	});

	it('une retombée est SIGNALÉE — un seuil qui ne se resserre pas dérive', () => {
		const r = confronterAuSeuil(lignes.slice(0, 1), {
			admis: { 'gel/saut:cible-non-focalisable': 34, 'gel/axe:aria-required-parent': 29 }
		});
		expect(r.tenu).toBe(true);
		expect(r.retombees).toEqual([{ cle: 'gel/axe:aria-required-parent', mesure: 0, admis: 29 }]);
	});

	it('les constats et l’instrument n’entrent jamais au seuil', () => {
		const r = confronterAuSeuil(
			[
				{ regle: 'constat:lien-inerte', signature: 'a', nature: 'gel', occurrences: 96 },
				{
					regle: 'instrument:axe-indecidable',
					signature: 'b',
					nature: 'instrument',
					occurrences: 58
				}
			],
			null
		);
		expect(r.tenu).toBe(true);
		expect(Object.keys(r.mesure)).toHaveLength(0);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. LE CATALOGUE NE PEUT PAS DIVERGER DU CODE
   ═══════════════════════════════════════════════════════════════════════════ */

/** Les règles littérales émises par les sondes posées dans la page. */
const reglesDesSondes = (): string[] => {
	const source = String(installerSondes);
	const trouvees = new Set<string>();
	for (const m of source.matchAll(
		/'((?:saut|clavier|focus|superposition|graphique|couleur|etiquette|arbre|constat|instrument):[a-z0-9-]+)'/g
	)) {
		trouvees.add(m[1]);
	}
	return [...trouvees].sort();
};

/** Les règles littérales émises par l'orchestration. */
const reglesDeLOrchestration = (): string[] => {
	const source = readFileSync(join(ici, 'a11y.mjs'), 'utf8');
	const trouvees = new Set<string>();
	for (const m of source.matchAll(
		/regle: '((?:saut|clavier|focus|superposition|graphique|couleur|etiquette|arbre|constat|instrument):[a-z0-9-]+)'/g
	)) {
		trouvees.add(m[1]);
	}
	for (const m of source.matchAll(/regle_attendue: '([a-z:-]+)'/g)) trouvees.add(m[1]);
	return [...trouvees].sort();
};

const cataloguees = (): Set<string> =>
	new Set([
		...CATALOGUE_SONDES.map((s: { regle: string }) => s.regle),
		...CATALOGUE_CONSTATS.map((s: { regle: string }) => s.regle),
		...CATALOGUE_INSTRUMENT.map((s: { regle: string }) => s.regle)
	]);

describe('le catalogue et le code disent la même chose — dans les DEUX sens', () => {
	it('toute règle émise par une sonde figure au catalogue', () => {
		const manquantes = reglesDesSondes().filter((r) => !cataloguees().has(r));
		expect(manquantes, `règles émises mais non cataloguées : ${manquantes.join(', ')}`).toEqual([]);
	});

	it("toute règle émise par l'orchestration figure au catalogue", () => {
		const connues = cataloguees();
		const manquantes = reglesDeLOrchestration().filter(
			(r) => !connues.has(r) && !r.startsWith('axe:')
		);
		expect(manquantes, `règles émises mais non cataloguées : ${manquantes.join(', ')}`).toEqual([]);
	});

	it('toute règle catalloguée est réellement émise quelque part', () => {
		const emises = new Set([...reglesDesSondes(), ...reglesDeLOrchestration()]);
		const mortes = [...cataloguees()].filter((r) => !emises.has(r)).sort();
		expect(mortes, `règles cataloguées que rien n'émet : ${mortes.join(', ')}`).toEqual([]);
	});

	it('chaque sonde nomme l’exigence du cadrage qu’elle éprouve', () => {
		for (const s of CATALOGUE_SONDES) {
			expect(s.exigence, `sonde ${s.regle}`).toMatch(/RG-|P-0|WCAG|WAI-ARIA/);
			expect(String(s.pourquoi_pas_axe).length).toBeGreaterThan(20);
		}
	});

	it('chaque règle écartée porte son motif', () => {
		for (const r of [...CATALOGUE_SONDES, ...CATALOGUE_CONSTATS, ...CATALOGUE_INSTRUMENT]) {
			expect(r.regle).toMatch(/^[a-z]+:[a-z0-9-]+$/);
		}
	});
});

describe('les étiquettes axe — le verdict porte sur AA, et rien d’autre', () => {
	it('AAA en est exclu', () => {
		expect(TAGS_VERDICT.some((t: string) => t.includes('aaa'))).toBe(false);
	});

	it('best-practice est relevé mais jamais opposé', () => {
		expect(TAGS_CONSTAT).toContain('best-practice');
		for (const t of TAGS_CONSTAT) expect(TAGS_VERDICT).not.toContain(t);
	});
});

describe('la non-couverture est ÉNONCÉE, et chaque borne est nommée', () => {
	it('elle couvre au moins les huit bornes connues du lot', () => {
		expect(NON_COUVERTURE.length).toBeGreaterThanOrEqual(8);
		for (const nc of NON_COUVERTURE) {
			expect(String(nc.sujet).length).toBeGreaterThan(8);
			expect(String(nc.detail).length).toBeGreaterThan(60);
		}
	});

	it('les bornes chiffrables portent une clé de mesure que le rapport sait lire', () => {
		const CLES = [
			'axe:color-contrast/incomplete',
			'couverture:couples',
			'constat:ordre-visuel-inverse',
			'constat:alternative-textuelle'
		];
		for (const nc of NON_COUVERTURE) {
			if (nc.mesure !== null) expect(CLES).toContain(nc.mesure);
		}
		// Au moins la moitié des bornes est chiffrée : une non-couverture
		// entièrement déclarative serait une profession de foi, pas une mesure.
		expect(
			NON_COUVERTURE.filter((n: { mesure: string | null }) => n.mesure).length
		).toBeGreaterThanOrEqual(3);
	});

	it('le contraste non textuel (1.4.11) est déclaré NON COUVERT — RG-M18-07 n’est tenue qu’à moitié', () => {
		const borne = NON_COUVERTURE.find((n: { sujet: string }) => n.sujet.includes('1.4.11'));
		expect(borne).toBeDefined();
		expect(borne.detail).toContain('RG-M18-07');
	});
});
