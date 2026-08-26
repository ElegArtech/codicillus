<script lang="ts">
	/**
	 * V-04 — Page non trouvée, espace public. Servie à TOUTE adresse non résolue.
	 *
	 * PAS DE ROUTE PROPRE (`docs/routes.md` §3.1) : la réponse est un 404 rendu
	 * À L'ADRESSE DEMANDÉE, qui reste affichée. `/guides/` nu en fait partie —
	 * il n'existe pas d'index public des guides.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LE CHEMIN DE CODE UNIQUE — ADR-007, ET C'EST LA RAISON D'ÊTRE DE CE LOT
	 *
	 * V-04 et V-26 sont dans le même lot par OBLIGATION (`docs/releve-vues.md`
	 * §9, R-7) : « Deux lots parallèles y écrivant chacun leur branche est la
	 * manière la plus sûre de faire apparaître la branche “interdit” que l'ADR
	 * interdit. » Les deux vues appellent `adresseNonResolue()` de
	 * `$lib/public/adresse-non-resolue`, dont la SEULE entrée est le chemin
	 * demandé : il n'existe ni paramètre de cas, ni drapeau d'interdiction, ni
	 * exception typée qui remonterait jusqu'ici. Rien, dans ce composant, ne
	 * peut savoir POURQUOI l'adresse n'a rien rapporté.
	 *
	 * Le commentaire du gel le dit dans les mêmes termes (`V-04:2219`) : « Les
	 * deux premiers cas doivent produire un rendu strictement identique : c'est
	 * la vérification la plus importante de cette vue. »
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS, ET IL FAUT LE DIRE. Il rend un ÉTAT DE
	 * MAQUETTE. Il ne résout aucun droit, n'interroge aucune base et ne mesure
	 * aucun temps de réponse. `RG-ACC-04` — indiscernabilité de corps, d'en-têtes,
	 * de code ET DE TEMPS — relève de la batterie 6 (`pnpm test:etancheite`) et
	 * du lot T-011, en criticité haute. L'indiscernabilité TEMPORELLE n'est
	 * mesurée par aucun instrument à ce jour (`docs/releve-vues.md` §10, M-5).
	 * Ce lot ne la déclare pas tenue. `P-09` ne l'est pas davantage.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PÉRIMÈTRE PUBLIC — RG-M17-01
	 *
	 * Le corpus est réduit aux notes publiques ICI, au point d'entrée unique de
	 * la vue, et non au moment de l'affichage : `notesPubliques(notes)`, à
	 * l'endroit exact où la maquette écrit `window.CORPUS = window.corpusPublic()`
	 * (`V-04:1975`). Aucune expression de ce fichier n'atteint une note interne,
	 * pas même par erreur de branchement — elles n'existent plus pour lui.
	 * `notesPubliques()` vit dans `$lib/public/recherche` et EXIGE son argument :
	 * aucun corpus de démonstration ne peut plus s'y substituer.
	 *
	 * PAS DE COQUILLE. `docs/releve-vues.md` §5.1 : V-01 à V-06 et V-09 n'en
	 * portent pas — sept vues sur trente-sept. Le gabarit de `$lib/coquille`
	 * n'est donc pas employé, et la page est autonome.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011. Le squelette rend l'ÉTAT,
	 * jamais la transition. Les notifications de la maquette — ouverture du
	 * portail d'assistance, retour à l'accueil, ouverture d'un guide — sont du
	 * comportement et relèvent de T-017 : `div.notifs` est rendu vide, comme la
	 * référence le montre à l'instant capturé.
	 *
	 * LES ADRESSES DU GEL SONT DÉSORMAIS DE VRAIES ADRESSES. `ARB-013` retire les
	 * lignes `/url:` de la comparaison de structure précisément pour que le
	 * produit porte SES adresses ; la campagne de câblage du 21/08/2026 lève la
	 * réserve qui les avait laissées à `#`, et c'est la seule modification
	 * qu'elle autorise dans une vue. Elles passent toutes par `resolve()`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-04.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-04 --installer` et identique à l'octet au
	 * second bloc `<style>` de la maquette gelée. Le seul `style=` du fichier —
	 * `margin-bottom:var(--e-2)` — figure à l'ensemble clos du gel (ARB-016).
	 */
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Note } from '../../seeds/corpus';
	import { adresseNonResolue } from '$lib/public/adresse-non-resolue';
	import { chercher, nombreFr, notesPubliques, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { vocabulaireRendu } from '$lib/vocabulaire';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);

	/**
	 * LE MOTIF DE ROUTE, ÉCRIT EN CONSTANTE — `svelte/no-navigation-without-resolve`
	 * inspecte l'EXPRESSION du `href`. Même écriture qu'à `V-07:455`.
	 */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-04')`, variante complète. */
		notes: readonly Note[];
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — « adresse externe configurée en
		 * console » (`V-04:2205`). Elle EXISTE désormais : la table `parametres` la
		 * porte sous la clé `portail_assistance`. Cet écran n'a pas de route propre
		 * — il est rendu par le composant d'erreur de la racine, dont le seul canal
		 * de donnée est le chargeur du gabarit —, et ce composant la passe
		 * TOUJOURS : la propriété est donc EXIGÉE, et le jeu de démonstration ne
		 * peut plus tenir lieu de défaut.
		 */
		portail: string;
		/**
		 * LES PISTES DE REFORMULATION — une DONNÉE, et elle n'a pas de source ici.
		 *
		 * La vue en portait cinq en dur, tirées du gel. Chacune ouvrait
		 * `/recherche?q=…` à zéro résultat sur une instance qui ne porte ni « salle
		 * de réunion » ni « support ». Une page d'erreur n'a pas de chargeur : rien
		 * ne peut les dériver ici, et une liste vide ne rend pas le bloc.
		 *
		 * Même forme que `reprises` de V-26, et EXIGÉE — `+error.svelte` la passe.
		 */
		pistes: readonly string[];
		/**
		 * L'ADRESSE RÉELLEMENT DEMANDÉE — la seule entrée d'`adresseNonResolue()`.
		 *
		 * La vue n'avait aucun moyen de la recevoir : elle retombait sur la table
		 * `ADRESSES` de la planche, et TOUTE adresse cassée de l'espace public
		 * annonçait « Adresse demandée /guides/plan-de-reprise-volet-bases », avec
		 * la requête qui s'en dérive déjà saisie dans le champ de recherche.
		 *
		 * Absente, la constante de la planche reste le défaut : le banc ne bouge
		 * pas d'un pixel. Fournie — par le composant d'erreur de la racine, qui lit
		 * `page.url.pathname` —, elle l'emporte.
		 *
		 * ELLE NE DISTINGUE RIEN, et c'est tout le propos d'`ADR-007` : c'est un
		 * CHEMIN, pas une raison. Le rendu est le même que l'adresse désigne un
		 * guide inexistant ou un guide non public.
		 */
		adresse?: string;
	}

	const { vecteur, notes, portail, pistes, adresse }: Proprietes = $props();

	/**
	 * LES TROIS ADRESSES DE LA PLANCHE DE REVUE, ET RIEN D'AUTRE.
	 *
	 * Ce sont des données de MAQUETTE (`V-04:2223-2227`) : la planche ne choisit
	 * pas un comportement, elle choisit QUELLE ADRESSE a été demandée. Le rendu,
	 * lui, ne dépend que de cette chaîne — c'est tout le propos d'ADR-007.
	 */
	const ADRESSES_PAR_DEFAUT = '/guides/plan-de-reprise-volet-bases';
	const ADRESSES: Record<string, string> = {
		inexistant: '/guides/reinitialiser-le-badge-daccess',
		prive: ADRESSES_PAR_DEFAUT,
		nu: '/guides/'
	};

	/**
	 * LA POSITION QUE LA PLANCHE ATTEINT RÉELLEMENT, ET ELLE N'EST PAS CELLE
	 * QU'ON CROIT — relevé au navigateur, dans les conditions du banc.
	 *
	 * La maquette s'initialise sur `appliquerCas("prive")` (`V-04:2242`) alors
	 * que le bouton coché au balisage est `inexistant` (`V-04:762`). Le banc
	 * applique le vecteur complet mais ne déclenche `change` que sur un bouton
	 * QUI N'EST PAS DÉJÀ COCHÉ (le module de capture du banc, `reglerPlanche`) :
	 * l'état `cas-inexistant` laisse donc la page sur le réglage initial, et la
	 * référence y affiche l'adresse du cas `prive`.
	 *
	 * Ce n'est pas un défaut : les deux cas DOIVENT rendre le même écran, et le
	 * gel le vérifie ainsi. Mais le rendu de `cas-inexistant` est bien celui de
	 * `prive`, et le porter autrement ferait diverger l'unique ligne d'adresse.
	 * Le fait est remonté au rapport du lot.
	 */
	const CAS_INITIAL = 'prive';
	const CAS_COCHE_AU_BALISAGE = 'inexistant';

	const cas = $derived(
		typeof vecteur?.cas === 'string' && vecteur.cas !== CAS_COCHE_AU_BALISAGE
			? vecteur.cas
			: CAS_INITIAL
	);

	/** L'UNIQUE point d'entrée. Une adresse entre, un état sort — ADR-007. */
	const resolution = $derived(adresseNonResolue(adresse ?? ADRESSES[cas] ?? ADRESSES_PAR_DEFAUT));

	/**
	 * « OUVRIR UN TICKET D'ASSISTANCE » N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART.
	 *
	 * Même règle que V-06, et pour la même raison : `CONFIGURATION_PAR_DEFAUT`
	 * laisse `portail_assistance` VIDE, et la table reste vide tant que personne
	 * ne l'a renseignée en console. Sur une instance conforme au « produit qui
	 * commence vide », le bouton portait une destination vide et le clic
	 * rechargeait la page d'erreur — une des deux seules issues de l'écran.
	 * Ce qui n'a pas de contrepartie n'est pas émis.
	 */
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

<!--
	Le témoin de fraîcheur, fabrique unique de la vue — `temoinFraicheur()` du
	gel. Le libellé accompagne TOUJOURS la jauge : l'information ne passe jamais
	par la couleur seule (RG-M18-09).
-->
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
	La carte de résultat, variante PUBLIQUE : une amputation, jamais une
	réécriture. Ni brouillon, ni visibilité, ni marquage de registre, ni
	rangement interne — seul le domaine est exposé.
-->
{#snippet carte(n: Note, q: string, index: number)}
	<!--
		AUCUN BLANC ENTRE LES NŒUDS DE LA CARTE, et il doit le rester : le relevé
		d'ordre de tabulation du niveau 1 construit le nom accessible sur
		`textContent`, où un blanc inséré par le formateur se voit. Mesuré : trois
		états en échec de structure pour cette seule cause.
	-->
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
			><span class="carte__chemin"><b>{n.domaine}</b></span><span class="sep">·</span><span>{n.auteur}</span><span class="sep">·</span><span>{nombreFr(n.vues)} consultations</span
			>{#if n.pj}<span class="sep">·</span><span>{n.pj} {n.pj > 1 ? 'pièces jointes' : 'pièce jointe'}</span>{/if}</div
		></a
	>
{/snippet}

<!--
	L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle compose une adresse INTERNE sous la racine de déploiement, quand
	celle-ci est une adresse absolue lue dans la table `parametres`. La règle est
	donc levée pour ce fichier, et pour elle seule — même levée que `V-03.svelte`,
	et pour la même raison. Tous les autres liens de la vue passent par
	`resolve()`.
-->
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
			indistinctement les deux cas — inexistant et non public — de sorte
			qu'aucune déduction n'est possible (ADR-007, RG-M18-14).
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
				L'adresse du portail d'assistance est une donnée de configuration
				(« adresse externe configurée en console », `V-04:2205`). Elle est
				désormais portée par la table `parametres` — clé `portail_assistance` —
				et arrive par la propriété `portail`, jamais fabriquée ici. Vide — l'état
				d'une instance dont personne n'a renseigné la clé —, le bouton n'est pas
				ÉMIS : un lien d'assistance sans destination n'est pas une issue.
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
			Rattrapage : une sortie concrète plutôt qu'une impasse — ET LA SECTION
			ENTIÈRE PART AVEC SA LISTE. Le canal de cette vue est le composant
			d'erreur de la racine, qui n'a pas de chargeur et lui passe `notes={[]}` :
			la liste était donc vide sur CHAQUE 404, sous un titre qui annonçait
			« Les guides les plus consultés ». Un cadre qui promet une sortie et ne
			contient rien est pire qu'un cadre absent — la même règle que le bloc de
			reformulation dix lignes plus haut.
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
