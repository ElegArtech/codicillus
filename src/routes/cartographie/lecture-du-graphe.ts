/**
 * LA LECTURE COMMUNE AUX DEUX CARTOGRAPHIES — `/cartographie` (V-19) et
 * `/cartographie/par-type` (V-20).
 *
 * LES DEUX ROUTES LISENT LA MÊME CHOSE, ET C'EST UNE EXIGENCE : « un nœud doit se
 * reconnaître à l'identique d'un mode à l'autre, sinon la bascule fait perdre le
 * fil » (`V-19:2327`, `V-20:2437`). Deux chargeurs qui liraient chacun leur jeu
 * peuvent diverger d'une ligne sans que rien ne le dise.
 *
 * CE FICHIER N'EST PAS UNE ROUTE : SvelteKit ne route que les fichiers dont le nom
 * commence par le signe plus.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI. Le périmètre arrive tout résolu par
 * `ouvrirLAcces()`, et les deux lectures le portent DANS leur requête (`ADR-006`) ;
 * `lireRelationsLisibles()` exige que les DEUX extrémités soient lisibles — sans
 * quoi le bord du graphe publierait l'existence d'une note interdite.
 */
import type { Base } from '$lib/base/acces';
import { lireRelationsTechniques, lireTypesDeRelation } from '$lib/donnees/lecture';
import { lireRelationsLisibles, type RelationLisible } from '$lib/donnees/outils';
import { lireNotesLisibles, type AccesAuRangement } from '$lib/donnees/rangement';
import type { CleDeTypeDeRelation, LibellesDeRelation, Note } from '../../../seeds/corpus';

export interface GrapheLu {
	readonly notes: readonly Note[];
	readonly relations: readonly RelationLisible[];
	readonly typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
	readonly relationsTechniques: readonly CleDeTypeDeRelation[];
}

/**
 * LE GRAPHE QUE L'APPELANT PEUT LIRE, référentiel de relations compris.
 *
 * LE VOCABULAIRE DES RELATIONS EST LU EN BASE, JAMAIS RECOPIÉ. Chaque type porte
 * deux libellés — un par sens de lecture —, et c'est `types_de_relation` qui les
 * tient. La cartographie les emploie au nom accessible d'une arête et à
 * l'alternative textuelle : les garder en constante ferait dire au graphe réel les
 * mots d'un jeu d'exemple.
 *
 * LA CONVERSION DE CLÉ EST SÛRE PAR CONSTRUCTION : toute relation rendue par
 * `lireRelationsLisibles()` sort d'une jointure sur cette MÊME table, et son type
 * est donc une clé de ce dictionnaire. L'assertion ne comble aucun trou, elle
 * constate une jointure.
 */
export async function lireLeGraphe(base: Base, acces: AccesAuRangement): Promise<GrapheLu> {
	const notes = await lireNotesLisibles(base, acces.perimetre, acces.contexte);
	const relations = await lireRelationsLisibles(base, acces.perimetre);
	const typesRelation = await lireTypesDeRelation(base);
	const relationsTechniques = await lireRelationsTechniques(base);

	return {
		notes,
		relations,
		typesRelation: typesRelation as Record<CleDeTypeDeRelation, LibellesDeRelation>,
		relationsTechniques
	};
}
