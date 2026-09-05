/**
 * LES PICTOGRAMMES DU RAIL — l'icône d'un univers, celle d'un dossier, celle d'une
 * note.
 *
 * « UNE ICÔNE PROPRE À CHAQUE UNIVERS » : le prototype en dessine une par univers de
 * son jeu de démonstration, ce qui n'est pas transposable — les univers d'une
 * instance réelle ne sont pas les siens. La console fait déjà choisir un glyphe à
 * la création d'un univers (`univers.glyphe`, six clés) : c'est CE choix que le rail
 * rend, et non une table de noms d'univers qui ne dirait rien d'une instance neuve.
 *
 * Les traits sont DÉCOMPOSÉS (`TraitDePictogramme`) plutôt que gardés en chaîne de
 * balisage : une chaîne demanderait `{@html}`, que le compilateur ne relit pas.
 * `Pictogramme.svelte` les rend, en boîte de vue « 0 0 24 24 » pour les glyphes
 * d'univers et « 0 0 16 16 » pour les icônes de rangement.
 */
import type { TraitDePictogramme } from '../console/sections';

/**
 * LES SIX GLYPHES D'UNIVERS, dans la boîte de vue 24 — les mêmes que le sélecteur
 * de la console (V-27), au trait près : deux dessins différents pour le même choix
 * feraient mentir l'aperçu de la console.
 */
export const GLYPHES_DUNIVERS: Readonly<Record<string, readonly TraitDePictogramme[]>> = {
	pile: [
		{ forme: 'rect', x: '3', y: '4', largeur: '18', hauteur: '5', rx: '1.5' },
		{ forme: 'rect', x: '3', y: '12', largeur: '18', hauteur: '5', rx: '1.5' },
		{ forme: 'path', d: 'M6.5 6.5h.01M6.5 14.5h.01M3 19.5h18' }
	],
	jalon: [{ forme: 'path', d: 'M6 21V3M6 4h11l-2.2 3.5L17 11H6' }],
	corbeille: [
		{
			forme: 'path',
			d: 'M4 7h16M9.5 7V4.5h5V7M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7'
		}
	],
	boussole: [
		{ forme: 'circle', cx: '12', cy: '12', r: '9' },
		{ forme: 'path', d: 'M15.5 8.5l-2 5-5 2 2-5z' }
	],
	livre: [
		{
			forme: 'path',
			d: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5zM20 4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5a1.5 1.5 0 0 0 1.5-1.5z'
		}
	],
	engrenage: [
		{ forme: 'circle', cx: '12', cy: '12', r: '3' },
		{
			forme: 'path',
			d: 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z'
		}
	]
};

/** Le glyphe de repli — celui que la console propose au premier univers créé. */
export const GLYPHE_PAR_DEFAUT = 'boussole';

/**
 * Le pictogramme d'un univers, par sa clé. Une clé inconnue — un glyphe retiré du
 * catalogue, une base plus ancienne — rend le repli plutôt qu'un trou.
 */
export function glypheDUnivers(cle: string): readonly TraitDePictogramme[] {
	return GLYPHES_DUNIVERS[cle] ?? GLYPHES_DUNIVERS[GLYPHE_PAR_DEFAUT] ?? [];
}

/** Le domaine — une chemise, boîte de vue 16. */
export const ICONE_DOMAINE: readonly TraitDePictogramme[] = [
	{ forme: 'path', d: 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13z' }
];

/** Le dossier — la même chemise, barrée d'un rabat qui la distingue du domaine. */
export const ICONE_DOSSIER: readonly TraitDePictogramme[] = [
	{ forme: 'path', d: 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13zM1.5 8h13' }
];

/** La note — boîte de vue 16. */
export const ICONE_NOTE: readonly TraitDePictogramme[] = [
	{ forme: 'path', d: 'M4 2.5h6l2.5 2.5v8.5H4zM6 8h4M6 10.5h4' }
];

/** Le pictogramme d'un nœud de rangement, par son type. */
export function iconeDeNoeud(type: 'domaine' | 'dossier' | 'note'): readonly TraitDePictogramme[] {
	if (type === 'note') return ICONE_NOTE;
	return type === 'domaine' ? ICONE_DOMAINE : ICONE_DOSSIER;
}
