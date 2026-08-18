/**
 * Formatage des dates en français.
 *
 * Le produit est entièrement en français (BRIEF-VUES.md §2.3) et affiche des
 * dates dans presque toutes ses vues : fraîcheur, versions, journaux, activité.
 * Une implémentation unique évite que chaque vue reformate à sa façon.
 *
 * Le fuseau est explicite et non implicite : sans cela, la même date rendue par
 * le serveur et par le navigateur peut différer d'un jour, et la comparaison
 * visuelle (PLAN-DE-REALISATION.md §4.2) devient instable.
 */

/** Fuseau de référence du produit tant qu'aucun réglage ne le contredit. */
export const FUSEAU_PAR_DEFAUT = 'Europe/Paris';

/** Ce qu'on accepte en entrée : un objet Date, un texte ISO, ou un horodatage. */
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
