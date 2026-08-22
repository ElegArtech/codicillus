/**
 * LE SCHÉMA PROSEMIRROR DE L'ÉDITEUR — et il n'y en a qu'un.
 *
 * ADR-003 : « le corps d'une note est conservé en document ProseMirror
 * sérialisé en JSON ». Le FORMAT est décrit une fois pour toutes par
 * `src/lib/contenu/document.ts` — types, sept règles de forme canonique,
 * `analyserDocument` en porte unique. Ce module-ci décrit la même chose sous la
 * seule autre forme que ProseMirror comprenne : un `Schema`, celui qu'un
 * éditeur instancie.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE N'EST PAS UNE SECONDE VALIDATION, ET C'EST VÉRIFIÉ
 *
 * La borne du contrat de `T-050` est explicite : « si tu te trouves à écrire
 * une seconde validation de document, arrête-toi ». Elle est tenue de deux
 * façons, et la seconde est la seule qui compte :
 *
 *   1. Rien ici ne prononce de verdict. Tout ce qui sort de l'éditeur passe par
 *      `analyserDocument` (voir `./document.ts`), qui reste l'unique porte —
 *      un document que ce schéma laisserait passer et que les sept règles
 *      refusent est REFUSÉ, jamais réparé.
 *   2. Le schéma n'est pas RECOPIÉ du format : il est DÉRIVÉ des extensions
 *      TipTap installées (`getSchema`), puis ramené à la forme canonique
 *      attribut par attribut. Et `schema.test.ts` croise les deux
 *      descriptions — noms de nœuds, noms de marques, ORDRE des marques —
 *      contre `document.ts`. Deux descriptions qui ne peuvent plus dériver
 *      l'une de l'autre sans qu'une épreuve nommée rougisse.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * PROVENANCE — CE QUI EST LU, ET OÙ
 *
 *   `cadrage/STACK-TECHNIQUE.md` §4.3 (l. 270) — les extensions TipTap
 *   employées, et les trois nœuds écrits en propre. La ligne nomme DIX
 *   extensions ; HUIT sont installées. Les trois manquantes sont nommées et
 *   comptées à `EXTENSIONS_NOMMEES_NON_INSTALLEES`, jamais posées : le contrat
 *   de ce lot interdit `pnpm add` (P-24).
 *
 *   `mockups/V-17-editeur.html:1504-1585` — la barre d'outils gelée, ensemble
 *   CLOS des commandes de l'éditeur : deux d'historique, trois de titre, six de
 *   caractère, quatre de bloc de liste, cinq de bloc secondaire, cinq au menu
 *   étendu. C'est elle qui dit ce que l'éditeur OFFRE ; le schéma dit ce qu'il
 *   sait PORTER, et les deux ne coïncident pas partout — les écarts sont
 *   nommés à `./constructions.ts`.
 *
 *   `src/lib/contenu/document.ts` — le format. Les noms de nœuds et de
 *   marques, les attributs, et `RANG_DE_MARQUE` dont l'ordre est la règle 7
 *   (`ARB-056`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ORDRE DES MARQUES EST UNE PROPRIÉTÉ DU SCHÉMA, PAS UNE CONVENTION
 *
 * Règle 7 : « les marques sont dans l'ordre de déclaration du type `Marque` »,
 * et le schéma du format REFUSE tout autre ordre. Or ProseMirror trie les
 * marques d'un texte par le RANG de leur type, et le rang est la position dans
 * l'`OrderedMap` des marques du schéma. Mesuré sur les huit extensions
 * installées, `getSchema` rend l'ordre suivant :
 *
 *     link(0) bold(1) code(2) italic(3) strike(4) underline(5)
 *
 * — qui n'est PAS celui de `RANG_DE_MARQUE`. Un éditeur monté sur ce schéma-là
 * émettrait des documents que `analyserDocument` refuserait, sur des textes
 * portant deux marques : le refus serait juste et la cause introuvable. Les
 * marques sont donc redéclarées ICI dans l'ordre du format, et l'épreuve
 * `schema.test.ts` compare rang par rang.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI EST RETIRÉ DE CE QUE LES EXTENSIONS APPORTENT, ET POURQUOI
 *
 *   `hardBreak`   — n'est PAS des quinze constructions de M04.6, et
 *                   `document.ts` le refuse nommément (règle 4 : « le format ne
 *                   porte pas de saut de ligne dur »). `starter-kit` l'apporte ;
 *                   il est retiré, sans quoi l'éditeur produirait au premier
 *                   retour à la ligne un nœud que la base refuse.
 *   attributs de   — `orderedList` apporte `start` et `type`, les cellules
 *   confort         `colspan`, `rowspan`, `colwidth` et `align`, l'image
 *                   `title`, `width` et `height`, le lien `target`, `rel`,
 *                   `class` et `title`. Aucun n'est du format : un attribut de
 *                   plus est un attribut inconnu, que la règle « attributs
 *                   totaux » fait REFUSER. Les garder aurait rendu l'éditeur
 *                   incapable d'enregistrer quoi que ce soit.
 *
 * Et trois attributs sont AJOUTÉS, parce que le gel les écrit et qu'aucune
 * extension ne les porte : l'ancre d'un titre, l'attribution d'une citation,
 * l'étiquette et la légende d'une figure, le caractère numérique d'une
 * cellule. `document.ts` en porte le raisonnement, ligne à ligne.
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
 * s'écrit, et le tri ci-dessous ne fait que le lire.
 */
export const MARQUES_ORDONNEES: readonly Marque['type'][] = (
	Object.keys(RANG_DE_MARQUE) as Marque['type'][]
).sort((a, b) => RANG_DE_MARQUE[a] - RANG_DE_MARQUE[b]);

/* ═══════════════════════════════════ Les extensions installées ══════════ */

/** Une extension employée, et ce qu'elle apporte au format. */
export interface ExtensionEmployee {
	/** Le nom du paquet, tel que `package.json` l'épingle. */
	readonly paquet: string;
	/** Les nœuds et marques du format que cette extension apporte. */
	readonly apporte: readonly string[];
}

/**
 * LES HUIT EXTENSIONS INSTALLÉES, et ce que chacune apporte.
 *
 * `TaskItem` est configuré `nested` : sans cela son contenu est
 * `paragraph+` et la case de tâche imbriquée de C-03 — « cases de tâches
 * imbriquées » — est structurellement impossible. Avec, il vaut
 * `paragraph block*`, ce qui admet une liste de tâches en second enfant.
 *
 * `Link` n'apparaît pas : `starter-kit` 3.30.1 le porte déjà, et l'ajouter
 * produit l'avertissement « duplicate extension names » de TipTap — deux
 * déclarations d'une même marque, ce qui est exactement ce que la règle 1 du
 * format réprouve pour les documents.
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
 * LES TROIS EXTENSIONS QUE `STACK-TECHNIQUE.md` §4.3 NOMME ET QUI NE SONT PAS
 * INSTALLÉES. Elles sont nommées et comptées, jamais posées — le contrat de ce
 * lot interdit toute installation (`P-24`), et ce qui manque se DÉCLARE.
 *
 * Aucune des trois ne porte de construction de M04.6 : elles portent du
 * confort de saisie. Ce qu'elles coûtent est écrit, exigence par exigence.
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

/* ═══════════════════════════════════ Le schéma dérivé ═══════════════════ */

/**
 * Le schéma que les extensions installées produisent, TEL QUEL. Il n'est pas
 * celui de l'éditeur : il est la SOURCE dont l'éditeur retient ce qui est du
 * format. Le garder exporté permet à l'épreuve de mesurer l'écart plutôt que de
 * le supposer — c'est ce qui a établi l'ordre des marques ci-dessus.
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
 * Les attributs du format, nœud par nœud. `null` en valeur de `default`
 * signifie « présent, et vide » : c'est la règle 2 du format — « attributs
 * totaux ; une valeur absente s'écrit `null` ». Une entrée SANS `default` rend
 * l'attribut obligatoire : ProseMirror refuse alors de créer le nœud sans lui,
 * ce qui est le comportement voulu pour la source d'une image et pour son
 * alternative textuelle (P-06).
 */
const ATTRIBUTS_DU_FORMAT: Readonly<Record<string, NodeSpec['attrs']>> = {
	/* Le niveau par défaut est 2 : c'est le premier bouton de titre de la barre
	   gelée (V-17:1516), et le titre de la note occupe le niveau 1. */
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
 * LES DEUX NŒUDS ÉCRITS EN PROPRE — ADR-003, et il n'y en a pas un troisième
 * ici : le lien interne est une MARQUE, déclarée plus bas.
 *
 * `alerte` accepte des blocs, y compris une alerte : le schéma ProseMirror ne
 * sait pas exprimer « des blocs SAUF celui-ci », et l'exprimer par un groupe à
 * part changerait ce que les autres nœuds acceptent. C'est `analyserDocument`
 * qui refuse l'imbrication (`schemaContenuDAlerte`), et c'est le partage voulu :
 * le schéma porte la forme, les sept règles portent l'interdit.
 *
 * `diagramme` est un atome : sa source est un attribut, non un contenu. C'est
 * ce que `document.ts` décrit — « le diagramme DÉCRIT EN TEXTE, c'est lui qui
 * est stocké » — et ce que le gel insère (V-17:3078).
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
 * LES DEUX MARQUES ÉCRITES EN PROPRE.
 *
 * `lienInterne` porte l'IDENTIFIANT de la note cible. ADR-003 : c'est ce qui le
 * rend insensible au renommage et ce qui permet de le signaler cassé si la
 * cible disparaît. Elle appartient au groupe des liens et l'exclut : un texte
 * ne porte pas à la fois un lien interne et un lien externe (règle 6).
 * L'exclusion est posée des DEUX côtés — poser `excludes` d'un seul côté ne
 * fait retirer l'autre que dans un sens, et l'ordre d'application deviendrait
 * la règle.
 *
 * `highlight` — le surligné — est du format en entier : `document.ts` la
 * déclare et lui donne son rang, `rendu.ts` la rend `mark`, `markdown.ts`
 * l'écrit avec deux signes égal. Aucune extension installée ne l'apporte, et
 * elle était pour cette seule raison SAUTÉE : le bouton du gel (V-17:1526)
 * restait alors muet et deux corps du gel ne pouvaient pas s'ouvrir. Une marque
 * sans attribut ne demande aucune dépendance — elle s'écrit, comme les deux
 * nœuds ci-dessus.
 */
const LIEN_INTERNE: MarkSpec = { group: 'lien', excludes: 'lien', attrs: { cible: {} } };
const SURLIGNE: MarkSpec = {};

/** Les marques que ce module fabrique lui-même, par nom du format. */
const MARQUES_EN_PROPRE: Readonly<Record<string, MarkSpec>> = {
	lienInterne: LIEN_INTERNE,
	highlight: SURLIGNE
};

/* ═══════════════════════════════════ La composition ═════════════════════ */

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
 * L'ORDRE DES NŒUDS COMPTE, et pour une raison précise : ProseMirror choisit
 * le nœud de remplissage d'une expression de contenu en prenant le PREMIER type
 * du schéma qui la satisfait. `paragraph` vient donc avant tout autre bloc,
 * sans quoi un tableau vide se remplirait de citations.
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
 * Les marques, DANS L'ORDRE DU FORMAT — règle 7. `MARQUES_ORDONNEES` est la
 * lecture de `RANG_DE_MARQUE` de `document.ts` : ce module ne réordonne rien de
 * sa propre autorité.
 *
 * Une marque que ni une extension ni `MARQUES_EN_PROPRE` ne porte serait
 * comptée `absentes` — il n'y en a aucune aujourd'hui.
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
	/* Le lien externe reçoit la même exclusion que le lien interne, des deux
	   côtés : c'est la règle 6, et elle ne dépend alors plus de l'ordre. */
	const externe = marques['link'];
	if (externe !== undefined) marques['link'] = { ...externe, group: 'lien', excludes: 'lien' };
	return { marques, absentes };
}

const composition = marquesDuSchema();

/**
 * LES MARQUES DU FORMAT QUE LE SCHÉMA DE L'ÉDITEUR NE PORTE PAS.
 *
 * Mesuré, non supposé : la liste est calculée. Elle est VIDE — `highlight` y
 * figurait, et le surligné est désormais écrit en propre (voir
 * `MARQUES_EN_PROPRE`). Le garde de `./document.ts`, qui refuse d'ouvrir un
 * document portant une marque absente plutôt que de laisser ProseMirror
 * l'effacer en silence, reste en place : c'est lui qui empêcherait la perte
 * sans témoin si une marque nouvelle arrivait au format sans arriver ici.
 */
export const MARQUES_DU_FORMAT_SANS_EXTENSION: readonly string[] = composition.absentes;

/** LE SCHÉMA DE L'ÉDITEUR. Il n'en existe pas d'autre dans le produit. */
export const schemaDeLEditeur = new Schema({
	nodes: noeudsDuSchema(),
	marks: composition.marques
});
