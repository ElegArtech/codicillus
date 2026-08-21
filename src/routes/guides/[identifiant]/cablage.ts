/**
 * LE CÂBLAGE DE V-03 — les quatre gestes de la lecture publique d'un guide.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS LA VUE
 *
 * `ARB-063` : les vues de `src/vues/` sont des transcriptions du gel, sans
 * gestionnaire posé dans le balisage ; le comportement vit dans la route et
 * s'accroche par identifiant et par sélecteur. Le précédent copié est
 * `src/routes/notes/[identifiant]/operationnel/cablage.ts`, et le contrat de
 * retour est le même : un câblage rend de quoi le défaire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES QUATRE GESTES, ET LEUR SOURCE
 *
 * 1. LE SOMMAIRE REPLIÉ SUR PETIT ÉCRAN — `mockups/V-03-lecture-publique.html`,
 *    « Sommaire replié sur petit écran » : la bascule retourne `data-ouvert` du
 *    `nav.sommaire` porteur et recopie l'état dans `aria-expanded`. Le port est
 *    littéral, attribut pour attribut.
 *
 * 2. LA BASCULE DE REGISTRE — même source, « Bascule de registre ». Le gel pose
 *    `data-registre` sur la racine, met à jour `aria-selected` des deux onglets,
 *    masque l'un des deux corps, REFLÈTE LE REGISTRE DANS L'ADRESSE — « le lien
 *    est partageable tel quel » — et remonte en tête.
 *
 *    L'ADRESSE EST AUSSI LUE AU MONTAGE, et c'est ce qui rend l'affirmation du
 *    gel vraie : un lien portant `?registre=operationnel` ouvre le registre
 *    Opérationnel. Le gel, qui n'a pas de serveur, écrivait l'adresse sans
 *    jamais la relire ; la partageabilité y était annoncée et non tenue.
 *
 *    LE REGISTRE VOYAGE EN PARAMÈTRE DE REQUÊTE, JAMAIS EN SEGMENT DE CHEMIN :
 *    `/guides/{identifiant}` est l'adresse canonique du guide, et un registre
 *    n'est pas un niveau de rangement.
 *
 * 3. L'AGRANDISSEMENT DU SCHÉMA — `.figure__cadre`. Le gel ouvre
 *    `dialog.loupe` ; `src/vues/V-03.svelte` ne transcrit pas ce dialogue, et
 *    son en-tête le déclare. Le geste est donc porté PAR LE NAVIGATEUR : la
 *    figure est ouverte dans un nouvel onglet quand elle porte une image, et
 *    reste sans effet sinon. Voir `agrandirLaFigure()`.
 *
 * 4. L'IMPRESSION — `window.print()`, que le gel écrit en attribut de balisage
 *    (`onclick="window.print()"`). Svelte ne sait pas émettre cet attribut
 *    littéral, et la vue le perd : il est rendu ici.
 */

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que le voisin. */
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
 *
 * La fonction est SÉPARÉE du câblage pour que le montage et le clic empruntent
 * exactement le même chemin : deux écritures auraient divergé au premier
 * changement.
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
 * source de données et l'ouvrir dans un onglet le rend à sa taille propre,
 * ce qui est l'effet demandé par le libellé du bouton — « Agrandir le schéma ».
 * Rien n'est dessiné ni redessiné : c'est le même nœud, servi tel quel.
 *
 * L'ouverture peut être refusée par le navigateur ; le geste est alors sans
 * effet, comme il l'était avant ce câblage. Il n'y a rien à rattraper.
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
