/**
 * LES NOMS DES CHAMPS DES TROIS GESTES DE DROITS — posés par la ROUTE, jamais par
 * la vue (`ARB-063`), et écrits ici parce que DEUX fichiers de la route les
 * emploient : `+page.svelte` les pose, `+page.server.ts` les lit.
 *
 * POURQUOI LE NIVEAU PORTE L'IDENTIFIANT DU COMPTE DANS SON NOM. Les trois
 * dialogues vivent dans le MÊME formulaire, fermés, et TOUS les champs voyagent à
 * CHAQUE soumission ; la liste des droits porte un sélecteur de niveau PAR LIGNE.
 * Nommés pareil, ils enverraient tous leur valeur, et l'action lirait celle d'une
 * autre ligne. Le nom porte donc l'identifiant de connexion du compte concerné :
 * la collision est impossible par construction, non par ordre de rendu.
 *
 * LE COMPTE VISÉ, LUI, VOYAGE PAR LE SOUMETTEUR — `soumettreVers()` pose son
 * `name` et sa `value` sur le bouton caché, et un formulaire n'envoie QUE le
 * soumetteur qui l'a déclenché.
 */

/** Le compte que le geste vise, porté par le soumetteur. */
export const NOM_DU_COMPTE_VISE = 'compte-vise';

export function nomDuNiveau(identifiantDuCompte: string): string {
	return `niveau-de:${identifiantDuCompte}`;
}
