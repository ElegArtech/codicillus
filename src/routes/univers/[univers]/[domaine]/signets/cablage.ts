/**
 * LE CÂBLAGE DE V-23 — ce que `cablerLeSignet()` ne couvre pas.
 *
 * `cablerLeSignet()` porte la méthode du formulaire, le nom des cinq champs, les
 * pastilles d'étiquette, la touche Entrée, les deux soumissions et le collage. Ce
 * module n'y touche pas.
 *
 * IL RESTE UN GESTE, ET UN SEUL : « ANNULER ». `#annuler-page` est le seul bouton de
 * l'enveloppe « page dédiée » laissé sans destination, et il ramène à la liste des
 * signets du domaine. Ce n'est PAS un `history.back()` : on peut arriver sur
 * `…/signets/nouveau` par un lien.
 *
 * DEUX FAMILLES DE GESTES SONT DÉCLARÉES PLUTÔT QUE COMBLÉES — `P-26` :
 * `#reprendre-titre` et son bloc, parce que le produit n'a AUCUN chemin pour lire le
 * titre d'une page distante ; et les quatre boutons de l'enveloppe « boîte de
 * dialogue », que `vecteurDeV23()` ne rend jamais — elle pose `env: 'page'` pour les
 * deux routes.
 */

export type Debranchement = () => void;

export interface OptionsDuFormulaireDeSignet {
	readonly retour: string;
}

export function cablerLAnnulationDuSignet(
	racine: HTMLElement,
	options: OptionsDuFormulaireDeSignet
): Debranchement {
	const document = racine.ownerDocument;
	const bouton = racine.querySelector<HTMLButtonElement>('#annuler-page');
	if (bouton === null) return () => {};

	bouton.type = 'button';
	const auClic = (evenement: Event): void => {
		evenement.preventDefault();
		document.location.assign(options.retour);
	};
	bouton.addEventListener('click', auClic);
	return () => {
		bouton.removeEventListener('click', auClic);
	};
}
