/**
 * LA LECTURE COMMUNE AUX DEUX CARTOGRAPHIES — `/cartographie` (V-19) et
 * `/cartographie/par-type` (V-20).
 *
 * LES DEUX ROUTES LISENT LA MÊME CHOSE, ET C'EST UNE EXIGENCE, PAS UNE
 * COMMODITÉ. Le gel des deux maquettes porte, mot pour mot, le même socle
 * cartographique : « un nœud doit se reconnaître à l'identique d'un mode à
 * l'autre, sinon la bascule fait perdre le fil » (`V-19:2327`, `V-20:2437`).
 * Deux chargeurs qui liraient chacun leur jeu — même code, écrit deux fois —
 * peuvent diverger d'une ligne sans que rien ne le dise, et la bascule « Par
 * type maître » ferait alors changer le corpus en même temps que le mode.
 *
 * CE FICHIER N'EST PAS UNE ROUTE. SvelteKit ne route que les fichiers dont le
 * nom commence par le signe plus ; un module ordinaire posé dans un dossier de
 * route n'est atteignable par aucune adresse.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI. Le périmètre arrive tout résolu par
 * `ouvrirLAcces()`, et les deux lectures le portent DANS leur requête
 * (`ADR-006`) : `lireNotesLisibles()` pour les nœuds, `lireRelationsLisibles()`
 * pour les arêtes, cette dernière exigeant que les DEUX extrémités soient
 * lisibles — sans quoi le bord du graphe publierait l'existence d'une note
 * interdite.
 */
import type { Base } from '$lib/base/acces';
import { lireRelationsTechniques, lireTypesDeRelation } from '$lib/donnees/lecture';
import { lireRelationsLisibles, type RelationLisible } from '$lib/donnees/outils';
import { lireNotesLisibles, type AccesAuRangement } from '$lib/donnees/rangement';
import type { CleDeTypeDeRelation, LibellesDeRelation, Note } from '../../../seeds/corpus';

/** Ce qu'une cartographie a besoin de savoir : les nœuds, les arêtes, le mot. */
export interface GrapheLu {
	readonly notes: readonly Note[];
	readonly relations: readonly RelationLisible[];
	readonly typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
	readonly relationsTechniques: readonly CleDeTypeDeRelation[];
}

/**
 * LE GRAPHE QUE L'APPELANT PEUT LIRE, référentiel de relations compris.
 *
 * LE VOCABULAIRE DES RELATIONS EST LU EN BASE, JAMAIS RECOPIÉ. Chaque type
 * porte deux libellés — un par sens de lecture, « héberge » d'un côté, « est
 * hébergé par » de l'autre —, et c'est la table `types_de_relation` qui les
 * tient. La cartographie les emploie à deux endroits : le nom accessible d'une
 * arête, et l'alternative textuelle. Les garder en constante ferait dire au
 * graphe réel les mots d'un jeu d'exemple.
 *
 * LA CONVERSION DE CLÉ EST DÉCLARÉE, ET ELLE EST SÛRE PAR CONSTRUCTION.
 * `lireTypesDeRelation()` rend ses lignes indexées par chaîne, la table ne
 * connaissant pas le type de l'application ; la vue attend l'un des six
 * identifiants. Or toute relation rendue par `lireRelationsLisibles()` sort
 * d'une jointure sur cette MÊME table : son type est donc, par construction,
 * une clé de ce dictionnaire. L'assertion ne comble aucun trou, elle constate
 * une jointure.
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
