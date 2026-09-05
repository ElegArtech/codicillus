/**
 * Formatage des dates en français. Le produit est entièrement en français et affiche des dates
 * dans presque toutes ses vues : une implémentation unique évite que chaque vue reformate à sa
 * façon. Le fuseau est explicite et non implicite : sans cela, la même date rendue par le
 * serveur et par le navigateur peut différer d'un jour.
 */

/** Fuseau de référence du produit tant qu'aucun réglage ne le contredit. */
export const FUSEAU_PAR_DEFAUT = 'Europe/Paris';

export type EntreeDate = Date | string | number;

/** Levée lorsqu'une entrée ne désigne aucun instant valide. */
export class DateInvalideErreur extends Error {
	constructor(valeur: EntreeDate) {
		super(`Date invalide : ${String(valeur)}`);
		this.name = 'DateInvalideErreur';
	}
}

function versDate(valeur: EntreeDate): Date {
	const date = valeur instanceof Date ? new Date(valeur.getTime()) : new Date(valeur);
	if (Number.isNaN(date.getTime())) {
		throw new DateInvalideErreur(valeur);
	}
	return date;
}

/**
 * Date en toutes lettres : « 18 août 2026 ».
 */
export function formaterDateFr(valeur: EntreeDate, fuseau: string = FUSEAU_PAR_DEFAUT): string {
	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: fuseau
	}).format(versDate(valeur));
}

/**
 * Date en chiffres : « 18/08/2026 ». Réservée aux tableaux denses, où la forme
 * en toutes lettres ne tient pas.
 */
export function formaterDateCourteFr(
	valeur: EntreeDate,
	fuseau: string = FUSEAU_PAR_DEFAUT
): string {
	return new Intl.DateTimeFormat('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: fuseau
	}).format(versDate(valeur));
}

/**
 * Date au mois abrégé : « 11 nov. 2026 ». C'est la forme des lignes de vivacité et des
 * légendes de frise, où la forme en toutes lettres pousse la ligne au retour à la ligne.
 */
export function formaterDateAbregeeFr(
	valeur: EntreeDate,
	fuseau: string = FUSEAU_PAR_DEFAUT
): string {
	return new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: fuseau
	}).format(versDate(valeur));
}

/**
 * Date et heure : « 18 août 2026 à 14:03 ».
 */
export function formaterDateHeureFr(
	valeur: EntreeDate,
	fuseau: string = FUSEAU_PAR_DEFAUT
): string {
	const date = versDate(valeur);
	const heure = new Intl.DateTimeFormat('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: fuseau
	}).format(date);
	return `${formaterDateFr(date, fuseau)} à ${heure}`;
}

/**
 * Heure seule : « 14:03 ». La barre d'état des deux éditeurs y dit à quelle heure le
 * brouillon local a été écrit : la date y serait du bruit, l'écriture datant de la
 * minute précédente.
 */
export function formaterHeureFr(valeur: EntreeDate, fuseau: string = FUSEAU_PAR_DEFAUT): string {
	return new Intl.DateTimeFormat('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: fuseau
	}).format(versDate(valeur));
}

/**
 * Forme lisible par une machine, pour les attributs `datetime` de `<time>` :
 * « 2026-08-18 ». C'est l'alternative exigée à côté de tout affichage humain.
 */
export function formaterDateIso(valeur: EntreeDate, fuseau: string = FUSEAU_PAR_DEFAUT): string {
	const parties = new Intl.DateTimeFormat('en-CA', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: fuseau
	}).format(versDate(valeur));
	return parties;
}
