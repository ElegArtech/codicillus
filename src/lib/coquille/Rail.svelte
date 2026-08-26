<script lang="ts">
	/**
	 * Coquille applicative (V-37) — la navigation latérale.
	 *
	 * Portée par les 35 vues de l'espace de travail et de la console. Le balisage
	 * reproduit `mockups/V-37-coquille.html` pour la forme COMPLÈTE et
	 * `mockups/V-25-profil.html` pour la forme ABRÉGÉE ; la mise en forme vient de
	 * `src/socle.css` et de `src/vues/V-37.css`, tous deux identiques à l'octet à
	 * leur source gelée. AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002).
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * DEUX FORMES, ET ELLES NE SE DÉDUISENT PAS L'UNE DE L'AUTRE — ARB-021, A-1
	 *
	 * Forme COMPLÈTE — 8 vues (V-07, V-14, V-27, V-37 à V-41). Le rail est
	 * construit à partir du corpus : réordonner les univers dans la console
	 * réordonne cette navigation. `#rail-univers` en est l'hôte, les entrées
	 * d'outils portent un pictogramme et un `data-vers`, `Gestion` est
	 * conditionnée au rôle (`si-admin`).
	 *
	 * Forme ABRÉGÉE — 26 vues. Le rail est ÉCRIT AU BALISAGE : quinze nœuds que
	 * le corpus ne produit pas (`arborescence-abregee.ts` dit pourquoi), pas
	 * d'hôte `#rail-univers`, des entrées d'outils SANS pictogramme et SANS
	 * `data-vers`. Le chevron n'y porte pas non plus `type="button"`. `Gestion`
	 * y est conditionnée AU RÔLE comme dans la forme complète — le gel l'écrit en
	 * `si-ecriture`, et `RG-DRO-03` dit le rôle ; voir l'en-tête `P-09` plus bas.
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * LE LIBELLÉ DU CHEVRON — CE QUE LA MESURE DIT, ET QUI N'ÉTAIT PAS ÉCRIT
	 *
	 * Aucune des deux formes ne fait dire « Replier » à un nœud que la page
	 * courante déplie. Mesuré dans les conditions du banc, page stabilisée :
	 *
	 *   • forme COMPLÈTE — `element()` construit le libellé sur `deplies`, l'état
	 *     persisté du rail (`V-37:3203`), VIDE à tout chargement propre du banc ;
	 *     puis `coquille({ courant })` déplie les ancêtres en posant
	 *     `data-ouvert="oui"` et `aria-expanded="true"` SANS toucher à
	 *     `aria-label` (`V-14:3849-3862`). V-14 rend donc trois nœuds ouverts et
	 *     trois libellés « Déplier ». Le gabarit écrit « Déplier » sans
	 *     condition : c'est JUSTE, et le corriger serait une régression.
	 *   • forme ABRÉGÉE — le libellé est celui du balisage. Seuls
	 *     `Infrastructure` et `Exploitation` disent « Replier », quel que soit le
	 *     chemin courant (vérifié sur V-11, V-12, V-13, V-17, V-22, V-25).
	 *
	 * D'où `deplie` (le balisage, qui pilote `aria-label`) distinct de `ouvert`
	 * (le rendu, qui pilote `data-ouvert` et `aria-expanded`).
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * Le rail est `display: none` sous 1240 px, sans contre-règle : sur petit
	 * écran l'arborescence est inatteignable. C'est la maquette gelée qui en
	 * décide, et ARB-010 qui l'assume — RG-M18-12 et RG-M18-13 restent, sur cet
	 * axe, NON TENUES. Aucun tiroir n'est ajouté ici : ce serait un comblement.
	 *
	 * Le chevron déplie, le nom navigue : deux cibles distinctes.
	 *
	 * ─────────────────────────────────────────────────────────────────────────
	 * LES ADRESSES — lot T-070, ET SEULEMENT CELLES QUE LE GEL DÉCLARE
	 *
	 * `ARB-013` retire les lignes `/url:` de l'instantané de structure : le
	 * produit peut donc porter ses adresses sans échouer au banc. Ce qu'il porte
	 * n'est pas déduit d'un libellé — c'est la destination que la MAQUETTE
	 * déclare elle-même en `data-vers`, résolue par `docs/routes.md`, qui fait
	 * foi sur les chemins :
	 *
	 *   Accueil        « Accueil contributeur — vue V-07 »  →  `/`
	 *   Cartographie   « Cartographie — vue V-19 »          →  `/cartographie`
	 *   Carte mentale  « Carte mentale — vue V-21 »         →  `/carte-mentale`
	 *   Import         « Import — vue V-24 »                →  `/importer`
	 *   Console        « Console — vue V-27 »               →  `/console/univers`
	 *
	 * UNE SEULE ENTRÉE RESTE À `href="#"`, ET C'EST LE BON CLASSEMENT :
	 *
	 *   · la FORME ABRÉGÉE tout entière — CLASSEMENT RÉVOQUÉ. Il tenait à ceci :
	 *     son gel ne porte AUCUN `data-vers` (V-11:1056-1064, V-22:1209-1217),
	 *     donc deviner sa destination serait un comblement. Or il n'y avait rien à
	 *     deviner : les deux formes rendent LE MÊME RAIL, entrée pour entrée et
	 *     libellé pour libellé — seuls les pictogrammes et le `data-vers` les
	 *     séparent. « Accueil » mène à l'accueil dans les deux, et vingt-six vues
	 *     portaient un rail dont la PREMIÈRE entrée ne menait nulle part. Les
	 *     quatre entrées d'outils ont été résolues avant celle-ci, pour la même
	 *     raison ; `P-03` n'admet aucun lien mort, et le plan de remédiation §3.6
	 *     tranche — un lien mort devient une vraie adresse ;
	 *   · l'Accueil de V-07, dont le gel déclare « Vous êtes déjà sur l'accueil »
	 *     (`V-07:1150`) — une non-destination, qu'aucune règle de
	 *     `REGLES_DE_DESTINATION` ne résout, et qui ne doit pas l'être ;
	 *   · SIGNETS — RÉSOLUE LE 20 AOÛT 2026, PAR UNE DÉCISION DE PÉRIMÈTRE DU
	 *     COMMANDITAIRE, et il faut lire pourquoi avant de toucher à cette ligne.
	 *
	 *     Le blocage tenait tout entier à une prémisse : que « Signets » soit une
	 *     CHOSE À PART, donc une destination qui a besoin d'un domaine. `ARB-047`
	 *     s'est appuyé dessus pour laisser l'entrée inerte, et trois lectures du
	 *     gel l'ont confirmé — le titre de V-22 nomme un domaine, son fil aussi,
	 *     et trois de ses six états sont un choix de domaine.
	 *
	 *     LA PRÉMISSE ÉTAIT FAUSSE. Le commanditaire l'a tranché : « c'est de
	 *     l'abus sémantique, ce sont des documents. » Et le dépôt le disait déjà
	 *     sans qu'on l'entende — `RG-NOT-01` : « une note est unique ; la fiche
	 *     n'est pas un objet séparé, et le signet non plus », et le cahier des
	 *     charges range « Signet » parmi les CINQ TYPES DE NOTE.
	 *
	 *     Un signet étant une note, l'entrée n'a jamais eu besoin d'un domaine :
	 *     elle vise les notes de ce type, et cette adresse est GLOBALE. Elle
	 *     existe, elle est montée, et le §4.2 de `docs/routes.md` déclare `type`
	 *     parmi ses facettes.
	 *
	 *     Ce qui a coûté trois jours n'était pas un conflit entre le rail et
	 *     V-22 : c'était une catégorie de trop.
	 *
	 * ───────────────────────────────────────────────────────────────────────────
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040) — lot T-072
	 *
	 * Le gel POSE les entrées gouvernées par un droit, puis les cache en CSS :
	 *   `.app[data-droits="lecture"] .si-ecriture { display: none }` (socle.css:396)
	 *   `.app:not([data-role="admin"]) .si-admin  { display: none }` (socle.css:397)
	 * Une maquette statique n'a pas de serveur : le masquage y est sa SEULE
	 * possibilité. Le produit, lui, peut ne pas les émettre — et P-09 l'exige,
	 * « ni grisée, NI MASQUÉE ».
	 *
	 * QUATRE NŒUDS SONT CONDITIONNÉS ICI, ET SEUL LEUR RENDU L'EST. La classe
	 * `si-*` reste intacte sur le nœud émis : elle porte AUSSI la mise en forme —
	 * en V-13 c'est elle qui donne son `display: inline-flex` au bouton. On
	 * conditionne le rendu du nœud, jamais ses classes.
	 *
	 *   forme ABRÉGÉE   `a.rail__lien.si-ecriture` « Import »        — droits
	 *                   `div.rail__section.si-admin` « Gestion › Console » — RÔLE
	 *   forme COMPLÈTE  `a.rail__lien.si-ecriture` « Import »        — droits
	 *                   `div.rail__section.si-admin` « Gestion › Console » — RÔLE
	 *
	 * LA SECTION « GESTION » EST LE SEUL NŒUD OÙ LE PRODUIT S'ÉCARTE DE LA CLASSE
	 * DU GEL, et `RG-DRO-03` l'exige : la forme abrégée du gel la pose en
	 * `si-ecriture` parce qu'une maquette statique n'a pas de rôle à lire. Le
	 * produit en a un, `/console` répond 404 à qui n'est pas administrateur, et
	 * `cablage/coquille.ts:98` gouverne déjà l'entrée de menu jumelle sur le
	 * booléen `administrateur`. Garde ET classe suivent le rôle.
	 *
	 * Mesuré par `pnpm test:droits` : 23 des 27 actions de gel de la batterie 7
	 * étaient portées par ces quatre nœuds. Énumération des omissions :
	 * `docs/omissions-p09.md` — et son entête dit pourquoi cette adresse-là.
	 */
	import { resolve } from '$app/paths';
	import type { NoeudRendu, SectionRendue } from './arborescence';
	import type { NoeudAbregeRendu, SectionAbregeeRendue } from './arborescence-abregee';

	interface Proprietes {
		/** La forme portée par la vue (ARB-021, A-1). */
		forme?: 'complete' | 'abregee';
		/** Forme complète : les univers porteurs d'au moins un domaine, et leurs arbres. */
		sections?: readonly SectionRendue[];
		/** Forme abrégée : les deux sections écrites au balisage du gel. */
		sectionsAbregees?: readonly SectionAbregeeRendue[];
		/**
		 * La version affichée au pied du rail. La coquille passe celle du paquet
		 * dès qu'un gabarit racine la lui donne ; hors application, celle que la
		 * vue porte. Rien n'est calculé ici.
		 */
		version: string;
		/**
		 * L'entrée « Accueil » est la page courante (ARB-021, A-5). V-07 seule :
		 * `aria-current="page"` et son `data-vers` propre (`V-07:1150`).
		 */
		accueilCourant?: boolean;
		/**
		 * DROITS EFFECTIFS — P-09. En lecture seule, les entrées `si-ecriture` ne
		 * sont pas ÉMISES. Absente, la propriété vaut « aucune restriction » :
		 * c'est exactement ce que fait le socle, dont la règle ne se déclenche que
		 * sur `data-droits="lecture"`.
		 */
		droits?: 'ecriture' | 'lecture' | undefined;
		/**
		 * PROFIL — P-09. La section `si-admin` n'est ÉMISE que pour
		 * l'administrateur. Le socle masque `.si-admin` dès que `data-role` vaut
		 * autre chose qu'`admin` ; le défaut `referent` du gabarit est donc
		 * restrictif, et la condition ci-dessous le reproduit à l'identique.
		 */
		role?: 'referent' | 'admin';
	}

	const {
		forme = 'complete',
		sections = [],
		sectionsAbregees = [],
		version,
		accueilCourant = false,
		droits,
		role = 'referent'
	}: Proprietes = $props();

	/* Les deux conditions sont la TRANSCRIPTION des deux règles du socle, pas
	   une interprétation : `.si-ecriture` disparaît quand `data-droits` vaut
	   « lecture », `.si-admin` quand `data-role` ne vaut pas « admin ». */
	const ecriture = $derived(droits !== 'lecture');
	const admin = $derived(role === 'admin');

	/**
	 * L'ADRESSE DE L'ENTRÉE « SIGNETS » DU RAIL.
	 *
	 * Un signet est une NOTE portant une adresse web (`RG-NOT-01`, et « Signet »
	 * est l'un des cinq types de note du cahier des charges). L'entrée vise donc
	 * les notes de ce type — une adresse GLOBALE, comme le rail lui-même, et non
	 * une page de domaine qui aurait demandé de choisir un domaine que rien ne
	 * désigne.
	 *
	 * `resolve()` n'accepte pas de chaîne de requête : elle est concaténée après,
	 * et le contrôle de navigation d'eslint s'en satisfait parce que le chemin,
	 * lui, passe bien par la résolution du cadre.
	 */

	/**
	 * L'ADRESSE D'UN NŒUD DU RAIL, passée par `resolve()`.
	 *
	 * `svelte/no-navigation-without-resolve` l'exige, et il a raison : une
	 * adresse composée à la main casserait sous un `base` de déploiement. Les
	 * adresses viennent de `$lib/rangement/adresses.ts`, qui les compose déjà
	 * dans la forme canonique ; `resolve()` n'y ajoute que la racine de
	 * déploiement.
	 *
	 * Le cast est nécessaire parce que ces adresses sont calculées, donc
	 * inconnues du type littéral que SvelteKit dérive de l'arbre des routes.
	 */
	/**
	 * LES TROIS MOTIFS DE ROUTE DU RAIL, écrits en constantes.
	 *
	 * `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION du `href` : il
	 * veut voir `resolve()` appelée sur un motif connu, et il a raison — une
	 * adresse concaténée à la main casse sous une racine de déploiement. Même
	 * écriture qu'en `V-07:455` et sur la route des relations.
	 */
	const ROUTE_UNIVERS = '/univers/[univers]' as const;
	const ROUTE_DOMAINE = '/univers/[univers]/[domaine]' as const;
	const ROUTE_DOSSIER = '/univers/[univers]/[domaine]/dossiers/[...chemin]' as const;

	/**
	 * L'ADRESSE D'UN NŒUD DU RAIL EST COMPOSÉE DANS LE BALISAGE, pas dans une
	 * fonction d'aide.
	 *
	 * `svelte/no-navigation-without-resolve` inspecte l'expression du `href` et
	 * veut y voir `resolve()` : une fonction d'aide la lui cache, et il a raison
	 * de refuser — c'est ainsi qu'une adresse concaténée passe inaperçue. Les
	 * trois cas sont donc composés à l'endroit où ils sont lus.
	 */
</script>

{#snippet branche(n: NoeudRendu)}
	<li data-cle={n.cle} data-ouvert={n.ouvert ? 'oui' : 'non'}>
		<div class="noeud" class:noeud--courant={n.courant} data-ouvert={n.ouvert ? 'oui' : undefined}>
			{#if n.enfants.length}<button
					class="noeud__chevron"
					type="button"
					aria-expanded={n.ouvert}
					aria-label="Déplier {n.nom}"
					><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
						><path d="M3 1l4 4-4 4z" /></svg
					></button
				>{:else}<span style="width: 20px; flex: none;"></span>{/if}<a
				class="noeud__nom"
				href={n.cible === null
					? '#'
					: n.cible.chemin.length > 0
						? resolve(ROUTE_DOSSIER, {
								univers: n.cible.univers,
								domaine: n.cible.domaine,
								chemin: n.cible.chemin.join('/')
							})
						: n.cible.domaine !== ''
							? resolve(ROUTE_DOMAINE, { univers: n.cible.univers, domaine: n.cible.domaine })
							: resolve(ROUTE_UNIVERS, { univers: n.cible.univers })}
				aria-current={n.page ? 'page' : undefined}>{n.nom}</a
			>{#if n.chargement}<span class="noeud__rouet" aria-label="Chargement"></span>{/if}
		</div>
		{#if n.enfants.length}
			<ul>
				{#each n.enfants as enfant (enfant.cle)}{@render branche(enfant)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<!--
	La branche de la FORME ABRÉGÉE. Elle diffère de la précédente sur cinq
	points, tous relevés au balisage du gel (`V-25:978-1053`) : pas de
	`data-cle`, pas de `data-ouvert="non"` sur un nœud fermé, pas de
	`type="button"` sur le chevron, un libellé de chevron pris au balisage, et
	un espaceur de feuille sans `flex`.
-->
{#snippet brancheAbregee(n: NoeudAbregeRendu)}
	<li data-ouvert={n.ouvert ? 'oui' : undefined}>
		<div class="noeud" class:noeud--courant={n.courant} data-ouvert={n.ouvert ? 'oui' : undefined}>
			{#if n.enfants.length}<button
					class="noeud__chevron"
					aria-expanded={n.ouvert}
					aria-label="{n.deplie ? 'Replier' : 'Déplier'} {n.nom}"
					><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
						><path d="M3 1l4 4-4 4z" /></svg
					></button
				>{:else}<span style="width:20px"></span>{/if}<a
				class="noeud__nom"
				href={n.cible === null
					? '#'
					: n.cible.chemin.length > 0
						? resolve(ROUTE_DOSSIER, {
								univers: n.cible.univers,
								domaine: n.cible.domaine,
								chemin: n.cible.chemin.join('/')
							})
						: n.cible.domaine !== ''
							? resolve(ROUTE_DOMAINE, { univers: n.cible.univers, domaine: n.cible.domaine })
							: resolve(ROUTE_UNIVERS, { univers: n.cible.univers })}
				aria-current={n.page ? 'page' : undefined}>{n.nom}</a
			>
		</div>
		{#if n.enfants.length}
			<ul>
				{#each n.enfants as enfant (enfant.nom)}{@render brancheAbregee(enfant)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<aside class="rail" aria-label="Navigation principale">
	<div class="rail__marque">
		<div class="rail__sceau" aria-hidden="true">C</div>
		<div class="rail__nom">Codicillus</div>
	</div>

	<div class="rail__section">
		<a
			class="rail__lien"
			href={accueilCourant ? '#' : resolve('/')}
			aria-current={accueilCourant ? 'page' : undefined}
			data-vers={forme === 'abregee'
				? undefined
				: accueilCourant
					? "Vous êtes déjà sur l'accueil"
					: 'Accueil contributeur — vue V-07'}
		>
			<svg
				width="15"
				height="15"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"><path d="M2 7l6-4.5L14 7v6.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" /></svg
			>
			Accueil
		</a>
	</div>

	{#if forme === 'abregee'}
		{#each sectionsAbregees as section (section.nom)}<div class="rail__section">
				{#if section.cible === undefined}<div class="rail__titre etiq">{section.nom}</div>{:else}<a
						class="rail__titre rail__titre--lien etiq"
						href={resolve(ROUTE_UNIVERS, { univers: section.cible })}>{section.nom}</a
					>{/if}
				<ul class="arbre">
					{#each section.arbre as noeud (noeud.nom)}{@render brancheAbregee(noeud)}{/each}
				</ul>
			</div>{/each}
		<!-- LE VIDE NE SE DIT PAS PAREIL SELON QUI LE LIT. Cette phrase envoyait
	     l'administrateur qui vient d'installer « demander à un administrateur » :
	     il est le seul compte de l'instance, et le chemin réel est la console.
	     Mesuré sur une base à zéro univers, où c'est la première page qu'il voit. -->
	{:else}
		<div id="rail-univers">
			{#if sections.length === 0}<div class="rail__vide">
					{#if role === 'admin'}Aucun univers n'existe encore sur cette instance. Créez-en un dans
						la console, puis un domaine : le rangement s'ouvrira ici.{:else}Aucun domaine ne vous
						est accessible pour l'instant. Demandez à un administrateur de vous rattacher à un
						domaine — votre compte existe, il n'a simplement pas encore de périmètre.{/if}
				</div>{:else}{#each sections as section (section.nom)}<div class="rail__section">
						{#if section.cible === null}<div class="rail__titre etiq">{section.nom}</div>{:else}<a
								class="rail__titre rail__titre--lien etiq"
								href={resolve(ROUTE_UNIVERS, { univers: section.cible.univers })}>{section.nom}</a
							>{/if}
						<ul class="arbre">
							{#each section.domaines as domaine (domaine.cle)}{@render branche(domaine)}{/each}
						</ul>
					</div>{/each}{/if}
		</div>
	{/if}

	{#if forme === 'abregee'}
		<div class="rail__section">
			<div class="rail__titre etiq">Outils</div>
			<!-- LA FORME ABRÉGÉE PORTE LES MÊMES ADRESSES QUE LA COMPLÈTE. Elle les
				laissait à `href="#"` : quatre liens morts, et `P-03` n'en admet aucun.
				« Signets » vise les notes de type Signet, adresse globale, comme dans
				la forme complète. -->
			<a class="rail__lien" href={resolve('/cartographie')}>Cartographie</a>
			<a class="rail__lien" href={resolve('/carte-mentale')}>Carte mentale</a>
			<a class="rail__lien" href="{resolve('/recherche')}?type=Signet">Signets</a>
			{#if ecriture}<a class="rail__lien si-ecriture" href={resolve('/importer')}>Import</a>{/if}
		</div>

		<!-- RG-DRO-03 — « CONSOLE » SE GARDE SUR LE RÔLE, PAS SUR LES DROITS, ET
			SA CLASSE DIT LE MÊME VERDICT. Le gel écrit `si-ecriture` sur cette
			section, faute d'avoir un rôle à lire ; le produit, lui, en a un, et
			`/console` répond 404 à qui n'est pas administrateur. Gardée sur
			`ecriture`, la section fuyait l'existence et l'adresse de la console à
			tout rédacteur — un lien mort ÉMIS, et même pas masqué, `data-droits`
			valant « ecriture ». Gardée sur `admin` mais laissée en `si-ecriture`,
			elle disparaissait à l'inverse sous `socle.css:408` pour
			l'administrateur d'une instance neuve, qui ne peut écrire nulle part et
			porte donc `data-droits="lecture"` — masquage, que `P-09` refuse
			autant. Les deux moitiés vont ensemble : `si-admin`, comme la forme
			complète, `:474`. -->
		{#if admin}
			<div class="rail__section si-admin">
				<div class="rail__titre etiq">Gestion</div>
				<a class="rail__lien" href={resolve('/console')}>Console</a>
			</div>
		{/if}
	{:else}
		<div class="rail__section">
			<div class="rail__titre etiq">Outils</div>
			<a class="rail__lien" href={resolve('/cartographie')} data-vers="Cartographie — vue V-19">
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><circle cx="4" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><path
						d="M5.6 5.6l4.8 4.8"
					/></svg
				>
				Cartographie
			</a>
			<a class="rail__lien" href={resolve('/carte-mentale')} data-vers="Carte mentale — vue V-21">
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					><rect x="1.5" y="6" width="5" height="4" rx="1" /><rect
						x="9.5"
						y="2"
						width="5"
						height="4"
						rx="1"
					/><rect x="9.5" y="10" width="5" height="4" rx="1" /><path
						d="M6.5 8h1.5v-4h1.5M8 8v4h1.5"
					/></svg
				>
				Carte mentale
			</a>
			<a
				class="rail__lien"
				href="{resolve('/recherche')}?type=Signet"
				data-vers="Signets — vue V-22"
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
				>
				Signets
			</a>
			{#if ecriture}<a
					class="rail__lien si-ecriture"
					href={resolve('/importer')}
					data-vers="Import — vue V-24"
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"><path d="M8 10.5V2M4.8 6.2L8 2.8l3.2 3.4M2.5 13.5h11" /></svg
					>
					Import
				</a>{/if}
		</div>

		{#if admin}
			<div class="rail__section si-admin">
				<div class="rail__titre etiq">Gestion</div>
				<a class="rail__lien" href={resolve('/console/univers')} data-vers="Console — vue V-27">
					<svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M6.5 1.8h3l.3 1.7 1.5.9 1.6-.7 1.5 2.6-1.2 1.2v1.7l1.2 1.2-1.5 2.6-1.6-.7-1.5.9-.3 1.7h-3l-.3-1.7-1.5-.9-1.6.7L.6 12.4l1.2-1.2V9.5L.6 8.3l1.5-2.6 1.6.7 1.5-.9z"
						/><circle cx="8" cy="8" r="2" /></svg
					>
					Console
				</a>
			</div>
		{/if}
	{/if}

	<div class="rail__pied">
		<span class="etiq">Codicillus {version}</span>
	</div>
</aside>
