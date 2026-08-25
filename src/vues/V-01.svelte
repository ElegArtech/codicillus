<script lang="ts">
	/**
	 * V-01 — Accueil public, sans session. Route `/` en anonyme
	 * (`docs/routes.md` §3.1). La même adresse sert V-07 en session : les deux
	 * branches sont SÉQUENCÉES, jamais parallèles (DAG K-1, `docs/releve-vues.md`
	 * §9 R-5). Ce lot écrit la branche anonyme ; P-15 ajoutera l'autre.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PÉRIMÈTRE PUBLIC — RG-M17-01, ET IL EST APPLIQUÉ AU POINT D'ENTRÉE
	 *
	 * « Le corpus est réduit aux notes publiques ici, au point d'entrée unique de
	 * la vue, et non au moment de l'affichage. Aucune fonction de cette page ne
	 * peut donc atteindre une note interne, pas même par erreur de branchement »
	 * (`V-01:998`, commentaire du gel). Le port respecte l'ENDROIT autant que la
	 * règle : `notesPubliques(notes)` est calculé une fois, en tête, et TOUTES
	 * les expressions de ce fichier en descendent. `notesPubliques()` vit dans
	 * `$lib/public/recherche` : elle filtre le jeu qu'on lui donne, et elle
	 * l'EXIGE — aucun corpus de démonstration ne peut plus s'y substituer.
	 *
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE nourri du
	 * jeu de semence. L'étanchéité RÉELLE de l'espace public — matrice toutes
	 * routes × tous personas, y compris par adresse construite — est la
	 * batterie 6 (`pnpm test:etancheite`), livrée par T-012b le 20/08/2026 en criticité
	 * haute. Ce lot ne déclare tenues ni `RG-ACC-01`, ni `RG-ACC-04`, ni `P-09`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * PAS DE COQUILLE, ET QUATRE FENÊTRES
	 *
	 * `docs/releve-vues.md` §5.1 : V-01 à V-06 et V-09 ne portent pas la coquille.
	 * La page est autonome, et `$lib/coquille` n'est pas employé.
	 *
	 * V-01 est contrôlée sur QUATRE fenêtres — 1440×900, 1024×768, 768×1024,
	 * 360×780 — par ARB-009, qui l'ajoute aux cinq vues dérivées de RG-M18-13
	 * parce qu'elle porte un champ de recherche, donc le cas d'usage « chercher ».
	 * Sept états × quatre fenêtres = 28 couples.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT — ARB-011. La frappe au fil de l'eau,
	 * la bascule vers V-02, l'ouverture d'un guide et le bouton « Réessayer »
	 * sont du comportement : ils relèvent de T-017. Le squelette rend l'état que
	 * la référence montre à l'instant capturé, et `div.notifs` reste vide.
	 *
	 * LES ADRESSES DU GEL SONT DÉSORMAIS DE VRAIES ADRESSES. `ARB-013` retire les
	 * lignes `/url:` de la comparaison de structure précisément pour que le
	 * produit porte SES adresses ; la campagne de câblage du 21/08/2026 lève la
	 * réserve qui les avait laissées à `#`, et c'est la seule modification
	 * qu'elle autorise dans une vue. Elles passent toutes par `resolve()`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-01.css` (P-6.3), posé par
	 * `node verif/feuilles-de-vue.mjs V-01 --installer`. Le seul `style=` du
	 * fichier — `font-family:var(--f-donnee)` — figure à l'ensemble clos du gel
	 * (ARB-016).
	 */
	import { resolve } from '$app/paths';
	import type { Note } from '../../seeds/corpus';
	import { chercher, nombreFr, notesPubliques, segmenter } from '$lib/public/recherche';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES — même raison qu'à `V-07:455` et
	 * sur `src/lib/coquille/Rail.svelte` : `svelte/no-navigation-without-resolve`
	 * inspecte l'EXPRESSION du `href`, et une adresse composée à la main lui est
	 * opaque. `resolve()` est aussi ce qui rend l'adresse juste sous une racine de
	 * déploiement.
	 *
	 * UN GUIDE S'OUVRE EN `/guides/{identifiant}`, JAMAIS EN `/notes/{…}` : cet
	 * écran est servi à un visiteur SANS SESSION, qui n'a aucun droit sur
	 * l'adresse interne. C'est déjà le choix du chargeur de `/guides/{id}` pour
	 * les liens internes d'un corps public.
	 */
	const ROUTE_DU_GUIDE = '/guides/[identifiant]' as const;

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-01')`, variante « lecture ». */
		notes: readonly Note[];
		/**
		 * L'ADRESSE DU PORTAIL D'ASSISTANCE — « adresse externe configurée en
		 * console » (`V-04:2205`). Elle est une donnée d'INSTANCE : la table
		 * `parametres` la porte sous la clé `portail_assistance`, et le chargeur de
		 * la route l'y lit.
		 *
		 * ELLE EST EXIGÉE, ET C'EST LE CORRECTIF. Son défaut était l'adresse du jeu
		 * de démonstration : une route qui aurait oublié de la passer aurait servi
		 * `assistance.exemple.fr` comme un fait, sans que rien ne proteste. Exigée,
		 * une route qui l'oublie ne compile plus. Vide — ce que rend une instance
		 * dont personne n'a renseigné la clé —, aucun appel à l'assistance n'est
		 * ÉMIS : un lien sans destination n'est pas une issue.
		 */
		portail: string;
	}

	const { vecteur, notes, portail }: Proprietes = $props();

	/**
	 * « OUVRIR UN TICKET D'ASSISTANCE » N'EST ÉMIS QUE S'IL MÈNE QUELQUE PART —
	 * même règle et même écriture qu'en V-04 et V-06. `CONFIGURATION_PAR_DEFAUT`
	 * laisse `portail_assistance` VIDE, et la table le reste tant que personne ne
	 * l'a renseignée en console : les trois boutons de cet écran portaient alors
	 * une destination vide, et le clic rechargeait la page d'accueil.
	 */
	const assistanceJoignable = $derived(portail.trim() !== '');

	const reglage = $derived(vecteur ?? {});

	/**
	 * Le port des deux commutateurs de la planche (`V-01:1240-1254`). Ils ne
	 * portent AUCUN comportement : ils règlent deux attributs de données et le
	 * contenu du champ. La feuille de la vue fait le reste.
	 */
	const etat = $derived(typeof reglage['etat'] === 'string' ? reglage['etat'] : 'nominal');
	const frappe = $derived(typeof reglage['frappe'] === 'string' ? reglage['frappe'] : 'rien');

	const donneeEtat = $derived(
		etat === 'chargement' ? 'chargement' : etat === 'vide' ? 'vide' : 'nominal'
	);
	const donneeGuides = $derived(etat === 'erreur' ? 'erreur' : 'ok');

	const saisie = $derived(
		frappe === 'trouve' ? 'mot de passe' : frappe === 'rien-trouve' ? 'note de frais' : ''
	);

	/** RG-M17-01 — la restriction au périmètre public, au point d'entrée. */
	const publiques = $derived(notesPubliques(notes));

	/**
	 * Le relevé de confiance, CALCULÉ sur le corpus public et jamais saisi
	 * (P-02 : aucune valeur illustrative). Il est établi au chargement, donc
	 * indépendamment de l'état de la liste — la référence le montre inchangé
	 * jusque dans l'état « aucun contenu public ».
	 */
	const publiesFrais = $derived(publiques.filter((n) => n.fraicheur === 'frais').length);

	const requete = $derived(saisie.trim());
	const enRecherche = $derived(requete.length >= 2);

	/** Guides populaires — notes publiques classées par consultations. */
	const populaires = $derived(publiques.slice().sort((a, b) => b.vues - a.vues));
	/** Résultats au fil de la frappe. Le filtre public est déjà appliqué en amont. */
	const resultats = $derived(enRecherche ? chercher(publiques, requete) : []);

	const listeEnErreur = $derived(donneeGuides === 'erreur');
	const listeVide = $derived(donneeEtat === 'vide' || populaires.length === 0);

	/**
	 * LA BASCULE VERS LA RECHERCHE PUBLIQUE COMPLÈTE — V-02, `/recherche`.
	 *
	 * `resolve()` n'accepte pas de chaîne de requête : elle est concaténée après,
	 * exactement comme `src/lib/coquille/Rail.svelte` le fait pour ses nœuds. `q`
	 * est le paramètre honoré en anonyme (`docs/routes.md:248`), et la requête
	 * traverse donc l'écran d'accueil jusqu'à la recherche complète.
	 */
	const suffixeDeRequete = $derived(requete ? `?q=${encodeURIComponent(requete)}` : '');
</script>

<!--
	Le témoin de fraîcheur, fabrique unique de la vue. Le libellé accompagne
	TOUJOURS la jauge : l'information ne passe jamais par la couleur seule
	(RG-M18-09).
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
	L'ADRESSE DU PORTAIL D'ASSISTANCE EST EXTERNE, et `resolve()` ne s'y applique
	pas : elle compose une adresse INTERNE sous la racine de déploiement, quand
	celle-ci est une adresse absolue lue dans la table `parametres`. La règle est
	donc levée pour ce fichier, et pour elle seule — même levée que `V-03.svelte`,
	et pour la même raison. Tous les autres liens de la vue passent par
	`resolve()`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a class="saut-contenu" href="#recherche">Aller à la recherche</a>

<div class="public app" id="app" data-etat={donneeEtat} data-guides={donneeGuides}>
	<header class="chapeau">
		<div class="marque">
			<div class="marque__sceau" aria-hidden="true">C</div>
			<div class="marque__nom">Codicillus</div>
		</div>
		<!-- Accès connexion : discret, pour les personnes qui ont déjà un compte. -->
		<a class="btn btn--discret" href={resolve('/connexion')}>Se connecter</a>
	</header>

	<section class="hamecon">
		<div class="hamecon__sur etiq">Documentation de la direction technique</div>
		<h1>Les réponses aux questions qu'on pose au support.</h1>
		<p class="hamecon__sous">
			Accès aux applications, mots de passe, salles de réunion, réseau, postes de travail : les
			guides écrits par les équipes techniques, ouverts à tous. Chaque guide indique la date à
			laquelle il a été vérifié pour la dernière fois.
		</p>

		<div class="champ-public" id="recherche">
			<svg
				width="24"
				height="24"
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
				value={saisie}
				placeholder="Que cherchez-vous ?"
				aria-label="Rechercher dans les guides publics"
			/>
			<button
				class="champ-public__effacer"
				id="effacer"
				aria-label="Effacer la recherche"
				hidden={!requete}
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

		<div class="sous-champ">
			<span class="rassurance">
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="2"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg
				>
				Pas besoin de compte pour consulter
			</span>
			<span class="releve" id="releve">
				<b>{publiques.length} guides publics</b> · <b>{publiesFrais}</b> vérifiés il y a moins d'un mois
			</span>
		</div>
	</section>

	<main class="corps-public">
		<!-- ---------- Guides populaires ---------- -->
		<section id="bloc-guides">
			<div class="section__tete">
				<h2 class="section__nom" id="titre-liste">
					{enRecherche ? 'Résultats' : 'Les guides les plus consultés'}
				</h2>
				<span class="etiq" id="sous-liste"
					>{#if enRecherche}{resultats.length} résultat{resultats.length > 1 ? 's' : ''} dans les guides
						publics{:else if !listeEnErreur && !listeVide}{populaires.length}
						guides ouverts à tous{/if}</span
				>
			</div>

			<div class="si-nominal" id="zone-liste">
				{#if enRecherche}{#if resultats.length === 0}<div class="zone-vide">
							<div class="zone-vide__titre">Aucun guide ne répond à cette question</div>
							<p>
								Rien de public ne correspond à <em>« {requete} »</em>. L'assistance saura vous
								répondre, et votre demande signalera le guide manquant.
							</p>
							{#if assistanceJoignable}<a class="btn btn--principal" href={portail}
									>Ouvrir un ticket d'assistance</a
								>{/if}
						</div>{:else}
						<!--
							AUCUN BLANC ENTRE LES NŒUDS DE LA LISTE, et il doit le rester : le
							relevé d'ordre de tabulation du niveau 1 construit le nom accessible
							sur `textContent`, où un blanc inséré par le formateur se voit.
							Mesuré : douze couples de V-01 en échec de structure pour cette seule
							cause.
						-->
						<!-- prettier-ignore -->
						<div class="res-public">{#each resultats as n (n.id)}<a class="res" href={resolve(ROUTE_DU_GUIDE, { identifiant: n.id })}
							><h3 class="res__titre">{@render marque(n.titre, requete)}</h3><p class="res__extrait">{@render marque(n.extrait, requete)}</p><div class="res__pied"
								>{@render temoin(n)}<span>{n.domaine}</span><span style="font-family:var(--f-donnee)">{nombreFr(n.vues)} consultations</span
							></div
						></a>{/each}</div>
						<!--
							Bascule vers la recherche publique complète (V-02). Le lien est rendu ;
							son effet est du comportement, donc du temps 3.
						-->
						<div class="passe-v02">
							Affiner par domaine, par type de guide ou par fraîcheur<a
								class="btn"
								href="{resolve('/recherche')}{suffixeDeRequete}">Ouvrir la recherche complète</a
							>
						</div>{/if}{:else if listeEnErreur}<!--
						La recherche reste utilisable même si les guides échouent : une zone en
						erreur ne fait pas tomber la page (RG-M18-04).
					-->
					<div class="zone-erreur">
						<div class="zone-erreur__titre">La liste des guides ne s'affiche pas</div>
						<p>
							Le service qui établit le classement ne répond pas pour le moment. La recherche
							ci-dessus fonctionne normalement : tapez votre question.
						</p>
						<button class="btn">Réessayer</button>
					</div>{:else if listeVide}<div class="zone-vide">
						<div class="zone-vide__titre">Aucun guide n'est encore publié</div>
						<p>
							Les équipes techniques n'ont pas encore ouvert de guide au public. En attendant,
							l'assistance répond directement à vos questions.
						</p>
						{#if assistanceJoignable}<a class="btn btn--principal" href={portail}
								>Ouvrir un ticket d'assistance</a
							>{/if}
					</div>{:else}
					<!-- Même raison que ci-dessus : aucun blanc entre les nœuds. -->
					<!-- prettier-ignore -->
					<div class="guides">{#each populaires as n, rang (n.id)}<a class="guide" href={resolve(ROUTE_DU_GUIDE, { identifiant: n.id })}
						><span class="guide__rang">{String(rang + 1).padStart(2, '0')}</span><h3 class="guide__titre">{n.titre}</h3><p class="guide__extrait">{n.extrait}</p><div class="guide__pied"
							>{@render temoin(n)}<span>{n.domaine}</span><span class="guide__vues">{nombreFr(n.vues)} consultations</span
						></div
					></a>{/each}</div>{/if}
			</div>

			<div class="si-chargement guides" aria-hidden="true">
				<div class="esquisse esq-guide"></div>
				<div class="esquisse esq-guide"></div>
				<div class="esquisse esq-guide"></div>
			</div>
		</section>

		<!-- ---------- Repli vers l'assistance ----------
			 L'ASIDE ENTIER EST GARDÉ, pas seulement son lien : sans portail
			 configuré, garder « Vous ne trouvez pas ? » et son paragraphe
			 laisserait un titre qui pose une question sans issue. Même geste
			 qu'en V-06, qui garde tout son `.auth__pied`. -->
		{#if assistanceJoignable}
			<aside class="repli">
				<div>
					<h2 class="repli__titre">Vous ne trouvez pas ?</h2>
					<p class="repli__txt">
						Ouvrez un ticket auprès de l'assistance. Indiquez ce que vous cherchiez : c'est souvent
						ce qui déclenche l'écriture du guide manquant.
					</p>
				</div>
				<a class="btn btn--principal" href={portail} id="ticket">
					Ouvrir un ticket d'assistance
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
	</main>

	<footer class="pied-public">
		<div class="pied-public__int">
			<span class="etiq">Codicillus · Direction technique</span>
			<a href={resolve('/connexion')}>Se connecter</a>
		</div>
	</footer>
</div>

<div class="notifs" id="notifs" role="status" aria-live="polite"></div>
