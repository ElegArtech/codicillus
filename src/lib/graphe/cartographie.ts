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

/**
 * Le repli du gel, réduit à sa seule justification : un nom de type VIDE.
 *
 * Ce n'était pas son emploi. Il servait à TOUT nom absent de la table, et
 * c'était le défaut : voir la dérivation ci-dessous.
 */
const TYPE_PAR_DEFAUT: EncodageDeType = {
	forme: 'losange',
	code: 'NOT',
	couleur: '#6b7c87',
	nom: 'Note'
};

/* ── Les types que la console crée ─────────────────────────────────────────
   LA TABLE CI-DESSUS EST CLOSE ; LE RÉFÉRENTIEL, LUI, EST OUVERT. Un
   administrateur crée un type de fiche depuis la console (`types_de_fiche` :
   identifiant, nom, ordre — aucune colonne de présentation), et son nom
   arrivait ici comme une clé inconnue. Le repli rendait alors l'objet du gel TEL
   QUEL : deux types créés en console produisaient DEUX PASTILLES RIGOUREUSEMENT
   IDENTIQUES — losange, code NOT, libellé « Note » — dont les deux filtres
   portaient pourtant deux types différents. Le libellé mentait, la forme et le
   code confondaient, et `RG-M18-09` — « la forme et le code portent le type ; la
   couleur ne fait que les répéter » (`V-19:1145`) — tombait.

   LE NOM N'A JAMAIS QUITTÉ LE CIRCUIT : la clé EST le nom. Il suffit de le
   rendre. Pour la forme, le code et la teinte, le cahier tranche le point de
   conception : « chaque type de fiche a une couleur et une icône propres,
   ASSIGNÉES DE FAÇON DÉTERMINISTE » (`CAHIER:951`). *Assignées*, non *stockées*
   — une dérivation, pas une colonne. Le calcul ci-dessous est donc PUR : même
   nom, même encodage, sur toute machine et à toute exécution.

   CE QU'IL PROMET, ET CE QU'IL NE PROMET PAS. Un type dérivé ne prend jamais un
   code du gel, ni un couple forme-teinte du gel : il ne peut donc pas se faire
   passer pour un type de la table. En revanche deux noms dérivés peuvent
   partager un code de trois caractères — « Routeur » et « Routeurs » donnent
   tous deux ROU : aucune fonction d'un seul nom ne peut garantir l'unicité dans
   un ensemble qu'elle ne voit pas. La forme et la teinte étant tirées d'un
   hachage du nom ENTIER, deux types ne se confondent tout à fait que si le code,
   la forme et la teinte coïncident tous les trois. Le gel, lui, les confondait
   toujours. */

/** Les géométries offertes au choix : celles du gel, tirées de la table. */
const FORMES: readonly FormeDeNoeud[] = [...new Set([...TYPES.values()].map((t) => t.forme))];

/** Les teintes offertes au choix : celles du gel, tirées de la table. */
const TEINTES: readonly string[] = [...new Set([...TYPES.values()].map((t) => t.couleur))];

/** Les codes que le gel a déjà pris : un type créé en console n'en prend aucun. */
const CODES_DU_GEL: ReadonlySet<string> = new Set([...TYPES.values()].map((t) => t.code));

/** Ce qui identifie un couple de présentation, pour comparer sans objet. */
function empreinteDePresentation(forme: FormeDeNoeud, couleur: string): string {
	return forme + '|' + couleur;
}

/**
 * LES COUPLES FORME-TEINTE ENCORE LIBRES — cinq géométries par cinq teintes,
 * MOINS les sept que la table du gel occupe déjà.
 *
 * Retirer les couples pris est ce qui empêche « Fiche » de se présenter en
 * carré teal comme « Serveur » : un type créé en console ne peut alors ressembler
 * en tout point à aucun type du gel, et il reste dix-huit couples pour le
 * distinguer de ses semblables.
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
 * chiffres en sont exclus À DESSEIN : dans un code de trois capitales, le zéro
 * se lit comme un O et le un comme un I — la désambiguïsation retomberait dans
 * la confusion qu'elle vient lever.
 */
const ALPHABET_DE_CODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Ce qui complète un nom trop court pour donner trois caractères. */
const REMPLISSAGE_DE_CODE = 'X';

/**
 * UN HACHAGE STABLE — FNV-1a sur 32 bits, en arithmétique entière.
 *
 * Il ne sert qu'à choisir dans deux listes closes : il n'a besoin d'aucune
 * qualité cryptographique, seulement d'être LE MÊME PARTOUT ET TOUJOURS. Il
 * l'est : il ne dépend ni de la locale, ni du fuseau, ni d'un ordre de
 * propriétés, ni d'une valeur de session.
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
 * Les mots d'un nom, réduits aux capitales sans accent et aux chiffres.
 *
 * La décomposition retire les signes diacritiques AVANT la coupe : « Équipement
 * réseau » donne EQUIPEMENT et RESEAU, jamais un premier mot amputé.
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
 * Le code de trois caractères d'un nom, avant désambiguïsation.
 *
 * La règle suit la lecture : un seul mot donne ses trois premières lettres
 * (« Commutateur » donne COM) ; deux mots donnent deux lettres puis une
 * (« Équipement réseau » donne EQR) ; trois mots ou plus donnent leurs
 * initiales. Un nom trop court est complété, jamais rendu plus court.
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
 * Le code d'un type créé en console, jamais l'un des sept du gel.
 *
 * Le cas est réel, non théorique : le jeu de peuplement pose un type
 * « Processus », dont les trois premières lettres sont celles de « Procédure ».
 * Sans cette reprise, les deux porteraient PRO et le code cesserait de
 * distinguer. Le troisième caractère est alors repris dans l'alphabet à partir
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

/** La forme et la teinte d'un type créé en console, par hachage stable du nom. */
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
 * L'encodage d'un type cartographique.
 *
 * Les sept clés du gel rendent l'objet du gel, à l'octet : le banc et le corpus
 * de démonstration ne bougent pas d'un pixel. Tout autre nom — un type de fiche
 * créé en console, un type de note que la table n'énumère pas — est NOMMÉ, et sa
 * présentation est dérivée de son nom.
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

/** L'encodage d'une note, son type fût-il créé en console. */
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

/* ═══════════════════════════ La disposition ═════════════════════════════ */

/** La place d'un nœud dans le repère du dessin. */
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
 * LA DISPOSITION DU GRAPHE — le calque de `disposer()` du gel
 * (`V-19:2566-2626`), transcrit ligne pour ligne, constantes comprises.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE EST DÉTERMINISTE, ET C'EST LA PROPRIÉTÉ QUI COMPTE
 *
 * Le gel l'écrit en toutes lettres : « les positions initiales sont
 * déterministes : deux chargements du même périmètre donnent exactement la même
 * carte, ce qui est indispensable pour s'y repérer d'une session à l'autre »
 * (`V-19:2561`). Aucun tirage, aucune horloge, aucune mesure du document : la
 * place d'un nœud ne dépend que de l'ENSEMBLE des nœuds et de leur ORDRE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ELLE ENTRE ICI, ALORS QUE LES VUES PORTAIENT DES POSITIONS FIGÉES
 *
 * `src/vues/V-19.svelte` porte une table de seize positions relevées sur la
 * maquette servie, et sa réserve était juste tant que le périmètre ne bougeait
 * pas : « le recalcul serait du comportement » (ARB-011). Le périmètre bouge
 * désormais — le sélecteur du gel navigue, `RG-M09-05` veut l'état de la
 * cartographie partageable —, et un nœud absent de la table se dessinait à
 * l'origine, empilé dans le coin de la scène. Une carte dont la moitié des
 * nœuds sont au même point n'est pas une carte.
 *
 * LES SEIZE POSITIONS RELEVÉES RESTENT LA SOURCE quand elles suffisent : voir
 * `placesDuGraphe()`, qui ne calcule que si la table ne couvre pas tout.
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

/**
 * LES PLACES EFFECTIVES D'UN GRAPHE — la table relevée quand elle suffit, la
 * disposition calculée sinon.
 *
 * LA TABLE RELEVÉE L'EMPORTE TANT QU'ELLE COUVRE TOUT LE GRAPHE, et c'est ce
 * qui tient la conformité au gel : le périmètre de la planche est exactement
 * celui qu'elle décrit, et son rendu ne bouge pas d'un pixel. Dès qu'un seul
 * nœud lui manque — un autre périmètre, une note ajoutée en base —, la table
 * est ABANDONNÉE EN BLOC plutôt que complétée : mélanger deux dispositions
 * placerait les nœuds calculés sans égard pour ceux qui ne le sont pas, et la
 * carte serait fausse là où elle a l'air juste.
 */
export function placesDuGraphe(
	g: Graphe,
	relevees: ReadonlyMap<string, Place>
): ReadonlyMap<string, Place> {
	if (g.noeuds.every((n) => relevees.has(n.id))) return relevees;
	return disposer(g);
}
