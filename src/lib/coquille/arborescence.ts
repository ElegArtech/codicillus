/**
 * Coquille applicative (V-37) — dérivation de l'arborescence du rail.
 *
 * Le rail n'est jamais écrit en dur : il se déduit du corpus, exactement comme
 * la maquette gelée le fait (`mockups/V-37-coquille.html`, `construireRail()`
 * et `dossiersDuDomaine()`). Trois niveaux, et un seul ordre pour chacun :
 *
 *   • les univers, dans l'ordre défini par l'administrateur (`ordre`) ;
 *   • les domaines, dans l'ordre du registre des domaines ;
 *   • les dossiers, par ordre alphabétique français, à chaque niveau.
 *
 * Un univers sans domaine accessible n'apparaît pas — c'est le filtre que pose
 * la maquette, et il vaut règle : la navigation ne montre pas de rangement vide.
 *
 * Le dossier n'est pas une table : il est porté par le chemin de chaque note
 * (« Exploitation › Sauvegardes »), et l'arborescence s'en déduit. Une note
 * rangée dans un chemin crée tous les dossiers de ce chemin.
 */
import type { Domaine, Note, Univers } from '../../../seeds/corpus';

/** Le séparateur de chemin de dossier employé par le corpus. */
const SEPARATEUR = '›';

/** Un dossier de l'arborescence d'un domaine. */
export interface NoeudDeDossier {
	readonly nom: string;
	/** Identité de branche, telle que la maquette la nomme : `f:<domaine>:<segment>…`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
}

/** Un domaine et l'arborescence de ses dossiers. */
export interface NoeudDeDomaine {
	readonly nom: string;
	/** Identité de branche : `d:<domaine>`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
}

/** Un univers et les domaines qui lui sont rattachés. */
export interface SectionDUnivers {
	readonly nom: string;
	readonly domaines: readonly NoeudDeDomaine[];
}

/**
 * Un nœud prêt à rendre : l'arborescence, plus l'état que la page courante et
 * le chargement d'une branche lui donnent.
 */
export interface NoeudRendu {
	readonly nom: string;
	readonly cle: string;
	readonly enfants: readonly NoeudRendu[];
	/** Déplié : le nœud est courant, ou l'un de ses descendants l'est. */
	readonly ouvert: boolean;
	/** Le nœud fait partie du chemin de la page courante. */
	readonly courant: boolean;
	/** Le nœud est la destination même de la page courante. */
	readonly page: boolean;
	/** Une branche en cours de chargement se signale sur elle-même. */
	readonly chargement: boolean;
}

/** Une section d'univers prête à rendre. */
export interface SectionRendue {
	readonly nom: string;
	readonly domaines: readonly NoeudRendu[];
}

/** Les univers dans l'ordre défini par l'administrateur. */
export function universOrdonnes(univers: readonly Univers[]): readonly Univers[] {
	return [...univers].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

/** Les domaines rattachés à un univers, dans l'ordre du registre. */
export function domainesDe(domaines: readonly Domaine[], univers: string): readonly Domaine[] {
	return domaines.filter((d) => d.univers === univers);
}

interface Brouillon {
	readonly enfants: Map<string, Brouillon>;
}

function figer(niveau: Map<string, Brouillon>, prefixe: string): readonly NoeudDeDossier[] {
	return [...niveau.entries()]
		.sort(([a], [b]) => a.localeCompare(b, 'fr'))
		.map(([nom, brouillon]) => {
			const cle = `${prefixe}:${nom}`;
			return { nom, cle, enfants: figer(brouillon.enfants, cle) };
		});
}

/** L'arborescence des dossiers d'un domaine, déduite du rangement des notes. */
export function dossiersDuDomaine(
	notes: readonly Note[],
	domaine: string
): readonly NoeudDeDossier[] {
	const racines = new Map<string, Brouillon>();
	for (const note of notes) {
		if (note.domaine !== domaine || !note.dossier) continue;
		let niveau = racines;
		for (const segment of note.dossier.split(SEPARATEUR).map((s) => s.trim())) {
			if (!segment) continue;
			let branche = niveau.get(segment);
			if (!branche) {
				branche = { enfants: new Map<string, Brouillon>() };
				niveau.set(segment, branche);
			}
			niveau = branche.enfants;
		}
	}
	return figer(racines, `f:${domaine}`);
}

/** Le rail : les univers porteurs d'au moins un domaine, et leurs arborescences. */
export function sectionsDuRail(
	univers: readonly Univers[],
	domaines: readonly Domaine[],
	notes: readonly Note[]
): readonly SectionDUnivers[] {
	return universOrdonnes(univers)
		.map((u) => ({
			nom: u.nom,
			domaines: domainesDe(domaines, u.nom).map((d) => ({
				nom: d.nom,
				cle: `d:${d.nom}`,
				enfants: dossiersDuDomaine(notes, d.nom)
			}))
		}))
		.filter((s) => s.domaines.length > 0);
}

/**
 * Applique à l'arborescence l'état de la page courante et celui d'une branche
 * en chargement.
 *
 * `courant` est le chemin de la page, du domaine au dernier rangement. Un nœud
 * dont le nom y figure est mis en évidence ; le dernier segment porte en plus
 * `aria-current="page"`. Les ancêtres d'un nœud courant se déplient — et le
 * nœud courant lui-même, ce que fait aussi la maquette.
 */
export function rendreNoeuds(
	noeuds: readonly (NoeudDeDomaine | NoeudDeDossier)[],
	courant: readonly string[],
	brancheEnChargement: string | null
): readonly NoeudRendu[] {
	const dernier = courant.length ? courant[courant.length - 1] : null;
	return noeuds.map((n) => {
		const enfants = rendreNoeuds(n.enfants, courant, brancheEnChargement);
		const estCourant = courant.includes(n.nom);
		return {
			nom: n.nom,
			cle: n.cle,
			enfants,
			ouvert: estCourant || enfants.some((e) => e.ouvert),
			courant: estCourant,
			page: dernier !== null && n.nom === dernier,
			chargement: n.cle === brancheEnChargement
		};
	});
}

/** Le rail, arborescence et état réunis. */
export function railRendu(
	sections: readonly SectionDUnivers[],
	courant: readonly string[],
	brancheEnChargement: string | null
): readonly SectionRendue[] {
	return sections.map((s) => ({
		nom: s.nom,
		domaines: rendreNoeuds(s.domaines, courant, brancheEnChargement)
	}));
}
