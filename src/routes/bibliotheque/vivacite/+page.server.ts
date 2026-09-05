/**
 * `/bibliotheque/vivacite` — LA PLANCHE DES ÉTATS DE VIVACITÉ.
 *
 * ELLE N'EST PAS RÉSERVÉE À L'ADMINISTRATEUR, contrairement à `/bibliotheque` : le pied de
 * CHAQUE note y renvoie (« Planche des états de vivacité »), et un lien que le lecteur suit vers
 * un 404 est un défaut, pas une garde. Tout compte connecté l'ouvre.
 *
 * ELLE NE LIT AUCUNE NOTE POUR SON CONTENU : les cinq états sont rendus par la fabrique unique,
 * sur des cycles construits pour l'occasion. Ce que le chargeur sert, c'est ce dont la COQUILLE a
 * besoin — le rail se dérive du corpus lisible, et lui seul.
 */
import { basePartagee } from '$lib/base/acces';
import { lireAccueil } from '$lib/donnees/accueil';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const config = await lireConfiguration(base);
	const accueil = await lireAccueil(base, locals.identite, {
		maintenant: new Date(),
		seuils: { frais: config.seuilFrais, vieillissant: config.seuilVieillissant }
	});

	return {
		notes: accueil.notes,
		/* SANS SESSION, `lireAccueil()` ne rend ni univers ni domaines : le rail est
		   alors vide, et c'est la vérité — pas un repli sur un jeu d'exemple. */
		univers: accueil.session ? (accueil.univers ?? []) : [],
		domaines: accueil.session ? (accueil.domaines ?? []) : [],
		/**
		 * LE JOUR EST PRIS ICI, ET NULLE PART AILLEURS. La planche montre des échéances en
		 * clair : calculées dans le navigateur, elles auraient dérivé du serveur d'une
		 * demi-journée selon le fuseau du lecteur, et la comparaison à la capture n'aurait
		 * plus rien voulu dire.
		 */
		aujourdhui: new Date().toISOString().slice(0, 10)
	};
};
