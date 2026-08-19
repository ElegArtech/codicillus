/**
 * LA FRAÎCHEUR — L'IMPLÉMENTATION UNIQUE.
 *
 * P-01, l'un des dix principes non négociables : « une seule définition de la
 * fraîcheur ». ADR-005 en tire la conséquence opposable — « il existe UNE SEULE
 * implémentation du calcul de fraîcheur dans le produit, exposée comme fonction
 * unique. Tous les affichages, tous les agrégats, tous les filtres, tous les
 * tris et tous les exports l'appellent. » Le gel dit la même chose de la
 * fabrique du témoin : *« il n'existe qu'une seule fabrique, pour qu'il ne
 * puisse pas diverger d'un écran à l'autre »* (`V-41-bibliotheque.html:2196`).
 *
 * CE MODULE EST CETTE DÉFINITION. Toute vue qui affiche un niveau, un libellé,
 * un nombre de barres ou une classe de témoin l'appelle. Aucune ne recalcule.
 * ADR-005 nomme l'écart type : « `si (jours > 180)` dans une vue ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * PROVENANCE — EXTRAIT DU GEL, JAMAIS RÉINVENTÉ
 *
 * Les quatre fonctions ci-dessous sont la transcription en TypeScript des
 * quatre fonctions du gel, à la lettre. Chacune porte le renvoi à son
 * original. Elles ont été relevées sur les 41 maquettes et comparées par
 * empreinte : le gel ne se contredit nulle part.
 *
 *   `window.libelleFraicheur`  — 39 maquettes, une seule et même écriture
 *   `window.barresFraicheur`   — 39 maquettes, une seule et même écriture
 *   `window.classeTemoin`      — 39 maquettes, une seule et même écriture
 *   `window.niveauPour`        — 13 maquettes, une seule et même écriture
 *   `window.CONFIG.seuil*`     — 13 maquettes, toutes à 90 / 180
 *
 * Les deux maquettes sans témoin sont V-05 et V-06 (authentification), qui ne
 * représentent aucune note. `window.temoinFraicheur` manque en outre à V-01 et
 * V-09, qui écrivent leur témoin au balisage plutôt que par la fabrique.
 *
 * CE QUI N'EST PAS ICI, ET POURQUOI. La fabrique du gel construit aussi le
 * BALISAGE du témoin — `span.temoin > (span.temoin__jauge[aria-hidden], span.
 * temoin__txt)`, trois `<i>` toujours, `.plein` sur les n premiers
 * (`docs/DESIGN.md` §3.3). Ce module en produit la DESCRIPTION COMPLÈTE
 * (`temoinFraicheur`) ; le composant qui la rend appartient à la bibliothèque
 * de composants (V-41) et n'est pas du périmètre d'écriture de ce lot. La règle
 * de DESIGN.md §3.7 point 7 reste entière : « recopier le balisage au lieu
 * d'appeler le composant unique » est interdit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX ENTRÉES, ET ELLES NE SE CONFONDENT PAS
 *
 * Le gel distingue deux usages, et ce module les garde distincts :
 *
 *   `niveauFraicheur(jours, seuils)` — CALCULE le niveau à partir de
 *     l'ancienneté et des seuils. C'est le calcul de RG-M06-01, « purement
 *     temporel ». Le gel l'emploie pour l'aperçu d'impact de la console de
 *     configuration (`window.impactSeuils`, V-33) : rejouer le niveau de
 *     chaque note sous d'autres seuils.
 *
 *   `temoinFraicheur(note)` / `libelleFraicheur(note)` — LISENT le niveau
 *     porté par la note et en dérivent l'affichage. C'est ce que fait
 *     `window.temoinFraicheur` du gel, qui reçoit `n.fraicheur` et ne le
 *     recalcule pas.
 *
 * Confondre les deux serait recalculer un niveau là où le gel en affiche un :
 * ce module reproduit la répartition du gel, il ne l'arbitre pas.
 */
import type { NiveauFraicheur } from '../../seeds/corpus';

export type { NiveauFraicheur };

/**
 * Les seuils, en jours. RG-M06-02 : « les seuils sont configurables
 * globalement par l'administrateur. Le seuil jaune doit être strictement
 * supérieur au seuil vert. » Ils sont donc un PARAMÈTRE de l'implémentation
 * unique, jamais une constante locale (ADR-005).
 */
export interface SeuilsDeFraicheur {
	/** Au-dessous : frais. `window.CONFIG.seuilFrais`. */
	readonly frais: number;
	/** Au-dessous : vieillissant. Au-delà ou égal : obsolète. `seuilVieillissant`. */
	readonly vieillissant: number;
}

/**
 * Les valeurs par défaut du gel — `window.CONFIG`, treize maquettes, toutes
 * identiques (`V-14-lecture-note.html:3245`).
 *
 * Le gel les commente lui-même : « les seuils de fraîcheur ne sont pas
 * décoratifs : c'est d'eux que dépend le niveau affiché par le témoin sur
 * chaque note du produit. Le corpus est cohérent avec les valeurs par défaut
 * ci-dessous. »
 */
export const SEUILS_PAR_DEFAUT: SeuilsDeFraicheur = { frais: 90, vieillissant: 180 };

/**
 * Le niveau de fraîcheur d'une ancienneté, pour un jeu de seuils donné.
 *
 * `window.niveauPour` (`V-14-lecture-note.html:3255`) :
 *
 *     window.niveauPour = function (jours, seuilFrais, seuilVieillissant) {
 *       if (jours < seuilFrais) return "frais";
 *       if (jours < seuilVieillissant) return "vieil";
 *       return "obs";
 *     };
 *
 * Les deux comparaisons sont STRICTES : une note à exactement 90 jours est
 * vieillissante, une note à 180 jours est obsolète. C'est la lettre du gel.
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
 * Le nombre de barres PLEINES de la jauge : 3, 2 ou 1.
 *
 * `window.barresFraicheur` (`V-41-bibliotheque.html:2192`). La jauge en compte
 * toujours TROIS ; les autres restent en contour vide. « C'est le contraste
 * plein / vide qui fait la forme : n'émettre qu'une barre pour le niveau
 * obsolète détruit la lecture périphérique » (`docs/DESIGN.md` §3.3).
 */
export function barresFraicheur(niveau: NiveauFraicheur): 1 | 2 | 3 {
	return niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1;
}

/** Le nombre total de barres de la jauge. Toujours trois (DESIGN.md §3.7, 2). */
export const BARRES_DE_JAUGE = 3;

/**
 * Le modificateur de classe posé sur `.temoin`.
 *
 * `window.classeTemoin` (`V-41-bibliotheque.html:2218`). C'est de LUI que vient
 * la teinte : la jauge est en `currentColor`, « la teinte vient d'un seul
 * endroit — le modificateur de niveau posé sur `.temoin` » (DESIGN.md §3.4).
 */
export function classeTemoin(niveau: NiveauFraicheur): string {
	return niveau === 'frais'
		? 'temoin--frais'
		: niveau === 'vieil'
			? 'temoin--vieil'
			: 'temoin--obs';
}

/**
 * Ce que la fabrique doit connaître d'une note : son niveau et son ancienneté.
 *
 * C'est exactement ce que `window.temoinFraicheur(n)` lit de son argument. Le
 * type est STRUCTUREL : toute `Note` du corpus le satisfait, et une ligne de
 * liste, un nœud de graphe ou une entrée d'export peuvent le satisfaire sans
 * être une note complète.
 */
export interface EtatDeFraicheur {
	readonly fraicheur: NiveauFraicheur;
	/** Jours écoulés depuis la dernière vérification. */
	readonly jours: number;
}

/**
 * Le libellé en clair, toujours affiché à côté de la jauge.
 *
 * `window.libelleFraicheur` (`V-41-bibliotheque.html:2183`) :
 *
 *     window.libelleFraicheur = function (n) {
 *       if (n.fraicheur === "frais") {
 *         return n.jours < 31 ? "Vérifié il y a " + n.jours + " jours"
 *                             : "Vérifié il y a 1 mois";
 *       }
 *       var mois = Math.round(n.jours / 30);
 *       if (n.fraicheur === "vieil") return "Vérifié il y a " + mois + " mois";
 *       return "Pas revu depuis " + mois + " mois";
 *     };
 *
 * Trois points que la seule lecture de DESIGN.md §3.2 ne donne pas :
 *
 *  - le basculement jours → mois se fait à 31 jours, et seulement au niveau
 *    FRAIS ; les deux autres niveaux sont toujours en mois ;
 *  - un frais de 31 jours ou plus affiche « 1 mois », littéralement, sans
 *    passer par l'arrondi ;
 *  - le niveau obsolète CHANGE DE VERBE — « Pas revu depuis » —, ce qui est
 *    une part de l'information portée hors couleur.
 *
 * ADR-005 interdit « tout libellé de fraîcheur construit localement » : c'est
 * cette fonction, et elle seule.
 */
export function libelleFraicheur(note: EtatDeFraicheur): string {
	if (note.fraicheur === 'frais') {
		return note.jours < 31 ? `Vérifié il y a ${note.jours} jours` : 'Vérifié il y a 1 mois';
	}
	const mois = Math.round(note.jours / 30);
	return note.fraicheur === 'vieil'
		? `Vérifié il y a ${mois} mois`
		: `Pas revu depuis ${mois} mois`;
}

/**
 * LA DESCRIPTION COMPLÈTE D'UN TÉMOIN — tout ce dont son rendu a besoin, et
 * rien de plus.
 */
export interface Temoin {
	/** Le niveau, tel que la note le porte. */
	readonly niveau: NiveauFraicheur;
	/** Le modificateur de classe de `.temoin`. */
	readonly classe: string;
	/** Le nombre de barres pleines, sur les trois de la jauge. */
	readonly barres: 1 | 2 | 3;
	/** Le texte de `.temoin__txt`, jamais omis (DESIGN.md §3.7, 1). */
	readonly libelle: string;
}

/**
 * LA FABRIQUE UNIQUE — `window.temoinFraicheur` (`V-41-bibliotheque.html:2198`),
 * précédée dans le gel de sa propre justification, en toutes lettres :
 *
 *     « Le témoin de fraîcheur est la signature du produit : il n'existe
 *       qu'une seule fabrique, pour qu'il ne puisse pas diverger d'un écran
 *       à l'autre. »   — V-41-bibliotheque.html:2196
 *
 * Le gel construit des nœuds ; ici, la fabrique rend leur DESCRIPTION, que le
 * composant de témoin transcrit sans rien décider. La différence est de
 * support, pas de contenu : les trois valeurs sortent des trois mêmes
 * fonctions, dans le même ordre.
 *
 * Elle ne recalcule PAS le niveau — pas plus que le gel. Une note dont le
 * niveau doit être rejoué sous d'autres seuils passe d'abord par
 * `niveauFraicheur`.
 */
export function temoinFraicheur(note: EtatDeFraicheur): Temoin {
	return {
		niveau: note.fraicheur,
		classe: classeTemoin(note.fraicheur),
		barres: barresFraicheur(note.fraicheur),
		libelle: libelleFraicheur(note)
	};
}
