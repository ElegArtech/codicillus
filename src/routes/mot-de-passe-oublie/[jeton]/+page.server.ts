/**
 * `/mot-de-passe-oublie/{jeton}` — LE CHARGEUR de V-06, étapes 3 et 4.
 *
 * `docs/routes.md:115` : niveau « anonyme (porteur du jeton) ». L'adresse est
 * DÉRIVÉE de l'état « Lien expiré » de la planche — « un lien expirable est un
 * lien porteur d'un jeton » —, elle n'est lue dans aucune maquette.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TOUT JETON EST INCONNU, PARCE QU'AUCUNE TABLE N'EN PORTE — ÉCART DÉCLARÉ
 *
 * Relevé sur `src/lib/base/schema.ts`, table par table : `comptes`, `univers`,
 * `domaines`, `modules_de_domaine`, `dossiers`, `droits_de_dossier`,
 * `types_de_note`, `templates`, `types_de_fiche`, `champs_de_type_de_fiche`,
 * `types_de_relation`, `etiquettes`, `parametres`, `notes`,
 * `etiquettes_de_note`, `relations`, `pieces_jointes`, `verifications`,
 * `versions`, `sessions`, `tentatives_de_connexion`. **Aucune ne porte de
 * jeton de réinitialisation**, et `comptes` n'a aucune colonne de ce nom.
 * `ECART-047` É-13 l'avait relevé de son côté : le corpus ne porte aucune
 * valeur de jeton, et la batterie 6 ne mesure que le côté *inexistant*.
 *
 * L'ÉCRAN RENDU EST DONC « LIEN EXPIRÉ », et ce n'est pas un choix : c'est le
 * seul énoncé vrai qu'un état gelé permette d'écrire. Créer la table serait
 * sortir du périmètre du lot (`base/**`) ; rendre l'étape 3 laisserait croire
 * qu'un lien vient d'être honoré, et la saisie n'aboutirait nulle part.
 *
 * LA RÉPONSE NE DÉPEND PAS DU JETON PRÉSENTÉ — même code, même corps, aucune
 * lecture en base. Elle ne dit donc rien de l'existence d'un compte
 * (`RG-ACC-04`), et le paramètre n'est même pas regardé.
 */
import { error } from '@sveltejs/kit';
import { vecteurDeV06LienInconnu } from '$lib/donnees/profil';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ vecteur: vecteurDeV06LienInconnu() });

export const actions: Actions = {
	default: () => {
		/* Un jeton qu'aucune table ne porte ne peut être honoré par aucune
		   vérification : la pose d'un nouveau mot de passe par cette voie n'a pas
		   de chemin. 501 le dit sans rien inventer — même choix qu'à l'étape 1. */
		error(501, "la réinitialisation par jeton n'est pas implémentée");
	}
};
