<script lang="ts">
	/**
	 * Coquille applicative — la navigation latérale, 300 px.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002) : tout est dans la section
	 * « 4 ter » de `src/socle.css`. Le chevron déplie, le nom navigue.
	 *
	 * SEPT ZONES, DE HAUT EN BAS — la marque, le champ de recherche, le label UNIVERS,
	 * l'arborescence dépliable, « + Créer un univers », les RÉCENTS, la carte de compte.
	 *
	 * LE RENDU EST SERVEUR ET SANS HYDRATATION. Ce qui suppose un script :
	 *   • le chevron d'une branche (`$lib/cablage/coquille.ts`) — et les branches du
	 *     chemin courant sont dépliées PAR LE SERVEUR, donc l'arbre reste utilisable ;
	 *   • le champ de recherche, qui ouvre la palette — il retombe sur `/recherche`.
	 * La carte de compte, elle, est un `details` NATIF : son menu s'ouvre sans script,
	 * et ses entrées sont des liens, pas des boutons à câbler.
	 *
	 * P-03 / P-09 — L'ABSENCE, ET NON LE MASQUAGE : une entrée dont la cible rendrait
	 * 404 n'est pas émise. « + Créer un univers » mène à la console et n'est donc émise
	 * qu'à l'administrateur ; « Import » demande de pouvoir écrire quelque part.
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import {
		AUCUNE_PAGE,
		railRendu,
		sectionsDuRail,
		type NoeudRendu,
		type SectionRendue
	} from './arborescence';
	import { COMPTE_VIDE } from './compte-vide';
	import { glypheDUnivers, iconeDeNoeud } from './glyphes';
	import type { SectionAbregeeRendue } from './arborescence-abregee';
	import {
		CLE_IDENTITE,
		designationsDeCoquille,
		type CompteAffiche,
		type IdentiteDeCoquille,
		type NoteRecente
	} from './identite';

	interface Proprietes {
		/**
		 * Les univers, leurs domaines, leurs dossiers et leurs notes, DÉJÀ RENDUS
		 * pour la page courante — `Coquille.svelte` seule sait laquelle c'est.
		 *
		 * ABSENTE, LE RAIL SE DÉRIVE DU CONTEXTE D'IDENTITÉ, sans page courante : une
		 * vue qui monte le rail sans passer par la coquille garde ainsi une
		 * navigation réelle, au lieu du rail vide qu'elle affichait.
		 */
		sections?: readonly SectionRendue[] | undefined;
		/** Les cinq dernières notes consultées. Vide : la section n'est pas rendue. */
		recents?: readonly NoteRecente[] | undefined;
		/** Le compte affiché par la carte du bas. Absent : celui du contexte. */
		compte?: CompteAffiche | undefined;
		/**
		 * La version du produit, telle que `package.json` la déclare. Elle vit au bas
		 * du menu de compte : la référence ne lui donne pas de place propre, et la
		 * perdre priverait le support du seul numéro qu'un utilisateur peut lire.
		 */
		version: string;
		/**
		 * DROITS EFFECTIFS — P-09. En lecture seule, les entrées d'écriture ne sont
		 * pas ÉMISES. Absente : aucune restriction.
		 */
		droits?: 'ecriture' | 'lecture' | undefined;
		/**
		 * PROFIL — P-09, RG-DRO-03. La console et la création d'un univers ne sont
		 * ÉMISES que pour l'administrateur : elles rendent 404 à tout autre.
		 */
		role?: 'referent' | 'admin';
		/**
		 * LES DEUX ENTRÉES DE CRÉATION QUI EXIGENT UN DOMAINE — émises, ou pas du
		 * tout. Le verdict vient de `+layout.server.ts`, un prédicat par cible.
		 */
		creations?: { readonly dossier: boolean; readonly signet: boolean };
		/** Le rattachement du compte, qui donne l'adresse des deux entrées ci-dessus. */
		rangement?: { readonly univers: string; readonly domaine: string } | null | undefined;
		/** La page courante EST l'accueil — le lien de la marque n'y mène plus. */
		accueilCourant?: boolean;
		/** L'identifiant de la note ouverte — la ligne « Récents » qui la porte est active. */
		noteCourante?: string | null;
		/**
		 * LA FORME ABRÉGÉE N'EXISTE PLUS, ET SES DEUX PROPRIÉTÉS SONT ACCEPTÉES SANS
		 * ÊTRE LUES. Vingt-six vues portaient un rail écrit au balisage, dont l'arbre
		 * n'était pas celui du corpus : deux navigations pour un seul produit, et la
		 * seconde mentait. Il n'y en a plus qu'une, et elle se dérive des données.
		 *
		 * Les propriétés restent déclarées parce que des vues les passent encore, et
		 * que le compilateur les casserait toutes.
		 */
		forme?: 'complete' | 'abregee';
		sectionsAbregees?: readonly SectionAbregeeRendue[];
	}

	const {
		sections,
		recents,
		compte,
		version,
		droits,
		role = 'referent',
		creations = { dossier: true, signet: true },
		rangement,
		accueilCourant = false,
		noteCourante = null
	}: Proprietes = $props();

	/**
	 * L'IDENTITÉ RÉELLE L'EMPORTE — `./identite.ts` porte le contrat. Hors
	 * application, `getContext` rend `undefined` et les propriétés s'appliquent.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const designations = designationsDeCoquille();

	/**
	 * L'ARBORESCENCE — celle que la coquille a rendue pour la page courante, ou,
	 * à défaut, celle que le contexte permet de dériver SANS page courante.
	 */
	const arbre = $derived(
		sections ??
			(identite === undefined
				? []
				: railRendu(
						sectionsDuRail(identite.univers, identite.domaines, identite.notes ?? []),
						AUCUNE_PAGE,
						null,
						designations
					))
	);
	const compteAffiche = $derived(compte ?? identite?.compte ?? COMPTE_VIDE);
	const recentsAffiches = $derived(recents ?? identite?.recents ?? []);

	const ecriture = $derived(droits !== 'lecture');
	const admin = $derived(role === 'admin');

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES pour que
	 * `svelte/no-navigation-without-resolve` voie `resolve()` appelée sur un motif
	 * connu. `resolve()` n'accepte pas de chaîne de requête : celle de « Signets »
	 * est concaténée après, le chemin passant par la résolution du cadre.
	 */
	const ROUTE_UNIVERS = '/univers/[univers]' as const;
	const ROUTE_DOMAINE = '/univers/[univers]/[domaine]' as const;
	const ROUTE_DOSSIER = '/univers/[univers]/[domaine]/dossiers/[...chemin]' as const;
	const ROUTE_NOTE = '/notes/[identifiant]' as const;

	const sousTitre = $derived(
		compteAffiche.domaine ? `${compteAffiche.role} · ${compteAffiche.domaine}` : compteAffiche.role
	);
	const designation = $derived(
		compteAffiche.nom === '' ? 'Menu utilisateur' : `${compteAffiche.nom} — menu utilisateur`
	);
</script>

<!--
	UNE BRANCHE — domaine, dossier ou note. Le chevron n'est émis que si le nœud a
	des enfants ; sinon un espaceur tient sa place, pour que les icônes s'alignent.
-->
{#snippet branche(n: NoeudRendu)}
	<li data-cle={n.cle} data-ouvert={n.ouvert ? 'oui' : 'non'}>
		<div class="noeud" class:noeud--courant={n.page} data-ouvert={n.ouvert ? 'oui' : undefined}>
			{#if n.enfants.length}<button
					class="noeud__chevron"
					type="button"
					aria-expanded={n.ouvert}
					aria-label="Déplier {n.nom}"
					><svg
						width="10"
						height="10"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M6 3l5 5-5 5" /></svg
					></button
				>{:else}<span class="noeud__vide"></span>{/if}<a
				class="noeud__nom"
				href={n.type === 'note'
					? resolve(ROUTE_NOTE, { identifiant: n.identifiant ?? '' })
					: n.cible === null
						? '#'
						: n.cible.chemin.length > 0
							? resolve(ROUTE_DOSSIER, {
									univers: n.cible.univers,
									domaine: n.cible.domaine,
									chemin: n.cible.chemin.join('/')
								})
							: resolve(ROUTE_DOMAINE, { univers: n.cible.univers, domaine: n.cible.domaine })}
				aria-current={n.page ? 'page' : undefined}
				><Pictogramme
					traits={iconeDeNoeud(n.type)}
					taille="16"
					boite="0 0 16 16"
					epaisseur="1.4"
				/><span class="noeud__texte">{n.nom}</span>{#if n.compte !== null}<span
						class="noeud__compte">{n.compte}</span
					>{/if}</a
			>{#if n.chargement}<span class="noeud__rouet" aria-label="Chargement"></span>{/if}
		</div>
		{#if n.enfants.length}
			<ul>
				{#each n.enfants as enfant (enfant.cle)}{@render branche(enfant)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<aside class="rail" aria-label="Navigation principale">
	<!-- LA CROIX DU TIROIR — rendue toujours, visible sous 1024 px seulement, où le
	     rail est un tiroir. Le voile ferme aussi ; les deux gestes existent. -->
	<button class="rail__fermer" type="button" data-fermer-tiroir aria-label="Fermer la navigation"
		><svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
		></button
	>
	<a class="rail__marque" href={accueilCourant ? '#' : resolve('/')}>
		<span class="rail__sceau" aria-hidden="true">C</span>
		<span class="rail__identite">
			<span class="rail__nom">Codicillus</span>
			<span class="rail__accroche">Vos connaissances. Vivantes.</span>
		</span>
	</a>

	<!--
		LE CHAMP DE RECHERCHE OUVRE LA PALETTE — `$lib/cablage/coquille.ts` reconnaît
		`.recherche` et lui passe le clic ; sans script, il mène à `/recherche`. C'est
		un LIEN et non un `div[role=button]` : la destination de repli est réelle.
	-->
	<a class="recherche" id="ouvrir-recherche" href={resolve('/recherche')}>
		<svg
			width="15"
			height="15"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
		>
		<span class="recherche__txt">Rechercher…</span>
		<kbd class="touche">⌘ K</kbd>
	</a>

	<div class="rail__zone">
		<div class="rail__titre etiq">Univers</div>
		{#if arbre.length === 0}
			<!-- LE VIDE NE SE DIT PAS PAREIL SELON QUI LE LIT : cette phrase envoyait
			     l'administrateur qui vient d'installer « demander à un administrateur »,
			     alors qu'il est le seul compte de l'instance. -->
			<p class="rail__vide">
				{#if admin}Aucun univers n'existe encore. Créez-en un ci-dessous, puis un domaine : le
					rangement s'ouvrira ici.{:else}Aucun domaine ne vous est accessible pour l'instant.
					Demandez à un administrateur de vous rattacher à un domaine — votre compte existe, il n'a
					simplement pas encore de périmètre.{/if}
			</p>
		{:else}
			<ul class="arbre">
				{#each arbre as section (section.nom)}
					<li data-ouvert={section.ouvert ? 'oui' : 'non'}>
						<div
							class="noeud noeud--univers"
							class:noeud--courant={section.page}
							class:noeud--branche={section.courant && !section.page}
							data-ouvert={section.ouvert ? 'oui' : undefined}
						>
							{#if section.domaines.length}<button
									class="noeud__chevron"
									type="button"
									aria-expanded={section.ouvert}
									aria-label="Déplier {section.nom}"
									><svg
										width="10"
										height="10"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="2"><path d="M6 3l5 5-5 5" /></svg
									></button
								>{:else}<span class="noeud__vide"></span>{/if}<a
								class="noeud__nom"
								href={section.cible === null
									? '#'
									: resolve(ROUTE_UNIVERS, { univers: section.cible.univers })}
								aria-current={section.page ? 'page' : undefined}
								><Pictogramme
									traits={glypheDUnivers(section.glyphe)}
									taille="16"
									boite="0 0 24 24"
									epaisseur="1.4"
								/><span class="noeud__texte">{section.nom}</span>{#if section.compte > 0}<span
										class="noeud__compte">{section.compte}</span
									>{/if}</a
							>
						</div>
						{#if section.domaines.length}
							<ul>
								{#each section.domaines as domaine (domaine.cle)}{@render branche(domaine)}{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<!-- CRÉER UN UNIVERS EST UN GESTE DE CONSOLE (`RG-DRO-03`) : l'entrée mène à
		     la table des univers, où le formulaire s'ouvre. Émise au seul
		     administrateur, parce qu'elle rend 404 à tout autre. -->
		{#if admin}<a class="rail__action" href={resolve('/console/univers')}>
				<span class="rail__signe" aria-hidden="true">+</span>Créer un univers
			</a>{/if}
	</div>

	<!-- AUCUN COMPTE, AUCUNE CONSULTATION : PAS DE SECTION. Une zone « Récents »
	     vide n'apprend rien ; elle n'est simplement pas rendue. -->
	{#if recentsAffiches.length > 0}
		<div class="rail__zone">
			<div class="rail__titre etiq">Récents</div>
			<ul class="rail__recents">
				{#each recentsAffiches as note (note.identifiant)}
					<li>
						<a
							class="rail__recent"
							href={resolve(ROUTE_NOTE, { identifiant: note.identifiant })}
							aria-current={note.identifiant === noteCourante ? 'page' : undefined}
						>
							<Pictogramme
								traits={iconeDeNoeud('note')}
								taille="16"
								boite="0 0 16 16"
								epaisseur="1.4"
							/><span class="noeud__texte">{note.titre}</span>
						</a>
					</li>
				{/each}
			</ul>
			<!-- « TOUS LES RÉCENTS » N'A PAS DE PAGE PROPRE, et en inventer une serait
			     un écran de plus à tenir : le geste se ferme sur la recherche triée par
			     consultation, qui est la seule liste du produit qui ordonne les notes
			     par leur lecture. -->
			<a class="rail__action" href="{resolve('/recherche')}?tri=consultations">
				<span class="rail__signe" aria-hidden="true">→</span>Voir tous les récents
			</a>
		</div>
	{/if}

	<!--
		LA CARTE DE COMPTE — et le menu que la barre supérieure portait. Un `details`
		NATIF : il s'ouvre sans script, au clavier comme à la souris, et ses entrées
		sont des LIENS. Aucune adresse n'est devenue inatteignable en quittant le
		rail : Cartographie, Carte mentale, Signets, Import et Console vivent ici.
	-->
	<details class="rail__compte">
		<summary aria-label={designation} title={designation}>
			<span class="avatar" aria-hidden="true">{compteAffiche.initiales}</span>
			<span class="rail__compte-textes">
				<span class="rail__compte-nom">{compteAffiche.nom}</span>
				{#if compteAffiche.courriel}<span class="rail__compte-courriel"
						>{compteAffiche.courriel}</span
					>{/if}
			</span>
			<svg
				class="rail__compte-chevron"
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg
			>
		</summary>
		<div class="rail__menu">
			<div class="rail__menu-entete">
				<div class="rail__menu-nom">{compteAffiche.nom}</div>
				<div class="rail__menu-role">{sousTitre}</div>
			</div>
			{#if ecriture}
				<a class="rail__menu-lien" href={resolve('/notes/nouvelle')}>Nouvelle note</a>
				{#if creations.dossier && rangement}<a
						class="rail__menu-lien"
						href={resolve(ROUTE_DOMAINE, {
							univers: rangement.univers,
							domaine: rangement.domaine
						})}>Nouveau dossier</a
					>{/if}
				{#if creations.signet && rangement}<a
						class="rail__menu-lien"
						href="{resolve(ROUTE_DOMAINE, {
							univers: rangement.univers,
							domaine: rangement.domaine
						})}/signets/nouveau">Nouveau signet</a
					>{/if}
				<div class="rail__menu-sep"></div>
			{/if}
			<a class="rail__menu-lien" href={resolve('/cartographie')}>Cartographie</a>
			<a class="rail__menu-lien" href={resolve('/carte-mentale')}>Carte mentale</a>
			<a class="rail__menu-lien" href="{resolve('/recherche')}?type=Signet">Signets</a>
			{#if ecriture}<a class="rail__menu-lien" href={resolve('/importer')}>Import</a>{/if}
			<div class="rail__menu-sep"></div>
			<a class="rail__menu-lien" href={resolve('/mon-profil')}>Mon profil</a>
			{#if admin}<a class="rail__menu-lien" href={resolve('/console')}>Console</a>{/if}
			<a class="rail__menu-lien" href={resolve('/deconnexion')}>Se déconnecter</a>
			<div class="rail__menu-version etiq">Codicillus {version}</div>
		</div>
	</details>
</aside>
