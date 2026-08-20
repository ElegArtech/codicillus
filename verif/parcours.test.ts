/**
 * Batterie 12 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ILS FIGENT, ET POURQUOI CHACUN EXISTE
 *
 * `verif/parcours.mjs` rend un verdict sur 41 étapes, 6 parcours et 3 critères.
 * Sa justesse tient dans six décisions, et CINQ D'ENTRE ELLES ONT DÉJÀ PRODUIT
 * UNE FAUTE MESURÉE pendant l'écriture du lot :
 *
 *   1. LES PHRASES SONT CELLES DU CAHIER. `P-21` : « n'énonce jamais un fait
 *      sur une source sans citer la ligne que tu as lue ». Le test rouvre le
 *      cahier et exige l'égalité, caractère par caractère, pour les 41 étapes
 *      et les 3 critères. Une paraphrase, une ligne qui glisse d'un cran, et la
 *      batterie jugerait le produit sur un texte qui n'est pas le contrat.
 *   2. UN BUDGET DE DURÉE NE PEUT QUE RÉFUTER. La part du produit est une borne
 *      inférieure de la durée du parcours ; au-dessus du budget elle réfute,
 *      en dessous elle ne conclut rien. Le test fige les trois cas, dont
 *      L'ÉGALITÉ, qui ne réfute pas.
 *   3. UNE LIGNE APPARUE N'EST IMPUTABLE À PERSONNE. La base est partagée entre
 *      les copies de travail : le premier passage a rendu SEPT écarts d'état,
 *      dont zéro venait de ce lot. La comparaison ne compte donc que les lignes
 *      DISPARUES et MODIFIÉES, et l'attribution de ce qu'un parcours a écrit
 *      passe par le compte du persona et la fenêtre de temps.
 *   4. UNE SONDE NE SE FAIT PAS CRÉDITER DU DÉFAUT D'AUTRUI. Cette batterie est
 *      rouge de toute façon : exiger « qu'elle rougisse » ne prouverait rien.
 *      La morsure se lit dans le PASSAGE d'un état sain à un état fautif, sur
 *      deux passes — et le test fige le cas qui compte, celui d'une conséquence
 *      DÉJÀ fautive avant la mutation.
 *   5. UNE ÉTAPE NON COUVERTE EST UN ÉCHEC. Le code de retour le dit, sinon la
 *      batterie serait verte sur ce qui n'existe pas (`RA-01`).
 *   6. LE BLOC DE VERDICT NE PORTE AUCUNE DURÉE. C'est ce qui rend le
 *      déterminisme sur trois exécutions comparable ; une milliseconde dans le
 *      bloc et la propriété devient invérifiable.
 *
 * TOUS LES CAS SONT SYNTHÉTIQUES — `P-26` : « un contrôle dont le seul cas
 * d'épreuve est le défaut qu'il trouve devient inerte en réussissant ». Aucun
 * ne dépend de l'état du dépôt, de la base, ni du produit construit ; les deux
 * seuls qui lisent des fichiers lisent le CAHIER et le PILOTE, qui sont la
 * source et l'objet du contrôle, non son résultat.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CAUSES,
	GENRES_DE_SONDE,
	ISSUES,
	PARCOURS,
	SOURCE,
	blocDeVerdict,
	codeDeRetour,
	comparerEmpreintes,
	morsure,
	toutesLesEtapes,
	verdictDEtancheite,
	verdictDEtat,
	verdictDeBudget,
	verdictDeSonde
	// @ts-expect-error — module en JavaScript pur, sans déclaration de types.
} from './parcours-regles.mjs';

const RACINE = join(import.meta.dirname, '..');
const lignesDuCahier = readFileSync(join(RACINE, SOURCE), 'utf8').split('\n');
const pilote = readFileSync(join(RACINE, 'verif', 'parcours.mjs'), 'utf8');

/** @param n numéro de ligne au sens d'un éditeur — 1 pour la première. */
function ligne(n: number): string {
	return lignesDuCahier[n - 1] ?? '';
}

describe('les phrases jugées sont celles du cahier — P-21', () => {
	it('les six parcours sont ceux du cahier, à leur ligne de titre', () => {
		const titres = PARCOURS.map((p: { id: string; ligneTitre: number }) => [
			p.id,
			ligne(p.ligneTitre)
		]);
		for (const [id, texte] of titres) {
			expect(texte, `${id} : ligne de titre`).toContain(`### ${id} —`);
		}
		expect(PARCOURS.map((p: { id: string }) => p.id)).toEqual([
			'PU-01',
			'PU-02',
			'PU-03',
			'PU-04',
			'PU-05',
			'PU-06'
		]);
	});

	it('les 41 étapes portent la phrase EXACTE de leur ligne', () => {
		const etapes = toutesLesEtapes();
		expect(etapes).toHaveLength(41);
		for (const e of etapes as { parcours: string; rang: number; ligne: number; phrase: string }[]) {
			expect(ligne(e.ligne), `${e.parcours}.${e.rang} (l. ${e.ligne})`).toBe(
				`${e.rang}. ${e.phrase}`
			);
		}
	});

	it('les trois critères chiffrés portent le texte EXACT de leur ligne', () => {
		const avec = PARCOURS.filter((p: { critere: unknown }) => p.critere !== null);
		expect(avec).toHaveLength(3);
		for (const p of avec as { id: string; critere: { ligne: number; texte: string } }[]) {
			expect(ligne(p.critere.ligne), `${p.id} : critère`).toBe(p.critere.texte);
		}
	});

	it('les trois parcours SANS critère n’en ont pas au cahier — vérifié fichier ouvert', () => {
		const sans = PARCOURS.filter((p: { critere: unknown }) => p.critere === null);
		expect(sans.map((p: { id: string }) => p.id)).toEqual(['PU-04', 'PU-05', 'PU-06']);
		/* La preuve est l'ABSENCE : entre la dernière étape d'un de ces parcours et
		   le titre du suivant, aucune ligne ne porte « Critère de réussite ». */
		for (const p of sans as { id: string; etapes: { ligne: number }[] }[]) {
			const derniere = Math.max(...p.etapes.map((e) => e.ligne));
			const suivant = lignesDuCahier.findIndex((l, i) => i > derniere && l.startsWith('### PU-'));
			const borne = suivant === -1 ? derniere + 3 : suivant;
			const entre = lignesDuCahier.slice(derniere, borne).join('\n');
			expect(entre, `${p.id} : aucun critère attendu`).not.toContain('Critère de réussite');
		}
	});

	it('les 41 étapes ont un rang unique par parcours et une mesure unique', () => {
		const etapes = toutesLesEtapes() as { parcours: string; rang: number; mesure: string }[];
		const cles = etapes.map((e) => `${e.parcours}.${e.rang}`);
		expect(new Set(cles).size).toBe(41);
		expect(new Set(etapes.map((e) => e.mesure)).size).toBe(41);
	});
});

describe('le pilote et la table close des causes', () => {
	it('chaque mesure déclarée existe dans le pilote', () => {
		for (const e of toutesLesEtapes() as { mesure: string }[]) {
			expect(pilote, `mesure ${e.mesure}`).toContain(`'${e.mesure}': async`);
		}
	});

	it('aucune cause hors de la table close n’est employée par le pilote', () => {
		const employees = [...pilote.matchAll(/\bN\(\s*'([a-z-]+)'/g)].map((m) => m[1]);
		expect(employees.length).toBeGreaterThan(10);
		for (const cause of new Set(employees)) {
			expect(Object.keys(CAUSES), `cause « ${cause} »`).toContain(cause);
		}
	});

	it('les quatre issues et les quatre genres de sonde sont ceux du rapport', () => {
		expect(ISSUES).toEqual(['franchie', 'defaut', 'non-couvert', 'hors-produit']);
		expect(Object.values(GENRES_DE_SONDE).toSorted()).toEqual([
			'configuration',
			'etat',
			'inerte',
			'observation'
		]);
	});
});

describe('le budget de durée ne peut que réfuter', () => {
	it('au-dessus du budget, le critère est INFIRMÉ', () => {
		const v = verdictDeBudget({ budgetMs: 60_000, partDuProduitMs: 60_001, mesuree: true });
		expect(v.verdict).toBe('infirme');
		expect(v.marge).toBe(-1);
	});

	it('À L’ÉGALITÉ, rien n’est réfuté — le doute profite au candidat', () => {
		expect(
			verdictDeBudget({ budgetMs: 60_000, partDuProduitMs: 60_000, mesuree: true }).verdict
		).toBe('non-infirme');
	});

	it('en dessous, le verdict est « non infirmé » et JAMAIS « tenu »', () => {
		const v = verdictDeBudget({ budgetMs: 300_000, partDuProduitMs: 250, mesuree: true });
		expect(v.verdict).toBe('non-infirme');
		expect(v.verdict).not.toBe('tenu');
	});

	it('sans mesure, il n’y a pas de verdict', () => {
		expect(verdictDeBudget({ budgetMs: 60_000, partDuProduitMs: 0, mesuree: false }).verdict).toBe(
			'non-mesuree'
		);
	});
});

describe('le critère d’étanchéité de PU-03', () => {
	const marques = ['n-interne-un', 'n-interne-deux'];

	it('une seule occurrence dans une seule réponse infirme le critère', () => {
		const v = verdictDEtancheite({
			reponses: [
				{ chemin: '/', corps: '<p>accueil public</p>' },
				{ chemin: '/recherche?q=x', corps: '<!-- n-interne-deux -->' }
			],
			marquesInternes: marques
		});
		expect(v.verdict).toBe('infirme');
		expect(v.fuites).toEqual([{ chemin: '/recherche?q=x', marque: 'n-interne-deux' }]);
	});

	it('aucune occurrence ne conclut rien de plus que l’absence', () => {
		const v = verdictDEtancheite({
			reponses: [{ chemin: '/', corps: '<p>rien</p>' }],
			marquesInternes: marques
		});
		expect(v.verdict).toBe('non-infirme');
		expect(v.fuites).toHaveLength(0);
	});
});

describe('P-28 — la comparaison d’état n’impute que ce qui est attribuable', () => {
	const avant = { notes: { a: 'somme-a', b: 'somme-b' }, sessions: {} };

	it('une ligne disparue et une ligne modifiée sont vues', () => {
		const ecarts = comparerEmpreintes(avant, { notes: { a: 'AUTRE' }, sessions: {} });
		expect(ecarts).toEqual([
			{ table: 'notes', cle: 'a', genre: 'modifiee' },
			{ table: 'notes', cle: 'b', genre: 'disparue' }
		]);
	});

	it('une ligne APPARUE n’est pas comptée — la base est partagée', () => {
		const ecarts = comparerEmpreintes(avant, {
			notes: { a: 'somme-a', b: 'somme-b', voisin: 'somme-du-voisin' },
			sessions: {}
		});
		expect(ecarts).toHaveLength(0);
	});

	it('un résidu attribuable est un défaut, une altération est un REFUS de mesurer', () => {
		const residu = verdictDEtat({
			residus: [{ quoi: 'droits posés par la batterie', combien: 4 }],
			alterations: [],
			notesRemises: []
		});
		expect(residu.defauts).toHaveLength(1);
		expect(residu.refus).toHaveLength(0);

		const altere = verdictDEtat({
			residus: [],
			alterations: [{ table: 'notes', cle: 'abcdef12', genre: 'modifiee' }],
			notesRemises: []
		});
		expect(altere.defauts).toHaveLength(0);
		expect(altere.refus).toHaveLength(1);
		expect(altere.refus[0]).toContain('partagée');
	});
});

describe('la sonde ne se fait pas créditer du défaut d’autrui', () => {
	it('une conséquence saine qui devient fautive : la sonde a mordu', () => {
		const m = morsure([
			{
				quoi: 'PU-04.4',
				avant: 'franchie',
				apres: 'defaut',
				attenduAvant: 'franchie',
				attenduApres: 'defaut'
			}
		]);
		expect(m.mordu).toBe(true);
	});

	it('une conséquence DÉJÀ fautive avant la mutation : la sonde n’a rien prouvé', () => {
		const m = morsure([
			{
				quoi: 'PU-04.4',
				avant: 'defaut',
				apres: 'defaut',
				attenduAvant: 'franchie',
				attenduApres: 'defaut'
			}
		]);
		expect(m.mordu).toBe(false);
	});

	it('une conséquence saine qui reste saine : la mutation n’a rien fait', () => {
		const m = morsure([
			{
				quoi: 'critère PU-01',
				avant: 'non-infirme',
				apres: 'non-infirme',
				attenduAvant: 'non-infirme',
				attenduApres: 'infirme'
			}
		]);
		expect(m.mordu).toBe(false);
	});

	it('le témoin inerte fait REFUSER de conclure, dans les deux sens', () => {
		expect(verdictDeSonde({ genre: 'inerte', touches: 0, mordu: false, detail: '' }).code).toBe(2);
		/* Une sonde inerte qui touche n'est pas inerte : c'est la sonde qui est
		   fautive, et le refus vaut aussi. */
		expect(verdictDeSonde({ genre: 'inerte', touches: 3, mordu: true, detail: '' }).code).toBe(2);
	});

	it('une mutation qui ne touche rien fait REFUSER de conclure', () => {
		expect(
			verdictDeSonde({ genre: 'observation', touches: 0, mordu: false, detail: '' }).code
		).toBe(2);
	});

	it('une mutation qui touche et mord vaut 1 ; qui touche sans mordre vaut 0', () => {
		expect(
			verdictDeSonde({ genre: 'observation', touches: 5, mordu: true, detail: 'x' }).code
		).toBe(1);
		expect(
			verdictDeSonde({ genre: 'observation', touches: 5, mordu: false, detail: 'x' }).code
		).toBe(0);
	});
});

describe('le verdict global', () => {
	const vide = {
		franchies: 41,
		horsProduit: 0,
		defauts: [],
		nonCouverts: [],
		criteresInfirmes: [],
		criteresAbsents: 3,
		ecartsDEtat: [],
		refus: []
	};

	it('tout franchi, aucun critère infirmé : 0', () => {
		expect(codeDeRetour(vide)).toBe(0);
	});

	it('une étape NON COUVERTE suffit à faire rouge — RA-01', () => {
		expect(codeDeRetour({ ...vide, nonCouverts: [{ parcours: 'PU-01', rang: 2 }] })).toBe(1);
	});

	it('un état non rétabli suffit à faire rouge — P-28', () => {
		expect(codeDeRetour({ ...vide, ecartsDEtat: [{ table: 'sessions' }] })).toBe(1);
	});

	it('un refus de mesurer l’emporte sur tout le reste : 2', () => {
		expect(codeDeRetour({ ...vide, nonCouverts: [{ rang: 1 }], refus: ['base injoignable'] })).toBe(
			2
		);
	});

	it('le bloc de verdict ne porte AUCUNE durée — c’est ce qui rend le déterminisme comparable', () => {
		const bloc = blocDeVerdict({ ...vide, nonCouverts: [{ rang: 1 }] });
		expect(bloc).toContain('étapes non couvertes     1');
		expect(bloc).not.toMatch(/\d+\s?ms/);
		expect(bloc).not.toMatch(/\bms\b/);
	});
});
