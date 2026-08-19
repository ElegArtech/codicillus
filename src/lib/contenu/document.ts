/**
 * LE FORMAT CANONIQUE DU CONTENU D'UNE NOTE — L'IMPLÉMENTATION UNIQUE.
 *
 * ADR-003, acceptée le 18 août 2026 : « le corps d'une note est conservé en
 * document ProseMirror sérialisé en JSON, dans une colonne `jsonb`. C'est le
 * format canonique. » Ce module EST ce format : le schéma qui le décrit, la
 * validation qui le refuse quand il est mal formé, et les formes qu'on en
 * dérive sans le reconstruire.
 *
 * Le rendu HTML vit à côté (`rendu.ts`) et N'A PAS d'autre entrée que
 * `analyserDocument` : aucun document non validé n'est rendu, aucun second
 * schéma ne circule. C'est la même exigence structurelle que P-01 pour la
 * fraîcheur, et `src/lib/fraicheur.ts` en est le modèle de tenue.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * PROVENANCE — CE QUI EST LU, ET OÙ
 *
 *   `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` §M04.6 (l. 580-605) — le
 *   tableau des constructions, l. 584-600, et `RG-M04-05` (copie d'un bloc de
 *   code). Recompté ligne à ligne sur le fichier : en-tête l. 584, filet
 *   l. 585, puis QUINZE lignes de données, l. 586 à 600. Ni plus, ni moins.
 *
 *   `cadrage/STACK-TECHNIQUE.md` §4.3 (l. 254-273, extensions l. 270) — les extensions TipTap
 *   employées, et les TROIS nœuds écrits en propre : bloc d'alerte, bloc de
 *   diagramme, lien interne portant l'identifiant de la cible.
 *
 *   `docs/DESIGN.md` §B-9 « Contenu rédigé » (l. 851-871) — l'inventaire FERMÉ
 *   des classes du corps rédigé, et la règle du glyphe textuel en capitales.
 *
 *   `mockups/V-14-lecture-note.html:1524-1753` et
 *   `mockups/V-03-lecture-publique.html:984-1102` — le contenu rédigé réel du
 *   gel, seule source légitime de document de démonstration (voir
 *   `documents-du-gel.ts`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LES NOMS DE NŒUDS SONT EN ANGLAIS, ET TROIS SEULEMENT EN FRANÇAIS
 *
 * Le vocabulaire contractuel du §2.3 du brief porte sur DOUZE termes du
 * produit — note, fiche, registre, univers… — et aucun d'eux ne nomme un nœud
 * de document. Le nom d'un nœud, lui, est imposé par ailleurs : STACK §4.3
 * arrête les extensions TipTap employées, et une extension émet le nom de nœud
 * qu'elle déclare (`paragraph`, `heading`, `bulletList`, `taskItem`…).
 * Renommer ces nœuds obligerait à réécrire chaque extension en propre — c'est
 * exactement ce que la pile a choisi de ne pas faire.
 *
 * Les trois nœuds écrits en propre par ADR-003 n'ont, eux, aucun nom imposé :
 * ils portent le nom français de la décision — `alerte`, `diagramme`,
 * `lienInterne`. L'API TypeScript autour du format est française de bout en
 * bout.
 *
 * `src/lib/base/semence.ts` (T-010) écrivait déjà `doc` / `paragraph` / `text` :
 * ce choix ne rouvre rien, il constate.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SIX RÈGLES DE FORME CANONIQUE, ET CE QU'ELLES PROTÈGENT
 *
 * « Schéma refusant l'invalide » (critère de sortie de T-014) veut dire qu'un
 * document mal formé est REJETÉ, jamais silencieusement réparé. Six règles
 * s'ajoutent au typage des nœuds, et chacune protège une propriété nommée :
 *
 *  1. AUCUN TABLEAU VIDE. `content: []` et `marks: []` sont refusés :
 *     l'absence s'écrit par l'absence de la clé. Deux écritures pour le même
 *     document ruineraient l'identité de l'aller-retour de C-04 — la batterie 4
 *     serait verte sans rien prouver.
 *  2. ATTRIBUTS TOTAUX. Tout attribut déclaré est présent ; une valeur absente
 *     s'écrit `null`. Un attribut manquant est un refus, jamais un défaut
 *     silencieux. C'est aussi ce qu'émet `Node.toJSON` de ProseMirror.
 *  3. AUCUN NŒUD DE TEXTE VIDE, et aucun texte consécutif portant les mêmes
 *     marques : ProseMirror fusionne, donc deux écritures existeraient pour le
 *     même document (voir 1).
 *  4. AUCUN RETOUR À LA LIGNE dans un texte hors bloc de code. Le format ne
 *     porte pas de saut de ligne dur (`hardBreak` n'est pas des quinze
 *     constructions) : un « \n » y serait une construction clandestine.
 *  5. AUCUN RETOUR CHARIOT (« \r ») dans un bloc de code. `RG-M04-05` exige que
 *     la copie donne « exactement ce que l'utilisateur collera dans son
 *     terminal » : la règle est tenue par REFUS À L'ENTRÉE, pas par nettoyage
 *     à la copie — un nettoyage serait une réparation silencieuse, et le
 *     document stocké resterait faux.
 *  6. MARQUES EXCLUSIVES. `code` exclut toute autre marque (c'est
 *     `excludes: '_'` de ProseMirror), un texte ne porte pas deux marques de
 *     même type, et jamais un lien interne ET un lien externe.
 */
import { z } from 'zod';

/* ═══════════════════════════════════════════════ Les types ══════════════ */

/** Les trois niveaux d'alerte de M04.6. Aucun quatrième n'existe. */
export type NiveauDAlerte = 'astuce' | 'attention' | 'danger';

/** Une marque : ce qui s'applique à un fragment de texte, pas à un bloc. */
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
	 * Lien interne. ADR-003 : il porte l'IDENTIFIANT de la note cible, jamais
	 * son titre — c'est ce qui le rend insensible au renommage et ce qui permet
	 * de le signaler cassé si la cible disparaît.
	 */
	| { readonly type: 'lienInterne'; readonly attrs: { readonly cible: string } };

/** Un nœud de texte. Le seul nœud en ligne du format. */
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
		 * L'ancre du titre, cible du sommaire (M04.5). Elle est STOCKÉE et non
		 * dérivée : le gel écrit `id="s-avant"` sur « Avant de commencer »
		 * (`V-14:1528`) — aucune translittération du libellé ne produit cela, et
		 * une ancre dérivée du texte casserait tous les liens au premier
		 * renommage de titre.
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
	 * L'attribution, rendue en `<footer>` — `V-14:1685`, et la règle de style
	 * `blockquote.prose-cit footer` (`V-41:871`). ProseMirror ne connaît pas cet
	 * attribut : il est ajouté ici parce que le gel l'écrit.
	 */
	readonly attrs: { readonly attribution: string | null };
	readonly content: readonly Bloc[];
}

export interface Alerte {
	readonly type: 'alerte';
	readonly attrs: {
		readonly niveau: NiveauDAlerte;
		/**
		 * Le glyphe textuel en capitales. DESIGN.md §B-9 : « les trois niveaux
		 * d'alerte portent un glyphe textuel en capitales (ASTUCE, ATTENTION,
		 * DANGER) : la couleur ne fait que répéter (RG-M18-09) », et P-7.2 en
		 * fait un interdit détectable.
		 *
		 * IL EST STOCKÉ, ET CE N'EST PAS UN CONFORT : le gel écrit deux glyphes
		 * qui ne sont PAS le nom du niveau — `REGISTRE` (`V-14:1711`) et
		 * `EN BREF` (`V-03:1085`), tous deux sur une alerte de niveau `astuce`.
		 * Le dériver du niveau rendrait ces deux alertes fausses.
		 */
		readonly glyphe: string;
		/** La première ligne du bandeau, après le glyphe. */
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
 * L'IMAGE — et ses attributs viennent du gel, non de TipTap.
 *
 * L'extension `image` de la pile porte `src`, `alt` et `title`. Or le gel rend
 * une image dans une FIGURE, dont la légende est en deux parties : un libellé
 * en gras et un texte — `<figcaption><b>Figure</b><span>Légende</span>` au
 * catalogue de blocs de l'éditeur (`V-17:3076`), `<b>Schéma 1</b><span>…</span>`
 * en lecture (`V-14:1622`). Un seul `title` ne sait pas porter les deux.
 * L'ordre de préséance tranche : la maquette décide, la pile s'adapte.
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
		/** Le diagramme DÉCRIT EN TEXTE (M04.6). C'est lui qui est stocké. */
		readonly source: string;
		/**
		 * Le seul moteur de la pile — STACK-TECHNIQUE.md l. 159, « Mermaid
		 * 11.16.1, MIT, rendu des diagrammes décrits en texte ». Un autre
		 * langage est refusé : rien ne saurait le rendre.
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

/** Les douze natures de blocs. Aucune treizième n'existe. */
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

/* ═══════════════════════════════════════════════ Les schémas ════════════ */

const texteNonVide = z.string().min(1);

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

/** Règle 6 — les exclusions de marques, chacune avec son propre refus. */
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
	});

const schemaTexte = z.strictObject({
	type: z.literal('text'),
	text: texteEnLigne,
	marks: schemaMarques.optional()
});

/**
 * Un texte de bloc de code : les retours à la ligne y sont le contenu même, le
 * retour chariot y est refusé (règle 5, RG-M04-05), et aucune marque n'y entre
 * — ProseMirror déclare le contenu d'un bloc de code sans marques.
 */
const schemaTexteDeCode = z.strictObject({
	type: z.literal('text'),
	text: texteNonVide.refine((t) => !t.includes('\r'), {
		error:
			'un retour chariot dans un bloc de code : RG-M04-05 veut « exactement ce que ' +
			'l’utilisateur collera dans son terminal »'
	})
});

/** Règle 3 — deux textes consécutifs de mêmes marques sont une seconde écriture. */
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
 * LES BLOCS, ET LEUR RÉCURSION. `z.lazy` est la seule façon de décrire un
 * arbre : un élément de liste contient des blocs, qui contiennent des listes.
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
 * Le contenu d'une alerte : des blocs, SAUF une alerte. Le gel n'en imbrique
 * aucune et DESIGN.md §B-9 ne donne aucun rendu à une alerte imbriquée — une
 * construction sans rendu n'est pas une construction (P-3 du plan : ce qui ne
 * se rend pas ne se livre pas).
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

/* ═════════════════════════════════════════ Le refus de l'invalide ═══════ */

/** Un manquement, situé dans l'arbre. */
export interface Manquement {
	/** Le chemin du nœud fautif, tel qu'on le lirait dans le JSON. */
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
 * Le message français d'un manquement. Les messages de `zod` sont en anglais
 * et décrivent le TYPE attendu ; ceux-ci décrivent la RÈGLE violée, qui est ce
 * qu'un rapport de refus doit dire.
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
			/* Les seules unions du schéma sont discriminées, et chacune porte son
			   propre message — « nœud inconnu », « marque inconnue ». Le redire
			   ici l'effacerait. */
			return issue.message;
		default:
			return issue.message;
	}
}

/** Le verdict d'un contrôle, quand on ne veut pas de levée d'exception. */
export type Verdict =
	| { readonly valide: true; readonly document: Document }
	| { readonly valide: false; readonly manquements: readonly Manquement[] };

/**
 * LE CONTRÔLE. Il ne répare rien : il dit ce qui manque, et où.
 */
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
 * L'ENTRÉE UNIQUE DU FORMAT. Tout ce qui lit un corps de note passe par ici :
 * le rendu, l'écriture en base, l'export, l'indexation. Un document non validé
 * n'entre nulle part — ADR-003 interdit « toute écriture directe en base d'un
 * document non validé par le schéma ProseMirror ».
 *
 * @throws DocumentInvalide — jamais un document réparé.
 */
export function analyserDocument(valeur: unknown): Document {
	const verdict = verifierDocument(valeur);
	if (!verdict.valide) throw new DocumentInvalide(verdict.manquements);
	return verdict.document;
}

/* ═════════════════════════════════ Le catalogue des constructions ═══════ */

/** Une des quinze constructions de M04.6, et ce qui la porte dans le format. */
export interface Construction {
	/** Le rang dans le tableau de M04.6, l. 586-600. */
	readonly numero: number;
	/** Le libellé du cahier des charges, à la lettre. */
	readonly libelle: string;
	/** Les nœuds et marques du format qui la portent. */
	readonly porteurs: readonly string[];
	/** Ce que le rendu doit produire, et que la commande recherche. */
	readonly signature: readonly string[];
}

/**
 * LES QUINZE CONSTRUCTIONS, dans l'ordre du tableau de M04.6 (l. 586-600),
 * relu ligne à ligne. Le tableau du cahier des charges compte quinze lignes :
 * ce catalogue en compte quinze, et `document.test.ts` le vérifie.
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

/* ═══════════════════════════════════════ Le parcours de l'arbre ═════════ */

/** Les nœuds de structure : ils ne sont pas des blocs, ils en portent. */
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
 * ADR-003 interdit « toute manipulation du corps par expression régulière ou
 * par transformation de chaîne » : la réécriture de liens, le sommaire et les
 * rétroliens se font par PARCOURS DE L'ARBRE. C'est ce parcours, et il est ici.
 *
 * Il rend les BLOCS, dans l'ordre du document, en traversant les conteneurs —
 * un élément de liste n'est pas un bloc, le paragraphe qu'il porte en est un.
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

/** Les textes d'un nœud, dans l'ordre du document. */
export function* textes(noeud: Document | NoeudDeContenu): Generator<Texte> {
	for (const enfant of enfantsDe(noeud)) {
		if (enfant.type === 'text') yield enfant;
		else yield* textes(enfant);
	}
}

/** Les titres du document, dans l'ordre. Matière du sommaire de M04.5. */
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
 * LE TEXTE BRUT — la forme dérivée qu'ADR-003 produit « à l'enregistrement »
 * pour l'indexation, les extraits et la détection de doublon.
 *
 * Une ligne par bloc, dans l'ordre du document, et RIEN QUI NE SOIT PAS LU :
 * le glyphe et le titre d'une alerte en font partie, l'attribution d'une
 * citation aussi, l'alternative d'un diagramme et le texte de remplacement
 * d'une image également — ce sont eux que P-06 rend lisibles quand le
 * graphique ne l'est pas. Un séparateur n'écrit rien.
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
 * LE TEXTE COPIÉ D'UN BLOC DE CODE — `RG-M04-05` : « un texte brut, sans
 * caractère parasite : pas de numéro de ligne, pas de retour chariot Windows,
 * exactement ce que l'utilisateur collera dans son terminal ».
 *
 * La fonction ne nettoie RIEN, et c'est le point : le format refuse déjà le
 * retour chariot à l'entrée (règle 5) et ne sait pas porter un numéro de ligne.
 * Un nettoyage ici masquerait un document stocké faux.
 */
export function texteDeCopie(bloc: BlocDeCode): string {
	return (bloc.content ?? []).map((t) => t.text).join('');
}
