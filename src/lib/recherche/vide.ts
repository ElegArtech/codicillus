/**
 * POURQUOI IL N'Y A RIEN À CHERCHER — la seule écriture de ce verdict, et les deux
 * écrans de recherche du produit la partagent.
 *
 * Elle vivait dans `src/routes/recherche/+page.server.ts`, où SvelteKit interdit tout
 * export hors des noms qu'il connaît : la palette n'avait aucun moyen de l'appeler et
 * l'aurait recopiée. Deux copies auraient divergé au premier motif ajouté, et l'écran
 * qui aurait gardé l'ancienne aurait dit « aucun résultat » là où l'autre nomme le
 * geste qui débloque.
 *
 * CINQ MOTIFS, ET AUCUN N'EST DEVINÉ — le dernier n'est pas le troisième : un
 * rédacteur qui a des dossiers ouverts sur une instance sans note ne doit pas lire
 * « demandez l'accès ». Le premier, lui, n'est pas un état du corpus mais une PANNE
 * du moteur, et c'est justement pourquoi il ne doit pas sortir en 500 : `RG-M04-07`
 * veut un panneau qui dit ce qui ne va pas, pas une page morte.
 */
import { MeilisearchRequestError, MeilisearchRequestTimeOutError } from 'meilisearch';
import type { Base } from '../base/acces';
import type { Identite } from '../droits/resolution';
import { instanceSansUnivers } from '../donnees/amorcage';
import { perimetreDeLIdentite } from './moteur';
import type { MotifDuVide } from './motifs';

export type { MotifDuVide };

/** Le résultat que le moteur ne peut pas rendre : aucun index, aucune mesure. */
export const AUCUN_RESULTAT = {
	identifiants: [] as readonly string[],
	total: 0,
	tronque: false,
	filtre: null,
	dureeMs: null
} as const;

/**
 * L'INDEX N'EXISTE PAS ENCORE — ET CE N'EST PAS UNE PANNE, C'EST UNE INSTALLATION
 * NEUVE : `base:migrer` monte le schéma, l'index n'est posé que par la première
 * réindexation, et entre les deux `/recherche` sortait en 500. Le code est celui
 * du corps de réponse du moteur, jamais un texte comparé.
 */
export function indexAbsent(erreur: unknown): boolean {
	const cause: unknown = (erreur as { cause?: unknown } | null)?.cause;
	return (
		typeof cause === 'object' &&
		cause !== null &&
		(cause as { code?: unknown }).code === 'index_not_found'
	);
}

/**
 * LE MOTEUR N'A PAS RÉPONDU — service arrêté, port fermé, redémarrage en cours, ou
 * requête expirée. C'EST UNE PANNE, PAS UN ÉTAT DU CORPUS, et `RG-M04-07` la range
 * du côté des ERREURS DE PANNEAU : « un panneau en erreur ne casse jamais la page ».
 *
 * Avant cette fonction, `/recherche` sortait en 500 dès que le moteur était éteint —
 * mesuré : `MeilisearchRequestError` remontait jusqu'au chargeur et la page entière
 * rendait « 500 Internal Error », sans message ni moyen de réessayer, alors que la
 * palette de la coquille, elle, dégradait proprement sur la même panne.
 *
 * LE TEST PORTE SUR LES CLASSES DU CLIENT, jamais sur un texte de message : le
 * libellé « Request to … has failed » est une chaîne de la bibliothèque, qui change
 * sans prévenir. UNE ERREUR D'API — index absent, clé refusée — n'est PAS une panne
 * de transport et ne passe pas par ici.
 */
export function moteurInjoignable(erreur: unknown): boolean {
	return (
		erreur instanceof MeilisearchRequestError || erreur instanceof MeilisearchRequestTimeOutError
	);
}

/**
 * LE MOTIF D'UN PÉRIMÈTRE VIDE. Il n'est demandé QUE lorsque le périmètre est
 * effectivement vide : une recherche ordinaire ne touche pas ces tables.
 */
export async function motifDuPerimetreVide(base: Base, identite: Identite): Promise<MotifDuVide> {
	if (identite.type !== 'authentifie') return 'corpus-vide';
	if (identite.role === 'administrateur') {
		return (await instanceSansUnivers(base)) ? 'sans-univers' : 'corpus-vide';
	}
	const perimetre = await perimetreDeLIdentite(base, identite);
	if (perimetre.tout) return 'corpus-vide';
	return perimetre.dossiers.size > 0 ? 'corpus-vide' : 'perimetre-ferme';
}
