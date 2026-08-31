/**
 * LA CONNEXION AU MOTEUR DE RECHERCHE — un seul endroit où les paramètres sont lus,
 * et la clé n'entre JAMAIS dans une adresse.
 *
 * `P-13` a été mesuré sur PostgreSQL : un `/`, un `#` ou un `?` dans un secret fait
 * sortir l'application au démarrage sans nommer la cause. La parade d'`ARB-038` est
 * de FORME — variables séparées, rien de concaténé, donc rien à échapper —, et le
 * client de recherche s'y prête : il prend une adresse ET une clé en DEUX champs
 * distincts. Ce que ce module compose, hors conteneur seulement, est une adresse de
 * boucle locale et un PORT dont il vérifie qu'il est une suite de chiffres.
 *
 * DEUX JEUX DE VARIABLES QUI NE SE CONFONDENT PAS :
 *
 *   `URL_RECHERCHE` `CLE_RECHERCHE`
 *        le CLIENT — ce que `compose.yaml` passe au service applicatif.
 *   `PORT_RECHERCHE` `CLE_MAITRE_RECHERCHE`
 *        le SERVEUR — ce que le conteneur du moteur attend, et ce que les commandes
 *        hors conteneur emploient. `compose.yaml` publie le moteur sur la boucle
 *        locale et nulle part ailleurs : l'hôte n'est donc pas une variable.
 *
 * L'ORDRE EST DONC : le client d'abord, le serveur à défaut. Ce n'est pas une
 * préférence, c'est le contrat de déploiement.
 */

/** L'hôte employé hors conteneur : `compose.yaml` publie le moteur là. */
export const HOTE_PAR_DEFAUT = '127.0.0.1';

/** Le port publié par défaut sur la boucle locale (fichier d'exemple). */
export const PORT_PAR_DEFAUT = '19700';

/** Levée quand aucun paramètre exploitable n'est disponible. */
export class RechercheNonConfigureeErreur extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RechercheNonConfigureeErreur';
	}
}

/**
 * Ce que ce module lit de l'environnement, et rien d'autre. Aucun champ ne porte une
 * adresse contenant un secret, et le type est la garantie : un appelant qui voudrait
 * en composer une n'a pas de champ où l'écrire.
 */
export interface EnvironnementDeRecherche {
	/* Le CLIENT — `compose.yaml`, service applicatif. */
	readonly URL_RECHERCHE?: string | undefined;
	readonly CLE_RECHERCHE?: string | undefined;
	/* Le SERVEUR — fichier d'environnement du dépôt, et les commandes. */
	readonly PORT_RECHERCHE?: string | undefined;
	readonly CLE_MAITRE_RECHERCHE?: string | undefined;
}

export interface ConfigurationDeRecherche {
	readonly host: string;
	readonly apiKey: string;
}

function nonVide(valeur: string | undefined): string | undefined {
	const net = valeur?.trim();
	return net ? net : undefined;
}

/**
 * La configuration du moteur, dérivée de l'environnement. La CLÉ décide lequel des
 * deux jeux est présent, et son absence est la seule panne de configuration que ce
 * module puisse constater. Le moteur est une brique CRITIQUE : son absence de
 * configuration n'est pas un état dégradé, c'est une erreur de déploiement.
 */
export function configurationDeRecherche(env: EnvironnementDeRecherche): ConfigurationDeRecherche {
	const cle = nonVide(env.CLE_RECHERCHE) ?? nonVide(env.CLE_MAITRE_RECHERCHE);
	if (cle === undefined) {
		throw new RechercheNonConfigureeErreur(
			'ni CLE_RECHERCHE (client, compose.yaml) ni CLE_MAITRE_RECHERCHE (serveur) : ' +
				'le moteur de recherche n’est pas configuré. Voir le fichier d’exemple et ARB-038.'
		);
	}

	const adresse = nonVide(env.URL_RECHERCHE);
	if (adresse !== undefined) return { host: adresse, apiKey: cle };

	/* Hors conteneur : un port, et un port seulement. Un port qui n'est pas une
	   suite de chiffres est REFUSÉ, jamais inséré — c'est la seule composition
	   que ce module fasse, et elle ne porte aucun secret. */
	const port = nonVide(env.PORT_RECHERCHE) ?? PORT_PAR_DEFAUT;
	if (!/^\d+$/.test(port)) {
		throw new RechercheNonConfigureeErreur(
			`PORT_RECHERCHE vaut « ${port} », qui n’est pas un port : aucune adresse n’est composée.`
		);
	}
	return { host: `http://${HOTE_PAR_DEFAUT}:${port}`, apiKey: cle };
}

/**
 * L'adresse, telle qu'on peut l'imprimer — la clé n'y est jamais, et il n'y a
 * rien à masquer puisqu'elle n'y entre pas.
 */
export function rechercheLisible(config: ConfigurationDeRecherche): string {
	return config.host;
}
