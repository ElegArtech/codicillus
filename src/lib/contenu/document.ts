/**
 * Le format canonique du contenu d'une note — L'IMPLÉMENTATION UNIQUE. `ADR-003` : « le
 * corps d'une note est conservé en document ProseMirror sérialisé en JSON, dans une
 * colonne `jsonb` ». Ce module EST ce format : le schéma, la validation qui refuse ce qui
 * est mal formé, et les formes qu'on en dérive sans le reconstruire.
 *
 * LES NOMS DE NŒUDS SONT EN ANGLAIS parce qu'ils sont imposés par les extensions TipTap
 * que `STACK` §4.3 arrête. Les trois nœuds écrits en propre par `ADR-003` n'ont aucun nom
 * imposé et portent le nom français de la décision : `alerte`, `diagramme`, `lienInterne`.
 *
 * LES SEPT RÈGLES DE FORME CANONIQUE — un document mal formé est REJETÉ, jamais
 * silencieusement réparé :
 *
 *  1. AUCUN TABLEAU VIDE. `content: []` et `marks: []` sont refusés : l'absence s'écrit
 *     par l'absence de la clé. Deux écritures pour le même document ruineraient
 *     l'identité de l'aller-retour.
 *  2. ATTRIBUTS TOTAUX. Tout attribut déclaré est présent, une valeur absente s'écrit
 *     `null` — c'est aussi ce qu'émet `Node.toJSON` de ProseMirror.
 *  3. AUCUN NŒUD DE TEXTE VIDE, et aucun texte consécutif portant les mêmes marques :
 *     ProseMirror fusionne, donc deux écritures existeraient (voir 1).
 *  4. AUCUN RETOUR À LA LIGNE dans un texte hors bloc de code : le format ne porte pas de
 *     saut de ligne dur.
 *  5. AUCUN RETOUR CHARIOT, OÙ QUE CE SOIT (`ARB-056`). `RG-M04-05` exige de la copie d'un
 *     bloc de code « exactement ce que l'utilisateur collera dans son terminal » : la
 *     règle est tenue par REFUS À L'ENTRÉE. Le motif ne s'arrête pas au code — un « \r »
 *     invisible dans un titre se propage au texte brut, à l'index et au diff. L'hygiène de
 *     fin de ligne appartient à la FRONTIÈRE DU FICHIER, donc à l'import.
 *  6. MARQUES EXCLUSIVES : `code` exclut toute autre marque, un texte ne porte pas deux
 *     marques de même type, et jamais un lien interne ET un externe.
 *  7. LES MARQUES SONT DANS L'ORDRE DE DÉCLARATION DU TYPE `Marque` (`ARB-056`) :
 *     `[bold, italic]` et `[italic, bold]` sont deux JSON différents, or ProseMirror trie
 *     par rang de schéma. Le schéma REFUSE tout autre ordre, il ne réordonne pas —
 *     réordonner ferait de la validation une NORMALISATION.
 */
import { z } from 'zod';

export type NiveauDAlerte = 'astuce' | 'attention' | 'danger';

export type Marque =
	| { readonly type: 'bold' }
	| { readonly type: 'italic' }
	| { readonly type: 'underline' }
	| { readonly type: 'strike' }
	| { readonly type: 'highlight' }
	| { readonly type: 'code' }
	/** Lien externe. `target` et `rel` sont du RENDU, pas du document. */
	| { readonly type: 'link'; readonly attrs: { readonly href: string } }
	/**
	 * Lien interne. `ADR-003` : il porte l'IDENTIFIANT de la note cible, jamais son
	 * titre — c'est ce qui le rend insensible au renommage et permet de le signaler
	 * cassé si la cible disparaît.
	 */
	| { readonly type: 'lienInterne'; readonly attrs: { readonly cible: string } };

export interface Texte {
	readonly type: 'text';
	readonly text: string;
	readonly marks?: readonly Marque[] | undefined;
}

export interface Paragraphe {
	readonly type: 'paragraph';
	readonly content?: readonly Texte[] | undefined;
}

export interface Titre {
	readonly type: 'heading';
	readonly attrs: {
		readonly level: 1 | 2 | 3 | 4 | 5 | 6;
		/**
		 * L'ancre du titre, cible du sommaire (M04.5). Elle est STOCKÉE et non dérivée : le gel
		 * écrit `id="s-avant"` sur « Avant de commencer », qu'aucune translittération ne
		 * produit, et une ancre dérivée du texte casserait tous les liens au premier renommage.
		 */
		readonly ancre: string | null;
	};
	readonly content?: readonly Texte[] | undefined;
}

export interface BlocDeCode {
	readonly type: 'codeBlock';
	/** Le langage affiché en tête du bloc (M04.6). `null` : aucun. */
	readonly attrs: { readonly language: string | null };
	readonly content?: readonly Texte[] | undefined;
}

export interface ListeAPuces {
	readonly type: 'bulletList';
	readonly content: readonly ElementDeListe[];
}

export interface ListeNumerotee {
	readonly type: 'orderedList';
	readonly content: readonly ElementDeListe[];
}

export interface ElementDeListe {
	readonly type: 'listItem';
	readonly content: readonly Bloc[];
}

export interface ListeDeTaches {
	readonly type: 'taskList';
	readonly content: readonly Tache[];
}

export interface Tache {
	readonly type: 'taskItem';
	/** M04.6 : « cases à cocher, en lecture seule ». */
	readonly attrs: { readonly checked: boolean };
	readonly content: readonly Bloc[];
}

export interface Citation {
	readonly type: 'blockquote';
	/**
	 * L'attribution, rendue en `<footer>`. ProseMirror ne connaît pas cet attribut :
	 * il est ajouté ici parce que le gel l'écrit.
	 */
	readonly attrs: { readonly attribution: string | null };
	readonly content: readonly Bloc[];
}

export interface Alerte {
	readonly type: 'alerte';
	readonly attrs: {
		readonly niveau: NiveauDAlerte;
		/**
		 * Le glyphe textuel en capitales : « les trois niveaux d'alerte portent un glyphe
		 * textuel en capitales (ASTUCE, ATTENTION, DANGER) : la couleur ne fait que répéter »
		 * (`RG-M18-09`). IL EST STOCKÉ, ET CE N'EST PAS UN CONFORT : le gel écrit deux glyphes
		 * qui ne sont PAS le nom du niveau — `REGISTRE` et `EN BREF`, tous deux sur une alerte
		 * `astuce`. Le dériver du niveau rendrait ces deux alertes fausses.
		 */
		readonly glyphe: string;
		readonly titre: string;
	};
	readonly content: readonly Bloc[];
}

export interface Tableau {
	readonly type: 'table';
	readonly content: readonly LigneDeTableau[];
}

export interface LigneDeTableau {
	readonly type: 'tableRow';
	readonly content: readonly (CelluleDEntete | Cellule)[];
}

export interface CelluleDEntete {
	readonly type: 'tableHeader';
	readonly content: readonly Bloc[];
}

export interface Cellule {
	readonly type: 'tableCell';
	/** `td.num` de l'inventaire fermé (DESIGN.md §B-9) : cellule de chiffres. */
	readonly attrs: { readonly numerique: boolean };
	readonly content: readonly Bloc[];
}

/**
 * L'image — et ses attributs viennent du gel, non de TipTap : l'extension porte `src`,
 * `alt` et `title`, quand le gel rend une image dans une FIGURE dont la légende est en
 * deux parties, un libellé en gras et un texte. Un seul `title` ne sait pas porter les deux.
 */
export interface Image {
	readonly type: 'image';
	readonly attrs: {
		readonly src: string;
		/** P-06 : alternative textuelle sur tout contenu graphique. Non vide. */
		readonly alt: string;
		/** Le libellé de la légende — « Figure », « Schéma 1 ». `null` : aucun. */
		readonly etiquette: string | null;
		/** Le texte de la légende. `null` : aucune. */
		readonly legende: string | null;
	};
}

export interface Separateur {
	readonly type: 'horizontalRule';
}

export interface Diagramme {
	readonly type: 'diagramme';
	readonly attrs: {
		readonly source: string;
		/**
		 * Le seul moteur de la pile (`STACK` : « Mermaid, rendu des diagrammes
		 * décrits en texte »). Un autre langage est refusé : rien ne saurait le rendre.
		 */
		readonly langage: 'mermaid';
		/** P-06 / RG-M18-11 : la restitution exploitable sans le graphique. */
		readonly alternative: string;
		/** Le libellé de la légende — « Schéma 1 » du gel. `null` : aucun. */
		readonly etiquette: string | null;
		/** Le texte de la légende. `null` : aucune. */
		readonly legende: string | null;
	};
}

export type Bloc =
	| Paragraphe
	| Titre
	| BlocDeCode
	| ListeAPuces
	| ListeNumerotee
	| ListeDeTaches
	| Citation
	| Alerte
	| Tableau
	| Image
	| Separateur
	| Diagramme;

/** Le document — la racine, et la valeur de la colonne `jsonb`. */
export interface Document {
	readonly type: 'doc';
	readonly content: readonly Bloc[];
}

/**
 * Toute chaîne d'un document canonique passe par ici : les textes, mais aussi chaque
 * attribut porteur de caractères. C'est donc ici, et à un seul endroit, que se tient la
 * règle 5 — aucun retour chariot, où que ce soit.
 */
const texteNonVide = z
	.string()
	.min(1)
	.refine((t) => !t.includes('\r'), {
		error:
			'un retour chariot : aucun « \\r » n’entre dans un document canonique, où que ce soit — ' +
			'RG-M04-05 veut « exactement ce que l’utilisateur collera dans son terminal », et un ' +
			'« \\r » invisible se propagerait au texte brut, à l’index et au diff'
	});

/**
 * Un texte de contenu : ni vide, ni porteur d'un retour à la ligne. Règle 4 —
 * le format ne porte pas de saut de ligne dur.
 */
const texteEnLigne = texteNonVide.refine((t) => !t.includes('\n'), {
	error: 'un retour à la ligne dans un texte : le format ne porte pas de saut de ligne dur'
});

const schemaMarque = z.discriminatedUnion(
	'type',
	[
		z.strictObject({ type: z.literal('bold') }),
		z.strictObject({ type: z.literal('italic') }),
		z.strictObject({ type: z.literal('underline') }),
		z.strictObject({ type: z.literal('strike') }),
		z.strictObject({ type: z.literal('highlight') }),
		z.strictObject({ type: z.literal('code') }),
		z.strictObject({
			type: z.literal('link'),
			attrs: z.strictObject({ href: texteNonVide })
		}),
		z.strictObject({
			type: z.literal('lienInterne'),
			attrs: z.strictObject({ cible: texteNonVide })
		})
	],
	{ error: () => 'marque inconnue' }
);

/**
 * Le rang d'une marque — règle 7 (`ARB-056`). Les rangs sont ceux de la DÉCLARATION DU
 * TYPE `Marque`, dans cet ordre et sans trou. Le type `Record<Marque['type'], number>`
 * fait qu'une neuvième marque ne compile pas tant qu'elle n'a pas son rang.
 *
 * EXPORTÉE POUR UNE SEULE RAISON : le schéma ProseMirror de l'éditeur doit déclarer ses
 * marques DANS CET ORDRE, ProseMirror triant par rang de schéma — un schéma ordonné
 * autrement émettrait des documents que la règle 7 refuse, refus juste et cause
 * introuvable. La table est LUE, jamais recopiée.
 */
export const RANG_DE_MARQUE: Readonly<Record<Marque['type'], number>> = {
	bold: 1,
	italic: 2,
	underline: 3,
	strike: 4,
	highlight: 5,
	code: 6,
	link: 7,
	lienInterne: 8
};

/** Règles 6 et 7 — les exclusions de marques et leur ordre, chacune avec son propre refus. */
const schemaMarques = z
	.array(schemaMarque)
	.min(1, { error: 'aucune marque vide : l’absence de marque s’écrit par l’absence de la clé' })
	.refine((m) => new Set(m.map((x) => x.type)).size === m.length, {
		error: 'deux marques de même type sur le même texte'
	})
	.refine((m) => m.length === 1 || !m.some((x) => x.type === 'code'), {
		error: 'la marque « code » exclut toute autre marque (ProseMirror : excludes)'
	})
	.refine((m) => !(m.some((x) => x.type === 'link') && m.some((x) => x.type === 'lienInterne')), {
		error: 'un texte ne porte pas à la fois un lien externe et un lien interne'
	})
	/* Règle 7 — l'ordre, et le REFUS plutôt que le tri. La comparaison est STRICTE :
	   deux marques de même rang sont deux marques de même type, que la règle 6
	   refuse déjà, et une égalité admise laisserait passer un ordre indécidable. */
	.refine(
		(m) => m.every((x, i) => i === 0 || RANG_DE_MARQUE[m[i - 1]!.type] < RANG_DE_MARQUE[x.type]),
		{
			error:
				'des marques hors de l’ordre de déclaration du type « Marque » : deux ordres seraient ' +
				'deux documents pour ce que ProseMirror n’écrit jamais qu’une fois — le schéma refuse, ' +
				'il ne réordonne pas'
		}
	);

const schemaTexte = z.strictObject({
	type: z.literal('text'),
	text: texteEnLigne,
	marks: schemaMarques.optional()
});

/**
 * Un texte de bloc de code : les retours à la ligne y sont le contenu même — c'est le seul
 * texte du format qui en porte —, et aucune marque n'y entre. Le retour chariot y est
 * refusé comme partout ailleurs (règle 5) : `RG-M04-05` est le motif de la règle, pas sa
 * borne.
 */
const schemaTexteDeCode = z.strictObject({
	type: z.literal('text'),
	text: texteNonVide
});

function marquesIdentiques(a: readonly Marque[] | undefined, b: readonly Marque[] | undefined) {
	return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

const schemaContenuEnLigne = z
	.array(schemaTexte)
	.min(1, { error: 'aucun contenu vide : l’absence de contenu s’écrit par l’absence de la clé' })
	.refine((t) => t.every((n, i) => i === 0 || !marquesIdentiques(n.marks, t[i - 1]?.marks)), {
		error: 'deux textes consécutifs de mêmes marques : ProseMirror les fusionne'
	});

/**
 * Les blocs, et leur récursion. `z.lazy` est la seule façon de décrire un arbre :
 * un élément de liste contient des blocs, qui contiennent des listes.
 */
const schemaBloc: z.ZodType<Bloc> = z.lazy(() =>
	z.discriminatedUnion(
		'type',
		[
			schemaParagraphe,
			schemaTitre,
			schemaBlocDeCode,
			schemaListeAPuces,
			schemaListeNumerotee,
			schemaListeDeTaches,
			schemaCitation,
			schemaAlerte,
			schemaTableau,
			schemaImage,
			schemaSeparateur,
			schemaDiagramme
		],
		{ error: () => 'nœud inconnu' }
	)
);

const schemaContenuDeBlocs = z
	.array(schemaBloc)
	.min(1, { error: 'aucun contenu vide : l’absence de contenu s’écrit par l’absence de la clé' });

const schemaParagraphe = z.strictObject({
	type: z.literal('paragraph'),
	content: schemaContenuEnLigne.optional()
});

const schemaTitre = z.strictObject({
	type: z.literal('heading'),
	attrs: z.strictObject({
		level: z.literal([1, 2, 3, 4, 5, 6]),
		ancre: texteNonVide.nullable()
	}),
	content: schemaContenuEnLigne.optional()
});

const schemaBlocDeCode = z.strictObject({
	type: z.literal('codeBlock'),
	attrs: z.strictObject({ language: texteNonVide.nullable() }),
	content: z
		.array(schemaTexteDeCode)
		.min(1, { error: 'aucun contenu vide : l’absence de contenu s’écrit par l’absence de la clé' })
		.optional()
});

const schemaElementDeListe = z.strictObject({
	type: z.literal('listItem'),
	content: schemaContenuDeBlocs
});

const schemaListeAPuces = z.strictObject({
	type: z.literal('bulletList'),
	content: z.array(schemaElementDeListe).min(1, { error: 'une liste sans élément' })
});

const schemaListeNumerotee = z.strictObject({
	type: z.literal('orderedList'),
	content: z.array(schemaElementDeListe).min(1, { error: 'une liste sans élément' })
});

const schemaTache = z.strictObject({
	type: z.literal('taskItem'),
	attrs: z.strictObject({ checked: z.boolean() }),
	content: schemaContenuDeBlocs
});

const schemaListeDeTaches = z.strictObject({
	type: z.literal('taskList'),
	content: z.array(schemaTache).min(1, { error: 'une liste de tâches sans tâche' })
});

const schemaCitation = z.strictObject({
	type: z.literal('blockquote'),
	attrs: z.strictObject({ attribution: texteNonVide.nullable() }),
	content: schemaContenuDeBlocs
});

/**
 * Le contenu d'une alerte : des blocs, SAUF une alerte. Le gel n'en imbrique aucune
 * et DESIGN.md ne donne aucun rendu à une alerte imbriquée — une construction sans
 * rendu n'est pas une construction.
 */
const schemaContenuDAlerte = z
	.array(schemaBloc)
	.min(1, { error: 'aucun contenu vide : l’absence de contenu s’écrit par l’absence de la clé' })
	.refine((blocs) => !blocs.some((b) => b.type === 'alerte'), {
		error: 'une alerte dans une alerte : imbrication interdite, le gel n’en donne aucun rendu'
	});

const schemaAlerte = z.strictObject({
	type: z.literal('alerte'),
	attrs: z.strictObject({
		niveau: z.enum(['astuce', 'attention', 'danger']),
		glyphe: texteNonVide,
		titre: texteNonVide
	}),
	content: schemaContenuDAlerte
});

const schemaCelluleDEntete = z.strictObject({
	type: z.literal('tableHeader'),
	content: schemaContenuDeBlocs
});

const schemaCellule = z.strictObject({
	type: z.literal('tableCell'),
	attrs: z.strictObject({ numerique: z.boolean() }),
	content: schemaContenuDeBlocs
});

const schemaLigneDeTableau = z.strictObject({
	type: z.literal('tableRow'),
	content: z
		.array(
			z.discriminatedUnion('type', [schemaCelluleDEntete, schemaCellule], {
				error: () => 'nœud inconnu dans une ligne de tableau'
			})
		)
		.min(1, { error: 'une ligne de tableau sans cellule' })
});

const schemaTableau = z.strictObject({
	type: z.literal('table'),
	content: z.array(schemaLigneDeTableau).min(1, { error: 'un tableau sans ligne' })
});

const schemaImage = z.strictObject({
	type: z.literal('image'),
	attrs: z.strictObject({
		src: texteNonVide,
		alt: texteNonVide,
		etiquette: texteNonVide.nullable(),
		legende: texteNonVide.nullable()
	})
});

const schemaSeparateur = z.strictObject({ type: z.literal('horizontalRule') });

const schemaDiagramme = z.strictObject({
	type: z.literal('diagramme'),
	attrs: z.strictObject({
		source: texteNonVide,
		langage: z.literal('mermaid'),
		alternative: texteNonVide,
		etiquette: texteNonVide.nullable(),
		legende: texteNonVide.nullable()
	})
});

/** LE SCHÉMA DU DOCUMENT. Il n'en existe pas d'autre dans le produit. */
export const schemaDocument = z.strictObject({
	type: z.literal('doc'),
	content: schemaContenuDeBlocs
});

export interface Manquement {
	readonly chemin: string;
	readonly message: string;
}

/** Le refus. Il porte tous les manquements, pas seulement le premier. */
export class DocumentInvalide extends Error {
	readonly manquements: readonly Manquement[];

	constructor(manquements: readonly Manquement[]) {
		super(
			`document de note invalide — ${manquements.length} manquement(s) :\n` +
				manquements.map((m) => `  ${m.chemin} : ${m.message}`).join('\n')
		);
		this.name = 'DocumentInvalide';
		this.manquements = manquements;
	}
}

function cheminDe(parties: readonly PropertyKey[]): string {
	if (parties.length === 0) return 'document';
	return parties
		.map((p) => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`))
		.join('')
		.replace(/^\./, '');
}

/**
 * Le message français d'un manquement. Les messages de `zod` sont en anglais et
 * décrivent le TYPE attendu ; ceux-ci décrivent la RÈGLE violée, qui est ce qu'un
 * rapport de refus doit dire.
 */
function messageDe(issue: z.core.$ZodIssue): string {
	switch (issue.code) {
		case 'unrecognized_keys':
			return `attribut inconnu : ${issue.keys.map((k) => `« ${k} »`).join(', ')}`;
		case 'invalid_type':
			return issue.input === undefined ? 'attribut manquant' : `type invalide : ${issue.message}`;
		case 'too_small':
			return issue.message;
		case 'invalid_value':
			return `valeur hors du domaine admis : ${issue.message}`;
		case 'invalid_union':
			/* Les seules unions du schéma sont discriminées, et chacune porte son propre
			   message. Le redire ici l'effacerait. */
			return issue.message;
		default:
			return issue.message;
	}
}

export type Verdict =
	| { readonly valide: true; readonly document: Document }
	| { readonly valide: false; readonly manquements: readonly Manquement[] };

export function verifierDocument(valeur: unknown): Verdict {
	const issu = schemaDocument.safeParse(valeur);
	if (issu.success) return { valide: true, document: issu.data as Document };
	return {
		valide: false,
		manquements: issu.error.issues.map((i) => ({
			chemin: cheminDe(i.path),
			message: messageDe(i)
		}))
	};
}

/**
 * L'entrée unique du format. Tout ce qui lit un corps de note passe par ici : le rendu,
 * l'écriture en base, l'export, l'indexation. `ADR-003` interdit « toute écriture directe
 * en base d'un document non validé par le schéma ProseMirror ».
 *
 * @throws DocumentInvalide — jamais un document réparé.
 */
export function analyserDocument(valeur: unknown): Document {
	const verdict = verifierDocument(valeur);
	if (!verdict.valide) throw new DocumentInvalide(verdict.manquements);
	return verdict.document;
}

export interface Construction {
	readonly numero: number;
	readonly libelle: string;
	readonly porteurs: readonly string[];
	readonly signature: readonly string[];
}

/**
 * Les quinze constructions, dans l'ordre du tableau de M04.6. Le tableau du cahier
 * compte quinze lignes, ce catalogue aussi, et `document.test.ts` le vérifie.
 */
export const CONSTRUCTIONS: readonly Construction[] = [
	{
		numero: 1,
		libelle: 'Titres (6 niveaux)',
		porteurs: ['heading'],
		signature: ['<h2', '<h3', '<h4', '<h5', '<h6']
	},
	{
		numero: 2,
		libelle: 'Paragraphes, gras, italique, souligné, barré, surligné',
		porteurs: ['paragraph', 'bold', 'italic', 'underline', 'strike', 'highlight'],
		signature: ['<p>', '<strong>', '<em>', '<u>', '<s>', '<mark>']
	},
	{ numero: 3, libelle: 'Code en ligne', porteurs: ['code'], signature: ['<code>'] },
	{
		numero: 4,
		libelle: 'Bloc de code',
		porteurs: ['codeBlock'],
		signature: ['class="bloc-code"', 'class="bloc-code__tete"', 'btn-copier', '<pre><code>']
	},
	{
		numero: 5,
		libelle: 'Listes à puces, numérotées, imbriquées',
		porteurs: ['bulletList', 'orderedList', 'listItem'],
		signature: ['<ul>', '<ol>', '<li>']
	},
	{
		numero: 6,
		libelle: 'Listes de tâches',
		porteurs: ['taskList', 'taskItem'],
		signature: ['class="taches"', 'type="checkbox"', 'disabled']
	},
	{
		numero: 7,
		libelle: 'Citations',
		porteurs: ['blockquote'],
		signature: ['class="prose-cit"', '<footer>']
	},
	{
		numero: 8,
		libelle: 'Blocs d’alerte',
		porteurs: ['alerte'],
		signature: [
			'class="alerte alerte--astuce"',
			'class="alerte alerte--attention"',
			'class="alerte alerte--danger"',
			'class="alerte__glyphe"'
		]
	},
	{
		numero: 9,
		libelle: 'Tableaux',
		porteurs: ['table', 'tableRow', 'tableHeader', 'tableCell'],
		signature: ['class="tableau-boite"', '<thead>', '<tbody>', '<th>', '<td class="num">']
	},
	{ numero: 10, libelle: 'Images', porteurs: ['image'], signature: ['<img'] },
	{ numero: 11, libelle: 'Séparateurs', porteurs: ['horizontalRule'], signature: ['<hr>'] },
	{
		numero: 12,
		libelle: 'Diagrammes',
		porteurs: ['diagramme'],
		signature: ['class="figure"', 'class="figure__cadre"', '<figcaption>']
	},
	{
		numero: 13,
		libelle: 'Liens internes',
		porteurs: ['lienInterne'],
		signature: ['class="lien-int"']
	},
	{
		numero: 14,
		libelle: 'Liens cassés',
		porteurs: ['lienInterne'],
		signature: ['class="lien-casse"']
	},
	{
		numero: 15,
		libelle: 'Liens externes',
		porteurs: ['link'],
		signature: ['class="lien-ext"', 'rel="noopener"']
	}
];

export type Conteneur = ElementDeListe | Tache | LigneDeTableau | CelluleDEntete | Cellule;

/** Tout ce qui peut se trouver dans un `content`. */
export type NoeudDeContenu = Bloc | Conteneur | Texte;

const CONTENEURS = ['listItem', 'taskItem', 'tableRow', 'tableCell', 'tableHeader'] as const;

function estConteneur(noeud: NoeudDeContenu): noeud is Conteneur {
	return (CONTENEURS as readonly string[]).includes(noeud.type);
}

function enfantsDe(noeud: Document | NoeudDeContenu): readonly NoeudDeContenu[] {
	if (!('content' in noeud)) return [];
	return noeud.content ?? [];
}

/**
 * `ADR-003` interdit « toute manipulation du corps par expression régulière ou par
 * transformation de chaîne » : la réécriture de liens, le sommaire et les rétroliens se
 * font par PARCOURS DE L'ARBRE, et il est ici. Il rend les BLOCS dans l'ordre du document.
 */
export function* parcourir(noeud: Document | NoeudDeContenu): Generator<Bloc> {
	for (const enfant of enfantsDe(noeud)) {
		if (enfant.type === 'text') continue;
		if (estConteneur(enfant)) {
			yield* parcourir(enfant);
			continue;
		}
		yield enfant;
		yield* parcourir(enfant);
	}
}

export function* textes(noeud: Document | NoeudDeContenu): Generator<Texte> {
	for (const enfant of enfantsDe(noeud)) {
		if (enfant.type === 'text') yield enfant;
		else yield* textes(enfant);
	}
}

export function titres(document: Document): readonly Titre[] {
	return [...parcourir(document)].filter((b): b is Titre => b.type === 'heading');
}

/**
 * Les identifiants de notes cités par le document. Matière des rétroliens
 * (RG-M05-02), « recalculés à chaque enregistrement par parcours de l'arbre ».
 * L'ordre est celui du document, les répétitions sont retirées.
 */
export function liensInternes(document: Document): readonly string[] {
	const vus: string[] = [];
	for (const t of textes(document)) {
		for (const m of t.marks ?? []) {
			if (m.type === 'lienInterne' && !vus.includes(m.attrs.cible)) vus.push(m.attrs.cible);
		}
	}
	return vus;
}

/**
 * Le texte brut — la forme dérivée qu'`ADR-003` produit « à l'enregistrement » pour
 * l'indexation, les extraits et la détection de doublon. Une ligne par bloc, et RIEN QUI NE
 * SOIT PAS LU : le glyphe et le titre d'une alerte en font partie, l'attribution d'une
 * citation aussi, l'alternative d'un diagramme et le texte de remplacement d'une image
 * également — ce sont eux que `P-06` rend lisibles quand le graphique ne l'est pas.
 */
export function texteBrut(document: Document): string {
	return document.content.flatMap(lignesDeBloc).join('\n');
}

function texteEnLigne_(contenu: readonly Texte[] | undefined): string {
	return (contenu ?? []).map((t) => t.text).join('');
}

function lignesDeBloc(bloc: Bloc): readonly string[] {
	switch (bloc.type) {
		case 'paragraph':
		case 'heading':
		case 'codeBlock':
			return [texteEnLigne_(bloc.content)];
		case 'bulletList':
		case 'orderedList':
			return bloc.content.flatMap((e) => e.content.flatMap(lignesDeBloc));
		case 'taskList':
			return bloc.content.flatMap((t) => t.content.flatMap(lignesDeBloc));
		case 'blockquote':
			return [
				...bloc.content.flatMap(lignesDeBloc),
				...(bloc.attrs.attribution === null ? [] : [bloc.attrs.attribution])
			];
		case 'alerte':
			return [`${bloc.attrs.glyphe} ${bloc.attrs.titre}`, ...bloc.content.flatMap(lignesDeBloc)];
		case 'table':
			return bloc.content.flatMap((ligne) =>
				ligne.content.flatMap((cellule) => cellule.content.flatMap(lignesDeBloc))
			);
		case 'image':
			return [
				bloc.attrs.alt,
				...(bloc.attrs.etiquette === null ? [] : [bloc.attrs.etiquette]),
				...(bloc.attrs.legende === null ? [] : [bloc.attrs.legende])
			];
		case 'diagramme':
			return [
				bloc.attrs.alternative,
				...(bloc.attrs.etiquette === null ? [] : [bloc.attrs.etiquette]),
				...(bloc.attrs.legende === null ? [] : [bloc.attrs.legende])
			];
		case 'horizontalRule':
			return [];
	}
}

/**
 * Le texte copié d'un bloc de code — `RG-M04-05` : « un texte brut, sans caractère parasite
 * […] exactement ce que l'utilisateur collera dans son terminal ». La fonction ne nettoie
 * RIEN, et c'est le point : le format refuse déjà le retour chariot à l'entrée (règle 5) et
 * ne sait pas porter un numéro de ligne. Un nettoyage ici masquerait un document faux.
 */
export function texteDeCopie(bloc: BlocDeCode): string {
	return (bloc.content ?? []).map((t) => t.text).join('');
}
