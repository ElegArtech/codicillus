export interface FenetreDeTableur {
	readonly debut: number;
	readonly fin: number;
	readonly avant: number;
	readonly apres: number;
}

// Une feuille Excel entière dépasse la hauteur CSS maximale de certains navigateurs.
const ETENDUE_MAXIMALE = 8_000_000;

export function etendueDeTableur(nombre: number, taille: number): number {
	return Math.min(nombre * taille, ETENDUE_MAXIMALE);
}

export function positionDeDefilement(
	position: number,
	nombre: number,
	taille: number,
	visible: number
): number {
	const finLogique = Math.max(0, nombre * taille - visible);
	const finPhysique = Math.max(0, etendueDeTableur(nombre, taille) - visible);
	return finLogique === 0
		? 0
		: (Math.min(finLogique, Math.max(0, position)) * finPhysique) / finLogique;
}

/** Les bornes visibles avec une marge ; aucun parcours des cellules hors écran. */
export function fenetreDeTableur(
	nombre: number,
	taille: number,
	defilement: number,
	visible: number,
	marge: number
): FenetreDeTableur {
	if (nombre <= 0) return { debut: 0, fin: -1, avant: 0, apres: 0 };
	const hauteurVisible = Math.max(0, visible);
	const finLogique = Math.max(0, nombre * taille - hauteurVisible);
	const finPhysique = Math.max(0, etendueDeTableur(nombre, taille) - hauteurVisible);
	const positionPhysique = Math.min(finPhysique, Math.max(0, defilement));
	const positionLogique = finPhysique === 0 ? 0 : (positionPhysique * finLogique) / finPhysique;
	const debut = Math.max(0, Math.floor(positionLogique / taille) - marge);
	const fin = Math.min(nombre - 1, Math.ceil((positionLogique + hauteurVisible) / taille) + marge);
	const avant = Math.max(0, positionPhysique - (positionLogique - debut * taille));
	const apres = Math.max(0, etendueDeTableur(nombre, taille) - avant - (fin - debut + 1) * taille);
	return { debut, fin, avant, apres };
}
