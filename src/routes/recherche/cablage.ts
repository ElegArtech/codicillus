/**
 * LE CÂBLAGE DE V-02 — le panneau de filtres sur petit écran, ET UN SEUL GESTE : les
 * cinq autres commandes passent par l'ADRESSE (`RG-M02-06`), et le dépliage d'une
 * facette est de l'état local, déjà dans la vue.
 *
 * Reste `#ouvrir-facettes`, le bouton « Affiner » que la feuille ne montre qu'en
 * dessous de la largeur où la colonne de facettes disparaît. Il ne navigue pas et ne
 * filtre rien : il retourne `data-facettes` sur la racine, seul attribut que
 * `V-02.css` lit pour ramener la colonne. SANS LUI, LES FACETTES SONT
 * INATTEIGNABLES SUR TÉLÉPHONE.
 *
 * POURQUOI ICI, ET NON DANS LA VUE — `ARB-063`. CE CÂBLAGE NE VAUT QUE POUR LA
 * BRANCHE ANONYME, V-08 ayant sa propre commande de facettes.
 */

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
