/**
 * LES SIGNETS — LA RÉSOLUTION D'UNE ADRESSE DE SIGNETS, DROITS COMPRIS.
 *
 * Ce module est le seul point où les trois adresses de signets
 * (`docs/routes.md` §3.3, `:128-130`) deviennent une ressource, ou rien :
 *
 *   /univers/{univers}/{domaine}/signets                      V-22
 *   /univers/{univers}/{domaine}/signets/nouveau              V-23 création
 *   /univers/{univers}/{domaine}/signets/{identifiant}/modifier  V-23 édition
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SIGNET EST UNE NOTE QUI PORTE UNE ADRESSE WEB — IL N'Y A PAS DE TABLE
 *
 * `RG-NOT-01`, et le vocabulaire contractuel de `CLAUDE.md` §3 : « Fiche — une
 * note à laquelle un type structuré a été attribué. Ce n'est pas un objet
 * séparé », et le signet non plus. `estSignet()` de `seeds/corpus.ts` en est le
 * prédicat — `note.type === 'Signet'` — ; son équivalent en base est la
 * jointure sur `types_de_note.identifiant = 'signet'`, et les deux colonnes que
 * la migration 002 porte sur `notes` : `signet_adresse` et `signet_ajoute_le`
 * (`src/lib/base/schema.ts:410-411`). Aucune table `signets` n'est lue, aucune
 * n'est nécessaire.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE NE RÉUTILISE PAS `lireNotes()` DE `T-030`
 *
 * `ADR-006` interdit en propres termes « toute route qui reçoit une liste puis
 * la filtre. Le filtre est dans la requête, pas après elle. » Or
 * `lireNotes(base, contexte)` lit la table ENTIÈRE et n'accepte aucun
 * périmètre : l'appeler puis écarter les notes interdites serait exactement la
 * faute que l'ADR nomme. Le périmètre est donc INJECTÉ dans la requête
 * ci-dessous, et `src/lib/donnees/lecture.ts` — qui appartient à `T-030` et
 * n'est pas modifié — est réemployé pour tout ce qui n'est pas le filtre :
 * `extraitDuCorps`, `joursEcoules`, les deux conversions de date, les chemins
 * de dossier, les étiquettes et les pièces jointes.
 *
 * La FORME rendue reste `interface Note` de `seeds/corpus.ts`, parce que c'est
 * elle que les vues gelées déclarent en propriété (`V-22.svelte:64`,
 * `V-23.svelte:128`). Aucun type n'est créé ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique (`T-011`). Ce
 * module l'APPELLE — `indexerLesDroits`, `perimetreDeLecture`,
 * `resoudreDroitDeDossier`, `capacites`, `resoudre` — et ne recopie aucune de
 * ses règles. `RG-DRO-01` (le plus proche l'emporte), `RG-DRO-02` (fermeture
 * par défaut), `RG-DRO-03` (l'administrateur), `RG-DRO-04` (le périmètre
 * anonyme) et `RG-DRO-05` (la racine couvre l'arbre) restent là-bas.
 *
 * ET LA FRAÎCHEUR NON PLUS (P-01) : `niveauFraicheur()` de
 * `src/lib/fraicheur.ts` est appelée, jamais réécrite.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * REFUS ET INEXISTENCE SORTENT PAR LE MÊME `return` — ADR-007
 *
 * Toutes les issues d'échec de ce module rendent `INTROUVABLE`, LE MÊME OBJET
 * gelé de `resolution.ts`. Il n'existe ici ni variante « interdit », ni champ
 * « raison », ni code d'erreur : un univers qui n'existe pas, un domaine dont
 * le module Signets est éteint, un domaine hors périmètre et un signet interdit
 * empruntent le même chemin, et l'appelant n'a rien à quoi se raccrocher pour
 * les distinguer. C'est `RG-ACC-04`, et c'est le type qui le garantit.
 */
import { and, eq, inArray } from 'drizzle-orm';
import type { Base } from '../base/acces';
import {
	comptes,
	domaines,
	dossiers,
	droitsDeDossier,
	modulesDeDomaine,
	notes,
	typesDeFiche,
	typesDeNote,
	univers
} from '../base/schema';
import {
	INTROUVABLE,
	capacites,
	indexerLesDroits,
	perimetreContient,
	perimetreDeLecture,
	resoudre,
	resoudreDroitDeDossier,
	type DossierDeLArbre,
	type DroitExplicite,
	type Identite,
	type IndexDesDroits,
	type NotePourPerimetre,
	type Perimetre,
	type Resolution
} from '../droits/resolution';
import { niveauFraicheur } from '../fraicheur';
import {
	dateCourteDInstant,
	dateCourteDIso,
	extraitDuCorps,
	joursEcoules,
	lireCheminsDeDossier,
	lireEtiquettesParNote,
	lirePiecesJointesParNote,
	lireSeuils,
	type ContexteDeLecture
} from './lecture';
import type { Domaine, Note, TypeDeFiche, TypeDeNote } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════════════ Les segments ═══════ */

/**
 * Les deux segments d'adresse qui désignent le rangement — tels que
 * `src/lib/rangement/adresses.ts` les compose, et tels que `univers.identifiant`
 * et `domaines.identifiant` les portent en base (migration 002, `:140` et
 * `:170`). Ils sont comparés à la colonne, jamais recalculés depuis le nom :
 * l'identifiant lisible est PERSISTÉ, et `RG-M12-11` le veut stable même après
 * un renommage.
 */
export interface SegmentsDeRangement {
	readonly univers: string;
	readonly domaine: string;
}

/** Le rangement qu'une adresse de signets désigne, quand elle en désigne un. */
export interface RangementDeSignets {
	readonly domaineId: string;
	readonly domaine: Domaine;
}

/* ═══════════════════════════════════════════════════ Le rangement ══════ */

/**
 * Le domaine que les deux segments désignent, ou `null`.
 *
 * `RG-STR-02` — l'identifiant d'un domaine est unique AU SEIN DE SON UNIVERS :
 * la clause porte donc sur les DEUX segments, et la contrainte
 * `domaines_identifiant_par_univers_unique` garantit qu'il n'y a qu'une ligne.
 * C'est aussi ce qui rend la clause de désambiguïsation de `RG-M03-02` sans
 * objet (E-09, `docs/routes.md` §5.3) : la forme canonique n'est jamais ambiguë.
 */
export async function lireLeRangement(
	base: Base,
	segments: SegmentsDeRangement
): Promise<RangementDeSignets | null> {
	const lignes = await base
		.select({
			domaineId: domaines.id,
			nom: domaines.nom,
			universNom: univers.nom,
			couleur: domaines.couleur
		})
		.from(domaines)
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.where(
			and(eq(univers.identifiant, segments.univers), eq(domaines.identifiant, segments.domaine))
		)
		.limit(1);

	const ligne = lignes[0];
	if (ligne === undefined) return null;
	return {
		domaineId: ligne.domaineId,
		domaine: { nom: ligne.nom, univers: ligne.universNom, couleur: ligne.couleur } as Domaine
	};
}

/**
 * Le module Signets est-il activé sur ce domaine ?
 *
 * `RG-STR-06`, `P-04`, et `docs/routes.md:134` qui en tire la conséquence pour
 * l'adresse : « une route de module désactivé (`…/signets` sur un domaine sans
 * module Signets) rend 404 V-26, pas une page vide — cohérent avec RG-ACC-04 et
 * avec le point dur n° 7 ». L'activation n'est pas décorative : elle décide de
 * l'existence de l'adresse.
 */
export async function moduleSignetsActive(base: Base, domaineId: string): Promise<boolean> {
	const lignes = await base
		.select({ module: modulesDeDomaine.module })
		.from(modulesDeDomaine)
		.where(and(eq(modulesDeDomaine.domaineId, domaineId), eq(modulesDeDomaine.module, 'signets')))
		.limit(1);
	return lignes.length > 0;
}

/* ═══════════════════════════════════════════════════ Les droits ════════ */

/**
 * L'arborescence du domaine et les droits explicites qui la couvrent, indexés
 * pour `resolution.ts`.
 *
 * L'INDEX SE BORNE AU DOMAINE, ET LE SCHÉMA LE PERMET : la contrainte
 * `dossiers_parent_meme_domaine` (`schema.ts:216`) interdit qu'un dossier ait
 * un parent d'un autre domaine. La chaîne d'ancêtres d'un dossier du domaine
 * est donc entièrement dans le domaine, et `RG-DRO-01` comme `RG-DRO-05`
 * s'appliquent à l'identique sur cet index restreint. En lire davantage
 * n'ajouterait aucun droit et coûterait la table entière.
 *
 * Les droits ne sont lus QUE pour le compte appelant : un anonyme n'en a pas
 * (`RG-DRO-04`), et charger ceux des autres comptes exposerait la table des
 * droits à une requête qui n'en a pas besoin.
 */
export async function indexerLeDomaine(
	base: Base,
	domaineId: string,
	identite: Identite
): Promise<{ readonly index: IndexDesDroits; readonly dossiers: readonly DossierDeLArbre[] }> {
	const lignes = await base
		.select({ id: dossiers.id, parentId: dossiers.parentId })
		.from(dossiers)
		.where(eq(dossiers.domaineId, domaineId));

	const arbre: readonly DossierDeLArbre[] = lignes.map((d) => ({
		id: d.id,
		parentId: d.parentId
	}));

	let explicites: readonly DroitExplicite[] = [];
	if (identite.type === 'authentifie' && arbre.length > 0) {
		const posees = await base
			.select({
				dossierId: droitsDeDossier.dossierId,
				compteId: droitsDeDossier.compteId,
				droit: droitsDeDossier.droit
			})
			.from(droitsDeDossier)
			.where(
				and(
					eq(droitsDeDossier.compteId, identite.compteId),
					inArray(
						droitsDeDossier.dossierId,
						arbre.map((d) => d.id)
					)
				)
			);
		explicites = posees;
	}

	return { index: indexerLesDroits(arbre, explicites), dossiers: arbre };
}

/**
 * Les notes du domaine, réduites à ce que le périmètre anonyme a besoin de
 * savoir (`RG-DRO-04`, `interface NotePourPerimetre`). Trois colonnes, pas une
 * de plus : `RG-ACC-01` veut le filtrage « au plus près de la donnée », et
 * charger un titre pour décider d'un dossier serait déjà trop.
 */
export async function lireLesNotesPourPerimetre(
	base: Base,
	domaineId: string
): Promise<readonly NotePourPerimetre[]> {
	const lignes = await base
		.select({
			dossierId: notes.dossierId,
			visibilite: notes.visibilite,
			statut: notes.statut
		})
		.from(notes)
		.where(eq(notes.domaineId, domaineId));
	return lignes.map((n) => ({
		dossierId: n.dossierId,
		visibilite: n.visibilite,
		statut: n.statut
	}));
}

/**
 * LE DOMAINE EST-IL LISIBLE ? — au moins un de ses dossiers dans le périmètre.
 *
 * Ce n'est pas une règle de droit nouvelle, c'est la lecture de `RG-DRO-02`
 * appliquée à une page de domaine : « en l'absence de tout droit explicite sur
 * le dossier ou l'un de ses ancêtres, aucun accès ». Un appelant dont AUCUN
 * dossier du domaine n'est lisible n'a rien à y voir, et `docs/routes.md` §5.5
 * lui rend 404 pour la famille `/univers/…`. À l'inverse, un droit posé sur un
 * seul sous-dossier ouvre bien le domaine : `RG-DRO-05` ne réserve pas l'accès
 * aux porteurs d'un droit sur la racine, et exiger la racine ici FERMERAIT une
 * porte que les droits ouvrent.
 *
 * Un domaine SANS dossier ne peut satisfaire personne, et c'est cohérent :
 * `RG-STR-03` fait de tout dossier le porteur de ses notes, donc un domaine
 * sans dossier n'a pas de note, donc pas de signet.
 */
export function domaineLisible(
	perimetre: Perimetre,
	dossiersDuDomaine: readonly DossierDeLArbre[]
): boolean {
	if (perimetre.tout) return dossiersDuDomaine.length > 0;
	return dossiersDuDomaine.some((d) => perimetreContient(perimetre, d.id));
}

/**
 * LE DROIT DE RÉDACTION DANS LE DOMAINE — `capacites().ecrireDesNotes`, sur au
 * moins un dossier.
 *
 * La granularité est celle du GEL, et il faut le dire : `V-22` n'a qu'un
 * réglage `droits` pour la page entière (`verif/scenarios/V-22.json`,
 * contrôle « Droits »), et `V-23` n'en a aucun. Le droit, lui, est par dossier
 * (CDC §2.3). La page répond donc à la question que la page pose : « cet
 * appelant peut-il écrire un signet dans ce domaine ? ».
 *
 * `P-09` — l'action interdite n'est pas rendue — se joue ici : c'est ce booléen
 * que le chargeur traduit en `droits: 'lecture'`, et la vue n'émet alors aucune
 * action d'écriture (`V-22.svelte:71-82`, ARB-040).
 */
export function ecritureDansLeDomaine(
	identite: Identite,
	index: IndexDesDroits,
	dossiersDuDomaine: readonly DossierDeLArbre[]
): boolean {
	return dossiersDuDomaine.some(
		(d) => capacites(resoudreDroitDeDossier(identite, d.id, index)).ecrireDesNotes
	);
}

/* ═══════════════════════════════════════════════════ Les notes ═════════ */

/** La forme brute d'une ligne de note, telle que la requête ci-dessous la rend. */
interface LigneDeNote {
	readonly identifiant: string;
	readonly titre: string;
	readonly corpsReference: unknown;
	readonly corpsOperationnel: unknown;
	readonly typeNom: string;
	readonly typeFicheNom: string | null;
	readonly universNom: string;
	readonly domaineNom: string;
	readonly dossierId: string;
	readonly auteurNom: string;
	readonly visibilite: 'interne' | 'publique';
	readonly statut: 'brouillon' | 'publiee';
	readonly modifieLe: Date;
	readonly verifieLe: Date | null;
	readonly consultations: number;
	readonly signetAdresse: string | null;
	readonly signetAjouteLe: string | null;
}

/**
 * Une ligne de `notes` rendue dans la forme de `interface Note`.
 *
 * C'est la même transcription que `lireNotes()` de `T-030`, aux mêmes règles :
 * la fraîcheur se lit sur la dernière vérification et à défaut sur la dernière
 * modification (`RG-M06-01`) ; `pj` est le compte RÉEL de la table, jamais le
 * chiffre du jeu de semence (`P-02`) ; les étiquettes sont triées par libellé,
 * faute de colonne de rang ; et les trois clés optionnelles sont OMISES quand
 * la colonne est nulle, non posées à `undefined`.
 *
 * Elle est écrite ici et non appelée là-bas parce que `lireNotes()` n'accepte
 * aucun périmètre et que `src/lib/donnees/lecture.ts` n'est pas modifiable par
 * ce lot. La duplication est bornée à cette fonction, et tout ce qui pouvait
 * être réemployé l'est.
 */
export function noteDepuisLaLigne(
	ligne: LigneDeNote,
	contexte: ContexteDeLecture,
	chemins: ReadonlyMap<string, string>,
	etiquettes: ReadonlyMap<string, readonly string[]>,
	pieces: ReadonlyMap<string, number>
): Note {
	const reference = ligne.verifieLe ?? ligne.modifieLe;
	const rendu: Record<string, unknown> = {
		id: ligne.identifiant,
		titre: ligne.titre,
		extrait: extraitDuCorps(ligne.corpsReference),
		type: ligne.typeNom as TypeDeNote,
		univers: ligne.universNom,
		domaine: ligne.domaineNom,
		dossier: chemins.get(ligne.dossierId) ?? '',
		auteur: ligne.auteurNom,
		fraicheur: niveauFraicheur(joursEcoules(reference, contexte.maintenant), contexte.seuils),
		jours: joursEcoules(ligne.modifieLe, contexte.maintenant),
		revise: ligne.verifieLe === null ? null : dateCourteDInstant(ligne.verifieLe),
		vues: ligne.consultations,
		pj: pieces.get(ligne.identifiant) ?? 0,
		brouillon: ligne.statut === 'brouillon',
		visibilite: ligne.visibilite === 'publique' ? 'Publique' : 'Interne',
		operationnel: ligne.corpsOperationnel !== null,
		etiquettes: etiquettes.get(ligne.identifiant) ?? []
	};
	if (ligne.typeFicheNom !== null) rendu['typeFiche'] = ligne.typeFicheNom as TypeDeFiche;
	if (ligne.signetAdresse !== null) rendu['url'] = ligne.signetAdresse;
	if (ligne.signetAjouteLe !== null) rendu['ajoute'] = dateCourteDIso(ligne.signetAjouteLe);
	return rendu as unknown as Note;
}

/**
 * Les notes du domaine que l'appelant peut lire — LE PÉRIMÈTRE EST DANS LA
 * CLAUSE `where`, pas dans un filtre d'après-coup (`ADR-006`).
 *
 * Deux filtres se composent, et les employer séparément est le moyen le plus
 * simple de publier le corpus interne (`noteLisible()` de `resolution.ts` le
 * dit dans les mêmes termes) :
 *
 *   1. LE DOSSIER — `dossier_id` dans le périmètre. `perimetre.tout` est
 *      réservé à l'administrateur (`RG-DRO-03`) et ne pose aucune clause.
 *   2. LA NOTE, en anonyme seulement — `visibilite = publique AND statut =
 *      publiee`, « sans exception ni chemin dérogatoire » (`ADR-006`). Un
 *      dossier du périmètre anonyme contient presque toujours des notes
 *      internes : omettre ce second filtre les publierait toutes.
 *
 * Un périmètre VIDE ne produit aucune requête : `inArray` sur une liste vide
 * est une clause dégénérée selon les dialectes, et une liste vide a une réponse
 * connue — aucune note.
 */
export async function lireLesNotesDuDomaine(
	base: Base,
	contexte: ContexteDeLecture,
	domaineId: string,
	perimetre: Perimetre,
	identite: Identite
): Promise<readonly Note[]> {
	const clauses = [eq(notes.domaineId, domaineId)];
	if (!perimetre.tout) {
		const permis = [...perimetre.dossiers];
		if (permis.length === 0) return [];
		clauses.push(inArray(notes.dossierId, permis));
	}
	if (identite.type === 'anonyme') {
		clauses.push(eq(notes.visibilite, 'publique'));
		clauses.push(eq(notes.statut, 'publiee'));
	}

	const lignes = await base
		.select({
			identifiant: notes.identifiant,
			titre: notes.titre,
			corpsReference: notes.corpsReference,
			corpsOperationnel: notes.corpsOperationnel,
			typeNom: typesDeNote.nom,
			typeFicheNom: typesDeFiche.nom,
			universNom: univers.nom,
			domaineNom: domaines.nom,
			dossierId: notes.dossierId,
			auteurNom: comptes.nom,
			visibilite: notes.visibilite,
			statut: notes.statut,
			modifieLe: notes.modifieLe,
			verifieLe: notes.verifieLe,
			consultations: notes.compteurDeConsultations,
			signetAdresse: notes.signetAdresse,
			signetAjouteLe: notes.signetAjouteLe
		})
		.from(notes)
		.innerJoin(typesDeNote, eq(notes.typeDeNoteId, typesDeNote.id))
		.innerJoin(domaines, eq(notes.domaineId, domaines.id))
		.innerJoin(univers, eq(domaines.universId, univers.id))
		.innerJoin(comptes, eq(notes.auteurId, comptes.id))
		.leftJoin(typesDeFiche, eq(notes.typeDeFicheId, typesDeFiche.id))
		.where(and(...clauses))
		.orderBy(notes.identifiant);

	const chemins = await lireCheminsDeDossier(base);
	const etiquettes = await lireEtiquettesParNote(base);
	const pieces = await lirePiecesJointesParNote(base);

	return lignes.map((l) => noteDepuisLaLigne(l, contexte, chemins, etiquettes, pieces));
}

/* ═══════════════════════════════════════════════ La résolution ═════════ */

/** Ce qu'une adresse de signets rapporte quand elle rapporte quelque chose. */
export interface AccesAuxSignets {
	/** Le domaine, dans la forme que la coquille et le fil attendent. */
	readonly domaine: Domaine;
	/** Les notes LISIBLES du domaine, dont ses signets. */
	readonly notes: readonly Note[];
	/** L'appelant peut-il écrire un signet dans ce domaine ? (`P-09`) */
	readonly ecriture: boolean;
}

/**
 * LE CHEMIN UNIQUE — `ADR-007`. Quatre raisons de ne rien rapporter, un seul
 * `INTROUVABLE`, et aucune trace de la raison dans la valeur rendue :
 *
 *   · les segments ne désignent aucun domaine ;
 *   · le module Signets est éteint sur ce domaine (`RG-STR-06`, `routes.md:134`) ;
 *   · aucun dossier du domaine n'est dans le périmètre de l'appelant ;
 *   · `exigeEcriture` et l'appelant n'a pas le droit de rédaction
 *     (`docs/routes.md:129-130`, « connecté + rédacteur »).
 *
 * `exigeEcriture` n'est pas un régime de refus séparé : c'est le niveau d'accès
 * que §3 déclare pour les deux adresses du formulaire, et le refus sort par le
 * même `return` que l'inexistence.
 */
export async function resoudreLAccesAuxSignets(
	base: Base,
	contexte: ContexteDeLecture,
	identite: Identite,
	segments: SegmentsDeRangement,
	exigeEcriture = false
): Promise<Resolution<AccesAuxSignets>> {
	const rangement = await lireLeRangement(base, segments);
	if (rangement === null) return INTROUVABLE;

	if (!(await moduleSignetsActive(base, rangement.domaineId))) return INTROUVABLE;

	const { index, dossiers: arbre } = await indexerLeDomaine(base, rangement.domaineId, identite);
	const pourPerimetre =
		identite.type === 'anonyme' ? await lireLesNotesPourPerimetre(base, rangement.domaineId) : [];
	const perimetre = perimetreDeLecture(identite, index, pourPerimetre);

	if (!domaineLisible(perimetre, arbre)) return INTROUVABLE;

	const ecriture = ecritureDansLeDomaine(identite, index, arbre);
	if (exigeEcriture && !ecriture) return INTROUVABLE;

	const lisibles = await lireLesNotesDuDomaine(
		base,
		contexte,
		rangement.domaineId,
		perimetre,
		identite
	);

	return { trouve: true, ressource: { domaine: rangement.domaine, notes: lisibles, ecriture } };
}

/** Ce qu'une adresse de modification de signet rapporte. */
export interface AccesAUnSignet extends AccesAuxSignets {
	/** Le signet désigné par le dernier segment, lisible et de ce domaine. */
	readonly signet: Note;
}

/**
 * LA RÉSOLUTION D'UN SIGNET — même chemin, un cran plus loin.
 *
 * Le signet est cherché DANS l'ensemble déjà filtré par le périmètre : une note
 * hors périmètre n'y est pas, donc elle est introuvable, sans qu'aucune branche
 * ne la distingue d'une note absente. `resoudre()` de `resolution.ts` est le
 * garde-fou de sortie — il ne remplace pas le filtre de la requête, il le
 * double, et c'est ce que son propre en-tête demande.
 *
 * Le prédicat est `estSignet()` de `seeds/corpus.ts` : une note qui n'est pas
 * de type « Signet » n'est pas un signet, et `/…/signets/{id}/modifier` sur une
 * note ordinaire rapporte donc `INTROUVABLE` — pas l'éditeur de notes.
 */
export async function resoudreUnSignet(
	base: Base,
	contexte: ContexteDeLecture,
	identite: Identite,
	segments: SegmentsDeRangement,
	identifiant: string
): Promise<Resolution<AccesAUnSignet>> {
	const acces = await resoudreLAccesAuxSignets(base, contexte, identite, segments, true);
	if (!acces.trouve) return INTROUVABLE;

	const candidat = acces.ressource.notes.find((n) => n.id === identifiant);
	const resolution = resoudre(candidat, (n) => n.type === 'Signet');
	if (!resolution.trouve) return INTROUVABLE;

	return { trouve: true, ressource: { ...acces.ressource, signet: resolution.ressource } };
}

/* ═══════════════════════════════════════════════ Les vecteurs de vue ═══ */

/**
 * LE VECTEUR DE V-22 — les trois réglages de sa planche, et rien d'autre.
 *
 * Les noms sont ceux de `verif/scenarios/V-22.json` : `dom`, `droits`,
 * `c-rappel`. `droits` porte `P-09` : « lecture » efface les actions
 * d'écriture, et c'est le SERVEUR qui en décide ici, jamais le navigateur.
 *
 * `c-rappel` est laissé à `true`, sa position par défaut dans la planche. Le
 * rappel de sortie est un état de la vue que rien, dans le cahier des charges
 * comme dans `docs/routes.md`, ne fait dépendre d'une donnée : lui inventer une
 * condition serait un comblement.
 */
export function vecteurDeV22(
	domaine: Domaine,
	ecriture: boolean
): Record<string, string | boolean> {
	return { dom: domaine.nom, droits: ecriture ? 'ecriture' : 'lecture', 'c-rappel': true };
}

/**
 * LE VECTEUR DE V-23 — enveloppe « page dédiée », mode selon l'adresse.
 *
 * `env: 'page'` EST UNE LECTURE DÉCLARÉE, ET ELLE EST REMONTÉE AU RAPPORT DU
 * LOT. La planche a deux enveloppes — « boîte de dialogue » (défaut) et « page
 * dédiée » — et `V-23.svelte` le dit : « l'enveloppe n'est PAS dans l'adresse ».
 * Aucune source ne dit donc laquelle une requête directe rend. Ce qui est lu :
 * l'enveloppe « boîte de dialogue » superpose le formulaire à une page qui
 * existe déjà, et une requête directe sur l'adresse dédiée n'a rien dessous ;
 * l'autre position s'appelle « page dédiée », ce qu'est exactement une adresse
 * dédiée. Le choix est celui-là, il est déclaré, et il attend l'arbitrage.
 *
 * `recup` n'est pas posé : les trois positions de l'axe « Récupération du
 * titre » ne rendent RIEN — `V-23.svelte` le mesure sur le gel — et sont un
 * comportement temporisé, hors de tout verdict (`CLAUDE.md` §4).
 */
export function vecteurDeV23(mode: 'creation' | 'edition'): Record<string, string | boolean> {
	return { env: 'page', mode };
}

/* ═══════════════════════════════════════════════ Le contexte de requête ═ */

/**
 * LE CONTEXTE D'UNE LECTURE DE REQUÊTE — l'instant, et les seuils en vigueur.
 *
 * L'instant est un PARAMÈTRE, avec `new Date()` pour seul défaut, et c'est
 * `lecture.ts` qui l'exige : « une couche de lecture qui prendrait l'heure
 * elle-même rendrait ses résultats non reproductibles, donc non mesurables ».
 * La requête est le dernier endroit où l'horloge peut être lue sans détruire
 * cette propriété, et c'est ici qu'elle l'est — une seule fois par requête,
 * pour que deux notes de la même page ne soient pas datées de deux instants.
 *
 * Les seuils viennent de la table `parametres` par `lireSeuils()` de `T-030` :
 * `P-01` veut une seule définition de la fraîcheur, et les seuils en font
 * partie. Aucune valeur n'est écrite ici.
 */
export async function contexteDeRequete(
	base: Base,
	maintenant: Date = new Date()
): Promise<ContexteDeLecture> {
	return { maintenant, seuils: await lireSeuils(base) };
}
