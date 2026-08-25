/**
 * LES NOMS DES CHAMPS DES TROIS GESTES DE DROITS — posés par la ROUTE, jamais
 * par la vue (`ARB-063`), et écrits ici parce que DEUX fichiers de la route les
 * emploient : `+page.svelte` les pose, `+page.server.ts` les lit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI LE NIVEAU PORTE L'IDENTIFIANT DU COMPTE DANS SON NOM
 *
 * Les trois dialogues de cette page vivent dans le MÊME formulaire, fermés, et
 * TOUS les champs voyagent à CHAQUE soumission — le commentaire de `NOMS`
 * (`+page.svelte`) le dit déjà pour les trois champs du gel. La liste des droits
 * porte un sélecteur de niveau PAR LIGNE : nommés pareil, ils enverraient tous
 * leur valeur, et l'action lirait celle d'une autre ligne. Le nom porte donc
 * l'identifiant de connexion du compte que la ligne concerne, ce qui rend la
 * collision impossible par construction plutôt que par ordre de rendu.
 *
 * LE COMPTE VISÉ, LUI, VOYAGE PAR LE SOUMETTEUR — `soumettreVers()` pose son
 * `name` et sa `value` sur le bouton caché qui soumet, et un formulaire n'envoie
 * QUE le soumetteur qui l'a déclenché. C'est ce qui permet à trois lignes de
 * droits et au sélecteur d'ajout de coexister sans qu'aucun nom soit ambigu.
 */

/** Le compte que le geste vise, porté par le soumetteur. */
export const NOM_DU_COMPTE_VISE = 'compte-vise';

/** Le nom du sélecteur de niveau de la ligne d'un compte. */
export function nomDuNiveau(identifiantDuCompte: string): string {
	return `niveau-de:${identifiantDuCompte}`;
}
