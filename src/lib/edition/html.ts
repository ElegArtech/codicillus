/**
 * LE SQUELETTE D'UN GABARIT, DU BALISAGE DU GEL VERS LE FORMAT CANONIQUE.
 *
 * `seeds/corpus.ts` porte, pour chacun des gabarits, un champ `contenu` décrit
 * en propres termes : « contenu HTML du squelette, tel que les maquettes le
 * portent ». C'est ce que le dialogue « Par quoi commencer ? » de V-17 promet
 * d'insérer, et il n'existe pas d'autre écriture de ces squelettes — les
 * reconstruire à la main en blocs canoniques créerait une seconde source, qui
 * divergerait au premier gabarit administré depuis la console (M14).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CONVERSION EST CELLE DE PROSEMIRROR, PAS UNE SECONDE
 *
 * `DOMParser.fromSchema(schemaDeLEditeur)` lit le balisage AVEC LES RÈGLES DU
 * SCHÉMA DU PRODUIT : ce sont les mêmes `parseDOM` que celles par lesquelles un
 * copier-coller entre dans l'éditeur. Aucune correspondance balise → nœud n'est
 * écrite ici, et c'est ce qui garantit qu'un gabarit inséré et un contenu collé
 * ne produisent pas deux documents différents pour le même balisage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SEULE NORMALISATION, ET ELLE EST NOMMÉE — LA LISTE DE TÂCHES
 *
 * Le gel écrit une liste de tâches `ul.taches > li > input[type=checkbox] +
 * span` (`seeds/corpus.ts`, gabarits « Procédure » et « Retour d'incident »).
 * L'extension de la pile, elle, reconnaît la sienne par un attribut de données
 * (`@tiptap/extension-list` : `ul[data-type="taskList"]`, `li[data-type=
 * "taskItem"]`). Les deux écritures décrivent la même chose et ne se
 * rencontrent pas : sans ce passage, une liste de tâches du gel entrerait en
 * liste à puces, SILENCIEUSEMENT — la construction n° 5 du format perdue sans
 * témoin, exactement ce qu'`ADR-003` proscrit.
 *
 * Le transcodage est donc explicite, borné à ce seul cas, et il est fait sur une
 * COPIE du balisage : rien du document servi n'est touché.
 */
import { DOMParser } from '@tiptap/pm/model';
import { schemaDeLEditeur } from './schema';
import { documentDepuisNoeud } from './document';
import type { Document } from '../contenu/document';

/** Réécrit les listes de tâches du gel dans la forme que la pile reconnaît. */
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
