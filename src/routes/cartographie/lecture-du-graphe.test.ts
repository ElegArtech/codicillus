/**
 * L'ASSEMBLAGE DU GRAPHE — ce que `lireLeGraphe()` fait UNE FOIS SES CINQ LECTURES
 * FAITES.
 *
 * CE QUI EST ÉPROUVÉ ICI DÉCIDE DE TROIS ÉCRANS. `/cartographie`,
 * `/cartographie/par-type` et `/modelisation` lisent tous par ce chemin : la fusion
 * des deux natures d'arêtes, le vocabulaire servi, et le bornage au périmètre
 * d'affichage. Aucune de ces trois règles ne se vérifiait ailleurs qu'au navigateur,
 * contre une base réelle — c'est pour cela que `assemblerLeGraphe()` a été sortie.
 *
 * RIEN ICI NE PARLE À POSTGRESQL, et c'est la règle de la maison
 * (`src/lib/donnees/relations.test.ts:1-8`) : aucun faux, aucune simulation de module,
 * des littéraux et la fonction du produit.
 */
import { describe, expect, it } from 'vitest';
import { assemblerLeGraphe } from './lecture-du-graphe';
import type { RelationLisible } from '../../lib/donnees/outils';
import { LIBELLES_DE_MENTION, TYPE_DE_MENTION } from '../../lib/graphe/mentions';
import type { CleDeTypeDeRelation, LibellesDeRelation, Note } from '../../../seeds/corpus';

/** Une note réduite à ce que l'assemblage regarde — identité et rangement. */
function note(id: string, univers = 'U', domaine = 'D'): Note {
	return {
		id,
		titre: 'Titre de ' + id,
		extrait: '',
		type: 'Note',
		univers,
		domaine,
		dossier: '',
		auteur: '',
		fraicheur: 'frais',
		jours: 0,
		revise: null,
		vues: 0,
		pj: 0,
		brouillon: false,
		visibilite: 'interne',
		operationnel: false,
		etiquettes: []
	} as unknown as Note;
}

/** Une relation telle que la jointure la rend : une ligne, donc une clé. */
function declaree(de: string, vers: string, type = 'heberge'): RelationLisible {
	return { id: de + '-' + vers, de, vers, type, origine: 'declaree' } as unknown as RelationLisible;
}

/** Le référentiel tel que `types_de_relation` le rend — deux libellés par type. */
const VOCABULAIRE_LU: Record<string, LibellesDeRelation> = {
	heberge: { sortant: 'héberge', entrant: 'est hébergé par' },
	'depend-de': { sortant: 'dépend de', entrant: 'porte' }
};

const TECHNIQUES: readonly CleDeTypeDeRelation[] = [
	'depend-de'
] as unknown as CleDeTypeDeRelation[];

const GLOBAL = { type: 'global' } as const;

describe('assemblerLeGraphe', () => {
	it('les arêtes déclarées et déduites descendent mêlées, distinguées par leur origine', () => {
		const lu = assemblerLeGraphe(
			[note('a'), note('b'), note('c')],
			[declaree('a', 'b')],
			VOCABULAIRE_LU,
			TECHNIQUES,
			new Map([['b', ['c']]]),
			GLOBAL
		);

		expect(lu.relations).toHaveLength(2);
		const declarees = lu.relations.filter((r) => r.origine === 'declaree');
		const deduites = lu.relations.filter((r) => r.origine === 'deduite');
		expect(declarees.map((r) => r.de + '>' + r.vers)).toEqual(['a>b']);
		expect(deduites.map((r) => r.de + '>' + r.vers)).toEqual(['b>c']);
		/* La déduite n'a AUCUNE ligne derrière elle : c'est ce `null` qui interdit à
		   la vue de proposer de la retirer. */
		expect(deduites[0]?.id).toBeNull();
		expect(deduites[0]?.type).toBe(TYPE_DE_MENTION);
		/* Les notes descendent telles qu'elles sont montées : l'assemblage n'en
		   retire aucune, même celle que rien ne relie. */
		expect(lu.notes.map((n) => n.id)).toEqual(['a', 'b', 'c']);
		expect(lu.relationsTechniques).toEqual(['depend-de']);
	});

	it('le vocabulaire rendu porte les libellés de la base PLUS les deux mots de la mention', () => {
		const lu = assemblerLeGraphe(
			[note('a'), note('b')],
			[],
			VOCABULAIRE_LU,
			[],
			new Map([['a', ['b']]]),
			GLOBAL
		);

		const rendu = lu.typesRelation as Record<string, LibellesDeRelation>;
		/* Les clés lues en base sont intactes — un libellé recopié ferait dire au
		   graphe réel les mots d'un jeu d'exemple. */
		expect(rendu['heberge']).toEqual({ sortant: 'héberge', entrant: 'est hébergé par' });
		expect(rendu['depend-de']).toEqual({ sortant: 'dépend de', entrant: 'porte' });
		/* Et la mention se lit EXACTEMENT là où un type déclaré se lit. */
		expect(rendu[TYPE_DE_MENTION]).toEqual(LIBELLES_DE_MENTION);
		expect(Object.keys(rendu).sort()).toEqual(['depend-de', 'heberge', TYPE_DE_MENTION].sort());
	});

	it('la base ne connaît pas le type « mentionne »', () => {
		/* Le référentiel monté ici tient lieu de table : s'il ressort porteur de la
		   clé, c'est que l'assemblage l'a écrite là où la base la relirait. */
		const table: Record<string, LibellesDeRelation> = {
			heberge: { sortant: 'héberge', entrant: 'est hébergé par' }
		};

		const lu = assemblerLeGraphe(
			[note('a'), note('b')],
			[],
			table,
			[],
			new Map([['a', ['b']]]),
			GLOBAL
		);

		expect(Object.keys(table)).toEqual(['heberge']);
		expect(table[TYPE_DE_MENTION]).toBeUndefined();
		/* La clé n'existe QUE dans le dictionnaire rendu, le temps d'un rendu. */
		expect((lu.typesRelation as Record<string, LibellesDeRelation>)[TYPE_DE_MENTION]).toEqual(
			LIBELLES_DE_MENTION
		);
		/* Et le type des mentions rendues n'est PAS au référentiel de la table. */
		expect(lu.relations.map((r) => r.type)).toEqual([TYPE_DE_MENTION]);
	});

	it("un périmètre d'affichage borne les mentions, pas les relations déclarées", () => {
		/* `dedans` et `ailleurs` sont dans deux univers ; le périmètre n'en affiche
		   qu'un. Les deux couples se citent, et une relation est déclarée sur chacun. */
		const notes = [
			note('dedans', 'U'),
			note('voisine', 'U'),
			note('ailleurs', 'AUTRE'),
			note('lointaine', 'AUTRE')
		];
		const lu = assemblerLeGraphe(
			notes,
			[declaree('dedans', 'ailleurs')],
			VOCABULAIRE_LU,
			[],
			new Map([
				['dedans', ['voisine']],
				['ailleurs', ['lointaine']]
			]),
			{ type: 'univers', nom: 'U' }
		);

		/* LA DÉCLARÉE RESTE, une extrémité hors périmètre comprise : elle dit « une
		   dépendance sort du périmètre », et `sousGraphe()` la dessine en fantôme. */
		expect(
			lu.relations.filter((r) => r.origine === 'declaree').map((r) => r.de + '>' + r.vers)
		).toEqual(['dedans>ailleurs']);

		/* LA MENTION HORS PÉRIMÈTRE DISPARAÎT, aux DEUX extrémités : une citation ne
		   dit pas une dépendance, et elle ne fabrique aucun nœud fantôme. */
		expect(
			lu.relations.filter((r) => r.origine === 'deduite').map((r) => r.de + '>' + r.vers)
		).toEqual(['dedans>voisine']);
	});
});
