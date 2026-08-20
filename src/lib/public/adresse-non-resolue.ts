/**
 * LA RÉSOLUTION UNIQUE DES ADRESSES NON RÉSOLUES — ADR-007.
 *
 * Ce module est le CHEMIN DE CODE UNIQUE que l'ADR impose, et il n'existe que
 * pour cela. `V-04` (public) et `V-26` (connecté) l'appellent toutes les deux ;
 * aucune des deux n'a de branche à elle.
 *
 * CE QUE L'ADR EXIGE, ET CE QUE LA SIGNATURE GARANTIT.
 *
 *   « Une réponse unique, produite par le même chemin de code, sert les deux
 *     cas. L'application ne distingue pas, dans son code de rendu, “la
 *     ressource n'existe pas” de “la ressource existe mais vous n'y avez pas
 *     droit” : la résolution d'accès rapporte une ressource ou rien, et
 *     l'absence de ressource produit V-04. »
 *
 * La garantie n'est pas une intention, elle est PORTÉE PAR LE TYPE : la seule
 * entrée de `adresseNonResolue()` est le CHEMIN DEMANDÉ. Il n'existe ni
 * paramètre `cas`, ni drapeau `interdit`, ni exception typée « non autorisé » —
 * la fonction n'a RIEN à quoi se raccrocher pour distinguer les deux cas, et
 * une distinction ne peut donc pas s'y glisser plus tard sans changer la
 * signature, ce qu'aucune vue ne peut faire seule.
 *
 * CE QUE CE MODULE NE FAIT PAS, ET IL FAUT LE DIRE.
 *
 * Il ne consulte AUCUNE base : il ne sait pas si l'adresse désigne quelque
 * chose. C'est précisément ce qui le rend indiscernable, et c'est aussi ce qui
 * borne sa portée — l'indiscernabilité RÉELLE se joue en amont, dans la
 * résolution d'accès (ADR-006, filtre de périmètre injecté dans la requête),
 * et se prouve par la batterie 6 (`pnpm test:etancheite`, livrée par T-012b le
 * 20/08/2026, et ROUGE : 145 cases vacantes sur 378, cette famille comprise). Ce
 * module rend un ÉTAT DE MAQUETTE ; il ne résout aucun droit, et il ne peut
 * pas prouver `RG-ACC-04`. L'indiscernabilité TEMPORELLE n'est mesurée par
 * rien à ce jour (`docs/releve-vues.md` §10, M-5).
 *
 * L'ADR interdit par ailleurs de reconstruire un fil d'Ariane à partir de
 * l'adresse demandée : ce module n'en produit pas, et n'expose que ce que les
 * deux maquettes affichent — l'adresse telle qu'elle a été demandée, et les
 * termes qu'on en tire pour amorcer la recherche.
 */

/**
 * Ce qu'une adresse non résolue met à l'écran, et rien de plus.
 *
 * Les deux champs sont dérivés de la SEULE chaîne demandée. Aucun n'est
 * fonction de l'existence, de la visibilité ni des droits sur la ressource :
 * c'est ce qui rend les deux cas indiscernables PAR CONSTRUCTION.
 */
export interface AdresseNonResolue {
	/** L'adresse demandée, restituée telle quelle (`V-04:#adresse`, `V-26:#adresse`). */
	readonly adresse: string;
	/** Les termes repris de l'adresse pour amorcer la recherche. Peut être vide. */
	readonly requete: string;
}

/**
 * Les termes de recherche tirés d'une adresse.
 *
 * Port fidèle de `requeteDepuisAdresse()`, écrit à l'identique dans les deux
 * maquettes gelées (`V-04:2117`, et le `CAS[].requete` de `V-26:2604` qui en
 * donne le résultat) : le dernier segment non vide du chemin, tirets et
 * soulignés rendus aux espaces.
 *
 * C'est le SEUL usage fait de l'adresse. Elle n'est jamais confrontée à la
 * base, et la page se comporte à l'identique qu'elle désigne une ressource
 * inexistante ou une ressource existante hors du périmètre de l'appelant.
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
