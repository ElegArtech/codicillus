/**
 * LE CÂBLAGE DE LA COQUILLE — la barre supérieure, ses deux menus, sa recherche.
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
