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
import { accord } from './vocabulaire';

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
	/**
	 * La date de dernière vérification, ou `null` — la note n'a JAMAIS été
	 * vérifiée. Absente, on ne sait pas, et le libellé garde sa forme d'avant :
	 * c'est ce qui laisse les appelants qui ne portent pas l'information rendre
	 * exactement ce qu'ils rendaient.
	 */
	readonly revise?: string | null;
}

/**
 * LES DEUX FORMES DU LIBELLÉ (ARB-029). La longue est celle de la fabrique du
 * gel, partout ; la compacte est celle que le gel écrit au panneau
 * « Position » de V-14. Il n'en existe pas de troisième.
 */
export type FormeDeLibelle = 'longue' | 'compacte';

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
 *
 * UN ÉCART ASSUMÉ SUR LE COMPTE EN JOURS. Le gel concatène « jours » sans
 * l'accorder ; son jeu n'y descend jamais à 1, le défaut ne s'y voyait donc
 * pas. Ici il se voit — une note vérifiée la veille. Le nom s'accorde
 * (`$lib/vocabulaire`), le reste de la ligne est celui du gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX FORMES, ET LE SEUL SITE DE LA COMPACTE — ARB-029
 *
 * Le gel porte DEUX mises en mots du même calcul. La longue, que sa fabrique
 * produit partout. Et une COMPACTE, qu'il écrit au panneau « Position » de
 * V-14, et nulle part ailleurs :
 *
 *     V-14-lecture-note.html:1817   temoin--frais, trois barres pleines
 *       <span class="temoin__txt">il y a 6 j</span>
 *     V-14-lecture-note.html:1822   temoin--vieil, deux barres
 *       <span class="temoin__txt">il y a 4 mois</span>
 *
 * Mesuré sur les 41 maquettes : ce sont les DEUX SEULS contenus littéraux de
 * `.temoin__txt` de tout le gel — partout ailleurs le témoin est construit par
 * `window.temoinFraicheur`. Les « il y a 3 semaines » de V-03:971, V-14:1497,
 * V-15:1589 et V-37:1376 sont des dates de MODIFICATION dans un `<time>` :
 * ni un niveau, ni une ancienneté de vérification.
 *
 * ARB-029 : « ce n'est pas un second calcul, c'est un second rendu du même
 * calcul ». Le niveau et l'ancienneté sont les mêmes des deux côtés ; seule la
 * mise en mots change. La forme compacte RETIRE LE VERBE D'ATTESTATION
 * « Vérifié » et ABRÈGE L'UNITÉ « jours » EN « j ». Les deux cas du gel
 * l'établissent, et se recoupent avec le corpus :
 *
 *   n-planifier-sauv   frais, 6 j     « Vérifié il y a 6 jours » → « il y a 6 j »
 *   n-purge-sauv       vieil, 126 j   « Vérifié il y a 4 mois »  → « il y a 4 mois »
 *
 * `Math.round(126 / 30)` vaut 4, et l'unité « mois » n'est PAS abrégée : le gel
 * l'écrit en entier.
 *
 * DEUX BRANCHES SUR QUATRE N'ONT AUCUN CAS AU GEL, et on le dit plutôt que de
 * le glisser (P-5 : une règle qu'aucun cas n'exerce est une règle dont on
 * ignore si elle marche) :
 *
 *  1. FRAIS À 31 JOURS OU PLUS, dont la forme longue est « Vérifié il y a
 *     1 mois », littéralement. Le retrait du verbe s'y applique sans rien
 *     perdre : « il y a 1 mois ».
 *  2. OBSOLÈTE, et c'est un PIÈGE. Sa forme longue CHANGE DE VERBE — « Pas
 *     revu depuis » —, et c'est écrit vingt lignes plus haut : ce verbe est
 *     « une part de l'information portée hors couleur ». RG-M18-09 (CDC
 *     l. 1403) l'exige : « l'information n'est jamais portée par la couleur
 *     seule. Le signal de fraîcheur […] porte aussi un libellé ». Retirer le
 *     verbe donnerait « depuis 8 mois » et effacerait ce que le niveau dit de
 *     lui-même. LA FORME COMPACTE DE L'OBSOLÈTE EST DONC SA FORME LONGUE :
 *     rien n'est abrégé, et le gel ne montre nulle part un obsolète abrégé.
 *     Ce que la forme compacte retire, c'est le verbe REDONDANT avec la jauge
 *     — pas le verbe qui la contredit.
 *
 * Ces deux branches-là ne sont exercées que par `fraicheur.test.ts`, qui les
 * nomme comme telles. LA BORNE D'ARB-029 vaut pour les deux : la forme compacte
 * s'emploie « là où le gel l'emploie, et nulle part ailleurs ». Un troisième
 * site serait un comblement.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ET DEUX GARDES PRÉCÈDENT CES QUATRE BRANCHES — elles n'étaient exercées
 * NULLE PART.
 *
 * `revise === null` et `jours <= 0` ouvrent le corps ci-dessous. Elles ont été
 * ajoutées après le gel, abondamment commentées, et AUCUN contrôle ne les
 * touchait : `fraicheur.test.ts` ne portait pas une occurrence de `revise`, de
 * « Jamais vérifiée » ni de « à l'instant ». Seul un rendu de V-14 atteignait
 * la première, par ricochet.
 *
 * C'EST CETTE LACUNE QUI A LAISSÉ PASSER LEURS DEUX DÉFAUTS JUMEAUX — V-03 et
 * le panneau « Position » de V-14 omettaient tous deux `revise`, et le champ
 * étant OPTIONNEL avec un test STRICT, la garde tombait en silence. Les deux
 * gardes ont désormais leurs contrôles, l'omission comprise.
 */
export function libelleFraicheur(note: EtatDeFraicheur, forme: FormeDeLibelle = 'longue'): string {
	/**
	 * UNE NOTE JAMAIS VÉRIFIÉE NE PEUT PAS ÊTRE « VÉRIFIÉE IL Y A N JOURS ».
	 *
	 * Le défaut se voyait à l'écran, et il était contradictoire avec lui-même :
	 * une note créée à l'instant portait « Vérifié il y a 0 jours » à côté de
	 * « Jamais vérifiée ». La cause est que la fraîcheur retombe sur la date de
	 * MODIFICATION quand il n'y a pas de vérification (`RG-M06-01`, et c'est
	 * juste) — mais le VERBE du libellé, lui, n'est plus vrai.
	 *
	 * Le mot est celui du gel : `mockups/V-11-page-domaine.html:1995` et
	 * `V-34-console-analytique.html:3173` comptent les notes « Jamais
	 * vérifiées ». Le singulier en est la forme, pas une invention.
	 *
	 * Le NIVEAU, lui, ne change pas : la jauge continue de dire ce que
	 * `RG-M06-01` calcule. Seul le libellé cesse d'affirmer un geste qui n'a pas
	 * eu lieu.
	 */
	if (note.revise === null) return forme === 'longue' ? 'Jamais vérifiée' : 'jamais';
	/**
	 * UNE NOTE VÉRIFIÉE AUJOURD'HUI PORTAIT « VÉRIFIÉ IL Y A 0 JOURS ».
	 *
	 * `note.jours` est un nombre de jours PLEINS : il vaut 0 pendant les
	 * vingt-quatre heures qui suivent la vérification, c'est-à-dire à l'instant
	 * même où l'on clique sur « Vérifier ». La branche voisine ci-dessus a déjà
	 * réparé le cas frère — « Jamais vérifiée » là où le libellé affirmait un
	 * geste qui n'avait pas eu lieu ; celle-ci répare le geste qui vient
	 * d'avoir lieu.
	 *
	 * LE MOT EST CELUI DU GEL, POUR CE SCÉNARIO EXACT :
	 * `mockups/V-14-lecture-note.html:4024`, gestionnaire de `#btn-verifier`,
	 * écrit « Vérifié à l'instant ». La forme compacte garde le fragment sans
	 * le verbe, comme les trois autres branches.
	 */
	if (note.jours <= 0) return forme === 'longue' ? "Vérifié à l'instant" : "à l'instant";
	if (note.fraicheur === 'frais') {
		if (note.jours < 31) {
			/**
			 * « VÉRIFIÉ IL Y A 1 JOURS » — LA VEILLE D'UNE VÉRIFICATION.
			 *
			 * La garde du dessus n'attrape que `jours <= 0` : `jours === 1`
			 * tombait ici, et le libellé LONG — la source unique du signal de
			 * fraîcheur (P-01), que quinze vues rendent — mettait le nom au
			 * pluriel derrière le compte 1. Le cas n'est pas de coin : toute note
			 * vérifiée hier le traverse.
			 *
			 * La forme COMPACTE ne bouge pas : `j` est un symbole d'unité, il est
			 * invariable.
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
 *
 * ELLE REND LA FORME LONGUE, et cela ne bougera pas : c'est ce que produit
 * `window.temoinFraicheur`, que 37 maquettes sur 41 portent — compté, et
 * cohérent avec l'en-tête de ce module : V-01 et V-09 écrivent leur témoin au
 * balisage, V-05 et V-06 n'en ont pas. Le LIBELLÉ long, lui, est celui des 39
 * qui portent `window.libelleFraicheur`.
 *
 * La forme compacte d'ARB-029 ne passe pas par la fabrique du témoin — le seul
 * site du gel qui l'écrit compose son témoin nœud à nœud (V-14:1817 et 1822).
 */
export function temoinFraicheur(note: EtatDeFraicheur): Temoin {
	return {
		niveau: note.fraicheur,
		classe: classeTemoin(note.fraicheur),
		barres: barresFraicheur(note.fraicheur),
		libelle: libelleFraicheur(note)
	};
}
