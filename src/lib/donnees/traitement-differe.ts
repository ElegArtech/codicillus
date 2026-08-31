/**
 * `RG-NF-03` (`CDC:1554`) — « LORSQU'UN TRAITEMENT EST DIFFÉRÉ, L'UTILISATEUR EN EST
 * INFORMÉ. »
 *
 * LE PRODUIT A EXACTEMENT UN TRAITEMENT DIFFÉRÉ, ET IL EST DÉCLARÉ : l'indexation de
 * recherche. `src/lib/recherche/entretien.ts` SOUMET la tâche au moteur et ne l'attend
 * pas (`ARB-060`) — l'enregistrement rend la main avant que la note soit trouvable. Rien
 * ne le disait : on enregistrait, on cherchait le titre qu'on venait d'écrire, et on ne
 * le trouvait pas.
 *
 * CE QUI N'EST PAS DIFFÉRÉ, ET QUE LE MESSAGE NE DOIT DONC PAS LAISSER CROIRE : l'écriture
 * en base est synchrone. La note est lisible, modifiable et reliable à l'instant où la page
 * s'affiche ; seule sa présence dans les RÉSULTATS DE RECHERCHE attend le moteur.
 *
 * POURQUOI UN PARAMÈTRE D'ADRESSE ET NON UN ÉTAT DE SESSION : l'enregistrement finit par
 * une redirection 303 vers la note, et une redirection ne transporte rien d'autre que son
 * adresse. Le paramètre est LU PUIS OUBLIÉ — il ne change ni le rendu de la note, ni ce que
 * le chargeur va chercher, et une adresse partagée avec lui affiche une bulle de trop, sans
 * plus.
 *
 * AUCUNE DURÉE N'EST ANNONCÉE. `RG-M05-06` donne dix secondes au moteur ; le produit ne les
 * mesure pas et ne les promet pas. « Quelques secondes » est ce qu'on sait.
 */
import type { Notification } from '../coquille/notifications';

/** Le drapeau que la redirection d'enregistrement porte. */
export const PARAMETRE_ENREGISTREE = 'enregistree';

/**
 * L'adresse d'une note, suivie du drapeau d'enregistrement. Une fabrique plutôt qu'une
 * concaténation chez chacun des deux appelants : deux chaînes écrites à la main
 * finiraient par différer d'un caractère, et la bulle ne sortirait que d'un des deux
 * chemins d'écriture.
 */
export function adresseApresEnregistrement(adresseDeLaNote: string): string {
	return `${adresseDeLaNote}?${PARAMETRE_ENREGISTREE}=1`;
}

/**
 * LA BULLE, ET SON TEXTE — une seule rédaction. `info`, jamais `succes` : l'écriture
 * réussie est déjà dite par la page qui s'affiche ; ce que cette bulle ajoute est ce qui
 * n'est PAS encore fait.
 */
export const NOTIFICATION_INDEXATION_DIFFEREE: Notification = {
	type: 'info',
	titre: 'Note enregistrée — indexation en cours',
	detail:
		'Le contenu est enregistré et lisible dès maintenant. Son indexation pour la recherche est différée : la note peut n’apparaître dans les résultats que quelques secondes plus tard.'
};

/**
 * Les notifications à rendre pour cette adresse — une, ou aucune. Une LISTE, parce que
 * c'est la forme que la coquille attend, et parce qu'un second traitement différé
 * viendrait s'y ajouter sans changer la signature.
 */
export function notificationsDeLAdresse(parametres: URLSearchParams): readonly Notification[] {
	return parametres.has(PARAMETRE_ENREGISTREE) ? [NOTIFICATION_INDEXATION_DIFFEREE] : [];
}
