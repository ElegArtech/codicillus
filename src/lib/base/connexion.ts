/**
 * LA CONNEXION À POSTGRESQL — un seul endroit où les paramètres sont lus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-13, ARB-038, ARB-050 — POURQUOI CE MODULE NE COMPOSE, NI N'ACCEPTE, AUCUNE
 * ADRESSE
 *
 * `ARB-038` (19/08/2026) : « LA BASE SE CONFIGURE PAR VARIABLES SÉPARÉES,
 * JAMAIS PAR UNE URI. […] Le connecteur reçoit un OBJET, jamais une chaîne —
 * rien n'est concaténé, donc rien n'est à échapper. […] `URL_BASE` disparaît du
 * contrat de déploiement. »
 *
 * `ARB-050` (T-012) a constaté que ce module ne l'appliquait pas : son
 * interface ne déclarait AUCUNE des cinq variables `*_BASE` que `compose.yaml`
 * passe au service `app`, et son premier chemin rendait `{ connectionString }`
 * — une chaîne, donc la porte de derrière de `P-13`, mesuré par T-010 sur six
 * mots de passe : `mot/de+passe`, `mot#passe` et `mot?passe` tuent le service.
 *
 * DEUX CONSÉQUENCES, DONT UNE PANNE FRANCHE : l'application en conteneur
 * recevait cinq variables qu'elle ne lisait pas, et aucune de celles qu'elle
 * lisait — donc `ConnexionNonConfigureeErreur` au démarrage.
 *
 * Le chemin `URL_BASE` est RETIRÉ, sans période de tolérance. Deux unitaires
 * l'exercent (`connexion.test.ts`) : l'un échoue si l'URI redevient acceptée,
 * l'autre exige que les cinq `*_BASE` produisent un objet dont
 * `connectionString` est absent. Sans le second, la correction serait espérée
 * et non posée — c'est `P-5`, et c'est précisément pourquoi le défaut a survécu
 * à une batterie verte : rien n'exerçait le chemin de l'application
 * conteneurisée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX JEUX DE VARIABLES, ET ILS NE SE CONFONDENT PAS
 *
 * `ARB-038` : « `.env.example` garde ses noms `*_POSTGRES` — ils nomment la
 * configuration du CONTENEUR PostgreSQL, qui les attend sous cette forme ; les
 * `*_BASE` nomment la configuration du CLIENT. Les deux jeux ne se confondent
 * pas, et c'est voulu. »
 *
 *   `HOTE_BASE` `PORT_BASE` `UTILISATEUR_BASE` `MDP_BASE` `NOM_BASE`
 *        le CLIENT — ce que `compose.yaml` passe au service `app`
 *
 *   `UTILISATEUR_POSTGRES` `MDP_POSTGRES` `BASE_POSTGRES` `HOTE_POSTGRES`
 *   `PORT_DB`
 *        le SERVEUR — ce que le conteneur PostgreSQL attend, et ce que les
 *        commandes de base emploient hors conteneur (`base/base.mjs` charge
 *        `.env`, qui ne porte que ce jeu)
 *
 * L'ORDRE EST DONC : les `*_BASE` d'abord, les `*_POSTGRES` à défaut. Il n'est
 * pas une préférence, il est le contrat de déploiement — en conteneur, seules
 * les premières existent ; hors conteneur, seules les secondes.
 */
import type { PoolConfig } from 'pg';

/** Le nom d'hôte employé hors conteneur : `compose.yaml` publie la base là. */
export const HOTE_PAR_DEFAUT = '127.0.0.1';

/** Le port publié par défaut sur la boucle locale (`.env.example`). */
export const PORT_PAR_DEFAUT = 19432;

/** L'utilisateur et la base par défaut (`.env.example`, `compose.yaml`). */
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
 * Ce que ce module lit de l'environnement, et rien d'autre.
 *
 * `URL_BASE` N'Y FIGURE PLUS — ARB-050. Le type est la garantie : un appelant
 * qui voudrait la repasser n'a plus de champ où l'écrire, et le retrait ne
 * dépend donc pas d'une discipline de relecture.
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
 * La configuration de connexion, dérivée de l'environnement.
 *
 * Elle rend TOUJOURS un objet de paramètres séparés. Aucun chemin de cette
 * fonction ne produit `connectionString` : c'est ce que le second unitaire
 * d'ARB-050 vérifie, et c'est ce qui rend `P-13` inaccessible par la forme.
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
		database: nonVide(env.NOM_BASE) ?? nonVide(env.BASE_POSTGRES) ?? BASE_PAR_DEFAUT
	};
}

/**
 * La même configuration, mais sans le mot de passe — ce qu'un journal a le
 * droit d'imprimer. Aucune commande de ce dépôt n'imprime autre chose.
 *
 * La branche `connectionString` a disparu avec le chemin qu'elle servait
 * (ARB-050) : il n'existe plus de configuration de ce dépôt qui en porte une.
 */
export function connexionLisible(config: PoolConfig): string {
	return `postgres://${String(config.user)}@${String(config.host)}:${String(config.port)}/${String(config.database)}`;
}
