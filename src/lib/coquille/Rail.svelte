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
	 * `data-vers`, et `Gestion` conditionnée aux DROITS (`si-ecriture`) et non
	 * au rôle. Le chevron n'y porte pas non plus `type="button"`.
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
	 * TROIS ENTRÉES RESTENT À `href="#"`, ET C'EST LE BON CLASSEMENT :
	 *
	 *   · la FORME ABRÉGÉE tout entière — son gel ne porte AUCUN `data-vers`
	 *     (vérifié sur V-11:1056-1064 et V-22:1209-1217). Deviner sa destination
	 *     serait un comblement ; `verif:menus` la compte en `inerte-au-gel`, qui
	 *     est un CONSTAT et non un rouge ;
	 *   · l'Accueil de V-07, dont le gel déclare « Vous êtes déjà sur l'accueil »
	 *     (`V-07:1150`) — une non-destination, qu'aucune règle de
	 *     `REGLES_DE_DESTINATION` ne résout, et qui ne doit pas l'être ;
	 *   · SIGNETS, et celle-là est un ÉCART, pas un choix. Son `data-vers`
	 *     désigne V-22, dont `docs/routes.md` §3.3 donne la route
	 *     `/univers/{univers}/{domaine}/signets` : PARAMÉTRÉE. Or le rail est
	 *     GLOBAL — `verif/menus.mjs` le constate lui-même : « le rail de V-37
	 *     offre Cartographie, Carte mentale et Signets quel que soit le domaine
	 *     courant » — et aucune source du dépôt ne dit quel univers ni quel
	 *     domaine cette entrée vise. Le brief de V-37 ne cite même pas Signets
	 *     parmi les outils du rail. Choisir un domaine serait une décision
	 *     fonctionnelle prise en exécution, donc un défaut de contrat de tâche
	 *     (`CLAUDE.md` §2, règle de non-comblement). L'entrée reste inerte et
	 *     l'écart est remonté.
	 *
	 * SIGNETS A ÉTÉ ROUVERT AU LOT T-072, ET L'ENTRÉE RESTE INERTE. `ARB-046`
	 * proposait une route GLOBALE `/signets` rendant V-22, au motif que « le gel
	 * ne montre qu'une vue de signets et rien n'y distingue les deux portées ».
	 * L'arbitrage posait lui-même sa borne : *« si un état déclaré de V-22
	 * montrait un contexte de domaine qui contredit une portée globale,
	 * arrête-toi »*. LA BORNE EST FRANCHIE, ET C'EST MESURÉ :
	 *
	 *   `V-22:3232`  `changerDomaine("Infrastructure")` — l'initialisation, donc
	 *                les SIX états déclarés y passent ;
	 *   `V-22:2946`  `#sur-titre` ← `courant.univers + " · " + courant.nom` ;
	 *   `V-22:2947`  `#titre`     ← `"Signets de " + courant.nom` ;
	 *   `V-22:2948`  `fil: ["Accueil", courant.univers, courant.nom, "Signets"]`.
	 *
	 * Aucun état de V-22 n'existe sans domaine : son titre, son sur-titre et son
	 * fil en nomment un, et trois de ses six états sont un CHOIX de domaine. Une
	 * adresse globale rendrait donc « Signets de Infrastructure ». La décision
	 * est remontée pour reprise (T-072 É-3) ; l'entrée n'est pas câblée.
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
	 *   forme ABRÉGÉE   `a.rail__lien.si-ecriture` « Import »
	 *                   `div.rail__section.si-ecriture` « Gestion › Console »
	 *   forme COMPLÈTE  `a.rail__lien.si-ecriture` « Import »
	 *                   `div.rail__section.si-admin` « Gestion › Console »
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
		/** La version de l'instance, affichée au pied du rail. */
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
				href="#"
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
				href="#"
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
			href={forme === 'abregee' || accueilCourant ? '#' : resolve('/')}
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
				<div class="rail__titre etiq">{section.nom}</div>
				<ul class="arbre">
					{#each section.arbre as noeud (noeud.nom)}{@render brancheAbregee(noeud)}{/each}
				</ul>
			</div>{/each}
	{:else}
		<div id="rail-univers">
			{#if sections.length === 0}<div class="rail__vide">
					Aucun domaine ne vous est accessible pour l'instant. Demandez à un administrateur de vous
					rattacher à un domaine — votre compte existe, il n'a simplement pas encore de périmètre.
				</div>{:else}{#each sections as section (section.nom)}<div class="rail__section">
						<div class="rail__titre etiq">{section.nom}</div>
						<ul class="arbre">
							{#each section.domaines as domaine (domaine.cle)}{@render branche(domaine)}{/each}
						</ul>
					</div>{/each}{/if}
		</div>
	{/if}

	{#if forme === 'abregee'}
		<div class="rail__section">
			<div class="rail__titre etiq">Outils</div>
			<a class="rail__lien" href="#">Cartographie</a>
			<a class="rail__lien" href="#">Carte mentale</a>
			<a class="rail__lien" href="#">Signets</a>
			{#if ecriture}<a class="rail__lien si-ecriture" href="#">Import</a>{/if}
		</div>

		{#if ecriture}
			<div class="rail__section si-ecriture">
				<div class="rail__titre etiq">Gestion</div>
				<a class="rail__lien" href="#">Console</a>
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
			<a class="rail__lien" href="#" data-vers="Signets — vue V-22">
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
