<script lang="ts">
	/**
	 * V-13 — Page d'un dossier.
	 * Route `/univers/{univers}/{domaine}/dossiers/{chemin…}` (`docs/routes.md` §3.3).
	 *
	 * L'adresse prolonge la FORME CANONIQUE de V-11 : le segment `dossiers` vient
	 * de la convention de préfixe R1 et lève la collision avec les segments
	 * réservés `notes` et `signets` (§5.4) ; `{chemin…}` est la suite des
	 * identifiants de dossiers, jusqu'à dix niveaux (RG-STR-04). Le gabarit
	 * d'adresse est `$lib/rangement/adresses`.
	 *
	 * LES LIENS RESTENT CEUX DU GEL — `href="#"`. Voir l'en-tête de `V-10.svelte`
	 * pour le constat mesuré sur le filtre d'ARB-013.
	 *
	 * SIX ÉTATS — `verif/scenarios/V-13.json`. Deux axes : dossier × droit
	 * effectif. Les trois chemins de dossier sont EMBOÎTÉS, ce qui met cette vue
	 * à l'abri de l'accumulation de mise en évidence relevée sur V-11.
	 *
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1, vérifié sur le gel. `<main>` porte
	 * la classe `dossier-vue` (ARB-015) ; le chemin courant du rail est
	 * `[domaine, …chemin]`, ce qui déplie la branche et met en évidence le
	 * dossier atteint.
	 *
	 * `.noeud` N'EST PAS PORTÉE ICI — nœud d'arborescence du rail, rendu par la
	 * coquille ; nœud de GRAPHE en V-19 et V-20 (`docs/DESIGN.md` §2.H). Aucune
	 * factorisation, et `.tuile`, `.groupe`, `.note-ligne`, `.droit` restent
	 * gouvernées par `src/vues/V-13.css`.
	 *
	 * LES TROIS DROITS EFFECTIFS SONT DES ÉTATS DE PLANCHE, PAS UNE FRONTIÈRE DE
	 * SÉCURITÉ. Gestionnaire, rédacteur et lecteur pilotent `data-droit` et
	 * `data-droits`, et la feuille de la vue fait disparaître les actions
	 * correspondantes — `si-gestionnaire`, `si-redacteur`, `si-ecriture`. **CE LOT
	 * NE DÉCLARE PAS `P-09` TENUE** : qu'une action interdite ne soit dans aucun
	 * DOM, par aucun chemin, relève de la batterie 7 (`pnpm test:droits`) et des
	 * lots T-011 et T-016. Ce qui est livré ici est le rendu de trois états, pas
	 * une preuve d'étanchéité.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : sous-dossiers, notes directes, notes
	 * totales et groupes par type sont déduits du rangement réel des notes
	 * servies, à défaut de l'arborescence que la route lit.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * LES TROIS `dialog.dlg` DU GEL SONT DÉSORMAIS TRANSCRITS, ET FERMÉS —
	 * `#dlg-creer` (`V-13:1203`), `#dlg-deplacer` (`:1231`), `#dlg-supprimer`
	 * (`:1262`). Ils ne rendaient pas jusqu'ici, et le motif était juste :
	 * `docs/releve-vues.md` §4.1 le mesure, un `<dialog>` fermé ne porte AUCUNE
	 * boîte de rendu, ne déplace aucun pixel et n'entre pas dans l'instantané
	 * ARIA — `.dlg { display: none }` (`src/vues/V-13.css:284`), et `[open]`
	 * seul le révèle. Ce qui a changé n'est donc pas le rendu, c'est qu'une
	 * route peut maintenant les OUVRIR : quatre gestes du gel n'avaient aucun
	 * écran où atterrir.
	 *
	 * LE CONTENU EST CELUI QUE LE GEL COMPOSE À L'OUVERTURE, non celui de son
	 * HTML statique — le script de la maquette réécrit `#creer-parent`,
	 * `#creer-aide`, `#dep-nom`, `#arbre-choix`, `#sup-cible`, `#decompte-liste`
	 * et `#decompte-note` avant chaque `showModal()`. Transcrire l'état d'avant
	 * l'ouverture rendrait un dialogue que personne ne voit jamais.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`. Le
	 * gabarit n'ouvre sa `superposition` qu'aux neuf nœuds hors `div.app` qui
	 * rendent, et aucun n'est de V-13. Et `div.planche`, bloc hors produit
	 * (§2.G), qui ne se porte jamais.
	 *
	 * LE DIALOGUE DES DROITS EST LE QUATRIÈME, ET IL EST TRANSCRIT ICI. `#a-droits`
	 * existe au gel (`V-13:1163`) ; son gestionnaire se contentait de notifier
	 * « Gestion des droits du dossier — boîte de dialogue, vue V-40 »
	 * (`V-13:2376`-`2378`), et le produit n'avait donc AUCUN écran où le clic
	 * atterrisse : cliquer ne produisait strictement rien.
	 *
	 * LA VOIE EST CELLE DES TROIS AUTRES DIALOGUES, et c'est le précédent de cette
	 * vue même. Monter `V-40.svelte` en mode hôte — ce que fait `notes/{id}` pour
	 * son dialogue de relation — imposerait d'importer `V-40.css` dans la route de
	 * V-13 : les deux feuilles ont **96 sélecteurs de premier niveau identiques**
	 * (mesuré), dernier import gagnant, sur une page qui marche aujourd'hui.
	 * Transcrire ne coûte que neuf règles de classe, toutes ABSENTES de
	 * `V-13.css` — donc aucune collision.
	 *
	 * `docs/DESIGN.md:1336` (§2.F) range la famille des droits parmi les classes
	 * propres à V-40, et `P-5.2` interdit de les emprunter. La règle est SCIEMMENT
	 * écartée : « aucune maquette, aucun document de docs/ n'est une raison de
	 * laisser un défaut en place » (`CLAUDE.md`). Le motif est reporté dans
	 * `V-13.css`, au-dessus des neuf règles.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-13.css`, posé par `node verif/feuilles-de-vue.mjs V-13
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import type { Domaine, IdentifiantNote, NomDeDomaine, Note, Univers } from '../../seeds/corpus';
	import { barresFraicheur, classeTemoin, libelleFraicheur } from '$lib/fraicheur';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import {
		adresseDeDossier,
		adresseDeNote,
		adresseDesNotesDuDomaine,
		segmentsDeDossier
	} from '$lib/rangement/adresses';
	import { accord, pluriel, vocabulaireRendu } from '$lib/vocabulaire';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFichePluriel = $derived(motsDuProduit.fiches);

	interface Proprietes {
		/** Le vecteur complet de l'état — dossier × droit effectif. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-13')`, variante « lecture ». */
		notes: readonly Note[];
		/**
		 * LE RANGEMENT ET L'IDENTITÉ — plus aucun défaut tiré du jeu.
		 *
		 * Ces propriétés ont eu pour défaut `UNIVERS`, `DOMAINES`, `MOI` et
		 * `INSTANCE` de `seeds/corpus.ts` : une route qui oubliait d'en passer une
		 * servait le contexte du jeu de démonstration, et rien ne protestait.
		 *
		 * La route de cet écran n'en passe aucune des deux premières : le rail y
		 * est de forme abrégée, écrit au balisage, et le fil d'Ariane vient de
		 * l'adresse. Leur état vide est donc le TABLEAU VIDE, jamais le jeu.
		 * `compte` peut manquer, et son état vide est `null`. `instance` a
		 * disparu : le contexte de coquille sert la version du paquet.
		 */
		univers?: readonly Univers[];
		domaines?: readonly Domaine[];
		compte?: CompteAffiche | null;
		/**
		 * LE DOMAINE DE LA PAGE DE DOSSIER — REQUIS, et c'est le défaut mesuré
		 * par `T-032` qui l'exige : la maquette fixe `Infrastructure` en tête de
		 * son script (`V-13:1957`), la vue le recopiait en constante, et une
		 * adresse d'un AUTRE domaine rendait l'arborescence d'Infrastructure.
		 *
		 * Le défaut a été cette même valeur, ce qui ne réparait rien tant qu'une
		 * route pouvait l'oublier. Il n'y en a plus : la route le passe, et
		 * l'oublier ne compile pas.
		 */
		domaine: NomDeDomaine;
		/**
		 * L'ANCIENNETÉ DE MODIFICATION DE CHAQUE NOTE — `window.modifJours` du gel.
		 *
		 * `Partial` ET NON `Record` TOTAL, et c'est une exigence de P-02 : un
		 * type total réclamerait les trente-deux clés, ce qui interdirait
		 * mécaniquement à un chargeur de passer un état PARTIEL ou NEUTRE. Une
		 * note absente de la table s'affiche « modification inconnue », jamais
		 * une ancienneté inventée.
		 */
		modifications: Partial<Record<IdentifiantNote, number>>;
		/**
		 * LE RANGEMENT RÉEL DU DOMAINE, quand une route en a lu un.
		 *
		 * ABSENT, LA VUE DÉDUIT SON ARBORESCENCE DES NOTES, comme le gel le fait
		 * (`V-13:1965`-`1982`) et comme cette vue l'a toujours fait : le mode de
		 * conception ne passe que `vecteur` et `notes`, et le banc ne bouge donc
		 * pas d'un octet.
		 *
		 * PRÉSENT, IL PREND LA PLACE DE LA DÉDUCTION, et c'est ce que le produit
		 * exige : un dossier VIDE n'apparaît dans aucune note, donc l'arbre déduit
		 * ne le voit pas. Un sous-dossier fraîchement créé serait resté invisible
		 * de sa propre page parente — et le sélecteur de destination du dialogue
		 * de déplacement n'aurait proposé que les dossiers qui contiennent des
		 * notes.
		 */
		rangement?: RangementReel | null;
		/**
		 * L'ORIGINE DU DROIT EFFECTIF — le texte de `.droit__source` (`V-13:1146`),
		 * REQUIS.
		 *
		 * Elle dit d'où le droit vient RÉELLEMENT — `RG-DRO-01`, « le droit
		 * explicite le plus proche en remontant l'arborescence » —, et
		 * `libelleDOrigine()` (`$lib/donnees/dossiers-ecriture`) en compose la
		 * tournure. Le gel, lui, fige « — hérité du domaine Infrastructure », et
		 * cette tournure était le REPLI de la propriété : un droit accordé
		 * ailleurs, sur une instance qui ne porte pas ce domaine, affichait quand
		 * même un héritage de « Infrastructure ». C'était une valeur illustrative
		 * servie comme un fait (`P-02`).
		 *
		 * LA CHAÎNE VIDE EST L'ÉTAT VIDE, et elle est dite : une origine que le
		 * produit ne sait pas nommer — un administrateur tient son droit de son
		 * rôle, non d'un dossier — laisse la source MUETTE.
		 */
		origineDuDroit: string;
		/** Le refus affiché par `#creer-erreur` (`V-13:1223`), s'il y en a un. */
		erreurDeCreation?: string | null;
		/** Le refus affiché par `#dep-erreur` (`V-13:1252`), s'il y en a un. */
		erreurDeDeplacement?: string | null;
		/**
		 * LES DROITS DU DOSSIER — la matière de `#dlg-droits`.
		 *
		 * `null` : le dialogue ne montre aucun droit et n'offre aucun compte, ce
		 * qui est exactement l'état du gel, dont la liste des droits est VIDE
		 * dans le HTML statique et n'est peuplée qu'à l'ouverture (`V-40:3344`).
		 * Le banc, qui ne passe que `vecteur` et `notes`, ne bouge donc pas.
		 *
		 * LA ROUTE NE LA SERT QU'AU GESTIONNAIRE : cette structure porte la liste
		 * des comptes de l'instance, et un lecteur n'a pas à la recevoir pour
		 * n'en rien faire.
		 */
		droits?: DroitsDuDossier | null;
		/** Le refus affiché par `#droits-erreur`, s'il y en a un. */
		erreurDeDroits?: string | null;
		/**
		 * L'UNIVERS PORTEUR DU DOMAINE, TEL QUE L'ADRESSE LE NOMME — requis.
		 *
		 * Il était cherché dans `domaines` — que la route ne passe pas —, donc
		 * dans la constante du jeu de démonstration, avec « Production » pour
		 * dernier repli. Mesuré le 23/08/2026 : sur un domaine absent du jeu, TOUS
		 * les liens de la page pointaient vers `/univers/production/…` et rendaient
		 * 404, et le fil d'Ariane annonçait le mauvais univers.
		 *
		 * La route le connaît : il est dans son adresse. Il n'y a donc plus de
		 * repli du tout, et l'oublier ne compile pas.
		 */
		universDuDomaine: string;
	}

	/**
	 * UNE DESTINATION POSSIBLE DU DIALOGUE « Renommer ou déplacer », telle que la
	 * route la calcule. `refus` porte le motif du gel, jamais un booléen : le gel
	 * MONTRE les destinations impossibles avec leur motif plutôt que de les
	 * masquer, « sans cela, on cherche longtemps un dossier qui n'apparaît nulle
	 * part » (`V-13:1247`).
	 */
	interface DestinationReelle {
		readonly id: string;
		/** Les segments affichés, racine du domaine EXCLUE — vides pour la racine. */
		readonly segments: readonly string[];
		readonly refus: string | null;
	}

	/**
	 * UN COMPTE, TEL QUE LE DIALOGUE DES DROITS LE NOMME.
	 *
	 * LES FORMES SONT DÉCLARÉES ICI, NON IMPORTÉES DE `$lib/donnees`, et ce n'est
	 * pas une duplication de complaisance : ce module parle au connecteur de base,
	 * et l'importer depuis une vue le ferait entrer dans le paquet du navigateur.
	 * Le typage reste STRUCTUREL — la valeur que la route sert satisfait celle-ci
	 * sans conversion. Même geste que `RangementReel` ci-dessous.
	 */
	interface CompteDeDroit {
		readonly identifiant: string;
		readonly nom: string;
		readonly initiales: string;
	}

	/** Une ligne de la liste : un droit effectif sur ce dossier, et son origine. */
	interface DroitAffiche extends CompteDeDroit {
		readonly niveau: NiveauDeDroit;
		readonly herite: boolean;
		readonly origine: string;
		/** La ligne de l'appelant — aucun geste ne lui est offert (`P-09`). */
		readonly soiMeme: boolean;
	}

	/** Ce que le dialogue des droits montre. */
	interface DroitsDuDossier {
		readonly accordes: readonly DroitAffiche[];
		readonly candidats: readonly CompteDeDroit[];
	}

	/** L'arborescence réelle d'un domaine, et la place du dossier consulté. */
	interface RangementReel {
		/** Tous les dossiers du domaine, racine comprise (segments vides). */
		readonly destinations: readonly DestinationReelle[];
		readonly dossierId: string;
		/** Le parent du dossier consulté — la destination cochée par défaut. */
		readonly parentId: string;
	}

	const {
		vecteur,
		notes: corpus,
		univers = [],
		domaines = [],
		compte = null,
		domaine: DOMAINE,
		modifications,
		rangement = null,
		origineDuDroit,
		erreurDeCreation = null,
		erreurDeDeplacement = null,
		droits = null,
		erreurDeDroits = null,
		universDuDomaine
	}: Proprietes = $props();

	/** L'univers du domaine affiché — celui de l'adresse, et rien d'autre. */
	const UNIVERS_DU_DOMAINE = $derived(universDuDomaine);

	/** Les trois droits effectifs de la planche, et rien d'autre. */
	type NiveauDeDroit = 'gestionnaire' | 'redacteur' | 'lecteur';

	const reglage = $derived(vecteur ?? {});
	/* `dos` PORTE LE CHEMIN AFFICHÉ DU DOSSIER, racine du domaine exclue — la
	   route le sert toujours, et la chaîne vide y désigne la racine. Le repli
	   était `Exploitation`, un dossier du jeu de démonstration : sur une instance
	   qui ne le porte pas, la page dépliait une branche qui n'existe pas. */
	const chemin = $derived(segmentsDeDossier(String(reglage['dos'] ?? '')));
	const niveau = $derived<NiveauDeDroit>(
		reglage['dr'] === 'redacteur'
			? 'redacteur'
			: reglage['dr'] === 'lecteur'
				? 'lecteur'
				: 'gestionnaire'
	);

	/** Le nom du droit effectif. Trois états, pas plus — son origine est servie. */
	const DROITS: Record<NiveauDeDroit, string> = {
		lecteur: 'Lecteur',
		redacteur: 'Rédacteur',
		gestionnaire: 'Gestionnaire'
	};
	const droitEffectif = $derived(DROITS[niveau]);

	/** L'origine affichée — celle que la route a résolue, et elle seule. */
	const sourceDuDroit = $derived(origineDuDroit);

	/**
	 * P-09 / RG-M05-08 — L'ABSENCE, ET NON LE MASQUAGE (ARB-040).
	 *
	 * Le gel POSE les actions puis les cache, et ici avec la POLARITÉ INVERSE du
	 * socle : `.si-gestionnaire, .si-redacteur { display: none }`
	 * (`mockups/V-13-page-dossier.html:941`), puis
	 * `.app[data-droit="gestionnaire"] .si-gestionnaire`,
	 * `.app[data-droit="gestionnaire"] .si-redacteur`,
	 * `.app[data-droit="redacteur"] .si-redacteur { display: inline-flex }`
	 * (`:942`–`:944`). Une maquette statique n'a pas de serveur : le masquage y
	 * est sa SEULE possibilité. Le produit peut ne pas émettre le nœud, et P-09
	 * l'exige — « ni grisée, NI MASQUÉE ».
	 *
	 * LA CLASSE RESTE POSÉE quand le nœud est rendu, et c'est indispensable ici :
	 * c'est elle qui porte le `display: inline-flex`. La retirer changerait le
	 * rendu ; seul le nœud s'omet, jamais sa classe.
	 *
	 * Énumération : `docs/omissions-p09.md`.
	 */
	const gestionnaire = $derived(niveau === 'gestionnaire');
	const redacteur = $derived(niveau === 'gestionnaire' || niveau === 'redacteur');

	/* ── Arborescence ─────────────────────────────────────────────────────────
	   DEUX SOURCES, ET UNE SEULE STRUCTURE. Sans `rangement`, l'arbre est déduit
	   du rangement réel des NOTES, comme le gel le fait et comme cette vue l'a
	   toujours fait : un chemin que le corpus ne porte pas ne rend aucun nœud, et
	   c'est ainsi que la planche présente son dossier vide. Avec `rangement`,
	   c'est l'arborescence de la BASE qui est rendue — celle qui porte aussi les
	   dossiers vides, qu'aucune note ne peut trahir. */
	interface NoeudDeDossier {
		/** L'identifiant de base, `''` quand l'arbre est déduit des notes. */
		readonly id: string;
		/** Le motif qui interdit d'en faire une destination, `null` sinon. */
		readonly refus: string | null;
		readonly enfants: Record<string, NoeudDeDossier>;
	}

	function creuser(
		racines: Record<string, NoeudDeDossier>,
		segments: readonly string[]
	): NoeudDeDossier | null {
		let courant = racines;
		let dernier: NoeudDeDossier | null = null;
		for (const segment of segments) {
			const existant = courant[segment];
			const noeud: NoeudDeDossier = existant ?? { id: '', refus: null, enfants: {} };
			if (!existant) courant[segment] = noeud;
			dernier = noeud;
			courant = noeud.enfants;
		}
		return dernier;
	}

	const arbre = $derived.by<Record<string, NoeudDeDossier>>(() => {
		const racines: Record<string, NoeudDeDossier> = {};
		if (rangement !== null) {
			/* L'ordre des destinations est celui de la route ; `creuser()` crée les
			   maillons manquants, puis la ligne terminale reçoit son identifiant et
			   son motif de refus. Un maillon créé par un descendant garderait `id`
			   vide s'il n'était pas lui-même dans la liste — il l'est toujours, la
			   route passant l'arborescence entière. */
			for (const d of rangement.destinations) {
				const noeud = creuser(racines, d.segments);
				if (noeud === null) continue;
				const remplace: NoeudDeDossier = { id: d.id, refus: d.refus, enfants: noeud.enfants };
				const parent = creuser(racines, d.segments.slice(0, -1));
				const cle = d.segments[d.segments.length - 1];
				if (cle === undefined) continue;
				if (parent === null) racines[cle] = remplace;
				else parent.enfants[cle] = remplace;
			}
			return racines;
		}
		for (const n of corpus) {
			if (n.domaine !== DOMAINE || !n.dossier) continue;
			creuser(racines, segmentsDeDossier(n.dossier));
		}
		return racines;
	});

	/** La racine du domaine, telle que le sélecteur de destination l'offre. */
	const racineDuDomaine = $derived<DestinationReelle | null>(
		rangement?.destinations.find((d) => d.segments.length === 0) ?? null
	);

	/**
	 * LE CHEMIN VIDE EST LA RACINE DU DOMAINE, ET NON « rien ».
	 *
	 * La racine a une page depuis le 22/08/2026 — `viseLaRacine` du chargeur —,
	 * et son chemin AFFICHÉ est la suite vide : `segmentsAffiches()` remonte les
	 * ancêtres sans consommer la racine. Sans ce cas, la boucle ci-dessous ne
	 * s'exécutait pas, `noeudDe([])` rendait `null`, et la page de la racine
	 * n'annonçait JAMAIS ses sous-dossiers : on en créait un, il disparaissait de
	 * l'écran qui venait de le créer.
	 *
	 * `arbre` EST DÉJÀ L'ENSEMBLE DES ENFANTS DE LA RACINE : la destination de la
	 * racine porte des segments vides, `creuser()` n'y descend d'aucun maillon et
	 * la boucle de construction la saute. Son premier niveau est donc exactement
	 * la fratrie cherchée.
	 */
	function noeudDe(c: readonly string[]): NoeudDeDossier | null {
		if (c.length === 0) {
			return {
				id: racineDuDomaine?.id ?? '',
				refus: racineDuDomaine?.refus ?? null,
				enfants: arbre
			};
		}
		let niveauCourant = arbre;
		let trouve: NoeudDeDossier | null = null;
		for (const segment of c) {
			const n = niveauCourant[segment];
			if (!n) return null;
			trouve = n;
			niveauCourant = n.enfants;
		}
		return trouve;
	}

	function compterDossiers(a: Record<string, NoeudDeDossier>): number {
		let total = 0;
		for (const n of Object.values(a)) total += 1 + compterDossiers(n.enfants);
		return total;
	}

	function cheminTexte(c: readonly string[]): string {
		return c.join(' › ');
	}

	function notesDirectes(c: readonly string[]): readonly Note[] {
		const cible = cheminTexte(c);
		return corpus.filter((n) => n.domaine === DOMAINE && n.dossier === cible);
	}

	function notesRecursives(c: readonly string[]): readonly Note[] {
		const prefixe = cheminTexte(c);
		return corpus.filter(
			(n) =>
				n.domaine === DOMAINE && (n.dossier === prefixe || n.dossier.startsWith(`${prefixe} ›`))
		);
	}

	function sousDossiers(c: readonly string[]): readonly string[] {
		const n = noeudDe(c);
		return n ? Object.keys(n.enfants) : [];
	}

	function compterSousArbre(c: readonly string[]): number {
		const n = noeudDe(c);
		return n ? compterDossiers(n.enfants) : 0;
	}

	/**
	 * LE NOM DU DOSSIER — dernier segment du chemin, et LE NOM DU DOMAINE sur la
	 * racine, qui n'a pas de segment sous elle.
	 *
	 * `RG-STR-03` donne à la racine le nom de son domaine, et c'est sous ce nom
	 * que le sélecteur de destination l'offre déjà. Le repli sur la chaîne vide
	 * laissait le `h1` réduit à son pictogramme et le dialogue des droits titré
	 * « Droits du dossier » sans dossier.
	 */
	const nom = $derived(chemin[chemin.length - 1] ?? DOMAINE);
	/** La racine du domaine est le seul dossier sans parent — RG-STR-03. */
	const surLaRacine = $derived(chemin.length === 0);
	/** Le chemin affiché de ce dossier, la racine étant nommée par son domaine. */
	const cheminDuDossier = $derived(surLaRacine ? DOMAINE : cheminTexte(chemin));
	const sous = $derived(sousDossiers(chemin));
	const notesDuDossier = $derived(notesDirectes(chemin));
	const toutes = $derived(notesRecursives(chemin));

	/* ── Notes groupées par type ─────────────────────────────────────────────
	   Une fiche est groupée sous son type structuré : « Fiche Serveur ». */
	function cleDeType(n: Note): string {
		return n.typeFiche ? `${motFiche} ${n.typeFiche}` : n.type;
	}

	/**
	 * LE PLURIEL D'UN NOM DE TYPE — ET CE N'EST PAS UN ACCORD EN NOMBRE.
	 *
	 * Il ne reçoit aucun compte : l'appelant le garde par `liste.length > 1` et
	 * il rend un TITRE de groupe. Il ne se confond donc pas avec `accord()`.
	 *
	 * Sa table énumérait quatre types — Procédure, Guide, Note, Signet — dont le
	 * pluriel est très exactement celui de `pluriel()` ; elle divergeait de la
	 * seule source des formes rendues au premier type créé en console, qu'elle
	 * laissait au singulier. Seule la COMPOSITION avec le mot renommable lui
	 * appartient : le pluriel porte sur le mot de `M14.7`, jamais sur le type
	 * qui le suit — « Fiche Serveur » donne « Fiches Serveur ».
	 */
	function plurielDeType(t: string): string {
		if (t.startsWith(`${motFiche} `)) return `${motFichePluriel} ${t.slice(motFiche.length + 1)}`;
		return pluriel(t);
	}

	const groupes = $derived.by<readonly [string, readonly Note[]][]>(() => {
		const table: Record<string, Note[]> = {};
		for (const n of notesDuDossier) {
			const cle = cleDeType(n);
			const liste = table[cle];
			if (liste) liste.push(n);
			else table[cle] = [n];
		}
		return Object.entries(table).sort(
			(a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr')
		);
	});

	/* ── Témoin de fraîcheur — une seule fabrique ──────────────────────────────
	   Elle est dans `$lib/fraicheur`, et nulle part ailleurs (P-01, ADR-005) :
	   la classe, le nombre de barres et le libellé en sortent tous les trois.
	   Une fonction locale rendant 3, 2 ou 1 selon le niveau serait
	   `barresFraicheur` réécrite sans son nom. */

	/** L'ancienneté de la dernière modification — distincte de la vérification. */
	function modification(n: Note): string {
		const j = modifications[n.id];
		if (typeof j !== 'number') return 'modification inconnue';
		if (j <= 0) return "modifiée aujourd'hui";
		return j === 1 ? 'modifiée hier' : `modifiée il y a ${j} jours`;
	}

	/** Nombre en français — `x.toLocaleString("fr-FR")` du gel. */
	function nb(x: number): string {
		return x.toLocaleString('fr-FR');
	}

	/* ── Ce que les trois dialogues montrent ──────────────────────────────────
	   Aucun chiffre n'est saisi : les décomptes sortent de l'arborescence et du
	   corpus, exactement comme ceux de l'en-tête (`P-02`). */

	/**
	 * LE PLAFOND DE `RG-STR-04`, DANS LA NUMÉROTATION D'ÉCRAN DU GEL — `V-13:1958`
	 * le déclare de la même façon, et le texte d'aide de `#dlg-creer` le cite deux
	 * fois. Le gel compte les niveaux à partir du premier dossier SOUS la racine
	 * du domaine ; `PROFONDEUR_MAX` de `$lib/donnees/rangement` compte la racine,
	 * comme la contrainte `dossiers_profondeur_plafonnee`. Les deux numérotations
	 * disent le même plafond et diffèrent d'une unité.
	 *
	 * CE NOMBRE N'EST PAS L'AUTORITÉ, et il ne peut pas l'être : une vue ne peut
	 * importer `rangement.ts` sans faire entrer le connecteur de base dans le
	 * paquet du navigateur. L'autorité est le serveur, qui refuse ; ceci n'est
	 * que le chiffre que la phrase du gel affiche.
	 */
	const PROFONDEUR_MAX = 10;

	/** Le niveau qu'aurait le sous-dossier à créer — `V-13:2196`. */
	const niveauDuSousDossier = $derived(chemin.length + 1);

	/** Le décompte de `RG-M03-04` — `V-13:2333`-`2351`. */
	const sousArbreDetruit = $derived(compterSousArbre(chemin));
	const brouillonsDetruits = $derived(toutes.filter((n) => n.brouillon).length);
	const consultationsDetruites = $derived(toutes.reduce((s, n) => s + n.vues, 0));

	/**
	 * LA NOTE DU DÉCOMPTE — `V-13:2354`-`2360`, tournure pour tournure. Elle dit
	 * ce que la seule liste ne dit pas : que les liens entrants vont casser.
	 */
	const noteDuDecompte = $derived(
		toutes.length === 0
			? 'Ce dossier ne contient aucune note.'
			: `Ces notes totalisent ${nb(consultationsDetruites)} ${accord(
					consultationsDetruites,
					'consultation'
				)}${
					brouillonsDetruits === 0
						? ''
						: `, dont ${String(brouillonsDetruits)} ${accord(brouillonsDetruits, 'brouillon')}`
				}. Les liens qui pointent vers elles deviendront cassés.`
	);

	/** Une ligne du sélecteur de destination, prête à rendre. */
	interface RameauDeChoix {
		readonly cle: string;
		readonly nom: string;
		readonly id: string;
		readonly refus: string | null;
		readonly enfants: readonly RameauDeChoix[];
	}

	function rameaux(niveauCourant: Record<string, NoeudDeDossier>): readonly RameauDeChoix[] {
		return Object.entries(niveauCourant).map(([cle, n]) => ({
			cle,
			nom: cle,
			id: n.id,
			refus: n.refus,
			enfants: rameaux(n.enfants)
		}));
	}

	const choixDeDestination = $derived(rameaux(arbre));

	/* ── Les compteurs mènent à la liste, filtrée sur ce dossier ──────────────
	   La facette `dossier` de V-12 EXISTE et est honorée par son chargeur ; sa
	   clé est le chemin AFFICHÉ d'une note, celui-là même que cette vue
	   compose. Les compteurs de l'en-tête étaient inertes : ils annonçaient un
	   nombre de notes sans mener nulle part.

	   LE TOTAL RÉCURSIF N'EST PAS UN FILTRE APPROCHANT. La facette compare un
	   chemin ENTIER, jamais un préfixe ; le total est donc émis comme AUTANT DE
	   VALEURS `dossier` qu'il y a de dossiers dans le sous-arbre, ce que
	   l'adresse sait porter et que le chargeur lit par `getAll()`. L'ensemble
	   d'arrivée est exactement celui qui est compté — un filtre par préfixe,
	   lui, aurait menti. */
	function cheminsDuSousArbre(c: readonly string[]): readonly string[] {
		const dedans: string[] = [cheminTexte(c)];
		for (const enfant of sousDossiers(c)) dedans.push(...cheminsDuSousArbre([...c, enfant]));
		return dedans;
	}

	/**
	 * L'ADRESSE EST COMPOSÉE COUPLE PAR COUPLE, et non par `URLSearchParams` :
	 * une instance mutable de cette classe est refusée dans un composant Svelte
	 * (`svelte/prefer-svelte-reactivity`), et la réactivité n'a rien à faire ici —
	 * cette fabrique est pure. Même geste qu'en `V-02`.
	 *
	 * ELLE REND `null` QUAND LA FACETTE NE SAIT PAS DIRE L'ENSEMBLE COMPTÉ, et
	 * c'est le cas du DOSSIER RACINE d'un domaine. Son chemin affiché est la
	 * chaîne VIDE — la racine n'entre dans aucun chemin de note —, et le chargeur
	 * de V-12 ÉCARTE toute valeur vide avant de poser la facette (le crible est
	 * dans `notes/+page.server.ts`, juste après la lecture des valeurs de la clé) :
	 * l'adresse partirait avec une facette non posée et rendrait TOUT le domaine
	 * là où le compteur annonce les seules notes de la racine. Le compteur reste
	 * alors inerte, et il le reste aussi pour le total récursif d'une racine, dont
	 * la liste de chemins porte cette même chaîne vide. Un lien qui livre plus que
	 * ce qu'il annonce est pire qu'un lien absent.
	 */
	function adresseDesNotesDuDossier(chemins: readonly string[]): string | null {
		if (chemins.length === 0 || chemins.some((chemin) => chemin === '')) return null;
		const couples = chemins.map((chemin) => `dossier=${encodeURIComponent(chemin)}`);
		return `${adresseDesNotesDuDomaine(UNIVERS_DU_DOMAINE, DOMAINE)}?${couples.join('&')}`;
	}

	const lienDesNotesDirectes = $derived(adresseDesNotesDuDossier([cheminTexte(chemin)]));
	const lienDesNotesTotales = $derived(adresseDesNotesDuDossier(cheminsDuSousArbre(chemin)));

	/* ── Le dialogue des droits ───────────────────────────────────────────────
	   LES LIBELLÉS SONT CEUX DE `.droit__nom`, EN HAUT DE CETTE PAGE MÊME, et
	   non ceux du gel de V-40 — qui écrit « Lecture / Écriture / Gestion »
	   (`V-40:1207`-`1209`). Deux jeux de mots pour trois valeurs sur un même
	   écran, c'est un synonyme : la pastille de droit effectif dirait
	   « Rédacteur » là où le dialogue qui vient de l'accorder dirait
	   « Écriture ». Les valeurs, elles, sont celles de l'énumération de base. */
	const NIVEAUX: readonly { valeur: NiveauDeDroit; libelle: string }[] = [
		{ valeur: 'lecteur', libelle: 'Lecteur' },
		{ valeur: 'redacteur', libelle: 'Rédacteur' },
		{ valeur: 'gestionnaire', libelle: 'Gestionnaire' }
	];

	/** Le chemin complet du dossier, domaine compris — sous-titre du dialogue. */
	const cheminComplet = $derived(cheminTexte([DOMAINE, ...chemin]));
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
{#snippet temoin(n: Note)}
	<span class="temoin {classeTemoin(n.fraicheur)}"
		><span class="temoin__jauge" aria-hidden="true"
			>{#each [0, 1, 2] as rang (rang)}<i
					class={rang < barresFraicheur(n.fraicheur) ? 'plein' : undefined}
				></i>{/each}</span
		><span class="temoin__txt">{libelleFraicheur(n)}</span></span
	>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="dossier-vue"
	fil={['Accueil', UNIVERS_DU_DOMAINE, DOMAINE, ...chemin]}
	courant={[DOMAINE, ...chemin]}
	droits={niveau === 'lecteur' ? 'lecture' : 'ecriture'}
	donnees={{ 'data-droit': niveau }}
	{univers}
	{domaines}
	notes={corpus}
	compte={compte ?? COMPTE_VIDE}
	version=""
>
	{#snippet enfants()}
		<header class="tete-dossier">
			<div class="tete-dossier__corps">
				<div class="tete-dossier__sur">
					<span class="droit" id="droit" data-niveau={niveau}>
						<span class="droit__pastille"></span>
						<span id="droit-nom">{droitEffectif}</span>
						<span class="droit__source" id="droit-source">{sourceDuDroit}</span>
					</span>
				</div>
				<h1>
					<svg
						width="22"
						height="22"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						><path
							d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
						/></svg
					>
					<span id="titre">{nom}</span>
				</h1>
				<!--
					LES COMPTEURS MÈNENT À CE QU'ILS COMPTENT — ils étaient inertes.

					La balise change, et c'est le seul endroit où cette vue s'écarte du
					gel : trois `span` deviennent des liens. `V-11:1953` distingue le
					cliquable de l'inerte PAR LA BALISE, et c'est bien ce qui se passe
					ici — ce qui mène quelque part le dit. Un lien, non un bouton : la
					cible est une adresse, elle s'ouvre donc dans un nouvel onglet, se
					copie, et fonctionne sans script.

					« sous-dossiers » ne quitte pas la page : les tuiles sont juste
					dessous. Le lien n'est posé que lorsqu'il y en a — sans quoi il
					mènerait à un bloc masqué.
				-->
				{#snippet compteurDeNotes(combien: number, libelle: string, adresse: string | null)}
					{#if adresse === null}<span><b>{nb(combien)}</b> {libelle}</span>{:else}<a href={adresse}
							><b>{nb(combien)}</b> {libelle}</a
						>{/if}
				{/snippet}
				<div class="compteurs" id="compteurs">
					{#if sous.length}<a href="#bloc-sous"
							><b>{nb(sous.length)}</b> {accord(sous.length, 'sous-dossier')}</a
						>{:else}<span><b>{nb(sous.length)}</b> sous-dossier</span>{/if}<span
						style="color:var(--c-trait-fort)">·</span
					>{@render compteurDeNotes(
						notesDuDossier.length,
						accord(notesDuDossier.length, 'note directe', 'notes directes'),
						lienDesNotesDirectes
					)}{#if toutes.length !== notesDuDossier.length}<span style="color:var(--c-trait-fort)"
							>·</span
						>{@render compteurDeNotes(
							toutes.length,
							accord(
								toutes.length,
								'note au total, sous-dossiers compris',
								'notes au total, sous-dossiers compris'
							),
							lienDesNotesTotales
						)}{/if}
				</div>
			</div>

			<div class="actions-dossier">
				<!-- P-09 · ARB-040 — omises, jamais masquées. `V-13:1157`, `:1161`–`:1164` -->
				{#if redacteur}<button class="btn btn--principal si-redacteur" id="a-note">
						<svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
						>
						Nouvelle note
					</button>{/if}
				<!--
					RENOMMER ET SUPPRIMER SONT OMIS SUR LA RACINE — `P-03`, un geste
					offert est un geste qui marche.

					`renommerOuDeplacerUnDossier()` et `supprimerUnDossier()`
					(`$lib/donnees/dossiers-ecriture`) refusent tout dossier sans parent,
					et leur refus est MUET : la racine porte le nom de son domaine
					(`RG-STR-03`) et disparaîtrait avec lui. Les deux boutons étaient
					donc rendus et ne pouvaient rien produire.

					« Nouveau sous-dossier » et « Gérer les droits », eux, marchent sur la
					racine — c'est même le seul endroit d'où le premier dossier d'un
					domaine se crée.
				-->
				{#if gestionnaire}<button class="btn si-gestionnaire" id="a-sousdossier"
						>Nouveau sous-dossier</button
					>
					{#if !surLaRacine}<button class="btn si-gestionnaire" id="a-renommer"
							>Renommer ou déplacer</button
						>{/if}
					<button class="btn si-gestionnaire" id="a-droits">Gérer les droits</button>
					{#if !surLaRacine}<button class="btn btn--destructif si-gestionnaire" id="a-supprimer"
							>Supprimer</button
						>{/if}{/if}
			</div>
		</header>

		<section class="bloc" id="bloc-sous" hidden={!sous.length}>
			<div class="section-titre">
				<h2>Sous-dossiers</h2>
				<span class="etiq" id="n-sous"
					>{#if sous.length}{sous.length}
						{accord(sous.length, 'sous-dossier')}{/if}</span
				>
			</div>
			<div class="tuiles" id="tuiles">
				{#each sous as s (s)}
					{@const sousChemin = [...chemin, s]}
					{@const nbNotes = notesRecursives(sousChemin).length}
					{@const nbSous = compterSousArbre(sousChemin)}
					<a class="tuile" href={adresseDeDossier(UNIVERS_DU_DOMAINE, DOMAINE, sousChemin)}
						><span class="tuile__ic"
							><svg
								width="18"
								height="18"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><path
									d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
								/></svg
							></span
						><span
							><span class="tuile__nom">{s}</span><span class="tuile__n"
								>{nbNotes}
								{accord(nbNotes, 'note')}{nbSous
									? ` · ${nbSous} ${accord(nbSous, 'sous-dossier')}`
									: ''}</span
							></span
						></a
					>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-notes" hidden={!notesDuDossier.length}>
			<div class="section-titre">
				<h2>Notes de ce dossier</h2>
				<span class="etiq" id="n-notes"
					>{#if notesDuDossier.length}{notesDuDossier.length}
						{accord(notesDuDossier.length, 'note')}{/if}</span
				>
			</div>
			<div id="groupes">
				{#each groupes as [type, liste] (type)}
					<section class="groupe">
						<div class="groupe__tete">
							<h3 class="groupe__nom">{liste.length > 1 ? plurielDeType(type) : type}</h3>
							<span class="groupe__n">{liste.length}</span>
						</div>
						{#each liste as n (n.id)}<a class="note-ligne" href={adresseDeNote(n.id)}
								><span class="note-ligne__corps"
									><span class="note-ligne__titre"
										>{n.titre}{#if n.brouillon}<span class="past past--brouillon">Brouillon</span
											>{/if}</span
									><span class="note-ligne__sous"
										><span>{n.auteur}</span><span class="sep">·</span><span>{modification(n)}</span
										></span
									></span
								>{@render temoin(n)}</a
							>{/each}
					</section>
				{/each}
			</div>
		</section>

		<section class="bloc" id="bloc-vide" hidden={sous.length > 0 || notesDuDossier.length > 0}>
			<div class="vide-dossier">
				<h2>Ce dossier est vide</h2>
				<p id="vide-txt">
					Aucune note, aucun sous-dossier. Un dossier vide n'est pas un problème : c'est une place
					préparée pour ce qui va venir.
				</p>
				<div class="vide-dossier__actions">
					<!-- P-09 · ARB-040 — omises, jamais masquées. `V-13:1192`, `:1193` -->
					{#if redacteur}<button class="btn btn--principal si-redacteur" id="v-note"
							>Créer une note ici</button
						>{/if}
					{#if gestionnaire}<button class="btn si-gestionnaire" id="v-sousdossier"
							>Créer un sous-dossier</button
						>{/if}
				</div>
			</div>
		</section>
	{/snippet}
</Coquille>

<!--
	LES TROIS DIALOGUES DU GEL, HORS `div.app` COMME DANS LA MAQUETTE ET FERMÉS.

	Ils suivent `</div></div>` dans le gel (`V-13:1202`), donc la coquille ici. Un
	`dialog` sans `open` ne génère aucune boîte et n'entre pas dans l'instantané
	ARIA : leur présence ne déplace pas un pixel, et c'est ce qui autorise à les
	transcrire sans toucher au rendu mesuré.

	AUCUN `name`, AUCUN `method`, AUCUNE `action` — `ARB-063` : les vues sont la
	transcription du gel, et le gel n'en porte aucun. C'est la route qui nomme les
	champs à l'installation, et elle seule.
-->

<!--
	LES TROIS DIALOGUES SONT DES GESTES DE GESTIONNAIRE, ET ILS SUIVENT LEURS
	BOUTONS — `P-09` / `ARB-040`, « ni grisée, NI MASQUÉE ».

	Émettre un `dialog` fermé que l'appelant ne peut pas ouvrir laisserait
	`#creer-valider`, `#dep-valider` et `#sup-valider` dans le DOM d'un rédacteur :
	des actions interdites, présentes. La condition est la même que celle des
	boutons de `.actions-dossier` — une seule règle, écrite deux fois au même
	endroit, plutôt que deux polarités à tenir d'accord.
-->
{#if gestionnaire}
	<!-- ============================ DIALOGUE 1 — Créer un sous-dossier ============================ -->
	<dialog class="dlg" id="dlg-creer" aria-labelledby="dlg-creer-titre">
		<div class="dlg__boite">
			<div class="dlg__tete">
				<span class="dlg__marque" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						><path
							d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"
						/><path d="M8 7v4M6 9h4" stroke-width="1.4" /></svg
					>
				</span>
				<h2 class="dlg__titre" id="dlg-creer-titre">Nouveau sous-dossier</h2>
				<button class="dlg__fermer" data-fermer aria-label="Fermer">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>
			<div class="dlg__corps">
				<p class="dlg__texte">
					Il sera créé dans <strong id="creer-parent">{cheminDuDossier}</strong>.
				</p>
				<div
					class="champ"
					id="champ-creer"
					data-etat={erreurDeCreation === null ? undefined : 'erreur'}
				>
					<label class="champ__label" for="creer-nom"
						>Nom du dossier <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="creer-nom"
						placeholder="Restauration"
						autocomplete="off"
					/>
					<span class="champ__aide" id="creer-aide"
						>Un nom court et parlant. Ce dossier sera au niveau {niveauDuSousDossier} sur {PROFONDEUR_MAX}
						— il restera {PROFONDEUR_MAX - niveauDuSousDossier} niveaux disponibles en dessous.</span
					>
					<div class="champ__erreur" id="creer-erreur" hidden={erreurDeCreation === null}>
						{erreurDeCreation ?? ''}
					</div>
				</div>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer>Annuler</button>
				<button class="btn btn--principal" id="creer-valider">Créer le dossier</button>
			</div>
		</div>
	</dialog>

	<!-- ============================ DIALOGUE 2 — Renommer ou déplacer ============================ -->
	<!--
		LES DEUX DIALOGUES SUIVENT LEURS BOUTONS, RACINE COMPRISE — même règle
		qu'au-dessus, et pour la même raison : `#dep-valider` et `#sup-valider`
		laissés dans le DOM d'une racine seraient deux gestes que le module de
		données refuse par construction.
	-->
	{#if !surLaRacine}
		<dialog class="dlg dlg--large" id="dlg-deplacer" aria-labelledby="dlg-deplacer-titre">
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M2 8h9M8 4.5L11.5 8 8 11.5M13.5 3v10" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-deplacer-titre">Renommer ou déplacer</h2>
					<button class="dlg__fermer" data-fermer aria-label="Fermer">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps">
					<div class="champ">
						<label class="champ__label" for="dep-nom">Nom</label>
						<input class="saisie" type="text" id="dep-nom" autocomplete="off" value={nom} />
					</div>
					<div class="champ">
						<span class="champ__label">Emplacement</span>
						<span class="champ__aide"
							>Les destinations impossibles sont montrées avec leur motif plutôt que masquées : sans
							cela, on cherche longtemps un dossier qui n'apparaît nulle part.</span
						>
						<div class="arbre-choix" id="arbre-choix">
							<ul>
								<li>
									{@render choix(
										racineDuDomaine?.id ?? '',
										`Racine du domaine ${DOMAINE}`,
										racineDuDomaine?.refus ?? null
									)}
									{@render sousChoix(choixDeDestination)}
								</li>
							</ul>
						</div>
					</div>
					<div class="champ__erreur" id="dep-erreur" hidden={erreurDeDeplacement === null}>
						{erreurDeDeplacement ?? ''}
					</div>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer>Annuler</button>
					<button class="btn btn--principal" id="dep-valider">Enregistrer</button>
				</div>
			</div>
		</dialog>

		<!-- ============================ DIALOGUE 3 — Supprimer ============================ -->
		<dialog class="dlg dlg--destructif" id="dlg-supprimer" aria-labelledby="dlg-supprimer-titre">
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><path
								d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-supprimer-titre">Supprimer ce dossier</h2>
					<button class="dlg__fermer" data-fermer aria-label="Fermer">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps">
					<div class="decompte">
						<div class="decompte__titre">Cette suppression est définitive</div>
						<ul id="decompte-liste">
							<li><b>1</b>dossier — {cheminTexte(chemin)}</li>
							{#if sousArbreDetruit > 0}<li>
									<b>{sousArbreDetruit}</b>{accord(sousArbreDetruit, 'sous-dossier')}
								</li>{/if}
							{#if toutes.length > 0}<li>
									<b>{toutes.length}</b>{accord(
										toutes.length,
										'note',
										'notes, tous sous-dossiers compris'
									)}
								</li>{/if}
						</ul>
						<div class="decompte__note" id="decompte-note">{noteDuDecompte}</div>
					</div>
					<div class="champ" id="champ-sup">
						<label class="champ__label" for="sup-saisie">
							Pour confirmer, saisissez le nom exact du dossier :
							<span class="confirmation__cible" id="sup-cible">{nom}</span>
						</label>
						<input
							class="saisie"
							type="text"
							id="sup-saisie"
							autocomplete="off"
							spellcheck="false"
							placeholder="Nom du dossier"
						/>
					</div>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						disabled
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
					>
						Supprimer définitivement
					</button>
				</div>
			</div>
		</dialog>
	{/if}

	<!-- ============================ DIALOGUE 4 — Gérer les droits ============================ -->
	<!--
		TRANSCRIT DE `mockups/V-40-dialogues.html:1184`-`1224`, et non emprunté à
		`V-40.svelte` : le motif est à l'en-tête de ce fichier, et les neuf classes
		manquantes sont désormais dans `V-13.css`.

		TROIS ÉCARTS AU GEL, ET CHACUN RÉPARE UN DÉFAUT DE LA MAQUETTE.

		 · LE NIVEAU D'UN DROIT PROPRE EST UN SÉLECTEUR, non une pastille inerte.
		   Le gel n'offre qu'ajouter et retirer : changer un niveau y demande de
		   retirer puis de réaccorder, c'est-à-dire de fermer un accès pour le
		   rouvrir. La pastille reste, telle quelle, sur les droits HÉRITÉS — qui
		   ne se changent pas ici.
		 · LE PIED NE PORTE PLUS « Enregistrer les droits ». Au gel, les deux
		   boutons ferment (`data-fermer`) : le second promet un enregistrement
		   qu'il ne fait pas. Chaque geste est immédiat et confirmé par le
		   serveur ; un bouton qui n'enregistre rien est un geste promis pour rien.
		 · LA LIGNE DE L'APPELANT N'OFFRE NI RETRAIT NI CHANGEMENT — `P-09`,
		   « ni grisée, NI MASQUÉE ». Le serveur refuse qu'un gestionnaire se
		   ferme la porte ; le lui proposer serait dessiner un geste impossible.
	-->
	<dialog class="dlg dlg--large" id="dlg-droits" aria-labelledby="dlg-droits-titre">
		<div class="dlg__boite">
			<div class="dlg__tete">
				<span class="dlg__marque" aria-hidden="true">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><rect x="3" y="7" width="10" height="6.5" rx="1.3" /><path
							d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
						/></svg
					>
				</span>
				<div style="flex:1;min-width:0">
					<h2 class="dlg__titre" id="dlg-droits-titre">Droits du dossier {nom}</h2>
					<div style="font-size:var(--t-mini);color:var(--c-encre-3);margin-top:2px">
						{cheminComplet}
					</div>
				</div>
				<button class="dlg__fermer" data-fermer aria-label="Fermer">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>
			<div class="dlg__corps">
				<span class="etiq">Droits accordés</span>
				<div class="droits" id="liste-droits">
					{#each droits?.accordes ?? [] as ligne (ligne.identifiant)}
						<div class="dr" data-herite={ligne.herite ? 'oui' : 'non'}>
							<span class="dr__avatar">{ligne.initiales}</span>
							<div style="min-width:0">
								<div class="dr__nom">{ligne.nom}</div>
								{#if ligne.origine !== ''}<div class="dr__origine">
										<svg
											width="10"
											height="10"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											stroke-width="2"><path d="M4 2v8a2 2 0 0 0 2 2h6" /></svg
										>{ligne.origine.replace('— ', '')}
									</div>{/if}
							</div>
							{#if ligne.herite || ligne.soiMeme}
								<span class="dr__role"
									>{NIVEAUX.find((n) => n.valeur === ligne.niveau)?.libelle}</span
								>
							{:else}
								<select
									class="selecteur"
									data-compte={ligne.identifiant}
									aria-label="Niveau de droit de {ligne.nom}"
								>
									{#each NIVEAUX as niveauOffert (niveauOffert.valeur)}
										<option
											value={niveauOffert.valeur}
											selected={niveauOffert.valeur === ligne.niveau}>{niveauOffert.libelle}</option
										>
									{/each}
								</select>
							{/if}
							{#if ligne.herite || ligne.soiMeme}
								<span style="width:27px"></span>
							{:else}
								<button
									class="dr__retirer"
									data-compte={ligne.identifiant}
									aria-label="Retirer l'accès de {ligne.nom}"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
									>
								</button>
							{/if}
						</div>
					{/each}
				</div>

				<!--
					« AJOUTER UN ACCÈS » N'EST RENDU QUE S'IL Y A QUELQU'UN À AJOUTER —
					`P-09`, omis plutôt que grisé.

					La liste des candidats est l'annuaire des comptes moins ceux qui ont
					déjà un droit ici, et le chargeur ne sert cet annuaire qu'au rôle
					`administrateur` : un gestionnaire de dossier qui n'est pas
					administrateur reçoit donc une liste VIDE, et un sélecteur sans
					option suivi d'un bouton « Ajouter » serait un geste dessiné que rien
					ne peut accomplir. Elle est vide, aussi, quand tout compte actif de
					l'instance a déjà un droit sur ce dossier.
				-->
				{#if (droits?.candidats ?? []).length > 0}
					<div class="champ">
						<span class="champ__label">Ajouter un accès</span>
						<div class="dr-ajout">
							<select class="selecteur" id="droit-qui" aria-label="Personne">
								{#each droits?.candidats ?? [] as candidat (candidat.identifiant)}
									<option value={candidat.identifiant}>{candidat.nom}</option>
								{/each}
							</select>
							<select class="selecteur" id="droit-role" aria-label="Niveau de droit sur ce dossier">
								{#each NIVEAUX as niveauOffert (niveauOffert.valeur)}
									<option value={niveauOffert.valeur}>{niveauOffert.libelle}</option>
								{/each}
							</select>
							<button class="btn btn--principal" id="droit-ajouter">Ajouter</button>
						</div>
					</div>
				{/if}

				<div class="champ__erreur" id="droits-erreur" hidden={erreurDeDroits === null}>
					{erreurDeDroits ?? ''}
				</div>

				<div class="decompte">
					<div class="decompte__titre">Droits explicites et droits hérités</div>
					<div class="decompte__note">
						Les droits en pointillé sont hérités d'un dossier parent ou du domaine. <b
							>Retirer un droit explicite ne retire pas un droit hérité</b
						> : si un compte a l'écriture sur tout le domaine, la lui retirer ici la lui laisse — il faut
						la retirer là où elle a été accordée. Le nom du dossier d'origine est indiqué sous chaque
						droit hérité.
					</div>
				</div>
			</div>
			<div class="dlg__pied">
				<button class="btn" data-fermer>Fermer</button>
			</div>
		</div>
	</dialog>
{/if}

<!--
	LE SÉLECTEUR ARBORESCENT DE DESTINATION — `V-13:2252`-`2306`.

	La récursion est celle du gel : une ligne, puis la liste de ses enfants si
	elle en a. La racine du domaine fait exception, elle porte toujours sa liste,
	fût-elle vide (`racine.appendChild(sousUl)`, `V-13:2303`).

	Le bouton radio est COCHÉ sur le parent actuel et DÉSACTIVÉ sur toute
	destination refusée : « refuser après le clic serait une porte fermée. »
-->
{#snippet choix(id: string, libelle: string, refus: string | null)}
	<label class="choix" data-refuse={refus === null ? undefined : 'oui'}>
		<input
			type="radio"
			name="destination"
			value={id}
			disabled={refus !== null}
			checked={refus === null && id !== '' && id === rangement?.parentId}
		/>
		<span class="choix__corps">
			<span class="choix__nom">{libelle}</span>
			{#if refus !== null}<span class="choix__motif">{refus}</span>{/if}
		</span>
	</label>
{/snippet}

{#snippet sousChoix(branches: readonly RameauDeChoix[])}
	<ul>
		{#each branches as branche (branche.cle)}
			<li>
				{@render choix(branche.id, branche.nom, branche.refus)}
				{#if branche.enfants.length}{@render sousChoix(branche.enfants)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}
