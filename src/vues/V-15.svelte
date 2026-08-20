<script lang="ts">
	/**
	 * V-15 — Historique des versions d'une note.
	 * Route `/notes/{identifiant}` (`verif/scenarios/V-15.json`).
	 *
	 * V-15 N'EST PAS UNE ROUTE PROPRE : elle SE SUPERPOSE à l'adresse de V-14.
	 * Le gel le dit par sa structure — même route, même note, même article — et
	 * `docs/releve-vues.md` §5 le confirme : les deux vues déclarent
	 * `/notes/{identifiant}`. Ce qui les distingue est le panneau latéral et
	 * l'état `data-historique` qu'il pose sur `div.app`.
	 *
	 * L'ARTICLE EST CELUI DE V-14, À L'OCTET. `V-14:1415-1755` et
	 * `V-15:1507-1847` sont identiques — 341 lignes, vérifiées par `diff` —, et
	 * la maquette l'annonce elle-même : « partagé par la lecture interne (V-14)
	 * et l'historique (V-15) : les deux vues montrent la même note, jamais deux
	 * versions divergentes du markup ». D'où `$lib/lecture/`, et d'où le fait
	 * que ce module partagé n'existe QUE parce que les deux vues le partagent
	 * réellement.
	 *
	 * SEPT ÉTATS SUR UNE SEULE FENÊTRE — 7 couples. Trois axes :
	 * panneau × richesse de l'historique × droit. Deux états sont marqués
	 * `identiqueA` `pan-ouvert` : ils ne dévient d'aucun contrôle.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1 : rail écrit au balisage du gel,
	 * barre sans les deux menus déroulants. `<main class="lecture" id="contenu">`
	 * (ARB-015), lien d'évitement vers `#article` avec le libellé par défaut
	 * (ARB-019). Trois attributs de données hors gabarit — `data-registre`,
	 * `data-historique`, `data-version` (ARB-021, A-2) —, dont le deuxième
	 * commande l'escamotage du panneau : `.app[data-historique="ferme"] .tiroir`
	 * (`V-15.css`).
	 *
	 * LE PANNEAU EST UNE SUPERPOSITION — ARB-021, A-4. `aside.tiroir#tiroir`
	 * vit HORS de `div.app` (`V-15:1853`) et il est l'un des NEUF SEULS nœuds
	 * hors `div.app` du gel à porter une boîte de rendu. Il est donc rendu par
	 * la propriété `superposition` du gabarit, à sa place exacte : après
	 * `div.app`, avant `div.notifs`.
	 *
	 * L'HISTORIQUE VIENT DU CORPUS — `VERSIONS` et `RETENTION_VERSIONS` de
	 * `seeds/corpus.ts`, exactement comme `window.versionsDe()` du gel lit
	 * `window.VERSIONS`. Aucun chiffre n'est saisi (P-02) : le nombre de
	 * versions conservées, l'ancienneté relative, l'ampleur des modifications et
	 * la répartition des cinq segments sont tous calculés à partir des données.
	 * Les trois cas de la planche nomment deux notes et le vide — `charger()`,
	 * `V-15:2990-2994`. Les deux tableaux sont désormais REÇUS EN PROPRIÉTÉ, de
	 * défaut la constante du jeu (T-043) : `T-030` a posé la table des versions,
	 * la semence la laisse vide, et ce lot rend la vue CAPABLE sans rien
	 * transposer.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011). La sélection de deux
	 * versions, l'affichage d'une version antérieure, la restauration et sa
	 * boîte de confirmation, la fermeture du panneau : tout cela est du
	 * comportement. Ce qui est rendu est l'ÉTAT DE DÉPART du gel — aucune
	 * version cochée, `data-version="courante"`, `#bandeau-version` masqué,
	 * « Comparer » désactivé.
	 *
	 * **CE LOT NE DÉCLARE PAS `P-09` TENUE** : la disparition des actions
	 * d'écriture en lecture seule est un rendu de deux états — `si-ecriture` et
	 * `socle.css:396` —, pas une preuve d'étanchéité (`pnpm test:droits`).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `dialog.dlg#dlg-restaurer` et
	 * `dialog.palette#palette`, tous deux FERMÉS, et `template#tpl-palette`.
	 * `docs/releve-vues.md` §4.1 les mesure : aucune boîte de rendu, aucun
	 * pixel, aucune entrée dans l'instantané ARIA. Et `div.planche`, bloc hors
	 * produit (`docs/DESIGN.md` §2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-15.css`, posé par `node verif/feuilles-de-vue.mjs V-15
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		RETENTION_VERSIONS,
		UNIVERS,
		VERSIONS,
		type Domaine,
		type EtatDInstance,
		type IdentifiantNote,
		type Note,
		type Univers,
		type UtilisateurCourant,
		type Version
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import NoteDeDemonstration from '$lib/lecture/NoteDeDemonstration.svelte';
	import SommaireDeLaNote from '$lib/lecture/SommaireDeLaNote.svelte';
	import { NOTE } from '$lib/lecture/note-de-demonstration';

	/**
	 * LES PROPRIÉTÉS DE RANGEMENT ET D'IDENTITÉ SONT OPTIONNELLES, ET LEUR
	 * DÉFAUT EST LA CONSTANTE DU JEU DE SEMENCE.
	 *
	 * La vue devient capable de recevoir ce qu'un chargeur de route lit en base
	 * — univers, domaines, compte courant, état de l'instance — sans qu'aucun
	 * rendu ne change tant que rien ne lui est passé : le mode de conception ne
	 * passe que `vecteur` et `notes`, la vue reçoit donc exactement ce qu'elle
	 * recevait, et le banc de comparaison ne bouge pas d'un pixel.
	 *
	 * `compte` est reçu SOUS LE NOM LOCAL `moi` : la vue porte déjà un `compte`,
	 * qui est le libellé du pied du panneau d'historique. Le nom de la propriété
	 * reste `compte` — il est contractuel, huit lots l'emploient.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — trois contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-15')`, variante « lecture ». */
		notes: readonly Note[];
		/** Les univers du produit. Défaut : ceux du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du produit. Défaut : ceux du jeu de semence. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Défaut : celui du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance servie. Défaut : celui du jeu de semence. */
		instance?: EtatDInstance;
		/**
		 * L'historique, par note. Défaut : celui du jeu de semence.
		 *
		 * `T-030` a posé la table des versions ; la semence la laisse VIDE. La vue
		 * est rendue capable de recevoir un historique réel, elle n'en transpose
		 * aucun : tant que rien ne lui est passé, elle lit le jeu de semence.
		 */
		versions?: Partial<Record<IdentifiantNote, readonly Version[]>>;
		/** Le nombre de versions conservées par note. Défaut : celui du jeu de semence. */
		retentionVersions?: number;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte: moi = MOI,
		instance = INSTANCE,
		versions: historique = VERSIONS,
		retentionVersions = RETENTION_VERSIONS
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** Le panneau latéral est déployé, ou escamoté hors fenêtre. */
	const panneau = $derived<'ouvert' | 'ferme'>(reglage['pan'] === 'ferme' ? 'ferme' : 'ouvert');
	const droits = $derived<'ecriture' | 'lecture'>(
		reglage['droits'] === 'lecture' ? 'lecture' : 'ecriture'
	);
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-15-historique.html:339`) : faute de serveur, une maquette
	 * statique n'a pas d'autre moyen de dire « cette action n'existe pas pour ce
	 * rôle ». Le produit peut ne pas l'émettre, et P-09 l'exige — « ni grisée,
	 * NI MASQUÉE ». La classe reste posée sur les nœuds rendus.
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(droits !== 'lecture');

	/**
	 * LES TROIS CAS D'HISTORIQUE DE LA PLANCHE — `charger()`, `V-15:2990-2994`.
	 * Deux notes du corpus et le vide : dix versions pour la note de
	 * démonstration, une seule pour une note créée et jamais retouchée, aucune
	 * pour le cas où l'historique n'a rien à montrer.
	 */
	const NOTE_PAR_CAS: Record<string, IdentifiantNote | null> = {
		riche: 'n-restaurer-pg',
		une: 'n-migration-bases',
		aucune: null
	};

	const cas = $derived(
		reglage['hist'] === 'une' ? 'une' : reglage['hist'] === 'aucune' ? 'aucune' : 'riche'
	);
	const source = $derived(NOTE_PAR_CAS[cas]);
	const versions = $derived<readonly Version[]>(source ? (historique[source] ?? []) : []);

	/**
	 * LE TITRE DE LA NOTE ferme le fil d'Ariane et coiffe le panneau
	 * (`V-15:3271`, `V-15:2859`). Il vient du corpus, par le module partagé.
	 */
	const titre = NOTE.titre;

	/* ── Le panneau ───────────────────────────────────────────────────────────
	   Transcription de `rendreListe()` (`V-15:2857`), `ligneVersion()`
	   (`V-15:2795`), `ampleur()` (`V-15:2767`), `relatif()` (`V-15:2761`) et
	   `majPied()` (`V-15:2884`). Aucune de ces fonctions ne dépend d'un
	   comportement : elles décrivent l'état de la liste au chargement. */

	/**
	 * La rétention annoncée sous le titre du panneau. Vide quand il n'y a rien
	 * à conserver — le gel efface alors le texte plutôt que d'annoncer zéro.
	 */
	const retention = $derived(
		versions.length === 0
			? ''
			: `${versions.length}${versions.length > 1 ? ' versions conservées' : ' version conservée'}` +
					` · les ${retentionVersions} dernières sont gardées, les plus anciennes sont supprimées automatiquement`
	);

	/**
	 * Le bloc d'état du panneau, quand la liste ne suffit pas à se comprendre
	 * seule. Deux cas, et aucun troisième : aucune version, ou une seule.
	 */
	const etatDuPanneau = $derived(
		versions.length === 0
			? {
					titre: 'Aucune version antérieure',
					texte:
						"Cette note n'a pas été modifiée depuis sa création. L'historique se remplira à la première modification enregistrée."
				}
			: versions.length === 1
				? {
						titre: 'Comparaison indisponible',
						texte:
							"Il faut deux versions pour comparer. Celle-ci est la seule enregistrée : la note n'a pas été modifiée depuis sa création."
					}
				: null
	);

	/**
	 * Le pied du panneau. Aucune version n'est sélectionnée à l'état de départ :
	 * « Comparer » est donc toujours désactivé ici, et le compte annonce ce
	 * qu'il reste à faire — ou l'impossibilité de comparer.
	 */
	const compte = $derived(
		versions.length < 2 ? 'Comparaison indisponible' : 'Sélectionnez deux versions'
	);

	/** L'ancienneté d'une version, en clair — `relatif()`, `V-15:2761`. */
	function relatif(jours: number): string {
		if (jours <= 1) return 'hier';
		if (jours < 31) return `il y a ${jours} jours`;
		const mois = Math.round(jours / 30);
		return mois < 12 ? `il y a ${mois} mois` : `il y a ${Math.round(jours / 365)} an(s)`;
	}

	/** Les cinq segments de la barre d'ampleur — cinq toujours, jamais moins. */
	const SEGMENTS = [0, 1, 2, 3, 4];

	/**
	 * La classe d'un segment : `a` pour la part ajoutée, `r` pour la part
	 * retirée, aucune quand la version n'a rien touché. La répartition est au
	 * prorata, avec un minimum d'un segment ajouté dès qu'il y a du mouvement.
	 */
	function segment(v: Version, rang: number): string | undefined {
		const total = v.ajout + v.retrait;
		if (!total) return undefined;
		const parts = Math.max(1, Math.round((v.ajout / total) * 5));
		return rang < parts ? 'a' : 'r';
	}
</script>

{#snippet ligneVersion(v: Version, courante: boolean)}
	<!-- prettier-ignore -->
	<div class="ver" data-courante={courante ? 'oui' : undefined}
		><label class="ver__case"
			><input
				type="checkbox"
				disabled={versions.length < 2}
				aria-label="Sélectionner la version {v.n} pour comparaison"
			/></label
		><button class="ver__corps" type="button"
			><div class="ver__haut"
				><span class="ver__n">Version {v.n}</span
				>{#if courante}<span class="ver__marque">courante</span>{/if}<span
					class="ver__quand"
					title="{v.date} à {v.heure}">{relatif(v.jours)}</span
				></div
			><div class="ver__resume">{v.resume}</div
			><div class="ver__bas"
				><span class="ver__qui">{v.auteur}</span
				><span class="ampleur" title="{v.ajout} lignes ajoutées, {v.retrait} retirées"
					><span class="ampleur__plus">+{v.ajout}</span
					><span class="ampleur__moins">−{v.retrait}</span
					><span class="ampleur__barre" aria-hidden="true"
						>{#each SEGMENTS as rang (rang)}<i class={segment(v, rang)}></i>{/each}</span
					></span
				></div
			></button
		></div
	>
{/snippet}

<!--
	LE SÉPARATEUR `›` DE LA LIGNE « RANGEMENT ».

	Il vit ici, et non dans `$lib/lecture/`, parce qu'il porte un style en ligne
	du gel — `color:var(--c-encre-4)` — et qu'un style en ligne n'est prouvé que
	par la maquette RATTACHÉE au fichier : par le nommage pour
	`src/vues/V-xx.svelte` (ARB-016, P-6.4), par déclaration humaine dans
	`verif/references/preuve-par-le-gel.json` pour une ressource partagée
	(ARB-022). `src/lib/lecture/` n'a aucune des deux, et un agent d'exécution
	n'écrit jamais dans ce fichier de rattachement (PLAN §12). Écart remonté.
-->
{#snippet separateur()}<span style="color:var(--c-encre-4)">›</span>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="lecture"
	cibleEvitement="article"
	fil={['Accueil', 'Production', 'Infrastructure', 'Exploitation', 'Sauvegardes', titre]}
	courant={['Infrastructure', 'Exploitation', 'Sauvegardes']}
	{droits}
	donnees={{
		'data-registre': 'reference',
		'data-historique': panneau,
		'data-version': 'courante'
	}}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: moi.nom,
		initiales: moi.initiales,
		role: moi.role,
		domaine: moi.domaine
	}}
	version={instance.version}
>
	{#snippet enfants()}
		<SommaireDeLaNote />

		<article class="article" id="article">
			<!--
				Bandeau d'identification, affiché quand une version antérieure est
				consultée. Il précède tout le reste, y compris l'en-tête. Aucun des
				sept états ne consulte de version antérieure : il reste masqué.
			-->
			<div class="bandeau-version" id="bandeau-version" hidden>
				<div class="bandeau-version__corps">
					<div class="bandeau-version__titre" id="bv-titre">—</div>
					<div id="bv-sous"></div>
				</div>
				<div class="bandeau-version__actions">
					<!-- P-09 · ARB-040 — omise, jamais masquée. `V-15:1502` -->
					{#if ecriture}<button class="btn si-ecriture" id="bv-restaurer"
							>Restaurer cette version</button
						>{/if}
					<button class="btn btn--discret" id="bv-retour">Revenir à la version courante</button>
				</div>
			</div>

			<!-- P-09 · ARB-040 — le bloc partagé OMET ses actions d'écriture en lecture seule. -->
			<NoteDeDemonstration {droits} {separateur} />
		</article>
	{/snippet}

	{#snippet superposition()}
		<!-- ============================ PANNEAU LATÉRAL ============================ -->
		<aside class="tiroir" id="tiroir" aria-label="Historique des versions">
			<div class="tiroir__tete">
				<div class="tiroir__ligne">
					<div style="min-width:0">
						<h2 class="tiroir__titre">Historique</h2>
						<div class="tiroir__note" id="tiroir-note">{titre}</div>
					</div>
					<button class="tiroir__fermer" id="fermer-tiroir" aria-label="Fermer l'historique">
						<svg
							width="17"
							height="17"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<span class="tiroir__retention" id="retention">{retention}</span>
			</div>

			<div class="tiroir__corps" id="versions">
				{#each versions as v, rang (v.n)}{@render ligneVersion(
						v,
						rang === 0
					)}{/each}{#if etatDuPanneau}<!-- prettier-ignore -->
					<div class="tiroir__etat"
						><h3>{etatDuPanneau.titre}</h3
						><p>{etatDuPanneau.texte}</p
					></div>{/if}
			</div>

			<div class="tiroir__pied">
				<span class="tiroir__compte" id="selection">{compte}</span>
				<button class="btn btn--principal" id="comparer" disabled>Comparer</button>
			</div>
		</aside>
	{/snippet}
</Coquille>
