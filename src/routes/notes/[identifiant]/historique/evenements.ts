/**
 * LE FIL D'HISTORIQUE D'UNE NOTE — les faits datés, rassemblés en un seul fil.
 *
 * Cinq sources, et pas une de plus : la création de la note, les versions du
 * contenu, les vérifications, les bascules automatiques de vivacité, la demande
 * de révision en cours. Une sixième s'y ajoute quand la note porte un registre
 * Opérationnel : l'écriture de son corps, qui démarre son cycle propre.
 *
 * AUCUN DE CES FAITS N'EST INVENTÉ, ET AUCUN N'EST STOCKÉ DEUX FOIS. Les
 * bascules sont DÉRIVÉES par `basculesDUneNote()` — c'est son objet, et rien ici
 * ne les recalcule. Les états viennent de `ETATS_DE_VIVACITE`, jamais d'une
 * couleur écrite à l'écran.
 *
 * CE QUE LA BASE NE PORTE PAS N'EST PAS AFFICHÉ. Il n'existe ni date de création
 * du registre Opérationnel — `corps_operationnel_modifie_le` date la DERNIÈRE
 * écriture, et l'événement le dit ainsi —, ni historique des demandes de
 * révision : la table ne garde que la demande EN COURS, donc une levée passée
 * n'a laissé aucune trace et le fil ne prétend pas le contraire.
 */
import type { Registre } from '../../../../lib/donnees/note';
import type { BasculeDeVivacite } from '../../../../lib/donnees/vivacite';
import type { EtatDeVivacite } from '../../../../lib/fraicheur';
import { formaterDateFr } from '../../../../lib/dates';
import { accord } from '../../../../lib/vocabulaire';

/** Le filtre d'onglet : les deux registres, ou l'un des deux. */
export type FiltreDeRegistre = 'tous' | Registre;

/** `?registre=` de l'adresse. Toute autre valeur vaut « Tous ». */
export function filtreDemande(parametre: string | null): FiltreDeRegistre {
	return parametre === 'reference' || parametre === 'operationnel' ? parametre : 'tous';
}

/** `?comparer=` — le numéro de version dont le panneau est ouvert, ou `null`. */
export function comparaisonDemandee(parametre: string | null): number | null {
	if (parametre === null || !/^\d+$/.test(parametre)) return null;
	const numero = Number(parametre);
	return Number.isSafeInteger(numero) && numero >= 1 ? numero : null;
}

/** `?restaurer=` — la version dont la confirmation est dépliée, ou `null`. */
export function restaurationDemandee(parametre: string | null): number | null {
	return comparaisonDemandee(parametre);
}

/**
 * UN ÉVÉNEMENT DU FIL, tel que le chargeur le construit. `quand` sert à trier et
 * ne sort pas d'ici : la vue reçoit une date déjà formatée.
 */
export interface EvenementConstruit {
	readonly quand: Date;
	/**
	 * Le départage à date égale, du plus fort au plus faible. Une vérification
	 * paraît au-dessus de la création du même jour, une version au-dessus des
	 * deux : c'est l'ordre de la capture de référence.
	 */
	readonly rang: number;
	/**
	 * LES REGISTRES QUE L'ÉVÉNEMENT TOUCHE. Une version en touche DEUX quand elle
	 * a capturé les deux corps — la table `versions` capture les deux à la fois,
	 * elle n'est pas par registre —, et l'onglet Opérationnel doit alors la voir.
	 */
	readonly registres: readonly Registre[];
	/** L'état de vivacité atteint, ou `null` : l'événement n'en change aucun. */
	readonly etat: EtatDeVivacite | null;
	readonly titre: string;
	readonly detail: string;
	/** Le numéro de la version, pour les seuls événements de version. */
	readonly numero: number | null;
}

const MILLISECONDES_PAR_JOUR = 86_400_000;

/** « 1 jour », « 21 jours » — l'unité s'accorde. */
function enJours(n: number): string {
	return `${n} ${accord(n, 'jour')}`;
}

/**
 * L'ANCIENNETÉ EN CLAIR — « aujourd'hui », « hier », « il y a 4 jours »,
 * « il y a 7 mois », « il y a 2 ans ». C'est la ligne « Dernière modification »
 * de l'en-tête, et elle vit ICI pour être éprouvée sans monter un écran.
 *
 * LA PARENTHÈSE DE « an(s) » N'EXISTE PAS : `accord()` est fait exactement pour
 * ça. « mois » ne bouge pas, il est invariable.
 */
export function ancienneteEnClair(quand: Date, maintenant: Date): string {
	const jours = Math.floor((maintenant.getTime() - quand.getTime()) / MILLISECONDES_PAR_JOUR);
	if (jours <= 0) return "aujourd'hui";
	if (jours === 1) return 'hier';
	if (jours < 31) return `il y a ${jours} jours`;
	const mois = Math.round(jours / 30);
	if (mois < 12) return `il y a ${mois} mois`;
	const ans = Math.round(jours / 365);
	return `il y a ${ans} ${accord(ans, 'an')}`;
}

/** Le libellé mono d'un événement : les registres qu'il touche, en clair. */
export function libelleDeRegistres(registres: readonly Registre[]): string {
	const noms = registres.map((r) => (r === 'operationnel' ? 'Opérationnel' : 'Référence'));
	return noms.join(' + ');
}

/** La ligne de création de la note — le seul événement qu'une note porte toujours. */
export function evenementDeCreation(entree: {
	readonly creeLe: Date;
	readonly auteur: string | null;
	readonly univers: string;
	readonly domaine: string;
}): EvenementConstruit {
	const par = entree.auteur === null ? '' : ` par ${entree.auteur}`;
	return {
		quand: entree.creeLe,
		rang: 0,
		registres: ['reference'],
		etat: null,
		titre: 'Création de la note',
		detail: `Rédigée${par} dans ${entree.univers + ' › ' + entree.domaine}.`,
		numero: null
	};
}

/** Une ligne de `versions`, jointe à son auteur — ce que le fil en lit. */
export interface LigneDeVersionDuFil {
	readonly numero: number;
	readonly le: Date;
	readonly auteur: string | null;
	readonly resume: string;
	readonly ajout: number;
	readonly retrait: number;
	/** Le corps Opérationnel capturé, ou `null` : la version ne touche que la Référence. */
	readonly aUnOperationnel: boolean;
	/**
	 * CETTE VERSION EST LA CRÉATION DE LA NOTE. Le premier enregistrement d'une
	 * note capture sa première version le jour même : les deux faits n'en font
	 * qu'un, et le fil ne les répète pas. Le rangement est alors dit à la place
	 * de la mesure de lignes, qui ne veut rien dire sur un texte parti de rien.
	 */
	readonly creationDeLaNote?: { readonly univers: string; readonly domaine: string };
}

export function evenementDeVersion(ligne: LigneDeVersionDuFil): EvenementConstruit {
	const registres: readonly Registre[] = ligne.aUnOperationnel
		? ['reference', 'operationnel']
		: ['reference'];
	const mesure =
		`${ligne.ajout} ${accord(ligne.ajout, 'ligne ajoutée', 'lignes ajoutées')}, ` +
		`${ligne.retrait} ${accord(ligne.retrait, 'retirée')}.`;
	const resume = ligne.resume.trim();
	const creation = ligne.creationDeLaNote;
	const par = ligne.auteur === null ? '' : ` par ${ligne.auteur}`;
	return {
		quand: ligne.le,
		/* La création reste sous les autres événements du même jour : elle les
		   précède toujours dans les faits. */
		rang: creation === undefined ? 3 : 0,
		registres,
		etat: null,
		titre: creation === undefined ? `Contenu modifié${par}` : 'Création de la note',
		detail:
			creation === undefined
				? resume === ''
					? mesure
					: `${resume} ${mesure}`
				: `Rédigée${par} dans ${creation.univers + ' › ' + creation.domaine}.`,
		numero: ligne.numero
	};
}

/** Une ligne de `verifications`, jointe à son compte. */
export interface LigneDeVerificationDuFil {
	readonly le: Date;
	readonly par: string | null;
	readonly registre: Registre;
	/** La validité EN VIGUEUR pour ce registre — celle que la note porte aujourd'hui. */
	readonly validite: number;
	/**
	 * CETTE VÉRIFICATION EST CELLE QUI A OUVERT LE REGISTRE. Vrai quand le corps
	 * du registre a été écrit LE MÊME JOUR que cette vérification, et qu'aucune
	 * autre ne la précède : c'est le seul rapprochement que la base autorise, et
	 * il évite deux lignes — « corps enregistré » puis « vérifiée » — pour un
	 * unique geste. Faux, les deux faits sont bien distincts et se disent chacun.
	 */
	readonly ouvreLeRegistre?: boolean;
}

/**
 * Une vérification remet le registre à « À jour » et relance son cycle.
 *
 * L'ÉCHÉANCE ANNONCÉE EST CALCULÉE AVEC LA VALIDITÉ D'AUJOURD'HUI, et c'est le
 * seul choix honnête possible : la validité n'est pas capturée à la
 * vérification, la base n'en garde qu'une valeur courante par registre.
 */
export function evenementDeVerification(ligne: LigneDeVerificationDuFil): EvenementConstruit {
	const echeance = new Date(ligne.le.getTime() + ligne.validite * MILLISECONDES_PAR_JOUR);
	const nom = ligne.registre === 'operationnel' ? 'Registre Opérationnel' : 'Registre Référence';
	const par = ligne.par === null ? '' : ` par ${ligne.par}`;
	const ouvre = ligne.ouvreLeRegistre === true;
	return {
		quand: ligne.le,
		rang: 2,
		registres: [ligne.registre],
		etat: 'ajour',
		titre: ouvre ? `${nom} créé et vérifié` : `Vérifiée${par}`,
		detail: ouvre
			? `Enregistré${par === '' ? '' : par}. Il démarre son propre cycle : validité de ` +
				`${enJours(ligne.validite)}, échéance le ${formaterDateFr(echeance)}.`
			: `Durée de validité : ${enJours(ligne.validite)}. Échéance le ${formaterDateFr(echeance)}.`,
		numero: null
	};
}

/** Une bascule automatique, dans la forme du fil. Rien n'est recalculé ici. */
export function evenementDeBascule(bascule: BasculeDeVivacite): EvenementConstruit {
	return {
		quand: bascule.le,
		rang: 1,
		registres: [bascule.registre],
		etat: bascule.etat,
		titre: bascule.titre,
		detail: bascule.detail,
		numero: null
	};
}

/**
 * LA DEMANDE DE RÉVISION EN COURS — et elle seule. La note ne garde qu'un
 * demandeur, une date, un commentaire et un registre : les demandes levées n'ont
 * laissé aucune ligne, et le fil ne les invente pas.
 */
export function evenementDeRevision(entree: {
	readonly le: Date;
	readonly par: string | null;
	readonly registre: Registre;
	readonly commentaire: string | null;
}): EvenementConstruit {
	const commentaire = (entree.commentaire ?? '').trim();
	return {
		quand: entree.le,
		rang: 2,
		registres: [entree.registre],
		etat: 'arevoir',
		titre: entree.par === null ? 'Révision demandée' : `Révision demandée par ${entree.par}`,
		detail:
			commentaire === ''
				? 'Le registre reste « À revoir » jusqu’à la prochaine vérification.'
				: `${commentaire} Le registre reste « À revoir » jusqu’à la prochaine vérification.`,
		numero: null
	};
}

/**
 * L'ÉCRITURE DU CORPS OPÉRATIONNEL — l'événement qui dit que ce registre existe
 * et qu'il vit son propre cycle.
 *
 * IL EST DATÉ DE LA DERNIÈRE ÉCRITURE, PARCE QUE C'EST LA SEULE DATE QUE LA BASE
 * PORTE : `corps_operationnel_modifie_le`. Aucune colonne ne date la création du
 * registre, et l'inventer donnerait une ligne que la prochaine modification
 * démentirait.
 */
export function evenementDuRegistreOperationnel(entree: {
	readonly le: Date;
	readonly validite: number;
}): EvenementConstruit {
	return {
		quand: entree.le,
		rang: 2,
		registres: ['operationnel'],
		etat: null,
		titre: 'Registre Opérationnel enregistré',
		detail:
			`Dernière écriture du corps Opérationnel. Ce registre suit son propre cycle de vivacité ` +
			`(validité : ${enJours(entree.validite)}).`,
		numero: null
	};
}

/**
 * LE FIL, DU PLUS RÉCENT AU PLUS ANCIEN. À date égale, `rang` départage — sans
 * lui, deux événements du même jour s'ordonnaient au hasard de la lecture.
 */
export function filTrie(evenements: readonly EvenementConstruit[]): readonly EvenementConstruit[] {
	return [...evenements].sort((a, b) => b.quand.getTime() - a.quand.getTime() || b.rang - a.rang);
}

/** Le fil réduit à un registre. « Tous » ne retire rien. */
export function filFiltre(
	evenements: readonly EvenementConstruit[],
	filtre: FiltreDeRegistre
): readonly EvenementConstruit[] {
	if (filtre === 'tous') return evenements;
	return evenements.filter((e) => e.registres.includes(filtre));
}
