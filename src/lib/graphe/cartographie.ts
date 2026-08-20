/**
 * Le socle commun des deux cartographies — V-19 « Cartographie » et V-20
 * « Cartographie par type maître ».
 *
 * CE MODULE EXISTE PARCE QUE LE GEL LE DIT, ET IL S'ARRÊTE OÙ LE GEL S'ARRÊTE.
 * Les deux maquettes portent, mot pour mot, le même bloc introduit par le
 * commentaire « CARTOGRAPHIE — socle commun […] Partagés par V-19 et V-20 : un
 * nœud doit se reconnaître à l'identique d'un mode à l'autre, sinon la bascule
 * fait perdre le fil » (`V-19:2327`, `V-20:2437`). Le partage est donc MESURÉ
 * sur le gel, pas supposé : `diff` des deux fenêtres donne zéro ligne de
 * divergence sur l'encodage des types et la géométrie des formes.
 *
 * CE QUI N'Y EST PAS, ET POURQUOI.
 *
 *   • LE PANNEAU DE DÉTAIL. Il est lui aussi identique dans les deux gels,
 *     mais il porte des styles en ligne — `font-size:var(--t-mini);
 *     color:var(--c-danger);…` — que P-6.4 n'admet QUE dans un fichier
 *     rattaché à une maquette. Le rattachement se fait par le nommage
 *     (`src/vues/V-xx.svelte`, ARB-016) ou par déclaration humaine
 *     (`verif/references/preuve-par-le-gel.json`, ARB-022) — qu'un lot
 *     d'exécution n'écrit pas. Une ressource partagée portant ces styles
 *     serait donc rouge en P-1.7 sans qu'aucun geste licite ne la débloque.
 *     Le panneau reste écrit dans chaque vue, avec sa preuve par le gel.
 *   • V-21. La carte mentale ne partage RIEN d'ici : ni type cartographique,
 *     ni forme, ni sous-graphe. Elle dessine l'arborescence du corpus, pas le
 *     graphe des relations. La factoriser avec les deux autres aurait été un
 *     regroupement par nom de lot, jamais par contenu.
 *   • LA DISPOSITION. Elle n'est pas calculée ici, et elle ne l'est nulle part
 *     (ARB-011) : V-19 rend les positions du gel telles quelles, V-20 rend une
 *     géométrie d'anneau et d'étoile que sa propre maquette qualifie de
 *     « déterministe, jamais simulée ».
 *
 * AUCUNE DONNÉE PROPRE (RG-M09-01) : tout vient de `seeds/corpus.ts` —
 * `RELATIONS`, `RELATIONS_TECHNIQUES`, `TYPES_RELATION` et le jeu de notes que
 * le mode démo passe en propriété.
 *
 * LES DEUX TABLEAUX SONT DES PARAMÈTRES, DE DÉFAUT LA CONSTANTE (T-043). La
 * base porte les relations réellement ; une vue qui les reçoit d'un chargeur
 * de route les fait descendre ici. Le défaut garde le comportement d'avant à
 * l'octet : aucun appel existant ne change, et le banc ne bouge pas d'un pixel.
 */
import { RELATIONS, RELATIONS_TECHNIQUES, type Note, type Relation } from '../../../seeds/corpus';

/* ── L'encodage des types ──────────────────────────────────────────────────
   « Chaque type a sa géométrie ET son code de trois lettres : la couleur ne
   porte jamais seule le type » (V-19:2334). C'est RG-M18-09 rendu au balisage :
   forme et code sont redondants avec la teinte, jamais remplacés par elle. */

/** Les cinq géométries de nœud du gel. */
export type FormeDeNoeud = 'carre' | 'cercle' | 'hexagone' | 'feuille' | 'losange';

/** Ce qu'un type cartographique porte : sa forme, son code, sa teinte, son nom. */
export interface EncodageDeType {
	readonly forme: FormeDeNoeud;
	readonly code: string;
	readonly couleur: string;
	readonly nom: string;
}

/**
 * La table des types cartographiques, recopiée du gel sans un caractère de
 * plus. Les teintes sont des attributs de présentation SVG portés par le
 * balisage du gel (`fill`), pas des déclarations de style : elles ne relèvent
 * donc pas de P-1.1, qui vise les valeurs de feuille et les attributs `style`.
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

/** Le repli du gel : `TYPES[k] || TYPES["Note"]`. */
const TYPE_PAR_DEFAUT: EncodageDeType = {
	forme: 'losange',
	code: 'NOT',
	couleur: '#6b7c87',
	nom: 'Note'
};

/** L'encodage d'un type cartographique, repli du gel compris. */
export function encodageDuType(cle: string): EncodageDeType {
	return TYPES.get(cle) ?? TYPE_PAR_DEFAUT;
}

/** Le type cartographique d'une note : le type de fiche s'il existe, sinon le
 *  type de note. C'est lui qui décide de la forme du nœud. */
export function typeCarto(n: Note): string {
	return n.typeFiche ?? n.type;
}

/** L'encodage d'une note. Un type inconnu retombe sur « Note », comme au gel. */
export function typeDe(n: Note): EncodageDeType {
	return encodageDuType(typeCarto(n));
}

/* ── La géométrie d'un contour ─────────────────────────────────────────────
   Le gel fabrique l'élément SVG ; ici la fabrique rend sa DESCRIPTION, que la
   vue pose en balisage. Les nombres sont ceux du gel, aux mêmes opérations
   près : `r * 0.28`, `r * 1.2`, `Math.PI / 6 + i * Math.PI / 3`. Les écrire
   autrement — arrondis, valeurs recopiées — ferait diverger le rendu au
   sous-pixel. */

/** La description d'un contour de nœud, telle que la vue la pose. */
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

/* ── Le sous-graphe d'un périmètre ─────────────────────────────────────────
   « Les notes hors périmètre mais reliées à lui sont conservées et marquées
   fantôme : les masquer donnerait une fausse image des dépendances »
   (V-19:2181). L'ordre des nœuds est celui du corpus, puis celui des arêtes
   pour les fantômes — il décide de l'ordre du balisage rendu, donc du rendu. */

/** Le périmètre choisi dans le sélecteur : tout, un univers, ou un domaine. */
export interface Perimetre {
	readonly type: string;
	readonly nom?: string;
}

/** Un nœud du graphe : la note, et son appartenance au périmètre. */
export interface NoeudDeGraphe {
	readonly id: string;
	readonly note: Note;
	readonly fantome: boolean;
}

/** Le sous-graphe : les nœuds dans l'ordre du rendu, et les arêtes retenues. */
export interface Graphe {
	readonly noeuds: readonly NoeudDeGraphe[];
	readonly index: ReadonlyMap<string, NoeudDeGraphe>;
	readonly aretes: readonly Relation[];
}

/**
 * Le sous-graphe d'un périmètre — le calque de `window.sousGraphe()`.
 *
 * @param notes le jeu de semence de la vue, `corpusPourVue()`
 * @param perimetre `global`, `univers` ou `domaine`
 * @param relations les relations du corpus. Défaut : celles du jeu de semence.
 */
export function sousGraphe(
	notes: readonly Note[],
	perimetre: Perimetre,
	relations: readonly Relation[] = RELATIONS
): Graphe {
	const dedans = (n: Note): boolean => {
		if (perimetre.type === 'global') return true;
		if (perimetre.type === 'univers') return n.univers === perimetre.nom;
		return n.domaine === perimetre.nom;
	};

	const noeuds = new Map<string, NoeudDeGraphe>();
	for (const n of notes) if (dedans(n)) noeuds.set(n.id, { id: n.id, note: n, fantome: false });

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

/** Le nombre de relations touchant chaque nœud du graphe. */
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
 * Les points d'articulation du graphe des dépendances TECHNIQUES : les nœuds
 * dont le retrait couperait le graphe en morceaux, c'est-à-dire les points de
 * défaillance unique du périmètre. Parcours en profondeur, algorithme de
 * Hopcroft et Tarjan — le calque de `window.pointsArticulation()`.
 *
 * « Une note qui en documente une autre n'en dépend pas » : les relations
 * documentaires sont écartées, sans quoi toute fiche simplement documentée
 * passerait pour un point de rupture.
 */
export function pointsArticulation(
	g: Graphe,
	techniques: readonly Relation['type'][] = RELATIONS_TECHNIQUES
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

/** Une relation vue depuis un nœud : l'autre bout, et le sens de lecture. */
export interface RelationOrientee {
	readonly autre: string;
	readonly sortant: boolean;
	readonly type: Relation['type'];
}

/** Les relations touchant un nœud, dans l'ordre où elles sont données. */
export function relationsDe(
	id: string,
	relations: readonly Relation[] = RELATIONS
): RelationOrientee[] {
	return relations
		.filter((r) => r.de === id || r.vers === id)
		.map((r) => ({
			autre: r.de === id ? r.vers : r.de,
			sortant: r.de === id,
			type: r.type
		}));
}

/** Une relation porte-t-elle une dépendance technique ? */
export function estTechnique(
	type: Relation['type'],
	techniques: readonly Relation['type'][] = RELATIONS_TECHNIQUES
): boolean {
	return (techniques as readonly string[]).includes(type);
}

/** Le titre d'un nœud, le graphe d'abord, le corpus ensuite — comme au gel. */
export function titreDe(g: Graphe, notes: readonly Note[], id: string): string {
	const d = g.index.get(id);
	if (d) return d.note.titre;
	return notes.find((x) => x.id === id)?.titre ?? id;
}

/**
 * Les types présents dans le graphe, classés par effectif décroissant — le
 * classement du gel, `Object.keys(comptes).sort((a, b) => comptes[b] -
 * comptes[a])`, dont la stabilité tient l'ordre d'apparition à effectif égal.
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
