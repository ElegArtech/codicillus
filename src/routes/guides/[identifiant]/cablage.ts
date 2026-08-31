/**
 * LE CÂBLAGE DE V-03 — les quatre gestes de la lecture publique d'un guide. `ARB-063` :
 * le comportement vit dans la route, par identifiant et par sélecteur.
 *
 * 1. LE SOMMAIRE REPLIÉ SUR PETIT ÉCRAN : la bascule retourne `data-ouvert` du
 *    `nav.sommaire` et recopie l'état dans `aria-expanded`.
 * 2. LA BASCULE DE REGISTRE : le gel pose `data-registre` sur la racine, met à jour
 *    `aria-selected`, masque l'un des deux corps et REFLÈTE LE REGISTRE DANS L'ADRESSE.
 *    L'ADRESSE EST AUSSI LUE AU MONTAGE, et c'est ce qui rend « le lien est partageable
 *    tel quel » vrai. LE REGISTRE VOYAGE EN PARAMÈTRE DE REQUÊTE, JAMAIS EN SEGMENT DE
 *    CHEMIN.
 * 3. L'AGRANDISSEMENT DU SCHÉMA : le gel ouvre `dialog.loupe`, que `src/vues/V-03.svelte`
 *    ne transcrit pas — le geste est porté PAR LE NAVIGATEUR.
 * 4. L'IMPRESSION — `window.print()`, que le gel écrit en attribut de balisage et que
 *    Svelte ne sait pas émettre littéralement.
 */

export type Debranchement = () => void;

/** Les deux registres de lecture, et rien d'autre — le vocabulaire est clos. */
const REGISTRES = ['reference', 'operationnel'] as const;
type Registre = (typeof REGISTRES)[number];

/** Le registre demandé par l'adresse, ou la Référence. Une valeur hors liste est ignorée. */
export function registreDemande(recherche: string): Registre {
	const demande = new URLSearchParams(recherche).get('registre');
	return REGISTRES.find((r) => r === demande) ?? 'reference';
}

/**
 * L'ÉTAT D'UN REGISTRE AFFICHÉ — les quatre gestes du gel, mis bout à bout.
 * SÉPARÉE du câblage pour que le montage et le clic empruntent exactement le même
 * chemin : deux écritures auraient divergé au premier changement.
 */
function afficherLeRegistre(racine: Element, registre: Registre): void {
	racine.setAttribute('data-registre', registre);
	for (const onglet of racine.querySelectorAll('#registre button')) {
		onglet.setAttribute('aria-selected', String(onglet.getAttribute('data-reg') === registre));
	}
	const reference = racine.querySelector('#corps-reference');
	const operationnel = racine.querySelector('#corps-operationnel');
	if (reference instanceof HTMLElement) reference.hidden = registre !== 'reference';
	if (operationnel instanceof HTMLElement) operationnel.hidden = registre !== 'operationnel';
}

/**
 * L'AGRANDISSEMENT D'UNE FIGURE, SANS LE DIALOGUE DU GEL.
 *
 * Le schéma est un dessin vectoriel écrit dans le document. Le sérialiser en
 * source de données et l'ouvrir dans un onglet le rend à sa taille propre, l'effet
 * que le libellé du bouton demande. Rien n'est dessiné ni redessiné.
 *
 * L'ouverture peut être refusée par le navigateur ; le geste est alors sans effet,
 * comme il l'était avant ce câblage.
 */
function agrandirLaFigure(cadre: Element): void {
	const dessin = cadre.querySelector('svg');
	if (dessin === null) return;
	const source = new XMLSerializer().serializeToString(dessin);
	const adresse = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
	cadre.ownerDocument.defaultView?.open(adresse, '_blank', 'noopener');
}

/**
 * LE CÂBLAGE DES QUATRE GESTES — appelé depuis `onMount` de la route, et
 * jamais ailleurs. `racine` est le `div.app` de la vue.
 */
export function cablerLeGuide(racine: HTMLElement): Debranchement {
	const fenetre = racine.ownerDocument.defaultView;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => {
			cible.removeEventListener(type, reaction);
		});
	};

	/* 2 bis. L'ADRESSE DÉCIDE DU REGISTRE AU MONTAGE — voir l'en-tête. */
	afficherLeRegistre(racine, registreDemande(fenetre?.location.search ?? ''));

	/* 1. Le sommaire replié sur petit écran. */
	const bascule = racine.querySelector('#bascule-sommaire');
	if (bascule !== null) {
		ecouter(bascule, 'click', () => {
			const nav = bascule.closest('.sommaire');
			if (nav === null) return;
			const ouvert = nav.getAttribute('data-ouvert') === 'oui';
			nav.setAttribute('data-ouvert', ouvert ? 'non' : 'oui');
			bascule.setAttribute('aria-expanded', String(!ouvert));
		});
	}

	/* 2. La bascule de registre, et l'adresse qui la porte. */
	for (const onglet of racine.querySelectorAll('#registre button')) {
		ecouter(onglet, 'click', () => {
			const demande = REGISTRES.find((r) => r === onglet.getAttribute('data-reg'));
			if (demande === undefined) return;
			afficherLeRegistre(racine, demande);
			if (fenetre !== null && fenetre !== undefined) {
				const adresse = new URL(fenetre.location.href);
				adresse.searchParams.set('registre', demande);
				fenetre.history.replaceState(fenetre.history.state, '', adresse);
				fenetre.scrollTo({ top: 0, behavior: 'smooth' });
			}
		});
	}

	/* 3. L'agrandissement du schéma. */
	for (const cadre of racine.querySelectorAll('.figure__cadre')) {
		ecouter(cadre, 'click', () => {
			agrandirLaFigure(cadre);
		});
	}

	/* 4. L'impression, que le gel écrit en attribut et que Svelte ne peut pas
	   émettre. Le bouton est repéré par son libellé : le gel ne lui donne ni
	   identifiant, ni classe propre. */
	const imprimer = Array.from(racine.querySelectorAll('button.btn--plein')).find((b) =>
		(b.textContent ?? '').trim().startsWith('Imprimer')
	);
	if (imprimer !== undefined) {
		ecouter(imprimer, 'click', () => {
			fenetre?.print();
		});
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
