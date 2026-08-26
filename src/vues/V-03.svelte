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
	 * LE GUIDE RENDU EST LA NOTE QUE L'ADRESSE DÉSIGNE, ET RIEN D'AUTRE. Cet
	 * écran a longtemps porté, en second, la PAGE ÉCRITE de la maquette — son
	 * texte, son schéma, son tableau, son auteur, son domaine, ses dates — dans
	 * une branche que la route n'emprunte jamais. Elle ne s'affichait nulle part
	 * et partait dans le paquet du navigateur de la SEULE ROUTE PUBLIQUE du
	 * produit. La propriété `guide` ne peut plus être nulle, et la branche a
	 * disparu avec le `null` : voir sa déclaration.
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
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { NiveauFraicheur } from '../../seeds/corpus';
	import { temoinFraicheur } from '$lib/fraicheur';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

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
		/**
		 * LE GUIDE RÉELLEMENT DEMANDÉ — EXIGÉ, ET NON NUL.
		 *
		 * Il était `GuideAffiche | null`, et le `null` faisait rendre à cet écran
		 * L'ARTICLE ÉCRIT DE LA MAQUETTE : « Réinitialiser son mot de passe »,
		 * signé « Sophie Nguyen », dans le domaine « Poste de travail », avec ses
		 * trois dates de contrôle, son sommaire de cinq entrées, sa pièce jointe
		 * et ses deux liens vers des notes du jeu de démonstration.
		 *
		 * LA ROUTE NE PASSE JAMAIS `null` — `guides/[identifiant]/+page.server.ts`
		 * construit toujours l'objet, et rend 404 quand la note n'existe pas. Ces
		 * quelque deux cent soixante-dix lignes ne s'affichaient donc NULLE PART.
		 *
		 * MAIS ELLES PARTAIENT CHEZ CHAQUE LECTEUR : une branche morte reste dans
		 * le paquet du navigateur, et celui-ci est celui d'une ROUTE PUBLIQUE. Le
		 * jeu de démonstration se lisait dans le source de la page, sur le seul
		 * écran que le produit offre à un visiteur sans compte.
		 *
		 * LE `null` RETIRÉ, LA BRANCHE N'EXISTE PLUS, ET LE COMPILATEUR GARDE LA
		 * PORTE : une route qui oublierait le guide, ou qui en passerait un nul,
		 * ne compile plus. C'est la seule forme de garde qui ne s'oublie pas.
		 */
		guide: GuideAffiche;
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` par le chargeur de la route, qui la passe TOUJOURS : la
		 * propriété est EXIGÉE, et le jeu de démonstration ne peut plus tenir lieu
		 * de défaut. Vide, l'appel à l'assistance n'est pas ÉMIS.
		 */
		portail: string;
	}

	const { guide, portail }: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation`
	 * de la table `parametres`, descendue par le contexte de coquille.
	 *
	 * CET ÉCRAN ÉCRIVAIT « Direction technique » EN DUR. Ce n'était pas une
	 * donnée du jeu de démonstration : c'était le SEGMENT DE MARCHÉ du cadrage,
	 * soudé dans une signature de produit, et toute autre organisation le lisait
	 * comme un fait sur SON instance — sur le premier écran que le produit
	 * montre à un visiteur sans compte.
	 *
	 * « Codicillus » N'EST PAS CONCERNÉ : c'est le nom du LOGICIEL, et il reste
	 * en dur. C'est la SOUDURE entre le logiciel et l'organisation qu'on défait.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE, et c'est l'état normal d'une
	 * installation neuve, pas une panne : la signature rend « Codicillus » seul.
	 * C'est aussi ce que rend un composant monté hors gabarit racine, où
	 * `getContext` ne trouve rien — l'état vide, jamais un nom d'exemple.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	/** « Codicillus · <organisation> », ou « Codicillus » seul. */
	const signature = $derived(
		nomOrganisation === '' ? 'Codicillus' : `Codicillus · ${nomOrganisation}`
	);

	/** Un corps « En bref » existe-t-il ? Sinon le sélecteur de registre disparaît. */
	const registreExiste = $derived(guide.operationnel !== null);

	/**
	 * LE NIVEAU DE FRAÎCHEUR AFFICHÉ PAR LE CARTOUCHE — celui de la note, et il
	 * n'y en a pas d'autre.
	 *
	 * Trois tables du gel vivaient ici et ont disparu avec la branche sans
	 * guide : les trois dates de contrôle en forme machine, les mêmes en toutes
	 * lettres, et le sommaire de cinq entrées de l'article écrit. Elles
	 * n'étaient lues que par un état de planche que la route ne demande jamais,
	 * et elles voyageaient dans le paquet d'une route publique.
	 */
	const niveau = $derived<NiveauFraicheur>(guide.fraicheur);

	/**
	 * LE TÉMOIN DU CARTOUCHE, de la fabrique unique : la jauge et la valeur en
	 * clair sortent ensemble du même calcul (P-01, ADR-005).
	 *
	 * L'ANCIENNETÉ VIENT DE LA NOTE quand une note est affichée, et de l'horloge
	 * gelée du corpus sinon — sans quoi le libellé relatif ne serait pas
	 * reproductible des deux côtés de la comparaison.
	 *
	 * ═════════════════════════════════════════════════════════════════════
	 * `revise` — LE MAILLON QUI MANQUAIT, ET LE PRODUIT MENTAIT SUR SA
	 * PROMESSE DE TÊTE, SUR SON SEUL ÉCRAN PUBLIC.
	 *
	 * Un guide dont `verifie_le` est `NULL` affichait ici « Vérifié à
	 * l'instant », pendant que `/notes/{identifiant}` disait correctement
	 * « Jamais vérifiée » POUR LA MÊME NOTE. `fraicheur.ts` n'y était pour
	 * rien : sa toute première branche porte déjà le cas. C'est cet appel qui
	 * ne lui passait pas la date de contrôle, si bien que la garde ne se
	 * déclenchait jamais.
	 *
	 * ET RIEN NE PROTESTAIT : `EtatDeFraicheur.revise` est OPTIONNELLE et son
	 * test est STRICT (`=== null`). `undefined` ne déclenche rien, et le type
	 * ne voit pas l'omission — l'optionalité est délibérée (elle laisse rendre
	 * les appelants qui ne portent pas l'information), mais elle rend cet
	 * oubli-ci invisible au compilateur. Le seul filet est le contrôle.
	 *
	 * LA DONNÉE ÉTAIT DÉJÀ LÀ : `guides/[identifiant]/+page.server.ts` sert
	 * `controleIso: null` avec le commentaire qui l'annonce. La vue ne le
	 * lisait pas.
	 *
	 * SANS GUIDE — le rendu par défaut, la planche — la clé reste ABSENTE :
	 * les trois états du gel portent tous une date de contrôle réelle, et les
	 * trois libellés gelés ne bougent pas.
	 *
	 * LE NIVEAU ET LA JAUGE NE BOUGENT PAS : `RG-M06-01` calcule la fraîcheur
	 * sur la date de modification à défaut de vérification, et c'est juste.
	 * Seul le libellé cesse d'affirmer un contrôle qui n'a pas eu lieu.
	 */
	const temoin = $derived(
		temoinFraicheur({ fraicheur: niveau, jours: guide.jours, revise: guide.controleIso })
	);

	/**
	 * LA DATE DE CONTRÔLE AFFICHÉE PAR LE DÉTAIL DU CARTOUCHE — `null` quand la
	 * note n'a JAMAIS été vérifiée. C'est ce `null` que le détail lit pour
	 * choisir sa quatrième branche.
	 *
	 * LA FORME EN CLAIR RETOMBE ALORS SUR LA CHAÎNE VIDE, et non sur un tiret :
	 * le tiret marque une valeur qui manque LÀ OÙ ON L'ATTEND, et cette date
	 * n'est plus attendue nulle part quand elle est nulle — la quatrième branche
	 * dit l'absence en toutes lettres, et une prose affirmative ne se rattrape
	 * pas par un signe.
	 */
	const controle = $derived(guide.controleIso);
	const controleEnClair = $derived(guide.controleLe ?? '');

	/** Le sommaire de la note affichée — ses titres de niveau 2, tels que le
	 *  chargeur les a relevés sur le document canonique. */
	const SOMMAIRE = $derived(guide.sommaire);
</script>

<!--
	DEUX RÈGLES D'ESLINT SONT LEVÉES POUR CETTE VUE, ET CHACUNE A SON MOTIF.

	`svelte/no-navigation-without-resolve` — les trois adresses calculées de cet
	écran sont celle du domaine et celles des pièces jointes, bâties par
	`$lib/rangement/adresses`, le constructeur unique (`ARB-001`, « seule forme
	publiée »). `resolve()` n'accepte qu'un chemin connu à la compilation : il ne
	peut pas les prendre. Il n'en reste aucune autre : les adresses inertes du
	gel vivaient dans la branche sans guide, qui n'existe plus.

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
		<a href={resolve('/')}>Accueil</a><span>›</span><a href={guide.adresseDuDomaine}
			>{guide.domaine}</a
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
					<span class="past past--type">{guide.type}</span>
					<span class="past">{guide.domaine}</span>
				</div>

				<h1 class="titre-note">{guide.titre}</h1>

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
							<!--
								QUATRE ÉTATS, ET LE QUATRIÈME EST CELUI QUE LE GEL NE DESSINE PAS.

								La planche de V-03 n'en porte que trois — frais, vieil, obsolète —,
								chacun avec une DATE DE CONTRÔLE RÉELLE : le guide qu'elle illustre
								est toujours contrôlé. La seule note jamais vérifiée du corpus est
								INTERNE, elle n'atteint donc jamais cet écran. C'est un manque du
								gel, pas une dérive du produit.

								Sans cette branche, une prose AFFIRMATIVE — « Ce guide a été
								contrôlé le … » — était servie avec le marqueur de vide à la place
								de la date, sous un libellé « Vérifié à l'instant » que le témoin ne
								dit plus. Le dépôt a déjà comblé exactement ce trou côté libellé
								(`fraicheur.ts`) et côté note (`NoteDeDemonstration.svelte`) ; c'est
								le même comblement, sur le troisième et dernier site.

								`controle` est `null` QUAND, ET SEULEMENT QUAND, un guide est
								affiché et n'a jamais été vérifié : sans guide, il porte la date de
								l'état de planche.
							-->
							<div class="cartouche__detail">
								{#if controle === null}Ce guide n'a jamais été vérifié depuis sa publication. Son
									ancienneté se lit sur sa dernière modification.{:else if niveau === 'frais'}Ce
									guide a été contrôlé le <time datetime={controle} title={controleEnClair}
										>{controleEnClair}</time
									> par l'équipe qui l'a écrit.{:else if niveau === 'vieil'}Ce guide a été contrôlé
									le
									<time datetime={controle} title={controleEnClair}>{controleEnClair}</time>. Son
									contenu peut avoir changé depuis.{:else}Dernier contrôle le <time
										datetime={controle}
										title={controleEnClair}>{controleEnClair}</time
									>. <strong>Vérifiez auprès de l’assistance avant de vous y fier.</strong>{/if}
							</div>
						</div>
					</div>
				</div>

				<dl class="meta">
					<dt>Rédaction</dt>
					<dd>
						{guide.auteur + ' · modifié '}<time datetime={guide.modifieIso} title={guide.modifieLe}
							>{guide.modifieLe}</time
						>
					</dd>
					<dt>Domaine</dt>
					<dd>
						<a href={guide.adresseDuDomaine}>{guide.domaine}</a>
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
				{@html guide.reference}
			</div>

			<!-- ================= REGISTRE OPÉRATIONNEL ================= -->
			<div class="prose" id="corps-operationnel" hidden>
				{@html guide.operationnel ?? ''}
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
					{#each guide.piecesJointes as pj, rang (rang)}<a class="pj" href={pj.adresse}>
							<span class="pj__ext">{pj.marque}</span>
							<span>
								<span class="pj__nom">{pj.nom}</span>
								<span class="pj__sous">{pj.taille}</span>
							</span>
						</a>{/each}
				</div>
			</section>

			<section class="panneau">
				<div class="panneau__tete"><span class="etiq">Ce guide</span></div>
				<div class="panneau__corps">
					<div style="font-size:var(--t-petit);color:var(--c-encre-2);line-height:1.6">
						{`Écrit et maintenu par l'équipe ${guide.domaine}. Le signal en tête indique la dernière date à laquelle son contenu a été contrôlé.`}
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
			<span class="etiq">{signature}</span>
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
<!-- eslint-enable svelte/no-navigation-without-resolve, svelte/no-at-html-tags -->
