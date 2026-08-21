/**
 * LE CÂBLAGE DE V-06 — les deux reprises de la réinitialisation, et la
 * révélation du mot de passe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS LA VUE
 *
 * `ARB-063` : le comportement s'accroche depuis la route, par identifiant et
 * par sélecteur. Précédent copié :
 * `src/routes/notes/[identifiant]/operationnel/cablage.ts`.
 *
 * CE MODULE SERT LES DEUX ROUTES DE V-06 — `/mot-de-passe-oublie` porte les
 * étapes 1 et 2, `/mot-de-passe-oublie/{jeton}` l'étape 3 et le lien expiré
 * (`docs/routes.md` §3.2). Une seule vue, deux adresses, donc un seul câblage :
 * l'écrire deux fois en ferait deux implémentations d'un même geste.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX REPRISES MÈNENT AU MÊME ENDROIT, ET CE N'EST PAS UN RACCOURCI
 *
 * « Recommencer avec un autre identifiant » (`#renvoyer`, étape 2) et
 * « Demander un nouveau lien » (`#relancer`, lien expiré) demandent l'un et
 * l'autre de REPARTIR DE L'ÉTAPE 1 : saisir un identifiant et faire envoyer un
 * lien. C'est `/mot-de-passe-oublie`, qui rend exactement cette étape
 * (`vecteurDeV06Etape1()`). Le gel le fait en mémoire — il n'a pas d'adresse à
 * viser ; le produit en a une, et une adresse est partageable.
 *
 * LA NAVIGATION EST UNE NAVIGATION COMPLÈTE, et non une bascule d'attribut :
 * l'étape affichée vient du CHARGEUR, pas d'un état de navigateur. La faire
 * changer ici sans repasser par le serveur poserait un second lieu où l'étape
 * se décide.
 *
 * `#renvoyer` N'EST PAS ATTEINT AUJOURD'HUI, et c'est déclaré : l'étape 2 se
 * rend après un envoi, or l'action de la route répond 501 — la demande de
 * réinitialisation n'est pas implémentée. Le bouton est câblé parce qu'il est
 * dessiné ; il servira le jour où l'étape 2 sera servie.
 */
import { resolve } from '$app/paths';
import { cablerLaRevelation } from '$lib/public/mot-de-passe';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
export type Debranchement = () => void;

/** Les deux boutons de reprise, et l'étape à laquelle ils ramènent. */
const REPRISES = ['#renvoyer', '#relancer'] as const;

/**
 * LE CÂBLAGE DE V-06 — appelé depuis `onMount` des deux routes de la vue.
 * `racine` est le `main.auth` de l'écran.
 */
export function cablerLaReinitialisation(racine: HTMLElement): Debranchement {
	const fenetre = racine.ownerDocument.defaultView;
	const jetables: Debranchement[] = [cablerLaRevelation(racine)];

	for (const selecteur of REPRISES) {
		const bouton = racine.querySelector(selecteur);
		if (bouton === null) continue;
		const reprendre = (): void => {
			fenetre?.location.assign(resolve('/mot-de-passe-oublie'));
		};
		bouton.addEventListener('click', reprendre);
		jetables.push(() => {
			bouton.removeEventListener('click', reprendre);
		});
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
