/**
 * LA CONNEXION À POSTGRESQL — un seul endroit où les paramètres sont lus.
 *
 * `P-13`, `ARB-038` : LA BASE SE CONFIGURE PAR VARIABLES SÉPARÉES, JAMAIS PAR UNE
 * URI. Le connecteur reçoit un OBJET, jamais une chaîne — rien n'est concaténé, donc
 * rien n'est à échapper. Un `/`, `#` ou `?` dans un mot de passe tue le service.
 * `URL_BASE` n'existe plus, sans période de tolérance ; deux unitaires échouent si
 * l'URI redevient acceptée ou si `connectionString` reparaît.
 *
 * DEUX JEUX DE VARIABLES QUI NE SE CONFONDENT PAS (`ARB-038`) :
 *
 *   `HOTE_BASE` `PORT_BASE` `UTILISATEUR_BASE` `MDP_BASE` `NOM_BASE`
 *        le CLIENT — ce que `compose.yaml` passe au service `app`
 *
 *   `UTILISATEUR_POSTGRES` `MDP_POSTGRES` `BASE_POSTGRES` `HOTE_POSTGRES` `PORT_DB`
 *        le SERVEUR — ce que le conteneur PostgreSQL attend, et ce que les commandes
 *        de base emploient hors conteneur (`base/base.mjs` charge `.env`, qui ne
 *        porte que ce jeu)
 *
 * L'ORDRE EST DONC : les `*_BASE` d'abord, les `*_POSTGRES` à défaut. Ce n'est pas
 * une préférence, c'est le contrat de déploiement — en conteneur, seules les
 * premières existent ; hors conteneur, seules les secondes.
 */
import type { PoolConfig } from 'pg';

/** Le nom d'hôte employé hors conteneur : `compose.yaml` publie la base là. */
export const HOTE_PAR_DEFAUT = '127.0.0.1';

/** Le port publié par défaut sur la boucle locale (`.env.example`). */
export const PORT_PAR_DEFAUT = 19432;

/** L'utilisateur et la base par défaut (`.env.example`, `compose.yaml`). */
/** Le temps qu'une requête attend une connexion avant d'échouer franchement. */
export const DELAI_DE_CONNEXION_MS = 5_000;

export const UTILISATEUR_PAR_DEFAUT = 'codicillus';
export const BASE_PAR_DEFAUT = 'codicillus';

/** Levée quand aucun paramètre exploitable n'est disponible. */
export class ConnexionNonConfigureeErreur extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConnexionNonConfigureeErreur';
	}
}

/**
 * Ce que ce module lit de l'environnement, et rien d'autre. `URL_BASE` n'y figure
 * pas : un appelant qui voudrait la repasser n'a plus de champ où l'écrire.
 */
export interface EnvironnementDeConnexion {
	/* Le CLIENT — `compose.yaml`, service `app` (ARB-038). */
	readonly HOTE_BASE?: string | undefined;
	readonly PORT_BASE?: string | undefined;
	readonly UTILISATEUR_BASE?: string | undefined;
	readonly MDP_BASE?: string | undefined;
	readonly NOM_BASE?: string | undefined;
	/* Le SERVEUR PostgreSQL — `.env.example`, et les commandes de base. */
	readonly UTILISATEUR_POSTGRES?: string | undefined;
	readonly MDP_POSTGRES?: string | undefined;
	readonly BASE_POSTGRES?: string | undefined;
	readonly HOTE_POSTGRES?: string | undefined;
	readonly PORT_DB?: string | undefined;
}

function nonVide(valeur: string | undefined): string | undefined {
	const net = valeur?.trim();
	return net ? net : undefined;
}

/**
 * La configuration de connexion, dérivée de l'environnement. Elle rend TOUJOURS un
 * objet de paramètres séparés : aucun chemin ne produit `connectionString`.
 *
 * @param env l'environnement à lire
 */
export function configurationDeConnexion(env: EnvironnementDeConnexion): PoolConfig {
	/* Le mot de passe est le seul paramètre sans défaut possible : il décide
	   lequel des deux jeux est présent, et son absence est la seule panne de
	   configuration que ce module puisse constater. */
	const motDePasse = nonVide(env.MDP_BASE) ?? nonVide(env.MDP_POSTGRES);
	if (!motDePasse) {
		throw new ConnexionNonConfigureeErreur(
			'ni MDP_BASE (client, compose.yaml) ni MDP_POSTGRES (serveur, .env) : la ' +
				'connexion à PostgreSQL n’est pas configurée. Voir .env.example et ARB-038.'
		);
	}

	const port = nonVide(env.PORT_BASE) ?? nonVide(env.PORT_DB);
	const portNumerique = port === undefined ? PORT_PAR_DEFAUT : Number(port);
	if (!Number.isInteger(portNumerique) || portNumerique <= 0 || portNumerique > 65535) {
		throw new ConnexionNonConfigureeErreur(
			`PORT_BASE / PORT_DB n’est pas un port valide : ${String(port)}`
		);
	}

	return {
		host: nonVide(env.HOTE_BASE) ?? nonVide(env.HOTE_POSTGRES) ?? HOTE_PAR_DEFAUT,
		port: portNumerique,
		user:
			nonVide(env.UTILISATEUR_BASE) ?? nonVide(env.UTILISATEUR_POSTGRES) ?? UTILISATEUR_PAR_DEFAUT,
		password: motDePasse,
		database: nonVide(env.NOM_BASE) ?? nonVide(env.BASE_POSTGRES) ?? BASE_PAR_DEFAUT,
		/**
		 * UNE ATTENTE BORNÉE, PARCE QUE LE DÉFAUT EST L'INFINI.
		 *
		 * `connectionTimeoutMillis` vaut 0 chez `pg` — une requête qui demande une
		 * connexion à une base absente attend POUR TOUJOURS. Le groupe se remplit
		 * de requêtes suspendues, et le serveur cesse de répondre : pas un 500,
		 * pas une page d'erreur, RIEN. Mesuré sur l'instance de recette le 1er
		 * septembre, en arrêtant la base sous le serveur — `curl` rend 000, et le
		 * retour de la base ne ramenait rien.
		 *
		 * Cinq secondes : une base lente ou qui redémarre a le temps de répondre,
		 * et au-delà l'appelant reçoit une erreur franche plutôt qu'un écran qui
		 * ne vient jamais. C'est ce qui permet au serveur de se rétablir seul —
		 * les connexions suspendues libèrent le groupe, et la requête suivante
		 * trouve une base revenue.
		 */
		connectionTimeoutMillis: DELAI_DE_CONNEXION_MS
	};
}

/**
 * La même configuration, sans le mot de passe — ce qu'un journal a le droit
 * d'imprimer. Aucune commande de ce dépôt n'imprime autre chose.
 */
export function connexionLisible(config: PoolConfig): string {
	return `postgres://${String(config.user)}@${String(config.host)}:${String(config.port)}/${String(config.database)}`;
}
