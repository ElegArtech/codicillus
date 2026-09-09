/**
 * LES COMMANDES DES TROIS GRAPHES — zoom, recentrage, isolement, sélection. V-19,
 * V-20 et V-21 partagent les mêmes outils, et le gel les écrit trois fois.
 *
 * Il écrit `transform` sur `g#racine` et bascule les attributs de données que les
 * feuilles GELÉES lisent (`data-focus`, `data-actif`, `data-choisi`, `data-isole`,
 * `data-type-visible`, `data-criticite`, `data-ouvert`). IL N'ÉCRIT AUCUNE RÈGLE DE
 * STYLE, ne pose aucune classe absente du gel, et ne crée de nœud qu'à un seul
 * endroit — `#rech-liste`, que le gel laisse VIDE au balisage et remplit lui-même
 * (`V-19:2945-2963`).
 *
 * LES POSITIONS SONT RELUES SUR LE DOM, jamais recalculées : chaque `g.noeud` porte
 * déjà sa place dans son `transform`, et la recalculer ferait une seconde
 * disposition, qui divergerait de celle qui est dessinée (`P-35`).
 */

export type Debranchement = () => void;

/** Les bornes de zoom du gel — `V-19:2921-2924`. */
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3;
const PAS_DE_ZOOM = 1.2;

/**
 * LE REPÈRE DU DESSIN, LU SUR LE `viewBox` — jamais recopié en constante.
 *
 * IL ÉTAIT ÉCRIT ICI, À MILLE SUR SEPT CENT QUATRE-VINGTS, ET C'EST DEVENU FAUX :
 * la cartographie calcule désormais son repère SUR SON CONTENU, si bien qu'un
 * périmètre de douze notes et un de trois cents n'ont plus les mêmes bornes. Un
 * recentrage réglé sur une constante sautait alors à côté du nœud visé, et le zoom
 * à la molette dérivait sous le pointeur. Le repère se lit sur l'élément.
 */
const REPERE_DE_REPLI = { x: 0, y: 0, largeur: 1000, hauteur: 780 };

function repereDe(cible: SVGGElement | null): {
	x: number;
	y: number;
	largeur: number;
	hauteur: number;
} {
	const svg = cible?.ownerSVGElement ?? null;
	const brut = svg?.getAttribute('viewBox') ?? '';
	const parts = brut
		.trim()
		.split(/[\s,]+/)
		.map(Number);
	if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return REPERE_DE_REPLI;
	return {
		x: parts[0] as number,
		y: parts[1] as number,
		largeur: parts[2] as number,
		hauteur: parts[3] as number
	};
}

/** Le grossissement d'un saut vers un nœud — `V-19:2969`. */
const ZOOM_DE_SAUT = 1.35;

/** Le petit collecteur d'écouteurs que chaque câblage rend à Svelte. */
export class Attaches {
	private readonly defaire: Debranchement[] = [];

	ecouter(cible: EventTarget | null, type: string, reaction: (evenement: Event) => void): void {
		if (cible === null) return;
		cible.addEventListener(type, reaction);
		this.defaire.push(() => cible.removeEventListener(type, reaction));
	}

	ajouter(defaire: Debranchement): void {
		this.defaire.push(defaire);
	}

	debranchement(): Debranchement {
		return () => {
			for (const d of this.defaire) d();
		};
	}
}

interface Vue {
	x: number;
	y: number;
	k: number;
}

/** Le pilote de la transformation de `g#racine`. */
export interface CommandeDeVue {
	readonly agrandir: () => void;
	readonly reduire: () => void;
	/** La vue revient à l'origine, sans grossissement. */
	readonly ajuster: () => void;
	readonly centrerSur: (x: number, y: number) => void;
	/** Le décalage courant du repère — ce dont une préhension repart. */
	readonly position: () => { x: number; y: number };
	/** Pose le décalage du repère, sans toucher au grossissement. */
	readonly deplacer: (x: number, y: number) => void;
	/**
	 * GROSSIT AUTOUR D'UN POINT DU REPÈRE, et non autour du centre. C'est ce qui rend
	 * une molette utilisable : grossir au centre pendant qu'on regarde un coin fait
	 * perdre ce qu'on visait, à chaque cran.
	 */
	readonly grossirVers: (x: number, y: number, facteur: number) => void;
}

/**
 * LE ZOOM ET LE RECENTRAGE — `V-19:2860-2864` et `:2920-2927`. `#recentrer` de V-19
 * est le DOUBLON déclaré d'`#ajuster` : le gel accroche la même fonction aux deux.
 */
export function cablerLaVue(
	racine: ParentNode,
	attaches: Attaches,
	/**
	 * CE QUI SE FAIT À CHAQUE CHANGEMENT DE GROSSISSEMENT. La cartographie s'en sert
	 * pour poser le SEUIL DE ZOOM au-delà duquel TOUTES les notes portent leur
	 * libellé : c'est une règle de la maquette, et elle ne peut se tenir qu'ici,
	 * parce que le grossissement ne vit nulle part ailleurs.
	 */
	auChangement?: (grossissement: number) => void
): CommandeDeVue {
	const cible = racine.querySelector<SVGGElement>('#racine');
	const vue: Vue = { x: 0, y: 0, k: 1 };

	const appliquer = (): void => {
		cible?.setAttribute('transform', `translate(${vue.x},${vue.y}) scale(${vue.k})`);
		auChangement?.(vue.k);
	};

	const commande: CommandeDeVue = {
		agrandir: () => {
			vue.k = Math.min(ZOOM_MAX, vue.k * PAS_DE_ZOOM);
			appliquer();
		},
		reduire: () => {
			vue.k = Math.max(ZOOM_MIN, vue.k / PAS_DE_ZOOM);
			appliquer();
		},
		ajuster: () => {
			vue.x = 0;
			vue.y = 0;
			vue.k = 1;
			appliquer();
		},
		centrerSur: (x, y) => {
			const repere = repereDe(cible);
			vue.k = ZOOM_DE_SAUT;
			vue.x = repere.x + repere.largeur / 2 - x * vue.k;
			vue.y = repere.y + repere.hauteur / 2 - y * vue.k;
			appliquer();
		},
		position: () => ({ x: vue.x, y: vue.y }),
		deplacer: (x, y) => {
			vue.x = x;
			vue.y = y;
			appliquer();
		},
		grossirVers: (x, y, facteur) => {
			const avant = vue.k;
			const apres = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, avant * facteur));
			if (apres === avant) return;
			/* Le point du repère sous le pointeur doit rester sous le pointeur : on
			   corrige le décalage de la différence que le grossissement introduit. */
			vue.x = x - ((x - vue.x) / avant) * apres;
			vue.y = y - ((y - vue.y) / avant) * apres;
			vue.k = apres;
			appliquer();
		}
	};

	attaches.ecouter(racine.querySelector('#zoom-plus'), 'click', commande.agrandir);
	attaches.ecouter(racine.querySelector('#zoom-moins'), 'click', commande.reduire);
	attaches.ecouter(racine.querySelector('#ajuster'), 'click', commande.ajuster);
	attaches.ecouter(racine.querySelector('#recentrer'), 'click', commande.ajuster);
	/* « Centrer », dans le voisinage : le même geste, sous le nom que la maquette
	   lui donne là-bas. Un troisième déclencheur, pas une troisième fonction. */
	attaches.ecouter(racine.querySelector('#centrer'), 'click', commande.ajuster);

	return commande;
}

/**
 * LA PLACE D'UN NŒUD, RELUE SUR SON `transform`. Rend `null` quand le nœud n'est
 * pas dessiné — un identifiant qui ne désigne rien ne fait pas sauter la vue.
 */
export function placeDuNoeud(
	racine: ParentNode,
	identifiant: string
): { x: number; y: number } | null {
	const noeud = racine.querySelector(`.noeud[data-id="${CSS.escape(identifiant)}"]`);
	const transformation = noeud?.getAttribute('transform') ?? '';
	const mesure = /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/.exec(transformation);
	if (mesure === null) return null;
	return { x: Number(mesure[1]), y: Number(mesure[2]) };
}

/** Le trait s'arrête au bord du nœud, pour garder sa flèche visible. */
export function courbeDeLien(
	a: { x: number; y: number; r: number },
	b: { x: number; y: number; r: number }
): string {
	const dx = b.x - a.x,
		dy = b.y - a.y;
	const cx = (a.x + b.x) / 2 - dy * 0.1,
		cy = (a.y + b.y) / 2 + dx * 0.1;
	const debut = Math.hypot(cx - a.x, cy - a.y) || 1;
	const fin = Math.hypot(b.x - cx, b.y - cy) || 1;
	const ra = Math.min(a.r + 2, debut / 2),
		rb = Math.min(b.r + 3, fin / 2);
	return `M${a.x + ((cx - a.x) * ra) / debut} ${a.y + ((cy - a.y) * ra) / debut}Q${cx} ${cy} ${b.x - ((b.x - cx) * rb) / fin} ${b.y - ((b.y - cy) * rb) / fin}`;
}
