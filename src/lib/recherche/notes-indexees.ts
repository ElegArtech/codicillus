/**
 * Ce qui est écrit dans l'index — une entrée par note, et son PÉRIMÈTRE avec elle.
 *
 * `ADR-006` interdit « toute réindexation qui écrirait un document sans son chemin d'ancêtres :
 * un document indexé sans périmètre est un document public ». Le type de ce module rend cette
 * faute inatteignable — `dossier`, `ancetres`, `visibilite` et `statut` sont OBLIGATOIRES. Le
 * mot « document » est celui du MOTEUR : les types, fichiers et commandes disent NOTE.
 *
 * TROIS REFUS, AUCUN OUBLI :
 *
 *  1. LA FRAÎCHEUR. Une colonne `fraicheur` dans l'index serait une seconde définition, et
 *     pire : GELÉE À L'INSTANT DE L'INDEXATION. Ce sont donc les INSTANTS qui sont indexés, et
 *     la facette « fraîcheur » de §4.2 n'est pas une facette d'index.
 *  2. LE CORPS DES DEUX REGISTRES. Les champs cherchables sont EXACTEMENT ceux que la maquette
 *     cherche ; indexer le corps ferait trouver des notes que la fabrique du gel rejette.
 *     Conséquence : `RG-M02-02` n'a pas de quoi se décider.
 *  3. LES VECTEURS. Aucun n'existe, et `SENS_DISPONIBLE` en est DÉRIVÉ.
 */
import type { Settings } from 'meilisearch';

/** Le nom de l'index du corpus. `STACK` §4.2 : « un index unique pour le corpus ». */
export const NOM_DE_L_INDEX = 'notes';

/**
 * L'index de reconstruction, employé le temps d'une réindexation puis échangé avec le
 * précédent : l'échange est ce qui fait qu'aucune requête ne rencontre jamais un index
 * à moitié rempli.
 */
export const NOM_DE_L_INDEX_EN_RECONSTRUCTION = 'notes-en-reconstruction';

/** La clé primaire de l'index : l'identifiant de la note, celui des adresses. */
export const CLE_PRIMAIRE = 'id';

/**
 * Une note, telle que l'index la porte. Les quatre champs de périmètre sont obligatoires
 * (`ADR-006`). Les instants sont des millisecondes depuis l'époque : le moteur trie et filtre
 * des nombres. Le type est un ALIAS et non une interface, et ce détail est fonctionnel : le
 * client du moteur contraint ses entrées à porter une signature d'index, qu'un alias fournit.
 */
export type NoteIndexee = {
	readonly id: string;
	readonly titre: string;
	readonly extrait: string;
	readonly auteur: string;
	readonly type: string;
	/** `null` quand la note n'est pas une fiche. */
	readonly typeFiche: string | null;
	readonly univers: string;
	readonly domaine: string;
	readonly etiquettes: readonly string[];
	/* ── Le périmètre. Aucun de ces quatre champs n'est optionnel. ────────── */
	readonly dossier: string;
	/**
	 * La chaîne d'ancêtres, du dossier porteur jusqu'à la racine — l'ordre de
	 * `RG-DRO-01`. Elle contient le dossier porteur lui-même, et le périmètre se lit
	 * sur ce dossier, jamais sur un ancêtre seul.
	 */
	readonly ancetres: readonly string[];
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
	/* ── Ce qui permet de trier. Des instants, jamais un niveau calculé. ──── */
	readonly modifieLe: number;
	/** `null` : jamais vérifiée (`RG-M06-01`). */
	readonly verifieLe: number | null;
	readonly consultations: number;
};

/**
 * Les champs cherchables sont ceux de la maquette, un pour un : titre, extrait, étiquettes,
 * domaine, type de fiche — dans cet ordre, qui fixe la priorité des attributs dans le
 * classement du moteur. Les vues gelées portent leur PROPRE fabrique de correspondance :
 * indexer un champ de plus ferait remonter des notes que l'écran écarterait ensuite.
 */
export const CHAMPS_CHERCHABLES: readonly string[] = [
	'titre',
	'extrait',
	'etiquettes',
	'domaine',
	'typeFiche'
];

/**
 * Les champs filtrables — le périmètre d'abord, les facettes ensuite. Sans les quatre champs
 * de périmètre déclarés filtrables, le moteur REFUSE le filtre : l'index ne peut donc pas être
 * interrogé sans périmètre par oubli de réglage. `docs/routes.md` §4.2 nomme sept facettes ;
 * six sont ici — la septième, `fraicheur`, ne peut pas être un champ de l'index.
 */
export const CHAMPS_FILTRABLES: readonly string[] = [
	'dossier',
	'ancetres',
	'visibilite',
	'statut',
	'univers',
	'domaine',
	'type',
	'typeFiche',
	'etiquettes',
	'auteur'
];

/**
 * LES CHAMPS TRIABLES — les quatre tris de `docs/routes.md` §4.2 qui ne sont pas
 * la pertinence : modification, vérification, consultations, alphabétique. La
 * pertinence n'est pas un champ, c'est le classement par défaut du moteur.
 */
export const CHAMPS_TRIABLES: readonly string[] = [
	'modifieLe',
	'verifieLe',
	'consultations',
	'titre'
];

/**
 * LES RÉGLAGES DE L'INDEX.
 *
 * `embedders` N'Y EST PAS, ET C'EST LE POINT : le mode « Sens » du moteur exige un embedder
 * déclaré. Son absence est la condition mécanique de son indisponibilité, et `SENS_DISPONIBLE`
 * la lit plus bas au lieu de l'affirmer.
 *
 * `pagination.maxTotalHits` gouverne le nombre total que le moteur consent à compter — donc le
 * compteur global de `RG-M02-08` —, et `PLAFOND_DE_RESULTATS` en dépend.
 */
export const REGLAGES_DE_L_INDEX: Settings = {
	searchableAttributes: [...CHAMPS_CHERCHABLES],
	filterableAttributes: [...CHAMPS_FILTRABLES],
	sortableAttributes: [...CHAMPS_TRIABLES]
};

/**
 * LE MODE « SENS » EST-IL DISPONIBLE ? — un CONSTAT, dérivé des réglages.
 *
 * `P-10` : dégradation, jamais panne. `P-02` : aucune valeur illustrative — un mode « Sens »
 * qui rendrait en réalité des résultats de mots-clés serait une simulation indétectable. La
 * valeur n'est pas écrite : elle est LIÉE à la seule condition qui la rende vraie.
 *
 * Le gel porte déjà cet état et sa phrase : V-08 pose son mode en mots-clés, se déclare
 * dégradée et affiche « Recherche par sens momentanément indisponible ». `RG-M02-01` exige que
 * la bascule soit ANNONCÉE, pas silencieuse.
 */
export const SENS_DISPONIBLE: boolean = REGLAGES_DE_L_INDEX.embedders !== undefined;
