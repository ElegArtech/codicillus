/**
 * `/notes/{identifiant}` — LE CHARGEUR DE LA LECTURE D'UNE NOTE (V-14).
 *
 * `?registre=operationnel` désigne le second registre, et rien d'autre :
 * `docs/routes.md:223` — « le paramètre `?registre=` reste réservé à la
 * lecture » —, `V-14:3958` l'écrit dans l'adresse, « le lien est partageable
 * tel quel ». `/notes/{identifiant}/operationnel` est l'ÉDITEUR (V-18,
 * `docs/routes.md:145`) et n'appartient pas à ce lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04
 *
 * `lireLaNote()` rend une ressource ou `INTROUVABLE`, sans troisième forme, et
 * ce fichier n'a donc qu'UN `error(404, MESSAGE_INTROUVABLE)` : « une note inexistante » et « une
 * note interdite » ne sont pas deux branches qui se ressemblent, c'est le même
 * appel, à la même ligne. Rien ici ne sait laquelle des deux causes s'est
 * réalisée — la garantie est portée par le type, pas par la discipline.
 *
 * CE QUE CE 404 NE REND PAS ENCORE. `docs/routes.md` §5.5 veut **V-04** pour
 * l'anonyme et **V-26** pour le connecté sans droit. Ces deux écrans sont
 * l'objet de `T-035` (`docs/plan-cablage.md`, vague 2 : « adresse non résolue |
 * V-02, V-03, V-04, V-26 ») : les peindre ici demanderait une page d'erreur, et
 * ce lot ne la pose pas. Le code de statut, lui, est celui que §5.5 exige, et
 * les deux côtés du couple sont indiscernables — c'est ce que mesure
 * `pnpm test:etancheite`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DROITS SONT RÉSOLUS, JAMAIS RECOPIÉS
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique (T-011), et
 * jusqu'au 20 août aucune route ne l'appelait — la cause de la fuite mesurée à
 * `ECART-047` É-1. L'identité vient de `event.locals.identite`, posée par
 * `src/hooks.server.ts` pour chaque requête ; elle vaut `ANONYME` ou une
 * identité authentifiée, jamais rien.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, UNE FOIS. `lireNotes()` l'exige en
 * paramètre : une couche de lecture qui prendrait l'heure elle-même rendrait
 * ses résultats non reproductibles. En service, la fraîcheur est vraie
 * MAINTENANT.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS ACTIONS DE M06 SONT ICI, ET NULLE PART AILLEURS
 *
 * `docs/routes.md:140` rattache à cette adresse `UC-M06-02`, `UC-M06-03` et
 * `RG-M06-05…11` : c'est la route de la lecture d'une note, et c'est d'elle que
 * partent les trois gestes du cartouche et du bandeau de révision. Elles sont
 * NOMMÉES — `verifier`, `signaler`, `lever` —, parce que la page en porte trois
 * et qu'une action par défaut ne saurait pas laquelle a été demandée.
 *
 * `T-024` LIVRE LE MÉCANISME, PAS SON DÉCLENCHEUR. Le gel rend les trois
 * boutons (`V-14:1471`, `:1482`, `:1427`), et AUCUN n'est dans un formulaire :
 * `ARB-054` §3 recense les cinq formulaires du gel, et V-14 n'en porte aucun.
 * Ce qui atteint ces actions depuis l'écran — un formulaire posé par le lot de
 * comportement, ou une soumission par `fetch` — appartient au lot qui touchera
 * `src/vues/`. La règle d'`ARB-054` §3 vaut ici sans réserve : sans `method`,
 * une soumission native partirait en GET, et `§4` du même arbitrage ferme la
 * question — « aucune autre action d'écriture ne passe en GET ». Écart déclaré
 * au rapport, non contourné.
 *
 * ET LE REFUS N'ATTEND PAS LE BOUTON. `P-09` dit que l'action interdite n'est
 * pas RENDUE ; l'absence de bouton n'est pas un contrôle d'accès. Les trois
 * actions résolvent le droit AVANT d'écrire, et leur refus est le MÊME `404`
 * que celui du chargeur — `RG-ACC-04`, rien ne distingue « la note n'existe
 * pas » de « vous n'y avez pas droit ».
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
import { analyserDocument, titres } from '$lib/contenu/document';
import { formaterDateFr, formaterDateHeureFr, formaterDateIso } from '$lib/dates';
import { compteDe, journaliserUneConsultation } from '$lib/donnees/consultation';
import { lireLHistoire, versionDemandee } from '$lib/donnees/histoire';
import { joursEcoules, lireSeuils, type ContexteDeLecture } from '$lib/donnees/lecture';
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
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { Note } from '../../../../seeds/corpus';

/**
 * Le type de média que la norme HTTP donne à des octets sans type déclaré. Il
 * n'est employé que lorsque le dépôt lui-même n'en annonce aucun — le produit
 * ne devine JAMAIS un type à partir d'un nom de fichier.
 */
const TYPE_DES_OCTETS_NON_TYPES = 'application/octet-stream';

/* ════════════════════════════════════════════════════════════════════════════
   CE QUE L'ÉCRAN MONTRE, ET QUE PERSONNE NE LISAIT

   `lireLaNote()` rendait déjà la note réelle, son corps rendu et ses
   rétroliens ; `V-14` n'avait aucune propriété pour les recevoir et affichait
   la transcription du gel — le titre de `n-restaurer-pg` POUR LES 32 NOTES, et
   pour toute note créée depuis. L'écart était déclaré au rapport de `T-033`.

   CE BLOC EST LA MOITIÉ MANQUANTE. Il complète la lecture par ce que le gel
   écrivait à la main et que la base porte pourtant : le journal des
   vérifications, la demande de révision courante, les dates de modification,
   les pièces jointes, les relations dans les deux sens et la mesure de
   consultation.

   POURQUOI LES REQUÊTES SONT ICI, ET NON DANS `$lib/donnees/`. Le contrat de
   ce lot ouvre le chargeur de la route, pas les modules partagés de la couche
   de données — d'autres lots y travaillent en parallèle. Le regroupement dans
   un module de lecture reste à faire, et c'est une dette dite, pas un choix
   d'architecture.

   AUCUNE DÉCISION D'ACCÈS N'EST PRISE ICI, et c'est la propriété qui compte
   (ADR-006). Toutes les requêtes ci-dessous s'exécutent APRÈS la résolution :
   la note a déjà été jugée lisible. Les seules qui traversent le corpus —
   celles des relations — sont bornées aux identifiants que `lireLaNote()` a
   retenus, c'est-à-dire au périmètre qu'elle a calculé. Aucun second filtre,
   aucune seconde règle. */

/** La fenêtre de mesure que le gel annonce : « sur les 30 derniers jours ». */
const JOURS_DE_MESURE = 30;
const MILLISECONDES_PAR_JOUR = 86_400_000;

/** Un instant, dans les trois formes que le gel emploie côte à côte. */
function instantAffiche(valeur: Date): InstantAffiche {
	return {
		iso: formaterDateIso(valeur),
		jour: formaterDateFr(valeur),
		heureDite: formaterDateHeureFr(valeur)
	};
}

/**
 * LE SOMMAIRE, RELEVÉ SUR LE DOCUMENT CANONIQUE.
 *
 * `construireSommaire()` du gel (`V-14:3901`) relit le DOM rendu ; un composant
 * Svelte ne peut pas se relire. `titres()` donne la même matière depuis
 * l'arbre : « seuls les niveaux 2 et 3 alimentent le sommaire »
 * (`V-14:1704`), et un titre sans ancre n'est la cible d'aucun lien.
 */
function sommaireDuDocument(valeur: unknown): readonly EntreeDeSommaire[] {
	const retenus: EntreeDeSommaire[] = [];
	for (const titre of titres(analyserDocument(valeur))) {
		const { level, ancre } = titre.attrs;
		if ((level !== 2 && level !== 3) || ancre === null) continue;
		retenus.push({
			niveau: level,
			ancre,
			libelle: (titre.content ?? []).map((t) => t.text).join('')
		});
	}
	return retenus;
}

/**
 * LES DEUX NOTES VOISINES DU PANNEAU « POSITION » — celle qui précède et celle
 * qui suit, DANS LE CORPUS QUE L'APPELANT A LE DROIT DE LIRE.
 *
 * La fratrie est lue sur `lecture.notes`, déjà filtré par le périmètre : une
 * note voisine qu'on n'a pas le droit de lire n'est pas une voisine, et son
 * titre ne s'affiche pas (`RG-ACC-01`).
 *
 * L'ORDRE EST CELUI DU CORPUS SERVI — voir `$lib/lecture/panneaux.ts`.
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
		jours: n.jours
	});
	const retenues: VoisineAffichee[] = [];
	const avant = fratrie[rang - 1];
	const apres = fratrie[rang + 1];
	if (avant !== undefined) retenues.push(decrire(avant, '←'));
	if (apres !== undefined) retenues.push(decrire(apres, '→'));
	return retenues;
}

/** Une relation lue, dans le sens où elle se lit depuis la note ouverte. */
interface RelationLue extends NoteLiee {
	readonly libelle: string;
}

/**
 * LES RELATIONS, GROUPÉES PAR LIBELLÉ — le gel les rend ainsi, sortantes
 * d'abord, entrantes ensuite (« S'applique à », « Dépend de », puis « Est
 * référencée par »).
 *
 * L'ORDRE DES GROUPES EST CELUI DU RÉFÉRENTIEL (`types_de_relation.ordre`),
 * puis celui du sens : ce sont les deux seuls ordres que la base porte, et
 * aucun classement n'est inventé.
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
 * l'affiche.
 *
 * `PieceAffichee` porte ce que le GEL rend : un nom AMPUTÉ de son suffixe, une
 * extension en cartouche, une taille en clair (`$lib/lecture/panneaux.ts`,
 * `V-14:1830-1834`). Aucun de ces quatre champs ne permet de reformer l'adresse
 * de la pièce : `adresseDePieceJointe()` prend le nom de FICHIER, celui que
 * `pieces_jointes.nom` porte, suffixe compris.
 *
 * Les deux formes coexistent donc, dans le MÊME ORDRE, et c'est cet ordre qui
 * les apparie : la vue affiche `panneaux.pieces[i]`, le câblage adresse
 * `piecesJointes[i]`. Rien n'est recalculé à l'écran — ni le nom, ni l'adresse.
 */
export interface PieceJointeCablee {
	/** Le nom de FICHIER, tel que la base le porte. C'est la clé du retrait. */
	readonly nom: string;
	/** L'adresse de téléchargement, composée par `adresseDePieceJointe()`. */
	readonly adresse: string;
}

/** Ce que le chargeur ajoute à la lecture : la note telle qu'elle s'affiche. */
interface ComplementsDeLecture {
	readonly affichee: LectureAffichee;
	readonly panneaux: PanneauxDeLaNote;
	/** Les mêmes pièces que `panneaux.pieces`, dans le même ordre — voir ci-dessus. */
	readonly piecesJointes: readonly PieceJointeCablee[];
}

async function complementsDeLecture(
	base: Base,
	lecture: LectureDeNote,
	registre: Registre,
	corpsDuRegistreReference: string | null,
	maintenant: Date
): Promise<ComplementsDeLecture> {
	const identifiant = lecture.note.id;

	/* La ligne brute de la note : les colonnes que la couche de lecture ne
	   projette pas, et le compte qui a demandé la révision. */
	const [ligne] = await base
		.select({
			cle: notes.id,
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
	   MÊME que partout dans cette famille — rien ne distingue deux causes
	   (`RG-ACC-04`). */
	if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

	/* Le journal des vérifications — `M06.2`, « l'historique complet est
	   conservé ». Une entrée sans compte reste une attestation : la colonne est
	   effaçable, et `RG-M15-02` fait de l'anonymat un état normal du journal. */
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

	/* LA MESURE DE CONSULTATION VIENT DU JOURNAL, sur la fenêtre que le gel
	   annonce — « 37 sur les 30 derniers jours ». `MESURES_7J` de la semence
	   nomme « 7 j » la même donnée : la contradiction est ancienne et déclarée
	   (`$lib/lecture/note-de-demonstration.ts`), et elle se tranche ici en
	   lisant la table plutôt qu'une constante. */
	const depuis = new Date(maintenant.getTime() - JOURS_DE_MESURE * MILLISECONDES_PAR_JOUR);
	const [mesure] = await base
		.select({ nombre: sql<number>`count(*)::int` })
		.from(consultations)
		.where(and(eq(consultations.noteId, ligne.cle), gte(consultations.le, depuis)));

	const domaineParNote = new Map<string, string>(lecture.notes.map((n) => [n.id, n.domaine]));

	/* `RG-M06-01` — la fraîcheur se lit sur la dernière vérification, et à
	   défaut sur la dernière modification. L'ANCIENNETÉ SERVIE AU LIBELLÉ EST
	   CELLE-LÀ, la même que celle sur laquelle le niveau a été résolu : deux
	   sources donneraient deux âges pour un seul signal (P-01). */
	const referenceDeFraicheur = ligne.verifieLe ?? ligne.modifieLe;

	return {
		affichee: {
			note: lecture.note,
			reference: corpsDuRegistreReference,
			operationnel: registre === 'operationnel' && lecture.corps.redige ? lecture.corps.html : null,
			sommaire: sommaireDuDocument(ligne.corpsReference),
			controle:
				ligne.verifieLe === null
					? null
					: { par: attestations[0]?.par ?? null, quand: instantAffiche(ligne.verifieLe) },
			joursDepuisControle: joursEcoules(referenceDeFraicheur, maintenant),
			modifiee: instantAffiche(ligne.modifieLe),
			referenceModifiee: instantAffiche(ligne.corpsReferenceModifieLe),
			/* `RG-NOT-02` — il n'y a rien à resynchroniser sans version
			   opérationnelle. La comparaison porte sur les deux dates de CORPS, et
			   non sur `modifieLe`, qu'un simple renommage fait bouger. */
			/* `RG-M06-08` A UNE SEULE DÉFINITION, et ce n'est pas ici. Le prédicat
			   était recopié en ligne, et le même signal se calculait à deux endroits
			   — c'est `P-01` en petit : deux définitions concurrentes d'un même
			   signal finissent par diverger, et celle qui diverge n'est jamais celle
			   qu'on relit. `operationnelDesynchronise()` est l'unique. */
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
			consultations30j: mesure?.nombre ?? 0
		},
		panneaux: {
			voisines: voisinesDe(lecture),
			pieces: lignesDePiece.map((pj) => {
				const { extension, nom } = extensionEtNom(pj.nom, pj.typeMedia);
				return {
					nom,
					extension,
					taille: tailleEnClair(pj.tailleOctets),
					depose: `déposé le ${formaterDateFr(pj.deposeeLe)}`
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
		   n'est donc pas une convention d'écran : c'est le même tableau. */
		piecesJointes: lignesDePiece.map((pj) => ({
			nom: pj.nom,
			adresse: adresseDePieceJointe(lecture.note.id, pj.nom)
		}))
	};
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
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

	/* ═══════════════════════════════════════════════════════════════════════
	   LA CONSULTATION SE COMPTE ET SE JOURNALISE — `RG-M04-09`, T-078.

	   APRÈS LA RÉSOLUTION, ET JAMAIS AVANT. Deux propriétés en dépendent, et
	   aucune des deux n'est une précaution :

	     · `RG-ACC-04` — le refus et l'inexistence doivent rendre la même
	       réponse. Les deux passent par le `error()` ci-dessus et n'atteignent
	       donc jamais cette écriture : une note interdite coûte exactement ce
	       que coûte une note absente, y compris en temps. Écrire avant la
	       résolution ferait payer au refus un aller-retour que l'inexistence ne
	       paie pas — la fuite de latence qu'`ARB-005` nomme et que la batterie 6
	       mesure ;
	     · une lecture REFUSÉE n'est pas une ouverture, et RG-M04-09 compte les
	       ouvertures.

	   L'INSTANT EST CELUI DE LA REQUÊTE, pris plus haut et pris une fois : la
	   fraîcheur a été résolue dessus, et une seconde lecture d'horloge donnerait
	   à l'entrée un horodatage postérieur d'une milliseconde à l'état qu'elle
	   date.

	   ET C'EST UNE ÉCRITURE SUR UNE REQUÊTE DE LECTURE — écart déclaré au
	   rapport de `T-078` au regard d'`ARB-054` §4, qui réserve l'écriture en GET
	   à `/deconnexion`. Elle n'est pas contournable : « toute OUVERTURE d'une
	   note » désigne cette requête-ci, et le cahier prime sur la commodité. */
	await journaliserUneConsultation(base, {
		identifiant: params.identifiant,
		compte: compteDe(locals.identite),
		maintenant
	});

	/* ═══════════════════════════════════════════════════════════════════════
	   L'HISTORIQUE — T-039, ajouté à ce chargeur et non à un autre.

	   V-15 N'A PAS DE CHEMIN PROPRE : `docs/routes.md:141` et `:207` la classent
	   « superposée » à cette adresse, et son fil est celui de V-14. Son état
	   adressable est `?version={n}` (`docs/routes.md:224`), lu ici.

	   L'ACCÈS EST DÉJÀ DÉCIDÉ : `lireLHistoire()` prend la lecture RÉSOLUE
	   ci-dessus, jamais un identifiant nu — il n'existe donc pas deux décisions
	   d'accès à cette adresse. */
	const histoire = await lireLHistoire(
		base,
		lecture,
		maintenant,
		versionDemandee(url.searchParams.get('version'))
	);

	/* ═══════════════════════════════════════════════════════════════════════
	   LE CORPS QUE L'ÉCRAN AFFICHE EST CELUI DU REGISTRE RÉFÉRENCE.

	   Le gel rend les DEUX enveloppes en permanence et cache la seconde
	   (`div#corps-operationnel[hidden]`) ; la bascule qui les échange est un
	   COMPORTEMENT, absent du gel par `ARB-011` et non livré à ce jour. Le volet
	   visible est donc toujours `corps-reference`, quel que soit `?registre=`.

	   D'OÙ CETTE SECONDE RÉSOLUTION, ET SEULEMENT DANS CE SENS-LÀ : quand
	   l'adresse demande l'Opérationnel, la Référence est chargée en plus, pour
	   que le volet visible ne soit pas vide. Elle passe par `lireLaNote()`, donc
	   par la MÊME décision d'accès — jamais par une requête écrite ici. Le
	   chemin ordinaire (`?registre=reference`, le défaut) n'en paie pas le coût.

	   UN CORPS EXISTANT MAIS VIDE REND `null`, et la vue le DIT : `corpsRendu()`
	   sépare `existe` de `redige`, et « la note n'a pas encore de texte » n'est
	   pas la même chose que « le texte n'a pas été chargé » (`RG-M18-03`). */
	const corpsDeReference =
		registre === 'reference'
			? lecture.corps.redige
				? lecture.corps.html
				: null
			: await corpsDeReferenceCharge(base, params.identifiant, locals.identite, contexte);

	const complements = await complementsDeLecture(
		base,
		lecture,
		registre,
		corpsDeReference,
		maintenant
	);

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-14, et il ne porte que ce qui est VRAI de cet
		 * appelant-ci : ses droits.
		 *
		 * Les six autres leviers de la planche — `fr`, `c-revision`,
		 * `c-brouillon`, `c-resync`, `c-op`, `etat` — décrivent LA NOTE AFFICHÉE.
		 * Or l'article de V-14 est la transcription gelée de `n-restaurer-pg`
		 * (`src/lib/lecture/CorpsReference.svelte`, `note-de-demonstration.ts`),
		 * et la vue n'accepte aucune propriété de note : les piloter depuis une
		 * AUTRE note peindrait les attributs d'une note sur le corps d'une autre
		 * — la « valeur illustrative » que P-02 proscrit. Ils restent donc à leur
		 * position du gel, et l'écart est déclaré au rapport du lot.
		 *
		 * `droits`, lui, est une propriété de l'APPELANT, vraie quelle que soit
		 * la note : la capacité d'écrire vient de `capacites()` (CDC §2.3), et
		 * c'est elle qui décide de l'ÉMISSION des actions d'écriture (P-09,
		 * ARB-040 : omises, jamais masquées).
		 */
		vecteur: { droits: lecture.capacites.ecrireDesNotes ? 'ecriture' : 'lecture' },
		notes: lecture.notes,
		/**
		 * LA NOTE RÉELLE, SON CORPS ET SES RÉTROLIENS — chargés, servis à la page,
		 * et QU'AUCUN NŒUD DE V-14 NE PEUT RECEVOIR à ce jour : la vue déclare
		 * deux propriétés (`vecteur`, `notes`) et lit tout le reste de
		 * `seeds/corpus.ts` et de `$lib/lecture/note-de-demonstration.ts`. Aucun
		 * fichier de `src/vues/` n'est touché par ce lot — c'est la règle de la
		 * vague —, donc l'écran reste celui du gel. Écart déclaré, chiffré au
		 * rapport.
		 */
		lecture: {
			note: lecture.note,
			registre,
			corps: lecture.corps,
			retroliens: lecture.retroliens
		},
		/**
		 * L'HISTORIQUE RÉEL DE LA NOTE — T-039 —, ET QU'AUCUN NŒUD DE CETTE PAGE
		 * NE PEUT RECEVOIR À CE JOUR. `src/vues/V-15.svelte` déclare bien
		 * `versions` et `retentionVersions` depuis `T-043`, mais c'est `V-14` que
		 * cette adresse monte : V-15 est une SUPERPOSITION, et rien n'adresse
		 * l'ouverture de son panneau — `docs/routes.md` §S2 ne connaît de V-15
		 * que `?version=` et l'ancre. Monter V-15 demanderait de décider quand le
		 * panneau est ouvert, ce qu'aucune source ne dit : ce serait combler.
		 * Écart déclaré, chiffré au rapport de lot.
		 *
		 * `versions` est VIDE parce que la table l'est — zéro ligne pour
		 * 32 notes —, et non parce qu'une transposition manquerait.
		 * `retention` est `versions_max` de `parametres`, lu et jamais redéclaré.
		 */
		histoire,
		/**
		 * LA NOTE TELLE QU'ELLE S'AFFICHE — l'identité, le corps rendu, le
		 * sommaire, le dernier contrôle, les dates, la révision courante et la
		 * mesure de consultation.
		 *
		 * C'est la propriété qui manquait à `src/vues/V-14.svelte` et dont
		 * l'absence faisait afficher la note du gel pour toutes les autres.
		 */
		affichee: complements.affichee,
		/** Les sept panneaux latéraux, tous lus en base, aucun transcrit. */
		panneaux: complements.panneaux,
		/**
		 * LES PIÈCES, SOUS LA FORME QUE LE CÂBLAGE ADRESSE — nom de fichier et
		 * adresse de téléchargement. Le gel de V-14 pose les pièces en `a.pj`
		 * avec un `href="#"` (`V-14:1830`, `:1835`) : sans cette liste, aucun de
		 * ces liens ne mène nulle part, et le panneau reste une vitrine.
		 */
		piecesJointes: complements.piecesJointes
	};
};

/**
 * LE CORPS DE RÉFÉRENCE, RÉSOLU UNE SECONDE FOIS — et par le même chemin.
 *
 * Elle n'est appelée que lorsque l'adresse demande l'Opérationnel. Passer par
 * `lireLaNote()` plutôt que par une requête écrite ici garantit qu'il n'existe
 * pas deux décisions d'accès à cette adresse : un refus rend `INTROUVABLE`, et
 * le volet visible reste vide plutôt que de trahir quoi que ce soit.
 */
async function corpsDeReferenceCharge(
	base: Base,
	identifiant: string,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<string | null> {
	const autre = await lireLaNote(base, {
		identifiant,
		registre: 'reference',
		identite,
		contexte
	});
	if (!autre.trouve || !autre.ressource.corps.redige) return null;
	return autre.ressource.corps.html;
}

/**
 * LE CONTEXTE D'UN GESTE — l'instant est pris UNE FOIS par requête, et il sert
 * à la fois de seuil de lecture et de date d'attestation.
 *
 * Deux appels d'horloge donneraient à la note une date de vérification
 * légèrement postérieure à celle sur laquelle la fraîcheur a été résolue : la
 * réponse serait exacte, et la trace incohérente d'une milliseconde.
 */
async function contexteDUnGeste() {
	const base = basePartagee();
	const maintenant = new Date();
	return { base, maintenant, contexte: { maintenant, seuils: await lireSeuils(base) } };
}

export const actions: Actions = {
	/**
	 * VÉRIFIER — `UC-M06-02`. Un clic, aucun champ : la requête n'a pas de corps
	 * utile, et il n'y a rien à valider avant d'écrire. C'est littéralement ce
	 * que `CLAUDE.md` §1 décrit — « en un clic, sans formulaire ».
	 */
	verifier: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		/* SEUL CE GESTE ENTRETIENT L'INDEX DES TROIS — il écrit `verifieLe`, qui
		   est un champ projeté et l'un des quatre champs triables. Signaler et
		   lever n'écrivent que les colonnes de révision, qu'aucune entrée d'index
		   ne porte. */
		const fait = await verifierLaNote(base, moteurPartage(), {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return {
			verifieLe: fait.ressource.verifieLe.toISOString(),
			/* `RG-M06-07` — ce que le geste a EFFACÉ au passage. L'écran a besoin de
			   le savoir : le bandeau de révision doit disparaître. */
			demandeEffacee: fait.ressource.demandeEffacee
		};
	},

	/**
	 * SIGNALER À RÉVISER — `UC-M06-03`, « en expliquant pourquoi ». Le
	 * commentaire est la seule donnée du geste, et son absence le refuse.
	 */
	signaler: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const formulaire = await request.formData();
		const commentaire = commentaireDeRevision(formulaire.get('commentaire'));

		if (commentaire === null) {
			/* LE DROIT EST RÉSOLU AVANT QU'ON SE PLAIGNE DE LA FORME. Une réponse qui
			   distinguerait « explication manquante » de « adresse inconnue »
			   révélerait l'existence de la note à qui n'y a pas droit — le même
			   raisonnement que l'action de `/notes/{identifiant}/modifier`. La levée
			   sert de sonde d'accès : elle est le geste du même régime dont l'effet
			   est neutre quand aucune demande n'est courante. */
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
		return {
			le: fait.ressource.le.toISOString(),
			/* `RG-M06-06` — la demande a-t-elle REMPLACÉ une demande courante. */
			aRemplace: fait.ressource.aRemplace
		};
	},

	/**
	 * LEVER LA DEMANDE — `M06.3`, dernière puce, rendue par `V-14:1427`.
	 *
	 * Elle n'atteste rien : la note ne repasse pas au vert. Confondre les deux
	 * serait confondre « cette demande n'a plus lieu d'être » et « ce contenu est
	 * d'actualité », et le vocabulaire du produit sépare les deux (`CLAUDE.md`
	 * §3, « Vérifier »).
	 */
	/**
	 * RESTAURER UNE VERSION — `UC-M07-04`. Le geste est dessiné dans
	 * `mockups/V-40-dialogues.html` (« restaurer la version 11 ») et son
	 * déclencheur vit dans V-15, le panneau d'historique, qui est une
	 * SUPERPOSITION de cette adresse (`docs/routes.md` §3.4). L'action est donc
	 * ici, à côté des trois autres gestes de la lecture, et non sur une route de
	 * comparaison qu'aucun bouton ne vise depuis le panneau.
	 *
	 * Restaurer n'efface rien : c'est un ENREGISTREMENT du corps ancien, qui
	 * capture donc sa propre version (`RG-M07-02`). L'historique s'allonge, il ne
	 * recule pas.
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
		redirect(303, `/notes/${params.identifiant}`);
	},

	lever: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const fait = await leverLaDemandeDeRevision(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return { avaitUneDemande: fait.ressource.avaitUneDemande };
	},

	/**
	 * SUPPRIMER — `RG-M04-10`, `RG-M07-04`, `RG-M14-03`, `RG-M14-05`. T-080.
	 *
	 * ELLE N'APPARTIENT PAS À M06, et c'est pourquoi elle est nommée à part des
	 * trois précédentes : celles-ci sont les gestes de la FRAÎCHEUR, celle-ci
	 * détruit. Elle est ici parce que `docs/routes.md:140` rattache la famille
	 * `/notes/{identifiant}` à cette adresse, et que la note à détruire est
	 * précisément celle qu'on lit.
	 *
	 * AUCUN CHAMP N'EST LU. `RG-M04-10` demande une CONFIRMATION — un fait
	 * d'écran, le dialogue « Supprimer cette note » de V-40 —, pas une saisie du
	 * nom exact : celle-ci est réservée aux dossiers (`RG-M03-04`) et aux
	 * domaines (`RG-M14-02`). Lire un champ ici serait inventer une porte que le
	 * cahier ne pose pas.
	 *
	 * LE REFUS EST LE MÊME `404` QUE PARTOUT DANS CETTE FAMILLE. Le droit est
	 * résolu AVANT toute destruction, par `resoudreLEditionDUneNote()` — la même
	 * décision que l'éditeur, jamais recopiée —, et rien ne distingue « la note
	 * n'existe pas » de « vous n'y avez pas droit » (`RG-ACC-04`).
	 *
	 * ET LA RÉPONSE EST UN `303` VERS LE DOMAINE, jamais vers la note. La note
	 * n'existe plus : rediriger vers `/notes/{identifiant}` rendrait un 404, ce
	 * qui serait une confirmation par l'absurde. L'adresse est celle
	 * qu'`adresseDeDomaine()` compose (`ARB-001`, seule forme publiée) et elle
	 * remonte du module de suppression, qui l'a calculée AVANT de détruire.
	 *
	 * `redirect()` LÈVE, et l'appel est donc la dernière ligne : tout ce qui la
	 * suivrait serait mort.
	 *
	 * CE QUI N'ATTEINT PAS ENCORE CETTE ACTION. Aucun formulaire de l'écran ne
	 * la vise : V-14 rend le bouton de suppression sous `{#if ecriture}`
	 * (`src/vues/V-14.svelte`) et le gel ne porte pour cette vue aucun `form`
	 * (`ARB-054` §3). `ARB-063` place ce câblage dans `+page.svelte`, que le
	 * contrat de ce lot n'ouvre pas. Écart déclaré — `ECART-048` É-4 —, non
	 * comblé ici.
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
	 * DÉPOSER UNE PIÈCE JOINTE — `M04.7` (`CDC:611`), le panneau « liste des
	 * fichiers, taille, type, téléchargement » de la note qu'on lit.
	 *
	 * LE MÉCANISME EXISTAIT DEPUIS `T-026` ET N'AVAIT AUCUNE PORTE.
	 * `deposerUnePieceJointe()` écrivait les octets puis la ligne, l'entrepôt
	 * était monté, la route de téléchargement servait — et `pieces_jointes`
	 * portait ZÉRO ligne, faute d'une seule adresse qui accepte un fichier.
	 * C'est cette porte, et elle n'est pas une route de plus : `docs/routes.md`
	 * est un inventaire FERMÉ, et la note qui reçoit la pièce est précisément
	 * celle qu'on lit. L'action est donc ici, à côté de `supprimer`.
	 *
	 * TROIS REFUS SONT RENDUS `400`, ET UN SEUL `404`. Les trois premiers —
	 * plafond dépassé, homonyme, nom vide — sont ADRESSÉS à quelqu'un dont le
	 * droit d'écrire a DÉJÀ été résolu : `deposerUnePieceJointe()` tranche le
	 * droit AVANT de lire le plafond, et ces trois-là ne peuvent donc être
	 * atteints que par un contributeur habilité. Les nommer ne révèle rien.
	 * Le `404`, lui, est le refus indiscernable d'`ADR-007` : note inexistante
	 * et note non accessible en écriture sortent par le même chemin.
	 *
	 * AUCUNE TAILLE N'EST CONTRÔLÉE ICI. Le plafond est celui de la console
	 * (`M14.7`), lu en base à chaque dépôt par le module ; le redire ici en
	 * ferait une seconde définition, et `P-01` dit ce que valent deux
	 * définitions concurrentes d'un même seuil.
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
				   `application/octet-stream` est le type que la norme HTTP donne à
				   des octets non typés, pas une devinette de ce module. Rien n'est
				   inféré du suffixe : `entrepot.ts` refuse par principe qu'une chaîne
				   d'utilisateur décide de quoi que ce soit. */
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
	 * RETIRER UNE PIÈCE JOINTE — le pendant du dépôt, désigné par le NOM du
	 * fichier, qui est la seule clé qu'une adresse porte (`docs/routes.md:146`).
	 *
	 * LE REFUS EST UNIQUE ET IL EST `404`, pour les trois causes que
	 * `retirerUnePieceJointeParNom()` confond : note inexistante, note sur
	 * laquelle l'appelant n'écrit pas, pièce inexistante. Aucune branche ne les
	 * distingue ici, et il n'y en a pas ailleurs.
	 */
	retirerPiece: async ({ params, locals, request }) => {
		/* LE CHAMP NE S'APPELLE PAS `fichier` : le champ de DÉPÔT porte déjà ce
		   nom, dans le même formulaire, et deux champs homonymes rendent le
		   premier dans l'ordre du document. Voir `+page.svelte`. */
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
