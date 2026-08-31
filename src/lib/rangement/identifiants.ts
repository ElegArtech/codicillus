/**
 * L'IDENTIFIANT LISIBLE D'UNE NOTE — la moitié PURE d'`ARB-062`.
 *
 * `./adresses.ts` porte `identifiantLisible()`, la dérivation d'un NOM en segment
 * d'adresse ; ce module en est la seconde moitié et n'en réécrit aucune ligne : il
 * PRÉFIXE, TRONQUE et SUFFIXE ce que l'autre a produit. Aucune base, aucun effet.
 * L'unicité n'est PAS ici : elle est arbitrée par la contrainte
 * `notes_identifiant_unique` (`ARB-062` §2.5), et une fonction pure n'en sait rien.
 *
 * LES SIX RÈGLES D'`ARB-062` §2, ET OÙ CHACUNE VIT :
 *
 *  1. préfixe `n-`                        → `PREFIXE_DE_NOTE`, ci-dessous
 *  2. corps `identifiantLisible(titre)`,
 *     tronqué à 48 sur frontière de tiret → `LONGUEUR_MAX_DU_CORPS`, `tronquer()`
 *  3. slug vide ⇒ corps `note`            → `CORPS_PAR_DEFAUT`
 *  4. collision `-2`, `-3`, … jamais `-1` → `identifiantSuivant()`
 *  5. unicité par la BASE                 → `../donnees/creation.ts`
 *  6. jamais recalculé                    → aucune écriture de renommage ne
 *                                           l'appelle (`RG-M03-03`)
 *
 * Le préfixe RÉSERVE l'espace de nommage : `nouvelle` ne peut pas être produit par
 * `identifiantDeNote()`, quel que soit le titre.
 */
import { identifiantLisible } from './adresses';

/** `ARB-062` §2.1 — la forme que porte le corpus entier. */
export const PREFIXE_DE_NOTE = 'n-';

/**
 * `ARB-062` §2.2 — quarante-huit caractères de CORPS, préfixe non compté.
 * « les 32 identifiants du corpus tiennent en 17 caractères au plus ; la borne
 * est là pour qu'une adresse reste lisible, pas pour contraindre le titre ».
 */
export const LONGUEUR_MAX_DU_CORPS = 48;

/** `ARB-062` §2.3 — le corps d'un titre dont le slug est vide. */
export const CORPS_PAR_DEFAUT = 'note';

/**
 * La troncature d'`ARB-062` §2.2 : à `LONGUEUR_MAX_DU_CORPS`, SUR UNE FRONTIÈRE DE
 * TIRET, « jamais au milieu d'un mot ».
 *
 * LE CAS OÙ LES DEUX MOITIÉS DE LA RÈGLE SE RENCONTRENT : un slug dont le PREMIER mot
 * dépasse déjà la borne n'offre aucune frontière avant elle. La borne l'emporte, la
 * troncature rend la chaîne vide, et §2.3 prend le relais — le corps devient `note`.
 */
function tronquer(slug: string): string {
	if (slug.length <= LONGUEUR_MAX_DU_CORPS) return slug;
	const coupe = slug.slice(0, LONGUEUR_MAX_DU_CORPS);
	/* La coupe tombe déjà sur une frontière quand le caractère SUIVANT est un
	   tiret : le mot est alors entier, et rien n'est à reprendre. */
	const surFrontiere =
		slug[LONGUEUR_MAX_DU_CORPS] === '-' ? coupe : coupe.slice(0, coupe.lastIndexOf('-') + 1);
	return surFrontiere.replace(/^-+|-+$/g, '');
}

/**
 * L'IDENTIFIANT LISIBLE D'UN TITRE — `ARB-062` §2.1 à §2.3. « Restaurer PostgreSQL »
 * → `n-restaurer-postgresql`, « ??? » → `n-note`.
 *
 * Fonction TOTALE : tout titre, y compris vide, rend un identifiant — « il n'y a pas
 * de note sans identifiant, et il n'y a pas de refus d'enregistrer pour cette
 * cause ». Le titre vide est refusé AILLEURS, par le contrat de soumission.
 */
export function identifiantDeNote(titre: string): string {
	return PREFIXE_DE_NOTE + (tronquer(identifiantLisible(titre)) || CORPS_PAR_DEFAUT);
}

/**
 * LE CANDIDAT DU N-IÈME ESSAI — `ARB-062` §2.4. Le premier essai rend le candidat
 * NU : « le premier n'a pas de suffixe, et un `-1` qui n'aurait pas de `-0` serait un
 * compteur qui ment sur son origine ». Les suivants suffixent leur rang.
 *
 * LE REFUS D'UN RANG NON ENTIER OU INFÉRIEUR À 1 est la seule chose qui rende `-1`
 * inatteignable par cette fonction, quel que soit son appelant : la règle est portée
 * par la FORME, pas par la discipline de la boucle.
 *
 * @throws RangeError si l'essai n'est pas un entier supérieur ou égal à 1.
 */
export function identifiantSuivant(candidat: string, essai: number): string {
	if (!Number.isInteger(essai) || essai < 1) {
		throw new RangeError(`essai invalide : ${essai} — ARB-062 §2.4 numérote à partir de 1`);
	}
	return essai === 1 ? candidat : `${candidat}-${essai}`;
}
