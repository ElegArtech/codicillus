/**
 * L'AMORÇAGE — CE QUE DIT UN REFUS QUAND L'INSTANCE EST ENCORE VIDE.
 *
 * `/notes/nouvelle` et `/importer` refusent en 404 tant qu'aucun univers
 * n'existe : il n'y a nulle part où ranger une note, donc aucune des deux
 * adresses n'a de sens. Le refus est juste. Le message, lui, était `Not Found`
 * — l'administrateur qui vient d'installer tapait l'adresse, recevait un 404
 * nu, et n'avait aucune issue alors que le produit sait exactement ce qui
 * manque.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CODE NE BOUGE PAS. LE MESSAGE BOUGE, ET SEULEMENT POUR UN CAS.
 *
 * `ADR-007` gouverne l'ADRESSE NON RÉSOLUE : une réponse unique, qui ne révèle
 * pas si la cible existe. Ce n'est pas ce cas-ci. Ces deux adresses se
 * RÉSOLVENT ; ce qui manque n'est pas une ressource, c'est le rangement de
 * l'instance entière. Et le seul compte qui lit la phrase est l'administrateur,
 * qui lit déjà le même fait sur `/` (« Votre base est vide ») et dans le rail
 * (« Aucun univers n'existe encore sur cette instance »). Rien n'est révélé
 * qu'il ne voie ailleurs.
 *
 * Pour tout autre compte, et pour toute autre cause de refus — un rédacteur
 * sans périmètre, un lecteur, un anonyme, une instance qui porte des univers
 * mais aucun dossier ouvert à l'appelant —, `MESSAGE_INTROUVABLE` ne bouge pas
 * d'un octet.
 *
 * LA BASE N'EST LUE QUE POUR L'ADMINISTRATEUR : le rôle se juge d'abord, et un
 * refus ordinaire ne touche donc pas la table.
 */
import type { Base } from '../base/acces';
import { univers } from '../base/schema';
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

/** Vrai quand l'instance ne porte AUCUN univers. Une ligne suffit à trancher. */
export async function instanceSansUnivers(base: Base): Promise<boolean> {
	const lignes = await base.select({ id: univers.id }).from(univers).limit(1);
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
	return (await instanceSansUnivers(base)) ? MESSAGE_AMORCAGE : MESSAGE_INTROUVABLE;
}
