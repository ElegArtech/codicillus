<script lang="ts">
	/**
	 * V-34 — Console · Analytique. Route `/console/analytique`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * RG-M15-03 ET P-02 — CE QUI EST DÉRIVÉ, ET LES DEUX SEULS LITTÉRAUX
	 *
	 * Tout chiffre de cet écran est CALCULÉ sur les données REÇUES — plus aucune
	 * ne retombe sur `seeds/corpus.ts`, et aucun défaut de propriété ne peut plus
	 * faire descendre le jeu de démonstration jusqu'ici. Les six
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
	 *   2. Le bloc « Pas encore assez d'usage pour conclure » (`V-34:1293-1294`)
	 *      est du BALISAGE STATIQUE du gel. Son titre est celui de la maquette,
	 *      au mot près. SA PHRASE, ELLE, A CHANGÉ, ET C'EST UN RENVERSEMENT
	 *      D'ARBITRAGE QUI SE DÉCLARE ICI — voir ci-dessous.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * RENVERSEMENT DÉCLARÉ — « 34 RECHERCHES » ET « VERS 300 RECHERCHES »
	 *
	 * L'EN-TÊTE PRÉCÉDENT DE CE FICHIER classait ces deux nombres parmi les
	 * littéraux du gel à recopier : « ils décrivent une instance hypothétique,
	 * celle qui n'a pas encore assez d'usage ». Ce classement valait tant que la
	 * vue n'était qu'une planche. Il ne vaut plus depuis qu'une route la sert.
	 *
	 * LA SOURCE DU RENVERSEMENT : `RG-M01-01`, que `docs/routes.md:181` porte au
	 * nombre des règles de `/console/analytique`, et que `P-02` reprend en
	 * principe non négociable — « aucun indicateur, aucune tendance, aucun
	 * compteur ne peut être figé ou simulé ». Le vecteur du chargeur demande
	 * l'état neutre, donc ce bloc est LE SEUL que l'écran montre : servis par le
	 * produit, ces deux nombres n'illustraient plus rien, ils AFFIRMAIENT deux
	 * faits sur l'instance du lecteur — son âge et son volume de requêtes. Un
	 * compteur figé servi comme une mesure est exactement ce que la règle
	 * proscrit. Le titre reste, les deux nombres partent.
	 *
	 * CE QUE LA PHRASE DIT MAINTENANT, ET CE QU'ELLE SE GARDE DE DIRE. Elle
	 * énonce deux absences vérifiables dans `src/lib/base/schema.ts` — aucune
	 * table de journal de recherche, aucune table de demande de révision — et
	 * elle n'annonce PAS de retour. Le retour ne dépend pas d'elles : la bascule
	 * est `etatDesDonnees()` (`src/lib/donnees/consoles.ts`), qui ne rend
	 * `completes` que si AUCUNE entrée de `MESURES_DE_CONSOLE_SANS_CONTREPARTIE`
	 * ne porte `vue === 'V-34'` — il y en a cinq. Promettre l'activation « le
	 * jour où le journal existera » serait promettre sur une condition plus
	 * faible que celle que le produit implémente, et la promesse serait fausse.
	 *
	 * ELLE NE DIT PAS DAVANTAGE QU'UN CHIFFRE SERAIT FABRIQUÉ ICI — ce serait
	 * faux. La santé documentaire par domaine, les notes orphelines, l'adoption,
	 * le total de notes et les contributeurs sont dérivés de la base réelle, et
	 * les consultations de sept jours sont comptées par le chargeur sur la table
	 * `consultations`. Ces blocs sont bien dans le document, masqués par la
	 * feuille avec tout `.si-donnees`. La phrase dit donc la seule chose exacte :
	 * l'écran se tait plutôt que de conclure sur une partie de ses mesures.
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

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur?: Record<string, string | boolean> | null;
		/** Les notes de l'instance, servies par le chargeur. */
		notes: readonly Note[];
		/** Les domaines de l'instance — la santé documentaire est rendue par domaine. */
		domaines: readonly Domaine[];
		/** Les relations de l'instance — elles décident des notes sans lien entrant. */
		relations: readonly Relation[];
		/**
		 * LES DEUX TABLES DE MESURE QUE LE PRODUIT PORTE, EXIGÉES.
		 *
		 * `Partial<Record<…>>` et non `Record<…>` : le type total exigerait un
		 * identifiant par note, ce qui empêcherait mécaniquement un chargeur de
		 * passer un état partiel — ou vide. Une note sans consultation compte pour
		 * zéro, ce qui est un fait mesuré et non une valeur fabriquée.
		 *
		 * Elles retombaient sur `MESURES_7J` et `MESURES_7J_PREC` du jeu de
		 * démonstration : une route qui les oubliait affichait les chiffres
		 * d'adoption des maquettes. La table `consultations` existe et le chargeur
		 * les compte ; exigées, une route qui les oublierait ne compilerait plus.
		 */
		mesures7j: Partial<Record<IdentifiantNote, number>>;
		mesures7jPrec: Partial<Record<IdentifiantNote, number>>;
		/**
		 * LES TROIS MESURES QUE LE PRODUIT NE PORTE PAS — ÉTAT VIDE PAR DÉFAUT.
		 *
		 * Aucune table ne compte les modifications par période, n'enregistre une
		 * demande de révision, ni ne journalise une recherche
		 * (`MESURES_DE_CONSOLE_SANS_CONTREPARTIE`). Le défaut était la table du
		 * jeu de démonstration, et l'écran servait donc 793 recherches, ses trous
		 * documentaires et ses demandes de révision comme des mesures de
		 * l'instance. Le défaut est désormais VIDE, et vide, chaque bloc qui en
		 * dérive ne se rend pas : « 0 » et « indisponible » sont deux
		 * informations différentes, et le zéro muet est la plus traître des deux.
		 *
		 * Le jour où une table les porte, le chargeur les passe et les blocs
		 * reviennent d'eux-mêmes.
		 */
		modifications?: Partial<Record<IdentifiantNote, number>>;
		revisions?: readonly DemandeDeRevision[];
		recherches?: readonly RequeteDeRecherche[];
		/**
		 * OUVRIR LA LISTE DES NOTES D'UN DOMAINE, DÉJÀ FILTRÉE SUR UN NIVEAU DE
		 * FRAÎCHEUR — `surPart()` du gel (`V-34:3140`) : « X notes obsolètes de
		 * Applications — liste pré-filtrée, vue V-12 ».
		 *
		 * LA VUE DÉSIGNE LE DOMAINE PAR SON NOM, comme partout ailleurs en console ;
		 * la page sait à quelle adresse il correspond. Le niveau voyage sous le
		 * LIBELLÉ que la facette de V-12 emploie, jamais sous la clé interne.
		 */
		onVoirLesNotes?: (demande: { readonly domaine: string; readonly fraicheur: string }) => void;
		/** OUVRIR UNE NOTE — `V-34:3251` et `V-34:3304`, « vue V-14 ». */
		onOuvrirLaNote?: (identifiant: string) => void;
		/**
		 * TRAITER UN TROU DOCUMENTAIRE — `V-34:3100`. Le gel a deux issues et
		 * l'écran les nomme : écrire la note qui manque quand la requête ne rend
		 * rien, examiner les résultats quand elle en rend sans qu'aucun ne soit
		 * ouvert. La vue transmet la requête et son décompte ; la page choisit
		 * l'adresse.
		 */
		onTrou?: (demande: { readonly terme: string; readonly resultats: number }) => void;
		/**
		 * L'ACTION PROPRE À UNE FAMILLE D'ORPHELINES — `V-34:3247`, où chaque
		 * famille porte son libellé et sa destination. La vue transmet la famille
		 * et la note ; la page décide, parce qu'elle seule connaît les adresses.
		 */
		onOrpheline?: (demande: {
			readonly famille: FamilleOrpheline;
			readonly identifiant: IdentifiantNote;
		}) => void;
	}

	/*
	 * LE RAIL, LA BARRE ET LA VERSION NE PASSENT PLUS PAR ICI. Cette vue portait
	 * `univers`, `compte` et `instance` sans jamais les lire : elle ne faisait
	 * que les remettre à `CoquilleDeConsole`, qui retombait sur le jeu de
	 * démonstration. La coquille lit désormais le contexte d'identité, seule
	 * source, et les trois propriétés ont disparu des deux côtés. `domaines`
	 * reste : la santé documentaire est rendue domaine par domaine.
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
	 * CE QUI SE TAIT QUAND LA MESURE N'EXISTE PAS. Trois tables sont vides tant
	 * qu'aucune migration ne les porte ; les blocs qui en dérivent ne se rendent
	 * alors pas du tout, plutôt que d'afficher des zéros qu'on lirait comme des
	 * mesures. Le prédicat porte sur la SOURCE, jamais sur le résultat : zéro
	 * trou documentaire mesuré sur un vrai journal est un fait, et se rend.
	 */
	const rechercheMesuree = $derived(recherches.length > 0);
	const revisionsMesurees = $derived(revisions.length > 0);
	const modificationsMesurees = $derived(Object.keys(modifications).length > 0);

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

	/** Les trois familles, par leur clé — la seule chose qui les désigne. */
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
	 * L'ONGLET DEMANDÉ DEPUIS L'ÉCRAN — `orphCourant = o.id; rendreOrphelines()`
	 * du gel (`V-34:3197`). `null` au rendu serveur : la planche du banc reçoit
	 * exactement ce qu'elle recevait, et le premier onglet reste celui du gel.
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
				/* DEUX ALERTES SUR QUATRE SE TAISENT SANS LEUR TABLE. « En attente de
				   révision » et « opérationnels désynchronisés » se comptent sur des
				   mesures que le produit ne porte pas ; leur zéro ne dirait pas
				   « aucun », il dirait « rien ne le sait ». */
				const alertes: readonly (readonly [number, string])[] = [
					[liste.filter((n) => !n.revise).length, 'jamais vérifiées'],
					...(revisionsMesurees
						? [
								[
									revisions.filter((r) => liste.some((n) => n.id === r.id)).length,
									'en attente de révision'
								] as const
							]
						: []),
					[liste.filter((n) => n.brouillon).length, 'brouillons'],
					...(modificationsMesurees
						? [
								[
									desynchronises.filter((x) => x.domaine === dom.nom).length,
									'opérationnels désynchronisés'
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
		const ecart = p ? Math.round(((a - p) / p) * 100) : 0;
		/* LA MESURE DES RECHERCHES DISPARAÎT DU BLOC TANT QU'AUCUN JOURNAL NE LA
		   PORTE : « 0 recherches sur 30 jours, 0 par jour en moyenne » se lirait
		   comme une instance que personne n'interroge. */
		const lignes: readonly (readonly [string, string, string])[] = [
			[
				nb(a),
				'consultations sur 7 jours',
				`${ecart > 0 ? '+' : ''}${ecart} % contre la semaine précédente`
			],
			...(rechercheMesuree
				? [
						[
							nb(taux.total),
							'recherches sur 30 jours',
							`${nb(Math.round(taux.total / 30))} par jour en moyenne`
						] as const
					]
				: []),
			[
				nb(notes.length),
				'notes au total',
				`${notes.filter((n) => n.visibilite === 'Publique').length} ouvertes au public`
			],
			[nb(contributeurs(notes).length), 'contributeurs actifs', 'au moins une note à leur nom']
		];
		return lignes;
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
{#snippet barreRepartition(r: Repartition, dom: Domaine)}<div class="repart" role="img" aria-label={libelleDeBarre(r)}
		>{#each partsDe(r, dom.nom) as p (p.cle)}<button type="button" class={p.classe} style="flex:{p.n}" title={p.libelle} aria-label={p.libelle} onclick={() => onVoirLesNotes?.({ domaine: dom.nom, fraicheur: LIBELLE_DE_FRAICHEUR[p.cle] ?? p.cle })}></button>{/each}</div
	><div class="legende"
		>{#each partsDe(r) as p (p.cle)}<span><i class={p.classe}></i><b>{p.n}</b>{` ${p.n > 1 ? p.pluriel : p.singulier}`}</span>{/each}</div
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
				><p>Cet écran conclut sur des mesures que l'instance ne tient pas toutes. Aucune table ne journalise les recherches posées à la base, aucune n'enregistre une demande de révision : le taux de recherche aboutie, les trous documentaires et les notes à réviser n'ont rien à interroger. Tant qu'une seule de ces mesures manque, l'écran se tait plutôt que de conclure sur celles qui restent.</p
			></div
		></div>

		<div class="si-donnees">
			<!--
				L'INDICATEUR NORD ET LES TROUS DOCUMENTAIRES SE TAISENT SANS JOURNAL
				DE RECHERCHE. Les deux blocs ne comptent QUE des requêtes, et aucune
				table n'en enregistre : rendus sur une table vide, ils annonçaient un
				taux de recherche aboutie de 0 % « sur 0 recherches ce mois-ci » et
				zéro trou documentaire — deux chiffres qu'on lit comme des mesures.
				Le jour où le journal existe, le chargeur le passe et les deux blocs
				reviennent sans qu'une ligne bouge ici.
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
					>{#each sante as s (s.dom.nom)}<div class="sante-dom"
						><div class="sante-dom__tete"
							><span class="sante-dom__puce" style="background:{s.dom.couleur}"></span
							><span class="sante-dom__nom">{s.dom.nom}</span
							><span class="sante-dom__n">{`${s.liste.length} notes · ${s.contributeurs} contributeurs`}</span
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
									>{@render temoin(n)}<span>{n.domaine}</span><span>{n.auteur}</span><span style="font-family:var(--f-donnee)">{`${mesures7j[n.id] ?? 0} vues / 7 j`}</span
								></div
							></div
							><div class="orph__actions"
								><button class="btn" onclick={() => onOrpheline?.({ famille: orphCourant, identifiant: n.id })}>{familleCourante.action}</button
								><button class="btn" onclick={() => onOuvrirLaNote?.(n.id)}>Ouvrir</button
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
						>{#each plusConsultees as n, rang (n.id)}{@render ligneDeClassement(rang + 1, n.titre, mesures7j[n.id] ?? 0, maxiConsultations, ' vues', () => onOuvrirLaNote?.(n.id))}{/each}</div
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
