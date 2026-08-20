<script lang="ts">
	/**
	 * V-11 — Page d'un domaine. Route `/univers/{univers}/{domaine}`.
	 *
	 * C'EST LA FORME CANONIQUE au sens de `RG-M03-02` (`docs/routes.md` §2.2), et
	 * la SEULE forme publiée depuis ARB-001 : la forme raccourcie
	 * `/domaines/{domaine}` n'est pas implémentée, le produit ne l'émet jamais, et
	 * `/domaines/…` rend la page non trouvée par le chemin de code unique
	 * d'ADR-007. La clause de désambiguïsation de `RG-M03-02` est **sans objet**
	 * (E-09) et **ne doit jamais être implémentée** : elle ne pouvait se
	 * déclencher que sur la forme raccourcie. L'unicité d'un domaine n'est portée
	 * que par son univers (RG-STR-02), d'où le segment d'univers obligatoire.
	 * Le gabarit d'adresse est `$lib/rangement/adresses` ; P-10 le prolongera en
	 * `/notes` et `/signets`.
	 *
	 * LES LIENS RESTENT CEUX DU GEL — `href="#"`, comme `src/lib/coquille/*`.
	 * ARB-013 devait permettre l'adresse réelle ; mesuré sur ce lot, le filtre de
	 * le module de capture du banc ne retire pas les lignes `/url:` de l'instantané
	 * ARIA. Le constat est déclaré au rapport ; l'instrument est en écriture
	 * humaine seule. Voir l'en-tête de `V-10.svelte`.
	 *
	 * HUIT ÉTATS — `verif/scenarios/V-11.json`. Trois axes, vecteur complet :
	 * domaine × profil × état.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1, vérifié sur le gel. `<main>` porte
	 * la classe `domaine` (ARB-015) ; le chemin courant du rail est `[nom du
	 * domaine]`, ce qui déplie et met en évidence le nœud homonyme.
	 *
	 * `.noeud` N'EST PAS PORTÉE ICI — nœud d'arborescence du rail, rendu par la
	 * coquille ; nœud de GRAPHE en V-19 et V-20, règles inconciliables
	 * (`docs/DESIGN.md` §2.H). Aucune factorisation. Même vigilance sur `.mesure`,
	 * dont `ECART-019` relève TROIS définitions divergentes sur trois vues : celle
	 * portée ici est celle de `src/vues/V-11.css`, et elle ne se promeut pas.
	 *
	 * LE PROFIL « LECTEUR » N'EST PAS UN RÔLE DU GABARIT. La planche pose
	 * `data-role="lecteur"`, valeur qu'aucune règle du socle ni de la feuille de
	 * V-11 ne lit — la seule règle sur `data-role` est
	 * `.app:not([data-role="admin"]) .si-admin`. Le gabarit ne connaît que
	 * `referent` et `admin` ; « lecteur » y est un non-administrateur, et c'est
	 * `data-droits="lecture"` qui porte l'effet visible. Divergence de balisage
	 * MESURÉE NULLE, déclarée ici plutôt que réglée en rouvrant un gabarit gelé.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : santé, compteurs de modules, palmarès,
	 * répartition par type et contributeurs sont calculés depuis
	 * `seeds/corpus.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-11.css`, posé par `node verif/feuilles-de-vue.mjs V-11
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import {
		DETAIL_DOMAINES,
		DOMAINES,
		INSTANCE,
		MESURES_7J,
		MODIFICATIONS,
		MODULES,
		MOI,
		REVISIONS,
		UNIVERS,
		type CleDeModule,
		type DemandeDeRevision,
		type DetailDeDomaine,
		type Domaine,
		type EtatDInstance,
		type IdentifiantNote,
		type Module,
		type NomDeDomaine,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { segmentsDeDossier } from '$lib/rangement/adresses';

	/**
	 * LES NEUF SOURCES QUI NE VENAIENT DE NULLE PART — T-041.
	 *
	 * Jusqu'ici les constantes du jeu de semence étaient lues AU NIVEAU DU
	 * MODULE : un chargeur de route pouvait passer `notes`, et rien d'autre
	 * n'atteignait l'écran — « En attente de révision » servait le même chiffre à
	 * qui que ce soit. Elles sont désormais des PROPRIÉTÉS OPTIONNELLES.
	 *
	 * LE DÉFAUT EST LA CONSTANTE, ET C'EST CE QUI TIENT LE GEL. Le mode démo ne
	 * passe que `etat`, `vecteur` et `notes` : la vue reçoit exactement ce qu'elle
	 * recevait, et les 32 couples du banc ne bougent pas. Ce lot rend le passage
	 * POSSIBLE ; il ne décide pas de ce qui sera passé.
	 *
	 * `detailDomaines` ET `modules` SONT CEUX QUI RENDENT `P-04` EFFECTIVE. La
	 * section « Accès » sortait de la constante et COÏNCIDAIT avec la table
	 * `modules_de_domaine` sans en être PILOTÉE (mesuré par T-032).
	 *
	 * LES DEUX TABLES DE MESURE SONT PARTIELLES, ET C'EST DÉLIBÉRÉ. Aucune table
	 * ne porte `MESURES_7J` ni `MODIFICATIONS`. Exiger la forme complète
	 * interdirait au chargeur de passer un ensemble vide — c'est-à-dire l'état
	 * neutre explicite que P-02 réclame quand la mesure est indisponible. Le
	 * défaut, lui, reste la constante entière.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — domaine × profil × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-11')`, variante « lecture ». */
		notes: readonly Note[];
		/** Les univers déclarés. Absents, ceux du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines accessibles. Absents, ceux du jeu de semence. */
		domaines?: readonly Domaine[];
		/** L'utilisateur connecté. Absent, celui du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance — version, synchronisation. Absent, celui du jeu. */
		instance?: EtatDInstance;
		/** Consultations des sept derniers jours, par note. */
		mesures7j?: Partial<Record<IdentifiantNote, number>>;
		/** Ancienneté de modification, en jours, par note. */
		modifications?: Partial<Record<IdentifiantNote, number>>;
		/** Les demandes de révision. Absentes, celles du jeu de semence. */
		revisions?: readonly DemandeDeRevision[];
		/** Description et modules activés, par domaine — porté par la base. */
		detailDomaines?: Record<NomDeDomaine, DetailDeDomaine>;
		/** Le catalogue des modules — nom et sous-titre de chaque clé. */
		modules?: Record<CleDeModule, Module>;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte: moi = MOI,
		instance = INSTANCE,
		mesures7j = MESURES_7J,
		modifications = MODIFICATIONS,
		revisions: demandesDeRevision = REVISIONS,
		detailDomaines = DETAIL_DOMAINES,
		modules = MODULES
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const profil = $derived(String(reglage['role'] ?? 'referent'));
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions puis les cache —
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-11-page-domaine.html:338`) et
	 * `.app:not([data-role="admin"]) .si-admin { display: none }` (`:339`).
	 * Une maquette statique n'a pas de serveur : le masquage y est sa SEULE
	 * possibilité. Le produit peut ne pas émettre le nœud, et P-09 l'exige —
	 * « ni grisée, NI MASQUÉE ». La classe reste posée quand le nœud est rendu :
	 * elle porte aussi le rendu. Énumération : `docs/omissions-p09.md`.
	 */
	const ecriture = $derived(profil !== 'lecteur');
	const admin = $derived(profil === 'admin');
	const vide = $derived(reglage['etat'] === 'vide');

	const courant = $derived(
		(domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0]) as Domaine
	);

	/**
	 * LE DOMAINE QUE LA PLANCHE REND AU CHARGEMENT — `verif/scenarios/V-11.json`,
	 * `defaut.dom`. Il n'a rien d'un détail : le gel le laisse MIS EN ÉVIDENCE
	 * dans le rail après un changement de domaine.
	 */
	const DOMAINE_INITIAL = 'Infrastructure';

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — DEUX DOMAINES, ET C'EST UN FAIT DU GEL.
	 *
	 * MESURÉ, page stabilisée dans les conditions du banc, pas déduit :
	 *
	 *   dom-infrastructure    → .noeud--courant : ["Infrastructure"]
	 *   dom-migration-2026    → ["Infrastructure", "Migration 2026"]
	 *   dom-poste-de-travail  → ["Infrastructure", "Poste de travail"]
	 *
	 * `coquille()` de la maquette AJOUTE la marque et ne la retire jamais
	 * (`V-11:1819-1832`, la marque est posée à `:1822`) : la planche rend d'abord `Infrastructure`, puis le
	 * changement de position ajoute le second domaine sans effacer le premier.
	 * Ne pas le reproduire coûte 6 903 pixels sur deux des huit états — mesuré,
	 * pas estimé —, et « corriger » le gel est un comblement qui serait rouge au
	 * banc (`docs/releve-vues.md` §7.7, `data-numerote`).
	 *
	 * CE N'EST PAS LE COMPORTEMENT DU PRODUIT, et le rapport de lot le déclare :
	 * une page de domaine n'a qu'un domaine courant. La reprise appartient au lot
	 * de logique, avec l'arbitrage qui va avec ; le squelette, lui, rend le gel.
	 *
	 * V-10 et V-13 n'ont pas ce cas : V-10 ne met en évidence aucun nœud
	 * (`courant: []`), et les trois chemins de V-13 sont EMBOÎTÉS — l'union des
	 * marques accumulées y est exactement le chemin courant.
	 */
	const railCourant = $derived(
		courant.nom === DOMAINE_INITIAL ? [courant.nom] : [DOMAINE_INITIAL, courant.nom]
	);
	const detail = $derived(detailDomaines[courant.nom]);
	const notesDuDomaine = $derived(vide ? [] : corpus.filter((n) => n.domaine === courant.nom));

	/* ── Fraîcheur ──────────────────────────────────────────────────────────
	   Le même composant que partout ailleurs (P-01) : la répartition compte les
	   niveaux que le corpus porte. L'ordre des parts est celui du gel. */
	interface Part {
		readonly cle: 'frais' | 'vieil' | 'obs';
		readonly classe: string;
		readonly pluriel: string;
		readonly singulier: string;
	}

	const PARTS: readonly Part[] = [
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	];

	function compte(notes: readonly Note[], cle: Part['cle']): number {
		return notes.filter((n) => n.fraicheur === cle).length;
	}

	function partsPresentes(notes: readonly Note[]): readonly Part[] {
		return PARTS.filter((p) => compte(notes, p.cle) > 0);
	}

	function accord(p: Part, n: number): string {
		return n > 1 ? p.pluriel : p.singulier;
	}

	function resumeRepartition(notes: readonly Note[]): string {
		return (
			partsPresentes(notes)
				.map((p) => `${compte(notes, p.cle)} ${accord(p, compte(notes, p.cle))}`)
				.join(', ') + ` sur ${notes.length}`
		);
	}

	function libellePart(p: Part, notes: readonly Note[], contexte: string): string {
		const n = compte(notes, p.cle);
		return `${n} ${accord(p, n)}${contexte ? ` · ${contexte}` : ''}`;
	}

	/* ── Témoin de fraîcheur ─────────────────────────────────────────────────
	   Rien n'est écrit ici : la classe, le nombre de barres et le libellé
	   sortent tous les trois de `$lib/fraicheur`, l'implémentation unique de
	   P-01 (ADR-005). Une fonction locale qui rendrait le nombre de barres
	   serait `barresFraicheur` réécrite sans son nom — c'est exactement ce
	   qu'elle était avant T-013c. */

	/* ── Santé du domaine ───────────────────────────────────────────────────── */
	const jamais = $derived(notesDuDomaine.filter((n) => n.revise === null).length);
	const revisions = $derived(
		demandesDeRevision.filter((r) => notesDuDomaine.some((n) => n.id === r.id)).length
	);
	const brouillons = $derived(notesDuDomaine.filter((n) => n.brouillon).length);

	/* ── Arborescence de dossiers, déduite du rangement réel des notes ───────
	   Aucune structure séparée : le rangement affiché est celui qui existe. */
	interface NoeudDeDossier {
		readonly enfants: Record<string, NoeudDeDossier>;
	}

	function arbreDuDomaine(domaine: string): Record<string, NoeudDeDossier> {
		const racines: Record<string, NoeudDeDossier> = {};
		for (const n of corpus) {
			if (n.domaine !== domaine || !n.dossier) continue;
			let niveau = racines;
			for (const segment of segmentsDeDossier(n.dossier)) {
				const existant = niveau[segment];
				const noeud = existant ?? { enfants: {} };
				if (!existant) niveau[segment] = noeud;
				niveau = noeud.enfants;
			}
		}
		return racines;
	}

	function compterDossiers(arbre: Record<string, NoeudDeDossier>): number {
		let total = 0;
		for (const noeud of Object.values(arbre)) total += 1 + compterDossiers(noeud.enfants);
		return total;
	}

	/** Les compteurs portés par les entrées de module. Quatre modules sur six en
	 *  ont un ; cartographie et carte mentale n'en portent pas. */
	const comptes = $derived<Partial<Record<CleDeModule, number>>>({
		notes: notesDuDomaine.length,
		dossiers: compterDossiers(arbreDuDomaine(courant.nom)),
		fiches: notesDuDomaine.filter((n) => n.type === 'Fiche').length,
		signets: notesDuDomaine.filter((n) => n.type === 'Signet').length
	});

	/* ── Palmarès ───────────────────────────────────────────────────────────── */
	const populaires = $derived(
		[...notesDuDomaine].sort((a, b) => (mesures7j[b.id] ?? 0) - (mesures7j[a.id] ?? 0)).slice(0, 5)
	);
	const recentes = $derived(
		[...notesDuDomaine]
			.sort((a, b) => (modifications[a.id] ?? 999) - (modifications[b.id] ?? 999))
			.slice(0, 5)
	);

	function ancienneteDeModification(n: Note): string {
		const j = modifications[n.id];
		if (typeof j !== 'number') return '—';
		return j <= 1 ? 'hier' : `il y a ${j} j`;
	}

	/* ── Répartition par type ────────────────────────────────────────────────
	   Le tri est décroissant sur le compte ; à égalité, l'ordre d'apparition est
	   conservé — le tri du gel est stable et n'ajoute aucun départage. */
	const parType = $derived.by<readonly [string, number][]>(() => {
		const table: Record<string, number> = {};
		for (const n of notesDuDomaine) table[n.type] = (table[n.type] ?? 0) + 1;
		return Object.entries(table).sort((a, b) => b[1] - a[1]);
	});
	const maxiType = $derived(Math.max(...parType.map(([, v]) => v)));

	/* ── Contributeurs ──────────────────────────────────────────────────────── */
	interface Contributeur {
		readonly nom: string;
		readonly initiales: string;
		readonly notes: number;
	}

	const contribs = $derived.by<readonly Contributeur[]>(() => {
		const par: Record<string, number> = {};
		for (const n of notesDuDomaine) par[n.auteur] = (par[n.auteur] ?? 0) + 1;
		return Object.entries(par)
			.map(([nom, c]) => ({
				nom,
				initiales: nom
					.split(' ')
					.map((m) => m[0])
					.join('')
					.slice(0, 2)
					.toUpperCase(),
				notes: c
			}))
			.sort((a, b) => b.notes - a.notes || a.nom.localeCompare(b.nom, 'fr'));
	});
	const maxiContrib = $derived(contribs[0]?.notes ?? 1);

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}
</script>

<!-- Le témoin de fraîcheur — une seule fabrique, pour qu'il ne diverge pas. -->
{#snippet temoin(n: Note)}
	<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>
{/snippet}

<!-- Une ligne de palmarès : rang facultatif, titre, témoin, mesure. -->
{#snippet ligneNote(n: Note, rang: number | null, mesure: string)}
	<a class="ligne-note" href="#"
		>{#if rang !== null}<span class="ligne-note__rang">{String(rang).padStart(2, '0')}</span
			>{/if}<span class="ligne-note__corps"
			><span class="ligne-note__titre">{n.titre}</span><span class="ligne-note__sous"
				>{@render temoin(n)}</span
			></span
		><span class="ligne-note__n">{mesure}</span></a
	>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="domaine"
	fil={['Accueil', courant.univers, courant.nom]}
	courant={railCourant}
	role={profil === 'admin' ? 'admin' : 'referent'}
	droits={profil === 'lecteur' ? 'lecture' : 'ecriture'}
	donnees={{ 'data-etat': vide ? 'vide' : 'peuple' }}
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
		<header class="couv" id="couv" style="--teinte:{courant.couleur}">
			<div class="couv__corps">
				<div class="couv__sur">
					<span class="couv__puce"></span>
					<span class="etiq" id="univers-lien">{courant.univers}</span>
				</div>
				<h1 id="titre">{courant.nom}</h1>
				<p id="description">{detail.description}</p>
			</div>
			<div class="couv__actions">
				<!-- P-09 · ARB-040 — omises, jamais masquées. `V-11:1105`, `:1109`, `:1110` -->
				{#if ecriture}<button class="btn btn--principal si-ecriture" id="a-creer">
						<svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
						>
						Nouvelle note
					</button>
					<button class="btn si-ecriture" id="a-importer">Importer ici</button>{/if}
				{#if admin}<button class="btn si-admin" id="a-exporter">Exporter</button>{/if}
			</div>
		</header>

		<section class="sante" id="sante" aria-label="Santé du domaine">
			<div class="mesure mesure--fraicheur">
				<span class="mesure__nom etiq">Fraîcheur du domaine</span>
				<div class="total-notes">
					<b>{nb(notesDuDomaine.length)}</b>{notesDuDomaine.length > 1 ? 'notes' : 'note'}
				</div>
				{#if notesDuDomaine.length === 0}<div class="zone-etat__txt" style="margin:0">
						Aucune note à mesurer.
					</div>
				{:else}<div class="repart" role="img" aria-label={resumeRepartition(notesDuDomaine)}>
						{#each partsPresentes(notesDuDomaine) as p (p.cle)}<button
								type="button"
								class={p.classe}
								style="flex:{compte(notesDuDomaine, p.cle)}"
								title={libellePart(p, notesDuDomaine, courant.nom)}
								aria-label={libellePart(p, notesDuDomaine, courant.nom)}
							></button>{/each}
					</div>
					<div class="legende">
						{#each partsPresentes(notesDuDomaine) as p (p.cle)}<span
								><i class={p.classe}></i><b>{compte(notesDuDomaine, p.cle)}</b>
								{accord(p, compte(notesDuDomaine, p.cle))}</span
							>{/each}
					</div>{/if}
			</div>
			<div class="mesure{jamais > 0 ? ' mesure--appel' : ''}{jamais === 0 ? ' mesure--nulle' : ''}">
				<!-- prettier-ignore -->
				<button class="mesure__lien" type="button"><span class="mesure__nom etiq">Jamais vérifiées</span><div class="mesure__val">{nb(jamais)}</div><span class="mesure__sous">{jamais ? 'Aucune date de contrôle' : 'Toutes ont été contrôlées au moins une fois'}</span></button>
			</div>
			<div
				class="mesure{revisions > 0 ? ' mesure--appel' : ''}{revisions === 0
					? ' mesure--nulle'
					: ''}"
			>
				<!-- prettier-ignore -->
				<button class="mesure__lien" type="button"><span class="mesure__nom etiq">En attente de révision</span><div class="mesure__val">{nb(revisions)}</div><span class="mesure__sous">{revisions ? 'Signalées par des collègues' : 'Rien de signalé'}</span></button>
			</div>
			<div class="mesure{brouillons === 0 ? ' mesure--nulle' : ''}">
				<!-- prettier-ignore -->
				<button class="mesure__lien" type="button"><span class="mesure__nom etiq">Brouillons</span><div class="mesure__val">{nb(brouillons)}</div><span class="mesure__sous">{brouillons ? 'Non visibles du public' : 'Rien en attente de publication'}</span></button>
			</div>
		</section>

		<div class="si-vide">
			<div class="amorce">
				<h2>Ce domaine ne contient aucune note</h2>
				<p>
					L'espace existe, il attend son contenu. Le plus rapide reste de reprendre ce qui est déjà
					écrit ailleurs plutôt que de repartir d'une page blanche.
				</p>
				<div class="amorce__actions">
					<!-- P-09 · ARB-040 — omises, jamais masquées. `V-11:1123`, `:1124` -->
					{#if ecriture}<button class="btn btn--principal si-ecriture" id="v-importer"
							>Importer dans ce domaine</button
						>
						<button class="btn si-ecriture" id="v-creer">Créer la première note</button>{/if}
				</div>
			</div>
		</div>

		<div class="si-peuple">
			<div class="section-titre">
				<h2>Accès</h2>
				<span class="etiq" id="n-modules"
					>{#if !vide}{detail.modules.length}
						{detail.modules.length > 1 ? 'modules activés' : 'module activé'}{/if}</span
				>
			</div>
			<section class="modules" id="modules">
				{#if !vide}
					{#each detail.modules as m (m)}
						<button class="module" type="button"
							><span class="module__ic"
								>{#if m === 'notes'}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"
										><path
											d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
										/></svg
									>{:else if m === 'dossiers'}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"
										><path
											d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
										/></svg
									>{:else if m === 'fiches'}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"
										><rect x="2" y="3" width="12" height="10" rx="1.4" /><path
											d="M2 6h12M5.5 9h5"
										/></svg
									>{:else if m === 'cartographie'}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"
										><circle cx="4" cy="4" r="2" /><circle cx="12" cy="6" r="2" /><circle
											cx="7"
											cy="12"
											r="2"
										/><path d="M5.8 4.6l4.4 1M5.4 5.7l1.2 4.4" /></svg
									>{:else if m === 'signets'}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
									>{:else}<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.4"
										><circle cx="3.5" cy="8" r="1.8" /><rect
											x="9.5"
											y="2"
											width="5"
											height="3.4"
											rx="1"
										/><rect x="9.5" y="10.6" width="5" height="3.4" rx="1" /><path
											d="M5.3 8h2.2V3.7h2M7.5 8v4.3h2"
										/></svg
									>{/if}</span
							><span class="module__corps"
								><span class="module__nom"
									>{modules[m].nom}{#if typeof comptes[m] === 'number'}<span class="module__n"
											>{comptes[m]}</span
										>{/if}</span
								><span class="module__sous">{modules[m].sous}</span></span
							></button
						>
					{/each}
				{/if}
			</section>

			<div class="grille-dom" style="margin-top:var(--e-6)">
				<div class="colonne">
					<section class="panneau">
						<div class="panneau__tete">
							<span class="etiq">Notes les plus consultées</span><span class="etiq">7 jours</span>
						</div>
						<div class="panneau__corps panneau__corps--serre" id="populaires">
							{#if !vide}{#each populaires as n, rang (n.id)}{@render ligneNote(
										n,
										rang + 1,
										`${mesures7j[n.id] ?? 0} vues`
									)}{/each}{/if}
						</div>
					</section>

					<section class="panneau">
						<div class="panneau__tete"><span class="etiq">Notes récemment modifiées</span></div>
						<div class="panneau__corps panneau__corps--serre" id="recentes">
							{#if !vide}{#each recentes as n (n.id)}{@render ligneNote(
										n,
										null,
										ancienneteDeModification(n)
									)}{/each}{/if}
						</div>
					</section>
				</div>

				<div class="colonne">
					<section class="panneau">
						<div class="panneau__tete"><span class="etiq">Répartition par type</span></div>
						<div class="panneau__corps" id="types">
							{#if !vide}
								<div class="types">
									{#each parType as [type, n] (type)}<button class="type-ligne" type="button"
											><span class="type-ligne__nom">{type}</span><span class="type-ligne__barre"
												><i style="width:{Math.round((n / maxiType) * 100)}%"></i></span
											><span class="type-ligne__n">{n}</span></button
										>{/each}
								</div>
							{/if}
						</div>
					</section>

					<section class="panneau">
						<div class="panneau__tete">
							<span class="etiq">Contributeurs</span><span class="chiffre" id="n-contribs"
								>{#if !vide}{contribs.length}{/if}</span
							>
						</div>
						<div class="panneau__corps" id="contribs">
							{#if !vide}{#each contribs as c (c.nom)}<div class="contrib">
										<span class="contrib__av">{c.initiales}</span><span class="contrib__nom"
											>{c.nom}</span
										><span class="contrib__part"
											><span class="contrib__barre"
												><i style="width:{Math.round((c.notes / maxiContrib) * 100)}%"></i></span
											><span class="contrib__n">{c.notes} {c.notes > 1 ? 'notes' : 'note'}</span
											></span
										>
									</div>{/each}{/if}
						</div>
					</section>
				</div>
			</div>
		</div>
	{/snippet}
</Coquille>
