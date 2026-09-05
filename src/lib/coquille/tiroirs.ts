/**
 * LE CÂBLAGE DES TIROIRS DE LA COQUILLE — le rail sous 1024 px, la colonne de
 * contexte sous 1180 px.
 *
 * LE RENDU EST SERVEUR ET SANS HYDRATATION : la coquille émet le rail et la colonne
 * de contexte À LEUR PLACE, et c'est le socle qui, sous le seuil, les sort du flux et
 * les rend en tiroir. Ce module ne fait qu'UNE chose : poser `data-tiroir` sur
 * `div.app`. Aucune règle de style n'est écrite ici (P-1, ADR-002), aucune largeur
 * n'est mesurée — le seuil est une requête de média, pas une comparaison en
 * JavaScript, sans quoi le premier rendu serait faux jusqu'au montage.
 *
 * CE QUE LE PRODUIT PROMET SANS SCRIPT : le rail est rendu, ses liens fonctionnent,
 * et les branches du chemin courant sont dépliées par le serveur. Sous 1024 px et
 * sans script, le rail reste hors de l'écran — c'est la seule perte, et elle est
 * bornée : l'en-tête porte le fil d'Ariane, qui remonte l'arborescence.
 *
 * LE CONTRAT EST UN ATTRIBUT, PAS UNE CLASSE : une vue qui porte une colonne de
 * contexte la marque `data-colonne="contexte"`, et son bouton d'ouverture
 * `data-ouvrir-tiroir="contexte"`. La coquille ne connaît donc pas les vues, et une
 * vue n'a rien à câbler.
 */

/** Les deux tiroirs. Un troisième n'aurait pas de place à l'écran. */
export type Tiroir = 'rail' | 'contexte';

const ATTRIBUT = 'data-tiroir';

function cadre(document: Document): Element | null {
	return document.getElementById('app');
}

/** Ouvre un tiroir, en fermant l'autre : deux voiles superposés n'en font qu'un. */
export function ouvrirLeTiroir(document: Document, tiroir: Tiroir): void {
	cadre(document)?.setAttribute(ATTRIBUT, tiroir);
}

/** Ferme les tiroirs. Aucun d'ouvert : sans effet, et c'est bien ce qu'on veut. */
export function fermerLesTiroirs(document: Document): void {
	cadre(document)?.removeAttribute(ATTRIBUT);
}

/**
 * Câble les tiroirs sur le document, par délégation : un changement de page côté
 * client n'a donc rien à recâbler. Rend de quoi se défaire.
 */
export function cablerLesTiroirs(document: Document): () => void {
	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. L'OUVERTURE — ☰ pour le rail, « Contexte » pour la colonne droite. */
		const ouverture = cible.closest('[data-ouvrir-tiroir]');
		if (ouverture !== null) {
			const demande = ouverture.getAttribute('data-ouvrir-tiroir');
			if (demande === 'rail' || demande === 'contexte') {
				evenement.preventDefault();
				ouvrirLeTiroir(document, demande);
			}
			return;
		}

		/* 2. LA FERMETURE — la croix du tiroir, ou le voile. Un clic sur le voile
		      ferme : c'est le geste que tout le monde essaie en premier. */
		if (cible.closest('[data-fermer-tiroir]') !== null) {
			evenement.preventDefault();
			fermerLesTiroirs(document);
			return;
		}

		/* 3. UNE NAVIGATION DEPUIS LE TIROIR le referme — le prototype remet
		      `tiroir: null` à chaque ouverture de page. Sans ça, le tiroir reste
		      ouvert par-dessus la page qu'on vient d'ouvrir. */
		if (cible.closest('a[href]') !== null) fermerLesTiroirs(document);
	};

	const auClavier = (evenement: KeyboardEvent): void => {
		if (evenement.key === 'Escape') fermerLesTiroirs(document);
	};

	/**
	 * LE CHAMP DE RECHERCHE DU RAIL EST UN LIEN, ET IL DOIT LE RESTER : sans script,
	 * il mène à `/recherche`, seule destination de repli réelle. Avec script,
	 * `UC-M02-01` veut qu'il ouvre la palette SANS quitter la page — et
	 * `$lib/cablage/coquille.ts` l'ouvre déjà.
	 *
	 * LES DEUX SE DISPUTAIENT LE CLIC. Le routeur de SvelteKit écoute les clics de
	 * lien sur le document et son écouteur est posé À L'HYDRATATION, donc AVANT celui
	 * du câblage : il naviguait, et la page changeait sous la palette qui venait de
	 * s'ouvrir. Il abandonne quand le défaut est déjà empêché
	 * (`client.js`, `if (event.defaultPrevented) return`), et la PHASE DE CAPTURE est
	 * le seul moment qui précède tout écouteur de bulle, quel que soit l'ordre des
	 * montages. On empêche ici, et rien d'autre : le câblage ouvre, comme avant.
	 */
	const avantTout = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible?.closest('a.recherche') != null) evenement.preventDefault();
	};

	document.addEventListener('click', avantTout, true);
	document.addEventListener('click', auClic);
	document.addEventListener('keydown', auClavier);
	return () => {
		document.removeEventListener('click', avantTout, true);
		document.removeEventListener('click', auClic);
		document.removeEventListener('keydown', auClavier);
	};
}
