/**
 * L'AMORÇAGE — CE QUE DIT UN REFUS QUAND L'INSTANCE EST ENCORE VIDE.
 *
 * `/notes/nouvelle` et `/importer` refusent en 404 tant que le rangement
 * n'existe pas — ni univers, ou bien des univers mais aucun domaine : il n'y a
 * nulle part où ranger une note, donc aucune des deux adresses n'a de sens. Le refus est juste. Le message, lui, était `Not Found`
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
 * LE MESSAGE SERVI À L'ADMINISTRATEUR D'UNE INSTANCE QUI A DES UNIVERS MAIS
 * AUCUN DOMAINE — l'étape SUIVANTE, et elle était nue.
 *
 * Le message ci-dessus cessait d'être servi à l'instant exact où il devenait le
 * plus utile : on crée l'univers qu'il demande, on retourne sur
 * `/notes/nouvelle`, et le refus redevient `Not Found`. Or il n'y a toujours nulle
 * part où ranger une note — une note se range dans un DOSSIER, et un dossier
 * appartient à un domaine —, et l'issue est un autre écran de la console.
 *
 * Même régime que le premier : le code ne bouge pas, seul l'administrateur le
 * lit, et le fait qu'il énonce est celui que l'accueil et le rail lui montrent
 * déjà.
 */
export const MESSAGE_AMORCAGE_DOMAINE =
	"Aucun domaine n'existe encore sur cette instance : il n'y a nulle part où ranger une note. " +
	'Créez un domaine dans la console — /console/domaines — et cette adresse ' +
	"s'ouvrira.";

/** Vrai quand l'instance ne porte AUCUN univers. Une ligne suffit à trancher. */
export async function instanceSansUnivers(base: Base): Promise<boolean> {
	const lignes = await base.select({ id: univers.id }).from(univers).limit(1);
	return lignes.length === 0;
}

/** Vrai quand l'instance ne porte AUCUN domaine. Une ligne suffit à trancher. */
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
