/**
 * LES OUTILS — LE GRAPHE DES RELATIONS, LU DEPUIS LA BASE.
 *
 * Trois routes s'en servent : `/cartographie` (V-19), `/cartographie/par-type`
 * (V-20) et `/carte-mentale` (V-21). Ce module est celui de `T-037` ; il ne
 * touche à rien de `T-030`, il l'APPELLE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL AJOUTE À `./rangement.ts`, ET RIEN DE PLUS
 *
 * `lireNotesLisibles()` rend déjà les notes du périmètre : les nœuds du graphe
 * en viennent, sans une ligne de plus. Ce qui manquait est l'ARÊTE — la table
 * `relations`, que `T-010` a posée et que `T-030` lit SANS FILTRE
 * (`lireRelations()`). `ADR-006` interdit de filtrer une liste après l'avoir
 * reçue : la fonction ci-dessous porte donc le périmètre DANS son `where`, sur
 * les DEUX extrémités.
 *
 * LES DEUX EXTRÉMITÉS, ET C'EST LA DÉCISION DE SÉCURITÉ DE CE MODULE. Une
 * relation dont une seule extrémité est lisible ferait entrer dans la page
 * l'identifiant — donc l'existence — d'une note interdite. Le graphe connaît
 * pourtant une notion de nœud « fantôme » (`sousGraphe()`, « les notes hors
 * périmètre mais reliées à lui sont conservées et marquées fantôme ») : elle
 * porte sur le périmètre D'AFFICHAGE — l'univers choisi dans le sélecteur —,
 * jamais sur le périmètre de DROIT. Les deux ne se confondent pas, et les
 * confondre publierait le corpus interne par le bord du graphe.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-08` — L'ORIGINE VIENT DE LA COLONNE, JAMAIS D'UNE DÉDUCTION
 *
 * « Déclarée, déduite ou ambiguë : l'utilisateur sait toujours si une relation a
 * été saisie par un humain ou inférée. » La colonne existe
 * (`src/lib/base/schema.ts:88` et `:527`, valeur par défaut `declaree`), elle
 * est SÉLECTIONNÉE ici et voyage jusqu'à la charge de page. Aucune ligne de ce
 * module ne la calcule, ne la complète ni ne la remplace : une relation sans
 * origine n'existe pas en base, la colonne étant `notNull`.
 *
 * CE QUE CE MODULE NE PEUT PAS FAIRE, ET IL FAUT LE DIRE : la RENDRE. Aucun des
 * deux gels de cartographie ne l'affiche — le mot « origine » n'y figure pas, et
 * « déduite » n'y apparaît qu'en commentaire d'une fabrique d'arborescence de
 * dossiers (`mockups/V-19-cartographie.html:1806`,
 * `mockups/V-20-carto-type-maitre.html:1813`). `P-08` est donc tenu jusqu'à la
 * charge de page et pas au-delà, faute d'un endroit gelé où l'écrire. Déclaré au
 * rapport du lot ; le combler serait inventer un nœud d'interface.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-06` — L'ALTERNATIVE TEXTUELLE N'EST PAS ALIMENTÉE À PART
 *
 * V-19 rend son graphe en SVG et la même matière en texte dans
 * `details#liste-noeuds` ; V-21 rend `div.liste-arbre#liste`. Les deux
 * restitutions dérivent, DANS LA VUE, du même objet que le dessin — le
 * sous-graphe pour l'une, le corpus pour l'autre. Ce module ne fabrique donc
 * aucun résumé et n'expose aucune seconde forme : il passe UN jeu de données, et
 * les deux rendus en descendent. Une alternative alimentée séparément pourrait
 * diverger du dessin sans que rien ne le signale.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE DÉCIDE PAS
 *
 *   • LA DISPOSITION. Elle n'est calculée nulle part (`ARB-011`), et `d3-force`
 *     que `STACK §4.4` demande n'est pas installé. Les vues rendent la géométrie
 *     déterministe de leur gel. Écart déclaré au rapport du lot.
 *   • LE SEUIL DE BASCULE DE `RG-M09-04` — l'état « Trop dense » de V-19. Aucune
 *     source ne donne le nombre de nœuds au-delà duquel la carte bascule ;
 *     `etatDeCartographie()` ne rend donc JAMAIS `dense`. Poser un nombre ici
 *     serait un comblement, et il serait faux au premier corpus réel.
 *   • LE PROFIL. Le vecteur de V-19 porte un axe « role » que la vue n'emploie
 *     pas — elle pose son attribut de rôle au balisage, et les six états du gel
 *     le rendent tel quel. Rien n'est donc dérivé de l'identité ici.
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

/* ═══════════════════════════════════════════ L'origine d'une relation ══ */

/**
 * Les trois valeurs de l'énuméré `origine_de_relation` du schéma, dans leur
 * ordre de déclaration. Le type est NOMMÉ ici ; les valeurs, elles, ne sont
 * jamais écrites dans une requête — c'est la colonne qui les fournit.
 */
export type OrigineDeRelation = 'declaree' | 'deduite' | 'ambigue';

/**
 * Une relation du corpus, augmentée de son origine (`P-08`).
 *
 * Les trois premiers champs sont EXACTEMENT ceux de `Relation` de
 * `seeds/corpus.ts` : c'est ce qui permet de passer la liste à `sousGraphe()`
 * sans conversion, donc sans seconde définition du graphe.
 */
export interface RelationLisible extends Relation {
	readonly origine: OrigineDeRelation;
}

/* ═══════════════════════════════════════════ La lecture ════════════════ */

/**
 * LES RELATIONS QUE L'APPELANT PEUT LIRE — le filtre est DANS la requête.
 *
 * `notes` est jointe DEUX FOIS, source et cible, ce qui exige deux alias : sans
 * eux la seconde jointure écrase la première et les deux extrémités portent le
 * même identifiant. C'est la raison que `lireRelations()` de `T-030` donne, et
 * cette requête en reprend la forme.
 *
 * UN PÉRIMÈTRE VIDE N'INTERROGE PAS LA BASE, pour la raison que
 * `lireNotesLisibles()` donne : un ensemble vide passé à une clause
 * d'appartenance est une expression que chaque dialecte rend à sa façon, et le
 * doute ne se résout jamais en faveur de l'accès.
 *
 * L'ORDRE EST CELUI DE LA REQUÊTE, ET IL N'EST PAS CELUI DU JEU DE SEMENCE.
 * `RELATIONS` de `seeds/corpus.ts` porte un ordre de rédaction que la table ne
 * sait pas restituer : elle n'a pas de colonne de rang, seulement `cree_le`, que
 * la semence pose en bloc. L'ordre rendu ici est donc lexical et déterministe —
 * et il DÉCIDE de l'ordre du balisage du graphe, puisque `sousGraphe()` parcourt
 * les arêtes dans l'ordre reçu. C'est une lacune de SCHÉMA, de la même famille
 * que le rang des étiquettes que la migration `005` a dû ajouter ; elle est
 * comptée au rapport du lot, jamais compensée par un tri écrit à la main, qui
 * serait la valeur illustrative que `P-02` proscrit.
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

/* ═══════════════════════════════════════════ Le périmètre d'affichage ══ */

/**
 * LE PÉRIMÈTRE QUE V-19 AFFICHE À L'OUVERTURE — TOUT LE CORPUS.
 *
 * IL FUT « Univers Production », ET C'ÉTAIT UN DÉFAUT. Ce nom est celui d'un
 * univers du jeu de démonstration, et rien ne le pose sur une instance réelle :
 * `sousGraphe()` filtre sur l'égalité de nom, la carte s'ouvrait donc sur zéro
 * nœud, la légende vide, et le voile annonçait « Aucune relation dans ce
 * périmètre » — un message FAUX, puisque ce n'est pas le périmètre qui est vide,
 * c'est qu'il n'existe pas. Le sélecteur, lui, n'a que des univers RÉELS en
 * options : aucune ne valait `univers|Production`, et il retombait à vide,
 * désynchronisé de la carte.
 *
 * LE PÉRIMÈTRE HONNÊTE EST CELUI DES DEUX AUTRES CARTOGRAPHIES —
 * `/cartographie/par-type` ouvre sur `PERIMETRE_DE_V20`, `/carte-mentale` sur
 * `global|` ; `/cartographie` était la seule dissidente. « Le premier univers
 * lisible » serait le même défaut sous une autre forme : il dépend d'un tri et
 * exclut silencieusement le reste du corpus.
 *
 * ELLE RESTE UNE RECOPIE DU DÉFAUT DE LA VUE, parce que le chargeur doit décider
 * l'état de zone SUR LE MÊME sous-graphe que la vue dessine ; décider sur un
 * autre périmètre afficherait « aucune relation » au-dessus d'un graphe peuplé,
 * ou l'inverse. LE RISQUE EST GARDÉ : `outils.test.ts` relit le fichier de la vue
 * et échoue si le littéral n'y est plus.
 */
export const PERIMETRE_DE_V19: PerimetreDAffichage = { type: 'global' };

/** Le périmètre de V-20 — « Tous les domaines » (`src/vues/V-20.svelte:130`). */
export const PERIMETRE_DE_V20: PerimetreDAffichage = { type: 'global' };

/* ═══════════════════════════ Le périmètre porté par l'adresse ══════════ */

/**
 * LE PÉRIMÈTRE DEMANDÉ PAR L'ADRESSE — `?perimetre=`, sous la forme même du
 * sélecteur du gel : `type|nom`.
 *
 * `RG-M09-05` veut l'état de cartographie partageable. Le gel garde le sien
 * dans une clôture (`charger()`, `V-19:3089`) : une carte réduite ne s'envoie
 * donc à personne. Le chargeur est le seul à voir `url` ; c'est ici que la
 * valeur se lit, une fois, pour les deux cartographies.
 *
 * UNE VALEUR ILLISIBLE VAUT ABSENCE, jamais refus — `docs/routes.md` §4.2 pour
 * tout paramètre non honoré. Un type inconnu, une barre manquante, un nom vide
 * ramènent au périmètre par défaut de la vue : un périmètre inventé montrerait
 * un graphe vide sans jamais dire pourquoi.
 *
 * LE NOM N'EST PAS VALIDÉ CONTRE LES UNIVERS OU LES DOMAINES EXISTANTS, et
 * c'est délibéré : `sousGraphe()` filtre sur l'égalité de nom, un nom qui ne
 * désigne rien rend donc un graphe vide, et la vue a un voile qui le DIT —
 * « Aucune relation dans ce périmètre ». Refuser ici demanderait de lire les
 * référentiels pour n'ajouter aucune information à l'écran.
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
 * La valeur que le sélecteur du gel porte pour un périmètre — l'exacte inverse
 * de `perimetreDeLAdresse()`. Les deux sont côte à côte pour qu'aucune des deux
 * ne dérive sans l'autre (`P-35`).
 */
export function valeurDeSelecteur(perimetre: PerimetreDAffichage): string {
	return perimetre.type === 'global' ? 'global|' : `${perimetre.type}|${perimetre.nom ?? ''}`;
}

/**
 * LE SOUS-GRAPHE QUE LA VUE DESSINERA, calculé sur les données réelles.
 *
 * Un seul appel, vers la fabrique unique `sousGraphe()` : la vue emploie la
 * même, et deux définitions concurrentes du sous-graphe rendraient l'état de
 * zone étranger au dessin.
 */
export function grapheReel(
	notesLisibles: readonly Note[],
	relationsLisibles: readonly Relation[],
	perimetre: PerimetreDAffichage
): Graphe {
	return sousGraphe(notesLisibles, perimetre, relationsLisibles);
}

/* ═══════════════════════════════════════════ L'état de zone ════════════ */

/**
 * L'état de la zone de graphe — `RG-M18-03`, et seulement DEUX de ses positions.
 *
 * `vide` est l'état « Aucune relation dans ce périmètre » du gel
 * (`src/vues/V-19.svelte:471`) : il se décide sur les ARÊTES, jamais sur les
 * nœuds. Un périmètre peuplé de notes sans aucune relation est vide au sens de
 * la cartographie — le voile du gel le dit en propres termes, « elle se nourrit
 * des relations déclarées sur les notes ».
 *
 * `chargement` et `dense` ne sont jamais rendus ici : le premier est un moment
 * du client, que le serveur n'observe pas ; le second attend le seuil de
 * `RG-M09-04`, que rien ne donne (voir l'en-tête).
 */
export function etatDeCartographie(graphe: Graphe): 'nominal' | 'vide' {
	return graphe.aretes.length === 0 ? 'vide' : 'nominal';
}
