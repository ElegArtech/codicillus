/**
 * LE CÂBLAGE DE V-05 — la révélation du mot de passe, et rien d'autre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI N'EST PLUS CÂBLÉ ICI, ET POURQUOI
 *
 * `+page.svelte` le dit : la méthode et les trois noms de champ étaient posés
 * depuis `onMount`, la parade n'existait donc pas avant le montage, et une
 * soumission dans cette fenêtre partait en `GET` avec le mot de passe dans
 * l'adresse. Ils sont dans le BALISAGE de la vue, et la connexion fonctionne
 * sans JavaScript. Rien de ce module ne doit les y reprendre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI L'EST — `button#voir`
 *
 * Le bouton est dessiné, il s'annonce en bascule (`aria-pressed="false"`), et
 * il ne faisait rien : sur l'écran de connexion, c'est le geste qui rattrape la
 * première cause d'échec de saisie — un mot de passe tapé à l'aveugle sur un
 * poste tiers. `ARB-063` veut le comportement dans la route ; le geste lui-même
 * est celui de `$lib/public/mot-de-passe`, partagé avec V-06 qui porte le même
 * bouton.
 *
 * L'AVERTISSEMENT DE VERROUILLAGE DES MAJUSCULES (`#majuscules`) N'EST PAS
 * CÂBLÉ, et c'est déclaré : le gel le montre à la frappe, et son apparition
 * demande de lire l'état d'une touche modificatrice sur un événement de
 * clavier. Rien ne l'interdit ; ce lot ne le prend pas, faute de l'avoir
 * inscrit à son inventaire.
 */
import { cablerLaRevelation } from '$lib/public/mot-de-passe';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
export type Debranchement = () => void;

/** Le câblage de V-05 — appelé depuis `onMount` de la route, et jamais ailleurs. */
export function cablerLaConnexion(racine: HTMLElement): Debranchement {
	return cablerLaRevelation(racine);
}
