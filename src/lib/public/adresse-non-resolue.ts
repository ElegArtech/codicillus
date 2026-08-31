/**
 * LA RÉSOLUTION UNIQUE DES ADRESSES NON RÉSOLUES — `ADR-007`. Ce module est le CHEMIN
 * DE CODE UNIQUE que l'ADR impose : `V-04` (public) et `V-26` (connecté) l'appellent
 * toutes les deux, aucune n'a de branche à elle.
 *
 * « L'application ne distingue pas, dans son code de rendu, “la ressource n'existe
 * pas” de “la ressource existe mais vous n'y avez pas droit” : la résolution d'accès
 * rapporte une ressource ou rien, et l'absence de ressource produit V-04. »
 *
 * LA GARANTIE EST PORTÉE PAR LE TYPE : la seule entrée d'`adresseNonResolue()` est le
 * CHEMIN DEMANDÉ. Il n'existe ni paramètre `cas`, ni drapeau `interdit`, ni exception
 * typée « non autorisé » — la fonction n'a RIEN à quoi se raccrocher, et une
 * distinction ne peut pas s'y glisser sans changer la signature.
 *
 * IL NE CONSULTE AUCUNE BASE : il ne sait pas si l'adresse désigne quelque chose.
 * C'est ce qui le rend indiscernable, et ce qui borne sa portée — l'indiscernabilité
 * RÉELLE se joue en amont, dans la résolution d'accès (`ADR-006`). Ce module rend un
 * ÉTAT DE MAQUETTE ; il ne résout aucun droit et ne peut pas prouver `RG-ACC-04`.
 *
 * L'ADR interdit de reconstruire un fil d'Ariane à partir de l'adresse demandée : ce
 * module n'en produit pas.
 */

/**
 * Ce qu'une adresse non résolue met à l'écran, et rien de plus. Les deux champs sont
 * dérivés de la SEULE chaîne demandée — aucun n'est fonction de l'existence, de la
 * visibilité ni des droits : c'est ce qui rend les deux cas indiscernables.
 */
export interface AdresseNonResolue {
	/** L'adresse demandée, restituée telle quelle (`V-04:#adresse`, `V-26:#adresse`). */
	readonly adresse: string;
	readonly requete: string;
}

/**
 * Les termes de recherche tirés d'une adresse. Port fidèle de
 * `requeteDepuisAdresse()` des deux maquettes gelées (`V-04:2117`, `V-26:2604`) : le
 * dernier segment non vide du chemin, tirets et soulignés rendus aux espaces.
 *
 * C'est le SEUL usage fait de l'adresse ; elle n'est jamais confrontée à la base.
 */
export function requeteDepuisAdresse(chemin: string): string {
	const dernier = chemin.split('/').filter(Boolean).pop() ?? '';
	return dernier.replace(/[-_]+/g, ' ').trim();
}

/**
 * LE POINT D'ENTRÉE UNIQUE. Une adresse entre, un état sort — le même état,
 * quelle que soit la raison pour laquelle l'adresse n'a rien rapporté.
 */
export function adresseNonResolue(chemin: string): AdresseNonResolue {
	return { adresse: chemin, requete: requeteDepuisAdresse(chemin) };
}
