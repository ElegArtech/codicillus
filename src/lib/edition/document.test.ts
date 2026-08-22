/**
 * LES UNITAIRES DES DEUX PORTES DE L'ÉDITEUR — ce qui entre, ce qui sort, et ce
 * qui est REFUSÉ.
 *
 * Le critère de sortie du contrat de `T-050` est littéral : « un document
 * invalide → REFUSÉ à l'écriture, jamais réparé — montre-le sur quatre genres ».
 * Les genres sont ceux de `CAS_INVALIDES` (`src/lib/contenu/commandes.ts`), la
 * liste opposable du dépôt : ce fichier n'en écrit aucun, il les rejoue PAR LA
 * PORTE DE L'ÉDITEUR — ce que `document.test.ts` du format ne fait pas, puisque
 * l'éditeur n'existait pas.
 *
 * ET UN CINQUIÈME REFUS, QUI N'EST PAS UNE INVALIDITÉ : le document valide que
 * l'éditeur ne sait pas porter. Confondre les deux ferait passer une lacune
 * d'outillage pour une donnée corrompue. Le schéma porte aujourd'hui TOUTES les
 * marques du format — `MARQUES_DU_FORMAT_SANS_EXTENSION` est vide —, donc aucun
 * document ne peut plus déclencher ce refus-là par une marque ; la lacune de
 * STRUCTURE, elle, existe encore et le dernier `describe` la mesure.
 */
import { describe, expect, it } from 'vitest';
import { CAS_INVALIDES } from '../contenu/commandes';
import { analyserDocument, DocumentInvalide, verifierDocument } from '../contenu/document';
import { DOCUMENTS_DU_GEL } from '../contenu/documents-du-gel';
import { cequeLEditeurNeSaitPasPorter, documentDepuisNoeud, noeudDepuisDocument } from './document';
import { MARQUES_DU_FORMAT_SANS_EXTENSION } from './schema';

/* ═══════════════════════════════════ L'aller-retour ═════════════════════ */

describe('l’aller-retour par l’éditeur, sur les quatre corps transcrits du gel', () => {
	/**
	 * LES QUATRE PASSENT, AU CARACTÈRE PRÈS.
	 *
	 * Les deux corps du registre Référence portent la marque du surligné
	 * (`pnpm contenu:constructions` la compte, « highlight 2 »). Elle était
	 * sautée du schéma faute d'extension qui l'apporte, et ces deux corps ne
	 * pouvaient pas s'ouvrir ; le surligné est désormais écrit en propre
	 * (`schema.ts`, `MARQUES_EN_PROPRE`) et les quatre traversent l'éditeur À
	 * L'IDENTIQUE.
	 */
	for (const corps of DOCUMENTS_DU_GEL) {
		it(`${corps.note} / ${corps.registre} — traverse l’éditeur et revient IDENTIQUE`, () => {
			const retour = documentDepuisNoeud(noeudDepuisDocument(corps.document));
			expect(retour).toEqual(corps.document);
			/* L'identité de sérialisation, et non la seule égalité structurelle. */
			expect(JSON.stringify(retour)).toBe(JSON.stringify(corps.document));
		});
	}

	it('aucun des quatre corps du gel n’est hors de portée de l’éditeur — compté', () => {
		const hors = DOCUMENTS_DU_GEL.filter(
			(c) => cequeLEditeurNeSaitPasPorter(c.document).length > 0
		);
		expect(hors.map((c) => `${c.note} / ${c.registre}`)).toEqual([]);
		/* La cause, et non le seul effet : le compte ci-dessus retomberait à deux
		   si une marque du format quittait le schéma de l'éditeur. */
		expect(MARQUES_DU_FORMAT_SANS_EXTENSION).toEqual([]);
	});
});

/* ═══════════════════════════════════ Le refus de l'invalide ═════════════ */

describe('un document mal formé est REFUSÉ par la porte de l’éditeur, jamais réparé', () => {
	const genres = [...new Set(CAS_INVALIDES.map((c) => c.genre))];

	it(`la liste opposable du dépôt porte ${genres.length} genres, et au moins quatre`, () => {
		expect(genres.length).toBeGreaterThanOrEqual(4);
	});

	for (const genre of genres) {
		const cas = CAS_INVALIDES.filter((c) => c.genre === genre);
		it(`« ${genre} » — les ${cas.length} cas sont refusés, aucun n’entre dans l’éditeur`, () => {
			for (const c of cas) {
				expect(() => noeudDepuisDocument(c.valeur), c.nom).toThrow(DocumentInvalide);
			}
		});
	}

	it('le refus porte TOUS les manquements, avec leur chemin — jamais le premier seul', () => {
		try {
			noeudDepuisDocument({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
			expect.unreachable('le document a été accepté');
		} catch (cause) {
			expect(cause).toBeInstanceOf(DocumentInvalide);
			const refus = cause as DocumentInvalide;
			expect(refus.manquements.length).toBeGreaterThan(0);
			expect(refus.manquements[0]?.chemin).toBe('content[0].content');
		}
	});

	it('la porte du format passe AVANT celle de l’éditeur — l’ordre est vérifiable', () => {
		/* Un document qui violerait les deux — mal formé ET porteur du surligné —
		   doit sortir en `DocumentInvalide` : diagnostiquer une lacune d'outillage
		   sur une donnée corrompue enverrait chercher la cause à côté. */
		const doubleFaute = {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'x\r', marks: [{ type: 'highlight' }] }]
				}
			]
		};
		expect(() => noeudDepuisDocument(doubleFaute)).toThrow(DocumentInvalide);
	});
});

/* ═══════════════════════════════════ Le contrôle de structure ═══════════ */

describe('un contenu structurellement impossible pour l’éditeur est refusé, pas ouvert', () => {
	/**
	 * CAS SYNTHÉTIQUE, ET IL DOIT L'ÊTRE (`P-5`, `P-26`). Le format admet
	 * qu'un élément de liste porte n'importe quel bloc ; le schéma issu des
	 * extensions veut un PARAGRAPHE en premier enfant. Aucun corps du dépôt n'est
	 * dans ce cas : sans ce document écrit à la main, l'appel de contrôle de
	 * structure serait une ligne qu'on espère.
	 *
	 * La divergence elle-même est un fait à connaître, et elle est déclarée au
	 * rapport de lot : l'éditeur n'accepte pas TOUT ce que le format accepte.
	 */
	const listeSansParagraphe = {
		type: 'doc',
		content: [
			{
				type: 'bulletList',
				content: [
					{
						type: 'listItem',
						content: [
							{
								type: 'heading',
								attrs: { level: 3, ancre: null },
								content: [{ type: 'text', text: 'un titre en tête d’élément' }]
							}
						]
					}
				]
			}
		]
	};

	it('le format l’accepte — la faute n’est donc pas dans le document', () => {
		/* Si ce cas cessait d'être valide au format, l'épreuve suivante ne
		   prouverait plus rien : elle mesurerait le refus du format, pas celui de
		   l'éditeur. C'est la garde de `P-5` sur le cas d'à côté. */
		expect(verifierDocument(listeSansParagraphe).valide).toBe(true);
		expect(cequeLEditeurNeSaitPasPorter(analyserDocument(listeSansParagraphe))).toEqual([]);
	});

	it('l’éditeur le refuse au contrôle de structure, et ne l’ouvre pas amputé', () => {
		expect(() => noeudDepuisDocument(listeSansParagraphe)).toThrow(RangeError);
	});
});
