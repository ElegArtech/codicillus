/**
 * LE CÂBLAGE DE V-10 — la page d'un univers.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS LA VUE
 *
 * `ARB-063`, repris par le motif unique de câblage : le balisage de
 * `src/vues/` ne bouge pas, le comportement s'accroche depuis la route, par
 * identifiant et par sélecteur. Ce module est le voisin de
 * `src/routes/notes/{identifiant}/operationnel/cablage.ts` et en copie la
 * forme, à ceci près qu'il n'y a RIEN À ÉCRIRE sur cette page : les quatre
 * gestes de V-10 sont des NAVIGATIONS. Aucun formulaire n'est donc posé, et
 * aucune action serveur n'est appelée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE ADRESSE N'EST ÉCRITE À LA MAIN
 *
 * Les trois formes employées sortent de `$lib/rangement/adresses` —
 * `adresseDesNotesDuDomaine()` pour la liste d'un domaine, et rien d'autre.
 * Les deux adresses fixes — `/cartographie` et `/console/domaines` — sont des
 * CHEMINS de route sans segment dynamique, que la fabrique d'adresses ne porte
 * pas et n'a pas à porter : elle porte les formes du RANGEMENT. La première
 * reçoit néanmoins un paramètre de REQUÊTE, posé par `searchParams` — voir
 * ci-dessous.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CARTOGRAPHIE EST RÉDUITE À CET UNIVERS
 *
 * Le bouton de la couverture est libellé « Cartographie de l'univers »
 * (`#carto`, dans `V-10`) et menait à `/cartographie` nu : le périmètre y retombait sur
 * celui de la planche de V-19, si bien que depuis la page de l'univers
 * « Projets » l'écran montrait « Production ». C'est le défaut que le jumeau de
 * la page d'un domaine avait déjà réparé — `adresseAuPerimetreDuDomaine()`,
 * `[domaine]/cablage.ts` —, et le raisonnement y est écrit : « le libellé promet
 * Cartographie — Infrastructure, l'écran rendait tout Production ».
 *
 * LE COMMENTAIRE QUI PORTAIT L'ERREUR DISAIT « §3.4, SANS PARAMÈTRE ». §3.4
 * déclare que le CHEMIN de la cartographie n'a pas de segment dynamique ; il ne
 * dit rien de `?perimetre=`, qui est un paramètre de REQUÊTE, honoré par le
 * chargeur et documenté à §4.3. Les deux phrases avaient été confondues.
 *
 * LA FORME `univers|{nom}` EST HONORÉE DE BOUT EN BOUT : `perimetreDeLAdresse()`
 * l'accepte au même titre que `domaine|{nom}`, le filtre du sous-graphe la
 * distingue, et le sélecteur de V-19 émet lui-même cette valeur — depuis que la
 * route de la cartographie lui passe les univers réels, il la propose donc aussi
 * pour celui-ci, et le libellé du menu s'accorde au graphe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES SEGMENTS DE FRAÎCHEUR — DEUX DESTINATIONS, PARCE QU'IL Y A DEUX BARRES
 *
 * Le même composant est rendu deux fois (`V-10:296`) : la barre CONSOLIDÉE de
 * l'univers, et la barre de chaque carte de domaine. Cliquer un segment veut
 * dire « montre-moi ces notes-là », et les deux périmètres n'ont pas la même
 * liste :
 *
 *   · dans une carte de domaine → `/univers/{u}/{d}/notes?fraicheur=…`, la
 *     liste des notes du domaine, dont `+page.server.ts` honore la facette ;
 *   · dans la barre consolidée → `/recherche?univers={u}&fraicheur=…`. Il
 *     N'EXISTE PAS de liste de notes à l'échelle d'un univers — `docs/routes.md`
 *     §3.3 n'en déclare aucune —, et `/recherche` honore les deux facettes
 *     `univers` et `fraicheur` (`recherche/+page.server.ts:139`). C'est la même
 *     demande, servie par l'écran qui sait la recevoir.
 *
 * LA VALEUR DE FACETTE SE LIT DANS LA CLASSE DU SEGMENT, pas dans son libellé :
 * le gel écrit « 12 fraîches · Infrastructure », un texte accordé et contextué
 * que découper serait une devinette. La classe, elle, est la clé du gel
 * (`PARTS` de `V-10:212`), et les trois valeurs de facette sont celles que
 * V-12 et V-08 déclarent — un seul vocabulaire pour les trois écrans.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES INDICATEURS CONSOLIDÉS — UN SEUL MÈNE QUELQUE PART, ET C'EST MESURÉ
 *
 * · « NOTES » ET SON SOUS-COMPTE DE BROUILLONS ouvrent `/recherche` réduite à
 *   cet univers, avec `&statut=Brouillon` pour le second. C'est exactement
 *   l'adresse que la barre consolidée compose déjà ci-dessus, et elle est
 *   composée par la même fonction : deux copies auraient divergé.
 *
 * · « CONTRIBUTEURS ACTIFS » RESTE INERTE, et ce n'est pas un oubli.
 *   `/recherche` honore sept facettes — `univers`, `domaine`, `type`,
 *   `statut`, `fraicheur`, `etiquette`, `visibilite` (`recherche/
 *   +page.server.ts`) — et `auteur` n'en fait pas partie. Aucune cible exacte
 *   n'existe : un filtre approchant mentirait sur ce qu'on montre.
 *
 * · « DOMAINES » RESTE INERTE lui aussi : la liste qu'il compte est
 *   immédiatement dessous, sur le même écran. Une ancre vers un contenu déjà
 *   visible ne déplace rien et ferait promettre un geste sans effet.
 */
import { adressesParLesNoms, type DesignationsDeRangement } from '$lib/rangement/adresses';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que ses voisins. */
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
	/** Le NOM de l'univers rendu — celui que le vecteur porte sous `uni`. */
	readonly univers: string;
	/**
	 * LA TABLE QUI TRADUIT UN NOM EN IDENTIFIANT D'ADRESSE.
	 *
	 * Le seul lien composé ici part du NOM lu sur une carte de domaine, et il
	 * était slugifié. `domaines.identifiant` est fixé à la création et ne suit PAS
	 * les renommages (`RG-M12-11`) : un segment de barre de fraîcheur menait donc
	 * en 404 dès qu'on avait renommé le domaine. La table vient du gabarit racine,
	 * par le contexte de coquille.
	 */
	readonly designations: DesignationsDeRangement;
}

/** Le libellé d'un nœud, blancs réduits. */
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
	 * l'échelle d'un univers (`docs/routes.md` §3.3 n'en déclare aucune) ;
	 * `/recherche` porte la facette `univers`, et c'est l'écran qui sait recevoir
	 * la demande. Une seule fonction la compose, pour les segments de la barre
	 * consolidée comme pour les indicateurs.
	 */
	const rechercheDeLUnivers = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_RECHERCHE, document.location.origin);
		adresse.searchParams.set('univers', options.univers);
		return adresse;
	};

	/**
	 * LA CARTOGRAPHIE RÉDUITE À CET UNIVERS. `?perimetre=` porte la valeur même
	 * du sélecteur de V-19 — `type|nom` —, posée par `searchParams`, qui
	 * l'encode : rien n'est concaténé, donc rien n'est à échapper. La forme du
	 * jumeau de la page d'un domaine, appliquée au niveau au-dessus.
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
