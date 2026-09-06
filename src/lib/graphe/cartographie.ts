/**
 * Le socle commun des deux cartographies — V-19 et V-20. Les deux maquettes portent mot pour
 * mot le même bloc : « un nœud doit se reconnaître à l'identique d'un mode à l'autre, sinon la
 * bascule fait perdre le fil ». Le partage est MESURÉ sur le gel, pas supposé.
 *
 * CE QUI N'Y EST PAS : le panneau de détail, porteur de styles en ligne que `P-6.4` n'admet
 * que dans un fichier rattaché à une maquette ; V-21, dont la carte mentale dessine
 * l'arborescence et non le graphe des relations ; et la disposition de V-20, qui reste écrite
 * dans sa vue.
 *
 * AUCUNE DONNÉE PROPRE (`RG-M09-01`) : les relations et les types techniques sont des
 * PARAMÈTRES EXIGÉS. Ils valaient les constantes de `seeds/corpus.ts` quand on ne les passait
 * pas, si bien qu'un appelant qui les oubliait dessinait le graphe du jeu de démonstration.
 */
import type { Note, Relation } from '../../../seeds/corpus';

/* ── L'encodage des types ──────────────────────────────────────────────────
   « Chaque type a sa géométrie ET son code de trois lettres : la couleur ne
   porte jamais seule le type » (V-19:2334). C'est RG-M18-09 rendu au balisage :
   forme et code sont redondants avec la teinte, jamais remplacés par elle. */

export type FormeDeNoeud = 'carre' | 'cercle' | 'hexagone' | 'feuille' | 'losange' | 'triangle';

export interface EncodageDeType {
	readonly forme: FormeDeNoeud;
	readonly code: string;
	readonly couleur: string;
	readonly nom: string;
}

/**
 * La table des types cartographiques.
 *
 * LES FORMES SUIVENT LA LÉGENDE DE LA MAQUETTE — Note ○, Fiche □, Application △.
 * « Note » était un losange et « Application » un cercle : sur une instance dont
 * toutes les notes sont de type Note, la carte était un champ de losanges, quand la
 * maquette montre des pastilles. « Fiche » manquait à la table et passait par la
 * dérivation, ce qui lui donnait une forme au hasard du hachage.
 *
 * « DOSSIER » N'Y FIGURE PAS, et c'est délibéré même si la légende de la maquette le
 * nomme : un dossier est un RANGEMENT, et le rangement ne se dessine pas en nœud de
 * corpus. L'inscrire ici laisserait croire qu'une note peut être de type dossier.
 *
 * LES TEINTES NE SERVENT PLUS AU DESSIN — la couleur d'un nœud porte sa vivacité.
 * Elles ne subsistent que pour la dérivation d'un type créé en console, qui a besoin
 * d'un jeu de couples forme-teinte déjà pris.
 */
export const TYPES: ReadonlyMap<string, EncodageDeType> = new Map([
	['Serveur', { forme: 'carre', code: 'SRV', couleur: '#1b6b7a', nom: 'Serveur' }],
	['Application', { forme: 'triangle', code: 'APP', couleur: '#453ba0', nom: 'Application' }],
	['Contact', { forme: 'hexagone', code: 'CTC', couleur: '#7a2f8f', nom: 'Contact' }],
	['Procédure', { forme: 'feuille', code: 'PRO', couleur: '#3e5266', nom: 'Procédure' }],
	['Guide', { forme: 'feuille', code: 'GUI', couleur: '#3e5266', nom: 'Guide' }],
	['Note', { forme: 'cercle', code: 'NOT', couleur: '#6b7c87', nom: 'Note' }],
	['Fiche', { forme: 'carre', code: 'FIC', couleur: '#3e5266', nom: 'Fiche' }],
	['Signet', { forme: 'losange', code: 'LIE', couleur: '#6b7c87', nom: 'Signet' }]
] as const);

/**
 * Le repli du gel, réduit à sa seule justification : un nom de type VIDE. Ce n'était
 * pas son emploi — il servait à TOUT nom absent de la table, et c'était le défaut.
 */
const TYPE_PAR_DEFAUT: EncodageDeType = {
	forme: 'cercle',
	code: 'NOT',
	couleur: '#6b7c87',
	nom: 'Note'
};

/* LES TYPES QUE LA CONSOLE CRÉE. La table ci-dessus est CLOSE ; le référentiel est
   OUVERT. Un type de fiche créé en console arrivait ici comme une clé inconnue, et
   le repli rendait l'objet du gel TEL QUEL : deux types créés en console produisaient
   deux pastilles rigoureusement identiques — losange, code NOT, libellé « Note » —
   dont les filtres portaient deux types différents.

   LE NOM N'A JAMAIS QUITTÉ LE CIRCUIT : la clé EST le nom. Pour la forme, le code et
   la teinte, le cahier tranche — « chaque type de fiche a une couleur et une icône
   propres, ASSIGNÉES DE FAÇON DÉTERMINISTE » : une dérivation, pas une colonne. Le
   calcul ci-dessous est PUR — même nom, même encodage, partout et toujours.

   CE QU'IL PROMET, ET CE QU'IL NE PROMET PAS : un type dérivé ne prend jamais un
   code ni un couple forme-teinte du gel, donc ne peut pas se faire passer pour un
   type de la table. En revanche deux noms dérivés peuvent partager un code de trois
   caractères — aucune fonction d'un seul nom ne garantit l'unicité dans un ensemble
   qu'elle ne voit pas. */

/** Les géométries offertes au choix : celles du gel, tirées de la table. */
const FORMES: readonly FormeDeNoeud[] = [...new Set([...TYPES.values()].map((t) => t.forme))];

/** Les teintes offertes au choix : celles du gel, tirées de la table. */
const TEINTES: readonly string[] = [...new Set([...TYPES.values()].map((t) => t.couleur))];

/** Les codes que le gel a déjà pris : un type créé en console n'en prend aucun. */
const CODES_DU_GEL: ReadonlySet<string> = new Set([...TYPES.values()].map((t) => t.code));

function empreinteDePresentation(forme: FormeDeNoeud, couleur: string): string {
	return forme + '|' + couleur;
}

/**
 * Les couples forme-teinte encore libres — cinq géométries par cinq teintes, MOINS
 * les sept que la table du gel occupe déjà. Retirer les couples pris est ce qui
 * empêche un type de console de ressembler en tout point à un type du gel.
 */
const PRESENTATIONS_LIBRES: readonly { readonly forme: FormeDeNoeud; readonly couleur: string }[] =
	(() => {
		const prises = new Set(
			[...TYPES.values()].map((t) => empreinteDePresentation(t.forme, t.couleur))
		);
		const libres: { forme: FormeDeNoeud; couleur: string }[] = [];
		for (const forme of FORMES) {
			for (const couleur of TEINTES) {
				if (!prises.has(empreinteDePresentation(forme, couleur))) libres.push({ forme, couleur });
			}
		}
		return libres;
	})();

/**
 * L'alphabet de désambiguïsation, parcouru en boucle depuis un rang haché. Les
 * chiffres en sont exclus À DESSEIN : dans un code de trois capitales, le zéro se lit
 * comme un O et le un comme un I.
 */
const ALPHABET_DE_CODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Ce qui complète un nom trop court pour donner trois caractères. */
const REMPLISSAGE_DE_CODE = 'X';

/**
 * Un hachage stable — FNV-1a sur 32 bits. Il ne sert qu'à choisir dans deux listes
 * closes : il n'a besoin d'aucune qualité cryptographique, seulement d'être LE MÊME
 * PARTOUT ET TOUJOURS — il ne dépend ni de la locale, ni du fuseau, ni d'un ordre de
 * propriétés.
 */
function hachageStable(texte: string): number {
	let h = 2166136261;
	for (let i = 0; i < texte.length; i += 1) {
		h ^= texte.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/**
 * Les mots d'un nom, réduits aux capitales sans accent et aux chiffres. La
 * décomposition retire les diacritiques AVANT la coupe : « Équipement réseau » donne
 * EQUIPEMENT et RESEAU, jamais un premier mot amputé.
 */
function motsDuNom(nom: string): string[] {
	return nom
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toUpperCase()
		.split(/[^A-Z0-9]+/)
		.filter((mot) => mot !== '');
}

/**
 * Le code de trois caractères d'un nom, avant désambiguïsation. Un seul mot donne ses
 * trois premières lettres, deux mots donnent deux lettres puis une, trois mots ou
 * plus donnent leurs initiales. Un nom trop court est complété, jamais raccourci.
 */
function codeDeTroisCaracteres(nom: string): string {
	const mots = motsDuNom(nom);
	const premier = mots[0] ?? '';
	const second = mots[1] ?? '';
	let brut: string;
	if (mots.length === 1) brut = premier.slice(0, 3);
	else if (mots.length === 2) brut = premier.slice(0, 2) + second.slice(0, 1);
	else
		brut = mots
			.slice(0, 3)
			.map((mot) => mot.slice(0, 1))
			.join('');
	return (brut + REMPLISSAGE_DE_CODE.repeat(3)).slice(0, 3);
}

/** Le code de trois caractères d'un nom — le même calcul que pour un type. */
export function codeCourt(nom: string): string {
	return codeDeTroisCaracteres(nom);
}

/**
 * Le code d'un type créé en console, jamais l'un des sept du gel. Le cas est réel :
 * le jeu de peuplement pose « Processus », dont les trois premières lettres sont
 * celles de « Procédure ». Le troisième caractère est repris dans l'alphabet à partir
 * d'un rang haché sur le nom — donc stable, et différent d'un nom à l'autre.
 */
function codeDerive(nom: string): string {
	const brut = codeDeTroisCaracteres(nom);
	if (!CODES_DU_GEL.has(brut)) return brut;
	const depart = hachageStable(nom) % ALPHABET_DE_CODE.length;
	for (let i = 0; i < ALPHABET_DE_CODE.length; i += 1) {
		const candidat =
			brut.slice(0, 2) + ALPHABET_DE_CODE.charAt((depart + i) % ALPHABET_DE_CODE.length);
		if (!CODES_DU_GEL.has(candidat)) return candidat;
	}
	return brut;
}

function presentationDerivee(nom: string): { forme: FormeDeNoeud; couleur: string } {
	const rang = hachageStable(nom) % PRESENTATIONS_LIBRES.length;
	return (
		PRESENTATIONS_LIBRES[rang] ?? {
			forme: TYPE_PAR_DEFAUT.forme,
			couleur: TYPE_PAR_DEFAUT.couleur
		}
	);
}

/**
 * L'encodage d'un type cartographique. Les sept clés du gel rendent l'objet du gel,
 * à l'octet ; tout autre nom est NOMMÉ, et sa présentation dérivée de son nom.
 */
export function encodageDuType(cle: string): EncodageDeType {
	const duGel = TYPES.get(cle);
	if (duGel !== undefined) return duGel;
	if (cle.trim() === '') return TYPE_PAR_DEFAUT;
	const { forme, couleur } = presentationDerivee(cle);
	return { forme, code: codeDerive(cle), couleur, nom: cle };
}

/** Le type cartographique d'une note : le type de fiche s'il existe, sinon le
 *  type de note. C'est lui qui décide de la forme du nœud. */
export function typeCarto(n: Note): string {
	return n.typeFiche ?? n.type;
}

export function typeDe(n: Note): EncodageDeType {
	return encodageDuType(typeCarto(n));
}

/* LA GÉOMÉTRIE D'UN CONTOUR. Le gel fabrique l'élément SVG ; ici la fabrique rend
   sa DESCRIPTION, que la vue pose en balisage. Les nombres sont ceux du gel, aux
   mêmes opérations près : les écrire autrement — arrondis, valeurs recopiées —
   ferait diverger le rendu au sous-pixel. */

export type Contour =
	| { readonly balise: 'circle'; readonly r: number }
	| {
			readonly balise: 'rect';
			readonly x: number;
			readonly y: number;
			readonly largeur: number;
			readonly hauteur: number;
			readonly rx: number;
	  }
	| { readonly balise: 'polygon'; readonly points: string }
	| { readonly balise: 'path'; readonly d: string };

/** Le contour d'un type, au rayon demandé — le calque exact de `forme()` du gel. */
export function contourDeForme(t: EncodageDeType, r: number): Contour {
	if (t.forme === 'cercle') return { balise: 'circle', r };
	if (t.forme === 'carre') {
		return { balise: 'rect', x: -r, y: -r, largeur: r * 2, hauteur: r * 2, rx: r * 0.28 };
	}
	if (t.forme === 'losange') {
		return {
			balise: 'polygon',
			points: [
				[0, -r * 1.2],
				[r * 1.2, 0],
				[0, r * 1.2],
				[-r * 1.2, 0]
			].join(' ')
		};
	}
	if (t.forme === 'hexagone') {
		const pts: number[][] = [];
		for (let i = 0; i < 6; i++) {
			const a = Math.PI / 6 + (i * Math.PI) / 3;
			pts.push([Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12]);
		}
		return { balise: 'polygon', points: pts.join(' ') };
	}
	if (t.forme === 'triangle') {
		return {
			balise: 'polygon',
			points: [
				[0, -r * 1.25],
				[r * 1.12, r * 0.78],
				[-r * 1.12, r * 0.78]
			].join(' ')
		};
	}
	/* Feuille : un rectangle au coin replié, comme une page. */
	const w = r * 0.92;
	const h = r * 1.15;
	const c = r * 0.42;
	return {
		balise: 'path',
		d: `M${-w} ${-h} H${w - c} L${w} ${-h + c} V${h} H${-w} Z`
	};
}

export interface Place {
	readonly x: number;
	readonly y: number;
}

/**
 * LE REPÈRE DU DESSIN — le `viewBox` que les vues déclarent.
 *
 * IL FAISAIT 1000 × 620, ET C'ÉTAIT UNE PERTE. Le SVG conserve ses proportions : un
 * repère de rapport 1,61 posé dans une zone de rapport 1,14 laisse deux bandes
 * vides en haut et en bas — mesuré, un cinquième de la hauteur utile. Le repère suit
 * désormais la zone, et le dessin gagne cette place.
 */
const LARGEUR = 1000;
const HAUTEUR = 780;

/* LE SOUS-GRAPHE D'UN PÉRIMÈTRE. « Les notes hors périmètre mais reliées à lui sont
   conservées et marquées fantôme : les masquer donnerait une fausse image des
   dépendances » (`V-19:2181`). L'ordre des nœuds est celui du corpus, puis celui des
   arêtes pour les fantômes — il décide de l'ordre du balisage rendu. */

export interface Perimetre {
	readonly type: string;
	readonly nom?: string;
}

export interface NoeudDeGraphe {
	readonly id: string;
	readonly note: Note;
	readonly fantome: boolean;
}

export interface Graphe {
	readonly noeuds: readonly NoeudDeGraphe[];
	readonly index: ReadonlyMap<string, NoeudDeGraphe>;
	readonly aretes: readonly Relation[];
}

/**
 * UNE NOTE EST-ELLE DANS LE PÉRIMÈTRE D'AFFICHAGE ? Le prédicat est SORTI de
 * `sousGraphe()` parce qu'un second écran en dépend : les familles sémantiques se
 * calculent sur les notes du périmètre CHOISI, relations comprises ou non, et deux
 * prédicats concurrents feraient un jour dire « douze notes » à la légende au-dessus
 * d'un dessin qui n'en porte pas les mêmes.
 *
 * IL NE PORTE AUCUN DROIT : le périmètre de DROIT est déjà appliqué dans la requête
 * (`ADR-006`), et ce filtre-ci ne trie que ce que l'appelant a déjà le droit de voir.
 */
export function dansLePerimetre(n: Note, perimetre: Perimetre): boolean {
	if (perimetre.type === 'global') return true;
	if (perimetre.type === 'univers') return n.univers === perimetre.nom;
	return n.domaine === perimetre.nom;
}

/**
 * LE SORT DES NOTES QUE RIEN NE RELIE, ET IL EST EXIGÉ À CHAQUE APPEL.
 *
 * `retirees` était le comportement unique, et c'était un défaut de fond : sur le
 * corpus de démonstration, seize notes sur trente-deux ne portent AUCUNE relation
 * déclarée, et la carte les faisait disparaître. La question « qu'est-ce qui n'est
 * relié à rien ? » — celle pour laquelle on ouvre une cartographie — était donc la
 * seule à laquelle l'écran ne pouvait pas répondre.
 *
 * `gardees` les garde, et l'affinité les place (voir `disposer()`) : une note sans
 * relation déclarée est un nœud de sa famille sémantique, dessiné pâle. Ce n'est
 * pas un défaut de visualisation, c'est une mesure de la structuration du corpus.
 *
 * LE CHOIX N'A PAS DE DÉFAUT, ET C'EST VOULU : les deux cartographies ne veulent
 * pas la même chose — la vue complète explore le corpus, la vue par type maître
 * dessine les dépendances d'un type. Un défaut ferait pencher l'une des deux sans
 * que personne ne l'ait décidé.
 */
export type SortDesIsolees = 'gardees' | 'retirees';

/**
 * Le sous-graphe d'un périmètre.
 *
 * @param notes les notes lisibles de l'appelant
 * @param perimetre `global`, `univers` ou `domaine`
 * @param relations les relations du corpus, telles que la base les porte
 * @param isolees ce qu'on fait des notes qu'aucune relation ne touche
 */
export function sousGraphe(
	notes: readonly Note[],
	perimetre: Perimetre,
	relations: readonly Relation[],
	isolees: SortDesIsolees
): Graphe {
	const noeuds = new Map<string, NoeudDeGraphe>();
	for (const n of notes) {
		if (dansLePerimetre(n, perimetre)) noeuds.set(n.id, { id: n.id, note: n, fantome: false });
	}

	const aretes = relations.filter((r) => noeuds.has(r.de) || noeuds.has(r.vers));

	/* Les notes hors périmètre qu'une arête touche : gardées et marquées fantôme,
	   « les masquer donnerait une fausse image des dépendances ». L'index est bâti
	   AVANT la boucle — un `find()` par extrémité parcourait tout le corpus à
	   chaque arête, soit un coût en nombre d'arêtes fois nombre de notes. */
	if (aretes.length > 0) {
		const parIdentifiant = new Map(notes.map((n) => [n.id, n] as const));
		for (const r of aretes) {
			for (const id of [r.de, r.vers]) {
				if (noeuds.has(id)) continue;
				const n = parIdentifiant.get(id);
				if (n) noeuds.set(id, { id, note: n, fantome: true });
			}
		}
	}

	if (isolees === 'retirees') {
		const relies = new Set<string>();
		for (const r of aretes) {
			relies.add(r.de);
			relies.add(r.vers);
		}
		for (const id of [...noeuds.keys()]) if (!relies.has(id)) noeuds.delete(id);
	}

	return { noeuds: [...noeuds.values()], index: noeuds, aretes };
}

/**
 * LE VOISINAGE D'UN NŒUD, à `profondeur` sauts — la réponse au corpus dense.
 *
 * Un parcours en largeur borné : c'est ce qui transforme « une boule de trois cents
 * nœuds » en « les douze qui comptent autour de celui-ci ». Le centre absent rend un
 * graphe VIDE, jamais le graphe entier : une adresse qui désigne une note qu'on n'a
 * pas le droit de lire, ou qui n'existe plus, ne doit pas ouvrir tout le corpus.
 *
 * LES ARÊTES RENDUES SONT CELLES DONT LES DEUX EXTRÉMITÉS SONT DANS LA BOULE. Garder
 * celles qui en sortent dessinerait des traits vers des nœuds absents.
 */
export function voisinage(g: Graphe, centre: string, profondeur: number): Graphe {
	const noeuds = new Map<string, NoeudDeGraphe>();
	const depart = g.index.get(centre);
	if (depart === undefined) return { noeuds: [], index: noeuds, aretes: [] };

	const voisins = adjacence(g);
	const atteints = new Map<string, number>([[centre, 0]]);
	const file: string[] = [centre];
	let tete = 0;
	while (tete < file.length) {
		const v = file[tete] as string;
		tete += 1;
		const d = atteints.get(v) as number;
		if (d >= profondeur) continue;
		for (const w of voisins.get(v) ?? []) {
			if (atteints.has(w)) continue;
			atteints.set(w, d + 1);
			file.push(w);
		}
	}

	/* L'ordre est celui du graphe d'origine, jamais celui du parcours : c'est lui
	   qui décide de l'ordre du balisage, et deux profondeurs successives doivent
	   redessiner les mêmes nœuds au même endroit. */
	for (const n of g.noeuds) if (atteints.has(n.id)) noeuds.set(n.id, n);
	const aretes = g.aretes.filter((r) => atteints.has(r.de) && atteints.has(r.vers));
	return { noeuds: [...noeuds.values()], index: noeuds, aretes };
}

/**
 * LE GRAPHE ÉTENDU À QUELQUES NŒUDS DE PLUS, sans arête nouvelle.
 *
 * C'est ce dont la vue locale a besoin : la boule des relations d'une note ne
 * contient PAS ses voisins d'affinité — ils sont proches par le sens, pas par un
 * lien déclaré, et c'est tout l'intérêt de les montrer. Les faire entrer est ce qui
 * donne enfin un trait d'affinité à dessiner, là où c'est légitime.
 *
 * IL N'AJOUTE AUCUNE ARÊTE. Les traits d'affinité sont rendus à part, en pointillé
 * et étiquetés de leur motif : les verser dans `aretes` en ferait des relations aux
 * yeux de tout ce qui lit le graphe — degrés, points de rupture, centralité.
 */
export function etendreLeGraphe(
	base: Graphe,
	complet: Graphe,
	identifiants: readonly string[]
): Graphe {
	const noeuds = new Map(base.index);
	let ajoute = false;
	for (const id of identifiants) {
		if (noeuds.has(id)) continue;
		const n = complet.index.get(id);
		if (n === undefined) continue;
		noeuds.set(id, n);
		ajoute = true;
	}
	if (!ajoute) return base;
	/* L'ordre reste celui du graphe complet — il décide de l'ordre du balisage. */
	const ordonnes = complet.noeuds.filter((n) => noeuds.has(n.id));
	return { noeuds: ordonnes, index: new Map(ordonnes.map((n) => [n.id, n])), aretes: base.aretes };
}

/** La distance en sauts depuis un nœud, pour tous ceux qu'on atteint. */
export function distancesDepuis(g: Graphe, centre: string): ReadonlyMap<string, number> {
	const voisins = adjacence(g);
	const distance = new Map<string, number>();
	if (!g.index.has(centre)) return distance;
	distance.set(centre, 0);
	const file: string[] = [centre];
	let tete = 0;
	while (tete < file.length) {
		const v = file[tete] as string;
		tete += 1;
		const d = distance.get(v) as number;
		for (const w of voisins.get(v) ?? []) {
			if (distance.has(w)) continue;
			distance.set(w, d + 1);
			file.push(w);
		}
	}
	return distance;
}

export function degres(g: Graphe): ReadonlyMap<string, number> {
	const d = new Map<string, number>();
	for (const n of g.noeuds) d.set(n.id, 0);
	for (const r of g.aretes) {
		const de = d.get(r.de);
		if (de !== undefined) d.set(r.de, de + 1);
		const vers = d.get(r.vers);
		if (vers !== undefined) d.set(r.vers, vers + 1);
	}
	return d;
}

/** Les voisins de chaque nœud, toutes arêtes confondues — la forme que les parcours veulent. */
function adjacence(g: Graphe): Map<string, string[]> {
	const voisins = new Map<string, string[]>();
	for (const n of g.noeuds) voisins.set(n.id, []);
	for (const r of g.aretes) {
		const de = voisins.get(r.de);
		const vers = voisins.get(r.vers);
		if (!de || !vers) continue;
		de.push(r.vers);
		vers.push(r.de);
	}
	return voisins;
}

/**
 * LA CENTRALITÉ DE PASSAGE, PAR NŒUD — `CDC M09.5` : « à quel point cet objet est un
 * point de passage obligé entre deux parties du système ». Algorithme de Brandes, en
 * O(n·m) : sur les ordres de grandeur du produit — quelques centaines de nœuds — le
 * calcul est instantané, et il est fait une fois au chargeur.
 *
 * ELLE N'EXISTAIT PAS, ET DEUX ÉCRANS LA PROMETTAIENT : le réglage « Taille des
 * nœuds » et le chiffre du panneau de détail. Le degré en tenait lieu, et il dit
 * autre chose — une note peut avoir vingt voisins tous rangés dans le même coin, et
 * ne relier rien à rien.
 *
 * LE RÉSULTAT EST NORMALISÉ SUR [0, 1] : c'est ce qui permet de le rendre en taille
 * de nœud sans plafond arbitraire, et de le comparer d'un périmètre à l'autre. Un
 * graphe de moins de trois nœuds n'a aucun passage à mesurer — tout y vaut zéro.
 *
 * ELLE EST DÉTERMINISTE : aucun tirage, et l'ordre des sommes est celui de
 * `g.noeuds`, donc celui de la requête.
 */
export function centralites(g: Graphe): ReadonlyMap<string, number> {
	const ids = g.noeuds.map((n) => n.id);
	const centralite = new Map<string, number>(ids.map((id) => [id, 0]));
	const n = ids.length;
	if (n < 3) return centralite;

	const voisins = adjacence(g);

	for (const source of ids) {
		/* Un parcours en largeur depuis `source`, qui compte les plus courts chemins. */
		const pile: string[] = [];
		const predecesseurs = new Map<string, string[]>();
		const chemins = new Map<string, number>();
		const distance = new Map<string, number>();
		for (const id of ids) {
			predecesseurs.set(id, []);
			chemins.set(id, 0);
			distance.set(id, -1);
		}
		chemins.set(source, 1);
		distance.set(source, 0);

		const file: string[] = [source];
		let tete = 0;
		while (tete < file.length) {
			const v = file[tete] as string;
			tete += 1;
			pile.push(v);
			const dv = distance.get(v) as number;
			for (const w of voisins.get(v) ?? []) {
				if ((distance.get(w) as number) < 0) {
					distance.set(w, dv + 1);
					file.push(w);
				}
				if ((distance.get(w) as number) === dv + 1) {
					chemins.set(w, (chemins.get(w) as number) + (chemins.get(v) as number));
					(predecesseurs.get(w) as string[]).push(v);
				}
			}
		}

		/* Le retour de pile : chaque nœud reverse sa dépendance à ses prédécesseurs. */
		const dependance = new Map<string, number>(ids.map((id) => [id, 0]));
		for (let i = pile.length - 1; i >= 0; i -= 1) {
			const w = pile[i] as string;
			const part = (1 + (dependance.get(w) as number)) / (chemins.get(w) as number);
			for (const v of predecesseurs.get(w) ?? []) {
				dependance.set(v, (dependance.get(v) as number) + (chemins.get(v) as number) * part);
			}
			if (w !== source) {
				centralite.set(w, (centralite.get(w) as number) + (dependance.get(w) as number));
			}
		}
	}

	/* Le graphe n'est pas orienté : chaque paire a été comptée deux fois. Le
	   dénominateur est le nombre de paires de nœuds AUTRES que celui qu'on mesure. */
	const paires = ((n - 1) * (n - 2)) / 2;
	for (const [id, valeur] of centralite) centralite.set(id, valeur / 2 / paires);
	return centralite;
}

/* ── LA TAILLE D'UN NŒUD ───────────────────────────────────────────────────
   « La taille représente une donnée fonctionnelle, jamais une décoration », et
   l'utilisateur choisit LAQUELLE. Le calcul vivait dans la vue, plafonné à huit
   connexions (`15 + min(degré, 8) × 2,6`) : une note à quarante-deux relations
   était dessinée comme une note à huit, c'est-à-dire que le seul canal capable de
   dire « ceci est central » s'éteignait juste avant de devenir intéressant. */

export type MesureDeTaille = 'uniforme' | 'connexions' | 'centralite';

/* LES NŒUDS SONT PETITS, ET C'EST LA MAQUETTE. Une carte de graphe se lit à la
   FORME du nuage et aux ÎLOTS ; les nœuds y sont des pastilles, pas des jetons. À
   onze unités de rayon minimum, quatre-vingts nœuds occupaient toute la surface et
   le dessin n'avait plus de vide — or c'est le vide qui rend un graphe lisible. */
const RAYON_MINIMAL = 6.5;
const AMPLITUDE_DE_RAYON = 11;
const RAYON_UNIFORME = 8;

/**
 * Le rayon d'un nœud, sans plafond. L'échelle est en racine carrée : c'est l'AIRE du
 * disque qui suit la mesure, et c'est l'aire que l'œil compare. En proportion directe
 * du rayon, un nœud deux fois plus connecté paraît quatre fois plus gros.
 *
 * @param maximum la plus grande valeur du périmètre ; l'échelle est donc RELATIVE au
 *   graphe affiché, et un corpus modeste n'est pas dessiné en têtes d'épingle.
 */
export function rayonDeNoeud(mesure: MesureDeTaille, valeur: number, maximum: number): number {
	if (mesure === 'uniforme') return RAYON_UNIFORME;
	/* AUCUNE MESURE À MONTRER — un corpus sans relation, où toute centralité vaut
	   zéro. La taille est alors UNIFORME, jamais la plus petite possible : dessiner
	   quatre-vingts têtes d'épingle laisserait croire que la mesure a été faite et
	   qu'elle est nulle partout, là où il n'y avait rien à mesurer. */
	if (maximum <= 0) return RAYON_UNIFORME;
	const part = Math.sqrt(Math.max(0, valeur) / maximum);
	return RAYON_MINIMAL + AMPLITUDE_DE_RAYON * part;
}

/**
 * Les points d'articulation du graphe des dépendances TECHNIQUES : les nœuds dont le retrait
 * couperait le graphe, c'est-à-dire les points de défaillance unique. Algorithme de Hopcroft
 * et Tarjan, calque de `window.pointsArticulation()`. « Une note qui en documente une autre
 * n'en dépend pas » : les relations documentaires sont écartées, sans quoi toute fiche
 * documentée passerait pour un point de rupture.
 */
export function pointsArticulation(
	g: Graphe,
	techniques: readonly Relation['type'][]
): ReadonlySet<string> {
	const voisins = new Map<string, string[]>();
	for (const n of g.noeuds) voisins.set(n.id, []);
	for (const r of g.aretes) {
		const de = voisins.get(r.de);
		const vers = voisins.get(r.vers);
		if (!de || !vers) continue;
		if (!estTechnique(r.type, techniques)) continue;
		de.push(r.vers);
		vers.push(r.de);
	}

	const visite = new Set<string>();
	const decouverte = new Map<string, number>();
	const bas = new Map<string, number>();
	const parent = new Map<string, string>();
	const articulation = new Set<string>();
	let temps = 0;

	const parcourir = (u: string): void => {
		let enfants = 0;
		visite.add(u);
		temps++;
		decouverte.set(u, temps);
		bas.set(u, temps);
		for (const v of voisins.get(u) ?? []) {
			if (!visite.has(v)) {
				enfants++;
				parent.set(v, u);
				parcourir(v);
				bas.set(u, Math.min(bas.get(u) ?? 0, bas.get(v) ?? 0));
				if (!parent.has(u) && enfants > 1) articulation.add(u);
				if (parent.has(u) && (bas.get(v) ?? 0) >= (decouverte.get(u) ?? 0)) articulation.add(u);
			} else if (v !== parent.get(u)) {
				bas.set(u, Math.min(bas.get(u) ?? 0, decouverte.get(v) ?? 0));
			}
		}
	};

	for (const id of voisins.keys()) if (!visite.has(id)) parcourir(id);
	return articulation;
}

export interface RelationOrientee {
	readonly autre: string;
	readonly sortant: boolean;
	readonly type: Relation['type'];
}

export function relationsDe(id: string, relations: readonly Relation[]): RelationOrientee[] {
	return relations
		.filter((r) => r.de === id || r.vers === id)
		.map((r) => ({
			autre: r.de === id ? r.vers : r.de,
			sortant: r.de === id,
			type: r.type
		}));
}

export function estTechnique(
	type: Relation['type'],
	techniques: readonly Relation['type'][]
): boolean {
	return (techniques as readonly string[]).includes(type);
}

export function titreDe(g: Graphe, notes: readonly Note[], id: string): string {
	const d = g.index.get(id);
	if (d) return d.note.titre;
	return notes.find((x) => x.id === id)?.titre ?? id;
}

/**
 * Les types présents dans le graphe, classés par effectif décroissant — le classement
 * du gel, dont la stabilité tient l'ordre d'apparition à effectif égal.
 */
export function typesPresents(g: Graphe): { cle: string; type: EncodageDeType; n: number }[] {
	const comptes = new Map<string, number>();
	for (const n of g.noeuds) {
		const k = typeCarto(n.note);
		comptes.set(k, (comptes.get(k) ?? 0) + 1);
	}
	return [...comptes.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([cle, n]) => ({ cle, type: encodageDuType(cle), n }));
}

/** Les constantes de la disposition. */
const RAYON_INITIAL_Y = 190;
const REPULSION = 26000;
const LONGUEUR_DE_RESSORT = 168;
const RAIDEUR = 0.045;
/**
 * LE RAPPEL VERS LE CENTRE, ET IL EST ANISOTROPE — c'est ce qui fait que le dessin
 * remplit son cadre.
 *
 * Il était le même dans les deux axes, et la répulsion l'est aussi : l'équilibre
 * était donc un DISQUE, posé dans un cadre de mille sur six cent vingt. Mesuré : une
 * étendue de 439 × 436 pour 816 × 436 disponibles — les côtés restaient vides, et le
 * cadrage final ne pouvait rien y faire puisqu'il préserve les proportions. Sur
 * quatre-vingts nœuds, le corpus entier s'entassait au milieu en une boule illisible
 * pendant que la moitié de la surface ne servait à rien.
 *
 * Le rappel horizontal est donc affaibli dans le rapport du cadre : l'équilibre
 * devient une ellipse de MÊMES PROPORTIONS que le repère, et le dessin s'étale.
 */
const RAPPEL_AU_CENTRE = 0.022;
const PAS = 0.55;
const AMORTISSEMENT = 0.72;
const MARGE = 92;
/**
 * JUSQU'OÙ LE CADRAGE PEUT GROSSIR UN PETIT NUAGE.
 *
 * IL PLAFONNAIT À 1,3, ET C'ÉTAIT TROP BAS POUR LA VUE LOCALE : un voisinage de cinq
 * nœuds occupait le tiers du canevas au milieu d'un vide, alors que l'écran entier
 * est fait pour lui. Le plafond existe pour qu'un graphe de deux nœuds ne soit pas
 * étiré jusqu'à l'absurde ; à 2,4 il tient encore ce rôle et laisse un voisinage
 * remplir sa page.
 */
const ZOOM_MAX_DE_CADRAGE = 2.4;

/**
 * LES PROPORTIONS DE LA SURFACE UTILE — celles que le dessin doit remplir, marges
 * déduites. C'est ce rapport-là, et non celui du repère entier, que l'équilibre doit
 * viser : le cadrage final grossit à proportions CONSERVÉES, si bien qu'un nuage
 * moins large que la surface laisse les côtés vides sans que rien ne puisse le
 * rattraper.
 */
const PROPORTION_UTILE = (LARGEUR - MARGE * 2) / (HAUTEUR - MARGE * 2);

/**
 * LE RAPPEL HORIZONTAL, AFFAIBLI POUR QUE LE NUAGE PRENNE LA FORME DU CADRE.
 *
 * L'EXPOSANT ÉTAIT DE TROIS, et il l'était pour un nuage de NŒUDS libres, dont le
 * rayon d'équilibre varie comme la racine cubique de l'inverse du rappel. Ce qui
 * s'écarte aujourd'hui, ce sont des ÎLOTS que la répulsion entre familles sépare à
 * distance fixe : leur étalement suit le rappel bien plus vite, et l'exposant trois
 * rendait une bande de deux fois plus large que haute dans un cadre qui ne l'est
 * qu'une fois et demie — le tiers bas du canevas restait vide. Mesuré au navigateur.
 */
const RAPPEL_HORIZONTAL = RAPPEL_AU_CENTRE / PROPORTION_UTILE ** 1.5;

/** Le départ suit déjà les proportions visées : y arriver coûte moins de tours. */
const RAYON_INITIAL_X = 190 * PROPORTION_UTILE;

/**
 * LA RAIDEUR DU RAPPEL VERS LE BARYCENTRE DE LA FAMILLE — l'affinité PLACE, elle ne
 * trace pas.
 *
 * C'est la traduction mécanique de la décision : une appartenance commune n'est pas
 * un lien entre deux objets, et la dessiner en arêtes reviendrait, pour une famille
 * de quinze notes, à tracer cent cinq segments qui disent tous la même chose — et
 * dont chacun, pris seul, affirme un rapport que personne n'a déclaré. Le regroupement
 * se lit donc dans la GÉOGRAPHIE du dessin, et dans le contour qui l'entoure.
 *
 * LE RAPPEL VISE LE BARYCENTRE COURANT DE LA FAMILLE, PAS UN POINT IMPOSÉ. Il visait
 * une COURONNE d'ancrages posés autour du centre du repère : les îlots se rangeaient
 * en rosace, à égale distance d'un milieu qui ne voulait rien dire, et la carte
 * affirmait que le corpus rayonne depuis un point. Un regroupement doit ÉMERGER des
 * données ; l'imposer, c'est dessiner la géométrie qu'on a choisie, pas celle qu'on a.
 *
 * ELLE RESTE MODÉRÉE, ET C'EST L'ARBITRAGE. Trop forte, elle écrase la topologie des
 * vraies relations — deux notes reliées mais rangées dans deux familles ne peuvent
 * plus se rapprocher. Ce qui SÉPARE les îlots n'est donc pas le serrement de chacun,
 * c'est la répulsion entre familles, juste en dessous.
 */
const RAIDEUR_DE_FAMILLE = 0.13;

/**
 * LA RÉPULSION ENTRE FAMILLES — ce qui fait exister les îlots sans les ranger.
 *
 * Deux familles dont les barycentres se rapprochent trop se poussent l'une l'autre,
 * membres compris. C'est ce qui remplace la couronne : la séparation vient d'une
 * force, donc d'un équilibre que les données commandent, et non d'un cercle tracé à
 * l'avance. Une famille nombreuse tient plus de place et repousse plus loin.
 *
 * LE COÛT EST EN O(F²) SUR LE NOMBRE DE FAMILLES, jamais en O(n²) sur les notes : la
 * poussée se calcule UNE FOIS par paire de familles, puis se distribue à leurs
 * membres. Sur le corpus de recette — soixante-dix-sept notes, douze familles —, cela
 * fait soixante-six paires par tour au lieu de deux mille huit cent cinquante.
 */
const SEPARATION_DE_BASE = 118;
const SEPARATION_PAR_MEMBRE = 23;
const POUSSEE_ENTRE_FAMILLES = 0.12;

/** La raideur d'un lien souple — voir `liensSouples`. */
const RAIDEUR_SOUPLE = 0.015;

/** Le nombre de tours de la disposition. */
export const ITERATIONS_DE_DISPOSITION = 320;

/**
 * LES FAMILLES EFFECTIVEMENT DESSINÉES.
 *
 * ELLE EXISTE POUR QU'IL N'Y EN AIT QU'UNE. La disposition rapproche les nœuds d'une
 * même famille, et la vue entoure ces mêmes nœuds d'un contour : les deux doivent
 * partir de la MÊME liste. Deux constructions parallèles finiraient par diverger
 * d'une famille, et le contour cernerait un groupe que le dessin n'a pas rapproché.
 *
 * UNE FAMILLE D'UN SEUL NŒUD PRÉSENT NE RAPPROCHE DE PERSONNE : elle n'est pas
 * dessinée, et son unique note se place comme n'importe quelle note sans famille —
 * librement, sans qu'aucun trait ne la rattache à quoi que ce soit.
 */
export function famillesPresentes(
	g: Graphe,
	familleParNoeud: ReadonlyMap<string, string>
): string[] {
	const comptes = new Map<string, number>();
	for (const n of g.noeuds) {
		const famille = familleParNoeud.get(n.id);
		if (famille === undefined) continue;
		comptes.set(famille, (comptes.get(famille) ?? 0) + 1);
	}
	return [...comptes.entries()].filter(([, n]) => n >= 2).map(([nom]) => nom);
}

export interface OptionsDeDisposition {
	readonly iterations?: number;
	/**
	 * La famille sémantique de chaque nœud. Absente, la disposition ne connaît que
	 * les relations déclarées — c'est le cas d'un appelant qui n'en calcule pas.
	 */
	readonly familleParNoeud?: ReadonlyMap<string, string>;
	/**
	 * DES PAIRES QUI SE RAPPROCHENT SANS ÊTRE DES ARÊTES — les affinités révélées de
	 * la vue locale. Un nœud d'affinité n'a aucun lien déclaré vers le centre : sans
	 * ce rappel, la répulsion l'expédierait au bord, et le pointillé qui le relie
	 * traverserait tout le dessin. Le ressort est TROIS FOIS plus lâche que celui
	 * d'une relation : ils se rapprochent, ils ne s'attachent pas.
	 */
	readonly liensSouples?: readonly (readonly [string, string])[];
}

/**
 * La disposition du graphe — le calque de `disposer()` du gel, transcrit ligne pour ligne,
 * constantes comprises.
 *
 * ELLE EST DÉTERMINISTE, ET C'EST LA PROPRIÉTÉ QUI COMPTE : « deux chargements du même
 * périmètre donnent exactement la même carte ». Aucun tirage, aucune horloge, aucune mesure du
 * document — la place d'un nœud ne dépend que de l'ENSEMBLE des nœuds et de leur ORDRE.
 *
 * `V-19.svelte` portait une table de seize positions INDEXÉE PAR LES IDENTIFIANTS DE SEIZE
 * NOTES DU JEU DE DÉMONSTRATION : le jeu descendait dans le produit par la géométrie.
 */
/**
 * CE QUE LA DISPOSITION REND — les places, et rien d'autre.
 *
 * ELLE RENDAIT AUSSI UN « MOYEU » ET DES « ANCRAGES », et c'étaient les deux repères
 * d'une géométrie imposée : un point au centre du repère, portant le nom du
 * périmètre, et une couronne d'ancrages autour de lui. La vue y accrochait des
 * rayons — du moyeu vers chaque famille, de chaque famille vers ses notes. Sur le
 * corpus de recette, cela faisait soixante-dix-sept traits que personne n'a déclarés
 * pour sept relations qui existent : la carte disait d'abord « tout part d'ici »,
 * ce qui est faux, et seulement ensuite ce que le corpus contient.
 *
 * Un périmètre est un CONTEXTE DE FILTRAGE, pas un nœud du graphe ; une famille est
 * une APPARTENANCE, pas un objet auquel on se relie. Ni l'un ni l'autre ne se dessine.
 */
export interface Disposition {
	readonly places: Map<string, Place>;
}

export function disposer(g: Graphe, options: OptionsDeDisposition = {}): Disposition {
	const iterations = options.iterations ?? ITERATIONS_DE_DISPOSITION;
	const familleParNoeud = options.familleParNoeud;

	interface Corps {
		x: number;
		y: number;
		vx: number;
		vy: number;
	}

	const ids = g.noeuds.map((n) => n.id);
	const n = ids.length;
	const p = new Map<string, Corps>();

	/* LA PLACE DE DÉPART NE DÉPEND QUE DE L'IDENTIFIANT DU NŒUD, jamais de son rang.
	   Le cercle initial était parcouru DANS L'ORDRE DU CORPUS : ajouter une note
	   décalait toutes les suivantes d'un cran, et la carte entière changeait. On ne
	   peut pas s'orienter dans un graphe qu'on ne reconnaît pas d'une visite à
	   l'autre — c'est la première condition, avant toute qualité de dessin.

	   Le hachage donne l'angle, un second hachage le rayon : deux nœuds ne partent
	   pas du même point, et le départ reste RIGOUREUSEMENT le même à chaque
	   chargement. La disposition reste donc déterministe, et le devient même
	   davantage : elle ne dépend plus de l'ordre de la requête. */
	const ECHELLE = 4294967296;
	for (const id of ids) {
		const angle = (hachageStable(id) / ECHELLE) * Math.PI * 2;
		const part = 0.4 + 0.6 * (hachageStable(id + '·rayon') / ECHELLE);
		p.set(id, {
			x: LARGEUR / 2 + Math.cos(angle) * RAYON_INITIAL_X * part,
			y: HAUTEUR / 2 + Math.sin(angle) * RAYON_INITIAL_Y * part,
			vx: 0,
			vy: 0
		});
	}
	if (n === 0) return { places: new Map() };

	const liens = g.aretes.filter((r) => p.has(r.de) && p.has(r.vers));
	const souples = (options.liensSouples ?? []).filter(([a, b]) => p.has(a) && p.has(b));

	/* Les nœuds de chaque famille — la liste vient de la fabrique unique, celle que
	   la vue emploie pour tracer les contours. */
	const parFamille = new Map<string, string[]>();
	if (familleParNoeud !== undefined) {
		for (const nom of famillesPresentes(g, familleParNoeud)) parFamille.set(nom, []);
		for (const id of ids) {
			const famille = familleParNoeud.get(id);
			if (famille === undefined) continue;
			parFamille.get(famille)?.push(id);
		}
	}

	/* LES ÎLOTS ÉMERGENT, ILS NE SONT PAS POSÉS. Le barycentre de chaque famille est
	   RECALCULÉ à chaque tour depuis les places courantes : c'est un point que les
	   données produisent, pas une case d'une couronne. */
	const nomsDeFamille = [...parFamille.keys()];
	const barycentres = new Map<string, Place>();
	const poussees = new Map<string, { x: number; y: number }>();

	for (let t = 0; t < iterations; t++) {
		const refroid = 1 - t / iterations;

		/* Répulsion entre tous les nœuds : ils ne se chevauchent pas. */
		for (let i = 0; i < n; i++) {
			for (let j = i + 1; j < n; j++) {
				const a = p.get(ids[i] as string) as Corps;
				const b = p.get(ids[j] as string) as Corps;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d2 = dx * dx + dy * dy || 0.01;
				const d = Math.sqrt(d2);
				const f = REPULSION / d2;
				const ux = dx / d;
				const uy = dy / d;
				a.vx -= ux * f;
				a.vy -= uy * f;
				b.vx += ux * f;
				b.vy += uy * f;
			}
		}

		/* Ressorts sur les arêtes. */
		for (const r of liens) {
			const a = p.get(r.de) as Corps;
			const b = p.get(r.vers) as Corps;
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
			const f = (d - LONGUEUR_DE_RESSORT) * RAIDEUR;
			const ux = dx / d;
			const uy = dy / d;
			a.vx += ux * f;
			a.vy += uy * f;
			b.vx -= ux * f;
			b.vy -= uy * f;
		}

		/* Les liens souples : même ressort, raideur bien moindre. */
		for (const [a, b] of souples) {
			const qa = p.get(a) as Corps;
			const qb = p.get(b) as Corps;
			const dx = qb.x - qa.x;
			const dy = qb.y - qa.y;
			const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
			const f = (d - LONGUEUR_DE_RESSORT) * RAIDEUR_SOUPLE;
			qa.vx += (dx / d) * f;
			qa.vy += (dy / d) * f;
			qb.vx -= (dx / d) * f;
			qb.vy -= (dy / d) * f;
		}

		/* ── L'AFFINITÉ AGIT ICI, ET NULLE PART SUR LE DESSIN ────────────────
		   Trois temps, et le coût de chacun est écrit à côté :

		     1. le barycentre de chaque famille            O(n)
		     2. la répulsion entre familles, par paires    O(F²), F ≪ n
		     3. le rappel de chaque membre vers le sien    O(n)

		   Les paires de NOTES ne sont jamais parcourues pour l'affinité : une
		   famille de quinze notes coûte quinze additions, pas cent cinq. */

		for (const nom of nomsDeFamille) {
			const membres = parFamille.get(nom) as string[];
			let sx = 0;
			let sy = 0;
			for (const id of membres) {
				const q = p.get(id) as Corps;
				sx += q.x;
				sy += q.y;
			}
			barycentres.set(nom, { x: sx / membres.length, y: sy / membres.length });
			poussees.set(nom, { x: 0, y: 0 });
		}

		/* La séparation visée croît avec l'effectif : une famille nombreuse occupe
		   plus de place, et doit donc tenir ses voisines plus loin. */
		const etendue = (nom: string): number =>
			SEPARATION_PAR_MEMBRE * Math.sqrt((parFamille.get(nom) as string[]).length);

		for (let i = 0; i < nomsDeFamille.length; i++) {
			for (let j = i + 1; j < nomsDeFamille.length; j++) {
				const nomA = nomsDeFamille[i] as string;
				const nomB = nomsDeFamille[j] as string;
				const a = barycentres.get(nomA) as Place;
				const b = barycentres.get(nomB) as Place;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
				const visee = SEPARATION_DE_BASE + etendue(nomA) + etendue(nomB);
				if (d >= visee) continue;
				const f = (visee - d) * POUSSEE_ENTRE_FAMILLES;
				const ux = dx / d;
				const uy = dy / d;
				const pa = poussees.get(nomA) as { x: number; y: number };
				const pb = poussees.get(nomB) as { x: number; y: number };
				pa.x -= ux * f;
				pa.y -= uy * f;
				pb.x += ux * f;
				pb.y += uy * f;
			}
		}

		for (const nom of nomsDeFamille) {
			const centreDeFamille = barycentres.get(nom) as Place;
			const poussee = poussees.get(nom) as { x: number; y: number };
			for (const id of parFamille.get(nom) as string[]) {
				const q = p.get(id) as Corps;
				q.vx += (centreDeFamille.x - q.x) * RAIDEUR_DE_FAMILLE + poussee.x;
				q.vy += (centreDeFamille.y - q.y) * RAIDEUR_DE_FAMILLE + poussee.y;
			}
		}

		/* Rappel vers le centre, puis amortissement : la disposition converge. */
		for (const id of ids) {
			const q = p.get(id) as Corps;
			q.vx += (LARGEUR / 2 - q.x) * RAPPEL_HORIZONTAL;
			q.vy += (HAUTEUR / 2 - q.y) * RAPPEL_AU_CENTRE;
			q.x += q.vx * PAS * refroid;
			q.y += q.vy * PAS * refroid;
			q.vx *= AMORTISSEMENT;
			q.vy *= AMORTISSEMENT;
		}
	}

	/* ── LE CADRAGE, SUR L'ÉTENDUE ENTIÈRE ────────────────────────────────────
	   IL SE RÉGLAIT SUR DES CENTILES — du cinquième au quatre-vingt-quinzième —, et
	   c'était la parade à un défaut qui n'existe plus. Les îlots étaient posés sur
	   une COURONNE de rayon fixe : les nœuds qu'aucune famille ne retenait partaient
	   loin, la boîte englobante suivait, le grossissement tombait à rien, et tout le
	   reste se tassait au milieu en une boule.

	   Depuis que les familles se repoussent au lieu d'être rangées, l'étendue est
	   celle du nuage lui-même, et le centile COUPAIT : des îlots entiers sortaient du
	   cadre par le haut, et la carte s'ouvrait sur des nœuds à moitié dessinés —
	   mesuré au navigateur. Le cadrage prend donc les extrêmes, et rien n'est coupé. */
	const xs = ids.map((id) => (p.get(id) as Corps).x);
	const ys = ids.map((id) => (p.get(id) as Corps).y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	const ex = maxX - minX || 1;
	const ey = maxY - minY || 1;
	const k = Math.min((LARGEUR - MARGE * 2) / ex, (HAUTEUR - MARGE * 2) / ey, ZOOM_MAX_DE_CADRAGE);

	/* LE CADRAGE, APPLIQUÉ À TOUT CE QUI SE DESSINE. La vue calcule ses contours de
	   famille SUR LES PLACES RENDUES ICI, donc après cadrage : c'est ce qui garantit
	   qu'un contour ne peut pas se poser à côté de l'îlot qu'il cerne. */
	const cadrer = (q: Place): Place => ({
		x: MARGE + (q.x - minX) * k + (LARGEUR - MARGE * 2 - ex * k) / 2,
		y: MARGE + (q.y - minY) * k + (HAUTEUR - MARGE * 2 - ey * k) / 2
	});

	const places = new Map<string, Place>();
	for (const id of ids) places.set(id, cadrer(p.get(id) as Corps));

	return { places };
}

/* ── LE CONTOUR D'UNE FAMILLE ──────────────────────────────────────────────
   L'affinité est une APPARTENANCE, pas un lien entre deux objets : sa forme
   juste est un ensemble, pas un faisceau de segments. Le contour dit d'un trait
   ce que cent cinq arêtes diraient mal — et il ne peut pas être confondu avec une
   relation déclarée, ce qu'un pointillé, si discret soit-il, ne garantit jamais.

   IL EST CALCULÉ SUR LES PLACES, DONC APRÈS LA DISPOSITION. C'est la même donnée
   qui rapproche les nœuds (`RAIDEUR_DE_FAMILLE`) et qui les entoure : le contour
   ne peut pas désigner un groupe que le dessin aurait éparpillé. */

/** La marge entre le nœud le plus extérieur et le trait du contour. */
const MARGE_DE_CONTOUR = 34;

/** Le nombre de points par nœud — assez pour arrondir, assez peu pour rester bref. */
const POINTS_PAR_NOEUD = 10;

/**
 * L'enveloppe convexe d'un nuage — parcours de Andrew, en O(k log k). L'ordre du tri
 * est total (x puis y) : deux nuages identiques rendent la même enveloppe.
 */
function enveloppeConvexe(points: readonly Place[]): Place[] {
	if (points.length < 3) return [...points];
	const tries = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
	const cote = (o: Place, a: Place, b: Place): number =>
		(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

	const construire = (liste: readonly Place[]): Place[] => {
		const pile: Place[] = [];
		for (const p of liste) {
			while (
				pile.length >= 2 &&
				cote(pile[pile.length - 2] as Place, pile[pile.length - 1] as Place, p) <= 0
			) {
				pile.pop();
			}
			pile.push(p);
		}
		pile.pop();
		return pile;
	};

	return [...construire(tries), ...construire([...tries].reverse())];
}

/**
 * LE CONTOUR D'UN GROUPE DE NŒUDS, en chemin SVG fermé — ou `null` quand il n'y a
 * rien à entourer. Chaque nœud est d'abord dilaté en une couronne de points : c'est
 * ce qui donne un contour arrondi pour DEUX nœuds comme pour quinze, sans traiter
 * les petits effectifs à part. L'enveloppe est ensuite adoucie par des quadratiques
 * passant par les milieux — un polygone à angles vifs se lirait comme une figure
 * déclarée, alors que ce contour est une aide à la lecture.
 */
export function contourDeGroupe(
	places: readonly Place[],
	rayons: readonly number[]
): string | null {
	if (places.length === 0) return null;

	const nuage: Place[] = [];
	places.forEach((place, i) => {
		const marge = (rayons[i] ?? 0) + MARGE_DE_CONTOUR;
		for (let k = 0; k < POINTS_PAR_NOEUD; k += 1) {
			const a = (k / POINTS_PAR_NOEUD) * Math.PI * 2;
			nuage.push({ x: place.x + Math.cos(a) * marge, y: place.y + Math.sin(a) * marge });
		}
	});

	const enveloppe = enveloppeConvexe(nuage);
	if (enveloppe.length < 3) return null;

	const milieu = (a: Place, b: Place): Place => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
	const depart = milieu(enveloppe[enveloppe.length - 1] as Place, enveloppe[0] as Place);
	let d = `M${depart.x.toFixed(1)} ${depart.y.toFixed(1)}`;
	for (let i = 0; i < enveloppe.length; i += 1) {
		const sommet = enveloppe[i] as Place;
		const suivant = enveloppe[(i + 1) % enveloppe.length] as Place;
		const fin = milieu(sommet, suivant);
		d += `Q${sommet.x.toFixed(1)} ${sommet.y.toFixed(1)} ${fin.x.toFixed(1)} ${fin.y.toFixed(1)}`;
	}
	return d + 'Z';
}

/** Le barycentre d'un nuage — où le nom de la famille se pose. */
export function barycentre(places: readonly Place[]): Place | null {
	if (places.length === 0) return null;
	let x = 0;
	let y = 0;
	for (const p of places) {
		x += p.x;
		y += p.y;
	}
	return { x: x / places.length, y: y / places.length };
}
