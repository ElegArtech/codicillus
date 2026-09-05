<script lang="ts">
	/**
	 * V-07 — ACCUEIL CONNECTÉ. Route `/`, branche avec session.
	 *
	 * Cinq blocs, dans cet ordre : la salutation et le chiffre de la bibliothèque, le
	 * grand champ de recherche, la carte « À surveiller », les deux cartes de
	 * consultation, le tableau des univers. C'est la composition du prototype validé
	 * (`design_handoff_refonte_codicillus/captures/01-accueil.png`).
	 *
	 * AUCUN ÉTAT DE VIVACITÉ N'EST CALCULÉ ICI (`P-01`, `ADR-005`). Le chargeur passe
	 * l'état de chaque note, déjà produit par `vivacite()` ; cette vue ne fait
	 * qu'additionner, grouper et rendre. Le glyphe est le composant unique,
	 * `GlypheDeVivacite`, jamais un cercle dessiné à la main, et il ne paraît jamais
	 * sans son libellé (`RG-M18-09`).
	 *
	 * LE PRODUIT COMMENCE VIDE, et chacun des cinq blocs le dit à sa façon : aucun
	 * n'affiche un zéro muet, chacun nomme le geste qui débloque — créer un univers,
	 * créer une note, ouvrir une note, demander un accès. C'est le chemin le plus
	 * important de cet écran, pas son cas limite.
	 *
	 * CHAQUE GESTE MÈNE QUELQUE PART. Les deux alertes ouvrent la liste filtrée des
	 * notes concernées — `/?surveiller=…`, servie par le chargeur de cette même
	 * route ; chaque ligne de liste est un lien vers sa note ; chaque ligne du
	 * tableau des univers ouvre la page de son univers.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-07.css`.
	 */
	import type { Domaine, Note, Univers, UtilisateurCourant } from '../../seeds/corpus';
	import { resolve } from '$app/paths';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import type { TraitDePictogramme } from '$lib/console/sections';
	import { ICONE_NOTE, glypheDUnivers } from '$lib/coquille/glyphes';
	import { designationsDeCoquille } from '$lib/coquille/identite';
	import { adressesParLesNoms } from '$lib/rangement/adresses';
	import { ETATS_DE_VIVACITE, ORDRE_DES_ETATS, type EtatDeVivacite } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';

	/**
	 * L'ÉTAT DE VIVACITÉ D'UNE NOTE, tel que le chargeur le rend. La forme est celle
	 * de `EtatDeNoteALAccueil` (`$lib/donnees/accueil`) ; elle est redéclarée ici
	 * plutôt qu'importée pour qu'aucun module de base n'entre dans le graphe du
	 * navigateur, et le compilateur garde la porte au point d'appel.
	 */
	interface EtatDeNote {
		readonly identifiant: string;
		readonly titre: string;
		readonly univers: string;
		readonly etat: EtatDeVivacite;
		readonly libelle: string;
		readonly compact: string;
		readonly reste: number;
	}

	interface NoteRecemmentConsultee {
		readonly identifiant: string;
		readonly titre: string;
		readonly minutes: number;
	}

	interface NoteLaPlusConsultee {
		readonly identifiant: string;
		readonly titre: string;
		readonly consultations: number;
	}

	/** L'identité affichée — les valeurs du jeu de démonstration, élargies. */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	interface Proprietes {
		/** Le corpus lisible — la coquille en a besoin pour résoudre le fil. */
		notes: readonly Note[];
		/** Les univers portant au moins un domaine lisible. Vide : instance neuve. */
		univers: readonly Univers[] | undefined;
		domaines: readonly Domaine[] | undefined;
		/** L'utilisateur connecté. Valeur manquante : une identité sans nom. */
		compte: IdentiteAffichee | undefined;
		/** L'état de vivacité de chaque note lisible. Vide : bibliothèque vide. */
		vivacites: readonly EtatDeNote[] | undefined;
		recemment: readonly NoteRecemmentConsultee[] | undefined;
		plusConsultees: readonly NoteLaPlusConsultee[] | undefined;
		/** Le seuil « bientôt », en jours — configurable en console. */
		seuilBientot: number | undefined;
		/** La liste d'alerte ouverte, ou `null` : le tableau de bord entier. */
		surveiller: 'bientot' | 'retard' | null | undefined;
		/** La capacité d'écriture, calculée en base (`P-09`). */
		ecriture: boolean | undefined;
		/** `RG-DRO-03` — seul l'administrateur peut créer un univers. */
		administrateur: boolean | undefined;
	}

	/** L'identité vide : la salutation retombe alors sur « Bonjour. ». */
	const SANS_IDENTITE: IdentiteAffichee = {
		prenom: '',
		nom: '',
		initiales: '',
		domaine: '',
		role: ''
	};

	const {
		notes: corpus,
		univers = [],
		domaines = [],
		compte: moi = SANS_IDENTITE,
		vivacites = [],
		recemment = [],
		plusConsultees = [],
		seuilBientot = 0,
		surveiller = null,
		ecriture = false,
		administrateur = false
	}: Proprietes = $props();

	/**
	 * LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM : renommer
	 * un univers en console rendrait sinon 404 chacun des liens du tableau
	 * (`RG-M12-11`).
	 */
	const adresses = adressesParLesNoms(designationsDeCoquille());

	/** Le mot renommable de `M14.7` — le placeholder du champ le porte. */
	const motFiche = $derived(vocabulaireRendu().ficheMin);

	/* ── Les compteurs, une seule addition ────────────────────────────────────
	   Les cinq blocs comptent la même chose : la salutation, les deux alertes, la
	   colonne de compteurs, le bilan et chaque ligne d'univers sortent d'ici. */
	function compter(liste: readonly EtatDeNote[], etat: EtatDeVivacite): number {
		return liste.filter((n) => n.etat === etat).length;
	}

	const compteurs = $derived(ORDRE_DES_ETATS.map((etat) => compter(vivacites, etat)));
	const total = $derived(vivacites.length);
	const aJour = $derived(compter(vivacites, 'ajour'));
	const bientot = $derived(compter(vivacites, 'bientot'));
	const aRevoir = $derived(compter(vivacites, 'arevoir'));
	const obsoletes = $derived(compter(vivacites, 'obsolete'));
	const critiques = $derived(aRevoir + obsoletes);
	const enRetard = $derived(compter(vivacites, 'averifier') + critiques);

	/** Les notes de chaque alerte — c'est ce que le chevron ouvre. */
	const notesBientot = $derived(vivacites.filter((n) => n.etat === 'bientot'));
	const notesEnRetard = $derived(
		[...vivacites]
			.filter((n) => n.etat === 'averifier' || n.etat === 'arevoir' || n.etat === 'obsolete')
			.sort((a, b) => a.reste - b.reste)
	);

	/**
	 * L'ÉTAT QUE PORTE LA SECONDE ALERTE. Il monte avec ce qu'elle couvre : « À
	 * vérifier » tant que rien n'est critique, « À revoir » dès qu'une note l'est —
	 * la couleur du pire état présent, comme la page d'un univers.
	 */
	const etatDAlerte = $derived<EtatDeVivacite>(critiques > 0 ? 'arevoir' : 'averifier');

	/** La plus ancienne des notes critiques — celle que le bilan nomme. */
	const plusAncienne = $derived(
		[...vivacites]
			.filter((n) => n.etat === 'arevoir' || n.etat === 'obsolete')
			.sort((a, b) => a.reste - b.reste)[0] ?? null
	);

	/** Le détail du bilan : la répartition des critiques, puis la plus ancienne. */
	const detailDuBilan = $derived(
		[
			aRevoir > 0 ? `${aRevoir} à revoir` : null,
			obsoletes > 0 ? `${obsoletes} ${accord(obsoletes, 'obsolète')}` : null
		]
			.filter((part) => part !== null)
			.join(', ') +
			(plusAncienne === null
				? '.'
				: `. La plus ancienne : « ${plusAncienne.titre} », ${
						plusAncienne.reste < 0
							? `échéance dépassée de ${-plusAncienne.reste} ${accord(-plusAncienne.reste, 'jour')}`
							: 'révision demandée'
					}.`)
	);

	/* ── Le tableau des univers ─────────────────────────────────────────────── */
	interface LigneDUnivers {
		readonly nom: string;
		readonly glyphe: string;
		readonly notes: number;
		readonly compteurs: readonly number[];
	}

	const lignesDUnivers = $derived<readonly LigneDUnivers[]>(
		[...univers]
			.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
			.map((u) => {
				const siennes = vivacites.filter((n) => n.univers === u.nom);
				return {
					nom: u.nom,
					glyphe: u.glyphe,
					notes: siennes.length,
					compteurs: ORDRE_DES_ETATS.map((etat) => compter(siennes, etat))
				};
			})
	);

	/** Les segments non nuls de la barre empilée — un segment vide n'a pas de sens. */
	function segments(ligne: LigneDUnivers): readonly { etat: EtatDeVivacite; n: number }[] {
		return ORDRE_DES_ETATS.map((etat, rang) => ({ etat, n: ligne.compteurs[rang] ?? 0 })).filter(
			(s) => s.n > 0
		);
	}

	/** L'état d'une note nommée par une liste de consultation — jamais recalculé. */
	function etatDe(identifiant: string): EtatDeNote | undefined {
		return vivacites.find((n) => n.identifiant === identifiant);
	}

	/**
	 * LE DÉLAI DEPUIS LA DERNIÈRE OUVERTURE. Ce n'est pas une information de
	 * vivacité : la fabrique n'a rien à en dire, et cette forme n'existe que sur cet
	 * écran. Les paliers sont ceux du prototype — minutes, heures, puis jours.
	 */
	function delai(minutes: number): string {
		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `il y a ${minutes} min`;
		const heures = Math.floor(minutes / 60);
		if (heures < 24) return `il y a ${heures} h`;
		const jours = Math.floor(heures / 24);
		return jours <= 1 ? 'hier' : `il y a ${jours} j`;
	}

	/* ── La liste filtrée qu'ouvre une alerte ────────────────────────────────── */
	const listeOuverte = $derived(
		surveiller === 'bientot' ? notesBientot : surveiller === 'retard' ? notesEnRetard : null
	);
	const titreDeLaListe = $derived(
		surveiller === 'bientot' ? 'Notes bientôt à échéance' : 'Notes en retard de vérification'
	);

	/* ── Le geste qui débloque une bibliothèque vide ──────────────────────────
	   Trois situations, trois suites différentes, et une seule vraie à la fois :
	   sans univers il n'y a nulle part où ranger une note — c'est la console, et
	   elle n'est ouverte qu'à l'administrateur ; avec un univers et le droit
	   d'écrire, c'est la première note ; sans droit d'écrire, c'est un accès à
	   demander, et aucun bouton ne peut le donner. */
	const amorce = $derived(
		univers.length === 0
			? administrateur
				? {
						texte:
							'Rien n’est encore rangé : une instance neuve n’a ni univers, ni domaine, ni note. ' +
							'Le premier univers ouvre la structure où tout le reste se range.',
						lien: resolve('/console/univers'),
						geste: 'Créer votre premier univers'
					}
				: {
						texte:
							'Aucun univers ne vous est ouvert. L’administrateur de l’instance crée les univers ' +
							'et vous en donne l’accès ; la bibliothèque s’ouvrira ici.',
						lien: null,
						geste: ''
					}
			: ecriture
				? {
						texte:
							'Vos univers sont en place et n’attendent que leur première note. ' +
							'Rapatrier l’existant va souvent plus vite que repartir d’une page blanche.',
						lien: resolve('/notes/nouvelle'),
						geste: 'Créer votre première note'
					}
				: {
						texte:
							'Aucune note ne vous est encore accessible. Demandez à l’administrateur l’accès ' +
							'à un dossier : les notes qu’il contient apparaîtront ici.',
						lien: null,
						geste: ''
					}
	);

	/** Le pictogramme de « Les plus consultées » — un histogramme, boîte de 16. */
	const ICONE_CONSULTATIONS: readonly TraitDePictogramme[] = [
		{ forme: 'path', d: 'M2 14h12M4 11V8M8 11V4M12 11V6' }
	];

	/** L'adresse de l'accueil, base des deux listes d'alerte. */
	const ACCUEIL = resolve('/');
	const RECHERCHE = resolve('/recherche');
	const ROUTE_DE_NOTE = '/notes/[identifiant]' as const;
</script>

<!-- LA PARTIE DROITE DE L'EN-TÊTE — « + Créer » en contour, puis l'avatar.
     `P-09` : le bouton n'est pas rendu quand il n'a nulle part où mener. -->
{#snippet actions()}
	{#if ecriture}
		<a class="btn" href={resolve('/notes/nouvelle')}
			><svg
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg
			>Créer</a
		>
	{:else if administrateur}
		<a class="btn" href={resolve('/console/univers')}
			><svg
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg
			>Créer</a
		>
	{/if}
	<a class="avatar" href={resolve('/mon-profil')} title={moi.nom} aria-label="Mon profil"
		>{moi.initiales}</a
	>
{/snippet}

<!-- Une ligne de liste : icône, titre, sous-ligne, état à droite. LA LIGNE ENTIÈRE
     EST CLIQUABLE — c'est un lien, pas une ligne avec un lien dedans. -->
{#snippet ligneDeNote(
	identifiant: string,
	titre: string,
	sous: string,
	icone: readonly TraitDePictogramme[]
)}
	{@const etat = etatDe(identifiant)}
	<a class="ligne" href={resolve(ROUTE_DE_NOTE, { identifiant })}>
		<span class="ligne__icone" aria-hidden="true"
			><Pictogramme traits={icone} taille="16" boite="0 0 16 16" epaisseur="1.4" /></span
		>
		<span class="ligne__corps">
			<span class="ligne__titre">{titre}</span>
			<span class="ligne__sous">{sous}</span>
		</span>
		{#if etat}
			<span class="ligne-vivacite__etat glyphe--{etat.etat}"
				><GlypheDeVivacite etat={etat.etat} taille={11} />{etat.libelle}</span
			>
		{/if}
	</a>
{/snippet}

<Coquille
	classeContenu="accueil"
	accueilCourant
	fil={['Accueil']}
	actionsDEntete={actions}
	{univers}
	{domaines}
	notes={corpus}
	compte={{ nom: moi.nom, initiales: moi.initiales, role: moi.role, domaine: moi.domaine }}
	version=""
>
	{#snippet enfants()}
		<!-- ═══ 1. SALUTATION ═══════════════════════════════════════════════════ -->
		<header class="salut">
			<h1 class="salut__titre">
				{moi.prenom === '' ? 'Bonjour.' : 'Bonjour ' + moi.prenom + '.'}
			</h1>
			{#if total === 0}
				<p class="salut__sous">Votre bibliothèque ne contient encore aucune note.</p>
			{:else}
				<!-- prettier-ignore -->
				<p class="salut__sous"><b>{total}</b>{' ' + accord(total, 'note') + ' dans votre bibliothèque, dont '}<b>{aJour}</b>{' ' + accord(aJour, 'est actuellement à jour.', 'sont actuellement à jour.')}</p>
			{/if}
		</header>

		<!-- ═══ 2. RECHERCHE ════════════════════════════════════════════════════
		     UN LIEN, ET SA DESTINATION DE REPLI EST RÉELLE : `$lib/cablage/coquille.ts`
		     intercepte le clic sur `.recherche` et ouvre la palette montée par le
		     gabarit racine ; sans script, il mène à l'écran de recherche. -->
		<a class="recherche quete" href={RECHERCHE}>
			<svg
				width="18"
				height="18"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
			>
			<span class="recherche__txt quete__txt"
				>{'Rechercher une note, une ' + motFiche + ', un signet…'}</span
			>
			<kbd class="touche">⌘ K</kbd>
		</a>

		<!-- ═══ 3. À SURVEILLER ═════════════════════════════════════════════════ -->
		<section class="carte" aria-labelledby="t-surveiller">
			<div class="carte__tete">
				<span class="etiq" id="t-surveiller">À surveiller</span>
			</div>
			{#if total === 0}
				<div class="carte__corps">
					<div class="vide">
						<p class="vide__txt">{amorce.texte}</p>
						{#if amorce.lien !== null}
							<!-- L'adresse est RÉSOLUE à la construction d'`amorce` ; la règle inspecte
								l'expression du `href` et ne peut pas l'y suivre. -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="btn btn--principal" href={amorce.lien}>{amorce.geste}</a>
						{/if}
					</div>
				</div>
			{:else}
				<div class="surveiller">
					<!-- Les deux alertes. Chacune ouvre SA liste — pas un chevron mort. -->
					<div class="alertes">
						<a class="alerte" href="{ACCUEIL}?surveiller=bientot">
							<span class="alerte__pastille glyphe--bientot" aria-hidden="true"
								><GlypheDeVivacite etat="bientot" taille={18} /></span
							>
							<span class="alerte__corps">
								<!-- prettier-ignore -->
								<span class="alerte__titre"><b class="glyphe--bientot">{bientot}</b>{' ' + accord(bientot, 'note arrive bientôt à échéance', 'notes arrivent bientôt à échéance')}</span>
								<span class="alerte__detail"
									>{'Vérification prévue dans les ' +
										seuilBientot +
										' ' +
										accord(seuilBientot, 'prochain jour', 'prochains jours')}</span
								>
							</span>
							<span class="alerte__chevron" aria-hidden="true">›</span>
						</a>
						<a class="alerte" href="{ACCUEIL}?surveiller=retard">
							<span class="alerte__pastille glyphe--{etatDAlerte}" aria-hidden="true"
								><GlypheDeVivacite etat={etatDAlerte} taille={18} /></span
							>
							<span class="alerte__corps">
								<!-- prettier-ignore -->
								<span class="alerte__titre"><b class="glyphe--{etatDAlerte}">{enRetard}</b>{' ' + accord(enRetard, 'note nécessite votre attention', 'notes nécessitent votre attention')}</span>
								<span class="alerte__detail">Leur période de validité est dépassée</span>
							</span>
							<span class="alerte__chevron" aria-hidden="true">›</span>
						</a>
					</div>

					<!-- Les cinq compteurs, dans l'ordre des états. -->
					<ul class="compteurs">
						{#each ORDRE_DES_ETATS as etat, rang (etat)}
							<li class="compteur">
								<GlypheDeVivacite {etat} taille={13} />
								<span class="compteur__n">{compteurs[rang] ?? 0}</span>
								<span class="compteur__lib">{ETATS_DE_VIVACITE[etat].libelle}</span>
							</li>
						{/each}
					</ul>

					<!-- Le bilan, sur le voile de son état. -->
					{#if critiques > 0}
						<div class="bilan bilan--arevoir">
							<span class="bilan__marque glyphe--arevoir" aria-hidden="true"
								><GlypheDeVivacite etat="arevoir" taille={16} /></span
							>
							<div>
								<p class="bilan__titre glyphe--arevoir">
									{critiques + ' ' + accord(critiques, 'note critique', 'notes critiques')}
								</p>
								<p class="bilan__txt">{detailDuBilan}</p>
							</div>
						</div>
					{:else}
						<div class="bilan bilan--ajour">
							<span class="bilan__marque glyphe--ajour" aria-hidden="true"
								><GlypheDeVivacite etat="ajour" taille={16} /></span
							>
							<div>
								<p class="bilan__titre glyphe--ajour">Tout est sous contrôle</p>
								<p class="bilan__txt">Aucune note critique.</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<!-- ═══ 3 bis. LA LISTE QU'UNE ALERTE OUVRE ═════════════════════════════ -->
		{#if listeOuverte !== null}
			<section class="carte" aria-labelledby="t-liste">
				<div class="carte__tete">
					<span class="etiq" id="t-liste">{titreDeLaListe}</span>
					<a class="carte__action" href={ACCUEIL}>← Tout le tableau de bord</a>
				</div>
				<div class="carte__corps carte__corps--lignes">
					{#if listeOuverte.length === 0}
						<p class="vide__txt">
							Aucune note dans cet état. C'est le bon état : rien ne réclame de vérification.
						</p>
					{:else}
						{#each listeOuverte as note (note.identifiant)}
							{@render ligneDeNote(note.identifiant, note.titre, note.compact, ICONE_NOTE)}
						{/each}
					{/if}
				</div>
			</section>
		{/if}

		<!-- ═══ 4. LES DEUX CARTES DE CONSULTATION ══════════════════════════════ -->
		<div class="duo">
			<section class="carte" aria-labelledby="t-recemment">
				<div class="carte__tete">
					<span class="etiq" id="t-recemment">Récemment consultées</span>
					<span class="carte__periode">7 derniers jours</span>
				</div>
				<div class="carte__corps carte__corps--lignes">
					{#if recemment.length === 0}
						<p class="vide__txt">
							{total === 0
								? 'Rien à consulter pour l’instant : la bibliothèque est vide.'
								: 'Vous n’avez ouvert aucune note cette semaine. Les notes que vous lisez apparaissent ici.'}
						</p>
					{:else}
						{#each recemment as note (note.identifiant)}
							{@render ligneDeNote(note.identifiant, note.titre, delai(note.minutes), ICONE_NOTE)}
						{/each}
					{/if}
				</div>
				{#if recemment.length > 0}
					<div class="carte__pied">
						<a class="carte__action" href="{RECHERCHE}?tri=consultations"
							>→ Voir toutes les consultations</a
						>
					</div>
				{/if}
			</section>

			<section class="carte" aria-labelledby="t-plus">
				<div class="carte__tete">
					<span class="etiq" id="t-plus">Les plus consultées</span>
					<span class="carte__periode">30 derniers jours</span>
				</div>
				<div class="carte__corps carte__corps--lignes">
					{#if plusConsultees.length === 0}
						<p class="vide__txt">
							{total === 0
								? 'Rien à consulter pour l’instant : la bibliothèque est vide.'
								: 'Aucune note n’a été ouverte ces trente derniers jours.'}
						</p>
					{:else}
						{#each plusConsultees as note (note.identifiant)}
							{@render ligneDeNote(
								note.identifiant,
								note.titre,
								`${note.consultations} ${accord(note.consultations, 'consultation')}`,
								ICONE_CONSULTATIONS
							)}
						{/each}
					{/if}
				</div>
				{#if plusConsultees.length > 0}
					<div class="carte__pied">
						<a class="carte__action" href="{RECHERCHE}?tri=consultations"
							>→ Voir toutes les notes les plus consultées</a
						>
					</div>
				{/if}
			</section>
		</div>

		<!-- ═══ 5. VOS UNIVERS ══════════════════════════════════════════════════ -->
		<section class="carte" aria-labelledby="t-univers">
			<div class="carte__tete">
				<span class="etiq" id="t-univers">Vos univers</span>
				{#if lignesDUnivers.length > 0}
					<a class="carte__action" href={resolve('/cartographie')}>Voir tous les univers →</a>
				{/if}
			</div>
			{#if lignesDUnivers.length === 0}
				<div class="carte__corps">
					<!-- PAS DE SECOND BOUTON VERS LA MÊME PAGE : le geste est déjà offert par
						la carte « À surveiller », en tête d'écran, et deux appels identiques à
						un écran d'intervalle se font concurrence. -->
					<p class="vide__txt">
						{administrateur
							? 'Aucun univers. C’est la première pièce du rangement : un univers porte des domaines, un domaine porte des dossiers, et un dossier porte les notes.'
							: 'Aucun univers ne vous est ouvert. L’administrateur de l’instance vous en donnera l’accès.'}
					</p>
				</div>
			{:else}
				<div class="tableau" role="table" aria-label="Répartition de vivacité par univers">
					<div class="tableau__entete" role="row">
						<span role="columnheader">Univers</span>
						<span role="columnheader">Notes</span>
						{#each ORDRE_DES_ETATS as etat (etat)}
							<span class="tableau__col" role="columnheader"
								>{etat === 'bientot' ? 'Bientôt' : ETATS_DE_VIVACITE[etat].libelle}</span
							>
						{/each}
						<span role="columnheader" class="hors-ecran">Répartition</span>
						<span role="columnheader" class="hors-ecran">Ouvrir</span>
					</div>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- `resolve()` prend un
						identifiant de route, non la dérivation d'un identifiant d'univers depuis son
						nom : `$lib/rangement/adresses` est la fabrique unique de celles-là. -->
					{#each lignesDUnivers as ligne (ligne.nom)}
						<a class="tableau__ligne" role="row" href={adresses.univers(ligne.nom)}>
							<span class="tableau__nom" role="cell">
								<span class="tableau__glyphe" aria-hidden="true"
									><Pictogramme
										traits={glypheDUnivers(ligne.glyphe)}
										taille="18"
										boite="0 0 24 24"
										epaisseur="1.6"
									/></span
								>{ligne.nom}
							</span>
							<span class="tableau__notes" role="cell"
								>{ligne.notes + ' ' + accord(ligne.notes, 'note')}</span
							>
							{#each ORDRE_DES_ETATS as etat, rang (etat)}
								{@const n = ligne.compteurs[rang] ?? 0}
								<span
									class="rail-compact glyphe--{etat}"
									role="cell"
									data-nul={n === 0 ? 'oui' : undefined}
								>
									<GlypheDeVivacite {etat} taille={11} />
									<span class="rail-compact__n">{n}</span>
									<span class="hors-ecran">{ETATS_DE_VIVACITE[etat].libelle}</span>
								</span>
							{/each}
							<span class="tableau__barre" role="cell">
								{#if ligne.notes > 0}
									<span class="barre-etats" aria-hidden="true">
										{#each segments(ligne) as part (part.etat)}
											<span class="barre-etats__part glyphe--{part.etat}" style="flex:{part.n}"
											></span>
										{/each}
									</span>
								{/if}
							</span>
							<span class="tableau__chevron" role="cell" aria-hidden="true">›</span>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/snippet}
</Coquille>
