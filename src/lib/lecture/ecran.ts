/**
 * L'ÉCRAN DE LECTURE — ce que la route sert à V-14, et rien de plus.
 *
 * `note-de-demonstration.ts` porte la note et ses corps ; V-15 et V-18 les
 * lisent aussi. Ce module-ci ne concerne QUE la lecture d'une note : le
 * registre affiché, la vivacité des deux cycles, l'en-tête, la colonne de
 * contexte et les adresses des gestes.
 *
 * AUCUNE VALEUR PAR DÉFAUT N'Y HABITE. Toutes ces formes sont servies par le
 * chargeur ; ce qui peut manquer est `null`, et l'écran le DIT en nommant le
 * geste qui débloque — jamais une constante de `seeds/`.
 */
import type { Registre } from '../donnees/note';
import type { Vivacite } from '../fraicheur';

export type { Registre };

/**
 * LA VIVACITÉ DES DEUX REGISTRES. `courante` est celle du registre AFFICHÉ :
 * la ligne, la carte, la frise, le rappel et le menu en sortent tous, et une
 * bascule d'onglet les change tous ensemble.
 *
 * `operationnelle` vaut `null` quand la note ne porte pas ce registre — l'état
 * vide explicite. L'écran y répond par « Créer la version opérationnelle », et
 * jamais par un onglet désactivé.
 */
export interface VivaciteDesRegistres {
	readonly courante: Vivacite;
	readonly reference: Vivacite;
	readonly operationnelle: Vivacite | null;
}

/** Les métadonnées de l'en-tête — création, rédacteur, consultations, version. */
export interface EnteteDeLecture {
	/** La date de création en toutes lettres. */
	readonly creeeLe: string;
	/** « v3 », ou `null` : aucune version n'a encore été capturée. */
	readonly version: string | null;
	/** « il y a 4 jours par Alexandre Berge », ou `null` faute d'auteur connu. */
	readonly derniereModification: string;
}

/** Une destination nommée — le libellé s'affiche, l'adresse s'ouvre. */
export interface LienNomme {
	readonly libelle: string;
	readonly adresse: string;
}

/**
 * LA SECTION « CONTEXTE » DE LA COLONNE DE DROITE : l'univers, le dossier ou le
 * domaine qui porte la note, et les notes voisines qu'on peut aller lire.
 */
export interface ContexteDeLaNote {
	readonly univers: string;
	/** Le dossier qui porte la note, à défaut son domaine. */
	readonly rangement: LienNomme;
	/** « 4 autres notes dans ce domaine », ou `null` : la note est seule. */
	readonly voisinage: LienNomme | null;
}

/**
 * LES ADRESSES DES GESTES — composées par la route, jamais par la vue : un
 * gabarit d'adresse écrit à l'écran est un lien mort au premier renommage.
 */
export interface AdressesDeLecture {
	readonly reference: string;
	readonly operationnel: string;
	readonly modifier: string;
	readonly modifierLOperationnel: string;
	readonly historique: string;
	readonly relations: string;
	/** La planche des états — le lien discret du pied de note. */
	readonly planche: string;
}

/**
 * CE QUE LE GESTE QUI VIENT D'AVOIR LIEU ANNONCE — le texte du prototype, au
 * caractère près, composé par la route qui connaît la durée du cycle. `null` :
 * aucun geste, aucune bulle.
 */
export interface AnnonceDeGeste {
	readonly texte: string;
}

/** Le nombre de jours au-delà duquel la date se dit en clair plutôt qu'en écart. */
const JOURS_AVANT_LA_DATE_EN_CLAIR = 30;

/**
 * « il y a 4 jours par Alexandre Berge », ou « le 10 mars 2026 par k.belhadj ».
 *
 * LES DEUX FORMES SONT CELLES DES CAPTURES, et la bascule est de trente jours :
 * au-delà, un écart en jours ne dit plus rien à personne. La fonction est ici
 * plutôt que dans la vue parce qu'elle COMPOSE une phrase à partir d'une durée
 * — un calcul, et il n'en existe qu'un.
 *
 * `qui` vide : la phrase s'arrête à la date. Un auteur inventé serait pire que
 * son absence.
 */
export function ligneDeDerniereModification(
	jours: number,
	dateEnClair: string,
	qui: string
): string {
	const quand =
		jours <= 0
			? "aujourd'hui"
			: jours === 1
				? 'hier'
				: jours <= JOURS_AVANT_LA_DATE_EN_CLAIR
					? `il y a ${jours} jours`
					: `le ${dateEnClair}`;
	return qui === '' ? quand : `${quand} par ${qui}`;
}
