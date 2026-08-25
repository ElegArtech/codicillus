<script lang="ts">
	/**
	 * V-03 — Lecture publique d'un guide. Route `/guides/{identifiant}`.
	 *
	 * SERVIE TELLE QUELLE À UN UTILISATEUR CONNECTÉ — ARB-007, A-05, repris à
	 * `docs/routes.md` §3.1 : « Une seule adresse, un seul rendu : la session ne
	 * change ni la route, ni la vue, ni les états. » Pas de redirection vers
	 * `/notes/{identifiant}`, pas de bandeau « vue publique ». Le motif est
	 * double — la vérification « voir ce que voit le public » avant publication
	 * est un usage réel, et toute autre option créerait soit une seconde adresse
	 * sans canonique, soit un état qu'aucune planche ne déclare, donc hors du
	 * protocole de comparaison. Ce composant n'a par conséquent AUCUNE branche
	 * de session, et c'est délibéré.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PÉRIMÈTRE PUBLIC — RG-M17-01
	 *
	 * `V-03:1519` : « Contrainte absolue — périmètre public, comme en V-01 et
	 * V-02. » Le corpus est réduit au point d'entrée de la vue. V-03 est dans
	 * `VUES_A_PERIMETRE_PUBLIC` de `seeds/corpus.ts`, au même titre que V-01,
	 * V-02 et V-04.
	 *
	 * Le guide rendu est une PAGE ÉCRITE de la maquette, pas une note du corpus :
	 * son texte, son schéma et son tableau sont dans le gel et nulle part
	 * ailleurs. Ils sont donc portés tels quels. Le seul lien vers une ressource
	 * non publique est rendu NON CLIQUABLE et NE RÉVÈLE PAS le titre de sa cible
	 * (`span.lien-prive`) — c'est la forme que le gel donne à RG-M17-01 dans le
	 * corps d'un guide, et le commentaire du gel le dit : « il n'y a donc rien à
	 * brancher ici ».
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE.
	 * L'étanchéité réelle est la batterie 6 (`pnpm test:etancheite`, livrée par T-012b).
	 * Ni `RG-ACC-01`, ni `RG-ACC-04`, ni `P-09` ne sont déclarées tenues.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * `data-numerote="non"` — ÉCART DÉCLARÉ, NON COMBLÉ
	 *
	 * V-03 est la SEULE maquette du dépôt qui pose l'attribut à l'endroit où la
	 * règle le lit : `<body data-numerote="non">` (`V-03:912`), lu par
	 * `body[data-numerote="non"] .prose h2::before { content: none }`
	 * (`V-03.css:438`). Les cinq autres maquettes qui le portent le posent sur
	 * `div.app#app`, où aucune règle ne le lit (`docs/releve-vues.md` §7.7).
	 *
	 * AUCUN CHEMIN N'EXISTE POUR LE POSER. Le mode démo compose le document
	 * lui-même — `<body>${rendu.body}</body>` (le module de service du banc) — et
	 * ne transmet aucun attribut de corps ; Svelte refuse tout attribut sur
	 * `<svelte:body>` (`svelte_body_illegal_attribute`, vérifié dans le
	 * compilateur embarqué) ; `<svelte:head>` ne touche pas au corps. Le poser
	 * sur `div.app` « corrigerait » le gel et ne changerait rien, la règle visant
	 * `body`.
	 *
	 * Conséquence MESURÉE et non masquée : la numérotation de section s'affiche
	 * côté application là où la référence la supprime. Le lot ne comble pas, ne
	 * s'accorde aucune tolérance et ne modifie pas l'instrument : l'écart est
	 * remonté, chiffré, au rapport du lot, et relève du niveau 3 — arbitré par un
	 * tiers, jamais par l'exécutant (ARB-018).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE, QUATRE FENÊTRES, AUCUN COMPORTEMENT
	 *
	 * `docs/releve-vues.md` §5.1 : V-01 à V-06 et V-09 n'en portent pas. V-03 est
	 * contrôlée sur quatre fenêtres (ARB-009, RG-M18-13, cas d'usage « lire ») :
	 * quatre états × quatre fenêtres = 16 couples.
	 *
	 * ARB-011 — le squelette rend l'ÉTAT, jamais la transition. La bascule de
	 * registre, le suivi de lecture au défilement, le dépliage du sommaire sur
	 * petit écran et l'agrandissement du schéma sont du comportement (T-017).
	 * `dialog.loupe`, fermé, n'est pas rendu : mesuré SANS AUCUNE INCIDENCE —
	 * instantané ARIA identique, capture identique à l'octet
	 * (`docs/releve-vues.md` §4.1). Le bouton d'impression perd son `onclick`
	 * en ligne, que Svelte ne sait pas émettre comme attribut littéral : sans
	 * effet sur le rendu, l'impression relève de RG-M18-17 et de la batterie 15.
	 *
	 * LES ADRESSES DU GEL SONT DÉSORMAIS DE VRAIES ADRESSES. `ARB-013` retire les
	 * lignes `/url:` de la comparaison de structure précisément pour que le
	 * produit porte SES adresses ; la campagne de câblage du 21/08/2026 lève la
	 * réserve qui les avait laissées à `#`, et c'est la seule modification
	 * qu'elle autorise dans une vue. Elles passent toutes par `resolve()`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-03.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-03 --installer`. Les `style=` reproduits
	 * figurent tous à l'ensemble clos du gel (ARB-016).
	 */
	import { resolve } from '$app/paths';
	import type { NiveauFraicheur } from '../../seeds/corpus';
	import { temoinFraicheur } from '$lib/fraicheur';

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES — `svelte/no-navigation-without-resolve`
	 * inspecte l'EXPRESSION du `href`. Même écriture qu'à `V-07:455`.
	 */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	/**
	 * LES DEUX GUIDES QUE LE CORPS GELÉ CITE, ET LEUR IDENTIFIANT EN BASE.
	 *
	 * Ces deux liens ne vivent que dans l'article ÉCRIT de la maquette — la
	 * branche `guide === null`, que la route n'emprunte jamais puisqu'elle passe
	 * toujours la note demandée. Ils restent atteignables en rendu direct du
	 * composant, et les deux notes existent, publiques et publiées, sous ces
	 * titres exacts (`seeds/corpus.ts`) : les faire pointer là où elles sont est
	 * plus juste que de les laisser inertes.
	 */
	const GUIDE_DEMANDER_ACCES = 'n-demander-acces';
	const GUIDE_SIGNALER_INCIDENT = 'n-signaler-incident';

	/**
	 * UNE ENTRÉE DE SOMMAIRE — les titres de niveau 2 du corps affiché.
	 * `body[data-numerote="non"]` retire la numérotation : aucun numéro n'est
	 * porté, ici comme au gel.
	 */
	interface EntreeDeSommaire {
		readonly ancre: string;
		readonly titre: string;
	}

	/** Une pièce jointe telle que le panneau la rend — trois champs, pas un de plus. */
	interface PieceAffichee {
		readonly nom: string;
		/** La marque du format, en capitales : « PDF », « DOCX ». */
		readonly marque: string;
		/** La taille en toutes lettres, telle que le gel l'écrit : « 320 Ko ». */
		readonly taille: string;
		readonly adresse: string;
	}

	/**
	 * LE GUIDE DEMANDÉ — la note que l'adresse désigne, et ses deux corps DÉJÀ
	 * RENDUS par `rendreDocument`, l'implémentation unique (`ADR-004`).
	 *
	 * La vue ne convertit rien : elle reçoit du HTML et le pose, exactement comme
	 * `NoteDeDemonstration.svelte` le fait pour V-14 depuis `T-042`. Un document
	 * canonique rendu ici serait le second chemin que l'ADR interdit.
	 */
	interface GuideAffiche {
		readonly titre: string;
		/** Le type de la note — la pastille de type du sur-titre. */
		readonly type: string;
		readonly domaine: string;
		readonly adresseDuDomaine: string;
		readonly auteur: string;
		/** La modification, en toutes lettres et en forme machine. */
		readonly modifieLe: string;
		readonly modifieIso: string;
		readonly fraicheur: NiveauFraicheur;
		readonly jours: number;
		/** La date du dernier contrôle. `null` : la note n'a jamais été vérifiée. */
		readonly controleLe: string | null;
		readonly controleIso: string | null;
		readonly reference: string;
		readonly operationnel: string | null;
		readonly sommaire: readonly EntreeDeSommaire[];
		readonly piecesJointes: readonly PieceAffichee[];
	}

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/**
		 * LE GUIDE RÉELLEMENT DEMANDÉ. Absente, la vue rend le guide écrit dans la
		 * maquette gelée — son texte, son schéma et son tableau sont dans le gel et
		 * nulle part ailleurs, et c'est ce que les quatre états de la planche
		 * montrent. Fournie par le chargeur de `/guides/{identifiant}`, elle
		 * l'emporte : l'écran cesse alors d'afficher une page écrite et affiche la
		 * note que l'adresse désigne.
		 *
		 * LES DEUX AXES DE LA PLANCHE DÉCRIVENT LA NOTE AFFICHÉE — fraîcheur du
		 * cartouche, présence du registre « En bref ». Quand un guide est fourni,
		 * ils viennent donc de LUI et non du vecteur : peindre les attributs d'une
		 * note sur le corps d'une autre est la valeur illustrative que `P-02`
		 * proscrit.
		 *
		 * ELLE EST EXIGÉE, `null` COMPRIS : la seule route qui monte cette vue la
		 * passe toujours, et une route qui l'oublierait ne compile plus.
		 */
		guide: GuideAffiche | null;
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` par le chargeur de la route, qui la passe TOUJOURS : la
		 * propriété est EXIGÉE, et le jeu de démonstration ne peut plus tenir lieu
		 * de défaut. Vide, l'appel à l'assistance n'est pas ÉMIS.
		 */
		portail: string;
	}

	const { vecteur, guide, portail }: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');

	const reglage = $derived(vecteur ?? {});
	/** Un corps « En bref » existe-t-il ? Sinon le sélecteur de registre disparaît. */
	const registreExiste = $derived(
		guide === null ? reglage['c-op'] !== false : guide.operationnel !== null
	);

	/**
	 * LES TROIS ÉTATS DU CARTOUCHE — leur DATE DE CONTRÔLE, et elle seule.
	 *
	 * Le gel commute le cartouche sur une table de trois entrées portant chacune
	 * un nombre de barres et un texte (`V-03:1665-1681`). Ces deux valeurs sont
	 * la SORTIE du calcul de fraîcheur : les transcrire ici est une seconde
	 * définition — ADR-005 interdit nommément « tout libellé de fraîcheur
	 * construit localement », et c'est ce que cette vue faisait avant T-013c.
	 *
	 * Ce qui est DONNÉE, et que rien ne calcule, c'est la date de contrôle. Le
	 * gel l'écrit trois fois, dans le `<time>` du détail ci-dessous, et c'est
	 * elle — elle seule — qui est portée ici. L'ancienneté s'en déduit contre LA
	 * VRAIE DATE : elle se déduisait contre `DATE_REFERENCE`, l'horloge gelée du
	 * jeu de démonstration, si bien qu'un écran servi en 2027 aurait annoncé une
	 * ancienneté calculée depuis le 13 août 2026. Ce calcul ne sert qu'au rendu
	 * sans guide ; le guide fourni porte son ancienneté lui-même.
	 *
	 * Les trois libellés que la fabrique en tire sont, à la lettre, les trois du
	 * gel — c'est ce qui rend cette réparation possible à pixel constant :
	 *   11 j  → « Vérifié il y a 11 jours »  (frais, moins de 31 jours)
	 *   155 j → « Vérifié il y a 5 mois »    (arrondi au mois)
	 *   280 j → « Pas revu depuis 9 mois »   (l'obsolète change de verbe)
	 *
	 * Le DÉTAIL du cartouche, lui, reste écrit : c'est de la prose datée, pas un
	 * libellé de fraîcheur. Le niveau « frais » est celui du balisage statique —
	 * la planche ne le reconstruit pas, il porte donc ses apostrophes droites ;
	 * les deux autres viennent du script du gel, qui écrit `&rsquo;`.
	 */
	const CONTROLE: Record<NiveauFraicheur, string> = {
		frais: '2026-08-02',
		vieil: '2026-03-11',
		obs: '2025-11-06'
	};

	/**
	 * LE MARQUEUR D'UNE DONNÉE QUI N'EXISTE PAS — `P-02`. Le gel l'emploie
	 * lui-même pour une valeur qu'il n'a pas encore (`V-24:1287`).
	 */
	const RIEN = '—';

	/**
	 * LES TROIS DATES DE CONTRÔLE EN TOUTES LETTRES, telles que le gel les écrit
	 * dans le `<time>` de son détail. Elles vont par paire avec `CONTROLE` : la
	 * forme machine y est, la forme humaine ici, et aucune n'est dérivée de
	 * l'autre — le gel les écrit toutes les deux.
	 */
	const DATES_DE_CONTROLE: Record<NiveauFraicheur, string> = {
		frais: '2 août 2026',
		vieil: '11 mars 2026',
		obs: '6 novembre 2025'
	};

	/** Jours écoulés entre une date de contrôle et maintenant. */
	function depuis(date: string): number {
		return Math.round((Date.now() - Date.parse(date)) / 86_400_000);
	}

	/** Fraîcheur affichée par le cartouche de contrôle. */
	const niveau = $derived<NiveauFraicheur>(
		guide !== null
			? guide.fraicheur
			: typeof reglage['fr'] === 'string' && reglage['fr'] in CONTROLE
				? (reglage['fr'] as NiveauFraicheur)
				: 'frais'
	);

	/**
	 * LE TÉMOIN DU CARTOUCHE, de la fabrique unique : la jauge et la valeur en
	 * clair sortent ensemble du même calcul (P-01, ADR-005).
	 *
	 * L'ANCIENNETÉ VIENT DE LA NOTE quand une note est affichée, et de l'horloge
	 * gelée du corpus sinon — sans quoi le libellé relatif ne serait pas
	 * reproductible des deux côtés de la comparaison.
	 */
	const temoin = $derived(
		temoinFraicheur({
			fraicheur: niveau,
			jours: guide !== null ? guide.jours : depuis(CONTROLE[niveau])
		})
	);

	/** La date de contrôle affichée par le détail du cartouche. */
	const controle = $derived(guide === null ? CONTROLE[niveau] : guide.controleIso);
	const controleEnClair = $derived(
		guide === null ? DATES_DE_CONTROLE[niveau] : (guide.controleLe ?? RIEN)
	);

	/**
	 * Le sommaire, construit sur les titres de niveau 2 du corps Référence —
	 * `construireSommaire()` du gel. `body[data-numerote="non"]` retire la
	 * numérotation : aucun `span.sommaire__num` n'est rendu, ce que la référence
	 * confirme état par état.
	 */
	const SOMMAIRE_DU_GEL: readonly EntreeDeSommaire[] = [
		{ ancre: 's-portail', titre: 'Depuis le portail, sur votre poste' },
		{ ancre: 's-verrouille', titre: "Depuis l'écran de connexion, poste verrouillé" },
		{ ancre: 's-deplacement', titre: 'En déplacement, sans accès au réseau interne' },
		{ ancre: 's-regles', titre: 'Ce que doit contenir le nouveau mot de passe' },
		{ ancre: 's-particuliers', titre: 'Cas particuliers' }
	];

	const SOMMAIRE = $derived(guide === null ? SOMMAIRE_DU_GEL : guide.sommaire);
</script>

<!--
	DEUX RÈGLES D'ESLINT SONT LEVÉES POUR CETTE VUE, ET CHACUNE A SON MOTIF.

	`svelte/no-navigation-without-resolve` — les trois adresses calculées de cet
	écran sont celle du domaine et celles des pièces jointes, bâties par
	`$lib/rangement/adresses`, le constructeur unique (`ARB-001`, « seule forme
	publiée »). `resolve()` n'accepte qu'un chemin connu à la compilation : il ne
	peut pas les prendre. Les adresses littérales du gel, elles, restent `#`.

	`svelte/no-at-html-tags` — les deux corps rendus viennent de
	`rendreDocument`, l'implémentation unique, dont le texte est échappé par
	`echapper()` (`ADR-003` : « le texte d'un document est du TEXTE ; il ne
	devient jamais du balisage »). C'est le motif exact de `V-18` et de
	`NoteDeDemonstration.svelte`, qui posent la même levée.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve, svelte/no-at-html-tags -->
<a class="saut-contenu" href="#article">Aller au contenu</a>

<div class="public app" id="app" data-registre="reference">
	<header class="chapeau">
		<a class="marque" href={resolve('/')} aria-label="Codicillus — accueil public">
			<span class="marque__sceau" aria-hidden="true">C</span>
			<span class="marque__nom">Codicillus</span>
		</a>
		<!-- Accès connexion : discret, pour les personnes qui ont déjà un compte. -->
		<a class="btn btn--discret" href={resolve('/connexion')}>Se connecter</a>
	</header>

	<nav class="fil-pub" aria-label="Fil d'Ariane">
		<a href={resolve('/')}>Accueil</a><span>›</span><a
			href={guide?.adresseDuDomaine ?? resolve('/')}>{guide?.domaine ?? 'Poste de travail'}</a
		><span>›</span><a href={resolve('/recherche')}>Guides</a>
	</nav>

	<main class="lecture-pub">
		<!-- ---------- Sommaire ---------- -->
		<nav class="sommaire" aria-label="Sommaire du guide" data-ouvert="non">
			<div class="etiq">Sommaire</div>
			<button class="sommaire__bascule" id="bascule-sommaire" aria-expanded="false">
				Sommaire
				<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
					><path d="M3 1l4 4-4 4z" /></svg
				>
			</button>
			<ul class="sommaire__liste" id="sommaire">
				{#each SOMMAIRE as s (s.ancre)}<li class="n1">
						<a href="#{s.ancre}"><span>{s.titre}</span></a>
					</li>{/each}
			</ul>
		</nav>

		<!-- ---------- Article ---------- -->
		<article class="article" id="article">
			<header class="entete">
				<div class="entete__sur">
					<span class="past past--type">{guide?.type ?? 'Guide'}</span>
					<span class="past">{guide?.domaine ?? 'Poste de travail'}</span>
				</div>

				<h1 class="titre-note">{guide?.titre ?? 'Réinitialiser son mot de passe'}</h1>

				<!--
					Cartouche de contrôle : le signal de fraîcheur est conservé en lecture
					publique, sans aucune action attachée.
				-->
				<div class="cartouche cartouche--lecture" data-niveau={niveau}>
					<div class="cartouche__bloc">
						<span class="temoin__jauge" aria-hidden="true"
							>{#each [0, 1, 2] as rang (rang)}<i class={rang < temoin.barres ? 'plein' : ''}
								></i>{/each}</span
						>
						<div>
							<div class="cartouche__valeur">{temoin.libelle}</div>
							<div class="cartouche__detail">
								{#if niveau === 'frais'}Ce guide a été contrôlé le <time
										datetime={controle ?? undefined}
										title={controleEnClair}>{controleEnClair}</time
									> par l'équipe qui l'a écrit.{:else if niveau === 'vieil'}Ce guide a été contrôlé
									le
									<time datetime={controle ?? undefined} title={controleEnClair}
										>{controleEnClair}</time
									>. Son contenu peut avoir changé depuis.{:else}Dernier contrôle le <time
										datetime={controle ?? undefined}
										title={controleEnClair}>{controleEnClair}</time
									>. <strong>Vérifiez auprès de l’assistance avant de vous y fier.</strong>{/if}
							</div>
						</div>
					</div>
				</div>

				<dl class="meta">
					<dt>Rédaction</dt>
					<dd>
						{(guide?.auteur ?? 'Sophie Nguyen') + ' · modifié '}<time
							datetime={guide?.modifieIso ?? '2026-07-29'}
							title={guide?.modifieLe ?? '29 juillet 2026 à 10:12'}
							>{guide?.modifieLe ?? 'il y a 2 semaines'}</time
						>
					</dd>
					<dt>Domaine</dt>
					<dd>
						<a href={guide?.adresseDuDomaine ?? '#'}>{guide?.domaine ?? 'Poste de travail'}</a>
					</dd>
				</dl>
			</header>

			<!-- Sélecteur de registre : présent lorsqu'un corps Opérationnel existe. -->
			<div
				class="registre"
				id="registre"
				role="tablist"
				aria-label="Registre de lecture"
				hidden={!registreExiste}
			>
				<button role="tab" aria-selected="true" data-reg="reference"
					><span class="registre__pt"></span>Guide complet</button
				>
				<button role="tab" aria-selected="false" data-reg="operationnel"
					><span class="registre__pt"></span>En bref</button
				>
			</div>

			<!-- ================= REGISTRE RÉFÉRENCE ================= -->
			<div class="prose" id="corps-reference">
				{#if guide !== null}{@html guide.reference}{:else}
					<p>
						Votre mot de passe expire tous les six mois, et il peut être réinitialisé à tout moment.
						Trois chemins existent selon l'endroit où vous êtes et l'état de votre poste. <strong
							>Aucun d'eux ne nécessite d'appeler le support</strong
						>, sauf le dernier cas décrit plus bas.
					</p>

					<div class="alerte alerte--attention">
						<div>
							<div class="alerte__tete">
								<span class="alerte__glyphe">ATTENTION</span> Personne ne vous demandera jamais votre
								mot de passe
							</div>
							<div>
								Ni par téléphone, ni par courriel, ni par message. Aucun agent du support, aucun
								responsable. Un message qui vous le demande est une tentative d'hameçonnage :
								signalez-le sans y répondre.
							</div>
						</div>
					</div>

					<h2 id="s-portail">Depuis le portail, sur votre poste</h2>
					<p>
						C'est le cas courant : vous êtes connecté et vous voulez changer votre mot de passe
						avant qu'il n'expire.
					</p>
					<ol>
						<li>Ouvrez le portail interne et allez dans <strong>Mon compte</strong>.</li>
						<li>Choisissez <strong>Changer mon mot de passe</strong>.</li>
						<li>Saisissez l'ancien, puis le nouveau deux fois.</li>
						<li>
							Verrouillez puis déverrouillez votre session pour vérifier que le nouveau est bien
							pris en compte.
						</li>
					</ol>

					<figure class="figure">
						<button class="figure__cadre" aria-label="Agrandir le schéma des trois chemins">
							<svg
								viewBox="0 0 640 148"
								width="100%"
								height="auto"
								role="img"
								aria-labelledby="d-titre d-desc"
							>
								<title id="d-titre">Trois chemins de réinitialisation</title>
								<desc id="d-desc"
									>Selon la situation : session ouverte sur le poste, chemin par le portail interne.
									Poste verrouillé, chemin par le lien « Mot de passe oublié » de l'écran de
									connexion. En déplacement sans accès au réseau, chemin par appel au support avec
									vérification d'identité.</desc
								>
								<g font-family="Archivo, sans-serif" font-size="11">
									<rect
										x="2"
										y="8"
										width="176"
										height="40"
										rx="6"
										fill="#fcfbf8"
										stroke="#9aa7a3"
									/>
									<text x="16" y="26" fill="#46585f">Votre session est ouverte</text>
									<text x="16" y="40" font-weight="700" fill="#16222b">→ Portail interne</text>

									<rect
										x="2"
										y="56"
										width="176"
										height="40"
										rx="6"
										fill="#fcfbf8"
										stroke="#9aa7a3"
									/>
									<text x="16" y="74" fill="#46585f">Votre poste est verrouillé</text>
									<text x="16" y="88" font-weight="700" fill="#16222b">→ Écran de connexion</text>

									<rect
										x="2"
										y="104"
										width="176"
										height="40"
										rx="6"
										fill="#fcfbf8"
										stroke="#9aa7a3"
									/>
									<text x="16" y="122" fill="#46585f">Vous êtes en déplacement</text>
									<text x="16" y="136" font-weight="700" fill="#16222b">→ Appel au support</text>

									<path d="M178 28h44v48h30" stroke="#9aa7a3" stroke-width="1.4" fill="none" />
									<path d="M178 76h74" stroke="#9aa7a3" stroke-width="1.4" fill="none" />
									<path d="M178 124h44V76h30" stroke="#9aa7a3" stroke-width="1.4" fill="none" />
									<path d="M252 71l9 5-9 5z" fill="#9aa7a3" />

									<rect
										x="266"
										y="56"
										width="164"
										height="40"
										rx="6"
										fill="#edecf8"
										stroke="#453ba0"
									/>
									<text x="280" y="74" font-weight="700" fill="#322b78">Nouveau mot de passe</text>
									<text x="280" y="88" fill="#453ba0">12 caractères minimum</text>

									<path d="M430 76h30" stroke="#9aa7a3" stroke-width="1.4" /><path
										d="M460 71l9 5-9 5z"
										fill="#9aa7a3"
									/>

									<rect
										x="474"
										y="56"
										width="164"
										height="40"
										rx="6"
										fill="#e4efe8"
										stroke="#1d6b4a"
									/>
									<text x="488" y="74" font-weight="700" fill="#1d6b4a">Actif sous 5 minutes</text>
									<text x="488" y="88" fill="#1d6b4a">sur tous vos services</text>
								</g>
							</svg>
						</button>
						<figcaption>
							<b>Schéma</b><span
								>Les trois chemins mènent au même résultat. Cliquez pour agrandir.</span
							>
						</figcaption>
					</figure>

					<h2 id="s-verrouille">Depuis l'écran de connexion, poste verrouillé</h2>
					<p>
						Si vous avez oublié votre mot de passe et que vous ne pouvez plus ouvrir votre session,
						utilisez le lien <em>Mot de passe oublié</em> sous les champs de connexion. Un code vous est
						envoyé sur votre téléphone professionnel.
					</p>

					<div class="alerte alerte--astuce">
						<div>
							<div class="alerte__tete">
								<span class="alerte__glyphe">ASTUCE</span> Le code arrive rarement en moins de dix secondes
							</div>
							<div>
								Attendez une minute avant de le redemander : chaque nouvelle demande annule la
								précédente, et beaucoup de blocages viennent de là.
							</div>
						</div>
					</div>

					<h2 id="s-deplacement">En déplacement, sans accès au réseau interne</h2>
					<p>
						Appelez le support. Votre identité sera vérifiée par une question convenue à votre
						arrivée dans l'entreprise. Si vous ne vous en souvenez pas, le support passera par votre
						responsable hiérarchique — comptez alors une demi-journée.
					</p>

					<h2 id="s-regles">Ce que doit contenir le nouveau mot de passe</h2>
					<div class="tableau-boite">
						<table>
							<thead><tr><th>Règle</th><th>Détail</th></tr></thead>
							<tbody>
								<tr><td>Longueur</td><td>12 caractères au minimum</td></tr>
								<tr><td>Composition</td><td>Aucune contrainte de caractères spéciaux</td></tr>
								<tr><td>Réutilisation</td><td>Différent des 5 derniers</td></tr>
								<tr><td>Validité</td><td>6 mois</td></tr>
								<tr><td>Prise en compte</td><td>5 minutes sur l'ensemble des services</td></tr>
							</tbody>
						</table>
					</div>
					<p>
						Une phrase de passe est plus sûre et plus facile à retenir qu'une suite de symboles. <mark
							>Quatre mots sans rapport entre eux</mark
						> valent mieux qu'un mot compliqué.
					</p>

					<h2 id="s-particuliers">Cas particuliers</h2>
					<ul>
						<li>
							<strong>Compte partagé d'équipe</strong> — la procédure est différente et suivie par
							l'équipe technique. Elle est décrite dans
							<span class="lien-prive" title="Cette ressource n'est pas publique"
								>une ressource réservée aux équipes techniques</span
							>.
						</li>
						<li>
							<strong>Vous n'arrivez plus à accéder à une application précise</strong> — ce n'est
							peut-être pas votre mot de passe. Voyez
							<a
								class="lien-int"
								href={resolve(ROUTE_DU_GUIDE, { identifiant: GUIDE_DEMANDER_ACCES })}
								>Demander un accès à une application</a
							>.
						</li>
						<li>
							<strong>Téléphone professionnel perdu</strong> — signalez-le d'abord, la
							réinitialisation viendra ensuite. Voyez
							<a
								class="lien-int"
								href={resolve(ROUTE_DU_GUIDE, { identifiant: GUIDE_SIGNALER_INCIDENT })}
								>Signaler un incident au support</a
							>.
						</li>
					</ul>

					<p>
						La politique de mots de passe suit les recommandations publiques de l'<a
							class="lien-ext"
							href="https://cyber.gouv.fr"
							target="_blank"
							rel="noopener">ANSSI</a
						>.
					</p>
				{/if}
			</div>

			<!-- ================= REGISTRE OPÉRATIONNEL ================= -->
			<div class="prose" id="corps-operationnel" hidden>
				{#if guide !== null}{@html guide.operationnel ?? ''}{:else}
					<div class="alerte alerte--astuce">
						<div>
							<div class="alerte__tete">
								<span class="alerte__glyphe">EN BREF</span> Version courte
							</div>
							<div>
								Pour le détail, les cas particuliers et les règles, revenez au <strong
									>guide complet</strong
								>.
							</div>
						</div>
					</div>

					<h2 id="o-faire">Ce qu'il faut faire</h2>
					<ol>
						<li>
							Session ouverte&nbsp;? Portail interne → <strong>Mon compte</strong> →
							<strong>Changer mon mot de passe</strong>.
						</li>
						<li>
							Poste verrouillé&nbsp;? <strong>Mot de passe oublié</strong> sur l'écran de connexion, puis
							le code reçu par téléphone.
						</li>
						<li>En déplacement sans réseau&nbsp;? Appelez le support.</li>
					</ol>

					<h2 id="o-retenir">À retenir</h2>
					<ul class="taches">
						<li>
							<input type="checkbox" disabled /><span
								>12 caractères minimum, différent des 5 derniers.</span
							>
						</li>
						<li>
							<input type="checkbox" disabled /><span
								>Actif sous 5 minutes sur tous les services.</span
							>
						</li>
						<li>
							<input type="checkbox" disabled /><span
								>Personne ne vous demandera jamais votre mot de passe.</span
							>
						</li>
					</ul>
				{/if}
			</div>
		</article>

		<!-- ---------- Colonne droite, réduite ---------- -->
		<aside class="aparte">
			<!--
				Les pièces jointes de la note demandée. Le panneau reste, la liste
				suit : une note sans pièce jointe rend un corps vide, ce qui est
				l'état vide de la zone, jamais un exemple laissé là.
			-->
			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Pièces jointes</span></div>
				<div class="panneau__corps panneau__corps--serre">
					{#if guide !== null}{#each guide.piecesJointes as pj, rang (rang)}<a
								class="pj"
								href={pj.adresse}
							>
								<span class="pj__ext">{pj.marque}</span>
								<span>
									<span class="pj__nom">{pj.nom}</span>
									<span class="pj__sous">{pj.taille}</span>
								</span>
							</a>{/each}{:else}<a class="pj" href="#">
							<span class="pj__ext">PDF</span>
							<span>
								<span class="pj__nom">Aide-mémoire — écran de connexion</span>
								<span class="pj__sous">320 Ko</span>
							</span>
						</a>{/if}
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Ce guide</span></div>
				<div class="panneau__corps">
					<div style="font-size:var(--t-petit);color:var(--c-encre-2);line-height:1.6">
						{`Écrit et maintenu par l'équipe ${guide?.domaine ?? 'Poste de travail'}. Le signal en tête indique la dernière date à laquelle son contenu a été contrôlé.`}
					</div>
					<button class="btn btn--plein" style="margin-top:var(--e-3)">
						<svg
							width="15"
							height="15"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							><path
								d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z"
							/></svg
						>
						Imprimer ce guide
					</button>
				</div>
			</section>

			<!-- L'ASIDE ENTIER EST GARDÉ : sans portail configuré, « Toujours
				 bloqué ? » suivi de rien serait une impasse annoncée. -->
			{#if assistanceJoignable}
				<aside class="repli">
					<h2 class="repli__titre">Toujours bloqué ?</h2>
					<p class="repli__txt">L'assistance prend le relais et vous rappelle.</p>
					<a class="btn btn--principal" href={portail} id="ticket">
						Ouvrir un ticket
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M6 3h7v7M13 3L4 12" /></svg
						>
					</a>
				</aside>
			{/if}
		</aside>
	</main>

	<footer class="pied-public">
		<div class="pied-public__int">
			<span class="etiq">Codicillus · Direction technique</span>
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
<!-- eslint-enable svelte/no-navigation-without-resolve, svelte/no-at-html-tags -->
