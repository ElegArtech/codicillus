/**
 * L'ENTRETIEN DE L'INDEX PAR LES CHEMINS D'ÉCRITURE — le geste unique que toute
 * écriture de note appelle APRÈS avoir validé sa transaction.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI IL EST SYNCHRONE, ET CE QUI RESTE DIFFÉRÉ
 *
 * `docs/adr/ADR-009.md`, section « Décision », deuxième puce, mot pour mot :
 * « Le calcul du vecteur est DIFFÉRÉ ; l'écriture dans l'index est SYNCHRONE à
 * l'enregistrement. Une note est trouvable en mots-clés immédiatement, et par le
 * sens quelques secondes plus tard. »
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
 * L'attente est EXPLICITE — `attendre()` de `moteur.ts` suit la tâche du moteur
 * jusqu'à son état terminal —, jamais une temporisation (`ADR-006`, dernière
 * conséquence). Quand cette promesse rend, la note est trouvable.
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
 * @throws l'erreur de la tâche du moteur — `attendre()` ne tait aucun échec :
 *   « un échec d'indexation silencieux est le pire des états » (`moteur.ts`)
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
	   retirée, ni l'inverse. */
	const indexees = await indexerDesNotes(client, projetees);
	const retirees = await retirerDesNotes(client, disparues);

	return { indexees, retirees };
}
