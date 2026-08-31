/**
 * L'archive d'export — `RG-M13-01` : « l'export est réimportable : réimporter l'archive
 * produite doit reconstituer le domaine à l'identique, arborescence, métadonnées,
 * étiquettes et images comprises. C'est le critère de réussite principal. » La propriété
 * prouvée ici est d'un cran au-dessus : exporter → réimporter → réexporter rend LES MÊMES
 * OCTETS.
 *
 * CE QUE LE GEL FIXE DU CONTENU (`V-36:2921-2938`) : un fichier Markdown par note, dont le
 * nom reprend le titre ; l'arborescence de dossiers reproduite ; les métadonnées en en-tête
 * de chaque fichier, dans un bloc de trois tirets — « c'est ce bloc qui rend l'archive
 * réimportable » ; les images et pièces jointes dans un DOSSIER VOISIN ; un rapport de
 * conversion. Cinq éléments, et pas un sixième : ni index, ni manifeste, ni table de
 * relations. LES DEUX LISTES DE MÉTADONNÉES SE COMPLÈTENT : le gel en nomme six,
 * `UC-M13-01` neuf, et l'union des deux est écrite.
 *
 * LA COUTURE AVEC LE CONVERTISSEUR (`ARB-049` décision 5) : `serialiserEnMarkdown` rend le
 * CORPS SEUL et ne commence jamais par trois tirets ; `analyserMarkdown` reçoit le CORPS
 * SEUL. Ce module est l'appelant qui retire l'en-tête, SANS AUCUNE HEURISTIQUE — la première
 * ligne est l'ouverture ou il n'y a pas d'en-tête, chaque ligne est une clé suivie d'une
 * VALEUR JSON sur une seule ligne, et la clôture est la première ligne de trois tirets.
 *
 * LES DEUX REGISTRES DANS UN SEUL FICHIER : le gel dit « UN fichier par note », et aucun
 * séparateur FIXE ne peut convenir — un bloc de code porte son contenu verbatim. La parade
 * n'est pas de deviner en relisant le Markdown (ce serait un second analyseur) : le
 * séparateur est DÉCLARÉ dans l'en-tête et allongé tant qu'il apparaît dans les corps.
 *
 * LES NOMS DE CHEMIN SONT ÉCHAPPÉS : un nom peut porter une barre oblique, que le ZIP
 * emploie comme séparateur, et un renommage silencieux perdrait le nom d'un dossier VIDE
 * qu'aucun en-tête ne porterait. Seuls la barre oblique et le signe pour cent sont échappés
 * — transformation totale, inversible, lisible. Deux noms sont RÉSERVÉS à la racine.
 *
 * CE MODULE NE CONVERTIT RIEN (`ADR-004`) : ce qui est écrit ici est l'ENVELOPPE d'un
 * fichier. Le rapport de conversion est du texte, jamais du Markdown.
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

/**
 * Un dossier du domaine, par son chemin depuis la racine, RACINE INCLUSE. L'ORDRE de la
 * liste porte l'ordre des dossiers frères : `dossiers.position` n'est pas écrite dans
 * l'archive — un dossier vide n'a aucun fichier pour la porter, et l'ordre des entrées d'un
 * ZIP est conservé. La VALEUR d'une position non dense est renormalisée.
 */
export interface DossierAExporter {
	readonly chemin: readonly string[];
}

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

export interface NoteAExporter {
	readonly identifiant: string;
	readonly titre: string;
	readonly typeDeNote: string;
	readonly typeDeFiche: string | null;
	readonly proprietesDeFiche: unknown;
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
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
	readonly piecesJointes: readonly PieceJointeAExporter[];
}

export interface DomaineAExporter {
	readonly universIdentifiant: string;
	readonly universNom: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly dossiers: readonly DossierAExporter[];
	readonly notes: readonly NoteAExporter[];
}

/**
 * Les familles d'avertissement. `RG-M13-02` : « un contenu non convertible
 * n'interrompt pas l'export : la note est ignorée et consignée dans le rapport. »
 * Le gel montre le rapport à trois familles, et les trois sont traitées.
 */
export type FamilleDAvertissement =
	/** `RG-M13-02` — le corps n'est pas convertible : la note n'est PAS dans l'archive. */
	| 'note-ignoree'
	/** `V-36:3044` — « converti en bloc de code, sans rendu graphique ». */
	| 'diagramme'
	/** `V-36:3045` — « exportés comme fichiers de liens, sans contenu distant ». */
	| 'signet'
	| 'image-non-incluse'
	/**
	 * Une pièce jointe que la base recense et dont elle NE PORTE PAS les octets :
	 * la table porte le nom, la taille et le type de média, et aucune colonne de
	 * contenu. Écrire un fichier vide ferait croire à une pièce de zéro octet.
	 */
	| 'piece-sans-octets'
	/** Le nom du fichier ne reprend pas le titre au caractère près (`V-36:2923`). */
	| 'nom-de-fichier';

export interface AvertissementDeConversion {
	readonly famille: FamilleDAvertissement;
	readonly note: string;
	readonly titre: string;
	readonly raison: string;
}

export interface RapportDeConversion {
	readonly notesExportees: number;
	readonly notesIgnorees: number;
	readonly avertissements: readonly AvertissementDeConversion[];
}

/**
 * La famille du gel qui ne peut pas survenir. `V-36:3043` montre « 2 tableaux — à
 * cellules fusionnées, aplatis en tableaux simples » ; le format canonique NE PORTE
 * PAS de cellule fusionnée, et `analyserDocument` refuse tout attribut inconnu.
 * Cette famille est vide par construction : elle est nommée ici, comptée nulle part.
 */
export const FAMILLE_SANS_CAS =
	'cellules fusionnées : le format canonique n’en porte pas, la famille est vide par construction';

/**
 * Les noms et leurs fabriques vivent dans `./noms`, et c'est le correctif : ce module dépend
 * de `node:zlib` par `./zip`, et aucun écran ne pouvait en importer quoi que ce soit sans
 * faire entrer un module de plateforme dans le paquet de navigateur. `V-36` réécrivait donc
 * les noms en littéraux, qui ont divergé.
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

/**
 * Les deux clés de fiche, nommées parce qu'un autre module les relit :
 * `../donnees/import.ts` reprend un fichier écrit ici et doit en retrouver le type
 * de fiche et ses propriétés. Un littéral de chaque côté ferait deux définitions du
 * format, et la divergence ne se verrait qu'à l'aller-retour.
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
 * Écrit le bloc de métadonnées. Une valeur nulle, une liste vide et un objet vide
 * sont OMIS — l'absence est leur écriture, et la lecture le sait. Toute autre
 * valeur est écrite en JSON sur UNE ligne : c'est ce qui rend la clôture du bloc
 * indevinable autrement que par la ligne de trois tirets.
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
	/* La liste finit par une chaîne vide : la jointure pose ainsi le saut de ligne
	   qui clôt le bloc. Aucune ligne vide n'est intercalée — elle appartiendrait au
	   corps, et la lecture aurait alors à décider. */
	lignes.push(CLOTURE_DEN_TETE, '');
	return lignes.join('\n');
}

/**
 * Retire l'en-tête et rend le corps. AUCUNE HEURISTIQUE : la première ligne décide
 * de l'existence du bloc, et la première ligne de trois tirets suivante le clôt. Un
 * corps qui commencerait par un séparateur ne peut pas être pris pour un en-tête —
 * le convertisseur écrit des astérisques.
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
	/* Le corps commence à la ligne qui suit la clôture, sans exception : rien n'est
	   sauté, donc rien n'est perdu si le corps commence par une ligne vide. */
	return { champs, corps: lignes.slice(i + 1).join('\n') };
}

/**
 * Le chemin relatif, depuis le fichier d'une note, vers son dossier de pièces.
 * `V-36:2932` : « les notes y renvoient par CHEMIN RELATIF ».
 */
function cheminRelatifDesPieces(profondeurDuDossier: number, identifiant: string): string {
	return '../'.repeat(profondeurDuDossier) + dossierDesPiecesDe(identifiant);
}

type TableDesImages = Record<string, string>;

/**
 * Parcourt un document canonique et rend une copie où chaque adresse d'image connue
 * est remplacée. Le parcours est GÉNÉRIQUE — il ne connaît du format que le nom du
 * nœud et celui de son attribut d'adresse —, de sorte qu'une image imbriquée dans
 * une cellule ou un conteneur soit atteinte comme une autre.
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

function separateurAbsentDe(corps: readonly string[]): string {
	let separateur = SEPARATEUR_DE_REGISTRE;
	while (corps.some((c) => c.split('\n').includes(separateur))) {
		separateur = ALLONGEMENT + separateur + ALLONGEMENT;
	}
	return separateur;
}

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
	/* La base n'impose pas l'unicité du nom d'une pièce sur une note. Deux homonymes
	   ne feraient qu'UNE entrée d'archive, et la relecture rendrait les mêmes octets
	   aux deux : une perte silencieuse. La note est donc refusée. */
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
		/* DEUX ADRESSES DIFFÉRENTES PEUVENT DÉSIGNER LA MÊME PIÈCE — l'une par son nom
		   nu, l'autre par un chemin qui finit par ce nom. Les réécrire toutes deux
		   vers le même chemin relatif rendrait la table inversible dans un seul sens.
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

function piecePourLEnTete(piece: PieceJointeAExporter): Record<string, unknown> {
	return {
		nom: piece.nom,
		type_media: piece.typeMedia,
		deposee_le: piece.deposeeLe,
		octets: piece.octets.length
	};
}

function nommerLeFichier(
	note: NoteAExporter,
	pris: Set<string>
): { nom: string; avertissement: AvertissementDeConversion | null } {
	const echappe = echapperSegment(note.titre);
	const cle = cheminDArchive(note.cheminDeDossier) + '/' + echappe.toLowerCase();
	/* LE NOM SANS HOMONYME SORT DE LA FABRIQUE PARTAGÉE — celle que `V-36` appelle
	   pour ANNONCER le nom du fichier. Deux compositions séparées avaient déjà
	   divergé une fois. */
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

export interface ArchiveConstruite {
	readonly entrees: readonly EntreeDeZip[];
	readonly rapport: RapportDeConversion;
}

/**
 * Construit l'archive du domaine — les cinq éléments du gel, et rien d'autre.
 *
 * `RG-M13-02` est tenue ici, et c'est le seul endroit où elle peut l'être : une
 * note dont le corps n'est pas convertible est IGNORÉE et consignée.
 */
export function construireLArchive(
	domaine: DomaineAExporter,
	avertissementsDAmont: readonly AvertissementDeConversion[] = []
): ArchiveConstruite {
	const entrees: EntreeDeZip[] = [];
	/* Ce que la LECTURE EN BASE a déjà constaté et que l'archive ne peut pas
	   constater elle-même — une pièce dont le produit ne stocke pas les octets, par
	   exemple. `RG-M13-02` veut que ce soit consigné, et le seul endroit où le faire
	   est ce rapport. */
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
			/* Le refus vient de l'implémentation unique — `MarkdownNonRepresentable` ou
			   `DocumentInvalide`. Les deux se consignent de la même façon : la note
			   n'entre pas dans l'archive. */
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
 * Le rapport de conversion, en TEXTE — `V-36:2937`. Il n'est pas écrit en Markdown,
 * et ce n'est pas une coquetterie : `ADR-004` réserve les formes du Markdown à
 * l'implémentation unique, et un rapport n'est pas une note.
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
 * `RG-M13-01` mesurable : sans lui, « réimportable » serait une déclaration. Le
 * chemin d'import du produit écrira ce domaine en base ; il n'a pas d'autre
 * analyseur à écrire, et il n'en écrira pas (`ADR-004`).
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

export interface ExportProduit {
	readonly octets: Uint8Array<ArrayBuffer>;
	readonly rapport: RapportDeConversion;
}

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
