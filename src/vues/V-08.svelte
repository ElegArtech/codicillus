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
	 * NE PAS « RÉPARER » CELA — ET LA MESURE, DEPUIS, LE CHIFFRE. C'est la
	 * jurisprudence `CLAUDE.md` §6 P-3, mot pour mot : un implémenteur qui
	 * rendrait les résultats, le compteur ou la bascule `data-trop` rendrait les
	 * vingt-huit couples rouges. T-064 l'a ÉPROUVÉ plutôt que déduit : la
	 * dérivation d'ARB-030 branchée, `pnpm verif:maquette V-08 --contre=app`
	 * rend « conformes : 0 · écarts : 28 », ECHEC-STRUCTURE sur les sept états
	 * × quatre fenêtres. La maquette fait la loi (ordre de préséance,
	 * `CLAUDE.md` §2), y compris quand elle a tort.
	 *
	 * CE QUI A CHANGÉ AVEC T-064, ET CE QUI N'A PAS CHANGÉ. La carte de résultat
	 * est désormais ÉCRITE ici, dérivée de V-02 comme ARB-030 le décide, avec le
	 * compteur, l'état vide et l'ordre de tri par défaut. Elle n'est pas RENDUE :
	 * `RENDRE_LEVE_AU_GEL`, en fin de script, est le point unique qui la retient,
	 * et il porte la mesure ci-dessus. Le rendu des sept états est donc
	 * strictement celui d'avant — le banc le vérifie, 28 couples conformes.
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
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { motFiche } from '$lib/vocabulaire';

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
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE l'action d'écriture puis la cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-08-recherche.html:338`) : faute de serveur, une maquette statique n'a
	 * pas d'autre moyen de dire « cette action n'existe pas pour ce rôle ». Le
	 * produit peut ne pas l'émettre, et P-09 l'exige — « ni grisée, NI MASQUÉE ».
	 * La classe reste posée sur le nœud rendu.
	 *
	 * AUCUN ÉTAT DÉCLARÉ N'EXERCE CETTE OMISSION, et c'est dit : le nœud vit dans
	 * l'état vide, qu'aucun vecteur du scénario ne croise avec `droits=lecture`.
	 * Le différentiel de la batterie 7 ne le voit donc pas (P-5). Il est traité
	 * comme les autres pour que la vue n'ait qu'une seule règle.
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');

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

	/* ═════════════════════════════════════════════════════════════════════
	   LA ZONE DE RÉSULTATS — DÉRIVÉE DE V-02, ARB-030

	   `V-08:1966` appelle `trier(filtres)` et `V-08:2025` `carte(n, q, k, …)` ;
	   NI L'UNE NI L'AUTRE N'EST DÉFINIE dans les 2 377 lignes de la maquette
	   (`grep -n 'function trier\|function carte\|trier =\|carte ='` : aucune
	   ligne). `rendre()` lève donc à chaque appel, et la référence gelée montre
	   `#resultats` et `#compteur` VIDES sur les sept états.

	   LA SOURCE EST V-02, ET L'ARBITRAGE LA NOMME. `carte()` existe, gelée et
	   fonctionnelle, à `mockups/V-02-recherche-publique.html:1145-1252`. Elle
	   porte DÉJÀ les deux publics : chacune des quatre différences est un test
	   sur `opts.publique` — le pastillon Brouillon (`V-02:1163`), le marquage de
	   registre (`V-02:1195`), le rangement complet contre le seul domaine
	   (`V-02:1211-1219`), la mention de visibilité (`V-02:1236`). V-02 appelle
	   avec `{ publique: true }` (`V-02:1456`) ; V-08 appelle SANS l'option
	   (`V-08:2025-2028`), donc `opts.publique` y est indéfini. Le port ci-dessous
	   est cette même fonction, branche connectée.

	   ET LA FEUILLE LE CONFIRME, MESURÉ ET NON DÉDUIT : le bloc de la carte de
	   `V-08:837-903` est IDENTIQUE À L'OCTET à celui de `V-02:475-541` —
	   `diff` sur les deux extraits de 67 lignes rend zéro ligne. Les six règles
	   de marqueurs (`V-02:525-540` contre `V-08:887-902`) le sont aussi. La
	   maquette de V-08 HABILLE une carte qu'elle ne construit pas.

	   CE QU'UN VERT NE DIRA PAS ICI, ET IL FAUT LE LIRE AVANT LE RAPPORT.
	   `verif:maquette` compare le rendu à une référence qui ne rend RIEN dans
	   cette zone. Un vert sur V-08 ne prouve donc rien sur ses résultats — c'est
	   le cas d'école de `CLAUDE.md` §4 « ce qu'un vert ne dit jamais », et
	   ARB-030 le range explicitement au dossier des regels.
	   ═════════════════════════════════════════════════════════════════════ */

	/**
	 * `trier()` — SEUL L'ORDRE PAR DÉFAUT EST DÉRIVABLE, et c'est tout ce qui est
	 * porté.
	 *
	 * Le sélecteur du gel (`V-08:1190-1196`) offre cinq ordres — pertinence,
	 * modification, vérification, consultations, alphabétique — et n'en marque
	 * aucun `selected` : le navigateur retient donc le premier, « pertinence »,
	 * sur les sept états déclarés. `chercher()` rend déjà l'ordre de pertinence
	 * du gel ; `trier()` y est l'identité, et c'est la seule branche qu'une
	 * source montre.
	 *
	 * LES QUATRE AUTRES ORDRES NE SONT ÉCRITS NULLE PART — ni en V-08, ni en
	 * V-02, qui n'a pas de sélecteur de tri. Les inventer serait le comblement
	 * que `CLAUDE.md` §2 interdit : ils sont REMONTÉS, pas comblés.
	 */
	const ORDRE_PAR_DEFAUT = 'pertinence';
	function trier(notes: readonly Note[], ordre: string): readonly Note[] {
		if (ordre === ORDRE_PAR_DEFAUT) return notes;
		throw new Error(
			`ordre de tri « ${ordre} » — aucune source ne le définit (ARB-030, écart remonté)`
		);
	}

	/** Les résultats après facettes puis tri. Aucun état déclaré ne retient de
	 *  facette : `filtres` et `base` coïncident, mais la distinction est celle du
	 *  gel (`V-08:1959-1966`) et les comptes de facette se calculent sur `base`. */
	const affiches = $derived(trier(base, ORDRE_PAR_DEFAUT));

	/**
	 * La durée affichée par le compteur. Formule du gel (`V-08:1961`) à durée
	 * écoulée nulle : `Math.max(0.09, 0 + 0.31)` = 0,31 s. Le squelette ne mesure
	 * rien, il rend un instant — même réserve qu'en V-02 : la valeur est SIMULÉE
	 * par le gel, ce que P-02 proscrit ; la contradiction appartient au gel, et
	 * P-02 n'est pas déclarée tenue.
	 */
	const duree = Math.max(0.09, 0 / 1000 + 0.31)
		.toFixed(2)
		.replace('.', ',');

	/**
	 * `data-trop` — la règle du gel (`V-08:2021-2022`), portée telle quelle : la
	 * part du corpus atteinte, jamais un nombre absolu. Aucune facette n'étant
	 * retenue, `fac.nbFiltres()` vaut zéro sur les sept états.
	 */
	const affluence = $derived(affiches.length >= 8 && affiches.length / corpus.length > 0.8);

	/** Les quatre pistes de l'état vide, telles que le gel les énumère
	 *  (`V-08:1986`). */
	const PISTES = ['restauration', 'sauvegarde', 'barman', 'plan de reprise'];

	/** La condition exacte du gel (`V-08:1969`) : l'état « vide » de la planche,
	 *  ou aucun résultat pour une requête non vide. */
	const sansResultat = $derived(etat === 'vide' || (affiches.length === 0 && REQUETE.length > 0));

	/* ═════════════════════════════════════════════════════════════════════
	   LE POINT UNIQUE OÙ LA DÉRIVATION EST TENUE HORS RENDU — ET LA MESURE
	   QUI L'IMPOSE.

	   ARB-030 décide de QUOI la carte de V-08 est faite ; elle ne peut pas
	   décider que la RÉFÉRENCE en montre une. Le gel de V-08 lève à `trier()`
	   (`V-08:1966`), donc `#resultats`, `#compteur` et la bascule `data-trop`
	   restent intacts, et c'est cela que le banc compare.

	   L'ARBITRAGE ANNONÇAIT UN VERT ; LA MESURE DIT L'INVERSE, et elle a été
	   faite plutôt que déduite. Avec la dérivation rendue :

	     pnpm verif:maquette V-08 --contre=app
	       28 couple(s) · conformes : 0 · écarts : 28 — ECHEC-STRUCTURE sur les
	       sept états × quatre fenêtres. Le niveau 1 suffit à trancher : la
	       référence n'a ni `text: 12 résultats en 0,31 s`, ni le moindre `a`
	       dans l'ordre de tabulation.

	   L'ORDRE DE PRÉSÉANCE TRANCHE — « Maquettes > Cahier des charges > … »
	   (`CLAUDE.md` §2). Un arbitrage nomme la SOURCE d'une dérivation ; il ne
	   renverse pas la préséance, et la maquette fait la loi « y compris quand
	   elle a tort ». La dérivation est donc ÉCRITE, ÉPROUVÉE, et retenue à ce
	   seul endroit, jusqu'au regel que la maquette appelle — ARB-030 la range
	   elle-même au dossier des regels, avec V-06 et V-20.

	   CE QUE CE DRAPEAU EST, ET CE QU'IL N'EST PAS. Ce n'est pas un réglage,
	   pas une option, pas une préférence : c'est un FAIT DE LA MAQUETTE, à
	   l'endroit où il se lit. Le jour où `trier()` et `carte()` entrent au gel
	   de V-08, la ligne passe à `false` et tout ce qui précède devient le
	   rendu — sans qu'une seule ligne de balisage soit à réécrire. C'est la
	   forme la plus courte que puisse prendre « le dépôt suffirait-il à
	   réexpliquer ce lot sans le rouvrir ? » sur ce point précis.

	   L'ÉCART EST REMONTÉ AU RAPPORT DE LOT, avec le chiffre ci-dessus et les
	   captures côte à côte. Il n'est pas comblé ici.
	   ═════════════════════════════════════════════════════════════════════ */
	const RENDRE_LEVE_AU_GEL: boolean = true;
</script>

<!--
	Le témoin de fraîcheur — fabrique unique (P-01, ADR-005), la même qu'en V-02
	et partout ailleurs. Le libellé accompagne toujours la jauge (RG-M18-09).
-->
<!-- prettier-ignore -->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!-- Un texte, avec les termes de la requête marqués — `surligner()` du gel. -->
<!-- prettier-ignore -->
{#snippet marque(texte: string, q: string)}{#each segmenter(texte, q) as s, rang (rang)}{#if s.marque}<mark>{s.texte}</mark>{:else}{s.texte}{/if}{/each}{/snippet}

<!--
	LA CARTE DE RÉSULTAT, VARIANTE CONNECTÉE — le port de `carte()` de V-02
	(`mockups/V-02-recherche-publique.html:1145-1252`) avec `opts.publique`
	indéfini, comme `V-08:2025-2028` l'appelle. Voir l'en-tête du script.

	Nœud par nœud, dans l'ordre du constructeur :

	  a.carte[href][data-index]            V-02:1151-1153  (sans `carte--publique`)
	    div.carte__haut                    V-02:1156-1157
	      h2.carte__titre                  V-02:1158-1160
	      span.past.past--brouillon        V-02:1163   si brouillon, connecté seul
	      span.past.past--type             V-02:1164
	    div.marque-signet                  V-02:1168-1173  si Signet
	    p.carte__extrait                   V-02:1176-1179
	    div.carte__signal                  V-02:1186-1201
	      témoin de fraîcheur              V-02:1189
	      span.carte__revision             V-02:1190-1197
	      span.marque-op                   V-02:1198-1201  connecté seul
	    div.carte__pied                    V-02:1205-1243
	      span.carte__chemin               V-02:1209-1220  univers › DOMAINE › dossier
	      · auteur · consultations         V-02:1223-1230
	      · pièces jointes                 V-02:1232-1235  si pj
	      · span.carte__visibilite         V-02:1236-1242  connecté seul

	LA SEULE DIVERGENCE AVEC LA CARTE DE V-02, ET ELLE EST IMPOSÉE PAR
	L'INSTRUMENT. Le gel pose `u.style.marginBottom = "var(--e-2)"` sur
	`div.marque-signet` (`V-02:1170`). Cette déclaration est ABSENTE de l'ensemble
	clos de V-08 — mesuré : `node verif/styles-en-ligne.mjs V-08` rend douze
	valeurs, et pas celle-là —, parce que V-08 ne contient pas `carte()`. La
	porter ici donne, contre-épreuve faite :

	    P-1.7 — 1 constat(s)
	      src/vues/V-08.svelte:412 — style en ligne « margin-bottom:var(--e-2) »
	      … ne figure pas parmi les 12 valeurs de style de
	      mockups/V-08-recherche.html (P-6.4, ARB-016)

	Le seul rattachement qui l'autoriserait vit à
	`verif/references/preuve-par-le-gel.json`, EN ÉCRITURE HUMAINE SEULE. Ce lot
	ne l'écrit pas : il le REMONTE. La carte est donc celle de V-02 à une
	déclaration près, et c'est cette déclaration-là.

	AUCUN BLANC ENTRE LES NŒUDS, et il doit le rester : le relevé d'ordre de
	tabulation du niveau 1 construit le nom accessible sur `textContent`, où un
	blanc réintroduit par le formateur se voit (CLAUDE.md §6, P-6). L'espace de
	`{n.univers + ' › '}` est PORTÉ DANS L'EXPRESSION, jamais laissé en bord
	d'élément, que Svelte élaguerait (P-8).
-->
<!-- prettier-ignore -->
{#snippet carte(n: Note, q: string, index: number)}<a class="carte" href="#" data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2>{#if n.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}<span class="past past--type">{n.type === 'Fiche' ? `${motFiche} ${n.typeFiche}` : n.type}</span
		></div
		>{#if n.type === 'Signet'}<div class="marque-signet">↗ {n.url}</div>{/if}<p class="carte__extrait">{@render marque(n.extrait, q)}</p
		><div class="carte__signal"
			>{@render temoin(n)}<span class="carte__revision" data-jamais={n.revise ? undefined : 'oui'}>{n.revise ? `Révisé le ${n.revise}` : 'Jamais révisé'}</span
			>{#if n.operationnel}<span class="marque-op">↳ Trouvé dans le registre Opérationnel</span>{/if}</div
		><div class="carte__pied"
			><span class="carte__chemin"><span>{n.univers + ' › '}</span><b>{n.domaine}</b><span>{' › ' + n.dossier}</span></span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues) + ' consultations'}</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj + (n.pj > 1 ? ' pièces jointes' : ' pièce jointe')}</span>{/if}{#if n.visibilite === 'Publique'}<span class="sep">·</span><span class="carte__visibilite">Publique</span>{/if}</div
		></a
	>{/snippet}

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
		'data-trop': !RENDRE_LEVE_AU_GEL && affluence ? 'oui' : 'non',
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
					LE COMPTEUR — `V-08:2011-2015`, dérivé comme la carte (ARB-030). Un
					`<b>` portant « N résultat(s) », puis le texte « en D,DD s ». Le gel de
					V-02 écrit exactement le même bloc (`V-02:1445-1449`), à la constante
					de durée près. Vide dans l'état sans résultat, où `rendre()` pose
					`compteur.innerHTML = ""` et sort (`V-08:1971`).

					AUCUNE VALEUR ILLUSTRATIVE (P-02) : le compte est celui de
					`chercher(corpusPourVue('V-08'), « restauration base »)`, pas un
					chiffre saisi. La DURÉE, elle, est simulée PAR LE GEL — réserve écrite
					en tête du script, P-02 non déclarée tenue.
				-->
				<!-- prettier-ignore -->
				<span class="compteur" id="compteur">{#if !RENDRE_LEVE_AU_GEL && !sansResultat}<b>{`${affiches.length} résultat${affiches.length > 1 ? 's' : ''}`}</b>{` en ${duree} s`}{/if}</span>
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
				LA ZONE DE RÉSULTATS — dérivée de V-02 par ARB-030, voir l'en-tête du
				script. Deux branches, celles de `rendre()` :

				  • sans résultat — le bloc `.vide` de `V-08:1972-2007`, entièrement
				    écrit par la maquette de V-08 elle-même : aucune dérivation n'y est
				    nécessaire, seulement une lecture ;
				  • avec résultats — une carte par note, `V-08:2024-2030`.
			-->
			<!-- prettier-ignore -->
			<div class="resultats si-nominal" id="resultats">{#if RENDRE_LEVE_AU_GEL}{:else if sansResultat}<div class="vide"
					><h2 class="vide__titre">Aucun résultat pour <span class="vide__requete">{`« ${REQUETE || 'procédure de bascule VoIP'} »`}</span></h2
					><p class="vide__txt">Cette connaissance n'est pas encore écrite. Si vous la détenez, c'est le bon moment : une note d'une dizaine de lignes vaut mieux que rien.</p
					><div class="vide__pistes">{#each PISTES as piste (piste)}<button class="piste">{`Essayer « ${piste} »`}</button>{/each}</div
					>{#if ecriture}<button class="btn btn--principal si-ecriture">{`Créer la note « ${REQUETE || 'procédure de bascule VoIP'} »`}</button
				>{/if}</div>{:else}{#each affiches as n, index (n.id)}{@render carte(n, REQUETE, index)}{/each}{/if}</div>

			<div class="si-chargement" aria-hidden="true">
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
			</div>
		</div>
	{/snippet}
</Coquille>
