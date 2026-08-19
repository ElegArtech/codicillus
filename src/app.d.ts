// Déclarations d'ambiance de l'application.
// Les interfaces se remplissent lot par lot (session en T-012, droits en T-011).
import type { Identite } from '$lib/droits/resolution';

declare global {
	namespace App {
		// interface Error {}

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
