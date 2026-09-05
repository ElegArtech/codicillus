/**
 * L'ÉTAT VIDE DU COMPTE AFFICHÉ — l'absence, dite au lieu d'être comblée.
 *
 * `Coquille.svelte` EXIGE un `compte`, et le contexte d'identité l'emporte en
 * application. Les vues remplissaient cette propriété avec `MOI` de
 * `seeds/corpus.ts` : hors gabarit racine — page d'erreur, rendu de vue isolé —,
 * la barre supérieure annonçait donc une identité de démonstration à qui n'était
 * personne. Le repli est désormais une identité VIDE, et la barre rend des
 * libellés vides plutôt qu'un nom emprunté.
 *
 * LA FORME EST CELLE DE L'ORIGINE — `CompteAffiche` de `./identite.ts`. Recopiée,
 * elle divergerait sans qu'aucun compilateur ne le voie.
 */
import type { CompteAffiche } from './identite';

/** Aucun compte connu. Les cinq libellés sont vides, jamais inventés. */
export const COMPTE_VIDE: CompteAffiche = {
	nom: '',
	initiales: '',
	role: '',
	domaine: '',
	courriel: ''
};
