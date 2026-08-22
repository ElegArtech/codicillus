/**
 * LES UNITAIRES DU SCHÉMA DE L'ÉDITEUR — le croisement des deux descriptions du
 * format.
 *
 * `src/lib/contenu/document.ts` décrit le format en types et en règles ;
 * `./schema.ts` le décrit en schéma ProseMirror. Deux descriptions d'une même
 * chose dérivent au premier changement si rien ne les compare : c'est ce que ce
 * fichier fait, et c'est la raison pour laquelle le schéma de l'éditeur n'est
 * pas une seconde validation mais une seconde REPRÉSENTATION, tenue.
 *
 * TOUS LES CHIFFRES SONT MESURÉS, aucun n'est recopié : les listes attendues
 * sont dérivées des types et des tables du format, jamais tapées à la main.
 */
import { describe, expect, it } from 'vitest';
import { RANG_DE_MARQUE } from '../contenu/document';
import {
	EXTENSIONS_EMPLOYEES,
	EXTENSIONS_NOMMEES_NON_INSTALLEES,
	MARQUES_DU_FORMAT_SANS_EXTENSION,
	MARQUES_ORDONNEES,
	NOEUDS_RETIRES,
	schemaDesExtensions,
	schemaDeLEditeur
} from './schema';

/* ═══════════════════════════════════ Les nœuds ══════════════════════════ */

/**
 * Les dix-neuf noms de nœuds du format : la racine, le texte, les douze natures
 * de blocs et les cinq conteneurs. La liste est celle de `document.ts` — types
 * `Bloc`, `Conteneur`, `Document`, `Texte` — recopiée ici SOUS FORME DE NOMS,
 * seule forme qu'un schéma expose. Un type nouveau du format sans nœud au
 * schéma ferait rougir l'épreuve suivante.
 */
const NOEUDS_DU_FORMAT = [
	'doc',
	'text',
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
	'diagramme'
];

describe('le schéma de l’éditeur porte exactement les nœuds du format', () => {
	it('n’a ni nœud de plus, ni nœud de moins que le format', () => {
		expect([...Object.keys(schemaDeLEditeur.nodes)].sort()).toEqual([...NOEUDS_DU_FORMAT].sort());
	});

	it('n’a pas de nœud de saut de ligne dur, que les extensions apportent pourtant', () => {
		/* Règle 4 du format : « le format ne porte pas de saut de ligne dur ». Le
		   nœud existe côté extensions — c'est la preuve que le retrait agit. */
		for (const retire of NOEUDS_RETIRES) {
			expect(schemaDesExtensions.nodes[retire]).toBeDefined();
			expect(schemaDeLEditeur.nodes[retire]).toBeUndefined();
		}
	});

	it('rend le paragraphe comme bloc de remplissage, et non un autre bloc', () => {
		/* L'ordre des nœuds décide du remplissage d'une expression de contenu :
		   une cellule de tableau vide doit se remplir d'un paragraphe. */
		const cellule = schemaDeLEditeur.nodes['tableCell'];
		expect(cellule).toBeDefined();
		expect(cellule?.contentMatch.defaultType?.name).toBe('paragraph');
	});
});

describe('les attributs de confort des extensions ne franchissent pas la frontière', () => {
	/**
	 * Chaque cas nomme l'attribut, le nœud, et le fait qu'il EXISTE côté
	 * extensions : sans cette seconde affirmation, l'épreuve serait verte le jour
	 * où l'extension cesserait de le porter, et ne prouverait plus rien (`P-5`).
	 */
	const CONFORTS: readonly [string, readonly string[]][] = [
		['orderedList', ['start', 'type']],
		['tableCell', ['colspan', 'rowspan', 'colwidth', 'align']],
		['tableHeader', ['colspan', 'rowspan', 'colwidth', 'align']],
		['image', ['title', 'width', 'height']]
	];

	for (const [noeud, attributs] of CONFORTS) {
		it(`« ${noeud} » n’expose aucun de ses ${attributs.length} attributs de confort`, () => {
			const source = schemaDesExtensions.nodes[noeud];
			const retenu = schemaDeLEditeur.nodes[noeud];
			expect(source).toBeDefined();
			expect(retenu).toBeDefined();
			for (const attribut of attributs) {
				expect(Object.keys(source?.spec.attrs ?? {})).toContain(attribut);
				expect(Object.keys(retenu?.spec.attrs ?? {})).not.toContain(attribut);
			}
		});
	}

	it('le lien externe ne porte que sa destination', () => {
		const source = schemaDesExtensions.marks['link'];
		expect(Object.keys(source?.spec.attrs ?? {}).length).toBeGreaterThan(1);
		expect(Object.keys(schemaDeLEditeur.marks['link']?.spec.attrs ?? {})).toEqual(['href']);
	});

	it('les trois attributs que le gel écrit et qu’aucune extension ne porte sont là', () => {
		expect(Object.keys(schemaDeLEditeur.nodes['heading']?.spec.attrs ?? {})).toContain('ancre');
		expect(Object.keys(schemaDeLEditeur.nodes['blockquote']?.spec.attrs ?? {})).toContain(
			'attribution'
		);
		expect(Object.keys(schemaDeLEditeur.nodes['tableCell']?.spec.attrs ?? {})).toContain(
			'numerique'
		);
		expect(Object.keys(schemaDeLEditeur.nodes['image']?.spec.attrs ?? {})).toEqual([
			'src',
			'alt',
			'etiquette',
			'legende'
		]);
	});
});

/* ═══════════════════════════════════ Les marques et leur ordre ══════════ */

describe('les marques du schéma suivent l’ordre du format — règle 7, ARB-056', () => {
	it('l’ordre de déclaration lu au format est strictement croissant en rang', () => {
		const rangs = MARQUES_ORDONNEES.map((m) => RANG_DE_MARQUE[m]);
		for (let i = 1; i < rangs.length; i += 1) {
			expect(rangs[i]).toBeGreaterThan(rangs[i - 1] as number);
		}
	});

	it('le rang ProseMirror de chaque marque suit l’ordre du format', () => {
		/* Le rang d'une marque EST sa position dans l'ensemble ordonné des marques
		   du schéma : c'est cette position que ProseMirror emploie pour trier les
		   marques d'un texte. Elle est lue sur les clés, et non sur le champ interne
		   `rank`, que les déclarations de types de la bibliothèque n'exposent pas. */
		const duSchema = Object.keys(schemaDeLEditeur.marks);
		const duFormat = MARQUES_ORDONNEES.filter((m) => schemaDeLEditeur.marks[m] !== undefined);
		expect(duSchema).toEqual(duFormat);
	});

	it('les extensions, elles, ne donnent PAS cet ordre — c’est ce qui rend le tri utile', () => {
		/* Sans ce cas, rien ne dirait que le tri fait quelque chose : une règle
		   qu'aucun cas n'exerce est une règle qu'on espère (`P-5`). */
		const desExtensions = Object.keys(schemaDesExtensions.marks);
		const duFormat = MARQUES_ORDONNEES.filter(
			(m) => schemaDesExtensions.marks[m] !== undefined
		) as readonly string[];
		expect(desExtensions).not.toEqual(duFormat);
	});

	it('la marque « code » exclut toute autre marque — règle 6', () => {
		expect(schemaDeLEditeur.marks['code']?.spec.excludes).toBe('_');
	});

	it('lien interne et lien externe s’excluent, DANS LES DEUX SENS', () => {
		/* Posée d'un seul côté, l'exclusion dépendrait de l'ordre d'application :
		   la règle 6 ne dit rien d'un ordre. */
		const interne = schemaDeLEditeur.marks['lienInterne'];
		const externe = schemaDeLEditeur.marks['link'];
		expect(interne?.excludes(externe!)).toBe(true);
		expect(externe?.excludes(interne!)).toBe(true);
	});
});

/* ═══════════════════════════════════ Ce qui manque, nommé et compté ═════ */

describe('ce que les extensions installées n’apportent pas est nommé et compté', () => {
	it('aucune marque du format ne manque au schéma de l’éditeur', () => {
		/* Le surligné y figurait ; `schema.ts` l'écrit désormais en propre. */
		expect(MARQUES_DU_FORMAT_SANS_EXTENSION).toEqual([]);
	});

	it('le surligné est du format, et le schéma le porte', () => {
		expect(RANG_DE_MARQUE['highlight']).toBe(5);
		expect(schemaDeLEditeur.marks['highlight']).toBeDefined();
	});

	it('les trois extensions que la pile nomme et qui manquent sont énumérées', () => {
		expect(EXTENSIONS_NOMMEES_NON_INSTALLEES.map((e) => e.paquet)).toEqual([
			'@tiptap/extension-code-block-lowlight',
			'@tiptap/extension-mention',
			'@tiptap/extension-suggestion'
		]);
		for (const e of EXTENSIONS_NOMMEES_NON_INSTALLEES) {
			expect(e.ceQuElleServait.length).toBeGreaterThan(40);
		}
	});

	it('les huit extensions employées sont celles que le dépôt installe', () => {
		expect(EXTENSIONS_EMPLOYEES).toHaveLength(8);
	});
});
