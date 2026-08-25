/**
 * LE BLOC D'ARTICLE QUE V-14 ET V-15 PARTAGENT — ses FORMES, plus aucune donnée.
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
 * CE QU'IL NE PORTE PLUS, ET C'ÉTAIT LE MOTIF
 *
 * Ce module servait `NOTE` — `CORPUS.find(n => n.id === 'n-restaurer-pg')`, LEVÉE
 * COMPRISE si la note disparaissait du jeu —, l'ancienneté comptée depuis la
 * `DATE_REFERENCE` du jeu, et les consultations de sa table de mesures. Trois
 * vues et un chargeur de route l'importaient : le jeu de démonstration
 * descendait dans le produit par ce fichier, sans qu'une seule ligne de
 * `src/vues/` ne soit fautive.
 *
 * Il ne porte plus que des FORMES — les interfaces que le chargeur remplit —
 * et deux fonctions pures. Son seul import du jeu est un import de TYPE.
 */
import type { Note } from '../../../seeds/corpus';
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
export function sommaireRendu(entrees: readonly EntreeDeSommaire[]): readonly LigneDeSommaire[] {
	let n = 0;
	return entrees.map((e) => ({
		...e,
		numero: e.niveau === 2 ? String(++n).padStart(2, '0') : null
	}));
}

/* ── La prose du cartouche de contrôle ──────────────────────────────────────
   Le cartouche dit trois choses : QUI a vérifié, QUAND, et — aux deux niveaux
   qui ne sont plus frais — ce qu'il FAUDRAIT en faire. Les deux premières
   viennent du journal des vérifications, servi par le chargeur. La troisième ne
   se déduit d'aucune note : c'est la mise en garde que le gel attache au
   NIVEAU, et à lui seul (`V-14:4008-4012`).

   CE QUI A DISPARU D'ICI, ET POURQUOI. La table portait aussi un vérificateur
   et une date par niveau — « Karim Belhadj », « 1er août 2026 » — que le bloc
   partagé servait quand aucune note affichée ne lui était passée. Ce repli
   n'existe plus : `NoteDeDemonstration.svelte` EXIGE désormais la note
   affichée, et les deux vues qui le montent la passent toutes les deux. Un
   cartouche ne peut donc plus nommer un vérificateur du jeu de démonstration.

   CE QUI N'EST TOUJOURS PAS TRANSCRIT, ET C'EST LE POINT : ni le libellé, ni le
   nombre de barres. Ils sortent de `$lib/fraicheur.ts`, la fabrique unique
   (P-01, ADR-005), à partir du niveau et de l'ancienneté. */

/** Ce que le cartouche ajoute après la date, au seul titre du NIVEAU. */
export interface ProseDeControle {
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

/** Les trois mises en garde de niveau — `V-14:4008-4012`. */
export const PROSE_PAR_NIVEAU = {
	frais: { suffixe: '', appui: null },
	vieil: { suffixe: ' — une revue serait bienvenue', appui: null },
	obs: { suffixe: ' — ', appui: 'revue nécessaire' }
} as const satisfies Record<string, ProseDeControle>;

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

/** Le chemin de rangement d'une note, du plus haut au plus bas. */
export function rangementDe(note: Note): readonly string[] {
	return [note.univers, note.domaine, ...segmentsDeDossier(note.dossier)];
}

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
	 * Les consultations des trente derniers jours, comptées au JOURNAL, sur la
	 * fenêtre que le gel annonce.
	 */
	readonly consultations30j: number;
	/**
	 * LE CUMUL DE TOUTE LA VIE DE LA NOTE — `notes.compteur_de_consultations`,
	 * ET IL EST LU APRÈS QUE L'OUVERTURE COURANTE A ÉTÉ COMPTÉE.
	 *
	 * Il était pris sur `Note.vues`, que la couche de lecture projette AVANT
	 * l'écriture de `journaliserUneConsultation()` : la page affichait donc un
	 * total INFÉRIEUR d'une unité à sa propre fenêtre de trente jours — « 0
	 * consultations · 1 sur les 30 derniers jours », arithmétiquement
	 * impossible.
	 *
	 * LE REMÈDE N'EST PAS DE DÉPLACER L'ÉCRITURE. Elle doit rester APRÈS la
	 * résolution d'accès : refus et inexistence rendent la même réponse, y
	 * compris en temps (`RG-ACC-04`), et compter avant la résolution
	 * compterait les refus et les notes absentes. C'est la LECTURE qui
	 * descend, dans le complément de lecture, qui s'exécute déjà après
	 * l'écriture et interroge déjà `notes` sur le même identifiant.
	 *
	 * LA COLONNE RESTE LA SEULE MÉMOIRE DU CUMUL : rien n'insère dans
	 * `consultations` hors de `$lib/donnees/consultation.ts`, un corpus semé
	 * ou une archive réimportée portent donc un compteur sans aucune ligne de
	 * journal. Dériver le total du journal les remettrait tous à zéro.
	 */
	readonly consultationsTotal: number;
}
