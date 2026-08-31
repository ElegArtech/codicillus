/**
 * Vérifier une note, et demander sa révision — le mécanisme central du produit, côté
 * écriture : « n'importe quel contributeur habilité peut le remettre au vert EN UN CLIC,
 * SANS FORMULAIRE ».
 *
 * CE MODULE N'ÉCRIT AUCUN CALCUL DE FRAÎCHEUR : il écrit une DATE — `notes.verifie_le` —,
 * et le niveau s'en déduit à la lecture. Aucun seuil, aucun niveau, aucun libellé n'est
 * nommé ici ; le badge repasse au vert parce que la date a bougé.
 *
 * TROIS GESTES, ET LE CAHIER LES SÉPARE : VÉRIFIER (`UC-M06-02`, un bouton, aucun champ,
 * historique conservé dans `verifications`), SIGNALER (`UC-M06-03`, le commentaire est
 * exigé) et LEVER (`M06.3`, `V-14:1427`). Les trois portent la classe `si-ecriture` du gel,
 * dont le régime est `capacites().ecrireDesNotes`.
 *
 * VÉRIFIER N'EST PAS MODIFIER — `RG-M06-05` : « vérifier ne crée pas de version, ne modifie
 * pas le contenu, et ne déclenche pas de signal de désynchronisation ». Les trois négations
 * sont portées PAR LA FORME : `PlanDeVerification` n'a que deux membres et `versions` n'est
 * pas même importée ; `ColonnesDUneVerification` ne déclare ni corps, ni titre, ni
 * `modifieLe`, ni les deux dates de corps dont dépend `RG-M06-08`. `modifie_le` non plus
 * n'est pas touchée : la bouger ouvrirait un SECOND chemin vers le vert, `RG-M06-01`
 * retombant sur la date de modification à défaut de vérification.
 *
 * UNE SEULE DEMANDE COURANTE — `RG-M06-06`, tenue par le schéma : la demande est portée par
 * QUATRE COLONNES DE LA NOTE, jamais par une table. Une seconde demande est un `UPDATE` qui
 * écrase. `RG-M06-07` est tenue par COMPOSITION : les colonnes d'une vérification sont la
 * date de vérification étendue de `LEVEE_DE_LA_DEMANDE`, l'objet même qu'emploie la levée.
 *
 * `P-09` dit que l'action interdite n'est pas RENDUE ; cela ne dispense pas de la REFUSER.
 */
import { eq } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { notes, verifications } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { entretenirLIndex } from '../recherche/entretien';
import { lireLaNote } from './note';
import type { ContexteDeLecture } from './lecture';

/**
 * L'effacement d'une demande de révision — les quatre colonnes remises à leur état neutre.
 * Cet état n'est pas un choix : `notes_revision_coherente` n'admet que deux configurations,
 * tout nul quand la demande est absente, demandeur et date présents quand elle est là.
 *
 * CET OBJET EST EMPLOYÉ DEUX FOIS, et c'est ce qui rend `RG-M06-07` structurelle : la levée
 * l'écrit seul, la vérification l'écrit avec sa date.
 */
export interface LeveeDeLaDemande {
	readonly revisionDemandee: false;
	readonly revisionCommentaire: null;
	readonly revisionParId: null;
	readonly revisionLe: null;
}

export const LEVEE_DE_LA_DEMANDE: LeveeDeLaDemande = Object.freeze({
	revisionDemandee: false,
	revisionCommentaire: null,
	revisionParId: null,
	revisionLe: null
});

/**
 * Les colonnes qu'une vérification écrit sur `notes`, et rien d'autre. Le type est
 * la garantie de `RG-M06-05` : il ne déclare ni corps, ni titre, ni `modifieLe`, ni
 * les deux dates de corps. Un point d'appel qui voudrait en écrire une n'a pas de
 * champ où la poser.
 */
export interface ColonnesDUneVerification extends LeveeDeLaDemande {
	readonly verifieLe: Date;
}

/** La ligne d'historique — `UC-M06-02`, « l'historique complet est conservé ». */
export interface LigneDeVerification {
	readonly noteId: string;
	readonly compteId: string;
	readonly le: Date;
}

/**
 * Le plan d'écriture d'une vérification — deux écritures, et le type n'en autorise
 * pas une troisième. C'est ici que « vérifier ne crée pas de version » devient
 * VÉRIFIABLE plutôt que déclaré : le plan est une donnée, il s'inspecte sans base,
 * et `verifierLaNote()` n'exécute que ce qu'il porte.
 */
export interface PlanDeVerification {
	/** Ce que l'`UPDATE` sur `notes` pose. */
	readonly colonnes: ColonnesDUneVerification;
	/** Ce que l'`INSERT` sur `verifications` pose. */
	readonly journal: LigneDeVerification;
}

/**
 * Le plan d'une vérification — fonction PURE, sans base, sans horloge.
 * `maintenant` est un PARAMÈTRE : une couche d'écriture qui prendrait l'heure
 * elle-même rendrait ses effets non reproductibles.
 */
export function planDUneVerification(
	noteId: string,
	compteId: string,
	maintenant: Date
): PlanDeVerification {
	return {
		colonnes: { verifieLe: maintenant, ...LEVEE_DE_LA_DEMANDE },
		journal: { noteId, compteId, le: maintenant }
	};
}

/**
 * Les colonnes d'une demande de révision — l'autre configuration admise par
 * `notes_revision_coherente`. `revisionCommentaire` est de type `string`, non
 * `string | null` : la contrainte de base tolère une demande sans commentaire, mais
 * `UC-M06-03` ne la tolère pas. Le type est plus strict que le schéma, exprès.
 */
export interface ColonnesDUneDemandeDeRevision {
	readonly revisionDemandee: true;
	readonly revisionCommentaire: string;
	readonly revisionParId: string;
	readonly revisionLe: Date;
}

export function colonnesDUneDemandeDeRevision(
	commentaire: string,
	parId: string,
	quand: Date
): ColonnesDUneDemandeDeRevision {
	return {
		revisionDemandee: true,
		revisionCommentaire: commentaire,
		revisionParId: parId,
		revisionLe: quand
	};
}

/**
 * Le commentaire tel qu'il entre en base — ou `null`, et le geste est refusé. `UC-M06-03`
 * exige l'explication ; un champ vide, blanc ou absent n'en est pas une. Le texte est ébarbé
 * parce qu'il est AFFICHÉ EN TÊTE DE LA NOTE. Aucune longueur maximale n'est posée : ni le
 * cahier ni le gel n'en fixent une, et la poser serait combler.
 */
export function commentaireDeRevision(saisi: unknown): string | null {
	if (typeof saisi !== 'string') return null;
	const net = saisi.trim();
	return net.length === 0 ? null : net;
}

export interface DemandeDeGeste {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
}

interface NoteAAttester {
	readonly noteId: string;
	/** L'état de la demande courante AVANT le geste — `RG-M06-06`, `RG-M06-07`. */
	readonly demandeCourante: boolean;
}

/**
 * Les deux conditions, une seule sortie — celles de `resoudreLEditionDUneNote()` : la note
 * doit être LISIBLE, et l'appelant doit pouvoir écrire sur son dossier porteur.
 *
 * Elle n'appelle pourtant pas cette fonction-là, et c'est délibéré : celle-ci charge le
 * corps, l'analyse, et lit les trois référentiels de saisie. Vérifier n'est pas modifier
 * (`RG-M06-05`) — emprunter la résolution de l'ÉDITION ferait dépendre l'attestation du fait
 * que la note s'ouvre dans l'éditeur.
 */
async function resoudreLeGeste(
	base: Base,
	demande: DemandeDeGeste
): Promise<Resolution<NoteAAttester>> {
	/* Le geste n'existe pas pour l'anonyme (`RG-M17-02`). Le contrôle est redondant
	   avec `ecrireDesNotes`, faux pour l'anonyme par `RG-DRO-04` ; il est écrit
	   parce que la ligne de journal exige un `compteId`, et parce qu'un refus tacite
	   par le typage serait un refus qu'on espère. */
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;

	const lisible = await lireLaNote(base, {
		identifiant: demande.identifiant,
		registre: 'reference',
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!lisible.trouve) return INTROUVABLE;
	if (!lisible.ressource.capacites.ecrireDesNotes) return INTROUVABLE;

	/* `lireLaNote()` rend la note dans la forme du jeu de semence, qui ne porte ni
	   l'identifiant technique ni la demande courante : les deux sont relus ici,
	   APRÈS la décision d'accès, et jamais avant. */
	const [ligne] = await base
		.select({ id: notes.id, revisionDemandee: notes.revisionDemandee })
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	if (ligne === undefined) return INTROUVABLE;

	return {
		trouve: true,
		ressource: { noteId: ligne.id, demandeCourante: ligne.revisionDemandee }
	};
}

export interface VerificationFaite {
	readonly identifiant: string;
	readonly verifieLe: Date;
	/** Une demande de révision courante a été effacée — `RG-M06-07`. */
	readonly demandeEffacee: boolean;
}

/**
 * Vérifier une note — un clic, aucun champ.
 *
 * DEUX ÉCRITURES, UNE SEULE TRANSACTION : une note dont la date bougerait sans sa ligne
 * d'historique serait un historique amputé sans témoin. `notes.verifie_le` est une
 * DÉNORMALISATION — « la dernière ligne de cette table, dénormalisée pour que `RG-M06-01` se
 * lise sans jointure » —, et les deux écritures portent LE MÊME INSTANT.
 *
 * PUIS L'INDEX, ET C'EST LE SEUL DES TROIS GESTES QUI LE TOUCHE : `verifieLe` est un champ
 * triable de la projection. Signaler et lever n'écrivent que les quatre colonnes de
 * révision, dont aucune n'est projetée — cela se lit sur leur type.
 *
 * @throws l'erreur de la tâche du moteur si l'index n'a pas pu être entretenu.
 */
export async function verifierLaNote(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeGeste
): Promise<Resolution<VerificationFaite>> {
	const acces = await resoudreLeGeste(base, demande);
	if (!acces.trouve) return INTROUVABLE;
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;

	const plan = planDUneVerification(
		acces.ressource.noteId,
		demande.identite.compteId,
		demande.maintenant
	);

	await base.transaction(async (tx) => {
		await tx.update(notes).set(plan.colonnes).where(eq(notes.id, plan.journal.noteId));
		await tx.insert(verifications).values({
			noteId: plan.journal.noteId,
			compteId: plan.journal.compteId,
			le: plan.journal.le
		});
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. Le document y
	   est SOUMIS sans que la tâche soit attendue (`ARB-060`). */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return {
		trouve: true,
		ressource: {
			identifiant: demande.identifiant,
			verifieLe: plan.colonnes.verifieLe,
			demandeEffacee: acces.ressource.demandeCourante
		}
	};
}

export interface DemandeDeRevisionFaite {
	readonly identifiant: string;
	readonly commentaire: string;
	readonly le: Date;
	/** La demande a REMPLACÉ une demande courante — `RG-M06-06`. */
	readonly aRemplace: boolean;
}

export interface DemandeDeSignalement extends DemandeDeGeste {
	/** Le commentaire, DÉJÀ ébarbé par `commentaireDeRevision()`. */
	readonly commentaire: string;
}

/**
 * Signaler une note à réviser — et le commentaire n'est pas facultatif.
 *
 * UNE SEULE ÉCRITURE, ET C'EST TOUT `RG-M06-06` : la demande courante vit dans quatre
 * colonnes de la note, un second signalement ÉCRASE le premier, et il n'y a pas de contrôle
 * d'unicité à écrire parce qu'il n'y a pas de seconde ligne possible. `verifie_le` n'est pas
 * touchée : signaler n'atteste rien, et le type le dit.
 */
export async function demanderUneRevision(
	base: Base,
	demande: DemandeDeSignalement
): Promise<Resolution<DemandeDeRevisionFaite>> {
	const acces = await resoudreLeGeste(base, demande);
	if (!acces.trouve) return INTROUVABLE;
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;

	const colonnes = colonnesDUneDemandeDeRevision(
		demande.commentaire,
		demande.identite.compteId,
		demande.maintenant
	);
	await base.update(notes).set(colonnes).where(eq(notes.id, acces.ressource.noteId));

	return {
		trouve: true,
		ressource: {
			identifiant: demande.identifiant,
			commentaire: colonnes.revisionCommentaire,
			le: colonnes.revisionLe,
			aRemplace: acces.ressource.demandeCourante
		}
	};
}

export interface LeveeFaite {
	readonly identifiant: string;
	readonly avaitUneDemande: boolean;
}

/**
 * Lever la demande de révision (`M06.3`, `V-14:1427`).
 *
 * ELLE N'ATTESTE RIEN, et c'est toute la différence avec `verifierLaNote()` : elle écrit
 * `LEVEE_DE_LA_DEMANDE` seul, sans date de vérification et sans ligne d'historique.
 * Confondre les deux remettrait au vert une note dont personne n'a attesté le contenu.
 *
 * L'écriture est INCONDITIONNELLE : une garde ferait dépendre l'effet d'une lecture
 * antérieure à l'écriture, donc d'une course.
 */
export async function leverLaDemandeDeRevision(
	base: Base,
	demande: DemandeDeGeste
): Promise<Resolution<LeveeFaite>> {
	const acces = await resoudreLeGeste(base, demande);
	if (!acces.trouve) return INTROUVABLE;

	await base.update(notes).set(LEVEE_DE_LA_DEMANDE).where(eq(notes.id, acces.ressource.noteId));

	return {
		trouve: true,
		ressource: {
			identifiant: demande.identifiant,
			avaitUneDemande: acces.ressource.demandeCourante
		}
	};
}
