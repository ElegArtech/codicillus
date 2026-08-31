import {
	SANS_DESIGNATION,
	identifiantDUnivers,
	identifiantDeDomaine,
	identifiantLisible,
	type DesignationsDeRangement
} from '../rangement/adresses';
import type { NoeudDeDossier, SectionDUnivers } from './arborescence'; /**
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
 * L'ARBRE DU GEL, LUI, N'EST PLUS PORTÉ ICI — voir plus bas : une valeur par
 * défaut est livrée au navigateur, prise ou non. Ce qui reste est la FORME
 * (`NoeudAbrege`, `SectionAbregee`) et le rendu du chemin courant, que la base
 * alimente par `sectionsAbregeesDuCorpus()`.
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
	/** `/univers/{univers}` — la page de l'univers. Absente au gel, qui n'en a pas. */
	readonly cible?: string;
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
	/** `/univers/{univers}` — la page de l'univers. Absente au gel, qui n'en a pas. */
	readonly cible?: string;
	readonly arbre: readonly NoeudAbregeRendu[];
}

/*
 * ═════════════════════════════════════════════════════════════════════════
 * `SECTIONS_ABREGEES` A ÉTÉ RETIRÉE, ET CE N'EST PAS UNE SIMPLIFICATION
 *
 * Ce module portait les deux sections et les quinze nœuds du gel écrits en
 * dur — Production, Infrastructure, Exploitation, Sauvegardes, Ordonnancement,
 * Astreinte, Supervision, Sondes, Réseau, Adressage, Applications, Poste de
 * travail, Projets, Migration 2026 — comme VALEUR PAR DÉFAUT de
 * `railAbregeRendu()`. Une valeur par défaut n'est jamais élaguée : l'arbre
 * partait dans TOUT paquet montant une coquille, et se lisait dans le source
 * servi au navigateur, sur des instances qui n'ont jamais eu ces domaines.
 *
 * Le repli n'était pris que sans contexte d'identité, cas qui n'existe pas en
 * application — la page d'erreur elle-même est rendue dans le gabarit racine.
 * Il ne rendait donc service qu'au rendu par défaut d'une vue, et le prix en
 * était le jeu de démonstration livré à tout le monde.
 *
 * LE DÉFAUT EST DÉSORMAIS L'ÉTAT VIDE : sans arborescence servie, le rail
 * abrégé ne rend aucune section. Une base vide n'est pas une absence de base,
 * et une vue sans données n'a pas d'arbre à montrer.
 */

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
			deplie: n.deplie,
			ouvert: n.deplie || estCourant || enfants.some((e) => e.ouvert),
			courant: estCourant,
			page: dernier !== null && n.nom === dernier
		};
	});
}

/* ═══════════════════════════════ La dérivation depuis les données ═══════ */

/**
 * L'ARBORESCENCE ABRÉGÉE, DÉRIVÉE DU CORPUS RÉEL.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE FONCTION RÉPARE, ET POURQUOI L'EN-TÊTE CI-DESSUS ÉTAIT JUSTE
 * SUR LES FAITS ET FAUX SUR LA CONCLUSION
 *
 * Ce module portait l'arbre des maquettes ÉCRIT EN DUR — Production,
 * Infrastructure, Exploitation, Sauvegardes, Ordonnancement, Astreinte,
 * Supervision, Sondes, Réseau, Adressage, Applications, Poste de travail,
 * Projets, Migration 2026. Vingt-deux vues sur quarante et une emploient la
 * forme abrégée. Sur ces vingt-deux écrans, LE RAIL DE NAVIGATION IGNORAIT LA
 * BASE.
 *
 * MESURÉ LE 21/08/2026 sur une instance NEUVE — un seul univers créé en
 * console, « Direction juridique » : dix pages sur douze affichaient dans leur
 * rail « Infrastructure », « Migration 2026 », « Poste de travail ». Des
 * univers et des domaines QUI N'EXISTAIENT PAS. Le rail proposait de naviguer
 * vers `/univers/production/infrastructure`, qui rend 404.
 *
 * L'EN-TÊTE DE CE FICHIER A RAISON SUR LES FAITS : le balisage abrégé du gel
 * n'est PAS emboîté avec l'arbre du corpus, et aucune fonction ne déduit l'un
 * de l'autre. Mais il en tire la mauvaise conclusion. Ce que dessine une
 * maquette est du CONTENU DE DÉMONSTRATION, au même titre que les titres de
 * notes qu'on y lit — et personne n'a jamais proposé de servir « Restaurer une
 * sauvegarde PostgreSQL » à toutes les instances au motif que la maquette la
 * dessine. La forme abrégée est une FAÇON DE RENDRE, pas une donnée.
 *
 * L'ARBRE DU GEL NE RESTE PAS COMME DÉFAUT, et c'est le second temps du même
 * raisonnement : ce qu'une valeur par défaut porte est LIVRÉ au navigateur, que
 * la branche soit prise ou non. Le défaut est donc la liste vide, et une vue
 * rendue sans données rend un rail vide.
 */
export function sectionsAbregeesDuCorpus(
	sections: readonly SectionDUnivers[],
	designations: DesignationsDeRangement = SANS_DESIGNATION
): readonly SectionAbregee[] {
	const enNoeud = (n: NoeudDeDossier): NoeudAbrege => ({
		nom: n.nom,
		/* `deplie` est l'état ÉCRIT du balisage, distinct de `ouvert` que le
		   chemin courant calcule. Rien dans la base ne porte un état de dépliage :
		   on le laisse fermé, et `rendreNoeudsAbreges()` ouvrira les ancêtres de
		   la page courante, comme il le fait déjà pour le gel. */
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
 * L'arborescence abrégée, rendue pour un chemin courant.
 *
 * `sections` VAUT LA LISTE VIDE PAR DÉFAUT. Elle valait l'arbre du gel, et une
 * valeur par défaut ne s'élague pas : les quinze nœuds de la maquette partaient
 * dans tout paquet montant une coquille. En application, la coquille passe
 * l'arbre dérivé de la base par `sectionsAbregeesDuCorpus()`.
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
