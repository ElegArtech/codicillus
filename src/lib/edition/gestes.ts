/**
 * Les gestes d'écran des deux éditeurs — ce qui bouge sans rien écrire en base :
 * prévisualiser, reprendre la rédaction, quitter, déplier un panneau, ouvrir le menu étendu,
 * faire bouger le témoin de sauvegarde. `cablerLEditeur()` porte ce qui SOUMET ; les deux
 * familles ne se mélangent pas. `ARB-063` tient : rien n'est ajouté dans `src/vues/`.
 *
 * CINQ ATTRIBUTS DU GEL, ET AUCUN INVENTÉ — `.app[data-vue]`, `.app[data-meta]`,
 * `.app[data-reference]`, `.menu-etendu[data-ouvert]`, `#sauvegarde[data-etat]`.
 *
 * LA CONFIRMATION DE SORTIE EST NATIVE, ET C'EST UN ÉCART DÉCLARÉ : le gel porte
 * `dialog#dlg-quitter`, que les deux vues déclarent ne pas transcrire. Le FOND est tenu.
 */
import { rendreDocument, type ResolveurDeNote } from '../contenu/rendu';
import type { Document } from '../contenu/document';
import { adresseDeNote } from '../rangement/adresses';
import { PHRASE_D_OBLIGATION, PREFIXE_D_ERREUR_DE_PROPRIETE } from '../cablage/formulaires';
import type { Note } from '../../../seeds/corpus';

export type Debranchement = () => void;

/**
 * Le document de repli de l'aperçu — un paragraphe sans texte, la définition du corps
 * vide du produit. Il ne sert qu'au cas où AUCUN éditeur n'a pu être monté : le
 * format refuse un document sans contenu, et rendre `null` ferait lever au clic. La
 * fabrique n'est pas importée de `semence.ts`, qui tirerait tout le jeu de semence
 * dans le paquet du navigateur pour deux nœuds.
 */
export const DOCUMENT_VIDE: Document = { type: 'doc', content: [{ type: 'paragraph' }] };

/**
 * Les cinq positions du témoin de sauvegarde. La même énumération que la propriété de
 * `BarreDEtat.svelte`, écrite ici plutôt qu'importée : `tsc --noEmit` ne lit pas les
 * composants, et un type importé d'un `.svelte` ferait sortir `pnpm check` en erreur.
 */
export type EtatDuTemoin = 'vierge' | 'modifie' | 'encours' | 'enregistre' | 'erreur';

/**
 * LE RAPPEL DE SORTIE — la phrase du dialogue gelé, reprise plutôt que
 * reformulée (`mockups/V-17-editeur.html`, `dialog#dlg-quitter`).
 */
export const RAPPEL_DE_SORTIE =
	'Quitter sans enregistrer ?\n\nLes modifications non enregistrées seront perdues.';

/**
 * L'adresse de l'éditeur de la Référence d'une note. `$lib/rangement/adresses.ts` est
 * fermé en écriture pour cette campagne et ne la porte pas : elle est bâtie ici SUR
 * `adresseDeNote()` que l'appelant passe, jamais sur un gabarit d'URL réécrit.
 */
export function adresseDeModificationDeNote(adresseDeLaNote: string): string {
	return adresseDeLaNote + '/modifier';
}

/**
 * Le résolveur des liens internes de l'aperçu, adossé au corpus DÉJÀ SERVI. L'aperçu rend le
 * document que l'éditeur tient à l'instant du clic, il ne peut donc pas venir du serveur ; le
 * résolveur n'a besoin que de `data.notes`, le corpus LISIBLE PAR L'APPELANT. Une cible
 * inconnue rend `null`, donc `a.lien-casse` sans `href` — un aperçu qui masquerait un lien
 * cassé mentirait sur ce qui sera publié.
 */
export function resolveurDuCorpusServi(notes: readonly Note[]): ResolveurDeNote {
	const parIdentifiant = new Map(notes.map((n) => [String(n.id), n]));
	return (identifiant: string) => {
		const cible = parIdentifiant.get(identifiant);
		if (cible === undefined) return null;
		return {
			id: String(cible.id),
			titre: cible.titre,
			adresse: adresseDeNote(String(cible.id)),
			publique: cible.visibilite === 'Publique'
		};
	};
}

/**
 * Les libellés du témoin, repris mot pour mot du gel. `enregistre` n'y figure pas, et
 * c'est délibéré : son libellé porte un suffixe calculé — « dernière version il y a N
 * jours » — que la VUE rend depuis la base. Le recomposer côté client fabriquerait
 * une ancienneté que personne n'a mesurée.
 */
const LIBELLES_DU_TEMOIN: Readonly<Partial<Record<EtatDuTemoin, string>>> = {
	vierge: 'Aucune modification',
	modifie: 'Modifications non enregistrées',
	encours: 'Enregistrement…',
	erreur: "Échec de l'enregistrement"
};

export function poserLeTemoin(racine: ParentNode, etat: EtatDuTemoin): void {
	const temoin = racine.querySelector<HTMLElement>('#sauvegarde');
	if (temoin === null) return;
	temoin.dataset['etat'] = etat;
	const libelle = LIBELLES_DU_TEMOIN[etat];
	const texte = racine.querySelector<HTMLElement>('#sauvegarde-txt');
	if (libelle !== undefined && texte !== null) texte.textContent = libelle;
}

export interface OptionsDesGestes {
	document: () => Document;
	resoudre: ResolveurDeNote;
	/** Où « Annuler » ramène. Absent, le bouton ramène à l'accueil. */
	retour?: string;
}

export interface GestesCables {
	defaire: Debranchement;
	/**
	 * À brancher sur `surChangement` de l'éditeur. L'éditeur est monté AVANT ce
	 * câblage — il tient la zone du gel, que le câblage interroge —, il ne peut donc
	 * pas s'y référer à sa construction. La route fait le nœud.
	 */
	signalerUneModification(): void;
}

/**
 * LE CÂBLAGE DES GESTES D'ÉCRAN — appelé depuis `onMount` d'une route, après
 * `monterLEditeur()` et `cablerLEditeur()`, jamais ailleurs.
 */
export function cablerLesGestesDEdition(
	formulaire: HTMLFormElement,
	options: OptionsDesGestes
): GestesCables {
	const document = formulaire.ownerDocument;
	const fenetre = document.defaultView;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};
	const noeud = <T extends Element>(selecteur: string): T | null =>
		formulaire.querySelector<T>(selecteur);

	const app = noeud<HTMLElement>('.app');
	let modifie = false;

	/* 1. PRÉVISUALISER — le document courant, rendu par l'implémentation UNIQUE
	      (`ADR-004`), puis `data-vue="apercu"`. Le rendu est celui du serveur, donc
	      l'aperçu ne peut pas mentir sur ce que la lecture montrera. */
	const previsualiser = noeud<HTMLButtonElement>('#previsualiser');
	const apercu = noeud<HTMLElement>('#apercu');
	if (previsualiser !== null && app !== null && apercu !== null) {
		previsualiser.type = 'button';
		ecouter(previsualiser, 'click', () => {
			apercu.innerHTML = rendreDocument(options.document(), {
				resoudre: options.resoudre,
				contexte: 'interne'
			});
			app.dataset['vue'] = 'apercu';
		});
	}

	/* 2. REPRENDRE LA RÉDACTION — le chemin inverse, et rien d'autre. */
	const quitterLApercu = noeud<HTMLButtonElement>('#quitter-apercu');
	if (quitterLApercu !== null && app !== null) {
		quitterLApercu.type = 'button';
		ecouter(quitterLApercu, 'click', () => {
			app.dataset['vue'] = 'redaction';
		});
	}

	/* 3. LE PANNEAU DE DROITE SOUS 980 px — `data-meta`, deux positions. Le
	      bouton garde son libellé, qui ne change pas d'un état à l'autre au gel. */
	const ouvrirMeta = noeud<HTMLButtonElement>('#ouvrir-meta');
	if (ouvrirMeta !== null && app !== null) {
		ouvrirMeta.type = 'button';
		ecouter(ouvrirMeta, 'click', () => {
			const ouvert = app.dataset['meta'] === 'ouvert';
			app.dataset['meta'] = ouvert ? 'ferme' : 'ouvert';
			ouvrirMeta.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
		});
	}

	/* 4. LE MENU ÉTENDU — sa liste est masquée tant que `data-ouvert` n'est pas posé.
	      Sans ce geste, les blocs d'alerte, le diagramme et le lien interne étaient
	      DESSINÉS et hors d'atteinte du pointeur. */
	const menu = noeud<HTMLElement>('#menu-etendu');
	const ouvrirEtendu = noeud<HTMLButtonElement>('#ouvrir-etendu');
	if (menu !== null && ouvrirEtendu !== null) {
		ouvrirEtendu.type = 'button';
		const fermer = (): void => {
			menu.dataset['ouvert'] = 'non';
			ouvrirEtendu.setAttribute('aria-expanded', 'false');
		};
		ecouter(ouvrirEtendu, 'click', (evenement) => {
			evenement.stopPropagation();
			const ouvert = menu.dataset['ouvert'] === 'oui';
			menu.dataset['ouvert'] = ouvert ? 'non' : 'oui';
			ouvrirEtendu.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
		});
		/* Un choix referme, et un clic au-dehors aussi. La fermeture est posée en
		   `click` REMONTANT : elle survient APRÈS que la délégation de
		   `monterLEditeur()` a joué la commande du bouton choisi. */
		ecouter(menu, 'click', (evenement) => {
			if ((evenement.target as Element | null)?.closest('.menu-etendu__liste') === null) return;
			fermer();
		});
		ecouter(document, 'click', (evenement) => {
			if ((evenement.target as Element | null)?.closest('#menu-etendu') !== null) return;
			fermer();
		});
		ecouter(document, 'keydown', (evenement) => {
			if ((evenement as KeyboardEvent).key === 'Escape') fermer();
		});
	}

	/* 5. LE TÉMOIN passe à « Enregistrement… » à la soumission. Le passage à
	      « Modifications non enregistrées » vient de l'éditeur. */
	ecouter(formulaire, 'submit', () => poserLeTemoin(formulaire, 'encours'));

	/* 6. ANNULER — on quitte vers une ADRESSE DU PRODUIT, et on prévient si quelque
	      chose serait perdu. Jamais `history.back()` : quand l'éditeur est la première
	      page de l'onglet, l'historique est vide et le bouton jetait l'utilisateur hors
	      de l'application. À défaut de retour nommé, c'est l'accueil. */
	const annuler = noeud<HTMLButtonElement>('#annuler');
	if (annuler !== null) {
		annuler.type = 'button';
		ecouter(annuler, 'click', () => {
			if (modifie && fenetre?.confirm(RAPPEL_DE_SORTIE) !== true) return;
			document.location.assign(options.retour ?? '/');
		});
	}

	return {
		defaire: () => {
			for (const defaire of jetables) defaire();
		},
		signalerUneModification: () => {
			modifie = true;
			poserLeTemoin(formulaire, 'modifie');
		}
	};
}

/** Ce qu'une action d'édition rend quand elle REFUSE — `creation.ts:209-233`. */
export interface RefusDEnregistrement {
	readonly motif?: string;
	readonly manquements?: readonly string[];
	/**
	 * Les CLÉS des propriétés de fiche qui manquent, jamais leurs noms :
	 * `manquements` porte les NOMS pour la phrase, celles-ci les CLÉS pour le foyer.
	 * Deux propriétés peuvent porter le même nom d'affichage, seule la clé désigne un
	 * champ.
	 */
	readonly proprietesManquantes?: readonly string[];
}

/**
 * Le motif du refus d'une propriété obligatoire — une seule écriture. Le motif voyage
 * du serveur à l'écran par la charge de `fail()` : c'est un mot de protocole, et un
 * motif que le serveur émet et que l'écran n'attend pas ne se voit à aucun contrôle,
 * seulement à l'usage.
 */
export const MOTIF_DE_PROPRIETE_OBLIGATOIRE = 'propriété obligatoire manquante';

/**
 * Le motif du refus, rattaché au champ qui l'a causé. Les deux seuls motifs FIXES que
 * l'utilisateur peut corriger sur place ont leur bloc au gel ; les autres — type, domaine,
 * visibilité, statut — désignent des `select` toujours renseignés.
 *
 * LE TROISIÈME MOTIF CORRIGEABLE N'A PAS SA PLACE DANS CETTE TABLE : les propriétés d'une
 * fiche sont ADMINISTRABLES, leurs clés ne sont connues qu'à l'exécution.
 */
const CHAMP_DU_MOTIF: Readonly<Record<string, string>> = {
	'titre manquant': 'erreur-titre',
	'dossier manquant': 'erreur-dossier'
};

/** La phrase montrée, par motif. Celles du gel quand le gel en porte une. */
const PHRASE_DU_MOTIF: Readonly<Record<string, string>> = {
	/* LA PHRASE EST CELLE QUE LE BLOC PORTE DÉJÀ, écrite une seule fois : le bloc naît
	   garni par `rendreLesProprietesDeFiche()`, cette table sert au témoin. */
	[MOTIF_DE_PROPRIETE_OBLIGATOIRE]: PHRASE_D_OBLIGATION,
	'titre manquant': 'Une note sans titre est introuvable. Donnez-lui-en un, même approximatif.',
	'dossier manquant': 'Choisissez le dossier qui recevra la note.',
	'type manquant': 'Le type de la note n’a pas été transmis.',
	'domaine manquant': 'Le domaine de la note n’a pas été transmis.',
	'corps illisible': 'Le corps de la note n’a pas pu être lu. Rien n’a été enregistré.',
	'document refusé': 'Le corps de la note comporte des constructions refusées.',
	'markdown refusé': 'Le Markdown soumis n’a pas pu être analysé.'
};

/**
 * Peint le refus, ou l'efface. Créer une note sans choisir de dossier renvoyait
 * `400 { motif: 'dossier manquant' }` et l'écran ne disait RIEN — aucun des deux écrans
 * d'écriture ne lisait son `form`. Les blocs existaient depuis le gel ; ce n'est pas
 * l'affichage qui manquait, c'est le fil entre les deux.
 */
export function peindreLeRefusDEdition(
	racine: ParentNode,
	refus: RefusDEnregistrement | null
): void {
	/* On efface toujours d'abord : un refus corrigé ne doit pas laisser sa trace
	   sur le champ voisin. */
	for (const id of Object.values(CHAMP_DU_MOTIF)) {
		const bloc = racine.querySelector<HTMLElement>(`#${id}`);
		if (bloc !== null) bloc.hidden = true;
	}
	/* LES BLOCS DES PROPRIÉTÉS NE SONT PAS DANS LA TABLE, et ils ne peuvent pas y
	   être : le référentiel est administrable, leurs identifiants naissent avec les
	   champs. On les efface par la classe du gel. */
	for (const bloc of racine.querySelectorAll<HTMLElement>('#proprietes .champ__erreur')) {
		bloc.hidden = true;
	}
	for (const champ of racine.querySelectorAll<HTMLElement>('#proprietes .champ')) {
		delete champ.dataset['etat'];
	}
	const motif = refus?.motif;
	if (motif === undefined) return;

	/* LE REFUS D'UNE PROPRIÉTÉ SE PEINT SUR CHAQUE PROPRIÉTÉ NOMMÉE, pas sur un bloc
	   unique en haut de page : le signalement est demandé « à l'endroit du champ ». */
	for (const cle of refus?.proprietesManquantes ?? []) {
		const bloc = racine.querySelector<HTMLElement>(`#${PREFIXE_D_ERREUR_DE_PROPRIETE}${cle}`);
		if (bloc === null) continue;
		bloc.hidden = false;
		const champ = bloc.closest<HTMLElement>('.champ');
		if (champ !== null) champ.dataset['etat'] = 'erreur';
	}
	const phrase = PHRASE_DU_MOTIF[motif] ?? motif;
	const manquements = refus?.manquements ?? [];
	const idBloc = CHAMP_DU_MOTIF[motif];

	if (idBloc !== undefined) {
		const bloc = racine.querySelector<HTMLElement>(`#${idBloc}`);
		if (bloc !== null) {
			/* Le gel écrit son texte en clair dans le bloc ; on ne remplace que le
			   texte, jamais le pictogramme qui le précède. */
			const texte = bloc.querySelector<HTMLElement>('span') ?? bloc;
			if (texte !== bloc || texte.childElementCount === 0) texte.textContent = phrase;
			bloc.hidden = false;
			bloc.scrollIntoView({ block: 'center' });
		}
	}

	/* Le témoin dit toujours qu'il y a eu refus, y compris quand le motif a son bloc :
	   la barre d'état est le seul point que le rédacteur regarde après « Enregistrer ». */
	poserLeTemoin(racine, 'erreur');
	const texteDuTemoin = racine.querySelector<HTMLElement>('#sauvegarde-txt');
	if (texteDuTemoin !== null) {
		texteDuTemoin.textContent =
			manquements.length > 0 ? `${phrase} (${manquements[0] ?? ''})` : phrase;
	}
}
