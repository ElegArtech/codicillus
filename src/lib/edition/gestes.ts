/**
 * LES GESTES D'ÉCRAN DES DEUX ÉDITEURS — ce qui bouge sans rien écrire en base.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NON DANS `$lib/cablage/formulaires.ts`
 *
 * `cablerLEditeur()` porte ce qui SOUMET — les champs cachés, les étiquettes,
 * les bascules, l'enregistrement. Ce module porte ce qui ne soumet PAS :
 * prévisualiser, reprendre la rédaction, quitter, déplier un panneau, ouvrir le
 * menu étendu, faire bouger le témoin de sauvegarde. Les deux familles ne se
 * mélangent pas, et `$lib/cablage/formulaires.ts` est fermé en écriture pour
 * cette campagne (plan de remédiation §4) : un lot qui a besoin d'une fonction
 * nouvelle l'écrit chez lui. Ce fichier est chez lui.
 *
 * `ARB-063` tient : rien n'est ajouté dans `src/vues/`. Le comportement
 * s'accroche depuis la route, par identifiant et par sélecteur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CINQ ATTRIBUTS DU GEL, ET AUCUN INVENTÉ
 *
 * Tout ce que ce module fait bouger à l'écran passe par un attribut que la
 * feuille GELÉE lit déjà, sans exception :
 *
 *   `.app[data-vue]`            `V-17.css:711-712` — rédaction ou aperçu
 *   `.app[data-meta]`           `V-17.css:745` — le panneau sous 980 px
 *   `.app[data-reference]`      `V-18.css:961-979` — les trois positions
 *   `.menu-etendu[data-ouvert]` `V-17.css:498` — la liste du menu étendu
 *   `#sauvegarde[data-etat]`    les cinq positions du témoin (`V-17:2644-2650`)
 *
 * Aucune règle n'est écrite, aucune classe n'est inventée, aucun nœud n'est
 * ajouté. Ce sont les leviers du gel, actionnés.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CONFIRMATION DE SORTIE EST NATIVE, ET C'EST UN ÉCART DÉCLARÉ
 *
 * Le gel porte `dialog#dlg-quitter` pour ce geste ; `src/vues/V-17.svelte` et
 * `src/vues/V-18.svelte` déclarent l'un et l'autre ne pas le transcrire — un
 * `<dialog>` fermé ne porte aucune boîte de rendu et n'entre pas dans
 * l'instantané ARIA. Le rappel passe donc par l'invite du navigateur. Le FOND
 * est tenu : on ne quitte pas une rédaction modifiée sans être averti. C'est mot
 * pour mot la jurisprudence de `cablerLaSuppression()` (V-14) et de
 * `cablerLOperationnel()` (V-18).
 */
import { rendreDocument, type ResolveurDeNote } from '../contenu/rendu';
import type { Document } from '../contenu/document';
import { adresseDeNote } from '../rangement/adresses';
import {
	PREFIXE_DE_CONTROLE_DE_PROPRIETE,
	PREFIXE_D_ERREUR_DE_PROPRIETE
} from '../cablage/formulaires';
import type { Note } from '../../../seeds/corpus';

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que ses voisins. */
export type Debranchement = () => void;

/**
 * LE DOCUMENT DE REPLI DE L'APERÇU — un paragraphe sans texte, la définition du
 * corps vide du produit (`../base/semence.ts`, `corpsVide()`).
 *
 * Il ne sert qu'au cas où AUCUN éditeur n'a pu être monté — la zone du gel
 * absente —, et il vaut mieux qu'un aperçu vide : le format refuse un document
 * sans contenu (`ADR-003`), et rendre `null` ferait lever au clic. La fabrique
 * n'est pas importée de `semence.ts` : celui-ci tire tout le jeu de semence dans
 * le paquet du navigateur, pour deux nœuds.
 */
export const DOCUMENT_VIDE: Document = { type: 'doc', content: [{ type: 'paragraph' }] };

/**
 * LES CINQ POSITIONS DU TÉMOIN DE SAUVEGARDE — `#sauvegarde[data-etat]`.
 *
 * La même énumération que la propriété de `BarreDEtat.svelte`, écrite ici
 * plutôt qu'importée de là-bas : `tsc --noEmit` ne lit pas les composants, et
 * un type importé d'un `.svelte` ferait sortir `pnpm check` en erreur. Les deux
 * listes tiennent du même relevé, `V-17:2644-2650`.
 */
export type EtatDuTemoin = 'vierge' | 'modifie' | 'encours' | 'enregistre' | 'erreur';

/**
 * LE RAPPEL DE SORTIE — la phrase du dialogue gelé, reprise plutôt que
 * reformulée (`mockups/V-17-editeur.html`, `dialog#dlg-quitter`).
 */
export const RAPPEL_DE_SORTIE =
	'Quitter sans enregistrer ?\n\nLes modifications non enregistrées seront perdues.';

/**
 * L'ADRESSE DE L'ÉDITEUR DE LA RÉFÉRENCE D'UNE NOTE.
 *
 * `$lib/rangement/adresses.ts` est fermé en écriture pour cette campagne (plan
 * §4) et ne porte pas cette adresse. Elle est donc bâtie ICI, SUR
 * `adresseDeNote()` que l'appelant lui passe — jamais sur un gabarit d'URL
 * réécrit à la main —, et le segment `modifier` est celui de
 * `docs/routes.md:144`.
 */
export function adresseDeModificationDeNote(adresseDeLaNote: string): string {
	return adresseDeLaNote + '/modifier';
}

/**
 * LE RÉSOLVEUR DES LIENS INTERNES DE L'APERÇU, ADOSSÉ AU CORPUS DÉJÀ SERVI.
 *
 * L'aperçu rend le document que l'éditeur tient à l'instant du clic ; il ne peut
 * donc pas venir du serveur. Le résolveur, lui, n'a besoin que de ce que la
 * page a DÉJÀ reçu : `data.notes`, le corpus LISIBLE PAR L'APPELANT, celui-là
 * même dont la coquille tire son rail. Aucune requête n'est faite, et aucune
 * note hors périmètre n'entre par ce chemin — le filtrage a eu lieu au chargeur.
 *
 * L'adresse sort de `adresseDeNote()`, la fabrique unique : ce module n'écrit
 * aucun gabarit d'URL (plan §3.3).
 *
 * Une cible inconnue rend `null`, ce qui fait rendre `a.lien-casse` sans `href`
 * par `rendu.ts` — le même sort qu'à la lecture, et c'est ce qu'il faut : un
 * aperçu qui masquerait un lien cassé mentirait sur ce qui sera publié.
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
 * LES LIBELLÉS DU TÉMOIN, ET CELUI QUI MANQUE VOLONTAIREMENT.
 *
 * Ils ne sont pas rédigés ici : ce sont ceux du gel (`V-17:2644-2650`), repris
 * mot pour mot. `enregistre` n'y figure pas, et c'est délibéré — son libellé
 * porte un suffixe calculé, « Enregistré · dernière version il y a N jours »,
 * que la VUE rend depuis la base. Le recomposer côté client fabriquerait une
 * ancienneté que personne n'a mesurée (`P-02`).
 */
const LIBELLES_DU_TEMOIN: Readonly<Partial<Record<EtatDuTemoin, string>>> = {
	vierge: 'Aucune modification',
	modifie: 'Modifications non enregistrées',
	encours: 'Enregistrement…',
	erreur: "Échec de l'enregistrement"
};

/** Pose la position du témoin, et son libellé quand le gel en donne un. */
export function poserLeTemoin(racine: ParentNode, etat: EtatDuTemoin): void {
	const temoin = racine.querySelector<HTMLElement>('#sauvegarde');
	if (temoin === null) return;
	temoin.dataset['etat'] = etat;
	const libelle = LIBELLES_DU_TEMOIN[etat];
	const texte = racine.querySelector<HTMLElement>('#sauvegarde-txt');
	if (libelle !== undefined && texte !== null) texte.textContent = libelle;
}

/** Ce que le câblage des gestes d'écran a besoin de savoir de sa route. */
export interface OptionsDesGestes {
	/** Le document courant, tel que l'éditeur monté le rend. */
	document: () => Document;
	/** La résolution des liens internes, pour l'aperçu. */
	resoudre: ResolveurDeNote;
	/** Où « Annuler » ramène. Absent, le bouton ramène à l'accueil. */
	retour?: string;
}

/** Ce qu'un câblage de gestes rend à sa route. */
export interface GestesCables {
	/** À rendre à Svelte au démontage. */
	defaire: Debranchement;
	/**
	 * À BRANCHER SUR `surChangement` DE L'ÉDITEUR. L'éditeur est monté AVANT ce
	 * câblage — il tient la zone du gel, que le câblage interroge —, il ne peut
	 * donc pas s'y référer à sa construction. La route fait le nœud.
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
	      (`ADR-004`), puis `data-vue="apercu"`, qui masque la rédaction et
	      révèle `#apercu`. Le rendu est celui du serveur : c'est le même module,
	      appelé de la même façon, donc l'aperçu ne peut pas mentir sur ce que la
	      lecture montrera. */
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

	/* 4. LE MENU ÉTENDU — il porte cinq des vingt-quatre commandes de la barre,
	      et sa liste est masquée tant que `data-ouvert` n'est pas posé
	      (`V-17.css:498`). Sans ce geste, les blocs d'alerte, le diagramme et le
	      lien interne étaient DESSINÉS et hors d'atteinte du pointeur — mesuré :
	      un clic de navigateur sur eux expirait sans jamais aboutir. */
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
		   `click` REMONTANT : elle survient donc APRÈS que la délégation de
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

	/* 5. LE TÉMOIN DE SAUVEGARDE passe à « Enregistrement… » à la soumission —
	      et la soumission est la seule chose que ce module en sait. Le passage à
	      « Modifications non enregistrées » vient de l'éditeur, par
	      `signalerUneModification()`. */
	ecouter(formulaire, 'submit', () => poserLeTemoin(formulaire, 'encours'));

	/* 6. ANNULER — on quitte vers une ADRESSE DU PRODUIT, et on prévient si
	      quelque chose serait perdu. Jamais `history.back()` : quand l'éditeur
	      est la première page de l'onglet — lien ouvert à côté, signet, adresse
	      saisie — l'historique est vide et le bouton jetait l'utilisateur hors
	      de l'application (mesuré : l'URL devenait `about:blank`). Toute route
	      d'édition sait nommer son retour ; à défaut, c'est l'accueil. */
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

/* ═══════════════════════════════ Le refus d'enregistrement ══════════════ */

/** Ce qu'une action d'édition rend quand elle REFUSE — `creation.ts:209-233`. */
export interface RefusDEnregistrement {
	readonly motif?: string;
	readonly manquements?: readonly string[];
	/**
	 * LES CLÉS DES PROPRIÉTÉS DE FICHE QUI MANQUENT — jamais leurs noms.
	 *
	 * `manquements` porte les NOMS, pour la phrase ; celles-ci portent les
	 * CLÉS, pour le foyer. Les deux listes disent la même chose dans deux
	 * langues, et aucune ne se déduit de l'autre à l'écran : deux propriétés
	 * peuvent porter le même nom d'affichage, seule la clé désigne un champ.
	 */
	readonly proprietesManquantes?: readonly string[];
}

/**
 * LE MOTIF DU REFUS D'UNE PROPRIÉTÉ OBLIGATOIRE — une seule écriture.
 *
 * Le motif voyage du serveur à l'écran par la charge de `fail()` : il est donc
 * un mot de protocole, et les deux bouts doivent l'écrire à l'identique. Les
 * huit motifs qui précèdent sont des littéraux recopiés de part et d'autre ;
 * celui-ci ne l'est pas, et c'est délibéré — un motif que le serveur émet et
 * que l'écran n'attend pas ne se voit à aucun contrôle, seulement à l'usage.
 */
export const MOTIF_DE_PROPRIETE_OBLIGATOIRE = 'propriété obligatoire manquante';

/**
 * LE MOTIF DU REFUS, RATTACHÉ AU CHAMP QUI L'A CAUSÉ.
 *
 * Les deux seuls motifs FIXES que l'utilisateur peut corriger sur place ont
 * leur bloc au gel — `#erreur-titre` (`V-17:467`) et `#erreur-dossier`
 * (`V-17:839`). Les autres — type, domaine, visibilité, statut — désignent des
 * `select` toujours renseignés : les voir signifierait que la charge est
 * corrompue, pas que l'utilisateur a mal rempli. Ils vont au témoin, qui sait
 * dire « erreur ».
 *
 * LE TROISIÈME MOTIF CORRIGEABLE N'A PAS SA PLACE DANS CETTE TABLE, et c'est
 * une propriété du produit, pas une exception : les propriétés d'une fiche sont
 * ADMINISTRABLES, leur nombre et leurs clés ne sont connus qu'à l'exécution. Un
 * motif unique y répond, et il désigne SES champs par la liste des clés que le
 * refus porte — voir `MOTIF_DE_PROPRIETE_OBLIGATOIRE` et le corps de
 * `peindreLeRefusDEdition()`.
 */
const CHAMP_DU_MOTIF: Readonly<Record<string, string>> = {
	'titre manquant': 'erreur-titre',
	'dossier manquant': 'erreur-dossier'
};

/** La phrase montrée, par motif. Celles du gel quand le gel en porte une. */
const PHRASE_DU_MOTIF: Readonly<Record<string, string>> = {
	[MOTIF_DE_PROPRIETE_OBLIGATOIRE]:
		'Le type de fiche exige une valeur pour cette propriété. Renseignez-la, puis enregistrez.',
	'titre manquant': 'Une note sans titre est introuvable. Donnez-lui-en un, même approximatif.',
	'dossier manquant': 'Choisissez le dossier qui recevra la note.',
	'type manquant': 'Le type de la note n’a pas été transmis.',
	'domaine manquant': 'Le domaine de la note n’a pas été transmis.',
	'corps illisible': 'Le corps de la note n’a pas pu être lu. Rien n’a été enregistré.',
	'document refusé': 'Le corps de la note comporte des constructions refusées.',
	'markdown refusé': 'Le Markdown soumis n’a pas pu être analysé.'
};

/**
 * PEINT LE REFUS, OU L'EFFACE.
 *
 * MESURÉ LE 21/08/2026 : créer une note sans choisir de dossier renvoie `400
 * { motif: 'dossier manquant' }`, et l'écran ne dit RIEN — ni message, ni
 * témoin, ni foyer. Le rédacteur reclique, et reclique. Ni
 * `/notes/nouvelle/+page.svelte` ni `/notes/{id}/modifier/+page.svelte` ne
 * lisaient leur `form` : TOUT refus d'enregistrement était muet, sur les deux
 * écrans d'écriture les plus employés du produit.
 *
 * Les blocs, eux, existaient depuis le gel. Comme partout dans cette campagne,
 * ce n'est pas l'affichage qui manquait : c'est le fil entre les deux.
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
	/* LES BLOCS DES PROPRIÉTÉS NE SONT PAS DANS LA TABLE, et ils ne peuvent pas
	   y être : le référentiel est administrable, leurs identifiants naissent
	   avec les champs (`../cablage/formulaires.ts`). On les efface par la classe
	   du gel, à l'intérieur de la seule zone qui les porte. */
	for (const bloc of racine.querySelectorAll<HTMLElement>('#proprietes .champ__erreur')) {
		bloc.hidden = true;
	}
	for (const champ of racine.querySelectorAll<HTMLElement>('#proprietes .champ')) {
		delete champ.dataset['etat'];
	}
	const motif = refus?.motif;
	if (motif === undefined) return;

	/* LE REFUS D'UNE PROPRIÉTÉ SE PEINT SUR CHAQUE PROPRIÉTÉ NOMMÉE, pas sur un
	   bloc unique en haut de page — `BRIEF-VUES.md:973` demande le signalement
	   « à l'endroit du champ ». Le témoin dit ensuite qu'il y a eu refus, comme
	   pour tous les autres motifs. */
	for (const cle of refus?.proprietesManquantes ?? []) {
		const bloc = racine.querySelector<HTMLElement>(`#${PREFIXE_D_ERREUR_DE_PROPRIETE}${cle}`);
		if (bloc === null) continue;
		bloc.hidden = false;
		const champ = bloc.closest<HTMLElement>('.champ');
		if (champ !== null) champ.dataset['etat'] = 'erreur';
	}
	const premiere = (refus?.proprietesManquantes ?? [])[0];
	if (premiere !== undefined) {
		const controle = racine.querySelector<HTMLElement>(
			`#${PREFIXE_DE_CONTROLE_DE_PROPRIETE}${premiere}`
		);
		if (controle !== null) controle.scrollIntoView({ block: 'center' });
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

	/* Le témoin dit toujours qu'il y a eu refus — y compris quand le motif a son
	   bloc : la barre d'état est le seul point que le rédacteur regarde après
	   avoir cliqué « Enregistrer ». */
	poserLeTemoin(racine, 'erreur');
	const texteDuTemoin = racine.querySelector<HTMLElement>('#sauvegarde-txt');
	if (texteDuTemoin !== null) {
		texteDuTemoin.textContent =
			manquements.length > 0 ? `${phrase} (${manquements[0] ?? ''})` : phrase;
	}
}
