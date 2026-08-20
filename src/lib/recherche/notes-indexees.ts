/**
 * CE QUI EST ÉCRIT DANS L'INDEX — une entrée par note, et son PÉRIMÈTRE avec
 * elle.
 *
 * `ADR-006`, dernière interdiction de sa liste : « toute réindexation qui
 * écrirait un document sans son chemin d'ancêtres : un document indexé sans
 * périmètre est un document public ». Le type de ce module rend cette faute
 * inatteignable — `dossier`, `ancetres`, `visibilite` et `statut` sont des
 * champs OBLIGATOIRES, non optionnels : une entrée sans périmètre ne se
 * construit pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MOT « DOCUMENT » EST CELUI DU MOTEUR, PAS CELUI DU PRODUIT
 *
 * `CLAUDE.md` §3 : l'unité de connaissance est une NOTE — « jamais document,
 * page ou article », et le vocabulaire est contractuel « ni dans l'interface,
 * ni dans le code, ni dans les noms de tables, de colonnes, de routes, de types
 * ou de fichiers ». Le moteur, lui, appelle « document » ce qu'il indexe :
 * c'est le nom de SON interface de programmation, et il n'entre pas dans le
 * vocabulaire du produit. Les types, les fichiers et les commandes de ce
 * sous-système disent NOTE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI N'EST PAS INDEXÉ, ET POURQUOI — TROIS REFUS, AUCUN OUBLI
 *
 *   1. LA FRAÎCHEUR. `P-01` : « il n'existe qu'une seule définition du calcul
 *      de fraîcheur », et `ADR-005` l'a posée en interdiction active. Une
 *      colonne `fraicheur` dans l'index en serait une seconde — et pire qu'une
 *      seconde : une définition GELÉE À L'INSTANT DE L'INDEXATION, qui
 *      vieillirait sans que rien ne la recalcule. Ce sont donc les INSTANTS qui
 *      sont indexés (`verifieLe`, `modifieLe`), à partir desquels l'unique
 *      fabrique calcule. Conséquence assumée et déclarée : la FACETTE
 *      « fraîcheur » de `docs/routes.md` §4.2 n'est pas une facette d'index.
 *
 *   2. LE CORPS DES DEUX REGISTRES. Les champs cherchables sont EXACTEMENT ceux
 *      que la maquette cherche — voir plus bas. Indexer le corps ferait trouver
 *      au moteur des notes que la fabrique du gel rejette, et l'écran, qui est
 *      la loi, ne les afficherait pas : deux correspondances concurrentes pour
 *      un seul résultat visible. Conséquence déclarée : `RG-M02-02` — « un
 *      résultat dont la correspondance a été trouvée dans le corps Opérationnel
 *      ouvre le registre opérationnel » — n'a pas de quoi se décider.
 *
 *   3. LES VECTEURS. Aucun n'existe : le service d'embeddings est optionnel, le
 *      modèle n'est pas fixé (`compose.yaml`), et rien dans ce lot ne les
 *      calcule. Les réglages ne déclarent donc AUCUN embedder, et
 *      `SENS_DISPONIBLE` en est DÉRIVÉ plus bas : le mode « Sens » se déclare
 *      indisponible parce que la condition mécanique de sa disponibilité est
 *      absente, non parce qu'un booléen a été écrit à la main.
 */
import type { Settings } from 'meilisearch';

/** Le nom de l'index du corpus. `STACK` §4.2 : « un index unique pour le corpus ». */
export const NOM_DE_L_INDEX = 'notes';

/**
 * L'index de reconstruction, employé le temps d'une réindexation puis échangé
 * avec le précédent. Voir `reindexer()` : l'échange est ce qui fait qu'aucune
 * requête ne rencontre jamais un index à moitié rempli.
 */
export const NOM_DE_L_INDEX_EN_RECONSTRUCTION = 'notes-en-reconstruction';

/** La clé primaire de l'index : l'identifiant de la note, celui des adresses. */
export const CLE_PRIMAIRE = 'id';

/**
 * UNE NOTE, TELLE QUE L'INDEX LA PORTE.
 *
 * Les quatre champs de périmètre sont obligatoires (`ADR-006`). Les instants
 * sont des millisecondes depuis l'époque : le moteur trie et filtre des
 * nombres, et une chaîne de date ne se trie pas.
 *
 * Le type est un ALIAS et non une interface, et ce détail est fonctionnel : le
 * client du moteur contraint ses entrées à porter une signature d'index, ce
 * qu'une interface ne fournit pas implicitement. Un alias la fournit.
 */
export type NoteIndexee = {
	/** L'identifiant de la note — celui de son adresse. */
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
	/** Le dossier PORTEUR de la note. C'est lui que le filtre interroge. */
	readonly dossier: string;
	/**
	 * La chaîne d'ancêtres, du dossier porteur jusqu'à la racine — l'ordre de
	 * `RG-DRO-01`, « le plus proche d'abord ». Elle contient le dossier porteur
	 * lui-même : `chaineDAncetres()` la rend ainsi, et le périmètre se lit sur
	 * le dossier porteur, jamais sur un ancêtre seul (voir `perimetre.ts`).
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
 * LES CHAMPS CHERCHABLES SONT CEUX DE LA MAQUETTE, UN POUR UN.
 *
 * La fabrique du gel — portée à l'identique par les cinq maquettes de l'espace
 * public et reprise dans `src/lib/public/recherche.ts` — cherche dans le titre,
 * l'extrait, les étiquettes, le domaine et le type de fiche. Cette liste est
 * celle-là, dans cet ordre, et l'ordre compte : il fixe la priorité des
 * attributs dans le classement du moteur.
 *
 * Les vues gelées portent leur PROPRE fabrique de correspondance et l'appliquent
 * à ce qu'elles reçoivent. Indexer un champ de plus ferait remonter au moteur
 * des notes que l'écran écarterait ensuite — un résultat compté et non montré.
 * Les maquettes priment sur la pile (`CLAUDE.md` §2) : c'est la liste du gel qui
 * décide.
 */
export const CHAMPS_CHERCHABLES: readonly string[] = [
	'titre',
	'extrait',
	'etiquettes',
	'domaine',
	'typeFiche'
];

/**
 * LES CHAMPS FILTRABLES — le périmètre d'abord, les facettes ensuite.
 *
 * Le périmètre : `dossier`, `ancetres`, `visibilite`, `statut`. Sans eux
 * déclarés filtrables, le moteur REFUSE le filtre — l'index ne peut donc pas
 * être interrogé sans périmètre par oubli de réglage, il serait interrogé en
 * erreur.
 *
 * Les facettes : `docs/routes.md` §4.2 en nomme sept — `univers`, `domaine`,
 * `type`, `statut`, `fraicheur`, `etiquette`, `visibilite`. Six sont ici. La
 * septième, `fraicheur`, n'est pas un champ de l'index et ne peut pas l'être :
 * voir l'en-tête, refus n° 1.
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
 * `embedders` N'Y EST PAS, ET C'EST LE POINT : le mode « Sens » du moteur exige
 * un embedder déclaré. Son absence est la condition mécanique de son
 * indisponibilité, et `SENS_DISPONIBLE` la lit plus bas au lieu de l'affirmer.
 *
 * `pagination.maxTotalHits` gouverne le nombre total que le moteur consent à
 * compter — donc le compteur global de `RG-M02-08`. Le corpus livré porte 32
 * notes ; le plafond est celui du moteur, laissé à sa valeur par défaut, et
 * `PLAFOND_DE_RESULTATS` en dépend (voir `moteur.ts`).
 */
export const REGLAGES_DE_L_INDEX: Settings = {
	searchableAttributes: [...CHAMPS_CHERCHABLES],
	filterableAttributes: [...CHAMPS_FILTRABLES],
	sortableAttributes: [...CHAMPS_TRIABLES]
};

/**
 * LE MODE « SENS » EST-IL DISPONIBLE ? — un CONSTAT, dérivé des réglages.
 *
 * `P-10` : dégradation, jamais panne. `P-02` : aucune valeur illustrative — un
 * mode « Sens » qui rendrait en réalité des résultats de mots-clés serait une
 * simulation, et la pire, indétectable par l'utilisateur.
 *
 * La valeur n'est pas écrite : elle est LIÉE à la seule condition qui la rende
 * vraie. Le jour où un lot déclarera un embedder et alimentera les vecteurs, ce
 * booléen suivra le réglage au lieu d'attendre qu'on se souvienne de lui.
 *
 * Le gel porte déjà cet état et sa phrase : V-08 pose son mode en mots-clés,
 * se déclare dégradée, désactive le bouton « Sens » et affiche « Recherche par
 * sens momentanément indisponible — les résultats sont établis en mots-clés ».
 * `RG-M02-01` exige que la bascule soit ANNONCÉE, pas silencieuse.
 */
export const SENS_DISPONIBLE: boolean = REGLAGES_DE_L_INDEX.embedders !== undefined;
