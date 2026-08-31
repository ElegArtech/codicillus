/**
 * LES SIX FACETTES DE LA LISTE DE NOTES D'UN DOMAINE — leur déclaration, la règle
 * d'ordre de leurs valeurs, et les quatre ordres de la liste.
 *
 * CE MODULE EST PUR, ET IL LE RESTE : il n'importe ni la base, ni le cadre. Il est le
 * SEUL contrat partagé entre le chargeur — qui compte en SQL — et la vue — qui rend
 * ce qu'on lui donne. Les mêmes six clés étaient recopiées à TROIS endroits (le
 * chargeur, `V-12.svelte`, `+page.svelte`) : deux d'entre elles ont déjà divergé une
 * fois, et cocher une valeur écrivait la clé de la facette voisine.
 *
 * LA RÈGLE DE COMPTE EST CELLE DE LA PLANCHE, ET ELLE EST CONTRE-INTUITIVE : le
 * compte affiché en regard d'une valeur est le nombre de résultats qu'on obtiendrait
 * SI CETTE VALEUR ÉTAIT RETENUE, les autres facettes restant appliquées. Une facette
 * ne se compte donc JAMAIS sous son propre filtre. `assemblerLaFacette()` ne fait que
 * la mise en forme ; c'est l'appelant qui doit fournir des comptes établis sans le
 * filtre de la facette.
 */
import type { NiveauFraicheur } from '../fraicheur';

/** Les six clés de facette, dans l'ordre où les menus se rendent. */
export const CLES_DE_FACETTE = [
	'type',
	'fraicheur',
	'statut',
	'dossier',
	'auteur',
	'etiquette'
] as const;

export type CleDeFacette = (typeof CLES_DE_FACETTE)[number];

export interface DeclarationDeFacette {
	readonly id: CleDeFacette;
	readonly nom: string;
	/** Le préfixe d'affichage d'une valeur — le croisillon des étiquettes, sinon rien. */
	readonly prefixe: string;
}

export const FACETTES_DE_NOTE: readonly DeclarationDeFacette[] = [
	{ id: 'type', nom: 'Type', prefixe: '' },
	{ id: 'fraicheur', nom: 'Fraîcheur', prefixe: '' },
	{ id: 'statut', nom: 'Statut', prefixe: '' },
	{ id: 'dossier', nom: 'Dossier', prefixe: '' },
	{ id: 'auteur', nom: 'Auteur', prefixe: '' },
	{ id: 'etiquette', nom: 'Étiquette', prefixe: '#' }
];

/**
 * Les trois libellés de la facette « Fraîcheur ». Ce sont des VALEURS D'ADRESSE
 * autant que d'affichage — `?fraicheur=Obsolète probable` est le couple que
 * l'accueil pose en arrivant depuis un indicateur — et ils ne se traduisent nulle
 * part ailleurs.
 */
export const LIBELLE_DE_FRAICHEUR: Readonly<Record<NiveauFraicheur, string>> = Object.freeze({
	frais: 'Frais',
	vieil: 'Vieillissant',
	obs: 'Obsolète probable'
});

/** Les deux libellés de la facette « Statut », dans l'ordre de l'énumération de base. */
export const LIBELLE_DE_STATUT: Readonly<Record<'brouillon' | 'publiee', string>> = Object.freeze({
	brouillon: 'Brouillon',
	publiee: 'Publiée'
});

export interface ValeurDeFacette {
	readonly valeur: string;
	readonly compte: number;
	readonly retenue: boolean;
}

export interface FacetteRendue {
	readonly id: CleDeFacette;
	readonly nom: string;
	readonly prefixe: string;
	/** Le nombre de valeurs retenues — le compteur du bouton de menu. */
	readonly retenues: number;
	readonly valeurs: readonly ValeurDeFacette[];
}

/**
 * Une facette prête à rendre. Trois règles, reprises à la lettre de la planche :
 *
 *  1. les valeurs se rangent par compte DÉCROISSANT, puis par ordre alphabétique
 *     FRANÇAIS — la collation du serveur classerait sur les octets de l'encodage, où
 *     le e accentué suit le f ;
 *  2. une valeur retenue mais ABSENTE des comptes est ajoutée en queue, à zéro : sa
 *     disparition ferait croire à un défaut d'affichage ;
 *  3. une valeur VIDE ne se rend pas — une note rangée à la racine d'un domaine n'a
 *     pas de chemin de dossier, et un menu ne propose pas de filtrer sur rien.
 */
export function assemblerLaFacette(
	declaration: DeclarationDeFacette,
	comptes: ReadonlyMap<string, number>,
	retenues: readonly string[]
): FacetteRendue {
	const ordonnees = [...comptes.keys()]
		.filter((v) => v !== '')
		.sort((a, b) => (comptes.get(b) ?? 0) - (comptes.get(a) ?? 0) || a.localeCompare(b, 'fr'));
	for (const v of retenues) if (!ordonnees.includes(v)) ordonnees.push(v);
	return {
		id: declaration.id,
		nom: declaration.nom,
		prefixe: declaration.prefixe,
		retenues: retenues.length,
		valeurs: ordonnees.map((valeur) => ({
			valeur,
			compte: comptes.get(valeur) ?? 0,
			retenue: retenues.includes(valeur)
		}))
	};
}

/** Les valeurs retenues par facette, telles que l'adresse les porte. */
export type RetenuesDeFacette = Readonly<Partial<Record<CleDeFacette, readonly string[]>>>;

/** Les quatre ordres du gel, et il n'en existe pas de cinquième. */
export type OrdreDeListe = 'modification' | 'verification' | 'consultations' | 'alpha';

/**
 * L'ordre demandé. UNE VALEUR INCONNUE S'IGNORE, JAMAIS NE REFUSE : un paramètre
 * d'adresse n'est pas une saisie, et l'ordre du gel est l'ancienneté de modification.
 */
export function ordreDeListe(tri: string | null | undefined): OrdreDeListe {
	return tri === 'alpha' || tri === 'consultations' || tri === 'verification'
		? tri
		: 'modification';
}

/**
 * LE NOMBRE DE NOTES PAR PAGE. La liste rendait TOUTES les notes du domaine :
 * à deux mille notes, deux mille lignes-cartes dans un seul document.
 */
export const NOTES_PAR_PAGE = 50;

/** Le nombre de pages d'un total — au moins une, même vide. */
export function nombreDePages(nombre: number, parPage: number = NOTES_PAR_PAGE): number {
	return Math.max(1, Math.ceil(nombre / Math.max(1, parPage)));
}

/**
 * La page que l'adresse demande. UN `?page=` ILLISIBLE NE REFUSE PAS, il vaut la
 * première : un paramètre d'adresse n'est pas une saisie. Le rabat sur la DERNIÈRE
 * page se fait à la lecture, seul endroit où le nombre de pages soit connu.
 */
export function pageDemandee(valeur: string | null | undefined): number {
	const lu = Number.parseInt(valeur ?? '', 10);
	return Number.isFinite(lu) && lu > 1 ? lu : 1;
}
