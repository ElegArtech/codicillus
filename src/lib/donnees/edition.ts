/**
 * L'édition d'une note, depuis la base.
 *
 * Ce module COMPOSE, il ne redéfinit rien : `./note.ts` porte la résolution donc la
 * décision d'accès (filtre de périmètre dans la requête, `ADR-006` ; sortie unique par
 * `INTROUVABLE`, `RG-ACC-04`), `../droits/resolution.ts` porte `capacites()`, et
 * `../contenu/document.ts` `analyserDocument`, porte UNIQUE du format (`ADR-003`).
 *
 * Le refus d'écrire passe par `INTROUVABLE`, jamais par un état « sans droit » :
 * `docs/routes.md` §5.5 range la famille `/notes/…` dans le régime INDISCERNABLE.
 * `P-09` dit que l'action interdite n'est pas RENDUE ; cela ne dispense pas de la
 * REFUSER sur le serveur.
 *
 * V-18 montre les DEUX registres et `lireLaNote()` rend le corps d'UN registre par
 * appel : la note est donc résolue deux fois. Seconde REQUÊTE, pas seconde DÉCISION.
 *
 * L'enregistrement appelle `entretenirLIndex()` APRÈS la validation de la transaction
 * (`RG-M05-06`) : il SOUMET au moteur et n'attend pas sa tâche (`ARB-060`). Le client
 * du moteur est un PARAMÈTRE : un appelant ne peut pas l'oublier.
 */
import { and, count, desc, eq, inArray, max } from 'drizzle-orm';
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
	numerosExcedentaires,
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
	lireConfiguration,
	lireTemplates,
	lireTypesDeFiche,
	lireTypesDeNote,
	type ContexteDeLecture
} from './lecture';
import { resoudreLeChemin, SEPARATEUR_DE_CHEMIN, type LigneDeDossier } from './rangement';
import {
	proprietesObligatoiresManquantes,
	proprietesSoumises,
	retenirLesProprietes,
	type ProprieteManquante
} from './creation';
import type { ChampDeFiche, Note, Template, TypeDeFiche, TypeDeNote } from '../../../seeds/corpus';
import type { NoteAffichee } from '../lecture/note-de-demonstration';

/**
 * Les trois référentiels que l'éditeur propose. Ils sont administrables (M14),
 * donc propres à l'instance : ils sont LUS, jamais repris du jeu de semence.
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

/** Un nœud de l'arborescence de choix de dossier, tel que `V-17` l'attend. */
export interface DossierDeChoix {
	readonly nom: string;
	readonly notes: number;
	readonly enfants: readonly DossierDeChoix[];
}

/**
 * L'arborescence de choix, par domaine — lue dans la table `dossiers`, jamais déduite
 * des chemins portés par les notes.
 *
 * LA RACINE EST OFFERTE À CÔTÉ DE SES ENFANTS, jamais au-dessus d'eux, et les chemins
 * de ses enfants n'en portent pas le préfixe. `Note.dossier` étant VIDE pour une note
 * rangée à la racine, c'est V-17 qui fait l'équivalence « vide = nom du domaine » ;
 * `dossierDeDestination()` retire ce segment en tête à l'écriture.
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

export interface CreationDeNote {
	readonly notes: readonly Note[];
	readonly referentiels: ReferentielsDeSaisie;
}

/**
 * `/notes/nouvelle` — la résolution de la création. `nouvelle` est un identifiant
 * RÉSERVÉ sous `/notes/` (`docs/routes.md` §5.4) : l'adresse ne désigne aucune
 * ressource du corpus, et sa réponse dépend d'une CAPACITÉ —
 * `peutEcrireQuelquePart()`. L'écran n'est rattaché à aucun domaine tant que rien
 * n'est choisi : exiger le droit sur un domaine particulier serait exiger davantage
 * que « connecté + rédacteur ».
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

/** Ce que l'édition d'une note met à disposition des routes V-17 et V-18. */
export interface EditionDeNote {
	readonly lecture: LectureDeNote;
	readonly document: Document | null;
	/**
	 * Ce que l'éditeur ne sait pas porter dans ce document. Vide : il s'ouvre.
	 * Non vide : la note est éditable en droit et pas en fait, et la route le
	 * DIT plutôt que d'ouvrir un éditeur qui amputerait le contenu.
	 */
	readonly horsDePorteeDeLEditeur: readonly string[];
	readonly referentiels: ReferentielsDeSaisie;
}

export interface DemandeDEdition {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
}

/**
 * La résolution d'une édition — une ressource, ou rien. Deux conditions, une seule
 * sortie : la note doit être lisible (`lireLaNote()`, filtre dans la requête) ET
 * l'appelant doit avoir `capacites().ecrireDesNotes` sur le dossier porteur, que
 * `lireLaNote()` a déjà calculée.
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
 * L'état de synchronisation des deux registres — `RG-M06-08`.
 *
 * L'auteur est celui de l'enregistrement qui a changé la Référence, retrouvé par la
 * version que cet enregistrement a écrite : les deux portent le même instant, posé une
 * seule fois par la route. `null` quand personne ne peut être nommé, jamais un nom de
 * remplacement.
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

/**
 * Le rangement demandé, nommé par ce que le GEL porte : `V-17:2791` remplit le
 * sélecteur de domaine avec le NOM affiché, jamais un identifiant, et `:2818` compose
 * le chemin du dossier segment par segment. Ce sont les deux seules valeurs qu'un
 * client bâti sur le gel peut produire.
 *
 * La résolution vers les identifiants de base est faite par `resoudreLeChemin()`,
 * l'implémentation unique de la descente d'arborescence.
 */
export interface RangementDemande {
	readonly domaine: string;
	readonly dossier: string;
}

export type VisibiliteDeNote = (typeof enumDeVisibilite.enumValues)[number];
export type StatutDeNote = (typeof enumDeStatut.enumValues)[number];

/**
 * Ce qu'une modification porte — et l'absence y est une VALEUR : chaque champ est
 * optionnel, et son absence signifie « inchangé », jamais « vide ». D'où le corps
 * ENVELOPPÉ plutôt que porté nu : un corps vaut `unknown`, donc `undefined` en est une
 * valeur possible.
 */
export interface ModificationDeNote {
	readonly titre?: string;
	readonly rangement?: RangementDemande;
	readonly visibilite?: VisibiliteDeNote;
	readonly statut?: StatutDeNote;
	readonly etiquettes?: readonly string[];
	/** Présent : le corps est réécrit, ou retiré. Voir `CorpsSoumis`. */
	readonly corps?: CorpsSoumis;
	/** Présent : le type de fiche est posé, changé, ou retiré. Voir `FicheSoumise`. */
	readonly fiche?: FicheSoumise;
}

/**
 * Ce qu'une modification fait du type de fiche — trois états, pas deux.
 *
 * ABSENT : la note garde ce qu'elle porte — le cas d'une soumission composée sans
 * référentiel de types de fiche, et ce qui empêche un appelant qui ne sait rien des
 * fiches de dépouiller une note de son type.
 *
 * RETRAIT (`type: null`) : `proprietes_typees` DOIT passer à `null` DANS LA MÊME MISE
 * À JOUR — `notes_proprietes_exigent_un_type_de_fiche` refuse des propriétés sans
 * type, et n'écrire que l'une des deux colonnes fait échouer l'enregistrement sur une
 * contrainte incompréhensible.
 *
 * POSÉ : un nom INCONNU est refusé, jamais ignoré.
 */
export interface FicheSoumise {
	/** Le NOM du type de fiche, ou `null` — le type est RETIRÉ. */
	readonly type: string | null;
	readonly proprietes: Readonly<Record<string, string>>;
}

export interface CorpsSaisi {
	readonly saisi: unknown;
	/** Nie le retrait — voir `CorpsSoumis`, l'exclusion est portée par le type. */
	readonly supprime?: undefined;
}

/**
 * Ce qu'une modification fait du corps — deux gestes, et le second n'existe que pour
 * l'Opérationnel.
 *
 * `RG-NOT-02` : « le corps Référence est CANONIQUE. Le corps Opérationnel est
 * optionnel et ne peut exister sans Référence. » La règle est tenue à trois hauteurs :
 * le SCHÉMA (`NOT NULL`), le TYPE (`CorpsDeLaNote.reference` est `Document`) et la
 * GARDE de `enregistrerLaNote()`. LES DEUX MEMBRES SE DÉCLARENT L'UN L'AUTRE : sans
 * quoi `{ saisi, supprime }` serait assignable — un corps à la fois réécrit et retiré.
 */
export type CorpsSoumis =
	| CorpsSaisi
	/** Le corps est RETIRÉ — registre Opérationnel seul (`RG-NOT-02`). */
	| { readonly saisi?: undefined; readonly supprime: true };

/**
 * Ce qu'un formulaire peut porter — et le retrait n'en est pas.
 * `lireLaModification()` rend un corps SAISI ; le retrait est une action nommée à part
 * (`?/supprimer`) qui ne lit aucun champ, ce qui la rend insensible à ce que le client
 * compose.
 */
export interface ModificationSoumise extends Omit<ModificationDeNote, 'corps'> {
	readonly corps?: CorpsSaisi;
}

function estUnRetrait(corps: CorpsSoumis | undefined): boolean {
	/* La VALEUR, jamais la présence de la clé : `{ saisi, supprime: undefined }`
	   porte la clé sans porter l'intention, et `in` s'y tromperait. */
	return corps?.supprime === true;
}

/**
 * Ce qu'il faut d'un formulaire pour le lire : un accès par nom. `FormData` le
 * satisfait ; une table de correspondance aussi, ce qui rend la lecture éprouvable
 * SANS requête et sans serveur (`P-26`).
 */
export interface ChampsSoumis {
	get(nom: string): unknown;
}

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
 * Un champ textuel dont le blanc vaut l'absence. Le TITRE est la seule exception : un
 * titre blanc est REFUSÉ (`V-17:1596`, « une note sans titre est introuvable »).
 * Partout ailleurs, un champ caché vide ne porte aucun choix, et le lire comme un
 * choix inventerait une valeur que personne n'a soumise.
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
 * Les étiquettes soumises — « noms séparés par des virgules ». Les doublons sont
 * réduits : `etiquettes_de_note_pk` porte sur le couple note-étiquette, et deux fois
 * la même étiquette sur une note est INÉCRIVABLE.
 */
export function etiquettesSoumises(texte: string): readonly string[] {
	const retenues: string[] = [];
	for (const brut of texte.split(',')) {
		const libelle = brut.trim();
		if (libelle !== '' && !retenues.includes(libelle)) retenues.push(libelle);
	}
	return retenues;
}

export interface RefusDeForme {
	readonly motif: string;
}

export type LectureDuFormulaire =
	| { readonly recu: true; readonly modification: ModificationSoumise }
	| { readonly recu: false; readonly refus: RefusDeForme };

function refuser(motif: string): LectureDuFormulaire {
	return { recu: false, refus: { motif } };
}

/** Le nom du champ qui porte le corps en Markdown. */
export const CHAMP_CORPS_MARKDOWN = 'corps-markdown';

/**
 * La lecture d'une soumission — fonction PURE, hors base et hors serveur, donc
 * éprouvable sur une table de correspondance.
 *
 * LES DEUX CORPS SONT EXCLUSIFS : le premier porte le document sérialisé de l'éditeur,
 * le second le Markdown que `analyserMarkdown()` convertit — `ADR-004` en fait la
 * porte unique. Les recevoir tous les deux serait recevoir deux contenus pour un seul
 * corps ; le refus est nommé plutôt qu'arbitré par un ordre de lecture.
 *
 * @throws SyntaxError si le document sérialisé ne se lit pas
 * @throws MarkdownInvalide, DocumentInvalide si le Markdown ne se lit pas, ou si ce
 *   qu'il décrit n'est pas un document
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

	/* `RG-M05-09` se joue plus loin, sur les DROITS. Ici seule la forme est en
	   cause : un domaine sans dossier — ou l'inverse — ne désigne rien, et deviner
	   le second rangerait la note ailleurs que là où l'utilisateur l'a demandé. */
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

	/* LE TYPE DE FICHE EST LE SECOND CHAMP DONT LE VIDE EST UN CHOIX : c'est le
	   seul moyen de RETIRER un type, le sélecteur du gel portant « Aucun — note
	   simple » à valeur vide. `texteUtile()` confondrait le vide et l'absence, et
	   une note ne pourrait plus jamais redevenir simple. Les propriétés sans type
	   sont refusées AVANT la base (`ADR-003`). */
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

	/* LE VIDE DU CORPS N'EST PAS ARBITRÉ ICI : la porte unique du format le refuse
	   d'elle-même — « aucun contenu vide : l'absence de contenu s'écrit par
	   l'absence de la clé » (`ADR-003`). Un champ resté vide lève, et n'efface
	   rien. */
	let corps: { readonly saisi: unknown } | undefined;
	if (lus.corps.etat === 'texte') corps = { saisi: JSON.parse(lus.corps.valeur) };
	else if (lus.markdown.etat === 'texte') {
		/* LA FRONTIÈRE DE TRANSPORT — `markdownDeFormulaire()` défait la
		   normalisation des fins de ligne du sérialiseur de formulaire, et rien
		   d'autre. Dans l'analyseur, elle y rendrait inerte le refus de
		   `RG-M04-05`. */
		corps = { saisi: analyserMarkdown(markdownDeFormulaire(lus.markdown.valeur)) };
	}

	/* L'ABSENCE EST UNE CLÉ ABSENTE, PAS UNE CLÉ À `undefined` : le dépôt tient
	   `exactOptionalPropertyTypes`, et « aucun champ absent n'est modifié » est
	   donc porté par la FORME de l'objet, donc par le compilateur. */
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

export interface DemandeDEnregistrementDeNote {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly corpsSaisi: unknown;
	readonly maintenant: Date;
}

export interface DemandeDeModificationDeNote {
	readonly identifiant: string;
	readonly registre: Registre;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
	readonly modification: ModificationDeNote;
}

export interface EnregistrementFait {
	readonly identifiant: string;
	/** La version écrite, ou `null` — RG-M07-01, contenu inchangé. */
	readonly version: VersionAEcrire | null;
}

/**
 * L'issue d'une modification, une fois le DROIT SUR LA NOTE acquis. Le rangement
 * demandé a sa propre issue, et ce n'est pas `INTROUVABLE` : la note existe et
 * s'édite. Rendre « dossier interdit » plutôt que « dossier inconnu » apprendrait en
 * revanche l'existence d'un dossier hors périmètre — les deux causes rendent la MÊME
 * issue (`RG-ACC-04`).
 */
export type IssueDeModification =
	| { readonly sort: 'ecrit'; readonly fait: EnregistrementFait }
	| { readonly sort: 'rangement-introuvable' }
	/**
	 * Le type de fiche demandé n'existe pas dans cette instance. Comme le
	 * rangement, ce n'est PAS un 404, et le nom soumis est refusé plutôt
	 * qu'ignoré : l'ignorer enregistrerait une note simple là où l'utilisateur a
	 * choisi une fiche, sans qu'aucun écran ne le dise.
	 */
	| { readonly sort: 'fiche-introuvable' }
	/**
	 * `V-29:3308` : « les notes existantes qui n'ont pas de valeur ne seront pas
	 * bloquées, mais la valeur sera demandée à la PROCHAINE MODIFICATION ». Rien
	 * n'invalide donc une note au repos ; l'exigence naît à l'enregistrement.
	 */
	| {
			readonly sort: 'proprietes-manquantes';
			readonly manquantes: readonly ProprieteManquante[];
	  };

/**
 * Le dossier qu'un chemin affiché désigne — fonction pure. Le chemin soumis est en
 * noms affichés ; `resoudreLeChemin()` descend sur des segments d'ADRESSE. La
 * conversion est `identifiantLisible()`, celle de la composition d'adresse — un second
 * normaliseur rendrait deux dossiers différents pour un même nom.
 *
 * LA RACINE D'UN DOMAINE EST UNE DESTINATION VALABLE : son segment est retiré en tête.
 * Le chemin VIDE ne désigne rien.
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
 * La destination d'un déplacement, ou `null` — et `RG-M05-09` en entier : « déplacer
 * une note vers un autre dossier exige le droit de rédaction sur le dossier d'origine
 * ET sur le dossier de destination ». La première moitié est acquise avant d'arriver
 * ici.
 *
 * QUATRE CAUSES, UNE SEULE SORTIE : domaine inconnu, domaine AMBIGU, dossier inconnu,
 * dossier interdit. Le nom d'un domaine n'est unique que par univers.
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
 * Les deux colonnes de fiche qu'une modification demande, ou `null` si le nom du type
 * est inconnu. Le filtrage des clés est celui de la création, et c'est la MÊME
 * fonction (`retenirLesProprietes()`) : un second filtre écrirait deux définitions de
 * « propriété reconnue ».
 */
type FicheDeLaModification =
	| {
			readonly sort: 'fiche';
			readonly typeDeFicheId: string | null;
			readonly proprietes: unknown;
	  }
	| { readonly sort: 'introuvable' }
	| { readonly sort: 'manquantes'; readonly manquantes: readonly ProprieteManquante[] };

async function ficheDeLaModification(
	base: Base,
	demande: FicheSoumise
): Promise<FicheDeLaModification> {
	if (demande.type === null) return { sort: 'fiche', typeDeFicheId: null, proprietes: null };
	const [type] = await base
		.select({ id: typesDeFiche.id })
		.from(typesDeFiche)
		.where(eq(typesDeFiche.nom, demande.type))
		.limit(1);
	if (type === undefined) return { sort: 'introuvable' };
	const champs = await base
		.select({
			cle: champsDeTypeDeFiche.cle,
			nom: champsDeTypeDeFiche.nom,
			obligatoire: champsDeTypeDeFiche.obligatoire
		})
		.from(champsDeTypeDeFiche)
		.where(eq(champsDeTypeDeFiche.typeDeFicheId, type.id))
		/* LE TRI ACCORDE DEUX ÉCRANS : `lireTypesDeFiche()` trie par
		   `typesDeFiche.ordre, champsDeTypeDeFiche.ordre`, et c'est dans cet ordre
		   que l'éditeur peint les champs. Sans le même tri ici, le rédacteur lirait
		   ses champs dans un ordre et ses refus dans un autre. */
		.orderBy(champsDeTypeDeFiche.ordre);
	const retenues = retenirLesProprietes(
		demande.proprietes,
		champs.map((c) => c.cle)
	);
	/* Le contrôle est celui de la création, et c'est la MÊME fonction : deux
	   définitions de « propriété renseignée » divergeraient. */
	const manquantes = proprietesObligatoiresManquantes(champs, retenues);
	if (manquantes.length > 0) return { sort: 'manquantes', manquantes };
	return {
		sort: 'fiche',
		typeDeFicheId: type.id,
		proprietes: Object.keys(retenues).length === 0 ? null : retenues
	};
}

/**
 * Le contexte que `base.transaction()` remet à son bloc — son type est DÉRIVÉ de
 * la signature, jamais forcé : une étiquette créée hors de la transaction qui
 * écrit sa liaison survivrait à l'annulation de celle-ci.
 */
type Transaction = Parameters<Parameters<Base['transaction']>[0]>[0];

/**
 * La purge du plafond de versions — `RG-M07-03`.
 *
 * ELLE EST DANS LA TRANSACTION D'ENREGISTREMENT, ET NON DANS UNE TÂCHE DE FOND : le
 * produit n'a aucun ordonnanceur. Elle est sous la même transaction que l'insertion
 * qui vient de creuser l'excédent. Le déclencheur d'immuabilité ne porte que l'UPDATE ;
 * ce DELETE est légitime. Rien ne disparaît sous un lecteur : RESTAURER est un
 * ENREGISTREMENT du corps ancien.
 */
async function purgerLesVersions(
	tx: Transaction,
	noteId: string,
	plafond: number
): Promise<number> {
	const presentes = await tx
		.select({ numero: versions.numero })
		.from(versions)
		.where(eq(versions.noteId, noteId));
	const excedent = numerosExcedentaires(
		presentes.map((v) => v.numero),
		plafond
	);
	if (excedent.length === 0) return 0;
	await tx
		.delete(versions)
		.where(and(eq(versions.noteId, noteId), inArray(versions.numero, excedent)));
	return excedent.length;
}

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
 * Les deux corps après enregistrement. Quand aucun corps n'est soumis, les deux
 * d'après sont ceux d'avant, relus par la porte unique du format : `contenuModifie()`
 * les compare alors à eux-mêmes et rend « inchangé », donc aucune version n'est écrite
 * (`RG-M07-01`).
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
	   `empreinteDuCorps()` lui en donne un : la version qui suit capture donc bien
	   un changement, et l'historique porte le retrait. La Référence n'a pas ce
	   geste (`RG-NOT-02`), et le type ne le lui offre pas. */
	if (estUnRetrait(corps)) return { reference, operationnel: null };

	/* Le document REÉCRIT par ProseMirror, jamais celui reçu — porte 3. */
	const document = documentDepuisNoeud(noeudDepuisDocument(corps.saisi));
	return registre === 'operationnel'
		? { reference, operationnel: document }
		: { reference: document, operationnel };
}

/**
 * L'enregistrement d'une note — le titre, le rangement, les métadonnées, les
 * étiquettes, le corps, et la version que `RG-M07-02` exige.
 *
 * TROIS PORTES SUCCESSIVES, ET AUCUNE N'EST FACULTATIVE :
 *
 *  1. la RÉSOLUTION — `resoudreLEditionDUneNote()`, la même que le chargeur : un
 *     appelant sans droit reçoit `INTROUVABLE` avant toute écriture. C'est aussi la
 *     première moitié de `RG-M05-09`, le droit sur le dossier D'ORIGINE.
 *  2. le FORMAT — `noeudDepuisDocument()` appelle `analyserDocument` puis contrôle que
 *     l'éditeur SAIT le porter. Un document mal formé est refusé, jamais réparé.
 *  3. l'ALLER-RETOUR — le document écrit est celui que ProseMirror rend, non celui
 *     qu'on a reçu : deux écritures d'un même document ne peuvent pas cohabiter.
 *
 * L'IDENTIFIANT NE BOUGE JAMAIS, quoi qu'il advienne du titre (`RG-M03-03`). TOUTES
 * LES ÉCRITURES SONT DANS UNE SEULE TRANSACTION : une note enregistrée sans sa version
 * serait un historique amputé sans témoin. `modifieLe` SUIT L'ENREGISTREMENT, PAS LE
 * SEUL CORPS — une note dont le titre a changé sans que sa date bouge serait une date
 * qui ment ; une soumission qui ne porte RIEN n'écrit rien. PUIS L'INDEX, APRÈS la
 * transaction et jamais dedans.
 *
 * @throws DocumentInvalide, EditeurIncapable — le corps saisi est refusé
 * @throws l'erreur de la tâche du moteur : la note est alors ÉCRITE et non indexée, et
 *   l'appelant reçoit l'échec plutôt qu'un silence.
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
	   laissé buter sur `NOT NULL`, pour que la cause soit nommée. Le refus emprunte
	   la sortie unique de la famille `/notes/…` : rien n'a été écrit. */
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
		const resolue = await ficheDeLaModification(base, modification.fiche);
		if (resolue.sort === 'introuvable') {
			return { trouve: true, ressource: { sort: 'fiche-introuvable' } };
		}
		if (resolue.sort === 'manquantes') {
			return {
				trouve: true,
				ressource: { sort: 'proprietes-manquantes', manquantes: resolue.manquantes }
			};
		}
		fiche = { typeDeFicheId: resolue.typeDeFicheId, proprietes: resolue.proprietes };
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

	/* LE PLAFOND EST LU À CHAQUE ENREGISTREMENT, jamais retenu : V-33 annonce
	   l'effet « dès le prochain enregistrement d'une note », et un plafond
	   mémorisé au démarrage rendrait cette phrase fausse jusqu'au redémarrage. */
	const plafondDeVersions = (await lireConfiguration(base)).versionsMax;

	/* La version capture ce que l'enregistrement PRODUIT (`RG-M07-02`) : le titre
	   passé est celui d'APRÈS. */
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
	   sans les propriétés laisserait celles de l'ancien type sur la note ; retirer
	   le type sans annuler les propriétés ferait échouer la mise à jour sur
	   `notes_proprietes_exigent_un_type_de_fiche`. */
	if (fiche !== null) {
		colonnes.typeDeFicheId = fiche.typeDeFicheId;
		colonnes.proprietesTypees = fiche.proprietes;
	}
	/**
	 * LA DATE DE CORPS NE BOUGE QUE SI LE CORPS A BOUGÉ — `RG-M06-09` : « seule une
	 * modification EFFECTIVE du corps Référence » déclenche le signal de
	 * désynchronisation. La comparaison est celle d'`empreinteDuCorps()`, la même dont
	 * `RG-M07-01` décide s'il faut écrire une version : un second comparateur rendrait
	 * possible une note qui porte une version sans en porter la date.
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
		/* LA PURGE SUIT L'INSERTION, DANS LA MÊME TRANSACTION, ET ELLE TOURNE MÊME
		   QUAND AUCUNE VERSION N'A ÉTÉ ÉCRITE. V-33 engage « le prochain
		   ENREGISTREMENT d'une note », pas la capture d'une version, et un
		   enregistrement qui ne change que le titre n'en écrit aucune. */
		await purgerLesVersions(tx, ligne.id, plafondDeVersions);
		/* LA LISTE SOUMISE REMPLACE LA LISTE COURANTE : la liaison est vidée puis
		   réécrite dans l'ordre soumis. Le rang est l'ordre de saisie —
		   `etiquettes_de_note_ordre_unique` en fait une colonne obligatoire, et
		   l'ordre affiché n'est pas l'ordre alphabétique. */
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
	   le document est SOUMIS à l'index et la tâche n'est pas attendue. Quand cet
	   appel rend, la soumission est faite — un moteur arrêté ou refusant lève ici —
	   mais la note n'est pas encore trouvable. Ne rien conclure d'autre. */
	await entretenirLIndex(base, client, [demande.identifiant]);

	return {
		trouve: true,
		ressource: { sort: 'ecrit', fait: { identifiant: demande.identifiant, version } }
	};
}

/**
 * L'enregistrement d'un seul corps — la voie de l'éditeur de l'Opérationnel. Elle ne
 * porte aucune écriture en propre : elle compose une modification qui ne touche que le
 * corps et la délègue à `enregistrerLaNote()`.
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
	/* Cette voie ne soumet AUCUN rangement : l'issue ne peut être qu'« écrit ». Le
	   cas contraire est traité quand même — une supposition se périme en silence. */
	if (issue.ressource.sort !== 'ecrit') return INTROUVABLE;
	return { trouve: true, ressource: issue.ressource.fait };
}

export interface DatesDesDeuxRegistres {
	readonly referenceModifieLe: Date;
	/** `null` : la note n'a pas de registre Opérationnel (`RG-NOT-02`). */
	readonly operationnelModifieLe: Date | null;
}

/**
 * `RG-M06-08` — le signal « à resynchroniser », et son unique définition : « le
 * registre Opérationnel est signalé "à resynchroniser" SI ET SEULEMENT SI le corps
 * Référence a été modifié après la dernière mise à jour du corps Opérationnel »
 * (`CDC:810`). Trois choses s'y lisent :
 *
 *  - la comparaison porte sur les DEUX DATES DE CORPS, jamais sur `modifieLe`, qu'un
 *    simple renommage fait bouger — ce serait `RG-M06-09` violée ;
 *  - « après » est STRICT : deux dates égales ne désynchronisent pas ;
 *  - sans registre Opérationnel, il n'y a rien à resynchroniser.
 *
 * La route de V-14 porte le même prédicat en ligne : deux définitions concurrentes
 * d'un même signal, ce que `P-01` nomme comme mode de défaillance.
 */
export function operationnelDesynchronise(dates: DatesDesDeuxRegistres): boolean {
	if (dates.operationnelModifieLe === null) return false;
	return dates.referenceModifieLe.getTime() > dates.operationnelModifieLe.getTime();
}

/**
 * Les colonnes qu'une attestation de resynchronisation écrit, et rien d'autre : le
 * type est la garantie — il ne déclare ni corps, ni titre, ni `modifieLe`, ni
 * `verifieLe`.
 *
 * `RG-M06-10` : « Marquer comme resynchronisé » n'est PAS une modification. Ni
 * `modifieLe` — une date qui bougerait sans que rien n'ait changé mentirait à la
 * fraîcheur —, ni `verifieLe`, `RG-M06-05` faisant de la vérification une action
 * DISTINCTE.
 */
export interface ColonnesDUneResynchronisation {
	readonly corpsOperationnelModifieLe: Date;
}

export interface DemandeDeResynchronisation {
	readonly identifiant: string;
	readonly identite: Identite;
	readonly contexte: ContexteDeLecture;
	readonly maintenant: Date;
}

export interface ResynchronisationFaite {
	readonly identifiant: string;
	readonly etaitDesynchronise: boolean;
}

/**
 * « Marquer comme resynchronisé » — l'attestation sans réédition.
 *
 * Le droit est acquis par la MÊME résolution que l'éditeur : qui peut écrire
 * l'Opérationnel peut attester qu'il tient toujours.
 *
 * SANS REGISTRE OPÉRATIONNEL, L'ATTESTATION N'A PAS D'OBJET :
 * `notes_operationnel_date_coherente` l'interdit, et le gel ne montre l'action qu'au
 * cas `desync` (`V-18:1954`). L'index n'est pas entretenu : une attestation n'écrit
 * aucun des cinq champs que l'entretien projette.
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
 * « Supprimer la version opérationnelle » — elle passe par la voie d'écriture UNIQUE :
 * la demande est un retrait de corps, et `enregistrerLaNote()` en fait ce qu'il fait
 * de toute écriture de corps.
 *
 * LA NOTE SURVIT : « seul le registre Opérationnel est supprimé ; la Référence, les
 * métadonnées, l'historique et les liens sont intacts » (`V-18:2007-2010`).
 *
 * @throws rien de ce que lève l'enregistrement d'un corps saisi : un retrait ne passe
 *   par aucune porte de format.
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
	/* Aucun rangement n'est soumis : l'issue ne peut être qu'« écrit ». */
	if (issue.ressource.sort !== 'ecrit') return INTROUVABLE;
	return { trouve: true, ressource: issue.ressource.fait };
}

export interface PieceJointeResolue {
	readonly nom: string;
	readonly tailleOctets: number;
	readonly typeMedia: string;
	readonly note: string;
	/**
	 * Les deux clés dont le chemin de l'entrepôt est la fonction :
	 * `../fichiers/entrepot.ts` ne stocke aucun chemin, il le DÉRIVE de
	 * `<note_id>/<piece_id>`. Elles sortent donc d'ici, c'est-à-dire APRÈS la
	 * résolution de visibilité — le chemin des octets n'est pas formable sans avoir
	 * traversé `noteLisible()`, ce qui rend `RG-M04-08` structurel.
	 */
	readonly id: string;
	readonly noteId: string;
}

export interface DemandeDePieceJointe {
	readonly identifiant: string;
	readonly fichier: string;
	readonly identite: Identite;
}

/**
 * `RG-M04-08` — « une pièce jointe d'une note interne n'est jamais servie en
 * anonyme » ; « le contrôle porte sur la NOTE, pas sur le fichier ».
 *
 * C'est pourquoi cette adresse est une ROUTE et jamais un fichier statique : un
 * fichier servi par le frontal ne rejouerait aucun droit, et une pièce déplacée d'une
 * note interne à une note publique changerait de visibilité sans que rien ne le sache.
 * Les octets vivent dans l'entrepôt, pas en base, et l'ordre reste celui d'`ADR-007` :
 * la visibilité d'abord, l'entrepôt ensuite.
 */

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
 * La décision, extraite de la requête : la branche « résolue » n'est exercée par aucun
 * état du dépôt, la table étant vide. Extraite, elle est PURE, donc éprouvable dans
 * ses deux polarités. `noteLisible()` est la composition des deux filtres — les
 * employer séparément est « le moyen le plus simple de publier le corpus interne ».
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

/**
 * Le compte qui écrit, tel que la table le porte. `versions.auteur_id` référence
 * `comptes` en `RESTRICT` — « effacer un compte ne doit pas effacer la trace de
 * qui a écrit ».
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
 * La capacité d'écrire sur un dossier — aucune règle écrite ici :
 * `resoudreDroitDeDossier()` remonte l'arbre, `capacites()` répond par la table
 * de CDC §2.3.
 */
export async function peutEcrireSurLeDossier(
	base: Base,
	identite: Identite,
	dossierId: string
): Promise<boolean> {
	const index = await lireIndexDesDroits(base, identite);
	return capacites(resoudreDroitDeDossier(identite, dossierId, index)).ecrireDesNotes;
}
