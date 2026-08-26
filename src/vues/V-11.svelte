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
	 * LES GESTES DE CET ÉCRAN MÈNENT QUELQUE PART, et c'est la route qui les
	 * accroche, par sélecteur et jamais par balisage réécrit (`ARB-063`,
	 * `[domaine]/cablage.ts`) : les segments de la barre de fraîcheur, les quatre
	 * indicateurs de santé, les six pastilles de module, les lignes de type et les
	 * lignes de contributeur ouvrent la liste des notes du domaine, sur la facette
	 * qui les nomme quand elle existe. Trois n'en ont pas et ouvrent la liste sans
	 * filtre — un filtre approchant mentirait ; le câblage le dit et l'énumère.
	 *
	 * UNE LIGNE DE CONTRIBUTEUR EST UN BOUTON, comme la ligne de type qui lui fait
	 * face dans la colonne. Le gel la dessine en `<div>` faute de destination —
	 * il n'a pas de serveur —, et elle ne menait donc nulle part : la facette
	 * `auteur` de la liste existe et est honorée, la ligne y mène. La règle de
	 * neutralisation est celle de `.type-ligne`, sa jumelle, et le rendu ne bouge
	 * pas d'un pixel.
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
	 * répartition par type et contributeurs sont calculés depuis les propriétés
	 * servies.
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
	import type {
		CleDeModule,
		DemandeDeRevision,
		DetailDeDomaine,
		Domaine,
		IdentifiantNote,
		Module,
		NomDeDomaine,
		Note,
		Univers
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import { libelleDeModule } from '$lib/rangement/modules';
	import { accord } from '$lib/vocabulaire';
	import { adresseDeNote, segmentsDeDossier } from '$lib/rangement/adresses';

	/**
	 * LES SOURCES DE L'ÉCRAN SONT REQUISES — le motif est retiré, pas contourné.
	 *
	 * Elles ont été OPTIONNELLES, de défaut la constante de `seeds/corpus.ts`, et
	 * cette forme garantissait qu'une route qui en oubliait une servait le jeu de
	 * démonstration SANS QUE RIEN NE PROTESTE : « En attente de révision » servait
	 * le même chiffre à qui que ce soit, et aucun compilateur, aucun test, aucun
	 * écran ne le disait.
	 *
	 * `exactOptionalPropertyTypes` et `strict` sont actifs, `svelte-check` est
	 * dans `pnpm check` : une route qui oublierait l'une d'elles NE COMPILE PLUS.
	 *
	 * `detailDomaines` ET `modules` RENDENT `P-04` EFFECTIVE, et leurs deux
	 * sources sont distinctes : les CLÉS actives d'un domaine viennent de
	 * `modules_de_domaine` (`RG-STR-06`), les LIBELLÉS du catalogue de produit
	 * `$lib/rangement/modules.ts`.
	 *
	 * LES DEUX TABLES DE MESURE SONT PARTIELLES, ET C'EST DÉLIBÉRÉ. `Partial` et
	 * non `Record` total : exiger la forme complète interdirait au chargeur de
	 * passer un ensemble vide — l'état neutre explicite que P-02 réclame quand la
	 * mesure est indisponible. Ce qui n'y est pas se DIT, jamais ne s'invente.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — domaine × profil × état. */
		vecteur: Record<string, string | boolean> | null;
		/** Les notes lisibles, servies par le chargeur. */
		notes: readonly Note[];
		/** Les univers déclarés — vides tant que l'instance n'en porte aucun. */
		univers: readonly Univers[];
		/** Les domaines accessibles — vides tant que l'instance n'en porte aucun. */
		domaines: readonly Domaine[];
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		/** Consultations des sept derniers jours, par note. */
		mesures7j: Partial<Record<IdentifiantNote, number>>;
		/** Ancienneté de modification, en jours, par note. */
		modifications: Partial<Record<IdentifiantNote, number>>;
		/** Les demandes de révision ouvertes — vides quand rien n'est signalé. */
		revisions: readonly DemandeDeRevision[];
		/** Description et modules activés, par domaine — lus en base. */
		detailDomaines: Record<NomDeDomaine, DetailDeDomaine>;
		/** Le catalogue des modules — nom et sous-titre de chaque clé. */
		modules: Record<CleDeModule, Module>;
		/**
		 * Le nombre de dossiers du domaine, racine exclue — le compteur porté par
		 * l'entrée « Dossiers » de la section « Accès ».
		 *
		 * ABSENT, IL EST DÉDUIT DU RANGEMENT DES NOTES, comme la maquette le
		 * déduit : elle n'a que `window.CORPUS` pour le calculer. Cette déduction
		 * ne voit PAS un dossier vide — mesuré sur le corpus, `Infrastructure`
		 * porte sept dossiers sous sa racine et la déduction en rend six. Le
		 * défaut reste la déduction pour que le gel ne bouge pas ; un chargeur qui
		 * lit la table `dossiers` passe le compte réel.
		 */
		nombreDeDossiers?: number;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte: compteConnecte = null,
		mesures7j,
		modifications,
		revisions: demandesDeRevision,
		detailDomaines,
		modules,
		nombreDeDossiers = undefined
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

	/**
	 * AUCUN DOMAINE — l'état vide, écrit plutôt que subi. La liste servie ne peut
	 * pas être vide sur cette route : le chargeur résout le domaine de l'adresse
	 * avant d'ouvrir l'écran. Le repli est là pour que la propriété soit honnête
	 * sur toute sa forme — un tableau vide rendait `domaines[0].nom` et sortait
	 * en 500.
	 */
	const AUCUN_DOMAINE: Domaine = { nom: '', univers: '', couleur: '' };

	const courant = $derived(
		domaines.find((d) => d.nom === reglage['dom']) ?? domaines[0] ?? AUCUN_DOMAINE
	);

	/**
	 * LA MISE EN ÉVIDENCE DU RAIL — LE DOMAINE COURANT, ET LUI SEUL.
	 *
	 * Le gel en marquait DEUX : `coquille()` de la maquette AJOUTE la marque et ne
	 * la retire jamais (`V-11:1819-1832`), si bien que la planche rendait d'abord
	 * « Infrastructure » — le domaine que son scénario charge — puis ajoutait le
	 * domaine visité sans effacer le premier. La vue recopiait ce comportement,
	 * et donc le NOM D'UN DOMAINE DU JEU DE DÉMONSTRATION, écrit en dur : sur une
	 * instance qui ne porte pas ce nom, le rail marquait un nœud inexistant ; sur
	 * une qui le porte, il le marquait sans qu'on l'ait visité.
	 *
	 * Une page de domaine n'a qu'un domaine courant. C'était déjà écrit ici, sous
	 * la forme d'une dette assumée au banc ; le banc a été supprimé, la dette se
	 * paie.
	 */
	const railCourant = $derived([courant.nom]);
	/* `NomDeDomaine` est une chaîne : la table de détail peut ne rien porter
	   pour un domaine créé dans la console. Le repli vide évite la page en
	   erreur, et ne change rien au gel — tous ses domaines ont leur détail. */
	const detail = $derived(detailDomaines[courant.nom] ?? { description: '', modules: [] });
	const notesDuDomaine = $derived(vide ? [] : corpus.filter((n) => n.domaine === courant.nom));

	/* ── Fraîcheur ──────────────────────────────────────────────────────────
	   Le même composant que partout ailleurs (P-01) : la répartition compte les
	   niveaux que le corpus porte. L'ordre des parts est celui du gel. */
	interface Part {
		readonly cle: 'frais' | 'vieil' | 'obs';
		readonly classe: string;
		/* Le pluriel n'est plus porté : les trois formes sont en `+s`, et
		   `accord()` (`$lib/vocabulaire`) est la seule source de cette règle. */
		readonly singulier: string;
	}

	const PARTS: readonly Part[] = [
		{ cle: 'frais', classe: 'p-frais', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', singulier: 'obsolète' }
	];

	function compte(notes: readonly Note[], cle: Part['cle']): number {
		return notes.filter((n) => n.fraicheur === cle).length;
	}

	function partsPresentes(notes: readonly Note[]): readonly Part[] {
		return PARTS.filter((p) => compte(notes, p.cle) > 0);
	}

	function resumeRepartition(notes: readonly Note[]): string {
		return (
			partsPresentes(notes)
				.map((p) => `${compte(notes, p.cle)} ${accord(compte(notes, p.cle), p.singulier)}`)
				.join(', ') + ` sur ${notes.length}`
		);
	}

	function libellePart(p: Part, notes: readonly Note[], contexte: string): string {
		const n = compte(notes, p.cle);
		return `${n} ${accord(n, p.singulier)}${contexte ? ` · ${contexte}` : ''}`;
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
		dossiers: nombreDeDossiers ?? compterDossiers(arbreDuDomaine(courant.nom)),
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
		if (j <= 0) return "aujourd'hui";
		return j === 1 ? 'hier' : `il y a ${j} j`;
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

<!--
	`svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR LE BALISAGE DE
	CETTE VUE, ET LA RAISON EST LA MÊME QUE POUR LE FIL D'ARIANE DE LA COQUILLE.

	La règle veille à ce qu'une adresse interne passe par `resolve()` de
	SvelteKit. Les adresses de cette vue sont COMPOSÉES par
	`$lib/rangement/adresses.ts`, la fabrique unique du rangement : la règle
	inspecte l'EXPRESSION du `href`, elle ne peut pas la suivre jusque là, et
	elle ne peut pas non plus la vérifier ici. Faire passer une adresse déjà
	composée par `resolve()` ne prouverait rien de plus et ajouterait une
	seconde source de vérité pour une forme qui n'en a qu'une.

	Même geste, même justification qu'en V-03, V-22, V-24 et
	`src/lib/coquille/BarreSuperieure.svelte`.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
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
	<a class="ligne-note" href={adresseDeNote(n.id)}
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
	compte={compteConnecte ?? COMPTE_VIDE}
	version=""
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
					<b>{nb(notesDuDomaine.length)}</b>{accord(notesDuDomaine.length, 'note')}
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
								{accord(compte(notesDuDomaine, p.cle), p.singulier)}</span
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

		<!--
			L'ACCÈS AUX MODULES EST RENDU QUEL QUE SOIT L'ÉTAT — ÉCART ASSUMÉ AU GEL.

			Le gel masque le bloc entier sur un domaine sans note
			(`mockups/V-11-page-domaine.html:882`), et le port l'a suivi. Dans une
			maquette statique le masquage ne coûtait rien : aucune pastille n'y
			navigue. Dans le produit il fermait le SEUL chemin vers la racine des
			dossiers — donc vers le seul geste qui crée un dossier —, et un domaine
			neuf n'a par définition aucune note. Le même masquage frappait aussi un
			lecteur au périmètre étroit sur un domaine peuplé : `etat` se décide sur
			les notes LISIBLES par l'appelant.

			LA LIGNE DE PARTAGE : « Accès » offre des ENTRÉES, elles sont rendues
			toujours ; les quatre panneaux qui suivent sont des MESURES de notes, et
			une mesure sans note n'a rien à dire — ils restent dans `.si-peuple`.
		-->
		<div class="section-titre">
			<h2>Accès</h2>
			<span class="etiq" id="n-modules"
				>{detail.modules.length}
				{accord(detail.modules.length, 'module activé', 'modules activés')}</span
			>
		</div>
		<section class="modules" id="modules">
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
							>{libelleDeModule(modules, m).nom}{#if typeof comptes[m] === 'number'}<span
									class="module__n">{comptes[m]}</span
								>{/if}</span
						><span class="module__sous">{libelleDeModule(modules, m).sous}</span></span
					></button
				>
			{/each}
		</section>

		<div class="si-peuple">
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
										`${mesures7j[n.id] ?? 0} ${accord(mesures7j[n.id] ?? 0, 'vue')}`
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
							<!-- prettier-ignore -->
							{#if !vide}{#each contribs as c, rang (rang)}<button class="contrib" type="button"><span class="contrib__av">{c.initiales}</span><span class="contrib__nom">{c.nom}</span><span class="contrib__part"><span class="contrib__barre"><i style="width:{Math.round((c.notes / maxiContrib) * 100)}%"></i></span><span class="contrib__n">{c.notes + ' ' + accord(c.notes, 'note')}</span></span></button>{/each}{/if}
						</div>
					</section>
				</div>
			</div>
		</div>
	{/snippet}
</Coquille>
