<script lang="ts">
	/**
	 * V-04 — Page non trouvée, espace public. Servie à TOUTE adresse non résolue.
	 *
	 * PAS DE ROUTE PROPRE (`docs/routes.md` §3.1) : la réponse est un 404 rendu À
	 * L'ADRESSE DEMANDÉE, qui reste affichée. `/guides/` nu en fait partie — il
	 * n'existe pas d'index public des guides.
	 *
	 * LE CHEMIN DE CODE UNIQUE — `ADR-007`. V-04 et V-26 appellent
	 * `adresseNonResolue()` de `$lib/public/adresse-non-resolue`, dont la SEULE
	 * entrée est le chemin demandé : il n'existe ni paramètre de cas, ni drapeau
	 * d'interdiction, ni exception typée qui remonterait jusqu'ici. Rien, dans ce
	 * composant, ne peut savoir POURQUOI l'adresse n'a rien rapporté. Le gel le dit
	 * dans les mêmes termes (`V-04:2219`) : « les deux premiers cas doivent produire
	 * un rendu strictement identique ».
	 *
	 * PÉRIMÈTRE PUBLIC — `RG-M17-01` : `notesPubliques(notes)` est appliqué au point
	 * d'entrée unique de la vue, à l'endroit exact où la maquette écrit
	 * `window.CORPUS = window.corpusPublic()` (`V-04:1975`).
	 *
	 * PAS DE COQUILLE : V-01 à V-06 et V-09 n'en portent pas (`docs/releve-vues.md`
	 * §5.1), et la page est autonome.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-04.css` ; le seul `style=` du
	 * fichier figure à l'ensemble clos du gel.
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Note } from '../../seeds/corpus';
	import { adresseNonResolue } from '$lib/public/adresse-non-resolue';
	import { chercher, nombreFr, notesPubliques, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/** Le motif de route, écrit en constante — `svelte/no-navigation-without-resolve`
	    inspecte l'EXPRESSION du `href`. */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	interface Proprietes {
		notes: readonly Note[];
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — « adresse externe configurée en console »
		 * (`V-04:2205`), portée par la table `parametres`. Cet écran n'a pas de route
		 * propre — il est rendu par le composant d'erreur de la racine —, et ce
		 * composant la passe TOUJOURS : la propriété est EXIGÉE.
		 */
		portail: string;
		/**
		 * LES PISTES DE REFORMULATION — une DONNÉE. La vue en portait cinq en dur,
		 * tirées du gel, dont chacune ouvrait `/recherche?q=…` à zéro résultat. Une
		 * page d'erreur n'a pas de chargeur : rien ne peut les dériver ici, et une
		 * liste vide ne rend pas le bloc. EXIGÉE.
		 */
		pistes: readonly string[];
		/**
		 * L'ADRESSE RÉELLEMENT DEMANDÉE — la seule entrée d'`adresseNonResolue()`, et
		 * elle est EXIGÉE. Optionnelle, son défaut était la table d'adresses de la
		 * planche : toute adresse cassée annonçait un guide du jeu de démonstration,
		 * avec la requête qui s'en dérive déjà saisie dans le champ de recherche. Les
		 * littéraux partaient de surcroît dans le chunk d'erreur, que toute page
		 * d'erreur charge.
		 *
		 * ELLE NE DISTINGUE RIEN, et c'est tout le propos d'`ADR-007` : c'est un
		 * CHEMIN, pas une raison.
		 */
		adresse: string;
	}

	const { notes, portail, pistes, adresse }: Proprietes = $props();

	/** L'UNIQUE point d'entrée. Une adresse entre, un état sort — ADR-007. */
	const resolution = $derived(adresseNonResolue(adresse));

	/**
	 * « OUVRIR UN TICKET D'ASSISTANCE » N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART.
	 * `CONFIGURATION_PAR_DEFAUT` laisse `portail_assistance` VIDE : sur une instance
	 * conforme au « produit qui commence vide », le bouton portait une destination
	 * vide et le clic rechargeait la page d'erreur — une des deux seules issues de
	 * l'écran.
	 */
	const assistanceJoignable = $derived(portail.trim() !== '');

	/**
	 * LE NOM DE L'ORGANISATION QUI HÉBERGE L'INSTANCE — clé `nom_organisation` de la
	 * table `parametres`, descendue par le contexte de coquille.
	 *
	 * CET ÉCRAN ÉCRIVAIT « Direction technique » EN DUR : non une donnée du jeu,
	 * mais le SEGMENT DE MARCHÉ du cadrage soudé dans une signature de produit.
	 * « Codicillus » n'est pas concerné : c'est le nom du LOGICIEL.
	 *
	 * CHAÎNE VIDE = L'INSTANCE NE S'EST PAS NOMMÉE, l'état normal d'une installation
	 * neuve : la signature rend « Codicillus » seul.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const nomOrganisation = $derived(identite?.nomOrganisation ?? '');
	const signature = $derived(
		nomOrganisation === '' ? 'Codicillus' : `Codicillus · ${nomOrganisation}`
	);

	/** RG-M17-01 — la restriction au périmètre public, au point d'entrée. */
	const publiques = $derived(notesPubliques(notes));

	const requete = $derived(resolution.requete.trim());
	const resultats = $derived(requete.length < 2 ? [] : chercher(publiques, requete));

	/**
	 * Le port fidèle de `rendre()` (`V-04:2130`) : sous deux caractères, l'aide
	 * reste visible et rien n'est cherché ; au-delà, elle s'efface dans les deux
	 * branches — résultats comme absence de résultat.
	 */
	const aideVisible = $derived(requete.length < 2);

	/** Les quatre guides les plus consultés — la sortie de secours (`V-04:2172`). */
	const populaires = $derived(
		publiques
			.slice()
			.sort((a, b) => b.vues - a.vues)
			.slice(0, 4)
	);
</script>

<!-- Le témoin de fraîcheur, fabrique unique. Le libellé accompagne TOUJOURS la
	jauge : l'information ne passe jamais par la couleur seule (RG-M18-09). -->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!-- Un texte, avec les termes de la requête marqués — `surligner()` du gel. -->
{#snippet marque(
	texte: string,
	q: string
)}{#each segmenter(texte, q) as s, rang (rang)}{#if s.marque}<mark>{s.texte}</mark
			>{:else}{s.texte}{/if}{/each}{/snippet}

<!--
	La carte de résultat, variante PUBLIQUE : une amputation, jamais une réécriture.
	Ni brouillon, ni visibilité, ni marquage de registre, ni rangement interne —
	seul le domaine est exposé.
-->
{#snippet carte(n: Note, q: string, index: number)}
	<!-- AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le nom
		accessible se construit sur `textContent`. -->
	<!-- prettier-ignore -->
	<a class="carte carte--publique" href={resolve(ROUTE_DU_GUIDE, { identifiant: n.id })} data-index={index}
		><div class="carte__haut"
			><h2 class="carte__titre">{@render marque(n.titre, q)}</h2><span class="past past--type">{n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type}</span
		></div
		>{#if n.type === 'Signet'}<div class="marque-signet" style="margin-bottom:var(--e-2)">↗ {n.url}</div>{/if}<p class="carte__extrait">{@render marque(n.extrait, q)}</p
		><div class="carte__signal"
			>{@render temoin(n)}<span class="carte__revision" data-jamais={n.revise ? undefined : 'oui'}>{n.revise ? `Révisé le ${n.revise}` : 'Jamais révisé'}</span
		></div
		><div class="carte__pied"
			><span class="carte__chemin"><b>{n.domaine}</b></span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues)} {accord(n.vues, 'consultation')}</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj} {accord(n.pj, 'pièce jointe', 'pièces jointes')}</span>{/if}</div
		></a
	>
{/snippet}

<!-- L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle composerait une adresse INTERNE sous la racine de déploiement. Tous
	les autres liens de la vue y passent. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a class="saut-contenu" href="#recherche">Aller à la recherche</a>

<div class="public app" id="app">
	<header class="chapeau">
		<a class="marque" href={resolve('/')} aria-label="Codicillus — accueil public">
			<span class="marque__sceau" aria-hidden="true">C</span>
			<span class="marque__nom">Codicillus</span>
		</a>
		<!-- Accès connexion : discret, pour les personnes qui ont déjà un compte. -->
		<a class="btn btn--discret" href={resolve('/connexion')}>Se connecter</a>
	</header>

	<main class="introuvable">
		<!--
			Message : pas de code d'erreur brut, pas de jargon. La formulation couvre
			indistinctement les deux cas — inexistant et non public — de sorte qu'aucune
			déduction n'est possible (ADR-007, RG-M18-14).
		-->
		<h1>Cette page n'est pas accessible.</h1>
		<p class="introuvable__txt">
			L'adresse demandée ne correspond à aucun guide public. Soit elle n'existe pas, soit elle a été
			déplacée, soit son contenu est réservé aux équipes techniques. Dans tous les cas, la recherche
			ci-dessous couvre l'ensemble de ce qui est ouvert à tous.
		</p>

		<div class="adresse-demandee">
			<span class="etiq">Adresse demandée</span>
			<span id="adresse">{resolution.adresse}</span>
		</div>

		<div class="champ-public introuvable__champ" id="recherche">
			<svg
				width="22"
				height="22"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
			>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="search"
				id="saisie"
				autocomplete="off"
				spellcheck="false"
				autofocus
				value={resolution.requete}
				placeholder="Que cherchiez-vous ?"
				aria-label="Rechercher dans les guides publics"
			/>
			<button
				class="champ-public__effacer"
				id="effacer"
				aria-label="Effacer la recherche"
				hidden={!resolution.requete}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
				>
			</button>
		</div>
		<p class="introuvable__aide" id="aide" hidden={!aideVisible}>
			Les termes de l'adresse ont été repris dans le champ. Modifiez-les si besoin.
		</p>

		<div class="resultats" id="resultats">
			{#if requete.length >= 2}{#if resultats.length === 0}<div class="zone-vide">
						<div class="zone-vide__titre">Rien de public pour <em>« {requete} »</em></div>
						<p>
							Essayez d'autres mots, ou décrivez votre besoin à l'assistance — votre demande
							signalera le guide manquant.
						</p>
						{#if pistes.length}<div class="reformuler">
								{#each pistes as piste (piste)}<button class="piste">{piste}</button>{/each}
							</div>{/if}
					</div>{:else}<div class="etiq" style="margin-bottom:var(--e-2)">
						{resultats.length}{resultats.length > 1
							? ' guides publics correspondent'
							: ' guide public correspond'}
					</div>
					{#each resultats.slice(0, 4) as n, index (n.id)}{@render carte(
							n,
							requete,
							index
						)}{/each}{/if}{/if}
		</div>

		<div class="issues">
			<a class="btn btn--principal" href={resolve('/')} id="accueil">Revenir à l'accueil</a>
			<!--
				L'adresse du portail d'assistance arrive par la propriété `portail`, jamais
				fabriquée ici. Vide — l'état d'une instance dont personne n'a renseigné la
				clé —, le bouton n'est pas ÉMIS.
			-->
			{#if assistanceJoignable}<a class="btn" href={portail} id="ticket">
					Ouvrir un ticket d'assistance
					<svg
						width="13"
						height="13"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><path d="M6 3h7v7M13 3L4 12" /></svg
					>
				</a>{/if}
		</div>

		<!--
			Rattrapage : une sortie concrète plutôt qu'une impasse — ET LA SECTION ENTIÈRE
			PART AVEC SA LISTE. Le canal de cette vue est le composant d'erreur de la
			racine, qui n'a pas de chargeur et lui passe `notes={[]}` : la liste était
			donc vide sur CHAQUE 404, sous un titre qui annonçait « Les guides les plus
			consultés ».
		-->
		{#if populaires.length}<section class="rattrapage">
				<span class="etiq">Les guides les plus consultés</span>
				<ul class="rattrapage__liste" id="populaires">
					{#each populaires as n (n.id)}<li>
							<a href={resolve(ROUTE_DU_GUIDE, { identifiant: n.id })}
								><span class="rattrapage__nom">{n.titre}</span>{@render temoin(n)}</a
							>
						</li>{/each}
				</ul>
			</section>{/if}
	</main>

	<footer class="pied-public">
		<div class="pied-public__int">
			<span class="etiq">{signature}</span>
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
