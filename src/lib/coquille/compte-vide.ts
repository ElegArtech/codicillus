/**
 * L'ÉTAT VIDE DU COMPTE AFFICHÉ — l'absence, dite au lieu d'être comblée.
 *
 * `Coquille.svelte` EXIGE un `compte`, et le contexte d'identité l'emporte
 * toujours en application (`identite?.compte ?? compte`). Les vues remplissaient
 * cette propriété avec `MOI` de `seeds/corpus.ts` : hors gabarit racine — une
 * page d'erreur, un rendu de vue isolé —, la barre supérieure annonçait donc
 * « Karim Belhadj — Référent — Infrastructure » à qui n'était personne.
 *
 * Le repli n'est plus une identité de démonstration : c'est une identité VIDE.
 * `BarreSuperieure.svelte` rend alors des libellés vides plutôt qu'un nom
 * emprunté au jeu, ce qui est la seule chose vraie quand rien n'est connu.
 *
 * LA FORME EST CELLE DE L'ORIGINE — `CompteAffiche` de `./identite.ts`, le
 * contrat que le gabarit racine sert. Recopiée, elle divergerait sans qu'aucun
 * compilateur ne le voie.
 */
import type { CompteAffiche } from './identite';

/** Aucun compte connu. Les quatre libellés sont vides, jamais inventés. */
export const COMPTE_VIDE: CompteAffiche = {
	nom: '',
	initiales: '',
	role: '',
	domaine: ''
};
