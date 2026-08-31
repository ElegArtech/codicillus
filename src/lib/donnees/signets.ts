/**
 * Les signets — la résolution d'une adresse de signets, droits compris. C'est le seul point
 * où les trois adresses de `docs/routes.md` §3.3 deviennent une ressource, ou rien.
 *
 * UN SIGNET EST UNE NOTE QUI PORTE UNE ADRESSE WEB — IL N'Y A PAS DE TABLE. `RG-NOT-01` :
 * « ce n'est pas un objet séparé ». Le prédicat est `note.type === 'Signet'` ; en base, la
 * jointure sur `types_de_note.identifiant = 'signet'` et les deux colonnes
 * `signet_adresse` et `signet_ajoute_le` de `notes`.
 *
 * POURQUOI CE MODULE NE RÉUTILISE PAS `lireNotes()` : `ADR-006` interdit « toute route qui
 * reçoit une liste puis la filtre », or `lireNotes(base, contexte)` lit la table entière.
 * Le périmètre est donc INJECTÉ dans la requête ci-dessous, et `./lecture.ts` est réemployé
 * pour tout ce qui n'est pas le filtre. La FORME rendue reste `interface Note`.
 *
 * Aucune règle de droit n'est écrite ici, et la fraîcheur non plus. Toutes les issues
 * d'échec rendent `INTROUVABLE`, LE MÊME OBJET gelé (`ADR-007`, `RG-ACC-04`).
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

/**
 * Les deux segments d'adresse qui désignent le rangement, tels que
 * `univers.identifiant` et `domaines.identifiant` les portent en base. Ils sont
 * comparés à la colonne, jamais recalculés depuis le nom : l'identifiant lisible
 * est PERSISTÉ, et `RG-M12-11` le veut stable même après un renommage.
 */
export interface SegmentsDeRangement {
	readonly univers: string;
	readonly domaine: string;
}

export interface RangementDeSignets {
	readonly domaineId: string;
	readonly domaine: Domaine;
}

/**
 * Le domaine que les deux segments désignent, ou `null`. `RG-STR-02` —
 * l'identifiant d'un domaine est unique AU SEIN DE SON UNIVERS : la clause porte
 * donc sur les DEUX segments, et `domaines_identifiant_par_univers_unique` garantit
 * qu'il n'y a qu'une ligne. La forme canonique n'est jamais ambiguë.
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
 * Le module Signets est-il activé sur ce domaine ? `RG-STR-06`, `P-04`, et
 * `docs/routes.md:134` : « une route de module désactivé rend 404 V-26, pas une
 * page vide ». L'activation décide de l'existence de l'adresse.
 */
export async function moduleSignetsActive(base: Base, domaineId: string): Promise<boolean> {
	const lignes = await base
		.select({ module: modulesDeDomaine.module })
		.from(modulesDeDomaine)
		.where(and(eq(modulesDeDomaine.domaineId, domaineId), eq(modulesDeDomaine.module, 'signets')))
		.limit(1);
	return lignes.length > 0;
}

/**
 * L'arborescence du domaine et les droits explicites qui la couvrent, indexés pour
 * `resolution.ts`. L'INDEX SE BORNE AU DOMAINE, ET LE SCHÉMA LE PERMET :
 * `dossiers_parent_meme_domaine` interdit qu'un dossier ait un parent d'un autre domaine,
 * de sorte que la chaîne d'ancêtres est entièrement dans le domaine. Les droits ne sont lus
 * QUE pour le compte appelant : un anonyme n'en a pas, et charger ceux des autres exposerait
 * la table à une requête qui n'en a pas besoin.
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
 * Les notes du domaine, réduites à ce que le périmètre anonyme a besoin de savoir
 * (`RG-DRO-04`). Trois colonnes, pas une de plus : `RG-ACC-01` veut le filtrage
 * « au plus près de la donnée », et charger un titre pour décider d'un dossier
 * serait déjà trop.
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
 * Le domaine est-il lisible ? — au moins un de ses dossiers dans le périmètre. Ce n'est pas
 * une règle nouvelle, c'est `RG-DRO-02` appliquée à une page de domaine. À l'inverse, un
 * droit posé sur un seul sous-dossier ouvre bien le domaine : `RG-DRO-05` ne réserve pas
 * l'accès aux porteurs d'un droit sur la racine. Un domaine SANS dossier ne peut satisfaire
 * personne : sans dossier, pas de note, donc pas de signet.
 */
export function domaineLisible(
	perimetre: Perimetre,
	dossiersDuDomaine: readonly DossierDeLArbre[]
): boolean {
	if (perimetre.tout) return dossiersDuDomaine.length > 0;
	return dossiersDuDomaine.some((d) => perimetreContient(perimetre, d.id));
}

/**
 * Le droit de rédaction dans le domaine — `capacites().ecrireDesNotes`, sur au moins un
 * dossier. La granularité est celle du GEL : `V-22` n'a qu'un réglage `droits` pour la page
 * entière et `V-23` n'en a aucun, quand le droit est par dossier. La page répond donc à la
 * question que la page pose. `P-09` se joue ici : c'est ce booléen que le chargeur traduit
 * en `droits: 'lecture'`, et la vue n'émet alors aucune action d'écriture.
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
 * Une ligne de `notes` rendue dans la forme de `interface Note` — la même transcription que
 * `lireNotes()`, aux mêmes règles : fraîcheur sur la dernière vérification et à défaut sur
 * la modification (`RG-M06-01`), `pj` au compte RÉEL de la table, et les clés optionnelles
 * OMISES quand la colonne est nulle. Elle est écrite ici parce que `lireNotes()` n'accepte
 * aucun périmètre ; la duplication est bornée à cette fonction.
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
 * Les notes du domaine que l'appelant peut lire — LE PÉRIMÈTRE EST DANS LA CLAUSE `where`,
 * pas dans un filtre d'après-coup (`ADR-006`).
 *
 * Deux filtres se composent, et les employer séparément est le moyen le plus simple de
 * publier le corpus interne : le DOSSIER dans le périmètre (`perimetre.tout` étant réservé
 * à l'administrateur, il ne pose aucune clause) ; puis, en anonyme seulement, la NOTE —
 * publique ET publiée. Un périmètre VIDE ne produit aucune requête : `inArray` sur une liste
 * vide est une clause dégénérée selon les dialectes.
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

export interface AccesAuxSignets {
	readonly domaine: Domaine;
	readonly notes: readonly Note[];
	/** L'appelant peut-il écrire un signet dans ce domaine ? (`P-09`) */
	readonly ecriture: boolean;
}

/**
 * Le chemin unique — `ADR-007`. Quatre raisons de ne rien rapporter, un seul `INTROUVABLE`,
 * et aucune trace de la raison : les segments ne désignent aucun domaine ; le module Signets
 * est éteint ; aucun dossier n'est dans le périmètre ; `exigeEcriture` et l'appelant n'a pas
 * le droit de rédaction. `exigeEcriture` n'est pas un régime de refus séparé : le refus sort
 * par le même `return` que l'inexistence.
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

export interface AccesAUnSignet extends AccesAuxSignets {
	readonly signet: Note;
}

/**
 * La résolution d'un signet — même chemin, un cran plus loin. Le signet est cherché DANS
 * l'ensemble déjà filtré par le périmètre : une note hors périmètre n'y est pas, donc elle
 * est introuvable. Le prédicat est `estSignet()` : `/…/signets/{id}/modifier` sur une note
 * ordinaire rend `INTROUVABLE`.
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

/**
 * Le vecteur de V-22 — les trois réglages de sa planche, et rien d'autre. `droits` porte
 * `P-09` : « lecture » efface les actions d'écriture, et c'est le SERVEUR qui en décide.
 * `c-rappel` est laissé à sa position par défaut : rien ne fait dépendre le rappel de sortie
 * d'une donnée, et lui inventer une condition serait un comblement.
 */
export function vecteurDeV22(
	domaine: Domaine,
	ecriture: boolean
): Record<string, string | boolean> {
	return { dom: domaine.nom, droits: ecriture ? 'ecriture' : 'lecture', 'c-rappel': true };
}

/**
 * Le vecteur de V-23 — enveloppe « page dédiée », mode selon l'adresse.
 *
 * `env: 'page'` EST UNE LECTURE DÉCLARÉE : la planche a deux enveloppes et « l'enveloppe
 * n'est PAS dans l'adresse ». L'enveloppe « boîte de dialogue » superpose le formulaire à
 * une page qui existe déjà, et une requête directe sur l'adresse dédiée n'a rien dessous.
 * `recup` n'est pas posé : les trois positions de cet axe ne rendent RIEN.
 */
export function vecteurDeV23(mode: 'creation' | 'edition'): Record<string, string | boolean> {
	return { env: 'page', mode };
}

/**
 * Le contexte d'une lecture de requête — l'instant, et les seuils en vigueur.
 *
 * L'instant est un PARAMÈTRE, avec `new Date()` pour seul défaut : la requête est le dernier
 * endroit où l'horloge peut être lue sans rendre les résultats non reproductibles, et elle
 * l'est UNE SEULE FOIS. Les seuils viennent de `parametres` par `lireSeuils()` : `P-01` veut
 * une seule définition de la fraîcheur, et les seuils en font partie.
 */
export async function contexteDeRequete(
	base: Base,
	maintenant: Date = new Date()
): Promise<ContexteDeLecture> {
	return { maintenant, seuils: await lireSeuils(base) };
}
