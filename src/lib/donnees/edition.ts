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
 * de la transaction. Il SOUMET le document au moteur et n'attend pas sa tâche
 * (`ARB-060`) : cette route est un chemin de requête, et le cahier lui donne un
 * budget séparé d'1 s (`CDC:1537`).
 *
 * Le client est un PARAMÈTRE, non un champ facultatif de la demande, et la
 * différence est fonctionnelle : un appelant ne peut pas l'oublier, faute de
 * pouvoir composer un appel sans lui. C'est la même forme que
 * `chercherLesNotes()`, dont l'en-tête l'explique — « c'est la forme qui tient la
 * propriété, pas la relecture ».
 */
import { and, count, desc, eq, max } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import {
	champsDeTypeDeFiche,
	comptes,
	domaines,
	dossiers,
	etiquettes,
	etiquettesDeNote,
	notes,
	piecesJointes,
	statutDeNote as enumDeStatut,
	typesDeFiche,
	versions,
	visibilite as enumDeVisibilite
} from '../base/schema';
import { analyserDocument, type Document } from '../contenu/document';
import { analyserMarkdown, markdownDeFormulaire } from '../contenu/markdown';
import { identifiantLisible } from '../rangement/adresses';
import {
	cequeLEditeurNeSaitPasPorter,
	documentDepuisNoeud,
	noeudDepuisDocument
} from '../edition/document';
import {
	empreinteDuCorps,
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
import { resoudreLeChemin, SEPARATEUR_DE_CHEMIN, type LigneDeDossier } from './rangement';
import { proprietesSoumises, retenirLesProprietes } from './creation';
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

/* ═══════════════════════════════════ L'arborescence de choix ════════════ */

/** Un nœud de l'arborescence de choix de dossier, tel que `V-17` l'attend. */
export interface DossierDeChoix {
	readonly nom: string;
	readonly notes: number;
	readonly enfants: readonly DossierDeChoix[];
}

/**
 * L'ARBORESCENCE DE CHOIX, PAR DOMAINE — lue dans la table `dossiers`, jamais
 * déduite des chemins portés par les notes.
 *
 * Les deux éditeurs la demandent — `/notes/nouvelle` pour ranger la note qu'on
 * crée, `/notes/{identifiant}/modifier` pour la déplacer —, et ils l'appellent
 * ICI : le calcul n'existe qu'à un endroit. Sans elle, V-17 retombe sur ce
 * qu'elle sait tirer du corpus servi — et le corpus ne porte aucun dossier tant
 * qu'aucune note n'en nomme un. Deux mesures : le 21/08/2026, sur une instance
 * neuve à zéro note, l'éditeur de création n'offrait AUCUN dossier et refusait
 * en « dossier manquant » — pas de note, pas de dossier ; pas de dossier, pas de
 * note ; le 22/08/2026, la liste de l'écran de modification sortait VIDE.
 *
 * LA RACINE EST OFFERTE À CÔTÉ DE SES ENFANTS, jamais au-dessus d'eux : elle
 * est le premier choix de la liste, sous le nom du domaine, et les chemins de
 * ses enfants n'en portent pas le préfixe — ils restent ceux de `Note.dossier`.
 * Ne l'offrir QUE lorsqu'elle n'a aucun enfant laissait sans destination la note
 * rangée à la racine d'un domaine qui, lui, a des sous-dossiers : le formulaire
 * ne pouvait pas la cocher et l'enregistrement rendait 400. `Note.dossier` étant
 * VIDE pour une telle note, c'est V-17 qui fait l'équivalence « vide = nom du
 * domaine » ; `dossierDeDestination()` retire ce segment en tête à l'écriture.
 */
export async function lireLArborescenceDeChoix(
	base: Base
): Promise<Readonly<Record<string, readonly DossierDeChoix[]>>> {
	const lignes = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			nom: dossiers.nom,
			position: dossiers.position,
			domaine: domaines.nom
		})
		.from(dossiers)
		.innerJoin(domaines, eq(domaines.id, dossiers.domaineId));

	const decomptes = await base
		.select({ dossierId: notes.dossierId, combien: count() })
		.from(notes)
		.groupBy(notes.dossierId);
	const parDossier = new Map(decomptes.map((c) => [c.dossierId, Number(c.combien)]));

	const enfantsDe = new Map<string | null, typeof lignes>();
	for (const l of lignes) enfantsDe.set(l.parentId, [...(enfantsDe.get(l.parentId) ?? []), l]);

	const batir = (parentId: string | null): readonly DossierDeChoix[] =>
		[...(enfantsDe.get(parentId) ?? [])]
			.sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom, 'fr'))
			.map((l) => ({ nom: l.nom, notes: parDossier.get(l.id) ?? 0, enfants: batir(l.id) }));

	const parDomaine: Record<string, readonly DossierDeChoix[]> = {};
	for (const racine of enfantsDe.get(null) ?? []) {
		parDomaine[racine.domaine] = [
			{ nom: racine.nom, notes: parDossier.get(racine.id) ?? 0, enfants: [] },
			...batir(racine.id)
		];
	}
	return parDomaine;
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
 * L'ÉTAT DE SYNCHRONISATION DES DEUX REGISTRES — ce que `RG-M06-08` fait lire à
 * V-18, et ce que son bandeau nomme.
 *
 * L'AUTEUR EST CELUI DE L'ENREGISTREMENT QUI A CHANGÉ LA RÉFÉRENCE, retrouvé par
 * la version que cet enregistrement a écrite : les deux portent le même instant,
 * `demande.maintenant`, posé une seule fois par la route (`enregistrerLaNote()`).
 * Ce n'est donc pas un rapprochement approximatif, c'est une jointure sur la
 * valeur que la même transaction a écrite des deux côtés.
 *
 * `null` QUAND PERSONNE NE PEUT ÊTRE NOMMÉ, et jamais un nom de remplacement
 * (`P-02`). Deux cas réels : la Référence vient de la SEMENCE, qui pose les dates
 * sans écrire de version ; ou l'enregistrement n'a écrit aucune version parce que
 * le contenu n'avait pas changé — auquel cas la date n'a pas bougé non plus, et
 * l'attribution porterait sur un geste antérieur.
 */
export interface SynchronisationDesRegistres extends DatesDesDeuxRegistres {
	/** `RG-M06-08`, calculée par `operationnelDesynchronise()` et par elle seule. */
	readonly desynchronise: boolean;
	/** Le nom de qui a modifié la Référence en dernier, ou `null`. */
	readonly referenceModifieePar: string | null;
}

/**
 * LES DEUX REGISTRES RENDUS — ce que `src/vues/V-18.svelte` reçoit en
 * propriété `affichee`. Voir l'en-tête : deux lectures, une seule décision.
 */
export async function resoudreLEditionDeLOperationnel(
	base: Base,
	demande: Omit<DemandeDEdition, 'registre'>
): Promise<
	Resolution<{
		edition: EditionDeNote;
		affichee: NoteAffichee;
		synchronisation: SynchronisationDesRegistres;
	}>
> {
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

	const [dates] = await base
		.select({
			id: notes.id,
			referenceModifieLe: notes.corpsReferenceModifieLe,
			operationnelModifieLe: notes.corpsOperationnelModifieLe
		})
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	if (dates === undefined) return INTROUVABLE;

	const [auteur] = await base
		.select({ nom: comptes.nom })
		.from(versions)
		.innerJoin(comptes, eq(comptes.id, versions.auteurId))
		.where(and(eq(versions.noteId, dates.id), eq(versions.le, dates.referenceModifieLe)))
		.orderBy(desc(versions.numero))
		.limit(1);

	return {
		trouve: true,
		ressource: {
			edition,
			affichee: {
				note: edition.lecture.note,
				reference: reference.ressource.corps.existe ? reference.ressource.corps.html : null,
				operationnel: edition.lecture.corps.existe ? edition.lecture.corps.html : null
			},
			synchronisation: {
				referenceModifieLe: dates.referenceModifieLe,
				operationnelModifieLe: dates.operationnelModifieLe,
				desynchronise: operationnelDesynchronise(dates),
				referenceModifieePar: auteur?.nom ?? null
			}
		}
	};
}

/* ═══════════════════════════════════ Ce qu'une modification porte ═══════ */

/**
 * LE RANGEMENT DEMANDÉ — et pourquoi il est nommé par ce que le GEL porte.
 *
 * `V-17-editeur.html:2791` remplit le sélecteur de domaine avec `o.value = d.nom`
 * — le NOM affiché, jamais un identifiant —, et `:2818` compose le chemin du
 * dossier choisi segment par segment, `prefixe + " › " + k`, où `k` est le nom
 * du dossier. Ce sont les deux seules valeurs qu'un client bâti sur le gel peut
 * produire (`ARB-063` §3.2 : les champs cachés sont « remplis à la soumission
 * depuis les nœuds du gel »), et ce sont exactement les deux champs que
 * `Note.domaine` et `Note.dossier` portent déjà (`seeds/corpus.ts:202-203`).
 *
 * La forme soumise est donc la forme AFFICHÉE, des deux côtés. Rien n'est
 * inventé : la résolution vers les identifiants de base est faite ici, par
 * `resoudreLeChemin()`, l'implémentation unique de la descente d'arborescence.
 */
export interface RangementDemande {
	/** Le nom affiché du domaine de destination. */
	readonly domaine: string;
	/** Le chemin affiché du dossier, sous la racine du domaine. */
	readonly dossier: string;
}

/** Les deux visibilités du schéma, et jamais une seconde liste. */
export type VisibiliteDeNote = (typeof enumDeVisibilite.enumValues)[number];
/** Les deux statuts du schéma, et jamais une seconde liste. */
export type StatutDeNote = (typeof enumDeStatut.enumValues)[number];

/**
 * CE QU'UNE MODIFICATION PORTE — et l'absence y est une VALEUR.
 *
 * « Aucun champ absent n'est modifié » : chaque champ est optionnel, et son
 * absence signifie « inchangé », jamais « vide ». C'est la raison pour laquelle
 * le corps est enveloppé plutôt que porté nu — un corps vaut `unknown`, donc
 * `undefined` en est une valeur possible, et l'enveloppe est le seul moyen de
 * distinguer « corps non soumis » de « corps soumis, et il vaut cela ».
 */
export interface ModificationDeNote {
	/** Non blanc — la forme est contrôlée à la lecture du formulaire. */
	readonly titre?: string;
	readonly rangement?: RangementDemande;
	readonly visibilite?: VisibiliteDeNote;
	readonly statut?: StatutDeNote;
	/** La liste soumise REMPLACE la liste courante. Vide : plus aucune. */
	readonly etiquettes?: readonly string[];
	/** Présent : le corps est réécrit, ou retiré. Voir `CorpsSoumis`. */
	readonly corps?: CorpsSoumis;
	/** Présent : le type de fiche est posé, changé, ou retiré. Voir `FicheSoumise`. */
	readonly fiche?: FicheSoumise;
}

/**
 * CE QU'UNE MODIFICATION FAIT DU TYPE DE FICHE — trois états, pas deux.
 *
 * ABSENT (`modification.fiche === undefined`) : la note garde ce qu'elle porte.
 * C'est le cas d'une soumission composée sans référentiel de types de fiche —
 * voir `OptionsDeLEditeur.typesFiche` —, et c'est ce qui empêche un appelant
 * qui ne sait rien des fiches de dépouiller une note de son type.
 *
 * RETRAIT (`type: null`) : le sélecteur est revenu sur « Aucun — note simple ».
 * `proprietes_typees` DOIT alors passer à `null` DANS LA MÊME MISE À JOUR :
 * `notes_proprietes_exigent_un_type_de_fiche` (`002_socle.montee.sql:380-381`)
 * refuse des propriétés sans type, et n'écrire que l'une des deux colonnes fait
 * échouer l'enregistrement entier sur une contrainte que l'utilisateur n'a
 * aucun moyen de comprendre.
 *
 * POSÉ (`type` non vide) : le nom d'un type de fiche de l'instance, résolu par
 * `enregistrerLaNote()`. Un nom INCONNU est refusé, jamais ignoré.
 */
export interface FicheSoumise {
	/** Le NOM du type de fiche, ou `null` — le type est RETIRÉ. */
	readonly type: string | null;
	/** Ce que la note met dans les champs de ce type. Vide au retrait. */
	readonly proprietes: Readonly<Record<string, string>>;
}

/** Un corps réécrit — la valeur n'est pas encore validée. */
export interface CorpsSaisi {
	readonly saisi: unknown;
	/** Nie le retrait — voir `CorpsSoumis`, l'exclusion est portée par le type. */
	readonly supprime?: undefined;
}

/**
 * CE QU'UNE MODIFICATION FAIT DU CORPS — deux gestes, et le second n'existe que
 * pour l'Opérationnel.
 *
 * `RG-NOT-02` (`CDC:200`) : « le corps Référence est CANONIQUE. Le corps
 * Opérationnel est optionnel et ne peut exister sans Référence. » Le retrait est
 * donc une opération du seul registre Opérationnel, et la règle est tenue à
 * trois hauteurs plutôt qu'à une :
 *
 *   1. le SCHÉMA — `notes.corps_reference` est `NOT NULL` : une Référence
 *      retirée est inécrivable, quoi que demande un appelant ;
 *   2. le TYPE — `CorpsDeLaNote.reference` est `Document`, jamais
 *      `Document | null` : l'état « sans Référence » n'est pas représentable
 *      dans ce qu'un enregistrement produit ;
 *   3. la GARDE de `enregistrerLaNote()`, qui refuse un retrait demandé sur le
 *      registre Référence au lieu de le laisser échouer en base.
 *
 * Le régime du dépôt est *bloquant > vérifiable > déclaratif* : les deux
 * premières hauteurs sont bloquantes, la troisième nomme la cause.
 *
 * LES DEUX MEMBRES SE DÉCLARENT L'UN L'AUTRE, et ce n'est pas une coquetterie :
 * un membre qui tairait le champ de l'autre rendrait `{ saisi, supprime }`
 * assignable, c'est-à-dire un corps à la fois réécrit et retiré. Chacun nie donc
 * explicitement le champ de l'autre, et la contradiction devient inécrivable.
 */
export type CorpsSoumis =
	| CorpsSaisi
	/** Le corps est RETIRÉ — registre Opérationnel seul (`RG-NOT-02`). */
	| { readonly saisi?: undefined; readonly supprime: true };

/**
 * CE QU'UN FORMULAIRE PEUT PORTER — et le retrait n'en est pas.
 *
 * `lireLaModification()` lit une soumission de l'éditeur : elle rend un corps
 * SAISI, jamais un retrait. Le retrait est une action nommée à part
 * (`?/supprimer`), qui ne lit aucun champ — ce qui la rend insensible à ce que
 * le client compose. Le type dit cette différence plutôt que de la commenter :
 * une lecture de formulaire ne peut pas fabriquer une suppression.
 */
export interface ModificationSoumise extends Omit<ModificationDeNote, 'corps'> {
	readonly corps?: CorpsSaisi;
}

/** Un retrait de corps, distingué d'une réécriture sans supposer l'autre. */
function estUnRetrait(corps: CorpsSoumis | undefined): boolean {
	/* La VALEUR, jamais la présence de la clé : `{ saisi, supprime: undefined }`
	   porte la clé sans porter l'intention, et `in` s'y tromperait. */
	return corps?.supprime === true;
}

/* ═══════════════════════════════════ La lecture du formulaire ═══════════ */

/**
 * Ce qu'il faut d'un formulaire pour le lire : un accès par nom, et rien de
 * plus. `FormData` le satisfait ; une table de correspondance aussi, ce qui rend
 * la lecture éprouvable SANS requête et sans serveur (`P-26`).
 */
export interface ChampsSoumis {
	get(nom: string): unknown;
}

/** Un champ soumis, tel qu'il se présente : absent, textuel, ou autre chose. */
type ChampLu =
	| { readonly etat: 'absent' }
	| { readonly etat: 'texte'; readonly valeur: string }
	| { readonly etat: 'illisible' };

function champLu(champs: ChampsSoumis, nom: string): ChampLu {
	const brut = champs.get(nom);
	if (brut === null || brut === undefined) return { etat: 'absent' };
	if (typeof brut !== 'string') return { etat: 'illisible' };
	return { etat: 'texte', valeur: brut };
}

/**
 * Un champ textuel dont le blanc vaut l'absence. Le TITRE est la seule
 * exception, et elle est explicite : un titre blanc est REFUSÉ, parce que
 * `V-17-editeur.html:1596` en fait un champ obligatoire dont l'unique erreur
 * déclarée est « une note sans titre est introuvable » (`V-17:1601`). Partout
 * ailleurs, un champ caché vide ne porte aucun choix : le lire comme un choix
 * inventerait une valeur que personne n'a soumise.
 */
function texteUtile(lu: ChampLu): string | null {
	if (lu.etat !== 'texte') return null;
	const valeur = lu.valeur.trim();
	return valeur === '' ? null : valeur;
}

/** La valeur de l'énumération, ou `null`. Aucune coercition, aucun défaut. */
function valeurDEnumeration<V extends string>(valeurs: readonly V[], texte: string): V | null {
	return (valeurs as readonly string[]).includes(texte) ? (texte as V) : null;
}

/**
 * LES ÉTIQUETTES SOUMISES — « noms séparés par des virgules ».
 *
 * Les blancs de bord tombent, les entrées vides disparaissent, et les doublons
 * sont réduits : `etiquettes_de_note_pk` porte sur le couple note-étiquette, et
 * deux fois la même étiquette sur une note est INÉCRIVABLE. Réduire ici évite
 * de faire échouer une transaction sur une saisie que l'utilisateur croit
 * anodine — le schéma reste le juge, il n'est simplement pas sollicité pour
 * rien.
 */
export function etiquettesSoumises(texte: string): readonly string[] {
	const retenues: string[] = [];
	for (const brut of texte.split(',')) {
		const libelle = brut.trim();
		if (libelle !== '' && !retenues.includes(libelle)) retenues.push(libelle);
	}
	return retenues;
}

/** Un refus de FORME — ce que la route rendra en 400. */
export interface RefusDeForme {
	readonly motif: string;
}

/** Ce qu'une lecture de formulaire rend : une modification, ou un refus. */
export type LectureDuFormulaire =
	| { readonly recu: true; readonly modification: ModificationSoumise }
	| { readonly recu: false; readonly refus: RefusDeForme };

function refuser(motif: string): LectureDuFormulaire {
	return { recu: false, refus: { motif } };
}

/** Le nom du champ qui porte le corps en Markdown. */
export const CHAMP_CORPS_MARKDOWN = 'corps-markdown';

/**
 * LA LECTURE D'UNE SOUMISSION — fonction PURE, hors base et hors serveur.
 *
 * Elle est séparée de l'écriture pour la raison que `P-5` et `P-26` donnent :
 * un contrôle dont le seul cas d'épreuve est le dépôt est un contrôle qu'on
 * espère. Ici, les huit champs et leurs refus sont éprouvables sur une table de
 * correspondance, sans base — donc sans toucher la base partagée par les autres
 * copies de travail (`P-30`).
 *
 * LES DEUX CORPS SONT EXCLUSIFS. Le premier porte le document sérialisé de
 * l'éditeur, le second le Markdown que `analyserMarkdown()` convertit —
 * `ADR-004` en fait la porte unique du format, et aucun second analyseur n'est
 * écrit ici. Les recevoir tous les deux serait recevoir deux contenus pour un
 * seul corps : le refus est nommé plutôt qu'arbitré par un ordre de lecture.
 *
 * @throws SyntaxError si le document sérialisé ne se lit pas
 * @throws MarkdownInvalide, DocumentInvalide si le Markdown ne se lit pas, ou si
 *   ce qu'il décrit n'est pas un document
 */
export function lireLaModification(champs: ChampsSoumis): LectureDuFormulaire {
	const lus = {
		corps: champLu(champs, 'corps'),
		markdown: champLu(champs, CHAMP_CORPS_MARKDOWN),
		titre: champLu(champs, 'titre'),
		domaine: champLu(champs, 'domaine'),
		dossier: champLu(champs, 'dossier'),
		visibilite: champLu(champs, 'visibilite'),
		statut: champLu(champs, 'statut'),
		etiquettes: champLu(champs, 'etiquettes'),
		fiche: champLu(champs, 'fiche'),
		proprietes: champLu(champs, 'proprietes')
	};
	for (const [nom, lu] of Object.entries(lus)) {
		if (lu.etat === 'illisible') return refuser('champ illisible : ' + nom);
	}

	if (lus.corps.etat === 'texte' && lus.markdown.etat === 'texte') {
		return refuser('deux corps soumis');
	}

	/* Le titre est le seul champ dont le BLANC est une erreur, et non une
	   absence. Voir `texteUtile()`. */
	let titre: string | undefined;
	if (lus.titre.etat === 'texte') {
		const propre = texteUtile(lus.titre);
		if (propre === null) return refuser('titre manquant');
		titre = propre;
	}

	/* `RG-M05-09` se joue plus loin, sur les DROITS. Ici, seule la forme est en
	   cause : un domaine sans dossier — ou l'inverse — ne désigne rien, et
	   deviner le second à partir du premier rangerait la note ailleurs que là où
	   l'utilisateur l'a demandé. */
	const domaine = texteUtile(lus.domaine);
	const dossier = texteUtile(lus.dossier);
	if ((domaine === null) !== (dossier === null)) return refuser('rangement incomplet');
	const rangement = domaine === null || dossier === null ? undefined : { domaine, dossier };

	let visibilite: VisibiliteDeNote | undefined;
	const visibiliteSoumise = texteUtile(lus.visibilite);
	if (visibiliteSoumise !== null) {
		const valeur = valeurDEnumeration(enumDeVisibilite.enumValues, visibiliteSoumise);
		if (valeur === null) return refuser('visibilite invalide');
		visibilite = valeur;
	}

	let statut: StatutDeNote | undefined;
	const statutSoumis = texteUtile(lus.statut);
	if (statutSoumis !== null) {
		const valeur = valeurDEnumeration(enumDeStatut.enumValues, statutSoumis);
		if (valeur === null) return refuser('statut invalide');
		statut = valeur;
	}

	/* Une liste d'étiquettes VIDE est une liste, pas une absence : c'est le seul
	   moyen de retirer la dernière étiquette d'une note, et « la liste soumise
	   remplace la liste courante » ne connaît pas d'exception pour le vide. */
	const etiquettes =
		lus.etiquettes.etat === 'texte' ? etiquettesSoumises(lus.etiquettes.valeur) : undefined;

	/* LE TYPE DE FICHE EST LE SECOND CHAMP DONT LE VIDE EST UN CHOIX, et c'est le
	   seul moyen de RETIRER un type — le sélecteur du gel porte « Aucun — note
	   simple » comme première option, valeur vide. `texteUtile()` ne peut donc
	   pas servir ici : il confond le vide et l'absence, et une note ne pourrait
	   plus jamais redevenir simple.

	   Les propriétés sans type sont refusées AVANT la base (`ADR-003`), même
	   miroir applicatif qu'à la création. */
	let fiche: FicheSoumise | undefined;
	if (lus.fiche.etat === 'texte') {
		const proprietes = proprietesSoumises(
			lus.proprietes.etat === 'texte' ? lus.proprietes.valeur.trim() : ''
		);
		if (!proprietes.ok) return refuser('propriétés illisibles');
		const type = lus.fiche.valeur.trim();
		if (type === '' && Object.keys(proprietes.valeurs).length > 0) {
			return refuser('propriétés sans type de fiche');
		}
		fiche = type === '' ? { type: null, proprietes: {} } : { type, proprietes: proprietes.valeurs };
	} else if (lus.proprietes.etat === 'texte') {
		/* Des propriétés sans le champ qui nomme leur type ne désignent rien : le
		   type resterait celui d'avant, et les clés seraient filtrées sur un
		   référentiel que l'appelant n'a pas consulté. Le refus nomme la cause. */
		return refuser('propriétés sans type de fiche');
	}

	/* LE CORPS EST LE SEUL CHAMP DONT LE VIDE N'EST PAS ARBITRÉ ICI, et il n'avait
	   pas à l'être : la porte unique du format le refuse d'elle-même — « aucun
	   contenu vide : l'absence de contenu s'écrit par l'absence de la clé »
	   (`ADR-003`). Un champ resté vide lève donc, et n'efface rien. */
	let corps: { readonly saisi: unknown } | undefined;
	if (lus.corps.etat === 'texte') corps = { saisi: JSON.parse(lus.corps.valeur) };
	else if (lus.markdown.etat === 'texte') {
		/* LA FRONTIÈRE DE TRANSPORT — `markdownDeFormulaire()` défait la
		   normalisation des fins de ligne du sérialiseur de formulaire, et rien
		   d'autre. Son en-tête dit pourquoi elle n'est pas dans l'analyseur :
		   elle y rendrait inerte le refus de `RG-M04-05` (`P-26`). Second des
		   deux lecteurs de cette parade, `P-33`. */
		corps = { saisi: analyserMarkdown(markdownDeFormulaire(lus.markdown.valeur)) };
	}

	/* L'ABSENCE EST UNE CLÉ ABSENTE, PAS UNE CLÉ À `undefined` : le dépôt tient
	   `exactOptionalPropertyTypes`, et la distinction cesse alors d'être une
	   nuance de style. « Aucun champ absent n'est modifié » est ici porté par la
	   FORME de l'objet, donc par le compilateur. */
	return {
		recu: true,
		modification: {
			...(titre === undefined ? {} : { titre }),
			...(rangement === undefined ? {} : { rangement }),
			...(visibilite === undefined ? {} : { visibilite }),
			...(statut === undefined ? {} : { statut }),
			...(etiquettes === undefined ? {} : { etiquettes }),
			...(fiche === undefined ? {} : { fiche }),
			...(corps === undefined ? {} : { corps })
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

/** Ce qu'une modification de note demande. */
export interface DemandeDeModificationDeNote {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
	readonly modification: ModificationDeNote;
}

/** Ce qu'un enregistrement rend quand il a écrit. */
export interface EnregistrementFait {
	readonly identifiant: string;
	/** La version écrite, ou `null` — RG-M07-01, contenu inchangé. */
	readonly version: VersionAEcrire | null;
}

/**
 * L'ISSUE D'UNE MODIFICATION, une fois le DROIT SUR LA NOTE acquis.
 *
 * Le rangement demandé a sa propre issue, et elle n'est pas `INTROUVABLE` : la
 * note, elle, existe et s'édite. Rendre 404 pour un dossier de destination
 * refusé mentirait sur la note. Rendre « dossier interdit » plutôt que « dossier
 * inconnu » apprendrait en revanche l'existence d'un dossier hors périmètre, ce
 * que `RG-ACC-04` refuse — les deux causes rendent donc la MÊME issue.
 */
export type IssueDeModification =
	| { readonly sort: 'ecrit'; readonly fait: EnregistrementFait }
	| { readonly sort: 'rangement-introuvable' }
	/**
	 * Le type de fiche demandé n'existe pas dans cette instance. Comme le
	 * rangement, ce n'est PAS un 404 : la note existe et s'édite. Et comme lui,
	 * le nom soumis est refusé plutôt qu'ignoré — l'ignorer enregistrerait une
	 * note simple là où l'utilisateur a choisi une fiche, sans qu'aucun écran ne
	 * le dise.
	 */
	| { readonly sort: 'fiche-introuvable' };

/**
 * LE DOSSIER QU'UN CHEMIN AFFICHÉ DÉSIGNE — fonction PURE.
 *
 * Le chemin soumis est celui du gel, en noms affichés ; `resoudreLeChemin()`
 * descend l'arborescence sur des segments d'ADRESSE. La conversion est
 * `identifiantLisible()`, celle-là même que la composition d'adresse emploie —
 * un second normaliseur rendrait deux dossiers différents pour un même nom.
 *
 * LA RACINE D'UN DOMAINE EST UNE DESTINATION VALABLE, et c'est le même geste que
 * `resoudreLaCible()` (`./creation.ts`) : un domaine sans sous-dossier n'offre
 * que sa racine, que l'arbre de choix nomme par le nom du domaine. Le chemin
 * `Migration` était refusé alors que la note s'y crée — mesuré le 22/08/2026,
 * `400 rangement introuvable` sur un domaine et un dossier existants. Le segment
 * de racine est donc retiré en tête, et ce qui reste se résout comme avant.
 *
 * Le chemin VIDE, lui, ne désigne toujours rien : aucun choix n'a été fait.
 */
export function dossierDeDestination(
	lignes: readonly LigneDeDossier[],
	chemin: string
): LigneDeDossier | null {
	const segments = chemin
		.split(SEPARATEUR_DE_CHEMIN.trim())
		.map((s) => s.trim())
		.filter((s) => s !== '')
		.map(identifiantLisible);
	if (segments.length === 0) return null;
	const racine = lignes.find((d) => d.parentId === null) ?? null;
	if (racine === null || segments[0] !== identifiantLisible(racine.nom)) {
		return resoudreLeChemin(lignes, segments);
	}
	const sousLaRacine = segments.slice(1);
	return sousLaRacine.length === 0 ? racine : resoudreLeChemin(lignes, sousLaRacine);
}

/**
 * LA DESTINATION D'UN DÉPLACEMENT, ou `null` — et `RG-M05-09` en entier.
 *
 * `CDC:752` : « déplacer une note vers un autre dossier exige le droit de
 * rédaction sur le dossier d'origine ET sur le dossier de destination ». La
 * première moitié est acquise avant d'arriver ici — `resoudreLEditionDUneNote()`
 * refuse une note dont le dossier porteur n'est pas rédigeable. La seconde est
 * ci-dessous, par `peutEcrireSurLeDossier()`, qui ne recopie aucune table de
 * droits.
 *
 * QUATRE CAUSES, UNE SEULE SORTIE : domaine inconnu, domaine AMBIGU, dossier
 * inconnu, dossier interdit. Le nom d'un domaine n'est unique que par univers
 * (`domaines_identifiant_par_univers_unique`) : deux domaines homonymes rendent
 * la demande indécidable, et deviner serait ranger la note dans l'autre univers.
 */
async function destinationDuRangement(
	base: Base,
	identite: Identite,
	rangement: RangementDemande
): Promise<{ readonly domaineId: string; readonly dossierId: string } | null> {
	const candidats = await base
		.select({ id: domaines.id })
		.from(domaines)
		.where(eq(domaines.nom, rangement.domaine))
		.limit(2);
	const domaine = candidats.length === 1 ? candidats[0] : undefined;
	if (domaine === undefined) return null;

	const lignes = await base
		.select({
			id: dossiers.id,
			parentId: dossiers.parentId,
			domaineId: dossiers.domaineId,
			nom: dossiers.nom,
			profondeur: dossiers.profondeur
		})
		.from(dossiers)
		.where(eq(dossiers.domaineId, domaine.id));

	const cible = dossierDeDestination(lignes, rangement.dossier);
	if (cible === null) return null;
	if (!(await peutEcrireSurLeDossier(base, identite, cible.id))) return null;
	return { domaineId: domaine.id, dossierId: cible.id };
}

/**
 * LES DEUX COLONNES DE FICHE QU'UNE MODIFICATION DEMANDE, ou `null` — le nom du
 * type est inconnu.
 *
 * Le filtrage des clés est celui de la création, et c'est la MÊME fonction :
 * `retenirLesProprietes()` (`./creation.ts`). Un second filtre écrirait deux
 * définitions de « propriété reconnue », et la divergence ne se verrait qu'au
 * panneau de propriétés de la cartographie, sur les seules notes modifiées.
 */
async function ficheDeLaModification(
	base: Base,
	demande: FicheSoumise
): Promise<{ readonly typeDeFicheId: string | null; readonly proprietes: unknown } | null> {
	if (demande.type === null) return { typeDeFicheId: null, proprietes: null };
	const [type] = await base
		.select({ id: typesDeFiche.id })
		.from(typesDeFiche)
		.where(eq(typesDeFiche.nom, demande.type))
		.limit(1);
	if (type === undefined) return null;
	const clesConnues = await base
		.select({ cle: champsDeTypeDeFiche.cle })
		.from(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, type.id));
	const retenues = retenirLesProprietes(
		demande.proprietes,
		clesConnues.map((c) => c.cle)
	);
	return {
		typeDeFicheId: type.id,
		proprietes: Object.keys(retenues).length === 0 ? null : retenues
	};
}

/**
 * L'ÉTIQUETTE D'UN LIBELLÉ, CRÉÉE SI ELLE N'EXISTE PAS.
 *
 * `src/lib/donnees/import.ts` porte la jumelle de cette fonction, privée elle
 * aussi. Les deux ne sont pas réunies parce que les deux fichiers appartiennent
 * à des lots distincts de cette vague ; le coût est déclaré au rapport, et il
 * est borné : la table `etiquettes` porte une unicité de libellé, qui reste le
 * juge quoi qu'écrive l'un ou l'autre.
 *
 * Le contexte reçu est celui que `base.transaction()` remet à son bloc — son
 * type est DÉRIVÉ de la signature, jamais forcé : une étiquette créée hors de la
 * transaction qui écrit sa liaison survivrait à l'annulation de celle-ci.
 */
type Transaction = Parameters<Parameters<Base['transaction']>[0]>[0];

async function etiquetteDuLibelle(tx: Transaction, libelle: string): Promise<string> {
	const deja = await tx
		.select({ id: etiquettes.id })
		.from(etiquettes)
		.where(eq(etiquettes.libelle, libelle))
		.limit(1);
	const trouve = deja[0];
	if (trouve !== undefined) return trouve.id;
	const inseres = await tx.insert(etiquettes).values({ libelle }).returning({ id: etiquettes.id });
	return (inseres[0] as { id: string }).id;
}

/**
 * LES DEUX CORPS APRÈS ENREGISTREMENT — et celui qui ne bouge pas.
 *
 * Quand aucun corps n'est soumis, les deux corps d'après sont ceux d'avant,
 * relus par la porte unique du format. `contenuModifie()` les compare alors à
 * eux-mêmes et rend « inchangé » : aucune version n'est écrite, ce que
 * `RG-M07-01` exige en propres termes. La décision n'est pas réécrite ici — elle
 * reste celle de `versionDUnEnregistrement()`, à qui l'on passe le bon `avant`.
 */
function corpsApresEnregistrement(
	ligne: { readonly corpsReference: unknown; readonly corpsOperationnel: unknown },
	registre: Registre,
	corps: CorpsSoumis | undefined
): CorpsDeLaNote {
	const reference = analyserDocument(ligne.corpsReference);
	const operationnel =
		ligne.corpsOperationnel === null || ligne.corpsOperationnel === undefined
			? null
			: analyserDocument(ligne.corpsOperationnel);
	if (corps === undefined) return { reference, operationnel };

	/* LE RETRAIT DU REGISTRE OPÉRATIONNEL — l'absence est un ÉTAT du corps, et
	   `empreinteDuCorps()` lui en donne un (« absent ») : la version qui suit
	   capture donc bien un changement, et l'historique porte le retrait plutôt
	   que de l'omettre. La Référence n'a pas ce geste (`RG-NOT-02`, ci-dessus),
	   et le type ne le lui offre pas. */
	if (estUnRetrait(corps)) return { reference, operationnel: null };

	/* Le document REÉCRIT par ProseMirror, jamais celui reçu — porte 3. */
	const document = documentDepuisNoeud(noeudDepuisDocument(corps.saisi));
	return registre === 'operationnel'
		? { reference, operationnel: document }
		: { reference: document, operationnel };
}

/**
 * L'ENREGISTREMENT D'UNE NOTE — le titre, le rangement, les métadonnées, les
 * étiquettes, le corps, et la version que `RG-M07-02` exige.
 *
 * TROIS PORTES SUCCESSIVES, ET AUCUNE N'EST FACULTATIVE :
 *
 *  1. la RÉSOLUTION — `resoudreLEditionDUneNote()`, la même que le chargeur.
 *     Un appelant sans droit reçoit `INTROUVABLE`, avant toute écriture : rien
 *     de ce qu'il envoie n'est appliqué. C'est aussi la première moitié de
 *     `RG-M05-09` — le droit d'écrire sur le dossier D'ORIGINE —, et elle est
 *     acquise ici plutôt que revérifiée.
 *  2. le FORMAT — le corps saisi passe par `noeudDepuisDocument()`, qui appelle
 *     `analyserDocument` puis contrôle que l'éditeur SAIT le porter. Un
 *     document mal formé est refusé, jamais réparé (`ADR-003`).
 *  3. l'ALLER-RETOUR — le document réécrit est celui que ProseMirror rend
 *     (`documentDepuisNoeud`), non celui qu'on a reçu. C'est ce qui garantit
 *     que ce qui entre en base est exactement ce que l'éditeur produira à la
 *     relecture : deux écritures d'un même document ne peuvent pas cohabiter
 *     (règle 1 du format).
 *
 * L'IDENTIFIANT NE BOUGE JAMAIS, quoi qu'il advienne du titre. `RG-M03-03`
 * (`CDC:484`) : « l'adresse d'une note reste stable dans le temps, même si la
 * note change de dossier ou de domaine », et `ARB-062` §2.6 le redit du
 * renommage — « dérivé à la création, jamais recalculé ensuite ». Aucune
 * écriture de cette fonction ne touche `notes.identifiant`, et c'est par lui
 * qu'elle retrouve la note.
 *
 * TOUTES LES ÉCRITURES SONT DANS UNE SEULE TRANSACTION — la note, sa version,
 * ses étiquettes. Une note enregistrée sans sa version serait un historique
 * amputé sans témoin, et `RG-M07-02` demande une capture « à chaque
 * enregistrement qui modifie le corps ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CETTE FONCTION CASSAIT EN AVAL — RÉPARÉ, ET CE QUI RESTE
 *
 * Cette section décrivait, mesure à l'appui, un défaut RÉEL et fermé depuis :
 * `extraitDuCorps()` n'admettait qu'un document d'un seul paragraphe — la forme
 * que `corpsDepuisTexte()` produit — et LEVAIT sur tout corps rédigé, rendant
 * `lireNotes()` inutilisable, donc toute route qui lit le corpus.
 *
 * Il est fermé : `extraitDuCorps()` est aujourd'hui `texteBrut(analyserDocument(
 * corps))` (`./lecture.ts`), et traite tous les types de bloc. `ADR-003` le
 * fonde — le texte brut est produit « à l'enregistrement » et « sert aux
 * extraits ». La validation n'a pas été desserrée, elle a été DÉPLACÉE sur
 * `analyserDocument`, qui refuse toujours un document mal formé.
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
 * LA DATE DE MODIFICATION SUIT L'ENREGISTREMENT, PAS LE SEUL CORPS
 *
 * `modifieLe` est écrite dès qu'une colonne de la note ou sa liste d'étiquettes
 * change, et pas seulement quand un corps change : le gel n'offre qu'UN geste
 * d'enregistrement — V-17 ne porte qu'un bouton « Enregistrer » (`V-17:1439`) —
 * et une note dont le titre a changé aujourd'hui sans que sa date de
 * modification bouge serait une date qui ment. Une soumission qui ne porte RIEN
 * n'écrit rien, pas même cette date.
 *
 * `RG-M05-07` — « une note enregistrée reçoit un signal de fraîcheur vert » —
 * n'est toujours PAS déclarée tenue : la fraîcheur se calcule sur la date de
 * VÉRIFICATION, et confondre « modifier » et « vérifier » confondrait deux
 * termes du vocabulaire contractuel. Voir l'en-tête de
 * `src/lib/edition/enregistrement.ts`, point 2.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * PUIS L'INDEX, ET DANS CET ORDRE
 *
 * L'entretien de l'index vient APRÈS la transaction, jamais dedans :
 * `retirerDesNotes()` (`../recherche/moteur.ts`) le prescrit en majuscules, et sa
 * raison vaut aussi pour l'écriture — « une transaction annulée ne peut pas
 * laisser un index amputé ». Le titre, les étiquettes, le domaine et l'extrait
 * projeté sont tous des champs cherchables, et `modifieLe` est triable : ce lot
 * élargit donc ce que l'entretien rattrape, sans changer son moment.
 *
 * @throws DocumentInvalide, EditeurIncapable — le corps saisi est refusé
 * @throws l'erreur de la tâche du moteur si l'index n'a pas pu être entretenu.
 *   La note est alors ÉCRITE et non indexée, et l'appelant reçoit l'échec plutôt
 *   qu'un silence. Ce que l'écran en fait n'est spécifié nulle part : aucune
 *   source ne décrit l'état d'un enregistrement dont l'index a refusé, et aucune
 *   maquette ne le porte. Écart déclaré au rapport du lot, non comblé ici.
 */
export async function enregistrerLaNote(
	base: Base,
	client: Meilisearch,
	demande: DemandeDeModificationDeNote
): Promise<Resolution<IssueDeModification>> {
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

	const modification = demande.modification;

	/* `RG-NOT-02`, troisième hauteur — voir `CorpsSoumis`. Le retrait ne vise que
	   l'Opérationnel ; demandé sur la Référence, il est refusé ICI plutôt que
	   laissé buter sur `NOT NULL`, pour que la cause soit nommée et non déduite
	   d'un message de base. Le refus emprunte la sortie unique de la famille
	   `/notes/…` (`RG-ACC-04`) : rien n'a été écrit, rien n'est à défaire. */
	if (estUnRetrait(modification.corps) && demande.registre !== 'operationnel') {
		return INTROUVABLE;
	}

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

	/* `RG-M05-09`, seconde moitié — le droit sur le dossier de DESTINATION. Le
	   refus vient AVANT toute écriture : un déplacement refusé ne doit pas
	   laisser derrière lui un titre déjà écrit. */
	let destination: { readonly domaineId: string; readonly dossierId: string } | null = null;
	if (modification.rangement !== undefined) {
		destination = await destinationDuRangement(base, demande.identite, modification.rangement);
		if (destination === null) {
			return { trouve: true, ressource: { sort: 'rangement-introuvable' } };
		}
	}

	/* LE TYPE DE FICHE, RÉSOLU AVANT TOUTE ÉCRITURE — même ordre que le
	   rangement, et pour la même raison : un type inconnu ne doit pas laisser
	   derrière lui un titre déjà écrit. */
	let fiche: { readonly typeDeFicheId: string | null; readonly proprietes: unknown } | null = null;
	if (modification.fiche !== undefined) {
		fiche = await ficheDeLaModification(base, modification.fiche);
		if (fiche === null) return { trouve: true, ressource: { sort: 'fiche-introuvable' } };
	}

	const avant: EtatEnBase = {
		titre: ligne.titre,
		reference: ligne.corpsReference,
		operationnel: ligne.corpsOperationnel
	};
	const titre = modification.titre ?? ligne.titre;
	const apres = corpsApresEnregistrement(ligne, demande.registre, modification.corps);

	const [dernier] = await base
		.select({ numero: max(versions.numero) })
		.from(versions)
		.where(eq(versions.noteId, ligne.id));

	/* La version capture ce que l'enregistrement PRODUIT — `RG-M07-02`, et
	   l'en-tête de `enregistrement.ts`, où quatre relevés de V-15 le tranchent.
	   Le titre passé est donc celui d'APRÈS. */
	const version = versionDUnEnregistrement({
		dernierNumero: dernier?.numero ?? 0,
		auteurId: demande.identite.compteId,
		maintenant: demande.maintenant,
		titre,
		corps: apres,
		avant
	});

	const colonnes: Partial<typeof notes.$inferInsert> = {};
	if (modification.titre !== undefined) colonnes.titre = modification.titre;
	if (modification.visibilite !== undefined) colonnes.visibilite = modification.visibilite;
	if (modification.statut !== undefined) colonnes.statut = modification.statut;
	if (destination !== null) {
		colonnes.domaineId = destination.domaineId;
		colonnes.dossierId = destination.dossierId;
	}
	/* LES DEUX COLONNES DE FICHE SONT ÉCRITES ENSEMBLE, TOUJOURS. Poser le type
	   sans poser les propriétés laisserait celles de l'ancien type sur la note ;
	   retirer le type sans annuler les propriétés ferait échouer la mise à jour
	   sur `notes_proprietes_exigent_un_type_de_fiche`. Voir `FicheSoumise`. */
	if (fiche !== null) {
		colonnes.typeDeFicheId = fiche.typeDeFicheId;
		colonnes.proprietesTypees = fiche.proprietes;
	}
	/**
	 * LA DATE DE CORPS NE BOUGE QUE SI LE CORPS A BOUGÉ — `RG-M06-09`.
	 *
	 * « Seule une modification EFFECTIVE du corps Référence » déclenche le signal
	 * de désynchronisation (`CDC:812`), et ce signal se lit sur ces deux dates
	 * (`RG-M06-08`). Poser la date sur toute soumission ferait donc désynchroniser
	 * un registre Opérationnel parce que quelqu'un a rouvert la Référence et
	 * réenregistré sans une frappe — un signal levé par un geste qui n'a rien
	 * changé.
	 *
	 * La comparaison n'est pas écrite ici : c'est `empreinteDuCorps()`
	 * (`../edition/enregistrement.ts`), la même normalisation que celle dont
	 * `RG-M07-01` décide s'il faut écrire une version. Un second comparateur
	 * rendrait possible une note qui porte une version sans en porter la date, ou
	 * l'inverse. Les deux décisions restent donc alignées PAR CONSTRUCTION, et
	 * c'est exactement ce que `RG-M06-10` demande : « enregistrer une NOUVELLE
	 * VERSION du corps Opérationnel » lève le signal — un enregistrement qui n'en
	 * écrit aucune ne le lève pas, et c'est pour ce cas-là que « Marquer comme
	 * resynchronisé » existe.
	 *
	 * La COLONNE, elle, est écrite dans tous les cas : c'est le document réécrit
	 * par la porte 3, dont l'aller-retour est idempotent — écrire la même valeur
	 * n'apprend rien de faux à personne.
	 */
	if (modification.corps !== undefined) {
		if (demande.registre === 'operationnel') {
			colonnes.corpsOperationnel = apres.operationnel;
			const change =
				empreinteDuCorps(ligne.corpsOperationnel) !== empreinteDuCorps(apres.operationnel);
			/* `notes_operationnel_date_coherente` — les deux colonnes sont nulles
			   ensemble, ou aucune ne l'est. Le retrait emporte donc la date. */
			if (apres.operationnel === null) colonnes.corpsOperationnelModifieLe = null;
			else if (change) colonnes.corpsOperationnelModifieLe = demande.maintenant;
		} else {
			colonnes.corpsReference = apres.reference;
			if (empreinteDuCorps(ligne.corpsReference) !== empreinteDuCorps(apres.reference)) {
				colonnes.corpsReferenceModifieLe = demande.maintenant;
			}
		}
	}
	const ecrit = Object.keys(colonnes).length > 0 || modification.etiquettes !== undefined;
	if (ecrit) colonnes.modifieLe = demande.maintenant;

	await base.transaction(async (tx) => {
		if (ecrit) await tx.update(notes).set(colonnes).where(eq(notes.id, ligne.id));
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
		/* LA LISTE SOUMISE REMPLACE LA LISTE COURANTE — la liaison est vidée pour
		   cette note, puis réécrite dans l'ordre soumis. Le rang est l'ordre de
		   saisie : `etiquettes_de_note_ordre_unique` en fait une colonne
		   obligatoire, et l'ordre affiché n'est pas l'ordre alphabétique (voir le
		   commentaire du schéma). */
		if (modification.etiquettes !== undefined) {
			await tx.delete(etiquettesDeNote).where(eq(etiquettesDeNote.noteId, ligne.id));
			let ordre = 0;
			for (const libelle of modification.etiquettes) {
				const etiquetteId = await etiquetteDuLibelle(tx, libelle);
				await tx.insert(etiquettesDeNote).values({ noteId: ligne.id, etiquetteId, ordre });
				ordre += 1;
			}
		}
	});

	/* LA TRANSACTION EST VALIDÉE — l'index peut suivre, jamais avant. `ARB-060` :
	   le document est SOUMIS à l'index, et la tâche n'est pas attendue. Quand cet
	   appel rend, la soumission est faite — un moteur arrêté ou refusant lève
	   ici — mais la note n'est pas encore trouvable : elle l'est 804 ms plus tard,
	   sous les 10 s de `RG-M05-06`. Ne rien conclure d'autre de ce retour. */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return {
		trouve: true,
		ressource: { sort: 'ecrit', fait: { identifiant: demande.identifiant, version } }
	};
}

/**
 * L'ENREGISTREMENT D'UN SEUL CORPS — la voie de l'éditeur de l'Opérationnel.
 *
 * Elle ne porte plus d'écriture en propre : elle compose une modification qui ne
 * touche que le corps, et la délègue à `enregistrerLaNote()`. Deux chemins
 * d'écriture divergeraient, et la divergence ne se verrait qu'à l'historique —
 * c'est le mode de défaillance qu'`ADR-004` nomme pour la conversion, et il vaut
 * ici mot pour mot.
 *
 * @throws DocumentInvalide, EditeurIncapable — voir `enregistrerLaNote()`
 */
export async function enregistrerLeCorps(
	base: Base,
	client: Meilisearch,
	demande: DemandeDEnregistrementDeNote
): Promise<Resolution<EnregistrementFait>> {
	const issue = await enregistrerLaNote(base, client, {
		identifiant: demande.identifiant,
		registre: demande.registre,
		identite: demande.identite,
		contexte: demande.contexte,
		maintenant: demande.maintenant,
		modification: { corps: { saisi: demande.corpsSaisi } }
	});
	if (!issue.trouve) return INTROUVABLE;
	/* Cette voie ne soumet AUCUN rangement : l'issue ne peut être qu'« écrit ».
	   Le cas contraire est néanmoins traité — une issue laissée sans traitement
	   serait une supposition, et une supposition se périme en silence. */
	if (issue.ressource.sort !== 'ecrit') return INTROUVABLE;
	return { trouve: true, ressource: issue.ressource.fait };
}

/* ═══════════════════════ Les deux registres et leur synchronisation ═════ */

/** Les deux dates de corps d'une note, telles que la requête les rapporte. */
export interface DatesDesDeuxRegistres {
	readonly referenceModifieLe: Date;
	/** `null` : la note n'a pas de registre Opérationnel (`RG-NOT-02`). */
	readonly operationnelModifieLe: Date | null;
}

/**
 * `RG-M06-08` — LE SIGNAL « À RESYNCHRONISER », ET SON UNIQUE DÉFINITION.
 *
 * « Le registre Opérationnel est signalé « à resynchroniser » SI ET SEULEMENT SI
 * le corps Référence a été modifié après la dernière mise à jour du corps
 * Opérationnel » (`CDC:810`). Trois choses s'y lisent, et aucune n'est une
 * interprétation :
 *
 *  - la comparaison porte sur les DEUX DATES DE CORPS, jamais sur `modifieLe`,
 *    qu'un simple renommage fait bouger — ce serait `RG-M06-09` violée ;
 *  - « après » est STRICT : deux dates égales ne désynchronisent pas. C'est le
 *    cas nominal d'une note dont les deux registres ont été écrits du même
 *    geste, et celui de la semence — cinq notes sur trente-deux y sont ;
 *  - sans registre Opérationnel, il n'y a rien à resynchroniser.
 *
 * La fonction est PURE, et c'est ce qui la rend éprouvable sans base (`P-26`) :
 * son cas d'épreuve ne dépend pas de l'état du dépôt.
 *
 * DEUX POINTS D'APPEL DEVRAIENT LA CITER, ET UN SEUL LE FAIT AUJOURD'HUI :
 * `src/routes/notes/[identifiant]/+page.server.ts` porte le même prédicat en
 * ligne, pour le bandeau de lecture de V-14. Le fichier appartient à un autre
 * lot et n'est pas touché ici ; la duplication est déclarée au rapport, et elle
 * est exactement le mode de défaillance que `P-01` nomme pour la fraîcheur —
 * deux définitions concurrentes d'un même signal.
 */
export function operationnelDesynchronise(dates: DatesDesDeuxRegistres): boolean {
	if (dates.operationnelModifieLe === null) return false;
	return dates.referenceModifieLe.getTime() > dates.operationnelModifieLe.getTime();
}

/**
 * LES COLONNES QU'UNE ATTESTATION DE RESYNCHRONISATION ÉCRIT, ET RIEN D'AUTRE.
 *
 * Même forme que `ColonnesDUneVerification` (`./verification.ts`), et pour la
 * même raison : le type est la garantie. Il ne déclare ni corps, ni titre, ni
 * `modifieLe`, ni `verifieLe` — un point d'appel qui voudrait en écrire un n'a
 * pas de champ où le poser.
 *
 * `RG-M06-10` — « deux actions lèvent le signal : enregistrer une nouvelle
 * version du corps Opérationnel, ou « Marquer comme resynchronisé » (pour le cas
 * « j'ai relu, ça tient toujours ») ». La seconde n'est donc PAS une
 * modification : elle n'écrit aucun corps, ne crée aucune version (`RG-M07-01`,
 * qui veut un changement de contenu), et ne touche pas `modifieLe` — une note
 * dont la date de modification bougerait sans que rien n'ait changé mentirait à
 * la lecture, et à la fraîcheur qui s'y adosse quand la note n'a jamais été
 * vérifiée (`RG-M06-01`).
 *
 * Elle ne touche pas `verifieLe` non plus, et c'est le point délicat :
 * « j'ai relu, ça tient » ressemble à une vérification, mais `RG-M06-05` fait de
 * la vérification une action DISTINCTE, et « attester que le pas-à-pas suit la
 * Référence » n'est pas « attester que la note est d'actualité ». Confondre les
 * deux confondrait deux termes du vocabulaire contractuel (`CLAUDE.md` §3).
 *
 * Ce qu'elle écrit est donc exactement ce que `RG-M06-08` lit : la date de
 * dernière mise à jour du corps Opérationnel.
 */
export interface ColonnesDUneResynchronisation {
	readonly corpsOperationnelModifieLe: Date;
}

/** Ce qu'une attestation de resynchronisation demande. */
export interface DemandeDeResynchronisation {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
}

/** Ce qu'une attestation rend : le signal est-il levé, et l'était-il déjà. */
export interface ResynchronisationFaite {
	readonly identifiant: string;
	/** Vrai : le signal était levé avant ce geste — l'attestation l'a éteint. */
	readonly etaitDesynchronise: boolean;
}

/**
 * « MARQUER COMME RESYNCHRONISÉ » — l'attestation sans réédition de `M05.9`.
 *
 * Le droit est acquis par la MÊME résolution que l'éditeur —
 * `resoudreLEditionDeLOperationnel()` —, jamais par une seconde table de droits :
 * qui peut écrire l'Opérationnel peut attester qu'il tient toujours, et qui ne
 * le peut pas reçoit `INTROUVABLE` (`RG-ACC-04`).
 *
 * SANS REGISTRE OPÉRATIONNEL, L'ATTESTATION N'A PAS D'OBJET. La contrainte
 * `notes_operationnel_date_coherente` l'interdit de toute façon — la date ne peut
 * exister sans le corps —, et le gel ne montre l'action qu'au cas `desync`
 * (`V-18:1954`, `hidden`). Le refus est celui de la famille.
 *
 * L'INDEX N'EST PAS ENTRETENU : rien de cherchable ne change. `RG-M05-06` porte
 * sur « une note enregistrée » ; une attestation n'écrit ni titre, ni corps, ni
 * étiquette, ni domaine, ni date de modification — les cinq champs que
 * l'entretien projette.
 */
export async function attesterLaResynchronisation(
	base: Base,
	demande: DemandeDeResynchronisation
): Promise<Resolution<ResynchronisationFaite>> {
	const acces = await resoudreLEditionDeLOperationnel(base, {
		identifiant: demande.identifiant,
		identite: demande.identite,
		contexte: demande.contexte
	});
	if (!acces.trouve) return INTROUVABLE;

	const [ligne] = await base
		.select({
			id: notes.id,
			referenceModifieLe: notes.corpsReferenceModifieLe,
			operationnelModifieLe: notes.corpsOperationnelModifieLe
		})
		.from(notes)
		.where(eq(notes.identifiant, demande.identifiant))
		.limit(1);
	if (ligne === undefined || ligne.operationnelModifieLe === null) return INTROUVABLE;

	const colonnes: ColonnesDUneResynchronisation = {
		corpsOperationnelModifieLe: demande.maintenant
	};
	await base.update(notes).set(colonnes).where(eq(notes.id, ligne.id));

	return {
		trouve: true,
		ressource: {
			identifiant: demande.identifiant,
			etaitDesynchronise: operationnelDesynchronise(ligne)
		}
	};
}

/**
 * « SUPPRIMER LA VERSION OPÉRATIONNELLE » — la troisième action dédiée de
 * `M05.9`, et elle passe par la voie d'écriture UNIQUE.
 *
 * Rien n'est écrit ici : la demande est un retrait de corps, et
 * `enregistrerLaNote()` en fait ce qu'il fait de toute écriture de corps — la
 * même résolution de droit, la même transaction, la même capture de version, le
 * même entretien d'index. Un second chemin d'écriture divergerait, et la
 * divergence ne se verrait qu'à l'historique (`ADR-004`, mode de défaillance).
 *
 * LA NOTE SURVIT, ET C'EST TOUT L'ENJEU. Le gel le dit à l'utilisateur en propres
 * termes — « seul le registre Opérationnel est supprimé ; la Référence, les
 * métadonnées, l'historique et les liens de la note sont intacts »
 * (`mockups/V-18-editeur-operationnel.html:2007-2010`) —, et `RG-NOT-02` en fait
 * la règle : le corps canonique n'est pas retirable.
 *
 * @throws rien de ce que lève l'enregistrement d'un corps saisi : un retrait ne
 *   passe par aucune porte de format, n'ayant pas de document à valider.
 */
export async function supprimerLeRegistreOperationnel(
	base: Base,
	client: Meilisearch,
	demande: Omit<DemandeDEnregistrementDeNote, 'registre' | 'corpsSaisi'>
): Promise<Resolution<EnregistrementFait>> {
	const issue = await enregistrerLaNote(base, client, {
		identifiant: demande.identifiant,
		registre: 'operationnel',
		identite: demande.identite,
		contexte: demande.contexte,
		maintenant: demande.maintenant,
		modification: { corps: { supprime: true } }
	});
	if (!issue.trouve) return INTROUVABLE;
	/* Aucun rangement n'est soumis : l'issue ne peut être qu'« écrit ». Traitée
	   quand même — une supposition non traitée se périme en silence. */
	if (issue.ressource.sort !== 'ecrit') return INTROUVABLE;
	return { trouve: true, ressource: issue.ressource.fait };
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
