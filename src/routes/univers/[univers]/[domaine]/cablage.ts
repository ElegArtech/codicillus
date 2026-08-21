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
 * LES QUATRE FAMILLES DE GESTES, ET CE QUE CHACUNE VISE
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
 * 3. LES QUATRE INDICATEURS DE SANTÉ. Un seul a une liste qui sache le
 *    recevoir — voir ci-dessous.
 *
 * 4. LES PASTILLES DE MODULE. Chaque module actif mène à son écran.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS GESTES SONT DÉCLARÉS PLUTÔT QUE COMBLÉS — `P-26`
 *
 * · « JAMAIS VÉRIFIÉES » et « EN ATTENTE DE RÉVISION ». Aucune liste du produit
 *   ne sait recevoir ces deux demandes : les six facettes de V-12 sont `type`,
 *   `fraicheur`, `statut`, `dossier`, `auteur`, `etiquette` (`V-12:205`), les
 *   sept de `/recherche` y ajoutent `univers`, `domaine` et `visibilite`
 *   (`recherche/+page.server.ts:139`), et « jamais vérifiée » comme « révision
 *   demandée » n'en sont aucune. Les envoyer vers la liste NON filtrée serait
 *   mentir sur ce qu'on montre ; leur inventer une facette demanderait de
 *   toucher V-12 et son chargeur, hors du motif de câblage. Les deux restent
 *   donc sans destination, et le rapport de lot le dit.
 *
 * · LE MODULE « DOSSIERS ». Le rangement d'un domaine n'a PAS d'adresse :
 *   `docs/routes.md` §3.3 ne déclare que `/univers/{u}/{d}/dossiers/{chemin…}`,
 *   et un `{chemin…}` vide ne désigne aucun dossier — mesuré, `404`. Le dossier
 *   racine porte le nom du domaine et n'apparaît dans aucun chemin affiché,
 *   c'est le choix du produit. Ouvrir un sous-dossier arbitraire à la place
 *   serait désigner un dossier que l'utilisateur n'a pas demandé.
 */
import { adresseDesNotesDuDomaine, adresseDesSignetsDuDomaine } from '$lib/rangement/adresses';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que ses voisins. */
export type Debranchement = () => void;

/** Les trois valeurs de la facette `fraicheur`, lues dans la classe du segment. */
const FRAICHEUR_PAR_CLASSE: Record<string, string> = {
	'p-frais': 'Frais',
	'p-vieil': 'Vieillissant',
	'p-obs': 'Obsolète probable'
};

/** La valeur de la facette `statut` que le gel nomme « Brouillons ». */
const STATUT_BROUILLON = 'Brouillon';

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

	/** L'écran d'un module actif, ou rien quand le produit n'en a pas. */
	function adresseDuModule(nom: string): string | URL | null {
		if (nom === 'Notes') return listeDuDomaine();
		if (nom === 'Signets') {
			return new URL(adresseDesSignetsDuDomaine(options.univers, options.domaine), origine);
		}
		if (nom === 'Cartographie') return ADRESSE_DE_LA_CARTOGRAPHIE;
		if (nom === 'Carte mentale') return ADRESSE_DE_LA_CARTE_MENTALE;
		/* « Fiches — objets typés et leurs relations » : ce sont les notes de type
		   `Fiche` du domaine, et la facette `type` de la liste les nomme ainsi. */
		if (nom === 'Fiches') {
			const adresse = listeDuDomaine();
			adresse.searchParams.set('type', 'Fiche');
			return adresse;
		}
		/* « Dossiers » — pas d'adresse, et c'est voulu. Voir l'en-tête. */
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

		/* 3. LES INDICATEURS DE SANTÉ — un seul a sa liste. Voir l'en-tête. */
		const indicateur = cible.closest('.mesure__lien');
		if (indicateur !== null) {
			if (libelle(indicateur.querySelector('.mesure__nom')) !== 'Brouillons') return;
			const adresse = listeDuDomaine();
			adresse.searchParams.set('statut', STATUT_BROUILLON);
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
		}
	};

	racine.addEventListener('click', auClic);
	return () => {
		racine.removeEventListener('click', auClic);
	};
}
