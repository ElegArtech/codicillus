/**
 * L'ACCÈS À LA BASE DEPUIS L'APPLICATION — un seul groupe de connexions.
 *
 * `base/base.mjs` ouvre sa session par `ouvrir()` de `commandes.ts` : c'est le
 * chemin des COMMANDES, hors serveur. Ce module est le chemin de
 * l'APPLICATION, et il est distinct pour une raison de fait :
 * `commandes.ts` importe `seeds/corpus.ts` et les fabriques de semence, qui
 * n'ont rien à faire dans le graphe du serveur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI `$env/dynamic/private` ET NON `process.env`
 *
 * `ARB-038` et `ARB-050` veulent les cinq `*_BASE` lues à l'exécution. En
 * conteneur, elles sont dans l'environnement du processus, et les deux sources
 * se valent. En développement, elles vivent dans `.env` : Vite les charge, mais
 * NE LES POSE PAS dans `process.env`. Lire `process.env` marcherait donc en
 * production et échouerait en développement — un écart d'environnement qui ne se
 * voit qu'au premier essai réel.
 *
 * `$env/dynamic/private` rend les deux : l'environnement du processus, complété
 * des fichiers `.env` chargés. Il est refusé à tout module atteignable depuis le
 * navigateur, ce qui est exactement la garantie qu'on veut sur un mot de passe.
 *
 * LE GROUPE EST UNIQUE ET PARESSEUX. Unique, parce qu'un groupe par requête
 * épuiserait les connexions du serveur ; paresseux, parce qu'un module chargé
 * au démarrage ne doit pas décider qu'une base est joignable — la configuration
 * est lue à la première requête qui en a besoin, et son échec est alors
 * attribuable à cette requête.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '$env/dynamic/private';
import { configurationDeConnexion } from './connexion';
import { schema } from './schema';

/** La base telle que l'application l'interroge — typée par le schéma. */
export type Base = ReturnType<typeof drizzle<typeof schema>>;

let base: Base | null = null;
let groupe: pg.Pool | null = null;

/** Le groupe de connexions du serveur, ouvert au premier besoin. */
export function basePartagee(): Base {
	if (base === null) {
		groupe = new pg.Pool(configurationDeConnexion(env));
		base = drizzle(groupe, { schema });
	}
	return base;
}

/**
 * Ferme le groupe. Employé par les épreuves qui ouvrent une base et veulent
 * rendre la main : le serveur, lui, garde son groupe pour sa durée de vie.
 */
export async function fermerLaBasePartagee(): Promise<void> {
	const aFermer = groupe;
	groupe = null;
	base = null;
	if (aFermer !== null) await aFermer.end();
}
