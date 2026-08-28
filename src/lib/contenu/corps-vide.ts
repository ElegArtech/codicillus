/**
 * LE CORPS VIDE DU PRODUIT — un paragraphe sans texte, et rien d'autre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE DÉFINITION VIT ICI, ET PLUS DANS LA SEMENCE
 *
 * `corpsVide()` n'est pas une fonction de semence. C'est la définition, PAR LE
 * PRODUIT, du corps d'une note qui n'en porte pas : celui qu'une note créée
 * sans texte reçoit, celui qu'un registre Opérationnel déclaré mais non rédigé
 * reçoit, celui que l'aperçu de l'éditeur rend quand la zone est absente. Elle
 * a longtemps été écrite dans `../base/semence.ts` parce que la semence fut le
 * premier écrivain à en avoir besoin — et ce voisinage coûtait 85 Ko.
 *
 * `semence.ts` importe `seeds/corpus.ts` EN VALEUR : les 32 notes du jeu de
 * démonstration, titres, auteurs et extraits compris. Tout module qui touchait
 * `corpsVide()` tirait donc le jeu entier derrière lui, et `creation.ts` est
 * importé par dix nœuds de routes. Mesuré sur le paquet du 28/08/2026 :
 * `build/server/chunks/chunks/creation.js` pesait 85 314 octets et portait le
 * corpus sérialisé en entier — dans l'image Docker, dans ce que
 * `node build/index.js` exécute.
 *
 * D'où la règle que ce fichier tient : IL N'IMPORTE RIEN DE `seeds/`, ni en
 * valeur ni en type, et sa seule dépendance est le format canonique du
 * document. La semence, elle, s'y rattache comme n'importe quel autre appelant.
 */
import { analyserDocument, type Document } from './document';

/**
 * Le corps d'une note sans texte : un unique paragraphe vide.
 *
 * Le document est VALIDÉ avant d'être rendu : `ADR-003` interdit « toute
 * écriture directe en base d'un document non validé par le schéma
 * ProseMirror », et une note créée sans corps est une écriture comme une autre.
 *
 * C'est aussi le seul document vide que le produit sache produire :
 * `analyserMarkdown('')` LÈVE, et un document sans `content` est refusé. Le
 * chemin « pas de texte » passe donc ici, jamais par l'analyseur de Markdown.
 */
export function corpsVide(): Document {
	return analyserDocument({ type: 'doc', content: [{ type: 'paragraph' }] });
}
