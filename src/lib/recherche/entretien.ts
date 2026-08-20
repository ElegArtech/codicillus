/**
 * L'ENTRETIEN DE L'INDEX PAR LES CHEMINS D'ÉCRITURE — le geste unique que toute
 * écriture de note appelle APRÈS avoir validé sa transaction.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * IL SOUMET À L'INDEX ET NE L'ATTEND PAS — ARB-060
 *
 * C'EST LE SEUL ENDROIT DU DÉPÔT OÙ L'ATTENTE TOMBE, et c'est parce que ce
 * module est le seul à se tenir dans le CHEMIN D'UNE REQUÊTE : ses trois
 * appelants — `enregistrerLeCorps()`, `verifierLaNote()`, `executerLImport()` —
 * font attendre un utilisateur. La réindexation, les commandes de console et
 * l'épreuve de périmètre gardent l'attente : la latence n'y coûte rien, et « une
 * réindexation qui ne saurait pas si elle a réussi serait pire que l'inverse ».
 *
 * LE CAHIER PORTE DEUX BUDGETS, SUR DEUX LIGNES, ET ILS DÉCRIVENT DEUX INSTANTS.
 * « Indexation après enregistrement < 10 s » (`CDC:1534`) et « enregistrement
 * d'une note < 1 s » (`CDC:1537`). Si l'indexation était comprise dans la
 * requête, la première ligne serait sans objet. Or l'attente coûte 804 ms de
 * médiane — l'intervalle de regroupement des tâches du moteur, mesuré à 793 ms
 * sur 32 notes et 789 ms sur 5 000 : aucune optimisation du produit ne la
 * réduira. La soumission, elle, coûte 6 ms.
 *
 * CE QUI RESTE SYNCHRONE, ET IL NE FAUT PAS LE PERDRE DE VUE. La SOUMISSION est
 * dans la requête et elle lève : moteur arrêté, injoignable ou refusant,
 * l'enregistrement échoue au même endroit qu'avant. `ARB-060` « n'autorise pas à
 * taire un échec de soumission ». Seul le suivi de la tâche disparaît.
 *
 * OÙ LA GARANTIE PERDUE EST REPLACÉE. `attendre()` était le seul juge d'une
 * tâche en échec. Le moteur CONSERVE ses tâches : le contrôle « aucune tâche en
 * échec dans le moteur » de `verif/budgets.mjs` les relève après coup et rougit.
 * Sans lui, `ARB-060` ne serait qu'un desserrage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI RESTE DIFFÉRÉ, ET CE QUI NE L'EST PAS
 *
 * `docs/adr/ADR-009.md`, section « Décision », deuxième puce, mot pour mot :
 * « Le calcul du vecteur est DIFFÉRÉ ; l'écriture dans l'index est SYNCHRONE à
 * l'enregistrement. Une note est trouvable en mots-clés immédiatement, et par le
 * sens quelques secondes plus tard. » L'écriture reste bien commandée dans la
 * requête ; `ARB-060` a tranché que « synchrone » ne pouvait pas vouloir dire
 * « la requête bloque jusqu'à la fin de la tâche du moteur », sous peine de
 * rendre le budget d'1 s du cahier inatteignable par une constante de l'outil.
 *
 * Le même ADR nomme les DEUX briques optionnelles, et le moteur de recherche
 * n'en fait pas partie : ce sont le service d'embeddings (Ollama) et le service
 * Python de conversion. Le moteur est CRITIQUE — `compose.yaml:14` le classe
 * ainsi, et `app` l'attend en `depends_on` avec la base, ce qu'il ne fait pour
 * aucun des deux optionnels.
 *
 * Ce qui reste différé, et que ce module ne rend pas synchrone : le calcul du
 * vecteur. `ADR-009` interdit « toute attente du calcul d'un vecteur avant de
 * déclarer une note enregistrée ou indexée ». Rien ici n'en attend un ; aucun
 * embedder n'est d'ailleurs déclaré (`notes-indexees.ts`, `SENS_DISPONIBLE`).
 *
 * `RG-M05-06` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:731`) : « une note
 * enregistrée est trouvable en recherche dans un délai maximal de 10 secondes ».
 * Le délai n'est jamais attendu par une temporisation (`ADR-006`, dernière
 * conséquence) : il est celui du moteur, mesuré, et il tient avec un facteur
 * douze.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA DISPARITION EST DÉDUITE DE LA BASE, JAMAIS DU PLAN DE L'APPELANT
 *
 * C'est la décision de forme de ce module, et elle porte trois propriétés que
 * l'appelant n'a pas à connaître :
 *
 *  1. UNE NOTE QUI SORT DU PÉRIMÈTRE EST RÉÉCRITE AVEC LE NOUVEAU. Le document
 *     du moteur est REMPLACÉ, pas fusionné — la commande d'ajout du client
 *     remplace l'entrée de même clé primaire, là où la commande de mise à jour
 *     l'aurait fusionnée champ à champ. Une note déplacée dans un dossier
 *     interdit reçoit donc la chaîne d'ancêtres de son NOUVEAU dossier, et le
 *     filtre de `perimetre.ts` cesse de la rendre. `ADR-006` : « le déplacement
 *     d'un dossier ou la modification d'un droit impose une réindexation des
 *     documents concernés : le chemin d'ancêtres projeté doit suivre. »
 *
 *  2. UNE NOTE QUI N'EST PLUS EN BASE EST RETIRÉE. L'appelant ne le déclare pas :
 *     un identifiant demandé que la projection ne rend pas est un identifiant qui
 *     n'existe plus, et il est retiré. Une note supprimée qui resterait indexée
 *     serait atteignable par une requête — `/recherche` lit en base les
 *     identifiants QUE L'INDEX A RENDUS (`donnees/public.ts`), l'index est donc
 *     la barrière, et une entrée périmée est une fuite.
 *
 *  3. UNE TRANSACTION ANNULÉE NE LAISSE RIEN. La simulation d'import annule la
 *     sienne (`donnees/import.ts`, `AnnulationDeSimulation`) : les notes qu'elle
 *     a « créées » ne sont pas en base quand ce module les relit, et rien n'est
 *     donc écrit dans l'index. Aucune branche « en simulation, ne pas faire
 *     ceci » n'est nécessaire — c'est la lecture de la base qui décide, et
 *     `RG-M12-02` exige justement UN SEUL chemin de code.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE NE PROJETTE RIEN LUI-MÊME
 *
 * `projeterLeCorpus()` est le seul code du dépôt qui sache poser un périmètre :
 * il tire la chaîne d'ancêtres de `chaineDAncetres()`, la fonction que la
 * RÉSOLUTION DES DROITS emploie elle-même, et il REFUSE d'indexer une note dont
 * le dossier est hors de l'arborescence. Rien n'en est réécrit ici, ni la
 * requête, ni la chaîne, ni le refus : une seconde projection serait un second
 * périmètre, et le premier faux passerait inaperçu.
 *
 * Le paramètre `identifiants` de `projeterLeCorpus()` (`moteur.ts:144-145`) a été
 * écrit pour ce chemin : « l'indexation synchrone d'une écriture n'a pas à relire
 * le corpus entier ». Ce module est son premier appelant.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ORDRE EST À LA CHARGE DE L'APPELANT, ET IL EST ÉCRIT
 *
 * `retirerDesNotes()` le dit en majuscules dans son en-tête : le retrait suit la
 * validation de la transaction, JAMAIS avant, « de sorte qu'une transaction
 * annulée ne puisse pas laisser un index amputé » (`STACK` §4.8). Ce module ne
 * reçoit ni transaction ni connexion — il ne PEUT donc pas participer à un bloc
 * transactionnel en croyant y être. Mais aucune signature n'empêche un appelant
 * de l'invoquer trop tôt : les trois qui l'appellent le font après, et leur code
 * le dit à l'endroit de l'appel.
 */
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { indexerDesNotes, projeterLeCorpus, retirerDesNotes } from './moteur';

/** Ce que l'entretien a fait — deux nombres, jamais un « c'est fait ». */
export interface RapportDEntretien {
	/** Les notes réécrites dans l'index, avec leur périmètre du moment. */
	readonly indexees: number;
	/** Les identifiants demandés qui n'étaient plus en base, donc retirés. */
	readonly retirees: number;
}

/**
 * ENTRETIENT L'INDEX POUR CES NOTES — et pour elles seules.
 *
 * @param base la base, APRÈS validation de la transaction qui vient d'écrire
 * @param client le client du moteur
 * @param identifiants les notes touchées par l'écriture — celles qui existent
 *   encore sont réécrites, celles qui n'existent plus sont retirées
 * @throws l'erreur de SOUMISSION au moteur — arrêté, injoignable ou refusant.
 *   `ARB-060` retire l'attente de la tâche, jamais la remontée de cet échec-là.
 *   L'échec de la TÂCHE, lui, n'est plus levé ici : il est relevé après coup par
 *   le contrôle « aucune tâche en échec dans le moteur » de `verif/budgets.mjs`
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

	/* Les deux ensembles sont DISJOINTS par construction — une note est en base
	   ou elle n'y est pas —, l'ordre des deux appels est donc sans effet sur
	   l'état final. Il n'y a pas de fenêtre où une entrée serait écrite puis
	   retirée, ni l'inverse.

	   LE RÉGIME EST ÉCRIT ICI, DEUX FOIS, ET C'EST LE LOT `T-076` TOUT ENTIER.
	   `soumettre` : la tâche est posée, pas suivie (`ARB-060`). Les deux seules
	   occurrences du dépôt sont ces deux lignes — partout ailleurs le régime est
	   `attendre`, et `RegimeDeTache` n'a pas de valeur par défaut pour que
	   personne ne puisse en hériter sans l'écrire. */
	const indexees = await indexerDesNotes(client, projetees, 'soumettre');
	const retirees = await retirerDesNotes(client, disparues, 'soumettre');

	return { indexees, retirees };
}
