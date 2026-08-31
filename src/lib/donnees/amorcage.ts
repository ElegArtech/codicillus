/**
 * L'AMORÇAGE — CE QUE DIT UN REFUS QUAND L'INSTANCE EST ENCORE VIDE.
 *
 * `/notes/nouvelle` et `/importer` refusent en 404 tant que le rangement n'existe pas
 * — ni univers, ou bien des univers mais aucun domaine : il n'y a nulle part où
 * ranger une note. Le refus est juste ; le message, lui, était `Not Found`, et
 * l'administrateur qui vient d'installer n'avait aucune issue alors que le produit
 * sait exactement ce qui manque.
 *
 * LE CODE NE BOUGE PAS. LE MESSAGE BOUGE, ET SEULEMENT POUR UN CAS. `ADR-007`
 * gouverne l'ADRESSE NON RÉSOLUE ; ce n'est pas ce cas-ci — ces deux adresses se
 * RÉSOLVENT, et ce qui manque est le rangement de l'instance entière. Le seul compte
 * qui lit la phrase est l'administrateur, qui lit déjà le même fait sur `/` et dans
 * le rail. Pour tout autre compte et toute autre cause de refus,
 * `MESSAGE_INTROUVABLE` ne bouge pas d'un octet.
 *
 * LA BASE N'EST LUE QUE POUR L'ADMINISTRATEUR : le rôle se juge d'abord.
 */
import type { Base } from '../base/acces';
import { domaines, univers } from '../base/schema';
import type { Identite } from '../droits/resolution';
import { MESSAGE_INTROUVABLE } from './rangement';

/**
 * Le message servi à l'administrateur d'une instance à zéro univers. Il nomme
 * le chemin RÉEL — un univers, puis un domaine, dans la console — et l'adresse
 * qui l'ouvre. Même fait, mêmes mots que le rail, qui le dit déjà à ce compte.
 */
export const MESSAGE_AMORCAGE =
	"Aucun univers n'existe encore sur cette instance : il n'y a nulle part où ranger une note. " +
	'Créez un univers, puis un domaine, dans la console — /console/univers — et cette adresse ' +
	"s'ouvrira.";

/**
 * LE MESSAGE SERVI À L'ADMINISTRATEUR D'UNE INSTANCE QUI A DES UNIVERS MAIS AUCUN
 * DOMAINE — l'étape SUIVANTE, et elle était nue : le message ci-dessus cessait d'être
 * servi à l'instant exact où il devenait le plus utile. On crée l'univers qu'il
 * demande, on retourne sur `/notes/nouvelle`, et le refus redevenait `Not Found`
 * alors qu'il n'y a toujours nulle part où ranger une note.
 */
export const MESSAGE_AMORCAGE_DOMAINE =
	"Aucun domaine n'existe encore sur cette instance : il n'y a nulle part où ranger une note. " +
	'Créez un domaine dans la console — /console/domaines — et cette adresse ' +
	"s'ouvrira.";

export async function instanceSansUnivers(base: Base): Promise<boolean> {
	const lignes = await base.select({ id: univers.id }).from(univers).limit(1);
	return lignes.length === 0;
}

export async function instanceSansDomaine(base: Base): Promise<boolean> {
	const lignes = await base.select({ id: domaines.id }).from(domaines).limit(1);
	return lignes.length === 0;
}

/**
 * LE MESSAGE D'UN REFUS 404 SUR UNE ADRESSE D'ÉCRITURE — le seul point où le
 * choix se fait, pour que les deux sites ne puissent pas diverger.
 *
 * Rend `MESSAGE_AMORCAGE` si, et seulement si, l'appelant est administrateur ET
 * l'instance ne porte aucun univers. Sinon `MESSAGE_INTROUVABLE`.
 */
export async function messageDeRefusDEcriture(base: Base, identite: Identite): Promise<string> {
	if (identite.type !== 'authentifie' || identite.role !== 'administrateur') {
		return MESSAGE_INTROUVABLE;
	}
	if (await instanceSansUnivers(base)) return MESSAGE_AMORCAGE;
	/* L'ÉTAPE SUIVANTE, ET ELLE COMPTE AUTANT QUE LA PREMIÈRE. Un univers créé
	   sans domaine laissait revenir le 404 nu, juste après le geste que le premier
	   message demandait. Le second nomme l'écran qui débloque. */
	if (await instanceSansDomaine(base)) return MESSAGE_AMORCAGE_DOMAINE;
	return MESSAGE_INTROUVABLE;
}

/**
 * LE REFUS TEL QU'IL DOIT ARRIVER À L'ÉCRAN — message, et le drapeau qui le fait
 * peindre. `+error.svelte` rend `V-26` pour tout 404 et n'affichait
 * `page.error.message` que dans sa branche NON-404 : sans ce drapeau,
 * l'administrateur d'une instance neuve lit le texte générique de la page d'adresse
 * non résolue.
 *
 * Le drapeau ne voyage QU'AVEC un message d'amorçage. Pour tous les autres, la charge
 * est celle d'avant, mot pour mot : `ADR-007` et son régime indiscernable ne bougent
 * pas.
 */
export async function refusDEcriture(base: Base, identite: Identite): Promise<App.Error> {
	const message = await messageDeRefusDEcriture(base, identite);
	return message === MESSAGE_INTROUVABLE ? { message } : { message, amorcage: true };
}
