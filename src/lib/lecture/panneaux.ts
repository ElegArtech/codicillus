/**
 * LES PANNEAUX LATÉRAUX DE LA LECTURE D'UNE NOTE — la matière que V-14 écrivait
 * au balisage.
 *
 * `src/vues/V-14.svelte` transcrivait sept panneaux du gel avec leur contenu
 * d'exemple : deux notes voisines nommées, deux pièces jointes, quatre
 * relations, trois rétroliens, quatre vérifications et trois notes connexes.
 * Aucun ne venait de la base, et tous s'affichaient à l'identique quelle que
 * fût la note ouverte — la « valeur illustrative » que P-02 proscrit.
 *
 * CE FICHIER NE PORTE QUE DES FORMES, JAMAIS DE REQUÊTE. Il est importé par la
 * vue, donc par le paquet servi au navigateur : y importer le schéma de la base
 * l'y ferait entrer avec lui. Les requêtes vivent dans le chargeur de la route,
 * `src/routes/notes/[identifiant]/+page.server.ts`, et lui seul.
 *
 * VOCABULAIRE CONTRACTUEL (`CLAUDE.md` §3) : Note, Relation, Étiquette,
 * Domaine, Dossier, Vérifier. Aucun synonyme n'apparaît dans les noms ci-dessous.
 */
import type { NiveauFraicheur } from '../fraicheur';

/* ═══════════════════════════════════════════ Le panneau « Position » ════ */

/**
 * UNE NOTE VOISINE — celle qui précède, celle qui suit, dans le même dossier.
 *
 * L'ORDRE EST CELUI DU CORPUS SERVI, et c'est le seul que le produit possède :
 * `lireNotes()` classe par identifiant, et toutes les listes du produit en
 * héritent. Aucune source ne définit un ordre propre au panneau « Position » ;
 * en inventer un (par titre, par date, par pertinence) serait une décision
 * fonctionnelle prise en exécution. L'écart au gel — qui montre « Planifier »
 * avant et « Purger » après, ce qu'aucun ordre dérivable ne redonne — est
 * signalé au rapport du lot.
 *
 * `null` des deux côtés quand la note est seule dans son dossier : le panneau
 * n'affiche alors que sa ligne de rangement.
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
}

/* ═══════════════════════════════════════ Le panneau « Pièces jointes » ══ */

/** Une pièce jointe, dans les quatre formes que le gel rend côte à côte. */
export interface PieceAffichee {
	readonly nom: string;
	/** Le cartouche d'extension — « PDF », « CSV ». */
	readonly extension: string;
	/** La taille en clair — « 1,2 Mo », « 18 Ko ». */
	readonly taille: string;
	/** La date de dépôt en toutes lettres. */
	readonly depose: string;
	/**
	 * L'ADRESSE DE TÉLÉCHARGEMENT — `adresseDePieceJointe()`, et elle ne se
	 * recompose PAS depuis les champs ci-dessus.
	 *
	 * `nom` est ce que le GEL rend : le nom AMPUTÉ de son suffixe, l'extension
	 * étant montrée à part en cartouche (`V-14:1830-1834`). L'adresse, elle,
	 * prend le nom de FICHIER que `pieces_jointes.nom` porte, suffixe compris —
	 * les recoller à l'écran redonnerait « rapport.PDF » là où la base porte
	 * « rapport.pdf », et la route rendrait 404 sur une pièce qui existe.
	 *
	 * Elle est donc SERVIE par le chargeur, qui a le nom de fichier sous la
	 * main, et le gel n'avait aucun moyen de la porter : il écrit une ancre
	 * vide, faute de serveur.
	 */
	readonly adresse: string;
}

/** Un kibioctet, et son carré. Les deux seules bornes que le gel exerce. */
const KO = 1024;
const MO = KO * KO;

/**
 * LA TAILLE EN CLAIR — « 1,2 Mo », « 18 Ko ».
 *
 * Les deux formes viennent du gel (`V-14:1833`, `:1838`) et rien d'autre n'y
 * est écrit : l'unité change au mébioctet, le mébioctet porte une décimale, le
 * kibioctet n'en porte aucune, et le séparateur décimal est la virgule
 * française. Ce sont les deux seuls cas que le gel exerce ; l'octet nu est la
 * conséquence de la même règle, non un troisième format inventé.
 *
 * ELLE N'EST EXERCÉE PAR AUCUNE DONNÉE DU DÉPÔT : `pieces_jointes` est vide,
 * et `P-5` dit ce que vaut une règle qu'aucun cas ne sollicite. Le fait est
 * signalé au rapport plutôt que caché.
 */
export function tailleEnClair(octets: number): string {
	if (octets >= MO) {
		return `${(octets / MO).toFixed(1).replace('.', ',')} Mo`;
	}
	if (octets >= KO) return `${Math.round(octets / KO)} Ko`;
	return `${octets} o`;
}

/**
 * LE CARTOUCHE D'EXTENSION — le gel écrit « PDF » et « CSV » à côté d'un nom
 * qui, lui, ne la porte pas.
 *
 * Elle se lit sur le nom du fichier, qui est la seule chose que l'utilisateur a
 * nommée ; le type de média sert de repli quand le nom n'a pas de suffixe.
 * Aucune table de correspondance n'est écrite : inventer une traduction de
 * types de média serait combler.
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

/* ══════════════════════════════════════════ Le panneau « Relations » ════ */

/**
 * UNE NOTE AU BOUT D'UNE RELATION — son titre, son type, son domaine, exactement
 * ce que le gel montre : « pg-prod-01 · [Serveur] Infrastructure ».
 */
export interface NoteLiee {
	readonly identifiant: string;
	readonly titre: string;
	/** Le type de la note, rendu en pastille. */
	readonly type: string;
	readonly domaine: string;
}

/**
 * UN GROUPE DE RELATIONS — un libellé, et les notes qu'il relie.
 *
 * Le libellé est celui du TYPE DE RELATION, dans le sens où la relation est
 * lue : `libelle_sortant` quand la note lue est la source (« S'applique à »),
 * `libelle_entrant` quand elle est la cible (« Est référencée par »). Le gel
 * porte les deux sens dans le même panneau, et ce type ne les distingue pas
 * autrement que par le libellé — c'est déjà ce que le gel fait.
 */
export interface GroupeDeRelations {
	readonly libelle: string;
	readonly notes: readonly NoteLiee[];
}

/* ══════════════════════════════════════════ Le panneau « Rétroliens » ═══ */

/** Une note qui cite celle qu'on lit — `RG-M05-02`, déduite, jamais saisie. */
export interface RetrolienAffiche {
	readonly identifiant: string;
	readonly titre: string;
	readonly domaine: string;
}

/* ══════════════════════════ Le panneau « Historique de vérification » ═══ */

/**
 * UNE ATTESTATION DU JOURNAL — `M06.2`, « l'historique complet des
 * vérifications est conservé ».
 *
 * `par` vaut `null` quand l'entrée ne porte aucun compte : la colonne est
 * effaçable, et `RG-M15-02` fait de l'anonymat un état normal du journal.
 */
export interface VerificationAffichee {
	readonly par: string | null;
	readonly iso: string;
	readonly jour: string;
}

/* ══════════════════════════════ Le panneau « Propriétés de fiche » ══════ */

/**
 * UNE PROPRIÉTÉ TYPÉE, TELLE QUE LA LECTURE LA PRÉSENTE — `CDC:886` : « la
 * lecture présente ces propriétés dans un panneau structuré et lisible ».
 *
 * ELLE NE SE LISAIT NULLE PART HORS DE L'ÉDITEUR. La valeur s'écrivait dans
 * `notes.proprietes_typees`, se remontrait en modification et partait dans
 * l'archive — la page de lecture n'en affichait aucune. `RG-NOT-01` interdit
 * de faire de la fiche un objet séparé de la note ; une fiche dont les
 * propriétés ne se relisent que dans l'éditeur EST cet objet séparé.
 *
 * LE LIBELLÉ ET L'ORDRE VIENNENT DU RÉFÉRENTIEL, JAMAIS DE LA COLONNE.
 * `proprietes_typees` est indexé par la CLÉ du champ (`nom-dns`) ; le nom
 * affichable (« Nom DNS ») et le rang sont ceux de `champs_de_type_de_fiche`.
 * Une propriété que le référentiel ne porte plus n'est donc pas rendue — le
 * schéma décide de ce qui se lit, comme il décide de ce qui se saisit.
 */
export interface ProprieteDeFicheAffichee {
	/** Le nom affichable du champ, tel que le référentiel le porte. */
	readonly nom: string;
	/**
	 * La valeur portée par la note. `null` : la note ne porte rien pour ce
	 * champ — l'absence est DITE (`RG-M18-03`), jamais comblée par l'exemple du
	 * référentiel, qui serait la valeur d'une note inventée (P-02).
	 */
	readonly valeur: string | null;
}

/* ═══════════════════════════════════════════════════ L'ensemble ═════════ */

/** Tout ce que les panneaux latéraux de V-14 lisent, et rien de plus. */
export interface PanneauxDeLaNote {
	readonly voisines: readonly VoisineAffichee[];
	readonly pieces: readonly PieceAffichee[];
	readonly relations: readonly GroupeDeRelations[];
	readonly retroliens: readonly RetrolienAffiche[];
	readonly verifications: readonly VerificationAffichee[];
	/**
	 * LES PROPRIÉTÉS TYPÉES, DANS L'ORDRE DU RÉFÉRENTIEL — vides quand la note
	 * n'est pas une fiche, et le panneau n'est alors pas rendu du tout
	 * (`BRIEF-VUES.md:797` : « si la note est une fiche »).
	 */
	readonly proprietes: readonly ProprieteDeFicheAffichee[];
}
