/**
 * LE CÂBLAGE DE V-11 — la page d'un domaine, et il ne lui reste presque rien à faire.
 *
 * CE QUI A DISPARU, ET POURQUOI C'EST UN GAIN. Ce module reconnaissait les gestes de
 * l'écran À LEUR TEXTE : les six noms de module (« Notes », « Signets »,
 * « Cartographie », « Carte mentale », « Fiches », « Dossiers »), trois noms
 * d'indicateur, trois valeurs de facette. Renommer l'un d'eux rendait sa tuile INERTE
 * sans qu'aucune compilation ne proteste — le couplage le plus fragile du dépôt, pour
 * un service que le balisage rend lui-même.
 *
 * Les six entrées de « Contenu du domaine » et d'« Explorer » sont désormais des
 * ANCRES, dont l'adresse est composée par `$lib/rangement/adresses.ts` dans la vue.
 * Elles fonctionnent avant toute hydratation, s'ouvrent dans un nouvel onglet, se
 * copient, et le compilateur voit leur destination. Les trois actions du bandeau et le
 * menu ⋯ suivent le même principe — le menu est un `details`, il n'a besoin de rien.
 *
 * IL RESTE LES DEUX SÉLECTEURS. « 7 jours / 30 jours » et le genre d'événement sont
 * des ADRESSES : chaque position est un paramètre que `+page.server.ts` relit, et le
 * formulaire les porte. Sans script, le bouton « Appliquer » du formulaire les
 * applique — il est hors écran mais atteignable au clavier. Avec script, le choix part
 * au changement, ce qu'on attend d'un sélecteur.
 */

export type Debranchement = () => void;

/** Le marqueur des formulaires de sélection. Une donnée du balisage, pas un texte. */
const MARQUEUR_DE_FILTRE = '[data-filtre]';

/**
 * Câble les gestes de V-11. Appelé depuis `onMount` de la route, et jamais
 * ailleurs — le banc rend les composants, pas les routes.
 *
 * IL NE PREND PLUS NI UNIVERS NI DOMAINE. Il composait douze adresses à partir
 * des deux identifiants ; ces adresses sont maintenant dans le balisage, et le
 * seul argument qui reste est la racine où écouter.
 */
export function cablerLeDomaine(racine: HTMLElement): Debranchement {
	const auChangement = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null || cible.tagName !== 'SELECT') return;
		const formulaire = cible.closest(MARQUEUR_DE_FILTRE);
		if (!(formulaire instanceof HTMLFormElement)) return;
		/* `requestSubmit` déclenche la validation et les gestionnaires du
		   formulaire, là où `submit()` les court-circuite. */
		formulaire.requestSubmit();
	};

	racine.addEventListener('change', auChangement);
	return () => {
		racine.removeEventListener('change', auChangement);
	};
}
