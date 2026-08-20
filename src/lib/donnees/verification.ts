/**
 * VÉRIFIER UNE NOTE, ET DEMANDER SA RÉVISION — le mécanisme central du produit,
 * côté écriture.
 *
 * `CLAUDE.md` §1 décrit Codicillus par ce geste : « n'importe quel contributeur
 * habilité peut le remettre au vert EN UN CLIC, SANS FORMULAIRE. C'est le
 * mécanisme central du produit. » Le signal était calculé et affiché partout ;
 * rien ne l'actionnait.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE N'ÉCRIT AUCUN CALCUL DE FRAÎCHEUR — `P-01` À L'ENVERS
 *
 * `src/lib/fraicheur.ts` est l'implémentation unique (`ADR-005`), et rien ici
 * ne la double : ce module écrit une DATE — `notes.verifie_le` —, et le niveau
 * s'en déduit à la lecture, par `lireNotes()` qui appelle `niveauFraicheur()`
 * sur `verifieLe ?? modifieLe` (`./lecture.ts`). Aucun seuil, aucun niveau,
 * aucun libellé, aucune classe de témoin n'est nommé dans ce fichier. Le badge
 * « repasse au vert » parce que la date a bougé, jamais parce qu'un second
 * calcul l'aurait décidé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS GESTES, ET LE CAHIER LES SÉPARE
 *
 *   VÉRIFIER   `UC-M06-02` — « un utilisateur habilité atteste qu'une note est
 *              toujours d'actualité ». Un bouton, aucun champ. La date et
 *              l'identité du vérificateur sont enregistrées, et l'historique
 *              complet est conservé — c'est la table `verifications`.
 *   SIGNALER   `UC-M06-03` — « un utilisateur signale qu'une note doit être
 *              révisée, EN EXPLIQUANT POURQUOI ». Le commentaire est donc exigé,
 *              et son absence refuse le geste.
 *   LEVER      `M06.3`, dernière puce — « une action permet de lever la
 *              demande ». Le gel la rend : `V-14:1427`, bouton « Lever la
 *              demande » dans le bandeau de révision.
 *
 * LES TROIS SONT DES ACTIONS D'ÉCRITURE, ET LE GEL LE DIT. `V-14:1471` (les
 * deux boutons du cartouche), `V-14:1482` (le panneau de signalement) et
 * `V-14:1427` (« Lever la demande ») portent tous la classe `si-ecriture`, que
 * `V-14:403` éteint sous `.app[data-droits="lecture"]`. Le régime d'écriture de
 * cette vue est `capacites().ecrireDesNotes` — c'est déjà ce que le chargeur de
 * la route en fait. `RG-M05-08` range d'ailleurs « Modifier, VÉRIFIER,
 * SIGNALER, Supprimer » dans une seule famille, et CDC §2.3 ne connaît qu'une
 * colonne d'écriture : « créer / modifier des notes ». Aucune règle de droit
 * n'est donc écrite ici — `resolution.ts` reste l'unique table.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * VÉRIFIER N'EST PAS MODIFIER — `RG-M06-05`, ET SES TROIS NÉGATIONS
 *
 * « La vérification est une action DISTINCTE de la modification. Vérifier ne
 * crée pas de version, ne modifie pas le contenu, et ne déclenche pas de signal
 * de désynchronisation du registre Opérationnel. »
 *
 * Les trois négations sont portées PAR LA FORME, non par la discipline :
 *
 *   pas de version         `PlanDeVerification` n'a que deux membres —
 *                          les colonnes de `notes`, et la ligne de journal. Il
 *                          n'existe aucun champ où une version pourrait
 *                          s'écrire, et `verifierLaNote()` n'exécute que ce que
 *                          le plan porte. `versions` n'est pas même importée.
 *   pas de contenu         `ColonnesDUneVerification` ne déclare ni
 *                          `corpsReference`, ni `corpsOperationnel`, ni
 *                          `titre`, ni `modifieLe`. Le type interdit d'en
 *                          ajouter une au point d'appel.
 *   pas de désynchronisation
 *                          `RG-M06-08` fait dépendre le signal de
 *                          `corps_reference_modifie_le` comparé à
 *                          `corps_operationnel_modifie_le` ; `RG-M06-09` dit
 *                          nommément que « vérifier la note ne déclenche PAS ce
 *                          signal ». Aucune des deux colonnes n'est dans le
 *                          type, donc aucune ne bouge.
 *
 * `modifie_le` NON PLUS N'EST PAS TOUCHÉE, et ce n'est pas un oubli. Le
 * vocabulaire est contractuel (`CLAUDE.md` §3) : « Vérifier » et « Modifier »
 * sont deux termes distincts, et `T-050` a refusé de rendre une note verte à
 * l'enregistrement pour ne pas les confondre. Bouger `modifie_le` en vérifiant
 * confondrait les deux dans l'autre sens — et ouvrirait un SECOND chemin vers le
 * vert, puisque `RG-M06-01` retombe sur la date de modification à défaut de
 * vérification.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UNE SEULE DEMANDE COURANTE — `RG-M06-06`, TENUE PAR LE SCHÉMA
 *
 * « Une note ne porte qu'UNE SEULE demande de révision courante. Une nouvelle
 * demande remplace la précédente. Il n'y a pas d'historique de demandes ni de
 * fil de discussion. »
 *
 * La demande est portée par QUATRE COLONNES DE LA NOTE — `revision_demandee`,
 * `revision_commentaire`, `revision_par_id`, `revision_le`
 * (`002_socle.montee.sql:358-361`) —, jamais par une table. Une seconde demande
 * est donc un `UPDATE` qui écrase : l'unicité n'est pas contrôlée, elle est
 * INÉCRIVABLE AUTREMENT. Et « pas d'historique » est vrai pour la même raison :
 * il n'existe aucune table où en conserver un.
 *
 * `RG-M06-07` — « vérifier une note efface sa demande de révision et son
 * commentaire » — est tenue par COMPOSITION, non par recopie : les colonnes
 * d'une vérification sont la date de vérification ÉTENDUE DE `LEVEE_DE_LA_DEMANDE`,
 * l'objet même qu'emploie la levée. Les deux gestes ne peuvent pas diverger.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE COMPOSE, ET CE QU'IL NE REDÉFINIT PAS
 *
 *   `./note.ts`                    la RÉSOLUTION d'une note — périmètre dans la
 *                                  requête (`ADR-006`), sortie unique par
 *                                  `INTROUVABLE` (`RG-ACC-04`, `ADR-007`).
 *   `../droits/resolution.ts`      `capacites()` seule. Rien n'est recopié.
 *
 * `P-09` dit que l'action interdite n'est pas RENDUE ; cela ne dispense pas de
 * la REFUSER. Les trois gestes résolvent le droit AVANT d'écrire, sur le
 * serveur, et le refus est le même objet que celui d'une note inexistante — un
 * client compose la requête qu'il veut.
 */
import { eq } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { notes, verifications } from '../base/schema';
import { INTROUVABLE, type Identite, type Resolution } from '../droits/resolution';
import { lireLaNote } from './note';
import type { ContexteDeLecture } from './lecture';

/* ═══════════════════════════════════ Ce qu'une écriture porte ═══════════ */

/**
 * L'EFFACEMENT D'UNE DEMANDE DE RÉVISION — les quatre colonnes remises à leur
 * état neutre.
 *
 * L'état neutre n'est pas un choix : `notes_revision_coherente`
 * (`002_socle.montee.sql:382-388`) n'admet que deux configurations — tout nul
 * quand la demande est absente, demandeur et date présents quand elle est là.
 * Les quatre valeurs ci-dessous sont la première, et la base refuserait toute
 * autre combinaison.
 *
 * CET OBJET EST EMPLOYÉ DEUX FOIS, et c'est ce qui rend `RG-M06-07` structurelle :
 * la levée l'écrit seul, la vérification l'écrit avec sa date. Aucun des deux
 * gestes ne peut effacer « un peu moins » que l'autre.
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
 * LES COLONNES QU'UNE VÉRIFICATION ÉCRIT SUR `notes`, ET RIEN D'AUTRE.
 *
 * Le type est la garantie de `RG-M06-05` : il ne déclare ni corps, ni titre, ni
 * `modifieLe`, ni `corpsReferenceModifieLe`, ni `corpsOperationnelModifieLe`.
 * Un point d'appel qui voudrait en écrire une n'a pas de champ où la poser.
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
 * LE PLAN D'ÉCRITURE D'UNE VÉRIFICATION — deux écritures, et le type n'en
 * autorise pas une troisième.
 *
 * C'est ici que « vérifier ne crée pas de version » devient VÉRIFIABLE plutôt
 * que déclaré : le plan est une donnée, il s'inspecte sans base, et son jeu de
 * clés est éprouvé par un cas SYNTHÉTIQUE (`P-26`) qui reste vrai quel que soit
 * l'état du dépôt. `verifierLaNote()` n'exécute que ce que le plan porte.
 */
export interface PlanDeVerification {
	/** Ce que l'`UPDATE` sur `notes` pose. */
	readonly colonnes: ColonnesDUneVerification;
	/** Ce que l'`INSERT` sur `verifications` pose. */
	readonly journal: LigneDeVerification;
}

/**
 * Le plan d'une vérification — fonction PURE, sans base, sans horloge.
 *
 * `maintenant` est un PARAMÈTRE : une couche d'écriture qui prendrait l'heure
 * elle-même rendrait ses effets non reproductibles, et le module de lecture
 * applique déjà cette règle (`./note.ts`, l'instant est pris par la route).
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
 * LES COLONNES D'UNE DEMANDE DE RÉVISION — l'autre configuration admise par
 * `notes_revision_coherente`.
 *
 * `revisionCommentaire` est de type `string`, non `string | null` : la colonne
 * est nullable et la contrainte de base tolère une demande sans commentaire,
 * mais `UC-M06-03` ne la tolère pas — « signale qu'une note doit être révisée,
 * EN EXPLIQUANT POURQUOI ». Le type est plus strict que le schéma, exprès.
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
 * LE COMMENTAIRE TEL QU'IL ENTRE EN BASE — ou `null`, et le geste est refusé.
 *
 * `UC-M06-03` exige l'explication ; un champ vide, blanc, ou absent n'en est pas
 * une. Le texte est ébarbé parce qu'il est AFFICHÉ EN TÊTE DE LA NOTE
 * (`V-14:1425`, `bandeau__note`) et que le gel n'y montre aucun blanc de bord.
 *
 * CE QUE LA SOURCE NE DIT PAS, ET QUI N'EST DONC PAS ÉCRIT ICI : aucune longueur
 * maximale. Ni `UC-M06-03`, ni `RG-M06-06`, ni le gel — dont le `textarea`
 * (`V-14:1484`) ne porte pas de `maxlength` — n'en fixent une. La poser serait
 * combler ; l'écart est déclaré au rapport du lot. La colonne est un `text`,
 * sans borne.
 */
export function commentaireDeRevision(saisi: unknown): string | null {
	if (typeof saisi !== 'string') return null;
	const net = saisi.trim();
	return net.length === 0 ? null : net;
}

/* ═══════════════════════════════════ La résolution du geste ═════════════ */

/** Ce qu'un geste d'attestation demande : l'adresse, qui demande, et quand. */
export interface DemandeDeGeste {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
}

/** La note résolue pour écriture : son identifiant technique, et rien de plus. */
interface NoteAAttester {
	readonly noteId: string;
	/** L'état de la demande courante AVANT le geste — `RG-M06-06`, `RG-M06-07`. */
	readonly demandeCourante: boolean;
}

/**
 * LES DEUX CONDITIONS, UNE SEULE SORTIE — et ce sont exactement celles de
 * `resoudreLEditionDUneNote()` : la note doit être LISIBLE, et l'appelant doit
 * avoir la capacité d'écrire sur son dossier porteur.
 *
 * Elle n'appelle pourtant pas cette fonction-là, et c'est délibéré : celle-ci
 * charge le corps, l'analyse, en dresse la liste des marques hors de portée de
 * l'éditeur et lit les trois référentiels de saisie. Vérifier n'est pas
 * modifier (`RG-M06-05`) — emprunter la résolution de l'ÉDITION pour attester
 * ferait dépendre l'attestation du fait que la note s'ouvre dans l'éditeur, ce
 * qu'aucune source ne demande. Les deux conditions sont donc composées ici à
 * partir des mêmes fonctions : `lireLaNote()` et `capacites().ecrireDesNotes`,
 * qui n'est pas recalculée mais LUE sur la lecture résolue.
 *
 * `docs/routes.md:140` donne à cette adresse le niveau « connecté + lecteur » et
 * §5.5 range la famille `/notes/…` dans le régime INDISCERNABLE : le refus est
 * `INTROUVABLE`, jamais un état « sans droit ».
 */
async function resoudreLeGeste(
	base: Base,
	demande: DemandeDeGeste
): Promise<Resolution<NoteAAttester>> {
	/* Le geste n'existe pas pour l'anonyme — `RG-M17-02`, « aucune action
	   d'écriture n'est proposée en anonyme : ni Modifier, ni VÉRIFIER, ni
	   SIGNALER ». Le contrôle est redondant avec `ecrireDesNotes`, qui est faux
	   pour l'anonyme par `RG-DRO-04` ; il est écrit parce que la ligne de journal
	   exige un `compteId`, et parce qu'un refus tacite par le typage serait un
	   refus qu'on espère. */
	if (demande.identite.type !== 'authentifie') return INTROUVABLE;

	const lisible = await lireLaNote(base, {
		identifiant: demande.identifiant,
		registre: 'reference',
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!lisible.trouve) return INTROUVABLE;
	if (!lisible.ressource.capacites.ecrireDesNotes) return INTROUVABLE;

	/* `lireLaNote()` rend la note dans la forme du jeu de semence, qui ne porte
	   ni l'identifiant technique ni la demande courante : les deux sont relus
	   ici, APRÈS la décision d'accès, et jamais avant. */
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

/* ═══════════════════════════════════ Vérifier — `UC-M06-02` ═════════════ */

/** Ce qu'une vérification rend quand elle a écrit. */
export interface VerificationFaite {
	readonly identifiant: string;
	/** La date attestée — celle dont le niveau se déduira à la lecture. */
	readonly verifieLe: Date;
	/** Une demande de révision courante a été effacée — `RG-M06-07`. */
	readonly demandeEffacee: boolean;
}

/**
 * VÉRIFIER UNE NOTE — un clic, aucun champ.
 *
 * DEUX ÉCRITURES, UNE SEULE TRANSACTION. Une note dont la date bougerait sans sa
 * ligne d'historique serait un historique amputé sans témoin, et `UC-M06-02`
 * demande que « l'historique complet des vérifications soit conservé et
 * consultable ». Même raisonnement que `enregistrerLeCorps()` pour sa version.
 *
 * `notes.verifie_le` EST UNE DÉNORMALISATION, et la migration le dit :
 * « `notes.verifie_le` est la dernière ligne de cette table, dénormalisée pour
 * que `RG-M06-01` se lise sans jointure » (`002_socle.montee.sql:449-451`). Les
 * deux écritures portent donc LE MÊME INSTANT, celui du plan, et non deux appels
 * d'horloge qui pourraient différer d'une milliseconde.
 */
export async function verifierLaNote(
	base: Base,
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

	return {
		trouve: true,
		ressource: {
			identifiant: demande.identifiant,
			verifieLe: plan.colonnes.verifieLe,
			demandeEffacee: acces.ressource.demandeCourante
		}
	};
}

/* ═══════════════════════════════════ Signaler — `UC-M06-03` ═════════════ */

/** Ce qu'une demande de révision rend quand elle a écrit. */
export interface DemandeDeRevisionFaite {
	readonly identifiant: string;
	readonly commentaire: string;
	readonly le: Date;
	/** La demande a REMPLACÉ une demande courante — `RG-M06-06`. */
	readonly aRemplace: boolean;
}

/** Ce qu'un signalement demande, en plus du geste : son explication. */
export interface DemandeDeSignalement extends DemandeDeGeste {
	/** Le commentaire, DÉJÀ ébarbé par `commentaireDeRevision()`. */
	readonly commentaire: string;
}

/**
 * SIGNALER UNE NOTE À RÉVISER — et le commentaire n'est pas facultatif.
 *
 * UNE SEULE ÉCRITURE, ET C'EST TOUT `RG-M06-06`. La demande courante vit dans
 * quatre colonnes de la note : un second signalement ÉCRASE le premier, sans
 * qu'aucune ligne de code n'ait à s'en occuper. Il n'y a pas de contrôle
 * d'unicité à écrire parce qu'il n'y a pas de seconde ligne possible à écrire.
 *
 * `verifie_le` N'EST PAS TOUCHÉE : signaler n'atteste rien. Le type le dit —
 * `ColonnesDUneDemandeDeRevision` ne porte pas de date de vérification.
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

/* ═══════════════════════════════════ Lever — `M06.3`, dernière puce ═════ */

/** Ce qu'une levée rend. */
export interface LeveeFaite {
	readonly identifiant: string;
	/** Une demande courante existait, et elle a été levée. */
	readonly avaitUneDemande: boolean;
}

/**
 * LEVER LA DEMANDE DE RÉVISION — « une action permet de lever la demande »
 * (`M06.3`), rendue par le gel en `V-14:1427`.
 *
 * ELLE N'ATTESTE RIEN, et c'est toute la différence avec `verifierLaNote()` :
 * elle écrit `LEVEE_DE_LA_DEMANDE` SEUL, sans date de vérification et sans ligne
 * d'historique. Lever, c'est dire « cette demande n'a plus lieu d'être » ;
 * vérifier, c'est dire « cette note est d'actualité ». Confondre les deux
 * remettrait au vert une note dont personne n'a attesté le contenu.
 *
 * L'écriture est INCONDITIONNELLE — elle n'est pas gardée par
 * `demandeCourante` : lever une demande absente laisse les quatre colonnes dans
 * l'état où elles sont déjà. Une garde ferait dépendre l'effet d'une lecture
 * antérieure à l'écriture, donc d'une course ; `avaitUneDemande` RAPPORTE ce
 * qui a été lu, il ne commande rien.
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
