/**
 * LE CÂBLAGE DE LA COQUILLE — la barre supérieure, ses deux menus, sa recherche,
 * le mode concentration, le dépliage du rail et la pile de notifications.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET POURQUOI UNE SEULE FOIS
 *
 * `src/lib/coquille/BarreSuperieure.svelte` est rendue par **trente-quatre
 * vues**. Ses boutons portent des comportements que le gel décrit et que
 * `ARB-011` retire des transcriptions : le menu « Créer », le menu de
 * l'utilisateur, la boîte de recherche. Aucun n'était câblé — la façon la plus
 * évidente de créer une note ne créait rien, et se déconnecter était impossible
 * autrement qu'en tapant l'adresse.
 *
 * Le câblage est posé UNE fois, dans la mise en page racine, par délégation sur
 * le document. Le poser vue par vue en ferait trente-quatre copies, dont trente-
 * trois divergeraient un jour.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN STYLE N'EST ÉCRIT, ET C'EST VÉRIFIABLE
 *
 * Le gel ouvre ses menus par un attribut : `.menu-barre[data-ouvert="oui"]
 * .menu-barre__liste { display: block }` (`V-14.css:119`). Ce module pose donc
 * l'attribut, et rien d'autre. Il ne crée aucun nœud, n'ajoute aucune classe,
 * ne touche à aucune feuille.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-03` — UNE ENTRÉE VISIBLE EST UNE ENTRÉE QUI FONCTIONNE
 *
 * Chaque entrée de menu a une destination réelle, et celles qui n'en ont pas ne
 * sont pas rendues : « Nouveau signet » et « Nouveau dossier » exigent un
 * domaine, et le seul que le produit puisse choisir sans décider à la place de
 * l'utilisateur est celui auquel son compte est rattaché. Sans rattachement,
 * les deux entrées sont retirées plutôt que laissées mortes.
 */

/** Ce que la mise en page sait de l'appelant, et qui décide des destinations. */
export interface ContexteDeCoquille {
	/** Les identifiants d'adresse du domaine de rattachement, ou `null`. */
	rangement: { readonly univers: string; readonly domaine: string } | null;
	/** `RG-DRO-03` — seul l'administrateur voit l'entrée de console. */
	administrateur: boolean;
}

/** L'adresse de chaque entrée du menu « Créer », par son libellé du gel. */
function destinations(contexte: ContexteDeCoquille): Map<string, string | null> {
	const r = contexte.rangement;
	const domaine = r === null ? null : `/univers/${r.univers}/${r.domaine}`;
	return new Map<string, string | null>([
		['Nouvelle note', '/notes/nouvelle'],
		/* LE GESTE VIT SUR LA PAGE D'UN DOSSIER — `#a-sousdossier` et son dialogue,
		   `mockups/V-13-page-dossier.html:1161` et `:1209` : on crée un SOUS-dossier,
		   donc il faut d'abord dire lequel. L'entrée mène à la page du domaine, où
		   l'arborescence est offerte au choix. `…/dossiers` sans chemin n'est pas
		   une adresse du produit — elle rend 404, et `P-03` n'admet pas un lien
		   mort dans un menu. */
		['Nouveau dossier', domaine],
		['Nouveau signet', domaine === null ? null : `${domaine}/signets/nouveau`],
		['Importer des fichiers', '/importer'],
		['Mon profil', '/mon-profil'],
		['Console d’administration', contexte.administrateur ? '/console' : null],
		["Console d'administration", contexte.administrateur ? '/console' : null],
		['Se déconnecter', '/deconnexion']
	]);
}

/** Le libellé d'un nœud, blancs réduits — c'est la clé du gel. */
function libelle(noeud: Element): string {
	return (noeud.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * LE MODE CONCENTRATION — `#bascule-rail`, transcrit de `V-37:3270-3275`.
 *
 * Le gel bascule `data-rail` sur `div.app` et réécrit les deux textes du
 * bouton. La feuille de V-37 fait le reste, et elle seule :
 * `.app[data-rail="ferme"] .rail { display: none }` (`V-37.css:9`). Aucune
 * règle n'est écrite ici, aucun nœud n'est créé.
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
 * LE DÉPLIAGE D'UNE BRANCHE DU RAIL — transcrit de `basculer()`, `V-37:3231`.
 *
 * Le gel pose `data-ouvert` sur le `li` ET sur son `div.noeud` — le premier
 * commande l'affichage des enfants (`V-37:471`), le second l'orientation du
 * chevron (`V-37:463`) — puis accorde `aria-expanded` et `aria-label`. Les deux
 * formes du rail sont servies par le même geste : elles ne diffèrent que par
 * `data-cle` et `type="button"`, dont rien ici ne dépend.
 *
 * LA PERSISTANCE DU GEL N'EST PAS REPRISE. `V-37:3167` garde les branches
 * dépliées dans `localStorage`, parce que sa navigation est entièrement de son
 * côté. Ici, le rail est rendu par le serveur à partir du chemin courant : une
 * mémoire de navigateur qui le contredirait rouvrirait des branches que la page
 * suivante a déjà décidé de fermer.
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
 * LE RETRAIT D'UNE BULLE — transcrit de `retirer()`, `V-38:2344-2348`.
 *
 * L'attribut `data-sortie` est celui du gel, et le socle porte déjà son
 * animation — `.notif[data-sortie="oui"] { animation: descend … }`
 * (`src/socle.css:334`), neutralisée sous `prefers-reduced-motion` par la règle
 * voisine. La bulle quitte le document à la fin de l'animation, comme au gel.
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

		/* 3. LA FORME ABRÉGÉE — un seul bouton « Créer », sans menu. */
		const abrege = cible.closest('button.btn[title="Créer"]');
		if (abrege !== null && abrege.closest('.menu-barre') === null) {
			evenement.preventDefault();
			aller('/notes/nouvelle');
			return;
		}

		/*
		 * 3 bis. L'AVATAR DE LA FORME ABRÉGÉE — vingt-six vues, et aucun menu.
		 *
		 * Les six classes `.menu-barre*` ne sont déclarées par AUCUNE des deux
		 * feuilles des vues abrégées (`BarreSuperieure.svelte` le mesure) : y
		 * ouvrir une liste la rendrait DÉPLIÉE dans la barre. Le bouton mène donc
		 * là où mène la première entrée du menu de la forme complète, « Mon
		 * profil ». C'est la seule destination que le gel nomme et que la forme
		 * abrégée peut atteindre sans qu'on lui dessine un menu qu'elle n'a pas.
		 */
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

		/*
		 * 3 quinquies. LA PILE DE NOTIFICATIONS — la croix, et les actions.
		 *
		 * LE GEL DONNE AUX DEUX LE MÊME EFFET, ET C'EST TOUT CE QU'IL LEUR DONNE.
		 * `V-38:2299` accroche `retirer` à la croix ; `V-38:2321-2325` accroche
		 * aux boutons d'action `a.action()` PUIS `retirer()`, « sauf si
		 * `ferme === false` ». Or une action de notification est ici un LIBELLÉ et
		 * rien d'autre — `Notification.actions` est un `readonly string[]`, et
		 * aucun appelant ne porte de fonction à exécuter. Il reste le retrait,
		 * qui est le comportement PAR DÉFAUT du gel, et qui est réel.
		 */
		const fermeture = cible.closest('.notif__fermer, .notif__actions button');
		if (fermeture !== null) {
			const bulle = fermeture.closest('.notif');
			evenement.preventDefault();
			if (bulle !== null) retirerLaNotification(bulle);
			return;
		}

		/* 4. LA BOÎTE DE RECHERCHE — le gel annonce `Ctrl` `K` sur elle-même. */
		if (cible.closest('.recherche') !== null) {
			evenement.preventDefault();
			aller('/recherche');
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
		/* `Ctrl` `K` — le raccourci que la boîte de recherche affiche elle-même. */
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
