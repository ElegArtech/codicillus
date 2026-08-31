/**
 * LES DEUX COMMANDES DU FORMAT, et ce que chacune prouve.
 *
 *   `pnpm contenu:constructions` — les quinze constructions de M04.6, une par une :
 *      ce que le contenu du gel en exerce, et ce que le rendu en produit.
 *   `pnpm contenu:invalide` — que le schéma REFUSE, sur des documents mal formés de
 *      quinze genres différents, et avec quel message.
 *
 * Les deux vivent ici, en TypeScript contrôlé par `pnpm check` ; `verif/contenu.mjs`
 * ne fait que les lancer et imprimer.
 *
 * CE QUE LE VERT DE `contenu:constructions` NE DIT PAS : rien de l'IMAGE ni du
 * DIAGRAMME, que le gel n'exerce pas — d'où le compte et le nom, plutôt qu'un cas
 * fabriqué qui les rendrait vertes (`P-5`).
 */
import {
	CONSTRUCTIONS,
	parcourir,
	textes,
	verifierDocument,
	type Bloc,
	type Construction,
	type Document,
	type Manquement
} from './document';
import { DOCUMENTS_DU_GEL, resoudreDansLeCorpus } from './documents-du-gel';
import { rendreDocument, type ResolveurDeNote } from './rendu';

export interface ReleveDeConstruction {
	readonly construction: Construction;
	readonly parPorteur: Readonly<Record<string, number>>;
	readonly occurrences: number;
	readonly signaturesManquantes: readonly string[];
}

/**
 * LES DEUX CONSTRUCTIONS QU'AUCUN CONTENU DU GEL N'EXERCE. Cette liste est
 * OPPOSABLE : la commande sort en 1 si une construction hors liste tombe à zéro
 * occurrence, et aussi si une construction de la liste se met à en avoir.
 */
export const CONSTRUCTIONS_SANS_CONTENU_DU_GEL: Readonly<Record<number, string>> = {
	10:
		'aucun corps rédigé du gel ne porte d’image — relevé mécanique : zéro balise ' +
		'd’image dans les 41 maquettes. Le gel atteste l’ENVELOPPE (figure.figure > ' +
		'figure__cadre + figcaption, V-17:3076, V-14:1586) et les deux entrées ' +
		'd’insertion de l’éditeur (V-17:1556 ; V-17:3186, « Dépôt, collage ou parcours »), ' +
		'jamais une image. Rendu ' +
		'éprouvé en unitaire (rendu.test.ts, « l’image »).',
	12:
		'aucun corps rédigé du gel ne porte de diagramme : les deux figures de V-14:1585 ' +
		'et V-03:1004 sont des SVG écrits à la main, le RÉSULTAT et non la source. La ' +
		'SOURCE, elle, est attestée — V-17:3078 insère « A --> B\\nB --> C » dans un ' +
		'.bloc-code étiqueté « diagramme » —, et c’est elle que le test emploie. Ce que ' +
		'nulle maquette ne montre, c’est le rendu GRAPHIQUE d’une source en lecture ' +
		'(rendu.test.ts, « le diagramme »).'
};

const MARQUES = new Set([
	'bold',
	'italic',
	'underline',
	'strike',
	'highlight',
	'code',
	'link',
	'lienInterne'
]);

/**
 * Les occurrences d'un porteur DANS UN DOCUMENT. Extrait de
 * `compterDansLesDocuments` pour que la batterie 4 relève l'exercice des
 * constructions DOCUMENT PAR DOCUMENT sans écrire une seconde règle de comptage, qui
 * divergerait au premier cas limite.
 */
export function compterPorteur(document: Document, porteur: string): number {
	let n = 0;
	if (MARQUES.has(porteur)) {
		for (const t of textes(document)) {
			n += (t.marks ?? []).filter((m) => m.type === porteur).length;
		}
	} else {
		for (const bloc of parcourir(document)) if (bloc.type === porteur) n += 1;
		/* Les conteneurs ne sont pas rendus par `parcourir` : ils se comptent
		   sur leurs parents, dont ils sont le contenu direct. */
		n += compterLesConteneurs(document, porteur);
	}
	return n;
}

function compterDansLesDocuments(porteur: string): number {
	let n = 0;
	for (const { document } of DOCUMENTS_DU_GEL) n += compterPorteur(document, porteur);
	return n;
}

function compterLesConteneurs(document: Document, porteur: string): number {
	if (!['listItem', 'taskItem', 'tableRow', 'tableCell', 'tableHeader'].includes(porteur)) return 0;
	let n = 0;
	for (const bloc of parcourir(document)) n += conteneursDe(bloc, porteur);
	return n;
}

function conteneursDe(bloc: Bloc, porteur: string): number {
	if (bloc.type === 'bulletList' || bloc.type === 'orderedList') {
		return porteur === 'listItem' ? bloc.content.length : 0;
	}
	if (bloc.type === 'taskList') return porteur === 'taskItem' ? bloc.content.length : 0;
	if (bloc.type === 'table') {
		if (porteur === 'tableRow') return bloc.content.length;
		return bloc.content.reduce((t, l) => t + l.content.filter((c) => c.type === porteur).length, 0);
	}
	return 0;
}

/**
 * Les liens internes D'UN DOCUMENT, séparés par le sort que la résolution leur
 * fait. Extrait pour la même raison que `compterPorteur` : les constructions
 * 13 et 14 partagent un porteur, et seule la résolution les distingue.
 */
export function compterLesLiensDUnDocument(
	document: Document,
	resoudre: ResolveurDeNote
): { readonly resolus: number; readonly casses: number } {
	let resolus = 0;
	let casses = 0;
	for (const t of textes(document)) {
		for (const m of t.marks ?? []) {
			if (m.type !== 'lienInterne') continue;
			if (resoudre(m.attrs.cible) === null) casses += 1;
			else resolus += 1;
		}
	}
	return { resolus, casses };
}

function compterLesLiens(): { readonly resolus: number; readonly casses: number } {
	let resolus = 0;
	let casses = 0;
	for (const { document } of DOCUMENTS_DU_GEL) {
		const compte = compterLesLiensDUnDocument(document, resoudreDansLeCorpus);
		resolus += compte.resolus;
		casses += compte.casses;
	}
	return { resolus, casses };
}

export function rendusDuGel(): string {
	return DOCUMENTS_DU_GEL.map((d) =>
		rendreDocument(d.document, { resoudre: resoudreDansLeCorpus, contexte: 'interne' })
	).join('\n');
}

export function releveDesConstructions(): readonly ReleveDeConstruction[] {
	const html = rendusDuGel();
	const liens = compterLesLiens();
	return CONSTRUCTIONS.map((construction) => {
		let parPorteur: Record<string, number>;
		if (construction.numero === 13) parPorteur = { 'lienInterne (cible résolue)': liens.resolus };
		else if (construction.numero === 14)
			parPorteur = { 'lienInterne (cible inexistante)': liens.casses };
		else {
			parPorteur = {};
			for (const p of construction.porteurs) parPorteur[p] = compterDansLesDocuments(p);
		}
		const occurrences = Object.values(parPorteur).reduce((a, b) => a + b, 0);
		const signaturesManquantes =
			occurrences === 0 ? [] : construction.signature.filter((s) => !html.includes(s));
		return { construction, parPorteur, occurrences, signaturesManquantes };
	});
}

export interface CasInvalide {
	readonly genre: string;
	readonly nom: string;
	readonly valeur: unknown;
	readonly chemin: string;
	readonly message: RegExp;
}

const p = (texte: string) => ({ type: 'paragraph', content: [{ type: 'text', text: texte }] });

/**
 * LES VINGT-QUATRE DOCUMENTS MAL FORMÉS, en sept genres d'invalidité. Un document mal
 * formé est REJETÉ, jamais silencieusement réparé. Chaque cas est joué par la
 * commande ET par l'unitaire — même liste, deux lecteurs —, et les comptes sont
 * calculés, jamais recopiés : cet en-tête annonçait « quinze, six genres » quand la
 * liste en portait vingt et un de sept.
 *
 * UN CAS, UNE RÈGLE : un document qui violerait deux règles serait refusé pour l'une
 * ou pour l'autre selon l'ordre des contrôles, et passerait pour la mauvaise raison.
 */
export const CAS_INVALIDES: readonly CasInvalide[] = [
	{
		genre: 'nœud inconnu',
		nom: 'un cadre étranger au format',
		valeur: { type: 'doc', content: [{ type: 'iframe', attrs: { src: 'https://ailleurs' } }] },
		chemin: 'content[0].type',
		message: /nœud inconnu/
	},
	{
		genre: 'nœud inconnu',
		nom: 'un nœud de saut de ligne dur, qui n’est pas des quinze constructions',
		valeur: { type: 'doc', content: [{ type: 'hardBreak' }] },
		chemin: 'content[0].type',
		message: /nœud inconnu/
	},
	{
		genre: 'nœud inconnu',
		nom: 'une racine qui n’est pas un document',
		valeur: { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
		chemin: 'type',
		message: /valeur hors du domaine admis/
	},
	{
		genre: 'marque inconnue',
		nom: 'une marque de clignotement',
		valeur: {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'blink' }] }] }
			]
		},
		chemin: 'content[0].content[0].marks[0].type',
		message: /marque inconnue/
	},
	{
		genre: 'marque inconnue',
		nom: 'un exposant — le gel en écrit un (V-14:1577), M04.6 n’en compte aucun',
		valeur: {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'text', text: 'er', marks: [{ type: 'sup' }] }] }
			]
		},
		chemin: 'content[0].content[0].marks[0].type',
		message: /marque inconnue/
	},
	{
		genre: 'attribut manquant',
		nom: 'un titre sans ancre',
		valeur: {
			type: 'doc',
			content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'x' }] }]
		},
		chemin: 'content[0].attrs.ancre',
		message: /attribut manquant/
	},
	{
		genre: 'attribut manquant',
		nom: 'une alerte sans glyphe — P-7.2, l’information portée par la seule couleur',
		valeur: {
			type: 'doc',
			content: [{ type: 'alerte', attrs: { niveau: 'danger', titre: 'x' }, content: [p('y')] }]
		},
		chemin: 'content[0].attrs.glyphe',
		message: /attribut manquant/
	},
	{
		genre: 'attribut manquant',
		nom: 'un lien interne sans cible — ADR-003 veut l’identifiant de la note',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'x', marks: [{ type: 'lienInterne', attrs: {} }] }]
				}
			]
		},
		chemin: 'content[0].content[0].marks[0].attrs.cible',
		message: /attribut manquant/
	},
	{
		genre: 'attribut inconnu',
		nom: 'un titre qui porte son identifiant HTML au lieu de son ancre',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2, ancre: 's-x', id: 's-x' },
					content: [{ type: 'text', text: 'x' }]
				}
			]
		},
		chemin: 'content[0].attrs',
		message: /attribut inconnu : « id »/
	},
	{
		genre: 'valeur hors domaine',
		nom: 'un titre de niveau 7',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 7, ancre: null },
					content: [{ type: 'text', text: 'x' }]
				}
			]
		},
		chemin: 'content[0].attrs.level',
		message: /valeur hors du domaine admis|nœud inconnu/
	},
	{
		genre: 'valeur hors domaine',
		nom: 'un quatrième niveau d’alerte',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'alerte',
					attrs: { niveau: 'information', glyphe: 'INFO', titre: 'x' },
					content: [p('y')]
				}
			]
		},
		chemin: 'content[0].attrs.niveau',
		message: /valeur hors du domaine admis/
	},
	{
		genre: 'imbrication interdite',
		nom: 'un titre dans un paragraphe',
		valeur: {
			type: 'doc',
			content: [
				{ type: 'paragraph', content: [{ type: 'heading', attrs: { level: 2, ancre: null } }] }
			]
		},
		chemin: 'content[0].content[0].type',
		message: /valeur hors du domaine admis/
	},
	{
		genre: 'imbrication interdite',
		nom: 'une tâche hors de sa liste',
		valeur: {
			type: 'doc',
			content: [{ type: 'taskItem', attrs: { checked: false }, content: [p('x')] }]
		},
		chemin: 'content[0].type',
		message: /nœud inconnu/
	},
	{
		genre: 'imbrication interdite',
		nom: 'une alerte dans une alerte',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'alerte',
					attrs: { niveau: 'astuce', glyphe: 'ASTUCE', titre: 'x' },
					content: [
						{
							type: 'alerte',
							attrs: { niveau: 'danger', glyphe: 'DANGER', titre: 'y' },
							content: [p('z')]
						}
					]
				}
			]
		},
		chemin: 'content[0].content',
		message: /imbrication interdite/
	},
	{
		genre: 'imbrication interdite',
		nom: 'une marque dans un bloc de code',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'bash' },
					content: [{ type: 'text', text: 'ls', marks: [{ type: 'bold' }] }]
				}
			]
		},
		chemin: 'content[0].content[0]',
		message: /attribut inconnu : « marks »/
	},
	{
		genre: 'forme non canonique',
		nom: 'un contenu vide écrit en tableau vide',
		valeur: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
		chemin: 'content[0].content',
		message: /aucun contenu vide/
	},
	{
		genre: 'forme non canonique',
		nom: 'deux textes consécutifs de mêmes marques',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'a' },
						{ type: 'text', text: 'b' }
					]
				}
			]
		},
		chemin: 'content[0].content',
		message: /ProseMirror les fusionne/
	},
	{
		genre: 'forme non canonique',
		nom: 'un retour chariot dans un bloc de code — RG-M04-05',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'codeBlock',
					attrs: { language: 'bash' },
					content: [{ type: 'text', text: 'ls\r\n-l' }]
				}
			]
		},
		chemin: 'content[0].content[0].text',
		message: /retour chariot/
	},
	{
		genre: 'forme non canonique',
		nom: 'un saut de ligne dans un texte de paragraphe',
		valeur: { type: 'doc', content: [p('deux\nlignes')] },
		chemin: 'content[0].content[0].text',
		message: /retour à la ligne/
	},
	{
		genre: 'forme non canonique',
		nom: 'la marque « code » accompagnée d’une autre',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }, { type: 'code' }] }]
				}
			]
		},
		chemin: 'content[0].content[0].marks',
		message: /exclut toute autre marque/
	},
	{
		genre: 'forme non canonique',
		nom: 'un texte à la fois lien interne et lien externe',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'x',
							marks: [
								{ type: 'link', attrs: { href: 'https://x' } },
								{ type: 'lienInterne', attrs: { cible: 'n-x' } }
							]
						}
					]
				}
			]
		},
		chemin: 'content[0].content[0].marks',
		message: /lien externe et un lien interne/
	},
	{
		genre: 'forme non canonique',
		nom: 'des marques dans l’ordre inverse de leur déclaration — règle 7, ARB-056',
		valeur: {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'x', marks: [{ type: 'italic' }, { type: 'bold' }] }]
				}
			]
		},
		chemin: 'content[0].content[0].marks',
		message: /ordre de déclaration du type/
	},
	{
		genre: 'forme non canonique',
		nom: 'un retour chariot dans un texte de paragraphe — règle 5 élargie, ARB-056',
		valeur: { type: 'doc', content: [p('deux\rlignes')] },
		chemin: 'content[0].content[0].text',
		message: /retour chariot/
	},
	{
		genre: 'forme non canonique',
		nom: 'un retour chariot dans une valeur d’attribut — « où que ce soit »',
		valeur: {
			type: 'doc',
			content: [{ type: 'heading', attrs: { level: 2, ancre: 's-a\rb' } }]
		},
		chemin: 'content[0].attrs.ancre',
		message: /retour chariot/
	}
];

export interface Refus {
	readonly cas: CasInvalide;
	readonly manquements: readonly Manquement[];
	readonly conforme: boolean;
}

export function jouerLesCasInvalides(): readonly Refus[] {
	return CAS_INVALIDES.map((cas) => {
		const verdict = verifierDocument(cas.valeur);
		if (verdict.valide) return { cas, manquements: [], conforme: false };
		const vise = verdict.manquements.some(
			(m) => m.chemin === cas.chemin && cas.message.test(m.message)
		);
		return { cas, manquements: verdict.manquements, conforme: vise };
	});
}

export interface Rapport {
	readonly texte: string;
	readonly code: 0 | 1;
}

function colonne(valeur: string, largeur: number): string {
	return valeur.length >= largeur ? valeur : valeur + ' '.repeat(largeur - valeur.length);
}

/** `pnpm contenu:constructions`. */
export function rapportDesConstructions(): Rapport {
	const releve = releveDesConstructions();
	const lignes: string[] = [
		'contenu:constructions — les quinze constructions de M04.6 (CDC l. 586-600)',
		'',
		`  source du contenu : ${DOCUMENTS_DU_GEL.length} corps transcrits du gel`,
		...DOCUMENTS_DU_GEL.map((d) => `    ${colonne(`${d.note} / ${d.registre}`, 34)}${d.source}`),
		''
	];
	let code: 0 | 1 = 0;
	for (const r of releve) {
		const declaree = r.construction.numero in CONSTRUCTIONS_SANS_CONTENU_DU_GEL;
		const detail = Object.entries(r.parPorteur)
			.map(([nom, n]) => `${nom} ${n}`)
			.join(', ');
		if (r.occurrences === 0) {
			const marque = declaree ? 'NON EXERCÉE' : 'MANQUE';
			if (!declaree) code = 1;
			lignes.push(
				`  ${colonne(String(r.construction.numero), 3)}${colonne(r.construction.libelle, 56)}${marque}`,
				`      ${detail}`,
				`      ${CONSTRUCTIONS_SANS_CONTENU_DU_GEL[r.construction.numero] ?? 'aucune occurrence, et aucune raison déclarée — voir CONSTRUCTIONS_SANS_CONTENU_DU_GEL'}`
			);
			continue;
		}
		if (declaree) {
			code = 1;
			lignes.push(
				`  ${colonne(String(r.construction.numero), 3)}${colonne(r.construction.libelle, 56)}DÉCLARÉE NON EXERCÉE, ET POURTANT ${r.occurrences}`
			);
			continue;
		}
		if (r.signaturesManquantes.length > 0) {
			code = 1;
			lignes.push(
				`  ${colonne(String(r.construction.numero), 3)}${colonne(r.construction.libelle, 56)}RENDU INCOMPLET`,
				`      manque au rendu : ${r.signaturesManquantes.join(' · ')}`
			);
			continue;
		}
		lignes.push(
			`  ${colonne(String(r.construction.numero), 3)}${colonne(r.construction.libelle, 56)}rendue`,
			`      ${detail}`
		);
	}
	const exercees = releve.filter((r) => r.occurrences > 0).length;
	lignes.push(
		'',
		`  ${exercees} constructions sur 15 exercées par le contenu du gel, et rendues.`,
		`  ${15 - exercees} ne le sont par aucun contenu du gel : elles sont nommées ci-dessus,`,
		'  comptées et non fabriquées (P-5, P-02).',
		''
	);
	return { texte: lignes.join('\n'), code };
}

/** `pnpm contenu:invalide`. */
export function rapportDesRefus(): Rapport {
	const refus = jouerLesCasInvalides();
	const genres = [...new Set(CAS_INVALIDES.map((c) => c.genre))];
	const lignes: string[] = [
		'contenu:invalide — ce que le schéma refuse, et ce qu’il en dit',
		'',
		`  ${refus.length} documents mal formés, ${genres.length} genres d’invalidité :`,
		`    ${genres.join(' · ')}`,
		''
	];
	let code: 0 | 1 = 0;
	for (const genre of genres) {
		lignes.push(`  ── ${genre} ${'─'.repeat(Math.max(0, 66 - genre.length))}`);
		for (const r of refus.filter((x) => x.cas.genre === genre)) {
			if (!r.conforme) {
				code = 1;
				lignes.push(
					`     ACCEPTÉ OU MAL SITUÉ  ${r.cas.nom}`,
					r.manquements.length === 0
						? '        aucun manquement relevé — le schéma a laissé passer'
						: `        relevé : ${r.manquements.map((m) => `${m.chemin} : ${m.message}`).join(' | ')}`
				);
				continue;
			}
			const vise = r.manquements.find((m) => m.chemin === r.cas.chemin);
			lignes.push(`     refusé   ${r.cas.nom}`, `        ${vise?.chemin} : ${vise?.message}`);
		}
		lignes.push('');
	}
	lignes.push(
		`  ${refus.filter((r) => r.conforme).length}/${refus.length} refusés au bon endroit, avec le bon motif.`,
		'  Aucun document n’a été réparé : le schéma n’a pas de mode indulgent.',
		''
	);
	return { texte: lignes.join('\n'), code };
}
