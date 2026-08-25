<script lang="ts">
	/**
	 * V-08 — Recherche interne. Route `/recherche` (`docs/routes.md` §3.3).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE FAIT QUI COMMANDE TOUTE CETTE VUE : `rendre()` DU GEL LÈVE, ET LA
	 * ZONE DE RÉSULTATS DE LA RÉFÉRENCE RESTE VIDE SUR LES SEPT ÉTATS.
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
	 * `ARB-030` a tranché ce que la référence ne montre pas : **la carte de
	 * résultat de V-08 est celle de V-02**, gelée et fonctionnelle
	 * (`mockups/V-02-recherche-publique.html:1145-1252`), branche connectée. La
	 * maquette de V-08 HABILLE une carte qu'elle ne construit pas : le bloc de
	 * feuille `V-08:837-903` est IDENTIQUE À L'OCTET à `V-02:475-541`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `recherchees` — LE POINT UNIQUE OÙ LES DEUX RÉGIMES SE SÉPARENT
	 *
	 * Sans cette propriété, la vue rend un ÉTAT DE MAQUETTE : elle cherche
	 * elle-même « restauration base » dans le jeu qu'on lui donne, et la zone de
	 * résultats reste vide comme la référence la montre. C'est ce que fait le
	 * rendu d'une planche, qui ne passe par aucune route, et c'est ce qui tient
	 * la conformité des vingt-huit couples — T-064 avait MESURÉ l'inverse :
	 * dérivation rendue sans condition, `pnpm verif:maquette V-08 --contre=app`
	 * donnait « conformes : 0 · écarts : 28 », ECHEC-STRUCTURE sur les sept états
	 * × quatre fenêtres.
	 *
	 * Avec elle, la vue rend le PRODUIT : les notes reçues sont le résultat de
	 * l'index pour la requête de l'adresse, dans l'ordre du moteur, et la zone de
	 * résultats, le compteur, les compteurs de facette, les pastilles et
	 * `data-trop` deviennent vrais. Le chargeur de `/recherche` la pose ; rien
	 * d'autre ne la pose.
	 *
	 * CE QUI RESTE AU DOSSIER DES REGELS. La référence de V-08 continue de ne
	 * rien montrer dans `#resultats` : un vert de conformité sur cette vue ne
	 * prouvera jamais rien sur ses résultats — `CLAUDE.md` §4, « ce qu'un vert ne
	 * dit jamais ». ARB-030 range lui-même ce point au dossier des regels.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ÉTAT DE LA RECHERCHE EST PORTÉ PAR L'ADRESSE — RG-M02-06
	 *
	 * Le gel garde ses filtres dans une clôture (`choisis` de `creerFacettes`) :
	 * rien n'en sort, et une recherche affinée n'est pas partageable. Ici,
	 * `retenues` vient de l'adresse et RIEN d'autre ne la porte : chaque bascule
	 * de valeur, chaque pastille retirée, chaque « Tout effacer » recompose
	 * l'adresse et y navigue. `docs/routes.md` §4.2 : « à l'intérieur d'une
	 * facette les valeurs sont en OU (paramètre répété), entre facettes en ET » ;
	 * « `/recherche` sans paramètre autre que `q` réinitialise tout ».
	 *
	 * AUCUN NŒUD N'EST AJOUTÉ NI DÉPLACÉ POUR CELA. Le gel fait de ses valeurs de
	 * facette des cases à cocher et de ses pastilles des boutons ; ils le
	 * restent, et ce sont leurs gestionnaires — non leur nature — qui changent.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SEPT ÉTATS DE PLANCHE, ET LES QUATRE SEULES DIFFÉRENCES DE RENDU
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
	 * `RG-M02-01` — la bascule est ANNONCÉE, pas silencieuse : `div.degrade`
	 * affiche « Recherche par sens momentanément indisponible ». Le cadrage dit
	 * « silencieusement » ; la maquette gagne (`PLAN §11`).
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
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle) et `div.planche`, bloc hors produit
	 * (`docs/DESIGN.md` §2.G).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN CHIFFRE N'EST SAISI (P-02). Les comptes des sept facettes sortent de
	 * l'arithmétique du gel appliquée au jeu reçu — jeu de semence en planche,
	 * résultat du moteur en produit. LA FRAÎCHEUR VIENT DE LA FABRIQUE UNIQUE
	 * (P-01, ADR-005) : la facette « Fraîcheur » lit `n.fraicheur`, jamais un
	 * seuil recalculé — et c'est aussi pourquoi elle se filtre ici et non dans
	 * l'index, qui ne porte aucun champ de fraîcheur.
	 *
	 * LE COMPTEUR GLOBAL — `RG-M02-08`, « compteur global reflétant le
	 * filtrage ». Le cahier l'illustre par « 4 résultats sur 37 » ; le gel écrit
	 * `N résultat(s)` puis « en D,DD s » et rien d'autre (`V-08:2011-2015`), et
	 * la maquette fait la loi sur la forme (ordre de préséance, `CLAUDE.md` §2).
	 * Ce qui devient vrai est le NOMBRE : il reflète la requête ET les facettes
	 * retenues. La DURÉE, elle, reste simulée PAR LE GEL — P-02 non tenue.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-08.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import type { Domaine, Note, Univers, UtilisateurCourant } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { vocabulaireRendu } from '$lib/vocabulaire';
	import { resolve } from '$app/paths';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/**
	 * LES DEUX DÉFAUTS DE L'ADRESSE, RECOPIÉS ICI PLUTÔT QU'IMPORTÉS.
	 *
	 * `$lib/recherche/moteur` les porte aussi — `ORDRE_PAR_DEFAUT` — mais ce
	 * module ouvre la base et le client du moteur : l'importer depuis une vue
	 * ferait entrer du code serveur dans le paquet du navigateur. Les deux
	 * valeurs viennent du gel, chacune deux fois plutôt qu'une : « pertinence »
	 * est le premier `<option>` d'un sélecteur sans `selected` (`V-08:1191`), et
	 * « hybride » est à la fois le `data-mode` de `div.app` (`V-08:1004`) et le
	 * seul bouton `aria-pressed="true"` du gel, dont l'infobulle écrit « Mode par
	 * défaut ».
	 */
	const ORDRE_PAR_DEFAUT = 'pertinence';
	const MODE_PAR_DEFAUT = 'hybride';

	/**
	 * LES QUATRE SOURCES QUI NE VENAIENT DE NULLE PART — ET QUI N'ARRIVENT
	 * TOUJOURS DE NULLE PART.
	 *
	 * `UNIVERS`, `DOMAINES`, `MOI` et `INSTANCE` en étaient le défaut : `/recherche`
	 * n'en passe aucune, donc l'écran servait le jeu de démonstration à tout
	 * compte connecté — « Karim Belhadj » dans le menu utilisateur, « Codicillus
	 * 1.0.0 » au pied du rail. Le canal réel est le contexte de coquille, posé
	 * par le gabarit racine, et c'est lui qui l'emporte en application.
	 *
	 * Le DÉFAUT est donc désormais L'ÉTAT VIDE : aucun univers, aucun domaine,
	 * une identité sans nom. `instance` a disparu — la version affichée au pied
	 * du rail vient du contexte, ou de rien.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — droits × état × sens. */
		vecteur: Record<string, string | boolean> | null;
		/** Les notes à rendre — jeu de semence, ou résultat du moteur. */
		notes: readonly Note[];
		/**
		 * Les notes reçues SONT-ELLES déjà le résultat du moteur ? Absent : non,
		 * et la vue cherche elle-même « restauration base », comme la planche.
		 * Voir l'en-tête : c'est le point unique où les deux régimes se séparent.
		 */
		recherchees?: boolean;
		/** La requête demandée. Absente, celle que le gel écrit au balisage. */
		requete?: string;
		/**
		 * Les valeurs de facette retenues par l'adresse, par identifiant de
		 * facette. Absent : aucune — l'état des sept positions de la planche.
		 */
		retenues?: Record<string, readonly string[]>;
		/**
		 * Le nombre de notes lisibles, toutes requêtes confondues — le
		 * dénominateur de la règle d'affluence du gel. Absent : la taille du jeu
		 * reçu, qui est le corpus de la planche.
		 */
		perimetre?: number;
		/** Les univers déclarés. Absents, aucun — le contexte de coquille répond. */
		univers?: readonly Univers[];
		/** Les domaines accessibles. Absents, aucun — le contexte répond. */
		domaines?: readonly Domaine[];
		/** L'utilisateur connecté. Absent, une identité sans nom. */
		compte?: IdentiteAffichee;
		/**
		 * L'ORDRE DEMANDÉ PAR L'ADRESSE — `?tri=`, `docs/routes.md:243`.
		 *
		 * Absent : « pertinence », qui est ce que le sélecteur du gel retient faute
		 * de `selected` — donc l'état des sept positions de planche.
		 *
		 * LA VUE NE TRIE PAS, ET C'EST VOULU : les notes arrivent déjà dans l'ordre
		 * demandé, parce que c'est le MOTEUR qui l'applique (voir `trier()` plus
		 * bas). Cette propriété ne sert qu'à dire au sélecteur ce qu'il montre et à
		 * composer les adresses.
		 */
		tri?: string;
		/**
		 * LE MODE DEMANDÉ PAR L'ADRESSE — `?mode=`, `docs/routes.md:242`.
		 *
		 * Absent : « hybride », le défaut du gel (`V-08:1004`, `data-mode`). Le mode
		 * EFFECTIF n'est pas celui-ci : quand le sens est indisponible, l'écran
		 * bascule en mots-clés et le dit. Voir `mode` dans le corps du script.
		 */
		modeDemande?: string;
	}

	/**
	 * L'IDENTITÉ AFFICHÉE — la forme d'`UtilisateurCourant`, dont les valeurs
	 * figées du jeu de démonstration sont ÉLARGIES.
	 *
	 * `UtilisateurCourant.nom` est typé `NomDAuteur`, l'union des trois noms du
	 * jeu — « Sophie Nguyen », « Marc Ferreira », « Karim Belhadj » — et `role`
	 * comme `domaine` sont de même farine. Aucune instance réelle ne porte ces
	 * valeurs, et aucun état vide n'y est représentable. Le JEU DE CLÉS reste lié
	 * au type d'origine par un type mappé : un champ ajouté là-bas apparaît ici,
	 * et cette forme ne peut pas diverger en silence.
	 */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	/**
	 * L'IDENTITÉ VIDE — ce que la barre supérieure affiche sans compte servi.
	 * Elle remplace `MOI` du jeu de démonstration, qui faisait passer « Karim
	 * Belhadj » pour l'utilisateur connecté sur toute instance.
	 */
	const SANS_IDENTITE: IdentiteAffichee = {
		prenom: '',
		nom: '',
		initiales: '',
		domaine: '',
		role: ''
	};

	const {
		vecteur,
		notes: corpus,
		recherchees = false,
		requete,
		retenues,
		perimetre,
		univers = [],
		domaines = [],
		compte: moi = SANS_IDENTITE,
		tri = ORDRE_PAR_DEFAUT,
		modeDemande = MODE_PAR_DEFAUT
	}: Proprietes = $props();

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
	/**
	 * LE MODE EFFECTIF — celui que l'écran SERT, jamais seulement celui qu'on a
	 * demandé.
	 *
	 * Dégradé, il vaut « mots-clés » quoi qu'on demande, et le bandeau du gel
	 * l'écrit juste au-dessous : « Recherche par sens momentanément indisponible
	 * — les résultats sont établis en mots-clés ». C'est la règle du gel, pas une
	 * invention : son gestionnaire clique « Mots-clés » et désactive « Sens » dès
	 * que la brique tombe (`V-08:2098-2106`). `RG-M02-01` veut la bascule
	 * ANNONCÉE ; `P-10` veut la dégradation sans panne ; `P-02` interdit qu'un
	 * mode « Sens » rende en réalité des mots-clés sans le dire.
	 *
	 * NON DÉGRADÉ, C'EST LE MODE DEMANDÉ, et « hybride » à défaut. Aucun lot n'a
	 * encore de vecteurs : `SENS_DISPONIBLE` est faux, `c-degrade` est donc vrai
	 * sur toute page servie, et CETTE BRANCHE N'EST EXERCÉE PAR AUCUN CAS
	 * aujourd'hui (`P-5` : elle n'est pas éprouvée, elle est espérée).
	 *
	 * CE QUI EST PORTÉ DE BOUT EN BOUT, ET CE QUI NE L'EST PAS : la DEMANDE va de
	 * l'adresse au chargeur, du chargeur à cette vue, et de cette vue aux adresses
	 * qu'elle compose. Elle ne va PAS jusqu'au moteur : `chercherLesNotes()` n'a
	 * pas de paramètre de mode, parce qu'il n'y a rien à lui demander tant qu'il
	 * n'a pas d'embedder. C'est le lot qui déclarera cet embedder qui l'y mènera.
	 */
	const mode = $derived(degrade ? 'motscles' : modeDemande);

	/* ═════════════════════════════════════════════════════════════════════
	   LA REQUÊTE — UNE SEULE VALEUR SUR LES SEPT ÉTATS DE PLANCHE.

	   Le balisage du gel écrit `value="restauration base"` (`V-08:1157`). Le
	   gestionnaire de planche voudrait la remplacer — « de » pour la position
	   « Trop de résultats », « restauration base » pour « Nominal » — mais il
	   pose ces valeurs APRÈS `fac.vider()`, qui appelle `rendre()`, qui lève.
	   La ligne n'est jamais atteinte : la valeur du balisage tient sur les
	   sept états. Vérifié au DOM stabilisé, sept relevés sur sept.

	   EN PRODUIT, `q` VIENT DE L'ADRESSE — `RG-M02-06`. La lacune n° 3 du
	   chemin public — « `?q=` est lu, mesuré et IGNORÉ en session » — est
	   refermée : V-08 a désormais l'axe qui lui manquait.
	   ═════════════════════════════════════════════════════════════════════ */
	const REQUETE = 'restauration base';
	const q = $derived(requete ?? REQUETE);

	/* ═════════════════════════════════════════════════════════════════════
	   LES FACETTES — le port de `creerFacettes` (`V-08:1794-1933`).

	   Les quatre règles qui décident du rendu sont reprises à la lettre :

	     1. la base est le résultat de la requête, jamais le corpus entier :
	        `fac.rendre(base)` reçoit `base`, jamais `window.CORPUS` ;
	     2. le compte affiché en regard d'une valeur est le nombre de résultats
	        obtenus SI cette valeur était retenue, les autres facettes restant
	        appliquées — d'où `passe(n, f.id)` ;
	     3. les valeurs sont triées par compte décroissant, puis par ordre
	        alphabétique français ; une valeur RETENUE qui ne mènerait à rien est
	        conservée en fin de liste et marquée `data-vide` — « sa disparition
	        ferait croire à un défaut d'affichage » ;
	     4. `max: 8` — huit valeurs affichées par facette au plus.

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

	/**
	 * L'EXTRACTEUR D'ÉTIQUETTES, NOMMÉ PARCE QU'IL SERT DEUX FOIS : la facette
	 * « Étiquette », et les pistes de reformulation de l'état sans résultat. Les
	 * deux comptent la même chose ; deux écritures divergeraient.
	 */
	const ETIQUETTES_DE = (n: Note): readonly string[] => n.etiquettes;

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
		{ id: 'etiquette', nom: 'Étiquette', cle: ETIQUETTES_DE, prefixe: '#', repliee: true },
		{ id: 'visibilite', nom: 'Visibilité', cle: (n) => [n.visibilite], repliee: true }
	];

	/** Le nombre de valeurs affichées par facette — `max: 8` du gel. */
	const MAX_VALEURS = 8;

	/** La base des facettes : les résultats de la requête, jamais le corpus. */
	const base = $derived(recherchees ? corpus : chercher(corpus, q));

	/** Les valeurs retenues, facette par facette — l'adresse en est la source. */
	const choisis = $derived<Record<string, readonly string[]>>(retenues ?? {});

	/** `nbFiltres()` du gel — le nombre total de valeurs retenues. */
	const nbFiltres = $derived(Object.values(choisis).reduce((s, v) => s + v.length, 0));

	/**
	 * Un résultat passe s'il satisfait chaque facette ayant au moins une valeur
	 * retenue ; à l'intérieur d'une facette, les valeurs sont en « ou »
	 * (`V-08:1813-1821`).
	 */
	function passe(n: Note, saufFacette?: string): boolean {
		return FACETTES.every((f) => {
			if (f.id === saufFacette) return true;
			const c = choisis[f.id];
			if (!c || !c.length) return true;
			const vals = f.cle(n);
			return c.some((v) => vals.indexOf(v) !== -1);
		});
	}

	/** Le dépliage d'une facette — état local, comme au gel (`V-08:1952`). */
	const ouverts = $state<Record<string, boolean>>({});
	function estOuverte(f: DefinitionDeFacette): boolean {
		return ouverts[f.id] ?? f.repliee !== true;
	}

	interface ValeurDeFacette {
		readonly valeur: string;
		readonly compte: number;
		readonly retenue: boolean;
	}

	interface FacetteRendue {
		readonly id: string;
		readonly nom: string;
		readonly prefixe: string;
		readonly ouverte: boolean;
		readonly valeurs: readonly ValeurDeFacette[];
	}

	/**
	 * LA DISTRIBUTION D'UNE CLÉ SUR UN JEU DE NOTES — la mécanique de facette,
	 * extraite pour être employée deux fois : par les facettes, et par les pistes
	 * de reformulation, qui comptent les mêmes étiquettes sur un autre jeu.
	 */
	function distribution(
		notes: readonly Note[],
		cle: (n: Note) => readonly string[]
	): Record<string, number> {
		const comptes: Record<string, number> = {};
		for (const n of notes) for (const v of cle(n)) if (v) comptes[v] = (comptes[v] ?? 0) + 1;
		return comptes;
	}

	/** Les valeurs d'une distribution, de la plus employée à la moins employée. */
	function parFrequence(comptes: Record<string, number>): string[] {
		return Object.keys(comptes).sort(
			(a, b) => (comptes[b] ?? 0) - (comptes[a] ?? 0) || a.localeCompare(b, 'fr')
		);
	}

	function facetteRendue(f: DefinitionDeFacette): FacetteRendue {
		const comptes = distribution(
			base.filter((x) => passe(x, f.id)),
			f.cle
		);
		const ordonnees = parFrequence(comptes);
		for (const v of choisis[f.id] ?? []) if (!ordonnees.includes(v)) ordonnees.push(v);
		return {
			id: f.id,
			nom: f.nom,
			prefixe: f.prefixe ?? '',
			ouverte: estOuverte(f),
			valeurs: ordonnees.slice(0, MAX_VALEURS).map((valeur) => ({
				valeur,
				compte: comptes[valeur] ?? 0,
				retenue: (choisis[f.id] ?? []).includes(valeur)
			}))
		};
	}

	/** Seules les facettes qui ont au moins une valeur sont rendues (`V-08:1841`). */
	const facettes = $derived(FACETTES.map(facetteRendue).filter((f) => f.valeurs.length > 0));

	/* ═════════════════════════════════════════════════════════════════════
	   LA ZONE DE RÉSULTATS — DÉRIVÉE DE V-02, ARB-030

	   `carte()` existe, gelée et fonctionnelle, à
	   `mockups/V-02-recherche-publique.html:1145-1252`. Elle porte DÉJÀ les deux
	   publics : chacune des quatre différences est un test sur `opts.publique` —
	   le pastillon Brouillon (`V-02:1163`), le marquage de registre
	   (`V-02:1195`), le rangement complet contre le seul domaine
	   (`V-02:1211-1219`), la mention de visibilité (`V-02:1236`). V-02 appelle
	   avec `{ publique: true }` (`V-02:1456`) ; V-08 appelle SANS l'option
	   (`V-08:2025-2028`). Le port ci-dessous est cette même fonction, branche
	   connectée.
	   ═════════════════════════════════════════════════════════════════════ */

	/**
	 * `trier()` — L'ORDRE EST CELUI DU MOTEUR, ET C'EST POURQUOI CETTE FONCTION
	 * EST L'IDENTITÉ.
	 *
	 * Le sélecteur du gel (`V-08:1190-1196`) offre cinq ordres — pertinence,
	 * modification, vérification, consultations, alphabétique — et n'en marque
	 * aucun `selected` : le navigateur retient donc le premier, « pertinence ».
	 *
	 * CE QUE LA RÉDACTION PRÉCÉDENTE DISAIT, ET CE QU'ELLE AVAIT DE FAUX. Elle
	 * levait sur les quatre autres ordres, au motif qu'ils « ne sont écrits nulle
	 * part ». C'était exact de V-08, dont `trier()` n'existe pas — et inexact du
	 * gel pris dans son ensemble : `mockups/V-12-liste-notes.html:2117-2124`
	 * définit ces quatre ordres, avec les MÊMES valeurs d'option et les mêmes
	 * libellés (`V-12:1151-1156`). La sémantique était gelée, dans une autre
	 * planche. Elle est citée et portée par `ORDRES_DE_TRI` de
	 * `$lib/recherche/moteur`, qui la traduit en clauses de tri du moteur.
	 *
	 * LE TRI A DONC LIEU AVANT CETTE VUE, et il doit y avoir lieu : trier ici ne
	 * classerait que ce que le plafond de résultats a déjà retenu. Les notes
	 * arrivent dans l'ordre demandé ; le filtrage par facettes qui suit préserve
	 * cet ordre, un filtre étant stable. `trier()` reste écrite pour dire d'où
	 * vient l'ordre — la supprimer effacerait la seule trace, dans la vue, du fait
	 * que `V-08:1966` appelle bien une fonction à cet endroit.
	 */
	function trier(notes: readonly Note[]): readonly Note[] {
		return notes;
	}

	/** Les résultats après facettes puis tri (`V-08:1959-1966`). */
	const affiches = $derived(trier(base.filter((n) => passe(n))));

	/**
	 * La durée affichée par le compteur. Formule du gel (`V-08:1961`) à durée
	 * écoulée nulle : `Math.max(0.09, 0 + 0.31)` = 0,31 s. La vue ne mesure rien,
	 * elle rend un instant — la valeur est SIMULÉE par le gel, ce que P-02
	 * proscrit ; la contradiction appartient au gel, et P-02 n'est pas déclarée
	 * tenue.
	 */
	const duree = Math.max(0.09, 0 / 1000 + 0.31)
		.toFixed(2)
		.replace('.', ',');

	/**
	 * `data-trop` — la règle du gel (`V-08:2021-2022`), portée telle quelle : la
	 * part du corpus atteinte, jamais un nombre absolu, et jamais quand un filtre
	 * est retenu — « les facettes deviennent l'appel à l'action », et elles ont
	 * déjà été employées.
	 */
	const lisibles = $derived(perimetre ?? corpus.length);
	const affluence = $derived(affiches.length >= 8 && affiches.length / lisibles > 0.8);

	/**
	 * LES PISTES DE REFORMULATION — DES ÉTIQUETTES RÉELLES, OU RIEN.
	 *
	 * Le gel en énumère quatre en dur (`V-08:1986`) : « restauration »,
	 * « sauvegarde », « barman », « plan de reprise ». Trois d'entre elles ne
	 * veulent rien dire hors du jeu de démonstration, et la quatrième — « barman »
	 * — est le nom d'un outil que l'instance n'a probablement jamais installé :
	 * chacune ouvrait `/recherche?q=…` à zéro résultat. Quatre boutons qui
	 * promettent une reformulation et n'en tiennent aucune sont pires qu'aucun
	 * bouton.
	 *
	 * LA SOURCE RÉELLE EST DÉJÀ DANS CE FICHIER : la facette « Étiquette » compte
	 * les étiquettes du jeu servi. Les pistes les comptent sur le CORPUS reçu — et
	 * non sur `base`, qui est vide précisément dans l'état où les pistes se
	 * rendent — et gardent les plus employées, au même plafond que la facette.
	 *
	 * Un corpus sans étiquette rend une liste vide, et le bloc n'est pas rendu.
	 */
	const pistes = $derived(parFrequence(distribution(corpus, ETIQUETTES_DE)).slice(0, MAX_VALEURS));

	/** La condition exacte du gel (`V-08:1969`) : l'état « vide » de la planche,
	 *  ou aucun résultat pour une requête non vide. */
	const sansResultat = $derived(etat === 'vide' || (affiches.length === 0 && q.length > 0));

	/**
	 * LA REQUÊTE QUE L'ÉTAT VIDE CITE — et le repli du gel s'arrête au seuil du
	 * produit.
	 *
	 * Le gel écrit `q || "procédure de bascule VoIP"` (`V-08:1977`, `V-08:2000`) :
	 * une requête FABRIQUÉE, pour qu'une planche à champ vide reste lisible. En
	 * planche, elle est portée telle quelle — la maquette fait la loi de ce
	 * qu'elle montre.
	 *
	 * EN PRODUIT, ELLE SERAIT UN MENSONGE. « Aucun résultat pour “procédure de
	 * bascule VoIP” » sur une recherche que personne n'a formulée est exactement
	 * la « valeur illustrative » que `P-02` proscrit — et le cas est atteignable :
	 * requête vide et périmètre fermé (`RG-DRO-02`). La requête affichée est donc
	 * celle qui a été demandée, et rien d'autre.
	 */
	const requeteAffichee = $derived(recherchees ? q : q || 'procédure de bascule VoIP');

	/**
	 * LA ZONE DE RÉSULTATS EST-ELLE RENDUE ?
	 *
	 * Non quand la vue rend un ÉTAT DE MAQUETTE : la référence gelée n'y montre
	 * rien, `rendre()` ayant levé avant de la remplir, et la maquette fait la loi
	 * « y compris quand elle a tort » (ordre de préséance, `CLAUDE.md` §2).
	 * Oui dès que le moteur a cherché — c'est le produit, et il doit ses
	 * résultats à l'utilisateur.
	 *
	 * CE N'EST PAS UN RÉGLAGE, PAS UNE OPTION, PAS UNE PRÉFÉRENCE : c'est le
	 * partage entre la planche et le produit, à l'endroit où il se lit. Le jour
	 * où `trier()` et `carte()` entrent au gel de V-08, cette expression
	 * disparaît et tout ce qui précède devient le rendu, sans qu'une seule ligne
	 * de balisage soit à réécrire.
	 */
	const rendreLesResultats = $derived(recherchees);

	/* ═════════════════════════════════════════════════════════════════════
	   L'ADRESSE PORTE L'ÉTAT — RG-M02-06, RG-M02-07

	   Une seule fabrique d'adresse, et toutes les commandes de la page y
	   passent : c'est ce qui garantit qu'une adresse partagée rend exactement le
	   même écran que celui d'où elle vient. `docs/routes.md` §4.2.
	   ═════════════════════════════════════════════════════════════════════ */

	/**
	 * L'adresse est composée COUPLE PAR COUPLE, et non par `URLSearchParams` :
	 * une instance mutable de cette classe est refusée dans un composant Svelte
	 * (`svelte/prefer-svelte-reactivity`), et la réactivité n'a rien à faire ici
	 * — cette fabrique est pure. `q` vient en premier, puis les facettes dans
	 * l'ordre de lecture : deux états identiques rendent la même adresse, donc
	 * comparable.
	 */
	function adresse(
		prochaines: Record<string, readonly string[]>,
		requeteVoulue: string,
		ordre: string = tri,
		modeVoulu: string = modeDemande
	): string {
		const couples: string[] = [];
		if (requeteVoulue) couples.push(`q=${encodeURIComponent(requeteVoulue)}`);
		/* LES DEUX RÉGLAGES SUIVENT LA REQUÊTE, ET ILS NE S'ÉCRIVENT QUE S'ILS
		   DÉVIENT DU DÉFAUT : une adresse qui porterait `tri=pertinence&mode=hybride`
		   partout dirait la même chose que `/recherche` en trois fois plus long, et
		   deux écrans identiques rendraient deux adresses différentes — ce que la
		   fabrique unique est justement là pour empêcher. */
		if (ordre !== ORDRE_PAR_DEFAUT) couples.push(`tri=${encodeURIComponent(ordre)}`);
		if (modeVoulu !== MODE_PAR_DEFAUT) couples.push(`mode=${encodeURIComponent(modeVoulu)}`);
		for (const f of FACETTES) {
			for (const v of prochaines[f.id] ?? []) couples.push(`${f.id}=${encodeURIComponent(v)}`);
		}
		return couples.length ? `/recherche?${couples.join('&')}` : '/recherche';
	}

	/**
	 * LA NAVIGATION N'A LIEU QUE BRANCHÉE. Sans `recherchees`, la vue rend un
	 * état de maquette hors de toute route : y naviguer emmènerait la page de
	 * démonstration ailleurs. Le gel, dans cette situation, ne navigue pas non
	 * plus — il rejoue son rendu en mémoire.
	 */
	function aller(cible: string): void {
		if (recherchees) window.location.assign(cible);
	}

	function basculer(idFacette: string, valeur: string, actif: boolean): void {
		const prochaines: Record<string, readonly string[]> = { ...choisis };
		const courantes = prochaines[idFacette] ?? [];
		const suite = actif ? [...courantes, valeur] : courantes.filter((v) => v !== valeur);
		if (suite.length) prochaines[idFacette] = suite;
		else delete prochaines[idFacette];
		aller(adresse(prochaines, q));
	}

	/** « Tout effacer » — l'adresse ne garde que `q` (`docs/routes.md` §4.2). */
	function toutEffacer(): void {
		aller(adresse({}, q));
	}

	/** Une nouvelle requête conserve les filtres, comme le gel le fait à la frappe. */
	function chercherA(requeteVoulue: string): void {
		aller(adresse(choisis, requeteVoulue.trim()));
	}

	/** Une piste de reformulation repart à neuf — le gel remet la planche à
	 *  « nominal » et repose la saisie (`V-08:1990-1994`). */
	function essayer(piste: string): void {
		aller(adresse({}, piste));
	}

	/**
	 * CHANGER L'ORDRE — `triSel.addEventListener("change", rendre)` du gel
	 * (`V-08:2069`), à ceci près que l'état vit dans l'adresse et non dans une
	 * clôture : `RG-M02-06` veut l'état de la recherche partageable, et un tri
	 * gardé en mémoire ne se partage pas. LES FILTRES SONT CONSERVÉS, comme chez
	 * le gel, où changer l'ordre ne touche pas aux facettes.
	 */
	function changerLOrdre(ordre: string): void {
		aller(adresse(choisis, q, ordre));
	}

	/**
	 * CHANGER LE MODE — `V-08:2077-2083`, où le clic pose `data-mode` et rejoue le
	 * rendu. Ici encore, l'adresse porte l'état.
	 *
	 * LE BOUTON DU MODE SERVI NE NAVIGUE PAS : il rejouerait la même page. La
	 * comparaison porte donc sur le mode EFFECTIF et non sur celui qu'on a
	 * demandé — en dégradé l'écran sert « mots-clés » pendant que la demande vaut
	 * « hybride », et comparer à la demande faisait sortir le clic d'« Hybride »
	 * sans rien faire du tout.
	 */
	function changerLeMode(voulu: string): void {
		if (voulu === mode) return;
		aller(adresse(choisis, q, tri, voulu));
	}

	/**
	 * « AFFINER » — le seul geste de cette vue qui ne passe PAS par l'adresse, et
	 * c'est le gel qui le décide.
	 *
	 * `#ouvrir-facettes` n'a de boîte de rendu qu'en dessous du point de rupture
	 * (`V-08.css:406` le masque, `:560` le révèle) : c'est le tiroir de facettes
	 * du petit écran, et il ouvre `aside.facettes` par l'attribut `data-facettes`
	 * de `div.app` (`V-08.css:559`). Ce n'est pas un état de recherche — deux
	 * écrans dont l'un a le tiroir ouvert montrent les MÊMES résultats —, donc
	 * il n'a rien à faire dans une adresse partageable (`RG-M02-06`).
	 *
	 * AUCUNE RÈGLE N'EST ÉCRITE : on pose la valeur que la règle GELÉE attend.
	 */
	let facettesOuvertes = $state(false);

	/**
	 * « CRÉER LA NOTE « … » » — l'issue de l'état sans résultat, et la seule
	 * action d'écriture de cet écran.
	 *
	 * `docs/routes.md:287` déclare `titre` parmi les paramètres de pré-remplissage
	 * de `/notes/nouvelle`. Il est ÉMIS ici parce que c'est la requête restée sans
	 * réponse qui doit devenir le titre ; `/notes/nouvelle` ne le lit pas encore —
	 * son chargeur le déclare et le range en écart —, et l'écrire ici est ce qui
	 * rendra le pré-remplissage effectif le jour où il le lira, sans qu'une ligne
	 * bouge de ce côté.
	 */
	function creerLaNote(): void {
		aller(`/notes/nouvelle?titre=${encodeURIComponent(requeteAffichee)}`);
	}
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
	        Le segment de dossier est CONDITIONNEL : une note posée à la racine
	        d'un domaine a un chemin vide, et le séparateur resterait pendu.
	      · auteur · consultations         V-02:1223-1230
	      · pièces jointes                 V-02:1232-1235  si pj
	      · span.carte__visibilite         V-02:1236-1242  connecté seul

	LA SEULE DIVERGENCE AVEC LA CARTE DE V-02, ET ELLE EST IMPOSÉE PAR
	L'INSTRUMENT. Le gel pose `u.style.marginBottom = "var(--e-2)"` sur
	`div.marque-signet` (`V-02:1170`). Cette déclaration est ABSENTE de l'ensemble
	clos de V-08 — douze valeurs relevées, et pas celle-là —, parce que V-08 ne
	contient pas `carte()`. La porter ici ferait rougir le crible des styles en
	ligne (P-6.4, ARB-016). Le seul rattachement qui l'autoriserait est en
	écriture humaine seule : ce lot ne l'écrit pas, il le REMONTE.

	AUCUN BLANC ENTRE LES NŒUDS, et il doit le rester : le relevé d'ordre de
	tabulation du niveau 1 construit le nom accessible sur `textContent`, où un
	blanc réintroduit par le formateur se voit (CLAUDE.md §6, P-6). L'espace de
	`{n.univers + ' › '}` est PORTÉ DANS L'EXPRESSION, jamais laissé en bord
	d'élément, que Svelte élaguerait (P-8).
-->
<!-- prettier-ignore -->
{#snippet carte(n: Note, q: string, index: number)}<a class="carte" href={resolve('/notes/[identifiant]', { identifiant: n.id })} data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2>{#if n.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}<span class="past past--type">{n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type}</span
		></div
		>{#if n.type === 'Signet'}<div class="marque-signet">↗ {n.url}</div>{/if}<p class="carte__extrait">{@render marque(n.extrait, q)}</p
		><div class="carte__signal"
			>{@render temoin(n)}<span class="carte__revision" data-jamais={n.revise ? undefined : 'oui'}>{n.revise ? `Révisé le ${n.revise}` : 'Jamais révisé'}</span
			>{#if n.operationnel}<span class="marque-op">↳ Trouvé dans le registre Opérationnel</span>{/if}</div
		><div class="carte__pied"
			><span class="carte__chemin"><span>{n.univers + ' › '}</span><b>{n.domaine}</b>{#if n.dossier}<span>{' › ' + n.dossier}</span>{/if}</span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues) + ' consultations'}</span
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
		'data-trop': rendreLesResultats && affluence && nbFiltres === 0 ? 'oui' : 'non',
		'data-facettes': facettesOuvertes ? 'ouvert' : 'ferme'
	}}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: moi.nom,
		initiales: moi.initiales,
		role: moi.role,
		domaine: moi.domaine
	}}
	version=""
>
	{#snippet enfants()}
		<!-- ============================ FACETTES ============================ -->
		<aside class="facettes" aria-label="Filtres">
			<div class="panneau facettes__cadre">
				<div class="panneau__tete">
					<span class="etiq">Affiner</span>
					<button
						class="btn btn--discret"
						id="vider-facettes"
						style="padding:4px 8px"
						hidden={!nbFiltres}
						onclick={toutEffacer}>Tout effacer</button
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
					{#each facettes as f (f.id)}<section class="facette" data-ouvert={f.ouverte ? 'oui' : 'non'}><button class="facette__tete" type="button" aria-expanded={f.ouverte} onclick={() => (ouverts[f.id] = !f.ouverte)}><span class="etiq">{f.nom}</span><span><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3 1l4 4-4 4z"/></svg></span></button><div class="facette__corps">{#each f.valeurs as v (v.valeur)}<label class="val" data-vide={v.compte ? undefined : 'oui'}><input type="checkbox" checked={v.retenue} onchange={(e) => basculer(f.id, v.valeur, e.currentTarget.checked)}><span class="val__nom">{f.prefixe + v.valeur}</span><span class="val__n">{v.compte}</span></label>{/each}</div></section>{/each}
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
						value={q}
						placeholder="Chercher dans toute la base de connaissance…"
						aria-label="Requête de recherche"
						onkeydown={(e) => {
							if (e.key === 'Enter') chercherA(e.currentTarget.value);
							else if (e.key === 'Escape' && e.currentTarget.value) chercherA('');
						}}
					/>
					<button
						class="requete__effacer"
						id="effacer"
						aria-label="Effacer la requête"
						onclick={() => chercherA('')}
					>
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
					Les trois modes. `aria-pressed` suit le mode EFFECTIF. « Sens » ET
					« Hybride » sont désactivés quand la brique de sens est tombée : les
					deux ont besoin des vecteurs, et un bouton qui ne peut rien servir ne
					doit pas se donner pour actif. Le gel ne désactive que « Sens » — sa
					planche n'a aucun moteur derrière.
				-->
				<div class="modes" role="group" aria-label="Mode de recherche">
					<button
						data-mode="motscles"
						aria-pressed={mode === 'motscles'}
						onclick={() => changerLeMode('motscles')}
					>
						Mots-clés
						<span class="aide-mode" role="tooltip"
							>Correspondance textuelle, tolérante aux fautes de frappe. Cherche les mots tels
							qu'ils sont écrits.</span
						>
					</button>
					<button
						data-mode="sens"
						aria-pressed={mode === 'sens'}
						disabled={degrade}
						onclick={() => changerLeMode('sens')}
					>
						Sens
						<span class="aide-mode" role="tooltip"
							>Trouve les notes qui parlent du même sujet, même lorsqu'elles n'emploient aucun mot
							de la requête.</span
						>
					</button>
					<button
						data-mode="hybride"
						aria-pressed={mode === 'hybride'}
						disabled={degrade}
						onclick={() => changerLeMode('hybride')}
					>
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

					AUCUNE VALEUR ILLUSTRATIVE (P-02) : le compte est celui des résultats
					réellement affichés — requête ET facettes retenues, `RG-M02-08`. La
					DURÉE, elle, est simulée PAR LE GEL — réserve écrite en tête du script,
					P-02 non déclarée tenue.
				-->
				<!-- prettier-ignore -->
				<span class="compteur" id="compteur">{#if rendreLesResultats && !sansResultat}<b>{`${affiches.length} résultat${affiches.length > 1 ? 's' : ''}`}</b>{` en ${duree} s`}{/if}</span>
				<div style="display:flex;align-items:center;gap:var(--e-3)">
					<button
						class="btn bouton-facettes"
						id="ouvrir-facettes"
						aria-expanded={facettesOuvertes}
						onclick={() => (facettesOuvertes = !facettesOuvertes)}
					>
						Affiner <span class="compte-filtres" id="compte-filtres" hidden={!nbFiltres}
							>{nbFiltres}</span
						>
					</button>
					<!--
						LE SÉLECTEUR DE TRI — les cinq `<option>` du gel, dans son ordre, avec
						ses valeurs et ses libellés.

						`selected` N'EST POSÉ QUE HORS DÉFAUT, et ce n'est pas un détail de
						style : le gel n'écrit AUCUN `selected` (`V-08:1191-1195`), et le
						navigateur retient donc le premier. Poser l'attribut sur « Pertinence »
						ne changerait rien au rendu mais ferait diverger le balisage servi de
						celui de la référence sur les sept états de planche, pour rien.
					-->
					<div class="tri">
						<label class="etiq" for="tri">Trier par</label>
						<select id="tri" onchange={(e) => changerLOrdre(e.currentTarget.value)}>
							<option value="pertinence">Pertinence</option>
							<option value="modification" selected={tri === 'modification'}
								>Date de modification</option
							>
							<option value="verification" selected={tri === 'verification'}
								>Date de vérification</option
							>
							<option value="consultations" selected={tri === 'consultations'}>Consultations</option
							>
							<option value="alpha" selected={tri === 'alpha'}>Alphabétique</option>
						</select>
					</div>
				</div>
			</div>

			<!--
				LES PASTILLES DE FILTRE — RG-M02-07, port de `rendreActifs()`
				(`V-08:1892-1922`). Chaque pastille retire son couple
				`{facette}={valeur}` de l'adresse ; « Tout effacer » ne garde que `q`.
			-->
			<div class="actifs" id="actifs">
				{#if nbFiltres}{#each FACETTES as f (f.id)}{#each choisis[f.id] ?? [] as valeur (valeur)}<span
								class="filtre"
								><span><b>{f.nom + ' : '}</b>{(f.prefixe ?? '') + valeur}</span><button
									type="button"
									aria-label={`Retirer le filtre ${f.nom} ${valeur}`}
									onclick={() => basculer(f.id, valeur, false)}
									><svg
										width="12"
										height="12"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="2"><path d="M4 4l8 8M12 4l-8 8" /></svg
									></button
								></span
							>{/each}{/each}<button class="actifs__vider" type="button" onclick={toutEffacer}
						>Tout effacer</button
					>{/if}
			</div>

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
			<div class="resultats si-nominal" id="resultats">{#if !rendreLesResultats}{:else if sansResultat}<div class="vide"
					><h2 class="vide__titre">Aucun résultat pour <span class="vide__requete">{`« ${requeteAffichee} »`}</span></h2
					><p class="vide__txt">Cette connaissance n'est pas encore écrite. Si vous la détenez, c'est le bon moment : une note d'une dizaine de lignes vaut mieux que rien.</p
					>{#if pistes.length}<div class="vide__pistes">{#each pistes as piste (piste)}<button class="piste" onclick={() => essayer(piste)}>{`Essayer « ${piste} »`}</button>{/each}</div
					>{/if}{#if ecriture}<button class="btn btn--principal si-ecriture" onclick={creerLaNote}>{`Créer la note « ${requeteAffichee} »`}</button
				>{/if}</div>{:else}{#each affiches as n, index (n.id)}{@render carte(n, q, index)}{/each}{/if}</div>

			<div class="si-chargement" aria-hidden="true">
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
				<div class="esquisse esq-carte"></div>
			</div>
		</div>
	{/snippet}
</Coquille>
