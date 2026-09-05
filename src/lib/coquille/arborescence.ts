/**
 * Coquille applicative — dérivation de l'arborescence du rail.
 *
 * Le rail n'est jamais écrit en dur : il se déduit du corpus servi. QUATRE niveaux,
 * et un seul ordre pour chacun :
 *
 *   • les univers, dans l'ordre défini par l'administrateur (`ordre`) ;
 *   • les domaines, dans l'ordre du registre des domaines ;
 *   • les dossiers, par ordre alphabétique français, à chaque niveau ;
 *   • les notes, par ordre alphabétique français, APRÈS les dossiers du même niveau.
 *
 * LES NOTES SONT DES FEUILLES DU RAIL, et c'est le principal ajout de la refonte :
 * la référence les montre, l'arbre s'arrêtait aux dossiers. Le dossier n'est pas une
 * table : il est porté par le chemin de chaque note (« Exploitation › Sauvegardes »),
 * et l'arborescence s'en déduit. Une note rangée dans un chemin crée tous les dossiers
 * de ce chemin, et se pose en feuille au bout.
 *
 * LES COMPTEURS SE DÉRIVENT DES MÊMES NOTES, jamais d'une colonne à part : un
 * compteur lu ailleurs que l'arbre qu'il compte finit par le contredire.
 */
import type { Domaine, Univers } from '../../../seeds/corpus';
import {
	SANS_DESIGNATION,
	identifiantDUnivers,
	identifiantDeDomaine,
	identifiantLisible,
	type DesignationsDeRangement
} from '../rangement/adresses';

const SEPARATEUR = '›';

/**
 * CE QUE LE RAIL DEMANDE D'UNE NOTE, ET RIEN DE PLUS. La forme est un
 * SOUS-ENSEMBLE de `Note` du corpus — les vues qui passent leur corpus entier
 * restent acceptées —, et c'est aussi celle que `+layout.server.ts` lit en base :
 * une seule dérivation pour les deux sources.
 */
export interface NoteDuRail {
	/** L'identifiant LISIBLE, celui de l'adresse `/notes/{identifiant}`. */
	readonly id: string;
	readonly titre: string;
	readonly univers: string;
	readonly domaine: string;
	/** Le chemin de dossiers, segments séparés par `›`. Vide : à la racine. */
	readonly dossier: string;
}

/** Le type d'un nœud : il décide de son icône, de son adresse et de son compteur. */
export type TypeDeNoeud = 'domaine' | 'dossier' | 'note';

export interface NoeudDeNote {
	readonly nom: string;
	/** Identité de branche : `n:<identifiant>`. */
	readonly cle: string;
	readonly identifiant: string;
}

export interface NoeudDeDossier {
	readonly nom: string;
	/** Identité de branche, telle que la maquette la nomme : `f:<domaine>:<segment>…`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
	/** Les notes rangées DIRECTEMENT dans ce dossier. */
	readonly notes: readonly NoeudDeNote[];
}

export interface NoeudDeDomaine {
	readonly nom: string;
	/** Identité de branche : `d:<domaine>`. */
	readonly cle: string;
	readonly enfants: readonly NoeudDeDossier[];
	/** Les notes rangées à la racine du domaine. */
	readonly notes: readonly NoeudDeNote[];
	/** Le compteur affiché à droite de la ligne — toutes les notes du domaine. */
	readonly compte: number;
}

export interface SectionDUnivers {
	readonly nom: string;
	readonly domaines: readonly NoeudDeDomaine[];
	/** Le compteur affiché à droite de la ligne — toutes les notes de l'univers. */
	readonly compte: number;
	/** La clé de pictogramme choisie en console pour cet univers. */
	readonly glyphe: string;
}

/**
 * Un nœud prêt à rendre : l'arborescence, plus l'état que la page courante et
 * le chargement d'une branche lui donnent.
 */
export interface NoeudRendu {
	readonly nom: string;
	readonly cle: string;
	/** Ce que le nœud EST — l'icône et l'adresse en dépendent. */
	readonly type: TypeDeNoeud;
	/**
	 * L'ADRESSE DU NŒUD de rangement — domaine ou dossier. `null` pour une note,
	 * dont l'adresse est `identifiant`.
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
	/** L'identifiant lisible d'une note — `/notes/{identifiant}`. `null` sinon. */
	readonly identifiant: string | null;
	/** Le compteur mono affiché à droite. `null` : la ligne n'en porte pas. */
	readonly compte: number | null;
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
	readonly glyphe: string;
	readonly compte: number;
	readonly domaines: readonly NoeudRendu[];
	/** L'univers porte la page courante — texte vert, sans fond. */
	readonly courant: boolean;
	/** La page courante EST la page de cet univers — ligne active. */
	readonly page: boolean;
	/** Déplié : l'univers est courant, ou l'un de ses descendants l'est. */
	readonly ouvert: boolean;
}

export function universOrdonnes(univers: readonly Univers[]): readonly Univers[] {
	return [...univers].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export function domainesDe(domaines: readonly Domaine[], univers: string): readonly Domaine[] {
	return domaines.filter((d) => d.univers === univers);
}

interface Brouillon {
	readonly enfants: Map<string, Brouillon>;
	readonly notes: NoeudDeNote[];
}

function brouillonNeuf(): Brouillon {
	return { enfants: new Map<string, Brouillon>(), notes: [] };
}

const parNom = (a: { nom: string }, b: { nom: string }): number => a.nom.localeCompare(b.nom, 'fr');

function figer(niveau: Map<string, Brouillon>, prefixe: string): readonly NoeudDeDossier[] {
	return [...niveau.entries()]
		.sort(([a], [b]) => a.localeCompare(b, 'fr'))
		.map(([nom, brouillon]) => {
			const cle = `${prefixe}:${nom}`;
			return {
				nom,
				cle,
				enfants: figer(brouillon.enfants, cle),
				notes: [...brouillon.notes].sort(parNom)
			};
		});
}

/** Les segments d'un chemin de dossier, les vides écartés. */
function segmentsDe(dossier: string): readonly string[] {
	return dossier
		.split(SEPARATEUR)
		.map((s) => s.trim())
		.filter((s) => s !== '');
}

/**
 * L'arborescence d'un domaine, déduite du rangement de ses notes : les dossiers,
 * et les notes en feuilles.
 *
 * LE DOMAINE EST DÉSIGNÉ PAR SON UNIVERS AUTANT QUE PAR SON NOM. Deux univers
 * peuvent porter un domaine homonyme, et le filtre sur le seul nom versait les
 * notes de l'un dans l'arbre de l'autre. `univers` vide : le filtre porte sur le
 * nom seul, ce que faisait la dérivation d'avant.
 */
export function arbreDuDomaine(
	notes: readonly NoteDuRail[],
	domaine: string,
	univers = ''
): { readonly dossiers: readonly NoeudDeDossier[]; readonly notes: readonly NoeudDeNote[] } {
	const racine = brouillonNeuf();
	for (const note of notes) {
		if (note.domaine !== domaine) continue;
		if (univers !== '' && note.univers !== univers) continue;
		let niveau = racine;
		for (const segment of segmentsDe(note.dossier)) {
			let branche = niveau.enfants.get(segment);
			if (!branche) {
				branche = brouillonNeuf();
				niveau.enfants.set(segment, branche);
			}
			niveau = branche;
		}
		niveau.notes.push({ nom: note.titre, cle: `n:${note.id}`, identifiant: note.id });
	}
	return {
		dossiers: figer(racine.enfants, `f:${domaine}`),
		notes: [...racine.notes].sort(parNom)
	};
}

/** L'arborescence des dossiers d'un domaine, sans les notes. */
export function dossiersDuDomaine(
	notes: readonly NoteDuRail[],
	domaine: string,
	univers = ''
): readonly NoeudDeDossier[] {
	return arbreDuDomaine(notes, domaine, univers).dossiers;
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
	notes: readonly NoteDuRail[]
): readonly SectionDUnivers[] {
	return universOrdonnes(univers).map((u) => {
		const branches = domainesDe(domaines, u.nom).map((d) => {
			const arbre = arbreDuDomaine(notes, d.nom, u.nom);
			return {
				nom: d.nom,
				cle: `d:${d.nom}`,
				enfants: arbre.dossiers,
				notes: arbre.notes,
				compte: notes.filter((n) => n.univers === u.nom && n.domaine === d.nom).length
			};
		});
		return {
			nom: u.nom,
			domaines: branches,
			compte: branches.reduce((somme, d) => somme + d.compte, 0),
			glyphe: u.glyphe
		};
	});
}

/**
 * L'ÉTAT DE LA PAGE COURANTE, tel que le rail le lit. `chemin` va du domaine au
 * dernier dossier ; `note` est l'identifiant lisible de la note ouverte, s'il y en
 * a une. Un objet plutôt que deux paramètres de plus : la récursion en porte déjà
 * six, et une position de plus se trompe en silence.
 */
export interface PageCourante {
	readonly chemin: readonly string[];
	readonly note: string | null;
	/** Le nom de l'univers de la page courante — le fil le donne. */
	readonly univers: string | null;
	/** La page courante EST la page d'un univers. */
	readonly surLUnivers: boolean;
}

export const AUCUNE_PAGE: PageCourante = {
	chemin: [],
	note: null,
	univers: null,
	surLUnivers: false
};

/**
 * Applique à l'arborescence l'état de la page courante et celui d'une branche en
 * chargement. Un nœud dont le nom figure dans le chemin est mis en évidence, le
 * dernier segment porte en plus `aria-current="page"`, et les ancêtres se déplient.
 * Une note est active quand son identifiant est celui de la note ouverte.
 */
export function rendreNoeuds(
	noeuds: readonly (NoeudDeDomaine | NoeudDeDossier)[],
	page: PageCourante,
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
	const courant = page.chemin;
	const dernier = courant.length ? courant[courant.length - 1] : null;
	return noeuds.map((n) => {
		/* Un nœud de DOMAINE ouvre un domaine ; un nœud de DOSSIER prolonge le
		   chemin du domaine déjà ouvert. */
		const domaineDuNoeud = domaine ?? n.nom;
		const cheminDuNoeud = domaine === null ? [] : [...chemin, n.nom];
		const enfants = [
			...rendreNoeuds(
				n.enfants,
				page,
				brancheEnChargement,
				univers,
				domaineDuNoeud,
				cheminDuNoeud,
				designations
			),
			...n.notes.map((note) => rendreNote(note, page))
		];
		const estCourant = courant.includes(n.nom);
		return {
			nom: n.nom,
			cle: n.cle,
			type: domaine === null ? ('domaine' as const) : ('dossier' as const),
			/* LES PARTIES, PAS L'ADRESSE COMPOSÉE. `resolve()` de SvelteKit n'admet
			   qu'un motif de route et ses paramètres — une chaîne composée à la main
			   lui est opaque, et une adresse concaténée casse sous une racine de
			   déploiement. La vue compose, avec le motif sous les yeux. */
			cible:
				univers === ''
					? null
					: {
							univers: identifiantDUnivers(designations, univers),
							domaine: identifiantDeDomaine(designations, univers, domaineDuNoeud),
							chemin: cheminDuNoeud.map(identifiantLisible)
						},
			identifiant: null,
			/* LE COMPTEUR NE PARAÎT QU'AUX DEUX PREMIERS NIVEAUX — la référence ne le
			   met ni sur un dossier ni sur une note. */
			compte: domaine === null && 'compte' in n ? n.compte : null,
			enfants,
			ouvert: estCourant || enfants.some((e) => e.ouvert),
			courant: estCourant,
			/* LA LIGNE ACTIVE EST LE DERNIER SEGMENT DU CHEMIN — sauf quand une note
			   est ouverte : le chemin d'une note est celui de son RANGEMENT, et son
			   dernier dossier n'est alors pas la page, la note l'est. */
			page: page.note === null && dernier !== null && n.nom === dernier,
			chargement: n.cle === brancheEnChargement
		};
	});
}

function rendreNote(note: NoeudDeNote, page: PageCourante): NoeudRendu {
	const active = page.note !== null && page.note === note.identifiant;
	return {
		nom: note.nom,
		cle: note.cle,
		type: 'note',
		cible: null,
		identifiant: note.identifiant,
		compte: null,
		enfants: [],
		ouvert: false,
		courant: active,
		page: active,
		chargement: false
	};
}

export function railRendu(
	sections: readonly SectionDUnivers[],
	page: PageCourante,
	brancheEnChargement: string | null,
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly SectionRendue[] {
	return sections.map((s) => {
		const domaines = rendreNoeuds(
			s.domaines,
			page,
			brancheEnChargement,
			s.nom,
			null,
			[],
			designations
		);
		const courant = page.univers === s.nom;
		return {
			nom: s.nom,
			cible: { univers: identifiantDUnivers(designations, s.nom), domaine: '', chemin: [] },
			glyphe: s.glyphe,
			compte: s.compte,
			domaines,
			courant,
			page: courant && page.surLUnivers,
			/* CLIQUER UN UNIVERS OUVRE SA PAGE **ET** LE DÉPLIE : sans ça, la page d'un
			   univers montre un rail replié sur ce qu'elle vient d'ouvrir. */
			ouvert: courant || domaines.some((d) => d.ouvert)
		};
	});
}
