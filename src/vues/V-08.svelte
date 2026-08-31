<script lang="ts">
	/**
	 * V-08 — Recherche interne. Route `/recherche` (`docs/routes.md` §3.3).
	 *
	 * `rendre()` du gel LÈVE — ni `trier` ni `carte` n'y est défini — et la zone de
	 * résultats de la maquette reste donc vide. `ARB-030` a tranché ce qu'elle ne
	 * montre pas : la carte de résultat de V-08 est celle de V-02, gelée et
	 * fonctionnelle (`mockups/V-02-recherche-publique.html:1145-1252`).
	 *
	 * `recherchees` EST LE POINT UNIQUE OÙ LES DEUX RÉGIMES SE SÉPARENT. Sans elle,
	 * la vue cherche elle-même dans le jeu qu'on lui donne et ne rend aucun résultat,
	 * comme la maquette. Avec elle, les notes reçues sont le résultat de l'index, et
	 * la zone de résultats, le compteur, les comptes de facette et `data-trop`
	 * deviennent vrais. Le chargeur de `/recherche` la pose ; rien d'autre.
	 *
	 * L'ÉTAT DE LA RECHERCHE EST PORTÉ PAR L'ADRESSE — `RG-M02-06` : `retenues` vient
	 * de l'adresse et rien d'autre ne la porte. `docs/routes.md` §4.2 : dans une
	 * facette les valeurs sont en OU (paramètre répété), entre facettes en ET.
	 *
	 * `RG-M02-01` — la bascule en mots-clés est ANNONCÉE. La fraîcheur vient de la
	 * fabrique unique (`ADR-005`) : la facette « Fraîcheur » lit `n.fraicheur`, et
	 * c'est pourquoi elle se filtre ici et non dans l'index, qui ne porte pas ce
	 * champ.
	 *
	 * Cinq attributs de données passent par `donnees` : `data-etat`, `data-mode`,
	 * `data-degrade`, `data-trop`, `data-facettes`. Le style est dans
	 * `src/socle.css` et `src/vues/V-08.css`.
	 */
	import type { Domaine, Note, Univers, UtilisateurCourant } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { chercher, nombreFr, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { resolve } from '$app/paths';
	/* LES QUATRE MOTIFS DU VIDE, LEUR TITRE ET LEUR TEXTE — écrits une seule fois
	   (`$lib/recherche/motifs`) parce que la palette de recherche rapide les rend
	   aussi. Ils étaient déclarés ici ; une copie aurait vieilli, et l'écran resté
	   sur l'ancienne aurait nommé un geste que l'autre ne nomme plus. */
	import { TEXTE_DU_VIDE, TITRE_DU_VIDE, type MotifDuVide } from '$lib/recherche/motifs';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/**
	 * Les deux défauts de l'adresse, recopiés ici plutôt qu'importés :
	 * `$lib/recherche/moteur` les porte aussi, mais il ouvre la base et le client du
	 * moteur — l'importer d'une vue ferait entrer du code serveur dans le paquet du
	 * navigateur. Les deux valeurs viennent du gel (`V-08:1191`, `V-08:1004`).
	 */
	const ORDRE_PAR_DEFAUT = 'pertinence';
	const MODE_PAR_DEFAUT = 'hybride';

	/**
	 * LES QUATRE SOURCES QUI NE VIENNENT DE NULLE PART. `/recherche` n'en passe
	 * aucune : leur défaut était le jeu de démonstration, et l'écran servait donc
	 * « Karim Belhadj » à tout compte connecté. Le défaut est l'ÉTAT VIDE.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		/** Les notes à rendre — jeu de semence, ou résultat du moteur. */
		notes: readonly Note[];
		/**
		 * Les notes reçues sont-elles déjà le résultat du moteur ? Absent : non, et
		 * la vue cherche elle-même, comme la planche. Voir l'en-tête.
		 */
		recherchees?: boolean;
		/** La requête demandée. Absente, celle que le gel écrit au balisage. */
		requete?: string;
		/**
		 * Les valeurs de facette retenues par l'adresse, par identifiant de
		 * facette. Absent : aucune — l'état des sept positions de la planche.
		 */
		retenues?: Record<string, readonly string[]>;
		/** Le nombre de notes lisibles, toutes requêtes confondues — le dénominateur de
		    la règle d'affluence du gel. Absent : la taille du jeu reçu. */
		perimetre?: number;
		/**
		 * LA DURÉE DE LA RECHERCHE, EN MILLISECONDES — MESURÉE, jamais fabriquée : la
		 * formule du gel avait un terme nul par construction et affichait toujours
		 * « 0,31 s ». EXIGÉE. `null` quand aucune recherche n'a eu lieu — le compteur
		 * rend alors le compte SANS durée.
		 */
		dureeMs: number | null;
		/**
		 * Les pistes de reformulation. ELLES NE PEUVENT PAS SE DÉRIVER ICI : le bloc ne
		 * se rend que lorsque la recherche n'a rien rendu, donc `notes` est vide dans
		 * l'état même où les pistes servent. EXIGÉE ; vide, le bloc n'est pas rendu.
		 */
		pistes: readonly string[];
		/** Les univers déclarés. Absents, aucun — le contexte de coquille répond. */
		univers?: readonly Univers[];
		/** Les domaines accessibles. Absents, aucun — le contexte répond. */
		domaines?: readonly Domaine[];
		/** L'utilisateur connecté. Absent, une identité sans nom. */
		compte?: IdentiteAffichee;
		/**
		 * L'ordre demandé par l'adresse — `?tri=`. Absent : « pertinence », ce que le
		 * sélecteur du gel retient faute de `selected`. LA VUE NE TRIE PAS : c'est le
		 * moteur qui applique l'ordre (voir `trier()`).
		 */
		tri?: string;
		/**
		 * Le mode demandé par l'adresse — `?mode=`. Absent : « hybride » (`V-08:1004`).
		 * Le mode EFFECTIF n'est pas celui-ci : voir `mode`.
		 */
		modeDemande?: string;
		/**
		 * Pourquoi le périmètre est vide — `null` dès qu'une note s'y trouve. EXIGÉE :
		 * la vue ne peut pas le déduire, et « zéro note lisible » a quatre causes qui
		 * n'appellent pas le même geste. Sans elle, l'écran composait « Aucun résultat
		 * pour “” » sur une requête que personne n'avait formulée.
		 */
		motif: MotifDuVide | null;
	}

	/**
	 * L'identité affichée — la forme d'`UtilisateurCourant`, dont les valeurs du jeu
	 * de démonstration sont ÉLARGIES : `nom` y est l'union des trois noms du jeu, où
	 * aucun état vide n'est représentable. Le jeu de CLÉS reste lié au type d'origine
	 * par un type mappé, pour que cette forme ne diverge pas en silence.
	 */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	/** L'identité vide — ce que la barre supérieure affiche sans compte servi. */
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
		dureeMs,
		pistes,
		motif,
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
	 * L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040`. Le gel pose
	 * l'action d'écriture puis la cache en feuille, faute de serveur ; le produit
	 * ne l'émet pas, « ni grisée, NI MASQUÉE ». La classe reste sur le nœud rendu.
	 */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * `data-etat` — la valeur que le gestionnaire de planche pose AVANT de lever
	 * (`V-08:2091`) : « nominal » pour tout le reste, « Trop de résultats » compris.
	 */
	const etat = $derived(
		reglage['etat'] === 'chargement'
			? 'chargement'
			: reglage['etat'] === 'vide'
				? 'vide'
				: 'nominal'
	);

	/** Le sens indisponible — `V-08:2102-2103` pose `data-mode` ET `disabled`. */
	const degrade = $derived(reglage['c-degrade'] === true);
	/**
	 * LE MODE EFFECTIF — celui que l'écran SERT, jamais seulement celui qu'on a
	 * demandé. Dégradé, il vaut « mots-clés » quoi qu'on demande, et le bandeau du
	 * gel l'écrit au-dessous (`RG-M02-01`, bascule annoncée ; `P-10`, dégradation
	 * sans panne). La DEMANDE ne va PAS jusqu'au moteur : `chercherLesNotes()` n'a
	 * pas de paramètre de mode tant qu'il n'y a pas d'embedder à qui le passer.
	 */
	const mode = $derived(degrade ? 'motscles' : modeDemande);

	/* LA REQUÊTE. Le balisage du gel écrit `value="restauration base"`
	   (`V-08:1157`) ; son gestionnaire voudrait la remplacer mais pose ces valeurs
	   après un appel qui lève, donc la valeur du balisage tient sur les sept états.
	   En produit, `q` vient de l'adresse — `RG-M02-06`. */
	const REQUETE = 'restauration base';
	const q = $derived(requete ?? REQUETE);

	/* LES FACETTES — le port de `creerFacettes` (`V-08:1794-1933`). Quatre règles
	   reprises à la lettre :
	     1. la base est le résultat de la requête, jamais le corpus entier ;
	     2. le compte en regard d'une valeur est le nombre de résultats obtenus SI
	        cette valeur était retenue, les autres facettes restant appliquées ;
	     3. tri par compte décroissant puis alphabétique français ; une valeur RETENUE
	        qui ne mènerait à rien reste en fin de liste, marquée `data-vide` — sa
	        disparition ferait croire à un défaut d'affichage ;
	     4. `max: 8` valeurs par facette.
	   `ouverts` (`V-08:1952`) : statut, étiquette et visibilité seules repliées. */

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
	const base = $derived(recherchees ? corpus : chercher(corpus, q));

	/** Les valeurs retenues, facette par facette — l'adresse en est la source. */
	const choisis = $derived<Record<string, readonly string[]>>(retenues ?? {});

	const nbFiltres = $derived(Object.values(choisis).reduce((s, v) => s + v.length, 0));

	/** Un résultat passe s'il satisfait chaque facette ayant au moins une valeur
	    retenue ; dans une facette, les valeurs sont en « ou » (`V-08:1813-1821`). */
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

	function distribution(
		notes: readonly Note[],
		cle: (n: Note) => readonly string[]
	): Record<string, number> {
		const comptes: Record<string, number> = {};
		for (const n of notes) for (const v of cle(n)) if (v) comptes[v] = (comptes[v] ?? 0) + 1;
		return comptes;
	}

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

	/* LA ZONE DE RÉSULTATS — dérivée de V-02 (`ARB-030`), où `carte()` est gelée et
	   fonctionnelle (`mockups/V-02-recherche-publique.html:1145-1252`). Elle porte
	   déjà les deux publics : chaque différence y est un test sur `opts.publique`.
	   V-02 appelle avec `{ publique: true }`, V-08 sans l'option. */

	/**
	 * `trier()` EST L'IDENTITÉ, ET C'EST VOULU : l'ordre est celui du MOTEUR, qui
	 * l'applique avant cette vue — trier ici ne classerait que ce que le plafond de
	 * résultats a déjà retenu, et le filtrage par facettes préserve l'ordre. La
	 * sémantique des cinq ordres est gelée en `V-12:2117-2124` et portée par
	 * `ORDRES_DE_TRI` de `$lib/recherche/moteur`.
	 */
	function trier(notes: readonly Note[]): readonly Note[] {
		return notes;
	}

	/** Les résultats après facettes puis tri (`V-08:1959-1966`). */
	const affiches = $derived(trier(base.filter((n) => passe(n))));

	/**
	 * LA DURÉE AFFICHÉE — celle que le moteur a mesurée. TROIS DÉCIMALES, et c'est la
	 * mesure qui les impose : une recherche réelle se compte en unités de
	 * milliseconde. `typeof` plutôt qu'une comparaison à `null` : la propriété est
	 * exigée, mais un rendu hors application la laisse absente.
	 */
	const duree = $derived(
		typeof dureeMs === 'number' ? (dureeMs / 1000).toFixed(3).replace('.', ',') : null
	);

	/**
	 * `data-trop` — la règle du gel (`V-08:2021-2022`) : la part du corpus
	 * atteinte, jamais un nombre absolu, et jamais quand un filtre est retenu.
	 */
	const lisibles = $derived(perimetre ?? corpus.length);
	const affluence = $derived(affiches.length >= 8 && affiches.length / lisibles > 0.8);

	/** La condition exacte du gel (`V-08:1969`) : l'état « vide » de la planche,
	 *  ou aucun résultat pour une requête non vide. */
	const sansResultat = $derived(etat === 'vide' || (affiches.length === 0 && q.length > 0));

	/**
	 * Le gel écrit `q || "procédure de bascule VoIP"` (`V-08:1977`) pour qu'une
	 * planche à champ vide reste lisible. EN PRODUIT CE SERAIT UN MENSONGE, et le
	 * cas est atteignable : requête vide et périmètre fermé (`RG-DRO-02`).
	 */
	const requeteAffichee = $derived(recherchees ? q : q || 'procédure de bascule VoIP');

	/**
	 * La zone de résultats n'est pas rendue quand la vue rend un ÉTAT DE MAQUETTE :
	 * la référence gelée n'y montre rien, `rendre()` ayant levé avant de la remplir.
	 * Elle l'est dès que le moteur a cherché.
	 */
	const rendreLesResultats = $derived(recherchees);

	/* L'ADRESSE PORTE L'ÉTAT — `RG-M02-06`, `RG-M02-07`. Une seule fabrique
	   d'adresse, et toutes les commandes de la page y passent : c'est ce qui
	   garantit qu'une adresse partagée rend le même écran. `docs/routes.md` §4.2. */

	/**
	 * L'adresse est composée COUPLE PAR COUPLE, et non par `URLSearchParams` : une
	 * instance mutable de cette classe est refusée dans un composant
	 * (`svelte/prefer-svelte-reactivity`). L'ordre est fixe, pour que deux états
	 * identiques rendent la même adresse.
	 */
	function adresse(
		prochaines: Record<string, readonly string[]>,
		requeteVoulue: string,
		ordre: string = tri,
		modeVoulu: string = modeDemande
	): string {
		const couples: string[] = [];
		if (requeteVoulue) couples.push(`q=${encodeURIComponent(requeteVoulue)}`);
		/* Les deux réglages ne s'écrivent que s'ils DÉVIENT DU DÉFAUT : sans quoi
		   deux écrans identiques rendraient deux adresses différentes, ce que la
		   fabrique unique est là pour empêcher. */
		if (ordre !== ORDRE_PAR_DEFAUT) couples.push(`tri=${encodeURIComponent(ordre)}`);
		if (modeVoulu !== MODE_PAR_DEFAUT) couples.push(`mode=${encodeURIComponent(modeVoulu)}`);
		for (const f of FACETTES) {
			for (const v of prochaines[f.id] ?? []) couples.push(`${f.id}=${encodeURIComponent(v)}`);
		}
		return couples.length ? `/recherche?${couples.join('&')}` : '/recherche';
	}

	/** La navigation n'a lieu que BRANCHÉE : sans `recherchees`, la vue rend un état
	    de maquette hors de toute route, et y naviguer l'emmènerait ailleurs. */
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

	/** Changer l'ordre — l'état vit dans l'adresse et non dans une clôture, un tri
	    gardé en mémoire ne se partageant pas (`RG-M02-06`). Les filtres sont
	    conservés, comme au gel. */
	function changerLOrdre(ordre: string): void {
		aller(adresse(choisis, q, ordre));
	}

	/**
	 * Changer le mode — `V-08:2077-2083`. LE BOUTON DU MODE SERVI NE NAVIGUE PAS : la
	 * comparaison porte sur le mode EFFECTIF et non sur celui qu'on a demandé, sans
	 * quoi le clic d'« Hybride » en dégradé ne faisait rien du tout.
	 */
	function changerLeMode(voulu: string): void {
		if (voulu === mode) return;
		aller(adresse(choisis, q, tri, voulu));
	}

	/**
	 * « Affiner » est le seul geste de cette vue qui ne passe PAS par l'adresse :
	 * `#ouvrir-facettes` est le tiroir de facettes du petit écran, et ce n'est pas un
	 * état de recherche — deux écrans dont l'un a le tiroir ouvert montrent les mêmes
	 * résultats (`RG-M02-06`). On pose la valeur que la règle gelée attend.
	 */
	let facettesOuvertes = $state(false);

	/**
	 * « Créer la note « … » » — la seule action d'écriture de cet écran. `titre` est
	 * émis parce que c'est la requête restée sans réponse qui doit devenir le titre
	 * (`docs/routes.md:287`) ; `/notes/nouvelle` ne le lit pas encore.
	 */
	function creerLaNote(): void {
		aller(`/notes/nouvelle?titre=${encodeURIComponent(requeteAffichee)}`);
	}
</script>

<!--
	Le témoin de fraîcheur — fabrique unique (ADR-005), la même qu'en V-02 et
	partout ailleurs. Le libellé accompagne toujours la jauge (RG-M18-09).
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
	(`mockups/V-02-recherche-publique.html:1145-1252`) avec `opts.publique` indéfini,
	comme `V-08:2025-2028` l'appelle. Le pastillon Brouillon, la marque de registre,
	le rangement complet et la mention de visibilité sont les nœuds réservés au
	public connecté ; le segment de dossier est CONDITIONNEL — une note posée à la
	racine d'un domaine a un chemin vide, et le séparateur resterait pendu.

	AUCUN BLANC ENTRE LES NŒUDS, et il doit le rester : le nom accessible se construit
	sur `textContent`. L'espace de `{n.univers + ' › '}` est PORTÉ DANS L'EXPRESSION,
	jamais laissé en bord d'élément, que Svelte élaguerait.
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
			><span class="carte__chemin"><span>{n.univers + ' › '}</span><b>{n.domaine}</b>{#if n.dossier}<span>{' › ' + n.dossier}</span>{/if}</span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues) + ' ' + accord(n.vues, 'consultation')}</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj + ' ' + accord(n.pj, 'pièce jointe', 'pièces jointes')}</span>{/if}{#if n.visibilite === 'Publique'}<span class="sep">·</span><span class="carte__visibilite">Publique</span>{/if}</div
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
					<!-- Région serrée : le nom accessible se construit sur `textContent`, où un
						blanc inséré par le formateur se voit. Ne jamais citer la forme exacte de
						la directive du formateur à l'intérieur d'un commentaire. -->
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

				<!-- Les trois modes. `aria-pressed` suit le mode EFFECTIF. « Sens » ET
					« Hybride » sont désactivés quand la brique de sens est tombée : les deux
					ont besoin des vecteurs. Le gel ne désactive que « Sens ». -->
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
					LE COMPTEUR — `V-08:2011-2015`. Vide dans l'état sans résultat, où `rendre()`
					vide le nœud et sort (`V-08:1971`). Le compte est celui des résultats
					affichés — requête ET facettes, `RG-M02-08` — et la durée celle que le moteur
					a MESURÉE ; sans mesure, le compte se rend seul.
				-->
				<!-- prettier-ignore -->
				<span class="compteur" id="compteur">{#if rendreLesResultats && !sansResultat}<b>{`${affiches.length} ${accord(affiches.length, 'résultat')}`}</b>{#if duree !== null}{` en ${duree} s`}{/if}{/if}</span>
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
					<!-- Le sélecteur de tri — les cinq `<option>` du gel, dans son ordre.
						`selected` n'est posé que HORS DÉFAUT : le gel n'en écrit aucun
						(`V-08:1191-1195`), et le navigateur retient donc le premier. -->
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
				LES PASTILLES DE FILTRE — RG-M02-07, port de `rendreActifs()`. Chaque
				pastille retire son couple de l'adresse ; « Tout effacer » ne garde que `q`.
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

			<!-- LA ZONE DE RÉSULTATS — deux branches, celles de `rendre()` : sans
				résultat, le bloc `.vide` de `V-08:1972-2007` ; avec résultats, une carte par
				note (`V-08:2024-2030`). -->
			<!-- prettier-ignore -->
			<div class="resultats si-nominal" id="resultats">{#if !rendreLesResultats}{:else if motif !== null}<div class="vide"
					><h2 class="vide__titre">{TITRE_DU_VIDE[motif]}</h2
					><p class="vide__txt">{TEXTE_DU_VIDE[motif]}</p
					>{#if motif === 'sans-univers'}<a class="btn btn--principal" href={resolve('/console/univers')}>Créer un univers</a
					>{:else if motif === 'corpus-vide' && ecriture}<a class="btn btn--principal si-ecriture" href={resolve('/notes/nouvelle')}>Créer une note</a
				>{/if}</div>{:else if sansResultat}<div class="vide"
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
