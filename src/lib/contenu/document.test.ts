/**
 * LE FORMAT CANONIQUE — ce qu'il accepte, et surtout ce qu'il refuse.
 *
 * « Schéma refusant l'invalide » est un critère de sortie littéral de T-014.
 * Les vingt et un documents mal formés sont ceux de `CAS_INVALIDES` : une seule
 * liste, jouée ici et par `pnpm contenu:invalide`. Deux listes auraient
 * divergé — c'est la même raison qui fait vivre le schéma et son rendu au même
 * endroit.
 */
import { describe, expect, it } from 'vitest';
import { corpsDepuisTexte, corpsVide } from '../base/semence';
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

describe('ce que le schéma refuse — vingt et un documents, sept genres', () => {
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
