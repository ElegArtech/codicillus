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
	verifications
} from '$lib/base/schema';
import { analyserDocument, type Document } from '$lib/contenu/document';
import { ancresDuDocument, rendreDocument, type ResolveurDeNote } from '$lib/contenu/rendu';
import { formaterDateFr, formaterDateHeureFr, formaterDateIso } from '$lib/dates';
import { notificationsDeLAdresse } from '$lib/donnees/traitement-differe';
import { compteDe, journaliserUneConsultation } from '$lib/donnees/consultation';
import { attacherLOuverture, termeDeProvenance } from '$lib/donnees/recherches';
import { lireLHistoire, versionDemandee, type VersionCapturee } from '$lib/donnees/histoire';
import {
	joursEcoules,
	lireLesChampsDUnTypeDeFiche,
	lireLesProprietesDeFiche,
	lireSeuils,
	type ContexteDeLecture
} from '$lib/donnees/lecture';
import type { Identite } from '$lib/droits/resolution';
import { lireLaNote, registreDemande, type LectureDeNote, type Registre } from '$lib/donnees/note';
import type {
	EntreeDeSommaire,
	InstantAffiche,
	LectureAffichee
} from '$lib/lecture/note-de-demonstration';
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
import { adresseDePieceJointe } from '$lib/rangement/adresses';
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
import type { Note } from '../../../../seeds/corpus';

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
	/** L'adresse de téléchargement, composée par `adresseDePieceJointe()`. */
	readonly adresse: string;
}

interface ComplementsDeLecture {
	readonly affichee: LectureAffichee;
	readonly panneaux: PanneauxDeLaNote;
	/** Les mêmes pièces que `panneaux.pieces`, dans le même ordre — voir ci-dessus. */
	readonly piecesJointes: readonly PieceJointeCablee[];
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

/**
 * L’ARTICLE D’UNE VERSION ANTÉRIEURE — `?version={n}`.
 *
 * TROIS CHAMPS CHANGENT, ET TROIS SEULEMENT : le titre et les deux corps que la
 * version a CAPTURÉS. Le sommaire suit le corps affiché, faute de quoi ses ancres
 * pointeraient sur des titres absents de la page. Le reste — contrôle, fraîcheur,
 * dates, révision, consultations — sont des faits de LA NOTE que `versions` ne
 * porte pas : les recomposer serait les inventer.
 *
 * LE CORPS EST RENDU PAR `rendreDocument`, ET PAR RIEN D’AUTRE (`ADR-004`), avec
 * le résolveur que `lireLaNote()` a construit sur le périmètre de l’appelant.
 */
function articleDeLaVersion(
	courante: LectureAffichee,
	version: VersionCapturee,
	resoudreUneNote: ResolveurDeNote
): LectureAffichee {
	const rendre = (document: Document): string =>
		rendreDocument(document, { resoudre: resoudreUneNote, contexte: 'interne' });
	return {
		...courante,
		/* LE TITRE EST RENOMMABLE (`RG-M07-02`), et c’est pour cela que la version
		   le capture. Le reste de la note — rangement, type, visibilité — est celui
		   d’aujourd’hui : la version ne le porte pas. */
		note: { ...courante.note, titre: version.titre },
		reference: rendre(version.reference),
		operationnel: version.operationnel === null ? null : rendre(version.operationnel),
		sommaire: sommaireDe(version.reference)
	};
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
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			corpsReference: notes.corpsReference,
			corpsReferenceModifieLe: notes.corpsReferenceModifieLe,
			corpsOperationnelModifieLe: notes.corpsOperationnelModifieLe,
			revisionDemandee: notes.revisionDemandee,
			revisionCommentaire: notes.revisionCommentaire,
			revisionLe: notes.revisionLe,
			revisionPar: comptes.nom
		})
		.from(notes)
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
		.select({ par: comptes.nom, le: verifications.le })
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
			sommaire: sommaireDuDocument(ligne.corpsReference),
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
			adresse: adresseDePieceJointe(lecture.note.id, pj.nom)
		}))
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
	const histoire = await lireLHistoire(
		base,
		lecture,
		maintenant,
		versionDemandee(url.searchParams.get('version'))
	);

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
		 * L’ARTICLE DE LA VERSION CONSULTÉE, ou `null` quand l’adresse ne désigne
		 * aucune version : la note COURANTE est alors la bonne réponse.
		 *
		 * SANS CE CHAMP, V-15 RENDAIT LE CORPS COURANT SOUS UN BANDEAU ANNONÇANT UN
		 * ÉTAT ANTÉRIEUR, et « Restaurer cette version » écrasait la note avec un texte
		 * que l’écran n’avait jamais montré (`RG-M18-05`).
		 */
		afficheeDeLaVersion:
			histoire.affichee === null
				? null
				: articleDeLaVersion(complements.affichee, histoire.affichee, lecture.resoudreUneNote),
		/**
		 * LA NOTE TELLE QU'ELLE S'AFFICHE — l'identité, le corps rendu, le sommaire,
		 * le dernier contrôle, les dates, la révision courante et la mesure de
		 * consultation.
		 */
		affichee: complements.affichee,
		panneaux: complements.panneaux,
		/**
		 * LES PIÈCES, SOUS LA FORME QUE LE CÂBLAGE ADRESSE. Le gel les pose en `a.pj`
		 * avec un `href="#"` : sans cette liste, aucun lien ne mène nulle part.
		 */
		piecesJointes: complements.piecesJointes,
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
function adresseDeLaNote(identifiant: string): string {
	return `/notes/${identifiant}`;
}

export const actions: Actions = {
	/** VÉRIFIER — `UC-M06-02`. Un clic, aucun champ : rien à valider avant d'écrire. */
	verifier: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		/* SEUL CE GESTE ENTRETIENT L'INDEX DES TROIS — il écrit `verifieLe`, champ
		   projeté et triable. Signaler et lever n'écrivent que les colonnes de
		   révision, qu'aucune entrée d'index ne porte. */
		const fait = await verifierLaNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant));
	},

	/**
	 * SIGNALER À RÉVISER — `UC-M06-03`, « en expliquant pourquoi ». Le commentaire
	 * est la seule donnée du geste, et son absence le refuse.
	 */
	signaler: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const formulaire = await request.formData();
		const commentaire = commentaireDeRevision(formulaire.get('commentaire'));

		if (commentaire === null) {
			/* LE DROIT EST RÉSOLU AVANT QU'ON SE PLAIGNE DE LA FORME : distinguer
			   « explication manquante » de « adresse inconnue » révélerait l'existence
			   de la note à qui n'y a pas droit. La levée sert de sonde d'accès — même
			   régime, effet neutre quand aucune demande n'est courante. */
			const acces = await leverLaDemandeDeRevision(base, {
				identifiant: params.identifiant,
				identite: locals.identite,
				contexte,
				maintenant
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
			return fail(400, { motif: 'aucune explication fournie' });
		}

		const fait = await demanderUneRevision(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant,
			commentaire
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant));
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
		redirect(303, adresseDeLaNote(params.identifiant));
	},

	/**
	 * LEVER LA DEMANDE — `M06.3`. Elle n'atteste rien : la note ne repasse pas au
	 * vert. Confondre les deux serait confondre « cette demande n'a plus lieu
	 * d'être » et « ce contenu est d'actualité ».
	 */
	lever: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const fait = await leverLaDemandeDeRevision(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		redirect(303, adresseDeLaNote(params.identifiant));
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
