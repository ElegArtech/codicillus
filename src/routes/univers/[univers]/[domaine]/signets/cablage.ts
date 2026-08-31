/**
 * LE CÂBLAGE DE V-23 — ce que `cablerLeSignet()` ne couvre pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI EST DÉJÀ CÂBLÉ AILLEURS, ET QUI N'EST PAS REPRIS ICI
 *
 * `cablerLeSignet()` de `$lib/cablage/formulaires.ts` porte la méthode du
 * formulaire, le nom des cinq champs, les pastilles d'étiquette, la touche
 * Entrée, la soumission de `#valider-page`, celle de `#supprimer-page` sous
 * confirmation chiffrée, et le collage de `#coller` — lecture du presse-papiers
 * dans `#adresse`, refus affiché à l'endroit du champ. Ce module n'y touche
 * pas.
 *
 * IL RESTE UN GESTE, ET UN SEUL : « ANNULER ».
 *
 * `#annuler-page` est le seul bouton de l'enveloppe « page dédiée » que
 * `cablerLeSignet()` laisse sans destination. Annuler une saisie de signet
 * ramène à la liste des signets du domaine — l'écran d'où l'on vient dans les
 * deux modes, création comme édition. Ce n'est pas un `history.back()` : on
 * peut arriver sur `…/signets/nouveau` par un lien, et remonter l'historique
 * mènerait alors ailleurs que là où « Annuler » promet de ramener.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX FAMILLES DE GESTES SONT DÉCLARÉES PLUTÔT QUE COMBLÉES — `P-26`
 *
 * · `#reprendre-titre`, ET TOUT LE BLOC `#titre-propose`. Le gel dessine une
 *   lecture du titre de la page distante — « Lecture du titre de la page… »,
 *   puis « Titre trouvé sur la page : … », puis « Reprendre ». Le produit n'a
 *   AUCUN chemin pour lire le titre d'une page distante : aucune action serveur
 *   ne va chercher une adresse externe, et le navigateur ne le peut pas non
 *   plus — la même origine ne le permet pas. Câbler le bouton donnerait un
 *   contrôle que rien ne peut jamais déclencher, puisque `#titre-trouve` reste
 *   vide : `P-26`, mot pour mot.
 *
 * · LES QUATRE BOUTONS DE L'ENVELOPPE « BOÎTE DE DIALOGUE » — `#fermer-dlg`,
 *   `#supprimer-dlg`, `#annuler-dlg`, `#valider-dlg`. Cette enveloppe N'EST
 *   JAMAIS RENDUE par le produit : `vecteurDeV23()` pose `env: 'page'` pour les
 *   deux routes (`$lib/donnees/signets.ts`, éprouvé par son unitaire), et la
 *   vue ne monte le formulaire que dans l'enveloppe active (`V-23:486`). Les
 *   quatre boutons n'existent donc dans aucun document servi. Les câbler serait
 *   quatre contrôles inertes de plus.
 */

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que ses voisins. */
export type Debranchement = () => void;

export interface OptionsDuFormulaireDeSignet {
	/** Où « Annuler » ramène — la liste des signets du domaine. */
	readonly retour: string;
}

/** Câble « Annuler » de l'enveloppe « page dédiée » de V-23. */
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
