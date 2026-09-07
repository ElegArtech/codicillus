/**
 * LES JETONS DE LA CARTOGRAPHIE QUE LE CALCUL LIT — le pendant TypeScript de
 * `src/vues/carto-jetons.css`.
 *
 * POURQUOI DEUX FICHIERS POUR UNE SEULE VÉRITÉ. Une feuille de style ne se lit pas
 * depuis un module : le placement des nœuds, la taille des contours et le
 * chevauchement des étiquettes se calculent AVANT tout rendu, au serveur comme au
 * navigateur. Les valeurs sont donc écrites deux fois — et `jetons.test.ts` échoue
 * si les deux écritures diffèrent d'une unité.
 *
 * CE QUE CETTE GARANTIE ÉVITE, ET CE N'EST PAS THÉORIQUE : un rayon de nœud de 8 au
 * dessin et de 11 au placement fait se recouvrir deux pastilles que le calcul croyait
 * disjointes, et rien dans le code ne le dit — cela se voit à l'œil, sur un corpus
 * dense, une fois le dessin rendu.
 *
 * TOUTES LES LONGUEURS SONT EN UNITÉS DU REPÈRE (`viewBox`), jamais en pixels : le
 * dessin est mis à l'échelle par le cadrage, et un pixel n'y veut rien dire.
 */

/** Le repère du dessin — le `viewBox` que la vue déclare. */
export const REPERE_LARGEUR = 1200;
export const REPERE_HAUTEUR = 860;

/** La marge que le cadrage laisse tout autour du dessin. */
export const REPERE_MARGE = 56;

/* ── LES TAILLES DE NŒUD ───────────────────────────────────────────────────
   Le rayon d'une note va du minimum au minimum plus l'amplitude, selon la mesure
   choisie au panneau « Taille des nœuds ». Le pivot d'une famille est plus grand,
   et le centre du dessin est un grand disque. */

export const NOEUD_MINIMUM = 7;
export const NOEUD_AMPLITUDE = 7;
export const NOEUD_UNIFORME = 9;
export const PIVOT = 17;
export const CENTRE = 48;

/** Le plus grand rayon qu'une note ordinaire puisse prendre — la borne du placement. */
export const NOEUD_MAXIMUM = NOEUD_MINIMUM + NOEUD_AMPLITUDE;

/* ── LES DISTANCES DE PLACEMENT ────────────────────────────────────────────
   Ce sont elles qui garantissent qu'aucun nœud n'en recouvre un autre, et
   qu'aucun contour n'en recouvre un autre. */

/** L'espace libre entre deux pastilles voisines d'un même cercle. */
export const PAS_ENTRE_NOEUDS = 7;

/** L'écart entre deux cercles concentriques autour d'un pivot. */
export const PAS_ENTRE_CERCLES = 35;

/** La marge entre la pastille la plus extérieure d'une famille et son contour. */
export const MARGE_DE_CONTOUR = 24;

/** L'espace libre garanti entre les contours de deux familles voisines. */
export const MARGE_ENTRE_FAMILLES = 14;

/* ── LES ÉTIQUETTES ────────────────────────────────────────────────────────
   LA BOÎTE D'UN TEXTE EST ESTIMÉE, PAS MESURÉE, et c'est voulu : mesurer un texte
   demande un document, donc ferait dépendre le dessin du navigateur qui le rend —
   deux postes n'auraient plus la même carte. La largeur moyenne d'un caractère de
   la police d'interface, à la taille d'une étiquette de nœud, vaut 4,9 unités. */

export const HAUTEUR_DETIQUETTE = 16;
export const LARGEUR_DE_CARACTERE = 6.8;

/** L'espace entre la pastille et son étiquette, et entre deux étiquettes. */
export const MARGE_DETIQUETTE = 4;

/* ── LES TAILLES DE POLICE DU DESSIN ───────────────────────────────────────
   Elles sont ici parce que la hauteur d'une étiquette de famille entre dans le
   calcul de la place qu'on lui réserve. */

export const T_NOEUD = 13;
export const T_PIVOT = 15;
export const T_CENTRE = 17;
export const T_CENTRE_SOUS = 11;
export const T_FAMILLE = 18;
export const T_FAMILLE_COMPTE = 13;
export const T_ARETE = 14;

/**
 * LE NOMBRE DE TEINTES DE FAMILLE — `carto-jetons.css` en déclare autant, de
 * `--carto-famille-0-*` à `--carto-famille-9-*`. La dernière est grise : c'est
 * celle d'« Isolées », des notes que rien ne rapproche.
 */
export const TEINTES_DE_FAMILLE = 10;

/** Le rang de teinte réservé à la famille « Isolées ». */
export const TEINTE_DES_ISOLEES = TEINTES_DE_FAMILLE - 1;

/**
 * LA TABLE QUE L'ÉPREUVE COMPARE À LA FEUILLE DE STYLE. Chaque entrée nomme le
 * jeton CSS et la constante qui doit lui être égale. Ajouter une constante sans
 * l'inscrire ici la laisserait diverger en silence — c'est pourquoi l'épreuve
 * vérifie AUSSI que la table couvre tout ce que ce module exporte.
 */
export const JETONS_PARTAGES: Readonly<Record<string, number>> = {
	'--carto-repere-largeur': REPERE_LARGEUR,
	'--carto-repere-hauteur': REPERE_HAUTEUR,
	'--carto-repere-marge': REPERE_MARGE,
	'--carto-noeud-minimum': NOEUD_MINIMUM,
	'--carto-noeud-amplitude': NOEUD_AMPLITUDE,
	'--carto-noeud-uniforme': NOEUD_UNIFORME,
	'--carto-pivot': PIVOT,
	'--carto-centre': CENTRE,
	'--carto-pas-entre-noeuds': PAS_ENTRE_NOEUDS,
	'--carto-pas-entre-cercles': PAS_ENTRE_CERCLES,
	'--carto-marge-de-contour': MARGE_DE_CONTOUR,
	'--carto-marge-entre-familles': MARGE_ENTRE_FAMILLES,
	'--carto-hauteur-detiquette': HAUTEUR_DETIQUETTE,
	'--carto-largeur-de-caractere': LARGEUR_DE_CARACTERE,
	'--carto-marge-detiquette': MARGE_DETIQUETTE,
	'--carto-t-noeud': T_NOEUD,
	'--carto-t-pivot': T_PIVOT,
	'--carto-t-centre': T_CENTRE,
	'--carto-t-centre-sous': T_CENTRE_SOUS,
	'--carto-t-famille': T_FAMILLE,
	'--carto-t-famille-compte': T_FAMILLE_COMPTE,
	'--carto-t-arete': T_ARETE
};
