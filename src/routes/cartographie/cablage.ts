/**
 * LE CÂBLAGE DE LA CARTOGRAPHIE — les gestes de l'explorateur de graphe.
 *
 * `ARB-063` : le comportement s'accroche depuis la ROUTE, depuis `onMount` du
 * `+page.svelte` voisin. Il n'écrit AUCUNE règle de style : tout passe par des
 * attributs de données que `V-19.css` lit déjà.
 *
 * AUCUN FILTRE NE RECHARGE LA PAGE, ET C'EST LA DÉCISION QUI COMMANDE CE FICHIER.
 * Le périmètre naviguait, et chaque essai coûtait un rechargement complet plus trois
 * cent vingt tours de disposition. Un explorateur dont chaque essai coûte une
 * seconde n'est pas exploré. Couches, vivacité, taille, degré minimum et contours se
 * jouent donc sur le graphe déjà en place ; l'adresse suit par `replaceState`, si
 * bien qu'elle reste juste et partageable (`RG-M09-05`) sans rien relancer.
 *
 * LE MASQUAGE A UNE SEULE DÉFINITION, `$lib/graphe/filtres` — la même que la vue
 * emploie pour rendre l'état d'ouverture. Deux prédicats concurrents finiraient par
 * ne plus s'accorder, et la carte changerait au premier clic sans qu'aucun réglage
 * n'ait bougé.
 *
 * LE PANNEAU DE DÉTAIL EST REMPLI ICI, et il l'est à partir d'une table que la route
 * lui passe — jamais d'un texte relu sur le dessin. Il ne l'était PAS DU TOUT : la
 * vue n'en rendait que l'état vide, et un tiers de l'écran promettait un contenu qui
 * n'arrivait jamais.
 */
import { courbeDeLien } from '$lib/graphe/commandes';
import { contourDeGroupe } from '$lib/graphe/cartographie';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import {
	Attaches,
	cablerLaVue,
	placeDuNoeud,
	type CommandeDeVue,
	type Debranchement
} from '$lib/graphe/commandes';
import { areteMasquee, noeudMasque } from '$lib/graphe/filtres';
import { ORDRE_DES_ETATS, type EtatDeVivacite } from '$lib/fraicheur';
import {
	COUCHES,
	DEGRE_MINIMUM_MAXIMAL,
	EXPLORATION_DE_PLANCHE,
	type CoucheDeLiens,
	type EtatDExploration
} from './etat-dexploration';

/** Le nombre de suggestions de la recherche dans le graphe. */
const MAX_SUGGESTIONS = 8;

/**
 * Le nombre de notes proches listées dans le panneau. Le graphe d'affinité est
 * DENSE — le degré médian est de neuf, et le panneau n'est pas une liste de notes :
 * « Voir tous les voisins » ouvre l'écran qui l'est.
 */
const AFFINITES_MONTREES = 5;

/**
 * LE GROSSISSEMENT AU-DELÀ DUQUEL TOUTES LES NOTES PORTENT LEUR LIBELLÉ. En deçà,
 * seuls les pivots, le nœud survolé, le nœud choisi et ses voisins sont nommés :
 * à l'échelle d'un univers entier, deux titres se chevauchent avant d'être lus.
 */
const ZOOM_DES_LIBELLES = 1.6;

/** Ce que le panneau contextuel dit d'un nœud — la route le bâtit sur ses données. */
export interface VoisinAffiche {
	/** L'identifiant du nœud voisin — c'est lui qui retrouve sa place sur le dessin. */
	readonly note: string;
	readonly titre: string;
	readonly origine: string;
	readonly adresse: string;
}

export interface DetailDeNoeud {
	readonly titre: string;
	readonly type: string;
	/** Le code de trois lettres du type — ce que porte la vignette du panneau. */
	readonly codeType: string;
	readonly extrait: string;
	readonly etiquettes: readonly string[];
	/** Le libellé de l'état de vivacité, et sa classe de teinte. */
	readonly etat: string;
	readonly classeDEtat: string;
	/**
	 * L'ANCIENNETÉ, EN TOUTES LETTRES — « J+12 », ou « jamais vérifiée ». La maquette
	 * la met sur la même ligne que la vivacité, et c'est juste : un état sans son âge
	 * ne dit pas s'il vient de basculer ou s'il traîne depuis six mois.
	 */
	readonly anciennete: string;
	readonly centralite: number;
	readonly declarees: number;
	readonly deduites: number;
	readonly entrantes: number;
	readonly sortantes: number;
	readonly rupture: boolean;
	readonly famille: string | null;
	readonly origineDeFamille: string | null;
	/** Où la note est rangée — « Univers › Domaine ». */
	readonly rangement: string;
	readonly affinites: readonly VoisinAffiche[];
	/** Les nœuds du voisinage à la profondeur courante — affinités comprises. */
	readonly voisinageNoeuds: number;
	/** Les relations comprises dans cette même boule. */
	readonly voisinageRelations: number;
	readonly adresse: string;
	readonly adresseDuVoisinage: string;
	/**
	 * OÙ « VÉRIFIER LA NOTE » ENVOIE SA SOUMISSION. C'est l'action `?/verifier` de
	 * l'écran de lecture — la MÊME, pas une copie : le geste écrit une date de
	 * vérification et relance le cycle de vivacité, et il n'a qu'un seul endroit où
	 * il est écrit. Un bouton qui se contenterait d'ouvrir la note serait un bouton
	 * mort déguisé.
	 */
	readonly adresseDeVerification: string;
}

export interface OptionsDeLaCartographie {
	/** Ce que le sélecteur de périmètre montre au montage — `type|nom`. */
	readonly perimetreCourant: string;
	/** Les domaines lisibles et leur univers — le second sélecteur suit le premier. */
	readonly domaines: readonly { readonly nom: string; readonly univers: string }[];
	readonly adresseParType: string;
	/** Où mène « Déclarer une relation », ou `null` s'il n'y a pas de note. */
	readonly adresseDesRelations: string | null;
	/** L'état d'exploration d'ouverture, tel que l'adresse le porte. */
	readonly exploration: EtatDExploration;
	/** Ce que le panneau dit de chaque nœud. */
	readonly detailParNoeud: Readonly<Record<string, DetailDeNoeud>>;
	/** Vrai dans la vue locale : les filtres et la colonne de commande n'y sont pas. */
	readonly locale: boolean;
	/** Le nœud dont on explore le voisinage, ou `null` en vue complète. */
	readonly centre: string | null;
	/** La profondeur courante — ce que les trois boutons du panneau montrent. */
	readonly profondeur: number;
}

/**
 * LE CODE DE TYPE, LU SUR L'ATTRIBUT. Il était relu dans un `<text>` du dessin —
 * `.noeud__code` —, et ce texte a disparu du canevas : la maquette montre des
 * pastilles nues, et quatre-vingts codes de trois lettres écrits en blanc faisaient
 * lire un schéma technique là où on attend un graphe. La légende le porte encore, le
 * nœud le porte en donnée.
 */
function codeDeType(element: Element): string {
	return (
		element.getAttribute('data-code') ??
		(element.querySelector('.noeud__code')?.textContent ?? '').trim()
	);
}

/**
 * LES ÉLÉMENTS D'UNE PORTÉE. Elle est TOUJOURS donnée, et pour les nœuds du dessin
 * c'est toujours le SVG — jamais la page.
 *
 * `.noeud` NOMME DEUX CHOSES DANS CETTE PAGE : les nœuds du graphe, et les branches
 * de l'arborescence du RAIL, qui est rendu sur tout écran de coquille. Une requête
 * partie de la racine attrape donc les deux. C'était sans conséquence tant qu'on n'y
 * posait que `data-actif` ; depuis que `data-masque` commande un `display: none`,
 * porter le degré minimum à 1 faisait DISPARAÎTRE LE RAIL ENTIER — mesuré au
 * navigateur, cent soixante-quinze `.noeud` pour quatre-vingt-trois nœuds de graphe.
 */
function elements(portee: ParentNode, selecteur: string): Element[] {
	return Array.from(portee.querySelectorAll(selecteur));
}

export function cablerLaCartographie(
	racine: ParentNode,
	options: OptionsDeLaCartographie
): Debranchement {
	const attaches = new Attaches();
	const graphe = racine.querySelector('#graphe');
	if (graphe === null) return attaches.debranchement();

	const document = graphe.ownerDocument;
	const normaliser = (texte: string): string =>
		texte
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLocaleLowerCase('fr');
	let recherche = options.exploration.recherche ?? '';
	let fleches = options.exploration.fleches ?? false;
	let libelles = options.exploration.libelles ?? false;
	/* LE SEUIL DE ZOOM : au-delà, TOUTES les notes portent leur libellé. C'est une
	   règle de la maquette, et elle ne peut se tenir qu'ici — le grossissement ne
	   vit nulle part ailleurs que dans la commande de vue. */
	const vue = cablerLaVue(racine, attaches, (grossissement) => {
		graphe.setAttribute('data-zoom', grossissement >= ZOOM_DES_LIBELLES ? 'proche' : 'loin');
	});

	/* L'état vit ici, en une seule copie, et l'adresse le reflète. */
	const etat: {
		couches: CoucheDeLiens[];
		vivacite: EtatDeVivacite[];
		taille: EtatDExploration['taille'];
		degreMinimum: number;
		masquerIsolees: boolean;
		types: string[] | null;
		contours: boolean;
		nomsDeFamille: boolean;
	} = {
		couches: [...options.exploration.couches],
		vivacite: [...options.exploration.vivacite],
		taille: options.exploration.taille,
		degreMinimum: options.exploration.degreMinimum,
		masquerIsolees: options.exploration.masquerIsolees,
		types: options.exploration.types === null ? null : [...options.exploration.types],
		contours: options.exploration.contours,
		nomsDeFamille: options.exploration.nomsDeFamille
	};

	/* ── 1. Le masquage, et l'adresse qui le suit ──────────────────────────── */

	const traitsDuNoeud = (
		noeud: Element
	): { vivacite: EtatDeVivacite | null; degre: number; type: string } => {
		const brut = noeud.getAttribute('data-vivacite') ?? '';
		const vivacite = (ORDRE_DES_ETATS as readonly string[]).includes(brut)
			? (brut as EtatDeVivacite)
			: null;
		return {
			vivacite,
			degre: Number(noeud.getAttribute('data-degre') ?? '0'),
			type: codeDeType(noeud)
		};
	};

	const appliquerLesFiltres = (): void => {
		const visibles = new Set<string>();
		/**
		 * LA NOTE AU CENTRE DU VOISINAGE EST TOUJOURS VISIBLE, et il faut le dire ici :
		 * elle n'est PAS dessinée en `.noeud` — c'est le grand disque du centre —, si
		 * bien que la boucle ci-dessous ne la voyait pas. Toutes les arêtes qui la
		 * touchent étaient alors déclarées « une extrémité masquée », donc masquées :
		 * l'écran de voisinage s'ouvrait sans une seule relation, avec les seules
		 * affinités visibles. Mesuré au navigateur sur « Claude Code ».
		 */
		if (options.locale && options.centre !== null) visibles.add(options.centre);
		for (const noeud of elements(graphe, '.noeud')) {
			const id = noeud.getAttribute('data-id') ?? '';
			const d = options.detailParNoeud[id];
			const texte = d === undefined ? '' : [d.titre, d.type, ...d.etiquettes].join(' ');
			const correspond = normaliser(recherche)
				.split(/\s+/)
				.filter(Boolean)
				.every((mot) => normaliser(texte).includes(mot));
			const masque =
				id !== options.centre && (noeudMasque(traitsDuNoeud(noeud), etat) || !correspond);
			noeud.setAttribute('data-masque', masque ? 'oui' : 'non');
			if (!masque) visibles.add(noeud.getAttribute('data-id') ?? '');
		}
		for (const arete of elements(graphe, '.arete, .arete__etiquette')) {
			const couche = (arete.getAttribute('data-couche') ?? 'declarees') as CoucheDeLiens;
			const extremites =
				visibles.has(arete.getAttribute('data-de') ?? '') &&
				visibles.has(arete.getAttribute('data-vers') ?? '');
			/* L'étiquette d'une arête n'a pas d'attribut de couche : elle suit celle
			   du trait qu'elle nomme, retrouvé par ses deux extrémités. */
			const traitJumeau = graphe.querySelector(
				`.arete[data-de="${CSS.escape(arete.getAttribute('data-de') ?? '')}"][data-vers="${CSS.escape(arete.getAttribute('data-vers') ?? '')}"]`
			);
			const coucheEffective = arete.classList.contains('arete__etiquette')
				? ((traitJumeau?.getAttribute('data-couche') ?? 'declarees') as CoucheDeLiens)
				: couche;
			arete.setAttribute(
				'data-masque',
				areteMasquee(coucheEffective, extremites, etat) ? 'oui' : 'non'
			);
		}
		for (const trait of elements(graphe, '.affinite')) {
			trait.setAttribute(
				'data-masque',
				visibles.has(trait.getAttribute('data-de') ?? '') &&
					visibles.has(trait.getAttribute('data-vers') ?? '')
					? 'non'
					: 'oui'
			);
		}
		for (const forme of elements(graphe, '.famille__contour, .famille__tete')) {
			const membres = JSON.parse(forme.getAttribute('data-membres') ?? '[]') as string[];
			forme.setAttribute('data-masque', membres.every((id) => visibles.has(id)) ? 'non' : 'oui');
		}
		const compteur = racine.querySelector('#compte-visible');
		if (compteur)
			compteur.textContent = `${visibles.size} / ${elements(graphe, '.noeud').length} notes affichées`;
		graphe.setAttribute('data-fleches', fleches ? 'oui' : 'non');
		graphe.setAttribute('data-libelles', libelles ? 'oui' : 'non');
		graphe.setAttribute('data-contours', etat.contours ? 'oui' : 'non');
		graphe.setAttribute('data-noms', etat.nomsDeFamille ? 'oui' : 'non');
	};

	/**
	 * L'ADRESSE SUIT L'ÉTAT, SANS RECHARGER. `replaceState` plutôt que `pushState` :
	 * cocher une case n'est pas une navigation, et empiler quinze entrées d'historique
	 * pour un curseur rendrait le retour arrière inutilisable.
	 *
	 * SEUL CE QUI S'ÉCARTE DU DÉFAUT EST ÉCRIT : une adresse qui porterait les six
	 * réglages à leur valeur de repos serait illisible à copier, et donnerait à croire
	 * qu'on a réglé quelque chose.
	 */
	const ecrireLAdresse = (): void => {
		const fenetre = document.defaultView;
		if (fenetre === null) return;
		const adresse = new URL(fenetre.location.href);
		const p = adresse.searchParams;
		const poser = (cle: string, valeur: string, defaut: string): void => {
			if (valeur === defaut) p.delete(cle);
			else p.set(cle, valeur);
		};
		poser('recherche', recherche, '');
		poser('fleches', fleches ? 'oui' : 'non', 'non');
		poser('libelles', libelles ? 'oui' : 'non', 'non');
		poser('couches', etat.couches.join(','), EXPLORATION_DE_PLANCHE.couches.join(','));
		poser('vivacite', etat.vivacite.join(','), EXPLORATION_DE_PLANCHE.vivacite.join(','));
		poser('taille', etat.taille, EXPLORATION_DE_PLANCHE.taille);
		poser('degre', String(etat.degreMinimum), String(EXPLORATION_DE_PLANCHE.degreMinimum));
		poser('isolees', etat.masquerIsolees ? 'oui' : 'non', 'non');
		/* LES TYPES NE S'ÉCRIVENT QUE S'IL EN MANQUE UN. Tous cochés, c'est le défaut,
		   et l'adresse reste courte ; aucun coché est une intention — « ne montre
		   rien » — qui doit se transmettre telle quelle. */
		if (etat.types === null) p.delete('types');
		else p.set('types', etat.types.join(','));
		poser('contours', etat.contours ? 'oui' : 'non', 'oui');
		poser('noms', etat.nomsDeFamille ? 'oui' : 'non', 'oui');
		fenetre.history.replaceState(fenetre.history.state, '', adresse.toString());
	};

	const rejouer = (): void => {
		appliquerLesFiltres();
		ecrireLAdresse();
	};

	attaches.ecouter(racine.querySelector('#filtrer-notes'), 'input', (evenement) => {
		recherche = (evenement.target as HTMLInputElement).value;
		rejouer();
	});
	for (const curseur of elements(racine, '[data-force]')) {
		attaches.ecouter(curseur, 'change', () => {
			naviguerAvec([
				[curseur.getAttribute('data-force') ?? '', (curseur as HTMLInputElement).value]
			]);
		});
	}
	attaches.ecouter(racine.querySelector('#c-affinites'), 'change', (evenement) => {
		naviguerAvec([['affinites', (evenement.target as HTMLInputElement).checked ? 'oui' : 'non']]);
	});
	attaches.ecouter(racine.querySelector('#c-fleches'), 'change', (evenement) => {
		fleches = (evenement.target as HTMLInputElement).checked;
		rejouer();
	});
	attaches.ecouter(racine.querySelector('#c-libelles'), 'change', (evenement) => {
		libelles = (evenement.target as HTMLInputElement).checked;
		rejouer();
	});

	/* ── 2. La sélection d'un nœud, et le panneau qu'elle ouvre ────────────── */

	const detail = racine.querySelector('#detail');
	const corpsDuDetail = racine.querySelector('#detail-corps');
	const effacer = racine.querySelector<HTMLButtonElement>('#effacer-sel');

	const voisinsDe = (identifiant: string): Set<string> => {
		const voisins = new Set<string>([identifiant]);
		for (const arete of elements(graphe, '.arete')) {
			if (arete.getAttribute('data-masque') === 'oui') continue;
			const de = arete.getAttribute('data-de');
			const vers = arete.getAttribute('data-vers');
			if (de === identifiant && vers !== null) voisins.add(vers);
			if (vers === identifiant && de !== null) voisins.add(de);
		}
		return voisins;
	};

	const fermerLeDetail = (): void => {
		if (detail !== null) (detail as HTMLElement).hidden = true;
		racine.querySelector('.app')?.setAttribute('data-detail', 'ferme');
	};

	/** Le nœud choisi, ou `null` — ce qui distingue le survol de la sélection. */
	let choisi: string | null = null;

	/**
	 * CE QUI EST ACTIF AUTOUR D'UN NŒUD — le même marquage pour le survol et pour la
	 * sélection, et c'est ce qui garantit qu'ils montrent la MÊME chose. Le survol
	 * passe `null` en second argument : il ne pose aucun anneau de choix, et le
	 * quitter remet tout au repos.
	 */
	const marquerLeVoisinage = (identifiant: string, marqueDeChoix: string | null): void => {
		const voisins = voisinsDe(identifiant);
		graphe.setAttribute('data-focus', 'oui');
		for (const noeud of elements(graphe, '.noeud')) {
			const id = noeud.getAttribute('data-id') ?? '';
			noeud.setAttribute('data-actif', voisins.has(id) ? 'oui' : 'non');
			noeud.setAttribute('data-choisi', id === marqueDeChoix ? 'oui' : 'non');
		}
		for (const arete of elements(graphe, '.arete')) {
			const touche =
				arete.getAttribute('data-de') === identifiant ||
				arete.getAttribute('data-vers') === identifiant;
			arete.setAttribute('data-actif', touche ? 'oui' : 'non');
		}
	};

	const selectionner = (identifiant: string): void => {
		choisi = identifiant;
		marquerLeVoisinage(identifiant, identifiant);
		if (effacer !== null) effacer.disabled = false;
		effacerLesAffinites();
		remplirLeDetail(identifiant);
	};

	const effacerLaSelection = (): void => {
		choisi = null;
		graphe.setAttribute('data-focus', 'non');
		for (const noeud of elements(graphe, '.noeud')) {
			noeud.setAttribute('data-actif', 'non');
			noeud.setAttribute('data-choisi', 'non');
		}
		for (const arete of elements(graphe, '.arete')) arete.setAttribute('data-actif', 'non');
		if (effacer !== null) effacer.disabled = true;
		effacerLesAffinites();
		fermerLeDetail();
	};

	/* ── 3. Les affinités, révélées AUTOUR D'UN SEUL NŒUD ──────────────────── */

	const calqueDAffinites = racine.querySelector('#affinites');

	/**
	 * EN VUE LOCALE, LE CALQUE APPARTIENT À LA VUE. Elle rend les affinités du centre
	 * au balisage, étiquetées, parce que l'écran entier est « autour d'un nœud
	 * choisi » ; les effacer au premier clic emporterait ce que la page était venue
	 * montrer. En vue complète, elles n'existent qu'à la demande, et c'est ici.
	 */
	function effacerLesAffinites(): void {
		if (options.locale) return;
		if (calqueDAffinites !== null) calqueDAffinites.textContent = '';
	}

	/**
	 * LES TRAITS D'AFFINITÉ D'UN NŒUD, ET D'UN SEUL. C'est l'exception à la règle,
	 * et elle est bornée par construction : le degré d'affinité médian est de neuf,
	 * là où les tracer pour tout le graphe en donnerait six fois plus que de
	 * relations déclarées. Ils portent leur motif — « d'après l'étiquette
	 * installation » dit quelque chose, un pointillé anonyme non — et ils
	 * disparaissent à la sélection suivante.
	 */
	const revelerLesAffinites = (identifiant: string): void => {
		if (calqueDAffinites === null || options.locale || options.exploration.affinites === false)
			return;
		effacerLesAffinites();
		const source = placeDuNoeud(racine, identifiant);
		if (source === null) return;
		const detailDuNoeud = options.detailParNoeud[identifiant];
		if (detailDuNoeud === undefined) return;

		const svg = 'http://www.w3.org/2000/svg';
		for (const voisin of detailDuNoeud.affinites) {
			/* Une note proche peut être HORS du dessin : elle est dans le périmètre
			   des familles, qui se calculent sur toutes les notes lisibles, et le
			   voisinage local n'en montre qu'une partie. Sans place, pas de trait —
			   jamais un trait qui pend vers un nœud absent. */
			const place = placeDuNoeud(racine, voisin.note);
			if (
				place === null ||
				racine
					.querySelector(`.noeud[data-id="${CSS.escape(voisin.note)}"]`)
					?.getAttribute('data-masque') === 'oui'
			)
				continue;
			const trait = document.createElementNS(svg, 'line');
			trait.setAttribute('class', 'affinite');
			trait.setAttribute('data-de', identifiant);
			trait.setAttribute('data-vers', voisin.note);
			trait.setAttribute('x1', String(source.x));
			trait.setAttribute('y1', String(source.y));
			trait.setAttribute('x2', String(place.x));
			trait.setAttribute('y2', String(place.y));
			const titre = document.createElementNS(svg, 'title');
			titre.textContent = `${voisin.titre} — ${voisin.origine}`;
			trait.appendChild(titre);
			calqueDAffinites.appendChild(trait);
		}
	};

	/* ── 4. Le contenu du panneau ──────────────────────────────────────────── */

	/**
	 * LE PANNEAU DE LA NOTE — ses sections, dans l'ordre de la maquette :
	 * type et titre ; vivacité et ancienneté ; description ; étiquettes ;
	 * centralité ; connexions et leur détail ; famille sémantique et l'origine de
	 * son nom ; voisinage, sa profondeur et ses compteurs ; relations, entrantes et
	 * sortantes ; actions.
	 *
	 * AUCUN BOUTON MORT. Les trois actions font ce qu'elles disent : « Isoler le
	 * voisinage » ouvre l'écran de voisinage, « Ouvrir la note » ouvre la note, et
	 * « Vérifier la note » soumet l'action `?/verifier` de l'écran de lecture — la
	 * même, pas une copie. Cette dernière ne s'affiche qu'à qui a le droit d'écrire :
	 * `si-ecriture` est la classe que la coquille éteint pour les autres.
	 */
	function remplirLeDetail(identifiant: string): void {
		if (detail === null || corpsDuDetail === null) return;
		const d = options.detailParNoeud[identifiant];
		if (d === undefined) {
			fermerLeDetail();
			return;
		}
		corpsDuDetail.textContent = '';
		const html = document.createElement('div');

		const etiquettes = d.etiquettes
			.map((e) => `<span class="detail__etiq">#&nbsp;${echapper(e)}</span>`)
			.join('');
		const affinites = d.affinites
			.slice(0, AFFINITES_MONTREES)
			.map(
				(v) =>
					`<a class="rel-item" href="${echapper(v.adresse)}"><span class="rel-item__nom">${echapper(v.titre)}</span><span class="rel-item__type">${echapper(v.origine)}</span></a>`
			)
			.join('');

		const connexions = d.declarees + d.deduites;
		const accorde = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

		const profondeurs = [1, 2, 3]
			.map(
				(niveau) =>
					`<button type="button" class="btn-profondeur" data-profondeur="${niveau}" aria-pressed="${
						niveau === options.profondeur ? 'true' : 'false'
					}">${niveau}</button>`
			)
			.join('');

		html.innerHTML = [
			/* 1. Type et titre. */
			`<div class="detail__tete">`,
			`<span class="detail__vignette ${echapper(d.classeDEtat)}">${echapper(d.codeType)}</span>`,
			`<div class="detail__identite"><span class="detail__type">${echapper(d.type)}</span>`,
			`<h2 class="detail__titre">${echapper(d.titre)}</h2></div>`,
			`<button type="button" class="detail__fermer" id="detail-fermer" aria-label="Fermer le panneau">×</button></div>`,

			/* 2. Vivacité et ancienneté. */
			`<p class="detail__vivacite ${echapper(d.classeDEtat)}">`,
			`<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor"/></svg>`,
			`${echapper(d.etat)}<span class="detail__anciennete">· ${echapper(d.anciennete)}</span></p>`,

			/* 3. Description. */
			d.extrait === '' ? '' : `<p class="detail__extrait">${echapper(d.extrait)}</p>`,

			/* 4. Étiquettes. */
			etiquettes === '' ? '' : `<p class="detail__etiquettes">${etiquettes}</p>`,

			/* 5 et 6. Centralité, puis connexions et leur détail. */
			`<div class="detail__section"><div class="crit">`,
			`<div class="crit__boite"><span class="crit__nom">Centralité</span>`,
			`<span class="crit__val">${d.centralite.toFixed(2).replace('.', ',')}</span>`,
			`<span class="crit__detail">part de la plus haute du périmètre</span></div>`,
			`<div class="crit__boite"><span class="crit__nom">Connexions</span>`,
			`<span class="crit__val">${connexions}</span>`,
			`<span class="crit__detail">${d.declarees} déclarée${d.declarees > 1 ? 's' : ''} · ${d.deduites} déduite${d.deduites > 1 ? 's' : ''}</span></div>`,
			`</div>`,
			d.rupture
				? `<div class="crit__boite crit__boite--rupture"><span class="crit__val">Point de rupture</span><span class="crit__detail">son retrait isole une partie du périmètre</span></div>`
				: '',
			`</div>`,

			/* 7. Famille sémantique, et l'origine de son nom. */
			`<div class="detail__section"><span class="carto-etiq">Famille sémantique</span>`,
			d.famille === null
				? `<p class="detail__vide-ligne">Aucune : cette note ne partage ni étiquette, ni dossier, ni mot de titre avec une autre.</p>`
				: `<p class="prop"><span class="prop__corps"><span class="prop__cle">${echapper(d.famille)}</span><span class="prop__sous">${echapper(d.origineDeFamille ?? '')}</span></span></p>`,
			`</div>`,

			/* 8. Voisinage : la profondeur, ses compteurs, et le geste. */
			`<div class="detail__section"><span class="carto-etiq">Voisinage (profondeur ${options.profondeur})</span>`,
			`<div class="carto-segments" id="detail-profondeur" role="group" aria-label="Profondeur du voisinage">${profondeurs}</div>`,
			`<p class="detail__vide-ligne">${accorde(d.voisinageNoeuds, 'nœud')} · ${accorde(d.voisinageRelations, 'relation')} · ${accorde(d.affinites.length, 'affinité')}</p>`,
			affinites === '' ? '' : `<div class="rel-groupe">${affinites}</div>`,
			`<a class="rel-item rel-item--tous" href="${echapper(d.adresseDuVoisinage)}"><span class="rel-item__nom">Voir tous les voisins</span><span class="rel-item__type">→</span></a>`,
			`</div>`,

			/* 9. Relations : le décompte des entrantes et des sortantes. */
			`<div class="detail__section"><span class="carto-etiq">Relations</span>`,
			`<p class="prop"><span class="prop__glyphe" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5"/></svg></span>`,
			`<span class="prop__corps"><span class="prop__cle">${accorde(d.declarees, 'déclarée')}</span>`,
			`<span class="prop__sous">dont ${accorde(d.entrantes, 'entrante')} · ${accorde(d.sortantes, 'sortante')}</span></span></p>`,
			`<p class="prop"><span class="prop__glyphe" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"><path d="M2 8h12"/></svg></span>`,
			`<span class="prop__corps"><span class="prop__cle">${accorde(d.deduites, 'déduite')}</span>`,
			`<span class="prop__sous">tirées des liens écrits dans les corps</span></span></p>`,
			`<p class="prop"><span class="prop__glyphe" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2"><circle cx="8" cy="8" r="6"/></svg></span>`,
			`<span class="prop__corps"><span class="prop__cle">${accorde(d.affinites.length, 'affinité')}</span>`,
			d.famille === null
				? `<span class="prop__sous">aucune famille sémantique</span></span></p>`
				: `<span class="prop__sous">famille ${echapper(d.famille)}</span></span></p>`,
			`</div>`,

			/* 10. Actions. */
			`<div class="detail__section detail__actions">`,
			`<a class="carto-btn carto-btn--principal" href="${echapper(d.adresseDuVoisinage)}">`,
			`<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="2"/><circle cx="3" cy="4" r="1.6"/><circle cx="13" cy="4" r="1.6"/><circle cx="3" cy="12" r="1.6"/><circle cx="13" cy="12" r="1.6"/><path d="M4.3 5 6.6 6.8M11.7 5 9.4 6.8M4.3 11 6.6 9.2M11.7 11 9.4 9.2"/></svg>`,
			`Isoler le voisinage</a>`,
			`<a class="carto-btn" href="${echapper(d.adresse)}">`,
			`<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 2H4v12h8V5z"/><path d="M9 2v3h3"/></svg>`,
			`Ouvrir la note</a>`,
			`<form class="si-ecriture" method="post" action="${echapper(d.adresseDeVerification)}">`,
			`<button class="carto-btn" type="submit">`,
			`<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3.5 8.4 6.6 11.5 12.5 5"/></svg>`,
			`Vérifier la note</button></form>`,
			`</div>`
		].join('');

		for (const lien of html.querySelectorAll<HTMLAnchorElement>('a')) {
			const cible = new URL(lien.href, document.location.href);
			const centre = cible.searchParams.get('centre');
			if (centre === null) continue;
			const adresse = new URL(document.location.href);
			adresse.searchParams.set('centre', centre);
			adresse.searchParams.set('profondeur', String(options.profondeur));
			lien.href = adresse.toString();
		}
		corpsDuDetail.appendChild(html);
		(detail as HTMLElement).hidden = false;
		(detail as HTMLElement).scrollTop = 0;
		racine.querySelector('.app')?.setAttribute('data-detail', 'ouvert');

		const fermer = racine.querySelector('#detail-fermer');
		if (fermer !== null) fermer.addEventListener('click', effacerLaSelection, { once: true });

		/* LES TROIS BOUTONS DE PROFONDEUR SONT CRÉÉS ICI, donc écoutés ici : le
		   câblage général s'est accroché avant qu'ils existent. Ils portent le nœud
		   choisi ET la profondeur — depuis la cartographie, changer la profondeur
		   seule ne désignerait aucun voisinage. */
		for (const bouton of elements(racine, '#detail-profondeur .btn-profondeur')) {
			bouton.addEventListener('click', () => {
				const niveau = bouton.getAttribute('data-profondeur');
				if (niveau === null) return;
				naviguerAvec([
					['centre', identifiant],
					['profondeur', niveau]
				]);
			});
		}

		/* LES AFFINITÉS DU NŒUD CHOISI SE MONTRENT SUR LE DESSIN, sans qu'on ait
		   à le demander : c'est le seul endroit où l'affinité devient un trait, et
		   elle est bornée au voisinage d'UNE note. */
		revelerLesAffinites(identifiant);
	}

	/** Le texte posé dans du balisage : jamais tel quel. */
	function echapper(texte: string): string {
		const boite = document.createElement('div');
		boite.textContent = texte;
		return boite.innerHTML.replaceAll('"', '&quot;');
	}

	/* ── 5. Les gestes du canevas ──────────────────────────────────────────── */

	attaches.ecouter(graphe, 'click', (evenement) => {
		if (graphe.getAttribute('data-glisse') === 'oui') {
			graphe.removeAttribute('data-glisse');
			return;
		}
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		if (noeud === null || noeud === undefined) {
			effacerLaSelection();
			return;
		}
		const identifiant = noeud.getAttribute('data-id');
		if (identifiant !== null) selectionner(identifiant);
	});

	/** LE DOUBLE-CLIC OUVRE LA NOTE. Le clic simple explore, le double-clic quitte. */
	attaches.ecouter(graphe, 'dblclick', (evenement) => {
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		const identifiant = noeud?.getAttribute('data-id') ?? null;
		if (identifiant === null) return;
		const adresse = options.detailParNoeud[identifiant]?.adresse;
		/* `adresseDeNote()` compose l'adresse sur l'identifiant lisible de la note. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (adresse !== undefined) void goto(adresse);
	});

	attaches.ecouter(graphe, 'keydown', (evenement) => {
		const touche = (evenement as KeyboardEvent).key;
		if (touche === 'Escape') {
			effacerLaSelection();
			return;
		}
		if (touche !== 'Enter' && touche !== ' ') return;
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		const identifiant = noeud?.getAttribute('data-id');
		if (identifiant === null || identifiant === undefined) return;
		evenement.preventDefault();
		selectionner(identifiant);
	});

	attaches.ecouter(effacer, 'click', effacerLaSelection);

	/* ── 5 bis. LE SURVOL — les relations du nœud passent en pleine opacité ────
	   Les relations sont dessinées en transparence faible : sans cela, deux cent
	   quarante-cinq traits font un paquet où plus rien ne se lit. Le survol les
	   révèle, et il est TRANSITOIRE — il ne touche pas à la sélection, qui, elle,
	   ouvre le panneau et survit au geste suivant. */

	const survoler = (identifiant: string): void => {
		if (choisi !== null) return;
		marquerLeVoisinage(identifiant, null);
	};

	const cesserDeSurvoler = (): void => {
		if (choisi !== null) return;
		graphe.setAttribute('data-focus', 'non');
		for (const noeud of elements(graphe, '.noeud')) noeud.setAttribute('data-actif', 'non');
		for (const arete of elements(graphe, '.arete')) arete.setAttribute('data-actif', 'non');
	};

	attaches.ecouter(graphe, 'pointerover', (evenement) => {
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		const identifiant = noeud?.getAttribute('data-id') ?? null;
		if (identifiant !== null) survoler(identifiant);
	});
	attaches.ecouter(graphe, 'pointerout', (evenement) => {
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		if (noeud !== null && noeud !== undefined) cesserDeSurvoler();
	});

	/* ── 6. Les filtres de la colonne de commande ──────────────────────────── */

	const listeDeCases = (selecteur: string): HTMLInputElement[] =>
		Array.from(racine.querySelectorAll<HTMLInputElement>(selecteur));

	attaches.ecouter(racine.querySelector('#filtre-couches'), 'change', () => {
		etat.couches = COUCHES.filter((c) =>
			listeDeCases(`[data-couche="${c}"]`).some((e) => e.checked)
		);
		rejouer();
	});

	attaches.ecouter(racine.querySelector('#filtre-vivacite'), 'change', () => {
		etat.vivacite = ORDRE_DES_ETATS.filter((e) =>
			listeDeCases(`[data-vivacite="${e}"]`).some((c) => c.checked)
		);
		rejouer();
	});

	attaches.ecouter(racine.querySelector('#filtre-taille'), 'change', (evenement) => {
		const choisi = (evenement.target as HTMLInputElement | null)?.dataset['taille'];
		if (choisi === undefined) return;
		/* LA TAILLE CHANGE LE RAYON DES NŒUDS, DONC LE DESSIN : c'est le seul réglage
		   qui ne peut pas se jouer sur un attribut, et c'est le seul qui navigue. */
		naviguerAvec([['taille', choisi]]);
	});

	const curseur = racine.querySelector<HTMLInputElement>('#degre-min');
	const valeurDuCurseur = racine.querySelector('#degre-min-valeur');
	attaches.ecouter(curseur, 'input', () => {
		const brut = Number(curseur?.value ?? '0');
		etat.degreMinimum = Math.min(DEGRE_MINIMUM_MAXIMAL, Math.max(0, brut));
		if (valeurDuCurseur !== null) valeurDuCurseur.textContent = String(etat.degreMinimum);
		rejouer();
	});

	const cocher = (selecteur: string, poser: (valeur: boolean) => void): void => {
		const case_ = racine.querySelector<HTMLInputElement>(selecteur);
		attaches.ecouter(case_, 'change', () => {
			poser(case_?.checked === true);
			rejouer();
		});
	};
	/**
	 * L'INTERRUPTEUR « FAMILLES SÉMANTIQUES » COMMANDE LES DEUX CASES qu'il coiffe.
	 * Il ne double aucun réglage : il éteint le regroupement ENTIER d'un geste —
	 * contours et noms —, là où les deux cases le règlent finement. Sans lui, cacher
	 * le regroupement demanderait deux clics et la connaissance de ce que chaque
	 * case recouvre.
	 */
	const casesDuRegroupement = (): HTMLInputElement[] =>
		[
			racine.querySelector<HTMLInputElement>('#c-contours'),
			racine.querySelector<HTMLInputElement>('#c-noms')
		].filter((c): c is HTMLInputElement => c !== null);

	const maitreDuRegroupement = racine.querySelector<HTMLInputElement>('#c-regroupement');
	attaches.ecouter(maitreDuRegroupement, 'change', () => {
		const actif = maitreDuRegroupement?.checked === true;
		for (const c of casesDuRegroupement()) c.checked = actif;
		etat.contours = actif;
		etat.nomsDeFamille = actif;
		rejouer();
	});

	/** L'interrupteur suit ses deux cases : éteindre les deux l'éteint. */
	const accorderLeMaitre = (): void => {
		if (maitreDuRegroupement === null) return;
		maitreDuRegroupement.checked = etat.contours || etat.nomsDeFamille;
	};

	/**
	 * LES DEUX LIGNES DE « PÉRIMÈTRE » PORTENT LE REGARD SUR LEUR SÉLECTEUR. La
	 * maquette les montre comme des lignes cliquables ; un rappel inerte du périmètre
	 * serait un bouton mort, et le sélecteur qui le change est à trente centimètres
	 * de là, en haut de l'écran.
	 */
	for (const lien of elements(racine, '.lg--lien[data-vers]')) {
		attaches.ecouter(lien, 'click', () => {
			const cible = racine.querySelector<HTMLSelectElement>(
				`#${lien.getAttribute('data-vers') ?? ''}`
			);
			cible?.focus();
		});
	}

	cocher('#c-contours', (v) => {
		etat.contours = v;
		accorderLeMaitre();
	});
	cocher('#c-noms', (v) => {
		etat.nomsDeFamille = v;
		accorderLeMaitre();
	});
	cocher('#c-isolees', (v) => {
		etat.masquerIsolees = v;
	});

	const ruptures = racine.querySelector<HTMLInputElement>('#c-ruptures');
	attaches.ecouter(ruptures, 'change', () => {
		graphe.setAttribute('data-ruptures', ruptures?.checked === true ? 'oui' : 'non');
	});

	attaches.ecouter(racine.querySelector('#reinitialiser'), 'click', () => {
		reinitialiser();
	});

	/**
	 * « TOUT AFFICHER », DANS LE VOISINAGE : les mêmes filtres jetés, mais le
	 * voisinage GARDÉ. Sans cette nuance, le bouton renverrait à la cartographie
	 * entière — ce que « Retour à la cartographie » fait déjà, deux lignes plus haut.
	 */
	attaches.ecouter(racine.querySelector('#tout-afficher'), 'click', () => {
		reinitialiser(true);
	});

	/**
	 * LES DEUX SEULS RÉGLAGES QUI REDESSINENT — le périmètre, qui change les données,
	 * et la taille, qui change le rayon de chaque nœud donc la disposition. Tous les
	 * autres se jouent sur le graphe en place.
	 *
	 * `goto` PLUTÔT QUE `location.assign` : une navigation de client, qui rejoue le
	 * chargeur de cette page et rien d'autre — ni la coquille, ni le rail, ni les
	 * polices. `location.assign` reconstruisait tout le document à chaque essai.
	 *
	 * ELLE GARDE LES FILTRES. Elle les jetait — changer de périmètre remettait les
	 * cinq états, les deux couches et le degré minimum à leur valeur de repos —, si
	 * bien que comparer deux périmètres sous le même filtre était impossible.
	 * `Réinitialiser` reste le geste qui les jette, et il est écrit sur un bouton.
	 */
	function naviguerAvec(reglages: readonly (readonly [string, string])[]): void {
		const adresse = new URL(resolve('/cartographie'), document.location.origin);
		for (const [nom, v] of new URL(document.location.href).searchParams) {
			adresse.searchParams.append(nom, v);
		}
		for (const [cle, valeur] of reglages) adresse.searchParams.set(cle, valeur);
		/* Le chemin vient de `resolve()` ; ce que la règle ne sait pas exprimer, c'est
		   la requête. Même désarmement qu'en `V-13`, `V-03`, `V-22` et `V-24`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresse, { noScroll: true, keepFocus: true });
	}

	/**
	 * `Réinitialiser` : le périmètre reste, tout le reste retourne au repos. Le
	 * voisinage aussi, sauf quand on demande à le garder — c'est « Tout afficher ».
	 */
	function reinitialiser(garderLeVoisinage = false): void {
		const courante = new URL(document.location.href).searchParams;
		const perimetre = courante.get('perimetre');
		const adresse = new URL(resolve('/cartographie'), document.location.origin);
		if (perimetre !== null) adresse.searchParams.set('perimetre', perimetre);
		if (garderLeVoisinage) {
			const centre = courante.get('centre');
			const profondeur = courante.get('profondeur');
			if (centre !== null) adresse.searchParams.set('centre', centre);
			if (profondeur !== null) adresse.searchParams.set('profondeur', profondeur);
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresse, { noScroll: true, keepFocus: true });
	}

	/* ── 7. Les types se cochent ────────────────────────────────────────────
	   ILS S'ISOLAIENT AU CLIC, ET LE GESTE NE MARCHAIT PAS. Le code d'un type se
	   relisait sur un `<text>` du nœud — `.noeud__code` — que le canevas ne rend
	   plus depuis que les pastilles y sont nues : `codeDeType()` rendait la chaîne
	   vide pour tout nœud, jamais égale au code du bouton, si bien que cliquer un
	   type mettait le graphe ENTIER à quatorze pour cent. Le nœud porte désormais
	   son code en attribut, et le filtre est une case comme les quatre autres :
	   même prédicat, même compte, même adresse. */

	const casesDeType = (): HTMLInputElement[] =>
		Array.from(racine.querySelectorAll<HTMLInputElement>('#filtre-types input[data-type]'));

	attaches.ecouter(racine.querySelector('#filtre-types'), 'change', () => {
		const toutes = casesDeType();
		const cochees = toutes.filter((c) => c.checked).map((c) => c.dataset['type'] ?? '');
		/* Toutes cochées, c'est `null` : le filtre ne connaît pas les types créés en
		   console, et une liste close en ferait disparaître un sans le dire. */
		etat.types = cochees.length === toutes.length ? null : cochees;
		rejouer();
	});

	/* ── 8. Le périmètre — deux sélecteurs qui se composent ──────────────────
	   IL NAVIGUE, ET C'EST LE SEUL RÉGLAGE QUI LE DOIT : changer de périmètre change
	   les DONNÉES — les familles et la centralité se calculent dessus, au chargeur.
	   Mais il navigue par `goto`, jamais par `location.assign` : la première est une
	   navigation de client, qui ne rejoue ni la coquille ni le rail. */

	const selUnivers = racine.querySelector<HTMLSelectElement>('#perimetre-univers');
	const selDomaine = racine.querySelector<HTMLSelectElement>('#perimetre-domaine');

	/** La valeur de périmètre que les deux sélecteurs composent — `type|nom`. */
	const perimetreCompose = (universChoisi: string, domaineChoisi: string): string => {
		if (domaineChoisi !== '') return `domaine|${domaineChoisi}`;
		if (universChoisi !== '') return `univers|${universChoisi}`;
		return 'global|';
	};

	if (selUnivers !== null) {
		attaches.ecouter(selUnivers, 'change', () => {
			/* CHANGER D'UNIVERS LÂCHE LE DOMAINE. Le garder désignerait un domaine
			   d'un autre univers, et le périmètre affiché ne serait plus celui du
			   sélecteur — l'écran mentirait sur ce qu'il montre. */
			naviguerAvec([['perimetre', perimetreCompose(selUnivers.value, '')]]);
		});
	}
	if (selDomaine !== null) {
		attaches.ecouter(selDomaine, 'change', () => {
			const universDuDomaine =
				options.domaines.find((d) => d.nom === selDomaine.value)?.univers ?? '';
			naviguerAvec([
				['perimetre', perimetreCompose(selUnivers?.value ?? universDuDomaine, selDomaine.value)]
			]);
		});
	}

	/* ── 8 bis. Le panneau d'affichage se replie ─────────────────────────────
	   Il est posé SUR le canevas : sur un petit écran, ou pour regarder un îlot
	   qu'il recouvre, on doit pouvoir le pousser de côté sans perdre ses réglages. */

	const panneau = racine.querySelector('#commandes');
	const bascule = racine.querySelector('#carto-reglages-bascule');
	if (document.defaultView?.matchMedia('(max-width: 1080px)').matches) {
		panneau?.setAttribute('data-replie', 'oui');
		bascule?.setAttribute('aria-expanded', 'false');
		bascule?.setAttribute('aria-label', 'Déplier le panneau d’affichage');
	}
	attaches.ecouter(racine.querySelector('.carto-retour'), 'click', (evenement) => {
		evenement.preventDefault();
		naviguerAvec([['centre', '']]);
	});
	attaches.ecouter(bascule, 'click', () => {
		const ouvert = panneau?.getAttribute('data-replie') !== 'oui';
		panneau?.setAttribute('data-replie', ouvert ? 'oui' : 'non');
		bascule?.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
		bascule?.setAttribute(
			'aria-label',
			ouvert ? 'Déplier le panneau d’affichage' : 'Replier le panneau d’affichage'
		);
	});

	/* ── 9. La profondeur du voisinage, en vue locale ──────────────────────── */

	for (const bouton of elements(racine, '.btn-profondeur')) {
		attaches.ecouter(bouton, 'click', () => {
			const niveau = bouton.getAttribute('data-profondeur');
			if (niveau === null) return;
			naviguerAvec([['profondeur', niveau]]);
		});
	}

	/* ── 10. Les deux onglets de mode ──────────────────────────────────────── */

	attaches.ecouter(racine.querySelector('.bascule-vue[role="tablist"]'), 'click', (evenement) => {
		const onglet = (evenement.target as Element | null)?.closest('[data-vue]');
		if (onglet === null || onglet === undefined) return;
		evenement.preventDefault();
		const cible = (onglet as HTMLElement).dataset['vue'];
		/* L'adresse vient de la route, qui l'a déjà passée par `resolve()`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (cible === 'maitre') void goto(options.adresseParType);
	});

	/* ── 11. « Déclarer une relation », depuis le bandeau ──────────────────── */

	const versRelations = racine.querySelector('#vers-relations');
	if (versRelations !== null && options.adresseDesRelations !== null) {
		attaches.ecouter(versRelations, 'click', () => {
			/* Composée par la route à partir de l'identifiant lisible de la note. */
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			void goto(options.adresseDesRelations ?? '');
		});
	}

	/* ── 12. Le déplacement et le zoom à la molette ────────────────────────── */

	cablerLaPrehension(racine, attaches, vue);

	/* ── 13. La recherche dans le graphe ───────────────────────────────────── */

	cablerLaRechercheDeNoeud(racine, attaches, vue, selectionner, options.detailParNoeud);

	/* L'état d'ouverture est posé une fois : la vue l'a déjà rendu, et le rejouer
	   ici garantit que les deux prédicats donnent bien le même masquage. */
	appliquerLesFiltres();

	/* LA SÉLECTION NE SURVIT PAS À UN CHANGEMENT DE PÉRIMÈTRE. Le câblage se refait
	   à chaque navigation de client, mais le document, lui, garde ce que le câblage
	   précédent y avait posé : le panneau restait ouvert sur une note absente du
	   nouveau dessin, et le graphe entier estompé autour d'elle. */
	effacerLaSelection();

	/**
	 * LA VUE LOCALE OUVRE SUR SON NŒUD, PANNEAU REMPLI. Les traits d'affinité y sont
	 * déjà, rendus par la vue : y arriver EST la demande, et le panneau doit dire de
	 * quoi le dessin parle sans qu'on ait à cliquer le nœud qui est au centre.
	 */
	if (options.locale && options.centre !== null) {
		/* SANS ESTOMPER. `selectionner()` éteint le reste du graphe pour isoler un
		   voisinage au sein d'un grand dessin — mais ici l'écran ENTIER est ce
		   voisinage : l'estomper laverait tout ce qu'on est venu voir. Seul le panneau
		   s'ouvre, et le nœud choisi porte son anneau. */
		choisi = options.centre;
		const centre = racine.querySelector(`.noeud[data-id="${CSS.escape(options.centre)}"]`);
		centre?.setAttribute('data-choisi', 'oui');
		if (effacer !== null) effacer.disabled = false;
		remplirLeDetail(options.centre);
	}

	return attaches.debranchement();
}

/**
 * LE DÉPLACEMENT À LA SOURIS ET LE ZOOM À LA MOLETTE.
 *
 * Ils n'existaient PAS : le canevas n'offrait que deux boutons plus et moins sur un
 * repère figé. Une carte qu'on ne peut pas déplacer à la main n'est pas explorable,
 * quelle que soit la qualité de son dessin — et `V-19.css` posait déjà le curseur de
 * préhension, `grab` puis `grabbing`, pour un geste que rien ne branchait.
 *
 * LE ZOOM SUIT LE POINTEUR, jamais le centre du repère : grossir au centre pendant
 * qu'on regarde un coin fait perdre ce qu'on visait, et c'est le défaut qui rend un
 * zoom inutilisable.
 */
/** Le repère du dessin, lu sur son `viewBox` — jamais une constante. */
function cablerLaPrehension(racine: ParentNode, attaches: Attaches, vue: CommandeDeVue): void {
	const svg = racine.querySelector<SVGSVGElement>('#graphe');
	const dessin = racine.querySelector<SVGGElement>('#racine');
	if (svg === null || dessin === null) return;
	let geste: {
		id: number;
		x: number;
		y: number;
		origineX: number;
		origineY: number;
		noeud: Element | null;
		deplace: boolean;
	} | null = null;
	const point = (x: number, y: number, cible: SVGGraphicsElement): DOMPoint => {
		const matrice = cible.getScreenCTM();
		return matrice ? new DOMPoint(x, y).matrixTransform(matrice.inverse()) : new DOMPoint(x, y);
	};
	const rafraichirLesTraits = (): void => {
		for (const trait of elements(svg, '.arete, .affinite, .arete__etiquette')) {
			const a = placeDuNoeud(racine, trait.getAttribute('data-de') ?? '');
			const b = placeDuNoeud(racine, trait.getAttribute('data-vers') ?? '');
			if (!a || !b) continue;
			const dx = b.x - a.x,
				dy = b.y - a.y;
			const rayon = (id: string): number =>
				Number(
					racine.querySelector(`.noeud[data-id="${CSS.escape(id)}"]`)?.getAttribute('data-rayon') ??
						9
				);
			if (trait.tagName === 'path')
				trait.setAttribute(
					'd',
					courbeDeLien(
						{ ...a, r: rayon(trait.getAttribute('data-de') ?? '') },
						{ ...b, r: rayon(trait.getAttribute('data-vers') ?? '') }
					)
				);
			else if (trait.tagName === 'line') {
				for (const [cle, valeur] of Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }))
					trait.setAttribute(cle, String(valeur));
			} else {
				trait.setAttribute('x', String((a.x + b.x) / 2 - dy * 0.05));
				trait.setAttribute('y', String((a.y + b.y) / 2 + dx * 0.05));
			}
		}
		for (const contour of elements(svg, '.famille__contour')) {
			const ids = new Set<string>(JSON.parse(contour.getAttribute('data-membres') ?? '[]'));
			const membres = elements(svg, '.noeud').filter((n) =>
				ids.has(n.getAttribute('data-id') ?? '')
			);
			const places = membres
				.map((n) => placeDuNoeud(racine, n.getAttribute('data-id') ?? ''))
				.filter((p) => p !== null);
			const chemin = contourDeGroupe(
				places,
				membres.map((n) => Number(n.getAttribute('data-rayon') ?? 9)),
				24
			);
			if (chemin) contour.setAttribute('d', chemin);
		}
	};
	attaches.ecouter(svg, 'pointerdown', (evenement) => {
		const e = evenement as PointerEvent;
		if (e.button !== 0 || geste !== null) return;
		const noeud = (e.target as Element | null)?.closest('.noeud') ?? null;
		const p = point(e.clientX, e.clientY, noeud ? dessin : svg);
		const origine = noeud
			? placeDuNoeud(racine, noeud.getAttribute('data-id') ?? '')
			: vue.position();
		if (!origine) return;
		svg.removeAttribute('data-glisse');
		geste = {
			id: e.pointerId,
			x: p.x,
			y: p.y,
			origineX: origine.x,
			origineY: origine.y,
			noeud,
			deplace: false
		};
	});
	attaches.ecouter(svg, 'pointermove', (evenement) => {
		const e = evenement as PointerEvent;
		if (!geste || geste.id !== e.pointerId) return;
		const p = point(e.clientX, e.clientY, geste.noeud ? dessin : svg);
		const dx = p.x - geste.x,
			dy = p.y - geste.y;
		if (!geste.deplace && Math.hypot(dx, dy) < 3) return;
		svg.setPointerCapture(e.pointerId);
		geste.deplace = true;
		svg.classList.add('tire');
		if (geste.noeud) {
			geste.noeud.setAttribute(
				'transform',
				`translate(${geste.origineX + dx},${geste.origineY + dy})`
			);
			rafraichirLesTraits();
		} else vue.deplacer(geste.origineX + dx, geste.origineY + dy);
	});
	const relacher = (evenement: Event): void => {
		const e = evenement as PointerEvent;
		if (!geste || geste.id !== e.pointerId) return;
		if (geste.deplace) svg.setAttribute('data-glisse', 'oui');
		geste = null;
		svg.classList.remove('tire');
		if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
	};
	attaches.ecouter(svg, 'pointerup', relacher);
	attaches.ecouter(svg, 'pointercancel', relacher);
	attaches.ecouter(svg, 'wheel', (evenement) => {
		const e = evenement as WheelEvent;
		e.preventDefault();
		const p = point(e.clientX, e.clientY, svg);
		vue.grossirVers(p.x, p.y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
	});
	attaches.ecouter(svg, 'keydown', (evenement) => {
		const e = evenement as KeyboardEvent;
		if (e.key === '+' || e.key === '=') {
			e.preventDefault();
			vue.agrandir();
		}
		if (e.key === '-') {
			e.preventDefault();
			vue.reduire();
		}
		const direction = {
			ArrowLeft: [1, 0],
			ArrowRight: [-1, 0],
			ArrowUp: [0, 1],
			ArrowDown: [0, -1]
		}[e.key];
		if (direction) {
			e.preventDefault();
			const p = vue.position(),
				pas = e.shiftKey ? 100 : 30;
			vue.deplacer(p.x + (direction[0] ?? 0) * pas, p.y + (direction[1] ?? 0) * pas);
		}
	});
}

/**
 * LA RECHERCHE DANS LE GRAPHE. C'est le seul endroit de ce module qui crée des
 * nœuds pour la liste : `#rech-liste` est VIDE au balisage, et c'est un
 * `role="listbox"` qui n'a de sens qu'une fois peuplé.
 */
function cablerLaRechercheDeNoeud(
	racine: ParentNode,
	attaches: Attaches,
	vue: CommandeDeVue,
	selectionner: (identifiant: string) => void,
	detailParNoeud: Readonly<Record<string, DetailDeNoeud>>
): void {
	const champ = racine.querySelector<HTMLInputElement>('#rech');
	const boite = racine.querySelector('#rech-graphe');
	const liste = racine.querySelector('#rech-liste');
	if (champ === null || boite === null || liste === null) return;

	const sauterVers = (identifiant: string): void => {
		const place = placeDuNoeud(racine, identifiant);
		if (place !== null) vue.centrerSur(place.x, place.y);
		selectionner(identifiant);
		boite.setAttribute('data-ouvert', 'non');
		champ.value = '';
	};

	const rendre = (): void => {
		const requete = champ.value.trim().toLocaleLowerCase('fr');
		liste.textContent = '';
		if (requete === '') {
			boite.setAttribute('data-ouvert', 'non');
			return;
		}

		const trouves = Object.entries(detailParNoeud)
			.filter(
				([id, d]) =>
					d.titre.toLocaleLowerCase('fr').includes(requete) &&
					racine.querySelector(`.noeud[data-id="${CSS.escape(id)}"]:not([data-masque="oui"])`) !==
						null
			)
			.slice(0, MAX_SUGGESTIONS);

		for (const [identifiant, d] of trouves) {
			const bouton = liste.ownerDocument.createElement('button');
			bouton.type = 'button';
			bouton.className = 'rg';
			bouton.setAttribute('role', 'option');
			bouton.setAttribute('aria-selected', 'false');
			const titre = liste.ownerDocument.createElement('span');
			titre.className = 'rg__t';
			titre.textContent = d.titre;
			const sous = liste.ownerDocument.createElement('span');
			sous.className = 'rg__s';
			sous.textContent = `${d.type} · ${d.etat}`;
			bouton.append(titre, sous);
			bouton.addEventListener('mousedown', (evenement) => {
				evenement.preventDefault();
				sauterVers(identifiant);
			});
			liste.appendChild(bouton);
		}
		boite.setAttribute('data-ouvert', trouves.length > 0 ? 'oui' : 'non');
	};

	attaches.ecouter(champ, 'input', rendre);
	attaches.ecouter(champ, 'blur', () => {
		boite.setAttribute('data-ouvert', 'non');
	});
	attaches.ecouter(champ, 'keydown', (evenement) => {
		const e = evenement as KeyboardEvent;
		if (e.key === 'Escape') {
			champ.value = '';
			boite.setAttribute('data-ouvert', 'non');
			return;
		}
		if (e.key !== 'Enter') return;
		e.preventDefault();
		const premier = liste.querySelector<HTMLButtonElement>('.rg');
		premier?.dispatchEvent(new MouseEvent('mousedown'));
	});
}
