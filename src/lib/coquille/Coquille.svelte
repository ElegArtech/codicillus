<script lang="ts">
	/**
	 * Coquille applicative — le gabarit permanent de l'espace de travail (V-37).
	 *
	 * LE VOCABULAIRE DE LA FAMILLE A-8 A DÉMÉNAGÉ — ARB-028. `TypeNotification`
	 * et `Notification` étaient déclarés ici, parce que la coquille était le seul
	 * lieu qui rendît la pile. Elle ne l'est plus : V-06 la rend SANS coquille,
	 * avec la variante gelée de sa propre maquette. Le vocabulaire est passé à
	 * `./notifications`, le balisage à `./PileDeNotifications.svelte` — un seul
	 * composant, deux états gelés, aucune recopie (`docs/DESIGN.md` §3.7, n° 7).
	 *
	 * Trente-cinq vues sur quarante et une l'enveloppent : toutes celles de
	 * l'espace de travail et de la console. En sont exclues les quatre vues de
	 * l'espace public (V-01 à V-04) et les deux d'authentification (V-05, V-06)
	 * — `cadrage/BRIEF-VUES.md` §3.3.
	 *
	 * CE FICHIER EST LA RESSOURCE EXCLUSIVE DU LOT T-101, gelée à sa clôture
	 * (DAG K-10), puis ROUVERTE DEUX FOIS, chaque fois pour un amendement borné,
	 * chaque fois REGELÉE à la clôture du lot qui l'a portée.
	 *
	 * PREMIER AMENDEMENT — ARB-015, lot T-101b. Deux points, et rien d'autre :
	 *   1. la classe et l'identifiant de `<main>`, que 32 maquettes sur les 34
	 *      à coquille dotées d'un `<main>` portent (`doc`, `travail`, `lecture`,
	 *      `editeur`, `carto`, `tdb`, … / `contenu`, `travail`, `corps`) ;
	 *   2. le jeu de notifications TYPÉ du catalogue V-38, en lieu et place des
	 *      notifications texte de T-101.
	 *
	 * SECOND AMENDEMENT — ARB-019, lot T-101c. Deux propriétés, et rien
	 * d'autre : la CIBLE du lien d'évitement (`cibleEvitement`) et son LIBELLÉ
	 * (`libelleEvitement`). Défauts inchangés — `#{idContenu}` et « Aller au
	 * contenu » —, donc aucun changement de rendu pour les vues déjà livrées.
	 * Motif : le lien d'évitement ne vise `<main>` que dans 22 des 34 maquettes
	 * à coquille, et 11 portent un libellé propre ; c'est le premier nœud
	 * focalisable de la page et une exigence d'accessibilité réelle
	 * (RG-M18-08, P-06), pas une décoration.
	 *
	 * TROISIÈME AMENDEMENT — ARB-021 et ARB-022, lot P-0. Il est UNIQUE et
	 * couvre d'un coup les cinq besoins que le relevé des 37 vues restantes
	 * (`docs/releve-vues.md`) a mis au jour ensemble, plutôt qu'un lot par
	 * besoin comme les trois amendements précédents l'ont fait :
	 *
	 *   A-1  `forme` — la coquille rend la forme ABRÉGÉE ou complète. 26 vues.
	 *   A-2  `donnees` — les attributs de données de la vue sur `div.app`.
	 *        46 attributs — recomptés —, 26 noms distincts, 27 vues.
	 *   A-3  le libellé du chevron. MESURÉ, et le relevé se corrige : la forme
	 *        complète dit « Déplier » MÊME OUVERTE, parce que le gel construit
	 *        le libellé sur l'état persisté du rail — vide à tout chargement du
	 *        banc — et que `coquille({ courant })` déplie sans relibeller. Le
	 *        gabarit était donc DÉJÀ juste pour les 8 vues complètes, V-14
	 *        comprise ; la seule chose à faire était de porter, en forme
	 *        abrégée, le libellé écrit AU BALISAGE. Voir `Rail.svelte`.
	 *   A-4  `superposition` — un nœud rendu HORS de `div.app`. 8 vues.
	 *   A-5  `accueilCourant` — l'entrée de rail courante. 1 vue (V-07).
	 *
	 * Et les deux convergences d'ARB-022, qui étend la preuve par le gel aux
	 * ressources partagées dont la maquette de référence est déclarée — pour le
	 * gabarit, V-37. UNE SEULE EST PORTÉE :
	 *
	 *   • `flex: none` là où le gabarit écrivait `flex: 0 0 auto` — PORTÉE.
	 *     `flex:none` figure à `ensembleDuGel('V-37')`, et les 45 états des
	 *     quatre vues livrées restent à zéro pixel.
	 *   • l'enveloppe de pictogramme de menu — NON PORTÉE. ARB-022 conditionne
	 *     l'extension de portée à un fichier de rattachement en écriture
	 *     humaine seule, qui n'existe pas encore. `BarreSuperieure.svelte` le
	 *     détaille, avec la mesure.
	 *
	 * QUATRIÈME AMENDEMENT — ARB-023, lot P-0b. L'arbitrage se nomme lui-même
	 * « troisième amendement BORNÉ » : c'est le troisième à ne porter que deux
	 * propriétés, après ARB-015 et ARB-019 ; celui d'ARB-021 en couvrait cinq
	 * d'un coup et n'était pas borné. Les deux décomptes sont justes et ne
	 * comptent pas la même chose — ici, c'est le quatrième passage.
	 *
	 * Deux propriétés, et rien d'autre : `classeEnveloppe` et `avantContenu`.
	 * Onze maquettes intercalent un conteneur entre `div.cadre` et `<main>`,
	 * là où le gabarit rendait
	 * `<main>` en enfant direct du cadre, sans autre frère que la barre :
	 *
	 *   V-27 à V-36  `div.console > (aside.nav2, main.travail#travail)`
	 *   V-41         `div.biblio  > (nav.sommaire-b#sommaire, main.corps-b#corps)`
	 *
	 * Ce sont des GRILLES — `.console` fait `244px minmax(0,1fr)` (`V-27:733`),
	 * `.biblio` fait `208px minmax(0,1fr)` (`V-41:1460`). Sans l'enveloppe, la
	 * découpe du contenu n'a pas les mêmes dimensions et les états divergent
	 * avant même la comparaison de pixels : mesuré au navigateur, `main.travail`
	 * de V-27 passe de 492 / 948 à 248 / 1180, et `main.corps-b` de V-41 de
	 * 456 / 984 à 248 / 1060 (boîtes de bordure, fenêtre 1440 × 900).
	 *
	 * Les DIX vues de console partagent EXACTEMENT la même enveloppe — vérifié
	 * attribut par attribut au navigateur : `div.console` sans autre attribut
	 * que sa classe, `aside.nav2[aria-label="Sections de la console"]`,
	 * `main.travail#travail`, deux enfants, et rien après `<main>`. Un
	 * amendement unique suffit donc, et c'était la question à trancher avant de
	 * l'écrire.
	 *
	 * POURQUOI UNE CLASSE ET UN SNIPPET, ET PAS DEUX SNIPPETS. La classe seule
	 * décide de la grille ; le nœud qui précède `<main>` change de balise d'une
	 * forme à l'autre (`aside` ici, `nav` là), porte son propre `aria-label`,
	 * son propre identifiant et son propre contenu. La première est une donnée,
	 * le second est du balisage de vue : les confondre obligerait le gabarit à
	 * connaître la navigation de la console.
	 *
	 * SANS `classeEnveloppe`, AUCUN CONTENEUR N'EST RENDU — pas un `div` sans
	 * classe. C'est ce qui laisse les vingt-trois autres vues à coquille, dont
	 * les quatre livrées, à zéro pixel d'écart.
	 *
	 * CINQUIÈME PASSAGE — `ECART-027` É-2, lot P-0c. UNE SEULE PROPRIÉTÉ :
	 * `apresContenu`, le nœud rendu APRÈS `<main>`.
	 *
	 * Le quatrième passage n'ouvrait qu'un nœud AVANT `<main>`, et seulement DANS
	 * l'enveloppe. Relevé géométrique des 41 maquettes, 265 états, conditions du
	 * banc, blocs hors produit retirés : sur les 34 vues à coquille, `div.cadre`
	 * a DEUX enfants partout — `header.barre`, puis `<main>` ou l'enveloppe —
	 * SAUF V-17 et V-18, qui en ont TROIS. Le troisième est `div.barre-etat`,
	 * classe seule, sans autre attribut, deux enfants, boîte `248, 837, 1192, 63`
	 * IDENTIQUE aux douze états des deux vues et aux quatre fenêtres du banc.
	 * C'est une barre COLLANTE — `position: sticky; bottom: 0` (`V-17:1099`) —
	 * qui occupe une place réelle : son absence n'est pas sans incidence.
	 *
	 * Un `div` nu ne porte NI RÔLE NI NOM ACCESSIBLE : il est invisible au
	 * niveau 1 et fatal au niveau 2, où la comparaison échoue avant de compter un
	 * pixel. Seule la géométrie le révèle — c'est pourquoi le relevé ci-dessus
	 * est géométrique, et pourquoi il fallait le refaire plutôt que le déduire.
	 *
	 * POURQUOI UN SNIPPET, ET UN SEUL. Balise, classe et contenu appartiennent à
	 * la vue : les deux barres d'état diffèrent au libellé près (`Métadonnées` /
	 * `Référence`, `Enregistrer` / `Enregistrer l'Opérationnel` — `V-17:1685`,
	 * `V-18:1976`). Le gabarit n'a donc rien à en connaître, pas même la classe —
	 * à la différence de `classeEnveloppe`, qui décide d'une grille.
	 *
	 * OÙ IL EST RENDU : après `<main>`, dans le parent immédiat de `<main>` —
	 * l'enveloppe quand la vue en déclare une, `div.cadre` sinon. AUCUNE des 41
	 * maquettes ne cumule enveloppe et nœud après `<main>` ; la règle est unique
	 * parce qu'un contrat à deux régimes serait un piège pour le lot suivant, non
	 * parce qu'un besoin l'exige.
	 *
	 * LE GABARIT EST REGELÉ. Un seul lot est encore autorisé à y revenir :
	 * T-106 / P-8, pour monter la palette V-09 sur le champ de recherche de la
	 * barre. Tout autre lot qui croit devoir y écrire déclare un écart.
	 *
	 * SIXIÈME PASSAGE — lot T-072, ET IL EST DÉCLARÉ COMME ÉCART (T-072 É-1).
	 * DEUX LIGNES, ET RIEN D'AUTRE : `droits` et `role`, déjà propriétés de ce
	 * gabarit et déjà posées en attributs de données sur `div.app`, sont PASSÉES
	 * à `<Rail>` et `<BarreSuperieure>`. Aucune propriété n'est créée, aucun nœud
	 * n'est ajouté, aucun rendu ne change tant que le droit est accordé. Le
	 * passage était inévitable : P-09 demande aux deux composants de ne pas
	 * ÉMETTRE les actions gouvernées, et un composant ne peut pas conditionner
	 * sur une donnée qu'il ne reçoit pas.
	 *
	 * Rendu SERVEUR, sans hydratation (ADR-001) : la navigation, le fil d'Ariane
	 * et les droits sont résolus avant production du HTML. Aucune minuterie n'est
	 * écrite : le squelette rend l'ÉTAT, jamais la transition (ARB-011).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (identique à l'octet au socle gelé, P-6.1) et de `src/vues/V-37.css`
	 * (identique à l'octet au second bloc `<style>` de la maquette gelée, P-6.3).
	 * Toute déclaration ajoutée ici retomberait sous P-1 en entier (ADR-002).
	 */
	import type { Snippet } from 'svelte';
	import type { Domaine, Note, Univers } from '../../../seeds/corpus';
	import {
		adresseDUnivers,
		adresseDeDomaine,
		adresseDeDossier,
		adresseDeNote,
		adresseDesNotesDuDomaine,
		adresseDesSignetsDuDomaine
	} from '$lib/rangement/adresses';
	import { railRendu, sectionsDuRail } from './arborescence';
	import { railAbregeRendu, sectionsAbregeesDuCorpus } from './arborescence-abregee';
	import BarreSuperieure from './BarreSuperieure.svelte';
	import Rail from './Rail.svelte';
	import PileDeNotifications from './PileDeNotifications.svelte';
	import type { Notification } from './notifications';
	import { getContext } from 'svelte';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from './identite';

	interface Compte {
		readonly nom: string;
		readonly initiales: string;
		readonly role: string;
		readonly domaine: string;
	}

	interface Proprietes {
		/** Le chemin de la page, du premier segment au titre courant. */
		fil: readonly string[];
		/** Le chemin de rangement mis en évidence dans le rail, du domaine au dernier dossier. */
		courant?: readonly string[];
		/** Les univers déclarés, dans l'ordre défini par l'administrateur. */
		univers: readonly Univers[];
		/** Les domaines accessibles à l'utilisateur. Vide : aucun périmètre. */
		domaines: readonly Domaine[];
		/** Les notes dont se déduit l'arborescence des dossiers. */
		notes: readonly Note[];
		compte: Compte;
		/** La version de l'instance, affichée au pied du rail. */
		version: string;
		/** Navigation ouverte, ou escamotée en mode concentration. */
		rail?: 'ouvert' | 'ferme';
		/** Profil : la section Gestion n'apparaît que pour l'administrateur. */
		role?: 'referent' | 'admin';
		/** Droits effectifs : en lecture seule, les actions d'écriture disparaissent. */
		droits?: 'ecriture' | 'lecture';
		/** Identité de la branche dont l'arborescence est en cours de chargement. */
		brancheEnChargement?: string | null;
		/** Notifications visibles à l'instant rendu — un état, jamais une minuterie. */
		notifications?: readonly Notification[];
		/** La vue courante, rendue dans la zone de contenu. */
		enfants?: Snippet;
		/** Contenu présenté par le catalogue V-37 — `data-contenu` de la maquette. */
		contenu?: 'bord' | 'lecture';
		/**
		 * La classe de `<main>`, propre à chaque vue (ARB-015). Absente, `<main>`
		 * est rendu sans attribut `class` — c'est le cas de V-23 et V-37, les deux
		 * seules maquettes à coquille qui n'en portent pas.
		 */
		classeContenu?: string;
		/**
		 * L'identifiant de `<main>`, et la cible du lien d'évitement PAR DÉFAUT.
		 * `contenu` pour vingt-trois maquettes, `travail` pour les dix vues de
		 * console, `corps` pour V-41 (ARB-015).
		 */
		idContenu?: string;
		/**
		 * La cible du lien d'évitement, SANS le croisillon — `resultats`,
		 * `article`, `redaction`… Absente, la cible est `idContenu` : c'est le
		 * cas des 22 maquettes à coquille où le lien vise bien `<main>`, dont
		 * les quatre livrées et les dix vues de console (ARB-019).
		 *
		 * Les douze autres visent une ancre INTÉRIEURE au contenu, relevée sur
		 * le gel : `resultats` (V-08), `liste` (V-12, V-21, V-22), `article`
		 * (V-14, V-15), `zone` (V-16), `redaction` (V-17, V-18), `liste-noeuds`
		 * (V-19), `adresse` (V-23), `rech` (V-26). V-41 n'en fait PAS partie :
		 * son `#corps` est l'identifiant de son propre `<main>`, elle n'amende
		 * donc que le libellé.
		 */
		cibleEvitement?: string;
		/**
		 * Le libellé du lien d'évitement. Absent, « Aller au contenu » — le
		 * texte de 23 des 34 maquettes à coquille (ARB-019).
		 *
		 * Les onze autres, relevées sur le gel : « Aller aux résultats »
		 * (V-08), « Aller à la liste » (V-12, V-22), « Aller à la comparaison »
		 * (V-16), « Aller à la rédaction » (V-17, V-18), « Aller à la liste des
		 * nœuds » (V-19), « Aller à l'arborescence » (V-21), « Aller au
		 * formulaire » (V-23), « Aller à la recherche » (V-26), « Aller à la
		 * bibliothèque » (V-41). V-14 et V-15 gardent le libellé par défaut
		 * tout en visant `article` : cible et libellé sont indépendants.
		 */
		libelleEvitement?: string;
		/**
		 * LA FORME DE COQUILLE que la vue porte (ARB-021, A-1). Les 34 maquettes
		 * à coquille en portent DEUX, et le gabarit n'en savait rendre qu'une.
		 *
		 * `complete` — 8 vues : V-07, V-14, V-27, V-37 à V-41. C'est le défaut,
		 * donc les quatre vues livrées ne changent pas d'un octet.
		 *
		 * `abregee` — 26 vues : V-08, V-10 à V-13, V-15 à V-26, V-28 à V-36.
		 * Barre sans les deux menus déroulants, rail sans pictogrammes ni
		 * `data-vers`, `Gestion` en `si-ecriture`, pas de `#rail-univers`, et une
		 * arborescence de quinze nœuds ÉCRITE AU BALISAGE que le corpus ne peut
		 * pas produire — `arborescence-abregee.ts` le démontre.
		 *
		 * En forme abrégée, `univers`, `domaines`, `notes` et
		 * `brancheEnChargement` ne servent PAS au rail : il ne se dérive pas du
		 * corpus. Ils restent exigés parce que la coquille est une seule
		 * interface, et parce que les vues abrégées les portent déjà.
		 */
		forme?: 'complete' | 'abregee';
		/**
		 * LES ATTRIBUTS DE DONNÉES que la vue pose sur `div.app` (ARB-021, A-2).
		 *
		 * 46 attributs sur les 27 vues du relevé, 26 noms distincts — 47 en
		 * comptant celui de V-37 elle-même, que ce lot pose aussi. RECOMPTÉ par
		 * l'instrument du relevé, qui donne 46 là où ARB-021 et
		 * `docs/releve-vues.md` §4 écrivent 47. Les noms — `data-activite`,
		 * `data-affichage`, `data-cas`, `data-degrade`, `data-dense`,
		 * `data-detail`, `data-donnees`, `data-droit`, `data-droits-vue`,
		 * `data-enveloppe`, `data-etape`, `data-etat`, `data-facettes`,
		 * `data-filtres`, `data-form`, `data-historique`, `data-meta`,
		 * `data-mode`, `data-numerote`, `data-onglet`, `data-reference`,
		 * `data-registre`, `data-trop`, `data-verrou`, `data-version`,
		 * `data-vue`.
		 *
		 * AUCUN N'EST DÉCORATIF : le relevé les répartit entre ceux qu'un
		 * sélecteur d'attribut de la feuille de la vue lit et ceux que lit son
		 * script de planche. Ils sont posés TELS QUELS, avec leur nom complet —
		 * le gabarit ne préfixe rien, pour qu'une vue ne puisse jamais poser un
		 * attribut que la maquette n'écrit pas.
		 *
		 * Ils ne peuvent pas écraser `data-rail`, `data-role`, `data-droits` ni
		 * `data-contenu`, qui sont des propriétés à part entière et sont écrits
		 * APRÈS l'étalement.
		 */
		donnees?: Record<string, string | undefined>;
		/**
		 * UNE SUPERPOSITION RENDUE HORS DE `div.app` (ARB-021, A-4), entre
		 * `div.app` et `div.notifs` — l'emplacement exact du gel.
		 *
		 * 8 vues sur les 103 nœuds que les 41 maquettes placent hors de
		 * `div.app` : ce sont les NEUF SEULS qui portent une boîte de rendu
		 * (`releve-etats.mjs --incidence`). `aside.tiroir-form#tiroir` de la
		 * console (V-27 à V-32), `aside.tiroir#tiroir` de V-15, et
		 * `dialog#dlg-signet` de V-23, ouvert à l'état par défaut. Les 94 autres
		 * — `<template>`, `<dialog>` fermé, bloc masqué — ne déplacent aucun
		 * pixel et n'entrent pas dans l'instantané ARIA : le gabarit ne leur
		 * ouvre rien, et ce n'est pas un oubli.
		 */
		superposition?: Snippet;
		/**
		 * L'entrée « Accueil » du rail EST la page courante (ARB-021, A-5).
		 * V-07 seule : `aria-current="page"`, et le `data-vers` propre du gel —
		 * « Vous êtes déjà sur l'accueil » (`V-07:1150`). La règle qui le rend
		 * visible est `V-07:512`, `.rail__lien[aria-current="page"]`.
		 */
		accueilCourant?: boolean;
		/**
		 * LA CLASSE DE L'ENVELOPPE intercalée entre `div.cadre` et `<main>`
		 * (ARB-023). Absente — les vingt-trois autres vues à coquille, dont les
		 * quatre livrées —, AUCUN conteneur n'est rendu et `<main>` reste enfant
		 * direct du cadre : c'est le rendu de T-101, préservé à l'octet.
		 *
		 * `console` pour V-27 à V-36, `biblio` pour V-41. Ce sont des grilles
		 * déclarées par la feuille de chaque vue (`V-27:733`, `V-41:1460`) ; le
		 * gabarit n'écrit aucune règle de style, il pose la classe qui les active.
		 */
		classeEnveloppe?: string;
		/**
		 * LE NŒUD RENDU DANS L'ENVELOPPE, AVANT `<main>` (ARB-023) — la première
		 * cellule de la grille.
		 *
		 * `aside.nav2[aria-label="Sections de la console"]` pour les dix vues de
		 * console, `nav.sommaire-b#sommaire[aria-label="Familles de composants"]`
		 * pour V-41. Balise, identifiant, libellé et contenu appartiennent à la
		 * vue : le gabarit ne connaît ni la navigation de la console ni le
		 * sommaire de la bibliothèque.
		 *
		 * N'a de sens qu'avec `classeEnveloppe` — sans enveloppe, il n'y a pas de
		 * place où le rendre, et il n'est pas rendu.
		 */
		avantContenu?: Snippet;
		/**
		 * LE NŒUD RENDU APRÈS `<main>` (`ECART-027` É-2), dans le parent immédiat
		 * de `<main>` : l'enveloppe si la vue en déclare une, `div.cadre` sinon.
		 *
		 * DEUX MAQUETTES sur 41 en portent un, et c'est le même : `div.barre-etat`
		 * de V-17 et V-18 — classe seule, deux enfants, `position: sticky; bottom: 0`
		 * (`V-17:1099`, `V-18:1099`), boîte `248, 837, 1192, 63` aux douze états des
		 * deux vues et aux quatre fenêtres. Leur contenu diffère : il appartient à la
		 * vue, et le gabarit ne pose ni balise ni classe.
		 *
		 * Absent — les 32 autres vues à coquille, dont les 19 vues à coquille déjà
		 * livrées —, RIEN n'est rendu après `<main>` : le rendu des quatre passages
		 * précédents, préservé à l'octet du DOM significatif.
		 */
		apresContenu?: Snippet;
	}

	const {
		fil,
		courant = [],
		univers,
		domaines,
		notes,
		compte,
		version,
		rail = 'ouvert',
		role = 'referent',
		droits,
		brancheEnChargement = null,
		notifications = [],
		enfants,
		contenu,
		classeContenu,
		idContenu = 'contenu',
		cibleEvitement,
		libelleEvitement = 'Aller au contenu',
		forme = 'complete',
		donnees,
		superposition,
		accueilCourant = false,
		classeEnveloppe,
		avantContenu,
		apresContenu
	}: Proprietes = $props();

	/**
	 * L'IDENTITÉ RÉELLE L'EMPORTE SUR CELLE DU GEL — `$lib/coquille/identite.ts`
	 * porte le contrat et le motif complet.
	 *
	 * En application, le gabarit racine pose le contexte et l'on affiche le
	 * compte connecté. Hors application — le rendu par défaut d'une vue, sans
	 * gabarit —, `getContext` rend `undefined` : la propriété s'applique, et le
	 * gel ne bouge pas d'un pixel.
	 *
	 * `roleEffectif` répare au passage l'entrée « Console d'administration » :
	 * `socle.css:397` cache `.si-admin` hors de `data-role="admin"`, et la valeur
	 * par défaut `'referent'` la rendait invisible à l'administrateur lui-même.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	/* L'ARBORESCENCE RÉELLE L'EMPORTE, MÊME MOTIF QUE L'IDENTITÉ. Hors
	   application — le rendu par défaut d'une vue —, le contexte est absent et
	   les propriétés du jeu de semence s'appliquent : le gel ne bouge pas. */
	/* LA PRÉSENCE DU CONTEXTE DÉCIDE, PAS SON CONTENU. Une première écriture
	   retombait sur les propriétés du gel quand la liste servie était VIDE : sur
	   une instance neuve — zéro univers, l'état normal au premier démarrage —,
	   le rail affichait donc l'arborescence des maquettes, et proposait des
	   adresses en 404. Une base vide n'est pas une absence de base : elle se
	   rend vide. */
	const universEffectif = $derived(identite === undefined ? univers : identite.univers);
	const domainesEffectifs = $derived(identite === undefined ? domaines : identite.domaines);
	const compteEffectif = $derived(identite?.compte ?? compte);
	const roleEffectif = $derived(
		identite === undefined ? role : identite.administrateur ? 'admin' : 'referent'
	);

	/**
	 * L'arborescence du rail — DEUX DÉRIVATIONS, et une seule sert.
	 *
	 * La forme complète dérive du corpus, la forme abrégée le contredit : elle
	 * est écrite au balisage du gel, et les deux arbres ne sont pas emboîtés
	 * (ARB-021, `arborescence-abregee.ts`). Chacune n'est calculée que pour la
	 * forme qui la porte.
	 */
	const sections = $derived(
		forme === 'abregee'
			? []
			: railRendu(
					sectionsDuRail(universEffectif, domainesEffectifs, notes),
					courant,
					brancheEnChargement
				)
	);
	/* LA FORME ABRÉGÉE SUIT LA BASE DÈS QU'ELLE EN A UNE. Elle portait l'arbre
	   du gel écrit en dur, sur vingt-deux vues : le rail y ignorait la base et
	   proposait des adresses qui rendent 404. Sans contexte — le rendu par défaut
	   d'une vue —, `railAbregeRendu()` retombe sur `SECTIONS_ABREGEES`, et le gel
	   ne bouge pas. */
	const sectionsAbregees = $derived(
		forme !== 'abregee'
			? []
			: identite === undefined
				? railAbregeRendu(courant)
				: railAbregeRendu(
						courant,
						sectionsAbregeesDuCorpus(sectionsDuRail(universEffectif, domainesEffectifs, notes))
					)
	);

	/**
	 * La cible effective du lien d'évitement : l'ancre déclarée par la vue, à
	 * défaut l'identifiant de `<main>` — le comportement de T-101b, préservé à
	 * l'octet pour les 22 vues concordantes.
	 */
	const cible = $derived(cibleEvitement ?? idContenu);

	/**
	 * LES ADRESSES DU FIL D'ARIANE — COMPOSÉES, PARCE QUE LE GEL N'EN DÉCLARE
	 * AUCUNE.
	 *
	 * Le script de la maquette pose `href="#"` sur chaque ancêtre et se contente
	 * d'annoncer « Retour vers « X » » (`V-37:3399-3415`) : il n'y a rien à lire,
	 * et `ARB-013` retire de toute façon les adresses de la comparaison de
	 * structure. Elles se composent donc ici, par la fabrique
	 * `$lib/rangement/adresses.ts`, et par elle seule.
	 *
	 * LA COQUILLE EST LE SEUL ENDROIT QUI PEUT LE FAIRE. La barre supérieure ne
	 * reçoit que des LIBELLÉS ; c'est `courant` — le chemin de rangement mis en
	 * évidence dans le rail, du domaine au dernier dossier — qui dit lesquels de
	 * ces libellés sont un univers, un domaine, un dossier. Un fil de rangement
	 * se reconnaît à ceci, et à rien d'autre : son TROISIÈME segment est le
	 * PREMIER de `courant`.
	 *
	 *   ['Accueil', univers, domaine, …dossiers, …feuilles]   courant = [domaine, …dossiers]
	 *   ['Accueil', 'Console', section]                        courant = []
	 *
	 * `Notes` et `Signets` sont des identifiants RÉSERVÉS sous un domaine
	 * (`docs/routes.md` §5.4) : un segment qui les porte n'est jamais un dossier,
	 * et son adresse est celle de la liste, pas celle d'un rangement.
	 *
	 * CE QUI RESTE SANS ADRESSE RESTE SANS ADRESSE. Un segment que ces règles ne
	 * résolvent pas — le titre d'une note dans le fil de V-18, par exemple, dont
	 * l'identifiant ne remonte pas jusqu'ici — garde le `href="#"` du gel. Une
	 * destination devinée serait pire qu'un lien qui ne mène nulle part.
	 */
	function adressesDuFil(
		segments: readonly string[],
		chemin: readonly string[],
		corpus: readonly Note[]
	): readonly (string | undefined)[] {
		const adresses: (string | undefined)[] = segments.map(() => undefined);
		/* Le dernier segment est la page courante : le gel le rend en `span`. */
		const dernier = segments.length - 1;
		if (segments[0] === 'Accueil' && dernier > 0) adresses[0] = '/';
		if (segments[1] === 'Console') {
			if (dernier > 1) adresses[1] = '/console';
			return adresses;
		}
		const universDuFil = segments[1];
		const domaineDuFil = segments[2];
		if (universDuFil === undefined || domaineDuFil === undefined) return adresses;
		if (chemin[0] !== domaineDuFil) return adresses;
		if (dernier > 1) adresses[1] = adresseDUnivers(universDuFil);
		if (dernier > 2) adresses[2] = adresseDeDomaine(universDuFil, domaineDuFil);
		/* `courant` va du domaine au dernier dossier : la profondeur de dossiers
		   est donc sa longueur moins un. Au-delà, le fil parle d'autre chose. */
		const profondeur = chemin.length - 1;
		for (let rang = 3; rang < dernier; rang += 1) {
			const segment = segments[rang];
			if (segment === 'Notes') {
				adresses[rang] = adresseDesNotesDuDomaine(universDuFil, domaineDuFil);
			} else if (segment === 'Signets') {
				adresses[rang] = adresseDesSignetsDuDomaine(universDuFil, domaineDuFil);
			} else if (rang - 3 < profondeur) {
				adresses[rang] = adresseDeDossier(universDuFil, domaineDuFil, segments.slice(3, rang + 1));
			} else if (rang - 3 === profondeur) {
				/*
				 * LE SEGMENT QUI SUIT LE DERNIER DOSSIER EST UN TITRE DE NOTE — c'est
				 * le fil de `/notes/{id}/operationnel` et de `/notes/{id}/relations`,
				 * où la note n'est plus la page courante mais son ancêtre.
				 *
				 * L'ADRESSE NE SE DÉRIVE PAS DU TITRE. L'identifiant lisible d'une
				 * note est PERSISTÉ, dérivé à la création et stable sous les
				 * renommages (`RG-M12-11`) : le recomposer donnerait une adresse
				 * fausse dès le premier titre corrigé. Il est donc LU sur la note du
				 * corpus que la coquille reçoit déjà pour construire son rail, et
				 * seulement si le rangement concorde. Sans note, pas d'adresse.
				 */
				const note = corpus.find(
					(candidate) =>
						candidate.titre === segment &&
						candidate.univers === universDuFil &&
						candidate.domaine === domaineDuFil
				);
				if (note !== undefined) adresses[rang] = adresseDeNote(note.id);
			}
		}
		return adresses;
	}

	const ciblesDuFil = $derived(adressesDuFil(fil, courant, notes));
</script>

<!--
	`<main>`, rendu une seule fois et posé à deux endroits : dans l'enveloppe
	quand la vue en déclare une, en enfant direct du cadre sinon (ARB-023). Un
	snippet plutôt que deux écritures — deux `<main>` recopiés divergeraient au
	premier amendement suivant.
-->
{#snippet zoneDeContenu()}<main class={classeContenu} id={idContenu}>
		{#if enfants}{@render enfants()}{/if}
	</main>{/snippet}

<a class="saut-contenu" href="#{cible}">{libelleEvitement}</a>

<div
	class="app"
	id="app"
	{...donnees}
	data-rail={rail}
	data-role={roleEffectif}
	data-droits={droits}
	data-contenu={contenu}
>
	<!--
		`droits` et `role` DESCENDENT jusqu'aux deux composants de coquille — lot
		T-072, P-09 / ARB-040. `div.app` les portait déjà en attributs de données,
		pour le socle ; le rail et la barre en ont besoin comme DONNÉES, parce que
		P-09 leur demande de ne pas ÉMETTRE ce que le socle se contentait de
		cacher. Aucun rendu ne change tant que le droit est là.
	-->
	<Rail
		{forme}
		{sections}
		{sectionsAbregees}
		{version}
		{accueilCourant}
		{droits}
		role={roleEffectif}
	/>

	<div class="cadre">
		<BarreSuperieure {fil} cibles={ciblesDuFil} {rail} compte={compteEffectif} {forme} {droits} />

		{#if classeEnveloppe}<div class={classeEnveloppe}>
				{#if avantContenu}{@render avantContenu()}{/if}
				{@render zoneDeContenu()}{#if apresContenu}{@render apresContenu()}{/if}
			</div>{:else}{@render zoneDeContenu()}{#if apresContenu}{@render apresContenu()}{/if}{/if}
	</div>
</div>

<!--
	La superposition rendue HORS de `div.app` (ARB-021, A-4). Sa place est celle
	du gel : après `div.app`, avant `div.notifs`.
-->
{#if superposition}{@render superposition()}{/if}

<PileDeNotifications {notifications} />
