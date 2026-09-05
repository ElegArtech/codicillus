/**
 * `/notes/{identifiant}` — LE CHARGEUR DE LA LECTURE D'UNE NOTE (V-14).
 * `?registre=operationnel` désigne le second registre ;
 * `/notes/{identifiant}/operationnel` est l'ÉDITEUR (V-18).
 *
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04. `lireLaNote()` rend une
 * ressource ou `INTROUVABLE`, sans troisième forme : rien ici ne sait si la note est
 * inexistante ou interdite. LES DROITS SONT RÉSOLUS, JAMAIS RECOPIÉS —
 * `src/lib/droits/resolution.ts` est l'implémentation unique.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, UNE FOIS : une couche de lecture qui prendrait
 * l'heure elle-même rendrait ses résultats non reproductibles.
 *
 * LES TROIS ACTIONS DE M06 SONT ICI, ET NULLE PART AILLEURS. Elles sont NOMMÉES, la page
 * en portant trois ; chacune résout le droit AVANT d'écrire, et son refus est le MÊME
 * `404` que celui du chargeur — `P-09` veut l'action interdite NON RENDUE, mais l'absence
 * de bouton n'est pas un contrôle d'accès.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import {
	comptes,
	consultations,
	domaines,
	notes,
	piecesJointes,
	relations,
	typesDeNote,
	typesDeRelation,
	univers,
	verifications
} from '$lib/base/schema';
import { analyserDocument, type Document } from '$lib/contenu/document';
import { ancresDuDocument } from '$lib/contenu/rendu';
import { formaterDateFr, formaterDateHeureFr, formaterDateIso } from '$lib/dates';
import { notificationsDeLAdresse } from '$lib/donnees/traitement-differe';
import { compteDe, journaliserUneConsultation } from '$lib/donnees/consultation';
import { attacherLOuverture, termeDeProvenance } from '$lib/donnees/recherches';
import { lireLHistoire, versionDemandee } from '$lib/donnees/histoire';
import {
	joursEcoules,
	lireLesChampsDUnTypeDeFiche,
	lireLesProprietesDeFiche,
	lireSeuils,
	lireSeuilsDeVivacite,
	type ContexteDeLecture
} from '$lib/donnees/lecture';
import { vivacite, type Vivacite } from '$lib/fraicheur';
import {
	basculesDUneNote,
	cycleDuRegistre,
	type BasculeDeVivacite,
	type LigneDeCycles
} from '$lib/donnees/vivacite';
import type { Identite } from '$lib/droits/resolution';
import { lireLaNote, registreDemande, type LectureDeNote, type Registre } from '$lib/donnees/note';
import type {
	EntreeDeSommaire,
	InstantAffiche,
	LectureAffichee
} from '$lib/lecture/note-de-demonstration';
import {
	ligneDeDerniereModification,
	type AdressesDeLecture,
	type ContexteDeLaNote,
	type EnteteDeLecture
} from '$lib/lecture/ecran';
import {
	extensionEtNom,
	tailleEnClair,
	type GroupeDeRelations,
	type NoteLiee,
	type PanneauxDeLaNote,
	type ProprieteDeFicheAffichee,
	type VoisineAffichee
} from '$lib/lecture/panneaux';
import { enregistrerLaNote, operationnelDesynchronise } from '$lib/donnees/edition';
import {
	deposerUnePieceJointe,
	NomDePieceDejaPris,
	NomDePieceVide,
	PieceTropVolumineuse,
	retirerUnePieceJointeParNom
} from '$lib/donnees/pieces';
import { racineDesFichiers } from '$lib/fichiers/entrepot';
import {
	adresseDeDomaine,
	adresseDeDossier,
	adresseDePieceJointe,
	adresseDesNotesDuDomaine,
	segmentsDeDossier
} from '$lib/rangement/adresses';
import { supprimerUneNote } from '$lib/donnees/suppression';
import {
	commentaireDeRevision,
	demanderUneRevision,
	leverLaDemandeDeRevision,
	verifierLaNote
} from '$lib/donnees/verification';
import { moteurPartage } from '$lib/recherche/acces';
import { lireLesCiblesPossibles, lireLesTypesOfferts } from '$lib/donnees/relations';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { Note, Version } from '../../../../seeds/corpus';

/**
 * Le type de média que la norme HTTP donne à des octets sans type déclaré. Il
 * n'est employé que lorsque le dépôt lui-même n'en annonce aucun — le produit
 * ne devine JAMAIS un type à partir d'un nom de fichier.
 */
const TYPE_DES_OCTETS_NON_TYPES = 'application/octet-stream';

/* POURQUOI LES REQUÊTES QUI SUIVENT SONT ICI, ET NON DANS `$lib/donnees/` : le
   regroupement dans un module de lecture reste à faire. C'est une dette dite,
   pas un choix d'architecture.

   AUCUNE DÉCISION D'ACCÈS N'EST PRISE ICI, et c'est la propriété qui compte
   (ADR-006). Toutes s'exécutent APRÈS la résolution : la note a déjà été jugée
   lisible. Les seules qui traversent le corpus — celles des relations — sont
   bornées aux identifiants que `lireLaNote()` a retenus, c'est-à-dire au
   périmètre qu'elle a calculé. Aucun second filtre, aucune seconde règle. */

/** La fenêtre de mesure que le gel annonce : « sur les 30 derniers jours ». */
const JOURS_DE_MESURE = 30;
const MILLISECONDES_PAR_JOUR = 86_400_000;

function instantAffiche(valeur: Date): InstantAffiche {
	return {
		iso: formaterDateIso(valeur),
		jour: formaterDateFr(valeur),
		heureDite: formaterDateHeureFr(valeur)
	};
}

/**
 * LE SOMMAIRE, RELEVÉ SUR LE DOCUMENT CANONIQUE : `construireSommaire()` du gel
 * relit le DOM rendu, ce qu'un composant Svelte ne peut pas faire. Seuls les
 * niveaux 2 et 3 l'alimentent.
 *
 * Écarter les titres SANS ANCRE vidait le sommaire de toute note écrite dans le
 * produit, l'éditeur n'en posant jamais. L'ancre est dérivée du texte au rendu,
 * ET LE CORPS CONSULTE LE MÊME RELEVÉ : les deux ne peuvent pas diverger.
 */
function sommaireDuDocument(valeur: unknown): readonly EntreeDeSommaire[] {
	return sommaireDe(analyserDocument(valeur));
}

/**
 * LE MÊME SOMMAIRE, SUR UN DOCUMENT DÉJÀ ANALYSÉ — le corps CAPTURÉ d'une
 * version antérieure. Une seule règle de sélection des titres, jamais deux.
 */
function sommaireDe(document: Document): readonly EntreeDeSommaire[] {
	const retenus: EntreeDeSommaire[] = [];
	for (const [titre, ancre] of ancresDuDocument(document)) {
		retenus.push({
			niveau: titre.attrs.level === 3 ? 3 : 2,
			ancre,
			libelle: (titre.content ?? []).map((t) => t.text).join('')
		});
	}
	return retenus;
}

/**
 * LES DEUX NOTES VOISINES DU PANNEAU « POSITION », DANS LE CORPUS QUE L'APPELANT
 * A LE DROIT DE LIRE : la fratrie est lue sur `lecture.notes`, déjà filtré par
 * le périmètre. Une voisine qu'on n'a pas le droit de lire n'est pas une
 * voisine, et son titre ne s'affiche pas (`RG-ACC-01`).
 */
function voisinesDe(lecture: LectureDeNote): readonly VoisineAffichee[] {
	const note = lecture.note;
	const fratrie = lecture.notes.filter(
		(n) => n.univers === note.univers && n.domaine === note.domaine && n.dossier === note.dossier
	);
	const rang = fratrie.findIndex((n) => n.id === note.id);
	if (rang < 0) return [];
	const decrire = (n: Note, sens: '←' | '→'): VoisineAffichee => ({
		identifiant: n.id,
		sens,
		titre: n.titre,
		fraicheur: n.fraicheur,
		jours: n.jours,
		/* SANS ELLE, UNE VOISINE JAMAIS VÉRIFIÉE LISAIT « il y a 3 mois ». Le
		   champ est celui de la note, jamais recomposé ici. */
		revise: n.revise
	});
	const retenues: VoisineAffichee[] = [];
	const avant = fratrie[rang - 1];
	const apres = fratrie[rang + 1];
	if (avant !== undefined) retenues.push(decrire(avant, '←'));
	if (apres !== undefined) retenues.push(decrire(apres, '→'));
	return retenues;
}

interface RelationLue extends NoteLiee {
	readonly libelle: string;
}

/**
 * LES RELATIONS, GROUPÉES PAR LIBELLÉ — sortantes d'abord, entrantes ensuite.
 * L'ORDRE DES GROUPES EST CELUI DU RÉFÉRENTIEL (`types_de_relation.ordre`),
 * puis celui du sens : les deux seuls ordres que la base porte.
 */
function grouperLesRelations(lues: readonly RelationLue[]): readonly GroupeDeRelations[] {
	const groupes = new Map<string, NoteLiee[]>();
	for (const r of lues) {
		const liee: NoteLiee = {
			identifiant: r.identifiant,
			titre: r.titre,
			type: r.type,
			domaine: r.domaine
		};
		const deja = groupes.get(r.libelle);
		if (deja === undefined) groupes.set(r.libelle, [liee]);
		else deja.push(liee);
	}
	return [...groupes].map(([libelle, notesDuGroupe]) => ({ libelle, notes: notesDuGroupe }));
}

/**
 * UNE PIÈCE JOINTE TELLE QUE LE CÂBLAGE EN A BESOIN — et non telle que l'écran
 * l'affiche : `PieceAffichee` porte un nom AMPUTÉ de son suffixe, dont aucune
 * adresse ne se reforme.
 *
 * Les deux formes coexistent dans le MÊME ORDRE, et c'est cet ordre qui les
 * apparie : la vue affiche `panneaux.pieces[i]`, le câblage adresse
 * `piecesJointes[i]`. Rien n'est recalculé à l'écran.
 */
export interface PieceJointeCablee {
	/** Le nom de FICHIER, tel que la base le porte. C'est la clé du retrait. */
	readonly nom: string;
	/** L'adresse des octets, composée par `adresseDePieceJointe()`. */
	readonly adresse: string;
	/**
	 * LE TYPE DE MÉDIA TEL QUE LA BASE LE PORTE — il décide si le panneau ouvre la
	 * pièce dans la visionneuse ou la laisse sortir. Il est passé plutôt que déduit
	 * du suffixe à l'écran : le suffixe est un nom, le type est ce que le dépôt a
	 * annoncé, et les deux se contredisent régulièrement.
	 */
	readonly typeMedia: string;
}

/**
 * LA VIVACITÉ DES DEUX REGISTRES — la fabrique à cinq états, servie par la base.
 *
 * `courante` est celle du registre AFFICHÉ : la ligne compacte, la carte de la
 * colonne contexte, la frise et le rappel en sortent tous, sans qu'aucune vue ne
 * recalcule quoi que ce soit (`P-01`, `ADR-005`).
 *
 * `operationnelle` est `null` quand la note n'a pas de registre Opérationnel —
 * l'état vide explicite : il n'y a pas de cycle, et l'écran répond par le geste
 * qui le débloque, « Créer la version opérationnelle ».
 */
interface VivaciteDeLaNote {
	readonly courante: Vivacite;
	readonly reference: Vivacite;
	readonly operationnelle: Vivacite | null;
	/**
	 * LES BASCULES AUTOMATIQUES DÉJÀ SURVENUES, des deux registres, la plus récente
	 * d'abord. Elles ne sont PAS stockées : `basculesDUneNote()` les dérive du couple
	 * (vérifiée, validité). L'historique les montre à côté des vérifications.
	 */
	readonly bascules: readonly BasculeDeVivacite[];
}

interface ComplementsDeLecture {
	readonly affichee: LectureAffichee;
	readonly panneaux: PanneauxDeLaNote;
	/** Les mêmes pièces que `panneaux.pieces`, dans le même ordre — voir ci-dessus. */
	readonly piecesJointes: readonly PieceJointeCablee[];
	readonly vivacite: VivaciteDeLaNote;
	/**
	 * LA DATE DE CRÉATION, EN TOUTES LETTRES — la première métadonnée de
	 * l'en-tête. La version, elle, se lit sur l'historique et `load()` la joint.
	 */
	readonly creeeLe: string;
	/** L'ancienneté de la dernière modification, en jours pleins. */
	readonly joursDepuisModification: number;
	/** La durée de validité du registre AFFICHÉ — la bulle du geste la cite. */
	readonly validiteCourante: number;
	/** La section « Contexte » de la colonne de droite. */
	readonly contexte: ContexteDeLaNote;
}

/**
 * LES PROPRIÉTÉS TYPÉES DE LA NOTE, DANS L'ORDRE DU RÉFÉRENTIEL. Une note qui
 * n'est pas une fiche ne paie rien : liste vide, aucune requête.
 *
 * N'APPELLE PAS `lireTypesDeFiche()`, ET C'EST DÉLIBÉRÉ : celle-là LÈVE sur une
 * valeur de `type_de_champ` que sa table ne couvre pas — quatre sur six —, et un
 * champ `date` posé n'importe où ferait tomber en 500 la lecture de TOUTE fiche
 * (`RG-NF-06`).
 *
 * L'ORDRE EST CELUI DU SCHÉMA, JAMAIS CELUI DE LA COLONNE : un objet JSON n'a pas
 * d'ordre contractuel. Un champ que le référentiel ne porte plus n'est pas rendu ;
 * un champ que la note ne renseigne pas est rendu VIDE, et le dit.
 */
async function proprietesDeLaFiche(
	base: Base,
	lecture: LectureDeNote
): Promise<readonly ProprieteDeFicheAffichee[]> {
	const typeFiche = lecture.note.typeFiche;
	if (typeFiche === undefined) return [];

	const [champs, valeursParNote] = await Promise.all([
		lireLesChampsDUnTypeDeFiche(base, typeFiche),
		lireLesProprietesDeFiche(base, [lecture.note.id])
	]);

	const valeurs = valeursParNote[lecture.note.id] ?? {};
	return champs.map((champ) => ({ nom: champ.nom, valeur: valeurs[champ.cle] ?? null }));
}

async function complementsDeLecture(
	base: Base,
	lecture: LectureDeNote,
	registre: Registre,
	corpsDuRegistreReference: string | null,
	corpsDuRegistreOperationnel: string | null,
	maintenant: Date
): Promise<ComplementsDeLecture> {
	const identifiant = lecture.note.id;

	/* La ligne brute de la note : les colonnes que la couche de lecture ne
	   projette pas, et le compte qui a demandé la révision.

	   LE COMPTEUR DE CONSULTATIONS EN FAIT PARTIE, ET C'EST LE POINT. `Note.vues`
	   a été projeté AVANT que l'ouverture courante ne soit comptée ; cette
	   requête-ci s'exécute APRÈS, et son total inclut l'ouverture qui l'affiche. */
	const [ligne] = await base
		.select({
			cle: notes.id,
			consultations: notes.compteurDeConsultations,
			creeLe: notes.creeLe,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			corpsReferenceModifieLe: notes.corpsReferenceModifieLe,
			corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
			/* LES QUATRE COLONNES DU CYCLE PAR REGISTRE — `014`. Elles ne sont lues
			   que pour être passées à `cycleDuRegistre()` : cette route n'en dérive
			   rien elle-même. */
			verifieLeOperationnel: notes.verifieLeOperationnel,
			validiteReference: notes.validiteReference,
			validiteOperationnel: notes.validiteOperationnel,
			revisionDemandee: notes.revisionDemandee,
			revisionCommentaire: notes.revisionCommentaire,
			revisionLe: notes.revisionLe,
			revisionRegistre: notes.revisionRegistre,
			revisionPar: comptes.nom,
			/* LES DEUX IDENTIFIANTS DE RANGEMENT — ils ne se dérivent PAS des noms :
			   un identifiant est fixé à la création et ne suit pas les renommages
			   (`RG-M12-11`). Sans eux, la colonne de contexte mènerait en 404 dès
			   qu'un domaine change de nom. */
			universIdentifiant: univers.identifiant,
			domaineIdentifiant: domaines.identifiant
		})
		.from(notes)
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.leftJoin(comptes, eq(notes.revisionParId, comptes.id))
		.where(eq(notes.identifiant, identifiant))
		.limit(1);

	/* La note a disparu entre sa résolution et cette lecture. Le refus est le
	   MÊME que partout dans cette famille (`RG-ACC-04`). */
	if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

	/* Le journal des vérifications — `M06.2`. Une entrée sans compte reste une
	   attestation : la colonne est effaçable, et `RG-M15-02` fait de l'anonymat un
	   état normal du journal. */
	const attestations = await base
		.select({ par: comptes.nom, le: verifications.le, registre: verifications.registre })
		.from(verifications)
		.leftJoin(comptes, eq(verifications.compteId, comptes.id))
		.where(eq(verifications.noteId, ligne.cle))
		.orderBy(desc(verifications.le));

	const lignesDePiece = await base
		.select({
			nom: piecesJointes.nom,
			tailleOctets: piecesJointes.tailleOctets,
			typeMedia: piecesJointes.typeMedia,
			deposeeLe: piecesJointes.deposeeLe
		})
		.from(piecesJointes)
		.where(eq(piecesJointes.noteId, ligne.cle))
		.orderBy(desc(piecesJointes.deposeeLe));

	/* LE PÉRIMÈTRE EST CELUI QUE `lireLaNote()` A CALCULÉ, et il entre dans la
	   requête (ADR-006) : une relation vers une note qu'on n'a pas le droit de
	   lire n'affiche pas son titre. */
	const lisibles = lecture.notes.map((n) => n.id);
	const sansRelation = lisibles.length === 0;

	const sortantes = sansRelation
		? []
		: await base
				.select({
					libelle: typesDeRelation.libelleSortant,
					identifiant: notes.identifiant,
					titre: notes.titre,
					type: typesDeNote.nom,
					domaine: domaines.nom
				})
				.from(relations)
				.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
				.innerJoin(notes, eq(relations.cibleId, notes.id))
				.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
				.innerJoin(domaines, eq(notes.domaineId, domaines.id))
				.where(and(eq(relations.sourceId, ligne.cle), inArray(notes.identifiant, lisibles)))
				.orderBy(typesDeRelation.ordre, notes.titre);

	const entrantes = sansRelation
		? []
		: await base
				.select({
					libelle: typesDeRelation.libelleEntrant,
					identifiant: notes.identifiant,
					titre: notes.titre,
					type: typesDeNote.nom,
					domaine: domaines.nom
				})
				.from(relations)
				.innerJoin(typesDeRelation, eq(relations.typeDeRelationId, typesDeRelation.id))
				.innerJoin(notes, eq(relations.sourceId, notes.id))
				.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
				.innerJoin(domaines, eq(notes.domaineId, domaines.id))
				.where(and(eq(relations.cibleId, ligne.cle), inArray(notes.identifiant, lisibles)))
				.orderBy(typesDeRelation.ordre, notes.titre);

	/* LA MESURE DE CONSULTATION VIENT DU JOURNAL, sur la fenêtre de trente jours
	   que le gel annonce. `MESURES_7J` de la semence nomme « 7 j » la même
	   donnée : la contradiction se tranche ici en lisant la table. */
	const depuis = new Date(maintenant.getTime() - JOURS_DE_MESURE * MILLISECONDES_PAR_JOUR);
	const [mesure] = await base
		.select({ nombre: sql<number>`count(*)::int` })
		.from(consultations)
		.where(and(eq(consultations.noteId, ligne.cle), gte(consultations.le, depuis)));

	const proprietesDeFiche = await proprietesDeLaFiche(base, lecture);

	const domaineParNote = new Map<string, string>(lecture.notes.map((n) => [n.id, n.domaine]));

	/* LE DERNIER VÉRIFICATEUR DE CHAQUE REGISTRE — les attestations sont déjà triées
	   de la plus récente à la plus ancienne, la PREMIÈRE de chaque registre est donc
	   la bonne. Un `find` sur une liste triée, pas une seconde requête. */
	const dernierVerificateur = (registreVoulu: Registre): string | null =>
		attestations.find((a) => a.registre === registreVoulu)?.par ?? null;

	/* LA LIGNE DE CYCLES — l'unique forme d'entrée de `cycleDuRegistre()`. Aucune
	   propriété n'est calculée ici : la route PROJETTE, le producteur DÉCIDE. */
	const ligneDeCycles: LigneDeCycles = {
		modifieLe: ligne.modifieLe,
		corpsOperationnelModifieLe: ligne.corpsOperationnelModifieLe,
		verifieLe: ligne.verifieLe,
		verifieLeOperationnel: ligne.verifieLeOperationnel,
		validiteReference: ligne.validiteReference,
		validiteOperationnel: ligne.validiteOperationnel,
		revisionDemandee: ligne.revisionDemandee,
		revisionRegistre: ligne.revisionRegistre,
		revisionPar: ligne.revisionPar,
		verifieParReference: dernierVerificateur('reference'),
		verifieParOperationnel: dernierVerificateur('operationnel')
	};

	const seuilsDeVivacite = await lireSeuilsDeVivacite(base);
	/* LA RÉFÉRENCE EXISTE TOUJOURS (`RG-NOT-02`) : son cycle n'est jamais nul, et le
	   repli n'est là que parce que le type est commun aux deux registres. */
	const cycleDeReference = cycleDuRegistre(ligneDeCycles, 'reference');
	const cycleOperationnel = cycleDuRegistre(ligneDeCycles, 'operationnel');
	const vivaciteDeReference = vivacite(
		cycleDeReference ?? {
			verifiee: ligne.verifieLe,
			modifiee: ligne.modifieLe,
			validite: ligne.validiteReference
		},
		maintenant,
		seuilsDeVivacite
	);
	const vivaciteOperationnelle =
		cycleOperationnel === null ? null : vivacite(cycleOperationnel, maintenant, seuilsDeVivacite);

	/* `RG-M06-01` — la fraîcheur se lit sur la dernière vérification, et à défaut
	   sur la dernière modification. L'ANCIENNETÉ SERVIE AU LIBELLÉ EST CELLE-LÀ,
	   la même que celle sur laquelle le niveau a été résolu : deux sources
	   donneraient deux âges pour un seul signal (P-01). */
	const referenceDeFraicheur = ligne.verifieLe ?? ligne.modifieLe;

	return {
		affichee: {
			note: lecture.note,
			reference: corpsDuRegistreReference,
			operationnel:
				registre === 'operationnel' && lecture.corps.redige
					? lecture.corps.html
					: corpsDuRegistreOperationnel,
			/* LE SOMMAIRE SUIT LE REGISTRE AFFICHÉ. Il était toujours celui de la
			   Référence : sur l'Opérationnel, ses ancres visaient des titres absents
			   de la page, et le sommaire annonçait un plan que le corps ne tenait
			   pas. Le registre sans corps n'a pas de titre, donc pas de sommaire. */
			sommaire: sommaireDuDocument(
				registre === 'operationnel' ? ligne.corpsOperationnel : ligne.corpsReference
			),
			controle:
				ligne.verifieLe === null
					? null
					: { par: attestations[0]?.par ?? null, quand: instantAffiche(ligne.verifieLe) },
			joursDepuisControle: joursEcoules(referenceDeFraicheur, maintenant),
			modifiee: instantAffiche(ligne.modifieLe),
			referenceModifiee: instantAffiche(ligne.corpsReferenceModifieLe),
			/* `RG-NOT-02` — rien à resynchroniser sans version opérationnelle. La
			   comparaison porte sur les deux dates de CORPS, et non sur `modifieLe`,
			   qu'un simple renommage fait bouger. `RG-M06-08` a une seule définition,
			   et c'est `operationnelDesynchronise()` : le prédicat recopié en ligne
			   faisait calculer le même signal à deux endroits (`P-01`). */
			resync: operationnelDesynchronise({
				referenceModifieLe: ligne.corpsReferenceModifieLe,
				operationnelModifieLe: ligne.corpsOperationnelModifieLe
			}),
			revision:
				ligne.revisionDemandee && ligne.revisionLe !== null
					? {
							par: ligne.revisionPar,
							le: formaterDateFr(ligne.revisionLe),
							commentaire: ligne.revisionCommentaire
						}
					: null,
			consultations30j: mesure?.nombre ?? 0,
			/* LU APRÈS `journaliserUneConsultation()` : `lecture.note.vues` a été
			   projeté avant l'écriture, la fenêtre de trente jours est comptée après,
			   et les afficher côte à côte donnait un total inférieur à sa fenêtre. */
			consultationsTotal: ligne.consultations
		},
		panneaux: {
			proprietes: proprietesDeFiche,
			voisines: voisinesDe(lecture),
			pieces: lignesDePiece.map((pj) => {
				const { extension, nom } = extensionEtNom(pj.nom, pj.typeMedia);
				return {
					nom,
					extension,
					taille: tailleEnClair(pj.tailleOctets),
					depose: `déposé le ${formaterDateFr(pj.deposeeLe)}`,
					/* L'ADRESSE PREND LE NOM DE FICHIER, JAMAIS LE NOM AFFICHÉ :
					   celui-ci est amputé de son suffixe juste au-dessus. Le lien est
					   ainsi juste AU RENDU, sans attendre l'hydratation. */
					adresse: adresseDePieceJointe(lecture.note.id, pj.nom)
				};
			}),
			relations: grouperLesRelations([...sortantes, ...entrantes]),
			retroliens: lecture.retroliens.map((r) => ({
				identifiant: r.identifiant,
				titre: r.titre,
				domaine: domaineParNote.get(r.identifiant) ?? ''
			})),
			verifications: attestations.map((a) => ({
				par: a.par,
				iso: formaterDateIso(a.le),
				jour: formaterDateFr(a.le)
			}))
		},
		/* LA MÊME LISTE, DANS LE MÊME ORDRE — `lignesDePiece` est parcourue deux
		   fois de suite, jamais retriée entre les deux. L'appariement par indice
		   n'est pas une convention d'écran : c'est le même tableau. */
		piecesJointes: lignesDePiece.map((pj) => ({
			nom: pj.nom,
			adresse: adresseDePieceJointe(lecture.note.id, pj.nom),
			typeMedia: pj.typeMedia
		})),
		vivacite: {
			/* Le registre AFFICHÉ commande : bascule sur Opérationnel, et TOUT ce qui
			   parle de vivacité parle de l'Opérationnel. Sans registre opérationnel,
			   il n'y a rien à afficher d'autre que la Référence. */
			courante:
				registre === 'operationnel' && vivaciteOperationnelle !== null
					? vivaciteOperationnelle
					: vivaciteDeReference,
			reference: vivaciteDeReference,
			operationnelle: vivaciteOperationnelle,
			bascules: basculesDUneNote(ligneDeCycles, maintenant, seuilsDeVivacite)
		},
		creeeLe: formaterDateFr(ligne.creeLe),
		validiteCourante:
			registre === 'operationnel' ? ligne.validiteOperationnel : ligne.validiteReference,
		joursDepuisModification: joursEcoules(ligne.modifieLe, maintenant),
		contexte: contexteDeLaNote(lecture, ligne.universIdentifiant, ligne.domaineIdentifiant)
	};
}

/**
 * LA SECTION « CONTEXTE » DE LA COLONNE DE DROITE — l'univers, le conteneur
 * direct de la note, et ce qu'il y a d'autre à lire à côté.
 *
 * LE VOISINAGE EST COMPTÉ SUR LE CORPUS LISIBLE, jamais sur la table : une note
 * qu'on n'a pas le droit de lire n'est pas une voisine, et la compter dirait à
 * un lecteur qu'il existe des notes qu'il ne verra pas (`RG-ACC-01`). À zéro,
 * la ligne n'est pas rendue : un lien vers une liste vide est un geste promis
 * pour rien.
 */
function contexteDeLaNote(
	lecture: LectureDeNote,
	universIdentifiant: string,
	domaineIdentifiant: string
): ContexteDeLaNote {
	const note = lecture.note;
	const segments = segmentsDeDossier(note.dossier);
	const dansUnDossier = segments.length > 0;

	const voisines = lecture.notes.filter(
		(n) =>
			n.id !== note.id &&
			n.univers === note.univers &&
			n.domaine === note.domaine &&
			(dansUnDossier ? n.dossier === note.dossier : true)
	).length;

	const ou = dansUnDossier ? 'ce dossier' : 'ce domaine';
	return {
		univers: note.univers,
		rangement: {
			libelle: dansUnDossier ? (segments.at(-1) ?? note.domaine) : note.domaine,
			adresse: dansUnDossier
				? adresseDeDossier(universIdentifiant, domaineIdentifiant, segments)
				: adresseDeDomaine(universIdentifiant, domaineIdentifiant)
		},
		voisinage:
			voisines === 0
				? null
				: {
						libelle: `${voisines} ${voisines > 1 ? 'autres notes' : 'autre note'} dans ${ou}`,
						adresse: adresseDesNotesDuDomaine(universIdentifiant, domaineIdentifiant)
					}
	};
}

export const load: PageServerLoad = async ({ params, url, locals, request }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const contexte = { maintenant, seuils: await lireSeuils(base) };
	const registre = registreDemande(url.searchParams.get('registre'));

	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre,
		identite: locals.identite,
		contexte
	});

	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);
	const lecture = resolution.ressource;

	/* LA CONSULTATION SE COMPTE ET SE JOURNALISE — `RG-M04-09`.

	   APRÈS LA RÉSOLUTION, ET JAMAIS AVANT. `RG-ACC-04` veut que refus et
	   inexistence rendent la même réponse : les deux sortent par le `error()`
	   ci-dessus et n'atteignent jamais cette écriture, donc une note interdite
	   coûte exactement ce que coûte une note absente, y compris en temps. Écrire
	   avant la résolution ferait payer au refus un aller-retour que l'inexistence
	   ne paie pas (`ARB-005`). Et une lecture REFUSÉE n'est pas une ouverture.

	   L'INSTANT EST CELUI DE LA REQUÊTE, pris plus haut et pris une fois : la
	   fraîcheur a été résolue dessus.

	   ET C'EST UNE ÉCRITURE SUR UNE REQUÊTE DE LECTURE, au regard d'`ARB-054` §4
	   qui réserve l'écriture en GET à `/deconnexion`. Non contournable : « toute
	   OUVERTURE d'une note » désigne cette requête-ci. */
	await journaliserUneConsultation(base, {
		identifiant: params.identifiant,
		compte: compteDe(locals.identite),
		maintenant
	});

	/* L'OUVERTURE ÉVENTUELLE D'UN RÉSULTAT DE RECHERCHE — le quatrième membre de
	   `RG-M02-03`, et le seul qui ne se constate pas au moment de la recherche.
	   La provenance est l'adresse d'où vient la requête ; hors `/recherche` de
	   cette instance, rien n'est attaché. C'est ce qui donne son numérateur au
	   « taux de recherche aboutie » de V-34. */
	const terme = termeDeProvenance(request.headers.get('referer'), url);
	if (terme !== null) {
		await attacherLOuverture(base, {
			terme,
			compte: compteDe(locals.identite),
			identifiant: params.identifiant,
			maintenant
		});
	}

	/* L'HISTORIQUE. V-15 N'A PAS DE CHEMIN PROPRE : elle est « superposée » à
	   cette adresse, et son état adressable est `?version={n}`, lu ici.

	   L'ACCÈS EST DÉJÀ DÉCIDÉ : `lireLHistoire()` prend la lecture RÉSOLUE
	   ci-dessus, jamais un identifiant nu — il n'existe pas deux décisions
	   d'accès à cette adresse. */
	/* L'HISTORIQUE SERT ENCORE DEUX CHOSES ICI : le NUMÉRO de la dernière version,
	   que l'en-tête affiche, et le NOMBRE de versions, que la confirmation de
	   suppression chiffre (`RG-M04-10`). Aucune version n'est DÉSIGNÉE : le fil et
	   la comparaison ont leur page, `/notes/{identifiant}/historique`. */
	const histoire = await lireLHistoire(base, lecture, maintenant, null);

	/* LE CORPS QUE L'ÉCRAN AFFICHE EST CELUI DU REGISTRE RÉFÉRENCE : le gel rend
	   les deux enveloppes et cache la seconde, et la bascule est un COMPORTEMENT
	   non livré. Le volet visible est donc toujours `corps-reference`, quel que
	   soit `?registre=`.

	   D'OÙ CETTE SECONDE RÉSOLUTION, ET SEULEMENT DANS CE SENS-LÀ. Elle passe par
	   `lireLaNote()`, donc par la MÊME décision d'accès — jamais par une requête
	   écrite ici. Le chemin ordinaire n'en paie pas le coût.

	   UN CORPS EXISTANT MAIS VIDE REND `null`, et la vue le DIT : `corpsRendu()`
	   sépare `existe` de `redige` (`RG-M18-03`). */
	const corpsDeReference =
		registre === 'reference'
			? lecture.corps.redige
				? lecture.corps.html
				: null
			: await corpsCharge(base, params.identifiant, 'reference', locals.identite, contexte);

	/* LES DEUX CORPS SONT SERVIS ENSEMBLE, PARCE QUE LA BASCULE NE RECHARGE PAS :
	   le script du gel échange l'attribut « sans rechargement ». Sans le second
	   corps, l'onglet « Opérationnel » ouvrait un volet vide.

	   LE COÛT EST BORNÉ AU CAS QUI L'EXERCE : la seconde lecture n'a lieu que si
	   la note PORTE un registre Opérationnel — la condition même sous laquelle
	   les deux onglets sont rendus.

	   ELLE PASSE PAR `lireLaNote()`, donc par la MÊME décision d'accès. Un refus
	   rend un volet vide, jamais un aveu. */
	const corpsOperationnel =
		registre === 'reference' && lecture.note.operationnel
			? await corpsCharge(base, params.identifiant, 'operationnel', locals.identite, contexte)
			: null;

	const complements = await complementsDeLecture(
		base,
		lecture,
		registre,
		corpsDeReference,
		corpsOperationnel,
		maintenant
	);

	return {
		/**
		 * `RG-NF-03` — CE QUI N'EST PAS ENCORE FAIT AU MOMENT OÙ CETTE PAGE S'AFFICHE.
		 * L'enregistrement d'une note SOUMET son indexation au moteur sans l'attendre
		 * (`ARB-060`) : la note est lisible, elle n'est pas encore trouvable. La liste
		 * est VIDE sur une ouverture ordinaire — seule la redirection qui suit un
		 * enregistrement porte le drapeau.
		 */
		notifications: notificationsDeLAdresse(url.searchParams),
		/**
		 * LE VECTEUR D'ÉTAT DE V-14 ne porte que ce qui est VRAI de cet appelant-ci :
		 * ses droits. Les six autres leviers décrivent LA NOTE AFFICHÉE et passent par
		 * `affichee` — les piloter d'ici peindrait les attributs d'une note sur le
		 * corps d'une autre (`P-02`). `droits` vient de `capacites()` et décide de
		 * l'ÉMISSION des actions d'écriture (P-09, ARB-040).
		 */
		vecteur: { droits: lecture.capacites.ecrireDesNotes ? 'ecriture' : 'lecture' },
		notes: lecture.notes,
		/**
		 * LA NOTE RÉELLE, SON CORPS ET SES RÉTROLIENS — ce dont le CÂBLAGE a besoin, et
		 * qui n'est pas de l'affichage. CE QUE L'ÉCRAN MONTRE PASSE PAR `affichee` ET
		 * `panneaux` : il n'existe pas deux chemins par lesquels la note atteint la vue.
		 */
		lecture: {
			note: lecture.note,
			registre,
			corps: lecture.corps,
			retroliens: lecture.retroliens
		},
		/**
		 * L’HISTORIQUE RÉEL DE LA NOTE, reçu par `src/vues/V-15`, montée dès que
		 * l’adresse porte `?version`.
		 *
		 * DE `affichee`, LA VUE NE LIT QUE `numero` : les trois autres champs sont des
		 * DOCUMENTS qu'elle ne sait pas rendre, et ils atteignent l’écran par
		 * `afficheeDeLaVersion` (`ADR-004`).
		 */
		histoire,
		/**
		 * LA NOTE TELLE QU'ELLE S'AFFICHE — l'identité, le corps rendu, le sommaire,
		 * le dernier contrôle, les dates, la révision courante et la mesure de
		 * consultation.
		 */
		affichee: complements.affichee,
		panneaux: complements.panneaux,
		/**
		 * L'EN-TÊTE — création, version, dernière modification. La version est le
		 * NUMÉRO de la dernière capturée, jamais un compte de versions : les deux
		 * divergent dès qu'une purge de rétention passe (`M14.7`). Aucune version
		 * capturée : `null`, et l'écran le dit.
		 */
		entete: enteteDeLecture(
			complements.creeeLe,
			complements.joursDepuisModification,
			histoire.versions,
			lecture.note.auteur
		),
		/** L'univers, le conteneur direct de la note, et son voisinage lisible. */
		contexte: complements.contexte,
		/**
		 * LES ADRESSES DES GESTES, COMPOSÉES ICI. La vue n'écrit aucun gabarit
		 * d'adresse : un gabarit écrit à l'écran devient un lien mort au premier
		 * renommage, et rien ne le signale.
		 */
		adresses: adressesDeLecture(params.identifiant),
		/**
		 * CE QUE LE GESTE QUI VIENT D'AVOIR LIEU ANNONCE. Les trois gestes de
		 * vivacité finissent par un `303` — une redirection ne transporte que son
		 * adresse —, et le paramètre est LU PUIS OUBLIÉ : il ne change ni le rendu
		 * de la note, ni ce que le chargeur va chercher.
		 */
		annonce: annonceDuGeste(url.searchParams.get(PARAMETRE_DU_GESTE), complements.validiteCourante),
		/**
		 * LES PIÈCES, SOUS LA FORME QUE LE CÂBLAGE ADRESSE. Le gel les pose en `a.pj`
		 * avec un `href="#"` : sans cette liste, aucun lien ne mène nulle part.
		 */
		piecesJointes: complements.piecesJointes,
		/**
		 * LA VIVACITÉ DES DEUX REGISTRES — tout ce que l'écran dit de l'état, de
		 * l'échéance, de la frise et du rappel automatique sort d'ici. Une vue qui
		 * recalculerait un seul de ces champs rouvrirait la divergence que la fabrique
		 * unique ferme.
		 */
		vivacite: complements.vivacite,
		/**
		 * DE QUOI DÉCLARER UNE RELATION SANS QUITTER LA NOTE — le dialogue
		 * `d-relation`, que le gel place dans le panneau « Relations » de V-14.
		 *
		 * `P-09` — LES MOYENS D'ÉCRIRE NE SONT PRÉPARÉS QUE POUR QUI PEUT ÉCRIRE.
		 * `null` sinon : ni bouton, ni boîte, ni sélecteur n'entrent dans le DOM.
		 *
		 * LES CIBLES SONT CELLES SUR LESQUELLES L'APPELANT PEUT ÉCRIRE (`RG-M08-04`,
		 * les deux extrémités) : une note qu'il ne pourrait pas relier n'est pas
		 * proposée, plutôt que refusée après le clic.
		 *
		 * DEUX LISTES VIDES NE RENDENT PAS CETTE PROPRIÉTÉ NULLE, ET C'EST VOULU :
		 * servir `null` sur une instance neuve laisserait « + Ajouter » n'ouvrir plus
		 * rien. La boîte est montée et nomme elle-même ce qui manque. `null` reste
		 * réservé à l'absence de droit.
		 */
		relation: lecture.capacites.ecrireDesNotes
			? {
					types: await lireLesTypesOfferts(base),
					cibles: await lireLesCiblesPossibles(
						base,
						locals.identite,
						params.identifiant,
						lecture.notes.map((n) => n.id)
					)
				}
			: null
	};
};

/**
 * L'AUTRE CORPS DE LA NOTE, RÉSOLU UNE SECONDE FOIS — et par le même chemin :
 * l'adresse nomme un registre, l'écran a besoin des DEUX.
 *
 * Passer par `lireLaNote()` plutôt que par une requête écrite ici garantit qu'il
 * n'existe pas deux décisions d'accès à cette adresse : un refus rend
 * `INTROUVABLE`, et le volet reste vide plutôt que de trahir quoi que ce soit.
 */
async function corpsCharge(
	base: Base,
	identifiant: string,
	registre: Registre,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<string | null> {
	const autre = await lireLaNote(base, { identifiant, registre, identite, contexte });
	if (!autre.trouve || !autre.ressource.corps.redige) return null;
	return autre.ressource.corps.html;
}

/**
 * LE CONTEXTE D'UN GESTE — l'instant est pris UNE FOIS par requête, et il sert
 * à la fois de seuil de lecture et de date d'attestation. Deux appels d'horloge
 * dateraient la vérification après l'état sur lequel la fraîcheur a été résolue.
 */
async function contexteDUnGeste() {
	const base = basePartagee();
	const maintenant = new Date();
	return { base, maintenant, contexte: { maintenant, seuils: await lireSeuils(base) } };
}

/**
 * L'ADRESSE OÙ LES QUATRE ÉCRITURES RAMÈNENT — la note elle-même, sans le `?/action`.
 *
 * `verifier`, `signaler`, `lever` et `restaurer` sont soumises NATIVEMENT
 * (`+page.svelte` pose un bouton et appelle `requestSubmit()`) : une action qui rend
 * une valeur laisse l'adresse à `/notes/{id}?/signaler`, et un rafraîchissement
 * REJOUE l'écriture. Le `303` referme cela — et les valeurs rendues n'étaient lues
 * par personne, aucune propriété `form` n'existant sur cette page.
 */
function adresseDeLaNote(identifiant: string, registre: Registre, fait?: string): string {
	/* LE REGISTRE SURVIT AU GESTE. Sans lui, vérifier l'Opérationnel ramenait sur la
	   Référence, et l'onglet que l'utilisateur venait d'attester disparaissait sous
	   ses yeux. `reference` est le défaut de l'adresse : elle n'a rien à porter.

	   `fait` PORTE LA BULLE. Une redirection ne transporte que son adresse : sans ce
	   paramètre, aucun geste ne pourrait dire ce qu'il vient de faire. */
	const parametres = new URLSearchParams();
	if (registre === 'operationnel') parametres.set('registre', registre);
	if (fait !== undefined) parametres.set(PARAMETRE_DU_GESTE, fait);
	const requete = parametres.toString();
	return requete === '' ? `/notes/${identifiant}` : `/notes/${identifiant}?${requete}`;
}

/** La planche des cinq états — le lien discret du pied de note (V-42). */
const ADRESSE_DE_LA_PLANCHE = '/bibliotheque/vivacite';

/**
 * LES ADRESSES DES GESTES DE LA LECTURE. Toutes partent de l'identifiant lisible
 * de la note, et aucune n'est écrite dans la vue : le jour où l'une change, elle
 * change ici.
 */
function adressesDeLecture(identifiant: string): AdressesDeLecture {
	const note = `/notes/${identifiant}`;
	return {
		reference: note,
		operationnel: `${note}?registre=operationnel`,
		modifier: `${note}/modifier`,
		modifierLOperationnel: `${note}/operationnel`,
		historique: `${note}/historique`,
		relations: `${note}/relations`,
		planche: ADRESSE_DE_LA_PLANCHE
	};
}

/** L'en-tête de la note — création, version capturée, dernière modification. */
function enteteDeLecture(
	creeeLe: string,
	joursDepuisModification: number,
	versionsCapturees: readonly Version[],
	auteur: string
): EnteteDeLecture {
	const derniere = versionsCapturees[0];
	return {
		creeeLe,
		version: derniere === undefined ? null : `v${derniere.n}`,
		/* QUI A MODIFIÉ EN DERNIER : l'auteur de la dernière version capturée. La
		   table `notes` ne porte pas de « modifié par » ; à défaut de version, la
		   note reste attribuée à son auteur, qui est ce qu'on sait d'elle. */
		derniereModification: ligneDeDerniereModification(
			joursDepuisModification,
			derniere?.date ?? creeeLe,
			derniere?.auteur ?? auteur
		)
	};
}

/**
 * LE PARAMÈTRE QUI PORTE LE GESTE ACCOMPLI, et les quatre phrases du prototype.
 * Une valeur inconnue ne rend rien : une adresse forgée ne fabrique pas une
 * annonce.
 */
const PARAMETRE_DU_GESTE = 'fait';

function annonceDuGeste(fait: string | null, validite: number): string | null {
	switch (fait) {
		case 'verifiee':
			return `Vérifiée à l'instant — le cycle repart pour ${validite} ${validite > 1 ? 'jours' : 'jour'}`;
		case 'signalee':
			return 'Révision demandée — la note passe à « À revoir »';
		case 'levee':
			return 'Demande de révision levée';
		case 'operationnel':
			return 'Version opérationnelle créée — son propre cycle de vivacité démarre';
		default:
			return null;
	}
}

/**
 * LE REGISTRE QUE LE GESTE VISE — le champ que le câblage joint à la soumission.
 *
 * L'adresse d'une action est `?/verifier` : elle REMPLACE la chaîne de requête de la
 * page, et `?registre=operationnel` n'y survit pas. Le registre voyage donc dans le
 * formulaire, comme le commentaire de révision. Absent, c'est la Référence —
 * `registreDemande()` en décide, et il en décide seul.
 */
function registreDuGeste(formulaire: FormData): Registre {
	const soumis = formulaire.get('registre');
	return registreDemande(typeof soumis === 'string' ? soumis : null);
}

export const actions: Actions = {
	/** VÉRIFIER — `UC-M06-02`. Un clic, aucun champ : rien à valider avant d'écrire. */
	verifier: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const registre = registreDuGeste(await request.formData());
		/* SEUL CE GESTE ENTRETIENT L'INDEX DES TROIS — il écrit une date de
		   vérification, champ projeté et triable. Signaler et lever n'écrivent que les
		   colonnes de révision, qu'aucune entrée d'index ne porte. */
		const fait = await verifierLaNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			registre,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant, registre, 'verifiee'));
	},

	/**
	 * SIGNALER À RÉVISER — `UC-M06-03`, « en expliquant pourquoi ». Le commentaire
	 * est la seule donnée du geste, et son absence le refuse.
	 */
	signaler: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const formulaire = await request.formData();
		const registre = registreDuGeste(formulaire);
		const commentaire = commentaireDeRevision(formulaire.get('commentaire'));

		if (commentaire === null) {
			/* LE DROIT EST RÉSOLU AVANT QU'ON SE PLAIGNE DE LA FORME : distinguer
			   « explication manquante » de « adresse inconnue » révélerait l'existence
			   de la note à qui n'y a pas droit. La levée sert de sonde d'accès — même
			   régime, effet neutre quand aucune demande n'est courante. */
			const acces = await leverLaDemandeDeRevision(base, {
				identifiant: params.identifiant,
				registre,
				identite: locals.identite,
				contexte,
				maintenant
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
			return fail(400, { motif: 'aucune explication fournie' });
		}

		const fait = await demanderUneRevision(base, {
			identifiant: params.identifiant,
			registre,
			identite: locals.identite,
			contexte,
			maintenant,
			commentaire
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant, registre, 'signalee'));
	},

	/**
	 * RESTAURER UNE VERSION — `UC-M07-04`. Son déclencheur vit dans V-15, qui est une
	 * SUPERPOSITION de cette adresse.
	 *
	 * Restaurer n'efface rien : c'est un ENREGISTREMENT du corps ancien, qui capture
	 * donc sa propre version (`RG-M07-02`).
	 */
	restaurer: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const resolution = await lireLaNote(base, {
			identifiant: params.identifiant,
			registre: 'reference',
			identite: locals.identite,
			contexte
		});
		if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);

		const soumis = (await request.formData()).get('version');
		const numero = versionDemandee(typeof soumis === 'string' ? soumis : null);
		const histoire = await lireLHistoire(base, resolution.ressource, maintenant, numero);
		if (histoire.affichee === null)
			return fail(400, { motif: 'aucune version ne porte ce numéro' });

		const issue = await enregistrerLaNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			registre: 'reference',
			identite: locals.identite,
			contexte,
			maintenant,
			modification: { corps: { saisi: histoire.affichee.reference } }
		});
		if (!issue.trouve) error(404, MESSAGE_INTROUVABLE);
		/* La restauration porte sur la RÉFÉRENCE — les versions ne capturent qu'elle —,
		   et l'adresse de retour dit le même registre que le geste. */
		redirect(303, adresseDeLaNote(params.identifiant, 'reference'));
	},

	/**
	 * LEVER LA DEMANDE — `M06.3`. Elle n'atteste rien : la note ne repasse pas au
	 * vert. Confondre les deux serait confondre « cette demande n'a plus lieu
	 * d'être » et « ce contenu est d'actualité ».
	 */
	lever: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const registre = registreDuGeste(await request.formData());
		const fait = await leverLaDemandeDeRevision(base, {
			identifiant: params.identifiant,
			registre,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant, registre, 'levee'));
	},

	/**
	 * SUPPRIMER — `RG-M04-10`, `RG-M07-04`, `RG-M14-03`, `RG-M14-05`.
	 *
	 * AUCUN CHAMP N'EST LU : `RG-M04-10` demande une CONFIRMATION — un fait d'écran
	 * —, pas une saisie du nom exact, réservée aux dossiers et aux domaines.
	 *
	 * LE REFUS EST LE MÊME `404` QUE PARTOUT DANS CETTE FAMILLE : le droit est résolu
	 * AVANT toute destruction, par `resoudreLEditionDUneNote()` — la même décision
	 * que l'éditeur, jamais recopiée (`RG-ACC-04`).
	 *
	 * ET LA RÉPONSE EST UN `303` VERS LE DOMAINE, jamais vers la note : celle-ci
	 * n'existe plus, et un 404 serait une confirmation par l'absurde. L'adresse
	 * remonte du module de suppression, qui l'a calculée AVANT de détruire.
	 * `redirect()` LÈVE : tout ce qui suivrait l'appel serait mort.
	 */
	supprimer: async ({ params, locals }) => {
		const { base, contexte } = await contexteDUnGeste();
		const fait = await supprimerUneNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, fait.ressource.adresseDeRetour);
	},

	/**
	 * DÉPOSER UNE PIÈCE JOINTE — `M04.7`. L'action est ici parce que la note qui
	 * reçoit la pièce est celle qu'on lit et que `docs/routes.md` est un inventaire
	 * FERMÉ.
	 *
	 * TROIS REFUS SONT RENDUS `400`, ET UN SEUL `404` : les trois premiers — plafond
	 * dépassé, homonyme, nom vide — sont ADRESSÉS à quelqu'un dont le droit d'écrire
	 * a DÉJÀ été résolu, et les nommer ne révèle rien. Le `404` est le refus
	 * indiscernable d'`ADR-007`.
	 *
	 * AUCUNE TAILLE N'EST CONTRÔLÉE ICI : le plafond est celui de la console, lu en
	 * base à chaque dépôt ; le redire ici en ferait une seconde définition (`P-01`).
	 */
	deposerPiece: async ({ params, locals, request }) => {
		const depose = (await request.formData()).get('fichier');
		if (!(depose instanceof File) || depose.size === 0) {
			return fail(400, { motif: 'aucun fichier déposé' });
		}
		const octets = new Uint8Array(await depose.arrayBuffer());
		try {
			const fait = await deposerUnePieceJointe(basePartagee(), racineDesFichiers(env), {
				note: params.identifiant,
				nom: depose.name,
				/* LE TYPE VIENT DU DÉPÔT, ET SON ABSENCE A UNE VALEUR NORMALISÉE. Un
				   navigateur qui ne reconnaît pas un fichier rend une chaîne vide ;
				   `application/octet-stream` est le type que la norme HTTP donne à des
				   octets non typés, pas une devinette. Rien n'est inféré du suffixe. */
				typeMedia: depose.type === '' ? TYPE_DES_OCTETS_NON_TYPES : depose.type,
				octets,
				identite: locals.identite
			});
			if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
			return { pieceDeposee: fait.ressource.nom };
		} catch (cause) {
			if (
				cause instanceof PieceTropVolumineuse ||
				cause instanceof NomDePieceDejaPris ||
				cause instanceof NomDePieceVide
			) {
				return fail(400, { motif: cause.message });
			}
			throw cause;
		}
	},

	/**
	 * RETIRER UNE PIÈCE JOINTE — désigné par le NOM du fichier, la seule clé
	 * qu'une adresse porte.
	 *
	 * LE REFUS EST UNIQUE ET IL EST `404`, pour les trois causes que
	 * `retirerUnePieceJointeParNom()` confond : note inexistante, note sur
	 * laquelle l'appelant n'écrit pas, pièce inexistante.
	 */
	retirerPiece: async ({ params, locals, request }) => {
		/* LE CHAMP NE S'APPELLE PAS `fichier` : le champ de DÉPÔT porte déjà ce nom,
		   dans le même formulaire, et deux champs homonymes rendent le premier dans
		   l'ordre du document. Voir `+page.svelte`. */
		const soumis = (await request.formData()).get('piece');
		if (typeof soumis !== 'string' || soumis.trim() === '') {
			return fail(400, { motif: 'aucune pièce jointe désignée' });
		}
		const fait = await retirerUnePieceJointeParNom(basePartagee(), racineDesFichiers(env), {
			note: params.identifiant,
			nom: soumis,
			identite: locals.identite
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return { pieceRetiree: fait.ressource.nom };
	}
};
