/**
 * LE CÂBLAGE DE V-05 — la révélation du mot de passe, et rien d'autre.
 *
 * CE QUI N'EST PLUS CÂBLÉ ICI : la méthode et les trois noms de champ étaient
 * posés depuis `onMount`, la parade n'existait donc pas avant le montage, et une
 * soumission dans cette fenêtre partait en `GET` avec le mot de passe dans
 * l'adresse. Ils sont dans le BALISAGE de la vue ; rien de ce module ne doit les
 * y reprendre.
 *
 * CE QUI L'EST — `button#voir`, dessiné, annoncé en bascule
 * (`aria-pressed="false"`), et qui ne faisait rien. Le geste lui-même est celui de
 * `$lib/public/mot-de-passe`, partagé avec V-06 qui porte le même bouton.
 *
 * L'AVERTISSEMENT DE VERROUILLAGE DES MAJUSCULES (`#majuscules`) N'EST PAS CÂBLÉ,
 * et c'est déclaré : son apparition demande de lire l'état d'une touche
 * modificatrice sur un événement de clavier.
 */
import { cablerLaRevelation } from '$lib/public/mot-de-passe';

export type Debranchement = () => void;

/** Le câblage de V-05 — appelé depuis `onMount` de la route, et jamais ailleurs. */
export function cablerLaConnexion(racine: HTMLElement): Debranchement {
	return cablerLaRevelation(racine);
}
