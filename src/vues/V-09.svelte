<script lang="ts">
	/**
	 * V-09 — Palette de recherche rapide. AUCUNE ROUTE : la palette est une
	 * superposition, pas une page (`docs/routes.md`, `verif/scenarios/V-09.json`
	 * → `"routes": []`). Ce que la maquette gelée sert est sa PLANCHE D'ÉTATS.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS, ET IL FAUT LE DIRE EN PREMIER
	 *
	 * Il rend six APERÇUS STATIQUES. Aucun raccourci clavier n'est branché,
	 * aucune modalité n'est ouverte, aucun focus n'est piégé ni rendu à son
	 * déclencheur, aucune durée n'est mesurée. `P-09`, `RG-M02-01` et toute
	 * performance de recherche NE SONT PAS TENUES par ce lot. Le tableau
	 * « Règles clavier » de la planche est du TEXTE : il décrit ce que le temps
	 * 3 devra livrer, il ne l'atteste pas.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * NI COQUILLE NI `<main>` — ET C'EST CE QUI DÉCIDE DE LA DÉROGATION K-10
	 *
	 * `docs/releve-vues.md` §5.1 : V-09 est l'une des sept vues sans coquille
	 * (V-01 à V-06, V-09), et la seule dont l'enveloppe soit `div.planche-vue`.
	 * Le seul lien d'évitement est `#etats` « Aller aux états ».
	 *
	 * `docs/dag-phase-1.md` K-10 autorise ce lot, et lui seul, à rouvrir
	 * `src/lib/coquille/` pour monter la palette sur le champ de recherche de
	 * la barre supérieure (`V-37:3714`). LA DÉROGATION N'EST PAS EMPRUNTÉE, et
	 * la vérification est faite avant d'écrire, pas après :
	 *
	 *   • V-09 n'a pas de coquille — sa palette est instanciée dans sa propre
	 *     planche, par `window.creerPalette(hote, opts)` sur six hôtes
	 *     `div.cas__hote.palette-hote` (`V-09:1348`). Rien à monter sur une
	 *     barre que cette vue ne porte pas ;
	 *   • les 30 maquettes qui portent l'hôte de palette hors `div.app` —
	 *     `template#tpl-palette` et `dialog#palette`, forme strictement
	 *     identique — ne lui donnent AUCUNE boîte de rendu. Mesuré par retrait
	 *     sur V-25 et V-33 : instantané ARIA identique, capture identique à
	 *     l'octet (`docs/releve-vues.md` §4.1). La divergence de balisage est
	 *     mesurée nulle ; elle se déclare et ne se rouvre pas ;
	 *   • le montage réel — ouvrir la palette au clic du champ, à Ctrl+K,
	 *     piéger le focus, le rendre au déclencheur — est du COMPORTEMENT, que
	 *     ARB-011 range au temps 3. `docs/releve-vues.md` §8.4 le dit déjà : la
	 *     dérogation K-10 « est mesurée nulle : l'hôte de palette n'a aucune
	 *     incidence », « donc elle peut attendre le temps 3 ».
	 *
	 * Le gabarit reste donc REGELÉ et non rouvert : cinq passages ont eu lieu,
	 * il n'y en a pas de sixième, et les 29 vues conformes ne sont pas
	 * exposées à une preuve de non-régression qu'aucun besoin ne justifie.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * SIX ÉTATS DE ZONE, ET UNE SEULE PAGE — ARB-014
	 *
	 * `verif/scenarios/V-09.json` : `"planche": false`, `"controles": null`,
	 * six états portant chacun `zone: { selecteur: "#etats section.cas",
	 * index: 0…5 }`. `verif/references/protocole-app.json` → `etats_de_zone` →
	 * `V-09` déclare le protocole `page-entiere-zone-isolee` et l'obligation :
	 * « À /__design/V-09?etat=cle, l'application rend la planche des six cas de
	 * la palette, comme la maquette les montre côte à côte. La clé d'état ne
	 * change pas la page : elle nomme le cas que le banc découpera. »
	 *
	 * Ce composant IGNORE donc `etat` : il rend la même page pour les six clés.
	 * VÉRIFIÉ côté référence — les six relevés de DOM de la maquette gelée ont
	 * la même empreinte MD5, au bit près.
	 *
	 * V-09 est aussi la SEULE maquette du dépôt à porter un état « Petit écran
	 * — 360 px » (`V-09:740`, `verif/banc/conditions.mjs:85`). Il n'est pas
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
	 * AUCUNE FOCALISATION N'EST DÉCLARÉE, et il n'en faut aucune :
	 * `docs/releve-vues.md` §6 donne « — » à V-09 dans la colonne
	 * « Focalisation à l'ouverture ». `verif/references/protocole-app.json` →
	 * `focalisations` ne nomme que V-23 et V-06. Rien à demander.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA DURÉE AFFICHÉE — POURQUOI ELLE EST UNE CONSTANTE, ET LAQUELLE
	 *
	 * Le gel écrit `Math.max(0.04, (performance.now() - t0) / 1000 + 0.06)`
	 * (`V-09:1219`), puis `duree.toFixed(2).replace(".", ",")`. La recherche
	 * porte sur quatorze notes : le terme mesuré est de l'ordre de la
	 * microseconde, et l'arrondi à deux décimales rend « 0,06 » — il faudrait
	 * 5 ms de calcul pour atteindre « 0,07 ». VÉRIFIÉ au relevé de DOM, six
	 * cas sur six, et confirmé par l'étalonnage à blanc du banc, qui exige zéro
	 * écart entre deux captures indépendantes du même état.
	 *
	 * `0.06` est donc le TERME CONSTANT DU GEL, recopié comme tel, et non une
	 * valeur illustrative au sens de P-02 : ce qui est calculé — le nombre de
	 * résultats, le compte, la fraîcheur — l'est réellement, à partir de
	 * `seeds/corpus.ts`. Mesurer une durée dans un rendu serveur n'aurait aucun
	 * sens et ne serait pas déterministe ; la mesurer VRAIMENT est le travail du
	 * lot de logique, avec la batterie 13 pour juge.
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
	 * `src/vues/V-09.css`, posé par `node verif/feuilles-de-vue.mjs V-09
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
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
	 * UN TROU D'INSTRUMENT EST RELEVÉ AU PASSAGE, et il est remonté plutôt que
	 * contourné. `ensembleDuGel('V-09')` de `verif/styles-en-ligne.mjs` porte
	 * `max-height:268px` — le littéral de repli — et `max-height:` — la forme
	 * non résolue —, mais PAS `max-height:300px`, que l'extracteur ne voit pas
	 * parce que la valeur vit dans un objet d'options et non dans une
	 * affectation de style. Mesuré des deux façons :
	 *
	 *   style="max-height: {cas.hauteur};"                  → 0 hors du gel
	 *   style="max-height: {…etroit ? '300px' : '268px'};"  → 1 hors du gel
	 *                                                         (max-height:300px)
	 *
	 * La seconde forme dénonce une valeur QUE LE GEL POSE POURTANT. Le calque
	 * est donc gardé — il est la forme prescrite —, et le manque de
	 * l'extracteur est déclaré ici et au rapport de lot, jamais tu.
	 * `verif/**` est en écriture humaine seule : rien n'y est touché.
	 */
	import type { Note } from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { chercher, segmenter } from '$lib/public/recherche';
	import { motFicheMinuscule } from '$lib/vocabulaire';

	interface Proprietes {
		/** Le jeu de semence de la vue — `corpusPourVue('V-09')`, variante « palette ». */
		notes: readonly Note[];
	}

	const { notes: corpus }: Proprietes = $props();

	/**
	 * L'état au repos n'est jamais une zone vide : notes récemment consultées.
	 * Les quatre identifiants sont ceux du gel (`V-09:1066`), résolus dans le
	 * jeu de semence de la vue et non dans un tableau recopié.
	 */
	const RECENTES: readonly string[] = [
		'n-restaurer-pg',
		'n-astreinte',
		'n-pg-prod-01',
		'n-diag-barman'
	];

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

	/** Le terme constant de la durée du gel — voir l'en-tête. */
	const DUREE = '0,06';

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
			const lignes = RECENTES.map((id) => corpus.find((n) => n.id === id)).filter(
				(n): n is Note => n !== undefined
			);
			return {
				groupe: 'Consultées récemment',
				lignes,
				selection: c.selection,
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
			 * d'ailleurs aucun contrôle de droits, et `verif/scenarios/V-09.json`
			 * aucun état de lecture seule. La phrase de `cas__quoi` — « Le bouton
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
				compteur: `0 résultat en ${DUREE} s`
			};
		}

		const lignes = trouves.slice(0, MAX_RESULTATS);
		return {
			groupe: null,
			lignes,
			selection: c.selection,
			bloc: null,
			compteur: `${lignes.length} résultat${lignes.length > 1 ? 's' : ''} en ${DUREE} s`
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
<!-- prettier-ignore -->
{#snippet ligne(n: Note, requete: string, rang: number, selection: number)}<a class="pres" href="#" role="option" data-index={rang} aria-selected={rang === selection} data-sel={rang === selection ? 'oui' : 'non'}><span class="pres__glyphe">{glyphe(n)}</span><span class="pres__corps"><span class="pres__titre">{#each segmenter(n.titre, requete) as s, k (k)}{#if s.marque}<mark>{s.texte}</mark>{:else}{s.texte}{/if}{/each}</span><span class="pres__sous">{@render temoin(n)}<span>{meta(n)}</span>{#if n.operationnel}<span class="past" style="padding: 1px 5px;">Opérationnel</span>{/if}</span></span><span class="pres__entree">↵</span></a>{/snippet}

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
						<div class="palette__liste" role="listbox" aria-label="Résultats" style="max-height: {cas.hauteur};">{#if liste.groupe}<div class="palette__groupe etiq">{liste.groupe}</div>{/if}{#each liste.lignes as n, rang (n.id)}{@render ligne(n, cas.requete, rang, liste.selection)}{/each}{#if liste.bloc}<div class="palette__etat"><p>{liste.bloc.texte}{#if liste.bloc.requete}<span class="palette__requete">{' « ' + liste.bloc.requete + ' »'}</span>{/if}</p>{#if liste.bloc.action}<button class="btn btn--principal">{liste.bloc.action}</button>{/if}</div>{/if}</div>

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
