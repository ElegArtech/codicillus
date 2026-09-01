/**
 * LE CÂBLAGE DES ÉCRANS DE CONSOLE — ce qui relie les nœuds du gel aux actions des routes.
 * Appelé depuis `onMount` d'un `+page.svelte`, et de nulle part ailleurs. Il pose des
 * écouteurs et bascule des attributs que le gel bascule déjà : aucune règle de style,
 * aucune classe absente du gel, aucun nœud créé ou retiré. Sans JavaScript, ces écrans ne
 * soumettent pas — `ARB-063` §4.
 */

import { deserialize } from '$app/forms';
import { fichiersDuTransfert } from '$lib/cablage/depot-de-fichiers';
import type { ChampReglableEnConsole } from '$lib/donnees/administration';

export type Debranchement = () => void;

class Attaches {
	private readonly defaire: Debranchement[] = [];

	ecouter<K extends keyof HTMLElementEventMap>(
		cible: EventTarget,
		type: K,
		reaction: (evenement: HTMLElementEventMap[K]) => void
	): void {
		const enveloppe = (e: Event): void => reaction(e as HTMLElementEventMap[K]);
		cible.addEventListener(type, enveloppe);
		this.defaire.push(() => cible.removeEventListener(type, enveloppe));
	}

	debranchement(): Debranchement {
		return () => {
			for (const d of this.defaire) d();
		};
	}
}

function noeud<T extends Element>(racine: ParentNode, selecteur: string): T | null {
	return racine.querySelector<T>(selecteur);
}

export interface RetourDAction {
	readonly succes: boolean;
	readonly donnees: unknown;
}

/**
 * `RG-M18-01` — LE RETOUR VISIBLE, POSÉ AVANT LE PREMIER OCTET ENVOYÉ.
 *
 * MESURÉ AVANT : sur un aller-retour d'une seconde et demie, `#form-valider` restait
 * `disabled=false`, sans `aria-busy`, libellé inchangé, et son fond revenait à sa
 * couleur de repos 94 ms après le clic — c'est-à-dire que l'écran était STRICTEMENT
 * identique à ce qu'il était avant, pendant tout le reste de l'attente. Un bouton qui
 * ne dit rien laisse croire que le clic n'a pas pris, et le second clic partait.
 *
 * LA FORME EST CELLE QUE LE SOCLE DÉCRIT DÉJÀ pour l'état « en attente » : rouet
 * devant le libellé, bouton inerte. Rien n'est inventé ici.
 *
 * LE BOUTON EST CELUI QUI A LE FOCUS, et ce n'est pas une devinette : un clic focalise
 * le bouton cliqué, et tous les gestes de console partent d'un bouton. Quand il n'y en
 * a pas — geste au clavier, appel programmé —, le curseur d'attente de la page reste,
 * lui, toujours posé.
 */
function ouvrirLAttente(document: Document): Debranchement {
	document.documentElement.dataset['geste'] = 'encours';

	const actif = document.activeElement;
	if (!(actif instanceof HTMLButtonElement) || actif.disabled) {
		return () => {
			delete document.documentElement.dataset['geste'];
		};
	}

	const rouet = document.createElement('span');
	rouet.className = 'btn__rouet';
	rouet.setAttribute('aria-hidden', 'true');
	actif.prepend(rouet);
	actif.setAttribute('aria-busy', 'true');
	/* L'INERTIE VIENT APRÈS LE ROUET, jamais avant : un bouton désactivé perd le
	   focus, et on ne le retrouverait plus pour le rendre. */
	actif.disabled = true;

	return () => {
		delete document.documentElement.dataset['geste'];
		rouet.remove();
		actif.removeAttribute('aria-busy');
		actif.disabled = false;
	};
}

export interface OptionsDEnvoi {
	/**
	 * RECHARGER LA PAGE AU SUCCÈS — vrai par défaut : la liste rendue vient du serveur.
	 * FAUX QUAND L'ÉCRAN A ENCORE QUELQUE CHOSE À MONTRER : à la création d'un compte, le
	 * gel ouvre `#dlg-mdp` sur le mot de passe initial, que recharger emporterait — seul le
	 * condensat est en base. Le rechargement est différé jusqu'à la fermeture.
	 */
	readonly rechargerAuSucces?: boolean;
}

/**
 * L'ENVOI À UNE ACTION DE ROUTE, et le rechargement qui suit — au succès seul : un refus
 * doit rester à l'écran, dialogue ouvert et saisie en place.
 *
 * `x-sveltekit-action` est l'en-tête que SvelteKit attend d'une soumission programmée ;
 * sans lui, il répond par une redirection destinée à un formulaire natif. LE CORPS N'EST
 * PAS DU JSON ORDINAIRE : `data` est une CHAÎNE produite par `devalue`, et `deserialize()`
 * de `$app/forms` est la porte officielle (`P-24`).
 */
export async function envoyerAUneAction(
	document: Document,
	action: string,
	champs: Record<string, string>,
	options: OptionsDEnvoi = {}
): Promise<RetourDAction> {
	const corps = new FormData();
	for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);

	/* `RG-M18-01` — AVANT LA REQUÊTE, ET SYNCHRONE : posée après le `await`, l'attente
	   ne s'afficherait qu'une fois la réponse arrivée, c'est-à-dire jamais. */
	const fermerLAttente = ouvrirLAttente(document);
	try {
		const reponse = await fetch(action, {
			method: 'POST',
			headers: { 'x-sveltekit-action': 'true' },
			body: corps
		});
		const resultat = deserialize(await reponse.text());
		const succes = resultat.type === 'success';
		/* L'ATTENTE RESTE POSÉE QUAND ON RECHARGE : la rendre ici ferait clignoter le
		   bouton entre la réponse et le remplacement du document, et le geste aurait
		   l'air d'avoir échoué pendant une image. Le rechargement l'emporte avec lui. */
		if (succes && options.rechargerAuSucces !== false) {
			document.location.reload();
			return { succes, donnees: resultat.data };
		}
		fermerLAttente();
		return {
			succes,
			donnees:
				resultat.type === 'success' || resultat.type === 'failure' ? resultat.data : undefined
		};
	} catch (erreur) {
		/* UN RÉSEAU QUI TOMBE NE DOIT PAS LAISSER L'ÉCRAN EN ATTENTE POUR TOUJOURS :
		   sans ce rattrapage, le bouton restait inerte et rouet tournant, sans issue. */
		fermerLAttente();
		throw erreur;
	}
}

/* ═══════════════════════════════ La configuration — V-33 ════════════════ */

/**
 * LES CHAMPS DE `V-33`, PAR LEUR IDENTIFIANT DE GEL — ET LA LISTE EST LIÉE AU TYPE
 * QUI LA COMMANDE. C'est elle qui décide de ce que le navigateur ENVOIE, un identifiant
 * manquant étant silencieusement ignoré. Le `satisfies` referme la porte — les clés sont
 * celles de `ChampReglableEnConsole` —, et l'import de type est ERASÉ à l'exécution : ce
 * module reste sans dépendance vers le graphe du serveur.
 */
const CHAMPS_DE_CONFIGURATION = {
	seuilFrais: 'c-frais',
	seuilVieillissant: 'c-vieil',
	versionsMax: 'c-versions',
	portailAssistance: 'c-portail',
	nomOrganisation: 'c-organisation',
	motFiche: 'c-mot',
	tailleMaxPieceJointe: 'c-taille',
	dureeSession: 'c-session',
	indisponibiliteActive: 'c-indisponibilite',
	messageDIndisponibilite: 'c-message-indisponibilite'
} as const satisfies Readonly<Record<ChampReglableEnConsole, string>>;

/**
 * LE CÂBLAGE DE LA CONFIGURATION — `RG-M14-09`, `RG-M14-10`. TROIS GESTES : le bouton suit
 * la modification (valeurs initiales relevées AU MONTAGE, donc celles du chargeur),
 * « Rétablir » repose ces valeurs sans recharger, « Enregistrer » appelle l'action avec les
 * identifiants du gel. LE REFUS N'EST PAS AFFICHÉ ICI, ET C'EST UNE LACUNE DÉCLARÉE.
 */
export interface RefusDeConfiguration {
	readonly champ: string;
	readonly message: string;
}

/** Les trois formes de nœud que les réglages de `V-33` emploient. */
type ChampDeConfiguration = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface OptionsDeConfiguration {
	/**
	 * Appelé quand l'action REFUSE. Sans lui, le refus se perdait — le gestionnaire
	 * faisait `void envoyerAUneAction(...)` et jetait le résultat.
	 *
	 * L'affichage n'est pas fait ici : les quatre blocs d'erreur appartiennent à
	 * `V-33`, et ce module sert aussi V-27 à V-32, qui n'en ont pas.
	 */
	readonly surRefus?: (erreurs: readonly RefusDeConfiguration[]) => void;
}

export function cablerLaConfiguration(
	racine: ParentNode,
	options: OptionsDeConfiguration = {}
): Debranchement {
	const attaches = new Attaches();
	/* `HTMLTextAreaElement` DEPUIS QUE `RG-NF-10` A SON MESSAGE : le champ de la page
	   d'indisponibilité est une zone de texte, et le type d'origine l'aurait laissée
	   hors de la charge envoyée — le message aurait été effacé à chaque enregistrement. */
	const champs = Object.values(CHAMPS_DE_CONFIGURATION)
		.map((id) => noeud<ChampDeConfiguration>(racine, `#${id}`))
		.filter((n): n is ChampDeConfiguration => n !== null);
	if (champs.length === 0) return attaches.debranchement();

	const enregistrer = noeud<HTMLButtonElement>(racine, '#enregistrer');
	const retablir = noeud<HTMLButtonElement>(racine, '#annuler');
	const initiales = new Map(champs.map((c) => [c.id, c.value]));

	const relire = (): void => {
		const modifie = champs.some((c) => c.value !== initiales.get(c.id));
		if (enregistrer !== null) enregistrer.disabled = !modifie;
		if (retablir !== null) retablir.hidden = !modifie;
	};
	relire();

	for (const champ of champs) {
		attaches.ecouter(champ, 'input', relire);
		attaches.ecouter(champ, 'change', relire);
	}

	if (retablir !== null) {
		attaches.ecouter(retablir, 'click', () => {
			for (const champ of champs) champ.value = initiales.get(champ.id) ?? champ.value;
			relire();
		});
	}

	if (enregistrer !== null) {
		attaches.ecouter(enregistrer, 'click', () => {
			const charge: Record<string, string> = {};
			for (const champ of champs) charge[champ.id] = champ.value;
			void envoyerAUneAction(enregistrer.ownerDocument, '?/enregistrer', charge).then((retour) => {
				if (retour.succes) return;
				/* Un refus rend `{ issue: 'valeurs-refusees', erreurs: [...] }`. Sans
				   erreur nommée, on rend une liste vide : l'appelant décide quoi en
				   dire, il ne reçoit jamais `undefined`. */
				const donnees = retour.donnees as
					{ readonly erreurs?: readonly RefusDeConfiguration[] } | undefined;
				options.surRefus?.(donnees?.erreurs ?? []);
			});
		});
	}

	return attaches.debranchement();
}

/* ═══════════════════════════════ Les suppressions ═══════════════════════ */

/*
 * IL N'Y A PAS DE CÂBLAGE DE SUPPRESSION ICI : le DÉCOMPTE de `RG-M14-02` ne se compose
 * pas depuis le DOM. Le partage retenu vaut pour V-27, V-28 et V-29 — la VUE tient l'état
 * de son dialogue (objet visé, saisie retapée, décompte, modalité) et ne connaît ni route
 * ni réseau ; la PAGE traduit la désignation et appelle l'action.
 */

/* ═══════════════════════════════ Le tiroir de formulaire ════════════════ */

/**
 * LE PANNEAU `tiroir-form` DES CONSOLES — LE MÊME GESTE QU'EN V-15. `V-32.css:401` ouvre
 * le panneau par `.app[data-form="ouvert"] .tiroir-form`, et `Coquille.svelte` rend la
 * superposition HORS de `div.app` : le sélecteur ne peut pas s'appliquer, et le panneau ne
 * pèse aucun pixel — or `RG-M14-07` a son déclencheur DEDANS. Rendre le panneau DESCENDANT
 * de `.app` suffit : aucune déclaration n'est écrite, c'est la règle GELÉE qui l'ouvre.
 * LE DÉPLACEMENT EST IDEMPOTENT — Svelte garde des RÉFÉRENCES aux nœuds, jamais leur
 * chemin dans l'arbre.
 */
export function cablerLeTiroirDeFormulaire(racine: ParentNode): Debranchement {
	const app = noeud<HTMLElement>(racine, '.app');
	const tiroir = noeud<HTMLElement>(racine, '.tiroir-form');
	if (app !== null && tiroir !== null && !app.contains(tiroir)) app.appendChild(tiroir);
	return () => {
		/* Rien à défaire : aucun écouteur n'est posé, et remettre le panneau à sa
		   place n'aurait aucun observateur — la page disparaît avec lui. */
	};
}

/* ═══════════════════════════════ La zone de dépôt — V-35 ════════════════ */

export interface OptionsDuDepot {
	/** Appelé dès qu'au moins un fichier est reçu, par dépôt ou par sélection. */
	readonly surLot: (fichiers: readonly File[]) => void;
}

/**
 * LA ZONE DE DÉPÔT ET « PARCOURIR » DE V-35 — `dragenter`/`dragover` →
 * `data-survol="oui"` ; `dragleave`/`drop` → `"non"`, l'attribut que la feuille lit.
 *
 * LE CHAMP DE FICHIERS N'EXISTE PAS AU GEL, où `#parcourir` est un bouton nu. Il est créé
 * ici, DÉTACHÉ DU DOCUMENT : jamais inséré, il ouvre le sélecteur de la même façon, et le
 * document servi reste celui de la maquette. L'arborescence d'un répertoire déposé est
 * descendue par le module que `V-24` partage — sans elle, un répertoire perd sa structure.
 */
export function cablerLeDepot(racine: ParentNode, options: OptionsDuDepot): Debranchement {
	const attaches = new Attaches();
	const zone = noeud<HTMLElement>(racine, '#depot');
	if (zone === null) return attaches.debranchement();

	const marquer =
		(etat: string) =>
		(evenement: Event): void => {
			evenement.preventDefault();
			zone.setAttribute('data-survol', etat);
		};
	const entree = marquer('oui');
	const sortie = marquer('non');
	attaches.ecouter(zone, 'dragenter', entree);
	attaches.ecouter(zone, 'dragover', entree);
	attaches.ecouter(zone, 'dragleave', sortie);
	attaches.ecouter(zone, 'drop', (evenement) => {
		sortie(evenement);
		void fichiersDuTransfert((evenement as DragEvent).dataTransfer).then((recus) => {
			if (recus.length > 0) options.surLot(recus);
		});
	});

	const parcourir = noeud<HTMLButtonElement>(racine, '#parcourir');
	if (parcourir !== null) {
		const champ = zone.ownerDocument.createElement('input');
		champ.type = 'file';
		champ.multiple = true;
		attaches.ecouter(champ, 'change', () => {
			const recus = Array.from(champ.files ?? []);
			if (recus.length > 0) options.surLot(recus);
		});
		attaches.ecouter(parcourir, 'click', () => champ.click());
	}

	return attaches.debranchement();
}
