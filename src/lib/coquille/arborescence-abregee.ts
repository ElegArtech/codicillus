import {
	SANS_DESIGNATION,
	identifiantDUnivers,
	identifiantDeDomaine,
	identifiantLisible,
	type DesignationsDeRangement
} from '../rangement/adresses';
import type { NoeudDeDossier, SectionDUnivers } from './arborescence'; /**
 * Coquille applicative — l'arborescence de rail de la FORME ABRÉGÉE (ARB-021).
 *
 * POURQUOI CETTE FORME NE SE DÉDUIT PAS DE L'AUTRE. Les 26 vues abrégées
 * écrivent leur rail AU BALISAGE, et l'arbre écrit n'est pas celui du corpus :
 * quinze nœuds contre dix-neuf, et les deux arbres NE SONT PAS EMBOÎTÉS — le
 * balisage porte des dossiers que le corpus ne connaît pas, et en ignore que le
 * corpus porte. Aucune fonction ne peut déduire l'un de l'autre.
 *
 * POURQUOI CE MODULE VIT ICI, ET NON DANS CHACUNE DES 26 VUES : les 26 maquettes
 * portent un `aside.rail` IDENTIQUE À L'OCTET. Ce n'est pas une donnée PROPRE à
 * chaque vue, c'est une donnée de la FORME ABRÉGÉE. Ce qui varie d'une vue à
 * l'autre est le CHEMIN COURANT.
 *
 * `deplie` N'EST PAS `ouvert`, ET LA DIFFÉRENCE EST MESURÉE. `deplie` est l'état
 * que le BALISAGE du gel écrit, et lui seul que le LIBELLÉ du chevron annonce ;
 * le script des 26 vues déplie en plus les ancêtres du chemin courant mais NE
 * TOUCHE PAS à `aria-label`.
 *
 * L'ARBRE DU GEL N'EST PLUS PORTÉ ICI — une valeur par défaut est livrée au
 * navigateur, prise ou non. Ce qui reste est la FORME et le rendu du chemin
 * courant, que la base alimente par `sectionsAbregeesDuCorpus()`.
 */

export interface NoeudAbrege {
	readonly nom: string;
	/**
	 * Déplié AU BALISAGE — `<li data-ouvert="oui">`. C'est ce que le libellé du
	 * chevron annonce, et il ne change pas avec le chemin courant.
	 */
	readonly deplie: boolean;
	readonly enfants: readonly NoeudAbrege[];
}

export interface SectionAbregee {
	readonly nom: string;
	/** `/univers/{univers}` — la page de l'univers. Absente au gel, qui n'en a pas. */
	readonly cible?: string;
	readonly arbre: readonly NoeudAbrege[];
}

export interface NoeudAbregeRendu {
	readonly nom: string;
	/**
	 * L'ADRESSE DU NŒUD — même raison que dans l'arborescence complète : le gel
	 * écrit `href="#"`. Le premier niveau est un DOMAINE, les suivants ses dossiers.
	 */
	readonly cible: {
		readonly univers: string;
		readonly domaine: string;
		readonly chemin: readonly string[];
	} | null;
	readonly enfants: readonly NoeudAbregeRendu[];
	/** Déplié au balisage — pilote le seul `aria-label` du chevron. */
	readonly deplie: boolean;
	/** Déplié au rendu — pilote `data-ouvert` et `aria-expanded`. */
	readonly ouvert: boolean;
	/** Le nœud fait partie du chemin de la page courante. */
	readonly courant: boolean;
	/** Le nœud est la destination même de la page courante. */
	readonly page: boolean;
}

export interface SectionAbregeeRendue {
	readonly nom: string;
	/** `/univers/{univers}` — la page de l'univers. Absente au gel, qui n'en a pas. */
	readonly cible?: string;
	readonly arbre: readonly NoeudAbregeRendu[];
}

/*
 * `SECTIONS_ABREGEES` A ÉTÉ RETIRÉE, ET CE N'EST PAS UNE SIMPLIFICATION. Ce module
 * portait les deux sections et les quinze nœuds du gel écrits en dur comme VALEUR
 * PAR DÉFAUT de `railAbregeRendu()` — et une valeur par défaut n'est jamais
 * élaguée : l'arbre partait dans TOUT paquet montant une coquille, et se lisait
 * dans le source servi au navigateur, sur des instances qui n'ont jamais eu ces
 * domaines.
 *
 * LE DÉFAUT EST DÉSORMAIS L'ÉTAT VIDE : sans arborescence servie, le rail abrégé
 * ne rend aucune section.
 */

/**
 * Applique le chemin de la page courante à l'arborescence abrégée, à la propriété
 * près comme le script des 26 maquettes : le nœud homonyme de chaque nom du chemin
 * est mis en évidence, le DERNIER segment porte en plus `aria-current="page"`, et
 * le nœud et TOUS ses ancêtres se déplient. Le libellé du chevron n'est pas touché
 * — d'où `deplie`.
 */
export function rendreNoeudsAbreges(
	noeuds: readonly NoeudAbrege[],
	courant: readonly string[],
	univers = '',
	domaine: string | null = null,
	chemin: readonly string[] = [],
	/** La table qui traduit un nom en identifiant d'adresse — voir `./arborescence.ts`. */
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly NoeudAbregeRendu[] {
	const dernier = courant.length ? courant[courant.length - 1] : null;
	return noeuds.map((n) => {
		const domaineDuNoeud = domaine ?? n.nom;
		const cheminDuNoeud = domaine === null ? [] : [...chemin, n.nom];
		const enfants = rendreNoeudsAbreges(
			n.enfants,
			courant,
			univers,
			domaineDuNoeud,
			cheminDuNoeud,
			designations
		);
		const estCourant = courant.includes(n.nom);
		return {
			nom: n.nom,
			/* LES PARTIES, PAS L'ADRESSE COMPOSÉE. `resolve()` de SvelteKit n'admet
			   qu'un motif de route et ses paramètres — une chaîne composée à la main lui
			   est opaque, et une adresse concaténée casse sous une racine de
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
			deplie: n.deplie,
			ouvert: n.deplie || estCourant || enfants.some((e) => e.ouvert),
			courant: estCourant,
			page: dernier !== null && n.nom === dernier
		};
	});
}

/* ═══════════════════════════════ La dérivation depuis les données ═══════ */

/**
 * L'ARBORESCENCE ABRÉGÉE, DÉRIVÉE DU CORPUS RÉEL. Ce module portait l'arbre des
 * maquettes ÉCRIT EN DUR, et sur les vingt-deux vues de forme abrégée LE RAIL
 * IGNORAIT LA BASE : une instance neuve affichait des domaines qui n'existent pas,
 * et proposait des adresses qui rendent 404.
 *
 * Ce que dessine une maquette est du CONTENU DE DÉMONSTRATION, au même titre que
 * les titres de notes qu'on y lit : la forme abrégée est une FAÇON DE RENDRE, pas
 * une donnée. Et l'arbre du gel ne reste pas non plus comme DÉFAUT — ce qu'une
 * valeur par défaut porte est LIVRÉ au navigateur, prise ou non.
 */
export function sectionsAbregeesDuCorpus(
	sections: readonly SectionDUnivers[],
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly SectionAbregee[] {
	const enNoeud = (n: NoeudDeDossier): NoeudAbrege => ({
		nom: n.nom,
		/* `deplie` est l'état ÉCRIT du balisage, distinct de `ouvert` que le chemin
		   courant calcule. Rien dans la base ne porte un état de dépliage : on le
		   laisse fermé, et `rendreNoeudsAbreges()` ouvrira les ancêtres. */
		deplie: false,
		enfants: n.enfants.map(enNoeud)
	});
	return sections.map((s) => ({
		nom: s.nom,
		cible: identifiantDUnivers(designations, s.nom),
		arbre: s.domaines.map((d) => ({ nom: d.nom, deplie: false, enfants: d.enfants.map(enNoeud) }))
	}));
}

/**
 * L'arborescence abrégée, rendue pour un chemin courant. `sections` VAUT LA LISTE
 * VIDE PAR DÉFAUT : elle valait l'arbre du gel, et une valeur par défaut ne
 * s'élague pas — les quinze nœuds de la maquette partaient dans tout paquet
 * montant une coquille.
 */
export function railAbregeRendu(
	courant: readonly string[],
	sections: readonly SectionAbregee[] = [],
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly SectionAbregeeRendue[] {
	return sections.map((s) => ({
		nom: s.nom,
		...(s.cible === undefined ? {} : { cible: s.cible }),
		arbre: rendreNoeudsAbreges(s.arbre, courant, s.nom, null, [], designations)
	}));
}
