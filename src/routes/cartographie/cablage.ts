/**
 * LE CÂBLAGE DE V-19 — la cartographie complète, et ses onze gestes. `ARB-063` : le
 * comportement s'accroche depuis la ROUTE, depuis `onMount` du `+page.svelte` voisin.
 *
 * IL N'ÉCRIT AUCUNE RÈGLE DE STYLE : tout passe par des attributs de données que
 * `V-19.css` lit déjà — `#graphe[data-focus|data-isole|data-criticite]`,
 * `.noeud[data-actif|data-choisi|data-type-visible]`, `.arete[data-actif]`,
 * `.rech-graphe[data-ouvert]`.
 *
 * LE PÉRIMÈTRE EST DANS L'ADRESSE — `RG-M09-05` : le mode d'affichage est porté par le
 * CHEMIN, le périmètre par `?perimetre=`, et le sélecteur navigue plutôt que de garder un
 * état. LA VALEUR DU SÉLECTEUR EST POSÉE ICI, ET NON AU BALISAGE. LE PANNEAU DE DÉTAIL
 * N'EST PAS REMPLI, ET C'EST DÉCLARÉ : la vue n'en transcrit que l'état VIDE, et
 * `data-detail` n'est PAS basculé — sur petit écran il ouvrirait une colonne vide.
 */
import {
	Attaches,
	cablerLaVue,
	placeDuNoeud,
	type CommandeDeVue,
	type Debranchement
} from '$lib/graphe/commandes';

/** Le nombre de suggestions de la recherche dans le graphe — `V-19:2942`. */
const MAX_SUGGESTIONS = 8;

function codeDeType(noeud: Element): string {
	return (noeud.querySelector('.noeud__code')?.textContent ?? '').trim();
}

function voisinsDe(racine: ParentNode, identifiant: string): Set<string> {
	const voisins = new Set<string>([identifiant]);
	for (const arete of Array.from(racine.querySelectorAll('.arete'))) {
		const de = arete.getAttribute('data-de');
		const vers = arete.getAttribute('data-vers');
		if (de === identifiant && vers !== null) voisins.add(vers);
		if (vers === identifiant && de !== null) voisins.add(de);
	}
	return voisins;
}

export interface OptionsDeLaCartographie {
	/** Ce que le sélecteur de périmètre montre au montage — `type|nom`. */
	readonly perimetreCourant: string;
	readonly adresseParType: string;
	/** Où mène « Comment déclarer une relation », ou `null` s'il n'y a pas de note. */
	readonly adresseDesRelations: string | null;
	/** Le périmètre que « Réduire le périmètre » propose, ou `null`. */
	readonly perimetreReduit: string | null;
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
	const effacer = racine.querySelector<HTMLButtonElement>('#effacer-sel');

	/* ── 1. La sélection d'un nœud — `V-19:2736-2761`. ─────────────────────── */

	const selectionner = (identifiant: string): void => {
		const voisins = voisinsDe(racine, identifiant);
		graphe.setAttribute('data-focus', 'oui');
		for (const noeud of Array.from(racine.querySelectorAll('.noeud'))) {
			const id = noeud.getAttribute('data-id') ?? '';
			noeud.setAttribute('data-actif', voisins.has(id) ? 'oui' : 'non');
			noeud.setAttribute('data-choisi', id === identifiant ? 'oui' : 'non');
		}
		for (const arete of Array.from(racine.querySelectorAll('.arete'))) {
			const touche =
				arete.getAttribute('data-de') === identifiant ||
				arete.getAttribute('data-vers') === identifiant;
			arete.setAttribute('data-actif', touche ? 'oui' : 'non');
		}
		if (effacer !== null) effacer.disabled = false;
	};

	const effacerLaSelection = (): void => {
		graphe.setAttribute('data-focus', 'non');
		for (const noeud of Array.from(racine.querySelectorAll('.noeud'))) {
			noeud.setAttribute('data-actif', 'non');
			noeud.setAttribute('data-choisi', 'non');
		}
		for (const arete of Array.from(racine.querySelectorAll('.arete'))) {
			arete.setAttribute('data-actif', 'non');
		}
		if (effacer !== null) effacer.disabled = true;
	};

	attaches.ecouter(graphe, 'click', (evenement) => {
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		if (noeud === null || noeud === undefined) {
			effacerLaSelection();
			return;
		}
		const identifiant = noeud.getAttribute('data-id');
		if (identifiant !== null) selectionner(identifiant);
	});

	/* Le gel rend chaque nœud focalisable et lui donne le rôle de bouton : la
	   touche l'active donc, comme un bouton. */
	attaches.ecouter(graphe, 'keydown', (evenement) => {
		const touche = (evenement as KeyboardEvent).key;
		if (touche !== 'Enter' && touche !== ' ') return;
		const noeud = (evenement.target as Element | null)?.closest('.noeud');
		const identifiant = noeud?.getAttribute('data-id');
		if (identifiant === null || identifiant === undefined) return;
		evenement.preventDefault();
		selectionner(identifiant);
	});

	attaches.ecouter(effacer, 'click', effacerLaSelection);

	/* ── 2. « Afficher la criticité » — `V-19:3117`. ───────────────────────── */

	const criticite = racine.querySelector<HTMLInputElement>('#c-criticite');
	attaches.ecouter(criticite, 'change', () => {
		graphe.setAttribute('data-criticite', criticite?.checked === true ? 'oui' : 'non');
	});

	/* ── 3. La légende isole un type — `V-19:2820-2828`. ───────────────────── */

	let isole: string | null = null;
	const legende = racine.querySelector('#legende-types');

	attaches.ecouter(legende, 'click', (evenement) => {
		const bouton = (evenement.target as Element | null)?.closest('.lg');
		if (bouton === null || bouton === undefined) return;
		const code = codeDeType(bouton);
		isole = isole === code ? null : code;
		graphe.setAttribute('data-isole', isole === null ? 'non' : 'oui');
		for (const autre of Array.from(racine.querySelectorAll('.lg'))) {
			autre.setAttribute(
				'data-isole',
				isole !== null && codeDeType(autre) === isole ? 'oui' : 'non'
			);
		}
		for (const noeud of Array.from(racine.querySelectorAll('.noeud'))) {
			noeud.setAttribute(
				'data-type-visible',
				isole === null || codeDeType(noeud) === isole ? 'oui' : 'non'
			);
		}
	});

	/* ── 4. Le périmètre — l'adresse le porte. ─────────────────────────────── */

	const perimetre = racine.querySelector<HTMLSelectElement>('#perimetre');
	if (perimetre !== null) {
		/* Poser la valeur ici plutôt qu'au balisage : voir l'en-tête. Une valeur
		   que le sélecteur ne propose pas le laisse à son premier `<option>`,
		   comme le navigateur le ferait — jamais une position inventée. */
		perimetre.value = options.perimetreCourant;
		attaches.ecouter(perimetre, 'change', () => {
			document.location.assign(`?perimetre=${encodeURIComponent(perimetre.value)}`);
		});
	}

	/* ── 5. Le bandeau « périmètre dense » — `V-19:3128-3136`. ─────────────── */

	attaches.ecouter(racine.querySelector('#dense-maitre'), 'click', () => {
		document.location.assign(options.adresseParType);
	});
	const reduire = racine.querySelector<HTMLButtonElement>('#dense-reduire');
	if (reduire !== null) {
		if (options.perimetreReduit === null) reduire.disabled = true;
		else {
			attaches.ecouter(reduire, 'click', () => {
				document.location.assign(`?perimetre=${encodeURIComponent(options.perimetreReduit ?? '')}`);
			});
		}
	}

	/* ── 6. « Comment déclarer une relation » — `V-19:3038`. ───────────────── */

	/* LE SÉLECTEUR NOMME LA BALISE, ET C'EST NÉCESSAIRE DEPUIS QUE LE VOILE PORTE
	   CINQ MESSAGES : les quatre autres offrent un LIEN de même classe — vers la
	   console, vers la création d'une note, vers le périmètre entier —, et
	   l'adresse est alors portée par le document. Le seul bouton du voile est
	   celui-ci.

	   AUCUN GRISAGE : le voile ne rend ce bouton que dans l'état où une note
	   existe, donc où l'adresse existe. Le bouton désactivé sans motif affiché
	   qu'on lisait sur une instance neuve n'a plus de chemin pour paraître. */
	const voile = racine.querySelector('#voile');
	const versLesRelations = voile?.querySelector<HTMLButtonElement>('button.btn--principal') ?? null;
	if (versLesRelations !== null && options.adresseDesRelations !== null) {
		attaches.ecouter(versLesRelations, 'click', () => {
			document.location.assign(options.adresseDesRelations ?? '');
		});
	}

	/* ── 7. « Aller à un nœud » — `V-19:2934-2985`. ────────────────────────── */

	cablerLaRechercheDeNoeud(racine, attaches, vue, selectionner);

	return attaches.debranchement();
}

/**
 * LA RECHERCHE DANS LE GRAPHE — transcrite de `rendreRecherche()` et
 * `sauterVers()`.
 *
 * C'EST LE SEUL ENDROIT DE CE MODULE QUI CRÉE DES NŒUDS, et le gel le fait au
 * même endroit, pour la même raison : `#rech-liste` est VIDE au balisage, et
 * c'est un `role="listbox"` qui n'a de sens qu'une fois peuplé. Les classes
 * employées sont celles du gel, et `V-19.css` les porte déjà.
 */
function cablerLaRechercheDeNoeud(
	racine: ParentNode,
	attaches: Attaches,
	vue: CommandeDeVue,
	selectionner: (identifiant: string) => void
): void {
	const champ = racine.querySelector<HTMLInputElement>('#rech');
	const boite = racine.querySelector('#rech-graphe');
	const liste = racine.querySelector('#rech-liste');
	if (champ === null || boite === null || liste === null) return;
	const document = champ.ownerDocument;

	let rang = 0;

	const sauterVers = (identifiant: string): void => {
		boite.setAttribute('data-ouvert', 'non');
		champ.value = '';
		liste.replaceChildren();
		const place = placeDuNoeud(racine, identifiant);
		if (place !== null) vue.centrerSur(place.x, place.y);
		selectionner(identifiant);
	};

	const rendre = (): void => {
		const q = champ.value.trim().toLowerCase();
		liste.replaceChildren();
		if (q === '') {
			boite.setAttribute('data-ouvert', 'non');
			return;
		}

		const trouves = Array.from(racine.querySelectorAll('.noeud'))
			.filter((n) => (n.getAttribute('aria-label') ?? '').toLowerCase().includes(q))
			.slice(0, MAX_SUGGESTIONS);

		if (trouves.length === 0) {
			const vide = document.createElement('div');
			vide.style.cssText = 'padding:var(--e-3);font-size:var(--t-petit);color:var(--c-encre-3)';
			vide.textContent = 'Aucun nœud de ce nom dans le périmètre affiché.';
			liste.appendChild(vide);
			boite.setAttribute('data-ouvert', 'oui');
			return;
		}

		trouves.forEach((noeud, k) => {
			const identifiant = noeud.getAttribute('data-id') ?? '';
			const bouton = document.createElement('button');
			bouton.className = 'rg';
			bouton.type = 'button';
			if (k === rang) bouton.setAttribute('data-sel', 'oui');
			const titre = document.createElement('span');
			titre.className = 'rg__t';
			titre.textContent = (noeud.querySelector('.noeud__nom')?.textContent ?? '').trim();
			const sous = document.createElement('span');
			sous.className = 'rg__s';
			sous.textContent = (noeud.querySelector('.noeud__code')?.textContent ?? '').trim();
			bouton.append(titre, document.createElement('br'), sous);
			bouton.addEventListener('mousedown', (evenement) => {
				evenement.preventDefault();
				sauterVers(identifiant);
			});
			liste.appendChild(bouton);
		});
		boite.setAttribute('data-ouvert', 'oui');
	};

	attaches.ecouter(champ, 'input', () => {
		rang = 0;
		rendre();
	});

	attaches.ecouter(champ, 'keydown', (evenement) => {
		const touche = (evenement as KeyboardEvent).key;
		const suggestions = Array.from(liste.querySelectorAll<HTMLButtonElement>('.rg'));
		if (touche === 'ArrowDown' && suggestions.length > 0) {
			evenement.preventDefault();
			rang = (rang + 1) % suggestions.length;
			rendre();
		} else if (touche === 'ArrowUp' && suggestions.length > 0) {
			evenement.preventDefault();
			rang = (rang - 1 + suggestions.length) % suggestions.length;
			rendre();
		} else if (touche === 'Enter') {
			evenement.preventDefault();
			suggestions[rang]?.dispatchEvent(new MouseEvent('mousedown'));
		} else if (touche === 'Escape') {
			boite.setAttribute('data-ouvert', 'non');
		}
	});

	attaches.ajouter(() => liste.replaceChildren());
}
