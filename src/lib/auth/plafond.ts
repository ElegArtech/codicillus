/**
 * UN PLAFOND DE FRÉQUENCE PAR ORIGINE, pour les gestes qu'un anonyme peut répéter sans
 * fin. Sans lui, un robot déposait deux cents requêtes de documentation en moins d'une
 * seconde dans la file de l'administrateur.
 *
 * Il vit dans le processus — l'application en tourne un seul — et oublie les origines
 * dont la fenêtre est passée.
 */
export interface Plafond {
	/** Vrai si le geste est admis, et il est alors compté. */
	admettre(origine: string, maintenant?: number): boolean;
}

const ORIGINES_MAX = 10_000;

export function creerUnPlafond(gestesMax: number, fenetreEnMs: number): Plafond {
	const vus = new Map<string, number[]>();

	function oublierLesAnciennes(maintenant: number): void {
		for (const [origine, instants] of vus) {
			if (instants.every((t) => maintenant - t >= fenetreEnMs)) vus.delete(origine);
		}
	}

	return {
		admettre(origine, maintenant = Date.now()) {
			if (vus.size >= ORIGINES_MAX) oublierLesAnciennes(maintenant);
			const recents = (vus.get(origine) ?? []).filter((t) => maintenant - t < fenetreEnMs);
			if (recents.length >= gestesMax) {
				vus.set(origine, recents);
				return false;
			}
			recents.push(maintenant);
			vus.set(origine, recents);
			return true;
		}
	};
}
