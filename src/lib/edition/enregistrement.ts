/**
 * L'ENREGISTREMENT D'UNE NOTE — ce qui se décide, et rien qui touche la base.
 *
 * Tout ce module est PUR : il compose la version qu'un enregistrement doit
 * écrire et dit s'il doit en écrire une. L'écriture elle-même est dans
 * `src/lib/donnees/edition.ts`, en une transaction. Le partage n'est pas
 * cosmétique : c'est ce qui rend `RG-M07-01` et `RG-M07-02` éprouvables par
 * `pnpm test:unit`, sans base, donc sans toucher la base partagée par les
 * autres copies de travail.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE GEL DÉCIDE, ET QUE J'AURAIS PU TRANCHER DE TRAVERS
 *
 * `RG-M07-02` — « une version capture : le titre, les deux corps, l'auteur de
 * la modification et la date » — ne dit pas SI la version capture l'état
 * d'AVANT ou d'APRÈS l'enregistrement. Les deux lectures sont cohérentes avec
 * `RG-M07-05` prise seule, et elles produisent deux historiques différents.
 *
 * LE GEL TRANCHE, et il tranche quatre fois. `mockups/V-15-historique.html` :
 *
 *   :2796  la première version de la liste — le plus grand numéro — reçoit
 *          l'attribut de version COURANTE ;
 *   :2826  et le libellé « courante » en propre ;
 *   :2934  la restauration nomme `versions[0]` « l'état actuel » ;
 *   :2929  « Revenir à la version courante » affiche `versions[0]`.
 *
 * La version de plus haut numéro EST donc l'état courant de la note : une
 * version capture ce que l'enregistrement PRODUIT. Les maquettes décident, et
 * elles sont au sommet de l'ordre de préséance — ce n'est pas une déduction de
 * commodité.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS CHOSES QU'AUCUNE SOURCE NE DONNE, ET QUI NE SONT DONC PAS INVENTÉES
 *
 *  1. LE RÉSUMÉ DE VERSION. `versions.resume` est non nul en base
 *     (`004_versions.montee.sql:66`, « la ligne que V-15 affiche en regard du
 *     numéro ») et `seeds/corpus.ts` en porte dix, tous rédigés à la main. Or
 *     NI V-17 NI V-18 n'ont de champ de saisie de résumé — relevé sur les deux
 *     maquettes entières : les seules occurrences du mot sont les résumés du
 *     jeu de démonstration de la planche (V-17:2293-2311, V-18:2584-2602).
 *     Une phrase fabriquée à partir du diff serait une valeur illustrative
 *     (`P-02`) ; le résumé est donc VIDE, et l'absence est dite par l'absence.
 *  2. LA FRAÎCHEUR APRÈS ENREGISTREMENT. `RG-M05-07` — « une note nouvellement
 *     créée ou enregistrée reçoit un signal de fraîcheur vert » — n'est PAS
 *     déclarée tenue par ce lot. Le signal se calcule sur la date de dernière
 *     VÉRIFICATION à défaut de modification (`lecture.ts:372`) : le rendre vert
 *     à l'enregistrement demanderait de décider qu'enregistrer ATTESTE de
 *     l'actualité, c'est-à-dire de confondre « modifier » et « vérifier », deux
 *     termes du vocabulaire contractuel (§3). Aucune source ne le dit. Ce
 *     module écrit donc la date de modification, et rien de la vérification.
 *  3. L'INDEXATION. `RG-M05-06` veut la note trouvable en dix secondes. Le
 *     chemin d'index est celui de `T-051` (`src/lib/recherche/**`), interdit à
 *     ce lot, et aucune interface d'appel n'existe encore. Non tenue, déclarée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES QUANTITÉS TOUCHÉES SONT CALCULÉES, ET PAR L'IMPLÉMENTATION EXISTANTE
 *
 * `seeds/corpus.ts:1381` : « ajout et retrait comptent les lignes touchées ».
 * Le comptage est celui de `comparerEnTexte()` de `src/lib/donnees/histoire.ts`,
 * qui aligne les lignes du rendu Markdown produit par l'implémentation UNIQUE
 * (`ADR-004`). Aucun second alignement n'est écrit ici : deux comptages
 * divergeraient, et c'est le mode de défaillance qu'`ADR-004` nomme.
 *
 * Les DEUX registres comptent, parce qu'une version capture les deux corps :
 * une modification du seul Opérationnel qui rendrait « 0 ligne touchée » serait
 * un historique qui ment.
 */
import { analyserDocument, type Document } from '../contenu/document';
import { comparerEnTexte, empreinteDeNoeud } from '../donnees/histoire';

/* ═══════════════════════════════════ Les deux corps ═════════════════════ */

/** Les deux corps d'une note, tels qu'un enregistrement les porte. */
export interface CorpsDeLaNote {
	readonly reference: Document;
	/** `null` : la note n'a pas de registre Opérationnel (RG-NOT-02). */
	readonly operationnel: Document | null;
}

/**
 * L'état d'une note en base, tel que la requête le rapporte. Les deux corps y
 * sont `unknown` : ce sont des valeurs `jsonb`, et rien ne les a encore fait
 * passer par la porte du format.
 */
export interface EtatEnBase {
	readonly titre: string;
	readonly reference: unknown;
	readonly operationnel: unknown;
}

/**
 * L'EMPREINTE D'UN CORPS — et pourquoi elle ne se compare pas par `JSON`.
 *
 * PostgreSQL trie les clés d'une valeur `jsonb` : le document relu n'a pas
 * l'ordre de clés du document écrit, et une comparaison de chaînes rendrait
 * TOUJOURS « modifié ». Chaque enregistrement écrirait alors une version, ce
 * que `RG-M07-01` interdit en propres termes.
 *
 * La normalisation employée est celle d'`empreinteDeNoeud` (`histoire.ts`),
 * seule écriture de « contenu normalisé » du dépôt (ADR-003) : un second
 * normaliseur divergerait, et la divergence ne se verrait qu'à l'historique.
 * L'absence de corps a son empreinte propre — un Opérationnel supprimé est un
 * changement.
 */
export function empreinteDuCorps(valeur: unknown): string {
	if (valeur === null || valeur === undefined) return 'absent';
	return analyserDocument(valeur).content.map(empreinteDeNoeud).join('\0');
}

/**
 * `RG-M07-01` — « une version est capturée à chaque enregistrement qui modifie
 * le corps Référence OU le corps Opérationnel. Un enregistrement sans
 * changement de contenu ne crée pas de version. »
 *
 * Le TITRE ne compte pas : la règle nomme les corps, et elle les nomme tous les
 * deux. Un simple renommage ne crée donc pas de version — et le titre est
 * pourtant capturé par celles qui existent (`RG-M07-02`), ce qui n'est pas une
 * contradiction : la capture dit ce que la note s'appelait quand son contenu a
 * changé.
 */
export function contenuModifie(avant: EtatEnBase, apres: CorpsDeLaNote): boolean {
	return (
		empreinteDuCorps(avant.reference) !== empreinteDuCorps(apres.reference) ||
		empreinteDuCorps(avant.operationnel) !== empreinteDuCorps(apres.operationnel)
	);
}

/** Les lignes touchées par un enregistrement, les deux registres réunis. */
export function quantitesTouchees(
	avant: EtatEnBase,
	apres: CorpsDeLaNote
): { readonly ajout: number; readonly retrait: number } {
	const r = comparerEnTexte(avant.reference, apres.reference);
	const o = comparerEnTexte(avant.operationnel, apres.operationnel);
	return { ajout: r.ajouts + o.ajouts, retrait: r.retraits + o.retraits };
}

/* ═══════════════════════════════════ La version à écrire ═══════════════ */

/**
 * LE RÉSUMÉ NON SAISI. Vide, et nommé : une constante dit qu'il s'agit d'une
 * lacune connue, là où un littéral vide au milieu d'un objet passerait pour un
 * oubli. Voir l'en-tête, point 1.
 */
export const RESUME_NON_SAISI = '';

/** Une ligne de `versions` prête à écrire — la forme du schéma, rien de plus. */
export interface VersionAEcrire {
	readonly numero: number;
	readonly le: Date;
	readonly auteurId: string;
	readonly resume: string;
	readonly ajout: number;
	readonly retrait: number;
	readonly titre: string;
	readonly corpsReference: Document;
	readonly corpsOperationnel: Document | null;
}

/** Ce qu'un enregistrement doit savoir pour composer sa version. */
export interface DemandeDEnregistrement {
	/** Le plus grand numéro déjà écrit pour cette note, ou 0 si aucun. */
	readonly dernierNumero: number;
	readonly auteurId: string;
	readonly maintenant: Date;
	readonly titre: string;
	readonly corps: CorpsDeLaNote;
	readonly avant: EtatEnBase;
}

/**
 * LA VERSION D'UN ENREGISTREMENT — ou `null` quand `RG-M07-01` en dispense.
 *
 * Le numéro suit le plus grand écrit, jamais le NOMBRE de lignes : la purge de
 * `RG-M07-03` retire les plus anciennes, et compter les lignes ferait alors
 * réémettre un numéro déjà employé — que la contrainte d'unicité par note
 * refuserait, et au plus mauvais moment. La purge est plus bas, dans ce même
 * module (`numerosExcedentaires`), et le plafond vit dans les paramètres
 * (`versions_max`), jamais en dur.
 */
export function versionDUnEnregistrement(demande: DemandeDEnregistrement): VersionAEcrire | null {
	if (!contenuModifie(demande.avant, demande.corps)) return null;
	const quantites = quantitesTouchees(demande.avant, demande.corps);
	return {
		numero: demande.dernierNumero + 1,
		le: demande.maintenant,
		auteurId: demande.auteurId,
		resume: RESUME_NON_SAISI,
		ajout: quantites.ajout,
		retrait: quantites.retrait,
		titre: demande.titre,
		corpsReference: demande.corps.reference,
		corpsOperationnel: demande.corps.operationnel
	};
}

/* ═══════════════════════════════════ La purge du plafond ═══════════════ */

/**
 * `RG-M07-03` — « Le nombre de versions conservées par note est plafonné,
 * valeur configurable (défaut : 50). Au-delà, les plus anciennes sont purgées. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE RATTRAPE, ELLE NE FAIT PAS QUE PLAFONNER
 *
 * V-33 ne promet pas seulement un plafond glissant : « RÉDUIRE CETTE VALEUR
 * SUPPRIMERA LES VERSIONS EXCÉDENTAIRES dès le prochain enregistrement d'une
 * note ». Retirer la seule plus ancienne à chaque enregistrement tiendrait la
 * première phrase de l'écran et pas la seconde : une note de cinquante versions
 * mettrait quarante-cinq enregistrements à redescendre à cinq. Cette fonction
 * rend donc TOUT l'excédent d'un coup.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI EST GARDÉ EST DÉSIGNÉ PAR LE NUMÉRO, JAMAIS PAR UN SEUIL CALCULÉ
 *
 * `numero - plafond` serait juste tant que les numéros restent contigus, et
 * faux le jour où ils ne le sont plus — la purge elle-même creuse la suite par
 * le bas, et rien n'interdit à une reprise de base d'en creuser le milieu. Les
 * numéros PRÉSENTS sont donc triés, les `plafond` plus grands sont gardés, le
 * reste part. La liste rendue est celle des numéros À SUPPRIMER.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN PLAFOND QUI N'EN EST PAS UN NE PURGE RIEN — ET C'EST LA DIRECTION SÛRE
 *
 * `validerLaConfiguration()` (`administration.ts`) ne contrôle PAS ce champ :
 * le gel ne lui donne aucun bloc d'erreur, et le refus de combler ce vide est
 * déclaré au rapport de son lot. Conséquence mesurable : le champ vidé donne
 * `Number('') === 0`, et un `0` peut donc atteindre `parametres`. Un plafond
 * nul ou négatif pris à la lettre effacerait TOUT l'historique de la première
 * note enregistrée après la faute de frappe. Ce n'est pas un plafond : c'est
 * une valeur hors domaine, et la seule réponse qui ne détruit rien est de ne
 * rien purger. Le même refus couvre le non-entier et le non-fini.
 */
export function numerosExcedentaires(
	numeros: readonly number[],
	plafond: number
): readonly number[] {
	if (!Number.isSafeInteger(plafond) || plafond < 1) return [];
	if (numeros.length <= plafond) return [];
	const parNumeroDecroissant = [...numeros].sort((a, b) => b - a);
	return parNumeroDecroissant.slice(plafond);
}
