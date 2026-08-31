/**
 * LES DEUX PORTES DE L'ÉDITEUR — entrer un document, en ressortir un. `ADR-003`
 * interdit « toute écriture directe en base d'un document non validé par le schéma
 * ProseMirror » : rien ne sort de l'éditeur sans passer par `analyserDocument`, et
 * rien n'y entre sans que le schéma de l'éditeur ait pu le porter ENTIÈREMENT.
 *
 * LE SENS SORTANT — `documentDepuisNoeud` appelle `analyserDocument(noeud.toJSON())`,
 * et rien d'autre : aucune normalisation, aucun repli, un document mal produit est
 * REFUSÉ, jamais réparé. Réparer ici ferait de l'éditeur un second lieu où le format
 * se décide. `Node.toJSON` émet les attributs en TOTALITÉ et n'émet ni `content` ni
 * `marks` vides — les règles 1 et 2 du format —, les deux formes coïncident donc par
 * construction, non par précaution.
 *
 * LE SENS ENTRANT — `Node.fromJSON` est INDULGENT sur deux points, et les deux sont
 * des pertes de donnée sans témoin : un attribut que le schéma ne déclare pas est
 * IGNORÉ (d'où l'appel d'`analyserDocument` EN PREMIER, qui refuse tout attribut
 * inconnu), et un contenu structurellement invalide n'est PAS contrôlé par `create` —
 * seul `check()` le fait, il est donc appelé. Une MARQUE inconnue fait bien lever
 * ProseMirror, mais son message ne dit pas ce que cela coûte : il est remplacé par un
 * refus qui NOMME la marque, le chemin et la raison.
 *
 * CE N'EST PAS UN SECOND CONVERTISSEUR (`ADR-004`) : ce module ne produit ni ne lit
 * de Markdown, il fait passer un document canonique dans la représentation en mémoire
 * de ProseMirror, et retour.
 */
import { Node as NoeudProseMirror } from 'prosemirror-model';
import { analyserDocument, type Document } from '../contenu/document';
import { MARQUES_DU_FORMAT_SANS_EXTENSION, schemaDeLEditeur } from './schema';

/**
 * LE REFUS DE L'ÉDITEUR — distinct de `DocumentInvalide`. Celui-là dit « ce document
 * n'est pas du format » ; celui-ci dit « il EST du format, et l'éditeur ne sait pas
 * le porter ». Ni la même faute, ni le même responsable, ni la même réparation : les
 * confondre ferait passer une lacune d'outillage pour une donnée corrompue.
 */
export class EditeurIncapable extends Error {
	readonly manque: readonly string[];

	constructor(manque: readonly string[], detail: string) {
		super(
			`l’éditeur ne sait pas porter ce document — ${manque.join(', ')} : ${detail}. ` +
				'Le document n’est pas en cause : il est valide au sens des sept règles. ' +
				'Il est REFUSÉ à l’ouverture plutôt qu’ouvert amputé — une marque perdue à ' +
				'l’ouverture serait réécrite en base à l’enregistrement suivant, sans témoin.'
		);
		this.name = 'EditeurIncapable';
		this.manque = manque;
	}
}

/**
 * Les marques du document que le schéma de l'éditeur ne connaît pas, dans l'ordre de
 * première rencontre. Le parcours est celui du JSON, sans passer par ProseMirror : il
 * faut savoir CE QUI manque avant de tenter de construire.
 */
function marquesInconnues(valeur: unknown): readonly string[] {
	const vues: string[] = [];
	const parcourir = (n: unknown): void => {
		if (n === null || typeof n !== 'object') return;
		if (Array.isArray(n)) {
			for (const e of n) parcourir(e);
			return;
		}
		const noeud = n as { type?: unknown; marks?: unknown; content?: unknown };
		if (Array.isArray(noeud.marks)) {
			for (const m of noeud.marks) {
				const type = (m as { type?: unknown }).type;
				if (typeof type !== 'string') continue;
				if (schemaDeLEditeur.marks[type] === undefined && !vues.includes(type)) vues.push(type);
			}
		}
		parcourir(noeud.content);
	};
	parcourir(valeur);
	return vues;
}

/**
 * L'ENTRÉE DE L'ÉDITEUR — un document canonique devient l'arbre que ProseMirror
 * manipule.
 *
 * @throws DocumentInvalide — la valeur n'est pas un document du format
 * @throws EditeurIncapable — elle l'est, et l'éditeur ne sait pas la porter
 */
export function noeudDepuisDocument(valeur: unknown): NoeudProseMirror {
	/* D'ABORD la porte du format : ce qui n'est pas un document n'a pas à être
	   diagnostiqué comme une lacune de l'éditeur. */
	const document = analyserDocument(valeur);

	const inconnues = marquesInconnues(document);
	if (inconnues.length > 0) {
		throw new EditeurIncapable(
			inconnues,
			`aucune des ${MARQUES_DU_FORMAT_SANS_EXTENSION.length} extension(s) manquante(s) ` +
				'n’est installée, et le contrat de ce lot interdit d’en poser une'
		);
	}

	const noeud = NoeudProseMirror.fromJSON(schemaDeLEditeur, document);
	/* `fromJSON` ne contrôle pas l'expression de contenu ; `check` le fait, et
	   lève. Sans cet appel, un document que l'éditeur ne peut pas éditer
	   s'ouvrirait et se réenregistrerait déformé. */
	noeud.check();
	return noeud;
}

/**
 * LA SORTIE DE L'ÉDITEUR — l'arbre ProseMirror redevient un document canonique,
 * validé par la porte unique.
 *
 * @throws DocumentInvalide — l'éditeur a produit ce que le format refuse
 */
export function documentDepuisNoeud(noeud: NoeudProseMirror): Document {
	return analyserDocument(noeud.toJSON());
}

/**
 * L'éditeur sait-il porter ce document ? Rend la liste de ce qui manque, vide
 * si tout passe. Sert au diagnostic — un chargeur qui veut DIRE pourquoi une
 * note ne s'ouvre pas plutôt que de lever.
 */
export function cequeLEditeurNeSaitPasPorter(document: Document): readonly string[] {
	return marquesInconnues(document);
}
