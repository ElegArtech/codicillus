/**
 * `/mot-de-passe-oublie/{jeton}` — LE CHARGEUR de V-06 sur une adresse
 * porteuse d'un jeton.
 *
 * `docs/routes.md:115` : niveau « anonyme (porteur du jeton) ». L'adresse est
 * DÉRIVÉE de l'état « Lien expiré » de la planche — « un lien expirable est un
 * lien porteur d'un jeton » —, elle n'est lue dans aucune maquette.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN LIEN N'EST JAMAIS ÉMIS : L'ÉCRAN NE DIT PLUS QUE LE VÔTRE A EXPIRÉ
 *
 * Relevé sur `src/lib/base/schema.ts`, table par table : `comptes`, `univers`,
 * `domaines`, `modules_de_domaine`, `dossiers`, `droits_de_dossier`,
 * `types_de_note`, `templates`, `types_de_fiche`, `champs_de_type_de_fiche`,
 * `types_de_relation`, `etiquettes`, `parametres`, `notes`,
 * `etiquettes_de_note`, `relations`, `pieces_jointes`, `verifications`,
 * `versions`, `sessions`, `tentatives_de_connexion`. **Aucune ne porte de
 * jeton de réinitialisation**, et `comptes` n'a aucune colonne de ce nom. Le
 * produit n'a par ailleurs AUCUN expéditeur de courriel : aucun lien de
 * réinitialisation n'a donc jamais pu être adressé à qui que ce soit.
 *
 * L'écran rendu était « Lien expiré » — « un lien de réinitialisation expire au
 * bout d'une heure […] celui-ci a dépassé ce délai, ou a déjà été utilisé ».
 * C'était affirmer qu'un lien avait existé. Cette adresse rend désormais LE
 * MÊME écran que `/mot-de-passe-oublie` : la réinitialisation par courriel
 * n'est pas disponible sur cette instance, et le chemin qui existe est nommé.
 *
 * LA RÉPONSE NE DÉPEND PAS DU JETON PRÉSENTÉ — même code, même page, aucune
 * lecture en base. Elle ne dit donc rien de l'existence d'un compte
 * (`RG-ACC-04`), et le paramètre n'est même pas regardé.
 */
import { basePartagee } from '$lib/base/acces';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE — clé `portail_assistance`
 * de la table `parametres` (M14.7). Elle ne dépend ni du jeton présenté ni de
 * son sort : la lire ici ne dit rien de plus qu'à l'autre adresse.
 */
export const load: PageServerLoad = async () => ({
	portail: (await lireConfiguration(basePartagee())).portailAssistance
});

export const actions: Actions = {
	/** Aucun formulaire ne vise cette adresse. Même réponse qu'à sa voisine. */
	default: () => {}
};
