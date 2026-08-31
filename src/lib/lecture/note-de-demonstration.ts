/**
 * Le bloc d'article que V-14 et V-15 partagent — ses FORMES, plus aucune donnée. Les deux
 * maquettes portent exactement le même bloc de balisage et le disent : « les deux vues
 * montrent la même note, jamais deux versions divergentes du markup ». Mesuré : 341 lignes
 * identiques à l'octet.
 *
 * CE QU'IL NE PORTE PLUS : la note du jeu de démonstration, son ancienneté et ses
 * consultations — le jeu descendait dans le produit par ce fichier. Son seul import du jeu est
 * un import de TYPE.
 */
import type { Note } from '../../../seeds/corpus';
import { segmentsDeDossier } from '../rangement/adresses';

/* LE SOMMAIRE. `construireSommaire()` relève les `h2[id]` et `h3[id]` du corps
   AFFICHÉ, dans l'ordre du document, et rien d'autre : « seuls les niveaux 2 et 3
   alimentent le sommaire ». La numérotation ne porte que sur les niveaux 2, sur deux
   chiffres.

   CETTE LISTE DOIT SUIVRE LES TITRES DU CORPS : elle les redit parce que le corps est
   du balisage figé dans le composant, et qu'un composant Svelte ne peut pas se relire
   lui-même comme le script de la maquette relit son DOM. */

export interface EntreeDeSommaire {
	/** 2 ou 3 — la classe rendue est `n1` pour 2, `n2` pour 3. */
	readonly niveau: 2 | 3;
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

/* LA PROSE DU CARTOUCHE DE CONTRÔLE. Il dit qui a vérifié, quand, et — aux deux
   niveaux qui ne sont plus frais — ce qu'il faudrait en faire. Les deux premières
   viennent du journal ; la troisième ne se déduit d'aucune note, c'est la mise en
   garde que le gel attache au NIVEAU (`V-14:4008-4012`).

   Ni le libellé, ni le nombre de barres ne sont transcrits : ils sortent de
   `$lib/fraicheur.ts`, la fabrique unique. */

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

/* LE RANGEMENT DE LA NOTE — univers, domaine, puis les dossiers. Il est DÉDUIT de la
   note, non recopié : c'est le même chemin que le fil d'Ariane des deux vues.

   POURQUOI LE SÉPARATEUR EST AILLEURS : le `›` porte un style en ligne du gel, et un
   style en ligne n'est admis que dans un fichier RATTACHÉ à une maquette.
   `src/lib/lecture/` ne l'est pas. Le séparateur est donc fourni par chaque vue ; le
   CHEMIN reste ici, où il ne peut pas diverger. */

export function rangementDe(note: Note): readonly string[] {
	return [note.univers, note.domaine, ...segmentsDeDossier(note.dossier)];
}

/* LA NOTE RÉELLEMENT LUE. Le bloc partagé était la transcription d'une seule note du
   jeu : `/notes/{identifiant}` servait donc le même article pour les 32 notes du
   corpus. La propriété est OPTIONNELLE, et son absence rend la transcription figée à
   l'identique.

   LE CORPS EST RENDU PAR L'APPELANT, ET PAR `rendreDocument` SEUL : cette interface
   porte du HTML DÉJÀ RENDU, jamais un document canonique — le rendu demande un
   résolveur de liens internes que seule la couche de données peut construire, et une
   vue qui rendrait elle-même serait le second chemin qu'`ADR-004` interdit. */

/* CE QUE LA BASE PORTE, ET QUE LE GEL ÉCRIVAIT À LA MAIN : le dernier contrôle, la
   dernière modification, la demande de révision courante et la mesure de
   consultation. Chacune existe en base, aucune n'était lue.

   ELLES SONT TOUTES FAILLIBLES, ET C'EST LE POINT : `null` DIT ces absences et le bloc
   les rend en état neutre explicite (`RG-M18-03`), jamais par une valeur d'exemple. */

export interface InstantAffiche {
	/** Forme machine — l'attribut `datetime` d'un `<time>`. */
	readonly iso: string;
	/** Date en toutes lettres — le texte du `<time>`. */
	readonly jour: string;
	/** Date et heure — l'infobulle du `<time>`. */
	readonly heureDite: string;
}

/**
 * Le dernier contrôle réellement porté par la note — `M06.2`. `par` vaut `null` quand
 * le journal ne rattache l'entrée à aucun compte : l'entrée survit à son auteur, et
 * c'est l'AUTEUR qui manque, pas l'attestation.
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

export interface NoteAffichee {
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
 * La note telle que V-14 l'affiche — l'identité, les corps, et tout ce que le bloc partagé
 * écrivait à la main faute de le recevoir. ELLE ÉTEND `NoteAffichee` AU LIEU DE LA REMPLACER :
 * V-18 construit une `NoteAffichee` sans cartouche, sans bandeaux ni métadonnées.
 */
export interface LectureAffichee extends NoteAffichee {
	/**
	 * Le sommaire du corps affiché, relevé sur le DOCUMENT et non sur le rendu : le gel
	 * le construit en relisant son propre DOM, et un composant Svelte ne peut pas se
	 * relire. `titres()` appliqué au document donne exactement la même matière.
	 */
	readonly sommaire: readonly EntreeDeSommaire[];
	/** Le dernier contrôle. `null` : la note n'a jamais été vérifiée. */
	readonly controle: ControleReel | null;
	/**
	 * L'ancienneté qui a servi à résoudre le niveau — jours depuis la dernière
	 * vérification, à défaut depuis la modification (`RG-M06-01`). C'est LA MÊME que
	 * celle du calcul du niveau : deux anciennetés distinctes feraient dire au libellé
	 * autre chose que ce que la jauge montre.
	 */
	readonly joursDepuisControle: number;
	/** La dernière modification de la note — ligne « Rédaction ». */
	readonly modifiee: InstantAffiche;
	readonly referenceModifiee: InstantAffiche;
	/**
	 * Le corps Référence a été modifié APRÈS le corps Opérationnel — l'état que le
	 * bandeau signale. Faux quand la note ne porte pas d'Opérationnel.
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
	 * Le cumul de toute la vie de la note, LU APRÈS que l'ouverture courante a été comptée.
	 *
	 * Il était pris sur `Note.vues`, que la couche de lecture projette AVANT l'écriture du
	 * journal : la page affichait un total INFÉRIEUR d'une unité à sa propre fenêtre de trente
	 * jours. LE REMÈDE N'EST PAS DE DÉPLACER L'ÉCRITURE — elle doit rester APRÈS la résolution
	 * d'accès (`RG-ACC-04`). C'est la LECTURE qui descend.
	 *
	 * LA COLONNE RESTE LA SEULE MÉMOIRE DU CUMUL : un corpus semé ou une archive réimportée
	 * portent un compteur sans aucune ligne de journal.
	 */
	readonly consultationsTotal: number;
}
