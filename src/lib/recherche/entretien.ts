/**
 * L'ENTRETIEN DE L'INDEX PAR LES CHEMINS D'ÉCRITURE — le geste unique que toute écriture de
 * note appelle APRÈS avoir validé sa transaction.
 *
 * IL SOUMET À L'INDEX ET NE L'ATTEND PAS (`ARB-060`). C'EST LE SEUL ENDROIT DU DÉPÔT OÙ
 * L'ATTENTE TOMBE, parce que ses trois appelants font attendre un utilisateur ; partout
 * ailleurs le régime reste `attendre`. La SOUMISSION, elle, est dans la requête et elle lève :
 * moteur arrêté, injoignable ou refusant, l'enregistrement échoue. `ARB-060` « n'autorise pas
 * à taire un échec de soumission » — seul le suivi de la tâche disparaît, et l'échec d'une
 * tâche est relevé après coup par le contrôle « aucune tâche en échec dans le moteur ».
 *
 * CE QUI RESTE DIFFÉRÉ : le calcul du vecteur. `ADR-009` interdit « toute attente du calcul
 * d'un vecteur avant de déclarer une note enregistrée ou indexée » ; l'ÉCRITURE dans l'index
 * reste commandée dans la requête. `RG-M05-06` donne dix secondes, jamais attendues par une
 * temporisation (`ADR-006`) : c'est le délai du moteur.
 *
 * LA DISPARITION EST DÉDUITE DE LA BASE, JAMAIS DU PLAN DE L'APPELANT — trois propriétés qu'il
 * n'a pas à connaître :
 *
 *  1. UNE NOTE QUI SORT DU PÉRIMÈTRE EST RÉÉCRITE AVEC LE NOUVEAU. Le document du moteur est
 *     REMPLACÉ, pas fusionné — la commande d'ajout remplace l'entrée de même clé, là où la
 *     mise à jour l'aurait fusionnée champ à champ. `ADR-006` : « le déplacement d'un dossier
 *     ou la modification d'un droit impose une réindexation : le chemin d'ancêtres doit
 *     suivre. »
 *  2. UNE NOTE QUI N'EST PLUS EN BASE EST RETIRÉE. `/recherche` lit en base les identifiants
 *     QUE L'INDEX A RENDUS : l'index est la barrière, et une entrée périmée est une fuite.
 *  3. UNE TRANSACTION ANNULÉE NE LAISSE RIEN. La simulation d'import annule la sienne : ses
 *     notes ne sont pas en base quand ce module les relit. Aucune branche « en simulation, ne
 *     pas faire ceci » — `RG-M12-02` exige UN SEUL chemin de code.
 *
 * CE MODULE NE PROJETTE RIEN LUI-MÊME : `projeterLeCorpus()` est le seul code du dépôt qui
 * sache poser un périmètre, et une seconde projection serait un second périmètre dont le
 * premier faux passerait inaperçu.
 *
 * L'ORDRE EST À LA CHARGE DE L'APPELANT : le retrait suit la validation de la transaction,
 * JAMAIS avant, « de sorte qu'une transaction annulée ne puisse pas laisser un index amputé »
 * (`STACK §4.8`). Aucune signature ne l'empêche.
 */
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { indexerDesNotes, projeterLeCorpus, retirerDesNotes } from './moteur';

/** Ce que l'entretien a fait — deux nombres, jamais un « c'est fait ». */
export interface RapportDEntretien {
	readonly indexees: number;
	readonly retirees: number;
}

/**
 * ENTRETIENT L'INDEX POUR CES NOTES — et pour elles seules.
 *
 * @param base la base, APRÈS validation de la transaction qui vient d'écrire
 * @param client le client du moteur
 * @param identifiants les notes touchées — celles qui existent encore sont réécrites, celles
 *   qui n'existent plus sont retirées
 * @throws l'erreur de SOUMISSION au moteur. `ARB-060` retire l'attente de la tâche, jamais la
 *   remontée de cet échec-là.
 */
export async function entretenirLIndex(
	base: Base,
	client: Meilisearch,
	identifiants: readonly string[]
): Promise<RapportDEntretien> {
	/* Les doublons ne sont pas une erreur d'appelant : un lot d'import peut
	   toucher deux fois la même note. Ils sont réduits ici plutôt que refusés. */
	const demandes = [...new Set(identifiants)];
	if (demandes.length === 0) return { indexees: 0, retirees: 0 };

	const projetees = await projeterLeCorpus(base, demandes);
	const vivantes = new Set(projetees.map((n) => n.id));
	const disparues = demandes.filter((id) => !vivantes.has(id));

	/* Les deux ensembles sont DISJOINTS par construction — une note est en base ou
	   elle n'y est pas —, l'ordre des deux appels est donc sans effet.

	   `soumettre` : la tâche est posée, pas suivie (`ARB-060`). Les deux seules
	   occurrences du dépôt sont ces deux lignes ; partout ailleurs le régime est
	   `attendre`, et `RegimeDeTache` n'a pas de valeur par défaut pour que personne
	   ne puisse en hériter sans l'écrire. */
	const indexees = await indexerDesNotes(client, projetees, 'soumettre');
	const retirees = await retirerDesNotes(client, disparues, 'soumettre');

	return { indexees, retirees };
}
