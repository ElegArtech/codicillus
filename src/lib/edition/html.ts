/**
 * LE SQUELETTE D'UN GABARIT, DU BALISAGE DU GEL VERS LE FORMAT CANONIQUE.
 *
 * `seeds/corpus.ts` porte, pour chaque gabarit, un champ `contenu` — « contenu HTML
 * du squelette, tel que les maquettes le portent ». Il n'existe pas d'autre écriture
 * de ces squelettes : les reconstruire à la main en blocs canoniques créerait une
 * seconde source, qui divergerait au premier gabarit administré depuis la console.
 *
 * LA CONVERSION EST CELLE DE PROSEMIRROR : `DOMParser.fromSchema(schemaDeLEditeur)`
 * lit le balisage avec les mêmes `parseDOM` que celles par lesquelles un
 * copier-coller entre dans l'éditeur. Aucune correspondance balise → nœud n'est
 * écrite ici.
 *
 * LA SEULE NORMALISATION EST LA LISTE DE TÂCHES : le gel écrit
 * `ul.taches > li > input[type=checkbox] + span`, l'extension de la pile reconnaît la
 * sienne par un attribut de données. Les deux décrivent la même chose et ne se
 * rencontrent pas — sans ce passage, une liste de tâches du gel entrerait en liste à
 * puces SILENCIEUSEMENT. Le transcodage est borné à ce cas et fait sur une COPIE.
 */
import { DOMParser } from '@tiptap/pm/model';
import { schemaDeLEditeur } from './schema';
import { documentDepuisNoeud } from './document';
import type { Document } from '../contenu/document';

function normaliserLesListesDeTaches(racine: HTMLElement): void {
	for (const liste of Array.from(racine.querySelectorAll('ul.taches'))) {
		liste.setAttribute('data-type', 'taskList');
		for (const element of Array.from(liste.children)) {
			if (element.tagName !== 'LI') continue;
			const case_ = element.querySelector('input[type="checkbox"]');
			const coche = case_ !== null && case_.hasAttribute('checked');
			case_?.remove();
			element.setAttribute('data-type', 'taskItem');
			element.setAttribute('data-checked', coche ? 'true' : 'false');
			/* `taskItem` attend des BLOCS ; le gel écrit son libellé dans un
			   `span`, donc en ligne. Le paragraphe est ajouté, jamais supposé. */
			if (element.querySelector('p') === null) {
				const paragraphe = racine.ownerDocument.createElement('p');
				while (element.firstChild !== null) paragraphe.appendChild(element.firstChild);
				element.appendChild(paragraphe);
			}
		}
	}
}

/**
 * LE DOCUMENT CANONIQUE D'UN SQUELETTE HTML.
 *
 * @param html le balisage du gabarit, tel que le référentiel le porte
 * @param document le document du navigateur — jamais un global implicite : ce
 *   module est importé par des routes rendues aussi côté serveur, où il n'en
 *   existe aucun.
 * @throws DocumentInvalide si le balisage produit un document que le format
 *   refuse. Rien n'est réparé (`ADR-003`).
 */
export function documentDepuisHtml(html: string, document: globalThis.Document): Document {
	const porteur = document.createElement('div');
	porteur.innerHTML = html;
	normaliserLesListesDeTaches(porteur);
	const noeud = DOMParser.fromSchema(schemaDeLEditeur).parse(porteur);
	return documentDepuisNoeud(noeud);
}
