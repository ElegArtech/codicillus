/**
 * L'ACCÈS À LA BASE DEPUIS L'APPLICATION — un seul groupe de connexions.
 *
 * `base/base.mjs` ouvre sa session par `ouvrir()` de `commandes.ts` : c'est le chemin des
 * COMMANDES, hors serveur. Ce module est le chemin de l'APPLICATION, et il est distinct pour
 * une raison de fait : `commandes.ts` importe `seeds/corpus.ts` et les fabriques de semence,
 * qui n'ont rien à faire dans le graphe du serveur.
 *
 * `$env/dynamic/private` ET NON `process.env` : `ARB-038` et `ARB-050` veulent les cinq
 * `*_BASE` lues à l'exécution. En développement, elles vivent dans `.env` : Vite les charge,
 * mais NE LES POSE PAS dans `process.env` — lire `process.env` marcherait donc en production et
 * échouerait en développement. `$env/dynamic/private` rend les deux, et il est refusé à tout
 * module atteignable depuis le navigateur.
 *
 * LE GROUPE EST UNIQUE ET PARESSEUX. Unique, parce qu'un groupe par requête épuiserait les
 * connexions ; paresseux, parce qu'un module chargé au démarrage ne doit pas décider qu'une
 * base est joignable.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '$env/dynamic/private';
import { configurationDeConnexion } from './connexion';
import { schema } from './schema';

export type Base = ReturnType<typeof drizzle<typeof schema>>;

/**
 * CE QUI EXÉCUTE UNE REQUÊTE — la base, ou la TRANSACTION en cours. La forme se déduit de
 * `Base` plutôt que de s'écrire : elle suit donc le connecteur sans qu'on y pense.
 *
 * Elle existe pour les fonctions qui doivent être appelées DANS une transaction ouverte
 * ailleurs — l'écriture d'une trace de suppression, la renumérotation des rangs. Leur
 * signature doit pouvoir recevoir un `tx`, sinon la seule façon de les appeler serait hors
 * de la transaction, c'est-à-dire au mauvais moment.
 */
export type ExecuteurDeBase = Base | Parameters<Parameters<Base['transaction']>[0]>[0];

let base: Base | null = null;
let groupe: pg.Pool | null = null;

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
