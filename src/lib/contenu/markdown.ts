/**
 * LE CONVERTISSEUR UNIQUE `document ⇄ Markdown` — L'IMPLÉMENTATION UNIQUE.
 *
 * `ADR-004`, acceptée le 18 août 2026 : « il existe UNE SEULE implémentation de
 * la conversion `document ⇄ Markdown`, dans l'application. L'import l'utilise
 * dans un sens, l'export dans l'autre. » Ce module EST cette implémentation.
 *
 * DEUX FONCTIONS, ET AUCUNE AUTRE PORTE. `serialiserEnMarkdown` et
 * `analyserMarkdown` sont les seuls exports exécutables ; tout le reste est
 * privé au module. Les deux passent par `analyserDocument` — l'aller valide
 * avant d'écrire, le retour valide avant de rendre —, de sorte qu'aucun
 * document non validé n'entre ni ne sort : c'est l'interdit d'`ADR-003` sur
 * « toute écriture directe en base d'un document non validé », et c'est le
 * motif de tenue de `rendu.ts`, qui prend lui aussi une valeur INCONNUE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE MESURE LA BATTERIE 4, ET POURQUOI ELLE DÉCIDE DE TOUT
 *
 * `RG-M13-01` (`CAHIER-DES-CHARGES-FONCTIONNEL.md` l. 1113) : « l'export est
 * réimportable […] C'est le critère de réussite principal. » La propriété est
 * une IDENTITÉ : pour tout document du corpus, `analyserMarkdown` de
 * `serialiserEnMarkdown` rend le document d'origine. `STACK-TECHNIQUE.md`
 * l. 461 (`R-05`) en tire la conséquence : « un aller-retour non idempotent
 * fait échouer la construction ».
 *
 * Aucune normalisation n'intervient avant comparaison, et ce n'est pas un
 * hasard : chaque convention ci-dessous a été choisie pour que l'aller-retour
 * soit l'identité SANS retouche. Les deux endroits où le Markdown ordinaire
 * perdrait de l'information sont traités par une convention, jamais par un
 * arrondi — voir « LES DEUX PIÈGES D'IDENTITÉ » plus bas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE GEL FIXE, ET QUI N'ÉTAIT PAS À DÉCIDER (ARB-049)
 *
 *   DIAGRAMME  « 1 diagramme — converti en bloc de code, sans rendu
 *              graphique » — `mockups/V-36-console-exports.html:3044`. Le
 *              diagramme est donc un bloc clôturé dont la chaîne
 *              d'information nomme le langage.
 *   LIEN INTERNE  la famille des doubles crochets — `V-17-editeur.html:1576`
 *              (le raccourci du bouton « Lien interne »), `:1585` (l'invite
 *              « … pour lier une autre note ») et `:3191` (l'entrée de menu
 *              du même nom). Il porte l'IDENTIFIANT de la cible, jamais son
 *              titre : `ADR-003` interdit nommément l'inverse.
 *   SÉPARATEUR  trois tirets EN FRAPPE — la table `RACCOURCIS` de
 *              `V-17-editeur.html:3147` et celle de
 *              `V-18-editeur-operationnel.html:3120` les associent toutes
 *              deux au séparateur. C'est une affordance de frappe (T-021),
 *              pas un format de fichier : la LECTURE l'honore — trois tirets
 *              seuls sur leur ligne sont lus comme un séparateur —,
 *              l'ÉCRITURE emploie trois astérisques, pour la raison dite au
 *              paragraphe suivant.
 *
 * LA COUTURE AVEC L'EN-TÊTE DE MÉTADONNÉES — obligation d'ARB-049 décision 5.
 * `V-36:2929` décrit « Type, étiquettes, auteur, date de dernière
 * vérification, visibilité et propriétés de fiche, dans un bloc de trois
 * tirets en tête de fichier. C'est ce bloc qui rend l'archive réimportable. »
 * CE BLOC N'EST PAS DE CE MODULE : il porte les métadonnées de la NOTE, il
 * appartient à `T-045` (export) et `T-043` (import). Le contrat est donc :
 *
 *   • `serialiserEnMarkdown` rend le CORPS SEUL, sans en-tête, et ne commence
 *     JAMAIS par une ligne de trois tirets — le séparateur s'écrit en
 *     astérisques. La collision qu'ARB-049 demandait de traiter est donc
 *     IMPOSSIBLE par construction, et non pas seulement improbable.
 *   • `analyserMarkdown` reçoit le CORPS SEUL. C'est à l'appelant de retirer
 *     l'en-tête s'il y en a un. Trois tirets reçus ici sont un séparateur.
 *
 * Aucun lot ultérieur n'a donc à écrire un second analyseur : il retire
 * l'en-tête, et passe le reste ici (`ADR-004` interdit l'autre chemin).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UNE TROISIÈME SÉRIALISATION EXISTE DANS LE GEL, ET IL FALLAIT LA CHERCHER
 *
 * `ARB-049` retient deux formes du gel. Il en existe une troisième, trouvée en
 * cherchant plutôt qu'en supposant (`P-21`) : `window.blocEnLignes` de
 * `mockups/V-16-comparaison.html:1864-1878` — « représentation linéaire d'un
 * bloc, façon texte source. C'est elle qui est comparée ligne à ligne en mode
 * Texte ». Elle écrit, et ce sont ses lignes exactes :
 *
 *   titre        deux ou trois dièses, puis le texte      ← MÊME FAMILLE
 *   liste        un tiret, puis l'élément                 ← MÊME FAMILLE
 *   tâche        un tiret, une case vide, puis l'élément  ← MÊME FAMILLE
 *   code         clôture d'accents graves + langage       ← MÊME FAMILLE
 *   alerte       conteneur de deux-points, nom = niveau   ← MÊME FAMILLE
 *   figure       forme d'image, puis la légende           ← MÊME FAMILLE
 *   tableau      lignes de barres verticales              ← MÊME FAMILLE
 *
 * SIX FAMILLES SUR SEPT SONT CELLES RETENUES ICI, y compris le conteneur de
 * deux-points pour l'alerte — choisi d'abord pour sa parenté avec
 * remark-directive, et qui se trouve être celui du gel.
 *
 * CE QU'ELLE N'EST PAS, ET C'EST POURQUOI ELLE NE FAIT PAS LOI SUR L'EXPORT.
 * Son entrée est le `BlocDeContenu` de `seeds/corpus.ts` (l. 309-331) — la
 * forme des versions anciennes de V-16, que T-014 a refusé de transposer —, et
 * non le document canonique. Elle est irréversible par construction : elle ne
 * porte ni le glyphe d'une alerte (`P-7.2`, `RG-M18-09`), ni la source d'une
 * image, ni l'ancre d'un titre, ni l'état coché d'une tâche, ni la ligne de
 * filet d'un tableau. `ARB-049` décision 4 refuse justement ces pertes.
 *
 * LES DEUX ENDROITS OÙ CE MODULE S'EN ÉCARTE, DÉCLARÉS PLUTÔT QUE TAIS :
 *
 *  1. L'ALERTE. Le gel nomme le conteneur d'après le NIVEAU et pose le titre
 *     nu derrière. Ici, le conteneur porte le nom du NŒUD — `alerte`, le nom
 *     français qu'`ADR-003` lui donne — et ses trois attributs en liste. Motif :
 *     le glyphe doit survivre, et une seule mécanique d'attributs vaut mieux
 *     que deux. Un arbitrage qui préférerait la forme du gel n'aurait qu'à
 *     déplacer le niveau dans le nom : le reste ne bouge pas.
 *  2. LE TABLEAU. Le gel n'écrit pas de ligne de filet ; sans elle, ni la
 *     ligne de tête ni le caractère numérique d'une colonne ne se relisent.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES CONVENTIONS MAISON, ET LEUR MOTIF (ARB-049 décision 3)
 *
 * Elles sont autorisées à trois conditions : documentées à l'implémentation
 * unique — ce commentaire —, lisibles par un humain (le gel promet « lisible
 * dans n'importe quel éditeur de texte », `V-36:2923`), et fidèles.
 *
 *   ancre d'un titre      la liste d'attributs de Pandoc et de kramdown,
 *                         accolée au titre. L'ancre est un identifiant de
 *                         document (`V-14:1528` écrit `id="s-avant"`), et
 *                         c'est la forme que ces deux outils lui donnent.
 *   souligné              deux signes plus de chaque côté. Deux tirets bas
 *                         sont REFUSÉS : tout lecteur Markdown y voit du
 *                         gras — un humain serait trompé, ce que la décision
 *                         4 refuse au même titre qu'une perte.
 *   surligné              deux signes égal de chaque côté — la forme
 *                         d'Obsidian et du greffon `mark`, la plus répandue.
 *   italique              un tiret bas, et non une astérisque : voir « LES
 *                         DEUX PIÈGES D'IDENTITÉ », piège 1.
 *   attribut sans place   une LIGNE D'ATTRIBUTS collée sous le bloc —
 *                         attribution d'une citation, étiquette et légende
 *                         d'une figure, alternative textuelle d'un
 *                         diagramme, langage impossible à écrire en chaîne
 *                         d'information. Les clés sont EXACTEMENT les noms
 *                         d'attributs du format canonique : une clé inconnue
 *                         n'est donc pas ignorée, elle est refusée par le
 *                         schéma.
 *   alerte, et tableau
 *   à cellules riches     un CONTENEUR clôturé par des deux-points, de la
 *                         famille des directives de conteneur
 *                         (remark-directive, divs clôturés de Pandoc, MyST).
 *                         Le nom du conteneur est français, comme le nœud
 *                         qu'il porte.
 *   paragraphe vide       une ligne portant une seule contre-oblique, la
 *                         forme que Pandoc donne à une ligne vide. Le format
 *                         l'admet (`content` est optionnel) et l'éditeur en
 *                         produit — `V-17:3077` insère un paragraphe vide
 *                         après chaque séparateur.
 *   frontière de blocs    une ligne d'accolades vides entre deux listes
 *                         ADJACENTES DE MÊME GENRE, que rien d'autre ne
 *                         saurait séparer : sans elle, la relecture n'en
 *                         verrait qu'une.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX PIÈGES D'IDENTITÉ, ET LEUR PARADE
 *
 *  1. L'ORDRE DES MARQUES. `marks: [bold, italic]` et `marks: [italic, bold]`
 *     sont deux tableaux différents, donc deux documents différents au sens du
 *     JSON stocké. Or l'astérisque simple et la double FUSIONNENT : une suite
 *     de trois serait la sortie des deux, et la relecture n'en rendrait qu'un
 *     — l'aller-retour cesserait d'être l'identité pour l'autre. La parade
 *     n'est pas de normaliser l'ordre (ce serait une perte), c'est de choisir
 *     le tiret bas pour l'italique : les deux imbrications se relisent alors
 *     chacune dans son ordre. L'ordre du tableau est l'ordre d'imbrication,
 *     le premier étant le plus extérieur.
 *  2. LES BORDS D'UN TEXTE. Une espace en tête ou en fin de ligne est
 *     invisible et Markdown la mange. Elle s'écrit donc en entité numérique,
 *     et l'esperluette s'échappe partout ailleurs pour que cette entité ne
 *     soit jamais ambiguë. C'est la seule entité que ce module écrit et lit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI N'EST PAS RÉPARÉ, ET C'EST LE POINT
 *
 * `RG-M04-05` veut d'un bloc de code « exactement ce que l'utilisateur
 * collera dans son terminal », et `document.ts` règle 5 tient l'exigence PAR
 * REFUS À L'ENTRÉE : un retour chariot y est rejeté par le schéma. Ce module
 * ne normalise donc RIEN : il découpe les lignes sur le seul saut de ligne,
 * laisse les retours chariot où ils sont, et `analyserDocument` refuse le
 * document. Un nettoyage ici serait la « correction appliquée d'un seul côté
 * de l'aller-retour » qu'`ADR-004` interdit nommément, et il masquerait un
 * fichier faux.
 *
 * De même, une liste d'attributs porteuse d'une clé que le format ne connaît
 * pas n'est pas filtrée : elle est transmise au schéma, qui la refuse.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SEULE LIMITE DE REPRÉSENTATION, DÉCLARÉE ET LEVÉE BRUYAMMENT
 *
 * Un texte portant la marque `code` et composé UNIQUEMENT D'ESPACES n'a pas
 * de forme en Markdown : la règle d'égalisation des espaces d'un span de code
 * (une espace de chaque bord est retirée si les deux bords en portent et que
 * le contenu n'est pas fait que d'espaces) rend l'écriture non inversible.
 * `serialiserEnMarkdown` lève alors `MarkdownNonRepresentable` : la
 * construction « se déclare et se compte » (ARB-049 décision 4), elle ne se
 * dégrade pas en silence. Zéro occurrence au corpus, et le cas est éprouvé
 * en unitaire.
 */
import {
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
	type Tableau,
	type Tache,
	type Texte,
	type Titre
} from './document';

/* ═════════════════════════════════════════════ Les formes littérales ════ */

/**
 * L'ACCENT GRAVE, JAMAIS ÉCRIT EN CLAIR AILLEURS QU'ICI. `P-17` de
 * `CLAUDE.md` §6 : un accent grave dans un modèle littéral ferme le modèle, et
 * l'erreur remonte à cent lignes de la cause. Ce module écrit des blocs
 * clôturés : la parade est de ne taper le caractère qu'une fois.
 */
const AG = '`';

/** La longueur minimale d'une clôture de BLOC (un span de code n'en a pas). */
const CLOTURE_MINIMALE = 3;

/** Le séparateur écrit — voir la couture avec l'en-tête de métadonnées. */
const SEPARATEUR_ECRIT = '***';

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
 * Les caractères échappés PARTOUT dans un texte en ligne. Chacun ouvre une
 * construction : la contre-oblique l'échappement, l'esperluette l'entité,
 * l'accent grave un span de code, l'astérisque le gras, le tiret bas
 * l'italique, les crochets les deux familles de liens, la barre verticale une
 * cellule de tableau, l'accolade une liste d'attributs.
 */
const TOUJOURS_ECHAPPES: readonly string[] = ['\\', '&', AG, '*', '_', '[', ']', '|', '{'];

/** Les caractères qui n'ouvrent une construction qu'en PAIRE. */
const ECHAPPES_EN_PAIRE: readonly string[] = ['=', '+', '~'];

/** Les caractères qui n'ouvrent une construction qu'EN TÊTE DE LIGNE. */
const ECHAPPES_EN_TETE: readonly string[] = ['#', '>', '-', ':'];

/** Les trois genres de liste, et leur adjacence indistinguable. */
const GENRES_DE_LISTE: readonly string[] = ['bulletList', 'orderedList', 'taskList'];

/* ═════════════════════════════════════════════════ Les deux refus ═══════ */

/** Un Markdown que ce module ne sait pas lire. Il ne devine jamais. */
export class MarkdownInvalide extends Error {
	/** La ligne du texte reçu, à partir de 1. */
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
	/** Le cas, tel que l'en-tête du module l'énumère. */
	readonly cas: string;

	constructor(cas: string, message: string) {
		super('document non représentable en Markdown (' + cas + ') : ' + message);
		this.name = 'MarkdownNonRepresentable';
		this.cas = cas;
	}
}

/* ═════════════════════════════════════ ALLER — l'échappement du texte ═══ */

/** La plus longue suite du caractère donné, dans le texte donné. */
function plusLongueSuite(texte: string, caractere: string): number {
	let plus = 0;
	let suite = 0;
	for (const c of texte) {
		suite = c === caractere ? suite + 1 : 0;
		if (suite > plus) plus = suite;
	}
	return plus;
}

/** Un texte en ligne, rendu inoffensif sans rien perdre. */
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

/** Les espaces des bords, écrites en entité — piège d'identité 2. */
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

/* ═══════════════════════════════════ ALLER — les textes et les marques ══ */

/** Un span de code : la seule construction dont le contenu n'est pas échappé. */
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

/* ═══════════════════════════════════════ ALLER — les listes d'attributs ═ */

/** Une liste d'attributs, ou la chaîne vide s'il n'y a rien à écrire. */
function listeDAttributs(paires: readonly (readonly [string, string | null])[]): string {
	const ecrites = paires
		.filter((p): p is readonly [string, string] => p[1] !== null)
		.map(([cle, valeur]) => cle + '="' + echapperValeur(valeur, ['"']) + '"');
	return ecrites.length === 0 ? '' : '{' + ecrites.join(' ') + '}';
}

/** L'ancre d'un titre : le raccourci d'identifiant quand elle s'y prête. */
function attributsDeTitre(ancre: string | null): string {
	if (ancre === null) return '';
	if (/^[A-Za-z0-9_-]+$/.test(ancre)) return '{#' + ancre + '}';
	return listeDAttributs([['ancre', ancre]]);
}

/* ═══════════════════════════════════════════ ALLER — les conteneurs ═════ */

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

/* ═══════════════════════════════════════════════ ALLER — les blocs ══════ */

/** Deux listes de même genre, côte à côte, ne se distinguent pas sans frontière. */
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

/** Les blocs d'un élément de liste, préfixés du marqueur puis de l'alinéa. */
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
 * Le bloc de code. La chaîne d'information porte le langage TEL QUEL, sans
 * rognage : un langage porteur d'une espace de bord survit ainsi. Quand il
 * porte un saut de ligne ou un accent grave — que le format admet, `language`
 * n'étant qu'un texte non vide —, la chaîne d'information ne peut pas le
 * porter : il passe alors en ligne d'attributs, et rien n'est perdu.
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
 * LE DIAGRAMME — `ARB-049` décision 1, et le gel : « converti en bloc de
 * code » (`V-36:3044`). La chaîne d'information nomme le langage ; la ligne
 * d'attributs porte l'alternative textuelle de `P-06`, qui est OBLIGATOIRE au
 * format et qui distingue donc un diagramme d'un bloc de code homonyme.
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

function ecrireTaches(bloc: ListeDeTaches): string[] {
	return bloc.content.flatMap((tache: Tache) =>
		/* L'alinéa d'une tâche est de DEUX espaces, non de la largeur du
		   marqueur : c'est la colonne de contenu qu'un lecteur Markdown
		   ordinaire attend d'un élément commençant par un tiret. */
		ecrireElement(tache.content, tache.attrs.checked ? '- [x] ' : '- [ ] ', 2)
	);
}

/**
 * LE TABLEAU EN BARRES VERTICALES, quand la forme de GitHub sait le porter :
 * une seule ligne de tête, toute en cellules d'en-tête, un corps tout en
 * cellules ordinaires, des lignes de même longueur, une cellule faite d'un
 * seul paragraphe, et un caractère numérique constant par colonne — que la
 * ligne de filet exprime par l'alignement à droite.
 *
 * Rend `null` dès qu'une de ces conditions manque : le tableau passe alors en
 * conteneurs, qui savent tout porter. Le caractère numérique étant une
 * propriété de CELLULE au format, aucune colonne hétérogène n'est écrite en
 * barres — l'alignement mentirait.
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

/** Le tableau en conteneurs — la forme qui sait tout porter. */
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
		case 'horizontalRule':
			return [SEPARATEUR_ECRIT];
		case 'diagramme':
			return ecrireDiagramme(bloc);
	}
}

/**
 * LE SENS ALLER. La valeur entre INCONNUE et sort validée : c'est
 * `analyserDocument` qui décide, et lui seul — aucun document non validé ne
 * se sérialise.
 *
 * @throws DocumentInvalide si le document est mal formé.
 * @throws MarkdownNonRepresentable pour la seule limite déclarée à l'en-tête.
 */
export function serialiserEnMarkdown(valeur: unknown): string {
	const document: Document = analyserDocument(valeur);
	return ecrireBlocs(document.content).join('\n') + '\n';
}

/* ═══════════════════════════════════ RETOUR — la lecture des attributs ══ */

/** Les attributs relevés sur une ligne d'attributs, valeurs déjà déséchappées. */
type Attributs = Readonly<Record<string, string>>;

/** Une ligne d'attributs, et jamais la frontière de blocs. */
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

/** Le booléen d'un attribut. Toute autre valeur est transmise telle quelle. */
function booleen(valeur: string | undefined): unknown {
	if (valeur === 'oui') return true;
	if (valeur === 'non') return false;
	return valeur;
}

/* ═══════════════════════════════════ RETOUR — les textes et les marques ═ */

/** Le nœud de texte, avec ses marques dans l'ordre d'imbrication. */
function texteAvecMarques(texte: string, marques: readonly unknown[]): unknown {
	return marques.length === 0
		? { type: 'text', text: texte }
		: { type: 'text', text: texte, marks: [...marques] };
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

/** La règle d'égalisation des espaces d'un span de code, en lecture. */
function dedansDuSpan(brut: string): string {
	if (brut.startsWith(' ') && brut.endsWith(' ') && brut.trim() !== '') return brut.slice(1, -1);
	return brut;
}

/**
 * LES FRAGMENTS D'UN TEXTE EN LIGNE. Une construction non refermée est lue
 * comme du texte, ce que fait aussi CommonMark : l'écriture échappe tout
 * délimiteur littéral, donc ce cas ne peut venir que d'un fichier écrit à la
 * main — et refuser un fichier d'humain pour une astérisque serait une
 * sévérité sans objet.
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

/** Un bloc de texte : paragraphe vide, ou paragraphe. */
function paragrapheDe(source: string): unknown {
	if (source === PARAGRAPHE_VIDE) return { type: 'paragraph' };
	const contenu = lireEnLigne(source);
	return contenu === undefined ? { type: 'paragraph' } : { type: 'paragraph', content: contenu };
}

/* ═══════════════════════════════════════════════ RETOUR — les blocs ═════ */

/** Le curseur de lecture. `decalage` porte le numéro de ligne du fichier. */
interface Curseur {
	readonly lignes: readonly string[];
	readonly decalage: number;
	i: number;
}

/** Le numéro de ligne, tel qu'un humain le compte dans le texte reçu. */
function numero(c: Curseur): number {
	return c.decalage + c.i + 1;
}

/** La ligne d'attributs qui suit immédiatement un bloc, s'il y en a une. */
function attributsSuivants(c: Curseur): Attributs {
	const ligne = c.lignes[c.i];
	if (!estLigneDAttributs(ligne)) return {};
	c.i += 1;
	return lireListeDAttributs(ligne as string, numero(c));
}

/** Les nœuds portés par un conteneur, selon son nom. */
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

/** Le bloc clôturé : un bloc de code, ou un diagramme si l'alternative est là. */
function lireBlocCloture(c: Curseur, cloture: string, information: string): unknown {
	const ouverture = numero(c);
	c.i += 1;
	const dedans: string[] = [];
	while (c.i < c.lignes.length && c.lignes[c.i] !== cloture) {
		dedans.push(c.lignes[c.i] as string);
		c.i += 1;
	}
	if (c.i >= c.lignes.length) throw new MarkdownInvalide(ouverture, 'bloc clôturé non refermé');
	c.i += 1;
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
 * Le suffixe d'attributs d'un titre, s'il y en a un. Le relevé se fait par
 * ESSAI DE LECTURE, et non par expression régulière : une valeur d'attribut
 * peut porter une accolade fermante, qu'aucun motif court ne saurait borner.
 * Une accolade échappée, ou une accolade prise dans un span de code, ne
 * produit pas de candidat — le premier est échappé, le second ne finit pas la
 * ligne.
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

/** Le marqueur d'un élément de liste, s'il y en a un sur cette ligne. */
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

/** Les cellules d'une ligne de tableau en barres, les barres échappées sautées. */
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
		/* Une chaîne d'information ne porte JAMAIS d'accent grave — c'est la
		   règle de CommonMark, et c'est ce qui distingue l'ouverture d'un bloc
		   d'un PARAGRAPHE QUI COMMENCE PAR UN SPAN DE CODE porteur d'accents
		   graves : celui-là ferme son span sur la même ligne. L'écriture
		   respecte la règle : un langage porteur d'un accent grave passe en
		   ligne d'attributs. */
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
 * LE SENS RETOUR. Le texte reçu est le CORPS SEUL — l'en-tête de métadonnées
 * appartient à `T-043` et `T-045`, voir la couture à l'en-tête du module.
 *
 * La valeur construite ne sort pas d'ici sans passer par `analyserDocument` :
 * un document structurellement invalide ne peut donc pas entrer par l'import,
 * ce qu'`ADR-003` interdit nommément.
 *
 * @throws MarkdownInvalide si le texte ne se lit pas.
 * @throws DocumentInvalide si ce qu'il décrit n'est pas un document.
 */
export function analyserMarkdown(texte: string): Document {
	return analyserDocument({ type: 'doc', content: lireBlocs(texte.split('\n'), 0) });
}
