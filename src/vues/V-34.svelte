<script lang="ts">
	/**
	 * V-34 — Console · Analytique. Route `/console/analytique`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * RG-M15-03 ET P-02 — CE QUI EST DÉRIVÉ, ET LES DEUX SEULS LITTÉRAUX
	 *
	 * Tout chiffre de cet écran est CALCULÉ sur `seeds/corpus.ts`. Les six
	 * fabriques du gel sont portées ligne à ligne : `tauxAbouti`
	 * (`V-34:2718`), `trousDocumentaires` (`V-34:2730`), `orphelines`
	 * (`V-34:2737`), `desynchronises` (`V-34:2749`), `contributeurs`
	 * (`V-34:2005`) et `sommeMesures` (`V-34:1933`). Aucune valeur illustrative
	 * n'est écrite : « une donnée indisponible s'affiche comme telle ».
	 *
	 * LES LITTÉRAUX DU GEL, ET ILS SONT DEUX — recopiés, jamais fabriqués :
	 *
	 *   1. `ORPH` (`V-34:3172`) — les trois familles d'orphelines : nom,
	 *      explication, libellé d'action. Ce sont des LIBELLÉS d'interface, pas
	 *      des données ; le corpus n'en porte aucun.
	 *   2. Le bloc « Pas encore assez d'usage pour conclure » (`V-34:1293-1294`) est
	 *      du BALISAGE STATIQUE du gel, et il cite « 34 recherches » et
	 *      « vers 300 recherches ». Ces deux nombres sont dans la maquette
	 *      elle-même, pas dans un calcul : ils décrivent une instance
	 *      hypothétique, celle qui n'a pas encore assez d'usage. Les dériver du
	 *      corpus les changerait — le corpus, lui, en porte 793.
	 *
	 * AUCUN CLASSEMENT NOMINATIF N'EST FABRIQUÉ ICI NON PLUS. « Volumes de
	 * contribution » est rendu SANS RANG — `ligneClassement(null, …)` au gel —
	 * et la mention qui le suit est celle de la maquette, au mot près : « ces
	 * volumes mesurent une activité, pas une performance ».
	 *
	 * CE LOT NE DÉCLARE TENUES NI `RG-M15-03`, NI `P-02`, NI `P-09`. Il rend un
	 * état de maquette ; la batterie qui prouverait P-02 est `pnpm test:vide`
	 * (batterie 8), qui est un jalon non outillé (`docs/releve-vues.md` §10,
	 * M-3).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES DEUX ÉTATS, ET CE QUI LES SÉPARE
	 *
	 * `don-completes` et `don-insuffisantes` ne changent QU'UN ATTRIBUT :
	 * `data-donnees` sur `div.app` (`V-34:3349`). Les deux blocs — `.si-vide`
	 * et `.si-donnees` — sont TOUJOURS dans le document, et la feuille en
	 * masque un : `.app[data-donnees="insuffisantes"] .si-donnees { display:
	 * none }` et `.app:not([data-donnees="insuffisantes"]) .si-vide { display:
	 * none }` (`V-34:1092-1093`). C'est le gel, et le rendre autrement —
	 * n'émettre qu'un bloc — changerait l'instantané ARIA.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * UNE SEULE DÉFINITION DE LA FRAÎCHEUR (P-01)
	 *
	 * Les témoins des orphelines et les barres de répartition par domaine
	 * passent par `$lib/fraicheur` — `classeTemoin`, `barresFraicheur`,
	 * `libelleFraicheur` —, qui EST `window.temoinFraicheur` du gel. Aucun
	 * libellé de fraîcheur n'est construit localement (ADR-005).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ACTION DE TÊTE DE SECTION — LE SEUL CAS DES DIX
	 *
	 * V-34 est la seule vue de console dont l'en-tête porte un `span.etiq`
	 * (« 30 derniers jours ») là où les six registres portent le bouton
	 * `#creer` et où V-33, V-35 et V-36 ne portent rien. `TeteDeSection`
	 * reçoit donc un fragment d'action, et c'est pour ce cas que P-2 l'a rendu
	 * facultatif.
	 *
	 * AUCUN COMPORTEMENT (ARB-011) : les onglets d'orphelines, les parts de
	 * barre, les boutons de trou et de classement n'appellent que
	 * `notifier()`. L'onglet courant est celui du gel au chargement,
	 * `jamaisVerifiees`.
	 *
	 * LA COQUILLE : forme ABRÉGÉE (ARB-021), enveloppe `div.console`
	 * (ARB-023), treize classes du motif commun portées par `$lib/console/`
	 * (R-2). Ni panneau, ni `data-form`, ni suppression, ni tableau de gestion.
	 * L'hôte de palette de V-09 n'est pas rendu (`docs/releve-vues.md` §4.1).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-34.css` (P-6.3). Les `style=` reproduits figurent tous à
	 * l'ensemble clos du gel de V-34 (ARB-016).
	 */
	import {
		DOMAINES,
		INSTANCE,
		MESURES_7J,
		MESURES_7J_PREC,
		MOI,
		MODIFICATIONS,
		RECHERCHES,
		RELATIONS,
		REVISIONS,
		UNIVERS,
		type DemandeDeRevision,
		type Domaine,
		type EtatDInstance,
		type IdentifiantNote,
		type Note,
		type Relation,
		type RequeteDeRecherche,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur?: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-34')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Les relations déclarées. Absente, la constante du jeu de semence. */
		relations?: readonly Relation[];
		/**
		 * LES CINQ TABLES DE MESURE, TOUTES FACULTATIVES ET TOUTES PARTIELLES.
		 *
		 * `Partial<Record<…>>` et non `Record<…>` : le type total exigerait les
		 * trente-deux identifiants du corpus, ce qui empêcherait mécaniquement un
		 * chargeur de passer un état partiel — ou vide. Or c'est exactement ce que
		 * `P-02` demande de rendre possible : une donnée indisponible s'affiche
		 * comme telle, elle ne se fabrique pas. Le défaut reste la table entière du
		 * jeu de semence, donc le rendu ne bouge pas.
		 */
		mesures7j?: Partial<Record<IdentifiantNote, number>>;
		mesures7jPrec?: Partial<Record<IdentifiantNote, number>>;
		modifications?: Partial<Record<IdentifiantNote, number>>;
		revisions?: readonly DemandeDeRevision[];
		recherches?: readonly RequeteDeRecherche[];
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		relations = RELATIONS,
		mesures7j = MESURES_7J,
		mesures7jPrec = MESURES_7J_PREC,
		modifications = MODIFICATIONS,
		revisions = REVISIONS,
		recherches = RECHERCHES
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const donnees = $derived(
		reglage['don'] === 'insuffisantes' ? 'insuffisantes' : ('completes' as const)
	);

	/* ── Les fabriques du gel, portées ligne à ligne ───────────────────────── */

	/** `nb()` (`V-34:3025`) — la mise en forme française d'un nombre. */
	const nb = (x: number): string => x.toLocaleString('fr-FR');

	/** `window.tauxAbouti` (`V-34:2718`) — l'indicateur nord du produit. */
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
	 * LES TROIS FAMILLES D'ORPHELINES — littéral du gel (`V-34:3172`). Noms,
	 * explications et libellés d'action : ce sont des libellés d'interface, que
	 * `seeds/corpus.ts` ne porte pas et n'a pas à porter.
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

	/** L'onglet courant au chargement (`var orphCourant`, `V-34:3183`). */
	const ORPH_COURANT = 'jamaisVerifiees';
	const familleCourante = $derived(ORPH.find((o) => o.cle === ORPH_COURANT)!);
	const listeCourante = $derived(orphelines[ORPH_COURANT]);

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
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	] as const;

	const partsDe = (r: Repartition, contexte?: string) =>
		PARTS.filter((p) => r[p.cle]).map((p) => ({
			...p,
			n: r[p.cle],
			court: `${r[p.cle]} ${r[p.cle] > 1 ? p.pluriel : p.singulier}`,
			libelle: `${r[p.cle]} ${r[p.cle] > 1 ? p.pluriel : p.singulier}${contexte ? ` · ${contexte}` : ''}`
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
				return {
					dom,
					liste,
					repartition: repartition(liste),
					contributeurs: contributeurs(liste).length,
					alertes: [
						[liste.filter((n) => !n.revise).length, 'jamais vérifiées'],
						[
							revisions.filter((r) => liste.some((n) => n.id === r.id)).length,
							'en attente de révision'
						],
						[liste.filter((n) => n.brouillon).length, 'brouillons'],
						[
							desynchronises.filter((x) => x.domaine === dom.nom).length,
							'opérationnels désynchronisés'
						]
					] as const
				};
			})
			.filter((s) => s.liste.length)
	);

	/* ── L'adoption (`V-34:3268`) ──────────────────────────────────────────── */
	const adoption = $derived.by(() => {
		const a = sommeMesures(mesures7j);
		const p = sommeMesures(mesures7jPrec);
		const ecart = p ? Math.round(((a - p) / p) * 100) : 0;
		return [
			[
				nb(a),
				'consultations sur 7 jours',
				`${ecart > 0 ? '+' : ''}${ecart} % contre la semaine précédente`
			],
			[
				nb(taux.total),
				'recherches sur 30 jours',
				`${nb(Math.round(taux.total / 30))} par jour en moyenne`
			],
			[
				nb(notes.length),
				'notes au total',
				`${notes.filter((n) => n.visibilite === 'Publique').length} ouvertes au public`
			],
			[nb(contributeurs(notes).length), 'contributeurs actifs', 'au moins une note à leur nom']
		] as const;
	});

	/** Les cinq notes les plus consultées, et l'échelle de leurs barres. */
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
{#snippet barreRepartition(r: Repartition, contexte: string)}<div class="repart" role="img" aria-label={libelleDeBarre(r)}
		>{#each partsDe(r, contexte) as p (p.cle)}<button type="button" class={p.classe} style="flex:{p.n}" title={p.libelle} aria-label={p.libelle}></button>{/each}</div
	><div class="legende"
		>{#each partsDe(r) as p (p.cle)}<span><i class={p.classe}></i><b>{p.n}</b>{` ${p.n > 1 ? p.pluriel : p.singulier}`}</span>{/each}</div
	>{/snippet}

<!-- Une ligne de classement (`V-34:3318`) — avec rang et cliquable, ou sans. -->
<!-- prettier-ignore -->
{#snippet ligneDeClassement(rang: number | null, nom: string, valeur: number, maxi: number, unite: string)}{#if rang !== null}<button class="cl" type="button" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;font:inherit;color:inherit"
		><span class="cl__rang">{String(rang).padStart(2, '0')}</span
		><span class="cl__nom">{nom}</span
		><span class="cl__barre"><i style="width:{Math.round((valeur / maxi) * 100)}%"></i></span
		><span class="cl__n">{valeur}{unite}</span
	></button>{:else}<div class="cl"
		><span class="cl__nom">{nom}</span
		><span class="cl__barre"><i style="width:{Math.round((valeur / maxi) * 100)}%"></i></span
		><span class="cl__n">{valeur}{unite}</span
	></div>{/if}{/snippet}

<CoquilleDeConsole
	section="analytique"
	{notes}
	{univers}
	{domaines}
	{compte}
	{instance}
	donnees={{ 'data-donnees': donnees }}
>
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
				><p>L'instance est en service depuis moins de deux semaines et le journal ne compte que 34 recherches. Des chiffres calculés sur si peu induiraient en erreur : un taux de recherche aboutie de 100 % sur trois requêtes ne veut rien dire. Cette section s'activera d'elle-même vers 300 recherches.</p
			></div
		></div>

		<div class="si-donnees">
			<!-- ---------- Indicateur nord ---------- -->
			<!-- prettier-ignore -->
			<section class="nord"
				><div
					><div class="nord__valeur"><span id="taux">{taux.taux}</span><span class="nord__unite">%</span></div
				></div
				><div
					><span class="nord__nom etiq">Taux de recherche aboutie</span
					><p class="nord__txt" id="nord-txt">Sur <b>{nb(taux.total)} recherches</b> ce mois-ci, <b>{nb(taux.abouties)}</b> ont abouti à l'ouverture d'une note. Les <b>{nb(taux.total - taux.abouties)} autres</b> sont des collègues repartis sans réponse — c'est le seul chiffre qui dise si la base rend le service qu'on en attend.</p
					><div class="nord__jauge"><i id="nord-jauge" style="width:{taux.taux}%"></i></div
					><div class="nord__legende"
						><span id="nord-abouties">{nb(taux.abouties)} abouties</span
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
								><span class="trou__cause" data-type={r.resultats === 0 ? 'vide' : 'ignore'}>{r.resultats === 0 ? 'aucun résultat' : `${r.resultats} résultats, aucun ouvert`}</span
								><span class="tendance" data-sens={r.evolution > 0 ? 'hausse' : 'baisse'}>{`${r.evolution > 0 ? '▲ +' : '▼ '}${r.evolution} % sur un mois`}</span
							></div
						></div
						><button class="btn btn--principal" style="white-space:nowrap">{r.resultats === 0 ? 'Écrire cette note' : 'Examiner les résultats'}</button
					></div>{/each}</div
			></section>

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
					>{#each sante as s (s.dom.nom)}<div class="sante-dom"
						><div class="sante-dom__tete"
							><span class="sante-dom__puce" style="background:{s.dom.couleur}"></span
							><span class="sante-dom__nom">{s.dom.nom}</span
							><span class="sante-dom__n">{`${s.liste.length} notes · ${s.contributeurs} contributeurs`}</span
						></div
						>{@render barreRepartition(s.repartition, s.dom.nom)}<div class="alertes-dom"
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
						>{#each ORPH as o (o.cle)}<button type="button" role="tab" aria-selected={o.cle === ORPH_COURANT}>{o.nom}<span class="n">{orphelines[o.cle].length}</span></button>{/each}</div
					><div id="orphelines"
						><p style="font-size:var(--t-mini);color:var(--c-encre-3);line-height:1.5;margin:0 0 var(--e-2);max-width:64ch">{familleCourante.quoi}</p
						>{#if !listeCourante.length}<div class="zone-etat"><div class="zone-etat__titre">Aucune note dans ce cas</div></div
						>{:else}{#each listeCourante.slice(0, 8) as n (n.id)}<div class="orph"
							><div class="orph__corps"
								><div class="orph__titre">{n.titre}</div
								><div class="orph__meta"
									>{@render temoin(n)}<span>{n.domaine}</span><span>{n.auteur}</span><span style="font-family:var(--f-donnee)">{`${mesures7j[n.id] ?? 0} vues / 7 j`}</span
								></div
							></div
							><div class="orph__actions"
								><button class="btn">{familleCourante.action}</button
								><button class="btn">Ouvrir</button
							></div
						></div>{/each}{#if listeCourante.length > 8}<div style="padding:var(--e-2) 0;font-size:var(--t-mini);color:var(--c-encre-3)">{`et ${listeCourante.length - 8} autres.`}</div>{/if}{/if}</div
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
						>{#each plusConsultees as n, rang (n.id)}{@render ligneDeClassement(rang + 1, n.titre, mesures7j[n.id] ?? 0, maxiConsultations, ' vues')}{/each}</div
					><span class="etiq" style="display:block;margin:var(--e-5) 0 var(--e-2)">Volumes de contribution</span
					><div class="classement" id="top-contrib"
						>{#each volumesDeContribution as c (c.nom)}{@render ligneDeClassement(null, c.nom, c.notes, maxiContributions, c.notes > 1 ? ' notes' : ' note')}{/each}</div
					><p class="mention-contrib">
						Ces volumes mesurent une activité, pas une performance. Ils ne sont pas comparables entre eux : un référent qui vérifie beaucoup et écrit peu rend le même service qu'un rédacteur prolifique. Aucun classement individuel n'est diffusé ailleurs que sur cet écran d'administration.
					</p
				></div
			></section>
		</div>
	{/snippet}
</CoquilleDeConsole>
