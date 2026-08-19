/**
 * LA CONNEXION À POSTGRESQL — un seul endroit où les paramètres sont lus.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-13, ET POURQUOI CE MODULE NE COMPOSE PAS D'ADRESSE
 *
 * `CLAUDE.md` §6 P-13 : « le mot de passe PostgreSQL entre dans une URI. Un
 * "/" ou un "+" issu d'un tirage base64 ne se voit QU'À LA PREMIÈRE CONNEXION,
 * et le message n'aide pas. »
 *
 * La parade retenue par T-003 est de tirer le mot de passe en hexadécimal.
 * Elle marche, mais elle repose sur la discipline de l'exploitant : le jour où
 * quelqu'un colle un mot de passe d'entreprise dans `MDP_POSTGRES`, le défaut
 * revient. Ce module ferme le cas plutôt que de l'éviter : quand il compose la
 * connexion à partir des variables séparées, il passe à `pg` un OBJET de
 * configuration — `user`, `password`, `host`, `port`, `database` —, jamais une
 * chaîne. Il n'y a alors plus d'URI, donc plus rien à échapper, et le caractère
 * réservé n'a aucun endroit où nuire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX SOURCES, ET LAQUELLE PRIME
 *
 * `compose.yaml` (T-003) donne à l'application `URL_BASE`, une URI
 * `postgres://…` composée par interpolation dans le fichier de composition.
 * C'est le contrat de déploiement, et il n'est pas rouvert ici : s'il est posé,
 * il est lu tel quel.
 *
 * À défaut — développement, migrations, chargement de semence, tests —, les
 * variables séparées de `.env.example` sont employées : `UTILISATEUR_POSTGRES`,
 * `MDP_POSTGRES`, `BASE_POSTGRES`, `PORT_DB`. Ces noms ont été inventés par
 * T-003 et aucun document ne les fixe (son écart É-4) ; ils sont consommés tels
 * quels, jamais renommés.
 *
 * `HOTE_POSTGRES` n'existe dans aucun document : hors conteneur, la base est
 * publiée sur la boucle locale par `compose.yaml` (`127.0.0.1:${PORT_DB}`),
 * c'est donc la valeur par défaut, et la variable reste lisible pour qui en
 * aurait besoin.
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

/** Ce que ce module lit de l'environnement, et rien d'autre. */
export interface EnvironnementDeConnexion {
	readonly URL_BASE?: string | undefined;
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
 * @param env l'environnement à lire — `process.env` par défaut
 */
export function configurationDeConnexion(env: EnvironnementDeConnexion): PoolConfig {
	const url = nonVide(env.URL_BASE);
	if (url) {
		return { connectionString: url };
	}

	const motDePasse = nonVide(env.MDP_POSTGRES);
	if (!motDePasse) {
		throw new ConnexionNonConfigureeErreur(
			'ni URL_BASE ni MDP_POSTGRES : la connexion à PostgreSQL n’est pas configurée. ' +
				'Voir .env.example (T-003).'
		);
	}

	const port = nonVide(env.PORT_DB);
	const portNumerique = port === undefined ? PORT_PAR_DEFAUT : Number(port);
	if (!Number.isInteger(portNumerique) || portNumerique <= 0 || portNumerique > 65535) {
		throw new ConnexionNonConfigureeErreur(`PORT_DB n’est pas un port valide : ${String(port)}`);
	}

	return {
		host: nonVide(env.HOTE_POSTGRES) ?? HOTE_PAR_DEFAUT,
		port: portNumerique,
		user: nonVide(env.UTILISATEUR_POSTGRES) ?? UTILISATEUR_PAR_DEFAUT,
		password: motDePasse,
		database: nonVide(env.BASE_POSTGRES) ?? BASE_PAR_DEFAUT
	};
}

/**
 * La même configuration, mais sans le mot de passe — ce qu'un journal a le
 * droit d'imprimer. Aucune commande de ce dépôt n'imprime autre chose.
 */
export function connexionLisible(config: PoolConfig): string {
	if (typeof config.connectionString === 'string') {
		try {
			const adresse = new URL(config.connectionString);
			adresse.password = '';
			return `${adresse.protocol}//${adresse.username}@${adresse.host}${adresse.pathname}`;
		} catch {
			return 'URL_BASE (illisible)';
		}
	}
	return `postgres://${String(config.user)}@${String(config.host)}:${String(config.port)}/${String(config.database)}`;
}
