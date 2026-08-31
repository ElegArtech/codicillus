/**
 * LE CÂBLAGE DE V-11 — la page d'un domaine. `ARB-063` : le balisage de `src/vues/` ne
 * bouge pas, le comportement s'accroche depuis la route, et TOUS les gestes sont des
 * NAVIGATIONS — un domaine ne s'écrit pas depuis sa propre page.
 *
 * Segments de fraîcheur, lignes de type, indicateurs de santé et lignes de contributeur
 * ouvrent la liste des notes du domaine sur une facette que `…/notes/+page.server.ts`
 * honore. LES PASTILLES DE MODULE mènent à leur écran RÉDUIT À CE DOMAINE, par
 * `?perimetre=domaine|{nom}` — les envoyer sans périmètre montrait le corpus entier.
 *
 * LE COMPTE DE TÊTE DU PANNEAU DES CONTRIBUTEURS N'A PAS D'ADRESSE : il amène à la liste
 * qu'il compte, immédiatement dessous. LE NŒUD EST UN `span` AU GEL, et il le reste — le
 * geste est à la souris, ni tabulable ni déclenchable au clavier.
 *
 * TROIS GESTES OUVRENT LA LISTE SANS FILTRE — ET AUCUN NE RESTE INERTE. « Jamais
 * vérifiées » et « En attente de révision » se lisent sur `notes.verifie_le IS NULL` et
 * `notes.revision_demandee`, que la liste d'arrivée ne sait pas recevoir : ses six
 * facettes sont `type`, `fraicheur`, `statut`, `dossier`, `auteur`, `etiquette`. Un
 * filtre approchant mentirait, un état neutre non. LE MODULE « DOSSIERS » mène à la
 * RACINE du domaine, adressée par son seul nom.
 */
import {
	adresseDeDossier,
	adresseDesNotesDuDomaine,
	adresseDesSignetsDuDomaine
} from '$lib/rangement/adresses';

export type Debranchement = () => void;

/** Les trois valeurs de la facette `fraicheur`, lues dans la classe du segment. */
const FRAICHEUR_PAR_CLASSE: Record<string, string> = {
	'p-frais': 'Frais',
	'p-vieil': 'Vieillissant',
	'p-obs': 'Obsolète probable'
};

/**
 * LES TROIS INDICATEURS DE SANTÉ DU GEL, et la facette qui porte chacun. `null` :
 * la liste s'ouvre sans filtre, faute de facette. Un libellé absent de la table
 * n'est pas un indicateur, et ne déclenche rien.
 */
const FILTRE_PAR_INDICATEUR: Record<string, readonly [cle: string, valeur: string] | null> = {
	Brouillons: ['statut', 'Brouillon'],
	'Jamais vérifiées': null,
	'En attente de révision': null
};

/**
 * LE COMPTE DE TÊTE DU PANNEAU DES CONTRIBUTEURS, et la liste qu'il compte.
 * Les deux identifiants sont ceux du gel (`V-11`).
 */
const COMPTE_DES_CONTRIBUTEURS = 'n-contribs';
const LISTE_DES_CONTRIBUTEURS = 'contribs';

/** Les adresses sans paramètre — des chemins de route, non des formes de rangement. */
const ADRESSE_DE_LIMPORT = '/importer';
const ADRESSE_DES_EXPORTS = '/console/exports';
const ADRESSE_DE_LA_CARTOGRAPHIE = '/cartographie';
const ADRESSE_DE_LA_CARTE_MENTALE = '/carte-mentale';
const ADRESSE_DE_LA_NOUVELLE_NOTE = '/notes/nouvelle';

export interface OptionsDuDomaine {
	readonly univers: string;
	readonly domaine: string;
	/**
	 * LES DEUX IDENTIFIANTS D'ADRESSE, ET C'EST PAR EUX QUE TOUT LIEN SE COMPOSE :
	 * ils sont fixés à la création et ne suivent PAS les renommages (`RG-M12-11`),
	 * quand les slugifier faisait rendre 404 aux six sorties d'ici dès qu'on avait
	 * renommé le domaine.
	 *
	 * Les NOMS restent, et ne sont pas remplaçables : `?domaine=` de l'éditeur et
	 * `?perimetre=domaine|…` portent bien le nom, c'est ce que leurs destinataires
	 * comparent.
	 */
	readonly universIdentifiant: string;
	readonly domaineIdentifiant: string;
}

function libelle(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Le nom d'un module, SANS son compteur. Le gel imbrique `.module__n` dans
 * `.module__nom` : lire le texte entier donnerait « Notes12 », et le découper
 * serait une devinette. Le compteur est retiré sur une COPIE.
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
		new URL(
			adresseDesNotesDuDomaine(options.universIdentifiant, options.domaineIdentifiant),
			origine
		);
	const aller = (adresse: string | URL): void => {
		document.location.assign(adresse.toString());
	};

	/**
	 * L'ÉDITEUR, PRÉ-RÉGLÉ SUR CE DOMAINE. Le paramètre est posé par `searchParams`,
	 * qui l'encode : rien n'est concaténé, donc rien n'est à échapper.
	 */
	const adresseDeLaNouvelleNote = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_NOUVELLE_NOTE, origine);
		adresse.searchParams.set('domaine', options.domaine);
		return adresse;
	};

	/**
	 * UN ÉCRAN DE MODULE RÉDUIT À CE DOMAINE. `?perimetre=` porte la valeur même du
	 * sélecteur du gel — `type|nom` —, posée par `searchParams`, qui l'encode.
	 */
	const adresseAuPerimetreDuDomaine = (chemin: string): URL => {
		const adresse = new URL(chemin, origine);
		adresse.searchParams.set('perimetre', `domaine|${options.domaine}`);
		return adresse;
	};

	function adresseDuModule(nom: string): string | URL | null {
		if (nom === 'Notes') return listeDuDomaine();
		if (nom === 'Signets') {
			return new URL(
				adresseDesSignetsDuDomaine(options.universIdentifiant, options.domaineIdentifiant),
				origine
			);
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
		/* « Dossiers — rangement arborescent » : la RACINE du domaine a désormais une
		   adresse — celle qui porte son seul nom. Sans elle, le module n'en avait
		   aucune. */
		if (nom === 'Dossiers') {
			return new URL(
				adresseDeDossier(options.universIdentifiant, options.domaineIdentifiant, [options.domaine]),
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
			return;
		}

		/* 7. LE COMPTE DE TÊTE DU PANNEAU DES CONTRIBUTEURS — il amène à la liste
		      qu'il compte, sans quitter la page. Voir l'en-tête : aucune adresse
		      ne peut le filtrer, et la liste est immédiatement dessous. */
		if (cible.closest(`#${COMPTE_DES_CONTRIBUTEURS}`) !== null) {
			/* Le PANNEAU, et non la seule liste : amener la liste en tête de
			   fenêtre en pousserait le titre hors champ. Même geste qu'en V-07,
			   qui vise `#p-revisions` et non la corbeille elle-même. */
			const liste = racine.querySelector(`#${LISTE_DES_CONTRIBUTEURS}`);
			const panneau = liste?.closest('.panneau') ?? liste;
			if (panneau === null || panneau === undefined) return;
			evenement.preventDefault();
			panneau.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	racine.addEventListener('click', auClic);
	return () => {
		racine.removeEventListener('click', auClic);
	};
}
