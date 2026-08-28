/**
 * LE FORMAT CANONIQUE — ce qu'il accepte, et surtout ce qu'il refuse.
 *
 * « Schéma refusant l'invalide » est un critère de sortie littéral de T-014.
 * Les vingt-quatre documents mal formés sont ceux de `CAS_INVALIDES` : une seule
 * liste, jouée ici et par `pnpm contenu:invalide`. Deux listes auraient
 * divergé — c'est la même raison qui fait vivre le schéma et son rendu au même
 * endroit.
 *
 * Les deux règles d'`ARB-056` — l'ordre des marques, et le retour chariot où
 * que ce soit — sont éprouvées ci-dessous sur des cas qui les SOLLICITENT,
 * l'ordre sur les vingt couples de marques que la règle 6 n'exclut pas. Une
 * règle qu'aucun cas n'exerce est une règle dont on ignore si elle marche
 * (P-5), et deux resserrements posés sans cas seraient espérés, non posés.
 */
import { describe, expect, it } from 'vitest';
import { corpsDepuisTexte } from '../base/semence';
import { corpsVide } from './corps-vide';
import { CAS_INVALIDES } from './commandes';
import {
	analyserDocument,
	CONSTRUCTIONS,
	DocumentInvalide,
	liensInternes,
	texteBrut,
	texteDeCopie,
	titres,
	verifierDocument,
	type BlocDeCode
} from './document';
import { documentDuGel } from './documents-du-gel';

describe('le catalogue des constructions', () => {
	it('en compte quinze, autant que le tableau de M04.6 (CDC l. 586-600)', () => {
		expect(CONSTRUCTIONS).toHaveLength(15);
	});

	it('les numérote de 1 à 15, dans l’ordre du cahier des charges', () => {
		expect(CONSTRUCTIONS.map((c) => c.numero)).toEqual([...Array(15).keys()].map((i) => i + 1));
	});

	it('ne nomme aucun porteur que le schéma ne connaisse', () => {
		const connus = new Set([
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
			'bold',
			'italic',
			'underline',
			'strike',
			'highlight',
			'code',
			'link',
			'lienInterne'
		]);
		for (const c of CONSTRUCTIONS) {
			for (const p of c.porteurs) expect(connus, `${c.libelle} → ${p}`).toContain(p);
		}
	});
});

describe('ce que le schéma accepte', () => {
	it('les quatre corps transcrits du gel', () => {
		for (const registre of ['reference', 'operationnel'] as const) {
			expect(verifierDocument(documentDuGel('n-restaurer-pg', registre)).valide).toBe(true);
			expect(verifierDocument(documentDuGel('n-mot-de-passe', registre)).valide).toBe(true);
		}
	});

	it('ce que la semence de T-010 écrit déjà en base — sans quoi le lot précédent aurait à être repris', () => {
		expect(verifierDocument(corpsDepuisTexte('Un extrait de note.')).valide).toBe(true);
		expect(verifierDocument(corpsVide()).valide).toBe(true);
	});

	it('un paragraphe vide, écrit par l’ABSENCE de contenu', () => {
		expect(verifierDocument({ type: 'doc', content: [{ type: 'paragraph' }] }).valide).toBe(true);
	});
});

describe('ce que le schéma refuse — vingt-quatre documents, sept genres', () => {
	for (const cas of CAS_INVALIDES) {
		it(`refuse (${cas.genre}) ${cas.nom}`, () => {
			const verdict = verifierDocument(cas.valeur);
			expect(verdict.valide, 'le document a été accepté').toBe(false);
			if (verdict.valide) return;
			const vise = verdict.manquements.find((m) => m.chemin === cas.chemin);
			expect(
				vise,
				`aucun manquement en ${cas.chemin} : ${JSON.stringify(verdict.manquements)}`
			).toBeDefined();
			expect(vise?.message).toMatch(cas.message);
		});
	}

	it('lève, et ne répare jamais', () => {
		expect(() => analyserDocument({ type: 'doc', content: [{ type: 'iframe' }] })).toThrow(
			DocumentInvalide
		);
	});

	it('porte TOUS les manquements, pas seulement le premier', () => {
		let leve: unknown = null;
		try {
			analyserDocument({
				type: 'doc',
				content: [{ type: 'iframe' }, { type: 'objet' }, { type: 'embed' }]
			});
		} catch (e) {
			leve = e;
		}
		expect(leve).toBeInstanceOf(DocumentInvalide);
		expect((leve as DocumentInvalide).manquements).toHaveLength(3);
		expect((leve as DocumentInvalide).message).toContain('3 manquement(s)');
	});
});

/**
 * RÈGLE 7 (`ARB-056`) — L'ORDRE DES MARQUES, ÉPROUVÉ SUR TOUS LES COUPLES.
 *
 * Le rang est l'ordre de déclaration du type `Marque`, `document.ts` l. 114-128,
 * relu ligne à ligne : bold, italic, underline, strike, highlight, code, link,
 * lienInterne. Pour chaque couple, l'ordre du type PASSE et l'ordre inverse est
 * REFUSÉ — c'est ce qui distingue un refus d'un tri silencieux.
 */
describe('règle 7 — l’ordre des marques est celui du type, et l’inverse se refuse', () => {
	const ORDRE = [
		'bold',
		'italic',
		'underline',
		'strike',
		'highlight',
		'code',
		'link',
		'lienInterne'
	] as const;

	const marque = (type: string) =>
		type === 'link'
			? { type, attrs: { href: 'https://exemple.test' } }
			: type === 'lienInterne'
				? { type, attrs: { cible: 'n-x' } }
				: { type };

	const documentAvec = (a: string, b: string) => ({
		type: 'doc',
		content: [
			{
				type: 'paragraph',
				content: [{ type: 'text', text: 'x', marks: [marque(a), marque(b)] }]
			}
		]
	});

	/* `code` exclut toute autre marque, et les deux liens s'excluent l'un
	   l'autre : la règle 6 refuse ces huit couples DANS LES DEUX ORDRES. Ils ne
	   peuvent donc rien dire de la règle 7, et ils sont écartés — les compter
	   comme éprouvés serait un vert par construction. */
	const exclusParLaRegle6 = (a: string, b: string) =>
		a === 'code' ||
		b === 'code' ||
		(a === 'link' && b === 'lienInterne') ||
		(a === 'lienInterne' && b === 'link');

	const couples: Array<[string, string]> = [];
	for (let i = 0; i < ORDRE.length; i++) {
		for (let j = i + 1; j < ORDRE.length; j++) {
			if (!exclusParLaRegle6(ORDRE[i]!, ORDRE[j]!)) couples.push([ORDRE[i]!, ORDRE[j]!]);
		}
	}

	it('éprouve les vingt couples sur vingt-huit que la règle 6 n’exclut pas', () => {
		expect(couples).toHaveLength(20);
	});

	for (const [premier, second] of couples) {
		it(`[${premier}, ${second}] passe · [${second}, ${premier}] est refusé`, () => {
			expect(verifierDocument(documentAvec(premier, second)).valide).toBe(true);
			const verdict = verifierDocument(documentAvec(second, premier));
			expect(verdict.valide, 'l’ordre inverse a été accepté').toBe(false);
			if (verdict.valide) return;
			expect(verdict.manquements.map((m) => m.message).join(' ')).toMatch(
				/ordre de déclaration du type/
			);
		});
	}
});

/**
 * RÈGLE 5 ÉLARGIE (`ARB-056`) — AUCUN RETOUR CHARIOT, OÙ QUE CE SOIT.
 *
 * Elle ne valait que dans un bloc de code, et `texteEnLigne` n'interdisait que
 * « \n » : un fichier en CRLF donnait des paragraphes à « \r » final, que le
 * schéma acceptait. Les sept sites ci-dessous couvrent les trois natures de
 * chaîne du format : un texte, un texte de bloc de code, et un attribut.
 */
describe('règle 5 élargie — aucun retour chariot, où que ce soit', () => {
	const CR = '\r';
	const cas: Array<[string, unknown]> = [
		[
			'un texte de paragraphe',
			{
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: `a${CR}b` }] }]
			}
		],
		[
			'un texte de titre',
			{
				type: 'doc',
				content: [
					{
						type: 'heading',
						attrs: { level: 2, ancre: null },
						content: [{ type: 'text', text: `a${CR}b` }]
					}
				]
			}
		],
		[
			'un texte de bloc de code — RG-M04-05, le motif d’origine',
			{
				type: 'doc',
				content: [
					{
						type: 'codeBlock',
						attrs: { language: 'bash' },
						content: [{ type: 'text', text: `ls${CR}\n-l` }]
					}
				]
			}
		],
		[
			'l’ancre d’un titre',
			{ type: 'doc', content: [{ type: 'heading', attrs: { level: 2, ancre: `s${CR}a` } }] }
		],
		[
			'le titre d’une alerte',
			{
				type: 'doc',
				content: [
					{
						type: 'alerte',
						attrs: { niveau: 'astuce', glyphe: 'i', titre: `EN${CR}BREF` },
						content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }]
					}
				]
			}
		],
		[
			'la source d’un diagramme',
			{
				type: 'doc',
				content: [
					{
						type: 'diagramme',
						attrs: {
							source: `graph TD${CR}\n  A --> B`,
							langage: 'mermaid',
							alternative: 'A mène à B',
							etiquette: null,
							legende: null
						}
					}
				]
			}
		],
		[
			'la destination d’un lien externe',
			{
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'x',
								marks: [{ type: 'link', attrs: { href: `https://x${CR}y` } }]
							}
						]
					}
				]
			}
		]
	];

	for (const [ou, valeur] of cas) {
		it(`refuse un retour chariot dans ${ou}`, () => {
			const verdict = verifierDocument(valeur);
			expect(verdict.valide, 'le retour chariot est passé').toBe(false);
			if (verdict.valide) return;
			expect(verdict.manquements.map((m) => m.message).join(' ')).toMatch(/retour chariot/);
		});
	}

	it('les quatre corps transcrits du gel n’en portent aucun — ARB-056 § Portée', () => {
		for (const id of ['n-restaurer-pg', 'n-mot-de-passe'] as const) {
			for (const registre of ['reference', 'operationnel'] as const) {
				expect(JSON.stringify(documentDuGel(id, registre))).not.toContain(CR);
			}
		}
	});
});

describe('les formes dérivées', () => {
	it('RG-M04-05 — la copie d’un bloc de code rend le texte stocké, et rien d’autre', () => {
		const bloc = [...blocsDuGel()].find((b): b is BlocDeCode => b.type === 'codeBlock');
		expect(bloc).toBeDefined();
		const copie = texteDeCopie(bloc as BlocDeCode);
		expect(copie).toBe(
			'# depuis bkp-01.prod, sous le compte barman\nbarman list-backup pg-prod-01\nbarman show-backup pg-prod-01 20260810T020112'
		);
		expect(copie).not.toMatch(/\r/);
		expect(copie).not.toMatch(/^\s*\d+[ \t|]/m);
	});

	it('le texte brut d’une alerte porte son glyphe et son titre — ce qui est lu, l’est', () => {
		const texte = texteBrut(documentDuGel('n-mot-de-passe', 'operationnel'));
		expect(texte).toContain('EN BREF Version courte');
	});

	it('les liens internes sortent dans l’ordre du document, sans répétition', () => {
		const cites = liensInternes(documentDuGel('n-restaurer-pg', 'reference'));
		expect(new Set(cites).size).toBe(cites.length);
		expect(cites[0]).toMatch(/renouveler-les-cles-ssh/);
	});

	it('les titres sortent dans l’ordre du document', () => {
		const t = titres(documentDuGel('n-restaurer-pg', 'operationnel'));
		expect(t.map((x) => (x.content ?? []).map((c) => c.text).join(''))).toEqual([
			'Préparer',
			'Exécuter',
			'Contrôler',
			'Si ça bloque'
		]);
	});
});

function blocsDuGel() {
	return documentDuGel('n-restaurer-pg', 'reference').content;
}
