import { identifiantLisible } from '../rangement/adresses'; /**
 * Coquille applicative — l'arborescence de rail de la FORME ABRÉGÉE.
 *
 * TROISIÈME AMENDEMENT DU GABARIT — ARB-021, amendement A-1e.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ARBORESCENCE EST UNE DONNÉE, ET NON UN CALCUL
 *
 * Les 34 maquettes à coquille portent DEUX formes (ARB-021). La forme
 * complète — V-07, V-14, V-27, V-37 à V-41 — construit son rail par script,
 * à partir du corpus : c'est ce que `arborescence.ts` reproduit. Les 26
 * autres l'écrivent AU BALISAGE, et l'arbre écrit n'est pas celui du corpus :
 *
 *   • le balisage rend 15 nœuds, `sectionsDuRail(corpusPourVue(v))` en rend
 *     19 — vérifié sur les 41 vues, la variante de corpus n'y changeant rien ;
 *   • les deux arbres NE SONT PAS EMBOÎTÉS. Le balisage porte
 *     `Infrastructure › Exploitation › Ordonnancement` et
 *     `Infrastructure › Réseau › Adressage`, que le corpus ne connaît pas ;
 *     il IGNORE `Infrastructure › Applications › Serveurs`,
 *     `Fiches applicatives › Accès`, `… › Support`, `Déploiement › Comptes`
 *     et `… › Salles`, que le corpus porte.
 *
 * Aucune fonction ne peut donc déduire l'un de l'autre. ARB-021 tranche : elle
 * se porte comme une DONNÉE, et surtout PAS en « corrigeant » `seeds/corpus.ts`,
 * qui rend fidèlement ce que les 41 maquettes portent.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI ELLE VIT ICI, ET NON DANS CHACUNE DES 26 VUES
 *
 * MESURÉ, pas supposé : les 26 maquettes de forme abrégée portent un
 * `aside.rail` IDENTIQUE À L'OCTET — 5 164 octets, même empreinte SHA-256
 * pour les 26 — et un `header.barre` identique de la même façon (1 118
 * octets). L'arborescence n'est donc pas une donnée PROPRE à chaque vue :
 * c'est une donnée de la FORME ABRÉGÉE elle-même, et la recopier vingt-six
 * fois créerait vingt-six sources de vérité pour une seule.
 *
 * Ce qui varie d'une vue à l'autre est le CHEMIN COURANT (`courant`), que
 * chaque vue déclare déjà, exactement comme la maquette le fait par
 * `coquille({ fil: […], courant: […] })`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `deplie` N'EST PAS `ouvert`, ET LA DIFFÉRENCE EST MESURÉE
 *
 * `deplie` est l'état que le BALISAGE du gel écrit, et c'est lui — lui seul —
 * que le LIBELLÉ du chevron annonce. Le script des 26 vues déplie en plus les
 * ancêtres du chemin courant (`data-ouvert="oui"`, `aria-expanded="true"`)
 * mais NE TOUCHE PAS à `aria-label`. Vérifié sur V-11, V-12, V-13, V-17,
 * V-22, V-25, une fois la page stabilisée dans les conditions du banc : seuls
 * `Infrastructure` et `Exploitation` disent « Replier », quel que soit le
 * chemin courant.
 *
 * Extrait mécaniquement de `mockups/V-25-profil.html` (`aside.rail`,
 * lignes 965-1074), lecture du DOM stabilisé — jamais recopié à la main.
 */

/** Un nœud de l'arborescence écrite au balisage de la forme abrégée. */
export interface NoeudAbrege {
	readonly nom: string;
	/**
	 * Déplié AU BALISAGE — `<li data-ouvert="oui">`. C'est ce que le libellé
	 * du chevron annonce, et il ne change pas avec le chemin courant.
	 */
	readonly deplie: boolean;
	readonly enfants: readonly NoeudAbrege[];
}

/** Une section d'univers de la forme abrégée. */
export interface SectionAbregee {
	readonly nom: string;
	readonly arbre: readonly NoeudAbrege[];
}

/** Un nœud abrégé prêt à rendre : le balisage, plus l'état de la page courante. */
export interface NoeudAbregeRendu {
	readonly nom: string;
	/**
	 * L'ADRESSE DU NŒUD — même raison que dans l'arborescence complète : le gel
	 * écrit `href="#"`, et le produit doit porter les siennes. Le premier niveau
	 * est un DOMAINE, les suivants ses dossiers.
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

/** Une section abrégée prête à rendre. */
export interface SectionAbregeeRendue {
	readonly nom: string;
	readonly arbre: readonly NoeudAbregeRendu[];
}

/**
 * Les deux sections et les quinze nœuds de la forme abrégée, dans l'ordre du
 * balisage. AUCUN TRI n'est appliqué : le gel ne trie pas, il énumère —
 * `Sauvegardes, Ordonnancement, Astreinte` n'est pas l'ordre alphabétique.
 */
export const SECTIONS_ABREGEES: readonly SectionAbregee[] = [
	{
		nom: 'Production',
		arbre: [
			{
				nom: 'Infrastructure',
				deplie: true,
				enfants: [
					{
						nom: 'Exploitation',
						deplie: true,
						enfants: [
							{ nom: 'Sauvegardes', deplie: false, enfants: [] },
							{ nom: 'Ordonnancement', deplie: false, enfants: [] },
							{ nom: 'Astreinte', deplie: false, enfants: [] }
						]
					},
					{
						nom: 'Supervision',
						deplie: false,
						enfants: [{ nom: 'Sondes', deplie: false, enfants: [] }]
					},
					{
						nom: 'Réseau',
						deplie: false,
						enfants: [{ nom: 'Adressage', deplie: false, enfants: [] }]
					}
				]
			},
			{
				nom: 'Applications',
				deplie: false,
				enfants: [{ nom: 'Fiches applicatives', deplie: false, enfants: [] }]
			},
			{
				nom: 'Poste de travail',
				deplie: false,
				enfants: [{ nom: 'Déploiement', deplie: false, enfants: [] }]
			}
		]
	},
	{
		nom: 'Projets',
		arbre: [
			{
				nom: 'Migration 2026',
				deplie: false,
				enfants: [{ nom: 'Lots', deplie: false, enfants: [] }]
			}
		]
	}
];

/**
 * Applique le chemin de la page courante à l'arborescence abrégée.
 *
 * Reproduit, à la propriété près, ce que le script des 26 maquettes fait
 * (`V-25:2590-2606`) : pour chaque nom du chemin, le nœud homonyme est mis en
 * évidence ; le DERNIER segment porte en plus `aria-current="page"` ; le nœud
 * et TOUS ses ancêtres se déplient. Le libellé du chevron, lui, n'est pas
 * touché — d'où `deplie`, qui reste celui du balisage.
 */
export function rendreNoeudsAbreges(
	noeuds: readonly NoeudAbrege[],
	courant: readonly string[],
	univers = '',
	domaine: string | null = null,
	chemin: readonly string[] = []
): readonly NoeudAbregeRendu[] {
	const dernier = courant.length ? courant[courant.length - 1] : null;
	return noeuds.map((n) => {
		const domaineDuNoeud = domaine ?? n.nom;
		const cheminDuNoeud = domaine === null ? [] : [...chemin, n.nom];
		const enfants = rendreNoeudsAbreges(n.enfants, courant, univers, domaineDuNoeud, cheminDuNoeud);
		const estCourant = courant.includes(n.nom);
		return {
			nom: n.nom,
			/* LES PARTIES, PAS L'ADRESSE COMPOSÉE. `resolve()` de SvelteKit n'admet
			   qu'un motif de route et ses paramètres — une chaîne composée à la main
			   lui est opaque, et `svelte/no-navigation-without-resolve` a raison de
			   l'exiger : une adresse concaténée casse sous une racine de
			   déploiement. La vue compose, avec le motif sous les yeux. */
			cible:
				univers === ''
					? null
					: {
							univers: identifiantLisible(univers),
							domaine: identifiantLisible(domaineDuNoeud),
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

/** L'arborescence abrégée, balisage et chemin courant réunis. */
export function railAbregeRendu(courant: readonly string[]): readonly SectionAbregeeRendue[] {
	return SECTIONS_ABREGEES.map((s) => ({
		nom: s.nom,
		arbre: rendreNoeudsAbreges(s.arbre, courant, s.nom, null)
	}));
}
