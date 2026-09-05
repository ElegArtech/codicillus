/**
 * Le rendu serveur du contenu — la forme dérivée « HTML » d'`ADR-003`, produite au rendu et
 * jamais stockée comme vérité.
 *
 * UNE SEULE ENTRÉE, ET ELLE VALIDE : `rendreDocument` prend une valeur INCONNUE et appelle
 * `analyserDocument`. LE BALISAGE VIENT DU GEL, PAS D'UN CHOIX, et chaque fonction porte la
 * ligne de maquette qu'elle reproduit — y compris quand elle surprend : un paragraphe NE
 * REND PAS toujours `<p>`, et un lien cassé n'a pas de `href`.
 *
 * TROIS BORNES, DÉCLARÉES PLUTÔT QU'EMPRUNTÉES :
 *
 *  1. LE PICTOGRAMME DU BOUTON DE COPIE n'est pas recopié ici — le gel écrit lui-même le
 *     bouton SANS pictogramme au catalogue de l'éditeur.
 *  2. L'ENVELOPPE DU CORPS (`div.prose`, l'identifiant du registre, `hidden`) appartient à
 *     la vue : le rendu produit les BLOCS, pas leur conteneur.
 *  3. LE RENDU GRAPHIQUE D'UN DIAGRAMME est celui de Mermaid, côté client. Le serveur émet
 *     la source et l'alternative textuelle de `P-06` — écart déclaré.
 */
import { identifiantLisible } from '../rangement/adresses';
import {
	analyserDocument,
	titres,
	type Alerte,
	type Bloc,
	type BlocDeCode,
	type Citation,
	type Diagramme,
	type Document,
	type ElementDeListe,
	type Image,
	type PieceJointeIntegree,
	type Marque,
	type LigneDeTableau,
	type Tableau,
	type Texte,
	type Titre
} from './document';

export interface CibleDeNote {
	readonly id: string;
	readonly titre: string;
	readonly adresse: string;
	/** RG-ACC-01 : une note interne n'est pas atteignable depuis le public. */
	readonly publique: boolean;
}

/** La résolution d'un identifiant de note. `null` : la cible n'existe pas. */
export type ResolveurDeNote = (identifiant: string) => CibleDeNote | null;

export type ContexteDeLecture = 'interne' | 'public';

export interface OptionsDeRendu {
	readonly resoudre: ResolveurDeNote;
	readonly contexte: ContexteDeLecture;
}

/**
 * Ce que le rendu ajoute aux options de son appelant — les ancres des titres,
 * relevées UNE FOIS sur le document entier : elles ne peuvent pas se calculer titre
 * par titre, l'unicité se jugeant sur tout le document.
 */
interface Rendu extends OptionsDeRendu {
	readonly ancres: ReadonlyMap<Titre, string>;
}

/**
 * Les ancres des titres de niveau 2 et 3, dérivées du texte quand le document n'en porte pas
 * — et c'est ce qui rend le sommaire d'une note écrite dans le produit : l'éditeur ne pose
 * JAMAIS d'ancre, et le sommaire écartait donc tout titre sans ancre en disant « aucun titre
 * dans cette note » au-dessus d'un article qui en portait six.
 *
 * ELLE EST DÉRIVÉE ICI, ET NON PERSISTÉE, POUR UNE RAISON MESURÉE : `empreinteDeNoeud()`
 * sérialise les ATTRIBUTS d'un nœud, de sorte que poser une ancre ferait capturer une version
 * au premier ré-enregistrement de CHAQUE note, sans une frappe.
 *
 * BORNÉE AUX NIVEAUX 2 ET 3, comme le sommaire. Une ancre écrite dans le document l'emporte,
 * et entre dans le décompte d'unicité : deux titres ne partagent jamais une ancre.
 */
export function ancresDuDocument(document: Document): ReadonlyMap<Titre, string> {
	const ancres = new Map<Titre, string>();
	const prises = new Set<string>();
	for (const titre of titres(document)) {
		if (titre.attrs.level !== 2 && titre.attrs.level !== 3) continue;
		const souche = titre.attrs.ancre ?? ancreDeriveeDuTexte(titre);
		let candidate = souche;
		let rang = 2;
		while (prises.has(candidate)) candidate = `${souche}-${rang++}`;
		prises.add(candidate);
		ancres.set(titre, candidate);
	}
	return ancres;
}

/**
 * L'ancre d'un titre qui n'en porte pas : le préfixe `s-` du gel et le texte
 * translittéré par `identifiantLisible()`, la fabrique unique du dépôt. Un titre
 * dont le texte ne laisse aucune lettre retombe sur `s-titre`, que l'unicité
 * numérote.
 */
function ancreDeriveeDuTexte(titre: Titre): string {
	const lisible = identifiantLisible((titre.content ?? []).map((t) => t.text).join(''));
	return `s-${lisible === '' ? 'titre' : lisible}`;
}

/**
 * Le texte d'un document est du TEXTE : il ne devient jamais du balisage.
 * C'est la contrepartie du refus d'ADR-003 de stocker du HTML libre.
 */
export function echapper(texte: string): string {
	return texte
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

/**
 * L'ordre d'imbrication des marques, fixé ici parce que le gel ne superpose jamais deux
 * marques sur un même fragment et n'en dit donc rien. Sans ordre, le même document rendrait
 * deux balisages selon l'ordre du tableau `marks`. L'ordre retenu est celui de ProseMirror :
 * le lien à l'extérieur, `code` au plus près du texte.
 */
const ORDRE_DES_MARQUES: readonly Marque['type'][] = [
	'lienInterne',
	'link',
	'highlight',
	'bold',
	'italic',
	'underline',
	'strike',
	'code'
];

/** Les enveloppes de marque attestées — `docs/DESIGN.md` §B-9, `V-41:4513`. */
const BALISE_DE_MARQUE: Readonly<Record<string, string>> = {
	bold: 'strong',
	italic: 'em',
	underline: 'u',
	strike: 's',
	highlight: 'mark',
	code: 'code'
};

function rendreTexte(texte: Texte, options: Rendu): string {
	const marques = [...(texte.marks ?? [])].sort(
		(a, b) => ORDRE_DES_MARQUES.indexOf(a.type) - ORDRE_DES_MARQUES.indexOf(b.type)
	);
	let html = echapper(texte.text);
	for (const marque of marques.reverse()) html = envelopper(marque, html, options);
	return html;
}

function envelopper(marque: Marque, dedans: string, options: Rendu): string {
	if (marque.type === 'link') {
		/* `V-14:1687` — lien externe : nouvel onglet, et `rel` qui va avec. */
		return (
			`<a class="lien-ext" href="${echapper(marque.attrs.href)}" ` +
			`target="_blank" rel="noopener">${dedans}</a>`
		);
	}
	if (marque.type === 'lienInterne') return rendreLienInterne(marque.attrs.cible, dedans, options);
	const balise = BALISE_DE_MARQUE[marque.type];
	return `<${balise}>${dedans}</${balise}>`;
}

/**
 * Les trois sorts d'un lien interne, tous trois dans le gel : cible résolue (`a.lien-int`),
 * cible inexistante (`a.lien-casse`, sans `href`), cible non publique en lecture publique
 * (`span.lien-prive`). Le troisième cas n'est pas un ornement : `RG-ACC-01` veut qu'aucun
 * contenu interne ne soit atteignable en anonyme, « par aucun chemin ».
 */
function rendreLienInterne(cible: string, dedans: string, options: Rendu): string {
	const note = options.resoudre(cible);
	if (note === null) return `<a class="lien-casse">${dedans}</a>`;
	if (options.contexte === 'public' && !note.publique) {
		return `<span class="lien-prive" title="Cette ressource n’est pas publique">${dedans}</span>`;
	}
	return `<a class="lien-int" href="${echapper(note.adresse)}">${dedans}</a>`;
}

function rendreEnLigne(contenu: readonly Texte[] | undefined, options: Rendu): string {
	return (contenu ?? []).map((t) => rendreTexte(t, options)).join('');
}

/**
 * L'ENVELOPPE D'UN PARAGRAPHE — voir l'en-tête du module. Le gel en écrit cinq
 * formes selon l'endroit, et c'est le gel qui décide.
 */
export type Enveloppe = 'corps' | 'alerte' | 'citation' | 'tache' | 'element' | 'cellule';

const PARAGRAPHE_SELON_ENVELOPPE: Readonly<Record<Enveloppe, [string, string]>> = {
	corps: ['<p>', '</p>'],
	/* `V-14:1546` — le corps d'une alerte est un `div` nu. */
	alerte: ['<div>', '</div>'],
	/* `V-14:1683` — la citation porte son texte sans enveloppe. */
	citation: ['', ''],
	/* `V-14:1673` — la tâche porte son texte dans un `span`, après la case. */
	tache: ['<span>', '</span>'],
	/* `V-14:1533` — l'élément de liste porte son texte sans enveloppe. */
	element: ['', ''],
	/* `V-14:1573` — la cellule porte son texte sans enveloppe. */
	cellule: ['', '']
};

function rendreBlocs(blocs: readonly Bloc[], enveloppe: Enveloppe, options: Rendu): string {
	return blocs.map((b) => rendreBloc(b, enveloppe, options)).join('');
}

function rendreBloc(bloc: Bloc, enveloppe: Enveloppe, options: Rendu): string {
	switch (bloc.type) {
		case 'paragraph': {
			const [ouvre, ferme] = PARAGRAPHE_SELON_ENVELOPPE[enveloppe];
			return `${ouvre}${rendreEnLigne(bloc.content, options)}${ferme}`;
		}
		case 'heading':
			return rendreTitre(bloc, options);
		case 'codeBlock':
			return rendreBlocDeCode(bloc);
		case 'bulletList':
			return `<ul>${bloc.content.map((e) => rendreElement(e, options)).join('')}</ul>`;
		case 'orderedList':
			return `<ol>${bloc.content.map((e) => rendreElement(e, options)).join('')}</ol>`;
		case 'taskList':
			/* `V-14:1672` — la liste de tâches est une liste, marquée `.taches`. */
			return `<ul class="taches">${bloc.content
				.map(
					(t) =>
						`<li><input type="checkbox"${t.attrs.checked ? ' checked' : ''} disabled>` +
						`${rendreBlocs(t.content, 'tache', options)}</li>`
				)
				.join('')}</ul>`;
		case 'blockquote':
			return rendreCitation(bloc, options);
		case 'alerte':
			return rendreAlerte(bloc, options);
		case 'table':
			return rendreTableau(bloc, options);
		case 'image':
			return rendreImage(bloc);
		case 'pieceJointe':
			return rendrePieceJointe(bloc);
		case 'horizontalRule':
			/* `V-14:1696` — le séparateur, sans classe ni attribut. */
			return '<hr>';
		case 'diagramme':
			return rendreDiagramme(bloc);
	}
}

/**
 * `V-14:1528` — le titre porte son ancre, cible du sommaire de M04.5. L'ancre vient
 * du relevé fait sur le document entier, et `sommaireDe()` consulte LE MÊME relevé :
 * deux règles feraient diverger le sommaire du corps.
 */
function rendreTitre(titre: Titre, options: Rendu): string {
	const n = titre.attrs.level;
	const relevee = options.ancres.get(titre);
	const ancre = relevee === undefined ? '' : ` id="${echapper(relevee)}"`;
	return `<h${n}${ancre}>${rendreEnLigne(titre.content, options)}</h${n}>`;
}

/**
 * `V-14:1553-1566` — le bloc de code. AUCUN NUMÉRO DE LIGNE N'EST ÉMIS, et c'est
 * `RG-M04-05` : ce que la sélection du navigateur ramasse dans `pre > code` est
 * exactement le texte stocké.
 */
function rendreBlocDeCode(bloc: BlocDeCode): string {
	const texte = (bloc.content ?? []).map((t) => t.text).join('');
	if (bloc.attrs.language === LANGAGE_DE_DIAGRAMME && texte.trim() !== '') {
		return rendreDiagrammeSansAlternative(texte);
	}
	const langage =
		bloc.attrs.language === null
			? ''
			: `<span class="etiq">${echapper(bloc.attrs.language)}</span>`;
	const copier = '<button class="btn btn--discret btn-copier">Copier</button>';
	const code = echapper(texte);
	return (
		`<div class="bloc-code"><div class="bloc-code__tete">${langage}${copier}</div>` +
		`<pre><code>${code}</code></pre></div>`
	);
}

/** `V-14:1533-1540` — l'élément de liste, et ses listes imbriquées. */
function rendreElement(element: ElementDeListe, options: Rendu): string {
	return `<li>${rendreBlocs(element.content, 'element', options)}</li>`;
}

/** `V-14:1682-1686` — la citation, et son attribution en pied. */
function rendreCitation(citation: Citation, options: Rendu): string {
	const pied =
		citation.attrs.attribution === null
			? ''
			: `<footer>${echapper(citation.attrs.attribution)}</footer>`;
	return (
		`<blockquote class="prose-cit">` +
		`${rendreBlocs(citation.content, 'citation', options)}${pied}</blockquote>`
	);
}

/**
 * `V-14:1543-1549` — l'alerte. Le glyphe est rendu MÊME quand il répète le niveau :
 * une alerte sans glyphe est un interdit détectable, la couleur ne devant jamais
 * porter seule l'information (`RG-M18-09`).
 */
function rendreAlerte(alerte: Alerte, options: Rendu): string {
	return (
		`<div class="alerte alerte--${alerte.attrs.niveau}"><div>` +
		`<div class="alerte__tete"><span class="alerte__glyphe">${echapper(alerte.attrs.glyphe)}` +
		`</span> ${echapper(alerte.attrs.titre)}</div>` +
		`${rendreBlocs(alerte.content, 'alerte', options)}</div></div>`
	);
}

/**
 * `V-14:1568-1580` — le tableau, dans sa boîte à défilement horizontal. Les lignes
 * de tête sont celles dont TOUTES les cellules sont des cellules d'en-tête, et elles
 * ne peuvent qu'ouvrir le tableau : c'est ce que le gel écrit, et la seule lecture
 * qui donne un `thead` bien formé.
 */
function rendreTableau(tableau: Tableau, options: Rendu): string {
	const lignes = tableau.content;
	let tete = 0;
	while (
		tete < lignes.length &&
		(lignes[tete]?.content ?? []).every((c) => c.type === 'tableHeader')
	) {
		tete += 1;
	}
	const rendreLigne = (ligne: LigneDeTableau) =>
		`<tr>${ligne.content
			.map((cellule) =>
				cellule.type === 'tableHeader'
					? `<th>${rendreBlocs(cellule.content, 'cellule', options)}</th>`
					: `<td${cellule.attrs.numerique ? ' class="num"' : ''}>` +
						`${rendreBlocs(cellule.content, 'cellule', options)}</td>`
			)
			.join('')}</tr>`;
	const thead =
		tete === 0 ? '' : `<thead>${lignes.slice(0, tete).map(rendreLigne).join('')}</thead>`;
	const tbody =
		tete === lignes.length ? '' : `<tbody>${lignes.slice(tete).map(rendreLigne).join('')}</tbody>`;
	return `<div class="tableau-boite"><table>${thead}${tbody}</table></div>`;
}

/**
 * L'image — M04.6 : « affichage en ligne, agrandissement au clic ». AUCUNE DES 41 MAQUETTES
 * NE PORTE D'IMAGE DANS UN CORPS RÉDIGÉ. Le gel atteste en revanche SON ENVELOPPE au
 * catalogue de blocs de l'éditeur — `figure.figure > div.figure__cadre + figcaption > (b,
 * span)` — et, en LECTURE, le cadre est un `button` qui porte l'agrandissement. Ce qui reste
 * déduit est étroit : la balise d'image elle-même.
 */
function rendreImage(image: Image): string {
	const { src, alt, etiquette, legende } = image.attrs;
	const parts =
		(etiquette === null ? '' : `<b>${echapper(etiquette)}</b>`) +
		(legende === null ? '' : `<span>${echapper(legende)}</span>`);
	const pied = parts === '' ? '' : `<figcaption>${parts}</figcaption>`;
	return (
		`<figure class="figure"><button class="figure__cadre" ` +
		`aria-label="Agrandir ${echapper(alt)}">` +
		`<img src="${echapper(src)}" alt="${echapper(alt)}"></button>${pied}</figure>`
	);
}

/**
 * LA PIÈCE JOINTE MONTRÉE EN PLACE — le fichier, rendu par le navigateur.
 *
 * DEUX FORMES, ET LE TYPE DE MÉDIA STOCKÉ DÉCIDE : une image s'affiche, tout le
 * reste entre dans un cadre — un PDF y ouvre la visionneuse du navigateur, avec
 * ses pages, son zoom et son impression. Rien n'est embarqué dans le paquet : ce
 * qui rend est ce que le navigateur sait déjà rendre.
 *
 * LE CADRE PORTE LE NOM DU FICHIER EN TITRE : sans lui, un cadre est un trou noir
 * pour un lecteur d'écran. Et un lien de secours le suit, pour le cas où le cadre
 * ne rend rien — un format que ce navigateur-là ne connaît pas.
 */
function rendrePieceJointe(bloc: PieceJointeIntegree): string {
	const { src, nom, typeMedia } = bloc.attrs;
	const secours =
		`<a class="piece-integree__hors-cadre" href="${echapper(src)}">` +
		`Ouvrir ${echapper(nom)}</a>`;
	if (typeMedia.startsWith('image/')) {
		return (
			`<figure class="figure piece-integree" data-type-media="${echapper(typeMedia)}">` +
			`<img src="${echapper(src)}" alt="${echapper(nom)}">` +
			`<figcaption>${echapper(nom)}</figcaption></figure>`
		);
	}
	return (
		`<figure class="figure piece-integree" data-type-media="${echapper(typeMedia)}">` +
		`<iframe class="piece-integree__cadre" src="${echapper(src)}" ` +
		`title="${echapper(nom)}"></iframe>` +
		`<figcaption>${echapper(nom)} ${secours}</figcaption></figure>`
	);
}

/**
 * Le diagramme — M04.6 : « rendu graphique d'un diagramme décrit en texte ». Le serveur ne
 * rend pas le graphique : Mermaid rend dans le navigateur. Ce que le serveur émet est le
 * cadre de figure du gel, la source dans le conteneur que Mermaid lit, et l'ALTERNATIVE
 * TEXTUELLE de `P-06`.
 *
 * LA SOURCE EST ATTESTÉE par le catalogue de blocs de l'éditeur. Ce qu'aucune maquette ne
 * montre, c'est le RENDU GRAPHIQUE en lecture — le conteneur ci-dessous vient du contrat de
 * Mermaid. Écart déclaré.
 */
/** La chaîne d'information qui fait d'un bloc clôturé un diagramme. */
const LANGAGE_DE_DIAGRAMME = 'mermaid';

/**
 * LE DIAGRAMME ÉCRIT COMME TOUT LE MONDE L'ÉCRIT — un bloc clôturé ```mermaid, sans
 * ligne d'attributs.
 *
 * `analyserBlocCloture` ne rend un nœud `diagramme` QUE si une ligne d'attributs porte
 * l'alternative textuelle, et le schéma l'exige non vide (`P-06`) : un fichier Markdown
 * ordinaire — celui que GitHub, GitLab, Obsidian et l'éditeur de cette application
 * dessinent tous — arrive donc en `codeBlock`, et s'affichait en CODE. Sur les
 * 300 notes de l'instance de recette, PAS UN SEUL nœud `diagramme` : tout le Mermaid y
 * est un bloc de code, et pas un schéma ne se dessinait.
 *
 * Le cadre est celui du diagramme, la loupe l'ouvre donc aussi.
 *
 * AUCUNE ALTERNATIVE N'EST INVENTÉE — il n'y en a pas, et en fabriquer une serait
 * mentir à qui ne voit pas l'écran. Ni `role="img"` ni `aria-label` : le témoin dit au
 * rendu client de garder la SOURCE lisible par les technologies d'assistance au lieu
 * de la retirer de l'arbre. Un diagramme qui veut une vraie alternative reste le nœud
 * `diagramme`, et lui l'exige.
 */
function rendreDiagrammeSansAlternative(source: string): string {
	return (
		`<figure class="figure"><button class="figure__cadre" ` +
		`aria-label="Agrandir le diagramme">` +
		`<pre class="mermaid" data-sans-alternative="oui">${echapper(source)}</pre>` +
		`</button></figure>`
	);
}

function rendreDiagramme(diagramme: Diagramme): string {
	const { source, alternative, etiquette, legende } = diagramme.attrs;
	const parts =
		(etiquette === null ? '' : `<b>${echapper(etiquette)}</b>`) +
		(legende === null ? '' : `<span>${echapper(legende)}</span>`);
	const pied = parts === '' ? '' : `<figcaption>${parts}</figcaption>`;
	return (
		`<figure class="figure"><button class="figure__cadre" ` +
		`aria-label="Agrandir ${echapper(etiquette ?? 'le diagramme')}">` +
		`<pre class="mermaid" role="img" aria-label="${echapper(alternative)}">` +
		`${echapper(source)}</pre></button>${pied}</figure>`
	);
}

/**
 * Le rendu d'un corps de note. La valeur entre inconnue et sort validée : c'est
 * `analyserDocument` qui décide, et lui seul.
 *
 * @throws DocumentInvalide — jamais un rendu partiel, jamais un document réparé.
 */
export function rendreDocument(valeur: unknown, options: OptionsDeRendu): string {
	const document: Document = analyserDocument(valeur);
	return rendreBlocs(document.content, 'corps', {
		...options,
		ancres: ancresDuDocument(document)
	});
}
