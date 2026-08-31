/**
 * `/console/exports` — LA FABRIQUE D'ADRESSE DE L'ARCHIVE. « Les adresses sortent de
 * `$lib/rangement/adresses.ts`. Jamais de gabarit d'URL écrit à la main. » La
 * fabrique partagée n'en porte aucune qui mène à l'archive :
 * `/console/exports/{univers}/{domaine}` n'est pas une page de rangement, c'est un
 * point de téléchargement — et « un lot qui a besoin d'une fonction nouvelle l'écrit
 * dans son propre `cablage.ts` ».
 *
 * LA DÉSIGNATION EST CANONIQUE, ET C'EST CE QUI REND L'ADRESSE JUSTE : le sélecteur
 * rend un NOM D'AFFICHAGE, la route attend deux identifiants lisibles, et la
 * traduction passe par la table du chargeur — `RG-STR-02` fait de `domaine:support`
 * une désignation AMBIGUË.
 *
 * L'ENCODAGE N'EST PAS UNE PRÉCAUTION DE STYLE : qu'un identifiant lisible ne porte
 * que minuscules, chiffres et tirets est une propriété de `identifiantLisible()`,
 * pas une contrainte de colonne — `domaines.identifiant` est un `text` ordinaire.
 */

export interface DomaineCanonique {
	readonly univers: string;
	readonly domaine: string;
}

/**
 * `/console/exports/{univers}/{domaine}` — l'archive d'un domaine. C'est un
 * `+server.ts` qui répond `application/zip` avec `content-disposition:
 * attachment` : l'adresse se donne à `document.location.assign()`, jamais à
 * `goto()` de SvelteKit, qui attend une page.
 */
export function adresseDeLArchive(canonique: DomaineCanonique): string {
	const univers = encodeURIComponent(canonique.univers);
	const domaine = encodeURIComponent(canonique.domaine);
	return `/console/exports/${univers}/${domaine}`;
}
