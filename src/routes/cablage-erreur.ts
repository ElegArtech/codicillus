/**
 * LE CÂBLAGE DE LA PAGE D'ADRESSE NON RÉSOLUE — V-04 en anonyme, V-26 en session.
 *
 * `ARB-063` : le comportement s'accroche depuis la route, jamais dans la vue.
 *
 * POURQUOI CE FICHIER EXISTE À PART. `+error.svelte` monte DEUX vues selon la
 * session, et n'appartenait donc à aucun lot de la campagne — L2 possédait V-04,
 * L5 possédait V-26, et les deux ont buté sur le même point de montage. Les deux
 * vues portent les mêmes trois gestes, aux mêmes identifiants à une exception
 * près : le champ est `#saisie` dans V-04 et `#rech` dans V-26. Un seul câblage
 * les sert donc, et cherche les deux identifiants.
 *
 * CE QUE CE FICHIER NE CÂBLE PAS, ET POURQUOI. `#sup-restaurer` et
 * `#sup-domaine` de V-26 vivent dans la branche « note supprimée ». Or
 * `casDeV26()` (`src/lib/donnees/public.ts:534`) ne rend QUE `'inexistante'` :
 * cette branche n'est rendue dans aucun document servi. Leur donner un
 * comportement serait câbler un bouton qui n'existe pas.
 */

/** Défait ce que `cablerLaPageDErreur` a posé. */
export type Debranchement = () => void;

/** L'adresse de recherche pour une requête — un seul endroit la compose. */
function adresseDeRecherche(requete: string): string {
	const nette = requete.trim();
	return nette === '' ? '/recherche' : `/recherche?q=${encodeURIComponent(nette)}`;
}

/**
 * Accroche les trois gestes de la page d'adresse non résolue.
 *
 * `racine` est le document servi ; `creationPossible` dit si le visiteur peut
 * créer une note — le bouton « Créer la note » de V-26 n'existe pas autrement.
 */
export function cablerLaPageDErreur(
	racine: ParentNode,
	options: { readonly creationPossible?: boolean } = {}
): Debranchement {
	const champ = racine.querySelector<HTMLInputElement>('#saisie, #rech');
	const effacer = racine.querySelector<HTMLButtonElement>('#effacer');
	const pistes = Array.from(racine.querySelectorAll<HTMLButtonElement>('button.piste'));
	/* Le gel ne donne PAS d'identifiant à « Créer la note » (`V-26:410`) : il se
	   désigne par ses classes. V-04 n'en porte aucun — un visiteur sans session
	   ne crée rien —, et le sélecteur ne rend alors simplement rien. */
	const creer = racine.querySelector<HTMLButtonElement>('button.si-ecriture.btn--principal');

	const defaire: Debranchement[] = [];

	/* Le champ : Entrée ouvre la recherche, Échap efface. Le gel montre un
	   `input[type=search]` sans formulaire autour : sans cette accroche, la
	   frappe de l'utilisateur ne mène nulle part. */
	if (champ !== null) {
		const surTouche = (evenement: KeyboardEvent): void => {
			if (evenement.key === 'Enter') {
				evenement.preventDefault();
				globalThis.location.assign(adresseDeRecherche(champ.value));
			} else if (evenement.key === 'Escape') {
				champ.value = '';
				if (effacer !== null) effacer.hidden = true;
			}
		};
		const surSaisie = (): void => {
			if (effacer !== null) effacer.hidden = champ.value === '';
		};
		champ.addEventListener('keydown', surTouche);
		champ.addEventListener('input', surSaisie);
		defaire.push(() => {
			champ.removeEventListener('keydown', surTouche);
			champ.removeEventListener('input', surSaisie);
		});
	}

	/* Le bouton d'effacement rend le focus : sans lui, effacer ferme la saisie. */
	if (effacer !== null && champ !== null) {
		const surClic = (): void => {
			champ.value = '';
			effacer.hidden = true;
			champ.focus();
		};
		effacer.addEventListener('click', surClic);
		defaire.push(() => {
			effacer.removeEventListener('click', surClic);
		});
	}

	/* Les pistes : chacune est une requête toute faite. Le gel les dessine en
	   `button`, pas en lien — le geste appartient donc au câblage. */
	for (const piste of pistes) {
		const surClic = (): void => {
			globalThis.location.assign(adresseDeRecherche(piste.textContent ?? ''));
		};
		piste.addEventListener('click', surClic);
		defaire.push(() => {
			piste.removeEventListener('click', surClic);
		});
	}

	/* « Créer la note « … » » — l'éditeur s'ouvre avec le titre déjà saisi. */
	if (creer !== null && options.creationPossible === true) {
		const surClic = (): void => {
			const titre = champ?.value.trim() ?? '';
			globalThis.location.assign(
				titre === '' ? '/notes/nouvelle' : `/notes/nouvelle?titre=${encodeURIComponent(titre)}`
			);
		};
		creer.addEventListener('click', surClic);
		defaire.push(() => {
			creer.removeEventListener('click', surClic);
		});
	}

	return () => {
		for (const d of defaire) d();
	};
}
