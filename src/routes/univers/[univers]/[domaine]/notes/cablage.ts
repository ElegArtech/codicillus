/**
 * LE CÂBLAGE DE V-12 — ce que `cablerLesFacettes()` ne couvre pas.
 *
 * `$lib/cablage/facettes.ts` porte les menus de facette, les pastilles de filtre
 * actif, « Tout effacer » et le sélecteur d'ordre. La seule chose partagée avec
 * lui est la LISTE DES CLÉS de facette, dont « Réinitialiser les filtres » a
 * besoin : elle est passée en option plutôt que recopiée — un contrat de données
 * recopié dans deux modules diverge en silence (`P-35`).
 *
 * SIX GESTES, DEUX NATURES. QUATRE NAVIGATIONS — l'éditeur pré-réglé sur ce
 * domaine, l'import, et la même adresse sans ses facettes.
 *
 * DEUX ÉTATS D'INTERFACE, POSÉS PAR ATTRIBUT ET JAMAIS PAR STYLE :
 * `.app[data-filtres="ouvert"] .filtres-barre { display: flex }` ouvre le panneau
 * escamotable des petits écrans, `.liste[data-densite="compact"]` resserre les
 * lignes. Le gel porte les deux règles ; ce module pose l'attribut.
 */

export type Debranchement = () => void;

const ADRESSE_DE_LIMPORT = '/importer';
const ADRESSE_DE_LA_NOUVELLE_NOTE = '/notes/nouvelle';

export interface OptionsDeLaListe {
	readonly domaine: string;
	/** Les clés de facette de l'adresse — celles que « Réinitialiser » retire. */
	readonly facettes: readonly string[];
}

function libelle(noeud: Element | null | undefined): string {
	return (noeud?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function cablerLaListeDeNotes(
	racine: HTMLElement,
	options: OptionsDeLaListe
): Debranchement {
	const document = racine.ownerDocument;
	const fenetre = document.defaultView;
	if (fenetre === null) return () => {};

	for (const bouton of Array.from(racine.querySelectorAll('button'))) {
		if (!bouton.hasAttribute('type')) bouton.type = 'button';
	}

	const aller = (adresse: string | URL): void => {
		document.location.assign(adresse.toString());
	};

	/** L'éditeur, pré-réglé sur ce domaine — `ARB-038` appliqué à une adresse. */
	const adresseDeLaNouvelleNote = (): URL => {
		const adresse = new URL(ADRESSE_DE_LA_NOUVELLE_NOTE, document.location.origin);
		adresse.searchParams.set('domaine', options.domaine);
		return adresse;
	};

	const auClic = (evenement: Event): void => {
		const cible = evenement.target as Element | null;
		if (cible === null) return;

		/* 1. NOUVELLE NOTE — l'action de la barre de titre, et sa jumelle de
		   l'état vide. Le gel ne donne pas d'identifiant à la seconde : elle se
		   reconnaît à son libellé, dans le bloc qui n'accueille qu'elle. */
		const vide = cible.closest('.vide-liste__actions .btn');
		if (cible.closest('#creer') !== null || libelle(vide) === 'Créer la première note') {
			evenement.preventDefault();
			aller(adresseDeLaNouvelleNote());
			return;
		}

		/* 2. IMPORTER DANS CE DOMAINE — l'écran d'import, qui porte le geste. */
		if (libelle(vide) === 'Importer dans ce domaine') {
			evenement.preventDefault();
			aller(ADRESSE_DE_LIMPORT);
			return;
		}

		/* 3. RÉINITIALISER LES FILTRES — la même adresse, ses facettes retirées.
		   `tri` survit : ce n'est pas un filtre, et le gel ne le remet pas. La PAGE,
		   elle, ne survit pas : le résultat élargi n'a plus les mêmes pages. */
		if (libelle(vide) === 'Réinitialiser les filtres') {
			const adresse = new URL(document.location.href);
			for (const cle of options.facettes) adresse.searchParams.delete(cle);
			adresse.searchParams.delete('page');
			evenement.preventDefault();
			aller(adresse);
			return;
		}

		/* 4. LE PANNEAU ESCAMOTABLE DES FILTRES — `V-12.css:545`, par attribut. */
		if (cible.closest('#ouvrir-filtres') !== null) {
			const app = racine.querySelector('.app');
			if (app === null) return;
			const ouvert = app.getAttribute('data-filtres') === 'ouvert';
			app.setAttribute('data-filtres', ouvert ? 'ferme' : 'ouvert');
			evenement.preventDefault();
			return;
		}

		/* 5. LA DENSITÉ D'AFFICHAGE — `V-12.css:494`, par attribut. Le groupe est
		   une paire de bascules : la pressée est celle qui gouverne la liste. */
		const densite = cible.closest('.densite button');
		if (densite !== null) {
			const valeur = densite.getAttribute('data-densite');
			if (valeur === null) return;
			for (const autre of Array.from(racine.querySelectorAll('.densite button'))) {
				autre.setAttribute('aria-pressed', autre === densite ? 'true' : 'false');
			}
			racine.querySelector('#liste')?.setAttribute('data-densite', valeur);
			evenement.preventDefault();
		}
	};

	racine.addEventListener('click', auClic);
	return () => {
		racine.removeEventListener('click', auClic);
	};
}
