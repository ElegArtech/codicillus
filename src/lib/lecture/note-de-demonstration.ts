/**
 * LA NOTE DE DÉMONSTRATION — les données que V-14 et V-15 partagent.
 *
 * Les deux maquettes gelées portent EXACTEMENT le même bloc de balisage, et
 * le disent elles-mêmes en tête de ce bloc :
 *
 *   « Partagé par la lecture interne (V-14) et l'historique (V-15) : les deux
 *     vues montrent la même note, jamais deux versions divergentes du
 *     markup. »   — `V-14:1415`, `V-15:1507`
 *
 * Mesuré : `V-14:1415-1755` et `V-15:1507-1847` sont identiques à l'octet,
 * 341 lignes. C'est ce constat, et lui seul, qui justifie un module partagé —
 * `NoteDeDemonstration.svelte` en est le rendu, ce fichier en est la matière.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI VIENT DU CORPUS, ET CE QUI VIENT DU GEL
 *
 * Le bloc partagé ne dérive RIEN de `window.CORPUS` : il est écrit au balisage
 * de bout en bout. Une seule chose y est calculée par la maquette — le
 * sommaire, construit à partir des titres du corps rédigé — et une seule est
 * réécrite par la planche de revue — le cartouche de fraîcheur.
 *
 * Ce module ne transcrit donc que ces deux-là. Le reste est du balisage, et
 * il est rendu tel quel par le composant, sans intermédiaire : le recopier ici
 * en données ne le rendrait ni plus vrai ni plus vérifiable.
 */
import {
	CORPUS,
	DATE_REFERENCE,
	MESURES_7J,
	type Note,
	type NomDAuteur
} from '../../../seeds/corpus';
import { segmentsDeDossier } from '../rangement/adresses';

/* ── Le sommaire ────────────────────────────────────────────────────────────
   `construireSommaire()` (`V-14:3901`, `V-15:2625`) relève les `h2[id]` et
   `h3[id]` du corps AFFICHÉ, dans l'ordre du document, et n'en retient rien
   d'autre : ni h1 — réservé au titre de la note —, ni h4 à h6.

     « Seuls les niveaux 2 et 3 alimentent le sommaire. »   — `V-14:1704`

   La numérotation ne porte que sur les niveaux 2, sur deux chiffres, et elle
   est conditionnée à `body[data-numerote] !== "non"` : ni V-14 ni V-15 ne
   posent cet attribut, les deux numérotent donc. (V-37 le pose, et c'est la
   seule maquette qui le fasse — `docs/releve-vues.md` §4.)

   CETTE LISTE DOIT SUIVRE LES TITRES DU CORPS. Elle les redit parce que le
   corps est du balisage figé dans le composant : un composant Svelte ne peut
   pas se relire lui-même comme le script de la maquette relit son DOM. Le
   couple est vérifié par le banc — un titre ajouté d'un côté et pas de
   l'autre fait diverger le niveau 1. */

/** Une entrée de sommaire : son niveau, l'ancre visée, son libellé. */
export interface EntreeDeSommaire {
	/** 2 ou 3 — la classe rendue est `n1` pour 2, `n2` pour 3. */
	readonly niveau: 2 | 3;
	/** L'identifiant du titre visé, sans croisillon. */
	readonly ancre: string;
	readonly libelle: string;
}

/** Les onze titres du registre Référence, dans l'ordre du document. */
export const SOMMAIRE_REFERENCE: readonly EntreeDeSommaire[] = [
	{ niveau: 2, ancre: 's-avant', libelle: 'Avant de commencer' },
	{ niveau: 3, ancre: 's-prerequis', libelle: 'Prérequis' },
	{ niveau: 3, ancre: 's-fenetre', libelle: "Fenêtre d'intervention" },
	{ niveau: 2, ancre: 's-choisir', libelle: 'Choisir la sauvegarde' },
	{ niveau: 2, ancre: 's-restaurer', libelle: 'Restaurer' },
	{ niveau: 3, ancre: 's-complete', libelle: 'Restauration complète' },
	{ niveau: 3, ancre: 's-instant', libelle: 'Restauration à un instant donné' },
	{ niveau: 2, ancre: 's-verifier', libelle: 'Vérifier le résultat' },
	{ niveau: 2, ancre: 's-echec', libelle: "En cas d'échec" },
	{ niveau: 2, ancre: 's-annexe', libelle: 'Annexe — conventions de rédaction' },
	{ niveau: 3, ancre: 's-n3', libelle: 'Niveau 3 — sous-partie' }
];

/** Une entrée telle qu'elle se rend : avec son numéro, s'il lui en revient un. */
export interface LigneDeSommaire extends EntreeDeSommaire {
	/** Deux chiffres pour un niveau 2, `null` pour un niveau 3. */
	readonly numero: string | null;
}

/**
 * Le sommaire rendu — numérotation comprise.
 *
 * `String(n).padStart(2, "0")` du gel, et le compteur n'avance que sur un
 * niveau 2.
 */
export function sommaireRendu(
	entrees: readonly EntreeDeSommaire[] = SOMMAIRE_REFERENCE
): readonly LigneDeSommaire[] {
	let n = 0;
	return entrees.map((e) => ({
		...e,
		numero: e.niveau === 2 ? String(++n).padStart(2, '0') : null
	}));
}

/* ── Le cartouche de contrôle ───────────────────────────────────────────────
   La planche de V-14 fait varier le niveau de fraîcheur du cartouche, et la
   maquette y attache, pour chacun des trois niveaux, l'auteur et la date du
   dernier contrôle : `niveaux` de `V-14:4008-4012`.

   CES TROIS ENTRÉES SONT DES DONNÉES DE PLANCHE, PAS DU CORPUS. Elles ne se
   déduisent d'aucune note : la note de démonstration `n-restaurer-pg` porte le
   seul niveau `frais`, et la planche montre à quoi ressemblerait SON cartouche
   si elle vieillissait. Les transcrire est le seul moyen de les rendre ; les
   inventer serait un comblement.

   CE QUI N'EST PAS TRANSCRIT, ET C'EST LE POINT : ni le libellé, ni le nombre
   de barres. Ils sortent de `$lib/fraicheur.ts`, la fabrique unique (P-01,
   ADR-005), à partir du niveau et de l'ancienneté de la date de contrôle. Le
   gel écrit « Vérifié il y a 12 jours », « Vérifié il y a 4 mois » et « Pas
   revu depuis 8 mois » ; la fabrique les redonne à partir de 12, 121 et 248
   jours — les anciennetés réelles des trois dates, comptées depuis
   `DATE_REFERENCE`. Aucun libellé n'est écrit à la main.

   LA DATE EST TRANSCRITE EN TOUTES LETTRES, et `$lib/dates.ts` n'est PAS
   employé : le gel écrit « 1er août 2026 », l'ordinal du premier du mois, que
   `Intl.DateTimeFormat` ne produit pas — il donne « 1 août 2026 ». Ajouter
   l'ordinal à `dates.ts` serait une décision de format prise en exécution,
   donc un défaut de contrat ; la divergence est déclarée plutôt que comblée. */

/** L'état de contrôle affiché par le cartouche, pour un niveau de la planche. */
export interface ControleDeNote {
	/** Qui a porté la dernière vérification. */
	readonly par: NomDAuteur;
	/** La date du dernier contrôle, forme machine — attribut `datetime`. */
	readonly iso: string;
	/** La même date en toutes lettres, telle que le gel l'écrit. */
	readonly jour: string;
	/** L'heure, affichée dans l'infobulle du `<time>`. */
	readonly heure: string;
	/**
	 * Ce que le gel ajoute après la date, séparateur compris — chaîne vide au
	 * niveau frais, qui n'ajoute rien.
	 */
	readonly suffixe: string;
	/**
	 * Le fragment mis en évidence — `<strong>` —, au seul niveau obsolète. Le
	 * gel y change de ton : « revue nécessaire » n'est pas une suggestion.
	 */
	readonly appui: string | null;
}

/** Les trois états de contrôle de la planche — `V-14:4008-4012`. */
export const CONTROLE_PAR_NIVEAU = {
	frais: {
		par: 'Karim Belhadj',
		iso: '2026-08-01',
		jour: '1er août 2026',
		heure: '09:14',
		suffixe: '',
		appui: null
	},
	vieil: {
		par: 'Sophie Nguyen',
		iso: '2026-04-14',
		jour: '14 avril 2026',
		heure: '11:02',
		suffixe: ' — une revue serait bienvenue',
		appui: null
	},
	obs: {
		par: 'Marc Ferreira',
		iso: '2025-12-08',
		jour: '8 décembre 2025',
		heure: '15:30',
		suffixe: ' — ',
		appui: 'revue nécessaire'
	}
} as const satisfies Record<string, ControleDeNote>;

const JOUR_EN_MS = 86_400_000;

/**
 * L'ancienneté d'une date, en jours pleins avant `DATE_REFERENCE`.
 *
 * C'est ce que le corpus appelle `jours` et ce que la fabrique de fraîcheur
 * attend. Les deux bornes sont des dates ISO sans heure, donc lues à minuit
 * UTC : la soustraction est exacte, sans dérive de fuseau.
 */
export function anciennete(iso: string): number {
	return Math.round((Date.parse(DATE_REFERENCE) - Date.parse(iso)) / JOUR_EN_MS);
}

/* ── Le rangement de la note ────────────────────────────────────────────────
   La ligne « Rangement » des métadonnées : univers, domaine, puis les
   dossiers, du plus général au plus précis. Elle est DÉDUITE de la note du
   corpus — `n-restaurer-pg` — et non recopiée : c'est le même chemin que le
   fil d'Ariane des deux vues, et il n'a aucune raison d'en diverger.

   POURQUOI ELLE EST ICI ET LE SÉPARATEUR AILLEURS. Le `›` qui sépare deux
   segments porte un style en ligne du gel — `color:var(--c-encre-4)` —, et un
   style en ligne n'est admis que dans un fichier RATTACHÉ à une maquette :
   par le nommage pour `src/vues/V-xx.svelte` (ARB-016), par déclaration
   humaine dans `verif/references/preuve-par-le-gel.json` pour une ressource
   partagée (ARB-022). `src/lib/lecture/` n'est ni l'un ni l'autre, et un agent
   d'exécution n'écrit jamais dans ce fichier de rattachement. Le séparateur
   est donc fourni par chaque vue, sous forme de fragment ; le CHEMIN, lui,
   reste ici, où il ne peut pas diverger. Écart remonté. */

/**
 * LA NOTE LUE PAR LES DEUX VUES — `n-restaurer-pg`, la note de démonstration
 * de tout le projet. Elle vient du corpus, pas d'une recopie : titre, type,
 * visibilité, auteur, étiquettes et consultations en sortent (P-02).
 */
export const NOTE: Note = (() => {
	const note = CORPUS.find((n) => n.id === 'n-restaurer-pg');
	if (!note) throw new Error('seeds/corpus.ts : la note « n-restaurer-pg » a disparu');
	return note;
})();

/** Le chemin de rangement d'une note, du plus haut au plus bas. */
export function rangementDe(note: Note): readonly string[] {
	return [note.univers, note.domaine, ...segmentsDeDossier(note.dossier)];
}

/** Le chemin de rangement de la note de démonstration. */
export const RANGEMENT: readonly string[] = rangementDe(NOTE);

/**
 * LES CONSULTATIONS RÉCENTES, et une contradiction déclarée.
 *
 * Le gel affiche « 412 consultations · 37 sur les 30 derniers jours ». Le
 * premier nombre est `NOTE.vues`. Le second est `MESURES_7J['n-restaurer-pg']`,
 * qui vaut bien 37 — mais la table de la semence se nomme « 7 j » là où la
 * maquette écrit « 30 derniers jours ». LES DEUX NOMMENT LA MÊME DONNÉE ET LA
 * DÉSIGNENT AUTREMENT ; c'est la semence ou le gel qui se trompe de fenêtre, et
 * ni l'un ni l'autre n'est du ressort de ce lot. Le chiffre est lu, la
 * contradiction est remontée.
 */
export function consultationsRecentes(note: Note): number {
	return MESURES_7J[note.id];
}

export const CONSULTATIONS_RECENTES: number = consultationsRecentes(NOTE);

/* ── La note réellement lue ─────────────────────────────────────────────────
   T-042. Le bloc partagé était, jusqu'à ce lot, la transcription de
   `n-restaurer-pg` ET RIEN D'AUTRE : `/notes/{identifiant}` servait donc le
   même article pour les 32 notes du corpus. Le chargeur, lui, rendait déjà la
   note réelle et son corps rendu — `src/lib/donnees/note.ts` —, et l'écart
   était déclaré au rapport de `T-033` faute d'une propriété pour les recevoir.

   C'est cette propriété. Elle est OPTIONNELLE, et son absence rend la
   transcription figée à l'identique : le banc ne bouge pas.

   LE CORPS EST RENDU PAR L'APPELANT, ET PAR `rendreDocument` SEUL. Cette
   interface porte du HTML DÉJÀ RENDU, jamais un document canonique : le rendu
   demande un résolveur de liens internes que seule la couche de données peut
   construire (ADR-004 — une seule implémentation, et
   `pnpm verif:convertisseur` compte les appelants). Une vue qui rendrait
   elle-même serait le second chemin que l'ADR interdit. */

/* ── Ce que la base porte, et que le gel écrivait à la main ─────────────────
   Les quatre descriptions ci-dessous sont les seules choses que le bloc
   partagé affichait SANS pouvoir les recevoir : le dernier contrôle, la
   dernière modification, la demande de révision courante et la mesure de
   consultation. Chacune existe en base — `verifications`, `notes.modifie_le`,
   les quatre colonnes `revision_*`, `consultations` —, aucune n'était lue.

   ELLES SONT TOUTES FAILLIBLES, ET C'EST LE POINT. Une note jamais vérifiée
   n'a pas de contrôle ; un journal de vérification peut porter une entrée
   anonymisée, donc sans nom (`RG-M15-02`) ; une note sans demande courante n'a
   pas de révision. `null` DIT CES ABSENCES et le bloc les rend en état neutre
   explicite (`RG-M18-03`) — jamais une valeur d'exemple (P-02). */

/** Un instant, dans les trois formes que le gel emploie côte à côte. */
export interface InstantAffiche {
	/** Forme machine — l'attribut `datetime` d'un `<time>`. */
	readonly iso: string;
	/** Date en toutes lettres — le texte du `<time>`. */
	readonly jour: string;
	/** Date et heure — l'infobulle du `<time>`. */
	readonly heureDite: string;
}

/**
 * LE DERNIER CONTRÔLE RÉELLEMENT PORTÉ PAR LA NOTE — `M06.2`.
 *
 * `par` vaut `null` quand le journal ne rattache l'entrée à aucun compte :
 * `verifications.compte_id` est effaçable (`on delete set null`) et l'entrée
 * survit à son auteur. Une entrée sans nom reste une vérification ; c'est
 * l'AUTEUR qui manque, pas l'attestation.
 */
export interface ControleReel {
	readonly par: string | null;
	readonly quand: InstantAffiche;
}

/** La demande de révision courante — `RG-M06-05`, `RG-M06-06`. */
export interface RevisionCourante {
	readonly par: string | null;
	readonly le: string;
	readonly commentaire: string | null;
}

/** La note affichée par le bloc partagé, et ses deux corps déjà rendus. */
export interface NoteAffichee {
	/** La note lue — celle que l'adresse désigne, jamais celle du gel. */
	readonly note: Note;
	/**
	 * Le corps du registre Référence, rendu par `rendreDocument`. `null` : la
	 * note ne porte pas ce registre — l'absence est dite, jamais comblée.
	 */
	readonly reference: string | null;
	/** Le corps du registre Opérationnel, rendu par `rendreDocument`, ou `null`. */
	readonly operationnel: string | null;
}

/**
 * LA NOTE TELLE QUE V-14 L'AFFICHE — l'identité et les corps, PLUS tout ce que
 * le bloc partagé écrivait à la main faute de le recevoir.
 *
 * ELLE ÉTEND `NoteAffichee` AU LIEU DE LA REMPLACER, et ce n'est pas un détail
 * de forme : `$lib/donnees/edition.ts` construit une `NoteAffichee` pour V-18,
 * l'éditeur de l'Opérationnel, qui n'a ni cartouche de contrôle, ni bandeaux,
 * ni métadonnées — lui imposer ces champs le ferait mentir sur ce qu'il rend.
 * V-15, de son côté, ne passe rien du tout et garde la transcription du gel.
 */
export interface LectureAffichee extends NoteAffichee {
	/**
	 * LE SOMMAIRE DU CORPS AFFICHÉ, relevé sur le DOCUMENT et non sur le rendu.
	 *
	 * Le gel le construit en relisant son propre DOM (`construireSommaire()`,
	 * `V-14:3901`) ; un composant Svelte ne peut pas se relire. La liste vient
	 * donc de `titres()` appliqué au document canonique, ce qui donne
	 * exactement la même matière : les `h2[id]` et `h3[id]`, dans l'ordre.
	 */
	readonly sommaire: readonly EntreeDeSommaire[];
	/** Le dernier contrôle. `null` : la note n'a jamais été vérifiée. */
	readonly controle: ControleReel | null;
	/**
	 * L'ANCIENNETÉ QUI A SERVI À RÉSOUDRE LE NIVEAU — jours écoulés depuis la
	 * dernière vérification, et à défaut depuis la dernière modification
	 * (`RG-M06-01`).
	 *
	 * C'est l'entrée de `libelleFraicheur()`, et c'est LA MÊME que celle du
	 * calcul du niveau : deux anciennetés distinctes feraient dire au libellé
	 * autre chose que ce que la jauge montre — l'écart exact que P-01 ferme.
	 */
	readonly joursDepuisControle: number;
	/** La dernière modification de la note — ligne « Rédaction ». */
	readonly modifiee: InstantAffiche;
	/** La dernière modification du corps Référence — bandeau de resynchronisation. */
	readonly referenceModifiee: InstantAffiche;
	/**
	 * Le corps Référence a été modifié APRÈS le corps Opérationnel : c'est
	 * l'état que le bandeau `bandeau--resync` signale. Faux quand la note ne
	 * porte pas d'Opérationnel — il n'y a alors rien à resynchroniser.
	 */
	readonly resync: boolean;
	/** La demande de révision courante. `null` : aucune n'est ouverte. */
	readonly revision: RevisionCourante | null;
	/**
	 * Les consultations des trente derniers jours, comptées au journal.
	 *
	 * `MESURES_7J` de la semence nomme « 7 j » ce que le gel écrit « 30
	 * derniers jours » (voir `consultationsRecentes` ci-dessus) : cette valeur
	 * ne vient pas de la table de semence, elle vient du JOURNAL, sur la
	 * fenêtre que le gel annonce.
	 */
	readonly consultations30j: number;
}
