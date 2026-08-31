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
