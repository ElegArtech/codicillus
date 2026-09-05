/**
 * La fraîcheur — l'implémentation unique (`P-01`, `ADR-005`) : toute vue qui affiche un
 * niveau, un libellé, un nombre de barres ou une classe de témoin appelle ce module, aucune ne
 * recalcule. L'écart type que l'ADR nomme : `si (jours > 180)` dans une vue.
 *
 * Deux entrées, et elles ne se confondent pas. `niveauFraicheur(jours, seuils)` CALCULE le
 * niveau (`RG-M06-01`, purement temporel) — c'est ce qui permet de rejouer les notes sous
 * d'autres seuils dans la console. `temoinFraicheur` et `libelleFraicheur` LISENT le niveau
 * porté par la note et en dérivent l'affichage, sans le recalculer.
 *
 * Ce module produit la DESCRIPTION du témoin, pas son balisage : recopier ce balisage ailleurs
 * au lieu d'appeler le composant unique est interdit (`DESIGN.md` §3.7).
 */
import type { NiveauFraicheur } from '../../seeds/corpus';
import { FUSEAU_PAR_DEFAUT, formaterDateAbregeeFr, formaterDateFr } from './dates';
import { accord } from './vocabulaire';

export type { NiveauFraicheur };

/**
 * Les seuils, en jours. RG-M06-02 : configurables globalement, le seuil jaune
 * strictement supérieur au vert. Ils sont donc un PARAMÈTRE de l'implémentation
 * unique, jamais une constante locale (ADR-005).
 */
export interface SeuilsDeFraicheur {
	/** Au-dessous : frais. `window.CONFIG.seuilFrais`. */
	readonly frais: number;
	/** Au-dessous : vieillissant. Au-delà ou égal : obsolète. `seuilVieillissant`. */
	readonly vieillissant: number;
}

/** Les valeurs par défaut du gel — `window.CONFIG`, treize maquettes. */
export const SEUILS_PAR_DEFAUT: SeuilsDeFraicheur = { frais: 90, vieillissant: 180 };

/**
 * Le niveau de fraîcheur d'une ancienneté, pour un jeu de seuils donné. Les deux comparaisons
 * sont STRICTES, à la lettre du gel (`V-14:3255`) : une note à exactement 90 jours est
 * vieillissante, une note à 180 jours est obsolète.
 *
 * @param jours ancienneté de la dernière vérification, en jours
 * @param seuils les seuils en vigueur — par défaut ceux du gel
 */
export function niveauFraicheur(
	jours: number,
	seuils: SeuilsDeFraicheur = SEUILS_PAR_DEFAUT
): NiveauFraicheur {
	if (jours < seuils.frais) return 'frais';
	if (jours < seuils.vieillissant) return 'vieil';
	return 'obs';
}

/**
 * Le nombre de barres PLEINES de la jauge : 3, 2 ou 1. La jauge en compte
 * toujours TROIS, les autres restent en contour vide — « c'est le contraste
 * plein / vide qui fait la forme : n'émettre qu'une barre pour le niveau
 * obsolète détruit la lecture périphérique » (DESIGN.md §3.3).
 */
export function barresFraicheur(niveau: NiveauFraicheur): 1 | 2 | 3 {
	return niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1;
}

/** Le nombre total de barres de la jauge. Toujours trois (DESIGN.md §3.7, 2). */
export const BARRES_DE_JAUGE = 3;

/**
 * Le modificateur de classe posé sur `.temoin`. C'est de LUI que vient la
 * teinte : la jauge est en `currentColor` (DESIGN.md §3.4).
 */
export function classeTemoin(niveau: NiveauFraicheur): string {
	return niveau === 'frais'
		? 'temoin--frais'
		: niveau === 'vieil'
			? 'temoin--vieil'
			: 'temoin--obs';
}

/**
 * Ce que la fabrique doit connaître d'une note. Le type est STRUCTUREL : une
 * ligne de liste, un nœud de graphe ou une entrée d'export le satisfont sans
 * être une note complète.
 */
export interface EtatDeFraicheur {
	readonly fraicheur: NiveauFraicheur;
	readonly jours: number;
	/**
	 * La date de dernière vérification, ou `null` — la note n'a JAMAIS été
	 * vérifiée. Absente, on ne sait pas, et le libellé garde sa forme d'avant :
	 * les appelants qui ne portent pas l'information rendent ce qu'ils rendaient.
	 */
	readonly revise?: string | null;
}

/**
 * Les deux formes du libellé (ARB-029). La longue est celle de la fabrique du
 * gel, partout ; la compacte, celle du panneau « Position » de V-14. Il n'en
 * existe pas de troisième.
 */
export type FormeDeLibelle = 'longue' | 'compacte';

/**
 * Le libellé en clair, toujours affiché à côté de la jauge. `ADR-005` interdit « tout libellé
 * de fraîcheur construit localement » : c'est cette fonction, et elle seule (`V-41:2183`).
 *
 * Trois points que la seule lecture de `DESIGN.md` §3.2 ne donne pas :
 *
 *  - le basculement jours → mois se fait à 31 jours, et seulement au niveau FRAIS ;
 *  - un frais de 31 jours ou plus affiche « 1 mois », sans passer par l'arrondi ;
 *  - le niveau obsolète CHANGE DE VERBE — « Pas revu depuis » —, part de l'information portée
 *    hors couleur qu'exige `RG-M18-09`.
 *
 * `ARB-029` pour la forme compacte : « ce n'est pas un second calcul, c'est un second rendu du
 * même calcul ». Elle retire le verbe d'attestation et abrège « jours » en « j » ; « mois »
 * n'est PAS abrégé. Sa borne : le panneau « Position » de V-14, et nulle part ailleurs.
 * L'OBSOLÈTE FAIT EXCEPTION : son verbe porte l'information, sa forme compacte est sa forme
 * longue.
 */
export function libelleFraicheur(note: EtatDeFraicheur, forme: FormeDeLibelle = 'longue'): string {
	/**
	 * Une note jamais vérifiée ne peut pas être « Vérifié il y a n jours ». La fraîcheur retombe
	 * sur la date de MODIFICATION faute de vérification (`RG-M06-01`), mais le VERBE du libellé
	 * n'est plus vrai. Le NIVEAU ne change pas. Le champ est OPTIONNEL et le test STRICT : un
	 * appelant qui omet `revise` fait tomber la garde en silence.
	 */
	if (note.revise === null) return forme === 'longue' ? 'Jamais vérifiée' : 'jamais';
	/**
	 * `jours` est un nombre de jours PLEINS : il vaut 0 pendant les vingt-quatre
	 * heures qui suivent la vérification, donc à l'instant même du clic sur
	 * « Vérifier ». Le mot est celui du gel pour ce scénario exact
	 * (`V-14-lecture-note.html:4024`, gestionnaire de `#btn-verifier`).
	 */
	if (note.jours <= 0) return forme === 'longue' ? "Vérifié à l'instant" : "à l'instant";
	if (note.fraicheur === 'frais') {
		if (note.jours < 31) {
			/**
			 * Le nom s'accorde : la garde du dessus n'attrape que `jours <= 0`, et
			 * toute note vérifiée la veille traverse ce cas. La forme COMPACTE ne
			 * bouge pas — `j` est un symbole d'unité, il est invariable.
			 */
			return forme === 'longue'
				? `Vérifié il y a ${note.jours} ${accord(note.jours, 'jour')}`
				: `il y a ${note.jours} j`;
		}
		return forme === 'longue' ? 'Vérifié il y a 1 mois' : 'il y a 1 mois';
	}
	const mois = Math.round(note.jours / 30);
	if (note.fraicheur === 'vieil') {
		return forme === 'longue' ? `Vérifié il y a ${mois} mois` : `il y a ${mois} mois`;
	}
	/* Le verbe de l'obsolète EST l'information : les deux formes se confondent. */
	return `Pas revu depuis ${mois} mois`;
}

export interface Temoin {
	readonly niveau: NiveauFraicheur;
	/** Le modificateur de classe de `.temoin`. */
	readonly classe: string;
	readonly barres: 1 | 2 | 3;
	/** Le texte de `.temoin__txt`, jamais omis (DESIGN.md §3.7, 1). */
	readonly libelle: string;
}

/**
 * La fabrique unique — `window.temoinFraicheur` : « le témoin de fraîcheur est la signature du
 * produit : il n'existe qu'une seule fabrique, pour qu'il ne puisse pas diverger d'un écran à
 * l'autre » (`V-41:2196`). Elle ne recalcule PAS le niveau : une note dont le niveau doit être
 * rejoué sous d'autres seuils passe d'abord par `niveauFraicheur`. Elle rend la forme LONGUE.
 */
export function temoinFraicheur(note: EtatDeFraicheur): Temoin {
	return {
		niveau: note.fraicheur,
		classe: classeTemoin(note.fraicheur),
		barres: barresFraicheur(note.fraicheur),
		libelle: libelleFraicheur(note)
	};
}

/* ==========================================================================
   LA VIVACITÉ — CINQ ÉTATS, UNE SEULE FABRIQUE

   Ce qui précède est la fabrique à TROIS niveaux, celle que les vues montent
   encore aujourd'hui. Ce qui suit la remplace : cinq états, un cycle PAR
   REGISTRE, et un calcul qui part de l'échéance au lieu de l'ancienneté.
   Les deux cohabitent le temps que les vues passent des unes aux autres ;
   la première s'en va quand plus personne ne l'appelle.

   Le principe ne change pas (P-01, ADR-005) : il n'existe qu'UNE
   implémentation. Aucune vue ne recalcule un état, ne construit un libellé
   d'échéance, ne place un rond sur une frise. Tout sort d'ici.

   « Vivacité » est le mot de l'écran ; « fraîcheur » reste celui du module,
   des tables et des routes. C'est le seul endroit du produit où les deux se
   croisent, et c'est voulu.
   ========================================================================== */

/** Les cinq états, du plus calme au plus criant. L'ordre est celui des compteurs. */
export type EtatDeVivacite = 'ajour' | 'bientot' | 'averifier' | 'arevoir' | 'obsolete';

/** L'ordre d'affichage des cinq états — compteurs, barre empilée, planche. */
export const ORDRE_DES_ETATS = [
	'ajour',
	'bientot',
	'averifier',
	'arevoir',
	'obsolete'
] as const satisfies readonly EtatDeVivacite[];

/**
 * Le degré d'attention que l'état réclame. Il commande le fond de la ligne
 * compacte et le poids de l'échéance — jamais une couleur écrite dans une vue.
 * Une documentation saine est silencieuse ; plus elle demande d'attention,
 * plus l'interface attire l'œil.
 */
export type Attention = 0 | 1 | 2 | 3;

/**
 * Les seuils du cycle, en jours. Comme les seuils de la fabrique à trois
 * niveaux, ils sont un PARAMÈTRE : la console doit pouvoir les rejouer.
 */
export interface SeuilsDeVivacite {
	/** Au-dessous de ce reste, l'échéance est annoncée comme proche. */
	readonly bientot: number;
	/** Retard à partir duquel l'état passe de « À vérifier » à « À revoir ». */
	readonly retardRevoir: number;
	/** Retard à partir duquel l'état passe de « À revoir » à « Obsolète ». */
	readonly retardObsolete: number;
}

/** Les valeurs du prototype validé : 10 jours, puis 14 et 90 de retard. */
export const SEUILS_DE_VIVACITE: SeuilsDeVivacite = {
	bientot: 10,
	retardRevoir: 14,
	retardObsolete: 90
};

/** Ce que le glyphe et le libellé doivent savoir d'un état, et rien de plus. */
export interface DescriptionDEtat {
	readonly etat: EtatDeVivacite;
	/** Le libellé visible. Il accompagne TOUJOURS le glyphe (RG-M18-09). */
	readonly libelle: string;
	/** Le modificateur de classe : c'est de lui que vient la teinte. */
	readonly classe: string;
	/**
	 * Le remplissage de l'anneau, en données de tracé. Vide pour l'obsolète :
	 * l'anneau nu EST sa forme.
	 */
	readonly glyphe: string;
	readonly attention: Attention;
	/** La règle en une phrase — la planche des états la rend telle quelle. */
	readonly regle: string;
}

/**
 * LES CINQ ÉTATS. La forme porte l'information : disque plein, trois quarts,
 * demi-disque, point d'exclamation, anneau vide. Un lecteur qui ne distingue
 * pas le vert de l'ambre lit quand même l'état, et le libellé le nomme.
 */
export const ETATS_DE_VIVACITE: Readonly<Record<EtatDeVivacite, DescriptionDEtat>> = {
	ajour: {
		etat: 'ajour',
		libelle: 'À jour',
		classe: 'glyphe--ajour',
		glyphe: 'M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z',
		attention: 0,
		regle: 'La vérification est valide.'
	},
	bientot: {
		etat: 'bientot',
		libelle: 'Bientôt à vérifier',
		classe: 'glyphe--bientot',
		glyphe: 'M8 8V1.5A6.5 6.5 0 1 1 1.5 8z',
		attention: 1,
		regle: "L'échéance approche. Signal discret."
	},
	averifier: {
		etat: 'averifier',
		libelle: 'À vérifier',
		classe: 'glyphe--averifier',
		glyphe: 'M8 1.5a6.5 6.5 0 0 1 0 13z',
		attention: 2,
		regle: 'Échéance atteinte : bascule automatique.'
	},
	arevoir: {
		etat: 'arevoir',
		libelle: 'À revoir',
		classe: 'glyphe--arevoir',
		glyphe: 'M7.1 4h1.8v5H7.1zM7.1 10.3h1.8v1.8H7.1z',
		attention: 3,
		regle: 'Retard important ou révision demandée.'
	},
	obsolete: {
		etat: 'obsolete',
		libelle: 'Obsolète',
		classe: 'glyphe--obsolete',
		glyphe: '',
		attention: 3,
		regle: 'Plus considérée comme exploitable.'
	}
};

/**
 * LE CYCLE D'UN REGISTRE — l'entrée de la fabrique.
 *
 * Chaque registre d'une note porte le sien : sa date de vérification, sa
 * durée de validité, son état. Les deux registres d'une même note vivent donc
 * deux cycles indépendants, et créer l'Opérationnel en démarre un neuf.
 */
export interface CycleDeVivacite {
	/**
	 * La dernière vérification du registre, ou `null` — jamais vérifié. Le
	 * calcul retombe alors sur la modification (RG-M06-01) ; le LIBELLÉ, lui,
	 * cesse d'affirmer un geste qui n'a pas eu lieu.
	 */
	readonly verifiee: string | Date | null;
	/**
	 * La date de modification, repli du calcul quand rien n'a été vérifié.
	 * REQUISE : une note en porte toujours une, et un repli optionnel laisserait
	 * une vue distraite compter les jours depuis l'époque Unix.
	 */
	readonly modifiee: string | Date;
	/** La durée de validité du registre, en jours. Référence 90, Opérationnel 21. */
	readonly validite: number;
	/** Qui a vérifié. Absent, la ligne s'arrête à la date. */
	readonly par?: string | null;
	/**
	 * La demande de révision active : le compte qui l'a posée. Elle FORCE
	 * « À revoir » quel que soit le temps restant, jusqu'à la prochaine
	 * vérification.
	 */
	readonly revisionPar?: string | null;
}

/** Le numéro du jour civil dans le fuseau du produit — un entier, jamais un instant. */
function jourCivil(valeur: string | Date, fuseau: string): number {
	const date = valeur instanceof Date ? valeur : new Date(valeur);
	if (Number.isNaN(date.getTime())) throw new Error(`Date invalide : ${String(valeur)}`);
	const [annee, mois, jour] = new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: fuseau
	})
		.format(date)
		.split('-')
		.map(Number);
	return Date.UTC(annee ?? 0, (mois ?? 1) - 1, jour ?? 1) / 86400000;
}

/** Le jour civil rendu à une date, posée à midi : aucun fuseau ne la fait glisser. */
function dateDuJour(numero: number): Date {
	return new Date(numero * 86400000 + 43200000);
}

/**
 * L'ÉTAT, ET LUI SEUL. Le calcul est purement temporel — le reste avant
 * échéance, mesuré en jours civils —, à une exception : une demande de
 * révision force « À revoir », parce qu'un humain a dit que le contenu était
 * douteux et que le calendrier n'en sait rien.
 *
 * Les bornes, à la lettre de la spécification : un reste égal au seuil est
 * « Bientôt », un reste nul est encore « Bientôt » (l'échéance est
 * aujourd'hui, pas hier), un reste de −14 jours est déjà « À revoir ».
 */
export function etatDeVivacite(
	reste: number,
	revision: boolean,
	seuils: SeuilsDeVivacite = SEUILS_DE_VIVACITE
): EtatDeVivacite {
	if (revision) return 'arevoir';
	if (reste > seuils.bientot) return 'ajour';
	if (reste >= 0) return 'bientot';
	if (reste > -seuils.retardRevoir) return 'averifier';
	if (reste > -seuils.retardObsolete) return 'arevoir';
	return 'obsolete';
}

/**
 * TOUT CE QUE L'ÉCRAN AFFICHE d'un cycle. Une vue lit ces champs, elle n'en
 * dérive aucun : le jour où le libellé d'échéance change, il change ici, et
 * partout à la fois.
 */
export interface Vivacite extends DescriptionDEtat {
	/** Le reste avant échéance, en jours civils. Négatif : l'échéance est passée. */
	readonly reste: number;
	/** Le point de départ du cycle : la vérification, ou la modification à défaut. */
	readonly depart: Date;
	readonly echeance: Date;
	readonly jamaisVerifiee: boolean;
	readonly revision: boolean;
	/** Le compte qui a demandé la révision, ou la chaîne vide. */
	readonly revisionPar: string;
	/** « Vérifiée le 13 août 2026 par Alexandre Berge », ou « Jamais vérifiée ». */
	readonly ligneVerification: string;
	/** « Prochaine vérification : 11 nov. 2026 (dans 67 jours) », ou son retard. */
	readonly ligneEcheance: string;
	/** La phrase du rappel automatique — colonne contexte et pied de note. */
	readonly rappel: string;
	/** La forme des rails et des listes : « dans 67 j », « 21 j de retard », « jamais ». */
	readonly compact: string;
	/** La légende centrale de la frise : « J−67 » ou « J+21 ». */
	readonly relatif: string;
	/** La position d'aujourd'hui sur la frise, de 0 à 1. */
	readonly fraction: number;
	/** Les deux légendes de la frise, au mois abrégé. */
	readonly departCourt: string;
	readonly echeanceCourt: string;
	/** L'échéance est passée : son rond se remplit au lieu de rester en anneau. */
	readonly echeanceEchue: boolean;
}

/** « 1 jour », « 67 jours » — l'unité s'accorde, le symbole « j » jamais. */
function enJours(n: number): string {
	return `${n} ${n > 1 ? 'jours' : 'jour'}`;
}

/**
 * LA FABRIQUE UNIQUE DE LA VIVACITÉ. Elle prend le cycle d'UN registre et le
 * jour où on le regarde ; elle rend l'état, ses libellés, sa frise et son
 * rappel. Aucune vue n'en refait un morceau.
 *
 * `aujourdhui` est un PARAMÈTRE et non une horloge cachée : sans lui, deux
 * appels d'un même rendu pourraient tomber de part et d'autre de minuit, et
 * aucun test ne pourrait épingler une borne.
 */
export function vivacite(
	cycle: CycleDeVivacite,
	aujourdhui: string | Date,
	seuils: SeuilsDeVivacite = SEUILS_DE_VIVACITE,
	fuseau: string = FUSEAU_PAR_DEFAUT
): Vivacite {
	const jamaisVerifiee = cycle.verifiee === null;
	const depart = jourCivil(cycle.verifiee ?? cycle.modifiee, fuseau);
	const echeance = depart + cycle.validite;
	const jour = jourCivil(aujourdhui, fuseau);
	const reste = echeance - jour;

	const revisionPar = cycle.revisionPar ?? '';
	const revision = revisionPar !== '';
	const description = ETATS_DE_VIVACITE[etatDeVivacite(reste, revision, seuils)];

	const dateDepart = dateDuJour(depart);
	const dateEcheance = dateDuJour(echeance);
	const echeanceCourt = formaterDateAbregeeFr(dateEcheance, fuseau);

	const ligneVerification = jamaisVerifiee
		? 'Jamais vérifiée'
		: `Vérifiée le ${formaterDateFr(dateDepart, fuseau)}${cycle.par ? ` par ${cycle.par}` : ''}`;

	const ligneEcheance =
		reste > 0
			? `Prochaine vérification : ${echeanceCourt} (dans ${enJours(reste)})`
			: reste === 0
				? `Échéance aujourd'hui : ${echeanceCourt}`
				: `Échéance dépassée de ${enJours(-reste)} (${echeanceCourt})`;

	const bascule = reste > -seuils.retardRevoir ? seuils.retardRevoir : seuils.retardObsolete;
	const rappel =
		reste >= 0
			? `Cette note repassera automatiquement à « À vérifier » le ${echeanceCourt}.`
			: description.etat === 'obsolete'
				? `Échéance dépassée depuis le ${echeanceCourt}. Une nouvelle vérification relancera le cycle.`
				: `En attente de vérification depuis le ${echeanceCourt}. Passage à « ${
						reste > -seuils.retardRevoir ? 'À revoir' : 'Obsolète'
					} » le ${formaterDateAbregeeFr(dateDuJour(echeance + bascule), fuseau)}.`;

	const total = echeance - depart;
	const fraction = total <= 0 ? 1 : Math.max(0, Math.min(1, (jour - depart) / total));

	return {
		...description,
		reste,
		depart: dateDepart,
		echeance: dateEcheance,
		jamaisVerifiee,
		revision,
		revisionPar,
		ligneVerification,
		ligneEcheance,
		rappel,
		compact: jamaisVerifiee ? 'jamais' : reste >= 0 ? `dans ${reste} j` : `${-reste} j de retard`,
		relatif: reste >= 0 ? `J−${reste}` : `J+${-reste}`,
		fraction,
		departCourt: formaterDateAbregeeFr(dateDepart, fuseau),
		echeanceCourt,
		echeanceEchue: reste < 0
	};
}
