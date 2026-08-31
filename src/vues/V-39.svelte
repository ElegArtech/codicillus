<script lang="ts">
	/**
	 * V-39 — États vides, de chargement et d'erreur. Catalogue transverse, sans
	 * adresse propre : V-39 est une SECTION de V-41 (`ARB-002`).
	 *
	 * CETTE VUE EST LA RÉFÉRENCE DES QUATRE ÉTATS DE ZONE DE `RG-M18-03` : dix états
	 * vides, six esquisses de chargement, quatre portées d'erreur. Le quatrième état
	 * — « sans droit » — n'a pas de composant : l'action absente n'est pas rendue
	 * (`ADR-011`).
	 *
	 * AUCUNE MINUTERIE (`ARB-011`) : le battement des esquisses est une animation CSS
	 * du gel, et l'état `anim` ne fait que la suspendre par `animation-play-state`.
	 *
	 * Le cadre vient du gabarit (`ARB-015`). Le style est dans `src/socle.css` et
	 * `src/vues/V-39.css` ; les styles en ligne sont ceux du gel.
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		etat: string;
		notes: readonly Note[];
		/** LES QUATRE SOURCES DE LA COQUILLE. Absentes, les constantes du jeu de
		    semence s'appliquent ; fournies par une route, elles l'emportent. */
		/** Les univers déclarés. Absente, `UNIVERS` du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, `DOMAINES` du jeu de semence. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, `MOI` du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, `INSTANCE` du jeu de semence. */
		instance?: EtatDInstance;
	}

	const {
		etat,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE
	}: Proprietes = $props();

	/**
	 * L'état `anim` suspend le battement des esquisses : la maquette le pose par
	 * `animation-play-state` sur chaque `.sq`, `.sq-noeud` et `.sq-arete`.
	 */
	const pause = $derived(etat === 'anim' ? ';animation-play-state:paused' : '');

	interface EtatVide {
		readonly ou: string;
		readonly note: string;
		readonly titre: string;
		readonly txt: string;
		readonly actions: readonly string[];
		readonly sobre: boolean;
	}

	const VIDES: readonly EtatVide[] = [
		{
			ou: 'V-07',
			note: 'Corpus entièrement vide',
			titre: 'Votre base de connaissances est vide',
			txt:
				"Rien n'y est encore écrit. Le plus rapide, quand le patrimoine existe déjà quelque part, " +
				'est de le reprendre en bloc plutôt que de recommencer.',
			actions: ["Importer l'existant", 'Créer la première note'],
			sobre: false
		},
		{
			ou: 'V-11',
			note: 'Domaine sans note',
			titre: 'Ce domaine ne contient aucune note',
			txt:
				"Il vient d'être créé et attend son premier contenu. Vous en êtes référent : c'est à vous " +
				"d'ouvrir le bal.",
			actions: ['Créer une note', 'Importer dans ce domaine'],
			sobre: false
		},
		{
			ou: 'V-13',
			note: 'Dossier vide',
			titre: 'Ce dossier est vide',
			txt: "Aucune note n'y est rangée pour l'instant, et il ne contient aucun sous-dossier.",
			actions: ['Créer une note ici', 'Créer un sous-dossier'],
			sobre: false
		},
		{
			ou: 'V-07',
			note: 'Aucune révision en attente',
			titre: "Rien à revoir aujourd'hui",
			txt: 'Toutes les demandes de révision de votre domaine ont été traitées.',
			actions: [],
			sobre: true
		},
		{
			ou: 'V-14',
			note: 'Aucun rétrolien',
			titre: 'Aucune note ne pointe vers celle-ci',
			txt:
				"Elle existe hors du tissu documentaire : personne n'y arrivera par navigation, seulement " +
				'par recherche.',
			actions: [],
			sobre: true
		},
		{
			ou: 'V-14',
			note: 'Aucune relation',
			titre: 'Aucune relation déclarée',
			txt:
				"Cette note n'est reliée à aucune autre. Déclarer une relation la fait entrer dans la " +
				'cartographie.',
			actions: ['Ajouter une relation'],
			sobre: false
		},
		{
			ou: 'V-19',
			note: 'Graphe sans relation',
			titre: 'Aucune relation dans ce périmètre',
			txt:
				"La cartographie n'a pas de données propres : elle se nourrit des relations déclarées sur " +
				'les notes.',
			actions: ['Voir comment créer une relation'],
			sobre: false
		},
		{
			ou: 'V-22',
			note: 'Aucun signet',
			titre: 'Aucun signet dans ce domaine',
			txt:
				"Un signet est un lien web que l'équipe veut retrouver : documentation d'éditeur, page " +
				"d'état d'un fournisseur.",
			actions: ['Ajouter un signet'],
			sobre: false
		},
		{
			ou: 'V-25',
			note: 'Aucune distinction obtenue',
			titre: 'Six distinctions, aucune encore obtenue',
			txt:
				'Elles restent toutes affichées avec leur progression : une zone vide découragerait au ' +
				"moment précis où l'on décide de contribuer.",
			actions: [],
			sobre: true
		},
		{
			ou: 'V-12',
			note: 'Liste filtrée vide',
			titre: 'Aucune note ne correspond à ces filtres',
			txt: 'Ce domaine en contient 18, mais aucune ne réunit les conditions retenues.',
			actions: ['Réinitialiser les filtres'],
			sobre: false
		}
	];

	const SQUELETTES: readonly (readonly [string, string, string])[] = [
		['V-08', 'Carte de résultat', 'carte'],
		['V-12', 'Ligne de liste', 'liste'],
		['V-14', 'Panneau latéral', 'panneau'],
		['V-07', 'Tableau de bord', 'bord'],
		['V-19', 'Graphe', 'graphe'],
		['V-21', 'Arborescence', 'arbre']
	];

	const LIGNES_LISTE = [78, 62, 70, 54];
	/** Les couples étiquette / valeur de l'esquisse de panneau. */
	const PILES_PANNEAU: readonly (readonly [string, string])[] = [
		['34%', '82%'],
		['28%', '68%'],
		['40%', '90%']
	];
	/** Les nœuds de l'esquisse de graphe : abscisse, ordonnée, diamètre. */
	const NOEUDS: readonly (readonly [number, number, number])[] = [
		[50, 50, 30],
		[24, 28, 20],
		[76, 26, 22],
		[22, 74, 18],
		[78, 72, 24],
		[50, 88, 16]
	];
	const ARETES: readonly (readonly [number, number])[] = [
		[0, 1],
		[0, 2],
		[0, 3],
		[0, 4],
		[4, 5]
	];
	/** Les branches de l'esquisse d'arborescence : profondeur, largeur. */
	const BRANCHES: readonly (readonly [number, number])[] = [
		[0, 72],
		[1, 58],
		[1, 64],
		[2, 48],
		[0, 66],
		[1, 54]
	];

	const ARETES_RENDUES = ARETES.flatMap(([rangDepart, rangArrivee]) => {
		const depart = NOEUDS[rangDepart];
		const arrivee = NOEUDS[rangArrivee];
		if (!depart || !arrivee) return [];
		const dx = (arrivee[0] - depart[0]) * 3.2;
		const dy = (arrivee[1] - depart[1]) * 2.08;
		return [
			{
				cle: `${rangDepart}-${rangArrivee}`,
				gauche: depart[0],
				haut: depart[1],
				longueur: Math.sqrt(dx * dx + dy * dy),
				angle: (Math.atan2(dy, dx) * 180) / Math.PI
			}
		];
	});

	/** Les quatre traductions : ce qu'on ne dit jamais, ce qu'on dit plutôt. */
	const LANGUE: readonly (readonly [string, string])[] = [
		['Erreur 500 — Internal Server Error', "Le serveur n'a pas pu traiter votre demande."],
		['Request timeout after 30000ms', 'Le serveur a mis trop de temps à répondre.'],
		['Upload failed: entity too large', 'Ce fichier dépasse la taille maximale de 25 Mo.'],
		[
			'NullPointerException at line 214',
			"Une erreur inattendue s'est produite. Elle a été signalée à l'administration."
		],
		['Unauthorized', "Vous n'avez pas accès à cette note."]
	];
</script>

{#snippet vignette(ou: string, note: string, corps: import('svelte').Snippet)}
	<div class="vignette">
		<div class="vignette__tete">
			<span class="etiq">{note}</span><span class="vignette__ou">{ou}</span>
		</div>
		<div class="vignette__corps">{@render corps()}</div>
	</div>
{/snippet}

{#snippet glypheInfo()}
	<svg
		width="13"
		height="13"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"><circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.7v.3" /></svg
	>
{/snippet}

<!--
	`ligne(largeur, classe)` — le calque exact de la fabrique du gel
	(`mockups/V-39-etats.html:2939`), qui pose la largeur d'une ligne d'esquisse en
	ARGUMENT et jamais en littéral de style. Les largeurs vivent donc au point
	d'appel, comme dans la maquette.
-->
{#snippet ligne(largeur: string, classe: string)}
	<div class={classe ? `sq sq-l ${classe}` : 'sq sq-l'} style="width:{largeur}{pause}"></div>
{/snippet}

{#snippet esquisse(genre: string)}
	{#if genre === 'carte'}<div class="sq-carte">
			<div class="sq-carte__tete">
				<div
					class="sq sq--fort"
					style="width:26px;height:26px;border-radius:4px;flex:none{pause}"
				></div>
				{@render ligne('64%', 'sq-l--titre sq--fort')}
			</div>
			<div class="sq-pile">
				{@render ligne('100%', '')}
				{@render ligne('88%', '')}
			</div>
			<div class="sq-carte__pieds">
				{#each ['58px', '44px', '72px'] as largeur (largeur)}<div
						class="sq"
						style="width:{largeur};height:15px;border-radius:3px{pause}"
					></div>{/each}
			</div>
		</div>{:else if genre === 'liste'}<div class="sq-liste">
			{#each LIGNES_LISTE as largeur (largeur)}<div class="sq-ligne">
					<div
						class="sq sq--fort"
						style="width:14px;height:14px;border-radius:3px;flex:none{pause}"
					></div>
					<div class="sq sq-l sq--fort" style="width:{largeur}%;flex:1{pause}"></div>
					<div class="sq" style="width:40px;height:11px;flex:none{pause}"></div>
				</div>{/each}
		</div>{:else if genre === 'panneau'}<div class="sq-panneau">
			<div class="sq-panneau__tete">
				{@render ligne('46%', 'sq--fort')}
			</div>
			<div class="sq-panneau__corps">
				{#each PILES_PANNEAU as [haut, bas] (haut)}<div class="sq-pile">
						<div class="sq sq-l" style="width:{haut}{pause}"></div>
						<div class="sq sq-l sq--fort" style="width:{bas}{pause}"></div>
					</div>{/each}
			</div>
		</div>{:else if genre === 'bord'}<div class="sq-bord">
			{#each [0, 1, 2, 3] as rang (rang)}<div class="sq-mesure">
					<div
						class="sq sq--fort"
						style="width:52px;height:26px;border-radius:3px;margin-bottom:10px{pause}"
					></div>
					{@render ligne('78%', '')}
				</div>{/each}
		</div>{:else if genre === 'graphe'}<div class="sq-graphe">
			{#each ARETES_RENDUES as a (a.cle)}<div
					class="sq-arete"
					style="left:{a.gauche}%;top:{a.haut}%;width:{a.longueur}px;transform:rotate({a.angle}deg){pause}"
				></div>{/each}{#each NOEUDS as [gauche, haut, taille] (`${gauche}-${haut}`)}<div
					class="sq-noeud"
					style="left:{gauche}%;top:{haut}%;width:{taille}px;height:{taille}px;margin-left:{-taille /
						2}px;margin-top:{-taille / 2}px{pause}"
				></div>{/each}
		</div>{:else}<div class="sq-arbre">
			{#each BRANCHES as [profondeur, largeur], rang (rang)}<div
					class="sq-branche"
					style="padding-left:{profondeur * 18}px"
				>
					<div
						class="sq sq--fort"
						style="width:9px;height:9px;border-radius:2px;flex:none{pause}"
					></div>
					<div
						class="sq sq-l{profondeur === 0 ? ' sq--fort' : ''}"
						style="width:{largeur}%{pause}"
					></div>
				</div>{/each}
		</div>{/if}
{/snippet}

<Coquille
	fil={['Accueil', "États vides, de chargement et d'erreur"]}
	{univers}
	{domaines}
	{notes}
	{compte}
	version={instance.version}
	classeContenu="doc"
>
	{#snippet enfants()}
		<header class="doc__tete">
			<h1>États vides, de chargement et d'erreur</h1>
			<p>
				Un utilisateur passe une part considérable de son temps devant un écran qui n'a rien à
				montrer, ou pas encore. Ces états ne sont pas des accidents à masquer : ce sont des écrans à
				part entière, avec un message et une issue.
			</p>
		</header>

		<!-- ============ ÉTATS VIDES ============ -->
		<section class="chapitre">
			<div class="chapitre__tete">
				<h2 class="chapitre__nom">États vides</h2>
				<p class="chapitre__sous">
					Chacun nomme sa situation, explique en une phrase, et propose l'action qui en sort. Un
					écran vide sans issue est une impasse.
				</p>
			</div>

			<div class="paire" style="margin-bottom:var(--e-4)">
				<div>
					<div class="vignette__ou" style="margin-bottom:var(--e-2)">
						V-08 · recherche sans résultat
					</div>
					<div class="vide">
						<h3 class="vide__titre">Rien ne correspond à <em>« bascule téléphonie »</em></h3>
						<p class="vide__txt">
							Aucune note ne contient ces mots. C'est souvent une recherche infructueuse qui révèle
							une note manquante.
						</p>
						<div class="vide__actions">
							<button class="btn btn--principal">Créer cette note</button>
						</div>
					</div>
				</div>
				<div>
					<div class="vignette__ou" style="margin-bottom:var(--e-2)">
						V-08 · filtres sans résultat
					</div>
					<div class="vide">
						<h3 class="vide__titre">Aucune note ne correspond à ces filtres</h3>
						<p class="vide__txt">
							La base contient <em>14 notes</em> pour « sauvegarde », mais aucune qui soit à la fois obsolète,
							publique et rédigée par Marc Ferreira.
						</p>
						<div class="vide__actions">
							<button class="btn btn--principal">Réinitialiser les filtres</button>
						</div>
					</div>
				</div>
				<p class="paire__note">
					<b>Ces deux situations sont distinctes et ne se confondent jamais.</b> À gauche, la connaissance
					n'existe pas : il faut l'écrire. À droite, elle existe peut-être mais les filtres l'excluent
					: il faut les desserrer. Proposer « Créer cette note » à quelqu'un dont les filtres sont trop
					stricts l'enverrait écrire un doublon.
				</p>
			</div>

			<div class="vignettes" id="vides">
				{#each VIDES as v (v.note)}
					{#snippet corpsVide()}
						<div class="vide{v.sobre ? ' vide--sobre' : ''}">
							<h3 class="vide__titre">{v.titre}</h3>
							<p class="vide__txt">{v.txt}</p>
							{#if v.actions.length}<div class="vide__actions">
									{#each v.actions as action, rang (action)}<button
											class="btn{rang === 0 ? ' btn--principal' : ''}"
											type="button">{action}</button
										>{/each}
								</div>{/if}
						</div>
					{/snippet}
					{@render vignette(v.ou, v.note, corpsVide)}
				{/each}
			</div>
		</section>

		<!-- ============ ÉTATS DE CHARGEMENT ============ -->
		<section class="chapitre">
			<div class="chapitre__tete">
				<h2 class="chapitre__nom">États de chargement</h2>
				<p class="chapitre__sous">
					Une esquisse de la structure qui arrive, jamais un rouet universel. Voir se dessiner une
					carte de résultat ou un graphe indique à la fois qu'il se passe quelque chose et de quoi
					il s'agit — un rouet ne dit ni l'un ni l'autre.
				</p>
			</div>
			<div class="vignettes" id="squelettes">
				{#each SQUELETTES as [ou, note, genre] (note)}
					{#snippet corpsEsquisse()}{@render esquisse(genre)}{/snippet}
					{@render vignette(ou, note, corpsEsquisse)}
				{/each}
			</div>
		</section>

		<!-- ============ ÉTATS D'ERREUR ============ -->
		<section class="chapitre">
			<div class="chapitre__tete">
				<h2 class="chapitre__nom">États d'erreur</h2>
				<p class="chapitre__sous">
					Quatre portées, quatre traitements. La règle commune : la panne d'un morceau ne condamne
					pas le reste de l'écran.
				</p>
			</div>
			<div class="vignettes" id="erreurs">
				<!-- Portée : un panneau. Le reste de la vue continue de fonctionner. -->
				{#snippet erreurPanneau()}
					<div>
						<div class="sq-panneau">
							<div class="sq-panneau__tete"><span class="etiq">Relations</span></div>
							<div class="sq-panneau__corps">
								<div class="err-local">
									<div class="err-local__titre">Ce panneau n'a pas pu se charger</div>
									<div class="err-local__txt">
										Le service de cartographie ne répond pas. Le reste de la note s'affiche
										normalement : vous pouvez continuer à lire et à écrire.
									</div>
									<button class="btn">Réessayer</button>
								</div>
							</div>
						</div>
					</div>
				{/snippet}
				{@render vignette('V-14', 'Un panneau', erreurPanneau)}

				<!-- Portée : une vue entière. -->
				{#snippet erreurVue()}
					<div class="err-vue">
						<h3 class="err-vue__titre">Cette page n'a pas pu s'afficher</h3>
						<p class="err-vue__txt">
							Le serveur a mis trop de temps à répondre. C'est souvent passager — le plus souvent,
							réessayer suffit.
						</p>
						<div class="vide__actions">
							<button class="btn btn--principal">Réessayer</button><button class="btn"
								>Retour à l'accueil</button
							>
						</div>
					</div>
				{/snippet}
				{@render vignette('toutes', 'Une vue entière', erreurVue)}

				<!-- Portée : la connexion. Le travail en cours est protégé, et c'est la
			     première chose que dit le bandeau. -->
				{#snippet erreurReseau()}
					<div>
						<div class="bandeau-reseau">
							<span class="bandeau-reseau__pastille"></span>
							<div style="flex:1">
								<div>Connexion perdue</div>
								<div class="bandeau-reseau__detail">
									Votre travail est conservé sur cet appareil et sera envoyé dès le rétablissement.
									Nouvelle tentative dans 8 s.
								</div>
							</div>
						</div>
					</div>
				{/snippet}
				{@render vignette('toutes', 'Perte de connexion', erreurReseau)}

				<!-- Portée : une fonctionnalité. Mention discrète, sans alarme. -->
				{#snippet erreurDegradee()}
					<div style="display:flex;flex-direction:column;gap:var(--e-3)">
						<div class="degrade">
							{@render glypheInfo()}Recherche par sens indisponible — résultats par mots-clés
						</div>
						<div class="degrade">
							{@render glypheInfo()}Aperçus des pièces jointes momentanément désactivés
						</div>
						<p style="font-size:var(--t-mini);color:var(--c-encre-3);line-height:1.5;margin:0">
							Une fonctionnalité dégradée se mentionne là où elle manque, à voix basse. L'annoncer
							en bandeau rouge ferait croire à une panne générale alors que l'essentiel fonctionne.
						</p>
					</div>
				{/snippet}
				{@render vignette('V-08 · V-14', 'Fonctionnalité dégradée', erreurDegradee)}
			</div>

			<div class="langue">
				<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
					>Langue des messages d'erreur</span
				>
				<p
					style="font-size:var(--t-mini);color:var(--c-encre-2);line-height:1.55;margin:0 0 var(--e-3);max-width:60ch"
				>
					Aucun code technique, aucune trace d'exécution, aucun terme anglais brut. Le lecteur est
					un collègue pressé, pas un développeur.
				</p>
				<div id="langue">
					{#each LANGUE as [mauvais, bon] (mauvais)}<div class="langue__ligne">
							<span class="langue__cle">jamais</span><span class="langue__mauvais">{mauvais}</span>
						</div>
						<div class="langue__ligne">
							<span class="langue__cle">plutôt</span><span class="langue__bon">{bon}</span>
						</div>{/each}
				</div>
			</div>
		</section>
	{/snippet}
</Coquille>
