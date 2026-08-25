/**
 * LE CÂBLAGE DES FACETTES — les menus de filtre que le gel dessine et qui
 * n'étaient reliés à rien.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ÉTAT DE FILTRAGE EST DANS L'ADRESSE, ET NULLE PART AILLEURS
 *
 * `RG-M02-06` l'exige pour la recherche — « état de recherche partageable par
 * l'adresse » — et il n'y a aucune raison que la liste des notes d'un domaine
 * obéisse à une autre règle : une liste filtrée qu'on ne peut pas envoyer à un
 * collègue n'est pas une liste filtrée, c'est un écran.
 *
 * Chaque valeur cochée ajoute un couple `{facette}={valeur}` à l'adresse ; à
 * l'intérieur d'une facette les valeurs sont en OU (paramètre répété), entre
 * facettes en ET — la sémantique que `docs/routes.md` §4.2 relève dans le gel.
 * Retirer une pastille retire un couple, « Tout effacer » les retire tous.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUN STYLE N'EST ÉCRIT
 *
 * Le gel ouvre un menu de facette par un attribut : `.fac-menu[data-ouvert="oui"]
 * .fac-menu__panneau { display: block }` (`V-12.css:387`). Ce module pose
 * l'attribut, et rien d'autre.
 */

/** Les six facettes du gel, dans l'ordre où il les déclare. */
export interface DeclarationDeFacette {
	/** La clé du paramètre d'adresse. */
	readonly id: string;
	/** Le libellé que le bouton du gel porte — c'est par lui qu'on le retrouve. */
	readonly nom: string;
	/** Le préfixe que le gel ajoute à la valeur affichée, s'il en ajoute un. */
	readonly prefixe?: string;
}

export interface OptionsDesFacettes {
	readonly facettes: readonly DeclarationDeFacette[];
	/** Les paramètres d'adresse qui ne sont PAS des facettes et qu'on préserve. */
	readonly preserves?: readonly string[];
}

/** L'attribut par lequel un menu rendu dit QUELLE facette il porte. */
export const ATTRIBUT_DE_FACETTE = 'data-facette';

/**
 * LA FACETTE QU'UN MENU RENDU DÉSIGNE — par son identifiant, et par son rang
 * seulement à défaut.
 *
 * Le rang seul MENTAIT. Une vue ne rend un menu que si la facette a au moins
 * une valeur — V-22 écarte les facettes vides, et les étiquettes d'un signet
 * sont facultatives : sur un domaine dont aucun signet n'en porte, le seul
 * menu rendu est « Auteur », au rang 0, et cocher un auteur écrivait
 * `?etiquette={nom de l'auteur}`. L'écran d'arrivée affichait alors la
 * pastille « Étiquette : #{nom} » et « 0 sur N signets ». Le défaut se
 * déclenche au premier signet sans étiquette, et V-12 porte le même risque dès
 * que toutes ses notes sont à la racine.
 *
 * Le libellé ne peut pas servir d'identifiant : le bouton du gel porte le nom
 * SUIVI de son compteur — « Type3 » —, et le découper serait une devinette. Le
 * rang reste le repli pour un balisage qui ne porte pas encore l'attribut.
 */
export function facetteDuMenu(
	facettes: readonly DeclarationDeFacette[],
	identifiant: string | null,
	rang: number
): DeclarationDeFacette | undefined {
	if (identifiant !== null && identifiant !== '') return facettes.find((f) => f.id === identifiant);
	return rang < 0 ? undefined : facettes[rang];
}

/** Le libellé d'un nœud, blancs réduits. */
function libelle(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Câble les menus de facette, les pastilles, « Tout effacer » et le sélecteur
 * d'ordre d'une page de liste. Rend de quoi se défaire.
 */
export function cablerLesFacettes(
	racine: ParentNode & { ownerDocument?: Document | null },
	options: OptionsDesFacettes
): () => void {
	const document = (racine.ownerDocument ?? (racine as unknown as Document)) as Document;
	const fenetre = document.defaultView;
	if (fenetre === null) return () => {};

	const parNom = new Map(options.facettes.map((f) => [f.nom, f]));

	const aller = (adresse: URL): void => document.location.assign(adresse.toString());
	const adresseCourante = (): URL => new URL(document.location.href);

	/** La valeur nue d'une étiquette affichée — le préfixe du gel retiré. */
	const valeurNue = (facette: DeclarationDeFacette, affichee: string): string =>
		facette.prefixe !== undefined && affichee.startsWith(facette.prefixe)
			? affichee.slice(facette.prefixe.length)
			: affichee;

	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. OUVRIR OU FERMER UN MENU DE FACETTE — par l'attribut du gel. */
		const bouton = cible.closest('.fac-menu__bouton');
		if (bouton !== null) {
			const menu = bouton.closest('.fac-menu');
			const ouvert = menu?.getAttribute('data-ouvert') === 'oui';
			for (const autre of Array.from(racine.querySelectorAll('.fac-menu'))) {
				autre.removeAttribute('data-ouvert');
				autre.querySelector('.fac-menu__bouton')?.setAttribute('aria-expanded', 'false');
			}
			if (!ouvert && menu !== null && menu !== undefined) {
				menu.setAttribute('data-ouvert', 'oui');
				bouton.setAttribute('aria-expanded', 'true');
			}
			evenement.preventDefault();
			return;
		}

		/* 2. RETIRER UNE PASTILLE — son libellé porte « Facette : valeur ». */
		const retrait = cible.closest('.filtre button');
		if (retrait !== null) {
			const pastille = retrait.closest('.filtre');
			const texte = libelle(pastille);
			const separateur = texte.indexOf(' : ');
			if (separateur < 0) return;
			const facette = parNom.get(texte.slice(0, separateur));
			if (facette === undefined) return;
			const valeur = valeurNue(facette, texte.slice(separateur + 3));
			const adresse = adresseCourante();
			const restantes = adresse.searchParams.getAll(facette.id).filter((v) => v !== valeur);
			adresse.searchParams.delete(facette.id);
			for (const v of restantes) adresse.searchParams.append(facette.id, v);
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 3. TOUT EFFACER — les facettes seules ; ce qui n'en est pas reste. */
		if (cible.closest('.actifs__vider') !== null) {
			const adresse = adresseCourante();
			for (const f of options.facettes) adresse.searchParams.delete(f.id);
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* Un clic ailleurs referme les menus. */
		if (cible.closest('.fac-menu') === null) {
			for (const menu of Array.from(racine.querySelectorAll('.fac-menu[data-ouvert]'))) {
				menu.removeAttribute('data-ouvert');
				menu.querySelector('.fac-menu__bouton')?.setAttribute('aria-expanded', 'false');
			}
		}
	};

	const auChangement = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 4. COCHER OU DÉCOCHER UNE VALEUR. */
		const boite = cible.closest('.fac-menu .val');
		if (boite !== null) {
			/* LA FACETTE SE RECONNAÎT À SON IDENTIFIANT, que le menu rendu porte.
			   Voir `facetteDuMenu()` : le rang seul se décale dès qu'une vue
			   n'émet pas un menu, et il écrivait alors la mauvaise clé. */
			const menu = boite.closest('.fac-menu');
			const menus = Array.from(racine.querySelectorAll('.fac-menu'));
			const rang = menu === null ? -1 : menus.indexOf(menu);
			const declaration = facetteDuMenu(
				options.facettes,
				menu?.getAttribute(ATTRIBUT_DE_FACETTE) ?? null,
				rang
			);
			const nom = libelle(boite.querySelector('.val__nom'));
			if (declaration === undefined) return;
			const valeur = valeurNue(declaration, nom);
			const adresse = adresseCourante();
			const posees = adresse.searchParams.getAll(declaration.id);
			const coche = (cible as HTMLInputElement).checked;
			const suite = coche ? [...posees, valeur] : posees.filter((v) => v !== valeur);
			adresse.searchParams.delete(declaration.id);
			for (const v of new Set(suite)) adresse.searchParams.append(declaration.id, v);
			aller(adresse);
			return;
		}

		/* 5. L'ORDRE — les quatre valeurs du gel, portées par l'adresse. */
		if ((cible as HTMLElement).id === 'tri') {
			const adresse = adresseCourante();
			adresse.searchParams.set('tri', (cible as HTMLSelectElement).value);
			aller(adresse);
		}
	};

	racine.addEventListener('click', auClic);
	racine.addEventListener('change', auChangement);
	return () => {
		racine.removeEventListener('click', auClic);
		racine.removeEventListener('change', auChangement);
	};
}
