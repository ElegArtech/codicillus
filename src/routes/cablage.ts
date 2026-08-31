/**
 * LE CÂBLAGE DE V-01 — le champ de recherche de l'accueil public, et le rattrapage
 * de la liste en erreur. `ARB-063` : le comportement s'accroche depuis la route.
 * CE CÂBLAGE NE VAUT QUE POUR LA BRANCHE ANONYME, V-07 ayant son propre champ.
 *
 * LA RECHERCHE DE L'ACCUEIL MÈNE À `/recherche?q=…`. Le gel filtre au fil de la
 * frappe dans un corpus qu'il tient en mémoire ; le produit a un moteur, et rejouer
 * une seconde correspondance ici en serait une deuxième, alors que le chargeur de
 * `/recherche` a précisément retiré celle des vues.
 *
 * SANS CE CÂBLAGE, LE CHAMP EST INERTE : c'est le premier élément de la page, il
 * porte l'`autofocus`, et rien n'y répondait — ni la touche d'entrée, ni le bouton
 * d'effacement, dessiné donc promis. ÉCHAP EFFACE, comme au gel et comme en V-02.
 */
import { resolve } from '$app/paths';

export type Debranchement = () => void;

/**
 * L'ADRESSE DE LA RECHERCHE PUBLIQUE POUR UNE REQUÊTE. `resolve()` n'accepte pas
 * de chaîne de requête : elle est concaténée après. Une requête vide ne pose aucun
 * paramètre — `/recherche` sans paramètre réinitialise tout.
 */
export function adresseDeLaRecherche(requete: string): string {
	const terme = requete.trim();
	return terme === ''
		? resolve('/recherche')
		: `${resolve('/recherche')}?q=${encodeURIComponent(terme)}`;
}

/**
 * LE CÂBLAGE DES DEUX GESTES — appelé depuis `onMount` de la route, et
 * seulement en anonyme. `racine` est le `div.app` de la vue.
 */
export function cablerLAccueilPublic(racine: HTMLElement): Debranchement {
	const fenetre = racine.ownerDocument.defaultView;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => {
			cible.removeEventListener(type, reaction);
		});
	};

	const champ = racine.querySelector('#saisie');
	const effacer = racine.querySelector('#effacer');

	if (champ instanceof HTMLInputElement) {
		/* Le bouton d'effacement suit la saisie : la vue le rend masqué, et c'est
		   la frappe qui le montre. Le gel fait de même. */
		const suivreLaSaisie = (): void => {
			if (effacer instanceof HTMLElement) effacer.hidden = champ.value === '';
		};
		suivreLaSaisie();
		ecouter(champ, 'input', suivreLaSaisie);

		ecouter(champ, 'keydown', (evenement) => {
			if (!(evenement instanceof KeyboardEvent)) return;
			if (evenement.key === 'Enter') {
				evenement.preventDefault();
				fenetre?.location.assign(adresseDeLaRecherche(champ.value));
			} else if (evenement.key === 'Escape' && champ.value !== '') {
				champ.value = '';
				suivreLaSaisie();
			}
		});

		if (effacer !== null) {
			ecouter(effacer, 'click', () => {
				champ.value = '';
				suivreLaSaisie();
				champ.focus();
			});
		}
	}

	/* « Réessayer » — la liste des guides n'a pas répondu, on la redemande. La
	   zone en erreur est un état de la vue que le chargeur n'atteint pas
	   aujourd'hui (rien ne pose `data-guides="erreur"`) ; le bouton est câblé
	   parce qu'il est dessiné, et il rechargera la page le jour où l'état sera
	   servi. Le rechargement est le seul rattrapage juste : la liste vient du
	   chargeur, pas d'un appel que le navigateur saurait rejouer. */
	const reessayer = Array.from(racine.querySelectorAll('.zone-erreur button.btn')).find((b) =>
		(b.textContent ?? '').trim().startsWith('Réessayer')
	);
	if (reessayer !== undefined) {
		ecouter(reessayer, 'click', () => {
			fenetre?.location.reload();
		});
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
