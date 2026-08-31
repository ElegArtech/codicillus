/**
 * LE CORPS VIDE DU PRODUIT — un paragraphe sans texte, et rien d'autre.
 *
 * `corpsVide()` n'est pas une fonction de semence : c'est la définition, PAR LE PRODUIT, du
 * corps d'une note qui n'en porte pas. Elle a longtemps été écrite dans `../base/semence.ts`
 * parce que la semence fut le premier écrivain à en avoir besoin — et ce voisinage coûtait
 * 85 Ko : `semence.ts` importe `seeds/corpus.ts` EN VALEUR, donc tout module qui touchait
 * `corpsVide()` tirait le jeu entier derrière lui, `creation.ts` compris, importé par dix
 * nœuds de routes.
 *
 * D'où la règle que ce fichier tient : IL N'IMPORTE RIEN DE `seeds/`, ni en valeur ni en type,
 * et sa seule dépendance est le format canonique du document.
 */
import { analyserDocument, type Document } from './document';

/**
 * Le corps d'une note sans texte : un unique paragraphe vide. Le document est VALIDÉ avant
 * d'être rendu : `ADR-003` interdit « toute écriture directe en base d'un document non validé
 * par le schéma ProseMirror ». C'est aussi le seul document vide que le produit sache
 * produire : `analyserMarkdown('')` LÈVE, et un document sans `content` est refusé.
 */
export function corpsVide(): Document {
	return analyserDocument({ type: 'doc', content: [{ type: 'paragraph' }] });
}
