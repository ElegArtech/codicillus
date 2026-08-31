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

export type FormeDeNoeud = 'carre' | 'cercle' | 'hexagone' | 'feuille' | 'losange';

export interface EncodageDeType {
	readonly forme: FormeDeNoeud;
	readonly code: string;
	readonly couleur: string;
	readonly nom: string;
}

/**
 * La table des types cartographiques, recopiée du gel sans un caractère de plus. Les
 * teintes sont des attributs de présentation SVG portés par le balisage du gel, pas
 * des déclarations de style.
 */
export const TYPES: ReadonlyMap<string, EncodageDeType> = new Map([
	['Serveur', { forme: 'carre', code: 'SRV', couleur: '#1b6b7a', nom: 'Serveur' }],
	['Application', { forme: 'cercle', code: 'APP', couleur: '#453ba0', nom: 'Application' }],
	['Contact', { forme: 'hexagone', code: 'CTC', couleur: '#7a2f8f', nom: 'Contact' }],
	['Procédure', { forme: 'feuille', code: 'PRO', couleur: '#3e5266', nom: 'Procédure' }],
	['Guide', { forme: 'feuille', code: 'GUI', couleur: '#3e5266', nom: 'Guide' }],
	['Note', { forme: 'losange', code: 'NOT', couleur: '#6b7c87', nom: 'Note' }],
	['Signet', { forme: 'losange', code: 'LIE', couleur: '#6b7c87', nom: 'Signet' }]
] as const);

/**
 * Le repli du gel, réduit à sa seule justification : un nom de type VIDE. Ce n'était
 * pas son emploi — il servait à TOUT nom absent de la table, et c'était le défaut.
 */
const TYPE_PAR_DEFAUT: EncodageDeType = {
	forme: 'losange',
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
	/* Feuille : un rectangle au coin replié, comme une page. */
	const w = r * 0.92;
	const h = r * 1.15;
	const c = r * 0.42;
	return {
		balise: 'path',
		d: `M${-w} ${-h} H${w - c} L${w} ${-h + c} V${h} H${-w} Z`
	};
}

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
 * Le sous-graphe d'un périmètre — le calque de `window.sousGraphe()`.
 *
 * @param notes le jeu de semence de la vue, `corpusPourVue()`
 * @param perimetre `global`, `univers` ou `domaine`
 * @param relations les relations du corpus, telles que la base les porte.
 */
export function sousGraphe(
	notes: readonly Note[],
	perimetre: Perimetre,
	relations: readonly Relation[]
): Graphe {
	const noeuds = new Map<string, NoeudDeGraphe>();
	for (const n of notes) {
		if (dansLePerimetre(n, perimetre)) noeuds.set(n.id, { id: n.id, note: n, fantome: false });
	}

	const aretes = relations.filter((r) => noeuds.has(r.de) || noeuds.has(r.vers));
	for (const r of aretes) {
		for (const id of [r.de, r.vers]) {
			if (noeuds.has(id)) continue;
			const n = notes.find((x) => x.id === id);
			if (n) noeuds.set(id, { id, note: n, fantome: true });
		}
	}

	/* Seules les notes effectivement reliées composent le graphe. */
	const relies = new Set<string>();
	for (const r of aretes) {
		relies.add(r.de);
		relies.add(r.vers);
	}
	for (const id of [...noeuds.keys()]) if (!relies.has(id)) noeuds.delete(id);

	return { noeuds: [...noeuds.values()], index: noeuds, aretes };
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

export interface Place {
	readonly x: number;
	readonly y: number;
}

/** Le repère du dessin — le `viewBox` que les trois vues déclarent. */
const LARGEUR = 1000;
const HAUTEUR = 620;

/** Les constantes de `disposer()` du gel — `V-19:2566-2626`, à la valeur près. */
const RAYON_INITIAL_X = 220;
const RAYON_INITIAL_Y = 190;
const REPULSION = 26000;
const LONGUEUR_DE_RESSORT = 168;
const RAIDEUR = 0.045;
const RAPPEL_AU_CENTRE = 0.006;
const PAS = 0.55;
const AMORTISSEMENT = 0.72;
const MARGE = 92;
const ZOOM_MAX_DE_CADRAGE = 1.3;

/** Le nombre de tours que le gel demande — `V-19:3096`, `disposer(graphe, 320)`. */
export const ITERATIONS_DE_DISPOSITION = 320;

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
export function disposer(g: Graphe, iterations = ITERATIONS_DE_DISPOSITION): Map<string, Place> {
	interface Corps {
		x: number;
		y: number;
		vx: number;
		vy: number;
	}

	const ids = g.noeuds.map((n) => n.id);
	const n = ids.length;
	const p = new Map<string, Corps>();
	ids.forEach((id, i) => {
		const a = (i / n) * Math.PI * 2;
		p.set(id, {
			x: LARGEUR / 2 + Math.cos(a) * RAYON_INITIAL_X,
			y: HAUTEUR / 2 + Math.sin(a) * RAYON_INITIAL_Y,
			vx: 0,
			vy: 0
		});
	});
	if (n === 0) return new Map();

	const liens = g.aretes.filter((r) => p.has(r.de) && p.has(r.vers));

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

		/* Rappel vers le centre, puis amortissement : la disposition converge. */
		for (const id of ids) {
			const q = p.get(id) as Corps;
			q.vx += (LARGEUR / 2 - q.x) * RAPPEL_AU_CENTRE;
			q.vy += (HAUTEUR / 2 - q.y) * RAPPEL_AU_CENTRE;
			q.x += q.vx * PAS * refroid;
			q.y += q.vy * PAS * refroid;
			q.vx *= AMORTISSEMENT;
			q.vy *= AMORTISSEMENT;
		}
	}

	/* Cadrage sur l'ensemble. */
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (const id of ids) {
		const q = p.get(id) as Corps;
		minX = Math.min(minX, q.x);
		maxX = Math.max(maxX, q.x);
		minY = Math.min(minY, q.y);
		maxY = Math.max(maxY, q.y);
	}
	const ex = maxX - minX || 1;
	const ey = maxY - minY || 1;
	const k = Math.min((LARGEUR - MARGE * 2) / ex, (HAUTEUR - MARGE * 2) / ey, ZOOM_MAX_DE_CADRAGE);

	const places = new Map<string, Place>();
	for (const id of ids) {
		const q = p.get(id) as Corps;
		places.set(id, {
			x: MARGE + (q.x - minX) * k + (LARGEUR - MARGE * 2 - ex * k) / 2,
			y: MARGE + (q.y - minY) * k + (HAUTEUR - MARGE * 2 - ey * k) / 2
		});
	}
	return places;
}
