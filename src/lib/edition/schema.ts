/**
 * Le schéma ProseMirror de l'éditeur — et il n'y en a qu'un. Le FORMAT est décrit une fois
 * pour toutes par `../contenu/document.ts` ; ce module-ci le décrit sous la seule autre forme
 * que ProseMirror comprenne, un `Schema`.
 *
 * CE MODULE N'EST PAS UNE SECONDE VALIDATION : rien ici ne prononce de verdict, et le schéma
 * n'est pas RECOPIÉ du format, il est DÉRIVÉ des extensions TipTap installées (`getSchema`)
 * puis ramené à la forme canonique attribut par attribut. `schema.test.ts` croise les deux
 * descriptions — noms de nœuds, noms de marques, ORDRE des marques.
 *
 * `STACK` §4.3 nomme DIX extensions ; HUIT sont installées. Les trois manquantes sont nommées
 * et comptées à `EXTENSIONS_NOMMEES_NON_INSTALLEES` : le contrat interdit `pnpm add` (`P-24`).
 *
 * L'ORDRE DES MARQUES EST UNE PROPRIÉTÉ DU SCHÉMA, PAS UNE CONVENTION. ProseMirror trie les
 * marques d'un texte par le RANG de leur type. `getSchema` rend `link bold code italic strike
 * underline`, qui n'est PAS celui de `RANG_DE_MARQUE` : un éditeur monté là-dessus émettrait
 * des documents que `analyserDocument` refuserait sur tout texte portant deux marques — refus
 * juste, cause introuvable. Les marques sont donc redéclarées ICI dans l'ordre du format.
 *
 * CE QUI EST RETIRÉ : `hardBreak`, que la règle 4 refuse, et tous les attributs de confort
 * (`start`, `colspan`, `colwidth`, `title`, `target`…) que la règle « attributs totaux » ferait
 * REFUSER. Trois attributs sont AJOUTÉS parce que le gel les écrit et qu'aucune extension ne
 * les porte : l'ancre d'un titre, l'attribution d'une citation, l'étiquette et la légende
 * d'une figure, le caractère numérique d'une cellule.
 */
import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Image from '@tiptap/extension-image';
import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model';
import { RANG_DE_MARQUE, type Marque } from '../contenu/document';

/**
 * Les noms de marques du format, du rang le plus bas au plus haut. La liste est
 * DÉRIVÉE de `RANG_DE_MARQUE` : `document.ts` reste le seul endroit où l'ordre
 * s'écrit.
 */
export const MARQUES_ORDONNEES: readonly Marque['type'][] = (
	Object.keys(RANG_DE_MARQUE) as Marque['type'][]
).sort((a, b) => RANG_DE_MARQUE[a] - RANG_DE_MARQUE[b]);

export interface ExtensionEmployee {
	/** Le nom du paquet, tel que `package.json` l'épingle. */
	readonly paquet: string;
	readonly apporte: readonly string[];
}

/**
 * Les huit extensions installées, et ce que chacune apporte. `TaskItem` est configuré
 * `nested` : sans cela son contenu est `paragraph+` et la case de tâche imbriquée de C-03 est
 * structurellement impossible. `Link` n'apparaît pas : `starter-kit` le porte déjà, et
 * l'ajouter produit l'avertissement « duplicate extension names ».
 */
export const EXTENSIONS_EMPLOYEES: readonly ExtensionEmployee[] = [
	{
		paquet: '@tiptap/starter-kit',
		apporte: [
			'doc',
			'paragraph',
			'text',
			'heading',
			'codeBlock',
			'blockquote',
			'bulletList',
			'orderedList',
			'listItem',
			'horizontalRule',
			'bold',
			'italic',
			'underline',
			'strike',
			'code',
			'link'
		]
	},
	{ paquet: '@tiptap/extension-table', apporte: ['table', 'tableRow', 'tableHeader', 'tableCell'] },
	{ paquet: '@tiptap/extension-task-list', apporte: ['taskList'] },
	{ paquet: '@tiptap/extension-task-item', apporte: ['taskItem'] },
	{ paquet: '@tiptap/extension-image', apporte: ['image'] },
	{ paquet: '@tiptap/extension-link', apporte: [] },
	{ paquet: '@tiptap/extension-placeholder', apporte: [] },
	{ paquet: '@tiptap/extension-character-count', apporte: [] }
];

/**
 * Les trois extensions que `STACK` §4.3 nomme et qui ne sont pas installées. Elles
 * sont nommées et comptées, jamais posées (`P-24`). Aucune ne porte de construction
 * de M04.6 : elles portent du confort de saisie.
 */
export const EXTENSIONS_NOMMEES_NON_INSTALLEES: readonly {
	readonly paquet: string;
	readonly ceQuElleServait: string;
}[] = [
	{
		paquet: '@tiptap/extension-code-block-lowlight',
		ceQuElleServait:
			'la coloration syntaxique d’un bloc de code. `lowlight` 3.3.0 et `highlight.js` ' +
			'11.12.0 SONT installés — c’est le liant TipTap qui manque. La construction n° 4 ' +
			'est produite sans elle : le bloc de code, son étiquette de langage et son bouton ' +
			'de copie sont du rendu (`rendu.ts`), et `RG-M04-05` ne demande pas de couleur.'
	},
	{
		paquet: '@tiptap/extension-mention',
		ceQuElleServait:
			'l’auto-complétion du lien interne (UC-M05-06), déclenchée par deux crochets. La ' +
			'MARQUE `lienInterne` est produite sans elle ; c’est la SAISIE assistée qui ' +
			'manque. Le gel montre l’un et l’autre — la marque à V-17:3313, la complétion à ' +
			'V-17:3308.'
	},
	{
		paquet: '@tiptap/extension-suggestion',
		ceQuElleServait:
			'le menu de commandes déclenché par un caractère (UC-M05-05), que le gel offre en ' +
			'raccourci au menu étendu (V-17:1577). Aucune construction n’en dépend : les vingt ' +
			'commandes de la barre gelée les couvrent toutes.'
	}
];

/**
 * Le schéma que les extensions installées produisent, TEL QUEL. Il n'est pas celui
 * de l'éditeur : il est la SOURCE dont l'éditeur retient ce qui est du format. Le
 * garder exporté permet à l'épreuve de mesurer l'écart plutôt que de le supposer.
 */
export const schemaDesExtensions = getSchema([
	StarterKit,
	Table,
	TableRow,
	TableCell,
	TableHeader,
	TaskList,
	TaskItem.configure({ nested: true }),
	Image
]);

/** Le nom des nœuds que les extensions apportent et que le format ne connaît pas. */
export const NOEUDS_RETIRES: readonly string[] = ['hardBreak'];

/**
 * Les attributs du format, nœud par nœud. `null` en `default` signifie « présent, et
 * vide » — la règle 2. Une entrée SANS `default` rend l'attribut obligatoire :
 * ProseMirror refuse alors de créer le nœud sans lui, comportement voulu pour la
 * source d'une image et son alternative textuelle (`P-06`).
 */
const ATTRIBUTS_DU_FORMAT: Readonly<Record<string, NodeSpec['attrs']>> = {
	/* Le niveau par défaut est 2 : premier bouton de titre de la barre gelée, le
	   titre de la note occupant le niveau 1. */
	heading: { level: { default: 2 }, ancre: { default: null } },
	codeBlock: { language: { default: null } },
	blockquote: { attribution: { default: null } },
	bulletList: {},
	orderedList: {},
	listItem: {},
	taskList: {},
	taskItem: { checked: { default: false } },
	table: {},
	tableRow: {},
	tableHeader: {},
	tableCell: { numerique: { default: false } },
	image: { src: {}, alt: {}, etiquette: { default: null }, legende: { default: null } },
	horizontalRule: {},
	paragraph: {}
};

/** Les attributs du format, marque par marque. */
const ATTRIBUTS_DE_MARQUE: Readonly<Record<string, MarkSpec['attrs']>> = {
	bold: {},
	italic: {},
	underline: {},
	strike: {},
	code: {},
	link: { href: {} }
};

/**
 * Les deux nœuds écrits en propre — le lien interne est une MARQUE, déclarée plus bas.
 *
 * `alerte` accepte des blocs, y compris une alerte : le schéma ProseMirror ne sait pas
 * exprimer « des blocs SAUF celui-ci ». C'est `analyserDocument` qui refuse l'imbrication —
 * le schéma porte la forme, les sept règles portent l'interdit. `diagramme` est un atome.
 */
const NOEUDS_EN_PROPRE: Readonly<Record<string, NodeSpec>> = {
	alerte: {
		group: 'block',
		content: 'block+',
		defining: true,
		attrs: { niveau: {}, glyphe: {}, titre: {} }
	},
	diagramme: {
		group: 'block',
		atom: true,
		attrs: {
			source: {},
			langage: { default: 'mermaid' },
			alternative: {},
			etiquette: { default: null },
			legende: { default: null }
		}
	}
};

/**
 * Les deux marques écrites en propre.
 *
 * `lienInterne` porte l'IDENTIFIANT de la note cible, ce qui la rend insensible au renommage.
 * Elle appartient au groupe des liens et l'exclut (règle 6), et l'exclusion est posée des DEUX
 * côtés — d'un seul, l'ordre d'application deviendrait la règle.
 *
 * `highlight` est du format en entier, mais aucune extension installée ne l'apporte et elle
 * était pour cette seule raison SAUTÉE : le bouton du gel restait muet et deux corps du gel ne
 * pouvaient pas s'ouvrir.
 */
const LIEN_INTERNE: MarkSpec = { group: 'lien', excludes: 'lien', attrs: { cible: {} } };
const SURLIGNE: MarkSpec = {};

/** Les marques que ce module fabrique lui-même, par nom du format. */
const MARQUES_EN_PROPRE: Readonly<Record<string, MarkSpec>> = {
	lienInterne: LIEN_INTERNE,
	highlight: SURLIGNE
};

function specDeNoeud(nom: string): NodeSpec {
	const source = schemaDesExtensions.nodes[nom];
	if (source === undefined) {
		throw new Error(
			`nœud « ${nom} » absent des extensions installées : aucune ne le porte, et ce ` +
				'module n’en fabrique pas — une construction qui manque se déclare (STACK §4.3)'
		);
	}
	const attrs = ATTRIBUTS_DU_FORMAT[nom];
	/* `attrs` non déclarés : le nœud n'en a aucun au format (doc, text). */
	return attrs === undefined ? { ...source.spec } : { ...source.spec, attrs };
}

function specDeMarque(nom: string): MarkSpec {
	const source = schemaDesExtensions.marks[nom];
	if (source === undefined) {
		throw new Error(
			`marque « ${nom} » absente des extensions installées : aucune ne la porte ` +
				'(STACK §4.3 n’en nomme aucune qui l’apporterait)'
		);
	}
	return { ...source.spec, attrs: ATTRIBUTS_DE_MARQUE[nom] ?? {} };
}

/**
 * L'ordre des nœuds compte : ProseMirror choisit le nœud de remplissage d'une
 * expression de contenu en prenant le PREMIER type du schéma qui la satisfait.
 * `paragraph` vient donc avant tout autre bloc, sans quoi un tableau vide se
 * remplirait de citations.
 */
const ORDRE_DES_NOEUDS: readonly string[] = [
	'doc',
	'paragraph',
	'text',
	'heading',
	'codeBlock',
	'bulletList',
	'orderedList',
	'listItem',
	'taskList',
	'taskItem',
	'blockquote',
	'table',
	'tableRow',
	'tableHeader',
	'tableCell',
	'image',
	'horizontalRule'
];

function noeudsDuSchema(): Record<string, NodeSpec> {
	const noeuds: Record<string, NodeSpec> = {};
	for (const nom of ORDRE_DES_NOEUDS) noeuds[nom] = specDeNoeud(nom);
	for (const [nom, spec] of Object.entries(NOEUDS_EN_PROPRE)) noeuds[nom] = spec;
	return noeuds;
}

/**
 * Les marques, DANS L'ORDRE DU FORMAT — règle 7. `MARQUES_ORDONNEES` est la lecture
 * de `RANG_DE_MARQUE` : ce module ne réordonne rien de sa propre autorité. Une marque
 * que ni une extension ni `MARQUES_EN_PROPRE` ne porte serait comptée `absentes`.
 */
function marquesDuSchema(): { marques: Record<string, MarkSpec>; absentes: readonly string[] } {
	const marques: Record<string, MarkSpec> = {};
	const absentes: string[] = [];
	for (const nom of MARQUES_ORDONNEES) {
		const enPropre = MARQUES_EN_PROPRE[nom];
		if (enPropre !== undefined) {
			marques[nom] = enPropre;
			continue;
		}
		if (schemaDesExtensions.marks[nom] === undefined) {
			absentes.push(nom);
			continue;
		}
		marques[nom] = specDeMarque(nom);
	}
	/* Le lien externe reçoit la même exclusion que le lien interne, des deux côtés :
	   c'est la règle 6, et elle ne dépend alors plus de l'ordre. */
	const externe = marques['link'];
	if (externe !== undefined) marques['link'] = { ...externe, group: 'lien', excludes: 'lien' };
	return { marques, absentes };
}

const composition = marquesDuSchema();

/**
 * Les marques du format que le schéma de l'éditeur ne porte pas — calculée, non
 * supposée. Elle est VIDE. Le garde de `./document.ts`, qui refuse d'ouvrir un
 * document portant une marque absente plutôt que de laisser ProseMirror l'effacer en
 * silence, reste en place.
 */
export const MARQUES_DU_FORMAT_SANS_EXTENSION: readonly string[] = composition.absentes;

/** LE SCHÉMA DE L'ÉDITEUR. Il n'en existe pas d'autre dans le produit. */
export const schemaDeLEditeur = new Schema({
	nodes: noeudsDuSchema(),
	marks: composition.marques
});
