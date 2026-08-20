<script lang="ts">
	/**
	 * V-07 — Accueil contributeur. Route `/` (`docs/routes.md`).
	 *
	 * LA MAQUETTE DE RÉFÉRENCE DU SOCLE. C'est SON socle en ligne — 466 lignes,
	 * lignes 8 à 472 du gel — qui a été retenu comme source unique du système
	 * visuel (`ECART-007`, `docs/errata-cadrage.md` E-01, ADR-002 amendé) : il
	 * est le sur-ensemble strict des cinq états successifs du socle, et le plus
	 * récent. `src/socle.css` en est la copie à l'octet (P-6.1), et
	 * `docs/DESIGN.md` §0.2 explique pourquoi V-07 plutôt que V-41 — les deux
	 * blocs sont identiques au saut de ligne final près, et P-6.1 compare à
	 * l'octet.
	 *
	 * NEUF ÉTATS — `verif/scenarios/V-07.json`, extraits de la planche de revue.
	 * Chacun arrive par son VECTEUR COMPLET : profil × état × aide, jamais un
	 * delta. `etat-nominal` est déclaré identique à `role-referent`.
	 *
	 * COQUILLE DE FORME COMPLÈTE — ARB-021, A-1. Le rail se dérive du corpus,
	 * la barre porte ses deux menus, `Gestion` est conditionnée au RÔLE
	 * (`si-admin`). `<main>` porte `class="tdb" id="contenu"` (ARB-015), et le
	 * lien d'évitement vise `#contenu` avec le libellé par défaut (ARB-019).
	 *
	 * L'ENTRÉE D'ACCUEIL DU RAIL EST MARQUÉE COURANTE — ARB-021, A-5,
	 * `accueilCourant`. V-07 est la SEULE des 41 maquettes dans ce cas :
	 * `aria-current="page"` et le `data-vers` propre du gel — « Vous êtes déjà
	 * sur l'accueil » (`V-07:1150`) ; la règle qui le rend visible est
	 * `V-07:512`. C'est le gabarit qui le porte, pas cette vue.
	 *
	 * `data-etat` est l'attribut de données de la vue (ARB-021, A-2), passé au
	 * gabarit par `donnees`, tel quel et sous son nom complet. Deux règles de la
	 * feuille le lisent — `.app[data-etat="vide"] .si-peuple` et
	 * `.app:not([data-etat="vide"]) .si-vide` —, les autres valeurs sont inertes
	 * au rendu et posées quand même : le gel les pose.
	 *
	 * LE PROFIL « LECTEUR » N'EST PAS UN RÔLE DU GABARIT. La planche pose
	 * `data-role="lecteur"` ; la seule règle du socle sur `data-role` est
	 * `.app:not([data-role="admin"]) .si-admin`, et l'effet visible du profil
	 * passe par `data-droits="lecture"`. Le gabarit ne connaît que `referent` et
	 * `admin` ; « lecteur » y est un non-administrateur. Divergence de balisage
	 * MESURÉE NULLE, déclarée ici plutôt que réglée en rouvrant un gabarit gelé
	 * — même constat qu'en V-11.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * P-02 — AUCUN CHIFFRE N'EST SAISI, ET C'EST ICI QUE ÇA SE JOUE
	 *
	 * `RG-M01-01` : aucun indicateur n'affiche de valeur inventée. Les quatre
	 * indicateurs, la salutation, les domaines et le pied sont CALCULÉS depuis
	 * les sources reçues en propriété, exactement comme la maquette les calcule
	 * depuis `window.CORPUS` et ses tables de mesures. Rien n'est figé.
	 *
	 * ET DEPUIS LE LOT DE CÂBLAGE DE `/`, CES SOURCES VIENNENT DE LA BASE. Le
	 * jeu de semence n'est plus que le DÉFAUT, celui de la revue : `+page.svelte`
	 * passe le compte connecté, les univers, les domaines, les consultations des
	 * sept derniers jours et de la semaine précédente, les anciennetés de
	 * modification, l'activité et les demandes de révision, toutes bornées au
	 * périmètre autorisé par `$lib/donnees/accueil`. Seul `instance` reste la
	 * constante du jeu — la base ne porte ni la version du produit, ni l'instant
	 * de la dernière synchronisation (`SANS_CONTREPARTIE_EN_BASE`).
	 *
	 * `RG-M01-02` : l'indicateur « En attente de révision » et la corbeille de
	 * révisions lisent LA MÊME SOURCE — `revisionsCourantes`, une seule fois.
	 * Deux comptages concurrents finiraient par se contredire à l'écran ; le gel
	 * l'écrit en toutes lettres (`V-07:3479`).
	 *
	 * `RG-M01-03` — l'activité récente déduplique « un même objet publié puis
	 * édité dans une fenêtre courte ». LE GEL NE LE FAIT PAS : `rendreActivite`
	 * rend `window.ACTIVITE` tel quel, et le jeu de semence n'exerce pas la
	 * règle — `n-planifier-sauv` y figure deux fois, mais en `publication` (78 h)
	 * et en `verification` (151 h), donc hors du cas visé. Dédoublonner ici
	 * serait diverger du gel sans qu'aucun cas ne le sollicite (P-5). Le constat
	 * est déclaré au rapport ; ce lot NE DÉCLARE PAS `RG-M01-03` tenue.
	 *
	 * P-01 — UNE SEULE DÉFINITION DE LA FRAÎCHEUR. Le témoin passe par la
	 * fabrique unique, `$lib/fraicheur` : niveau, classe, barres et libellé en
	 * sortent, et rien n'est recalculé ici. La répartition des domaines COMPTE
	 * les niveaux que le corpus porte, elle ne les dérive pas.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : l'état est rendu, jamais
	 * la transition. Les gestes de la maquette — notifications au clic, mémoire
	 * locale de l'aide de première visite (`codicillus.aide.recherche`), passage
	 * de relais du champ de recherche à la palette V-09 — relèvent des lots de
	 * logique. L'aide est ici un ÉTAT, piloté par le vecteur.
	 *
	 * LES LIENS QUI MÈNENT QUELQUE PART Y MÈNENT — deux, et deux seulement : la
	 * cible d'un évènement d'activité et l'ouverture d'une note de la corbeille.
	 * Le brief les nomme (« cible cliquable », « Accès direct à la note ») et
	 * `docs/routes.md` en donne l'adresse, plate et stable : `/notes/{id}`.
	 * Aucun autre nœud n'est touché — les boutons de domaine, les indicateurs
	 * cliquables et les raccourcis de création gardent le geste du gel, faute
	 * d'une adresse que ce lot puisse citer sans l'inventer. C'est déclaré au
	 * rapport, pas comblé.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * ÉCART DÉCLARÉ — É-1, UN NŒUD QUE HTML NE SAIT PAS ÉCRIRE. À l'état de
	 * chargement, le gel greffe une esquisse de niveau BLOC dans `p#salut-sous`
	 * (`V-07:3387`). L'analyseur HTML défait cette imbrication, sort l'esquisse
	 * du paragraphe et fabrique un second `p` vide : mesuré, un `paragraph` de
	 * trop au niveau 1 et 198,7 px de largeur d'écart au niveau 2. Le conteneur
	 * est donc sérialisé, POUR CE SEUL ÉTAT, en `div[role="paragraph"]` —
	 * isomorphe au DOM du gel pour tout ce que le banc juge. Le commentaire posé
	 * sur le nœud porte la mesure. Les huit autres états gardent le `<p>`.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-07.css`, posé par `node verif/feuilles-de-vue.mjs V-07
	 * --installer` (P-6.3). Les styles en ligne reproduits sont ceux du gel, et
	 * eux seuls (P-6.4, ARB-016) : `width:‹calculé›` des esquisses,
	 * `padding:var(--e-4)` du corps d'indicateur en chargement, `line-height:0`
	 * du chevron de tendance, `--teinte:‹calculé›` d'un bloc de domaine et
	 * `flex:‹calculé›` d'une part de répartition.
	 */
	import {
		ACTIVITE,
		DOMAINES,
		INSTANCE,
		MESURES_7J,
		MESURES_7J_PREC,
		MODIFICATIONS,
		MOI,
		REVISIONS,
		UNIVERS,
		type DemandeDeRevision,
		type Domaine,
		type EtatDInstance,
		type EvenementDActivite,
		type IdentifiantNote,
		type Note,
		type NiveauFraicheur,
		type TypeDEvenement,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { BARRES_DE_JAUGE, temoinFraicheur } from '$lib/fraicheur';
	import { motFicheMinuscule, motFichePlurielMinuscule } from '$lib/vocabulaire';

	/**
	 * LES NEUF SOURCES QUI NE VENAIENT DE NULLE PART — T-041.
	 *
	 * Jusqu'ici les constantes du jeu de semence étaient lues AU NIVEAU DU
	 * MODULE : un chargeur de route pouvait passer `notes`, et rien d'autre
	 * n'atteignait l'écran. « En attente de révision = 3 » s'affichait pour un
	 * compte qui ne lit aucune note, et « Bonjour Karim. » était servi à Sophie
	 * Nguyen. Elles sont désormais des PROPRIÉTÉS OPTIONNELLES.
	 *
	 * LE DÉFAUT EST LA CONSTANTE, ET C'EST CE QUI TIENT LE GEL. Le mode démo ne
	 * passe que `etat`, `vecteur` et `notes` : la vue reçoit donc exactement ce
	 * qu'elle recevait, et les 36 couples du banc ne bougent pas. Ce lot rend le
	 * passage POSSIBLE ; il ne décide pas de ce qui sera passé.
	 *
	 * LES TROIS TABLES DE MESURE SONT PARTIELLES, ET C'EST DÉLIBÉRÉ. `MESURES_7J`,
	 * `MESURES_7J_PREC` et `MODIFICATIONS` sont des `Record` COMPLETS sur les
	 * identifiants du jeu ; aucune table ne les porte en base. Exiger la forme
	 * complète interdirait au chargeur de passer un ensemble vide — c'est-à-dire
	 * précisément l'état neutre explicite que P-02 réclame quand la mesure est
	 * indisponible. Le défaut, lui, reste la constante entière.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — profil × état × aide. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-07')`, variante « complète ». */
		notes: readonly Note[];
		/**
		 * ─────────────────────────────────────────────────────────────────────
		 * `| undefined` EST EXIGÉ PAR `exactOptionalPropertyTypes`, ET IL DIT
		 * QUELQUE CHOSE
		 *
		 * `tsconfig.json:9` distingue « la clé est absente » de « la clé vaut
		 * `undefined` ». Sans la seconde forme, un chargeur ne peut PAS écrire
		 * `compte={data.compte}` quand la donnée peut manquer : il lui faudrait
		 * composer son objet de propriétés par étalement conditionnel, une ligne
		 * par source, pour dire ce que `undefined` dit déjà.
		 *
		 * Or c'est exactement le cas que `P-02` décrit : une source indisponible
		 * n'est pas une source à zéro. La laisser passer en `undefined` fait
		 * répondre le défaut de la vue — le jeu de semence en revue, rien de plus
		 * en production —, et Svelte applique le défaut sur `undefined` comme sur
		 * l'absence. Les deux formes sont donc admises, et elles ont le même
		 * effet.
		 */
		/** Les univers déclarés. Absents, ceux du jeu de semence. */
		univers?: readonly Univers[] | undefined;
		/** Les domaines accessibles. Absents, ceux du jeu de semence. */
		domaines?: readonly Domaine[] | undefined;
		/** L'utilisateur connecté. Absent, celui du jeu de semence. */
		compte?: UtilisateurCourant | undefined;
		/** L'état de l'instance — version, synchronisation. Absent, celui du jeu. */
		instance?: EtatDInstance | undefined;
		/** Consultations des sept derniers jours, par note. */
		mesures7j?: Partial<Record<IdentifiantNote, number>> | undefined;
		/** Consultations de la semaine précédente, par note. */
		mesures7jPrec?: Partial<Record<IdentifiantNote, number>> | undefined;
		/** Ancienneté de modification, en jours, par note. */
		modifications?: Partial<Record<IdentifiantNote, number>> | undefined;
		/** Les évènements du corpus. Absents, ceux du jeu de semence. */
		activite?: readonly EvenementDActivite[] | undefined;
		/** Les demandes de révision. Absentes, celles du jeu de semence. */
		revisions?: readonly DemandeDeRevision[] | undefined;
		/**
		 * LA CAPACITÉ D'ÉCRITURE DE L'APPELANT, CALCULÉE EN BASE — P-09.
		 *
		 * Le profil du VECTEUR est un état de planche : il fait la revue, pas le
		 * produit. Un chargeur qui n'a pas de vecteur à passer laisserait donc
		 * `profil` valoir « referent », et toutes les actions d'écriture seraient
		 * émises quel que soit le compte. `+layout.server.ts` calcule la capacité
		 * réelle (`capaciteDEcriture`, deux projections sur les droits) ; cette
		 * propriété est le chemin par lequel elle atteint la vue.
		 *
		 * ABSENTE, LE PROFIL RÉPOND — le vecteur reste seul juge en revue, et les
		 * neuf états déclarés ne bougent pas d'un pixel.
		 */
		ecriture?: boolean | undefined;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte: moi = MOI,
		instance = INSTANCE,
		mesures7j = MESURES_7J,
		mesures7jPrec = MESURES_7J_PREC,
		modifications = MODIFICATIONS,
		activite = ACTIVITE,
		revisions = REVISIONS,
		ecriture: ecritureAutorisee
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});
	const profil = $derived(String(reglage['role'] ?? 'referent'));
	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions d'écriture puis les cache par
	 * `.app[data-droits="lecture"] .si-ecriture { display: none }`
	 * (`mockups/V-07-accueil-contributeur.html:403`) : une maquette statique n'a
	 * pas de serveur, le masquage y est sa SEULE possibilité. Le produit, lui,
	 * peut ne pas les émettre — et P-09 l'exige, « ni grisée, NI MASQUÉE ».
	 * Les nœuds concernés gardent leur classe `si-ecriture` intacte quand ils
	 * sont rendus : la classe porte aussi le rendu, elle ne se retire pas.
	 * Énumération : `docs/omissions-p09.md`.
	 *
	 * LA CAPACITÉ FOURNIE L'EMPORTE SUR LE PROFIL, et c'est l'ordre juste : le
	 * profil est un état de planche, la capacité est une lecture des droits en
	 * base. Absente — en revue, où aucun chargeur ne parle —, le profil répond
	 * seul, et les neuf états déclarés restent ce qu'ils étaient.
	 *
	 * ET C'EST CETTE MÊME VALEUR QUI GOUVERNE `droits` DE LA COQUILLE. Le
	 * `data-droits` de la racine décidait jusqu'ici du seul profil, si bien
	 * qu'un compte sans capacité d'écriture gardait le menu « Créer » de la
	 * barre supérieure pendant que les raccourcis de la page disparaissaient —
	 * deux réponses pour une seule question. Mesuré : sans capacité fournie, la
	 * valeur est identique à l'octet à ce qu'elle était (`ecriture` vaut alors
	 * `profil !== 'lecteur'`, mot pour mot l'ancienne expression), donc les neuf
	 * états de revue ne bougent pas.
	 */
	const ecriture = $derived(ecritureAutorisee ?? profil !== 'lecteur');
	const etatPage = $derived(String(reglage['etat'] ?? 'nominal'));
	/**
	 * L'aide de première visite. La case de planche est cochée par défaut et
	 * `majAide(true)` DÉMASQUE l'aide : c'est la case DÉCOCHÉE qui la cache
	 * (`V-07:3899`). Le stockage local ne joue pas ici — un état, pas une
	 * mémoire.
	 */
	const aideVisible = $derived(reglage['c-aide'] !== false);

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel (`V-07:3328`). */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/* ── Ce qui est une note, et ce qui ne l'est pas ─────────────────────────
	   « Un signet n'est pas une note : le vocabulaire est contractuel, et les
	   compteurs le suivent. Une fiche, en revanche, en est une — elle porte
	   simplement un type structuré en plus. » (`V-07:3332`) */
	function estNote(n: Note): boolean {
		return n.type !== 'Signet';
	}

	const toutesLesNotes = $derived(corpus.filter(estNote));

	/** Les agrégats de santé ne comptent que les notes publiées (`V-07:3339`). */
	function publiees(liste: readonly Note[]): readonly Note[] {
		return liste.filter((n) => !n.brouillon);
	}

	/* ── Salutation ─────────────────────────────────────────────────────────
	   Le chiffre marquant porte sur le périmètre de la personne, pas sur le
	   corpus entier : c'est ce qui fait la différence entre une salutation et
	   une statistique. */
	const mien = $derived(corpus.filter((n) => n.domaine === moi.domaine && estNote(n)));
	const recentes = $derived(
		mien.filter((n) => {
			const j = modifications[n.id];
			return typeof j === 'number' && j <= 7;
		})
	);

	/* ── Domaines accessibles ───────────────────────────────────────────────
	   Même source que la navigation latérale : les deux ne peuvent pas diverger.
	   L'ordre est celui des univers, `ordre` croissant (`V-07:2619`). */
	const domainesAccessibles = $derived(
		[...univers]
			.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
			.flatMap((u) => domaines.filter((d) => d.univers === u.nom))
	);

	/* ── Consultations ──────────────────────────────────────────────────────
	   `window.sommeMesures` : la somme est RESTREINTE aux notes réellement
	   présentes dans le corpus (`V-07:1904`). */
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
		readonly pluriel: string;
		readonly singulier: string;
	}

	const PARTS: readonly Part[] = [
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	];

	function compte(notes: readonly Note[], cle: NiveauFraicheur): number {
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
		return `${n} ${accord(p, n)} · ${contexte}`;
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
	 * classe. Le relevé de `pnpm verif:inventaire` lit les littéraux de chaîne
	 * d'une expression de classe : la comparaison au nom de l'état y ferait
	 * entrer une classe que les 41 maquettes ne portent pas (P-5.1). La
	 * condition sort donc de l'attribut — et ce commentaire ne cite aucun
	 * attribut de classe, pour la même raison.
	 */
	const activiteEnErreur = $derived(etatPage === 'erreur');

	/** L'activité rendue. Vide à l'état « rien en attente ». */
	const activiteCourante = $derived(etatPage === 'partiel' ? [] : activite);

	function noteCible(id: string | null): Note | undefined {
		return id === null ? undefined : corpus.find((n) => n.id === id);
	}

	/**
	 * L'ADRESSE D'UNE NOTE EST PLATE — `/notes/{identifiant}`.
	 *
	 * `docs/routes.md` §2.1 : « Aucun segment de rangement (univers, domaine,
	 * dossier) n'y figure. Déplacer la note dans un autre dossier, un autre
	 * domaine ou un autre univers ne change pas son adresse. » C'est `RG-M03-03`
	 * satisfaite par construction, et il n'y a rien à composer.
	 *
	 * L'ADRESSE EST RÉSOLUE, JAMAIS CONCATÉNÉE. `resolve()` de `$app/paths` prend
	 * l'IDENTIFIANT DE ROUTE et ses paramètres : le cadre vérifie à la
	 * compilation que la route existe, encode le segment, et
	 * `svelte/no-navigation-without-resolve` refuse toute autre forme. Une
	 * adresse fabriquée à la main est un lien mort en puissance — `P-03`.
	 *
	 * L'APPEL EST INLINE AUX DEUX POINTS D'USAGE, ET CE N'EST PAS UNE PRÉFÉRENCE
	 * DE STYLE : `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION
	 * passée à `goto()` et celle d'un `href`. Une fabrique d'adresse, si juste
	 * soit-elle, lui est opaque — la règle rougit, et elle a raison de rougir :
	 * ce qu'elle sait vérifier, c'est ce qu'elle voit.
	 */
	const ROUTE_DE_NOTE = '/notes/[identifiant]' as const;

	/**
	 * LA CORBEILLE S'OUVRE EN UN CLIC — CDC M07, `BRIEF-VUES.md` §V-07, « Accès
	 * direct à la note ».
	 *
	 * LE GEL NAVIGUE DÉJÀ, ET PAR LE MÊME MOYEN : `V-07:3588-3592` construit un
	 * `button.revision` et lui pose un écouteur de clic qui annonce « Ouverture
	 * de "…" — vue V-14 ». Une maquette statique n'a pas de route à atteindre ;
	 * le produit en a une. Le nœud reste celui du gel — même balise, mêmes
	 * classes, même ordre —, et `onclick` n'écrit aucun attribut au rendu
	 * serveur : le document servi est identique à l'octet à ce qu'il était.
	 */
	function ouvrirLaNote(n: Note): void {
		void goto(resolve(ROUTE_DE_NOTE, { identifiant: n.id }));
	}

	/* ── Pied de page ───────────────────────────────────────────────────────── */
	const signets = $derived(corpus.length - toutesLesNotes.length);
</script>

<!-- Une esquisse de chargement : la structure à venir, jamais un sablier. La
     largeur passe par le paramètre du gabarit, comme `esquisse(classe, largeur)`
     du gel la pose par `d.style.width` (P-6.4, ARB-016). -->
{#snippet esquisse(classe: string, largeur: string)}
	<div class="esquisse {classe}" style="width:{largeur}"></div>
{/snippet}

<!-- La fabrique unique des états de zone : un titre, une explication, et une
     issue quand il y en a une. Jamais une zone blanche (`V-07:3352`). -->
{#snippet zoneEtat(titre: string, texte: string, action: string | null)}
	<!-- prettier-ignore -->
	<div class="zone-etat"><p class="zone-etat__titre">{titre}</p><p class="zone-etat__txt">{texte}</p>{#if action}<button class="btn" type="button">{action}</button>{/if}</div>
{/snippet}

<!-- Le témoin de fraîcheur — une seule fabrique, pour qu'il ne diverge pas
     d'un écran à l'autre. Niveau, classe, barres et libellé viennent de
     `$lib/fraicheur` ; rien n'est recalculé ici (P-01, ADR-005). -->
{#snippet temoin(n: Note)}
	{@const t = temoinFraicheur(n)}
	<!-- prettier-ignore -->
	<span class="temoin {t.classe}"><span class="temoin__jauge" aria-hidden="true">{#each RANGS as rang (rang)}<i class={rang < t.barres ? 'plein' : undefined}></i>{/each}</span><span class="temoin__txt">{t.libelle}</span></span>
{/snippet}

<!-- Un indicateur. Quatre valeurs, toutes cliquables : un indicateur qui ne
     mène nulle part n'est qu'une décoration. Celui qui appelle une action porte
     un filet, celui qui vaut zéro est atténué — jamais masqué. -->
{#snippet indicateur(
	nom: string,
	valeur: string,
	appel: boolean,
	nulle: boolean,
	sous: string | null,
	avecTendance: boolean
)}
	<!-- prettier-ignore -->
	<div class="ind{appel ? ' ind--appel' : ''}{nulle ? ' ind--nulle' : ''}"><button class="ind__lien" type="button"><span class="ind__nom etiq">{nom}</span><span class="ind__val">{valeur}</span>{#if avecTendance}<span class="tendance tendance--{sens}"><span style="line-height:0" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">{#if sens === 'hausse'}<path d="M8 12.5V4M4.4 7.2L8 3.5l3.6 3.7"/>{:else if sens === 'baisse'}<path d="M8 3.5V12M4.4 8.8L8 12.5l3.6-3.7"/>{:else}<path d="M3 8h10M9.6 5.2L12.5 8l-2.9 2.8"/>{/if}</svg></span>{tendanceTexte}<span>vs semaine précédente</span></span>{/if}{#if sous}<span class="ind__sous">{sous}</span>{/if}</button></div>
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
	version={instance.version}
>
	{#snippet enfants()}
		<!-- ---------- Salutation ---------- -->
		<header class="salut">
			<h1 class="salut__titre" id="salut-titre">{'Bonjour ' + moi.prenom + '.'}</h1>
			{#if etatPage === 'vide'}
				<p class="salut__sous" id="salut-sous">
					Votre base ne contient encore aucune note. C'est le bon moment pour reprendre l'existant.
				</p>
			{:else if etatPage === 'chargement'}
				<!--
					ÉCART É-1 — LE SEUL NŒUD DE CETTE VUE QU'UN DOCUMENT HTML NE SAIT PAS
					ÉCRIRE. Au chargement, le gel vide `p#salut-sous` puis lui GREFFE une
					esquisse par `sous.appendChild(esquisse("esq-l", "46%"))`
					(`V-07:3387`) : le DOM d'exécution porte donc un `div` de niveau bloc
					DANS un `p`. Aucune sérialisation HTML ne l'exprime — l'analyseur ferme
					le `p` devant le `div`, sort l'esquisse du paragraphe ET fabrique un
					second `p` vide sur la balise fermante orpheline.

					MESURÉ, pas déduit : avec `<p>`, le niveau 1 rend un `paragraph` de trop
					(ligne 55 de l'instantané) et l'esquisse prend 46 % de `.salut`
					(1 112 px → 511,5 px) au lieu de 46 % du paragraphe (680 px → 312,8 px,
					`max-width: 68ch`) — 198,7 px de large sur 13 px de haut.

					La sérialisation retenue est ISOMORPHE au DOM du gel pour tout ce que le
					banc juge : même rôle (`paragraph`), mêmes classe et identifiant, même
					boîte, même imbrication. Seul le nom de balise diffère, et il n'est
					mesuré par aucun des deux niveaux. Confiné au SEUL état de chargement :
					les huit autres gardent le `<p>` du gel.
				-->
				<div class="salut__sous" id="salut-sous" role="paragraph">
					{@render esquisse('esq-l', '46%')}
				</div>
			{:else}
				<!-- prettier-ignore -->
				<p class="salut__sous" id="salut-sous">{'Votre périmètre, ' + moi.domaine + ', compte '}<b>{nb(mien.length)}</b>{#if recentes.length}{(mien.length > 1 ? ' notes' : ' note') + ', dont '}<b>{nb(recentes.length)}</b>{recentes.length > 1 ? ' mises à jour cette semaine.' : ' mise à jour cette semaine.'}{:else}{(mien.length > 1 ? ' notes' : ' note') + ". Aucune n'a bougé cette semaine."}{/if}</p>
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
			<button class="aide__fermer" id="fermer-aide" aria-label="Ne plus afficher cette aide">
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
					`dans ${domainesAccessibles.length}${domainesAccessibles.length > 1 ? ' domaines' : ' domaine'}`,
					false
				)}
				{#if etatPage === 'erreur'}
					{@render indicateur(
						'Consultations · 7 jours',
						'—',
						false,
						true,
						"Mesure indisponible — le calcul des consultations n'a pas répondu",
						false
					)}
				{:else}
					{@render indicateur(
						'Consultations · 7 jours',
						nb(consultations),
						false,
						false,
						null,
						true
					)}
				{/if}
				{@render indicateur(
					'Brouillons',
					nb(brouillons),
					false,
					brouillons === 0,
					brouillons ? 'Non visibles du public' : 'Rien en attente de publication',
					false
				)}
				{@render indicateur(
					'En attente de révision',
					nb(revisionsCourantes.length),
					revisionsCourantes.length > 0,
					revisionsCourantes.length === 0,
					revisionsCourantes.length ? 'Signalées par des collègues' : 'Rien de signalé',
					false
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
					{#if ecriture}<button class="btn btn--principal si-ecriture" id="v-importer"
							>Importer votre patrimoine existant</button
						>
						<button class="btn si-ecriture" id="v-creer">Créer votre première note</button>{/if}
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
											<button class="revision" type="button" onclick={() => ouvrirLaNote(note)}><span class="revision__tete"><span class="revision__titre">{note.titre}</span><span class="revision__dom past">{note.domaine}</span></span><span class="revision__com">{r.commentaire}</span><span class="revision__sous">{'Signalée par ' + r.par + ' · ' + (r.jours <= 1 ? 'hier' : 'il y a ' + r.jours + ' jours') + ' · ' + r.le}{@render temoin(note)}</span></button>
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
									<div class="dom" style="--teinte:{d.couleur}"><div class="dom__tete"><span class="dom__puce" aria-hidden="true"></span><button class="dom__nom" type="button">{d.nom}</button><span class="dom__n">{nb(notesDom.length) + (notesDom.length > 1 ? ' notes' : ' note')}</span></div>{#if mesurables.length}<div class="repart" role="img" aria-label={resumeRepartition(mesurables)}>{#each partsPresentes(mesurables) as p (p.cle)}{@const libelle = libellePart(p, mesurables, d.nom)}<button type="button" class={p.classe} style="flex:{compte(mesurables, p.cle)}" title={libelle} aria-label={libelle}></button>{/each}</div>{:else}<div class="dom__vide">{notesDom.length ? 'Aucune note publiée à mesurer.' : "Aucune note pour l'instant."}</div>{/if}</div>
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
									<button class="btn btn--plein btn--principal" id="r-note">
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
									<button class="btn btn--plein" id="r-import">
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
									<button class="btn btn--plein" id="r-signet">
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
					<span>{'Codicillus ' + instance.version}</span>
					<!-- prettier-ignore -->
					<span><span><b>{nb(toutesLesNotes.length)}</b>{' ' + (toutesLesNotes.length > 1 ? 'notes' : 'note')}</span> · <span><b>{nb(signets)}</b>{' ' + (signets > 1 ? 'signets' : 'signet')}</span></span>
					<span>{'Dernière synchronisation ' + instance.synchro}</span>
				{/if}
			</footer>
		</div>
	{/snippet}
</Coquille>
