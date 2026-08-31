<script lang="ts">
	/**
	 * Coquille applicative (V-37) — la navigation latérale. AUCUNE RÈGLE DE STYLE N'EST
	 * ÉCRITE ICI (P-1, ADR-002). Le chevron déplie, le nom navigue.
	 *
	 * DEUX FORMES, ET ELLES NE SE DÉDUISENT PAS L'UNE DE L'AUTRE (ARB-021). COMPLÈTE : le
	 * rail est construit à partir du corpus, `#rail-univers` en est l'hôte, les entrées
	 * d'outils portent un pictogramme et un `data-vers`. ABRÉGÉE : le rail est ÉCRIT AU
	 * BALISAGE (voir `arborescence-abregee.ts`), sans hôte, sans pictogramme, sans
	 * `data-vers`, et le chevron n'y porte pas `type="button"`.
	 *
	 * LE LIBELLÉ DU CHEVRON : aucune des deux formes ne fait dire « Replier » à un nœud
	 * que la page courante déplie — le gel construit son libellé sur l'état PERSISTÉ du
	 * rail, vide à tout chargement, puis déplie les ancêtres sans toucher à `aria-label`.
	 * D'où `deplie` (le balisage, qui pilote `aria-label`) distinct de `ouvert` (le rendu,
	 * qui pilote `data-ouvert` et `aria-expanded`). Le rail est `display: none` sous
	 * 1240 px, sans contre-règle : ARB-010 l'assume, et RG-M18-12 / RG-M18-13 restent NON
	 * TENUES. SIGNETS EST UNE ADRESSE GLOBALE — un signet est une NOTE (`RG-NOT-01`).
	 *
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040) : QUATRE NŒUDS SONT
	 * CONDITIONNÉS ICI, ET SEUL LEUR RENDU L'EST — la classe `si-*` reste intacte sur le
	 * nœud émis, car elle porte AUSSI la mise en forme. LA SECTION « GESTION » EST LE SEUL
	 * NŒUD OÙ LE PRODUIT S'ÉCARTE DE LA CLASSE DU GEL, et `RG-DRO-03` l'exige : la forme
	 * abrégée la pose en `si-ecriture` faute de rôle à lire, quand `/console` répond 404 à
	 * qui n'est pas administrateur.
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
		 * La version affichée au pied du rail — celle du paquet dès qu'un gabarit
		 * racine la donne, celle de la vue hors application. Rien n'est calculé ici.
		 */
		version: string;
		/** L'entrée « Accueil » est la page courante (ARB-021). V-07 seule. */
		accueilCourant?: boolean;
		/**
		 * DROITS EFFECTIFS — P-09. En lecture seule, les entrées `si-ecriture` ne sont
		 * pas ÉMISES. Absente, la propriété vaut « aucune restriction » : exactement
		 * ce que fait le socle, dont la règle ne se déclenche que sur
		 * `data-droits="lecture"`.
		 */
		droits?: 'ecriture' | 'lecture' | undefined;
		/**
		 * PROFIL — P-09. La section `si-admin` n'est ÉMISE que pour l'administrateur.
		 * Le socle masque `.si-admin` dès que `data-role` vaut autre chose qu'`admin` ;
		 * le défaut `referent` du gabarit est donc restrictif.
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

	/* Les deux conditions sont la TRANSCRIPTION des deux règles du socle, pas une
	   interprétation : `.si-ecriture` disparaît quand `data-droits` vaut
	   « lecture », `.si-admin` quand `data-role` ne vaut pas « admin ». */
	const ecriture = $derived(droits !== 'lecture');
	const admin = $derived(role === 'admin');

	/**
	 * LES TROIS MOTIFS DE ROUTE DU RAIL, ÉCRITS EN CONSTANTES pour que
	 * `svelte/no-navigation-without-resolve` voie `resolve()` appelée sur un motif
	 * connu. `resolve()` n'accepte pas de chaîne de requête : celle de « Signets »
	 * est concaténée après, le chemin passant par la résolution du cadre.
	 */
	const ROUTE_UNIVERS = '/univers/[univers]' as const;
	const ROUTE_DOMAINE = '/univers/[univers]/[domaine]' as const;
	const ROUTE_DOSSIER = '/univers/[univers]/[domaine]/dossiers/[...chemin]' as const;

	/**
	 * L'ADRESSE D'UN NŒUD DU RAIL EST COMPOSÉE DANS LE BALISAGE, pas dans une
	 * fonction d'aide : `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION
	 * du `href` et veut y voir `resolve()`, qu'une fonction d'aide lui cache — une
	 * adresse concaténée casse sous une racine de déploiement.
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
	La branche de la FORME ABRÉGÉE. Elle diffère de la précédente sur cinq points,
	tous relevés au balisage du gel (`V-25:978-1053`) : pas de `data-cle`, pas de
	`data-ouvert="non"` sur un nœud fermé, pas de `type="button"` sur le chevron, un
	libellé de chevron pris au balisage, et un espaceur de feuille sans `flex`.
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
		<!-- LE VIDE NE SE DIT PAS PAREIL SELON QUI LE LIT : cette phrase envoyait
		     l'administrateur qui vient d'installer « demander à un administrateur »,
		     alors qu'il est le seul compte de l'instance. -->
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
				laissait à `href="#"` : quatre liens morts, et `P-03` n'en admet aucun. -->
			<a class="rail__lien" href={resolve('/cartographie')}>Cartographie</a>
			<a class="rail__lien" href={resolve('/carte-mentale')}>Carte mentale</a>
			<a class="rail__lien" href="{resolve('/recherche')}?type=Signet">Signets</a>
			{#if ecriture}<a class="rail__lien si-ecriture" href={resolve('/importer')}>Import</a>{/if}
		</div>

		<!-- RG-DRO-03 — « CONSOLE » SE GARDE SUR LE RÔLE, PAS SUR LES DROITS, ET SA
			CLASSE DIT LE MÊME VERDICT. Gardée sur `ecriture`, la section fuyait
			l'existence et l'adresse de la console à tout rédacteur. Gardée sur `admin`
			mais laissée en `si-ecriture`, elle disparaissait sous le socle pour
			l'administrateur d'une instance neuve, qui porte `data-droits="lecture"`. -->
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
