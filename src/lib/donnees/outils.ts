/**
 * Les outils — le graphe des relations, lu depuis la base. Trois routes s'en servent :
 * `/cartographie`, `/cartographie/par-type`, `/carte-mentale`.
 *
 * CE QU'IL AJOUTE À `./rangement.ts` : l'ARÊTE. `lireRelations()` lit la table SANS FILTRE, et
 * `ADR-006` interdit de filtrer une liste après l'avoir reçue — la fonction ci-dessous porte
 * donc le périmètre DANS son `where`, sur les DEUX extrémités. C'EST LA DÉCISION DE SÉCURITÉ
 * DE CE MODULE : une relation dont une seule extrémité est lisible ferait entrer dans la page
 * l'identifiant — donc l'existence — d'une note interdite. Le nœud « fantôme » de
 * `sousGraphe()` porte sur le périmètre D'AFFICHAGE, jamais sur celui de DROIT.
 *
 * `P-08` — l'origine vient de la COLONNE, jamais d'une déduction ; elle voyage jusqu'à la
 * charge de page et pas au-delà : aucun des deux gels de cartographie ne l'affiche.
 *
 * `P-06` — l'alternative textuelle n'est pas alimentée à part : les deux restitutions de V-19
 * et V-21 dérivent, DANS LA VUE, du même objet que le dessin.
 *
 * CE QU'IL NE DÉCIDE PAS : la disposition (`ARB-011`) ; le seuil de bascule de `RG-M09-04`,
 * qu'aucune source ne donne ; le profil, dont rien n'est dérivé ici.
 */
import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Base } from '../base/acces';
import { notes, relations, typesDeRelation } from '../base/schema';
import type { Perimetre } from '../droits/resolution';
import {
	sousGraphe,
	type Graphe,
	type Perimetre as PerimetreDAffichage
} from '../graphe/cartographie';
import type { CleDeTypeDeRelation, Note, Relation } from '../../../seeds/corpus';

/**
 * Les trois valeurs de l'énuméré `origine_de_relation`, dans leur ordre de
 * déclaration. Le type est NOMMÉ ici ; les valeurs ne sont jamais écrites dans une
 * requête — c'est la colonne qui les fournit.
 */
export type OrigineDeRelation = 'declaree' | 'deduite' | 'ambigue';

/**
 * Une relation du corpus, augmentée de son origine (`P-08`). Les trois premiers
 * champs sont EXACTEMENT ceux de `Relation` : c'est ce qui permet de passer la liste
 * à `sousGraphe()` sans conversion, donc sans seconde définition du graphe.
 */
export interface RelationLisible extends Relation {
	readonly origine: OrigineDeRelation;
}

/**
 * Les relations que l'appelant peut lire — le filtre est DANS la requête. `notes` est jointe
 * DEUX FOIS, source et cible, ce qui exige deux alias. UN PÉRIMÈTRE VIDE N'INTERROGE PAS LA
 * BASE : un ensemble vide passé à une clause d'appartenance est une expression que chaque
 * dialecte rend à sa façon.
 *
 * L'ORDRE EST CELUI DE LA REQUÊTE, ET IL N'EST PAS CELUI DU JEU DE SEMENCE : la table n'a pas
 * de colonne de rang. L'ordre rendu est lexical et déterministe, et il DÉCIDE de l'ordre du
 * balisage du graphe. Lacune de SCHÉMA comptée au rapport.
 */
export async function lireRelationsLisibles(
	base: Base,
	perimetre: Perimetre
): Promise<readonly RelationLisible[]> {
	const autorises = perimetre.tout ? null : [...perimetre.dossiers];
	if (autorises !== null && autorises.length === 0) return [];

	const source = alias(notes, 'note_source');
	const cible = alias(notes, 'note_cible');

	/* Les deux extrémités, jamais une seule — voir l'en-tête. */
	const filtre =
		autorises === null
			? undefined
			: and(inArray(source.dossierId, autorises), inArray(cible.dossierId, autorises));

	const lignes = await base
		.select({
			de: source.identifiant,
			vers: cible.identifiant,
			type: typesDeRelation.identifiant,
			origine: relations.origine
		})
		.from(relations)
		.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
		.innerJoin(source, eq(relations.sourceId, source.id))
		.innerJoin(cible, eq(relations.cibleId, cible.id))
		.where(filtre)
		.orderBy(source.identifiant, cible.identifiant, typesDeRelation.ordre);

	return lignes.map(
		(l) =>
			({
				de: l.de,
				vers: l.vers,
				type: l.type as CleDeTypeDeRelation,
				origine: l.origine
			}) as unknown as RelationLisible
	);
}

/**
 * Le périmètre que V-19 affiche à l'ouverture — TOUT LE CORPUS.
 *
 * IL FUT « Univers Production », ET C'ÉTAIT UN DÉFAUT : ce nom est celui d'un univers du jeu
 * de démonstration, que rien ne pose sur une instance réelle. La carte s'ouvrait sur zéro nœud
 * sous un voile « Aucune relation dans ce périmètre » — un message FAUX. ELLE RESTE UNE
 * RECOPIE DU DÉFAUT DE LA VUE, parce que le chargeur doit décider l'état de zone SUR LE MÊME
 * sous-graphe que la vue dessine ; `outils.test.ts` relit la vue et échoue si le littéral n'y
 * est plus.
 */
export const PERIMETRE_DE_V19: PerimetreDAffichage = { type: 'global' };

/** Le périmètre de V-20 — « Tous les domaines » (`src/vues/V-20.svelte:130`). */
export const PERIMETRE_DE_V20: PerimetreDAffichage = { type: 'global' };

/**
 * Le périmètre demandé par l'adresse — `?perimetre=`, sous la forme du sélecteur du gel,
 * `type|nom`. `RG-M09-05` veut l'état de cartographie partageable, quand le gel garde le sien
 * dans une clôture.
 *
 * UNE VALEUR ILLISIBLE VAUT ABSENCE, jamais refus : un périmètre inventé montrerait un graphe
 * vide sans dire pourquoi. LE NOM N'EST PAS VALIDÉ contre les univers existants :
 * `sousGraphe()` filtre sur l'égalité de nom, et la vue a un voile qui le DIT.
 */
export function perimetreDeLAdresse(
	demande: string | null,
	defaut: PerimetreDAffichage
): PerimetreDAffichage {
	if (demande === null) return defaut;
	const barre = demande.indexOf('|');
	const type = barre < 0 ? demande : demande.slice(0, barre);
	const nom = barre < 0 ? '' : demande.slice(barre + 1);
	if (type === 'global') return { type: 'global' };
	if ((type === 'univers' || type === 'domaine') && nom !== '') return { type, nom };
	return defaut;
}

/**
 * La valeur que le sélecteur du gel porte pour un périmètre — l'exacte inverse de
 * `perimetreDeLAdresse()`. Les deux sont côte à côte pour qu'aucune ne dérive sans
 * l'autre.
 */
export function valeurDeSelecteur(perimetre: PerimetreDAffichage): string {
	return perimetre.type === 'global' ? 'global|' : `${perimetre.type}|${perimetre.nom ?? ''}`;
}

/**
 * Le sous-graphe que la vue dessinera, calculé sur les données réelles. Un seul
 * appel vers la fabrique unique `sousGraphe()` : deux définitions concurrentes
 * rendraient l'état de zone étranger au dessin.
 */
export function grapheReel(
	notesLisibles: readonly Note[],
	relationsLisibles: readonly Relation[],
	perimetre: PerimetreDAffichage
): Graphe {
	return sousGraphe(notesLisibles, perimetre, relationsLisibles);
}

/**
 * L'état de la zone de graphe — `RG-M18-03`, et seulement DEUX de ses positions. `vide` se
 * décide sur les ARÊTES, jamais sur les nœuds : un périmètre peuplé de notes sans aucune
 * relation est vide au sens de la cartographie. `chargement` est un moment du client, que le
 * serveur n'observe pas ; `dense` attend le seuil de `RG-M09-04`, que rien ne donne.
 */
export function etatDeCartographie(graphe: Graphe): 'nominal' | 'vide' {
	return graphe.aretes.length === 0 ? 'vide' : 'nominal';
}
