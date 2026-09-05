/**
 * LE CYCLE DE VIVACITÉ D'UN REGISTRE — d'une ligne de `notes` vers `vivacite()`.
 *
 * `src/lib/fraicheur.ts` porte la FABRIQUE : elle sait tout dire d'un cycle —
 * l'état, les libellés, la frise, le rappel — et rien de la base. Ce module est
 * l'unique pont entre les deux : il prend les colonnes que `014` a posées et
 * rend le `CycleDeVivacite` d'un registre donné.
 *
 * IL EST L'UNIQUE CHEMIN, ET C'EST TOUT SON OBJET. Une route qui composerait
 * `{ verifiee, modifiee, validite }` à la main choisirait sa propre colonne de
 * repli, et deux écrans donneraient deux échéances pour une même note — le
 * défaut exact que `P-01` nomme. Le type `LigneDeCycles` est le contrat : un
 * appelant qui n'a pas projeté les colonnes ne compile pas.
 *
 * LES BASCULES AUTOMATIQUES SONT DÉRIVÉES, JAMAIS STOCKÉES. Une note passe
 * d'elle-même à « À vérifier » à son échéance, à « À revoir » quatorze jours
 * plus tard, à « Obsolète » au bout de quatre-vingt-dix. Aucune de ces trois
 * dates n'a de ligne en base : elles se calculent du couple (vérifiée,
 * validité), et les écrire exigerait un ordonnanceur qui réveille chaque note à
 * son échéance pour poser un fait que l'arithmétique donne déjà. Pire : une
 * ligne écrite hier survivrait à la vérification qui la dément.
 */
import type { Registre } from './note';
import { formaterDateFr } from '../dates';
import {
	ETATS_DE_VIVACITE,
	SEUILS_DE_VIVACITE,
	type CycleDeVivacite,
	type EtatDeVivacite,
	type SeuilsDeVivacite
} from '../fraicheur';

/**
 * LES COLONNES QU'UN CYCLE EXIGE — la projection minimale d'une ligne de note.
 *
 * Les noms sont ceux du schéma, sans traduction : un chargeur les projette tels
 * quels depuis `notes`, et la relecture voit d'un coup d'œil si la requête les
 * porte toutes. Les deux noms de compte, eux, viennent de jointures — ils sont
 * les seuls champs qui ne soient pas des colonnes de `notes`.
 */
export interface LigneDeCycles {
	/** La dernière modification de la note — le repli du calcul (`RG-M06-01`). */
	readonly modifieLe: Date;
	/** La modification du corps Opérationnel, ou `null` : le registre n'existe pas. */
	readonly corpsOperationnelModifieLe: Date | null;
	/** La vérification de la Référence. */
	readonly verifieLe: Date | null;
	/** La vérification de l'Opérationnel. */
	readonly verifieLeOperationnel: Date | null;
	readonly validiteReference: number;
	readonly validiteOperationnel: number;
	readonly revisionDemandee: boolean;
	/** Le registre que la demande VISE — une demande sur l'un ne pèse pas sur l'autre. */
	readonly revisionRegistre: Registre | null;
	/** Le nom du compte qui a demandé la révision, ou `null`. */
	readonly revisionPar: string | null;
	/** Le nom du dernier vérificateur de chaque registre, ou `null`. */
	readonly verifieParReference: string | null;
	readonly verifieParOperationnel: string | null;
}

/**
 * LE CYCLE D'UN REGISTRE, ou `null` QUAND LE REGISTRE N'EXISTE PAS.
 *
 * L'Opérationnel est optionnel (`RG-NOT-02`) : sans corps opérationnel, il n'y a
 * pas de cycle à montrer, et en inventer un afficherait un état pour un contenu
 * qui n'a jamais été écrit. `null` est l'état vide explicite ; l'écran y répond
 * par le geste qui le débloque — « Créer la version opérationnelle ».
 *
 * LE REPLI EST CELUI DE `RG-M06-01`, registre par registre : à défaut de
 * vérification, la Référence retombe sur la modification de la note, et
 * l'Opérationnel sur la modification de SON corps. Retomber sur `modifie_le`
 * pour l'Opérationnel ferait vieillir une procédure au rythme des renommages de
 * la note.
 */
export function cycleDuRegistre(ligne: LigneDeCycles, registre: Registre): CycleDeVivacite | null {
	/* La demande de révision ne pèse que sur le registre qu'elle vise. */
	const revisionPar =
		ligne.revisionDemandee && ligne.revisionRegistre === registre ? ligne.revisionPar : null;

	if (registre === 'operationnel') {
		if (ligne.corpsOperationnelModifieLe === null) return null;
		return {
			verifiee: ligne.verifieLeOperationnel,
			modifiee: ligne.corpsOperationnelModifieLe,
			validite: ligne.validiteOperationnel,
			par: ligne.verifieParOperationnel,
			revisionPar
		};
	}

	return {
		verifiee: ligne.verifieLe,
		modifiee: ligne.modifieLe,
		validite: ligne.validiteReference,
		par: ligne.verifieParReference,
		revisionPar
	};
}

/**
 * UNE BASCULE AUTOMATIQUE D'ÉTAT — un fait daté, dérivé, jamais stocké.
 *
 * C'est la forme que l'historique rend : un glyphe (par l'état), une date, un
 * titre, un détail. Le registre est porté par la bascule parce que les deux
 * cycles d'une note se lisent dans le même fil.
 */
export interface BasculeDeVivacite {
	readonly registre: Registre;
	/** L'état DANS LEQUEL la note est entrée. */
	readonly etat: EtatDeVivacite;
	/** Le jour où elle y est entrée. */
	readonly le: Date;
	/** « Passage automatique à « À vérifier » ». */
	readonly titre: string;
	/** « Échéance de la vérification du 14 août 2026 atteinte (validité : 21 jours). » */
	readonly detail: string;
}

const MILLISECONDES_PAR_JOUR = 86_400_000;

/** « 1 jour », « 21 jours » — l'accord, jamais le symbole. */
function enJours(n: number): string {
	return `${n} ${n > 1 ? 'jours' : 'jour'}`;
}

/**
 * LES BASCULES DÉJÀ SURVENUES d'un cycle, de la plus ancienne à la plus récente.
 *
 * Trois au plus, et dans cet ordre : l'échéance franchie fait « À vérifier », le
 * retard de `retardRevoir` fait « À revoir », celui de `retardObsolete` fait
 * « Obsolète ». Une bascule n'est rendue que si elle a EU LIEU — la fonction
 * décrit le passé, elle n'annonce pas ce qui vient (`vivacite().rappel` le fait,
 * et le dit d'une seule voix).
 *
 * LA DATE QU'ELLE PORTE ET LE JOUR OÙ ELLE DEVIENT VRAIE NE SONT PAS TOUJOURS LE
 * MÊME, ET C'EST VOULU. La première bascule est datée DE L'ÉCHÉANCE — c'est le
 * fait qu'elle nomme, « échéance atteinte », et c'est la date de la capture de
 * référence — mais elle n'apparaît qu'à partir du LENDEMAIN, parce qu'un reste
 * nul est encore « Bientôt » (`etatDeVivacite`, à la lettre de la spécification).
 * Sans cet écart d'un jour, l'historique aurait annoncé un passage que le badge
 * démentait le jour même. Les deux autres bascules tombent sur leur jour.
 *
 * UNE DEMANDE DE RÉVISION NE LES EFFACE PAS. Elle force « À revoir » à l'instant
 * où on regarde ; les échéances, elles, ont bien été franchies, et l'historique
 * ment s'il les retire. Le fil montre donc les deux, chacun à sa date.
 *
 * JAMAIS VÉRIFIÉ : le cycle court depuis la modification, et les bascules
 * courent avec lui — c'est le repli de `RG-M06-01`, et une note jamais vérifiée
 * finit bien par réclamer sa première vérification.
 */
export function basculesDUnCycle(
	cycle: CycleDeVivacite,
	registre: Registre,
	aujourdhui: Date,
	seuils: SeuilsDeVivacite = SEUILS_DE_VIVACITE
): readonly BasculeDeVivacite[] {
	const depart = new Date(cycle.verifiee ?? cycle.modifiee);
	if (Number.isNaN(depart.getTime())) return [];

	const echeance = depart.getTime() + cycle.validite * MILLISECONDES_PAR_JOUR;
	const dateDeDepart = formaterDateFr(depart);

	/* La vérification NOMMÉE dans le détail est celle du registre, jamais celle
	   de l'autre : la validité citée avec elle est la sienne aussi. */
	const origine = cycle.verifiee === null ? 'dernière modification du' : 'vérification du';

	/** `aPartirDe` : le premier instant où la bascule est VRAIE. `le` : ce qu'elle date. */
	const candidates: readonly (BasculeDeVivacite & { readonly aPartirDe: number })[] = [
		{
			registre,
			etat: 'averifier',
			le: new Date(echeance),
			aPartirDe: echeance + MILLISECONDES_PAR_JOUR,
			titre: `Passage automatique à « ${ETATS_DE_VIVACITE.averifier.libelle} »`,
			detail: `Échéance de la ${origine} ${dateDeDepart} atteinte (validité : ${enJours(cycle.validite)}).`
		},
		{
			registre,
			etat: 'arevoir',
			le: new Date(echeance + seuils.retardRevoir * MILLISECONDES_PAR_JOUR),
			aPartirDe: echeance + seuils.retardRevoir * MILLISECONDES_PAR_JOUR,
			titre: `Passage automatique à « ${ETATS_DE_VIVACITE.arevoir.libelle} »`,
			detail: `${enJours(seuils.retardRevoir)} de retard sur l’échéance, sans nouvelle vérification.`
		},
		{
			registre,
			etat: 'obsolete',
			le: new Date(echeance + seuils.retardObsolete * MILLISECONDES_PAR_JOUR),
			aPartirDe: echeance + seuils.retardObsolete * MILLISECONDES_PAR_JOUR,
			titre: `Passage automatique à « ${ETATS_DE_VIVACITE.obsolete.libelle} »`,
			detail: `${enJours(seuils.retardObsolete)} de retard sur l’échéance : la note n’est plus considérée comme exploitable.`
		}
	];

	return candidates
		.filter((b) => b.aPartirDe <= aujourdhui.getTime())
		.map(({ registre: r, etat, le, titre, detail }) => ({ registre: r, etat, le, titre, detail }));
}

/**
 * LES BASCULES DES DEUX REGISTRES d'une note, du plus récent au plus ancien —
 * l'ordre du fil d'historique. L'Opérationnel absent n'en produit aucune : son
 * cycle n'existe pas.
 */
export function basculesDUneNote(
	ligne: LigneDeCycles,
	aujourdhui: Date,
	seuils: SeuilsDeVivacite = SEUILS_DE_VIVACITE
): readonly BasculeDeVivacite[] {
	const registres: readonly Registre[] = ['reference', 'operationnel'];
	return registres
		.flatMap((registre) => {
			const cycle = cycleDuRegistre(ligne, registre);
			return cycle === null ? [] : basculesDUnCycle(cycle, registre, aujourdhui, seuils);
		})
		.sort((a, b) => b.le.getTime() - a.le.getTime());
}
