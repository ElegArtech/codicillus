/**
 * LE CÂBLAGE DE V-02 — le panneau de filtres sur petit écran.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL GESTE, ET C'EST LE SEUL QUI MANQUAIT
 *
 * V-02 porte déjà ses cinq autres commandes, et elles passent toutes par
 * l'ADRESSE — `RG-M02-06` : « chaque bascule de valeur, chaque pastille
 * retirée, chaque “Tout effacer” recompose l'adresse et y navigue ». Le
 * dépliage d'une facette est de l'état local, et il est dans la vue depuis le
 * même lot.
 *
 * Reste `#ouvrir-facettes`, le bouton « Affiner » que la feuille de la vue
 * ne montre qu'en dessous de la largeur où la colonne de facettes disparaît.
 * Il ne navigue pas et ne filtre rien : il retourne `data-facettes` sur la
 * racine, seul attribut que `V-02.css` lit pour ramener la colonne. C'est
 * exactement le geste du gel — `mockups/V-02-recherche-publique.html`, à la
 * ligne près.
 *
 * SANS LUI, LES FACETTES SONT INATTEIGNABLES SUR TÉLÉPHONE : la règle
 * `.app[data-facettes="ouvert"] .facettes` ne pouvait jamais s'appliquer,
 * puisque rien n'écrivait « ouvert ». Le bouton était dessiné, donc promis.
 *
 * POURQUOI ICI, ET NON DANS LA VUE — `ARB-063`, comme au voisin de
 * `src/routes/notes/[identifiant]/operationnel/cablage.ts` : le comportement
 * s'accroche depuis la route, par identifiant et par sélecteur.
 *
 * CE CÂBLAGE NE VAUT QUE POUR LA BRANCHE ANONYME. `/recherche` sert V-08 en
 * session, et V-08 a sa propre commande de facettes ; la route ne l'appelle
 * donc que lorsqu'aucune session n'est ouverte.
 */

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
export type Debranchement = () => void;

/** Les deux positions de l'attribut, telles que la feuille de la vue les lit. */
const OUVERT = 'ouvert';
const FERME = 'ferme';

/**
 * LE CÂBLAGE DU PANNEAU DE FILTRES — appelé depuis `onMount` de la route, et
 * seulement en anonyme. `racine` est le `div.app` de la vue.
 */
export function cablerLesFacettes(racine: HTMLElement): Debranchement {
	const bouton = racine.querySelector('#ouvrir-facettes');
	if (bouton === null) return () => undefined;

	const basculer = (): void => {
		racine.setAttribute(
			'data-facettes',
			racine.getAttribute('data-facettes') === OUVERT ? FERME : OUVERT
		);
	};
	bouton.addEventListener('click', basculer);
	return () => {
		bouton.removeEventListener('click', basculer);
	};
}
