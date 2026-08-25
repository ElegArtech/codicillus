/**
 * LE CÂBLAGE DE V-11 — la page d'un domaine.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS LA VUE
 *
 * `ARB-063` : le balisage de `src/vues/` ne bouge pas, le comportement
 * s'accroche depuis la route, par identifiant et par sélecteur. Même forme que
 * `src/routes/univers/{univers}/cablage.ts`, et pour la même raison : TOUS les
 * gestes de cet écran sont des NAVIGATIONS. Un domaine ne s'écrit pas depuis sa
 * propre page — il s'écrit en console —, et aucune action serveur n'existe ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES CINQ FAMILLES DE GESTES, ET CE QUE CHACUNE VISE
 *
 * 1. LES TROIS ACTIONS DE COUVERTURE et leurs jumelles de l'état vide. Le gel
 *    pose la même action à deux endroits — `#a-creer` en couverture, `#v-creer`
 *    dans l'amorce du domaine vide —, exactement comme V-18 double
 *    `#a-resync` : un seul chemin, deux déclencheurs.
 *
 * 2. LES SEGMENTS DE LA BARRE DE FRAÎCHEUR et les LIGNES DE TYPE. Les deux
 *    ouvrent la liste des notes du domaine, déjà filtrée : `?fraicheur=…` pour
 *    l'une, `?type=…` pour l'autre. Les deux clés sont des facettes que
 *    `…/notes/+page.server.ts` honore, et les valeurs sont celles que V-12
 *    déclare — un seul vocabulaire de facette pour les deux écrans.
 *
 * 3. LES QUATRE INDICATEURS DE SANTÉ. Chacun ouvre la liste du domaine — sur la
 *    facette qui le nomme quand la liste en a une (`FILTRE_PAR_INDICATEUR`),
 *    sans filtre sinon ; voir ci-dessous.
 *
 * 4. LES PASTILLES DE MODULE. Chaque module actif mène à son écran, RÉDUIT À CE
 *    DOMAINE. Les deux cartographies se réduisent par `?perimetre=domaine|{nom}`
 *    — la forme même du sélecteur du gel, que les deux chargeurs lisent déjà
 *    (`perimetreDeLAdresse()` pour V-19/V-20, `perimetreDemande` pour V-21). Les
 *    envoyer sans périmètre montrait le corpus entier depuis la page d'un
 *    domaine : le libellé promet « Cartographie — Infrastructure », l'écran
 *    rendait tout Production.
 *
 * 5. LES LIGNES DE CONTRIBUTEUR. Chacune ouvre la liste du domaine sur la
 *    facette `auteur`, qui existe et est honorée (`V-12.svelte`, table
 *    `FACETTES` ; `…/notes/+page.server.ts`, `CLES_DE_FACETTE`). Le panneau
 *    comptait les notes de chacun sans qu'aucun clic n'y mène ; le compte de
 *    TÊTE du panneau, lui, reste inerte — il compte des contributeurs, et
 *    `auteur` prend un NOM, pas un nombre. Aucune cible exacte n'existe pour
 *    lui, et la liste qu'il compte est immédiatement dessous.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS GESTES OUVRENT LA LISTE SANS FILTRE — ET AUCUN NE RESTE INERTE
 *
 * Un bouton dessiné est un geste promis : ne rien faire au clic est un défaut.
 * Trois d'entre eux n'ont pas d'arrivée EXACTE dans le produit ; ils ouvrent
 * alors la liste du domaine, qui est l'écran dont ils comptent les notes, et
 * n'y posent AUCUNE facette — un filtre approchant mentirait sur ce qu'on
 * montre, un état neutre non.
 *
 * · « JAMAIS VÉRIFIÉES » et « EN ATTENTE DE RÉVISION » se lisent sur
 *   `notes.verifie_le IS NULL` et `notes.revision_demandee` ; la liste
 *   d'arrivée ne sait recevoir que six facettes — `type`, `fraicheur`,
 *   `statut`, `dossier`, `auteur`, `etiquette` —, et aucune ne les dit. Le jour
 *   où une septième est déclarée (`V-12.svelte` et `notes/+page.server.ts`),
 *   une entrée de `FILTRE_PAR_INDICATEUR` suffit ici.
 *
 * · LE MODULE « DOSSIERS » mène à la RACINE du domaine. Elle n'avait aucune
 *   adresse — `resoudreLeChemin()` descend depuis elle sans la consommer —, et
 *   le premier dossier d'un domaine était donc incréable. Elle s'adresse
 *   maintenant par son seul nom.
 */
import {
	adresseDeDossier,
	adresseDesNotesDuDomaine,
	adresseDesSignetsDuDomaine
} from '$lib/rangement/adresses';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que ses voisins. */
export type Debranchement = () => void;

/** Les trois valeurs de la facette `fraicheur`, lues dans la classe du segment. */
const FRAICHEUR_PAR_CLASSE: Record<string, string> = {
	'p-frais': 'Frais',
	'p-vieil': 'Vieillissant',
	'p-obs': 'Obsolète probable'
};

/**
 * LES TROIS INDICATEURS DE SANTÉ DU GEL, et la facette qui porte chacun — la
 * clé et la valeur que `…/notes/+page.server.ts` sait appliquer. `null` : la
 * liste s'ouvre sans filtre, faute de facette (voir l'en-tête). Un libellé
 * absent de la table n'est pas un indicateur, et ne déclenche rien.
 */
const FILTRE_PAR_INDICATEUR: Record<string, readonly [cle: string, valeur: string] | null> = {
	Brouillons: ['statut', 'Brouillon'],
	'Jamais vérifiées': null,
	'En attente de révision': null
};

/** Les adresses sans paramètre — des chemins de route, non des formes de rangement. */
const ADRESSE_DE_LIMPORT = '/importer';
const ADRESSE_DES_EXPORTS = '/console/exports';
const ADRESSE_DE_LA_CARTOGRAPHIE = '/cartographie';
const ADRESSE_DE_LA_CARTE_MENTALE = '/carte-mentale';
const ADRESSE_DE_LA_NOUVELLE_NOTE = '/notes/nouvelle';

export interface OptionsDuDomaine {
	/** Le NOM de l'univers du domaine rendu. */
	readonly univers: string;
	/** Le NOM du domaine rendu — celui que le vecteur porte sous `dom`. */
	readonly domaine: string;
}

/** Le libellé d'un nœud, blancs réduits. */
function libelle(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Le nom d'un module, SANS son compteur. Le gel imbrique `.module__n` dans
 * `.module__nom` (`V-11:576`) : lire le texte entier donnerait « Notes12 », et
 * le découper serait une devinette. Le compteur est retiré sur une COPIE, pour
 * ne rien retrancher au document rendu.
 */
function nomDuModule(bouton: Element): string {
	const nom = bouton.querySelector('.module__nom');
	if (nom === null) return '';
	const copie = nom.cloneNode(true) as Element;
	copie.querySelector('.module__n')?.remove();
	return libelle(copie);
}

/**
 * Câble les gestes de V-11. Appelé depuis `onMount` de la route, et jamais
 * ailleurs — le banc rend les composants, pas les routes.
 */
export function cablerLeDomaine(racine: HTMLElement, options: OptionsDuDomaine): Debranchement {
	const document = racine.ownerDocument;
	const fenetre = document.defaultView;
	if (fenetre === null) return () => {};

	for (const bouton of Array.from(racine.querySelectorAll('button'))) {
		if (!bouton.hasAttribute('type')) bouton.type = 'button';
	}

	const origine = document.location.origin;
	const listeDuDomaine = (): URL =>
		new URL(adresseDesNotesDuDomaine(options.univers, options.domaine), origine);
	const aller = (adresse: string | URL): void => {
		document.location.assign(adresse.toString());
	};

	/**
	 * L'ÉDITEUR, PRÉ-RÉGLÉ SUR CE DOMAINE. Le paramètre est posé par
	 * `searchParams`, qui l'encode : rien n'est concaténé, donc rien n'est à
	 * échapper — la forme d'`ARB-038` appliquée à une adresse. `notes/nouvelle`
	 * lit `domaine` et le porte à la vue (`notes/nouvelle/+page.svelte:52`).
	 */
	const adresseDeLaNouvelleNote = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_NOUVELLE_NOTE, origine);
		adresse.searchParams.set('domaine', options.domaine);
		return adresse;
	};

	/**
	 * UN ÉCRAN DE MODULE RÉDUIT À CE DOMAINE. `?perimetre=` porte la valeur même
	 * du sélecteur du gel — `type|nom` —, posée par `searchParams`, qui l'encode.
	 */
	const adresseAuPerimetreDuDomaine = (chemin: string): URL => {
		const adresse = new URL(chemin, origine);
		adresse.searchParams.set('perimetre', `domaine|${options.domaine}`);
		return adresse;
	};

	/** L'écran d'un module actif, ou rien quand le produit n'en a pas. */
	function adresseDuModule(nom: string): string | URL | null {
		if (nom === 'Notes') return listeDuDomaine();
		if (nom === 'Signets') {
			return new URL(adresseDesSignetsDuDomaine(options.univers, options.domaine), origine);
		}
		if (nom === 'Cartographie') return adresseAuPerimetreDuDomaine(ADRESSE_DE_LA_CARTOGRAPHIE);
		if (nom === 'Carte mentale') return adresseAuPerimetreDuDomaine(ADRESSE_DE_LA_CARTE_MENTALE);
		/* « Fiches — objets typés et leurs relations » : ce sont les notes de type
		   `Fiche` du domaine, et la facette `type` de la liste les nomme ainsi. */
		if (nom === 'Fiches') {
			const adresse = listeDuDomaine();
			adresse.searchParams.set('type', 'Fiche');
			return adresse;
		}
		/* « Dossiers — rangement arborescent » : la RACINE du domaine a désormais
		   une adresse — celle qui porte son seul nom — et c'est l'écran du
		   rangement. Sans elle, le module n'en avait aucun. */
		if (nom === 'Dossiers') {
			return new URL(
				adresseDeDossier(options.univers, options.domaine, [options.domaine]),
				origine
			);
		}
		return null;
	}

	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. LES ACTIONS DE COUVERTURE ET LEURS JUMELLES DE L'ÉTAT VIDE. */
		if (cible.closest('#a-creer') !== null || cible.closest('#v-creer') !== null) {
			evenement.preventDefault();
			aller(adresseDeLaNouvelleNote());
			return;
		}
		if (cible.closest('#a-importer') !== null || cible.closest('#v-importer') !== null) {
			evenement.preventDefault();
			aller(ADRESSE_DE_LIMPORT);
			return;
		}
		if (cible.closest('#a-exporter') !== null) {
			evenement.preventDefault();
			aller(ADRESSE_DES_EXPORTS);
			return;
		}

		/* 2. UN SEGMENT DE LA BARRE DE FRAÎCHEUR — la liste, déjà filtrée. */
		const segment = cible.closest('.repart > button');
		if (segment !== null) {
			const classe = Object.keys(FRAICHEUR_PAR_CLASSE).find((c) => segment.classList.contains(c));
			if (classe === undefined) return;
			const adresse = listeDuDomaine();
			adresse.searchParams.set('fraicheur', FRAICHEUR_PAR_CLASSE[classe] ?? '');
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 3. UN INDICATEUR DE SANTÉ — la liste du domaine, sur sa facette quand
		      elle existe, sans filtre sinon. */
		const indicateur = cible.closest('.mesure__lien');
		if (indicateur !== null) {
			const nom = libelle(indicateur.querySelector('.mesure__nom'));
			if (!(nom in FILTRE_PAR_INDICATEUR)) return;
			const filtre = FILTRE_PAR_INDICATEUR[nom];
			const adresse = listeDuDomaine();
			if (filtre) adresse.searchParams.set(filtre[0], filtre[1]);
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 4. UNE PASTILLE DE MODULE — son écran, quand le produit en a un. */
		const module = cible.closest('.module');
		if (module !== null) {
			const adresse = adresseDuModule(nomDuModule(module));
			if (adresse === null) return;
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 5. UNE LIGNE DE RÉPARTITION PAR TYPE — la liste, filtrée sur ce type. */
		const ligne = cible.closest('.type-ligne');
		if (ligne !== null) {
			const type = libelle(ligne.querySelector('.type-ligne__nom'));
			if (type === '') return;
			const adresse = listeDuDomaine();
			adresse.searchParams.set('type', type);
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 6. UNE LIGNE DE CONTRIBUTEUR — la liste, filtrée sur son nom. Le nom
		      est lu sur `.contrib__nom`, qui ne porte que lui : le compte de
		      notes vit dans `.contrib__n`, hors de ce nœud. */
		const contributeur = cible.closest('.contrib');
		if (contributeur !== null) {
			const nom = libelle(contributeur.querySelector('.contrib__nom'));
			if (nom === '') return;
			const adresse = listeDuDomaine();
			adresse.searchParams.set('auteur', nom);
			evenement.preventDefault();
			aller(adresse);
		}
	};

	racine.addEventListener('click', auClic);
	return () => {
		racine.removeEventListener('click', auClic);
	};
}
