/**
 * L'AVERTISSEMENT DE DOUBLON À LA SAISIE DU TITRE — `RG-M05-03`.
 *
 * IL PROPOSE, IL NE BLOQUE JAMAIS. `RG-M05-04` est explicite : « les suggestions ne sont
 * jamais appliquées automatiquement ». Rien ici ne touche au titre, au formulaire, ni au
 * bouton d'enregistrement : la note peut être créée malgré l'avis, et l'avis se referme.
 *
 * LES NOTES PROCHES SONT CLIQUABLES, ET C'EST TOUT L'OBJET DU GESTE : un avertissement
 * qui nomme une note sans y mener laisse le rédacteur écrire son doublon quand même. Le
 * lien s'ouvre dans un onglet neuf — celui-ci porte une rédaction en cours.
 *
 * À ZÉRO NOTE, RIEN NE SE PASSE, et surtout aucun bloc vide : `notesProches()` rend une
 * liste vide, et une liste vide RETIRE l'avis au lieu d'en poser un qui dirait qu'il n'a
 * rien trouvé. C'est le cas de l'instance neuve, et c'est celui de la première note.
 */
import { poserUnAvis, retirerUnAvis } from './avis';
import { notesProches, trigrammes, type NoteProche } from './proximite';
import { libelleFraicheur, type EtatDeFraicheur } from '../fraicheur';

export type Debranchement = () => void;

/**
 * Ce que l'avis a besoin de savoir d'une note voisine. La forme est un SOUS-ENSEMBLE de
 * `Note` : le corpus servi par le chargeur la satisfait sans conversion, et ce module
 * n'importe pas le jeu de démonstration pour autant.
 */
export interface NoteVoisine extends EtatDeFraicheur {
	readonly id: string;
	readonly titre: string;
	readonly domaine: string;
}

export interface OptionsDeDoublon {
	/**
	 * LE CORPUS LISIBLE PAR L'APPELANT, celui que le chargeur a déjà servi — jamais une
	 * seconde liste. Son périmètre est posé dans la requête (`ADR-006`) : un rédacteur
	 * ne peut pas apprendre l'existence d'une note qu'il n'a pas le droit d'ouvrir parce
	 * qu'elle ressemble à ce qu'il tape.
	 */
	readonly notes: readonly NoteVoisine[];
	/** L'adresse d'une note, composée par l'appelant — jamais un gabarit réécrit ici. */
	readonly adresse: (id: string) => string;
	/** La note qu'on modifie : elle ne se ressemble pas à elle-même. */
	readonly exclure?: string | null;
	/** Le délai de repos après la frappe, en millisecondes. */
	readonly delai?: number;
}

/** La clé de l'avis, la même qu'à la maquette. */
const CLE = 'doublon';

const DELAI_PAR_DEFAUT = 150;

/** La forme comparée du titre — deux frappes qui la laissent identique ne changent rien. */
function forme(titre: string): string {
	return Array.from(trigrammes(titre)).sort().join('');
}

function phrase(proches: readonly NoteProche<NoteVoisine>[]): string {
	const premiere = proches[0];
	if (premiere === undefined) return '';
	const note = premiere.note;
	const fraicheur = libelleFraicheur(note).toLowerCase();
	const debut = `« ${note.titre} » — ${note.domaine}, ${fraicheur}.`;
	const autres = proches.length - 1;
	const reste =
		autres === 0
			? ''
			: autres === 1
				? ' Une autre note approche aussi.'
				: ` ${autres} autres notes approchent aussi.`;
	return `${debut}${reste} Peut-être vaut-il mieux la compléter que d’en créer une seconde.`;
}

/**
 * LE CÂBLAGE — appelé depuis `onMount` d'une route, après que le titre demandé par
 * l'adresse a été posé. Rend de quoi se défaire.
 */
export function cablerLAvertissementDeDoublon(
	formulaire: HTMLFormElement,
	options: OptionsDeDoublon
): Debranchement {
	const champ = formulaire.querySelector<HTMLTextAreaElement>('#titre');
	if (champ === null) return () => undefined;

	/* La forme du titre que le rédacteur a décidé de garder. Tant qu'il n'y touche
	   pas, l'avis reste fermé : « Continuer quand même » ferme vraiment. */
	let ignoree: string | null = null;
	let minuterie: ReturnType<typeof setTimeout> | null = null;

	const exclure = options.exclure ?? null;

	const verifier = (): void => {
		const titre = champ.value.trim();
		const empreinte = forme(titre);
		if (ignoree !== null && ignoree === empreinte) return;
		ignoree = null;
		const proches = notesProches(titre, options.notes, {
			...(exclure === null ? {} : { exclure: (n: NoteVoisine) => n.id === exclure })
		});
		if (proches.length === 0) {
			retirerUnAvis(formulaire, CLE);
			return;
		}
		const taire = (): void => {
			ignoree = empreinte;
		};
		poserUnAvis(formulaire, {
			cle: CLE,
			variante: 'alerte',
			titre:
				proches.length === 1
					? 'Une note très proche existe déjà'
					: 'Des notes très proches existent déjà',
			texte: phrase(proches),
			liens: proches.map((p) => ({
				libelle: `Ouvrir « ${p.note.titre} »`,
				adresse: options.adresse(p.note.id),
				nouvelOnglet: true
			})),
			actions: [
				{
					libelle: 'Continuer quand même',
					faire: () => {
						taire();
						retirerUnAvis(formulaire, CLE);
					}
				}
			],
			auMasquage: taire
		});
	};

	const differer = (): void => {
		if (minuterie !== null) clearTimeout(minuterie);
		minuterie = setTimeout(verifier, options.delai ?? DELAI_PAR_DEFAUT);
	};

	champ.addEventListener('input', differer);
	/* Un titre collé, ou posé par `?titre=`, n'émet pas toujours de frappe. */
	champ.addEventListener('change', differer);
	verifier();

	return () => {
		if (minuterie !== null) clearTimeout(minuterie);
		champ.removeEventListener('input', differer);
		champ.removeEventListener('change', differer);
	};
}
