/**
 * L'ÉDITION D'UNE NOTE, DEPUIS LA BASE — ce que les quatre dernières routes du
 * produit chargent, et ce que l'enregistrement écrit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE MODULE COMPOSE, IL NE REDÉFINIT RIEN
 *
 *   `src/lib/donnees/note.ts`      la RÉSOLUTION d'une note, donc la décision
 *                                  d'accès. Aucune règle de droit n'est écrite
 *                                  ici : le filtre de périmètre est dans la
 *                                  requête (`ADR-006`) et la sortie unique par
 *                                  `INTROUVABLE` (`RG-ACC-04`) est la sienne.
 *   `src/lib/droits/resolution.ts` `capacites()` seule, jamais une table de
 *                                  droits recopiée. « Écrire des notes » est
 *                                  une colonne de CDC §2.3, pas un rôle.
 *   `src/lib/edition/*`            le schéma de l'éditeur, ses deux portes, et
 *                                  la composition d'une version.
 *   `src/lib/contenu/document.ts`  `analyserDocument`, porte UNIQUE du format.
 *                                  Aucune écriture de ce module ne l'évite —
 *                                  `ADR-003` interdit « toute écriture directe
 *                                  en base d'un document non validé ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DROIT D'ÉCRIRE EST LA MÊME DÉCISION QUE LE DROIT DE LIRE, PROLONGÉE
 *
 * `docs/routes.md:143-145` donne aux trois routes d'éditeur le niveau
 * « connecté + rédacteur », et §5.5 range la famille `/notes/…` dans le régime
 * INDISCERNABLE : un lecteur reçoit ce que reçoit une adresse qui ne désigne
 * rien. Le refus passe donc par `INTROUVABLE`, jamais par un état « sans
 * droit » — celui-ci vaut pour une ZONE d'une page qu'on a le droit d'ouvrir
 * (`ARB-005`), et ce n'est pas le cas ici.
 *
 * `P-09` dit que l'action interdite n'est pas RENDUE. Cela ne dispense pas de
 * la REFUSER : les actions de ce module vérifient le droit AVANT d'écrire, sur
 * le serveur, parce qu'un client compose la requête qu'il veut.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX LECTURES POUR L'ÉDITEUR DE L'OPÉRATIONNEL, ET C'EST UN COÛT ASSUMÉ
 *
 * V-18 montre les DEUX registres — la Référence en panneau de rappel,
 * l'Opérationnel en zone de rédaction —, et `lireLaNote()` rend le corps d'UN
 * registre par appel. La note est donc résolue deux fois. Ce n'est pas une
 * seconde DÉCISION — les deux appels empruntent le même chemin, le même filtre
 * et la même sortie —, c'est une seconde REQUÊTE. Un paramètre de registre
 * multiple sur `lireLaNote` la supprimerait ; il n'est pas ajouté ici parce
 * qu'il toucherait la signature d'un module que trois routes emploient déjà.
 * Coût déclaré au rapport de lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * L'ENREGISTREMENT ENTRETIENT L'INDEX, ET LE CLIENT DU MOTEUR EST OBLIGATOIRE
 *
 * `RG-M05-06` (`CAHIER-DES-CHARGES-FONCTIONNEL.md:731`) : « une note enregistrée
 * est trouvable en recherche dans un délai maximal de 10 secondes ». Le geste est
 * `entretenirLIndex()` (`../recherche/entretien.ts`), appelé APRÈS la validation
 * de la transaction.
 *
 * Le client est un PARAMÈTRE, non un champ facultatif de la demande, et la
 * différence est fonctionnelle : un appelant ne peut pas l'oublier, faute de
 * pouvoir composer un appel sans lui. C'est la même forme que
 * `chercherLesNotes()`, dont l'en-tête l'explique — « c'est la forme qui tient la
 * propriété, pas la relecture ».
 */
import { and, desc, eq, max } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { comptes, notes, piecesJointes, versions } from '../base/schema';
import { analyserDocument, type Document } from '../contenu/document';
import {
	cequeLEditeurNeSaitPasPorter,
	documentDepuisNoeud,
	noeudDepuisDocument
} from '../edition/document';
import {
	versionDUnEnregistrement,
	type CorpsDeLaNote,
	type EtatEnBase,
	type VersionAEcrire
} from '../edition/enregistrement';
import {
	capacites,
	INTROUVABLE,
	noteLisible,
	resoudre,
	resoudreDroitDeDossier,
	type Identite,
	type Perimetre,
	type Resolution
} from '../droits/resolution';
import { entretenirLIndex } from '../recherche/entretien';
import { peutEcrireQuelquePart } from './public';
import {
	lireIndexDesDroits,
	lireLaNote,
	lireLeCorpusLisible,
	perimetreDeLaLectureDUneNote,
	type LectureDeNote,
	type Registre
} from './note';
import {
	lireTemplates,
	lireTypesDeFiche,
	lireTypesDeNote,
	type ContexteDeLecture
} from './lecture';
import type { ChampDeFiche, Note, Template, TypeDeFiche, TypeDeNote } from '../../../seeds/corpus';
import type { NoteAffichee } from '../lecture/note-de-demonstration';

/* ═══════════════════════════════════ Les référentiels de saisie ═════════ */

/**
 * Les trois référentiels que l'éditeur propose — types de note, types de fiche,
 * gabarits. Ils sont administrables (M14), donc propres à l'instance : ils sont
 * LUS, jamais repris du jeu de semence.
 */
export interface ReferentielsDeSaisie {
	readonly typesNote: readonly TypeDeNote[];
	readonly typesFiche: Record<TypeDeFiche, readonly ChampDeFiche[]>;
	readonly templates: readonly Template[];
}

export async function lireLesReferentiels(base: Base): Promise<ReferentielsDeSaisie> {
	const [typesNote, typesFiche, templates] = await Promise.all([
		lireTypesDeNote(base),
		lireTypesDeFiche(base),
		lireTemplates(base)
	]);
	return {
		typesNote,
		typesFiche: typesFiche as Record<TypeDeFiche, readonly ChampDeFiche[]>,
		templates
	};
}

/* ═══════════════════════════════════ La création — `/notes/nouvelle` ════ */

/** Ce que la création d'une note met à disposition de la route. */
export interface CreationDeNote {
	/** Le corpus lisible par l'appelant — la coquille en dérive son rail. */
	readonly notes: readonly Note[];
	readonly referentiels: ReferentielsDeSaisie;
}

/**
 * `/notes/nouvelle` — LA RÉSOLUTION DE LA CRÉATION.
 *
 * `nouvelle` est un identifiant RÉSERVÉ sous `/notes/` (`docs/routes.md` §5.4,
 * `:348`) : « sans cette réservation, une note intitulée "Nouvelle" produirait
 * `/notes/nouvelle` et masquerait l'éditeur de création ». L'adresse ne désigne
 * donc aucune ressource du corpus, et sa réponse ne dépend d'aucun
 * identifiant : elle dépend d'une CAPACITÉ.
 *
 * La capacité est « écrire des notes QUELQUE PART » — `peutEcrireQuelquePart()`,
 * l'implémentation unique, celle que la page non résolue emploie déjà. L'écran
 * n'est rattaché à aucun domaine tant que rien n'est choisi : exiger le droit
 * sur un domaine particulier serait exiger davantage que `docs/routes.md:143`,
 * qui dit « connecté + rédacteur » sans autre condition.
 *
 * Le refus est `INTROUVABLE`, comme partout dans la famille `/notes/…` : §5.5
 * ne connaît pas d'autre forme pour elle.
 */
export async function resoudreLaCreationDeNote(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<Resolution<CreationDeNote>> {
	const index = await lireIndexDesDroits(base, identite);
	if (!peutEcrireQuelquePart(identite, index)) return INTROUVABLE;

	/* Le corpus lisible vient de la RÉSOLUTION d'une lecture, jamais d'une
	   seconde requête filtrée à la main : `lireNotes()` ne porte pas de
	   périmètre, et l'intersection se fait dans `note.ts`, à un seul endroit. */
	const [corpus, referentiels] = await Promise.all([
		lireLeCorpusLisible(base, identite, contexte),
		lireLesReferentiels(base)
	]);
	return { trouve: true, ressource: { notes: corpus, referentiels } };
}

/* ═══════════════════════════════════ L'édition d'une note existante ═════ */

/** Ce que l'édition d'une note met à disposition des routes V-17 et V-18. */
export interface EditionDeNote {
	/** La lecture résolue — note, corps rendu, capacités, corpus lisible. */
	readonly lecture: LectureDeNote;
	/** Le document canonique du registre édité, tel que la base le porte. */
	readonly document: Document | null;
	/**
	 * Ce que l'éditeur ne sait pas porter dans ce document. Vide : il s'ouvre.
	 * Non vide : la note est éditable en droit et pas en fait, et la route le
	 * DIT plutôt que d'ouvrir un éditeur qui amputerait le contenu.
	 */
	readonly horsDePorteeDeLEditeur: readonly string[];
	readonly referentiels: ReferentielsDeSaisie;
}

/** Ce qu'une édition demande : l'adresse, le registre, et qui demande. */
export interface DemandeDEdition {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

/**
 * LA RÉSOLUTION D'UNE ÉDITION — une ressource, ou rien.
 *
 * Deux conditions, une seule sortie. La note doit être lisible — c'est
 * `lireLaNote()`, filtre dans la requête — ET l'appelant doit avoir la capacité
 * d'écrire des notes sur le dossier porteur — c'est `capacites().ecrireDesNotes`,
 * que `lireLaNote()` a déjà calculée et qu'aucune ligne d'ici ne recalcule. Le
 * refus est le MÊME objet dans les deux cas, par le même `resoudre()`.
 */
export async function resoudreLEditionDUneNote(
	base: Base,
	demande: DemandeDEdition
): Promise<Resolution<EditionDeNote>> {
	const lisible = await lireLaNote(base, {
		identifiant: demande.identifiant,
		registre: demande.registre,
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!lisible.trouve) return INTROUVABLE;
	const lecture = lisible.ressource;
	if (!lecture.capacites.ecrireDesNotes) return INTROUVABLE;

	const brut = await base
		.select({
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel
		})
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	const colonne =
		demande.registre === 'operationnel' ? brut[0]?.corpsOperationnel : brut[0]?.corpsReference;

	const document = colonne === null || colonne === undefined ? null : analyserDocument(colonne);

	return {
		trouve: true,
		ressource: {
			lecture,
			document,
			horsDePorteeDeLEditeur: document === null ? [] : cequeLEditeurNeSaitPasPorter(document),
			referentiels: await lireLesReferentiels(base)
		}
	};
}

/**
 * LES DEUX REGISTRES RENDUS — ce que `src/vues/V-18.svelte` reçoit en
 * propriété `affichee`. Voir l'en-tête : deux lectures, une seule décision.
 */
export async function resoudreLEditionDeLOperationnel(
	base: Base,
	demande: Omit<DemandeDEdition, 'registre'>
): Promise<Resolution<{ edition: EditionDeNote; affichee: NoteAffichee }>> {
	const operationnel = await resoudreLEditionDUneNote(base, {
		...demande,
		registre: 'operationnel'
	});
	if (!operationnel.trouve) return INTROUVABLE;

	const reference = await lireLaNote(base, {
		identifiant: demande.identifiant,
		registre: 'reference',
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!reference.trouve) return INTROUVABLE;

	const edition = operationnel.ressource;
	return {
		trouve: true,
		ressource: {
			edition,
			affichee: {
				note: edition.lecture.note,
				reference: reference.ressource.corps.existe ? reference.ressource.corps.html : null,
				operationnel: edition.lecture.corps.existe ? edition.lecture.corps.html : null
			}
		}
	};
}

/* ═══════════════════════════════════ L'enregistrement ═══════════════════ */

/** Ce qu'un enregistrement de corps demande. */
export interface DemandeDEnregistrementDeNote {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	/** Le corps saisi, tel qu'il sort de l'éditeur — non encore validé. */
	readonly corpsSaisi: unknown;
	readonly maintenant: Date;
}

/** Ce qu'un enregistrement rend quand il a écrit. */
export interface EnregistrementFait {
	readonly identifiant: string;
	/** La version écrite, ou `null` — RG-M07-01, contenu inchangé. */
	readonly version: VersionAEcrire | null;
}

/**
 * L'ENREGISTREMENT D'UN CORPS — et la version que `RG-M07-02` exige.
 *
 * TROIS PORTES SUCCESSIVES, ET AUCUNE N'EST FACULTATIVE :
 *
 *  1. la RÉSOLUTION — `resoudreLEditionDUneNote()`, la même que le chargeur.
 *     Un appelant sans droit reçoit `INTROUVABLE`, avant toute lecture du
 *     corps saisi : rien de ce qu'il envoie n'est même analysé.
 *  2. le FORMAT — le corps saisi passe par `noeudDepuisDocument()`, qui appelle
 *     `analyserDocument` puis contrôle que l'éditeur SAIT le porter. Un
 *     document mal formé est refusé, jamais réparé (`ADR-003`).
 *  3. l'ALLER-RETOUR — le document réécrit est celui que ProseMirror rend
 *     (`documentDepuisNoeud`), non celui qu'on a reçu. C'est ce qui garantit
 *     que ce qui entre en base est exactement ce que l'éditeur produira à la
 *     relecture : deux écritures d'un même document ne peuvent pas cohabiter
 *     (règle 1 du format).
 *
 * LES DEUX ÉCRITURES SONT DANS UNE SEULE TRANSACTION. Une note enregistrée sans
 * sa version serait un historique amputé sans témoin, et `RG-M07-02` demande
 * une capture « à chaque enregistrement qui modifie le corps ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE FONCTION CASSAIT EN AVAL — RÉPARÉ, ET CE QUI RESTE
 *
 * Cette section décrivait, mesure à l'appui, un défaut RÉEL et fermé depuis :
 * `extraitDuCorps()` n'admettait qu'un document d'un seul paragraphe — la forme
 * que `corpsDepuisTexte()` produit — et LEVAIT sur tout corps rédigé, rendant
 * `lireNotes()` inutilisable, donc toute route qui lit le corpus. Un corps
 * rédigé étant précisément le premier que cet éditeur produit, la fonction
 * ci-dessous cassait la lecture du corpus à son premier usage.
 *
 * Il est fermé : `extraitDuCorps()` est aujourd'hui `texteBrut(analyserDocument(
 * corps))` (`./lecture.ts`), et traite tous les types de bloc. `ADR-003` le
 * fonde — le texte brut est produit « à l'enregistrement » et « sert aux
 * extraits ». La validation n'a pas été desserrée, elle a été DÉPLACÉE sur
 * `analyserDocument`, qui refuse toujours un document mal formé. Le poste 4 de
 * la batterie 13 écrit 45 corps réels et les projette sans lever.
 *
 * CE QUI RESTE, ET QUI N'EST PAS RÉPARABLE ICI SANS COMBLER. La dérivation d'un
 * extrait est spécifiée à moitié : aucune source ne dit la LONGUEUR d'un
 * extrait, ni s'il commence au premier paragraphe ou au premier texte, ni ce
 * qu'il fait des titres, des alertes et des tableaux. Le corpus, lui, porte
 * trente-deux extraits RÉDIGÉS À LA MAIN (`seeds/corpus.ts`), qui ne sont la
 * troncature d'aucun corps. C'est un vide de spécification, déclaré et non
 * comblé.
 *
 * ET LA LEÇON DE MÉTHODE TIENT, ELLE : aucune batterie ne l'avait vu, parce
 * qu'aucune n'enregistrait. La sonde, si.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * PUIS L'INDEX, ET DANS CET ORDRE
 *
 * L'entretien de l'index vient APRÈS la transaction, jamais dedans :
 * `retirerDesNotes()` (`../recherche/moteur.ts`) le prescrit en majuscules, et sa
 * raison vaut aussi pour l'écriture — « une transaction annulée ne peut pas
 * laisser un index amputé ». Le corps réécrit change l'EXTRAIT projeté, qui est
 * un champ cherchable, et `modifieLe`, qui est un champ triable.
 *
 * @throws DocumentInvalide, EditeurIncapable — le corps saisi est refusé
 * @throws l'erreur de la tâche du moteur si l'index n'a pas pu être entretenu.
 *   La note est alors ÉCRITE et non indexée, et l'appelant reçoit l'échec plutôt
 *   qu'un silence. Ce que l'écran en fait n'est spécifié nulle part : aucune
 *   source ne décrit l'état d'un enregistrement dont l'index a refusé, et aucune
 *   maquette ne le porte. Écart déclaré au rapport du lot, non comblé ici.
 */
export async function enregistrerLeCorps(
	base: Base,
	client: Meilisearch,
	demande: DemandeDEnregistrementDeNote
): Promise<Resolution<EnregistrementFait>> {
	const acces = await resoudreLEditionDUneNote(base, {
		identifiant: demande.identifiant,
		registre: demande.registre,
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!acces.trouve) return INTROUVABLE;
	if (demande.identite.type !== 'authentifie') {
		return INTROUVABLE;
	}

	/* Le document REÉCRIT par ProseMirror, jamais celui reçu — porte 3. */
	const document = documentDepuisNoeud(noeudDepuisDocument(demande.corpsSaisi));

	const [ligne] = await base
		.select({
			id: notes.id,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel
		})
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	if (ligne === undefined) return INTROUVABLE;

	const avant: EtatEnBase = {
		titre: ligne.titre,
		reference: ligne.corpsReference,
		operationnel: ligne.corpsOperationnel
	};
	const apres: CorpsDeLaNote =
		demande.registre === 'operationnel'
			? {
					reference: analyserDocument(ligne.corpsReference),
					operationnel: document
				}
			: {
					reference: document,
					operationnel:
						ligne.corpsOperationnel === null ? null : analyserDocument(ligne.corpsOperationnel)
				};

	const [dernier] = await base
		.select({ numero: max(versions.numero) })
		.from(versions)
		.where(eq(versions.noteId, ligne.id));

	const version = versionDUnEnregistrement({
		dernierNumero: dernier?.numero ?? 0,
		auteurId: demande.identite.compteId,
		maintenant: demande.maintenant,
		titre: ligne.titre,
		corps: apres,
		avant
	});

	await base.transaction(async (tx) => {
		if (demande.registre === 'operationnel') {
			await tx
				.update(notes)
				.set({
					corpsOperationnel: apres.operationnel,
					corpsOperationnelModifieLe: demande.maintenant,
					modifieLe: demande.maintenant
				})
				.where(eq(notes.id, ligne.id));
		} else {
			await tx
				.update(notes)
				.set({
					corpsReference: apres.reference,
					corpsReferenceModifieLe: demande.maintenant,
					modifieLe: demande.maintenant
				})
				.where(eq(notes.id, ligne.id));
		}
		if (version !== null) {
			await tx.insert(versions).values({
				noteId: ligne.id,
				numero: version.numero,
				le: version.le,
				auteurId: version.auteurId,
				resume: version.resume,
				ajout: version.ajout,
				retrait: version.retrait,
				titre: version.titre,
				corpsReference: version.corpsReference,
				corpsOperationnel: version.corpsOperationnel
			});
		}
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre. `RG-M05-06` : la note est
	   trouvable quand cet appel rend, l'attente étant explicite et non temporisée. */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return { trouve: true, ressource: { identifiant: demande.identifiant, version } };
}

/* ═══════════════════════════════════ Les pièces jointes ═════════════════ */

/** Une pièce jointe résolue — ce que la base porte d'elle. */
export interface PieceJointeResolue {
	readonly nom: string;
	readonly tailleOctets: number;
	readonly typeMedia: string;
	/** L'identifiant de la note porteuse — celle dont la visibilité décide. */
	readonly note: string;
	/**
	 * LES DEUX CLÉS DONT LE CHEMIN DE L'ENTREPÔT EST LA FONCTION — `T-026`.
	 *
	 * `src/lib/fichiers/entrepot.ts` ne stocke aucun chemin : il le DÉRIVE de
	 * `<note_id>/<piece_id>`. Les deux clés sortent donc d'ici, et d'ici
	 * seulement — c'est-à-dire APRÈS la résolution de visibilité. Le chemin des
	 * octets n'est pas formable sans avoir traversé `noteLisible()`, ce qui rend
	 * `RG-M04-08` structurel plutôt que déclaratif.
	 */
	readonly id: string;
	readonly noteId: string;
}

/** Ce qu'une demande de pièce jointe porte. */
export interface DemandeDePieceJointe {
	readonly identifiant: string;
	readonly fichier: string;
	readonly identite: Identite;
}

/**
 * `RG-M04-08` — « une pièce jointe d'une note interne n'est jamais servie en
 * anonyme ». `docs/routes.md:146` le précise : « le contrôle porte sur la NOTE,
 * pas sur le fichier ».
 *
 * C'est pourquoi cette adresse est une ROUTE et jamais un fichier statique : un
 * fichier servi par le frontal ne rejouerait aucun droit, et une pièce déplacée
 * d'une note interne à une note publique — ou l'inverse — changerait de
 * visibilité sans que rien ne le sache. La visibilité est donc REVÉRIFIÉE à
 * chaque requête, par la même composition que la lecture d'une note :
 * périmètre injecté dans la requête (`ADR-006`), puis `noteLisible()` en
 * garde-fou, puis sortie unique par `INTROUVABLE` (`RG-ACC-04`).
 *
 * CE QUE LA BASE PORTE, ET CE QU'ELLE NE PORTE PAS. Mesuré le 20 août 2026 :
 * `pieces_jointes` compte ZÉRO ligne, et `pnpm verif:donnees` le dit autrement
 * — « 7 notes sur 32 en déclarent, 13 pièces déclarées, 2 nommées au gel dont
 * 0 chiffrables en octets, 0 portées en base ». Le corpus ne porte que des
 * COMPTES. Aucune pièce n'est donc fabriquée ici, et la branche « résolue » de
 * cette fonction n'est exercée par AUCUN état du dépôt : elle l'est par un cas
 * SYNTHÉTIQUE en unitaire (`P-5`, `P-26`).
 *
 * ET LE CONTENU EXISTE DÉSORMAIS, HORS DE LA BASE — `T-026`. La table porte
 * toujours le nom, la taille et le type de média, et toujours ni octets ni
 * chemin : les octets vivent dans l'entrepôt (`src/lib/fichiers/entrepot.ts`,
 * `RACINE_FICHIERS`, `compose.yaml:136`), et leur chemin est DÉRIVÉ des deux
 * clés que cette résolution rapporte. Une pièce résolue est donc servie ; une
 * pièce non résolue ne l'est pas, et les deux sorties sont indiscernables.
 * L'ordre reste celui d'`ADR-007` : la visibilité d'abord, l'entrepôt ensuite.
 */

/** La ligne que la requête rapporte : la pièce, jointe à sa note porteuse. */
export interface LigneDePieceJointe {
	readonly id: string;
	readonly noteId: string;
	readonly nom: string;
	readonly tailleOctets: number;
	readonly typeMedia: string;
	readonly identifiant: string;
	readonly dossierId: string;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
}

/**
 * LA DÉCISION, EXTRAITE DE LA REQUÊTE — et elle est extraite pour une raison
 * nommée par `P-5` et `P-26` : la branche « résolue » n'est exercée par AUCUN
 * état du dépôt, la table étant vide. Un contrôle dont le seul cas d'épreuve
 * est l'état du dépôt est un contrôle qu'on espère.
 *
 * Cette fonction est PURE, donc éprouvable sur une pièce SYNTHÉTIQUE, sans
 * base — et l'épreuve joue les deux polarités : la note porteuse lisible, et la
 * même pièce sur une note qui ne l'est pas. `noteLisible()` est la composition
 * des deux filtres (visibilité de la NOTE, périmètre du DOSSIER) : les employer
 * séparément est, dit son en-tête, « le moyen le plus simple de publier le
 * corpus interne ».
 */
export function pieceJointeResolue(
	identite: Identite,
	ligne: LigneDePieceJointe | undefined,
	perimetre: Perimetre
): Resolution<PieceJointeResolue> {
	const resolution = resoudre(ligne, (l) =>
		noteLisible(
			identite,
			{ dossierId: l.dossierId, visibilite: l.visibilite, statut: l.statut },
			perimetre
		)
	);
	if (!resolution.trouve) return INTROUVABLE;
	const trouvee = resolution.ressource;
	return {
		trouve: true,
		ressource: {
			nom: trouvee.nom,
			tailleOctets: trouvee.tailleOctets,
			typeMedia: trouvee.typeMedia,
			note: trouvee.identifiant,
			id: trouvee.id,
			noteId: trouvee.noteId
		}
	};
}

export async function resoudreUnePieceJointe(
	base: Base,
	demande: DemandeDePieceJointe
): Promise<Resolution<PieceJointeResolue>> {
	const index = await lireIndexDesDroits(base, demande.identite);
	const perimetre = perimetreDeLaLectureDUneNote(demande.identite, index);

	const [ligne] = await base
		.select({
			id: piecesJointes.id,
			noteId: piecesJointes.noteId,
			nom: piecesJointes.nom,
			tailleOctets: piecesJointes.tailleOctets,
			typeMedia: piecesJointes.typeMedia,
			identifiant: notes.identifiant,
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(piecesJointes)
		.innerJoin(notes, eq(piecesJointes.noteId, notes.id))
		.where(and(eq(notes.identifiant, demande.identifiant), eq(piecesJointes.nom, demande.fichier)))
		.orderBy(desc(piecesJointes.deposeeLe))
		.limit(1);

	return pieceJointeResolue(demande.identite, ligne, perimetre);
}

/* ═══════════════════════════════════ L'auteur d'une écriture ════════════ */

/**
 * Le compte qui écrit, tel que la table le porte. Sert à l'écriture d'une
 * version : `versions.auteur_id` référence `comptes`, et la référence est
 * `RESTRICT` — « effacer un compte ne doit pas effacer la trace de qui a
 * écrit », `004_versions.montee.sql:63`.
 */
export async function compteExiste(base: Base, compteId: string): Promise<boolean> {
	const [ligne] = await base
		.select({ id: comptes.id })
		.from(comptes)
		.where(eq(comptes.id, compteId))
		.limit(1);
	return ligne !== undefined;
}

/**
 * LA CAPACITÉ D'ÉCRIRE SUR UN DOSSIER — une seule ligne, et elle n'écrit aucune
 * règle : `resoudreDroitDeDossier()` remonte l'arbre, `capacites()` répond par
 * la table de CDC §2.3.
 */
export async function peutEcrireSurLeDossier(
	base: Base,
	identite: Identite,
	dossierId: string
): Promise<boolean> {
	const index = await lireIndexDesDroits(base, identite);
	return capacites(resoudreDroitDeDossier(identite, dossierId, index)).ecrireDesNotes;
}
