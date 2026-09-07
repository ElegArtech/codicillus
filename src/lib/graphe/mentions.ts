/**
 * LES MENTIONS — les arêtes DÉDUITES du corps des notes.
 *
 * CE QU'ELLES SONT. Un lien interne écrit dans un corps affirme un rapport, au moment
 * exact où quelqu'un l'écrit. La cartographie ne le voyait pas : elle ne lisait que la
 * table `relations`, c'est-à-dire la seule saisie humaine. Sur un univers consolidé au
 * rétrolien et sans une relation déclarée, elle rendait un nuage de nœuds sans un
 * trait — un écran qui affirme « rien n'est relié » d'un corpus entièrement relié.
 *
 * LA COUCHE « DÉDUITES » L'ATTENDAIT DEPUIS TOUJOURS. `origine_de_relation` porte
 * `deduite` depuis la première migration, la légende dessine son trait fin, la case
 * à cocher se coche et le compteur s'affiche : rien, nulle part, ne produisait une
 * seule arête pour les alimenter. Ce module est ce producteur, et il est le seul.
 *
 * AUCUNE LIGNE N'EST ÉCRITE EN BASE. Les mentions se calculent à la lecture, depuis
 * `notes.liens_internes` — une colonne GÉNÉRÉE par PostgreSQL (migration `015`),
 * donc toujours d'accord avec les corps. Une table matérialisée demanderait une
 * migration, un type de relation de plus au référentiel, et un état à resynchroniser
 * à chaque enregistrement ; la colonne générée ne demande rien de tout cela.
 *
 * LE PÉRIMÈTRE EST TENU DEUX FOIS, ET C'EST VOULU. Le périmètre de DROIT est déjà
 * dans la requête qui a rendu `notes` et `liensParNote` (`ADR-006`) ; le périmètre
 * d'AFFICHAGE est appliqué ici, sur les DEUX extrémités. Une mention ne fabrique donc
 * jamais de nœud fantôme, quand une relation déclarée le fait : un fantôme dit « une
 * dépendance sort du périmètre », ce qu'une citation ne dit pas.
 */
import type { LibellesDeRelation, Note } from '../../../seeds/corpus';
import type { RelationLisible } from '../donnees/outils';
import { dansLePerimetre, type Perimetre } from './cartographie';

/**
 * LE TYPE D'UNE MENTION. Il n'est PAS dans `types_de_relation` et n'y sera pas : le
 * référentiel est celui des relations qu'on DÉCLARE, et une mention ne se déclare
 * pas. La clé ne vit qu'en mémoire, le temps d'un rendu.
 */
export const TYPE_DE_MENTION = 'mentionne';

/**
 * SES DEUX LIBELLÉS, un par sens de lecture — la forme même de `LibellesDeRelation`,
 * pour qu'une mention se lise EXACTEMENT là où un type déclaré se lit : nom
 * accessible d'une arête, alternative textuelle, panneau de détail. Un trait sans
 * mot n'aurait dit que « il se passe quelque chose entre ces deux notes ».
 */
export const LIBELLES_DE_MENTION: LibellesDeRelation = {
	sortant: 'mentionne',
	entrant: 'est mentionnée par'
};

/** La clé d'une paire, SANS ordre : les deux sens désignent la même paire. */
function cleDePaire(a: string, b: string): string {
	return a < b ? a + ' ' + b : b + ' ' + a;
}

/**
 * LES ARÊTES DE MENTION DU PÉRIMÈTRE.
 *
 * QUATRE RÈGLES, ET AUCUNE N'EST DÉCORATIVE :
 *
 *   1. Les DEUX extrémités sont dans le périmètre affiché. Une citation vers une note
 *      qu'on ne dessine pas ne se dessine pas.
 *   2. L'arête est ORIENTÉE, de la note qui PORTE le lien vers la note VISÉE. C'est le
 *      seul sens que le corps affirme.
 *   3. Plusieurs liens de A vers B donnent UNE arête. Un corps qui cite trois fois la
 *      même note ne la cite pas trois fois plus.
 *   4. UNE RELATION DÉCLARÉE PRÉVAUT, dans un sens comme dans l'autre. La couche
 *      déduite existe pour révéler ce que PERSONNE n'a déclaré ; doubler d'un trait
 *      fin une paire déjà déclarée n'ajoute rien et brouille le trait plein. Le
 *      recouvrement est pris SANS ORDRE — une relation « B héberge A » répond déjà de
 *      la paire, quel que soit le sens où le corps cite.
 *
 * L'ORDRE RENDU EST LEXICAL, donc déterministe : il décide de l'ordre du balisage,
 * et deux consultations du même périmètre doivent rendre le même document.
 *
 * LE TRANSTYPAGE NE COMBLE AUCUN TROU. `Relation.type` est nommé sur les six clés du
 * jeu de démonstration, quand la table `types_de_relation` est ouverte — le code fait
 * déjà cette conversion à chaque lecture de relation. `TYPE_DE_MENTION` est une clé
 * de plus, qui ne sort jamais vers la base : `lireLeGraphe()` en pose les libellés à
 * côté de ceux du référentiel, et rien d'autre ne la lit.
 */
export function aretesDeMention(
	notes: readonly Note[],
	liensParNote: ReadonlyMap<string, readonly string[]>,
	declarees: readonly RelationLisible[],
	perimetre: Perimetre
): readonly RelationLisible[] {
	const affiches = new Set<string>();
	for (const n of notes) if (dansLePerimetre(n, perimetre)) affiches.add(n.id);
	if (affiches.size === 0) return [];

	const dejaReliees = new Set<string>();
	for (const r of declarees) dejaReliees.add(cleDePaire(r.de, r.vers));

	const vues = new Set<string>();
	const aretes: RelationLisible[] = [];
	for (const source of [...affiches].sort()) {
		for (const cible of liensParNote.get(source) ?? []) {
			/* Une note ne se mentionne pas elle-même : `relations_pas_reflexives` refuse
			   la boucle en base, et la dessiner ici serait un nœud qui pointe sur soi. */
			if (cible === source) continue;
			if (!affiches.has(cible)) continue;
			if (dejaReliees.has(cleDePaire(source, cible))) continue;
			const cle = source + ' ' + cible;
			if (vues.has(cle)) continue;
			vues.add(cle);
			aretes.push({
				/* AUCUNE LIGNE DERRIÈRE : une mention se calcule, elle ne se stocke pas.
				   C'est ce `null` qui interdit à la vue de proposer de la retirer. */
				id: null,
				de: source,
				vers: cible,
				type: TYPE_DE_MENTION,
				origine: 'deduite'
			} as unknown as RelationLisible);
		}
	}
	return aretes.sort((a, b) => a.de.localeCompare(b.de) || a.vers.localeCompare(b.vers));
}
