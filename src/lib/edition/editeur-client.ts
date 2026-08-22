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
 * LES TROIS ATTRIBUTS PAR LESQUELS LE GEL NOMME UN BOUTON DE BARRE — et ils sont
 * bien TROIS. `data-mark` manquait à ce sélecteur ; les deux boutons qu'il porte
 * seul — « Surligné » et « Code en ligne » — n'étaient donc même pas VUS par la
 * délégation, et ne recevaient pas l'avertissement réservé aux boutons sans
 * commande. Un bouton muet qui ne se plaint pas est le pire des deux cas.
 */
const SELECTEUR_DES_BOUTONS = '[data-cmd],[data-bloc],[data-mark]';

/** Les mêmes trois, dans l'ordre où un bouton est interrogé. */
const ATTRIBUTS_DE_BOUTON = ['cmd', 'bloc', 'mark'] as const;

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
	/**
	 * INSÈRE UN DOCUMENT CANONIQUE AU POINT D'INSERTION — le squelette d'un
	 * gabarit, le plan repris d'un autre registre. Le document entre par la porte
	 * unique (`noeudDepuisDocument`) : rien n'est inséré qui ne soit valide.
	 */
	inserer(document: Document): void;
	/** La zone est-elle vide de tout texte ? — ce que le témoin de sauvegarde lit. */
	vide(): boolean;
	/** Démonte la vue et rend le nœud du gel à son état inerte. */
	detruire(): void;
}

/** Ce qu'un montage accepte en plus du corps repris. */
export interface OptionsDeMontage {
	/**
	 * APPELÉ À CHAQUE TRANSACTION QUI CHANGE LE DOCUMENT — et seulement
	 * celles-là. C'est ce qui fait passer le témoin de sauvegarde du gel de
	 * « Aucune modification » à « Modifications non enregistrées » : l'état est
	 * DÉDUIT d'une frappe, jamais déclaré par un bouton.
	 */
	surChangement?: () => void;
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

/**
 * UN BLOC D'ALERTE — et ses TROIS attributs, jamais un seul.
 *
 * Le nœud `alerte` exige `niveau`, `glyphe` et `titre`, tous trois sans valeur
 * par défaut (`./schema.ts`). N'en passer qu'un faisait lever ProseMirror au
 * clic — « No value supplied for attribute glyphe » —, et les trois entrées du
 * menu étendu étaient donc CASSÉES, pas seulement inertes. Relevé au navigateur.
 *
 * Les valeurs ne sont pas rédigées ici : `GABARITS` (`./constructions.ts`) les
 * porte, relevées sur `V-17:3079-3081`. Une seconde écriture divergerait au
 * premier changement de libellé du gel.
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

/* Le gel insère un tableau REMPLI (`V-17:3075`) : deux colonnes, un en-tête
   « Colonne », deux lignes de tirets. Six cellules vides ne se distinguaient de
   rien. La largeur nulle du tableau, elle, se répare à `vueDeTableau`. */
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
 * ramène à la première : trois niveaux depuis le début du contenu du tableau —
 * la rangée, la cellule, le paragraphe. Si l'arbre n'a pas cette forme, on ne
 * force rien et la sélection reste où elle est.
 */
function placerDansLaPremiereCellule(transaction: Transaction): Transaction {
	const $depuis = transaction.selection.$from;
	if ($depuis.depth < 1 || $depuis.node(1).type !== noeudDeSchema('table')) return transaction;
	return transaction.setSelection(Selection.near(transaction.doc.resolve($depuis.start(1) + 3)));
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

/**
 * LES SIX BOUTONS `data-mark` DE LA BARRE — les six sont branchés.
 *
 * Le gel nomme ces six-là par un TROISIÈME attribut, `data-mark`
 * (`V-17:1522-1531`), que la table de délégation ignorait : quatre d'entre eux
 * sont redoublés en `data-cmd` et marchaient par là, mais « Surligné » et
 * « Code en ligne » n'existent qu'en `data-mark` — ils étaient donc muets,
 * SANS MÊME l'avertissement du journal, puisque le sélecteur ne les voyait pas.
 *
 * « Surligné » restait ensuite muet une seconde fois : le schéma ne portait pas
 * la marque `highlight`, faute d'extension qui l'apporte, et la boucle la
 * sautait. Le surligné est maintenant écrit en propre (`./schema.ts`,
 * `MARQUES_EN_PROPRE`) — un bouton dessiné est un geste promis.
 *
 * La correspondance clé → marque du format n'est pas réécrite ici :
 * `MARQUES_DE_LA_BARRE` (`./constructions.ts`) la porte, relevée bouton par
 * bouton sur la maquette. La garde reste : une marque que le schéma ne porterait
 * pas est sautée plutôt que de casser le montage de l'éditeur entier, et le
 * bouton le DIT alors au journal au lieu de faire semblant.
 */
function marquesDeLaBarre(): Record<string, Command> {
	const table: Record<string, Command> = {};
	for (const { cle, marque } of MARQUES_DE_LA_BARRE) {
		if (schema.marks[marque] === undefined) continue;
		table[cle] = toggleMark(marqueDeSchema(marque));
	}
	return table;
}

/** Les trois attributs par lesquels le gel nomme un bouton — voir plus haut. */
type AttributDeBouton = 'cmd' | 'bloc' | 'mark';

/**
 * LES TROIS TABLES, UNE PAR ATTRIBUT — et ce n'est pas une élégance.
 *
 * Une table unique confondait `code`, ET C'ÉTAIT MESURABLE : `data-bloc="code"`
 * (le bloc de code) et `data-mark="code"` (le code en ligne) portent la MÊME
 * clé au gel, sur deux boutons voisins de la même barre. Fondues dans un seul
 * objet, la seconde écrasait la première selon l'ordre d'écriture — cliquer
 * « Code en ligne » transformait le paragraphe entier en bloc préformaté.
 * Relevé au navigateur, pas déduit.
 *
 * Chaque bouton est donc cherché DANS LA TABLE DE SON ATTRIBUT, et dans
 * aucune autre.
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

/* ═══════════════════════════════════ Les vues en propre ═════════════════ */

/**
 * LES CONSTRUCTIONS ÉCRITES EN PROPRE N'ONT PAS DE `toDOM`, ET C'EST VOULU —
 * mais il fallait alors leur donner une VUE.
 *
 * `./schema.ts` déclare `alerte`, `diagramme` et les marques `lienInterne` et
 * `highlight` sans règle de sérialisation vers le DOM : le format canonique est
 * du JSON, et `../contenu/rendu.ts` est l'implémentation UNIQUE du rendu
 * (`ADR-004`) — poser un second `toDOM` dans le schéma en ferait une deuxième,
 * qui divergerait.
 *
 * Conséquence non prévue, et MESURÉE au navigateur : ProseMirror, lui, a besoin
 * d'une représentation pour AFFICHER un nœud dans la zone éditable. Sans elle,
 * insérer une alerte levait « node.type.spec.toDOM is not a function » et
 * l'écran cassait — les trois entrées d'alerte du menu étendu et le lien interne
 * n'étaient donc pas inertes, ils étaient DESTRUCTEURS.
 *
 * La représentation est donnée ici, en `nodeViews` / `markViews` — du
 * COMPORTEMENT d'éditeur, à sa place —, et elle reprend le balisage de
 * `rendu.ts` classe pour classe : la feuille gelée s'y applique donc telle
 * quelle, et l'édition montre ce que la lecture montrera.
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
 * LE TABLEAU A UNE VUE PARCE QUE CELLE DU SCHÉMA LE REND INVISIBLE — mesuré :
 * une largeur en ligne de zéro pixel et un groupe de colonnes vide, un tableau
 * de 72 × 78 pixels qu'aucune capture d'écran ne montrait.
 *
 * La cause est dans l'extension : son `toDOM` somme l'attribut `colwidth` de
 * chaque cellule pour écrire la largeur du tableau, et le format ne porte pas
 * cet attribut de confort (`./schema.ts`). La somme vaut zéro, et zéro en ligne
 * bat la largeur pleine de la feuille gelée.
 *
 * La vue reprend le balisage du gel (`V-17:3075`) : la boîte à défilement
 * horizontal, le tableau, le corps. Aucune largeur n'est écrite — c'est la
 * feuille gelée qui la donne, comme en lecture. Les rangées vivent toutes dans
 * le corps, ligne d'en-tête comprise : une vue n'a qu'un seul contenu, et
 * ProseMirror ne sait pas le couper en deux. Les cellules d'en-tête restent des
 * cellules d'en-tête, avec leur mise en forme de cellule.
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

/** Ce qu'une vue reçoit — le strict nécessaire, sans importer le type complet. */
interface NoeudDeVue {
	readonly attrs: Record<string, unknown>;
}
interface MarqueDeVue {
	readonly attrs: Record<string, unknown>;
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

	/* La zone du gel DEVIENT la zone éditable — voir l'en-tête, option `mount`.
	   Son contenu d'origine est remplacé par le document. */
	/* `mount` EST UNE OPTION RÉELLE DE `EditorView` — c'est elle qui fait de la
	   zone du gel la zone éditable, au lieu d'en créer une à l'intérieur. Elle
	   n'est pas déclarée dans le type public de `DirectEditorProps`, d'où
	   l'élargissement local : c'est la seule entorse de ce fichier, et elle est
	   nommée plutôt que tue. */
	const vue: EditorView = new EditorView({ mount: zone } as unknown as HTMLElement, {
		state: etat,
		/* Voir « LES TROIS CONSTRUCTIONS ÉCRITES EN PROPRE ». Les signatures de
		   ProseMirror passent bien plus que ce que ces trois vues lisent ; le
		   rétrécissement est local et nommé, plutôt que d'importer trois types
		   pour ignorer leurs champs. */
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
			/* `data-vide` commande le seul rendu visible du vide — l'invite
			   d'amorçage que la feuille gelée écrit en `::before`. Le gel le
			   CALCULE lui aussi ; il est déduit, jamais déclaré. */
			zone.setAttribute('data-vide', vue.state.doc.textContent.trim() === '' ? 'oui' : 'non');
			/* Le témoin de sauvegarde ne bouge que si le DOCUMENT a bougé : un
			   simple déplacement du point d'insertion n'est pas une modification,
			   et le faire passer pour telle ferait réclamer un enregistrement à qui
			   n'a rien écrit. */
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
		 * L'INSERTION D'UN DOCUMENT ENTIER — le squelette d'un gabarit (V-17), le
		 * plan repris de la Référence (V-18).
		 *
		 * Ce sont les BLOCS du document qui sont insérés, jamais le nœud `doc`
		 * lui-même : `doc` n'est admis nulle part dans un document, et le poser
		 * ferait lever ProseMirror au lieu d'écrire. Le document passe d'abord par
		 * `noeudDepuisDocument()`, la porte unique — un gabarit mal formé est
		 * refusé ici, avant d'entrer, jamais réparé (`ADR-003`).
		 */
		inserer: (document: Document) => {
			const noeud = noeudDepuisDocument(document);
			const tranche = new Slice(noeud.content, 0, 0);
			vue.dispatch(vue.state.tr.replaceSelection(tranche).scrollIntoView());
			vue.focus();
		},
		vide: () => vue.state.doc.textContent.trim() === '',
		detruire: () => {
			racine.removeEventListener('mousedown', auMousedown);
			racine.removeEventListener('click', auClic);
			vue.destroy();
		}
	};
}
