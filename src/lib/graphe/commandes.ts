/**
 * LES COMMANDES DES TROIS GRAPHES — zoom, recentrage, isolement, sélection.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE EXISTE, ET POURQUOI ICI
 *
 * V-19, V-20 et V-21 dessinent trois graphes différents et partagent EXACTEMENT
 * les mêmes outils : le trio `#zoom-plus` / `#zoom-moins` / `#ajuster` posé dans
 * `div.outils-graphe`, et la même transformation sur `g#racine`. Le gel les
 * écrit trois fois — `V-19:2860`, et son calque dans les deux autres —, et les
 * recopier dans trois câblages de route ferait diverger trois copies d'une
 * arithmétique de quatre lignes.
 *
 * Il vit sous `$lib/graphe/` parce que c'est là que vit déjà `cartographie.ts`,
 * le socle commun des trois vues. Ce module en est le pendant côté DOM : l'un
 * calcule le graphe, l'autre commande sa vue.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL FAIT SUR LE DOCUMENT VIVANT, ET CE QU'IL NE FAIT PAS
 *
 * Il écrit `transform` sur `g#racine` — l'attribut que le gel y pose déjà,
 * `transform="translate(0,0) scale(1)"` — et bascule des attributs de données
 * que les feuilles GELÉES lisent : `data-focus`, `data-actif`, `data-choisi`,
 * `data-isole`, `data-type-visible`, `data-criticite`, `data-ouvert`.
 *
 * IL N'ÉCRIT AUCUNE RÈGLE DE STYLE, ne pose aucune classe absente du gel, et ne
 * crée de nœud qu'à un seul endroit — la liste de suggestions de la recherche
 * dans le graphe, `#rech-liste`, que le gel laisse VIDE au balisage et remplit
 * lui-même en script (`V-19:2945-2963`). Les nœuds créés y sont ceux du gel,
 * classe pour classe.
 *
 * LES POSITIONS SONT RELUES SUR LE DOM, jamais recalculées. La disposition est
 * décidée par la vue — parcours déterministe, `disposer()` du socle commun — et
 * chaque `g.noeud` porte déjà sa place dans son `transform`. La recalculer ici
 * ferait une seconde disposition, qui finirait par diverger de celle qui est
 * dessinée (`P-35`).
 */

/** Ce qu'un câblage rend : de quoi le défaire. */
export type Debranchement = () => void;

/** Les bornes de zoom du gel — `V-19:2921-2924`. */
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3;
const PAS_DE_ZOOM = 1.2;

/** Le repère du dessin — le `viewBox` que les trois vues déclarent. */
const LARGEUR = 1000;
const HAUTEUR = 620;

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

/** La vue courante du graphe — translation et grossissement. */
interface Vue {
	x: number;
	y: number;
	k: number;
}

/** Le pilote de la transformation de `g#racine`. */
export interface CommandeDeVue {
	readonly agrandir: () => void;
	readonly reduire: () => void;
	/** `ajuster()` du gel : la vue revient à l'origine, sans grossissement. */
	readonly ajuster: () => void;
	/** Centre la vue sur un point du repère du dessin. */
	readonly centrerSur: (x: number, y: number) => void;
}

/**
 * LE ZOOM ET LE RECENTRAGE — `V-19:2860-2864` et `:2920-2927`, transcrits.
 *
 * Les trois boutons du gel portent les mêmes identifiants dans les trois vues,
 * et `#recentrer` de V-19 est le DOUBLON déclaré d'`#ajuster` : le gel accroche
 * la même fonction aux deux (`V-19:2926-2927`). Le produit fait de même — un
 * seul chemin, deux déclencheurs.
 */
export function cablerLaVue(racine: ParentNode, attaches: Attaches): CommandeDeVue {
	const cible = racine.querySelector<SVGGElement>('#racine');
	const vue: Vue = { x: 0, y: 0, k: 1 };

	const appliquer = (): void => {
		cible?.setAttribute('transform', `translate(${vue.x},${vue.y}) scale(${vue.k})`);
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
			vue.k = ZOOM_DE_SAUT;
			vue.x = LARGEUR / 2 - x * vue.k;
			vue.y = HAUTEUR / 2 - y * vue.k;
			appliquer();
		}
	};

	attaches.ecouter(racine.querySelector('#zoom-plus'), 'click', commande.agrandir);
	attaches.ecouter(racine.querySelector('#zoom-moins'), 'click', commande.reduire);
	attaches.ecouter(racine.querySelector('#ajuster'), 'click', commande.ajuster);
	attaches.ecouter(racine.querySelector('#recentrer'), 'click', commande.ajuster);

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
