/**
 * `RG-NF-05` — LA TRACE D'UNE ACTION DESTRUCTIVE, ÉCRITE UNE SEULE FOIS ICI.
 *
 * « Les actions destructives sont confirmées, tracées et attribuées à leur auteur. » La
 * confirmation vit dans les écrans, l'attribution et la trace vivent dans ce module et dans
 * la table qu'il écrit.
 *
 * LA RÈGLE D'EMPLOI TIENT EN UNE PHRASE : `tracerUneSuppression()` s'appelle AVEC LA
 * TRANSACTION QUI DÉTRUIT, jamais avec la base. Une trace validée séparément de la
 * destruction ment dès la première transaction annulée — dans un sens, un objet détruit
 * sans trace ; dans l'autre, une trace d'une destruction qui n'a pas eu lieu. La signature
 * ne prend donc pas de `Base` : elle prend l'exécutant de la transaction en cours.
 *
 * L'AUTEUR EST EXIGÉ, ET LE TYPE LE DIT. `auteurDeLaSuppression()` refuse une identité
 * anonyme plutôt que d'écrire une trace sans auteur : aucune destruction du produit n'est
 * accessible sans session, et une trace non attribuée signalerait un chemin d'écriture
 * ouvert. L'échec est bruyant, et il annule la destruction avec lui — c'est le comportement
 * voulu : mieux vaut ne pas détruire que détruire sans savoir qui.
 *
 * CE MODULE NE RECOPIE AUCUN CONTENU DÉTRUIT. Ce n'est pas une corbeille — `RG-M14-03` veut
 * la suppression « atomique et définitive ». `detail` porte le RÉCAPITULATIF que l'écran de
 * confirmation a déjà montré, pas les octets.
 */
import { desc, eq } from 'drizzle-orm';
import type { Base, ExecuteurDeBase } from '../base/acces';
import { comptes, tracesDeSuppression } from '../base/schema';
import type { Identite } from '../droits/resolution';

/**
 * LES NATURES TRACÉES — la liste est CLOSE, et sa clôture est le propos : un chemin de
 * destruction ajouté sans entrée ici ne compile pas, donc ne peut pas passer sans trace.
 * Les noms sont ceux du vocabulaire du produit, au singulier.
 */
export type ObjetSupprime =
	| 'note'
	| 'dossier'
	| 'univers'
	| 'domaine'
	| 'type de fiche'
	| 'type de note'
	| 'type de relation'
	| 'template'
	| 'relation'
	| 'pièce jointe'
	| 'signet';

/** L'auteur d'une destruction — jamais anonyme (voir l'en-tête). */
export interface AuteurDeSuppression {
	readonly compteId: string;
}

/** Levée quand une destruction n'a pas d'auteur attribuable. */
export class SuppressionNonAttribuableErreur extends Error {
	constructor() {
		super(
			'RG-NF-05 : une action destructive doit être attribuée à son auteur, et ' +
				'l’identité reçue est anonyme. Rien n’a été détruit.'
		);
		this.name = 'SuppressionNonAttribuableErreur';
	}
}

/**
 * L'AUTEUR, DÉRIVÉ DE L'IDENTITÉ DE LA REQUÊTE. À appeler AVANT d'ouvrir la transaction :
 * un refus doit tomber avant toute destruction, pas au milieu.
 *
 * @throws `SuppressionNonAttribuableErreur` si l'identité est anonyme.
 */
export function auteurDeLaSuppression(identite: Identite): AuteurDeSuppression {
	if (identite.type !== 'authentifie') throw new SuppressionNonAttribuableErreur();
	return { compteId: identite.compteId };
}

export interface SuppressionATracer {
	readonly objet: ObjetSupprime;
	/** L'identifiant de la cible TEL QU'IL ÉTAIT — du texte, la ligne n'existant plus. */
	readonly reference: string;
	/** Son nom lisible au moment du geste. */
	readonly designation: string;
	/** Ce qui est parti AVEC, en clair — « 2 notes, 1 dossier ». Vide si rien. */
	readonly detail?: string;
	readonly auteur: AuteurDeSuppression;
	/** L'instant du geste. Absent : celui de l'écriture. */
	readonly maintenant?: Date;
}

/**
 * ÉCRIT LA TRACE. `executant` EST LA TRANSACTION QUI DÉTRUIT — voir l'en-tête.
 *
 * L'ordre par rapport au `delete` n'a aucune importance à l'intérieur d'une transaction :
 * les deux sont validés ensemble ou pas du tout. Ce qui importe est qu'ils partagent la
 * transaction, et la signature est là pour l'obtenir.
 */
export async function tracerUneSuppression(
	executant: ExecuteurDeBase,
	suppression: SuppressionATracer
): Promise<void> {
	await executant.insert(tracesDeSuppression).values({
		objet: suppression.objet,
		reference: suppression.reference,
		designation: suppression.designation,
		detail: suppression.detail ?? '',
		auteurId: suppression.auteur.compteId,
		...(suppression.maintenant === undefined ? {} : { le: suppression.maintenant })
	});
}

/** Une trace relue, avec l'auteur résolu en nom lisible. */
export interface TraceLue {
	readonly objet: string;
	readonly reference: string;
	readonly designation: string;
	readonly detail: string;
	readonly auteur: string;
	readonly le: Date;
}

/**
 * LES DERNIÈRES DESTRUCTIONS, LA PLUS RÉCENTE D'ABORD — la lecture de l'index. Le nom de
 * l'auteur est JOINT, jamais recopié dans la trace : un compte renommé garde ses
 * destructions, et la table n'a pas deux vérités sur son nom.
 */
export async function lireLesTracesDeSuppression(
	base: Base,
	plafond: number
): Promise<readonly TraceLue[]> {
	const lignes = await base
		.select({
			objet: tracesDeSuppression.objet,
			reference: tracesDeSuppression.reference,
			designation: tracesDeSuppression.designation,
			detail: tracesDeSuppression.detail,
			auteur: comptes.nom,
			le: tracesDeSuppression.le
		})
		.from(tracesDeSuppression)
		.innerJoin(comptes, eq(comptes.id, tracesDeSuppression.auteurId))
		.orderBy(desc(tracesDeSuppression.le))
		.limit(plafond);
	return lignes;
}
