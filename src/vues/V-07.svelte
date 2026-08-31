<script lang="ts">
	/**
	 * V-07 — Accueil contributeur. Route `/` (`docs/routes.md`).
	 *
	 * LA MAQUETTE DE RÉFÉRENCE DU SOCLE : c'est son socle en ligne — lignes 8 à 472
	 * du gel — qui est la source unique du système visuel (`ADR-002` amendé), et
	 * `src/socle.css` en est la copie à l'octet.
	 *
	 * Coquille de forme COMPLÈTE. L'entrée d'accueil du rail est marquée courante —
	 * V-07 est la seule des 41 maquettes dans ce cas, et c'est le gabarit qui le
	 * porte. `data-etat` passe au gabarit par `donnees` ; deux règles de la feuille
	 * le lisent, les autres valeurs sont inertes et posées quand même.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (`RG-M01-01`) : tout est calculé depuis les sources
	 * reçues, bornées au périmètre autorisé par `$lib/donnees/accueil`. `RG-M01-02` :
	 * l'indicateur « En attente de révision » et la corbeille lisent LA MÊME SOURCE
	 * — deux comptages concurrents finiraient par se contredire à l'écran.
	 * `RG-M01-03`, la déduplication de l'activité, n'est PAS tenue.
	 *
	 * Une seule définition de la fraîcheur (`ADR-005`) : tout sort de
	 * `$lib/fraicheur`, rien n'est recalculé ici.
	 *
	 * LES GESTES DE CET ÉCRAN MÈNENT QUELQUE PART : deux vrais liens — la cible d'un
	 * évènement, l'ouverture d'une note de la corbeille —, et des boutons qui
	 * naviguent. Le nom d'un domaine mène à sa page, son COMPTE DE NOTES à la liste
	 * des notes du domaine, qui n'est pas le même écran.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-07.css`.
	 */
	import type {
		DemandeDeRevision,
		Domaine,
		EvenementDActivite,
		IdentifiantNote,
		Note,
		NiveauFraicheur,
		TypeDEvenement,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import {
		CLE_IDENTITE,
		designationsDeCoquille,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import { BARRES_DE_JAUGE, temoinFraicheur } from '$lib/fraicheur';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import { adressesParLesNoms } from '$lib/rangement/adresses';
	/**
	 * LES ADRESSES SE COMPOSENT SUR L'IDENTIFIANT PERSISTÉ, PAS SUR LE NOM : la vue
	 * ne reçoit que des noms d'affichage et les slugifiait, or l'identifiant ne suit
	 * PAS les renommages (`RG-M12-11`) — renommer un univers en console rendait 404
	 * chacun des liens d'ici.
	 */
	const adresses = adressesParLesNoms(designationsDeCoquille());

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	/**
	 * LES NEUF SOURCES SONT EXIGÉES. Optionnelles, leur défaut était la constante du
	 * jeu de démonstration, et une route qui en oubliait une le servait SANS QUE
	 * RIEN NE PROTESTE.
	 *
	 * `| undefined` est imposé par `exactOptionalPropertyTypes`, et il dit quelque
	 * chose : la CLÉ doit être écrite, la VALEUR peut manquer — une source
	 * indisponible n'est pas une source à zéro, et l'ÉTAT VIDE prend le relais.
	 */
	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/** Les univers déclarés. Valeur manquante : aucun univers. */
		univers: readonly Univers[] | undefined;
		/** Les domaines accessibles. Valeur manquante : aucun domaine. */
		domaines: readonly Domaine[] | undefined;
		/** L'utilisateur connecté. Valeur manquante : une identité sans nom. */
		compte: IdentiteAffichee | undefined;
		mesures7j: Partial<Record<IdentifiantNote, number>> | undefined;
		mesures7jPrec: Partial<Record<IdentifiantNote, number>> | undefined;
		modifications: Partial<Record<IdentifiantNote, number>> | undefined;
		/** Les évènements du corpus. Valeur manquante : aucun évènement. */
		activite: readonly EvenementDActivite[] | undefined;
		/** Les demandes de révision. Valeur manquante : aucune demande. */
		revisions: readonly DemandeDeRevision[] | undefined;
		/**
		 * LA CAPACITÉ D'ÉCRITURE DE L'APPELANT, CALCULÉE EN BASE — `P-09`. Le profil du
		 * VECTEUR est un état de planche : un chargeur sans vecteur laisserait `profil`
		 * valoir « referent », et toutes les actions d'écriture seraient émises quel que
		 * soit le compte. Sans valeur, le profil répond.
		 */
		ecriture: boolean | undefined;
	}

	/**
	 * L'identité affichée — la forme d'`UtilisateurCourant`, dont les valeurs du jeu
	 * de démonstration sont ÉLARGIES : `nom` y est l'union des trois noms du jeu, où
	 * aucun état vide n'est représentable. Le jeu de CLÉS reste lié au type d'origine
	 * par un type mappé, pour que cette forme ne diverge pas en silence.
	 */
	type IdentiteAffichee = { readonly [K in keyof UtilisateurCourant]: string };

	/**
	 * L'identité vide. Un domaine vide est déjà une valeur que la vue sait lire :
	 * `sansPerimetre` en dépend, et la salutation bascule sur le corpus entier.
	 */
	const SANS_IDENTITE: IdentiteAffichee = {
		prenom: '',
		nom: '',
		initiales: '',
		domaine: '',
		role: ''
	};

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte: moi = SANS_IDENTITE,
		mesures7j = {},
		mesures7jPrec = {},
		modifications = {},
		activite = [],
		revisions = [],
		ecriture: ecritureAutorisee
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const profil = $derived(String(reglage['role'] ?? 'referent'));

	/**
	 * LE PIED DIT DEUX FAITS SUR L'INSTANCE — il les lit où le rail les lit,
	 * `$lib/coquille/identite.ts`. Hors application ils valent l'état vide. La
	 * synchronisation n'existe nulle part en base ; `null` veut dire « ne rends pas
	 * la ligne » — on ne fabrique pas une date à partir de rien.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const versionAffichee = $derived(identite?.version ?? '');
	const synchroAffichee = $derived(identite?.synchro ?? null);
	/**
	 * QUI EST ADMINISTRATEUR — LE CONTEXTE LE SAIT, LE VECTEUR NE FAIT QUE LE JOUER.
	 * Aucune route ne passe de vecteur : `profil` valait donc toujours « referent »
	 * en produit, et la tuile « Consultations » sortait désactivée même pour un
	 * administrateur. Le chargeur, plus proche de la base, tranche en premier.
	 */
	const administrateur = $derived(
		reglage['administrateur'] === true || (identite?.administrateur ?? profil === 'admin')
	);
	/**
	 * L'ABSENCE, ET NON LE MASQUAGE — `P-09`, `RG-M05-08`, `ARB-040`. Le gel pose les
	 * actions d'écriture puis les cache en feuille, seule possibilité d'une maquette
	 * statique ; le produit ne les émet pas, « ni grisée, NI MASQUÉE ». Les nœuds
	 * rendus gardent leur classe `si-ecriture` : elle porte aussi le rendu.
	 *
	 * LA CAPACITÉ FOURNIE L'EMPORTE SUR LE PROFIL, et gouverne aussi `droits` de la
	 * coquille : sans quoi un compte sans capacité d'écriture gardait le menu
	 * « Créer » pendant que les raccourcis de la page disparaissaient.
	 */
	const ecriture = $derived(ecritureAutorisee ?? profil !== 'lecteur');
	const etatPage = $derived(String(reglage['etat'] ?? 'nominal'));
	/**
	 * L'aide de première visite. La case de planche est cochée par défaut et
	 * `majAide(true)` DÉMASQUE l'aide : c'est la case DÉCOCHÉE qui la cache
	 * (`V-07:3899`). La fermeture est un état LOCAL qui l'emporte sur le vecteur.
	 */
	let aideRefermee = $state(false);

	const aideVisible = $derived(!aideRefermee && reglage['c-aide'] !== false);

	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/* « Un signet n'est pas une note : le vocabulaire est contractuel, et les
	   compteurs le suivent. Une fiche, en revanche, en est une. » (`V-07:3332`) */
	function estNote(n: Note): boolean {
		return n.type !== 'Signet';
	}

	const toutesLesNotes = $derived(corpus.filter(estNote));

	/** Les agrégats de santé ne comptent que les notes publiées (`V-07:3339`). */
	function publiees(liste: readonly Note[]): readonly Note[] {
		return liste.filter((n) => !n.brouillon);
	}

	/* Salutation. Le chiffre marquant porte sur le périmètre de la personne, pas sur
	   le corpus entier. SANS RATTACHEMENT, LE PÉRIMÈTRE EST LA BASE ENTIÈRE :
	   `comptes.domaine_id` est nullable — le cas de tout compte d'amorçage —, et
	   filtrer sur un domaine vide donnerait 0 note, démenti par la tuile « Notes au
	   total » trois lignes plus bas. */
	const sansPerimetre = $derived(moi.domaine.trim() === '');
	const mien = $derived(
		sansPerimetre ? toutesLesNotes : corpus.filter((n) => n.domaine === moi.domaine && estNote(n))
	);
	const recentes = $derived(
		mien.filter((n) => {
			const j = modifications[n.id];
			return typeof j === 'number' && j <= 7;
		})
	);

	/* Domaines accessibles — même source que la navigation latérale, les deux ne
	   peuvent pas diverger. Ordre des univers, `ordre` croissant (`V-07:2619`). */
	const domainesAccessibles = $derived(
		[...univers]
			.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
			.flatMap((u) => domaines.filter((d) => d.univers === u.nom))
	);

	/* Consultations — la somme est RESTREINTE aux notes réellement présentes dans
	   le corpus (`V-07:1904`). */
	function sommeMesures(table: Partial<Record<string, number>>): number {
		return corpus.reduce((s, n) => s + (table[n.id] ?? 0), 0);
	}

	const consultations = $derived(sommeMesures(mesures7j));
	const consultationsPrecedentes = $derived(sommeMesures(mesures7jPrec));
	const ecart = $derived(
		consultationsPrecedentes
			? Math.round(((consultations - consultationsPrecedentes) / consultationsPrecedentes) * 100)
			: 0
	);
	/** Trois signaux redondants : l'orientation du chevron, le signe, la teinte. */
	const sens = $derived(ecart > 0 ? 'hausse' : ecart < 0 ? 'baisse' : 'stable');
	const tendanceTexte = $derived(
		sens === 'stable' ? 'stable' : `${ecart > 0 ? '+' : ''}${ecart} %`
	);

	/* ── L'unique source des révisions (RG-M01-02) ──────────────────────────
	   L'indicateur et la corbeille lisent CECI, et rien d'autre. */
	const revisionsCourantes = $derived<readonly DemandeDeRevision[]>(
		etatPage === 'partiel' ? [] : revisions
	);

	const brouillons = $derived(toutesLesNotes.filter((n) => n.brouillon).length);

	/* ── Répartition de fraîcheur ───────────────────────────────────────────
	   Les trois parts sont dans l'ordre du gel — jamais l'ordre alphabétique. */
	interface Part {
		readonly cle: NiveauFraicheur;
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

	function compte(notes: readonly Note[], cle: NiveauFraicheur): number {
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
		return `${n} ${accord(n, p.singulier)} · ${contexte}`;
	}

	/** Les trois graduations de la jauge, dont `barres` pleines (P-01). */
	const RANGS: readonly number[] = Array.from({ length: BARRES_DE_JAUGE }, (_, k) => k);

	/* ── Notes d'un domaine ─────────────────────────────────────────────────── */
	function notesDuDomaine(d: Domaine): readonly Note[] {
		return corpus.filter((n) => n.domaine === d.nom && estNote(n));
	}

	/* ── Activité récente ───────────────────────────────────────────────────
	   Le type d'événement est porté par le verbe autant que par le pictogramme :
	   la phrase reste complète sans le médaillon. */
	const VERBES: Record<TypeDEvenement, string> = {
		verification: 'a vérifié',
		edition: 'a modifié',
		publication: 'a publié',
		revision: 'a signalé à réviser',
		import: 'a terminé un import'
	};

	const GLYPHES: Record<TypeDEvenement, readonly string[]> = {
		verification: ['M3 8.4l3.2 3.1L13 4.8'],
		edition: ['M11.2 2.6l2.2 2.2-8 8-3 .8.8-3 8-8z'],
		publication: ['M8 12.5V3.5M4.6 6.9L8 3.4l3.4 3.5M3 13.5h10'],
		revision: [
			'M8 5.4v3.4M8 11v.3',
			'M7 2.4L1.6 12a1 1 0 0 0 .9 1.5h11a1 1 0 0 0 .9-1.5L9 2.4a1 1 0 0 0-1.8 0z'
		],
		import: ['M2.5 9.5v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M8 10V2.5M4.8 6.3L8 9.6l3.2-3.3']
	};

	function relatif(heures: number): string {
		if (heures < 1) return "à l'instant";
		if (heures < 24) return `il y a ${heures} h`;
		const j = Math.round(heures / 24);
		return j <= 1 ? 'hier' : `il y a ${j} j`;
	}

	/**
	 * L'état d'erreur, isolé en liaison plutôt que comparé DANS l'attribut de
	 * classe : le relevé d'inventaire lit les littéraux de chaîne d'une expression de
	 * classe. Pour la même raison, ne cite aucun attribut de classe ici.
	 */
	const activiteEnErreur = $derived(etatPage === 'erreur');

	/** L'activité rendue. Vide à l'état « rien en attente ». */
	const activiteCourante = $derived(etatPage === 'partiel' ? [] : activite);

	function noteCible(id: string | null): Note | undefined {
		return id === null ? undefined : corpus.find((n) => n.id === id);
	}

	/**
	 * L'ADRESSE D'UNE NOTE EST PLATE — `/notes/{identifiant}` : aucun segment de
	 * rangement, et déplacer la note ne change pas son adresse (`RG-M03-03`).
	 *
	 * ELLE EST RÉSOLUE, JAMAIS CONCATÉNÉE, et l'appel est INLINE aux deux points
	 * d'usage : `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION passée à
	 * `goto()` ou à un `href`, et une fabrique d'adresse lui est opaque.
	 */
	const ROUTE_DE_NOTE = '/notes/[identifiant]' as const;

	/**
	 * LA CORBEILLE S'OUVRE EN UN CLIC — CDC M07. Le gel navigue déjà par le même
	 * moyen (`V-07:3588-3592`) : le nœud reste le sien, et `onclick` n'écrit aucun
	 * attribut au rendu serveur.
	 */
	function ouvrirLaNote(n: Note): void {
		void goto(resolve(ROUTE_DE_NOTE, { identifiant: n.id }));
	}

	/**
	 * LES ADRESSES QUE `resolve()` NE SAIT PAS COMPOSER : il prend un identifiant de
	 * route, non la dérivation d'un identifiant lisible depuis un nom d'univers ou de
	 * domaine. `$lib/rangement/adresses` est la fabrique UNIQUE de celles-là. La
	 * règle de navigation est levée SUR CETTE SEULE LIGNE, une chaîne fabriquée lui
	 * étant opaque.
	 */
	function allerA(adresse: string): void {
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(adresse);
	}

	/**
	 * LES DESTINATIONS QUE LA MAQUETTE NOMME PAR LEUR NUMÉRO DE VUE —
	 * `V-07:3908-3912` : V-17 → `/notes/nouvelle`, V-24 → `/importer`, V-23 → un
	 * domaine. LE SIGNET SE CRÉE DANS UN DOMAINE, et le gel n'en nomme aucun ;
	 * l'adresse de V-23 en exige un (`RG-STR-02`). `comptes.domaine_id` étant
	 * nullable sur tout compte d'amorçage, on retombe sur le premier domaine
	 * accessible plutôt que de rendre le raccourci mort-né. Le geste ne s'éteint que
	 * si AUCUN domaine n'existe.
	 */
	const domaineDuSignet = $derived(
		domainesAccessibles.find((d) => d.nom === moi.domaine) ?? domainesAccessibles[0]
	);

	function creerUnSignet(): void {
		if (domaineDuSignet === undefined) return;
		allerA(adresses.creationDeSignet(domaineDuSignet.univers, domaineDuSignet.nom));
	}

	/**
	 * LES QUATRE INDICATEURS MÈNENT QUELQUE PART — « un indicateur qui ne mène nulle
	 * part n'est qu'une décoration ». Le produit n'a pas de V-12 globale — V-12 est
	 * la liste des notes D'UN DOMAINE : « Notes au total » et « Brouillons » vont
	 * donc à `/recherche` sans requête, dont les facettes portent les mêmes libellés.
	 *
	 * « Consultations · 7 jours » mène à la console analytique, ouverte au SEUL
	 * administrateur : un bouton qui mènerait un référent à un refus serait pire
	 * qu'un bouton inerte. « En attente de révision » ne navigue pas — la corbeille
	 * est sur cet écran.
	 */
	function voirLesRevisions(): void {
		document.querySelector('#p-revisions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/**
	 * LA BARRE DE RÉPARTITION OUVRE LA LISTE DU DOMAINE, PRÉ-FILTRÉE (`V-07:3685`).
	 * `?fraicheur=Obsolète probable` est le SEUL couple que V-12 honore de cette
	 * famille : les deux autres parts mènent à la liste ENTIÈRE plutôt qu'à un filtre
	 * que rien n'appliquerait — un paramètre non honoré est ignoré, jamais promis.
	 */
	const FRAICHEUR_OBSOLETE = 'Obsolète probable';

	function ouvrirLaPart(d: Domaine, part: Part): void {
		const liste = adresses.notes(d.univers, d.nom);
		allerA(
			part.cle === 'obs' ? `${liste}?fraicheur=${encodeURIComponent(FRAICHEUR_OBSOLETE)}` : liste
		);
	}

	/**
	 * La recherche de l'accueil — le chemin le plus court vers une note.
	 * `RG-M02-06` veut la requête dans l'adresse ; `Échap` vide le champ.
	 */
	function chercherDepuisLAccueil(saisie: string): void {
		const q = saisie.trim();
		allerA(q === '' ? '/recherche' : `/recherche?q=${encodeURIComponent(q)}`);
	}

	/** « Réessayer » — le produit n'a pas de planche à rejouer : relire la page EST
	    le nouvel essai (`V-07:3752`). */
	function reessayer(): void {
		location.reload();
	}

	/* ── Pied de page ───────────────────────────────────────────────────────── */
	const signets = $derived(corpus.length - toutesLesNotes.length);

	/**
	 * Les deux nombres du pied comptent le corpus entier, et la liste de tout le
	 * corpus, c'est `/recherche` sans requête — `type` y est une facette, sous le
	 * libellé même que V-12 emploie.
	 */
	const ADRESSE_DE_LA_RECHERCHE = '/recherche';
	const ADRESSE_DES_SIGNETS = '/recherche?type=Signet';
</script>

<!-- Une esquisse de chargement : la structure à venir, jamais un sablier. La
     largeur passe par le paramètre du gabarit, comme `esquisse(classe, largeur)`
     du gel la pose par `d.style.width`. -->
{#snippet esquisse(classe: string, largeur: string)}
	<div class="esquisse {classe}" style="width:{largeur}"></div>
{/snippet}

<!-- La fabrique unique des états de zone : un titre, une explication, et une
     issue quand il y en a une. Jamais une zone blanche (`V-07:3352`). -->
{#snippet zoneEtat(titre: string, texte: string, action: string | null)}
	<!-- prettier-ignore -->
	<div class="zone-etat"><p class="zone-etat__titre">{titre}</p><p class="zone-etat__txt">{texte}</p>{#if action}<button class="btn" type="button" onclick={reessayer}>{action}</button>{/if}</div>
{/snippet}

<!-- Le témoin de fraîcheur — une seule fabrique, pour qu'il ne diverge pas d'un
     écran à l'autre : niveau, classe, barres et libellé viennent de
     `$lib/fraicheur` (ADR-005). -->
{#snippet temoin(n: Note)}
	{@const t = temoinFraicheur(n)}
	<!-- prettier-ignore -->
	<span class="temoin {t.classe}"><span class="temoin__jauge" aria-hidden="true">{#each RANGS as rang (rang)}<i class={rang < t.barres ? 'plein' : undefined}></i>{/each}</span><span class="temoin__txt">{t.libelle}</span></span>
{/snippet}

<!-- Un indicateur. Quatre valeurs, toutes cliquables : un indicateur qui ne mène
     nulle part n'est qu'une décoration. Celui qui appelle une action porte un
     filet, celui qui vaut zéro est atténué — jamais masqué. -->
{#snippet indicateur(
	nom: string,
	valeur: string,
	appel: boolean,
	nulle: boolean,
	sous: string | null,
	avecTendance: boolean,
	mene: (() => void) | null
)}
	<!-- prettier-ignore -->
	<div class="ind{appel ? ' ind--appel' : ''}{nulle ? ' ind--nulle' : ''}"><button class="ind__lien" type="button" disabled={mene === null} onclick={() => mene?.()}><span class="ind__nom etiq">{nom}</span><span class="ind__val">{valeur}</span>{#if avecTendance}<span class="tendance tendance--{sens}"><span style="line-height:0" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">{#if sens === 'hausse'}<path d="M8 12.5V4M4.4 7.2L8 3.5l3.6 3.7"/>{:else if sens === 'baisse'}<path d="M8 3.5V12M4.4 8.8L8 12.5l3.6-3.7"/>{:else}<path d="M3 8h10M9.6 5.2L12.5 8l-2.9 2.8"/>{/if}</svg></span>{tendanceTexte}<span>vs semaine précédente</span></span>{/if}{#if sous}<span class="ind__sous">{sous}</span>{/if}</button></div>
{/snippet}

<Coquille
	forme="complete"
	classeContenu="tdb"
	accueilCourant
	fil={['Accueil']}
	role={profil === 'admin' ? 'admin' : 'referent'}
	droits={ecriture ? 'ecriture' : 'lecture'}
	donnees={{ 'data-etat': etatPage }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: moi.nom,
		initiales: moi.initiales,
		role: moi.role,
		domaine: moi.domaine
	}}
	version={versionAffichee}
>
	{#snippet enfants()}
		<!-- ---------- Salutation ---------- -->
		<header class="salut">
			<h1 class="salut__titre" id="salut-titre">
				{moi.prenom === '' ? 'Bonjour.' : 'Bonjour ' + moi.prenom + '.'}
			</h1>
			{#if etatPage === 'vide'}
				<p class="salut__sous" id="salut-sous">
					Votre base ne contient encore aucune note. C'est le bon moment pour reprendre l'existant.
				</p>
			{:else if etatPage === 'chargement'}
				<!--
					ÉCART É-1 — LE SEUL NŒUD DE CETTE VUE QU'UN DOCUMENT HTML NE SAIT PAS
					ÉCRIRE. Au chargement, le gel GREFFE une esquisse de niveau bloc DANS
					`p#salut-sous` (`V-07:3387`) : l'analyseur ferme le `p` devant le `div` et
					fabrique un second `p` vide. Le conteneur est donc sérialisé, POUR CE SEUL
					ÉTAT, en `div[role="paragraph"]` — même rôle, mêmes classe et identifiant,
					même boîte.
				-->
				<div class="salut__sous" id="salut-sous" role="paragraph">
					{@render esquisse('esq-l', '46%')}
				</div>
			{:else}
				<!-- prettier-ignore -->
				<p class="salut__sous" id="salut-sous">{sansPerimetre ? 'Votre base compte ' : 'Votre périmètre, ' + moi.domaine + ', compte '}<b>{nb(mien.length)}</b>{#if recentes.length}{' ' + accord(mien.length, 'note') + ', dont '}<b>{nb(recentes.length)}</b>{' ' + accord(recentes.length, 'mise à jour cette semaine.', 'mises à jour cette semaine.')}{:else}{' ' + accord(mien.length, 'note') + ". Aucune n'a bougé cette semaine."}{/if}</p>
			{/if}
		</header>

		<!-- ---------- Aide de première visite ---------- -->
		<aside class="aide" id="aide" hidden={!aideVisible}>
			<span class="aide__marque" aria-hidden="true">
				<svg
					width="17"
					height="17"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"><circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.7v.3" /></svg
				>
			</span>
			<div class="aide__corps">
				Où que vous soyez dans le produit, <kbd class="touche">Ctrl</kbd>
				<kbd class="touche">K</kbd>
				ouvre la recherche sans quitter la page. C'est le chemin le plus court vers une note : les premiers
				résultats apparaissent dès la deuxième lettre.
			</div>
			<button
				class="aide__fermer"
				id="fermer-aide"
				aria-label="Ne plus afficher cette aide"
				onclick={() => (aideRefermee = true)}
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
				>
			</button>
		</aside>

		<!-- ---------- Recherche (priorité 1) ---------- -->
		<div class="quete">
			<svg
				width="20"
				height="20"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
			>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="quete__saisie"
				id="recherche-accueil"
				type="search"
				autocomplete="off"
				spellcheck="false"
				autofocus
				placeholder="Chercher une note, une {motFicheMinuscule}, un signet…"
				aria-label="Rechercher dans le corpus"
				onkeydown={(e) => {
					if (e.key === 'Enter') chercherDepuisLAccueil(e.currentTarget.value);
					else if (e.key === 'Escape') e.currentTarget.value = '';
				}}
			/>
			<span class="quete__rappel"
				><kbd class="touche">Ctrl</kbd><kbd class="touche">K</kbd> depuis n'importe où</span
			>
		</div>

		<!-- ---------- Indicateurs (priorité 2) ---------- -->
		<section class="indics si-peuple" id="indics" aria-label="Indicateurs du corpus">
			{#if etatPage === 'chargement'}
				{#each [0, 1, 2, 3] as rang (rang)}
					<!-- prettier-ignore -->
					<div class="ind"><div style="padding:var(--e-4)">{@render esquisse('esq-l', '58%')}{@render esquisse('esq-b', '44%')}{@render esquisse('esq-l', '78%')}</div></div>
				{/each}
			{:else}
				{@render indicateur(
					'Notes au total',
					nb(toutesLesNotes.length),
					false,
					false,
					`dans ${domainesAccessibles.length} ${accord(domainesAccessibles.length, 'domaine')}`,
					false,
					() => void goto(resolve('/recherche'))
				)}
				{#if etatPage === 'erreur'}
					{@render indicateur(
						'Consultations · 7 jours',
						'—',
						false,
						true,
						"Mesure indisponible — le calcul des consultations n'a pas répondu",
						false,
						null
					)}
				{:else}
					{@render indicateur(
						'Consultations · 7 jours',
						nb(consultations),
						false,
						false,
						null,
						true,
						administrateur ? () => void goto(resolve('/console/analytique')) : null
					)}
				{/if}
				{@render indicateur(
					'Brouillons',
					nb(brouillons),
					false,
					brouillons === 0,
					brouillons ? 'Non visibles du public' : 'Rien en attente de publication',
					false,
					() => allerA('/recherche?statut=Brouillon')
				)}
				{@render indicateur(
					'En attente de révision',
					nb(revisionsCourantes.length),
					revisionsCourantes.length > 0,
					revisionsCourantes.length === 0,
					revisionsCourantes.length ? 'Signalées par des collègues' : 'Rien de signalé',
					false,
					revisionsCourantes.length ? voirLesRevisions : null
				)}
			{/if}
		</section>

		<!-- ---------- Base neuve : écran d'amorçage ---------- -->
		<div class="si-vide">
			<div class="amorce">
				<h2>Votre base est vide</h2>
				<p>
					Rien n'a encore été écrit ni repris. Le plus rapide reste de rapatrier ce qui existe déjà
					— procédures, guides, {motFichePlurielMinuscule} — plutôt que de repartir d'une page blanche.
				</p>
				<div class="amorce__actions">
					<!-- P-09 · ARB-040 — omises, jamais masquées. `V-07:1265`, `:1266` -->
					{#if ecriture}<button
							class="btn btn--principal si-ecriture"
							id="v-importer"
							onclick={() => void goto(resolve('/importer'))}
							>Importer votre patrimoine existant</button
						>
						<button
							class="btn si-ecriture"
							id="v-creer"
							onclick={() => void goto(resolve('/notes/nouvelle'))}
							>Créer votre première note</button
						>{/if}
					<!-- LA SEULE SUITE VRAIE À ZÉRO UNIVERS, ET ELLE N'EST OUVERTE QU'À
					     L'ADMINISTRATEUR : les deux gestes ci-dessus visent des adresses qui
					     rendent 404 tant qu'aucun univers n'existe, et le bloc sortait VIDE sur
					     l'instance neuve pour laquelle il est dessiné.
					     PAS DE CLASSE D'ÉCRITURE ICI : la capacité d'écriture vaut faux sur une
					     instance neuve, et la feuille masque cette classe en lecture seule. Un
					     lien plutôt qu'un bouton — l'adresse est portée par le document. -->
					{#if administrateur && univers.length === 0}<a
							class="btn btn--principal"
							id="v-univers"
							href={resolve('/console/univers')}>Créer votre premier univers</a
						>{/if}
				</div>
			</div>
		</div>

		<div class="si-peuple">
			<div class="grille-tdb">
				<div class="colonne">
					<!-- ---------- Corbeille de révisions (priorité 3) ---------- -->
					<section class="panneau" id="p-revisions" aria-labelledby="t-revisions">
						<div class="panneau__tete">
							<span class="etiq" id="t-revisions">Corbeille de révisions</span>
							<span class="etiq" id="n-revisions"
								>{#if etatPage !== 'vide' && etatPage !== 'chargement' && revisionsCourantes.length}{revisionsCourantes.length}{/if}</span
							>
						</div>
						<div class="panneau__corps" id="revisions">
							{#if etatPage === 'chargement'}
								{#each [0, 1] as rang (rang)}{@render esquisse('esq-l', '72%')}{@render esquisse(
										'esq-b',
										'100%'
									)}{/each}
							{:else if etatPage !== 'vide'}
								{#if revisionsCourantes.length === 0}
									{@render zoneEtat(
										'Rien à réviser',
										"Aucune note de votre périmètre n'est signalée. Les demandes arrivent ici dès qu'un collègue en dépose une.",
										null
									)}
								{:else}
									{#each revisionsCourantes as r (r.id)}
										{@const note = noteCible(r.id)}
										{#if note}
											<!-- prettier-ignore -->
											<button class="revision" type="button" onclick={() => ouvrirLaNote(note)}><span class="revision__tete"><span class="revision__titre">{note.titre}</span><span class="revision__dom past">{note.domaine}</span></span><span class="revision__com">{r.commentaire}</span><span class="revision__sous">{'Signalée par ' + r.par + ' · ' + (r.jours <= 0 ? "aujourd'hui" : r.jours === 1 ? 'hier' : 'il y a ' + r.jours + ' jours') + ' · ' + r.le}{@render temoin(note)}</span></button>
										{/if}
									{/each}
								{/if}
							{/if}
						</div>
					</section>

					<!-- ---------- Activité récente (priorité 5) ---------- -->
					<section
						class="panneau{activiteEnErreur ? ' panneau--erreur' : ''}"
						id="p-activite"
						aria-labelledby="t-activite"
					>
						<div class="panneau__tete">
							<span class="etiq" id="t-activite">Activité récente</span>
							<span class="etiq">7 derniers jours</span>
						</div>
						<div class="panneau__corps" id="activite">
							{#if etatPage === 'chargement'}
								{#each [94, 87, 80, 73, 66] as largeur (largeur)}{@render esquisse(
										'esq-l',
										largeur + '%'
									)}{/each}
							{:else if etatPage === 'erreur'}
								{@render zoneEtat(
									'Activité indisponible',
									"Le flux d'activité n'a pas pu être chargé. Le reste du tableau de bord est à jour.",
									'Réessayer'
								)}
							{:else if etatPage !== 'vide'}
								{#if activiteCourante.length === 0}
									{@render zoneEtat(
										'Rien de neuf cette semaine',
										"Aucune vérification, publication ni import depuis sept jours. Les évènements du corpus s'afficheront ici.",
										null
									)}
								{:else}
									{#each activiteCourante as e, rang (rang)}
										{@const cible = noteCible(e.cible)}
										<!-- prettier-ignore -->
										<div class="evt evt--{e.type}"><span class="evt__marque" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">{#each GLYPHES[e.type] as trace (trace)}<path d={trace}/>{/each}</svg></span><div class="evt__corps"><span class="evt__qui">{e.qui}</span>{' ' + VERBES[e.type] + ' '}<a class="evt__cible" href={cible ? resolve(ROUTE_DE_NOTE, { identifiant: cible.id }) : '#'}>{cible ? cible.titre : 'voir le rapport'}</a>{#if e.detail}<span class="evt__detail">{e.detail}</span>{/if}</div><span class="evt__quand">{relatif(e.heures)}</span></div>
									{/each}
								{/if}
							{/if}
						</div>
					</section>
				</div>

				<div class="colonne">
					<!-- ---------- Vos domaines (priorité 4) ---------- -->
					<section class="panneau" id="p-domaines" aria-labelledby="t-domaines">
						<div class="panneau__tete">
							<span class="etiq" id="t-domaines">Vos domaines</span>
							<span class="etiq" id="n-domaines"
								>{#if etatPage !== 'vide' && etatPage !== 'chargement'}{domainesAccessibles.length}{/if}</span
							>
						</div>
						<div class="panneau__corps" id="domaines">
							{#if etatPage === 'chargement'}
								{#each [0, 1, 2, 3] as rang (rang)}{@render esquisse(
										'esq-l',
										'60%'
									)}{@render esquisse('esq-b', '100%')}{/each}
							{:else if etatPage !== 'vide'}
								{#each domainesAccessibles as d (d.nom)}
									{@const notesDom = notesDuDomaine(d)}
									{@const mesurables = publiees(notesDom)}
									<!-- prettier-ignore -->
									<div class="dom" style="--teinte:{d.couleur}"><div class="dom__tete"><span class="dom__puce" aria-hidden="true"></span><button class="dom__nom" type="button" onclick={() => allerA(adresses.domaine(d.univers, d.nom))}>{d.nom}</button><button class="dom__n" type="button" onclick={() => allerA(adresses.notes(d.univers, d.nom))}>{nb(notesDom.length) + ' ' + accord(notesDom.length, 'note')}</button></div>{#if mesurables.length}<div class="repart" role="img" aria-label={resumeRepartition(mesurables)}>{#each partsPresentes(mesurables) as p (p.cle)}{@const libelle = libellePart(p, mesurables, d.nom)}<button type="button" class={p.classe} style="flex:{compte(mesurables, p.cle)}" title={libelle} aria-label={libelle} onclick={() => ouvrirLaPart(d, p)}></button>{/each}</div>{:else}<div class="dom__vide">{notesDom.length ? 'Aucune note publiée à mesurer.' : "Aucune note pour l'instant."}</div>{/if}</div>
								{/each}
							{/if}
						</div>
					</section>

					<!-- ---------- Raccourcis (priorité 6) ---------- -->
					<!-- P-09 · ARB-040 — omis, jamais masqué. `V-07:1305` -->
					{#if ecriture}<section class="panneau si-ecriture" aria-labelledby="t-raccourcis">
							<div class="panneau__tete">
								<span class="etiq" id="t-raccourcis">Créer</span>
							</div>
							<div class="panneau__corps">
								<div class="raccourcis">
									<button
										class="btn btn--plein btn--principal"
										id="r-note"
										onclick={() => void goto(resolve('/notes/nouvelle'))}
									>
										<svg
											width="15"
											height="15"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											><path
												d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"
											/></svg
										>
										Nouvelle note
									</button>
									<button
										class="btn btn--plein"
										id="r-import"
										onclick={() => void goto(resolve('/importer'))}
									>
										<svg
											width="15"
											height="15"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											><path d="M8 10.5V2M4.8 6.2L8 2.8l3.2 3.4M2.5 13.5h11" /></svg
										>
										Importer des fichiers
									</button>
									<button
										class="btn btn--plein"
										id="r-signet"
										disabled={domaineDuSignet === undefined}
										title={domaineDuSignet === undefined
											? 'Aucun domaine où ranger un signet.'
											: undefined}
										onclick={creerUnSignet}
									>
										<svg
											width="15"
											height="15"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"><path d="M4 2.5h8v11l-4-3-4 3v-11z" /></svg
										>
										Nouveau signet
									</button>
								</div>
							</div>
						</section>{/if}
				</div>
			</div>

			<!-- ---------- Pied de page ---------- -->
			<footer class="pied-tdb" id="pied">
				{#if etatPage === 'chargement'}
					{@render esquisse('esq-l', '38%')}
				{:else if etatPage !== 'vide'}
					<span>{versionAffichee === '' ? 'Codicillus' : 'Codicillus ' + versionAffichee}</span>
					<!-- prettier-ignore -->
					<span><button type="button" onclick={() => allerA(ADRESSE_DE_LA_RECHERCHE)}><b>{nb(toutesLesNotes.length)}</b>{' ' + accord(toutesLesNotes.length, 'note')}</button> · <button type="button" onclick={() => allerA(ADRESSE_DES_SIGNETS)}><b>{nb(signets)}</b>{' ' + accord(signets, 'signet')}</button></span>
					{#if synchroAffichee !== null}<span>{'Dernière synchronisation ' + synchroAffichee}</span
						>{/if}
				{/if}
			</footer>
		</div>
	{/snippet}
</Coquille>
