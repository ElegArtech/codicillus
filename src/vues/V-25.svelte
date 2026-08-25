<script lang="ts">
	/**
	 * V-25 — Mon profil. Route `/mon-profil` (`docs/routes.md`).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SEPT ÉTATS, ET CE QUI LES SÉPARE
	 *
	 * `verif/scenarios/V-25.json` déclare sept états sur trois contrôles de
	 * planche, et AUCUN état de zone :
	 *
	 *   `ong-identite` `ong-securite` `ong-distinctions` `ong-activite`
	 *     — les quatre onglets. Un seul `.volet` porte `data-actif="oui"` ;
	 *       les trois autres sont `display:none` (`V-25.css:370`). Le contenu
	 *       des quatre volets est rendu dans tous les états, comme au gel.
	 *   `cpt-karim`  — le compte incarné par défaut. Le scénario le marque
	 *       `identiqueA: "ong-identite"` : c'est le même écran, capturé deux
	 *       fois, et non un huitième cas.
	 *   `cpt-neuf`   — le nouvel arrivant. Aucune contribution, aucune
	 *       distinction obtenue, aucune activité : c'est le cas de corpus vide
	 *       de la vue, et il est DÉRIVÉ, pas simulé (voir plus bas).
	 *   `verrou`     — le mot de passe est géré par l'administrateur. Le bloc
	 *       `#verrou` remplace `#form-mdp`. Son vecteur reste `ong: identite` :
	 *       la bascule est donc invisible à l'écran, et c'est le gel.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES DISTINCTIONS SONT CALCULÉES, JAMAIS FIGÉES — M16.5 ET P-02
	 *
	 * Rien de ce que cette vue affiche en chiffres n'est écrit ici. Les quatre
	 * indicateurs de contribution, les six jauges de distinction et le flux
	 * d'activité sortent tous de `seeds/corpus.ts`, par les trois fonctions
	 * ci-dessous qui transcrivent celles du gel :
	 *
	 *   `statistiquesDe()`  — `window.statsDe` (`V-25:2486`). Les notes
	 *       publiées et les brouillons se COMPTENT sur le corpus ; les
	 *       citations se comptent sur `RELATIONS` ; les vérifications et les
	 *       liens sont lus à `CONTRIBUTIONS`, que le corpus déclare
	 *       explicitement comme la part non calculable — « ce qui est
	 *       calculable l'est ; le reste […] est déclaré ici plutôt que deviné
	 *       dans la vue » (`seeds/corpus.ts:2049`).
	 *   `progression()`     — la jauge d'une distinction, `V-25:2765-2790`.
	 *   `evenementsDe()`    — `rendreActivite`, `V-25:2830`.
	 *
	 * LE COMPTE NEUF N'EST PAS UN JEU DE ZÉROS ÉCRIT À LA MAIN. Le gel pose
	 * `stats = { publiees: 0, brouillons: 0, verifiees: 0, liens: 0,
	 * citations: 0, notePhare: null }` (`V-25:3002`) ; ici, la MÊME fonction
	 * est appelée avec le nom de Léa Marchand, et rend exactement cela —
	 * elle n'est l'auteur d'aucune note du corpus, `CONTRIBUTIONS` ne la porte
	 * pas, `RELATIONS` ne cite rien d'elle. Le zéro est un résultat, pas une
	 * valeur. C'est ce que P-02 exige et ce que la batterie 8 contrôlera.
	 *
	 * LA FRAÎCHEUR N'EST PAS AFFICHÉE PAR CETTE VUE. Aucun témoin, aucun
	 * agrégat, aucun libellé de fraîcheur ne figure à `main.profil` : le seul
	 * emploi de `window.temoinFraicheur` de la maquette est dans la fabrique de
	 * la palette V-09, qui n'est pas rendue (voir plus bas). `$lib/fraicheur`
	 * n'est donc pas importé — et surtout, RIEN N'EST RECALCULÉ ICI : P-01 est
	 * tenu par abstention, pas par contournement.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES LITTÉRAUX DU GEL QUE LE CORPUS NE PORTE PAS
	 *
	 * Trois, et trois seulement — déclarés, portés tels quels, jamais dérivés :
	 *
	 *   1. `IDENTIFIANT_DU_COMPTE_NEUF = 'c-lea'`. Le gel écrit `COMPTE_NEUF`
	 *      en toutes lettres (`V-25:2984`) : nom, initiales, identifiant,
	 *      courriel, rôle, domaine, arrivée, dernière connexion. TOUT cela
	 *      figure à `COMPTES` (`seeds/corpus.ts:2025`, entrée `c-lea`), aux
	 *      initiales près — huit valeurs sur neuf. Seule la DÉSIGNATION du
	 *      compte à incarner reste un choix de planche, et c'est ce que cette
	 *      constante porte.
	 *   2. La règle des initiales, `initialesDe()`. Le corpus donne
	 *      `MOI.initiales`, mais aucune initiale pour les autres comptes. La
	 *      règle est celle de `window.contributeurs` du gel, transcrite comme
	 *      V-10, V-11 et V-40 l'ont déjà fait. Vérifié : elle rend « KB » pour
	 *      « Karim Belhadj », soit exactement `MOI.initiales`.
	 *   3. Les libellés de geste, `GESTES` (`V-25:2812`), et les libellés
	 *      d'ancienneté de `relatif()` (`V-25:2818`). Ce sont des textes
	 *      d'interface, pas des données : le corpus porte le type d'événement
	 *      et son ancienneté en heures, la vue porte les mots.
	 *
	 * Tout le reste — quatre lignes attribuées, quatre indicateurs, six
	 * distinctions, huit événements filtrés à quatre — sort du corpus.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA COQUILLE, FORME ABRÉGÉE — ARB-021
	 *
	 * V-25 est l'une des 26 vues abrégées : barre sans les deux menus
	 * déroulants, rail sans pictogrammes ni `data-vers`, `Gestion` en
	 * `si-ecriture`, pas de `#rail-univers`, arborescence écrite au balisage.
	 * `node verif/releve-vues.mjs --formes` en est le juge.
	 *
	 * TROIS ATTRIBUTS DE DONNÉES sont transmis à `div.app` par `donnees`
	 * (A-2) : `data-onglet`, `data-verrou`, `data-activite`. AUCUNE feuille ne
	 * les lit — le relevé les classe parmi les onze que seul le script de
	 * planche consomme (`docs/releve-vues.md` §4). Ils sont portés parce que le
	 * gel les écrit, et pour que la comparaison de balisage reste exacte.
	 *
	 * `droits` N'EST PAS TRANSMIS, et c'est délibéré : le gel de V-25 n'écrit
	 * JAMAIS `data-droits` sur `div.app` — ses six attributs sont `class`,
	 * `id`, `data-rail`, `data-onglet`, `data-verrou`, `data-activite`
	 * (`node verif/releve-vues.mjs V-25`). La propriété laissée absente, le
	 * gabarit n'émet pas l'attribut. Les trois nœuds `si-ecriture` du rail et
	 * de la barre restent donc visibles, comme au gel.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011. Ni `notifier()`, ni la
	 * bascule d'onglet au clic, ni l'évaluation de robustesse à la frappe, ni
	 * l'affichage du mot de passe : le squelette rend l'ÉTAT, jamais la
	 * transition. `#robustesse` reste donc dans la forme que le gel lui donne
	 * AU BALISAGE — `data-niveau="court"`, quatre segments éteints, « Trop
	 * court », « 0 / 12 » —, parce que `creerRobustesse()` n'appelle pas
	 * `evaluer()` à la construction (`V-25:2618` : la fabrique pose ses
	 * écouteurs et rend l'objet, sans première évaluation). Pour la même
	 * raison, les trois `li` de `#regles` ne portent aucun `data-ok`.
	 *
	 * L'HÔTE DE PALETTE DE V-09 — `template#tpl-palette` et `dialog#palette`
	 * fermé — n'est pas rendu : mesuré SANS AUCUNE INCIDENCE sur trente
	 * maquettes, dont V-25 nommément, instantané ARIA identique et capture
	 * identique à l'octet (`docs/releve-vues.md` §4.1). Son montage réel
	 * appartient au lot qui portera V-09 (DAG K-10).
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE. Les
	 * `si-ecriture` du rail et de la barre reproduisent le gel, qui retire
	 * l'élément EN CSS : ce n'est pas P-09, qui exige l'absence du DOM. Ni
	 * P-09, ni P-02, ni M16.5 ne sont déclarés tenus par ce lot.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-25.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-25 --installer`. Les `style=` reproduits
	 * figurent tous à l'ensemble clos du gel de V-25 (ARB-016).
	 */
	import {
		ACTIVITE,
		COMPTES,
		CONTRIBUTIONS,
		DISTINCTIONS,
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		UNIVERS,
		type Compte,
		type Distinction,
		type Domaine,
		type EtatDInstance,
		type EvenementDActivite,
		type Note,
		type Relation,
		type TypeDEvenement,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDesNotesDuDomaine } from '$lib/rangement/adresses';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur?: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-25')`, variante complète. */
		notes: readonly Note[];
		/**
		 * LES QUATRE SOURCES DE LA COQUILLE, EN PROPRIÉTÉS OPTIONNELLES (T-045).
		 *
		 * Absentes, les constantes du jeu de semence s'appliquent : c'est ce que le
		 * mode démo passe, et c'est ce qui garantit que le banc ne bouge pas d'un
		 * pixel. Fournies — par un chargeur de route —, elles l'emportent, et la vue
		 * cesse de servir une valeur figée, indépendante de la base et de l'identité.
		 */
		/** Les univers déclarés. Absente, `UNIVERS` du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, `DOMAINES` du jeu de semence. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, `MOI` du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, `INSTANCE` du jeu de semence. */
		instance?: EtatDInstance;
		/** Les comptes de l'instance. Absente, `COMPTES` du jeu de semence. */
		comptes?: readonly Compte[];
		/**
		 * Les contributions déclarées, par auteur. Absente, `CONTRIBUTIONS` du jeu
		 * de semence. La table est PARTIELLE : un compte sans contribution
		 * déclarée existe — le gel en montre un —, et le rendu le traite déjà.
		 *
		 * `null` N'EST PAS ZÉRO — `P-02`. Un chargeur de route qui compte en base
		 * ce qui est comptable et ne peut PAS attribuer les liens internes
		 * (`relations` ne porte pas l'auteur du lien) passe `null` pour celui-là :
		 * l'indicateur et les distinctions qui le mesurent s'affichent alors en
		 * état neutre explicite, jamais en zéro muet. Le jeu de semence, lui,
		 * déclare deux nombres, et rien ne change pour lui.
		 */
		contributions?: Partial<Record<string, ContributionAffichee>>;
		/** Les distinctions du barème. Absente, `DISTINCTIONS` du jeu de semence. */
		distinctions?: readonly Distinction[];
		/** Le flux d'activité. Absente, `ACTIVITE` du jeu de semence. */
		activite?: readonly EvenementDActivite[];
		/** Les relations du corpus. Absente, `RELATIONS` du jeu de semence. */
		relations?: readonly Relation[];
		/**
		 * LE PROFIL DU COMPTE CONNECTÉ, tel que la base le porte.
		 *
		 * Absente, le compte est cherché dans `comptes` par le nom de `compte` —
		 * c'est le chemin du jeu de semence et des sept états de la planche, et il
		 * ne bouge pas. Fournie par un chargeur de route, elle l'emporte : l'écran
		 * cesse alors d'afficher l'identité du corpus et affiche celle du titulaire
		 * de la session. `src/lib/donnees/profil.ts`, `profilAffiche()`, en est la
		 * seule fabrique.
		 */
		profilDuCompte?: ProfilAffiche | null;
		/**
		 * LE RANGEMENT DU TITULAIRE — les deux IDENTIFIANTS d'adresse de son
		 * domaine de rattachement, tels que la base les joint.
		 *
		 * C'est ce qui donne son adresse à « Voir les notes de … ». Elle ne se
		 * dérive pas du nom affiché : `RG-M12-11` fige l'identifiant à la création
		 * et le laisse stable ensuite, si bien qu'un domaine renommé s'adresse
		 * toujours par son premier identifiant.
		 *
		 * Fournie à `null`, le titulaire n'a aucun rattachement et le bouton reste
		 * inerte. Absente, la vue n'est pas branchée sur une base et cherche la
		 * correspondance par nom dans `domaines` — le chemin du jeu de semence.
		 */
		rangementDuProfil?: { readonly univers: string; readonly domaine: string } | null;
		/**
		 * « Rester connecté sur cet appareil » — l'état de `sessions.souvenir` pour
		 * la session courante. Absente, la case reste dans la position du gel.
		 */
		preferenceDeSession?: boolean;
	}

	/**
	 * Une contribution telle que l'écran la reçoit — deux nombres, dont chacun
	 * peut être INDISPONIBLE. `Contribution` du jeu de semence s'y range sans
	 * conversion : ses deux champs sont des nombres.
	 */
	interface ContributionAffichee {
		readonly verifiees: number | null;
		readonly liens: number | null;
	}

	/** Le profil affiché, dans la forme que `profilAffiche()` compose. */
	interface ProfilAffiche {
		readonly nom: string;
		readonly identifiant: string;
		readonly courriel: string;
		readonly role: string;
		readonly domaine: string;
		readonly arrivee: string;
		readonly derniereConnexion: string;
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		comptes = COMPTES,
		contributions = CONTRIBUTIONS,
		distinctions = DISTINCTIONS,
		activite = ACTIVITE,
		relations = RELATIONS,
		profilDuCompte = null,
		rangementDuProfil,
		preferenceDeSession = false
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** L'onglet ouvert. Défaut `identite`, comme le balisage du gel. */
	const onglet = $derived(typeof reglage['ong'] === 'string' ? reglage['ong'] : 'identite');
	/** Le compte incarné par la planche : `karim` ou `neuf`. */
	const cas = $derived(typeof reglage['cpt'] === 'string' ? reglage['cpt'] : 'karim');
	/** Le mot de passe est-il géré par l'administrateur ? `appliquerVerrou()` du gel. */
	const verrouille = $derived(reglage['c-verrou'] === true);

	/**
	 * LE COMPTE À INCARNER — le seul littéral de désignation du gel.
	 * `COMPTE_NEUF` (`V-25:2984`) nomme Léa Marchand ; `COMPTES` porte ses huit
	 * autres valeurs, à l'identique.
	 */
	const IDENTIFIANT_DU_COMPTE_NEUF = 'c-lea';

	/**
	 * Les initiales d'un nom — règle de `window.contributeurs` du gel, déjà
	 * transcrite par V-10, V-11 et V-40. Elle rend « KB » pour « Karim
	 * Belhadj », c'est-à-dire `MOI.initiales`.
	 */
	function initialesDe(nom: string): string {
		return nom
			.split(' ')
			.map((m) => m[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	/** Le nombre en français — `nb()` du gel, `toLocaleString("fr-FR")`. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/**
	 * LE MARQUEUR D'UNE DONNÉE QUI N'EXISTE PAS — `P-02`, et c'est la seule
	 * forme que le gel donne au vide : `V-24:1287` écrit le cadratin au
	 * sous-titre du dépôt tant qu'aucun scénario n'est retenu. Zéro et
	 * « indisponible » sont deux informations différentes ; c'est le zéro muet
	 * que `RG-M01-01` vise.
	 */
	const RIEN = '—';

	/** Un nombre à l'écran, ou le marqueur du vide. */
	function chiffre(x: number | null): string {
		return x === null ? RIEN : nb(x);
	}

	/** Le profil affiché : ce que l'entête, l'identité et la session en lisent. */
	interface Profil {
		readonly nom: string;
		readonly initiales: string;
		readonly identifiant: string;
		readonly courriel: string;
		readonly role: string;
		readonly domaine: string;
		readonly arrivee: string;
		readonly derniereConnexion: string;
	}

	/**
	 * Un compte du corpus, mis dans la forme que la vue attend. `arrivee` et
	 * `derniere` de `COMPTES` valent, pour Karim, exactement l'`arrivee` et la
	 * `derniereConnexion` que `CONTRIBUTIONS` porte — le corpus ne se contredit
	 * pas, et une seule des deux sources suffit donc aux deux comptes.
	 */
	function profilDe(compte: Compte): Profil {
		return {
			nom: compte.nom,
			initiales: initialesDe(compte.nom),
			identifiant: compte.identifiant,
			courriel: compte.courriel,
			role: compte.role,
			domaine: compte.domaine,
			arrivee: compte.arrivee,
			derniereConnexion: compte.derniere
		};
	}

	const compteCourant = $derived(
		comptes.find((c) =>
			cas === 'neuf' ? c.id === IDENTIFIANT_DU_COMPTE_NEUF : c.nom === compte.nom
		)
	);

	/**
	 * LE PROFIL RENDU — celui de la base quand un chargeur le passe, celui du
	 * corpus sinon.
	 *
	 * Les initiales ne voyagent pas : la règle du gel est ci-dessus, et
	 * l'appliquer ici plutôt que de la recevoir garantit qu'il n'en existe
	 * qu'une. Vérifié sur le jeu de semence — « Karim Belhadj » rend « KB »,
	 * c'est-à-dire `MOI.initiales`.
	 */
	const profil = $derived<Profil | null>(
		profilDuCompte !== null && profilDuCompte !== undefined
			? { ...profilDuCompte, initiales: initialesDe(profilDuCompte.nom) }
			: compteCourant
				? profilDe(compteCourant)
				: null
	);

	/** Les quatre lignes du panneau « Attribué par l'administration ». */
	const attribues = $derived(
		profil
			? ([
					['Identifiant', profil.identifiant],
					['Rôle', profil.role],
					['Domaine principal', profil.domaine],
					["Date d'arrivée", profil.arrivee]
				] as const)
			: []
	);

	/* ═══════════════════════════════════════════════════════════════════════
	   LES CONTRIBUTIONS — `window.statsDe`, transcrit (`V-25:2486`)
	   ═══════════════════════════════════════════════════════════════════════ */

	interface Statistiques {
		readonly publiees: number;
		readonly brouillons: number;
		/** `null` quand la donnée n'existe pas — jamais un zéro de commodité. */
		readonly verifiees: number | null;
		readonly liens: number | null;
		readonly citations: number;
		readonly notePhare: Note | null;
	}

	/**
	 * Ce qui est calculable l'est. Les publications et les brouillons se
	 * comptent sur le corpus de la vue ; les citations sont, parmi les notes de
	 * l'auteur, le plus grand nombre de relations qui pointent vers l'une
	 * d'elles — et la note qui les porte est la note phare. Les vérifications
	 * et les liens ne sont pas dérivables d'un corpus qui ne garde pas
	 * l'historique : `CONTRIBUTIONS` les déclare, et son absence pour un compte
	 * vaut zéro. C'est la lettre du gel.
	 */
	function statistiquesDe(nom: string): Statistiques {
		const declaree: ContributionAffichee | undefined = contributions[nom];
		const siennes = notes.filter((n) => n.auteur === nom && !n.brouillon);
		const brouillons = notes.filter((n) => n.auteur === nom && n.brouillon);
		let citations = 0;
		let notePhare: Note | null = null;
		for (const n of siennes) {
			const vers = relations.filter((r) => r.vers === n.id).length;
			if (vers > citations) {
				citations = vers;
				notePhare = n;
			}
		}
		return {
			publiees: siennes.length,
			brouillons: brouillons.length,
			verifiees: declaree === undefined ? 0 : declaree.verifiees,
			liens: declaree === undefined ? 0 : declaree.liens,
			citations,
			notePhare
		};
	}

	const stats = $derived(profil ? statistiquesDe(profil.nom) : null);

	/** Les quatre indicateurs de contribution, dans l'ordre du gel. */
	const indicateurs = $derived(
		stats
			? ([
					[
						stats.publiees,
						'notes publiées',
						stats.brouillons ? `${stats.brouillons} brouillon en cours` : 'aucun brouillon'
					],
					[stats.verifiees, 'notes vérifiées', 'depuis votre arrivée'],
					[stats.liens, 'liens internes créés', "vers d'autres notes"],
					[
						stats.citations,
						'citations maximales',
						stats.notePhare ? `sur « ${stats.notePhare.titre} »` : 'sur une même note'
					]
				] as const)
			: []
	);

	/* ═══════════════════════════════════════════════════════════════════════
	   LES SIX DISTINCTIONS — toujours affichées, obtenues ou non
	   ═══════════════════════════════════════════════════════════════════════ */

	interface Jauge {
		readonly distinction: Distinction;
		/** `null` : la mesure n'existe pas. Ni obtenue, ni en progression — inconnue. */
		readonly valeur: number | null;
		readonly obtenue: boolean;
		readonly part: number;
	}

	/**
	 * `V-25:2765` — la mesure lue sur les statistiques, jamais une constante.
	 *
	 * UNE MESURE INDISPONIBLE NE PROGRESSE PAS DE ZÉRO POUR CENT : elle ne
	 * progresse pas du tout, et la jauge le dit. Poser `0 %` affirmerait que le
	 * compte n'a rien fait, ce qu'on ignore (`P-02`).
	 */
	function progression(d: Distinction, s: Statistiques): Jauge {
		const valeur = s[d.mesure];
		if (valeur === null) return { distinction: d, valeur: null, obtenue: false, part: 0 };
		return {
			distinction: d,
			valeur,
			obtenue: valeur >= d.seuil,
			part: Math.min(100, Math.round((valeur / d.seuil) * 100))
		};
	}

	/** Ce que l'étiquette accessible d'une distinction dit de son état. */
	function etatDeLaJauge(j: Jauge): string {
		if (j.valeur === null) return 'mesure indisponible';
		return j.obtenue ? 'obtenue' : `progression ${j.part} pour cent`;
	}

	const jauges = $derived(stats ? distinctions.map((d) => progression(d, stats)) : []);

	/* ═══════════════════════════════════════════════════════════════════════
	   L'ACTIVITÉ — `rendreActivite` (`V-25:2830`)
	   ═══════════════════════════════════════════════════════════════════════ */

	/** Les libellés de geste — `GESTES` du gel (`V-25:2812`). */
	const GESTES: Record<TypeDEvenement, string> = {
		verification: 'Vous avez vérifié',
		edition: 'Vous avez modifié',
		publication: 'Vous avez publié',
		revision: 'Vous avez signalé à réviser',
		import: 'Vous avez terminé un import'
	};

	/** `relatif()` du gel (`V-25:2818`) — l'ancienneté en heures, mise en mots. */
	function relatif(h: number): string {
		if (h < 1) return "à l'instant";
		if (h < 24) return `il y a ${h} h`;
		const j = Math.round(h / 24);
		return j === 1 ? 'hier' : `il y a ${j} jours`;
	}

	const evenements = $derived(
		profil ? activite.filter((e: EvenementDActivite) => e.qui === profil.nom) : []
	);

	/** Le titre de la note visée, cherché au corpus — `V-25:2861`. */
	function titreDe(cible: string): string {
		return notes.find((n) => n.id === cible)?.titre ?? cible;
	}

	/**
	 * L'ADRESSE DE « VOIR LES NOTES DE … » — l'issue que le gel propose au nouvel
	 * arrivant dont le flux d'activité est vide (`V-25:2884`).
	 *
	 * ELLE EST LUE, JAMAIS DÉRIVÉE DU NOM. Un domaine ne s'adresse que dans son
	 * univers (`RG-STR-02`), et par les deux IDENTIFIANTS, qui ne suivent ni le
	 * nom ni l'univers : `RG-M12-11` les fige à la création, si bien qu'un
	 * domaine renommé garde le sien. Chercher le domaine du titulaire par son
	 * nom d'affichage composait donc une adresse qui rend 404 dès le premier
	 * renommage — et une adresse d'homonyme quand deux univers portaient le même
	 * nom de domaine.
	 *
	 * `rangementDuProfil` porte les deux identifiants tels que la base les
	 * joint. Absente, la vue n'est pas branchée sur une base et retombe sur la
	 * correspondance par nom du jeu de semence : le banc de comparaison ne bouge
	 * pas.
	 */
	const adresseDesNotesDuProfil = $derived.by(() => {
		if (rangementDuProfil !== undefined) {
			return rangementDuProfil === null
				? null
				: adresseDesNotesDuDomaine(rangementDuProfil.univers, rangementDuProfil.domaine);
		}
		const duJeu = domaines.find((d) => d.nom === profil?.domaine);
		return duJeu === undefined ? null : adresseDesNotesDuDomaine(duJeu.univers, duJeu.nom);
	});

	/**
	 * L'ADRESSE VIENT DE LA FABRIQUE UNIQUE — `$lib/rangement/adresses`,
	 * `ARB-001` —, et `svelte/no-navigation-without-resolve` ne sait pas la
	 * vérifier : elle n'est pas un identifiant de route mais une chaîne dérivée
	 * de deux identifiants. La règle est levée sur cette seule ligne, comme
	 * `V-24` la lève pour les adresses de son rapport d'import.
	 */
	function voirLesNotesDuDomaine(): void {
		if (adresseDesNotesDuProfil === null) return;
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(adresseDesNotesDuProfil);
	}

	/**
	 * `data-activite` de `div.app`. Le gel le pose à « vide » pour le nouvel
	 * arrivant et à « pleine » pour le compte incarné (`V-25:3003` et `:3014`),
	 * puis le relit pour décider s'il rend un flux ou un encouragement. Les
	 * deux voies aboutissent au même ensemble d'événements : celui du filtre.
	 */
	const etatDActivite = $derived(evenements.length ? 'pleine' : 'vide');
</script>

<Coquille
	fil={['Accueil', 'Mon profil']}
	courant={[]}
	{univers}
	{domaines}
	{notes}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
	rail="ouvert"
	forme="abregee"
	donnees={{
		'data-onglet': onglet,
		'data-verrou': verrouille ? 'oui' : 'non',
		'data-activite': etatDActivite
	}}
	classeContenu="profil"
	idContenu="contenu"
>
	{#snippet enfants()}
		<!--
			L'ENTÊTE. `#sous-nom` est construit nœud par nœud par le gel, sans un
			seul blanc entre les trois enfants : `.entete-profil__sous` est un
			conteneur `flex` à `gap`, et un blanc inséré s'y verrait au relevé
			d'ordre de tabulation comme au pixel (P-6, P-8).
		-->
		<header class="entete-profil">
			<div class="avatar-profil" id="avatar" aria-hidden="true">{profil?.initiales ?? ''}</div>
			<div class="entete-profil__corps">
				<h1 id="nom">{profil?.nom ?? ''}</h1>
				<!-- prettier-ignore -->
				<div class="entete-profil__sous" id="sous-nom"
					><span class="past past--type">{profil?.role ?? ''}</span
					><span class="past">{profil?.domaine ?? ''}</span
					><span>{`dans l'équipe depuis le ${profil?.arrivee ?? ''}`}</span
				></div>
			</div>
			<button class="btn" id="deconnexion">Se déconnecter</button>
		</header>

		<!-- prettier-ignore -->
		<div class="onglets" role="tablist" aria-label="Sections du profil"
			><button role="tab" aria-selected={onglet === 'identite'} data-onglet="identite">Identité</button
			><button role="tab" aria-selected={onglet === 'securite'} data-onglet="securite">Sécurité</button
			><button role="tab" aria-selected={onglet === 'distinctions'} data-onglet="distinctions">Distinctions</button
			><button role="tab" aria-selected={onglet === 'activite'} data-onglet="activite">Activité</button
		></div>

		<!-- ============ IDENTITÉ ============ -->
		<section
			class="volet"
			data-volet="identite"
			data-actif={onglet === 'identite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Ce que vous pouvez modifier</span></div>
				<div class="panneau__corps bloc__corps">
					<div class="champ">
						<label class="champ__label" for="p-affiche">Nom affiché</label>
						<input
							class="saisie"
							type="text"
							id="p-affiche"
							style="max-width:380px"
							value={profil?.nom ?? ''}
						/>
						<span class="champ__aide"
							>C'est ce nom qui apparaît sur vos notes et dans l'activité.</span
						>
					</div>
					<div class="champ">
						<label class="champ__label" for="p-courriel">Adresse électronique</label>
						<input
							class="saisie"
							type="email"
							id="p-courriel"
							style="max-width:380px"
							value={profil?.courriel ?? ''}
						/>
						<span class="champ__aide"
							>Sert aux notifications et à la réinitialisation du mot de passe.</span
						>
					</div>
					<div>
						<button class="btn btn--principal" id="enregistrer-identite">Enregistrer</button>
					</div>
				</div>
			</div>

			<!--
				Champs attribués : lisibles, expliqués, jamais de simple grisé. Le gel
				les construit sans blanc entre les trois cellules ni entre le
				pictogramme du cadenas et sa mention.
			-->
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Attribué par l'administration</span></div>
				<!-- prettier-ignore -->
				<div class="panneau__corps bloc__corps" id="attribues"
					>{#each attribues as ligne (ligne[0])}<div class="attribue"
						><span class="attribue__cle">{ligne[0]}</span
						><span class="attribue__val">{ligne[1]}</span
						><span class="attribue__cadenas"
							><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
								><rect x="3.5" y="7" width="9" height="6.5" rx="1.3"/><path d="M5.8 7V5.2a2.2 2.2 0 0 1 4.4 0V7"/></svg
							>attribué</span
						></div
					>{/each}<div class="mention-attribution">Le rôle et le domaine principal sont fixés par un administrateur, depuis la console. Si l'un des deux ne correspond plus à votre situation, demandez-lui de le corriger — vous ne pouvez pas le faire vous-même, et c'est voulu.</div
				></div>
			</div>
		</section>

		<!-- ============ SÉCURITÉ ============ -->
		<section
			class="volet"
			data-volet="securite"
			data-actif={onglet === 'securite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Mot de passe</span></div>
				<div class="panneau__corps bloc__corps">
					<div class="verrou" id="verrou" hidden={!verrouille}>
						<svg
							width="20"
							height="20"
							viewBox="0 0 16 16"
							fill="none"
							stroke="var(--c-info)"
							stroke-width="1.5"
							style="flex:none;margin-top:1px"
							><rect x="3" y="7" width="10" height="7" rx="1.4" /><path
								d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
							/></svg
						>
						<div>
							<h3>Compte de démonstration</h3>
							<p>
								Le mot de passe de ce compte est géré par l'administrateur : il ne peut pas être
								changé depuis ici. Adressez-vous à l'administration technique si vous devez le faire
								modifier.
							</p>
						</div>
					</div>

					<div id="form-mdp" hidden={verrouille}>
						<!-- Les règles sont annoncées avant la saisie, comme en V-06. -->
						<div style="margin-bottom:var(--e-4)">
							<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
								>Ce qui est demandé</span
							>
							<ul class="regles" id="regles">
								<li data-regle="longueur">12 caractères au minimum</li>
								<li data-regle="varie">Au moins deux natures de caractères différentes</li>
								<li data-regle="different">Différent de votre identifiant</li>
							</ul>
						</div>

						<form class="bloc__corps" id="form-securite" novalidate>
							<div class="champ" id="champ-actuel" style="max-width:380px">
								<label class="champ__label" for="actuel">Mot de passe actuel</label>
								<input class="saisie" type="password" id="actuel" autocomplete="current-password" />
								<div class="champ__erreur" id="erreur-actuel" hidden>
									<svg
										width="13"
										height="13"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										style="flex:none;margin-top:1px"
										><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
									>
									Saisissez votre mot de passe actuel.
								</div>
							</div>

							<div class="champ" id="champ-nouveau" style="max-width:380px">
								<label class="champ__label" for="nouveau">Nouveau mot de passe</label>
								<div class="champ__boite">
									<input class="saisie" type="password" id="nouveau" autocomplete="new-password" />
									<button
										class="champ__action"
										type="button"
										id="voir"
										aria-label="Afficher le mot de passe"
										aria-pressed="false"
									>
										<svg
											width="17"
											height="17"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8z" /><circle
												cx="8"
												cy="8"
												r="1.8"
											/></svg
										>
									</button>
								</div>
								<div class="robustesse" id="robustesse" data-niveau="court">
									<!-- prettier-ignore -->
									<div class="robustesse__segments" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
									<div class="robustesse__txt">
										<span class="robustesse__note" id="robustesse-note">Trop court</span>
										<span class="robustesse__reste" id="robustesse-reste">0 / 12</span>
									</div>
								</div>
								<span class="champ__aide"
									>Quatre mots sans rapport entre eux valent mieux qu'un mot compliqué.</span
								>
							</div>

							<div class="champ" id="champ-confirm" style="max-width:380px">
								<label class="champ__label" for="confirmation"
									>Confirmer le nouveau mot de passe</label
								>
								<input
									class="saisie"
									type="password"
									id="confirmation"
									autocomplete="new-password"
								/>
								<div class="champ__erreur" id="erreur-confirm" hidden>
									<svg
										width="13"
										height="13"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										style="flex:none;margin-top:1px"
										><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
									>
									Les deux saisies ne correspondent pas.
								</div>
							</div>

							<div>
								<button class="btn btn--principal" type="submit">Changer le mot de passe</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			<div class="panneau bloc">
				<div class="panneau__tete"><span class="etiq">Session</span></div>
				<div class="panneau__corps bloc__corps">
					<!-- prettier-ignore -->
					<div class="attribue"
						><span class="attribue__cle">Dernière connexion</span
						><span class="attribue__val" id="derniere-connexion">{profil?.derniereConnexion ?? ''}</span
					></div>
					<div class="preferences">
						<label class="pref">
							<span class="pref__txt">
								<span class="pref__nom">Rester connecté sur cet appareil</span>
								<span class="pref__aide"
									>À éviter sur un poste partagé. Sans cette option, la session se ferme après deux
									heures d'inactivité.</span
								>
							</span>
							<!-- prettier-ignore -->
							<span class="interrupteur"><input type="checkbox" id="p-session" checked={preferenceDeSession}><span class="interrupteur__piste"></span></span>
						</label>
						<label class="pref">
							<span class="pref__txt">
								<span class="pref__nom">Recevoir les demandes de révision par courriel</span>
								<span class="pref__aide"
									>Un message quand un collègue signale une de vos notes à revoir.</span
								>
							</span>
							<!-- prettier-ignore -->
							<span class="interrupteur"><input type="checkbox" id="p-courriels" checked><span class="interrupteur__piste"></span></span>
						</label>
					</div>
					<div>
						<button class="btn btn--destructif" id="fermer-sessions"
							>Fermer toutes les autres sessions</button
						>
					</div>
				</div>
			</div>
		</section>

		<!-- ============ DISTINCTIONS ============ -->
		<section
			class="volet"
			data-volet="distinctions"
			data-actif={onglet === 'distinctions' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<p
				class="etape__sous"
				style="font-family:var(--f-lecture);font-size:var(--t-base);color:var(--c-encre-2);line-height:1.6;margin:0 0 var(--e-5);max-width:64ch"
			>
				Ces distinctions sont les vôtres et ne sont visibles que de vous. Elles ne donnent lieu à
				aucun classement : documenter n'est pas une compétition.
			</p>

			<span class="etiq" style="display:block;margin-bottom:var(--e-3)">Vos contributions</span>
			<!-- prettier-ignore -->
			<div class="stats" id="stats"
				>{#each indicateurs as i (i[1])}<div class="stat"
					><div class="stat__val">{chiffre(i[0])}</div
					><span class="stat__nom">{i[1]}</span
					><span class="stat__sous">{i[2]}</span
				></div>{/each}</div>

			<span class="etiq" style="display:block;margin:var(--e-6) 0 var(--e-3)">Distinctions</span>
			<!--
				Les six sont toujours affichées, obtenues ou non : une zone vide serait
				décourageante là où une progression est une invitation.
			-->
			<!-- prettier-ignore -->
			<div class="distinctions" id="distinctions"
				>{#each jauges as j (j.distinction.id)}<article class="dist" data-obtenue={j.obtenue ? 'oui' : 'non'} aria-label={`${j.distinction.nom}, ${j.distinction.critere}, ${etatDeLaJauge(j)}`}
					><span class="dist__sceau" aria-hidden="true"
						>{#if j.obtenue}<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 8.5l3.5 3.5L13 4.5"/></svg>{:else if j.valeur === null}{RIEN}{:else}{`${Math.min(99, j.part)}%`}{/if}</span
					><div class="dist__nom">{j.distinction.nom}</div
					><div class="dist__critere">{j.distinction.critere}</div
					><div class="dist__jauge"
						><div class="dist__piste"><i style="width:{j.part}%"></i></div
						><div class="dist__chiffre"
							><b>{`${j.valeur === null ? RIEN : nb(Math.min(j.valeur, j.distinction.seuil))} / ${nb(j.distinction.seuil)}`}</b
							><span class="dist__reste">{j.valeur === null ? 'mesure indisponible' : j.obtenue ? 'obtenue' : `encore ${nb(j.distinction.seuil - j.valeur)} ${j.distinction.quoi}`}</span
						></div
					></div
				></article>{/each}</div>
		</section>

		<!-- ============ ACTIVITÉ ============ -->
		<section
			class="volet"
			data-volet="activite"
			data-actif={onglet === 'activite' ? 'oui' : 'non'}
			role="tabpanel"
		>
			<div class="panneau">
				<div class="panneau__tete">
					<span class="etiq">Vos contributions récentes</span>
					<span class="chiffre" id="n-activite">{evenements.length || ''}</span>
				</div>
				<!--
					Encouragement plutôt qu'un vide : c'est le premier écran que voit un
					nouvel arrivant, et il décide s'il contribuera.
				-->
				<!-- prettier-ignore -->
				<div class="panneau__corps" id="activite"
					>{#if evenements.length === 0}<div class="encouragement"
						><h3>Rien à afficher pour l'instant</h3
						><p>Vos contributions apparaîtront ici dès la première. Le plus simple pour commencer : vérifier une note de votre domaine que vous connaissez déjà — cela prend une minute et rend service à tout le monde.</p
						><button class="btn btn--principal" disabled={adresseDesNotesDuProfil === null} onclick={() => voirLesNotesDuDomaine()}>{`Voir les notes de ${profil?.domaine ?? ''}`}</button
					></div>{:else}<ul class="flux"
						>{#each evenements as ev, rang (rang)}<li data-type={ev.type}
							><div class="flux__txt"
								>{GESTES[ev.type] + ' '}{#if ev.cible}<a href={resolve('/notes/[identifiant]', { identifiant: ev.cible })}>{titreDe(ev.cible)}</a>{:else if ev.detail}{`— ${ev.detail}`}{/if}<span class="flux__quand">{relatif(ev.heures)}</span
							></div
						></li>{/each}</ul
					>{/if}</div>
			</div>
		</section>
	{/snippet}
</Coquille>
