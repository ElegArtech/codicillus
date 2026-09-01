<script lang="ts">
	/**
	 * V-09 — Palette de recherche rapide. AUCUNE ROUTE : la palette est une
	 * superposition, pas une page (`docs/routes.md`). Ce que la maquette sert est
	 * sa PLANCHE D'ÉTATS, les six côte à côte.
	 *
	 * CE FICHIER EST LA PLANCHE, PAS LA PALETTE VIVANTE. Celle que le produit
	 * monte — ouverture au raccourci et au clic du champ de la barre supérieure,
	 * focus piégé, rendu au déclencheur, résultats bornés au périmètre de
	 * lecture — est `src/lib/coquille/PaletteDeRecherche.svelte`, montée par le
	 * gabarit racine sur toutes les routes en session (`UC-M02-01`). Les deux ne
	 * se doublent pas : cette planche rend six aperçus statiques, elle ne branche
	 * aucun geste.
	 *
	 * NI COQUILLE NI `<main>` : V-09 est l'une des sept vues sans coquille, et la
	 * seule dont l'enveloppe soit `div.planche-vue`. Son unique lien d'évitement
	 * est `#etats`.
	 *
	 * Ce composant IGNORE donc `etat` : il rend la même page pour les six clés.
	 * VÉRIFIÉ côté référence — les six relevés de DOM de la maquette gelée ont
	 * la même empreinte MD5, au bit près.
	 *
	 * V-09 est aussi la SEULE maquette du dépôt à porter un état « Petit écran
	 * — 360 px » (`V-09:740`, `le module de conditions du banc, sa borne de temporisation`). Il n'est pas
	 * obtenu en rétrécissant la fenêtre : la sixième section porte
	 * `class="cas cas--etroit"`, sa feuille contraint `.palette-hote` à 360 px,
	 * et `.palette-hote { container-type: inline-size }` fait réagir la palette
	 * à SON CONTENEUR, pas à la fenêtre — `@container (max-width: 430px)`,
	 * `V-09.css:267`. Les quatre fenêtres d'ARB-009 s'appliquent par-dessus.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES SIX CAS, TELS QUE LA FABRIQUE DU GEL LES INSTANCIE (`V-09:1334`)
	 *
	 *   repos      requête vide,          curseur                → 4 récentes
	 *   unecar     « r »,                 curseur                → invitation
	 *   resultats  « restauration base », curseur, sélection 0    → 7 lignes
	 *   vide       « bascule VoIP »,      curseur                → impasse
	 *   degrade    « sauvegarde »,        curseur, dégradé, sél. 1 → 7 lignes
	 *   etroit     « restauration »,      curseur, sél. 0, 300 px  → 7 lignes
	 *
	 * `opts.statique` vaut vrai pour les six (`V-09:1347`) : la saisie prend
	 * `tabindex="-1"` et `readonly`, la liste reçoit sa hauteur maximale en
	 * style en ligne, et les deux boutons du pied prennent `tabindex="-1"`.
	 * « Un aperçu ne capte ni le focus ni le clavier : il illustre. »
	 *
	 * AUCUNE FOCALISATION N'EST DÉCLARÉE POUR CETTE PLANCHE, et il n'en faut
	 * aucune : `docs/releve-vues.md` §6 lui donne « — » dans la colonne
	 * « Focalisation à l'ouverture ». La palette vivante, elle, prend le focus —
	 * c'est son geste, et il est dans `PaletteDeRecherche.svelte`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA DURÉE N'EST PLUS UNE CONSTANTE, ET L'ARGUMENT QUI LA JUSTIFIAIT EST
	 * CADUC
	 *
	 * Cet en-tête portait `const DUREE = '0,06'` et le défendait ainsi : « le
	 * terme mesuré est de l'ordre de la microseconde », « mesurer une durée dans
	 * un rendu serveur n'aurait aucun sens et ne serait pas déterministe ». Les
	 * deux propositions décrivent une recherche faite DANS LA VUE, sur quatorze
	 * notes du jeu de démonstration.
	 *
	 * LA RECHERCHE DU PRODUIT EST FAITE PAR MEILISEARCH, ET ELLE REND SA DURÉE —
	 * `processingTimeMs`, une mesure serveur, déterministe au sens où elle dit ce
	 * qui s'est vraiment passé. La justification tombe donc : ce qui restait
	 * était un littéral affiché sous une unité de temps, c'est-à-dire une mesure
	 * fabriquée, exactement ce que P-02 proscrit.
	 *
	 * LA DURÉE EST DONC UNE DONNÉE REÇUE, en millisecondes, ou `null`. `null`
	 * VEUT DIRE : AUCUNE MESURE N'EXISTE — et le compteur n'écrit alors pas de
	 * durée du tout, ni constante plausible, ni `0,00 s`. Le nombre de résultats,
	 * lui, reste rendu : il est réellement calculé.
	 *
	 * ELLE EST EXIGÉE, `null` COMPRIS : aucune route ne monte cette vue
	 * aujourd'hui, et celle qui le fera devra DIRE si elle a mesuré quelque
	 * chose. Un défaut aurait remis un littéral en place sans que rien ne
	 * proteste — c'est le motif même que cette campagne retire.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : les résultats, leur nombre et leur
	 * ordre sortent de `chercher()` appliqué à `corpusPourVue('V-09')` —
	 * variante « palette », quatorze notes — par la fabrique partagée
	 * `$lib/public/recherche`, port fidèle de `window.chercher()` et de
	 * `window.surligner()`. AUCUNE SECONDE IMPLÉMENTATION n'est écrite : ni ici,
	 * ni sous `src/lib/recherche/`, que ce lot avait la liberté de créer et qui
	 * n'aurait porté qu'un doublon. C'est la règle de P-01 appliquée à la
	 * recherche comme elle l'est à la fraîcheur.
	 *
	 * LA FRAÎCHEUR VIENT DE LA FABRIQUE UNIQUE (P-01, ADR-005) —
	 * `$lib/fraicheur`. Aucun seuil, aucun libellé, aucun compte de barres n'est
	 * recalculé ici.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : le squelette rend l'ÉTAT,
	 * jamais la transition. `dialog#palette` et `template#tpl-palette` ne sont
	 * pas rendus — la maquette les porte fermé et inerte, incidence mesurée
	 * nulle, et rien ne les ouvre à l'instant capturé.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-09.css`	 * . Les styles en ligne sont ceux du gel (P-6.4).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA HAUTEUR DE LISTE — LE CALQUE DE LA FABRIQUE, ET CE QUE LA MESURE DIT
	 *
	 * Le gel écrit `liste.style.maxHeight = opts.hauteur || "268px"`
	 * (`V-09:1115`) et alimente `opts.hauteur` depuis sa table `CAS`, où seul
	 * le cas `etroit` porte `hauteur: "300px"` (`V-09:1340`). Ce composant
	 * porte LE CALQUE EXACT DE CETTE FABRIQUE — la table `CAS` ci-dessous —
	 * et l'appelle avec les mêmes valeurs : c'est la sortie qu'`ECART-020` É-3
	 * a établie pour les déclarations `‹calculé›` (`docs/releve-vues.md` §7.1).
	 *
	 * La hauteur passe par `cas.hauteur` et non par une expression ternaire
	 * écrite au balisage : la valeur du cas étroit vient de la table, comme dans
	 * la maquette, et ne se recopie nulle part.
	 */
	import type { Note } from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { chercher, segmenter } from '$lib/public/recherche';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	interface Proprietes {
		/** Le jeu de semence de la vue — `corpusPourVue('V-09')`, variante « palette ». */
		notes: readonly Note[];
		/**
		 * LA DURÉE DE LA RECHERCHE, EN MILLISECONDES — une MESURE, ou `null` quand
		 * aucune mesure n'existe. Voir l'en-tête : elle remplace `DUREE = '0,06'`,
		 * un littéral rendu sous une unité de temps. EXIGÉE, `null` compris.
		 */
		dureeMs: number | null;
	}

	const { notes: corpus, dureeMs }: Proprietes = $props();

	/**
	 * LES NOTES « CONSULTÉES RÉCEMMENT » — LA TÊTE DE L'ENSEMBLE REÇU, ET PLUS
	 * QUATRE IDENTIFIANTS DU JEU.
	 *
	 * Cette liste portait `n-restaurer-pg`, `n-astreinte`, `n-pg-prod-01` et
	 * `n-diag-barman` — quatre identifiants littéraux de `seeds/corpus.ts`,
	 * copiés du gel (`V-09:1066`) et résolus dans le corpus reçu. Ils ne se
	 * voyaient pas parce qu'aucune route ne monte encore cette vue : le jour où
	 * une route la monte, la palette au repos nomme le jeu de démonstration sur
	 * l'instance de quelqu'un d'autre, et le paquet de cette route les emporte.
	 *
	 * « Consultées récemment » EST UN ÉTAT, PAS UN JEU DE DONNÉES : la vue ne
	 * connaît aucun historique de consultation, et rien dans ses propriétés ne
	 * lui en donne un. Elle prend donc la tête de l'ensemble qu'on lui passe —
	 * quatre lignes au plus, aucune quand l'ensemble est vide.
	 */
	const NB_RECENTES = 4;
	const RECENTES = $derived(corpus.slice(0, NB_RECENTES));

	/** Le glyphe de type — la table du gel (`V-09:1067`), défaut « NOT ». */
	const GLYPHES: Record<string, string> = {
		Procédure: 'PRO',
		Guide: 'GUI',
		Fiche: 'FIC',
		Note: 'NOT',
		Signet: 'LIE'
	};

	function glyphe(n: Note): string {
		return GLYPHES[n.type] ?? 'NOT';
	}

	/** « · Domaine · Type », le type de fiche accolé quand il y en a un. */
	function meta(n: Note): string {
		return '· ' + n.domaine + ' · ' + (n.typeFiche ? n.type + ' ' + n.typeFiche : n.type);
	}

	/**
	 * LE FRAGMENT « en N s » DU COMPTEUR — VIDE quand aucune durée n'a été
	 * mesurée. Deux décimales et virgule décimale, comme le gel l'écrit.
	 */
	const suffixeDeDuree = $derived(
		dureeMs === null ? '' : ` en ${(dureeMs / 1000).toFixed(2).replace('.', ',')} s`
	);

	/** Sept résultats au plus, dans l'ordre du corpus (`V-09:1231`). */
	const MAX_RESULTATS = 7;

	/** Un cas de la planche, tel que la fabrique statique le produit. */
	interface Cas {
		readonly cle: string;
		readonly num: string;
		readonly nom: string;
		readonly quoi: string;
		readonly requete: string;
		/** La brique de recherche par sens est tombée. */
		readonly degrade: boolean;
		/** Le rang sélectionné, quand la liste en porte un. */
		readonly selection: number;
		/** Hauteur maximale de la liste, en style en ligne — `opts.hauteur`. */
		readonly hauteur: string;
		/** Le cas est contraint à 360 px de large. */
		readonly etroit: boolean;
	}

	/**
	 * Les six cas, dans l'ordre du balisage. Les réglages sont ceux de la table
	 * `CAS` du gel (`V-09:1334`) ; les textes, ceux des six `section.cas`
	 * (`V-09:692` et suivantes).
	 */
	const CAS: readonly Cas[] = [
		{
			cle: 'repos',
			num: 'ÉTAT 01',
			nom: 'Au repos',
			quoi: "Champ vide, à l'ouverture. Les notes récemment consultées tiennent lieu de point de départ : la palette ne s'ouvre jamais sur du blanc. Le premier élément est déjà sélectionné — une frappe sur Entrée suffit à revenir à sa dernière lecture.",
			requete: '',
			degrade: false,
			selection: 0,
			hauteur: '268px',
			etroit: false
		},
		{
			cle: 'unecar',
			num: 'ÉTAT 02',
			nom: 'Un seul caractère',
			quoi: "En dessous de deux caractères, aucun résultat n'est calculé : le bruit serait plus coûteux que l'attente. Le message le dit, plutôt que de laisser croire à une recherche infructueuse.",
			requete: 'r',
			degrade: false,
			selection: 0,
			hauteur: '268px',
			etroit: false
		},
		{
			cle: 'resultats',
			num: 'ÉTAT 03',
			nom: 'Résultats',
			quoi: "Dès le deuxième caractère, affinés au fil de la frappe. Ligne compacte : type, titre avec les termes mis en évidence, signal de fraîcheur, domaine. Un résultat trouvé dans le registre opérationnel le signale — l'ouverture se fera sur ce registre.",
			requete: 'restauration base',
			degrade: false,
			selection: 0,
			hauteur: '268px',
			etroit: false
		},
		{
			cle: 'vide',
			num: 'ÉTAT 04',
			nom: 'Aucun résultat',
			quoi: "La requête est reprise entre guillemets et la création prend la place du message d'échec. Comme en V-08, l'impasse devient une contribution. Le bouton disparaît pour un lecteur sans droit d'écriture.",
			requete: 'bascule VoIP',
			degrade: false,
			selection: 0,
			hauteur: '268px',
			etroit: false
		},
		{
			cle: 'degrade',
			num: 'ÉTAT 05',
			nom: 'Recherche par sens indisponible',
			quoi: 'La brique optionnelle est tombée. La palette bascule en mots-clés et le dit, sans interrompre la frappe ni vider la liste. La recherche ne tombe jamais en panne.',
			requete: 'sauvegarde',
			degrade: true,
			selection: 1,
			hauteur: '268px',
			etroit: false
		},
		{
			cle: 'etroit',
			num: 'ÉTAT 06',
			nom: 'Petit écran — 360 px',
			quoi: "La palette occupe la quasi-totalité de l'écran et gagne un bouton de fermeture explicite : le raccourci d'échappement n'existe pas au doigt. Les rappels de raccourcis cèdent la place, la durée du signal de fraîcheur se réduit à la jauge.",
			requete: 'restauration',
			degrade: false,
			selection: 0,
			hauteur: '300px',
			etroit: true
		}
	];

	/* ═════════════════════════════════════════════════════════════════════
	   LE RENDU D'UNE LISTE — le calque de `rendre()` du gel (`V-09:1188`),
	   réduit à ce qu'un état montre. Trois branches, dans l'ordre exact du
	   gel, parce que l'ordre décide :

	     1. requête vide     → le groupe « Consultées récemment » et quatre
	                           lignes, rang sélectionné = `opts.selection ?? 0`,
	                           compteur VIDE ;
	     2. moins de deux    → une invitation à continuer, AUCUNE ligne, AUCUN
	        caractères         rang sélectionné, compteur VIDE ;
	     3. sinon            → `chercher(q)`, tronqué à sept. Zéro résultat :
	                           l'impasse et sa création. Sinon les lignes, rang
	                           sélectionné = `opts.selection ?? 0`.

	   Le compteur n'est écrit que dans la troisième branche, et il annonce le
	   nombre APRÈS troncature — c'est ce que le gel écrit, `resultats.length`
	   étant réaffecté avant la lecture.
	   ═════════════════════════════════════════════════════════════════════ */

	interface Liste {
		/** Le groupe « Consultées récemment », seulement au repos. */
		readonly groupe: string | null;
		readonly lignes: readonly Note[];
		/** Le rang sélectionné, ou −1 quand la liste n'en porte aucun. */
		readonly selection: number;
		/** Le bloc d'état — invitation ou impasse — quand il y en a un. */
		readonly bloc: {
			readonly texte: string;
			readonly requete: string;
			readonly action: string;
		} | null;
		readonly compteur: string;
	}

	function listeDe(c: Cas): Liste {
		const q = c.requete.trim();

		if (!q) {
			/* Pas de lignes, pas de titre de groupe : un intitulé au-dessus du
			   vide annoncerait une liste qui n'existe pas. */
			return {
				groupe: RECENTES.length > 0 ? 'Consultées récemment' : null,
				lignes: RECENTES,
				selection: RECENTES.length > 0 ? c.selection : -1,
				bloc: null,
				compteur: ''
			};
		}

		if (q.length < 2) {
			return {
				groupe: null,
				lignes: [],
				selection: -1,
				bloc: {
					texte: 'Continuez à taper — les résultats apparaissent dès le deuxième caractère.',
					requete: '',
					action: ''
				},
				compteur: ''
			};
		}

		const trouves = chercher(corpus, q);
		if (!trouves.length) {
			/*
			 * LE BOUTON DE CRÉATION EST TOUJOURS RENDU, ET C'EST LE GEL. Le gel
			 * le retire quand `window.DROITS_LECTURE` est vrai (`V-09:1226`) ;
			 * V-09 ne pose JAMAIS cette globale — `grep DROITS_LECTURE` ne la
			 * trouve qu'à cette lecture, jamais en écriture. La planche n'a
			 * d'ailleurs aucun contrôle de droits, et sa planche aucun état de
			 * lecture seule. La phrase de `cas__quoi` — « Le bouton
			 * disparaît pour un lecteur sans droit d'écriture » — décrit donc une
			 * règle qu'AUCUN ÉTAT N'EXERCE : elle relève de P-09, que ce lot ne
			 * déclare pas tenue. Rendre le bouton conditionnel ici serait rendre
			 * ce que la maquette ne rend pas.
			 */
			return {
				groupe: null,
				lignes: [],
				selection: -1,
				bloc: { texte: 'Aucun résultat pour', requete: q, action: 'Créer cette note' },
				compteur: `0 résultat${suffixeDeDuree}`
			};
		}

		const lignes = trouves.slice(0, MAX_RESULTATS);
		return {
			groupe: null,
			lignes,
			selection: c.selection,
			bloc: null,
			compteur: `${lignes.length} ${accord(lignes.length, 'résultat')}${suffixeDeDuree}`
		};
	}

	const listes = $derived(CAS.map((c) => ({ cas: c, liste: listeDe(c) })));
</script>

<!--
	Le témoin de fraîcheur — la fabrique unique de `$lib/fraicheur` (P-01). Le
	libellé accompagne TOUJOURS la jauge ; c'est la feuille de la vue qui le
	masque sous 430 px de conteneur, pas le balisage (RG-M18-09).
-->
<!-- prettier-ignore -->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"><span class="temoin__jauge" aria-hidden="true">{#each [0, 1, 2] as rang (rang)}<i class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}</span><span class="temoin__txt">{libelleFraicheur(n)}</span></span>{/snippet}

<!--
	AUCUN BLANC ENTRE LES NŒUDS DE LA LIGNE, et il doit le rester : le relevé
	d'ordre de tabulation du niveau 1 construit le nom accessible sur
	`textContent`, où un blanc inséré par le formateur se voit (CLAUDE.md §6,
	P-6). Le bloc est protégé du formateur ; ne jamais citer la forme exacte de
	la directive à l'intérieur d'un commentaire (P-9).

	Les termes de la requête sont mis en évidence par `segmenter()`, qui rend
	des segments que Svelte échappe : aucun balisage issu de la saisie n'est
	injecté, exactement comme `window.surligner()` l'obtient en construisant
	des nœuds de texte.
-->
<!--
	`svelte/no-navigation-without-resolve` est levée sur la ligne de résultat, et
	pour la raison de V-26 : l'adresse vient de `adresseDeNote()`, la fabrique
	unique du rangement. La règle inspecte l'expression du `href` et ne peut pas
	la suivre jusque-là ; la faire repasser par `resolve()` ajouterait une
	seconde source de vérité à une forme qui n'en a qu'une.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- prettier-ignore -->
{#snippet ligne(n: Note, requete: string, rang: number, selection: number)}<a class="pres" href={adresseDeNote(n.id)} role="option" data-index={rang} aria-selected={rang === selection} data-sel={rang === selection ? 'oui' : 'non'}><span class="pres__glyphe">{glyphe(n)}</span><span class="pres__corps"><span class="pres__titre">{#each segmenter(n.titre, requete) as s, k (k)}{#if s.marque}<mark>{s.texte}</mark>{:else}{s.texte}{/if}{/each}</span><span class="pres__sous">{@render temoin(n)}<span>{meta(n)}</span>{#if n.operationnel}<span class="past" style="padding: 1px 5px;">Opérationnel</span>{/if}</span></span><span class="pres__entree">↵</span></a>{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<a class="saut-contenu" href="#etats">Aller aux états</a>

<div class="planche-vue">
	<header class="tete-planche">
		<span class="etiq">V-09 · Palette de recherche rapide</span>
		<h1>Chercher sans quitter sa page</h1>
		<p>
			Le geste le plus fréquent du produit. La palette se superpose à n'importe quelle vue, se
			pilote entièrement au clavier, et n'affiche jamais une zone vide. Les six états ci-dessous
			sont produits par le même composant que celui embarqué dans V-08 et V-14 — ce ne sont pas des
			reproductions.
		</p>
		<!-- prettier-ignore -->
		<button class="btn btn--principal" id="demo">Ouvrir la palette ici <kbd class="touche" style="margin-left:4px">Ctrl</kbd><kbd class="touche">K</kbd></button>
		<span style="font-size:var(--t-petit);color:var(--c-encre-3)"
			>Le raccourci fonctionne aussi depuis n'importe quel endroit de cette page.</span
		>
	</header>

	<div class="grille-etats" id="etats">
		{#each listes as { cas, liste } (cas.cle)}
			<section class="cas{cas.etroit ? ' cas--etroit' : ''}">
				<div class="cas__tete">
					<div class="cas__num">{cas.num}</div>
					<div class="cas__nom">{cas.nom}</div>
					<p class="cas__quoi">{cas.quoi}</p>
				</div>
				<div class="cas__hote palette-hote" data-cas={cas.cle}>
					<div
						class="palette__boite"
						data-degrade={cas.degrade ? 'oui' : undefined}
						data-curseur="oui"
					>
						<div class="palette__champ">
							<svg
								width="18"
								height="18"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
							>
							<input
								class="palette__saisie"
								type="search"
								autocomplete="off"
								spellcheck="false"
								value={cas.requete}
								placeholder="Chercher une note, une {motFicheMinuscule}, un signet…"
								role="combobox"
								aria-controls="palette-liste-{cas.cle}"
								aria-expanded="true"
								aria-label="Recherche rapide"
								tabindex="-1"
								readonly
							/>
							<span class="palette__curseur" aria-hidden="true"></span>
							<button
								class="palette__effacer"
								aria-label="Effacer la recherche"
								hidden={cas.requete === ''}
							>
								<svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
								>
							</button>
							<button class="btn btn--discret palette__fermer" tabindex="-1">Fermer</button>
						</div>

						<div class="palette__degrade">
							<svg
								width="13"
								height="13"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								><path d="M8 5.5v3.5M8 11.2v.3" /><circle cx="8" cy="8" r="6" /></svg
							>
							Recherche par sens indisponible — résultats en mots-clés
						</div>

						<!-- prettier-ignore -->
						<div class="palette__liste" id="palette-liste-{cas.cle}" role="listbox" aria-label="Résultats" style="max-height: {cas.hauteur};">{#if liste.groupe}<div class="palette__groupe etiq">{liste.groupe}</div>{/if}{#each liste.lignes as n, rang (n.id)}{@render ligne(n, cas.requete, rang, liste.selection)}{/each}{#if liste.bloc}<div class="palette__etat"><p>{liste.bloc.texte}{#if liste.bloc.requete}<span class="palette__requete">{' « ' + liste.bloc.requete + ' »'}</span>{/if}</p>{#if liste.bloc.action}<button class="btn btn--principal">{liste.bloc.action}</button>{/if}</div>{/if}</div>

						<div class="palette__pied">
							<!-- prettier-ignore -->
							<div class="palette__aides">
								<span class="palette__aide"><kbd class="touche">↑</kbd><kbd class="touche">↓</kbd> Parcourir</span>
								<span class="palette__aide"><kbd class="touche">Entrée</kbd> Ouvrir</span>
								<span class="palette__aide"><kbd class="touche">Échap</kbd> Effacer puis fermer</span>
							</div>
							<div class="palette__droite">
								<span class="palette__compteur">{liste.compteur}</span>
								<button class="palette__tous" tabindex="-1">Voir tous les résultats</button>
							</div>
						</div>
					</div>
				</div>
			</section>
		{/each}
	</div>

	<section class="clavier">
		<span class="etiq">Règles clavier — identiques à V-08</span>
		<div class="panneau" style="margin-top:var(--e-2)">
			<table>
				<thead><tr><th>Touche</th><th>Effet</th></tr></thead>
				<tbody>
					<!-- prettier-ignore -->
					<tr><td><kbd class="touche">Ctrl</kbd> <kbd class="touche">K</kbd></td><td>Ouvre la palette. Un second appui replace le focus dans le champ sans refermer.</td></tr>
					<!-- prettier-ignore -->
					<tr><td><kbd class="touche">↑</kbd> <kbd class="touche">↓</kbd></td><td>Parcourent les résultats. La navigation boucle : après le dernier, retour au premier.</td></tr>
					<!-- prettier-ignore -->
					<tr><td><kbd class="touche">Entrée</kbd></td><td>Ouvre le résultat sélectionné.</td></tr>
					<!-- prettier-ignore -->
					<tr><td><kbd class="touche">Échap</kbd></td><td>Efface la requête. Sur un champ déjà vide, ferme et rend le focus au déclencheur.</td></tr>
					<!-- prettier-ignore -->
					<tr><td>Clic hors de la boîte</td><td>Ferme.</td></tr>
				</tbody>
			</table>
		</div>
	</section>
</div>

<!-- Rendu vide : la référence le montre vide sur les six cas (ARB-011). -->
<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
