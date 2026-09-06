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
	readonly extrait: string;
	readonly etiquettes: readonly string[];
	/** Le libellé de l'état de vivacité, et sa classe de teinte. */
	readonly etat: string;
	readonly classeDEtat: string;
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
	readonly adresse: string;
	readonly adresseDuVoisinage: string;
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
	const vue = cablerLaVue(racine, attaches);

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
		for (const noeud of elements(graphe, '.noeud')) {
			const masque = noeudMasque(traitsDuNoeud(noeud), etat);
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

	const selectionner = (identifiant: string): void => {
		const voisins = voisinsDe(identifiant);
		graphe.setAttribute('data-focus', 'oui');
		for (const noeud of elements(graphe, '.noeud')) {
			const id = noeud.getAttribute('data-id') ?? '';
			noeud.setAttribute('data-actif', voisins.has(id) ? 'oui' : 'non');
			noeud.setAttribute('data-choisi', id === identifiant ? 'oui' : 'non');
		}
		for (const arete of elements(graphe, '.arete')) {
			const touche =
				arete.getAttribute('data-de') === identifiant ||
				arete.getAttribute('data-vers') === identifiant;
			arete.setAttribute('data-actif', touche ? 'oui' : 'non');
		}
		if (effacer !== null) effacer.disabled = false;
		effacerLesAffinites();
		remplirLeDetail(identifiant);
	};

	const effacerLaSelection = (): void => {
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
		if (calqueDAffinites === null) return;
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
			if (place === null) continue;
			const trait = document.createElementNS(svg, 'line');
			trait.setAttribute('class', 'affinite');
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
			.map(
				(v) =>
					`<a class="rel-item" href="${echapper(v.adresse)}"><span class="rel-item__nom">${echapper(v.titre)}</span><span class="rel-item__type">${echapper(v.origine)}</span></a>`
			)
			.join('');

		html.innerHTML = [
			`<div class="detail__tete"><h2 class="detail__titre">${echapper(d.titre)}</h2>`,
			`<button type="button" class="detail__fermer" id="detail-fermer" aria-label="Fermer le panneau">×</button></div>`,
			`<p class="detail__sous"><span class="detail__type">${echapper(d.type)}</span>`,
			`<span class="detail__etat ${echapper(d.classeDEtat)}">${echapper(d.etat)}</span></p>`,
			d.extrait === '' ? '' : `<p class="detail__extrait">${echapper(d.extrait)}</p>`,
			etiquettes === '' ? '' : `<p class="detail__etiquettes">${etiquettes}</p>`,
			`<div class="detail__section"><span class="etiq">Mesures</span><div class="crit">`,
			`<div class="crit__boite" title="Part de la centralité de passage la plus élevée du périmètre : le nœud le plus central vaut 1,00."><span class="crit__val">${d.centralite.toFixed(2).replace('.', ',')}</span><span class="crit__nom">Centralité<span class="apropos" aria-hidden="true">ⓘ</span></span></div>`,
			`<div class="crit__boite"><span class="crit__val">${d.declarees + d.deduites}</span><span class="crit__nom">Relations</span></div>`,
			`</div>`,
			d.rupture
				? `<div class="crit__boite crit__boite--rupture"><span class="crit__val">Point de rupture</span><span class="crit__nom">son retrait isole une partie du périmètre</span></div>`
				: '',
			`</div>`,
			/* LES DEUX NATURES NE S'ADDITIONNENT PAS AVEC LES AFFINITÉS. Un chiffre
			   unique posé au-dessus des trois serait faux : la maquette en portait un
			   — « 12 connexions : 4 déclarées, 2 déduites, 9 affinités » —, dont les
			   parts font quinze. Les relations se comptent ensemble, les affinités à
			   part, parce qu'elles ne sont pas de même nature. */
			`<div class="detail__section"><span class="etiq">Rangement</span>`,
			`<p class="detail__vide-ligne">${echapper(d.rangement)}</p></div>`,
			`<div class="detail__section"><span class="etiq">Relations</span>`,
			`<p class="prop"><span class="prop__cle">Déclarées</span>${d.declarees}</p>`,
			`<p class="prop"><span class="prop__cle">Déduites</span>${d.deduites}</p>`,
			`<p class="prop"><span class="prop__cle">Sens</span>${d.entrantes} entrante${d.entrantes > 1 ? 's' : ''} · ${d.sortantes} sortante${d.sortantes > 1 ? 's' : ''}</p>`,
			`</div>`,
			d.famille === null
				? `<div class="detail__section"><span class="etiq">Famille sémantique</span><p class="detail__vide-ligne">Aucune : cette note ne partage ni étiquette, ni dossier, ni mot de titre avec une autre.</p></div>`
				: `<div class="detail__section"><span class="etiq">Famille sémantique</span><p class="prop"><span class="prop__cle">${echapper(d.famille)}</span>${echapper(d.origineDeFamille ?? '')}</p></div>`,
			d.affinites.length === 0
				? ''
				: [
						`<div class="detail__section"><span class="etiq">Affinités</span>`,
						`<button type="button" class="btn btn--discret" id="detail-affinites">${
							d.affinites.length === 1
								? 'Montrer la note proche sur la carte'
								: `Montrer les ${d.affinites.length} notes proches sur la carte`
						}</button>`,
						`<div class="rel-groupe">${affinites}</div></div>`
					].join(''),
			`<div class="detail__section detail__actions">`,
			`<a class="btn btn--principal" href="${echapper(d.adresseDuVoisinage)}">Isoler le voisinage</a>`,
			`<a class="btn" href="${echapper(d.adresse)}">Ouvrir la note</a>`,
			`</div>`
		].join('');

		corpsDuDetail.appendChild(html);
		(detail as HTMLElement).hidden = false;
		racine.querySelector('.app')?.setAttribute('data-detail', 'ouvert');

		const fermer = racine.querySelector('#detail-fermer');
		if (fermer !== null) fermer.addEventListener('click', effacerLaSelection, { once: true });
		const montrer = racine.querySelector('#detail-affinites');
		if (montrer !== null) {
			montrer.addEventListener('click', () => {
				revelerLesAffinites(identifiant);
			});
		}
	}

	/** Le texte posé dans du balisage : jamais tel quel. */
	function echapper(texte: string): string {
		const boite = document.createElement('div');
		boite.textContent = texte;
		return boite.innerHTML.replaceAll('"', '&quot;');
	}

	/* ── 5. Les gestes du canevas ──────────────────────────────────────────── */

	attaches.ecouter(graphe, 'click', (evenement) => {
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
		naviguerAvec('taille', choisi);
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
	cocher('#c-contours', (v) => {
		etat.contours = v;
	});
	cocher('#c-noms', (v) => {
		etat.nomsDeFamille = v;
	});
	cocher('#c-isolees', (v) => {
		etat.masquerIsolees = v;
	});

	const ruptures = racine.querySelector<HTMLInputElement>('#c-ruptures');
	attaches.ecouter(ruptures, 'change', () => {
		graphe.setAttribute('data-ruptures', ruptures?.checked === true ? 'oui' : 'non');
	});

	attaches.ecouter(racine.querySelector('#reinitialiser'), 'click', reinitialiser);

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
	function naviguerAvec(cle: string | null, valeur: string | null): void {
		const adresse = new URL(resolve('/cartographie'), document.location.origin);
		for (const [nom, v] of new URL(document.location.href).searchParams) {
			adresse.searchParams.append(nom, v);
		}
		if (cle !== null && valeur !== null) adresse.searchParams.set(cle, valeur);
		/* Le chemin vient de `resolve()` ; ce que la règle ne sait pas exprimer, c'est
		   la requête. Même désarmement qu'en `V-13`, `V-03`, `V-22` et `V-24`. */
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(adresse, { noScroll: true, keepFocus: true });
	}

	/** `Réinitialiser` : le périmètre reste, tout le reste retourne au repos. */
	function reinitialiser(): void {
		const perimetre = new URL(document.location.href).searchParams.get('perimetre');
		const adresse = new URL(resolve('/cartographie'), document.location.origin);
		if (perimetre !== null) adresse.searchParams.set('perimetre', perimetre);
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
			naviguerAvec('perimetre', perimetreCompose(selUnivers.value, ''));
		});
	}
	if (selDomaine !== null) {
		attaches.ecouter(selDomaine, 'change', () => {
			const universDuDomaine =
				options.domaines.find((d) => d.nom === selDomaine.value)?.univers ?? '';
			naviguerAvec(
				'perimetre',
				perimetreCompose(selUnivers?.value ?? universDuDomaine, selDomaine.value)
			);
		});
	}

	/* ── 8 bis. Le panneau d'affichage se replie ─────────────────────────────
	   Il est posé SUR le canevas : sur un petit écran, ou pour regarder un îlot
	   qu'il recouvre, on doit pouvoir le pousser de côté sans perdre ses réglages. */

	const panneau = racine.querySelector('#commandes');
	const bascule = racine.querySelector('#panneau-bascule');
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
			naviguerAvec('profondeur', niveau);
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
		/* SANS ESTOMPER. `selectionner()` met le reste du graphe à quatorze pour cent
		   pour isoler un voisinage au sein d'un grand dessin — mais ici l'écran ENTIER
		   est ce voisinage : l'estomper laverait tout ce qu'on est venu voir. Seul le
		   panneau s'ouvre, et le nœud choisi porte son anneau. */
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
function cablerLaPrehension(racine: ParentNode, attaches: Attaches, vue: CommandeDeVue): void {
	const svg = racine.querySelector<SVGSVGElement>('#graphe');
	if (svg === null) return;

	let tire = false;
	let departX = 0;
	let departY = 0;
	let origineX = 0;
	let origineY = 0;

	attaches.ecouter(svg, 'pointerdown', (evenement) => {
		const e = evenement as PointerEvent;
		/* Un clic sur un nœud choisit ; seul le fond se saisit. */
		if ((e.target as Element | null)?.closest('.noeud') !== null) return;
		tire = true;
		departX = e.clientX;
		departY = e.clientY;
		const place = vue.position();
		origineX = place.x;
		origineY = place.y;
		svg.classList.add('tire');
		svg.setPointerCapture(e.pointerId);
	});

	attaches.ecouter(svg, 'pointermove', (evenement) => {
		if (!tire) return;
		const e = evenement as PointerEvent;
		/* Le repère fait mille unités de large : un pixel d'écran n'en vaut un que
		   si le canevas mesure mille pixels. Sans ce rapport, la carte glisse plus
		   vite ou plus lentement que la main. */
		const cadre = svg.getBoundingClientRect();
		const rapport = cadre.width === 0 ? 1 : 1000 / cadre.width;
		vue.deplacer(
			origineX + (e.clientX - departX) * rapport,
			origineY + (e.clientY - departY) * rapport
		);
	});

	const relacher = (evenement: Event): void => {
		if (!tire) return;
		tire = false;
		svg.classList.remove('tire');
		const e = evenement as PointerEvent;
		if (e.pointerId !== undefined && svg.hasPointerCapture(e.pointerId)) {
			svg.releasePointerCapture(e.pointerId);
		}
	};
	attaches.ecouter(svg, 'pointerup', relacher);
	attaches.ecouter(svg, 'pointercancel', relacher);

	attaches.ecouter(svg, 'wheel', (evenement) => {
		const e = evenement as WheelEvent;
		e.preventDefault();
		const cadre = svg.getBoundingClientRect();
		if (cadre.width === 0 || cadre.height === 0) return;
		const x = ((e.clientX - cadre.left) / cadre.width) * 1000;
		const y = ((e.clientY - cadre.top) / cadre.height) * 620;
		vue.grossirVers(x, y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
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
			.filter(([, d]) => d.titre.toLocaleLowerCase('fr').includes(requete))
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
