/**
 * Les panneaux latéraux de la lecture d'une note — la matière que V-14 écrivait au balisage :
 * sept panneaux transcrits du gel avec leur contenu d'exemple, identiques quelle que fût la
 * note ouverte, la « valeur illustrative » que `P-02` proscrit.
 *
 * CE FICHIER NE PORTE QUE DES FORMES, JAMAIS DE REQUÊTE : il est importé par la vue, donc par
 * le paquet servi au navigateur, et y importer le schéma de la base l'y ferait entrer.
 */
import type { NiveauFraicheur } from '../fraicheur';

/**
 * Une note voisine — celle qui précède, celle qui suit, dans le même dossier. L'ORDRE EST
 * CELUI DU CORPUS SERVI, et c'est le seul que le produit possède : aucune source ne définit un
 * ordre propre au panneau « Position », et en inventer un serait une décision fonctionnelle
 * prise en exécution. `null` des deux côtés quand la note est seule dans son dossier.
 */
export interface VoisineAffichee {
	readonly identifiant: string;
	/** Le sens du gel : « ← » pour la précédente, « → » pour la suivante. */
	readonly sens: '←' | '→';
	readonly titre: string;
	/** Le niveau porté par la note voisine — jamais recalculé ici (P-01). */
	readonly fraicheur: NiveauFraicheur;
	/** Son ancienneté, entrée de la forme compacte du libellé (ARB-029). */
	readonly jours: number;
	/**
	 * Sa date de dernière vérification, ou `null` — elle n'a jamais été vérifiée, et le libellé
	 * doit le dire. Le champ manquait, et le panneau écrivait « il y a 3 mois » d'une note que
	 * personne n'avait jamais vérifiée : la fraîcheur retombe sur la date de MODIFICATION
	 * (`RG-M06-01`), mais le libellé affirmait alors un geste qui n'avait pas eu lieu.
	 * `EtatDeFraicheur.revise` étant OPTIONNEL, l'omission tombait EN SILENCE.
	 */
	readonly revise: string | null;
}

export interface PieceAffichee {
	readonly nom: string;
	/** Le cartouche d'extension — « PDF », « CSV ». */
	readonly extension: string;
	/** La taille en clair — « 1,2 Mo », « 18 Ko ». */
	readonly taille: string;
	readonly depose: string;
	/**
	 * L'adresse de téléchargement, et elle ne se recompose PAS depuis les champs ci-dessus :
	 * `nom` est le nom AMPUTÉ de son suffixe, l'extension étant montrée à part en cartouche. Les
	 * recoller redonnerait « rapport.PDF » là où la base porte « rapport.pdf », et la route
	 * rendrait 404 sur une pièce qui existe.
	 */
	readonly adresse: string;
}

/** Un kibioctet, et son carré. Les deux seules bornes que le gel exerce. */
const KO = 1024;
const MO = KO * KO;

/**
 * La taille en clair — « 1,2 Mo », « 18 Ko ». Les deux formes viennent du gel et rien d'autre
 * n'y est écrit : l'unité change au mébioctet, le mébioctet porte une décimale, le kibioctet
 * n'en porte aucune, et le séparateur est la virgule française. ELLE N'EST EXERCÉE PAR AUCUNE
 * DONNÉE DU DÉPÔT : `pieces_jointes` est vide, et `P-5` dit ce que vaut une règle qu'aucun cas
 * ne sollicite.
 */
export function tailleEnClair(octets: number): string {
	if (octets >= MO) {
		return `${(octets / MO).toFixed(1).replace('.', ',')} Mo`;
	}
	if (octets >= KO) return `${Math.round(octets / KO)} Ko`;
	return `${octets} o`;
}

/**
 * Le cartouche d'extension — le gel écrit « PDF » et « CSV » à côté d'un nom qui ne la
 * porte pas. Elle se lit sur le nom du fichier ; le type de média sert de repli quand
 * le nom n'a pas de suffixe. Aucune table de correspondance n'est écrite : inventer
 * une traduction de types de média serait combler.
 */
export function extensionEtNom(nom: string, typeMedia: string): { extension: string; nom: string } {
	const point = nom.lastIndexOf('.');
	const suffixe = point > 0 ? nom.slice(point + 1) : '';
	if (suffixe !== '' && suffixe.length <= 4 && /^[a-z0-9]+$/i.test(suffixe)) {
		return { extension: suffixe.toUpperCase(), nom: nom.slice(0, point) };
	}
	const sousType = typeMedia.split('/').at(-1) ?? '';
	return { extension: (sousType === '' ? 'FIC' : sousType.slice(0, 4)).toUpperCase(), nom };
}

/**
 * UNE NOTE AU BOUT D'UNE RELATION — son titre, son type, son domaine, exactement
 * ce que le gel montre : « pg-prod-01 · [Serveur] Infrastructure ».
 */
export interface NoteLiee {
	readonly identifiant: string;
	readonly titre: string;
	readonly type: string;
	readonly domaine: string;
}

/**
 * UN GROUPE DE RELATIONS — un libellé, et les notes qu'il relie. Le libellé est celui du TYPE
 * DE RELATION, dans le sens où la relation est lue : `libelle_sortant` quand la note lue est
 * la source, `libelle_entrant` quand elle est la cible. Le gel porte les deux sens dans le même
 * panneau, et ce type ne les distingue pas autrement que par le libellé.
 */
export interface GroupeDeRelations {
	readonly libelle: string;
	readonly notes: readonly NoteLiee[];
}

/** Une note qui cite celle qu'on lit — `RG-M05-02`, déduite, jamais saisie. */
export interface RetrolienAffiche {
	readonly identifiant: string;
	readonly titre: string;
	readonly domaine: string;
}

/**
 * Une attestation du journal — `M06.2`. `par` vaut `null` quand l'entrée ne porte
 * aucun compte : la colonne est effaçable, et `RG-M15-02` fait de l'anonymat un état
 * normal du journal.
 */
export interface VerificationAffichee {
	readonly par: string | null;
	readonly iso: string;
	readonly jour: string;
}

/**
 * Une propriété typée, telle que la lecture la présente — `CDC:886`.
 *
 * ELLE NE SE LISAIT NULLE PART HORS DE L'ÉDITEUR : `RG-NOT-01` interdit de faire de la fiche
 * un objet séparé de la note ; une fiche dont les propriétés ne se relisent que dans l'éditeur
 * EST cet objet séparé.
 *
 * LE LIBELLÉ ET L'ORDRE VIENNENT DU RÉFÉRENTIEL, JAMAIS DE LA COLONNE : `proprietes_typees`
 * est indexé par la CLÉ du champ. Une propriété que le référentiel ne porte plus n'est pas
 * rendue.
 */
export interface ProprieteDeFicheAffichee {
	readonly nom: string;
	/**
	 * La valeur portée par la note. `null` : la note ne porte rien pour ce champ —
	 * l'absence est DITE, jamais comblée par l'exemple du référentiel, qui serait la
	 * valeur d'une note inventée.
	 */
	readonly valeur: string | null;
}

/** Tout ce que les panneaux latéraux de V-14 lisent, et rien de plus. */
export interface PanneauxDeLaNote {
	readonly voisines: readonly VoisineAffichee[];
	readonly pieces: readonly PieceAffichee[];
	readonly relations: readonly GroupeDeRelations[];
	readonly retroliens: readonly RetrolienAffiche[];
	readonly verifications: readonly VerificationAffichee[];
	/**
	 * Les propriétés typées, dans l'ordre du référentiel — vides quand la note n'est
	 * pas une fiche, et le panneau n'est alors pas rendu du tout.
	 */
	readonly proprietes: readonly ProprieteDeFicheAffichee[];
}
