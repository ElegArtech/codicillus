/**
 * `/mot-de-passe-oublie/{jeton}` — LE CHARGEUR de V-06 sur une adresse porteuse
 * d'un jeton. Niveau « anonyme (porteur du jeton) » ; l'adresse est DÉRIVÉE de
 * l'état « Lien expiré » de la planche, elle n'est lue dans aucune maquette.
 *
 * AUCUN LIEN N'EST JAMAIS ÉMIS : L'ÉCRAN NE DIT PLUS QUE LE VÔTRE A EXPIRÉ. Aucune
 * des vingt et une tables de `src/lib/base/schema.ts` ne porte de jeton de
 * réinitialisation, et le produit n'a AUCUN expéditeur de courriel. L'écran rendu
 * était « Lien expiré » — c'était affirmer qu'un lien avait existé. Cette adresse
 * rend désormais LE MÊME écran que `/mot-de-passe-oublie`, et nomme le chemin qui
 * existe.
 *
 * LA RÉPONSE NE DÉPEND PAS DU JETON PRÉSENTÉ — même code, même page, aucune
 * lecture en base : elle ne dit rien de l'existence d'un compte (`RG-ACC-04`), et
 * le paramètre n'est même pas regardé.
 */
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE — clé `portail_assistance`
 * de `parametres` (M14.7). Elle ne dépend ni du jeton présenté ni de son sort.
 */
export const load: PageServerLoad = async () => ({
	portail: (await lireConfiguration(basePartagee())).portailAssistance
});

export const actions: Actions = {
	/** Aucun formulaire ne vise cette adresse. Même réponse qu'à sa voisine. */
	default: () => {}
};
