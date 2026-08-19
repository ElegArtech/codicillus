<script lang="ts">
	/**
	 * V-08 — Recherche interne. Route `/recherche` (`docs/routes.md` §3.3).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS, ET IL FAUT LE DIRE EN PREMIER
	 *
	 * Il rend un ÉTAT DE MAQUETTE. Il ne cherche rien à la demande, n'ordonne
	 * aucun résultat, n'applique aucune facette au clic et ne mesure aucune
	 * durée. `P-09`, `RG-M02-01` et toute performance de recherche NE SONT PAS
	 * TENUES par ce lot — son contrat les range parmi les interdictions de
	 * conclure, et `CLAUDE.md` §4 rappelle qu'un vert de `verif:maquette` ne
	 * dit jamais qu'une exigence est satisfaite.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE FAIT QUI COMMANDE TOUTE CETTE VUE : `rendre()` DU GEL LÈVE, ET LA
	 * ZONE DE RÉSULTATS RESTE VIDE SUR LES SEPT ÉTATS.
	 *
	 * MESURÉ, chemin du banc — `ouvrirPage`, `stabiliser`, `reglerPlanche`,
	 * `retirerBlocsHorsProduit` —, quatre erreurs de page relevées :
	 *
	 *     etat-chargement: trier is not defined
	 *     etat-vide:       trier is not defined
	 *     etat-trop:       trier is not defined
	 *     degrade:         trier is not defined
	 *
	 * `V-08:1966` écrit `affiches = trier(filtres)` et `V-08:2025`
	 * `carte(n, q, k, …)` ; NI `trier` NI `carte` n'est défini dans la
	 * maquette — `grep -n 'function trier\|function carte'` ne rend rien sur
	 * les 2 377 lignes. `rendre()` lève donc une `ReferenceError` À CHAQUE
	 * APPEL, y compris celui du chargement (`V-08:2371`), et l'exception est
	 * levée APRÈS `fac.rendre(base)` mais AVANT le remplissage de `#resultats`,
	 * de `#compteur` et de la bascule de `data-trop`.
	 *
	 * CE QUE LA RÉFÉRENCE MONTRE DONC, ET QUE CE COMPOSANT REPRODUIT :
	 *
	 *   • `#facettes` — RENDU, sept facettes calculées sur
	 *     `chercher("restauration base")`, car `fac.rendre(base)` précède la
	 *     levée ;
	 *   • `#resultats` — VIDE sur les sept états ;
	 *   • `#compteur` — VIDE sur les sept états ;
	 *   • `#actifs` — vide, `#vider-facettes` et `#compte-filtres` masqués ;
	 *   • `data-trop` — « non » sur les sept états, y compris `etat-trop` ;
	 *   • `saisie.value` — « restauration base » sur les sept états : le
	 *     gestionnaire de la planche pose `saisie.value` APRÈS `fac.vider()`,
	 *     qui lève, et la ligne n'est jamais atteinte ;
	 *   • aucune focalisation — `saisie.focus()` (`V-08:2372`) suit `rendre()`
	 *     et n'est jamais atteint. `docs/releve-vues.md` §6 le confirme :
	 *     colonne « Focalisation à l'ouverture » = « — » pour V-08.
	 *
	 * `etat-trop` est, en conséquence, IDENTIQUE À `etat-nominal` — vérifié par
	 * diff des deux relevés de DOM, zéro ligne de différence.
	 *
	 * NE PAS « RÉPARER » CELA. C'est la jurisprudence `CLAUDE.md` §6 P-3, mot
	 * pour mot : un implémenteur qui rendrait les résultats, le compteur ou la
	 * bascule `data-trop` rendrait les vingt-huit couples rouges. La maquette
	 * fait la loi (ordre de préséance, `CLAUDE.md` §2), y compris quand elle a
	 * tort. Le constat est REMONTÉ au rapport de lot ; il n'est pas comblé ici.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SEPT ÉTATS, ET LES QUATRE SEULES DIFFÉRENCES DE RENDU — MESURÉES
	 *
	 * Diff des sept relevés de DOM stabilisé, blocs hors produit retirés :
	 *
	 *   droits-lecture     `data-droits="lecture"`
	 *   etat-chargement    `data-etat="chargement"`
	 *   etat-vide          `data-etat="vide"`
	 *   etat-trop          AUCUNE — identique à `etat-nominal`
	 *   degrade            `data-mode="motscles"`, `data-degrade="oui"`,
	 *                      `aria-pressed` déplacé de Hybride vers Mots-clés,
	 *                      et `disabled` sur le bouton Sens
	 *   etat-nominal       identique à `droits-ecriture` (`identiqueA` déclaré)
	 *
	 * La bascule en mots-clés du gestionnaire `c-degrade` (`V-08:2098`) passe,
	 * elle, par `.click()` : une exception levée dans un écouteur d'événement
	 * est absorbée par la répartition DOM, si bien que la suite du gestionnaire
	 * — `disabled` sur le bouton Sens — s'exécute. C'est pourquoi l'état
	 * `degrade` porte quatre différences là où `etat-trop` n'en porte aucune.
	 *
	 * `RG-M02-01` — la bascule est ANNONCÉE, pas silencieuse : `div.degrade`
	 * affiche « Recherche par sens momentanément indisponible ». Le cadrage dit
	 * « silencieusement » ; la maquette gagne (`PLAN §11`). Ce lot ne déclare
	 * pas la règle tenue pour autant : il rend un bandeau, pas une bascule.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1 et A-2
	 *
	 * `<main class="rech" id="contenu">` (ARB-015) ; lien d'évitement
	 * `#resultats` « Aller aux résultats » (ARB-019, relevé §5.1) ; fil
	 * `["Accueil", "Recherche"]` et chemin courant VIDE — `coquille({ fil:
	 * ["Accueil", "Recherche"], courant: [] })` (`V-08:2370`), donc aucun nœud
	 * du rail n'est mis en évidence. Cinq attributs de données passent par
	 * `donnees` (A-2) : `data-etat`, `data-mode`, `data-degrade`, `data-trop`,
	 * `data-facettes`.
	 *
	 * LE GABARIT N'EST PAS TOUCHÉ. `docs/dag-phase-1.md` K-10 autorise ce lot,
	 * et lui seul, à revenir sur `src/lib/coquille/` pour monter la palette
	 * V-09 sur le champ de la barre. La vérification préalable dit que ce n'est
	 * pas nécessaire, et le relevé l'avait déjà mesuré
	 * (`docs/releve-vues.md` §4.1) : `template#tpl-palette` + `dialog#palette`
	 * sont portés à l'identique par 30 maquettes, ne portent AUCUNE boîte de
	 * rendu, et leur retrait laisse l'instantané ARIA identique et la capture
	 * identique à l'octet. V-09, de son côté, n'a NI coquille NI `<main>` : sa
	 * palette est instanciée dans sa propre planche. La dérogation reste donc
	 * NON EMPRUNTÉE, et le gabarit non rouvert — sixième passage évité.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, ci-dessus) et `div.planche`, bloc hors produit
	 * (`docs/DESIGN.md` §2.G, retiré par le banc avant toute mesure).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN CHIFFRE N'EST SAISI (P-02). Les comptes des sept facettes sortent
	 * de `chercher()` appliqué à `corpusPourVue('V-08')`, par la fabrique
	 * partagée `$lib/public/recherche` — le port fidèle de `window.chercher()`,
	 * écrit à l'identique dans les six maquettes qui l'emploient. Aucune
	 * seconde implémentation n'est écrite : c'est la règle de P-01 appliquée à
	 * la recherche comme elle l'est à la fraîcheur.
	 *
	 * LA FRAÎCHEUR VIENT DE LA FABRIQUE UNIQUE (P-01, ADR-005) — la facette
	 * « Fraîcheur » lit `n.fraicheur`, jamais un seuil recalculé.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : le squelette rend
	 * l'ÉTAT, jamais la transition.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-08.css`, posé par `node verif/feuilles-de-vue.mjs V-08
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import { DOMAINES, INSTANCE, MOI, UNIVERS, type Note } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { chercher } from '$lib/public/recherche';

	interface Proprietes {
		/** Le vecteur complet de l'état — droits × état × sens. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-08')`, variante « lecture ». */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** Droits effectifs : `si-ecriture` disparaît en lecture seule. */
	const droits = $derived(reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture');

	/**
	 * `data-etat` — la valeur que le gestionnaire de planche pose AVANT de
	 * lever (`V-08:2091`) : « chargement », « vide », et « nominal » pour tout
	 * le reste, y compris la position « Trop de résultats ».
	 */
	const etat = $derived(
		reglage['etat'] === 'chargement'
			? 'chargement'
			: reglage['etat'] === 'vide'
				? 'vide'
				: 'nominal'
	);

	/**
	 * Le sens indisponible. Le gestionnaire `c-degrade` bascule en mots-clés
	 * par un `.click()` sur le bouton du mode : l'exception levée dans
	 * l'écouteur est absorbée par la répartition d'événement, donc `data-mode`
	 * ET `disabled` sont bien posés (`V-08:2102-2103`).
	 */
	const degrade = $derived(reglage['c-degrade'] === true);
	const mode = $derived(degrade ? 'motscles' : 'hybride');

	/* ═════════════════════════════════════════════════════════════════════
	   LA REQUÊTE — UNE SEULE VALEUR SUR LES SEPT ÉTATS.

	   Le balisage du gel écrit `value="restauration base"` (`V-08:1157`). Le
	   gestionnaire de planche voudrait la remplacer — « de » pour la position
	   « Trop de résultats », « restauration base » pour « Nominal » — mais il
	   pose ces valeurs APRÈS `fac.vider()`, qui appelle `rendre()`, qui lève.
	   La ligne n'est jamais atteinte : la valeur du balisage tient sur les
	   sept états. Vérifié au DOM stabilisé, sept relevés sur sept.
	   ═════════════════════════════════════════════════════════════════════ */
	const REQUETE = 'restauration base';

	/* ═════════════════════════════════════════════════════════════════════
	   LES FACETTES — le calque du moteur du gel, réduit à ce qu'un rendu
	   d'état demande.

	   `creerFacettes` (`V-08:1794`) est un moteur interactif ; ce qui en est
	   observable dans un état est un ÉTAT DE SÉLECTION et son rendu. Les
	   quatre règles qui décident du rendu sont reprises à la lettre :

	     1. la base est `window.chercher(q)` — la requête, pas le corpus
	        entier : `fac.rendre(base)` reçoit `base`, jamais `window.CORPUS` ;
	     2. le compte affiché en regard d'une valeur est le nombre de résultats
	        obtenus SI cette valeur était retenue, les autres facettes restant
	        appliquées — ici aucune n'est retenue, aucun état de
	        `verif/scenarios/V-08.json` n'en retenant ;
	     3. les valeurs sont triées par compte décroissant, puis par ordre
	        alphabétique français ;
	     4. `max: 8` — huit valeurs affichées par facette au plus. Seule
	        « Étiquette » en compte davantage ; elle est tronquée à huit.

	   `ouverts: { statut: false, etiquette: false, visibilite: false }`
	   (`V-08:1952`) : ces trois-là seules sont repliées à l'ouverture.
	   ═════════════════════════════════════════════════════════════════════ */

	interface DefinitionDeFacette {
		readonly id: string;
		readonly nom: string;
		readonly cle: (n: Note) => readonly string[];
		readonly prefixe?: string;
		/** Repliée à l'ouverture — `ouverts[id] === false` au gel. */
		readonly repliee?: boolean;
	}

	/** Les sept facettes, dans l'ordre de lecture du brief (`V-08:1938`). */
	const FACETTES: readonly DefinitionDeFacette[] = [
		{ id: 'univers', nom: 'Univers', cle: (n) => [n.univers] },
		{ id: 'domaine', nom: 'Domaine', cle: (n) => [n.domaine] },
		{ id: 'type', nom: 'Type de note', cle: (n) => [n.type] },
		{
			id: 'statut',
			nom: 'Statut',
			cle: (n) => [n.brouillon ? 'Brouillon' : 'Publiée'],
			repliee: true
		},
		{
			id: 'fraicheur',
			nom: 'Fraîcheur',
			cle: (n) => [{ frais: 'Frais', vieil: 'Vieillissant', obs: 'Obsolète probable' }[n.fraicheur]]
		},
		{ id: 'etiquette', nom: 'Étiquette', cle: (n) => n.etiquettes, prefixe: '#', repliee: true },
		{ id: 'visibilite', nom: 'Visibilité', cle: (n) => [n.visibilite], repliee: true }
	];

	/** Le nombre de valeurs affichées par facette — `max: 8` du gel. */
	const MAX_VALEURS = 8;

	/** La base des facettes : les résultats de la requête, jamais le corpus. */
	const base = $derived(chercher(corpus, REQUETE));

	interface ValeurDeFacette {
		readonly valeur: string;
		readonly compte: number;
	}

	interface FacetteRendue {
		readonly id: string;
		readonly nom: string;
		readonly prefixe: string;
		readonly ouverte: boolean;
		readonly valeurs: readonly ValeurDeFacette[];
	}

	function facetteRendue(f: DefinitionDeFacette): FacetteRendue {
		const comptes: Record<string, number> = {};
		for (const n of base) {
			for (const v of f.cle(n)) if (v) comptes[v] = (comptes[v] ?? 0) + 1;
		}
		const ordonnees = Object.keys(comptes).sort(
			(a, b) => (comptes[b] ?? 0) - (comptes[a] ?? 0) || a.localeCompare(b, 'fr')
		);
		return {
			id: f.id,
			nom: f.nom,
			prefixe: f.prefixe ?? '',
			ouverte: f.repliee !== true,
			valeurs: ordonnees
				.slice(0, MAX_VALEURS)
				.map((valeur) => ({ valeur, compte: comptes[valeur] ?? 0 }))
		};
	}

	/** Seules les facettes qui ont au moins une valeur sont rendues (`V-08:1841`). */
	const facettes = $derived(FACETTES.map(facetteRendue).filter((f) => f.valeurs.length > 0));
</script>

<Coquille
	forme="abregee"
	classeContenu="rech"
	cibleEvitement="resultats"
	libelleEvitement="Aller aux résultats"
	fil={['Accueil', 'Recherche']}
	courant={[]}
	{droits}
	donnees={{
		'data-etat': etat,
		'data-mode': mode,
		'data-degrade': degrade ? 'oui' : 'non',
		'data-trop': 'non',
		'data-facettes': 'ferme'
	}}
	univers={UNIVERS}
	domaines={DOMAINES}
	notes={corpus}
	compte={{
		nom: MOI.nom,
		initiales: MOI.initiales,
		role: MOI.role,
		domaine: MOI.domaine
	}}
	version={INSTANCE.version}
>
	{#snippet enfants()}
		<!-- ============================ FACETTES ============================ -->
		<aside class="facettes" aria-label="Filtres">
			<div class="panneau facettes__cadre">
				<div class="panneau__tete">
					<span class="etiq">Affiner</span>
					<button class="btn btn--discret" id="vider-facettes" style="padding:4px 8px" hidden
						>Tout effacer</button
					>
				</div>
				<div class="panneau__corps" id="facettes" style="padding-top:0">
					<!--
						Région serrée : le relevé d'ordre de tabulation du niveau 1 construit
						le nom accessible sur `textContent`, où un blanc inséré par le
						formateur se voit (CLAUDE.md §6, P-6). Le bloc est protégé du
						formateur ; ne jamais citer la forme exacte de la directive à
						l'intérieur d'un commentaire (P-9).
					-->
					<!-- prettier-ignore -->
					{#each facettes as f (f.id)}<section class="facette" data-ouvert={f.ouverte ? 'oui' : 'non'}><button class="facette__tete" type="button" aria-expanded={f.ouverte}><span class="etiq">{f.nom}</span><span><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3 1l4 4-4 4z"/></svg></span></button><div class="facette__corps">{#each f.valeurs as v (v.valeur)}<label class="val"><input type="checkbox"><span class="val__nom">{f.prefixe + v.valeur}</span><span class="val__n">{v.compte}</span></label>{/each}</div></section>{/each}
				</div>
			</div>
		</aside>

		<!-- ============================ RÉSULTATS ============================ -->
		<div>
			<div class="requete">
				<div class="requete__champ">
					<svg
						width="20"
						height="20"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
					>
					<input
						type="search"
						id="saisie"
						autocomplete="off"
						spellcheck="false"
						value={REQUETE}
						placeholder="Chercher dans toute la base de connaissance…"
						aria-label="Requête de recherche"
					/>
					<button class="requete__effacer" id="effacer" aria-label="Effacer la requête">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>

				<!--
					Les trois modes. `aria-pressed` suit `data-mode`, et le bouton « Sens »
					est désactivé quand la brique est tombée : c'est ce que le gestionnaire
					`c-degrade` pose, et il y parvient parce que l'exception de `rendre()`
					est absorbée par la répartition d'événement du `.click()` qu'il émet.
				-->
				<div class="modes" role="group" aria-label="Mode de recherche">
					<button data-mode="motscles" aria-pressed={mode === 'motscles'}>
						Mots-clés
						<span class="aide-mode" role="tooltip"
							>Correspondance textuelle, tolérante aux fautes de frappe. Cherche les mots tels
							qu'ils sont écrits.</span
						>
					</button>
					<button data-mode="sens" aria-pressed="false" disabled={degrade}>
						Sens
						<span class="aide-mode" role="tooltip"
							>Trouve les notes qui parlent du même sujet, même lorsqu'elles n'emploient aucun mot
							de la requête.</span
						>
					</button>
					<button data-mode="hybride" aria-pressed={mode === 'hybride'}>
						Hybride
						<span class="aide-mode" role="tooltip"
							>Fusionne les deux approches et classe les résultats sur les deux critères. Mode par
							défaut.</span
						>
					</button>
				</div>
			</div>

			<div class="degrade">
				<svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
				>
				Recherche par sens momentanément indisponible — les résultats sont établis en mots-clés.
			</div>

			<div class="reglages">
				<!--
					VIDE SUR LES SEPT ÉTATS. `compteur.innerHTML = ""` est la première
					instruction du bloc nominal de `rendre()`, mais elle suit la levée :
					le compteur n'est jamais rempli. Rien n'est écrit ici, et surtout
					aucune valeur illustrative (P-02).
				-->
				<span class="compteur" id="compteur"></span>
				<div style="display:flex;align-items:center;gap:var(--e-3)">
					<button class="btn bouton-facettes" id="ouvrir-facettes">
						Affiner <span class="compte-filtres" id="compte-filtres" hidden>0</span>
					</button>
					<div class="tri">
						<label class="etiq" for="tri">Trier par</label>
						<select id="tri">
							<option value="pertinence">Pertinence</option>
							<option value="modification">Date de modification</option>
							<option value="verification">Date de vérification</option>
							<option value="consultations">Consultations</option>
							<option value="alpha">Alphabétique</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Aucun filtre retenu sur aucun des sept états : la zone reste vide. -->
			<div class="actifs" id="actifs"></div>

			<div class="trop">
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M2 4h12M4.5 8h7M6.5 12h3" /></svg
				>
				<span
					>Beaucoup de résultats pour cette requête. Affinez avec les facettes ci-contre —
					<b>Domaine</b> et <b>Type de note</b> sont les plus discriminants.</span
				>
			</div>

			<!--
				VIDE SUR LES SEPT ÉTATS — voir l'en-tête. Y rendre des cartes, un état
				vide ou une esquisse rendrait les vingt-huit couples rouges.
			-->
			<div class="resultats si-nominal" id="resultats"></div>

			<div class="si-chargement" aria-hidden="true">
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
			</div>
		</div>
	{/snippet}
</Coquille>
