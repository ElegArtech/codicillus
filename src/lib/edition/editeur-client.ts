/**
 * L'éditeur réel — ce qui rend la barre d'outils de V-17 et V-18 vivante.
 *
 * IL SE MONTE SUR LE NŒUD DU GEL, IL N'EN CRÉE AUCUN. Toute la typographie du produit est
 * accrochée aux classes de `div.prose.redaction#redaction` ; un éditeur qui créerait son
 * propre nœud éditable rendrait le texte hors de portée des règles gelées. ProseMirror sait
 * prendre un élément EXISTANT — l'option `mount` d'`EditorView` —, et c'est la seule raison
 * pour laquelle ce module l'emploie directement plutôt que l'enveloppe TipTap.
 *
 * LE SCHÉMA EST CELUI DU PRODUIT, PAS UN SECOND : `schemaDeLEditeur` et les deux portes de
 * `./document.ts` font la conversion. LA BARRE D'OUTILS EST CELLE DU GEL, LUE PAR SES
 * ATTRIBUTS : un bouton auquel aucune commande ne répond est signalé au journal plutôt que
 * d'être silencieux — un bouton inerte est un lien mort.
 */
import { EditorState, Selection, type Command, type Transaction } from '@tiptap/pm/state';
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
import { Slice, type MarkType, type NodeType } from '@tiptap/pm/model';
import { schemaDeLEditeur } from './schema';
import { documentDepuisNoeud, noeudDepuisDocument } from './document';
import { GABARITS, MARQUES_DE_LA_BARRE } from './constructions';
import type { Document } from '../contenu/document';

const schema = schemaDeLEditeur;

/**
 * Les TROIS attributs par lesquels le gel nomme un bouton de barre. `data-mark`
 * manquait à ce sélecteur, et les deux boutons qu'il porte seul — « Surligné » et
 * « Code en ligne » — n'étaient donc même pas VUS par la délégation, ni prévenus.
 */
const SELECTEUR_DES_BOUTONS = '[data-cmd],[data-bloc],[data-mark]';

/** Les mêmes trois, dans l'ordre où un bouton est interrogé. */
const ATTRIBUTS_DE_BOUTON = ['cmd', 'bloc', 'mark'] as const;

/**
 * Le nœud ou la marque, ou une LEVÉE — jamais `undefined` silencieux.
 * `schema.nodes['x']` est typé optionnel à juste titre ; le laisser filer rendrait
 * une commande inerte au premier renommage du schéma. La levée est au MONTAGE, donc
 * au chargement de l'écran, pas au clic.
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

export interface EditeurMonte {
	/** Le document canonique courant — ce que la soumission enverra. */
	document(): Document;
	/**
	 * Insère un document canonique au point d'insertion. Le document entre par la
	 * porte unique (`noeudDepuisDocument`) : rien n'est inséré qui ne soit valide.
	 */
	inserer(document: Document): void;
	/**
	 * REMPLACE tout le contenu par ce document. C'est la restauration d'un brouillon
	 * local, et elle ne peut pas passer par `inserer()` : celle-ci pose au point
	 * d'insertion, et restaurer un brouillon sur une note ouverte doublerait le texte
	 * au lieu de le remplacer.
	 */
	remplacer(document: Document): void;
	/** La zone est-elle vide de tout texte ? — ce que le témoin de sauvegarde lit. */
	vide(): boolean;
	/** Démonte la vue et rend le nœud du gel à son état inerte. */
	detruire(): void;
}

export interface OptionsDeMontage {
	/**
	 * Appelé à chaque transaction QUI CHANGE LE DOCUMENT, et seulement celles-là :
	 * c'est ce qui fait passer le témoin de sauvegarde à « Modifications non
	 * enregistrées ». L'état est DÉDUIT d'une frappe, jamais déclaré par un bouton.
	 */
	surChangement?: () => void;
}

function inserer(type: NodeType, attrs?: Record<string, unknown>): Command {
	return (etat, envoyer) => {
		const noeud = type.createAndFill(attrs ?? null);
		if (noeud === null) return false;
		if (envoyer) envoyer(etat.tr.replaceSelectionWith(noeud).scrollIntoView());
		return true;
	};
}

/**
 * Un bloc d'alerte — et ses TROIS attributs, jamais un seul. Le nœud exige `niveau`,
 * `glyphe` et `titre`, tous trois sans valeur par défaut : n'en passer qu'un faisait lever
 * ProseMirror au clic, et les trois entrées du menu étendu étaient donc CASSÉES, pas
 * seulement inertes. Les valeurs ne sont pas rédigées ici : `GABARITS` les porte.
 */
function attributsDeGabarit(cle: string): Record<string, unknown> {
	const gabarit = GABARITS.find((g) => g.cle === cle);
	const bloc = gabarit?.blocs[0];
	if (bloc === undefined || bloc.type !== 'alerte') {
		throw new Error(`aucun gabarit d'alerte pour « ${cle} »`);
	}
	return { ...bloc.attrs };
}

function alerte(cle: string): Command {
	return wrapIn(noeudDeSchema('alerte'), attributsDeGabarit(cle));
}

/**
 * Le lien — l'adresse est demandée à l'utilisateur. Le gel ouvre un dialogue pour
 * cela (`V-40`), que cette vue ne transcrit pas : la demande passe par l'invite du
 * navigateur, et c'est un écart déclaré. Le fond est tenu : aucun lien sans adresse.
 */
function lien(fenetre: Window): Command {
	return (etat, envoyer) => {
		const adresse = fenetre.prompt('Adresse du lien');
		if (adresse === null || adresse.trim() === '') return false;
		return toggleMark(marqueDeSchema('link'), { href: adresse.trim() })(etat, envoyer);
	};
}

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

/* Le gel insère un tableau REMPLI (`V-17:3075`) : deux colonnes, un en-tête
   « Colonne », deux lignes de tirets. Six cellules vides ne se distinguaient de
   rien. La largeur nulle du tableau se répare à `vueDeTableau`. */
const COLONNES_DU_TABLEAU = 2;

function tableau(): Command {
	return (etat, envoyer) => {
		const rangee = noeudDeSchema('tableRow');
		const paragraphe = noeudDeSchema('paragraph');
		const cellules = (type: NodeType, texte: string): ReturnType<NodeType['create']>[] =>
			Array.from({ length: COLONNES_DU_TABLEAU }, () =>
				type.create(null, paragraphe.create(null, schema.text(texte)))
			);
		const noeud = noeudDeSchema('table').create(null, [
			rangee.create(null, cellules(noeudDeSchema('tableHeader'), 'Colonne')),
			rangee.create(null, cellules(noeudDeSchema('tableCell'), '—')),
			rangee.create(null, cellules(noeudDeSchema('tableCell'), '—'))
		]);
		if (envoyer) {
			const transaction = etat.tr.replaceSelectionWith(noeud);
			envoyer(placerDansLaPremiereCellule(transaction).scrollIntoView());
		}
		return true;
	};
}

/**
 * Après l'insertion, le point d'insertion tombe dans la dernière cellule. On le
 * ramène à la première : trois niveaux depuis le début du contenu — la rangée, la
 * cellule, le paragraphe. Si l'arbre n'a pas cette forme, on ne force rien.
 */
function placerDansLaPremiereCellule(transaction: Transaction): Transaction {
	const $depuis = transaction.selection.$from;
	if ($depuis.depth < 1 || $depuis.node(1).type !== noeudDeSchema('table')) return transaction;
	return transaction.setSelection(Selection.near(transaction.doc.resolve($depuis.start(1) + 3)));
}

/**
 * LA SOURCE PROPOSÉE À L'INSERTION, ET ELLE SE DESSINE.
 *
 * Le gel écrit `A --> B` (`SOURCE_DE_DIAGRAMME_DU_GEL`, `constructions.ts`), qui
 * n'est PAS du Mermaid : sans mot de tête — `flowchart`, `sequenceDiagram`,
 * `erDiagram`… — le moteur ne sait pas quel diagramme lire et refuse la source.
 * L'auteur qui reprenait la forme dessinée dans la maquette obtenait donc un
 * diagramme qui ne se dessinait jamais.
 *
 * EN UNE SEULE LIGNE, parce qu'une invite de navigateur est un champ d'une ligne :
 * un `\n` dans la valeur proposée n'y survit pas. Le point-virgule est le
 * séparateur d'instructions de Mermaid, et cette source-là se dessine telle quelle.
 */
const SOURCE_PROPOSEE = 'flowchart LR; A[Début] --> B[Fin]';

function diagramme(fenetre: Window): Command {
	return (etat, envoyer) => {
		const source =
			fenetre.prompt(
				'Source du diagramme (Mermaid — la première ligne donne le type : ' +
					'flowchart, sequenceDiagram, erDiagram…)',
				SOURCE_PROPOSEE
			) ?? '';
		if (source.trim() === '') return false;
		const alternative = fenetre.prompt('Alternative textuelle du diagramme') ?? '';
		return inserer(noeudDeSchema('diagramme'), { source: source.trim(), alternative })(
			etat,
			envoyer
		);
	};
}

/**
 * Les six boutons `data-mark` de la barre — les six sont branchés.
 *
 * Le gel nomme ces six-là par un TROISIÈME attribut que la table de délégation ignorait :
 * quatre sont redoublés en `data-cmd` et marchaient par là, mais « Surligné » et « Code en
 * ligne » n'existent qu'en `data-mark` — muets, et sans même l'avertissement du journal.
 * « Surligné » restait muet une seconde fois, le schéma ne portant pas la marque `highlight`.
 *
 * La garde reste : une marque que le schéma ne porterait pas est sautée plutôt que de casser
 * le montage entier, et le bouton le DIT alors au journal.
 */
function marquesDeLaBarre(): Record<string, Command> {
	const table: Record<string, Command> = {};
	for (const { cle, marque } of MARQUES_DE_LA_BARRE) {
		if (schema.marks[marque] === undefined) continue;
		table[cle] = toggleMark(marqueDeSchema(marque));
	}
	return table;
}

type AttributDeBouton = 'cmd' | 'bloc' | 'mark';

/**
 * Les trois tables, une par attribut — et ce n'est pas une élégance. Une table unique
 * confondait `code` : `data-bloc="code"` (le bloc) et `data-mark="code"` (le code en ligne)
 * portent la MÊME clé au gel, sur deux boutons voisins. Fondues, la seconde écrasait la
 * première — cliquer « Code en ligne » transformait le paragraphe entier en bloc préformaté.
 */
function commandes(fenetre: Window): Record<AttributDeBouton, Record<string, Command>> {
	return {
		cmd: {
			bold: toggleMark(marqueDeSchema('bold')),
			italic: toggleMark(marqueDeSchema('italic')),
			underline: toggleMark(marqueDeSchema('underline')),
			strikeThrough: toggleMark(marqueDeSchema('strike')),
			undo,
			redo,
			insertUnorderedList: wrapInList(noeudDeSchema('bulletList')),
			insertOrderedList: wrapInList(noeudDeSchema('orderedList'))
		},
		bloc: {
			h2: setBlockType(noeudDeSchema('heading'), { level: 2 }),
			h3: setBlockType(noeudDeSchema('heading'), { level: 3 }),
			h4: setBlockType(noeudDeSchema('heading'), { level: 4 }),
			citation: wrapIn(noeudDeSchema('blockquote')),
			code: setBlockType(noeudDeSchema('codeBlock')),
			taches: wrapInList(noeudDeSchema('taskList')),
			separateur: inserer(noeudDeSchema('horizontalRule')),
			'alerte-astuce': alerte('alerte-astuce'),
			'alerte-attention': alerte('alerte-attention'),
			'alerte-danger': alerte('alerte-danger'),
			tableau: tableau(),
			image: image(fenetre),
			lien: lien(fenetre),
			'lien-interne': lienInterne(fenetre),
			diagramme: diagramme(fenetre)
		},
		mark: marquesDeLaBarre()
	};
}

/**
 * Les constructions écrites en propre n'ont pas de `toDOM`, et c'est voulu — mais il fallait
 * alors leur donner une VUE. `./schema.ts` déclare `alerte`, `diagramme` et les marques
 * `lienInterne` et `highlight` sans règle de sérialisation vers le DOM :
 * `../contenu/rendu.ts` est l'implémentation UNIQUE du rendu.
 *
 * Conséquence non prévue : ProseMirror a besoin d'une représentation pour AFFICHER un nœud
 * dans la zone éditable. Sans elle, insérer une alerte levait et l'écran cassait — ces
 * entrées n'étaient pas inertes, elles étaient DESTRUCTRICES. La représentation reprend le
 * balisage de `rendu.ts` classe pour classe.
 */
function vueDAlerte(noeud: NoeudDeVue): { dom: HTMLElement; contentDOM: HTMLElement } {
	const attrs = noeud.attrs as { niveau: string; glyphe: string; titre: string };
	const document = window.document;
	const dom = document.createElement('div');
	dom.className = `alerte alerte--${attrs.niveau}`;
	const boite = document.createElement('div');
	const tete = document.createElement('div');
	tete.className = 'alerte__tete';
	tete.contentEditable = 'false';
	const glyphe = document.createElement('span');
	glyphe.className = 'alerte__glyphe';
	glyphe.textContent = attrs.glyphe;
	tete.append(glyphe, ' ' + attrs.titre);
	const contenu = document.createElement('div');
	boite.append(tete, contenu);
	dom.append(boite);
	return { dom, contentDOM: contenu };
}

function vueDeDiagramme(noeud: NoeudDeVue): { dom: HTMLElement } {
	const attrs = noeud.attrs as { source: string; alternative: string };
	const document = window.document;
	const figure = document.createElement('figure');
	figure.className = 'figure';
	figure.contentEditable = 'false';
	const source = document.createElement('pre');
	source.className = 'mermaid';
	source.setAttribute('role', 'img');
	source.setAttribute('aria-label', attrs.alternative);
	source.textContent = attrs.source;
	figure.append(source);
	return { dom: figure };
}

function vueDeLienInterne(marque: MarqueDeVue): { dom: HTMLElement } {
	const dom = window.document.createElement('a');
	dom.className = 'lien-int';
	dom.title = `Note liée : ${String((marque.attrs as { cible: string }).cible)}`;
	return { dom };
}

/* Le surligné est écrit en propre lui aussi, donc sans sérialisation vers le
   DOM : il lui faut une vue. La balise est celle de `rendu.ts` — `mark`. */
function vueDeSurligne(): { dom: HTMLElement } {
	return { dom: window.document.createElement('mark') };
}

/**
 * Le tableau a une vue parce que celle du schéma le rend INVISIBLE : son `toDOM` somme
 * l'attribut `colwidth` de chaque cellule pour écrire la largeur du tableau, et le format ne
 * porte pas cet attribut de confort. La somme vaut zéro, et zéro en ligne bat la largeur
 * pleine de la feuille gelée. Les rangées vivent toutes dans le corps, ligne d'en-tête
 * comprise : une vue n'a qu'un seul contenu.
 */
function vueDeTableau(): { dom: HTMLElement; contentDOM: HTMLElement } {
	const document = window.document;
	const boite = document.createElement('div');
	boite.className = 'tableau-boite';
	const tableau = document.createElement('table');
	const corps = document.createElement('tbody');
	tableau.append(corps);
	boite.append(tableau);
	return { dom: boite, contentDOM: corps };
}

interface NoeudDeVue {
	readonly attrs: Record<string, unknown>;
}
interface MarqueDeVue {
	readonly attrs: Record<string, unknown>;
}

/**
 * MONTE L'ÉDITEUR SUR LA ZONE DE RÉDACTION DU GEL.
 *
 * @param zone le `div#redaction` du gel — il devient la zone éditable.
 * @param corps le document canonique repris, ou `null` pour une note vierge.
 * @param racine l'élément qui porte la barre d'outils du gel.
 */
export function monterLEditeur(
	zone: HTMLElement,
	corps: Document | null,
	racine: ParentNode,
	options: OptionsDeMontage = {}
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

	/* La zone du gel DEVIENT la zone éditable, et son contenu d'origine est remplacé
	   par le document. `mount` EST UNE OPTION RÉELLE de `EditorView`, mais elle n'est
	   pas déclarée dans le type public : d'où l'élargissement local, seule entorse de
	   ce fichier. */
	const vue: EditorView = new EditorView({ mount: zone } as unknown as HTMLElement, {
		state: etat,
		/* Les signatures de ProseMirror passent bien plus que ce que ces vues lisent ;
		   le rétrécissement est local et nommé. */
		nodeViews: {
			alerte: ((noeud: NoeudDeVue) => vueDAlerte(noeud)) as never,
			diagramme: ((noeud: NoeudDeVue) => vueDeDiagramme(noeud)) as never,
			table: (() => vueDeTableau()) as never
		},
		markViews: {
			lienInterne: ((marque: MarqueDeVue) => vueDeLienInterne(marque)) as never,
			highlight: (() => vueDeSurligne()) as never
		},
		dispatchTransaction(transaction: Transaction) {
			vue.updateState(vue.state.apply(transaction));
			/* `data-vide` commande le seul rendu visible du vide — l'invite d'amorçage
			   que la feuille gelée écrit en `::before`. Il est déduit, jamais déclaré. */
			zone.setAttribute('data-vide', vue.state.doc.textContent.trim() === '' ? 'oui' : 'non');
			/* Le témoin de sauvegarde ne bouge que si le DOCUMENT a bougé : un simple
			   déplacement du point d'insertion n'est pas une modification. */
			if (transaction.docChanged) options.surChangement?.();
		}
	});
	zone.setAttribute('data-vide', vue.state.doc.textContent.trim() === '' ? 'oui' : 'non');

	/* LA BARRE D'OUTILS — un seul écouteur, délégué, sur la racine. Aucun
	   attribut n'est posé sur un bouton du gel. */
	const auClic = (evenement: Event): void => {
		const cible = (evenement.target as Element | null)?.closest(SELECTEUR_DES_BOUTONS);
		if (cible === null || cible === undefined) return;
		const jeu = (cible as HTMLElement).dataset;
		evenement.preventDefault();
		for (const attribut of ATTRIBUTS_DE_BOUTON) {
			const nom = jeu[attribut];
			if (nom === undefined) continue;
			const commande = table[attribut][nom];
			if (commande === undefined) {
				/* Un bouton auquel rien ne répond est un lien mort. On le DIT. */
				console.warn(`éditeur : aucune commande pour « data-${attribut}=${nom} »`);
				continue;
			}
			commande(vue.state, vue.dispatch, vue);
			vue.focus();
			return;
		}
	};
	/**
	 * Le `mousedown` est neutralisé, et c'est ce qui sauve la sélection : l'appui du
	 * bouton déplace le point d'insertion AVANT que le clic ne parvienne, et la
	 * commande s'applique alors à une sélection qui n'existe plus. Mesuré —
	 * sélectionner « gras » puis cliquer sur Gras faisait disparaître le mot.
	 */
	const auMousedown = (evenement: Event): void => {
		if ((evenement.target as Element | null)?.closest(SELECTEUR_DES_BOUTONS) !== null) {
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
		/**
		 * L'insertion d'un document entier — le squelette d'un gabarit, le plan repris
		 * de la Référence. Ce sont les BLOCS qui sont insérés, jamais le nœud `doc`
		 * lui-même : `doc` n'est admis nulle part dans un document, et le poser ferait
		 * lever ProseMirror. Le document passe d'abord par la porte unique.
		 */
		inserer: (document: Document) => {
			const noeud = noeudDepuisDocument(document);
			const tranche = new Slice(noeud.content, 0, 0);
			vue.dispatch(vue.state.tr.replaceSelection(tranche).scrollIntoView());
			vue.focus();
		},
		/**
		 * Le document ENTIER est remplacé — de la première position à la dernière, donc
		 * l'intérieur du nœud racine. La transaction passe par `dispatch`, donc par
		 * `dispatchTransaction` : l'invite d'amorçage et le témoin de sauvegarde suivent
		 * comme après une frappe.
		 */
		remplacer: (document: Document) => {
			const noeud = noeudDepuisDocument(document);
			vue.dispatch(
				vue.state.tr.replaceWith(0, vue.state.doc.content.size, noeud.content).scrollIntoView()
			);
		},
		vide: () => vue.state.doc.textContent.trim() === '',
		detruire: () => {
			racine.removeEventListener('mousedown', auMousedown);
			racine.removeEventListener('click', auClic);
			vue.destroy();
		}
	};
}
