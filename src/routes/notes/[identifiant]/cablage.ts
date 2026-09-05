/**
 * LE CÂBLAGE DE LA LECTURE — V-14, et le panneau d'historique V-15 qui s'y
 * superpose. `ARB-063` : le comportement s'accroche depuis la route, par
 * identifiant et par sélecteur.
 *
 * LA NEUTRALISATION DES BOUTONS N'EST PAS UNE GÊNE, C'EST LA PARADE. Un `button`
 * sans attribut de type est un bouton de SOUMISSION dès qu'il entre dans un
 * formulaire, et l'enveloppe de cette route vise `?/supprimer` : « Imprimer » a
 * réellement détruit des notes. `+page.svelte` pose `type="button"` au montage ;
 * ce module ne défait jamais cette pose, et chaque geste désigne son action par
 * `soumettreVers()` — rien n'est réécrit sur le formulaire, il n'y a donc aucune
 * fenêtre pendant laquelle il vise autre chose que la suppression.
 *
 * QUATRE GESTES SONT REPRIS DU SCRIPT DU GEL à la ligne près : la bascule de
 * registre, le dépliage du panneau de signalement, la copie d'un bloc de code et
 * l'agrandissement d'une figure.
 */
import { soumettreVers } from '$lib/cablage/formulaires';
import type { Registre } from '$lib/donnees/note';
import { adresseDeNote } from '$lib/rangement/adresses';

export type Debranchement = () => void;

export interface OptionsDeLaLecture {
	/** L'identifiant lisible de la note lue — la racine de toutes ses adresses. */
	readonly identifiant: string;
	/**
	 * LE REGISTRE AFFICHÉ — celui que les trois gestes de vivacité visent.
	 *
	 * Il voyage EN COUPLE DE SOUMISSION et non dans l'adresse : `?/verifier`
	 * REMPLACE la chaîne de requête de la page, et `?registre=operationnel` n'y
	 * survivrait pas. Sans lui, vérifier l'Opérationnel attesterait la Référence.
	 */
	readonly registre: Registre;
	/** `RG-M05-08` / `P-09` — sans le droit d'écrire, aucun geste n'est posé. */
	readonly ecriture: boolean;
	/**
	 * Où mène « Exporter », ou `null` quand l'appelant ne peut pas exporter :
	 * `RG-M13-03` le réserve à l'administrateur, et une entrée sans destination se
	 * RETIRE.
	 */
	readonly exports: string | null;
}

/**
 * LE TEXTE D'UN NŒUD, LES BLANCS RÉDUITS À UN ESPACE. Un simple `trim()` ne
 * suffit pas : le formateur coupe un libellé long entre deux lignes, et
 * « Historique des\n\t\t\tversions » n'est plus égal à « Historique des
 * versions ». Le geste se débranchait alors sans erreur de compilation, ce qui
 * est exactement le défaut que `RG-M18-16` cherche à empêcher.
 */
function libelle(noeud: Element): string {
	return (noeud.textContent ?? '').replace(/\s+/gu, ' ').trim();
}

/** Le bouton d'une zone, reconnu à son libellé — aucun identifiant ne le distingue. */
function boutonNomme(racine: ParentNode | null, texte: string): HTMLButtonElement | null {
	if (racine === null) return null;
	return Array.from(racine.querySelectorAll('button')).find((b) => libelle(b) === texte) ?? null;
}

/**
 * TOUS LES BOUTONS D'UN MÊME LIBELLÉ, et c'est nécessaire depuis la refonte : la
 * lecture offre « Exporter », « Imprimer » et « Supprimer » DEUX FOIS — dans le
 * menu ⋮ et dans la colonne de contexte. Un `find` n'en câblait qu'un, et l'autre
 * restait inerte sans que rien ne le dise.
 */
function boutonsNommes(racine: ParentNode | null, texte: string): readonly HTMLButtonElement[] {
	if (racine === null) return [];
	return Array.from(racine.querySelectorAll('button')).filter((b) => libelle(b) === texte);
}

/**
 * Un champ caché du formulaire, créé s'il manque. C'est `poserChamp()` de
 * `$lib/cablage/formulaires.ts`, qui ne l'exporte pas ; la marque de données
 * diffère — `cableLecture` — pour que deux câblages posés sur le même formulaire
 * ne se disputent jamais le même nœud.
 */
function poserChamp(formulaire: HTMLFormElement, nom: string, valeur: string): void {
	const existant = formulaire.querySelector<HTMLInputElement>(
		`input[type="hidden"][data-cable-lecture="${nom}"]`
	);
	const champ = existant ?? formulaire.ownerDocument.createElement('input');
	champ.type = 'hidden';
	champ.name = nom;
	champ.dataset['cableLecture'] = nom;
	champ.value = valeur;
	if (existant === null) formulaire.appendChild(champ);
}

/**
 * LE CÂBLAGE DE LA LECTURE D'UNE NOTE — appelé depuis `onMount` de la route,
 * APRÈS la neutralisation des boutons du gel, et jamais ailleurs.
 */
export function cablerLaLecture(
	formulaire: HTMLFormElement,
	options: OptionsDeLaLecture
): Debranchement {
	const document = formulaire.ownerDocument;
	const fenetre = document.defaultView;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};
	const adresse = adresseDeNote(options.identifiant);
	const aller = (cible: string): void => {
		document.location.assign(cible);
	};
	/** Un nœud qui agit : on l'écoute, on ne touche pas à son type. */
	const agir = (bouton: Element | null, geste: (evenement: Event) => void): void => {
		if (bouton === null) return;
		ecouter(bouton, 'click', geste);
	};

	/* ═══════════════════ 1. LA FRAÎCHEUR — les trois gestes de M06 ═════════ */

	/** Le registre courant, joint à chaque geste de vivacité — jamais deviné au serveur. */
	const coupleDeRegistre = { nom: 'registre', valeur: options.registre };

	/* « Marquer comme vérifié » — `UC-M06-02`, un clic et aucun champ. */
	agir(document.getElementById('btn-verifier'), () =>
		soumettreVers(formulaire, '?/verifier', coupleDeRegistre)
	);

	/* Le dépliage du panneau de signalement — `V-14:4039`, transcrit. */
	const panneauReviser = document.getElementById('panneau-reviser');
	const boutonReviser = document.getElementById('btn-reviser');
	const zoneReviser = document.querySelector<HTMLTextAreaElement>('#txt-reviser');
	const replier = (): void => {
		panneauReviser?.setAttribute('data-ouvert', 'non');
		boutonReviser?.setAttribute('aria-expanded', 'false');
	};
	if (panneauReviser !== null && boutonReviser !== null) {
		agir(boutonReviser, () => {
			const ouvert = panneauReviser.getAttribute('data-ouvert') === 'oui';
			panneauReviser.setAttribute('data-ouvert', ouvert ? 'non' : 'oui');
			boutonReviser.setAttribute('aria-expanded', String(!ouvert));
			if (!ouvert) zoneReviser?.focus();
		});
		agir(document.getElementById('btn-reviser-annul'), () => {
			replier();
			boutonReviser.focus();
		});
	}

	/**
	 * « Signaler à réviser » — `UC-M06-03`. LE COMMENTAIRE VOYAGE EN CHAMP CACHÉ, et
	 * non par un attribut de nom posé sur la zone de saisie du gel : celle-ci vit
	 * dans l'enveloppe qui vise `?/supprimer`, et un champ nommé y partirait avec
	 * CHAQUE soumission — un dépôt de pièce jointe emporterait le brouillon.
	 */
	agir(document.getElementById('btn-reviser-envoi'), () => {
		poserChamp(formulaire, 'commentaire', zoneReviser?.value ?? '');
		replier();
		soumettreVers(formulaire, '?/signaler', coupleDeRegistre);
	});

	/* « Lever la demande de révision » — l'entrée du menu ⋮, et le bouton du bandeau
	   de révision que V-15 porte encore. Les deux visent la même action ; le premier
	   est reconnu par son identifiant, le second par son libellé. */
	agir(document.getElementById('btn-lever'), () =>
		soumettreVers(formulaire, '?/lever', coupleDeRegistre)
	);
	agir(boutonNomme(document.getElementById('bandeau-revision'), 'Lever la demande'), () =>
		soumettreVers(formulaire, '?/lever', coupleDeRegistre)
	);

	/* ═══════════════════ 2. LES DEUX AUTRES BANDEAUX ══════════════════════ */

	/**
	 * « Publier » — LE GEL NE DONNE AUCUN GESTE À CE BOUTON, et cette route n'a pas
	 * d'action de publication : le statut d'une note est une MODIFICATION, et
	 * `/notes/{identifiant}/modifier` la porte déjà (`P-35`). Un champ absent n'est
	 * pas modifié : la soumission ne porte que `statut`.
	 */
	agir(boutonNomme(document.getElementById('bandeau-brouillon'), 'Publier'), () => {
		poserChamp(formulaire, 'statut', 'publiee');
		soumettreVers(formulaire, `${adresse}/modifier`);
	});

	/**
	 * « Comparer les deux registres » — ÉCART DÉCLARÉ : aucun écran du gel ne met les
	 * DEUX REGISTRES côte à côte, V-16 comparant deux VERSIONS d'un même registre.
	 * Le geste mène à l'éditeur de l'Opérationnel, qui porte le même bandeau, plutôt
	 * que de ne rien faire.
	 */
	agir(boutonNomme(document.getElementById('bandeau-resync'), 'Comparer les deux registres'), () =>
		aller(`${adresse}/operationnel`)
	);

	/* ═══════════════════ 3. LE SOMMAIRE — suivi et défilement doux ════════ */

	/**
	 * LA BASCULE DE REGISTRE N'EST PLUS CÂBLÉE, ET C'EST LE POINT : les deux onglets
	 * sont des LIENS vers `?registre=…`. Le serveur sert alors le corps, le sommaire
	 * ET la vivacité du registre demandé — la bascule marche sans script, et « tout
	 * ce qui parle de vivacité parle du registre affiché » n'a plus à être tenu par
	 * un échange d'attribut `hidden` sur deux corps rendus en double.
	 *
	 * CE QUI RESTE ICI EST DU COMPORTEMENT PUR : le suivi au défilement et le
	 * défilement doux du sommaire. Sans script, les ancres marchent — le saut est
	 * seulement sec, et aucune entrée ne se met en évidence.
	 */
	const sommaire = document.getElementById('sommaire');
	const entrees = Array.from(sommaire?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? []);
	const titres = entrees.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));

	/** La bande de lecture : un titre passé au-dessus de cette ligne est « en cours ». */
	const BANDE_DE_LECTURE = 140;

	const majEntreeActive = (): void => {
		let actif = -1;
		titres.forEach((titre, rang) => {
			if (titre !== null && titre.getBoundingClientRect().top < BANDE_DE_LECTURE) actif = rang;
		});
		entrees.forEach((entree, rang) => {
			if (rang === actif) entree.setAttribute('aria-current', 'true');
			else entree.removeAttribute('aria-current');
		});
	};

	if (entrees.length > 0 && fenetre !== null) {
		majEntreeActive();
		ecouter(fenetre, 'scroll', majEntreeActive);
		for (const [rang, entree] of entrees.entries()) {
			agir(entree, (evenement: Event) => {
				const titre = titres[rang];
				if (titre === undefined || titre === null) return;
				evenement.preventDefault();
				titre.scrollIntoView({ behavior: 'smooth', block: 'start' });
				fenetre.history.replaceState(fenetre.history.state, '', entree.hash);
			});
		}
	}

	/* ═══════════════════ 3 bis. LA BULLE DU GESTE ═════════════════════════ */

	/**
	 * ELLE S'EFFACE AU BOUT DE 2,6 s, ET SON PARAMÈTRE AVEC. Le geste finit par une
	 * redirection qui porte `?fait=…` ; laissé dans l'adresse, il ferait reparaître
	 * la bulle à chaque rechargement, et un partage de l'adresse annoncerait à
	 * quelqu'un d'autre un geste qu'il n'a pas fait.
	 */
	const bulle = document.getElementById('toast');
	if (bulle !== null && fenetre !== null) {
		const adresseSansGeste = new URL(fenetre.location.href);
		adresseSansGeste.searchParams.delete('fait');
		fenetre.history.replaceState(fenetre.history.state, '', adresseSansGeste.toString());
		const minuterie = fenetre.setTimeout(() => bulle.remove(), DUREE_DE_LA_BULLE);
		jetables.push(() => fenetre.clearTimeout(minuterie));
	}

	/* ═══════════════════ 4. LE PANNEAU « ACTIONS » ════════════════════════ */

	/**
	 * LES ENTRÉES SONT RECONNUES À LEUR LIBELLÉ, et elles sont DEUX à le porter :
	 * la colonne de contexte et le menu ⋮ offrent les mêmes gestes, comme le
	 * prototype les offre. C'est le document ENTIER qu'on parcourt, et TOUS les
	 * boutons d'un libellé qu'on câble — un seul câblé laissait l'autre inerte.
	 *
	 * « Historique des versions » n'y est plus : les deux entrées qui y mènent sont
	 * des LIENS vers `/notes/{identifiant}/historique`. « Supprimer » est câblée par
	 * `cablerLaSuppression()`, avec son rappel chiffré (`RG-M04-10`) — sur le PREMIER
	 * bouton seulement, et les autres lui délèguent, pour qu'une seule confirmation
	 * soit demandée.
	 */
	const gestes = (texte: string, geste: () => void): void => {
		for (const bouton of boutonsNommes(document, texte)) agir(bouton, geste);
	};
	gestes('Modifier la référence', () => aller(`${adresse}/modifier`));
	gestes("Modifier l'opérationnel", () => aller(`${adresse}/operationnel`));
	/* SANS REGISTRE OPÉRATIONNEL, LA COLONNE OFFRE DE LE CRÉER : le geste mène à son
	   éditeur, qui EST l'endroit où on l'écrit. */
	gestes("Créer l'opérationnel", () => aller(`${adresse}/operationnel`));
	/* `RG-M18-17` — l'impression est celle du navigateur, et la feuille de la vue
	   porte déjà ses règles d'impression (`V-14.css`, la requête de média). */
	gestes('Imprimer', () => fenetre?.print());

	/* La suppression : le second bouton délègue au premier, celui que
	   `cablerLaSuppression()` a câblé avec la confirmation chiffrée. */
	const suppressions = boutonsNommes(document, 'Supprimer');
	const premiereSuppression = suppressions[0];
	if (premiereSuppression !== undefined) {
		for (const autre of suppressions.slice(1)) agir(autre, () => premiereSuppression.click());
	}

	/**
	 * « EXPORTER » — LE PÉRIMÈTRE DE L'EXPORT EST LE DOMAINE, PAS LA NOTE : aucune
	 * adresse ne rend une note seule (`RG-M13-01`), et `/console/exports` est l'écran
	 * qui l'offre. SANS LE DROIT DE CONSOLE, L'ENTRÉE EST RETIRÉE et non laissée
	 * morte : la route rend 404 à qui n'est pas administrateur, et `P-03` n'admet pas
	 * un geste visible qui ne mène nulle part.
	 */
	const ouExporter = options.exports;
	for (const exporter of boutonsNommes(document, 'Exporter')) {
		if (ouExporter === null) exporter.remove();
		else agir(exporter, () => aller(ouExporter));
	}

	/* Le panneau en erreur : « Réessayer » redemande la page, ce qui est
	   exactement ce que le bouton promet — rien n'est rechargé partiellement. */
	agir(boutonNomme(document.querySelector('.panneau--erreur'), 'Réessayer'), () =>
		document.location.reload()
	);

	/* ═══════════════════ 5. LE CORPS RÉDIGÉ — copie et loupe ══════════════ */

	/**
	 * LES DEUX GESTES DU CORPS SONT DÉLÉGUÉS, ET C'EST UNE NÉCESSITÉ : les boutons de
	 * copie et les cadres de figure ne sont écrits dans aucune vue — ils sortent de
	 * `rendreDocument()`, et les recenser au montage manquerait ceux qu'un changement
	 * de registre fait apparaître.
	 */
	ecouter(formulaire, 'click', (evenement) => {
		const cible = evenement.target;
		if (!(cible instanceof Element)) return;

		/* La copie d'un bloc de code — `V-14:3967`, texte brut et retour du
		   libellé au bout de 1,4 s. */
		const copier = cible.closest<HTMLButtonElement>('.btn-copier');
		if (copier !== null) {
			const code = copier.closest('.bloc-code')?.querySelector('code');
			const brut = code === null || code === undefined ? '' : (code.textContent ?? '');
			/* LE LIBELLÉ D'ORIGINE EST GARDÉ EN NŒUDS, PAS EN CHAÎNE DE BALISAGE : le
			   bouton du gel porte un dessin en plus de son mot, et le rendre par une
			   propriété de balisage réinjecterait du HTML là où un clone suffit. */
			const avant = Array.from(copier.childNodes).map((n) => n.cloneNode(true));
			const fini = (): void => {
				copier.replaceChildren('Copié');
				fenetre?.setTimeout(() => {
					copier.replaceChildren(...avant);
				}, DUREE_DE_L_ACCUSE);
			};
			const presse = fenetre?.navigator.clipboard;
			if (presse === undefined) fini();
			else void presse.writeText(brut).then(fini, fini);
			return;
		}

		/* L'agrandissement d'une figure — `V-14:3982`. La boîte est celle du
		   gel, montée par la route ; sans elle, le cadre reste inerte. */
		const cadre = cible.closest('.figure__cadre');
		if (cadre === null) return;
		ouvrirLaLoupe(document, cadre);
	});

	return () => {
		for (const defaire of jetables) defaire();
	};
}

/** `V-14:3971` — combien de temps le bouton de copie dit « Copié ». */
const DUREE_DE_L_ACCUSE = 1400;

/** Combien de temps la bulle d'un geste reste à l'écran — 2,6 s au prototype. */
const DUREE_DE_LA_BULLE = 2600;

/** Le suffixe que la légende du gel porte et que la loupe retire. */
const INVITE_DE_LEGENDE = /\s*Cliquez pour agrandir\.?\s*$/;

/**
 * L'AGRANDISSEMENT D'UNE FIGURE — `V-14:3982`, transcrit. Le contenu de la boîte
 * est le dessin LUI-MÊME, cloné : ni une seconde source, ni une image
 * reconstruite. La légende est celle de la figure, privée de l'invite.
 */
function ouvrirLaLoupe(document: Document, cadre: Element): void {
	const loupe = document.querySelector<HTMLDialogElement>('dialog#loupe');
	const contenu = document.getElementById('loupe-contenu');
	if (loupe === null || contenu === null) return;
	const dessin = cadre.querySelector('svg') ?? cadre.querySelector('img');
	contenu.replaceChildren();
	if (dessin !== null) contenu.appendChild(dessin.cloneNode(true));
	const legende = document.getElementById('loupe-legende');
	const texte = cadre.closest('figure')?.querySelector('figcaption');
	if (legende !== null && texte !== null && texte !== undefined) {
		legende.textContent = (texte.textContent ?? '').replace(INVITE_DE_LEGENDE, '').trim();
	}
	loupe.showModal();
}

/**
 * LA FERMETURE DE LA BOÎTE D'AGRANDISSEMENT — la croix, et le clic hors boîte.
 * `RG-M18-08` veut la fermeture par Échap : `showModal()` la donne seule, et
 * c'est pourquoi la boîte est ouverte ainsi plutôt que par l'attribut.
 */
export function cablerLaLoupe(document: Document): Debranchement {
	const loupe = document.querySelector<HTMLDialogElement>('dialog#loupe');
	if (loupe === null) return () => {};
	const fermer = (): void => loupe.close();
	const horsBoite = (evenement: Event): void => {
		if (evenement.target === loupe) loupe.close();
	};
	const croix = document.getElementById('loupe-fermer');
	croix?.addEventListener('click', fermer);
	loupe.addEventListener('click', horsBoite);
	return () => {
		croix?.removeEventListener('click', fermer);
		loupe.removeEventListener('click', horsBoite);
	};
}

/**
 * LA FERMETURE DU PANNEAU D'HISTORIQUE — `#fermer-tiroir`, V-15. Le panneau n'est
 * pas un état local : il EST l'état `?version` de cette adresse, et le fermer
 * c'est quitter cet état — non escamoter un tiroir que le rechargement rouvrirait.
 */
export function cablerLaFermetureDeLHistorique(racine: ParentNode, adresse: string): Debranchement {
	const fermer = racine.querySelector<HTMLButtonElement>('#fermer-tiroir');
	if (fermer === null) return () => {};
	fermer.type = 'button';
	const geste = (): void => {
		fermer.ownerDocument.location.assign(adresse);
	};
	fermer.addEventListener('click', geste);
	return () => fermer.removeEventListener('click', geste);
}
