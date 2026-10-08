/**
 * UN PLAFOND DE FRÉQUENCE PAR ORIGINE, pour les gestes qu'un anonyme peut répéter sans
 * fin. Sans lui, un robot déposait deux cents requêtes de documentation en moins d'une
 * seconde dans la file de l'administrateur.
 *
 * Il vit dans le processus — l'application en tourne un seul — et oublie les origines
 * dont la fenêtre est passée. SA MÉMOIRE EST BORNÉE : au-delà de `ORIGINES_MAX`, la plus
 * anciennement vue est oubliée. Sans borne, un flot d'adresses toutes différentes
 * faisait grossir la table sans fin et parcourir toute la table à chaque geste.
 */
export interface Plafond {
	/** Vrai si le geste est admis, et il est alors compté. */
	admettre(origine: string, maintenant?: number): boolean;
}

const ORIGINES_MAX = 10_000;

/**
 * L'ORIGINE D'UNE ADRESSE, telle qu'un plafond la compte. Une adresse IPv6 est ramenée à
 * son préfixe /64 — un seul abonné en dispose d'un entier, et compter chaque adresse
 * laissait le même client se renouveler à volonté. Une adresse IPv4, même transcrite en
 * IPv6, reste elle-même.
 */
export function origineDe(adresse: string): string {
	const v4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(adresse);
	if (v4) return v4[1] as string;
	if (!adresse.includes(':')) return adresse;
	const [tete = '', queue = ''] = adresse.toLowerCase().split('::');
	const avant = tete === '' ? [] : tete.split(':');
	const apres = queue === '' ? [] : queue.split(':');
	const complete = adresse.includes('::')
		? [...avant, ...Array<string>(Math.max(0, 8 - avant.length - apres.length)).fill('0'), ...apres]
		: avant;
	return (
		complete
			.slice(0, 4)
			.map((groupe) => groupe.replace(/^0+(?=.)/, ''))
			.join(':') + '::/64'
	);
}

export function creerUnPlafond(gestesMax: number, fenetreEnMs: number): Plafond {
	const vus = new Map<string, number[]>();
	let dernierMenage = Number.NEGATIVE_INFINITY;

	function oublierLesAnciennes(maintenant: number): void {
		for (const [origine, instants] of vus) {
			if (instants.every((t) => maintenant - t >= fenetreEnMs)) vus.delete(origine);
		}
	}

	return {
		admettre(adresse, maintenant = Date.now()) {
			const origine = origineDe(adresse);
			if (vus.size >= ORIGINES_MAX && maintenant - dernierMenage >= fenetreEnMs) {
				oublierLesAnciennes(maintenant);
				dernierMenage = maintenant;
			}
			/* La table reste pleine : la plus anciennement vue cède sa place. L'ordre
			   d'insertion d'une `Map` est cet ordre, chaque geste réinscrivant son origine. */
			if (!vus.has(origine) && vus.size >= ORIGINES_MAX) {
				const plusAncienne = vus.keys().next().value;
				if (plusAncienne !== undefined) vus.delete(plusAncienne);
			}
			const recents = (vus.get(origine) ?? []).filter((t) => maintenant - t < fenetreEnMs);
			vus.delete(origine);
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
