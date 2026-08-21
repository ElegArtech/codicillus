/**
 * `/console/exports` — LA FABRIQUE D'ADRESSE DE L'ARCHIVE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE FONCTION, ET POURQUOI ICI
 *
 * Le plan de remédiation §3.3 est sans réserve : « Les adresses sortent de
 * `$lib/rangement/adresses.ts`. Jamais de gabarit d'URL écrit à la main. » La
 * fabrique partagée porte onze fonctions et AUCUNE ne mène à l'archive :
 * `/console/exports/{univers}/{domaine}` n'est pas une page de rangement, c'est
 * un point de téléchargement (`docs/routes.md` §3.6, « aucune vue »).
 *
 * Le §4 tranche le cas exactement : « Un lot qui a besoin d'une fonction
 * nouvelle l'écrit dans son propre `cablage.ts` » — `$lib/rangement/adresses.ts`
 * est en LECTURE SEULE pour les huit lots. Cette fonction vit donc à côté de la
 * route qui l'emploie, et d'aucune autre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA DÉSIGNATION EST CANONIQUE, ET C'EST CE QUI REND L'ADRESSE JUSTE
 *
 * Le sélecteur de V-36 rend un NOM D'AFFICHAGE — « Infrastructure » —, la route
 * attend deux identifiants lisibles — `production/infrastructure`. La traduction
 * passe par la table que le chargeur a servie (`lireLesDesignationsDeDomaine`),
 * jamais par une réduction devinée du nom : `RG-STR-02` fait de `domaine:support`
 * une désignation AMBIGUË, et deux univers peuvent porter un domaine de même nom.
 *
 * L'ENCODAGE N'EST PAS UNE PRÉCAUTION DE STYLE. Un identifiant lisible ne porte
 * que des minuscules, des chiffres et des tirets — mais c'est une propriété de
 * `identifiantLisible()`, pas une contrainte de colonne : `domaines.identifiant`
 * est un `text` ordinaire, qu'une migration ou une reprise de données peut
 * remplir autrement. On encode ce qu'on ne contrôle pas.
 */

/** La forme canonique d'un domaine, telle que le chargeur la sert. */
export interface DomaineCanonique {
	readonly univers: string;
	readonly domaine: string;
}

/**
 * `/console/exports/{univers}/{domaine}` — l'archive d'un domaine.
 *
 * C'est un `+server.ts` qui répond `application/zip` avec
 * `content-disposition: attachment` : l'adresse se donne à
 * `document.location.assign()`, jamais à `goto()` de SvelteKit, qui attend une
 * page et ne saurait qu'en faire.
 */
export function adresseDeLArchive(canonique: DomaineCanonique): string {
	const univers = encodeURIComponent(canonique.univers);
	const domaine = encodeURIComponent(canonique.domaine);
	return `/console/exports/${univers}/${domaine}`;
}
