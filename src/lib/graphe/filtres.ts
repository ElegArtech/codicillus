/**
 * CE QUI EST MASQUÉ, ET PAR QUEL RÉGLAGE — l'unique définition, partagée par la vue
 * et par le câblage.
 *
 * POURQUOI ELLE EST ICI ET NON DANS L'UNE DES DEUX. Les filtres ne rechargent pas la
 * page : la vue rend l'état d'OUVERTURE, le câblage le fait vivre ensuite. Ce sont
 * donc deux endroits qui décident du même masquage, à deux moments — et deux
 * prédicats concurrents finiraient par ne plus s'accorder, si bien que la carte
 * changerait au premier clic sans qu'aucun réglage n'ait bougé.
 *
 * ILS NE VOIENT PAS LA MÊME CHOSE, ET C'EST TOUT LE SOIN À PRENDRE : la vue tient
 * ses données, le câblage ne lit que des attributs du document. La forme d'entrée
 * est donc RÉDUITE À CE QUE LES DEUX SAVENT DIRE — un état, un degré, une couche.
 *
 * AUCUN NŒUD N'EST RETIRÉ DU DOCUMENT. Filtrer ne redispose jamais le graphe :
 * un nœud masqué garde sa place, et le rallumer ne fait pas sauter la carte. C'est
 * la condition pour qu'un filtre se tente sans rien perdre de ses repères.
 */
import type { EtatDeVivacite } from '../fraicheur';
import type { CoucheDeLiens } from '../../routes/cartographie/etat-dexploration';

/** Ce qu'un réglage regarde d'un nœud — rien de plus, des deux côtés. */
export interface TraitsDeNoeud {
	/** L'état de vivacité, ou `null` quand la note n'en porte aucun. */
	readonly vivacite: EtatDeVivacite | null;
	/** Le nombre d'arêtes qui le touchent, toutes couches confondues. */
	readonly degre: number;
	/** Le code du type de la note — trois lettres, tel que la légende le montre. */
	readonly type: string;
}

/** Ce qu'un réglage regarde des filtres eux-mêmes. */
export interface ReglagesDeFiltre {
	readonly couches: readonly CoucheDeLiens[];
	readonly vivacite: readonly EtatDeVivacite[];
	readonly degreMinimum: number;
	readonly masquerIsolees: boolean;
	/** Les codes de type affichés — `null` : tous, y compris ceux créés en console. */
	readonly types: readonly string[] | null;
}

/**
 * UN NŒUD EST-IL MASQUÉ ?
 *
 * Une note SANS état de vivacité n'est jamais masquée par le filtre d'états : elle
 * n'en porte aucun, et la faire disparaître au titre d'un état qu'elle n'a pas la
 * retirerait de la carte sans qu'aucune case ne le dise.
 */
export function noeudMasque(traits: TraitsDeNoeud, reglages: ReglagesDeFiltre): boolean {
	if (traits.vivacite !== null && !reglages.vivacite.includes(traits.vivacite)) return true;
	if (reglages.types !== null && !reglages.types.includes(traits.type)) return true;
	if (reglages.masquerIsolees && traits.degre === 0) return true;
	return traits.degre < reglages.degreMinimum;
}

/**
 * UNE ARÊTE EST-ELLE MASQUÉE ? Sa couche doit être allumée, ET ses deux extrémités
 * visibles — un trait vers un nœud masqué pendrait dans le vide.
 */
export function areteMasquee(
	couche: CoucheDeLiens,
	extremitesVisibles: boolean,
	reglages: ReglagesDeFiltre
): boolean {
	if (!reglages.couches.includes(couche)) return true;
	return !extremitesVisibles;
}

/**
 * LA COUCHE D'UNE ARÊTE, D'APRÈS SON ORIGINE (`P-08`). `ambigue` est rangée avec les
 * déduites : elle n'a pas été SAISIE, et la dire déclarée affirmerait un geste qui
 * n'a pas eu lieu.
 */
export function coucheDeLOrigine(origine: string | undefined): CoucheDeLiens {
	return origine === 'deduite' || origine === 'ambigue' ? 'deduites' : 'declarees';
}
