/**
 * LA PROXIMITÉ DE DEUX TITRES — `RG-M05-03`, « avertissement de doublon sémantique à la
 * saisie du titre ». Ce module CALCULE, il n'affiche rien et ne décide rien :
 * `doublons.ts` porte le geste d'écran, et `RG-M05-04` — « les suggestions ne sont jamais
 * appliquées automatiquement » — tient parce que rien ici ne touche à une note.
 *
 * PAR TRIGRAMMES, ET SANS DÉPENDANCE NOUVELLE. La mesure est celle de `pg_trgm` : le
 * titre est réduit à ses lettres et ses chiffres, découpé en mots, et chaque mot rend les
 * suites de trois caractères d'un cadre de deux blancs devant et un derrière. Le cadre
 * n'est pas décoratif — c'est lui qui fait compter les DÉBUTS de mots, sans quoi deux
 * titres qui partagent leurs racines mais pas leurs mots se ressembleraient trop.
 *
 * POURQUOI PAS LES MOTS COMMUNS, la mesure de la maquette : elle exige l'égalité exacte
 * des mots. « postgres » n'y rencontre jamais « PostgreSQL », et la faute de frappe — le
 * cas même que l'avertissement doit attraper — passe sans être vue.
 *
 * LA COMPARAISON PORTE SUR CE QUE L'APPELANT PEUT LIRE, ET C'EST L'APPELANT QUI LE
 * GARANTIT : ce module reçoit une liste, il ne va pas la chercher. Le corpus servi aux
 * deux éditeurs vient de `lireLeCorpusLisible()`, dont le périmètre est dans la requête
 * (`ADR-006`). Faire la proximité sur le corpus entier apprendrait à un rédacteur
 * l'existence d'une note qu'il n'a pas le droit d'ouvrir.
 */

/**
 * LE SEUIL, ET CE QUI L'A FIXÉ. Mesuré le 31/08/2026 sur douze paires réelles.
 *
 * TROIS PROCHES, qui doivent avertir : « Restaurer une sauvegarde PostgreSQL » contre
 * « restaurer une sauvegarde postgres » rend 0,89 ; contre « Restauration d'une
 * sauvegarde PostgreSQL », 0,74 ; contre « Sauvegarde PostgreSQL : restauration », 0,68.
 *
 * TROIS ÉLOIGNÉES, qui doivent se taire : contre « Configurer le VPN du siège », 0,07 ;
 * contre « Renouveler le certificat TLS », 0,07 ; contre « Sauvegarde des machines
 * virtuelles », 0,19.
 *
 * CE QUI A TRANCHÉ ENTRE LES DEUX GROUPES, C'EST UN QUATRIÈME CAS : deux titres qui
 * partagent tout leur squelette et s'opposent par un seul mot — « Créer un compte
 * utilisateur » contre « Supprimer un compte utilisateur » — mesurent 0,63. Ce ne sont
 * PAS des doublons, et un seuil plus bas les aurait signalés à chaque création de
 * procédure symétrique. 0,65 les laisse passer sans perdre la plus lointaine des trois
 * proches.
 *
 * Le seuil ne se règle pas en console : `RG-M05-03` n'en fait pas un paramètre, et un
 * réglage que personne ne sait interpréter serait un cadran de plus.
 */
export const SEUIL_DE_PROXIMITE = 0.65;

/** Combien de notes proches l'avertissement montre au plus. */
export const NOTES_PROCHES_AU_PLUS = 3;

/**
 * Les trigrammes d'un titre. Un titre sans lettre ni chiffre n'en a aucun, et la
 * proximité qui s'ensuit est nulle : c'est ce qui fait taire l'avertissement tant que le
 * champ est vide ou ne porte que de la ponctuation.
 */
export function trigrammes(titre: string): ReadonlySet<string> {
	const jeu = new Set<string>();
	const reduit = titre
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
	if (reduit === '') return jeu;
	for (const mot of reduit.split(' ')) {
		const cadre = `  ${mot} `;
		for (let debut = 0; debut + 3 <= cadre.length; debut += 1) {
			jeu.add(cadre.slice(debut, debut + 3));
		}
	}
	return jeu;
}

/**
 * La proximité de deux titres, entre 0 et 1 — l'indice de Jaccard de leurs trigrammes.
 * SYMÉTRIQUE, et ce n'est pas un détail : une mesure qui diviserait par la taille du seul
 * titre saisi ferait de « Restaurer » un quasi-doublon de tout titre qui le contient, et
 * l'avertissement se lèverait au dixième caractère frappé.
 */
export function proximiteDeTitres(gauche: string, droite: string): number {
	const a = trigrammes(gauche);
	const b = trigrammes(droite);
	if (a.size === 0 || b.size === 0) return 0;
	let communs = 0;
	for (const trigramme of a) if (b.has(trigramme)) communs += 1;
	const union = a.size + b.size - communs;
	return union === 0 ? 0 : communs / union;
}

/** Le minimum qu'une note doit porter pour être comparée — sa forme, pas son type. */
export interface NoteComparable {
	readonly titre: string;
}

export interface NoteProche<T extends NoteComparable> {
	readonly note: T;
	readonly proximite: number;
}

export interface OptionsDeProximite<T extends NoteComparable> {
	readonly seuil?: number;
	readonly maximum?: number;
	/** La note à ne pas comparer à elle-même — celle qu'on est en train de modifier. */
	readonly exclure?: (note: T) => boolean;
}

/**
 * Les notes proches d'un titre, de la plus proche à la moins proche.
 *
 * VIDE EST UNE RÉPONSE ORDINAIRE : une instance neuve n'a aucune note, et un titre qui ne
 * ressemble à rien n'en a pas non plus. L'écran ne doit alors RIEN montrer — pas un bloc
 * vide, pas un « aucune note proche ».
 */
export function notesProches<T extends NoteComparable>(
	titre: string,
	notes: readonly T[],
	options: OptionsDeProximite<T> = {}
): readonly NoteProche<T>[] {
	const seuil = options.seuil ?? SEUIL_DE_PROXIMITE;
	const maximum = options.maximum ?? NOTES_PROCHES_AU_PLUS;
	const saisi = trigrammes(titre);
	if (saisi.size === 0) return [];
	const trouvees: NoteProche<T>[] = [];
	for (const note of notes) {
		if (options.exclure?.(note) === true) continue;
		const proximite = proximiteDeTitres(titre, note.titre);
		if (proximite < seuil) continue;
		trouvees.push({ note, proximite });
	}
	return trouvees.sort((a, b) => b.proximite - a.proximite).slice(0, maximum);
}
