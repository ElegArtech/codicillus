/**
 * LE CÂBLAGE DE V-10 — la page d'un univers. `ARB-063` : le comportement s'accroche
 * depuis la route, et les quatre gestes sont des NAVIGATIONS. AUCUNE ADRESSE N'EST ÉCRITE
 * À LA MAIN : les formes de RANGEMENT sortent de `$lib/rangement/adresses`.
 *
 * LA CARTOGRAPHIE EST RÉDUITE À CET UNIVERS : `/cartographie` nu faisait retomber le
 * périmètre sur celui de la planche de V-19. `?perimetre=` est un paramètre de REQUÊTE,
 * honoré par le chargeur (§4.3) — ce que §3.4 ne dit pas, ne portant que le CHEMIN.
 *
 * LES SEGMENTS DE FRAÎCHEUR ONT DEUX DESTINATIONS, PARCE QU'IL Y A DEUX BARRES : la liste
 * des notes du domaine dans une carte, `/recherche?univers={u}&fraicheur=…` dans la barre
 * consolidée — il N'EXISTE PAS de liste de notes à l'échelle d'un univers. LA VALEUR DE
 * FACETTE SE LIT DANS LA CLASSE DU SEGMENT, pas dans son libellé, que découper serait une
 * devinette. DEUX INDICATEURS RESTENT INERTES : `auteur` n'est pas une facette de
 * `/recherche`, et « Domaines » compte une liste immédiatement dessous.
 */
import { adressesParLesNoms, type DesignationsDeRangement } from '$lib/rangement/adresses';

export type Debranchement = () => void;

/**
 * La valeur de facette `fraicheur` portée par la classe d'un segment de barre.
 * Les trois libellés sont ceux de `FACETTES` de `V-12:207` et `V-08:350`.
 */
const FRAICHEUR_PAR_CLASSE: Record<string, string> = {
	'p-frais': 'Frais',
	'p-vieil': 'Vieillissant',
	'p-obs': 'Obsolète probable'
};

/** La recherche, seule liste que le produit ait à l'échelle d'un univers. */
const ADRESSE_DE_LA_RECHERCHE = '/recherche';
/** La valeur de la facette `statut`, telle que V-12 et V-08 la déclarent. */
const STATUT_BROUILLON = 'Brouillon';
/**
 * Le CHEMIN de la cartographie — `docs/routes.md` §3.4, sans segment dynamique.
 * Le périmètre s'y ajoute en paramètre de requête (§4.3), voir l'en-tête.
 */
const ADRESSE_DE_LA_CARTOGRAPHIE = '/cartographie';
/** La console des domaines — le seul écran qui crée un domaine. */
const ADRESSE_DE_LA_CONSOLE_DES_DOMAINES = '/console/domaines';

export interface OptionsDeLUnivers {
	readonly univers: string;
	/**
	 * LA TABLE QUI TRADUIT UN NOM EN IDENTIFIANT D'ADRESSE.
	 *
	 * Le seul lien composé ici part du NOM lu sur une carte de domaine, et il était
	 * slugifié. `domaines.identifiant` est fixé à la création et ne suit PAS les
	 * renommages (`RG-M12-11`) : un segment de barre de fraîcheur menait en 404 dès
	 * qu'on avait renommé le domaine. La table vient du gabarit racine.
	 */
	readonly designations: DesignationsDeRangement;
}

function libelle(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Câble les quatre gestes de V-10. Appelé depuis `onMount` de la route, et
 * jamais ailleurs — le banc rend les composants, pas les routes.
 */
export function cablerLUnivers(racine: HTMLElement, options: OptionsDeLUnivers): Debranchement {
	const document = racine.ownerDocument;
	const fenetre = document.defaultView;
	if (fenetre === null) return () => {};

	/* AUCUN BOUTON DU GEL NE SOUMET PAR ACCIDENT — la parade de
	   `cablerLaSuppression()`, posée ici par principe : cette page n'a pas de
	   formulaire aujourd'hui, et un `button` sans `type` en deviendrait un
	   soumetteur le jour où l'un l'entourerait. */
	for (const bouton of Array.from(racine.querySelectorAll('button'))) {
		if (!bouton.hasAttribute('type')) bouton.type = 'button';
	}

	const aller = (adresse: string): void => {
		document.location.assign(adresse);
	};

	/**
	 * LA RECHERCHE RÉDUITE À CET UNIVERS. Il n'existe pas de liste de notes à
	 * l'échelle d'un univers ; `/recherche` porte la facette `univers`. Une seule
	 * fonction la compose, pour les segments comme pour les indicateurs.
	 */
	const rechercheDeLUnivers = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_RECHERCHE, document.location.origin);
		adresse.searchParams.set('univers', options.univers);
		return adresse;
	};

	/**
	 * LA CARTOGRAPHIE RÉDUITE À CET UNIVERS. `?perimetre=` porte la valeur même du
	 * sélecteur de V-19 — `type|nom` —, posée par `searchParams`, qui l'encode.
	 */
	const cartographieDeLUnivers = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_CARTOGRAPHIE, document.location.origin);
		adresse.searchParams.set('perimetre', `univers|${options.univers}`);
		return adresse;
	};

	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. LA CARTOGRAPHIE DE L'UNIVERS — `#carto`, l'action de la couverture.
		      Réduite à cet univers : le libellé le promet, l'adresse le tient. */
		if (cible.closest('#carto') !== null) {
			evenement.preventDefault();
			aller(cartographieDeLUnivers().toString());
			return;
		}

		/* 2. CRÉER UN DOMAINE — l'action de l'univers vide (`V-10:439`). Le gel ne
		   lui donne pas d'identifiant ; elle se reconnaît à son emplacement, qui
		   n'accueille qu'elle. La création elle-même vit en console : c'est le
		   seul écran du produit qui écrive un domaine. */
		if (cible.closest('.vide-univers .btn--principal') !== null) {
			evenement.preventDefault();
			aller(ADRESSE_DE_LA_CONSOLE_DES_DOMAINES);
			return;
		}

		/* 3. UN SEGMENT DE BARRE DE FRAÎCHEUR — deux destinations, voir l'en-tête. */
		const segment = cible.closest('.repart > button');
		if (segment !== null) {
			const valeur = Object.keys(FRAICHEUR_PAR_CLASSE).find((c) => segment.classList.contains(c));
			if (valeur === undefined) return;
			const facette = FRAICHEUR_PAR_CLASSE[valeur] ?? '';
			const carte = segment.closest('.carte-dom');
			const adresse =
				carte === null
					? rechercheDeLUnivers()
					: new URL(
							adressesParLesNoms(options.designations).notes(
								options.univers,
								libelle(carte.querySelector('.carte-dom__nom'))
							),
							document.location.origin
						);
			adresse.searchParams.set('fraicheur', facette);
			evenement.preventDefault();
			aller(adresse.toString());
			return;
		}

		/* 4. LES DEUX NOMBRES DE LA MESURE « NOTES » — la recherche réduite à cet
		      univers, sur `statut` pour le sous-compte de brouillons. Les trois
		      autres mesures n'ont pas de bouton, et l'en-tête dit pourquoi. */
		const mesure = cible.closest('#m-notes, #m-brouillons');
		if (mesure !== null) {
			const adresse = rechercheDeLUnivers();
			if (mesure.id === 'm-brouillons') adresse.searchParams.set('statut', STATUT_BROUILLON);
			evenement.preventDefault();
			aller(adresse.toString());
		}
	};

	racine.addEventListener('click', auClic);
	return () => {
		racine.removeEventListener('click', auClic);
	};
}
