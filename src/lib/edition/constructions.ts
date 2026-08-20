/**
 * LES QUINZE CONSTRUCTIONS, VUES DEPUIS L'ÉDITEUR — ce qu'il sait produire, ce
 * qu'il insère, et ce qui lui manque.
 *
 * `src/lib/contenu/document.ts` porte le catalogue `CONSTRUCTIONS` : les quinze
 * lignes de M04.6, leurs PORTEURS dans le format et leur SIGNATURE au rendu. Ce
 * module-ci répond à l'autre question, celle du contrat de `T-050` : *l'éditeur
 * sait-il les produire ?* Il n'ajoute aucune construction, n'en retire aucune,
 * et ne redéfinit ni les porteurs ni les signatures — il les LIT.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES GABARITS D'INSERTION SONT DU GEL, PAS DE MOI
 *
 * `mockups/V-17-editeur.html:3068-3084` porte une table nommée dans la maquette
 * elle-même : à chaque clé de bouton, le fragment que l'éditeur insère. Titre de
 * section, sous-titre, regroupement, liste de tâches « À faire », citation,
 * bloc de code « commande » étiqueté bash, tableau de deux colonnes et deux
 * lignes, figure sans image, filet, diagramme de deux flèches, trois alertes
 * avec leur glyphe et leur texte, lien externe, lien interne.
 *
 * Ces fragments sont TRANSCRITS ici au format canonique, jamais réinventés :
 * c'est la même opération que `src/lib/contenu/documents-du-gel.ts` fait pour
 * les corps rédigés, et pour la même raison — un gabarit choisi par
 * l'implémenteur serait la « valeur illustrative » que `P-02` proscrit.
 *
 * DEUX ÉCARTS DE TRANSCRIPTION, ET ILS SE LISENT DANS LE GEL :
 *
 *   · le filet du gel est suivi d'un paragraphe vide (V-17:3076). Le format ne
 *     porte pas de saut de ligne dur — règle 4 —, et le paragraphe vide s'écrit
 *     par un paragraphe sans contenu, ce que la règle 1 prévoit exactement.
 *   · les quatre marques de caractère (gras, italique, souligné, barré) n'ont
 *     AUCUN gabarit : le gel les applique à la sélection courante
 *     (V-17:3099-3105), il n'insère rien. Leur fragment marqué reprend donc le
 *     nom accessible du bouton qui les porte (V-17:1522-1531) — une lecture du
 *     gel, et la seule disponible.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS CONSTRUCTIONS PORTENT UNE LACUNE, ET ELLES SONT COMPTÉES
 *
 * Le contrat de ce lot est formel : « si une construction de M04.6 ne peut pas
 * être produite par les extensions installées, ne l'invente pas et n'installe
 * rien : nomme-la, compte-la, dis ce qui manque ». `LACUNES` le fait, et
 * `constructions.test.ts` compte : une lacune qui disparaîtrait sans que la
 * cause soit levée ferait rougir l'épreuve, et une construction hors liste qui
 * cesserait d'être produite aussi.
 */
import {
	CONSTRUCTIONS,
	type Alerte,
	type Bloc,
	type Document,
	type NiveauDAlerte,
	type Texte
} from '../contenu/document';
import { MARQUES_DU_FORMAT_SANS_EXTENSION } from './schema';

/* ═══════════════════════════════════ Les gabarits du gel ════════════════ */

/** Un gabarit d'insertion : la clé du bouton gelé, sa source, ce qu'il insère. */
export interface GabaritDInsertion {
	/** La clé portée par le bouton de la barre gelée. */
	readonly cle: string;
	/** Le nom accessible du bouton, tel que le gel l'écrit. */
	readonly libelle: string;
	/** Où le gel l'écrit. */
	readonly source: string;
	/** Ce que l'éditeur insère, au format canonique. */
	readonly blocs: readonly Bloc[];
}

const paragraphe = (texte?: string): Bloc =>
	texte === undefined
		? { type: 'paragraph' }
		: { type: 'paragraph', content: [{ type: 'text', text: texte }] };

const alerte = (niveau: NiveauDAlerte, glyphe: string, corps: string): Alerte => ({
	type: 'alerte',
	attrs: { niveau, glyphe, titre: 'Titre' },
	content: [paragraphe(corps)]
});

/**
 * LES QUATORZE GABARITS D'INSERTION FIXES, dans l'ordre de la barre gelée.
 *
 * La table du gel porte QUINZE clés (V-17:3068-3084). Douze sont ici telles
 * quelles ; les trois autres — image, diagramme, lien interne — ont besoin d'une
 * valeur que le gel ne donne pas, et sont des FABRIQUES plus bas. S'ajoutent les
 * deux listes, que le gel produit par une commande d'édition sans gabarit :
 * 12 + 2 = 14, et `constructions.test.ts` recompte.
 */
export const GABARITS: readonly GabaritDInsertion[] = [
	{
		cle: 'h2',
		libelle: 'Titre de niveau 2',
		source: 'V-17:3069',
		blocs: [
			{
				type: 'heading',
				attrs: { level: 2, ancre: 's-nouveau' },
				content: [{ type: 'text', text: 'Titre de section' }]
			}
		]
	},
	{
		cle: 'h3',
		libelle: 'Titre de niveau 3',
		source: 'V-17:3070',
		blocs: [
			{
				type: 'heading',
				attrs: { level: 3, ancre: null },
				content: [{ type: 'text', text: 'Sous-titre' }]
			}
		]
	},
	{
		cle: 'h4',
		libelle: 'Titre de niveau 4',
		source: 'V-17:3071',
		blocs: [
			{
				type: 'heading',
				attrs: { level: 4, ancre: null },
				content: [{ type: 'text', text: 'Regroupement' }]
			}
		]
	},
	{
		cle: 'taches',
		libelle: 'Liste de tâches',
		source: 'V-17:3072',
		blocs: [
			{
				type: 'taskList',
				content: [{ type: 'taskItem', attrs: { checked: false }, content: [paragraphe('À faire')] }]
			}
		]
	},
	{
		cle: 'citation',
		libelle: 'Citation',
		source: 'V-17:3073',
		blocs: [{ type: 'blockquote', attrs: { attribution: null }, content: [paragraphe('Citation')] }]
	},
	{
		cle: 'code',
		libelle: 'Bloc de code',
		source: 'V-17:3074',
		blocs: [
			{
				type: 'codeBlock',
				attrs: { language: 'bash' },
				content: [{ type: 'text', text: 'commande' }]
			}
		]
	},
	{
		cle: 'tableau',
		libelle: 'Tableau',
		source: 'V-17:3075',
		blocs: [
			{
				type: 'table',
				content: [
					{
						type: 'tableRow',
						content: [
							{ type: 'tableHeader', content: [paragraphe('Colonne')] },
							{ type: 'tableHeader', content: [paragraphe('Colonne')] }
						]
					},
					{
						type: 'tableRow',
						content: [
							{ type: 'tableCell', attrs: { numerique: false }, content: [paragraphe('—')] },
							{ type: 'tableCell', attrs: { numerique: false }, content: [paragraphe('—')] }
						]
					},
					{
						type: 'tableRow',
						content: [
							{ type: 'tableCell', attrs: { numerique: false }, content: [paragraphe('—')] },
							{ type: 'tableCell', attrs: { numerique: false }, content: [paragraphe('—')] }
						]
					}
				]
			}
		]
	},
	{
		cle: 'separateur',
		libelle: 'Séparateur',
		source: 'V-17:3077',
		blocs: [{ type: 'horizontalRule' }, paragraphe()]
	},
	{
		cle: 'alerte-astuce',
		libelle: 'Bloc d’alerte — astuce',
		source: 'V-17:3079',
		blocs: [alerte('astuce', 'ASTUCE', 'Contenu de l’astuce.')]
	},
	{
		cle: 'alerte-attention',
		libelle: 'Bloc d’alerte — attention',
		source: 'V-17:3080',
		blocs: [alerte('attention', 'ATTENTION', 'Ce qu’il faut savoir avant.')]
	},
	{
		cle: 'alerte-danger',
		libelle: 'Bloc d’alerte — danger',
		source: 'V-17:3081',
		blocs: [alerte('danger', 'DANGER', 'Conséquence irréversible.')]
	},
	{
		cle: 'lien',
		libelle: 'Lien',
		source: 'V-17:3082',
		blocs: [
			{
				type: 'paragraph',
				content: [{ type: 'text', text: 'lien', marks: [{ type: 'link', attrs: { href: '#' } }] }]
			}
		]
	},
	/* Les deux listes : le gel les produit par une commande d'édition sur la
	   ligne courante (V-17:3535, 3538), sans gabarit. Une liste d'un élément
	   vide est ce que cette commande donne sur une ligne vide, et le format
	   l'écrit par un paragraphe sans contenu (règle 1). */
	{
		cle: 'insertUnorderedList',
		libelle: 'Liste à puces',
		source: 'V-17:1535 — commande, sans gabarit',
		blocs: [{ type: 'bulletList', content: [{ type: 'listItem', content: [paragraphe()] }] }]
	},
	{
		cle: 'insertOrderedList',
		libelle: 'Liste numérotée',
		source: 'V-17:1538 — commande, sans gabarit',
		blocs: [{ type: 'orderedList', content: [{ type: 'listItem', content: [paragraphe()] }] }]
	}
];

/* ═══════════════════════════════════ Les marques de caractère ═══════════ */

/**
 * Les six boutons de marque de la barre gelée (V-17:1522-1531), et la marque du
 * format que chacun pose. Le gel applique à la sélection : le fragment marqué
 * ci-dessous reprend le nom accessible du bouton, seule chaîne que la maquette
 * donne pour ces six-là.
 */
export const MARQUES_DE_LA_BARRE: readonly {
	readonly cle: string;
	readonly libelle: string;
	readonly marque: string;
	readonly source: string;
}[] = [
	{ cle: 'bold', libelle: 'Gras', marque: 'bold', source: 'V-17:1522' },
	{ cle: 'italic', libelle: 'Italique', marque: 'italic', source: 'V-17:1523' },
	{ cle: 'underline', libelle: 'Souligné', marque: 'underline', source: 'V-17:1524' },
	{ cle: 'strikeThrough', libelle: 'Barré', marque: 'strike', source: 'V-17:1525' },
	{ cle: 'surligne', libelle: 'Surligné', marque: 'highlight', source: 'V-17:1526' },
	{ cle: 'code', libelle: 'Code en ligne', marque: 'code', source: 'V-17:1529' }
];

/** Un paragraphe portant une seule marque, sans attribut. Sert aux six ci-dessus. */
export function gabaritDeMarque(marque: string, texte: string): Document {
	const t = { type: 'text', text: texte, marks: [{ type: marque }] } as unknown as Texte;
	return { type: 'doc', content: [{ type: 'paragraph', content: [t] }] };
}

/* ═══════════════════════════════════ Les trois gabarits paramétrés ══════ */

/**
 * LE LIEN INTERNE — le gel écrit le TITRE de la note dans le texte et ne porte
 * aucune cible (V-17:3313-3314) ; ADR-003 impose l'IDENTIFIANT dans la marque.
 * Les deux ensemble donnent cette fabrique : le texte est le titre, la marque
 * est l'identifiant.
 *
 * C'est ce qui rend le lien insensible au renommage — et ce que le gel, qui
 * n'écrit qu'une adresse morte, ne pouvait pas montrer.
 */
export function gabaritDeLienInterne(cible: string, titre: string): Document {
	return {
		type: 'doc',
		content: [
			{
				type: 'paragraph',
				content: [{ type: 'text', text: titre, marks: [{ type: 'lienInterne', attrs: { cible } }] }]
			}
		]
	};
}

/**
 * L'IMAGE. Le gabarit du gel (V-17:3076) n'est PAS une image : c'est une figure
 * vide portant une zone de dépôt et une légende en deux parties. La source vient
 * du fichier déposé — voir `LACUNES`, n° 10.
 */
export function gabaritDImage(
	src: string,
	alt: string,
	etiquette: string | null,
	legende: string | null
): Document {
	return { type: 'doc', content: [{ type: 'image', attrs: { src, alt, etiquette, legende } }] };
}

/**
 * LE DIAGRAMME. La SOURCE est du gel (V-17:3078, deux flèches dans un bloc
 * étiqueté « diagramme ») ; l'ALTERNATIVE textuelle que `P-06` et `RG-M18-11`
 * exigent n'a aucun champ de saisie dans la maquette — voir `LACUNES`, n° 12.
 */
export function gabaritDeDiagramme(source: string, alternative: string): Document {
	return {
		type: 'doc',
		content: [
			{
				type: 'diagramme',
				attrs: { source, langage: 'mermaid', alternative, etiquette: null, legende: null }
			}
		]
	};
}

/** La source de diagramme que le gel insère, à la lettre. */
export const SOURCE_DE_DIAGRAMME_DU_GEL = 'A --> B\nB --> C';

/* ═══════════════════════════════════ Le relevé des quinze ═══════════════ */

/** Ce que l'éditeur oppose à une construction de M04.6. */
export interface ConstructionDeLEditeur {
	readonly numero: number;
	readonly libelle: string;
	/** Les paquets qui portent ses porteurs, ou la mention du nœud écrit en propre. */
	readonly origine: readonly string[];
	/** Les clés de bouton de la barre gelée qui la produisent. */
	readonly commandes: readonly string[];
	/** Ce qui manque pour la produire de bout en bout, ou `null`. */
	readonly lacune: string | null;
}

const EN_PROPRE = 'écrit en propre (ADR-003)';

/**
 * LES TROIS LACUNES, NOMMÉES ET COMPTÉES.
 *
 * Elles ne sont pas des refus d'implémenter : ce sont des vides que rien dans
 * les sources ne comble, et qu'un implémenteur ne peut combler qu'en décidant à
 * la place du commanditaire (`CLAUDE.md` §2, règle de non-comblement).
 */
export const LACUNES: Readonly<Record<number, string>> = {
	2:
		'la marque du SURLIGNÉ — sixième porteur de la construction. Aucune extension ' +
		'installée ne l’apporte, et `STACK-TECHNIQUE.md` §4.3 n’en nomme AUCUNE qui le ' +
		'ferait : les dix extensions de la ligne 270 ne couvrent pas cette marque. Le ' +
		'bouton existe pourtant au gel (V-17:1526) et DEUX corps du gel portent la ' +
		'marque (relevé : `highlight 2`). Conséquence mesurée : deux des quatre corps ' +
		'transcrits du gel ne peuvent pas ENTRER dans l’éditeur — refus explicite, ' +
		'jamais amputation silencieuse (voir `EditeurIncapable`). Les cinq autres ' +
		'porteurs de la construction sont produits.',
	10:
		'la SOURCE d’une image. Le nœud est bien au schéma de l’éditeur ' +
		'(`@tiptap/extension-image`), et son rendu est éprouvé en unitaire ; ce qui ' +
		'manque est en amont : le gabarit du gel (V-17:3076) est une zone de DÉPÔT, pas ' +
		'une image, et le produit n’a aucun chemin de dépôt de fichier — la table ' +
		'`pieces_jointes` ne porte ni contenu ni chemin, et la variable d’environnement ' +
		'qui nomme la racine des fichiers (compose.yaml:136) n’est lue par aucune ligne ' +
		'du dépôt. Aucune valeur de source n’est donc inventée ici.',
	12:
		'l’ALTERNATIVE TEXTUELLE d’un diagramme, que `P-06` et `RG-M18-11` rendent ' +
		'obligatoire et que le format refuse vide. La SOURCE est du gel (V-17:3078) ; ' +
		'l’alternative n’a aucun champ de saisie dans la maquette de l’éditeur — relevé ' +
		'sur la totalité du panneau de métadonnées (V-17:1596-1665), qui porte sept ' +
		'champs et aucun de ceux-là. La fabrique existe et l’exige en paramètre : c’est ' +
		'l’écran qui manque, pas le format.'
};

/**
 * LE RELEVÉ DES QUINZE, dans l'ordre de M04.6. Les libellés et les porteurs sont
 * LUS dans `CONSTRUCTIONS` — ce module n'en écrit aucun.
 */
export const CONSTRUCTIONS_DE_LEDITEUR: readonly ConstructionDeLEditeur[] = CONSTRUCTIONS.map(
	(c) => {
		const origines: Record<number, readonly string[]> = {
			1: ['@tiptap/starter-kit'],
			2: ['@tiptap/starter-kit'],
			3: ['@tiptap/starter-kit'],
			4: ['@tiptap/starter-kit'],
			5: ['@tiptap/starter-kit'],
			6: ['@tiptap/extension-task-list', '@tiptap/extension-task-item'],
			7: ['@tiptap/starter-kit'],
			8: [EN_PROPRE],
			9: ['@tiptap/extension-table'],
			10: ['@tiptap/extension-image'],
			11: ['@tiptap/starter-kit'],
			12: [EN_PROPRE],
			13: [EN_PROPRE],
			14: [EN_PROPRE],
			15: ['@tiptap/starter-kit']
		};
		const commandes: Record<number, readonly string[]> = {
			1: ['h2', 'h3', 'h4'],
			2: ['bold', 'italic', 'underline', 'strikeThrough', 'surligne'],
			3: ['code'],
			4: ['code (bloc)'],
			5: ['insertUnorderedList', 'insertOrderedList'],
			6: ['taches'],
			7: ['citation'],
			8: ['alerte-astuce', 'alerte-attention', 'alerte-danger'],
			9: ['tableau'],
			10: ['image'],
			11: ['separateur'],
			12: ['diagramme'],
			13: ['lien-interne'],
			14: ['lien-interne'],
			15: ['lien']
		};
		return {
			numero: c.numero,
			libelle: c.libelle,
			origine: origines[c.numero] ?? [],
			commandes: commandes[c.numero] ?? [],
			lacune: LACUNES[c.numero] ?? null
		};
	}
);

/**
 * LE COMPTE — combien de constructions l'éditeur produit sans réserve, et
 * combien portent une lacune nommée. Calculé, jamais recopié : c'est
 * l'enseignement de `T-013b` sur l'en-tête de `CAS_INVALIDES`, qui annonçait
 * quinze cas quand la liste en portait vingt et un.
 */
export function compteDesConstructions(): {
	readonly total: number;
	readonly produites: number;
	readonly avecLacune: number;
	readonly marquesSansExtension: readonly string[];
} {
	const avecLacune = CONSTRUCTIONS_DE_LEDITEUR.filter((c) => c.lacune !== null).length;
	return {
		total: CONSTRUCTIONS_DE_LEDITEUR.length,
		produites: CONSTRUCTIONS_DE_LEDITEUR.length - avecLacune,
		avecLacune,
		marquesSansExtension: MARQUES_DU_FORMAT_SANS_EXTENSION
	};
}
