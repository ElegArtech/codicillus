/**
 * Le convertisseur unique `document ⇄ Markdown` — l'implémentation unique (`ADR-004`).
 * `serialiserEnMarkdown` et `analyserMarkdown` sont les seuls exports exécutables ; les
 * deux passent par `analyserDocument` — l'aller valide avant d'écrire, le retour avant de
 * rendre —, de sorte qu'aucun document non validé n'entre ni ne sort (`ADR-003`).
 *
 * `RG-M13-01` : « l'export est réimportable […] c'est le critère de réussite principal ».
 * La propriété est une IDENTITÉ, et AUCUNE normalisation n'intervient avant comparaison :
 * chaque convention ci-dessous est choisie pour que l'aller-retour soit l'identité SANS
 * retouche.
 *
 * CE QUE LE GEL FIXE (`ARB-049`) : un diagramme est un bloc clôturé dont la chaîne
 * d'information nomme le langage (`V-36:3044`) ; un lien interne est de la famille des
 * doubles crochets et porte l'IDENTIFIANT de la cible, jamais son titre ; trois tirets en
 * FRAPPE valent séparateur — la LECTURE l'honore, l'ÉCRITURE emploie trois astérisques.
 *
 * LA COUTURE AVEC L'EN-TÊTE DE MÉTADONNÉES : ce bloc appartient à l'export et à l'import.
 * `serialiserEnMarkdown` rend le CORPS SEUL et ne commence JAMAIS par une ligne de trois
 * tirets — la collision est impossible par construction. `analyserMarkdown` reçoit le
 * CORPS SEUL : trois tirets reçus ici sont un séparateur.
 *
 * LES CONVENTIONS MAISON (`ARB-049` décision 3) :
 *
 *   ancre d'un titre      liste d'attributs accolée, forme de Pandoc et kramdown
 *   souligné              deux signes plus ; deux tirets bas sont REFUSÉS, tout lecteur
 *                         Markdown y voyant du gras
 *   surligné              deux signes égal — forme d'Obsidian et du greffon `mark`
 *   italique              un tiret bas, jamais une astérisque (piège 1)
 *   attribut sans place   une LIGNE D'ATTRIBUTS collée sous le bloc, dont les clés sont
 *                         EXACTEMENT les noms du format canonique : une clé inconnue
 *                         n'est pas ignorée, elle est refusée par le schéma
 *   alerte, tableau riche un CONTENEUR clôturé par des deux-points, de la famille des
 *                         directives de conteneur, nommé en français
 *   paragraphe vide       une contre-oblique seule, la forme de Pandoc
 *   frontière de blocs    une ligne d'accolades vides entre deux listes ADJACENTES DE
 *                         MÊME GENRE, que rien d'autre ne saurait séparer
 *
 * LES DEUX PIÈGES D'IDENTITÉ :
 *
 *  1. L'ORDRE DES MARQUES. `[bold, italic]` et `[italic, bold]` sont deux documents
 *     différents, or l'astérisque simple et la double FUSIONNENT : une suite de trois serait
 *     la sortie des deux. La parade n'est pas de normaliser l'ordre (ce serait une perte),
 *     c'est le tiret bas pour l'italique. L'ordre du tableau est l'ordre d'imbrication.
 *  2. LES BORDS D'UN TEXTE. Une espace en tête ou en fin de ligne est invisible et Markdown la
 *     mange : elle s'écrit en entité numérique, et l'esperluette s'échappe partout ailleurs
 *     pour que cette entité ne soit jamais ambiguë.
 *
 * CE MODULE NE NORMALISE RIEN : un retour chariot dans un bloc de code est laissé où il est et
 * `analyserDocument` refuse le document (`RG-M04-05`). Le nettoyer ici serait la « correction
 * appliquée d'un seul côté de l'aller-retour » qu'`ADR-004` interdit. De même, une clé
 * d'attribut inconnue est transmise au schéma, qui refuse.
 *
 * LA SEULE LIMITE DE REPRÉSENTATION : un texte marqué `code` et fait UNIQUEMENT D'ESPACES n'a
 * pas de forme en Markdown — la règle d'égalisation des espaces d'un span de code rend
 * l'écriture non inversible. `serialiserEnMarkdown` lève alors `MarkdownNonRepresentable`.
 */
import {
	RANG_DE_MARQUE,
	analyserDocument,
	type Alerte,
	type Bloc,
	type BlocDeCode,
	type Citation,
	type Diagramme,
	type Document,
	type ElementDeListe,
	type Image,
	type ListeDeTaches,
	type Marque,
	type PieceJointeIntegree,
	type Tableau,
	type Tache,
	type Texte,
	type Titre
} from './document';

/**
 * L'ACCENT GRAVE, JAMAIS ÉCRIT EN CLAIR AILLEURS QU'ICI. `P-17` : un accent grave dans un
 * modèle littéral ferme le modèle, et l'erreur remonte à cent lignes de la cause. Ce
 * module écrit des blocs clôturés : la parade est de ne taper le caractère qu'une fois.
 */
const AG = '`';

/** La longueur minimale d'une clôture de BLOC (un span de code n'en a pas). */
const CLOTURE_MINIMALE = 3;

/** Le séparateur écrit — voir la couture avec l'en-tête de métadonnées. */
const SEPARATEUR_ECRIT = '***';

/** Le marqueur d'une pièce jointe montrée en place — un point d'exclamation, le mot,
    et le crochet ouvrant du nom. Il ne peut pas se confondre avec celui d'une image,
    qui n'a pas de mot entre le point d'exclamation et le crochet. */
const MARQUEUR_DE_PIECE = '!piece-jointe[';

/** Le paragraphe sans contenu : une contre-oblique seule sur sa ligne. */
const PARAGRAPHE_VIDE = '\\';

/** La frontière entre deux listes adjacentes de même genre. */
const FRONTIERE = '{}';

/** L'espace des bords, écrite en entité pour qu'elle survive. */
const ESPACE_ECRITE = '&#32;';

/** Les marqueurs d'emphase, par type de marque. */
const MARQUEUR_DE_MARQUE: Readonly<Record<string, string>> = {
	bold: '**',
	strike: '~~',
	highlight: '==',
	underline: '++',
	italic: '_'
};

/** Le sens inverse, dans l'ordre de lecture : le plus long d'abord. */
const MARQUE_PAR_MARQUEUR: readonly (readonly [string, string])[] = [
	['**', 'bold'],
	['~~', 'strike'],
	['==', 'highlight'],
	['++', 'underline'],
	['_', 'italic']
];

/**
 * Les caractères échappés PARTOUT dans un texte en ligne : chacun ouvre une
 * construction — échappement, entité, span de code, gras, italique, liens,
 * cellule de tableau, liste d'attributs.
 */
const TOUJOURS_ECHAPPES: readonly string[] = ['\\', '&', AG, '*', '_', '[', ']', '|', '{'];

/** Les caractères qui n'ouvrent une construction qu'en PAIRE. */
const ECHAPPES_EN_PAIRE: readonly string[] = ['=', '+', '~'];

/** Les caractères qui n'ouvrent une construction qu'EN TÊTE DE LIGNE. */
const ECHAPPES_EN_TETE: readonly string[] = ['#', '>', '-', ':'];

/** Les trois genres de liste, et leur adjacence indistinguable. */
const GENRES_DE_LISTE: readonly string[] = ['bulletList', 'orderedList', 'taskList'];

/** Un Markdown que ce module ne sait pas lire. Il ne devine jamais. */
export class MarkdownInvalide extends Error {
	readonly ligne: number;

	constructor(ligne: number, message: string) {
		super('Markdown invalide, ligne ' + String(ligne) + ' : ' + message);
		this.name = 'MarkdownInvalide';
		this.ligne = ligne;
	}
}

/**
 * Un document que le Markdown ne sait pas porter. La levée est le moyen de
 * « déclarer et compter » d'ARB-049 décision 4 : jamais une perte muette.
 */
export class MarkdownNonRepresentable extends Error {
	readonly cas: string;

	constructor(cas: string, message: string) {
		super('document non représentable en Markdown (' + cas + ') : ' + message);
		this.name = 'MarkdownNonRepresentable';
		this.cas = cas;
	}
}

function plusLongueSuite(texte: string, caractere: string): number {
	let plus = 0;
	let suite = 0;
	for (const c of texte) {
		suite = c === caractere ? suite + 1 : 0;
		if (suite > plus) plus = suite;
	}
	return plus;
}

function echapperEnLigne(texte: string): string {
	let out = '';
	for (let i = 0; i < texte.length; i++) {
		const c = texte[i] as string;
		if (TOUJOURS_ECHAPPES.includes(c)) {
			out += '\\' + c;
			continue;
		}
		if (ECHAPPES_EN_PAIRE.includes(c) && texte[i + 1] === c) {
			out += '\\' + c;
			continue;
		}
		out += c;
	}
	return out;
}

/**
 * Une valeur d'attribut écrite en ligne — destination de lien, identifiant de
 * cible, texte de remplacement d'une image. La contre-oblique, le saut de
 * ligne et les délimiteurs du contexte s'échappent ; rien d'autre ne bouge.
 */
function echapperValeur(valeur: string, delimiteurs: readonly string[]): string {
	let out = '';
	for (const c of valeur) {
		if (c === '\\') out += '\\\\';
		else if (c === '\n') out += '\\n';
		else if (delimiteurs.includes(c)) out += '\\' + c;
		else out += c;
	}
	return out;
}

function protegerLesBords(ligne: string): string {
	if (ligne === '') return '';
	if (ligne.trim() === '') return ESPACE_ECRITE.repeat(ligne.length);
	const tete = (/^ +/.exec(ligne) ?? [''])[0].length;
	const queue = (/ +$/.exec(ligne) ?? [''])[0].length;
	return (
		ESPACE_ECRITE.repeat(tete) +
		ligne.slice(tete, ligne.length - queue) +
		ESPACE_ECRITE.repeat(queue)
	);
}

/**
 * L'échappement de TÊTE DE LIGNE. Un paragraphe qui commence par un dièse, un
 * chevron, un tiret, un deux-points ou un numéro suivi d'un point serait relu
 * comme un titre, une citation, une liste ou un conteneur.
 */
function echapperLaTete(ligne: string): string {
	const premier = ligne.slice(0, 1);
	if (ECHAPPES_EN_TETE.includes(premier)) return '\\' + ligne;
	const numero = /^(\d+)\./.exec(ligne);
	if (numero !== null) {
		const n = (numero[1] as string).length;
		return ligne.slice(0, n) + '\\' + ligne.slice(n);
	}
	return ligne;
}

function spanDeCode(texte: string): string {
	if (texte.trim() === '') {
		throw new MarkdownNonRepresentable(
			'span de code fait d’espaces',
			'un texte portant la marque « code » et composé uniquement d’espaces n’a pas de ' +
				'forme inversible : la règle d’égalisation des espaces d’un span de code la ' +
				'reprendrait à la relecture'
		);
	}
	const cloture = AG.repeat(plusLongueSuite(texte, AG) + 1);
	const bords =
		texte.startsWith(AG) || texte.endsWith(AG) || texte.startsWith(' ') || texte.endsWith(' ');
	return cloture + (bords ? ' ' + texte + ' ' : texte) + cloture;
}

function envelopperMarque(marque: Marque, dedans: string): string {
	if (marque.type === 'link') {
		return '[' + dedans + '](' + echapperValeur(marque.attrs.href, ['(', ')']) + ')';
	}
	if (marque.type === 'lienInterne') {
		return '[[' + echapperValeur(marque.attrs.cible, ['|', ']']) + '|' + dedans + ']]';
	}
	const marqueur = MARQUEUR_DE_MARQUE[marque.type] as string;
	return marqueur + dedans + marqueur;
}

/**
 * Un nœud de texte. Les marques s'appliquent de la dernière à la première : le
 * premier élément du tableau est l'enveloppe la plus extérieure, et c'est ce
 * qui rend l'ordre du tableau relisible (piège d'identité 1).
 */
function ecrireTexte(texte: Texte): string {
	const marques = texte.marks ?? [];
	/* La règle 6 du format garantit que « code » est alors seule. */
	if (marques.some((m) => m.type === 'code')) return spanDeCode(texte.text);
	let out = echapperEnLigne(texte.text);
	for (const marque of [...marques].reverse()) out = envelopperMarque(marque, out);
	return out;
}

function ecrireEnLigne(contenu: readonly Texte[] | undefined): string {
	return protegerLesBords((contenu ?? []).map(ecrireTexte).join(''));
}

function listeDAttributs(paires: readonly (readonly [string, string | null])[]): string {
	const ecrites = paires
		.filter((p): p is readonly [string, string] => p[1] !== null)
		.map(([cle, valeur]) => cle + '="' + echapperValeur(valeur, ['"']) + '"');
	return ecrites.length === 0 ? '' : '{' + ecrites.join(' ') + '}';
}

function attributsDeTitre(ancre: string | null): string {
	if (ancre === null) return '';
	if (/^[A-Za-z0-9_-]+$/.test(ancre)) return '{#' + ancre + '}';
	return listeDAttributs([['ancre', ancre]]);
}

/**
 * Un conteneur clôturé. La clôture est plus longue que la plus longue clôture
 * des lignes qu'il porte : c'est la règle des directives de conteneur, et
 * c'est elle qui autorise l'imbrication sans ambiguïté.
 */
function conteneur(nom: string, attributs: string, dedans: readonly string[]): string[] {
	let plus = CLOTURE_MINIMALE - 1;
	for (const ligne of dedans) {
		const suite = (/^:+/.exec(ligne) ?? [''])[0].length;
		if (suite > plus) plus = suite;
	}
	const cloture = ':'.repeat(plus + 1);
	return [cloture + nom + attributs, ...dedans, cloture];
}

function frontiereNecessaire(avant: Bloc, apres: Bloc): boolean {
	return avant.type === apres.type && GENRES_DE_LISTE.includes(avant.type);
}

function ecrireBlocs(blocs: readonly Bloc[]): string[] {
	const out: string[] = [];
	blocs.forEach((bloc, i) => {
		const avant = blocs[i - 1];
		if (avant !== undefined) {
			out.push('');
			if (frontiereNecessaire(avant, bloc)) out.push(FRONTIERE, '');
		}
		out.push(...ecrireBloc(bloc));
	});
	return out;
}

function ecrireElement(blocs: readonly Bloc[], marqueur: string, alinea: number): string[] {
	const dedans = ecrireBlocs(blocs);
	return dedans.map((ligne, i) => {
		if (i === 0) return marqueur + ligne;
		return ligne === '' ? '' : ' '.repeat(alinea) + ligne;
	});
}

function ecrireTitre(titre: Titre): string[] {
	const morceaux = [
		'#'.repeat(titre.attrs.level),
		ecrireEnLigne(titre.content),
		attributsDeTitre(titre.attrs.ancre)
	];
	return [morceaux.filter((m) => m !== '').join(' ')];
}

/**
 * Le bloc de code. La chaîne d'information porte le langage TEL QUEL, sans rognage. Quand
 * il porte un saut de ligne ou un accent grave — que le format admet —, la chaîne
 * d'information ne peut pas le porter : il passe en ligne d'attributs, et rien n'est perdu.
 */
function ecrireBlocDeCode(bloc: BlocDeCode): string[] {
	const code = (bloc.content ?? []).map((t) => t.text).join('');
	const cloture = AG.repeat(Math.max(CLOTURE_MINIMALE, plusLongueSuite(code, AG) + 1));
	const langage = bloc.attrs.language;
	const enChaine = langage !== null && !langage.includes('\n') && !langage.includes(AG);
	const lignes = [cloture + (enChaine ? langage : '')];
	/* Contenu absent : aucune ligne entre les deux clôtures. Un contenu
	   présent écrit ses lignes, la clôture fournissant le dernier saut. */
	if (bloc.content !== undefined) lignes.push(...code.split('\n'));
	lignes.push(cloture);
	if (langage !== null && !enChaine) lignes.push(listeDAttributs([['language', langage]]));
	return lignes;
}

/**
 * LE DIAGRAMME — `ARB-049` décision 1, et le gel : « converti en bloc de code »
 * (`V-36:3044`). La chaîne d'information nomme le langage ; la ligne d'attributs porte
 * l'alternative textuelle de `P-06`, OBLIGATOIRE au format, qui distingue donc un
 * diagramme d'un bloc de code homonyme.
 */
function ecrireDiagramme(bloc: Diagramme): string[] {
	const { source, langage, alternative, etiquette, legende } = bloc.attrs;
	const cloture = AG.repeat(Math.max(CLOTURE_MINIMALE, plusLongueSuite(source, AG) + 1));
	return [
		cloture + langage,
		...source.split('\n'),
		cloture,
		listeDAttributs([
			['alternative', alternative],
			['etiquette', etiquette],
			['legende', legende]
		])
	];
}

function ecrireCitation(bloc: Citation): string[] {
	const dedans = ecrireBlocs(bloc.content).map((l) => (l === '' ? '>' : '> ' + l));
	const attributs = listeDAttributs([['attribution', bloc.attrs.attribution]]);
	return attributs === '' ? dedans : [...dedans, attributs];
}

function ecrireAlerte(bloc: Alerte): string[] {
	const attributs = listeDAttributs([
		['niveau', bloc.attrs.niveau],
		['glyphe', bloc.attrs.glyphe],
		['titre', bloc.attrs.titre]
	]);
	return conteneur('alerte', attributs, ecrireBlocs(bloc.content));
}

function ecrireImage(bloc: Image): string[] {
	const { src, alt, etiquette, legende } = bloc.attrs;
	const ligne =
		'![' + echapperValeur(alt, ['[', ']']) + '](' + echapperValeur(src, ['(', ')']) + ')';
	const attributs = listeDAttributs([
		['etiquette', etiquette],
		['legende', legende]
	]);
	return attributs === '' ? [ligne] : [ligne, attributs];
}

/**
 * LA FORME ÉCRITE D'UNE PIÈCE JOINTE MONTRÉE EN PLACE — le marqueur, le nom entre
 * crochets, l'adresse entre parenthèses, puis le type de média en liste
 * d'attributs. Elle est PROCHE de celle d'une image et n'en est pas une : le
 * marqueur les sépare à la lecture, et le type de média est ce qui décide du rendu.
 */
function ecrirePieceJointe(bloc: PieceJointeIntegree): string[] {
	const { src, nom, typeMedia } = bloc.attrs;
	return [
		MARQUEUR_DE_PIECE +
			echapperValeur(nom, ['[', ']']) +
			'](' +
			echapperValeur(src, ['(', ')']) +
			')',
		listeDAttributs([['type-media', typeMedia]])
	];
}

function ecrireTaches(bloc: ListeDeTaches): string[] {
	return bloc.content.flatMap((tache: Tache) =>
		/* L'alinéa d'une tâche est de DEUX espaces, non de la largeur du
		   marqueur : c'est la colonne de contenu qu'un lecteur Markdown
		   ordinaire attend d'un élément commençant par un tiret. */
		ecrireElement(tache.content, tache.attrs.checked ? '- [x] ' : '- [ ] ', 2)
	);
}

/**
 * Le tableau en barres verticales, quand la forme de GitHub sait le porter : une seule
 * ligne de tête toute en cellules d'en-tête, un corps tout en cellules ordinaires, des
 * lignes de même longueur, une cellule faite d'un seul paragraphe, et un caractère
 * numérique constant par colonne. Rend `null` dès qu'une condition manque : le tableau
 * passe alors en conteneurs, qui savent tout porter. Le caractère numérique étant une
 * propriété de CELLULE, aucune colonne hétérogène n'est écrite en barres.
 */
function tableauEnBarres(bloc: Tableau): string[] | null {
	const lignes = bloc.content;
	const tete = lignes[0];
	if (tete === undefined) return null;
	if (!tete.content.every((c) => c.type === 'tableHeader')) return null;
	const corps = lignes.slice(1);
	if (!corps.every((l) => l.content.every((c) => c.type === 'tableCell'))) return null;
	const largeur = tete.content.length;
	if (!corps.every((l) => l.content.length === largeur)) return null;
	const unParagraphe = lignes
		.flatMap((l) => l.content)
		.every((c) => {
			const premier = c.content[0];
			return c.content.length === 1 && premier !== undefined && premier.type === 'paragraph';
		});
	if (!unParagraphe) return null;
	const numeriques: boolean[] = [];
	for (let col = 0; col < largeur; col++) {
		const valeurs = corps.map((l) => {
			const cellule = l.content[col];
			return cellule !== undefined && cellule.type === 'tableCell' && cellule.attrs.numerique;
		});
		if (valeurs.some((v) => v !== valeurs[0])) return null;
		numeriques.push(valeurs[0] === true);
	}
	const texteDeCellule = (contenu: readonly Bloc[]): string => {
		const premier = contenu[0];
		if (premier === undefined || premier.type !== 'paragraph') return '';
		const texte = ecrireEnLigne(premier.content);
		return texte === '' ? PARAGRAPHE_VIDE : texte;
	};
	const ecrireLigne = (cellules: readonly { readonly content: readonly Bloc[] }[]): string =>
		'| ' + cellules.map((c) => texteDeCellule(c.content)).join(' | ') + ' |';
	return [
		ecrireLigne(tete.content),
		'| ' + numeriques.map((n) => (n ? '---:' : '---')).join(' | ') + ' |',
		...corps.map((l) => ecrireLigne(l.content))
	];
}

function tableauEnConteneurs(bloc: Tableau): string[] {
	const lignes = bloc.content.flatMap((ligne) =>
		conteneur(
			'ligne',
			'',
			ligne.content.flatMap((cellule) =>
				cellule.type === 'tableHeader'
					? conteneur('entete', '', ecrireBlocs(cellule.content))
					: conteneur(
							'cellule',
							listeDAttributs([['numerique', cellule.attrs.numerique ? 'oui' : 'non']]),
							ecrireBlocs(cellule.content)
						)
			)
		)
	);
	return conteneur('tableau', '', lignes);
}

function ecrireBloc(bloc: Bloc): string[] {
	switch (bloc.type) {
		case 'paragraph': {
			const ligne = ecrireEnLigne(bloc.content);
			return [ligne === '' ? PARAGRAPHE_VIDE : echapperLaTete(ligne)];
		}
		case 'heading':
			return ecrireTitre(bloc);
		case 'codeBlock':
			return ecrireBlocDeCode(bloc);
		case 'bulletList':
			return bloc.content.flatMap((e: ElementDeListe) => ecrireElement(e.content, '- ', 2));
		case 'orderedList':
			return bloc.content.flatMap((e: ElementDeListe, i) => {
				const marqueur = String(i + 1) + '. ';
				return ecrireElement(e.content, marqueur, marqueur.length);
			});
		case 'taskList':
			return ecrireTaches(bloc);
		case 'blockquote':
			return ecrireCitation(bloc);
		case 'alerte':
			return ecrireAlerte(bloc);
		case 'table':
			return tableauEnBarres(bloc) ?? tableauEnConteneurs(bloc);
		case 'image':
			return ecrireImage(bloc);
		case 'pieceJointe':
			return ecrirePieceJointe(bloc);
		case 'horizontalRule':
			return [SEPARATEUR_ECRIT];
		case 'diagramme':
			return ecrireDiagramme(bloc);
	}
}

/**
 * LE SENS ALLER. La valeur entre INCONNUE et sort validée : c'est `analyserDocument` qui
 * décide, et lui seul.
 *
 * @throws DocumentInvalide si le document est mal formé.
 * @throws MarkdownNonRepresentable pour la seule limite déclarée à l'en-tête.
 */
export function serialiserEnMarkdown(valeur: unknown): string {
	const document: Document = analyserDocument(valeur);
	return ecrireBlocs(document.content).join('\n') + '\n';
}

type Attributs = Readonly<Record<string, string>>;

function estLigneDAttributs(ligne: string | undefined): boolean {
	return ligne !== undefined && ligne !== FRONTIERE && /^\{.*\}$/.test(ligne);
}

/** L'inverse d'`echapperValeur`. Il ne répare rien : il déséchappe. */
function lireValeur(brut: string): string {
	let out = '';
	let i = 0;
	while (i < brut.length) {
		if (brut[i] === '\\' && i + 1 < brut.length) {
			const suivant = brut[i + 1] as string;
			out += suivant === 'n' ? '\n' : suivant;
			i += 2;
			continue;
		}
		out += brut[i];
		i += 1;
	}
	return out;
}

function lireListeDAttributs(ligne: string, numero: number): Attributs {
	const dedans = ligne.slice(1, -1);
	const attrs: Record<string, string> = {};
	let i = 0;
	while (i < dedans.length) {
		if (dedans[i] === ' ') {
			i += 1;
			continue;
		}
		if (dedans[i] === '#') {
			let j = i + 1;
			while (j < dedans.length && dedans[j] !== ' ') j += 1;
			attrs['ancre'] = dedans.slice(i + 1, j);
			i = j;
			continue;
		}
		const egal = dedans.indexOf('="', i);
		if (egal === -1) throw new MarkdownInvalide(numero, 'liste d’attributs mal formée');
		const cle = dedans.slice(i, egal);
		let j = egal + 2;
		let brut = '';
		while (j < dedans.length && dedans[j] !== '"') {
			if (dedans[j] === '\\') {
				brut += (dedans[j] as string) + (dedans[j + 1] ?? '');
				j += 2;
				continue;
			}
			brut += dedans[j];
			j += 1;
		}
		if (j >= dedans.length) {
			throw new MarkdownInvalide(numero, 'valeur d’attribut non refermée');
		}
		attrs[cle] = lireValeur(brut);
		i = j + 1;
	}
	return attrs;
}

function booleen(valeur: string | undefined): unknown {
	if (valeur === 'oui') return true;
	if (valeur === 'non') return false;
	return valeur;
}

function texteAvecMarques(texte: string, marques: readonly unknown[]): unknown {
	/* LA MARQUE `code` CHASSE LES AUTRES, PARCE QUE LE SCHÉMA L'EXIGE — elle est
	   déclarée `excludes` en ProseMirror, et un nœud qui la porte À CÔTÉ d'une
	   autre fait échouer la VALIDATION DU DOCUMENT ENTIER.

	   Ce n'est pas une subtilité de schéma : `**du `code` en gras**` et
	   `` [`x`](adresse) `` s'écrivent tous les jours, le lecteur les composait
	   fidèlement, et la note entière était alors REFUSÉE À L'IMPORT sous le motif
	   « contenu illisible » — quinze fichiers sur deux cent cinquante-cinq d'un
	   corpus réel, tous du Markdown parfaitement valide.

	   L'emboîtement est donc APLATI ICI, au seul endroit qui compose un nœud de
	   texte : le rendu faisait déjà ce choix (`spanDeCode()` ignore les autres
	   marques), et les deux se contredisaient.

	   ET L'ORDRE EST NORMALISÉ, POUR LA MÊME RAISON ET AU MÊME ENDROIT. La règle 7
	   refuse un document dont les marques sortent de l'ordre de déclaration, et
	   c'est juste POUR UN DOCUMENT ÉCRIT PAR LE PRODUIT : deux ordres y seraient
	   deux écritures d'une seule chose. Mais l'ordre des marques d'un nœud
	   ProseMirror est celui d'un ENSEMBLE, pas d'un emboîtement — l'emboîtement
	   n'existe qu'en Markdown, où `_**x**_` et `**_x_**` désignent le même texte
	   gras et italique. Faire porter le refus à la LECTURE revenait à rejeter la
	   note entière d'un fichier écrit ailleurs, sur une différence sans contenu :
	   onze fichiers d'un corpus réel, tous du Markdown ordinaire.

	   Le tri est donc à la lecture, et LE REFUS RESTE À L'ÉCRITURE — un document
	   mal ordonné que le produit composerait est toujours refusé par le schéma. */
	const retenues = marques.some((m) => typeDeMarque(m) === 'code')
		? [{ type: 'code' }]
		: [...marques].sort((g, d) => rangDe(g) - rangDe(d));
	return retenues.length === 0
		? { type: 'text', text: texte }
		: { type: 'text', text: texte, marks: retenues };
}

/** Le type d'une marque en cours de composition — elles voyagent en `unknown`. */
function typeDeMarque(marque: unknown): string {
	return typeof marque === 'object' && marque !== null
		? String((marque as { type?: unknown }).type ?? '')
		: '';
}

/**
 * LE RANG D'UNE MARQUE, LU DANS `RANG_DE_MARQUE` ET JAMAIS RECOPIÉ. Un type que la
 * table ne porte pas se range en queue : le schéma le refusera pour ce qu'il est —
 * une marque inconnue —, et non pour un ordre qui n'aurait rien voulu dire.
 */
function rangDe(marque: unknown): number {
	const rang = (RANG_DE_MARQUE as Record<string, number | undefined>)[typeDeMarque(marque)];
	return rang ?? Number.MAX_SAFE_INTEGER;
}

/** La longueur de la suite d'accents graves qui commence en `depuis`. */
function suiteDAccents(source: string, depuis: number): number {
	let n = 0;
	while (source[depuis + n] === AG) n += 1;
	return n;
}

/**
 * La position de la clôture cherchée, à partir de `depuis` — les échappements
 * et les spans de code étant sautés. Rend `-1` si elle n'y est pas.
 */
function trouverCloture(source: string, depuis: number, cloture: string): number {
	let i = depuis;
	while (i < source.length) {
		if (source[i] === '\\') {
			i += 2;
			continue;
		}
		if (source[i] === AG) {
			const n = suiteDAccents(source, i);
			const fin = finDuSpanDeCode(source, i, n);
			i = fin === -1 ? i + n : fin + n;
			continue;
		}
		if (source.startsWith(cloture, i)) return i;
		i += 1;
	}
	return -1;
}

/** La position de la clôture d'un span de code ouvert en `debut` sur `n` accents. */
function finDuSpanDeCode(source: string, debut: number, n: number): number {
	let i = debut + n;
	while (i < source.length) {
		if (source[i] !== AG) {
			i += 1;
			continue;
		}
		const suite = suiteDAccents(source, i);
		if (suite === n) return i;
		i += suite;
	}
	return -1;
}

function dedansDuSpan(brut: string): string {
	if (brut.startsWith(' ') && brut.endsWith(' ') && brut.trim() !== '') return brut.slice(1, -1);
	return brut;
}

/**
 * Les fragments d'un texte en ligne. Une construction non refermée est lue comme
 * du texte, ce que fait aussi CommonMark : l'écriture échappe tout délimiteur
 * littéral, donc ce cas ne peut venir que d'un fichier écrit à la main.
 */
function lireFragments(source: string, marques: readonly unknown[]): unknown[] {
	const out: unknown[] = [];
	let tampon = '';
	const vider = () => {
		if (tampon !== '') {
			out.push(texteAvecMarques(tampon, marques));
			tampon = '';
		}
	};
	let i = 0;
	while (i < source.length) {
		const c = source[i] as string;
		if (c === '\\' && i + 1 < source.length) {
			tampon += source[i + 1];
			i += 2;
			continue;
		}
		if (source.startsWith(ESPACE_ECRITE, i)) {
			tampon += ' ';
			i += ESPACE_ECRITE.length;
			continue;
		}
		if (c === AG) {
			const n = suiteDAccents(source, i);
			const fin = finDuSpanDeCode(source, i, n);
			if (fin !== -1) {
				vider();
				out.push(
					texteAvecMarques(dedansDuSpan(source.slice(i + n, fin)), [...marques, { type: 'code' }])
				);
				i = fin + n;
				continue;
			}
		}
		if (source.startsWith('[[', i)) {
			const fin = trouverCloture(source, i + 2, ']]');
			if (fin !== -1) {
				const dedans = source.slice(i + 2, fin);
				const barre = trouverCloture(dedans, 0, '|');
				if (barre !== -1) {
					vider();
					const cible = lireValeur(dedans.slice(0, barre));
					out.push(
						...lireFragments(dedans.slice(barre + 1), [
							...marques,
							{ type: 'lienInterne', attrs: { cible } }
						])
					);
					i = fin + 2;
					continue;
				}
			}
		}
		if (c === '[') {
			const finLibelle = trouverCloture(source, i + 1, '](');
			if (finLibelle !== -1) {
				const finDest = trouverCloture(source, finLibelle + 2, ')');
				if (finDest !== -1) {
					vider();
					const href = lireValeur(source.slice(finLibelle + 2, finDest));
					out.push(
						...lireFragments(source.slice(i + 1, finLibelle), [
							...marques,
							{ type: 'link', attrs: { href } }
						])
					);
					i = finDest + 1;
					continue;
				}
			}
		}
		const marqueur = MARQUE_PAR_MARQUEUR.find(([m]) => source.startsWith(m, i));
		if (marqueur !== undefined) {
			const fin = trouverCloture(source, i + marqueur[0].length, marqueur[0]);
			if (fin !== -1) {
				vider();
				out.push(
					...lireFragments(source.slice(i + marqueur[0].length, fin), [
						...marques,
						{ type: marqueur[1] }
					])
				);
				i = fin + marqueur[0].length;
				continue;
			}
		}
		tampon += c;
		i += 1;
	}
	vider();
	return out;
}

/** Le contenu en ligne d'un bloc, ou `undefined` s'il n'y en a pas. */
function lireEnLigne(source: string): unknown {
	const fragments = lireFragments(source, []);
	return fragments.length === 0 ? undefined : fragments;
}

function paragrapheDe(source: string): unknown {
	if (source === PARAGRAPHE_VIDE) return { type: 'paragraph' };
	const contenu = lireEnLigne(source);
	return contenu === undefined ? { type: 'paragraph' } : { type: 'paragraph', content: contenu };
}

/** Le curseur de lecture. `decalage` porte le numéro de ligne du fichier. */
interface Curseur {
	readonly lignes: readonly string[];
	readonly decalage: number;
	i: number;
}

function numero(c: Curseur): number {
	return c.decalage + c.i + 1;
}

function attributsSuivants(c: Curseur): Attributs {
	const ligne = c.lignes[c.i];
	if (!estLigneDAttributs(ligne)) return {};
	c.i += 1;
	return lireListeDAttributs(ligne as string, numero(c));
}

function noeudDeConteneur(
	nom: string,
	attrs: Attributs,
	contenu: unknown[],
	ligne: number
): unknown {
	switch (nom) {
		case 'alerte':
			return { type: 'alerte', attrs: { ...attrs }, content: contenu };
		case 'tableau':
			return { type: 'table', content: contenu };
		case 'ligne':
			return { type: 'tableRow', content: contenu };
		case 'entete':
			return { type: 'tableHeader', content: contenu };
		case 'cellule':
			return {
				type: 'tableCell',
				attrs: { ...attrs, numerique: booleen(attrs['numerique']) },
				content: contenu
			};
		default:
			throw new MarkdownInvalide(ligne, 'conteneur inconnu : « ' + nom + ' »');
	}
}

function lireConteneur(c: Curseur, cloture: string, nom: string, attributs: string): unknown {
	const ouverture = numero(c);
	const attrs = attributs === '' ? {} : lireListeDAttributs(attributs, ouverture);
	c.i += 1;
	const dedans: string[] = [];
	const depart = c.i;
	while (c.i < c.lignes.length && c.lignes[c.i] !== cloture) {
		dedans.push(c.lignes[c.i] as string);
		c.i += 1;
	}
	if (c.i >= c.lignes.length) {
		throw new MarkdownInvalide(ouverture, 'conteneur « ' + nom + ' » non refermé');
	}
	c.i += 1;
	return noeudDeConteneur(nom, attrs, lireBlocs(dedans, c.decalage + depart), ouverture);
}

function lireBlocCloture(c: Curseur, cloture: string, information: string): unknown {
	/* AUCUN NUMÉRO DE LIGNE N'EST RETENU ICI : la seule sortie qui en avait besoin
	   était le refus du bloc non refermé, et ce refus n'existe plus. */
	c.i += 1;
	const dedans: string[] = [];
	while (c.i < c.lignes.length && c.lignes[c.i] !== cloture) {
		dedans.push(c.lignes[c.i] as string);
		c.i += 1;
	}
	/* LA FIN DU DOCUMENT REFERME LE BLOC, ELLE NE LE CASSE PAS. CommonMark le dit :
	   « the fenced code block ends at the end of the containing block ». Un fichier
	   dont la clôture manque — une frappe avalée, un export tronqué — est du
	   Markdown VALIDE, et le refuser rejetait la note entière sous « contenu
	   illisible », sans que rien ne nomme la ligne fautive.

	   LE CONTENU DÉJÀ LU EST GARDÉ : ce qui a été écrit avant la fin du fichier est
	   ce que l'auteur a écrit. `c.i` est au bout, il n'y a pas de ligne d'attributs
	   à lire au-delà, et `attributsSuivants()` rend l'ensemble vide. */
	if (c.i < c.lignes.length) c.i += 1;
	const attrs = attributsSuivants(c);
	const texte = dedans.join('\n');
	if (attrs['alternative'] !== undefined) {
		/* L'étiquette et la légende sont ABSENTES de la ligne d'attributs quand
		   elles sont nulles : la règle 2 du format les veut présentes, et une
		   valeur absente s'y écrit `null`. Toute autre clé passe telle quelle,
		   et le schéma la refuse. */
		return {
			type: 'diagramme',
			attrs: {
				...attrs,
				source: texte,
				langage: information,
				etiquette: attrs['etiquette'] ?? null,
				legende: attrs['legende'] ?? null
			}
		};
	}
	const langage = information !== '' ? information : (attrs['language'] ?? null);
	const contenu = dedans.length === 0 ? undefined : [{ type: 'text', text: texte }];
	return contenu === undefined
		? { type: 'codeBlock', attrs: { language: langage } }
		: { type: 'codeBlock', attrs: { language: langage }, content: contenu };
}

/**
 * Le suffixe d'attributs d'un titre, s'il y en a un. Le relevé se fait par ESSAI
 * DE LECTURE et non par expression régulière : une valeur d'attribut peut porter
 * une accolade fermante, qu'aucun motif court ne saurait borner.
 */
function suffixeDAttributs(texte: string): string | null {
	for (let i = 0; i < texte.length; i++) {
		if (texte[i] === '\\') {
			i += 1;
			continue;
		}
		if (texte[i] !== '{' || !texte.endsWith('}')) continue;
		const candidat = texte.slice(i);
		try {
			lireListeDAttributs(candidat, 0);
			return candidat;
		} catch {
			/* Ce n'était pas une liste d'attributs : on continue de chercher. */
		}
	}
	return null;
}

function lireTitre(c: Curseur, diese: string, reste: string): unknown {
	const ligne = numero(c);
	c.i += 1;
	let texte = reste;
	let ancre: string | null = null;
	const groupe = suffixeDAttributs(texte);
	if (groupe !== null) {
		const attrs = lireListeDAttributs(groupe, ligne);
		ancre = attrs['ancre'] ?? null;
		texte = texte.slice(0, texte.length - groupe.length).replace(/ $/, '');
	}
	const contenu = lireEnLigne(texte);
	const attrs = { level: diese.length, ancre };
	return contenu === undefined
		? { type: 'heading', attrs }
		: { type: 'heading', attrs, content: contenu };
}

function lireCitation(c: Curseur): unknown {
	const depart = c.i;
	const dedans: string[] = [];
	while (c.i < c.lignes.length) {
		const ligne = c.lignes[c.i] as string;
		if (ligne === '>') dedans.push('');
		else if (ligne.startsWith('> ')) dedans.push(ligne.slice(2));
		else break;
		c.i += 1;
	}
	const attrs = attributsSuivants(c);
	return {
		type: 'blockquote',
		attrs: { ...attrs, attribution: attrs['attribution'] ?? null },
		content: lireBlocs(dedans, c.decalage + depart)
	};
}

function marqueurDElement(
	ligne: string
): { genre: string; marqueur: string; alinea: number } | null {
	const tache = /^- \[([ x])\] /.exec(ligne);
	if (tache !== null) return { genre: 'taskList', marqueur: tache[0], alinea: 2 };
	if (ligne.startsWith('- ')) return { genre: 'bulletList', marqueur: '- ', alinea: 2 };
	const numerote = /^\d+\. /.exec(ligne);
	if (numerote !== null) {
		return { genre: 'orderedList', marqueur: numerote[0], alinea: numerote[0].length };
	}
	return null;
}

function lireListe(c: Curseur, genre: string): unknown {
	const elements: unknown[] = [];
	while (c.i < c.lignes.length) {
		const ligne = c.lignes[c.i] as string;
		const marqueur = marqueurDElement(ligne);
		if (marqueur === null || marqueur.genre !== genre) break;
		const depart = c.i;
		const alinea = ' '.repeat(marqueur.alinea);
		const dedans = [ligne.slice(marqueur.marqueur.length)];
		c.i += 1;
		while (c.i < c.lignes.length) {
			const suite = c.lignes[c.i] as string;
			if (suite.startsWith(alinea)) {
				dedans.push(suite.slice(alinea.length));
				c.i += 1;
				continue;
			}
			if (suite === '') {
				/* Une ligne vide ne clôt l'élément que si ce qui suit n'est plus
				   dans son alinéa : un élément de plusieurs blocs en porte. */
				let j = c.i;
				while (j < c.lignes.length && c.lignes[j] === '') j += 1;
				if (j < c.lignes.length && (c.lignes[j] as string).startsWith(alinea)) {
					while (c.i < j) {
						dedans.push('');
						c.i += 1;
					}
					continue;
				}
			}
			break;
		}
		const contenu = lireBlocs(dedans, c.decalage + depart);
		elements.push(
			genre === 'taskList'
				? {
						type: 'taskItem',
						attrs: { checked: marqueur.marqueur.includes('x') },
						content: contenu
					}
				: { type: 'listItem', content: contenu }
		);
	}
	return genre === 'taskList'
		? { type: 'taskList', content: elements }
		: { type: genre, content: elements };
}

function decouperEnCellules(ligne: string): string[] {
	const morceaux: string[] = [];
	let courant = '';
	let i = 0;
	while (i < ligne.length) {
		if (ligne[i] === '\\') {
			courant += ligne.slice(i, i + 2);
			i += 2;
			continue;
		}
		if (ligne[i] === '|') {
			morceaux.push(courant);
			courant = '';
			i += 1;
			continue;
		}
		courant += ligne[i];
		i += 1;
	}
	morceaux.push(courant);
	/* La première et la dernière barre bordent la ligne : les deux morceaux
	   qu'elles produisent sont vides et ne sont pas des cellules. */
	return morceaux.slice(1, -1).map((m) => m.replace(/^ /, '').replace(/ $/, ''));
}

function estFilet(ligne: string | undefined): boolean {
	return ligne !== undefined && /^\|(\s*:?-{3,}:?\s*\|)+$/.test(ligne);
}

function lireTableau(c: Curseur): unknown {
	const tete = decouperEnCellules(c.lignes[c.i] as string);
	const filet = decouperEnCellules(c.lignes[c.i + 1] as string);
	const numeriques = filet.map((f) => f.endsWith(':'));
	c.i += 2;
	const celluleDe = (texte: string, col: number, entete: boolean): unknown => {
		const contenu = [paragrapheDe(texte)];
		return entete
			? { type: 'tableHeader', content: contenu }
			: { type: 'tableCell', attrs: { numerique: numeriques[col] === true }, content: contenu };
	};
	const lignes: unknown[] = [
		{ type: 'tableRow', content: tete.map((t, col) => celluleDe(t, col, true)) }
	];
	while (c.i < c.lignes.length && (c.lignes[c.i] as string).startsWith('|')) {
		const cellules = decouperEnCellules(c.lignes[c.i] as string);
		lignes.push({
			type: 'tableRow',
			content: cellules.map((t, col) => celluleDe(t, col, false))
		});
		c.i += 1;
	}
	return { type: 'table', content: lignes };
}

function lirePieceJointe(c: Curseur, ligne: string): unknown {
	const debut = MARQUEUR_DE_PIECE.length;
	const finNom = trouverCloture(ligne, debut, '](');
	if (finNom === -1) return null;
	const finSrc = trouverCloture(ligne, finNom + 2, ')');
	if (finSrc === -1 || finSrc !== ligne.length - 1) return null;
	c.i += 1;
	const attrs = attributsSuivants(c);
	/* LA LIGNE D'ATTRIBUTS N'EST PAS RÉPANDUE TELLE QUELLE, contrairement à celle
	   d'une image : sa seule clé porte un nom écrit en deux mots, et l'attribut du
	   nœud en porte un seul. Les répandre ferait entrer une clé que le schéma
	   refuse — et le refus nommerait l'attribut, jamais la ligne. */
	return {
		type: 'pieceJointe',
		attrs: {
			src: lireValeur(ligne.slice(finNom + 2, finSrc)),
			nom: lireValeur(ligne.slice(debut, finNom)),
			typeMedia: attrs['type-media'] ?? ''
		}
	};
}

function lireImage(c: Curseur, ligne: string): unknown {
	const finAlt = trouverCloture(ligne, 2, '](');
	if (finAlt === -1) return null;
	const finSrc = trouverCloture(ligne, finAlt + 2, ')');
	if (finSrc === -1 || finSrc !== ligne.length - 1) return null;
	c.i += 1;
	const attrs = attributsSuivants(c);
	return {
		type: 'image',
		attrs: {
			...attrs,
			src: lireValeur(ligne.slice(finAlt + 2, finSrc)),
			alt: lireValeur(ligne.slice(2, finAlt)),
			etiquette: attrs['etiquette'] ?? null,
			legende: attrs['legende'] ?? null
		}
	};
}

/**
 * LES BLOCS D'UNE SUITE DE LIGNES. Aucun nœud n'est corrigé ni complété : ce
 * qui sort d'ici est soumis tel quel au schéma, qui refuse ce qui est mal
 * formé (attribut manquant, clé inconnue, imbrication interdite).
 */
function lireBlocs(lignes: readonly string[], decalage: number): unknown[] {
	const c: Curseur = { lignes, decalage, i: 0 };
	const blocs: unknown[] = [];
	while (c.i < c.lignes.length) {
		const ligne = c.lignes[c.i] as string;
		if (ligne.trim() === '' || ligne === FRONTIERE) {
			c.i += 1;
			continue;
		}
		const conteneurOuvert = /^(:{3,})([a-z]+)(\{.*\})?$/.exec(ligne);
		if (conteneurOuvert !== null) {
			blocs.push(
				lireConteneur(
					c,
					conteneurOuvert[1] as string,
					conteneurOuvert[2] as string,
					conteneurOuvert[3] ?? ''
				)
			);
			continue;
		}
		const clotureDeBloc = new RegExp('^(' + AG + '{3,})(.*)$').exec(ligne);
		/* Une chaîne d'information ne porte JAMAIS d'accent grave — c'est la règle de
		   CommonMark, et c'est ce qui distingue l'ouverture d'un bloc d'un PARAGRAPHE QUI
		   COMMENCE PAR UN SPAN DE CODE porteur d'accents graves : celui-là ferme son span sur
		   la même ligne. Un langage porteur d'un accent grave passe en ligne d'attributs. */
		if (clotureDeBloc !== null && !(clotureDeBloc[2] as string).includes(AG)) {
			blocs.push(lireBlocCloture(c, clotureDeBloc[1] as string, clotureDeBloc[2] as string));
			continue;
		}
		const titre = /^(#{1,6})(?: (.*))?$/.exec(ligne);
		if (titre !== null) {
			blocs.push(lireTitre(c, titre[1] as string, titre[2] ?? ''));
			continue;
		}
		if (/^(\*{3,}|-{3,})$/.test(ligne)) {
			c.i += 1;
			blocs.push({ type: 'horizontalRule' });
			continue;
		}
		if (ligne === '>' || ligne.startsWith('> ')) {
			blocs.push(lireCitation(c));
			continue;
		}
		if (ligne.startsWith(MARQUEUR_DE_PIECE)) {
			const piece = lirePieceJointe(c, ligne);
			if (piece !== null) {
				blocs.push(piece);
				continue;
			}
		}
		if (ligne.startsWith('![')) {
			const image = lireImage(c, ligne);
			if (image !== null) {
				blocs.push(image);
				continue;
			}
		}
		if (ligne.startsWith('|') && estFilet(c.lignes[c.i + 1])) {
			blocs.push(lireTableau(c));
			continue;
		}
		const marqueur = marqueurDElement(ligne);
		if (marqueur !== null) {
			blocs.push(lireListe(c, marqueur.genre));
			continue;
		}
		c.i += 1;
		blocs.push(paragrapheDe(ligne));
	}
	return blocs;
}

/**
 * LE SENS RETOUR. Le texte reçu est le CORPS SEUL — l'en-tête de métadonnées appartient à
 * l'export et à l'import, voir la couture à l'en-tête du module. La valeur construite ne
 * sort pas d'ici sans passer par `analyserDocument` : un document structurellement
 * invalide ne peut donc pas entrer par l'import, ce qu'`ADR-003` interdit nommément.
 *
 * @throws MarkdownInvalide si le texte ne se lit pas.
 * @throws DocumentInvalide si ce qu'il décrit n'est pas un document.
 */
export function analyserMarkdown(texte: string): Document {
	return analyserDocument({ type: 'doc', content: lireBlocs(texte.split('\n'), 0) });
}

/**
 * Le Markdown tel qu'un formulaire de navigateur l'envoie — et la seule chose que cette
 * fonction défait. Le sérialiseur de formulaire normalise TOUTE fin de ligne en couple
 * retour chariot + saut avant d'encoder le corps de la requête : le même texte envoyé par
 * appel direct s'analyse ; envoyé par l'écran, il rendait `422`.
 *
 * POURQUOI PAS DANS `analyserMarkdown()`, QUI SEMBLE L'ENDROIT ÉVIDENT : le format REFUSE
 * un retour chariot dans un bloc de code (`RG-M04-05`), et ce refus est tenu À L'ENTRÉE.
 * Normaliser dans l'analyseur l'aurait rendu INERTE en réussissant. La normalisation est
 * donc posée à la FRONTIÈRE DE TRANSPORT, où elle défait un artefact d'encodage et rien
 * d'autre. ELLE A DEUX LECTEURS, PAS UN : `../donnees/creation.ts` et
 * `../donnees/edition.ts` — une parade tenue par un seul appelant est une exception.
 */
export function markdownDeFormulaire(texte: string): string {
	return texte.replace(/\r\n/g, '\n');
}

/**
 * L'expression d'une ligne qui n'est QU'UNE IMAGE SANS ALTERNATIVE : le point
 * d'exclamation, les deux crochets vides, puis la source entre parenthèses jusqu'au
 * bout de la ligne. Le groupe capture la source.
 */
const IMAGE_SANS_ALTERNATIVE = /^!\[\]\((.+)\)$/;

/**
 * LE MARKDOWN TEL QU'UN FICHIER ÉTRANGER L'APPORTE — et la seule chose que cette
 * fonction défait : l'image dont l'alternative textuelle est vide.
 *
 * `P-06` l'exige non vide sur tout contenu graphique, et le schéma refuse le
 * document sans elle. LE REFUS EST JUSTE POUR CE QUE LE PRODUIT ÉCRIT : son éditeur
 * demande l'alternative, et une image posée sans elle est un manquement que rien ne
 * doit laisser passer. IL NE L'EST PAS POUR CE QU'IL LIT : un fichier écrit ailleurs
 * porte des images sans alternative, et refuser le document ENTIER pour cela ne rend
 * l'image accessible à personne — il fait perdre la note.
 *
 * L'ALTERNATIVE DE SECOURS EST LE NOM DU FICHIER POINTÉ, jamais un texte inventé :
 * c'est la seule description que le document porte, elle se lit comme le pis-aller
 * qu'elle est, et elle se corrige dans l'éditeur.
 *
 * POURQUOI PAS DANS `analyserMarkdown()` : pour la raison qui y garde déjà la
 * normalisation des fins de ligne — l'analyseur tient les refus À L'ENTRÉE, et une
 * réparation posée en son sein les rendrait INERTES pour tout le monde, l'éditeur
 * compris. La réparation est donc à la FRONTIÈRE D'IMPORT, et son unique lecteur est
 * le classement d'un lot.
 */
export function markdownImporte(texte: string): string {
	return texte
		.split('\n')
		.map((ligne) => {
			const image = IMAGE_SANS_ALTERNATIVE.exec(ligne);
			if (image === null) return ligne;
			const source = image[1] as string;
			const nom = source.slice(source.lastIndexOf('/') + 1);
			/* Une source qui ne laisse aucun nom — elle finit par une barre — n'a rien
			   à donner : la ligne repart telle quelle, et le schéma la refusera. */
			return nom === '' ? ligne : `![${nom}](${source})`;
		})
		.join('\n');
}
