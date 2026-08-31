// Déclarations d'ambiance de l'application.
// Les interfaces se remplissent lot par lot (session en T-012, droits en T-011).
import type { Identite } from '$lib/droits/resolution';

declare global {
	namespace App {
		/**
		 * CE QU'UN REFUS PORTE JUSQU'À L'ÉCRAN.
		 *
		 * `message` seul ne suffisait pas : `+error.svelte` rend V-26 pour tout
		 * 404 et n'affichait `page.error.message` que dans sa branche NON-404. Le
		 * serveur envoyait donc « Créez un univers, puis un domaine, dans la
		 * console » et l'administrateur lisait le texte générique — le message
		 * d'amorçage était servi dans la réponse HTTP et peint nulle part.
		 *
		 * `amorcage` dit que le message est celui d'une instance qui n'a pas
		 * encore de quoi ranger une note, et qu'il doit donc être RENDU. Il ne
		 * voyage qu'avec ce message-là, c'est-à-dire au seul administrateur : le
		 * régime indiscernable d'`ADR-007` ne bouge pas pour les autres.
		 */
		interface Error {
			message: string;
			amorcage?: boolean;
		}

		/**
		 * Ce que `src/hooks.server.ts` établit pour CHAQUE requête, et que toute
		 * route lit — T-012.
		 *
		 * `identite` n'est jamais absente : un appelant sans session porte
		 * `ANONYME` (`RG-DRO-04` fait de l'anonymat un régime séparé, pas un
		 * compte sans droits). Une route n'a donc pas de cas « pas encore
		 * résolu » à traiter, et ne peut pas confondre « anonyme » avec « oublié
		 * de regarder ».
		 *
		 * `sessionId` n'est présent qu'avec une session ouverte : c'est ce que la
		 * déconnexion ferme (UC-M16-02).
		 */
		interface Locals {
			identite: Identite;
			sessionId?: string;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
