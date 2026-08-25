/**
 * L'ARCHIVE D'EXPORT — LE CRITÈRE DE RÉUSSITE PRINCIPAL, CÔTÉ ARCHIVE.
 *
 * `RG-M13-01` (`cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1113`) : « l'export
 * est réimportable : réimporter l'archive produite doit reconstituer le domaine
 * à l'identique, arborescence, métadonnées, étiquettes et images comprises.
 * C'est le critère de réussite principal. »
 *
 * `T-015` a livré la moitié de ce critère — le convertisseur unique du CORPS,
 * et la batterie 4 qui prouve son aller-retour. Ce module livre l'autre moitié :
 * l'ARCHIVE. La propriété prouvée ici est d'un cran au-dessus de la relecture :
 *
 *   exporter → réimporter → réexporter rend LES MÊMES OCTETS,
 *   et le domaine relu est ÉGAL au domaine exporté, champ par champ.
 *
 * C'est `R-05` de `cadrage/STACK-TECHNIQUE.md` l. 461 : « un aller-retour non
 * idempotent fait échouer la construction ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE GEL FIXE DU CONTENU DE L'ARCHIVE, ET QUI N'ÉTAIT PAS À DÉCIDER
 *
 * `mockups/V-36-console-exports.html:2921-2938`, lu ligne à ligne :
 *
 *   :2923  « Un fichier par note — au format Markdown, lisible dans n'importe
 *          quel éditeur de texte. Le nom du fichier reprend le titre de la
 *          note. »
 *   :2926  « L'arborescence de dossiers, reproduite — les N dossiers du domaine
 *          deviennent des dossiers de l'archive, à la même place. »
 *   :2929  « Les métadonnées, en en-tête de chaque fichier — type, étiquettes,
 *          auteur, date de dernière vérification, visibilité et propriétés de
 *          fiche, dans un bloc de trois tirets en tête de fichier. C'est ce
 *          bloc qui rend l'archive réimportable. »
 *   :2932  « Les images et pièces jointes — inclus dans un DOSSIER VOISIN, et
 *          les notes y renvoient par chemin relatif. »
 *   :2937  « Un rapport de conversion — liste ce qui n'a pas pu être rendu
 *          fidèlement en Markdown, avec la raison. »
 *
 * Les cinq éléments sont ici, et il n'y en a pas un sixième : l'archive ne
 * porte aucun fichier d'index, aucun manifeste, aucune table de relations.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX LISTES DE MÉTADONNÉES SE COMPLÈTENT, ELLES NE SE CONTREDISENT PAS
 *
 * Le gel (`V-36:2929`) en nomme six : type, étiquettes, auteur, date de
 * dernière vérification, visibilité, propriétés de fiche. `UC-M13-01`
 * (`CDC:1108`) en nomme neuf : titre, identifiant, étiquettes, type, domaine,
 * dossier, visibilité, statut, date. L'union des deux est écrite, et c'est la
 * seule lecture qui satisfait les deux sources — aucune ne présente sa liste
 * comme exhaustive, et `RG-M13-01` exige de toute façon davantage : ce qui
 * n'est pas écrit ne revient pas.
 *
 * L'en-tête porte donc tout ce que la ligne de note porte et que le domaine
 * contient. Ce qui n'y est PAS est déclaré et compté au rapport du lot, jamais
 * perdu en silence : l'historique des vérifications (M06.2) et l'historique des
 * versions ne sont pas l'état du domaine ; les relations SONT portées, du côté
 * de leur note source.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA COUTURE AVEC LE CONVERTISSEUR — ARB-049 DÉCISION 5, HONORÉE ICI
 *
 * L'en-tête de `src/lib/contenu/markdown.ts` écrit le contrat, et c'est ce
 * module qui en est le second contractant :
 *
 *   « `serialiserEnMarkdown` rend le CORPS SEUL, sans en-tête, et ne commence
 *     JAMAIS par une ligne de trois tirets — le séparateur s'écrit en
 *     astérisques. La collision qu'ARB-049 demandait de traiter est donc
 *     IMPOSSIBLE par construction, et non pas seulement improbable. »
 *   « `analyserMarkdown` reçoit le CORPS SEUL. C'est à l'appelant de retirer
 *     l'en-tête s'il y en a un. »
 *
 * Ce module est cet appelant, et il retire l'en-tête SANS AUCUNE HEURISTIQUE :
 *
 *   • la première ligne du fichier est l'ouverture, ou il n'y a pas d'en-tête ;
 *   • chaque ligne d'en-tête est une clé, un deux-points, une espace, et une
 *     VALEUR JSON sur une seule ligne — donc jamais trois tirets, quel que
 *     soit le texte qu'elle porte, l'échappement JSON étant total ;
 *   • la clôture est la première ligne de trois tirets rencontrée, et elle ne
 *     peut appartenir à aucune valeur.
 *
 * La collision du séparateur en tête de document est donc traitée DEUX FOIS :
 * le convertisseur n'écrit pas de tirets, et la lecture ne saurait pas se
 * tromper même s'il en écrivait. Le cas exact est éprouvé en unitaire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX REGISTRES DANS UN SEUL FICHIER, ET LE SÉPARATEUR EST DÉCLARÉ
 *
 * `RG-NOT-02` : une note peut porter un second corps, le registre
 * Opérationnel. Le gel dit « UN fichier par note » : les deux registres vivent
 * donc dans le même fichier, et il faut un séparateur qui ne puisse pas être
 * confondu avec le corps.
 *
 * AUCUN SÉPARATEUR FIXE NE PEUT L'ÊTRE : un bloc de code porte son contenu
 * VERBATIM, donc n'importe quelle ligne. La parade n'est pas de deviner en
 * relisant le Markdown — ce serait un second analyseur, qu'`ADR-004` interdit —
 * c'est de DÉCLARER le séparateur dans l'en-tête, et de le choisir absent des
 * deux corps. Il est allongé tant qu'il apparaît. La lecture n'a alors plus
 * rien à deviner : elle coupe à la première ligne égale à ce qu'annonce
 * l'en-tête, et cette ligne est la seule.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES NOMS DE CHEMIN SONT ÉCHAPPÉS, POUR QUE L'ARBORESCENCE REVIENNE EXACTE
 *
 * Un nom de dossier ou un titre de note peut porter une barre oblique, que le
 * format ZIP emploie comme séparateur. Un renommage silencieux perdrait le nom
 * d'un dossier VIDE, qu'aucun en-tête ne porterait — et l'arborescence est
 * nommément dans `RG-M13-01`. Les deux seuls caractères échappés sont donc la
 * barre oblique et le signe pour cent lui-même, en séquences de pour cent : la
 * transformation est totale et inversible, et un humain lit le nom sans peine.
 *
 * Deux noms sont RÉSERVÉS à la racine de l'archive — le dossier voisin des
 * pièces jointes et le rapport de conversion. Un dossier racine qui porterait
 * l'un d'eux voit son premier caractère échappé : le nom reste inversible, et
 * la collision est impossible plutôt qu'improbable.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE NE CONVERTIT RIEN — ADR-004
 *
 * Il n'écrit aucune forme du Markdown et n'en lit aucune : les deux entrées de
 * `src/lib/contenu/markdown.ts` font tout le travail de conversion, et il n'y a
 * pas de second chemin. Ce qui est écrit ici est l'ENVELOPPE d'un fichier :
 * l'en-tête de métadonnées, le séparateur de registre, les chemins. Le rapport
 * de conversion est du texte, jamais du Markdown, et pour la même raison.
 */
import { analyserMarkdown, serialiserEnMarkdown } from '../contenu/markdown';
import {
	ALLONGEMENT,
	DOSSIER_DES_PIECES,
	NOM_DU_RAPPORT,
	SUFFIXE_DE_NOTE,
	cheminDArchive,
	dossierDesPiecesDe,
	echapperSegment,
	nomDeFichierDeNote,
	segmentsDepuisLArchive
} from './noms';
import { ecrireZip, lireZip, type EntreeDeZip } from './zip';

/* ═════════════════════════════════════════════════ Le domaine exporté ═══ */

/**
 * Un dossier du domaine, par son chemin depuis la racine, RACINE INCLUSE.
 *
 * L'ORDRE de la liste porte l'ordre des dossiers frères. La colonne
 * `dossiers.position` n'est pas écrite dans l'archive : un dossier vide n'a
 * aucun fichier pour la porter, et l'ordre des entrées d'un ZIP est, lui,
 * conservé. La lecture du côté base rend donc les dossiers ordonnés par
 * position, et l'écriture du côté base reconstitue les positions par rang.
 * L'ORDRE survit, et il est éprouvé en unitaire — dossiers vides compris. La
 * VALEUR d'une position non dense, elle, est renormalisée : ce n'est pas une
 * propriété de ce module, qui ne voit pas les positions, mais de la traduction
 * base ↔ modèle de `src/lib/donnees/export.ts`. Déclaré au rapport du lot.
 */
export interface DossierAExporter {
	readonly chemin: readonly string[];
}

/** Une pièce jointe, avec ses octets — sans eux, l'archive mentirait. */
export interface PieceJointeAExporter {
	readonly nom: string;
	readonly typeMedia: string;
	readonly deposeeLe: string;
	readonly octets: Uint8Array;
}

/** Une relation sortante, telle que `P-08` demande qu'on en voie l'origine. */
export interface RelationAExporter {
	readonly cible: string;
	readonly type: string;
	readonly origine: string;
}

/** Une note du domaine, telle que l'archive la porte et la rend. */
export interface NoteAExporter {
	readonly identifiant: string;
	readonly titre: string;
	readonly typeDeNote: string;
	readonly typeDeFiche: string | null;
	readonly proprietesDeFiche: unknown;
	/** Le chemin de son dossier, racine incluse. */
	readonly cheminDeDossier: readonly string[];
	readonly auteur: string;
	/** Dans l'ordre du rang porté par la base (`etiquettes_de_note.ordre`). */
	readonly etiquettes: readonly string[];
	readonly visibilite: string;
	readonly statut: string;
	readonly creeLe: string;
	readonly modifieLe: string;
	readonly corpsReferenceModifieLe: string;
	readonly corpsOperationnelModifieLe: string | null;
	readonly verifieLe: string | null;
	readonly consultations: number;
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
	readonly revisionDemandee: boolean;
	readonly revisionCommentaire: string | null;
	readonly revisionPar: string | null;
	readonly revisionLe: string | null;
	readonly relations: readonly RelationAExporter[];
	/** Le document canonique du registre Référence. */
	readonly corpsReference: unknown;
	/** Le document canonique du registre Opérationnel, ou son absence. */
	readonly corpsOperationnel: unknown;
	readonly piecesJointes: readonly PieceJointeAExporter[];
}

/** Le domaine entier, tel qu'il entre dans l'archive et tel qu'il en sort. */
export interface DomaineAExporter {
	readonly universIdentifiant: string;
	readonly universNom: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly dossiers: readonly DossierAExporter[];
	readonly notes: readonly NoteAExporter[];
}

/* ═════════════════════════════════════════ Le rapport de conversion ═════ */

/**
 * LES FAMILLES D'AVERTISSEMENT, ET LA SOURCE DE CHACUNE.
 *
 * `RG-M13-02` : « un contenu non convertible n'interrompt pas l'export : la
 * note est ignorée et consignée dans le rapport. » `V-36:3042-3046` montre le
 * rapport à trois familles, et les trois sont traitées ci-dessous — l'une par
 * un constat d'impossibilité, ce qui est la seule réponse honnête.
 */
export type FamilleDAvertissement =
	/** `RG-M13-02` — le corps n'est pas convertible : la note n'est PAS dans l'archive. */
	| 'note-ignoree'
	/** `V-36:3044` — « converti en bloc de code, sans rendu graphique ». */
	| 'diagramme'
	/** `V-36:3045` — « exportés comme fichiers de liens, sans contenu distant ». */
	| 'signet'
	/** Une image dont la source n'est aucune pièce jointe du produit. */
	| 'image-non-incluse'
	/**
	 * Une pièce jointe que la base recense et dont elle NE PORTE PAS les octets.
	 * `src/lib/base/schema.ts` — la table des pièces jointes porte le nom, la
	 * taille et le type de média, et aucune colonne de contenu ; aucun lot n'a
	 * livré de stockage de fichier. L'archive ne peut donc pas la contenir, et
	 * la seule réponse honnête est de le dire : écrire un fichier vide ferait
	 * croire à une pièce de zéro octet, ce que `P-02` proscrit.
	 */
	| 'piece-sans-octets'
	/** Le nom du fichier ne reprend pas le titre au caractère près (`V-36:2923`). */
	| 'nom-de-fichier';

/** Une ligne du rapport : ce qui n'a pas pu être rendu fidèlement, et pourquoi. */
export interface AvertissementDeConversion {
	readonly famille: FamilleDAvertissement;
	/** L'identifiant de la note concernée. */
	readonly note: string;
	readonly titre: string;
	readonly raison: string;
}

/** Le rapport, tel que l'archive le porte et tel que la vue le compte. */
export interface RapportDeConversion {
	readonly notesExportees: number;
	readonly notesIgnorees: number;
	readonly avertissements: readonly AvertissementDeConversion[];
}

/**
 * LA FAMILLE DU GEL QUI NE PEUT PAS SURVENIR, ET IL FAUT LE DIRE.
 *
 * `V-36:3043` montre « 2 tableaux — à cellules fusionnées, aplatis en tableaux
 * simples ». Le format canonique NE PORTE PAS de cellule fusionnée :
 * `src/lib/contenu/document.ts` ne déclare ni `colspan` ni `rowspan` sur
 * `tableCell`, et `analyserDocument` refuse tout attribut qu'il ne connaît pas.
 * Un tableau à cellules fusionnées ne peut donc pas exister dans une note, donc
 * pas être aplati par l'export : cette famille est vide par construction, et
 * fabriquer un compteur pour elle serait la valeur illustrative que `P-02`
 * proscrit. Elle est nommée ici, comptée nulle part.
 */
export const FAMILLE_SANS_CAS =
	'cellules fusionnées : le format canonique n’en porte pas, la famille est vide par construction';

/* ═════════════════════════════════════════════ Les noms de l'archive ════ */

/**
 * LES NOMS ET LEURS FABRIQUES VIVENT DANS `./noms`, ET C'EST LE CORRECTIF.
 *
 * Ce module dépend de `node:zlib` par `./zip` : aucun écran ne pouvait en
 * importer quoi que ce soit sans faire entrer un module de plateforme dans le
 * paquet de navigateur. `V-36` réécrivait donc les noms en littéraux — et les
 * littéraux ont divergé de l'archive produite. `./noms` ne dépend de rien ;
 * l'écran qui DÉCRIT l'archive lit désormais la même définition que celle qui
 * la PRODUIT. Le réexport garde intactes toutes les adresses d'importation.
 */
export {
	ALLONGEMENT,
	DOSSIER_DES_PIECES,
	NOM_DU_RAPPORT,
	SUFFIXE_DE_NOTE,
	cheminDArchive,
	desechapperSegment,
	dossierDesPiecesDe,
	echapperSegment,
	nomDeFichierDeNote,
	segmentsDepuisLArchive
} from './noms';

/** L'ouverture et la clôture du bloc de métadonnées — `V-36:2929`. */
const CLOTURE_DEN_TETE = '-'.repeat(3);

/** Le séparateur de registre, avant tout allongement. */
const SEPARATEUR_DE_REGISTRE = '%%% registre operationnel %%%';

/** Le nom du fichier de l'archive — `V-36:3061` en fixe la forme. */
export function nomDArchive(identifiantDeDomaine: string, dateISO: string): string {
	return identifiantDeDomaine + '-' + dateISO.slice(0, 10) + '.zip';
}

/* ═════════════════════════════════════════ L'en-tête de métadonnées ═════ */

/**
 * LES DEUX CLÉS DE FICHE, NOMMÉES — parce qu'un autre module les relit.
 *
 * `src/lib/donnees/import.ts` reprend un fichier de note écrit ici et doit en
 * retrouver le type de fiche et ses propriétés. Une archive exportée puis
 * réimportée perdait les deux : elles étaient écrites, jamais relues. Les deux
 * noms sont exportés plutôt que recopiés — un littéral de chaque côté ferait
 * deux définitions du format, et la divergence ne se verrait qu'à
 * l'aller-retour.
 */
export const CLE_TYPE_DE_FICHE = 'type_de_fiche';
export const CLE_PROPRIETES_DE_FICHE = 'proprietes_de_fiche';

/** Les clés de l'en-tête, dans l'ordre où elles sont écrites. */
const CLES = [
	'titre',
	'identifiant',
	'type',
	CLE_TYPE_DE_FICHE,
	CLE_PROPRIETES_DE_FICHE,
	'univers',
	'univers_identifiant',
	'domaine',
	'domaine_identifiant',
	'dossier',
	'auteur',
	'etiquettes',
	'visibilite',
	'statut',
	'cree_le',
	'modifie_le',
	'corps_reference_modifie_le',
	'corps_operationnel_modifie_le',
	'verifie_le',
	'consultations',
	'signet_adresse',
	'signet_ajoute_le',
	'revision_demandee',
	'revision_commentaire',
	'revision_par',
	'revision_le',
	'relations',
	'pieces_jointes',
	'images',
	'separateur_de_registre'
] as const;

type CleDEnTete = (typeof CLES)[number];

/** Un en-tête lu : ses clés, et le corps qui suit. */
interface FichierLu {
	readonly champs: ReadonlyMap<string, unknown>;
	readonly corps: string;
}

/** Une archive que ce module ne sait pas relire. Il ne devine jamais. */
export class ArchiveInvalide extends Error {
	constructor(message: string) {
		super('archive invalide : ' + message);
		this.name = 'ArchiveInvalide';
	}
}

/**
 * Écrit le bloc de métadonnées. Une valeur nulle, une liste vide et un objet
 * vide sont OMIS — l'absence est leur écriture, et la lecture le sait. Toute
 * autre valeur est écrite en JSON sur UNE ligne : c'est ce qui rend la clôture
 * du bloc indevinable autrement que par la ligne de trois tirets.
 */
function ecrireEnTete(champs: ReadonlyMap<CleDEnTete, unknown>): string {
	const lignes = [CLOTURE_DEN_TETE];
	for (const cle of CLES) {
		if (!champs.has(cle)) continue;
		const valeur = champs.get(cle);
		if (valeur === null || valeur === undefined || valeur === false) continue;
		if (Array.isArray(valeur) && valeur.length === 0) continue;
		lignes.push(cle + ': ' + JSON.stringify(valeur));
	}
	/* La liste finit par une chaîne vide : la jointure pose ainsi le saut de
	   ligne qui clôt le bloc, et le corps commence immédiatement après. Aucune
	   ligne vide n'est intercalée — une ligne vide appartiendrait au corps, et
	   la lecture aurait alors à décider. */
	lignes.push(CLOTURE_DEN_TETE, '');
	return lignes.join('\n');
}

/**
 * Retire l'en-tête et rend le corps. AUCUNE HEURISTIQUE : la première ligne
 * décide de l'existence du bloc, et la première ligne de trois tirets suivante
 * le clôt. Un corps qui commencerait par un séparateur ne peut pas être pris
 * pour un en-tête — le convertisseur écrit des astérisques (`ARB-049`
 * décision 5) — et, s'il l'était, la ligne suivante ne serait pas une clé et la
 * lecture le dirait plutôt que de deviner.
 */
export function lireFichierDeNote(texte: string): FichierLu {
	const lignes = texte.split('\n');
	if (lignes[0] !== CLOTURE_DEN_TETE) {
		throw new ArchiveInvalide('fichier de note sans bloc de métadonnées en tête');
	}
	const champs = new Map<string, unknown>();
	let i = 1;
	while (i < lignes.length && lignes[i] !== CLOTURE_DEN_TETE) {
		const ligne = lignes[i] as string;
		const coupe = ligne.indexOf(': ');
		if (coupe <= 0) {
			throw new ArchiveInvalide('ligne de métadonnées illisible : ' + ligne);
		}
		const cle = ligne.slice(0, coupe);
		try {
			champs.set(cle, JSON.parse(ligne.slice(coupe + 2)));
		} catch {
			throw new ArchiveInvalide('valeur de métadonnée « ' + cle + ' » non lisible');
		}
		i += 1;
	}
	if (i >= lignes.length) {
		throw new ArchiveInvalide('bloc de métadonnées non clos');
	}
	/* Le corps commence à la ligne qui suit la clôture, sans exception : rien
	   n'est sauté, donc rien n'est perdu si le corps commence par une ligne
	   vide. */
	return { champs, corps: lignes.slice(i + 1).join('\n') };
}

/* ═══════════════════════════════════════ Les images et leur chemin ══════ */

/**
 * Le chemin relatif, depuis le fichier d'une note, vers son dossier de pièces.
 * `V-36:2932` : « les notes y renvoient par CHEMIN RELATIF ».
 */
function cheminRelatifDesPieces(profondeurDuDossier: number, identifiant: string): string {
	return '../'.repeat(profondeurDuDossier) + dossierDesPiecesDe(identifiant);
}

/** Un remplacement d'adresse d'image, et son inverse. */
type TableDesImages = Record<string, string>;

/**
 * Parcourt un document canonique et rend une copie où chaque adresse d'image
 * connue est remplacée. Le parcours est GÉNÉRIQUE — il ne connaît du format que
 * le nom du nœud et celui de son attribut d'adresse —, de sorte qu'une image
 * imbriquée dans une cellule, une citation ou un conteneur soit atteinte comme
 * une autre.
 */
function remplacerLesAdresses(valeur: unknown, table: TableDesImages): unknown {
	if (Array.isArray(valeur)) return valeur.map((v) => remplacerLesAdresses(v, table));
	if (valeur === null || typeof valeur !== 'object') return valeur;
	const objet = valeur as Record<string, unknown>;
	const copie: Record<string, unknown> = {};
	for (const [cle, v] of Object.entries(objet)) copie[cle] = remplacerLesAdresses(v, table);
	if (objet.type === 'image') {
		const attrs = copie.attrs;
		if (attrs !== null && typeof attrs === 'object') {
			const source = (attrs as Record<string, unknown>).src;
			if (typeof source === 'string' && source in table) {
				(attrs as Record<string, unknown>).src = table[source];
			}
		}
	}
	return copie;
}

/** Les adresses d'image d'un document, dans l'ordre du parcours, sans doublon. */
function adressesDImage(valeur: unknown, vues: string[] = []): readonly string[] {
	if (Array.isArray(valeur)) {
		for (const v of valeur) adressesDImage(v, vues);
		return vues;
	}
	if (valeur === null || typeof valeur !== 'object') return vues;
	const objet = valeur as Record<string, unknown>;
	if (objet.type === 'image') {
		const attrs = objet.attrs;
		if (attrs !== null && typeof attrs === 'object') {
			const source = (attrs as Record<string, unknown>).src;
			if (typeof source === 'string' && !vues.includes(source)) vues.push(source);
		}
	}
	for (const v of Object.values(objet)) adressesDImage(v, vues);
	return vues;
}

/** Combien de nœuds d'un genre donné le document porte. */
function compterLesNoeuds(valeur: unknown, genre: string): number {
	if (Array.isArray(valeur)) {
		return valeur.reduce<number>((n, v) => n + compterLesNoeuds(v, genre), 0);
	}
	if (valeur === null || typeof valeur !== 'object') return 0;
	const objet = valeur as Record<string, unknown>;
	let total = objet.type === genre ? 1 : 0;
	for (const v of Object.values(objet)) total += compterLesNoeuds(v, genre);
	return total;
}

/* ═════════════════════════════════════════════ L'écriture d'une note ════ */

/** Le séparateur de registre, allongé jusqu'à être absent des deux corps. */
function separateurAbsentDe(corps: readonly string[]): string {
	let separateur = SEPARATEUR_DE_REGISTRE;
	while (corps.some((c) => c.split('\n').includes(separateur))) {
		separateur = ALLONGEMENT + separateur + ALLONGEMENT;
	}
	return separateur;
}

/** Ce qu'une note produit : un fichier, ses pièces, et ce qu'il faut consigner. */
interface NoteEcrite {
	readonly entrees: readonly EntreeDeZip[];
	readonly avertissements: readonly AvertissementDeConversion[];
}

function ecrireLaNote(
	domaine: DomaineAExporter,
	note: NoteAExporter,
	nomDeFichier: string
): NoteEcrite {
	const avertissements: AvertissementDeConversion[] = [];

	/* Les images d'abord : le corps sérialisé doit déjà porter les chemins
	   relatifs, et la table qui les inverse doit entrer dans l'en-tête. */
	const profondeur = note.cheminDeDossier.length;
	const table: TableDesImages = {};
	const inverse: TableDesImages = {};
	const parNom = new Map(note.piecesJointes.map((p) => [p.nom, p]));
	/* La base n'impose pas l'unicité du nom d'une pièce sur une note. Deux
	   homonymes ne feraient qu'UNE entrée d'archive, et la relecture rendrait les
	   mêmes octets aux deux : une perte silencieuse. La note est donc refusée, ce
	   qui la fait consigner par `RG-M13-02` au lieu de mentir. */
	if (parNom.size !== note.piecesJointes.length) {
		throw new ArchiveInvalide(
			'deux pièces jointes de même nom sur la note « ' +
				note.identifiant +
				' » : l’archive ne peut pas les distinguer'
		);
	}
	for (const adresse of [
		...adressesDImage(note.corpsReference),
		...adressesDImage(note.corpsOperationnel)
	]) {
		const nom = adresse.split('/').pop() ?? adresse;
		const piece = parNom.get(adresse) ?? parNom.get(nom);
		if (piece === undefined) {
			avertissements.push({
				famille: 'image-non-incluse',
				note: note.identifiant,
				titre: note.titre,
				raison:
					'l’image « ' +
					adresse +
					' » n’est pas une pièce jointe de la note : l’archive ne peut pas en porter les octets, et l’adresse reste celle du produit'
			});
			continue;
		}
		const relatif =
			cheminRelatifDesPieces(profondeur, note.identifiant) + '/' + echapperSegment(piece.nom);
		/* DEUX ADRESSES DIFFÉRENTES PEUVENT DÉSIGNER LA MÊME PIÈCE — l'une par son
		   nom nu, l'autre par un chemin qui finit par ce nom. Les réécrire toutes
		   les deux vers le même chemin relatif rendrait la table inversible dans
		   un seul sens : la relecture rendrait la MÊME adresse aux deux, et
		   l'aller-retour cesserait d'être l'identité SANS QUE RIEN NE LE DISE.
		   La seconde n'est donc pas réécrite, et elle est consignée. */
		const deja = inverse[relatif];
		if (deja !== undefined && deja !== adresse) {
			avertissements.push({
				famille: 'image-non-incluse',
				note: note.identifiant,
				titre: note.titre,
				raison:
					'l’image « ' +
					adresse +
					' » désigne la même pièce jointe que « ' +
					deja +
					' » : une seule des deux adresses peut être réécrite en chemin relatif, celle-ci reste celle du produit'
			});
			continue;
		}
		table[adresse] = relatif;
		inverse[relatif] = adresse;
	}

	const reference = serialiserEnMarkdown(remplacerLesAdresses(note.corpsReference, table));
	const operationnel =
		note.corpsOperationnel === null || note.corpsOperationnel === undefined
			? null
			: serialiserEnMarkdown(remplacerLesAdresses(note.corpsOperationnel, table));

	const separateur = operationnel === null ? null : separateurAbsentDe([reference, operationnel]);

	const champs = new Map<CleDEnTete, unknown>([
		['titre', note.titre],
		['identifiant', note.identifiant],
		['type', note.typeDeNote],
		[CLE_TYPE_DE_FICHE, note.typeDeFiche],
		[CLE_PROPRIETES_DE_FICHE, note.proprietesDeFiche],
		['univers', domaine.universNom],
		['univers_identifiant', domaine.universIdentifiant],
		['domaine', domaine.nom],
		['domaine_identifiant', domaine.identifiant],
		['dossier', note.cheminDeDossier],
		['auteur', note.auteur],
		['etiquettes', note.etiquettes],
		['visibilite', note.visibilite],
		['statut', note.statut],
		['cree_le', note.creeLe],
		['modifie_le', note.modifieLe],
		['corps_reference_modifie_le', note.corpsReferenceModifieLe],
		['corps_operationnel_modifie_le', note.corpsOperationnelModifieLe],
		['verifie_le', note.verifieLe],
		['consultations', note.consultations],
		['signet_adresse', note.signetAdresse],
		['signet_ajoute_le', note.signetAjouteLe],
		['revision_demandee', note.revisionDemandee],
		['revision_commentaire', note.revisionCommentaire],
		['revision_par', note.revisionPar],
		['revision_le', note.revisionLe],
		['relations', note.relations],
		['pieces_jointes', note.piecesJointes.map((p) => piecePourLEnTete(p))],
		['images', Object.keys(inverse).length === 0 ? null : inverse],
		['separateur_de_registre', separateur]
	]);

	const texte =
		ecrireEnTete(champs) +
		reference +
		(separateur === null ? '' : separateur + '\n' + String(operationnel));

	const entrees: EntreeDeZip[] = [
		{
			chemin: cheminDArchive(note.cheminDeDossier) + '/' + nomDeFichier,
			octets: new Uint8Array(Buffer.from(texte, 'utf8'))
		}
	];
	for (const piece of note.piecesJointes) {
		entrees.push({
			chemin: dossierDesPiecesDe(note.identifiant) + '/' + echapperSegment(piece.nom),
			octets: piece.octets
		});
	}

	/* Les deux familles du gel qui NE SONT PAS des refus : la note est dans
	   l'archive, et le rapport dit ce qu'un lecteur hors du produit n'y
	   retrouvera pas. */
	const diagrammes =
		compterLesNoeuds(note.corpsReference, 'diagramme') +
		compterLesNoeuds(note.corpsOperationnel, 'diagramme');
	if (diagrammes > 0) {
		avertissements.push({
			famille: 'diagramme',
			note: note.identifiant,
			titre: note.titre,
			raison:
				String(diagrammes) +
				' diagramme(s) converti(s) en bloc de code, sans rendu graphique — V-36:3044'
		});
	}
	if (note.signetAdresse !== null) {
		avertissements.push({
			famille: 'signet',
			note: note.identifiant,
			titre: note.titre,
			raison:
				'signet exporté comme fichier de liens, sans contenu distant — l’adresse ' +
				note.signetAdresse +
				' n’est pas suivie'
		});
	}

	return { entrees, avertissements };
}

/** Une pièce jointe telle que l'en-tête la porte — sans ses octets, qui sont un fichier. */
function piecePourLEnTete(piece: PieceJointeAExporter): Record<string, unknown> {
	return {
		nom: piece.nom,
		type_media: piece.typeMedia,
		deposee_le: piece.deposeeLe,
		octets: piece.octets.length
	};
}

/* ═════════════════════════════════════════════ L'écriture de l'archive ══ */

/** Le nom de fichier d'une note, et ce qu'il faut consigner s'il dévie du titre. */
function nommerLeFichier(
	note: NoteAExporter,
	pris: Set<string>
): { nom: string; avertissement: AvertissementDeConversion | null } {
	const echappe = echapperSegment(note.titre);
	const cle = cheminDArchive(note.cheminDeDossier) + '/' + echappe.toLowerCase();
	/* LE NOM SANS HOMONYME SORT DE LA FABRIQUE PARTAGÉE — celle-là même que
	   `V-36` appelle pour ANNONCER le nom du fichier. Deux compositions
	   séparées avaient déjà divergé une fois. */
	let nom = nomDeFichierDeNote(note.titre);
	let rang = 1;
	let cleFinale = cle;
	while (pris.has(cleFinale)) {
		rang += 1;
		nom = echappe + ' (' + String(rang) + ')' + SUFFIXE_DE_NOTE;
		cleFinale = cle + ' (' + String(rang) + ')';
	}
	pris.add(cleFinale);
	if (nom === note.titre + SUFFIXE_DE_NOTE) return { nom, avertissement: null };
	return {
		nom,
		avertissement: {
			famille: 'nom-de-fichier',
			note: note.identifiant,
			titre: note.titre,
			raison:
				'le nom du fichier ne reprend pas le titre au caractère près : « ' +
				nom +
				' » — le titre exact est dans le bloc de métadonnées, et c’est lui qui est réimporté'
		}
	};
}

/** Ce que l'export produit : les entrées de l'archive, et son rapport. */
export interface ArchiveConstruite {
	readonly entrees: readonly EntreeDeZip[];
	readonly rapport: RapportDeConversion;
}

/**
 * Construit l'archive du domaine — les cinq éléments de `V-36:2921-2938`, et
 * rien d'autre.
 *
 * `RG-M13-02` est tenue ici, et c'est le seul endroit où elle peut l'être : une
 * note dont le corps n'est pas convertible est IGNORÉE et consignée. L'export
 * ne s'interrompt pas, et il ne se dégrade pas en silence non plus.
 */
export function construireLArchive(
	domaine: DomaineAExporter,
	avertissementsDAmont: readonly AvertissementDeConversion[] = []
): ArchiveConstruite {
	const entrees: EntreeDeZip[] = [];
	/* Ce que la LECTURE EN BASE a déjà constaté, et que l'archive ne peut pas
	   constater elle-même — une pièce jointe dont le produit ne stocke pas les
	   octets, par exemple. `RG-M13-02` veut que ce soit consigné, et le seul
	   endroit où le consigner est ce rapport. */
	const avertissements: AvertissementDeConversion[] = [...avertissementsDAmont];

	for (const dossier of domaine.dossiers) {
		entrees.push({ chemin: cheminDArchive(dossier.chemin) + '/', octets: new Uint8Array(0) });
	}

	const pris = new Set<string>();
	let exportees = 0;
	let ignorees = 0;
	for (const note of domaine.notes) {
		const nomme = nommerLeFichier(note, pris);
		let ecrite: NoteEcrite;
		try {
			ecrite = ecrireLaNote(domaine, note, nomme.nom);
		} catch (erreur) {
			/* Le refus vient de l'implémentation unique — `MarkdownNonRepresentable`
			   quand le Markdown ne sait pas porter le document, `DocumentInvalide`
			   quand le corps stocké n'est pas valide. Les deux se consignent de la
			   même façon : la note n'entre pas dans l'archive. */
			ignorees += 1;
			avertissements.push({
				famille: 'note-ignoree',
				note: note.identifiant,
				titre: note.titre,
				raison:
					'note ignorée, contenu non convertible : ' +
					(erreur instanceof Error ? erreur.message : String(erreur))
			});
			continue;
		}
		exportees += 1;
		entrees.push(...ecrite.entrees);
		if (nomme.avertissement !== null) avertissements.push(nomme.avertissement);
		avertissements.push(...ecrite.avertissements);
	}

	const rapport: RapportDeConversion = {
		notesExportees: exportees,
		notesIgnorees: ignorees,
		avertissements
	};
	entrees.push({
		chemin: NOM_DU_RAPPORT,
		octets: new Uint8Array(Buffer.from(ecrireLeRapport(domaine, rapport), 'utf8'))
	});
	return { entrees, rapport };
}

/**
 * Le rapport de conversion, en TEXTE — `V-36:2937` : « liste ce qui n'a pas pu
 * être rendu fidèlement en Markdown, avec la raison ». Il n'est pas écrit en
 * Markdown, et ce n'est pas une coquetterie : `ADR-004` réserve les formes du
 * Markdown à l'implémentation unique, et un rapport n'est pas une note.
 */
export function ecrireLeRapport(domaine: DomaineAExporter, rapport: RapportDeConversion): string {
	const lignes = [
		'Rapport de conversion — ' + domaine.universNom + ' / ' + domaine.nom,
		'',
		'Notes exportées : ' + String(rapport.notesExportees),
		'Notes ignorées  : ' + String(rapport.notesIgnorees),
		'Avertissements  : ' + String(rapport.avertissements.length),
		''
	];
	if (rapport.avertissements.length === 0) {
		lignes.push('Tout le contenu a été converti sans perte.');
	}
	for (const a of rapport.avertissements) {
		lignes.push('[' + a.famille + '] ' + a.titre + ' (' + a.note + ')', '    ' + a.raison);
	}
	lignes.push('');
	return lignes.join('\n');
}

/* ═════════════════════════════════════════════ La lecture de l'archive ══ */

/** Ce que l'en-tête rend, avec le défaut de chaque clé absente. */
function texteOuNull(champs: ReadonlyMap<string, unknown>, cle: string): string | null {
	const v = champs.get(cle);
	return typeof v === 'string' ? v : null;
}

function texteExige(champs: ReadonlyMap<string, unknown>, cle: string): string {
	const v = texteOuNull(champs, cle);
	if (v === null) throw new ArchiveInvalide('métadonnée « ' + cle + ' » absente ou non textuelle');
	return v;
}

function listeDeTextes(champs: ReadonlyMap<string, unknown>, cle: string): readonly string[] {
	const v = champs.get(cle);
	if (v === undefined) return [];
	if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
		throw new ArchiveInvalide('métadonnée « ' + cle + ' » n’est pas une liste de textes');
	}
	return v as readonly string[];
}

function nombreLu(champs: ReadonlyMap<string, unknown>, cle: string): number {
	const v = champs.get(cle);
	if (v === undefined) return 0;
	if (typeof v !== 'number') throw new ArchiveInvalide('métadonnée « ' + cle + ' » non numérique');
	return v;
}

function relationsLues(champs: ReadonlyMap<string, unknown>): readonly RelationAExporter[] {
	const v = champs.get('relations');
	if (v === undefined) return [];
	if (!Array.isArray(v)) throw new ArchiveInvalide('métadonnée « relations » n’est pas une liste');
	return v.map((brut) => {
		const o = brut as Record<string, unknown>;
		if (
			typeof o.cible !== 'string' ||
			typeof o.type !== 'string' ||
			typeof o.origine !== 'string'
		) {
			throw new ArchiveInvalide('relation incomplète dans le bloc de métadonnées');
		}
		return { cible: o.cible, type: o.type, origine: o.origine };
	});
}

/**
 * Relit l'archive et rend le domaine. C'est ce chemin, et lui seul, qui rend
 * `RG-M13-01` mesurable : sans lui, « réimportable » serait une déclaration.
 *
 * Le chemin d'IMPORT du produit (`T-052`, `src/lib/import/`) écrira ce domaine
 * en base ; il n'a pas d'autre analyseur à écrire, et il n'en écrira pas
 * (`ADR-004`).
 */
export function lireLArchive(entrees: readonly EntreeDeZip[]): DomaineAExporter {
	const dossiers: DossierAExporter[] = [];
	const notes: NoteAExporter[] = [];
	const pieces = new Map<string, Uint8Array>();

	for (const entree of entrees) {
		if (entree.chemin === NOM_DU_RAPPORT) continue;
		if (entree.chemin.startsWith(DOSSIER_DES_PIECES + '/')) {
			pieces.set(entree.chemin, entree.octets);
		}
	}

	let universNom: string | null = null;
	let universIdentifiant: string | null = null;
	let domaineNom: string | null = null;
	let domaineIdentifiant: string | null = null;

	for (const entree of entrees) {
		if (entree.chemin === NOM_DU_RAPPORT) continue;
		if (entree.chemin.startsWith(DOSSIER_DES_PIECES + '/')) continue;
		if (entree.chemin.endsWith('/')) {
			dossiers.push({ chemin: segmentsDepuisLArchive(entree.chemin.slice(0, -1)) });
			continue;
		}
		if (!entree.chemin.endsWith(SUFFIXE_DE_NOTE)) {
			throw new ArchiveInvalide('entrée inattendue : ' + entree.chemin);
		}

		const lu = lireFichierDeNote(Buffer.from(entree.octets).toString('utf8'));
		const champs = lu.champs;
		universNom ??= texteExige(champs, 'univers');
		universIdentifiant ??= texteExige(champs, 'univers_identifiant');
		domaineNom ??= texteExige(champs, 'domaine');
		domaineIdentifiant ??= texteExige(champs, 'domaine_identifiant');

		const separateur = texteOuNull(champs, 'separateur_de_registre');
		let reference = lu.corps;
		let operationnel: string | null = null;
		if (separateur !== null) {
			const lignes = lu.corps.split('\n');
			const coupe = lignes.indexOf(separateur);
			if (coupe === -1) {
				throw new ArchiveInvalide('séparateur de registre annoncé et absent du corps');
			}
			/* Le saut de ligne rendu est celui que le séparateur a consommé : le
			   corps Référence finissait par lui. */
			reference = lignes.slice(0, coupe).join('\n') + '\n';
			operationnel = lignes.slice(coupe + 1).join('\n');
		}

		const table = champs.get('images');
		const rendre: TableDesImages = {};
		if (table !== undefined && table !== null) {
			for (const [relatif, origine] of Object.entries(table as Record<string, unknown>)) {
				if (typeof origine !== 'string') {
					throw new ArchiveInvalide('table des images non textuelle');
				}
				rendre[relatif] = origine;
			}
		}

		const identifiant = texteExige(champs, 'identifiant');
		const brutesDesPieces = champs.get('pieces_jointes');
		const listeDesPieces: PieceJointeAExporter[] = [];
		if (Array.isArray(brutesDesPieces)) {
			for (const brute of brutesDesPieces) {
				const o = brute as Record<string, unknown>;
				if (
					typeof o.nom !== 'string' ||
					typeof o.type_media !== 'string' ||
					typeof o.deposee_le !== 'string'
				) {
					throw new ArchiveInvalide('pièce jointe incomplète dans le bloc de métadonnées');
				}
				const chemin = dossierDesPiecesDe(identifiant) + '/' + echapperSegment(o.nom);
				const octets = pieces.get(chemin);
				if (octets === undefined) {
					throw new ArchiveInvalide('pièce jointe annoncée et absente : ' + chemin);
				}
				if (typeof o.octets === 'number' && o.octets !== octets.length) {
					throw new ArchiveInvalide('pièce jointe de taille non conforme : ' + chemin);
				}
				listeDesPieces.push({
					nom: o.nom,
					typeMedia: o.type_media,
					deposeeLe: o.deposee_le,
					octets
				});
			}
		}

		notes.push({
			identifiant,
			titre: texteExige(champs, 'titre'),
			typeDeNote: texteExige(champs, 'type'),
			typeDeFiche: texteOuNull(champs, CLE_TYPE_DE_FICHE),
			proprietesDeFiche: champs.get(CLE_PROPRIETES_DE_FICHE) ?? null,
			cheminDeDossier: listeDeTextes(champs, 'dossier'),
			auteur: texteExige(champs, 'auteur'),
			etiquettes: listeDeTextes(champs, 'etiquettes'),
			visibilite: texteExige(champs, 'visibilite'),
			statut: texteExige(champs, 'statut'),
			creeLe: texteExige(champs, 'cree_le'),
			modifieLe: texteExige(champs, 'modifie_le'),
			corpsReferenceModifieLe: texteExige(champs, 'corps_reference_modifie_le'),
			corpsOperationnelModifieLe: texteOuNull(champs, 'corps_operationnel_modifie_le'),
			verifieLe: texteOuNull(champs, 'verifie_le'),
			consultations: nombreLu(champs, 'consultations'),
			signetAdresse: texteOuNull(champs, 'signet_adresse'),
			signetAjouteLe: texteOuNull(champs, 'signet_ajoute_le'),
			revisionDemandee: champs.get('revision_demandee') === true,
			revisionCommentaire: texteOuNull(champs, 'revision_commentaire'),
			revisionPar: texteOuNull(champs, 'revision_par'),
			revisionLe: texteOuNull(champs, 'revision_le'),
			relations: relationsLues(champs),
			corpsReference: remplacerLesAdresses(analyserMarkdown(reference), rendre),
			corpsOperationnel:
				operationnel === null ? null : remplacerLesAdresses(analyserMarkdown(operationnel), rendre),
			piecesJointes: listeDesPieces
		});
	}

	return {
		universIdentifiant: universIdentifiant ?? '',
		universNom: universNom ?? '',
		identifiant: domaineIdentifiant ?? '',
		nom: domaineNom ?? '',
		dossiers,
		notes
	};
}

/* ═════════════════════════════════════════════════ Les deux entrées ═════ */

/** L'archive complète, en octets, et son rapport. */
export interface ExportProduit {
	readonly octets: Uint8Array<ArrayBuffer>;
	readonly rapport: RapportDeConversion;
}

/** Exporte le domaine : l'archive téléchargeable, et le rapport que la vue lit. */
export function exporterLeDomaine(
	domaine: DomaineAExporter,
	avertissementsDAmont: readonly AvertissementDeConversion[] = []
): ExportProduit {
	const construite = construireLArchive(domaine, avertissementsDAmont);
	return { octets: ecrireZip(construite.entrees), rapport: construite.rapport };
}

/** Réimporte l'archive : le domaine, tel qu'il était. C'est `RG-M13-01`. */
export function reimporterLArchive(octets: Uint8Array): DomaineAExporter {
	return lireLArchive(lireZip(octets));
}
