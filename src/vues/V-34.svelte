<script lang="ts">
	/**
	 * V-34 — Console · Analytique. Route `/console/analytique`.
	 *
	 * TOUT CHIFFRE DE CET ÉCRAN EST CALCULÉ sur les données REÇUES. Les six fabriques
	 * du gel sont portées ligne à ligne : `tauxAbouti` (`V-34:2718`),
	 * `trousDocumentaires` (`V-34:2730`), `orphelines` (`V-34:2737`),
	 * `desynchronises` (`V-34:2749`), `contributeurs` (`V-34:2005`) et `sommeMesures`
	 * (`V-34:1933`). UN SEUL LITTÉRAL DU GEL EST RECOPIÉ : `ORPH` (`V-34:3172`), les
	 * trois familles d'orphelines — des LIBELLÉS d'interface.
	 *
	 * LE BLOC « Pas encore assez d'usage pour conclure » garde son titre du gel, mais
	 * NON ses deux nombres — « 34 recherches », « vers 300 recherches » : servis par
	 * une route, ils AFFIRMAIENT deux faits sur l'instance du lecteur, ce que
	 * `RG-M01-01` proscrit. IL NE NOMME AUCUNE TABLE ABSENTE : les cinq mesures sont
	 * portées par la base depuis la migration `010`, et une phrase qui les dirait
	 * manquantes serait fausse. La bascule reste `etatDesDonnees()`
	 * (`src/lib/donnees/consoles.ts`), qui ne rend `completes` que si aucune entrée de
	 * `MESURES_DE_CONSOLE_SANS_CONTREPARTIE` ne porte `vue === 'V-34'` — le bloc
	 * revient donc de lui-même le jour où une mesure disparaîtrait.
	 *
	 * AUCUN CLASSEMENT NOMINATIF N'EST FABRIQUÉ : « Volumes de contribution » est
	 * rendu SANS RANG, et la mention qui le suit est celle de la maquette.
	 *
	 * LES DEUX ÉTATS NE CHANGENT QU'UN ATTRIBUT : `data-donnees` sur `div.app`
	 * (`V-34:3349`). Les deux blocs — `.si-vide` et `.si-donnees` — sont TOUJOURS dans
	 * le document, et la feuille en masque un (`V-34:1092-1093`) ; n'en émettre qu'un
	 * changerait l'instantané ARIA.
	 *
	 * Une seule définition de la fraîcheur (`ADR-005`). V-34 est la seule vue de
	 * console dont l'en-tête porte un `span.etiq` là où les six registres portent le
	 * bouton `#creer` : c'est pour ce cas que le fragment d'action de `TeteDeSection`
	 * est facultatif.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-34.css`.
	 */
	import type {
		DemandeDeRevision,
		Domaine,
		IdentifiantNote,
		Note,
		Relation,
		RequeteDeRecherche
	} from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { accord } from '$lib/vocabulaire';

	interface Proprietes {
		vecteur?: Record<string, string | boolean> | null;
		notes: readonly Note[];
		domaines: readonly Domaine[];
		relations: readonly Relation[];
		/** LES DEUX TABLES DE MESURE QUE LE PRODUIT PORTE, EXIGÉES. `Partial<Record<…>>`
		    et non `Record<…>` : le type total exigerait un identifiant par note et
		    empêcherait un chargeur de passer un état partiel. Elles retombaient sur le jeu
		    de démonstration, dont elles affichaient les chiffres d'adoption. */
		mesures7j: Partial<Record<IdentifiantNote, number>>;
		mesures7jPrec: Partial<Record<IdentifiantNote, number>>;
		/**
		 * LES TROIS MESURES SERVIES PAR LE CHARGEUR — ÉTAT VIDE PAR DÉFAUT. L'ancienneté
		 * de modification vient de `notes.modifie_le`, les demandes de révision de
		 * `notes.revision_*`, le journal de recherche de la table `recherches` (`010`).
		 * Le défaut était la table du jeu, et l'écran servait ses 793 recherches comme
		 * des mesures de l'instance. Vide, chaque bloc qui en dérive ne se rend pas : le
		 * zéro muet est plus traître que l'absence.
		 */
		modifications?: Partial<Record<IdentifiantNote, number>>;
		revisions?: readonly DemandeDeRevision[];
		recherches?: readonly RequeteDeRecherche[];
		/**
		 * OUVRIR LA LISTE DES NOTES D'UN DOMAINE, DÉJÀ FILTRÉE SUR UN NIVEAU DE
		 * FRAÎCHEUR — `surPart()` du gel (`V-34:3140`). La vue désigne le domaine par
		 * son NOM, comme partout en console ; le niveau voyage sous le LIBELLÉ que la
		 * facette de V-12 emploie, jamais sous la clé interne.
		 */
		onVoirLesNotes?: (demande: { readonly domaine: string; readonly fraicheur: string }) => void;
		/** OUVRIR UNE NOTE — `V-34:3251` et `V-34:3304`, « vue V-14 ». */
		onOuvrirLaNote?: (identifiant: string) => void;
		/**
		 * TRAITER UN TROU DOCUMENTAIRE — `V-34:3100`. Le gel a deux issues : écrire la
		 * note qui manque quand la requête ne rend rien, examiner les résultats quand
		 * elle en rend sans qu'aucun ne soit ouvert. La page choisit l'adresse.
		 */
		onTrou?: (demande: { readonly terme: string; readonly resultats: number }) => void;
		/**
		 * L'ACTION PROPRE À UNE FAMILLE D'ORPHELINES — `V-34:3247`. La page décide,
		 * parce qu'elle seule connaît les adresses.
		 */
		onOrpheline?: (demande: {
			readonly famille: FamilleOrpheline;
			readonly identifiant: IdentifiantNote;
		}) => void;
	}

	/*
	 * LE RAIL, LA BARRE ET LA VERSION NE PASSENT PLUS PAR ICI. Cette vue portait
	 * `univers`, `compte` et `instance` sans jamais les lire : elle ne faisait que
	 * les remettre à `CoquilleDeConsole`, qui retombait sur le jeu de démonstration.
	 * `domaines` reste : la santé documentaire est rendue domaine par domaine.
	 */
	const {
		vecteur,
		notes,
		domaines,
		relations,
		mesures7j,
		mesures7jPrec,
		modifications = {},
		revisions = [],
		recherches = [],
		onVoirLesNotes,
		onOuvrirLaNote,
		onTrou,
		onOrpheline
	}: Proprietes = $props();

	/*
	 * CE QUI SE TAIT QUAND LA MESURE N'EXISTE PAS. Le prédicat porte sur la SOURCE,
	 * jamais sur le résultat : zéro trou documentaire mesuré sur un vrai journal est
	 * un fait, et se rend.
	 */
	const rechercheMesuree = $derived(recherches.length > 0);
	const revisionsMesurees = $derived(revisions.length > 0);
	const modificationsMesurees = $derived(Object.keys(modifications).length > 0);

	const reglage = $derived(vecteur ?? {});
	const donnees = $derived(
		reglage['don'] === 'insuffisantes' ? 'insuffisantes' : ('completes' as const)
	);

	/* ── Les fabriques du gel, portées ligne à ligne ───────────────────────── */

	const nb = (x: number): string => x.toLocaleString('fr-FR');

	/** UNE MOYENNE PAR JOUR, ARRONDIE AU DIXIÈME et non à l'unité. Le gel arrondit à
	 *  l'entier (`V-34:3277`), ce qui rendait « 10 recherches sur 30 jours » suivi de
	 *  « 0 par jour en moyenne » : deux lignes voisines qui se contredisent. */
	const moyenne = (x: number): string => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

	/** `window.tauxAbouti` (`V-34:2718`) — l'indicateur nord du produit. L'ARTICLE
	 *  « Les » A DISPARU DE « Les N autres sont des collègues repartis » : un article
	 *  ne s'accorde pas seul devant un chiffre. CE BLOC NE SE RENDRA QU'AVEC UN
	 *  JOURNAL DE RECHERCHE. */
	const taux = $derived.by(() => {
		let total = 0;
		let abouties = 0;
		for (const r of recherches) {
			total += r.n;
			abouties += r.ouvertures;
		}
		return { total, abouties, taux: total ? Math.round((abouties / total) * 100) : 0 };
	});

	/** `window.trousDocumentaires` (`V-34:2730`) — « l'échec silencieux compte
	 *  autant que l'absence de résultat ». */
	const trous = $derived(
		recherches
			.filter((r) => r.resultats === 0 || r.ouvertures === 0)
			.slice()
			.sort((a, b) => b.n - a.n)
	);

	/** `window.notesDuDomaine` (`V-34:2645`). */
	const notesDuDomaine = (nom: string): readonly Note[] => notes.filter((n) => n.domaine === nom);

	/** `window.contributeurs` (`V-34:2005`) — un volume, jamais une performance. */
	function contributeurs(liste: readonly Note[]): { nom: string; notes: number }[] {
		const par: Record<string, number> = {};
		for (const n of liste) par[n.auteur] = (par[n.auteur] ?? 0) + 1;
		return Object.entries(par)
			.map(([nom, compte]) => ({ nom, notes: compte }))
			.sort((a, b) => b.notes - a.notes || a.nom.localeCompare(b.nom, 'fr'));
	}

	/** `window.sommeMesures` (`V-34:1933`) — restreinte aux notes présentes. */
	const sommeMesures = (table: Partial<Record<string, number>>): number =>
		notes.reduce((s, n) => s + (table[n.id] ?? 0), 0);

	/** `window.desynchronises` (`V-34:2749`) — registres opérationnels dont la
	 *  référence a bougé depuis. */
	const desynchronises = $derived(
		notes.filter((n) => n.operationnel && (modifications[n.id] ?? 999) < 30)
	);

	/** `window.orphelines` (`V-34:2737`) — trois critères distincts, qui
	 *  n'appellent pas la même décision. */
	const orphelines = $derived.by(() => {
		const cibles = new Set(relations.map((r) => r.vers));
		return {
			jamaisVerifiees: notes.filter((n) => !n.revise),
			peuConsultees: notes.filter((n) => (mesures7j[n.id] ?? 0) < 8),
			sansLienEntrant: notes.filter(
				(n) => !cibles.has(n.id) && (n.type === 'Fiche' || n.type === 'Procédure')
			)
		};
	});

	/**
	 * LES TROIS FAMILLES D'ORPHELINES — littéral du gel (`V-34:3172`) : ce sont des
	 * libellés d'interface, que la donnée ne porte pas et n'a pas à porter.
	 */
	const ORPH = [
		{
			cle: 'jamaisVerifiees',
			nom: 'Jamais vérifiées',
			quoi: "Aucune date de contrôle depuis leur création. Leur signal est trompeur : il n'y a rien à mesurer.",
			action: 'Signaler à réviser'
		},
		{
			cle: 'peuConsultees',
			nom: 'Peu consultées',
			quoi: 'Moins de huit ouvertures sur sept jours. Soit elles ne servent pas, soit elles sont introuvables — vérifiez leur titre avant de conclure.',
			action: 'Réaffecter'
		},
		{
			cle: 'sansLienEntrant',
			nom: 'Sans lien entrant',
			quoi: "Aucune autre note n'y renvoie. Elles existent hors du tissu : personne ne tombera dessus par navigation.",
			action: 'Lier depuis une note'
		}
	] as const;

	type FamilleOrpheline = (typeof ORPH)[number]['cle'];

	/** Les libellés de fraîcheur de la facette de `V-12`, et pas d'autres : c'est
	 *  eux que l'adresse pré-filtrée attend (`docs/routes.md` §4.2). */
	const LIBELLE_DE_FRAICHEUR: Record<string, string> = {
		frais: 'Frais',
		vieil: 'Vieillissant',
		obs: 'Obsolète probable'
	};

	/** L'onglet courant au chargement (`var orphCourant`, `V-34:3183`). */
	const ORPH_COURANT = 'jamaisVerifiees';

	/**
	 * L'ONGLET DEMANDÉ DEPUIS L'ÉCRAN — `orphCourant = o.id; rendreOrphelines()` du
	 * gel (`V-34:3197`). `null` au rendu serveur : le premier onglet reste celui du
	 * gel.
	 */
	let ongletDemande = $state<FamilleOrpheline | null>(null);
	const orphCourant = $derived<FamilleOrpheline>(ongletDemande ?? ORPH_COURANT);
	const familleCourante = $derived(ORPH.find((o) => o.cle === orphCourant)!);
	const listeCourante = $derived(orphelines[orphCourant]);

	/* ── La barre de répartition, calque de `V-34:2960` ────────────────────── */

	interface Repartition {
		frais: number;
		vieil: number;
		obs: number;
		total: number;
	}

	/** `window.repartitionFraicheur` (`V-34:1937`). */
	const repartition = (liste: readonly Note[]): Repartition => ({
		frais: liste.filter((n) => n.fraicheur === 'frais').length,
		vieil: liste.filter((n) => n.fraicheur === 'vieil').length,
		obs: liste.filter((n) => n.fraicheur === 'obs').length,
		total: liste.length
	});

	const PARTS = [
		{ cle: 'frais', classe: 'p-frais', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', singulier: 'obsolète' }
	] as const;

	const partsDe = (r: Repartition, contexte?: string) =>
		PARTS.filter((p) => r[p.cle]).map((p) => ({
			...p,
			n: r[p.cle],
			court: `${r[p.cle]} ${accord(r[p.cle], p.singulier)}`,
			libelle: `${r[p.cle]} ${accord(r[p.cle], p.singulier)}${contexte ? ` · ${contexte}` : ''}`
		}));

	const libelleDeBarre = (r: Repartition) =>
		`${partsDe(r)
			.map((p) => p.court)
			.join(', ')} sur ${r.total}`;

	/* ── La santé documentaire, domaine par domaine (`V-34:3114`) ──────────── */
	const sante = $derived(
		domaines
			.map((dom) => {
				const liste = notesDuDomaine(dom.nom);
				/* DEUX ALERTES SUR QUATRE SE TAISENT SANS LEUR TABLE : « en attente de
				   révision » et « opérationnels désynchronisés » se comptent sur des mesures
				   que le produit ne porte pas, et leur zéro ne dirait pas « aucun », il
				   dirait « rien ne le sait ». */
				const alertes: readonly (readonly [number, string])[] = [
					[
						liste.filter((n) => !n.revise).length,
						accord(liste.filter((n) => !n.revise).length, 'jamais vérifiée', 'jamais vérifiées')
					],
					...(revisionsMesurees
						? [
								[
									revisions.filter((r) => liste.some((n) => n.id === r.id)).length,
									'en attente de révision'
								] as const
							]
						: []),
					[
						liste.filter((n) => n.brouillon).length,
						accord(liste.filter((n) => n.brouillon).length, 'brouillon')
					],
					...(modificationsMesurees
						? [
								[
									desynchronises.filter((x) => x.domaine === dom.nom).length,
									accord(
										desynchronises.filter((x) => x.domaine === dom.nom).length,
										'opérationnel désynchronisé',
										'opérationnels désynchronisés'
									)
								] as const
							]
						: [])
				];
				return {
					dom,
					liste,
					repartition: repartition(liste),
					contributeurs: contributeurs(liste).length,
					alertes
				};
			})
			.filter((s) => s.liste.length)
	);

	/* ── L'adoption (`V-34:3268`) ──────────────────────────────────────────── */
	const adoption = $derived.by(() => {
		const a = sommeMesures(mesures7j);
		const p = sommeMesures(mesures7jPrec);
		/* SANS SEMAINE DE RÉFÉRENCE, LA VARIATION EST INDÉFINIE — PAS NULLE. Le repli
		   rendait « 0 % contre la semaine précédente » sur une instance dont la semaine
		   précédente n'a aucune consultation : une comparaison affirmée là où il n'y a
		   rien à comparer. Ici la mesure de la semaine EXISTE, seule sa comparaison
		   manque, et c'est la sous-ligne qui le dit. */
		const ecart = p === 0 ? null : Math.round(((a - p) / p) * 100);
		/* LES TROIS LIGNES SE LISENT D'UN TRAIT, DONC ELLES S'ACCORDENT : le grand
		   chiffre et sa légende sont trois nœuds voisins d'une même phrase — « 4 notes
		   au total · 1 ouverte au public · 1 contributeur actif ». L'écran servait
		   « 1 contributeurs actifs » sur l'instance qui n'a qu'un compte.
		   L'ACCORD EST EN CASCADE : « contributeur » entraîne l'adjectif « actif », et
		   la sous-ligne le possessif — « à son nom », « à leur nom ». */
		const publiques = notes.filter((n) => n.visibilite === 'Publique').length;
		const contributifs = contributeurs(notes).length;
		const lignes: readonly (readonly [string, string, string])[] = [
			[
				nb(a),
				`${accord(a, 'consultation')} sur 7 jours`,
				ecart === null
					? 'aucune semaine de référence à comparer'
					: `${ecart > 0 ? '+' : ''}${ecart} % contre la semaine précédente`
			],
			...(rechercheMesuree
				? [
						[
							nb(taux.total),
							`${accord(taux.total, 'recherche')} sur 30 jours`,
							`${moyenne(taux.total / 30)} par jour en moyenne`
						] as const
					]
				: []),
			[
				nb(notes.length),
				`${accord(notes.length, 'note')} au total`,
				`${publiques} ${accord(publiques, 'ouverte')} au public`
			],
			[
				nb(contributifs),
				`${accord(contributifs, 'contributeur')} ${accord(contributifs, 'actif')}`,
				`au moins une note à ${accord(contributifs, 'son', 'leur')} nom`
			]
		];
		return lignes;
	});

	const plusConsultees = $derived(
		notes
			.slice()
			.sort((x, y) => (mesures7j[y.id] ?? 0) - (mesures7j[x.id] ?? 0))
			.slice(0, 5)
	);
	const maxiConsultations = $derived(
		plusConsultees[0] ? (mesures7j[plusConsultees[0].id] ?? 1) : 1
	);
	const volumesDeContribution = $derived(contributeurs(notes));
	const maxiContributions = $derived(volumesDeContribution[0]?.notes ?? 1);
</script>

<!-- Le témoin de fraîcheur — `window.temoinFraicheur` du gel, une seule fabrique. -->
<!-- prettier-ignore -->
{#snippet temoin(n: Note)}<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>{/snippet}

<!-- La barre de répartition du produit, et sa légende chiffrée (`V-34:2960`). -->
<!-- prettier-ignore -->
{#snippet barreRepartition(r: Repartition, dom: Domaine)}<div class="repart" role="img" aria-label={libelleDeBarre(r)}
		>{#each partsDe(r, dom.nom) as p (p.cle)}<button type="button" class={p.classe} style="flex:{p.n}" title={p.libelle} aria-label={p.libelle} onclick={() => onVoirLesNotes?.({ domaine: dom.nom, fraicheur: LIBELLE_DE_FRAICHEUR[p.cle] ?? p.cle })}></button>{/each}</div
	><div class="legende"
		>{#each partsDe(r) as p (p.cle)}<span><i class={p.classe}></i><b>{p.n}</b>{` ${accord(p.n, p.singulier)}`}</span>{/each}</div
	>{/snippet}

<!-- Une ligne de classement (`V-34:3318`) — avec rang et cliquable, ou sans. -->
<!-- prettier-ignore -->
{#snippet ligneDeClassement(rang: number | null, nom: string, valeur: number, maxi: number, unite: string, surClic?: () => void)}{#if rang !== null}<button class="cl" type="button" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;font:inherit;color:inherit" onclick={surClic}
		><span class="cl__rang">{String(rang).padStart(2, '0')}</span
		><span class="cl__nom">{nom}</span
		><span class="cl__barre"><i style="width:{Math.round((valeur / maxi) * 100)}%"></i></span
		><span class="cl__n">{valeur}{unite}</span
	></button>{:else}<div class="cl"
		><span class="cl__nom">{nom}</span
		><span class="cl__barre"><i style="width:{Math.round((valeur / maxi) * 100)}%"></i></span
		><span class="cl__n">{valeur}{unite}</span
	></div>{/if}{/snippet}

<CoquilleDeConsole section="analytique" {notes} donnees={{ 'data-donnees': donnees }}>
	{#snippet enfants()}
		<TeteDeSection
			titre="Analytique"
			description="Ce que l'usage réel dit du corpus. Les chiffres n'ont d'intérêt que s'ils débouchent sur une décision éditoriale : chaque bloc propose l'action qui va avec."
		>
			{#snippet action()}<span class="etiq">30 derniers jours</span>{/snippet}
		</TeteDeSection>

		<!-- ---------- Données insuffisantes ---------- -->
		<!-- prettier-ignore -->
		<div class="si-vide"
			><div class="insuffisant"
				><h2>Pas encore assez d'usage pour conclure</h2
				><p>Cet écran conclut sur des mesures que l'instance ne tient pas toutes : il en manque au moins une, recensée avec la table qui lui fait défaut. Tant qu'elle manque, l'écran se tait plutôt que de conclure sur celles qui restent — un chiffre partiel se lit comme un chiffre complet.</p
			></div
		></div>

		<div class="si-donnees">
			<!--
				L'INDICATEUR NORD ET LES TROUS DOCUMENTAIRES SE TAISENT SANS JOURNAL DE
				RECHERCHE : les deux blocs ne comptent QUE des requêtes, et rendus sur une
				table vide ils annonçaient un taux de 0 % « sur 0 recherches ce mois-ci ».
			-->
			{#if rechercheMesuree}
				<!-- ---------- Indicateur nord ---------- -->
				<!-- prettier-ignore -->
				<section class="nord"
				><div
					><div class="nord__valeur"><span id="taux">{taux.taux}</span><span class="nord__unite">%</span></div
				></div
				><div
					><span class="nord__nom etiq">Taux de recherche aboutie</span
					><p class="nord__txt" id="nord-txt">Sur <b>{nb(taux.total)} {accord(taux.total, 'recherche')}</b> ce mois-ci, <b>{nb(taux.abouties)}</b> {accord(taux.abouties, 'a abouti', 'ont abouti')} à l'ouverture d'une note. <b>{nb(taux.total - taux.abouties)} {accord(taux.total - taux.abouties, 'autre')}</b> {accord(taux.total - taux.abouties, 'est un collègue reparti', 'sont des collègues repartis')} sans réponse — c'est le seul chiffre qui dise si la base rend le service qu'on en attend.</p
					><div class="nord__jauge"><i id="nord-jauge" style="width:{taux.taux}%"></i></div
					><div class="nord__legende"
						><span id="nord-abouties">{nb(taux.abouties)} {accord(taux.abouties, 'aboutie')}</span
						><span id="nord-perdues">{nb(taux.total - taux.abouties)} sans suite</span
					></div
				></div
			></section>

				<!-- ---------- Trous documentaires ---------- -->
				<!-- prettier-ignore -->
				<section class="bloc-a"
				><div class="bloc-a__tete"
					><div
						><h2 class="bloc-a__nom">Trous documentaires</h2
						><div class="bloc-a__sous">Les questions que vos collègues posent et auxquelles la base ne répond pas. Chaque ligne est une note qui manque — et le titre est déjà écrit.</div
					></div
					><span class="chiffre" id="n-trous">{trous.length}</span
				></div
				><div class="bloc-a__corps" id="trous"
					>{#each trous as r (r.terme)}<div class="trou"
						><div class="trou__n">{r.n}</div
						><div style="min-width:0"
							><div class="trou__terme">{`« ${r.terme} »`}</div
							><div class="trou__meta"
								><span class="trou__cause" data-type={r.resultats === 0 ? 'vide' : 'ignore'}>{r.resultats === 0 ? 'aucun résultat' : `${r.resultats} ${accord(r.resultats, 'résultat')}, aucun ouvert`}</span
								>{#if r.evolution !== null}<span class="tendance" data-sens={r.evolution > 0 ? 'hausse' : 'baisse'}>{`${r.evolution > 0 ? '▲ +' : '▼ '}${r.evolution} % sur un mois`}</span>{/if}
							></div
						></div
						><button class="btn btn--principal" style="white-space:nowrap" onclick={() => onTrou?.({ terme: r.terme, resultats: r.resultats })}>{r.resultats === 0 ? 'Écrire cette note' : 'Examiner les résultats'}</button
					></div>{/each}</div
			></section>
			{/if}

			<!-- ---------- Santé documentaire ---------- -->
			<!-- prettier-ignore -->
			<section class="bloc-a"
				><div class="bloc-a__tete"
					><div
						><h2 class="bloc-a__nom">Santé documentaire</h2
						><div class="bloc-a__sous">Par domaine : répartition de fraîcheur, et ce qui appelle une intervention.</div
					></div
				></div
				><div class="bloc-a__corps" id="sante"
					>{#if !sante.length}<div class="zone-etat"
						><div class="zone-etat__titre">Aucune note à mesurer</div
						><p class="zone-etat__txt">La santé documentaire se calcule domaine par domaine, sur les notes qui s'y trouvent. Écrivez une première note — /notes/nouvelle — et ce bloc se remplit.</p
					></div>{/if}{#each sante as s (s.dom.nom)}<div class="sante-dom"
						><div class="sante-dom__tete"
							><span class="sante-dom__puce" style="background:{s.dom.couleur}"></span
							><span class="sante-dom__nom">{s.dom.nom}</span
							><span class="sante-dom__n">{`${s.liste.length} ${accord(s.liste.length, 'note')} · ${s.contributeurs} ${accord(s.contributeurs, 'contributeur')}`}</span
						></div
						>{@render barreRepartition(s.repartition, s.dom)}<div class="alertes-dom"
							>{#each s.alertes as [n, quoi] (quoi)}<span class="alerte-dom" data-appel={n ? 'oui' : 'non'} data-nul={n ? 'non' : 'oui'}><b>{n}</b>{quoi}</span>{/each}</div
					></div>{/each}</div
			></section>

			<!-- ---------- Orphelines ---------- -->
			<!-- prettier-ignore -->
			<section class="bloc-a"
				><div class="bloc-a__tete"
					><div
						><h2 class="bloc-a__nom">Notes orphelines</h2
						><div class="bloc-a__sous">Trois façons d'être orpheline, qui n'appellent pas la même décision : une note jamais vérifiée n'est pas une note que personne ne lit.</div
					></div
				></div
				><div class="bloc-a__corps"
					><div class="onglets-o" id="onglets-o" role="tablist" aria-label="Type d'orphelines"
						>{#each ORPH as o (o.cle)}<button type="button" role="tab" aria-selected={o.cle === orphCourant} onclick={() => (ongletDemande = o.cle)}>{o.nom}<span class="n">{orphelines[o.cle].length}</span></button>{/each}</div
					><div id="orphelines"
						><p style="font-size:var(--t-mini);color:var(--c-encre-3);line-height:1.5;margin:0 0 var(--e-2);max-width:64ch">{familleCourante.quoi}</p
						>{#if !listeCourante.length}<div class="zone-etat"><div class="zone-etat__titre">Aucune note dans ce cas</div></div
						>{:else}{#each listeCourante.slice(0, 8) as n (n.id)}<div class="orph"
							><div class="orph__corps"
								><div class="orph__titre">{n.titre}</div
								><div class="orph__meta"
									>{@render temoin(n)}<span>{n.domaine}</span><span>{n.auteur}</span><span style="font-family:var(--f-donnee)">{`${mesures7j[n.id] ?? 0} ${accord(mesures7j[n.id] ?? 0, 'vue')} / 7 j`}</span
								></div
							></div
							><div class="orph__actions"
								><button class="btn" onclick={() => onOrpheline?.({ famille: orphCourant, identifiant: n.id })}>{familleCourante.action}</button
								><button class="btn" onclick={() => onOuvrirLaNote?.(n.id)}>Ouvrir</button
							></div
						></div>{/each}{#if listeCourante.length > 8}<div style="padding:var(--e-2) 0;font-size:var(--t-mini);color:var(--c-encre-3)">{`et ${listeCourante.length - 8} ${accord(listeCourante.length - 8, 'autre')}.`}</div>{/if}{/if}</div
				></div
			></section>

			<!-- ---------- Adoption ---------- -->
			<!-- prettier-ignore -->
			<section class="bloc-a"
				><div class="bloc-a__tete"
					><div
						><h2 class="bloc-a__nom">Adoption</h2
						><div class="bloc-a__sous">L'usage réel, sur les sept derniers jours.</div
					></div
				></div
				><div class="bloc-a__corps"
					><div class="adoption" id="adoption" style="margin-bottom:var(--e-5)"
						>{#each adoption as [valeur, nom, sous] (nom)}<div class="mesure-a"><div class="mesure-a__val">{valeur}</div><span class="mesure-a__nom">{nom}</span><span class="mesure-a__nom" style="color:var(--c-encre-4)">{sous}</span></div>{/each}</div
					><span class="etiq" style="display:block;margin-bottom:var(--e-2)">Notes les plus consultées</span
					><div class="classement" id="top-notes"
						>{#if !plusConsultees.length}<div class="zone-etat"><p class="zone-etat__txt">Aucune note consultée sur la période.</p></div>{/if}{#each plusConsultees as n, rang (n.id)}{@render ligneDeClassement(rang + 1, n.titre, mesures7j[n.id] ?? 0, maxiConsultations, ' ' + accord(mesures7j[n.id] ?? 0, 'vue'), () => onOuvrirLaNote?.(n.id))}{/each}</div
					><span class="etiq" style="display:block;margin:var(--e-5) 0 var(--e-2)">Volumes de contribution</span
					><div class="classement" id="top-contrib"
						>{#if !volumesDeContribution.length}<div class="zone-etat"><p class="zone-etat__txt">Aucune note écrite : aucun volume à mesurer.</p></div>{/if}{#each volumesDeContribution as c (c.nom)}{@render ligneDeClassement(null, c.nom, c.notes, maxiContributions, ' ' + accord(c.notes, 'note'))}{/each}</div
					><p class="mention-contrib">
						Ces volumes mesurent une activité, pas une performance. Ils ne sont pas comparables entre eux : un référent qui vérifie beaucoup et écrit peu rend le même service qu'un rédacteur prolifique. Aucun classement individuel n'est diffusé ailleurs que sur cet écran d'administration.
					</p
				></div
			></section>
		</div>
	{/snippet}
</CoquilleDeConsole>
