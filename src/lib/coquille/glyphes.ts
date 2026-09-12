/**
 * LES PICTOGRAMMES DU RAIL — l'icône d'un univers, celle d'un dossier, celle d'une
 * note.
 *
 * « UNE ICÔNE PROPRE À CHAQUE UNIVERS » : le prototype en dessine une par univers de
 * son jeu de démonstration, ce qui n'est pas transposable — les univers d'une
 * instance réelle ne sont pas les siens. La console fait déjà choisir un glyphe à
 * la création d'un univers (`univers.glyphe`) : c'est CE choix que le rail
 * rend, et non une table de noms d'univers qui ne dirait rien d'une instance neuve.
 *
 * Les traits sont DÉCOMPOSÉS (`TraitDePictogramme`) plutôt que gardés en chaîne de
 * balisage : une chaîne demanderait `{@html}`, que le compilateur ne relit pas.
 * `Pictogramme.svelte` les rend, en boîte de vue « 0 0 24 24 » pour les glyphes
 * d'univers et « 0 0 16 16 » pour les icônes de rangement.
 */
import type { TraitDePictogramme } from '../console/sections';

/**
 * LES TRENTE-DEUX GLYPHES D'UNIVERS, dans la boîte de vue 24.
 *
 * CE FICHIER EST LE SEUL CATALOGUE. Le sélecteur de la console (V-27) en tenait
 * une COPIE, et les deux dessins d'`engrenage` avaient divergé : le rail et la
 * page d'univers rendaient une ROUE DENTÉE que la console ne proposait nulle part
 * — elle y offrait un soleil à branches (`mockups/V-27-console-univers.html:3248`).
 * Un univers portait donc une icône introuvable dans le formulaire qui l'avait
 * posée. La roue dentée est retenue, parce que c'est elle qui est PORTÉE PAR DES
 * UNIVERS EXISTANTS : la changer les repeindrait tous. V-27 lit cette table.
 *
 * Les six premières restent celles d'origine. Les vingt-six suivantes couvrent
 * l'infrastructure, le travail et la vie courante. Chacune doit se distinguer des
 * autres À 19 PIXELS, la taille du sélecteur : c'est là que deux silhouettes
 * voisines deviennent le même dessin.
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
	],
	/** La baie — un châssis et ses trois unités, chacune avec sa diode. */
	serveur: [
		{ forme: 'rect', x: '3.5', y: '3', largeur: '17', hauteur: '18', rx: '2' },
		{ forme: 'path', d: 'M3.5 9h17M3.5 15h17' },
		{ forme: 'circle', cx: '7', cy: '6', r: '1' },
		{ forme: 'circle', cx: '7', cy: '12', r: '1' },
		{ forme: 'circle', cx: '7', cy: '18', r: '1' }
	],
	/** Le réseau — trois nœuds et leurs liens. */
	reseau: [
		{ forme: 'circle', cx: '12', cy: '5', r: '2.5' },
		{ forme: 'circle', cx: '5', cy: '18.5', r: '2.5' },
		{ forme: 'circle', cx: '19', cy: '18.5', r: '2.5' },
		{ forme: 'path', d: 'M10.4 7l-4 9.2M13.6 7l4 9.2M7.5 18.5h9' }
	],
	/** Le bouclier — ce qui protège, ce qui engage. */
	bouclier: [
		{ forme: 'path', d: 'M12 2.5l7.5 3v6.2c0 4.4-3 8-7.5 9.8-4.5-1.8-7.5-5.4-7.5-9.8V5.5z' }
	],
	/** La clé — les accès, les comptes, ce qui s'ouvre sur autorisation. */
	cle: [
		{ forme: 'circle', cx: '7.5', cy: '7.5', r: '3.8' },
		{ forme: 'path', d: 'M10.2 10.2L20.5 20.5M16.8 16.8l2.4-2.4M13.9 13.9l2.4-2.4' }
	],
	/** Le nuage — ce qui est hébergé ailleurs. */
	nuage: [{ forme: 'path', d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z' }],
	/** Le code — deux chevrons et la barre oblique. */
	code: [{ forme: 'path', d: 'M8.5 7.5L3.5 12l5 4.5M15.5 7.5l5 4.5-5 4.5M13.6 5.5l-3.2 13' }],
	/** Le graphique — un axe et trois barres, pour le pilotage et les chiffres. */
	graphique: [
		{ forme: 'path', d: 'M3.5 3.5v17h17' },
		{ forme: 'path', d: 'M8.5 17.5v-6M13 17.5v-10M17.5 17.5v-3.5' }
	],
	/** Le calendrier — les échéances, les campagnes, ce qui a une date. */
	calendrier: [
		{ forme: 'rect', x: '3.5', y: '5', largeur: '17', hauteur: '15.5', rx: '2' },
		{ forme: 'path', d: 'M3.5 10h17M8 3v4M16 3v4' }
	],
	/** Le cadenas — ce qui est fermé, ce qui est confidentiel. */
	cadenas: [
		{ forme: 'rect', x: '4.5', y: '10.5', largeur: '15', hauteur: '10', rx: '2' },
		{ forme: 'path', d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' }
	],
	/** L'équipe — deux personnes, pour les univers qui parlent de gens. */
	equipe: [
		{ forme: 'circle', cx: '9.5', cy: '8', r: '3.5' },
		{ forme: 'path', d: 'M3 20.5c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5' },
		{ forme: 'path', d: 'M16.5 5.2a3.5 3.5 0 0 1 0 5.6M17.5 15.3c2.2.6 3.5 2.4 3.5 5.2' }
	],
	/** Le journal — publications, presse, articles et veille. */
	publication: [
		{ forme: 'rect', x: '3', y: '3.5', largeur: '18', hauteur: '17', rx: '2' },
		{ forme: 'rect', x: '6', y: '7', largeur: '5', hauteur: '5', rx: '0.5' },
		{ forme: 'path', d: 'M14 7h4M14 10h4M6 15.5h12M6 18h9' }
	],
	/** La maison — logement, famille, patrimoine et vie domestique. */
	maison: [{ forme: 'path', d: 'M3 11.5L12 3l9 8.5M5 10v11h14V10M9 21v-6h6v6' }],
	/** Le microphone — audio, entretiens, podcasts et prises de parole. */
	micro: [
		{ forme: 'rect', x: '9', y: '3', largeur: '6', hauteur: '12', rx: '3' },
		{ forme: 'path', d: 'M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7' }
	],
	/** L'appareil photo — photographie, vidéo et ressources visuelles. */
	camera: [
		{ forme: 'rect', x: '3', y: '6', largeur: '18', hauteur: '14', rx: '2' },
		{ forme: 'circle', cx: '12', cy: '13', r: '4' },
		{ forme: 'path', d: 'M8 6l1.5-3h5L16 6M18 9h.01' }
	],
	/** La note de musique — musique, culture et collections sonores. */
	musique: [
		{ forme: 'circle', cx: '7', cy: '18', r: '3' },
		{ forme: 'circle', cx: '17', cy: '15', r: '3' },
		{ forme: 'path', d: 'M10 18V5l10-2v12M10 9l10-2' }
	],
	/** Le diplôme — apprentissage, formation et enseignement. */
	diplome: [
		{ forme: 'path', d: 'M2.5 8L12 3l9.5 5L12 13zM6 10.2V16c3.5 2.7 8.5 2.7 12 0v-5.8M21.5 8v7' }
	],
	/** L'avion — voyages, mobilité et destinations. */
	avion: [
		{
			forme: 'path',
			d: 'M21 16l-8-3v6l2 2v1l-3-1-3 1v-1l2-2v-6l-8 3v-2l8-5V5a1 1 0 0 1 2 0v4l8 5z'
		}
	],
	/** Le cœur — santé, bien-être et sujets personnels. */
	coeur: [
		{
			forme: 'path',
			d: 'M20.5 5.5a5.5 5.5 0 0 0-7.8 0L12 6.2l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-7.7a5.5 5.5 0 0 0 0-7.8z'
		}
	],
	/** L'ampoule — idées, recherche et innovation. */
	ampoule: [
		{ forme: 'path', d: 'M8.5 16.5A7 7 0 1 1 15.5 16.5L14.5 18h-5zM9.5 21h5M9.5 18v3M14.5 18v3' }
	],
	/** La mallette — activité professionnelle, clients et projets. */
	mallette: [
		{ forme: 'rect', x: '3', y: '7', largeur: '18', hauteur: '13', rx: '2' },
		{ forme: 'path', d: 'M8 7V4h8v3M3 12h18M10 12v2h4v-2' }
	],
	/** Le portefeuille — budget, finance et administration. */
	portefeuille: [
		{ forme: 'rect', x: '3', y: '5', largeur: '18', hauteur: '15', rx: '2' },
		{ forme: 'path', d: 'M3 8h16M15 11h6v6h-6a3 3 0 0 1 0-6zM17 14h.01' }
	],
	/** Le globe — international, langues et présence en ligne. */
	globe: [
		{ forme: 'circle', cx: '12', cy: '12', r: '9' },
		{
			forme: 'path',
			d: 'M3.5 9h17M3.5 15h17M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9'
		}
	],
	/** La palette — création, design et arts. */
	palette: [
		{
			forme: 'path',
			d: 'M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3.3-4-6-9-6z'
		},
		{ forme: 'circle', cx: '7.5', cy: '9', r: '1' },
		{ forme: 'circle', cx: '10.5', cy: '6.5', r: '1' },
		{ forme: 'circle', cx: '15', cy: '7', r: '1' }
	],
	/** Les outils croisés — fabrication, entretien et projets pratiques. */
	outils: [
		{
			forme: 'path',
			d: 'M14.5 6.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 5 5L20 18a1.4 1.4 0 0 1-2 2zM8.5 12.5L3.8 17.2a2 2 0 1 0 2.8 2.8l4.7-4.7'
		}
	],
	/** L'enveloppe — communication, correspondance et candidatures. */
	courrier: [
		{ forme: 'rect', x: '3', y: '5', largeur: '18', hauteur: '14', rx: '2' },
		{ forme: 'path', d: 'M4 7l8 6 8-6M4 17l5-5M20 17l-5-5' }
	],
	/** Le trophée — sport, objectifs, concours et réussites. */
	trophee: [
		{
			forme: 'path',
			d: 'M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6'
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
