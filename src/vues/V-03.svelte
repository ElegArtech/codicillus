<script lang="ts">
	/**
	 * V-03 — Lecture publique d'un guide. Route `/guides/{identifiant}`.
	 *
	 * SERVIE TELLE QUELLE À UN UTILISATEUR CONNECTÉ — `ARB-007` A-05,
	 * `docs/routes.md` §3.1 : « une seule adresse, un seul rendu ; la session ne
	 * change ni la route, ni la vue, ni les états. » Pas de redirection vers
	 * `/notes/{identifiant}`, pas de bandeau « vue publique » : vérifier « ce que
	 * voit le public » avant publication est un usage réel. Ce composant n'a donc
	 * AUCUNE branche de session.
	 *
	 * PÉRIMÈTRE PUBLIC — `RG-M17-01`, réduit au point d'entrée de la vue, comme en
	 * V-01, V-02 et V-04 (`V-03:1519`).
	 *
	 * LE GUIDE RENDU EST LA NOTE QUE L'ADRESSE DÉSIGNE, ET RIEN D'AUTRE : cet écran
	 * a longtemps porté en second la PAGE ÉCRITE de la maquette, dans une branche
	 * que la route n'emprunte jamais — elle partait dans le paquet du navigateur de
	 * la SEULE ROUTE PUBLIQUE du produit. La propriété `guide` ne peut plus être
	 * nulle, et la branche a disparu avec le `null`.
	 *
	 * `data-numerote="non"` — ÉCART DÉCLARÉ, NON COMBLÉ. V-03 est la SEULE maquette
	 * du dépôt qui pose l'attribut là où la règle le lit : `<body>` (`V-03:912`,
	 * `V-03.css:438`). AUCUN CHEMIN N'EXISTE POUR LE POSER — Svelte refuse tout
	 * attribut sur `<svelte:body>`, et `<svelte:head>` ne touche pas au corps. Le
	 * poser sur `div.app` ne changerait rien, la règle visant `body`. Conséquence :
	 * la numérotation de section s'affiche là où la référence la supprime.
	 *
	 * PAS DE COQUILLE : `docs/releve-vues.md` §5.1 — V-01 à V-06 et V-09 n'en
	 * portent pas. Le bouton d'impression perd son `onclick` en ligne, que Svelte
	 * ne sait pas émettre comme attribut littéral.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-03.css` ; les `style=`
	 * reproduits figurent tous à l'ensemble clos du gel.
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { NiveauFraicheur } from '../../seeds/corpus';
	import { temoinFraicheur } from '$lib/fraicheur';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	/**
	 * Une entrée de sommaire — les titres de niveau 2 du corps affiché. Aucun numéro
	 * n'est porté, ici comme au gel.
	 */
	interface EntreeDeSommaire {
		readonly ancre: string;
		readonly titre: string;
	}

	interface PieceAffichee {
		readonly nom: string;
		readonly marque: string;
		readonly taille: string;
		readonly adresse: string;
	}

	/**
	 * LE GUIDE DEMANDÉ — la note que l'adresse désigne, et ses deux corps DÉJÀ
	 * RENDUS par `rendreDocument`, l'implémentation unique (`ADR-004`). La vue ne
	 * convertit rien : elle reçoit du HTML et le pose. Un document canonique rendu
	 * ici serait le second chemin que l'ADR interdit.
	 */
	interface GuideAffiche {
		readonly titre: string;
		readonly type: string;
		readonly domaine: string;
		readonly adresseDuDomaine: string;
		readonly auteur: string;
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
		 * LE GUIDE RÉELLEMENT DEMANDÉ — EXIGÉ, ET NON NUL. Il était
		 * `GuideAffiche | null`, et le `null` faisait rendre à cet écran L'ARTICLE
		 * ÉCRIT DE LA MAQUETTE — son auteur, son domaine, ses dates de contrôle, son
		 * sommaire et ses liens vers des notes du jeu.
		 *
		 * La route ne passe jamais `null` : ces quelque deux cent soixante-dix lignes
		 * ne s'affichaient nulle part, MAIS PARTAIENT CHEZ CHAQUE LECTEUR — une branche
		 * morte reste dans le paquet, et celui-ci est celui d'une ROUTE PUBLIQUE.
		 *
		 * Le `null` retiré, le compilateur garde la porte : une route qui oublierait le
		 * guide ne compile plus.
		 */
		guide: GuideAffiche;
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — donnée d'INSTANCE, lue dans la table
		 * `parametres` et TOUJOURS passée : la propriété est EXIGÉE, et le jeu de
		 * démonstration ne peut plus tenir lieu de défaut. Vide, l'appel à l'assistance
		 * n'est pas ÉMIS.
		 */
		portail: string;
	}

	const { guide, portail }: Proprietes = $props();

	/** Une adresse absente ou blanche ne mène nulle part : rien ne l'annonce. */
	const assistanceJoignable = $derived(portail.trim() !== '');

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation` de la
	 * table `parametres`. Cet écran écrivait « Direction technique » EN DUR : le
	 * SEGMENT DE MARCHÉ du cadrage soudé dans une signature de produit.
	 * « Codicillus » n'est pas concerné, c'est le nom du LOGICIEL.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE, l'état normal d'une installation
	 * neuve : la signature rend « Codicillus » seul.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	const signature = $derived(
		nomOrganisation === '' ? 'Codicillus' : `Codicillus · ${nomOrganisation}`
	);

	const registreExiste = $derived(guide.operationnel !== null);

	/**
	 * Le niveau de fraîcheur affiché par le cartouche — celui de la note, et il n'y
	 * en a pas d'autre. Trois tables du gel vivaient ici et ont disparu avec la
	 * branche sans guide, qu'aucune route ne demandait.
	 */
	const niveau = $derived<NiveauFraicheur>(guide.fraicheur);

	/**
	 * LE TÉMOIN DU CARTOUCHE, de la fabrique unique : la jauge et la valeur en clair
	 * sortent ensemble du même calcul (`ADR-005`).
	 *
	 * `revise` EST LE MAILLON QUI MANQUAIT. Un guide dont `verifie_le` est `NULL`
	 * affichait ici « Vérifié à l'instant » pendant que `/notes/{identifiant}` disait
	 * « Jamais vérifiée » POUR LA MÊME NOTE : `fraicheur.ts` porte le cas dans sa
	 * toute première branche, mais cet appel ne lui passait pas la date de contrôle.
	 * ET RIEN NE PROTESTAIT : `EtatDeFraicheur.revise` est OPTIONNELLE et son test
	 * est STRICT (`=== null`), donc `undefined` ne déclenche rien et le type ne voit
	 * pas l'omission.
	 *
	 * LE NIVEAU ET LA JAUGE NE BOUGENT PAS : `RG-M06-01` calcule la fraîcheur sur la
	 * date de modification à défaut de vérification. Seul le libellé cesse
	 * d'affirmer un contrôle qui n'a pas eu lieu.
	 */
	const temoin = $derived(
		temoinFraicheur({ fraicheur: niveau, jours: guide.jours, revise: guide.controleIso })
	);

	/**
	 * LA DATE DE CONTRÔLE AFFICHÉE PAR LE DÉTAIL DU CARTOUCHE — `null` quand la note
	 * n'a JAMAIS été vérifiée, et c'est ce `null` que le détail lit pour choisir sa
	 * quatrième branche. La forme en clair retombe alors sur la CHAÎNE VIDE, non sur
	 * un tiret : le tiret marque une valeur qui manque là où on l'attend, et cette
	 * date n'est plus attendue quand elle est nulle.
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
	écran (le domaine, les pièces jointes) sont bâties par `$lib/rangement/adresses`,
	le constructeur unique (`ARB-001`), et `resolve()` n'accepte qu'un chemin connu
	à la compilation.

	`svelte/no-at-html-tags` — les deux corps rendus viennent de `rendreDocument`,
	dont le texte est échappé par `echapper()` (`ADR-003`). Même motif qu'en `V-18`
	et dans `NoteDeDemonstration.svelte`.
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
		<!-- Sommaire — LE BLOC ENTIER TOMBE QUAND LE GUIDE N'A PAS DE TITRE DE NIVEAU 2,
			état ordinaire d'une note courte sur une instance neuve : un titre
			« Sommaire » et un bouton de repli au-dessus d'une liste vide annoncent une
			navigation qui n'existe pas. Le gel ne montre ce cadre qu'avec ses cinq
			entrées ; il n'a jamais dit ce qu'il devient sans elles. -->
		{#if SOMMAIRE.length > 0}
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
		{/if}

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
								QUATRE ÉTATS, ET LE QUATRIÈME EST CELUI QUE LE GEL NE DESSINE PAS : sa
								planche n'en porte que trois, chacun avec une DATE DE CONTRÔLE RÉELLE,
								et la seule note jamais vérifiée du corpus est INTERNE. Sans cette
								branche, une prose AFFIRMATIVE — « Ce guide a été contrôlé le … » —
								était servie avec le marqueur de vide à la place de la date.
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
				LES PIÈCES JOINTES DE LA NOTE DEMANDÉE — ET LE PANNEAU TOMBE AVEC ELLES.
				Une note sans pièce jointe est l'état ordinaire d'une instance neuve, et le
				panneau rendait alors son en-tête au-dessus d'un corps vide : un cadre qui
				affirme une matière absente. L'état vide d'une liste facultative de la
				colonne d'apartés, c'est l'absence du panneau.
			-->
			{#if guide.piecesJointes.length > 0}
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
			{/if}

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
