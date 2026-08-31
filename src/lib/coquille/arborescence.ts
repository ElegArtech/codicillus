/**
 * Coquille applicative (V-37) — dérivation de l'arborescence du rail.
 *
 * Le rail n'est jamais écrit en dur : il se déduit du corpus, exactement comme la
 * maquette gelée le fait. Trois niveaux, et un seul ordre pour chacun :
 *
 *   • les univers, dans l'ordre défini par l'administrateur (`ordre`) ;
 *   • les domaines, dans l'ordre du registre des domaines ;
 *   • les dossiers, par ordre alphabétique français, à chaque niveau.
 *
 * Le dossier n'est pas une table : il est porté par le chemin de chaque note
 * (« Exploitation › Sauvegardes »), et l'arborescence s'en déduit. Une note
 * rangée dans un chemin crée tous les dossiers de ce chemin.
 */
import type { Domaine, Note, Univers } from '../../../seeds/corpus';
import {
	SANS_DESIGNATION,
	identifiantDUnivers,
	identifiantDeDomaine,
	identifiantLisible,
	type DesignationsDeRangement
} from '../rangement/adresses';

const SEPARATEUR = '›';

export interface NoeudDeDossier {
	readonly nom: string;
	/** Identité de branche, telle que la maquette la nomme : `f:<domaine>:<segment>…`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
}

export interface NoeudDeDomaine {
	readonly nom: string;
	/** Identité de branche : `d:<domaine>`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
}

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
	/**
	 * L'ADRESSE DU NŒUD — et c'est elle qui manquait. Le gel écrit `href="#"` sur
	 * toutes les entrées du rail, et `ARB-013` retire les lignes d'adresse de la
	 * comparaison de structure « précisément pour que le produit porte SES adresses
	 * et non les `href="#"` du gel ».
	 *
	 * Elle est calculée ICI, à la construction, parce que c'est le seul endroit qui
	 * connaisse à la fois l'univers, le domaine et le chemin — la clé
	 * `f:<domaine>:<segment>…` ne porte pas l'univers.
	 */
	readonly cible: {
		readonly univers: string;
		readonly domaine: string;
		readonly chemin: readonly string[];
	} | null;
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

export interface SectionRendue {
	readonly nom: string;
	/** `/univers/{univers}` — la page de l'univers lui-même. */
	readonly cible: {
		readonly univers: string;
		readonly domaine: string;
		readonly chemin: readonly string[];
	} | null;
	readonly domaines: readonly NoeudRendu[];
}

export function universOrdonnes(univers: readonly Univers[]): readonly Univers[] {
	return [...univers].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

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

/**
 * Le rail : TOUS les univers, et leurs arborescences. Un univers sans domaine y
 * figure, avec une liste vide — il en était écarté, et sur une instance neuve cela
 * rendait le premier geste du produit invisible : on crée un univers à la console,
 * et rien dans la navigation ne le montrait ni ne menait à sa page.
 */
export function sectionsDuRail(
	univers: readonly Univers[],
	domaines: readonly Domaine[],
	notes: readonly Note[]
): readonly SectionDUnivers[] {
	return universOrdonnes(univers).map((u) => ({
		nom: u.nom,
		domaines: domainesDe(domaines, u.nom).map((d) => ({
			nom: d.nom,
			cle: `d:${d.nom}`,
			enfants: dossiersDuDomaine(notes, d.nom)
		}))
	}));
}

/**
 * Applique à l'arborescence l'état de la page courante et celui d'une branche en
 * chargement. `courant` est le chemin de la page, du domaine au dernier rangement :
 * un nœud dont le nom y figure est mis en évidence, le dernier segment porte en
 * plus `aria-current="page"`, et les ancêtres se déplient.
 */
export function rendreNoeuds(
	noeuds: readonly (NoeudDeDomaine | NoeudDeDossier)[],
	courant: readonly string[],
	brancheEnChargement: string | null,
	/**
	 * L'UNIVERS ET LE DOMAINE PORTEURS, pour composer l'adresse. Ils descendent avec
	 * la récursion parce que la clé d'un dossier ne porte pas l'univers. Absents,
	 * l'adresse est vide et le rendu est celui d'avant.
	 */
	univers = '',
	domaine: string | null = null,
	chemin: readonly string[] = [],
	/**
	 * LA TABLE QUI TRADUIT UN NOM EN IDENTIFIANT D'ADRESSE. Les nœuds portent des
	 * NOMS, et l'identifiant d'un univers ou d'un domaine est persisté, stable sous
	 * les renommages (`RG-M12-11`) : le slugifier rendait 404 toute la branche d'un
	 * domaine renommé. Vide, la dérivation d'avant s'applique.
	 */
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly NoeudRendu[] {
	const dernier = courant.length ? courant[courant.length - 1] : null;
	return noeuds.map((n) => {
		/* Un nœud de DOMAINE ouvre un domaine ; un nœud de DOSSIER prolonge le
		   chemin du domaine déjà ouvert. */
		const domaineDuNoeud = domaine ?? n.nom;
		const cheminDuNoeud = domaine === null ? [] : [...chemin, n.nom];
		const enfants = rendreNoeuds(
			n.enfants,
			courant,
			brancheEnChargement,
			univers,
			domaineDuNoeud,
			cheminDuNoeud,
			designations
		);
		const estCourant = courant.includes(n.nom);
		return {
			nom: n.nom,
			cle: n.cle,
			/* LES PARTIES, PAS L'ADRESSE COMPOSÉE. `resolve()` de SvelteKit n'admet
			   qu'un motif de route et ses paramètres — une chaîne composée à la main
			   lui est opaque, et `svelte/no-navigation-without-resolve` a raison de
			   l'exiger : une adresse concaténée casse sous une racine de
			   déploiement. La vue compose, avec le motif sous les yeux. */
			cible:
				univers === ''
					? null
					: {
							univers: identifiantDUnivers(designations, univers),
							domaine: identifiantDeDomaine(designations, univers, domaineDuNoeud),
							chemin: cheminDuNoeud.map(identifiantLisible)
						},
			enfants,
			ouvert: estCourant || enfants.some((e) => e.ouvert),
			courant: estCourant,
			page: dernier !== null && n.nom === dernier,
			chargement: n.cle === brancheEnChargement
		};
	});
}

export function railRendu(
	sections: readonly SectionDUnivers[],
	courant: readonly string[],
	brancheEnChargement: string | null,
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly SectionRendue[] {
	return sections.map((s) => ({
		nom: s.nom,
		cible: { univers: identifiantDUnivers(designations, s.nom), domaine: '', chemin: [] },
		domaines: rendreNoeuds(s.domaines, courant, brancheEnChargement, s.nom, null, [], designations)
	}));
}
