/**
 * LA LECTURE COMMUNE AUX CARTOGRAPHIES — `/cartographie` (V-19),
 * `/cartographie/par-type` (V-20) et `/modelisation`.
 *
 * LES ROUTES LISENT LA MÊME CHOSE, ET C'EST UNE EXIGENCE : « un nœud doit se
 * reconnaître à l'identique d'un mode à l'autre, sinon la bascule fait perdre le
 * fil » (`V-19:2327`, `V-20:2437`). Deux chargeurs qui liraient chacun leur jeu
 * peuvent diverger d'une ligne sans que rien ne le dise.
 *
 * CE FICHIER N'EST PAS UNE ROUTE : SvelteKit ne route que les fichiers dont le nom
 * commence par le signe plus.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI. Le périmètre arrive tout résolu par
 * `ouvrirLAcces()`, et les lectures le portent DANS leur requête (`ADR-006`) ;
 * `lireRelationsLisibles()` exige que les DEUX extrémités soient lisibles — sans
 * quoi le bord du graphe publierait l'existence d'une note interdite.
 *
 * LES ARÊTES SONT DE DEUX NATURES, ET C'EST ICI QU'ELLES SE REJOIGNENT. Les
 * DÉCLARÉES viennent de la table `relations` — la saisie humaine, typée, orientée.
 * Les DÉDUITES sont fabriquées EN MÉMOIRE par `aretesDeMention()`, depuis la colonne
 * générée `notes.liens_internes` : aucune migration, aucune ligne écrite, aucun état
 * à resynchroniser. Les deux descendent MÊLÉES, parce que tout l'aval — le
 * sous-graphe, les filtres, la centralité, le panneau, les compteurs de couche — les
 * distingue déjà par la seule colonne `origine` (`P-08`). Les séparer ici obligerait
 * chaque appelant à refaire la fusion, donc à décider une seconde fois de la
 * préséance.
 */
import type { Base } from '$lib/base/acces';
import { lireRelationsTechniques, lireTypesDeRelation } from '$lib/donnees/lecture';
import {
	lireLesLiensInternes,
	lireRelationsLisibles,
	type RelationLisible
} from '$lib/donnees/outils';
import { lireNotesLisibles, type AccesAuRangement } from '$lib/donnees/rangement';
import type { Perimetre as PerimetreDAffichage } from '$lib/graphe/cartographie';
import { LIBELLES_DE_MENTION, TYPE_DE_MENTION, aretesDeMention } from '$lib/graphe/mentions';
import type { CleDeTypeDeRelation, LibellesDeRelation, Note } from '../../../seeds/corpus';

export interface GrapheLu {
	readonly notes: readonly Note[];
	/** Les arêtes du périmètre — déclarées et déduites, distinguées par `origine`. */
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
 * LES DEUX MOTS DE LA MENTION S'Y AJOUTENT, ET SEULEMENT ICI. Le type `mentionne`
 * n'est pas au référentiel — une mention ne se déclare pas —, mais elle doit se lire
 * là où un type déclaré se lit. Le dictionnaire servi porte donc les deux libellés de
 * plus, et la base n'en sait rien.
 *
 * LA CONVERSION DE CLÉ EST SÛRE PAR CONSTRUCTION : toute relation rendue par
 * `lireRelationsLisibles()` sort d'une jointure sur cette MÊME table, et son type
 * est donc une clé de ce dictionnaire. L'assertion ne comble aucun trou, elle
 * constate une jointure.
 *
 * @param perimetre le périmètre d'AFFICHAGE — celui de l'adresse, jamais celui des
 *   droits. Il borne les mentions aux deux extrémités : une citation vers une note
 *   qu'on ne dessine pas ne se dessine pas.
 */
export async function lireLeGraphe(
	base: Base,
	acces: AccesAuRangement,
	perimetre: PerimetreDAffichage
): Promise<GrapheLu> {
	const [notes, declarees, typesRelation, relationsTechniques, liensParNote] = await Promise.all([
		lireNotesLisibles(base, acces.perimetre, acces.contexte),
		lireRelationsLisibles(base, acces.perimetre),
		lireTypesDeRelation(base),
		lireRelationsTechniques(base),
		lireLesLiensInternes(base, acces.perimetre)
	]);

	const mentions = aretesDeMention(notes, liensParNote, declarees, perimetre);

	/* Le référentiel lu, PLUS les deux mots de la mention. La table de la base est
	   rendue en `Record<string, …>` ; l'annotation la garde ouverte, sans quoi la clé
	   ajoutée ferait perdre à TypeScript celles qui viennent de la requête. */
	const vocabulaire: Record<string, LibellesDeRelation> = {
		...typesRelation,
		[TYPE_DE_MENTION]: LIBELLES_DE_MENTION
	};

	return {
		notes,
		relations: [...declarees, ...mentions],
		typesRelation: vocabulaire as Record<CleDeTypeDeRelation, LibellesDeRelation>,
		relationsTechniques
	};
}
