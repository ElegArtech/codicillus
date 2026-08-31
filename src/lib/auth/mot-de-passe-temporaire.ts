/**
 * LE MOT DE PASSE TEMPORAIRE QUE L'ADMINISTRATION POSE — `M14.6`, `RG-CPT-01`.
 *
 * Le produit n'a ni expéditeur de courriel, ni table de jeton : la SEULE porte de
 * secours d'un compte dont l'accès est perdu est la réinitialisation par un
 * administrateur, depuis `/console/comptes`. La valeur posée là est donc, pendant
 * quelques minutes, le mot de passe complet du compte : elle doit être tirée au
 * hasard, et par un hasard qu'on ne rejoue pas.
 *
 * POURQUOI LA VALEUR EST TIRÉE ICI ET NON AU NAVIGATEUR. Elle l'était : la vue
 * composait « trois mots d'une liste de seize, puis un nombre à deux chiffres »
 * avec `Math.random()`. Cela fait 3 × 4 + 6,5 ≈ 18 bits, et `Math.random()` n'est
 * PAS un générateur cryptographique — sa suite se rejoue à partir de quelques
 * sorties observées. Le tirage est désormais fait par le serveur, avec
 * `randomInt` de `node:crypto`, et l'administrateur reçoit ce que la base a
 * réellement condensé : la valeur affichée n'est plus une valeur que le
 * navigateur a proposée.
 *
 * L'ALPHABET N'A AUCUN CARACTÈRE AMBIGU — ni `i`/`l`/`o`, ni `0`/`1` : le mot de
 * passe se transmet de vive voix ou par téléphone, et une confusion de lecture
 * coûterait un second aller-retour. Douze symboles sur trente et un font environ
 * 59 bits, groupés par quatre pour être dictés sans se perdre.
 *
 * CE QUI SORT SATISFAIT DÉJÀ LES RÈGLES QUE LE TITULAIRE DEVRA TENIR
 * (`motDePasseAcceptable`) : quatorze caractères, trois natures, et rien qui
 * contienne l'identifiant de connexion. La règle n'est pas réécrite ici — elle
 * est APPELÉE, et un tirage qui ne la passerait pas est simplement rejoué.
 */
import { randomInt } from 'node:crypto';
import { motDePasseAcceptable } from '../donnees/profil';

/** Sans `i`, `l` ni `o` — les trois qui se confondent à l'oreille et à l'œil. */
const LETTRES = 'abcdefghjkmnpqrstuvwxyz';
/** Sans `0` ni `1`, pour la même raison. */
const CHIFFRES = '23456789';
const SYMBOLES = LETTRES + CHIFFRES;

/** Douze symboles sur trente et un : environ 59 bits d'entropie. */
const SYMBOLES_TIRES = 12;
const TAILLE_DE_GROUPE = 4;

/**
 * LE NOMBRE DE TIRAGES AVANT DE RENDRE LE DERNIER TEL QUEL. Un tirage n'est
 * rejeté que s'il contient l'identifiant de connexion — cas rarissime, et
 * possible seulement sur un identifiant très court. La boucle est bornée pour ne
 * jamais tourner sans fin sur un identifiant qu'aucun tirage ne pourrait éviter ;
 * la valeur rendue au bout garde toute son entropie, elle ne perd que la
 * commodité de passer aussi la règle « différent de votre identifiant ».
 */
const TIRAGES_MAX = 32;

function tirage(): string {
	let brut = '';
	for (let rang = 0; rang < SYMBOLES_TIRES; rang++)
		brut += SYMBOLES[randomInt(SYMBOLES.length)] ?? '';
	const groupes: string[] = [];
	for (let debut = 0; debut < brut.length; debut += TAILLE_DE_GROUPE) {
		groupes.push(brut.slice(debut, debut + TAILLE_DE_GROUPE));
	}
	return groupes.join('-');
}

/**
 * Un mot de passe temporaire pour le compte désigné.
 *
 * @param identifiant l'identifiant de connexion du compte, que la valeur évite de contenir
 */
export function motDePasseTemporaire(identifiant: string): string {
	let candidat = tirage();
	for (
		let essai = 1;
		essai < TIRAGES_MAX && !motDePasseAcceptable(candidat, identifiant);
		essai++
	) {
		candidat = tirage();
	}
	return candidat;
}
