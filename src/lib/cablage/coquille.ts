/**
 * Le câblage de la coquille — la barre supérieure, ses deux menus, sa recherche, le mode
 * concentration, le dépliage du rail et la pile de notifications.
 *
 * `BarreSuperieure.svelte` est rendue par trente-quatre vues, et ses boutons portent des
 * comportements que `ARB-011` retire des transcriptions : aucun n'était câblé — la façon la
 * plus évidente de créer une note ne créait rien. Le câblage est posé UNE fois, par délégation
 * sur le document. AUCUN STYLE N'EST ÉCRIT : le gel ouvre ses menus par un attribut, ce module
 * pose l'attribut et rien d'autre.
 *
 * `P-03` — chaque entrée de menu a une destination réelle, et celles qui n'en ont pas ne sont
 * pas rendues : « Nouveau signet » et « Nouveau dossier » exigent un domaine de rattachement,
 * « Nouvelle note » et « Importer » exigent que l'appelant puisse écrire QUELQUE PART.
 *
 * L'ÉLAGAGE D'ICI EST LE SECOND FILET, PAS LE PREMIER : il court après l'hydratation, donc ce
 * qu'il retire a déjà été SERVI. `BarreSuperieure.svelte` ne les émet plus (`P-09`).
 */

export interface ContexteDeCoquille {
	/**
	 * Le domaine de rattachement LISIBLE, ou `null`, et ce que chacune de ses deux
	 * cibles demande en plus — un booléen par cible, décidé par le gabarit racine.
	 */
	rangement: {
		readonly univers: string;
		readonly domaine: string;
		readonly signets: boolean;
	} | null;
	/** `RG-DRO-03` — seul l'administrateur voit l'entrée de console. */
	administrateur: boolean;
	/**
	 * L'appelant peut-il écrire quelque part — calculé par la MÊME fonction que la garde de
	 * `/notes/nouvelle`. « Nouvelle note » et « Importer des fichiers » portaient leur adresse EN
	 * DUR, sans garde : sur une instance neuve les deux mènent en 404, et le 404 servi offre
	 * « Créer la note … » vers `/notes/nouvelle`. Une boucle.
	 */
	ecriture: boolean;
	/**
	 * OUVRIR LA PALETTE DE RECHERCHE RAPIDE — `UC-M02-01`. Absente, `Ctrl` `K` et le
	 * clic sur le champ de la barre NAVIGUENT vers `/recherche` : c'est ce que faisait
	 * la coquille partout, et « sans quitter son contexte » n'était alors tenu nulle
	 * part. Le repli reste, parce qu'une page servie sans session n'a pas de palette à
	 * ouvrir et que son champ doit tout de même mener quelque part.
	 */
	ouvrirLaPalette?: (() => void) | undefined;
}

/** L'adresse de chaque entrée du menu « Créer », par son libellé du gel. */
function destinations(contexte: ContexteDeCoquille): Map<string, string | null> {
	const r = contexte.rangement;
	const domaine = r === null ? null : `/univers/${r.univers}/${r.domaine}`;
	return new Map<string, string | null>([
		['Nouvelle note', contexte.ecriture ? '/notes/nouvelle' : null],
		/* LE GESTE VIT SUR LA PAGE D'UN DOSSIER : on crée un SOUS-dossier, donc il faut
		   d'abord dire lequel. L'entrée mène à la page du domaine, où l'arborescence est
		   offerte au choix — ce qui n'était vrai qu'à moitié tant que la pastille
		   « Dossiers » n'y était pas rendue sur un domaine sans note lisible. */
		['Nouveau dossier', domaine],
		/* LE FORMULAIRE DE SIGNET DEMANDE DEUX CHOSES DE PLUS QUE LA PAGE DU DOMAINE : le
		   module Signets actif, et le droit d'y rédiger. Un domaine simplement LISIBLE
		   n'y suffit pas. */
		['Nouveau signet', domaine === null || !r?.signets ? null : `${domaine}/signets/nouveau`],
		['Importer des fichiers', contexte.ecriture ? '/importer' : null],
		['Mon profil', '/mon-profil'],
		['Console d’administration', contexte.administrateur ? '/console' : null],
		["Console d'administration", contexte.administrateur ? '/console' : null],
		['Se déconnecter', '/deconnexion']
	]);
}

function libelle(noeud: Element): string {
	return (noeud.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Le mode concentration — `#bascule-rail`, transcrit de `V-37:3270-3275`. Le gel
 * bascule `data-rail` sur `div.app` et réécrit les deux textes du bouton ; la feuille
 * de V-37 fait le reste, et elle seule.
 */
function basculerLeRail(document: Document, bouton: Element): void {
	const app = document.getElementById('app');
	if (app === null) return;
	const ferme = app.getAttribute('data-rail') === 'ferme';
	app.setAttribute('data-rail', ferme ? 'ouvert' : 'ferme');
	bouton.setAttribute('aria-label', ferme ? 'Replier la navigation' : 'Déplier la navigation');
	bouton.setAttribute('title', ferme ? 'Mode concentration' : 'Afficher la navigation');
}

/**
 * Le dépliage d'une branche du rail — transcrit de `basculer()`. Le gel pose `data-ouvert` sur
 * le `li` ET sur son `div.noeud` — le premier commande l'affichage des enfants, le second
 * l'orientation du chevron — puis accorde `aria-expanded` et `aria-label`.
 *
 * LA PERSISTANCE DU GEL N'EST PAS REPRISE : ici le rail est rendu par le serveur à partir du
 * chemin courant, et une mémoire de navigateur rouvrirait des branches que la page suivante a
 * décidé de fermer.
 */
function basculerLaBranche(chevron: Element): void {
	const ligne = chevron.closest('li');
	const noeud = chevron.closest('.noeud');
	if (ligne === null || noeud === null) return;
	const nom = libelle(noeud.querySelector('.noeud__nom') ?? noeud);
	if (ligne.getAttribute('data-ouvert') === 'oui') {
		ligne.setAttribute('data-ouvert', 'non');
		noeud.removeAttribute('data-ouvert');
		chevron.setAttribute('aria-expanded', 'false');
		chevron.setAttribute('aria-label', `Déplier ${nom}`);
		return;
	}
	ligne.setAttribute('data-ouvert', 'oui');
	noeud.setAttribute('data-ouvert', 'oui');
	chevron.setAttribute('aria-expanded', 'true');
	chevron.setAttribute('aria-label', `Replier ${nom}`);
}

/** La durée de sortie d'une bulle, en millisecondes — `V-38:2347`. */
const SORTIE_DE_NOTIFICATION = 260;

/**
 * Le retrait d'une bulle — transcrit de `retirer()`. L'attribut `data-sortie` est
 * celui du gel, et le socle porte déjà son animation, neutralisée sous
 * `prefers-reduced-motion` par la règle voisine.
 */
function retirerLaNotification(bulle: Element): void {
	bulle.setAttribute('data-sortie', 'oui');
	bulle.ownerDocument.defaultView?.setTimeout(() => bulle.remove(), SORTIE_DE_NOTIFICATION);
}

/**
 * Câble la coquille sur le document. Rend de quoi se défaire.
 *
 * @param document le document servi — la délégation vit sur son corps, de sorte
 *   qu'un changement de page côté client n'a rien à recâbler.
 */
export function cablerLaCoquille(document: Document, contexte: ContexteDeCoquille): () => void {
	const cibles = destinations(contexte);
	const aller = (adresse: string): void => document.location.assign(adresse);

	/* `P-03` — les entrées sans destination sont RETIRÉES, pas laissées mortes. */
	const elaguer = (): void => {
		for (const bouton of Array.from(document.querySelectorAll('.menu-barre__liste button'))) {
			if (cibles.get(libelle(bouton)) === null) bouton.remove();
		}
	};
	elaguer();

	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. LES DEUX MENUS — le gel les ouvre par `data-ouvert`, on pose
		      l'attribut. Un clic hors du menu le referme. */
		const declencheur = cible.closest('.menu-barre > button');
		if (declencheur !== null) {
			const menu = declencheur.closest('.menu-barre');
			if (menu === null) return;
			const ouvert = menu.getAttribute('data-ouvert') === 'oui';
			for (const autre of Array.from(document.querySelectorAll('.menu-barre'))) {
				autre.removeAttribute('data-ouvert');
				autre.querySelector('button')?.setAttribute('aria-expanded', 'false');
			}
			if (!ouvert) {
				menu.setAttribute('data-ouvert', 'oui');
				declencheur.setAttribute('aria-expanded', 'true');
			}
			evenement.preventDefault();
			return;
		}

		/* 2. UNE ENTRÉE DE MENU — sa destination vient de son libellé du gel. */
		const entree = cible.closest('.menu-barre__liste button');
		if (entree !== null) {
			const adresse = cibles.get(libelle(entree));
			evenement.preventDefault();
			if (adresse !== null && adresse !== undefined) aller(adresse);
			return;
		}

		/* 3. LA FORME ABRÉGÉE — un seul bouton « Créer », sans menu. Sa destination est
		      celle de l'entrée « Nouvelle note », et non une seconde écriture de la même
		      adresse : sans écriture ouverte, la table la pose à `null`. */
		const abrege = cible.closest('button.btn[title="Créer"]');
		if (abrege !== null && abrege.closest('.menu-barre') === null) {
			evenement.preventDefault();
			const adresse = cibles.get('Nouvelle note');
			if (adresse !== null && adresse !== undefined) aller(adresse);
			return;
		}

		/* 3 bis. L'AVATAR DE LA FORME ABRÉGÉE — vingt-six vues, et aucun menu. Les six
		   classes `.menu-barre*` ne sont déclarées par aucune des deux feuilles des vues
		   abrégées : y ouvrir une liste la rendrait DÉPLIÉE dans la barre. Le bouton mène
		   donc là où mène la première entrée du menu complet, « Mon profil ». */
		const avatar = cible.closest('button.avatar');
		if (avatar !== null && avatar.closest('.menu-barre') === null) {
			evenement.preventDefault();
			aller('/mon-profil');
			return;
		}

		/* 3 ter. LE MODE CONCENTRATION — le rail s'escamote, `V-37:3270`. */
		const bascule = cible.closest('#bascule-rail');
		if (bascule !== null) {
			evenement.preventDefault();
			basculerLeRail(document, bascule);
			return;
		}

		/* 3 quater. LE CHEVRON D'UNE BRANCHE DU RAIL — `V-37:3231`. */
		const chevron = cible.closest('.noeud__chevron');
		if (chevron !== null) {
			evenement.preventDefault();
			basculerLaBranche(chevron);
			return;
		}

		/* 3 quinquies. LA PILE DE NOTIFICATIONS — la croix, et les actions. Le gel donne
		   aux deux le même effet, et c'est tout ce qu'il leur donne : une action de
		   notification est ici un LIBELLÉ et rien d'autre — aucun appelant ne porte de
		   fonction à exécuter. Il reste le retrait, comportement PAR DÉFAUT du gel. */
		const fermeture = cible.closest('.notif__fermer, .notif__actions button');
		if (fermeture !== null) {
			const bulle = fermeture.closest('.notif');
			evenement.preventDefault();
			if (bulle !== null) retirerLaNotification(bulle);
			return;
		}

		/* 4. LA BOÎTE DE RECHERCHE — le gel annonce `Ctrl` `K` sur elle-même, et
		      `UC-M02-01` veut qu'un clic dessus ouvre la MÊME palette que le
		      raccourci. Sans palette montée, elle mène à l'écran de recherche. */
		if (cible.closest('.recherche') !== null) {
			evenement.preventDefault();
			if (contexte.ouvrirLaPalette !== undefined) contexte.ouvrirLaPalette();
			else aller('/recherche');
			return;
		}

		/* Un clic ailleurs referme ce qui est ouvert. */
		for (const menu of Array.from(document.querySelectorAll('.menu-barre[data-ouvert]'))) {
			menu.removeAttribute('data-ouvert');
			menu.querySelector('button')?.setAttribute('aria-expanded', 'false');
		}
	};

	const auClavier = (evenement: KeyboardEvent): void => {
		if (evenement.key === 'Escape') {
			for (const menu of Array.from(document.querySelectorAll('.menu-barre[data-ouvert]'))) {
				menu.removeAttribute('data-ouvert');
				menu.querySelector('button')?.setAttribute('aria-expanded', 'false');
			}
			return;
		}
		/* `Ctrl` `K` — le raccourci que la boîte de recherche affiche elle-même. LA
		   PALETTE L'ÉCOUTE ELLE-MÊME quand elle est montée : elle doit répondre au
		   SECOND appui, alors qu'elle est ouverte, en replaçant le focus dans son
		   champ — ce que ce câblage-ci, qui ne connaît pas son état, ne peut pas
		   faire. Il ne reste ici que le repli, pour les pages sans palette. */
		if (contexte.ouvrirLaPalette !== undefined) return;
		if (evenement.key.toLowerCase() !== 'k' || !(evenement.ctrlKey || evenement.metaKey)) return;
		evenement.preventDefault();
		aller('/recherche');
	};

	document.addEventListener('click', auClic);
	document.addEventListener('keydown', auClavier);
	return () => {
		document.removeEventListener('click', auClic);
		document.removeEventListener('keydown', auClavier);
	};
}
