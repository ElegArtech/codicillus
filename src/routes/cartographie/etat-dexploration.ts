/**
 * L'ÉTAT D'EXPLORATION DE LA CARTOGRAPHIE, LU DANS L'ADRESSE — `RG-M09-05` :
 * « le mode d'affichage, le type maître et le périmètre sont reflétés dans
 * l'adresse de la page : la vue est partageable telle quelle ».
 *
 * CE QUE CE MODULE AJOUTE À CETTE RÈGLE, ET POURQUOI. Le périmètre y était seul,
 * et il naviguait : changer de périmètre faisait un `location.assign()`, donc un
 * rechargement complet — et, avec lui, trois cent vingt tours de disposition.
 * Filtrer coûtait une seconde. Un explorateur dont chaque essai coûte une seconde
 * n'est pas exploré : c'est la différence entre un écran QUI MONTRE un graphe et
 * un outil AVEC LEQUEL on cherche.
 *
 * L'ÉTAT EST DONC LU ICI, AU CHARGEUR, POUR L'OUVERTURE SEULEMENT. Ensuite le
 * câblage le fait vivre côté client et le réécrit par `replaceState` : l'adresse
 * reste juste et partageable, sans qu'aucun filtre ne relance quoi que ce soit.
 *
 * UNE VALEUR ILLISIBLE VAUT ABSENCE, jamais refus — comme pour le périmètre : un
 * réglage inventé doit ouvrir la carte dans son état de repos, pas la bloquer.
 */
import type { EtatDeVivacite } from '$lib/fraicheur';
import { ORDRE_DES_ETATS } from '$lib/fraicheur';
import type { MesureDeTaille } from '$lib/graphe/cartographie';
import type { OrigineDeRelation } from '$lib/donnees/outils';

/**
 * LES DEUX COUCHES DE LIENS, ET IL N'Y EN A QUE DEUX. L'affinité n'en est PAS une :
 * une appartenance commune n'est pas un lien entre deux objets, et la dessiner
 * ferait croire que quelqu'un l'a déclarée. Elle place les nœuds et les entoure —
 * voir `RAIDEUR_DE_FAMILLE` et `contourDeGroupe()`.
 */
export type CoucheDeLiens = 'declarees' | 'deduites';

export const COUCHES: readonly CoucheDeLiens[] = ['declarees', 'deduites'];

/** Ce que chaque couche recouvre dans la colonne `origine` de `relations` (`P-08`). */
export const ORIGINES_DE_COUCHE: Readonly<Record<CoucheDeLiens, readonly OrigineDeRelation[]>> = {
	declarees: ['declaree'],
	/* `ambigue` est rangée avec les déduites : elle n'a pas été SAISIE, et la
	   promettre déclarée affirmerait un geste qui n'a pas eu lieu. */
	deduites: ['deduite', 'ambigue']
};

/** La profondeur maximale d'un voisinage. Au-delà, on atteint presque tout : le geste perd son sens. */
export const PROFONDEUR_MAXIMALE = 3;

export interface EtatDExploration {
	/** Les couches de liens dessinées. Vide : aucun trait, le nuage des familles seul. */
	readonly couches: readonly CoucheDeLiens[];
	/** Les états de vivacité affichés. */
	readonly vivacite: readonly EtatDeVivacite[];
	/** Ce que la taille d'un nœud représente. */
	readonly taille: MesureDeTaille;
	/** Le degré en deçà duquel un nœud est masqué — 0 : aucun ne l'est. */
	readonly degreMinimum: number;
	/**
	 * ÉCARTER D'UN GESTE LES NOTES QU'AUCUNE RELATION NE TOUCHE. C'est le même effet
	 * qu'un degré minimum de 1, et c'est pour cela qu'il existe : sur un corpus où
	 * les deux tiers des notes sont isolées, « les enlever » est la première chose
	 * qu'on veut essayer, et personne ne devine qu'un curseur nommé « degré » le fait.
	 */
	readonly masquerIsolees: boolean;
	/**
	 * LES CODES DE TYPE AFFICHÉS — `null` : tous. Les types ne sont PAS une liste
	 * figée : la console en crée, et un filtre qui n'admettrait que ceux du code
	 * ferait disparaître les autres sans qu'aucune case ne le dise.
	 */
	readonly types: readonly string[] | null;
	/** Les contours de famille sont-ils dessinés ? Et leurs noms ? */
	readonly contours: boolean;
	readonly nomsDeFamille: boolean;
	/** Le nœud dont on explore le voisinage, ou `null` — la vue complète. */
	readonly centre: string | null;
	readonly profondeur: number;
}

/**
 * L'état d'ouverture : tout le corpus, LES DEUX COUCHES, les contours posés.
 *
 * LA COUCHE DÉDUITE ÉTAIT ÉTEINTE À L'OUVERTURE, ET C'ÉTAIT SANS CONSÉQUENCE TANT
 * QU'ELLE ÉTAIT VIDE : rien ne fabriquait une arête déduite, et la case à cocher
 * n'avait jamais rien à montrer. Depuis que les MENTIONS l'alimentent, la garder
 * éteinte ouvrirait la carte d'un corpus relié au rétrolien — un univers entier
 * consolidé de la sorte — sur un nuage de nœuds SANS UN TRAIT, jusqu'à ce que
 * quelqu'un devine qu'une case le cache. La carte s'ouvre donc sur ce que le corpus
 * porte, et la case sert à en RETIRER une part, jamais à en révéler l'essentiel.
 */
export const EXPLORATION_DE_PLANCHE: EtatDExploration = {
	couches: ['declarees', 'deduites'],
	vivacite: [...ORDRE_DES_ETATS],
	taille: 'centralite',
	degreMinimum: 0,
	masquerIsolees: false,
	types: null,
	contours: true,
	nomsDeFamille: true,
	centre: null,
	profondeur: 1
};

/** Une liste séparée par des virgules, réduite aux valeurs admises et dédoublonnée. */
function listeLue<T extends string>(brut: string | null, admises: readonly T[]): T[] | null {
	if (brut === null) return null;
	const gardees = [...new Set(brut.split(','))].filter((v): v is T =>
		(admises as readonly string[]).includes(v)
	);
	/* Une liste VIDE est une intention — « n'affiche aucune couche » —, et se
	   distingue d'un paramètre absent, qui est le défaut. */
	return admises.filter((v) => gardees.includes(v));
}

function entierLu(brut: string | null, minimum: number, maximum: number): number | null {
	if (brut === null) return null;
	const n = Number.parseInt(brut, 10);
	if (!Number.isFinite(n)) return null;
	return Math.min(maximum, Math.max(minimum, n));
}

/** `oui` / `non` — toute autre valeur vaut absence. */
function booleenLu(brut: string | null): boolean | null {
	if (brut === 'oui') return true;
	if (brut === 'non') return false;
	return null;
}

const MESURES: readonly MesureDeTaille[] = ['uniforme', 'connexions', 'centralite'];

/**
 * LES CODES DE TYPE D'UNE ADRESSE. Ils ne se valident pas contre une liste — voir
 * `types` — mais contre une FORME : deux à six caractères de code, sans quoi
 * n'importe quel texte entrerait dans un attribut du dessin.
 */
function codesLus(brut: string | null): string[] | null {
	if (brut === null) return null;
	return [...new Set(brut.split(','))].filter((c) => /^[A-Za-z0-9]{2,6}$/.test(c));
}

/** Le degré minimum le plus haut qu'offre le curseur. */
export const DEGRE_MINIMUM_MAXIMAL = 5;

export function explorationDeLAdresse(parametres: URLSearchParams): EtatDExploration {
	const couches = listeLue(parametres.get('couches'), COUCHES);
	const etats = listeLue(parametres.get('vivacite'), ORDRE_DES_ETATS);
	const taille = MESURES.find((m) => m === parametres.get('taille'));
	const degre = entierLu(parametres.get('degre'), 0, DEGRE_MINIMUM_MAXIMAL);
	const contours = booleenLu(parametres.get('contours'));
	const noms = booleenLu(parametres.get('noms'));
	const isolees = booleenLu(parametres.get('isolees'));
	const types = codesLus(parametres.get('types'));
	const centre = parametres.get('centre');
	const profondeur = entierLu(parametres.get('profondeur'), 1, PROFONDEUR_MAXIMALE);

	return {
		couches: couches ?? EXPLORATION_DE_PLANCHE.couches,
		vivacite: etats ?? EXPLORATION_DE_PLANCHE.vivacite,
		taille: taille ?? EXPLORATION_DE_PLANCHE.taille,
		degreMinimum: degre ?? EXPLORATION_DE_PLANCHE.degreMinimum,
		masquerIsolees: isolees ?? EXPLORATION_DE_PLANCHE.masquerIsolees,
		types,
		contours: contours ?? EXPLORATION_DE_PLANCHE.contours,
		nomsDeFamille: noms ?? EXPLORATION_DE_PLANCHE.nomsDeFamille,
		/* Une chaîne vide ne désigne aucun nœud : c'est la vue complète. */
		centre: centre === null || centre === '' ? null : centre,
		profondeur: profondeur ?? EXPLORATION_DE_PLANCHE.profondeur
	};
}
