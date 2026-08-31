/**
 * L'enregistrement d'une note — ce qui se décide, et rien qui touche la base. Tout ce module
 * est PUR : il compose la version qu'un enregistrement doit écrire et dit s'il doit en écrire
 * une, ce qui rend `RG-M07-01` et `RG-M07-02` éprouvables sans base.
 *
 * UNE VERSION CAPTURE CE QUE L'ENREGISTREMENT PRODUIT, et c'est le gel qui tranche —
 * `RG-M07-02` ne dit pas si la capture porte l'état d'avant ou d'après. V-15 le dit quatre
 * fois : la version de plus haut numéro porte l'attribut « courante ».
 *
 * TROIS CHOSES QU'AUCUNE SOURCE NE DONNE, ET QUI NE SONT DONC PAS INVENTÉES :
 *
 *  1. LE RÉSUMÉ DE VERSION. Ni V-17 ni V-18 n'ont de champ de saisie — une phrase fabriquée à
 *     partir du diff serait une valeur illustrative. Le résumé est VIDE.
 *  2. LA FRAÎCHEUR APRÈS ENREGISTREMENT. `RG-M05-07` n'est PAS déclarée tenue : la rendre
 *     verte demanderait de confondre « modifier » et « vérifier ».
 *  3. L'INDEXATION, dont le chemin appartient à un autre module.
 *
 * LES QUANTITÉS TOUCHÉES SONT CALCULÉES PAR L'IMPLÉMENTATION EXISTANTE — `comparerEnTexte()`.
 * Les DEUX registres comptent : une modification du seul Opérationnel qui rendrait « 0 ligne
 * touchée » serait un historique qui ment.
 */
import { analyserDocument, type Document } from '../contenu/document';
import { comparerEnTexte, empreinteDeNoeud } from '../donnees/histoire';

export interface CorpsDeLaNote {
	readonly reference: Document;
	/** `null` : la note n'a pas de registre Opérationnel (RG-NOT-02). */
	readonly operationnel: Document | null;
}

/**
 * L'état d'une note en base, tel que la requête le rapporte. Les deux corps y sont
 * `unknown` : ce sont des valeurs `jsonb`, et rien ne les a encore fait passer par la
 * porte du format.
 */
export interface EtatEnBase {
	readonly titre: string;
	readonly reference: unknown;
	readonly operationnel: unknown;
}

/**
 * L'empreinte d'un corps — et pourquoi elle ne se compare pas par `JSON`. PostgreSQL trie les
 * clés d'une valeur `jsonb` : le document relu n'a pas l'ordre de clés du document écrit, et
 * une comparaison de chaînes rendrait TOUJOURS « modifié », ce que `RG-M07-01` interdit. La
 * normalisation employée est celle d'`empreinteDeNoeud`, seule écriture de « contenu
 * normalisé » du dépôt. L'absence de corps a son empreinte propre.
 */
export function empreinteDuCorps(valeur: unknown): string {
	if (valeur === null || valeur === undefined) return 'absent';
	return analyserDocument(valeur).content.map(empreinteDeNoeud).join('\0');
}

/**
 * `RG-M07-01` — « une version est capturée à chaque enregistrement qui modifie le corps
 * Référence OU le corps Opérationnel ». Le TITRE ne compte pas : la règle nomme les corps. Un
 * simple renommage ne crée donc pas de version, et le titre est pourtant capturé par celles
 * qui existent — la capture dit ce que la note s'appelait quand son contenu a changé.
 */
export function contenuModifie(avant: EtatEnBase, apres: CorpsDeLaNote): boolean {
	return (
		empreinteDuCorps(avant.reference) !== empreinteDuCorps(apres.reference) ||
		empreinteDuCorps(avant.operationnel) !== empreinteDuCorps(apres.operationnel)
	);
}

export function quantitesTouchees(
	avant: EtatEnBase,
	apres: CorpsDeLaNote
): { readonly ajout: number; readonly retrait: number } {
	const r = comparerEnTexte(avant.reference, apres.reference);
	const o = comparerEnTexte(avant.operationnel, apres.operationnel);
	return { ajout: r.ajouts + o.ajouts, retrait: r.retraits + o.retraits };
}

/**
 * Le résumé non saisi. Vide, et nommé : une constante dit qu'il s'agit d'une lacune
 * connue, là où un littéral vide passerait pour un oubli.
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

export interface DemandeDEnregistrement {
	readonly dernierNumero: number;
	readonly auteurId: string;
	readonly maintenant: Date;
	readonly titre: string;
	readonly corps: CorpsDeLaNote;
	readonly avant: EtatEnBase;
}

/**
 * La version d'un enregistrement — ou `null` quand `RG-M07-01` en dispense.
 *
 * Le numéro suit le plus grand écrit, jamais le NOMBRE de lignes : la purge retire
 * les plus anciennes, et compter les lignes ferait réémettre un numéro déjà employé
 * — que la contrainte d'unicité refuserait, au plus mauvais moment.
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

/**
 * `RG-M07-03` — « le nombre de versions conservées par note est plafonné, valeur configurable.
 * Au-delà, les plus anciennes sont purgées. »
 *
 * ELLE RATTRAPE, ELLE NE FAIT PAS QUE PLAFONNER : V-33 promet que « réduire cette valeur
 * supprimera les versions excédentaires dès le prochain enregistrement ». Cette fonction rend
 * donc TOUT l'excédent d'un coup.
 *
 * CE QUI EST GARDÉ EST DÉSIGNÉ PAR LE NUMÉRO, JAMAIS PAR UN SEUIL CALCULÉ : `numero - plafond`
 * serait faux dès que les numéros cessent d'être contigus — la purge elle-même creuse la suite
 * par le bas.
 *
 * AUCUNE POLITIQUE SUR LE PLAFOND N'EST ÉCRITE ICI : `RG-M14-10` fait refuser un plafond hors
 * domaine à la validation, et `lireConfiguration()` replie le défaut POUR TOUS SES LECTEURS À
 * LA FOIS. Une rédaction antérieure inventait sa propre règle et LAISSAIT l'écran annoncer
 * « les 0 dernières sont gardées ».
 */
export function numerosExcedentaires(
	numeros: readonly number[],
	plafond: number
): readonly number[] {
	if (numeros.length <= plafond) return [];
	const parNumeroDecroissant = [...numeros].sort((a, b) => b - a);
	return parNumeroDecroissant.slice(plafond);
}
