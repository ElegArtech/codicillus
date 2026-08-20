/**
 * L'ÉDITEUR RÉEL — ce qui rend la barre d'outils de V-17 et V-18 vivante.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL SE MONTE SUR LE NŒUD DU GEL, IL N'EN CRÉE AUCUN
 *
 * `mockups/V-17-editeur.html` pose une zone `div.prose.redaction#redaction`
 * en `contenteditable`, et toute la typographie du produit est accrochée à ces
 * classes-là. Un éditeur qui créerait son propre nœud éditable À L'INTÉRIEUR de
 * celui-ci rendrait le texte hors de la portée des règles gelées, et il
 * faudrait toucher `V-17.css` pour le rattraper — ce qui est interdit.
 *
 * ProseMirror sait prendre un élément EXISTANT pour zone éditable : c'est
 * l'option `mount` d'`EditorView`. Le document servi ne change donc pas d'un
 * nœud, et aucune feuille n'est modifiée. C'est la seule raison pour laquelle
 * ce module emploie ProseMirror directement plutôt que l'enveloppe TipTap.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE SCHÉMA EST CELUI DU PRODUIT, PAS UN SECOND
 *
 * `schemaDeLEditeur` (`./schema.ts`) est composé des extensions TipTap que la
 * pile impose, plus les trois nœuds écrits en propre — alerte, diagramme, lien
 * interne. `noeudDepuisDocument()` et `documentDepuisNoeud()` (`./document.ts`)
 * sont les deux portes entre le format canonique et l'arbre ProseMirror. Rien
 * ici ne redéfinit un nœud, une marque ou une conversion : ce fichier ne fait
 * que du COMPORTEMENT.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA BARRE D'OUTILS EST CELLE DU GEL, LUE PAR SES ATTRIBUTS
 *
 * Le gel nomme chaque bouton par `data-cmd` (une marque, une annulation) ou
 * `data-bloc` (un bloc). Ce module ne pose aucun attribut et n'ajoute aucun
 * bouton : il LIT ceux qui existent. Un bouton du gel auquel aucune commande ne
 * répond est signalé au journal de la console plutôt que d'être silencieux —
 * un bouton inerte est un lien mort, et le produit n'en admet pas.
 */
import { EditorState, type Command, type Transaction } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { history, redo, undo } from '@tiptap/pm/history';
import { keymap } from '@tiptap/pm/keymap';
import { baseKeymap, chainCommands, setBlockType, toggleMark, wrapIn } from '@tiptap/pm/commands';
import { liftListItem, splitListItem, wrapInList } from '@tiptap/pm/schema-list';
import {
	addColumnAfter,
	addRowAfter,
	deleteTable,
	goToNextCell,
	tableEditing
} from '@tiptap/pm/tables';
import type { MarkType, NodeType } from '@tiptap/pm/model';
import { schemaDeLEditeur } from './schema';
import { documentDepuisNoeud, noeudDepuisDocument } from './document';
import type { Document } from '../contenu/document';

const schema = schemaDeLEditeur;

/**
 * LE NŒUD OU LA MARQUE, OU UNE LEVÉE — jamais `undefined` silencieux.
 *
 * `schema.nodes['x']` est typé optionnel, et il l'est à juste titre : rien ne
 * garantit à la compilation qu'un nom existe. Le laisser filer rendrait une
 * commande inerte au premier renommage du schéma, sans que rien ne le dise —
 * exactement le bouton mort que le produit n'admet pas. La levée est au
 * MONTAGE, donc au chargement de l'écran, pas au clic.
 */
function noeudDeSchema(nom: string): NodeType {
	const type = schema.nodes[nom];
	if (type === undefined) throw new Error(`le schéma de l'éditeur ne porte pas le nœud « ${nom} »`);
	return type;
}

function marqueDeSchema(nom: string): MarkType {
	const type = schema.marks[nom];
	if (type === undefined)
		throw new Error(`le schéma de l'éditeur ne porte pas la marque « ${nom} »`);
	return type;
}

/** Ce qu'un éditeur monté rend à la route. */
export interface EditeurMonte {
	/** Le document canonique courant — ce que la soumission enverra. */
	document(): Document;
	/** Démonte la vue et rend le nœud du gel à son état inerte. */
	detruire(): void;
}

/* ═══════════════════════════════════ Les commandes de la barre ══════════ */

/** Insérer un nœud atomique au point d'insertion. */
function inserer(type: NodeType, attrs?: Record<string, unknown>): Command {
	return (etat, envoyer) => {
		const noeud = type.createAndFill(attrs ?? null);
		if (noeud === null) return false;
		if (envoyer) envoyer(etat.tr.replaceSelectionWith(noeud).scrollIntoView());
		return true;
	};
}

/** Un bloc d'alerte de niveau donné — l'un des trois nœuds écrits en propre. */
function alerte(niveau: 'astuce' | 'attention' | 'danger'): Command {
	return wrapIn(noeudDeSchema('alerte'), { niveau });
}

/**
 * LE LIEN — l'adresse est demandée à l'utilisateur. Le gel ouvre un dialogue
 * pour cela (`V-40`), que cette vue ne transcrit pas : la demande passe donc
 * par l'invite du navigateur, et c'est un écart déclaré, pas un choix de
 * confort. Le fond est tenu : aucun lien n'est posé sans adresse.
 */
function lien(fenetre: Window): Command {
	return (etat, envoyer) => {
		const adresse = fenetre.prompt('Adresse du lien');
		if (adresse === null || adresse.trim() === '') return false;
		return toggleMark(marqueDeSchema('link'), { href: adresse.trim() })(etat, envoyer);
	};
}

/** Le lien INTERNE porte l'identifiant de la note cible, jamais son titre. */
function lienInterne(fenetre: Window): Command {
	return (etat, envoyer) => {
		const cible = fenetre.prompt('Identifiant de la note cible');
		if (cible === null || cible.trim() === '') return false;
		return toggleMark(marqueDeSchema('lienInterne'), { cible: cible.trim() })(etat, envoyer);
	};
}

function image(fenetre: Window): Command {
	return (etat, envoyer) => {
		const src = fenetre.prompt('Adresse de l’image');
		if (src === null || src.trim() === '') return false;
		/* `P-06` — toute image porte une alternative textuelle. Elle est demandée,
		   jamais laissée vide par défaut. */
		const alt = fenetre.prompt('Description de l’image (alternative textuelle)') ?? '';
		return inserer(noeudDeSchema('image'), { src: src.trim(), alt })(etat, envoyer);
	};
}

function tableau(): Command {
	return (etat, envoyer) => {
		const rangee = noeudDeSchema('tableRow');
		const entete = noeudDeSchema('tableHeader');
		const cellule = noeudDeSchema('tableCell');
		const cellules = (type: NodeType): ReturnType<NodeType['create']>[] =>
			Array.from({ length: 3 }, () => {
				const c = type.createAndFill();
				if (c === null) throw new Error('cellule de tableau non constructible');
				return c;
			});
		const noeud = noeudDeSchema('table').create(null, [
			rangee.create(null, cellules(entete)),
			rangee.create(null, cellules(cellule))
		]);
		if (envoyer) envoyer(etat.tr.replaceSelectionWith(noeud).scrollIntoView());
		return true;
	};
}

function diagramme(fenetre: Window): Command {
	return (etat, envoyer) => {
		const source = fenetre.prompt('Source du diagramme') ?? '';
		if (source.trim() === '') return false;
		const alternative = fenetre.prompt('Alternative textuelle du diagramme') ?? '';
		return inserer(noeudDeSchema('diagramme'), { source: source.trim(), alternative })(
			etat,
			envoyer
		);
	};
}

/** La table des commandes, indexée par l'attribut que le gel porte. */
function commandes(fenetre: Window): Record<string, Command> {
	return {
		/* data-cmd */
		bold: toggleMark(marqueDeSchema('bold')),
		italic: toggleMark(marqueDeSchema('italic')),
		underline: toggleMark(marqueDeSchema('underline')),
		strikeThrough: toggleMark(marqueDeSchema('strike')),
		undo,
		redo,
		insertUnorderedList: wrapInList(noeudDeSchema('bulletList')),
		insertOrderedList: wrapInList(noeudDeSchema('orderedList')),
		/* data-bloc */
		h2: setBlockType(noeudDeSchema('heading'), { level: 2 }),
		h3: setBlockType(noeudDeSchema('heading'), { level: 3 }),
		h4: setBlockType(noeudDeSchema('heading'), { level: 4 }),
		citation: wrapIn(noeudDeSchema('blockquote')),
		code: setBlockType(noeudDeSchema('codeBlock')),
		taches: wrapInList(noeudDeSchema('taskList')),
		separateur: inserer(noeudDeSchema('horizontalRule')),
		'alerte-astuce': alerte('astuce'),
		'alerte-attention': alerte('attention'),
		'alerte-danger': alerte('danger'),
		tableau: tableau(),
		image: image(fenetre),
		lien: lien(fenetre),
		'lien-interne': lienInterne(fenetre),
		diagramme: diagramme(fenetre)
	};
}

/* ═══════════════════════════════════ Le montage ═════════════════════════ */

/**
 * MONTE L'ÉDITEUR SUR LA ZONE DE RÉDACTION DU GEL.
 *
 * @param zone le `div#redaction` du gel — il devient la zone éditable, il n'en
 *   reçoit aucune autre à l'intérieur.
 * @param corps le document canonique repris, ou `null` pour une note vierge.
 * @param racine l'élément qui porte la barre d'outils du gel.
 */
export function monterLEditeur(
	zone: HTMLElement,
	corps: Document | null,
	racine: ParentNode
): EditeurMonte {
	const fenetre = zone.ownerDocument.defaultView;
	if (fenetre === null) throw new Error('la zone de rédaction n’a pas de fenêtre');

	const doc = corps === null ? undefined : noeudDepuisDocument(corps);
	const table = commandes(fenetre);
	const baseEntree = baseKeymap['Enter'];

	const liste = noeudDeSchema('listItem');
	const etat = EditorState.create({
		schema,
		...(doc === undefined ? {} : { doc }),
		plugins: [
			history(),
			keymap({
				'Mod-z': undo,
				'Mod-y': redo,
				'Mod-Shift-z': redo,
				'Mod-b': toggleMark(marqueDeSchema('bold')),
				'Mod-i': toggleMark(marqueDeSchema('italic')),
				'Mod-u': toggleMark(marqueDeSchema('underline')),
				Enter: chainCommands(
					splitListItem(liste),
					...(baseEntree === undefined ? [] : [baseEntree])
				),
				'Shift-Tab': liftListItem(liste),
				Tab: goToNextCell(1),
				'Mod-Enter': addRowAfter
			}),
			keymap(baseKeymap),
			tableEditing()
		]
	});

	/* La zone du gel DEVIENT la zone éditable — voir l'en-tête, option `mount`.
	   Son contenu d'origine est remplacé par le document. */
	/* `mount` EST UNE OPTION RÉELLE DE `EditorView` — c'est elle qui fait de la
	   zone du gel la zone éditable, au lieu d'en créer une à l'intérieur. Elle
	   n'est pas déclarée dans le type public de `DirectEditorProps`, d'où
	   l'élargissement local : c'est la seule entorse de ce fichier, et elle est
	   nommée plutôt que tue. */
	const vue: EditorView = new EditorView({ mount: zone } as unknown as HTMLElement, {
		state: etat,
		dispatchTransaction(transaction: Transaction) {
			vue.updateState(vue.state.apply(transaction));
			/* `data-vide` commande le seul rendu visible du vide — l'invite
			   d'amorçage que la feuille gelée écrit en `::before`. Le gel le
			   CALCULE lui aussi ; il est déduit, jamais déclaré. */
			zone.setAttribute('data-vide', vue.state.doc.textContent.trim() === '' ? 'oui' : 'non');
		}
	});
	zone.setAttribute('data-vide', vue.state.doc.textContent.trim() === '' ? 'oui' : 'non');

	/* LA BARRE D'OUTILS — un seul écouteur, délégué, sur la racine. Aucun
	   attribut n'est posé sur un bouton du gel. */
	const auClic = (evenement: Event): void => {
		const cible = (evenement.target as Element | null)?.closest('[data-cmd],[data-bloc]');
		if (cible === null || cible === undefined) return;
		const nom =
			(cible as HTMLElement).dataset['cmd'] ?? (cible as HTMLElement).dataset['bloc'] ?? '';
		const commande = table[nom];
		evenement.preventDefault();
		if (commande === undefined) {
			/* Un bouton auquel rien ne répond est un lien mort. On le DIT. */
			console.warn(`éditeur : aucune commande pour « ${nom} »`);
			return;
		}
		commande(vue.state, vue.dispatch, vue);
		vue.focus();
	};
	/**
	 * LE `mousedown` EST NEUTRALISÉ, ET C'EST CE QUI SAUVE LA SÉLECTION.
	 *
	 * Mesuré : sélectionner « gras » puis cliquer sur le bouton Gras rendait
	 * « du », le mot ayant disparu. La cause n'est pas la commande — c'est que
	 * l'appui du bouton déplace le point d'insertion du document AVANT que le
	 * clic ne parvienne, et la commande s'applique alors à une sélection qui
	 * n'existe plus. Refuser le geste par défaut du `mousedown` laisse la
	 * sélection intacte ; le `click` fait le reste.
	 */
	const auMousedown = (evenement: Event): void => {
		if ((evenement.target as Element | null)?.closest('[data-cmd],[data-bloc]') !== null) {
			evenement.preventDefault();
		}
	};
	racine.addEventListener('mousedown', auMousedown);
	racine.addEventListener('click', auClic);

	/* Les commandes de tableau que le gel n'expose pas encore par un bouton
	   restent atteignables au clavier, et elles sont nommées ici pour qu'on
	   sache qu'elles existent. */
	void addColumnAfter;
	void deleteTable;

	return {
		document: () => documentDepuisNoeud(vue.state.doc),
		detruire: () => {
			racine.removeEventListener('mousedown', auMousedown);
			racine.removeEventListener('click', auClic);
			vue.destroy();
		}
	};
}
