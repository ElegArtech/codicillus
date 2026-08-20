/**
 * L'ACCÈS AU MOTEUR DEPUIS L'APPLICATION — un seul client.
 *
 * Même partage que `src/lib/base/acces.ts`, et pour les mêmes raisons :
 *
 *   · `$env/dynamic/private` et non `process.env`. En conteneur les deux se
 *     valent ; en développement, les variables vivent dans le fichier
 *     d'environnement que Vite charge SANS les poser dans `process.env`. Lire
 *     `process.env` marcherait en production et échouerait en développement —
 *     un écart qui ne se voit qu'au premier essai réel. Ce module est par
 *     ailleurs refusé à tout code atteignable depuis le navigateur, ce qui est
 *     exactement la garantie qu'on veut sur une clé.
 *
 *   · Le client est UNIQUE et PARESSEUX. Unique parce qu'il ne porte qu'une
 *     configuration et un agent HTTP ; paresseux parce qu'un module chargé au
 *     démarrage ne doit pas décider qu'un moteur est joignable — la
 *     configuration est lue à la première requête qui en a besoin, et son échec
 *     est alors attribuable à cette requête.
 *
 * CE CLIENT N'EST PAS UN CACHE. `ADR-006` interdit « tout cache d'index ou de
 * résultat partagé entre personas » : ce qui est partagé ici est une
 * configuration et une connexion, jamais un résultat. Aucune réponse du moteur
 * n'est conservée d'une requête à l'autre.
 */
import { env } from '$env/dynamic/private';
import type { Meilisearch } from 'meilisearch';
import { moteurDeRecherche } from './moteur';

let client: Meilisearch | null = null;

/** Le client du moteur, ouvert au premier besoin. */
export function moteurPartage(): Meilisearch {
	if (client === null) client = moteurDeRecherche(env);
	return client;
}

/** Oublie le client. Employé par les épreuves ; le serveur garde le sien. */
export function fermerLeMoteurPartage(): void {
	client = null;
}
