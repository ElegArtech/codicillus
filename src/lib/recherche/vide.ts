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
 * QUATRE MOTIFS, ET AUCUN N'EST DEVINÉ — le dernier n'est pas le troisième : un
 * rédacteur qui a des dossiers ouverts sur une instance sans note ne doit pas lire
 * « demandez l'accès ».
 */
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
