/**
 * LA PALETTE DE RECHERCHE RAPIDE — ce que le navigateur et le serveur en partagent :
 * la forme de la réponse, et les quelques règles qui décident sans toucher au DOM.
 *
 * `UC-M02-01` : « Depuis n'importe quelle page, l'utilisateur ouvre une palette de
 * recherche par raccourci clavier et trouve un document sans quitter son contexte. »
 * `UC-M02-02` : « Premiers résultats dès le deuxième caractère », « requêtes temporisées
 * après la dernière frappe ».
 *
 * CE MODULE NE CHERCHE PAS. Le seul chemin de recherche du dépôt est
 * `chercherLesNotes()`, qui calcule son filtre de périmètre depuis l'identité
 * (`ADR-006`) ; la palette l'atteint par `/recherche/palette`, jamais autrement. Rien
 * ici ne lit la base ni le moteur — le composant l'importe, donc il part au navigateur.
 */
import type { NiveauFraicheur } from '../fraicheur';
import { accord } from '../vocabulaire';
import type { MotifDuVide } from './motifs';

/**
 * CE QU'UNE LIGNE DE RÉSULTAT MONTRE, ET RIEN DE PLUS. Le type est étroit à dessein :
 * la réponse part au navigateur, et un champ de plus serait un champ servi à quelqu'un
 * qui n'a pas demandé à le lire. Le corps des notes n'y figure pas.
 *
 * Les trois champs de fraîcheur sont ceux d'`EtatDeFraicheur` : le témoin se rend par la
 * fabrique unique de `$lib/fraicheur` (`P-01`, `ADR-005`), jamais recalculé ici.
 */
export interface ResultatDePalette {
	readonly id: string;
	readonly titre: string;
	readonly type: string;
	/** `null` : la note n'est pas une fiche typée. */
	readonly typeFiche: string | null;
	readonly domaine: string;
	/** La note porte un registre Opérationnel — la ligne le signale. */
	readonly operationnel: boolean;
	readonly fraicheur: NiveauFraicheur;
	readonly jours: number;
	/** `null` : jamais vérifiée. */
	readonly revise: string | null;
}

export interface ReponseDePalette {
	/** Les lignes à rendre, au plus `MAX_RESULTATS`, dans l'ordre du moteur. */
	readonly resultats: readonly ResultatDePalette[];
	/** Le compte des notes retenues DANS LE PÉRIMÈTRE, avant troncature. */
	readonly total: number;
	/** `processingTimeMs` du moteur. `null` : aucune requête n'est partie. */
	readonly dureeMs: number | null;
	/**
	 * Les lignes sont les notes CONSULTÉES RÉCEMMENT par l'appelant, pas un résultat de
	 * recherche : la requête était vide. La palette ne s'ouvre jamais sur du blanc.
	 */
	readonly recentes: boolean;
	/** La recherche par sens est indisponible — la palette le dit sans se vider. */
	readonly degrade: boolean;
	/**
	 * LE PÉRIMÈTRE N'A RIEN À OFFRIR, ET VOICI POURQUOI — les quatre motifs de
	 * `/recherche`, écrits une seule fois dans `./motifs`. `null` : il a de quoi
	 * chercher, et une liste vide est alors une absence de correspondance.
	 */
	readonly motif: MotifDuVide | null;
}

/**
 * LE SEUIL DE DÉCLENCHEMENT — `UC-M02-02`, « premiers résultats dès le deuxième
 * caractère ». En dessous, aucune requête ne part : « le bruit serait plus coûteux que
 * l'attente » (`V-09`, état 02).
 */
export const MINIMUM_DE_CARACTERES = 2;

/** Sept lignes au plus, comme la planche des états les montre (`V-09:1231`). */
export const MAX_RESULTATS = 7;

/** Quatre notes récemment consultées au plus — `V-09`, état 01. */
export const MAX_RECENTES = 4;

/**
 * LA TEMPORISATION APRÈS LA DERNIÈRE FRAPPE — `UC-M02-02`, « requêtes temporisées après
 * la dernière frappe pour éviter la surcharge ». Elle ne retarde PAS l'ouverture, que
 * `CDC:1535` veut « perçue instantanée » : la palette s'ouvre sans rien demander, et ne
 * cherche qu'à la frappe.
 */
export const TEMPORISATION_DE_FRAPPE = 140;

/**
 * LE RACCOURCI UNIVERSEL — `Ctrl` `K`, celui que la barre supérieure affiche sur
 * elle-même et que le pied de la palette rappelle. `metaKey` pour le clavier Apple, où
 * `Ctrl` n'est pas le modificateur de commande.
 *
 * `evenement.key` est comparé en minuscule : avec `Maj` enfoncée le navigateur rend
 * `K`, et le raccourci serait resté sans effet.
 */
export function estLeRaccourciDeLaPalette(evenement: KeyboardEvent): boolean {
	if (evenement.altKey) return false;
	if (!(evenement.ctrlKey || evenement.metaKey)) return false;
	return evenement.key.toLowerCase() === 'k';
}

/**
 * LE RANG SÉLECTIONNÉ APRÈS UNE FLÈCHE — « la navigation boucle : après le dernier,
 * retour au premier » (`V-09`, table des règles clavier). Une liste vide n'a pas de rang
 * sélectionné : `-1`, et l'appelant ne rend alors aucun `aria-selected`.
 *
 * @param rang le rang courant, ou `-1` quand aucun n'est sélectionné
 * @param nombre le nombre de lignes
 * @param pas `+1` vers le bas, `-1` vers le haut
 */
export function rangSuivant(rang: number, nombre: number, pas: 1 | -1): number {
	if (nombre <= 0) return -1;
	if (rang < 0) return pas === 1 ? 0 : nombre - 1;
	return (rang + pas + nombre) % nombre;
}

/**
 * L'ADRESSE DE LA RECHERCHE COMPLÈTE — la sortie « voir tous les résultats » de
 * `docs/routes.md:206`. Une requête vide ne pose aucun paramètre : `/recherche` sans
 * paramètre réinitialise tout.
 */
export function adresseDeTousLesResultats(requete: string): string {
	const terme = requete.trim();
	return terme === '' ? '/recherche' : `/recherche?q=${encodeURIComponent(terme)}`;
}

/** L'adresse interrogée par la palette, pour une requête donnée. */
export function adresseDInterrogation(requete: string): string {
	const terme = requete.trim();
	return terme === '' ? '/recherche/palette' : `/recherche/palette?q=${encodeURIComponent(terme)}`;
}

/**
 * LE COMPTEUR DU PIED — le nombre de résultats, et la durée SEULEMENT si elle a été
 * mesurée. `null` ne vaut pas zéro : une durée qui n'existe pas ne s'écrit pas
 * « 0,00 s », c'est le zéro muet que `P-02` proscrit.
 */
export function compteurDeResultats(total: number, dureeMs: number | null): string {
	const duree = dureeMs === null ? '' : ` en ${(dureeMs / 1000).toFixed(2).replace('.', ',')} s`;
	return `${total} ${accord(total, 'résultat')}${duree}`;
}
