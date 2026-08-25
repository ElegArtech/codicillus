/**
 * LE RENDU SERVEUR DU CONTENU — la forme dérivée « HTML » d'ADR-003.
 *
 * ADR-003 : « HTML — produit au rendu, côté serveur — sert à la lecture (V-14,
 * V-03), à l'impression, à l'aperçu ». Aucune des trois formes dérivées n'est
 * stockée comme vérité : celle-ci se recalcule à chaque affichage à partir du
 * document canonique.
 *
 * UNE SEULE ENTRÉE, ET ELLE VALIDE. `rendreDocument` prend une valeur INCONNUE
 * et appelle `analyserDocument` : il n'existe aucun chemin par lequel un
 * document non validé se rende. C'est la contrepartie de l'interdit d'ADR-003
 * sur « toute écriture directe en base d'un document non validé ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE BALISAGE VIENT DU GEL, PAS D'UN CHOIX
 *
 * Chaque fonction de rendu porte la ligne de la maquette gelée qu'elle
 * reproduit. L'ordre de préséance est celui de `CLAUDE.md` §2 — « Maquettes >
 * Cahier des charges > … » —, donc quand le gel écrit une forme, c'est elle qui
 * est rendue, y compris lorsqu'elle surprend :
 *
 *   - un paragraphe NE REND PAS toujours `<p>` : dans une alerte le gel écrit
 *     `<div>` (`V-14:1546`), dans une citation il n'écrit aucune enveloppe
 *     (`V-14:1683`), dans une tâche il écrit `<span>` (`V-14:1673`), dans un
 *     élément de liste et dans une cellule il n'écrit rien (`V-14:1533`,
 *     `V-14:1573`). Le paragraphe est donc rendu SELON SON ENVELOPPE.
 *   - un lien cassé n'a pas de `href` (`V-14:1687`) ; c'est le gel, et c'est
 *     aussi ce qui empêche de naviguer vers une cible qui n'existe pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS BORNES, DÉCLARÉES PLUTÔT QU'EMPRUNTÉES
 *
 *  1. LE PICTOGRAMME DU BOUTON DE COPIE n'est pas recopié ici. Le gel place un
 *     `<svg>` dans le bouton en lecture (`V-14:1556`) ; le recopier dans un
 *     module de bibliothèque serait « recopier le balisage au lieu d'appeler le
 *     composant unique », que `docs/DESIGN.md` §3.7 interdit — c'est la borne
 *     que `src/lib/fraicheur.ts` s'est donnée pour le témoin. Le gel écrit
 *     d'ailleurs lui-même le bouton SANS pictogramme au catalogue de blocs de
 *     l'éditeur (`V-17:3074`) : la forme rendue ici est l'une des deux siennes.
 *  2. L'ENVELOPPE DU CORPS (`div.prose`, l'identifiant du registre, l'attribut
 *     `hidden`) appartient à la vue : le rendu produit les BLOCS, pas leur
 *     conteneur (`V-14:1524`).
 *  3. LE RENDU GRAPHIQUE D'UN DIAGRAMME est celui de Mermaid, côté client
 *     (STACK-TECHNIQUE.md l. 159). Le serveur émet la source dans le conteneur
 *     que Mermaid lit, et l'alternative textuelle de P-06. Aucune maquette ne
 *     montre un diagramme produit à partir d'une source : cette forme est un
 *     ÉCART déclaré, pas une lecture du gel.
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
	type Marque,
	type LigneDeTableau,
	type Tableau,
	type Texte,
	type Titre
} from './document';

/* ═══════════════════════════════════════════ Ce qu'il faut savoir ═══════ */

/** Ce que le rendu doit connaître d'une note citée par un lien interne. */
export interface CibleDeNote {
	readonly id: string;
	readonly titre: string;
	/** L'adresse de lecture. Le rendu ne construit aucune route lui-même. */
	readonly adresse: string;
	/** RG-ACC-01 : une note interne n'est pas atteignable depuis le public. */
	readonly publique: boolean;
}

/** La résolution d'un identifiant de note. `null` : la cible n'existe pas. */
export type ResolveurDeNote = (identifiant: string) => CibleDeNote | null;

/** Le contexte de lecture. Il décide du sort d'un lien vers une note interne. */
export type ContexteDeLecture = 'interne' | 'public';

export interface OptionsDeRendu {
	readonly resoudre: ResolveurDeNote;
	readonly contexte: ContexteDeLecture;
}

/**
 * CE QUE LE RENDU AJOUTE AUX OPTIONS DE SON APPELANT — les ancres des titres,
 * relevées UNE FOIS sur le document entier.
 *
 * Elles ne peuvent pas se calculer titre par titre : l'unicité se juge sur tout
 * le document. Le relevé est donc fait à l'entrée et voyage avec les options.
 */
interface Rendu extends OptionsDeRendu {
	readonly ancres: ReadonlyMap<Titre, string>;
}

/* ═══════════════════════════════════════════════ Les ancres ═════════════ */

/**
 * LES ANCRES DES TITRES DE NIVEAU 2 ET 3, DÉRIVÉES DU TEXTE QUAND LE DOCUMENT
 * N'EN PORTE PAS — et c'est ce qui rend le sommaire d'une note écrite dans le
 * produit.
 *
 * L'éditeur ne pose JAMAIS d'ancre : `edition/schema.ts` déclare
 * `ancre: null` par défaut et rien ne l'écrit. Le sommaire écartait donc tout
 * titre sans ancre, et le panneau disait « Aucun titre dans cette note »
 * au-dessus d'un article qui en portait six.
 *
 * ELLE EST DÉRIVÉE ICI, ET NON PERSISTÉE, POUR UNE RAISON MESURÉE :
 * `empreinteDeNoeud()` (`$lib/donnees/histoire.ts`) sérialise les ATTRIBUTS
 * d'un nœud. Poser une ancre changerait l'empreinte de chaque titre, donc
 * `contenuModifie()` rendrait vrai, donc une version serait capturée au premier
 * ré-enregistrement de CHAQUE note existante, sans une frappe. Et
 * `edition/document.ts` interdit toute normalisation dans la porte de sortie de
 * l'éditeur : « un document que l'éditeur produirait mal est REFUSÉ, jamais
 * réparé ». La dérivation reste donc HORS du document canonique.
 *
 * BORNÉE AUX NIVEAUX 2 ET 3, comme le sommaire lui-même (`V-14:1704`) : un
 * `h4` n'est la cible d'aucun sommaire, et le gel ne lui pose pas d'ancre.
 *
 * UNE ANCRE ÉCRITE DANS LE DOCUMENT L'EMPORTE — un import Markdown en pose
 * (`{#id}`), les documents du gel en portent. Elle entre dans le décompte
 * d'unicité : deux titres ne partagent jamais une ancre, y compris quand la
 * source en a écrit deux fois la même.
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
 * L'ancre d'un titre qui n'en porte pas : le préfixe `s-` du gel
 * (`V-14:1528`, « s-avant ») et le texte translittéré par
 * `identifiantLisible()`, la fabrique unique du dépôt. Un titre dont le texte
 * ne laisse aucune lettre retombe sur `s-titre`, que l'unicité numérote.
 */
function ancreDeriveeDuTexte(titre: Titre): string {
	const lisible = identifiantLisible((titre.content ?? []).map((t) => t.text).join(''));
	return `s-${lisible === '' ? 'titre' : lisible}`;
}

/* ═══════════════════════════════════════════════ L'échappement ══════════ */

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

/* ═══════════════════════════════════════════════ Les marques ════════════ */

/**
 * L'ORDRE D'IMBRICATION DES MARQUES, et pourquoi il est fixé ici.
 *
 * Le gel ne superpose jamais deux marques sur un même fragment : il n'en dit
 * donc rien. Un ordre est pourtant nécessaire, sans quoi le même document
 * rendrait deux balisages selon l'ordre du tableau `marks` — et la comparaison
 * visuelle de C-05, qui compare des empreintes de contenu normalisé, s'en
 * trouverait fausse. L'ordre retenu est celui de ProseMirror : l'ordre de
 * déclaration du schéma, le lien à l'extérieur, `code` au plus près du texte.
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
 * LES TROIS SORTS D'UN LIEN INTERNE, et les trois sont dans le gel.
 *
 *   cible résolue           `a.lien-int`    `V-14:1536`
 *   cible inexistante       `a.lien-casse`  `V-14:1687` — sans `href`
 *   cible non publique,
 *   en lecture publique     `span.lien-prive` `V-03:1072`
 *
 * Le troisième cas n'est pas un ornement : RG-ACC-01 veut qu'aucun contenu
 * interne ne soit atteignable en anonyme, « par aucun chemin ». Un lien interne
 * rendu cliquable en lecture publique serait ce chemin.
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

/* ═══════════════════════════════════════════════ Les blocs ══════════════ */

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
		case 'horizontalRule':
			/* `V-14:1696` — le séparateur, sans classe ni attribut. */
			return '<hr>';
		case 'diagramme':
			return rendreDiagramme(bloc);
	}
}

/**
 * `V-14:1528` — le titre porte son ancre, cible du sommaire de M04.5.
 *
 * L'ancre vient du relevé fait sur le document entier : celle du document quand
 * il en porte une, dérivée du texte sinon. `sommaireDe()` consulte LE MÊME
 * relevé — deux règles feraient diverger le sommaire du corps.
 */
function rendreTitre(titre: Titre, options: Rendu): string {
	const n = titre.attrs.level;
	const relevee = options.ancres.get(titre);
	const ancre = relevee === undefined ? '' : ` id="${echapper(relevee)}"`;
	return `<h${n}${ancre}>${rendreEnLigne(titre.content, options)}</h${n}>`;
}

/**
 * `V-14:1553-1566` — le bloc de code : sa tête porte le langage et le bouton
 * de copie de M04.6, son corps porte le code et rien d'autre.
 *
 * AUCUN NUMÉRO DE LIGNE N'EST ÉMIS, et c'est `RG-M04-05` : ce que la sélection
 * du navigateur ramasse dans `pre > code` est exactement le texte stocké.
 */
function rendreBlocDeCode(bloc: BlocDeCode): string {
	const langage =
		bloc.attrs.language === null
			? ''
			: `<span class="etiq">${echapper(bloc.attrs.language)}</span>`;
	const copier = '<button class="btn btn--discret btn-copier">Copier</button>';
	const code = echapper((bloc.content ?? []).map((t) => t.text).join(''));
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
 * `V-14:1543-1549` — l'alerte : trois niveaux, un glyphe textuel en capitales,
 * un titre, un corps. Le glyphe est rendu MÊME quand il répète le niveau :
 * `docs/DESIGN.md` P-7.2 fait d'une alerte sans glyphe un interdit détectable,
 * parce que la couleur ne doit jamais porter seule l'information (RG-M18-09).
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
 * `V-14:1568-1580` — le tableau, dans sa boîte à défilement horizontal
 * (M04.6 : « en-têtes, défilement horizontal si trop large »).
 *
 * Les lignes de tête sont celles dont TOUTES les cellules sont des cellules
 * d'en-tête, et elles ne peuvent qu'ouvrir le tableau : c'est ce que le gel
 * écrit, et c'est la seule lecture qui donne un `thead` bien formé.
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
 * L'IMAGE — M04.6 : « affichage en ligne, agrandissement au clic ».
 *
 * AUCUNE DES 41 MAQUETTES NE PORTE D'IMAGE DANS UN CORPS RÉDIGÉ : relevé
 * mécaniquement, zéro occurrence de la balise d'image dans `mockups/`. Le gel
 * atteste en revanche SON ENVELOPPE, au catalogue de blocs de l'éditeur
 * (`V-17:3076`) :
 *
 *     figure.figure > div.figure__cadre + figcaption > (b, span)
 *
 * où le cadre porte, en éditeur, l'invite de dépôt plutôt qu'une image. En
 * LECTURE, le cadre est un `button` — c'est lui qui porte l'agrandissement au
 * clic (`V-14:1586`, `V-03:1005`). Ce qui reste déduit est donc étroit : la
 * balise d'image elle-même, qu'aucune maquette n'écrit. Écart déclaré.
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
 * LE DIAGRAMME — M04.6 : « rendu graphique d'un diagramme décrit en texte ».
 *
 * Le serveur ne rend pas le graphique : le moteur de la pile est Mermaid, et il
 * rend dans le navigateur (STACK-TECHNIQUE.md l. 159). Ce que le serveur émet,
 * c'est le cadre de figure du gel (`V-14:1585-1623`), la source dans le
 * conteneur que Mermaid lit, et l'ALTERNATIVE TEXTUELLE de P-06 — le gel porte
 * la sienne dans le `<desc>` de son SVG (`V-14:1591`).
 *
 * LA SOURCE, ELLE, EST ATTESTÉE — et c'était à vérifier plutôt qu'à supposer.
 * Le catalogue de blocs de l'éditeur écrit un diagramme fraîchement inséré
 * (`V-17:3078`) : un `.bloc-code` dont l'étiquette est « diagramme » et dont le
 * `pre > code` porte « A --> B\nB --> C ». Le gel donne donc la SOURCE et sa
 * forme EN ÉDITION. Ce qu'aucune maquette ne montre, c'est le RENDU GRAPHIQUE
 * d'une source en lecture : le conteneur ci-dessous vient du contrat de
 * Mermaid, pas d'une lecture du gel. Écart déclaré, et il est plus étroit
 * qu'il n'y paraissait.
 */
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

/* ═══════════════════════════════════════════════ L'entrée ═══════════════ */

/**
 * LE RENDU D'UN CORPS DE NOTE. La valeur entre inconnue et sort validée : c'est
 * `analyserDocument` qui décide, et lui seul.
 *
 * @throws DocumentInvalide si le document est mal formé — jamais un rendu
 *   partiel, jamais un document réparé.
 */
export function rendreDocument(valeur: unknown, options: OptionsDeRendu): string {
	const document: Document = analyserDocument(valeur);
	return rendreBlocs(document.content, 'corps', {
		...options,
		ancres: ancresDuDocument(document)
	});
}
